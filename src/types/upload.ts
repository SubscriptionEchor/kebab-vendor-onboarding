export type ImageType = 'PROFILE_IMAGE' | 'RESTAURANT_IMAGE' | 'MENU_IMAGE';

export interface ImageUploadConfig {
  maxSize: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ImageAsset {
  key: string;
  previewUrl: string;
}