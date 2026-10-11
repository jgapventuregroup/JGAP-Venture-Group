const test = require('node:test');
const assert = require('node:assert/strict');
const client = require('../workspace-client.js');

// Offline contract simulation only. These tests do not validate live Postgres RLS.
const alpha = {id:'deal-alpha',company_id:'company-alpha',name:'Synthetic Alpha Duplex'};
const beta = {id:'deal-beta',company_id:'company-beta',name:'Synthetic Beta Duplex'};
function rpcMock(handler) {
  const calls=[];
  return {calls, client:{rpc:async(name,args)=>{
    calls.push({name,args});
    return handler(name,args);
  }}};
}
test('company Alpha cannot accept a mixed-company deal listing',async()=>{
  const mock=rpcMock(()=>({data:[alpha,beta],error:null}));
  await assert.rejects(client.listDeals(mock.client,'company-alpha'),/outside the selected workspace/);
  assert.equal(mock.calls[0].args.p_company_id,'company-alpha');
});
test('company Beta cannot accept Alpha deal by guessed deal ID',async()=>{
  const mock=rpcMock(()=>({data:[alpha],error:null}));
  await assert.rejects(client.getDeal(mock.client,'company-beta','deal-alpha'),/outside the selected workspace/);
  assert.deepEqual(mock.calls[0].args,{p_company_id:'company-beta',p_deal_id:'deal-alpha'});
});
test('cross-company record ID mismatch fails even if company ID matches',async()=>{
  const mock=rpcMock(()=>({data:[{...beta,company_id:'company-alpha'}],error:null}));
  await assert.rejects(client.getDeal(mock.client,'company-alpha','deal-alpha'),/outside the selected workspace/);
});
test('company ownership cannot be reassigned using deal patch',async()=>{
  const mock=rpcMock(()=>{throw Error('backend should not be called');});
  await assert.rejects(client.updateDeal(mock.client,'company-alpha','deal-alpha',{company_id:'company-beta'}),/not editable/);
  assert.equal(mock.calls.length,0);
});
test('company ownership cannot be injected into create payload',async()=>{
  const mock=rpcMock(()=>{throw Error('backend should not be called');});
  await assert.rejects(client.createDeal(mock.client,'company-alpha',{name:'Test',company_id:'company-beta'}),/not accepted/);
  assert.equal(mock.calls.length,0);
});
test('deletion requires confirmation before any RPC call',async()=>{
  const mock=rpcMock(()=>{throw Error('backend should not be called');});
  await assert.rejects(client.deleteDeal(mock.client,'company-alpha','deal-alpha',false),/Confirm/);
  assert.equal(mock.calls.length,0);
});
test('normal scoped listing works for both independent companies',async()=>{
  const mock=rpcMock((name,args)=>({data:args.p_company_id==='company-alpha'?[alpha]:[beta],error:null}));
  assert.deepEqual(await client.listDeals(mock.client,'company-alpha'),[alpha]);
  assert.deepEqual(await client.listDeals(mock.client,'company-beta'),[beta]);
});
