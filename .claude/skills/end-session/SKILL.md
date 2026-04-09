---
name: end-session
description: End a matt-site work session cleanly. Produces a structured handoff summary, then delegates to the progress-tracker subagent to update docs/progress.md, docs/knowledge-base.md, and docs/decisions.md. Use at the end of any session, or when the user says "prepare to end session".
---

I want to end this work session cleanly. Do this in order:

1. **Summarize this session** into a handoff package with these fields:
   - **Date:** today's actual date (YYYY-MM-DD)
   - **Phase:** which phase we were in
   - **Accomplished:** 3-8 bullets of what was built/changed, with file paths for major changes
   - **Files modified:** full list (use your tool history, don't guess)
   - **Decisions:** any non-obvious choices made, each with a one-line "why"
   - **Learnings / gotchas:** anything non-obvious that future-me needs to know (not stuff that's clear from reading the code)
   - **Open questions:** things I flagged or you couldn't resolve
   - **Blockers:** anything stopping progress
   - **Next step:** the concrete next action — not "continue building" but e.g. "implement `build/templates.ts` per prompt section 2"

2. **Print the handoff package** so it's visible in the session log, then **immediately delegate** to the `progress-tracker` subagent with the full handoff package in the same turn. Do NOT pause to ask for confirmation — the handoff print and the delegation happen back-to-back without user input. The progress-tracker will update `docs/progress.md`, append to `docs/knowledge-base.md`, and append to `docs/decisions.md` as appropriate.

3. **Do not update the docs yourself** — the progress-tracker owns that file format. Your job is to produce a clean handoff and delegate.

4. **After the progress-tracker reports back**, print a final line:
   ```
   Session ended. Resume with /start-session in your next Claude Code session.
   ```

5. **Do not run builds, tests, or new work after this point.** If the build is broken, say so in "Blockers" — don't try to fix it in the closing session.
