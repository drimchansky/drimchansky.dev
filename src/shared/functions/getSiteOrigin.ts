import { siteInfo } from '@/shared/site-info'

export const getSiteOrigin = (site: URL | undefined) => site?.origin ?? `https://${siteInfo.url}`
