# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Academy/restaurant management system built with Next.js 16, featuring dashboard analytics, inventory tracking, recipe management, and sales reporting. Uses Clerk for authentication and Supabase as the database backend.

## Commands

```bash
pnpm dev      # Start development server (localhost:3000)
pnpm build    # Production build
pnpm lint     # Run ESLint
pnpm start    # Start production server
```

## Architecture

### Tech Stack

- **Framework**: Next.js 16 with App Router and React Compiler enabled
- **Auth**: Clerk (`@clerk/nextjs`)
- **Database**: Supabase with SSR client
- **Styling**: Tailwind CSS v4 with shadcn/ui components (new-york style)
- **Tables**: TanStack React Table for data grids
- **Charts**: Recharts for dashboard visualizations

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main dashboard with sales analytics
│   ├── inventory/          # Ingredient stock management
│   ├── recipes/            # Menu recipe management
│   ├── movements/          # Stock movements tracking
│   ├── reports/            # Reporting features
│   ├── settings/           # App settings
│   └── sign-in/, sign-up/  # Clerk auth pages
├── components/
│   ├── ui/                 # shadcn/ui primitives (button, table, sidebar, etc.)
│   └── [Component].tsx     # App-level components (Navbar, Menu, Sidebar)
├── utils/supabase/
│   ├── server.ts           # Server-side Supabase client factory
│   └── supabase.ts         # Data fetching functions (getSales, getAllRecipes, etc.)
├── lib/
│   ├── utils.ts            # cn() helper for class merging
│   └── settings.ts         # Route access map and pagination config
├── types/                  # TypeScript type definitions
└── hooks/                  # Custom React hooks
```

### Key Patterns

**Supabase Clients** (`src/utils/supabase/server.ts`):

- `createClient()` - Cookie-based client for authenticated requests
- `createServiceRoleClient()` - Admin client with service role key (server-only)

**Data Fetching** (`src/utils/supabase/supabase.ts`):

- Server-side async functions called from page components
- Pages use `export const dynamic = 'force-dynamic'` or `revalidate = 0` for fresh data

**Layout**: Root layout wraps app with ClerkProvider, SidebarProvider, and ToastContainer

**Path Aliases**: `@/*` maps to `./src/*`

### Database Tables (Supabase)

- `menus` - Menu items
- `menu_sales` - Sales records with menu references
- `menu_recipes` - Recipe ingredients per menu
- `ingredients` - Inventory items

### Environment Variables

Required in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Clerk keys (NEXT*PUBLIC_CLERK*\*)
