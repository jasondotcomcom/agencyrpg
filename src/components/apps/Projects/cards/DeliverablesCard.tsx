import { useState, useMemo } from 'react';
import type { Campaign } from '../../../../types/campaign';
import { DELIVERABLE_TYPES, PLATFORMS } from '../../../../types/campaign';
import { useCampaignContext } from '../../../../context/CampaignContext';
import { getTeamMembers } from '../../../../data/team';
import MicroGames from '../../../MicroGames/MicroGames';
import FullscreenGameWrapper from '../../../MicroGames/FullscreenGameWrapper';
import { useDeviceMode } from '../../../../utils/deviceDetection';
import styles from './DeliverablesCard.module.css';

interface DeliverablesCardProps {
  campaign: Campaign;
}

export default function DeliverablesCard({ campaign }: DeliverablesCardProps) {
  const { generatingProgress, retryDeliverableGeneration } = useCampaignContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const deviceMode = useDeviceMode();

  const memberIdsKey = campaign.conceptingTeam?.memberIds.join(',') ?? '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const members = useMemo(() => memberIdsKey ? getTeamMembers(campaign.conceptingTeam!.memberIds) : [], [memberIdsKey]);

  const progress = generatingProgress || { current: 0, total: campaign.deliverables.length || 4 };
  const isComplete = progress.total > 0 && progress.current >= progress.total;
  const progressPct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const isRevision = campaign.deliverables.some(d => d.status === 'needs_revision');

  if (campaign.deliverables.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>⚡</span>
          <p>Deliverables will be generated after you select a concept and confirm.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>{isRevision ? '🔄' : '⚡'}</span>
        <span className={styles.headerTitle}>
          {isComplete ? 'All Ready!' : isRevision ? 'Revising Flagged Work' : 'Your Team Is Building'}
        </span>
      </div>

      {!isComplete && (
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
          <span className={styles.progressLabel}>{progress.current}/{progress.total} ready</span>
        </div>
      )}

      {!isComplete && !isPlaying && (
        <div className={styles.ctaSection}>
          <button className={styles.playCta} onClick={() => setIsPlaying(true)}>
            🎨 HELP WITH PRODUCTION
          </button>
          <span className={styles.ctaAlt}>or just watch the team work</span>
        </div>
      )}

      {isPlaying && (
        deviceMode === 'phone' ? (
          <FullscreenGameWrapper onClose={() => setIsPlaying(false)}>
            <MicroGames
              phase="generating"
              members={members}
              progress={progress}
              isComplete={isComplete}
              onSeeResults={() => {}}
              fullscreen
            />
          </FullscreenGameWrapper>
        ) : (
          <>
            <MicroGames
              phase="generating"
              members={members}
              progress={progress}
              isComplete={isComplete}
              onSeeResults={() => {}}
            />
            <button className={styles.stopBtn} onClick={() => setIsPlaying(false)}>
              Stop Playing
            </button>
          </>
        )
      )}

      <div className={styles.deliverableList}>
        {campaign.deliverables.map((del, i) => {
          const typeInfo = DELIVERABLE_TYPES[del.type];
          const platformInfo = PLATFORMS[del.platform];
          const isDone = del.generatedWork !== null;
          const isFailed = del.status === 'generation_failed';
          const isActive = i === progress.current && !isDone && !isFailed;

          return (
            <div
              key={del.id}
              className={`${styles.delRow} ${isDone ? styles.done : isFailed ? styles.failed : isActive ? styles.active : ''}`}
            >
              <span className={styles.statusIcon}>
                {isDone ? '✓' : isFailed ? '✗' : isActive ? '⏳' : '○'}
              </span>
              <span className={styles.delInfo}>
                {typeInfo?.icon} {typeInfo?.label}
                {del.platform !== 'none' && ` — ${platformInfo?.label}`}
              </span>
              {isFailed && (
                <button
                  className={styles.retryBtn}
                  onClick={() => retryDeliverableGeneration(campaign.id, del.id)}
                >
                  Retry
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
