import { useState, useEffect } from 'react';
import type { Campaign } from '../../../../types/campaign';
import { calculateTeamCost, formatBudget } from '../../../../types/campaign';
import { teamMembers } from '../../../../data/team';
import styles from './TeamCard.module.css';

interface TeamCardProps {
  campaign: Campaign;
  onSelectionChange?: (ids: string[]) => void;
}

export default function TeamCard({ campaign, onSelectionChange }: TeamCardProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    campaign.conceptingTeam?.memberIds || []
  );

  const cost = calculateTeamCost(selectedIds.length);
  const isLocked = !!campaign.conceptingTeam;

  // Report selection changes to parent
  useEffect(() => {
    onSelectionChange?.(selectedIds);
  }, [selectedIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMember = (id: string) => {
    if (isLocked) return;
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>
        {isLocked ? '👥 Your Team' : '👥 Pick Your Team'}
      </h3>
      {!isLocked && (
        <p className={styles.hint}>
          Tap to select 2–4 members
          {selectedIds.length > 0 && (
            <span className={styles.countBadge}>
              {selectedIds.length}/4
            </span>
          )}
        </p>
      )}

      <div className={styles.grid}>
        {teamMembers.map(m => {
          const isSelected = selectedIds.includes(m.id);
          return (
            <button
              key={m.id}
              className={`${styles.cell} ${isSelected ? styles.cellSelected : ''} ${isLocked && !isSelected ? styles.cellDimmed : ''}`}
              onClick={() => toggleMember(m.id)}
              disabled={isLocked && !isSelected}
              type="button"
            >
              {isSelected && <span className={styles.checkOverlay}>✓</span>}
              <span className={styles.avatar}>{m.avatar}</span>
              <span className={styles.name}>{m.name.split(' ')[0]}</span>
              <span className={styles.role}>{m.role}</span>
            </button>
          );
        })}
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.costRow}>
          <span>Fee ({selectedIds.length}):</span>
          <span className={styles.costValue}>{formatBudget(cost)}</span>
        </div>
      )}
    </div>
  );
}
