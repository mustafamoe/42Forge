# 42Forge

42Forge is a bilingual learning site for 42 students. It collects project notes,
exam prep, evaluator-style practice, and guided project labs that focus on
understanding the work instead of copying final answers.

The current guide starts with `push_swap`, including a step-by-step project lab
for parsing, stack operations, small sorts, larger sorting strategy, and checks
that feel close to a real evaluation.

## Live Project

- Repository: https://github.com/mustafamoe/42Forge
- Suggestions and fixes: https://github.com/mustafamoe/42Forge/issues/new

Use GitHub issues to suggest:

- fixes for mistakes or unclear explanations
- more details for an existing guide
- new 42 projects
- exam practice topics
- better evaluator-style checks

Pull requests are welcome too.

## Stack

- Bun workspaces with Turborepo
- React 19 and TypeScript
- TanStack Start and TanStack Router
- Tailwind CSS v4 and HeroUI
- MDX content
- Paraglide JS for English and Arabic localization

## Getting Started

Install dependencies:

```bash
bun install
```

Run the web app:

```bash
bun run dev
```

The app usually starts at `http://localhost:3000`. If that port is busy, Vite
will choose the next available port.

## Useful Commands

```bash
bun run dev
bun run typecheck
bun run test
bun run build
```

## Project Layout

```txt
apps/web/          Web application
content/en/        English MDX content
content/ar/        Arabic MDX content
messages/          Localized UI strings
project.inlang/    Paraglide project settings
```

## Content

Project guides live in:

```txt
content/en/projects/
content/ar/projects/
```

Each article is an MDX file with exported metadata such as title, description,
slug, section, difficulty, tags, and update date.

## Localization

Routes are locale-prefixed:

- `/en`
- `/ar`

Arabic pages render right-to-left. UI translations live in `messages/en.json`
and `messages/ar.json`.

## Contributing

If you find something wrong or want to add a project, exam topic, or extra
explanation, open an issue:

https://github.com/mustafamoe/42Forge/issues/new

Please include the topic, what should change, and any useful links or examples.
