// build/missing-scientists.ts
// Generates the /unpublished/missing-scientists/ section by consuming
// research artifacts from the sibling research repository.

import { readFile, readdir, mkdir, copyFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { renderPage } from "./templates.ts";
import { SITE_ORIGIN } from "./pages.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const RESEARCH_DIR = process.env["MS_RESEARCH_DIR"]
  ?? join(__dirname, "../../research-missing-scientists");
const DIST_DIR = join(__dirname, "../dist");
const BASE = "/unpublished/missing-scientists";

const SOCIAL_LINKS_HTML = [
  '<li><a href="https://github.com/mattnoth" rel="noopener noreferrer" target="_blank">GitHub</a></li>',
  '<li><a href="https://www.linkedin.com/in/mattnoth/" rel="noopener noreferrer" target="_blank">LinkedIn</a></li>',
].join("\n            ");

// ── Case metadata ─────────────────────────────────────────────────────

const CASE_ORDER = [
  "eskridge", "hicks", "maiwald", "chavez", "casias",
  "reza", "garcia", "thomas", "loureiro", "mccasland", "grillmair",
] as const;

const CASE_NAMES: Readonly<Record<string, string>> = {
  eskridge: "Amy Eskridge",
  hicks: "Michael David Hicks",
  maiwald: "Frank Maiwald",
  chavez: "Anthony Chavez",
  casias: "Melissa Casias",
  reza: "Monica Jacinto Reza",
  garcia: "Steven Garcia",
  thomas: "Jason Thomas",
  loureiro: "Nuno Loureiro",
  mccasland: "William Neil McCasland",
  grillmair: "Carl Grillmair",
};

// ── Section navigation ────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: `${BASE}/`, label: "Overview" },
  { href: `${BASE}/diagram/`, label: "Diagram" },
  { href: `${BASE}/timeline/`, label: "Timeline" },
  { href: `${BASE}/analysis/connections/`, label: "Connections" },
  { href: `${BASE}/analysis/hypotheses/`, label: "Hypotheses" },
  { href: `${BASE}/analysis/foreign-intel/`, label: "Foreign Intel" },
  { href: `${BASE}/methodology/`, label: "Methodology" },
  { href: `${BASE}/sources/`, label: "Sources" },
  { href: `${BASE}/transparency/`, label: "Transparency" },
] as const;

function generateNav(currentPath: string): string {
  const items = NAV_ITEMS.map(item => {
    const isCurrent = currentPath === item.href;
    return `<li><a href="${item.href}"${isCurrent ? ' aria-current="page"' : ''}>${item.label}</a></li>`;
  }).join("\n          ");

  return `<nav class="ms-nav" aria-label="Research navigation">
      <ul class="ms-nav__links">
          ${items}
      </ul>
  </nav>`;
}

function generateCaseList(currentSlug?: string): string {
  const items = CASE_ORDER.map(slug => {
    const name = CASE_NAMES[slug] ?? slug;
    const isCurrent = slug === currentSlug;
    return `<li><a href="${BASE}/cases/${slug}/"${isCurrent ? ' aria-current="page"' : ''}>${name}</a></li>`;
  }).join("\n            ");

  return `<nav class="ms-case-nav" aria-label="Case index">
      <h3>Cases</h3>
      <ul>
          ${items}
      </ul>
  </nav>`;
}

// ── Glossary ──────────────────────────────────────────────────────────

interface GlossaryEntry { abbr: string; full: string }

let glossaryEntries: GlossaryEntry[] | null = null;

async function loadGlossary(): Promise<GlossaryEntry[]> {
  if (glossaryEntries) return glossaryEntries;
  try {
    const raw = await readFile(join(RESEARCH_DIR, "data/glossary.json"), "utf-8");
    const data = JSON.parse(raw) as { entries: GlossaryEntry[] };
    // Sort longest-first so longer acronyms match before shorter substrings
    glossaryEntries = data.entries.sort((a, b) => b.abbr.length - a.abbr.length);
  } catch {
    glossaryEntries = [];
  }
  return glossaryEntries;
}

function applyGlossary(html: string, entries: GlossaryEntry[]): string {
  for (const { abbr, full } of entries) {
    // Escape special regex characters in the abbreviation
    const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match the abbreviation as a whole word, but NOT inside HTML tags or
    // already-wrapped <abbr> elements. We use a negative lookbehind for
    // tag context and only match text nodes.
    const re = new RegExp(
      `(?<![\\w/\\.">])${escaped}(?![\\w<])`,
      "g",
    );
    // Replace only in text content (outside of HTML tags)
    html = replaceInTextNodes(html, re, `<abbr title="${full.replace(/"/g, "&quot;")}">${abbr}</abbr>`);
  }
  return html;
}

/** Replace regex matches only in text content, not inside HTML tags or attributes. */
function replaceInTextNodes(html: string, pattern: RegExp, replacement: string): string {
  // Split HTML into tag vs text segments
  const parts = html.split(/(<[^>]+>)/);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    // Skip HTML tags (odd-indexed parts from the split, plus anything starting with <)
    if (part.startsWith("<")) continue;
    parts[i] = part.replace(pattern, replacement);
  }
  return parts.join("");
}

// ── Tier descriptions and source-section anchors ─────────────────────

const TIER_DESCRIPTIONS: Record<string, string> = {
  "1": "Primary sources — law-enforcement releases, court filings, official statements",
  "2": "Secondary reporting — mainstream news with named sources",
  "3": "Tertiary / aggregator — Wikipedia, roundups citing other outlets",
  "4": "Named expert commentary — on-the-record statements from identified experts",
  "5": "Secondary reporting relying on anonymous sources",
  "6": "Independent commentary — Substack, YouTube, podcasts, social media",
  "7": "Foreign state-affiliated press",
};

/** Map tier number to the heading anchor on the same page where sources are listed. */
const TIER_ANCHORS: Record<string, string> = {
  "1": "#primary-sources",
  "2": "#secondary-sources",
  "3": "#secondary-sources",
  "4": "#named-expert-commentary",
  "5": "#secondary-sources",
  "6": "#secondary-sources",
  "7": "#foreign-coverage",
};

// ── Markdown processing ───────────────────────────────────────────────

async function readMarkdown(relativePath: string): Promise<string> {
  const raw = await readFile(join(RESEARCH_DIR, relativePath), "utf-8");
  const glossary = await loadGlossary();
  return postProcess(String(await marked(raw)), glossary);
}

function postProcess(html: string, glossary: GlossaryEntry[] = []): string {
  // Style tier + confidence annotations: [T1], [T1 (source), Confirmed], etc.
  // Tier badges link to the source section on the same page (e.g. #primary-sources).
  // Tooltip shows the tier description + specific source attribution.
  html = html.replace(
    /\[T([1-7])(?:\s*\(([^)]*)\))?(?:,?\s*(Confirmed|Reported|Alleged|Speculated))?\]/g,
    (_match, num: string, source: string | undefined, confidence: string | undefined) => {
      const escapedSource = source ? source.replace(/"/g, "&quot;") : "";
      const desc = TIER_DESCRIPTIONS[num] ?? `Tier ${num}`;
      const title = `${desc}${escapedSource ? ` — ${escapedSource}` : ""}`;
      const anchor = TIER_ANCHORS[num] ?? "#primary-sources";
      let result = `<a href="${anchor}" class="ms-tier-link"><span class="ms-tier" data-tier="${num}" title="${title}">T${num}</span></a>`;
      if (confidence) {
        result += ` <span class="ms-confidence" data-level="${confidence.toLowerCase()}">${confidence}</span>`;
      }
      return result;
    },
  );

  // Convert internal markdown file references to website URLs
  html = html.replace(/href="cases\/([^"]+)\.md"/g, `href="${BASE}/cases/$1/"`);
  html = html.replace(/href="analysis\/connection-analysis\.md"/g, `href="${BASE}/analysis/connections/"`);
  html = html.replace(/href="analysis\/hypotheses\.md"/g, `href="${BASE}/analysis/hypotheses/"`);
  html = html.replace(/href="analysis\/foreign-intel-layer\.md"/g, `href="${BASE}/analysis/foreign-intel/"`);
  html = html.replace(/href="README\.md"/g, `href="${BASE}/methodology/"`);
  html = html.replace(/href="logs\/[^"]*\.md"/g, `href="${BASE}/transparency/"`);

  // Replace raw filename link text with display names
  for (const [slug, name] of Object.entries(CASE_NAMES)) {
    html = html.replace(
      new RegExp(`>cases/${slug}\\.md<`, "g"),
      `>${name}<`,
    );
  }
  html = html.replace(/>analysis\/connection-analysis\.md</g, ">Connection Analysis<");
  html = html.replace(/>analysis\/hypotheses\.md</g, ">Hypothesis Evaluation<");
  html = html.replace(/>analysis\/foreign-intel-layer\.md</g, ">Foreign Intelligence<");

  // Replace inline prose .md references (inside <code> tags or plain text)
  const proseReplacements: [RegExp, string][] = [
    [/<code>(?:analysis\/)?hypotheses\.md<\/code>/g, "the Hypothesis Evaluation"],
    [/<code>(?:analysis\/)?connection-analysis\.md<\/code>/g, "the Connection Analysis"],
    [/<code>(?:analysis\/)?foreign-intel-layer\.md<\/code>/g, "the Foreign Intelligence Assessment"],
    [/<code>(?:logs\/)?research-log\.md<\/code>/g, "the Research Log"],
    [/<code>(?:logs\/)?contradictions\.md<\/code>/g, "the Contradictions tracker"],
    [/<code>(?:logs\/)?known-unknowns\.md<\/code>/g, "the Known Unknowns register"],
    [/<code>README\.md<\/code>/g, "the Methodology"],
    [/<code>dossier\.md<\/code>/g, "the Dossier"],
  ];
  for (const [slug, name] of Object.entries(CASE_NAMES)) {
    proseReplacements.push([
      new RegExp(`<code>(?:cases/)?${slug}\\.md</code>`, "g"),
      name,
    ]);
  }
  for (const [pattern, replacement] of proseReplacements) {
    html = html.replace(pattern, replacement);
  }

  // Apply glossary tooltips to acronyms
  if (glossary.length > 0) {
    html = applyGlossary(html, glossary);
  }

  return html;
}

// ── Heading level adjustment ─────────────────────────────────────────

/** Shift all heading levels down by `shift` (e.g. h1→h3, h2→h4 when shift=2).
 *  Also adds an id to the former-h1 for deep-linking. */
function downgradeHeadings(html: string, shift: number): string {
  return html.replace(
    /<(\/?)h([1-6])((?:\s[^>]*)?)>/g,
    (_match, slash: string, levelStr: string, attrs: string) => {
      const oldLevel = Number(levelStr);
      const newLevel = Math.min(oldLevel + shift, 6);
      // For the top-level heading (h1), add an id if not already present
      if (oldLevel === 1 && !slash && !attrs.includes("id=")) {
        // Extract text content to generate an id
        const afterTag = html.slice(html.indexOf(_match) + _match.length);
        const closingIdx = afterTag.indexOf(`</h${oldLevel}>`);
        if (closingIdx >= 0) {
          const inner = afterTag.slice(0, closingIdx);
          const text = inner.replace(/<[^>]+>/g, "").trim();
          const id = text.toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/^-+|-+$/g, "") || "section";
          return `<h${newLevel} id="${id}"${attrs}>`;
        }
      }
      return `<${slash}h${newLevel}${attrs}>`;
    },
  );
}

// ── Heading IDs and table of contents ─────────────────────────────────

function addHeadingIds(html: string): { toc: string; html: string } {
  const headings: { level: number; id: string; text: string }[] = [];
  const usedIds = new Set<string>();

  const processed = html.replace(
    /<h([2-4])(?:\s+id="([^"]*)")?((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/g,
    (_match, levelStr: string, existingId: string | undefined, otherAttrs: string, inner: string) => {
      const level = Number(levelStr);
      const text = inner.replace(/<[^>]+>/g, "").trim();
      let id = existingId ?? text.toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (!id) id = "section";
      // Deduplicate IDs
      const baseId = id;
      let counter = 2;
      while (usedIds.has(id)) {
        id = `${baseId}-${counter}`;
        counter++;
      }
      usedIds.add(id);
      headings.push({ level, id, text });
      return `<h${level} id="${id}"${otherAttrs}>${inner}</h${level}>`;
    },
  );

  if (headings.length === 0) return { toc: "", html };

  const tocItems = headings
    .filter(h => h.level <= 3)
    .map(h => `<li class="ms-toc__item" data-level="${h.level}"><a href="#${h.id}">${h.text}</a></li>`)
    .join("\n        ");

  const toc = `<nav class="ms-toc" aria-label="Table of contents">
    <details open>
      <summary>Contents</summary>
      <ol>
        ${tocItems}
      </ol>
    </details>
  </nav>`;

  return { toc, html: processed };
}

function extractTitle(html: string): { title: string; html: string } {
  const match = html.match(/<h1>([\s\S]*?)<\/h1>/);
  if (!match) return { title: "", html };
  const title = (match[1] ?? "").replace(/<[^>]+>/g, "").trim();
  const cleaned = html.replace(/<h1>[\s\S]*?<\/h1>\s*/, "");
  return { title, html: cleaned };
}

// ── Page writer ───────────────────────────────────────────────────────

async function writePage(relPath: string, htmlContent: string): Promise<void> {
  const fullPath = join(DIST_DIR, relPath);
  const dir = fullPath.replace(/\/[^/]+$/, "");
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, htmlContent, "utf-8");
  console.log(`[ms] wrote ${relPath}`);
}

async function generatePage(
  templateName: string,
  slots: Record<string, string>,
  outputPath: string,
): Promise<void> {
  const html = await renderPage(templateName, { social_links: SOCIAL_LINKS_HTML, ...slots });
  if (html === null) {
    console.warn(`[ms] template ${templateName} not found`);
    return;
  }
  await writePage(outputPath, html);
}

// ── Version info ──────────────────────────────────────────────────────

async function getVersion(): Promise<{ version: string; lastUpdated: string }> {
  try {
    const changelog = await readFile(join(RESEARCH_DIR, "CHANGELOG.md"), "utf-8");
    const m = changelog.match(/## (v[\d.]+)\s*—\s*(\d{4}-\d{2}-\d{2})/);
    if (m) return { version: m[1]!, lastUpdated: m[2]! };
  } catch { /* use defaults */ }
  return { version: "0.1", lastUpdated: new Date().toISOString().slice(0, 10) };
}

// ── Page generators ───────────────────────────────────────────────────

async function generateLandingPage(version: string, lastUpdated: string): Promise<void> {
  const rawHtml = await readMarkdown("dossier.md");
  const { title, html: bodyHtml } = extractTitle(rawHtml);
  const { toc, html: contentHtml } = addHeadingIds(bodyHtml);

  const pageTitle = title || "Deaths and Disappearances of U.S. Defense Scientists";

  await generatePage("ms-page.html", {
    title: `${pageTitle} — Matt Noth`,
    description: "A structured, evidence-based research dossier on deaths and disappearances of U.S. defense and advanced-research scientists.",
    page_url: `${SITE_ORIGIN}${BASE}/`,
    page_title: pageTitle,
    ms_nav: generateNav(`${BASE}/`),
    breadcrumb: "",
    meta: "",
    analysis_nav: "",
    toc,
    content: contentHtml,
    prev_next: "",
    case_list: generateCaseList(),
    version_info: `<p class="ms-version">Research ${version} &middot; Updated ${lastUpdated}</p>`,
  }, "unpublished/missing-scientists/index.html");
}

async function generateCasePages(): Promise<void> {
  for (let i = 0; i < CASE_ORDER.length; i++) {
    const slug = CASE_ORDER[i]!;
    const name = CASE_NAMES[slug] ?? slug;
    const rawHtml = await readMarkdown(`cases/${slug}.md`);
    const { title, html: bodyHtml } = extractTitle(rawHtml);
    const { toc, html: contentHtml } = addHeadingIds(bodyHtml);

    const prevSlug = i > 0 ? CASE_ORDER[i - 1] : undefined;
    const nextSlug = i < CASE_ORDER.length - 1 ? CASE_ORDER[i + 1] : undefined;

    let prevNext = "";
    if (prevSlug || nextSlug) {
      const prev = prevSlug
        ? `<a href="${BASE}/cases/${prevSlug}/" class="ms-prev-next__link ms-prev-next__link--prev">&larr; ${CASE_NAMES[prevSlug] ?? prevSlug}</a>`
        : "<span></span>";
      const next = nextSlug
        ? `<a href="${BASE}/cases/${nextSlug}/" class="ms-prev-next__link ms-prev-next__link--next">${CASE_NAMES[nextSlug] ?? nextSlug} &rarr;</a>`
        : "<span></span>";
      prevNext = `<nav class="ms-prev-next" aria-label="Case navigation">${prev}${next}</nav>`;
    }

    await generatePage("ms-page.html", {
      title: `${title || name} — Research — Matt Noth`,
      description: `Case file: ${name}. Part of the research dossier on deaths and disappearances of U.S. defense scientists.`,
      page_url: `${SITE_ORIGIN}${BASE}/cases/${slug}/`,
      page_title: title || name,
      ms_nav: generateNav(`${BASE}/cases/${slug}/`),
      breadcrumb: `<nav class="ms-breadcrumb" aria-label="Breadcrumb"><a href="${BASE}/">Research</a> &rsaquo; <span aria-current="page">${name}</span></nav>`,
      meta: "",
      analysis_nav: "",
      toc,
      content: contentHtml,
      prev_next: prevNext,
      case_list: generateCaseList(slug),
      version_info: "",
    }, `unpublished/missing-scientists/cases/${slug}/index.html`);
  }
}

async function generateAnalysisPages(): Promise<void> {
  const pages = [
    { file: "connection-analysis.md", slug: "connections", label: "Connection Analysis" },
    { file: "hypotheses.md", slug: "hypotheses", label: "Hypothesis Evaluation" },
    { file: "foreign-intel-layer.md", slug: "foreign-intel", label: "Foreign Intelligence Assessment" },
  ];

  for (const { file, slug, label } of pages) {
    const rawHtml = await readMarkdown(`analysis/${file}`);
    const { title, html: bodyHtml } = extractTitle(rawHtml);
    const { toc, html: contentHtml } = addHeadingIds(bodyHtml);

    const navHtml = `<nav class="ms-analysis-nav" aria-label="Analysis sections"><ul>${
      pages.map(p =>
        `<li><a href="${BASE}/analysis/${p.slug}/"${p.slug === slug ? ' aria-current="page"' : ''}>${p.label}</a></li>`,
      ).join("")
    }</ul></nav>`;

    await generatePage("ms-page.html", {
      title: `${title || label} — Research — Matt Noth`,
      description: `${label}. Part of the research dossier on deaths and disappearances of U.S. defense scientists.`,
      page_url: `${SITE_ORIGIN}${BASE}/analysis/${slug}/`,
      page_title: title || label,
      ms_nav: generateNav(`${BASE}/analysis/${slug}/`),
      breadcrumb: `<nav class="ms-breadcrumb" aria-label="Breadcrumb"><a href="${BASE}/">Research</a> &rsaquo; <span aria-current="page">Analysis</span></nav>`,
      meta: "",
      analysis_nav: navHtml,
      toc,
      content: contentHtml,
      prev_next: "",
      case_list: "",
      version_info: "",
    }, `unpublished/missing-scientists/analysis/${slug}/index.html`);
  }
}

async function generateDiagramPage(): Promise<void> {
  await generatePage("ms-diagram.html", {
    title: "Connection Diagram — Research — Matt Noth",
    description: "Interactive connection diagram showing relationships between cases, institutions, and programs.",
    page_url: `${SITE_ORIGIN}${BASE}/diagram/`,
    page_title: "Connection Diagram",
    ms_nav: generateNav(`${BASE}/diagram/`),
  }, "unpublished/missing-scientists/diagram/index.html");
}

async function generateTimelinePage(): Promise<void> {
  await generatePage("ms-timeline.html", {
    title: "Event Timeline — Research — Matt Noth",
    description: "Interactive chronological timeline of all documented events.",
    page_url: `${SITE_ORIGIN}${BASE}/timeline/`,
    page_title: "Event Timeline",
    ms_nav: generateNav(`${BASE}/timeline/`),
  }, "unpublished/missing-scientists/timeline/index.html");
}

async function generateSourcesPage(): Promise<void> {
  let content = "";
  const glossary = await loadGlossary();

  // Expert commentary
  try {
    const dir = join(RESEARCH_DIR, "appendices/named-expert-commentary");
    const files = (await readdir(dir)).filter(f => f.endsWith(".md")).sort();
    if (files.length > 0) {
      content += "<h2>Named Expert Commentary</h2>\n";
      for (const file of files) {
        const raw = await readFile(join(dir, file), "utf-8");
        let sectionHtml = postProcess(String(await marked(raw)), glossary);
        // Downgrade heading levels so they nest under the h2
        sectionHtml = downgradeHeadings(sectionHtml, 2);
        content += `<section class="ms-source-section">${sectionHtml}</section>\n`;
      }
    }
  } catch { /* directory may not exist */ }

  // Foreign coverage
  try {
    const dir = join(RESEARCH_DIR, "appendices/foreign-coverage");
    const files = (await readdir(dir)).filter(f => f.endsWith(".md")).sort();
    if (files.length > 0) {
      content += "<h2>Foreign Coverage</h2>\n";
      for (const file of files) {
        const raw = await readFile(join(dir, file), "utf-8");
        let sectionHtml = postProcess(String(await marked(raw)), glossary);
        sectionHtml = downgradeHeadings(sectionHtml, 2);
        content += `<section class="ms-source-section">${sectionHtml}</section>\n`;
      }
    }
  } catch { /* directory may not exist */ }

  const { toc, html: contentHtml } = addHeadingIds(content);

  await generatePage("ms-page.html", {
    title: "Sources & Commentary — Research — Matt Noth",
    description: "Consolidated expert commentary and foreign coverage.",
    page_url: `${SITE_ORIGIN}${BASE}/sources/`,
    page_title: "Sources & Commentary",
    ms_nav: generateNav(`${BASE}/sources/`),
    breadcrumb: `<nav class="ms-breadcrumb" aria-label="Breadcrumb"><a href="${BASE}/">Research</a> &rsaquo; <span aria-current="page">Sources</span></nav>`,
    meta: "",
    analysis_nav: "",
    toc,
    content: contentHtml,
    prev_next: "",
    case_list: "",
    version_info: "",
  }, "unpublished/missing-scientists/sources/index.html");
}

async function generateMethodologyPage(): Promise<void> {
  const rawHtml = await readMarkdown("README.md");
  const { title, html: bodyHtml } = extractTitle(rawHtml);
  const { toc, html: contentHtml } = addHeadingIds(bodyHtml);

  await generatePage("ms-page.html", {
    title: "Methodology — Research — Matt Noth",
    description: "Research methodology, source tier taxonomy, and confidence rating system.",
    page_url: `${SITE_ORIGIN}${BASE}/methodology/`,
    page_title: title || "Methodology",
    ms_nav: generateNav(`${BASE}/methodology/`),
    breadcrumb: `<nav class="ms-breadcrumb" aria-label="Breadcrumb"><a href="${BASE}/">Research</a> &rsaquo; <span aria-current="page">Methodology</span></nav>`,
    meta: "",
    analysis_nav: "",
    toc,
    content: contentHtml,
    prev_next: "",
    case_list: "",
    version_info: "",
  }, "unpublished/missing-scientists/methodology/index.html");
}

async function generateTransparencyPage(): Promise<void> {
  let content = "";

  const sections = [
    { file: "logs/contradictions.md", label: "Contradictions" },
    { file: "logs/known-unknowns.md", label: "Known Unknowns" },
    { file: "logs/research-log.md", label: "Research Log" },
  ];

  for (const { file, label } of sections) {
    try {
      const rawHtml = await readMarkdown(file);
      const isLog = label === "Research Log";
      content += isLog
        ? `<section class="ms-transparency-section"><details><summary>${label} (click to expand)</summary>${rawHtml}</details></section>\n`
        : `<section class="ms-transparency-section">${rawHtml}</section>\n`;
    } catch { /* file may not exist */ }
  }

  const { toc, html: contentHtml } = addHeadingIds(content);

  await generatePage("ms-page.html", {
    title: "Transparency — Research — Matt Noth",
    description: "Research log, contradictions, and known unknowns.",
    page_url: `${SITE_ORIGIN}${BASE}/transparency/`,
    page_title: "Transparency",
    ms_nav: generateNav(`${BASE}/transparency/`),
    breadcrumb: `<nav class="ms-breadcrumb" aria-label="Breadcrumb"><a href="${BASE}/">Research</a> &rsaquo; <span aria-current="page">Transparency</span></nav>`,
    meta: "",
    analysis_nav: "",
    toc,
    content: contentHtml,
    prev_next: "",
    case_list: "",
    version_info: "",
  }, "unpublished/missing-scientists/transparency/index.html");
}

async function copyDataFiles(): Promise<void> {
  const dataDir = join(DIST_DIR, "unpublished/missing-scientists/data");
  await mkdir(dataDir, { recursive: true });
  await Promise.all([
    copyFile(join(RESEARCH_DIR, "data/diagram-data.json"), join(dataDir, "diagram-data.json")),
    copyFile(join(RESEARCH_DIR, "data/timeline-data.json"), join(dataDir, "timeline-data.json")),
  ]);
  console.log("[ms] copied data files");
}

// ── Entry point ───────────────────────────────────────────────────────

export async function generateMissingScientistsPages(): Promise<void> {
  console.log("[ms] generating missing-scientists pages...");
  const { version, lastUpdated } = await getVersion();

  await Promise.all([
    generateLandingPage(version, lastUpdated),
    generateCasePages(),
    generateAnalysisPages(),
    generateDiagramPage(),
    generateTimelinePage(),
    generateSourcesPage(),
    generateMethodologyPage(),
    generateTransparencyPage(),
    copyDataFiles(),
  ]);
  console.log("[ms] done");
}
