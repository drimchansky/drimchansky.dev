import type { TokenName } from '@/i18n'

export type SocialLink = {
  content: string
  id: string | null
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
      content: 't.me/drimchansky',
      id: 'telegram',
      name: 'Telegram',
      showOnHomePage: true,
      showOnResumePage: true,
      url: 'https://t.me/drimchansky'
    },
    {
      content: '@drimchansky',
      id: null,
      name: 'Instagram',
      showOnHomePage: true,
      url: 'https://www.instagram.com/drimchansky'
    },
    {
      content: 'linkedin.com/in/drimchansky',
      id: 'linkedin',
      name: 'LinkedIn',
      showOnHomePage: true,
      showOnResumePage: true,
      url: 'https://www.linkedin.com/in/drimchansky'
    },
    {
      content: 'github.com/drimchansky',
      id: 'github',
      name: 'GitHub',
      showOnHomePage: true,
      showOnResumePage: true,
      url: 'https://github.com/drimchansky'
    },
    {
      content: 'drimchansky@gmail.com',
      id: 'email',
      name: 'Email',
      showOnResumePage: true,
      url: 'mailto:drimchansky@gmail.com'
    }
  ],
  url: 'drimchansky.dev'
}

export { siteInfo }
