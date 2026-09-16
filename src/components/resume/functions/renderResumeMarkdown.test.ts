import { describe, expect, it } from 'vitest'

import { renderResumeMarkdown } from './renderResumeMarkdown'

const position = (company: string, dateStart: string, dateEnd?: string) => ({
  body: `About ${company}.`,
  data: {
    company,
    companyLink: `https://${company.toLowerCase()}.example`,
    dateEnd: dateEnd ? new Date(`${dateEnd}T00:00:00.000Z`) : undefined,
    dateStart: new Date(`${dateStart}T00:00:00.000Z`),
    location: { country: 'Cyprus', type: 'remote' as const },
    position: 'Frontend Engineer'
  }
})

describe('renderResumeMarkdown', () => {
  it('renders the header, contacts, sections and positions newest first', () => {
    const result = renderResumeMarkdown({
      education: 'BSc.',
      locale: 'en',
      positions: [position('Old', '2019-03-01', '2020-11-01'), position('New', '2021-01-01', '2021-06-01')],
      siteOrigin: 'https://example.com',
      skills: 'TypeScript',
      summary: 'Summary text.'
    })

    expect(result).toContain(
      '# Resume – Nikita Chernov\n\n**Nikita Chernov** — Frontend engineer, Tbilisi, Georgia\n\n'
    )
    expect(result).toContain('- Canonical: https://example.com/en/resume/\n')
    expect(result).toContain('- PDF: https://example.com/files/Nikita_Chernov_Frontend_Resume.pdf\n')
    expect(result).toContain('- Email: [drimchansky@gmail.com](mailto:drimchansky@gmail.com)')
    expect(result).toContain('## Summary\n\nSummary text.\n\n## Experience\n\n')
    expect(result).toContain(
      '### Frontend Engineer, [New](https://new.example)\n\nJan 2021 – Jun 2021 (6 months) · Cyprus · Remote\n\nAbout New.\n\n### Frontend Engineer, [Old](https://old.example)\n\nMar 2019 – Nov 2020 (1 year 9 months) · Cyprus · Remote\n\nAbout Old.'
    )
    expect(result).toContain('## Education\n\nBSc.\n\n## Skills & Languages\n\nTypeScript')
  })

  it('marks an open-ended position as present and percent-encodes the Russian PDF name', () => {
    const result = renderResumeMarkdown({
      locale: 'ru',
      positions: [position('Now', '2020-01-01')],
      siteOrigin: 'https://example.com'
    })

    expect(result).toContain('# Резюме – Никита Чернов')
    expect(result).toMatch(/янв\. 2020 г\. – на данный момент \(.+\) · Cyprus · Удалённо/)
    expect(result).toContain(
      `- PDF: https://example.com/files/${encodeURIComponent('Никита_Чернов_Фронтенд_Резюме')}.pdf`
    )
  })
})
