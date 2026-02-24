import { useState, useMemo } from 'react';
import type { Campaign } from '../../../../types/campaign';
import { DELIVERABLE_TYPES, PLATFORMS } from '../../../../types/campaign';
import { useCampaignContext } from '../../../../context/CampaignContext';
import { useChatContext } from '../../../../context/ChatContext';
import { useAchievementContext } from '../../../../context/AchievementContext';
import styles from './ConceptsCard.module.css';

const CONCEPT_COLORS = ['#a8e6cf', '#a8d8ea', '#c3aed6', '#f9e79f', '#ffb7b2'];

const BUILD_LABELS = [
  '🚀 This is the winner',
  '🚀 Let\'s build this',
  '🚀 Ship it',
  '🚀 Lock it in',
];

interface ConceptsCardProps {
  campaign: Campaign;
}

export default function ConceptsCard({ campaign }: ConceptsCardProps) {
  const { selectConcept, generateCampaignDeliverables, generateConcepts, tweakConcept, isGeneratingConcepts } = useCampaignContext();
  const { triggerCampaignEvent } = useChatContext();
  const { unlockAchievement, incrementCounter } = useAchievementContext();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRevise, setShowRevise] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [tweakId, setTweakId] = useState<string | null>(null);
  const [tweakNote, setTweakNote] = useState('');
  const [isTweaking, setIsTweaking] = useState(false);

  const buildLabel = useMemo(
    () => BUILD_LABELS[Math.floor(Math.random() * BUILD_LABELS.length)], []
  );

  const selectedId = campaign.selectedConceptId;
  const concepts = campaign.generatedConcepts;
  const selectedConcept = concepts.find(c => c.id === selectedId);

  const handleSelect = (id: string) => selectConcept(campaign.id, id);

  const handleBuild = () => {
    if (!selectedId || !selectedConcept) return;
    if (concepts.length > 0 && selectedId === concepts[0].id) {
      unlockAchievement('first-thought');
    }
    setShowConfirm(true);
  };

  const handleConfirmGenerate = () => {
    setShowConfirm(false);
    const chosen = concepts.find(c => c.id === selectedId);
    const delTypes = chosen?.suggestedDeliverables.map(d => DELIVERABLE_TYPES[d.type]?.label).filter(Boolean) ?? [];
    const delDescs = chosen?.suggestedDeliverables.map(d => d.description).filter(Boolean) ?? [];
    triggerCampaignEvent('CONCEPT_CHOSEN', {
      campaignName: campaign.campaignName,
      clientName: campaign.clientName,
      assignedTeamIds: campaign.conceptingTeam?.memberIds ?? [],
      conceptName: chosen?.name,
      conceptTagline: chosen?.tagline,
      deliverableTypes: delTypes,
      deliverableDescriptions: delDescs,
    });
    generateCampaignDeliverables(campaign.id);
    setTimeout(() => {
      triggerCampaignEvent('DELIVERABLES_GENERATING', {
        campaignName: campaign.campaignName,
        clientName: campaign.clientName,
        assignedTeamIds: campaign.conceptingTeam?.memberIds ?? [],
        conceptName: chosen?.name,
        conceptTagline: chosen?.tagline,
        deliverableTypes: delTypes,
        deliverableDescriptions: delDescs,
      });
    }, 8000);
  };

  const handleTweak = async () => {
    if (!tweakId || !tweakNote.trim() || isTweaking) return;
    setIsTweaking(true);
    unlockAchievement('tweaker');
    await tweakConcept(campaign.id, tweakId, tweakNote.trim());
    setTweakId(null);
    setTweakNote('');
    setIsTweaking(false);
  };

  const handleRevise = async () => {
    if (!revisionFeedback.trim()) return;
    setShowRevise(false);
    const newCount = incrementCounter(`regen-${campaign.id}`);
    if (newCount >= 3) unlockAchievement('perfectionist-concepts');
    await generateConcepts(campaign.id);
    setRevisionFeedback('');
  };

  if (concepts.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>💡</span>
          <p>Concepts will appear here after you generate them from the Direction step.</p>
        </div>
      </div>
    );
  }

  // Confirmation panel
  if (showConfirm && selectedConcept) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Confirm Build</h3>
        <div className={styles.confirmConcept}>
          <strong>"{selectedConcept.name}"</strong>
          <p className={styles.confirmTagline}>{selectedConcept.tagline}</p>
        </div>
        <div className={styles.confirmDeliverables}>
          <span className={styles.confirmLabel}>Deliverables to generate:</span>
          {selectedConcept.suggestedDeliverables.map((d, i) => (
            <div key={i} className={styles.confirmRow}>
              {DELIVERABLE_TYPES[d.type]?.icon} {d.quantity}x {DELIVERABLE_TYPES[d.type]?.label}
              {d.platform !== 'none' && ` (${PLATFORMS[d.platform]?.label})`}
            </div>
          ))}
        </div>
        <div className={styles.confirmActions}>
          <button className={styles.backBtn} onClick={() => setShowConfirm(false)}>← Back</button>
          <button className={styles.confirmBtn} onClick={handleConfirmGenerate}>
            🚀 Generate Campaign
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>💡 Choose a Concept</h3>

      {/* Tweak modal */}
      {tweakId && (
        <div className={styles.tweakPanel}>
          <h4 className={styles.tweakTitle}>✏️ Tweak Concept</h4>
          <textarea
            className={styles.tweakInput}
            value={tweakNote}
            onChange={(e) => setTweakNote(e.target.value)}
            placeholder="e.g., Make the tagline present tense"
            rows={3}
          />
          <div className={styles.tweakActions}>
            <button className={styles.cancelBtn} onClick={() => { setTweakId(null); setTweakNote(''); }}>Cancel</button>
            <button
              className={`${styles.tweakBtn} ${tweakNote.trim() ? styles.active : ''}`}
              onClick={handleTweak}
              disabled={!tweakNote.trim() || isTweaking}
            >
              {isTweaking ? 'Tweaking...' : 'Apply Tweak'}
            </button>
          </div>
        </div>
      )}

      {/* Revise modal */}
      {showRevise && (
        <div className={styles.tweakPanel}>
          <h4 className={styles.tweakTitle}>🔄 Revise All Concepts</h4>
          <textarea
            className={styles.tweakInput}
            value={revisionFeedback}
            onChange={(e) => setRevisionFeedback(e.target.value)}
            placeholder="e.g., More playful, less serious"
            rows={3}
          />
          <div className={styles.tweakActions}>
            <button className={styles.cancelBtn} onClick={() => { setShowRevise(false); setRevisionFeedback(''); }}>Cancel</button>
            <button
              className={`${styles.tweakBtn} ${revisionFeedback.trim() ? styles.active : ''}`}
              onClick={handleRevise}
              disabled={!revisionFeedback.trim() || isGeneratingConcepts}
            >
              Regenerate
            </button>
          </div>
        </div>
      )}

      {/* Concept cards */}
      <div className={styles.conceptList}>
        {concepts.map((concept, i) => {
          const color = CONCEPT_COLORS[i % CONCEPT_COLORS.length];
          const isSelected = concept.id === selectedId;
          const isExpanded = concept.id === expandedId;

          return (
            <div
              key={concept.id}
              className={`${styles.conceptCard} ${isSelected ? styles.selected : ''}`}
              style={{ borderLeftColor: color }}
            >
              <button
                className={styles.conceptHeader}
                onClick={() => handleSelect(concept.id)}
              >
                <span className={styles.radio}>{isSelected ? '●' : '○'}</span>
                <div className={styles.conceptInfo}>
                  <span className={styles.conceptName}>
                    {concept.name}
                    {concept.isTweaked && <span className={styles.tweakedBadge}>✨ TWEAKED</span>}
                  </span>
                  <span className={styles.conceptTagline}>{concept.tagline}</span>
                </div>
              </button>

              <div className={styles.conceptBody}>
                <p className={styles.bigIdea}>"{concept.bigIdea}"</p>
                <div className={styles.channels}>
                  {concept.recommendedChannels.map(ch => (
                    <span key={ch} className={styles.channelBadge}>{ch}</span>
                  ))}
                </div>
              </div>

              <div className={styles.conceptActions}>
                <button
                  className={styles.detailsToggle}
                  onClick={() => setExpandedId(isExpanded ? null : concept.id)}
                >
                  {isExpanded ? 'Less' : 'More details'}
                </button>
                <button
                  className={styles.tweakTrigger}
                  onClick={() => { setTweakId(concept.id); setTweakNote(''); }}
                  disabled={isTweaking || isGeneratingConcepts}
                >
                  ✏️ Tweak
                </button>
              </div>

              {isExpanded && (
                <div className={styles.expandedDetails}>
                  {concept.tone && <p><strong>Tone:</strong> {concept.tone}</p>}
                  {concept.whyItWorks && <p><strong>Why it works:</strong> {concept.whyItWorks}</p>}
                  {concept.suggestedDeliverables.length > 0 && (
                    <div>
                      <strong>Suggested deliverables:</strong>
                      {concept.suggestedDeliverables.map((d, di) => (
                        <div key={di} className={styles.suggestedDel}>
                          {DELIVERABLE_TYPES[d.type]?.icon} {d.quantity}x {DELIVERABLE_TYPES[d.type]?.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className={styles.bottomActions}>
        <button className={styles.reviseBtn} onClick={() => setShowRevise(true)}>
          🔄 Revise Concepts
        </button>
        {selectedId && (
          <button className={styles.buildBtn} onClick={handleBuild}>
            {buildLabel}
          </button>
        )}
      </div>
    </div>
  );
}
