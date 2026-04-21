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

// ── Markdown processing ───────────────────────────────────────────────

async function readMarkdown(relativePath: string): Promise<string> {
  const raw = await readFile(join(RESEARCH_DIR, relativePath), "utf-8");
  return postProcess(String(await marked(raw)));
}

function postProcess(html: string): string {
  // Style tier + confidence annotations: [T1], [T1 (source), Confirmed], etc.
  html = html.replace(
    /\[T([1-7])(?:\s*\(([^)]*)\))?(?:,?\s*(Confirmed|Reported|Alleged|Speculated))?\]/g,
    (_match, num: string, source: string | undefined, confidence: string | undefined) => {
      const escapedSource = source ? source.replace(/"/g, "&quot;") : "";
      const title = `Tier ${num} source${escapedSource ? `: ${escapedSource}` : ""}`;
      let result = `<span class="ms-tier" data-tier="${num}" title="${title}">T${num}</span>`;
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

  return html;
}

// ── Heading IDs and table of contents ─────────────────────────────────

function addHeadingIds(html: string): { toc: string; html: string } {
  const headings: { level: number; id: string; text: string }[] = [];
  const usedIds = new Set<string>();

  const processed = html.replace(
    /<h([2-4])>([\s\S]*?)<\/h\1>/g,
    (_match, levelStr: string, inner: string) => {
      const level = Number(levelStr);
      const text = inner.replace(/<[^>]+>/g, "").trim();
      let id = text.toLowerCase()
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
      return `<h${level} id="${id}">${inner}</h${level}>`;
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

  // Expert commentary
  try {
    const dir = join(RESEARCH_DIR, "appendices/named-expert-commentary");
    const files = (await readdir(dir)).filter(f => f.endsWith(".md")).sort();
    if (files.length > 0) {
      content += "<h2>Named Expert Commentary</h2>\n";
      for (const file of files) {
        const raw = await readFile(join(dir, file), "utf-8");
        content += `<section class="ms-source-section">${postProcess(String(await marked(raw)))}</section>\n`;
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
        content += `<section class="ms-source-section">${postProcess(String(await marked(raw)))}</section>\n`;
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
