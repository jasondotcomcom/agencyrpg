/**
 * Auto-generated creative directions for the "Surprise Me" feature.
 * Each direction has a quality tier that subtly affects campaign scoring.
 */

export type DirectionQuality = 'good' | 'mid' | 'bad';

export interface AutoDirection {
  text: string;
  quality: DirectionQuality;
}

const GOOD_DIRECTIONS: string[] = [
  'Bold and irreverent. Make them laugh, then make them think.',
  'Lean into nostalgia. Make it feel like coming home.',
  'Premium minimalism. Let the product speak for itself.',
  'Go weird. The kind of weird that gets screenshotted and shared.',
  'Warm and human. No corporate speak allowed.',
  'Make it feel like a movement, not a campaign.',
  'Cultural commentary disguised as advertising.',
  'Design it like a love letter to the audience.',
  'Anti-advertising energy. Be the brand that doesn\'t try too hard.',
  'Build something people would choose to spend time with.',
  'Find the tension. Lean into what makes this uncomfortable.',
  'Make it feel handmade, even if it\'s not.',
];

const MID_DIRECTIONS: string[] = [
  'Keep it simple and clean.',
  'Something eye-catching.',
  'Make it memorable.',
  'Fresh and modern.',
  'Think outside the box.',
  'Let\'s go digital-first.',
  'Make it shareable.',
  'Something that pops on social.',
  'Clean, professional, trustworthy.',
  'Bright and optimistic vibes.',
];

const BAD_DIRECTIONS: string[] = [
  'Make it pop. And synergize. Leverage the learnings.',
  'Like Apple but also like Wendy\'s Twitter but also classy?',
  'I\'ll know it when I see it.',
  'What if we went... opposite?',
  'Chaos. Controlled chaos. Chaotic control.',
  'Make it go viral. Just... make it viral.',
  'Can we make it feel like a dream you had once but can\'t quite remember?',
  'Disruptive innovation meets authentic storytelling meets blockchain vibes.',
  'What would a Super Bowl ad look like if it had no budget?',
  'Give me that \'chef\'s kiss\' energy but in visual form.',
];

/** Weighted random pick: 50% good, 30% mid, 20% bad */
export function getRandomDirection(): AutoDirection {
  const roll = Math.random();
  let pool: string[];
  let quality: DirectionQuality;

  if (roll < 0.5) {
    pool = GOOD_DIRECTIONS;
    quality = 'good';
  } else if (roll < 0.8) {
    pool = MID_DIRECTIONS;
    quality = 'mid';
  } else {
    pool = BAD_DIRECTIONS;
    quality = 'bad';
  }

  const text = pool[Math.floor(Math.random() * pool.length)];
  return { text, quality };
}

/** Get a different direction than the current one */
export function getRandomDirectionExcluding(currentText: string): AutoDirection {
  let result: AutoDirection;
  let attempts = 0;
  do {
    result = getRandomDirection();
    attempts++;
  } while (result.text === currentText && attempts < 20);
  return result;
}

/** Map direction quality to scoring parameters */
export function getDirectionScoreModifier(quality: DirectionQuality | null): {
  scorePenalty: number;
  conceptBoldness: number;
} {
  switch (quality) {
    case 'bad':
      return { scorePenalty: -5, conceptBoldness: 0.8 };
    case 'mid':
      return { scorePenalty: -2, conceptBoldness: 0.5 };
    case 'good':
    default:
      return { scorePenalty: 0, conceptBoldness: 0.3 };
  }
}
