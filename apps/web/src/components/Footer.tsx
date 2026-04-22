import { Code2 } from 'lucide-react'
import { GitHubLogo } from './GitHubLogo'
import { GITHUB_REPO_URL } from '../lib/links'
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
            href={GITHUB_REPO_URL}
            aria-label="GitHub"
            className="footer-link"
            target="_blank"
            rel="noreferrer"
          >
            <GitHubLogo size={18} />
          </a>
        </div>
      </div>
    </footer>
  )
}
