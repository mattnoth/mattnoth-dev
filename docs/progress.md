# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [x] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-22 (circle-of-slop article + redacted transform)
- Published `src/content/articles/circle-of-slop.md` from Matt's email text; preserved as-is per his explicit direction ("publishing it as is — the shape of the email, list, and asides formulate the thought itself"). Voice, typos, and inline `[REDACTED]` gags all intentionally kept.
- Added two in-article links: "Dean Pritchard" → villains.fandom.com wiki page; "/r/ThatHappened/" → reddit.com.
- Added `.redacted` censor-bar class to `src/styles/components.css` under `@layer components`: inline-block dark ink bar (`oklch(11% 0.015 260)`) with text color-matched to background; reveals content on hover/focus/focus-within; respects `prefers-reduced-motion`. Colors are hardcoded (not theme tokens) so the bar stays dark regardless of light/dark palette.
- Confirmed H1 convention: article markdown bodies start at the first paragraph; the `#` heading is rendered via the `page_title` template slot (consistent with `cortex-agents.md`).
- Mid-session refactor (Matt-approved): moved the three inline `<span class="redacted">` tags in the article markdown back to plain `[REDACTED]` markers and introduced `transformRedacted()` in `build/markdown.ts` — a post-`marked()` string replacement that converts `[REDACTED]` to `<span class="redacted">REDACTED</span>` automatically. Any future `[REDACTED]` in any article now auto-styles.
- Integrated `transformRedacted` into `build/missing-scientists.ts` via `postProcess`, covering missing-scientists research pages.
- Extended `build/lint-classes.ts` in two ways: (1) added markdown content scanning (`listContentFiles` + `stripFencedCodeBlocks`) so raw inline HTML in `.md` files is visible to the linter; (2) added `"redacted"` to `JS_APPLIED` as a Category 3 entry ("build-time transform classes"). Both are present in the final file — markdown scanning handles future articles with inline HTML classes, allowlist handles the transform-emitted class.
- Changed dev server port 3000 → 3001 in `build/build.ts` to sidestep zombie-watcher collision with concurrent agent sessions.

## Next session
Matt plans to draft a prompt for censor-bar styling tweaks (`.redacted` class in `src/styles/components.css`). No specifics yet — run `/start-session` and check for a prompt from Matt before proceeding.

## Open questions
- Branch scope drift: this session's work landed on `feat/pre-push-safeguard`, which was for an earlier unrelated commit. Before pushing/PR, consider splitting or renaming the branch.
- Matt plans to draft a prompt for censor-bar styling tweaks — no specifics yet. Next session applies them once Matt provides the prompt.
- Addendum wording on `cortex-agents.md` is a first pass — Matt should edit to taste before deploy.
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

