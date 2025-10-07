import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Ensure the given user has an organization membership and an active trial.
 * Idempotent: safe to call repeatedly. Returns orgId when available/created.
 */
export async function ensureMembership(user: User): Promise<string | null> {
  try {
    // 1) Check existing membership (client-side RLS allows self view)
    const { data: membership, error: memErr } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memErr) {
      // Non-fatal: proceed to function for idempotent ensure
      console.warn("ensureMembership: membership check warning", memErr);
    }

    if (membership?.org_id) {
      return membership.org_id as string;
    }

    // 2) Call edge function to create org + 14-day trial (idempotent server-side)
    const company = (user.user_metadata?.display_name as string | undefined) || undefined;
    const { data, error } = await supabase.functions.invoke("start-trial", {
      body: { company },
    });

    if (error) {
      console.error("ensureMembership: start-trial error", error);
      return null;
    }

    return (data?.orgId as string) ?? null;
  } catch (e) {
    console.error("ensureMembership: unexpected error", e);
    return null;
  }
}
