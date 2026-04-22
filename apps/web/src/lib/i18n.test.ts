import { describe, expect, it } from 'vitest'

import { asLocale, localeDir, localizedPath, otherLocale } from './i18n'

describe('i18n helpers', () => {
  it('normalizes unsupported locales to English', () => {
    expect(asLocale('ar')).toBe('ar')
    expect(asLocale('fr')).toBe('en')
    expect(asLocale(undefined)).toBe('en')
  })

  it('returns the correct writing direction per locale', () => {
    expect(localeDir('en')).toBe('ltr')
    expect(localeDir('ar')).toBe('rtl')
  })

  it('builds locale-prefixed paths', () => {
    expect(localizedPath('en', '/projects/sample')).toBe('/en/projects/sample')
    expect(localizedPath('ar', 'projects')).toBe('/ar/projects')
    expect(otherLocale('en')).toBe('ar')
  })
})
