# JGAP SaaS staging execution runbook

**Status: staging foundation tables and six RLS policies installed and verified; tenant integration tests NOT RUN. Do not execute on the production Supabase project.**

## Verified staging environment (2026-10-10)
- Project: **JGAP SaaS Staging.**, project ID `qfszapteuxuogoselprp`, region `us-east-1`, status `ACTIVE_HEALTHY`.
- Production project: **JGAP Venture Group**, ID `sfsyphmnzxaplundaljy`. **Never run staging SQL on this project.**
- Supabase reported project creation cost **$0/month**.
- Initially empty staging schema; subsequently installed **four tables**: companies, company_members, company_invitations, deals. All have RLS enabled.
- Installed and verified **six policies**: company_read, membership_self_read, deal_read, deal_insert, deal_update, deal_delete.
- Installed `jgap_private.member_role(uuid)` and `public.is_company_member(uuid)`; verified anonymous EXECUTE is denied on both.
- **No synthetic authenticated tenant tests have been run.** RPC installation attempted afterward hit repeated approval prompts; **do not assume those RPCs were installed**.
- **Approval-loop safeguard:** Do not retry connector writes automatically. First finish offline review, then schedule a single clearly scoped staging-only installation with the user's agreement. Do not ask the user to repeatedly click Allow.
- Next gate: inspect staging RPC state once access is stable; review the remaining SQL against actual schema; run authenticated cross-company tests.

## Prerequisites
1. Obtain explicit owner approval for a **separate, isolated test environment** and confirm its cost is $0 before provisioning. If free staging is unavailable, stop and request a decision.
2. Create throwaway accounts A (owner), B (owner), C (viewer), and D (multi-company member). Never reuse the real JGAP owner account or property records.
3. Record the test project ID, backup/rollback mechanism, exact schema version, and operator. Do not copy real production data into staging.
4. Inspect table schema, indexes, constraints, grants, all RLS policies, and SECURITY DEFINER functions before applying SQL. Static tests are not proof that SQL matches the actual schema.

## Migration order (staging only)
1. Review and apply a role-aware RLS migration to every deal write path, **including direct table access**. The current production deal policy allows any member to write.
2. Audit and replace legacy SECURITY DEFINER deal functions, especially functions that silently choose the first company membership. Do not revoke until callers are migrated.
3. Review and apply `staging_list_my_companies.sql` and `staging_create_my_company.sql`.
4. Review and apply `staging_prevent_deal_reassignment.sql` and test a dual-company owner cannot transfer a deal by changing `company_id`; then review and apply `staging_company_deals.sql`, `staging_company_deal_with_offer.sql`, `staging_get_company_deal.sql`, `staging_update_company_deal.sql`, and `staging_delete_company_deal.sql`.
5. Verify EXECUTE grants, default function privileges, RLS enforcement, and the behavior of all preexisting RPCs. An authenticated user must not be able to bypass roles via a different endpoint.

## Test evidence
Run every scenario in `TENANT_ISOLATION_TEST_PLAN.md` and capture the signed-in role, requested company ID, operation, expected outcome, observed outcome, and pass/fail result. Include direct PostgREST table calls, old RPCs, new RPCs, and the UI. Specifically check:
- A cannot read, create, update, or delete B's deals even when B's company and deal UUIDs are known.
- C can read their authorized company's deals but cannot write through any route.
- D must choose a company; create and update never target the first membership by accident.
- No membership or invitation endpoint can elevate a viewer to editor or owner.
- The original JGAP company and its existing properties remain unchanged.

## Frontend activation order
1. Enable the opt-in `workspace_preview=1` UI in a **staging build** after backend checks pass.
2. Verify workspace dropdown, read-only deal list, and sign-out/session transitions.
3. Move deal pipeline reads to selected-company RPCs, then writes, one path at a time; verify existing owner data each time.
4. Remove legacy bootstrap and implicit-company calls only after all routes have been replaced.
5. Review subscription entitlements and server-side billing webhooks separately. Do not enable public signups or payments before tenant isolation is proven.

## Stop conditions
Immediately stop on any cross-company data exposure, viewer write access, privilege escalation, missing original records, SQL errors, unexpected charges, or failed rollback verification.

**Approval boundary:** This document authorizes no deployment, production SQL, customer data changes, merges, or paid services.

## Email verification decision before onboarding activation
- The current GitHub draft `create_my_company` RPC requires a verified, nonempty account email **for new workspace creation**. This is code-level preparation only: the updated RPC has not been confirmed installed in staging and has not been tested with real authenticated accounts.
- Before enabling public customer signup, decide whether email verification is mandatory. The proposed server-side check uses `auth.users.email_confirmed_at`; test verified and unverified accounts in isolated staging before activation.
- Do not rely solely on a disabled frontend button or on the email value supplied by the browser. Preserve existing company memberships; any verification gate should apply to **new workspace creation**, not block existing members from accessing their properties.
- Confirm the chosen email-confirmation behavior with the actual Supabase Auth configuration and identity-provider flows. Do not modify production Auth settings without separate approval.

## Release evidence record template
For each staging test, record: `test_id`, `schema_commit`, `test_project_id`, `account_role`, `company_id`, `endpoint`, `expected`, `observed`, `pass_fail`, and `reviewer`. Use synthetic identifiers in shared reports. A passing static CI run is not a substitute for these records.

## Deployment inventory and verification (2026-10-11)

| Component | Confirmed in staging? | Verification still required |
|---|---|---|
| Four foundation tables, RLS enabled | Yes, prior inspection | Recheck schema and grants before migrations |
| Six company/deal RLS policies | Yes, prior inspection | Authenticated owner/editor/viewer negative tests |
| Membership helper functions | Yes, prior inspection | Actual role-scoped execution |
| `create_my_company` RPC | **Unknown; do not assume installed** | Inspect function definition, grants and verified-email behavior |
| `list_my_companies` RPC | **Unknown; do not assume installed** | Inspect function and cross-tenant output |
| Scoped create/read/update/delete deal RPCs | **Not confirmed installed** | Inspect each deployed signature and test against RLS |
| Deal company reassignment trigger | **Not confirmed installed** | Inspect `pg_trigger` and run dual-owner test |
| Workspace picker frontend | Dev-branch preview only | Staging UI and sign-out tests |
| Customer billing/subscriptions | Not activated | Entitlements, webhook replay, cancellation and access tests |

**Installation safety:** GitHub passing tests mean only that draft files passed offline checks. Do not mark an item installed until a staging read-only inspection confirms its exact function/trigger definition. Because prior connector writes caused repeated authorization prompts, do not retry them automatically. The next staging step is a separately approved, consolidated operation, not a series of speculative permission requests.
