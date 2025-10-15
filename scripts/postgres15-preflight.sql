-- =====================================================
-- PostgreSQL 15 Upgrade Preflight Checks
-- DO NOT RUN THIS IN PRODUCTION - FOR ANALYSIS ONLY
-- Run manually before scheduling actual upgrade
-- =====================================================

-- 1. Check current PostgreSQL version
SELECT version();

-- 2. Check database size (ensure enough disk space)
SELECT 
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;

-- 3. Check for deprecated features that need migration
-- List of functions using deprecated syntax
SELECT 
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND (
    pg_get_functiondef(p.oid) LIKE '%without time zone%'
    OR pg_get_functiondef(p.oid) LIKE '%WITH OIDS%'
  );

-- 4. Check for tables with OIDs (deprecated in PG12+)
SELECT 
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND tablename NOT LIKE 'pg_%'
ORDER BY schemaname, tablename;

-- 5. Check for large tables that might slow upgrade
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- 6. Check for invalid indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND NOT indisvalid
ORDER BY schemaname, tablename;

-- 7. Check for custom operators or types
SELECT 
  n.nspname AS schema_name,
  t.typname AS type_name,
  t.typtype AS type_kind
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND t.typtype NOT IN ('b', 'p')
ORDER BY n.nspname, t.typname;

-- 8. Check for statistics objects
SELECT 
  schemaname,
  tablename,
  attname AS column_name,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND (n_distinct < -0.5 OR correlation < 0.5)
ORDER BY schemaname, tablename;

-- 9. Check for long-running transactions (should be none before upgrade)
SELECT 
  pid,
  usename,
  application_name,
  state,
  now() - xact_start AS duration,
  query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
  AND state != 'idle'
ORDER BY duration DESC;

-- 10. Check for replication lag (if applicable)
SELECT 
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  sync_state,
  pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
FROM pg_stat_replication;

-- 11. Check for unused indexes (consider dropping before upgrade)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;

-- 12. Check for tables without primary keys
SELECT 
  n.nspname AS schema_name,
  c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conrelid = c.oid 
      AND contype = 'p'
  )
ORDER BY n.nspname, c.relname;

-- 13. Check for foreign key constraints without indexes
SELECT 
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
  AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = tc.table_schema
      AND tablename = tc.table_name
      AND indexdef LIKE '%' || kcu.column_name || '%'
  )
ORDER BY tc.table_schema, tc.table_name;

-- 14. Estimate upgrade downtime (rough calculation)
SELECT 
  'Total DB Size' AS metric,
  pg_size_pretty(sum(pg_database_size(datname))) AS value,
  'Estimated 5-10 minutes per GB' AS note
FROM pg_database
WHERE datistemplate = false

UNION ALL

SELECT 
  'Total Tables' AS metric,
  count(*)::text AS value,
  'More tables = longer upgrade' AS note
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')

UNION ALL

SELECT 
  'Total Indexes' AS metric,
  count(*)::text AS value,
  'Indexes are rebuilt during upgrade' AS note
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');

-- 15. Pre-upgrade checklist output
SELECT 
  '✓ Run VACUUM ANALYZE before upgrade' AS checklist_item
UNION ALL
SELECT '✓ Take full database backup'
UNION ALL
SELECT '✓ Stop all application connections'
UNION ALL
SELECT '✓ Verify backup is restorable'
UNION ALL
SELECT '✓ Schedule maintenance window'
UNION ALL
SELECT '✓ Test upgrade on staging first'
UNION ALL
SELECT '✓ Have rollback plan ready'
UNION ALL
SELECT '✓ Monitor disk space (need 2x current size)'
UNION ALL
SELECT '✓ Document all custom extensions'
UNION ALL
SELECT '✓ Notify team of maintenance window';

-- =====================================================
-- POST-UPGRADE VERIFICATION QUERIES
-- Run these AFTER upgrade completes
-- =====================================================

-- Verify new version
-- SELECT version();

-- Verify all tables accessible
-- SELECT count(*) FROM pg_tables WHERE schemaname = 'public';

-- Verify all functions working
-- SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace;

-- Verify RLS policies intact
-- SELECT count(*) FROM pg_policies WHERE schemaname = 'public';

-- Run ANALYZE to update statistics
-- ANALYZE;

-- =====================================================
-- NOTES:
-- 1. Schedule upgrade during low-traffic window
-- 2. Expected downtime: 5-15 minutes for typical DB
-- 3. Keep old version available for 24h rollback window
-- 4. Monitor logs for deprecation warnings post-upgrade
-- 5. Run full regression tests after upgrade
-- =====================================================
