-- STAGING-ONLY PROPOSAL. DO NOT RUN ON PRODUCTION WITHOUT REVIEW.
-- This additive RPC does not replace bootstrap_current_user() or alter existing company rows.
-- The caller must be authenticated. Company creation and owner membership are atomic.
-- Idempotent for a user who already belongs to a company.
create or replace function public.create_my_company(p_company_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_company uuid;
  v_name text := pg_catalog.btrim(pg_catalog.coalesce(p_company_name,''));
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if pg_catalog.length(v_name) < 2 or pg_catalog.length(v_name) > 100 then
    raise exception 'Company name must be 2 to 100 characters';
  end if;
  -- Serializes simultaneous onboarding attempts for the same authenticated user.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));
  select cm.company_id into v_company
    from public.company_members cm
    where cm.user_id = v_uid
    order by cm.created_at, cm.company_id
    limit 1;
  if v_company is not null then
    -- Never silently choose a company when the user has multiple memberships.
    if (select pg_catalog.count(distinct cm.company_id)
        from public.company_members cm where cm.user_id = v_uid) > 1 then
      raise exception 'Choose an existing company workspace explicitly';
    end if;
    return pg_catalog.jsonb_build_object('company_id',v_company,'status','already_member');
  end if;
  -- Confirm the account's email before using it for invitation matching.
  -- Do not create an independent company from an unverified account.
  if not exists (
    select 1 from auth.users u
    where u.id = v_uid
      and u.email_confirmed_at is not null
      and u.email is not null
      and pg_catalog.btrim(u.email) <> ''
  ) then
    raise exception 'Verify your email before creating a company workspace';
  end if;
  -- A pending invitation should be accepted via the existing invitation flow,
  -- rather than creating a workspace that may strand the invited user.
  if exists (
    select 1 from public.company_invitations ci
    where pg_catalog.lower(ci.email) = pg_catalog.lower(pg_catalog.coalesce((select email from auth.users where id=v_uid),''))
      and ci.status = 'pending'
  ) then
    raise exception 'Pending company invitation: accept your invitation first';
  end if;
  insert into public.companies(name) values(v_name) returning id into v_company;
  insert into public.company_members(company_id,user_id,role)
    values(v_company,v_uid,'owner');
  return pg_catalog.jsonb_build_object('company_id',v_company,'status','created');
end;
$$;
revoke all on function public.create_my_company(text) from public;
revoke all on function public.create_my_company(text) from anon;
grant execute on function public.create_my_company(text) to authenticated;

-- Follow-up migration (separate review): update frontend bootstrap to call this
-- only when a signed-in user chooses to create a new workspace.
-- Do not enable a public signup flow until two-tenant isolation tests pass.
