import type { MemeData } from '../../../types/chat';
import styles from './MemeCard.module.css';

interface MemeCardProps {
  data: MemeData;
}

export default function MemeCard({ data }: MemeCardProps) {
  switch (data.template) {
    case 'drake':
      return <DrakeMeme items={data.items} />;
    case 'expanding-brain':
      return <ExpandingBrainMeme items={data.items} />;
    case 'two-buttons':
      return <TwoButtonsMeme items={data.items} />;
    case 'this-is-fine':
      return <ThisIsFineMeme items={data.items} />;
    case 'quote':
      return <QuoteMeme items={data.items} />;
    default:
      return null;
  }
}

function DrakeMeme({ items }: { items: string[] }) {
  const [reject, approve] = items;
  return (
    <div className={styles.memeCard}>
      <div className={styles.drakeRow}>
        <span className={styles.drakeIcon}>❌</span>
        <span className={styles.drakeReject}>{reject}</span>
      </div>
      <div className={styles.drakeRow}>
        <span className={styles.drakeIcon}>✅</span>
        <span className={styles.drakeApprove}>{approve}</span>
      </div>
      <div className={styles.drakeAccent} />
    </div>
  );
}

function ExpandingBrainMeme({ items }: { items: string[] }) {
  const brains = ['🧠', '🤔', '🤯', '🌌'];
  return (
    <div className={styles.memeCard}>
      {items.map((item, i) => (
        <div
          key={i}
          className={styles.brainTier}
          style={{ '--tier': i, '--total': items.length } as React.CSSProperties}
        >
          <span className={styles.brainEmoji}>{brains[i] ?? '✨'}</span>
          <span className={styles.brainText}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function TwoButtonsMeme({ items }: { items: string[] }) {
  const [left, right] = items;
  return (
    <div className={styles.memeCard}>
      <div className={styles.buttonsRow}>
        <div className={styles.buttonOption}>{left}</div>
        <div className={styles.buttonOption}>{right}</div>
      </div>
      <div className={styles.buttonsSweater}>😰</div>
    </div>
  );
}

function ThisIsFineMeme({ items }: { items: string[] }) {
  return (
    <div className={`${styles.memeCard} ${styles.fineCard}`}>
      <div className={styles.fineContent}>
        {items.map((item, i) => (
          <div key={i} className={styles.fineLine}>{item}</div>
        ))}
      </div>
      <div className={styles.fineFooter}>
        <span>🐕 This is fine. 🔥</span>
      </div>
    </div>
  );
}

function QuoteMeme({ items }: { items: string[] }) {
  return (
    <div className={`${styles.memeCard} ${styles.quoteCard}`}>
      {items.map((item, i) => (
        <div key={i} className={styles.quoteLine}>{item}</div>
      ))}
    </div>
  );
}
