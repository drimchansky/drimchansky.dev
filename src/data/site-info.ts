import type { TokenName } from '@/i18n'

export type SocialLink = {
  name: string
  url: string
}

export type SiteInfo = {
  navigation: Array<{
    route: string
    token: TokenName
  }>
  socialLinks: SocialLink[]
  url: string
}

const siteInfo: SiteInfo = {
  navigation: [
    { route: '/', token: 'homePage' },
    { route: '/resume', token: 'resume' }
  ],
  socialLinks: [
    { name: 'Telegram', url: 'https://t.me/drimchansky' },
    { name: 'Instagram', url: 'https://www.instagram.com/drimchansky' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/drimchansky' },
    { name: 'GitHub', url: 'https://github.com/drimchansky' }
  ],
  url: 'drimchansky.dev'
}

export { siteInfo }
