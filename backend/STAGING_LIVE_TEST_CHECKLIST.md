# JGAP staging integration checklist

This checklist is **not** evidence of live tenant isolation. All customer records must be fictional, in the dedicated staging project `qfszapteuxuogoselprp`.

## Before any staging write

- Obtain the staging publishable key through a secure local operator flow. Do not commit it, an access token, or a service-role key.
- Verify the staging project URL and that no production account or session is reused.
- Review the read-only staging preflight results and determine which draft RPCs and triggers are installed. Do not assume installation.
- Confirm the operator approves one consolidated staging test session. No repeated permission popups.
- Create two separate synthetic verified users and two independent company memberships. Do not use JGAP owner's real account.
- Confirm a backup or deliberate cleanup plan for synthetic rows.

## Minimum two-tenant matrix

| Test | Signed-in identity | Company ID requested | Expected |
| --- | --- | --- | --- |
| List own deals | A | A | A's synthetic records only |
| Read another deal | A | B | No row / denied |
| Insert another deal | A | B | Denied |
| Update another deal | A | B | Denied |
| Delete another deal | A | B | Denied |
| Move own deal to B | A | B | Denied by immutable company trigger |
| Viewer write | A viewer | A | Denied |
| Editor write | A editor | A | Allowed |
| Missing auth | anonymous | A | Denied |
| Cross-company RPC | A | B | Denied |
| Subscription entitlement | A | B | Denied before billing lookup |

For each operation record the request role, RPC/table endpoint, expected result, actual result, and test timestamp. Any unexpected access is a **launch blocker**.

## Completion criteria

Staging RLS, direct Data API, SECURITY DEFINER legacy RPCs, invite flows, and signed-in tenant separation all pass. A browser-only or mocked Node test is insufficient. The production migration remains blocked until the user explicitly approves deployment.
