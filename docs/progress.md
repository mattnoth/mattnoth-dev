# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [x] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-12 (home page + footer vertical rhythm and mobile fixes)
- Fixed draft-filter in `build/pages.ts`: projects list now hides drafts at all environments (not just prod), matching home-page behavior. Committed as `aad0072`.
- Tightened mobile vertical rhythm on the home page hero → about stack (`src/styles/layout.css`): `.hero` top/bottom padding, `.hero__heading` bottom margin, `.hero__lead` bottom margin, `.about` top padding all reduced. Restored at `@media (min-width: 48rem)`.
- Tightened desktop (≥48rem) rhythm symmetrically: `.hero` padding-block both sides `xl → lg`, `.hero__lead` bottom margin `xl → lg`, `.about` padding-block and gap narrowed. Mobile untouched.
- Fixed CSS bleed: header hamburger-menu rules in `src/styles/nav.css` used bare `.nav__links` selector inside a viewport media query, silently hiding the footer social nav. Scoped to `.nav .nav__links` at `nav.css:101`.
- Rearranged footer into a centered vertical stack at all viewports (`src/styles/layout.css` + `src/templates/base.html`): DOM order `social nav → email → copyright`. Removed `flex-wrap`, `justify-content: space-between`; added `flex-direction: column`, `align-items: center`, `text-align: center`.
- `src/templates/home.html` had pre-existing uncommitted changes (hero/about reshuffle) at session start. Left unstaged — not part of this session's scope.

## Next session
No forced next step. Options: (1) resolve the `NODE_ENV`/draft-filter question (wire `NODE_ENV=production` into the `build` npm script, or drop the `isProd` gate in `build/markdown.ts`); (2) continue iterating on the uncommitted `src/templates/home.html` hero edits; (3) continue Phase 6 polish pass. Matt's call — run `/start-session`.

## Open questions
- Addendum wording on `cortex-agents.md` is a first pass — Matt should edit to taste before deploy.
- `src/content/projects/mcp-snowflake.md` has placeholder body prose. When Matt is ready to build a real project here, flip `draft: false` (or delete the file and start fresh).
- Immutable cache (`Cache-Control: public, max-age=31536000, immutable`) is set on `/*.css` and `/*.js` in `netlify.toml`, but esbuild emits `main.css`/`main.js` without content hashes. Returning visitors will see stale assets for up to a year after a redeploy. Fix: content-hashed filenames (ripples into `base.html` slot) or shorter TTL. Decision deferred to Matt.
- `--color-text-muted` in light mode (`oklch(45% 0.018 260)` on `oklch(96% 0.012 80)`) is ~4.2:1 — passes AA for large text, near-fails for small body text. Needs a real WCAG contrast-checker pass before deploy.
- Optional: `<link rel="apple-touch-icon">` not present. Non-blocking; add a 180×180 PNG to root statics if iOS home-screen support is wanted.
- `components.css` is ~600 lines. Plan to split by component file (cards, buttons, nav-related, carousel, etc.). Deferred for a dedicated refactor session.
- `theme-toggle.ts` uses `html.style.setProperty('transition', 'none')` + rAF instead of `classList.add/remove('.no-transition')`. Should migrate for consistency; would let `.no-transition` be removed from the lint allowlist.
- Carousel infrastructure (`.carousel-wrapper`, `.carousel-track`, `.carousel-slide`, `src/ts/modules/carousel.ts`) is dormant — no template uses `[data-module="carousel"]`. Decision needed: keep as ready-to-use OR strip as YAGNI. Same question for `.stagger-1..4` animation delay utilities.
- Port 3000 already-in-use on `npm run dev` fails serve but leaves the file watcher running, creating two writers to `dist/`. Not fixed; noted for future session.
- `matt-beach.png` deletion was not committed at session end — verify it is staged and commit in the next session if not already done.
- `npm run build` does not set `NODE_ENV=production`, so the `isProd` gate in `build/markdown.ts` never fires. Decide: wire `NODE_ENV=production` into the `build` script, or drop the gate. Until resolved, the projects-list filter in `build/pages.ts` is the only reliable draft suppression mechanism.
- Uncommitted `src/templates/home.html` (pre-existing hero/about reshuffle) is on disk but unstaged. Matt should decide whether to commit, drop, or continue iterating.
- `main { padding-block: var(--space-md); }` in `src/styles/layout.css:20` contributes `space-md` above the hero on mobile. Deferred — affects every page including articles.

## Blockers
- (none)

