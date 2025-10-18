// supabase/functions/rag-search/index.ts
// Node 20+ compatible, no-prototype-builtins safe

import type { VercelRequest, VercelResponse } from '@vercel/node';

type AnyObject = Record<string, unknown>;

function normalizeFilters(input: unknown): AnyObject {
  if (input && typeof input === 'object') return input as AnyObject;
  return {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = (req.method === 'POST' ? req.body : {}) ?? {};
    const filters = normalizeFilters((body as AnyObject).filters);

    // Add language filter if not explicitly set (unless explicitly disabled)
    const shouldFilterByLanguage =
      !Object.hasOwn(filters, 'lang') &&
      (body as AnyObject)?.queryLang &&
      (body as AnyObject)?.autoLang !== false;

    if (shouldFilterByLanguage) {
      (filters as AnyObject).lang = (body as AnyObject).queryLang;
      console.log(`Applied automatic language filter: ${(body as AnyObject).queryLang}`);
    }

    // TODO: your real search logic here
    return res.status(200).json({
      ok: true,
      filters,
      results: [],
    });
  } catch (err) {
    console.error('rag-search error', err);
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
}
