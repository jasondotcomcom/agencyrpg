import React, { useState } from 'react';
import type { Campaign, Deliverable } from '../../../types/campaign';
import { DELIVERABLE_TYPES, PLATFORMS, STATUS_DISPLAY } from '../../../types/campaign';
import { useCampaignContext } from '../../../context/CampaignContext';
import { getTeamMembers } from '../../../data/team';
import { parseContent, isVideoType, stripTrailingVisualDescription } from '../../../utils/contentFormatter';
import styles from './WorkReviewModal.module.css';

interface WorkReviewModalProps {
  campaign: Campaign;
  deliverable: Deliverable;
  onClose: () => void;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function WorkReviewModal({
  campaign,
  deliverable,
  onClose,
}: WorkReviewModalProps): React.ReactElement {
  const { approveDeliverable, requestRevision } = useCampaignContext();
  const [feedback, setFeedback] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const typeInfo = DELIVERABLE_TYPES[deliverable.type];
  const platformInfo = PLATFORMS[deliverable.platform];
  const statusInfo = STATUS_DISPLAY[deliverable.status];
  const work = deliverable.generatedWork;
  const team = deliverable.assignedTeam
    ? getTeamMembers(deliverable.assignedTeam.memberIds)
    : [];

  const isApproved = deliverable.status === 'approved';

  const handleApprove = () => {
    approveDeliverable(campaign.id, deliverable.id);
    onClose();
  };

  const handleRequestRevision = () => {
    if (!feedback.trim()) return;
    requestRevision(campaign.id, deliverable.id, feedback.trim());
    onClose();
  };

  if (!work) return <></>;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.headerTop}>
              <h2 className={styles.title}>
                {typeInfo.icon} {typeInfo.label}
                {deliverable.platform !== 'none' && (
                  <span className={styles.platform}>
                    {platformInfo.icon} {platformInfo.label}
                  </span>
                )}
              </h2>
              <span
                className={styles.status}
                style={{ backgroundColor: `${statusInfo.color}30`, color: statusInfo.color }}
              >
                {statusInfo.label}
              </span>
            </div>
            <p className={styles.description}>{deliverable.description}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.workPreview}>
            <div className={styles.previewHeader}>
              <span className={styles.previewLabel}>Generated Work</span>
              {work.revisionNumber > 1 && (
                <span className={styles.revisionBadge}>
                  Revision #{work.revisionNumber}
                </span>
              )}
            </div>
            <ContentPreview content={work.content} type={deliverable.type} preview={work.preview} />
          </div>

          {work.feedback && (
            <div className={styles.previousFeedback}>
              <span className={styles.feedbackLabel}>📝 Previous Feedback:</span>
              <p className={styles.feedbackText}>{work.feedback}</p>
            </div>
          )}

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Created by:</span>
              <div className={styles.teamAvatars}>
                {team.map(member => (
                  <span key={member.id} className={styles.teamAvatar} title={member.name}>
                    {member.avatar}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Generated:</span>
              <span className={styles.metaValue}>{formatDate(work.generatedAt)}</span>
            </div>
          </div>
        </div>

        {!isApproved && (
          <div className={styles.footer}>
            {!showFeedbackForm ? (
              <>
                <button
                  className={styles.revisionButton}
                  onClick={() => setShowFeedbackForm(true)}
                >
                  🔄 Request Revisions
                </button>
                <button className={styles.approveButton} onClick={handleApprove}>
                  ✅ Approve
                </button>
              </>
            ) : (
              <div className={styles.feedbackForm}>
                <textarea
                  className={styles.feedbackInput}
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="What changes would you like? Be specific..."
                  rows={3}
                  autoFocus
                />
                <div className={styles.feedbackActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowFeedbackForm(false);
                      setFeedback('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={`${styles.sendButton} ${feedback.trim() ? styles.active : ''}`}
                    onClick={handleRequestRevision}
                    disabled={!feedback.trim()}
                  >
                    Send Feedback
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isApproved && (
          <div className={styles.approvedFooter}>
            <span className={styles.approvedIcon}>✅</span>
            <span className={styles.approvedText}>This deliverable has been approved</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Content Preview with Quick View / Full Version toggle ──────────────────

const COLLAPSED_LINE_LIMIT = 8;

function ContentPreview({ content, type, preview }: { content: string; type: string; preview?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [showFull, setShowFull] = useState(!preview);

  return (
    <div className={styles.previewContent}>
      {preview && (
        <div className={styles.scriptToggle}>
          <button
            className={`${styles.scriptToggleBtn} ${!showFull ? styles.activeToggle : ''}`}
            onClick={() => setShowFull(false)}
          >
            Quick View
          </button>
          <button
            className={`${styles.scriptToggleBtn} ${showFull ? styles.activeToggle : ''}`}
            onClick={() => setShowFull(true)}
          >
            Full Version
          </button>
        </div>
      )}
      {!showFull && preview ? (
        <div className={styles.scriptSummary}>
          {preview}
        </div>
      ) : (
        <FullContent content={content} type={type} expanded={expanded} onToggle={() => setExpanded(!expanded)} />
      )}
    </div>
  );
}

function FullContent({ content, type, expanded, onToggle }: { content: string; type: string; expanded: boolean; onToggle: () => void }) {
  if (isVideoType(type)) {
    return (
      <div className={styles.scriptFull}>
        {stripTrailingVisualDescription(content).split('\n').map((line, i) => (
          <p key={i} className={styles.previewLine}>{line || '\u00A0'}</p>
        ))}
      </div>
    );
  }

  const sections = parseContent(content);
  const allLines = sections.flatMap(s =>
    s.type === 'header' ? [s] : s.content.split('\n').map(line => ({ type: 'text' as const, content: line }))
  );
  const isLong = allLines.length > COLLAPSED_LINE_LIMIT;
  const visibleLines = isLong && !expanded ? allLines.slice(0, COLLAPSED_LINE_LIMIT) : allLines;

  return (
    <>
      {visibleLines.map((line, i) =>
        line.type === 'header' ? (
          <p key={i} className={styles.previewHeader}>{line.content}</p>
        ) : (
          <p key={i} className={styles.previewLine}>{line.content || '\u00A0'}</p>
        )
      )}
      {isLong && (
        <button className={styles.readMoreButton} onClick={onToggle}>
          {expanded ? 'Show less' : 'Read more...'}
        </button>
      )}
    </>
  );
}
