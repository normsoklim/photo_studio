export type FaceFilterId =
  | 'none'
  | 'bunny'
  | 'cat'
  | 'strawberry'
  | 'angel'
  | 'shades';

export interface FaceFilter {
  id: FaceFilterId;
  name: string;
  emoji: string;
  description: string;
}

export const FACE_FILTERS: FaceFilter[] = [
  {
    id: 'none',
    name: 'Natural',
    emoji: '🌸',
    description: 'No face decorations',
  },
  {
    id: 'bunny',
    name: 'Bunny Girl',
    emoji: '🐰',
    description: 'Bunny ears and rosy cheeks',
  },
  {
    id: 'cat',
    name: 'Cute Cat',
    emoji: '🐱',
    description: 'Cat ears, nose and blush',
  },
  {
    id: 'strawberry',
    name: 'Strawberry',
    emoji: '🍓',
    description: 'Strawberry decoration and blush',
  },
  {
    id: 'angel',
    name: 'Little Angel',
    emoji: '😇',
    description: 'Angel halo and sparkles',
  },
  {
    id: 'shades',
    name: 'Pixel Shades',
    emoji: '😎',
    description: 'Pixelated deal-with-it sunglasses',
  },
];
