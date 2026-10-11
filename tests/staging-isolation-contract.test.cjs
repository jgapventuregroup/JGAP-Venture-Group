/* JGAP staging isolation test contract.
 * Offline only: this file does not connect to Supabase or mutate any database.
 * Live tests require separately approved synthetic users, staging RPCs and RLS.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sql = name => fs.readFileSync(path.join(__dirname,'..','backend',name),'utf8');

test('deal transfer trigger rejects any change of company_id including dual-owner', () => {
  const trigger = sql('staging_prevent_deal_reassignment.sql');
  assert.match(trigger, /new\.company_id is distinct from old\.company_id/i);
  assert.match(trigger, /raise exception 'Deal company cannot be changed'/i);
  assert.match(trigger, /before update of company_id on public\.deals/i);
  assert.doesNotMatch(trigger.replace(/^\s*--.*$/gm,''), /security definer|disable trigger/i);
});

test('draft scoped deal endpoints require company membership and editor role for writes', () => {
  for (const name of ['staging_company_deals.sql','staging_company_deal_with_offer.sql','staging_update_company_deal.sql','staging_delete_company_deal.sql']) {
    const body = sql(name);
    assert.match(body, /auth\.uid\(\)/i, name);
    assert.match(body, /company_members/i, name);
    assert.match(body, /'owner',\s*'admin',\s*'editor'/i, name);
  }
});

test('draft read RPCs enforce explicit company selection', () => {
  for (const name of ['staging_company_deals.sql','staging_get_company_deal.sql']) {
    const body = sql(name);
    assert.match(body, /p_company_id/i, name);
    assert.match(body, /is_company_member\(p_company_id\)/i, name);
  }
});

test('deal patch allowlist cannot update tenant identity', () => {
  const body = sql('staging_update_company_deal.sql');
  assert.match(body, /p_patch/i);
  assert.match(body, /allowed/i);
  assert.doesNotMatch(body, /'company_id'\s*,\s*'name'/i);
});
