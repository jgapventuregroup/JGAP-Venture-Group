'use strict';
// Pure billing access policy. This is not an authorization boundary:
// paid operations must be checked on the server against verified provider state.
function entitlement(record, nowSeconds) {
  if (!Number.isFinite(nowSeconds)) throw new Error('Current time required');
  if (!record || typeof record !== 'object' || Array.isArray(record))
    return {allowed:false,reason:'missing'};
  const status=record.status;
  if (status !== 'active' && status !== 'trialing')
    return {allowed:false,reason:'payment_required'};
  const end=status==='trialing'?record.trial_end:record.current_period_end;
  if (!Number.isSafeInteger(end) || end <= nowSeconds)
    return {allowed:false,reason:'expired'};
  return {allowed:true,reason:'entitled'};
}
module.exports={entitlement};
