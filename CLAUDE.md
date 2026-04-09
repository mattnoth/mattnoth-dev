# matt-site — Claude Code project guide

## What this is

A personal dev website for publishing tech articles and project showcases, built with **vanilla TypeScript, native modern CSS, and a custom esbuild-driven build**. Zero framework runtime. Output is static HTML/CSS deployed to Netlify's free tier.

**Author:** Matt. First-person authentic voice in content.

---

## Stack (locked in — do not propose alternatives)

| Layer | Choice |
|-------|--------|
| Language | TypeScript 5.8+ |
| Styling | Native CSS (no Sass, no PostCSS, no CSS-in-JS) |
| Content | Markdown + frontmatter (gray-matter, marked) |
| Bundler | esbuild |
| Type check | `tsc --noEmit` (separate from emit) |
| Build scripts | Custom TS via `tsx` |
| Dev server | esbuild `serve` + `watch` |
| Hosting | Netlify free tier |

**Hard rules:** no React, no Vue, no framework runtime, no Sass, no Tailwind, no CSS-in-JS, no `any`, no enums, no namespaces.

---

## Modern TypeScript rules

- Target ES2022 for browser, Node16 for build scripts.
- Use `satisfies` to validate config without widening.
- Use `import type` / `export type` everywhere for type-only imports (`verbatimModuleSyntax: true` is on).
- `erasableSyntaxOnly: true` — no enums, namespaces, parameter properties. Use `as const` objects instead.
- Use `Object.groupBy()`, `Map.groupBy()`, new `Set` methods (`union`, `intersection`, `difference`) where they fit.
- Template literal types for route paths / CSS class names where it adds safety.
- `<const T>(value: T)` for narrower inference.
- Never use `any`. Use `unknown` + narrowing when truly dynamic.

## Modern CSS rules

- Native CSS nesting: `.card { & h3 { … } &:hover { … } }`.
- `@layer reset, tokens, typography, layout, components, animations, utilities;` at the top of `main.css`. Every rule lives inside a layer. No specificity wars, no `!important`.
- Colors: `oklch()` and `color-mix(in oklch, …)`. No hex, no `rgb()`, no named colors in new code.
- Design tokens as CSS custom properties on `:root`.
- `:has()` for parent-aware styling where it replaces JS.
- Container queries (`container-type: inline-size` + `@container`) over media queries for component-scoped responsive behavior.
- Logical properties: `margin-inline`, `padding-block`, `inline-size`, `block-size`.
- `dvh` / `svh` / `lvh` units for viewport sizing.
- Scroll-driven animations via `animation-timeline: view()` behind `@supports`.
- `@media (prefers-reduced-motion: reduce)` always present.
- Mobile-first: base styles for mobile, enhance with container/media queries.

---

## Directory ownership

Each directory is owned by exactly one specialist subagent. The main agent delegates — it does not write in these directories directly unless the specialist subagent is unavailable.

| Directory | Owner | Never touched by |
|-----------|-------|------------------|
| `build/` | `build-specialist` | anyone else |
| `src/styles/` | `css-specialist` | anyone else |
| `src/ts/` | `ts-specialist` | anyone else |
| `src/templates/` | `content-specialist` | anyone else |
| `src/content/` | `content-specialist` | anyone else |
| `docs/progress.md` | `progress-tracker` (only via `/end-session`) | you, during work |
| `docs/knowledge-base.md` | `progress-tracker` (appends) | anyone mid-session |
| `docs/decisions.md` | `progress-tracker` (appends) | anyone mid-session |
| Root config (`package.json`, `tsconfig*.json`, `netlify.toml`) | `build-specialist` | anyone else |

The `reviewer` subagent is read-only — it runs builds, checks output, reports issues, but never writes code.

---

## Session workflow

**Starting a session:**
1. Run `/start-session`. This reads `docs/progress.md` + this file and reports current phase status + next steps.
2. If starting a new phase, read `docs/prompts/0X-*.md` for that phase.
3. Delegate implementation work to the appropriate specialist subagent.

**Ending a session:**
1. Run `/end-session` (or say "prepare to end session").
2. The `progress-tracker` subagent updates `docs/progress.md`, appends to `docs/knowledge-base.md` and `docs/decisions.md` as needed.
3. Never hand-edit `docs/progress.md` during a session — let the tracker own that file's format.

**Between sessions:** everything important lives in `docs/`. Memory pointers in `~/.claude/projects/-Users-mnoth-source-mattnoth-dev/memory/` remind future sessions to read these files.

---

## Phase roadmap

- **Phase 0** — Meta setup (this file, subagents, slash commands, docs skeletons). *Completed in the setup session.*
- **Phase 1** — Project scaffold & config → `docs/prompts/01-scaffold.md`
- **Phase 2** — Build system → `docs/prompts/02-build-system.md`
- **Phase 3** — CSS architecture → `docs/prompts/03-css.md`
- **Phase 4** — TypeScript interactive modules → `docs/prompts/04-ts-modules.md`
- **Phase 5** — Content & templates → `docs/prompts/05-content.md`
- **Phase 6** — Integration, polish, deploy → `docs/prompts/06-polish-deploy.md`

Each phase is a single Claude Code session. Do not merge phases.

---

## Voice & content rules

- First person, authentic. This is Matt's site, not a corporate blog.
- No lorem ipsum. No placeholder "John Doe" content.
- Color palette must be **distinctive and non-generic**. Do not default to purple gradients, Inter, Roboto, or Space Grotesk. Pick something with personality.
- Code examples in articles should be real, not contrived.

---

## When in doubt

- Prefer the simpler solution. Vanilla before library.
- Prefer CSS over JS for visuals and state toggling.
- Prefer build-time work over runtime work.
- Prefer progressive enhancement (`@supports`, feature detection) over polyfills.
- Ask before adding any runtime dependency. Build-time deps are easier to justify.
