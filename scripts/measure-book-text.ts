import { readFile } from 'node:fs/promises'

import { measureBookText } from '../src/components/bookshelf/functions/measureBookText.ts'

const [filename, ...extra] = process.argv.slice(2)
if (!filename || extra.length > 0) {
  process.stderr.write('Usage: node scripts/measure-book-text.ts <plain-text-file>\n')
  process.exitCode = 1
} else {
  try {
    const text = await readFile(filename, 'utf8')
    process.stdout.write(`${JSON.stringify(measureBookText(text))}\n`)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'Unable to read text'}\n`)
    process.exitCode = 1
  }
}
