'use client';

import { useEffect, useRef } from 'react';

export interface PersonMask {
  width: number;
  height: number;
  getAsUint8Array(): Uint8Array;
}

interface SegmenterResult {
  categoryMask?: PersonMask;
}

interface ImageSegmenterInstance {
  segmentForVideo(
    video: HTMLVideoElement,
    timestamp: number,
    callback: (result: SegmenterResult) => void,
  ): void;

  close(): void;
}

export function useBackgroundSegmenter() {
  const segmenterRef =
    useRef<ImageSegmenterInstance | null>(null);

  const maskRef = useRef<PersonMask | null>(null);

  const readyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const {
          ImageSegmenter,
          FilesetResolver,
        } = await import('@mediapipe/tasks-vision');

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
        );

        const segmenter =
          await ImageSegmenter.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath:
                  '/models/selfie_segmenter_landscape.tflite',
              },
              runningMode: 'VIDEO',
              outputCategoryMask: true,
              outputConfidenceMasks: false,
            },
          );

        if (cancelled) {
          segmenter.close();
          return;
        }

        segmenterRef.current = segmenter;
        readyRef.current = true;
      } catch (error) {
        console.error(
          'Background segmentation initialization failed:',
          error,
        );
      }
    }

    initialize();

    return () => {
      cancelled = true;
      readyRef.current = false;
      maskRef.current = null;

      segmenterRef.current?.close();
      segmenterRef.current = null;
    };
  }, []);

  return {
    segmenterRef,
    maskRef,
    readyRef,
  };
}
