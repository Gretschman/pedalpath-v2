# PedalPath - System Architecture Document

**Version:** 1.0
**Date:** January 27, 2026
**Status:** Draft for MVP Development

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [System Components](#system-components)
4. [Database Schema](#database-schema)
5. [AI/ML Pipeline](#aiml-pipeline)
6. [API Design](#api-design)
7. [Security Architecture](#security-architecture)
8. [Deployment Strategy](#deployment-strategy)
9. [Cost Analysis](#cost-analysis)
10. [Scaling Strategy](#scaling-strategy)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         React 18 SPA (TypeScript + Vite)                  │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │   │
│  │  │ Upload │  │ Editor │  │Projects│  │Settings│         │   │
│  │  │  Page  │  │  Page  │  │  Page  │  │  Page  │         │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘         │   │
│  │                                                            │   │
│  │  State: React Query + Zustand                             │   │
│  │  Routing: React Router v6                                 │   │
│  │  UI: Tailwind CSS + Headless UI                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS/REST
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API/Backend Layer                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Vercel Serverless Functions (Edge)                │   │
│  │                                                            │   │
│  │  /api/schematic/upload      - Upload & preprocess image   │   │
│  │  /api/schematic/analyze     - AI schematic analysis       │   │
│  │  /api/bom/generate          - Generate BOM                │   │
│  │  /api/layout/stripboard     - Generate stripboard layout  │   │
│  │  /api/layout/breadboard     - Generate breadboard layout  │   │
│  │  /api/instructions/generate - Generate build guide        │   │
│  │  /api/export/pdf            - Export to PDF               │   │
│  │  /api/projects/*            - Project CRUD operations     │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────┬──────────────────┬──────────────────────────────┘
                 │                  │
    ┌────────────┴─────┐    ┌──────┴──────────┐
    │                  │    │                 │
    ▼                  ▼    ▼                 ▼
┌──────────┐    ┌──────────────┐    ┌──────────────┐
│ AI/ML    │    │  Supabase    │    │  External    │
│ Services │    │  Backend     │    │  APIs        │
│          │    │              │    │              │
│ • OpenAI │    │ • PostgreSQL │    │ • Mouser API │
│   GPT-4V │    │ • Auth       │    │ • Tayda API  │
│ • Claude │    │ • Storage    │    │ • Digikey    │
│   Vision │    │ • Realtime   │    │              │
│ • Gemini │    │ • Edge Func  │    │              │
│   (free) │    │              │    │              │
└──────────┘    └──────┬───────┘    └──────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   PostgreSQL    │
              │    Database     │
              │                 │
              │ • users         │
              │ • projects      │
              │ • schematics    │
              │ • boms          │
              │ • layouts       │
              │ • components_db │
              └─────────────────┘
```

### Architecture Principles

1. **Serverless-First**: Minimize operational overhead, scale automatically
2. **Mobile-First**: Progressive Web App (PWA) approach
3. **AI-Augmented**: Leverage LLMs for complex analysis, fallback to rules
4. **Cost-Optimized**: Use free tiers, cache aggressively, queue non-urgent tasks
5. **Security-First**: Zero-trust, encrypted at rest and in transit
6. **Modular**: Each service independent, can be replaced/upgraded

---

## Technology Stack

### Frontend Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| Framework | React 18 | Industry standard, great ecosystem, hooks for state |
| Language | TypeScript | Type safety, better DX, fewer bugs |
| Build Tool | Vite | Fast HMR, modern, optimized builds |
| Styling | Tailwind CSS | Rapid development, mobile-first, consistent |
| UI Components | Headless UI + Custom | Accessible, customizable, iOS-native feel |
| State (Server) | TanStack Query | Cache management, optimistic updates |
| State (Client) | Zustand | Lightweight, simple API |
| Routing | React Router v6 | Standard, supports lazy loading |
| Forms | React Hook Form + Zod | Performance, validation |
| Image Processing | Browser Canvas API | Client-side preprocessing |
| PDF Generation | jsPDF + html2canvas | Export functionality |
| Icons | Lucide React | Modern, tree-shakeable |

### Backend Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| Hosting | Vercel | Auto-scaling, edge network, zero config |
| Serverless | Vercel Functions | Integrated, fast cold starts |
| Database | Supabase PostgreSQL | Postgres (reliable), free tier, RLS |
| Authentication | Supabase Auth | Built-in, OAuth support, secure |
| File Storage | Supabase Storage | Integrated, S3-compatible, CDN |
| API | REST (Vercel Functions) | Simple, cacheable, stateless |
| AI Services | OpenAI GPT-4V, Claude | Best vision models for schematics |
| Cost Fallback | Google Gemini | Free tier for testing/development |

### DevOps & Tools

| Component | Technology | Justification |
|-----------|------------|---------------|
| Version Control | Git + GitHub | Industry standard |
| CI/CD | GitHub Actions + Vercel | Auto-deploy on push |
| Monitoring | Vercel Analytics | Built-in, free |
| Error Tracking | Sentry (free tier) | Real-time error alerts |
| Testing | Vitest + Testing Library | Fast, modern |
| Code Quality | ESLint + Prettier | Consistency |

---

## System Components

### 1. Frontend Application (React SPA)

**Purpose**: User interface and interaction layer

**Key Modules**:
```
src/
├── pages/
│   ├── HomePage.tsx              # Landing + upload
│   ├── UploadPage.tsx            # Schematic upload/camera
│   ├── AnalyzePage.tsx           # Processing status
│   ├── EditorPage.tsx            # Edit BOM/layout
│   ├── InstructionsPage.tsx      # View build guide
│   ├── ProjectsPage.tsx          # User's saved projects
│   └── LoginPage.tsx             # Auth
├── components/
│   ├── schematic/
│   │   ├── SchematicUpload.tsx   # Camera, photo roll, file upload
│   │   ├── SchematicPreview.tsx  # Show uploaded image
│   │   └── ComponentHighlight.tsx# Annotated schematic
│   ├── bom/
│   │   ├── BOMTable.tsx          # Editable BOM table
│   │   ├── PartsSelector.tsx     # Alternative parts picker
│   │   └── CostCalculator.tsx    # Price summary
│   ├── layout/
│   │   ├── StripboardViewer.tsx  # SVG stripboard display
│   │   ├── BreadboardViewer.tsx  # SVG breadboard display
│   │   └── LayoutEditor.tsx      # Manual adjustments
│   ├── instructions/
│   │   ├── StepByStep.tsx        # Build guide viewer
│   │   ├── WiringDiagram.tsx     # Offboard wiring
│   │   └── PDFExporter.tsx       # Generate PDF
│   └── ui/
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Spinner.tsx
│       └── ...
├── hooks/
│   ├── useSchematicUpload.ts     # Upload logic
│   ├── useAIAnalysis.ts          # AI processing hook
│   ├── useProjects.ts            # Project CRUD
│   └── useAuth.ts                # Authentication
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── api.ts                    # API client
│   └── utils.ts                  # Helpers
└── types/
    ├── schematic.ts
    ├── bom.ts
    ├── layout.ts
    └── project.ts
```

**State Management**:
- **Server State**: TanStack Query (API data, caching)
- **Client State**: Zustand (UI state, user preferences)
- **Auth State**: Supabase Auth hooks

### 2. API Layer (Vercel Serverless Functions)

**Purpose**: Backend logic, AI orchestration, data processing

**Endpoints**:

```typescript
// api/schematic/upload.ts
POST /api/schematic/upload
Body: { image: File, projectId?: string }
Response: { schematicId: string, preprocessedUrl: string }
- Accepts image file
- Validates format/size
- Preprocesses (rotation, brightness, contrast)
- Stores in Supabase Storage
- Returns schematic ID

// api/schematic/analyze.ts
POST /api/schematic/analyze
Body: { schematicId: string }
Response: { components: Component[], connections: Connection[], nodes: Node[] }
- Fetches schematic image
- Calls OpenAI Vision API (or Claude)
- Extracts components and connections
- Validates circuit topology
- Stores analysis results

// api/bom/generate.ts
POST /api/bom/generate
Body: { schematicId: string, analysisId: string }
Response: { bom: BOMItem[], totalCost: number, suppliers: Supplier[] }
- Takes analyzed components
- Looks up parts in component database
- Calculates quantities
- Queries supplier APIs for prices
- Suggests alternatives
- Returns complete BOM

// api/layout/stripboard.ts
POST /api/layout/stripboard
Body: { analysisId: string, boardWidth?: number }
Response: { layoutSvg: string, layoutData: StripboardLayout }
- Runs routing algorithm
- Generates stripboard layout
- Minimizes track cuts
- Optimizes board size
- Exports SVG

// api/layout/breadboard.ts
POST /api/layout/breadboard
Body: { analysisId: string }
Response: { layoutSvg: string, layoutData: BreadboardLayout }
- Generates breadboard layout
- Calculates jumper wires
- Color codes connections
- Exports SVG

// api/instructions/generate.ts
POST /api/instructions/generate
Body: { projectId: string }
Response: { steps: BuildStep[], diagrams: Diagram[] }
- Generates step-by-step instructions
- Creates wiring diagrams
- Orders steps logically
- Adds component photos
- Returns structured data

// api/export/pdf.ts
POST /api/export/pdf
Body: { projectId: string }
Response: { pdfUrl: string }
- Compiles all data
- Generates PDF with jsPDF
- Uploads to storage
- Returns download URL

// api/projects/*
Standard CRUD operations for projects
GET    /api/projects          - List user projects
POST   /api/projects          - Create project
GET    /api/projects/:id      - Get project
PUT    /api/projects/:id      - Update project
DELETE /api/projects/:id      - Delete project
```

### 3. AI/ML Pipeline

**Purpose**: Intelligent schematic analysis and component recognition

**Flow**:
```
1. Image Preprocessing
   ├─ Resize to optimal dimensions (1024x1024)
   ├─ Adjust brightness/contrast
   ├─ Deskew if rotated
   └─ Enhance text/labels

2. Primary AI Analysis (OpenAI GPT-4 Vision)
   ├─ Structured prompt for component extraction
   ├─ JSON response format enforced
   ├─ Component identification with coordinates
   ├─ Connection topology
   └─ Confidence scores

3. Fallback AI (Claude 3.5 Sonnet)
   ├─ If OpenAI fails or low confidence
   ├─ Second opinion on unclear components
   └─ Validation of extracted data

4. Post-Processing
   ├─ Component database lookup
   ├─ Value normalization (e.g., "10K" → "10kΩ")
   ├─ Connection validation
   ├─ Circuit completeness check
   └─ Flag issues for manual review
```

**AI Prompting Strategy**:

```typescript
// Structured prompt for schematic analysis
const SCHEMATIC_ANALYSIS_PROMPT = `
Analyze this guitar pedal schematic and extract:

1. COMPONENTS:
For each component, provide:
- Type (resistor, capacitor, IC, transistor, diode, etc.)
- Value (e.g., "10kΩ", "100nF", "2N3904")
- Reference designator (R1, C1, Q1, etc.)
- Location (approximate x,y coordinates)

2. CONNECTIONS:
For each connection, provide:
- From: node/component pin
- To: node/component pin
- Type: direct wire, power rail, ground

3. SPECIAL NODES:
- Input jack
- Output jack
- Power supply (9V, ground)
- Footswitch connections

Return as JSON with this structure:
{
  "components": [
    { "ref": "R1", "type": "resistor", "value": "10kΩ", "x": 100, "y": 150 }
  ],
  "connections": [
    { "from": "R1.pin1", "to": "C1.pin1", "type": "wire" }
  ],
  "nodes": [
    { "name": "INPUT", "type": "input_jack", "x": 50, "y": 200 }
  ]
}
`;
```

**Cost Optimization**:
- Use **GPT-4o-mini** for simple schematics (< 10 components)
- Use **GPT-4 Vision** for complex schematics
- Use **Google Gemini** (free tier) for development/testing
- Cache analysis results (avoid re-processing same schematic)
- Batch requests where possible

### 4. Database (Supabase PostgreSQL)

**Purpose**: Persistent storage for user data, projects, and component library

**Schema**: See [Database Schema](#database-schema) section below

### 5. File Storage (Supabase Storage)

**Purpose**: Store uploaded schematics, generated layouts, and exported PDFs

**Buckets**:
```
schematics/
  ├─ {userId}/
  │   ├─ {schematicId}_original.png
  │   └─ {schematicId}_processed.png
layouts/
  ├─ {projectId}/
  │   ├─ stripboard.svg
  │   └─ breadboard.svg
exports/
  └─ {projectId}/
      └─ build_guide.pdf
```

**Storage Policies** (Row Level Security):
- Users can only access their own files
- Public read for shared projects (optional)
- Automatic cleanup of abandoned projects (> 30 days)

---

## Database Schema

### Core Tables

```sql
-- Users table (managed by Supabase Auth)
-- Built-in, no custom schema needed

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, analyzing, completed, error
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT FALSE,

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Schematics
CREATE TABLE schematics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  original_filename VARCHAR(255),
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_size_bytes INTEGER,
  image_width INTEGER,
  image_height INTEGER,
  preprocessed_url TEXT, -- Enhanced image URL
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- AI Analysis Results
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schematic_id UUID REFERENCES schematics(id) ON DELETE CASCADE,
  ai_provider VARCHAR(50), -- 'openai', 'claude', 'gemini'
  ai_model VARCHAR(100), -- 'gpt-4-vision', 'claude-3-sonnet'
  raw_response JSONB, -- Full AI response for debugging
  components JSONB NOT NULL, -- Extracted components array
  connections JSONB NOT NULL, -- Connection topology
  nodes JSONB, -- Special nodes (input, output, power)
  confidence_score DECIMAL(3,2), -- 0.0 to 1.0
  validation_status VARCHAR(50) DEFAULT 'pending', -- pending, valid, invalid, needs_review
  validation_errors JSONB, -- Any issues found
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  processing_time_ms INTEGER,

  CONSTRAINT fk_schematic FOREIGN KEY (schematic_id) REFERENCES schematics(id)
);

-- Bill of Materials
CREATE TABLE boms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  items JSONB NOT NULL, -- Array of BOM items
  total_cost_usd DECIMAL(10,2),
  suppliers JSONB, -- Supplier options and links
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_analysis FOREIGN KEY (analysis_id) REFERENCES analyses(id)
);

-- Layouts
CREATE TABLE layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  layout_type VARCHAR(50) NOT NULL, -- 'stripboard', 'breadboard'
  layout_data JSONB NOT NULL, -- Full layout structure
  svg_url TEXT, -- Rendered SVG URL
  board_width INTEGER, -- In holes (for stripboard)
  board_height INTEGER,
  track_cuts JSONB, -- Array of cut positions
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_analysis FOREIGN KEY (analysis_id) REFERENCES analyses(id)
);

-- Build Instructions
CREATE TABLE instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  steps JSONB NOT NULL, -- Array of build steps
  diagrams JSONB, -- Wiring diagrams data
  difficulty_level VARCHAR(50), -- beginner, intermediate, advanced
  estimated_time_minutes INTEGER,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Component Library (Reference Database)
CREATE TABLE component_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  component_type VARCHAR(50) NOT NULL, -- resistor, capacitor, ic, transistor, etc.
  part_number VARCHAR(100),
  manufacturer VARCHAR(100),
  description TEXT,
  value VARCHAR(50), -- e.g., "10kΩ", "100nF"
  package VARCHAR(50), -- through-hole, SMD
  datasheet_url TEXT,
  typical_cost_usd DECIMAL(10,2),
  mouser_pn VARCHAR(100),
  digikey_pn VARCHAR(100),
  tayda_pn VARCHAR(100),
  equivalents JSONB, -- Array of equivalent part numbers
  tags TEXT[], -- For searching
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for fast lookup
  INDEX idx_component_type ON component_library(component_type),
  INDEX idx_part_number ON component_library(part_number),
  INDEX idx_value ON component_library(value)
);

-- User Preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_board_width INTEGER DEFAULT 25,
  preferred_suppliers TEXT[], -- ['mouser', 'tayda']
  cost_preference VARCHAR(50) DEFAULT 'balanced', -- lowest, balanced, premium
  layout_preference VARCHAR(50) DEFAULT 'stripboard', -- stripboard, breadboard
  units VARCHAR(10) DEFAULT 'metric', -- metric, imperial
  theme VARCHAR(20) DEFAULT 'light', -- light, dark
  notifications_enabled BOOLEAN DEFAULT TRUE,

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Usage Tracking (for rate limiting and analytics)
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- upload, analyze, generate_bom, etc.
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  processing_time_ms INTEGER,
  ai_tokens_used INTEGER,
  cost_usd DECIMAL(10,4),
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id),
  INDEX idx_user_action ON usage_logs(user_id, action, timestamp)
);
```

### Row Level Security (RLS) Policies

```sql
-- Users can only see their own projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Public projects can be viewed by anyone (if is_public = true)
CREATE POLICY "Public projects are viewable"
  ON projects FOR SELECT
  USING (is_public = TRUE);

-- Similar policies for all user-owned tables...
-- (schematics, analyses, boms, layouts, instructions)
```

---

## Schematic Upload Implementation

### Three Upload Methods

The app supports three ways to upload schematics, optimized for different platforms:

#### 1. **Camera Capture** (Mobile Only)
```typescript
// iOS: Use native camera with UIImagePickerController via input capture
// Android: Use MediaDevices.getUserMedia() or native camera intent

<input
  type="file"
  accept="image/*"
  capture="environment"  // Use rear camera
  onChange={handleCameraCapture}
/>

// Direct camera access with preview
const handleCameraCapture = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    // Show camera preview, capture frame, convert to blob
    const imageBlob = await captureFrame(stream);
    uploadSchematic(imageBlob);
  } catch (error) {
    // Fallback to file input if camera access denied
    openFilePicker();
  }
};
```

#### 2. **Photo Roll / Gallery Selection** (Mobile & Desktop)
```typescript
// Allow users to select existing photos/images
<input
  type="file"
  accept="image/png,image/jpeg,image/jpg,application/pdf"
  onChange={handlePhotoRollSelection}
/>

const handlePhotoRollSelection = (event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    // Validate file size and type
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB');
      return;
    }
    uploadSchematic(file);
  }
};
```

#### 3. **File Upload** (Desktop - Mac/Windows/Linux)
```typescript
// Drag-and-drop + file browser for desktop
<div
  className="dropzone"
  onDrop={handleFileDrop}
  onDragOver={handleDragOver}
  onClick={() => fileInputRef.current?.click()}
>
  <input
    ref={fileInputRef}
    type="file"
    accept="image/png,image/jpeg,image/jpg,application/pdf"
    onChange={handleFileUpload}
    hidden
  />
  <p>Drag & drop or click to upload</p>
</div>

const handleFileDrop = (event: DragEvent) => {
  event.preventDefault();
  const file = event.dataTransfer?.files[0];
  if (file) uploadSchematic(file);
};
```

### Upload Flow

```
User Action → File/Image Selection → Client-side Validation → Upload to Supabase Storage → Trigger AI Analysis

1. User selects upload method (camera/photo roll/file)
2. Client validates:
   - File size (< 10MB)
   - File type (PNG, JPG, PDF)
   - Image dimensions (recommended: 1024x1024 to 4096x4096)
3. Show preview thumbnail
4. Upload to Supabase Storage bucket: schematics/{userId}/{timestamp}_{filename}
5. Create database record with upload metadata
6. Trigger preprocessing and AI analysis
7. Display progress indicator
8. Navigate to analysis results page
```

### Platform-Specific Considerations

**iOS (Safari)**:
- Use `input[capture="environment"]` for camera
- Support iOS file picker for photo roll
- Handle iOS permission prompts gracefully
- Test with iPad (support both orientations)

**Android (Chrome)**:
- Use `getUserMedia()` for camera with fallback
- Support Android photo picker API
- Handle permission requests
- Test across multiple Android versions

**Desktop (Mac/Windows)**:
- Drag-and-drop zone with visual feedback
- File browser button
- Support PDF uploads for scanned schematics
- Show upload progress bar

**Cross-Platform**:
- Detect device type and show appropriate UI
- Progressive enhancement (camera only shown on mobile)
- Accessible keyboard navigation
- Clear error messages for failed uploads

---

## AI/ML Pipeline

### Component Recognition Algorithm

**Input**: Schematic image (PNG/JPG)
**Output**: Structured component list + connections

**Process**:

1. **Image Preprocessing**
```typescript
async function preprocessSchematic(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);

  // Resize to optimal dimensions
  const metadata = await image.metadata();
  const maxDim = 1024;
  if (metadata.width! > maxDim || metadata.height! > maxDim) {
    image.resize(maxDim, maxDim, { fit: 'inside' });
  }

  // Enhance contrast and brightness
  image
    .normalize() // Auto-adjust contrast
    .sharpen() // Enhance edges
    .greyscale() // Convert to grayscale for better OCR
    .threshold(128); // Binary threshold

  return image.toBuffer();
}
```

2. **AI Vision Analysis**
```typescript
async function analyzeSchematic(imageUrl: string): Promise<AnalysisResult> {
  // Try OpenAI GPT-4 Vision first
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: SCHEMATIC_ANALYSIS_PROMPT },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      max_tokens: 4096,
      response_format: { type: "json_object" }
    });

    const analysisData = JSON.parse(response.choices[0].message.content);
    return {
      provider: 'openai',
      model: 'gpt-4-vision',
      data: analysisData,
      confidence: calculateConfidence(analysisData)
    };
  } catch (error) {
    // Fallback to Claude if OpenAI fails
    return analyzeWithClaude(imageUrl);
  }
}
```

3. **Post-Processing & Validation**
```typescript
async function validateAnalysis(analysis: AnalysisResult): Promise<ValidationResult> {
  const errors: string[] = [];

  // Check for required components
  const hasInput = analysis.data.nodes.some(n => n.type === 'input_jack');
  const hasOutput = analysis.data.nodes.some(n => n.type === 'output_jack');
  const hasPower = analysis.data.nodes.some(n => n.type === 'power');

  if (!hasInput) errors.push('No input jack detected');
  if (!hasOutput) errors.push('No output jack detected');
  if (!hasPower) errors.push('No power supply detected');

  // Validate connections
  const connectedComponents = new Set();
  analysis.data.connections.forEach(conn => {
    connectedComponents.add(conn.from.split('.')[0]);
    connectedComponents.add(conn.to.split('.')[0]);
  });

  const allComponents = analysis.data.components.map(c => c.ref);
  const unconnectedComponents = allComponents.filter(ref => !connectedComponents.has(ref));

  if (unconnectedComponents.length > 0) {
    errors.push(`Unconnected components: ${unconnectedComponents.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    confidence: analysis.confidence
  };
}
```

### Layout Generation Algorithm

**Stripboard Router**:

```typescript
interface StripboardRouter {
  // Input: analyzed components and connections
  // Output: optimal component placement and track cuts

  async generateLayout(
    components: Component[],
    connections: Connection[],
    boardWidth: number = 25
  ): Promise<StripboardLayout> {

    // 1. Create grid representation
    const grid = new Grid(boardWidth, 50); // 25 columns, 50 rows initially

    // 2. Place power rails (top and bottom)
    grid.addPowerRail('top', '+9V');
    grid.addPowerRail('bottom', 'GND');

    // 3. Place components using greedy algorithm
    const placements = this.placeComponents(components, grid);

    // 4. Route connections using A* pathfinding
    const tracks = this.routeConnections(connections, placements, grid);

    // 5. Identify necessary track cuts
    const trackCuts = this.findTrackCuts(tracks, grid);

    // 6. Optimize board size (trim unused rows)
    const optimizedGrid = this.trimBoard(grid);

    // 7. Generate SVG visualization
    const svg = this.generateSVG(optimizedGrid, placements, tracks, trackCuts);

    return {
      grid: optimizedGrid,
      placements,
      tracks,
      trackCuts,
      svg
    };
  }

  private placeComponents(components: Component[], grid: Grid): Placement[] {
    // Simple greedy placement
    // TODO: Implement genetic algorithm for optimal placement
    const placements: Placement[] = [];
    let currentRow = 5; // Start a few rows from top

    for (const component of components) {
      const placement = grid.findSpace(component, currentRow);
      if (placement) {
        placements.push(placement);
        grid.occupy(placement);
      } else {
        currentRow += 2; // Move to next available row
      }
    }

    return placements;
  }

  private routeConnections(
    connections: Connection[],
    placements: Placement[],
    grid: Grid
  ): Track[] {
    // Use A* algorithm for each connection
    const tracks: Track[] = [];

    for (const conn of connections) {
      const from = placements.find(p => p.ref === conn.from.split('.')[0]);
      const to = placements.find(p => p.ref === conn.to.split('.')[0]);

      if (from && to) {
        const path = this.astarRoute(from, to, grid);
        if (path) {
          tracks.push({ from: conn.from, to: conn.to, path });
        }
      }
    }

    return tracks;
  }

  private findTrackCuts(tracks: Track[], grid: Grid): Cut[] {
    // Identify where copper tracks need to be cut
    // to prevent unwanted connections
    const cuts: Cut[] = [];

    // Analyze each track strip
    for (let col = 0; col < grid.width; col++) {
      const occupiedRows = new Set<number>();

      // Find all occupied positions in this column
      tracks.forEach(track => {
        track.path.forEach(point => {
          if (point.col === col) {
            occupiedRows.add(point.row);
          }
        });
      });

      // Find gaps where cuts are needed
      const sortedRows = Array.from(occupiedRows).sort((a, b) => a - b);
      for (let i = 0; i < sortedRows.length - 1; i++) {
        if (sortedRows[i + 1] - sortedRows[i] === 1) {
          // Adjacent rows without connection = need cut
          cuts.push({ col, row: sortedRows[i] });
        }
      }
    }

    return cuts;
  }
}
```

---

## API Design

### REST API Structure

**Base URL**: `https://pedalpath.com/api`

**Authentication**: Bearer token (Supabase JWT)

**Standard Response Format**:
```typescript
{
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

**Rate Limiting**:
- Free tier: 3 requests/month per user
- Pro tier: Unlimited (with reasonable use policy)
- Rate limit headers in response:
  ```
  X-RateLimit-Limit: 3
  X-RateLimit-Remaining: 2
  X-RateLimit-Reset: 2026-02-01T00:00:00Z
  ```

### Key API Endpoints (Detailed)

#### Upload Schematic
```typescript
POST /api/schematic/upload

Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Body:
  image: File (max 10MB, PNG/JPG/PDF)
  projectId?: string (optional, creates new project if omitted)

Response: 200 OK
{
  "success": true,
  "data": {
    "schematicId": "uuid",
    "projectId": "uuid",
    "originalUrl": "https://storage.url/original.png",
    "preprocessedUrl": "https://storage.url/processed.png",
    "metadata": {
      "width": 2048,
      "height": 1536,
      "fileSize": 1245678
    }
  }
}

Errors:
  400: Invalid file format
  413: File too large
  429: Rate limit exceeded
  500: Upload failed
```

#### Analyze Schematic
```typescript
POST /api/schematic/analyze

Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "schematicId": "uuid"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "analysisId": "uuid",
    "status": "completed",
    "components": [
      {
        "ref": "R1",
        "type": "resistor",
        "value": "10kΩ",
        "tolerance": "5%",
        "position": { "x": 120, "y": 340 }
      },
      {
        "ref": "C1",
        "type": "capacitor",
        "value": "100nF",
        "voltage": "50V",
        "position": { "x": 180, "y": 340 }
      }
    ],
    "connections": [
      {
        "from": "R1.pin2",
        "to": "C1.pin1",
        "type": "direct"
      }
    ],
    "nodes": [
      {
        "name": "INPUT",
        "type": "input_jack",
        "position": { "x": 50, "y": 200 }
      }
    ],
    "confidence": 0.92,
    "validation": {
      "isValid": true,
      "errors": []
    },
    "processingTime": 12500
  }
}

Response: 202 Accepted (if still processing)
{
  "success": true,
  "data": {
    "status": "processing",
    "estimatedTime": 15000,
    "pollUrl": "/api/schematic/analyze/status/uuid"
  }
}

Errors:
  404: Schematic not found
  422: Schematic invalid or unreadable
  500: AI service error
```

#### Generate BOM
```typescript
POST /api/bom/generate

Body:
{
  "analysisId": "uuid",
  "preferences": {
    "costPreference": "balanced", // lowest | balanced | premium
    "suppliers": ["mouser", "tayda"],
    "includeAlternatives": true
  }
}

Response: 200 OK
{
  "success": true,
  "data": {
    "bomId": "uuid",
    "items": [
      {
        "ref": ["R1", "R2", "R3"],
        "quantity": 3,
        "type": "resistor",
        "value": "10kΩ",
        "tolerance": "5%",
        "partNumber": "CFR-25JT-52-10K",
        "manufacturer": "Yageo",
        "unitPrice": 0.05,
        "totalPrice": 0.15,
        "suppliers": [
          {
            "name": "Mouser",
            "partNumber": "603-CFR-25JT-52-10K",
            "url": "https://...",
            "price": 0.05,
            "inStock": true
          }
        ],
        "alternatives": [
          {
            "partNumber": "CF14JT10K0",
            "manufacturer": "Stackpole",
            "price": 0.04
          }
        ]
      }
    ],
    "summary": {
      "totalCost": 12.45,
      "itemCount": 23,
      "uniquePartTypes": 15
    },
    "enclosure": {
      "type": "1590B",
      "dimensions": "112x60x31mm",
      "supplier": "Tayda",
      "price": 3.50,
      "url": "https://..."
    }
  }
}
```

---

## Security Architecture

### Authentication Flow

```
1. User Login/Signup
   ↓
2. Supabase Auth validates credentials
   ↓
3. Returns JWT token (stored in httpOnly cookie + localStorage)
   ↓
4. Frontend includes token in Authorization header
   ↓
5. Vercel Function validates JWT with Supabase
   ↓
6. Database queries filtered by user_id (RLS)
```

### Security Measures

1. **HTTPS Only**: All traffic encrypted in transit
2. **JWT Authentication**: Stateless, secure tokens
3. **Row Level Security**: Database-level access control
4. **Rate Limiting**: Prevent abuse (3 requests/month free tier)
5. **Input Validation**: Sanitize all user inputs
6. **File Upload Security**:
   - Max file size: 10MB
   - Allowed formats: PNG, JPG, PDF only
   - Virus scanning (ClamAV integration)
   - No script execution in uploaded files
7. **API Key Security**:
   - Environment variables only (never in code)
   - Rotate keys quarterly
   - Separate keys for dev/staging/prod
8. **CORS Policy**: Restrict to known domains
9. **Content Security Policy (CSP)**:
   ```
   Content-Security-Policy:
     default-src 'self';
     img-src 'self' https://storage.supabase.co;
     script-src 'self' 'unsafe-inline' 'unsafe-eval';
     style-src 'self' 'unsafe-inline';
   ```

### Data Privacy (GDPR Compliance)

- **Right to Access**: Users can export all their data
- **Right to Erasure**: Delete account = cascade delete all data
- **Data Minimization**: Only store necessary data
- **Privacy Policy**: Clear terms on data usage
- **Cookie Consent**: Required for EU users

---

## Deployment Strategy

### Development Workflow

```
Local Development
  ├─ npm run dev (Vite dev server)
  ├─ Supabase local instance (optional)
  └─ API mocked or dev endpoints

GitHub Push
  ↓
GitHub Actions (CI)
  ├─ Run linter (ESLint)
  ├─ Run tests (Vitest)
  └─ Build (tsc + vite build)

If tests pass:
  ↓
Vercel Auto-Deploy
  ├─ Preview deployment (PRs)
  ├─ Production deployment (main branch)
  └─ Environment variables from Vercel settings

Supabase
  ├─ Migrations run manually
  └─ Backup scheduled daily
```

### Environment Variables

**Required in Vercel**:
```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Server-side only

# OpenAI
OPENAI_API_KEY=sk-xxx...

# Claude (Anthropic)
ANTHROPIC_API_KEY=sk-ant-xxx...

# Google Gemini
GEMINI_API_KEY=AIzxxx...

# Supplier APIs (optional)
MOUSER_API_KEY=xxx...
DIGIKEY_API_KEY=xxx...

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Staging vs Production

| Environment | Branch | URL | Database | Purpose |
|-------------|--------|-----|----------|---------|
| Development | feature/* | localhost:5173 | Local | Active dev |
| Staging | develop | pedalpath-staging.vercel.app | Staging DB | Testing |
| Production | main | pedalpath.com | Production DB | Live users |

---

## Cost Analysis

### Initial Setup Costs: **$0**

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Vercel | Hobby (free) | $0 |
| Supabase | Free | $0 |
| GitHub | Free | $0 |
| Domain (pedalpath.com) | N/A | $12/year |
| **Total Setup** | | **$12/year** |

### Operating Costs (Month 1-3, Beta)

**Assumptions**:
- 50 beta users
- 10 schematics processed per user
- 500 total schematics/month

| Service | Cost Basis | Monthly Cost |
|---------|------------|--------------|
| Vercel Hosting | Free tier (100GB bandwidth) | $0 |
| Supabase Database | Free tier (500MB, 50k rows) | $0 |
| Supabase Storage | Free tier (1GB) | $0 |
| OpenAI API | 500 req × $0.10/req (GPT-4V) | $50 |
| Anthropic Claude | Fallback only, ~50 req × $0.08 | $4 |
| Google Gemini | Free tier | $0 |
| Monitoring (Sentry) | Free tier | $0 |
| **Total Operating** | | **~$54/month** |

### Scaled Costs (Month 6+, 500 users)

**Assumptions**:
- 500 active users
- 5,000 schematics/month
- 100 paid users ($9/month)

| Service | Cost Basis | Monthly Cost |
|---------|------------|--------------|
| Vercel Pro | 1TB bandwidth | $20 |
| Supabase Pro | 8GB database, 100GB storage | $25 |
| OpenAI API | 5k req, 50% GPT-4o-mini | $250 |
| Claude API | 500 req fallback | $40 |
| Supplier APIs | Mouser/Digikey | $10 |
| Monitoring | Sentry Growth | $26 |
| **Total Operating** | | **$371/month** |
| **Revenue** | 100 users × $9 | **$900/month** |
| **Net Profit** | | **$529/month** |

### Cost Optimization Strategies

1. **AI Cost Reduction**:
   - Use GPT-4o-mini for simple schematics (< 10 components): 90% cheaper
   - Cache analysis results: Avoid re-processing duplicates
   - Use Google Gemini for development/testing: Free
   - Batch requests where possible

2. **Bandwidth Optimization**:
   - Compress images (WebP format)
   - CDN caching (Vercel Edge)
   - Lazy load images
   - SVG for layouts (vector, small file size)

3. **Database Optimization**:
   - Archive old projects (> 6 months inactive)
   - Delete abandoned uploads (> 30 days)
   - Use connection pooling
   - Index frequently queried fields

4. **Storage Optimization**:
   - Delete original images after processing
   - Compress generated PDFs
   - Use lifecycle policies (auto-delete after 90 days)

---

## Scaling Strategy

### Phase 1: MVP (0-100 users)
- Vercel Free tier
- Supabase Free tier
- Manual monitoring
- No caching

### Phase 2: Growth (100-1,000 users)
- Upgrade to Vercel Pro
- Upgrade to Supabase Pro
- Implement Redis caching (Upstash free tier)
- Add error tracking (Sentry)
- Optimize AI costs (GPT-4o-mini)

### Phase 3: Scale (1,000-10,000 users)
- Vercel Enterprise ($?)
- Supabase Team ($599/month)
- Dedicated Redis (Upstash Pro $10/month)
- CDN optimization
- Multi-region deployment
- Database read replicas
- Background job queue (BullMQ + Upstash)

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | < 2s | Vercel Analytics |
| Time to Interactive | < 3s | Lighthouse |
| Schematic Upload | < 5s | Custom metric |
| AI Analysis | < 30s | Custom metric |
| Layout Generation | < 60s | Custom metric |
| API Response Time | < 500ms | Vercel Analytics |
| Uptime | 99.5% | Uptime monitor |

---

## Monitoring & Observability

### Key Metrics to Track

1. **Performance**:
   - API response times
   - AI processing times
   - Database query times
   - File upload/download speeds

2. **Usage**:
   - Active users (DAU/MAU)
   - Schematics processed
   - Projects created
   - PDF exports

3. **Quality**:
   - AI accuracy (user corrections)
   - Error rates
   - Failed uploads
   - Manual review queue length

4. **Business**:
   - Conversion rate (free → paid)
   - Churn rate
   - Revenue
   - Customer acquisition cost

### Monitoring Stack

- **Vercel Analytics**: Page views, performance
- **Sentry**: Error tracking, crash reports
- **Supabase Dashboard**: Database metrics
- **Custom Dashboard**: AI costs, usage limits

---

## Testing Strategy

### Testing Pyramid

```
           ╱╲
          ╱E2E╲         10% - Critical user flows
         ╱━━━━━━╲
        ╱  Inte- ╲       20% - API + database integration
       ╱  gration ╲
      ╱━━━━━━━━━━━━╲
     ╱              ╲     70% - Business logic, utils, components
    ╱      Unit      ╱
   ╱━━━━━━━━━━━━━━━━━╲
```

**Unit Tests** (Vitest):
- Component rendering
- Utility functions
- Data transformations
- Layout algorithms

**Integration Tests**:
- API endpoints
- Database operations
- File uploads
- AI integration

**E2E Tests** (Playwright):
- Upload schematic → Get BOM
- Create project → Edit → Export PDF
- Login → Logout

### Test Coverage Goals
- Unit: 80%
- Integration: 60%
- E2E: Critical paths only

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI accuracy issues | High | Medium | Manual review queue, user corrections |
| High AI costs | Medium | High | Use GPT-4o-mini, caching, Gemini fallback |
| Vercel cold starts | Low | Medium | Keep-alive pings, serverless optimization |
| Database limits hit | Medium | Low | Monitor usage, upgrade plan proactively |
| Layout generation bugs | High | Medium | Extensive testing, validation checks |

### Operational Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Single developer | High | Document everything, simple architecture |
| Scope creep | Medium | Strict MVP, defer features to Phase 2 |
| Timeline overrun | Medium | Weekly milestones, buffer time |
| User adoption low | High | Beta launch with DIY communities |

---

## Maintenance Plan

### Daily
- Monitor error logs (Sentry)
- Check AI costs
- Review failed uploads

### Weekly
- Database backup verification
- Performance metrics review
- User feedback review

### Monthly
- Security updates (dependencies)
- Cost analysis
- Feature prioritization
- Database cleanup (old data)

### Quarterly
- API key rotation
- Dependency major version updates
- Architecture review
- User survey

---

## Future Enhancements (Post-MVP)

1. **PCB Layout Generation** (Phase 2)
2. **3D Enclosure Preview** (Phase 2)
3. **Community Library** (Phase 3)
4. **Shopping Cart Integration** (Phase 3)
5. **Audio Simulation** (Phase 4)
6. **Collaborative Editing** (Phase 4)
7. **Mobile Native App** (Phase 5)
8. **White-Label API** (Phase 5)

---

**Document Owner**: Rob Frankel
**Last Updated**: January 27, 2026
**Next Review**: Week 4 (Sprint Mid-Point)
