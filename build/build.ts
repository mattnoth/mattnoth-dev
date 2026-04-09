import { rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { parseContentDir } from "./markdown.ts";
import { generateAllPages } from "./pages.ts";
import { generateSitemap } from "./sitemap.ts";
import { concatCss, copyAssets, DIST_DIR, SRC_DIR } from "./copy-assets.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const isDev = process.argv.includes("--dev");

// ── timing util ────────────────────────────────────────────────────────────

function now(): number {
  return performance.now();
}

function ms(start: number): string {
  return `${Math.round(performance.now() - start)}ms`;
}

// ── step runners ────────────────────────────────────────────────────────────

async function stepClean(): Promise<void> {
  const t = now();
  await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });
  console.log(`[build] clean: ${ms(t)}`);
}

async function stepParseContent() {
  const t = now();
  const articlesDir = join(SRC_DIR, "content/articles");
  const projectsDir = join(SRC_DIR, "content/projects");
  const [articles, projects] = await Promise.all([
    parseContentDir(articlesDir, "article"),
    parseContentDir(projectsDir, "project"),
  ]);
  console.log(
    `[build] markdown: ${ms(t)} (${articles.length} articles, ${projects.length} projects)`,
  );
  return { articles, projects };
}

async function stepPages(
  articles: Awaited<ReturnType<typeof stepParseContent>>["articles"],
  projects: Awaited<ReturnType<typeof stepParseContent>>["projects"],
): Promise<void> {
  const t = now();
  await generateAllPages(articles, projects);
  console.log(`[build] pages: ${ms(t)}`);
}

async function stepSitemap(
  articles: Awaited<ReturnType<typeof stepParseContent>>["articles"],
  projects: Awaited<ReturnType<typeof stepParseContent>>["projects"],
): Promise<void> {
  await generateSitemap(articles, projects);
}

async function stepCss(): Promise<void> {
  const t = now();
  await concatCss();
  console.log(`[build] CSS: ${ms(t)}`);
}

async function stepJs(minify: boolean, sourcemap: boolean): Promise<esbuild.BuildResult> {
  const t = now();
  const entryPoint = join(SRC_DIR, "ts/main.ts");
  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    format: "esm",
    target: "es2022",
    outfile: join(DIST_DIR, "main.js"),
    minify,
    sourcemap,
    logLevel: "silent",
  });
  console.log(`[build] JS: ${ms(t)}`);
  return result;
}

async function stepAssets(): Promise<void> {
  const t = now();
  await copyAssets();
  console.log(`[build] assets: ${ms(t)}`);
}

// ── production build ─────────────────────────────────────────────────────

async function runBuild(): Promise<void> {
  const total = now();
  console.log("[build] starting production build…");

  await stepClean();

  const { articles, projects } = await stepParseContent();
  await stepPages(articles, projects);
  await stepSitemap(articles, projects);
  await stepCss();
  await stepJs(true, true);
  await stepAssets();

  console.log(`[build] done: ${ms(total)}`);
}

// ── dev server ────────────────────────────────────────────────────────────

async function runDev(): Promise<void> {
  console.log("[dev] starting dev server…");

  // Initial build (no clean — faster restarts)
  await mkdir(DIST_DIR, { recursive: true });
  const { articles, projects } = await stepParseContent();
  await Promise.all([
    stepPages(articles, projects),
    stepCss(),
    stepAssets(),
  ]);

  // esbuild context for JS watch + serve
  const ctx = await esbuild.context({
    entryPoints: [join(SRC_DIR, "ts/main.ts")],
    bundle: true,
    format: "esm",
    target: "es2022",
    outfile: join(DIST_DIR, "main.js"),
    minify: false,
    sourcemap: true,
    logLevel: "info",
  });

  await ctx.watch();

  const serveResult = await ctx.serve({
    servedir: DIST_DIR,
    host: "localhost",
    port: 3000,
  });

  const host = serveResult.hosts[0] ?? "localhost";
  console.log(`[dev] serving on http://${host}:${serveResult.port}`);
  console.log("[dev] watching src/ for changes…");

  // Watch non-TS files with Node's fs.watch
  const { watch } = await import("node:fs");
  const WATCHED_EXTS = new Set([".css", ".html", ".md"]);

  watch(SRC_DIR, { recursive: true }, (_, filename) => {
    if (filename === null) return;
    const ext = filename.slice(filename.lastIndexOf("."));
    if (!WATCHED_EXTS.has(ext)) return;

    const t = now();

    if (ext === ".css") {
      concatCss()
        .then(() => console.log(`[dev] CSS rebuilt: ${ms(t)}`))
        .catch((err: unknown) => console.error("[dev] CSS error:", err));
    } else if (ext === ".md") {
      stepParseContent()
        .then(({ articles: a, projects: p }) => stepPages(a, p))
        .then(() => console.log(`[dev] pages rebuilt: ${ms(t)}`))
        .catch((err: unknown) => console.error("[dev] pages error:", err));
    } else if (ext === ".html") {
      // Template change — rebuild pages
      stepParseContent()
        .then(({ articles: a, projects: p }) => stepPages(a, p))
        .then(() => console.log(`[dev] pages rebuilt (template change): ${ms(t)}`))
        .catch((err: unknown) => console.error("[dev] pages error:", err));
    }
  });

  // Keep the process alive
  process.on("SIGINT", () => {
    console.log("\n[dev] stopping…");
    ctx.dispose().finally(() => process.exit(0));
  });
}

// ── entry point ───────────────────────────────────────────────────────────

(isDev ? runDev() : runBuild()).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[build] fatal: ${message}`);
  process.exit(1);
});
