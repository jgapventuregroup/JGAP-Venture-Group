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

test('single-deal lookup supplies company and deal IDs', async () => {
  const deal = await client.getDeal({ rpc: async (name, args) => {
    assert.equal(name, 'get_company_deal');
    assert.deepEqual(args, { p_company_id: 'alpha', p_deal_id: 'd1' });
    return { data: [{ id: 'd1' }], error: null };
  } }, 'alpha', 'd1');
  assert.equal(deal.id, 'd1');
});
test('deal edits require nonempty patches and explicit scope', async () => {
  await assert.rejects(client.updateDeal({ rpc: () => { throw Error('unexpected'); } }, 'alpha', 'd1', {}), /nonempty/);
  const updated = await client.updateDeal({ rpc: async (name, args) => {
    assert.equal(name, 'update_company_deal');
    assert.deepEqual(args, { p_company_id: 'alpha', p_deal_id: 'd1', p_patch: { name: 'Updated' } });
    return { data: { id: 'd1' }, error: null };
  } }, 'alpha', 'd1', { name: 'Updated' });
  assert.equal(updated.id, 'd1');
});
test('deal deletion requires confirmation and explicit scope', async () => {
  const rpc = async (name, args) => {
    assert.equal(name, 'delete_company_deal');
    assert.deepEqual(args, { p_company_id: 'alpha', p_deal_id: 'd1' });
    return { data: true, error: null };
  };
  await assert.rejects(client.deleteDeal({ rpc }, 'alpha', 'd1', false), /Confirm/);
  assert.equal(await client.deleteDeal({ rpc }, 'alpha', 'd1', true), true);
});

test('Deal Analyzer creation preserves offers and scopes company', async () => {
  const created = await client.createDeal({ rpc: async (name, args) => {
    assert.equal(name, 'create_company_deal_with_offer');
    assert.equal(args.p_company_id, 'alpha');
    assert.equal(args.p_name, 'Duplex');
    assert.equal(args.p_asking_price, 220000);
    assert.equal(args.p_target_offer_price, 190000);
    assert.equal(args.p_monthly_rent, 2400);
    assert.equal(Object.prototype.hasOwnProperty.call(args, 'p_company_id'), true);
    return { data: 'new-deal-id', error: null };
  } }, 'alpha', { name: ' Duplex ', asking_price: 220000, target_offer_price: 190000, monthly_rent: 2400 });
  assert.equal(created, 'new-deal-id');
});
test('deal creation rejects missing workspace or name before RPC', async () => {
  const api = { rpc: () => { throw Error('unexpected RPC'); } };
  await assert.rejects(client.createDeal(api, '', { name: 'Duplex' }), /Select a workspace/);
  await assert.rejects(client.createDeal(api, 'alpha', { name: ' ' }), /Deal name/);
});

test('workspace picker never silently selects among multiple companies', () => {
  const picker = client.renderWorkspacePicker([alpha, beta], null);
  assert.equal(picker.required, true);
  assert.equal(picker.selectedId, null);
  assert.deepEqual(picker.choices.map(x => x.value), ['alpha', 'beta']);
  assert.equal(client.renderWorkspacePicker([alpha], null).selectedId, 'alpha');
  assert.equal(client.renderWorkspacePicker([alpha, beta], 'beta').selectedId, 'beta');
  assert.throws(() => client.renderWorkspacePicker([alpha], 'beta'), /not authorized/);
});
