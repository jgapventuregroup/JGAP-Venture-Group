const test=require('node:test');
const assert=require('node:assert/strict');
const {exerciseCustomerFlow}=require('../scripts/staging-customer-flow.cjs');

test('customer flow never runs without explicit confirmation',async()=>{
  let calls=0;
  await assert.rejects(exerciseCustomerFlow({rpc:async()=>{calls++;}},'Test Co','Duplex',false),/confirmation/);
  assert.equal(calls,0);
});
test('synthetic customer flow scopes create, lookup and list to selected company',async()=>{
  const calls=[];
  const deal={id:'deal1',company_id:'alpha',name:'JGAP STAGING TEST: Duplex'};
  const client={rpc:async(name,args)=>{
    calls.push({name,args});
    if(name==='list_my_companies')return {data:[{company_id:'alpha',company_name:'Alpha',member_role:'owner'}],error:null};
    if(name==='create_company_deal_with_offer')return {data:'deal1',error:null};
    if(name==='get_company_deal')return {data:[deal],error:null};
    if(name==='list_company_deals')return {data:[deal],error:null};
    throw Error('unexpected '+name);
  }};
  const result=await exerciseCustomerFlow(client,'Alpha','Duplex',true);
  assert.deepEqual(result,{companyId:'alpha',createdId:'deal1',verified:true,cleanupRequired:true});
  assert.equal(calls.filter(x=>x.name==='create_my_company').length,0);
  for(const call of calls.filter(x=>x.args?.p_company_id))assert.equal(call.args.p_company_id,'alpha');
});
test('synthetic customer flow refuses ambiguous multi-company membership',async()=>{
  const calls=[];
  const client={rpc:async(name)=>{calls.push(name);return {data:[
    {company_id:'alpha',company_name:'Alpha',member_role:'owner'},
    {company_id:'beta',company_name:'Beta',member_role:'owner'}
  ],error:null};}};
  await assert.rejects(exerciseCustomerFlow(client,'Alpha','Duplex',true),/Multiple workspaces/);
  assert.deepEqual(calls,['list_my_companies']);
});
