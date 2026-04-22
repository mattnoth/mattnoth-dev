# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [x] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-22 (missing-scientists mobile polish)
- Extended `build/missing-scientists.ts` table renderer: `<div class="ms-table-wrap">` wrapping now also applies `max-inline-size: calc(100vw - 2 * var(--container-padding))` using the actual page padding token.
- Added table CSS to `src/styles/missing-scientists.css`: collapsed borders, header backgrounds via `color-mix`, `overflow-wrap: anywhere`, 7th-column hide on narrow viewports.
- Converted `.ms-nav__links` to a never-wrapping horizontal scroll strip with `inline-size: max-content` and hidden scrollbar; removed the 40rem wrapping breakpoint.
- Implemented mobile TOC overlay in `build/missing-scientists.ts`: `<details>` summary as compact trigger, `<ol>` as absolute-positioned dropdown with light-dismiss JS (click-outside + link-click closes it), starts closed on mobile via inline `<script>`.
- On desktop (≥64rem), TOC `<summary>` hidden and `<ol>` forced visible via CSS regardless of `<details>` open state.
- Grid layout uses `:has(.ms-toc)` to only allocate sidebar column when TOC is present; pages without a TOC get single-column layout.
- Tightened mobile vertical spacing: header margin and layout grid gap reduced so "Abstract" sits closer to title.
- Organized research prompts into `completed/` and `queued/` folders; created `prompt-mobile-toc-overlay.md`; updated `TODO-research.md`.

## Next session
Test TOC overlay and table scroll at multiple viewports (consider Playwright). Then address `<hr>` alignment and table overflow edge cases on missing-scientists pages.

## Open questions
- Branch scope drift: `feat/ms-mobile-tables` (now `feat/pre-push-safeguard`) contains unrelated work. Before merging/PR, consider rebasing or squash-merging cleanly onto main.
- Tables still touch the right edge on some intermediate display sizes — may need Playwright testing to confirm.
- `<hr>` alignment on missing-scientists pages on mobile not yet addressed.
- Mobile TOC overlay not tested on actual devices.
- Addendum wording on `cortex-agents.md` is a first pass — Matt should edit to taste before deploy.
- `--container-padding` is the correct padding token for viewport-edge calculations on missing-scientists pages, not `--space-md`. Earlier table wrapper used `--space-md`; updated this session.
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

