# matt-site progress

## Phase checklist
- [x] Phase 0 — Meta setup (CLAUDE.md, subagents, slash commands, docs/)
- [x] Phase 1 — Scaffold & config
- [ ] Phase 2 — Build system
- [ ] Phase 3 — CSS architecture
- [ ] Phase 4 — TypeScript interactive modules
- [ ] Phase 5 — Content & templates
- [ ] Phase 6 — Integration, polish, deploy

## Last session — 2026-04-09
- Delegated full Phase 1 scaffold to `build-specialist` in a single pass (including empty stubs in `src/styles/`, `src/ts/`, `src/templates/`, `src/content/` — fanning 4 specialists for empty shells was deemed wasteful)
- Wrote root config files: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `netlify.toml`, `.gitignore`
- Created `build/` tree with placeholder files: `build.ts`, `markdown.ts`, `templates.ts`, `pages.ts`, `copy-assets.ts`
- Created full `src/` tree per `docs/prompts/01-scaffold.md` — templates, styles, ts modules, content/asset dirs with `.gitkeep`
- Implemented the three typed DOM helpers in `src/ts/utils/dom.ts` (`qs`, `qsa`, `on` with cleanup return)
- Ran `npm install` (21 packages, 0 vulnerabilities) and `npm run typecheck` (zero errors) as Phase 1 smoke tests — both green

## Next session
Open a fresh session, run `/start-session`, then execute Phase 2 from `docs/prompts/02-build-system.md` — delegate to `build-specialist` to implement the real build pipeline (markdown parsing, template slots, page generation, esbuild orchestration, dev server with `--dev` flag branching).

## Open questions
- Is `pretty_urls` + `[[redirects]]` in `netlify.toml` redundant? Revisit in Phase 6.

## Blockers
- (none)
