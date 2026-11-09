/**
 * Cute Photo Booth - Frame themes.
 *
 * Two representations per theme:
 *   1. `svg` - inline SVG used for preview thumbnails in the UI.
 *   2. `draw` - Canvas API function that draws the frame on the final canvas
 *              with a fully transparent center so photos are never covered.
 *
 * Frame decorations are drawn at the corners and edges only, never over
 * the photo grid. All dimensions are proportional to the canvas size.
 */

import type { FrameId, FrameTheme } from "./photo-booth";
export type { FrameTheme };
import {
  drawPearlHeart,
  drawBow,
  drawSmallHeart,
  drawStar,
  drawSparkle,
  drawStrawberry,
} from "./photo-layouts";

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/* ------------------------------------------------------------------ */
/* Frame SVG markup (preview thumbnails only)                         */
/* ------------------------------------------------------------------ */

/** Pink Kawaii: pastel pink border, hearts, bows, sparkles. */
const pinkKawaiiSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 1000">
  <!-- Outer pastel pink border -->
  <path d="M 30 30 L 370 30 L 370 970 L 30 970 Z"
        fill="none" stroke="#f49cbd" stroke-width="18" stroke-linejoin="round"/>
  <!-- Inner thin white border -->
  <path d="M 52 52 L 348 52 L 348 948 L 52 948 Z"
        fill="none" stroke="#ffe0ed" stroke-width="6" stroke-linejoin="round"/>
  <!-- Top-left heart -->
  <path d="M 50 50 L 58 58 L 66 50 L 58 42 Z" fill="#ffe0ed" opacity="0.95"/>
  <!-- Top-right bow -->
  <path d="M 342 50 L 350 58 L 358 50 L 350 42 Z" fill="#f49cbd" opacity="0.95"/>
  <!-- Bottom-left heart -->
  <path d="M 50 950 L 58 958 L 66 950 L 58 942 Z" fill="#ffe0ed" opacity="0.95"/>
  <!-- Bottom-right bow -->
  <path d="M 342 950 L 350 958 L 358 950 L 350 942 Z" fill="#f49cbd" opacity="0.95"/>
  <!-- Top-center sparkle -->
  <path d="M 200 40 L 204 48 L 212 48 L 206 52 L 208 60 L 200 54 L 192 60 L 194 52 L 188 48 L 196 48 Z" fill="#ffe0ed"/>
  <!-- Bottom-center heart -->
  <path d="M 200 960 L 208 968 L 216 960 L 208 952 Z" fill="#ffe0ed" opacity="0.9"/>
</svg>
`;

/** Lavender Dream: soft purple border, stars, clouds. */
const lavenderDreamSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 1000">
  <!-- Outer lavender border -->
  <path d="M 30 30 L 370 30 L 370 970 L 30 970 Z"
        fill="none" stroke="#a58bd7" stroke-width="18" stroke-linejoin="round"/>
  <!-- Inner thin dashed border -->
  <path d="M 52 52 L 348 52 L 348 948 L 52 948 Z"
        fill="none" stroke="#d8c4f5" stroke-width="4" stroke-dasharray="8 8" stroke-linejoin="round"/>
  <!-- Top-left star -->
  <path d="M 50 50 L 54 58 L 62 58 L 56 62 L 58 70 L 50 64 L 42 70 L 44 62 L 38 58 L 46 58 Z" fill="#c3a8eb"/>
  <!-- Top-right star -->
  <path d="M 350 50 L 354 58 L 362 58 L 356 62 L 358 70 L 350 64 L 342 70 L 344 62 L 338 58 L 346 58 Z" fill="#c3a8eb"/>
  <!-- Bottom-left star -->
  <path d="M 50 950 L 54 958 L 62 958 L 56 962 L 58 970 L 50 964 L 42 970 L 44 962 L 38 958 L 46 958 Z" fill="#c3a8eb"/>
  <!-- Bottom-right star -->
  <path d="M 350 950 L 354 958 L 362 958 L 356 962 L 358 970 L 350 964 L 342 970 L 344 962 L 338 958 L 346 958 Z" fill="#c3a8eb"/>
  <!-- Top-center sparkle -->
  <path d="M 200 40 L 204 48 L 212 48 L 206 52 L 208 60 L 200 54 L 192 60 L 194 52 L 188 48 L 196 48 Z" fill="#e3dfff"/>
  <!-- Bottom-center cloud -->
  <path d="M 180 960 Q 190 950 200 960 Q 210 950 220 960 L 220 970 Q 210 980 200 970 Q 190 980 180 970 Z" fill="#e3dfff"/>
</svg>
`;

/** Strawberry Love: strawberry decorations, pink and red details. */
const strawberryLoveSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 1000">
  <!-- Outer strawberry pink border -->
  <path d="M 30 30 L 370 30 L 370 970 L 30 970 Z"
        fill="none" stroke="#ff8da1" stroke-width="18" stroke-linejoin="round"/>
  <!-- Inner thin pink border -->
  <path d="M 52 52 L 348 52 L 348 948 L 52 948 Z"
        fill="none" stroke="#ff6b8b" stroke-width="4" stroke-linejoin="round"/>
  <!-- Top-left strawberry -->
  <path d="M 50 50 Q 60 40 70 50 Q 80 40 90 50 L 90 70 Q 80 80 70 70 Q 60 80 50 70 Z" fill="#ff6b8b"/>
  <path d="M 60 55 L 60 47 L 65 51 L 70 55 L 65 59 L 60 55 Z" fill="#7cb342"/>
  <!-- Top-right strawberry -->
  <path d="M 310 50 Q 320 40 330 50 Q 340 40 350 50 L 350 70 Q 340 80 330 70 Q 320 80 310 70 Z" fill="#ff6b8b"/>
  <path d="M 320 55 L 320 47 L 325 51 L 330 55 L 325 59 L 320 55 Z" fill="#7cb342"/>
  <!-- Bottom-left strawberry -->
  <path d="M 50 930 Q 60 940 70 930 Q 80 940 90 930 L 90 950 Q 80 960 70 950 Q 60 960 50 950 Z" fill="#ff6b8b"/>
  <path d="M 60 935 L 60 943 L 65 939 L 70 935 L 65 931 L 60 935 Z" fill="#7cb342"/>
  <!-- Bottom-right strawberry -->
  <path d="M 310 930 Q 320 940 330 930 Q 340 940 350 930 L 350 950 Q 340 960 330 950 Q 320 960 310 950 Z" fill="#ff6b8b"/>
  <path d="M 320 935 L 320 943 L 325 939 L 330 935 L 325 931 L 320 935 Z" fill="#7cb342"/>
  <!-- Top-center sparkle -->
  <path d="M 200 40 L 204 48 L 212 48 L 206 52 L 208 60 L 200 54 L 192 60 L 194 52 L 188 48 L 196 48 Z" fill="#ffd54f"/>
  <!-- Bottom-center heart -->
  <path d="M 200 960 L 208 968 L 216 960 L 208 952 Z" fill="#ff6b8b" opacity="0.9"/>
</svg>
`;

/** Classic Film: clean white border, film-style typography, small date. */
const classicFilmSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 1000">
  <!-- Outer clean white border -->
  <path d="M 25 25 L 375 25 L 375 975 L 25 975 Z"
        fill="none" stroke="#ffffff" stroke-width="20" stroke-linejoin="round"/>
  <!-- Inner thin white border -->
  <path d="M 45 45 L 355 45 L 355 955 L 45 955 Z"
        fill="none" stroke="#f8f8f8" stroke-width="4" stroke-linejoin="round"/>
  <!-- Top-left film sprocket -->
  <rect x="40" y="40" width="12" height="12" fill="#ffffff" rx="2"/>
  <!-- Top-right film sprocket -->
  <rect x="348" y="40" width="12" height="12" fill="#ffffff" rx="2"/>
  <!-- Bottom-left film sprocket -->
  <rect x="40" y="948" width="12" height="12" fill="#ffffff" rx="2"/>
  <!-- Bottom-right film sprocket -->
  <rect x="348" y="948" width="12" height="12" fill="#ffffff" rx="2"/>
  <!-- Top-center dot -->
  <circle cx="200" cy="40" r="6" fill="#ffffff"/>
  <!-- Bottom-center dot -->
  <circle cx="200" cy="960" r="6" fill="#ffffff"/>
</svg>
`;

/* ------------------------------------------------------------------ */
/* Canvas API frame drawing functions                                 */
/* ------------------------------------------------------------------ */

/**
 * Draw the Pink Kawaii frame on the canvas.
 * Border: pastel pink, thin white inner line.
 * Decorations: hearts, bows, sparkles at corners and center edges.
 * Center: fully transparent.
 */
function drawPinkKawaiiFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const s = Math.min(width, height) / 400; // scale relative to 400x1000 base
  const borderW = 22 * s;
  const innerW = 6 * s;
  const cornerOffset = 30 * s;
  const decSize = 34 * s;

  ctx.save();

  // Outer border - pastel pink, rounded rect
  ctx.beginPath();
  ctx.roundRect(borderW / 2, borderW / 2, width - borderW, height - borderW, 28 * s);
  ctx.lineWidth = borderW;
  ctx.strokeStyle = "#f49cbd";
  ctx.stroke();

  // Inner thin white border
  ctx.beginPath();
  ctx.roundRect(borderW + innerW, borderW + innerW, width - borderW * 2 - innerW * 2, height - borderW * 2 - innerW * 2, 22 * s);
  ctx.lineWidth = innerW;
  ctx.strokeStyle = "#ffe0ed";
  ctx.stroke();

  // Top-left: pearl heart
  drawPearlHeart(ctx, cornerOffset, cornerOffset, decSize, "#ffe0ed");

  // Top-right: bow
  drawBow(ctx, width - cornerOffset, cornerOffset, decSize, "#f49cbd");

  // Bottom-left: small heart
  drawSmallHeart(ctx, cornerOffset, height - cornerOffset, decSize * 0.8, "#f49cbd");

  // Bottom-right: bow
  drawBow(ctx, width - cornerOffset, height - cornerOffset, decSize, "#f49cbd");

  // Top-center: tiny sparkle
  drawSparkle(ctx, width / 2, cornerOffset * 0.5, decSize * 0.5, "#ffe0ed");

  // Bottom-center: tiny heart
  drawSmallHeart(ctx, width / 2, height - cornerOffset * 0.5, decSize * 0.6, "#ffe0ed");

  ctx.restore();
}

/**
 * Draw the Lavender Dream frame on the canvas.
 * Border: soft lavender, inner dashed line.
 * Decorations: stars at corners, sparkles and cloud at center edges.
 * Center: fully transparent.
 */
function drawLavenderDreamFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const s = Math.min(width, height) / 400;
  const borderW = 22 * s;
  const cornerOffset = 30 * s;
  const decSize = 30 * s;

  ctx.save();

  // Outer border - lavender
  ctx.beginPath();
  ctx.roundRect(borderW / 2, borderW / 2, width - borderW, height - borderW, 24 * s);
  ctx.lineWidth = borderW;
  ctx.strokeStyle = "#a58bd7";
  ctx.stroke();

  // Inner dashed line
  ctx.beginPath();
  ctx.roundRect(borderW * 1.8, borderW * 1.8, width - borderW * 3.6, height - borderW * 3.6, 20 * s);
  ctx.lineWidth = 4 * s;
  ctx.strokeStyle = "#d8c4f5";
  ctx.setLineDash([10 * s, 10 * s]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Corners: stars
  drawStar(ctx, cornerOffset, cornerOffset, decSize, "#c3a8eb");
  drawStar(ctx, width - cornerOffset, cornerOffset, decSize, "#c3a8eb");
  drawStar(ctx, cornerOffset, height - cornerOffset, decSize, "#c3a8eb");
  drawStar(ctx, width - cornerOffset, height - cornerOffset, decSize, "#c3a8eb");

  // Top-center: sparkle
  drawSparkle(ctx, width / 2, cornerOffset * 0.5, decSize * 0.6, "#e3dfff");

  // Bottom-center: small cloud-like sparkle
  drawSparkle(ctx, width / 2, height - cornerOffset * 0.5, decSize * 0.6, "#e3dfff");

  ctx.restore();
}

/**
 * Draw the Strawberry Love frame on the canvas.
 * Border: strawberry pink, inner thin pink line.
 * Decorations: strawberries at corners, sparkles and heart at center edges.
 * Center: fully transparent.
 */
function drawStrawberryLoveFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const s = Math.min(width, height) / 400;
  const borderW = 22 * s;
  const innerW = 4 * s;
  const cornerOffset = 34 * s;
  const decSize = 38 * s;

  ctx.save();

  // Outer border - strawberry pink
  ctx.beginPath();
  ctx.roundRect(borderW / 2, borderW / 2, width - borderW, height - borderW, 24 * s);
  ctx.lineWidth = borderW;
  ctx.strokeStyle = "#ff8da1";
  ctx.stroke();

  // Inner thin pink border
  ctx.beginPath();
  ctx.roundRect(borderW + innerW, borderW + innerW, width - borderW * 2 - innerW * 2, height - borderW * 2 - innerW * 2, 20 * s);
  ctx.lineWidth = innerW;
  ctx.strokeStyle = "#ff6b8b";
  ctx.stroke();

  // Corners: strawberries
  drawStrawberry(ctx, cornerOffset, cornerOffset, decSize);
  drawStrawberry(ctx, width - cornerOffset, cornerOffset, decSize);
  drawStrawberry(ctx, cornerOffset, height - cornerOffset, decSize);
  drawStrawberry(ctx, width - cornerOffset, height - cornerOffset, decSize);

  // Top-center: sparkle
  drawSparkle(ctx, width / 2, cornerOffset * 0.5, decSize * 0.5, "#ffd54f");

  // Bottom-center: heart
  drawSmallHeart(ctx, width / 2, height - cornerOffset * 0.5, decSize * 0.7, "#ff6b8b");

  ctx.restore();
}

/**
 * Draw the Classic Film frame on the canvas.
 * Border: clean white, film-style sprocket holes at corners.
 * Decorations: minimal dots and sprocket marks.
 * Center: fully transparent.
 */
function drawClassicFilmFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const s = Math.min(width, height) / 400;
  const borderW = 24 * s;
  const innerW = 5 * s;
  const cornerOffset = 32 * s;
  const sprocketSize = 14 * s;

  ctx.save();

  // Outer border - clean white
  ctx.beginPath();
  ctx.roundRect(borderW / 2, borderW / 2, width - borderW, height - borderW, 26 * s);
  ctx.lineWidth = borderW;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  // Inner thin border
  ctx.beginPath();
  ctx.roundRect(borderW + innerW, borderW + innerW, width - borderW * 2 - innerW * 2, height - borderW * 2 - innerW * 2, 22 * s);
  ctx.lineWidth = innerW;
  ctx.strokeStyle = "#f0f0f0";
  ctx.stroke();

  // Corner film sprocket holes
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(cornerOffset - sprocketSize / 2, cornerOffset - sprocketSize / 2, sprocketSize, sprocketSize, 3 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(width - cornerOffset - sprocketSize / 2, cornerOffset - sprocketSize / 2, sprocketSize, sprocketSize, 3 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(cornerOffset - sprocketSize / 2, height - cornerOffset - sprocketSize / 2, sprocketSize, sprocketSize, 3 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(width - cornerOffset - sprocketSize / 2, height - cornerOffset - sprocketSize / 2, sprocketSize, sprocketSize, 3 * s);
  ctx.fill();

  // Top-center dot
  ctx.beginPath();
  ctx.arc(width / 2, cornerOffset * 0.5, sprocketSize * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Bottom-center dot
  ctx.beginPath();
  ctx.arc(width / 2, height - cornerOffset * 0.5, sprocketSize * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Theme registry                                                     */
/* ------------------------------------------------------------------ */

export const frames: Record<FrameId, FrameTheme> = {
  "pink-kawaii": {
    id: "pink-kawaii",
    name: "Pink Kawaii",
    description: "Hearts, bows, and pastel pink.",
    svg: pinkKawaiiSvg,
    draw: drawPinkKawaiiFrame,
    accentColor: "#f49cbd",
  },
  "lavender-dream": {
    id: "lavender-dream",
    name: "Lavender Dream",
    description: "Lavender, stars, and sparkles.",
    svg: lavenderDreamSvg,
    draw: drawLavenderDreamFrame,
    accentColor: "#a58bd7",
  },
  "strawberry-love": {
    id: "strawberry-love",
    name: "Strawberry Love",
    description: "Strawberries and cute decorations.",
    svg: strawberryLoveSvg,
    draw: drawStrawberryLoveFrame,
    accentColor: "#ff8da1",
  },
  "classic-film": {
    id: "classic-film",
    name: "Classic Film",
    description: "Clean white border with film-style details.",
    svg: classicFilmSvg,
    draw: drawClassicFilmFrame,
    accentColor: "#ffffff",
  },
};

/**
 * Convert a frame theme's SVG into a data URL usable as an image source.
 * Used for preview thumbnails in the UI only.
 */
export function frameToDataUrl(theme: FrameTheme): string {
  return svgToDataUrl(theme.svg);
}

/**
 * Draw a frame theme onto a canvas context using the Canvas API.
 * The frame has a transparent center - only borders and corner
 * decorations are drawn, never covering the photos.
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frameId: FrameId,
): void {
  const theme = frames[frameId];
  if (!theme || !theme.draw) return;
  theme.draw(ctx, width, height);
}
