import type { Campaign } from '../../../../types/campaign';
import { DELIVERABLE_TYPES, formatBudget } from '../../../../types/campaign';
import styles from './SubmitCard.module.css';

interface SubmitCardProps {
  campaign: Campaign;
  onSubmit: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
}

export default function SubmitCard({ campaign, onSubmit, canSubmit, isSubmitting }: SubmitCardProps) {
  const selectedConcept = campaign.generatedConcepts.find(c => c.id === campaign.selectedConceptId);
  const approvedCount = campaign.deliverables.filter(d => d.status === 'approved').length;
  const totalCount = campaign.deliverables.length;
  const isSubmitted = campaign.phase === 'submitted';
  const isCompleted = campaign.phase === 'completed';

  // Submitted state
  if (isSubmitted) {
    return (
      <div className={styles.card}>
        <div className={styles.stateScreen}>
          <span className={styles.stateIcon}>⏳</span>
          <h3 className={styles.stateTitle}>Awaiting Client Review</h3>
          <p className={styles.stateText}>Your campaign has been submitted. The client is reviewing your work...</p>
        </div>
      </div>
    );
  }

  // Completed state
  if (isCompleted) {
    return (
      <div className={styles.card}>
        <div className={styles.stateScreen}>
          {campaign.clientScore && (
            <div className={styles.scoreCircle}>
              <span className={styles.scoreValue}>{campaign.clientScore}</span>
              <span className={styles.scoreLabel}>Score</span>
            </div>
          )}
          <h3 className={styles.stateTitle}>Campaign Complete!</h3>
          {campaign.clientFeedback && (
            <p className={styles.feedback}>"{campaign.clientFeedback}"</p>
          )}
        </div>
      </div>
    );
  }

  // Default: executing phase — ready to submit
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>🚀 Submit Campaign</h3>

      {selectedConcept && (
        <div className={styles.conceptBanner}>
          <span className={styles.bannerIcon}>🎨</span>
          <div>
            <span className={styles.bannerLabel}>Selected Direction</span>
            <span className={styles.bannerValue}>"{selectedConcept.name}"</span>
          </div>
        </div>
      )}

      <div className={styles.deliverablesSummary}>
        <span className={styles.summaryLabel}>Approved Deliverables</span>
        {campaign.deliverables.map(del => {
          const typeInfo = DELIVERABLE_TYPES[del.type];
          return (
            <div key={del.id} className={styles.delRow}>
              <span>{del.status === 'approved' ? '✓' : '○'}</span>
              <span>{typeInfo?.icon} {typeInfo?.label}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.budgetSummary}>
        <div className={styles.budgetRow}>
          <span>Client Budget:</span>
          <span>{formatBudget(campaign.clientBudget)}</span>
        </div>
        <div className={styles.budgetRow}>
          <span>Production Spent:</span>
          <span>{formatBudget(campaign.productionSpent)}</span>
        </div>
        <div className={`${styles.budgetRow} ${styles.budgetTotal}`}>
          <span>{campaign.productionSpent <= campaign.productionBudget ? 'Under Budget' : 'Over Budget'}:</span>
          <span>{formatBudget(Math.abs(campaign.productionBudget - campaign.productionSpent))}</span>
        </div>
      </div>

      {!canSubmit && (
        <p className={styles.hint}>
          Approve all deliverables to submit ({approvedCount}/{totalCount} approved)
        </p>
      )}

      <button
        className={`${styles.submitBtn} ${canSubmit ? styles.active : ''}`}
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? '⏳ Submitting...' : '🚀 Submit Campaign'}
      </button>
    </div>
  );
}
