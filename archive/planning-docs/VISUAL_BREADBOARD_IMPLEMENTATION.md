# Visual Breadboard Implementation Plan
## LEGO-Style Step-by-Step Visual Guides

**Date:** February 13, 2026
**Priority:** CRITICAL - Core Mission Failure
**Goal:** Transform text-based instructions into visual, LEGO-like step-by-step diagrams

---

## 🎯 THE PROBLEM

**Current State**: Breadboard guide shows text instructions only
- ❌ No visual representation of the board
- ❌ Users must imagine where components go
- ❌ Completely fails the "LEGO-simple" mission
- ❌ No progressive building visualization

**Target State**: Each step shows actual breadboard diagram
- ✅ Visual image showing EXACTLY what the breadboard looks like at that step
- ✅ Progressive build-up from blank board to finished circuit
- ✅ Realistic component representations (resistors, ICs, wires)
- ✅ Color-coded wiring matching real-world standards
- ✅ LEGO-instruction-manual style presentation

---

## 📸 REFERENCE EXAMPLES

See `/design-references/` folder for examples of ideal breadboard visualizations:
- `breadboard-ref-1.png` - Blank 830-point breadboard
- `breadboard-ref-2.png` - Early stage with resistors and ICs
- `breadboard-ref-3.png` - Mid-stage with more components
- `breadboard-ref-4.png` - Advanced stage with wiring

**Key Observations:**
1. Components look EXACTLY like real components (not abstract symbols)
2. Breadboard holes clearly visible
3. Wire colors match real standards (red=power, black=ground, etc.)
4. Component leads shown inserted into specific holes
5. Clear visual progression from simple to complex

---

## 🎨 VISUAL DESIGN REQUIREMENTS

### Breadboard Base
```
Standard 830-point breadboard:
- Dimensions: 830 tie points
- Power rails: Red/Blue stripes on sides
- Terminal strips: 63 columns x 5 rows (x2 sections)
- Visual style: Realistic with slight depth/shadow
- Background: White or light grey
```

### Component Representations

**Resistors:**
- Show actual color bands (brown-black-red, etc.)
- Bent leads at 90° when inserted
- Component body raised above board
- Lead holes clearly marked

**Capacitors:**
- Electrolytic: Black/blue cylinder with polarity marking
- Ceramic: Yellow/orange disc shape
- Film: Blue rectangular body
- Show correct orientation for polarized caps

**ICs (Integrated Circuits):**
- Black rectangular body with notch
- Pin numbering visible (1, 8 for 8-pin)
- Legs straddling center channel
- Label visible on top (TL072, etc.)

**Transistors:**
- TO-92 package (half-circle black body)
- Three legs (E, B, C)
- Orientation marking visible
- Part number on flat side

**Diodes:**
- Glass body with color band
- Polarity band clearly visible (cathode)
- Correct orientation shown

**LEDs:**
- Round colored head (red, green, etc.)
- Flat side indicating cathode
- Longer lead = anode

**Wires/Jumpers:**
- Solid core wire in standard colors:
  - Red: +voltage
  - Black: Ground
  - Yellow: Signal
  - Green: Signal
  - Blue: Signal
  - Orange: Signal
- Wire arcs over components where needed
- Both ends clearly in specific holes

### Step Progression System

Each step builds on the previous:

**Step 1**: Blank breadboard (reference image)
**Step 2**: Power connections (red/black wires to rails)
**Step 3**: Add first resistors (R1, R2)
**Step 4**: Add IC with socket
**Step 5**: Add capacitors around IC
**Step 6**: Add transistors
**Step 7**: Add signal path wiring
**Step 8**: Add input/output jacks (off-board)
**Step N**: Complete circuit

---

## 🛠️ IMPLEMENTATION APPROACH

### Option A: SVG Generation (Recommended for MVP)

**Pros:**
- Scalable to any size
- Programmatically generate from BOM data
- Can animate component placement
- Small file size
- Easy to update

**Cons:**
- Requires custom rendering logic
- Initial development time

**Tech Stack:**
```typescript
- React component: <BreadboardDiagram />
- SVG rendering with React
- Component library: Pre-drawn SVG components
- Layout algorithm: Grid-based positioning
```

**Implementation:**
```typescript
interface BreadboardStep {
  stepNumber: number;
  title: string;
  instruction: string;
  components: PlacedComponent[];
  wires: Wire[];
  highlights?: string[]; // Component IDs to highlight
}

interface PlacedComponent {
  id: string;
  type: 'resistor' | 'capacitor' | 'ic' | 'transistor' | 'led' | 'diode';
  value: string;
  position: {
    row: number; // A-J for standard breadboard
    column: number; // 1-63
  };
  orientation: 'horizontal' | 'vertical';
  rotation?: number;
}

interface Wire {
  id: string;
  color: string;
  from: { row: number; column: number };
  to: { row: number; column: number };
  path: 'straight' | 'arc';
}
```

### Option B: Pre-Rendered Images (Faster MVP)

**Pros:**
- Can use design tools (Fritzing, etc.)
- Highest visual quality
- No rendering logic needed
- Immediate implementation

**Cons:**
- Not scalable (one image per circuit)
- Large file sizes
- Cannot animate
- Hard to customize

**Process:**
1. Use Fritzing or similar tool
2. Export each step as PNG
3. Store in `/public/breadboard-guides/[circuit-id]/step-[n].png`
4. Display in sequence

**Best for:** Initial launch, can replace with SVG later

### Option C: Hybrid Approach (Recommended Long-term)

**MVP:** Pre-rendered images for first 3-5 circuits
**v2:** SVG generator for new circuits
**v3:** AI-generated diagrams from schematics

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: MVP - Pre-Rendered Images (This Week)

**Goal:** Get visual breadboards working ASAP

**Tasks:**
1. ✅ Collect reference breadboard images (DONE)
2. [ ] Create breadboard template (blank 830-point board)
3. [ ] For ONE test circuit (Tube Screamer or FET Driver):
   - [ ] Create Step 1: Blank board
   - [ ] Create Step 2: Power wiring
   - [ ] Create Step 3: First resistors
   - [ ] Create Step 4: IC placement
   - [ ] ... continue through all steps
4. [ ] Update BreadboardGuide component to display images
5. [ ] Add image carousel/swipe functionality
6. [ ] Test on mobile and desktop

**Deliverables:**
- 15-20 step images for one circuit
- Updated BreadboardGuide component
- Mobile-optimized image viewing

**Tools Needed:**
- Fritzing (free, open-source)
- OR: Adobe Illustrator / Figma
- OR: Hand-draw and photograph real breadboard (fastest!)

### Phase 2: Component Library System (Week 2)

**Goal:** Build reusable SVG component library

**Tasks:**
1. [ ] Create SVG breadboard base component
2. [ ] Create SVG library for each component type:
   - [ ] Resistors (with color band generator)
   - [ ] Capacitors (ceramic, electrolytic, film)
   - [ ] ICs (8-pin, 14-pin, 16-pin DIP)
   - [ ] Transistors (TO-92)
   - [ ] Diodes (1N4148, 1N4001)
   - [ ] LEDs (3mm, 5mm)
   - [ ] Wires (with bezier curves for arcs)
3. [ ] Build positioning algorithm (grid-based)
4. [ ] Create `<BreadboardDiagram>` React component
5. [ ] Generate diagrams from BOM data

**Deliverables:**
- SVG component library
- Breadboard renderer component
- Diagram generator from BOM

### Phase 3: Interactive Features (Month 2)

**Goal:** Make diagrams interactive and educational

**Features:**
1. [ ] **Component Highlighting:** Tap component to see details
2. [ ] **Animation:** Components "snap into place" as you progress
3. [ ] **Zoom & Pan:** Pinch to zoom, drag to pan
4. [ ] **3D Tilt:** Subtle parallax effect for depth
5. [ ] **Color Legends:** Tap wire to see what it connects
6. [ ] **Part Callouts:** Arrows pointing to specific parts
7. [ ] **Error Detection:** Red highlight if component placed wrong
8. [ ] **AR Mode:** Point camera at real breadboard, overlay guide

---

## 🎨 BREADBOARD VISUAL DESIGN SYSTEM

### Color Palette (Matching Real Components)

```css
/* Breadboard */
--breadboard-body: #F5F5F5;
--breadboard-holes: #333333;
--breadboard-power-red: #CC0000;
--breadboard-power-blue: #0066CC;
--breadboard-text: #666666;

/* Wire Colors (Standard) */
--wire-power-red: #CC0000;
--wire-ground-black: #000000;
--wire-signal-yellow: #FFCC00;
--wire-signal-green: #00AA00;
--wire-signal-blue: #0066CC;
--wire-signal-orange: #FF6600;
--wire-signal-white: #FFFFFF;
--wire-signal-grey: #999999;

/* Resistor Color Bands */
--resistor-brown: #8B4513;
--resistor-red: #CC0000;
--resistor-orange: #FF6600;
--resistor-yellow: #FFCC00;
--resistor-green: #00AA00;
--resistor-blue: #0066CC;
--resistor-violet: #9400D3;
--resistor-grey: #808080;
--resistor-white: #FFFFFF;
--resistor-gold: #FFD700;
--resistor-silver: #C0C0C0;

/* IC Chips */
--ic-body: #1A1A1A;
--ic-text: #CCCCCC;
--ic-notch: #666666;
--ic-pin: #999999;

/* Capacitors */
--cap-ceramic: #FFCC99;
--cap-electrolytic: #0066CC;
--cap-film: #3399FF;

/* Transistors */
--transistor-body: #1A1A1A;
--transistor-text: #666666;

/* LEDs */
--led-red: #FF0000;
--led-green: #00FF00;
--led-yellow: #FFFF00;
--led-blue: #0000FF;
```

### Component Dimensions (SVG Units)

**Breadboard Grid:**
```
Column spacing: 10 units (2.54mm scale)
Row spacing: 10 units
Hole diameter: 2 units
Power rail spacing: 5 units between buses
```

**Components (proportional):**
```
Resistor: 30 units long, 6 units diameter
Capacitor (ceramic): 12x12 units
Capacitor (electrolytic): 20 units tall, 10 diameter
IC (8-pin): 40 units wide, 18 units tall
Transistor: 10 units diameter (half-circle)
LED: 10 units diameter (round head)
Diode: 20 units long, 4 units diameter
Wire thickness: 1.5 units
```

---

## 📱 MOBILE OPTIMIZATION

### Touch Interactions

```typescript
// Pinch to zoom
const handlePinch = (scale: number) => {
  setBoardScale(Math.max(1, Math.min(scale, 4)));
};

// Drag to pan (when zoomed)
const handlePan = (deltaX: number, deltaY: number) => {
  if (boardScale > 1) {
    setBoardOffset({ x: deltaX, y: deltaY });
  }
};

// Tap to highlight component
const handleComponentTap = (componentId: string) => {
  setHighlightedComponent(componentId);
  showComponentInfo(componentId);
};

// Double-tap to reset zoom
const handleDoubleTap = () => {
  setBoardScale(1);
  setBoardOffset({ x: 0, y: 0 });
};
```

### Progressive Enhancement

```typescript
// Load low-res preview first, then high-res
<img
  src={`/breadboard-guides/${circuitId}/step-${stepNum}-preview.jpg`}
  srcset={`
    /breadboard-guides/${circuitId}/step-${stepNum}-1x.jpg 1x,
    /breadboard-guides/${circuitId}/step-${stepNum}-2x.jpg 2x
  `}
  loading="lazy"
  alt={`Step ${stepNum}: ${stepTitle}`}
/>
```

---

## 🧩 COMPONENT IMPLEMENTATION

### Updated BreadboardGuide Component

```typescript
// src/components/guides/BreadboardGuide.tsx

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface BreadboardStep {
  number: number;
  title: string;
  instruction: string;
  imagePath: string; // Path to breadboard diagram
  components: string[]; // Components added this step
  tips?: string;
}

export default function BreadboardGuide({ circuitId }: { circuitId: string }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Load steps for this circuit
  const steps: BreadboardStep[] = loadStepsForCircuit(circuitId);
  const step = steps[currentStep - 1];

  return (
    <div className="breadboard-guide">
      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
        <span className="progress-text">Step {currentStep} of {steps.length}</span>
      </div>

      {/* Main Breadboard Image */}
      <div className="breadboard-viewer">
        <img
          src={step.imagePath}
          alt={step.title}
          style={{ transform: `scale(${zoomLevel})` }}
          className="breadboard-diagram"
        />

        {/* Zoom Controls */}
        <div className="zoom-controls">
          <button onClick={() => setZoomLevel(z => Math.max(1, z - 0.25))}>
            <ZoomOut size={20} />
          </button>
          <span>{Math.round(zoomLevel * 100)}%</span>
          <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))}>
            <ZoomIn size={20} />
          </button>
        </div>
      </div>

      {/* Step Instructions */}
      <div className="step-instructions">
        <h2 className="step-title">{step.title}</h2>
        <p className="step-instruction">{step.instruction}</p>

        {/* Components Added This Step */}
        <div className="components-this-step">
          <h3>Components for this step:</h3>
          <ul>
            {step.components.map((comp, i) => (
              <li key={i}>{comp}</li>
            ))}
          </ul>
        </div>

        {/* Pro Tip */}
        {step.tips && (
          <div className="pro-tip">
            <h4>💡 Pro Tip</h4>
            <p>{step.tips}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="step-navigation">
        <button
          onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
          disabled={currentStep === 1}
        >
          <ChevronLeft size={24} />
          Previous
        </button>

        <button
          onClick={() => setCurrentStep(s => Math.min(steps.length, s + 1))}
          disabled={currentStep === steps.length}
          className="btn-primary"
        >
          {currentStep === steps.length ? 'Complete' : 'Next Step'}
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
```

### Styling (Following UX Design System)

```css
/* src/components/guides/BreadboardGuide.css */

.breadboard-guide {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-white);
}

.progress-bar {
  position: relative;
  height: 8px;
  background: #E8E8E8;
  margin-bottom: var(--space-2);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #2E86DE 0%, #3498DB 100%);
  transition: width 500ms cubic-bezier(0.34, 1.56, 0.64, 1); /* LEGO snap easing */
}

.progress-text {
  position: absolute;
  top: 12px;
  left: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-light);
}

.breadboard-viewer {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #F8F9FA;
  padding: var(--space-3);
}

.breadboard-diagram {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 300ms ease-in-out;
  touch-action: pinch-zoom;
}

.zoom-controls {
  position: absolute;
  bottom: var(--space-2);
  right: var(--space-2);
  display: flex;
  gap: var(--space-1);
  background: white;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.zoom-controls button {
  padding: var(--space-1);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--primary);
  transition: all 150ms ease;
}

.zoom-controls button:hover {
  background: rgba(46, 134, 222, 0.1);
  border-radius: var(--radius-sm);
}

.step-instructions {
  padding: var(--space-3);
  background: white;
  border-top: 1px solid #E8E8E8;
}

.step-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: var(--space-2);
}

.step-instruction {
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--text-dark);
  margin-bottom: var(--space-3);
}

.components-this-step {
  background: #F8F9FA;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
}

.components-this-step h3 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.components-this-step ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.components-this-step li {
  padding: var(--space-1) 0;
  font-size: var(--text-base);
  color: var(--text-dark);
  border-bottom: 1px solid #E8E8E8;
}

.components-this-step li:last-child {
  border-bottom: none;
}

.pro-tip {
  background: linear-gradient(135deg, #FFF9E6 0%, #FFFAED 100%);
  border-left: 4px solid #FFC93C;
  padding: var(--space-2);
  border-radius: var(--radius-md);
}

.pro-tip h4 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: #B8860B;
  margin-bottom: var(--space-1);
}

.pro-tip p {
  font-size: var(--text-sm);
  color: #8B7500;
  margin: 0;
}

.step-navigation {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  border-top: 1px solid #E8E8E8;
  background: white;
}

.step-navigation button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: 14px var(--space-3);
  border: 2px solid #2E86DE;
  border-radius: var(--radius-full);
  background: white;
  color: #2E86DE;
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.step-navigation button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(46, 134, 222, 0.3);
}

.step-navigation button:active:not(:disabled) {
  transform: translateY(0);
}

.step-navigation button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-navigation .btn-primary {
  background: linear-gradient(135deg, #2E86DE 0%, #3498DB 100%);
  color: white;
  border: none;
}

.step-navigation .btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(46, 134, 222, 0.4);
}
```

---

## 🎯 SUCCESS CRITERIA

**Visual Quality:**
- [ ] Breadboard diagrams are photorealistic or near-photorealistic
- [ ] Components are immediately recognizable
- [ ] Color coding matches real-world standards
- [ ] Progression is crystal clear (blank → complete)

**User Experience:**
- [ ] New users understand what to do without reading text
- [ ] Mobile pinch-to-zoom works smoothly
- [ ] Images load quickly (<1s on 4G)
- [ ] Can navigate entire build with images alone

**Technical:**
- [ ] Images optimized for mobile (WebP format, <300KB each)
- [ ] Lazy loading for off-screen steps
- [ ] Works offline (PWA cached)
- [ ] Responsive on all screen sizes

---

## 📊 METRICS TO TRACK

Post-implementation:
- **Build Completion Rate**: % of users who finish builds
- **Step Time**: Average time per step (should decrease with visuals)
- **Support Requests**: "Where does this go?" questions (should drop significantly)
- **User Satisfaction**: Survey after build completion
- **Return Rate**: Users coming back for second build

Target Improvements:
- Build completion rate: 40% → 75%+
- Support requests: -60%
- Time per step: -30% (faster with visuals)
- User satisfaction: 8.5/10 → 9.5/10

---

## 🚀 IMMEDIATE NEXT STEPS

**This Week:**
1. [ ] Create breadboard template (blank board)
2. [ ] Pick one test circuit (FET Driver recommended - simple)
3. [ ] Generate 10-15 step images manually (Fritzing or photograph real board)
4. [ ] Update BreadboardGuide component to display images
5. [ ] Test on mobile device
6. [ ] Get user feedback

**Next Week:**
1. [ ] Create second circuit with lessons learned
2. [ ] Begin SVG component library
3. [ ] Document image creation process for team/contractors

**Month 2:**
1. [ ] Build automated SVG generator
2. [ ] Add interactive features
3. [ ] Create 5-10 popular circuits

---

**This is the #1 priority for making PedalPath truly LEGO-simple and achieving product-market fit.**

The visual breadboard system is the core differentiator that makes PedalPath accessible to complete beginners - without it, we're just another circuit-building website.

---

*End of Visual Breadboard Implementation Plan*
