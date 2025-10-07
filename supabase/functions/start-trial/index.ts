import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StartTrialRequest {
  company?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing Supabase env vars");
    return new Response(JSON.stringify({ ok: false, error: "Server misconfiguration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      console.error("Auth error", userErr);
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;
    const body = (await req.json().catch(() => ({}))) as StartTrialRequest;

    // 1) Check existing membership (idempotent)
    const { data: existingMembership, error: membershipErr } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (membershipErr) {
      console.error("membershipErr", membershipErr);
    }

    let orgId: string | null = existingMembership?.org_id ?? null;

    if (!orgId) {
      // Determine company name
      const companyName =
        body.company ||
        (user.user_metadata?.display_name as string | undefined) ||
        "My Business";

      // Create organization
      const { data: orgInsert, error: orgErr } = await supabase
        .from("organizations")
        .insert({ name: companyName, settings: {} })
        .select("id")
        .single();

      if (orgErr || !orgInsert) {
        console.error("orgErr", orgErr);
        return new Response(JSON.stringify({ ok: false, error: "Failed to create organization" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      orgId = orgInsert.id as string;

      // Create membership (role defaults to 'member')
      const { error: insertMemberErr } = await supabase
        .from("organization_members")
        .insert({ org_id: orgId, user_id: user.id, role: "member" });
      if (insertMemberErr) {
        // If membership already exists concurrently, proceed
        console.warn("insertMemberErr", insertMemberErr);
      }
    }

    // 2) Ensure subscription trial exists and is valid (idempotent)
    const { data: existingSub, error: subErr } = await supabase
      .from("subscriptions")
      .select("id, current_period_end, plan, status")
      .eq("org_id", orgId)
      .maybeSingle();

    if (subErr) {
      console.error("subErr", subErr);
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    if (!existingSub) {
      const { error: createSubErr } = await supabase.from("subscriptions").insert({
        org_id: orgId,
        plan: "free",
        status: "active",
        stripe_customer_id: null,
        current_period_end: endsAt.toISOString(),
      });
      if (createSubErr) {
        console.error("createSubErr", createSubErr);
        return new Response(JSON.stringify({ ok: false, error: "Failed to create trial" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const currentEnd = existingSub.current_period_end ? new Date(existingSub.current_period_end as string) : null;
      if (!currentEnd || currentEnd < now) {
        const { error: updateSubErr } = await supabase
          .from("subscriptions")
          .update({
            plan: "free",
            status: "active",
            current_period_end: endsAt.toISOString(),
          })
          .eq("id", existingSub.id);
        if (updateSubErr) {
          console.error("updateSubErr", updateSubErr);
          return new Response(JSON.stringify({ ok: false, error: "Failed to extend trial" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, orgId, endsAt: endsAt.toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("start-trial unhandled error", e);
    return new Response(JSON.stringify({ ok: false, error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
