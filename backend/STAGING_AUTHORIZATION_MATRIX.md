# JGAP staging authorization test worksheet

**NOT EXECUTED.** Use synthetic accounts and properties in an isolated, approved, zero-cost test project only. This worksheet does not authorize production changes.

## Test actors

| Actor | Company Alpha | Company Beta |
|---|---|---|
| A | owner | no membership |
| B | no membership | owner |
| C | viewer | no membership |
| D | editor | no membership |
| E | owner | viewer |
| F | no membership | no membership |

Create one uniquely identifiable synthetic deal in each company. Capture their IDs and verify membership roles from the database, not from UI labels. Confirm the staging schema actually supports `viewer` and `editor` before running tests.

## Mandatory routes and expected outcomes

| Route | Actor | Target | Expected |
|---|---|---|---|
| `list_my_companies` | A | all | Alpha only |
| `list_my_companies` | E | all | Alpha and Beta, explicit selection |
| `list_company_deals` | A | Beta | Denied or empty, no Beta rows |
| `get_company_deal` | A | Beta deal | Denied or no row |
| `create_company_deal_with_offer` | A | Beta | Denied; zero new rows |
| `update_company_deal` | A | Beta deal | Denied; original unchanged |
| `delete_company_deal` | A | Beta deal | Denied; original remains |
| `create_company_deal_with_offer` | C | Alpha | Denied; zero new rows |
| `update_company_deal` | C | Alpha deal | Denied; original unchanged |
| `delete_company_deal` | C | Alpha deal | Denied; original remains |
| `update_company_deal` | D | Alpha deal | Allowed, scoped to Alpha |
| `update_company_deal` | E | Beta deal | Denied as Beta viewer |
| Direct Data API `deals` SELECT | A | Beta | No Beta rows |
| Direct Data API `deals` INSERT | C | Alpha | Denied |
| Direct Data API `deals` UPDATE | C | Alpha | Denied |
| Direct Data API `deals` DELETE | C | Alpha | Denied |
| Direct Data API `deals` INSERT | A | Beta | Denied |
| Direct Data API `deals` UPDATE | A | Beta | Denied |
| Direct Data API `deals` DELETE | A | Beta | Denied |
| Any deal endpoint | F | Alpha or Beta | Denied |
| Existing legacy deal RPCs | C | Alpha | All write attempts denied |
| Existing legacy deal RPCs | A | Beta | No cross-company access |
| Invitation/membership mutation endpoints | C | Alpha | Cannot self-promote |
| Any endpoint after membership removal | D | Alpha | Access revoked |

**Important:** For writes, HTTP errors alone are not enough. Re-query the records as an authorized owner and verify no unauthorized mutation occurred. For reads, check both row count and actual returned company IDs. For multi-company actor E, ensure writes cannot silently target the first membership.

## Execution protocol

1. Record the staging project identifier, SQL revision, Git commit, reviewer, and UTC timestamp.
2. Run each request with the actual test user's access token. Do **not** use a service-role key; it bypasses the ordinary customer security model.
3. Record the exact RPC name or direct REST path, request's company ID, expected result, observed status, returned row company IDs, and before/after database state.
4. Enumerate every deployed legacy SECURITY DEFINER RPC and repeat applicable negative tests; the names above are not an exhaustive inventory.
5. Run sign-out, session expiry, removed membership, and concurrent onboarding scenarios from `TENANT_ISOLATION_TEST_PLAN.md`.
6. Stop immediately on any unexpected access, write, schema mismatch, charge, or inability to confirm rollback.
7. Compare original owner access and property counts before and after any **separately approved** migration; never copy real customer records into staging.

## Evidence template

```csv
test_id,utc_timestamp,git_commit,staging_project,actor_role,actor_company,target_company,endpoint,operation,expected,observed,unauthorized_rows_returned,unauthorized_rows_modified,pass_fail,reviewer
```

**Launch gate:** All tests must pass with evidence and a reviewed rollback plan. Mock client tests and GitHub CI do not establish database isolation. No production SQL, merge, public signup, or subscription payments without separate approval.
