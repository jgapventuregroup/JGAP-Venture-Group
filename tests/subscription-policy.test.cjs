const test=require('node:test');
const assert=require('node:assert/strict');
const {entitlement}=require('../backend/subscription-policy.cjs');
const now=1800000000;
test('active subscription with future verified end grants access',()=>{
  assert.deepEqual(entitlement({status:'active',current_period_end:now+3600},now),{allowed:true,reason:'entitled'});
});
test('valid trial grants access only until expiration',()=>{
  assert.equal(entitlement({status:'trialing',trial_end:now+1},now).allowed,true);
  assert.equal(entitlement({status:'trialing',trial_end:now},now).allowed,false);
});
test('canceled and payment problem statuses are denied',()=>{
  for(const status of ['canceled','past_due','unpaid','paused','incomplete','incomplete_expired','unknown'])
    assert.equal(entitlement({status,current_period_end:now+3600},now).allowed,false);
});
test('missing, malformed or expired entitlements fail closed',()=>{
  for(const record of [null,{},[],{status:'active'},{status:'active',current_period_end:now},{status:'active',current_period_end:'9999999999'},{status:'trialing',trial_end:Infinity}])
    assert.equal(entitlement(record,now).allowed,false);
});
test('invalid clock is rejected rather than granting access',()=>{
  assert.throws(()=>entitlement({status:'active',current_period_end:now+100},NaN),/Current time/);
});
