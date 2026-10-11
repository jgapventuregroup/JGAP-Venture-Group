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

## Initial code inventory (2026-10-10)

Confirmed in `index.html` on the development branch:
- The page loads `./learning-book.js` and `./learning-book-runtime.js` using public `<script defer>` tags.
- `openJGAPLearningBook()` dynamically loads `learning-book-runtime.js` again.
- A `navLearningBook` button links to the book; the navigation ordering and page-renderer registry also reference it.

**Security implication:** Hiding the navigation button is not access control. Static files published through GitHub Pages remain directly retrievable. A customer build must not publish manuscript-bearing book files at all. Do not treat authentication checks in JavaScript as a substitute for separating assets.

**Required next change (not yet applied):** preserve the original book files in a private owner-controlled location, then produce a customer build that excludes the book scripts, navigation, dynamic loader, and manuscript-bearing static assets. Confirm no other module depends on the book globals before changing the live app. Because the current site may already publicly serve these files, the owner should treat previously published book content as potentially accessible.

**Do not delete or move the book files until a verified private copy exists.** This audit only records exposure paths; it does not alter production.

## Development branch inventory result

The development branch's recursive Git tree was reviewed on 2026-10-10 (48 tracked entries, not truncated). Its remaining book-named path is this audit document. The customer HTML no longer references the Learning Book, and the tracked book scripts, cover, and book-only GitHub workflow were deleted from this branch. CI verified the asset exclusions.

**Important limitations:** This inventory covers tracked repository paths, not every historical Git commit, cached public asset, or private Supabase storage/database record. GitHub Pages production remains on `main` until a separately approved deployment. Do not claim previously published book text is inaccessible or erased.
