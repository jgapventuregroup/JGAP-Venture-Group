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

test('deal edits enforce vacancy and loan term bounds', () => {
  const sql = load('staging_update_company_deal.sql');
  assert.ok(sql.includes('Vacancy rate must be between 0 and 100'));
  assert.ok(sql.includes('Loan term must be between 0 and 100 years'));
});

test('deal edits enforce interest rate bounds', () => {
  const sql = load('staging_update_company_deal.sql');
  assert.ok(sql.includes('Interest rate must be between 0 and 100'));
});

test('deal edits validate unit counts and timeline integers', () => {
  const sql = load('staging_update_company_deal.sql');
  for (const field of ['units', 'holding_months', 'offer_due_diligence_days', 'offer_closing_days']) {
    assert.ok(sql.includes("'" + field + "'"));
  }
  assert.ok(sql.includes('Units must be greater than zero'));
  assert.ok(sql.includes("p_patch->>v_column)::integer < 0"));
});

test('new deal creation validates financial amounts and rates before insert', () => {
  const sql = load('staging_company_deal_with_offer.sql');
  assert.ok(sql.includes('Deal amounts cannot be negative'));
  assert.ok(sql.includes('Interest and vacancy rates must be between 0 and 100'));
  assert.ok(sql.includes('Deal timeline values are outside permitted bounds'));
  assert.ok(sql.indexOf('Deal amounts cannot be negative') < sql.indexOf('insert into public.deals'));
});

test('new deal creation rejects null required financial inputs before comparisons', () => {
  const sql = load('staging_company_deal_with_offer.sql');
  assert.ok(sql.includes('Required deal financial inputs cannot be null'));
  for (const field of ['purchase_price', 'down_payment', 'interest_rate', 'loan_term_years',
    'closing_costs', 'rehab_cost', 'monthly_rent', 'vacancy_rate',
    'monthly_operating_expenses', 'other_monthly_income']) {
    assert.ok(sql.includes('p_' + field + ' is null'));
  }
  assert.ok(sql.indexOf('Required deal financial inputs cannot be null') < sql.indexOf('Deal amounts cannot be negative'));
});

test('basic workspace deal RPCs require explicit authenticated company scope', () => {
  const sql = load('staging_company_deals.sql');
  assert.ok(sql.includes('p_company_id is null'));
  assert.ok(sql.includes('public.is_company_member(p_company_id)'));
  assert.ok(sql.includes('(select auth.uid()) is not null'));
  assert.ok(sql.includes('Deal amounts cannot be negative'));
  assert.ok(sql.includes('Required deal financial inputs cannot be null'));
  assert.ok(sql.includes('d.company_id = p_company_id'));
});

test('company onboarding qualifies builtin text helpers under restricted search path', () => {
  const sql = load('staging_create_my_company.sql');
  assert.ok(sql.includes('pg_catalog.btrim(pg_catalog.coalesce('));
  assert.ok(sql.includes('pg_catalog.length(v_name)'));
  assert.ok(sql.includes('pg_catalog.lower(pg_catalog.coalesce('));
});

test('deal edits cannot null required financial inputs or exceed selling cost bounds', () => {
  const sql = load('staging_update_company_deal.sql');
  assert.ok(sql.includes("p_patch->v_column = 'null'::jsonb"));
  assert.ok(sql.includes('Required deal input cannot be null'));
  assert.ok(sql.includes('Selling cost percent must be between 0 and 100'));
});

test('deal edits require nonempty status and property type', () => {
  const sql = load('staging_update_company_deal.sql');
  assert.ok(sql.includes('Deal status is required'));
  assert.ok(sql.includes('Property type is required'));
});

test('customer app excludes private JGAP Book scripts and navigation', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.resolve(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const token of ['learning-book.js', 'learning-book-runtime.js',
    'navLearningBook', 'openJGAPLearningBook', 'renderLearningBookPage']) {
    assert.ok(!html.includes(token), 'Customer index still references ' + token);
  }
  for (const file of ['learning-book.js', 'learning-book-runtime.js', 'jgap-book-cover.jpg', '.github/workflows/wire-book-export.yml']) {
    assert.ok(!fs.existsSync(path.join(root, file)), 'Customer bundle still ships ' + file);
  }
});

test('single deal lookup requires both explicit workspace and deal IDs', () => {
  const sql = load('staging_get_company_deal.sql');
  assert.ok(sql.includes('security invoker'));
  assert.ok(sql.includes('d.company_id = p_company_id'));
  assert.ok(sql.includes('d.id = p_deal_id'));
  assert.ok(sql.includes('public.is_company_member(p_company_id)'));
  assert.ok(sql.includes('(select auth.uid()) is not null'));
  assert.ok(sql.includes('from public,anon'));
  assert.ok(sql.includes('to authenticated'));
  assert.ok(!sql.includes('security definer'));
});

test('deal deletion is scoped to a selected company and requires an editing role', () => {
  const sql = load('staging_delete_company_deal.sql');
  assert.ok(sql.includes('security invoker'));
  assert.ok(sql.includes('d.company_id = p_company_id'));
  assert.ok(sql.includes('d.id = p_deal_id'));
  assert.ok(sql.includes('public.is_company_member(p_company_id)'));
  assert.ok(sql.includes("cm.role in ('owner', 'admin', 'editor')"));
  assert.ok(sql.includes('Workspace role cannot delete deals'));
  assert.ok(sql.includes('from public,anon'));
  assert.ok(!sql.includes('security definer'));
});

test('every draft deal write RPC rejects read-only workspace roles', () => {
  for (const file of [
    'staging_company_deals.sql',
    'staging_company_deal_with_offer.sql',
    'staging_update_company_deal.sql',
    'staging_delete_company_deal.sql'
  ]) {
    const sql = load(file);
    assert.ok(sql.includes("cm.role in ('owner', 'admin', 'editor')"), file);
    assert.ok(sql.includes('cm.company_id = p_company_id'), file);
    assert.ok(sql.includes('cm.user_id = (select auth.uid())'), file);
    assert.ok(sql.includes('security invoker'), file);
  }
});

test('simple deal creation enforces analyzer numeric boundaries in SQL draft', () => {
  const sql = load('staging_company_deals.sql');
  for (const field of ['p_purchase_price','p_down_payment','p_interest_rate','p_loan_term_years',
    'p_closing_costs','p_rehab_cost','p_monthly_rent','p_vacancy_rate',
    'p_monthly_operating_expenses','p_other_monthly_income']) {
    assert.match(sql, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' is null'));
  }
  assert.match(sql, /p_interest_rate > 100/);
  assert.match(sql, /p_vacancy_rate > 100/);
  assert.match(sql, /p_loan_term_years > 100/);
});

test('both draft deal creation RPCs reject blank status and property type', () => {
  for (const file of ['staging_company_deals.sql','staging_company_deal_with_offer.sql']) {
    const sql = load(file);
    assert.ok(sql.includes("p_status is null or pg_catalog.btrim(p_status) = ''"), file);
    assert.ok(sql.includes("p_property_type is null or pg_catalog.btrim(p_property_type) = ''"), file);
    assert.ok(sql.includes('Deal status is required'), file);
    assert.ok(sql.includes('Property type is required'), file);
  }
});

test('staging JSON patch aggregate is schema-qualified under empty search path', () => {
  const sql = load('staging_update_company_deal.sql');
  assert.match(sql, /set search_path\s*=\s*''/i);
  assert.match(sql, /pg_catalog\.array_agg\(k order by k\)/i);
  assert.match(sql, /pg_catalog\.jsonb_object_keys\(p_patch\)/i);
});

test('staging trigger prevents moving a deal between companies', () => {
  const sql = load('staging_prevent_deal_reassignment.sql');
  assert.match(sql, /create or replace function jgap_private\.prevent_deal_company_reassignment\(\)/i);
  assert.match(sql, /new\.company_id is distinct from old\.company_id/i);
  assert.match(sql, /raise exception 'Deal company cannot be changed'/i);
  assert.match(sql, /before update of company_id on public\.deals/i);
  assert.match(sql, /execute function jgap_private\.prevent_deal_company_reassignment\(\)/i);
  assert.match(sql, /revoke all on function jgap_private\.prevent_deal_company_reassignment\(\) from public,anon,authenticated/i);
  assert.doesNotMatch(sql.replace(/^\s*--.*$/gm, ''), /disable trigger|security definer/i);
});

test('new customer workspace requires confirmed email in staging SQL', () => {
  const sql = load('staging_create_my_company.sql');
  assert.match(sql, /auth\.users u/);
  assert.match(sql, /u\.id = v_uid\s+and u\.email_confirmed_at is not null/);
  assert.match(sql, /pg_catalog\.btrim\(u\.email\) <> ''/);
  assert.match(sql, /Verify your email before creating a company workspace/);
  const verification = sql.indexOf('u.email_confirmed_at is not null');
  const creation = sql.indexOf('insert into public.companies');
  assert.ok(verification > 0 && creation > verification, 'email gate must precede workspace creation');
});

test('staging onboarding never chooses first company when multiple memberships exist', () => {
  const sql = load('staging_create_my_company.sql');
  assert.match(sql, /pg_catalog\.count\(distinct cm\.company_id\)/);
  assert.match(sql, /Choose an existing company workspace explicitly/);
  assert.ok(sql.indexOf('count(distinct cm.company_id)') < sql.indexOf("'already_member'"));
});
