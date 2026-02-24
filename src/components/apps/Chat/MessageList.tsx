import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChatContext } from '../../../context/ChatContext';
import { usePlayerContext } from '../../../context/PlayerContext';
import { useAIRevolutionContext } from '../../../context/AIRevolutionContext';
import { getTeamMember } from '../../../data/team';
import styles from './MessageList.module.css';

const MEME_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
  'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
];

function MemeCard({ data }: { data: string }): React.ReactElement {
  try {
    const meme = JSON.parse(data);
    if (meme.lines && Array.isArray(meme.lines)) {
      const bg = MEME_GRADIENTS[(meme.bg ?? 0) % MEME_GRADIENTS.length];
      return (
        <div className={styles.memeCard} style={{ background: bg }}>
          {meme.lines.map((line: string, i: number) => (
            line === ''
              ? <div key={i} className={styles.memeSpacer} />
              : <div key={i} className={styles.memeLine}>{line}</div>
          ))}
        </div>
      );
    }
  } catch {
    // Not valid JSON — fall through to legacy rendering
  }
  return (
    <div className={styles.messageImage}>
      <pre>{data}</pre>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MessageList(): React.ReactElement {
  const { activeChannel, getMessagesForChannel, addReaction, typingAuthorId } = useChatContext();
  const { playerName } = usePlayerContext();
  const { sentientMode } = useAIRevolutionContext();
  const messages = getMessagesForChannel(activeChannel);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const prevLengthRef = useRef(messages.length);

  const checkNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsNearBottom(nearBottom);
    if (nearBottom) setHasNewMessages(false);
  }, []);

  // Auto-scroll when new messages arrive (only if near bottom)
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      if (isNearBottom) {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      } else {
        setHasNewMessages(true);
      }
    }
    prevLengthRef.current = messages.length;
  }, [messages.length, isNearBottom]);

  // Scroll to bottom on channel switch
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    setHasNewMessages(false);
  }, [activeChannel]);

  // Auto-scroll when typing indicator appears
  useEffect(() => {
    if (typingAuthorId && isNearBottom) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [typingAuthorId, isNearBottom]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    setHasNewMessages(false);
  };

  return (
    <div className={styles.messageListWrapper}>
      <div
        className={styles.messageList}
        ref={scrollRef}
        onScroll={checkNearBottom}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>💬</span>
            <p className={styles.emptyText}>No messages yet in this channel.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const member = msg.authorId === 'player'
              ? { name: playerName || 'You', avatar: '👤', role: 'Creative Director' }
              : getTeamMember(msg.authorId);
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const isGrouped =
              prevMsg &&
              prevMsg.authorId === msg.authorId &&
              msg.timestamp - prevMsg.timestamp < 120000;

            return (
              <div
                key={msg.id}
                className={`${styles.messageRow} ${isGrouped ? styles.grouped : ''} ${msg.authorId === 'player' ? styles.playerMessage : ''}`}
              >
                {!isGrouped && (
                  <div className={styles.avatar} data-role="chat-avatar">
                    {member?.avatar || '❓'}
                  </div>
                )}
                <div className={`${styles.messageContent} ${isGrouped ? styles.groupedContent : ''}`}>
                  {!isGrouped && (
                    <div className={styles.messageHeader}>
                      <span className={styles.authorName}>{member?.name || 'Unknown'}{sentientMode && msg.authorId !== 'player' ? ' ✨' : ''}</span>
                      <span className={styles.authorRole}>{member?.role || ''}</span>
                      <span className={styles.timestamp}>{formatTime(msg.timestamp)}</span>
                    </div>
                  )}
                  <div className={styles.messageText}>{msg.text}</div>
                  {msg.imageUrl && <MemeCard data={msg.imageUrl} />}
                  {msg.reactions.length > 0 && (
                    <div className={styles.reactions}>
                      {msg.reactions.map((r, ri) => (
                        <button
                          key={ri}
                          className={styles.reactionChip}
                          onClick={() => addReaction(msg.id, r.emoji)}
                        >
                          {r.emoji} {r.count}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        {typingAuthorId && activeChannel === 'general' && (() => {
          const typingMember = getTeamMember(typingAuthorId);
          return (
            <div className={styles.typingRow} aria-live="polite" aria-label={`${typingMember?.name || typingAuthorId} is typing`}>
              <div className={styles.typingAvatar}>{typingMember?.avatar || '👤'}</div>
              <div className={styles.typingBubble}>
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            </div>
          );
        })()}
      </div>

      {hasNewMessages && (
        <button className={styles.newMessagesButton} onClick={scrollToBottom}>
          ↓ New messages
        </button>
      )}
    </div>
  );
}
