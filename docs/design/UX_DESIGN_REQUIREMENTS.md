# PedalPath UX/UI Design Requirements
## Cross-Platform Application (iOS, Android, Web/Desktop)
### "LEGO-Simple, Apple-Beautiful, Intuit-Obvious"

**Version:** 1.0  
**Date:** February 14, 2026  
**For:** Claude Code Implementation  
**Design Philosophy:** Make guitar pedal building feel as intuitive as assembling LEGO bricks

---

## 🎯 CORE DESIGN PHILOSOPHY

### The Three Pillars

**1. LEGO Simplicity**
- Every action is visually obvious before you interact
- Complex processes broken into discrete, satisfying steps
- Immediate visual feedback for every action
- Colorful, approachable, never intimidating
- "Anyone can do this" confidence

**2. Apple Elegance**
- Refined, purposeful interface with generous white space
- Smooth, delightful animations that communicate state
- Platform-native feel on every device
- Accessibility built-in from day one
- Typography and color that feel premium

**3. Intuit Functionality**
- Zero learning curve - functionality obvious from appearance
- Progressive disclosure (complexity hidden until needed)
- Smart defaults that work for 80% of users
- Contextual help exactly when/where needed
- Error prevention over error handling

---

## 🎨 VISUAL DESIGN SYSTEM

### Color Philosophy: "LEGO Builder's Palette"

**Primary Colors** (Bright, Playful, Confident)
```
Primary Blue: #2E86DE      // LEGO Classic Blue - primary actions, headers
Accent Yellow: #FFC93C     // LEGO Yellow - success, highlights, "aha!" moments
Signal Red: #E74C3C        // LEGO Red - warnings, critical components
Success Green: #27AE60     // LEGO Green - completed steps, verification
Background White: #F8F9FA  // Clean canvas, like LEGO baseplate
Text Dark: #2C3E50         // High contrast, accessible
Text Light: #7F8C8D        // Secondary info, labels
```

**Gradient System** (Depth and Visual Interest)
```
Hero Gradient: Linear from #2E86DE → #3498DB (subtle 10% variation)
Card Shadow: 0 4px 16px rgba(46, 134, 222, 0.08) // Subtle elevation
Hover Glow: 0 0 24px rgba(255, 201, 60, 0.3)     // Yellow accent on interaction
```

**Component-Specific Colors**
```
Resistor Brown: #8B4513    // When showing resistor components
Capacitor Orange: #FF6B35  // When showing capacitor components  
IC Black: #1A1A1A          // When showing IC chips
Wire Rainbow: Use actual wire colors (red, black, yellow, green, blue, etc.)
```

### Typography: "Clarity + Character"

**Font Stack (Cross-Platform Safe)**
```css
/* Display/Headers - Distinctive but legible */
--font-display: 'SF Pro Display', 'Segoe UI Variable', 'Google Sans', system-ui, -apple-system, sans-serif;
font-weight: 700; /* Bold for confidence */
letter-spacing: -0.02em; /* Tight for modern feel */

/* Body/Interface - Maximum readability */
--font-body: 'SF Pro Text', 'Segoe UI', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
font-weight: 400; /* Regular */
line-height: 1.6; /* Generous for scannability */

/* Code/Technical - Monospace for precision */
--font-mono: 'SF Mono', 'Cascadia Code', 'Consolas', 'Monaco', monospace;
font-weight: 500; /* Medium for clarity */
```

**Type Scale (Modular Scale 1.25)**
```css
/* Mobile-first with responsive scaling */
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);    /* 12px → 14px */
--text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);      /* 14px → 16px */
--text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);      /* 16px → 18px */
--text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);     /* 18px → 20px */
--text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);      /* 20px → 24px */
--text-2xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);           /* 24px → 32px */
--text-3xl: clamp(2rem, 1.7rem + 1.5vw, 3rem);           /* 32px → 48px */
```

### Spacing System: "8px Grid (LEGO Studs)"

All spacing based on 8px increments (like LEGO brick studs):
```css
--space-1: 8px;    /* Tight - between related elements */
--space-2: 16px;   /* Standard - card padding, form fields */
--space-3: 24px;   /* Comfortable - section spacing */
--space-4: 32px;   /* Generous - between major sections */
--space-6: 48px;   /* Dramatic - hero sections */
--space-8: 64px;   /* Monumental - page sections */
```

### Border Radius: "Friendly but Professional"

```css
--radius-sm: 8px;   /* Buttons, tags, small cards */
--radius-md: 12px;  /* Cards, inputs, medium components */
--radius-lg: 16px;  /* Large cards, modals */
--radius-xl: 24px;  /* Hero sections, feature cards */
--radius-full: 9999px; /* Pills, avatars, circular elements */
```

### Animation & Motion: "Playful but Purposeful"

**Timing Functions**
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);      /* Standard transitions */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy "LEGO snap" feel */
--ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);  /* Smooth scrolling */
```

**Durations**
```css
--duration-fast: 150ms;    /* Micro-interactions (hover, focus) */
--duration-base: 300ms;    /* Standard transitions (expand, collapse) */
--duration-slow: 500ms;    /* Page transitions, reveals */
--duration-reveal: 800ms;  /* Sequential step reveals */
```

**Signature Animations**
```css
/* "LEGO Snap" - element slides in and slightly bounces */
@keyframes lego-snap {
  0% { 
    transform: translateY(20px) scale(0.95);
    opacity: 0;
  }
  60% { 
    transform: translateY(-2px) scale(1.02);
  }
  100% { 
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* "Step Complete" - checkmark draw + glow */
@keyframes step-complete {
  0% { 
    stroke-dashoffset: 100;
    filter: drop-shadow(0 0 0 rgba(39, 174, 96, 0));
  }
  100% { 
    stroke-dashoffset: 0;
    filter: drop-shadow(0 0 8px rgba(39, 174, 96, 0.5));
  }
}

/* "Component Highlight" - pulse on selection */
@keyframes component-pulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(255, 201, 60, 0);
  }
  50% { 
    box-shadow: 0 0 0 8px rgba(255, 201, 60, 0.3);
  }
}
```

---

## 📱 PLATFORM-SPECIFIC GUIDELINES

### iOS Implementation

**Follow Apple HIG Principles:**
```
1. Navigation: Use native iOS navigation patterns
   - Tab bar for main sections (Home, Library, Profile)
   - Navigation bar with large title on scroll
   - Native back gestures (swipe from edge)
   
2. Components: SF Symbols for icons
   - Use filled variants for selected states
   - Consistent 22pt icon size for tab bar
   - 28pt for toolbar actions
   
3. Typography: SF Pro Display/Text (system default)
   - Dynamic Type support (respect user size preferences)
   - Automatic weight adjustment for legibility
   
4. Interactions:
   - Haptic feedback for every significant action
     • Light impact: Button taps
     • Medium impact: Step completion
     • Heavy impact: Build verification success
   - Pull-to-refresh on scrollable lists
   - Long-press for contextual menus
   
5. Safe Areas: Respect notch/Dynamic Island
   - Content insets for rounded corners
   - Tab bar spacing for home indicator
```

**iOS-Specific Features:**
- **Widgets:** "Next Build Step" widget (home screen quick glance)
- **Shortcuts:** Siri integration ("Show me Tube Screamer build")
- **ShareSheet:** Native sharing to save guides, send to friends
- **Dark Mode:** Automatic with elevated contrast for components

### Android Implementation

**Follow Material Design 3:**
```
1. Navigation: Material Design patterns
   - Bottom navigation bar (same content as iOS tabs)
   - Top app bar with elevation on scroll
   - Navigation drawer for secondary options
   
2. Components: Material Icons (filled/outlined variants)
   - 24dp base icon size
   - Use outlined for unselected, filled for selected
   
3. Typography: Roboto (system default)
   - Scale matches Material type scale
   - Support variable font weights if available
   
4. Interactions:
   - Ripple effects on all touchable surfaces
   - Floating Action Button (FAB) for primary action
   - Snackbar for confirmations (not modal dialogs)
   
5. System Bars:
   - Edge-to-edge layout
   - Transparent status bar with scrim
   - Gesture navigation support (no bottom nav conflict)
```

**Android-Specific Features:**
- **Widgets:** Resizable home screen widget (build progress)
- **Quick Settings Tile:** "Current Build Step" quick toggle
- **Share Integration:** Native Android share sheet
- **Adaptive Icons:** Support for different launcher shapes

### Web/Desktop Implementation

**Progressive Web App (PWA) Standards:**
```
1. Responsive Breakpoints:
   Mobile:  < 640px  (1 column, touch-optimized)
   Tablet:  640-1024px (2 columns, hybrid touch/cursor)
   Desktop: > 1024px (3+ columns, cursor-optimized)
   
2. Navigation: Hybrid approach
   Mobile: Bottom nav (iOS-style) or drawer (Android-style)
   Tablet: Side navigation rail
   Desktop: Persistent sidebar + top utility bar
   
3. Keyboard Navigation:
   - Tab through all interactive elements
   - Arrow keys for step-by-step navigation
   - Spacebar for "Next Step"
   - Escape to close modals/overlays
   
4. Cursor States:
   - Pointer for clickable (buttons, links)
   - Grab/grabbing for draggable components
   - Help cursor for info tooltips
   - Progress for loading states
```

**Desktop-Specific Features:**
- **Multi-Window:** Drag guide to separate window
- **Keyboard Shortcuts:** Cmd/Ctrl+K for search, Cmd/Ctrl+N for new build
- **Print Optimization:** Clean printer-friendly CSS
- **Offline Support:** Service worker caching for purchased guides

---

## 🧩 COMPONENT LIBRARY (LEGO-Inspired UI Kit)

### 1. "Brick" Card System

**Base Card Component:**
```css
.brick-card {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  box-shadow: 
    0 1px 3px rgba(0,0,0,0.08),
    0 0 0 1px rgba(0,0,0,0.04);
  transition: all var(--duration-base) var(--ease-in-out);
}

.brick-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 24px rgba(0,0,0,0.12),
    0 0 0 1px rgba(46, 134, 222, 0.2);
}

.brick-card--clickable {
  cursor: pointer;
}

.brick-card--clickable:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
```

**Card Variants:**
```
brick-card--component    // For displaying individual components (resistor, capacitor)
brick-card--step         // For build steps (numbered, with checkbox)
brick-card--guide        // For guide selection (cover image + title)
brick-card--info         // For informational panels (tips, warnings)
```

### 2. "Step Indicator" Component

**Visual Design:**
```
[✓] Step 1: Gather Components     ← Completed (green check, grey text)
[2] Step 2: Place Resistors        ← Current (blue circle, bold text)
[ ] Step 3: Add Capacitors         ← Upcoming (grey circle, grey text)
```

**Implementation:**
```jsx
<StepIndicator 
  steps={buildSteps}
  currentStep={2}
  onStepClick={(stepNum) => navigateToStep(stepNum)}
  allowBacktrack={true}  // Can click previous steps
  allowSkip={false}      // Cannot skip ahead
/>
```

**Interaction Behavior:**
- **Click:** Navigate to that step (if completed or current)
- **Hover:** Preview step title
- **Long-press/Right-click:** Show step notes
- **Animation:** "LEGO snap" when advancing to next step

### 3. "Component Viewer" (3D-Inspired 2D)

**Visual Concept:** Like LEGO instruction manuals - flat 2D but implies 3D depth

```
┌─────────────────────────────────┐
│  [Component Image - Lifelike]  │  ← Actual photograph of component
│                                  │
│  Resistor 1kΩ                   │  ← Name (bold, clear)
│  Brown-Black-Red-Gold            │  ← Color code (if resistor)
│  Quantity: 2                     │  ← How many needed
│  Location: R1, R4                │  ← Board positions
│                                  │
│  [✓] Have it  [ ] Order         │  ← Status checkboxes
└─────────────────────────────────┘
```

**Interaction:**
- **Tap/Click:** Enlarge component image (modal)
- **Long-press:** Show where to buy
- **Swipe left:** Mark as "Have it"
- **Swipe right:** Add to shopping list

### 4. "Build Progress Bar" (Gamified)

**Visual Design:**
```
╔══════════════════════════════════════════════════╗
║ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ║  65% Complete
║                                                    ║
║ 🎯 Next: Solder IC socket to board               ║
║ ⏱️ ~15 minutes remaining                          ║
╚══════════════════════════════════════════════════╝
```

**Features:**
- Animated progress on step completion
- Confetti animation at 100%
- Time estimates based on step complexity
- Micro-celebrations at 25%, 50%, 75% milestones

### 5. "Smart Button" System

**Three Button Types:**

**Primary Action** (Most important - one per screen)
```css
.btn-primary {
  background: linear-gradient(135deg, #2E86DE 0%, #3498DB 100%);
  color: white;
  padding: 14px 32px;
  border-radius: var(--radius-full);
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(46, 134, 222, 0.3);
  transition: all var(--duration-fast) var(--ease-spring);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(46, 134, 222, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}
```

**Secondary Action** (Supporting actions)
```css
.btn-secondary {
  background: white;
  color: #2E86DE;
  border: 2px solid #2E86DE;
  padding: 12px 28px;
  border-radius: var(--radius-full);
  font-weight: 600;
}
```

**Tertiary Action** (Minimal, text-only)
```css
.btn-tertiary {
  background: transparent;
  color: #2E86DE;
  padding: 8px 16px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 4px;
}
```

### 6. "Component Library Modal"

**Layout (Full-screen overlay):**
```
┌────────────────────────────────────────────┐
│ ← Components Library              [× Close]│
│                                             │
│ Search: [________________]  [Filters ▼]   │
│                                             │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│ │ R1   │ │ R2   │ │ C1   │ │ IC1  │      │  ← Grid of components
│ │ 1kΩ  │ │ 10kΩ │ │100nF │ │TL072 │      │
│ │[✓]   │ │[ ]   │ │[✓]   │ │[ ]   │      │  ← Checkboxes
│ └──────┘ └──────┘ └──────┘ └──────┘      │
│                                             │
│ [Continue Building →]                      │
└────────────────────────────────────────────┘
```

**Features:**
- **Search:** Fuzzy search by component name or value
- **Filters:** Type (resistor, cap, IC), Status (have/need)
- **Sort:** Alphabetical, by location on board, by purchase status
- **Bulk Actions:** "Mark all as ordered," "Generate shopping list"

### 7. "Visual Troubleshooting" Widget

**Concept:** Decision tree presented visually, not text-heavy

```
Does it power on?
  ├─ YES → [Next Question]
  └─ NO → Check power connections
           ├─ [View Power Section ⚡]
           └─ [Watch Video Tutorial 🎥]
```

**Implementation:**
- Flowchart style with icons
- Each node is tappable/clickable
- Highlights current question
- Shows path taken (breadcrumb trail)

---

## 🎭 USER FLOWS (Step-by-Step Scenarios)

### Flow 1: "First-Time User → Successful Build"

**Goal:** Zero to working pedal in clearest possible path

```
1. WELCOME SCREEN
   ├─ Hero: "Build Guitar Pedals Like LEGO"
   ├─ 3 feature cards with animations
   └─ [Get Started] button (pulsing gently)

2. ONBOARDING (3 screens, swipeable)
   ├─ Screen 1: "Pick Your Circuit" (visual grid)
   ├─ Screen 2: "Check Your Components" (photo checklist)
   ├─ Screen 3: "Follow Step-by-Step" (animated demo)
   └─ [Skip] always available (top-right)

3. CIRCUIT SELECTION
   ├─ Featured circuits (3 popular ones, large cards)
   ├─ Browse all (searchable grid)
   ├─ Each card shows:
   │   ├─ Photo of finished pedal
   │   ├─ Difficulty (🟢 Easy, 🟡 Medium, 🔴 Hard)
   │   ├─ Build time estimate
   │   └─ Price of guide
   └─ Tap card → Preview page

4. GUIDE PREVIEW (Before purchase)
   ├─ Hero image of circuit
   ├─ Description (what it sounds like)
   ├─ "What's Included" expandable list
   ├─ Sample step (shows quality)
   ├─ Reviews/ratings (once launched)
   └─ [Buy Guide - $XX] button

5. PURCHASE FLOW
   ├─ Apple Pay / Google Pay / Stripe (one-tap if possible)
   ├─ Immediate download (no email verification wait)
   └─ Celebration animation → [Start Building]

6. BUILD PREPARATION
   ├─ "Before You Begin" checklist:
   │   ├─ [ ] Soldering iron ready
   │   ├─ [ ] All components gathered
   │   ├─ [ ] Workspace clear
   │   └─ [I'm Ready ✓] button
   ├─ Component verification screen
   │   ├─ Photo grid of every component
   │   ├─ Tap to mark as "have it"
   │   └─ [Generate Shopping List] for missing items
   └─ [Begin Build →] (only enabled when checklist complete)

7. STEP-BY-STEP BUILD
   ├─ Full-screen step view:
   │   ├─ Step number + total (Step 3 of 24)
   │   ├─ Large hero image (what to do now)
   │   ├─ Clear instruction text
   │   ├─ Component callouts (arrows pointing to parts)
   │   ├─ Pro tip (expandable, yellow background)
   │   └─ [Mark Complete] button
   ├─ Swipe gestures:
   │   ├─ Swipe left → Next step
   │   ├─ Swipe right → Previous step
   │   ├─ Pinch to zoom image
   │   └─ Tap image for full-screen
   ├─ Persistent bottom bar:
   │   ├─ Progress indicator
   │   ├─ [Pause] button → saves progress
   │   └─ [Help] button → context-sensitive troubleshooting
   └─ Milestone celebrations:
       ├─ 25%: "Great start! 🎉"
       ├─ 50%: "Halfway there! 💪"
       ├─ 75%: "Almost done! 🚀"
       └─ 100%: "You did it! 🎸" + confetti

8. BUILD COMPLETE
   ├─ Success screen with animation
   ├─ [Test Your Pedal] button → Testing guide
   ├─ [Share Your Build] → Photo upload + social
   ├─ [What's Next?] → Suggest related circuits
   └─ [Build Again] → Return to circuit library
```

### Flow 2: "Returning User → Quick Access"

**Goal:** Get back to where they left off in <3 taps

```
1. LAUNCH APP
   ├─ Smart home screen:
   │   ├─ "Continue: Tube Screamer (Step 12 of 24)" [large card]
   │   ├─ "Your Library" [3 purchased guides shown]
   │   └─ "Explore More Circuits" [featured]
   └─ Bottom nav: Home | Library | Profile

2. TAP "CONTINUE"
   ├─ Immediately loads Step 12 (no loading screen needed)
   ├─ Progress bar shows context
   └─ Ready to work in <1 second
```

### Flow 3: "Component Shopping"

**Goal:** Make ordering parts brainlessly simple

```
1. FROM BUILD SCREEN
   ├─ Tap [Components] in top-right
   └─ Opens component library modal

2. COMPONENT LIBRARY VIEW
   ├─ All components for current build
   ├─ Filter: [ All | Have | Need to Order ]
   └─ Each component card:
       ├─ Photo
       ├─ Name + value
       ├─ Quantity needed
       ├─ Checkbox: Have it
       └─ [Buy at Mouser] / [Buy at Tayda] links

3. SHOPPING LIST GENERATION
   ├─ Tap [Generate Shopping List]
   ├─ Smart grouping by supplier:
   │   ├─ Mouser: [12 items] → Copy BOM for cart
   │   ├─ Tayda: [8 items] → Copy BOM for cart
   │   └─ Amazon: [3 items] → Copy list
   ├─ [Copy All Links] → Clipboard
   └─ [Email Me List] → Formatted email with links

4. RETURN TO BUILD
   ├─ Mark components as ordered
   ├─ Notification: "Your parts are on the way! 📦"
   └─ Estimated delivery countdown (optional)
```

---

## ♿ ACCESSIBILITY REQUIREMENTS (Non-Negotiable)

### WCAG 2.1 AA Compliance (Minimum)

**1. Color & Contrast**
```
- Text on background: ≥ 4.5:1 ratio (normal), ≥ 3:1 (large 18pt+)
- Interactive elements: ≥ 3:1 against adjacent colors
- Never rely on color alone (use icons + text)
- Color-blind safe palette (test with simulators)
```

**2. Typography & Readability**
```
- Minimum font size: 16px (mobile), 14px (desktop)
- Line height: 1.5 minimum for body text
- Paragraph width: max 70 characters for readability
- Support Dynamic Type (iOS) and Font Scaling (Android)
- Respect user's motion preferences (prefers-reduced-motion)
```

**3. Keyboard Navigation**
```
- All interactive elements focusable via Tab
- Focus indicators always visible (3px outline, high contrast)
- Skip links for navigation ("Skip to Build Steps")
- No keyboard traps (can always Tab out)
- Logical tab order (matches visual hierarchy)
```

**4. Screen Reader Support**
```
- Semantic HTML (nav, main, article, aside)
- ARIA labels for all interactive elements
- Live regions for dynamic updates (step completion)
- Image alt text (descriptive, not decorative)
- Form labels properly associated with inputs
```

**5. Touch Targets (Mobile)**
```
- Minimum size: 44x44px (iOS), 48x48dp (Android)
- Spacing between targets: ≥ 8px
- No overlapping interactive zones
- Swipe gestures have alternative tap/click options
```

**6. Reduced Motion Mode**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📐 LAYOUT PATTERNS

### Pattern 1: "Step-by-Step View" (Full-Screen, Immersive)

**Mobile Layout:**
```
┌─────────────────────────────┐
│ [←] Step 3 of 24        [⋮] │  ← Header (step nav)
├─────────────────────────────┤
│                              │
│     [HERO IMAGE]            │  ← Main visual (60% height)
│     Component placement      │
│                              │
├─────────────────────────────┤
│ Place resistor R1 (1kΩ)    │  ← Instruction text
│ into holes marked R1 on     │
│ the stripboard.              │
│                              │
│ 💡 Tip: Bend leads first    │  ← Expandable pro tip
├─────────────────────────────┤
│ ████████░░░░░░░░░ 35%       │  ← Progress bar
│                              │
│ [← Previous] [Complete →]   │  ← Action buttons
└─────────────────────────────┘
```

**Desktop Layout (Side-by-side):**
```
┌──────────────────┬────────────────────────────────┐
│                   │ Step 3 of 24: Place Resistors  │
│                   ├────────────────────────────────┤
│                   │                                 │
│   [HERO IMAGE]    │ Place resistor R1 (1kΩ) into  │
│   Component       │ holes marked R1.                │
│   placement       │                                 │
│   (Zoomable)      │ Component: Resistor 1kΩ        │
│                   │ Color code: Brown-Black-Red     │
│                   │ Location: R1 on board           │
│                   │                                 │
│                   │ 💡 Pro Tip                     │
│                   │ Bend the leads to 90°...       │
│                   │                                 │
│                   │ ████████░░░░ 35%               │
│                   │                                 │
│                   │ [Previous] [Mark Complete]     │
└──────────────────┴────────────────────────────────┘
```

### Pattern 2: "Circuit Library Grid"

**Mobile (1 Column):**
```
┌─────────────────────────────┐
│ ┌─────────────────────────┐│
│ │ [Circuit Photo]          ││
│ │                          ││
│ │ Tube Screamer TS-808    ││
│ │ 🟢 Easy · 2-3 hours     ││
│ │ $29.99                   ││
│ └─────────────────────────┘│
│                              │
│ ┌─────────────────────────┐│
│ │ [Circuit Photo]          ││
│ │                          ││
│ │ ProCo RAT               ││
│ │ 🟡 Medium · 3-4 hours   ││
│ │ $34.99                   ││
│ └─────────────────────────┘│
└─────────────────────────────┘
```

**Desktop (3+ Columns):**
```
┌──────────┬──────────┬──────────┬──────────┐
│ [Photo]  │ [Photo]  │ [Photo]  │ [Photo]  │
│ TS-808   │ RAT      │ Klon     │ Fuzz     │
│ 🟢 $29   │ 🟡 $34   │ 🔴 $49   │ 🟢 $24   │
├──────────┼──────────┼──────────┼──────────┤
│ [Photo]  │ [Photo]  │ [Photo]  │ [Photo]  │
│ ...      │ ...      │ ...      │ ...      │
└──────────┴──────────┴──────────┴──────────┘
```

### Pattern 3: "Component Checklist"

**Scrollable List with Visual Hierarchy:**
```
┌─────────────────────────────────┐
│ Components (12 of 18 ready)     │
├─────────────────────────────────┤
│ Resistors                        │
│ ├─ [✓] R1: 1kΩ (x2)             │  ← Completed (grey)
│ ├─ [ ] R2: 10kΩ (x1)            │  ← Needed (blue)
│ └─ [✓] R3: 100kΩ (x1)           │
│                                  │
│ Capacitors                       │
│ ├─ [ ] C1: 100nF (x2)           │
│ ├─ [✓] C2: 1µF (x1)             │
│ └─ [ ] C3: 100µF (x1)           │
│                                  │
│ Semiconductors                   │
│ ├─ [✓] IC1: TL072 (x1)          │
│ └─ [ ] D1: 1N4148 (x2)          │
│                                  │
│ [Generate Shopping List]         │
└─────────────────────────────────┘
```

---

## 🎬 ANIMATION CHOREOGRAPHY

### Page Transitions

**Enter:** "LEGO Snap In"
```javascript
// New page slides up from bottom, bounces slightly
.page-enter {
  transform: translateY(100vh);
  opacity: 0;
}
.page-enter-active {
  transform: translateY(0);
  opacity: 1;
  transition: all 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Exit:** "Slide Out"
```javascript
// Old page slides left and fades
.page-exit {
  transform: translateX(0);
  opacity: 1;
}
.page-exit-active {
  transform: translateX(-100%);
  opacity: 0;
  transition: all 300ms ease-in-out;
}
```

### Micro-Interactions

**Button Press:**
```css
.btn:active {
  transform: scale(0.95);
  transition: transform 100ms ease-out;
}
```

**Checkbox Toggle:**
```javascript
// Checkbox scales up, turns green, shows checkmark
<motion.div
  initial={{ scale: 0.8 }}
  animate={{ scale: 1, backgroundColor: "#27AE60" }}
  transition={{ type: "spring", stiffness: 500, damping: 25 }}
>
  <CheckIcon />
</motion.div>
```

**Step Completion:**
```javascript
// 1. Button press
// 2. Check mark draws (SVG stroke animation)
// 3. Progress bar advances with spring ease
// 4. Confetti burst if milestone (25%, 50%, 75%, 100%)
// 5. Next step "LEGO snaps" into view
```

**Hover States (Desktop):**
```css
.card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 🌗 DARK MODE STRATEGY

### Color Palette Adaptation

**Dark Mode Colors:**
```css
:root[data-theme="dark"] {
  /* Backgrounds */
  --bg-primary: #1A1A2E;      /* Deep blue-black */
  --bg-secondary: #16213E;    /* Slightly lighter */
  --bg-elevated: #0F3460;     /* Cards, modals */
  
  /* Text */
  --text-primary: #E8E8E8;    /* High contrast white */
  --text-secondary: #A8A8A8;  /* Muted grey */
  
  /* Accents (slightly desaturated) */
  --primary: #5DADE2;         /* Lighter blue (accessibility) */
  --accent: #FFD93D;          /* Slightly muted yellow */
  --success: #58D68D;         /* Lighter green */
  --warning: #F39C12;         /* Amber instead of red */
  
  /* Shadows (glow instead of shadow) */
  --shadow: 0 0 20px rgba(93, 173, 226, 0.1);
}
```

**Dark Mode Component Images:**
- Invert component photos slightly (filter: invert(0.1))
- Add subtle glow around component edges
- Increase image brightness by 10-15%

**Toggle Mechanism:**
```javascript
// Respect system preference by default
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Allow manual override (persisted to localStorage)
function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}
```

---

## 🧪 IMPLEMENTATION PRIORITIES (MVP → v2 → v3)

### Phase 1: MVP (Launch - Week 8)

**Core Functionality Only:**
- ✅ Circuit library grid (browse & search)
- ✅ Guide purchase flow (Stripe integration)
- ✅ Step-by-step build view (swipeable)
- ✅ Component checklist (checkboxes)
- ✅ Progress tracking (persistent)
- ✅ Basic responsive layout (mobile + desktop)
- ✅ Light mode only
- ✅ Accessibility basics (semantic HTML, ARIA)

**Deferred to Post-Launch:**
- ❌ Dark mode
- ❌ Advanced animations (just basic transitions)
- ❌ Social sharing
- ❌ Shopping list integration
- ❌ Video tutorials

### Phase 2: Polish (Month 2-3 Post-Launch)

**Based on User Feedback:**
- ✅ Dark mode
- ✅ Enhanced animations (LEGO snap, confetti)
- ✅ Shopping list generator
- ✅ Offline mode (PWA)
- ✅ iOS/Android native apps (if web traction proves it)
- ✅ Video tutorials for complex steps

### Phase 3: Delight (Month 4-6)

**Advanced Features:**
- ✅ AR component identification (point camera at resistor, app identifies it)
- ✅ Community build gallery (photo uploads)
- ✅ Build time challenges (gamification)
- ✅ "Build with friends" (real-time collaboration)
- ✅ 3D board viewer (rotate stripboard model)

---

## 🛠️ TECHNICAL STACK RECOMMENDATIONS

### Frontend Framework

**Recommended: React Native (Expo)**
```
Why:
✅ Single codebase → iOS, Android, Web
✅ Native performance + look-and-feel
✅ Large ecosystem (animations, navigation, etc.)
✅ Fast iteration (hot reload)
✅ Can eject to native if needed later

Alternatives:
- Flutter (if you prefer Dart)
- SwiftUI + Kotlin (if 100% native, but 2x development time)
```

### UI Component Library

**Recommended: Custom (styled from scratch)**
```
Why:
✅ Full control over LEGO aesthetic
✅ No fighting default styles
✅ Lightweight (no unused components)

If time-constrained:
- NativeBase (React Native)
- Tamagui (React Native, excellent performance)
- shadcn/ui (Web only, but highly customizable)
```

### Animation Libraries

**React Native:**
```javascript
import { Animated, Easing } from 'react-native';
import Reanimated from 'react-native-reanimated'; // For complex gestures
import { MotiView } from 'moti'; // For declarative animations
```

**Web:**
```javascript
import { motion } from 'framer-motion'; // Best-in-class web animations
```

### State Management

**Recommended: Zustand (lightweight) or React Context**
```javascript
// Zustand example - simple, no boilerplate
import create from 'zustand';

const useBuildStore = create((set) => ({
  currentStep: 1,
  completedSteps: [],
  components: [],
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  completeStep: (step) => set((state) => ({ 
    completedSteps: [...state.completedSteps, step] 
  })),
}));
```

### Offline Storage

**Recommended: AsyncStorage (React Native) / IndexedDB (Web)**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save progress
await AsyncStorage.setItem('build_progress', JSON.stringify({
  guideId: 'tube-screamer',
  currentStep: 12,
  completedSteps: [1,2,3,4,5,6,7,8,9,10,11],
  components: {...}
}));
```

---

## 📋 DELIVERY CHECKLIST FOR CLAUDE CODE

When you hand this to Claude Code, include:

### 1. Design Assets Needed
```
[ ] Logo (SVG, multiple sizes)
[ ] App icon (1024x1024, with iOS/Android variants)
[ ] Splash screen (light + dark mode)
[ ] Component photos (high-res, white background)
[ ] Circuit photos (finished pedals)
[ ] Color palette (CSS variables file)
[ ] Typography scale (CSS variables file)
```

### 2. Technical Specifications
```
[ ] This design requirements doc (this file)
[ ] API endpoints documentation
[ ] Data models (guides, components, users)
[ ] Authentication flow (Stripe, user accounts)
[ ] Content structure (how guides are stored)
```

### 3. Example Screens (Annotated)
```
[ ] Home screen (with measurements, spacing notes)
[ ] Build step view (interaction notes)
[ ] Component library (filter/search behavior)
[ ] Settings screen (dark mode toggle, etc.)
```

### 4. Priority Order for Claude Code
```
1. FIRST: Set up project structure + color/typography system
2. SECOND: Build core components (buttons, cards, step indicator)
3. THIRD: Implement main flows (circuit selection → purchase → build)
4. FOURTH: Add animations and polish
5. FIFTH: Accessibility audit + fixes
6. SIXTH: Cross-platform testing + refinements
```

---

## 🎯 SUCCESS CRITERIA

**You'll know the UX is right when:**

1. **A 10-year-old could navigate it** (LEGO simplicity test)
2. **It feels native on every platform** (no "this is a website" feel)
3. **Every action has immediate visual feedback** (no dead clicks)
4. **Progress is always visible** (never "where am I?" confusion)
5. **Users smile when they complete a step** (delight factor)
6. **Accessibility score: 95%+** (Lighthouse/axe audit)
7. **First-time users finish their first build** (conversion metric)

---

## 📞 FINAL WORDS FOR CLAUDE CODE

**Remember:**
- This is a **tool for creative joy**, not a technical manual
- Users are **makers and musicians**, not engineers
- Every interaction should feel like **assembling LEGO**, not reading documentation
- **Delight beats efficiency** - if users smile, they'll come back
- **Accessibility is non-negotiable** - everyone deserves to build pedals

**When in doubt:**
- "Would this make sense to someone who's never built a pedal before?"
- "Does this feel playful and approachable, or intimidating?"
- "Can I do this with one thumb while holding a soldering iron?"

**Build something LEGO would be proud of. Make it beautiful. Make it simple. Make it work.**

---

*End of UX/UI Requirements Document*

**Version:** 1.0  
**Last Updated:** February 14, 2026  
**Next Review:** After MVP user testing (Week 10)
