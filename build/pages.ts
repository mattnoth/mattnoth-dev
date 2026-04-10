import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ParsedContent, ArticleMeta, ProjectMeta } from "./markdown.ts";
import { renderPage, clearTemplateCache } from "./templates.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST_DIR = join(__dirname, "../dist");
export const SITE_ORIGIN = "https://mattnoth.dev";

async function writeHtml(relPath: string, html: string): Promise<void> {
  const fullPath = join(DIST_DIR, relPath);
  const dir = fullPath.replace(/\/[^/]+$/, "");
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, html, "utf-8");
}

type HeadingLevel = 'h2' | 'h3';

function articleCard(item: ParsedContent<ArticleMeta>, level: HeadingLevel = 'h2'): string {
  const { title, slug, date, description, tags } = item.meta;
  const tagHtml = tags.map((t) => `<span class="tag">${t}</span>`).join("");
  return `<article class="card">
  <header>
    <${level}><a href="/articles/${slug}/">${title}</a></${level}>
    <time datetime="${date}">${date}</time>
    <span class="reading-time">${item.readingTime} min read</span>
  </header>
  <p>${description}</p>
  <div class="tags">${tagHtml}</div>
</article>`;
}

function projectCard(item: ParsedContent<ProjectMeta>, level: HeadingLevel = 'h2'): string {
  const { title, slug, description, tech, url, github } = item.meta;
  const techHtml = tech.map((t) => `<span class="tech">${t}</span>`).join("");
  const links = [
    url ? `<a href="${url}">Live</a>` : "",
    github ? `<a href="${github}">GitHub</a>` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<article class="card">
  <${level}><a href="/projects/${slug}/">${title}</a></${level}>
  <p>${description}</p>
  <div class="tech-stack">${techHtml}</div>
  ${links ? `<div class="links">${links}</div>` : ""}
</article>`;
}

async function generatePage(
  templateName: string,
  slots: Record<string, string>,
  outputPath: string,
  label: string,
): Promise<void> {
  const html = await renderPage(templateName, slots);
  if (html === null) {
    console.log(`[pages] ${label}: template stub — skipping`);
    return;
  }
  await writeHtml(outputPath, html);
  console.log(`[pages] wrote ${outputPath}`);
}

export async function generateAllPages(
  articles: ParsedContent<ArticleMeta>[],
  projects: ParsedContent<ProjectMeta>[],
): Promise<void> {
  clearTemplateCache();

  await mkdir(DIST_DIR, { recursive: true });

  const featuredProjects = projects.filter((p) => p.meta.featured);
  const recentArticles = articles.slice(0, 3);

  // Home page
  await generatePage(
    "home.html",
    {
      title: "Matt Noth — Dev",
      description: "Matt's personal dev site — articles and projects.",
      page_url: `${SITE_ORIGIN}/`,
      recent_articles: recentArticles.map((a) => articleCard(a, 'h3')).join("\n"),
      featured_projects: featuredProjects.map((p) => projectCard(p, 'h3')).join("\n"),
    },
    "index.html",
    "home",
  );

  // Articles list
  await generatePage(
    "article-list.html",
    {
      title: "Articles — Matt Noth",
      description: "Writing on software development.",
      page_url: `${SITE_ORIGIN}/articles/`,
      articles: articles.map((a) => articleCard(a, 'h2')).join("\n"),
    },
    "articles/index.html",
    "articles list",
  );

  // Individual articles
  for (const item of articles) {
    const { title, slug, date, tags, description } = item.meta;
    const tagHtml = tags.map((t) => `<span class="tag">${t}</span>`).join("");
    await generatePage(
      "article.html",
      {
        title: `${title} — Matt Noth`,
        page_title: title,
        description,
        page_url: `${SITE_ORIGIN}/articles/${slug}/`,
        date,
        tags: tagHtml,
        reading_time: String(item.readingTime),
        content: item.html,
      },
      `articles/${slug}/index.html`,
      `article: ${slug}`,
    );
  }

  // Projects list
  await generatePage(
    "project-list.html",
    {
      title: "Projects — Matt Noth",
      description: "Things I've built.",
      page_url: `${SITE_ORIGIN}/projects/`,
      projects: projects.map((p) => projectCard(p, 'h2')).join("\n"),
    },
    "projects/index.html",
    "projects list",
  );

  // Individual projects
  for (const item of projects) {
    const { title, slug, description, tech, url, github } = item.meta;
    const techHtml = tech.map((t) => `<span class="tech">${t}</span>`).join("");
    const links = [
      url ? `<a href="${url}">Live</a>` : "",
      github ? `<a href="${github}">GitHub</a>` : "",
    ]
      .filter(Boolean)
      .join(" ");
    await generatePage(
      "project.html",
      {
        title: `${title} — Matt Noth`,
        page_title: title,
        description,
        page_url: `${SITE_ORIGIN}/projects/${slug}/`,
        tech: techHtml,
        content: item.html,
        links,
      },
      `projects/${slug}/index.html`,
      `project: ${slug}`,
    );
  }
}
