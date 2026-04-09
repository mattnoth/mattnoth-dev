# matt-site decisions log

ADR-lite. Each entry is a dated decision with context, the choice made, and consequences. The `progress-tracker` subagent appends to this file at the end of sessions where a non-obvious decision was made. Do not hand-edit during work sessions.

Only log decisions that are **non-obvious or reversible**. "We used TypeScript" is not decision-worthy. "We rejected Shiki in favor of no syntax highlighting for Phase 1 to shorten the critical path" is.

---

## 2026-04-09 — Use Claude Code subagents for domain isolation, not parallelism
**Context:** Matt is new to Claude Code and wanted to try subagents on this project. The 6-prompt build chain could be run as one big session or as 6 sessions with specialized subagents per domain.
**Decision:** Six specialist subagents (`build-specialist`, `css-specialist`, `ts-specialist`, `content-specialist`, `reviewer`, `progress-tracker`) scoped to single directories with forbidden-directory rules. Phases run sequentially, one per Claude Code session.
**Consequences:** Enforces separation of concerns via tooling, not discipline — the CSS agent cannot touch TypeScript because its system prompt forbids it and its tool access is narrow. Cost: more files to maintain in `.claude/agents/`. Benefit: future phases stay clean even when the main context is deep.

## 2026-04-09 — In-repo docs/ + memory pointers for growing context
**Context:** Need a persistent, growing knowledge base + progress tracker that survives session boundaries without bloating active context.
**Decision:** Source of truth is `docs/progress.md`, `docs/knowledge-base.md`, `docs/decisions.md` committed to the repo. Claude Code memory (`~/.claude/projects/.../memory/`) holds only pointers telling future sessions to read these files.
**Consequences:** Docs are portable (GitHub-visible, machine-transferable, greppable, version-controlled). Memory stays small and focused. Cost: the workflow depends on `/end-session` being run religiously — if it's skipped, `progress.md` drifts from reality.

## 2026-04-09 — Package manager: npm over yarn
**Context:** The project has ~6 devDeps. Choosing between npm and yarn (Classic vs Berry) before any install.
**Decision:** npm.
**Consequences:** Node 22 npm is fast enough for this tree size. Yarn Berry vs Classic is extra cognitive load with no payoff here. Netlify defaults to npm, so staying on npm avoids one config drift risk. If the dep tree grows substantially, revisit.

## 2026-04-09 — Single `dev` script entry point, flag-based
**Context:** Phase 2 needs a dev server (esbuild `ctx.serve()` + `ctx.watch()`) in addition to the production build path.
**Decision:** `dev` script is `tsx build/build.ts --dev`. No separate `build/dev.ts`. Phase 2 will branch on the `--dev` flag inside `build/build.ts`.
**Consequences:** One entry point to maintain. The flag-check is a small amount of branching logic inside `build.ts`. Rules out a clean `dev.ts` / `build.ts` separation if the two paths ever diverge significantly — acceptable trade-off for now.

## 2026-04-09 — `build` script gates on typecheck
**Context:** The production build script needs to not ship type errors silently.
**Decision:** `"build": "tsc --noEmit && tsx build/build.ts"`. Typecheck must pass before esbuild runs.
**Consequences:** Production builds fail fast on type errors. Local `npm run build` is slightly slower than `tsx build/build.ts` alone. `npm run typecheck` is still available as the standalone check.

## 2026-04-09 — Single-agent scaffold pass for Phase 1
**Context:** CLAUDE.md enforces strict directory ownership (4 specialists own `src/styles/`, `src/ts/`, `src/templates/`, `src/content/` respectively). Phase 1 only creates empty stubs in those directories.
**Decision:** `build-specialist` took the full Phase 1 skeleton in one pass, including empty stubs in other specialists' directories.
**Consequences:** Pragmatic for Phase 1 since writing empty `.gitkeep` files and HTML shells doesn't constitute real domain work. Real code in those directories starts in Phases 3–5 and must go through the correct specialist. Sets a precedent to watch — do not let this pattern bleed into phases where real code is written.

## 2026-04-09 — `noEmit: true` duplicated in `tsconfig.build.json`
**Context:** `tsconfig.build.json` extends root `tsconfig.json` which already sets `noEmit: true`. The field was explicitly repeated in the extended config.
**Decision:** Keep the explicit duplication.
**Consequences:** Protects against accidental emit if someone edits the base config later and removes `noEmit`. Slight redundancy is worth the safety. No other consequences.

## 2026-04-09 — `pretty_urls` + `[[redirects]]` fallback in `netlify.toml` (deferred review)
**Context:** `netlify.toml` has both `pretty_urls = true` under `[build.processing]` and a `[[redirects]]` catch-all rule. These may be redundant.
**Decision:** Leave both in for now. Deferred trimming to Phase 6 polish once we can test routing on a real deploy.
**Consequences:** Possible redundant config with no runtime harm. Must revisit in Phase 6 or first deploy.

## 2026-04-09 — Defer syntax highlighting (Shiki) until after Phase 1 ships
**Context:** The original outline doesn't include syntax highlighting for code blocks in articles. Shiki would do this at build time (zero client JS) with ~10 lines of code in `build/markdown.ts`.
**Decision:** Leave it out of Phases 1-6. Add it as the first post-launch enhancement once the rest of the site is live.
**Consequences:** Code blocks in early articles render as flat monospace text — readable but visually plain. Easy to add later without touching any other code. No rush.
