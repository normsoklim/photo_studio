/**
 * Cute Photo Booth - Canvas composer.
 *
 * Combines the laid-out photos, the selected frame, optional date/caption
 * into a single canvas and exports it as a downloadable image.
 *
 * Rendering order:
 *   1. Draw layout (background + photos + photo borders)
 *   2. Draw frame decorations (transparent center, corners only)
 *   3. Draw title at top
 *   4. Draw date and optional caption at bottom
 *   5. Export as PNG
 */

import type { FrameId, LayoutId } from "./photo-booth";
import { drawLayout } from "./photo-layouts";
import { drawFrame } from "./photo-frames";

/* ------------------------------------------------------------------ */
/* Composition                                                        */
/* ------------------------------------------------------------------ */

/**
 * Render the final collage: layout -> frame -> title -> date/caption overlay.
 * Returns a data URL (PNG) of the finished image.
 */
export async function composePhotoBoothImage({
  layoutId,
  frameId,
  photos, // data URLs in capture order
  caption,
  showDate,
}: {
  layoutId: LayoutId;
  frameId: FrameId;
  photos: string[];
  caption: string;
  showDate: boolean;
}): Promise<string> {
  // 1. Draw the layout (photos arranged on canvas with background)
  const canvas = await drawLayout(layoutId, photos);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to get canvas 2d context");

  const { width, height } = canvas;

  // 2. Draw the selected frame on top with a transparent center.
  //    The frame only draws borders and corner decorations - it never
  //    covers the photos. No globalAlpha is applied so photos stay vivid.
  drawFrame(ctx, width, height, frameId);

  // 3. Draw the cute title at the top
  const title = "Cute Memories ♡";
  ctx.save();
  ctx.font = `bold ${Math.max(20, width / 30)}px "Nunito", sans-serif`;
  ctx.fillStyle = "#514454";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  // White outline for legibility against any background
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  const titlePad = 30;
  ctx.strokeText(title, width / 2, titlePad);
  ctx.fillText(title, width / 2, titlePad);
  ctx.restore();

  // 4. Optional date stamp (bottom-left, cute)
  if (showDate) {
    const dateStr = new Date().toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    ctx.save();
    ctx.font = `bold ${Math.max(14, width / 50)}px "Nunito", sans-serif`;
    ctx.fillStyle = "#514454";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    // White outline for legibility
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    const pad = 26;
    ctx.strokeText(dateStr, pad, height - pad);
    ctx.fillText(dateStr, pad, height - pad);
    ctx.restore();
  }

  // 5. Optional caption (bottom-center, above date if both shown)
  if (caption.trim()) {
    ctx.save();
    ctx.font = `bold ${Math.max(16, width / 40)}px "Nunito", sans-serif`;
    ctx.fillStyle = "#514454";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    const captionY = showDate ? height - 72 : height - 40;
    ctx.strokeText(caption.trim(), width / 2, captionY);
    ctx.fillText(caption.trim(), width / 2, captionY);
    ctx.restore();
  }

  return canvas.toDataURL("image/png", 0.95);
}

/* ------------------------------------------------------------------ */
/* Download                                                           */
/* ------------------------------------------------------------------ */

/** Download a data URL as an image file. */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
