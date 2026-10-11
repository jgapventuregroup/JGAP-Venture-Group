-- STAGING ONLY: delete a deal within an explicitly selected company.
-- Must not be deployed until role-based write authorization and fake-user
-- integration tests have passed. The current production RLS permits any member
-- to delete company deals; this function intentionally does not widen access.
create or replace function public.delete_company_deal(
  p_company_id uuid,
  p_deal_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_deleted boolean := false;
begin
  if (select auth.uid()) is null
    or p_company_id is null
    or p_deal_id is null
    or not public.is_company_member(p_company_id) then
    raise exception 'Not authorized for selected workspace';
  end if;

  -- A second role check prevents viewers from deleting through this RPC,
  -- even before role-aware RLS is deployed. RLS remains authoritative.
  if not exists (
    select 1 from public.company_members cm
    where cm.company_id = p_company_id
      and cm.user_id = (select auth.uid())
      and cm.role in ('owner', 'admin', 'editor')
  ) then
    raise exception 'Workspace role cannot delete deals';
  end if;

  delete from public.deals d
  where d.company_id = p_company_id
    and d.id = p_deal_id
  returning true into v_deleted;

  return pg_catalog.coalesce(v_deleted, false);
end;
$$;

revoke all on function public.delete_company_deal(uuid,uuid) from public,anon;
grant execute on function public.delete_company_deal(uuid,uuid) to authenticated;

-- Do not use until older SECURITY DEFINER delete RPCs are audited and replaced.
-- Deletion is irreversible without backups: UI should require confirmation.
