/**
 * Cute Photo Booth - Face filters for captured photos.
 *
 * Reuses the shared face filter drawing utilities from
 * src/features/camera/face-filter-draw.ts so the same cute decorations
 * (bunny ears, cat ears, strawberry, angel halo, pixel shades) appear
 * on photo booth captures.
 */

import type { FaceFilterId } from '@/features/camera/face-filters';
import {
  drawFaceFilter,
  type PixelShadesSettings,
} from '@/features/camera/face-filter-draw';
import {
  DEFAULT_PIXEL_SHADES_STYLE,
  PIXEL_SHADES_STYLES,
} from '@/features/camera/pixel-shades';

export type PhotoBoothFilterId = FaceFilterId;

export interface PhotoBoothFilter {
  id: PhotoBoothFilterId;
  name: string;
  emoji: string;
  description: string;
}

export const PHOTO_BOOTH_FILTERS: PhotoBoothFilter[] = [
  {
    id: 'none',
    name: 'Natural',
    emoji: '🌸',
    description: 'No face decorations',
  },
  {
    id: 'bunny',
    name: 'Bunny Girl',
    emoji: '🐰',
    description: 'Bunny ears and rosy cheeks',
  },
  {
    id: 'cat',
    name: 'Cute Cat',
    emoji: '🐱',
    description: 'Cat ears, nose and blush',
  },
  {
    id: 'strawberry',
    name: 'Strawberry',
    emoji: '🍓',
    description: 'Strawberry decoration and blush',
  },
  {
    id: 'angel',
    name: 'Little Angel',
    emoji: '😇',
    description: 'Angel halo and sparkles',
  },
  {
    id: 'shades',
    name: 'Pixel Shades',
    emoji: '😎',
    description: 'Pixelated deal-with-it sunglasses',
  },
];

export const DEFAULT_SHADES_SETTINGS: PixelShadesSettings = {
  mode: 'auto',
  style: PIXEL_SHADES_STYLES.find(
    (s) => s.id === DEFAULT_PIXEL_SHADES_STYLE,
  )!,
  pixelSize: 0.03,
  scale: 1,
  opacity: 1,
  anchorPct: { x: 0.5, y: 0.5 },
  frameColorOverride: null,
};

/**
 * Apply a face filter to a captured photo canvas.
 *
 * Draws the source image onto the canvas, then overlays the selected face
 * filter using MediaPipe face landmarks. Returns the canvas data URL.
 *
 * @param ctx - Canvas 2D context (canvas already sized to the image)
 * @param image - Video element or image source to draw
 * @param width - Canvas width
 * @param height - Canvas height
 * @param filter - Selected filter id
 * @param landmarks - Detected face landmarks (optional; filter is skipped if missing)
 * @param shadesSettings - Pixel shades settings (only used for 'shades' filter)
 * @param shouldMirror - Whether to mirror the image (front camera)
 */
export function applyFilterToCanvas({
  ctx,
  image,
  width,
  height,
  filter,
  landmarks,
  shadesSettings = DEFAULT_SHADES_SETTINGS,
  shouldMirror = true,
}: {
  ctx: CanvasRenderingContext2D;
  image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
  width: number;
  height: number;
  filter: PhotoBoothFilterId;
  landmarks: { x: number; y: number }[] | null;
  shadesSettings?: PixelShadesSettings;
  shouldMirror?: boolean;
}): string {
  // Draw the source image onto the canvas.
  if (shouldMirror) {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(image, -width, 0, width, height);
    ctx.restore();
  } else {
    ctx.drawImage(image, 0, 0, width, height);
  }

  // Apply the face filter on top if we have landmarks and a non-none filter.
  if (filter !== 'none' && landmarks) {
    drawFaceFilter(ctx, landmarks, width, height, filter, shadesSettings);
  }

  return ctx.canvas.toDataURL('image/png', 0.92);
}
