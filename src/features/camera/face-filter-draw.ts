/**
 * Shared face filter drawing utilities.
 *
 * Extracted from FaceFilterCamera.tsx so the same cute face decorations
 * (bunny ears, cat ears, strawberry, angel halo, pixel shades) can be
 * reused by the photo booth capture flow without duplicating code.
 */

import type { FaceFilterId } from './face-filters';
import {
  type PixelShadesMode,
  type PixelShadesSettings,
  type PixelShadesStyle,
} from './pixel-shades';

export type { PixelShadesSettings };

interface Point {
  x: number;
  y: number;
}

export function getPoint(
  landmarks: { x: number; y: number }[],
  index: number,
  width: number,
  height: number,
): Point {
  return {
    x: landmarks[index].x * width,
    y: landmarks[index].y * height,
  };
}

export function drawBlush(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number }[],
  width: number,
  height: number,
) {
  const left = getPoint(landmarks, 205, width, height);
  const right = getPoint(landmarks, 425, width, height);

  [left, right].forEach((point) => {
    const radius = width * 0.045;

    const gradient = ctx.createRadialGradient(
      point.x,
      point.y,
      1,
      point.x,
      point.y,
      radius,
    );

    gradient.addColorStop(0, 'rgba(255, 105, 160, 0.55)');
    gradient.addColorStop(1, 'rgba(255, 105, 160, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(
      point.x,
      point.y,
      radius,
      radius * 0.65,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  });
}

export function drawBunny(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  topY: number,
  faceWidth: number,
) {
  const earWidth = faceWidth * 0.19;
  const earHeight = faceWidth * 0.55;

  [-1, 1].forEach((direction) => {
    ctx.save();

    const x = centerX + direction * faceWidth * 0.22;
    const y = topY - earHeight * 0.35;

    ctx.translate(x, y);
    ctx.rotate(direction * 0.18);

    ctx.fillStyle = '#fff5fa';
    ctx.strokeStyle = '#ed8bb5';
    ctx.lineWidth = Math.max(2, faceWidth * 0.012);

    ctx.beginPath();
    ctx.ellipse(
      0,
      -earHeight * 0.25,
      earWidth * 0.5,
      earHeight * 0.55,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffb4d2';

    ctx.beginPath();
    ctx.ellipse(
      0,
      -earHeight * 0.25,
      earWidth * 0.22,
      earHeight * 0.38,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.restore();
  });
}

export function drawCat(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  topY: number,
  faceWidth: number,
) {
  ctx.save();

  [-1, 1].forEach((direction) => {
    const x = centerX + direction * faceWidth * 0.25;
    const y = topY - faceWidth * 0.12;

    ctx.fillStyle = '#30283b';
    ctx.strokeStyle = '#f4a4ca';
    ctx.lineWidth = Math.max(2, faceWidth * 0.012);

    ctx.beginPath();
    ctx.moveTo(x - faceWidth * 0.13, y + faceWidth * 0.08);
    ctx.lineTo(x, y - faceWidth * 0.23);
    ctx.lineTo(x + faceWidth * 0.13, y + faceWidth * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffb6d8';

    ctx.beginPath();
    ctx.moveTo(x - faceWidth * 0.065, y + faceWidth * 0.025);
    ctx.lineTo(x, y - faceWidth * 0.14);
    ctx.lineTo(x + faceWidth * 0.065, y + faceWidth * 0.025);
    ctx.closePath();
    ctx.fill();
  });

  ctx.restore();
}

export function drawHalo(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  topY: number,
  faceWidth: number,
) {
  ctx.save();

  ctx.strokeStyle = '#ffd45e';
  ctx.lineWidth = Math.max(3, faceWidth * 0.025);
  ctx.shadowColor = '#ffe9a8';
  ctx.shadowBlur = faceWidth * 0.08;

  ctx.beginPath();
  ctx.ellipse(
    centerX,
    topY - faceWidth * 0.25,
    faceWidth * 0.2,
    faceWidth * 0.065,
    -0.08,
    0,
    Math.PI * 2,
  );
  ctx.stroke();

  ctx.restore();
}

export function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Appends a rounded rectangle to the current path (does not fill/stroke).
export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawPixelShades(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: PixelShadesStyle | null,
  mode: PixelShadesMode,
  anchorPct: { x: number; y: number } | null,
  scale: number,
  opacity: number,
  frameColorOverride: string | null,
  landmarks: { x: number; y: number }[] | null,
) {
  const styleFrameColor = style?.frameColor ?? '#0a0a0a';
  const frameColor = frameColorOverride ?? styleFrameColor;
  const lensTint = style?.lensDark ?? '#0a0a0a';
  const lensSheen = style?.lensLight ?? '#ffffff';
  const s = Math.max(0.1, scale);
  const a = Math.min(1, Math.max(0, opacity));

  let centerX: number;
  let centerY: number;
  let baseWidth: number;

  if (mode === 'auto' && landmarks) {
    const leftEye = getPoint(landmarks, 468, width, height);
    const rightEye = getPoint(landmarks, 473, width, height);
    centerX = (leftEye.x + rightEye.x) / 2;
    centerY = (leftEye.y + rightEye.y) / 2;
    baseWidth = Math.abs(rightEye.x - leftEye.x) * 2.2;
  } else if (anchorPct) {
    centerX = anchorPct.x * width;
    centerY = anchorPct.y * height;
    baseWidth = width * 0.18;
  } else {
    return;
  }

  if (baseWidth <= 0) return;

  const glassesWidth = baseWidth * 1.25 * s;
  const glassesHeight = baseWidth * 0.22 * s;
  const glassesX = centerX - glassesWidth / 2;
  const glassesY = centerY - glassesHeight / 2;

  ctx.save();
  ctx.globalAlpha = a;

  // ---- Frame: smooth brow bar + lens rims, no side arms ----
  ctx.fillStyle = frameColor;

  const barHeight = glassesHeight * 0.32;
  roundRectPath(ctx, glassesX, glassesY, glassesWidth, barHeight, barHeight / 2);
  ctx.fill();

  // ---- Lenses: clean, smooth real-glass look ----
  const inset = Math.max(2, baseWidth * 0.018 * s);
  const bridgeGap = glassesWidth * 0.055;
  const lensTop = glassesY + barHeight + inset * 0.5;
  const lensBottom = glassesY + glassesHeight - inset;
  const lensHeight = Math.max(lensBottom - lensTop, 4);
  const lensWidth = (glassesWidth - bridgeGap - inset * 2) / 2;
  const leftLensX = glassesX + inset;
  const rightLensX = glassesX + glassesWidth - inset - lensWidth;
  const lensRadius = lensHeight * 0.4;

  const drawGlassLens = (x: number, y: number) => {
    const r = lensRadius;

    const body = ctx.createLinearGradient(x, y, x, y + lensHeight);
    body.addColorStop(0, hexToRgba(lensTint, 0.78));
    body.addColorStop(0.45, hexToRgba(lensTint, 0.52));
    body.addColorStop(1, hexToRgba(lensTint, 0.40));
    ctx.fillStyle = body;
    roundRectPath(ctx, x, y, lensWidth, lensHeight, r);
    ctx.fill();

    ctx.strokeStyle = hexToRgba(frameColor, 0.30);
    ctx.lineWidth = Math.max(1, baseWidth * 0.007 * s);
    roundRectPath(ctx, x, y, lensWidth, lensHeight, r);
    ctx.stroke();

    const glare = ctx.createRadialGradient(
      x + lensWidth * 0.38,
      y + lensHeight * 0.28,
      0,
      x + lensWidth * 0.38,
      y + lensHeight * 0.28,
      lensWidth * 0.6,
    );
    glare.addColorStop(0, `rgba(255, 255, 255, 0.62)`);
    glare.addColorStop(0.42, `rgba(255, 255, 255, 0.02)`);
    glare.addColorStop(1, `rgba(255, 255, 255, 0)`);
    ctx.fillStyle = glare;
    ctx.beginPath();
    ctx.ellipse(
      x + lensWidth * 0.38,
      y + lensHeight * 0.32,
      lensWidth * 0.52,
      lensHeight * 0.42,
      -0.3,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    const sheen = ctx.createLinearGradient(
      x,
      y + lensHeight * 0.55,
      x,
      y + lensHeight,
    );
    sheen.addColorStop(0, `rgba(255, 255, 255, 0)`);
    sheen.addColorStop(0.75, `rgba(255, 255, 255, 0.10)`);
    sheen.addColorStop(1, `rgba(255, 255, 255, 0.14)`);
    ctx.fillStyle = sheen;
    roundRectPath(ctx, x, y + lensHeight * 0.5, lensWidth, lensHeight * 0.5, r);
    ctx.fill();
  };

  drawGlassLens(leftLensX, lensTop);
  drawGlassLens(rightLensX, lensTop);

  // Nose bridge connecting the two lenses under the brow bar.
  roundRectPath(
    ctx,
    leftLensX + lensWidth,
    lensTop + lensHeight * 0.12,
    bridgeGap,
    lensHeight * 0.78,
    lensHeight * 0.35,
  );
  ctx.fill();

  ctx.restore();
}

export function drawEmoji(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  x: number,
  y: number,
  size: number,
) {
  ctx.save();
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y);
  ctx.restore();
}

export function drawFaceFilter(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number }[],
  width: number,
  height: number,
  filter: FaceFilterId,
  shadesSettings: PixelShadesSettings,
) {
  const leftSide = getPoint(landmarks, 234, width, height);
  const rightSide = getPoint(landmarks, 454, width, height);
  const forehead = getPoint(landmarks, 10, width, height);

  const centerX = (leftSide.x + rightSide.x) / 2;
  const faceWidth = Math.abs(rightSide.x - leftSide.x);

  if (faceWidth <= 0) return;

  if (filter === 'none') return;

  // Only draw blush for filters that include rosy cheeks
  const filtersWithBlush: FaceFilterId[] = ['bunny', 'cat', 'strawberry'];
  if (filtersWithBlush.includes(filter)) {
    drawBlush(ctx, landmarks, width, height);
  }

  if (filter === 'bunny') {
    drawBunny(ctx, centerX, forehead.y, faceWidth);
    drawEmoji(
      ctx,
      '💕',
      centerX,
      forehead.y - faceWidth * 0.2,
      faceWidth * 0.14,
    );
  } else if (filter === 'cat') {
    drawCat(ctx, centerX, forehead.y, faceWidth);

    const nose = getPoint(landmarks, 1, width, height);

    drawEmoji(
      ctx,
      '💗',
      nose.x,
      nose.y + faceWidth * 0.025,
      faceWidth * 0.075,
    );
  } else if (filter === 'strawberry') {
    drawEmoji(
      ctx,
      '🍓',
      centerX,
      forehead.y - faceWidth * 0.18,
      faceWidth * 0.3,
    );

    drawEmoji(
      ctx,
      '✨',
      centerX - faceWidth * 0.38,
      forehead.y,
      faceWidth * 0.12,
    );

    drawEmoji(
      ctx,
      '✨',
      centerX + faceWidth * 0.38,
      forehead.y,
      faceWidth * 0.12,
    );
  } else if (filter === 'angel') {
    drawHalo(ctx, centerX, forehead.y, faceWidth);

    drawEmoji(
      ctx,
      '✨',
      centerX - faceWidth * 0.4,
      forehead.y - faceWidth * 0.15,
      faceWidth * 0.13,
    );

    drawEmoji(
      ctx,
      '✨',
      centerX + faceWidth * 0.4,
      forehead.y - faceWidth * 0.15,
      faceWidth * 0.13,
    );
  } else if (filter === 'shades') {
    drawPixelShades(
      ctx,
      width,
      height,
      shadesSettings.style,
      shadesSettings.mode,
      shadesSettings.anchorPct,
      shadesSettings.scale,
      shadesSettings.opacity,
      shadesSettings.frameColorOverride,
      landmarks,
    );
  }
}

export function applyLightOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  intensity: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = intensity;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
