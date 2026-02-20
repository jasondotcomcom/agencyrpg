import React, { useState } from 'react';
import { useCampaignContext } from '../../../context/CampaignContext';
import { useWindowContext } from '../../../context/WindowContext';
import { useReputationContext } from '../../../context/ReputationContext';
import { useEmailContext } from '../../../context/EmailContext';
import type { CampaignScore } from '../../../types/reputation';
import { useAgencyFunds } from '../../../context/AgencyFundsContext';
import { useChatContext } from '../../../context/ChatContext';
import CampaignHeader from './CampaignHeader';
import BriefSection from './BriefSection';
import ConceptingPhase from './ConceptingPhase';
import ConceptSelectionPhase from './ConceptSelectionPhase';
import GenerationPhase from './GenerationPhase';
import ReviewMeeting from './ReviewMeeting';
import DeliverableList from './DeliverableList';
import CampaignResults from './CampaignResults';
import { generateBonusEmail } from '../../../utils/bonusEmailGenerator';
import { usePortfolioContext } from '../../../context/PortfolioContext';
import { checkForAwards } from '../../../data/awards';
import { useEndingContext } from '../../../context/EndingContext';
import CampaignToolsPanel from './CampaignToolsPanel';
import { useCheatContext } from '../../../context/CheatContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import styles from './CampaignWorkspace.module.css';

// ─── Nightmare Mode Feedback Pool ─────────────────────────────────────────────

const NIGHTMARE_FEEDBACKS = [
  "It's fine. But can we make it more... you know? Just... more.",
  "We love the direction! Now can we change everything?",
  "The vibe is almost there. It just needs to be less like itself.",
  "Our CEO showed it to his wife. She had some thoughts.",
  "We like where this is going. Which is somewhere completely different.",
  "Great work. Can we see fifteen other versions?",
];

interface CampaignWorkspaceProps {
  campaignId: string;
}

export default function CampaignWorkspace({ campaignId }: CampaignWorkspaceProps): React.ReactElement {
  const { getCampaign, canSubmitCampaign, submitCampaign, completeCampaign, campaigns } = useCampaignContext();
  const { addNotification } = useWindowContext();
  const { submitCampaign: submitToReputation, processPendingEvents, addReputation, subtractReputation, state: repState } = useReputationContext();
  const { addEmail } = useEmailContext();
  const { addProfit } = useAgencyFunds();
  const { triggerCampaignEvent } = useChatContext();
  const { addEntry, attachAward } = usePortfolioContext();
  const { checkForEnding, checkForHostileTakeover } = useEndingContext();
  const { cheat, consumeOneTimeBonus } = useCheatContext();
  const { unlockAchievement } = useAchievementContext();
  const campaign = getCampaign(campaignId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [campaignScore, setCampaignScore] = useState<CampaignScore | null>(null);

  if (!campaign) {
    return (
      <div className={styles.notFound}>
        <span className={styles.notFoundIcon}>🔍</span>
        <p>Campaign not found</p>
      </div>
    );
  }

  const canSubmit = canSubmitCampaign(campaignId);
  const isSubmitted = campaign.phase === 'submitted';
  const isCompleted = campaign.phase === 'completed';
  const isExecuting = campaign.phase === 'executing';
  const isConcepting = campaign.phase === 'concepting';
  const isSelecting = campaign.phase === 'selecting';
  const isGenerating = campaign.phase === 'generating';
  const isReviewing = campaign.phase === 'reviewing';

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    // Mark as submitted in campaign context
    await submitCampaign(campaignId);

    // Calculate score through reputation system
    const wasUnderBudget = campaign.productionSpent <= campaign.productionBudget;
    const baseScore = submitToReputation({
      id: campaign.id,
      name: campaign.campaignName,
      clientName: campaign.clientName,
      industry: campaign.brief.clientName, // Using client name as industry proxy for now
      wasUnderBudget,
      conceptBoldness: 0.5, // Could be calculated from concept selection
    });

    // Apply tool usage bonus (+2 per unique tool used, max +5)
    const toolsUsedCount = campaign.toolsUsed?.length ?? 0;
    const toolBonus = Math.min(toolsUsedCount * 2, 5);
    const toolScore = toolBonus > 0
      ? { ...baseScore, total: Math.min(baseScore.total + toolBonus, 100) }
      : baseScore;

    // Apply cheat modifiers
    let cheatTotal = toolScore.total + cheat.scoreBonus;
    const scoreFloor = Math.max(cheat.minScore, cheat.oneTimeMinScore);
    if (scoreFloor > 0) cheatTotal = Math.max(cheatTotal, scoreFloor);
    cheatTotal = Math.min(cheatTotal, 100);

    const cheatFeedback = cheat.nightmareMode
      ? NIGHTMARE_FEEDBACKS[Math.floor(Math.random() * NIGHTMARE_FEEDBACKS.length)]
      : toolScore.feedback;

    const score = (cheatTotal !== toolScore.total || cheat.nightmareMode)
      ? { ...toolScore, total: cheatTotal, feedback: cheatFeedback }
      : toolScore;

    // Consume the one-time pitchperfect bonus after it's been applied
    if (cheat.oneTimeMinScore > 0) consumeOneTimeBonus();

    // Budget bonus/penalty
    if (wasUnderBudget) {
      addReputation(1);
    } else if (campaign.productionSpent > campaign.productionBudget) {
      subtractReputation(1);
    }

    setCampaignScore(score);
    setShowResults(true);
    setIsSubmitting(false);
  };

  const handleResultsClose = () => {
    if (!campaign || !campaignScore) return;

    setShowResults(false);

    const prevCompletedCount = campaigns.filter(c => c.phase === 'completed').length;
    const newCompletedCount = prevCompletedCount + 1;
    const wasUnderBudget = campaign.productionSpent <= campaign.productionBudget;
    const selectedConcept = campaign.generatedConcepts.find(c => c.id === campaign.selectedConceptId);

    // Mark campaign as completed with the score
    completeCampaign(campaignId, campaignScore.total, campaignScore.feedback);

    // Add team fee to agency funds
    addProfit(campaignId, campaign.campaignName, campaign.teamFee);

    // Check for awards before adding to portfolio
    const earnedAwards = checkForAwards(campaignScore.total, wasUnderBudget);
    const topAward = earnedAwards[0]; // Most prestigious first

    // Silent achievement unlocks
    if (newCompletedCount === 1) unlockAchievement('first-campaign');
    if (newCompletedCount === 5) unlockAchievement('five-campaigns');
    if (campaignScore.total === 100) unlockAchievement('perfect-score');
    if (campaignScore.rating >= 5) unlockAchievement('five-star');
    if (campaignScore.total === 70) unlockAchievement('barely-passed');
    if (campaignScore.total < 50) unlockAchievement('disaster');
    if (earnedAwards.length > 0) unlockAchievement('award-winner');
    if (earnedAwards.some(a => a.id === 'cannes')) unlockAchievement('cannes-shortlist');

    // Add to portfolio
    addEntry({
      id: campaignId,
      campaignName: campaign.campaignName,
      clientName: campaign.clientName,
      score: campaignScore.total,
      rating: campaignScore.rating,
      tier: campaignScore.tier,
      feedback: campaignScore.feedback,
      completedAt: Date.now(),
      conceptName: selectedConcept?.name,
      bigIdea: selectedConcept?.bigIdea,
      conceptDescription: selectedConcept?.whyItWorks,
      deliverables: campaign.deliverables
        .filter(d => d.status === 'approved')
        .map(d => ({ type: d.type, platform: d.platform, description: d.description })),
      teamFee: campaign.teamFee,
      wasUnderBudget,
      award: topAward?.name,
    });

    // Process any immediate bonus events and send emails
    const readyEvents = processPendingEvents();
    readyEvents.forEach(event => {
      const email = generateBonusEmail(event);
      addEmail(email);
      addNotification(
        event.reputationChange > 0 ? 'Good News! 🎉' : 'Agency Update',
        email.subject
      );
    });

    addNotification(
      'Campaign Complete! 🎊',
      `"${campaign.campaignName}" scored ${campaignScore.total}/100!`
    );

    // Fire awards with staggered delays
    earnedAwards.forEach((award, i) => {
      setTimeout(() => {
        addReputation(award.repBonus);
        attachAward(campaignId, award.name);
        addNotification(
          `${award.name}`,
          `${award.description} +${award.repBonus} reputation.`
        );
        triggerCampaignEvent('AWARD_WON', {
          campaignName: campaign.campaignName,
          clientName: campaign.clientName,
          score: campaignScore.total,
          awardName: award.name,
        });
        // Check if this award triggers the ending (Cannes + 5 campaigns + 80 rep)
        const newReputation = repState.currentReputation + award.repBonus;
        const completedCount = repState.completedCampaigns.length;
        checkForEnding(award.id, completedCount, newReputation);
      }, 2500 + i * 3000);
    });

    // Check for hostile takeover (fires if player rejected first offer)
    checkForHostileTakeover(repState.completedCampaigns.length);

    // Trigger chat messages based on score
    if (campaignScore.total >= 85) {
      triggerCampaignEvent('CAMPAIGN_SCORED_WELL', {
        campaignName: campaign.campaignName,
        clientName: campaign.clientName,
        score: campaignScore.total,
      });
    } else if (campaignScore.total < 75) {
      triggerCampaignEvent('CAMPAIGN_SCORED_POORLY', {
        campaignName: campaign.campaignName,
        clientName: campaign.clientName,
        score: campaignScore.total,
      });
    }
  };

  // Get selected concept name for display
  const selectedConcept = campaign.generatedConcepts.find(c => c.id === campaign.selectedConceptId);

  return (
    <div className={styles.workspace}>
      <CampaignHeader campaign={campaign} />

      <div className={styles.content}>
        {/* Brief is always available for reference */}
        <BriefSection
          brief={campaign.brief}
          strategicDirection={campaign.strategicDirection || undefined}
          teamMemberIds={campaign.conceptingTeam?.memberIds}
          selectedConcept={selectedConcept}
        />

        {/* Phase: Concepting - Assemble team and generate concepts */}
        {isConcepting && <ConceptingPhase campaign={campaign} />}

        {/* Phase: Selecting - Choose from generated concepts */}
        {isSelecting && <ConceptSelectionPhase campaign={campaign} />}

        {/* Phase: Generating - Bulk generation with personality */}
        {isGenerating && <GenerationPhase campaign={campaign} />}

        {/* Phase: Reviewing - Presentation-style review meeting */}
        {isReviewing && <ReviewMeeting campaign={campaign} />}

        {/* Phase: Executing - All approved, ready to submit */}
        {isExecuting && (
          <div className={styles.executionPhase}>
            {selectedConcept && (
              <div className={styles.conceptBanner}>
                <span className={styles.bannerIcon}>🎨</span>
                <div className={styles.bannerText}>
                  <span className={styles.bannerLabel}>Selected Direction:</span>
                  <span className={styles.bannerValue}>"{selectedConcept.name}"</span>
                </div>
              </div>
            )}

            <div className={styles.deliverablesSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>📦 Approved Deliverables</h3>
              </div>

              <DeliverableList
                campaign={campaign}
                onAssignTeam={() => {}}
                onReview={() => {}}
                disabled={true}
              />
            </div>
          </div>
        )}

        {/* Terminal Tools — show during active work phases */}
        {(isConcepting || isExecuting || isReviewing) && (
          <CampaignToolsPanel campaign={campaign} />
        )}

        {/* Phase: Submitted - Waiting for client */}
        {isSubmitted && (
          <div className={styles.submittedState}>
            <div className={styles.submittedIcon}>⏳</div>
            <h3>Awaiting Client Review</h3>
            <p>Your campaign has been submitted. The client is reviewing your work...</p>
          </div>
        )}

        {/* Phase: Completed - Show results */}
        {isCompleted && campaign.clientScore && (
          <div className={styles.completedState}>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreValue}>{campaign.clientScore}</span>
              <span className={styles.scoreLabel}>Score</span>
            </div>
            <h3>Campaign Complete!</h3>
            <p className={styles.clientFeedback}>"{campaign.clientFeedback}"</p>
          </div>
        )}
      </div>

      {/* Footer with Submit button (only in executing phase) */}
      {isExecuting && (
        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            {campaign.deliverables.length === 0 ? (
              <span className={styles.hint}>Add deliverables to start building your campaign</span>
            ) : !canSubmit ? (
              <span className={styles.hint}>
                Approve all deliverables to submit ({campaign.deliverables.filter(d => d.status === 'approved').length}/{campaign.deliverables.length} approved)
              </span>
            ) : (
              <span className={styles.ready}>All deliverables approved! Ready to submit.</span>
            )}
          </div>
          <button
            className={`${styles.submitButton} ${canSubmit ? styles.active : ''}`}
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? '⏳ Submitting...' : '🚀 Submit Campaign'}
          </button>
        </div>
      )}

      {showResults && campaignScore && (
        <CampaignResults
          campaign={campaign}
          score={campaignScore}
          onClose={handleResultsClose}
        />
      )}
    </div>
  );
}
