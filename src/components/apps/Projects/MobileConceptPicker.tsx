import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { Campaign, CampaignConcept } from '../../../types/campaign';
import { DELIVERABLE_TYPES, PLATFORMS } from '../../../types/campaign';
import { useCampaignContext } from '../../../context/CampaignContext';
import { useChatContext } from '../../../context/ChatContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import styles from './MobileConceptPicker.module.css';

interface MobileConceptPickerProps {
  campaign: Campaign;
}

const COLORS = [
  { bg: 'rgba(168, 230, 207, 0.15)', accent: '#5a9a7a' },
  { bg: 'rgba(168, 216, 234, 0.15)', accent: '#5a8a9a' },
  { bg: 'rgba(195, 174, 214, 0.15)', accent: '#7a5a9a' },
  { bg: 'rgba(249, 231, 159, 0.15)', accent: '#9a8a3a' },
  { bg: 'rgba(255, 183, 178, 0.15)', accent: '#9a5a5a' },
];

export default function MobileConceptPicker({ campaign }: MobileConceptPickerProps): React.ReactElement {
  const { selectConcept, generateCampaignDeliverables, generateConcepts, tweakConcept, isGeneratingConcepts } = useCampaignContext();
  const { triggerCampaignEvent } = useChatContext();
  const { unlockAchievement, incrementCounter } = useAchievementContext();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTweak, setShowTweak] = useState(false);
  const [tweakNote, setTweakNote] = useState('');
  const [tweakingId, setTweakingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const concepts = campaign.generatedConcepts;
  const selectedId = campaign.selectedConceptId;
  const current = concepts[currentIndex];
  const color = COLORS[currentIndex % COLORS.length];

  const goTo = useCallback((idx: number) => {
    setSlideDir(idx > currentIndex ? 'left' : 'right');
    setCurrentIndex(idx);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < concepts.length - 1) goTo(currentIndex + 1);
  }, [currentIndex, concepts.length, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  // Touch swipe
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  const handleSelect = () => {
    if (current) selectConcept(campaign.id, current.id);
  };

  const handleBuild = () => {
    if (!selectedId) return;
    if (concepts.length > 0 && selectedId === concepts[0].id) {
      unlockAchievement('first-thought');
    }
    setShowConfirm(true);
  };

  const handleConfirmGenerate = () => {
    setShowConfirm(false);
    const chosenConcept = concepts.find(c => c.id === selectedId);
    const delTypes = chosenConcept?.suggestedDeliverables.map(d => DELIVERABLE_TYPES[d.type]?.label).filter(Boolean) ?? [];
    const delDescs = chosenConcept?.suggestedDeliverables.map(d => d.description).filter(Boolean) ?? [];
    triggerCampaignEvent('CONCEPT_CHOSEN', {
      campaignName: campaign.campaignName,
      clientName: campaign.clientName,
      assignedTeamIds: campaign.conceptingTeam?.memberIds ?? [],
      conceptName: chosenConcept?.name,
      conceptTagline: chosenConcept?.tagline,
      deliverableTypes: delTypes,
      deliverableDescriptions: delDescs,
    });
    generateCampaignDeliverables(campaign.id);
    setTimeout(() => {
      triggerCampaignEvent('DELIVERABLES_GENERATING', {
        campaignName: campaign.campaignName,
        clientName: campaign.clientName,
        assignedTeamIds: campaign.conceptingTeam?.memberIds ?? [],
        conceptName: chosenConcept?.name,
        conceptTagline: chosenConcept?.tagline,
        deliverableTypes: delTypes,
        deliverableDescriptions: delDescs,
      });
    }, 8000);
  };

  const handleRevise = async () => {
    const newCount = incrementCounter(`regen-${campaign.id}`);
    if (newCount >= 3) unlockAchievement('perfectionist-concepts');
    await generateConcepts(campaign.id);
  };

  const handleApplyTweak = async () => {
    if (!tweakNote.trim() || !current) return;
    const conceptId = current.id;
    setShowTweak(false);
    setTweakNote('');
    setTweakingId(conceptId);
    try {
      await tweakConcept(campaign.id, conceptId, tweakNote.trim());
      unlockAchievement('tweaker');
    } finally {
      setTweakingId(null);
    }
  };

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, [currentIndex]);

  if (!current) return <div />;

  const isSelected = current.id === selectedId;
  const selectedConcept = concepts.find(c => c.id === selectedId);

  return (
    <div className={styles.flow}>
      {/* Progress dots */}
      <div className={styles.progressBar}>
        <span className={styles.progressLabel}>
          {currentIndex + 1} of {concepts.length}
        </span>
        <div className={styles.dots}>
          {concepts.map((c, i) => (
            <button
              key={c.id}
              className={`${styles.dot} ${i === currentIndex ? styles.active : ''} ${c.id === selectedId ? styles.chosen : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>

      {/* Card */}
      <div
        ref={containerRef}
        className={styles.cardContainer}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {showConfirm && selectedConcept ? (
          <div className={styles.card} key="confirm">
            <div className={styles.cardContent}>
              <div className={styles.cardIcon}>🚀</div>
              <h2 className={styles.cardTitle}>Ready to Build</h2>
              <p className={styles.cardSubtitle}>"{selectedConcept.name}"</p>

              <div className={styles.confirmList}>
                {selectedConcept.suggestedDeliverables.map((del, i) => (
                  <div key={i} className={styles.confirmItem}>
                    <span>{DELIVERABLE_TYPES[del.type]?.icon}</span>
                    <span>
                      {del.quantity}x {DELIVERABLE_TYPES[del.type]?.label}
                      {del.platform !== 'none' && ` (${PLATFORMS[del.platform]?.label})`}
                    </span>
                  </div>
                ))}
              </div>

              <p className={styles.confirmNote}>
                Uses Claude (text) + DALL-E (images)
              </p>
            </div>
          </div>
        ) : (
          <div className={`${styles.card} ${styles[`slide${slideDir === 'left' ? 'Left' : 'Right'}`]}`} key={current.id}>
            <div className={styles.cardContent} style={{ '--card-bg': color.bg } as React.CSSProperties}>
              <div className={styles.conceptHeader}>
                <h2 className={styles.conceptName}>{current.name}</h2>
                <p className={styles.conceptTagline}>"{current.tagline}"</p>
                {current.isTweaked && <span className={styles.tweakedBadge}>TWEAKED</span>}
              </div>

              <div className={styles.bigIdea}>
                <span className={styles.ideaLabel}>Big Idea</span>
                <p className={styles.ideaText}>{current.bigIdea}</p>
              </div>

              <div className={styles.channels}>
                {current.recommendedChannels.map(ch => (
                  <span key={ch} className={styles.channelBadge}>
                    {PLATFORMS[ch as keyof typeof PLATFORMS]?.icon || '📍'} {ch}
                  </span>
                ))}
              </div>

              <div className={styles.detailSection}>
                <span className={styles.detailLabel}>Tone</span>
                <span className={styles.detailValue}>{current.tone}</span>
              </div>

              <div className={styles.detailSection}>
                <span className={styles.detailLabel}>Why It Works</span>
                <p className={styles.detailText}>{current.whyItWorks}</p>
              </div>

              <div className={styles.detailSection}>
                <span className={styles.detailLabel}>Deliverables</span>
                <div className={styles.delList}>
                  {current.suggestedDeliverables.map((del, i) => (
                    <span key={i} className={styles.delItem}>
                      {DELIVERABLE_TYPES[del.type]?.icon} {del.quantity}x {DELIVERABLE_TYPES[del.type]?.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className={styles.bottomNav}>
        {showConfirm ? (
          <>
            <button className={styles.backBtn} onClick={() => setShowConfirm(false)}>
              ← Back
            </button>
            <button className={styles.ctaButton} onClick={handleConfirmGenerate}>
              🚀 Generate Campaign
            </button>
          </>
        ) : (
          <>
            <div className={styles.actionRow}>
              <button
                className={styles.tweakBtn}
                onClick={() => setShowTweak(true)}
                disabled={tweakingId !== null || isGeneratingConcepts}
              >
                {tweakingId === current.id ? '⏳' : '✏️'}
              </button>
              <button
                className={`${styles.selectBtn} ${isSelected ? styles.selectedBtn : ''}`}
                onClick={handleSelect}
              >
                {isSelected ? '✓ Selected' : 'Choose This'}
              </button>
              <button
                className={styles.reviseBtn}
                onClick={handleRevise}
                disabled={isGeneratingConcepts}
              >
                {isGeneratingConcepts ? '⏳' : '🔄'}
              </button>
            </div>
            {selectedId && (
              <button className={styles.ctaButton} onClick={handleBuild}>
                🚀 Build "{selectedConcept?.name}"
              </button>
            )}
          </>
        )}
      </div>

      {/* Tweak modal */}
      {showTweak && (
        <div className={styles.modalOverlay} onClick={() => setShowTweak(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>✏️ Tweak: {current.name}</h3>
              <button className={styles.closeBtn} onClick={() => setShowTweak(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p>What needs to change?</p>
              <textarea
                className={styles.tweakInput}
                value={tweakNote}
                onChange={e => setTweakNote(e.target.value)}
                placeholder='e.g., "Make the tagline present tense" or "Swap the video for a TikTok series"'
                rows={4}
                autoFocus
              />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowTweak(false)}>Cancel</button>
              <button
                className={`${styles.applyBtn} ${tweakNote.trim() ? styles.applyActive : ''}`}
                onClick={handleApplyTweak}
                disabled={!tweakNote.trim()}
              >
                Apply Tweak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
