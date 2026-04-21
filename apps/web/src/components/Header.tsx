import { Link, useRouterState } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'
import { FortyTwoLogo } from './FortyTwoLogo'
import { defaultLocale, isLocale, otherLocale } from '../lib/i18n'
import * as m from '../paraglide/messages.js'

export default function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const pathLocale = pathname.match(/^\/(en|ar)(?=\/|$)/)?.[1]
  const locale = isLocale(pathLocale) ? pathLocale : defaultLocale
  const nextLocale = otherLocale(locale)
  const languageHref = pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${nextLocale}`)
  const nextLocaleFlag = nextLocale === 'ar' ? '🇦🇪' : '🇺🇸'
  const examsLabel = locale === 'ar' ? 'الامتحانات' : 'Exams'

  return (
    <header className="site-header">
      <nav className="header-inner page-wrap" aria-label="Primary navigation">
        <Link
          to="/$locale"
          params={{ locale }}
          className="brand-link"
        >
          <FortyTwoLogo />
          <span>{m.brand({}, { locale })}</span>
        </Link>

        <div className="nav-links">
          <a
            href={`/${locale}#projects`}
            className="nav-link"
          >
            {m.nav_projects({}, { locale })}
          </a>
          <a
            href={`/${locale}#exam-track`}
            className="nav-link"
          >
            {examsLabel}
          </a>
        </div>

        <div className="header-actions">
          <a
            href={languageHref}
            className="flag-link"
            aria-label={m.nav_language({}, { locale })}
            title={m.nav_language({}, { locale })}
          >
            <span aria-hidden="true">{nextLocaleFlag}</span>
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
