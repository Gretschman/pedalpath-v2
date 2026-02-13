# 💰 STRIPE, SUBSCRIPTIONS & COSTS - COMPLETE GUIDE

## 📊 EXECUTIVE SUMMARY

**Current Status**: Everything can remain FREE until you go live.

**Total Costs**:
- **Before Launch**: $0/month
- **After Launch (no customers)**: $0/month
- **After Launch (with customers)**: Only pay Stripe fees on actual revenue

**Revenue Potential**:
- 10 Pro subscribers = $190/month revenue - $18 Stripe fees = **$172/month profit**
- 50 Pro subscribers = $950/month revenue - $90 Stripe fees = **$860/month profit**
- 100 Pro subscribers = $1,900/month revenue - $180 Stripe fees = **$1,720/month profit**

---

## 🎯 PRICING MODEL (What You'll Charge)

### Free Plan
- **Price**: $0
- **Limit**: 1 schematic per month
- **Features**: Basic BOM generation, view build guides
- **Purpose**: Let users try before buying
- **Your Cost**: Nearly $0 (Supabase free tier covers this)

### Pro Plan (Recommended)
- **Price**: $19/month
- **Billing**: Recurring monthly subscription via Stripe
- **Features**: Unlimited schematics, full BOM, PDF exports, save projects
- **Your Revenue**: $19/month per subscriber
- **Stripe Fee**: ~$0.88 per month per subscriber (2.9% + $0.30)
- **Your Profit**: ~$18.12/month per subscriber

### Pay As You Go (One-Time)
- **Price**: $9 per upload
- **Billing**: One-time charge via Stripe
- **Features**: Single schematic analysis, 30-day access
- **Your Revenue**: $9 per transaction
- **Stripe Fee**: ~$0.56 per transaction
- **Your Profit**: ~$8.44 per transaction

---

## 💳 STRIPE COSTS (What You Pay Stripe)

### Stripe Fees
**Standard Pricing** (US):
- 2.9% + $0.30 per successful transaction
- No monthly fees
- No setup fees
- No hidden costs

**Examples**:
- $19 Pro subscription → You pay $0.88 to Stripe → You keep $18.12
- $9 one-time payment → You pay $0.56 to Stripe → You keep $8.44

**When You Pay**:
- Only when customers pay you
- Deducted automatically from each transaction
- Payouts to your bank account: every 2 business days (after initial hold period)

### Initial Hold Period
- First payout: 7-14 days after first sale (Stripe verification period)
- After that: Rolling 2-day payout schedule
- Example: Customer pays Monday → You get paid Wednesday

### Stripe Dashboard
- Free account at stripe.com
- No cost until you process payments
- Test mode is completely free (we'll use this first)

---

## 🗄️ DATABASE MIGRATION FOR SUBSCRIPTIONS

### What It Does
The subscription database migration creates these tables:

#### 1. **subscriptions** table
Tracks each user's subscription plan and limits.

**Fields**:
- `user_id` - Links to authenticated user
- `plan` - 'free', 'pro', or 'one-time'
- `status` - 'active', 'canceled', 'past_due', 'expired'
- `stripe_customer_id` - Stripe customer reference
- `stripe_subscription_id` - Stripe subscription reference
- `schematics_used_this_month` - Usage counter
- `schematics_limit` - Max uploads per month (1 for free, unlimited for pro)
- `current_period_start` / `current_period_end` - Billing period dates
- `cancel_at_period_end` - If user canceled but has time left

**Purpose**: Enforce usage limits and track what users can do.

#### 2. **payment_transactions** table
Records all payment history for accounting/support.

**Fields**:
- `user_id` - Who paid
- `subscription_id` - Links to subscription
- `stripe_payment_intent_id` - Stripe transaction reference
- `amount_cents` - Amount charged (in cents, e.g., 1900 = $19.00)
- `status` - 'pending', 'succeeded', 'failed', 'refunded'
- `payment_type` - 'subscription' or 'one-time'
- `created_at` - When payment occurred

**Purpose**: Complete audit trail of all revenue.

#### 3. **Database Functions**
- `can_user_upload()` - Checks if user has uploads remaining
- `increment_usage()` - Increments usage counter after upload
- `reset_monthly_usage()` - Scheduled function to reset counters monthly

**Purpose**: Enforce paywall logic automatically.

### Cost of Database Migration
**$0** - This just creates tables in your existing Supabase database.

---

## 🏗️ INFRASTRUCTURE COSTS

### Supabase (Database + Storage + Auth)

**Free Tier** (What you have now):
- 500MB database
- 1GB file storage
- 50,000 monthly active users
- 2GB bandwidth
- **Cost**: $0/month

**When You Need to Upgrade**:
- If you exceed 500MB of schematic files stored
- If you exceed 50,000 active users (you'd be making $19,000+/month at that point!)
- If you exceed 2GB bandwidth

**Pro Tier** (if needed later):
- 8GB database
- 100GB file storage
- **Cost**: $25/month
- You'd need 2 Pro subscribers to cover this cost

**Reality**: You can likely serve 100-500 customers on free tier before needing to upgrade.

---

### Vercel (Hosting)

**Free Tier** (What you have now):
- Unlimited projects
- 100GB bandwidth per month
- Serverless function executions
- **Cost**: $0/month

**When You Need to Upgrade**:
- If you exceed 100GB bandwidth (that's a LOT of traffic)
- If you need advanced features like web analytics

**Pro Tier** (if needed later):
- 1TB bandwidth
- **Cost**: $20/month
- You'd need 1-2 Pro subscribers to cover this

**Reality**: Free tier handles thousands of visitors per month easily.

---

### Anthropic Claude API (AI Analysis)

**Current Cost**:
- Claude 3.5 Sonnet: $3 per million input tokens, $15 per million output tokens
- Average schematic analysis: ~2,000 tokens = ~$0.05 per analysis

**Your Cost Per Upload**:
- Free tier users (1 upload/month): $0.05
- Pro users (assume 10 uploads/month): $0.50/month per user

**Example**:
- 10 Pro subscribers × 10 uploads each = 100 uploads = $5 in API costs
- Your revenue: 10 × $19 = $190
- Your costs: $5 API + $18 Stripe = $23
- **Your profit: $167/month**

**When You Need Prepaid Credits**:
- Anthropic requires credit card for API access
- You can start with $10 credit (200 analyses)
- Refill as needed

---

## 💰 COMPLETE COST BREAKDOWN

### Scenario 1: Before Launch (Testing)
| Service | Cost |
|---------|------|
| Supabase | $0 (free tier) |
| Vercel | $0 (free tier) |
| Stripe | $0 (test mode is free) |
| Claude API | $0 (use $5 free credit) |
| **Total** | **$0/month** |

### Scenario 2: Launch Day (0 customers)
| Service | Cost |
|---------|------|
| Supabase | $0 (free tier) |
| Vercel | $0 (free tier) |
| Stripe | $0 (no transactions yet) |
| Claude API | $0 (no usage yet) |
| **Total** | **$0/month** |

### Scenario 3: First 10 Pro Customers
| Item | Amount |
|------|--------|
| **Revenue** | |
| 10 Pro subscribers @ $19/month | $190.00 |
| **Costs** | |
| Stripe fees (2.9% + $0.30 × 10) | -$8.51 |
| Claude API (100 analyses @ $0.05) | -$5.00 |
| Supabase | $0.00 |
| Vercel | $0.00 |
| **Net Profit** | **$176.49/month** |

### Scenario 4: 50 Customers (Mix)
| Item | Amount |
|------|--------|
| **Revenue** | |
| 30 Pro subscribers @ $19/month | $570.00 |
| 20 one-time @ $9/upload | $180.00 |
| **Total Revenue** | $750.00 |
| **Costs** | |
| Stripe fees (~$22) | -$22.00 |
| Claude API (350 analyses) | -$17.50 |
| Supabase | $0.00 |
| Vercel | $0.00 |
| **Net Profit** | **$710.50/month** |

### Scenario 5: 100 Pro Customers
| Item | Amount |
|------|--------|
| **Revenue** | |
| 100 Pro subscribers @ $19/month | $1,900.00 |
| **Costs** | |
| Stripe fees | -$88.00 |
| Claude API (1000 analyses) | -$50.00 |
| Supabase Pro (might need) | -$25.00 |
| Vercel | $0.00 |
| **Net Profit** | **$1,737.00/month** |

---

## 🔧 IMPLEMENTATION STEPS (Zero Cost Until Live)

### Step 1: Setup Stripe Test Mode (FREE)
1. Create Stripe account at stripe.com
2. Stay in **Test Mode** (toggle in top-right)
3. Create products:
   - Pro Plan: $19/month recurring
   - One-Time: $9 one-time payment
4. Get test API keys (start with `sk_test_`)
5. Add test keys to Vercel environment variables

**Cost**: $0 (test mode is completely free)

### Step 2: Run Subscription Database Migration (FREE)
1. Run the SQL migration in Supabase
2. Creates tables: subscriptions, payment_transactions
3. Creates functions: can_user_upload(), increment_usage()

**Cost**: $0 (just creates tables in existing database)

### Step 3: Implement Paywall Logic (FREE)
1. Add subscription check before upload
2. Show pricing modal when limit reached
3. Integrate Stripe checkout
4. Handle webhook for subscription updates

**Cost**: $0 (just code changes)

### Step 4: Test with Stripe Test Cards (FREE)
Use Stripe test cards to simulate payments:
- `4242 4242 4242 4242` - Successful payment
- `4000 0000 0000 0002` - Declined payment
- Any future expiry date, any CVC

**Cost**: $0 (test transactions are free)

### Step 5: Go Live (REAL MONEY)
1. Switch Stripe to **Live Mode**
2. Get live API keys (start with `sk_live_`)
3. Update Vercel environment variables
4. First customer pays → You start earning!

**Cost**: Only Stripe fees on actual revenue

---

## ⚠️ IMPORTANT: KEEPING COSTS AT ZERO

### Until You Go Live:

**DO:**
- ✅ Use Stripe Test Mode (unlimited free testing)
- ✅ Use test credit cards (no real charges)
- ✅ Stay on Supabase free tier (plenty of room)
- ✅ Stay on Vercel free tier (plenty of bandwidth)
- ✅ Use Anthropic free API credits ($5 included)

**DON'T:**
- ❌ Switch Stripe to Live Mode yet
- ❌ Process real credit cards yet
- ❌ Upgrade Supabase or Vercel unnecessarily
- ❌ Add expensive AI models

### After You Go Live:

You'll only pay:
1. **Stripe fees**: Only when customers pay you (2.9% + $0.30)
2. **Claude API**: Only when analyses run (~$0.05 per upload)
3. **Infrastructure**: Only if you exceed free tiers (unlikely for first 100 customers)

---

## 📈 BREAK-EVEN ANALYSIS

### When Do You Break Even?

**Your First Customer**:
- Customer pays $19
- Stripe fee: -$0.88
- Claude API (10 uploads): -$0.50
- **Your profit: $17.62**

You're profitable from day one!

### Monthly Minimums

To cover potential infrastructure costs ($50/month if you upgrade everything):
- Need 3 Pro subscribers ($19 × 3 = $57)
- Or 6 one-time purchases ($9 × 6 = $54)

But remember: You won't need to upgrade infrastructure until you have 100+ customers, at which point you're making $1,700+/month.

---

## 🎯 RECOMMENDED PRICING STRATEGY

### For Launch:

**1. Start with Free + Pro**
- Offer free tier (1 schematic/month)
- Offer Pro ($19/month)
- Skip one-time initially (simpler)

**2. Conversion Funnel**
- Free users try the app
- Hit their limit after 1 upload
- See pricing modal: "Upgrade to Pro for unlimited"
- One-click to Stripe checkout
- Automatic upgrade after payment

**3. Pricing Psychology**
- $19/month is impulse-buy territory for hobbyists
- "Unlimited" is a strong value proposition
- Free tier removes risk ("try before buy")

### After Launch (Optimize Based on Data):

**If conversion is low**:
- Add one-time option ($9) for casual users
- Offer annual plan ($190/year = 2 months free)
- Add 14-day free trial for Pro

**If conversion is high**:
- Keep pricing the same
- Focus on features and marketing
- Consider raising prices for new customers

---

## 🚀 TIMELINE TO REVENUE

### Today: Fix Upload (Critical)
- Run EMERGENCY_FIX.sql
- Test upload with real file
- Verify BOM displays correctly
- **Time**: 10 minutes

### Tomorrow: Setup Stripe Test Mode
- Create Stripe account
- Add test products
- Get test API keys
- Add to Vercel environment
- **Time**: 30 minutes

### Day 2: Subscription Database
- Run subscription migration SQL
- Verify tables created
- Test database functions
- **Time**: 20 minutes

### Day 2-3: Implement Paywall
- Add subscription check before upload
- Show pricing modal when limit reached
- Integrate Stripe checkout
- Handle webhooks
- **Time**: 3-4 hours

### Day 3-4: Test Everything
- Test free tier limits
- Test upgrade flow with test cards
- Test webhook handling
- Test subscription cancellation
- **Time**: 2 hours

### Day 4-5: Go Live
- Switch Stripe to Live Mode
- Update environment variables
- Announce launch
- Get first paying customer
- **Time**: 1 hour

---

## 📋 STRIPE SETUP CHECKLIST

### Account Setup (Free)
- [ ] Create Stripe account at stripe.com
- [ ] Verify email address
- [ ] Stay in Test Mode
- [ ] Complete business profile (can do later)

### Products Setup (Free)
- [ ] Create product: "PedalPath Pro"
  - Price: $19/month
  - Recurring: Monthly
  - Description: "Unlimited schematic uploads and full features"
- [ ] Create product: "PedalPath One-Time" (optional)
  - Price: $9
  - One-time payment
  - Description: "Single schematic analysis"

### API Keys (Free)
- [ ] Copy Publishable Key (starts with `pk_test_`)
- [ ] Copy Secret Key (starts with `sk_test_`)
- [ ] Add to Vercel environment variables:
  - `VITE_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`

### Webhooks (Free)
- [ ] Add webhook endpoint: `https://pedalpath-app.vercel.app/api/stripe-webhook`
- [ ] Subscribe to events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Copy webhook signing secret
- [ ] Add to Vercel: `STRIPE_WEBHOOK_SECRET`

### Testing (Free)
- [ ] Use test card: 4242 4242 4242 4242
- [ ] Test successful payment
- [ ] Test declined payment
- [ ] Test subscription creation
- [ ] Test subscription cancellation

### Go Live (Real Money)
- [ ] Complete Stripe business profile
- [ ] Add bank account for payouts
- [ ] Switch to Live Mode
- [ ] Copy live API keys (start with `sk_live_`)
- [ ] Update Vercel environment variables
- [ ] Update webhook endpoint
- [ ] Test with real card (your own)
- [ ] Launch!

---

## 💡 KEY TAKEAWAYS

1. **Everything can stay FREE until you go live** with real payments
2. **Test mode is unlimited** - test as much as you want
3. **You're profitable from customer #1** - no minimum volume needed
4. **Costs scale with revenue** - you only pay when you earn
5. **Infrastructure is FREE** for first ~100 customers
6. **Break-even is instant** - first customer covers costs
7. **Timeline is 5 days** - from now to first dollar

---

## ❓ FAQ

**Q: Do I need to pay anything before launch?**
A: No. Everything can be tested for free.

**Q: What if I get no customers?**
A: You pay $0. No monthly fees, no minimums.

**Q: When do I need to upgrade Supabase/Vercel?**
A: Probably not for first 100+ customers, at which point you're making $1,700+/month.

**Q: Can I test Stripe without a credit card?**
A: Yes. Test mode doesn't require a credit card. You can test with fake cards.

**Q: What if I want to offer refunds?**
A: Stripe handles refunds. You don't get charged a fee on refunds.

**Q: Can I change prices later?**
A: Yes. New customers see new prices. Existing subscribers keep their price (unless you migrate them).

**Q: Do I need a business entity?**
A: Not initially. You can start as an individual. Stripe supports individuals.

**Q: What about taxes?**
A: Stripe can handle sales tax collection (additional setup). Consult an accountant for income tax.

**Q: Can I cancel Stripe anytime?**
A: Yes. No contracts, cancel anytime.

**Q: What if Stripe declines my account?**
A: Rare, but alternatives exist (PayPal, Square). Stripe is most common for SaaS.

---

## 📞 NEXT STEPS

1. **RIGHT NOW**: Run EMERGENCY_FIX.sql to fix upload
2. **AFTER UPLOAD WORKS**: We'll setup Stripe test mode (30 min)
3. **THEN**: Implement subscription database (20 min)
4. **THEN**: Implement paywall logic (3-4 hours)
5. **THEN**: Test everything (2 hours)
6. **THEN**: Go live and make money! 💰

---

**Questions?** Let me know what's unclear and I'll explain further.

**Ready to proceed?** Let's fix the upload issue first, then we'll tackle revenue.
