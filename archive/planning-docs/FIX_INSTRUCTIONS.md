# EMERGENCY FIX INSTRUCTIONS
## Get PedalPath Working in 15 Minutes

---

## PROBLEM EXPLAINED

Your upload flow is 99% complete but **database writes are blocked**.

**What Works:**
- ✅ File upload to Supabase Storage
- ✅ Image compression
- ✅ PDF conversion
- ✅ AI analysis code

**What's Broken:**
- ❌ Creating project records in database
- ❌ Creating schematic records
- ❌ Saving BOM data

**Why:**
Your database tables have Row Level Security (RLS) enabled but **no policies**. It's like having a locked door with no key.

---

## FIX #1: Apply Database Policies (5 MINUTES)

### Step 1: Copy the SQL

The SQL script is ready at `/tmp/apply_rls_policies.sql`

**OR** copy this directly:

```sql
-- ============================================================================
-- PROJECTS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can insert own projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own projects"
ON projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- SCHEMATICS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can insert schematics"
ON schematics FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = schematics.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own schematics"
ON schematics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = schematics.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own schematics"
ON schematics FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = schematics.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own schematics"
ON schematics FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = schematics.project_id
    AND projects.user_id = auth.uid()
  )
);

-- ============================================================================
-- BOM_ITEMS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can insert bom items"
ON bom_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = bom_items.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own bom items"
ON bom_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = bom_items.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own bom items"
ON bom_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = bom_items.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own bom items"
ON bom_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = bom_items.schematic_id
    AND projects.user_id = auth.uid()
  )
);

-- ============================================================================
-- ENCLOSURE_RECOMMENDATIONS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can insert enclosure recommendations"
ON enclosure_recommendations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = enclosure_recommendations.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own enclosure recommendations"
ON enclosure_recommendations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = enclosure_recommendations.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own enclosure recommendations"
ON enclosure_recommendations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = enclosure_recommendations.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own enclosure recommendations"
ON enclosure_recommendations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = enclosure_recommendations.schematic_id
    AND projects.user_id = auth.uid()
  )
);

-- ============================================================================
-- POWER_REQUIREMENTS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can insert power requirements"
ON power_requirements FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = power_requirements.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own power requirements"
ON power_requirements FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = power_requirements.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own power requirements"
ON power_requirements FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = power_requirements.schematic_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own power requirements"
ON power_requirements FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM schematics
    JOIN projects ON projects.id = schematics.project_id
    WHERE schematics.id = power_requirements.schematic_id
    AND projects.user_id = auth.uid()
  )
);
```

### Step 2: Go to Supabase Dashboard

1. Open browser: https://supabase.com/dashboard
2. Sign in to your account
3. Select the **PedalPath** project
4. Click **SQL Editor** in left sidebar

### Step 3: Paste and Run

1. Click **New Query** button
2. Paste the entire SQL script above
3. Click **Run** button
4. You should see: "Success. No rows returned"

### Step 4: Verify Policies Were Created

1. Go to **Authentication** → **Policies** in left sidebar
2. You should see policies listed for:
   - projects (4 policies)
   - schematics (4 policies)
   - bom_items (4 policies)
   - enclosure_recommendations (4 policies)
   - power_requirements (4 policies)

---

## FIX #2: Test Upload Flow (5 MINUTES)

### Test on Desktop

1. Open https://pedalpath-app.vercel.app
2. Sign in (or create account)
3. Go to Upload page
4. Select a schematic image (JPG or PNG)
5. Click Upload
6. **Expected**: Processing spinner → Success → BOM displayed

### Test on Mobile

1. Open https://pedalpath-app.vercel.app on phone
2. Sign in
3. Upload → Camera → Take photo of schematic
4. **Expected**: Upload succeeds, BOM generated

### If It Still Fails

Check browser console (F12 → Console) for errors. Copy error message and send to me.

---

## FIX #3: Check Anthropic API Key (2 MINUTES)

Your `.env.local` has a placeholder API key: `your_anthropic_api_key_here`

**This needs to be a real key for AI analysis to work.**

### Get Your API Key

1. Go to https://console.anthropic.com/
2. Sign in
3. Go to **API Keys**
4. Copy your key (starts with `sk-ant-api03-`)

### Update .env.local

```bash
cd /home/rob/git/pedalpath-v2/pedalpath-app
nano .env.local
```

Replace this line:
```
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

With your real key:
```
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

Save and restart dev server:
```bash
npm run dev
```

### Update Vercel Environment Variable

1. Go to https://vercel.com/dashboard
2. Select **pedalpath-app** project
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_ANTHROPIC_API_KEY`
5. Update with real key
6. Redeploy: `vercel --prod --yes`

---

## VERIFICATION CHECKLIST

After completing all fixes:

- [ ] RLS policies applied (check Supabase dashboard)
- [ ] Anthropic API key is real (not placeholder)
- [ ] Upload works on desktop
- [ ] Upload works on mobile
- [ ] BOM displays after upload
- [ ] No errors in browser console

---

## WHAT'S NEXT: Revenue Implementation

Once upload works, we implement:

1. **Stripe Integration** (Day 2)
2. **Pricing Tiers** (Day 3)
3. **Feature Gating** (Day 3)
4. **Landing Page Optimization** (Day 1-4)
5. **Launch** (Day 5)

See `REVENUE_SPRINT_5DAY.md` for detailed plan.

---

## IF YOU GET STUCK

**Error**: "Failed to create schematic record"
→ RLS policies not applied correctly

**Error**: "Invalid API key"
→ Anthropic API key is wrong or missing

**Error**: "Bucket not found"
→ Storage bucket not created (should be fixed already)

**Upload succeeds but no BOM**
→ AI analysis failing, check Anthropic API key

---

**TAKE ACTION NOW:**

1. Apply RLS policies (5 min)
2. Test upload (5 min)
3. Fix API key if needed (2 min)
4. Report back if it works or what error you see

Then we move to revenue implementation.
