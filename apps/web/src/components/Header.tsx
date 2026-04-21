import { Link, useRouterState } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'
import { defaultLocale, isLocale, otherLocale } from '../lib/i18n'
import * as m from '../paraglide/messages.js'

export default function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const pathLocale = pathname.match(/^\/(en|ar)(?=\/|$)/)?.[1]
  const locale = isLocale(pathLocale) ? pathLocale : defaultLocale
  const nextLocale = otherLocale(locale)
  const languageHref = pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${nextLocale}`)
  const nextLocaleFlag = nextLocale === 'ar' ? '🇦🇪' : '🇺🇸'
  const nextLocaleLabel = nextLocale === 'ar' ? 'العربية' : 'English'

  return (
    <header className="site-header">
      <nav className="header-inner page-wrap" aria-label="Primary navigation">
        <Link
          to="/$locale"
          params={{ locale }}
          className="brand-link"
        >
          <span>{m.brand({}, { locale })}</span>
        </Link>

        <div className="header-actions">
          <a
            href={languageHref}
            className="flag-link"
            aria-label={m.nav_language({}, { locale })}
            title={m.nav_language({}, { locale })}
          >
            <span aria-hidden="true">{nextLocaleFlag}</span>
            <span>{nextLocaleLabel}</span>
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
