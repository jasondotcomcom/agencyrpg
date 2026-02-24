import type { Campaign } from '../../../../types/campaign';
import { formatBudget } from '../../../../types/campaign';
import styles from './BriefCard.module.css';

interface BriefCardProps {
  campaign: Campaign;
}

export default function BriefCard({ campaign }: BriefCardProps) {
  const { brief } = campaign;
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / 86400000));

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>📋</span>
        <div>
          <h2 className={styles.campaignName}>{campaign.campaignName}</h2>
          <span className={styles.clientName}>{campaign.clientName}</span>
        </div>
      </div>

      <div className={styles.badges}>
        <span className={styles.badge}>{formatBudget(campaign.clientBudget)}</span>
        <span className={styles.badge}>{daysLeft}d left</span>
        {brief.industry && <span className={styles.badge}>{brief.industry}</span>}
      </div>

      <div className={styles.sections}>
        {brief.challenge && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>🎯 Challenge</span>
            <p className={styles.sectionText}>{brief.challenge}</p>
          </div>
        )}
        {brief.audience && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>👥 Target Audience</span>
            <p className={styles.sectionText}>{brief.audience}</p>
          </div>
        )}
        {brief.message && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>💬 Key Message</span>
            <p className={styles.sectionText}>{brief.message}</p>
          </div>
        )}
        {brief.vibe && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>✨ Vibe</span>
            <p className={styles.sectionText}>{brief.vibe}</p>
          </div>
        )}
        {brief.successMetrics && brief.successMetrics.length > 0 && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>📊 Success Metrics</span>
            <p className={styles.sectionText}>{brief.successMetrics.join(', ')}</p>
          </div>
        )}
        {brief.constraints && brief.constraints.length > 0 && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>⚠️ Constraints</span>
            <p className={styles.sectionText}>{brief.constraints.join(', ')}</p>
          </div>
        )}
        {brief.openEndedAsk && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>💡 Open-Ended Ask</span>
            <p className={styles.sectionText}>{brief.openEndedAsk}</p>
          </div>
        )}
      </div>
    </div>
  );
}
