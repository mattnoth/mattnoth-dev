# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [x] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-10 (about section, mobile polish, table styles, overflow fix)
- Added about section to home page (`src/templates/home.html`): beach photo left / bio text right on wide viewports, stacked on mobile via container query. Three new BEM classes: `.about`, `.about__photo`, `.about__text`.
- Wired Matt's authored bio copy (C#/.NET, ELT pipelines, MCP/multi-agent) and moodsmith music link into the about section. Used Matt's writing directly.
- Implemented responsive layout for `.about` in `src/styles/layout.css` using container query (`container-type: inline-size`) — consistent with CLAUDE.md rule of container queries for component-scoped responsive, media queries for page-level layout.
- Tightened mobile vertical padding: `.about` uses `--space-md` base promoted to `--space-xl` at wide; hero `padding-block-start` drops from `2xl` to `xl` on mobile.
- Fixed article page horizontal overflow bug (`src/styles/layout.css`): added `grid-template-columns: minmax(0, 1fr)` to `body` grid — corrects the root cause (implicit auto grid track) rather than masking with `overflow: hidden` on a child.
- Added `.prose table` styles to `src/styles/typography.css`: scrollable-island idiom (`display: block; overflow-x: auto`), borders, zebra rows — handles wide tables in the Cortex Agents article.
- Used `matt-beach-jpg-smaller.jpg` (347KB) over `matt-beach.png` (651KB) for the about photo.

## Next session
Continue post-Phase 6 polish. Candidates: (1) optimize image delivery — convert `matt-beach-jpg-smaller.jpg` to webp and add `srcset` / `<picture>` in `src/templates/home.html`; (2) decide the fate of `src/content/projects/mcp-snowflake.md` (ghostwritten prose; options: delete body, delete entry, rewrite later); (3) decide presentation of Projects page with ~0–1 real entries; (4) address immutable cache / content-hash issue in `netlify.toml` before treating the site as production-ready.

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

