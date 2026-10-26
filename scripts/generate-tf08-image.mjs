import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(
  root,
  "public",
  "performance-fixtures",
  "tour-card.jpg",
);

// Original geometric artwork: no external photo, font, or network resource.
const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="sky" x2="0" y2="1">
      <stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#dbeafe"/>
    </linearGradient>
    <linearGradient id="water" x2="0" y2="1">
      <stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#075985"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#sky)"/>
  <circle cx="930" cy="180" r="82" fill="#fde68a"/>
  <path d="M0 500 240 260l190 205 190-170 270 265v340H0Z" fill="#0f766e"/>
  <path d="m500 560 240-280 290 295 170-145v470H430Z" fill="#166534"/>
  <path d="M0 575q180-55 360 0t360 0 480 0v325H0Z" fill="url(#water)"/>
  <path d="M0 700q210-70 420 0t420 0 360 0" fill="none" stroke="#e0f2fe" stroke-width="18" opacity=".75"/>
  <path d="M0 790q180-55 360 0t360 0 480 0" fill="none" stroke="#bae6fd" stroke-width="12" opacity=".65"/>
  <rect x="48" y="48" width="1104" height="804" rx="36" fill="none" stroke="#fff" stroke-width="8" opacity=".8"/>
</svg>`);

await mkdir(path.dirname(output), { recursive: true });
await sharp(svg)
  .jpeg({ quality: 88, chromaSubsampling: "4:2:0" })
  .toFile(output);
console.log(`Generated ${path.relative(root, output)}`);
