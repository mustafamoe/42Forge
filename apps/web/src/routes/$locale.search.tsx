import { createFileRoute, redirect } from '@tanstack/react-router'
import { isLocale } from '../lib/i18n'

export const Route = createFileRoute('/$locale/search')({
  beforeLoad: ({ params }) => {
    throw redirect({ href: isLocale(params.locale) ? `/${params.locale}` : '/en' })
  },
})
