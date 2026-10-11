# Deal Analyzer tenant migration compatibility notes

Status: design review only. Existing UI and production RPCs remain unchanged.

The actual Deal Pipeline frontend calls list_current_user_deals() without arguments. Its result is grouped by deal status. A future multi-workspace UI should call list_company_deals(p_company_id) after resolving an active company.

The Deal Analyzer frontend calls create_current_user_deal_with_offer(...) with more fields than create_company_deal(...) currently accepts, including asking price, target offer price, offer notes, offer criteria, offer timing, seller, address and template. The draft create_company_deal function is therefore NOT a drop-in replacement for the real Analyzer. Do not switch the UI to it until a feature-complete tenant-aware replacement is implemented and tested.

Saving an existing deal uses a direct deals.update(...).eq('id',id) request. Before multi-workspace rollout, require a company_id filter and verify the update RLS policy uses both USING and WITH CHECK.

A safe migration should preserve all offer fields, return types and downstream follow-up updates. The current deal-with-offer RPC returns an ID used by the UI. Confirm the replacement response shape before updating the frontend.

Release blocker: explicit company selection must propagate through Deal Pipeline, Analyzer creation, edit/update, documents and property conversion. Static SQL checks are not evidence of actual tenant isolation.
