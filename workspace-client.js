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
  async function createWorkspace(client, companyName, confirmed) {
    if (confirmed !== true) throw new Error('Confirm workspace creation first');
    if (typeof companyName !== 'string') throw new Error('Company name must be 2 to 100 characters');
    const name = companyName.trim();
    if (name.length < 2 || name.length > 100) throw new Error('Company name must be 2 to 100 characters');
    const { data, error } = await client.rpc('create_my_company', { p_company_name: name });
    if (error) throw error;
    if (!data || !data.company_id || !['created', 'already_member'].includes(data.status))
      throw new Error('Workspace creation returned an invalid result');
    return data;
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
  const editableDealFields = new Set([
    'name','status','property_type','purchase_price','down_payment','interest_rate',
    'loan_term_years','closing_costs','rehab_cost','monthly_rent','vacancy_rate',
    'monthly_operating_expenses','other_monthly_income','notes','asking_price',
    'target_offer_price','offer_notes','target_cap_rate','target_cash_on_cash',
    'target_monthly_cash_flow','target_dscr','offer_earnest_money',
    'offer_due_diligence_days','offer_closing_days','offer_financing_type',
    'offer_contingencies','property_address','property_county','seller_name',
    'offer_state','offer_template','units','arv','holding_months',
    'monthly_holding_costs','selling_cost_percent','financing_costs',
    'projected_sale_price','loan_structure'
  ]);
  async function updateDeal(client, workspaceId, dealId, patch) {
    if (!workspaceId || !dealId) throw new Error('Workspace and deal are required');
    if (!patch || Array.isArray(patch) || typeof patch !== 'object' || !Object.keys(patch).length)
      throw new Error('A nonempty deal patch is required');
    for (const field of Object.keys(patch)) {
      if (!editableDealFields.has(field)) throw new Error('Field not editable: ' + field);
    }
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
  async function createDeal(client, workspaceId, payload) {
    if (!workspaceId) throw new Error('Select a workspace first');
    if (!payload || Array.isArray(payload) || typeof payload !== 'object')
      throw new Error('Deal details are required');
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    if (!name) throw new Error('Deal name is required');
    const args = { p_company_id: workspaceId, p_name: name };
    const fields = [
      'property_type', 'status', 'purchase_price', 'down_payment',
      'interest_rate', 'loan_term_years', 'closing_costs', 'rehab_cost',
      'monthly_rent', 'vacancy_rate', 'monthly_operating_expenses',
      'other_monthly_income', 'notes', 'asking_price', 'target_offer_price',
      'offer_notes', 'target_cap_rate', 'target_cash_on_cash',
      'target_monthly_cash_flow', 'target_dscr', 'offer_earnest_money',
      'offer_due_diligence_days', 'offer_closing_days', 'offer_financing_type',
      'offer_contingencies', 'property_address', 'property_county',
      'seller_name', 'offer_state', 'offer_template'
    ];
    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(payload, field))
        args['p_' + field] = payload[field];
    }
    const { data, error } = await client.rpc('create_company_deal_with_offer', args);
    if (error) throw error;
    return data;
  }
  function renderWorkspacePicker(workspaces, selectedId) {
    const rows = normalizeWorkspaces(workspaces);
    const selected = selectedId ? selectWorkspace(workspaces, selectedId) : null;
    const choices = rows.map(row => ({
      value: row.id,
      label: row.name + ' (' + row.role + ')'
    }));
    return {
      required: rows.length > 1 && !selected,
      selectedId: selected ? selected.id : (rows.length === 1 ? rows[0].id : null),
      choices
    };
  }
  const api = { normalizeWorkspaces, selectWorkspace, renderWorkspacePicker, listWorkspaces, createWorkspace, listDeals, getDeal, createDeal, updateDeal, deleteDeal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JGAPWorkspaceClient = api;
})(typeof window !== 'undefined' ? window : globalThis);
