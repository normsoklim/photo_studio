'use client';

import { useEffect, useState } from "react";
import { Image, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { loadPhotosFromDb, formatDate } from "@/features/photobooth/photo-booth";
import type { CapturedPhoto } from "@/features/photobooth/photo-booth";

export default function GalleryPage() {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadPhotosFromDb()
      .then((loaded) => {
        if (mounted) {
          setPhotos(loaded);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="gallery-page">
        <section className="gallery-header">
          <h1>My <span>Gallery</span></h1>
          <p>Your favorite photo memories will live here.</p>
        </section>
        <div className="gallery-empty">
          <span className="gallery-empty-icon">✨</span>
          <h2>Loading memories…</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="gallery-page">
      <section className="gallery-header">
        <h1>My <span>Gallery</span></h1>
        <p>Your favorite photo memories will live here.</p>
        <div className="gallery-count">
          <Sparkles size={14} />
          {photos.length} photo{photos.length !== 1 ? "s" : ""} saved
        </div>
      </section>

      {photos.length === 0 ? (
        <div className="gallery-empty">
          <span className="gallery-empty-icon">📸</span>
          <h2>No memories yet</h2>
          <p>Capture some photos in the Photo Booth and they’ll appear here.</p>
          <Link href="/photobooth" className="button-primary">
            <ArrowLeft size={17} />
            Start Creating
          </Link>
        </div>
      ) : (
        <div className="gallery-grid">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="gallery-card"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                }
              }}
            >
              <span className="gallery-card-index">{photo.index + 1}</span>
              <img
                className="gallery-image"
                src={photo.dataUrl}
                alt={`Photo ${photo.index + 1} captured on ${formatDate(photo.capturedAt)}`}
              />
              <div className="gallery-card-meta">
                <span className="gallery-card-date">{formatDate(photo.capturedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
