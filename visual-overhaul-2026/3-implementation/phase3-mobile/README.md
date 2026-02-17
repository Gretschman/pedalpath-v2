# Phase 3: Mobile Responsiveness

**Timeline:** Weeks 2-3
**Status:** 🔴 NOT STARTED
**Dependencies:** Work Stream H depends on Phase 2; E, F, G can start anytime

## Overview

Phase 3 fixes 23 components with missing responsive breakpoints. Four independent work streams can proceed in parallel:

- **Work Stream E**: Navigation & Layout
- **Work Stream F**: Page Components
- **Work Stream G**: Data Display Components
- **Work Stream H**: Visualization Mobile (requires Phase 2)

## Work Stream E: Navigation & Layout

**Assignable to:** Mobile UI specialist
**Duration:** 2 days
**Dependencies:** None - can start immediately

### Read First:
- `../../1-requirements/mobile-responsive-requirements.md`

### Files to Modify:
```
pedalpath-app/src/components/
├── Navbar.tsx          # Add hamburger menu, responsive breakpoints
├── Layout.tsx          # Responsive container padding
└── Sidebar.tsx         # Hide on mobile (if exists)
```

### Tasks:
- [ ] Add mobile menu state and hamburger button
- [ ] Implement slide-out drawer for mobile menu
- [ ] Hide user email on small screens: `<span className="hidden md:inline">{email}</span>`
- [ ] Show hamburger only on mobile: `<button className="md:hidden">...</button>`
- [ ] Desktop menu hidden on mobile: `<div className="hidden md:flex">...</div>`
- [ ] Test on iPhone 375px width

### Pattern:
```tsx
<nav className="flex items-center justify-between p-4 md:p-6">
  <button className="md:hidden">
    <Menu size={24} />
  </button>
  <div className="hidden md:flex gap-6">
    {/* Desktop menu items */}
  </div>
</nav>
```

---

## Work Stream F: Page Components

**Assignable to:** Mobile UI specialist
**Duration:** 2 days
**Dependencies:** None - can start immediately

### Files to Modify:
```
pedalpath-app/src/pages/
├── LandingPage.tsx     # Responsive hero, features grid
├── DashboardPage.tsx   # Responsive stats cards
├── ResultsPage.tsx     # Tab navigation overflow fix
├── UploadPage.tsx      # Responsive upload zone
├── SignInPage.tsx      # Mobile-friendly form
└── SignUpPage.tsx      # Mobile-friendly form
```

### Tasks:
- [ ] Add responsive breakpoints to all pages
- [ ] Headings: `text-2xl sm:text-3xl md:text-4xl lg:text-5xl`
- [ ] Grids: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`
- [ ] Padding: `p-4 sm:p-6 lg:p-8`
- [ ] Buttons: `flex-col sm:flex-row`
- [ ] Icons: `w-12 h-12 sm:w-16 sm:h-16`
- [ ] **Critical**: Fix ResultsPage tab overflow

### Critical Fix - ResultsPage Tabs:
```tsx
// Current (overflows on mobile):
<div className="flex space-x-8">

// Fix (scrollable on mobile):
<div className="flex space-x-2 sm:space-x-4 md:space-x-8 overflow-x-auto">
```

---

## Work Stream G: Data Display Components

**Assignable to:** Mobile UI specialist
**Duration:** 2 days
**Dependencies:** None - can start immediately

### Files to Modify:
```
pedalpath-app/src/components/
├── bom/BOMTable.tsx            # Most complex - card layout on mobile
├── payment/PricingModal.tsx    # Responsive modal
├── guides/BreadboardGuide.tsx  # Responsive layout
└── guides/StripboardGuide.tsx  # Stack views on mobile
```

### Tasks:
- [ ] **BOMTable**: Replace table with card layout on mobile
- [ ] **PricingModal**: Full-screen on mobile, centered on desktop
- [ ] **Guides**: Stack step images and instructions on mobile
- [ ] All tap targets minimum 44px
- [ ] Hide non-critical columns on mobile

### BOMTable Mobile Pattern:
```tsx
{/* Mobile cards */}
<div className="block md:hidden">
  {components.map(c => (
    <div className="border rounded-lg p-4 mb-4">
      <div className="font-bold">{c.value}</div>
      <div className="text-sm">Qty: {c.quantity}</div>
      <button className="mt-2 w-full min-h-[44px]">View</button>
    </div>
  ))}
</div>

{/* Desktop table */}
<div className="hidden md:block overflow-x-auto">
  <table className="min-w-full">
    {/* Traditional table */}
  </table>
</div>
```

---

## Work Stream H: Visualization Mobile Adaptation

**Assignable to:** Mobile UI specialist
**Duration:** 1 day
**Dependencies:** ⚠️ **BLOCKED until Phase 2 complete**

### Files to Modify:
```
pedalpath-app/src/components/visualizations/
├── BreadboardGrid.tsx      # Responsive SVG scaling
└── StripboardView.tsx      # Stack views on mobile
```

### Tasks:
- [ ] SVG responsive scaling with proper viewBox
- [ ] Touch-friendly zoom/pan controls
- [ ] Stack stripboard views vertically: `flex-col lg:flex-row`
- [ ] Pinch-to-zoom gesture support
- [ ] Test on actual touch devices

### Pattern:
```tsx
<div className="breadboard-container">
  <svg
    viewBox="0 0 1650 550"
    className="w-full h-auto max-w-full"
    style={{ touchAction: 'pinch-zoom' }}
  >
    {/* Breadboard content */}
  </svg>
</div>
```

---

## Mobile Testing Checklist

For each component, verify at these widths:
- [ ] **375px** (iPhone SE) - Minimum target
- [ ] **390px** (iPhone 14) - Common size
- [ ] **768px** (iPad) - Tablet breakpoint
- [ ] **1440px** (Desktop) - Large screen

### Visual Tests:
- [ ] No horizontal scrolling at any size
- [ ] Text readable (not too small or large)
- [ ] Images scale proportionally
- [ ] Buttons have 44px minimum tap targets
- [ ] Forms are easy to tap and fill
- [ ] Tables either fit or use card layout
- [ ] Navigation accessible on all sizes

### Interaction Tests:
- [ ] All buttons tappable (44px+ area)
- [ ] Form inputs easy to tap
- [ ] Dropdowns work on touch
- [ ] Modals closeable on mobile
- [ ] Scrolling smooth

---

## Responsive Patterns Reference

### Typography:
```tsx
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
```

### Grid Layouts:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
```

### Spacing:
```tsx
<div className="p-4 sm:p-6 lg:p-8">
<div className="space-y-3 sm:space-y-4 lg:space-y-6">
```

### Show/Hide:
```tsx
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

### Flex Direction:
```tsx
<div className="flex flex-col md:flex-row gap-4">
```

---

## Success Criteria

✅ **No horizontal scroll** on any device (375px+)
✅ **All text readable** (14px minimum font size)
✅ **All buttons tappable** (44px minimum target)
✅ **Tables work on mobile** (card layout pattern)
✅ **Navigation accessible** (hamburger menu functional)
✅ **Forms usable** (proper input sizing, spacing)
✅ **Images scale** (no overflow or distortion)
✅ **Modals work** (full-screen or near-full on mobile)

---

## Resources

- Requirements: `../../1-requirements/mobile-responsive-requirements.md`
- Main codebase: `/home/rob/git/pedalpath-v2/pedalpath-app/src/`
- Tailwind docs: https://tailwindcss.com/docs/responsive-design

---

## Notes

- Work Streams E, F, G can all proceed in parallel
- Work Stream H must wait for Phase 2 completion
- Use browser dev tools responsive mode for testing
- Test on real devices when possible (iPhone, iPad)

---

**Last Updated:** 2026-02-16
**Status:** Awaiting Phase 2 completion for Work Stream H; others can start
