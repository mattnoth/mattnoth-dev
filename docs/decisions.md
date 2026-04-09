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

## 2026-04-09 — Defer syntax highlighting (Shiki) until after Phase 1 ships
**Context:** The original outline doesn't include syntax highlighting for code blocks in articles. Shiki would do this at build time (zero client JS) with ~10 lines of code in `build/markdown.ts`.
**Decision:** Leave it out of Phases 1-6. Add it as the first post-launch enhancement once the rest of the site is live.
**Consequences:** Code blocks in early articles render as flat monospace text — readable but visually plain. Easy to add later without touching any other code. No rush.
