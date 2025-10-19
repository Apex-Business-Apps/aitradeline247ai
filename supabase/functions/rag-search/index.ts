/* 
  Supabase Edge Function (Deno compatible)
  Purpose: RAG search with optional language filter
  Lint fix: avoid `no-prototype-builtins` by using Object.hasOwn
*/

type AnyRecord = Record<string, unknown>;

function normalizeFilters(input: unknown): AnyRecord {
  return input && typeof input === 'object' ? (input as AnyRecord) : {};
}

function hasOwn(obj: AnyRecord, key: PropertyKey): boolean {
  // Safe own-property check; no direct .hasOwnProperty calls
  // Use Object.hasOwn when available (Node 20+ / modern runtimes)
  // Fallback would be: Object.prototype.hasOwnProperty.call(obj, key)
  // but Supabase Deno supports Object.hasOwn
  // @ts-ignore - TS lib may not know older targets
  return Object.hasOwn(obj, key);
}

async function handleRagSearch(req: Request): Promise<Response> {
  const body: AnyRecord =
    (await req
      .json()
      .catch(() => ({}))) ?? {};

  const filters = normalizeFilters(body.filters);
  const queryLang = body.queryLang as string | undefined;
  const autoLang = body.autoLang as boolean | undefined;

  // Add language filter if not explicitly set (unless explicitly disabled)
  const shouldFilterByLanguage = !hasOwn(filters, 'lang') && !!queryLang && autoLang !== false;

  if (shouldFilterByLanguage && queryLang) {
    filters.lang = queryLang;
    // keep log for observability in CI; replace with your logger if needed
    // eslint-disable-next-line no-console
    console.log(`Applied automatic language filter: ${queryLang}`);
  }

  // TODO: plug in your real search pipeline here and return results
  const response = {
    ok: true,
    filters,
    results: [] as unknown[],
  };

  return new Response(JSON.stringify(response), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  });
}

 apexbusiness-systems-patch-1
// Deno entrypoint (Supabase Edge Functions)
Deno.serve((req: Request) => handleRagSearch(req));
=======
        main
