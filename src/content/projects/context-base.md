---
title: "Context Base"
slug: "context-base"
description: "A structured markdown knowledge repository for grounding AI agents in domain expertise."
tech: ["typescript", "markdown", "ai", "knowledge-engineering"]
featured: true
github: "https://github.com/mattnoth/context-base"
---

AI agents are only as useful as the context you give them. The default context window is ephemeral — you paste in some background, the model reasons over it, the conversation ends and the context is gone. The next session starts cold.

Context Base is my answer to that problem. It's a structured repository of markdown files organized to be loaded into AI agent sessions, giving models durable access to domain knowledge, project conventions, team decisions, and operational runbooks. Think of it as the external memory layer that the model itself doesn't have.

## How it works

The repository is plain markdown with a lightweight schema. Each file declares its domain, scope, and recency in a YAML frontmatter block. A TypeScript CLI handles indexing, validation, and serving subsets of the knowledge base on demand.

The key design decision was staying in markdown rather than a vector store or database. Markdown is diffable, reviewable in pull requests, writable by humans without tooling, and readable by models without any preprocessing. The structure comes from conventions in the frontmatter and directory layout, not a schema migration.

For long-form technical content — architecture decisions, integration gotchas, "why we chose X" writeups — markdown is the right format. The context agent reads the index to find relevant files, loads their contents into the context window, and the model reasons over real documentation rather than hallucinating from training data.

## What I learned

The challenge isn't getting models to use context — they're very good at that. The challenge is keeping the context accurate. Stale documentation is worse than no documentation because it gives the model confident wrong answers.

Context Base treats recency as a first-class concern. Files have a `reviewed` date and a `ttl` (time-to-live) field. The CLI surfaces files that are past their TTL and flags them for review. Keeping the knowledge base current is the ongoing work; the tooling just makes that work visible.

Still actively developing this. The next thing I want to add is a diff-aware update workflow that generates a PR description of what changed in the codebase and uses it to prompt updates to the affected context files.
