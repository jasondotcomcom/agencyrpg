import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Campaign, TeamMember } from '../../../types/campaign';
import { DELIVERABLE_TYPES, PLATFORMS } from '../../../types/campaign';
import { useCampaignContext } from '../../../context/CampaignContext';
import { getTeamMembers } from '../../../data/team';
import MicroGames from '../../MicroGames/MicroGames';
import styles from './GenerationPhase.module.css';

interface GenerationPhaseProps {
  campaign: Campaign;
}

export default function GenerationPhase({ campaign }: GenerationPhaseProps): React.ReactElement {
  const { generatingProgress, retryDeliverableGeneration } = useCampaignContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const ctaRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to the mini-game CTA on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Memoize by string key so campaign re-renders don't create new array references
  // (which would trigger MicroGames' pickMember useCallback and reset the active game)
  const memberIdsKey = campaign.conceptingTeam?.memberIds.join(',') ?? '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const members = useMemo(() => memberIdsKey ? getTeamMembers(campaign.conceptingTeam!.memberIds) : [], [memberIdsKey]);

  const progress = generatingProgress || { current: 0, total: campaign.deliverables.length || 4 };
  const isComplete = progress.total > 0 && progress.current >= progress.total;

  const isRevision = campaign.deliverables.some(d => d.status === 'needs_revision');

  const progressPct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className={styles.generationPhase}>
      <div className={styles.headerCompact}>
        <span className={styles.headerIcon}>{isRevision ? '🔄' : '⚡'}</span>
        <span className={styles.headerTitle}>
          {isRevision ? 'Revising Flagged Work' : 'Your Team Is Building'}
        </span>
      </div>

      {isPlaying ? (
        <>
          <div className={styles.microGamesArea}>
            <MicroGames
              phase="generating"
              members={members}
              progress={progress}
              isComplete={isComplete}
              onSeeResults={() => {}}
            />
          </div>
          <button
            className={styles.stopPlayingButton}
            onClick={() => setIsPlaying(false)}
          >
            Stop Playing
          </button>
        </>
      ) : (
        <>
          <div className={styles.waitScreen}>
            <div className={styles.waitIcon}>⏳</div>
            <div className={styles.waitTitle}>
              {isRevision ? 'Revising deliverables...' : 'Generating deliverables...'}
            </div>
            <div className={styles.waitSubtitle}>Usually takes 2-3 minutes</div>
            <TeamActivity members={members} />

            <div className={styles.progressBarWrap}>
              <div className={styles.progressBar}>
                <div className={styles.progressBarFill} style={{ width: `${progressPct}%` }} />
              </div>
              <span className={styles.progressLabel}>
                {progress.current}/{progress.total} ready
              </span>
            </div>

            <>
              <div className={styles.ctaDivider} />

              <div className={styles.ctaSection}>
                <div className={styles.ctaPrompt}>Want to help while you wait?</div>
                <button
                  ref={ctaRef}
                  className={styles.playButton}
                  onClick={() => setIsPlaying(true)}
                >
                  🎨 HELP WITH PRODUCTION
                </button>
                <div className={styles.ctaAlt}>or just watch the team work</div>
              </div>
            </>
          </div>
        </>
      )}

      <div className={styles.deliverableList}>
        {campaign.deliverables.map((del, i) => {
          const typeInfo = DELIVERABLE_TYPES[del.type];
          const platformInfo = PLATFORMS[del.platform];
          const isCompleted = del.generatedWork !== null;
          const isFailed = del.status === 'generation_failed';
          const isActive = i === progress.current && !isCompleted && !isFailed;

          return (
            <div
              key={del.id}
              className={`${styles.deliverableRow} ${
                isCompleted ? styles.completed :
                isFailed ? styles.failed :
                isActive ? styles.active :
                styles.pending
              }`}
            >
              <span className={styles.statusIcon}>
                {isCompleted ? '✓' : isFailed ? '✗' : isActive ? '⏳' : '○'}
              </span>
              <span className={styles.deliverableInfo}>
                {typeInfo?.icon} {typeInfo?.label}
                {del.platform !== 'none' && ` — ${platformInfo?.label}`}
              </span>
              {isFailed && (
                <button
                  className={styles.retryButton}
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


// ─── What the team is up to ──────────────────────────────────────────────────
// Real people get real lines. AI3.0 seats just generate. When every seat is
// automated there's only one line left.

const HUMAN_ACTIVITY: Record<string, string[]> = {
  copywriter: ['is rewriting that headline for the third time', 'just quoted a movie nobody has seen', 'deleted everything and started over'],
  'art-director': ['says the kerning is off', 'is adjusting the blue again', 'is making a mood board'],
  strategist: ['found a relevant trend', 'is asking "but why?"', 'is checking this against three frameworks'],
  technologist: ['suggested building an app', 'is debugging something that worked five minutes ago', 'is sketching a database schema'],
  suit: ['is figuring out how to sell this', 'is translating creative into client', 'says the client will love it if we frame it right'],
  media: ['is checking which platforms make sense', 'just pulled up TikTok analytics', 'is calculating reach'],
  pm: ['is updating the timeline. Again.', 'just prevented scope creep', 'says we have 10 minutes for this'],
};

const AI_OUTPUT: Record<string, string> = {
  copywriter: 'headline',
  'art-director': 'visual',
  strategist: 'insight',
  technologist: 'build',
  suit: 'client summary',
  media: 'media plan',
  pm: 'timeline',
};

function TeamActivity({ members }: { members: TeamMember[] }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 3500);
    return () => clearInterval(t);
  }, []);
  if (members.length === 0) return null;

  const allAI = members.every(m => m.isAI);
  let line: string;
  if (allAI) {
    line = 'AI is thinking really hard about this one...';
  } else {
    const m = members[tick % members.length];
    if (m.isAI) {
      line = `Generating ${AI_OUTPUT[m.id] ?? 'content'}...`;
    } else {
      const pool = HUMAN_ACTIVITY[m.id] ?? ['is working on it'];
      line = `${m.name.split(' ')[0]} ${pool[Math.floor(tick / members.length) % pool.length]}...`;
    }
  }
  return <div className={styles.waitSubtitle} style={{ marginTop: 8, fontStyle: 'italic' }}>{line}</div>;
}
