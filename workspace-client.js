/* JGAP SaaS workspace client (development only; loaded by dev index.html for opt-in preview).
 * Requires reviewed workspace RPC deployment before enabling in the app.
 * Never infer a workspace from the first membership when multiple exist.
 */
(function (root) {
  'use strict';
  function normalizeWorkspaces(rows) {
    const seen = new Set();
    return (Array.isArray(rows) ? rows : []).filter(row => {
      const id = row && (row.company_id || row.id);
      if (typeof id !== 'string' || !id.trim() || seen.has(id.trim())) return false;
      seen.add(id.trim());
      return true;
    }).map(row => ({
      id: (row.company_id || row.id).trim(),
      name: String(row.company_name || row.name || 'Unnamed workspace'),
      role: String(row.member_role || row.role || '')
    }));
  }
  function normalizeWorkspaceId(workspaceId) {
    if (typeof workspaceId !== 'string' || !workspaceId.trim())
      throw new Error('Select a workspace first');
    return workspaceId.trim();
  }
  function normalizeDealId(dealId) {
    if (typeof dealId !== 'string' || !dealId.trim()) throw new Error('Workspace and deal are required');
    return dealId.trim();
  }
  function selectWorkspace(workspaces, requestedId) {
    const rows = normalizeWorkspaces(workspaces);
    if (requestedId !== null && requestedId !== undefined && requestedId !== '') {
      if (typeof requestedId !== 'string' || !requestedId.trim())
        throw new Error('Selected workspace is not authorized');
      const match = rows.find(w => w.id === requestedId.trim());
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
  function requireWorkspaceMembership(workspaces, workspaceId) {
    const id = normalizeWorkspaceId(workspaceId);
    return selectWorkspace(workspaces, id);
  }
  async function listDeals(client, workspaceId) {
    workspaceId = normalizeWorkspaceId(workspaceId);
    const { data, error } = await client.rpc('list_company_deals', { p_company_id: workspaceId });
    if (error) throw error;
    return data || [];
  }
  async function getDeal(client, workspaceId, dealId) {
    workspaceId = normalizeWorkspaceId(workspaceId);
    dealId = normalizeDealId(dealId);
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
    workspaceId = normalizeWorkspaceId(workspaceId);
    dealId = normalizeDealId(dealId);
    if (!patch || Array.isArray(patch) || typeof patch !== 'object' || !Object.keys(patch).length)
      throw new Error('A nonempty deal patch is required');
    if (Object.getPrototypeOf(patch) !== Object.prototype && Object.getPrototypeOf(patch) !== null)
      throw new Error('Deal patch must be a plain object');
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
    workspaceId = normalizeWorkspaceId(workspaceId);
    dealId = normalizeDealId(dealId);
    const { data, error } = await client.rpc('delete_company_deal', {
      p_company_id: workspaceId, p_deal_id: dealId
    });
    if (error) throw error;
    return data === true;
  }
  async function createDeal(client, workspaceId, payload) {
    workspaceId = normalizeWorkspaceId(workspaceId);
    if (!payload || Array.isArray(payload) || typeof payload !== 'object')
      throw new Error('Deal details are required');
    if (Object.getPrototypeOf(payload) !== Object.prototype && Object.getPrototypeOf(payload) !== null)
      throw new Error('Deal details must be a plain object');
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
    const allowed = new Set(['name', ...fields]);
    for (const field of Object.keys(payload)) {
      if (!allowed.has(field)) throw new Error('Field not accepted for deal creation: ' + field);
    }
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
  const api = { normalizeWorkspaces, selectWorkspace, requireWorkspaceMembership, renderWorkspacePicker, listWorkspaces, createWorkspace, listDeals, getDeal, createDeal, updateDeal, deleteDeal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JGAPWorkspaceClient = api;
})(typeof window !== 'undefined' ? window : globalThis);
