# PedalPath v2 - Implementation Roadmap
## From Knowledge Bases to Working Application

**Created**: February 4, 2026
**Status**: Ready for implementation

---

## Overview

This document outlines how to transform the extracted knowledge bases into working features for PedalPath v2. The knowledge bases contain comprehensive information about guitar pedal building that must be converted into:

1. **Visual Generators** - Breadboard, stripboard, and enclosure layout tools
2. **Conversion Algorithms** - Schematic → Breadboard → Stripboard logic
3. **Interactive Guides** - Step-by-step assembly instructions
4. **Educational Content** - Component explanations and circuit analysis
5. **AI Chatbot** - Intelligent assistant for user support

---

## Phase 1: Fix Critical Issues (Week 1)

### 1.1 Authentication & Routing (CRITICAL)
**Status**: In progress
**Priority**: 🔴 CRITICAL

**Issues**:
- [x] Issue #5: 404 errors (Fixed with vercel.json)
- [ ] Authentication errors on Windows & iPhone
  - "Failed to execute 'fetch' on 'Window': Invalid value"
  - "Header 'Authorization' has invalid value"

**Actions**:
```
1. Debug Supabase auth configuration
2. Check CORS settings
3. Verify API key format
4. Test on multiple browsers/devices
5. Add better error handling and logging
```

### 1.2 Enclosure Template Improvements
**Status**: Not started
**Priority**: 🟡 High
**Reference**: Issue #1

**Current Problems**:
- Generic circles without dimensions
- No hole diameter specifications
- Not printable at 1:1 scale
- Only supports 1590B (need 125B, 1590BB)

**Actions**:
```
1. Create new EnclosureTemplate.tsx component
2. Implement SVG-based template generation:
   - Accurate enclosure dimensions
   - Hole positions from edges
   - Diameter specifications
   - Component labels
   - 1:1 scale calibration ruler
3. Support multiple enclosure types
4. Export to PDF for printing
5. Reference: KNOWLEDGE_BASE_ENCLOSURES_WIRING.md
```

**Implementation Details**:
```typescript
interface EnclosureTemplate {
  model: '1590B' | '125B' | '1590BB' | '1590DD';
  dimensions: {
    length: number;  // inches
    width: number;
    height: number;
  };
  holes: DrillHole[];
}

interface DrillHole {
  x: number;  // from left edge
  y: number;  // from top edge
  diameter: number;  // in inches or mm
  component: string;  // "Volume", "LED", etc.
  notes?: string;
}
```

---

## Phase 2: Visual Representations (Weeks 2-3)

### 2.1 Breadboard Visualization
**Status**: Not started
**Priority**: 🟡 High
**Reference**: Issue #3, KNOWLEDGE_BASE_BREADBOARD.md

**Requirements**:
```
1. Show internal connection pattern
   - 5-hole horizontal strips
   - Power/ground rails
   - Center channel divider

2. Component placement overlay
   - Color-coded components
   - Reference designators
   - Lead positions in specific holes

3. Wire routing
   - Color-coded jumpers
   - Start/end coordinates
   - Length suggestions

4. Interactive features
   - Highlight connected holes on hover
   - Show signal flow
   - Voltage indicators
```

**Implementation Approach**:
```typescript
// services/breadboard-generator.ts
export class BreadboardGenerator {
  generateLayout(bomData: BOMData): BreadboardLayout {
    // 1. Analyze circuit topology
    const topology = this.analyzeCircuit(bomData);

    // 2. Allocate rows based on signal flow
    const allocation = this.allocateRows(topology);

    // 3. Place ICs straddling center
    const icPlacements = this.placeICs(bomData.components);

    // 4. Position transistors
    const transistorPlacements = this.placeTransistors(bomData.components);

    // 5. Add passive components
    const passivePlacements = this.placePassives(bomData.components);

    // 6. Route power and ground
    const powerRouting = this.routePower(allocation);

    // 7. Generate jumper wires
    const jumpers = this.generateJumpers(allocation);

    return {
      grid: this.createGrid(),
      components: [...icPlacements, ...transistorPlacements, ...passivePlacements],
      jumpers,
      powerRouting,
      steps: this.generateSteps(allocation)
    };
  }
}
```

### 2.2 Stripboard Visualization
**Status**: Not started
**Priority**: 🟡 High
**Reference**: Issue #2, KNOWLEDGE_BASE_STRIPBOARD.md

**Requirements**:
```
1. Dual-view system
   - Component side (top view)
   - Copper side (bottom view)
   - Toggle or side-by-side

2. Copper strip representation
   - Horizontal strips
   - Track cuts (red X marks)
   - Solder junctions (blue dots)
   - Power/ground rails highlighted

3. Component placement
   - Reference designators
   - Orientation indicators
   - Lead positions
   - Wire links

4. Interactive features
   - Click to see connections
   - Highlight electrical continuity
   - Zoom in/out
   - Print-friendly mode
```

**Implementation Approach**:
```typescript
// services/stripboard-generator.ts
export class StripboardGenerator {
  generateLayout(bomData: BOMData): StripboardLayout {
    // 1. Identify circuit blocks
    const blocks = this.identifyBlocks(bomData);

    // 2. Allocate strips
    const stripAllocation = {
      ground: 0,  // bottom strip
      power: 1,   // second strip
      vref: 2,    // voltage reference if needed
      signal: [3, 4, 5, ...] // remaining strips
    };

    // 3. Place components following signal flow
    const placements = this.placeComponentsOnStrips(bomData, blocks);

    // 4. Identify required track cuts
    const cuts = this.identifyTrackCuts(placements);

    // 5. Generate wire links
    const links = this.generateWireLinks(placements);

    return {
      boardSize: this.calculateBoardSize(placements),
      components: placements,
      trackCuts: cuts,
      wireLinks: links,
      componentSideView: this.generateComponentView(placements),
      copperSideView: this.generateCopperView(placements, cuts),
      steps: this.generateBuildSteps(placements, cuts)
    };
  }
}
```

---

## Phase 3: Schematic Upload & Analysis (Week 4)

### 3.1 Fix Claude Vision Integration
**Status**: Working but limited
**Priority**: 🟡 High

**Current Issues**:
- PDF support removed (not supported by Anthropic API)
- No validation of schematic quality
- Limited circuit topology recognition

**Actions**:
```
1. Improve image preprocessing:
   - Enhance contrast
   - Remove noise
   - Deskew if needed

2. Better prompting for Claude Vision:
   - More specific component extraction
   - Request circuit topology
   - Ask for signal flow analysis

3. Validation and confidence scores:
   - Verify component values make sense
   - Check for missing connections
   - Flag unusual topologies

4. Manual correction interface:
   - Allow user to edit extracted BOM
   - Add missing components
   - Correct mis-identified parts
```

### 3.2 Circuit Topology Recognition
**Status**: Not implemented
**Priority**: 🟠 Medium

**Goal**: Automatically identify circuit type and structure

**Implementation**:
```typescript
interface CircuitTopology {
  type: 'boost' | 'overdrive' | 'fuzz' | 'distortion' | 'delay' | 'modulation' | 'unknown';
  stages: CircuitStage[];
  signalFlow: string[];  // Component IDs in order
  powerRequirements: PowerSpec;
}

interface CircuitStage {
  type: 'input-buffer' | 'gain' | 'tone' | 'clipping' | 'output-buffer';
  components: string[];  // Reference designators
  function: string;  // Human-readable explanation
}

function analyzeTopology(bomData: BOMData, schematicData?: SchematicData): CircuitTopology {
  // 1. Identify key components
  const hasOpAmp = bomData.components.some(c => c.component_type === 'op-amp');
  const hasTransistor = bomData.components.some(c => c.component_type === 'transistor');
  const hasDiodes = bomData.components.some(c => c.component_type === 'diode');

  // 2. Detect circuit type
  if (hasOpAmp && hasDiodes) return { type: 'overdrive', ... };
  if (hasTransistor && highGainResistors) return { type: 'fuzz', ... };

  // 3. Identify stages by analyzing component relationships
  const stages = detectStages(bomData);

  // 4. Map signal flow
  const signalFlow = traceSignalPath(bomData);

  return { type, stages, signalFlow, powerRequirements };
}
```

---

## Phase 4: Step-by-Step Guides (Week 5)

### 4.1 Interactive Assembly Instructions

**Breadboard Guide Enhancement**:
```typescript
interface BreadboardStep {
  number: number;
  title: string;
  description: string;
  components: ComponentPlacement[];
  connections: Connection[];
  verificationTest?: VerificationStep;
  tips?: string[];
  warnings?: string[];
}

interface VerificationStep {
  type: 'voltage' | 'continuity' | 'audio-probe';
  testPoints: TestPoint[];
  expectedResult: string;
  troubleshooting: Troubleshooting[];
}
```

**Stripboard Guide Enhancement**:
```typescript
interface StripboardBuildPhase {
  phase: 'preparation' | 'track-cuts' | 'components' | 'wiring' | 'testing';
  steps: BuildStep[];
  completionCriteria: string[];
}

interface BuildStep {
  number: number;
  instruction: string;
  visual: {
    componentView?: string;  // SVG/PNG
    copperView?: string;
    photo?: string;  // Reference photo if available
  };
  tools: string[];
  components: string[];
  duration?: string;  // Estimated time
}
```

### 4.2 Progress Tracking

**Implementation**:
```typescript
interface BuildProgress {
  projectId: string;
  userId: string;
  currentPhase: string;
  completedSteps: Set<string>;
  notes: Note[];
  photos: Photo[];
  startedAt: Date;
  lastUpdated: Date;
}

// Allow users to:
// 1. Check off completed steps
// 2. Add notes for each step
// 3. Upload progress photos
// 4. Mark troubleshooting points
// 5. Resume where they left off
```

---

## Phase 5: Educational Features (Week 6)

### 5.1 Component Tooltips & Explanations

**Implementation**:
```typescript
function getComponentExplanation(component: BOMComponent, context: CircuitContext): ComponentExplanation {
  const baseInfo = COMPONENT_DATABASE[component.component_type];

  // Contextual explanation based on circuit position
  const contextualInfo = analyzeComponentRole(component, context);

  return {
    whatItDoes: contextualInfo.function,
    whyThisValue: contextualInfo.valueReason,
    modificationSuggestions: contextualInfo.mods,
    relatedComponents: contextualInfo.related,
    educationalLinks: baseInfo.learnMoreUrls
  };
}
```

**UI Integration**:
```
- Hover over component → Show tooltip
- Click component → Show detailed info panel
- "Learn More" links to knowledge base articles
- "What if I change this?" modification guide
```

### 5.2 Circuit Analysis Explanations

**Auto-Generated Circuit Explanations**:
```typescript
interface CircuitExplanation {
  overview: string;  // High-level circuit description
  signalFlow: SignalFlowExplanation[];
  stages: StageExplanation[];
  keyComponents: ComponentRoleExplanation[];
  commonModifications: Modification[];
}

function generateCircuitExplanation(bomData: BOMData, topology: CircuitTopology): CircuitExplanation {
  // 1. Identify circuit type from topology
  const circuitType = topology.type;

  // 2. Generate overview from templates
  const overview = CIRCUIT_TEMPLATES[circuitType].overview;

  // 3. Explain each stage
  const stageExplanations = topology.stages.map(stage =>
    explainStage(stage, bomData)
  );

  // 4. Highlight key components
  const keyComponents = identifyKeyComponents(bomData, topology);

  return { overview, signalFlow, stages: stageExplanations, keyComponents, commonModifications };
}
```

---

## Phase 6: AI Chatbot Integration (Weeks 7-8)

### 6.1 Chatbot Architecture

**Purpose**: Intelligent assistant to help users build pedals

**Capabilities**:
```
1. Answer questions about components
2. Troubleshoot build problems
3. Suggest modifications
4. Explain circuit operation
5. Recommend next steps
6. Find components/suppliers
```

**Implementation Approach**:
```typescript
interface ChatbotContext {
  userId: string;
  currentProject?: Project;
  buildProgress?: BuildProgress;
  conversationHistory: Message[];
  knowledgeBases: string[];  // Paths to knowledge base docs
}

class PedalPathChatbot {
  private anthropic: Anthropic;
  private knowledgeBase: string;  // Combined knowledge bases

  async chat(userMessage: string, context: ChatbotContext): Promise<string> {
    // 1. Build context-aware prompt
    const systemPrompt = this.buildSystemPrompt(context);

    // 2. Include relevant knowledge
    const relevantKnowledge = this.retrieveRelevantKnowledge(userMessage);

    // 3. Call Claude API
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      system: systemPrompt,
      messages: [
        ...context.conversationHistory,
        { role: 'user', content: userMessage }
      ],
      context: relevantKnowledge
    });

    return response.content[0].text;
  }

  private buildSystemPrompt(context: ChatbotContext): string {
    return `You are an expert guitar pedal building assistant. You help users:
    - Understand schematics and components
    - Build pedals on breadboard, stripboard, and PCB
    - Troubleshoot problems
    - Modify circuits
    - Learn about electronics

    Current user context:
    ${context.currentProject ? `Building: ${context.currentProject.name}` : 'No active project'}
    ${context.buildProgress ? `Progress: ${context.buildProgress.currentPhase}` : ''}

    Use the knowledge bases to provide accurate, detailed answers.
    Always prioritize safety and correct technique.
    `;
  }
}
```

### 6.2 Knowledge Base Integration

**Embedding & Retrieval**:
```typescript
// Convert knowledge bases to embeddings
async function indexKnowledgeBases(): Promise<VectorStore> {
  const knowledgeBases = [
    KNOWLEDGE_BASE_BREADBOARD,
    KNOWLEDGE_BASE_STRIPBOARD,
    KNOWLEDGE_BASE_ENCLOSURES_WIRING,
    KNOWLEDGE_BASE_COMPONENTS,
    REFERENCE_SCHEMATIC_TO_REALITY
  ];

  // Create embeddings and store in vector database
  const vectorStore = await createVectorStore(knowledgeBases);

  return vectorStore;
}

// Retrieve relevant sections for user query
async function retrieveRelevantKnowledge(query: string): Promise<string[]> {
  const vectorStore = await getVectorStore();
  const results = await vectorStore.similaritySearch(query, k=5);
  return results.map(r => r.content);
}
```

---

## Phase 7: Testing & Refinement (Week 9)

### 7.1 User Testing

**Test Cases**:
```
1. Complete beginner flow:
   - Sign up
   - Upload schematic
   - View BOM
   - Generate breadboard layout
   - Follow build guide
   - Test on device

2. Mobile experience:
   - iOS Safari
   - Android Chrome
   - Responsive design
   - Touch interactions

3. Advanced features:
   - Stripboard generation
   - Enclosure templates
   - Circuit modifications
   - Chatbot assistance
```

### 7.2 Performance Optimization

**Key Metrics**:
```
- Page load time < 2s
- Claude Vision analysis < 10s
- Layout generation < 5s
- Chatbot response < 3s
- Mobile performance acceptable
```

---

## Phase 8: Documentation & Launch (Week 10)

### 8.1 User Documentation

**Create**:
```
1. Getting Started Guide
2. Video Tutorials
3. Component Database
4. Circuit Library
5. Troubleshooting Guide
6. FAQ
```

### 8.2 Developer Documentation

**Create**:
```
1. Architecture Overview
2. API Documentation
3. Contributing Guide
4. Knowledge Base Maintenance
5. Deployment Guide
```

---

## Technology Stack

### Current Stack
```
Frontend: React + TypeScript + Vite
Styling: Tailwind CSS
Backend: Supabase (Auth, Database, Storage)
AI: Anthropic Claude API (Vision + Chat)
Deployment: Vercel
```

### Additional Tools Needed
```
Vector Database: Pinecone or Supabase Vector (for chatbot)
PDF Generation: jsPDF or PDFKit
SVG Generation: D3.js or native SVG
Image Processing: Sharp or Canvas API
Testing: Jest + React Testing Library + Playwright
```

---

## Knowledge Base Files Reference

All extracted knowledge is in these files:
```
1. KNOWLEDGE_BASE_BREADBOARD.md
   - Breadboard structure and usage
   - Component placement strategies
   - Step-by-step building process
   - Visual representation requirements

2. KNOWLEDGE_BASE_STRIPBOARD.md
   - Stripboard/veroboard structure
   - Track cutting techniques
   - Component installation order
   - Dual-view system requirements

3. KNOWLEDGE_BASE_ENCLOSURES_WIRING.md
   - Enclosure sizes and specifications
   - Drilling templates
   - Wiring diagrams (3PDT, jacks, pots)
   - Grounding and power distribution

4. KNOWLEDGE_BASE_COMPONENTS.md
   - Component identification
   - Reading schematics
   - Component functions in circuits
   - Substitution guidelines

5. REFERENCE_SCHEMATIC_TO_REALITY.md
   - Overview of building methods
   - Best practices
   - Common pitfalls
```

---

## Success Metrics

### User Engagement
```
- Active users building pedals
- Completion rate of guided builds
- Return users
- Community contributions
```

### Feature Usage
```
- Schematic uploads per week
- Breadboard layouts generated
- Stripboard layouts generated
- Enclosure templates downloaded
- Chatbot interactions
```

### Quality
```
- User satisfaction scores
- Bug reports
- Feature requests
- Build success rate
```

---

## Next Steps

### Immediate (This Week)
```
1. Fix authentication issues (critical)
2. Deploy 404 fix and verify
3. Start enclosure template redesign
4. Create GitHub issues for all phases
```

### Short Term (Next 2 Weeks)
```
1. Implement improved enclosure templates
2. Begin breadboard visualization
3. Begin stripboard visualization
4. Improve schematic analysis
```

### Medium Term (Next Month)
```
1. Complete all visual representations
2. Add step-by-step guides
3. Integrate educational tooltips
4. Begin chatbot development
```

### Long Term (Next Quarter)
```
1. Launch chatbot
2. Build circuit library
3. Community features
4. Mobile app (PWA)
```

---

## Conclusion

PedalPath has the potential to be the definitive guitar pedal building platform. The knowledge bases provide a comprehensive foundation. The roadmap is realistic and achievable. Focus on fixing critical issues first, then methodically implement features that provide the most user value.

The combination of visual generators, intelligent analysis, and AI assistance will make pedal building accessible to beginners while remaining valuable to experts.
