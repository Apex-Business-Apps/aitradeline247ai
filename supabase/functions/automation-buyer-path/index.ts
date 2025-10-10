import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "info@tradeline247ai.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Payload = { event_type: 'after_signup'|'after_payment'; user_id?: string };

async function fetchProfile(user_id: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,email,trial_ends_at,subscription_status&id=eq.${user_id}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
  });
  const [row] = await r.json();
  return row;
}

async function alreadySent(user_id: string, event_type: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/buyer_path_sends?select=id&user_id=eq.${user_id}&event_type=eq.${event_type}&limit=1`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
  });
  const j = await r.json();
  return Array.isArray(j) && j.length > 0;
}

async function markSent(user_id: string, event_type: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/buyer_path_sends`, {
    method: "POST",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type":"application/json" },
    body: JSON.stringify({ user_id, event_type })
  });
}

async function sendEmail(to: string) {
  const html = await (await fetch(new URL('../../../emails/buyer-path.html', import.meta.url))).text();
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type":"application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject: "Choose your go-live path", html })
  });
  if (!r.ok) throw new Error(`Resend error ${r.status}`);
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    // Admin/service only (JWT from service or a server-side caller)
    const auth = req.headers.get('authorization') || '';
    if (!auth.includes(SB_KEY.slice(0,12))) return new Response('Forbidden', { status: 403 });

    const { event_type, user_id } = await req.json() as Payload;
    if (!event_type || !user_id) return new Response('Bad Request', { status: 400 });

    const profile = await fetchProfile(user_id);
    if (!profile?.email) return new Response('No email', { status: 400 });

    // Gates: only during trial for after_signup; only when active for after_payment
    if (event_type === 'after_signup') {
      if (!profile.trial_ends_at || new Date(profile.trial_ends_at) < new Date()) {
        return new Response('Trial not active', { status: 204 });
      }
    }
    if (event_type === 'after_payment') {
      if (profile.subscription_status !== 'active') {
        return new Response('Not active', { status: 204 });
      }
    }

    // Idempotency
    if (await alreadySent(profile.id, event_type)) {
      return new Response('Already sent', { status: 200 });
    }

    await sendEmail(profile.email);
    await markSent(profile.id, event_type);

    return new Response(JSON.stringify({ ok:true }), { status: 200, headers: { "Content-Type":"application/json" }});
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e) }), { status: 500, headers: { "Content-Type":"application/json" }});
  }
});
