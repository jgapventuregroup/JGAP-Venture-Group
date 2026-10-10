'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const load = name => fs.readFileSync(path.join(__dirname, '..', 'backend', name), 'utf8');

test('company creation is authenticated and serialized', () => {
  const sql = load('staging_create_my_company.sql');
  assert.ok(sql.includes('auth.uid()'));
  assert.ok(sql.includes('pg_advisory_xact_lock'));
  assert.ok(sql.includes("values(v_company,v_uid,'owner')"));
  assert.ok(sql.includes('from anon'));
});

test('company listing uses caller permissions', () => {
  const sql = load('staging_list_my_companies.sql');
  assert.ok(sql.includes('security invoker'));
  assert.ok(sql.includes('cm.user_id = (select auth.uid())'));
  assert.ok(sql.includes('from anon'));
});

test('deal operations enforce selected company', () => {
  const sql = load('staging_company_deals.sql');
  assert.ok(sql.includes('public.is_company_member(p_company_id)'));
  assert.ok(sql.includes('d.company_id = p_company_id'));
  assert.ok(sql.includes('security invoker'));
});

test('SQL draft does not contain hardcoded legacy company or production credentials', () => {
  for (const name of ['staging_create_my_company.sql','staging_list_my_companies.sql','staging_company_deals.sql']) {
    const sql = load(name);
    assert.ok(!sql.includes('JGAP Venture Group LLC'));
    assert.ok(!sql.includes('service_role'));
    assert.ok(!sql.includes('disable row level security'));
  }
});

test('workspace creation uses a database transaction and rejects pending invitations', () => {
  const sql = load('staging_create_my_company.sql');
  assert.ok(sql.includes('status = \'pending\''));
  assert.ok(sql.includes('insert into public.companies'));
  assert.ok(sql.includes('insert into public.company_members'));
  assert.ok(sql.includes('already_member'));
});

test('deal creation binds inserted deal to selected workspace', () => {
  const sql = load('staging_company_deals.sql');
  assert.ok(sql.includes('p_company_id,pg_catalog.btrim(p_name)'));
  assert.ok(sql.includes('Not authorized for selected workspace'));
  assert.ok(sql.includes('revoke all on function public.create_company_deal'));
});

test('offer-aware deal creation preserves every existing analyzer input', () => {
  const sql = load('staging_company_deal_with_offer.sql');
  const fields = [
    'p_asking_price','p_target_offer_price','p_offer_notes','p_target_cap_rate',
    'p_target_cash_on_cash','p_target_monthly_cash_flow','p_target_dscr',
    'p_offer_earnest_money','p_offer_due_diligence_days','p_offer_closing_days',
    'p_offer_financing_type','p_offer_contingencies','p_property_address',
    'p_property_county','p_seller_name','p_offer_state','p_offer_template'
  ];
  for (const field of fields) assert.ok(sql.includes(field), field);
  assert.ok(sql.includes('returns uuid'));
  assert.ok(sql.includes('security invoker'));
  assert.ok(sql.includes('public.is_company_member(p_company_id)'));
  assert.ok(sql.includes('return v_id;'));
  assert.ok(sql.includes('from public,anon'));
});

test('deal edits are limited to explicit company and allowlisted columns', () => {
  const sql = load('staging_update_company_deal.sql');
  assert.ok(sql.includes('public.is_company_member(p_company_id)'));
  assert.ok(sql.includes('where id = $2 and company_id = $3'));
  assert.ok(sql.includes('v_column = any(v_allowed)'));
  assert.ok(sql.includes("jsonb_typeof(p_patch) <> 'object'"));
  assert.ok(sql.includes('Deal not found in selected workspace'));
  assert.ok(sql.includes('security invoker'));
  assert.ok(sql.includes('from public,anon'));
  for (const field of ['company_id','id','created_at','qualification_score']) {
    const match = sql.match(/v_allowed constant text\[\] := array\[([\s\S]*?)\];/);
    assert.ok(match);
    assert.ok(!match[1].includes("'" + field + "'"), field);
  }
});

test('deal edits reject empty names and preserve Analyzer update fields', () => {
  const sql = load('staging_update_company_deal.sql');
  assert.ok(sql.includes("p_patch ? 'name'"));
  assert.ok(sql.includes("pg_catalog.btrim(p_patch->>'name') = ''"));
  for (const field of [
    'units','arv','holding_months','monthly_holding_costs','selling_cost_percent',
    'financing_costs','projected_sale_price','loan_structure','asking_price',
    'target_offer_price','offer_notes','offer_template'
  ]) {
    const allowed = sql.match(/v_allowed constant text\[\] := array\[([\s\S]*?)\];/);
    assert.ok(allowed && allowed[1].includes("'" + field + "'"), field);
  }
});

test('restricted-search-path update qualifies JSON and formatting helpers', () => {
  const sql = load('staging_update_company_deal.sql');
  for (const fn of ['pg_catalog.jsonb_typeof','pg_catalog.jsonb_object_keys',
    'pg_catalog.jsonb_populate_record','pg_catalog.format','pg_catalog.cardinality']) {
    assert.ok(sql.includes(fn), fn);
  }
});

test('offer creation execute grants exactly match the declared SQL signature', () => {
  const sql = load('staging_company_deal_with_offer.sql');
  const declaration = sql.match(/create or replace function public\.create_company_deal_with_offer\(([\s\S]*?)\)\s*returns uuid/);
  assert.ok(declaration);
  const types = declaration[1].split('\n').map(x => x.trim())
    .filter(x => x.startsWith('p_'))
    .map(x => x.match(/^p_\w+\s+(\w+)/)[1]);
  const grants = [...sql.matchAll(/(?:revoke all|grant execute) on function public\.create_company_deal_with_offer\(([\s\S]*?)\)\s+(?:from|to)/g)];
  assert.equal(grants.length, 2);
  for (const grant of grants) {
    assert.deepEqual(grant[1].replace(/\s/g, '').split(','), types);
  }
});

test('deal update rejects negative purchase prices', () => {
  const sql = load('staging_update_company_deal.sql');
  assert.ok(sql.includes("'purchase_price','asking_price','target_offer_price'"));
  assert.ok(sql.includes("p_patch ? v_column"));
  assert.ok(sql.includes("cannot be negative"));
});
