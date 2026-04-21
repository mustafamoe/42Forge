import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, Briefcase, MessageSquarePlus } from 'lucide-react'
import { ArticleGrid } from '../components/ArticleCard'
import { GitHubLogo } from '../components/GitHubLogo'
import Header from '../components/Header'
import { getArticleSummaries } from '../lib/content'
import { asLocale } from '../lib/i18n'
import { GITHUB_ISSUE_URL, GITHUB_REPO_URL } from '../lib/links'
import * as m from '../paraglide/messages.js'

export const Route = createFileRoute('/$locale/')({
  loader: ({ params }) => ({
    projects: getArticleSummaries(asLocale(params.locale), 'projects'),
  }),
  component: HomePage,
})

function HomePage() {
  const { locale: localeParam } = Route.useParams()
  const locale = asLocale(localeParam)
  const { projects } = Route.useLoaderData()

  return (
    <>
      <Header />
      <main className="home-page">
        <section className="section-block page-wrap" id="projects">
          <div className="section-heading projects-heading">
            <Briefcase aria-hidden="true" size={28} />
            <h2>
              {m.nav_projects({}, { locale })}
            </h2>
          </div>
          <ArticleGrid articles={projects} locale={locale} />
        </section>

        <section className="contribute-section" id="contribute">
          <div className="contribute-inner page-wrap">
            <div className="contribute-copy">
              <p className="eyebrow">{m.contribute_eyebrow({}, { locale })}</p>
              <h2>{m.contribute_title({}, { locale })}</h2>
              <p>{m.contribute_body({}, { locale })}</p>
            </div>
            <div className="contribute-actions" aria-label={m.contribute_eyebrow({}, { locale })}>
              <a
                href={GITHUB_ISSUE_URL}
                className="primary-link"
                target="_blank"
                rel="noreferrer"
              >
                <MessageSquarePlus aria-hidden="true" size={17} />
                <span>{m.contribute_primary({}, { locale })}</span>
                <ArrowUpRight aria-hidden="true" size={15} />
              </a>
              <a
                href={GITHUB_REPO_URL}
                className="secondary-link"
                target="_blank"
                rel="noreferrer"
              >
                <GitHubLogo size={17} />
                <span>{m.contribute_secondary({}, { locale })}</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
