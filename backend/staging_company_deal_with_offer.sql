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
  if p_name is null or length(pg_catalog.btrim(p_name)) = 0 then
    raise exception 'Deal name is required';
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
