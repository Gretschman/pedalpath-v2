# Testing & QA Plan

**Purpose:** Comprehensive testing strategy for Visual Overhaul
**Audience:** Worker J (QA specialist) and all implementation workers

## Testing Phases

Testing should occur at THREE levels:
1. **Unit Testing** - During implementation (each worker)
2. **Integration Testing** - After each phase completes
3. **End-to-End Testing** - Phase 4, final verification

---

## Phase 1 Testing: Foundation

### Decoder Testing

**File:** `src/utils/decoders/__tests__/*.test.ts`

**Resistor Decoder Tests:**
```typescript
describe('Resistor Decoder', () => {
  test('10kΩ → brown, black, orange, gold', () => {
    const spec = decodeResistor('10kΩ');
    expect(spec.bands[0].color).toBe('brown');
    expect(spec.bands[1].color).toBe('black');
    expect(spec.bands[2].color).toBe('orange');
    expect(spec.bands[3].color).toBe('gold');
  });

  test('4.7kΩ → yellow, violet, red, gold', () => {
    const spec = decodeResistor('4.7kΩ');
    expect(spec.bands[0].color).toBe('yellow');
    expect(spec.bands[1].color).toBe('violet');
    expect(spec.bands[2].color).toBe('red');
  });

  test('handles various formats', () => {
    expect(decodeResistor('10k').resistance).toBe(10000);
    expect(decodeResistor('10K').resistance).toBe(10000);
    expect(decodeResistor('10kohm').resistance).toBe(10000);
    expect(decodeResistor('10000').resistance).toBe(10000);
  });

  test('calculates 1MΩ correctly', () => {
    const spec = decodeResistor('1MΩ');
    expect(spec.resistance).toBe(1000000);
    expect(spec.bands[0].color).toBe('brown');
    expect(spec.bands[2].color).toBe('green');
  });
});
```

**Capacitor Decoder Tests:**
```typescript
describe('Capacitor Decoder', () => {
  test('100nF → ceramic type', () => {
    const spec = decodeCapacitor('100nF');
    expect(spec.capType).toBe('ceramic' | 'film');
    expect(spec.polarized).toBe(false);
  });

  test('10µF → electrolytic, polarized', () => {
    const spec = decodeCapacitor('10µF');
    expect(spec.capType).toBe('electrolytic');
    expect(spec.polarized).toBe(true);
  });

  test('handles various notation', () => {
    expect(decodeCapacitor('100nF').capacitance).toBeCloseTo(100e-9);
    expect(decodeCapacitor('0.1uF').capacitance).toBeCloseTo(100e-9);
    expect(decodeCapacitor('0.1µF').capacitance).toBeCloseTo(100e-9);
  });
});
```

**Coverage Target:** Minimum 80% code coverage

**Run:** `npm test decoders`

### Breadboard Base Testing

**Visual Regression Tests:**

Create reference screenshots and compare:
```bash
npm run test:visual
```

**Verification Checklist:**
- [ ] Breadboard renders without errors
- [ ] Power rails at top/bottom (NOT sides)
- [ ] 63 columns labeled 1-63
- [ ] 10 rows labeled a-j
- [ ] Holes evenly spaced (2.54mm scale)
- [ ] Colors match spec (#F5F5F5, #CC0000, #0066CC)
- [ ] Hole highlighting works
- [ ] Responsive scaling works

**Manual Visual Comparison:**
1. Render `<BreadboardBase size="830" />`
2. Open `breadboard-ref-1.png` side-by-side
3. Compare:
   - Power rail positions (horizontal, not vertical)
   - Hole spacing and alignment
   - Label positions
   - Colors

**Unit Tests for Utilities:**
```typescript
describe('breadboard-utils', () => {
  test('holeToCoordinates calculates position', () => {
    const coords = holeToCoordinates('a1', LAYOUT_830);
    expect(coords.x).toBe(50);
    expect(coords.y).toBe(100);
  });

  test('getConnectedHoles returns correct group', () => {
    const connected = getConnectedHoles('a15', '830');
    expect(connected).toContain('b15');
    expect(connected).toContain('e15');
    expect(connected).not.toContain('f15'); // Different section
  });

  test('validates hole IDs', () => {
    expect(isValidHoleId('a15', '830')).toBe(true);
    expect(isValidHoleId('k15', '830')).toBe(false);
    expect(isValidHoleId('a64', '830')).toBe(false);
  });
});
```

---

## Phase 2 Testing: Component Rendering

### Component SVG Tests

**Visual Tests:**
Each component type should render realistically:

```typescript
describe('Component SVG Rendering', () => {
  test('ResistorSVG renders with correct color bands', () => {
    const spec = decodeResistor('10kΩ');
    const { container } = render(<ResistorSVG spec={spec} />);

    // Check that color bands are present
    const bands = container.querySelectorAll('.color-band');
    expect(bands).toHaveLength(4);

    // Verify colors (check fill or style attributes)
    expect(bands[0].getAttribute('fill')).toBe('#8B4513'); // Brown
  });

  test('CapacitorSVG shows polarity for electrolytic', () => {
    const spec = decodeCapacitor('10µF');
    const { container } = render(<CapacitorSVG spec={spec} />);

    // Should show polarity stripe
    expect(container.querySelector('.polarity-stripe')).toBeInTheDocument();
  });

  test('ICSVG shows pin numbers', () => {
    const spec = decodeIC('TL072');
    const { container } = render(<ICSVG spec={spec} />);

    // Pin numbers should be visible
    expect(container.textContent).toContain('1');
    expect(container.textContent).toContain('8');
  });
});
```

**Manual Visual Review:**
Create test page showing all components:
```tsx
<div style={{ display: 'grid', gap: '20px', padding: '20px' }}>
  <ResistorSVG spec={decodeResistor('10kΩ')} />
  <ResistorSVG spec={decodeResistor('4.7kΩ')} />
  <CapacitorSVG spec={decodeCapacitor('100nF')} />
  <CapacitorSVG spec={decodeCapacitor('10µF')} />
  <ICSVG spec={decodeIC('TL072')} />
  <DiodeSVG spec={decodeDiode('1N4148')} />
</div>
```

**Verification Checklist:**
- [ ] Resistors show correct color bands (verify against real resistor chart)
- [ ] Electrolytic capacitors show polarity stripe
- [ ] ICs show pin 1 indicator and pin numbers
- [ ] Diodes show cathode band
- [ ] All components proportionally realistic
- [ ] Shadows/depth look realistic (not flat)

### Breadboard Integration Tests

```typescript
describe('BreadboardGrid Integration', () => {
  test('renders components on breadboard', () => {
    const placements = [
      { type: 'resistor', value: '10kΩ', startHole: 'a15', endHole: 'a20' },
    ];

    const { container } = render(
      <BreadboardGrid size="830" components={placements} />
    );

    // Component should be positioned correctly
    expect(container.querySelector('[data-component-id]')).toBeInTheDocument();
  });

  test('components positioned at correct coordinates', () => {
    // Test that component SVG is positioned at correct holes
  });
});
```

---

## Phase 3 Testing: Mobile Responsiveness

### Responsive Breakpoint Tests

**Automated Tests:**
```typescript
describe('Mobile Responsiveness', () => {
  test('Navbar shows hamburger on mobile', () => {
    const { container } = render(<Navbar />, {
      viewport: { width: 375, height: 667 },
    });

    expect(container.querySelector('.hamburger-button')).toBeVisible();
    expect(container.querySelector('.desktop-menu')).not.toBeVisible();
  });

  test('BOMTable uses card layout on mobile', () => {
    const { container } = render(<BOMTable />, {
      viewport: { width: 375, height: 667 },
    });

    expect(container.querySelector('.mobile-card-layout')).toBeVisible();
    expect(container.querySelector('table')).not.toBeVisible();
  });
});
```

### Manual Device Testing

**Test Devices:**

| Device | Screen Size | Test Coverage |
|--------|-------------|---------------|
| iPhone SE | 375×667 | Primary - must work |
| iPhone 14 | 390×844 | Primary - must work |
| iPhone 14 Pro Max | 430×932 | Secondary |
| iPad Mini | 768×1024 | Tablet - must work |
| Android Galaxy S21 | 360×800 | Secondary |
| Desktop | 1440×900 | Primary - must work |

**For Each Device:**
1. Open app at each major page
2. Check navigation (hamburger menu on mobile)
3. Check BOM table (cards on mobile, table on desktop)
4. Check forms (proper spacing, tappable inputs)
5. Check visualizations (scale correctly)
6. Check modals (full-screen on mobile)

**Checklist Per Component:**
- [ ] No horizontal scrolling
- [ ] All text readable (14px minimum)
- [ ] All buttons tappable (44px minimum)
- [ ] Images don't overflow
- [ ] Proper spacing (not cramped)
- [ ] Navigation accessible
- [ ] Forms usable

### Performance Testing

**Metrics to Track:**
- Page load time on 3G connection
- Time to interactive
- Layout shift (CLS)
- Largest contentful paint (LCP)

**Tools:**
- Chrome DevTools Lighthouse
- WebPageTest
- GTmetrix

**Targets:**
- Mobile performance score: >90
- Load time (3G): <3 seconds
- CLS: <0.1
- LCP: <2.5s

---

## Phase 4 Testing: End-to-End Integration

### Full Workflow Test

**Scenario:** User uploads schematic → views breadboard guide

1. **Upload Schematic:**
   - [ ] File uploads successfully
   - [ ] Processing feedback shown
   - [ ] Redirects to results page

2. **View BOM:**
   - [ ] Components listed with correct values
   - [ ] Quantities correct
   - [ ] Prices shown
   - [ ] Mobile: Card layout works
   - [ ] Desktop: Table layout works

3. **View Breadboard Guide:**
   - [ ] Breadboard renders correctly
   - [ ] Components shown with realistic visuals
   - [ ] Resistors have correct color bands
   - [ ] Capacitors show polarity (if electrolytic)
   - [ ] ICs show pin numbers
   - [ ] Step-by-step instructions clear
   - [ ] Mobile: Images scale properly

4. **View Stripboard Guide:**
   - [ ] Stripboard renders
   - [ ] Components match breadboard
   - [ ] Mobile: Views stack vertically

### Component Accuracy Testing

**Test with Real Component Kits:**

Create test BOM with known components:
```
10kΩ resistor
4.7kΩ resistor
100nF ceramic capacitor
10µF electrolytic capacitor
TL072 IC
1N4148 diode
```

**Verification:**
1. Physical components laid out on desk
2. Compare PedalPath rendering to real parts
3. Check:
   - [ ] Resistor color bands match real resistor
   - [ ] Capacitor types match (ceramic vs electrolytic)
   - [ ] IC pin count matches
   - [ ] Diode polarity direction correct
   - [ ] Overall appearance realistic

### Visual Comparison Tests

Create folder: `4-testing-qa/visual-comparisons/`

For each circuit, save screenshots:
- `circuit-name-expected.png` (reference, from real build)
- `circuit-name-actual.png` (PedalPath rendering)
- `circuit-name-diff.png` (automated diff highlighting differences)

**Acceptance Criteria:**
Visual similarity >95% (allowing for minor rendering differences)

---

## Regression Testing

### What to Test After Each Change

**After ANY code change:**
1. Run full test suite: `npm test`
2. Check test coverage: `npm run test:coverage`
3. Visual regression tests: `npm run test:visual`

**Before Each Commit:**
1. Linting passes: `npm run lint`
2. Type checking passes: `npm run type-check`
3. Build succeeds: `npm run build`
4. No console errors

**Before Each Phase Completion:**
1. All unit tests pass
2. Manual verification complete
3. Mobile responsiveness verified
4. Visual comparisons reviewed
5. Performance metrics acceptable

---

## Bug Tracking

### How to Report Bugs

**Template:**
```markdown
## Bug: [Short Description]

**Environment:**
- Device: iPhone 14 / Chrome Desktop / etc.
- Screen Size: 390×844
- Browser: Safari 15.2

**Steps to Reproduce:**
1. Navigate to...
2. Click on...
3. Observe...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[Attach screenshots]

**Severity:**
- [ ] Critical (blocks usage)
- [ ] High (major feature broken)
- [ ] Medium (minor issue)
- [ ] Low (cosmetic)

**Phase:** Phase 1 / Phase 2 / Phase 3 / Phase 4
**Work Stream:** A / B / C / D / E / F / G / H / I / J
```

### Bug Priority

**P0 - Critical (Fix immediately):**
- App crashes
- Data loss
- Complete feature failure
- Security issues

**P1 - High (Fix before phase completion):**
- Major features broken
- Poor user experience
- Significant visual issues

**P2 - Medium (Fix before launch):**
- Minor features not working
- Minor visual issues
- Performance issues

**P3 - Low (Nice to have):**
- Cosmetic issues
- Edge cases
- Minor optimizations

---

## Success Criteria (Overall)

### Visual Quality:
- [ ] Breadboard matches real reference photos (>95% similarity)
- [ ] Components immediately recognizable
- [ ] Color bands accurate for all resistor values
- [ ] Polarity clearly indicated for capacitors/diodes
- [ ] IC pin numbers visible

### Mobile Responsiveness:
- [ ] Works perfectly on iPhone SE (375px)
- [ ] No horizontal scrolling on any page
- [ ] All buttons have 44px+ tap targets
- [ ] Tables use card layout on mobile
- [ ] Navigation accessible via hamburger menu

### Technical:
- [ ] Test coverage >80%
- [ ] No TypeScript errors
- [ ] No console errors in production
- [ ] Performance score >90
- [ ] Loads in <3 seconds on 3G

### User Experience:
- [ ] New users understand without instructions
- [ ] Component identification clear
- [ ] Mobile pinch-to-zoom works
- [ ] Full workflow (upload → breadboard → stripboard) functional

---

## Testing Tools

**Unit Testing:**
- Jest
- React Testing Library
- Testing Library User Events

**Visual Testing:**
- Percy (visual regression)
- Chromatic (Storybook visual testing)
- Manual side-by-side comparison

**Mobile Testing:**
- Chrome DevTools device emulation
- BrowserStack (real devices)
- Physical devices (iPhone, iPad, Android)

**Performance Testing:**
- Lighthouse
- WebPageTest
- Chrome DevTools Performance panel

---

## Test Data

### Sample Component Values

**Resistors:**
- 100Ω (brown-black-brown-gold)
- 1kΩ (brown-black-red-gold)
- 4.7kΩ (yellow-violet-red-gold)
- 10kΩ (brown-black-orange-gold)
- 100kΩ (brown-black-yellow-gold)
- 1MΩ (brown-black-green-gold)

**Capacitors:**
- 22pF (ceramic)
- 100nF (ceramic/film)
- 1µF (ceramic/film)
- 10µF (electrolytic, polarized)
- 100µF (electrolytic, polarized)

**ICs:**
- TL072 (8-pin dual op-amp)
- LM358 (8-pin dual op-amp)
- 4558 (8-pin dual op-amp)

**Diodes:**
- 1N4148 (signal diode)
- 1N4001 (rectifier diode)

---

**Last Updated:** 2026-02-16
**Status:** Test plan defined, awaiting implementation phases
