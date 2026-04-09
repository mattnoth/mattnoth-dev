# Phase 5 — Content & Templates

**Owner subagent:** `content-specialist`

---

## Task: Create HTML templates and sample content

### Templates (src/templates/)

#### base.html
- Full HTML5 document:
  - <meta charset="utf-8">, <meta name="viewport">, <meta name="description" content="{{description}}">
  - Open Graph: og:title, og:description, og:type, og:url
  - <link rel="stylesheet" href="/main.css">
  - <script type="module" src="/main.js"></script>
- <body>:
  - <a href="#content" id="skip-link">Skip to content</a>
  - <header> with nav (data-module="nav"):
    - Site name/logo link to /
    - Nav links: Articles, Projects, About
    - Theme toggle button (data-module="theme-toggle", aria-label="Toggle theme")
    - Mobile hamburger toggle (CSS-only via hidden checkbox)
  - <main id="content">{{content}}</main>
  - <footer>: © 2026 Matt · social links (GitHub, LinkedIn, Twitter/X) · "Built with vanilla TS + CSS"
- Use semantic HTML throughout
- All interactive components have appropriate data-module attributes

#### home.html
- Hero section: name (Matt), one-line title ("Software Engineer. Context Engineer. Music Maker."), brief 2-sentence intro
- "Recent Articles" section heading + {{recent_articles}} slot (3 most recent)
- "Featured Projects" section heading + {{featured_projects}} slot
- Sections use data-reveal="fade-up" for scroll animation

#### article.html
- <article> wrapper
- Header: <h1>{{title}}</h1>, <time datetime="{{date}}">{{formatted_date}}</time>, {{reading_time}} min read, tag pills
- <div class="prose">{{content}}</div>
- Back link: ← Back to articles

#### article-list.html
- <h1>Articles</h1>
- {{articles}} slot containing article cards
- Each card: linked title, date, description, tags

#### project.html
- Header: <h1>{{title}}</h1>, tech tags, optional links (Live ↗, GitHub ↗)
- <div class="prose">{{content}}</div>
- Back link: ← Back to projects

#### project-list.html
- <h1>Projects</h1>
- {{projects}} slot containing project cards in a grid

### Sample Content — write as Matt, first person, authentic voice

#### src/content/articles/building-this-site.md
Frontmatter:
```
---
title: "Building This Site with Vanilla TS and Modern CSS"
date: "2026-04-07"
tags: ["typescript", "css", "static-site"]
description: "Why I ditched React and built my personal site with zero framework runtime."
---
```
- 400-500 words
- Talk about coming from Next.js, wanting more control and speed
- Mention the modern CSS features that eliminate the need for Sass
- Include a small code example (TypeScript module pattern or CSS nesting)
- Authentic voice — this is a real engineer writing about real decisions

#### src/content/articles/modern-css-is-amazing.md
Frontmatter with tags: ["css", "web-development", "frontend"]
- 300-400 words
- Cover native nesting, :has(), container queries, scroll-driven animations
- Include CSS code examples
- Enthusiasm for the spec evolution

#### src/content/projects/context-base.md
Frontmatter:
```
---
title: "Context Base"
description: "A structured markdown knowledge repository for grounding AI agents in domain expertise."
tech: ["typescript", "markdown", "ai", "knowledge-engineering"]
featured: true
github: "https://github.com/mattmccarthy"
---
```
- 200-300 words describing the project concept
- What problem it solves, how it works at a high level

#### src/content/projects/mcp-snowflake.md
Frontmatter with tech: ["typescript", "snowflake", "mcp", "ai"]
- 200-300 words about the MCP server for natural language Snowflake querying

### Rules
- All HTML is semantic and accessible
- data-module attributes on interactive elements
- data-reveal attributes on scroll-animated sections
- Templates are minimal — structure and slots only, no inline styles
- Content should feel real and personal, not placeholder lorem ipsum
