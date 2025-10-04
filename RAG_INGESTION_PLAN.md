# RAG Ingestion Plan

## 1. Chunking Strategy

**Parameters:**
- Target chunk size: ~800 tokens
- Overlap: ~120 tokens (15% overlap for context continuity)
- Sentence-aware: Never split mid-sentence; prefer paragraph boundaries when possible
- chunk_index: Sequential ordering (0, 1, 2...) per source_id

**Implementation approach:**
- Use sentence tokenization (split on `.`, `!`, `?` with whitespace)
- Aggregate sentences until ~800 tokens, then flush chunk
- Start next chunk with last ~120 tokens of previous chunk
- Store actual token_count in rag_chunks.token_count for analytics

---

## 2. Embeddings Strategy

**Model:**
- Provider: OpenAI `text-embedding-3-small` (1536 dimensions)
- Single model for all content types (consistent search space)
- Normalized vectors (L2 norm = 1.0) stored in rag_embeddings.norm

**Embedding process:**
- One embedding per chunk (1:1 chunk_id → embedding relationship)
- Batch embeddings in groups of 100 for API efficiency
- Store creation timestamp for tracking
- Metadata: { "model": "text-embedding-3-small", "version": "1" }

---

## 3. Upsert Rules

**Idempotency:**
- Use `rag_upsert_source()` RPC with external_id as unique key
- Compare source.updated_at before re-processing:
  - If DB updated_at ≥ incoming updated_at → skip (already current)
  - If DB updated_at < incoming updated_at → delete old chunks/embeddings, re-chunk, re-embed

**Deletion cascade:**
- Delete chunks → cascades to embeddings (FK constraint)
- Atomicity: wrap in transaction (source update + chunk deletion + new chunks + new embeddings)

**Error handling:**
- Log failures to analytics_events with severity='error'
- Mark source with meta.last_ingestion_error and timestamp
- Retry failed sources on next scheduled run

---

## 4. Initial Source Types

**Priority 1 (MVP):**

1. **transcript** (rag_source_type='transcript')
   - Source: `public.transcripts` table
   - external_id: transcript.call_sid
   - title: "Call {call_sid} - {created_at}"
   - text: transcript.content
   - uri: null (internal only)
   - meta: { "org_id": org_id, "archived": archived, "priority": priority }

2. **email** (rag_source_type='email')
   - Source: Future email integration (placeholder structure)
   - external_id: email message_id
   - title: email.subject
   - text: email.body (strip HTML, keep plain text)
   - uri: email.thread_url
   - meta: { "from": sender, "to": recipients, "date": sent_at }

3. **doc** (rag_source_type='doc')
   - Source: User-uploaded documents (PDF, DOCX via storage)
   - external_id: storage object path
   - title: filename
   - text: extracted plain text (via parse service)
   - uri: storage.objects.public_url
   - meta: { "file_type": extension, "size_bytes": size }

**Later expansion:**
- `faq` (from public.faqs table)
- `web` (scraped external URLs)

---

## 5. Scheduling Strategy

**Nightly batch ingestion:**
- Cron job: Every day at 2:00 AM UTC
- Process: Scan all source tables, upsert sources where updated_at > last_processed
- Targets: All transcript, email, doc records
- Execution: Supabase Edge Function triggered via pg_cron
- Logging: Record ingestion stats (sources_processed, chunks_created, embeddings_created, errors)

**Real-time on-write (debounced):**
- Trigger: Database trigger on `public.transcripts` INSERT/UPDATE
- Debounce: 30-second window (collect multiple rapid updates)
- Targets: Only new/updated transcripts and emails
- Execution: Queue event → Edge Function processes queue every 30s
- Use case: Immediate searchability for new call transcripts

**Manual trigger:**
- Admin UI button: "Re-index all sources"
- Deletes all rag_chunks + rag_embeddings, re-processes everything
- Use case: Model version upgrades, schema changes

---

## 6. Verification Checklist (Dry-Run)

### Per-Source Type: 10 Items

**For `transcript`:**
1. ✅ Select 10 sample transcripts with varying lengths (short, medium, long)
2. ✅ Chunk each into ~800 token segments with 120 token overlap
3. ✅ Verify no mid-sentence splits (manual review of 3 random chunks)
4. ✅ Confirm chunk_index sequence (0, 1, 2...)
5. ✅ Generate embeddings for all chunks (batch of 100)
6. ✅ Verify embedding dimensions = 1536
7. ✅ Confirm L2 norm ≈ 1.0 for all vectors
8. ✅ Upsert sources with call_sid as external_id
9. ✅ Test duplicate upsert (same call_sid) → skip if updated_at unchanged
10. ✅ Query rag_stats() → verify counts match expected (sources, chunks, embeddings)

**For `email`:**
1. ✅ Mock 10 email objects with subject, body, sender, recipients
2. ✅ Strip HTML tags, keep plain text only
3. ✅ Chunk email bodies (same chunking rules)
4. ✅ Verify meta.from and meta.to populated correctly
5. ✅ Confirm external_id = message_id (unique constraint works)
6. ✅ Generate embeddings for email chunks
7. ✅ Test search: query for "meeting" → returns relevant email chunks
8. ✅ Test duplicate email upsert → skip if updated_at unchanged
9. ✅ Verify cascade deletion (delete source → chunks + embeddings removed)
10. ✅ Query rag_stats() → email counts correct

**For `doc`:**
1. ✅ Upload 10 sample PDFs/DOCX to storage bucket
2. ✅ Extract plain text using document parser
3. ✅ Chunk extracted text (same chunking rules)
4. ✅ Verify meta.file_type and meta.size_bytes populated
5. ✅ Confirm external_id = storage object path (unique constraint works)
6. ✅ Generate embeddings for document chunks
7. ✅ Test search: query for "invoice" → returns relevant doc chunks
8. ✅ Test re-upload same file → skip if storage updated_at unchanged
9. ✅ Verify uri = public storage URL (accessible if bucket is public)
10. ✅ Query rag_stats() → doc counts correct

---

## Next Steps

Once this plan is approved:
1. Implement chunking utility (sentence-aware, 800 tokens, 120 overlap)
2. Create ingestion Edge Function (calls OpenAI embeddings API)
3. Set up nightly cron job (pg_cron + Edge Function)
4. Build debounced trigger for real-time transcript ingestion
5. Create admin UI for manual re-indexing

---

**INGESTION PLAN READY**
