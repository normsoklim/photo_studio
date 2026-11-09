export type PixelShadesMode = 'auto' | 'manual';

export type PixelShadesStyleId =
  | 'classic'
  | 'cotton-pink'
  | 'lavender'
  | 'neon-cyber'
  | 'golden'
  | 'pure-white';

export interface PixelShadesStyle {
  id: PixelShadesStyleId;
  name: string;
  frameColor: string;
  lensLight: string;
  lensDark: string;
  description: string;
}

export const PIXEL_SHADES_STYLES: PixelShadesStyle[] = [
  {
    id: 'classic',
    name: 'Classic Black',
    frameColor: '#0a0a0a',
    lensLight: '#ffffff',
    lensDark: '#0a0a0a',
    description: 'Timeless deal-with-it shades',
  },
  {
    id: 'cotton-pink',
    name: 'Cotton Pink',
    frameColor: '#ff83b9',
    lensLight: '#fff5fa',
    lensDark: '#ff83b9',
    description: 'Sweet pastel pink frames',
  },
  {
    id: 'lavender',
    name: 'Lavender Dream',
    frameColor: '#c78cff',
    lensLight: '#f3e8ff',
    lensDark: '#c78cff',
    description: 'Dreamy lavender frames',
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    frameColor: '#00f2ff',
    lensLight: '#e0f7fe',
    lensDark: '#00f2ff',
    description: 'Cyberpunk neon glow',
  },
  {
    id: 'golden',
    name: 'Golden Glam',
    frameColor: '#ffd45e',
    lensLight: '#fff3d6',
    lensDark: '#ffd45e',
    description: 'Luxury golden frames',
  },
  {
    id: 'pure-white',
    name: 'Pure White',
    frameColor: '#ffffff',
    lensLight: '#f8fafc',
    lensDark: '#ffffff',
    description: 'Clean white frames',
  },
];

export const DEFAULT_PIXEL_SHADES_STYLE: PixelShadesStyleId = 'classic';

export interface PixelShadesSettings {
  mode: PixelShadesMode;
  style: PixelShadesStyle;
  pixelSize: number;
  scale: number;
  opacity: number;
  anchorPct: { x: number; y: number };
  frameColorOverride: string | null;
}
