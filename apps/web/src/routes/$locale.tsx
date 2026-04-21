import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { isLocale } from '../lib/i18n'

export const Route = createFileRoute('/$locale')({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale)) {
      throw redirect({ href: '/en' })
    }
  },
  component: LocaleLayout,
})

function LocaleLayout() {
  return <Outlet />
}
