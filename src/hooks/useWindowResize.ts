import { useCallback, useRef, useEffect } from 'react';
import type { Position, Size } from '../types';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface UseWindowResizeOptions {
  _windowId?: string;
  position: Position;
  size: Size;
  minSize: Size;
  isMaximized: boolean;
  onPositionChange: (x: number, y: number) => void;
  onSizeChange: (width: number, height: number) => void;
  onFocus: () => void;
  taskbarHeight?: number;
}

const cursorMap: Record<ResizeDirection, string> = {
  n: 'n-resize',
  s: 's-resize',
  e: 'e-resize',
  w: 'w-resize',
  ne: 'ne-resize',
  nw: 'nw-resize',
  se: 'se-resize',
  sw: 'sw-resize',
};

export function useWindowResize({
  position,
  size,
  minSize,
  isMaximized,
  onPositionChange,
  onSizeChange,
  onFocus,
  taskbarHeight = 40,
}: UseWindowResizeOptions) {
  const isResizing = useRef(false);
  const resizeDirection = useRef<ResizeDirection | null>(null);
  const startPosition = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const startWindowPosition = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !resizeDirection.current) return;

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      const deltaX = e.clientX - startPosition.current.x;
      const deltaY = e.clientY - startPosition.current.y;
      const dir = resizeDirection.current!;

      let newWidth = startSize.current.width;
      let newHeight = startSize.current.height;
      let newX = startWindowPosition.current.x;
      let newY = startWindowPosition.current.y;

      // Handle horizontal resize
      if (dir.includes('e')) {
        newWidth = Math.max(minSize.width, startSize.current.width + deltaX);
      }
      if (dir.includes('w')) {
        const widthChange = Math.min(deltaX, startSize.current.width - minSize.width);
        newWidth = startSize.current.width - widthChange;
        newX = startWindowPosition.current.x + widthChange;
      }

      // Handle vertical resize
      if (dir.includes('s')) {
        newHeight = Math.max(minSize.height, startSize.current.height + deltaY);
      }
      if (dir.includes('n')) {
        const heightChange = Math.min(deltaY, startSize.current.height - minSize.height);
        newHeight = startSize.current.height - heightChange;
        newY = startWindowPosition.current.y + heightChange;
      }

      // Constrain to viewport
      const maxWidth = window.innerWidth - newX;
      const maxHeight = window.innerHeight - taskbarHeight - newY;

      newWidth = Math.min(newWidth, maxWidth);
      newHeight = Math.min(newHeight, maxHeight);

      // Prevent negative positions
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      onSizeChange(newWidth, newHeight);
      if (dir.includes('w') || dir.includes('n')) {
        onPositionChange(newX, newY);
      }
    });
  }, [minSize, taskbarHeight, onSizeChange, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    resizeDirection.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const startResize = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    if (isMaximized) return;
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();
    onFocus();

    isResizing.current = true;
    resizeDirection.current = direction;
    startPosition.current = { x: e.clientX, y: e.clientY };
    startSize.current = { ...size };
    startWindowPosition.current = { ...position };

    document.body.style.cursor = cursorMap[direction];
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isMaximized, size, position, onFocus, handleMouseMove, handleMouseUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const getHandleProps = useCallback((direction: ResizeDirection) => ({
    onMouseDown: (e: React.MouseEvent) => startResize(e, direction),
    style: { cursor: cursorMap[direction] } as React.CSSProperties,
  }), [startResize]);

  return {
    getHandleProps,
    isResizing: isResizing.current,
  };
}
