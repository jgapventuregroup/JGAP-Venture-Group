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
