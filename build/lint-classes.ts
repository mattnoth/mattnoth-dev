import { readdir, readFile } from "node:fs/promises";
import type { Dirent } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const SRC_DIR = join(__dirname, "../src");

// Allowlist: classes the lint must not flag as drift.
//
// Two narrow categories only. Do NOT add entries here to "unblock the build" —
// if a class is in this list it's because it has a documented, intentional
// reason to live without a direct match in the other side of the contract.
// Anything else is real drift and must be fixed at the source.
const JS_APPLIED: ReadonlySet<string> = new Set([
  // ── Category 1: state classes toggled at runtime by TS modules ───────
  // These appear in CSS rules but never in HTML source — they're added/removed
  // by classList calls in src/ts/. Verified by grepping `classList` in src/ts/.
  "nav--hidden",    // nav.ts — toggled on scroll direction
  "revealed",       // scroll-reveal.ts — added when element enters viewport
  "reveal-pending", // scroll-reveal.ts — initial pre-reveal state

  // ── Category 2: dormant component infrastructure ─────────────────────
  // These classes are CSS rules + JS module code waiting for a template
  // author to write the consuming HTML. carousel.ts queries .carousel-track
  // and .carousel-slide via qs/qsa, and dynamically creates .carousel-prev,
  // .carousel-next, .carousel-dots, .carousel-dot child elements. No current
  // template uses [data-module="carousel"], so the lint sees them as orphaned.
  // They're not dead — they're a complete component awaiting first use.
  "carousel-wrapper",
  "carousel-track",
  "carousel-slide",
  "carousel-prev",
  "carousel-next",
  "carousel-dots",
  "carousel-dot",

  // .stagger-1..4 are CSS animation-delay utilities (animations.css). They're
  // primitives available to any template author for staggered entrance
  // animations. No current template uses them.
  "stagger-1",
  "stagger-2",
  "stagger-3",
  "stagger-4",

  // .no-transition is a CSS rule in animations.css meant to be toggled by
  // theme-toggle.ts during theme switches. The current implementation uses
  // an inline style instead of classList — see the followup note in
  // docs/decisions.md (Phase 4 ADR-lite). When theme-toggle.ts is updated
  // to use classList for consistency, this entry can be removed.
  "no-transition",
]);

// Collects all CSS files under a directory (non-recursive, flat — src/styles/ is flat).
async function listCssFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries
    .filter((f) => f.endsWith(".css"))
    .map((f) => join(dir, f));
}

// Collects all HTML files under a directory tree (recursive).
async function listHtmlFiles(dir: string): Promise<string[]> {
  let results: string[] = [];
  let entries: Dirent<string>[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(await listHtmlFiles(full));
    } else if (entry.name.endsWith(".html")) {
      results.push(full);
    }
  }
  return results;
}

// Extracts class tokens from a string of HTML/template content.
// Handles both double-quoted and single-quoted class="..." attributes.
// Skips tokens that contain '{' or '$' (interpolation fragments).
function extractHtmlClasses(source: string): Set<string> {
  const classes = new Set<string>();
  const attrRe = /class\s*=\s*(?:"([^"]*?)"|'([^']*?)')/g;
  for (const match of source.matchAll(attrRe)) {
    const value = match[1] ?? match[2] ?? "";
    for (const token of value.split(/\s+/)) {
      if (token.length === 0) continue;
      if (token.includes("{") || token.includes("$")) continue;
      classes.add(token);
    }
  }
  return classes;
}

// Extracts class tokens from build/pages.ts, which uses template literals.
// We scan for class=" patterns regardless of quote style or escaping.
function extractPagesClasses(source: string): Set<string> {
  const classes = new Set<string>();
  // Match class="..." inside template literals (backtick strings embed regular quotes).
  // Also handles class=\\"...\\" for doubly-escaped variants in nested templates.
  const attrRe = /class\s*=\s*(?:\\?"([^"\\]*(?:\\.[^"\\]*)*)\\?"|'([^']*?)')/g;
  for (const match of source.matchAll(attrRe)) {
    const value = match[1] ?? match[2] ?? "";
    for (const token of value.split(/\s+/)) {
      if (token.length === 0) continue;
      if (token.includes("{") || token.includes("$")) continue;
      classes.add(token);
    }
  }
  return classes;
}

// Extracts CSS-defined class selectors from a CSS source string.
// Strips comments and string literals (url(), format(), quoted values) first,
// then matches .classname patterns.
// Requires the first char after '.' to be a letter or underscore (filters decimals).
function extractCssClasses(source: string): Set<string> {
  const classes = new Set<string>();
  // 1. Strip /* ... */ block comments (multi-line safe)
  let stripped = source.replace(/\/\*[\s\S]*?\*\//g, "");
  // 2. Strip url(...) values — prevents false matches on domain names in @font-face src
  stripped = stripped.replace(/url\([^)]*\)/g, "url()");
  // 3. Strip format(...) values — prevents .woff2 etc. from matching
  stripped = stripped.replace(/format\([^)]*\)/g, "format()");
  // 4. Strip remaining quoted strings (single or double)
  stripped = stripped.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''");

  const selectorRe = /\.([a-zA-Z_][\w-]*)/g;
  for (const match of stripped.matchAll(selectorRe)) {
    classes.add(match[1]!);
  }
  return classes;
}

function union<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
  const result = new Set(a);
  for (const item of b) result.add(item);
  return result;
}

function difference<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
  const result = new Set<T>();
  for (const item of a) {
    if (!b.has(item)) result.add(item);
  }
  return result;
}

export async function lintClasses(): Promise<void> {
  const stylesDir = join(SRC_DIR, "styles");
  const templatesDir = join(SRC_DIR, "templates");
  const pagesFile = join(__dirname, "pages.ts");

  // Collect files in parallel
  const [cssFiles, htmlFiles] = await Promise.all([
    listCssFiles(stylesDir),
    listHtmlFiles(templatesDir),
  ]);

  // Read all files in parallel
  const [cssContents, htmlContents, pagesSource] = await Promise.all([
    Promise.all(cssFiles.map((f) => readFile(f, "utf-8"))),
    Promise.all(htmlFiles.map((f) => readFile(f, "utf-8"))),
    readFile(pagesFile, "utf-8"),
  ]);

  // Build CSS class set
  let cssClasses = new Set<string>();
  for (const src of cssContents) {
    cssClasses = union(cssClasses, extractCssClasses(src));
  }

  // Build HTML-emitted class set from templates + pages.ts
  let htmlClasses = new Set<string>();
  for (const src of htmlContents) {
    htmlClasses = union(htmlClasses, extractHtmlClasses(src));
  }
  htmlClasses = union(htmlClasses, extractPagesClasses(pagesSource));

  // Compute gaps, excluding JS-applied / allowlisted classes from both sides
  const effectiveCss = difference(cssClasses, JS_APPLIED);
  const effectiveHtml = difference(htmlClasses, JS_APPLIED);

  const missingInCss = difference(effectiveHtml, effectiveCss);
  const unusedInCss = difference(effectiveCss, effectiveHtml);

  const htmlCount = htmlClasses.size;
  const cssCount = cssClasses.size;

  if (missingInCss.size === 0 && unusedInCss.size === 0) {
    console.log(
      `[lint-classes] ok: ${htmlCount} HTML classes / ${cssCount} CSS classes in sync`,
    );
    return;
  }

  let failed = false;

  if (missingInCss.size > 0) {
    failed = true;
    console.error(
      `[lint-classes] FAIL: ${missingInCss.size} classes emitted by HTML but undefined in CSS:`,
    );
    for (const cls of [...missingInCss].sort()) {
      console.error(`  - .${cls}`);
    }
  }

  if (unusedInCss.size > 0) {
    failed = true;
    console.error(
      `[lint-classes] FAIL: ${unusedInCss.size} classes defined in CSS but not emitted by any HTML producer:`,
    );
    for (const cls of [...unusedInCss].sort()) {
      console.error(`  - .${cls}`);
    }
  }

  if (failed) {
    throw new Error(
      `lint-classes: ${missingInCss.size} missing in CSS, ${unusedInCss.size} unused in CSS`,
    );
  }
}
