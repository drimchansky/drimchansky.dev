# Resume PDF Generation

The build generates downloadable PDF resumes from the `/resume/` pages using Playwright. One PDF per locale, output to `dist/files/`.

## How it works

1. The `resumePdf()` Astro integration (`src/plugins/resume-pdf.ts`) hooks into `astro:build:done`
2. Starts a throwaway HTTP server on a random port, serving the built `dist/` directory
3. Launches Playwright Chromium and visits `/{locale}/resume/` for each locale
4. Calls `page.pdf()` with A4 format and `printBackground: true`
5. Saves PDFs to `dist/files/{filename}.pdf` — filenames come from `RESUME_FILENAMES_BY_LOCALE` in `src/components/resume/constants.ts`
6. Closes browser and server

The `TESTING` env var skips the entire process (used by CI test jobs and `scripts/test.sh`).

The integration is registered in `astro.config.ts` via `resumePdf()`.

## Print styling

The resume page and its components use Tailwind `print:` utilities to adapt for PDF output:

- `print:hidden` — hides the download button and duration text
- `print:text-sm`, `print:py-0` — compact text and spacing
- `print:[--resume-gap:0.25rem]` — reduces gap between resume items (1rem on screen)
- `--resume-gap` is defined in `src/app/styles/tailwind.css` with a `@media print` override
- `src/app/styles/colors.css` forces `color-scheme: light` in print media — PDFs always render in light mode

Playwright generates PDFs with `printBackground: true`, so background colors are preserved.

## CI pipeline

- **Test job**: runs inside the Playwright Docker image (`mcr.microsoft.com/playwright:*-noble`) with browsers pre-installed. Sets `TESTING=true`, so PDF generation is skipped.
- **Deploy job**: runs on bare `ubuntu-latest` — no pre-installed browsers. Explicitly installs Chromium (`playwright install --with-deps chromium`) because `pnpm build` triggers the resume-pdf plugin. Deploys `dist/` (including PDFs) to Cloudflare Pages.
- **Local testing** (`scripts/test.sh`): sets `TESTING=true` inside Docker.
