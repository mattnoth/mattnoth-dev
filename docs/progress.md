# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [x] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-10 (hero redesign exploration + photo/memory cleanup)
- Explored replacing the beach photo with a new blazer portrait and moving to a right-hand hero column layout. Tabled — Matt decided to keep the beach photo.
- Deleted `src/assets/images/matt-beach.png` (651KB, unused). The referenced file `matt-beach-jpg-smaller.jpg` remains.
- Updated memory files `project_site_positioning.md` and `project_moodsmith.md` in `~/.claude/projects/-Users-mnoth-source-mattnoth-dev/memory/` to remove "different kinda guy" phrasing and other overclaiming personality framing. Memory files live outside the repo.
- No code landed. Working tree change is the deleted PNG (unstaged at session end).

## Next session
No specific items scoped. Matt has articles "less intensive than Cortex Agents" in progress and a CV page planned but not scoped. Run `/start-session` and ask what's next.

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

## Blockers
- (none)

