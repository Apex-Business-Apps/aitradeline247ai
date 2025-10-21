# RAG Retrieval API Contract

## Overview

Two endpoints for semantic search and question-answering over ingested content.

**Authentication:** All endpoints require valid JWT (user-scoped).  
**PII Protection:** Results filtered by user's organization access (RLS enforced).  
**Rate Limiting:** 60 requests/minute per user (429 if exceeded).

---

## Endpoint 1: POST /api/rag/search

**Purpose:** Raw semantic search – returns ranked chunks with snippets and citations.

### Request Schema

```json
{
  "query_text": "string (required, 1-500 chars)",
  "top_k": "integer (optional, default=8, range: 1-50)",
  "filters": {
    "source_type": "string (optional, enum: transcript|email|doc|faq|web)",
    "lang": "string (optional, e.g., 'en', 'fr')",
    "org_id": "uuid (optional, filters by organization)",
    "date_from": "ISO8601 timestamp (optional)",
    "date_to": "ISO8601 timestamp (optional)"
  }
}
```

### Response Schema

```json
{
  "status": "success",
  "query_text": "string (echoed from request)",
  "results": [
    {
      "chunk_id": "uuid",
      "source_id": "uuid",
      "score": 0.87, // cosine similarity (0.0-1.0)
      "snippet": "string (first 200 chars of chunk.text)",
      "source_type": "transcript|email|doc|faq|web",
      "source_title": "string (from rag_sources.title)",
      "source_uri": "string|null (external link if available)",
      "meta": {
        // Source-specific metadata (e.g., call_sid, org_id, date)
      },
      "rank": 1 // 1-based ranking
    }
    // ... up to top_k results
  ],
  "total_found": 8, // number of results returned
  "processing_time_ms": 142
}
```

### Behavior

1. **Embed query_text:**
   - Call OpenAI `text-embedding-3-small` API
   - Generate 1536-dim vector (same model as ingestion)

2. **Execute rag_match RPC:**
   - Pass query_vector, top_k, filters JSON
   - RLS automatically filters by user's org membership

3. **Rank and return:**
   - Order by score descending (already done by RPC)
   - Include snippet (first 200 chars), source metadata
   - No LLM call – raw retrieval only

4. **Error handling:**
   - 400: Invalid query_text (empty, too long)
   - 401: Missing/invalid JWT
   - 429: Rate limit exceeded
   - 500: Embedding API failure or DB error

---

## Endpoint 2: POST /api/rag/answer

**Purpose:** LLM-generated answer with retrieval-augmented context and citations.

### Request Schema

```json
{
  "query_text": "string (required, 1-500 chars)",
  "top_k": "integer (optional, default=8, range: 1-50)",
  "filters": {
    "source_type": "string (optional)",
    "lang": "string (optional)",
    "org_id": "uuid (optional)",
    "date_from": "ISO8601 timestamp (optional)",
    "date_to": "ISO8601 timestamp (optional)"
  }
}
```

### Response Schema

**Case 1: Sufficient context (confidence ≥ threshold)**

```json
{
  "status": "success",
  "query_text": "string (echoed from request)",
  "answer": {
    "text": "string (LLM-generated answer, 100-500 words)",
    "confidence": "high|medium", // based on avg score of top chunks
    "model": "google/gemini-2.5-flash",
    "generated_at": "ISO8601 timestamp"
  },
  "citations": [
    {
      "source_id": "uuid",
      "source_type": "transcript|email|doc|faq|web",
      "source_title": "string",
      "source_uri": "string|null",
      "snippet": "string (relevant excerpt from chunk)",
      "relevance_score": 0.87, // cosine similarity
      "meta": {}
    }
    // Deduplicated by source_id (max 5 citations)
  ],
  "context_used": {
    "chunks_retrieved": 8,
    "unique_sources": 3,
    "avg_relevance": 0.81
  },
  "processing_time_ms": 1847
}
```

**Case 2: Insufficient context (confidence < threshold)**

```json
{
  "status": "insufficient_context",
  "query_text": "string (echoed from request)",
  "answer": {
    "text": "I don't have enough relevant information to answer this question confidently. Here are the most relevant sources I found:",
    "confidence": "low",
    "model": null,
    "generated_at": "ISO8601 timestamp"
  },
  "citations": [
    // Same structure as Case 1, but no LLM-generated answer
    // Just return top snippets as fallback
  ],
  "context_used": {
    "chunks_retrieved": 8,
    "unique_sources": 2,
    "avg_relevance": 0.42 // Below threshold
  },
  "processing_time_ms": 203
}
```

### Behavior

1. **Embed query_text:**
   - Same as /search endpoint

2. **Execute rag_match RPC:**
   - Retrieve top_k chunks (default 8)

3. **Deduplication by source_id:**
   - Group chunks by source_id
   - Keep highest-scoring chunk per source
   - Limit to top 5 unique sources for citations

4. **Compute confidence:**
   - `avg_relevance = mean(scores of top 5 chunks)`
   - Thresholds:
     - **high**: avg_relevance ≥ 0.75
     - **medium**: 0.60 ≤ avg_relevance < 0.75
     - **low**: avg_relevance < 0.60

5. **Generate answer (if confidence ≥ medium):**
   - Build context window from top chunks (max 3000 tokens)
   - Prompt template:
     ```
     Context:
     [chunk 1 text]
     [chunk 2 text]
     ...
     
     Question: {query_text}
     
     Instructions: Answer the question based ONLY on the context above. If the context doesn't contain enough information, say so. Keep the answer concise (100-500 words). Cite sources by mentioning their titles.
     ```
   - Call Lovable AI Gateway: `google/gemini-2.5-flash`
   - Parse response, extract answer text

6. **Fallback (if confidence = low):**
   - Skip LLM call
   - Return "insufficient context" message
   - Include top snippets as citations for user to review manually

7. **Error handling:**
   - 400: Invalid query_text
   - 401: Missing/invalid JWT
   - 429: Rate limit exceeded (either our API or Lovable AI Gateway)
   - 500: Embedding API failure, DB error, or LLM timeout

---

## Confidence/Threshold Rules

### Threshold Logic

```
avg_relevance = mean(top 5 chunks' cosine similarity scores)

if avg_relevance >= 0.75:
  confidence = "high"
  action = "Generate LLM answer"

else if avg_relevance >= 0.60:
  confidence = "medium"
  action = "Generate LLM answer (but flag as medium confidence)"

else: # avg_relevance < 0.60
  confidence = "low"
  action = "Skip LLM, return fallback message + snippets only"
```

### Rationale

- **High (≥0.75):** Strong semantic match; LLM has good context
- **Medium (0.60-0.75):** Moderate match; LLM can attempt answer but user should verify
- **Low (<0.60):** Weak match; don't waste LLM tokens on hallucination risk; show raw snippets instead

### Tuning

- These thresholds are configurable in edge function env vars:
  - `RAG_CONFIDENCE_HIGH_THRESHOLD=0.75`
  - `RAG_CONFIDENCE_MEDIUM_THRESHOLD=0.60`
- Can be adjusted based on real-world testing

---

## Authentication & Authorization

**JWT Verification:**
- Both endpoints require `Authorization: Bearer <JWT>` header
- Extract user_id from JWT via `auth.uid()`

**RLS Enforcement:**
- `rag_match()` RPC filters results by user's organization membership automatically
- User can only see chunks from sources their org owns (via `is_org_member()` check)

**PII Protection:**
- Snippets may contain PII (e.g., customer names from transcripts)
- Only users with proper org access can see this data
- Admin-only endpoints for bulk exports (separate contract)

---

## Rate Limiting

**Per-User Limits:**
- 60 requests/minute per authenticated user
- Implemented via Supabase edge function rate limiter
- Returns 429 with headers:
  ```
  X-RateLimit-Limit: 60
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1704067200 (Unix timestamp)
  ```

**Lovable AI Gateway Limits:**
- Gemini models are currently free (until Oct 6, 2025)
- After that, enforce token budgets per org
- Handle 429 from AI Gateway gracefully → return 503 to user

---

## Edge Function Structure

**Endpoints:**
- `/functions/v1/rag-search` → implements POST /api/rag/search
- `/functions/v1/rag-answer` → implements POST /api/rag/answer

**Secrets Required:**
- `LOVABLE_API_KEY` (auto-provisioned for Gemini access)
- (Optional) `OPENAI_API_KEY` if switching embedding provider later

**CORS:**
- Allow all origins (`*`) for now (tighten in production)
- Standard headers: `authorization, x-client-info, apikey, content-type`

---

## Example Requests

### /api/rag/search

```bash
curl -X POST https://PROJECT_REF.supabase.co/functions/v1/rag-search \
  -H "Authorization: Bearer USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "query_text": "What did the customer say about pricing?",
    "top_k": 5,
    "filters": {
      "source_type": "transcript",
      "date_from": "2025-01-01T00:00:00Z"
    }
  }'
```

### /api/rag/answer

```bash
curl -X POST https://PROJECT_REF.supabase.co/functions/v1/rag-answer \
  -H "Authorization: Bearer USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "query_text": "Summarize customer feedback on our new feature",
    "top_k": 10,
    "filters": {
      "source_type": "email"
    }
  }'
```

---

## Next Steps

1. Implement edge functions for both endpoints
2. Add input validation (Zod schemas)
3. Integrate OpenAI embeddings API
4. Integrate Lovable AI Gateway (Gemini)
5. Add rate limiting middleware
6. Build admin UI for testing (query playground)

---

**API CONTRACT READY FOR IMPLEMENTATION**

