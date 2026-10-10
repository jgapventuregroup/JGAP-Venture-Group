-- STAGING ONLY. Additive, read-only workspace listing RPC.
-- Authenticated users can list only their own company memberships.
create or replace function public.list_my_companies()
returns table(company_id uuid, company_name text, member_role text)
language sql
security invoker
stable
set search_path = ''
as $$
  select cm.company_id, c.name, cm.role
  from public.company_members as cm
  join public.companies as c on c.id = cm.company_id
  where cm.user_id = (select auth.uid())
  order by cm.created_at, cm.company_id;
$$;
revoke all on function public.list_my_companies() from public;
revoke all on function public.list_my_companies() from anon;
grant execute on function public.list_my_companies() to authenticated;
-- Existing company_members and companies SELECT RLS policies remain authoritative.
