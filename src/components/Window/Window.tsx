import React, { useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { WindowState } from '../../types';
import { useWindowContext } from '../../context/WindowContext';
import { useWindowDrag } from '../../hooks/useWindowDrag';
import { useWindowResize } from '../../hooks/useWindowResize';
import TitleBar from './TitleBar';
import ResizeHandles from './ResizeHandles';
import AppRouter from '../apps/AppRouter';
import { useSettingsContext } from '../../context/SettingsContext';
import styles from './Window.module.css';

interface WindowProps {
  window: WindowState;
  children?: ReactNode;
}

export default function Window({ window: windowState, children }: WindowProps) {
  const {
    activeWindowId,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updatePosition,
    updateSize,
  } = useWindowContext();
  const { settings } = useSettingsContext();
  const windowOpacity = settings.display.windowOpacity / 100;

  const isActive = activeWindowId === windowState.id;

  const handleFocus = useCallback(() => {
    focusWindow(windowState.id);
  }, [focusWindow, windowState.id]);

  const handlePositionChange = useCallback((x: number, y: number) => {
    updatePosition(windowState.id, x, y);
  }, [updatePosition, windowState.id]);

  const handleSizeChange = useCallback((width: number, height: number) => {
    updateSize(windowState.id, width, height);
  }, [updateSize, windowState.id]);

  const { onMouseDown: onDragMouseDown } = useWindowDrag({
    position: windowState.position,
    isMaximized: windowState.isMaximized,
    onPositionChange: handlePositionChange,
    onFocus: handleFocus,
  });

  const { getHandleProps } = useWindowResize({
    position: windowState.position,
    size: windowState.size,
    minSize: windowState.minSize,
    isMaximized: windowState.isMaximized,
    onPositionChange: handlePositionChange,
    onSizeChange: handleSizeChange,
    onFocus: handleFocus,
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeWindow(windowState.id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, closeWindow, windowState.id]);

  const windowStyle: React.CSSProperties = windowState.isMaximized
    ? { zIndex: windowState.zIndex, opacity: windowOpacity }
    : {
        left: windowState.position.x,
        top: windowState.position.y,
        width: windowState.size.width,
        height: windowState.size.height,
        minWidth: windowState.minSize.width,
        minHeight: windowState.minSize.height,
        zIndex: windowState.zIndex,
        opacity: windowOpacity,
      };

  if (windowState.isMinimized) {
    return null;
  }

  return (
    <div
      className={`${styles.window} ${windowState.isMaximized ? styles.maximized : ''}`}
      style={windowStyle}
      onMouseDown={handleFocus}
    >
      <TitleBar
        title={windowState.title}
        appId={windowState.appId}
        isActive={isActive}
        isMaximized={windowState.isMaximized}
        onMinimize={() => minimizeWindow(windowState.id)}
        onMaximize={() => maximizeWindow(windowState.id)}
        onClose={() => closeWindow(windowState.id)}
        onMouseDown={onDragMouseDown}
      />
      <div className={styles.windowContent}>
        {children || <AppRouter appId={windowState.appId} />}
      </div>
      {!windowState.isMaximized && <ResizeHandles getHandleProps={getHandleProps} />}
    </div>
  );
}


