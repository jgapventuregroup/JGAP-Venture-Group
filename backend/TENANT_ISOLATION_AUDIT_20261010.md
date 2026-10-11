# JGAP tenant isolation — read-only production audit (2026-10-10)

**Status:** Findings only. No production SQL changes or deployments.

## Verified policies (pg_policies)
- `deals`: one `ALL TO authenticated` policy with both `USING is_company_member(company_id)` and `WITH CHECK is_company_member(company_id)`. This scopes rows to memberships, but permits any company member to INSERT/UPDATE/DELETE if table privileges allow it. There is no owner/editor/viewer distinction in this policy.
- `companies`: SELECT to authenticated, `is_company_member(id)`.
- `company_members`: SELECT if current user is that row's user or is a member of the company.
- `company_invitations`: SELECT for company members.

## Verified functions (pg_get_functiondef)
- `is_company_member(target_company_id)`: SECURITY DEFINER; checks `company_members.company_id = target_company_id` and `user_id = auth.uid()`. This is a legitimate membership lookup but should use a restricted search_path and explicit EXECUTE privileges in a future reviewed migration.
- `list_current_user_deals()`: SECURITY DEFINER; filters all deals by `is_company_member(d.company_id)`, but combines deals from every company the user belongs to. It is not a selected-workspace API.
- `create_current_user_deal_with_offer(...)`: SECURITY DEFINER; picks the first company membership by created_at, then inserts there. This can misfile customer deals when users have multiple workspaces.
- `bootstrap_current_user()`: SECURITY DEFINER; hardcodes `JGAP Venture Group LLC`. Existing users remain members; new paying customers cannot be onboarded by this function.

## Release blockers and decisions
1. **High:** Replace first-membership create/list RPC usage with explicit company ID APIs, and ensure frontend reads/updates are company scoped. Existing owner workspace must remain unchanged.
2. **High:** Define roles before inviting viewers. Existing deal policy allows every member to modify deals; role-based write restrictions need a migration and isolated-user integration tests.
3. **High:** Test RLS and privileged RPCs with two unrelated test users, two workspaces, and a multi-workspace member on an isolated no-cost test database. Static CI does not prove tenant isolation.
4. **High:** Audit other SECURITY DEFINER RPCs and direct table access before enabling subscriptions; the four functions reviewed here are not an exhaustive audit.
5. **Medium:** Review function EXECUTE grants and search_path hardening; never remove existing production privileges without a migration/rollback plan.

## Safe handling
Production inspection used SELECT on PostgreSQL metadata only. Draft SQL stays in the development branch. No migrations, policy updates, customer accounts, paid resources, or deployment were created.
