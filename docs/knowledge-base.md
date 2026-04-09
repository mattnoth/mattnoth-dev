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

_(none yet — entries will be added as they come up)_

---

## Build system

_(entries will be added once Phase 2 begins)_

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
