import { useState, useEffect } from 'react';
import type { Notification as NotificationType } from '../../types';
import styles from './Notification.module.css';

interface NotificationProps {
  notification: NotificationType;
  onClose: () => void;
}

export default function Notification({ notification, onClose }: NotificationProps) {
  const [isClosing, setIsClosing] = useState(false);
  const duration = notification.duration ?? 4000;

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 250); // Wait for animation
  };

  return (
    <div className={`${styles.notification} ${isClosing ? styles.closing : ''}`}>
      <div className={styles.header}>
        <div className={styles.icon}>
          ✨
        </div>
        <span className={styles.title}>{notification.title}</span>
        <button className={styles.closeButton} onClick={handleClose}>
          ×
        </button>
      </div>
      <div className={styles.content}>
        {notification.message}
      </div>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
}
