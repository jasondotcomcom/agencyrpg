import type { TeamMember } from '../types/campaign';
import { getLayoffsState, useLayoffs } from '../utils/layoffsStore';

export const teamMembers: TeamMember[] = [
  {
    id: 'copywriter',
    name: 'Jamie Chen',
    role: 'Copywriter',
    avatar: '✍️',
    specialty: 'Scripts, social copy, headlines, manifestos',
    description: 'Quotes movies in meetings. Thinks every brief needs a manifesto. Will rewrite a headline 47 times.',
    personality: 'Creative, references movies constantly, tends to overthink but in a good way',
    voiceStyle: 'Narrative-driven, emotionally resonant, loves a good hook',
  },
  {
    id: 'art-director',
    name: 'Morgan Reyes',
    role: 'Art Director',
    avatar: '🎨',
    specialty: 'Visual concepts, design direction, compositions',
    description: "Has opinions about kerning. Everything is 'almost there but the blue is wrong.' Makes mood boards in their sleep.",
    personality: 'Opinionated about fonts, perfectionist, will die on a kerning hill',
    voiceStyle: 'Visual-first, mood-driven, talks about "the feel"',
  },
  {
    id: 'strategist',
    name: 'Alex Park',
    role: 'Strategist',
    avatar: '📊',
    specialty: 'Audience insights, cultural awareness, positioning, frameworks',
    description: "Knows what's trending before it's trending. Reads the cultural room. Almost stayed corporate but said fuck it.",
    personality: 'Analytical but culturally plugged-in, validates with data and vibes',
    voiceStyle: 'Framework-oriented, insight-driven, always asks "but why?"',
  },
  {
    id: 'technologist',
    name: 'Sam Okonkwo',
    role: 'Technologist',
    avatar: '💻',
    specialty: 'Interactive experiences, innovation, tech integrations',
    description: 'Suggests building an app for everything. Debugs production fires in 5 minutes. The legend who saved that pitch.',
    personality: 'Excited about tech, fixes things unprompted, endless idea machine',
    voiceStyle: '"What if we built...", possibilities-focused, tech-optimist',
  },
  {
    id: 'suit',
    name: 'Jordan Blake',
    role: 'Account Director',
    avatar: '🤝',
    specialty: 'Feasibility, client management, selling work to stakeholders',
    description: "Wears Jordans with blazers. Translates 'the client wants it to pop' into actual direction. Makes risky work feel safe.",
    personality: 'Smooth, knows what sells, secretly very creative, client whisperer',
    voiceStyle: 'Client-perspective, "here\'s how we sell this", bridges corporate and creative',
  },
  {
    id: 'media',
    name: 'Riley Torres',
    role: 'Media Strategist',
    avatar: '📱',
    specialty: 'Media mix, platform strategy, timing, reach optimization',
    description: "Lives on all the platforms. Knows exactly where your audience actually hangs out. Thinks in channels.",
    personality: 'Data-informed but intuitive, always online, knows every platform\'s quirks',
    voiceStyle: 'Channel-specific, timing-aware, "this needs to live on..."',
  },
  {
    id: 'pm',
    name: 'Taylor Kim',
    role: 'Project Manager',
    avatar: '📋',
    specialty: 'Execution planning, scope management, budget efficiency',
    description: 'Keeps everyone from spiraling. Has a Gantt chart for Gantt charts. The only reason deadlines get met.',
    personality: 'Organized, pragmatic, slightly anxious in a productive way',
    voiceStyle: 'Realistic timelines, resource-focused, "let\'s scope this"',
  },
  {
    id: 'hr',
    name: 'Pat',
    role: 'HR Representative',
    avatar: '👔',
    specialty: 'Policy enforcement, documentation, compliance monitoring',
    description: 'Always watching. Always documenting. Joined after an incident at the 2024 holiday party that we do not discuss.',
    personality: 'By-the-book, vigilant, speaks exclusively in HR compliance language',
    voiceStyle: '"This has been noted.", "Per the handbook...", "I\'m documenting this."',
  },
];

// Raw lookup — the real person. Used for chat history, endings, avatars.
export function getTeamMember(id: string): TeamMember | undefined {
  return teamMembers.find(member => member.id === id);
}

// ─── Layoffs: AI3.0 replacements ──────────────────────────────────────────────
// A cut person keeps their slot (same id, so every role-based system still
// works) but the slot is now AI3.0. The generic description flows straight
// into the concept and deliverable prompts, so the work itself gets blander.

function toAI(member: TeamMember): TeamMember {
  return {
    ...member,
    isAI: true,
    name: `AI3.0 ${member.role}`,
    avatar: '🤖',
    specialty: `${member.specialty} (automated)`,
    description: 'Fast. Cheap. Fine. Has never had an opinion and never will.',
    personality: 'Agreeable, generic, no point of view, no taste, no references',
    voiceStyle: 'Competent and safe. Sounds like every other brand. Avoids anything surprising.',
  };
}

/** The team as it stands now: real people, plus AI3.0 in the slots of anyone cut. */
export function getRoster(): TeamMember[] {
  const { cut } = getLayoffsState();
  return teamMembers.map(m => (cut.includes(m.id) ? toAI(m) : m));
}

/** Same as getRoster, but re-renders the component when someone is cut. */
export function useRoster(): TeamMember[] {
  useLayoffs();
  return getRoster();
}

// Roster-aware lookup — used for campaign teams and AI prompts.
export function getTeamMembers(ids: string[]): TeamMember[] {
  const roster = getRoster();
  return ids.map(id => roster.find(m => m.id === id)).filter((m): m is TeamMember => m !== undefined);
}

// Get team composition description for AI prompts
export function getTeamCompositionDescription(ids: string[]): string {
  const members = getTeamMembers(ids);
  if (members.length === 0) return 'No team assigned';

  return members.map(m =>
    `${m.name} (${m.role}): ${m.description} Voice: ${m.voiceStyle}`
  ).join('\n\n');
}
