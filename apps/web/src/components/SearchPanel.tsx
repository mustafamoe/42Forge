import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { Locale } from '../lib/i18n'

type PagefindModule = {
  search: (
    query: string,
    options?: { filters?: Record<string, string> },
  ) => Promise<{
    results: Array<{
      id: string
      data: () => Promise<{
        url: string
        meta: { title?: string }
        excerpt: string
      }>
    }>
  }>
}

type SearchResult = {
  id: string
  title: string
  url: string
  excerpt: string
}

export function SearchPanel({
  locale,
  placeholder,
  unavailable,
}: {
  locale: Locale
  placeholder: string
  unavailable: string
}) {
  const [query, setQuery] = useState('')
  const [pagefind, setPagefind] = useState<PagefindModule | null>(null)
  const [results, setResults] = useState<Array<SearchResult>>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'missing'>(
    'idle',
  )

  useEffect(() => {
    let mounted = true

    const loadPagefind = new Function(
      'path',
      'return import(path)',
    ) as (path: string) => Promise<PagefindModule>

    loadPagefind('/pagefind/pagefind.js')
      .then((module) => {
        if (mounted) {
          setPagefind(module as PagefindModule)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (mounted) {
          setStatus('missing')
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let stale = false

    if (!pagefind || query.trim().length < 2) {
      setResults([])
      return
    }

    setStatus('loading')
    pagefind
      .search(query.trim())
      .then(async (response) => {
        const hydrated = await Promise.all(
          response.results.map(async (result) => {
            const data = await result.data()
            return {
              id: result.id,
              title: data.meta.title ?? data.url,
              url: data.url,
              excerpt: data.excerpt,
            }
          }),
        )

        if (!stale) {
          setResults(
            hydrated
              .filter((result) => result.url.startsWith(`/${locale}/`))
              .slice(0, 8),
          )
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!stale) {
          setStatus('missing')
        }
      })

    return () => {
      stale = true
    }
  }, [locale, pagefind, query])

  const helper = useMemo(() => {
    if (status === 'missing') return unavailable
    if (status === 'loading') return 'Searching...'
    return null
  }, [status, unavailable])

  return (
    <section className="search-panel">
      <label className="search-box">
        <Search aria-hidden="true" size={20} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          type="search"
        />
      </label>
      {helper ? <p className="search-helper">{helper}</p> : null}
      <div className="search-results">
        {results.map((result) => (
          <a key={result.id} href={result.url} className="search-result">
            <strong>{result.title}</strong>
            <span dangerouslySetInnerHTML={{ __html: result.excerpt }} />
          </a>
        ))}
      </div>
    </section>
  )
}
