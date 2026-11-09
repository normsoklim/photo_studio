'use client';

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Layout,
  Frame,
  Sparkles,
  Check,
  ArrowRight,
} from "lucide-react";
import { layouts } from "@/features/photobooth/photo-layouts";
import { frames, frameToDataUrl } from "@/features/photobooth/photo-frames";
import type { LayoutId, FrameId, LayoutDefinition, FrameTheme } from "@/features/photobooth/photo-booth";

const LAYOUT_ORDER: LayoutId[] = ["strip", "grid", "horizontal", "polaroid"];
const FRAME_ORDER: FrameId[] = ["pink-kawaii", "lavender-dream", "strawberry-love", "classic-film"];

function LayoutPreview({ layout }: { layout: LayoutDefinition }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="100" height="100" fill="#fdf8fb" />

      {layout.id === "strip" && (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x={20}
              y={8 + i * 14.5}
              width={60}
              height={12}
              fill="#ffffff"
              stroke="#f49cbd"
              strokeWidth="2"
              rx="4"
            />
          ))}
        </>
      )}

      {layout.id === "grid" && (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            return (
              <rect
                key={i}
                x={12 + col * 44}
                y={12 + row * 26}
                width={36}
                height={22}
                fill="#ffffff"
                stroke="#f49cbd"
                strokeWidth="2"
                rx="4"
              />
            );
          })}
        </>
      )}

      {layout.id === "horizontal" && (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x={8 + i * 14.5}
              y={40}
              width={12}
              height={60}
              fill="#ffffff"
              stroke="#f49cbd"
              strokeWidth="2"
              rx="4"
            />
          ))}
        </>
      )}

      {layout.id === "polaroid" && (
        <>
          <rect x={15} y={10} width={28} height={34} fill="#ffffff" stroke="#f49cbd" strokeWidth="2" rx="2" />
          <rect x={57} y={12} width={28} height={34} fill="#ffffff" stroke="#f49cbd" strokeWidth="2" rx="2" />
          <rect x={36} y={28} width={28} height={34} fill="#ffffff" stroke="#f49cbd" strokeWidth="2" rx="2" />
          <rect x={15} y={56} width={28} height={34} fill="#ffffff" stroke="#f49cbd" strokeWidth="2" rx="2" />
          <rect x={57} y={54} width={28} height={34} fill="#ffffff" stroke="#f49cbd" strokeWidth="2" rx="2" />
          <rect x={36} y={62} width={28} height={34} fill="#ffffff" stroke="#f49cbd" strokeWidth="2" rx="2" />
        </>
      )}
    </svg>
  );
}

export default function TemplatesPage() {
  const [selectedLayoutId, setSelectedLayoutId] = useState<LayoutId>("strip");
  const [selectedFrameId, setSelectedFrameId] = useState<FrameId>("pink-kawaii");

  const selectedLayout = useMemo(() => layouts[selectedLayoutId], [selectedLayoutId]);
  const selectedFrame = useMemo(() => frames[selectedFrameId], [selectedFrameId]);

  return (
    <main className="templates-page">
      <section className="templates-header">
        <h1>Photo <span>Templates</span></h1>
        <p>Choose a layout and frame style for your photo booth strip.</p>
      </section>

      <section className="templates-section">
        <h2>
          <Layout size={20} /> Layouts
        </h2>
        <div className="template-grid">
          {LAYOUT_ORDER.map((id) => {
            const layout = layouts[id];
            const isSelected = selectedLayoutId === id;
            return (
              <div
                key={id}
                className={`template-card ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedLayoutId(id)}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedLayoutId(id);
                  }
                }}
              >
                <div className="template-preview">
                  <LayoutPreview layout={layout} />
                </div>
                <div className="template-badge">
                  {isSelected ? <Check size={14} strokeWidth={3} /> : null}
                </div>
                <h3>{layout.name}</h3>
                <p>{layout.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="templates-section">
        <h2>
          <Frame size={20} /> Frames
        </h2>
        <div className="template-grid">
          {FRAME_ORDER.map((id) => {
            const frame = frames[id];
            const isSelected = selectedFrameId === id;
            const previewUrl = frameToDataUrl(frame);
            return (
              <div
                key={id}
                className={`template-card ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedFrameId(id)}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedFrameId(id);
                  }
                }}
              >
                <div className="template-preview">
                  <img src={previewUrl} alt={`${frame.name} frame preview`} />
                </div>
                <div className="template-badge">
                  {isSelected ? <Check size={14} strokeWidth={3} /> : null}
                </div>
                <h3>{frame.name}</h3>
                <p>{frame.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="templates-cta">
        <div className="templates-summary">
          <Sparkles size={16} />
          <span>Selected: {selectedLayout.name} + {selectedFrame.name}</span>
        </div>
        <Link href="/photobooth" className="button-primary">
          <ArrowRight size={17} />
          Start Creating
        </Link>
      </section>
    </main>
  );
}
