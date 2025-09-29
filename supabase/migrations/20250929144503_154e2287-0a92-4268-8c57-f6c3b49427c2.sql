-- Check for views with security_barrier or security_definer properties
SELECT 
    schemaname, 
    viewname, 
    viewowner,
    definition
FROM pg_views 
WHERE schemaname = 'public';