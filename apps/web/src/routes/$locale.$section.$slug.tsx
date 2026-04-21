import { createFileRoute, redirect } from '@tanstack/react-router'
import { ArrowLeft, CalendarDays, Gauge, Tags } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { NotFound } from '../components/NotFound'
import { ProjectLab } from '../components/ProjectLab'
import { mdxComponents } from '../components/mdx'
import { getArticle, getArticleSummary } from '../lib/content'
import { asLocale, asSection, isLocale, isSection, type Locale } from '../lib/i18n'
import * as m from '../paraglide/messages.js'

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
            { title: `${article.title} | 42 Docs` },
            {
              name: 'description',
              content: article.description,
            },
          ]
        : [{ title: 'Not found | 42 Docs' }],
    }
  },
  component: ArticlePage,
})

function ArticlePage() {
  const { locale: localeParam, section: sectionParam } = Route.useParams()
  const locale = asLocale(localeParam)
  const section = asSection(sectionParam)
  const { slug } = Route.useParams()
  const article = getArticle(locale, section, slug)
  const [readerWidth, setReaderWidth] = useState(390)
  const [overviewDismissed, setOverviewDismissed] = useState(false)
  const overviewStorageKey = article?.projectLabId
    ? `guided-project:${article.projectLabId}:overview-seen`
    : ''

  useEffect(() => {
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
      const width = Math.round(moveEvent.clientX - bounds.left)
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
            className="learning-resizer"
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') adjustReader(-24)
              if (event.key === 'ArrowRight') adjustReader(24)
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
