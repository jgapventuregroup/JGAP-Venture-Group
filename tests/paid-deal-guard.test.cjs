const test=require('node:test');
const assert=require('node:assert/strict');
const {makePaidDealGuard}=require('../backend/paid-deal-guard.cjs');
const now=1800000000;
test('guard derives identity from server and enforces membership and billing',async()=>{
  const calls=[];
  const guard=makePaidDealGuard({
    getAuthenticatedUserId:async()=> 'alice',
    getMemberRole:async(user,company)=>{calls.push(['member',user,company]);return company==='alpha'?'editor':null;},
    getSubscription:async(company)=>{calls.push(['billing',company]);return {status:'active',current_period_end:now+100};},
    clock:()=>now
  });
  assert.equal((await guard({companyId:'alpha',operation:'write'})).allowed,true);
  assert.deepEqual(await guard({companyId:'beta',operation:'read'}),{allowed:false,reason:'not_member'});
  assert.deepEqual(calls,[['member','alice','alpha'],['billing','alpha'],['member','alice','beta']]);
});
test('unauthenticated server context cannot call membership or billing',async()=>{
  let calls=0;
  const guard=makePaidDealGuard({
    getAuthenticatedUserId:async()=>null,
    getMemberRole:async()=>{calls++;return 'owner';},
    getSubscription:async()=>{calls++;return {status:'active',current_period_end:now+100};},
    clock:()=>now
  });
  assert.deepEqual(await guard({companyId:'alpha',operation:'read'}),{allowed:false,reason:'unauthenticated'});
  assert.equal(calls,0);
});
