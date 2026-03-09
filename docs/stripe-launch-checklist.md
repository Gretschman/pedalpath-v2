# Stripe Launch Checklist

**Status**: Pending — do not begin until component visualization and breadboard rendering are complete.

---

## Pre-Launch: Set 5 Environment Variables in Vercel Dashboard

Go to: Vercel Dashboard → pedalpath-app → Settings → Environment Variables

| Variable | Where to find it |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → (after creating endpoint below) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `VITE_APP_URL` | Set to `https://pedalpath.app` |
| `VITE_STRIPE_PRO_PRICE_ID` | Stripe Dashboard → Product catalog → Pro plan → Price ID |

---

## Register the Webhook

In Stripe Dashboard → Webhooks → Add endpoint:

- **Endpoint URL**: `https://pedalpath.app/api/stripe-webhook`
- **Events to listen for**: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

Copy the webhook signing secret → paste into `STRIPE_WEBHOOK_SECRET` env var above.

---

## Enable Quota Enforcement in Code

In `src/pages/UploadPage.tsx`, uncomment the 2 clearly marked lines. They are disabled to allow free use during development. Re-enabling them activates the upload quota check against the user's subscription tier.

```bash
# Find them with:
grep -n "STRIPE_LAUNCH" src/pages/UploadPage.tsx
```

---

## Post-Launch Verification

1. Make a test purchase with Stripe's test card (`4242 4242 4242 4242`)
2. Confirm webhook fires in Stripe Dashboard → Webhooks → recent events
3. Confirm user subscription tier updates in Supabase `users` table
4. Confirm quota enforcement kicks in after free tier limit
5. Test cancellation flow

---

## Pricing Model

- **Free tier**: Limited uploads per month (quantity TBD)
- **Pro**: Unlimited uploads, priority processing

Adjust limits in Supabase `plan_limits` table (or equivalent) — not hardcoded in frontend.
