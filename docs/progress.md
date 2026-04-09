# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [ ] Phase 5 — Content & templates
- [ ] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-09
- Delegated Phase 4 to `ts-specialist`; all browser-side TS modules in `src/ts/` implemented per `docs/prompts/04-ts-modules.md`
- `src/ts/utils/dom.ts`: typed `qs`, `qsa`, `on` (returns cleanup fn), `create` (element factory)
- `src/ts/main.ts`: DOMContentLoaded bootstrap, `as const satisfies` module registry, dynamic-import-based auto-discovery of `[data-module]`, per-module try/catch to prevent cascade failures
- `src/ts/modules/`: `theme-toggle.ts`, `nav.ts`, `scroll-reveal.ts`, `carousel.ts` — all export `{ mount: (el: HTMLElement) => void }`; cleanup via AbortController where applicable
- `scroll-reveal` early-returns when `CSS.supports('animation-timeline', 'view()')` — lets the native CSS path win on modern browsers at zero JS cost
- `carousel.ts` and `scroll-reveal.ts` inject inline `<style>` at mount time for classes not yet defined in `src/styles/` (`.carousel-*`, `.reveal-*`, `.revealed`, `.no-transition`)
- Reviewer audit PASS on all 10 rule checks after two small fixes (`qsa` replacing raw `querySelectorAll` in scroll-reveal; hex color fallbacks removed from carousel's injected style string)
- `npm run typecheck` + `npm run build` green; `main.js` 2.5 KB gz, `main.css` 5.5 KB gz — within budget
- Fixed `.claude/skills/start-session/SKILL.md` to auto-proceed after reporting status, matching `feedback_start_session_auto` memory

## Next session
Open a fresh session, run `/start-session`, then execute Phase 5 per `docs/prompts/05-content.md`. Before delegating to `content-specialist`, consider a short prefatory `css-specialist` pass to add the missing classes (`.carousel-*`, `.reveal-fade-up`, `.reveal-fade-in`, `.reveal-scale-in`, `.revealed`, `.no-transition`) so `carousel.ts` and `scroll-reveal.ts` can drop their inline `<style>` injection. Then delegate content work to `content-specialist` to implement HTML templates in `src/templates/` and write initial markdown articles/projects in `src/content/`.

## Open questions
- Can `css-specialist` run a short prefatory pass before Phase 5 to add the missing Phase 4 classes so JS-side style injection can be removed?
- Should `scroll-reveal`'s JS-fallback `data-reveal` vocabulary (`fade-up`, `fade-in`, `scale-in`) be reconciled with Phase 3's native CSS `data-reveal` attribute values so there is one vocabulary, not two?
- Is `pretty_urls` + `[[redirects]]` in `netlify.toml` redundant? Revisit in Phase 6.
- Palette and typography not yet reviewed in browser. Run `npm run dev` and eyeball before treating them as locked in.

## Blockers
- (none)
