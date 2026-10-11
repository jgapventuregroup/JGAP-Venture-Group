-- STAGING ONLY: explicit-workspace lookup for one deal.
-- No production deployment until tested with two unrelated users and RLS.
-- Unlike legacy unscoped lookups, both company ID and deal ID are required.
create or replace function public.get_company_deal(
  p_company_id uuid,
  p_deal_id uuid
)
returns setof public.deals
language sql
stable
security invoker
set search_path = ''
as $$
  select d.*
  from public.deals d
  where d.company_id = p_company_id
    and d.id = p_deal_id
    and (select auth.uid()) is not null
    and public.is_company_member(p_company_id);
$$;

revoke all on function public.get_company_deal(uuid,uuid) from public,anon;
grant execute on function public.get_company_deal(uuid,uuid) to authenticated;

-- SECURITY INVOKER means underlying SELECT grants and deals RLS still apply.
-- Returns zero rows when a deal does not exist or cannot be accessed.
