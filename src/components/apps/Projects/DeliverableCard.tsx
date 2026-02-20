import React, { useState } from 'react';
import type { Deliverable } from '../../../types/campaign';
import { DELIVERABLE_TYPES, PLATFORMS, STATUS_DISPLAY } from '../../../types/campaign';
import { useCampaignContext } from '../../../context/CampaignContext';
import { getTeamMembers } from '../../../data/team';
import styles from './DeliverableCard.module.css';

interface DeliverableCardProps {
  campaignId: string;
  deliverable: Deliverable;
  budgetRemaining: number; // Used for budget warnings (future feature)
  onAssignTeam: () => void;
  onReview: () => void;
  disabled?: boolean;
}

function formatCost(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DeliverableCard({
  campaignId,
  deliverable,
  budgetRemaining: _budgetRemaining,
  onAssignTeam,
  onReview,
  disabled = false,
}: DeliverableCardProps): React.ReactElement {
  const { generateWork, removeDeliverable, isGenerating, generatingDeliverableId } = useCampaignContext();
  const [isRemoving, setIsRemoving] = useState(false);

  const typeInfo = DELIVERABLE_TYPES[deliverable.type];
  const platformInfo = PLATFORMS[deliverable.platform];
  const statusInfo = STATUS_DISPLAY[deliverable.status];
  const teamMembers = deliverable.assignedTeam
    ? getTeamMembers(deliverable.assignedTeam.memberIds)
    : [];

  const isThisGenerating = isGenerating && generatingDeliverableId === deliverable.id;
  const canGenerate = deliverable.assignedTeam && deliverable.assignedTeam.memberIds.length > 0;
  const hasWork = deliverable.generatedWork !== null;

  const handleGenerate = async () => {
    if (!canGenerate || isGenerating || disabled) return;
    await generateWork(campaignId, deliverable.id);
  };

  const handleRemove = () => {
    if (disabled) return;
    setIsRemoving(true);
    setTimeout(() => {
      removeDeliverable(campaignId, deliverable.id);
    }, 200);
  };

  return (
    <div className={`${styles.card} ${isRemoving ? styles.removing : ''}`}>
      <div className={styles.header}>
        <div className={styles.typeInfo}>
          <span className={styles.typeIcon}>{typeInfo.icon}</span>
          <span className={styles.typeName}>{typeInfo.label}</span>
          {deliverable.platform !== 'none' && (
            <span className={styles.platform}>
              {platformInfo.icon} {platformInfo.label}
            </span>
          )}
        </div>
        <div className={styles.headerActions}>
          <span
            className={styles.status}
            style={{ backgroundColor: `${statusInfo.color}30`, color: statusInfo.color }}
          >
            {statusInfo.label}
          </span>
          {!disabled && (
            <button
              className={styles.removeButton}
              onClick={handleRemove}
              title="Remove deliverable"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <p className={styles.description}>{deliverable.description}</p>

      <div className={styles.footer}>
        <div className={styles.team}>
          {teamMembers.length > 0 ? (
            <div className={styles.teamAvatars}>
              {teamMembers.map(member => (
                <span
                  key={member.id}
                  className={styles.teamAvatar}
                  title={member.name}
                >
                  {member.avatar}
                </span>
              ))}
              <span className={styles.teamCost}>
                {formatCost(deliverable.assignedTeam?.cost || 0)}
              </span>
            </div>
          ) : (
            <span className={styles.noTeam}>No team assigned</span>
          )}
        </div>

        <div className={styles.actions}>
          {!disabled && (
            <button
              className={styles.teamButton}
              onClick={onAssignTeam}
            >
              {teamMembers.length > 0 ? '👥 Edit Team' : '👥 Assign Team'}
            </button>
          )}

          {canGenerate && !hasWork && !disabled && (
            <button
              className={`${styles.generateButton} ${isThisGenerating ? styles.generating : ''}`}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isThisGenerating ? (
                <>
                  <span className={styles.spinner}>⚡</span>
                  Generating...
                </>
              ) : (
                '✨ Generate'
              )}
            </button>
          )}

          {hasWork && (
            <button
              className={styles.reviewButton}
              onClick={onReview}
            >
              {deliverable.status === 'approved' ? '✅ View Work' : '👁️ Review'}
            </button>
          )}

          {deliverable.status === 'needs_revision' && !disabled && (
            <button
              className={`${styles.generateButton} ${isThisGenerating ? styles.generating : ''}`}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isThisGenerating ? (
                <>
                  <span className={styles.spinner}>⚡</span>
                  Revising...
                </>
              ) : (
                '🔄 Revise'
              )}
            </button>
          )}
        </div>
      </div>

      {isThisGenerating && (
        <div className={styles.generatingOverlay}>
          <div className={styles.generatingContent}>
            <span className={styles.generatingIcon}>✨</span>
            <span className={styles.generatingText}>
              {teamMembers.map(m => m.name).join(' & ')} {teamMembers.length === 1 ? 'is' : 'are'} working on this...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
