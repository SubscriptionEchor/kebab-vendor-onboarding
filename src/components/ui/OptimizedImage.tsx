import React, { memo } from 'react';
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
    return <Skeleton className={`${className} ${placeholderClassName}`} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      {...props}
    />
  );
}

export const OptimizedImage = memo(OptimizedImageComponent);