import React from 'react';
import type { Campaign } from '../../../types/campaign';
import DeliverableCard from './DeliverableCard';
import styles from './DeliverableList.module.css';

interface DeliverableListProps {
  campaign: Campaign;
  onAssignTeam: (deliverableId: string) => void;
  onReview: (deliverableId: string) => void;
  disabled?: boolean;
}

export default function DeliverableList({
  campaign,
  onAssignTeam,
  onReview,
  disabled = false,
}: DeliverableListProps): React.ReactElement {
  if (campaign.deliverables.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📦</div>
        <p className={styles.emptyTitle}>No deliverables yet</p>
        <p className={styles.emptyHint}>
          Click "+ Add Deliverable" to start planning what you'll create for this campaign.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {campaign.deliverables.map(deliverable => (
        <DeliverableCard
          key={deliverable.id}
          campaignId={campaign.id}
          deliverable={deliverable}
          budgetRemaining={campaign.productionBudget - campaign.productionSpent}
          onAssignTeam={() => onAssignTeam(deliverable.id)}
          onReview={() => onReview(deliverable.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
