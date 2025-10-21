/**
 * Supabase Edge Function (Deno)
 * Purpose: RAG answer synthesis from retrieved context.
 * Notes:
 * - Strict, defensive parsing (no runtime explosions on bad JSON).
 * - No console output (quiet CI), no ts-ignores, no prototype pitfalls.
 * - Minimal CORS support for browser calls.
 * - Stubbed "answer" generator with a clear TODO to plug your LLM.
 */

type AnyRecord = Record<string, unknown>;

type RagContextItem = {
  id?: string;
  text: string;
  score?: number;
  metadata?: AnyRecord;
};

type RagAnswerRequest = {
  question: string;
  context?: RagContextItem[];
  filters?: AnyRecord;
  lang?: string;           // optional language hint
  model?: string;          // e.g., "gpt-4o-mini" | "gpt-4.1" | etc. (your infra)
  temperature?: number;    // model param passthrough
  maxTokens?: number;      // model param passthrough
};

type RagAnswerResponse = {
  ok: true;
  answer: string;
  citations: { id?: string; snippet: string }[];
  meta: {
    context_items: number;
    lang?: string;
    model?: string;
  };
} | {
  ok: false;
  error: string;
};

// ---------- Small utilities ----------

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "content-type": "application/json",
} as const;

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...CORS_HEADERS, ...(init?.headers ?? {}) },
    status: init?.status ?? 200,
  });
}

function normalizeRecord(input: unknown): AnyRecord {
  return input && typeof input === "object" ? (input as AnyRecord) : {};
}

/** ESLint-friendly own-property check (no-prototype-builtins compliant). */
function hasOwn(obj: AnyRecord, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

async function parseRequestJSON<T = unknown>(req: Request): Promise<T | AnyRecord> {
  try {
    const j = await req.json();
    return (j ?? {}) as T;
  } catch {
    return {};
  }
}

// ---------- Core handler ----------

function synthesizeAnswer(question: string, context: RagContextItem[], lang?: string): { answer: string; citations: { id?: string; snippet: string }[] } {
  // TODO: Replace this stub with your actual LLM call (e.g., OpenAI, Vertex, etc.)
  // Strategy (for now): deterministic, safe echo using top context snippets.
  const topSnippets = context
    .slice(0, 3)
    .map((c) => (c?.text ?? "").trim())
    .filter(Boolean)
    .map((t) => (t.length > 320 ? `${t.slice(0, 317)}…` : t));

  const citations = context.slice(0, topSnippets.length).map((c, i) => ({
    id: c?.id,
    snippet: topSnippets[i],
  }));

  const langPrefix =
    lang && lang.toLowerCase().startsWith("en")
      ? ""
      : lang
      ? `[lang=${lang}] `
      : "";

  const baseAnswer =
    topSnippets.length > 0
      ? `Here’s a concise answer grounded in the retrieved context: ${topSnippets[0]}`
      : `No context was provided. Based on the question alone, ensure retrieval runs before answer synthesis.`;

  return {
    answer: `${langPrefix}${baseAnswer}`,
    citations,
  };
}

async function handleRagAnswer(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return jsonResponse({}, { status: 204 });

  if (req.method !== "POST") {
    return jsonResponse<RagAnswerResponse>({ ok: false, error: "Method not allowed. Use POST." }, { status: 405 });
  }

  const bodyRaw = await parseRequestJSON<RagAnswerRequest>(req);
  const body = normalizeRecord(bodyRaw);

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const context = Array.isArray(body.context) ? (body.context as RagContextItem[]) : [];
  const filters = normalizeRecord(body.filters);
  const lang = typeof body.lang === "string" ? body.lang.trim() : undefined;
  const model = typeof body.model === "string" ? body.model.trim() : undefined;
  // temperature & maxTokens are parsed but unused here; pass into your LLM in the TODO area if needed.

  if (!question) {
    return jsonResponse<RagAnswerResponse>(
      { ok: false, error: "Missing required field: 'question' (non-empty string)." },
      { status: 400 },
    );
  }

  // If a language hint is provided only via filters.lang, surface it
  let effectiveLang = lang;
  if (!effectiveLang && hasOwn(filters, "lang")) {
    const fLang = filters["lang"];
    if (typeof fLang === "string" && fLang.trim()) {
      effectiveLang = fLang.trim();
    }
  }

  const { answer, citations } = synthesizeAnswer(question, context, effectiveLang);

  const payload: RagAnswerResponse = {
    ok: true,
    answer,
    citations,
    meta: {
      context_items: context.length,
      lang: effectiveLang,
      model,
    },
  };

  return jsonResponse(payload, { status: 200 });
}

// ---------- Supabase Edge entrypoint ----------

Deno.serve((req: Request) => handleRagAnswer(req));
