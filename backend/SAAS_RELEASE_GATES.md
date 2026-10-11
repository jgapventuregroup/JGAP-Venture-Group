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
- [x] GitHub static test suite passed at commit `3ea2d8a4d44a0676d5ac0255f7d0a88dc0b572dc` (run `38092754413`). This is not a database integration test.
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

## Current implementation inventory (development branch only)
- **Built, not database-deployed:** authenticated workspace list/create SQL drafts; explicit-company deal list/create/read/update/delete SQL drafts; browser workspace client and selector.
- **Preview only:** opt-in `?workspace_preview=1` company selector and read-only deal list. The legacy pipeline still uses its old data routes and must not be represented as tenant-isolated.
- **Not built:** secure production customer signup, server-enforced subscription billing, payment provider integration, support/account deletion workflows, and complete data export.
- **Critical blocker:** production deals RLS currently grants writes to any company member, and legacy SECURITY DEFINER functions may bypass the new role checks. Review and test all write paths before activation.
- **Testing constraint:** the user does not want extra expenses; do not provision a paid Supabase branch. An isolated free test project is an option only with explicit approval.

## Required owner decision before live activation
Provide a migration and rollback proposal, estimated cost (including $0 option if available), and a clear explanation of risks to existing JGAP properties. Request separate approval for any production database migration, merge, or payment activation.
