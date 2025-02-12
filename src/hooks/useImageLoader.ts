import { useState, useEffect } from 'react';

interface ImageLoaderOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useImageLoader(
  src: string,
  { threshold = 0.1, rootMargin = '50px' }: ImageLoaderOptions = {}
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    const element = document.createElement('div');
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [src, threshold, rootMargin]);

  useEffect(() => {
    if (!isVisible || !src) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setIsLoaded(true);
      setError(null);
    };

    img.onerror = () => {
      setError(new Error(`Failed to load image: ${src}`));
      setIsLoaded(false);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, isVisible]);

  return { isLoaded, error, isVisible };
}