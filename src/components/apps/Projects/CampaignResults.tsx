import React, { useState, useEffect } from 'react';
import type { Campaign } from '../../../types/campaign';
import { formatBudget } from '../../../types/campaign';
import type { CampaignScore } from '../../../types/reputation';
import styles from './CampaignResults.module.css';

interface CampaignResultsProps {
  campaign: Campaign;
  score: CampaignScore;
  onClose: () => void;
}

type Phase = 'submitting' | 'revealing' | 'complete';

export default function CampaignResults({
  campaign,
  score,
  onClose,
}: CampaignResultsProps): React.ReactElement {
  const [phase, setPhase] = useState<Phase>('submitting');
  const [revealedScore, setRevealedScore] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showReputation, setShowReputation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Phase progression
  useEffect(() => {
    if (phase === 'submitting') {
      const timer = setTimeout(() => setPhase('revealing'), 2500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Score counting animation
  useEffect(() => {
    if (phase !== 'revealing') return;

    let current = 0;
    const target = score.total;
    const duration = 1500;
    const steps = 30;
    const increment = target / steps;
    const stepDuration = duration / steps;

    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setRevealedScore(target);
        clearInterval(interval);

        // Sequential reveals
        setTimeout(() => setShowBreakdown(true), 300);
        setTimeout(() => setShowFeedback(true), 800);
        setTimeout(() => {
          setShowReputation(true);
          if (score.total >= 85) setShowConfetti(true);
          setPhase('complete');
        }, 1200);
      } else {
        setRevealedScore(Math.round(current));
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [phase, score.total]);

  // Render stars with half-star support
  const renderStars = () => {
    const fullStars = Math.floor(score.rating);
    const hasHalf = score.rating % 1 >= 0.5;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <span key={i} className={`${styles.star} ${styles.filled}`}>★</span>
        );
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <span key={i} className={`${styles.star} ${styles.half}`}>✨</span>
        );
      } else {
        stars.push(
          <span key={i} className={`${styles.star} ${styles.empty}`}>☆</span>
        );
      }
    }
    return stars;
  };

  // Get tier label
  const getTierLabel = () => {
    switch (score.tier) {
      case 'exceptional': return 'EXCEPTIONAL';
      case 'great': return 'GREAT WORK';
      case 'solid': return 'SOLID';
      case 'needs_improvement': return 'NEEDS IMPROVEMENT';
    }
  };

  // Get tier color
  const getTierColor = () => {
    switch (score.tier) {
      case 'exceptional': return 'var(--color-mint)';
      case 'great': return 'var(--color-sky)';
      case 'solid': return 'var(--color-butter)';
      case 'needs_improvement': return 'var(--color-peach)';
    }
  };

  return (
    <div className={styles.resultsContainer}>
      {showConfetti && <Confetti />}

        {phase === 'submitting' && (
          <div className={styles.submittingPhase}>
            <div className={styles.loadingIcon}>📤</div>
            <h2 className={styles.submittingTitle}>Submitting to Client...</h2>
            <div className={styles.loadingBar}>
              <div className={styles.loadingProgress} />
            </div>
            <p className={styles.submittingText}>
              {campaign.clientName} is reviewing your work...
            </p>
            <div className={styles.submittingQuips}>
              <SubmittingQuips />
            </div>
          </div>
        )}

        {(phase === 'revealing' || phase === 'complete') && (
          <div className={styles.resultsPhase}>
            <div className={styles.header}>
              <h3 className={styles.campaignName}>{campaign.campaignName}</h3>
              <p className={styles.clientName}>for {campaign.clientName}</p>
            </div>


            <div className={styles.scoreSection}>
              <div
                className={styles.scoreCircle}
                style={{ '--tier-color': getTierColor() } as React.CSSProperties}
              >
                <span className={styles.scoreNumber}>{revealedScore}</span>
                <span className={styles.scoreMax}>/100</span>
              </div>

              <div className={styles.stars}>{renderStars()}</div>

              <div
                className={styles.tierLabel}
                style={{ color: getTierColor() }}
              >
                {getTierLabel()}
              </div>
            </div>

            {showBreakdown && (
              <div className={`${styles.breakdown} ${styles.fadeIn}`}>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Strategic Fit</span>
                  <div className={styles.breakdownBar}>
                    <div
                      className={styles.breakdownFill}
                      style={{ width: `${score.breakdown.strategicFit}%` }}
                    />
                  </div>
                  <span className={styles.breakdownValue}>{score.breakdown.strategicFit}</span>
                </div>

                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Execution Quality</span>
                  <div className={styles.breakdownBar}>
                    <div
                      className={styles.breakdownFill}
                      style={{ width: `${score.breakdown.executionQuality}%` }}
                    />
                  </div>
                  <span className={styles.breakdownValue}>{score.breakdown.executionQuality}</span>
                </div>

                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Budget Efficiency</span>
                  <div className={styles.breakdownBar}>
                    <div
                      className={styles.breakdownFill}
                      style={{ width: `${score.breakdown.budgetEfficiency}%` }}
                    />
                  </div>
                  <span className={styles.breakdownValue}>{score.breakdown.budgetEfficiency}</span>
                </div>

                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Audience Resonance</span>
                  <div className={styles.breakdownBar}>
                    <div
                      className={styles.breakdownFill}
                      style={{ width: `${score.breakdown.audienceResonance}%` }}
                    />
                  </div>
                  <span className={styles.breakdownValue}>{score.breakdown.audienceResonance}</span>
                </div>
              </div>
            )}

            {showFeedback && (
              <div className={`${styles.feedback} ${styles.fadeIn}`}>
                <div className={styles.feedbackIcon}>💬</div>
                <p className={styles.feedbackText}>"{score.feedback}"</p>
                <p className={styles.feedbackFrom}>— {campaign.clientName}</p>
              </div>
            )}

            {showReputation && (
              <div className={`${styles.reputation} ${styles.fadeIn}`}>
                <div className={styles.reputationLabel}>AGENCY REPUTATION</div>
                <div className={`${styles.reputationChange} ${score.reputationGain > 0 ? styles.positive : styles.neutral}`}>
                  {score.reputationGain > 0 ? `+${score.reputationGain}` : '—'}
                </div>
                {score.reputationGain === 0 && (
                  <p className={styles.reputationHint}>Score 70+ to gain reputation</p>
                )}
              </div>
            )}

            {showReputation && (
              <div className={`${styles.economics} ${styles.fadeIn}`}>
                <div className={styles.economicsTitle}>CAMPAIGN ECONOMICS</div>
                <div className={styles.economicsGrid}>
                  <div className={styles.econRow}>
                    <span>Client Budget:</span>
                    <span>{formatBudget(campaign.clientBudget)}</span>
                  </div>
                  <div className={styles.econRow}>
                    <span>Your Agency Fee:</span>
                    <span style={{ color: '#2e7d32', fontWeight: 700 }}>{formatBudget(campaign.teamFee)}</span>
                  </div>
                  <div className={styles.econRow}>
                    <span>Production Spent:</span>
                    <span>{formatBudget(campaign.productionSpent)}</span>
                  </div>
                  <div className={styles.econRow} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 6, marginTop: 4 }}>
                    <span>Total Campaign Cost:</span>
                    <span>{formatBudget(campaign.teamFee + campaign.productionSpent)}</span>
                  </div>
                  {campaign.productionSpent <= campaign.productionBudget && (
                    <div className={styles.econRow} style={{ color: '#2e7d32' }}>
                      <span>Under Budget:</span>
                      <span>+{formatBudget(campaign.productionBudget - campaign.productionSpent)} (+1 REP)</span>
                    </div>
                  )}
                  {campaign.productionSpent > campaign.productionBudget && (
                    <div className={styles.econRow} style={{ color: '#c62828' }}>
                      <span>Over Budget:</span>
                      <span>-{formatBudget(campaign.productionSpent - campaign.productionBudget)} (-1 REP)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {phase === 'complete' && (
          <div className={styles.continueFooter}>
            <button className={styles.continueButton} onClick={onClose}>
              Continue
            </button>
          </div>
        )}
    </div>
  );
}

// Submitting phase quips
function SubmittingQuips(): React.ReactElement {
  const quips = [
    "Crossing fingers...",
    "Hope they like the blue...",
    "The team is stress-eating...",
    "Copywriter is pacing...",
    "Art Director won't stop refreshing...",
    "PM triple-checked the files...",
    "Strategist is rationalizing outcomes...",
    "Suit is ready to spin any result...",
  ];

  const [currentQuip, setCurrentQuip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuip(prev => (prev + 1) % quips.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return <span className={styles.quip}>{quips[currentQuip]}</span>;
}

// Confetti component
function Confetti(): React.ReactElement {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    color: string;
    delay: number;
    size: number;
  }>>([]);

  useEffect(() => {
    const colors = ['#A8E6CF', '#88C8D8', '#C3AED6', '#F9E79F', '#FFB7B2'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      size: 6 + Math.random() * 8,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className={styles.confetti}>
      {particles.map(particle => (
        <div
          key={particle.id}
          className={styles.confettiPiece}
          style={{
            left: `${particle.x}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
            width: particle.size,
            height: particle.size,
          }}
        />
      ))}
    </div>
  );
}
