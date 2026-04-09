---
title: "Building This Site with Vanilla TS and Modern CSS"
slug: "building-this-site"
date: "2026-04-07"
tags: ["typescript", "css", "static-site"]
description: "Why I ditched React and built my personal site with zero framework runtime."
draft: false
---

I've built personal sites on WordPress, then Jekyll, then Gatsby, then Next.js. Each migration felt like progress — until I sat down to write a new post and spent 45 minutes fighting hydration errors before giving up for the night. At some point the framework stopped being the tool and started being the job.

So I blew it up. No React. No Sass. No bundler config that needs its own README. Just TypeScript build scripts, native CSS, and Markdown files that get turned into HTML at build time.

## The build system is the fun part

The whole pipeline is about 300 lines of TypeScript in a `build/` directory. esbuild handles the browser assets. A handful of build scripts handle the static site generation: read Markdown, parse frontmatter with `gray-matter`, run it through `marked`, slot the HTML into templates, write files.

The template engine is maybe 50 lines — `{{slot_name}}` replacements with a regex, stubs detected as comment-only files, a cache map to avoid re-reading templates during watch mode. No dependencies. I wrote it in an afternoon.

One thing that bit me: `tsconfig.extends` does not merge `include` arrays. My build tsconfig extends the root tsconfig, but I had to explicitly add `"include": ["build/**/*"]` or the build scripts wouldn't be typechecked at all. The kind of thing you hit once and never forget.

## CSS without Sass

The CSS layer that would've been Sass in 2019 is just native CSS now. I'm using `@layer` to enforce specificity order, `oklch()` for colors, native nesting everywhere, and container queries instead of media queries for component-level responsive behavior.

```css
.card {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);

  & .card__title {
    font-family: var(--font-heading);
    transition: color var(--duration-fast) ease;
  }

  &:hover .card__title {
    color: var(--color-accent);
  }
}
```

That's it. No `&__title` hack, no preprocessor, no compiled output to debug. The nesting spec is in every evergreen browser and it reads exactly like what it does.

One gotcha I hit: I had design rationale comments at the top of my CSS partials, before the `@layer` block. The build pipeline's stub-detection checks if a file starts with `/*` and skips it. Two files were silently dropped from the output before I caught it. Comments now live inside the layer block.

## TypeScript module pattern

On the JS side, I wanted progressive enhancement — the CSS handles animations natively where supported, the JS fills in where it doesn't. Each interactive element gets a `data-module` attribute, and a small bootstrap in `main.ts` dynamically imports the matching module.

```typescript
const modules = {
  nav: () => import('./modules/nav'),
  'theme-toggle': () => import('./modules/theme-toggle'),
  'scroll-reveal': () => import('./modules/scroll-reveal'),
  carousel: () => import('./modules/carousel'),
} as const satisfies Record<string, () => Promise<{ mount: (el: HTMLElement) => void }>>;
```

The `satisfies` keyword does real work here — it validates the shape of the registry without widening the keys to `string`. If I add a new key that doesn't match the value type, `tsc` tells me at the point of definition rather than somewhere downstream.

Total JS output: 2.5 KB gzipped. CSS: 5.5 KB. Build time: under a second. I got a Lighthouse 100 on the first run, which I'm taking as a sign that the approach is at least not wrong.
