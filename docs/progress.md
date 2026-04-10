# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [x] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-10 (GitHub remote + Netlify repo swap)
- Linked local repo to new GitHub remote at `https://github.com/mattnoth/mattnoth-dev.git`; pushed `main` with upstream tracking (`git push -u origin main`).
- Walked through Netlify's "Link to a different repository" flow under Site configuration → Build & deploy → Continuous deployment → Manage repository. Swapped existing Netlify site onto the new repo, preserving site ID, custom domain, env vars, and deploy history.
- During the repo swap, corrected the Netlify UI publish directory from `public/` to `dist` to match `netlify.toml`.
- Confirmed `NODE_VERSION=22` does not need a Netlify UI env var — it is already pinned in `netlify.toml`.
- No tracked files were modified; working tree was clean at commit `0c65bbe` for the entire session. All changes were git remote state and Netlify dashboard state only.
- Site confirmed live on Netlify under the new repo link.

## Next session
Matt flagged "a few other things" to fix before pushing to main (which will trigger a Netlify rebuild on the newly-linked repo). Run `/start-session`, ask Matt what those items are, implement them, commit, and `git push origin main`. Optional pre-production items still outstanding: image delivery (webp + `<picture srcset>`), content-hash filenames to resolve immutable cache risk, WCAG contrast check on `--color-text-muted`.

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

