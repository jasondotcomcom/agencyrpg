import { useEffect, useRef } from 'react';
import styles from './ContextMenu.module.css';

interface ContextMenuProps {
  x: number;
  y: number;
  hasIcon: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export default function ContextMenu({ x, y, hasIcon, onOpen, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu in viewport
  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - 200);

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div
        className={`${styles.menuItem} ${!hasIcon ? styles.disabled : ''}`}
        onClick={hasIcon ? onOpen : undefined}
      >
        <span className={styles.menuIcon}>📂</span>
        Open
      </div>
      <div className={styles.separator} />
      <div className={`${styles.menuItem} ${styles.disabled}`}>
        <span className={styles.menuIcon}>ℹ️</span>
        Get Info
      </div>
      <div className={styles.separator} />
      <div className={`${styles.menuItem} ${styles.disabled}`}>
        <span className={styles.menuIcon}>✨</span>
        Arrange Icons
      </div>
      <div className={`${styles.menuItem} ${styles.disabled}`}>
        <span className={styles.menuIcon}>🔄</span>
        Refresh
      </div>
    </div>
  );
}
