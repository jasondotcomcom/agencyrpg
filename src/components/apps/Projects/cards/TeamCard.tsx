import { useState } from 'react';
import type { Campaign } from '../../../../types/campaign';
import { calculateTeamCost, formatBudget } from '../../../../types/campaign';
import { useCampaignContext } from '../../../../context/CampaignContext';
import { teamMembers } from '../../../../data/team';
import styles from './TeamCard.module.css';

interface TeamCardProps {
  campaign: Campaign;
}

export default function TeamCard({ campaign }: TeamCardProps) {
  const { setConceptingTeam } = useCampaignContext();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    campaign.conceptingTeam?.memberIds || []
  );
  const [isEditing, setIsEditing] = useState(!campaign.conceptingTeam);

  const cost = calculateTeamCost(selectedIds.length);
  const isValid = selectedIds.length >= 2 && selectedIds.length <= 4;

  const toggleMember = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!isValid) return;
    setConceptingTeam(campaign.id, selectedIds);
    setIsEditing(false);
  };

  const selectedMembers = teamMembers.filter(m => selectedIds.includes(m.id));

  // Show selected team summary
  if (!isEditing && selectedMembers.length > 0) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>👥 Your Team</h3>
        <div className={styles.selectedGrid}>
          {selectedMembers.map(m => (
            <div key={m.id} className={styles.memberChip}>
              <span className={styles.memberAvatar}>{m.avatar}</span>
              <div>
                <div className={styles.memberName}>{m.name}</div>
                <div className={styles.memberRole}>{m.role}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.costRow}>
          <span>Agency Fee:</span>
          <span className={styles.costValue}>{formatBudget(cost)}</span>
        </div>
        <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
          Edit Team
        </button>
      </div>
    );
  }

  // Editing / selection mode
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>👥 Pick Your Team</h3>
      <p className={styles.hint}>Select 2-4 team members</p>

      <div className={styles.memberList}>
        {teamMembers.map(m => {
          const isSelected = selectedIds.includes(m.id);
          return (
            <button
              key={m.id}
              className={`${styles.memberRow} ${isSelected ? styles.memberSelected : ''}`}
              onClick={() => toggleMember(m.id)}
            >
              <span className={styles.memberAvatar}>{m.avatar}</span>
              <div className={styles.memberInfo}>
                <div className={styles.memberName}>{m.name}</div>
                <div className={styles.memberRole}>{m.role}</div>
                <div className={styles.memberSpecialty}>{m.specialty}</div>
              </div>
              <span className={styles.checkmark}>{isSelected ? '✓' : ''}</span>
            </button>
          );
        })}
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.costRow}>
          <span>Agency Fee ({selectedIds.length} members):</span>
          <span className={styles.costValue}>{formatBudget(cost)}</span>
        </div>
      )}

      <button
        className={`${styles.saveBtn} ${isValid ? styles.active : ''}`}
        onClick={handleSave}
        disabled={!isValid}
      >
        {selectedIds.length < 2
          ? `Select ${2 - selectedIds.length} more`
          : selectedIds.length > 4
            ? 'Too many (max 4)'
            : 'Confirm Team'}
      </button>
    </div>
  );
}
