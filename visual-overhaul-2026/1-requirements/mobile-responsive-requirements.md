# Mobile Responsive Requirements

**Purpose:** Define mobile responsiveness specifications for all UI components
**Audience:** Workers E, F, G, H (Phase 3 mobile implementation)

## Problem Statement

PedalPath app currently has **23 components** with missing or broken responsive breakpoints. The app:
- ❌ Doesn't scale properly on iPhone screens (375px-390px width)
- ❌ Has horizontal scrolling on mobile
- ❌ Uses text sizes that are too small or too large
- ❌ Has tap targets smaller than 44px (Apple HIG minimum)
- ❌ Shows tables that overflow on small screens
- ❌ Has navigation that doesn't work on mobile

## Target Devices

### Primary Targets (Must work perfectly):
- **iPhone SE**: 375px × 667px
- **iPhone 14**: 390px × 844px
- **iPhone 14 Pro Max**: 430px × 932px
- **iPad Mini**: 768px × 1024px

### Secondary Targets (Should work well):
- **Android small**: 360px width
- **Android medium**: 412px width
- **Tablet**: 1024px+ width

## Breakpoint System

Use Tailwind CSS standard breakpoints:

```css
/* Mobile first - base styles apply to all sizes */
.element { }

/* Small devices (640px and up) */
@media (min-width: 640px) { }
sm:class

/* Medium devices (768px and up) */
@media (min-width: 768px) { }
md:class

/* Large devices (1024px and up) */
@media (min-width: 1024px) { }
lg:class

/* Extra large devices (1280px and up) */
@media (min-width: 1280px) { }
xl:class
```

### Breakpoint Strategy:
- Write mobile-first: Base styles for mobile (< 640px)
- Add `sm:` for small tablets/large phones
- Add `md:` for tablets
- Add `lg:` for desktop
- Add `xl:` for large desktop

## Typography Scale

### Headings
```css
/* H1 - Main page title */
Mobile:  text-2xl (24px)
Tablet:  text-3xl (30px)
Desktop: text-4xl (36px)
Large:   text-5xl (48px)

/* H2 - Section title */
Mobile:  text-xl (20px)
Tablet:  text-2xl (24px)
Desktop: text-3xl (30px)

/* H3 - Subsection */
Mobile:  text-lg (18px)
Tablet:  text-xl (20px)
Desktop: text-2xl (24px)
```

**Implementation:**
```tsx
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
  PedalPath
</h1>
```

### Body Text
```css
/* Base text */
Mobile:  text-base (16px)
Desktop: text-base (16px)  /* Same - good readability */

/* Small text */
Mobile:  text-sm (14px)
Desktop: text-sm (14px)

/* Tiny text (use sparingly) */
Mobile:  text-xs (12px)
Desktop: text-xs (12px)
```

### Minimum Font Size: **14px** (never go smaller)

## Spacing Scale

### Padding
```tsx
/* Container padding */
Mobile:  p-4 (16px)
Tablet:  sm:p-6 (24px)
Desktop: lg:p-8 (32px)

/* Section padding */
Mobile:  py-6 (24px vertical)
Tablet:  sm:py-8 (32px vertical)
Desktop: lg:py-12 (48px vertical)

/* Card padding */
Mobile:  p-3 (12px)
Tablet:  sm:p-4 (16px)
Desktop: lg:p-6 (24px)
```

### Margins
```tsx
/* Section margins */
Mobile:  mb-4 (16px)
Tablet:  sm:mb-6 (24px)
Desktop: lg:mb-8 (32px)

/* Element spacing */
Mobile:  space-y-3 (12px between)
Tablet:  sm:space-y-4 (16px between)
Desktop: lg:space-y-6 (24px between)
```

## Layout Patterns

### Grid Layouts
```tsx
/* 1 column mobile, 2 tablet, 3 desktop */
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

/* 1 column mobile, 3 desktop (skip 2-col) */
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

/* Auto-fit responsive grid */
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
```

### Flex Layouts
```tsx
/* Stack on mobile, row on desktop */
<div className="flex flex-col md:flex-row gap-4">

/* Reverse order on mobile */
<div className="flex flex-col-reverse md:flex-row">

/* Center on mobile, space-between on desktop */
<div className="flex flex-col items-center md:flex-row md:justify-between">
```

### Hide/Show Elements
```tsx
/* Hide on mobile, show on desktop */
<div className="hidden md:block">

/* Show on mobile, hide on desktop */
<div className="block md:hidden">

/* Only show on mobile */
<div className="sm:hidden">

/* Only show on tablet and up */
<div className="hidden sm:block">
```

## Component-Specific Patterns

### Navigation Bar

**Mobile:**
- Hamburger menu button (top-left or top-right)
- Logo centered or left
- Hide user email/name
- Slide-out drawer for menu

**Desktop:**
- Full horizontal menu
- Logo left
- User info right
- All items visible

```tsx
<nav className="flex items-center justify-between p-4 md:p-6">
  {/* Hamburger - mobile only */}
  <button className="md:hidden">
    <Menu size={24} />
  </button>

  {/* Logo */}
  <div className="text-lg md:text-xl font-bold">PedalPath</div>

  {/* Desktop menu - hidden on mobile */}
  <div className="hidden md:flex gap-6">
    <a href="/dashboard">Dashboard</a>
    <a href="/projects">Projects</a>
  </div>

  {/* User info - abbreviated on mobile */}
  <div className="flex items-center gap-2">
    <Avatar />
    <span className="hidden md:inline">{user.email}</span>
  </div>
</nav>
```

### Data Tables

**Mobile:** Card layout (vertical stack)
**Tablet+:** Traditional table

```tsx
{/* Mobile cards */}
<div className="block md:hidden">
  {data.map(item => (
    <div key={item.id} className="border rounded-lg p-4 mb-4">
      <div className="font-bold text-lg">{item.name}</div>
      <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
      <div className="text-sm">${item.price}</div>
      <button className="mt-2 w-full btn-primary">View</button>
    </div>
  ))}
</div>

{/* Desktop table */}
<div className="hidden md:block overflow-x-auto">
  <table className="min-w-full">
    <thead>
      <tr>
        <th>Name</th>
        <th>Quantity</th>
        <th>Price</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {data.map(item => (
        <tr key={item.id}>
          <td>{item.name}</td>
          <td>{item.quantity}</td>
          <td>${item.price}</td>
          <td><button>View</button></td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Forms

**Mobile:**
- Single column
- Full-width inputs
- Large touch targets
- Stack buttons vertically

**Desktop:**
- Multi-column layout
- Narrower inputs
- Buttons in row

```tsx
<form className="space-y-4">
  {/* Form grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <input
      type="text"
      placeholder="First Name"
      className="w-full px-4 py-3 text-base border rounded-lg"
    />
    <input
      type="text"
      placeholder="Last Name"
      className="w-full px-4 py-3 text-base border rounded-lg"
    />
  </div>

  {/* Buttons */}
  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
    <button className="flex-1 btn-primary py-3">Submit</button>
    <button className="flex-1 btn-secondary py-3">Cancel</button>
  </div>
</form>
```

### Modals

**Mobile:**
- Full screen or near-full screen
- Bottom sheet style
- Large close button
- Minimal padding

**Desktop:**
- Centered modal
- Max width 600px
- Backdrop blur

```tsx
<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

  {/* Modal */}
  <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
    {/* Header */}
    <div className="sticky top-0 bg-white border-b p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold">Modal Title</h2>
      <button className="absolute top-4 right-4 p-2">
        <X size={24} />
      </button>
    </div>

    {/* Content */}
    <div className="p-4 sm:p-6">
      {/* Modal content */}
    </div>
  </div>
</div>
```

## Touch Interactions

### Tap Target Sizes

**Minimum:** 44px × 44px (Apple HIG, WCAG AAA)
**Recommended:** 48px × 48px
**Comfortable:** 52px+ × 52px+

```tsx
/* Button sizing */
<button className="px-6 py-3 min-h-[44px]">
  Click Me
</button>

/* Icon button */
<button className="p-3 min-w-[44px] min-h-[44px]">
  <Icon size={24} />
</button>
```

### Spacing Between Tappable Elements

**Minimum:** 8px between elements
**Recommended:** 12-16px

```tsx
<div className="flex gap-3 sm:gap-4">
  <button>Button 1</button>
  <button>Button 2</button>
</div>
```

## Image & Icon Scaling

### Icons
```tsx
/* Responsive icon sizing */
<Icon className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20" />

/* Inline icons (relative to text) */
<Icon className="w-5 h-5 inline-block" />
```

### Images
```tsx
/* Responsive images */
<img
  src="/image.jpg"
  className="w-full h-auto max-w-xs sm:max-w-md lg:max-w-lg"
  alt="Description"
/>
```

## Overflow Handling

### Horizontal Scrolling (Use Sparingly)

For tabs or small carousels:
```tsx
<div className="flex overflow-x-auto space-x-2 sm:space-x-4 -mx-4 px-4 sm:mx-0">
  <div className="flex-shrink-0">Tab 1</div>
  <div className="flex-shrink-0">Tab 2</div>
  <div className="flex-shrink-0">Tab 3</div>
</div>
```

### Text Overflow
```tsx
/* Truncate long text */
<div className="truncate max-w-[200px] sm:max-w-none">
  {longText}
</div>

/* Show more/less toggle on mobile */
{isMobile ? (
  <p className={expanded ? '' : 'line-clamp-3'}>
    {text}
    <button onClick={toggle}>
      {expanded ? 'Show less' : 'Show more'}
    </button>
  </p>
) : (
  <p>{text}</p>
)}
```

## Testing Checklist

For each component, verify:

### Visual Testing
- [ ] Renders correctly at 375px (iPhone SE)
- [ ] Renders correctly at 768px (iPad)
- [ ] Renders correctly at 1440px (Desktop)
- [ ] No horizontal scrolling at any size
- [ ] Text is readable (not too small or too large)
- [ ] Images scale proportionally
- [ ] Layout doesn't break between breakpoints

### Interaction Testing
- [ ] All buttons are tappable (44px+ target)
- [ ] Form inputs are easy to tap
- [ ] Dropdowns work on touch devices
- [ ] Modals are closeable on mobile
- [ ] Navigation is accessible
- [ ] Scrolling is smooth

### Content Testing
- [ ] Important content visible without scrolling
- [ ] Priority order makes sense on mobile
- [ ] No critical information hidden on mobile
- [ ] User can complete primary tasks on mobile

## Files to Modify (Phase 3)

### Work Stream E: Navigation & Layout
- `src/components/Navbar.tsx`
- `src/components/Layout.tsx`
- `src/components/Sidebar.tsx` (if exists)

### Work Stream F: Page Components
- `src/pages/LandingPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/ResultsPage.tsx`
- `src/pages/UploadPage.tsx`
- `src/pages/SignInPage.tsx`
- `src/pages/SignUpPage.tsx`

### Work Stream G: Data Display
- `src/components/bom/BOMTable.tsx` ← **Most complex**
- `src/components/payment/PricingModal.tsx`
- `src/components/guides/BreadboardGuide.tsx`
- `src/components/guides/StripboardGuide.tsx`

### Work Stream H: Visualizations
- `src/components/visualizations/BreadboardGrid.tsx`
- `src/components/visualizations/StripboardView.tsx`

## Success Criteria

✅ **No horizontal scroll** on any device
✅ **All text readable** (14px minimum)
✅ **All buttons tappable** (44px minimum)
✅ **Tables work on mobile** (card layout)
✅ **Navigation accessible** (hamburger menu)
✅ **Forms usable** (proper input sizing)
✅ **Images scale** (no overflow or distortion)

---

**Next:** See `2-technical-design/mobile-responsive-patterns.md` for implementation details
