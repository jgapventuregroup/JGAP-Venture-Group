# JGAP SaaS release gates

**Status:** Not ready for public subscriptions. This is a release checklist, not approval to deploy.

## Gate A — account and workspace safety
- [ ] Replace hardcoded `bootstrap_current_user()` flow with explicit company selection and opt-in workspace creation.
- [ ] Keep existing JGAP owner/admin membership and all property records unchanged.
- [ ] Route all deal reads, creates, edits, and deletes through explicit `company_id` APIs.
- [ ] Audit and disable or safely replace legacy SECURITY DEFINER write functions that pick the first membership.
- [ ] Enforce viewer read-only rights at the database policy level, not just UI and RPC checks.
- [ ] Validate invitation role assignment and prevent privilege escalation.

## Gate B — verification
- [x] GitHub static test suite passes for current development branch (commit 3511a9e8, run 38091198746).
- [ ] Run isolated database tests with owner, admin, editor, viewer, outsider, and multi-company member.
- [ ] Test all direct Data API endpoints and old/new RPCs against unrelated company IDs.
- [ ] Verify original JGAP company data remains accessible after the proposed migration.
- [ ] Capture rollback plan and review database backup availability.

## Gate C — commercial readiness
- [ ] Add subscriptions only after workspace authorization is verified.
- [ ] Define trial, payment failure, cancellation, and entitlement behavior.
- [ ] Verify server-side subscription entitlements; client-only gating is insufficient.
- [ ] Document privacy, support, data export, and account deletion behavior.
- [ ] Keep JGAP Book manuscript, cover, and runtime outside customer app and public deployment.

## Deployment guardrail
No production SQL, production data edits, merge, public signup, or paid services without explicit approval. GitHub branch static tests alone cannot prove database isolation.
