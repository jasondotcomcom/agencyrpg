import React, { useState, useEffect, useCallback } from 'react';
import type { Campaign } from '../../../types/campaign';
import { DELIVERABLE_TYPES, PLATFORMS, formatBudget } from '../../../types/campaign';
import { useCampaignContext } from '../../../context/CampaignContext';
import { parseContent, isVideoType, stripTrailingVisualDescription } from '../../../utils/contentFormatter';
import styles from './ReviewMeeting.module.css';

interface ReviewMeetingProps {
  campaign: Campaign;
}

type ReviewView = 'slides' | 'summary';

export default function ReviewMeeting({ campaign }: ReviewMeetingProps): React.ReactElement {
  const { approveInReview, flagInReview, requestRevisions, finishReview } = useCampaignContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [view, setView] = useState<ReviewView>('slides');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const deliverables = campaign.deliverables;
  const currentDel = deliverables[currentSlide];

  const approvedCount = deliverables.filter(d => d.status === 'approved').length;
  const flaggedCount = deliverables.filter(d => d.status === 'needs_revision').length;
  const reviewedCount = approvedCount + flaggedCount;
  const allReviewed = reviewedCount === deliverables.length;
  const allApproved = approvedCount === deliverables.length;

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (view !== 'slides') return;
    if (e.target instanceof HTMLTextAreaElement) return;

    if (e.key === 'ArrowRight' && currentSlide < deliverables.length - 1) {
      setCurrentSlide(prev => prev + 1);
      setShowFeedback(false);
      setFeedbackText('');
    } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      setShowFeedback(false);
      setFeedbackText('');
    }
  }, [currentSlide, deliverables.length, view]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Auto-switch to summary when all reviewed
  useEffect(() => {
    if (allReviewed && view === 'slides') {
      setView('summary');
    }
  }, [allReviewed, view]);

  const handleApprove = () => {
    if (!currentDel) return;
    approveInReview(campaign.id, currentDel.id);
    setShowFeedback(false);
    setFeedbackText('');
    // Auto-advance to next unreviewed slide
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

  const handleSubmit = () => {
    finishReview(campaign.id);
  };

  if (view === 'summary') {
    return (
      <div className={styles.reviewMeeting}>
        <div className={styles.summaryView}>
          <h2 className={styles.summaryTitle}>
            {allApproved ? '🎉 All Work Approved!' : '📋 Review Summary'}
          </h2>
          <p className={styles.summarySubtitle}>
            {approvedCount} approved{flaggedCount > 0 ? `, ${flaggedCount} needs work` : ''}
          </p>

          <div className={styles.summaryList}>
            {deliverables.map((del, i) => {
              const typeInfo = DELIVERABLE_TYPES[del.type];
              const isApproved = del.status === 'approved';
              const isFlagged = del.status === 'needs_revision';
              return (
                <div
                  key={del.id}
                  className={styles.summaryItem}
                  onClick={() => { setCurrentSlide(i); setView('slides'); }}
                >
                  <span className={styles.summaryIcon}>{typeInfo?.icon || '📄'}</span>
                  <div className={styles.summaryInfo}>
                    <div className={styles.summaryItemName}>
                      {typeInfo?.label || del.type}
                      {del.platform !== 'none' && ` — ${PLATFORMS[del.platform]?.label}`}
                    </div>
                    {isFlagged && del.generatedWork?.feedback && (
                      <div className={styles.summaryItemFeedback}>
                        "{del.generatedWork.feedback}"
                      </div>
                    )}
                  </div>
                  <span className={`${styles.summaryStatusBadge} ${isApproved ? styles.approved : isFlagged ? styles.flagged : ''}`}>
                    {isApproved ? '✓ Approved' : isFlagged ? '✗ Needs Work' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Budget summary */}
          <div className={styles.budgetSummary}>
            <div className={styles.budgetTitle}>Campaign Economics</div>
            <div className={styles.budgetRow}>
              <span>Client Budget:</span>
              <span>{formatBudget(campaign.clientBudget)}</span>
            </div>
            <div className={styles.budgetRow}>
              <span>Your Agency Fee:</span>
              <span className={styles.profitValue}>{formatBudget(campaign.teamFee)}</span>
            </div>
            <div className={styles.budgetRow}>
              <span>Production Spent:</span>
              <span>{formatBudget(campaign.productionSpent)}</span>
            </div>
            {campaign.productionSpent <= campaign.productionBudget ? (
              <div className={styles.budgetRow}>
                <span>Under Budget:</span>
                <span className={styles.profitValue}>
                  {formatBudget(campaign.productionBudget - campaign.productionSpent)} saved
                </span>
              </div>
            ) : (
              <div className={styles.budgetRow}>
                <span>Over Budget:</span>
                <span className={styles.overBudget}>
                  -{formatBudget(campaign.productionSpent - campaign.productionBudget)}
                </span>
              </div>
            )}
          </div>

          <div className={styles.summaryActions}>
            {flaggedCount > 0 && (
              <button className={styles.revisionButton} onClick={handleRequestRevisions}>
                🔄 Request Revisions ({flaggedCount})
              </button>
            )}
            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!allApproved}
            >
              {allApproved ? '🚀 Submit Campaign' : `Review Remaining (${deliverables.length - reviewedCount})`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Slide view
  const typeInfo = currentDel ? DELIVERABLE_TYPES[currentDel.type] : null;
  const platformInfo = currentDel ? PLATFORMS[currentDel.platform] : null;

  return (
    <div className={styles.reviewMeeting}>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <span className={styles.progressLabel}>
          {currentSlide + 1} of {deliverables.length}
        </span>
        <div className={styles.progressDots}>
          {deliverables.map((del, i) => (
            <div
              key={del.id}
              className={`${styles.dot} ${
                i === currentSlide ? styles.active :
                del.status === 'approved' ? styles.approved :
                del.status === 'needs_revision' ? styles.flagged :
                del.status === 'ready_for_review' ? styles.reviewed : ''
              }`}
              onClick={() => { setCurrentSlide(i); setShowFeedback(false); setFeedbackText(''); }}
            />
          ))}
        </div>
        <span className={styles.statusSummary}>
          {approvedCount}✓ {flaggedCount > 0 ? `${flaggedCount}✗` : ''}
        </span>
      </div>

      {/* Slide content */}
      {currentDel && (
        <>
          <div className={styles.slideArea}>
            <div className={styles.slideHeader}>
              <span className={styles.typeBadge}>
                {typeInfo?.icon} {typeInfo?.label}
              </span>
              {currentDel.platform !== 'none' && (
                <span className={styles.platformBadge}>
                  {platformInfo?.icon} {platformInfo?.label}
                </span>
              )}
            </div>

            <p className={styles.slideDescription}>{currentDel.description}</p>

            <div className={styles.splitView}>
              {currentDel.generatedWork?.imageUrl && (
                <div className={styles.splitImage}>
                  <img
                    src={currentDel.generatedWork.imageUrl}
                    alt={`Generated visual for ${DELIVERABLE_TYPES[currentDel.type]?.label}`}
                  />
                </div>
              )}
              <div className={styles.splitContent}>
                {currentDel.generatedWork?.content ? (
                  isVideoType(currentDel.type) ? (
                    <div className={styles.videoScript}>
                      {stripTrailingVisualDescription(currentDel.generatedWork.content)}
                    </div>
                  ) : (
                    <div className={styles.contentPreview}>
                      {parseContent(currentDel.generatedWork.content).map((section, idx) =>
                        section.type === 'header' ? (
                          <div key={idx} className={styles.contentHeader}>{section.content}</div>
                        ) : (
                          <div key={idx} className={styles.contentText}>{section.content}</div>
                        )
                      )}
                    </div>
                  )
                ) : (
                  <div className={styles.contentPreview}>No content generated.</div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback input (shown when flagging) */}
          {showFeedback && (
            <div className={styles.feedbackSection}>
              <textarea
                className={styles.feedbackInput}
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="What should the team change? Be specific..."
                rows={2}
                autoFocus
              />
              <button
                className={styles.feedbackSubmit}
                onClick={handleFlag}
                disabled={!feedbackText.trim()}
              >
                Submit Feedback & Flag
              </button>
            </div>
          )}

          {/* Navigation + actions */}
          <div className={styles.navigation}>
            <button
              className={styles.navButton}
              onClick={() => { setCurrentSlide(prev => prev - 1); setShowFeedback(false); setFeedbackText(''); }}
              disabled={currentSlide === 0}
            >
              ← Prev
            </button>

            <div className={styles.actionButtons}>
              <button
                className={`${styles.flagButton} ${currentDel.status === 'needs_revision' ? styles.flagged : ''}`}
                onClick={handleFlag}
              >
                {currentDel.status === 'needs_revision' ? '✗ Flagged' : '✗ Needs Work'}
              </button>
              <button
                className={`${styles.approveButton} ${currentDel.status === 'approved' ? styles.approved : ''}`}
                onClick={handleApprove}
              >
                {currentDel.status === 'approved' ? '✓ Approved' : '✓ Approve'}
              </button>
            </div>

            <button
              className={styles.navButton}
              onClick={() => {
                if (currentSlide === deliverables.length - 1 && allReviewed) {
                  setView('summary');
                } else {
                  setCurrentSlide(prev => prev + 1);
                  setShowFeedback(false);
                  setFeedbackText('');
                }
              }}
              disabled={currentSlide === deliverables.length - 1 && !allReviewed}
            >
              {currentSlide === deliverables.length - 1 && allReviewed ? 'Summary →' : 'Next →'}
            </button>
          </div>

          <div className={styles.keyboardHint}>
            <kbd>←</kbd> <kbd>→</kbd> to navigate
          </div>
        </>
      )}
    </div>
  );
}
