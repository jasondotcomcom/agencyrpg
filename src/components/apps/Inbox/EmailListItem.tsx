import type { Email } from '../../../types/email';
import { useEmailContext } from '../../../context/EmailContext';
import styles from './EmailListItem.module.css';

interface EmailListItemProps {
  email: Email;
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days}d ago`;
  }
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getPreview(email: Email): string {
  // Strip markdown-like formatting and get first 80 chars
  const clean = email.body
    .replace(/\*\*/g, '')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > 80 ? clean.slice(0, 80) + '...' : clean;
}

export default function EmailListItem({ email }: EmailListItemProps) {
  const { selectedEmailId, selectEmail, toggleStar } = useEmailContext();
  const isSelected = selectedEmailId === email.id;

  const avatarClass = email.type === 'campaign_brief'
    ? styles.brief
    : email.type === 'team_message'
    ? styles.team
    : '';

  return (
    <div
      className={`${styles.emailItem} ${isSelected ? styles.selected : ''} ${!email.isRead ? styles.unread : ''}`}
      onClick={() => selectEmail(email.id)}
    >
      <div className={`${styles.avatar} ${avatarClass}`}>
        {email.from.avatar || '📧'}
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.sender}>{email.from.name}</span>
          <span className={styles.time}>{formatTime(email.timestamp)}</span>
        </div>

        <div className={styles.subject}>{email.subject}</div>
        <div className={styles.preview}>{getPreview(email)}</div>

        <div className={styles.badges}>
          {email.type === 'campaign_brief' && (
            <span className={`${styles.badge} ${styles.brief}`}>📋 Brief</span>
          )}
          {email.type === 'team_message' && (
            <span className={`${styles.badge} ${styles.team}`}>💬 Team</span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.actionButton} ${email.isStarred ? styles.starred : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleStar(email.id);
          }}
          title={email.isStarred ? 'Unstar' : 'Star'}
        >
          {email.isStarred ? '⭐' : '☆'}
        </button>
      </div>
    </div>
  );
}
