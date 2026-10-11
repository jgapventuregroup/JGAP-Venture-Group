/* JGAP staging-only customer flow harness. No network requests unless invoked
 * explicitly with a supplied staging client. Never use production credentials.
 * Uses synthetic records and verifies company scoping in returned responses.
 */
'use strict';
const onboarding = require('../workspace-onboarding.js');
const workspace = require('../workspace-client.js');

async function exerciseCustomerFlow(client, companyName, dealName, confirmed, selectedCompanyId = null) {
  if (confirmed !== true) throw new Error('Explicit synthetic staging test confirmation required');
  if (!client || typeof client.rpc !== 'function') throw new Error('Staging RPC client required');
  let state = await onboarding.resolveOnboarding(client);
  if (state.state === 'needs_workspace')
    throw new Error('No workspace exists; create a synthetic company separately with explicit approval');
  if (state.state === 'choose_workspace') {
    if (!selectedCompanyId) throw new Error('Multiple workspaces: choose one explicitly; test will not guess');
    state = { ...state, selected: onboarding.chooseExisting(state, selectedCompanyId) };
  } else if (selectedCompanyId && state.selected && state.selected.id !== selectedCompanyId) {
    throw new Error('Requested company is not the authorized workspace');
  }
  if (!state.selected) throw new Error('No authorized workspace available');
  if (!['owner', 'admin', 'editor'].includes(state.selected.role))
    throw new Error('Selected workspace is read-only; synthetic deal creation is blocked');
  const companyId = state.selected.id;
  const marker = 'JGAP STAGING TEST: ' + String(dealName || 'Synthetic Duplex');
  const createdId = await workspace.createDeal(client,companyId,{
    name:marker,asking_price:150000,target_offer_price:130000,monthly_rent:1800
  });
  if (typeof createdId !== 'string' || !createdId.trim())
    throw new Error('Deal creation returned no ID; inspect staging before cleanup');
  const deal = await workspace.getDeal(client,companyId,createdId);
  if (!deal || deal.name !== marker)
    throw new Error('Created deal could not be read back from the selected company');
  const listed = await workspace.listDeals(client,companyId);
  if (!listed.some(row => row.id === createdId))
    throw new Error('Created deal not present in scoped listing');
  return {companyId,createdId,verified:true,cleanupRequired:true};
}
module.exports = {exerciseCustomerFlow};
