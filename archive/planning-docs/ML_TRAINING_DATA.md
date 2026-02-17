# PedalPath v2 - Machine Learning Training Data

## Overview

This document tracks training data resources for improving AI-powered features, particularly for **automatic stripboard layout generation** from schematics.

**Last Updated**: 2026-02-13

---

## Training Data Sources

### 1. Schematic → Stripboard Layout Pairs

**Location**: https://www.dropbox.com/scl/fo/7lqurzoquziwn5xib26jo/APaULUBskPbqukj8y-Es8XQ?rlkey=1gzswus4ooexjgsx4dx72fpg3&dl=0

**Description**: Collection of guitar pedal schematics paired with their corresponding stripboard layouts. This is **gold standard training data** for understanding how components translate from schematic diagrams to physical stripboard implementations.

**Value**:
- Visual patterns of component placement
- Track cutting patterns
- Wiring conventions
- Space optimization techniques
- Component orientation rules
- Ground and power distribution patterns

**Potential Applications**:
1. **Stripboard Layout Generation**: Train model to automatically generate stripboard layouts from schematics
2. **Layout Validation**: Validate user-submitted layouts against learned patterns
3. **Component Placement Optimization**: Suggest optimal component positions
4. **Wiring Path Optimization**: Recommend efficient wiring paths
5. **Error Detection**: Identify potential layout errors before building

**Status**: 🔄 **To be processed**
- [ ] Download all schematic/layout pairs
- [ ] Organize into training dataset
- [ ] Analyze patterns and conventions
- [ ] Document common layouts (e.g., input/output placement)
- [ ] Create annotation format for ML training

---

## ML Enhancement Roadmap

### Phase 1: Data Collection & Analysis (Week 1)
- [ ] Download all schematic/layout pairs from Dropbox
- [ ] Catalog components used in each circuit
- [ ] Document layout patterns and conventions
- [ ] Create structured dataset (schematic_id, components, layout_image, annotations)
- [ ] Identify common patterns:
  - Input jack placement
  - Output jack placement
  - Power supply layout
  - Ground distribution
  - Component grouping strategies

### Phase 2: Pattern Recognition (Week 2)
- [ ] Analyze component placement rules:
  - Which components are placed near each other?
  - How are IC pins connected?
  - Where are bypass capacitors typically placed?
  - How are transistor circuits laid out?
- [ ] Document track cutting patterns:
  - Where are tracks typically cut?
  - How are isolated sections created?
  - Power/ground separation techniques
- [ ] Identify wiring conventions:
  - Wire routing paths
  - Crossover techniques
  - Length minimization strategies

### Phase 3: Model Development (Week 3-4)
- [ ] Choose ML approach:
  - Option A: Fine-tune Claude Vision with layout examples
  - Option B: Train custom CNN for layout generation
  - Option C: Use diffusion model for layout generation
  - Option D: Rule-based system from learned patterns
- [ ] Create training pipeline
- [ ] Develop evaluation metrics
- [ ] Test on held-out examples

### Phase 4: Integration (Week 5-6)
- [ ] Integrate model into StripboardGuide component
- [ ] Add "Generate Layout" feature
- [ ] Implement layout visualization
- [ ] Add manual editing capabilities
- [ ] Test with real users

---

## Data Structure

### Ideal Training Example Format

```json
{
  "id": "example_001",
  "circuit_name": "Tube Screamer",
  "schematic": {
    "file": "tubescreamer_schematic.png",
    "format": "image/png",
    "components_detected": [
      {"type": "resistor", "value": "10k", "designator": "R1"},
      {"type": "capacitor", "value": "100nF", "designator": "C1"},
      // ... more components
    ]
  },
  "stripboard_layout": {
    "file": "tubescreamer_stripboard.png",
    "format": "image/png",
    "dimensions": {
      "strips": 24,
      "holes": 40
    },
    "annotations": {
      "track_cuts": [
        {"strip": 5, "hole": 10},
        {"strip": 5, "hole": 15}
      ],
      "component_placement": [
        {"component": "R1", "strip": 5, "holes": [10, 13]},
        // ... more placements
      ],
      "wire_links": [
        {"from": {"strip": 5, "hole": 10}, "to": {"strip": 8, "hole": 10}}
      ]
    }
  },
  "metadata": {
    "difficulty": "intermediate",
    "size": "compact",
    "power": "9V",
    "submitted_by": "user_id",
    "verified": true
  }
}
```

---

## Analysis Questions to Answer

### Component Placement Patterns
1. How far apart are typically placed:
   - Input and output jacks?
   - ICs from their bypass capacitors?
   - Transistors from their biasing resistors?

2. What components are always grouped together?
   - Op-amp and power supply caps
   - Transistor and collector resistor
   - Input jack and pulldown resistor

3. What orientation rules exist?
   - IC orientation (notch position)
   - Electrolytic capacitor polarity
   - Diode orientation
   - Transistor pin ordering

### Track Utilization Patterns
1. How are power rails distributed?
   - Top/bottom strips for power?
   - Multiple power distribution points?
   - Star grounding vs. single point grounding?

2. When are tracks cut?
   - To isolate IC pins?
   - To create independent sections?
   - To minimize unwanted connections?

3. How are signal paths routed?
   - Straight through when possible?
   - Minimal crossovers?
   - Shielded from power?

### Wiring Patterns
1. What wire types are used where?
   - Solid core for short connections?
   - Stranded for off-board connections?
   - Shielded for audio paths?

2. How are crossovers handled?
   - Wire jumpers?
   - Using component leads?
   - Track cuts and rerouting?

---

## ML Model Options

### Option A: Fine-tune Claude Vision
**Approach**: Provide Claude Vision with schematic + layout examples, teach it patterns

**Pros**:
- Leverages existing powerful vision model
- Can use natural language descriptions
- Quick to implement
- Handles variations well

**Cons**:
- Requires API calls (cost)
- Less control over output format
- May not generalize perfectly

**Implementation**:
```typescript
const layoutPrompt = `
Given this guitar pedal schematic, generate a stripboard layout.

Use these verified examples as reference:
[Include 3-5 similar layout examples]

Follow these conventions:
1. Place input jack at bottom left
2. Place output jack at bottom right
3. Group related components together
4. Minimize track cuts
5. Use top strip for +9V, bottom strip for ground

Return a structured layout with:
- Component positions (strip, hole ranges)
- Required track cuts
- Wire link positions
- Off-board connections
`;
```

### Option B: Custom CNN Model
**Approach**: Train a convolutional neural network to generate layout images

**Pros**:
- Full control over training
- Can optimize for specific patterns
- No ongoing API costs

**Cons**:
- Requires significant ML expertise
- Need large training dataset
- Computationally expensive to train

### Option C: Diffusion Model
**Approach**: Use stable diffusion-style model trained on layout images

**Pros**:
- State-of-art image generation
- Can produce varied layouts
- Handles complex patterns

**Cons**:
- Very computationally intensive
- Requires large dataset
- Difficult to control output precisely

### Option D: Rule-Based System
**Approach**: Extract rules from examples, apply algorithmically

**Pros**:
- Explainable and debuggable
- No ML training required
- Fast execution
- Deterministic results

**Cons**:
- Limited to learned rules
- Less flexible than ML
- May not handle novel circuits well

**Recommended**: Start with **Option D** (rule-based) combined with **Option A** (Claude Vision) for best results in short term.

---

## Implementation Plan

### Short Term (Next 2 Weeks)
1. Download and analyze all training examples
2. Document 10-15 common patterns
3. Create rule-based system for simple layouts
4. Integrate with StripboardGuide component

### Medium Term (Month 2)
1. Collect more examples from users
2. Fine-tune Claude Vision with examples
3. Add "Generate Layout" button to UI
4. Allow manual editing of generated layouts

### Long Term (Month 3-6)
1. Train custom model if dataset grows large enough
2. Add layout validation features
3. Community voting on best layouts
4. Layout optimization suggestions

---

## Success Metrics

### Accuracy Metrics
- **Component Placement Accuracy**: % of components placed in reasonable positions
- **Track Cut Accuracy**: % of necessary track cuts identified
- **Wire Link Accuracy**: % of required wire links identified
- **Dimensioning Accuracy**: Generated layout fits on standard stripboard sizes

### User Metrics
- **Layout Generation Success Rate**: % of attempts that produce usable layouts
- **User Acceptance Rate**: % of generated layouts users choose to use
- **Manual Edit Rate**: How much users modify generated layouts
- **Time Saved**: Reduction in layout design time vs. manual

### Quality Metrics
- **Build Success Rate**: % of generated layouts that work when built
- **Component Efficiency**: How compact/efficient layouts are
- **Wiring Complexity**: Minimal wire crossovers and links

---

## Data Privacy & Usage

**Training Data Guidelines**:
- Only use publicly available schematics or user-contributed layouts with permission
- Anonymize any user-submitted data
- Credit original circuit designers when known
- Respect copyright and licensing

**User Data**:
- Users can opt-in to share their layouts for training
- Shared layouts are anonymized
- Users can delete their contributions anytime
- Clear disclosure of how data is used

---

## Next Steps

### Immediate Actions (This Week)
1. ✅ Document training data location (this file)
2. [ ] Download sample schematic/layout pairs (3-5 examples)
3. [ ] Analyze patterns manually
4. [ ] Document findings in this file
5. [ ] Add to DEBUGGING_PROTOCOL.md if any issues encountered

### Next Session Priority
1. Download and organize training data
2. Create structured dataset format
3. Begin pattern analysis
4. Document common conventions

---

## Resources

### Training Data
- Dropbox folder: https://www.dropbox.com/scl/fo/7lqurzoquziwn5xib26jo/APaULUBskPbqukj8y-Es8XQ?rlkey=1gzswus4ooexjgsx4dx72fpg3&dl=0
- Local storage: `/home/rob/git/pedalpath-v2/training-data/`

### ML Frameworks to Consider
- TensorFlow/Keras - For custom models
- PyTorch - For research and experimentation
- Hugging Face Transformers - For fine-tuning
- OpenCV - For image processing
- scikit-image - For layout analysis

### Reference Materials
- Stripboard layout guides
- Component placement best practices
- PCB to stripboard conversion guides
- Guitar pedal building forums

---

## Lessons Learned (To Be Added)

As we process the training data, document:
- Common mistakes in layouts
- Surprising patterns discovered
- Edge cases to handle
- Best practices learned

---

**Status**: 📝 **Documentation Phase**
**Next Update**: After processing first batch of training examples
