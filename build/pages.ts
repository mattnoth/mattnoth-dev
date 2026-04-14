import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ParsedContent, ArticleMeta, ProjectMeta } from "./markdown.ts";
import { renderPage, clearTemplateCache } from "./templates.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST_DIR = join(__dirname, "../dist");
export const SITE_ORIGIN = "https://mattnoth.dev";

type SocialLink = {
  readonly label: string;
  readonly href: string;
  readonly enabled: boolean;
};

const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: "GitHub", href: "https://github.com/mattnoth", enabled: true },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/mattnoth/", enabled: true },
  { label: "X", href: "https://x.com/mattnoth", enabled: false },
] as const;

const SOCIAL_LINKS_HTML = SOCIAL_LINKS
  .filter((link) => link.enabled)
  .map(
    (link) =>
      `<li><a href="${link.href}" rel="noopener noreferrer" target="_blank">${link.label}</a></li>`,
  )
  .join("\n            ");

const BASE_SLOTS = {
  social_links: SOCIAL_LINKS_HTML,
} as const;

const EMPTY_PROJECTS_HTML =
  '<p class="empty-state"><em>This is a new site — projects will be added soon.</em></p>';

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
  const html = await renderPage(templateName, { ...BASE_SLOTS, ...slots });
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
      featured_projects:
        featuredProjects.length > 0
          ? featuredProjects.map((p) => projectCard(p, 'h3')).join("\n")
          : EMPTY_PROJECTS_HTML,
    },
    "index.html",
    "home",
  );

  // About page
  await generatePage(
    "about.html",
    {
      title: "About — Matt Noth",
      description: "About Matt Noth.",
      page_url: `${SITE_ORIGIN}/about/`,
    },
    "about/index.html",
    "about",
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

  // Projects list — hide drafts here regardless of env so the empty
  // state matches the home page when nothing is publish-ready yet.
  const listedProjects = projects.filter((p) => p.meta.draft !== true);
  await generatePage(
    "project-list.html",
    {
      title: "Projects — Matt Noth",
      description: "Things I've built.",
      page_url: `${SITE_ORIGIN}/projects/`,
      projects:
        listedProjects.length > 0
          ? listedProjects.map((p) => projectCard(p, 'h2')).join("\n")
          : EMPTY_PROJECTS_HTML,
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
