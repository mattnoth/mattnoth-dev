# Phase 1 — Project Scaffold & Configuration

**Owner subagent:** `build-specialist`

---

## Task: Initialize project scaffold and configuration

Create the full directory structure at the project root (`/Users/mnoth/source/mattnoth-dev/`).

### 1. package.json
- Name: matt-site
- Type: "module"
- Scripts:
  - "dev": runs the dev server (esbuild serve + watch + build)
  - "build": full production build (type check + build)
  - "typecheck": "tsc --noEmit"
  - "clean": removes dist/
- Dev dependencies: typescript, esbuild, gray-matter, marked, @types/node, tsx
- No runtime dependencies

### 2. tsconfig.json (browser code)
- Target: ES2022
- Module: ES2022
- ModuleResolution: bundler
- Strict: true
- verbatimModuleSyntax: true
- erasableSyntaxOnly: true
- noEmit: true (type checking only — esbuild handles emit)
- Include: ["src/**/*"]
- DOM and DOM.Iterable libs

### 3. tsconfig.build.json (build scripts — Node target)
- Extends tsconfig.json
- Override target: ES2022
- Override module: Node16
- Override moduleResolution: Node16
- Include: ["build/**/*"]

### 4. netlify.toml
- Build command: npm run build
- Publish directory: dist
- Configure pretty URLs (trailing slash)
- Cache headers: fonts + images = 1 year immutable; CSS/JS = 1 year immutable (filenames will be content-hashed by esbuild)
- Security headers: X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin

### 5. Create all directories and placeholder files
- Every directory from the architecture diagram in CLAUDE.md
- Each file gets a brief comment explaining its purpose
- src/ts/utils/dom.ts should have typed helper stubs:
  - qs<T extends Element>(selector: string, parent?: ParentNode): T | null
  - qsa<T extends Element>(selector: string, parent?: ParentNode): T[]
  - on<K extends keyof HTMLElementEventMap>(el: EventTarget, event: K, handler: (e: HTMLElementEventMap[K]) => void, options?: AddEventListenerOptions): () => void
- .gitignore: node_modules, dist, .DS_Store

### Style rules
- No enums — use `as const` objects
- Use `import type` for all type-only imports
- Use `satisfies` where it adds value
- Prefer `const` assertions for config objects

---

## Target directory layout

```
/Users/mnoth/source/mattnoth-dev/
├── src/
│   ├── content/
│   │   ├── articles/              # Markdown articles with frontmatter
│   │   └── projects/              # Markdown project descriptions
│   ├── templates/
│   │   ├── base.html              # Root HTML shell (head, nav, footer)
│   │   ├── home.html
│   │   ├── article.html
│   │   ├── article-list.html
│   │   ├── project.html
│   │   └── project-list.html
│   ├── styles/
│   │   ├── main.css               # Entry — @layer declarations + @import
│   │   ├── reset.css
│   │   ├── tokens.css
│   │   ├── typography.css
│   │   ├── layout.css
│   │   ├── nav.css
│   │   ├── components.css
│   │   └── animations.css
│   ├── ts/
│   │   ├── main.ts                # Entry — discovers and mounts modules
│   │   ├── modules/
│   │   │   ├── scroll-reveal.ts
│   │   │   ├── nav.ts
│   │   │   ├── carousel.ts
│   │   │   └── theme-toggle.ts
│   │   └── utils/
│   │       └── dom.ts
│   └── assets/
│       ├── images/
│       └── fonts/
├── build/
│   ├── build.ts
│   ├── markdown.ts
│   ├── templates.ts
│   ├── pages.ts
│   └── copy-assets.ts
├── dist/                          # Build output (gitignored)
├── netlify.toml
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── .gitignore
```
