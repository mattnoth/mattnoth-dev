# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [x] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-10 (home page visual refinement)
- Tightened `.section` vertical padding in `src/styles/layout.css`: `padding-block: 2xl → xl`; consecutive-section override `xl → md`. Comment updated to reflect new math.
- Tightened hero top padding one stop: mobile `xl → lg`, ≥48rem `2xl → xl`; bottom `xl` preserved. (`src/styles/layout.css`)
- Deleted dead `@container` block from `.about` in `src/styles/layout.css` — the block was a no-op because an element cannot query its own container. Removed `container-type`/`container-name` from `.about` and simplified the comment to reflect stacked-only intent.
- Split about bio from two paragraphs into three in `src/templates/home.html`; removed `max-inline-size: 75ch` and `margin-inline: auto` from `.about__text` so text aligns to the photo's left edge.
- Split hero lead into two `<p class="hero__lead">` elements in `src/templates/home.html`; added `.hero__lead:has(+ .hero__lead) { margin-block-end: var(--space-sm); }` in `src/styles/layout.css` to tighten inter-sentence gap while preserving `xl` gap before `.hero__actions`.
- Fixed header nav centering in `src/styles/nav.css` and `src/styles/layout.css`: switched `.site-header .container` to `grid-template-columns: 1fr auto 1fr` at ≥48rem with `justify-self: start` on `.nav__logo` and `justify-self: end` on `.nav__controls`. Removed dead `margin-inline: auto` from `.nav__links`.

## Next session
Home page visual polish is complete and shipping-ready. Next work is content-driven: whichever real article or project Matt wants to land next. Outstanding pre-production candidates: (1) optimize image delivery — convert `matt-beach-jpg-smaller.jpg` to webp + `<picture srcset>` in `src/templates/home.html`; (2) decide fate of `src/content/projects/mcp-snowflake.md` (ghostwritten prose); (3) decide Projects page presentation with ~0–1 real entries; (4) address immutable cache / content-hash issue in `netlify.toml`.

## Open questions
- `src/content/projects/mcp-snowflake.md` has Claude-ghostwritten prose in the body (same pattern as deleted articles). Options: (A) delete body, keep frontmatter + title only (needs a template or fallback tweak since `project.html` expects a body), (B) delete the project entirely, (C) leave it and rewrite later. Decision needed before deploy.
- With `context-base` deleted and `mcp-snowflake` questionable, Projects section is functionally empty for launch. Decision needed on how to present the Projects page with ~0–1 real entries.
- Addendum wording on `cortex-agents.md` is a first pass — Matt should edit to taste before deploy.
- Immutable cache (`Cache-Control: public, max-age=31536000, immutable`) is set on `/*.css` and `/*.js` in `netlify.toml`, but esbuild emits `main.css`/`main.js` without content hashes. Returning visitors will see stale assets for up to a year after a redeploy. Fix: content-hashed filenames (ripples into `base.html` slot) or shorter TTL. Decision deferred to Matt.
- `--color-text-muted` in light mode (`oklch(45% 0.018 260)` on `oklch(96% 0.012 80)`) is ~4.2:1 — passes AA for large text, near-fails for small body text. Needs a real WCAG contrast-checker pass before deploy.
- Optional: `<link rel="apple-touch-icon">` not present. Non-blocking; add a 180×180 PNG to root statics if iOS home-screen support is wanted.
- `components.css` is ~600 lines. Plan to split by component file (cards, buttons, nav-related, carousel, etc.). Deferred for a dedicated refactor session.
- `theme-toggle.ts` uses `html.style.setProperty('transition', 'none')` + rAF instead of `classList.add/remove('.no-transition')`. Should migrate for consistency; would let `.no-transition` be removed from the lint allowlist.
- Carousel infrastructure (`.carousel-wrapper`, `.carousel-track`, `.carousel-slide`, `src/ts/modules/carousel.ts`) is dormant — no template uses `[data-module="carousel"]`. Decision needed: keep as ready-to-use OR strip as YAGNI. Same question for `.stagger-1..4` animation delay utilities.
- Port 3000 already-in-use on `npm run dev` fails serve but leaves the file watcher running, creating two writers to `dist/`. Not fixed; noted for future session.
- `src/assets/images/matt-beach.png` (651KB original) still ships to dist. Not needed since `matt-beach-jpg-smaller.jpg` is in use. Safe to delete if no other consumer references the PNG.

## Blockers
- (none)

