import React from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  hasCampaigns: boolean;
}

export default function EmptyState({ hasCampaigns }: EmptyStateProps): React.ReactElement {
  if (hasCampaigns) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.icon}>👈</div>
        <h2 className={styles.title}>Select a Campaign</h2>
        <p className={styles.description}>
          Choose a campaign from the sidebar to view its workspace and start creating deliverables.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.emptyState}>
      <div className={styles.icon}>📬</div>
      <h2 className={styles.title}>No Active Campaigns</h2>
      <p className={styles.description}>
        Your campaign workspace is empty! Head to your <strong>Inbox</strong> to accept a brief and start your first campaign.
      </p>
      <div className={styles.tips}>
        <h3 className={styles.tipsTitle}>How it works:</h3>
        <ol className={styles.tipsList}>
          <li>Open your <strong>Inbox</strong> app</li>
          <li>Read a campaign brief from a client</li>
          <li>Click <strong>"Accept Brief"</strong> to start working</li>
          <li>Come back here to plan deliverables and assign your team</li>
        </ol>
      </div>
    </div>
  );
}
