/* eslint-disable @typescript-eslint/no-explicit-any */
// Supabase Edge Function / Node runtime compatible
// Purpose: handle RAG answer generation with optional language filter
// Fix: avoid `no-prototype-builtins` by using Object.hasOwn

type Filters = Record<string, any>;

function hasOwn<T extends object>(obj: T, key: PropertyKey): boolean {
  return Object.hasOwn(obj as object, key);
}

function normalizeFilters(raw: unknown): Filters {
  if (raw && typeof raw === 'object') return raw as Filters;
  return {};
}

export async function handleRagAnswer(body: any) {
  const filters = normalizeFilters(body?.filters);

  // Add language filter if not explicitly set (unless explicitly disabled)
  const shouldFilterByLanguage =
    !hasOwn(filters, 'lang') && body?.queryLang && body?.autoLang !== false;

  if (shouldFilterByLanguage) {
    filters.lang = body.queryLang;
    // eslint-disable-next-line no-console
    console.log(`Applied automatic language filter: ${body.queryLang}`);
  }

  // TODO: keep your existing answer generation logic here.
  return {
    ok: true,
    filters,
    answer: null,
  };
}

// Minimal HTTP wrapper for Supabase functions (Deno or Node-compatible)
export default async function handler(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const data = await handleRagAnswer(body);
    return new Response(JSON.stringify(data), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('rag-answer error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    });
  }
}
