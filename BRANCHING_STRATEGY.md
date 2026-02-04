# PedalPath v2 - Branching Strategy

**Last Updated**: February 3, 2026

---

## Branch Structure

### `main` Branch
**Purpose**: Stable, production-ready code
**Protection**: Should always be deployable
**Merging**: Only via Pull Requests with review

**Current State**:
- ✅ Week 2 implementation complete
- ✅ All core features implemented
- ✅ Demo page functional
- ✅ Clean, tested codebase

**Rules**:
- Never commit directly to `main`
- Always work in feature branches
- Merge only after testing and review

---

### `feature/visual-build-guides` Branch
**Purpose**: Implement visual enhancements for build guides
**Created**: February 3, 2026
**GitHub**: https://github.com/Gretschman/pedalpath-v2/tree/feature/visual-build-guides

**Scope - Addressing Issues #1, #2, #3**:

#### Issue #1: Drilling Template
- Create printable 1590B enclosure template
- Exact dimensions with drill bit sizes
- PDF generation capability
- Files: `src/lib/drill-template-generator.ts`, `src/components/guides/PrintableDrillTemplate.tsx`

#### Issue #2: Stripboard Visualization
- Interactive stripboard canvas
- Component placement visualization
- Copper track and cut diagrams
- Files: `src/lib/stripboard-renderer.ts`, `src/components/guides/StripboardCanvas.tsx`

#### Issue #3: Breadboard Visualization
- Interactive breadboard canvas
- Internal connection diagrams
- 7-stage progressive build
- Files: `src/lib/breadboard-renderer.ts`, `src/components/guides/BreadboardCanvas.tsx`

**Status**: 🔨 Active Development

---

## Workflow

### 1. Starting Work on an Issue

```bash
# Ensure you're on the feature branch
git checkout feature/visual-build-guides

# Pull latest changes
git pull origin feature/visual-build-guides

# Start working on issue
```

### 2. Making Commits

```bash
# Stage your changes
git add <files>

# Commit with descriptive message
git commit -m "feat(drilling): Add 1590B template generator with exact dimensions

- Create drill-template-generator.ts with enclosure specs
- Add coordinate calculation algorithm
- Implement PDF export functionality

Addresses #1"

# Push to GitHub
git push origin feature/visual-build-guides
```

**Commit Message Format**:
- `feat(scope): Description` - New feature
- `fix(scope): Description` - Bug fix
- `docs(scope): Description` - Documentation
- `refactor(scope): Description` - Code restructuring
- `test(scope): Description` - Tests
- `chore(scope): Description` - Maintenance

**Link to Issues**: Use `Addresses #X`, `Fixes #X`, or `Closes #X`

### 3. Testing Your Changes

```bash
# Run dev server
npm run dev

# Check TypeScript
npx tsc --noEmit

# Test functionality manually
# Navigate to http://localhost:5173/demo
```

### 4. Pushing to GitHub

```bash
# Push your branch
git push origin feature/visual-build-guides
```

### 5. Creating a Pull Request (When Ready)

When all issues are addressed and tested:

```bash
# Ensure branch is up to date with main
git checkout main
git pull origin main
git checkout feature/visual-build-guides
git merge main

# Resolve any conflicts

# Push final version
git push origin feature/visual-build-guides
```

Then create PR on GitHub:
- **Title**: "Add visual build guides (drilling, stripboard, breadboard)"
- **Description**:
  - Summarize changes
  - Link to issues: "Closes #1, Closes #2, Closes #3"
  - Include screenshots/GIFs of new features
  - Testing instructions
- **Reviewers**: Assign yourself or team member
- **Labels**: enhancement, build-guides

### 6. Merging to Main

After review and approval:
```bash
# On GitHub, click "Merge Pull Request"
# Use "Squash and Merge" for clean history

# Then locally:
git checkout main
git pull origin main

# Delete feature branch (optional)
git branch -d feature/visual-build-guides
git push origin --delete feature/visual-build-guides
```

---

## Branch Naming Conventions

Follow this pattern: `type/short-description`

**Types**:
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code restructuring
- `docs/` - Documentation updates
- `test/` - Test additions
- `chore/` - Maintenance tasks

**Examples**:
- ✅ `feature/visual-build-guides`
- ✅ `fix/bom-export-csv-encoding`
- ✅ `refactor/claude-vision-error-handling`
- ✅ `docs/add-deployment-guide`

---

## Current Branches

### Active Branches
| Branch | Purpose | Status | Issues |
|--------|---------|--------|--------|
| `main` | Stable production code | ✅ Clean | - |
| `feature/visual-build-guides` | Visual guide enhancements | 🔨 Active | #1, #2, #3 |

### Future Branches (Planned)
- `feature/schematic-upload-integration` - Connect upload to Claude Vision
- `feature/user-dashboard` - Project management UI
- `feature/authentication-flow` - Enhanced auth UX
- `feature/bom-supplier-integration` - Real-time pricing from Tayda/Mouser

---

## Protection Rules for Main Branch

### Recommended Settings (GitHub)

1. **Require Pull Request Reviews**
   - At least 1 approval required
   - Dismiss stale reviews

2. **Require Status Checks**
   - TypeScript compilation passes
   - Tests pass (when implemented)

3. **Require Branches Up to Date**
   - Must merge latest main before merging PR

4. **Include Administrators**
   - Even admins follow PR workflow

---

## Quick Reference Commands

### Switch Branches
```bash
# Switch to main
git checkout main

# Switch to feature branch
git checkout feature/visual-build-guides

# Create new branch from main
git checkout main
git pull origin main
git checkout -b feature/new-feature-name
```

### Stay Synchronized
```bash
# Update your feature branch with main
git checkout feature/visual-build-guides
git fetch origin
git merge origin/main

# Or use rebase (cleaner history)
git rebase origin/main
```

### Check Branch Status
```bash
# See current branch
git branch

# See all branches
git branch -a

# See remote tracking
git remote show origin
```

### Undo Changes
```bash
# Discard local changes
git checkout -- <file>

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

---

## Development Workflow Diagram

```
┌──────────────────────────────────────────────────────┐
│                    MAIN BRANCH                       │
│  (Stable, Production-Ready, Protected)               │
└──────────────────────────────────────────────────────┘
                      ↓ branch
┌──────────────────────────────────────────────────────┐
│           FEATURE/VISUAL-BUILD-GUIDES                │
│                                                      │
│  Work on Issues:                                     │
│  ├─ #1 Drilling Template     [─────────]            │
│  ├─ #2 Stripboard Visual     [─────────]            │
│  └─ #3 Breadboard Visual     [─────────]            │
│                                                      │
│  Regular commits as you work                         │
└──────────────────────────────────────────────────────┘
                      ↓ Pull Request
┌──────────────────────────────────────────────────────┐
│                   CODE REVIEW                        │
│  - Check functionality                               │
│  - Review code quality                               │
│  - Test on demo                                      │
│  - Approve or request changes                        │
└──────────────────────────────────────────────────────┘
                      ↓ merge
┌──────────────────────────────────────────────────────┐
│              MAIN BRANCH (UPDATED)                   │
│  Now includes visual build guides                    │
└──────────────────────────────────────────────────────┘
```

---

## Best Practices

### ✅ Do's
- ✅ Create descriptive commit messages
- ✅ Commit frequently with atomic changes
- ✅ Keep feature branches focused on specific issues
- ✅ Test thoroughly before creating PR
- ✅ Link commits to issues (#1, #2, etc.)
- ✅ Pull from main regularly to avoid conflicts
- ✅ Write meaningful PR descriptions

### ❌ Don'ts
- ❌ Never commit directly to main
- ❌ Don't create giant commits with many unrelated changes
- ❌ Don't push broken code to feature branches
- ❌ Don't let feature branches get too far behind main
- ❌ Don't merge without testing
- ❌ Don't use vague commit messages ("fix stuff", "changes")

---

## Example: Full Feature Development Cycle

```bash
# Day 1: Start feature work
git checkout -b feature/visual-build-guides
git push -u origin feature/visual-build-guides

# Day 2-5: Implement drilling template
# ... make changes ...
git add src/lib/drill-template-generator.ts
git commit -m "feat(drilling): Add 1590B template generator

- Create enclosure dimension specs
- Implement hole calculation algorithm
- Add drill bit size mapping

Addresses #1"
git push origin feature/visual-build-guides

# Day 6-10: Implement stripboard visualization
# ... make changes ...
git add src/components/guides/StripboardCanvas.tsx
git commit -m "feat(stripboard): Add interactive canvas component

- Create SVG-based stripboard renderer
- Add component placement logic
- Implement track cut visualization

Addresses #2"
git push origin feature/visual-build-guides

# Day 11-15: Implement breadboard visualization
# ... similar process ...

# Day 16: Sync with main
git fetch origin
git merge origin/main
# Resolve conflicts if any
git push origin feature/visual-build-guides

# Day 17: Create Pull Request on GitHub
# Include screenshots, testing instructions
# Link to issues: "Closes #1, Closes #2, Closes #3"

# Day 18: Address review feedback
# Make requested changes
git commit -m "refactor: Address PR review feedback"
git push origin feature/visual-build-guides

# Day 19: Merge to main
# Click "Squash and Merge" on GitHub

# Day 20: Clean up
git checkout main
git pull origin main
git branch -d feature/visual-build-guides
```

---

## Summary

**Current Setup**:
- ✅ `main` branch: Stable, production-ready
- ✅ `feature/visual-build-guides`: Active development for issues #1, #2, #3
- ✅ Proper workflow established

**You Are Here**: 📍 `feature/visual-build-guides` branch
**Ready to**: Start implementing visual enhancements
**Next Step**: Begin work on Issue #1 (Drilling Template)

---

## Questions?

- **How do I switch branches?** `git checkout <branch-name>`
- **How do I see what branch I'm on?** `git branch` (current branch has *)
- **Can I work on multiple issues at once?** Yes, but keep commits organized
- **Should I create separate branches for each issue?** No, these three issues are related and can share one feature branch
- **When should I merge to main?** When ALL three issues are complete and tested

---

**Happy Coding!** 🎸
