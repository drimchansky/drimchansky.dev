export type SocialLink = {
  name: string
  url: string
}

export type SiteInfo = {
  url: string
  socialLinks: SocialLink[]
  localizations: {
    [key: string]: {
      name: string
      description: string
      navigation: Array<{
        title: string
        route: string
      }>
      resume: string
      theme: string
      light: string
      auto: string
      dark: string
    }
  }
}

const siteInfo: SiteInfo = {
  url: 'drimchansky.dev',
  socialLinks: [
    { name: 'Telegram', url: 'https://t.me/drimchansky' },
    { name: 'Instagram', url: 'https://www.instagram.com/drimchansky' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/drimchansky' },
    { name: 'GitHub', url: 'https://github.com/drimchansky' }
  ],
  localizations: {
    en: {
      name: 'Nikita Chernov',
      description: 'Personal website of Nikita Chernov',
      navigation: [
        { title: 'Home', route: '/' },
        { title: 'Resume', route: '/resume' }
      ],
      resume: 'Resume',
      theme: 'Theme',
      light: 'Light',
      auto: 'Auto',
      dark: 'Dark'
    },
    ru: {
      name: 'Никита Чернов',
      description: 'Личный сайт Никиты Чернова',
      navigation: [
        { title: 'Главная', route: '/' },
        { title: 'Резюме', route: '/resume' }
      ],
      resume: 'Резюме',
      theme: 'Тема',
      light: 'Светлая',
      auto: 'Авто',
      dark: 'Тёмная'
    }
  }
}

export { siteInfo }
