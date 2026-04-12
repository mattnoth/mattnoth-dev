# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [x] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-12 (home page + footer copy revisions)
- Removed "Email me @ matt.j.noth@gmail.com…" line from hero in `src/templates/home.html`. Hero now ends at "an actual human, and can prove it."
- Rewrote about paragraph 2 in `src/templates/home.html` to: "Lately I've been building AI infrastructure for coding agents. Designing multi-agent workflows, building custom MCP servers to interface with our stack, and engineering the context layer that ties them together." Matt trimmed "That's meant" from the second sentence, leaving it as a gerund fragment.
- Iterated ~15 labeled options (A–O plus fragment cuts) on about paragraph 2 wording before landing. Phrase "structured domain knowledge, routing, trust-ranked context" was reserved for Matt's Harness AI project brief and could not be used in about copy.
- Matt rejected "Software engineer. Context engineer. Keyboard player." as a replacement hero tagline after seeing it on the site. Hero is lighter with no replacement tagline.

## Next session
Decide whether to split about paragraph 2 into two `<p>` tags (thesis sentence + gerund-list caption). Visual check in the dev server — about section would go from 3 blocks to 4. Then either delegate the split to `content-specialist` or close the question. Run `/start-session`.

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
- Split about paragraph 2 into two `<p>` tags (thesis + gerund-list caption)? Matt asked, main agent endorsed; not committed. 30-second decision next session — visual check in dev server first.
- `main { padding-block: var(--space-md); }` in `src/styles/layout.css:20` contributes `space-md` above the hero on mobile. Deferred — affects every page including articles.

## Blockers
- (none)

