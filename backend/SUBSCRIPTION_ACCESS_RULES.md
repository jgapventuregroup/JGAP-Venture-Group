# JGAP SaaS subscription access rules (design only)

This document is a design specification, not deployed billing enforcement. No payments are collected and no subscriptions are active.

## Trust boundary

Only a server-side verified payment-provider webhook may update billing status. Never trust browser-provided status, company ID, customer ID, price ID, or a checkout redirect as proof of payment. Resolve the authenticated company membership and entitlement server-side for every paid operation. Keep the existing JGAP owner's production workspace isolated from customer billing migrations.

## Status behavior

- `trialing`: permit paid features only before the verified trial expiration.
- `active`: permit paid features, subject to verified period/grace rules defined by the payment provider.
- `incomplete`, `incomplete_expired`, `unpaid`, `paused`, `canceled`: deny paid writes; offer billing management where appropriate.
- `past_due`: deny new paid writes by default until a documented grace policy is approved.
- unknown/missing status: deny paid writes.

Cancellation at period end is distinct from an already ended subscription: retain access until the provider-confirmed entitlement expiration if status remains active. Failed payment and recovery should be tested through provider test mode. Never delete saved deals when a subscription expires; preserve data with access restricted according to an approved retention policy.

## Before implementation

1. Choose a payment provider and obtain test-mode credentials through a secure operator flow; never commit secrets.
2. Decide pricing, trial, cancellation, taxes, refunds, and data-retention policy.
3. Add provider-customer/subscription mapping to staging with least-privilege RLS and server-only webhook processing.
4. Verify webhook signatures, replay resistance, duplicate delivery, event ordering, and cross-company mapping.
5. Test signup, checkout, activation, renewal, failure, cancellation, and reactivation with synthetic accounts.
6. Keep billing enforcement disabled on production until the full staging security and payment tests pass and deployment is explicitly approved.
