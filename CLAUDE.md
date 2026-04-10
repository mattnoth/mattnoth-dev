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

- **Target ES2024 for both browser and build scripts.** Browser code runs in evergreen Chrome/Safari/Firefox; build scripts run under Node 22+ (LTS) on your machine. No downleveling needed for either.
- `module: ESNext` + `moduleResolution: bundler` for browser code (esbuild is the bundler).
- `module: NodeNext` + `moduleResolution: NodeNext` for build scripts.
- Use `satisfies` to validate config without widening.
- Use `import type` / `export type` everywhere for type-only imports (`verbatimModuleSyntax: true` is on).
- `erasableSyntaxOnly: true` — no enums, namespaces, parameter properties. Use `as const` objects instead.
- `noUncheckedIndexedAccess: true` — flags unsafe array/object index access.
- Use `Object.groupBy()`, `Map.groupBy()`, new `Set` methods (`union`, `intersection`, `difference`), `Promise.withResolvers()` where they fit.
- Template literal types for route paths / CSS class names where it adds safety.
- `<const T>(value: T)` for narrower inference.
- Never use `any`. Use `unknown` + narrowing when truly dynamic.

**Philosophy clarification:** the "keep it minimal" rule of this project targets **runtime dependencies and frameworks** (no React, no Sass, no CSS-in-JS, no Tailwind). It does NOT mean "avoid modern language features". Use the latest TypeScript and latest ES* APIs freely — they're zero-cost at runtime.

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
1. Run `/start-session` (defined at `.claude/skills/start-session/SKILL.md`). This reads `docs/progress.md` + this file and reports current phase status + next steps.
2. If starting a new phase, read `docs/prompts/0X-*.md` for that phase.
3. Delegate implementation work to the appropriate specialist subagent.

**Ending a session:**
1. Run `/end-session` (defined at `.claude/skills/end-session/SKILL.md`) or say "prepare to end session".
2. The `progress-tracker` subagent updates `docs/progress.md`, appends to `docs/knowledge-base.md` and `docs/decisions.md` as needed.
3. Never hand-edit `docs/progress.md` during a session — let the tracker own that file's format.

**Between sessions:** everything important lives in `docs/`. Memory pointers in `~/.claude/projects/-Users-mnoth-source-mattnoth-dev/memory/` remind future sessions to read these files.

**Note on skills vs commands:** `/start-session` and `/end-session` live in `.claude/skills/<name>/SKILL.md` (not `.claude/commands/`). The skills layout has live change detection — edits are picked up mid-session without restarting.

---

## Phase execution rules

The main agent is responsible for orchestration before delegation. Before the first specialist delegation of any phase:

1. **Vocabulary reconciliation.** Check `docs/progress.md` open questions for unresolved drift in shared vocabulary (CSS class names, `data-*` attributes, slot names, module keys). If drift exists and the current phase will use that vocabulary, reconcile it as the **first** delegation of the phase — not after templates or modules trip over it.
2. **Slot-and-class contract pre-flight.** For any phase that touches templates, shared components, or component styling, read BOTH sides of every contract before delegating:
   - **Slot contract.** The template spec (what slots the template will reference) **and** the current slot producer (usually `build/pages.ts`). Produce a written slot-gap list.
   - **Class contract.** The HTML producer (templates in `src/templates/` AND any HTML emitted by template literals in `build/pages.ts`) **and** the CSS that styles it (`src/styles/*.css`). Enumerate exactly which classes the HTML emits, then verify each one is defined in CSS — and flag any CSS class selectors that target classes the HTML never emits. Produce a written class-gap list.

   Missing slots or class gaps become delegations (usually to `build-specialist` or `css-specialist`) that run **before or in parallel with** the work that depends on them, not after. This rule exists because vocabulary drift has bitten this project multiple times — see `docs/knowledge-base.md` (Phase 3/4 reveal classes, Phase 5 slot reuse, Phase 3/6 card classes). The `build/lint-classes.ts` step in the build pipeline is the mechanical backstop; this rule is the human-scale prevention.
3. **Dependency graph.** Write a short dependency graph naming the specialists involved and which deliverables block which. Commit to the ordering before the first delegation. If the graph is wrong, that's visible immediately — if there's no graph, problems only surface in the reviewer audit.

Delegation constraints:

- **CSS class constraint.** Any brief to `content-specialist` or any template-writing work (including template-literal HTML in `build/pages.ts`) must include: "Use only CSS classes already defined in `src/styles/`. If you need a new class, flag it in your report for `css-specialist` follow-up — do not invent classes on the fly." Conversely, any brief to `css-specialist` that introduces new classes must name the HTML producer that will consume them, and that producer must be updated in the same phase.

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

- First person, authentic. This is Matt's site, not a corporate blog. **This applies to deploy-ready content only — Matt writes the real articles.**
- **No lorem ipsum in deploy-ready content.** Scaffolding phases use clearly-labeled lorem ipsum with real frontmatter; Claude never writes prose in Matt's voice. The "authentic voice" guarantee is a deploy-time rule, not a scaffolding-time rule.
- Color palette must be **distinctive and non-generic**. Do not default to purple gradients, Inter, Roboto, or Space Grotesk. Pick something with personality.
- Code examples in articles should be real, not contrived.

---

## When in doubt

- Prefer the simpler solution. Vanilla before library.
- Prefer CSS over JS for visuals and state toggling.
- Prefer build-time work over runtime work.
- Prefer progressive enhancement (`@supports`, feature detection) over polyfills.
- Ask before adding any runtime dependency. Build-time deps are easier to justify.
