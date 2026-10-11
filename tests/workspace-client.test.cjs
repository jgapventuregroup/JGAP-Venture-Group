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
    return { data: [{ id: 'deal-b', company_id: 'beta' }], error: null };
  }}, 'beta');
  assert.equal(result[0].id, 'deal-b');
  await assert.rejects(client.listDeals({ rpc: () => { throw Error('should not call'); } }, ''), /Select a workspace/);
});

test('single-deal lookup supplies company and deal IDs', async () => {
  const deal = await client.getDeal({ rpc: async (name, args) => {
    assert.equal(name, 'get_company_deal');
    assert.deepEqual(args, { p_company_id: 'alpha', p_deal_id: 'd1' });
    return { data: [{ id: 'd1', company_id: 'alpha' }], error: null };
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

test('development dashboard workspace preview is opt-in and preserves legacy flow', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /src="workspace-client\.js"/);
  assert.match(html, /src="workspace-picker\.js"/);
  assert.match(html, /workspace_preview/);
  assert.match(html, /if\(JGAP_WORKSPACE_PREVIEW\) await mountJGAPWorkspacePreview\(\)/);
  assert.match(html, /sb\.rpc\("bootstrap_current_user"\)/);
});

test('workspace preview ignores stale results after dashboard rerenders', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /if\(!area\.isConnected\)return;/);
  assert.match(html, /if\(!area\.isConnected \|\| jgapPreviewWorkspaceId!==selected\.id\)return;/);
  assert.match(html, /if\(area\.isConnected && jgapPreviewWorkspaceId===selected\.id\)/);
});

test('read-only deal preview renders user-controlled names as text, not HTML', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /item\.textContent=String\(deal\.name\|\|"Unnamed deal"\)/);
  assert.match(html, /for\(const deal of deals\.slice\(0,10\)\)/);
  assert.match(html, /message\.replaceChildren\(\)/);
});

test('workspace creation requires explicit confirmation and valid name', async () => {
  let calls = 0;
  const db = { rpc: async (name, args) => {
    calls++;
    assert.equal(name, 'create_my_company');
    assert.deepEqual(args, { p_company_name: 'New Company' });
    return { data: { company_id: 'new-company-id', status: 'created' }, error: null };
  }};
  await assert.rejects(client.createWorkspace(db, 'New Company', false), /Confirm/);
  await assert.rejects(client.createWorkspace(db, ' ', true), /2 to 100/);
  assert.equal(calls, 0);
  const result = await client.createWorkspace(db, ' New Company ', true);
  assert.equal(result.company_id, 'new-company-id');
  assert.equal(calls, 1);
});
test('workspace creation propagates backend errors and rejects malformed replies', async () => {
  await assert.rejects(client.createWorkspace({ rpc: async () => ({error: new Error('Pending invitation')}) }, 'Valid', true), /Pending invitation/);
  await assert.rejects(client.createWorkspace({ rpc: async () => ({data: {status:'created'}}) }, 'Valid', true), /invalid result/);
});

test('deal update rejects tenant identity and unexpected fields before RPC', async () => {
  let calls = 0;
  const db = { rpc: async () => { calls++; return {data:{id:'deal'},error:null}; } };
  await assert.rejects(client.updateDeal(db, 'alpha', 'deal', {company_id:'beta'}), /Field not editable/);
  await assert.rejects(client.updateDeal(db, 'alpha', 'deal', {owner_id:'outsider'}), /Field not editable/);
  assert.equal(calls, 0);
  await client.updateDeal(db, 'alpha', 'deal', {name:'Renamed'});
  assert.equal(calls, 1);
});

test('deal patch rejects non-plain objects without contacting backend', async () => {
  let calls = 0;
  const db = { rpc: async () => { calls++; return {data:{},error:null}; } };
  await assert.rejects(client.updateDeal(db, 'alpha', 'deal', new Date()), /nonempty|plain object/);
  await assert.rejects(client.updateDeal(db, 'alpha', 'deal', Object.assign(new Date(), {name:'x'})), /plain object/);
  assert.equal(calls, 0);
});

test('deal creation rejects protected and unexpected fields before backend calls', async () => {
  let calls = 0;
  const db = { rpc: async () => { calls++; return {data:'deal-id',error:null}; } };
  await assert.rejects(client.createDeal(db, 'alpha', {name:'Property',company_id:'beta'}), /Field not accepted/);
  await assert.rejects(client.createDeal(db, 'alpha', {name:'Property',owner_id:'outsider'}), /Field not accepted/);
  await assert.rejects(client.createDeal(db, 'alpha', Object.assign(new Date(), {name:'Property'})), /plain object/);
  assert.equal(calls, 0);
  await client.createDeal(db, 'alpha', {name:'Property',asking_price:125000,target_offer_price:100000});
  assert.equal(calls, 1);
});

test('simulated two-company backend keeps reads scoped to selected workspace', async () => {
  const records = {
    alpha: [{id:'deal-a',company_id:'alpha',name:'Alpha property'}],
    beta: [{id:'deal-b',company_id:'beta',name:'Beta property'}]
  };
  const membership = new Set(['alpha']);
  const rpc = async (name, args = {}) => {
    if (name === 'list_my_companies') return {data:[alpha],error:null};
    if (!membership.has(args.p_company_id)) return {data:null,error:new Error('Not a company member')};
    if (name === 'list_company_deals') return {data:records[args.p_company_id],error:null};
    if (name === 'get_company_deal')
      return {data:records[args.p_company_id].find(d => d.id === args.p_deal_id) || null,error:null};
    throw Error('Unexpected mock endpoint');
  };
  const db = {rpc};
  const workspaces = await client.listWorkspaces(db);
  assert.equal(client.selectWorkspace(workspaces, null).id, 'alpha');
  assert.deepEqual((await client.listDeals(db, 'alpha')).map(d => d.id), ['deal-a']);
  assert.equal(await client.getDeal(db, 'alpha', 'deal-b'), null);
  await assert.rejects(client.listDeals(db, 'beta'), /Not a company member/);
  await assert.rejects(client.getDeal(db, 'beta', 'deal-b'), /Not a company member/);
});

test('workspace normalization accepts already normalized records and rejects unauthorized selections', () => {
  const normalized = client.normalizeWorkspaces([alpha, beta]);
  assert.deepEqual(client.normalizeWorkspaces(normalized), normalized);
  assert.equal(client.selectWorkspace(normalized, 'beta').role, 'viewer');
  assert.throws(() => client.selectWorkspace(normalized, 'outsider'), /not authorized/);
  assert.throws(() => client.selectWorkspace(normalized, null), /Choose a workspace/);
});

test('blank workspace and deal identifiers never reach RPC', async () => {
  let calls = 0;
  const db = {rpc: async () => { calls++; return {data:null,error:null}; }};
  await assert.rejects(client.listDeals(db, '   '), /Select a workspace/);
  await assert.rejects(client.createDeal(db, '   ', {name:'Property'}), /Select a workspace/);
  await assert.rejects(client.getDeal(db, 'alpha', '   '), /Workspace and deal/);
  await assert.rejects(client.updateDeal(db, 'alpha', '   ', {name:'Updated'}), /Workspace and deal/);
  await assert.rejects(client.deleteDeal(db, 'alpha', '   ', true), /Workspace and deal/);
  assert.equal(calls, 0);
});

test('explicit invalid workspace selection never falls back to a sole membership', () => {
  assert.throws(() => client.selectWorkspace([alpha], '   '), /not authorized/);
  assert.throws(() => client.selectWorkspace([alpha], 42), /not authorized/);
  assert.equal(client.selectWorkspace([alpha], null).id, 'alpha');
  assert.equal(client.selectWorkspace([alpha], ' alpha ').id, 'alpha');
});

test('duplicate workspace memberships do not create duplicate company choices', () => {
  const rows = client.normalizeWorkspaces([alpha, {...alpha}, {company_id:' alpha ',company_name:'Duplicate',member_role:'viewer'}, beta]);
  assert.deepEqual(rows.map(row => row.id), ['alpha','beta']);
  assert.equal(client.renderWorkspacePicker(rows, null).choices.length, 2);
});

test('scoped deal operations trim identifiers before backend RPC', async () => {
  const calls = [];
  const db = {rpc: async (name, args) => {
    calls.push({name,args});
    return {data:name==='delete_company_deal' ? true : {id:'deal-1',company_id:'alpha'},error:null};
  }};
  await client.getDeal(db, ' alpha ', ' deal-1 ');
  await client.updateDeal(db, ' alpha ', ' deal-1 ', {name:'Edited'});
  await client.deleteDeal(db, ' alpha ', ' deal-1 ', true);
  assert.equal(calls.length, 3);
  for (const {args} of calls) {
    assert.equal(args.p_company_id, 'alpha');
    assert.equal(args.p_deal_id, 'deal-1');
  }
});

test('membership guard refuses unknown company before UI data requests', () => {
  assert.equal(client.requireWorkspaceMembership([alpha, beta], ' alpha ').id, 'alpha');
  assert.throws(() => client.requireWorkspaceMembership([alpha], 'beta'), /not authorized/);
  assert.throws(() => client.requireWorkspaceMembership([alpha], '   '), /Select a workspace/);
});

test('opt-in preview checks membership before querying selected company', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
  const guard = html.indexOf('requireWorkspaceMembership(workspaces,selected.id)');
  const query = html.indexOf('listDeals(sb,authorized.id)', guard);
  assert.ok(guard > 0, 'preview must check membership');
  assert.ok(query > guard, 'preview must guard before requesting deals');
});

test('preview shows safe empty state without triggering customer onboarding', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
  const preview = html.slice(html.indexOf('async function mountJGAPWorkspacePreview()'), html.indexOf('window.__jgapStartupReachedAuth=true'));
  assert.match(preview, /if\(!workspaces\.length\)/);
  assert.match(preview, /Customer onboarding is not enabled yet/);
  assert.doesNotMatch(preview, /createWorkspace\(|create_my_company/);
});

test('preview clears previous company selection after loading memberships', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
  const preview = html.slice(html.indexOf('async function mountJGAPWorkspacePreview()'), html.indexOf('window.__jgapStartupReachedAuth=true'));
  const loaded = preview.indexOf('listWorkspaces(sb)');
  const reset = preview.indexOf('jgapPreviewWorkspaceId=null;', loaded);
  const mount = preview.indexOf('JGAPWorkspacePicker.mount(', loaded);
  assert.ok(loaded >= 0 && reset > loaded && mount > reset);
});

test('workspace creation refuses malformed company IDs and trims valid replies', async () => {
  for (const id of [42, {}, '   ', null]) {
    await assert.rejects(client.createWorkspace({
      rpc: async () => ({ data: { company_id: id, status: 'created' }, error: null })
    }, 'Valid Company', true), /invalid result/);
  }
  const result = await client.createWorkspace({
    rpc: async () => ({ data: { company_id: ' alpha ', status: 'already_member' }, error: null })
  }, 'Valid Company', true);
  assert.equal(result.company_id, 'alpha');
});

test('deal listing fails closed on missing or malformed backend results', async () => {
  for (const data of [null, undefined, {}, {id:'deal'}, 'unexpected']) {
    await assert.rejects(client.listDeals({
      rpc: async () => ({data,error:null})
    }, 'alpha'), /invalid result/);
  }
  assert.deepEqual(await client.listDeals({
    rpc: async () => ({data:[],error:null})
  }, 'alpha'), []);
});

test('workspace listing rejects mixed-company or unscoped deal records', async () => {
  for (const records of [
    [{id:'one',company_id:'alpha'}, {id:'two',company_id:'beta'}],
    [{id:'missing-company'}],
    [null]
  ]) {
    await assert.rejects(client.listDeals({
      rpc: async () => ({data:records,error:null})
    }, 'alpha'), /outside the selected workspace/);
  }
  const records = await client.listDeals({
    rpc: async () => ({data:[{id:'one',company_id:'alpha'}],error:null})
  }, 'alpha');
  assert.equal(records.length, 1);
});

test('single deal lookup rejects cross-company and wrong deal identities', async () => {
  for (const data of [
    [{id:'d1',company_id:'beta'}],
    [{id:'d2',company_id:'alpha'}],
    [{id:'d1'}],
    [{id:'d1',company_id:'alpha'},{id:'d1',company_id:'alpha'}],
    'unexpected'
  ]) {
    await assert.rejects(client.getDeal({
      rpc: async () => ({data,error:null})
    }, 'alpha', 'd1'), /outside the selected workspace|multiple records/);
  }
  assert.equal(await client.getDeal({
    rpc: async () => ({data:[],error:null})
  }, 'alpha','d1'), null);
});

test('workspace preview scripts use actual HTML newlines, not escaped text', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /<script src="workspace-client\.js"><\/script>\n<script src="workspace-picker\.js"><\/script>\n<script>\nconst SUPABASE_URL=/);
  assert.doesNotMatch(html, /<script src="workspace-client\.js"><\/script>\\n/);
});

test('opt-in workspace preview blocks production Supabase RPCs', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
  const start = html.indexOf('async function mountJGAPWorkspacePreview()');
  const end = html.indexOf('window.__jgapStartupReachedAuth',start);
  const preview = html.slice(start,end);
  assert.ok(start>=0 && end>start);
  assert.match(preview,/qfszapteuxuogoselprp\.supabase\.co/);
  assert.match(preview,/Workspace preview disabled/);
  assert.ok(preview.indexOf('Workspace preview disabled') < preview.indexOf('listWorkspaces(sb)'));
});
