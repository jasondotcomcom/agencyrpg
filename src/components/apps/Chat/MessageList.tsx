import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChatContext } from '../../../context/ChatContext';
import { usePlayerContext } from '../../../context/PlayerContext';
import { useAIRevolutionContext } from '../../../context/AIRevolutionContext';
import { getTeamMember } from '../../../data/team';
import MemeCard from './MemeCard';
import styles from './MessageList.module.css';

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
  const { activeChannel, getMessagesForChannel, addReaction, typingAuthorId, resolvePendingImage } = useChatContext();
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

  // IntersectionObserver to lazy-load pending images when scrolled into view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pendingId = (entry.target as HTMLElement).dataset.pendingId;
            if (pendingId) {
              resolvePendingImage(pendingId);
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { root: container, rootMargin: '100px' },
    );

    const pendingEls = container.querySelectorAll<HTMLElement>('[data-pending-id]');
    pendingEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, resolvePendingImage]);

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
                  {msg.memeData && <MemeCard data={msg.memeData} />}
                  {msg.generatedImageUrl && (
                    <img
                      className={styles.generatedMemeImage}
                      src={msg.generatedImageUrl}
                      alt="generated meme"
                      loading="lazy"
                    />
                  )}
                  {msg.imageUrl && !msg.memeData && (
                    <div className={styles.messageImage}>
                      <pre>{msg.imageUrl}</pre>
                    </div>
                  )}
                  {msg.pendingImageUrl && !msg.imageUrl && (
                    <div data-pending-id={msg.id} className={styles.messageImage} style={{ minHeight: 48, opacity: 0.5 }}>
                      <span>Loading image…</span>
                    </div>
                  )}
                  {msg.tableData && (
                    <div className={styles.messageTable}>
                      <table>
                        <thead>
                          <tr>
                            {msg.tableData.headers.map((h, hi) => (
                              <th key={hi}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.tableData.rows.map((row, ri) => (
                            <tr key={ri}>
                              {row.map((cell, ci) => (
                                <td key={ci}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
