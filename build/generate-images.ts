// build/generate-images.ts
// Generates apple-touch-icon.png (180×180) and og-default.png (1200×630)
// from the SVG favicon design.

import { mkdir, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST_DIR = join(__dirname, "../dist");

const ACCENT = "#c0792b"; // oklch(68% 0.18 55) approximation
const TEXT_COLOR = "#fcf8f3"; // oklch(98% 0.01 55) approximation

function touchIconSvg(): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="34" fill="${ACCENT}"/>
  <text x="90" y="128" font-family="system-ui, sans-serif" font-size="112" font-weight="700"
        text-anchor="middle" fill="${TEXT_COLOR}">M</text>
</svg>`;
  return Buffer.from(svg);
}

function ogImageSvg(): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#1a1a1a"/>
  <rect x="40" y="40" width="1120" height="550" rx="16" fill="#222"/>
  <rect x="80" y="240" width="80" height="80" rx="16" fill="${ACCENT}"/>
  <text x="80" y="300" font-family="system-ui, sans-serif" font-size="50" font-weight="700"
        text-anchor="middle" fill="${TEXT_COLOR}" dx="40">M</text>
  <text x="190" y="296" font-family="system-ui, sans-serif" font-size="42" font-weight="700"
        fill="#e5e5e5">Matt Noth</text>
  <text x="80" y="370" font-family="system-ui, sans-serif" font-size="22"
        fill="#999">mattnoth.dev</text>
</svg>`;
  return Buffer.from(svg);
}

export async function generateImages(): Promise<void> {
  // apple-touch-icon.png → dist root
  const touchIconPath = join(DIST_DIR, "apple-touch-icon.png");
  try {
    await stat(touchIconPath);
    console.log("[images] apple-touch-icon.png already exists — skipping");
  } catch {
    await mkdir(DIST_DIR, { recursive: true });
    const png = await sharp(touchIconSvg()).png().toBuffer();
    await writeFile(touchIconPath, png);
    console.log("[images] wrote apple-touch-icon.png (180×180)");
  }

  // og-default.png → dist/assets/images/
  const ogDir = join(DIST_DIR, "assets/images");
  const ogPath = join(ogDir, "og-default.png");
  try {
    await stat(ogPath);
    console.log("[images] og-default.png already exists — skipping");
  } catch {
    await mkdir(ogDir, { recursive: true });
    const png = await sharp(ogImageSvg()).png().toBuffer();
    await writeFile(ogPath, png);
    console.log("[images] wrote og-default.png (1200×630)");
  }
}
