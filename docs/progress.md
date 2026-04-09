# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [ ] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-09
- CSS prefatory pass: carousel component styles added to `src/styles/components.css`; reveal fallback classes (`.reveal-fade-up`, `.reveal-fade-in`, `.reveal-scale-in`, `.revealed`, `.no-transition`) added to `src/styles/animations.css` gated by `@supports not (animation-timeline: view())`; `data-reveal="fade-up"` mirrored into the native CSS path via selector alias on the `slide` rule
- Six HTML templates shipped in `src/templates/`: `base.html`, `home.html`, `article.html`, `article-list.html`, `project.html`, `project-list.html` — semantic HTML, skip link, OG tags, `data-module` wiring for nav/theme-toggle/scroll-reveal
- Four sample markdown files added under `src/content/`: `articles/building-this-site.md`, `articles/modern-css-is-amazing.md`, `projects/context-base.md`, `projects/mcp-snowflake.md` — full frontmatter, real prose (kept per Matt's direction; see prospective rule change)
- Build pipeline now generates 7 real pages: home, articles list, 2 articles, projects list, 2 projects; `main.css` ~5.97 KB gz (up from 5.5 KB baseline)
- `build/pages.ts` slot contract expanded: added `page_title` (raw h1, no site-name suffix), `page_url` (canonical absolute URL for `og:url`), `SITE_ORIGIN = "https://mattnoth.dev"` constant; dropped dead `meta` slot
- Reviewer audit found 3 blocking fixes (all landed): `og:url` meta tag in `base.html`, `<h1>` suffix decoupling via `page_title` slot, `data-reveal="fade-up"` in native CSS path
- `CLAUDE.md` updated: new "Phase execution rules" section (vocabulary reconciliation, slot pre-flight, dependency graph, CSS class constraint); Voice rule clarified — "no lorem ipsum" applies to deploy-ready content only
- `docs/prompts/05-content.md` rewritten to spec lorem-ipsum scaffolding instead of real prose

## Next session
Open Phase 6 per `docs/prompts/06-polish-deploy.md`. Before the first delegation, apply the "Phase execution rules" from `CLAUDE.md`: (1) write the dependency graph for the phase, (2) reconcile remaining `data-reveal` vocabulary drift as the first delegation (only `fade-up` was fixed this session; `fade-in`, `scale-in`, `slide`, `scale` still split), (3) CSS gap fill for the 12 template-referenced classes with no rules (`.article-header`, `.article-meta`, `.article-footer`, `.project-header`, `.project-links`, `.project-footer`, `.page-header`, `.page-header__lead`, `.nav__controls`, `.back-link`, `.reading-time`, `.tech-stack`), (4) browser review of palette + typography via `npm run dev`, (5) deploy prep (`netlify.toml` audit, real articles by Matt).

## Open questions
- Full cross-phase `data-reveal` vocabulary reconciliation: only `fade-up` fixed this session; `fade-in`, `scale-in` (JS vocabulary) vs `slide`, `scale` (Phase 3 native vocabulary) remain split. Templates should only use `fade-up` until Phase 6 completes reconciliation.
- 12 template-referenced CSS classes with no rules: `.article-header`, `.article-meta`, `.article-footer`, `.project-header`, `.project-links`, `.project-footer`, `.page-header`, `.page-header__lead`, `.nav__controls`, `.back-link`, `.reading-time`, `.tech-stack` — Phase 6 styling pass needed.
- Palette + typography not yet eyeballed in browser — needs `npm run dev` and real review before treating them as locked in.
- `netlify.toml` `pretty_urls` + `[[redirects]]` redundancy — deferred to Phase 6.
- Current articles contain full Claude-written prose; should be replaced by Matt with real content per updated scaffolding rule before deploy.

## Blockers
- (none)

