/**
 * Cute Photo Booth - Core types, camera utilities and IndexedDB storage.
 *
 * Keeps all six captured photos in browser memory (and optionally IndexedDB)
 * until the user saves the finished collage. No backend required.
 */

export const PHOTO_COUNT = 6;
export const COUNTDOWN_SECONDS = 3;

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type PhotoBoothStep = "capture" | "layout" | "frame" | "preview" | "done";

export type LayoutId = "strip" | "grid" | "horizontal" | "polaroid";
export type FrameId = "pink-kawaii" | "lavender-dream" | "strawberry-love" | "classic-film";
export type PhotoBoothFilterId =
  | 'none'
  | 'bunny'
  | 'cat'
  | 'strawberry'
  | 'angel'
  | 'shades';

export interface CapturedPhoto {
  id: string;
  /** Data URL of the captured image */
  dataUrl: string;
  /** Index in the sequence (0-5) */
  index: number;
  /** When the photo was captured */
  capturedAt: number;
  /** Filter applied to this photo (if any) */
  filterId?: PhotoBoothFilterId;
  /** Background applied to this photo (if any) */
  backgroundId?: string;
}

export interface PhotoBoothState {
  step: PhotoBoothStep;
  photos: CapturedPhoto[];
  currentIndex: number; // index of photo being captured (0-5)
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
}

export interface FrameTheme {
  id: FrameId;
  name: string;
  description: string;
  /** SVG markup (used for preview thumbnails in the UI) */
  svg: string;
  /** Canvas API draw function (used for final composition with transparent center) */
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  accentColor: string;
}

export interface LayoutDefinition {
  id: LayoutId;
  name: string;
  description: string;
  /** Canvas output size in pixels */
  width: number;
  height: number;
}

/* ------------------------------------------------------------------ */
/* Camera utilities                                                   */
/* ------------------------------------------------------------------ */

/** Request the user-facing camera and return the stream + video element. */
export async function startCamera(): Promise<{
  stream: MediaStream;
  video: HTMLVideoElement;
}> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 1280 },
    },
  });

  const video = document.createElement("video");
  video.srcObject = stream;
  video.playsInline = true;
  video.style.transform = "scaleX(-1)"; // mirror like a real photo booth

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = reject;
  });

  await video.play();

  return { stream, video };
}

/** Stop all tracks of a media stream. */
export function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

/** Capture a single frame from the video element as a PNG data URL. */
export function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to get canvas 2d context");

  // Draw mirrored so it matches the viewfinder
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png", 0.92);
}

/** Convert a data URL to a Blob. */
export function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((res) => res.blob());
}

/* ------------------------------------------------------------------ */
/* IndexedDB storage (optional persistence for the session)           */
/* ------------------------------------------------------------------ */

const DB_NAME = "CutePhotoBooth";
const DB_VERSION = 1;
const STORE_NAME = "photos";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
  return dbPromise;
}

/** Save a captured photo to IndexedDB. */
export async function savePhotoToDb(photo: CapturedPhoto): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(photo);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Load all stored photos from IndexedDB. */
export async function loadPhotosFromDb(): Promise<CapturedPhoto[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readonly");
  const photos = await new Promise<CapturedPhoto[]>((resolve, reject) => {
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return photos.sort((a, b) => a.index - b.index);
}

/** Clear all stored photos. */
export async function clearPhotosDb(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Remove a single photo by id. */
export async function deletePhotoFromDb(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

export function newPhotoId(): string {
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
