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
  - Breadboard prototyping guide
  - Stripboard/veroboard layouts
  - Enclosure drilling templates
  - Off-board wiring diagrams
- **User Management**: Save projects, track build progress

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Anthropic Claude 3.5 Sonnet Vision API
- **Deployment**: Vercel

## Project Status

- ✅ Week 1: Foundation (Authentication, Database, Upload UI)
- 🔄 Week 2: AI Integration & BOM Display (IN PROGRESS)
- ⏳ Week 3: Visual Build Guides
- ⏳ Week 4-7: Polish, Testing, Launch

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
│   │   │   │   ├── BOMTable.tsx
│   │   │   │   └── BOMExport.tsx
│   │   │   ├── guides/        # Build guide components
│   │   │   │   ├── BreadboardGuide.tsx
│   │   │   │   ├── StripboardGuide.tsx
│   │   │   │   └── EnclosureGuide.tsx
│   │   │   ├── schematic/
│   │   │   │   └── SchematicUpload.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── SignInPage.tsx
│   │   │   ├── SignUpPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   └── UploadPage.tsx
│   │   ├── services/
│   │   │   ├── supabase.ts
│   │   │   ├── claude-vision.ts      # AI schematic analysis
│   │   │   ├── storage.ts            # File storage
│   │   │   └── schematic-processor.ts # Full processing pipeline
│   │   ├── types/
│   │   │   ├── database.types.ts
│   │   │   └── bom.types.ts
│   │   └── lib/
│   │       └── utils.ts
│   └── package.json
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_add_storage_and_bom.sql
├── PEDALPATH_PRD.md           # Product Requirements
├── PEDALPATH_ARCHITECTURE.md  # Technical Architecture
└── README.md
```

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

### 4. Build Guides
System generates visual step-by-step guides:
- Breadboard prototype layout
- Stripboard/veroboard coordinates
- Enclosure drill template
- Off-board wiring diagrams

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
```

### Database Migrations

To create a new migration:
1. Create a new file in `supabase/migrations/`
2. Name it with the next number: `003_description.sql`
3. Run it in Supabase Dashboard > SQL Editor

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
