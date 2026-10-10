const test = require('node:test');
const assert = require('node:assert/strict');
const client = require('../workspace-client.js');
const alpha = { company_id: 'alpha', company_name: 'Alpha', member_role: 'owner' };
const beta = { company_id: 'beta', company_name: 'Beta', member_role: 'viewer' };

test('a single workspace is selected without guessing', () => {
  assert.equal(client.selectWorkspace([alpha], null).id, 'alpha');
  assert.equal(client.selectWorkspace([], null), null);
});
test('multi-workspace accounts must choose explicitly', () => {
  assert.throws(() => client.selectWorkspace([alpha, beta], null), /Choose a workspace/);
  assert.equal(client.selectWorkspace([alpha, beta], 'beta').id, 'beta');
  assert.throws(() => client.selectWorkspace([alpha], 'beta'), /not authorized/);
});
test('company listing uses authenticated membership RPC', async () => {
  const result = await client.listWorkspaces({ rpc: async name => {
    assert.equal(name, 'list_my_companies');
    return { data: [alpha, beta], error: null };
  }});
  assert.deepEqual(result.map(x => x.id), ['alpha', 'beta']);
});
test('deal listing always supplies selected company ID', async () => {
  const result = await client.listDeals({ rpc: async (name, args) => {
    assert.equal(name, 'list_company_deals');
    assert.deepEqual(args, { p_company_id: 'beta' });
    return { data: [{ id: 'deal-b' }], error: null };
  }}, 'beta');
  assert.equal(result[0].id, 'deal-b');
  await assert.rejects(client.listDeals({ rpc: () => { throw Error('should not call'); } }, ''), /Select a workspace/);
});
