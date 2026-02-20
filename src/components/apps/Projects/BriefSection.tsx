import React, { useState } from 'react';
import type { CampaignBrief } from '../../../types/email';
import type { CampaignConcept } from '../../../types/campaign';
import { getTeamMembers } from '../../../data/team';
import styles from './BriefSection.module.css';

interface BriefSectionProps {
  brief: CampaignBrief;
  strategicDirection?: string;
  teamMemberIds?: string[];
  selectedConcept?: CampaignConcept;
}

export default function BriefSection({ brief, strategicDirection, teamMemberIds, selectedConcept }: BriefSectionProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  const teamMembers = teamMemberIds ? getTeamMembers(teamMemberIds) : [];

  return (
    <div className={styles.briefSection}>
      {/* Your Decisions — always visible when they exist */}
      {(strategicDirection || teamMembers.length > 0 || selectedConcept) && (
        <div className={styles.decisionsBar}>
          {strategicDirection && (
            <div className={styles.decisionItem}>
              <span className={styles.decisionIcon}>🧭</span>
              <div className={styles.decisionContent}>
                <span className={styles.decisionLabel}>Your Direction</span>
                <span className={styles.decisionValue}>{strategicDirection}</span>
              </div>
            </div>
          )}
          {teamMembers.length > 0 && (
            <div className={styles.decisionItem}>
              <span className={styles.decisionIcon}>👥</span>
              <div className={styles.decisionContent}>
                <span className={styles.decisionLabel}>Your Team</span>
                <span className={styles.decisionValue}>
                  {teamMembers.map(m => `${m.avatar} ${m.name}`).join('  ')}
                </span>
              </div>
            </div>
          )}
          {selectedConcept && (
            <div className={styles.decisionItem}>
              <span className={styles.decisionIcon}>💡</span>
              <div className={styles.decisionContent}>
                <span className={styles.decisionLabel}>Chosen Concept</span>
                <span className={styles.decisionValue}>"{selectedConcept.name}" — {selectedConcept.tagline}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className={styles.headerLeft}>
          <span className={styles.icon}>📋</span>
          <span className={styles.title}>Campaign Brief</span>
        </span>
        <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🎯</span>
              <span className={styles.sectionLabel}>The Challenge</span>
            </div>
            <p className={styles.sectionContent}>{brief.challenge}</p>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>👥</span>
              <span className={styles.sectionLabel}>The Audience</span>
            </div>
            <p className={styles.sectionContent}>{brief.audience}</p>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>💬</span>
              <span className={styles.sectionLabel}>The Message</span>
            </div>
            <p className={styles.sectionContent}>{brief.message}</p>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>📈</span>
              <span className={styles.sectionLabel}>Success Looks Like</span>
            </div>
            <ul className={styles.metricsList}>
              {brief.successMetrics.map((metric, index) => (
                <li key={index} className={styles.metricItem}>
                  <span className={styles.metricBullet}>✓</span>
                  {metric}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>✨</span>
              <span className={styles.sectionLabel}>The Vibe</span>
            </div>
            <p className={styles.sectionContent}>{brief.vibe}</p>
          </div>

          {brief.constraints && brief.constraints.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>⚠️</span>
                <span className={styles.sectionLabel}>Constraints</span>
              </div>
              <ul className={styles.constraintsList}>
                {brief.constraints.map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.askSection}>
            <div className={styles.askHeader}>
              <span className={styles.askIcon}>🤔</span>
              <span className={styles.askLabel}>Your Call</span>
            </div>
            <p className={styles.askContent}>{brief.openEndedAsk}</p>
          </div>
        </div>
      )}
    </div>
  );
}
