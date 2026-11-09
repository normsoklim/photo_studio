/**
 * Cute Photo Booth - Layout definitions.
 *
 * Each layout describes how the six captured photos are arranged on the
 * final canvas. Layouts are resolution-independent: they define a fixed
 * output canvas size and a `draw` function that positions each photo.
 *
 * The layout layer is responsible ONLY for:
 *   - Canvas background
 *   - Photo grid positions and dimensions
 *   - Individual photo borders and subtle shadows
 *
 * Frame decorations (hearts, bows, borders, etc.) are drawn separately
 * by the frame module, on top of the layout, with a transparent center.
 */

import type { LayoutId, LayoutDefinition } from "./photo-booth";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                     */
/* ------------------------------------------------------------------ */

/** Draw a single photo into a rectangular slot with a small rounded border. */
function drawPhotoSlot(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 12,
): void {
  // Drop shadow behind the photo
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  // Clip and draw the photo
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();

  // Thin inner stroke for definition
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 1, w - 2, h - 2, radius - 1);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.stroke();
  ctx.restore();
}

/** Wait for an image to load. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* ------------------------------------------------------------------ */
/* Cute decoration helpers (used by frame module)                     */
/* ------------------------------------------------------------------ */

/** Draw a heart made of small pearl circles. */
export function drawPearlHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color = "#ffffff",
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  const step = 0.18;
  for (let t = 0; t < Math.PI * 2; t += step) {
    const px = 16 * Math.pow(Math.sin(t), 3);
    const py = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    const rx = cx + px * (size / 24);
    const ry = cy + py * (size / 24);
    ctx.beginPath();
    ctx.arc(rx, ry, size * 0.055, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Draw a cute bow. */
export function drawBow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color = "#f49cbd",
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
  ctx.shadowBlur = 2;
  // Left loop
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.28, cy, size * 0.22, size * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  // Right loop
  ctx.beginPath();
  ctx.ellipse(cx + size * 0.28, cy, size * 0.22, size * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  // Center knot
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.14, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tails
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.08, cy + size * 0.18);
  ctx.lineTo(cx - size * 0.22, cy + size * 0.55);
  ctx.lineTo(cx - size * 0.04, cy + size * 0.45);
  ctx.lineTo(cx + size * 0.04, cy + size * 0.45);
  ctx.lineTo(cx + size * 0.22, cy + size * 0.55);
  ctx.lineTo(cx + size * 0.08, cy + size * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draw a small solid heart. */
export function drawSmallHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color = "#f49cbd",
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.bezierCurveTo(cx - size * 0.4, cy - size * 0.35, cx - size * 0.85, cy + size * 0.15, cx, cy + size * 0.65);
  ctx.bezierCurveTo(cx + size * 0.85, cy + size * 0.15, cx + size * 0.4, cy - size * 0.35, cx, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draw a five-pointed star. */
export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color = "#c3a8eb",
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const x = cx + Math.cos(angle) * size;
    const y = cy + Math.sin(angle) * size;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    const angle2 = (Math.PI * 2 * (i + 0.5)) / 5 - Math.PI / 2;
    const x2 = cx + Math.cos(angle2) * (size * 0.4);
    const y2 = cy + Math.sin(angle2) * (size * 0.4);
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draw a small sparkle (four-pointed star). */
export function drawSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color = "#ffffff",
): void {
  ctx.save();
  ctx.fillStyle = color;
  const h = size / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h);
  ctx.lineTo(cx + h * 0.3, cy - h * 0.3);
  ctx.lineTo(cx + h, cy);
  ctx.lineTo(cx + h * 0.3, cy + h * 0.3);
  ctx.lineTo(cx, cy + h);
  ctx.lineTo(cx - h * 0.3, cy + h * 0.3);
  ctx.lineTo(cx - h, cy);
  ctx.lineTo(cx - h * 0.3, cy - h * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draw a strawberry decoration. */
export function drawStrawberry(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
): void {
  ctx.save();
  // Strawberry body
  ctx.fillStyle = "#ff6b8b";
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.45, size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  // Leaves
  ctx.fillStyle = "#7cb342";
  ctx.beginPath();
  ctx.moveTo(cx, cy - size * 0.35);
  ctx.lineTo(cx - size * 0.3, cy - size * 0.15);
  ctx.lineTo(cx - size * 0.15, cy - size * 0.35);
  ctx.lineTo(cx, cy - size * 0.5);
  ctx.lineTo(cx + size * 0.15, cy - size * 0.35);
  ctx.lineTo(cx + size * 0.3, cy - size * 0.15);
  ctx.closePath();
  ctx.fill();
  // Seeds
  ctx.fillStyle = "#ffd54f";
  const seedOffsets = [
    [-0.2, -0.1], [0.2, -0.1], [-0.15, 0.1], [0.15, 0.1], [-0.1, 0.3], [0.1, 0.3],
  ];
  for (const [dx, dy] of seedOffsets) {
    ctx.beginPath();
    ctx.arc(cx + dx * size, cy + dy * size, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Layouts                                                            */
/* ------------------------------------------------------------------ */

export const layouts: Record<LayoutId, LayoutDefinition> = {
  /** Six photos vertically, like a real photo booth strip. */
  strip: {
    id: "strip",
    name: "Classic Photo Strip",
    description: "Six photos vertically, just like a real photo booth.",
    width: 900,
    height: 1600,
  },
  /** Two columns × three rows, portrait poster with cute frames. */
  grid: {
    id: "grid",
    name: "Cute Grid",
    description: "Two columns × three rows, with frame decorations around the outside.",
    width: 900,
    height: 1200,
  },
  /** Six photos arranged horizontally. */
  horizontal: {
    id: "horizontal",
    name: "Horizontal Strip",
    description: "Six photos side by side in a long strip.",
    width: 1800,
    height: 600,
  },
  /** Polaroid-style photos with cute decorations. */
  polaroid: {
    id: "polaroid",
    name: "Polaroid Scrapbook",
    description: "Polaroid-style photos with cute decorations.",
    width: 1200,
    height: 1600,
  },
};

/* ------------------------------------------------------------------ */
/* Photo slot calculation                                             */
/* ------------------------------------------------------------------ */

/**
 * Calculate photo slot positions for a grid layout.
 * Returns an array of { x, y, w, h } for each photo index.
 */
export function calculateGridSlots(
  canvasWidth: number,
  canvasHeight: number,
  cols: number,
  rows: number,
  margin: number,
  gap: number,
): { x: number; y: number; w: number; h: number }[] {
  const cellW = (canvasWidth - margin * 2 - gap * (cols - 1)) / cols;
  const cellH = (canvasHeight - margin * 2 - gap * (rows - 1)) / rows;
  const size = Math.min(cellW, cellH);
  const slots: { x: number; y: number; w: number; h: number }[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = margin + col * (size + gap) + (cellW - size) / 2;
      const y = margin + row * (size + gap) + (cellH - size) / 2;
      slots.push({ x, y, w: size, h: size });
    }
  }

  return slots;
}

/**
 * Draw all six photos onto a canvas according to the layout.
 * Only draws background + photos + individual photo borders.
 * No frame decorations are drawn here - those are handled by the frame module.
 * Returns the canvas (already drawn) so the composer can add frames on top.
 */
export async function drawLayout(
  layoutId: LayoutId,
  photos: string[], // data URLs in order
): Promise<HTMLCanvasElement> {
  const layout = layouts[layoutId];
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to get canvas 2d context");

  const images = await Promise.all(photos.map((src) => loadImage(src)));
  const count = photos.length;

  switch (layoutId) {
    case "strip": {
      // Background: soft cream (frame center is transparent, so this shows through)
      ctx.fillStyle = "#fffaf5";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 6 photos vertically, centered horizontally - larger photos for a real strip look
      const gap = 26;
      const topMargin = 90;   // room for title
      const bottomMargin = 130; // room for footer
      const photoW = canvas.width - 140; // wide photos, centered
      const availableH = canvas.height - topMargin - bottomMargin - gap * (count - 1);
      const photoH = availableH / count;
      const x = (canvas.width - photoW) / 2;
      for (let i = 0; i < count; i++) {
        const y = topMargin + i * (photoH + gap);
        drawPhotoSlot(ctx, images[i], x, y, photoW, photoH, 14);
      }
      break;
    }

    case "grid": {
      // Background: soft cream (frame will add its own color theme)
      ctx.fillStyle = "#fffaf5";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2 columns × 3 rows, portrait poster
      const margin = 40;
      const gap = 30;
      const slots = calculateGridSlots(canvas.width, canvas.height, 2, 3, margin, gap);

      for (let i = 0; i < count && i < slots.length; i++) {
        const slot = slots[i];
        drawPhotoSlot(ctx, images[i], slot.x, slot.y, slot.w, slot.h, 20);
      }
      break;
    }

    case "horizontal": {
      // Background: soft cream
      ctx.fillStyle = "#fffaf5";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 6 photos side by side
      const gap = 24;
      const rowH = canvas.height - gap * 2;
      const size = Math.min(rowH, (canvas.width - gap * (count + 1)) / count);
      const y = (canvas.height - size) / 2;
      for (let i = 0; i < count; i++) {
        const x = gap + i * (size + gap);
        drawPhotoSlot(ctx, images[i], x, y, size, size, 14);
      }
      break;
    }

    case "polaroid": {
      // Background: soft cream
      ctx.fillStyle = "#fffaf5";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Polaroid-style: tilted photos with white borders, scattered scrapbook layout
      // All positions are within the 1200x1600 canvas so every photo is visible.
      const polaroidW = 320;
      const polaroidH = 380; // includes bottom "paper" tab
      const photoW = 280;
      const photoH = 280;
      const positions = [
        { x: 180, y: 220, rot: -6 },
        { x: 1020, y: 220, rot: 6 },
        { x: 600, y: 300, rot: -3 },
        { x: 180, y: 1050, rot: 5 },
        { x: 1020, y: 1050, rot: -5 },
        { x: 600, y: 1130, rot: 3 },
      ];
      for (let i = 0; i < count; i++) {
        const pos = positions[i];
        ctx.save();
        ctx.translate(pos.x + polaroidW / 2, pos.y + polaroidH / 2);
        ctx.rotate((pos.rot * Math.PI) / 180);

        // White polaroid card
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 6;
        ctx.roundRect(-polaroidW / 2, -polaroidH / 2, polaroidW, polaroidH, 10);
        ctx.fill();
        ctx.shadowColor = "transparent";

        // Photo area (leave bottom tab)
        const photoX = -photoW / 2;
        const photoY = -polaroidH / 2 + 20;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(photoX, photoY, photoW, photoH, 10);
        ctx.clip();
        ctx.drawImage(images[i], photoX, photoY, photoW, photoH);
        ctx.restore();

        // Bottom tab text
        ctx.fillStyle = "#514454";
        ctx.font = "bold 18px Nunito, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Photo ${i + 1}`, 0, polaroidH / 2 - 30);

        ctx.restore();
      }
      break;
    }
  }

  return canvas;
}
