import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface MembershipResult {
  orgId: string | null;
  error?: string;
}

/**
 * Ensure the given user has an organization membership and an active trial.
 * Idempotent: safe to call repeatedly. Returns orgId when available/created.
 */
export async function ensureMembership(user: User): Promise<MembershipResult> {
  try {
    // 1) Check existing membership (client-side RLS allows self view)
    const { data: membership, error: memErr } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (memErr) {
      // Non-fatal: proceed to function for idempotent ensure
      console.warn("ensureMembership: membership check warning", memErr);
    }

    if (membership?.org_id) {
      return { orgId: membership.org_id as string };
    }

    // 2) Call edge function to create org + 14-day trial (idempotent server-side)
    const company = (user.user_metadata?.display_name as string | undefined) || undefined;
    const { data, error } = await supabase.functions.invoke("start-trial", {
      body: { company },
    });

    if (error) {
      console.error("ensureMembership: start-trial error", error);
      return { orgId: null, error: error.message || "Couldn't create trial" };
    }

    if (!data?.ok) {
      const msg = data?.error || "Couldn't create trial";
      console.error("ensureMembership: start-trial failed", msg);
      return { orgId: null, error: msg };
    }

    return { orgId: (data?.orgId as string) ?? null };
  } catch (e: any) {
    console.error("ensureMembership: unexpected error", e);
    return { orgId: null, error: e?.message || "Unexpected error during trial setup" };
  }
}

