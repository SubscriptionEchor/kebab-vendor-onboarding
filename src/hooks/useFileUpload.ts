import { useState, useCallback } from 'react';
import { handleFileUpload } from '../services/upload';
import { validateFiles, FileValidationError } from '../utils/fileValidation';
import type { FileValidationOptions } from '../utils/fileValidation';

interface UploadResult {
  key: string;
  previewUrl: string;
}

interface UseFileUploadOptions {
  validationOptions: FileValidationOptions;
  maxFiles?: number;
  onSuccess?: (results: UploadResult[]) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(async (files: File[]) => {
    if (!files.length) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Validate files
      await validateFiles(files, options.validationOptions);

      // Check max files limit
      if (options.maxFiles && files.length > options.maxFiles) {
        throw new FileValidationError(`Maximum ${options.maxFiles} files allowed`);
      }

      // Upload files sequentially
      const results: UploadResult[] = [];
      for (const file of files) {
        try {
          const { key, previewUrl } = await handleFileUpload(file, (progress) => {
            setProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          });
          results.push({ key, previewUrl });
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          throw error;
        }
      }

      options.onSuccess?.(results);
      return results;
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(new Error(errorMessage));
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    } finally {
      setIsUploading(false);
      setProgress({});
    }
  }, [options]);

  return {
    upload,
    isUploading,
    progress,
    error
  };
}