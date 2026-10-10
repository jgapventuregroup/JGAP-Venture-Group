# JGAP Book — private product boundary

Decision (2026-10-10): The JGAP Book is a separate owner project, **not a feature of the customer-facing JGAP subscription app**.

## Release requirements
- Do not publish book chapters, manuscripts, drafts, or book editing interfaces in the customer app.
- Do not include the book in customer navigation, marketing entitlements, subscriptions, account onboarding, or ads.
- Do not migrate private book content into shared customer workspaces or public asset directories.
- Do not expose book content through anonymous or authenticated customer APIs.
- Keep existing book content intact while app work proceeds; any extraction or relocation needs separate review and owner approval.
- Preserve the owner's ability to work on and eventually publish the book as an independent product.

## Verification before customer launch
1. Inventory any current book routes, UI elements, storage, database tables, and static assets.
2. Verify customer accounts cannot open book screens or retrieve manuscript content, including by direct URL or API request.
3. Verify production builds do not ship unpublished manuscript content in public static bundles.
4. Confirm removing book access from the customer product does not delete the owner's manuscript or affect the real-estate tools.

**Status:** Policy documented only; inventory and technical enforcement pending. No production change authorized.
