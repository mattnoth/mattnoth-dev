# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [x] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-09 (real content landing + deploy prep)
- Added required frontmatter to Matt's real Cortex Agents article; renamed `src/content/articles/cortext-agents.md` → `src/content/articles/cortex-agents.md` (typo fix); updated frontmatter slug to match.
- Stripped duplicate leading `# heading` + italic subtitle + `---` rule from `cortex-agents.md` — template already renders `<h1>{{page_title}}</h1>`.
- Added a dry italic editor's-note addendum at top of `cortex-agents.md`: notes original January 2026 writing date and that Snowflake's REST API for Cortex Agents is not covered. Kept `date: 2026-04-09` as publish date.
- Deleted three Claude-ghostwritten content files: `src/content/articles/building-this-site.md`, `src/content/articles/modern-css-is-amazing.md`, `src/content/projects/context-base.md`. Learnings from those articles already live in `docs/knowledge-base.md`.
- Tightened between-section vertical rhythm on home page: added `.section + .section { padding-block-start: var(--space-xl) }` nested rule in `src/styles/layout.css` (~line 26). Adjacent-sibling selector ensures only space *between* sections collapses, not the first or last.
- Made cards fully clickable via the stretched `::after` overlay pattern in `src/styles/components.css`: `.card` gets `position: relative`; h2/h3 anchor gets `::after { content: ""; position: absolute; inset: 0; border-radius: inherit }`; `.card .links` gets `position: relative; z-index: 1` to escape the overlay. No new classes, no template changes; `build/lint-classes.ts` reports "34 HTML classes / 49 CSS classes in sync".
- Saved two new memories under `~/.claude/projects/-Users-mnoth-source-mattnoth-dev/memory/`: `feedback_no_ghostwriting.md` and `project_site_positioning.md`; indexed in `MEMORY.md`.

## Next session
Matt does the browser-review pass at `localhost:3000` (`npm run dev`): confirm card-click behavior works end-to-end (including that Live/GitHub buttons on project cards still work independently), confirm tightened section spacing reads right, and decide the fate of `src/content/projects/mcp-snowflake.md` (delete body / delete entry / rewrite later). After that, deploy to Netlify via push.

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

## Blockers
- (none)

