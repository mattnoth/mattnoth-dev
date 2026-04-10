# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [x] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-09 (post-Phase 6 polish + guardrails)
- Fixed broken card layouts on home + list pages — root cause was CSS/HTML vocabulary drift; BEM child selectors (`.card__body`, `.card__title`, etc.) and entire `.project-card` block were defined in `src/styles/components.css` but HTML emitted by `build/pages.ts` used `<header>`/`<p>`/`<div class="tags">` children. Rewrote card CSS to match actual emitted HTML; deleted all dead BEM child selectors and `.project-card` block.
- Added `build/lint-classes.ts` (NEW, ~250 lines): collects every class emitted by templates + `build/pages.ts` template literals, collects every CSS class selector, fails the build on drift in either direction (missing in CSS OR unused in HTML). Wired into `build/build.ts` as `stepLintClasses()` between `stepPages` and `stepSitemap`. Allowlist (`JS_APPLIED`) kept narrow — dormant infrastructure (carousel, stagger, no-transition) listed explicitly.
- Removed dead class names from `build/pages.ts`: `.link`, `.link--live`, `.link--github` (cargo-cult, styling came from `.card .links a` element selector), and `.card--article`, `.card--project` (no consumer in CSS or HTML).
- Extended `CLAUDE.md` "Phase execution rules" slot-contract pre-flight to full "slot-AND-class contract" pre-flight — now explicitly names `build/pages.ts` template literals as an HTML producer in addition to `src/templates/`.
- Card spacing polish in `src/styles/components.css`: flipped `.card header` row/col gap to `sm xs`; scoped `.reading-time::before` dot separator to `time + .reading-time::before` sibling combinator.
- Home page spacing polish in `src/styles/layout.css`: `main padding-block` narrowed; `.hero` asymmetric block padding; `.section` converted to `display: flex; flex-direction: column; gap: var(--space-lg)` single token for h2→grid→trailing-link rhythm. Trailing "more →" links styled via `.section > p:last-child` structural selector — no new class introduced.
- Hamburger (pure-CSS checkbox + `:has()` in `src/styles/nav.css`) confirmed working — DOM node present, CSS rules in bundle, correct breakpoint at 48rem. No code changes needed.

## Next session
Matt browser-reviews today's card layout + home page spacing rhythm at `localhost:3000` (`npm run dev`). If satisfied, replaces Claude-written article markdown with real content, then deploys to Netlify via push. Optional follow-ups in priority order: (1) split `components.css` by component; (2) migrate `theme-toggle.ts` to classList for `.no-transition`; (3) decide carousel + stagger YAGNI; (4) content-hash filenames or shorten cache TTL; (5) WCAG contrast-checker pass on `--color-text-muted`.

## Open questions
- Immutable cache (`Cache-Control: public, max-age=31536000, immutable`) is set on `/*.css` and `/*.js` in `netlify.toml`, but esbuild emits `main.css`/`main.js` without content hashes. Returning visitors will see stale assets for up to a year after a redeploy. Fix: content-hashed filenames (ripples into `base.html` slot) or shorter TTL. Decision deferred to Matt.
- `--color-text-muted` in light mode (`oklch(45% 0.018 260)` on `oklch(96% 0.012 80)`) is ~4.2:1 — passes AA for large text, near-fails for small body text. Needs a real WCAG contrast-checker pass before deploy.
- Palette + typography not yet eyeballed in a real browser — `npm run dev` review pending after today's card fix.
- Article markdown contains Claude-written prose; Matt to replace with real content before deploy.
- Optional: `<link rel="apple-touch-icon">` not present. Non-blocking; add a 180×180 PNG to root statics if iOS home-screen support is wanted.
- `components.css` is ~600 lines. Plan to split by component file (cards, buttons, nav-related, carousel, etc.). Deferred for a dedicated refactor session.
- `theme-toggle.ts` uses `html.style.setProperty('transition', 'none')` + rAF instead of `classList.add/remove('.no-transition')`. Should migrate for consistency; would let `.no-transition` be removed from the lint allowlist.
- Carousel infrastructure (`.carousel-wrapper`, `.carousel-track`, `.carousel-slide`, `src/ts/modules/carousel.ts`) is dormant — no template uses `[data-module="carousel"]`. Decision needed: keep as ready-to-use OR strip as YAGNI. Same question for `.stagger-1..4` animation delay utilities.
- Port 3000 already-in-use on `npm run dev` fails serve but leaves the file watcher running, creating two writers to `dist/`. Not fixed; noted for future session.

## Blockers
- (none)

