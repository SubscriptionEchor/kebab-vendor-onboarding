import { useEffect, useRef, useState } from 'react';

interface UseVirtualListOptions {
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
}

export function useVirtualList<T>(
  items: T[],
  { itemHeight, overscan = 3, containerHeight }: UseVirtualListOptions
) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index,
    offsetTop: (startIndex + index) * itemHeight
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    virtualProps: {
      style: {
        height: containerHeight,
        overflow: 'auto',
        position: 'relative' as const,
      },
    },
    itemProps: (index: number) => ({
      style: {
        position: 'absolute' as const,
        top: 0,
        transform: `translateY(${index * itemHeight}px)`,
        width: '100%',
        height: itemHeight,
      },
    }),
  };
}