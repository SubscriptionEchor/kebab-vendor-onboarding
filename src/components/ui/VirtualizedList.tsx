import React, { memo } from 'react';
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
      className={className}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div key={index} {...itemProps(index)}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export const VirtualizedList = memo(VirtualizedListComponent) as typeof VirtualizedListComponent;