const test=require('node:test');
const assert=require('node:assert/strict');
const {authorizePaidOperation}=require('../backend/authorize-paid-operation.cjs');
const now=1800000000;
const active={status:'active',current_period_end:now+3600};
test('nonmember is rejected without looking up billing details',async()=>{
  let billingCalls=0;
  const result=await authorizePaidOperation({userId:'outsider',companyId:'company-a',loadMembership:async()=>null,loadSubscription:async()=>{billingCalls++;return active;},nowSeconds:now});
  assert.deepEqual(result,{allowed:false,reason:'not_member'});
  assert.equal(billingCalls,0);
});
test('valid member with active entitlement can access paid operation',async()=>{
  const result=await authorizePaidOperation({userId:'member',companyId:'company-a',loadMembership:async()=> 'editor',loadSubscription:async()=>active,nowSeconds:now});
  assert.deepEqual(result,{allowed:true,reason:'entitled',role:'editor'});
});
test('member with expired entitlement cannot access paid operation',async()=>{
  const result=await authorizePaidOperation({userId:'member',companyId:'company-a',loadMembership:async()=> 'owner',loadSubscription:async()=>({status:'active',current_period_end:now}),nowSeconds:now});
  assert.equal(result.allowed,false);
});
test('missing identity fails closed without any loaders',async()=>{
  assert.deepEqual(await authorizePaidOperation({userId:'',companyId:'company-a'}),{allowed:false,reason:'unauthenticated'});
});
