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

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

interface FileValidationOptions {
  maxSize: number;
  allowedTypes: string[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export async function validateFile(file: File, options: FileValidationOptions): Promise<void> {
  // Check if file exists
  if (!file) {
    throw new FileValidationError('No file provided');
  }

  // Validate file size
  if (file.size > options.maxSize) {
    const maxSizeMB = Math.round(options.maxSize / (1024 * 1024));
    throw new FileValidationError(`File size exceeds ${maxSizeMB}MB limit`);
  }

  // Validate file type
  if (!options.allowedTypes.includes(file.type)) {
    throw new FileValidationError(
      `Invalid file type. Allowed types: ${options.allowedTypes
        .map(type => type.split('/')[1])
        .join(', ')}`
    );
  }

  // For images, validate dimensions if required
  if (file.type.startsWith('image/') && 
      (options.minWidth || options.minHeight || options.maxWidth || options.maxHeight)) {
    try {
      const dimensions = await getImageDimensions(file);
      // Only validate dimensions for images, skip for PDFs
      if (options.minWidth && dimensions.width < options.minWidth) {
        throw new FileValidationError(`Image width must be at least ${options.minWidth}px`);
      }
      if (options.minHeight && dimensions.height < options.minHeight) {
        throw new FileValidationError(`Image height must be at least ${options.minHeight}px`);
      }
      if (options.maxWidth && dimensions.width > options.maxWidth) {
        throw new FileValidationError(`Image width must not exceed ${options.maxWidth}px`);
      }
      if (options.maxHeight && dimensions.height > options.maxHeight) {
        throw new FileValidationError(`Image height must not exceed ${options.maxHeight}px`);
      }
    } catch (error) {
      if (error instanceof FileValidationError) {
        throw error;
      }
      throw new FileValidationError('Failed to validate image dimensions');
    }
  }
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function validateFiles(
  files: File[],
  options: FileValidationOptions
): Promise<void> {
  const errors: string[] = [];

  await Promise.all(
    files.map(async (file) => {
      try {
        await validateFile(file, options);
      } catch (error) {
        if (error instanceof FileValidationError) {
          errors.push(`${file.name}: ${error.message}`);
        } else {
          errors.push(`${file.name}: Validation failed`);
        }
      }
    })
  );

  if (errors.length > 0) {
    throw new FileValidationError(errors.join('\n'));
  }
}