import React from 'react';
import { useCampaignContext } from '../../../context/CampaignContext';
import CampaignSidebar from './CampaignSidebar';
import CampaignWorkspace from './CampaignWorkspace';
import EmptyState from './EmptyState';
import styles from './ProjectsApp.module.css';

export default function ProjectsApp(): React.ReactElement {
  const { campaigns, selectedCampaignId, selectCampaign } = useCampaignContext();
  const activeCampaigns = campaigns.filter(c => c.phase !== 'completed');

  return (
    <div className={styles.projectsApp}>
      <CampaignSidebar
        campaigns={activeCampaigns}
        selectedId={selectedCampaignId}
        onSelect={selectCampaign}
      />
      <div className={styles.mainContent}>
        {selectedCampaignId ? (
          <CampaignWorkspace campaignId={selectedCampaignId} />
        ) : (
          <EmptyState hasCampaigns={activeCampaigns.length > 0} />
        )}
      </div>
    </div>
  );
}
