import React, { useState } from 'react';
import type { Campaign, Deliverable } from '../../../types/campaign';
import { calculateTeamCost, DELIVERABLE_TYPES, formatBudget } from '../../../types/campaign';
import { useCampaignContext } from '../../../context/CampaignContext';
import { teamMembers } from '../../../data/team';
import styles from './TeamAssignmentModal.module.css';

interface TeamAssignmentModalProps {
  campaign: Campaign;
  deliverable: Deliverable;
  onClose: () => void;
}

export default function TeamAssignmentModal({
  campaign,
  deliverable,
  onClose,
}: TeamAssignmentModalProps): React.ReactElement {
  const { assignTeam } = useCampaignContext();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    deliverable.assignedTeam?.memberIds || []
  );

  const typeInfo = DELIVERABLE_TYPES[deliverable.type];
  const currentCost = calculateTeamCost(selectedIds.length);
  const previousCost = deliverable.assignedTeam?.cost || 0;

  // Calculate budget impact (production budget based)
  const productionRemaining = campaign.productionBudget - campaign.productionSpent;
  const budgetRemainingWithoutThis = productionRemaining + previousCost;
  const budgetAfterAssignment = budgetRemainingWithoutThis - currentCost;
  const wouldExceedBudget = budgetAfterAssignment < 0;

  const toggleMember = (memberId: string) => {
    setSelectedIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSave = () => {
    if (wouldExceedBudget) return;
    assignTeam(campaign.id, deliverable.id, selectedIds);
    onClose();
  };

  // Check if adding another member would exceed budget
  const canAddMore = (memberId: string): boolean => {
    if (selectedIds.includes(memberId)) return true; // Can always remove
    const newCount = selectedIds.length + 1;
    const newCost = calculateTeamCost(newCount);
    return (budgetRemainingWithoutThis - newCost) >= 0;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h2 className={styles.title}>👥 Assign Team</h2>
            <p className={styles.subtitle}>
              {typeInfo.icon} {typeInfo.label} - {deliverable.description.slice(0, 50)}...
            </p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {/* Budget Info */}
          <div className={`${styles.budgetInfo} ${wouldExceedBudget ? styles.overBudget : ''}`}>
            <div className={styles.budgetRow}>
              <span className={styles.budgetLabel}>Budget Available:</span>
              <span className={styles.budgetValue}>{formatBudget(budgetRemainingWithoutThis)}</span>
            </div>
            <div className={styles.budgetRow}>
              <span className={styles.budgetLabel}>This Team Will Cost:</span>
              <span className={`${styles.budgetValue} ${styles.costHighlight}`}>
                {formatBudget(currentCost)}
              </span>
            </div>
            <div className={`${styles.budgetRow} ${styles.budgetResult}`}>
              <span className={styles.budgetLabel}>After Assignment:</span>
              <span className={`${styles.budgetValue} ${wouldExceedBudget ? styles.negative : ''}`}>
                {formatBudget(budgetAfterAssignment)}
              </span>
            </div>
            {wouldExceedBudget && (
              <div className={styles.budgetWarning}>
                ⚠️ Not enough budget! Select fewer team members or remove from other deliverables.
              </div>
            )}
          </div>

          {/* Cost Scale */}
          <div className={styles.costScale}>
            <span className={styles.costScaleLabel}>Team cost scale:</span>
            <div className={styles.costScaleItems}>
              {[1, 2, 3, 4, 5].map(count => {
                const cost = calculateTeamCost(count);
                const affordable = cost <= budgetRemainingWithoutThis;
                return (
                  <span
                    key={count}
                    className={`${styles.costScaleItem} ${!affordable ? styles.unaffordable : ''}`}
                  >
                    {count}👤 = {formatBudget(cost)}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Team List */}
          <div className={styles.teamList}>
            {teamMembers.map(member => {
              const isSelected = selectedIds.includes(member.id);
              const canAdd = canAddMore(member.id);

              return (
                <button
                  key={member.id}
                  className={`${styles.memberCard} ${isSelected ? styles.selected : ''} ${!canAdd && !isSelected ? styles.disabled : ''}`}
                  onClick={() => {
                    if (!canAdd && !isSelected) return;
                    toggleMember(member.id);
                  }}
                  disabled={!canAdd && !isSelected}
                >
                  <div className={styles.memberAvatar}>{member.avatar}</div>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberName}>{member.name}</div>
                    <div className={styles.memberRole}>{member.role}</div>
                    <div className={styles.memberSpecialty}>{member.specialty}</div>
                  </div>
                  <div className={styles.checkMark}>
                    {isSelected ? '✓' : !canAdd ? '💸' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.selectedCount}>
            {selectedIds.length} team member{selectedIds.length !== 1 ? 's' : ''} selected
            {selectedIds.length > 0 && ` • ${formatBudget(currentCost)}`}
          </div>
          <div className={styles.footerActions}>
            <button className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button
              className={`${styles.saveButton} ${!wouldExceedBudget ? styles.active : ''}`}
              onClick={handleSave}
              disabled={wouldExceedBudget}
            >
              {selectedIds.length === 0 ? 'Clear Team' : 'Assign Team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
