# JGAP staging workspace

This branch is reserved for staging-only customer workspace changes.

## Verification checkpoint (2026-10-11)
- Staging Supabase project: `qfszapteuxuogoselprp`
- Current local workspace checkpoint: `JGAP_Customer_Workspace_Tested_v4.html`
- Regression calculation suite: 9/9 passing locally (Node)
- JavaScript syntax: passing locally
- Browser sign-in and live customer workflow: **NOT VERIFIED**
- No production database changes authorized

## Release gates
1. Store only a publishable key in the browser; never commit secret/service-role credentials.
2. Test sign-in for both fictional customers on a hosted HTTPS staging URL.
3. Verify each customer cannot see, modify, or analyze the other's deals.
4. Verify the analyzer flags missing expense and financing inputs.
5. Validate navigation, sign-out, and error handling in a real browser.
6. Deploy to production only after explicit approval.

Do not treat a successful calculation regression suite as an end-to-end acceptance test.
