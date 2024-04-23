export type SocialLink = {
  name: string
  url: string
}

export type SiteInfo = {
  name: string
  url: string
  description: string
  image: {
    src: string
    alt: string
  }
  socialLinks: SocialLink[]
}

const siteInfo: SiteInfo = {
  name: 'Nikita Chernov',
  url: 'drimchansky.dev',
  description: 'Personal website of Nikita Chernov',
  image: {
    src: '@todo',
    alt: 'Personal website of Nikita Chernov'
  },
  socialLinks: [
    { name: 'Telegram', url: 'https://t.me/drimchansky' },
    { name: 'Instagram', url: 'https://www.instagram.com/drimchansky' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/drimchansky' },
    { name: 'GitHub', url: 'https://github.com/drimchansky' }
  ]
}

export { siteInfo }
