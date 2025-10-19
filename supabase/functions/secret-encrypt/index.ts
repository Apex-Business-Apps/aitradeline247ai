import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * AES-GCM encryption/decryption for org integration secrets
 * 
 * Operations:
 * - encrypt: Store a new secret (returns last4 only)
 * - decrypt: Retrieve plaintext secret (service workflows only)
 * - list: Get all secrets with last4 (UI display)
 * 
 * Security:
 * - Uses AES-256-GCM (authenticated encryption)
 * - Key from env: ORG_INTEGRATION_AES_KEY (32 bytes)
 * - Random IV per encryption (16 bytes)
 * - Audit logging for all operations
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const AES_KEY_HEX = Deno.env.get("ORG_INTEGRATION_AES_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !AES_KEY_HEX) {
    console.error("Missing env vars");
    return new Response(JSON.stringify({ ok: false, error: "Server misconfiguration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate AES key (must be 64 hex chars = 32 bytes)
  if (AES_KEY_HEX.length !== 64) {
    console.error("Invalid AES key length");
    return new Response(JSON.stringify({ ok: false, error: "Invalid encryption key" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;
    const body = await req.json();
    const { operation, org_id, provider, key_name, secret_value } = body;

    // Verify admin role
    const { data: roleData, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleErr || roleData?.role !== "admin") {
      return new Response(JSON.stringify({ ok: false, error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify org membership
    const { data: memberData, error: memberErr } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .single();

    if (memberErr || !memberData) {
      return new Response(JSON.stringify({ ok: false, error: "Not a member of organization" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert hex key to bytes
    const keyBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      keyBytes[i] = parseInt(AES_KEY_HEX.substr(i * 2, 2), 16);
    }

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );

    // ========== OPERATION: ENCRYPT ==========
    if (operation === "encrypt") {
      if (!provider || !key_name || !secret_value) {
        return new Response(JSON.stringify({ ok: false, error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate random IV (16 bytes for GCM)
      const iv = crypto.getRandomValues(new Uint8Array(16));

      // Encrypt
      const encoder = new TextEncoder();
      const plaintext = encoder.encode(secret_value);
      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        plaintext
      );

      // Get last 4 chars for UI
      const last_four = secret_value.slice(-4);

      // Store in DB
      const { error: insertErr } = await supabase
        .from("encrypted_org_secrets")
        .upsert(
          {
            organization_id: org_id,
            provider,
            key_name,
            encrypted_value: new Uint8Array(ciphertext),
            iv,
            last_four,
            created_by: user.id,
          },
          { onConflict: "organization_id,provider,key_name" }
        );

      if (insertErr) {
        console.error("DB insert error", insertErr);
        return new Response(JSON.stringify({ ok: false, error: "Failed to store secret" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Audit log
      await supabase.from("data_access_audit").insert({
        user_id: user.id,
        accessed_table: "encrypted_org_secrets",
        access_type: "secret_encrypted",
      });

      return new Response(
        JSON.stringify({ ok: true, provider, key_name, last_four }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== OPERATION: DECRYPT ==========
    if (operation === "decrypt") {
      if (!provider || !key_name) {
        return new Response(JSON.stringify({ ok: false, error: "Missing provider or key_name" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch encrypted secret
      const { data: secretData, error: secretErr } = await supabase
        .from("encrypted_org_secrets")
        .select("encrypted_value, iv")
        .eq("organization_id", org_id)
        .eq("provider", provider)
        .eq("key_name", key_name)
        .single();

      if (secretErr || !secretData) {
        return new Response(JSON.stringify({ ok: false, error: "Secret not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: secretData.iv },
        cryptoKey,
        secretData.encrypted_value
      );

      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decrypted);

      // High-severity audit log
      await supabase.from("data_access_audit").insert({
        user_id: user.id,
        accessed_table: "encrypted_org_secrets",
        access_type: "secret_decrypted",
      });

      await supabase.from("security_alerts").insert({
        alert_type: "secret_plaintext_access",
        user_id: user.id,
        event_data: { provider, key_name, org_id },
        severity: "high",
      });

      return new Response(
        JSON.stringify({ ok: true, secret_value: plaintext }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== OPERATION: LIST ==========
    if (operation === "list") {
      const { data: secrets, error: listErr } = await supabase
        .from("encrypted_org_secrets")
        .select("id, provider, key_name, last_four, created_at, updated_at")
        .eq("organization_id", org_id);

      if (listErr) {
        console.error("List error", listErr);
        return new Response(JSON.stringify({ ok: false, error: "Failed to list secrets" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Audit log
      await supabase.from("data_access_audit").insert({
        user_id: user.id,
        accessed_table: "encrypted_org_secrets",
        access_type: "secret_list_masked",
      });

      return new Response(
        JSON.stringify({ ok: true, secrets }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ ok: false, error: "Invalid operation" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("secret-encrypt error", e);
    return new Response(JSON.stringify({ ok: false, error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

