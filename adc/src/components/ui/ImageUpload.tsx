import { useState, useRef } from "react";
import { Upload, X, FileText, AlertCircle, Info, Image } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../context/ToastContext"; 
import { ALLOWED_FILE_TYPES, FILE_SIZE_LIMITS } from "../../constants/fileUpload"; 
import { ErrorAlert } from "./ErrorAlert"; 
import { handleFileUpload } from "../../services/upload";
import type { ImageType } from '../../types/upload';

interface ImageUploadProps {
  label: string;
  maxImages: number;
  images: { key: string; previewUrl: string }[];
  onImagesChange: (images: { key: string; previewUrl: string }[]) => void;
  acceptDocuments?: boolean;
  imageType?: 'PROFILE_IMAGE' | 'RESTAURANT_IMAGE' | 'MENU_IMAGE';
  imageType?: ImageType;
  required?: boolean;
  className?: string;
}

// Helper function to get meaningful upload status message
function getUploadStatus(progress: number): string {
  if (!progress) return 'Preparing upload...';
  if (progress < 25) return 'Starting upload...';
  if (progress < 50) return 'Uploading file...';
  if (progress < 75) return 'Processing...';
  if (progress < 100) return 'Almost done...';
  return 'Finalizing...';
}

export function ImageUpload({
  label,
  maxImages,
  images,
  onImagesChange,
  acceptDocuments = false,
  imageType = 'RESTAURANT_IMAGE',
  required,
  className = "",
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showRequirements, setShowRequirements] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const { showToast } = useToast();

  // Get validation requirements based on image type
  const getRequirements = () => {
    if (acceptDocuments) {
      return {
        maxSize: '15MB',
        types: 'PDF, JPEG, PNG',
        dimensions: null
      };
    }

    const config = imageType ? FILE_SIZE_LIMITS[imageType] : FILE_SIZE_LIMITS.RESTAURANT_IMAGE;
    return {
      maxSize: `${config.maxSize / (1024 * 1024)}MB`,
      types: 'JPEG, PNG, WebP',
      dimensions: `${config.minWidth}x${config.minHeight}px minimum`
    };
  };

  const requirements = getRequirements();

  console.log('ImageUpload props:', {
    label,
    maxImages,
    imageType,
    acceptDocuments,
    images: images.length,
    required
  });

  // Log validation options
  console.log('Validation options:', {
    maxSize: acceptDocuments ? FILE_SIZE_LIMITS.DOCUMENT : (imageType ? FILE_SIZE_LIMITS[imageType].maxSize : FILE_SIZE_LIMITS.RESTAURANT_IMAGE.maxSize),
    allowedTypes: acceptDocuments ? ALLOWED_FILE_TYPES.DOCUMENTS : ALLOWED_FILE_TYPES.IMAGES,
    imageType,
    acceptDocuments
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > maxImages) {
      const error = `You can only upload up to ${maxImages} ${maxImages === 1 ? 'file' : 'files'}`;
      setUploadError(error);
      showToast(error, 'error');
      return;
    }

    setIsUploading(true);
    try {
      // Validate file types
      const invalidFiles = files.filter(file => {
        const allowedTypes = acceptDocuments ? 
          ALLOWED_FILE_TYPES.DOCUMENTS : 
          ALLOWED_FILE_TYPES.IMAGES;
        return !allowedTypes.includes(file.type);
      });

      if (invalidFiles.length > 0) {
        throw new Error(`Invalid file type. Please upload ${acceptDocuments ? 'PDF or images' : 'images'} only.`);
      }

      const uploadedFiles = [];
      for (const file of files) {
        try {
          const result = await handleFileUpload(file, (progress) => {
            setProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          });
          uploadedFiles.push(result);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          throw error;
        }
      }
      onImagesChange([...images, ...uploadedFiles]);
      setUploadError(null);
    } catch (error) {
      console.error("Failed to upload files:", error);
      if (error instanceof Error) {
        setUploadError(error.message);
        showToast(error.message, 'error');
      }
    } finally {
      setIsUploading(false);
      setProgress({});
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length + images.length > maxImages) {
      setUploadError(`You can only upload up to ${maxImages} images`);
      showToast(`You can only upload up to ${maxImages} images`, 'error');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedFiles = [];
      for (const file of files) {
        try {
          const result = await handleFileUpload(file, (progress) => {
            setProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          });
          uploadedFiles.push(result);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          throw error;
        }
      }
      onImagesChange([...images, ...uploadedFiles]);
      setUploadError(null);
    } catch (error) {
      console.error("Failed to upload files:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload files"
      );
      showToast(error instanceof Error ? error.message : "Failed to upload files", 'error');
    } finally {
      setIsUploading(false);
      setProgress({});
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
        <button
          type="button"
          onClick={() => setShowRequirements(!showRequirements)}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          <Info className="w-4 h-4 inline-block" />
        </button>
      </label>

      {/* Image Requirements */}
      <AnimatePresence>
        {showRequirements && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <h4 className="font-medium text-gray-900 mb-2">Image Requirements:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Maximum file size: {requirements.maxSize}</li>
              <li>• Allowed formats: {requirements.types}</li>
              {requirements.dimensions && (
                <li>• Dimensions: {requirements.dimensions}</li>
              )}
              {maxImages > 1 ? (
                <li>• Number of files: {images.length} of {maxImages} maximum</li>
              ) : (
                <li>• Single file upload only</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {uploadError && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">{uploadError}</p>
              <p className="text-sm text-red-600 mt-1">
                Please ensure your file meets the requirements above.
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragging
            ? "border-brand-primary bg-brand-primary/5"
            : "border-gray-300"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={acceptDocuments ? ".pdf,image/*" : "image/*"}
          multiple
          onChange={handleFileChange}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <AnimatePresence>
            {images.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-lg overflow-hidden group border border-gray-200"
              >
                {typeof image?.previewUrl === "string" &&
                image.previewUrl.endsWith(".pdf") ? (
                  <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 text-center mb-2 line-clamp-1">
                      {image.key.split('/').pop()}
                    </p>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={image?.previewUrl || ""}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full bg-gray-100 flex flex-col items-center justify-center p-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <Image className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 text-center mt-2 line-clamp-1">
                        {image.key.split('/').pop() || 'Image failed to load'}
                      </p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm shadow-md rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full py-4 flex flex-col items-center justify-center text-gray-500 hover:text-gray-600 transition-colors ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="w-8 h-8 mb-2 border-2 border-gray-300 border-t-brand-primary rounded-full animate-spin" />
            ) : (
              <Upload className="w-8 h-8 mb-2" />
            )}
            <span className="text-sm font-medium">
              {isUploading
                ? getUploadStatus(Object.values(progress)[0])
                : "Drop images here or click to upload"}
            </span>
            <span className="text-xs mt-1">
              {images.length} of {maxImages} images uploaded
            </span>
          </button>
        )}
      </div>
    </div>
  );
}