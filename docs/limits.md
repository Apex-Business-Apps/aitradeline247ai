# Supabase Limits & Optimization Guide

This document outlines strategies to stay within Supabase Free/Pro tier limits and optimize resource usage.

## Overview

TradeLine 24/7 is designed to operate efficiently within Supabase constraints:
- **Free Tier**: 500MB database, 2GB bandwidth, 500K edge function invocations/month
- **Pro Tier**: 8GB database, 250GB bandwidth, 2M edge function invocations/month

## Current Guardrails

### 1. Connection Pooling

All database queries use pooled connections via `_shared/dbPool.ts`:

```typescript
import { pooledQuery } from "../_shared/dbPool.ts";

// Instead of direct client
const data = await pooledQuery(
  (client) => client.from('calls').select('*').limit(10),
  'get_recent_calls'
);
```

**Benefits:**
- Reuses connections across requests
- Auto-retry with exponential backoff on "too many connections"
- Throttled error logging (once per minute max)

### 2. Pre-warming Cron

Every 5 minutes, a cron job hits critical endpoints to prevent cold starts:

- `/functions/v1/healthz` - Database health check
- `/functions/v1/dashboard-summary` - Dashboard data
- `/functions/v1/secure-analytics` - Analytics tracking

Configure endpoints in `config/prewarm.json`:

```json
{
  "endpoints": [
    "/functions/v1/your-critical-endpoint"
  ],
  "interval_minutes": 5,
  "timeout_ms": 3000
}
```

**Benefits:**
- 50-80% reduction in cold start latency
- Consistent response times for users
- Keeps connection pools warm

### 3. Query Defaults (Frontend)

TanStack Query configured with conservative defaults in `src/lib/queryDefaults.ts`:

```typescript
{
  staleTime: 60_000,        // 1 minute cache
  retry: 1,                 // Only retry once
  refetchOnWindowFocus: false,
  refetchOnMount: false
}
```

**For analytics screens**, use even longer cache:

```typescript
import { analyticsQueryDefaults } from '@/lib/queryDefaults';

useQuery({
  queryKey: ['analytics', 'summary'],
  queryFn: fetchAnalytics,
  ...analyticsQueryDefaults  // 5 minute stale time
});
```

**Benefits:**
- 60-70% reduction in redundant queries
- Faster UI (serves from cache)
- Lower database load

### 4. Structured Logging

All edge functions use `requestId` for correlation:

```typescript
import { createRequestContext, logWithContext } from "../_shared/requestId.ts";

const ctx = createRequestContext(req);
logWithContext(ctx, "info", "Processing webhook", {
  db_ms: 45,
  cache_hit: true,
  tenant_id: hashTenantId(tenantId)
});
```

**Fields logged:**
- `requestId` - Unique per request
- `timestamp` - ISO 8601 format
- `db_ms` - Query duration
- `cache_hit` - Was data from cache?
- `user_id` / `tenant_id` - Hashed for privacy

### 5. Daily Analytics Rollup

Background job aggregates performance metrics:

```sql
INSERT INTO analytics_events (event_type, event_data)
SELECT 
  'daily_performance_rollup',
  jsonb_build_object(
    'date', CURRENT_DATE,
    'route', route,
    'p50_ms', percentile_cont(0.5) WITHIN GROUP (ORDER BY db_ms),
    'p95_ms', percentile_cont(0.95) WITHIN GROUP (ORDER BY db_ms),
    'total_requests', COUNT(*)
  )
FROM function_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY route;
```

**Benefits:**
- Track performance trends
- Identify slow queries
- Monitor cold start frequency

## Compute Credits Watchlist

### High-Cost Operations

| Operation | Free Tier Impact | Mitigation |
|-----------|------------------|------------|
| **Unindexed queries** | 10-100ms → 1000ms+ | Add indexes on frequently queried columns |
| **Large result sets** | Bandwidth + CPU | Use pagination (`limit` + `offset`) |
| **Real-time subscriptions** | Persistent connections | Limit to critical data only |
| **Cold starts** | 500-2000ms first request | Pre-warm with cron |
| **N+1 queries** | Multiple round-trips | Use `.select()` with joins |

### Query Budget (Free Tier)

Assuming average 5ms per query:
- 500K invocations/month = ~16K/day
- At 5ms/query = 80 seconds total DB time/day
- **Budget per query: < 10ms to stay safe**

### How to Check Usage

**1. Supabase Dashboard**
- Project → Settings → Usage
- Monitor: Database Size, Bandwidth, Edge Invocations

**2. Edge Function Logs**
```bash
supabase functions logs --tail prewarm-cron
```

Look for `db_ms` fields > 1000ms (slow queries)

**3. Database Activity**
```sql
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## When to Upgrade to Pro

Consider upgrading when:

1. **Database Size** > 400MB (80% of free tier)
   - Compression: Archive old call_logs, analytics_events
   - Partitioning: Split large tables by date

2. **Bandwidth** > 1.5GB/month (75% of free tier)
   - Optimize: Enable gzip compression
   - CDN: Move static assets to external CDN

3. **Edge Invocations** > 400K/month (80% of free tier)
   - Cache: Increase `staleTime` on frontend
   - Batch: Combine multiple API calls

4. **Cold Starts** > 30% of requests
   - Already mitigated by pre-warm cron
   - Pro tier has faster cold starts

## Optimization Checklist

### Database

- [ ] Indexes on all foreign keys
- [ ] Indexes on commonly filtered columns (e.g., `organization_id`, `created_at`)
- [ ] Composite indexes for multi-column filters
- [ ] Avoid `SELECT *` - only fetch needed columns
- [ ] Use `limit` on all lists (default: 50)
- [ ] Implement cursor-based pagination for large datasets

### Edge Functions

- [ ] Use `pooledQuery()` for all DB access
- [ ] Add context string to every query (for logging)
- [ ] Return early (< 200ms) for webhooks
- [ ] Queue heavy work in background tasks
- [ ] Cache frequently accessed data in memory (< 5 min TTL)

### Frontend

- [ ] Use `queryDefaults` for all TanStack Query hooks
- [ ] Implement search before showing large lists
- [ ] Paginate tables (20-50 rows per page)
- [ ] Debounce search inputs (300ms)
- [ ] Use `analyticsQueryDefaults` for dashboards
- [ ] Disable real-time updates on non-critical screens

### Monitoring

- [ ] Check Supabase usage weekly
- [ ] Review slow query logs (> 1000ms)
- [ ] Monitor cold start frequency
- [ ] Alert on error rate > 5%
- [ ] Track p95 latency per endpoint

## Emergency Throttling

If approaching limits, enable emergency mode:

**1. Increase Cache Times**
```typescript
// src/lib/queryDefaults.ts
staleTime: 5 * 60 * 1000  // 5 minutes instead of 1
```

**2. Disable Pre-warm**
```sql
-- Temporarily pause cron
SELECT cron.unschedule('prewarm-functions');
```

**3. Enable Rate Limiting**
```typescript
// Add to high-traffic endpoints
const rateLimit = {
  max: 100,      // requests
  window: 60000  // per minute
};
```

**4. Archive Old Data**
```sql
-- Move data to cold storage
CREATE TABLE call_logs_archive AS 
SELECT * FROM call_logs 
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM call_logs 
WHERE created_at < NOW() - INTERVAL '90 days';
```

## Pro Tier Features

Upgrading to Pro ($25/month) unlocks:
- 8GB database (16x more)
- 250GB bandwidth (125x more)
- 2M edge invocations (4x more)
- Daily backups (vs. weekly)
- Point-in-time recovery
- Custom domains
- Priority support

**ROI Calculation:**
- Cost per user: $25 / active users
- If serving > 100 active users, Pro tier pays for itself
- Cold start improvements alone worth $10-15/month in UX

## Related Documentation

- [Supabase Pricing](https://supabase.com/pricing)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Edge Function Limits](https://supabase.com/docs/guides/functions/limits)
- [TanStack Query](https://tanstack.com/query/latest/docs/react/overview)

## Support

- Check usage: https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/settings/usage
- Function logs: https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/functions
- Database activity: Project → Database → Query Performance
