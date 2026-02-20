import React from 'react';
import type { Campaign } from '../../../types/campaign';
import styles from './CampaignSidebar.module.css';

interface CampaignSidebarProps {
  campaigns: Campaign[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function formatBudget(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDaysRemaining(deadline: Date): number {
  const now = new Date();
  const diff = new Date(deadline).getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getUrgencyClass(days: number): string {
  if (days <= 3) return styles.urgent;
  if (days <= 7) return styles.warning;
  return styles.healthy;
}

export default function CampaignSidebar({ campaigns, selectedId, onSelect }: CampaignSidebarProps): React.ReactElement {
  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>📁 Active Campaigns</h2>
        <span className={styles.count}>{campaigns.length}</span>
      </div>

      <div className={styles.list}>
        {campaigns.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📋</span>
            <p>No active campaigns yet</p>
            <p className={styles.emptyHint}>Accept a brief from your Inbox to get started!</p>
          </div>
        ) : (
          campaigns.map(campaign => {
            const daysRemaining = getDaysRemaining(campaign.deadline);
            const budgetRemaining = campaign.productionBudget - campaign.productionSpent;
            const isSelected = campaign.id === selectedId;
            const approvedCount = campaign.deliverables.filter(d => d.status === 'approved').length;
            const totalCount = campaign.deliverables.length;

            return (
              <button
                key={campaign.id}
                className={`${styles.campaignCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => onSelect(campaign.id)}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.clientAvatar}>
                    {campaign.clientName.charAt(0)}
                  </span>
                  <div className={styles.cardInfo}>
                    <h3 className={styles.campaignName}>{campaign.campaignName}</h3>
                    <p className={styles.clientName}>{campaign.clientName}</p>
                  </div>
                </div>

                <div className={styles.cardStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Budget</span>
                    <span className={styles.statValue}>{formatBudget(budgetRemaining)}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Deadline</span>
                    <span className={`${styles.statValue} ${getUrgencyClass(daysRemaining)}`}>
                      {daysRemaining}d
                    </span>
                  </div>
                </div>

                {totalCount > 0 && (
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${(approvedCount / totalCount) * 100}%` }}
                    />
                  </div>
                )}

                {campaign.phase === 'submitted' && (
                  <div className={styles.submittedBadge}>
                    ⏳ Under Review
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
