import type { Locale } from '@/app/i18n'

export const pluralize = (
  count: number,
  locale: Locale,
  forms: Partial<Record<Intl.LDMLPluralRule, string>>
): string => {
  const rule = new Intl.PluralRules(locale).select(count)
  return forms[rule] ?? forms.other ?? ''
}
