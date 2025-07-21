import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

import type { Locale } from '@/shared/i18n'

import { siteInfo } from '@/shared/site-info'

const mdParser = new MarkdownIt()

export async function getStaticPaths() {
  return [{ params: { lang: 'en' } }, { params: { lang: 'ru' } }]
}

export async function GET({ params }: { params: { lang: Locale } }) {
  const { lang } = params
  const notes = await getCollection('notes', ({ id }) => {
    return id.startsWith(`${lang}/`)
  })

  const sortedNotes = notes.sort(
    (a, b) => new Date(b.data.publishingDate).getTime() - new Date(a.data.publishingDate).getTime()
  )

  const feedConfig = {
    en: {
      description:
        'Personal notes, interesting meterials and thoughts on web development, technology, learning, and other topics',
      title: 'Notes – Nikita Chernov'
    },
    ru: {
      description:
        'Личные заметки, интересные материалы и мысли о веб-разработке, технологиях, обучении, и на другие темы',
      title: 'Заметки – Никита Чернов'
    }
  }

  const config = feedConfig[lang]

  return rss({
    customData: `<language>${lang}</language>`,
    description: config.description,
    items: sortedNotes.map(note => ({
      content: sanitizeHtml(mdParser.render(note.body)),
      link: `/${lang}/notes/${note.slug.replace(`${lang}/`, '')}/`,
      pubDate: note.data.publishingDate,
      title: note.data.title
    })),
    site: `https://${siteInfo.url}`,
    title: config.title
  })
}
