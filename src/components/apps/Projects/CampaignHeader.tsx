import React from 'react';
import type { Campaign } from '../../../types/campaign';
import { formatBudget } from '../../../types/campaign';
import styles from './CampaignHeader.module.css';

interface CampaignHeaderProps {
  campaign: Campaign;
}

function getDaysRemaining(deadline: Date): number {
  const now = new Date();
  const diff = new Date(deadline).getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CampaignHeader({ campaign }: CampaignHeaderProps): React.ReactElement {
  const productionRemaining = campaign.productionBudget - campaign.productionSpent;
  const productionSpentPercent = campaign.productionBudget > 0 ? (campaign.productionSpent / campaign.productionBudget) * 100 : 0;
  const daysRemaining = getDaysRemaining(campaign.deadline);

  const getBudgetStatus = () => {
    if (campaign.productionBudget <= 0) return 'critical';
    const remainingPercent = (productionRemaining / campaign.productionBudget) * 100;
    if (remainingPercent <= 20) return 'critical';
    if (remainingPercent <= 50) return 'warning';
    return 'healthy';
  };

  const getDeadlineStatus = () => {
    if (daysRemaining <= 3) return 'critical';
    if (daysRemaining <= 7) return 'warning';
    return 'healthy';
  };

  const phaseLabels: Record<string, { label: string; icon: string }> = {
    concepting: { label: 'Developing Concepts', icon: '💡' },
    selecting: { label: 'Choosing Direction', icon: '🎨' },
    generating: { label: 'Generating Work', icon: '⚡' },
    reviewing: { label: 'Review Meeting', icon: '📋' },
    executing: { label: 'Ready to Submit', icon: '🚀' },
    submitted: { label: 'Under Review', icon: '⏳' },
    completed: { label: 'Complete', icon: '✅' },
  };

  const currentPhase = phaseLabels[campaign.phase] || phaseLabels.concepting;

  return (
    <div className={styles.header}>
      <div className={styles.titleSection}>
        <div className={styles.clientBadge}>
          {campaign.clientName.charAt(0)}
        </div>
        <div className={styles.titleInfo}>
          <h1 className={styles.campaignName}>{campaign.campaignName}</h1>
          <div className={styles.metaRow}>
            <span className={styles.clientName}>{campaign.clientName}</span>
            <span className={styles.phaseBadge}>
              {currentPhase.icon} {currentPhase.label}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={`${styles.stat} ${styles[getBudgetStatus()]}`}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>💰</span>
            <span className={styles.statLabel}>Production Budget</span>
          </div>
          <div className={styles.statValue}>
            {formatBudget(productionRemaining)}
            <span className={styles.statSub}> of {formatBudget(campaign.productionBudget)} remaining</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(productionSpentPercent, 100)}%` }}
            />
          </div>
          <div className={styles.spentLabel}>
            Your Fee: {formatBudget(campaign.teamFee)} | Production: {formatBudget(campaign.productionSpent)} spent
          </div>
        </div>

        <div className={`${styles.stat} ${styles[getDeadlineStatus()]}`}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>⏰</span>
            <span className={styles.statLabel}>Deadline</span>
          </div>
          <div className={styles.statValue}>
            {daysRemaining} days
            <span className={styles.statSub}> remaining</span>
          </div>
          <div className={styles.deadlineHint}>
            {daysRemaining <= 3 ? '🔥 Urgent!' : daysRemaining <= 7 ? '⚡ Getting close' : '✨ On track'}
          </div>
        </div>
      </div>
    </div>
  );
}
