# Tenant isolation staging checklist

Status: NOT RUN. This file defines tests for an isolated staging Supabase project. Do not use production customer records.

Setup: create two staging accounts A and B, and deploy the reviewed staging-only SQL from the backend folder.

1. A creates company Alpha. Verify A owns Alpha.
2. B creates company Beta. Verify B owns Beta.
3. A repeats creation. Verify no second company is created.
4. Anonymous creation is rejected.
5. A lists workspaces. Verify Beta is absent.
6. B lists workspaces. Verify Alpha is absent.
7. A creates a deal in Alpha. Verify company ID.
8. B attempts to list Alpha deals. Verify no rows.
9. B attempts to create a deal in Alpha. Verify rejected.
10. A attempts to list Beta deals. Verify no rows.
11. B creates a deal in Beta. Verify A cannot read it.
12. A reads B's deal by ID through Data API. Verify RLS denial.
13. A updates or deletes B's deal. Verify no affected rows.
14. A inserts a deal directly with Beta company ID. Verify RLS denial.
15. A reads or changes B's properties and documents. Verify RLS denial.
16. Pending invitation takes precedence over creating a new workspace.
17. Existing JGAP owner retains original company and data.
18. Signing out and back in preserves correct workspace access.
19. Concurrent onboarding requests create only one workspace.
20. Multi-company membership requires explicit workspace selection.

Release gate: No cross-customer reads, writes, deletes, or membership changes. No production rollout until evidence is captured, migration reviewed, and rollback approved. Static tests do not substitute for integration tests.
