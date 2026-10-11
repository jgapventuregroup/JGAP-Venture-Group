'use strict';
const {entitlement}=require('./subscription-policy.cjs');
// Server-side integration contract: caller must resolve company membership and
// trusted subscription from the database, never from browser-provided values.
async function authorizePaidOperation({userId,companyId,loadMembership,loadSubscription,nowSeconds,operation='read'}) {
  if(typeof userId!=='string'||!userId.trim()||typeof companyId!=='string'||!companyId.trim())
    return {allowed:false,reason:'unauthenticated'};
  if(typeof loadMembership!=='function'||typeof loadSubscription!=='function')
    throw new Error('Trusted membership and billing loaders are required');
  const role=await loadMembership(userId,companyId);
  if(!['owner','admin','editor','viewer'].includes(role))
    return {allowed:false,reason:'not_member'};
  if(!['read','write'].includes(operation))return {allowed:false,reason:'invalid_operation'};
  if(operation==='write' && role==='viewer')return {allowed:false,reason:'read_only'};
  const subscription=await loadSubscription(companyId);
  const access=entitlement(subscription,nowSeconds);
  return {...access,role};
}
module.exports={authorizePaidOperation};
