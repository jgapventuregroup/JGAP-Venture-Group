/* Isolated JGAP staging client factory. Never reuse the production sb client.
 * Publishable key is supplied by a staging operator; no service-role keys.
 * No automatic connections or writes occur on import.
 */
(function (root) {
  'use strict';
  const STAGING_URL = 'https://qfszapteuxuogoselprp.supabase.co';
  const PRODUCTION_PROJECT = 'sfsyphmnzxaplundaljy';
  function createStagingClient(supabaseLib, publishableKey) {
    if (!supabaseLib || typeof supabaseLib.createClient !== 'function')
      throw new Error('Supabase client library is required');
    if (typeof publishableKey !== 'string' || !publishableKey.trim())
      throw new Error('Staging publishable key is required');
    const key = publishableKey.trim();
    if (!key.startsWith('sb_publishable_'))
      throw new Error('Only a staging publishable key may be used');
    if (STAGING_URL.includes(PRODUCTION_PROJECT))
      throw new Error('Production project must never be used for staging');
    return supabaseLib.createClient(STAGING_URL, key, {
      auth: {
        storageKey: 'jgap-staging-auth-v1',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }
  const api = { STAGING_URL, createStagingClient };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JGAPStagingClient = api;
})(typeof window !== 'undefined' ? window : globalThis);
