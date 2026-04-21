import { createFileRoute, redirect } from '@tanstack/react-router'
import { isLocale } from '../lib/i18n'

export const Route = createFileRoute('/$locale/projects')({
  beforeLoad: ({ params }) => {
    const locale = isLocale(params.locale) ? params.locale : 'en'
    throw redirect({ href: `/${locale}#projects` })
  },
})
