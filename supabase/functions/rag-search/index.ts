/**
 * Supabase Edge Function (Deno)
 * Purpose: RAG search with optional language filter.
 * Notes:
 * - Uses Object.prototype.hasOwnProperty.call (no-prototype-builtins compliant).
 * - Defensive JSON parsing; falls back to {} on bad input.
 * - Pure function logic; no console output to keep lint quiet in CI.
 */

type AnyRecord = Record<string, unknown>;

function normalizeRecord(input: unknown): AnyRecord {
  return input && typeof input === "object" ? (input as AnyRecord) : {};
}

/** Safe own-property check (ESLint-friendly, no prototype calls on user objects) */
function hasOwn(obj: AnyRecord, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

async function handleRagSearch(req: Request): Promise<Response> {
  const bodyRaw = await req.json().catch(() => ({}));
  const body: AnyRecord = normalizeRecord(bodyRaw);

  const filters = normalizeRecord(body.filters);
  const queryLang = typeof body.queryLang === "string" ? body.queryLang.trim() : undefined;
  const autoLang = typeof body.autoLang === "boolean" ? body.autoLang : undefined;

  // If caller didn't provide filters.lang but provided queryLang,
  // add it automatically unless autoLang === false
  if (!hasOwn(filters, "lang") && queryLang && autoLang !== false) {
    (filters as AnyRecord).lang = queryLang;
  }

  // TODO: plug in your real search pipeline here
  const payload = {
    ok: true,
    filters,
    results: [] as unknown[],
  };

  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}

/** Deno / Supabase Edge entrypoint */
Deno.serve((req: Request) => handleRagSearch(req));

