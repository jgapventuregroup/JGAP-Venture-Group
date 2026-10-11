-- STAGING ONLY. REVIEW AND TEST BEFORE EXECUTION.
-- Preserve tenant ownership even when a user has editor access in two workspaces.
-- This trigger intentionally rejects all company_id reassignment, including by admins.
-- The trigger function lives in a private schema and is not a public RPC.
-- Any future transfer workflow must be designed as a separate audited operation.
create or replace function jgap_private.prevent_deal_company_reassignment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.company_id is distinct from old.company_id then
    raise exception 'Deal company cannot be changed';
  end if;
  return new;
end;
$$;

revoke all on function jgap_private.prevent_deal_company_reassignment() from public,anon,authenticated;
-- Trigger invocation uses the table trigger mechanism, not direct RPC EXECUTE.

drop trigger if exists prevent_deal_company_reassignment on public.deals;
create trigger prevent_deal_company_reassignment
before update of company_id on public.deals
for each row
execute function jgap_private.prevent_deal_company_reassignment();

-- Integration tests required:
-- 1. Same-company owner/editor edits to other fields succeed.
-- 2. Direct UPDATE company_id to another company fails even for dual-company owner.
-- 3. UPDATE company_id to the existing value succeeds.
-- 4. Viewer and unrelated company member cannot edit.
-- 5. No production deployment without review.
-- 6. Verify trigger existence with pg_trigger and that its function resides in jgap_private.
-- 7. Verify the authenticated role cannot disable triggers or change table ownership.
