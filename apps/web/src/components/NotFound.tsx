import { Link } from '@tanstack/react-router'
import { Compass } from 'lucide-react'
import * as m from '../paraglide/messages.js'

export function NotFound() {
  return (
    <main className="page-wrap narrow-page">
      <section className="empty-state">
        <Compass aria-hidden="true" size={34} />
        <h1>{m.not_found_title()}</h1>
        <p>{m.not_found_body()}</p>
        <Link to="/" className="text-link">
          42Forge
        </Link>
      </section>
    </main>
  )
}
