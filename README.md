# FlowStone Registry

**Institutional RWA registry and tokenized asset frontend case study**

> **Disclaimer**: This is a self-initiated frontend case study demo built to demonstrate registry transfer and tokenized asset UI workflows.

FlowStone Registry is a mock-data-driven frontend application showcasing a professional, institutional-grade interface for real-world asset (RWA) tokenization, compliance routing, and registry management.

## Tech Stack

- **React 19**
- **TypeScript**
- **TanStack Start / TanStack Router**
- **Tailwind CSS v4**
- **Radix UI** (shadcn-style UI primitives)
- **lucide-react** for iconography

## Features

- **Dashboard overview**: High-level KPIs, asset allocation, and recent transfer activity.
- **Registry transfer hub**: Filtering and routing of institutional ownership transfers.
- **Transfer case detail**: Deep-dive into a specific transfer with compliance checklists and decision panels.
- **Holding detail**: Granular view of a registry asset, including governance rights and audit trail.
- **Tokenized market mode**: Mock trading interface for settled tokenized assets.
- **Arabic/English language support**: Full i18n implementation.
- **RTL/LTR support**: Native right-to-left alignment for Arabic localization.
- **Dark/light mode**: Persistent, responsive theme switching.
- **Mock data-driven UI**: Realistic scenarios simulating institutional fintech workflows.

## Routes

- `/dashboard` — Portfolio overview
- `/transfers` — Registry transfer hub
- `/transfers/$id` — Transfer case detail
- `/holdings/$id` — Holding detail
- `/market` — Tokenized market

## Local Setup

Ensure you have Node.js and `npm` (or `bun` / `pnpm`) installed.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run dev server**

   ```bash
   npm run dev
   ```

3. **Build for production**

   ```bash
   npm run build
   ```

4. **Preview production build locally**
   ```bash
   npm run preview
   ```

## Deployment Notes

This project is configured to deploy via Cloudflare Pages by default using the `@cloudflare/vite-plugin` and `wrangler.jsonc` configuration.

To deploy on Vercel:

1. Remove `@cloudflare/vite-plugin` from `vite.config.ts`.
2. Delete `wrangler.jsonc`.
3. Vercel will automatically detect the Vite / TanStack Router framework and build it correctly.
4. No additional environment variables are strictly required to serve the frontend mock data.
