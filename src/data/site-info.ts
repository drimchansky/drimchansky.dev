import type { TokenName } from '@/i18n'

export type SocialLink = {
  content: string
  name: string
  showOnHomePage?: boolean
  showOnResumePage?: boolean
  url?: string
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
    {
      content: '@drimchansky',
      name: 'Telegram',
      showOnHomePage: true,
      showOnResumePage: true,
      url: 'https://t.me/drimchansky'
    },
    { content: '@drimchansky', name: 'Instagram', showOnHomePage: true, url: 'https://www.instagram.com/drimchansky' },
    {
      content: '@drimchansky',
      name: 'LinkedIn',
      showOnHomePage: true,
      showOnResumePage: true,
      url: 'https://www.linkedin.com/in/drimchansky'
    },
    {
      content: '@drimchansky',
      name: 'GitHub',
      showOnHomePage: true,
      showOnResumePage: true,
      url: 'https://github.com/drimchansky'
    }
    // { content: 'drimchansky@gmail.com', name: 'E-mail', url: 'mailto:drimchansky@gmail.com' }
  ],
  url: 'drimchansky.dev'
}

export { siteInfo }
