import React from 'react';
import { useCampaignContext } from '../../../context/CampaignContext';
import CampaignSidebar from './CampaignSidebar';
import CampaignWorkspace from './CampaignWorkspace';
import EmptyState from './EmptyState';
import styles from './ProjectsApp.module.css';

export default function ProjectsApp(): React.ReactElement {
  const { campaigns, selectedCampaignId, selectCampaign } = useCampaignContext();
  const activeCampaigns = campaigns.filter(c => c.phase !== 'completed');

  /** On mobile, go back to campaign list by clearing selection */
  const handleMobileBack = () => {
    selectCampaign(null);
  };

  return (
    <div className={`${styles.projectsApp} ${selectedCampaignId ? styles.mobileWorkspaceActive : ''}`}>
      <div className={styles.sidebarWrap}>
        <CampaignSidebar
          campaigns={activeCampaigns}
          selectedId={selectedCampaignId}
          onSelect={selectCampaign}
        />
      </div>
      <div className={styles.mainContent}>
        {selectedCampaignId ? (
          <>
            <button
              className={styles.mobileBackButton}
              onClick={handleMobileBack}
              aria-label="Back to campaigns"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M12.5 15L7.5 10L12.5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Campaigns</span>
            </button>
            <CampaignWorkspace campaignId={selectedCampaignId} />
          </>
        ) : (
          <EmptyState hasCampaigns={activeCampaigns.length > 0} />
        )}
      </div>
    </div>
  );
}
