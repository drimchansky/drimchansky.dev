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
- Unit tests: `pnpm test:unit` (Vitest, files in `src/**/*.test.ts` and `scripts/**/*.test.ts`)
- E2E tests: `pnpm test:e2e` (Playwright, Desktop + Mobile Chrome)
- Visual tests: `pnpm test:visual` (Playwright visual regression)
- Update snapshots: `pnpm test:visual:update`
- Full suite: `pnpm test` (lint + unit + e2e + visual)
- Icons: `pnpm icons` (regenerates favicons, app icons and the manifest from the brand mark)

## Project Structure

- `src/app/` – Layouts, global styles, i18n config
- `src/pages/` – Astro page routes (language-prefixed)
- `src/components/` – Feature components (resume, bookshelf, notes, header)
- `src/shared/` – Shared UI, utilities, assets, icons
- `src/content/` – Content collections and Zod schemas
- `src/plugins/` – Custom Astro/rehype plugins (figure-caption, resume-pdf)
- `tests/e2e/` – Playwright end-to-end tests
- `tests/visual/` – Playwright visual regression tests
- `public/` – Static assets, Cloudflare `_headers`, `_redirects` and `_routes.json`
- `functions/` – Cloudflare Pages Functions
- `scripts/` – Icon generator, the Docker-based Playwright runner and the Pages preview helper

## Icons

`src/shared/assets/brand/mark.svg` is the only hand-authored icon asset. After changing it, run `pnpm icons` to
regenerate `public/icon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png`, `public/icon-192.png`,
`public/icon-512.png`, `public/icon-maskable-512.png`, `public/manifest.webmanifest` and `src/shared/site-icons.ts`.
Commit all generated outputs and never edit them by hand.

- The mark is the near-black (`#051116`) circle followed by the brand green (`#00d395`) EB Garamond SemiBold N,
  converted to an outline and expanded outward by 8 of 512 units so its thin stem stays visible at 16 px
- The first path's fill is the tile colour: it backs the opaque Apple and maskable icons and becomes `THEME_COLOR`
  for the `theme-color` meta. Keep the letter inside the maskable safe circle (radius 40% of the canvas)
- Icon URLs carry `?v=` with the first eight hex digits of each file's SHA-256 so browsers fetch a changed icon;
  `head.astro` reads them from `src/shared/site-icons.ts`
- The generator only accepts `svg` and `path` elements, `xmlns`/`viewBox` on the root, `d` and a six-digit hex `fill`
  on each path, and a square viewBox

## PR previews

Same-repository PRs into `main` deploy to the Cloudflare Pages `pr-<number>` alias after lint and tests pass (the
`preview` job in `.github/workflows/ci.yaml`). `scripts/pages-preview.ts` checks eligibility, posts the preview comment
and deletes the PR's preview deployments when it closes (`.github/workflows/preview-cleanup.yaml`).

- `check` requires the Pages project's production branch to be `main` and its Git preview deployments to be off
- The Cloudflare API token must be able to read the Pages project and create and delete its deployments
- Cleanup runs the default branch's copy of the helper (`pull_request_target`), so changes to it apply only after merge
- Push CI runs only on `main`; other branches are checked only through a PR into `main`, so branches without one, and
  PRs into other bases, run no CI
- `check` skips a run once a newer run exists for the same PR branch and head commit, so re-run the newest run to
  redeploy
- Retargeting a PR to `main` starts no run; push again, or close and reopen it, to get CI and a preview
- Runs triggered by Dependabot (PRs it opens or rebases) deploy no preview because they receive no Actions secrets;
  a re-run keeps Dependabot as the actor, so push to the branch yourself, or close and reopen the PR, to deploy one

## Boundaries

- ✅ Always: Run `pnpm lint` and `pnpm test:unit` before commits; follow existing ESLint/Prettier/Stylelint config
- ⚠️ Ask first: Adding dependencies, modifying content collection schemas, changing i18n routing
