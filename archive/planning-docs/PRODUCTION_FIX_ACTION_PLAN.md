# Production Fix Action Plan - Upload Failure Resolution

**Status**: CRITICAL - Upload failing with "Could not find the 'name' column of 'projects'"

**Root Cause**: Database schema mismatch - either:
1. Projects table doesn't exist
2. Projects table has wrong columns (title vs name)
3. Schema cache is stale

## IMMEDIATE ACTION REQUIRED

### Step 1: Diagnose Current Database State (2 minutes)

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project: `tudjjcamqxeybqqmvctr`
3. Go to **SQL Editor**
4. Open the file: `/home/rob/git/pedalpath-v2/CHECK_CURRENT_SCHEMA.sql`
5. Copy ALL contents and paste into SQL Editor
6. Click **Run**
7. **SCREENSHOT the results** and check:
   - Does projects table exist? (YES/NO)
   - What columns does it have? (Look for 'name' or 'title')
   - Are there any other tables?

### Step 2: Fix Database Schema (5 minutes)

1. Still in **SQL Editor** in Supabase
2. Open the file: `/home/rob/git/pedalpath-v2/VERIFY_AND_FIX_SCHEMA.sql`
3. Copy ALL contents
4. Paste into SQL Editor
5. Click **Run**
6. **Wait for it to complete** - should see "ALL DONE - DATABASE IS READY"
7. Verify the output shows:
   - All 5 tables created
   - RLS ENABLED for all tables
   - 4 policies per table

### Step 3: Generate TypeScript Types from Actual Database (3 minutes)

1. Still in Supabase Dashboard
2. Go to **Settings** → **API**
3. Find your **Project URL** and **anon/public key**
4. In SQL Editor, run this query to generate TypeScript types:

```sql
SELECT json_build_object(
  'projects', (
    SELECT json_agg(json_build_object(
      'name', column_name,
      'type', data_type
    ))
    FROM information_schema.columns
    WHERE table_name = 'projects'
    AND table_schema = 'public'
  )
);
```

5. Or go to **Database** → **Tables** → **projects** → **Definition** tab
6. Copy the schema

### Step 4: Update TypeScript Types (1 minute)

Based on Step 2, the schema should now be:

```typescript
export interface Project {
  id: string
  user_id: string
  name: string  // Changed from 'title' to 'name'
  description?: string
  schematic_url?: string
  status: 'draft' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}
```

I'll update this file now.

### Step 5: Verify Storage Bucket (1 minute)

1. In Supabase Dashboard
2. Go to **Storage**
3. Check if bucket named **schematics** exists
4. If NOT, run this in SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'schematics',
  'schematics',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
```

5. Verify storage policies exist:

```sql
SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%schematics%';
```

Should show 4 policies. If not, run COMPLETE_FIX_WITH_RLS.sql lines 27-47.

### Step 6: Deploy Fixed Code (2 minutes)

After completing steps 1-5, deploy:

```bash
cd /home/rob/git/pedalpath-v2/pedalpath-app
npm run build
vercel --prod --yes
```

### Step 7: Test Upload (1 minute)

1. Go to https://pedalpath-app.vercel.app/upload
2. Sign in
3. Upload FET_Driver.png
4. Open browser console (F12)
5. Verify you see:
   - "Starting upload process"
   - "Project created: [uuid]"  ← NEW LOG
   - "Upload successful"
   - "Process schematic result"
   - Redirect to results page

## Expected Console Output (Success)

```
Starting upload process: {fileName: 'FET Driver.png', ...}
Project created: abc123-def456-...
uploadSchematic called: ...
Upload successful, data: ...
Public URL generated: ...
Creating schematic record...
Schematic record created: xyz789-...
Analyzing with Claude Vision...
Analysis complete, saving BOM data...
Process schematic result: {success: true, schematicId: '...'}
```

## If Still Failing

If upload still fails after all steps:

1. Check browser console for exact error
2. In Supabase Dashboard → **Logs** → **Postgres Logs**
3. Look for errors related to projects or schematics insert
4. Screenshot and share

## Critical Files

- `/home/rob/git/pedalpath-v2/CHECK_CURRENT_SCHEMA.sql` - Diagnostic
- `/home/rob/git/pedalpath-v2/VERIFY_AND_FIX_SCHEMA.sql` - Complete fix
- `/home/rob/git/pedalpath-v2/pedalpath-app/src/types/database.types.ts` - Type definitions
- `/home/rob/git/pedalpath-v2/pedalpath-app/src/pages/UploadPage.tsx` - Upload logic

## Database Schema (After Fix)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,  -- THIS IS THE KEY COLUMN
  description TEXT,
  schematic_url TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Production Checklist

- [ ] Step 1: Run CHECK_CURRENT_SCHEMA.sql
- [ ] Step 2: Run VERIFY_AND_FIX_SCHEMA.sql
- [ ] Step 3: Verify 5 tables exist
- [ ] Step 4: Verify RLS enabled on all tables
- [ ] Step 5: Verify 4 policies per table
- [ ] Step 6: Verify storage bucket exists
- [ ] Step 7: Update TypeScript types
- [ ] Step 8: Build application (npm run build)
- [ ] Step 9: Deploy to Vercel
- [ ] Step 10: Test upload end-to-end

## Zero Tolerance Verification

After deployment, verify:
1. ✅ User can sign in
2. ✅ User can navigate to /upload
3. ✅ User can select file
4. ✅ Upload button works
5. ✅ Storage upload succeeds (check console)
6. ✅ Project record created (check console log)
7. ✅ Schematic record created (check console log)
8. ✅ Claude Vision analysis runs
9. ✅ BOM data saved
10. ✅ Redirect to results page works
11. ✅ Results page displays BOM

## Emergency Rollback

If anything fails:
1. Check Vercel deployment logs
2. Check Supabase Postgres logs
3. Revert to previous Vercel deployment
4. Contact me with exact error messages

## Cost Tracking

- Supabase: Free tier (no cost)
- Vercel: Free tier (no cost)
- Claude API: ~$0.01 per schematic analysis
- Total cost per upload: < $0.02

Expected usage: 100 uploads/month = $2/month
