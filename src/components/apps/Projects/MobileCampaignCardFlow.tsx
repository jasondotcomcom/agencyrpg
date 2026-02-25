import { useState, useEffect, useRef, useCallback } from 'react';
import type { Campaign, CampaignPhase } from '../../../types/campaign';
import { useCampaignContext } from '../../../context/CampaignContext';
import { useTouchGesture } from '../../../hooks/useTouchGesture';
import { hapticTap } from '../../../utils/haptics';
import ProgressDots from './ProgressDots';
import CardFooterNav from './CardFooterNav';
import BriefCard from './cards/BriefCard';
import TeamCard from './cards/TeamCard';
import DirectionCard from './cards/DirectionCard';
import ConceptsCard from './cards/ConceptsCard';
import DeliverablesCard from './cards/DeliverablesCard';
import ReviewCard from './cards/ReviewCard';
import SubmitCard from './cards/SubmitCard';
import styles from './MobileCampaignCardFlow.module.css';

// ─── Phase → Max Accessible Card ────────────────────────────────────────────

const PHASE_MAX: Record<CampaignPhase, number> = {
  concepting: 2,
  selecting: 3,
  generating: 4,
  reviewing: 5,
  executing: 6,
  submitted: 6,
  completed: 6,
};

const TEAM_CARD_INDEX = 1;

// ─── Component ──────────────────────────────────────────────────────────────

interface MobileCampaignCardFlowProps {
  campaign: Campaign;
  onSubmit: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  onBack: () => void;
}

export default function MobileCampaignCardFlow({
  campaign,
  onSubmit,
  canSubmit,
  isSubmitting,
  onBack,
}: MobileCampaignCardFlowProps) {
  const { setConceptingTeam } = useCampaignContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const swipingHorizontalRef = useRef(false);

  // Track team selection from TeamCard (state so Next button reactively enables/disables)
  const [teamSelection, setTeamSelection] = useState<string[]>(
    campaign.conceptingTeam?.memberIds || []
  );
  const teamSelectionRef = useRef(teamSelection);
  teamSelectionRef.current = teamSelection;

  const handleTeamSelectionChange = useCallback((ids: string[]) => {
    setTeamSelection(ids);
  }, []);

  const teamIsValid = teamSelection.length >= 2 && teamSelection.length <= 4;

  const maxAccessible = PHASE_MAX[campaign.phase] ?? 2;

  // Auto-advance when phase changes (but not during concepting — let user navigate manually)
  useEffect(() => {
    const target = PHASE_MAX[campaign.phase] ?? 0;
    if (campaign.phase !== 'concepting' && target > activeIndex) {
      setActiveIndex(target);
    }
  }, [campaign.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = useCallback((idx: number) => {
    setIsAnimating(true);
    setActiveIndex(Math.max(0, Math.min(idx, maxAccessible)));
  }, [maxAccessible]);

  // Handle Next — if on team card, commit the team first
  const handleNext = useCallback(() => {
    if (activeIndex === TEAM_CARD_INDEX && !campaign.conceptingTeam) {
      if (!teamIsValid) return;
      setConceptingTeam(campaign.id, teamSelectionRef.current);
    }
    goTo(activeIndex + 1);
  }, [activeIndex, campaign.id, campaign.conceptingTeam, goTo, setConceptingTeam, teamIsValid]);

  // Swipe handling
  useTouchGesture(containerRef, {
    swipeThreshold: 60,
    onSwipeMove(deltaX, deltaY) {
      // Only track horizontal on first move decision
      if (!swipingHorizontalRef.current && Math.abs(deltaY) > Math.abs(deltaX)) {
        return; // vertical scroll — ignore
      }
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        swipingHorizontalRef.current = true;
        setIsAnimating(false);
        setSwipeOffset(deltaX);
      }
    },
    onSwipeLeft() {
      if (swipingHorizontalRef.current && activeIndex < maxAccessible) {
        hapticTap();
        handleNext();
      }
      setSwipeOffset(0);
      swipingHorizontalRef.current = false;
    },
    onSwipeRight() {
      if (swipingHorizontalRef.current && activeIndex > 0) {
        hapticTap();
        goTo(activeIndex - 1);
      }
      setSwipeOffset(0);
      swipingHorizontalRef.current = false;
    },
    onSwipeEnd() {
      setSwipeOffset(0);
      setIsAnimating(true);
      swipingHorizontalRef.current = false;
    },
  });

  const trackTransform = `translateX(calc(-${activeIndex * 100}% + ${swipeOffset}px))`;

  // Next button disabled when on team card with invalid selection
  const isOnTeamCard = activeIndex === TEAM_CARD_INDEX;
  const teamAlreadySet = !!campaign.conceptingTeam;
  const nextDisabled = isOnTeamCard && !teamAlreadySet && !teamIsValid;

  return (
    <div className={styles.cardFlow} ref={containerRef}>
      <div className={styles.inlineHeader}>
        <button className={styles.inlineBack} onClick={onBack} type="button" aria-label="Back to campaigns">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className={styles.inlineTitle}>{campaign.campaignName}</span>
      </div>
      <ProgressDots
        activeIndex={activeIndex}
        maxAccessible={maxAccessible}
        totalCards={7}
        onNavigate={goTo}
      />

      <div
        className={styles.cardTrack}
        style={{
          transform: trackTransform,
          transition: isAnimating ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      >
        <div className={styles.cardSlot}><BriefCard campaign={campaign} /></div>
        <div className={styles.cardSlot}>
          <TeamCard campaign={campaign} onSelectionChange={handleTeamSelectionChange} />
        </div>
        <div className={styles.cardSlot}><DirectionCard campaign={campaign} /></div>
        <div className={styles.cardSlot}><ConceptsCard campaign={campaign} /></div>
        <div className={styles.cardSlot}><DeliverablesCard campaign={campaign} /></div>
        <div className={styles.cardSlot}><ReviewCard campaign={campaign} /></div>
        <div className={styles.cardSlot}>
          <SubmitCard
            campaign={campaign}
            onSubmit={onSubmit}
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      <CardFooterNav
        activeIndex={activeIndex}
        maxAccessible={maxAccessible}
        onNext={handleNext}
        onBack={() => goTo(activeIndex - 1)}
        nextDisabled={nextDisabled}
      />
    </div>
  );
}
