'use client';

import { useState, useCallback, useRef } from "react";
import { Image, Sparkles, ArrowLeft, Download, Palette, Frame, Sticker } from "lucide-react";
import Link from "next/link";
import { FACE_FILTERS } from "@/features/camera/face-filters";
import { BACKGROUND_FILTERS } from "@/features/camera/background-filters";
import type { FaceFilterId } from "@/features/camera/face-filters";
import type { BackgroundFilterId } from "@/features/camera/background-filters";

export default function EditorPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedFaceFilter, setSelectedFaceFilter] = useState<FaceFilterId>("none");
  const [selectedBgFilter, setSelectedBgFilter] = useState<BackgroundFilterId>("original");
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      setIsEditing(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDownload = useCallback(() => {
    if (!imageSrc || !canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `edited-photo-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL("image/png", 0.95);
    link.click();
  }, [imageSrc]);

  const handleReset = useCallback(() => {
    setImageSrc(null);
    setSelectedFaceFilter("none");
    setSelectedBgFilter("original");
    setSelectedFrame(null);
    setIsEditing(false);
  }, []);

  if (!isEditing) {
    return (
      <main className="editor-page">
        <section className="editor-header">
          <h1>Photo <span>Editor</span></h1>
          <p>Your creative space for filters, stickers, frames and adorable decorations.</p>
        </section>

        <div className="editor-upload">
          <input type="file" id="photo-upload" accept="image/*" onChange={handleImageUpload} />
          <label htmlFor="photo-upload" className="editor-upload-label">
            <Image size={20} />
            Choose a photo to edit
          </label>
        </div>

        <div className="editor-no-preview">
          Upload a photo to start editing
        </div>
      </main>
    );
  }

  return (
    <main className="editor-page">
      <section className="editor-header">
        <h1>Photo <span>Editor</span></h1>
        <p>Your creative space for filters, stickers, frames and adorable decorations.</p>
      </section>

      <div className="editor-canvas">
        <canvas
          ref={canvasRef}
          className="editor-preview"
        />
        {!imageSrc && <div className="editor-no-preview">No photo loaded</div>}
      </div>

      <div className="editor-tools">
        <div className="editor-tool-section">
          <h3>
            <Palette size={18} />
            Filters
          </h3>
          <div className="editor-filter-grid">
            {FACE_FILTERS.map((filter) => {
              const isActive = selectedFaceFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  className={`editor-filter-btn ${isActive ? "active" : ""}`}
                  onClick={() => setSelectedFaceFilter(filter.id as FaceFilterId)}
                  aria-pressed={isActive}
                  title={filter.description}
                >
                  <span className="editor-filter-emoji">{filter.emoji}</span>
                  <span>{filter.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="editor-tool-section">
          <h3>
            <Frame size={18} />
            Frames
          </h3>
          <div className="editor-filter-grid">
            {[null, "pink-kawaii", "lavender-dream", "strawberry-love", "classic-film"].map((frameId) => {
              const isActive = selectedFrame === frameId;
              const frameName = frameId === null ? "None" : frameId;
              const frameEmoji = frameId === null ? "📷" : "🎀";
              return (
                <button
                  key={frameId ?? "none"}
                  className={`editor-filter-btn ${isActive ? "active" : ""}`}
                  onClick={() => setSelectedFrame(frameId)}
                  aria-pressed={isActive}
                  title={frameName}
                >
                  <span className="editor-filter-emoji">{frameEmoji}</span>
                  <span>{frameName}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="editor-tool-section">
          <h3>
            <Sticker size={18} />
            Backgrounds
          </h3>
          <div className="editor-filter-grid">
            {BACKGROUND_FILTERS.map((filter) => {
              const isActive = selectedBgFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  className={`editor-filter-btn ${isActive ? "active" : ""}`}
                  onClick={() => setSelectedBgFilter(filter.id as BackgroundFilterId)}
                  aria-pressed={isActive}
                  title={filter.description}
                >
                  <span className="editor-filter-emoji">{filter.emoji}</span>
                  <span>{filter.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="editor-actions">
        <button
          className="button-secondary"
          onClick={handleReset}
        >
          <ArrowLeft size={17} />
          Reset
        </button>
        <button
          className="button-primary"
          onClick={handleDownload}
          disabled={!imageSrc}
        >
          <Download size={17} />
          Save Photo
        </button>
        <Link href="/gallery" className="button-secondary">
          <Sparkles size={17} />
          View Gallery
        </Link>
      </div>
    </main>
  );
}
