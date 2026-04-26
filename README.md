# PipelineIQ

A local web application for student-run consulting firms to discover target companies, select prospects, and generate personalized cold outreach drafts.

**Flow:** Discover → Select → Generate (no sending)

## Prerequisites

- Node 18+
- Docker Desktop

## Setup

1. **Clone & install**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your API keys in `.env.local`:
   - `APOLLO_API_KEY` — from [apollo.io](https://app.apollo.io/#/settings/integrations/api)
   - `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com/)
   - `DATABASE_URL` — pre-filled for local Docker Postgres

3. **Start Postgres**
   ```bash
   docker-compose up -d
   ```

4. **Run migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Start dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Firm Profile** (`/firm-profile`) — Set up your firm name, services, ICP filters, and case studies
2. **New Campaign** — Name your campaign and go to Discover
3. **Discover** — Search Apollo.io with natural language, shortlist companies
4. **Select** — Find contacts per company, write a service angle, keep or skip
5. **Generate** — AI drafts email + LinkedIn messages per contact. Edit, approve, export CSV.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **PostgreSQL 15** via Docker
- **Prisma** ORM
- **Tailwind CSS**
- **Anthropic Claude** (`claude-sonnet-4-20250514`) for outreach generation
- **Apollo.io** REST API for company/contact discovery

## Notes

- Apollo free tier: 50 requests/hour. The app falls back to cached DB results on rate limit.
- All outreach is draft-only �� nothing is sent automatically.
