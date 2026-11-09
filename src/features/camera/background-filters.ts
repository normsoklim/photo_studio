export type BackgroundFilterId =
  | 'original'
  | 'blur'
  | 'pink-bedroom'
  | 'sakura'
  | 'cotton-candy'
  | 'lavender'
  | 'pink-studio';

export interface BackgroundFilter {
  id: BackgroundFilterId;
  name: string;
  emoji: string;
  description: string;
  image?: string;
}

export const BACKGROUND_FILTERS: BackgroundFilter[] = [
  {
    id: 'original',
    name: 'Original',
    emoji: '📷',
    description: 'Keep the real background',
  },
  {
    id: 'blur',
    name: 'Soft Blur',
    emoji: '🌸',
    description: 'Blur your surroundings',
  },
  {
    id: 'pink-bedroom',
    name: 'Pink Bedroom',
    emoji: '🎀',
    description: 'A cute pink room',
    image: '/backgrounds/pink-bedroom.jpg',
  },
  {
    id: 'sakura',
    name: 'Sakura Garden',
    emoji: '🌸',
    description: 'Cherry blossom scenery',
    image: '/backgrounds/sakura.jpg',
  },
  {
    id: 'cotton-candy',
    name: 'Cotton Candy',
    emoji: '☁️',
    description: 'Pastel cloud background',
    image: '/backgrounds/cotton-candy.jpg',
  },
  {
    id: 'lavender',
    name: 'Lavender Dream',
    emoji: '💜',
    description: 'Dreamy purple scenery',
    image: '/backgrounds/lavender.jpg',
  },
  {
    id: 'pink-studio',
    name: 'Pink Studio',
    emoji: '🩷',
    description: 'Pastel photo studio',
    image: '/backgrounds/pink-studio.jpg',
  },
];
