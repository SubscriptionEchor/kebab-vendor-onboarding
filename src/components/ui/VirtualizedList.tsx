import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualList } from '../../hooks/useVirtualList';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  className?: string;
}

function VirtualizedListComponent<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  className = '',
}: VirtualizedListProps<T>) {
  const {
    containerRef,
    visibleItems,
    totalHeight,
    virtualProps,
    itemProps,
  } = useVirtualList(items, {
    itemHeight,
    containerHeight,
    overscan: 5,
  });

  return (
    <div
      {...virtualProps}
      ref={containerRef}
      className={`${className} relative overflow-hidden`}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <AnimatePresence>
          {visibleItems.map(({ item, index }) => (
            <motion.div
              key={index}
              {...itemProps(index)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderItem(item, index)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const VirtualizedList = memo(VirtualizedListComponent) as typeof VirtualizedListComponent;