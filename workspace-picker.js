/* Standalone workspace selector UI. Loaded only by development branch's opt-in preview.
 * Caller must deploy and verify list_my_companies before invoking mount().
 */
(function (root) {
  'use strict';
  const clientApi = root.JGAPWorkspaceClient || (typeof require === 'function' ? require('./workspace-client.js') : null);
  function makeOption(doc, value, label) {
    const option = doc.createElement('option');
    option.value = value;
    option.textContent = label;
    return option;
  }
  function mount(container, workspaces, onSelect) {
    if (!container || !container.ownerDocument || typeof onSelect !== 'function')
      throw new Error('Workspace picker needs a container and selection callback');
    const doc = container.ownerDocument;
    const model = clientApi.renderWorkspacePicker(workspaces, null);
    const label = doc.createElement('label');
    label.textContent = 'Company workspace';
    const select = doc.createElement('select');
    select.setAttribute('aria-label', 'Company workspace');
    select.appendChild(makeOption(doc, '', model.required ? 'Choose a company' : 'No company selected'));
    for (const choice of model.choices) select.appendChild(makeOption(doc, choice.value, choice.label));
    select.value = model.selectedId || '';
    select.disabled = model.choices.length === 0;
    const status = doc.createElement('p');
    status.setAttribute('role', 'status');
    status.textContent = model.choices.length === 0
      ? 'No company membership found. Contact an administrator or create a workspace after onboarding is enabled.'
      : model.required ? 'Choose a company to view its deals.' : '';
    let selectionSequence = 0;
    // Keep the selected workspace stable across rerenders; the caller owns any
    // asynchronous deal-loading race checks.
    select.addEventListener('change', () => {
      if (!container.isConnected) return;
      // Invalidate in-flight selections even when the new choice is invalid.
      ++selectionSequence;
      try {
        const selected = clientApi.selectWorkspace(workspaces, select.value || null);
        if (!selected) throw new Error('Choose a company');
        status.textContent = '';
        const requestSequence = selectionSequence;
        Promise.resolve().then(() => onSelect(selected)).catch(error => {
          if (requestSequence !== selectionSequence || !container.isConnected) return;
          status.textContent = 'Unable to open workspace: ' + (error && error.message ? error.message : 'Request failed');
        });
      } catch (error) {
        status.textContent = error.message;
        select.value = '';
      }
    });
    container.replaceChildren(label, select, status);
    if (model.selectedId) {
      const requestSequence = ++selectionSequence;
      Promise.resolve().then(() => onSelect(clientApi.selectWorkspace(workspaces, model.selectedId))).catch(error => {
        if (requestSequence !== selectionSequence) return;
        status.textContent = 'Unable to open workspace: ' + (error && error.message ? error.message : 'Request failed');
      });
    }
    return { select, status };
  }
  const api = { mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JGAPWorkspacePicker = api;
})(typeof window !== 'undefined' ? window : globalThis);
