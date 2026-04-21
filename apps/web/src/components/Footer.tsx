import { Code2, GitBranch, Search } from 'lucide-react'
import { getLocale } from '../paraglide/runtime.js'
import * as m from '../paraglide/messages.js'

export default function Footer() {
  const year = new Date().getFullYear()
  const locale = getLocale()

  return (
    <footer className="site-footer">
      <div className="footer-inner page-wrap">
        <div className="footer-copy">
          <p>&copy; {year} {m.brand()}</p>
          <p>{m.footer_note()}</p>
        </div>
        <div className="footer-actions">
          <a
            href={`/${locale}#projects`}
            aria-label="Projects"
            className="footer-link"
          >
            <Code2 aria-hidden="true" size={18} />
          </a>
          <a
            href={`/${locale}/search`}
            aria-label="Search"
            className="footer-link"
          >
            <Search aria-hidden="true" size={18} />
          </a>
          <a
            href="https://github.com"
            aria-label="GitHub"
            className="footer-link"
          >
            <GitBranch aria-hidden="true" size={18} />
          </a>
        </div>
      </div>
    </footer>
  )
}
