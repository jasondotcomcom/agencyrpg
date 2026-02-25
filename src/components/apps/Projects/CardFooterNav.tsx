import { hapticTap } from '../../../utils/haptics';
import styles from './CardFooterNav.module.css';

interface CardFooterNavProps {
  activeIndex: number;
  maxAccessible: number;
  onNext: () => void;
  onBack: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}

export default function CardFooterNav({ activeIndex, maxAccessible, onNext, onBack, nextDisabled, nextLabel }: CardFooterNavProps) {
  const canGoBack = activeIndex > 0;
  const canGoNext = activeIndex < maxAccessible;

  return (
    <div className={styles.footer}>
      {canGoBack ? (
        <button
          className={styles.backBtn}
          onClick={() => { hapticTap(); onBack(); }}
        >
          ‹ Back
        </button>
      ) : (
        <div />
      )}
      {canGoNext && (
        <button
          className={`${styles.nextBtn} ${nextDisabled ? styles.nextDisabled : ''}`}
          onClick={() => { if (!nextDisabled) { hapticTap(); onNext(); } }}
          disabled={nextDisabled}
        >
          {nextLabel || 'Next ›'}
        </button>
      )}
    </div>
  );
}
