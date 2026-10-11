const test = require('node:test');
const assert = require('node:assert/strict');
const onboarding = require('../workspace-onboarding.js');
const alpha = { company_id: 'alpha', company_name: 'Alpha', member_role: 'owner' };
const beta = { company_id: 'beta', company_name: 'Beta', member_role: 'viewer' };

function mock(rows) {
  const calls = [];
  return {
    calls,
    client: { rpc: async (name, args) => {
      calls.push({name,args});
      if (name === 'list_my_companies') return {data:rows,error:null};
      if (name === 'create_my_company') return {data:{company_id:'new',status:'created'},error:null};
      throw Error('Unexpected RPC ' + name);
    }}
  };
}
test('onboarding does not create a company for existing members', async () => {
  const {client,calls} = mock([alpha]);
  const state = await onboarding.resolveOnboarding(client);
  assert.equal(state.state,'ready');
  assert.equal(state.selected.id,'alpha');
  await assert.rejects(onboarding.createFirstWorkspace(client,state,'New Company',true),/Cannot create/);
  assert.deepEqual(calls.map(c=>c.name),['list_my_companies']);
});
test('multiple company memberships require explicit choice', async () => {
  const {client} = mock([alpha,beta]);
  const state = await onboarding.resolveOnboarding(client);
  assert.equal(state.state,'choose_workspace');
  assert.equal(state.selected,null);
  assert.throws(()=>onboarding.chooseExisting(state,'outside'),/not authorized/);
  assert.equal(onboarding.chooseExisting(state,'beta').id,'beta');
});
test('first workspace requires confirmation and refreshed membership proof', async () => {
  const {client,calls} = mock([]);
  const state = await onboarding.resolveOnboarding(client);
  assert.equal(state.state,'needs_workspace');
  await assert.rejects(onboarding.createFirstWorkspace(client,state,'New Company',false),/Confirm/);
  assert.equal(calls.filter(c=>c.name==='create_my_company').length,0);
  await assert.rejects(onboarding.createFirstWorkspace(client,state,'New Company',true),/not authorized/);
  assert.equal(calls.filter(c=>c.name==='create_my_company').length,1);
});
test('new workspace succeeds only when refreshed membership includes created company', async () => {
  let created = false;
  const client = {rpc:async name=>{
    if(name==='create_my_company'){created=true;return {data:{company_id:'new',status:'created'},error:null};}
    if(name==='list_my_companies')return {data:created?[{company_id:'new',company_name:'New',member_role:'owner'}]:[],error:null};
    throw Error('unexpected');
  }};
  const state = await onboarding.resolveOnboarding(client);
  const result = await onboarding.createFirstWorkspace(client,state,'New Company',true);
  assert.equal(result.state,'ready');
  assert.equal(result.selected.id,'new');
});
