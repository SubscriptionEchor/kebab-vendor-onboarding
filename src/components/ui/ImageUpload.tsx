import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../context/ToastContext";
import { useFileUpload } from "../../hooks/useFileUpload";
import {
  FILE_SIZE_LIMITS,
  ALLOWED_FILE_TYPES,
} from "../../constants/fileUpload";
import { ErrorAlert } from "./ErrorAlert";

interface ImageUploadProps {
  label: string;
  maxImages: number;
  images: { key: string; previewUrl: string }[];
  onImagesChange: (images: { key: string; previewUrl: string }[]) => void;
  acceptDocuments?: boolean;
  required?: boolean;
  className?: string;
}

export function ImageUpload({
  label,
  maxImages,
  images,
  onImagesChange,
  acceptDocuments = false,
  required,
  className = "",
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { showToast } = useToast();

  const { upload, isUploading, progress, error } = useFileUpload({
    validationOptions: {
      maxSize: FILE_SIZE_LIMITS.RESTAURANT_IMAGE,
      allowedTypes: acceptDocuments
        ? ALLOWED_FILE_TYPES.DOCUMENTS
        : ALLOWED_FILE_TYPES.IMAGES,
      // Only apply dimension restrictions for images
      ...(acceptDocuments
        ? {}
        : {
            minWidth: 800,
            minHeight: 600,
          }),
    },
    maxFiles: maxImages,
    onSuccess: (urls) => {
      onImagesChange([...images, ...urls]);
      setUploadError(null);
    },
    onError: (error) => {
      setUploadError(error.message);
      showToast(error.message, 'error');
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > maxImages) {
      setUploadError(`You can only upload up to ${maxImages} images`);
      showToast(`You can only upload up to ${maxImages} images`, 'error');
      return;
    }

    try {
      await upload(files);
    } catch (error) {
      console.error("Failed to upload files:", error);
      if (error instanceof Error) {
        setUploadError(error.message);
        showToast(error.message, 'error');
      }
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

    try {
      await upload(files);
    } catch (error) {
      console.error("Failed to upload files:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload files"
      );
      showToast(error instanceof Error ? error.message : "Failed to upload files", 'error');
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {uploadError && (
        <ErrorAlert
          message={uploadError}
          onClose={() => setUploadError(null)}
        />
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
                className="relative aspect-square rounded-lg overflow-hidden group"
              >
                {typeof image?.previewUrl === "string" &&
                image.previewUrl.endsWith(".pdf") ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                ) : (
                  <img
                    src={image?.previewUrl || ""}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-gray-600" />
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
                ? `Uploading... ${Object.values(progress)[0]}%`
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