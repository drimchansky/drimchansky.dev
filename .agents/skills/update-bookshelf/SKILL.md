---
name: update-bookshelf
description: Add or update books on drimchansky.dev, including bilingual metadata, covers, reading status and source-backed full-book length estimates.
---

# Update the bookshelf

Work from the repository root. Read `AGENTS.md`, the [book schema](../../../src/content.config.ts), and nearby production book records before editing. Book content lives in `src/content/books/`; JPEG covers live in `src/assets/covers/`.

## Owner facts and book identity

- Match an existing entry by title/author and included works before creating another. Use the existing English-title/author filename convention and a matching `.jpg` cover filename for a new entry.
- Preserve owner-supplied ratings, dates, reading language, descriptions, body text and covers unless the request changes them. Do not infer a completion date or reading status from missing information; ask for required owner facts while researching independent details.
- Keep English/Russian titles and author names consistent with the published work or translation. `language` describes the text read, independently of the website locale. Categories are `fiction` or `non-fiction`.
- A null `dateFinished` means currently reading; `skipped: true` means unfinished; null `rating` means unrated. Read the schema for valid fields and values. Do not copy `isTestOnly` from fixtures into production records.
- Reuse an appropriate existing cover or obtain the requested book's actual cover from an accessible source. Save a new cover as JPEG, set `cover` to its filename, and verify that it opens. Do not replace unrelated assets.

## Research full-book length

Read the canonical [estimate schema](../../../src/components/bookshelf/functions/pageEstimateSchema.ts) and [formatter](../../../src/components/bookshelf/functions/formatPageEstimate.ts). Product metadata stores only a positive whole-page `pageEstimate` and a short bilingual `pageEstimateMethod`; omit both when length is unknown. Keep detailed sources and measurements in the requested task audit or maintenance evidence outside book frontmatter, rather than publishing them in the hint.

Prefer a published word count, then count accessible complete text, then extrapolate from a complete character extent and measured representative samples. Check the actual source's title, reading language and full-work coverage. Resolve collection contents and treatment of afterwords, translator notes and appendices before choosing parts. A verified total covering one complete published collection can be one part scoped to that whole collection. Separately measured works need distinct, nonoverlapping parts; do not invent per-story allocations from a collection total.

In that separate evidence record, retain for every accepted part the source URL/name, research date, precise scope and useful source locator. Counted text needs extraction boundaries and counting rules. Sampling needs the complete character extent, an established or explicitly owner-approved assumed character convention, and nonoverlapping sample URLs/locators, sizes and extraction/counting rules. A provider field named `symbols_count` does not establish whether whitespace or other material is counted. Use the same convention for complete extent and samples.

For this bookshelf archive, the owner approved assuming that provider character extents exclude whitespace. Measure samples without whitespace and explicitly identify the provider convention as assumed, not verified. Keep the assumed no-space convention and essential sampling limitations in both short localized hints, as in [Pollen](../../../src/content/books/pollen--jeff-noon.md); retain full details in the separate evidence record. This approval does not supply missing extents or establish compatibility with an unrelated work, language or translation. Source-qualified alternate Russian editions may represent the same complete work without claiming to be the owner's exact copy. The Leaf Storm and Colonel entries represent their title novellas only; preserve that scope in their separate evidence and short hints.

A search snippet, unrelated translation/sample, printed pagination, universal characters-per-word ratio or assumed translation multiplier cannot support an estimate. If evidence is inaccessible, incomplete or ambiguous, report the specific gap and further evidence needed. Omit an unsupported numeric estimate. Keep an existing valid estimate when a proposed replacement is unproved; remove one shown to be unsupported and explain the gap. Do not claim complete coverage while any book remains unresolved. Do not purchase content, bypass access controls or contact others without authorization.

## Measure and validate

Extract only the intended book text to a temporary UTF-8 plain-text file, recording exclusions and completeness checks. The measurement helper does no extraction or fetching:

```sh
node scripts/measure-book-text.ts /tmp/extracted-book.txt
```

The shared [measurement function](../../../src/components/bookshelf/functions/measureBookText.ts) normalizes NFC, collapses Unicode whitespace to one space and trims it. It reports Unicode code points with normalized spaces and without whitespace. Words are Unicode letter/number runs with internal straight/curly apostrophes or hyphens U+002D/U+2010/U+2011; punctuation and decimal separators split runs. Choose the character result that matches the established source convention. Empty text gives zero measurements and cannot support an estimate. Keep downloaded book text outside the repository and generated website.

Calculate the final value during maintenance: sum unrounded word counts or estimates for all included works, divide by 300, then round to the nearest 10 pages (`10 * Math.round(totalWords / 3000)`). If a positive work rounds to zero, store its whole-page estimate (`Math.max(1, Math.round(totalWords / 300))`); the formatter displays values below 10 as `<10 pages` / `<10 стр.`. For example, 130,000 words gives 430; 308,000 gives 1,030; 900 gives stored 3 and displayed `<10`.

Write a concise method hint in each website language, retaining essential uncertainty or collection scope. Do not copy source locators, measurement logs or long research explanations into it:

```yaml
pageEstimate: 430
pageEstimateMethod:
  en: Reported word count ÷ 300, rounded to 10 pages.
  ru: Заявленное число слов ÷ 300, округление до 10 страниц.
```

Validate parsed frontmatter using `bookPageEstimateSchema`; `@astrojs/markdown-remark` exports `parseFrontmatter` for local inventories. Preview both locales with `formatPageEstimate(book.pageEstimate, book.pageEstimateMethod?.[locale], locale)`. Native Node supports the helpers' explicit relative `.ts` imports. Confirm source language and full-work coverage from the separate evidence, since the simple schema cannot establish them.

Check the requested diff against the original owner facts and body, cover references, schema validation and numeric/hint previews. A correction changes only requested facts and the supported number/hints; retain the replacement evidence separately. Run `pnpm exec astro check`; follow `AGENTS.md` for required checks before any separately authorized commit. When correcting measurement code, run its focused unit tests too. For archive work, audit each batch of at most five records before continuing.

Present changed books, EN/RU estimate previews, linked evidence, qualifications, unresolved gaps and checks run. Keep staging, commits, pushes and releases outside an ordinary bookshelf update unless separately authorized. The project's `.agents` directory may be globally ignored: explicitly identify this skill for deliberate delivery without changing ignore settings.
