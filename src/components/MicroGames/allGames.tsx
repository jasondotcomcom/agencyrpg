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
  TypoFindGame,
  SpotDifferenceGame,
  SwipeGame,
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

// ─── ALL 55 GAMES ───────────────────────────────────────────────────────────

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
    weight: 1.5,
    waitPhase: 'generating',
    render: (onWin) => {
      const themes = [
        {
          name: 'By Discipline',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Competitive audit', correctZone: 'strategy' },
            { id: 'b', emoji: '📄', label: 'Color palette', correctZone: 'creative' },
            { id: 'c', emoji: '📄', label: 'Vendor contract', correctZone: 'production' },
          ]),
          zones: [
            { id: 'strategy', emoji: '📁', label: 'Strategy' },
            { id: 'creative', emoji: '📁', label: 'Creative' },
            { id: 'production', emoji: '📁', label: 'Production' },
          ],
        },
        {
          name: 'By Stage',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Audience persona', correctZone: 'discovery' },
            { id: 'b', emoji: '📄', label: 'Storyboard', correctZone: 'concepting' },
            { id: 'c', emoji: '📄', label: 'Print specs', correctZone: 'production' },
          ]),
          zones: [
            { id: 'discovery', emoji: '📁', label: 'Discovery' },
            { id: 'concepting', emoji: '📁', label: 'Concepting' },
            { id: 'production', emoji: '📁', label: 'Production' },
          ],
        },
        {
          name: 'By Priority',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Launch day asset', correctZone: 'urgent' },
            { id: 'b', emoji: '📄', label: 'Brand guidelines', correctZone: 'reference' },
            { id: 'c', emoji: '📄', label: 'Last year\'s recap', correctZone: 'archive' },
          ]),
          zones: [
            { id: 'urgent', emoji: '📁', label: 'Urgent' },
            { id: 'reference', emoji: '📁', label: 'Reference' },
            { id: 'archive', emoji: '📁', label: 'Archive' },
          ],
        },
      ];
      const theme = pickTheme('file-this', themes);
      return <DragDropGame items={theme.items} zones={theme.zones} onWin={onWin} />;
    },
    winMsg: (m) => `Organized! ${m.name} can find everything now.`,
    failMsg: () => `Papers everywhere... someone find the brief.`,
  },
  {
    id: 'trash-it',
    instruction: 'TRASH THE BAD IDEA!',
    duration: 8000,
    category: 'drag',
    weight: 1.5,
    waitPhase: 'concepting',
    render: (onWin) => {
      const items = [
        { emoji: '📝', label: 'Bad Idea' },
        { emoji: '🖼️', label: 'Old Logo Draft' },
        { emoji: '💬', label: 'Rejected Tagline' },
        { emoji: '📷', label: 'Bad Stock Photo' },
      ];
      const item = pickRandom(items);
      return (
        <SimpleDragGame
          sourceEmoji={item.emoji} sourceLabel={item.label}
          targetEmoji="🗑️" targetLabel="Trash"
          onWin={onWin}
        />
      );
    },
    winMsg: (m) => `Good call. ${m.name} agrees — that one was bad.`,
    failMsg: () => `That bad idea is still on the table...`,
  },
  {
    id: 'sort-mood-board',
    instruction: 'SORT THE MOOD BOARD!',
    duration: 15000,
    category: 'drag',
    weight: 1.5,
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
    weight: 1.5,
    waitPhase: 'generating',
    render: (onWin) => {
      const themes = [
        {
          name: 'Campaign Deck',
          items: [
            { id: 'a', emoji: '1️⃣', label: 'Intro', correctZone: 'slot1' },
            { id: 'b', emoji: '2️⃣', label: 'Strategy', correctZone: 'slot2' },
            { id: 'c', emoji: '3️⃣', label: 'Creative', correctZone: 'slot3' },
          ],
        },
        {
          name: 'Pitch Deck',
          items: [
            { id: 'a', emoji: '1️⃣', label: 'Problem', correctZone: 'slot1' },
            { id: 'b', emoji: '2️⃣', label: 'Solution', correctZone: 'slot2' },
            { id: 'c', emoji: '3️⃣', label: 'Ask', correctZone: 'slot3' },
          ],
        },
        {
          name: 'Report',
          items: [
            { id: 'a', emoji: '1️⃣', label: 'Summary', correctZone: 'slot1' },
            { id: 'b', emoji: '2️⃣', label: 'Results', correctZone: 'slot2' },
            { id: 'c', emoji: '3️⃣', label: 'Next Steps', correctZone: 'slot3' },
          ],
        },
      ];
      const theme = pickTheme('build-deck', themes);
      return (
        <DragDropGame
          items={shuffle(theme.items)}
          zones={[
            { id: 'slot1', emoji: '📑', label: 'Slide 1' },
            { id: 'slot2', emoji: '📑', label: 'Slide 2' },
            { id: 'slot3', emoji: '📑', label: 'Slide 3' },
          ]}
          onWin={onWin}
        />
      );
    },
    winMsg: (m) => `Deck ordered! ${m.name} approves the flow.`,
    failMsg: () => `Slides are out of order...`,
  },
  {
    id: 'feed-brief',
    instruction: 'FEED THE BRIEF!',
    duration: 10000,
    category: 'drag',
    weight: 1.5,
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
    weight: 1.5,
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
    weight: 0.3,
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
    weight: 0.3,
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
    weight: 0.3,
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
    weight: 0.3,
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
    weight: 0.3,
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
    weight: 0.3,
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
    render: (onWin) => {
      const layerSets = [
        { name: 'Classic', layers: [
          { emoji: '📧', label: 'Old emails',      color: 'rgba(168,216,234,0.3)' },
          { emoji: '🍕', label: 'Pizza menu',       color: 'rgba(255,183,178,0.3)' },
          { emoji: '📝', label: 'Meeting notes',    color: 'rgba(249,231,159,0.3)' },
          { emoji: '📎', label: 'Random clip art',  color: 'rgba(195,174,214,0.3)' },
        ]},
        { name: 'Messy Desk', layers: [
          { emoji: '☕', label: 'Coffee stain',     color: 'rgba(195,174,214,0.3)' },
          { emoji: '🧾', label: 'Old receipts',     color: 'rgba(249,231,159,0.3)' },
          { emoji: '🖊️', label: 'Broken pens',     color: 'rgba(168,216,234,0.3)' },
          { emoji: '📰', label: 'Yesterday news',   color: 'rgba(255,183,178,0.3)' },
        ]},
        { name: 'Digital Chaos', layers: [
          { emoji: '🗂️', label: 'Downloads folder', color: 'rgba(168,216,234,0.3)' },
          { emoji: '🔔', label: 'Slack alerts',      color: 'rgba(255,183,178,0.3)' },
          { emoji: '📊', label: 'Old reports',       color: 'rgba(249,231,159,0.3)' },
          { emoji: '🎵', label: 'Spotify popup',     color: 'rgba(195,174,214,0.3)' },
        ]},
      ];
      const set = pickTheme('find-brief', layerSets);
      return <LayerSearchGame layers={set.layers} targetEmoji="📋" onWin={onWin} />;
    },
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
      const wifiThemes = [
        { name: 'Unplug', correct: { emoji: '🔌', label: 'Unplug & replug' }, decoys: [{ emoji: '📞', label: 'Call IT' }, { emoji: '🔨', label: 'Hit it' }] },
        { name: 'Reset', correct: { emoji: '🔄', label: 'Reset the router' }, decoys: [{ emoji: '📞', label: 'Call IT' }, { emoji: '🙏', label: 'Hope for the best' }] },
        { name: 'Channel', correct: { emoji: '📡', label: 'Switch to 5GHz' }, decoys: [{ emoji: '🔨', label: 'Hit it' }, { emoji: '📧', label: 'Email IT' }] },
        { name: 'Password', correct: { emoji: '🔑', label: 'Re-enter password' }, decoys: [{ emoji: '📞', label: 'Call ISP' }, { emoji: '🔌', label: 'Cut the cord' }] },
        { name: 'Firmware', correct: { emoji: '⬆️', label: 'Update firmware' }, decoys: [{ emoji: '🗑️', label: 'Trash it' }, { emoji: '🙏', label: 'Pray' }] },
      ];
      const theme = pickTheme('fix-wifi', wifiThemes);
      const opts = shuffle([
        { ...theme.correct, correct: true },
        ...theme.decoys.map(d => ({ ...d, correct: false })),
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

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW DRAG GAMES (10 games, weight: 1.5)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'sort-media',
    instruction: 'SORT BY BUDGET TIER!',
    duration: 12000,
    category: 'drag',
    weight: 1.5,
    waitPhase: 'generating',
    render: (onWin) => {
      const themes = [
        {
          name: 'Budget Tier A',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'TV Spot', correctZone: 'high' },
            { id: 'b', emoji: '📄', label: 'Instagram Story', correctZone: 'low' },
            { id: 'c', emoji: '📄', label: 'Billboard', correctZone: 'mid' },
          ]),
        },
        {
          name: 'Budget Tier B',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Brand Film', correctZone: 'high' },
            { id: 'b', emoji: '📄', label: 'TikTok Post', correctZone: 'low' },
            { id: 'c', emoji: '📄', label: 'Podcast Series', correctZone: 'mid' },
          ]),
        },
        {
          name: 'Budget Tier C',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Super Bowl Ad', correctZone: 'high' },
            { id: 'b', emoji: '📄', label: 'Email Blast', correctZone: 'low' },
            { id: 'c', emoji: '📄', label: 'OOH Campaign', correctZone: 'mid' },
          ]),
        },
      ];
      const theme = pickTheme('sort-media', themes);
      return (
        <DragDropGame
          items={theme.items}
          zones={[
            { id: 'low', emoji: '💵', label: 'Low Budget' },
            { id: 'mid', emoji: '💰', label: 'Medium' },
            { id: 'high', emoji: '🏦', label: 'High Budget' },
          ]}
          onWin={onWin}
        />
      );
    },
    winMsg: (m) => `Budget sorted! ${m.name} trusts your instincts.`,
    failMsg: () => `Finance flagged that allocation...`,
  },
  {
    id: 'match-platform',
    instruction: 'MATCH THE PLATFORM!',
    duration: 10000,
    category: 'drag',
    weight: 1.5,
    waitPhase: 'generating',
    render: (onWin) => (
      <DragDropGame
        items={shuffle([
          { id: 'a', emoji: '🎞️', label: 'Reel', correctZone: 'ig' },
          { id: 'b', emoji: '🧵', label: 'Thread', correctZone: 'x' },
          { id: 'c', emoji: '📝', label: 'Article', correctZone: 'li' },
        ])}
        zones={[
          { id: 'ig', emoji: '📸', label: 'Instagram' },
          { id: 'x', emoji: '🐦', label: 'X' },
          { id: 'li', emoji: '💼', label: 'LinkedIn' },
        ]}
        onWin={onWin}
      />
    ),
    winMsg: (m) => `Right platform, right content! ${m.name} approves.`,
    failMsg: () => `Wrong platform... the algorithm is confused.`,
  },
  {
    id: 'plan-sprint',
    instruction: 'SORT BY TIMELINE!',
    duration: 12000,
    category: 'drag',
    weight: 1.5,
    waitPhase: 'both',
    render: (onWin) => {
      const themes = [
        {
          name: 'Timeline A',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Social post', correctZone: 'quick' },
            { id: 'b', emoji: '📄', label: 'Brand film', correctZone: 'long' },
            { id: 'c', emoji: '📄', label: 'Radio spot', correctZone: 'mid' },
          ]),
        },
        {
          name: 'Timeline B',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Email blast', correctZone: 'quick' },
            { id: 'b', emoji: '📄', label: 'OOH campaign', correctZone: 'long' },
            { id: 'c', emoji: '📄', label: 'Podcast ad', correctZone: 'mid' },
          ]),
        },
        {
          name: 'Timeline C',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Tweet thread', correctZone: 'quick' },
            { id: 'b', emoji: '📄', label: 'TV commercial', correctZone: 'long' },
            { id: 'c', emoji: '📄', label: 'Print ad', correctZone: 'mid' },
          ]),
        },
      ];
      const theme = pickTheme('plan-sprint', themes);
      return (
        <DragDropGame
          items={theme.items}
          zones={[
            { id: 'quick', emoji: '⚡', label: 'Quick Turn' },
            { id: 'mid', emoji: '📋', label: 'Medium' },
            { id: 'long', emoji: '🗓️', label: 'Long Lead' },
          ]}
          onWin={onWin}
        />
      );
    },
    winMsg: (m) => `Timeline nailed! ${m.name} is booking the vendors.`,
    failMsg: () => `That timeline doesn't add up...`,
  },
  {
    id: 'allocate-budget',
    instruction: 'SORT BY FUNNEL STAGE!',
    duration: 10000,
    category: 'drag',
    weight: 1.5,
    waitPhase: 'generating',
    render: (onWin) => {
      const themes = [
        {
          name: 'Funnel A',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Banner ad', correctZone: 'aware' },
            { id: 'b', emoji: '📄', label: 'Case study', correctZone: 'consider' },
            { id: 'c', emoji: '📄', label: 'Promo code email', correctZone: 'convert' },
          ]),
        },
        {
          name: 'Funnel B',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'TV spot', correctZone: 'aware' },
            { id: 'b', emoji: '📄', label: 'Webinar', correctZone: 'consider' },
            { id: 'c', emoji: '📄', label: 'Free trial CTA', correctZone: 'convert' },
          ]),
        },
        {
          name: 'Funnel C',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Billboard', correctZone: 'aware' },
            { id: 'b', emoji: '📄', label: 'Product demo', correctZone: 'consider' },
            { id: 'c', emoji: '📄', label: 'Retarget ad', correctZone: 'convert' },
          ]),
        },
      ];
      const theme = pickTheme('allocate-budget', themes);
      return (
        <DragDropGame
          items={theme.items}
          zones={[
            { id: 'aware', emoji: '📢', label: 'Awareness' },
            { id: 'consider', emoji: '🤔', label: 'Consideration' },
            { id: 'convert', emoji: '🎯', label: 'Conversion' },
          ]}
          onWin={onWin}
        />
      );
    },
    winMsg: (m) => `Funnel mapped! ${m.name} sees the strategy.`,
    failMsg: () => `That's the wrong funnel stage...`,
  },
  {
    id: 'pick-palette',
    instruction: 'WHO OWNS THIS?',
    duration: 10000,
    category: 'drag',
    weight: 1.5,
    waitPhase: 'concepting',
    render: (onWin) => {
      const themes = [
        {
          name: 'Owners A',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Media plan', correctZone: 'strat' },
            { id: 'b', emoji: '📄', label: 'Headline copy', correctZone: 'copy' },
            { id: 'c', emoji: '📄', label: 'Mood board', correctZone: 'art' },
          ]),
          zones: [
            { id: 'strat', emoji: '🧠', label: 'Strategist' },
            { id: 'copy', emoji: '✍️', label: 'Copywriter' },
            { id: 'art', emoji: '🎨', label: 'Art Director' },
          ],
        },
        {
          name: 'Owners B',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Wireframe', correctZone: 'tech' },
            { id: 'b', emoji: '📄', label: 'Tagline', correctZone: 'copy' },
            { id: 'c', emoji: '📄', label: 'Target brief', correctZone: 'strat' },
          ]),
          zones: [
            { id: 'tech', emoji: '💻', label: 'Technologist' },
            { id: 'copy', emoji: '✍️', label: 'Copywriter' },
            { id: 'strat', emoji: '🧠', label: 'Strategist' },
          ],
        },
        {
          name: 'Owners C',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Shot list', correctZone: 'prod' },
            { id: 'b', emoji: '📄', label: 'Brand voice doc', correctZone: 'copy' },
            { id: 'c', emoji: '📄', label: 'Color palette', correctZone: 'art' },
          ]),
          zones: [
            { id: 'prod', emoji: '🎬', label: 'Producer' },
            { id: 'copy', emoji: '✍️', label: 'Copywriter' },
            { id: 'art', emoji: '🎨', label: 'Art Director' },
          ],
        },
      ];
      const theme = pickTheme('pick-palette', themes);
      return <DragDropGame items={theme.items} zones={theme.zones} onWin={onWin} />;
    },
    winMsg: (m) => `Right owner! ${m.name} knows who does what.`,
    failMsg: () => `Wrong desk... that deliverable went to the wrong person.`,
  },
  {
    id: 'phase-campaign',
    instruction: 'PLAN THE CAMPAIGN PHASES!',
    duration: 10000,
    category: 'drag',
    weight: 1.5,
    waitPhase: 'concepting',
    render: (onWin) => (
      <DragDropGame
        items={shuffle([
          { id: 'a', emoji: '👀', label: 'Teaser', correctZone: 'p1' },
          { id: 'b', emoji: '🚀', label: 'Hero launch', correctZone: 'p2' },
          { id: 'c', emoji: '🔄', label: 'Retarget', correctZone: 'p3' },
        ])}
        zones={[
          { id: 'p1', emoji: '1️⃣', label: 'Phase 1' },
          { id: 'p2', emoji: '2️⃣', label: 'Phase 2' },
          { id: 'p3', emoji: '3️⃣', label: 'Phase 3' },
        ]}
        onWin={onWin}
      />
    ),
    winMsg: (m) => `Campaign phased perfectly! ${m.name} is on board.`,
    failMsg: () => `Phases out of order... the campaign is confused.`,
  },
  {
    id: 'target-audience',
    instruction: 'NEEDS CLIENT APPROVAL?',
    duration: 10000,
    category: 'drag',
    weight: 1.5,
    waitPhase: 'concepting',
    render: (onWin) => {
      const themes = [
        {
          name: 'Approval A',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Final TV edit', correctZone: 'client' },
            { id: 'b', emoji: '📄', label: 'Internal moodboard', correctZone: 'internal' },
            { id: 'c', emoji: '📄', label: 'Press release', correctZone: 'client' },
          ]),
        },
        {
          name: 'Approval B',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Media buy', correctZone: 'client' },
            { id: 'b', emoji: '📄', label: 'Team brainstorm', correctZone: 'internal' },
            { id: 'c', emoji: '📄', label: 'Concept sketches', correctZone: 'internal' },
          ]),
        },
        {
          name: 'Approval C',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Billboard artwork', correctZone: 'client' },
            { id: 'b', emoji: '📄', label: 'Vendor quotes', correctZone: 'internal' },
            { id: 'c', emoji: '📄', label: 'Brand film script', correctZone: 'client' },
          ]),
        },
      ];
      const theme = pickTheme('target-audience', themes);
      return (
        <DragDropGame
          items={theme.items}
          zones={[
            { id: 'client', emoji: '🤝', label: 'Client Approval' },
            { id: 'internal', emoji: '🏠', label: 'Internal Only' },
          ]}
          onWin={onWin}
        />
      );
    },
    winMsg: (m) => `Approval flow clear! ${m.name} knows the process.`,
    failMsg: () => `That went to the wrong audience...`,
  },
  {
    id: 'review-creative',
    instruction: 'SORT BY MEDIA TYPE!',
    duration: 12000,
    category: 'drag',
    weight: 1.5,
    waitPhase: 'generating',
    render: (onWin) => {
      const themes = [
        {
          name: 'Media Type A',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Bus shelter poster', correctZone: 'ooh' },
            { id: 'b', emoji: '📄', label: '30-sec pre-roll', correctZone: 'digital' },
            { id: 'c', emoji: '📄', label: 'Postcard mailer', correctZone: 'dm' },
          ]),
          zones: [
            { id: 'ooh', emoji: '🏙️', label: 'OOH' },
            { id: 'digital', emoji: '💻', label: 'Digital' },
            { id: 'dm', emoji: '📬', label: 'Direct Mail' },
          ],
        },
        {
          name: 'Media Type B',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Magazine spread', correctZone: 'print' },
            { id: 'b', emoji: '📄', label: 'Pop-up event', correctZone: 'exp' },
            { id: 'c', emoji: '📄', label: 'Drip sequence', correctZone: 'email' },
          ]),
          zones: [
            { id: 'print', emoji: '📰', label: 'Print' },
            { id: 'exp', emoji: '🎪', label: 'Experiential' },
            { id: 'email', emoji: '📧', label: 'Email' },
          ],
        },
        {
          name: 'Media Type C',
          items: shuffle([
            { id: 'a', emoji: '📄', label: 'Spotify spot', correctZone: 'audio' },
            { id: 'b', emoji: '📄', label: 'Catalog mailer', correctZone: 'dm' },
            { id: 'c', emoji: '📄', label: 'Wheat-paste mural', correctZone: 'ooh' },
          ]),
          zones: [
            { id: 'audio', emoji: '🔊', label: 'Audio' },
            { id: 'dm', emoji: '📬', label: 'Direct Mail' },
            { id: 'ooh', emoji: '🏙️', label: 'OOH' },
          ],
        },
      ];
      const theme = pickTheme('review-creative', themes);
      return <DragDropGame items={theme.items} zones={theme.zones} onWin={onWin} />;
    },
    winMsg: (m) => `Media sorted! ${m.name} knows the channels.`,
    failMsg: () => `Wrong channel... that deliverable got misclassified.`,
  },
  {
    id: 'submit-invoice',
    instruction: 'SUBMIT THE INVOICE!',
    duration: 8000,
    category: 'drag',
    weight: 1.5,
    waitPhase: 'generating',
    render: (onWin) => (
      <SimpleDragGame
        sourceEmoji="🧾" sourceLabel="Invoice"
        targetEmoji="🏦" targetLabel="Accounting"
        onWin={onWin}
      />
    ),
    winMsg: (m) => `Submitted! ${m.name} says payment is coming.`,
    failMsg: () => `Invoice still on the desk... finance is waiting.`,
  },
  {
    id: 'archive-brief',
    instruction: 'ARCHIVE THE OLD BRIEF!',
    duration: 8000,
    category: 'drag',
    weight: 1.5,
    waitPhase: 'generating',
    render: (onWin) => (
      <SimpleDragGame
        sourceEmoji="📋" sourceLabel="Old Brief"
        targetEmoji="🗄️" targetLabel="Archive"
        onWin={onWin}
      />
    ),
    winMsg: (m) => `Archived! ${m.name} is keeping things tidy.`,
    failMsg: () => `Old briefs cluttering the workspace...`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW PUZZLE GAMES (3 games — new mechanics)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'spot-typo',
    instruction: 'SPOT THE TYPO!',
    duration: 12000,
    category: 'puzzle',
    waitPhase: 'both',
    render: (onWin, onFail) => {
      const typoThemes = [
        { name: 'Headline 1', words: ['Launch', 'Your', 'Brand', 'Toaday', 'With', 'Style'], typoIndex: 3 },
        { name: 'Headline 2', words: ['Premium', 'Qualty', 'Design', 'For', 'Every', 'Client'], typoIndex: 1 },
        { name: 'Headline 3', words: ['The', 'Future', 'Of', 'Marketng', 'Is', 'Here'], typoIndex: 3 },
        { name: 'Headline 4', words: ['Bold', 'Ideas', 'Deserve', 'Bold', 'Exection'], typoIndex: 4 },
        { name: 'Headline 5', words: ['Driving', 'Results', 'Thorugh', 'Creative', 'Strategy'], typoIndex: 2 },
        { name: 'Headline 6', words: ['Innovative', 'Solutons', 'For', 'Modern', 'Brands'], typoIndex: 1 },
      ];
      const theme = pickTheme('spot-typo', typoThemes);
      return <TypoFindGame words={theme.words} typoIndex={theme.typoIndex} onWin={onWin} onFail={onFail} />;
    },
    winMsg: (m) => `Sharp eye! ${m.name} is glad someone caught that.`,
    failMsg: () => `Wrong word... the typo slipped through.`,
  },
  {
    id: 'spot-error',
    instruction: 'SPOT THE ERROR!',
    duration: 12000,
    category: 'puzzle',
    waitPhase: 'both',
    render: (onWin, onFail) => {
      const errorThemes = [
        {
          name: 'Logo Color',
          panelA: { emoji: '🔵', lines: ['Brand Blue', '#0066CC', 'Approved'] },
          panelB: { emoji: '🟣', lines: ['Brand Blue', '#6600CC', 'Wrong hex!'] },
          errorPanel: 'B' as const,
        },
        {
          name: 'Launch Date',
          panelA: { emoji: '📅', lines: ['Launch: Mar 15', 'Q1 Campaign', 'On schedule'] },
          panelB: { emoji: '📅', lines: ['Launch: Mar 51', 'Q1 Campaign', 'Bad date!'] },
          errorPanel: 'B' as const,
        },
        {
          name: 'Client Name',
          panelA: { emoji: '🏢', lines: ['Client: Acme Co', 'Est. 1995', 'NYC'] },
          panelB: { emoji: '🏢', lines: ['Client: Acme Co', 'Est. 1995', 'NVC'] },
          errorPanel: 'B' as const,
        },
        {
          name: 'Price Error',
          panelA: { emoji: '💰', lines: ['Package: $5,000', 'Includes design', '3 revisions'] },
          panelB: { emoji: '💰', lines: ['Package: $50,000', 'Includes design', '3 revisions'] },
          errorPanel: 'B' as const,
        },
      ];
      const theme = pickTheme('spot-error', errorThemes);
      return (
        <SpotDifferenceGame
          panelA={theme.panelA}
          panelB={theme.panelB}
          errorPanel={theme.errorPanel}
          onWin={onWin}
          onFail={onFail}
        />
      );
    },
    winMsg: (m) => `Error caught! ${m.name} dodged a bullet.`,
    failMsg: () => `That panel was fine... the error was elsewhere.`,
  },
  {
    id: 'triage-email',
    instruction: 'TRIAGE THE INBOX!',
    duration: 12000,
    category: 'puzzle',
    waitPhase: 'both',
    render: (onWin, onFail) => {
      const triageThemes = [
        {
          name: 'Email Triage',
          leftLabel: 'Archive',
          rightLabel: 'Reply',
          items: [
            { emoji: '📧', label: 'Client: "Urgent update"', correct: 'right' as const },
            { emoji: '📧', label: 'Newsletter: "10 tips"', correct: 'left' as const },
            { emoji: '📧', label: 'Boss: "Call me"', correct: 'right' as const },
            { emoji: '📧', label: 'Spam: "You won!"', correct: 'left' as const },
          ],
        },
        {
          name: 'Idea Review',
          leftLabel: 'Kill',
          rightLabel: 'Keep',
          items: [
            { emoji: '💡', label: 'AR billboard concept', correct: 'right' as const },
            { emoji: '💡', label: 'Comic Sans rebrand', correct: 'left' as const },
            { emoji: '💡', label: 'Interactive social', correct: 'right' as const },
            { emoji: '💡', label: 'Fax campaign', correct: 'left' as const },
          ],
        },
        {
          name: 'Expenses',
          leftLabel: 'Reject',
          rightLabel: 'Approve',
          items: [
            { emoji: '🧾', label: 'Client lunch $45', correct: 'right' as const },
            { emoji: '🧾', label: 'Massage chair $800', correct: 'left' as const },
            { emoji: '🧾', label: 'Software license $120', correct: 'right' as const },
            { emoji: '🧾', label: 'Gold stapler $300', correct: 'left' as const },
          ],
        },
      ];
      const theme = pickTheme('triage-email', triageThemes);
      return (
        <SwipeGame
          items={theme.items}
          leftLabel={theme.leftLabel}
          rightLabel={theme.rightLabel}
          onWin={onWin}
          onFail={onFail}
        />
      );
    },
    winMsg: (m) => `Inbox zero! ${m.name} is impressed with the efficiency.`,
    failMsg: () => `Wrong call... that one needed attention.`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW GAMES USING EXISTING MECHANICS (7 games)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'approve-layout',
    instruction: 'APPROVE THE LAYOUT!',
    duration: 10000,
    category: 'puzzle',
    waitPhase: 'generating',
    render: (onWin, onFail) => {
      const sets = [
        { context: 'Which layout works for a landing page?', correct: 'F-pattern', decoys: ['Z-spiral', 'Random scatter'] },
        { context: 'Best grid for a product catalog?', correct: '3-column grid', decoys: ['Single column', 'Diagonal layout'] },
        { context: 'Hero section layout for conversion?', correct: 'CTA above fold', decoys: ['CTA in footer', 'No CTA'] },
      ];
      const set = pickRandom(sets);
      return (
        <PickOneGame
          context={set.context}
          options={shuffle([
            { emoji: '✅', label: set.correct, correct: true },
            ...set.decoys.map(d => ({ emoji: '📐', label: d, correct: false })),
          ])}
          onWin={onWin}
          onFail={onFail}
        />
      );
    },
    winMsg: (m) => `Layout approved! ${m.name} says it flows perfectly.`,
    failMsg: () => `That layout won't convert... back to wireframes.`,
  },
  {
    id: 'budget-math',
    instruction: 'CHECK THE BUDGET!',
    duration: 10000,
    category: 'puzzle',
    waitPhase: 'generating',
    render: (onWin, onFail) => {
      const sets = [
        { context: '$50k budget, $30k spent. How much left?', correct: '$20,000', decoys: ['$30,000', '$50,000'] },
        { context: '15% of $100k for media buy?', correct: '$15,000', decoys: ['$10,000', '$25,000'] },
        { context: 'Split $60k equally across 3 channels?', correct: '$20k each', decoys: ['$30k each', '$15k each'] },
      ];
      const set = pickRandom(sets);
      return (
        <PickOneGame
          context={set.context}
          options={shuffle([
            { emoji: '💰', label: set.correct, correct: true },
            ...set.decoys.map(d => ({ emoji: '💰', label: d, correct: false })),
          ])}
          onWin={onWin}
          onFail={onFail}
        />
      );
    },
    winMsg: (m) => `Math checks out! ${m.name} trusts your numbers.`,
    failMsg: () => `That math doesn't add up... finance flagged it.`,
  },
  {
    id: 'pitch-idea',
    instruction: 'PITCH THE IDEA!',
    duration: 8000,
    category: 'timing',
    waitPhase: 'concepting',
    render: (onWin, onFail) => (
      <TimingMeterGame
        sweetSpotStart={0.35}
        sweetSpotEnd={0.60}
        speed={0.009}
        label="Pitch confidence — hit the sweet spot!"
        onWin={onWin}
        onFail={onFail}
      />
    ),
    winMsg: (m) => `Nailed the pitch! ${m.name} is sold.`,
    failMsg: () => `Pitch fell flat... room went quiet.`,
  },
  {
    id: 'brew-coffee',
    instruction: 'BREW THE COFFEE!',
    duration: 7000,
    category: 'physical',
    waitPhase: 'both',
    render: (onWin) => (
      <RapidClickGame targetClicks={8} emoji="☕" label="Brew strength" onWin={onWin} />
    ),
    winMsg: (m) => `Perfect brew! ${m.name} needed that.`,
    failMsg: () => `Coffee is still weak... team morale drops.`,
  },
  {
    id: 'smash-deadline',
    instruction: 'SMASH THE DEADLINE!',
    duration: 6000,
    category: 'physical',
    waitPhase: 'generating',
    render: (onWin) => (
      <RapidClickGame targetClicks={15} emoji="⏰" label="Deadline progress" onWin={onWin} />
    ),
    winMsg: (m) => `Deadline smashed! ${m.name} high-fives the team.`,
    failMsg: () => `Missed the deadline... overtime incoming.`,
  },
  {
    id: 'focus-mode',
    instruction: 'ACTIVATE FOCUS MODE!',
    duration: 9000,
    category: 'physical',
    waitPhase: 'generating',
    render: (onWin, onFail) => {
      const tabSets = [
        [
          { label: 'Design File',     isWork: true,  icon: '🎨' },
          { label: 'Social media',    isWork: false, icon: '📱' },
          { label: 'Sports scores',   isWork: false, icon: '⚽' },
          { label: 'Weather',         isWork: false, icon: '🌤️' },
          { label: 'Online store',    isWork: false, icon: '🛍️' },
        ],
        [
          { label: 'Strategy Doc',    isWork: true,  icon: '📊' },
          { label: 'Movie trailers',  isWork: false, icon: '🎬' },
          { label: 'Food delivery',   isWork: false, icon: '🍕' },
          { label: 'Travel deals',    isWork: false, icon: '✈️' },
          { label: 'Memes',           isWork: false, icon: '😂' },
        ],
      ];
      return <TabCloseGame tabs={pickRandom(tabSets)} onWin={onWin} onFail={onFail} />;
    },
    winMsg: (m) => `Focus mode on! ${m.name} can concentrate now.`,
    failMsg: () => `You closed the work tab! Focus lost.`,
  },
  {
    id: 'hold-elevator',
    instruction: 'HOLD THE ELEVATOR!',
    duration: 8000,
    category: 'hold',
    waitPhase: 'both',
    render: (onWin, onFail) => (
      <HoldButtonGame holdDuration={3500} emoji="🛗" label="Hold for the client!" onWin={onWin} onFail={onFail} />
    ),
    winMsg: (m) => `Client made it! ${m.name} says good save.`,
    failMsg: () => `Doors closed... the client took the stairs.`,
  },
];
