'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  FACE_FILTERS,
  type FaceFilterId,
} from '@/features/camera/face-filters';

import {
  DEFAULT_PIXEL_SHADES_STYLE,
  PIXEL_SHADES_STYLES,
  type PixelShadesMode,
  type PixelShadesSettings,
  type PixelShadesStyle,
  type PixelShadesStyleId,
} from '@/features/camera/pixel-shades';

import {
  BACKGROUND_FILTERS,
  type BackgroundFilterId,
} from '@/features/camera/background-filters';

import {
  createBackgroundCanvasResources,
  drawReplacedBackground,
  loadBackgroundImages,
  type BackgroundCanvasResources,
  type BackgroundImageCache,
} from '@/features/camera/background-renderer';

import {
  useBackgroundSegmenter,
} from '@/features/camera/use-background-segmenter';

import styles from './FaceFilterCamera.module.css';
import {
  drawBlush,
  drawBunny,
  drawCat,
  drawEmoji,
  drawFaceFilter,
  drawHalo,
  drawPixelShades,
  getPoint,
  hexToRgba,
  roundRectPath,
  applyLightOverlay,
} from '@/features/camera/face-filter-draw';

type CameraStatus =
  | 'loading'
  | 'ready'
  | 'error';

export default function FaceFilterCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Drag state for manual (object-or-person) shades fitting.
  const [isDraggingShades, setIsDraggingShades] = useState(false);
  const dragStartRef = useRef<{
    startPointerX: number;
    startPointerY: number;
    startAnchorX: number;
    startAnchorY: number;
    containerWidth: number;
    containerHeight: number;
  } | null>(null);

  // Use a permissive type because @mediapipe/tasks-vision type definitions
  // do not accurately discriminate methods by runningMode. At runtime,
  // IMAGE mode exposes detect and VIDEO mode exposes detectForVideo.
  const landmarkerRef = useRef<{
    detect?: (
      image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap,
    ) => { faceLandmarks: { x: number; y: number }[][] };
    detectForVideo?: (
      video: HTMLVideoElement,
      timestamp: number,
    ) => { faceLandmarks: { x: number; y: number }[][] };
    close: () => void;
  } | null>(null);

  const landmarkerReadyRef = useRef(false);

  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const selectedFilterRef = useRef<FaceFilterId>('bunny');
  const initializingRef = useRef(false);

  // Holds the latest light settings so the render loop can read them every
  // frame without restarting the camera effect when the light changes.
  const lightRef = useRef({
    enabled: false,
    color: '#ffd45e',
    intensity: 0.35,
  });

  // Holds the latest shades studio settings so the render loop can read them
  // every frame without restarting the camera effect when the studio changes.
  const shadesRef = useRef<PixelShadesSettings>({
    mode: 'auto',
    style: PIXEL_SHADES_STYLES.find(
      (s) => s.id === DEFAULT_PIXEL_SHADES_STYLE,
    )!,
    pixelSize: 0.03,
    scale: 1,
    opacity: 1,
    anchorPct: { x: 0.5, y: 0.5 },
    frameColorOverride: null,
  });

  const [selectedFilter, setSelectedFilter] =
    useState<FaceFilterId>('bunny');

  // Pixel Shades studio state. 'auto' fits the glasses on the detected face
  // (person). 'manual' lets the user drag the glasses onto any object or
  // person so it fits non-face subjects too.
  const [shadesMode, setShadesMode] = useState<PixelShadesMode>('auto');
  const [shadesStyleId, setShadesStyleId] =
    useState<PixelShadesStyleId>(DEFAULT_PIXEL_SHADES_STYLE);
  const [shadesPixelSize, setShadesPixelSize] = useState(0.03);
  const [shadesScale, setShadesScale] = useState(1);
  const [shadesOpacity, setShadesOpacity] = useState(1);
  const [shadesAnchorPct, setShadesAnchorPct] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Optional override of the active style's frame color.
  const [shadesFrameColorOverride, setShadesFrameColorOverride] =
    useState<string | null>(null);

  const [status, setStatus] =
    useState<CameraStatus>('loading');

  const [message, setMessage] =
    useState('Loading cute camera...');

  const [facingMode, setFacingMode] =
    useState<'user' | 'environment'>('user');

  const [capturedPhoto, setCapturedPhoto] =
    useState<string | null>(null);

  // Countdown timer (seconds). null when inactive.
  const [timer, setTimer] = useState<number | null>(null);

  // Colored light applied over the live camera preview.
  const [lightEnabled, setLightEnabled] = useState(false);
  const [lightColor, setLightColor] = useState('#ffd45e');
  const [lightIntensity, setLightIntensity] = useState(0.35);

  // Keep the ref in sync so the render loop always reads fresh values.
  useEffect(() => {
    lightRef.current = {
      enabled: lightEnabled,
      color: lightColor,
      intensity: lightIntensity,
    };
  }, [lightEnabled, lightColor, lightIntensity]);

  // Keep the shades studio ref in sync so the render loop always reads fresh
  // values without restarting the camera effect when the studio changes.
  useEffect(() => {
    shadesRef.current = {
      mode: shadesMode,
      style: PIXEL_SHADES_STYLES.find((s) => s.id === shadesStyleId)!,
      pixelSize: shadesPixelSize,
      scale: shadesScale,
      opacity: shadesOpacity,
      anchorPct:
        shadesAnchorPct ?? { x: 0.5, y: 0.5 },
      frameColorOverride: shadesFrameColorOverride,
    };
  }, [
    shadesMode,
    shadesStyleId,
    shadesPixelSize,
    shadesScale,
    shadesOpacity,
    shadesAnchorPct,
    shadesFrameColorOverride,
  ]);

  const [selectedBackground, setSelectedBackground] =
    useState<BackgroundFilterId>('original');

  const selectedBackgroundRef =
    useRef<BackgroundFilterId>('original');

  const backgroundImagesRef =
    useRef<BackgroundImageCache>(new Map());

  const backgroundResourcesRef =
    useRef<BackgroundCanvasResources | null>(null);

  const {
    segmenterRef,
    maskRef,
    readyRef,
  } = useBackgroundSegmenter();

  const lastSegmentationTimeRef = useRef(0);

  const selectBackground = (
    background: BackgroundFilterId,
  ) => {
    selectedBackgroundRef.current = background;
    setSelectedBackground(background);
  };

  useEffect(() => {
    let cancelled = false;

    loadBackgroundImages().then((images) => {
      if (!cancelled) {
        backgroundImagesRef.current = images;
      }
    });

    backgroundResourcesRef.current =
      createBackgroundCanvasResources();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectFilter = useCallback((filter: FaceFilterId) => {
    selectedFilterRef.current = filter;
    setSelectedFilter(filter);
  }, []);

  const startShadesDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const preview = previewRef.current;
      if (!preview) return;
      setIsDraggingShades(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStartRef.current = {
        startPointerX: event.clientX,
        startPointerY: event.clientY,
        startAnchorX: shadesAnchorPct?.x ?? 0.5,
        startAnchorY: shadesAnchorPct?.y ?? 0.5,
        containerWidth: preview.clientWidth,
        containerHeight: preview.clientHeight,
      };
    },
    [shadesAnchorPct],
  );

  const moveShadesDrag = useCallback((event: PointerEvent) => {
    if (!dragStartRef.current) return;
    const {
      startPointerX,
      startPointerY,
      startAnchorX,
      startAnchorY,
      containerWidth,
      containerHeight,
    } = dragStartRef.current;
    const dx = (event.clientX - startPointerX) / Math.max(containerWidth, 1);
    const dy = (event.clientY - startPointerY) / Math.max(containerHeight, 1);
    setShadesAnchorPct({
      x: Math.min(1, Math.max(0, startAnchorX + dx)),
      y: Math.min(1, Math.max(0, startAnchorY + dy)),
    });
  }, [setShadesAnchorPct]);

  const endShadesDrag = useCallback(() => {
    setIsDraggingShades(false);
    dragStartRef.current = null;
  }, [setIsDraggingShades]);

  // Drag the shades handle across the preview to fit any object or person.
  useEffect(() => {
    if (!isDraggingShades) return;

    const onMove = (event: PointerEvent) => moveShadesDrag(event);
    const onStop = () => {
      endShadesDrag();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onStop);
      window.removeEventListener('pointercancel', onStop);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onStop);
    window.addEventListener('pointercancel', onStop);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onStop);
      window.removeEventListener('pointercancel', onStop);
      endShadesDrag();
    };
  }, [isDraggingShades, moveShadesDrag, endShadesDrag]);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      // Prevent re-initialization while one is already in progress
      if (initializingRef.current || landmarkerReadyRef.current) {
        return;
      }

      initializingRef.current = true;

      try {
        setStatus('loading');
        setMessage('Loading camera and face detection...');

        const { FaceLandmarker, FilesetResolver } =
          await import('@mediapipe/tasks-vision');

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
        );

        const modelOptions = {
          baseOptions: {
            modelAssetPath: '/models/face_landmarker.task',
          },
          runningMode: 'IMAGE' as const,
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
        };

        let landmarker: Awaited<
          ReturnType<typeof FaceLandmarker.createFromOptions>
        > | null = null;

        try {
          landmarker = await FaceLandmarker.createFromOptions(
            vision,
            {
              ...modelOptions,
              baseOptions: {
                ...modelOptions.baseOptions,
                delegate: 'CPU',
              },
            },
          );
        } catch (cpuError) {
          console.error('Failed to create face landmarker on CPU:', cpuError);
          throw new Error(
            'Failed to initialize face landmarker on CPU.',
          );
        }

        if (!landmarker) {
          throw new Error('Face landmarker could not be created.');
        }

        if (cancelled) {
          // Do not close the landmarker here to avoid triggering WASM graph
          // teardown messages during cancellation. The local landmarker
          // reference will be garbage collected; cleanup handles the ref.
          landmarkerReadyRef.current = false;
          return;
        }

        landmarkerRef.current = landmarker;
        landmarkerReadyRef.current = true;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          // Do not close the landmarker here to avoid triggering WASM graph
          // teardown messages during cancellation. Cleanup handles the ref.
          landmarkerRef.current = null;
          landmarkerReadyRef.current = false;
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;

        if (!video) {
          throw new Error('Camera video element is unavailable.');
        }

        video.srcObject = stream;
        await video.play();

        // Give the video a moment to produce its first frame so that
        // detect has valid image data on the first render tick.
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (cancelled) return;

        setStatus('ready');
        setMessage('Your cute camera is ready! 💗');

        // Throttle face detection to ~20 FPS (50ms interval) to keep the
        // camera responsive. Video rendering still runs at 60 FPS via
        // requestAnimationFrame; only the ML inference is throttled.
        const DETECTION_INTERVAL_MS = 50;
        let lastDetectionTime = 0;
        let lastFace: { x: number; y: number }[] | null = null;

        const render = () => {
          if (cancelled) return;

          const currentVideo = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');

          if (
            currentVideo &&
            canvas &&
            ctx &&
            currentVideo.readyState >= 2 &&
            !currentVideo.paused &&
            currentVideo.currentTime > 0
          ) {
            const width = currentVideo.videoWidth;
            const height = currentVideo.videoHeight;

            if (width > 0 && height > 0) {
              if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
              }

              const backgroundId = selectedBackgroundRef.current;

              const shouldSegment = backgroundId !== 'original';

              const now = performance.now();

              if (
                shouldSegment &&
                readyRef.current &&
                segmenterRef.current &&
                now - lastSegmentationTimeRef.current >= 50
              ) {
                lastSegmentationTimeRef.current = now;

                try {
                  segmenterRef.current.segmentForVideo(
                    currentVideo,
                    now,
                    (result) => {
                      if (result.categoryMask) {
                        maskRef.current = result.categoryMask;
                      }
                    },
                  );
                } catch (error) {
                  console.error('Background segmentation error:', error);
                }
              }

              ctx.clearRect(0, 0, width, height);

              if (backgroundResourcesRef.current) {
                drawReplacedBackground(
                  ctx,
                  currentVideo,
                  width,
                  height,
                  backgroundId,
                  backgroundImagesRef.current,
                  backgroundResourcesRef.current,
                  maskRef.current,
                );
              }

              // Apply the colored light over the live camera preview.
              const { enabled, color, intensity } = lightRef.current;
              if (enabled && color) {
                applyLightOverlay(ctx, width, height, color, intensity);
              }

              // Throttle face detection to avoid running ML inference on
              // every frame, which was causing the camera to feel slow.
              if (
                now - lastDetectionTime >= DETECTION_INTERVAL_MS &&
                landmarkerReadyRef.current &&
                landmarkerRef.current
              ) {
                lastDetectionTime = now;

                try {
                  const landmarker = landmarkerRef.current;
                  // Call detect() directly on the landmarker instance to preserve
                  // the `this` binding. Extracting the method (const detect =
                  // landmarker.detect) loses `this`, causing MediaPipe's WASM to
                  // fail with "Cannot set properties of undefined" when it tries
                  // to access internal state. Pass the video element directly
                  // (a valid ImageSource) rather than the display canvas, which
                  // is resized dynamically and composited by the browser.
                  if (
                    landmarker &&
                    typeof landmarker.detect === 'function' &&
                    currentVideo.videoWidth > 0 &&
                    currentVideo.videoHeight > 0
                  ) {
                    const result = landmarker.detect(currentVideo);
                    const face = result?.faceLandmarks?.[0];

                    if (face) {
                      lastFace = face;
                    }
                  }
                } catch (error) {
                  console.error('Face detection error:', error);
                }
              }

              // Draw the filter using the most recently detected landmarks so
              // the overlay stays visible between detection frames.
              if (lastFace) {
                drawFaceFilter(
                  ctx,
                  lastFace,
                  width,
                  height,
                  selectedFilterRef.current,
                  shadesRef.current,
                );
              }
            }
          }

          animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);
      } catch (error) {
        console.error('Camera initialization error:', error);

        if (!cancelled) {
          setStatus('error');

          if (
            error instanceof DOMException &&
            error.name === 'NotAllowedError'
          ) {
            setMessage(
              'Camera permission denied. Please allow camera access in your browser.',
            );
          } else if (
            error instanceof DOMException &&
            error.name === 'NotFoundError'
          ) {
            setMessage('No camera was found on this device.');
          } else {
            setMessage(
              error instanceof Error
                ? error.message
                : 'Could not start the camera.',
            );
          }
        }
      } finally {
        initializingRef.current = false;
      }
    }

    startCamera();

    return () => {
      cancelled = true;

      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Close the landmarker graph safely to avoid WASM errors during teardown.
      // Only close if the landmarker was successfully initialized to avoid
      // triggering MediaPipe graph teardown warnings on a null/unready instance.
      if (landmarkerReadyRef.current && landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch {
          // Ignore close errors during cleanup
        }
      }
      landmarkerRef.current = null;
      landmarkerReadyRef.current = false;
      initializingRef.current = false;
    };
  }, [facingMode]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const overlay = canvasRef.current;

    if (!video || !overlay || video.videoWidth === 0) {
      return;
    }

    const output = document.createElement('canvas');

    output.width = video.videoWidth;
    output.height = video.videoHeight;

    const context = output.getContext('2d');

    if (!context) return;

    // Mirror front-camera photos so they look like a mirror selfie, matching
    // the live preview which is already flipped via CSS transform.
    const shouldMirror = facingMode === 'user';

    if (shouldMirror) {
      context.save();
      context.scale(-1, 1);
    }

    context.drawImage(
      overlay,
      shouldMirror ? -output.width : 0,
      0,
      output.width,
      output.height,
    );

    // Apply the colored light to the captured photo as well.
    if (lightEnabled && lightColor) {
      applyLightOverlay(
        context,
        output.width,
        output.height,
        lightColor,
        lightIntensity,
      );
    }

    if (shouldMirror) {
      context.restore();
    }

    const photo = output.toDataURL('image/jpeg', 0.94);

    setCapturedPhoto(photo);
  }, [facingMode, lightEnabled, lightColor, lightIntensity]);

  // Countdown timer: auto-capture when it reaches zero.
  useEffect(() => {
    if (timer === null || timer <= 0) return;

    const id = setInterval(() => {
      setTimer((current) => {
        if (current === null || current <= 1) {
          capturePhoto();
          return null;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [timer, capturePhoto, lightColor, lightEnabled, lightIntensity]);

  const downloadPhoto = () => {
    if (!capturedPhoto) return;

    const link = document.createElement('a');
    link.href = capturedPhoto;
    link.download = `cute-photo-${Date.now()}.jpg`;
    link.click();
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <span className={styles.eyebrow}>YOUR LITTLE MAGIC CAMERA</span>
        <h1>Cute Face Studio 🎀</h1>
        <p>Choose your favorite look and take a cute photo!</p>
      </section>

      <section className={styles.studio}>
        <div className={styles.cameraArea}>
          <div className={styles.preview}>
            {capturedPhoto ? (
              // Captured output is already composed from video and filter canvas.
              <img
                src={capturedPhoto}
                alt="Your captured photo with a cute face filter"
                className={styles.capturedImage}
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  className={styles.video}
                  style={{
                    transform:
                      facingMode === 'user' ? 'scaleX(-1)' : 'none',
                  }}
                  autoPlay
                  playsInline
                  muted
                />

                <canvas
                  ref={canvasRef}
                  className={styles.overlay}
                  style={{
                    transform:
                      facingMode === 'user' ? 'scaleX(-1)' : 'none',
                  }}
                />
              </>
            )}

            <div className={styles.previewLabel}>
              {capturedPhoto ? 'YOUR CUTE PHOTO 💗' : 'LIVE CAMERA ✨'}
            </div>

            {timer !== null && (
              <div className={styles.timerCount}>{timer}</div>
            )}

            {/* Draggable handle to fit the pixel shades onto any object or
                person when manual mode is active. */}
            {shadesMode === 'manual' && shadesAnchorPct && (
              <div
                className={styles.shadesHandle}
                style={{
                  left: `${shadesAnchorPct.x * 100}%`,
                  top: `${shadesAnchorPct.y * 100}%`,
                }}
                onPointerDown={startShadesDrag}
                role="button"
                tabIndex={0}
                aria-label="Drag pixel shades to fit your object or person"
              >
                😎
              </div>
            )}
          </div>

          <p className={styles.status} role="status">
            {message}
          </p>

          {status === 'error' && (
            <button
              className={styles.secondaryButton}
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          )}

          <div className={styles.lightControls}>
            <label className={styles.lightLabel}>
              <input
                type="checkbox"
                checked={lightEnabled}
                onChange={(event) => setLightEnabled(event.target.checked)}
              />
              💡 Colored light
            </label>
            {lightEnabled && (
              <>
                <label className={styles.lightColorLabel}>Color</label>
                <input
                  type="color"
                  value={lightColor}
                  onChange={(event) => setLightColor(event.target.value)}
                />
                <label className={styles.lightIntensityLabel}>
                  Intensity
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={lightIntensity}
                  onChange={(event) =>
                    setLightIntensity(parseFloat(event.target.value))
                  }
                />
              </>
            )}
          </div>

          <div className={styles.cameraActions}>
            {!capturedPhoto && status === 'ready' && (
              <>
                <button
                  className={styles.secondaryButton}
                  onClick={() =>
                    setFacingMode((current) =>
                      current === 'user' ? 'environment' : 'user',
                    )
                  }
                >
                  🔄 Switch camera
                </button>

                <button
                  className={`${styles.secondaryButton} ${
                    timer !== null ? styles.timerActive : ''
                  }`}
                  onClick={() => setTimer(3)}
                  disabled={timer !== null}
                  type="button"
                >
                  {timer !== null
                    ? `Photo in ${timer}...`
                    : '⏱️ Timer 3s'}
                </button>

                <button
                  className={styles.captureButton}
                  onClick={capturePhoto}
                  disabled={timer !== null}
                >
                  <span>📸</span>
                  Take photo
                </button>
              </>
            )}

            {capturedPhoto && (
              <>
                <button
                  className={styles.secondaryButton}
                  onClick={retakePhoto}
                >
                  Retake
                </button>

                <button
                  className={styles.captureButton}
                  onClick={downloadPhoto}
                >
                  ⬇ Download photo
                </button>
              </>
            )}
          </div>

          <section className={styles.backgroundPanel}>
            <h2>Choose Your Background 🌷</h2>

            <p>Change your camera surroundings!</p>

            <div className={styles.backgroundGrid}>
              {BACKGROUND_FILTERS.map((background) => (
                <button
                  key={background.id}
                  type="button"
                  className={`${styles.backgroundCard} ${
                    selectedBackground === background.id
                      ? styles.activeBackground
                      : ''
                  }`}
                  onClick={() => selectBackground(background.id)}
                  aria-pressed={
                    selectedBackground === background.id
                  }
                >
                  <span className={styles.backgroundEmoji}>
                    {background.emoji}
                  </span>

                  <span className={styles.backgroundName}>
                    {background.name}
                  </span>

                  <span className={styles.backgroundDescription}>
                    {background.description}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.filterPanel}>
          <h2>Choose your filter 💕</h2>
          <p>Tap a style to try it on.</p>

          <div className={styles.filterGrid}>
            {FACE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                className={`${styles.filterCard} ${
                  selectedFilter === filter.id
                    ? styles.activeFilter
                    : ''
                }`}
                onClick={() => selectFilter(filter.id)}
                aria-pressed={selectedFilter === filter.id}
                type="button"
              >
                <span className={styles.filterEmoji}>
                  {filter.emoji}
                </span>

                <span className={styles.filterName}>
                  {filter.name}
                </span>

                <span className={styles.filterDescription}>
                  {filter.description}
                </span>
              </button>
            ))}
          </div>

          {selectedFilter === 'shades' && (
            <section className={styles.shadesStudio}>
              <h2>😎 Pixel Shades Studio</h2>
              <p>
                Fit the glasses on a face (auto) or drag them onto any object
                or person (manual).
              </p>

              <div className={styles.shadesMode}>
                <button
                  className={`${styles.shadesModeBtn} ${
                    shadesMode === 'auto' ? styles.active : ''
                  }`}
                  onClick={() => setShadesMode('auto')}
                  aria-pressed={shadesMode === 'auto'}
                  type="button"
                >
                  👤 Auto-fit face
                </button>
                <button
                  className={`${styles.shadesModeBtn} ${
                    shadesMode === 'manual' ? styles.active : ''
                  }`}
                  onClick={() => setShadesMode('manual')}
                  aria-pressed={shadesMode === 'manual'}
                  type="button"
                >
                  📦 Fit object or person
                </button>
              </div>

              <div className={styles.shadesPresets}>
                <span className={styles.shadesPresetLabel}>Frame style</span>
                <div className={styles.shadesPresetList}>
                  {PIXEL_SHADES_STYLES.map((style) => {
                    const isActive = shadesStyleId === style.id;
                    return (
                      <button
                        key={style.id}
                        className={`${styles.shadesPreset} ${
                          isActive ? styles.activePreset : ''
                        }`}
                        onClick={() => setShadesStyleId(style.id)}
                        aria-pressed={isActive}
                        type="button"
                        title={style.description}
                      >
                        <span
                          className={styles.shadesPresetColor}
                          style={{ backgroundColor: style.frameColor }}
                        />
                        <span className={styles.shadesPresetName}>
                          {style.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.shadesControls}>
                <div className={styles.shadesControl}>
                  <label>Frame color</label>
                  <input
                    type="color"
                    value={
                      shadesFrameColorOverride ??
                      PIXEL_SHADES_STYLES.find(
                        (s) => s.id === shadesStyleId,
                      )?.frameColor
                    }
                    onChange={(event) =>
                      setShadesFrameColorOverride(event.target.value)
                    }
                  />
                </div>
                <div className={styles.shadesControl}>
                  <label>Pixel size</label>
                  <input
                    type="range"
                    min="0.01"
                    max="0.08"
                    step="0.005"
                    value={shadesPixelSize}
                    onChange={(event) =>
                      setShadesPixelSize(parseFloat(event.target.value))
                    }
                  />
                </div>
                <div className={styles.shadesControl}>
                  <label>Scale</label>
                  <input
                    type="range"
                    min="0.4"
                    max="2"
                    step="0.05"
                    value={shadesScale}
                    onChange={(event) =>
                      setShadesScale(parseFloat(event.target.value))
                    }
                  />
                </div>
                <div className={styles.shadesControl}>
                  <label>Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={shadesOpacity}
                    onChange={(event) =>
                      setShadesOpacity(parseFloat(event.target.value))
                    }
                  />
                </div>
              </div>

              {shadesMode === 'manual' && (
                <div className={styles.shadesPlacement}>
                  <p>Drag the 😎 handle to fit your object or person ✨</p>
                  <div className={styles.shadesPlacementBtns}>
                    <button
                      className={styles.shadesPlacementBtn}
                      onClick={() => setShadesAnchorPct({ x: 0.5, y: 0.5 })}
                      type="button"
                    >
                      Center on canvas
                    </button>
                    <button
                      className={styles.shadesPlacementBtn}
                      onClick={() => setShadesMode('auto')}
                      type="button"
                    >
                      Snap to detected face
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}
