# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [x] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-22 (missing-scientists mobile table polish)
- Created branch `feat/ms-mobile-tables` from `feat/pre-push-safeguard`.
- Added marked v15 renderer override in `build/missing-scientists.ts` to wrap every `<table>` in `<div class="ms-table-wrap">` for horizontal scroll containment. Used `marked.use({ renderer: { table() {} } })` pattern after discovering standalone `Renderer` instances lose parser context in v15.
- Added table CSS rules in `src/styles/missing-scientists.css` inside `@layer components`: scroll wrapper (`overflow-x: auto`), collapsed borders, header background via `color-mix`, `overflow-wrap: anywhere`.
- Added `@media (max-width: 37.5rem)` rule to hide the 7th "Case File" column on narrow viewports for the Case Index table.
- Added `max-inline-size: calc(100vw - 2 * var(--space-md))` to `.ms-table-wrap` to prevent double-swipe on mobile — band-aid for a pre-existing prose overflow bug on missing-scientists pages.
- Verified build passes; `ms-table-wrap` appears in 11 generated HTML files.

## Next session
Fix the pre-existing mobile layout issues on missing-scientists pages: sub-nav positioning, Contents dropdown (`<details>`) styling, and prose overflow containment that is currently masked by the table wrapper band-aid.

## Open questions
- Branch scope drift: `feat/ms-mobile-tables` was cut from `feat/pre-push-safeguard` which contains earlier unrelated work. Before merging/PR, consider rebasing or squash-merging cleanly onto main.
- Mobile sub-nav layout on missing-scientists pages needs redesign — current multi-section icon pattern is cramped on narrow viewports.
- `<details>` Contents dropdown styling needs rethinking for mobile on missing-scientists pages.
- Horizontal rule alignment inconsistency on missing-scientists pages on mobile (left/right edges don't match content column).
- Addendum wording on `cortex-agents.md` is a first pass — Matt should edit to taste before deploy.
- `src/content/projects/mcp-snowflake.md` has placeholder body prose. When Matt is ready to build a real project here, flip `draft: false` (or delete the file and start fresh).
- Immutable cache (`Cache-Control: public, max-age=31536000, immutable`) is set on `/*.css` and `/*.js` in `netlify.toml`, but esbuild emits `main.css`/`main.js` without content hashes. Returning visitors will see stale assets for up to a year after a redeploy. Fix: content-hashed filenames (ripples into `base.html` slot) or shorter TTL. Decision deferred to Matt.
- `--color-text-muted` in light mode (`oklch(45% 0.018 260)` on `oklch(96% 0.012 80)`) is ~4.2:1 — passes AA for large text, near-fails for small body text. Needs a real WCAG contrast-checker pass before deploy.
- Optional: `<link rel="apple-touch-icon">` not present. Non-blocking; add a 180×180 PNG to root statics if iOS home-screen support is wanted.
- `components.css` is ~600 lines. Plan to split by component file (cards, buttons, nav-related, carousel, etc.). Deferred for a dedicated refactor session.
- `theme-toggle.ts` uses `html.style.setProperty('transition', 'none')` + rAF instead of `classList.add/remove('.no-transition')`. Should migrate for consistency; would let `.no-transition` be removed from the lint allowlist.
- Carousel infrastructure (`.carousel-wrapper`, `.carousel-track`, `.carousel-slide`, `src/ts/modules/carousel.ts`) is dormant — no template uses `[data-module="carousel"]`. Decision needed: keep as ready-to-use OR strip as YAGNI. Same question for `.stagger-1..4` animation delay utilities.
- Dev server moved to port 3001 (`build/build.ts`). If 3001 is in use, the same zombie-watcher problem from port 3000 applies — kill the first process before starting a second dev session.
- `matt-beach.png` deletion was not committed at session end — verify it is staged and commit in the next session if not already done.
- `npm run build` does not set `NODE_ENV=production`, so the `isProd` gate in `build/markdown.ts` never fires. Decide: wire `NODE_ENV=production` into the `build` script, or drop the gate. Until resolved, the projects-list filter in `build/pages.ts` is the only reliable draft suppression mechanism.
- `main { padding-block: var(--space-md); }` in `src/styles/layout.css:20` contributes `space-md` above the hero on mobile. Deferred — affects every page including articles.

## Blockers
- (none)

