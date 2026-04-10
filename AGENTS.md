# Project Spec: drimchansky.dev

## Objective

- Personal website and portfolio powered by Astro with multi-language support (en/ru)
- Features: blog (notes), resume with PDF generation, bookshelf, i18n routing

## Tech Stack

- Astro 6, TypeScript (strict), Tailwind CSS 4, MDX
- Content collections with Zod validation (resume, notes, books, general)
- Cloudflare Pages deployment

## Commands

- Dev: `pnpm dev`
- Build: `pnpm build` (runs `astro check && astro build`)
- Lint: `pnpm lint` (astro check + ESLint)
- Format: `pnpm format` (Prettier + ESLint fix)
- Unit tests: `pnpm test:unit` (Vitest, files in `src/**/*.test.ts`)
- E2E tests: `pnpm test:e2e` (Playwright, Desktop + Mobile Chrome)
- Visual tests: `pnpm test:visual` (Playwright visual regression)
- Update snapshots: `pnpm test:visual:update`
- Full suite: `pnpm test` (lint + unit + e2e + visual)

## Project Structure

- `src/app/` – Layouts, global styles, i18n config
- `src/pages/` – Astro page routes (language-prefixed)
- `src/components/` – Feature components (resume, bookshelf, notes, header)
- `src/shared/` – Shared UI, utilities, assets, icons
- `src/content/` – Content collections and Zod schemas
- `src/plugins/` – Custom Astro/rehype plugins (figure-caption, resume-pdf)
- `tests/e2e/` – Playwright end-to-end tests
- `tests/visual/` – Playwright visual regression tests
- `public/` – Static assets

## Boundaries

- ✅ Always: Run `pnpm lint` and `pnpm test:unit` before commits; follow existing ESLint/Prettier/Stylelint config
- ⚠️ Ask first: Adding dependencies, modifying content collection schemas, changing i18n routing
