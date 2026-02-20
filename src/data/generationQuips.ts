import type { TeamMember } from '../types/campaign';

type QuipTemplate = (member: TeamMember) => string;

// Role-specific quips — personality-driven jokes per character (8 per role)
const roleQuips: Record<string, QuipTemplate[]> = {
  copywriter: [
    (m) => `${m.name} is rewriting the headline... again.`,
    (m) => `${m.name} says "this draft is the one." (It's the 12th.)`,
    (m) => `${m.name} is muttering movie quotes at the screen.`,
    (m) => `${m.name} just deleted everything and started over.`,
    (m) => `${m.name} is debating whether "synergy" is ironic enough.`,
    (m) => `${m.name} just pitched a manifesto instead of a tagline.`,
    (m) => `${m.name}: "What if we started with a question?"`,
    (m) => `${m.name} is writing body copy like it's a love letter.`,
  ],
  'art-director': [
    (m) => `${m.name} says the kerning is off. Adjusting...`,
    (m) => `${m.name} is arguing with themselves about the blue.`,
    (m) => `${m.name} just made a mood board for the mood board.`,
    (m) => `${m.name}: "Almost there. Just one more tweak."`,
    (m) => `${m.name} is squinting at two nearly identical shades of coral.`,
    (m) => `${m.name} just changed the font for the 9th time.`,
    (m) => `${m.name}: "The grid is sacred. Respect the grid."`,
    (m) => `${m.name} is screenshot-comparing layouts at 200% zoom.`,
  ],
  strategist: [
    (m) => `${m.name} is asking "but why?" for the 47th time.`,
    (m) => `${m.name} found a cultural insight and won't shut up about it.`,
    (m) => `${m.name} is cross-referencing audience data with vibes.`,
    (m) => `${m.name} just drew a 2x2 matrix on a napkin.`,
    (m) => `${m.name} is mapping the competitive landscape... again.`,
    (m) => `${m.name}: "What does the data say about feelings?"`,
    (m) => `${m.name} just coined a new audience segment name.`,
    (m) => `${m.name} is triangulating between three contradicting sources.`,
  ],
  technologist: [
    (m) => `${m.name} is suggesting we build an app for this.`,
    (m) => `${m.name} automated something nobody asked for.`,
    (m) => `${m.name}: "What if we added an interactive element?"`,
    (m) => `${m.name} just fixed a bug that didn't exist yet.`,
    (m) => `${m.name} is prototyping a feature in a Google Sheet.`,
    (m) => `${m.name}: "Hear me out... what about AR?"`,
    (m) => `${m.name} just wired up a webhook for fun.`,
    (m) => `${m.name} is optimizing something that takes 2 milliseconds.`,
  ],
  suit: [
    (m) => `${m.name} is rehearsing how to sell this to the client.`,
    (m) => `${m.name}: "The client is gonna love this."`,
    (m) => `${m.name} is doing that thing where they pace and smile.`,
    (m) => `${m.name} just put on a blazer. It's getting serious.`,
    (m) => `${m.name} is pre-writing the case study already.`,
    (m) => `${m.name}: "We should frame this as a 'brand moment.'"`,
    (m) => `${m.name} is rehearsing the pitch in the bathroom mirror.`,
    (m) => `${m.name} just high-fived nobody in particular.`,
  ],
  media: [
    (m) => `${m.name} is optimizing the channel mix.`,
    (m) => `${m.name}: "This needs to live on three platforms minimum."`,
    (m) => `${m.name} is checking which hashtags are trending right now.`,
    (m) => `${m.name} just mapped the entire content ecosystem.`,
    (m) => `${m.name} is calculating CPMs in their head.`,
    (m) => `${m.name}: "What if we go heavy on Stories for this?"`,
    (m) => `${m.name} is comparing reach vs. engagement for the 5th time.`,
    (m) => `${m.name} just found a niche subreddit that's perfect.`,
  ],
  pm: [
    (m) => `${m.name} is updating the Gantt chart.`,
    (m) => `${m.name}: "We're actually on schedule."`,
    (m) => `${m.name} triple-checked the file naming convention.`,
    (m) => `${m.name} is stress-organizing the shared drive.`,
    (m) => `${m.name} just color-coded the entire timeline.`,
    (m) => `${m.name}: "I made a checklist for the checklist."`,
    (m) => `${m.name} is silently calculating if this is over-scope.`,
    (m) => `${m.name} just sent a "friendly reminder" to three people.`,
  ],
};

// Generic quips — applicable to any team member (15)
const genericQuips: QuipTemplate[] = [
  (m) => `${m.name} is in the zone. Do not disturb.`,
  (m) => `${m.name} went to get coffee. Could be a while.`,
  (m) => `${m.name} is staring thoughtfully out the window.`,
  (m) => `${m.name} just cracked their knuckles. Here we go.`,
  (m) => `${m.name} is nodding slowly at the screen.`,
  (m) => `${m.name} is on a roll. Nobody make eye contact.`,
  (m) => `${m.name}: "Okay, okay, okay... I see it now."`,
  (m) => `${m.name} just whispered "yes" to themselves.`,
  (m) => `${m.name} is doing that focused head-tilt thing.`,
  (m) => `${m.name} took a snack break. Inspiration incoming.`,
  (m) => `${m.name} just put on their "thinking headphones."`,
  (m) => `${m.name} is pacing around the room.`,
  (m) => `${m.name}: "Wait... what if we flip the whole thing?"`,
  (m) => `${m.name} is typing furiously. Good sign.`,
  (m) => `${m.name} just did a little fist pump. Something's working.`,
];

// Meta quips — string literals about the creative process (8)
const metaQuips: string[] = [
  'The muse has entered the building.',
  'Great work takes time. And snacks.',
  'This is the part where the magic happens.',
  'Creativity is just connecting things... aggressively.',
  'Every masterpiece was once a blank page.',
  'The best ideas always arrive fashionably late.',
  'Somewhere, a whiteboard is being filled with genius.',
  'Brilliance loading... please hold.',
];

// Lore quips — string literals about office life (8)
const loreQuips: string[] = [
  'Free pizza in the kitchen. Productivity spike incoming.',
  'Someone left motivational sticky notes on every monitor.',
  'The office playlist just switched to lo-fi beats.',
  'The espresso machine is doing overtime today.',
  'A mysterious "Do Not Disturb" sign appeared on the war room.',
  'Whiteboard markers are disappearing at an alarming rate.',
  'The office dog is napping under the strategy table.',
  'Someone taped "Trust the Process" above the printer.',
];

export interface QuipResult {
  avatar: string;
  text: string;
}

export function getRandomQuip(
  members: TeamMember[],
  recentlyUsed: Set<string>,
): QuipResult {
  const candidates: QuipResult[] = [];

  // Build candidate pool from role-specific and generic quips
  for (const member of members) {
    const roleFns = roleQuips[member.id] || [];
    for (const fn of roleFns) {
      candidates.push({ avatar: member.avatar, text: fn(member) });
    }
    for (const fn of genericQuips) {
      candidates.push({ avatar: member.avatar, text: fn(member) });
    }
  }

  // Add meta and lore quips (use a sparkle avatar)
  for (const text of metaQuips) {
    candidates.push({ avatar: '✨', text });
  }
  for (const text of loreQuips) {
    candidates.push({ avatar: '🏢', text });
  }

  // Filter out recently used quips
  const fresh = candidates.filter((c) => !recentlyUsed.has(c.text));

  // If we've exhausted everything, reset and use full pool
  const pool = fresh.length > 0 ? fresh : candidates;

  const pick = pool[Math.floor(Math.random() * pool.length)];

  // Maintain rolling window of 15
  recentlyUsed.add(pick.text);
  if (recentlyUsed.size > 15) {
    const first = recentlyUsed.values().next().value;
    if (first !== undefined) {
      recentlyUsed.delete(first);
    }
  }

  return pick;
}
