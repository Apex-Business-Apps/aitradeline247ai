-- Report tables without RLS enabled or with zero policies
select t.schemaname, t.tablename, t.rolname, t.relrowsecurity as rls_enabled,
       count(p.*) as policy_count
from pg_catalog.pg_tables t
left join pg_policies p on p.schemaname=t.schemaname and p.tablename=t.tablename
where t.schemaname not in ('pg_catalog','information_schema')
group by 1,2,3,4
having (not t.relrowsecurity) or count(p.*)=0
order by 1,2;