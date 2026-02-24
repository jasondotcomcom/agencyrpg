import { createPortal } from 'react-dom';
import { hapticTap } from '../../utils/haptics';
import styles from './FullscreenGameWrapper.module.css';

interface FullscreenGameWrapperProps {
  children: React.ReactNode;
  onClose: () => void;
}

export default function FullscreenGameWrapper({ children, onClose }: FullscreenGameWrapperProps) {
  const handleClose = () => {
    hapticTap();
    onClose();
  };

  return createPortal(
    <div className={styles.fullscreenGame}>
      <button
        className={styles.closeBtn}
        onClick={handleClose}
        aria-label="Close game"
        type="button"
      >
        ✕
      </button>
      <div className={styles.gameCanvas}>{children}</div>
    </div>,
    document.body,
  );
}
