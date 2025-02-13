// File size limits in bytes
export const FILE_SIZE_LIMITS = {
  PROFILE_IMAGE: 5 * 1024 * 1024,    // 5MB
  RESTAURANT_IMAGE: 10 * 1024 * 1024, // 10MB
  MENU_IMAGE: 10 * 1024 * 1024,      // 10MB
  DOCUMENT: 15 * 1024 * 1024,        // 15MB
} as const;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
} as const;