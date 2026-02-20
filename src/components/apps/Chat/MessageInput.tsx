import React, { useState, useCallback } from 'react';
import { useChatContext } from '../../../context/ChatContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import type { MoraleLevel } from '../../../types/chat';
import styles from './MessageInput.module.css';

// ─── Sentiment Analysis ───────────────────────────────────────────────────────

interface SentimentResult {
  sentiment: 'supportive' | 'encouraging' | 'neutral' | 'dismissive' | 'harsh';
  moraleImpact: 'up' | 'same' | 'down';
  reactions: Array<{ authorId: string; text: string; delay: number }>;
  summary: string;
}

async function analyzeSentiment(
  playerMessage: string,
  recentMessages: Array<{ authorId: string; text: string }>,
  currentMorale: MoraleLevel,
): Promise<SentimentResult> {
  const recentContext = recentMessages
    .slice(-4)
    .map(m => `${m.authorId}: ${m.text}`)
    .join('\n');

  const prompt = `You are analyzing a creative director's message to their ad agency team.

Recent chat:
${recentContext || '(no recent messages)'}

Director says: "${playerMessage}"
Current team morale: ${currentMorale}

Classify the message tone and return ONLY valid JSON (no markdown):
{
  "sentiment": "supportive|encouraging|neutral|dismissive|harsh",
  "moraleImpact": "up|same|down",
  "reactions": [
    { "authorId": "copywriter", "text": "Short team reaction message (1-2 sentences)", "delay": 2000 }
  ],
  "summary": "One-line description of morale effect"
}

GUIDELINES:
- supportive (empathetic, offers help/breaks, acknowledges effort) → moraleImpact: "up"
- encouraging (positive, forward-looking, praises work quality) → moraleImpact: "up"
- perspective-giving (acknowledges effort + reframes with customer/business lens) → moraleImpact: "up"
- neutral (purely informational, no acknowledgment of feelings or effort) → moraleImpact: "same"
- dismissive (minimises concerns without acknowledgment, pushy, changes subject) → moraleImpact: "down"
- harsh (blames, aggressive, "suck it up") → moraleImpact: "down"

CRITICAL — PERSPECTIVE-GIVING IS SUPPORTIVE, NOT NEUTRAL OR DISMISSIVE:
Good leaders after a mid-range score (e.g. 70-79) will:
  1. Acknowledge the work quality ("smart work", "strong effort", "good job")
  2. Provide perspective on what actually matters (customer satisfaction, client happiness)
  3. Show appreciation ("appreciate the work", "proud of you all")
This is SUPPORTIVE (+up), even if it doesn't directly address team disappointment with the score.

EXAMPLE — mark as "supportive", moraleImpact: "up":
  "I think the work was very smart and it will really please the customers. Appreciate all the work you put in"
  → Acknowledges quality + customer-focused perspective + appreciation = good leadership

ACTUALLY DISCONNECTED/DISMISSIVE (moraleImpact: "down") means:
  - "Doesn't matter, move on" (no acknowledgment)
  - "I don't care about the score" (ignores team feelings entirely)
  - "Why are you upset? Client paid us." (tone-deaf, no empathy)
  - Changing subject with zero acknowledgment of effort

KEY TEST: Did the director acknowledge the work OR show appreciation OR provide meaningful perspective?
  YES → at minimum "neutral", usually "supportive" → moraleImpact: "same" or "up"
  NO (pure avoidance/dismissal) → "dismissive" → moraleImpact: "down"

Include 1-2 reactions from: copywriter, art-director, strategist, pm, suit, media, technologist
Reactions should sound natural and match the team member's personality.
Delays: first reaction at 2000-3000ms, second at 4000-6000ms.`;

  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);

  const data = await response.json();
  const text: string = data.content[0].text;
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as SentimentResult;
}

function nextMorale(current: MoraleLevel, impact: 'up' | 'same' | 'down'): MoraleLevel {
  if (impact === 'same') return current;
  if (impact === 'up') {
    if (current === 'low') return 'medium';
    if (current === 'medium') return 'high';
    return 'high';
  }
  if (current === 'high') return 'medium';
  if (current === 'medium') return 'low';
  return 'low';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MessageInput(): React.ReactElement {
  const { activeChannel, channels, messages, morale, addMessage, setMorale } = useChatContext();
  const { unlockAchievement, incrementCounter, resetCounter } = useAchievementContext();
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [moraleNotif, setMoraleNotif] = useState<{ icon: string; text: string } | null>(null);

  const channel = channels.find((c) => c.id === activeChannel);

  const showNotif = useCallback((icon: string, notifText: string) => {
    setMoraleNotif({ icon, text: notifText });
    setTimeout(() => setMoraleNotif(null), 3500);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // ─── Chat achievements (silent) ────────────────────────────────────────
    const lower = trimmed.toLowerCase();
    if (lower.includes('thank')) unlockAchievement('thanked-team');
    if (lower.includes('sorry') || lower.includes('apolog')) unlockAchievement('apologized');
    if (/\b(fuck|shit|damn|ass|bitch|bastard|crap|hell)\b/i.test(trimmed)) unlockAchievement('cursed');

    // All-caps streak (3 consecutive ALL CAPS messages)
    const letters = trimmed.replace(/[^a-zA-Z]/g, '');
    if (letters.length >= 3 && letters === letters.toUpperCase()) {
      const streak = incrementCounter('caps-streak');
      if (streak >= 3) unlockAchievement('all-caps-chat');
    } else {
      resetCounter('caps-streak');
    }
    // ──────────────────────────────────────────────────────────────────────

    // Post player message immediately
    addMessage({
      id: `msg-${Date.now()}-player`,
      channel: activeChannel,
      authorId: 'player',
      text: trimmed,
      timestamp: Date.now(),
      reactions: [],
      isRead: true,
    });
    setText('');
    setIsAnalyzing(true);

    try {
      const recentMsgs = messages
        .filter(m => m.channel === activeChannel)
        .slice(-6)
        .map(m => ({ authorId: m.authorId, text: m.text }));

      const result = await analyzeSentiment(trimmed, recentMsgs, morale);

      // Apply morale change
      const newMorale = nextMorale(morale, result.moraleImpact);
      if (newMorale !== morale) {
        setMorale(newMorale);
      }

      // Show notification
      if (result.moraleImpact === 'up') {
        showNotif('😊', result.summary || 'Team morale improved');
        // Supportive boss: 10 encouraging messages
        const n = incrementCounter('encouraging-messages');
        if (n >= 10) unlockAchievement('supportive-boss');
      } else if (result.moraleImpact === 'down') {
        showNotif('😐', result.summary || 'Team morale decreased');
      }

      // Schedule team reactions
      result.reactions?.forEach(reaction => {
        setTimeout(() => {
          addMessage({
            id: `msg-${Date.now()}-${reaction.authorId}-${Math.random().toString(36).slice(2, 6)}`,
            channel: activeChannel,
            authorId: reaction.authorId,
            text: reaction.text,
            timestamp: Date.now(),
            reactions: [],
            isRead: false,
          });
        }, reaction.delay);
      });
    } catch {
      // Fail silently — don't block the player's message
    } finally {
      setIsAnalyzing(false);
    }
  }, [text, activeChannel, messages, morale, addMessage, setMorale, showNotif,
      unlockAchievement, incrementCounter, resetCounter]);

  if (channel?.readOnly) {
    return (
      <div className={styles.readOnly}>
        <span className={styles.readOnlyIcon}>🔒</span>
        <span>This channel is read-only</span>
      </div>
    );
  }

  return (
    <div className={styles.inputWrap}>
      {moraleNotif && (
        <div className={styles.moraleNotif}>
          <span>{moraleNotif.icon}</span>
          <span>{moraleNotif.text}</span>
        </div>
      )}
      <div className={styles.inputBar}>
        <input
          className={styles.textInput}
          placeholder={`Message #${channel?.name ?? activeChannel}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isAnalyzing}
        />
        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={!text.trim() || isAnalyzing}
        >
          {isAnalyzing ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
