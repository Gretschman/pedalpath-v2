# PedalPath v2 - Continuation Plan

**Date**: 2026-02-04
**Status**: Phase 2 (iOS Fix) - Critical Backend Migration Complete
**Next Session**: Phase 1 & 3 Implementation

---

## 🚨 IMPORTANT: Deployment Failed (Expected)

The GitHub push triggered auto-deploy on Vercel, which **failed** because the `ANTHROPIC_API_KEY` environment variable isn't configured yet.

**First thing tomorrow**: Add the API key to Vercel and redeploy (instructions below).

**Deployment error**: https://vercel.com/robert-frankels-projects/pedalpath-v2/2AQpWKJZZ2SfQoBDrpuVTh9ZQb6u

---

## What Was Completed Tonight

### Phase 2: iOS Backend Migration (CRITICAL - COMPLETED)
✅ **Task 1**: Created `/pedalpath-app/api/analyze-schematic.ts` - Vercel serverless endpoint
✅ **Task 2**: Updated `/pedalpath-app/src/services/claude-vision.ts` - Now calls backend API
✅ **Task 3**: Configured `/pedalpath-app/vercel.json` - API routing and CORS headers
✅ **Task 4**: Updated `/pedalpath-app/package.json` - Added @vercel/node dependency

**Key Changes**:
- Removed `dangerouslyAllowBrowser: true` from client-side code (line 19 issue)
- Removed client-side `VITE_ANTHROPIC_API_KEY` usage
- Backend now handles all Anthropic API calls securely
- CORS headers configured for iOS Safari WebKit compatibility
- API endpoint returns same SchematicAnalysisResponse structure

**What This Fixes**:
- iOS Safari "Invalid value" Authorization header errors
- Client-side API key exposure
- iOS WebKit restrictions on client-side auth headers

---

## What Needs To Be Done Next

### IMMEDIATE: Deploy & Test iOS Fix

#### 1. Install Dependencies
```bash
cd /home/rob/git/pedalpath-v2/pedalpath-app
npm install
```

#### 2. Configure Vercel Environment Variables
**🚨 CRITICAL - DEPLOYMENT FAILED WITHOUT THIS! 🚨**

**Where to find your Anthropic API key:**
- Check local: `cat /home/rob/git/pedalpath-v2/pedalpath-app/.env.local`
- Or get from: https://console.anthropic.com/settings/keys
- It looks like: `sk-ant-api03-...`

**Add to Vercel:**
1. Go to: https://vercel.com/robert-frankels-projects/pedalpath-v2/settings/environment-variables
2. Click "Add New"
3. Fill in:
   - **Variable Name**: `ANTHROPIC_API_KEY`
   - **Value**: `sk-ant-api03-...` (paste your key)
   - **Environments**: Check all three boxes (Production, Preview, Development)
4. Click "Save"

**Remove old client-side key (if exists):**
- Look for `VITE_ANTHROPIC_API_KEY` and delete it (no longer needed)

#### 3. Deploy to Vercel
```bash
cd /home/rob/git/pedalpath-v2/pedalpath-app
vercel --prod
```

Or push to GitHub main branch if auto-deploy is configured.

#### 4. Test on iPhone Safari
1. Open deployed URL on iPhone Safari
2. Go to /upload
3. Upload a schematic image
4. Open Safari DevTools (if available) or check for errors
5. Verify no CORS errors
6. Verify analysis completes successfully
7. Check network tab shows `/api/analyze-schematic` call succeeds

**Expected Behavior**:
- No "Invalid value" errors
- No Authorization header errors
- Analysis completes in <10 seconds
- Results display correctly

---

### Phase 1: Upload Pipeline (NOT STARTED)

#### Task 4: Wire Up UploadPage.tsx
**File**: `/pedalpath-app/src/pages/UploadPage.tsx`

**Changes Needed**:
```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { processSchematic } from '../services/schematic-processor'

export default function UploadPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // TODO: Get user from auth context
  // Check if AuthContext exports user - may need to add
  // For now, can use mock: const user = { id: 'temp-user-id' }

  const handleUploadComplete = async (file: File) => {
    setLoading(true)
    setError(null)

    try {
      // Create temporary project ID
      const projectId = crypto.randomUUID()
      const userId = 'temp-user-id' // TODO: Get from auth context

      // Process schematic (already implemented function)
      const result = await processSchematic(projectId, file, userId)

      if (result.success && result.schematicId) {
        navigate(`/results/${result.schematicId}`)
      } else {
        setError(result.error || 'Analysis failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Schematic
          </h1>
          <p className="text-gray-600">
            Choose how you'd like to upload your guitar pedal schematic
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Analyzing schematic with AI...</p>
            <p className="text-gray-500 text-sm mt-2">This usually takes 5-10 seconds</p>
          </div>
        ) : (
          <SchematicUpload onUploadComplete={handleUploadComplete} />
        )}
      </div>
    </div>
  )
}
```

**Dependencies**:
- Need to check if `AuthContext` exists and exports `user`
- If not, add user to context or use temporary mock for testing

#### Task 5: Create ResultsPage.tsx
**File**: `/pedalpath-app/src/pages/ResultsPage.tsx` (NEW FILE)

**Implementation**:
```typescript
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBOMData } from '../services/schematic-processor'
// Import guide components from DemoPage
import BOMTable from '../components/guides/BOMTable'
import BreadboardGuide from '../components/guides/BreadboardGuide'
import StripboardGuide from '../components/guides/StripboardGuide'
import EnclosureGuide from '../components/guides/EnclosureGuide'

export default function ResultsPage() {
  const { schematicId } = useParams<{ schematicId: string }>()
  const navigate = useNavigate()

  const { data: bomData, isLoading, error } = useQuery({
    queryKey: ['schematic', schematicId],
    queryFn: () => getBOMData(schematicId!),
    enabled: !!schematicId,
  })

  // Similar tab structure as DemoPage
  // Display BOM, Breadboard, Stripboard, Enclosure tabs
  // Add buttons: "Save Project" and "Upload Another"

  // TODO: Implement full component (see DemoPage.tsx for structure)
}
```

**Steps**:
1. Read `/pedalpath-app/src/pages/DemoPage.tsx` to copy tab structure
2. Replace demo data with fetched `bomData`
3. Add action buttons at top
4. Handle loading and error states
5. Add route in App.tsx

#### Task 6: Add Route to App.tsx
**File**: `/pedalpath-app/src/App.tsx`

**Add**:
```typescript
import ResultsPage from './pages/ResultsPage'

// In Routes:
<Route
  path="/results/:schematicId"
  element={
    <ProtectedRoute>
      <ResultsPage />
    </ProtectedRoute>
  }
/>
```

---

### Phase 3: Demo Visualizations (NOT STARTED)

#### Task 7: Create BreadboardGrid.tsx
**File**: `/pedalpath-app/src/components/visualizations/BreadboardGrid.tsx` (NEW)

**Purpose**: SVG-based breadboard grid visualization

**Features**:
- 63 rows × 10 columns (5 per side)
- Power rails (red/blue)
- Center divider gap
- Hole circles with connection lines
- Row numbers (1-63), column letters (a-j)
- Component overlays (IC, resistors, wires) - HARDCODED for demo
- Highlight capability for tutorial steps

**Reference**: See `KNOWLEDGE_BASE_BREADBOARD.md` for breadboard layout rules

#### Task 8: Create StripboardView.tsx
**File**: `/pedalpath-app/src/components/visualizations/StripboardView.tsx` (NEW)

**Purpose**: Dual-view stripboard visualization (component side + copper side)

**Features**:
- Toggle between: Component / Copper / Side-by-side
- Component side: Show component outlines and labels
- Copper side: Show horizontal copper strips and track cuts
- Grid with labeled rows/columns
- 2-3 example components HARDCODED for demo

**Reference**: See `KNOWLEDGE_BASE_STRIPBOARD.md` for stripboard rules

#### Task 9: Improve EnclosureGuide.tsx
**File**: `/pedalpath-app/src/components/guides/EnclosureGuide.tsx` (MODIFY)

**Current Issues**:
- Placeholder dimensions
- No accurate measurements
- Not printable

**Improvements Needed**:
- Add real enclosure dimensions (1590B: 112×60mm, 125B: 120×94mm, 1590BB: 119×94mm)
- Add enclosure outline with labeled dimensions
- Add measurement grid/ruler
- Show hole diameters (8mm pots, 12mm switch, etc.)
- Add X/Y coordinates from edges
- Add "Print 1:1" button
- Add calibration ruler for print verification
- Support enclosure size dropdown

**Reference**: See `KNOWLEDGE_BASE_ENCLOSURES_WIRING.md` for enclosure specs

#### Task 10: Integrate Visualizations
**Files**:
- `/pedalpath-app/src/components/guides/BreadboardGuide.tsx`
- `/pedalpath-app/src/components/guides/StripboardGuide.tsx`

**Changes**:
- Import new visualization components
- Add to relevant steps/tabs
- Keep existing text instructions
- Highlight components based on current step

---

## Prompt to Resume Work Tomorrow

```
I'm continuing work on PedalPath v2. Last night I completed Phase 2 (iOS Backend Migration) which moved the Anthropic API calls to a secure Vercel serverless endpoint.

Please read /home/rob/git/pedalpath-v2/CONTINUATION_PLAN.md for the full context.

I need you to:
1. First, help me deploy and test the iOS fix:
   - Guide me through configuring ANTHROPIC_API_KEY in Vercel environment variables
   - Deploy to production
   - Test the upload flow

2. Then implement Phase 1 (Upload Pipeline):
   - Wire up UploadPage.tsx to call processSchematic()
   - Create ResultsPage.tsx to display analysis results
   - Add route to App.tsx
   - Test end-to-end upload flow

3. Finally implement Phase 3 (Demo Visualizations):
   - Create BreadboardGrid.tsx component
   - Create StripboardView.tsx component
   - Improve EnclosureGuide.tsx with accurate dimensions
   - Integrate visualizations into guide components

Check the task list with TaskList to see what's completed and what's pending.

The plan document has detailed implementation notes for each task.
```

---

## Files Modified Tonight

```
✅ /pedalpath-app/api/analyze-schematic.ts (NEW)
✅ /pedalpath-app/src/services/claude-vision.ts (MODIFIED)
✅ /pedalpath-app/vercel.json (MODIFIED)
✅ /pedalpath-app/package.json (MODIFIED)
```

## Files To Create Next Session

```
❌ /pedalpath-app/src/pages/ResultsPage.tsx
❌ /pedalpath-app/src/components/visualizations/BreadboardGrid.tsx
❌ /pedalpath-app/src/components/visualizations/StripboardView.tsx
```

## Files To Modify Next Session

```
❌ /pedalpath-app/src/pages/UploadPage.tsx
❌ /pedalpath-app/src/App.tsx
❌ /pedalpath-app/src/components/guides/BreadboardGuide.tsx
❌ /pedalpath-app/src/components/guides/StripboardGuide.tsx
❌ /pedalpath-app/src/components/guides/EnclosureGuide.tsx
```

---

## Important Notes

### Auth Context Check
Before implementing UploadPage changes, check if `/pedalpath-app/src/contexts/AuthContext.tsx` exists and exports a `user` object with `id` field. If not:
- Option A: Add user to existing auth context
- Option B: Use temporary mock user ID for testing
- Option C: Create auth context if missing

### Supabase Check
Verify Supabase is configured correctly:
- Tables: `schematics`, `bom_items`, `enclosure_recommendations`, `power_requirements`, `projects`
- Storage bucket: `schematics`
- If tables missing, may need to run migrations

### Testing Priority
1. **iOS Upload (CRITICAL)** - This was the blocking issue
2. Desktop upload flow
3. Results page display
4. Demo visualizations (polish, not blocking)

### Known Issues To Address
- Auth context may need user object added
- Supabase storage bucket may need initialization
- Projects table may need to be created if upload flow fails

---

## Reference Documents

- **Implementation Plan**: `/home/rob/git/pedalpath-v2/IMPLEMENTATION_ROADMAP.md`
- **Knowledge Bases**:
  - `KNOWLEDGE_BASE_BREADBOARD.md`
  - `KNOWLEDGE_BASE_STRIPBOARD.md`
  - `KNOWLEDGE_BASE_ENCLOSURES_WIRING.md`
  - `KNOWLEDGE_BASE_COMPONENTS.md`
- **Architecture**: `PEDALPATH_ARCHITECTURE.md`
- **PRD**: `PEDALPATH_PRD.md`

---

## Quick Start Commands

```bash
# Navigate to project
cd /home/rob/git/pedalpath-v2/pedalpath-app

# Install dependencies
npm install

# Run locally (uses Vite dev server)
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Check git status
git status

# View task list
# (Run in Claude Code CLI session)
/tasks
```

---

## Success Criteria Checklist

### Phase 2 (Tonight - DONE)
- [x] Backend API endpoint created
- [x] Client-side code updated to call backend
- [x] CORS headers configured
- [x] Dependencies added
- [ ] Deployed to Vercel (NEXT STEP)
- [ ] Tested on iOS Safari (NEXT STEP)

### Phase 1 (Tomorrow)
- [ ] UploadPage wired to processSchematic()
- [ ] Loading state displays with spinner
- [ ] Navigates to ResultsPage on success
- [ ] ResultsPage displays BOM data
- [ ] All 4 tabs work (BOM, Breadboard, Stripboard, Enclosure)
- [ ] Error handling works

### Phase 3 (Tomorrow)
- [ ] BreadboardGrid shows visual grid
- [ ] StripboardView shows dual views with toggle
- [ ] EnclosureGuide has accurate dimensions
- [ ] Visualizations integrated into guides
- [ ] Enclosure template is printable

---

## Git Commit Message for Tonight's Work

```
feat: migrate Claude Vision API to secure backend endpoint

CRITICAL iOS FIX: Resolves iOS Safari authentication header issues

Changes:
- Add /api/analyze-schematic.ts Vercel serverless endpoint
- Update claude-vision.ts to call backend API instead of client-side
- Remove dangerouslyAllowBrowser flag (security issue)
- Configure Vercel routing and CORS headers for iOS Safari
- Add @vercel/node dependency

Fixes:
- iOS Safari "Invalid value" Authorization header errors
- Client-side API key exposure vulnerability
- iOS WebKit restrictions on client-side auth headers

Related: Phase 2 of IMPLEMENTATION_ROADMAP.md

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Dropbox Backup Location

After committing, copy this file to:
```
~/Dropbox/!Claude/pedalpath-v2-continuation-2026-02-04.md
```

This ensures you have the context even if local files are lost.
