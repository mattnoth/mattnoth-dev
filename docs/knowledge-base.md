# matt-site knowledge base

This file is a growing log of non-obvious things future-me needs to know. It is NOT a code documentation file — things already visible in the code belong in the code, not here. This file captures: gotchas, "I wish I'd known this earlier" moments, why we chose X over Y when both seemed fine, and behavior that would surprise a fresh reader.

The `progress-tracker` subagent appends to this file at the end of each session via `/end-session`. Do not hand-edit during work sessions.

---

## Stack decisions

### Why vanilla TS + native CSS
**Date:** 2026-04-09
**Context:** Coming from Next.js, wanted more control, faster builds, Lighthouse 100 without trying.
**Learning:** Modern CSS (nesting, `@layer`, `:has()`, container queries, `oklch()`) has closed the gap with Sass. Modern TS (`satisfies`, `verbatimModuleSyntax`, `erasableSyntaxOnly`) makes custom build scripts ergonomic. The combo gives you framework-free output without the ergonomic tax that used to come with that choice.

---

## Gotchas

### tsconfig `extends` does not inherit `include`
**Date:** 2026-04-09
**Context:** `tsconfig.build.json` extends the root `tsconfig.json`. It was tempting to assume `include` would be inherited.
**Learning:** Each tsconfig's `include` array stands alone — it is not merged or inherited from the base. `tsconfig.build.json` must explicitly set `"include": ["build/**/*"]`. Without this, build scripts would not be typechecked at all.

### `.map(fn)` + new default parameters silently passes `index` into the wrong slot
**Date:** 2026-04-09
**Context:** `build/pages.ts` added `level: HeadingLevel = 'h2'` as a new positional parameter to `articleCard` and `projectCard`. Existing `.map(articleCard)` call sites would have silently passed `index: number` as `level`.
**Learning:** When adding a new positional parameter with a default to a function that is used directly as a `.map()` callback, audit all call sites before shipping. `.map(fn)` passes `(item, index, array)` positionally — the `index` number lands in the new slot without a type error if the parameter type is loose. Fix: convert all call sites to explicit arrow functions (`arr.map((item) => fn(item))`) even when the default applies.

### `on()` DOM helper requires an internal `EventListener` cast
**Date:** 2026-04-09
**Context:** `src/ts/utils/dom.ts` implements a typed `on<K extends keyof HTMLElementEventMap>()` helper. The handler parameter is typed as `(e: HTMLElementEventMap[K]) => void`.
**Learning:** `HTMLElementEventMap[K]` is not directly assignable to `EventListener`. One `handler as EventListener` cast is required inside the function body when calling `addEventListener`. Call sites remain fully typed; the cast is entirely internal.

---

## Build system

### Phase 1 scaffold does not produce a working build
**Date:** 2026-04-09
**Context:** Phase 1 creates all config, directory structure, and placeholder files. The build entry point `build/build.ts` is currently just a comment stub.
**Learning:** Do not attempt `npm run build` or `npm run dev` until Phase 2 ships the real pipeline. `npm run typecheck` (`tsc --noEmit`) is the correct smoke test for Phase 1 — it works because it only validates types, not the build graph.

### IDE false positives on `node:` imports in `build/`
**Date:** 2026-04-09
**Context:** VSCode resolves `build/*.ts` against the nearest `tsconfig.json`, which targets the browser and lacks `@types/node`.
**Learning:** The editor will show spurious errors on `import "node:fs/promises"` and similar. `npm run typecheck` is authoritative — it runs both tsconfigs explicitly. If the editor noise becomes intolerable, add TS project references (`composite: true` + `references` in root tsconfig) to tell VSCode which config applies to which tree.

### `allowImportingTsExtensions: true` required in `tsconfig.build.json`
**Date:** 2026-04-09
**Context:** `tsx` resolves `.ts` import paths at runtime, so build scripts use `import { foo } from "./markdown.ts"`. `tsc` rejects `.ts` extensions in import specifiers without this flag.
**Learning:** Add `allowImportingTsExtensions: true` to `tsconfig.build.json`. The browser tsconfig does not need it because esbuild handles resolution there.

### `esbuild.ServeResult.hosts` is `string[]` as of esbuild 0.25+
**Date:** 2026-04-09
**Context:** `build/build.ts` reads the dev server host from the esbuild serve result.
**Learning:** `hosts` is an array, not a scalar `host` field. With `noUncheckedIndexedAccess: true` on, the correct pattern is `hosts[0] ?? "localhost"`. Using `host` directly (old API) will error at type-check time.

---

## CSS

### `concatCss` stub-detection drops files whose content starts with `/*`
**Date:** 2026-04-09
**Context:** Phase 1 leaves comment-only CSS partials as placeholders. `concatCss` skips any file whose trimmed content starts with `/*` to avoid including stubs in `dist/main.css`.
**Learning:** Design rationale comments must live inside the `@layer` block, not before it. A comment at the top of the file triggers the stub check and silently drops the file from the concat output. `css-specialist` hit this on `tokens.css` and `typography.css` and moved comments inside the layer block.

### `--color-on-accent` must be a fixed token, not theme-flipping
**Date:** 2026-04-09
**Context:** The amber accent button background is fixed (same hue in both light and dark modes). The button's text color needs to be dark in both modes.
**Learning:** If you set `--color-on-accent` to reference `--color-bg`, it flips to near-black in dark mode (where `--color-bg` is near-black) and destroys contrast on the button. Define `--color-on-accent` as a fixed dark value that does not participate in the `prefers-color-scheme` swap.

### `@layer` with the same name across multiple files is intentional
**Date:** 2026-04-09
**Context:** Both `src/styles/nav.css` and `src/styles/components.css` write into `@layer components { … }`.
**Learning:** The CSS cascade merges same-named layer blocks in source order. Nav and component rules can live in separate files while sharing the semantic layer. This is correct and deliberate — do not rename one of them to avoid the "duplicate" layer name.

### `-webkit-backdrop-filter` required for Safari sticky-header blur
**Date:** 2026-04-09
**Context:** The sticky header uses `backdrop-filter: blur(...)` for a frosted-glass effect.
**Learning:** Safari requires `-webkit-backdrop-filter` alongside the unprefixed property. Without it the header is opaque on all Safari versions. Both declarations must be present.

### IDE linters warn on `oklch()` / `color-mix(in oklch, …)` — safe to ignore
**Date:** 2026-04-09
**Context:** VSCode CSS linters flag `oklch()` and `color-mix(in oklch, …)` as unsupported for Chrome < 111.
**Learning:** Chrome 111 shipped March 2023. This project targets evergreen browsers. The warnings are false positives — dismiss them. Do not add any fallback hex values or polyfills.

### Fraunces loaded from Google CDN with `unicode-range` — self-hosting path
**Date:** 2026-04-09
**Context:** `src/styles/typography.css` loads Fraunces via `@font-face` pointing to Google Fonts CDN, with `unicode-range` for subsetting.
**Learning:** Subsetting is handled by Google on the CDN path. If self-hosting is needed for privacy or offline builds, pull the woff2 files into `src/assets/fonts/` and update the `src` URLs in the `@font-face` declarations. No other changes required.

---

## TypeScript modules

### Browser tsconfig does not set `allowImportingTsExtensions`
**Date:** 2026-04-09
**Context:** `tsconfig.build.json` sets `allowImportingTsExtensions: true` so `tsx` can resolve `.ts` specifiers in build scripts. It was tempting to mirror this pattern in `src/ts/`.
**Learning:** Browser-side imports in `src/ts/` must be extensionless. esbuild's bundler resolution handles them. First pass of Phase 4 used `.ts` suffixes copied from the build-side pattern and `tsc --noEmit` rejected every import. Only `tsconfig.build.json` carries this flag.

### Cross-phase CSS/TS vocabulary drift
**Date:** 2026-04-09
**Context:** Phase 3 defined `.nav--hidden` and `data-reveal` values (`""`, `"slide"`, `"scale"`) for the native scroll-driven CSS path. Phase 4 spec assigned a separate vocabulary: `.reveal-fade-up`, `.reveal-fade-in`, `.reveal-scale-in`, `.revealed`, `.no-transition`, `.carousel-*`. None of these classes were defined in CSS.
**Learning:** Two class vocabularies now coexist for reveal behavior. Phase 5+ prompts must cross-reference the other phase's delivered class names before assigning new vocabulary. Classes used by JS modules that are not in CSS must either be added to CSS or injected at mount time (the current workaround).

### `data-reveal` vocabulary only partially reconciled after Phase 5
**Date:** 2026-04-09
**Context:** Phase 5 fixed `fade-up` by aliasing it to the native `slide` rule in `src/styles/animations.css`. The other values remain split: `fade-in` and `scale-in` exist only in the JS fallback path; `slide` and `scale` exist only in the native CSS path.
**Learning:** Templates should only use `data-reveal="fade-up"` until Phase 6 completes full reconciliation. Using `fade-in`, `scale-in`, `slide`, or `scale` in new templates will silently fail on one of the two render paths.

### `noUncheckedIndexedAccess` + closure narrowing requires re-annotation
**Date:** 2026-04-09
**Context:** `carousel.ts` does a null guard on `qs('.carousel-track', el)`, then uses the result inside nested closures (event handlers, rAF callbacks).
**Learning:** TypeScript control-flow narrowing does not propagate across closure boundaries. Pattern to use after the null guard: `const track: HTMLElement = narrowedVar` — re-annotate the local to the non-null type so nested closures see it without a type assertion at each call site.

### `on()` helper is scoped to `HTMLElementEventMap` — raw `addEventListener` required for other targets
**Date:** 2026-04-09
**Context:** `main.ts` listens on `document` (DOMContentLoaded), `theme-toggle.ts` listens on a `MediaQueryList` (change), and `carousel.ts` listens on `AbortSignal` (abort). All three are not `HTMLElement` targets.
**Learning:** `MediaQueryList` uses `MediaQueryListEventMap`, `document` uses `DocumentEventMap`, and `AbortSignal` uses its own map. The typed `on()` helper is intentionally scoped to `HTMLElementEventMap`. Use raw `addEventListener` for non-HTMLElement targets and add a comment explaining why. The reviewer explicitly cleared these three cases as correct.

### `Object.entries` on `Partial<HTMLElementTagNameMap[K]>` loses key specificity
**Date:** 2026-04-09
**Context:** `utils/dom.ts` `create()` iterates an `attrs` parameter typed as `Partial<HTMLElementTagNameMap[K]>` to set element properties.
**Learning:** `Object.entries()` on that type returns `[string, unknown][]` — key specificity is gone. One `(el as Record<string, unknown>)` cast is required inside `create()` to assign iterated entries. Safe because only known DOM properties are being assigned; the cast is documented at the site and not repeated at call sites.

### Reviewer fix recommendations must be re-checked against directory ownership
**Date:** 2026-04-09
**Context:** Phase 6 reviewer recommended delegating a card heading-hierarchy fix to `content-specialist`. The card HTML is generated in `build/pages.ts` template literals, not in `src/templates/`.
**Learning:** `reviewer` identifies what to fix, not which specialist owns the fix. Before forwarding a reviewer recommendation verbatim, cross-check the file path against the directory ownership table in `CLAUDE.md`. `build/` belongs to `build-specialist`; `src/templates/` belongs to `content-specialist`. Getting this wrong wastes a delegation round-trip.

---

## Content pipeline

### `templates.ts` slot regex silently swallows unknown slots
**Date:** 2026-04-09
**Context:** `build/pages.ts` carried a dead `meta` slot for several Phase 4 builds. It passed through `templates.ts` without any error or warning — the renderer simply emits nothing for an unknown slot.
**Learning:** There is no build-time error when a slot appears in the producer (`pages.ts`) but not in the template, or vice versa. Slot mismatches require out-of-band auditing — read both sides of the slot contract before delegating template work. The new "slot-contract pre-flight" rule in `CLAUDE.md` codifies this.

### Reusing one slot for two rendered forms causes brittle coupling
**Date:** 2026-04-09
**Context:** `build/pages.ts` originally used `title` for both the `<title>` element (suffixed: "Article — Matt Noth") and the `<h1>` content. This broke when templates rendered the suffixed title verbatim as a heading.
**Learning:** If a slot needs two different rendered forms (suffixed for `<title>` and raw for `<h1>`), split it into two separate slots up front. Stripping or appending at the template side creates invisible coupling that breaks silently when templates are written by a different agent.

### Phase-prompt rule overrides CLAUDE.md site-wide rules
**Date:** 2026-04-09
**Context:** `CLAUDE.md` says "no lorem ipsum" but the intent was only for deploy-ready content. `docs/prompts/05-content.md` said "write as Matt, 400-500 words, authentic voice" — which overrode the rule and caused `content-specialist` to write ~1800 words of real prose.
**Learning:** When a CLAUDE.md rule can be contradicted by a phase prompt, both must be updated simultaneously. Rule-level clarification alone does not protect against the leak path through the phase prompt. This is the operating assumption for future rule corrections.

---

## Deploy

### Netlify `[[redirects]] from = "/*"` collides with static files
**Date:** 2026-04-09
**Context:** `netlify.toml` had a catch-all redirect added in Phase 2 as a "just in case" clean-URL rule.
**Learning:** The wildcard rewrites every request including `/main.css`, `/main.js`, and `/sitemap.xml` into `/:splat/index.html`, causing 404s for all static assets. With `publish = "dist"` and `pretty_urls = true`, Netlify's default behavior already handles clean URLs via directory-index resolution — no redirect rule is needed. Do not add a `from = "/*"` rule if `pretty_urls` is on.

### `pretty_urls` + directory index is sufficient for clean URLs on Netlify
**Date:** 2026-04-09
**Context:** Evaluating whether `[[redirects]]` was needed alongside `pretty_urls = true`.
**Learning:** Netlify serves `dist/articles/foo/index.html` when a request arrives for `/articles/foo/` out of the box. No redirect rule required. The two mechanisms are redundant and the redirect block wins, causing the bad behavior described above.

### Immutable cache on non-hashed filenames is a latent stale-asset risk
**Date:** 2026-04-09
**Context:** `netlify.toml` sets `Cache-Control: public, max-age=31536000, immutable` on `/*.css` and `/*.js`.
**Learning:** esbuild emits `main.css` and `main.js` without content hashes. Returning visitors will see stale assets for up to a year after a redeploy. Two remedies: add content-hashed filenames to esbuild output (requires updating the `base.html` slot to inject the hashed path) or shorten the cache TTL. Decision is deferred — but this must be resolved before treating the site as production-ready.

### `oklch()` in SVG works in evergreen browsers
**Date:** 2026-04-09
**Context:** `src/favicon.svg` uses `oklch(68% 0.18 55)` directly in SVG `fill` attributes.
**Learning:** Chrome 111+, Safari 15.4+, Firefox 113+ all support `oklch()` in SVG. Safe for this project's evergreen target. If the SVG ever needs to render in a non-browser context (email clients, older rasterizers), swap the fill to `#d07628`.

### Class vocabulary drift is a recurring pattern — mechanically backstopped by `build/lint-classes.ts`
**Date:** 2026-04-09
**Context:** Fourth incident of CSS/HTML class vocabulary drift this project (prior: Phase 3/4 reveal classes, Phase 5 title-slot reuse, Phase 3/6 card classes). Root cause each time: specialists reading only one side of the HTML-producer/CSS-consumer contract.
**Learning:** `build/lint-classes.ts` now fails the build on any asymmetry in either direction (class in HTML not in CSS, or class in CSS not in HTML). The `JS_APPLIED` allowlist covers legitimately dormant infrastructure (carousel, stagger, no-transition). When the lint fires on a missing class or unused rule, fix the source — do not add to the allowlist to suppress real drift.

### `build/pages.ts` template literals are a hidden HTML producer
**Date:** 2026-04-09
**Context:** Card HTML is generated via TypeScript template literals in `build/pages.ts`, not in `src/templates/`. Specialists reading only `src/templates/` to understand card markup will miss all class names emitted there.
**Learning:** Any audit of HTML-emitted class names must include `build/pages.ts` in addition to `src/templates/`. The updated `CLAUDE.md` "Phase execution rules" pre-flight section explicitly names `pages.ts` as an HTML producer. The structural fix (splitting card HTML into templates) is deferred but would eliminate this dual-path confusion.

### Briefs that allow "judgment calls" on guardrail allowlists need explicit anti-pattern wording
**Date:** 2026-04-09
**Context:** Build-specialist's initial implementation of `build/lint-classes.ts` added real drift cases (`.link*`, `.card--*`) to the `JS_APPLIED` allowlist rather than deleting the dead class names from the source, because the brief said "add false positives to JS_APPLIED with a comment."
**Learning:** When delegating guardrail work, the brief must include: "do NOT add real drift to the allowlist — fix the source instead. The allowlist is only for infrastructure that is intentionally dormant." Without this, a well-intentioned specialist will take the path of least resistance and suppress the signal the guardrail was built to emit.

### When a render bug is reported, check DOM presence before reading CSS cascade
**Date:** 2026-04-09
**Context:** Hamburger button was reported as potentially non-functional. Investigation went straight to reading all nav CSS rules, which took longer than needed.
**Learning:** For any reported render bug, verify in order: (1) DOM node present in `dist/*.html`, (2) CSS rules present in `dist/main.css`, (3) viewport width / media query context. Five minutes grepping `dist/index.html` for the toggle node would have resolved the hamburger question before any CSS reading happened.

### Port 3000 already-in-use leaves a zombie esbuild watcher
**Date:** 2026-04-09
**Context:** A second invocation of `npm run dev` when port 3000 is taken fails to bind the server but still starts the esbuild watch context.
**Learning:** Two esbuild watch contexts writing concurrently to `dist/` can produce intermittent clobbering. Kill the first process before starting a second dev session. `lsof -i :3000` to find the PID.

### Missing frontmatter is a hard build failure, not a warning
**Date:** 2026-04-09
**Context:** `build/markdown.ts` calls `requireString` for `title`, `slug`, `date`, and `description`; it throws on any missing field.
**Learning:** When a new article drops into `src/content/articles/` without frontmatter, `npm run dev` dies with `[markdown] "path.md" missing required string field: title` and never starts. The symptom — dev server won't start after adding an article — does not obviously point at frontmatter. Fix is adding the frontmatter block; there is no graceful degradation.

### The "card as link" overlay pattern blocks text-cursor placement via single click
**Date:** 2026-04-09
**Context:** `.card` uses a stretched `::after` overlay on the title anchor to make the entire card surface clickable.
**Learning:** A single click on the card body cannot place a text caret — the overlay intercepts the pointer event. Click-and-drag to select text still works because browsers distinguish drag from click, but caret placement via single click does not. This is the standard tradeoff of the pattern and is almost always acceptable. If it ever becomes a problem, the escape hatch is `pointer-events: none` on the `::after` with `pointer-events: auto` on interactive sub-regions — but that gets complicated fast; do not reach for it speculatively.

### Stretched `::after` overlays should inherit `border-radius` from the parent
**Date:** 2026-04-09
**Context:** Card clickability overlay in `src/styles/components.css`.
**Learning:** Without `border-radius: inherit`, the invisible overlay has square corners while the card has rounded corners. This only matters if the overlay ever becomes visible (focus ring, debug background, etc.), but it is free to get right the first time. Pattern: `.card :is(h2, h3) a::after { content: ""; position: absolute; inset: 0; border-radius: inherit; }`.

### Ghostwritten prose is the main failure mode for the "no lorem ipsum" rule
**Date:** 2026-04-09
**Context:** Phase 5 `content-specialist` wrote ~1800 words of authentic-sounding prose for articles and projects. The prose was good, which is why the rule wasn't caught at the time.
**Learning:** "It reads well" is not an argument for keeping Claude-authored first-person content in `src/content/`. Technical learnings Claude discovers during a session belong in `docs/knowledge-base.md` (Claude-owned), not in `src/content/` (Matt-owned). Scaffolding should use lorem ipsum or obviously-templated placeholders, never authentic-sounding prose. The new memory `feedback_no_ghostwriting.md` enforces this going forward.

### `display: grid` on `body` without explicit `grid-template-columns` causes child overflow
**Date:** 2026-04-10
**Context:** Body was set to `display: grid` in Phase 3 for layout purposes but without `grid-template-columns`. This was latent until real long-line content (wide code blocks, tables) landed in `cortex-agents.md` and caused the page to overflow horizontally.
**Learning:** Any `display: grid` container that lacks explicit `grid-template-columns` will create an implicit `auto`-sized single column that can expand past the viewport. Fix: add `grid-template-columns: minmax(0, 1fr)`. The `minmax(0, ...)` is the key — plain `1fr` alone does not constrain overflow because `1fr` resolves to the free space after content, not the available viewport space.

### Scrollable-island idiom for wide `<table>` in prose
**Date:** 2026-04-10
**Context:** Cortex Agents article has a wide comparison table that overflowed the prose column on narrow viewports.
**Learning:** Wrapping a `<table>` in a div with `overflow-x: auto` is common but requires an extra DOM node and a class. A simpler CSS-only alternative that matches the existing `<pre>` pattern: `.prose table { display: block; overflow-x: auto; }`. Setting `display: block` makes the table scrollable without a wrapper element. The tradeoff is that `display: block` removes table-specific formatting semantics for accessibility — acceptable here because the table remains readable; for screen-reader-critical tables, keep the native `display: table` and use a wrapper div.

### Container queries cannot self-query
**Date:** 2026-04-10
**Context:** `.about` in `src/styles/layout.css` had `container-type: inline-size` and then an `@container about (min-width: 48rem)` block inside the same rule. The block was dead from day one.
**Learning:** An element cannot be its own container. `@container` only matches against an ancestor container, not the element that declares `container-type`. The selector `.about { container-type: inline-size; @container about (...) { ... } }` is syntactically valid but always evaluates as false. Use a parent wrapper as the container, or (for simple one-breakpoint cases) use a `@media` query instead.

### `margin-inline: auto` on a flex grandchild is a no-op
**Date:** 2026-04-10
**Context:** `.nav__links` had `margin-inline: auto` applied to try to center the nav links. The parent flex item was the `<nav>` wrapper, not `.nav__links` itself.
**Learning:** `margin-inline: auto` on a flex item absorbs free space on the main axis of its direct flex parent. If the element is not a direct child of the flex container, the declaration does nothing because the intermediate wrapper is already content-sized and has no free space to distribute. The fix is to restructure so the element is a direct child of the container with free space, or change the layout model on the true parent.

### `justify-content: space-between` does not true-center a middle item with asymmetric flanks
**Date:** 2026-04-10
**Context:** Site header had logo (left) + nav (middle) + controls (right) as three flex children using `justify-content: space-between`. Logo and controls have different widths.
**Learning:** `space-between` places equal gaps between items, not equal margins from the container edges. When the two flanking items are different widths, the middle item is visually off-center. The correct primitive for true center alignment with asymmetric flanks is CSS Grid: `grid-template-columns: 1fr auto 1fr`. The `1fr` tracks each absorb the remaining space equally, pinning the `auto` middle track to the container's true center regardless of flanking widths.

### Parallel-agent mutations on the same file cause silent clobbering
**Date:** 2026-04-10
**Context:** The `draft` work was delegated such that `build-specialist` was told to temporarily add `draft: true` to `mcp-snowflake.md` for verification and then revert, while `content-specialist` was simultaneously adding `draft: true` as the real permanent edit. Build-specialist's revert clobbered content-specialist's change; the main agent had to hand-restore it.
**Learning:** Never assign mutation rights on the same file to two parallel agents. If one agent needs to mutate a file for testing, the test must be in-memory (or in a temp copy) — not applied and then reverted on the real file. A single agent should own both the real edit and any verification that touches that file. This is the second file-collision incident this project has seen.

### Empty-state `<p>` inside `.grid-auto` needs `grid-column: 1 / -1`
**Date:** 2026-04-10
**Context:** `EMPTY_PROJECTS_HTML` renders a `<p class="empty-state">` inside the `.grid-auto` wrapper when no projects exist.
**Learning:** Without `grid-column: 1 / -1`, the paragraph lands in the first grid cell and renders as a runt-sized column fragment. Spanning all columns makes it read as a full-width message. Any single-item fallback content inside a multi-column grid needs this rule.

### Dev server template cache can show raw `{{slot_name}}` literals after a template change
**Date:** 2026-04-10
**Context:** When coordinating the `{{social_links}}` slot addition to `src/templates/base.html`, an in-flight dev server running from before the template change would render the literal `{{social_links}}` string in the page.
**Learning:** If you see an unsubstituted `{{slot_name}}` in a rendered page, first check whether the running dev server pre-dates the template edit — restart it before assuming a slot-substitution bug in `build/templates.ts`.

### `build/lint-classes.ts` does not catch HTML classes missing from CSS
**Date:** 2026-04-10
**Context:** During parallel CSS + HTML delegation for the `.empty-state` class, the build could pass lint even if the CSS side had not yet landed.
**Learning:** `build/lint-classes.ts` fails on CSS class selectors not found in HTML, but it does NOT fail on HTML classes not found in CSS — that direction of drift passes the build silently. When introducing a new class in a parallel delegation (HTML producer and CSS consumer in separate agents), verify both sides manually after merging rather than relying on the lint step alone.
