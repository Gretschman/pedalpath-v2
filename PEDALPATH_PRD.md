# PedalPath - Product Requirements Document (PRD)

**Version:** 1.0
**Date:** January 27, 2026
**Timeline:** 7 weeks (MVP Launch: March 17, 2026)
**Target Market:** DIY Guitar Pedal Builders

---

## Executive Summary

PedalPath is an AI-assisted SaaS platform that transforms guitar pedal schematics into "Lego-simple" build instructions. Users upload or photograph a schematic, and the system generates a complete Bill of Materials (BOM), component layout, and step-by-step assembly guide for building the pedal on stripboard or breadboard.

**Mission:** Make DIY pedal building so simple that anyone can build professional-quality guitar effects pedals.

**Vision:** The "IKEA instructions" for guitar pedal building - visual, simple, foolproof.

---

## Problem Statement

### Current Pain Points
1. **Complexity Barrier**: Reading schematics requires electrical engineering knowledge
2. **Layout Challenges**: Converting schematics to physical layouts is difficult and error-prone
3. **Parts Sourcing**: Identifying and sourcing correct components is time-consuming
4. **Build Errors**: High failure rate for first-time builders due to unclear instructions
5. **Fragmented Resources**: Information scattered across forums, PDFs, and YouTube videos

### Target Users
- **Primary**: Beginner DIY pedal builders (ages 18-45)
- **Secondary**: Intermediate builders looking for faster prototyping
- **Tertiary**: Music educators and workshop instructors

---

## Product Overview

### Core Value Proposition
**"Upload a schematic. Get Lego-simple build instructions in minutes."**

### Key Features

#### Phase 1: MVP (Weeks 1-7)

**1. Schematic Upload & Processing**
- **Mobile**: Take photo with camera OR select from photo roll
- **Desktop**: Upload image file (PNG, JPG) or PDF document
- Cross-platform: Works on iOS, iPadOS, Android, Mac, Windows
- AI extracts circuit components and connections
- Validates schematic completeness

**2. Bill of Materials (BOM) Generation**
- Complete parts list with specifications
- Quantity calculations
- Direct links to parts suppliers (Mouser, Tayda, etc.)
- Cost estimation
- Alternative component suggestions
- Enclosure recommendations

**3. Stripboard Layout Generation**
- Visual stripboard layout (top and bottom view)
- Component placement diagram
- Track cuts marked clearly
- Wire connections shown
- Color-coded by component type

**4. Breadboard Layout Generation**
- Breadboard layout for testing
- Component placement
- Jumper wire connections
- Power rail connections
- Matches standard breadboard dimensions

**5. Lego-Style Build Instructions**
- Step-by-step visual assembly guide
- Numbered steps with illustrations
- "What you need" for each step
- Component identification with photos
- Clear wiring diagrams
- Offboard wiring (I/O jacks, power, footswitch)
- Final assembly into enclosure

**6. User Account & Project Management**
- Save projects
- Track build progress
- Multiple projects per user
- Share builds with community (optional)

#### Phase 2: Enhanced Features (Weeks 8-12, Post-MVP)
- Interactive 3D component placement
- Video tutorials auto-generated
- Community library of verified builds
- Shopping cart integration with parts suppliers
- Build difficulty rating
- Tone stack calculator integration
- PCB layout generation (premium feature)

---

## Technical Requirements

### Functional Requirements

**FR1: Schematic Upload**
- Support JPG, PNG, PDF formats (max 10MB)
- **Three upload methods**:
  1. **Camera**: Take photo directly (iOS Camera API, Android Camera API)
  2. **Photo Roll**: Select existing image from device gallery/photos
  3. **File Upload**: Browse and upload from Mac/Windows file system
- Image preprocessing (rotation, brightness correction, auto-crop)
- OCR for component values and labels

**FR2: AI Schematic Analysis**
- Component recognition (resistors, capacitors, ICs, transistors, etc.)
- Connection topology extraction
- Node identification
- Schematic validation (power rails, ground, etc.)

**FR3: BOM Generation**
- Part number identification
- Specs extraction (resistance, capacitance, voltage rating, etc.)
- Quantity calculation
- Cost estimation from supplier APIs
- Alternative parts suggestions (e.g., 1N4148 vs 1N914)

**FR4: Layout Generation**
- Stripboard: automatic routing algorithm
- Breadboard: automatic routing algorithm
- Minimize track cuts
- Optimize for smallest board size
- Clear visual output (SVG/PNG)

**FR5: Build Instructions**
- Step-by-step text + images
- Component identification photos
- Wiring color codes
- Assembly order optimization
- PDF export functionality

**FR6: User Management**
- Email/password authentication
- OAuth (Google, GitHub)
- Project dashboard
- Save/load projects
- Build history

### Non-Functional Requirements

**NFR1: Performance**
- Schematic processing: < 30 seconds
- BOM generation: < 10 seconds
- Layout generation: < 60 seconds
- Page load time: < 2 seconds

**NFR2: Usability**
- Mobile-first responsive design
- iOS/iPadOS native feel
- Maximum 3 clicks to start a build
- Inline help and tooltips
- Works offline for saved projects

**NFR3: Reliability**
- 99.5% uptime
- Automatic retry for failed uploads
- Data backup every 24 hours
- Graceful degradation if AI service fails

**NFR4: Security**
- HTTPS only
- Secure file upload (virus scanning)
- Rate limiting on uploads
- User data encryption at rest
- GDPR compliant

**NFR5: Scalability**
- Support 1,000 concurrent users
- Handle 10,000 schematics processed/month
- Auto-scaling infrastructure

---

## User Stories

### Epic 1: Schematic to BOM
**US1.1**: As a beginner builder, I want to upload a schematic photo from my phone so that I don't need to scan it on a computer.

**US1.2**: As a user, I want the system to tell me if my schematic is incomplete so that I don't waste time on invalid builds.

**US1.3**: As a builder, I want a complete BOM with direct purchase links so that I can order all parts in one session.

**US1.4**: As a budget-conscious builder, I want to see alternative cheaper components so that I can reduce costs.

### Epic 2: Build Instructions
**US2.1**: As a beginner, I want visual step-by-step instructions like IKEA furniture so that I can build without prior electronics knowledge.

**US2.2**: As a builder, I want to see both stripboard and breadboard layouts so that I can test before soldering.

**US2.3**: As a visual learner, I want color-coded wiring diagrams so that I don't make wiring mistakes.

**US2.4**: As a builder, I want offboard wiring instructions so that I know how to connect jacks and switches.

### Epic 3: Project Management
**US3.1**: As a user, I want to save my projects so that I can return to them later.

**US3.2**: As a builder, I want to mark build steps as complete so that I can track my progress.

**US3.3**: As a user, I want to export instructions to PDF so that I can print them for my workbench.

---

## Technical Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Hosting**: Vercel (CDN + Serverless)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI/ML**:
  - OpenAI GPT-4 Vision API (schematic analysis)
  - Claude API (fallback/cost optimization)
  - Google Gemini (free tier for testing)
- **Image Processing**: Sharp.js, Canvas API
- **Layout Generation**: Custom algorithm + D3.js/SVG
- **File Storage**: Supabase Storage (schematics, generated images)

### System Components
1. **Web Frontend**: React SPA
2. **API Layer**: Vercel Serverless Functions
3. **AI Service**: OpenAI Vision API + Claude
4. **Database**: Supabase PostgreSQL
5. **File Storage**: Supabase Storage
6. **Authentication**: Supabase Auth

---

## Success Metrics (KPIs)

### Launch Metrics (Week 7)
- 50 beta users signed up
- 100 schematics processed
- < 30 second average processing time
- 90% successful BOM generation
- 80% successful layout generation

### Month 3 Metrics
- 500 active users
- 1,000 schematics processed
- 75% user retention (month-over-month)
- 4.5+ star rating from users
- < 5% error rate on builds

### Business Metrics
- Freemium model: 3 free builds/month
- Paid tier: $9/month unlimited builds
- Target: 100 paid users by Month 6
- Break-even: Month 8

---

## Pricing Model

### Free Tier
- 3 schematics per month
- Basic BOM generation
- Standard layouts
- Watermarked PDFs
- Community support

### Pro Tier ($9/month)
- Unlimited schematics
- Advanced BOM (alternative parts, supplier comparison)
- Priority processing
- High-res exports (no watermarks)
- 3D visualization
- Email support
- PCB layout generation (coming soon)

### Enterprise Tier ($49/month)
- Everything in Pro
- API access
- White-label option
- Custom component libraries
- Dedicated support

---

## Risks & Mitigation

### Technical Risks
**Risk**: AI fails to accurately recognize components
**Mitigation**: Manual correction UI, community verification, training data improvement

**Risk**: Layout generation produces invalid circuits
**Mitigation**: Circuit validation algorithm, human review queue for edge cases

**Risk**: High AI API costs
**Mitigation**: Use ChatGPT-4o-mini for simple tasks, cache results, use Gemini for free tier

### Business Risks
**Risk**: Low user adoption
**Mitigation**: Beta launch with DIY communities (Reddit, forums), YouTube tutorials

**Risk**: Competitors emerge
**Mitigation**: Focus on simplicity and UX, build community, iterate fast

### Legal Risks
**Risk**: Schematic copyright issues
**Mitigation**: Terms of service, user responsibility, DMCA compliance

---

## Timeline: 7-Week Sprint

### Week 1: Foundation
- Project setup (React, Supabase, Vercel)
- Database schema design
- Authentication implementation
- Basic UI scaffolding

### Week 2: Schematic Upload
- Image upload functionality
- Camera integration (mobile)
- Image preprocessing
- File storage setup

### Week 3: AI Integration
- OpenAI Vision API integration
- Component recognition prototype
- Connection extraction
- Schematic validation

### Week 4: BOM Generation
- Parts database setup
- BOM generation algorithm
- Supplier API integration
- Cost calculation

### Week 5: Layout Generation
- Stripboard routing algorithm
- Breadboard routing algorithm
- SVG/PNG export
- Layout optimization

### Week 6: Build Instructions
- Step-by-step instruction generator
- Visual asset creation
- Wiring diagram generation
- PDF export

### Week 7: Polish & Launch
- UI/UX refinement
- Mobile optimization
- Testing & bug fixes
- Beta launch
- Documentation

---

## Out of Scope (Phase 1)

- PCB layout generation
- Audio simulation/testing
- Video tutorials
- Community forums
- Shopping cart integration
- Tone stack calculator
- Component inventory management
- Build time estimation
- Multi-language support

---

## Assumptions

1. Users have basic understanding of electronics (know what a resistor is)
2. Uploaded schematics are reasonably clear and readable
3. Standard guitar pedal circuits (9V, common components)
4. Users have access to soldering equipment
5. Initial focus on overdrive/distortion/fuzz pedals (simpler circuits)

---

## Glossary

- **BOM**: Bill of Materials - complete parts list
- **Stripboard**: Perforated board with parallel copper strips for prototyping
- **Breadboard**: Solderless prototyping board
- **Offboard**: Components outside the main circuit board (jacks, switches)
- **Schematic**: Circuit diagram showing electrical connections
- **Layout**: Physical arrangement of components

---

## Appendix

### Competitor Analysis
1. **DIY Layout Creator**: Desktop app, manual layout, outdated UI
2. **Fritzing**: General electronics, not pedal-specific, steep learning curve
3. **PedalPCB**: Sells PCBs but no custom schematic support
4. **DIYRE**: Kits only, not custom builds

**PedalPath Advantage**: AI-powered, mobile-first, Lego-simple, custom schematics

### Reference Materials
- Beavis Audio breadboard guides
- DIYLC (DIY Layout Creator)
- Electrosmash circuit analysis
- R.G. Keen's articles (GEO)
- DIYStompboxes forum

---

**Document Owner**: Rob Frankel
**Reviewers**: [To be assigned]
**Approval Date**: [Pending]
