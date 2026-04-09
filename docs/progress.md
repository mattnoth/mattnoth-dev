# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [x] Phase 3 — CSS architecture
- [x] Phase 4 — TypeScript interactive modules
- [x] Phase 5 — Content & templates
- [x] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-09 (Phase 6)
- Baseline verified: typecheck + build clean; 10 expected dist files; bundle budgets healthy
- `data-reveal` vocabulary fully reconciled in `src/styles/animations.css`: explicit selectors for `fade-up`, `fade-in`, `scale-in`; dead `slide`/`scale` aliases removed
- 12 previously-unstyled template classes added to `src/styles/components.css` with `prefers-reduced-motion` overrides: `.article-header`, `.article-meta`, `.article-footer`, `.project-header`, `.project-links`, `.project-footer`, `.page-header`, `.page-header__lead`, `.nav__controls`, `.back-link`, `.reading-time`, `.tech-stack`
- `build/sitemap.ts` (NEW): `generateSitemap(articles, projects)` writes `dist/sitemap.xml` with 7 URLs and `<lastmod>` on articles; `SITE_ORIGIN` exported from `build/pages.ts` and reused; wired into `build/build.ts` as `stepSitemap` after `stepPages`
- `src/robots.txt` (NEW) and `src/favicon.svg` (NEW — amber "M" rounded-rect using `oklch(68% 0.18 55)`); `build/copy-assets.ts` root-statics loop extended to pick up `favicon.svg`
- `netlify.toml` audited: `[[redirects]]` block removed (was rewriting `/main.css` → `/main.css/index.html`); short-TTL cache headers added for sitemap and robots
- `src/templates/base.html` favicon wired to `/favicon.svg` with `type="image/svg+xml"` replacing inline data-URI placeholder
- Heading hierarchy fix: `articleCard`/`projectCard` in `build/pages.ts` parameterized with `HeadingLevel`; home page passes `'h3'` (cards under section `h2`), list pages pass `'h2'` (cards under page `h1`); all call sites use explicit arrow functions to avoid `.map(fn)` positional-argument footgun
- `README.md` (NEW): project description, stack table, scripts, content-authoring guide, architecture tree
- Reviewer audit run: performance, a11y, progressive-enhancement checks largely PASS; heading-hierarchy blocking fix landed (above); two non-blocking nits remain (cache TTL, muted-color contrast)

## Next session
Run `npm run dev` and do a browser review of palette, typography, reveal animations, and page layouts across all 7 generated pages. After visual review, Matt replaces Claude-written article markdown with real content. Then deploy via push-to-Netlify. Two optional follow-ups before deploy: (1) add content-hashed filenames to esbuild output (or shorten cache TTL from immutable) to fix stale-asset risk; (2) run a real WCAG contrast-checker pass on `--color-text-muted` in light mode.

## Open questions
- Immutable cache (`Cache-Control: public, max-age=31536000, immutable`) is set on `/*.css` and `/*.js` in `netlify.toml`, but esbuild emits `main.css`/`main.js` without content hashes. Returning visitors will see stale assets for up to a year after a redeploy. Fix: content-hashed filenames (ripples into `base.html` slot) or shorter TTL. Decision deferred to Matt.
- `--color-text-muted` in light mode (`oklch(45% 0.018 260)` on `oklch(96% 0.012 80)`) is ~4.2:1 — passes AA for large text, near-fails for small body text. Needs a real WCAG contrast-checker pass before deploy.
- Palette + typography not yet eyeballed in a real browser — `npm run dev` review pending.
- Article markdown contains Claude-written prose; Matt to replace with real content before deploy.
- Optional: `<link rel="apple-touch-icon">` not present. Non-blocking; add a 180×180 PNG to root statics if iOS home-screen support is wanted.

## Blockers
- (none)

