"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
  type RefObject,
  type ReactNode,
} from "react";
import {
  Camera,
  ChevronLeft,
  RefreshCw,
  RotateCcw,
  Download,
  Layout,
  Frame as FrameIcon,
  Sparkles,
  Heart,
  Clock,
  X,
  Check,
  ImagePlus,
} from "lucide-react";
import Link from "next/link";

import {
  stopStream,
  captureFrame,
  savePhotoToDb,
  newPhotoId,
  formatDate,
  type CapturedPhoto,
  type LayoutId,
  type FrameId,
  type PhotoBoothStep,
  type PhotoBoothFilterId,
  PHOTO_COUNT,
  COUNTDOWN_SECONDS,
} from "./photo-booth";
import { layouts } from "./photo-layouts";
import { frames, type FrameTheme } from "./photo-frames";
import { composePhotoBoothImage, downloadImage } from "./photo-composer";
import { PHOTO_BOOTH_FILTERS, type PhotoBoothFilter } from "./photo-filters";
import { drawFaceFilter } from "@/features/camera/face-filter-draw";
import {
  DEFAULT_PIXEL_SHADES_STYLE,
  PIXEL_SHADES_STYLES,
} from "@/features/camera/pixel-shades";
import {
  BACKGROUND_FILTERS,
  type BackgroundFilterId,
} from "@/features/camera/background-filters";
import {
  createBackgroundCanvasResources,
  drawReplacedBackground,
  loadBackgroundImages,
  type BackgroundCanvasResources,
  type BackgroundImageCache,
} from "@/features/camera/background-renderer";

import styles from "./PhotoBooth.module.css";

/* ------------------------------------------------------------------ */
/* Initial state                                                      */
/* ------------------------------------------------------------------ */

type BoothState = {
  step: PhotoBoothStep;
  photos: CapturedPhoto[];
  currentIndex: number;
  countdown: number;
  isCountingDown: boolean;
  selectedLayout: LayoutId;
  selectedFrame: FrameId;
  selectedFilter: PhotoBoothFilterId;
  selectedBackground: string;
  caption: string;
  showDate: boolean;
  finalImage: string | null;
  isComposing: boolean;
  error: string | null;
};

const initialState: BoothState = {
  step: "capture",
  photos: [],
  currentIndex: 0,
  countdown: COUNTDOWN_SECONDS,
  isCountingDown: false,
  selectedLayout: "strip",
  selectedFrame: "pink-kawaii",
  selectedFilter: "none",
  selectedBackground: "original",
  caption: "",
  showDate: true,
  finalImage: null,
  isComposing: false,
  error: null,
};

type SetBoothState = Dispatch<SetStateAction<BoothState>>;

export default function PhotoBooth() {
  const [state, setState] = useState<BoothState>(initialState);
  const [isPending, startTransition] = useTransition();

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retakePhotoRef = useRef<CapturedPhoto | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFaceRef = useRef<{ x: number; y: number }[] | null>(null);
  const landmarkerRef = useRef<{
    detect?: (
      image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap,
    ) => { faceLandmarks: { x: number; y: number }[][] };
    close: () => void;
  } | null>(null);
  const landmarkerReadyRef = useRef(false);
  const initializingRef = useRef(false);

  /* Background segmentation */
  const segmenterRef = useRef<{
    segmentForVideo?: (
      video: HTMLVideoElement,
      timestamp: number,
      callback: (result: { categoryMask?: { width: number; height: number; getAsUint8Array(): Uint8Array } }) => void,
    ) => void;
    close: () => void;
  } | null>(null);
  const segmenterReadyRef = useRef(false);
  const segmenterInitializingRef = useRef(false);
  const backgroundMaskRef = useRef<{
    width: number;
    height: number;
    getAsUint8Array(): Uint8Array;
  } | null>(null);
  const backgroundResourcesRef = useRef<BackgroundCanvasResources | null>(null);
  const backgroundImagesRef = useRef<BackgroundImageCache>(new Map());
  const lastSegmentationTimeRef = useRef(0);

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                          */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (streamRef.current) stopStream(streamRef.current);
      if (landmarkerReadyRef.current && landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch {
          // Ignore close errors during cleanup
        }
      }
      landmarkerRef.current = null;
      landmarkerReadyRef.current = false;
      if (segmenterReadyRef.current && segmenterRef.current) {
        try {
          segmenterRef.current.close();
        } catch {
          // Ignore close errors during cleanup
        }
      }
      segmenterRef.current = null;
      segmenterReadyRef.current = false;
      backgroundMaskRef.current = null;
      backgroundResourcesRef.current = null;
      backgroundImagesRef.current = new Map();
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /* Camera                                                             */
  /* ------------------------------------------------------------------ */

  const startCameraStream = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      });
      streamRef.current = stream;
      const videoEl = videoRef.current;
      if (!videoEl) throw new Error("Video element not found");

      videoEl.srcObject = stream;
      videoEl.playsInline = true;
      videoEl.style.transform = "scaleX(-1)";

      await new Promise<void>((resolve, reject) => {
        videoEl.onloadedmetadata = () => resolve();
        videoEl.onerror = () => reject(new Error("Video failed to load"));
      });

      await videoEl.play();

      // Initialize face landmarker for filter detection.
      if (!landmarkerReadyRef.current && !initializingRef.current) {
        initializingRef.current = true;
        try {
          const { FaceLandmarker, FilesetResolver } = await import(
            '@mediapipe/tasks-vision'
          );
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
          );
          const landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: '/models/face_landmarker.task',
            },
            runningMode: 'IMAGE' as const,
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
          });
          landmarkerRef.current = landmarker;
          landmarkerReadyRef.current = true;
        } catch (err) {
          console.error('Failed to initialize face landmarker:', err);
          landmarkerReadyRef.current = false;
        } finally {
          initializingRef.current = false;
        }
      }

      // Initialize background segmenter and load background images.
      if (!segmenterReadyRef.current && !segmenterInitializingRef.current) {
        segmenterInitializingRef.current = true;
        try {
          const { ImageSegmenter, FilesetResolver } = await import(
            '@mediapipe/tasks-vision'
          );
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
          );
          const segmenter = await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                '/models/selfie_segmenter_landscape.tflite',
            },
            runningMode: 'VIDEO',
            outputCategoryMask: true,
            outputConfidenceMasks: false,
          });
          segmenterRef.current = segmenter;
          segmenterReadyRef.current = true;
        } catch (err) {
          console.error('Failed to initialize background segmenter:', err);
          segmenterReadyRef.current = false;
        } finally {
          segmenterInitializingRef.current = false;
        }
      }

      // Load background images.
      loadBackgroundImages().then((images) => {
        backgroundImagesRef.current = images;
      });

      backgroundResourcesRef.current = createBackgroundCanvasResources();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error:
          err instanceof Error
            ? `Camera access failed: ${err.message}`
            : "Camera access failed. Please allow camera permission.",
      }));
    }
  }, []);

  const stopCameraStream = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isCountingDown: false,
      countdown: COUNTDOWN_SECONDS,
    }));
    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
    }
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.srcObject = null;
    }
  }, []);

  // Start camera when entering the capture step
  useEffect(() => {
    if (state.step === "capture") {
      startCameraStream();
    } else {
      stopCameraStream();
    }
  }, [state.step, startCameraStream, stopCameraStream]);

  /* ------------------------------------------------------------------ */
  /* Live camera filter preview (render loop)                           */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    const DETECTION_INTERVAL_MS = 50;
    let lastDetectionTime = 0;

    const render = () => {
      if (cancelled) return;

      const video = videoRef.current;
      const overlay = overlayRef.current;
      const ctx = overlay?.getContext("2d");

      if (
        video &&
        overlay &&
        ctx &&
        video.readyState >= 2 &&
        !video.paused &&
        video.currentTime > 0
      ) {
        const width = video.videoWidth;
        const height = video.videoHeight;

        if (width > 0 && height > 0) {
          if (overlay.width !== width || overlay.height !== height) {
            overlay.width = width;
            overlay.height = height;
          }

          ctx.clearRect(0, 0, width, height);

          // Draw the video with background replacement onto the overlay canvas.
          const now = performance.now();

          // Throttle background segmentation to ~20 FPS.
          if (
            now - lastSegmentationTimeRef.current >= 50 &&
            segmenterReadyRef.current &&
            segmenterRef.current &&
            typeof segmenterRef.current.segmentForVideo === "function"
          ) {
            lastSegmentationTimeRef.current = now;
            try {
              segmenterRef.current.segmentForVideo(
                video,
                now,
                (result) => {
                  if (result?.categoryMask) {
                    backgroundMaskRef.current = result.categoryMask;
                  }
                },
              );
            } catch {
              // Background segmentation failed; keep last known mask.
            }
          }

          drawReplacedBackground(
            ctx,
            video,
            width,
            height,
            state.selectedBackground as BackgroundFilterId,
            backgroundImagesRef.current,
            backgroundResourcesRef.current!,
            backgroundMaskRef.current,
          );

          // Throttle face detection to ~20 FPS.
          if (
            now - lastDetectionTime >= DETECTION_INTERVAL_MS &&
            landmarkerReadyRef.current &&
            landmarkerRef.current &&
            typeof landmarkerRef.current.detect === "function"
          ) {
            lastDetectionTime = now;
            try {
              const result = landmarkerRef.current.detect(video);
              const face = result?.faceLandmarks?.[0];
              if (face) lastFaceRef.current = face;
            } catch {
              // Face detection failed; keep last known face.
            }
          }

          // Draw the selected filter on top using the latest landmarks.
          if (
            state.selectedFilter !== "none" &&
            lastFaceRef.current
          ) {
            const shadesSettings = {
              mode: "auto" as const,
              style: PIXEL_SHADES_STYLES.find(
                (s) => s.id === DEFAULT_PIXEL_SHADES_STYLE,
              )!,
              pixelSize: 0.03,
              scale: 1,
              opacity: 1,
              anchorPct: { x: 0.5, y: 0.5 },
              frameColorOverride: null,
            };
            drawFaceFilter(
              ctx,
              lastFaceRef.current,
              width,
              height,
              state.selectedFilter,
              shadesSettings,
            );
          }
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    if (state.step === "capture" && streamRef.current) {
      animationRef.current = requestAnimationFrame(render);
    }

    return () => {
      cancelled = true;
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    state.step,
    state.selectedFilter,
    streamRef.current,
    landmarkerReadyRef.current,
  ]);

  /* ------------------------------------------------------------------ */
  /* Countdown & capture                                                */
  /* ------------------------------------------------------------------ */

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video || streamRef.current === null) return;
    if (state.isCountingDown) return;

    // Detect face landmarks for filter application.
    let landmarks: { x: number; y: number }[] | null = null;
    if (
      state.selectedFilter !== 'none' &&
      landmarkerReadyRef.current &&
      landmarkerRef.current &&
      typeof landmarkerRef.current.detect === 'function'
    ) {
      try {
        const result = landmarkerRef.current.detect(video);
        const face = result?.faceLandmarks?.[0];
        if (face) landmarks = face;
      } catch {
        // Face detection failed; capture without filter overlay.
      }
    }

    // Draw the video frame to a canvas and apply background + filter.
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to get canvas 2d context');

    // Mirror the canvas first so everything drawn after matches the
    // viewfinder (front camera is mirrored like a mirror selfie).
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Draw background replacement (will be drawn mirrored).
    drawReplacedBackground(
      ctx,
      video,
      canvas.width,
      canvas.height,
      state.selectedBackground as BackgroundFilterId,
      backgroundImagesRef.current,
      backgroundResourcesRef.current!,
      backgroundMaskRef.current,
    );

    // Apply the face filter on top if we have landmarks and a non-none filter.
    // Canvas is already mirrored, so use landmarks as-is.
    // getPoint() converts normalized coords to pixels, and the canvas mirror
    // transform places them correctly on the mirrored image.
    if (state.selectedFilter !== 'none' && landmarks) {
      const shadesSettings = {
        mode: 'auto' as const,
        style: PIXEL_SHADES_STYLES.find(
          (s) => s.id === DEFAULT_PIXEL_SHADES_STYLE,
        )!,
        pixelSize: 0.03,
        scale: 1,
        opacity: 1,
        anchorPct: { x: 0.5, y: 0.5 },
        frameColorOverride: null,
      };
      drawFaceFilter(
        ctx,
        landmarks,
        canvas.width,
        canvas.height,
        state.selectedFilter,
        shadesSettings,
      );
    }

    const dataUrl = canvas.toDataURL('image/png', 0.92);
    const photo: CapturedPhoto = {
      id: newPhotoId(),
      dataUrl,
      index: state.currentIndex,
      capturedAt: Date.now(),
      filterId: state.selectedFilter,
      backgroundId: state.selectedBackground,
    };

    try {
      await savePhotoToDb(photo);
    } catch {
      // IndexedDB may be unavailable in some environments; keep going with memory only
    }

    setState((prev) => ({
      ...prev,
      photos: [...prev.photos.filter((p) => p.index !== photo.index), photo],
      isCountingDown: false,
    }));
  }, [
    state.currentIndex,
    state.isCountingDown,
    state.selectedFilter,
  ]);

  const beginCountdown = useCallback(async () => {
    if (state.isCountingDown) return;
    setState((prev) => ({ ...prev, isCountingDown: true, countdown: COUNTDOWN_SECONDS }));
    countdownRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.countdown <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          return { ...prev, isCountingDown: false, countdown: 0 };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);

    // Wait for the countdown to finish, then capture the photo
    await new Promise((resolve) => setTimeout(resolve, COUNTDOWN_SECONDS * 1000));
    await capturePhoto();
  }, [state.isCountingDown, capturePhoto]);

  const retakeCurrent = useCallback(() => {
    retakePhotoRef.current = null;
    setState((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.index !== prev.currentIndex),
    }));
  }, [state.currentIndex]);

  const goToNextPhoto = useCallback(() => {
    retakePhotoRef.current = null;
    setState((prev) => {
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= PHOTO_COUNT) {
        return { ...prev, step: "layout", currentIndex: 0 };
      }
      return { ...prev, currentIndex: nextIndex };
    });
  }, []);

  const isLastPhoto = state.currentIndex === PHOTO_COUNT - 1;
  const existingPhoto = state.photos.find((p) => p.index === state.currentIndex);
  const isCapturing = state.isCountingDown || !!existingPhoto;

  const capturedCount = state.photos.filter((p) => p.index >= 0).length;
  const progress = (capturedCount / PHOTO_COUNT) * 100;

  /* ------------------------------------------------------------------ */
  /* Layout / frame                                                     */
  /* ------------------------------------------------------------------ */

  const selectLayout = useCallback((id: LayoutId) => {
    setState((prev) => ({ ...prev, selectedLayout: id }));
  }, []);

  const selectFrame = useCallback((id: FrameId) => {
    setState((prev) => ({ ...prev, selectedFrame: id }));
  }, []);

  const selectFilter = useCallback((id: PhotoBoothFilterId) => {
    setState((prev) => ({ ...prev, selectedFilter: id }));
  }, []);

  const selectBackground = useCallback((id: string) => {
    setState((prev) => ({ ...prev, selectedBackground: id }));
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.step === "layout") return { ...prev, step: "capture" };
      if (prev.step === "frame") return { ...prev, step: "layout" };
      if (prev.step === "preview") return { ...prev, step: "frame" };
      return prev;
    });
  }, []);

  /* ------------------------------------------------------------------ */
  /* Compose & download                                                 */
  /* ------------------------------------------------------------------ */

  const composeAndPreview = useCallback(async () => {
    const photoUrls = state.photos
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((p) => p.dataUrl);

    if (photoUrls.length !== PHOTO_COUNT) {
      setState((prev) => ({ ...prev, error: "Please capture all 6 photos first." }));
      return;
    }

    startTransition(() => {
      setState((prev) => ({ ...prev, isComposing: true, error: null }));
    });

    try {
      const dataUrl = await composePhotoBoothImage({
        layoutId: state.selectedLayout,
        frameId: state.selectedFrame,
        photos: photoUrls,
        caption: state.caption,
        showDate: state.showDate,
      });
      setState((prev) => ({
        ...prev,
        finalImage: dataUrl,
        isComposing: false,
        step: "preview",
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isComposing: false,
        error: err instanceof Error ? err.message : "Failed to compose image.",
      }));
    }
  }, [
    state.photos,
    state.selectedLayout,
    state.selectedFrame,
    state.caption,
    state.showDate,
  ]);

  const handleDownload = useCallback(() => {
    if (!state.finalImage) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadImage(state.finalImage, `cutie-photobooth-${date}.png`);
  }, [state.finalImage]);

  const restartSession = useCallback(() => {
    setState(initialState);
    retakePhotoRef.current = null;
  }, []);

  /* ------------------------------------------------------------------ */
  /* Options lists                                                      */
  /* ------------------------------------------------------------------ */

  const layoutOptions: { id: LayoutId; label: string; desc: string }[] = [
    { id: "strip", label: "Classic Photo Strip", desc: "Six photos vertically" },
    { id: "grid", label: "Cute Grid", desc: "2 columns × 3 rows" },
    { id: "horizontal", label: "Horizontal Strip", desc: "Six photos side by side" },
    { id: "polaroid", label: "Polaroid Scrapbook", desc: "Polaroid-style with decorations" },
  ];

  const frameOptions: { id: FrameId; theme: FrameTheme }[] = Object.values(frames).map((t) => ({
    id: t.id,
    theme: t,
  }));

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */

  if (state.step === "capture") {
    return (
      <CaptureStep
        state={state}
        setState={setState}
        startCameraStream={startCameraStream}
        beginCountdown={beginCountdown}
        capturePhoto={capturePhoto}
        retakeCurrent={retakeCurrent}
        goToNextPhoto={goToNextPhoto}
        selectFilter={selectFilter}
        selectBackground={selectBackground}
        retakePhotoRef={retakePhotoRef}
        streamRef={streamRef}
        overlayRef={overlayRef}
        isLastPhoto={isLastPhoto}
        existingPhoto={existingPhoto}
        isCapturing={isCapturing}
        videoRef={videoRef}
        progress={progress}
        capturedCount={capturedCount}
      />
    );
  }

  if (state.step === "layout") {
    return (
      <LayoutStep
        state={state}
        setState={setState}
        layoutOptions={layoutOptions}
        selectLayout={selectLayout}
        goBack={goBack}
        goForward={composeAndPreview}
        isPending={isPending}
      />
    );
  }

  if (state.step === "frame") {
    return (
      <FrameStep
        state={state}
        setState={setState}
        frameOptions={frameOptions}
        selectFrame={selectFrame}
        goBack={goBack}
        goForward={composeAndPreview}
        isPending={isPending}
      />
    );
  }

  if (state.step === "preview") {
    return (
      <PreviewStep
        state={state}
        setState={setState}
        handleDownload={handleDownload}
        goBack={goBack}
        restartSession={restartSession}
        isPending={isPending}
      />
    );
  }

  return <div className={styles.doneScreen} />;
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

interface CaptureStepProps {
  state: BoothState;
  setState: SetBoothState;
  startCameraStream: () => Promise<void>;
  beginCountdown: () => void;
  capturePhoto: () => Promise<void>;
  retakeCurrent: () => void;
  goToNextPhoto: () => void;
  selectFilter: (id: PhotoBoothFilterId) => void;
  selectBackground: (id: string) => void;
  retakePhotoRef: RefObject<CapturedPhoto | null>;
  streamRef: RefObject<MediaStream | null>;
  overlayRef: RefObject<HTMLCanvasElement | null>;
  isLastPhoto: boolean;
  existingPhoto: CapturedPhoto | undefined;
  isCapturing: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  progress: number;
  capturedCount: number;
}

function CaptureStep({
  state,
  setState,
  startCameraStream,
  beginCountdown,
  capturePhoto,
  retakeCurrent,
  goToNextPhoto,
  selectFilter,
  selectBackground,
  retakePhotoRef,
  streamRef,
  overlayRef,
  isLastPhoto,
  existingPhoto,
  isCapturing,
  videoRef,
  progress,
  capturedCount,
}: CaptureStepProps) {
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ChevronLeft size={18} /> Back to Home
        </Link>
        <span className={styles.stepBadge}>
          <Heart size={14} /> Photo {state.currentIndex + 1} of {PHOTO_COUNT}
        </span>
      </header>

      {state.error && (
        <div className={styles.errorBanner}>
          <X size={16} /> {state.error}
          <button
            className={styles.errorClose}
            onClick={() => setState((s) => ({ ...s, error: null }))}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className={styles.cameraCard}>
        <div className={styles.viewfinderWrap}>
          <div className={styles.viewfinder}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={styles.video}
            />
            <canvas
              ref={overlayRef}
              className={styles.overlay}
              style={{
                transform:
                  "scaleX(-1)",
              }}
            />
            {state.isCountingDown && (
              <div className={styles.countdownOverlay}>
                <span className={styles.countdownNumber}>
                  {state.countdown || "📸"}
                </span>
              </div>
            )}
          </div>

          {!streamRef.current && (
            <div className={styles.cameraOff}>
              <Camera size={32} />
              <p>Start camera to begin</p>
              <button className={styles.startCamBtn} onClick={startCameraStream}>
                <Sparkles size={16} /> Open Camera
              </button>
            </div>
          )}
        </div>

        <div className={styles.photoStrip}>
          {Array.from({ length: PHOTO_COUNT }, (_, i) => {
            const p = state.photos.find((x) => x.index === i);
            const isCurrent = i === state.currentIndex;
            return (
              <div key={i} className={styles.slot}>
                {p ? (
                  <div className={styles.captured}>
                    <img src={p.dataUrl} alt={`Photo ${i + 1}`} className={styles.capturedImg} />
                    <button
                      className={styles.retakeBtn}
                      onClick={() => {
                        retakePhotoRef.current = p;
                        setShowRetakeConfirm(true);
                      }}
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.emptySlot}>
                    <ImagePlus size={20} />
                    <span>Photo {i + 1}</span>
                  </div>
                )}
                {isCurrent && <div className={styles.activeDot} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.filterPanel}>
        <span className={styles.filterLabel}>Choose a filter ✨</span>
        <div className={styles.filterGrid}>
          {PHOTO_BOOTH_FILTERS.map((filter) => {
            const active = state.selectedFilter === filter.id;
            return (
              <button
                key={filter.id}
                className={`${styles.filterCard} ${
                  active ? styles.filterActive : ''
                }`}
                onClick={() => selectFilter(filter.id)}
                aria-pressed={active}
                type="button"
              >
                <span className={styles.filterEmoji}>
                  {filter.emoji}
                </span>
                <span className={styles.filterName}>{filter.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.filterPanel}>
        <span className={styles.filterLabel}>Choose a background 🌷</span>
        <div className={styles.filterGrid}>
          {BACKGROUND_FILTERS.map((bg) => {
            const active = state.selectedBackground === bg.id;
            return (
              <button
                key={bg.id}
                className={`${styles.filterCard} ${
                  active ? styles.filterActive : ''
                }`}
                onClick={() => selectBackground(bg.id)}
                aria-pressed={active}
                type="button"
              >
                <span className={styles.filterEmoji}>{bg.emoji}</span>
                <span className={styles.filterName}>{bg.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.controls}>
        {existingPhoto && !showRetakeConfirm ? (
          <>
            <button className={styles.btnOutline} onClick={retakeCurrent}>
              <RefreshCw size={16} /> Retake
            </button>
            <button className={styles.btnPrimary} onClick={goToNextPhoto}>
              {isLastPhoto ? "Choose Layout" : "Next Photo"}
              <ChevronLeft size={16} />
            </button>
          </>
        ) : showRetakeConfirm ? (
          <div className={styles.confirmRow}>
            <p className={styles.confirmText}>Retake this photo?</p>
            <button className={styles.btnOutline} onClick={() => setShowRetakeConfirm(false)}>
              Keep
            </button>
            <button className={styles.btnDanger} onClick={retakeCurrent}>
              Retake
            </button>
          </div>
        ) : (
          <button
            className={styles.btnPrimary}
            onClick={beginCountdown}
            disabled={state.isCountingDown}
          >
            {state.isCountingDown ? (
              <span className={styles.btnLoading}>
                <Clock size={16} /> Get ready…
              </span>
            ) : (
              <>
                <Camera size={20} />
                {state.countdown > 0 && state.countdown < COUNTDOWN_SECONDS ? "Smile!" : "Take Photo"}
              </>
            )}
          </button>
        )}
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        <span className={styles.progressText}>
          {capturedCount}/{PHOTO_COUNT} captured
        </span>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

interface LayoutStepProps {
  state: BoothState;
  setState: SetBoothState;
  layoutOptions: { id: LayoutId; label: string; desc: string }[];
  selectLayout: (id: LayoutId) => void;
  goBack: () => void;
  goForward: () => void;
  isPending: boolean;
}

function LayoutStep({
  state,
  setState,
  layoutOptions,
  selectLayout,
  goBack,
  goForward,
  isPending,
}: LayoutStepProps) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.btnBack} onClick={goBack}>
          <ChevronLeft size={18} /> Back
        </button>
        <span className={styles.stepBadge}>
          <Layout size={14} /> Choose your layout
        </span>
      </header>

      <div className={styles.layoutGrid}>
        {layoutOptions.map((opt) => {
          const active = state.selectedLayout === opt.id;
          return (
            <button
              key={opt.id}
              className={`${styles.layoutCard} ${active ? styles.layoutActive : ""}`}
              onClick={() => selectLayout(opt.id)}
              aria-pressed={active}
            >
              <div className={styles.layoutPreview}>
                <div className={styles.layoutCanvas}>
                  {renderLayoutPreview(opt.id)}
                </div>
              </div>
              <div className={styles.layoutInfo}>
                <h3 className={styles.layoutTitle}>{opt.label}</h3>
                <p className={styles.layoutDesc}>{opt.desc}</p>
              </div>
              {active && <Check size={18} className={styles.layoutCheck} />}
            </button>
          );
        })}
      </div>

      <div className={styles.controls}>
        <button className={styles.btnOutline} onClick={goBack}>
          <ChevronLeft size={16} /> Back
        </button>
        <button className={styles.btnPrimary} onClick={goForward} disabled={isPending}>
          Choose Frame <ChevronLeft size={16} />
        </button>
      </div>
    </main>
  );
}

function renderLayoutPreview(id: LayoutId): ReactNode {
  switch (id) {
    case "strip":
      return (
        <div className={styles.previewStrip}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.previewCell}>
              <div className={styles.previewPhoto} />
            </div>
          ))}
        </div>
      );
    case "grid":
      return (
        <div className={styles.previewGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.previewCell}>
              <div className={styles.previewPhoto} />
            </div>
          ))}
        </div>
      );
    case "horizontal":
      return (
        <div className={styles.previewHorizontal}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.previewCell}>
              <div className={styles.previewPhoto} />
            </div>
          ))}
        </div>
      );
    case "polaroid":
      return (
        <div className={styles.previewPolaroid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.previewCell}>
              <div className={styles.previewPhoto} />
            </div>
          ))}
        </div>
      );
  }
}

/* ------------------------------------------------------------------ */

interface FrameStepProps {
  state: BoothState;
  setState: SetBoothState;
  frameOptions: { id: FrameId; theme: FrameTheme }[];
  selectFrame: (id: FrameId) => void;
  goBack: () => void;
  goForward: () => void;
  isPending: boolean;
}

function FrameStep({
  state,
  setState,
  frameOptions,
  selectFrame,
  goBack,
  goForward,
  isPending,
}: FrameStepProps) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.btnBack} onClick={goBack}>
          <ChevronLeft size={18} /> Back
        </button>
        <span className={styles.stepBadge}>
          <FrameIcon size={14} /> Choose your frame
        </span>
      </header>

      <div className={styles.frameGrid}>
        {frameOptions.map(({ id, theme }) => {
          const active = state.selectedFrame === id;
          return (
            <button
              key={id}
              className={`${styles.frameCard} ${active ? styles.frameActive : ""}`}
              onClick={() => selectFrame(id)}
              aria-pressed={active}
            >
              <div className={styles.framePreview}>
                <img
                  src={theme.svg.startsWith("data:") ? theme.svg : ""}
                  alt={theme.name}
                  className={styles.framePreviewImg}
                />
                <div className={styles.frameSwatch} style={{ background: theme.accentColor }} />
              </div>
              <div className={styles.frameInfo}>
                <h3 className={styles.frameTitle}>{theme.name}</h3>
                <p className={styles.frameDesc}>{theme.description}</p>
              </div>
              {active && <Check size={18} className={styles.frameCheck} />}
            </button>
          );
        })}
      </div>

      <div className={styles.controls}>
        <button className={styles.btnOutline} onClick={goBack}>
          <ChevronLeft size={16} /> Back
        </button>
        <button className={styles.btnPrimary} onClick={goForward} disabled={isPending}>
          Preview <ChevronLeft size={16} />
        </button>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

interface PreviewStepProps {
  state: BoothState;
  setState: SetBoothState;
  handleDownload: () => void;
  goBack: () => void;
  restartSession: () => void;
  isPending: boolean;
}

function PreviewStep({
  state,
  setState,
  handleDownload,
  goBack,
  restartSession,
  isPending,
}: PreviewStepProps) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.btnBack} onClick={goBack}>
          <ChevronLeft size={18} /> Back
        </button>
        <span className={styles.stepBadge}>
          <Sparkles size={14} /> Your photo booth strip
        </span>
      </header>

      {state.isComposing && (
        <div className={styles.composing}>
          <div className={styles.composingSpinner} />
          <p>Creating your collage…</p>
        </div>
      )}

      {state.finalImage && (
        <div className={styles.previewCard}>
          <img src={state.finalImage} alt="Final collage" className={styles.finalImage} />
          <div className={styles.previewMeta}>
            <span className={styles.metaItem}>
              <Clock size={14} /> {formatDate(Date.now())}
            </span>
            {state.caption && (
              <span className={styles.metaItem}>
                <Heart size={14} /> {state.caption}
              </span>
            )}
          </div>
        </div>
      )}

      {state.error && (
        <div className={styles.errorBanner}>
          <X size={16} /> {state.error}
        </div>
      )}

      <div className={styles.options}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={state.showDate}
            onChange={(e) =>
              setState((prev) => ({ ...prev, showDate: e.target.checked }))
            }
          />
          <span className={styles.toggleText}>Show date</span>
        </label>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={!!state.caption}
            onChange={(e) => {
              if (e.target.checked) {
                const cap = window.prompt("Add a cute caption:");
                if (cap !== null) {
                  setState((prev) => ({ ...prev, caption: cap }));
                }
              } else {
                setState((prev) => ({ ...prev, caption: "" }));
              }
            }}
          />
          <span className={styles.toggleText}>Add caption</span>
        </label>
      </div>

      <div className={styles.controls}>
        <button className={styles.btnOutline} onClick={goBack}>
          <ChevronLeft size={16} /> Back
        </button>
        <button
          className={styles.btnPrimary}
          onClick={handleDownload}
          disabled={!state.finalImage || isPending}
        >
          <Download size={18} /> Download Photo
        </button>
      </div>

      <div className={styles.restartRow}>
        <button className={styles.btnText} onClick={restartSession}>
          <RotateCcw size={16} /> Start over
        </button>
      </div>
    </main>
  );
}
