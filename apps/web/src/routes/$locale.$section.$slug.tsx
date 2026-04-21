import { createFileRoute, redirect } from '@tanstack/react-router'
import { ArrowLeft, CalendarDays, Gauge, Tags } from 'lucide-react'
import { useEffect, useLayoutEffect, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { NotFound } from '../components/NotFound'
import { ProjectLab } from '../components/ProjectLab'
import { mdxComponents } from '../components/mdx'
import { getArticle, getArticleSummary } from '../lib/content'
import { asLocale, asSection, isLocale, isSection, type Locale } from '../lib/i18n'
import * as m from '../paraglide/messages.js'

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

export const Route = createFileRoute('/$locale/$section/$slug')({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale) || !isSection(params.section)) {
      throw redirect({ href: '/en' })
    }
  },
  loader: ({ params }) => ({
    article: getArticleSummary(
      asLocale(params.locale),
      asSection(params.section),
      params.slug,
    ),
  }),
  head: ({ loaderData }) => {
    const article = loaderData?.article

    return {
      meta: article
        ? [
            { title: `${article.title} | 42Forge` },
            {
              name: 'description',
              content: article.description,
            },
          ]
        : [{ title: 'Not found | 42Forge' }],
    }
  },
  component: ArticlePage,
  pendingComponent: ProjectDetailSkeleton,
})

function ArticlePage() {
  const { locale: localeParam, section: sectionParam } = Route.useParams()
  const locale = asLocale(localeParam)
  const isRtl = locale === 'ar'
  const section = asSection(sectionParam)
  const { slug } = Route.useParams()
  const article = getArticle(locale, section, slug)
  const [readerWidth, setReaderWidth] = useState(390)
  const [overviewDismissed, setOverviewDismissed] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const overviewStorageKey = article?.projectLabId
    ? `guided-project:${article.projectLabId}:overview-seen`
    : ''

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useIsomorphicLayoutEffect(() => {
    if (!overviewStorageKey || typeof window === 'undefined') return
    setOverviewDismissed(window.localStorage.getItem(overviewStorageKey) === 'true')
  }, [overviewStorageKey])

  if (!article) {
    return <NotFound />
  }

  const Content = article.Content

  const hasProjectLab = Boolean(article.projectLabId)

  const resizeReader = (event: ReactPointerEvent<HTMLDivElement>) => {
    const layout = event.currentTarget.parentElement
    if (!layout) return

    event.preventDefault()
    const bounds = layout.getBoundingClientRect()
    const pointerId = event.pointerId
    event.currentTarget.setPointerCapture(pointerId)

    const onMove = (moveEvent: PointerEvent) => {
      const width = Math.round(
        isRtl ? bounds.right - moveEvent.clientX : moveEvent.clientX - bounds.left,
      )
      const maxWidth = Math.round(bounds.width * 0.52)
      setReaderWidth(Math.min(Math.max(width, 310), maxWidth))
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const adjustReader = (amount: number) => {
    setReaderWidth((width) => Math.min(Math.max(width + amount, 310), 680))
  }

  const startSteps = () => {
    setOverviewDismissed(true)
    if (overviewStorageKey && typeof window !== 'undefined') {
      window.localStorage.setItem(overviewStorageKey, 'true')
    }
  }

  if (hasProjectLab) {
    if (!isHydrated) {
      return <ProjectDetailSkeleton />
    }

    return (
      <main className="learning-page">
        <header className="learning-topbar">
          <div id="learning-editor-toolbar" className="learning-toolbar-slot" />
        </header>

        <section
          className="learning-layout"
          style={{ '--reader-width': `${readerWidth}px` } as CSSProperties}
        >
          <article className="article-shell" data-pagefind-body>
            {!overviewDismissed ? (
              <>
                <ProjectOverview locale={locale} onStart={startSteps} />

                <details className="lesson-extra">
                  <summary>
                    {locale === 'ar'
                      ? 'المزيد من الصورة الكبيرة'
                      : 'More big picture'}
                  </summary>
                  <div className="article-content">
                    <Content components={mdxComponents} />
                  </div>
                </details>
              </>
            ) : null}

            <div
              id="project-lab-guide-panel"
              className="article-lab-panel-slot"
              hidden={!overviewDismissed}
            />
          </article>

          <div
            aria-label="Resize lesson panel"
            aria-orientation="vertical"
            className="learning-resizer w-1 shrink-0 cursor-col-resize bg-[color-mix(in_oklab,var(--line)_70%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--control-bg)]"
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                event.preventDefault()
                adjustReader(isRtl ? 24 : -24)
              }
              if (event.key === 'ArrowRight') {
                event.preventDefault()
                adjustReader(isRtl ? -24 : 24)
              }
            }}
            onPointerDown={resizeReader}
            role="separator"
            tabIndex={0}
          />

          <aside className="learning-lab" data-pagefind-ignore>
            <ProjectLab
              projectId={article.projectLabId!}
              guidePortalId="project-lab-guide-panel"
              hideGuidePanel={!overviewDismissed}
              toolbarPortalId="learning-editor-toolbar"
            />
          </aside>
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap article-layout">
      <article className="article-shell" data-pagefind-body>
        <a href={`/${locale}#${section}`} className="back-link">
          <ArrowLeft aria-hidden="true" size={16} />
          <span>{m.nav_projects({}, { locale })}</span>
        </a>

        <header className="article-header">
          <p className="eyebrow">{m.guide_badge({}, { locale })}</p>
          <h1>{article.title}</h1>
          <p>{article.description}</p>
          <dl className="article-meta">
            <div>
              <Gauge aria-hidden="true" size={16} />
              <dt>{m.difficulty({}, { locale })}</dt>
              <dd>{article.difficulty}</dd>
            </div>
            <div>
              <CalendarDays aria-hidden="true" size={16} />
              <dt>{m.updated({}, { locale })}</dt>
              <dd>{article.updatedAt}</dd>
            </div>
            <div>
              <Tags aria-hidden="true" size={16} />
              <dt>{m.tags({}, { locale })}</dt>
              <dd>{article.tags.join(', ')}</dd>
            </div>
          </dl>
        </header>

        <div className="article-content">
          <Content components={mdxComponents} />
        </div>
      </article>

      <aside className="toc" data-pagefind-ignore>
        <p>{m.table_of_contents({}, { locale })}</p>
        <nav aria-label={m.table_of_contents({}, { locale })}>
          {article.tableOfContents.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={item.depth === 3 ? 'toc-child' : undefined}
            >
              {item.title}
            </a>
          ))}
        </nav>
      </aside>
    </main>
  )
}

function ProjectDetailSkeleton() {
  return (
    <main className="learning-page project-detail-skeleton" aria-busy="true">
      <header className="learning-topbar">
        <div className="learning-toolbar-slot">
          <div className="project-detail-skeleton-toolbar" aria-hidden="true">
            <span className="project-detail-skeleton-chip" />
            <span className="project-detail-skeleton-line is-short" />
            <span className="project-detail-skeleton-button" />
            <span className="project-detail-skeleton-button" />
            <span className="project-detail-skeleton-button is-accent" />
          </div>
        </div>
      </header>

      <section
        className="learning-layout"
        style={{ '--reader-width': '390px' } as CSSProperties}
      >
        <article className="article-shell">
          <div className="project-detail-skeleton-copy" aria-hidden="true">
            <span className="project-detail-skeleton-line is-tiny" />
            <span className="project-detail-skeleton-line is-heading" />
            <span className="project-detail-skeleton-line" />
            <span className="project-detail-skeleton-line is-wide" />
            <span className="project-detail-skeleton-card" />
            <span className="project-detail-skeleton-line is-label" />
            <span className="project-detail-skeleton-card is-small" />
            <span className="project-detail-skeleton-line is-label" />
            <span className="project-detail-skeleton-card is-short" />
          </div>
        </article>

        <div
          className="learning-resizer w-1 shrink-0 bg-[color-mix(in_oklab,var(--line)_70%,transparent)]"
          aria-hidden="true"
        />

        <aside className="learning-lab" data-pagefind-ignore>
          <div className="project-detail-skeleton-editor" aria-hidden="true">
            <div className="project-detail-skeleton-tree">
              <span className="project-detail-skeleton-line is-label" />
              <span className="project-detail-skeleton-row is-active" />
              <span className="project-detail-skeleton-row" />
              <span className="project-detail-skeleton-row" />
              <span className="project-detail-skeleton-row" />
            </div>
            <div className="project-detail-skeleton-code">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="project-detail-skeleton-side">
              <span className="project-detail-skeleton-line is-label" />
              <span className="project-detail-skeleton-card is-small" />
              <span className="project-detail-skeleton-line is-label" />
              <span className="project-detail-skeleton-card" />
            </div>
          </div>
        </aside>
      </section>
      <span className="sr-only">Loading project</span>
    </main>
  )
}

function ProjectOverview({
  locale,
  onStart,
}: {
  locale: Locale
  onStart: () => void
}) {
  const text = {
    en: {
      eyebrow: 'Before we start',
      title: 'What is the game?',
      body: 'You have two piles. Pile a starts messy. Pile b starts empty. Your program prints move words until pile a is sorted.',
      start: 'Start',
      move: 'Move words',
      done: 'Done',
      empty: 'empty',
      goal: 'Goal: sort pile a and leave pile b empty.',
      startSteps: 'Start steps',
    },
    ar: {
      eyebrow: 'قبل أن نبدأ',
      title: 'ما هي اللعبة؟',
      body: 'عندك كومتان. الكومة a تبدأ مبعثرة. الكومة b تبدأ فارغة. برنامجك يطبع كلمات حركة إلى أن تصبح الكومة a مرتبة.',
      start: 'البداية',
      move: 'كلمات حركة',
      done: 'النهاية',
      empty: 'فارغة',
      goal: 'الهدف: رتب الكومة a واترك الكومة b فارغة.',
      startSteps: 'ابدأ الخطوات',
    },
  } satisfies Record<Locale, Record<string, string>>
  const t = text[locale]

  return (
    <section className="project-overview" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <span>{t.eyebrow}</span>
      <h2>{t.title}</h2>
      <p>{t.body}</p>
      <div className="overview-story" aria-label={t.goal}>
        <div>
          <strong>{t.start}</strong>
          <MiniPile name="a" values={[3, 2, 1]} emptyLabel={t.empty} />
          <MiniPile name="b" values={[]} emptyLabel={t.empty} />
        </div>
        <div className="overview-arrow">{t.move}</div>
        <div>
          <strong>{t.done}</strong>
          <MiniPile name="a" values={[1, 2, 3]} emptyLabel={t.empty} />
          <MiniPile name="b" values={[]} emptyLabel={t.empty} />
        </div>
      </div>
      <p className="overview-goal">{t.goal}</p>
      <button className="overview-start" onClick={onStart} type="button">
        {t.startSteps}
      </button>
    </section>
  )
}

function MiniPile({
  name,
  values,
  emptyLabel,
}: {
  name: string
  values: Array<number>
  emptyLabel: string
}) {
  return (
    <div className="overview-pile">
      <span>{name}</span>
      <div>
        {values.length ? (
          values.map((value) => <b key={`${name}-${value}`}>{value}</b>)
        ) : (
          <em>{emptyLabel}</em>
        )}
      </div>
    </div>
  )
}
