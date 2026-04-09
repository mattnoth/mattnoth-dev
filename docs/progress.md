# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [x] Phase 2 — Build system
- [ ] Phase 3 — CSS architecture
- [ ] Phase 4 — TypeScript interactive modules
- [ ] Phase 5 — Content & templates
- [ ] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-09
- Delegated full Phase 2 pipeline to `build-specialist`; all `build/` stubs from Phase 1 replaced with real implementations
- `build/markdown.ts`: `parseContentDir<T>`, `ArticleMeta`/`ProjectMeta`/`ParsedContent<T>` types, reading time, prod-only draft filter, date-desc sort
- `build/templates.ts`: slot-based string-replacement engine (`renderTemplate`/`renderPage`) with stub detection for Phase 1 comment-only placeholders
- `build/pages.ts`: home, articles list, individual articles, projects list, individual projects — clean URLs (`dist/articles/<slug>/index.html`)
- `build/copy-assets.ts`: recursive `src/assets/` copy + root static files
- `build/build.ts`: 6-step orchestrator with `--dev` flag, per-step timing, `esbuild ctx.serve()` + `ctx.watch()` on `localhost:3000`, scoped `node:fs.watch` rebuilds by file extension
- `tsconfig.build.json` extended with `allowImportingTsExtensions: true`; `package.json` typecheck and build scripts updated to run both tsconfigs
- Resolved spec ambiguity on production sourcemaps: flipped `stepJs(true, false)` → `stepJs(true, true)` in `build/build.ts:95` after user approval
- Smoke tests green: `npm run typecheck` passes both tsconfigs, `npm run build` completes in ~9ms with `dist/main.js`, `dist/main.js.map`, `dist/main.css`

## Next session
Open a fresh session, run `/start-session`, then execute Phase 3 from `docs/prompts/03-css.md` — delegate to `css-specialist` to implement the real CSS architecture (cascade layers, design tokens, typography, layout, components, animations) into `src/styles/`. The build pipeline is ready: `concatCss` will automatically include any partial whose content is not a `/* */`-only stub.

## Open questions
- Is `pretty_urls` + `[[redirects]]` in `netlify.toml` redundant? Revisit in Phase 6.

## Blockers
- (none)
