import React, { useState, useEffect } from 'react';
import { useConductContext } from '../../../context/ConductContext';
import { useWindowContext } from '../../../context/WindowContext';
import { HR_TRAINING_SLIDES } from '../../../data/conductEvents';
import styles from './HRTrainingApp.module.css';

export default function HRTrainingApp(): React.ReactElement {
  const { completeTraining } = useConductContext();
  const { closeWindow } = useWindowContext();
  const [slideIndex, setSlideIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [canProceed, setCanProceed] = useState(false);

  const slide = HR_TRAINING_SLIDES[slideIndex];
  const isLast = slideIndex === HR_TRAINING_SLIDES.length - 1;

  // Per-slide 6-second timer before Next is enabled
  useEffect(() => {
    setCanProceed(false);
    const timer = setTimeout(() => setCanProceed(true), 6000);
    return () => clearTimeout(timer);
  }, [slideIndex]);

  // Overall 30-second countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleNext = () => {
    if (isLast) {
      completeTraining();
      closeWindow('hrtraining');
    } else {
      setSlideIndex(prev => prev + 1);
    }
  };

  return (
    <div className={styles.training}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Mandatory Workplace Conduct Training</span>
        <span className={styles.headerBadge}>REQUIRED</span>
      </div>

      <div className={styles.progress}>
        {HR_TRAINING_SLIDES.map((_, i) => (
          <div
            key={i}
            className={`${styles.progressDot} ${i === slideIndex ? 'active' : ''} ${i < slideIndex ? 'completed' : ''}`}
            style={{
              background: i < slideIndex ? '#4a7c59' : i === slideIndex ? '#8b0000' : undefined,
            }}
          />
        ))}
      </div>

      <div className={styles.content}>
        <div className={styles.slideArea}>
          <div className={styles.slideIcon}>{slide.icon}</div>
          <h2 className={styles.slideTitle}>{slide.title}</h2>
          <p className={styles.slideBody}>{slide.body}</p>
        </div>

        <div className={styles.patSidebar}>
          <div className={styles.patAvatar}>👔</div>
          <div className={styles.patName}>Pat — HR</div>
          <div className={styles.patComment}>"{slide.patComment}"</div>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.timer}>
          {timeRemaining > 0
            ? `Window locked for ${timeRemaining}s`
            : 'You may close this window'}
        </span>
        <button
          className={isLast ? styles.completeButton : styles.nextButton}
          onClick={handleNext}
          disabled={!canProceed}
        >
          {isLast ? 'I Understand' : `Next (${slideIndex + 1}/${HR_TRAINING_SLIDES.length})`}
        </button>
      </div>
    </div>
  );
}
