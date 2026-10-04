# JGAP Deal Intelligence — Test Runbook

## Buying box
- Bristol TN, Kingsport TN, Johnson City TN, Elizabethton TN, Southwest Virginia
- 2–20 units
- Target cap rate >= 8% when supplied
- Target DSCR >= 1.20 when supplied
- Target monthly cash flow >= $500 when supplied
- Missing numbers are never invented
- Only new or materially changed opportunities are eligible
- Outbound email/notifications disabled until manual approval

## Data flow
1. Authorized provider payload arrives.
2. `deal-intelligence-ingest` normalizes common listing fields.
3. `di_upsert_opportunity` deduplicates by source + external ID and records new/price/material changes.
4. `di_refresh_matches` applies investor buying boxes.
5. `di_queue_alerts` prepares alerts but does not send them.
6. Manual review occurs before any outbound dispatch.

## Required provider checks before production
- API credentials are stored server-side only.
- Provider terms permit the intended commercial use.
- Listing URLs remain attributable to the source where required.
- Rate limits and usage costs are understood.
- MLS/data licensing restrictions are documented.
