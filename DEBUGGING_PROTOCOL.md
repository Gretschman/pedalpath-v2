# PedalPath v2 - Debugging Protocol

**Purpose**: Capture lessons learned from debugging sessions to avoid repeating the same mistakes. This document grows smarter with each session.

**Last Updated**: 2026-02-13

---

## Quick Reference Checklist

When encountering errors, follow this order:

1. ✅ **Check Server Logs First** (for 500/API errors)
2. ✅ **Verify Environment Variables** (for auth/API key errors)
3. ✅ **Inspect Actual Data** (for type/format errors)
4. ✅ **Check Browser Console** (for client-side errors)
5. ✅ **Test Locally** (before assuming production issue)

---

## Protocol #1: Generic API Errors (500, "Temporarily Unavailable")

**Problem**: Client shows generic error message that doesn't reveal root cause.

**Solution**:
1. **IMMEDIATELY check Vercel runtime logs**:
   ```bash
   vercel logs <deployment-url>
   ```

2. **Look for actual server-side error** - don't trust client error messages

3. **If logs are empty**: Error already happened. Options:
   - Check Vercel Dashboard → Functions → Logs (web UI)
   - Reproduce error while monitoring logs in real-time
   - Use `vercel inspect <deployment-url> --logs` immediately after error

4. **Only after seeing real error** should you investigate solutions

**Lesson Learned**: 2026-02-13
- Wasted 20+ minutes guessing at GIF file issue
- Should have checked logs first
- Instead discovered by inspecting actual file locally
- **Always logs first, investigation second**

---

## Protocol #2: File Upload Failures

**Problem**: Files upload to storage but fail at processing/analysis.

**Solution**:
1. **Download and inspect the actual file**:
   ```bash
   curl -L "url" -o /tmp/test_file.ext
   file /tmp/test_file.ext
   identify /tmp/test_file.ext  # if ImageMagick available
   ```

2. **Check file properties**:
   - Real format vs. declared format (magic bytes)
   - File size (compression needed?)
   - Dimensions (too large?)
   - Corruption (truncated download?)

3. **Common issues**:
   - ✅ Wrong file extension (JPEG named .gif) → **Use magic byte detection**
   - ✅ File too large → **Compression needed**
   - ✅ Unsupported format → **Check API docs for supported types**
   - ✅ Bucket permissions → **Check Supabase Storage RLS policies**

**Lesson Learned**: 2026-02-13
- Harmonic_Jerkulator.gif was actually JPEG with wrong extension
- Common with web schematics - don't trust extensions
- **Solution**: Implemented `detectImageType()` using magic bytes

---

## Protocol #3: Deprecated API Models

**Problem**: API returns 404 "model not found" error.

**Solution**:
1. **Check Anthropic API documentation** for current model names:
   - https://docs.anthropic.com/claude/docs/models-overview

2. **Use model fallback lists**:
   - Start with latest stable model
   - Include multiple fallbacks
   - Add legacy models for resilience

3. **Current Claude models** (as of Feb 2026):
   - `claude-sonnet-4-5-20250929` (best balance)
   - `claude-opus-4-6` (most intelligent)
   - `claude-haiku-4-5-20251001` (fastest)

4. **Update SDK regularly**:
   ```bash
   npm info @anthropic-ai/sdk version
   npm install @anthropic-ai/sdk@latest
   ```

**Lesson Learned**: 2026-02-13
- Model `claude-3-5-sonnet-20241022` deprecated
- Claude 3.x naming convention completely replaced by Claude 4.x
- **Solution**: Comprehensive fallback list with 8 models

---

## Protocol #4: React Query Errors ("No QueryClient set")

**Problem**: White screen, error about QueryClient not being set.

**Solution**:
1. **Check if QueryClientProvider is set up** in `main.tsx`:
   ```typescript
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 1000 * 60 * 5, // 5 minutes
         retry: 1,
       },
     },
   })

   // Wrap app with provider
   <QueryClientProvider client={queryClient}>
     <App />
   </QueryClientProvider>
   ```

2. **Verify all providers are in correct order**:
   - BrowserRouter (outermost)
   - QueryClientProvider
   - AuthProvider
   - App (innermost)

**Lesson Learned**: 2026-02-13
- ResultsPage used `useQuery` hook but provider wasn't configured
- Caused white screen on navigation to results
- **Solution**: Added QueryClientProvider to main.tsx

---

## Protocol #5: Adding New File Format Support

**Problem**: Want to support new file format (e.g., GIF, SVG, TIFF).

**Solution - Checklist**:
1. ✅ **Frontend file picker** (`SchematicUpload.tsx`):
   - Add to `acceptedFileTypes` string

2. ✅ **API validation** (`api/analyze-schematic.ts`):
   - Add to `validTypes` array

3. ✅ **TypeScript types** (`types/bom.types.ts`):
   - Add to `SchematicAnalysisRequest['image_type']` union

4. ✅ **Supabase Storage bucket**:
   - Update `allowedMimeTypes` in bucket settings (manual)
   - Update code in `services/storage.ts`

5. ✅ **Claude Vision handler** (`services/claude-vision.ts`):
   - Add media type mapping

6. ✅ **Test end-to-end**:
   - Upload test file
   - Verify analysis completes
   - Check results display

**Lesson Learned**: 2026-02-13
- GIF mostly worked but Storage bucket config was missing
- **Critical**: Supabase bucket settings must be updated manually
- Code changes alone aren't enough

---

## Protocol #6: Build Errors After Dependency Updates

**Problem**: New package version breaks build or causes runtime errors.

**Solution**:
1. **Always run build after updates**:
   ```bash
   npm run build
   ```

2. **Check for breaking changes**:
   - Read package changelog
   - Search for migration guides
   - Check TypeScript errors carefully

3. **Test incrementally**:
   - Update one major package at a time
   - Test after each update
   - Commit working state before next update

4. **Common SDK updates**:
   - `@anthropic-ai/sdk` - Check for new model names
   - `@supabase/supabase-js` - Check auth changes
   - `@tanstack/react-query` - Check provider setup

**Best Practice**: Keep dependencies reasonably current (within 6 months) to avoid large breaking changes accumulating.

---

## Common Error Patterns & Solutions

### "ANTHROPIC_API_KEY not configured"
- ✅ Check Vercel environment variables
- ✅ Verify variable name matches (no typos)
- ✅ Check if variable is exposed to functions (not just client)

### "Bucket not found" or "RLS policy violation"
- ✅ Create bucket in Supabase Storage dashboard
- ✅ Add RLS policies for user access
- ✅ Verify bucket name matches code

### "Row Level Security policy violation"
- ✅ Check if user is authenticated
- ✅ Verify RLS policies exist for table
- ✅ Ensure user_id foreign keys are correct

### Image compression or PDF conversion failures
- ✅ Check if image is too large (>8000x8000px)
- ✅ Verify PDF.js is loaded correctly
- ✅ Test with different file formats

### Deployment succeeds but function fails
- ✅ Check function logs in Vercel dashboard
- ✅ Verify all environment variables are set
- ✅ Test API endpoint directly with curl/Postman

---

## Tools & Commands Reference

### Vercel Logs
```bash
# View real-time logs (waits for new activity)
vercel logs <deployment-url>

# Inspect specific deployment
vercel inspect <deployment-url> --logs

# View in dashboard (most reliable for historical errors)
# Visit: https://vercel.com/dashboard → Project → Deployments → Click deployment → Functions tab
```

### File Inspection
```bash
# Check file type from content
file <filename>

# Get image details (if ImageMagick installed)
identify <filename>

# View file size and permissions
ls -lh <filename>

# Download file from URL
curl -L "url" -o /tmp/testfile.ext
```

### Git Operations
```bash
# Check current status
git status

# View uncommitted changes
git diff

# Stage all changes
git add -A

# Commit with detailed message
git commit -m "message"

# Push to remote
git push origin main
```

### Build & Test
```bash
# TypeScript check + build
npm run build

# Run linter
npm run lint

# Local dev server
npm run dev

# Deploy to production
vercel --prod --yes
```

---

## Debugging Workflow

### When Something Breaks in Production:

1. **Assess Impact**:
   - Is it affecting all users or specific scenarios?
   - Is it blocking core functionality?
   - Can users work around it?

2. **Gather Data**:
   - ✅ Browser console errors
   - ✅ Vercel function logs
   - ✅ Network tab (failed requests)
   - ✅ User's environment (browser, device)

3. **Reproduce Locally**:
   - Use same file/data that failed
   - Check if error occurs in dev
   - Isolate the failing component

4. **Identify Root Cause**:
   - Follow protocols above
   - Don't guess - verify with logs/inspection
   - Document findings

5. **Implement Fix**:
   - Test locally first
   - Build successfully
   - Deploy to production
   - Verify fix works

6. **Document Lesson**:
   - Add to this file if new pattern
   - Update relevant protocol
   - Note date and context

---

## Session Continuity

At end of each session:
1. ✅ Commit all changes to GitHub
2. ✅ Update this debugging protocol with new lessons
3. ✅ Update CLAUDE.md if workflows changed
4. ✅ Create continuation document if needed
5. ✅ Note any pending tasks or blockers

At start of each session:
1. ✅ Read CLAUDE.md for project overview
2. ✅ Check this debugging protocol for relevant lessons
3. ✅ Review recent commits for context
4. ✅ Check for continuation documents

---

## Future Additions

As we encounter new debugging scenarios, add protocols for:
- [ ] Database migration issues
- [ ] Payment processing errors (Stripe integration)
- [ ] Email delivery failures
- [ ] Rate limiting from APIs
- [ ] Memory/timeout issues in serverless functions
- [ ] CORS and security policy errors
- [ ] Mobile-specific issues
- [ ] Performance bottlenecks

---

**Remember**: Every debugging session is an opportunity to make this document smarter. When you solve something once, document it here so we never waste time on it again.
