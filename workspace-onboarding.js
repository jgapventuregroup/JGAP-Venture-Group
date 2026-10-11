/* JGAP SaaS onboarding model, development only. No implicit workspace creation.
 * The UI must ask for explicit confirmation before calling createWorkspace.
 * This module is deliberately separate from the production legacy bootstrap.
 */
(function (root) {
  'use strict';
  const api = root.JGAPWorkspaceClient || (typeof require === 'function' ? require('./workspace-client.js') : null);
  async function resolveOnboarding(client) {
    const workspaces = await api.listWorkspaces(client);
    if (workspaces.length === 0) return { state: 'needs_workspace', workspaces, selected: null };
    if (workspaces.length === 1)
      return { state: 'ready', workspaces, selected: workspaces[0] };
    return { state: 'choose_workspace', workspaces, selected: null };
  }
  function chooseExisting(state, workspaceId) {
    if (!state || !Array.isArray(state.workspaces))
      throw new Error('Load company memberships before choosing a workspace');
    return api.requireWorkspaceMembership(state.workspaces, workspaceId);
  }
  async function createFirstWorkspace(client, state, companyName, confirmed) {
    if (!state || state.state !== 'needs_workspace' || !Array.isArray(state.workspaces) || state.workspaces.length !== 0)
      throw new Error('Cannot create a first workspace when memberships already exist');
    const result = await api.createWorkspace(client, companyName, confirmed);
    // Refresh authoritative memberships instead of trusting the creation response
    // as proof of access. A returned company ID alone does not authorize reads.
    const refreshed = await resolveOnboarding(client);
    const selected = chooseExisting(refreshed, result.company_id);
    return { ...refreshed, state: 'ready', selected };
  }
  const onboarding = { resolveOnboarding, chooseExisting, createFirstWorkspace };
  if (typeof module !== 'undefined' && module.exports) module.exports = onboarding;
  else root.JGAPWorkspaceOnboarding = onboarding;
})(typeof window !== 'undefined' ? window : globalThis);
