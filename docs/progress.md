# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [ ] Phase 4 — TypeScript interactive modules
- [ ] Phase 5 — Content & templates
- [ ] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-09
- Delegated full Phase 3 to `css-specialist`; all 8 CSS partials in `src/styles/` replaced with real implementations (~864 lines source, 994 lines concatenated into `dist/main.css`)
- Cascade layer system in place: `src/styles/main.css` declares `@layer reset, tokens, typography, layout, components, animations, utilities;`; every rule lives inside a layer
- "Workshop at Night" palette committed: amber-orange accent `oklch(68% 0.18 55)` light / `oklch(72% 0.18 58)` dark on warm cream (light) / cool near-black slate (dark); zero hex/rgb/named colors
- Heading font: Fraunces (variable optical-size serif) via `@font-face` from Google CDN with `font-display: swap` and `unicode-range`; falls back to Georgia
- Pure-CSS mobile hamburger in `src/styles/nav.css` via hidden checkbox + `:has()` — no JS required
- Container-query responsive `.card` in `src/styles/components.css` using `container-type: inline-size` + `@container (min-width: 500px)`
- Scroll-driven reveal animation in `src/styles/animations.css` behind `@supports (animation-timeline: view())`; `prefers-reduced-motion` override present in all animated rules
- Build verification green: `npm run typecheck` passes both tsconfigs; `npm run build` completes in ~10ms; `[css] concatenated 8 file(s) → dist/main.css` (994 lines)

## Next session
Open a fresh session, run `/start-session`, then execute Phase 4 from `docs/prompts/04-ts-modules.md` — delegate to `ts-specialist` to implement the real browser-side TypeScript modules in `src/ts/` (main entry, nav, theme-toggle, scroll-reveal, carousel). Each module must export `{ mount: (el: HTMLElement) => void }`.

## Open questions
- Is `pretty_urls` + `[[redirects]]` in `netlify.toml` redundant? Revisit in Phase 6.
- Palette and typography not yet reviewed in browser. Run `npm run dev` and eyeball before treating them as locked in.

## Blockers
- (none)
