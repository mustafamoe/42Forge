# 42 Field Notes Web

Localized docs-first site for 42 project and exam explanations.

## Stack

- Bun workspaces with Turborepo
- TypeScript, React 19, TanStack Start, TanStack Router
- HeroUI v3, Tailwind CSS v4, lucide-react
- MDX with custom article primitives
- Paraglide JS for English and Arabic i18n
- Pagefind for multilingual static search

## Commands

Run commands from the repository root:

```bash
bun install
bun run dev
bun run typecheck
bun run test
bun run build
```

The web app lives in `apps/web`. Content lives at the repo root in `content`.

## Content

Articles are authored as MDX:

```txt
content/en/projects/*.mdx
content/ar/projects/*.mdx
content/en/exams/*.mdx
content/ar/exams/*.mdx
```

Each article exports `meta` with:

- `title`
- `description`
- `slug`
- `section`
- `difficulty`
- `tags`
- `updatedAt`
- `solutionStyle`

The app ships sample English and Arabic articles for guided, spoiler, and
reference solution styles.

## i18n

Routes are locale-prefixed:

- `/en`
- `/ar`

Arabic pages render with `lang="ar"` and `dir="rtl"`. UI strings live in
Paraglide messages under `messages`.

## Search

`bun run build` prerenders localized routes and runs Pagefind against
`.output/public`. Article pages use `data-pagefind-body`, so the search index
stays focused on explanation content.
