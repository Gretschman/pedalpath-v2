# PedalPath Revenue Implementation Guide
## Step-by-Step Instructions to Get From Broken to $$$

**Status**: Ready to implement
**Time Required**: 6-8 hours total
**Goal**: Working payment system generating revenue

---

## CURRENT SITUATION

**What Works:**
- ✅ Web app built and deployed
- ✅ AI analysis code ready
- ✅ Upload UI (mobile + desktop)
- ✅ BOM generation and display
- ✅ Build guide visualizations

**What's Broken:**
- ❌ Upload flow blocked (RLS policies missing)
- ❌ No payment system
- ❌ No revenue

---

## PHASE 1: FIX CRITICAL BLOCKER (15 minutes)

### Step 1.1: Apply RLS Policies

**Open Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your PedalPath project
3. Click **SQL Editor** → **New Query**

**Run this SQL:**
```sql
-- Copy from /tmp/apply_rls_policies.sql or from FIX_INSTRUCTIONS.md
-- Policies for: projects, schematics, bom_items, enclosure_recommendations, power_requirements
```

**Verify:**
- Go to **Authentication** → **Policies**
- Should see 20 policies created (4 per table × 5 tables)

---

### Step 1.2: Fix Anthropic API Key

**Check current key:**
```bash
cat /home/rob/git/pedalpath-v2/pedalpath-app/.env.local | grep ANTHROPIC
```

If it says `your_anthropic_api_key_here`, you need to replace it.

**Get real key:**
1. Go to https://console.anthropic.com/
2. Sign in
3. API Keys → Copy key (starts with `sk-ant-api03-`)

**Update locally:**
```bash
cd /home/rob/git/pedalpath-v2/pedalpath-app
nano .env.local
# Replace placeholder with real key
```

**Update in Vercel:**
1. https://vercel.com/dashboard
2. Select pedalpath-app → Settings → Environment Variables
3. Update `VITE_ANTHROPIC_API_KEY`
4. Redeploy: `vercel --prod --yes`

---

### Step 1.3: Test Upload

1. Go to https://pedalpath-app.vercel.app
2. Sign in
3. Upload → Select image → Wait
4. **Expected**: BOM generated successfully

**If it works**: ✅ Move to Phase 2
**If it fails**: Check browser console for error, fix, repeat

---

## PHASE 2: INSTALL STRIPE (30 minutes)

### Step 2.1: Install Dependencies

```bash
cd /home/rob/git/pedalpath-v2/pedalpath-app
npm install stripe @stripe/stripe-js
```

---

### Step 2.2: Create Stripe Account

1. Go to https://stripe.com
2. Sign up for account
3. Complete verification (can use test mode immediately)

---

### Step 2.3: Get API Keys

1. Stripe Dashboard → Developers → API Keys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)

---

### Step 2.4: Create Products

**In Stripe Dashboard → Products:**

1. **Product 1: Pro Monthly**
   - Name: "PedalPath Pro Monthly"
   - Description: "Unlimited schematic uploads and premium features"
   - Price: $19.00 / month (recurring)
   - Copy Price ID (starts with `price_xxx`)

2. **Product 2: One-Time Upload**
   - Name: "Single Schematic Analysis"
   - Description: "One-time schematic upload and BOM generation"
   - Price: $9.00 (one-time)
   - Copy Price ID (starts with `price_yyy`)

---

### Step 2.5: Add Environment Variables

**Local (.env.local):**
```bash
cd /home/rob/git/pedalpath-v2/pedalpath-app
nano .env.local
```

Add these lines:
```bash
# Stripe (Test Mode)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
VITE_STRIPE_PRO_PRICE_ID=price_xxxxx
VITE_STRIPE_ONETIME_PRICE_ID=price_yyyyy
VITE_APP_URL=http://localhost:5173

# Supabase Service Role (for webhook)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Get service role key:**
1. Supabase Dashboard → Settings → API
2. Copy "service_role" key (secret!)

**Vercel Environment Variables:**
1. https://vercel.com/dashboard
2. pedalpath-app → Settings → Environment Variables
3. Add all variables above (use production keys for VITE_STRIPE_PUBLISHABLE_KEY)
4. Set `VITE_APP_URL=https://pedalpath-app.vercel.app`

---

### Step 2.6: Configure Webhook

**After deploying to Vercel** (Step 3.3), come back here:

1. Stripe Dashboard → Developers → Webhooks
2. Add Endpoint
3. URL: `https://pedalpath-app.vercel.app/api/stripe-webhook`
4. Events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy **Signing Secret** (starts with `whsec_`)
6. Add to environment variables as `STRIPE_WEBHOOK_SECRET`

---

## PHASE 3: APPLY DATABASE MIGRATION (10 minutes)

### Step 3.1: Run Subscription Migration

1. Supabase Dashboard → SQL Editor → New Query
2. Copy contents of `/home/rob/git/pedalpath-v2/supabase/migrations/003_add_subscriptions.sql`
3. Run the script
4. Verify tables created:
   - subscriptions
   - payment_transactions
   - usage_events

---

### Step 3.2: Verify Functions Created

Run this to test:
```sql
-- Test can_user_upload function
SELECT * FROM can_user_upload('YOUR_USER_ID_HERE');

-- Should return: allowed = true, reason = 'free_tier', schematics_remaining = 1
```

---

## PHASE 4: INTEGRATE PAYWALL (2-3 hours)

### Step 4.1: Update Upload Page

**File**: `/pedalpath-app/src/pages/UploadPage.tsx`

Add imports:
```typescript
import { useSubscription } from '../hooks/useSubscription';
import { PricingModal } from '../components/payment/PricingModal';
import { useAuth } from '../contexts/AuthContext';
```

Add state and hooks:
```typescript
const { user } = useAuth();
const { subscription, hasUploadsRemaining, uploadsRemaining, checkUsage, incrementUsage } = useSubscription(user?.id);
const [showPricingModal, setShowPricingModal] = useState(false);
```

Before upload, check usage:
```typescript
const handleUpload = async (file: File) => {
  // Check if user can upload
  const usage = await checkUsage();

  if (!usage.allowed) {
    setShowPricingModal(true);
    return;
  }

  // Proceed with upload...
  const result = await processSchematic(projectId, file, userId);

  if (result.success) {
    // Increment usage counter
    await incrementUsage(result.schematicId);

    // Navigate to results
    navigate(`/results/${result.schematicId}`);
  }
};
```

Add pricing modal:
```typescript
<PricingModal
  isOpen={showPricingModal}
  onClose={() => setShowPricingModal(false)}
  onSelectPlan={handleSelectPlan}
  reason="limit_reached"
/>
```

Handle plan selection:
```typescript
const handleSelectPlan = async (plan: PricingPlan) => {
  // Redirect to Stripe checkout
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId: plan.stripePriceId,
      userId: user?.id,
      userEmail: user?.email,
      planType: plan.interval === 'month' ? 'subscription' : 'one-time'
    })
  });

  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe
};
```

---

### Step 4.2: Create Success Page

**File**: `/pedalpath-app/src/pages/PaymentSuccessPage.tsx`

```typescript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Redirect to upload after 5 seconds
    const timer = setTimeout(() => {
      navigate('/upload');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Your subscription is now active. Start building amazing pedals!
        </p>
        <button
          onClick={() => navigate('/upload')}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
        >
          Upload Schematic Now
        </button>
      </div>
    </div>
  );
}
```

Add route in `App.tsx`:
```typescript
<Route path="/success" element={<PaymentSuccessPage />} />
```

---

### Step 4.3: Create Pricing Page

**File**: `/pedalpath-app/src/pages/PricingPage.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PRICING_PLANS, PricingPlan } from '../types/subscription.types';
import { Check, Zap } from 'lucide-react';

export function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (plan.id === 'free') {
      navigate('/upload');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          userId: user.id,
          userEmail: user.email,
          planType: plan.interval === 'month' ? 'subscription' : 'one-time'
        })
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600">
            Start with a 7-day free trial. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg p-8 ${
                plan.recommended ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.recommended && (
                <div className="text-center mb-4">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Recommended
                  </span>
                </div>
              )}

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h2>
              <p className="text-gray-600 mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ${plan.price}
                </span>
                <span className="text-gray-500">
                  /{plan.interval === 'month' ? 'mo' : 'upload'}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  plan.recommended
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                {plan.id === 'free'
                  ? 'Get Started'
                  : plan.interval === 'month'
                  ? 'Start Free Trial'
                  : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Add route:
```typescript
<Route path="/pricing" element={<PricingPage />} />
```

---

## PHASE 5: DEPLOY & TEST (1 hour)

### Step 5.1: Build Locally

```bash
cd /home/rob/git/pedalpath-v2/pedalpath-app
npm run build
```

Fix any TypeScript errors.

---

### Step 5.2: Test Locally

```bash
npm run dev
# Open http://localhost:5173
```

Test flow:
1. Sign up new account
2. Upload schematic #1 → Should work
3. Try upload #2 → Pricing modal shows
4. Click "Start Free Trial" → Redirects to Stripe (test mode)
5. Use test card: `4242 4242 4242 4242`
6. Complete checkout → Redirected to success page
7. Try upload again → Should work (now Pro)

---

### Step 5.3: Deploy to Production

```bash
vercel --prod --yes
```

Verify deployment at https://pedalpath-app.vercel.app

---

### Step 5.4: Configure Stripe Webhook (if not done)

See Step 2.6 above.

---

### Step 5.5: Test on Production

1. Create new account on production
2. Go through full flow
3. Use Stripe test mode first
4. Switch to live mode when ready

---

## PHASE 6: GO LIVE (30 minutes)

### Step 6.1: Switch to Live Mode

1. Stripe Dashboard → Toggle "Test Mode" OFF
2. Get live API keys
3. Update Vercel environment variables with live keys
4. Redeploy

---

### Step 6.2: Soft Launch

**Post on Reddit** (r/diypedals):
```
Title: I built an AI tool that turns pedal schematics into IKEA-style build instructions

Body:
Hey builders! I spent 6 weeks building PedalPath - an AI-powered tool that analyzes guitar pedal schematics and generates complete build guides.

Just upload a schematic (or take a photo with your phone) and get:
✓ Complete Bill of Materials with supplier links
✓ Step-by-step build instructions
✓ Visual breadboard & stripboard layouts
✓ Enclosure drilling templates

Try it free: https://pedalpath-app.vercel.app

I'm offering a 7-day free trial for the Pro plan. Would love your feedback!

[Include screenshot or short GIF]
```

---

### Step 6.3: Monitor Metrics

Watch in real-time:
- Vercel Analytics: https://vercel.com/dashboard
- Stripe Dashboard: https://dashboard.stripe.com
- Supabase Database: Check subscriptions table

---

## TROUBLESHOOTING

### Upload still fails after RLS policies
- Check browser console for specific error
- Verify all 5 tables have policies (projects, schematics, bom_items, enclosure_recommendations, power_requirements)
- Check user is authenticated (console.log user ID)

### Stripe checkout fails
- Verify API keys are correct (test vs live mode)
- Check webhook endpoint is configured
- Look at Stripe logs: Dashboard → Developers → Logs

### Webhook not receiving events
- Verify webhook URL is correct
- Check signing secret matches
- Test webhook: Stripe Dashboard → Webhooks → Send test event

### Payment succeeds but subscription not updated
- Check webhook logs in Vercel
- Verify SUPABASE_SERVICE_ROLE_KEY is set
- Check subscriptions table manually in Supabase

---

## CHECKLIST

### Phase 1: Fix Upload
- [ ] RLS policies applied
- [ ] Anthropic API key configured
- [ ] Upload tested and working

### Phase 2: Stripe Setup
- [ ] Stripe account created
- [ ] Products created (Pro $19, One-time $9)
- [ ] API keys copied
- [ ] Environment variables set
- [ ] Webhook configured

### Phase 3: Database
- [ ] Migration 003 applied
- [ ] Subscription tables created
- [ ] Functions tested

### Phase 4: Integration
- [ ] Stripe SDK installed
- [ ] PricingModal integrated
- [ ] Checkout flow working
- [ ] Success page created
- [ ] Pricing page created

### Phase 5: Testing
- [ ] Local testing complete
- [ ] Deployed to production
- [ ] Production testing complete
- [ ] Webhook verified

### Phase 6: Launch
- [ ] Switched to live mode
- [ ] Reddit post published
- [ ] Metrics monitored
- [ ] First dollar earned 🎉

---

## NEXT STEPS AFTER LAUNCH

### Week 2: Optimization
- A/B test pricing ($15 vs $19 vs $25)
- Add more demo schematics to landing page
- Improve conversion funnel
- Add testimonials from beta users

### Week 3: Growth
- YouTube demo video
- Twitter launch thread
- Email drip campaign
- Affiliate program (20% commission)

### Week 4: Features
- BOM editing for Pro users
- PDF export with custom branding
- Project sharing
- Build progress tracking

---

**READY TO START?**

1. Apply RLS policies (15 min)
2. Test upload works
3. Set up Stripe account (30 min)
4. Apply database migration (10 min)
5. Integrate paywall (2-3 hours)
6. Deploy & test (1 hour)
7. Launch! 🚀

You're 5-8 hours away from your first dollar.

Let's go!
