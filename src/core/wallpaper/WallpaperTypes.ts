export type WallpaperMode = 'color' | 'gradient' | 'image';

export interface WallpaperImage {
  id: string;
  name: string;
  dataUrl: string;
  addedAt: number;
}
