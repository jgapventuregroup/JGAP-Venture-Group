/* JGAP SaaS workspace client (development only; not loaded by index.html).
 * Requires reviewed workspace RPC deployment before enabling in the app.
 * Never infer a workspace from the first membership when multiple exist.
 */
(function (root) {
  'use strict';
  function normalizeWorkspaces(rows) {
    return (Array.isArray(rows) ? rows : []).filter(row =>
      row && typeof row.company_id === 'string' && row.company_id.length > 0
    ).map(row => ({
      id: row.company_id,
      name: String(row.company_name || 'Unnamed workspace'),
      role: String(row.member_role || '')
    }));
  }
  function selectWorkspace(workspaces, requestedId) {
    const rows = normalizeWorkspaces(workspaces);
    if (requestedId) {
      const match = rows.find(w => w.id === requestedId);
      if (!match) throw new Error('Selected workspace is not authorized');
      return match;
    }
    if (rows.length === 1) return rows[0];
    if (rows.length === 0) return null;
    throw new Error('Choose a workspace before opening company deals');
  }
  async function listWorkspaces(client) {
    const { data, error } = await client.rpc('list_my_companies');
    if (error) throw error;
    return normalizeWorkspaces(data);
  }
  async function listDeals(client, workspaceId) {
    if (!workspaceId) throw new Error('Select a workspace first');
    const { data, error } = await client.rpc('list_company_deals', { p_company_id: workspaceId });
    if (error) throw error;
    return data || [];
  }
  async function getDeal(client, workspaceId, dealId) {
    if (!workspaceId || !dealId) throw new Error('Workspace and deal are required');
    const { data, error } = await client.rpc('get_company_deal', {
      p_company_id: workspaceId, p_deal_id: dealId
    });
    if (error) throw error;
    return Array.isArray(data) ? (data[0] || null) : (data || null);
  }
  async function updateDeal(client, workspaceId, dealId, patch) {
    if (!workspaceId || !dealId) throw new Error('Workspace and deal are required');
    if (!patch || Array.isArray(patch) || typeof patch !== 'object' || !Object.keys(patch).length)
      throw new Error('A nonempty deal patch is required');
    const { data, error } = await client.rpc('update_company_deal', {
      p_company_id: workspaceId, p_deal_id: dealId, p_patch: patch
    });
    if (error) throw error;
    return data;
  }
  async function deleteDeal(client, workspaceId, dealId, confirmed) {
    if (confirmed !== true) throw new Error('Confirm deal deletion first');
    if (!workspaceId || !dealId) throw new Error('Workspace and deal are required');
    const { data, error } = await client.rpc('delete_company_deal', {
      p_company_id: workspaceId, p_deal_id: dealId
    });
    if (error) throw error;
    return data === true;
  }
  const api = { normalizeWorkspaces, selectWorkspace, listWorkspaces, listDeals, getDeal, updateDeal, deleteDeal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JGAPWorkspaceClient = api;
})(typeof window !== 'undefined' ? window : globalThis);
