# matt-site decisions log

ADR-lite. Each entry is a dated decision with context, the choice made, and consequences. The `progress-tracker` subagent appends to this file at the end of sessions where a non-obvious decision was made. Do not hand-edit during work sessions.

Only log decisions that are **non-obvious or reversible**. "We used TypeScript" is not decision-worthy. "We rejected Shiki in favor of no syntax highlighting for Phase 1 to shorten the critical path" is.

---

## 2026-04-09 — Use Claude Code subagents for domain isolation, not parallelism
**Context:** Matt is new to Claude Code and wanted to try subagents on this project. The 6-prompt build chain could be run as one big session or as 6 sessions with specialized subagents per domain.
**Decision:** Six specialist subagents (`build-specialist`, `css-specialist`, `ts-specialist`, `content-specialist`, `reviewer`, `progress-tracker`) scoped to single directories with forbidden-directory rules. Phases run sequentially, one per Claude Code session.
**Consequences:** Enforces separation of concerns via tooling, not discipline — the CSS agent cannot touch TypeScript because its system prompt forbids it and its tool access is narrow. Cost: more files to maintain in `.claude/agents/`. Benefit: future phases stay clean even when the main context is deep.

## 2026-04-09 — In-repo docs/ + memory pointers for growing context
**Context:** Need a persistent, growing knowledge base + progress tracker that survives session boundaries without bloating active context.
**Decision:** Source of truth is `docs/progress.md`, `docs/knowledge-base.md`, `docs/decisions.md` committed to the repo. Claude Code memory (`~/.claude/projects/.../memory/`) holds only pointers telling future sessions to read these files.
**Consequences:** Docs are portable (GitHub-visible, machine-transferable, greppable, version-controlled). Memory stays small and focused. Cost: the workflow depends on `/end-session` being run religiously — if it's skipped, `progress.md` drifts from reality.

## 2026-04-09 — Package manager: npm over yarn
**Context:** The project has ~6 devDeps. Choosing between npm and yarn (Classic vs Berry) before any install.
**Decision:** npm.
**Consequences:** Node 22 npm is fast enough for this tree size. Yarn Berry vs Classic is extra cognitive load with no payoff here. Netlify defaults to npm, so staying on npm avoids one config drift risk. If the dep tree grows substantially, revisit.

## 2026-04-09 — Single `dev` script entry point, flag-based
**Context:** Phase 2 needs a dev server (esbuild `ctx.serve()` + `ctx.watch()`) in addition to the production build path.
**Decision:** `dev` script is `tsx build/build.ts --dev`. No separate `build/dev.ts`. Phase 2 will branch on the `--dev` flag inside `build/build.ts`.
**Consequences:** One entry point to maintain. The flag-check is a small amount of branching logic inside `build.ts`. Rules out a clean `dev.ts` / `build.ts` separation if the two paths ever diverge significantly — acceptable trade-off for now.

## 2026-04-09 — `build` script gates on typecheck
**Context:** The production build script needs to not ship type errors silently.
**Decision:** `"build": "tsc --noEmit && tsx build/build.ts"`. Typecheck must pass before esbuild runs.
**Consequences:** Production builds fail fast on type errors. Local `npm run build` is slightly slower than `tsx build/build.ts` alone. `npm run typecheck` is still available as the standalone check.

## 2026-04-09 — Single-agent scaffold pass for Phase 1
**Context:** CLAUDE.md enforces strict directory ownership (4 specialists own `src/styles/`, `src/ts/`, `src/templates/`, `src/content/` respectively). Phase 1 only creates empty stubs in those directories.
**Decision:** `build-specialist` took the full Phase 1 skeleton in one pass, including empty stubs in other specialists' directories.
**Consequences:** Pragmatic for Phase 1 since writing empty `.gitkeep` files and HTML shells doesn't constitute real domain work. Real code in those directories starts in Phases 3–5 and must go through the correct specialist. Sets a precedent to watch — do not let this pattern bleed into phases where real code is written.

## 2026-04-09 — `noEmit: true` duplicated in `tsconfig.build.json`
**Context:** `tsconfig.build.json` extends root `tsconfig.json` which already sets `noEmit: true`. The field was explicitly repeated in the extended config.
**Decision:** Keep the explicit duplication.
**Consequences:** Protects against accidental emit if someone edits the base config later and removes `noEmit`. Slight redundancy is worth the safety. No other consequences.

## 2026-04-09 — `pretty_urls` + `[[redirects]]` fallback in `netlify.toml` (deferred review)
**Context:** `netlify.toml` has both `pretty_urls = true` under `[build.processing]` and a `[[redirects]]` catch-all rule. These may be redundant.
**Decision:** Leave both in for now. Deferred trimming to Phase 6 polish once we can test routing on a real deploy.
**Consequences:** Possible redundant config with no runtime harm. Must revisit in Phase 6 or first deploy.

## 2026-04-09 — Defer syntax highlighting (Shiki) until after Phase 1 ships
**Context:** The original outline doesn't include syntax highlighting for code blocks in articles. Shiki would do this at build time (zero client JS) with ~10 lines of code in `build/markdown.ts`.
**Decision:** Leave it out of Phases 1-6. Add it as the first post-launch enhancement once the rest of the site is live.
**Consequences:** Code blocks in early articles render as flat monospace text — readable but visually plain. Easy to add later without touching any other code. No rush.

## 2026-04-09 — Production sourcemaps always on
**Context:** Phase 2 prompt listed sourcemap as a core esbuild option alongside minify, but the `--dev` flag bullet read as dev-only enablement. Ambiguous spec.
**Decision:** Sourcemaps on in both dev and prod (`build/build.ts` calls `stepJs` with sourcemap=true unconditionally).
**Consequences:** This is a personal site with a public GitHub repo — the "information disclosure" tradeoff is zero. Prod debugging gets real file/line numbers instead of `main.js:1:N`. Adds a few KB to each Netlify deploy. Do not reconsider unless the codebase becomes proprietary.

## 2026-04-09 — Stub detection in templates and CSS concat for phase-gated builds
**Context:** Phase 1 left comment-only HTML templates and `/* */`-only CSS partials as placeholders. Running the Phase 2 build against them would either crash or emit empty pages.
**Decision:** `build/templates.ts` treats any template whose content is an HTML comment with no `{{slot}}` markers as not-yet-implemented and skips page generation. `concatCss` skips CSS files whose trimmed content starts with `/*`.
**Consequences:** The build pipeline runs green against Phase 1 empty shells. Phases 3 and 5 will be picked up automatically once real content replaces the stubs — no build changes needed. Watch for accidentally skipping a file that should be included but looks like a stub.

## 2026-04-09 — Dual watcher strategy for dev server (esbuild + node:fs.watch)
**Context:** esbuild's `ctx.serve()` + `ctx.watch()` handles JS/CSS bundling incrementally, but markdown and HTML template changes require a full pages rebuild that esbuild cannot express natively.
**Decision:** Two watchers in `build/build.ts`: esbuild's for JS/CSS, and `node:fs.watch` scoped by file extension for markdown/HTML/CSS triggers that call the relevant build step directly.
**Consequences:** Scoped rebuilds without over-rebuilding (CSS change → CSS step only, `.md` change → pages step only). The two watchers are independent — if esbuild's watcher fires a CSS rebuild at the same time as the `fs.watch` CSS trigger, both may run concurrently. Acceptable for a personal site with no concurrent editors.

## 2026-04-09 — Main agent made one-line sourcemap edit directly (bypassing build-specialist)
**Context:** After `reviewer` flagged the sourcemap issue, `SendMessage` to the warm build-specialist was not available in this harness. Spawning a fresh subagent to flip one boolean would cold-start a full context load.
**Decision:** Main agent edited `build/build.ts:95` directly after explicit user approval.
**Consequences:** One-off exception. Does not change the directory ownership rule going forward. Any future edits to `build/` must go through `build-specialist`.

## 2026-04-09 — "Workshop at Night" amber-orange palette (hue ~55) over purple/teal defaults
**Context:** CLAUDE.md mandates a distinctive, non-generic color palette. Purple gradients and teal are the two most common defaults for developer personal sites.
**Decision:** Amber-orange accent at `oklch(68% 0.18 55)` (light) / `oklch(72% 0.18 58)` (dark), on warm cream (light mode) and cool near-black slate (dark mode). All colors expressed as `oklch()` or `color-mix(in oklch, …)`.
**Consequences:** Palette reads warm and direct without reading corporate. Commits future CSS work to staying within oklch — no hex or rgb fallbacks. Palette has not yet been reviewed in a real browser; may be adjusted before Phase 6.

## 2026-04-09 — Fraunces as heading font
**Context:** Needed a heading font with editorial personality that is not on the banned list (Inter, Roboto, Space Grotesk). Fraunces is a variable optical-size serif with a quirky display personality.
**Decision:** Fraunces for all headings, loaded via `@font-face` from Google CDN with `unicode-range`. Body text stays in the system-ui stack.
**Consequences:** Adds one external CDN request per page load (mitigated by `font-display: swap` and Google's CDN performance). Commits the typographic identity of the site to a serif display font for headings. Self-hosting path documented in knowledge base if needed.

## 2026-04-09 — `--color-on-accent` as a fixed non-theme-flipping token
**Context:** The amber accent background is the same hue in both light and dark modes. Button text on that background must be dark in both modes.
**Decision:** `--color-on-accent` is defined as a fixed dark value in `:root` and is not overridden in `prefers-color-scheme: dark`. It does not reference `--color-bg`.
**Consequences:** Any future color scheme refactors must not naively map all foreground/background tokens through the dark-mode swap — accent-on tokens are a separate category that must be reviewed independently.

## 2026-04-09 — `@layer components` shared across `nav.css` and `components.css`
**Context:** Nav and card/component styles are authored in separate files but both belong semantically in the components layer of the cascade.
**Decision:** Both files write into `@layer components { … }`. The CSS cascade merges same-named layer blocks in source order.
**Consequences:** The split is purely organizational — to a browser there is one `components` layer. Future maintainers must know this is intentional; it is not a mistake or a naming collision.

## 2026-04-09 — One `!important` accepted in `animations.css` inside `prefers-reduced-motion`
**Context:** The project's CSS rules prohibit `!important`. The `prefers-reduced-motion: reduce` override block needs to defeat any inline or JS-set animation values that may have already been applied.
**Decision:** Allow a single `!important` exception inside `@media (prefers-reduced-motion: reduce)` in `src/styles/animations.css`. This is the established a11y pattern for motion overrides.
**Consequences:** Creates a documented exception to the no-`!important` rule. Future CSS authors must not use this as a precedent for general-purpose `!important` usage — it applies only to accessibility motion overrides.

## 2026-04-09 — Module registry pattern: `as const satisfies Record<string, () => Promise<{ mount: ... }>>`
**Context:** `src/ts/main.ts` needs a map of module name → dynamic import factory so `[data-module]` attribute values resolve to the right import at runtime.
**Decision:** Use `as const satisfies Record<string, () => Promise<{ mount: (el: HTMLElement) => void }>>` for the registry object literal.
**Consequences:** `as const` preserves literal key types so TypeScript can verify that a given `data-module` value is a known key. `satisfies` validates the shape without widening to the broader type. Adding a new module requires one line in the registry; the rest of `main.ts` stays unchanged.

## 2026-04-09 — JS-side `<style>` injection in `carousel.ts` and `scroll-reveal.ts` (temporary)
**Context:** Phase 4 required `.carousel-*`, `.reveal-fade-up`, `.reveal-fade-in`, `.reveal-scale-in`, `.revealed`, and `.no-transition` classes. Phase 3 CSS did not define them. Blocking Phase 4 on a CSS pass would merge phases.
**Decision:** `carousel.ts` and `scroll-reveal.ts` inject a `<style>` element at mount time containing the minimum required CSS. This is an explicit temporary workaround.
**Consequences:** Style definitions are split between CSS partials and JS strings. Must be resolved before or during Phase 5: `css-specialist` adds the missing partials, JS modules remove the injection. If not cleaned up, future CSS changes to those classes must be made in two places.

## 2026-04-09 — `scroll-reveal` early-exit when native scroll-driven animations are supported
**Context:** Phase 3 defined a native CSS scroll-driven reveal path behind `@supports (animation-timeline: view())`. Phase 4's JS fallback would redundantly add reveal classes on modern browsers that already handle it via CSS.
**Decision:** `scroll-reveal.ts` calls `CSS.supports('animation-timeline', 'view()')` at mount time and returns immediately if true — the native CSS path wins.
**Consequences:** On modern browsers (Chrome 115+, Safari 18+), `scroll-reveal.ts` is a no-op module. The JS path only runs on browsers that lack native support. This means the JS fallback code is exercised only in testing on older browsers — it must be verified there separately.

## 2026-04-09 — Theme-toggle transition flash suppression via inline style + rAF, not a class
**Context:** `theme-toggle.ts` needs to suppress transition animation during theme switches. The `.no-transition` class was planned but not yet in CSS.
**Decision:** `theme-toggle.ts` sets `html.style.setProperty('transition', 'none')` directly and removes it inside a `requestAnimationFrame` callback, bypassing the missing CSS class.
**Consequences:** Works without CSS cooperation. If `.no-transition` is later added to CSS, this inline style approach should be replaced with the class toggle for consistency with the rest of the codebase.

## 2026-04-09 — `data-reveal="fade-up"` as unified vocabulary for templates (partial fix)
**Context:** Phase 3 native CSS used `data-reveal="slide"` and Phase 4 JS fallback used `data-reveal="fade-up"`. Templates needed one safe value to use across both paths.
**Decision:** Alias `[data-reveal="fade-up"]` onto the native CSS `slide` rule via a selector addition in `src/styles/animations.css`. Templates use only `fade-up`. Full vocabulary reconciliation (covering `fade-in`, `scale-in`, `slide`, `scale`) deferred to Phase 6.
**Consequences:** `fade-up` is the only safe `data-reveal` value for new templates until Phase 6. The other four values remain split across paths. The aliasing approach adds one selector per native rule — cheap, but tech debt until the full reconciliation lands.

## 2026-04-09 — Kept content-specialist's full-prose articles; rule change is prospective only
**Context:** `content-specialist` wrote ~1800 words of real prose for the two articles and two projects, driven by the Phase 5 prompt spec ("write as Matt, authentic voice"). CLAUDE.md's "no lorem ipsum" rule was ambiguous about scaffolding vs. deploy-ready content.
**Decision:** Keep the existing prose as-is per Matt's direction. Update `CLAUDE.md` and `docs/prompts/05-content.md` prospectively to clarify that "no lorem ipsum" applies to deploy-ready content only; scaffolding should use labeled lorem ipsum.
**Consequences:** Current articles contain Claude-written prose that should be replaced by Matt before deploy. The rule clarification prevents the same ambiguity in future phases.

## 2026-04-09 — `SITE_ORIGIN = "https://mattnoth.dev"` in `build/pages.ts`
**Context:** `og:url` meta tag required a canonical absolute URL per page. No existing constant in `build/` or `netlify.toml` held the origin.
**Decision:** Add `SITE_ORIGIN = "https://mattnoth.dev"` as a named constant in `build/pages.ts`. Value matches the `mattnoth` handle already used in `base.html` social links.
**Consequences:** If the domain changes, this constant and the social link in `base.html` must both be updated. There is currently no single source of truth — two places to update on a domain change.

## 2026-04-09 — Separate `page_title` and `title` slots instead of stripping suffix at template side
**Context:** Browser `<title>` and `og:title` needed the suffixed form ("Article — Matt Noth"), but the `<h1>` needed only the raw title. Originally both used the `title` slot, requiring templates to strip the suffix — invisible coupling.
**Decision:** Two slots: `title` (suffixed, for `<title>` and OG tags) and `page_title` (raw, for `<h1>`). Both are produced by `build/pages.ts` and consumed by the appropriate template locations.
**Consequences:** Adding a new page type requires populating both slots. Eliminates the strip-suffix antipattern at the template side. If the suffix format ever changes, only `pages.ts` needs to change.

## 2026-04-09 — "Phase execution rules" added to `CLAUDE.md` rather than a separate process doc
**Context:** Phase 5 orchestration gaps (missing CSS class constraint, no slot pre-flight, unreconciled vocabulary drift) were the session's main cost center. The lessons needed to be codified somewhere that is always in main-agent context.
**Decision:** New "Phase execution rules" section added directly to `CLAUDE.md` instead of a separate file under `docs/`.
**Consequences:** Rules are in context at every session start via `CLAUDE.md` automatic load. A separate doc would be missed during phase starts unless explicitly read. Adds length to an already long `CLAUDE.md` — acceptable trade-off.

## 2026-04-09 — Removed `slide`/`scale` `data-reveal` aliases rather than keeping them deprecated
**Context:** Phase 6 vocabulary reconciliation found that `slide` and `scale` appeared only in `src/styles/animations.css` — not in any template, content file, or JS module's `VALID_VARIANTS` set. The Phase 5 decision had aliased `fade-up` onto the native `slide` rule as a partial fix.
**Decision:** Remove `slide` and `scale` outright. Final canonical vocabulary: `fade-up | fade-in | scale-in`. All three values work on both the native CSS path and the JS fallback path.
**Consequences:** Any external content that used `data-reveal="slide"` or `data-reveal="scale"` will silently get no animation. Since no templates or content files used them, this is zero-risk today. If the vocabulary is ever extended again, the same audit (CSS + JS `VALID_VARIANTS` + templates + content files) must all agree before shipping.

## 2026-04-09 — Parameterized `HeadingLevel` on card functions instead of flattening home-page sections
**Context:** Phase 6 reviewer flagged a heading-hierarchy bug: home page emits `h2` section headings and `h2` card headings at the same level — screen readers see a flat list with no nesting. Options were: (a) flatten all section `h2`s to `<p>` labels, or (b) parameterize the card heading level.
**Decision:** `articleCard` and `projectCard` in `build/pages.ts` accept a `HeadingLevel` parameter. Home page passes `'h3'` (cards nest under section `h2`); list pages pass `'h2'` (cards nest under page `h1`). All `.map()` call sites converted to explicit arrow functions to avoid the positional-argument footgun.
**Consequences:** Adding a new call site for either card function requires explicitly choosing a heading level — no silent default. Heading semantics are now correct on both home and list pages without touching templates.

## 2026-04-09 — Card CSS rewritten to match HTML, not HTML to match CSS
**Context:** Post-Phase 6 card layout was broken. `components.css` defined `.card__body`, `.card__title`, `.card__description`, `.card__tags`, `.card__image`, `.card__meta`, and a full `.project-card` block. The HTML emitted by `build/pages.ts` used `<header>`, `<p>`, `<div class="tags">` as direct children of `.card` — no BEM child classes.
**Decision:** Rewrote card CSS rules to target the actual emitted HTML structure (`.card header`, `.card p`, `.card .tags`). Deleted all BEM child-class selectors and the `.project-card` block entirely. Did not change the HTML to match the BEM vocabulary.
**Consequences:** BEM child-class vocabulary for cards is gone. The HTML producer (`build/pages.ts` template literals) is the de-facto contract, per CLAUDE.md preference for styling what ships. Future card styling must use the element-selector or modifier-class pattern. The `build/lint-classes.ts` step will catch any future drift immediately.

## 2026-04-09 — Class-lint fails on both directions of drift, not just missing-in-CSS
**Context:** The card-class drift bug was in the unused-in-HTML direction (CSS had classes that no HTML emitted). A lint that only checked "class in HTML but not in CSS" would have missed it entirely.
**Decision:** `build/lint-classes.ts` fails on asymmetry in BOTH directions: (1) class emitted by HTML not found in CSS, and (2) CSS class selector not found in any emitted HTML. The `JS_APPLIED` allowlist covers intentionally dormant infrastructure.
**Consequences:** CSS authors cannot add new rules without a corresponding HTML consumer — or an explicit allowlist entry. This is intentional: silent dead CSS was the root cause of this session's bug. Allowlist entries for dormant infrastructure require a comment naming why they are dormant.

## 2026-04-09 — `date` frontmatter field = publish date, not original writing date
**Context:** `cortex-agents.md` was originally written in January 2026 but added to the site on 2026-04-09. Matt did not want to backdate the publish date or "embellish" the release date.
**Decision:** Keep `date: 2026-04-09` as the canonical publish date. Add a plain-language editor's-note addendum in the article body noting original writing was January 2026.
**Consequences:** The article card in listings shows "Apr 9, 2026" while the body says "originally written January 2026". Acknowledged inconsistency; the addendum handles the nuance. If the site later adds an `originally_written` frontmatter field for display, this article is the first candidate.

## 2026-04-09 — Deleted ghostwritten articles/projects rather than drafting or rewriting
**Context:** `building-this-site.md`, `modern-css-is-amazing.md`, and `context-base.md` were written by `content-specialist` in Phase 5 in Matt's first-person voice. Matt's feedback: the learnings they contained were Claude's, not Matt's.
**Decision:** Delete all three files outright. The learnings already live in `docs/knowledge-base.md`. `context-base` additionally has no clean-room codebase to point at — only Matt's work version.
**Consequences:** The site launches with one real article (`cortex-agents`) and a near-empty Projects section. Leaving them with `draft: true` was rejected because it keeps misattributed prose in the repo. One substantive real article fits the white-paper positioning better than one real + two ghostwritten fillers.

## 2026-04-09 — Card clickability via stretched `::after` overlay, not wrapping `<a>`
**Context:** Cards needed to be fully clickable surfaces. Wrapping the entire card in an `<a>` would create nested interactive elements (project cards have Live/GitHub links inside), which is invalid HTML.
**Decision:** Title anchor gets a stretched `::after { content: ""; position: absolute; inset: 0; border-radius: inherit }` overlay. `.card` gets `position: relative`. Secondary interactive elements (`.card .links`) escape the overlay via `position: relative; z-index: 1`.
**Consequences:** Keeps semantic HTML (single real anchor per card), accessibility (one title link announced by screen readers), and correct middle-click/right-click/copy-link behavior. Text-caret placement via single click on the card body is blocked — standard tradeoff of this pattern. No new CSS classes introduced; lint count unchanged at 34 HTML / 49 CSS.

## 2026-04-09 — Section-spacing collapse via `.section + .section`, not global `padding-block` adjustment
**Context:** Consecutive sections on the home page had too much vertical gap between them, but adjusting `.section { padding-block }` globally would have also shrunk the first section's top spacing (after the hero) and the last section's bottom spacing (before the footer).
**Decision:** Add `.section + .section { padding-block-start: var(--space-xl) }` as a nested rule in `src/styles/layout.css`. Adjacent-sibling selector collapses only the space between sections, leaving first and last intact.
**Consequences:** The selector is precise. Adding a non-`.section` element between two sections (e.g. a full-bleed band) would stop the collapse from applying — intentional. Future sections added to the home page automatically inherit the collapsed gap without any extra CSS.

## 2026-04-09 — `.section` as flex column with single gap token for section rhythm
**Context:** Home page section rhythm (h2 → cards grid → trailing "more →" link) had been managed with per-element margins. Inconsistent spacing; required multiple rules to adjust.
**Decision:** `.section` in `src/styles/layout.css` is `display: flex; flex-direction: column; gap: var(--space-lg)`. Single gap token controls all spacing between direct children.
**Consequences:** Section rhythm is one token. Changing `--space-lg` or the section gap affects h2→grid and grid→trailing-link simultaneously. Adding a third direct child (e.g. a filter bar) automatically inherits the gap. Overriding spacing on individual children requires a scoped margin that explains why it's special.

## 2026-04-09 — Trailing "more →" links styled via `.section > p:last-child`, no new class
**Context:** Home page has "All articles →" and "All projects →" trailing links below each card grid. Options: (a) add a new class to the template and lint allowlist, (b) use a structural selector.
**Decision:** Style via `.section > p:last-child` in `src/styles/layout.css`. No template change, no new vocabulary for the class-lint to police.
**Consequences:** Selector is structural — it targets any `<p>` that is the last direct child of `.section`. Adding a second trailing paragraph to a section would style both as "more" links. Acceptable for this site's template structure; would need a named class if sections ever get more complex trailing content.

## 2026-04-10 — `minmax(0, 1fr)` on body grid rather than `overflow: hidden` on a child
**Context:** Body grid was emitting an implicit auto column, causing horizontal page overflow when wide content (code blocks, tables) landed in the Cortex Agents article. Two remedies considered: fix the grid track sizing at root, or add `overflow: hidden` (or `overflow-x: clip`) on `<main>`.
**Decision:** Add `grid-template-columns: minmax(0, 1fr)` to `body` in `src/styles/layout.css`. Addresses the root cause at the grid container rather than masking it at a descendant.
**Consequences:** All direct children of the body grid are constrained to the viewport width by the `minmax(0, ...)` floor. Any future grid layout on `body` that omits columns should get the same treatment. `overflow: hidden` was rejected because it would clip sticky headers, tooltips, or any position-absolute elements that intentionally extend beyond the main column.

## 2026-04-10 — Smaller JPG over full PNG for about photo
**Context:** Two versions of the beach photo existed in `src/assets/images/`: `matt-beach.png` (651KB) and `matt-beach-jpg-smaller.jpg` (347KB). Same perceived quality; JPG is nearly half the size.
**Decision:** Use `matt-beach-jpg-smaller.jpg` in `src/templates/home.html`. The PNG is left in place for now but is not referenced by any template.
**Consequences:** PNG still ships to dist as a dead asset. Should be deleted (or the copy step scoped) in a future cleanup. If webp conversion is added (via `<picture srcset>`) the JPG becomes the fallback source.

## 2026-04-10 — Container query for about section, media query for hero mobile padding
**Context:** The about section is a self-contained component (photo + text) whose breakpoint should depend on its own available width, not the viewport. The hero padding tweak is a page-level spacing adjustment with no component boundary.
**Decision:** Container query (`container-type: inline-size` on `.about`, `@container` for the wide layout) for the about section. Regular `@media` for the hero `padding-block-start` reduction on mobile.
**Consequences:** Consistent with CLAUDE.md rule: container queries for component-scoped responsive, media queries for page-level layout. The about section could be dropped into a narrower column layout and the breakpoint would still trigger correctly.
