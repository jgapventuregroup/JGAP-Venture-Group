/* Server-side importer contract for JGAP Deal Intelligence.
 * Provider-specific code should fetch only from an authorized API/feed and
 * pass the returned records through JGAPDealIntelligenceAdapter.normalizeMany.
 * This module intentionally contains no credentials and no scraping logic.
 */
export function buildImportBatch(records, sourceName) {
  const rows = Array.isArray(records) ? records : [];
  return rows.map((r) => ({ ...r, source_name: sourceName }));
}

export function filterTargetMarket(rows) {
  const cities = new Set(['bristol','kingsport','johnson city','elizabethton']);
  const states = new Set(['tn','va','tennessee','virginia']);
  return rows.filter(r => {
    const city = String(r.city || '').trim().toLowerCase();
    const state = String(r.state || '').trim().toLowerCase();
    const property = String(r.property_type || '').toLowerCase();
    const units = r.units == null || r.units === '' ? null : Number(r.units);
    const typeOk = /multi|duplex|triplex|fourplex|apartment|residential income|commercial/.test(property);
    const unitOk = units === null || !Number.isFinite(units) || (units >= 2 && units <= 20);
    return (cities.has(city) || states.has(state)) && typeOk && unitOk;
  });
}
