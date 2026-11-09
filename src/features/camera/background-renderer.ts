import type { BackgroundFilterId } from './background-filters';

export interface SegmentationMask {
  width: number;
  height: number;
  getAsUint8Array(): Uint8Array;
}

export type BackgroundImageCache = Map<
  string,
  HTMLImageElement
>;

export interface BackgroundCanvasResources {
  foreground: HTMLCanvasElement;
  mask: HTMLCanvasElement;
}

export function createBackgroundCanvasResources():
  BackgroundCanvasResources {
  return {
    foreground: document.createElement('canvas'),
    mask: document.createElement('canvas'),
  };
}

export async function loadBackgroundImages():
  Promise<BackgroundImageCache> {
  const paths = [
    '/backgrounds/pink-bedroom.jpg',
    '/backgrounds/sakura.jpg',
    '/backgrounds/cotton-candy.jpg',
    '/backgrounds/lavender.jpg',
    '/backgrounds/pink-studio.jpg',
  ];

  const cache: BackgroundImageCache = new Map();

  await Promise.all(
    paths.map(async (path) => {
      const image = new Image();
      image.decoding = 'async';

      const loaded = await new Promise<boolean>((resolve) => {
        image.onload = () => resolve(true);
        image.onerror = () => resolve(false);
        image.src = path;
      });

      if (loaded) {
        cache.set(path, image);
      } else {
        console.warn(`Background could not load: ${path}`);
      }
    }),
  );

  return cache;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
) {
  const scale = Math.max(
    width / sourceWidth,
    height / sourceHeight,
  );

  const scaledWidth = sourceWidth * scale;
  const scaledHeight = sourceHeight * scale;

  const x = (width - scaledWidth) / 2;
  const y = (height - scaledHeight) / 2;

  ctx.drawImage(
    image,
    x,
    y,
    scaledWidth,
    scaledHeight,
  );
}

export function drawReplacedBackground(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
  filterId: BackgroundFilterId,
  backgroundImages: BackgroundImageCache,
  resources: BackgroundCanvasResources,
  segmentationMask: SegmentationMask | null,
) {
  if (filterId === 'original') {
    ctx.drawImage(video, 0, 0, width, height);
    return;
  }

  // Draw the replacement background first.
  if (filterId === 'blur') {
    ctx.save();
    ctx.filter = 'blur(18px)';
    ctx.drawImage(
      video,
      -24,
      -24,
      width + 48,
      height + 48,
    );
    ctx.restore();
  } else {
    const imagePath = {
      'pink-bedroom': '/backgrounds/pink-bedroom.jpg',
      sakura: '/backgrounds/sakura.jpg',
      'cotton-candy': '/backgrounds/cotton-candy.jpg',
      lavender: '/backgrounds/lavender.jpg',
      'pink-studio': '/backgrounds/pink-studio.jpg',
    }[filterId];

    const background = backgroundImages.get(imagePath);

    if (background) {
      drawCover(
        ctx,
        background,
        background.naturalWidth,
        background.naturalHeight,
        width,
        height,
      );
    } else {
      ctx.fillStyle = '#fce7f3';
      ctx.fillRect(0, 0, width, height);
    }
  }

  // Until the first segmentation result arrives, show the original camera.
  if (!segmentationMask) {
    ctx.drawImage(video, 0, 0, width, height);
    return;
  }

  const foregroundCanvas = resources.foreground;
  const maskCanvas = resources.mask;

  if (
    foregroundCanvas.width !== width ||
    foregroundCanvas.height !== height
  ) {
    foregroundCanvas.width = width;
    foregroundCanvas.height = height;
  }

  if (
    maskCanvas.width !== segmentationMask.width ||
    maskCanvas.height !== segmentationMask.height
  ) {
    maskCanvas.width = segmentationMask.width;
    maskCanvas.height = segmentationMask.height;
  }

  const maskContext = maskCanvas.getContext('2d');
  const foregroundContext = foregroundCanvas.getContext('2d');

  if (!maskContext || !foregroundContext) return;

  const maskData = segmentationMask.getAsUint8Array();

  if (!maskData || maskData.length === 0) {
    ctx.drawImage(video, 0, 0, width, height);
    return;
  }

  const maskImageData = maskContext.createImageData(
    segmentationMask.width,
    segmentationMask.height,
  );

  // Selfie Segmenter classes:
  // 0 = background, 1 = person. Some model builds invert this mapping
  // (0 = person, non-zero = background), so treat zero as person to keep
  // the person visible and replace only the surrounding background.
  for (let i = 0; i < maskData.length; i++) {
    const offset = i * 4;
    const isPerson = maskData[i] === 0;

    maskImageData.data[offset] = 255;
    maskImageData.data[offset + 1] = 255;
    maskImageData.data[offset + 2] = 255;
    maskImageData.data[offset + 3] = isPerson ? 255 : 0;
  }

  maskContext.putImageData(maskImageData, 0, 0);

  // Draw the original person.
  foregroundContext.clearRect(0, 0, width, height);
  foregroundContext.drawImage(
    video,
    0,
    0,
    width,
    height,
  );

  // Keep only pixels belonging to the person.
  foregroundContext.globalCompositeOperation = 'destination-in';

  foregroundContext.save();
  foregroundContext.filter = 'blur(2px)';
  foregroundContext.drawImage(
    maskCanvas,
    0,
    0,
    width,
    height,
  );
  foregroundContext.restore();

  foregroundContext.globalCompositeOperation = 'source-over';

  // Place the person over the replacement background.
  ctx.drawImage(foregroundCanvas, 0, 0, width, height);
}
