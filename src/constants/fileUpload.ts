import type { ImageType } from '../types/upload';

// File size limits in bytes
export const FILE_SIZE_LIMITS = {
  PROFILE_IMAGE: {
    maxSize: 5 * 1024 * 1024,    // 5MB
    minWidth: 400,
    minHeight: 400,
    maxWidth: 4096,
    maxHeight: 4096
  },
  RESTAURANT_IMAGE: {
    maxSize: 10 * 1024 * 1024,   // 10MB
    minWidth: 800,
    minHeight: 600,
    maxWidth: 4096,
    maxHeight: 4096
  },
  MENU_IMAGE: {
    maxSize: 10 * 1024 * 1024,   // 10MB
    minWidth: 800,
    minHeight: 600,
    maxWidth: 4096,
    maxHeight: 4096
  },
  DOCUMENT: 15 * 1024 * 1024,        // 15MB
} as const;

// Log the file size limits configuration on load
console.log('File size limits configuration:', FILE_SIZE_LIMITS);

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
} as const;

// Log the allowed file types configuration
console.log('Allowed file types configuration:', ALLOWED_FILE_TYPES);