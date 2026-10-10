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
