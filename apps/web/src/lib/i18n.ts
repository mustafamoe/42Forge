import type { Locale } from '../paraglide/runtime.js'

export type { Locale }

export const supportedLocales = ['en', 'ar'] as const satisfies readonly Locale[]
export const defaultLocale = 'en' satisfies Locale

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && supportedLocales.includes(value as Locale)
}

export function asLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale
}

export function localeDir(locale: Locale) {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

export function otherLocale(locale: Locale) {
  return locale === 'ar' ? 'en' : 'ar'
}

export function localizedPath(locale: Locale, path = '') {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `/${locale}${normalized === '/' ? '' : normalized}`
}

export type Section = 'projects'
export type SingularSection = 'project'

export function isSection(value: unknown): value is Section {
  return value === 'projects'
}

export function asSection(value: unknown): Section {
  return isSection(value) ? value : 'projects'
}
