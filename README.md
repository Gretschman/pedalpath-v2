# PedalPath v2 - DIY Guitar Pedal Builder

**"Building pedals should be as easy as building a LEGO set"**

PedalPath is a web application that makes building guitar effects pedals simple for players. Upload any schematic, get a complete bill of materials, and follow LEGO-style visual build guides.

## Features

### Core Features (MVP)
- **Upload Schematics**: Camera, photo roll, or file upload (mobile + desktop)
- **AI-Powered BOM Generation**: Claude Vision API extracts ALL components automatically
  - Resistors, capacitors, diodes, transistors, ICs
  - Input/output jacks, DC power jack, footswitch
  - Potentiometers with proper tapers
  - Enclosure recommendations
- **Visual Build Guides**: Step-by-step LEGO-style instructions
  - Breadboard prototyping guide with realistic component visuals
  - Stripboard/veroboard layouts
  - Enclosure drilling templates
  - Off-board wiring diagrams
- **User Management**: Save projects, track build progress

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (mobile-first responsive)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Anthropic Claude 3.5 Sonnet Vision API
- **Deployment**: Vercel

## Project Status

**Current Phase:** Visual Overhaul (February 2026)

- ✅ Week 1-2: Foundation complete (Auth, Database, Upload, AI Integration)
- 🔄 **Week 3-4: Visual Overhaul** (IN PROGRESS)
  - Realistic breadboard visualization
  - Component decoder system (resistor color bands, etc.)
  - Mobile responsiveness (23 components being fixed)
- ⏳ Week 5-6: Integration & Testing
- ⏳ Week 7: Polish & Launch

See `/visual-overhaul-2026/` for active implementation workspace.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Gretschman/pedalpath-v2.git
   cd pedalpath-v2/pedalpath-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` and add your keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

4. **Set up Supabase database**

   Run the migrations in order:
   ```bash
   # In Supabase Dashboard > SQL Editor, run:
   # 1. supabase/migrations/001_initial_schema.sql
   # 2. supabase/migrations/002_add_storage_and_bom.sql
   ```

5. **Create Storage Bucket**

   In Supabase Dashboard > Storage:
   - Create a new bucket named `schematics`
   - Set it to private
   - Apply the storage policies from migration 002

6. **Start development server**
   ```bash
   npm run dev
   ```

   Open http://localhost:5173

## Project Structure

```
pedalpath-v2/
├── pedalpath-app/              # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── bom/           # Bill of Materials components
│   │   │   ├── guides/        # Build guide components
│   │   │   ├── visualizations/ # Breadboard/stripboard rendering
│   │   │   ├── schematic/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   ├── services/
│   │   │   ├── supabase.ts
│   │   │   ├── claude-vision.ts
│   │   │   ├── storage.ts
│   │   │   └── schematic-processor.ts
│   │   ├── utils/
│   │   │   └── decoders/      # Component decoders (NEW)
│   │   ├── types/
│   │   └── lib/
│   └── package.json
│
├── supabase/
│   └── migrations/
│
├── visual-overhaul-2026/       # Active implementation workspace
│   ├── 1-requirements/         # Component specs, design requirements
│   ├── 2-technical-design/     # Architecture documents
│   ├── 3-implementation/       # Phase tracking (4 phases)
│   └── 4-testing-qa/          # Test plans and QA
│
├── docs/
│   ├── knowledge-base/         # Component, breadboard, stripboard specs
│   └── design/                 # UX design requirements
│
├── archive/                    # Superseded planning docs
│   ├── planning-docs/
│   ├── database-migrations/
│   └── old-sessions/
│
├── CLAUDE.md                   # Instructions for Claude Code
├── PEDALPATH_PRD.md           # Product Requirements
├── PEDALPATH_ARCHITECTURE.md  # Technical Architecture
└── README.md                  # This file
```

## Active Documentation

**Current Work:**
- `/visual-overhaul-2026/START_HERE.md` - Visual overhaul quick start
- `/visual-overhaul-2026/DELEGATION_GUIDE.md` - Multi-AI coordination

**Core Specs:**
- `PEDALPATH_PRD.md` - Product requirements and vision
- `PEDALPATH_ARCHITECTURE.md` - System architecture
- `CLAUDE.md` - Claude Code instructions and project context

**Reference Materials:**
- `docs/knowledge-base/` - Component, breadboard, stripboard specs
- `docs/design/` - UX design requirements

**Archive:**
- `archive/` - Superseded planning docs, old migrations, session notes

## How It Works

### 1. Upload Schematic
User uploads a schematic image (from camera, photo roll, or file)

### 2. AI Analysis
Claude Vision API analyzes the schematic and extracts:
- All components with values and reference designators
- Power requirements (voltage, polarity)
- Enclosure recommendation based on component count
- Confidence scores for each detection

### 3. BOM Review & Edit
User reviews the generated Bill of Materials:
- All components grouped by type
- Edit values, quantities, add notes
- Mark components as verified
- Export to CSV/PDF

### 4. Visual Build Guides
System generates step-by-step guides with realistic visuals:
- **Breadboard prototype**: Realistic board with components showing actual color bands, polarities
- **Stripboard layout**: Component placement with copper trace visualization
- **Enclosure template**: Drilling coordinates and mounting specs
- **Off-board wiring**: Jack and switch connection diagrams

### 5. Build & Track
User follows guides and tracks progress through the build

## Cost Structure

### AI Analysis Cost
- **Claude 3.5 Sonnet Vision**: ~$0.0045 per schematic
- **1000 uploads/month**: ~$4.50/month
- 10x cheaper than GPT-4 Vision
- No data retention or training on user data

### Infrastructure
- **Supabase**: Free tier (up to 500MB database, 1GB storage)
- **Vercel**: Free tier for hosting
- **Total MVP Cost**: ~$5-10/month

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Lint code
npm run test     # Run test suite
```

### Current Development Focus

**Visual Overhaul (February 2026):**
- Phase 1: Component decoders + realistic breadboard base
- Phase 2: Component SVG library + integration
- Phase 3: Mobile responsiveness (23 components)
- Phase 4: End-to-end integration + testing

See `/visual-overhaul-2026/` for detailed implementation workspace.

### Database Migrations

To create a new migration:
1. Create a new file in `supabase/migrations/`
2. Name it with the next number: `003_description.sql`
3. Run it in Supabase Dashboard > SQL Editor

Completed migrations are archived in `archive/database-migrations/`.

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT

## Contact

- GitHub: [@Gretschman](https://github.com/Gretschman)
- Repository: [pedalpath-v2](https://github.com/Gretschman/pedalpath-v2)

## Acknowledgments

- **Inspiration**: Inspired by the DIY guitar pedal building community
- **AI**: Powered by Anthropic Claude 3.5 Sonnet
- **Reference Materials**: Pedals & Circuits library for test schematics

---

**Note**: This is version 2 of PedalPath, a complete rewrite focused on simplicity and the core user flow: upload → BOM → build guides.
