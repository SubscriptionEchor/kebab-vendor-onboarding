import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useImageLoader } from '../../hooks/useImageLoader';
import { Skeleton } from './Skeleton';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}

function OptimizedImageComponent({
  src,
  alt,
  className = '',
  placeholderClassName = '',
  ...props
}: OptimizedImageProps) {
  const { isLoaded, error, isVisible } = useImageLoader(src);

  if (error) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-sm text-gray-500">Failed to load image</span>
      </div>
    );
  }

  if (!isLoaded || !isVisible) {
    return (
      <div className="relative overflow-hidden">
        <Skeleton className={`${className} ${placeholderClassName} absolute inset-0`} />
        <div className={`${className} ${placeholderClassName} bg-gray-100`} />
      </div>
    );
  }

  return (
    <motion.img
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      {...props}
    />
  );
}

export const OptimizedImage = memo(OptimizedImageComponent);