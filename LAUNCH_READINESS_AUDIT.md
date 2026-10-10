# JGAP launch-readiness audit — 2026-10-10

Scope: static repository inspection and GitHub Actions tests on draft branch `audit/safe-css-fix-20261010`. This is **not** a browser end-to-end test or a production security certification.

## Verified in repository
- GitHub Pages-style static frontend, with the main UI and many functions in a single ~335 KB `index.html`.
- Supabase client initialization, email/password sign-in, account sign-up, auth-state listener.
- Deal Analyzer, deal-saving function, offer inputs, and multiple supporting JS modules (Deal Radar/importer, CELOC, book, laundromat, etc.).
- Automated Node tests for analyzer, CELOC and Deal Intelligence; **32 tests passed** on GitHub Actions at commit `24233e87ecd5d87f31947d4ff8b13954a32ea720`.
- Draft PR #73 isolates ongoing fixes; production main has not been changed by this audit.

## Launch blockers / unverified items, in priority order
1. **Multi-tenant data isolation — critical, not verified.** Supabase authentication exists, but source code alone cannot establish that all customer-facing tables have correct RLS policies, ownership columns, and storage access policies. Review policies for each user-data table and test two isolated accounts before selling access. Do not modify production policies without a reviewed migration and rollback plan.
2. **Browser end-to-end reliability — critical, not verified.** Test fresh sign-up, email confirmation, sign-in, session refresh, navigation, new deal, edit/reopen/save, and sign-out on desktop and mobile. Node mocks validate calculations but not actual clickability, browser runtime, or database permissions.
3. **Subscription billing and entitlement enforcement — missing in inspected frontend.** No Stripe/checkout/subscription integration was found in `index.html`. Before SaaS sales, decide trial, pricing, billing provider, webhooks, account lifecycle, and server-side entitlement checks. Never trust a browser-only paywall.
4. **Financial correctness and usability — partially verified.** Analyzer unit/regression tests are passing. Validate realistic full-deal cases against independent spreadsheet/manual calculations and inspect error messaging in the browser.
5. **Maintainability — material risk, not an immediate reason to rebuild.** The ~335 KB monolithic `index.html` increases regression risk. Extract independently testable logic incrementally after critical workflows are proven; preserve existing data and user-visible features.
6. **Operational readiness — unverified.** Review error reporting, backup/recovery, privacy terms, support contact, cancellation/refunds, and monitoring before accepting paying customers.

## Recommended execution order
- **Phase A: safety and baseline.** Inventory database tables/policies read-only, audit auth boundaries, and create a browser acceptance checklist with pass/fail evidence.
- **Phase B: fix actual failures.** Reproduce and repair end-to-end blockers; expand tests for any confirmed defects.
- **Phase C: paid launch.** Implement payment checkout and verified webhooks, entitlement enforcement, cancellation lifecycle, and production-safe rollout.
- **Phase D: gradual modularization.** Move calculation and UI components out of `index.html` behind tests; do not rewrite everything in Bubble or restart from scratch.

## Release gate
Do **not** merge PR #73 or onboard paying customers until data isolation, browser smoke tests, and billing enforcement are verified. No changes to production Supabase data or production branch were made by this report.

## Live Supabase read-only security findings (2026-10-10)
- Inspected project `sfsyphmnzxaplundaljy` using read-only metadata SQL and the Supabase security advisor. **No database mutations.**
- All public tables returned by the metadata query had RLS enabled. Core `deals`, `properties`, and related operational tables have `is_company_member(company_id)` access policies. This is encouraging but does not substitute for an authenticated two-account isolation test.
- Supabase advisor reports **17 tables with RLS enabled but no policies**, chiefly Deal Intelligence and Radar support tables. These default-deny for ordinary API users; determine whether they are intentionally backend-only or missing necessary client policies. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- Advisor also reports **63 authenticated-executable SECURITY DEFINER functions**. This is a review list, not proof of exploitability. Audit grants, search paths, argument validation and tenant checks before public onboarding. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- **Confirmed customer onboarding design blocker:** `public.bootstrap_current_user()` looks up a company by hard-coded name `JGAP Venture Group LLC`, creates it if absent, and returns `not_authorized` for newly signed-in users once membership exists. It does **not** provision a separate tenant/company per customer. Preserve the existing private company and its data. Design a safe self-service tenant-creation/invitation flow with isolated ownership and verified RLS before subscriptions.
- `create_current_user_deal_with_offer()` selects the first company membership for the current authenticated user, which may be ambiguous if users can join multiple organizations; address during tenant onboarding design.
- Recommended immediate action: keep public self-service sales disabled; draft and review tenant model, then test with two distinct test accounts. Do not loosen RLS to make onboarding work.
