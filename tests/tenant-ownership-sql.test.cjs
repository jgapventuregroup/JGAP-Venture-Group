'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const trigger = fs.readFileSync(path.join(root, 'backend/staging_prevent_deal_reassignment.sql'), 'utf8');
const patch = fs.readFileSync(path.join(root, 'backend/staging_update_company_deal.sql'), 'utf8');

test('deal ownership cannot be reassigned by UPDATE', () => {
  assert.match(trigger, /new\.company_id\s+is\s+distinct\s+from\s+old\.company_id/i);
  assert.match(trigger, /raise exception/i);
  assert.match(trigger, /before update of company_id on public\.deals/i);
  assert.match(trigger, /execute function jgap_private\.prevent_deal_company_reassignment\(\)/i);
});
test('ownership trigger is private, not a customer RPC', () => {
  assert.match(trigger, /function jgap_private\.prevent_deal_company_reassignment\(\)/i);
  assert.match(trigger, /revoke all on function jgap_private\.prevent_deal_company_reassignment\(\) from public,anon,authenticated/i);
});
test('deal patch excludes tenant and row identifiers', () => {
  const allowed = patch.match(/v_allowed constant text\[\] := array\[([\s\S]*?)\];/);
  assert.ok(allowed);
  assert.doesNotMatch(allowed[1], /'company_id'|'id'|'user_id'/i);
  assert.match(patch, /if not \(v_column = any\(v_allowed\)\)/i);
  assert.match(patch, /where id = \$2 and company_id = \$3 returning \*/i);
  assert.match(patch, /cm\.role in \('owner', 'admin', 'editor'\)/i);
});
