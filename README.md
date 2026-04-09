# mattnoth.dev

My personal dev site — articles and projects. Zero framework runtime; everything is static HTML, native CSS, and vanilla TypeScript, built with a custom esbuild pipeline and deployed to Netlify.

## Why vanilla TS + native CSS

Modern CSS (nesting, `@layer`, `:has()`, container queries, `oklch()`, scroll-driven animations) and modern TypeScript (`satisfies`, `verbatimModuleSyntax`, `erasableSyntaxOnly`) have closed the gap with the framework-plus-preprocessor stacks I used to reach for. Skipping that machinery buys smaller bundles, faster builds, and Lighthouse 100 without trying.

## Stack

| Layer         | Choice                                                 |
| ------------- | ------------------------------------------------------ |
| Language      | TypeScript 5.8+, target ES2024                         |
| Styling       | Native CSS — no Sass, no PostCSS, no CSS-in-JS         |
| Content       | Markdown + frontmatter (`gray-matter`, `marked`)       |
| Bundler       | esbuild (dev serve + watch, prod bundle)               |
| Type check    | `tsc --noEmit` (separate from emit)                    |
| Build scripts | Custom TypeScript run via `tsx`                        |
| Hosting       | Netlify free tier                                      |

## Getting started

Requires Node 22+ (LTS).

```sh
git clone https://github.com/mattnoth/mattnoth-dev.git
cd mattnoth-dev
npm install
npm run dev
```

Dev server runs on `http://localhost:3000` with live reload on `.ts`, `.css`, `.html`, and `.md` changes.

## Available scripts

| Script              | What it does                                                       |
| ------------------- | ------------------------------------------------------------------ |
| `npm run dev`       | esbuild serve + watch; rebuilds CSS/pages on file changes          |
| `npm run build`     | Typecheck both tsconfigs, then produce `dist/` for deploy          |
| `npm run typecheck` | Run `tsc --noEmit` against both browser and build tsconfigs        |
| `npm run clean`     | Remove `dist/`                                                     |

## Adding content

Articles and projects are markdown files under `src/content/`. The build parses them, renders body markdown to HTML, and generates one page per file plus list pages.

**New article** — create `src/content/articles/my-post.md`:

```md
---
title: My post title
slug: my-post
date: 2026-04-09
description: One-sentence summary used in OG tags and card previews.
tags: [typescript, css]
---

Your post body in markdown. Code fences, links, images all work.
```

**New project** — create `src/content/projects/my-project.md`:

```md
---
title: My project
slug: my-project
description: One-sentence summary.
tech: [typescript, esbuild]
url: https://example.com
github: https://github.com/mattnoth/my-project
featured: true
---

Project body in markdown.
```

Then `npm run build`. Both list pages and individual pages are regenerated.

## Deployment

Push to GitHub — Netlify's GitHub integration rebuilds and deploys on every push to `main`. Build config is in [netlify.toml](netlify.toml): runs `npm run build`, publishes `dist/`, sets cache headers and security headers.

No environment variables, no secrets. The entire deploy artifact is the `dist/` directory, which can also be dragged into the Netlify dashboard for instant deploy.

## Architecture

```
mattnoth-dev/
├── build/                   # Node-target TS build pipeline (tsx)
│   ├── build.ts             # Entry: runBuild / runDev
│   ├── markdown.ts          # Parse frontmatter + render body
│   ├── pages.ts             # Slot → template → HTML
│   ├── templates.ts         # {{slot}} replacement
│   ├── sitemap.ts           # Generate dist/sitemap.xml
│   └── copy-assets.ts       # CSS concat + static file copy
├── src/
│   ├── ts/                  # Browser-side TS modules
│   │   ├── main.ts          # Entry point
│   │   ├── modules/         # nav, theme-toggle, scroll-reveal, carousel
│   │   └── utils/dom.ts     # Typed DOM helpers
│   ├── styles/              # Native CSS, @layer-organized
│   │   ├── main.css         # @layer declaration order
│   │   ├── reset.css
│   │   ├── tokens.css       # Design tokens (oklch colors, spacing, typography)
│   │   ├── typography.css
│   │   ├── layout.css
│   │   ├── nav.css
│   │   ├── components.css   # Cards, buttons, carousel, article/project chrome
│   │   └── animations.css   # Reveal + keyframes
│   ├── templates/           # HTML with {{slot}} placeholders
│   │   ├── base.html        # Site shell (head, nav, footer)
│   │   ├── home.html
│   │   ├── article.html
│   │   ├── article-list.html
│   │   ├── project.html
│   │   └── project-list.html
│   ├── content/             # Markdown articles and projects
│   │   ├── articles/
│   │   └── projects/
│   ├── assets/              # Copied verbatim to dist/assets/
│   ├── favicon.svg          # Site icon
│   └── robots.txt           # Allow all + sitemap pointer
├── dist/                    # Build output (gitignored, deployed)
├── docs/                    # Phase prompts, progress, knowledge base
├── netlify.toml             # Netlify build + headers config
├── tsconfig.json            # Browser tsconfig (ES2024, bundler resolution)
├── tsconfig.build.json      # Build-script tsconfig (NodeNext)
└── package.json
```

## Hard rules

No React, no Vue, no framework runtime, no Sass, no Tailwind, no CSS-in-JS, no `any`, no enums, no namespaces. Modern language features are fair game — the "minimal" philosophy targets runtime dependencies, not syntax.
