import React from 'react';
import type { GameDef } from './types';
import {
  shuffle,
  ClickTargetGame,
  PickOneGame,
  DragDropGame,
  SimpleDragGame,
  RepelFlickGame,
  AvoidGame,
  BubblePopGame,
  ConnectDotsGame,
  DragLineGame,
  TimingMeterGame,
  RapidClickGame,
  TapPatternGame,
  HoldButtonGame,
  LayerSearchGame,
  TabCloseGame,
  SpinBuildGame,
} from './GameMechanics';

// ─── Theme Selection Helpers ─────────────────────────────────────────────────

// Module-level tracker so repeat-avoidance persists across game transitions
const _recentThemes: Record<string, number[]> = {};

function pickTheme<T extends { name: string }>(gameId: string, themes: T[]): T {
  if (!_recentThemes[gameId]) _recentThemes[gameId] = [];
  const recent = _recentThemes[gameId];
  const indices = themes.map((_, i) => i);
  const available = indices.filter(i => !recent.includes(i));
  const pool = available.length > 0 ? available : indices;
  const idx = pool[Math.floor(Math.random() * pool.length)];
  // Keep at most (n-1) recent entries so at least 1 theme is always fresh
  _recentThemes[gameId] = [...recent.slice(-(Math.max(1, themes.length - 2))), idx];
  return themes[idx];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Content Pools ───────────────────────────────────────────────────────────

// — Organize Thinking —
interface OrgBin  { id: string; label: string; emoji: string }
interface OrgItem { emoji: string; label: string; bin: string }
interface OrgTheme { name: string; bins: OrgBin[]; items: OrgItem[] }

const organizeThemes: OrgTheme[] = [
  {
    name: 'Creative Assets',
    bins: [
      { id: 'keep',   label: 'Keep',   emoji: '✅' },
      { id: 'kill',   label: 'Kill',   emoji: '🗑️' },
      { id: 'rework', label: 'Rework', emoji: '🔄' },
    ],
    items: [
      { emoji: '🎨', label: 'Hero concept',    bin: 'keep'   },
      { emoji: '📝', label: 'Tagline v1',       bin: 'kill'   },
      { emoji: '🎬', label: 'Script draft',     bin: 'rework' },
      { emoji: '🖼️', label: 'Stock photo',      bin: 'kill'   },
      { emoji: '💡', label: 'Napkin sketch',    bin: 'keep'   },
      { emoji: '📊', label: 'Competitor data',  bin: 'keep'   },
    ],
  },
  {
    name: 'Client Feedback',
    bins: [
      { id: 'now',    label: 'Act Now', emoji: '🚨' },
      { id: 'defer',  label: 'Defer',   emoji: '⏳' },
      { id: 'ignore', label: 'Ignore',  emoji: '🙈' },
    ],
    items: [
      { emoji: '💬', label: '"Not premium"',   bin: 'now'    },
      { emoji: '💬', label: '"Logo bigger"',   bin: 'defer'  },
      { emoji: '💬', label: '"Wife hates blue"', bin: 'ignore' },
      { emoji: '💬', label: '"CEO concerned"', bin: 'now'    },
      { emoji: '💬', label: '"More options?"', bin: 'defer'  },
      { emoji: '💬', label: '"More like Apple?"', bin: 'ignore' },
    ],
  },
  {
    name: 'Meeting Requests',
    bins: [
      { id: 'accept',   label: 'Accept',   emoji: '✅' },
      { id: 'decline',  label: 'Decline',  emoji: '❌' },
      { id: 'delegate', label: 'Delegate', emoji: '👥' },
    ],
    items: [
      { emoji: '📅', label: 'Client kickoff',   bin: 'accept'   },
      { emoji: '📅', label: '"Quick sync" 2hr', bin: 'decline'  },
      { emoji: '📅', label: 'Vendor lunch',     bin: 'delegate' },
      { emoji: '📅', label: 'Budget review',    bin: 'accept'   },
      { emoji: '📅', label: '"Pick your brain"', bin: 'decline' },
      { emoji: '📅', label: 'Team standup',     bin: 'delegate' },
    ],
  },
  {
    name: 'Emails',
    bins: [
      { id: 'now',     label: 'Reply Now', emoji: '🔥' },
      { id: 'later',   label: 'Later',     emoji: '📥' },
      { id: 'archive', label: 'Archive',   emoji: '🗄️' },
    ],
    items: [
      { emoji: '📧', label: 'Client: "ASAP!"',   bin: 'now'     },
      { emoji: '📧', label: '10 AI Trends 😴',   bin: 'archive' },
      { emoji: '📧', label: 'Boss: "Got a min?"', bin: 'now'    },
      { emoji: '📧', label: 'Vendor follow-up',  bin: 'later'   },
      { emoji: '📧', label: 'Mandatory training', bin: 'later'  },
      { emoji: '📧', label: 'LinkedIn congrats', bin: 'archive' },
    ],
  },
  {
    name: 'Deliverables',
    bins: [
      { id: 'approved', label: 'Approved',   emoji: '🌟' },
      { id: 'rework',   label: 'Needs Work', emoji: '🔄' },
      { id: 'redo',     label: 'Start Over', emoji: '🚫' },
    ],
    items: [
      { emoji: '📱', label: 'IG mockup v3',      bin: 'approved' },
      { emoji: '🎬', label: 'Wrong music',        bin: 'rework'   },
      { emoji: '📄', label: 'Off-brief brief',    bin: 'redo'     },
      { emoji: '🖼️', label: 'Banner w/ typo',    bin: 'rework'   },
      { emoji: '✨', label: 'Polished deck',      bin: 'approved' },
      { emoji: '🗑️', label: "Intern's first try", bin: 'redo'    },
    ],
  },
];

// — Buzzword Themes —
interface BuzzTheme { name: string; bad: string[]; good: string[] }

const buzzwordThemes: BuzzTheme[] = [
  {
    name: 'Corporate Speak',
    bad:  ['Synergy', 'Leverage', 'Pivot', 'Ideate', 'Bandwidth', 'Circle back'],
    good: ['Idea', 'Plan', 'Goal', 'Team', 'Budget', 'Work'],
  },
  {
    name: 'AI Hype',
    bad:  ['Blockchain', 'Web3', 'Metaverse', 'NFT', 'Crypto', 'Neural'],
    good: ['Research', 'Data', 'Design', 'Test', 'Build', 'Measure'],
  },
  {
    name: 'Marketing Fluff',
    bad:  ['Viral', 'Growth hack', 'Authentic', 'Curated', 'Bespoke', 'Disruptive'],
    good: ['Sales', 'Customer', 'Product', 'Quality', 'Value', 'Trust'],
  },
];

// — Nail Pitch Themes —
interface PitchTheme { name: string; label: string; sweetSpotStart: number; sweetSpotEnd: number; speed: number }

const pitchThemes: PitchTheme[] = [
  { name: 'Client Energy',  label: 'Client Enthusiasm — hit the sweet spot!',   sweetSpotStart: 0.38, sweetSpotEnd: 0.62, speed: 0.008 },
  { name: 'Budget Ask',     label: 'Budget Ask — land in the approved range!',  sweetSpotStart: 0.42, sweetSpotEnd: 0.66, speed: 0.010 },
  { name: 'Timeline',       label: 'Project Timeline — realistic is perfect!',  sweetSpotStart: 0.35, sweetSpotEnd: 0.58, speed: 0.007 },
];


// — Avoid / Dodge Emoji Themes —
interface DodgeTheme { playerEmoji: string; obstacleEmoji: string }

const dodgeRevisionVariants: DodgeTheme[] = [
  { playerEmoji: '📋', obstacleEmoji: '📧' },
  { playerEmoji: '🎯', obstacleEmoji: '📝' },
  { playerEmoji: '🧠', obstacleEmoji: '📱' },
];
const duckMeetingVariants: DodgeTheme[] = [
  { playerEmoji: '🏃', obstacleEmoji: '📅' },
  { playerEmoji: '🏃', obstacleEmoji: '🗣️' },
  { playerEmoji: '💻', obstacleEmoji: '📅' },
];
const protectIdeaVariants: DodgeTheme[] = [
  { playerEmoji: '🛡️', obstacleEmoji: '👎' },
  { playerEmoji: '💡', obstacleEmoji: '✂️' },
  { playerEmoji: '🎨', obstacleEmoji: '❌' },
];

// — Pick Typeface Sets —
interface TypefaceSet { prompt: string; target: string; decoys: string[] }

const typefaceSets: TypefaceSet[] = [
  { prompt: 'Luxury fashion brand',  target: 'Didot',          decoys: ['Comic Sans', 'Impact', 'Papyrus'] },
  { prompt: 'Tech startup',          target: 'Helvetica',      decoys: ['Brush Script', 'Old English', 'Curlz MT'] },
  { prompt: "Children's toy brand",  target: 'Futura',         decoys: ['Bodoni', 'Trajan', 'Times New Roman'] },
  { prompt: 'Law firm',              target: 'Garamond',       decoys: ['Comic Sans', 'Lobster', 'Jokerman'] },
  { prompt: 'Eco / wellness brand',  target: 'Clean sans-serif', decoys: ['Impact', 'Wingdings', 'Old English'] },
];

// — Match Client Sets —
interface MatchClientSet { client: string; correct: string; decoys: string[] }

const matchClientSets: MatchClientSet[] = [
  { client: 'Tech Startup',    correct: '🚀 Innovation Lab',  decoys: ['🏠 Home Goods Co', '🍔 Fast Food Chain'] },
  { client: 'Luxury Brand',    correct: '💎 Prestige Group',  decoys: ['🎪 Fun Factory', '🔧 Tool Depot'] },
  { client: 'Eco Nonprofit',   correct: '🌱 Green Future',    decoys: ['⛽ Oil Corp', '🏦 Big Bank'] },
  { client: 'Healthcare Brand', correct: '💊 MediCare Plus', decoys: ['🎰 Casino Co', '🏗️ Construction Inc'] },
  { client: 'QSR Chain',       correct: '🍔 BurgerBarn',     decoys: ['👔 Law Firm', '🔬 Research Lab'] },
];

// ─── ALL 34 GAMES ───────────────────────────────────────────────────────────

export const ALL_GAMES: GameDef[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // CLICK (3 games)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'stamp-brief',
    instruction: 'APPROVE THE BRIEF!',
    duration: 7000,
    category: 'click',
    waitPhase: 'concepting',
    render: (onWin) => <ClickTargetGame emoji="📋" label="STAMP IT!" animation="bounce" onWin={onWin} />,
    winMsg: (m) => `Brief locked in! ${m.name} is rolling.`,
    failMsg: (m) => `${m.name} is still waiting on that approval...`,
  },
  {
    id: 'answer-phone',
    instruction: 'ANSWER THE CLIENT!',
    duration: 7000,
    category: 'click',
    waitPhase: 'both',
    render: (onWin) => <ClickTargetGame emoji="📞" label="PICK UP!" animation="shake" onWin={onWin} />,
    winMsg: () => `Client reassured! Crisis averted.`,
    failMsg: () => `They're calling back... awkward.`,
  },
  {
    id: 'save-idea',
    instruction: 'SAVE THE IDEA!',
    duration: 8000,
    category: 'click',
    waitPhase: 'concepting',
    render: (onWin) => <ClickTargetGame emoji="💡" label="CATCH IT!" animation="fade" onWin={onWin} />,
    winMsg: (m) => `Got it! ${m.name} is running with that idea.`,
    failMsg: () => `Lost it. Back to the whiteboard...`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAG & DROP (6 games)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'file-this',
    instruction: 'FILE THE DOCUMENTS!',
    duration: 12000,
    category: 'drag',
    waitPhase: 'generating',
    render: (onWin) => (
      <DragDropGame
        items={shuffle([
          { id: 'a', emoji: '📊', label: 'Research', correctZone: 'strategy' },
          { id: 'b', emoji: '🎨', label: 'Mood Board', correctZone: 'creative' },
          { id: 'c', emoji: '📅', label: 'Timeline', correctZone: 'production' },
        ])}
        zones={[
          { id: 'strategy', emoji: '📁', label: 'Strategy' },
          { id: 'creative', emoji: '📁', label: 'Creative' },
          { id: 'production', emoji: '📁', label: 'Production' },
        ]}
        onWin={onWin}
      />
    ),
    winMsg: (m) => `Organized! ${m.name} can find everything now.`,
    failMsg: () => `Papers everywhere... someone find the brief.`,
  },
  {
    id: 'trash-it',
    instruction: 'TRASH THE BAD IDEA!',
    duration: 8000,
    category: 'drag',
    waitPhase: 'concepting',
    render: (onWin) => (
      <SimpleDragGame
        sourceEmoji="📝" sourceLabel="Bad Idea"
        targetEmoji="🗑️" targetLabel="Trash"
        onWin={onWin}
      />
    ),
    winMsg: (m) => `Good call. ${m.name} agrees — that one was bad.`,
    failMsg: () => `That bad idea is still on the table...`,
  },
  {
    id: 'sort-mood-board',
    instruction: 'SORT THE MOOD BOARD!',
    duration: 15000,
    category: 'drag',
    waitPhase: 'concepting',
    render: (onWin) => {
      const sets = [
        { yes: [{ id: 'a', emoji: '🌿', label: 'Natural' }, { id: 'b', emoji: '✨', label: 'Clean' }],
          no:  [{ id: 'c', emoji: '💀', label: 'Edgy' }] },
        { yes: [{ id: 'a', emoji: '🔥', label: 'Bold' }, { id: 'b', emoji: '🎯', label: 'Direct' }],
          no:  [{ id: 'c', emoji: '🤷', label: 'Vague' }] },
        { yes: [{ id: 'a', emoji: '🌸', label: 'Warm' }, { id: 'b', emoji: '🎀', label: 'Soft' }],
          no:  [{ id: 'c', emoji: '⚡', label: 'Harsh' }] },
        { yes: [{ id: 'a', emoji: '🌊', label: 'Calm' }, { id: 'b', emoji: '🕊️', label: 'Peaceful' }],
          no:  [{ id: 'c', emoji: '🤖', label: 'Robotic' }] },
      ];
      const set = sets[Math.floor(Math.random() * sets.length)];
      return (
        <DragDropGame
          items={shuffle([
            ...set.yes.map(i => ({ ...i, correctZone: 'yes' })),
            ...set.no.map(i => ({ ...i, correctZone: 'no' })),
          ])}
          zones={[
            { id: 'yes', emoji: '👍', label: 'Yes' },
            { id: 'no',  emoji: '👎', label: 'No' },
          ]}
          onWin={onWin}
          revealDelayMs={3000}
        />
      );
    },
    winMsg: (m) => `Direction locked! ${m.name} loves the vibe.`,
    failMsg: () => `The mood board is still a mess...`,
  },
  {
    id: 'build-deck',
    instruction: 'BUILD THE DECK!',
    duration: 10000,
    category: 'drag',
    waitPhase: 'generating',
    render: (onWin) => (
      <DragDropGame
        items={shuffle([
          { id: 'a', emoji: '1️⃣', label: 'Intro', correctZone: 'slot1' },
          { id: 'b', emoji: '2️⃣', label: 'Strategy', correctZone: 'slot2' },
          { id: 'c', emoji: '3️⃣', label: 'Creative', correctZone: 'slot3' },
        ])}
        zones={[
          { id: 'slot1', emoji: '📑', label: 'Slide 1' },
          { id: 'slot2', emoji: '📑', label: 'Slide 2' },
          { id: 'slot3', emoji: '📑', label: 'Slide 3' },
        ]}
        onWin={onWin}
      />
    ),
    winMsg: (m) => `Deck ordered! ${m.name} approves the flow.`,
    failMsg: () => `Slides are out of order...`,
  },
  {
    id: 'feed-brief',
    instruction: 'FEED THE BRIEF!',
    duration: 10000,
    category: 'drag',
    waitPhase: 'concepting',
    render: (onWin) => (
      <DragDropGame
        items={shuffle([
          { id: 'a', emoji: '🎯', label: 'Target audience', correctZone: 'who' },
          { id: 'b', emoji: '💬', label: 'Key message', correctZone: 'what' },
          { id: 'c', emoji: '📺', label: 'Channel', correctZone: 'where' },
        ])}
        zones={[
          { id: 'who',   emoji: '👤', label: 'WHO' },
          { id: 'what',  emoji: '📝', label: 'WHAT' },
          { id: 'where', emoji: '📍', label: 'WHERE' },
        ]}
        onWin={onWin}
      />
    ),
    winMsg: (m) => `Brief is solid! ${m.name} knows the plan.`,
    failMsg: () => `Brief still has gaps...`,
  },
  {
    id: 'organize-thinking',
    instruction: 'ORGANIZE THE THINKING!',
    duration: 12000,
    category: 'drag',
    waitPhase: 'both',
    render: (onWin) => {
      const theme = pickTheme('organize-thinking', organizeThemes);
      // Pick one item from each bin so every zone gets exactly one item
      const byBin: Record<string, OrgItem[]> = {};
      theme.items.forEach(it => {
        if (!byBin[it.bin]) byBin[it.bin] = [];
        byBin[it.bin].push(it);
      });
      const selected = theme.bins.map(b => {
        const pool = byBin[b.id] ?? [];
        return pickRandom(pool);
      }).filter(Boolean);

      const dragItems = shuffle(selected.map((it, i) => ({
        id: `org-${i}`,
        emoji: it.emoji,
        label: it.label,
        correctZone: it.bin,
      })));

      return (
        <DragDropGame
          items={dragItems}
          zones={theme.bins.map(b => ({ id: b.id, emoji: b.emoji, label: b.label }))}
          onWin={onWin}
        />
      );
    },
    winMsg: (m) => `Clean call! ${m.name} agrees.`,
    failMsg: () => `Still tangled... the thinking needs work.`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FLICK / CLICK-TO-REPEL (8 games)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'launch-campaign',
    instruction: 'LAUNCH THE CAMPAIGN!',
    duration: 10000,
    category: 'flick',
    waitPhase: 'both',
    render: (onWin) => (
      <RepelFlickGame
        objectEmoji="🚀"
        startPos={{ x: 190, y: 170 }}
        targetPos={{ x: 210, y: 35 }}
        targetRadius={50}
        targetEmoji="⭐"
        targetLabel="TARGET"
        gravity={0.12}
        onWin={onWin}
      />
    ),
    winMsg: (m) => `Campaign is live! ${m.name} is pumped!`,
    failMsg: () => `Missed the window... adjusting trajectory.`,
  },
  {
    id: 'paper-football',
    instruction: 'FLICK THE PAPER FOOTBALL!',
    duration: 10000,
    category: 'flick',
    waitPhase: 'both',
    render: (onWin) => (
      <RepelFlickGame
        objectEmoji="📐"
        startPos={{ x: 190, y: 170 }}
        targetPos={{ x: 210, y: 25 }}
        targetRadius={55}
        targetEmoji="🥅"
        targetLabel="GOAL"
        gravity={0.15}
        onWin={onWin}
      />
    ),
    winMsg: (m) => `${m.name} goes wild! GOOOAL!`,
    failMsg: () => `Wide right! Almost had it.`,
  },
  {
    id: 'spin-approval',
    instruction: 'SPIN FOR APPROVAL!',
    duration: 10000,
    category: 'flick',
    waitPhase: 'both',
    render: (onWin, onFail) => {
      const targets = [45, 135, 225, 315];
      const target = targets[Math.floor(Math.random() * targets.length)];
      return (
        <SpinBuildGame
          targetAngle={target}
          tolerance={40}
          emoji="✅"
          themeLabel="CD Sign-off"
          onWin={onWin}
          onFail={onFail}
        />
      );
    },
    winMsg: (m) => `${m.name} got the green light! CD approved.`,
    failMsg: () => `Another revision round... the CD is picky.`,
  },
  {
    id: 'spin-budget',
    instruction: 'BUDGET ROULETTE!',
    duration: 10000,
    category: 'flick',
    waitPhase: 'both',
    render: (onWin, onFail) => {
      const targets = [45, 135, 225, 315];
      const target = targets[Math.floor(Math.random() * targets.length)];
      return (
        <SpinBuildGame
          targetAngle={target}
          tolerance={40}
          emoji="💰"
          themeLabel="Funding Decision"
          onWin={onWin}
          onFail={onFail}
        />
      );
    },
    winMsg: (m) => `Budget approved! ${m.name} has what they need.`,
    failMsg: () => `Budget cut. Time to get creative...`,
  },
  {
    id: 'spin-client',
    instruction: 'CLIENT ROULETTE!',
    duration: 10000,
    category: 'flick',
    waitPhase: 'both',
    render: (onWin, onFail) => {
      const targets = [45, 135, 225, 315];
      const target = targets[Math.floor(Math.random() * targets.length)];
      return (
        <SpinBuildGame
          targetAngle={target}
          tolerance={40}
          emoji="🎰"
          themeLabel="Client Assignment"
          onWin={onWin}
          onFail={onFail}
        />
      );
    },
    winMsg: (m) => `${m.name} lands a great client!`,
    failMsg: () => `Tough assignment. Could be worse...`,
  },
  {
    id: 'spin-deadline',
    instruction: 'DEADLINE SPINNER!',
    duration: 10000,
    category: 'flick',
    waitPhase: 'both',
    render: (onWin, onFail) => {
      const targets = [45, 135, 225, 315];
      const target = targets[Math.floor(Math.random() * targets.length)];
      return (
        <SpinBuildGame
          targetAngle={target}
          tolerance={40}
          emoji="📅"
          themeLabel="Timeline"
          onWin={onWin}
          onFail={onFail}
        />
      );
    },
    winMsg: (m) => `Reasonable deadline! ${m.name} can work with that.`,
    failMsg: () => `"Due tomorrow." Classic.`,
  },
  {
    id: 'spin-feedback',
    instruction: 'FEEDBACK ROULETTE!',
    duration: 10000,
    category: 'flick',
    waitPhase: 'both',
    render: (onWin, onFail) => {
      const targets = [45, 135, 225, 315];
      const target = targets[Math.floor(Math.random() * targets.length)];
      return (
        <SpinBuildGame
          targetAngle={target}
          tolerance={40}
          emoji="💬"
          themeLabel="Client Response"
          onWin={onWin}
          onFail={onFail}
        />
      );
    },
    winMsg: () => `Client loves it! Feedback is golden.`,
    failMsg: (m) => `${m.name} is reading between the lines...`,
  },
  {
    id: 'spin-chair',
    instruction: 'SPIN THE CHAIR!',
    duration: 10000,
    category: 'flick',
    waitPhase: 'both',
    render: (onWin, onFail) => {
      const targets = [45, 135, 225, 315];
      const target = targets[Math.floor(Math.random() * targets.length)];
      return (
        <SpinBuildGame
          targetAngle={target}
          tolerance={40}
          emoji="💺"
          themeLabel="Office Chair"
          onWin={onWin}
          onFail={onFail}
        />
      );
    },
    winMsg: (m) => `${m.name} stuck the landing! Perfect stop.`,
    failMsg: (m) => `${m.name} is still spinning... dizzy.`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AVOID / DODGE (4 games — wave-based difficulty)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'dodge-revision',
    instruction: 'DODGE THE REVISIONS!',
    duration: 9000,
    category: 'avoid',
    waitPhase: 'both',
    survivorGame: true,
    render: (_onWin, onFail) => {
      const v = pickRandom(dodgeRevisionVariants);
      return (
        <AvoidGame
          playerEmoji={v.playerEmoji}
          obstacleEmoji={v.obstacleEmoji}
          baseCount={3}
          baseSpeed={0.9}
          movementPattern="horizontal"
          onFail={onFail}
        />
      );
    },
    winMsg: () => `Scope protected! No revisions got through.`,
    failMsg: (m) => `Scope creep! ${m.name} has extra work now...`,
  },
  {
    id: 'protect-idea',
    instruction: 'PROTECT THE BIG IDEA!',
    duration: 9000,
    category: 'avoid',
    waitPhase: 'concepting',
    survivorGame: true,
    render: (_onWin, onFail) => {
      const v = pickRandom(protectIdeaVariants);
      return (
        <AvoidGame
          playerEmoji={v.playerEmoji}
          obstacleEmoji={v.obstacleEmoji}
          baseCount={3}
          baseSpeed={0.7}
          movementPattern="inward"
          onFail={onFail}
        />
      );
    },
    winMsg: () => `Big idea survived! Great instinct.`,
    failMsg: () => `The idea took a hit... back to brainstorming.`,
  },
  {
    id: 'duck-meeting',
    instruction: 'DUCK THE MEETING!',
    duration: 9000,
    category: 'avoid',
    waitPhase: 'both',
    survivorGame: true,
    render: (_onWin, onFail) => {
      const v = pickRandom(duckMeetingVariants);
      return (
        <AvoidGame
          playerEmoji={v.playerEmoji}
          obstacleEmoji={v.obstacleEmoji}
          baseCount={3}
          baseSpeed={0.8}
          movementPattern="vertical"
          onFail={onFail}
        />
      );
    },
    winMsg: (m) => `${m.name} has uninterrupted work time!`,
    failMsg: () => `Caught! That meeting could've been an email...`,
  },
  {
    id: 'avoid-buzzwords',
    instruction: 'POP THE BUZZWORDS!',
    duration: 15000,
    category: 'avoid',
    waitPhase: 'both',
    render: (onWin, onFail) => {
      const theme = pickTheme('avoid-buzzwords', buzzwordThemes);
      // Pick 4 bad + 3 good from the theme (shuffle within each, take first N)
      const bad  = shuffle(theme.bad).slice(0, 4);
      const good = shuffle(theme.good).slice(0, 3);
      return (
        <BubblePopGame
          items={shuffle([
            ...bad.map(t => ({ text: t, bad: true })),
            ...good.map(t => ({ text: t, bad: false })),
          ])}
          onWin={onWin}
          onFail={onFail}
        />
      );
    },
    winMsg: (m) => `Communication clear! ${m.name} respects that.`,
    failMsg: () => `That was a good word! Communication muddy...`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAW (2 games)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'sketch-logo',
    instruction: 'CONNECT THE LOGO!',
    duration: 9000,
    category: 'draw',
    waitPhase: 'generating',
    render: (onWin) => {
      const shapes = [
        // Triangle
        [{ x: 190, y: 20 }, { x: 50, y: 200 }, { x: 330, y: 200 }, { x: 190, y: 20 }],
        // Star top (pentagon-ish)
        [{ x: 200, y: 15 }, { x: 100, y: 100 }, { x: 140, y: 210 }, { x: 260, y: 210 }, { x: 300, y: 100 }],
        // Arrow
        [{ x: 30, y: 130 }, { x: 200, y: 130 }, { x: 200, y: 60 }, { x: 380, y: 130 }, { x: 200, y: 200 }, { x: 200, y: 130 }],
      ];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      return <ConnectDotsGame dots={shape} onWin={onWin} />;
    },
    winMsg: (m) => `${m.name} has a steady hand! Logo sketched.`,
    failMsg: () => `Ran out of time... the logo remains unfinished.`,
  },
  {
    id: 'draw-arrow',
    instruction: 'DRAW THE VISION!',
    duration: 8000,
    category: 'draw',
    waitPhase: 'generating',
    render: (onWin) => {
      const pairs = [
        { start: { x: 30, y: 110 },  end: { x: 360, y: 110 }, sl: 'HERE',  el: 'THERE' },
        { start: { x: 60, y: 200 },  end: { x: 340, y: 30 },  sl: 'NOW',   el: 'GOAL' },
        { start: { x: 200, y: 210 }, end: { x: 200, y: 20 },  sl: 'START', el: 'WIN' },
      ];
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      return <DragLineGame startPos={pair.start} endPos={pair.end} startLabel={pair.sl} endLabel={pair.el} onWin={onWin} />;
    },
    winMsg: () => `Vision is clear! Arrow drawn.`,
    failMsg: () => `The path remains unclear...`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMING (2 games)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'nail-pitch',
    instruction: 'NAIL THE PITCH!',
    duration: 8000,
    category: 'timing',
    waitPhase: 'generating',
    render: (onWin, onFail) => {
      const theme = pickTheme('nail-pitch', pitchThemes);
      return (
        <TimingMeterGame
          sweetSpotStart={theme.sweetSpotStart}
          sweetSpotEnd={theme.sweetSpotEnd}
          speed={theme.speed}
          label={theme.label}
          onWin={onWin}
          onFail={onFail}
        />
      );
    },
    winMsg: (m) => `Perfect delivery! ${m.name} is impressed.`,
    failMsg: (m) => `Off the mark. ${m.name} smoothed it over.`,
  },
  {
    id: 'match-beat',
    instruction: 'MATCH THE RHYTHM!',
    duration: 22000,
    category: 'timing',
    waitPhase: 'both',
    render: (onWin, onFail) => {
      const patterns = [
        { pattern: [0, 2, 1, 3], emojis: ['🥁', '🎵', '🎶', '🔔'] },
        { pattern: [1, 0, 3, 2], emojis: ['👏', '🎸', '🎺', '🎹'] },
        { pattern: [2, 0, 1, 2], emojis: ['🪘', '🎷', '🎻', '📯'] },
      ];
      const p = patterns[Math.floor(Math.random() * patterns.length)];
      return <TapPatternGame pattern={p.pattern} emojis={p.emojis} onWin={onWin} onFail={onFail} />;
    },
    winMsg: (m) => `Team is in sync! ${m.name} feels the rhythm.`,
    failMsg: () => `Off beat... the team lost the groove.`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHYSICAL / SILLY (4 games)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'wake-intern',
    instruction: 'WAKE UP THE INTERN!',
    duration: 7000,
    category: 'physical',
    waitPhase: 'concepting',
    render: (onWin) => (
      <RapidClickGame targetClicks={10} emoji="😴" label="Tap to wake" onWin={onWin} />
    ),
    winMsg: (m) => `They're up! ${m.name} handed them a coffee.`,
    failMsg: () => `They slept through the meeting...`,
  },
  {
    id: 'pump-team',
    instruction: 'PUMP UP THE TEAM!',
    duration: 7000,
    category: 'physical',
    waitPhase: 'concepting',
    render: (onWin) => (
      <RapidClickGame targetClicks={12} emoji="💪" label="Energy" onWin={onWin} />
    ),
    winMsg: (m) => `${m.name} is ENERGIZED! Let's go!`,
    failMsg: () => `Energy levels still low...`,
  },
  {
    id: 'close-tabs',
    instruction: 'CLOSE THE DISTRACTIONS!',
    duration: 9000,
    category: 'physical',
    waitPhase: 'generating',
    render: (onWin, onFail) => {
      const tabSets = [
        [
          { label: 'Campaign Brief', isWork: true,  icon: '📋' },
          { label: 'YouTube',        isWork: false, icon: '📺' },
          { label: 'Reddit',         isWork: false, icon: '🤖' },
          { label: 'Twitter/X',      isWork: false, icon: '🐦' },
          { label: 'Shopping',       isWork: false, icon: '🛒' },
          { label: 'News',           isWork: false, icon: '📰' },
          { label: 'Cat videos',     isWork: false, icon: '🐱' },
        ],
        [
          { label: 'Project Deck',   isWork: true,  icon: '📊' },
          { label: 'Instagram',      isWork: false, icon: '📸' },
          { label: 'TikTok',         isWork: false, icon: '🎵' },
          { label: 'Online quiz',    isWork: false, icon: '❓' },
          { label: 'Fantasy league', isWork: false, icon: '🏈' },
          { label: 'Recipes',        isWork: false, icon: '🍳' },
        ],
        [
          { label: 'Client Brief',   isWork: true,  icon: '📋' },
          { label: 'Game review',    isWork: false, icon: '🎮' },
          { label: 'Meme archive',   isWork: false, icon: '😂' },
          { label: 'Horoscope',      isWork: false, icon: '🔮' },
          { label: 'Dog pics',       isWork: false, icon: '🐶' },
          { label: 'Playlist',       isWork: false, icon: '🎧' },
        ],
      ];
      return <TabCloseGame tabs={tabSets[Math.floor(Math.random() * tabSets.length)]} onWin={onWin} onFail={onFail} />;
    },
    winMsg: (m) => `${m.name} can focus now! Distractions gone.`,
    failMsg: () => `You closed the work tab!`,
  },
  {
    id: 'find-brief',
    instruction: 'FIND THE BRIEF!',
    duration: 10000,
    category: 'physical',
    waitPhase: 'generating',
    render: (onWin) => (
      <LayerSearchGame
        layers={[
          { emoji: '📧', label: 'Old emails',      color: 'rgba(168,216,234,0.3)' },
          { emoji: '🍕', label: 'Pizza menu',       color: 'rgba(255,183,178,0.3)' },
          { emoji: '📝', label: 'Meeting notes',    color: 'rgba(249,231,159,0.3)' },
          { emoji: '📎', label: 'Random clip art',  color: 'rgba(195,174,214,0.3)' },
        ]}
        targetEmoji="📋"
        onWin={onWin}
      />
    ),
    winMsg: (m) => `Found it! ${m.name} says 'only slightly crumpled.'`,
    failMsg: () => `Still searching... it's here somewhere.`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PUZZLE (3 games — cognitive, longer timers)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'pick-typeface',
    instruction: 'PICK THE TYPEFACE!',
    duration: 12000,
    category: 'puzzle',
    waitPhase: 'generating',
    render: (onWin, onFail) => {
      const set = pickRandom(typefaceSets);
      return (
        <PickOneGame
          context={`For: ${set.prompt}`}
          options={shuffle([
            { emoji: '🔤', label: set.target,  correct: true  },
            ...set.decoys.map(d => ({ emoji: '🔤', label: d, correct: false })),
          ])}
          onWin={onWin}
          onFail={onFail}
        />
      );
    },
    winMsg: (m) => `${m.name} loves that choice! Perfect font.`,
    failMsg: (m) => `${m.name} quietly changed the font back...`,
  },
  {
    id: 'fix-wifi',
    instruction: 'FIX THE WIFI!',
    duration: 10000,
    category: 'puzzle',
    waitPhase: 'both',
    render: (onWin, onFail) => {
      const opts = shuffle([
        { emoji: '🔌', label: 'Unplug & replug', correct: true  },
        { emoji: '📞', label: 'Call IT',          correct: false },
        { emoji: '🔨', label: 'Hit it',           correct: false },
      ]);
      return <PickOneGame options={opts} onWin={onWin} onFail={onFail} />;
    },
    winMsg: () => `Back online! Productivity restored.`,
    failMsg: () => `Still no wifi... awkward silence.`,
  },
  {
    id: 'match-client',
    instruction: 'MATCH THE CLIENT!',
    duration: 12000,
    category: 'puzzle',
    waitPhase: 'both',
    render: (onWin, onFail) => {
      const set = pickRandom(matchClientSets);
      return (
        <PickOneGame
          context={`Who works with: ${set.client}?`}
          options={shuffle([
            { emoji: '🏢', label: set.correct, correct: true  },
            ...set.decoys.map(d => ({ emoji: '🏢', label: d, correct: false })),
          ])}
          onWin={onWin}
          onFail={onFail}
        />
      );
    },
    winMsg: (m) => `No mix-ups! ${m.name} remembers every client.`,
    failMsg: () => `Awkward... that's the wrong client deck.`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOLD (2 games)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'hold-door',
    instruction: 'HOLD THE DOOR!',
    duration: 8000,
    category: 'hold',
    waitPhase: 'both',
    render: (onWin, onFail) => (
      <HoldButtonGame holdDuration={3000} emoji="🚪" label="Hold to keep the door open!" onWin={onWin} onFail={onFail} />
    ),
    winMsg: (m) => `Teamwork! ${m.name} made it through.`,
    failMsg: () => `The door closed too soon...`,
  },
  {
    id: 'keep-together',
    instruction: 'KEEP IT TOGETHER!',
    duration: 9000,
    category: 'hold',
    waitPhase: 'generating',
    render: (onWin, onFail) => (
      <HoldButtonGame holdDuration={4000} emoji="🧲" label="Hold to keep the campaign cohesive!" onWin={onWin} onFail={onFail} />
    ),
    winMsg: (m) => `Cohesive campaign! ${m.name} is proud.`,
    failMsg: () => `The elements scattered... needs more glue.`,
  },
];
