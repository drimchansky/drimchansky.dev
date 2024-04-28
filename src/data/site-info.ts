import type { TokenName } from '@/i18n'

export type SocialLink = {
  name: string
  url: string
}

export type SiteInfo = {
  url: string
  socialLinks: SocialLink[]
  navigation: Array<{
    token: TokenName
    route: string
  }>
}

const siteInfo: SiteInfo = {
  url: 'drimchansky.dev',
  socialLinks: [
    { name: 'Telegram', url: 'https://t.me/drimchansky' },
    { name: 'Instagram', url: 'https://www.instagram.com/drimchansky' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/drimchansky' },
    { name: 'GitHub', url: 'https://github.com/drimchansky' }
  ],
  navigation: [
    { token: 'homePage', route: '/' },
    { token: 'resume', route: '/resume' }
  ]
}

export { siteInfo }
