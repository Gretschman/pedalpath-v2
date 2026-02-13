# PedalPath v2 - 5-Day Revenue Sprint Plan
## GET TO DOLLAR ONE

**Created**: February 13, 2026
**Deadline**: February 18, 2026 (5 days)
**Goal**: Launch monetized web app generating first revenue
**Critical Success Factor**: Seamless schematic upload → BOM generation → Payment conversion

---

## EXECUTIVE SUMMARY

**Current State**:
- Web app is 90% complete
- Upload flow BLOCKED by missing database policies (10 min fix)
- Core functionality works: image upload, AI analysis, BOM generation, visualizations
- NO payment system, NO pricing, NO conversion funnel

**What You HAVE**:
✅ React web app (mobile + desktop)
✅ Supabase backend (auth, storage, database)
✅ Claude Vision API integration
✅ Image compression & PDF conversion
✅ BOM generation & display
✅ Build guides (breadboard, stripboard, enclosure)
✅ Demo visualizations
✅ Production deployment on Vercel

**What You NEED for Revenue**:
❌ Database RLS policies (CRITICAL - 10 min)
❌ Stripe payment integration
❌ Pricing/feature tiers
❌ Paywall implementation
❌ Landing page conversion optimization
❌ Email collection for free tier

**Revenue Strategy**:
- **Free Tier**: 1 schematic/month, basic BOM, watermarked exports
- **Pro Tier**: $19/month, unlimited schematics, full features
- **One-time**: $9/schematic for non-subscribers

---

## DAY 1 (TODAY): UNBLOCK & TEST CORE FLOW

### Priority 1: Apply RLS Policies (10 minutes) ⚠️ CRITICAL
**Status**: SQL ready, needs manual application
**Action**: Apply `/tmp/apply_rls_policies.sql` to Supabase dashboard

**Steps**:
1. Go to https://supabase.com/dashboard
2. Select your PedalPath project
3. SQL Editor → Run the script
4. Verify policies created

**Testing After**:
- Sign in to app
- Upload test schematic (JPG/PNG)
- Verify BOM generated
- Check results page displays

**Estimated Time**: 10 minutes + 15 min testing = **25 minutes**

---

### Priority 2: End-to-End Flow Verification (1-2 hours)

**Test Checklist**:
- [ ] Desktop upload (Chrome, Safari, Firefox)
- [ ] Mobile upload - camera capture (iOS Safari)
- [ ] Mobile upload - photo roll (iOS Safari)
- [ ] Mobile upload - file picker (Android Chrome)
- [ ] Large image (>5MB) - compression works
- [ ] PDF upload - conversion works
- [ ] BOM displays correctly
- [ ] All 4 tabs work (BOM, Breadboard, Stripboard, Enclosure)
- [ ] Error handling works (bad image, API failure)

**Fix any critical bugs found**

**Estimated Time**: 1-2 hours

---

### Priority 3: Landing Page Conversion (2-3 hours)

**Current Landing Page**: Exists but not optimized for conversion

**Enhancements Needed**:

1. **Hero Section** - Clear value proposition
   ```
   "Upload Any Guitar Pedal Schematic.
    Get a Complete Build Guide in Minutes."

   [Upload Schematic] [See Demo]

   ✓ AI-Powered BOM Generation
   ✓ Step-by-Step Build Instructions
   ✓ Works on Phone, Tablet, Desktop
   ```

2. **Social Proof Section**
   ```
   "Join 500+ DIY Pedal Builders"
   [Demo schematic examples with thumbnails]
   ```

3. **Pricing Preview** (don't show full pricing yet)
   ```
   "Free: 1 schematic/month
    Pro: Unlimited builds starting at $19/month"

   [Get Started Free]
   ```

4. **How It Works** (3-step visual)
   ```
   1. Upload → 2. AI Analyzes → 3. Build
   [Visual diagram]
   ```

5. **Email Capture for Waitlist**
   ```
   "Join the Beta - Get Early Access"
   [Email input] [Join Waitlist]
   ```

**Files to Modify**:
- `/pedalpath-app/src/pages/LandingPage.tsx`

**Estimated Time**: 2-3 hours

---

**DAY 1 TOTAL**: 4-6 hours
**DAY 1 DELIVERABLE**: Working upload flow + conversion-optimized landing page

---

## DAY 2: STRIPE INTEGRATION & PRICING

### Priority 1: Stripe Setup (2-3 hours)

**Requirements**:
1. Create Stripe account
2. Get API keys (test + production)
3. Create products in Stripe Dashboard:
   - **Pro Monthly**: $19/month recurring
   - **Single Analysis**: $9 one-time payment

**Environment Variables**:
```bash
# Add to .env.local
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Installation**:
```bash
npm install @stripe/stripe-js stripe
```

**Estimated Time**: 2-3 hours

---

### Priority 2: Payment Flow Implementation (4-5 hours)

**New Files to Create**:

1. **`/pedalpath-app/src/components/payment/PricingModal.tsx`**
   ```typescript
   // Modal that shows when user tries to upload #2+ schematic
   // Shows pricing options:
   // - Pro Monthly: $19/month unlimited
   // - Pay Once: $9 for this schematic
   ```

2. **`/pedalpath-app/src/components/payment/StripeCheckout.tsx`**
   ```typescript
   // Stripe checkout form
   // Handles payment collection
   // Redirects to success page after payment
   ```

3. **`/pedalpath-app/api/create-checkout-session.ts`**
   ```typescript
   // Vercel serverless function
   // Creates Stripe checkout session
   // Returns session ID for redirect
   ```

4. **`/pedalpath-app/api/stripe-webhook.ts`**
   ```typescript
   // Handles Stripe webhooks
   // Updates user subscription status in database
   // Grants access after successful payment
   ```

**Database Changes**:
```sql
-- Add to Supabase
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL, -- 'free', 'pro', 'one-time'
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due'
  current_period_end TIMESTAMP,
  schematics_remaining INT DEFAULT 1, -- for free tier
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS policies
CREATE POLICY "Users can view own subscription"
ON subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

**Flow**:
```
User uploads schematic #1 → Success (free tier)
User uploads schematic #2 → Show PricingModal
User clicks "Pro Monthly" → Redirect to Stripe Checkout
User completes payment → Webhook updates subscription
User redirected back → Upload allowed
```

**Estimated Time**: 4-5 hours

---

**DAY 2 TOTAL**: 6-8 hours
**DAY 2 DELIVERABLE**: Stripe integrated, pricing enforced, payments working

---

## DAY 3: FEATURE GATING & USER LIMITS

### Priority 1: Usage Tracking (2-3 hours)

**Implementation**:

1. **Track Schematic Uploads**
   ```typescript
   // src/services/usage-tracker.ts
   export async function trackSchematicUpload(userId: string) {
     const { data: sub } = await supabase
       .from('subscriptions')
       .select('*')
       .eq('user_id', userId)
       .single();

     if (!sub) {
       // Create free tier subscription
       await supabase.from('subscriptions').insert({
         user_id: userId,
         plan: 'free',
         status: 'active',
         schematics_remaining: 1
       });
     }

     // Check if user has uploads remaining
     if (sub.plan === 'free' && sub.schematics_remaining <= 0) {
       return { allowed: false, reason: 'limit_reached' };
     }

     // Decrement counter for free tier
     if (sub.plan === 'free') {
       await supabase
         .from('subscriptions')
         .update({ schematics_remaining: sub.schematics_remaining - 1 })
         .eq('user_id', userId);
     }

     return { allowed: true };
   }
   ```

2. **Paywall Component**
   ```typescript
   // src/components/payment/Paywall.tsx
   // Shows when user hits limit
   // Presents upgrade options
   ```

3. **Usage Dashboard**
   ```typescript
   // Add to user settings page
   // Shows:
   // - Current plan
   // - Uploads remaining (free tier)
   // - Upgrade button
   ```

**Estimated Time**: 2-3 hours

---

### Priority 2: Feature Restrictions (2 hours)

**Free Tier Limitations**:
- ✅ 1 schematic per month
- ✅ Basic BOM generation
- ❌ No PDF export (show "Pro Only" badge)
- ❌ Watermarked visualizations
- ❌ No BOM editing
- ✅ View-only build guides

**Pro Tier Features**:
- ✅ Unlimited schematics
- ✅ PDF export
- ✅ High-res downloads
- ✅ BOM editing
- ✅ Priority support
- ✅ Save unlimited projects

**Implementation**:
```typescript
// src/hooks/useFeatureAccess.ts
export function useFeatureAccess() {
  const { subscription } = useSubscription();

  return {
    canUploadMore: subscription.plan !== 'free' || subscription.schematics_remaining > 0,
    canExportPDF: subscription.plan === 'pro',
    canEditBOM: subscription.plan === 'pro',
    canSaveProjects: subscription.plan === 'pro',
  };
}
```

**Estimated Time**: 2 hours

---

**DAY 3 TOTAL**: 4-5 hours
**DAY 3 DELIVERABLE**: Feature gating working, free tier limited, pro features locked

---

## DAY 4: POLISH & CONVERSION OPTIMIZATION

### Priority 1: Pricing Page (2-3 hours)

**Create**: `/pedalpath-app/src/pages/PricingPage.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────┐
│            Choose Your Plan                     │
├───────────────┬─────────────────┬───────────────┤
│     FREE      │    PRO MONTHLY  │   PAY AS YOU  │
│               │                 │      GO       │
│  $0/month     │   $19/month     │   $9/upload   │
│               │                 │               │
│ 1 schematic/  │ Unlimited       │ No commitment │
│ month         │ uploads         │               │
│ Basic BOM     │ Full BOM        │ Full features │
│ View guides   │ Edit BOM        │ Single use    │
│               │ PDF export      │               │
│               │ Save projects   │               │
│               │ Priority support│               │
│               │                 │               │
│ [Get Started] │ [Start Free    │ [Upload Now]  │
│               │  Trial]         │               │
└───────────────┴─────────────────┴───────────────┘

FAQ Section:
- Can I cancel anytime? Yes
- Is there a free trial? Yes, 7 days
- What payment methods? Credit card, PayPal
```

**Estimated Time**: 2-3 hours

---

### Priority 2: Onboarding Flow (2 hours)

**First-Time User Experience**:

1. **Sign Up** → Email verification
2. **Welcome Modal** → "You get 1 free schematic to try!"
3. **Upload Prompt** → "Upload your first schematic"
4. **Success** → "Great! Here's your BOM. Want unlimited? Go Pro."

**Implementation**:
```typescript
// src/components/onboarding/WelcomeModal.tsx
// Shows once per user after signup
// Explains free tier benefit
// CTA to upgrade
```

**Estimated Time**: 2 hours

---

### Priority 3: Email Collection & Marketing (2 hours)

**Goals**:
- Capture emails for marketing
- Build launch list
- Retarget non-converters

**Implementation**:

1. **Email Capture Form** (Landing Page)
   ```typescript
   // src/components/marketing/EmailCapture.tsx
   // Collects email before signup
   // Adds to mailing list (Mailchimp/SendGrid)
   ```

2. **Post-Upload Email** (Abandoned Cart)
   ```
   "You analyzed 1 schematic. Want unlimited access?
    Get 20% off Pro when you upgrade today."
   ```

3. **Drip Campaign**
   ```
   Day 1: Welcome email
   Day 3: Tips for better builds
   Day 7: Upgrade offer (20% off)
   Day 14: Case study from other builders
   ```

**Tools**:
- Mailchimp (free tier: 500 contacts)
- SendGrid (free tier: 100 emails/day)

**Estimated Time**: 2 hours

---

**DAY 4 TOTAL**: 6-7 hours
**DAY 4 DELIVERABLE**: Pricing page, onboarding flow, email marketing setup

---

## DAY 5: TESTING, DEPLOYMENT & LAUNCH

### Priority 1: Comprehensive Testing (3-4 hours)

**Test Scenarios**:

1. **Free User Flow**
   - [ ] Sign up
   - [ ] Upload schematic #1 → Success
   - [ ] View BOM
   - [ ] Try to upload #2 → Paywall shown
   - [ ] See pricing options

2. **Pro User Flow**
   - [ ] Click "Start Pro Trial"
   - [ ] Complete Stripe payment
   - [ ] Webhook processes correctly
   - [ ] Subscription status updated
   - [ ] Upload unlimited schematics
   - [ ] Access all pro features

3. **Pay-Per-Upload Flow**
   - [ ] Free user hits limit
   - [ ] Click "Pay $9 for this upload"
   - [ ] Complete payment
   - [ ] Upload allowed
   - [ ] Single-use credit applied

4. **Edge Cases**
   - [ ] Payment fails → Show error
   - [ ] Webhook fails → Manual fix
   - [ ] User cancels subscription → Features locked
   - [ ] User re-subscribes → Access restored

5. **Mobile Testing**
   - [ ] iOS Safari: Camera upload
   - [ ] iOS Safari: Photo roll upload
   - [ ] Android Chrome: Upload
   - [ ] Mobile payment flow (Stripe mobile)

**Estimated Time**: 3-4 hours

---

### Priority 2: Production Deployment (1-2 hours)

**Pre-Deployment Checklist**:
- [ ] Environment variables set in Vercel (production keys)
- [ ] Stripe webhook endpoint configured
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Analytics tracking added (Vercel Analytics, Google Analytics)
- [ ] Error tracking configured (Sentry)

**Deployment Steps**:
```bash
cd /home/rob/git/pedalpath-v2/pedalpath-app

# Build and test locally
npm run build
npm run preview

# Deploy to production
vercel --prod --yes

# Verify deployment
curl https://pedalpath-app.vercel.app
```

**Post-Deployment Verification**:
- [ ] Landing page loads
- [ ] Sign up works
- [ ] Upload works
- [ ] Payment works (test mode first, then live mode)
- [ ] Webhook receives events
- [ ] Database updates correctly

**Estimated Time**: 1-2 hours

---

### Priority 3: Soft Launch (1 hour)

**Soft Launch Strategy**:

1. **Friends & Family Beta** (Day 5)
   - Send to 10-20 trusted users
   - Offer free Pro access for feedback
   - Monitor for bugs

2. **Reddit Post** (Day 5 evening)
   - r/diypedals
   - r/guitarpedals
   - r/electronics
   - Post: "I built an AI tool that turns schematics into Lego-simple build guides"

3. **Twitter/X Launch** (Day 5 evening)
   - Share demo video
   - Show before/after (schematic → BOM)
   - Use hashtags: #guitarpedals #DIY #electronics

4. **Monitor Metrics**:
   - Sign-ups
   - Uploads
   - Conversions (free → pro)
   - Revenue

**Launch Post Template**:
```
🎸 I spent 6 weeks building PedalPath - an AI that turns guitar pedal
schematics into Lego-simple build instructions.

Just upload a schematic and get:
✓ Complete Bill of Materials
✓ Step-by-step build guide
✓ Visual breadboard/stripboard layouts

Try it free: https://pedalpath-app.vercel.app

[Screenshot/GIF of upload → BOM process]
```

**Estimated Time**: 1 hour

---

**DAY 5 TOTAL**: 5-7 hours
**DAY 5 DELIVERABLE**: Tested, deployed, launched, first users signing up

---

## REVENUE PROJECTIONS

### Conservative Estimate (Month 1)

**Traffic Sources**:
- Reddit posts: 5,000 views → 250 signups (5% conversion)
- Twitter: 1,000 views → 50 signups
- Word of mouth: 50 signups
- **Total Signups**: 350 users

**Conversion Funnel**:
- 350 signups
- 300 upload at least 1 schematic (85%)
- 50 try to upload schematic #2 (17%)
- 15 convert to Pro ($19/month) (30% of paywall hits)
- 10 pay for single upload ($9 each)

**Month 1 Revenue**:
- Pro subscriptions: 15 × $19 = $285/month
- One-time uploads: 10 × $9 = $90
- **Total Month 1**: $375

**Month 3 Revenue** (with growth):
- Pro subscriptions: 50 × $19 = $950/month
- One-time uploads: 30 × $9 = $270
- **Total Month 3**: $1,220/month

### Optimistic Estimate (Month 1)

**If viral on Reddit/Twitter**:
- 20,000 views → 1,000 signups
- 850 upload schematic (85%)
- 170 hit paywall (20%)
- 60 convert to Pro (35%)
- 40 pay-per-upload

**Month 1 Revenue (Optimistic)**:
- Pro subscriptions: 60 × $19 = $1,140/month
- One-time uploads: 40 × $9 = $360
- **Total Month 1**: $1,500

---

## COSTS & PROFIT MARGIN

### Monthly Operating Costs

**Infrastructure**:
- Vercel: $0 (free tier, then $20/month if needed)
- Supabase: $0 (free tier, then $25/month if needed)
- Stripe fees: 2.9% + $0.30 per transaction
- Total fixed costs: **$0-45/month**

**AI Costs** (Claude Vision API):
- $0.0045 per schematic analysis
- 300 uploads/month = $1.35
- 1,000 uploads/month = $4.50
- Total AI costs: **$1-10/month**

**Email Marketing**:
- Mailchimp/SendGrid: $0 (free tier)

**Total Monthly Costs**: $1-55/month

**Profit Margin**:
- Conservative (Month 1): $375 - $10 = **$365 profit**
- Optimistic (Month 1): $1,500 - $55 = **$1,445 profit**

**Break-Even**: Need ~3-4 Pro subscribers to cover costs.

---

## CRITICAL SUCCESS FACTORS

### Must-Have Features for Launch:
1. ✅ Seamless upload (mobile + desktop)
2. ✅ AI BOM generation
3. ✅ Basic build guides
4. ❌ **Stripe payment integration** (DAY 2)
5. ❌ **Pricing tiers enforced** (DAY 3)
6. ❌ **Landing page optimized** (DAY 1)

### Nice-to-Have (Defer if Needed):
- Advanced BOM editing
- Community features
- Shopping cart integration
- Video tutorials
- Mobile app (PWA)

### Marketing Channels (Priority Order):
1. **Reddit** - r/diypedals (25k members), r/guitarpedals (172k)
2. **Twitter/X** - #guitarpedals hashtag
3. **YouTube** - Demo video
4. **Forums** - DIYstompboxes, Freestompboxes
5. **Facebook Groups** - DIY guitar pedals

---

## RISK MITIGATION

### Technical Risks

**Risk**: Stripe integration breaks in production
**Mitigation**: Test in Stripe test mode first, use webhooks for reliability

**Risk**: AI costs spike with high usage
**Mitigation**: Implement rate limiting (10 uploads/hour per user), cache results

**Risk**: Database performance issues
**Mitigation**: Index user_id columns, use Supabase connection pooling

### Business Risks

**Risk**: Low conversion rate (free → pro)
**Mitigation**: A/B test pricing ($19 vs $15 vs $25), improve onboarding

**Risk**: High churn rate
**Mitigation**: Send monthly "you saved $X in parts" emails, add value

**Risk**: Competitors copy idea
**Mitigation**: Focus on UX, build community, iterate fast

---

## POST-LAUNCH PRIORITIES (Week 2+)

### Week 2: Optimization
- A/B test pricing page
- Improve conversion funnel
- Fix bugs reported by users
- Add more demo schematics

### Week 3: Growth
- Launch affiliate program (20% commission)
- Partner with parts suppliers (Tayda, Mouser)
- Create YouTube tutorials
- Email drip campaign

### Week 4: Features
- BOM editing for Pro users
- PDF export with branding
- Project sharing (social proof)
- Build progress tracking

---

## DAILY CHECKLIST

### Day 1 (Today):
- [ ] Apply RLS policies to Supabase
- [ ] Test upload flow end-to-end
- [ ] Fix any critical bugs
- [ ] Optimize landing page for conversion
- [ ] Add email capture form

### Day 2:
- [ ] Set up Stripe account
- [ ] Integrate Stripe checkout
- [ ] Create webhook endpoint
- [ ] Test payment flow
- [ ] Add pricing modal

### Day 3:
- [ ] Implement usage tracking
- [ ] Add feature gating
- [ ] Create paywall component
- [ ] Test free tier limits
- [ ] Test pro tier features

### Day 4:
- [ ] Create pricing page
- [ ] Add onboarding flow
- [ ] Set up email marketing
- [ ] Polish UI/UX
- [ ] Add analytics tracking

### Day 5:
- [ ] Comprehensive testing (mobile + desktop)
- [ ] Deploy to production
- [ ] Switch Stripe to live mode
- [ ] Soft launch (Reddit, Twitter)
- [ ] Monitor metrics

---

## SUPPORT & RESOURCES

### Documentation:
- Stripe Docs: https://stripe.com/docs
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs

### Example Code:
- Stripe React Integration: https://github.com/stripe-samples/react-subscription
- Supabase Auth: https://supabase.com/docs/guides/auth

### Communities:
- Stripe Discord: https://discord.gg/stripe
- Supabase Discord: https://discord.supabase.com
- r/SaaS: https://reddit.com/r/SaaS

---

## FINAL THOUGHTS

**You're closer than you think.** The hard part (the AI-powered schematic analysis) is done. Now it's just plumbing - connect Stripe, enforce limits, optimize for conversion.

**Focus on speed over perfection.** Ship the MVP, get real users, iterate based on feedback. The first $1 is the hardest. After that, it's about optimization.

**Your competitive advantage**: You're the only AI-powered guitar pedal build guide on the market. The niche is underserved. You just need to get it in front of the right people (Reddit guitarists).

**Let's build this.** Start with Day 1 right now. Apply those RLS policies, test the upload, and you'll have your first dollar within 5 days.

---

**Next Action**: Apply RLS policies at `/tmp/apply_rls_policies.sql` to your Supabase dashboard RIGHT NOW. Then come back and we'll tackle Day 1 tasks together.
