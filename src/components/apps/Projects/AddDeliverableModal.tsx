import React, { useState } from 'react';
import type { DeliverableType, Platform } from '../../../types/campaign';
import { DELIVERABLE_TYPES, PLATFORMS } from '../../../types/campaign';
import { useCampaignContext } from '../../../context/CampaignContext';
import styles from './AddDeliverableModal.module.css';

interface AddDeliverableModalProps {
  campaignId: string;
  onClose: () => void;
}

const platformsByType: Record<DeliverableType, Platform[]> = {
  social_post: ['instagram', 'tiktok', 'linkedin', 'twitter', 'facebook'],
  video: ['youtube', 'tiktok', 'instagram', 'facebook', 'web'],
  print_ad: ['print'],
  billboard: ['outdoor'],
  email_campaign: ['email'],
  landing_page: ['web'],
  experiential: ['none'],
  guerrilla: ['none'],
  podcast_ad: ['spotify'],
  influencer_collab: ['instagram', 'tiktok', 'youtube'],
  twitter_thread: ['twitter'],
  reddit_ama: ['reddit'],
  tiktok_series: ['tiktok'],
  blog_post: ['web'],
};

export default function AddDeliverableModal({ campaignId, onClose }: AddDeliverableModalProps): React.ReactElement {
  const { addDeliverable } = useCampaignContext();
  const [selectedType, setSelectedType] = useState<DeliverableType | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('none');
  const [description, setDescription] = useState('');

  const availablePlatforms = selectedType ? platformsByType[selectedType] : [];

  const handleTypeSelect = (type: DeliverableType) => {
    setSelectedType(type);
    const platforms = platformsByType[type];
    setSelectedPlatform(platforms.length === 1 ? platforms[0] : 'none');
  };

  const handleSubmit = () => {
    if (!selectedType || !description.trim()) return;

    addDeliverable(campaignId, selectedType, selectedPlatform, description.trim());
    onClose();
  };

  const canSubmit = selectedType && description.trim().length > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>✨ Add Deliverable</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <label className={styles.label}>What do you want to create?</label>
            <div className={styles.typeGrid}>
              {(Object.entries(DELIVERABLE_TYPES) as [DeliverableType, { label: string; icon: string }][]).map(
                ([type, info]) => (
                  <button
                    key={type}
                    className={`${styles.typeOption} ${selectedType === type ? styles.selected : ''}`}
                    onClick={() => handleTypeSelect(type)}
                  >
                    <span className={styles.typeIcon}>{info.icon}</span>
                    <span className={styles.typeLabel}>{info.label}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {selectedType && availablePlatforms.length > 1 && (
            <div className={styles.section}>
              <label className={styles.label}>Platform</label>
              <div className={styles.platformGrid}>
                {availablePlatforms.map(platform => {
                  const info = PLATFORMS[platform];
                  return (
                    <button
                      key={platform}
                      className={`${styles.platformOption} ${selectedPlatform === platform ? styles.selected : ''}`}
                      onClick={() => setSelectedPlatform(platform)}
                    >
                      <span className={styles.platformIcon}>{info.icon}</span>
                      <span className={styles.platformLabel}>{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <label className={styles.label}>
              What should this deliverable accomplish?
            </label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the goal of this deliverable. What message should it convey? What action should it drive?"
              rows={4}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            className={`${styles.addButton} ${canSubmit ? styles.active : ''}`}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Add Deliverable
          </button>
        </div>
      </div>
    </div>
  );
}
