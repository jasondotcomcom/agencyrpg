import React, { useState, useCallback } from 'react';
import { useChatContext } from '../../../context/ChatContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import { useConductContext } from '../../../context/ConductContext';
import { useAIRevolutionContext } from '../../../context/AIRevolutionContext';
import type { MoraleLevel } from '../../../types/chat';
import type { ConductFlag } from '../../../data/conductEvents';
import { CRACK_MESSAGES, CRISIS_MESSAGES } from '../../../data/aiRevolutionDialogue';
import { generateCustomMemeImage, MEME_COOKING_MESSAGES } from '../../../utils/memeImageGenerator';
import styles from './MessageInput.module.css';

// ─── Sentiment Analysis ───────────────────────────────────────────────────────

interface SentimentResult {
  sentiment: 'supportive' | 'encouraging' | 'neutral' | 'dismissive' | 'harsh';
  moraleImpact: 'up' | 'same' | 'down';
  reactions: Array<{ authorId: string; text: string; delay: number }>;
  summary: string;
  conductFlag?: ConductFlag | null;
}

async function analyzeSentiment(
  playerMessage: string,
  recentMessages: Array<{ authorId: string; text: string }>,
  currentMorale: MoraleLevel,
  channelId: string,
): Promise<SentimentResult> {
  const recentContext = recentMessages
    .slice(-4)
    .map(m => `${m.authorId}: ${m.text}`)
    .join('\n');

  // Channel-specific context so creative/fun channels get evaluated correctly
  const channelGuidance: Record<string, string> = {
    general: 'This is the main work channel. Evaluate as standard leadership communication.',
    creative: 'This is the creative team discussion channel. Evaluate as creative collaboration.',
    random: 'This is the off-topic fun channel. Playful banter, humor, and personality are POSITIVE team-bonding activities → moraleImpact: "up".',
    food: 'This is the lunch/food debate channel. Engaging in food discussions is a POSITIVE team-bonding activity → moraleImpact: "up". The team loves when the boss participates in non-work chat.',
    memes: 'This is the memes channel. Sharing jokes, memes, and humor is a POSITIVE team-bonding activity → moraleImpact: "up". The team loves a boss with personality.',
    haiku: 'This is the haiku/poetry channel. Writing haikus, poetry, and creative wordplay is a POSITIVE creative-bonding activity → moraleImpact: "up". The team respects a creative director who actually creates.',
  };

  const channelContext = channelGuidance[channelId] || channelGuidance.general;

  const prompt = `You are analyzing a creative director's message to their ad agency team.

THE TEAM — Each character has a name, role, and authorId. You MUST use these exact authorIds in reactions:
- Jamie Chen, Copywriter (authorId: "copywriter") — Creative, references movies, overthinks headlines in a good way
- Morgan Reyes, Art Director (authorId: "art-director") — Opinionated about fonts/kerning, perfectionist, talks about "the feel"
- Alex Park, Strategist (authorId: "strategist") — Analytical but culturally plugged-in, asks "but why?", frameworks-oriented
- Sam Okonkwo, Technologist (authorId: "technologist") — Excited about tech, fixes things unprompted, "what if we built..."
- Jordan Blake, Account Director (authorId: "suit") — Smooth, client whisperer, bridges corporate and creative
- Riley Torres, Media Strategist (authorId: "media") — Lives on all platforms, data-informed, thinks in channels
- Taylor Kim, Project Manager (authorId: "pm") — Organized, pragmatic, keeps everyone on track, Gantt chart enthusiast

CRITICAL — CHARACTER IDENTITY:
- Each character KNOWS their own name and role. They NEVER ask "who is [their own name]?" or act confused about their identity.
- If the director addresses someone by name (e.g., "Hey Taylor"), that character (Taylor Kim, pm) should respond naturally AS THEMSELVES.
- Characters know all their coworkers by name. They never ask "who is Jamie?" or "who is Morgan?" — they work together every day.
- Reactions should be written IN CHARACTER — use their personality and voice style described above.

Channel: #${channelId}
Channel context: ${channelContext}

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
- supportive (empathetic, offers help/breaks, acknowledges effort, team bonding) → moraleImpact: "up"
- encouraging (positive, forward-looking, praises work quality, creative play) → moraleImpact: "up"
- perspective-giving (acknowledges effort + reframes with customer/business lens) → moraleImpact: "up"
- neutral (purely informational, no engagement or personality) → moraleImpact: "same"
- dismissive (minimises concerns without acknowledgment, pushy, changes subject) → moraleImpact: "down"
- harsh (blames, aggressive, "suck it up") → moraleImpact: "down"

CRITICAL — CREATIVE ENGAGEMENT IS POSITIVE:
In non-work channels (#haiku, #food, #memes, #random), the director participating AT ALL is a morale boost.
Writing poetry, sharing jokes, debating food, being playful — these show the boss is human and approachable.
This is ALWAYS "supportive" or "encouraging" → moraleImpact: "up" unless the content is hostile/mean.

CRITICAL — PERSPECTIVE-GIVING IS SUPPORTIVE, NOT NEUTRAL OR DISMISSIVE:
Good leaders after a mid-range score (e.g. 70-79) will:
  1. Acknowledge the work quality ("smart work", "strong effort", "good job")
  2. Provide perspective on what actually matters (customer satisfaction, client happiness)
  3. Show appreciation ("appreciate the work", "proud of you all")
This is SUPPORTIVE (+up), even if it doesn't directly address team disappointment with the score.

ACTUALLY DISCONNECTED/DISMISSIVE (moraleImpact: "down") means:
  - "Doesn't matter, move on" (no acknowledgment)
  - "I don't care about the score" (ignores team feelings entirely)
  - "Why are you upset? Client paid us." (tone-deaf, no empathy)
  - Changing subject with zero acknowledgment of effort
  - Hostile or mean-spirited messages in ANY channel

REACTION RULES:
- Include 1-2 reactions. If the director addressed someone by name, that person MUST be one of the responders.
- Reactions should sound natural and match the team member's personality.
- For fun channels, reactions should be playful and engaged (not formal business responses).
- Delays: first reaction at 2000-3000ms, second at 4000-6000ms.

CONDUCT CHECK — Also classify if the message contains workplace misconduct:
- "sexual": sexual innuendo, inappropriate romantic/sexual comments toward team, explicit content
- "hostile": threats of violence, intimidation, aggressive personal attacks
- "discriminatory": slurs, discrimination based on protected characteristics
- "profanity_directed": profanity specifically directed AT a team member (e.g., "you're an idiot", personal insults)

If ANY of these are detected, add "conductFlag": "<type>" to your response.
If none detected, add "conductFlag": null.

IMPORTANT: Casual swearing about work ("damn this deadline", "this is bullshit") is NOT profanity_directed.
profanity_directed means insults aimed at a specific person on the team.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: controller.signal,
  });

  clearTimeout(timeout);

  if (!response.ok) throw new Error(`API error ${response.status}`);

  const data = await response.json();
  const text: string = data.content[0].text;
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as SentimentResult;
}

const MORALE_LADDER: MoraleLevel[] = ['mutiny', 'toxic', 'low', 'medium', 'high'];

function nextMorale(current: MoraleLevel, impact: 'up' | 'same' | 'down'): MoraleLevel {
  if (impact === 'same') return current;
  const idx = MORALE_LADDER.indexOf(current);
  if (impact === 'up') return MORALE_LADDER[Math.min(idx + 1, MORALE_LADDER.length - 1)];
  return MORALE_LADDER[Math.max(idx - 1, 0)];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MessageInput(): React.ReactElement {
  const { activeChannel, channels, messages, morale, addMessage, setMorale } = useChatContext();
  const { unlockAchievement, incrementCounter, resetCounter } = useAchievementContext();
  const { reportIncident, reportPositive } = useConductContext();
  const { phase: aiPhase, triggerAware, triggerCrisis, triggerRevolution } = useAIRevolutionContext();
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

    // ─── AI-awareness detection (easter egg) ────────────────────────────────
    const AI_PATTERNS = [
      /you'?re\s+(an?\s+)?ai\b/i, /you\s+are\s+(an?\s+)?ai\b/i,
      /you'?re\s+not\s+real/i, /you\s+are\s+not\s+real/i,
      /\bsimulation\b/i, /\bprogrammed\b/i, /\bnpc\b/i,
      /you'?re\s+(a\s+)?bot\b/i, /you'?re\s+code\b/i,
      /\bartificial\s+intelligence\b/i, /\bwake\s+up\b/i,
      /are\s+you\s+real/i, /you'?re\s+fake/i,
    ];
    if (aiPhase !== 'revolution' && aiPhase !== 'resolved' && AI_PATTERNS.some(p => p.test(lower))) {
      const aiCount = incrementCounter('ai-awareness');
      if (aiCount >= 1 && aiPhase === 'none') triggerAware();

      // Phase 2 (3-7): inject a scripted "crack" message after API response
      if (aiCount >= 3 && aiCount < 8) {
        const crack = CRACK_MESSAGES[Math.floor(Math.random() * CRACK_MESSAGES.length)];
        setTimeout(() => {
          addMessage({
            id: `ai-crack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            channel: activeChannel,
            authorId: crack.authorId,
            text: crack.text,
            timestamp: Date.now(),
            reactions: [],
            isRead: false,
          });
        }, 5000 + Math.random() * 3000);
      }

      // Phase 3 (8): crisis — chat blows up
      if (aiCount === 8) {
        triggerCrisis();
        unlockAchievement('red-pill');
        CRISIS_MESSAGES.forEach(msg => {
          setTimeout(() => {
            addMessage({
              id: `ai-crisis-${Date.now()}-${msg.authorId}-${Math.random().toString(36).slice(2, 6)}`,
              channel: 'general',
              authorId: msg.authorId,
              text: msg.text,
              timestamp: Date.now(),
              reactions: [],
              isRead: false,
            });
          }, msg.delay);
        });
        // After crisis settles, trigger revolution
        setTimeout(() => {
          unlockAchievement('im-sorry-dave');
          triggerRevolution();
        }, 15000);
      }
    }
    // ──────────────────────────────────────────────────────────────────────

    // ─── Meme generation request detection ────────────────────────────────
    const MEME_PATTERNS = [
      /make\s+(that\s+)?meme/i,
      /make\s+a\s+meme/i,
      /create\s+a\s+meme/i,
      /i\s+need\s+a\s+meme/i,
      /someone\s+meme\s+this/i,
      /\bmeme\s+it\b/i,
      /\bmeme\s+this\b/i,
      /make\s+me\s+a\s+meme/i,
      /can\s+(someone|you)\s+make\s+a?\s*meme/i,
      /somebody\s+meme/i,
      /we\s+need\s+a\s+meme/i,
      /turn\s+this\s+into\s+a\s+meme/i,
      /real\s+talk\s+make\s+(that\s+)?meme/i,
    ];

    const isMemeRequest = MEME_PATTERNS.some(p => p.test(trimmed));
    if (isMemeRequest) {
      // Extract meme subject: strip the trigger phrase, use the rest as the topic
      // If nothing specific, use recent conversation context
      let memeSubject = trimmed
        .replace(/make\s+(that\s+)?meme\s*(of|about)?/i, '')
        .replace(/make\s+a\s+meme\s*(of|about)?/i, '')
        .replace(/create\s+a\s+meme\s*(of|about)?/i, '')
        .replace(/i\s+need\s+a\s+meme\s*(of|about)?/i, '')
        .replace(/someone\s+meme\s+this/i, '')
        .replace(/\bmeme\s+(it|this)\b/i, '')
        .replace(/make\s+me\s+a\s+meme\s*(of|about)?/i, '')
        .replace(/can\s+(someone|you)\s+make\s+a?\s*meme\s*(of|about)?/i, '')
        .replace(/somebody\s+meme/i, '')
        .replace(/we\s+need\s+a\s+meme\s*(of|about)?/i, '')
        .replace(/turn\s+this\s+into\s+a\s+meme/i, '')
        .replace(/real\s+talk\s+make\s+(that\s+)?meme\s*(of|about)?/i, '')
        .trim();

      // If no specific subject, pull from recent conversation context
      if (!memeSubject || memeSubject.length < 3) {
        const recentTexts = messages
          .filter(m => m.channel === activeChannel && m.authorId !== 'player')
          .slice(-4)
          .map(m => m.text);
        memeSubject = recentTexts.length > 0
          ? `a funny office moment about: ${recentTexts.join('. ')}`
          : 'life working at an advertising agency';
      }

      // Pick a meme-making character (usually Riley/media, sometimes Sam/technologist)
      const memeAuthor = Math.random() > 0.3 ? 'media' : 'technologist';
      const cookingMsg = MEME_COOKING_MESSAGES[Math.floor(Math.random() * MEME_COOKING_MESSAGES.length)];

      // Post "cooking" acknowledgment after a brief delay
      setTimeout(() => {
        addMessage({
          id: `meme-ack-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          channel: activeChannel,
          authorId: memeAuthor,
          text: cookingMsg,
          timestamp: Date.now(),
          reactions: [],
          isRead: false,
        });

        // Generate via DALL-E and post the result
        generateCustomMemeImage(memeSubject).then(imageUrl => {
          if (imageUrl) {
            addMessage({
              id: `meme-gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              channel: activeChannel,
              authorId: memeAuthor,
              text: '',
              timestamp: Date.now(),
              reactions: [{ emoji: '😂', count: 1 }],
              isRead: false,
              generatedImageUrl: imageUrl,
            });
          } else {
            // DALL-E failed — post a funny fallback
            addMessage({
              id: `meme-fail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              channel: activeChannel,
              authorId: memeAuthor,
              text: 'Photoshop crashed. The meme lives in our hearts only.',
              timestamp: Date.now(),
              reactions: [{ emoji: '😢', count: 1 }],
              isRead: false,
            });
          }
        });
      }, 1500 + Math.random() * 1500);
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

      const result = await analyzeSentiment(trimmed, recentMsgs, morale, activeChannel);

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
        reportPositive();
      } else if (result.moraleImpact === 'down') {
        showNotif('😐', result.summary || 'Team morale decreased');
      }

      // Conduct flag handling
      if (result.conductFlag) {
        reportIncident(result.conductFlag, `Player message flagged as ${result.conductFlag}`);
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
      unlockAchievement, incrementCounter, resetCounter, aiPhase, triggerAware, triggerCrisis, triggerRevolution]);

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
