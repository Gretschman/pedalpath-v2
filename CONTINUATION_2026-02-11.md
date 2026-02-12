# PedalPath v2 - Continuation Document
**Date**: February 11, 2026
**Session Focus**: Phase A Upload Reliability & Storage/Database Setup

---

## Current Status Summary

### ✅ Completed
1. **Phase 3 Visualizations** - All demo visualizations completed:
   - BreadboardGrid component with 63×10 grid and demo components
   - StripboardView with dual-view toggle (component/copper sides)
   - Enhanced EnclosureGuide with real dimensions and printable drill templates

2. **Phase A Upload Improvements** - All code implemented and deployed:
   - Image compression (reduces to max 1MB using canvas)
   - PDF-to-image conversion (frontend using PDF.js)
   - Timeout handling (60s with AbortController)
   - Retry logic (3 attempts with exponential backoff)
   - API endpoint proxy configuration
   - "Forgot Password" functionality added to signin page

3. **Storage Bucket Created**:
   - Supabase storage bucket "schematics" has been created
   - RLS policies configured for storage (INSERT, SELECT, UPDATE, DELETE)
   - File uploads to storage are now working ✅

### ❌ Current Blocker: Database RLS Policies Missing

**Issue**: Upload fails at database record creation with error:
`"Failed to create schematic record"`

**Root Cause**: Database tables (`schematics`, `projects`, `bom_items`, etc.) don't have Row Level Security (RLS) policies configured. Users can't insert/update/select records.

**Test Result**:
- ✅ File upload to Supabase storage: **WORKING**
- ❌ Database record creation: **BLOCKED by RLS**

---

## Immediate Next Steps

### Step 1: Configure Database RLS Policies

Go to Supabase dashboard → SQL Editor and run the following SQL to create all necessary RLS policies:

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

### Step 2: Test Upload Again

After running the SQL above:

1. Go to http://localhost:5174/upload (or https://pedalpath-app.vercel.app/upload)
2. Sign in with your account
3. Upload a test schematic (JPG, PNG, or PDF)
4. Watch the console for errors
5. **Expected result**: Upload should complete successfully and redirect to results page

### Step 3: If Still Issues

Check for any remaining errors and verify:
- All tables have RLS enabled
- Policies are active (check Supabase dashboard → Authentication → Policies)
- User is properly authenticated (check auth.uid() is not null)

---

## Files Modified in This Session

### New Files Created:
1. **`/pedalpath-app/src/utils/image-utils.ts`**
   - Image compression function (max 1MB)
   - PDF-to-image conversion using PDF.js
   - `prepareFileForUpload()` main entry point

2. **`/pedalpath-app/src/components/visualizations/BreadboardGrid.tsx`**
   - 63×10 breadboard grid SVG component
   - Demo components placement

3. **`/pedalpath-app/src/components/visualizations/StripboardView.tsx`**
   - Dual-view stripboard (component/copper)
   - Toggle between views

### Modified Files:

1. **`/pedalpath-app/src/contexts/AuthContext.tsx`**
   - Added `initializeStorageBucket()` import
   - Calls bucket initialization on app startup
   - Added `resetPassword()` function

2. **`/pedalpath-app/src/services/storage.ts`**
   - Added detailed console logging for debugging
   - Improved error messages with setup instructions
   - Enhanced error handling for missing bucket

3. **`/pedalpath-app/src/services/claude-vision.ts`**
   - Added `fetchWithTimeout()` with 60s timeout
   - Implemented retry logic (3 attempts, exponential backoff)
   - Added error classification for retryable errors

4. **`/pedalpath-app/src/components/schematic/SchematicUpload.tsx`**
   - Integrated `prepareFileForUpload()` for compression/conversion
   - Added processing status feedback
   - Enhanced user feedback during upload

5. **`/pedalpath-app/src/components/guides/EnclosureGuide.tsx`**
   - Added real enclosure dimensions
   - Added printable drill template (1:1 scale SVG)
   - Added enclosure size selector

6. **`/pedalpath-app/src/pages/SignInPage.tsx`**
   - Added "Forgot Password" link
   - Added `handleForgotPassword()` function
   - Added session cleanup on mount

7. **`/pedalpath-app/vite.config.ts`**
   - Added proxy configuration for `/api` routes

---

## Known Issues

### Issue 1: Auth Error on Signin Page (Low Priority)
**Status**: Not fixed yet
**Description**: Header 'Authorization' has invalid value error sometimes appears on signin page
**Impact**: Cosmetic - doesn't block functionality
**Next Action**: Investigate and suppress properly

---

## Environment & Credentials

- **Supabase URL**: `https://tudjjcamqxeybqqmvctr.supabase.co`
- **Project Directory**: `/home/rob/git/pedalpath-v2`
- **App Directory**: `/home/rob/git/pedalpath-v2/pedalpath-app`
- **Production URL**: https://pedalpath-app.vercel.app
- **Local Dev**: http://localhost:5174/ (port 5173 is in use, so Vite uses 5174)

### Environment Variables (in `.env.local`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ANTHROPIC_API_KEY`
- `VERCEL_OIDC_TOKEN`

---

## Testing Checklist

Once RLS policies are configured:

- [ ] Upload JPG schematic - should work
- [ ] Upload PNG schematic - should work
- [ ] Upload PDF schematic - should convert and work
- [ ] Large image (>1MB) - should compress and work
- [ ] View results page after upload - should show BOM data
- [ ] Test on mobile device - should work seamlessly
- [ ] Test on desktop - should work seamlessly

---

## Phase B (Future Enhancement Ideas)

Once core upload is working reliably:

1. **Better Error Messages**: User-friendly error displays
2. **Progress Indicators**: Real-time upload/analysis progress
3. **Image Validation**: Check file type/size before processing
4. **Thumbnail Preview**: Show preview before upload
5. **Retry UI**: Allow user to retry failed uploads
6. **Cancel Upload**: Allow user to cancel in-progress uploads

---

## Tech Stack Reference

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Lucide Icons
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: Claude Vision API (Anthropic)
- **Deployment**: Vercel (frontend + serverless functions)
- **Image Processing**: Canvas API + PDF.js

---

## Quick Start Commands

```bash
# Navigate to project
cd /home/rob/git/pedalpath-v2/pedalpath-app

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod --yes

# Git commands
git status
git add -A
git commit -m "message"
git push origin main
```

---

## Important Notes

1. **Storage Bucket Configuration**:
   - Bucket name: `schematics`
   - Public: ❌ (private)
   - File size limit: 10MB
   - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, application/pdf
   - RLS policies: ✅ Configured for authenticated users

2. **File Upload Flow**:
   ```
   User selects file
   ↓
   prepareFileForUpload() - compress/convert if needed
   ↓
   uploadSchematic() - upload to Supabase storage ✅ WORKING
   ↓
   processSchematic() - create DB record ❌ BLOCKED (needs RLS)
   ↓
   analyzeSchematic() - Claude Vision analysis
   ↓
   Save BOM data to database
   ↓
   Redirect to results page
   ```

3. **User Folder Structure**:
   - Files stored at: `storage/schematics/{userId}/{timestamp}-{filename}`
   - Each user can only access their own files (enforced by RLS)

---

## Contact & Support

- GitHub Repo: https://github.com/Gretschman/pedalpath-v2
- Issues: https://github.com/Gretschman/pedalpath-v2/issues

---

**Next Session**: Run the RLS policy SQL script, test upload, then proceed with remaining features or Phase B enhancements.
