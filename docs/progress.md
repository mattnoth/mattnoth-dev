# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [x] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-10 (social links, draft flag, empty-state polish)
- External-link hygiene: moodsmith `<a>` in `src/templates/home.html:25` gained `target="_blank"` + `rel="noopener noreferrer"`.
- Removed trailing `---` from `src/content/articles/cortex-agents.md`; dropped `.article-footer` top border and padding in `src/styles/components.css` (lines 403-407) — border sat too close to page footer.
- Removed `.hero` `border-block-end` from `src/styles/layout.css:84` so hero flows into about section without a visual rule between buttons and photo.
- Introduced data-driven footer social links in `build/pages.ts`: `SocialLink` type, `SOCIAL_LINKS` array with `{ label, href, enabled }`, `SOCIAL_LINKS_HTML` builder, `BASE_SLOTS` spread into every `generatePage` call. `src/templates/base.html` footer `<ul class="nav__links">` now renders from `{{social_links}}` slot. X present but `enabled: false`.
- Updated LinkedIn to canonical `https://www.linkedin.com/in/mattnoth/` in `src/templates/base.html`.
- Added `draft?: boolean` to `ProjectMeta` and parsed it in `parseProjectMeta` in `build/markdown.ts`; existing production-only filter at `build/markdown.ts:165-170` handles runtime filtering. Marked `src/content/projects/mcp-snowflake.md` as `draft: true`.
- Added `EMPTY_PROJECTS_HTML` constant in `build/pages.ts` rendering `<p class="empty-state">…</p>` when project lists are empty; added `.empty-state` rule in `src/styles/components.css` with `grid-column: 1 / -1`, muted color, centered text, `padding-block: var(--space-xl)`.
- Production build confirmed green: 38 HTML classes / 53 CSS classes in sync, sitemap 4 URLs, `dist/projects/mcp-snowflake/` absent, empty-state renders on both project surfaces.

## Next session
No engineering work is queued. Site is production-ready with one real article (`cortex-agents`) and an empty-state projects section. Next move is content: either (1) write a real project to replace the `mcp-snowflake` placeholder — flip `draft: false` or delete `src/content/projects/mcp-snowflake.md` and add a real file, or (2) write a new article. Run `/start-session` and ask Matt what he wants to tackle. Optional pre-production items still outstanding: image delivery (webp + `<picture srcset>`), content-hash filenames to resolve immutable cache risk, WCAG contrast check on `--color-text-muted`.

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
- `src/assets/images/matt-beach.png` (651KB original) still ships to dist. Not needed since `matt-beach-jpg-smaller.jpg` is in use. Safe to delete if no other consumer references the PNG.

## Blockers
- (none)

