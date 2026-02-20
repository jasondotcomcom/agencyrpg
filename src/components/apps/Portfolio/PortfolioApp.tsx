import React, { useState, useEffect } from 'react';
import { usePortfolioContext } from '../../../context/PortfolioContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import { usePlayerContext } from '../../../context/PlayerContext';
import { useWindowContext } from '../../../context/WindowContext';
import { useCampaignContext } from '../../../context/CampaignContext';
import { supabase } from '@/lib/supabase';
import type { PortfolioEntry } from '../../../context/PortfolioContext';
import { DELIVERABLE_TYPES, PLATFORMS } from '../../../types/campaign';
import type { DeliverableType, Platform } from '../../../types/campaign';
import styles from './PortfolioApp.module.css';

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<span key={i} className={styles.starFull}>★</span>);
    } else if (rating >= i - 0.5) {
      stars.push(<span key={i} className={styles.starHalf}>★</span>);
    } else {
      stars.push(<span key={i} className={styles.starEmpty}>★</span>);
    }
  }
  return <span className={styles.starRow}>{stars}</span>;
}

// ─── Score Badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score, tier }: { score: number; tier: PortfolioEntry['tier'] }) {
  return (
    <div className={`${styles.scoreBadge} ${styles[`tier_${tier}`]}`}>
      {score}
    </div>
  );
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({ entry, onClick }: { entry: PortfolioEntry; onClick: () => void }) {
  return (
    <button className={styles.card} onClick={onClick}>
      <div className={styles.cardHeader}>
        <ScoreBadge score={entry.score} tier={entry.tier} />
        {entry.award && (
          <span className={styles.cardAward} title={entry.award}>{entry.award.split(' ')[0]}</span>
        )}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardClient}>{entry.clientName}</div>
        <div className={styles.cardName}>{entry.campaignName}</div>
        {entry.conceptName && (
          <div className={styles.cardConcept}>"{entry.conceptName}"</div>
        )}
      </div>
      <div className={styles.cardFooter}>
        <StarRating rating={entry.rating} />
        <span className={styles.cardDate}>
          {new Date(entry.completedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </span>
      </div>
    </button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  entry,
  playerName,
  onClose,
  onMarkShared,
  onUnlockAchievement,
}: {
  entry: PortfolioEntry;
  playerName: string | null;
  onClose: () => void;
  onMarkShared: (id: string) => void;
  onUnlockAchievement: (id: string) => void;
}) {
  const { addNotification } = useWindowContext();
  const { getCampaign } = useCampaignContext();
  const [feedbackCopied, setFeedbackCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleCopyFeedback = () => {
    const lines: string[] = [];
    lines.push(`CAMPAIGN: ${entry.campaignName}`);
    lines.push(`CLIENT: ${entry.clientName}`);
    lines.push(`DATE: ${new Date(entry.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
    lines.push(`SCORE: ${entry.score}/100`);
    if (entry.award) lines.push(`AWARD: ${entry.award}`);

    if (entry.conceptName) {
      lines.push('');
      lines.push(`CONCEPT: "${entry.conceptName}"`);
    }
    if (entry.bigIdea) {
      lines.push('');
      lines.push(entry.bigIdea);
    }
    if (entry.conceptDescription) {
      lines.push('');
      lines.push(entry.conceptDescription);
    }

    if (entry.deliverables && entry.deliverables.length > 0) {
      lines.push('');
      lines.push('DELIVERABLES:');
      entry.deliverables.forEach(d => {
        const typeLabel = DELIVERABLE_TYPES[d.type as DeliverableType]?.label ?? d.type;
        const platformLabel = d.platform !== 'none'
          ? PLATFORMS[d.platform as Platform]?.label ?? d.platform
          : null;
        const suffix = platformLabel ? ` (${platformLabel})` : '';
        lines.push(`• ${typeLabel}${suffix}: ${d.description}`);
      });
    }

    lines.push('');
    lines.push('CLIENT FEEDBACK:');
    lines.push(`"${entry.feedback}"`);

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setFeedbackCopied(true);
      setTimeout(() => setFeedbackCopied(false), 2000);
    }).catch(() => {});
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Try to enrich with live campaign data if still in memory (same session)
      const liveCampaign = getCampaign(entry.id);
      const liveConcept = liveCampaign?.generatedConcepts?.find(
        c => c.id === liveCampaign?.selectedConceptId
      );

      const conceptName = entry.conceptName || liveConcept?.name || null;
      const conceptDescription = entry.bigIdea || entry.conceptDescription
        || liveConcept?.bigIdea || liveConcept?.whyItWorks || null;

      let deliverables = entry.deliverables;
      if (!deliverables || deliverables.length === 0) {
        deliverables = liveCampaign?.deliverables
          .filter(d => d.status === 'approved' || d.generatedWork !== null)
          .map(d => ({ type: d.type, platform: d.platform, description: d.description }));
      }

      const payload = {
        player_name:         playerName ?? localStorage.getItem('agencyrpg-player-name') ?? 'Anonymous',
        client_name:         entry.clientName,
        project_name:        entry.campaignName,
        concept_name:        conceptName,
        concept_description: conceptDescription,
        deliverables:        deliverables ?? [],
        score:               entry.score,
        stars:               Math.round(Number(entry.rating)) || 0,
        awards:              entry.award ? [entry.award] : [],
      };

      console.log('Sharing campaign data:', payload);
      console.log('Type checks:', {
        player_name_type: typeof payload.player_name,
        score_type: typeof payload.score,
        stars_type: typeof payload.stars,
        deliverables_isArray: Array.isArray(payload.deliverables),
        awards_isArray: Array.isArray(payload.awards),
        required_nulls: {
          player_name: payload.player_name == null,
          client_name: payload.client_name == null,
          project_name: payload.project_name == null,
          concept_name: payload.concept_name == null,
          score: payload.score == null,
        },
      });

      const { data, error } = await supabase
        .from('campaigns')
        .insert([payload]);

      console.log('Supabase response:', { data, error });
      if (error) console.error('Supabase error:', error);
      if (error) throw error;

      onMarkShared(entry.id);
      onUnlockAchievement('shared-campaign');
      addNotification('📋 Added to The Shortlist', `${entry.campaignName} is now live on The Shortlist.`);
    } catch {
      addNotification('Share failed', 'Could not share campaign. Try again later.');
    }
    setIsSharing(false);
  };

  const tierLabel: Record<PortfolioEntry['tier'], string> = {
    exceptional: 'Exceptional',
    great: 'Great',
    solid: 'Solid',
    needs_improvement: 'Needs Improvement',
  };

  return (
    <div className={styles.detailOverlay} onClick={onClose}>
      <div className={styles.detailPanel} onClick={e => e.stopPropagation()}>
        <button className={styles.detailClose} onClick={onClose}>✕</button>

        <div className={styles.detailHeader}>
          <ScoreBadge score={entry.score} tier={entry.tier} />
          <div className={styles.detailTitles}>
            <div className={styles.detailClient}>{entry.clientName}</div>
            <div className={styles.detailName}>{entry.campaignName}</div>
          </div>
        </div>

        {entry.award && (
          <div className={styles.detailAwardBanner}>
            <span className={styles.detailAwardText}>{entry.award}</span>
          </div>
        )}

        <div className={styles.detailMeta}>
          <div className={styles.detailMetaRow}>
            <span className={styles.detailMetaLabel}>Rating</span>
            <StarRating rating={entry.rating} />
          </div>
          <div className={styles.detailMetaRow}>
            <span className={styles.detailMetaLabel}>Score Tier</span>
            <span className={`${styles.detailTierChip} ${styles[`tier_${entry.tier}`]}`}>
              {tierLabel[entry.tier]}
            </span>
          </div>
          {entry.conceptName && (
            <div className={styles.detailMetaRow}>
              <span className={styles.detailMetaLabel}>Direction</span>
              <span className={styles.detailMetaValue}>"{entry.conceptName}"</span>
            </div>
          )}
          <div className={styles.detailMetaRow}>
            <span className={styles.detailMetaLabel}>Team Fee</span>
            <span className={styles.detailMetaValue}>
              ${entry.teamFee.toLocaleString()}
              {entry.wasUnderBudget && <span className={styles.underBudgetBadge}> under budget ✓</span>}
            </span>
          </div>
          <div className={styles.detailMetaRow}>
            <span className={styles.detailMetaLabel}>Completed</span>
            <span className={styles.detailMetaValue}>
              {new Date(entry.completedAt).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {(entry.conceptName || entry.bigIdea || entry.conceptDescription) && (
          <div className={styles.detailConceptWrap}>
            <div className={styles.detailMetaLabel}>The Concept</div>
            {entry.conceptName && (
              <div className={styles.detailConceptName}>"{entry.conceptName}"</div>
            )}
            {entry.bigIdea && (
              <p className={styles.detailBigIdea}>{entry.bigIdea}</p>
            )}
            {entry.conceptDescription && (
              <p className={styles.detailConceptDesc}>{entry.conceptDescription}</p>
            )}
          </div>
        )}

        {entry.deliverables && entry.deliverables.length > 0 && (
          <div className={styles.detailDeliverablesWrap}>
            <div className={styles.detailMetaLabel}>Deliverables</div>
            <ul className={styles.deliverablesList}>
              {entry.deliverables.map((d, i) => {
                const typeInfo = DELIVERABLE_TYPES[d.type as DeliverableType];
                const platformInfo = PLATFORMS[d.platform as Platform];
                return (
                  <li key={i} className={styles.deliverableItem}>
                    <span className={styles.deliverableIcon}>{typeInfo?.icon ?? '📦'}</span>
                    <div className={styles.deliverableDetails}>
                      <div className={styles.deliverableTypeRow}>
                        <span className={styles.deliverableType}>{typeInfo?.label ?? d.type}</span>
                        {d.platform !== 'none' && (
                          <span className={styles.deliverablePlatform}>{platformInfo?.label ?? d.platform}</span>
                        )}
                      </div>
                      {d.description && (
                        <span className={styles.deliverableDesc}>{d.description}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className={styles.detailFeedbackWrap}>
          <blockquote className={styles.detailFeedback}>
            "{entry.feedback}"
            <cite className={styles.detailFeedbackCite}>— {entry.clientName}</cite>
          </blockquote>
          <div className={styles.detailActions}>
            <button
              className={`${styles.copyFeedbackButton} ${feedbackCopied ? styles.copyFeedbackButtonCopied : ''}`}
              onClick={handleCopyFeedback}
              aria-label="Copy all campaign details to clipboard"
            >
              {feedbackCopied ? '✓ Copied' : '⎘ Copy all details'}
            </button>
            <button
              className={`${styles.shareHubButton} ${entry.shared ? styles.shareHubButtonDone : ''}`}
              onClick={handleShare}
              disabled={!!entry.shared || isSharing}
              aria-label="Share campaign to The Shortlist"
            >
              {entry.shared ? '✓ Shared to Shortlist' : isSharing ? 'Sharing...' : '🌐 Share to Shortlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyPortfolio() {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyEmoji}>🗂️</div>
      <div className={styles.emptyTitle}>Nothing here yet</div>
      <div className={styles.emptySubtitle}>
        Complete your first campaign to start building your portfolio.
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ entries }: { entries: PortfolioEntry[] }) {
  if (entries.length === 0) return null;

  const avgScore = Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length);
  const awards = entries.filter(e => e.award).length;
  const topWork = entries.filter(e => e.tier === 'exceptional' || e.tier === 'great').length;
  const totalRevenue = entries.reduce((s, e) => s + e.teamFee, 0);

  return (
    <div className={styles.statsBar}>
      <div className={styles.statItem}>
        <span className={styles.statValue}>{entries.length}</span>
        <span className={styles.statLabel}>Campaigns</span>
      </div>
      <div className={styles.statDivider} />
      <div className={styles.statItem}>
        <span className={styles.statValue}>{avgScore}</span>
        <span className={styles.statLabel}>Avg Score</span>
      </div>
      <div className={styles.statDivider} />
      <div className={styles.statItem}>
        <span className={styles.statValue}>{topWork}</span>
        <span className={styles.statLabel}>Top Work</span>
      </div>
      <div className={styles.statDivider} />
      <div className={styles.statItem}>
        <span className={styles.statValue}>{awards}</span>
        <span className={styles.statLabel}>Awards</span>
      </div>
      <div className={styles.statDivider} />
      <div className={styles.statItem}>
        <span className={styles.statValue}>${(totalRevenue / 1000).toFixed(0)}k</span>
        <span className={styles.statLabel}>Revenue</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type SortKey = 'newest' | 'score' | 'client';

export default function PortfolioApp(): React.ReactElement {
  const { entries, markShared, enrichEntry } = usePortfolioContext();
  const { unlockAchievement } = useAchievementContext();
  const { playerName } = usePlayerContext();
  const { getCampaign } = useCampaignContext();
  const [selected, setSelected] = useState<PortfolioEntry | null>(null);
  const [sort, setSort] = useState<SortKey>('newest');

  // Unlock "Ambitious" achievement if portfolio is empty on first open
  useEffect(() => {
    if (entries.length === 0) unlockAchievement('checked-portfolio-empty');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Enrich old portfolio entries from live campaign data (same session only)
  useEffect(() => {
    entries.forEach(entry => {
      if (entry.bigIdea && entry.deliverables && entry.deliverables.length > 0) return; // already complete
      const liveCampaign = getCampaign(entry.id);
      if (!liveCampaign) return;
      const liveConcept = liveCampaign.generatedConcepts.find(
        c => c.id === liveCampaign.selectedConceptId
      );
      const updates: Partial<PortfolioEntry> = {};
      if (!entry.bigIdea && liveConcept?.bigIdea) updates.bigIdea = liveConcept.bigIdea;
      if (!entry.conceptDescription && liveConcept?.whyItWorks) updates.conceptDescription = liveConcept.whyItWorks;
      if (!entry.conceptName && liveConcept?.name) updates.conceptName = liveConcept.name;
      if ((!entry.deliverables || entry.deliverables.length === 0) && liveCampaign.deliverables.length > 0) {
        updates.deliverables = liveCampaign.deliverables
          .filter(d => d.status === 'approved' || d.generatedWork !== null)
          .map(d => ({ type: d.type, platform: d.platform, description: d.description }));
      }
      if (Object.keys(updates).length > 0) enrichEntry(entry.id, updates);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep selected entry in sync with portfolio (e.g. after markShared updates it)
  const selectedEntry = selected ? (entries.find(e => e.id === selected.id) ?? selected) : null;

  const sorted = [...entries].sort((a, b) => {
    if (sort === 'score') return b.score - a.score;
    if (sort === 'client') return a.clientName.localeCompare(b.clientName);
    return b.completedAt - a.completedAt; // newest
  });

  const headerTitle = playerName ? `${playerName}'s Portfolio` : 'Portfolio';

  return (
    <div className={styles.app}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.headerEmoji}>🗂️</span>
          <span>{headerTitle}</span>
        </div>
        {entries.length > 0 && (
          <div className={styles.sortControls}>
            {(['newest', 'score', 'client'] as SortKey[]).map(key => (
              <button
                key={key}
                className={`${styles.sortBtn} ${sort === key ? styles.sortActive : ''}`}
                onClick={() => setSort(key)}
              >
                {key === 'newest' ? 'Newest' : key === 'score' ? 'Score' : 'Client'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <StatsBar entries={entries} />

      {/* Grid */}
      <div className={styles.scrollArea}>
        {entries.length === 0 ? (
          <EmptyPortfolio />
        ) : (
          <div className={styles.grid}>
            {sorted.map(entry => (
              <CampaignCard
                key={entry.id}
                entry={entry}
                onClick={() => setSelected(entry)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail overlay */}
      {selectedEntry && (
        <DetailPanel
          entry={selectedEntry}
          playerName={playerName}
          onClose={() => setSelected(null)}
          onMarkShared={markShared}
          onUnlockAchievement={unlockAchievement}
        />
      )}
    </div>
  );
}
