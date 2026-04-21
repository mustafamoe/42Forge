import { Link, createFileRoute } from '@tanstack/react-router'
import {
  CheckCircle2,
  FileTerminal,
  ListChecks,
  Search,
  TerminalSquare,
} from 'lucide-react'
import { ArticleGrid } from '../components/ArticleCard'
import Header from '../components/Header'
import { getArticleSummaries } from '../lib/content'
import { asLocale } from '../lib/i18n'
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
  const isArabic = locale === 'ar'

  const pathSteps = [
    {
      icon: FileTerminal,
      title: isArabic ? 'اقرأ المطلوب' : m.guided_step_one({}, { locale }),
      text: isArabic
        ? 'افهم القيود، المدخلات، وحالات الفشل قبل كتابة الحل.'
        : 'Understand constraints, inputs, and failure cases before writing the solution.',
    },
    {
      icon: TerminalSquare,
      title: isArabic ? 'ابن الأساس' : m.guided_step_two({}, { locale }),
      text: isArabic
        ? 'قسّم المشروع إلى parser، منطق، اختبارات، وحالات طرفية.'
        : 'Split the project into parser, core logic, tests, and edge cases.',
    },
    {
      icon: CheckCircle2,
      title: isArabic ? 'اختبر مثل التقييم' : m.guided_step_three({}, { locale }),
      text: isArabic
        ? 'شغّل أوامر تحقق قريبة من التصحيح الحقيقي قبل التسليم.'
        : 'Run evaluator-style checks before submitting or defending the work.',
    },
  ]

  return (
    <>
      <Header />
      <main className="home-page">
        <section className="section-block page-wrap" id="projects">
          <div className="section-heading with-icon">
            <ListChecks aria-hidden="true" size={30} />
            <div>
              <p className="eyebrow">
                {m.all_projects({}, { locale })}
              </p>
              <h2>
                {isArabic ? 'اختر مشروعك وابدأ البناء.' : 'Pick a project and start building.'}
              </h2>
            </div>
          </div>
          <ArticleGrid articles={projects} locale={locale} />
        </section>

        <section className="section-block page-wrap" id="exam-track">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">
                {isArabic ? 'مسار الدراسة' : 'Study path'}
              </p>
              <h2>
                {isArabic ? 'طريقة واحدة لكل مشروع وامتحان.' : 'One flow for every project and exam.'}
              </h2>
            </div>
            <Link to="/$locale/search" params={{ locale }} className="secondary-link">
              <Search aria-hidden="true" size={17} />
              <span>{m.search_title({}, { locale })}</span>
            </Link>
          </div>
          <div className="style-comparison">
            {pathSteps.map((item) => (
              <article key={item.title} className="style-card">
                <item.icon aria-hidden="true" size={24} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
