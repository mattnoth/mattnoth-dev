# matt-site knowledge base

This file is a growing log of non-obvious things future-me needs to know. It is NOT a code documentation file — things already visible in the code belong in the code, not here. This file captures: gotchas, "I wish I'd known this earlier" moments, why we chose X over Y when both seemed fine, and behavior that would surprise a fresh reader.

The `progress-tracker` subagent appends to this file at the end of each session via `/end-session`. Do not hand-edit during work sessions.

---

## Stack decisions

### Why vanilla TS + native CSS
**Date:** 2026-04-09
**Context:** Coming from Next.js, wanted more control, faster builds, Lighthouse 100 without trying.
**Learning:** Modern CSS (nesting, `@layer`, `:has()`, container queries, `oklch()`) has closed the gap with Sass. Modern TS (`satisfies`, `verbatimModuleSyntax`, `erasableSyntaxOnly`) makes custom build scripts ergonomic. The combo gives you framework-free output without the ergonomic tax that used to come with that choice.

---

## Gotchas

### tsconfig `extends` does not inherit `include`
**Date:** 2026-04-09
**Context:** `tsconfig.build.json` extends the root `tsconfig.json`. It was tempting to assume `include` would be inherited.
**Learning:** Each tsconfig's `include` array stands alone — it is not merged or inherited from the base. `tsconfig.build.json` must explicitly set `"include": ["build/**/*"]`. Without this, build scripts would not be typechecked at all.

### `on()` DOM helper requires an internal `EventListener` cast
**Date:** 2026-04-09
**Context:** `src/ts/utils/dom.ts` implements a typed `on<K extends keyof HTMLElementEventMap>()` helper. The handler parameter is typed as `(e: HTMLElementEventMap[K]) => void`.
**Learning:** `HTMLElementEventMap[K]` is not directly assignable to `EventListener`. One `handler as EventListener` cast is required inside the function body when calling `addEventListener`. Call sites remain fully typed; the cast is entirely internal.

---

## Build system

### Phase 1 scaffold does not produce a working build
**Date:** 2026-04-09
**Context:** Phase 1 creates all config, directory structure, and placeholder files. The build entry point `build/build.ts` is currently just a comment stub.
**Learning:** Do not attempt `npm run build` or `npm run dev` until Phase 2 ships the real pipeline. `npm run typecheck` (`tsc --noEmit`) is the correct smoke test for Phase 1 — it works because it only validates types, not the build graph.

### IDE false positives on `node:` imports in `build/`
**Date:** 2026-04-09
**Context:** VSCode resolves `build/*.ts` against the nearest `tsconfig.json`, which targets the browser and lacks `@types/node`.
**Learning:** The editor will show spurious errors on `import "node:fs/promises"` and similar. `npm run typecheck` is authoritative — it runs both tsconfigs explicitly. If the editor noise becomes intolerable, add TS project references (`composite: true` + `references` in root tsconfig) to tell VSCode which config applies to which tree.

### `allowImportingTsExtensions: true` required in `tsconfig.build.json`
**Date:** 2026-04-09
**Context:** `tsx` resolves `.ts` import paths at runtime, so build scripts use `import { foo } from "./markdown.ts"`. `tsc` rejects `.ts` extensions in import specifiers without this flag.
**Learning:** Add `allowImportingTsExtensions: true` to `tsconfig.build.json`. The browser tsconfig does not need it because esbuild handles resolution there.

### `esbuild.ServeResult.hosts` is `string[]` as of esbuild 0.25+
**Date:** 2026-04-09
**Context:** `build/build.ts` reads the dev server host from the esbuild serve result.
**Learning:** `hosts` is an array, not a scalar `host` field. With `noUncheckedIndexedAccess: true` on, the correct pattern is `hosts[0] ?? "localhost"`. Using `host` directly (old API) will error at type-check time.

---

## CSS

_(entries will be added once Phase 3 begins)_

---

## TypeScript modules

_(entries will be added once Phase 4 begins)_

---

## Content pipeline

_(entries will be added once Phase 5 begins)_

---

## Deploy

_(entries will be added once Phase 6 begins)_
