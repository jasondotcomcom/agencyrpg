import { useState, useEffect, useRef } from 'react';
import type { Campaign } from '../../../../types/campaign';
import { DELIVERABLE_TYPES, PLATFORMS, formatBudget } from '../../../../types/campaign';
import { useCampaignContext } from '../../../../context/CampaignContext';
import { parseContent, isVideoType, stripTrailingVisualDescription, generateScriptSummary } from '../../../../utils/contentFormatter';
import styles from './ReviewCard.module.css';

interface ReviewCardProps {
  campaign: Campaign;
}

export default function ReviewCard({ campaign }: ReviewCardProps) {
  const { approveInReview, flagInReview, requestRevisions } = useCampaignContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [view, setView] = useState<'slides' | 'summary'>('slides');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [showFullScript, setShowFullScript] = useState(false);

  // Inner swipe area ref — touch events on this element are consumed
  // to prevent outer card-flow swipe from interfering
  const slideAreaRef = useRef<HTMLDivElement>(null);

  const deliverables = campaign.deliverables;
  const currentDel = deliverables[currentSlide];
  const approvedCount = deliverables.filter(d => d.status === 'approved').length;
  const flaggedCount = deliverables.filter(d => d.status === 'needs_revision').length;
  const reviewedCount = approvedCount + flaggedCount;
  const allReviewed = reviewedCount === deliverables.length;
  const allApproved = approvedCount === deliverables.length;

  // Auto-switch to summary when all reviewed
  useEffect(() => {
    if (allReviewed && view === 'slides') setView('summary');
  }, [allReviewed, view]);

  // Prevent outer card-flow swipe on the slide area
  useEffect(() => {
    const el = slideAreaRef.current;
    if (!el) return;
    const handler = (e: TouchEvent) => {
      // Only stop propagation for horizontal moves in the slide area
      e.stopPropagation();
    };
    el.addEventListener('touchmove', handler, { passive: true });
    return () => el.removeEventListener('touchmove', handler);
  }, []);

  // Inner swipe for slide navigation
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const handleInnerTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleInnerTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    touchRef.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && currentSlide < deliverables.length - 1) {
      setCurrentSlide(prev => prev + 1);
      setShowFeedback(false);
      setFeedbackText('');
    } else if (dx > 0 && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      setShowFeedback(false);
      setFeedbackText('');
    }
  };

  const handleApprove = () => {
    if (!currentDel) return;
    approveInReview(campaign.id, currentDel.id);
    setShowFeedback(false);
    setFeedbackText('');
    if (currentSlide < deliverables.length - 1) {
      setTimeout(() => setCurrentSlide(prev => prev + 1), 300);
    }
  };

  const handleFlag = () => {
    if (!currentDel) return;
    if (!showFeedback) {
      setShowFeedback(true);
      return;
    }
    if (!feedbackText.trim()) return;
    flagInReview(campaign.id, currentDel.id, feedbackText.trim());
    setShowFeedback(false);
    setFeedbackText('');
    if (currentSlide < deliverables.length - 1) {
      setTimeout(() => setCurrentSlide(prev => prev + 1), 300);
    }
  };

  const handleRequestRevisions = () => {
    requestRevisions(campaign.id);
  };

  if (deliverables.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📋</span>
          <p>Nothing to review yet. Deliverables are still being generated.</p>
        </div>
      </div>
    );
  }

  // ── Summary View ────────────────────────────────────────────────────────

  if (view === 'summary') {
    return (
      <div className={styles.card}>
        <h3 className={styles.summaryTitle}>
          {allApproved ? '🎉 All Work Approved!' : '📋 Review Summary'}
        </h3>
        <p className={styles.summarySubtitle}>
          {approvedCount} approved, {flaggedCount} needs work
        </p>

        <div className={styles.summaryList}>
          {deliverables.map((del, i) => {
            const typeInfo = DELIVERABLE_TYPES[del.type];
            return (
              <button
                key={del.id}
                className={styles.summaryRow}
                onClick={() => { setView('slides'); setCurrentSlide(i); }}
              >
                <span className={del.status === 'approved' ? styles.summaryApproved : styles.summaryFlagged}>
                  {del.status === 'approved' ? '✓' : '✗'}
                </span>
                <span>{typeInfo?.icon} {typeInfo?.label}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.budgetSummary}>
          <div className={styles.budgetRow}>
            <span>Client Budget:</span>
            <span>{formatBudget(campaign.clientBudget)}</span>
          </div>
          <div className={styles.budgetRow}>
            <span>Agency Fee (profit):</span>
            <span>{formatBudget(campaign.teamFee)}</span>
          </div>
          <div className={styles.budgetRow}>
            <span>Production Spent:</span>
            <span>{formatBudget(campaign.productionSpent)}</span>
          </div>
          <div className={`${styles.budgetRow} ${styles.budgetTotal}`}>
            <span>{campaign.productionSpent <= campaign.productionBudget ? 'Under Budget:' : 'Over Budget:'}</span>
            <span>{formatBudget(Math.abs(campaign.productionBudget - campaign.productionSpent))}</span>
          </div>
        </div>

        {flaggedCount > 0 && (
          <button className={styles.reviseBtn} onClick={handleRequestRevisions}>
            🔄 Request Revisions ({flaggedCount})
          </button>
        )}
      </div>
    );
  }

  // ── Slides View ─────────────────────────────────────────────────────────

  const typeInfo = DELIVERABLE_TYPES[currentDel?.type];
  const platformInfo = PLATFORMS[currentDel?.platform];
  const work = currentDel?.generatedWork;
  const isVideo = currentDel ? isVideoType(currentDel.type) : false;

  let contentDisplay: React.ReactNode = null;
  if (work?.content) {
    if (isVideo) {
      const summary = generateScriptSummary(work.content);
      const full = stripTrailingVisualDescription(work.content);
      contentDisplay = (
        <div className={styles.scriptArea}>
          <div className={styles.scriptToggle}>
            <button
              className={!showFullScript ? styles.scriptActive : ''}
              onClick={() => setShowFullScript(false)}
            >Quick View</button>
            <button
              className={showFullScript ? styles.scriptActive : ''}
              onClick={() => setShowFullScript(true)}
            >Full Script</button>
          </div>
          <div className={styles.scriptContent}>
            {showFullScript ? full : summary}
          </div>
        </div>
      );
    } else {
      const sections = parseContent(work.content);
      contentDisplay = (
        <div className={styles.contentSections}>
          {sections.map((s, i) => (
            <div key={i}>
              {s.type === 'header' && <h4 className={styles.contentHeader}>{s.content}</h4>}
              {s.type === 'text' && <p className={styles.contentBody}>{s.content}</p>}
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div className={styles.card}>
      {/* Mini progress dots */}
      <div className={styles.slideDots}>
        {deliverables.map((del, i) => (
          <button
            key={del.id}
            className={`${styles.slideDot} ${i === currentSlide ? styles.slideDotActive : ''} ${del.status === 'approved' ? styles.slideDotApproved : del.status === 'needs_revision' ? styles.slideDotFlagged : ''}`}
            onClick={() => { setCurrentSlide(i); setShowFeedback(false); setFeedbackText(''); }}
          />
        ))}
        <span className={styles.slideCount}>{currentSlide + 1} of {deliverables.length}</span>
      </div>

      {/* Slide content */}
      <div
        ref={slideAreaRef}
        className={styles.slideArea}
        onTouchStart={handleInnerTouchStart}
        onTouchEnd={handleInnerTouchEnd}
      >
        <div className={styles.slideBadges}>
          <span className={styles.typeBadge}>{typeInfo?.icon} {typeInfo?.label}</span>
          {currentDel?.platform !== 'none' && (
            <span className={styles.platformBadge}>{platformInfo?.label}</span>
          )}
          <span className={`${styles.statusBadge} ${
            currentDel?.status === 'approved' ? styles.approved :
            currentDel?.status === 'needs_revision' ? styles.flagged : ''
          }`}>
            {currentDel?.status === 'approved' ? '✓ Approved' :
             currentDel?.status === 'needs_revision' ? '✗ Flagged' :
             'Pending Review'}
          </span>
        </div>

        {currentDel?.description && (
          <p className={styles.slideDescription}>{currentDel.description}</p>
        )}

        {work?.imageUrl && (
          <div className={styles.slideImage}>
            <img src={work.imageUrl} alt={typeInfo?.label} />
          </div>
        )}

        {contentDisplay}
      </div>

      {/* Actions */}
      <div className={styles.slideActions}>
        <button
          className={styles.flagBtn}
          onClick={handleFlag}
          disabled={currentDel?.status === 'approved' || currentDel?.status === 'needs_revision'}
        >
          ✗ {showFeedback ? 'Submit Flag' : 'Needs Work'}
        </button>
        <button
          className={styles.approveBtn}
          onClick={handleApprove}
          disabled={currentDel?.status === 'approved' || currentDel?.status === 'needs_revision'}
        >
          ✓ Approve
        </button>
      </div>

      {showFeedback && (
        <textarea
          className={styles.feedbackInput}
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="What needs to change?"
          rows={3}
          autoFocus
        />
      )}

      {/* Slide navigation */}
      <div className={styles.slideNav}>
        <button
          className={styles.slideNavBtn}
          onClick={() => { setCurrentSlide(prev => prev - 1); setShowFeedback(false); }}
          disabled={currentSlide === 0}
        >
          ← Prev
        </button>
        <button
          className={styles.slideNavBtn}
          onClick={() => { setCurrentSlide(prev => prev + 1); setShowFeedback(false); }}
          disabled={currentSlide >= deliverables.length - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
