import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpenCheck } from 'lucide-react'
import type { ArticleSummary } from '../lib/content'
import type { Locale } from '../paraglide/runtime.js'
import * as m from '../paraglide/messages.js'

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <article className="article-card" data-pagefind-ignore>
      <div className="article-card-top">
        <span className="style-badge">
          <BookOpenCheck aria-hidden="true" size={15} />
          {m.guide_badge({}, { locale: article.locale })}
        </span>
        <span className="difficulty-pill">{article.difficulty}</span>
      </div>
      <h2>{article.title}</h2>
      <p>{article.description}</p>
      <div className="tag-row">
        {article.tags.slice(0, 3).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <Link
        to="/$locale/$section/$slug"
        params={{
          locale: article.locale,
          section: article.pathSection,
          slug: article.slug,
        }}
        className="card-link"
      >
        <span>{article.locale === 'ar' ? 'اقرأ الشرح' : 'Read note'}</span>
        <ArrowRight aria-hidden="true" size={16} />
      </Link>
    </article>
  )
}

export function ArticleGrid({
  articles,
  locale,
}: {
  articles: Array<ArticleSummary>
  locale: Locale
}) {
  if (articles.length === 0) {
    return (
      <div className="empty-state">
        <h2>{m.empty_title({}, { locale })}</h2>
        <p>{m.empty_body({}, { locale })}</p>
      </div>
    )
  }

  return (
    <div className="article-grid" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {articles.map((article) => (
        <ArticleCard key={article.href} article={article} />
      ))}
    </div>
  )
}
