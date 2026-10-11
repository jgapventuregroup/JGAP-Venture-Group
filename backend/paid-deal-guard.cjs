'use strict';
const {authorizePaidOperation}=require('./authorize-paid-operation.cjs');
// Server adapter contract: authenticated user ID comes from verified auth context,
// company ID is checked against membership, billing from trusted server storage.
// No payment provider is connected by this module.
function makePaidDealGuard({getAuthenticatedUserId,getMemberRole,getSubscription,clock=()=>Math.floor(Date.now()/1000)}){
  if([getAuthenticatedUserId,getMemberRole,getSubscription,clock].some(fn=>typeof fn!=='function'))
    throw new Error('Server authentication, membership, billing and clock providers required');
  return async function guard({companyId,operation}){
    const userId=await getAuthenticatedUserId();
    return authorizePaidOperation({
      userId,companyId,operation,
      loadMembership:(uid,cid)=>getMemberRole(uid,cid),
      loadSubscription:cid=>getSubscription(cid),
      nowSeconds:clock()
    });
  };
}
module.exports={makePaidDealGuard};
