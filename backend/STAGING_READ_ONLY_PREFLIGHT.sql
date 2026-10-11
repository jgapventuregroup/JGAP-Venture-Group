-- JGAP staging-only inspection. READ ONLY: no DDL, DML or permissions changes.
-- Run only after verifying current project ID is qfszapteuxuogoselprp.
-- NEVER run against production sfsyphmnzxaplundaljy.
-- This is an inspection aid, NOT a tenant-isolation test.
-- If any expected item is missing, stop before applying migrations.

-- 1. Required tables, RLS and FORCE RLS status
select c.relname as table_name, c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as force_rls
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in ('companies','company_members','company_invitations','deals')
  and c.relkind in ('r','p')
order by c.relname;

-- 2. Every company/deal RLS policy: roles, commands and predicates
select schemaname,tablename,policyname,roles,cmd,qual,with_check
from pg_catalog.pg_policies
where schemaname='public'
  and tablename in ('companies','company_members','company_invitations','deals')
order by tablename,policyname;

-- 3. All functions that might grant access to companies or deals.
-- Review SECURITY DEFINER entries especially carefully.
select n.nspname as schema_name,p.proname as function_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
       case when p.prosecdef then 'DEFINER' else 'INVOKER' end as security_mode,
       pg_catalog.pg_get_userbyid(p.proowner) as owner,
       pg_catalog.pg_get_functiondef(p.oid) as definition
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','jgap_private')
  and (p.proname like '%company%' or p.proname like '%deal%'
       or p.proname like '%bootstrap%' or p.proname like '%member%')
order by n.nspname,p.proname;

-- 4. Confirm immutable company ownership trigger, if installed.
select t.tgname as trigger_name,c.relname as table_name,
       pg_catalog.pg_get_triggerdef(t.oid) as definition,
       t.tgenabled as enabled
from pg_catalog.pg_trigger t
join pg_catalog.pg_class c on c.oid=t.tgrelid
join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='deals' and not t.tgisinternal
order by t.tgname;

-- 5. Table grants by role, including anonymous access.
select table_name,grantee,privilege_type
from information_schema.role_table_grants
where table_schema='public'
  and table_name in ('companies','company_members','company_invitations','deals')
order by table_name,grantee,privilege_type;

-- 6. Key deal columns, types, defaults and nullability.
select table_name,column_name,data_type,udt_name,is_nullable,column_default
from information_schema.columns
where table_schema='public'
  and table_name in ('companies','company_members','company_invitations','deals')
order by table_name,ordinal_position;

-- 7. Explicit presence check for proposed scoped RPCs.
with expected(name) as (values
 ('create_my_company'),('list_my_companies'),('list_company_deals'),
 ('create_company_deal'),('create_company_deal_with_offer'),
 ('get_company_deal'),('update_company_deal'),('delete_company_deal'))
select e.name as expected_rpc,
       count(p.oid) as installed_overloads
from expected e
left join pg_catalog.pg_proc p on p.proname=e.name
  and p.pronamespace = (select oid from pg_catalog.pg_namespace where nspname='public')
group by e.name order by e.name;

-- Do not interpret presence alone as correctness: review exact definitions,
-- grants, signed-in actor behavior and cross-company access separately.
