# JGAP staging RPC compatibility review — 2026-10-10

**Offline code review only. No Supabase writes.** Staging project `qfszapteuxuogoselprp`, production `sfsyphmnzxaplundaljy`.

## Reviewed against installed foundation table draft

- `list_my_companies()`: expects `company_members.company_id,user_id,role,created_at` and `companies.id,name`. All present in staging foundation. Depends on member-self and company-member SELECT policies.
- `get_company_deal(uuid,uuid)`: expects `deals.id,company_id` and `is_company_member(uuid)`. All present in foundation/policy install.
- `create_company_deal(...)`: expects core financial and address fields, all present. Requires invoker grants and role-scoped deal INSERT RLS.
- `create_company_deal_with_offer(...)`: offer fields and core fields present. Requires actual signed-in tests.
- `update_company_deal(uuid,uuid,jsonb)`: allowlist columns present in foundation. **Open risk:** dynamic `jsonb_populate_record` expression and JSON null behavior must be exercised in PostgreSQL before activation. Do not mark verified.
- `delete_company_deal(uuid,uuid)`: depends on existing role-scoped DELETE policy and explicit company filter. Requires test accounts.
- `create_my_company(text)`: inserts company and owner membership using SECURITY DEFINER. **Open risk:** production-style company onboarding must be reviewed for email verification, invitation behavior, and atomicity. No public signup until tested.

## Current database facts

Four tables and six RLS policies were verified present in staging. A private role helper and public membership wrapper were verified with anonymous execution denied. **The subsequent RPC installation encountered permission approvals; installation status is unknown.** Do not retry connector writes automatically. The operator must verify existing functions with a read-only inventory before any further migration.

## Acceptance gates

1. Read-only catalog query establishes which RPCs are actually installed.
2. Resolve function signatures and default EXECUTE grants.
3. Create throwaway signed-in users in staging only; do not use production credentials.
4. Test company A vs company B, viewer read-only, editor CRUD, cross-company UUID access, reassignment and JSON patch validation.
5. Verify a legacy RPC cannot bypass the selected-company boundary.
6. No billing, public signup, production merge or customer launch before these pass.
