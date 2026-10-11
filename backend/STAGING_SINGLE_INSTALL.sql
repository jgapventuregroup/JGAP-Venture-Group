-- JGAP STAGING ONLY. Verify project qfszapteuxuogoselprp before running.
-- Single transaction; never run on production.
BEGIN;
DO $$ BEGIN IF current_database() <> 'postgres' THEN RAISE EXCEPTION 'Unexpected database'; END IF; END $$;
-- SOURCE: backend/staging_list_my_companies.sql
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


-- SOURCE: backend/staging_company_deals.sql
-- STAGING ONLY: explicit-tenant deal creation and listing.
-- This is additive; existing RPCs remain unchanged until the frontend is migrated.
-- Callers pass a company ID and membership is checked in the database.
create or replace function public.create_company_deal(
  p_company_id uuid,
  p_name text,
  p_property_type text default 'single_family',
  p_status text default 'lead',
  p_purchase_price numeric default 0,
  p_down_payment numeric default 0,
  p_interest_rate numeric default 0,
  p_loan_term_years integer default 30,
  p_closing_costs numeric default 0,
  p_rehab_cost numeric default 0,
  p_monthly_rent numeric default 0,
  p_vacancy_rate numeric default 0,
  p_monthly_operating_expenses numeric default 0,
  p_other_monthly_income numeric default 0,
  p_notes text default null
)
returns public.deals
language plpgsql
security invoker
set search_path = ''
as $$
declare v_deal public.deals;
begin
  if (select auth.uid()) is null or p_company_id is null
     or not public.is_company_member(p_company_id) then
    raise exception 'Not authorized for selected workspace';
  end if;
  if not exists (
    select 1 from public.company_members cm
    where cm.company_id = p_company_id
      and cm.user_id = (select auth.uid())
      and cm.role in ('owner', 'admin', 'editor')
  ) then
    raise exception 'Workspace role cannot create deals';
  end if;
  if p_name is null or pg_catalog.length(pg_catalog.btrim(p_name)) < 1 then
    raise exception 'Deal name is required';
  end if;
  if p_status is null or pg_catalog.btrim(p_status) = '' then
    raise exception 'Deal status is required';
  end if;
  if p_property_type is null or pg_catalog.btrim(p_property_type) = '' then
    raise exception 'Property type is required';
  end if;
  if p_purchase_price is null or p_down_payment is null or p_interest_rate is null
     or p_loan_term_years is null or p_closing_costs is null or p_rehab_cost is null
     or p_monthly_rent is null or p_vacancy_rate is null
     or p_monthly_operating_expenses is null or p_other_monthly_income is null then
    raise exception 'Required deal financial inputs cannot be null';
  end if;
  if p_purchase_price < 0 or p_down_payment < 0 or p_closing_costs < 0
     or p_rehab_cost < 0 or p_monthly_rent < 0
     or p_monthly_operating_expenses < 0 or p_other_monthly_income < 0 then
    raise exception 'Deal amounts cannot be negative';
  end if;
  if p_interest_rate < 0 or p_interest_rate > 100
     or p_vacancy_rate < 0 or p_vacancy_rate > 100 then
    raise exception 'Interest and vacancy rates must be between 0 and 100';
  end if;
  if p_loan_term_years < 0 or p_loan_term_years > 100 then
    raise exception 'Loan term must be between 0 and 100 years';
  end if;
  insert into public.deals (
    company_id,name,status,property_type,purchase_price,down_payment,interest_rate,
    loan_term_years,closing_costs,rehab_cost,monthly_rent,vacancy_rate,
    monthly_operating_expenses,other_monthly_income,notes
  ) values (
    p_company_id,pg_catalog.btrim(p_name),p_status,p_property_type,p_purchase_price,
    p_down_payment,p_interest_rate,p_loan_term_years,p_closing_costs,p_rehab_cost,
    p_monthly_rent,p_vacancy_rate,p_monthly_operating_expenses,p_other_monthly_income,p_notes
  ) returning * into v_deal;
  return v_deal;
end;
$$;

create or replace function public.list_company_deals(p_company_id uuid)
returns setof public.deals
language sql
stable
security invoker
set search_path = ''
as $$
  select d.* from public.deals d
  where d.company_id = p_company_id
    and (select auth.uid()) is not null
    and public.is_company_member(p_company_id)
  order by d.created_at desc;
$$;

revoke all on function public.create_company_deal(uuid,text,text,text,numeric,numeric,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric,text) from public,anon;
grant execute on function public.create_company_deal(uuid,text,text,text,numeric,numeric,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric,text) to authenticated;
revoke all on function public.list_company_deals(uuid) from public,anon;
grant execute on function public.list_company_deals(uuid) to authenticated;

-- Staging prerequisite: verify authenticated role has appropriate table GRANTs.
-- RLS on public.deals must remain enabled. Never replace with a permissive policy.


-- SOURCE: backend/staging_company_deal_with_offer.sql
-- STAGING DRAFT ONLY. Not deployed. Preserve every Deal Analyzer offer input.
-- Explicit company scope; SECURITY INVOKER preserves table grants and RLS.
-- Returns deal UUID, matching the existing frontend's creation response shape.
create or replace function public.create_company_deal_with_offer(
  p_company_id uuid,
  p_name text,
  p_property_type text default 'single_family',
  p_status text default 'lead',
  p_purchase_price numeric default 0,
  p_down_payment numeric default 0,
  p_interest_rate numeric default 0,
  p_loan_term_years integer default 30,
  p_closing_costs numeric default 0,
  p_rehab_cost numeric default 0,
  p_monthly_rent numeric default 0,
  p_vacancy_rate numeric default 0,
  p_monthly_operating_expenses numeric default 0,
  p_other_monthly_income numeric default 0,
  p_notes text default null,
  p_asking_price numeric default null,
  p_target_offer_price numeric default null,
  p_offer_notes text default null,
  p_target_cap_rate numeric default null,
  p_target_cash_on_cash numeric default null,
  p_target_monthly_cash_flow numeric default null,
  p_target_dscr numeric default null,
  p_offer_earnest_money numeric default null,
  p_offer_due_diligence_days integer default null,
  p_offer_closing_days integer default null,
  p_offer_financing_type text default null,
  p_offer_contingencies text default null,
  p_property_address text default null,
  p_property_county text default null,
  p_seller_name text default null,
  p_offer_state text default null,
  p_offer_template text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare v_id uuid;
begin
  if (select auth.uid()) is null or p_company_id is null
     or not public.is_company_member(p_company_id) then
    raise exception 'Not authorized for selected workspace';
  end if;
  if not exists (
    select 1 from public.company_members cm
    where cm.company_id = p_company_id
      and cm.user_id = (select auth.uid())
      and cm.role in ('owner', 'admin', 'editor')
  ) then
    raise exception 'Workspace role cannot create deals';
  end if;
  if p_name is null or pg_catalog.length(pg_catalog.btrim(p_name)) = 0 then
    raise exception 'Deal name is required';
  end if;
  if p_status is null or pg_catalog.btrim(p_status) = '' then
    raise exception 'Deal status is required';
  end if;
  if p_property_type is null or pg_catalog.btrim(p_property_type) = '' then
    raise exception 'Property type is required';
  end if;
  -- NULL bypasses numeric comparisons, so reject missing required values first.
  if p_purchase_price is null or p_down_payment is null
     or p_interest_rate is null or p_loan_term_years is null
     or p_closing_costs is null or p_rehab_cost is null
     or p_monthly_rent is null or p_vacancy_rate is null
     or p_monthly_operating_expenses is null or p_other_monthly_income is null then
    raise exception 'Required deal financial inputs cannot be null';
  end if;
  -- Creation must enforce the same core financial constraints as edits.
  if p_purchase_price < 0 or p_down_payment < 0 or p_closing_costs < 0
     or p_rehab_cost < 0 or p_monthly_rent < 0
     or p_monthly_operating_expenses < 0 or p_other_monthly_income < 0
     or p_asking_price < 0 or p_target_offer_price < 0
     or p_offer_earnest_money < 0 then
    raise exception 'Deal amounts cannot be negative';
  end if;
  if p_interest_rate < 0 or p_interest_rate > 100
     or p_vacancy_rate < 0 or p_vacancy_rate > 100 then
    raise exception 'Interest and vacancy rates must be between 0 and 100';
  end if;
  if p_loan_term_years < 0 or p_loan_term_years > 100
     or p_offer_due_diligence_days < 0 or p_offer_closing_days < 0 then
    raise exception 'Deal timeline values are outside permitted bounds';
  end if;
  insert into public.deals (
    company_id,name,property_type,status,purchase_price,down_payment,interest_rate,
    loan_term_years,closing_costs,rehab_cost,monthly_rent,vacancy_rate,
    monthly_operating_expenses,other_monthly_income,notes,asking_price,target_offer_price,
    offer_notes,target_cap_rate,target_cash_on_cash,target_monthly_cash_flow,target_dscr,
    offer_earnest_money,offer_due_diligence_days,offer_closing_days,offer_financing_type,
    offer_contingencies,property_address,property_county,seller_name,offer_state,offer_template
  ) values (
    p_company_id,pg_catalog.btrim(p_name),p_property_type,p_status,p_purchase_price,
    p_down_payment,p_interest_rate,p_loan_term_years,p_closing_costs,p_rehab_cost,
    p_monthly_rent,p_vacancy_rate,p_monthly_operating_expenses,p_other_monthly_income,
    p_notes,p_asking_price,p_target_offer_price,p_offer_notes,p_target_cap_rate,
    p_target_cash_on_cash,p_target_monthly_cash_flow,p_target_dscr,p_offer_earnest_money,
    p_offer_due_diligence_days,p_offer_closing_days,p_offer_financing_type,
    p_offer_contingencies,p_property_address,p_property_county,p_seller_name,
    p_offer_state,p_offer_template
  ) returning id into v_id;
  return v_id;
end;
$$;

-- Explicit signature prevents accidental PUBLIC execution privileges.
revoke all on function public.create_company_deal_with_offer(
 uuid,text,text,text,numeric,numeric,numeric,integer,numeric,numeric,numeric,
 numeric,numeric,numeric,text,numeric,numeric,text,numeric,numeric,numeric,
 numeric,numeric,integer,integer,text,text,text,text,text,text,text
) from public,anon;
grant execute on function public.create_company_deal_with_offer(
 uuid,text,text,text,numeric,numeric,numeric,integer,numeric,numeric,numeric,
 numeric,numeric,numeric,text,numeric,numeric,text,numeric,numeric,numeric,
 numeric,numeric,integer,integer,text,text,text,text,text,text,text
) to authenticated;

-- Prerequisites: authenticated INSERT privilege and matching company-membership
-- RLS INSERT policy on public.deals; test with two fake accounts before rollout.


-- SOURCE: backend/staging_get_company_deal.sql
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


-- SOURCE: backend/staging_update_company_deal.sql
-- STAGING ONLY: safe explicit-workspace update for existing deals.
-- Prefer a single JSON patch to avoid an ever-expanding argument list.
-- IMPORTANT: do not deploy until verified with fake users and database RLS.
create or replace function public.update_company_deal(
  p_company_id uuid,
  p_deal_id uuid,
  p_patch jsonb
)
returns public.deals
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_deal public.deals;
  v_columns text[];
  v_column text;
  v_sql text;
  v_exists boolean;
  v_set text := '';
  v_allowed constant text[] := array[
    'name','status','property_type','purchase_price','down_payment','interest_rate',
    'loan_term_years','closing_costs','rehab_cost','monthly_rent','vacancy_rate',
    'monthly_operating_expenses','other_monthly_income','notes','asking_price',
    'target_offer_price','offer_notes','target_cap_rate','target_cash_on_cash',
    'target_monthly_cash_flow','target_dscr','offer_earnest_money',
    'offer_due_diligence_days','offer_closing_days','offer_financing_type',
    'offer_contingencies','property_address','property_county','seller_name',
    'offer_state','offer_template','units','arv','holding_months',
    'monthly_holding_costs','selling_cost_percent','financing_costs',
    'projected_sale_price','loan_structure'
  ];
begin
  if (select auth.uid()) is null or p_company_id is null
    or not public.is_company_member(p_company_id) then
    raise exception 'Not authorized for selected workspace';
  end if;
  -- Membership alone is insufficient for writes: viewers are read-only.
  if not exists (
    select 1 from public.company_members cm
    where cm.company_id = p_company_id
      and cm.user_id = (select auth.uid())
      and cm.role in ('owner', 'admin', 'editor')
  ) then
    raise exception 'Workspace role cannot edit deals';
  end if;
  if p_patch is null or pg_catalog.jsonb_typeof(p_patch) <> 'object' then
    raise exception 'Patch must be a JSON object';
  end if;
  select pg_catalog.array_agg(k order by k) into v_columns
  from pg_catalog.jsonb_object_keys(p_patch) as k;
  if v_columns is null or pg_catalog.cardinality(v_columns) = 0 then
    raise exception 'Patch must not be empty';
  end if;
  foreach v_column in array v_columns loop
    if not (v_column = any(v_allowed)) then
      raise exception 'Field not editable: %', v_column;
    end if;
    -- Column identifiers come only from the fixed allowlist.
    v_set := v_set || case when v_set = '' then '' else ', ' end ||
      pg_catalog.format('%I = (pg_catalog.jsonb_populate_record(null::public.deals, $1)).%I',v_column,v_column);
  end loop;
  select exists (select 1 from public.deals d where d.id = p_deal_id and d.company_id = p_company_id) into v_exists;
  if not v_exists then
    raise exception 'Deal not found in selected workspace';
  end if;
  -- Required analyzer fields must not be erased by JSON null patches.
  foreach v_column in array array['purchase_price','down_payment','interest_rate',
    'loan_term_years','closing_costs','rehab_cost','monthly_rent',
    'vacancy_rate','monthly_operating_expenses','other_monthly_income'] loop
    if p_patch ? v_column and p_patch->v_column = 'null'::jsonb then
      raise exception 'Required deal input cannot be null: %', v_column;
    end if;
  end loop;
  -- Reject edits to the deal name that would create an empty display label.
  if p_patch ? 'name' and (p_patch->>'name' is null or pg_catalog.btrim(p_patch->>'name') = '') then
    raise exception 'Deal name is required';
  end if;
  -- Reject invalid negative amounts. Cast errors also reject malformed numeric text.
  -- The numeric list is limited to amounts that cannot be negative; metrics such
  -- as cash flow and financing rates have separate domain requirements.
  foreach v_column in array array['purchase_price','asking_price','target_offer_price',
    'down_payment','closing_costs','rehab_cost','monthly_rent',
    'monthly_operating_expenses','other_monthly_income','arv','financing_costs',
    'monthly_holding_costs','projected_sale_price','offer_earnest_money'] loop
    if p_patch ? v_column and p_patch->>v_column is not null
       and (p_patch->>v_column)::numeric < 0 then
      raise exception '% cannot be negative', v_column;
    end if;
  end loop;
  -- Keep rate and period inputs within reasonable bounds.
  if p_patch ? 'vacancy_rate' and p_patch->>'vacancy_rate' is not null
     and ((p_patch->>'vacancy_rate')::numeric < 0 or (p_patch->>'vacancy_rate')::numeric > 100) then
    raise exception 'Vacancy rate must be between 0 and 100';
  end if;
  if p_patch ? 'loan_term_years' and p_patch->>'loan_term_years' is not null
     and ((p_patch->>'loan_term_years')::integer < 0 or (p_patch->>'loan_term_years')::integer > 100) then
    raise exception 'Loan term must be between 0 and 100 years';
  end if;
  if p_patch ? 'interest_rate' and p_patch->>'interest_rate' is not null
     and ((p_patch->>'interest_rate')::numeric < 0 or (p_patch->>'interest_rate')::numeric > 100) then
    raise exception 'Interest rate must be between 0 and 100';
  end if;
  -- Integer quantities must be nonnegative; a unit count cannot be zero.
  foreach v_column in array array['units','holding_months',
    'offer_due_diligence_days','offer_closing_days'] loop
    if p_patch ? v_column and p_patch->>v_column is not null
       and (p_patch->>v_column)::integer < 0 then
      raise exception '% cannot be negative', v_column;
    end if;
  end loop;
  if p_patch ? 'units' and p_patch->>'units' is not null
     and (p_patch->>'units')::integer = 0 then
    raise exception 'Units must be greater than zero';
  end if;
  if p_patch ? 'selling_cost_percent' and p_patch->>'selling_cost_percent' is not null
     and ((p_patch->>'selling_cost_percent')::numeric < 0 or (p_patch->>'selling_cost_percent')::numeric > 100) then
    raise exception 'Selling cost percent must be between 0 and 100';
  end if;
  -- Never accept SQL JSON null for fields required by the Analyzer.
  -- Explicit JSON null is permitted for optional offer fields only.
  if p_patch ? 'status' and (p_patch->>'status' is null
     or pg_catalog.btrim(p_patch->>'status') = '') then
    raise exception 'Deal status is required';
  end if;
  if p_patch ? 'property_type' and (p_patch->>'property_type' is null
     or pg_catalog.btrim(p_patch->>'property_type') = '') then
    raise exception 'Property type is required';
  end if;
  v_sql := 'update public.deals set ' || v_set ||
    ' where id = $2 and company_id = $3 returning *';
  execute v_sql into v_deal using p_patch,p_deal_id,p_company_id;
  if v_deal.id is null then
    raise exception 'Deal not found in selected workspace';
  end if;
  return v_deal;
end;
$$;

revoke all on function public.update_company_deal(uuid,uuid,jsonb) from public,anon;
grant execute on function public.update_company_deal(uuid,uuid,jsonb) to authenticated;

-- Requires authenticated UPDATE privileges, and a company-scoped RLS UPDATE
-- policy with both USING and WITH CHECK. Confirm JSON null semantics in staging.


-- SOURCE: backend/staging_delete_company_deal.sql
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


-- SOURCE: backend/staging_create_my_company.sql
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
  -- SECURITY DEFINER functions must not accept a forged session role.
  if (select auth.role()) is distinct from 'authenticated' then
    raise exception 'Authenticated session required';
  end if;
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
    where pg_catalog.lower(pg_catalog.btrim(ci.email)) = (
      select pg_catalog.lower(pg_catalog.btrim(u.email))
      from auth.users u where u.id = v_uid
    )
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


-- SOURCE: backend/staging_prevent_deal_reassignment.sql
-- STAGING ONLY. REVIEW AND TEST BEFORE EXECUTION.
-- Preserve tenant ownership even when a user has editor access in two workspaces.
-- This trigger intentionally rejects all company_id reassignment, including by admins.
-- The trigger function lives in a private schema and is not a public RPC.
-- Any future transfer workflow must be designed as a separate audited operation.
create or replace function jgap_private.prevent_deal_company_reassignment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.company_id is distinct from old.company_id then
    raise exception 'Deal company cannot be changed';
  end if;
  return new;
end;
$$;

revoke all on function jgap_private.prevent_deal_company_reassignment() from public,anon,authenticated;
-- Trigger invocation uses the table trigger mechanism, not direct RPC EXECUTE.

drop trigger if exists prevent_deal_company_reassignment on public.deals;
create trigger prevent_deal_company_reassignment
before update of company_id on public.deals
for each row
execute function jgap_private.prevent_deal_company_reassignment();

-- Integration tests required:
-- 1. Same-company owner/editor edits to other fields succeed.
-- 2. Direct UPDATE company_id to another company fails even for dual-company owner.
-- 3. UPDATE company_id to the existing value succeeds.
-- 4. Viewer and unrelated company member cannot edit.
-- 5. No production deployment without review.
-- 6. Verify trigger existence with pg_trigger and that its function resides in jgap_private.
-- 7. Verify the authenticated role cannot disable triggers or change table ownership.

COMMIT;
