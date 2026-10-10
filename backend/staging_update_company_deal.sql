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
  if p_patch is null or pg_catalog.jsonb_typeof(p_patch) <> 'object' then
    raise exception 'Patch must be a JSON object';
  end if;
  select array_agg(k order by k) into v_columns
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
