import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './Shortlist.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Deliverable {
  type: string;
  platform: string;
  description: string;
}

interface Campaign {
  id: string;
  player_name: string;
  agency_name?: string;
  client_name: string;
  project_name: string;
  concept_name: string;
  concept_description: string;
  deliverables: Deliverable[];
  score: number;
  stars: number;
  awards: string[];
  upvotes: number;
  created_at: string;
}

type SortKey = 'newest' | 'top' | 'unhinged';

// ─── Upvote persistence ───────────────────────────────────────────────────────

const UPVOTED_KEY = 'agencyrpg-upvoted';

function loadUpvoted(): Set<string> {
  try {
    const raw = localStorage.getItem(UPVOTED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}

function saveUpvoted(ids: Set<string>) {
  try { localStorage.setItem(UPVOTED_KEY, JSON.stringify([...ids])); } catch { /* non-fatal */ }
}

// ─── Score Badge ──────────────────────────────────────────────────────────────

function scoreTier(score: number) {
  if (score >= 90) return 'exceptional';
  if (score >= 70) return 'great';
  if (score >= 50) return 'solid';
  return 'needs_improvement';
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div className={`${styles.scoreBadge} ${styles[`tier_${scoreTier(score)}`]}`}>
      {score}
    </div>
  );
}

// ─── Campaign Modal ───────────────────────────────────────────────────────────

function CampaignModal({
  campaign,
  hasUpvoted,
  onUpvote,
  onClose,
}: {
  campaign: Campaign;
  hasUpvoted: boolean;
  onUpvote: () => void;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>

        {/* Header */}
        <div className={styles.modalHeader}>
          <ScoreBadge score={campaign.score} />
          <div className={styles.modalTitles}>
            <div className={styles.modalClient}>{campaign.client_name}</div>
            <div className={styles.modalProject}>{campaign.project_name}</div>
            <div className={styles.modalBy}>by {campaign.agency_name || `${campaign.player_name}'s Agency`}</div>
          </div>
        </div>

        {/* Awards */}
        {campaign.awards?.length > 0 && (
          <div className={styles.modalAwards}>
            {campaign.awards.map((a, i) => (
              <span key={i} className={styles.awardChip}>{a}</span>
            ))}
          </div>
        )}

        {/* Concept */}
        {(campaign.concept_name || campaign.concept_description) && (
          <div className={styles.modalSection}>
            <div className={styles.modalSectionLabel}>The Concept</div>
            {campaign.concept_name && (
              <div className={styles.modalConceptName}>"{campaign.concept_name}"</div>
            )}
            {campaign.concept_description && (
              <p className={styles.modalConceptDesc}>{campaign.concept_description}</p>
            )}
          </div>
        )}

        {/* Deliverables */}
        {campaign.deliverables?.length > 0 && (
          <div className={styles.modalSection}>
            <div className={styles.modalSectionLabel}>Deliverables</div>
            <ul className={styles.delivList}>
              {campaign.deliverables.map((d, i) => (
                <li key={i} className={styles.delivItem}>
                  <span className={styles.delivType}>{d.type}</span>
                  {d.platform && d.platform !== 'none' && (
                    <span className={styles.delivPlatform}>{d.platform}</span>
                  )}
                  {d.description && (
                    <span className={styles.delivDesc}>{d.description}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upvote */}
        <div className={styles.modalFooter}>
          <button
            className={`${styles.upvoteBtn} ${hasUpvoted ? styles.upvoteBtnVoted : ''}`}
            onClick={onUpvote}
            disabled={hasUpvoted}
            aria-label={hasUpvoted ? 'Already voted' : 'Upvote this campaign'}
          >
            {hasUpvoted ? '🔥 You voted' : `🔥 ${campaign.upvotes || 0}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({
  campaign,
  hasUpvoted,
  onUpvote,
  onSelect,
}: {
  campaign: Campaign;
  hasUpvoted: boolean;
  onUpvote: (e: React.MouseEvent) => void;
  onSelect: () => void;
}) {
  return (
    <article className={styles.card} onClick={onSelect} tabIndex={0} onKeyDown={e => e.key === 'Enter' && onSelect()}>
      <div className={styles.cardHeader}>
        <ScoreBadge score={campaign.score} />
        {campaign.awards?.length > 0 && (
          <span className={styles.cardAwardBadge} title={campaign.awards.join(', ')}>
            {campaign.awards[0].split(' ')[0]}
          </span>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardClient}>{campaign.client_name}</div>
        <div className={styles.cardProject}>{campaign.project_name}</div>
        {campaign.concept_name && (
          <div className={styles.cardConcept}>"{campaign.concept_name}"</div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.cardBy}>by {campaign.agency_name || `${campaign.player_name}'s Agency`}</span>
        <button
          className={`${styles.upvoteBtn} ${hasUpvoted ? styles.upvoteBtnVoted : ''}`}
          onClick={onUpvote}
          disabled={hasUpvoted}
          aria-label={hasUpvoted ? 'Already voted' : 'Upvote'}
        >
          🔥 {campaign.upvotes || 0}
        </button>
      </div>
    </article>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Shortlist() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sort, setSort] = useState<SortKey>('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [upvoted, setUpvoted] = useState<Set<string>>(loadUpvoted);

  // globals.css sets overflow:hidden on html/body/#root for the game — restore scroll here
  useEffect(() => {
    const els = [document.documentElement, document.body, document.getElementById('root')];
    els.forEach(el => { if (el) el.style.overflow = 'auto'; });
    return () => { els.forEach(el => { if (el) el.style.overflow = ''; }); };
  }, []);

  const fetchCampaigns = useCallback(async (sortKey: SortKey) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('campaigns').select('*');

      if (sortKey === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortKey === 'top') {
        query = query.order('score', { ascending: false });
      } else {
        query = query.order('upvotes', { ascending: false });
      }

      const { data, error: sbErr } = await query.limit(50);
      if (sbErr) throw sbErr;

      let results = (data ?? []) as Campaign[];

      if (sortKey === 'unhinged') {
        results = [...results].sort((a, b) => {
          const aRatio = (a.upvotes || 0) / Math.max(a.score, 1);
          const bRatio = (b.upvotes || 0) / Math.max(b.score, 1);
          return bRatio - aRatio;
        });
      }

      setCampaigns(results);
    } catch (err) {
      setError('Failed to load campaigns. Check your connection and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchCampaigns(sort); }, [sort, fetchCampaigns]);

  const handleUpvote = async (id: string, currentUpvotes: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (upvoted.has(id)) return;

    // Optimistic update
    const newUpvoted = new Set(upvoted);
    newUpvoted.add(id);
    setUpvoted(newUpvoted);
    saveUpvoted(newUpvoted);
    setCampaigns(prev =>
      prev.map(c => c.id === id ? { ...c, upvotes: (c.upvotes || 0) + 1 } : c)
    );
    // Keep modal in sync
    if (selected?.id === id) {
      setSelected(s => s ? { ...s, upvotes: (s.upvotes || 0) + 1 } : s);
    }

    const { error: sbErr } = await supabase
      .from('campaigns')
      .update({ upvotes: currentUpvotes + 1 })
      .eq('id', id);

    if (sbErr) {
      // Revert
      const reverted = new Set(upvoted);
      setUpvoted(reverted);
      saveUpvoted(reverted);
      setCampaigns(prev =>
        prev.map(c => c.id === id ? { ...c, upvotes: Math.max(0, c.upvotes - 1) } : c)
      );
    }
  };

  const selectedCampaign = selected ? campaigns.find(c => c.id === selected.id) ?? selected : null;

  return (
    <div className={styles.page}>
      {/* ─── Header ─────────────────────────────────────── */}
      <header className={styles.header}>
        <a href="/" className={styles.backLink}>← Play Agency RPG</a>
        <div className={styles.headerCenter}>
          <h1 className={styles.title}>📋 The Shortlist</h1>
          <p className={styles.tagline}>The best (and worst) campaigns from agencies everywhere</p>
        </div>
        <div aria-hidden="true" />
      </header>

      {/* ─── Sort Bar ───────────────────────────────────── */}
      <div className={styles.sortBar}>
        {(['newest', 'top', 'unhinged'] as SortKey[]).map(key => (
          <button
            key={key}
            className={`${styles.sortBtn} ${sort === key ? styles.sortBtnActive : ''}`}
            onClick={() => setSort(key)}
          >
            {key === 'newest' ? 'Newest' : key === 'top' ? 'Top Rated' : '🤪 Most Unhinged'}
          </button>
        ))}
      </div>

      {/* ─── Content ────────────────────────────────────── */}
      <main className={styles.main}>
        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.loadingDots}><span /><span /><span /></div>
            <p>Loading campaigns…</p>
          </div>
        )}

        {error && (
          <div className={styles.errorState}>
            <p className={styles.errorMsg}>{error}</p>
            <button className={styles.retryBtn} onClick={() => void fetchCampaigns(sort)}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && campaigns.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyEmoji}>📋</div>
            <p className={styles.emptyTitle}>Nothing on The Shortlist yet.</p>
            <p className={styles.emptyHint}>Be the first to share a campaign from the game.</p>
          </div>
        )}

        {!loading && !error && campaigns.length > 0 && (
          <>
            <p className={styles.resultCount}>{campaigns.length} campaigns</p>
            <div className={styles.grid}>
              {campaigns.map(c => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  hasUpvoted={upvoted.has(c.id)}
                  onUpvote={e => void handleUpvote(c.id, c.upvotes, e)}
                  onSelect={() => setSelected(c)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <a href="/" className={styles.footerLink}>AgencyRPG.com</a>
      </footer>

      {/* ─── Modal ──────────────────────────────────────── */}
      {selectedCampaign && (
        <CampaignModal
          campaign={selectedCampaign}
          hasUpvoted={upvoted.has(selectedCampaign.id)}
          onUpvote={() => void handleUpvote(selectedCampaign.id, selectedCampaign.upvotes)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
