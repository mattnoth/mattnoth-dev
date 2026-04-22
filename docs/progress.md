# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [x] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-22 (missing-scientists URL migration + project card integration)
- Moved Missing Scientists dossier URL from `/unpublished/missing-scientists/` to `/projects/missing-scientists/` across all build scripts, templates, and TS modules.
- Added `landing?: string` field to `ProjectMeta` interface in `build/markdown.ts`; `projectCard()` in `build/pages.ts` uses it as the card href and skips standalone project.html generation for landing-based projects.
- Created `src/content/projects/missing-scientists.md` (frontmatter-only with `landing` field) so MS appears as a featured project card on home page and projects index.
- Added AI-disclosure / methodology / GitHub-link section to top of Transparency page in `build/missing-scientists.ts`.
- Added 301 redirect in `netlify.toml` from `/unpublished/missing-scientists/*` to `/projects/missing-scientists/:splat`.
- Updated all back-links ("Back to research" → "Back to overview") and breadcrumbs ("Research" → "Overview") across `build/missing-scientists.ts`, `src/templates/ms-diagram.html`, `src/templates/ms-timeline.html`, `src/templates/ms-page.html`.
- Updated BASE constant in `build/missing-scientists.ts`, `src/ts/modules/ms-diagram.ts`, `src/ts/modules/ms-timeline.ts`, and comment path in `src/styles/missing-scientists.css`.

## Next session
Manual browser testing: start dev server, click project card on home page, verify all MS tabs load, check Network tab for 200s on `/projects/missing-scientists/data/*.json` fetches. Then decide on noindex flip timing.

## Open questions
- When to flip `noindex` → `index, follow` and add MS to sitemap (deferred per task spec).
- SEO framing for the dossier before indexing.
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

