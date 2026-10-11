# JGAP offline backend validation

No paid Supabase staging branch is required for these checks. These are static regression checks only, not database integration tests.

## Scope
- Check draft SQL uses authenticated identities rather than user-supplied user IDs.
- Confirm explicit company IDs and membership checks on deal operations.
- Confirm anonymous execute access is revoked.
- Check existing frontend calls still rely on legacy company selection so rollout cannot be assumed safe.
- Preserve production data and do not deploy draft SQL.

## Run locally
`node --test tests/workspace-backend.test.cjs`

## Limits
Static checks cannot prove row-level security, transaction correctness, SQL execution, or isolation between real accounts. A free local PostgreSQL/Supabase environment could be used later if available, but must be initialized with schema and fake accounts only.
