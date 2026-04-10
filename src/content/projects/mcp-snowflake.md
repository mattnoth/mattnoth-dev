---
title: "MCP Snowflake Server"
slug: "mcp-snowflake"
description: "A Model Context Protocol server that lets AI agents query Snowflake using natural language."
tech: ["typescript", "snowflake", "mcp", "ai"]
github: "https://github.com/mattnoth/mcp-snowflake"
featured: false
draft: true
---

Getting useful answers out of a data warehouse usually requires someone who knows SQL, knows the schema, and knows where the interesting data actually lives. That's a lot of institutional knowledge gating access to information that should be broadly available.

This MCP server puts a natural language interface in front of Snowflake. You describe what you want — "show me signups by channel for last month, excluding internal test accounts" — and the model translates it to SQL, runs the query, and returns results in a format you can reason over in the same conversation.

## What MCP buys you

The Model Context Protocol is Anthropic's standard for connecting AI models to external data sources and tools. Instead of copy-pasting query results into a chat window, the model can request data directly during reasoning — calling the Snowflake tool as one step in a multi-step analysis.

The server exposes three tools: `query` (run a SQL statement and return results), `schema` (inspect a table's columns and types), and `search_tables` (find tables matching a description). The model uses `schema` and `search_tables` to orient itself before writing queries, which dramatically improves accuracy on unfamiliar warehouses.

## Schema grounding

The hardest part was teaching the model to generate queries that actually run. Snowflake is strict about quoting, has its own date functions, and warehouse schemas tend to have non-obvious naming conventions. I addressed this with an on-startup schema cache: the server loads table metadata at initialization and injects relevant schema context alongside each query request. The model sees column names, types, and sample values before it writes a single line of SQL.

Query results come back as JSON with a row limit (configurable, default 500). The model can ask for aggregations to stay under the limit, which keeps response times predictable and avoids accidentally streaming 50,000 rows through the context window.

Works with any MCP-compatible client — Claude Desktop, custom agent loops, whatever you're building.
