import type { ComponentType } from 'react'
import type { Locale } from '../paraglide/runtime.js'
import { isLocale, isSection, type Section, type SingularSection } from './i18n'

export type ArticleMeta = {
  title: string
  description: string
  slug: string
  section: SingularSection
  difficulty: string
  tags: Array<string>
  updatedAt: string
  projectLabId?: string
  toc?: Array<TocItem>
}

export type TocItem = {
  id: string
  title: string
  depth: 2 | 3
}

export type Article = ArticleMeta & {
  locale: Locale
  pathSection: Section
  Content: ComponentType<{ components?: Record<string, unknown> }>
  tableOfContents: Array<TocItem>
  href: string
}

export type ArticleSummary = Omit<Article, 'Content'>

type ContentModule = {
  default: ComponentType<{ components?: Record<string, unknown> }>
  meta: ArticleMeta
}

const contentModules = import.meta.glob<ContentModule>(
  '../../../../content/{en,ar}/projects/*.mdx',
  { eager: true },
)

const rawModules = import.meta.glob<unknown>(
  '../../../../content/{en,ar}/projects/*.mdx',
  {
    eager: true,
    import: 'default',
    query: '?raw',
  },
)

const articles = Object.entries(contentModules)
  .map(([path, module]) => {
    const parts = path.split('/')
    const locale = parts.at(-3)
    const pathSection = parts.at(-2)

    if (!isLocale(locale) || !isSection(pathSection)) {
      throw new Error(`Invalid content path: ${path}`)
    }

    const tableOfContents =
      module.meta.toc ?? extractTableOfContents(normalizeRaw(rawModules[path]))
    const article = {
      ...module.meta,
      locale,
      pathSection,
      Content: module.default,
      tableOfContents,
      href: `/${locale}/${pathSection}/${module.meta.slug}`,
    } satisfies Article

    return article
  })
  .sort((a, b) => {
    const date = b.updatedAt.localeCompare(a.updatedAt)
    return date === 0 ? a.title.localeCompare(b.title) : date
  })

export function getArticles(locale: Locale, section?: Section) {
  return articles.filter((article) => {
    return article.locale === locale && (!section || article.pathSection === section)
  })
}

export function getArticleSummaries(locale: Locale, section?: Section) {
  return getArticles(locale, section).map(toArticleSummary)
}

export function getArticle(locale: Locale, section: Section, slug: string) {
  return articles.find((article) => {
    return (
      article.locale === locale &&
      article.pathSection === section &&
      article.slug === slug
    )
  })
}

export function getArticleSummary(
  locale: Locale,
  section: Section,
  slug: string,
) {
  const article = getArticle(locale, section, slug)
  if (!article) return undefined

  return toArticleSummary(article)
}

function toArticleSummary(article: Article) {
  const summary = { ...article } as Partial<Article>
  delete summary.Content
  return summary as ArticleSummary
}

export function getFeaturedArticles(locale: Locale) {
  return getArticleSummaries(locale, 'projects').slice(0, 3)
}

export function getAllArticlePaths() {
  return articles.map((article) => article.href)
}

function extractTableOfContents(source: string) {
  return source
    .split('\n')
    .map((line) => line.match(/^(#{2,3})\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => {
      const title = match[2].replace(/[`*_]/g, '').trim()
      return {
        id: slugify(title),
        title,
        depth: match[1].length as 2 | 3,
      }
    })
}

function normalizeRaw(value: unknown) {
  if (typeof value === 'string') return value
  if (
    value &&
    typeof value === 'object' &&
    'default' in value &&
    typeof value.default === 'string'
  ) {
    return value.default
  }
  return ''
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
