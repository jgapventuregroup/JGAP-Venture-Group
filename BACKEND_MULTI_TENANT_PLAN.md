# JGAP multi-tenant backend implementation plan

Status: **DESIGN ONLY — NOT DEPLOYED**. Production Supabase was inspected read-only on 2026-10-10. Preserve the existing JGAP Venture Group LLC company, memberships and all deals.

## Confirmed baseline
- `public.companies(id uuid, name text, created_at timestamptz)`.
- `public.company_members(company_id uuid, user_id uuid, role text, created_at timestamptz)`.
- `public.company_invitations` supports company-scoped invitations.
- Core deal/property tables use company_id and RLS ownership through `is_company_member(company_id)`.
- `bootstrap_current_user()` hardcodes a company named `JGAP Venture Group LLC` and denies new users after the first member.
- Several frontend paths choose `company_members.limit(1)` without an explicit active-company choice.
- Some backend RPCs select the first membership for `auth.uid()`; they are ambiguous if a user has multiple company memberships.

## Safe target model
1. **Private existing workspace remains unchanged.** Never auto-enroll paying customers into JGAP Venture Group LLC.
2. **New customers receive a unique workspace** in a single atomic server-side operation: authenticated user -> insert a new company with user-provided validated name -> insert company_members role owner -> return company ID. Never accept an arbitrary owner user ID from the client.
3. **Existing members return their current workspace** during bootstrap; never create duplicates on refresh or repeated calls.
4. **Membership and ownership are server-verified.** New workspace creation must not bypass RLS for other users' companies. Restrict RPC EXECUTE grants; review function security and search_path. Never rely on user_metadata for roles.
5. **Explicit active workspace** is required before supporting multi-company accounts. Every company-scoped write and RPC must use the selected company ID and verify `is_company_member(selected_company_id)`; do not use an arbitrary first membership.
6. **Billing entitlement is separate from authorization.** Store subscription status server-side per company, update only from verified billing webhooks, and enforce access to paid features server-side. Existing JGAP private workspace can be grandfathered without changing its data.
7. **Signup and invitations:** signup creates an auth account; onboarding asks for a workspace name or accepts an invitation. Never silently grant access to an existing company.

## Implementation sequence (staging first)
A. Review all RPCs with SECURITY DEFINER, grants, RLS policies and uniqueness constraints. Decide whether self-service signup is enabled, and how existing owner accounts are migrated. No SQL changes until reviewed.
B. Add new RPC(s) for `create_my_company` and `get_my_companies`, with tests for anonymous users, invalid name, duplicate submission, and cross-tenant access. Do not change `bootstrap_current_user()` until the frontend is ready to handle the new response shape.
C. Add active-company selection and explicit tenant ID checks to every frontend call and backend RPC. Maintain compatibility for existing single-company users.
D. Run two-account tests in an isolated environment: A cannot read/write/delete B's deals, properties, documents, company members or subscriptions; invitations cannot be forged; B cannot access JGAP's private workspace.
E. After passing acceptance tests, stage controlled rollout and review rollback. Only then introduce paid checkout and webhooks.

## Blockers to resolve before implementation
- Determine existing constraints/triggers on companies and company_members; ensure new company creation is atomic and idempotent.
- Inventory RPCs that implicitly pick the first membership and all browser queries missing explicit company_id.
- Review whether RLS policy `is_company_member` and related SECURITY DEFINER grants are appropriate for public customer use.
- Determine which of 17 no-policy Deal Intelligence/Radar tables are backend-only and which need customer access.
- Verify browser session flows and error states with a test account, not the existing owner's account.

## Non-negotiable release gates
- No customer sees another customer's company or records.
- New customer onboarding cannot join the existing JGAP company.
- No browser-shipped service-role keys or browser-only subscription enforcement.
- Test accounts and staging data are isolated from production.
- Explicitly approved production migration with rollback and backups.

## Additional verified backend dependencies (2026-10-10)
- `companies` has a primary key on `id`; `company_members` has a composite primary key `(company_id,user_id)` and a nonunique `user_id` index. A user can technically belong to multiple companies. New onboarding must not assume one membership per user.
- The current `accept_current_user_company_invitation()` inserts an invitation's company membership and marks the invitation accepted. Therefore, the proposed `create_my_company` draft checks for pending invitations before creating a workspace. Invitation precedence and multi-company choice still require product review.
- The frontend currently invokes `bootstrap_current_user()` on dashboard rendering and labels new users `Authorization pending`. It does not yet call `create_my_company`. The new RPC must not be deployed alone with the expectation that onboarding automatically works.
- `list_current_user_company_access()` selects the first membership by creation time. It is another RPC requiring explicit workspace selection for future multi-company support.
- SQL draft `backend/staging_create_my_company.sql` is additive and remains unexecuted; test in isolated staging before any production use.

## CI validation (2026-10-10)
- GitHub Actions run 38088793250 succeeded on commit 622d8422b9f9258e6f4f817cc11d9e2c8e0c767d, including the static workspace SQL checks.
- These checks inspect draft SQL text. They do **not** execute the SQL, validate database permissions, or establish tenant isolation.
- Paid Supabase branching was declined. Continue no-cost review and CI checks; do not provision a paid branch.
