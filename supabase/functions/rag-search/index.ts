/**
 * Supabase Edge Function (Deno)
 * Purpose: RAG search with optional language filter.
 * Notes:
 * - Uses Object.hasOwn for safe own-property checks (no-prototype-builtins compliant).
 * - Defensive JSON parsing; falls back to {} on bad input.
 */

type AnyRecord = Record<string, unknown>;

function normalizeRecord(input: unknown): AnyRecord {
  return input && typeof input === "object" ? (input as AnyRecord) : {};
}

/** Safe own-property check (modern runtimes support Object.hasOwn). */
function hasOwn(obj: AnyRecord, key: PropertyKey): boolean {
  // @ts-ignore: lib.d.ts may not include Object.hasOwn in some toolchains
  return Object.hasOwn(obj, key);
}

async function handleRagSearch(req: Request): Promise<Response> {
  const body: AnyRecord =
    (await req.json().catch(() => ({}))) ?? {};

  const filters = normalizeRecord(body.filters);
  const queryLang = (body.queryLang as string | undefined)?.trim();
  const autoLang = body.autoLang as boolean | undefined;

  // If caller didn't provide filters.lang but provided queryLang,
  // add it automatically unless autoLang === false
  if (!hasOwn(filters, "lang") && queryLang && autoLang !== false) {
    filters.lang = queryLang;
    // Minimal observability
    // eslint-disable-next-line no-console
    console.log(`[rag-search] Applied automatic language filter: ${queryLang}`);
  }

  // TODO: plug in your real search pipeline here
  const response = {
    ok: true,
    filters,
    results: [] as unknown[],
  };

  return new Response(JSON.stringify(response), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}

/** Deno / Supabase Edge entrypoint */
Deno.serve((req: Request) => handleRagSearch(req));
