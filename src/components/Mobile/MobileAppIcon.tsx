import { useCallback, useRef } from 'react';
import { icons } from '../Desktop/DesktopIcon';
import { useMobileContext } from '../../context/MobileContext';
import styles from './Mobile.module.css';

interface MobileAppIconProps {
  appId: string;
  label: string;
  iconKey: string;
  badgeCount?: number;
  showLabel?: boolean;
}

export default function MobileAppIcon({
  appId,
  label,
  iconKey,
  badgeCount,
  showLabel = true,
}: MobileAppIconProps) {
  const { openApp } = useMobileContext();
  const ref = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform = 'scale(0.9)';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform = 'scale(1)';
    }
  }, []);

  const handleClick = useCallback(() => {
    openApp(appId);
  }, [openApp, appId]);

  const isToolIcon = iconKey.startsWith('tool:');
  const emojiChar = isToolIcon ? iconKey.slice(5) : null;

  return (
    <div
      ref={ref}
      className={styles.appIcon}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      role="button"
      aria-label={`Open ${label}`}
    >
      <div className={styles.appIconImageWrapper}>
        <div className={styles.appIconImage}>
          {isToolIcon ? (
            <span className={styles.appIconEmoji}>{emojiChar}</span>
          ) : (
            icons[iconKey] || icons.help
          )}
        </div>
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className={styles.badge}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>
      {showLabel && (
        <span className={styles.appIconLabel}>{label}</span>
      )}
    </div>
  );
}
