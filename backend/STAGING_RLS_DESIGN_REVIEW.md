# Staging RLS design — review required before execution

**Draft only. Not deployed.** Target only `JGAP SaaS Staging.` (`qfszapteuxuogoselprp`). Never run on production (`sfsyphmnzxaplundaljy`).

The foundation schema starts with RLS enabled and all customer grants revoked. Before installing SECURITY INVOKER deal RPCs, install narrowly scoped table permissions and policies. The following is a **review proposal**, not an executable migration.

## Required invariants

1. Every deal row belongs to one company. SELECT is allowed only to members of that company.
2. INSERT, UPDATE, DELETE are allowed only to owner, admin, or editor of that company; viewer is read-only.
3. An UPDATE must check both the old row and the resulting row. A user cannot move a deal into another company.
4. Company membership rows must never be directly writable by ordinary users; membership grants are controlled by a separately reviewed invitation/admin function.
5. Company creation must be atomic with owner membership, and must not rely on a frontend-selected role.
6. All SECURITY DEFINER functions must be inventoried and reviewed for explicit user and company checks. Never expose a privileged helper to anonymous callers.
7. User-facing RPCs must never silently choose the first company membership.
8. Authenticated users should not be granted direct access to invitations until invitation ownership and email confirmation are defined.

## Proposed helper design

- Use a narrow `public.is_company_member(uuid)` lookup helper for read policies. Because a membership table's own RLS policy cannot safely call itself, the helper may require SECURITY DEFINER; if so, move it to an unexposed schema and expose only a narrowly checked wrapper or use a secure JWT-independent pattern.
- Define a `can_write_company_deals(uuid)` helper that checks `auth.uid()` and membership role in `('owner','admin','editor')`. Avoid recursive RLS and make sure users cannot modify the underlying role.
- A `deals` SELECT policy uses membership, INSERT uses write role in WITH CHECK, UPDATE uses write role in both USING and WITH CHECK, and DELETE uses write role in USING.
- `companies` SELECT must be member-scoped; INSERT is restricted to a reviewed onboarding RPC. `company_members` SELECT must be restricted to the signed-in member or otherwise explicitly authorized company admins.
- Prefer SECURITY INVOKER RPCs; check that `authenticated` receives the minimum SELECT/INSERT/UPDATE/DELETE table grants necessary for invoker execution. Table grants do not replace RLS.
- Ensure default EXECUTE grants on new functions are revoked from PUBLIC and anon in the same deployment transaction.

## Required staging checks

- Verify policy behavior with actual signed-in JWTs, not SQL editor sessions using `postgres`.
- Attempt direct Data API writes as viewer and unrelated users, in addition to RPC calls.
- Attempt cross-company deal reassignment via UPDATE and a known deal UUID.
- Confirm that owner and editor CRUD works in their own workspace, viewer reads work, and revoked membership immediately removes access.
- Test invitation and onboarding races separately.
- Inspect all existing RPCs and function EXECUTE grants after migration.
- Capture results in `STAGING_AUTHORIZATION_MATRIX.md`.

**Status:** architecture review pending; no role-aware policies have been installed in staging. Do not advertise secure multi-tenancy until integration tests pass.
