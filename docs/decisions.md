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

## 2026-04-09 — Production sourcemaps always on
**Context:** Phase 2 prompt listed sourcemap as a core esbuild option alongside minify, but the `--dev` flag bullet read as dev-only enablement. Ambiguous spec.
**Decision:** Sourcemaps on in both dev and prod (`build/build.ts` calls `stepJs` with sourcemap=true unconditionally).
**Consequences:** This is a personal site with a public GitHub repo — the "information disclosure" tradeoff is zero. Prod debugging gets real file/line numbers instead of `main.js:1:N`. Adds a few KB to each Netlify deploy. Do not reconsider unless the codebase becomes proprietary.

## 2026-04-09 — Stub detection in templates and CSS concat for phase-gated builds
**Context:** Phase 1 left comment-only HTML templates and `/* */`-only CSS partials as placeholders. Running the Phase 2 build against them would either crash or emit empty pages.
**Decision:** `build/templates.ts` treats any template whose content is an HTML comment with no `{{slot}}` markers as not-yet-implemented and skips page generation. `concatCss` skips CSS files whose trimmed content starts with `/*`.
**Consequences:** The build pipeline runs green against Phase 1 empty shells. Phases 3 and 5 will be picked up automatically once real content replaces the stubs — no build changes needed. Watch for accidentally skipping a file that should be included but looks like a stub.

## 2026-04-09 — Dual watcher strategy for dev server (esbuild + node:fs.watch)
**Context:** esbuild's `ctx.serve()` + `ctx.watch()` handles JS/CSS bundling incrementally, but markdown and HTML template changes require a full pages rebuild that esbuild cannot express natively.
**Decision:** Two watchers in `build/build.ts`: esbuild's for JS/CSS, and `node:fs.watch` scoped by file extension for markdown/HTML/CSS triggers that call the relevant build step directly.
**Consequences:** Scoped rebuilds without over-rebuilding (CSS change → CSS step only, `.md` change → pages step only). The two watchers are independent — if esbuild's watcher fires a CSS rebuild at the same time as the `fs.watch` CSS trigger, both may run concurrently. Acceptable for a personal site with no concurrent editors.

## 2026-04-09 — Main agent made one-line sourcemap edit directly (bypassing build-specialist)
**Context:** After `reviewer` flagged the sourcemap issue, `SendMessage` to the warm build-specialist was not available in this harness. Spawning a fresh subagent to flip one boolean would cold-start a full context load.
**Decision:** Main agent edited `build/build.ts:95` directly after explicit user approval.
**Consequences:** One-off exception. Does not change the directory ownership rule going forward. Any future edits to `build/` must go through `build-specialist`.

## 2026-04-09 — "Workshop at Night" amber-orange palette (hue ~55) over purple/teal defaults
**Context:** CLAUDE.md mandates a distinctive, non-generic color palette. Purple gradients and teal are the two most common defaults for developer personal sites.
**Decision:** Amber-orange accent at `oklch(68% 0.18 55)` (light) / `oklch(72% 0.18 58)` (dark), on warm cream (light mode) and cool near-black slate (dark mode). All colors expressed as `oklch()` or `color-mix(in oklch, …)`.
**Consequences:** Palette reads warm and direct without reading corporate. Commits future CSS work to staying within oklch — no hex or rgb fallbacks. Palette has not yet been reviewed in a real browser; may be adjusted before Phase 6.

## 2026-04-09 — Fraunces as heading font
**Context:** Needed a heading font with editorial personality that is not on the banned list (Inter, Roboto, Space Grotesk). Fraunces is a variable optical-size serif with a quirky display personality.
**Decision:** Fraunces for all headings, loaded via `@font-face` from Google CDN with `unicode-range`. Body text stays in the system-ui stack.
**Consequences:** Adds one external CDN request per page load (mitigated by `font-display: swap` and Google's CDN performance). Commits the typographic identity of the site to a serif display font for headings. Self-hosting path documented in knowledge base if needed.

## 2026-04-09 — `--color-on-accent` as a fixed non-theme-flipping token
**Context:** The amber accent background is the same hue in both light and dark modes. Button text on that background must be dark in both modes.
**Decision:** `--color-on-accent` is defined as a fixed dark value in `:root` and is not overridden in `prefers-color-scheme: dark`. It does not reference `--color-bg`.
**Consequences:** Any future color scheme refactors must not naively map all foreground/background tokens through the dark-mode swap — accent-on tokens are a separate category that must be reviewed independently.

## 2026-04-09 — `@layer components` shared across `nav.css` and `components.css`
**Context:** Nav and card/component styles are authored in separate files but both belong semantically in the components layer of the cascade.
**Decision:** Both files write into `@layer components { … }`. The CSS cascade merges same-named layer blocks in source order.
**Consequences:** The split is purely organizational — to a browser there is one `components` layer. Future maintainers must know this is intentional; it is not a mistake or a naming collision.

## 2026-04-09 — One `!important` accepted in `animations.css` inside `prefers-reduced-motion`
**Context:** The project's CSS rules prohibit `!important`. The `prefers-reduced-motion: reduce` override block needs to defeat any inline or JS-set animation values that may have already been applied.
**Decision:** Allow a single `!important` exception inside `@media (prefers-reduced-motion: reduce)` in `src/styles/animations.css`. This is the established a11y pattern for motion overrides.
**Consequences:** Creates a documented exception to the no-`!important` rule. Future CSS authors must not use this as a precedent for general-purpose `!important` usage — it applies only to accessibility motion overrides.
