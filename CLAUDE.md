# PedalPath v2 - Claude Development Guide

## Project Overview

PedalPath is a web application that helps guitar pedal builders analyze schematics using AI vision. Users upload schematic images, and Claude Vision analyzes them to generate Bill of Materials (BOM), enclosure recommendations, and power requirements.

**Primary Goal**: Make schematic upload reliable and seamless on both mobile and desktop devices.

---

## Workflow

### For Complex Tasks
- Start complex tasks in Plan mode using `EnterPlanMode` tool
- Get plan approval before implementation
- Break large changes into reviewable chunks
- Document architectural decisions in continuation documents

### For Simple Tasks
- Direct implementation for small fixes and tweaks
- Single-file changes or obvious bug fixes
- UI text updates or styling adjustments

---

## Design & UX Guidelines

**PRIMARY REFERENCE**: [`UX_DESIGN_REQUIREMENTS.md`](./UX_DESIGN_REQUIREMENTS.md)

**Philosophy**: "LEGO-Simple, Apple-Beautiful, Intuit-Obvious"
- Every interaction should be visually obvious
- Complex processes broken into discrete, satisfying steps
- Immediate visual feedback for every action
- Colorful, approachable, never intimidating

**Key Documents**:
- **[`UX_DESIGN_REQUIREMENTS.md`](./UX_DESIGN_REQUIREMENTS.md)** - Complete design system, colors, typography, components
- **[`VISUAL_BREADBOARD_IMPLEMENTATION.md`](./VISUAL_BREADBOARD_IMPLEMENTATION.md)** - Plan for LEGO-style visual guides
- **`/design-references/`** - Reference images for breadboard visualizations

**CRITICAL MISSION**: Visual breadboard guides showing step-by-step component placement like LEGO instructions. Current text-based approach fails this mission completely.

---

## Debugging Protocol

**CRITICAL**: When encountering errors, always follow the debugging protocols documented in [`DEBUGGING_PROTOCOL.md`](./DEBUGGING_PROTOCOL.md).

### Quick Rules
1. **Generic API errors (500, "temporarily unavailable")** → Check Vercel logs FIRST
2. **File upload failures** → Inspect actual file content (don't trust extensions)
3. **Model not found errors** → Check Anthropic docs for current model names
4. **White screen errors** → Check for missing React providers (QueryClient, etc.)
5. **Build failures** → Run `npm run build` locally, check TypeScript errors

### Key Commands
```bash
# Check server logs immediately when errors occur
vercel logs <deployment-url>

# Inspect actual file content
file <filename>

# View recent commits for context
git log --oneline -10
```

**See [`DEBUGGING_PROTOCOL.md`](./DEBUGGING_PROTOCOL.md) for complete protocols and lessons learned.**

---

## Verification Requirements

Before marking work complete:

### Code Quality
- Run `npm run build` after significant code changes (catches TypeScript errors)
- Run `npm run lint` before committing
- Fix any TypeScript or ESLint errors

### Testing
- For UI changes: Verify in browser using `npm run dev` (http://localhost:5174)
- For API changes: Test with browser DevTools Network tab or console logs
- Check browser console for errors (F12 → Console)
- Test on both desktop and mobile viewports

### Before Committing
- Review all changed files with `git diff`
- Ensure no sensitive data (API keys, tokens) in code
- Check that imports resolve correctly
- Verify no unused imports or variables

---

## Permissions

Use `/permissions` to allow common operations without prompts:

```
npm run dev
npm run build
npm run lint
git add
git commit
git push
vercel --prod --yes
```

---

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router v7** - Client-side routing
- **Lucide React** - Icon library

### Backend & Services
- **Supabase** - Authentication, database (PostgreSQL), file storage
- **Claude Vision API** - Schematic analysis (Anthropic)
- **Vercel** - Hosting and serverless functions

### Key Libraries
- `@supabase/supabase-js` - Supabase client
- `@anthropic-ai/sdk` - Claude API client
- `react-hook-form` + `zod` - Form handling and validation
- `@tanstack/react-query` - Data fetching and caching

---

## Project Structure

```
pedalpath-v2/
├── pedalpath-app/               # Main application
│   ├── api/                     # Vercel serverless functions
│   │   └── analyze-schematic.ts # Claude Vision API endpoint
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── guides/          # Build guides (enclosure, etc.)
│   │   │   ├── schematic/       # Schematic upload components
│   │   │   ├── visualizations/  # BreadboardGrid, StripboardView
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/            # React contexts
│   │   │   └── AuthContext.tsx  # Authentication state
│   │   ├── pages/               # Page components
│   │   │   ├── LandingPage.tsx
│   │   │   ├── SignInPage.tsx
│   │   │   ├── SignUpPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── UploadPage.tsx
│   │   │   └── ResultsPage.tsx
│   │   ├── services/            # API and business logic
│   │   │   ├── supabase.ts      # Supabase client
│   │   │   ├── storage.ts       # File upload to Supabase Storage
│   │   │   ├── claude-vision.ts # Claude Vision API calls
│   │   │   └── schematic-processor.ts # End-to-end upload flow
│   │   ├── types/               # TypeScript type definitions
│   │   ├── utils/               # Utility functions
│   │   │   └── image-utils.ts   # Image compression, PDF conversion
│   │   ├── App.tsx              # App routing
│   │   └── main.tsx             # App entry point
│   ├── .env.local               # Environment variables (not in git)
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── CONTINUATION_*.md            # Session continuation documents
└── CLAUDE.md                    # This file
```

---

## Key Files & Their Responsibilities

### Upload Flow
1. **`SchematicUpload.tsx`** - File picker UI component
2. **`image-utils.ts`** - Compress images, convert PDFs to images
3. **`storage.ts`** - Upload files to Supabase Storage
4. **`schematic-processor.ts`** - Orchestrates entire upload process:
   - Upload to storage
   - Create database records
   - Call Claude Vision API
   - Save BOM data
5. **`claude-vision.ts`** - Claude Vision API integration (with retry logic)
6. **`api/analyze-schematic.ts`** - Vercel serverless function (API endpoint)

### Authentication
- **`AuthContext.tsx`** - Manages user session, sign in/out, password reset
- **`ProtectedRoute.tsx`** - Route guard for authenticated pages
- **`SignInPage.tsx` / `SignUpPage.tsx`** - Auth UI

### Data Display
- **`ResultsPage.tsx`** - Shows BOM, enclosure, power requirements
- **`DashboardPage.tsx`** - User's projects list

---

## Common Patterns

### Supabase Client Usage
```typescript
import { supabase } from '../services/supabase'

// Query
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId)

// Insert
const { data, error } = await supabase
  .from('table_name')
  .insert({ field: value })
  .select()
  .single()

// Update
const { error } = await supabase
  .from('table_name')
  .update({ field: newValue })
  .eq('id', recordId)
```

### Authentication Check
```typescript
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>

  return <div>Hello {user.email}</div>
}
```

### File Upload Pattern
```typescript
// 1. Prepare file (compress/convert)
const prepared = await prepareFileForUpload(file)

// 2. Upload to storage
const result = await uploadSchematic(userId, prepared.file, projectId)

// 3. Process schematic (creates DB records, analyzes)
const processResult = await processSchematic(projectId, prepared.file, userId)
```

---

## Environment Variables

Located in `/pedalpath-app/.env.local` (not committed to git):

```bash
# Supabase
VITE_SUPABASE_URL=https://tudjjcamqxeybqqmvctr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Claude API
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...

# Vercel (auto-generated)
VERCEL_OIDC_TOKEN=eyJ...
```

**Security Note**: Never commit `.env.local` to git. API keys are prefixed with `VITE_` to be available in browser code.

---

## Database Schema

### Core Tables

**projects**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `name` (text)
- `schematic_url` (text)
- `status` (text: draft, in_progress, completed)
- Timestamps

**schematics**
- `id` (uuid, PK)
- `project_id` (uuid, FK)
- `storage_path` (text) - Path in Supabase Storage
- `file_name` (text)
- `file_size` (int)
- `mime_type` (text)
- `processing_status` (text: processing, completed, failed)
- `processing_error` (text, nullable)
- `ai_confidence_score` (int, nullable)
- Timestamps

**bom_items**
- `id` (uuid, PK)
- `schematic_id` (uuid, FK)
- `component_type` (text: resistor, capacitor, ic, etc.)
- `value` (text)
- `quantity` (int)
- `reference_designators` (text[])
- `part_number` (text, nullable)
- `supplier` (text, nullable)
- `supplier_url` (text, nullable)
- `confidence` (numeric, nullable)
- `verified` (boolean)
- `notes` (text, nullable)

**enclosure_recommendations**
- `id` (uuid, PK)
- `schematic_id` (uuid, FK)
- `size` (text: 1590B, 125B, 1590BB, etc.)
- `drill_count` (int, nullable)
- `notes` (text, nullable)

**power_requirements**
- `id` (uuid, PK)
- `schematic_id` (uuid, FK)
- `voltage` (text: 9V, 18V, etc.)
- `current` (text, nullable)
- `polarity` (text: center_negative, center_positive)

### Row Level Security (RLS)

All tables have RLS policies that ensure:
- Users can only access their own data
- Data is linked through foreign keys (projects → schematics → bom_items, etc.)
- Authenticated users can INSERT, SELECT, UPDATE, DELETE their own records

---

## Supabase Storage

### Bucket: `schematics`
- **Path structure**: `{userId}/{timestamp}-{filename}`
- **Access**: Private (requires authentication)
- **File size limit**: 10MB
- **Allowed types**: image/jpeg, image/jpg, image/png, image/webp, application/pdf
- **RLS policies**: Users can only upload/read/update/delete files in their own folder

---

## Git Workflow

### Committing Changes
```bash
# Check status
git status

# Stage all changes
git add -A

# Commit with co-author
git commit -m "$(cat <<'EOF'
Brief description of changes

Detailed explanation if needed.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Push to main
git push origin main
```

### Commit Message Guidelines
- Use imperative mood ("Add feature" not "Added feature")
- First line: brief summary (50 chars or less)
- Body: detailed explanation of what and why
- Always include co-author line for Claude contributions

---

## Deployment

### Vercel
```bash
# Deploy to production
cd /home/rob/git/pedalpath-v2/pedalpath-app
vercel --prod --yes
```

- Auto-deploys on git push to main (connected via Vercel GitHub integration)
- Production URL: https://pedalpath-app.vercel.app
- Environment variables configured in Vercel dashboard

---

## Common Commands

```bash
# Navigate to project
cd /home/rob/git/pedalpath-v2/pedalpath-app

# Install dependencies
npm install

# Start dev server (usually runs on :5174)
npm run dev

# Build for production (also runs TypeScript type checking)
npm run build

# Run linter
npm run lint

# Check git status
git status

# View git diff
git diff

# Deploy to Vercel
vercel --prod --yes
```

---

## Development Best Practices

### Code Style
- Use TypeScript for type safety
- Prefer functional components with hooks
- Use async/await for promises
- Handle errors gracefully with try/catch
- Add console.log for debugging (remove before production)

### Security
- Never commit API keys or secrets
- Always validate user input
- Use RLS policies for database access
- Sanitize file uploads
- Use HTTPS for all API calls

### Performance
- Compress images before upload (max 1MB)
- Convert PDFs to images on frontend
- Use lazy loading for heavy components
- Implement retry logic for API calls
- Cache API responses when appropriate

### User Experience
- Show loading states during operations
- Display clear error messages
- Provide feedback for user actions
- Mobile-first responsive design
- Test on both mobile and desktop

---

## Troubleshooting

### Common Issues

**Issue**: Upload fails with "Bucket not found"
- **Fix**: Create `schematics` bucket in Supabase Storage dashboard

**Issue**: Upload fails with "Row Level Security policy violation"
- **Fix**: Add RLS policies to database tables (see CONTINUATION documents)

**Issue**: Claude Vision API timeout
- **Fix**: Retry logic is implemented (3 attempts with exponential backoff)

**Issue**: Large images fail to upload
- **Fix**: Image compression automatically reduces to 1MB max

**Issue**: Port 5173 already in use
- **Note**: Vite will auto-increment to 5174, 5175, etc.

---

## Important Notes

### File Upload Limits
- **Max file size**: 10MB (configured in Supabase Storage)
- **Images compressed to**: 1MB max (before upload)
- **PDF conversion**: PDFs converted to JPEG on frontend before upload

### API Rate Limits
- **Claude Vision API**: Check Anthropic dashboard for current limits
- **Supabase**: Generous free tier limits

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers supported
- PDF.js requires modern JavaScript features

---

## Phase Roadmap

### ✅ Phase 3 (Completed)
- BreadboardGrid visualization
- StripboardView visualization
- Enhanced EnclosureGuide with printable templates

### ✅ Phase A (Completed - Code Only)
- Image compression
- PDF-to-image conversion
- Timeout handling
- Retry logic with exponential backoff
- Forgot password functionality

### 🔄 Phase A (In Progress - Infrastructure)
- Configure Supabase RLS policies ← **CURRENT BLOCKER**
- Test end-to-end upload flow

### 📋 Phase B (Future)
- Better error messages
- Progress indicators
- Image validation
- Thumbnail preview
- Retry UI
- Cancel upload functionality

---

## Resources

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Anthropic API Docs**: https://docs.anthropic.com
- **Project Repo**: https://github.com/Gretschman/pedalpath-v2
- **Production Site**: https://pedalpath-app.vercel.app

---

## Session Continuity

For session continuity, always check for:
1. **[`DEBUGGING_PROTOCOL.md`](./DEBUGGING_PROTOCOL.md)** - Lessons learned and debugging protocols
2. Latest `CONTINUATION_*.md` document in repo root
3. Recent commit messages for context
4. Open issues or TODOs in code comments
5. Browser console errors from last test session

When ending a session:
1. **Update [`DEBUGGING_PROTOCOL.md`](./DEBUGGING_PROTOCOL.md)** with any new lessons learned
2. Commit all changes to GitHub
3. Create continuation document if needed with:
   - Current status and what's working
   - Current blockers and errors
   - Next immediate steps
   - Any SQL scripts or commands to run
   - Testing checklist

---

**Last Updated**: 2026-02-13
**Current Status**: Core functionality working - Upload, Analysis, Results display all operational
