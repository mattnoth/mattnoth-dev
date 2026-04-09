import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ParsedContent, ArticleMeta, ProjectMeta } from "./markdown.ts";
import { SITE_ORIGIN } from "./pages.ts";
import { DIST_DIR } from "./copy-assets.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(path: string, lastmod?: string): string {
  const loc = escapeXml(`${SITE_ORIGIN}${path}`);
  const lastmodEl = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  return `  <url>\n    <loc>${loc}</loc>${lastmodEl}\n  </url>`;
}

export async function generateSitemap(
  articles: readonly ParsedContent<ArticleMeta>[],
  projects: readonly ParsedContent<ProjectMeta>[],
): Promise<void> {
  const entries: string[] = [];

  // Index pages — no reliable last-modified date
  entries.push(urlEntry("/"));
  entries.push(urlEntry("/articles/"));
  entries.push(urlEntry("/projects/"));

  // Articles — use frontmatter date (ISO 8601)
  for (const article of articles) {
    // Normalize date to YYYY-MM-DD in case frontmatter has a full ISO timestamp
    const lastmod = article.meta.date.slice(0, 10);
    entries.push(urlEntry(`/articles/${escapeXml(article.meta.slug)}/`, lastmod));
  }

  // Projects — no reliable date in frontmatter; omit lastmod
  for (const project of projects) {
    entries.push(urlEntry(`/projects/${escapeXml(project.meta.slug)}/`));
  }

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries,
    `</urlset>`,
  ].join("\n");

  await writeFile(join(DIST_DIR, "sitemap.xml"), xml, "utf-8");
  console.log(`[sitemap] wrote sitemap.xml (${entries.length} urls)`);
}
