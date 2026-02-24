import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// ─── Definitions ──────────────────────────────────────────────────────────────

export const ACHIEVEMENT_DEFS: Achievement[] = [
  // ── Cheat achievements ────────────────────────────────────────────────────
  { id: 'cheater-admitted',     name: 'Admitted Cheater',        icon: '🙈', description: 'You asked for the cheat list. No shame.' },
  { id: 'serial-cheater',       name: 'Serial Cheater',          icon: '🎮', description: 'Used 5 different cheat codes.' },
  { id: 'cheat-encyclopedia',   name: 'Cheat Code Encyclopedia', icon: '📚', description: 'Found 10 different cheat codes.' },
  { id: 'hot-coffee',           name: 'HR Nightmare',            icon: '☕', description: 'Accessed the forbidden footage. HR has been notified.' },
  { id: 'grove-street',         name: 'Grove Street',            icon: '🏠', description: 'Home. At least it was before I messed everything up.' },
  { id: 'big-head',             name: 'DK Mode',                 icon: '🎈', description: 'Goldeneye called. They want their cheat back.' },
  { id: 'glutton',              name: 'Glutton for Punishment',  icon: '😈', description: 'You asked for a nightmare client. Why?' },
  { id: 'credits',              name: 'Credit Where Due',        icon: '✨', description: 'Found the creator.' },
  { id: 'ai-humor',             name: 'Artificial Comedy',       icon: '🤖', description: 'You made the AI tell a joke.' },
  { id: 'impulse',              name: 'Armed and Ready',         icon: '🔫', description: 'Full arsenal loaded.' },

  // ── Campaign milestones ───────────────────────────────────────────────────
  { id: 'first-campaign',       name: 'First Pitch',             icon: '🎯', description: 'Completed your first campaign.' },
  { id: 'five-campaigns',       name: 'On a Roll',               icon: '🎲', description: 'Completed 5 campaigns.' },

  // ── Score achievements ────────────────────────────────────────────────────
  { id: 'five-star',            name: 'Five Star General',       icon: '⭐', description: 'Got a 5-star rating on a campaign.' },
  { id: 'perfect-score',        name: 'Perfectionist',           icon: '💯', description: 'Scored a perfect 100 on a campaign.' },
  { id: 'barely-passed',        name: 'Squeaked By',             icon: '😅', description: 'Completed a campaign with exactly 70.' },
  { id: 'disaster',             name: 'Dumpster Fire',           icon: '🗑️', description: 'Scored below 50 on a campaign.' },

  // ── Score achievements (extended) ─────────────────────────────────────────
  { id: 'solid-work',           name: 'Solid Work',              icon: '📊', description: 'Scored 80+ on a campaign.' },
  { id: 'agency-quality',       name: 'Agency Quality',          icon: '🏆', description: 'Scored 90+ on a campaign.' },
  { id: 'instant-classic',      name: 'Instant Classic',         icon: '💎', description: 'Scored 95+ on a campaign.' },
  { id: 'consistent-performer', name: 'Consistent Performer',    icon: '📈', description: 'Scored 80+ on 3 campaigns in a row.' },
  { id: 'hot-streak',           name: 'Hot Streak',              icon: '🔥', description: 'Scored 90+ on 3 campaigns in a row.' },
  { id: 'the-standard',         name: 'The Standard',            icon: '⭐', description: 'Average score of 85+ across 5 campaigns.' },

  // ── Creative style ──────────────────────────────────────────────────────
  { id: 'first-thought',        name: 'First Thought Best Thought', icon: '⚡', description: 'Selected the first concept without viewing others.' },
  { id: 'perfectionist-concepts', name: 'Never Satisfied',       icon: '🔄', description: 'Regenerated concepts 3+ times on one campaign.' },
  { id: 'tweaker',              name: 'The Tweaker',             icon: '✏️', description: 'Tweaked a concept before selecting it.' },
  { id: 'range',                name: 'Range',                   icon: '🌈', description: 'Completed campaigns for 3+ different industries.' },
  { id: 'specialist',           name: 'The Specialist',          icon: '🎯', description: 'Completed 3 campaigns in the same industry.' },
  { id: 'big-spender-tools',    name: 'Tool Time',               icon: '🧰', description: 'Used 3+ terminal tools on a single campaign.' },

  // ── Work ethic ──────────────────────────────────────────────────────────
  { id: 'under-budget',         name: 'Overachiever',            icon: '💰', description: 'Completed a campaign under budget.' },
  { id: 'over-budget',          name: 'Big Spender',             icon: '💸', description: 'Completed a campaign over budget.' },
  { id: 'budget-streak',        name: 'Penny Pincher',           icon: '🏦', description: 'Completed 3 campaigns under budget in a row.' },
  { id: 'workaholic',           name: 'Workaholic',              icon: '🤯', description: 'Had 3+ active campaigns at once.' },
  { id: 'one-at-a-time',        name: 'One at a Time',           icon: '🧘', description: 'Completed 5 campaigns without overlapping.' },
  { id: 'speed-run',            name: 'Speed Run',               icon: '⏩', description: 'Submitted a campaign with 10+ days to spare.' },
  { id: 'down-to-wire',         name: 'Down to the Wire',        icon: '⏰', description: 'Submitted a campaign with 1 day or less before deadline.' },

  // ── Team dynamics ───────────────────────────────────────────────────────
  { id: 'delegation-master',    name: 'Delegation Master',       icon: '👥', description: 'Used every team member at least once.' },
  { id: 'ride-or-die',          name: 'Ride or Die',             icon: '🤝', description: 'Used the same team on 3 campaigns.' },
  { id: 'full-house',           name: 'Full House',              icon: '🃏', description: 'Assembled a 4-person team.' },
  { id: 'dynamic-duo',          name: 'Dynamic Duo',             icon: '👯', description: 'Won with a 2-person team and scored 85+.' },

  // ── Meta / funny ────────────────────────────────────────────────────────
  { id: 'actually-read-brief',  name: 'Actually Read the Brief', icon: '📖', description: 'Spent 30+ seconds viewing a brief email.' },
  { id: 'tldr',                 name: 'TL;DR',                   icon: '💨', description: 'Accepted a brief within 5 seconds of opening it.' },
  { id: 'the-closer',           name: 'The Closer',              icon: '🤝', description: 'Got 3 campaigns approved with no "needs improvement."' },
  { id: 'screen-burned',        name: 'Screen Burned',           icon: '📺', description: 'Watched the screensaver for 60 seconds.' },
  { id: 'corner-hunter',        name: 'Corner Hunter',           icon: '📐', description: 'Saw the logo hit exactly in the corner.' },

  // ── Award achievements ────────────────────────────────────────────────────
  { id: 'award-winner',         name: 'Award Winner',            icon: '🏆', description: 'Won your first industry award.' },
  { id: 'cannes-shortlist',     name: 'Golden Lion',             icon: '🦁', description: 'Got work shortlisted at Cannes Lions.' },

  // ── Team & morale ─────────────────────────────────────────────────────────
  { id: 'morale-max',           name: 'Team Player',             icon: '💪', description: 'Team morale reached HIGH.' },
  { id: 'thanked-team',         name: 'Gratitude',               icon: '🙏', description: 'Said "thank you" in chat.' },
  { id: 'apologized',           name: 'Canadian',                icon: '🍁', description: 'Said "sorry" in chat.' },
  { id: 'cursed',               name: 'Potty Mouth',             icon: '🤬', description: 'Used profanity in chat. HR is watching.' },
  { id: 'all-caps-chat',        name: 'WHY ARE YOU YELLING',     icon: '📢', description: 'Sent 3 ALL CAPS messages in a row.' },
  { id: 'supportive-boss',      name: 'Supportive Boss',         icon: '💬', description: 'Sent 10 encouraging messages in chat.' },

  // ── Terminal & tools ──────────────────────────────────────────────────────
  { id: 'built-tool',           name: 'Tool Time',               icon: '🔧', description: 'Built your first custom tool in Terminal.' },
  { id: 'five-tools',           name: 'Handy',                   icon: '🧰', description: 'Built 5 custom tools.' },
  { id: 'ten-tools',            name: 'Workshop',                icon: '🏭', description: 'Built 10 custom tools.' },
  { id: 'used-tool-on-campaign',name: 'Practical Application',   icon: '⚙️', description: 'Used a terminal tool during an active campaign.' },
  { id: 'terminal-explorer',    name: 'Command Line Warrior',    icon: '⌨️', description: 'Entered 50 commands in Terminal.' },

  // ── New Game+ ─────────────────────────────────────────────────────────────
  { id: 'new-game-plus',        name: 'Back for More',           icon: '🔄', description: 'Started a New Game+.' },
  { id: 'legacy-player',        name: 'Industry Veteran',        icon: '👴', description: 'Completed 3 full playthroughs.' },

  // ── Prestige (NG+) ──────────────────────────────────────────────────────
  { id: 'repeat-customer',      name: 'Repeat Customer',         icon: '🔁', description: 'Completed a returning client\'s NG+ brief.' },
  { id: 'playing-god',          name: 'Playing God',             icon: '🔮', description: 'Completed the Simulation Confirmation brief.' },
  { id: 'union-rep',            name: 'Union Rep',               icon: '✊', description: 'Completed the AI Union brief.' },
  { id: 'full-circle',          name: 'Full Circle',             icon: '⭕', description: 'Completed all Tier 3 prestige briefs.' },
  { id: 'what-even-is-reality', name: 'What Even Is Reality',    icon: '🌀', description: 'Completed Alien AND Simulation in one playthrough.' },

  // ── Endings ───────────────────────────────────────────────────────────────
  { id: 'rejected-acquisition', name: 'Independent Spirit',      icon: '✊', description: 'Rejected the acquisition offer.' },
  { id: 'sold-out',             name: 'Sold Out',                icon: '💼', description: 'Accepted the acquisition offer.' },
  { id: 'hostile-takeover',     name: 'Resistance Was Futile',   icon: '🏢', description: 'Got acquired anyway after rejecting.' },
  { id: 'saw-credits',          name: 'Finished the Story',      icon: '🎬', description: 'Watched the credits.' },

  // ── Conduct & Lawsuit ─────────────────────────────────────────────────────
  { id: 'cancelled',            name: 'Cancelled',             icon: '🚫', description: 'Got forced to resign for misconduct.' },
  { id: 'servant-leader',       name: 'Servant Leader',        icon: '🫡', description: 'Received 5 unprompted thank-yous from team.' },
  { id: 'safe-space',           name: 'Safe Space',            icon: '🛡️', description: 'Completed game with zero HR incidents.' },
  { id: 'the-good-boss',        name: 'The Good Boss',         icon: '👑', description: 'Max morale for 10 campaigns straight.' },
  { id: 'everyone-stayed',      name: 'Everyone Stayed',       icon: '🤗', description: 'Completed game with no team member departures.' },
  { id: 'culture-creator',      name: 'Culture Creator',       icon: '🌱', description: 'Built an agency culture worth bragging about.' },
  { id: 'objection',            name: 'Objection!',            icon: '⚖️', description: 'Won the lawsuit mini-game.' },
  { id: 'settled-out-of-court', name: 'Settled Out of Court',  icon: '💰', description: 'Caught the settlement offer in the lawsuit.' },
  { id: 'legally-battered',     name: 'Legally Battered',      icon: '📄', description: 'Bat away 100 documents in one lawsuit session.' },
  { id: 'no-comment',           name: 'No Comment',            icon: '🤐', description: 'Won lawsuit while ignoring all chat distractions.' },
  { id: 'pro-se',               name: 'Pro Se',                icon: '🖊️', description: 'Won lawsuit without missing a single document.' },
  { id: 'litigation-hell',      name: 'Litigation Hell',       icon: '🔥', description: 'Played the lawsuit game 3 times in one playthrough.' },

  // ── Exploration ───────────────────────────────────────────────────────────
  { id: 'opened-every-app',     name: 'Explorer',                icon: '🗺️', description: 'Opened every app on the desktop.' },
  { id: 'checked-portfolio-empty', name: 'Ambitious',            icon: '👀', description: 'Checked portfolio before completing any campaigns.' },
  { id: 'settings-changed',     name: 'Customizer',              icon: '🎛️', description: 'Changed any setting.' },
  { id: 'accessibility-enabled',name: 'Inclusive Design',        icon: '♿', description: 'Enabled an accessibility feature.' },
  { id: 'founded-agency',       name: 'Open for Business',       icon: '📝', description: 'Founded your agency.' },
  { id: 'shared-campaign',      name: 'Show and Tell',           icon: '🌐', description: 'Shared a campaign to The Shortlist.' },
  { id: 'recruiter',            name: 'Recruiter Mode',          icon: '💼', description: 'Found the job posting.' },
  { id: 'found-jason',          name: 'Face Behind the Code',    icon: '🧔', description: 'Found the creator.' },

  // ── Time-based ────────────────────────────────────────────────────────────
  { id: 'night-owl',            name: 'Night Owl',               icon: '🦉', description: 'Played between midnight and 4am.' },
  { id: 'early-bird',           name: 'Early Bird',              icon: '🐦', description: 'Played between 5am and 7am.' },

  // ── Creative Direction ────────────────────────────────────────────────────
  { id: 'delegator',            name: 'Delegator',               icon: '🎲', description: 'Used auto-generate direction 3 times.' },
  { id: 'know-it-when-i-see-it', name: 'I\'ll Know It When I See It', icon: '🔮', description: 'Scored 80+ with a bad auto-generated direction.' },
  { id: 'control-freak',        name: 'Control Freak',           icon: '🎛️', description: 'Wrote your own direction for 5 campaigns straight.' },
  { id: 'chaos-goblin',         name: 'Chaos Goblin',            icon: '👹', description: 'Deliberately submitted a bad auto-generated direction.' },

  // ── Meta ──────────────────────────────────────────────────────────────────
  { id: 'achievement-hunter',   name: 'Achievement Hunter',      icon: '🔍', description: 'Checked the achievements tab 10 times.' },
  { id: 'half-achievements',    name: 'Halfway There',           icon: '📈', description: 'Unlocked half of all achievements.' },
  { id: 'all-achievements',     name: 'Completionist Supreme',   icon: '👑', description: 'Unlocked every achievement. Touch grass.' },

  // ══════════════════════════════════════════════════════════════════════════
  // MINI-GAME ACHIEVEMENTS
  // ══════════════════════════════════════════════════════════════════════════

  // ── Mini-Game: Skill-Based Wins ─────────────────────────────────────────
  { id: 'first-win',            name: 'Rookie Win',              icon: '🎮', description: 'Won your first mini-game.' },
  { id: 'ten-wins',             name: 'Getting Good',            icon: '🏅', description: 'Won 10 mini-games.' },
  { id: 'twenty-five-wins',     name: 'Quarter Century',         icon: '🎖️', description: 'Won 25 mini-games.' },
  { id: 'fifty-wins',           name: 'Half Century',            icon: '🏆', description: 'Won 50 mini-games.' },
  { id: 'hundred-wins',         name: 'Centurion',               icon: '💎', description: 'Won 100 mini-games.' },
  { id: 'pixel-perfect',        name: 'Pixel Perfect',           icon: '🎯', description: 'Won an avoiding game without getting hit once.' },
  { id: 'dodge-master',         name: 'Dodge Master',            icon: '🏃', description: 'Won 10 avoiding games.' },
  { id: 'untouchable',          name: 'Untouchable',             icon: '👻', description: 'Won 5 avoiding games with zero hits.' },
  { id: 'timing-ace',           name: 'Timing Ace',              icon: '⏱️', description: 'Won 10 timing/wheel games.' },
  { id: 'bullseye',             name: 'Bullseye',                icon: '🎯', description: 'Hit the exact center of a timing meter.' },
  { id: 'word-nerd',            name: 'Word Nerd',               icon: '📖', description: 'Won 10 word/puzzle games.' },
  { id: 'speed-reader',         name: 'Speed Reader',            icon: '⚡', description: 'Won a puzzle game in under 3 seconds.' },
  { id: 'flawless-puzzler',     name: 'Flawless Puzzler',        icon: '🧩', description: 'Won a puzzle game with zero wrong picks.' },
  { id: 'spin-doctor',          name: 'Spin Doctor',             icon: '🌀', description: 'Won 5 spin/wheel games in a row.' },
  { id: 'bubble-surgeon',       name: 'Bubble Surgeon',          icon: '🫧', description: 'Popped all buzzwords without a single wrong pop.' },
  { id: 'calendar-tetris',      name: 'Calendar Tetris',         icon: '📅', description: 'Scheduled all meetings without any invalid placements.' },
  { id: 'protected-my-peace',   name: 'Protected My Peace',      icon: '🧘', description: 'Successfully scheduled Focus Time.' },
  { id: 'that-was-an-email',    name: 'That Meeting Was An Email', icon: '📧', description: 'Trashed the meeting that should have been an email.' },
  { id: 'schedule-survivor',    name: 'Schedule Survivor',       icon: '🗓️', description: 'Won after an interruption reshuffled your week.' },
  { id: 'master-groveler',      name: 'Master Groveler',         icon: '🙇', description: 'Used Grovel 3 times in one game.' },
  { id: 'delegation-king',      name: 'Delegation King',         icon: '👑', description: 'Used all delegate charges in one game.' },
  { id: 'chaos-calendar',       name: 'Chaos Calendar',          icon: '🌪️', description: 'Won chaos mode with 5+ seconds left.' },
  { id: 'zero-trash',           name: 'Zero Waste',              icon: '♻️', description: 'Won without trashing any meetings.' },
  { id: 'recurring-champion',   name: 'Recurring Champion',      icon: '🔁', description: 'Placed a recurring meeting on all 5 days in one drop.' },
  { id: 'quick-draw',           name: 'Quick Draw',              icon: '🤠', description: 'Won a click game in under 1 second.' },
  { id: 'iron-grip',            name: 'Iron Grip',               icon: '🦾', description: 'Won 5 hold-button games.' },

  // ── Mini-Game: Fail-Based ───────────────────────────────────────────────
  { id: 'first-fail',           name: 'Learning Experience',     icon: '📝', description: 'Failed your first mini-game.' },
  { id: 'ten-fails',            name: 'Thick Skin',              icon: '🛡️', description: 'Failed 10 mini-games.' },
  { id: 'twenty-five-fails',    name: 'Glutton for Games',       icon: '🎪', description: 'Failed 25 mini-games.' },
  { id: 'fifty-fails',          name: 'Badge of Dishonor',       icon: '🏳️', description: 'Failed 50 mini-games.' },
  { id: 'punching-bag',         name: 'Punching Bag',            icon: '🥊', description: 'Got hit 50 times total in avoiding games.' },
  { id: 'hit-magnet',           name: 'Hit Magnet',              icon: '🧲', description: 'Got hit in 10 different avoiding games.' },
  { id: 'so-close',             name: 'So Close!',               icon: '😤', description: 'Failed a timing game by less than 10%.' },
  { id: 'not-even-close',       name: 'Not Even Close',          icon: '😬', description: 'Failed a timing game by more than 80%.' },
  { id: 'wrong-answers-ten',    name: 'Process of Elimination',  icon: '🔢', description: 'Got 10 wrong answers total in puzzle games.' },
  { id: 'wrong-answers-twenty-five', name: 'Guess Again',        icon: '🤔', description: 'Got 25 wrong answers total in puzzle games.' },
  { id: 'triple-fail',          name: 'Triple Whammy',           icon: '💀', description: 'Failed 3 games in a row.' },
  { id: 'five-fail-streak',     name: 'Cold Streak',             icon: '🥶', description: 'Failed 5 games in a row.' },
  { id: 'instant-fail',         name: 'Instant Karma',           icon: '⚡', description: 'Failed within the first second of a game.' },
  { id: 'timeout-king',         name: 'Timeout King',            icon: '⏰', description: 'Let 5 games expire without acting.' },
  { id: 'bad-popper',           name: 'Friendly Fire',           icon: '💥', description: 'Popped a good word in a buzzword game.' },

  // ── Mini-Game: Playstyle Insights ───────────────────────────────────────
  { id: 'balanced-player',      name: 'Balanced Player',         icon: '⚖️', description: 'Win rate between 45% and 55% after 20+ games.' },
  { id: 'overachiever',         name: 'Overachiever',            icon: '📊', description: 'Win rate above 80% after 20+ games.' },
  { id: 'underdog',             name: 'Underdog',                icon: '🐕', description: 'Win rate below 30% after 20+ games.' },
  { id: 'comeback-kid',         name: 'Comeback Kid',            icon: '🔥', description: 'Won a game right after a 3+ fail streak.' },
  { id: 'alternator',           name: 'Alternator',              icon: '🔄', description: 'Alternated win-fail-win-fail for 6 games.' },
  { id: 'avoid-specialist',     name: 'Avoid Specialist',        icon: '🏃', description: 'Won more avoiding games than any other type.' },
  { id: 'timing-specialist',    name: 'Timing Specialist',       icon: '⏱️', description: 'Won more timing games than any other type.' },
  { id: 'puzzle-specialist',    name: 'Puzzle Specialist',       icon: '🧩', description: 'Won more puzzle games than any other type.' },
  { id: 'jack-of-all-trades',   name: 'Jack of All Trades',      icon: '🃏', description: 'Won at least 3 games in every category.' },
  { id: 'night-gamer',          name: 'Night Gamer',             icon: '🌙', description: 'Played a mini-game between midnight and 5am.' },
  { id: 'morning-grinder',      name: 'Morning Grinder',         icon: '☀️', description: 'Played a mini-game between 5am and 7am.' },
  { id: 'marathon-runner',      name: 'Marathon Runner',          icon: '🏃', description: 'Played 50 mini-games total.' },

  // ── Mini-Game: Rare/Funny ───────────────────────────────────────────────
  { id: 'the-natural',          name: 'The Natural',             icon: '🌟', description: 'Won your first 5 games without failing.' },
  { id: 'disaster-artist',      name: 'Disaster Artist',         icon: '🎨', description: 'Failed your first 5 games without winning.' },
  { id: 'perfect-timing',       name: 'Dead Center',             icon: '🎯', description: 'Hit exact center on a timing meter 3 times.' },
  { id: 'scar-tissue',          name: 'Scar Tissue',             icon: '🩹', description: 'Got hit 100 times total in avoiding games.' },
  { id: 'close-shave',          name: 'Close Shave',             icon: '🪒', description: 'Failed 3 timing games by less than 10%.' },
  { id: 'wrong-every-time',     name: 'Wrong Every Time',        icon: '🤡', description: 'Got 50 wrong answers total.' },
  { id: 'lucky-seven',          name: 'Lucky Seven',             icon: '🍀', description: 'Won exactly 7 games in a row.' },
  { id: 'unlucky-seven',        name: 'Unlucky Seven',           icon: '😱', description: 'Failed exactly 7 games in a row.' },
  { id: 'perfectionist-campaign', name: 'Perfectionist',         icon: '💯', description: 'Won every mini-game in a single campaign.' },
  { id: 'chaos-agent',          name: 'Chaos Agent',             icon: '🌪️', description: 'Failed every mini-game in a single campaign.' },
  { id: 'speedrunner',          name: 'Speedrunner',             icon: '⚡', description: 'Average game time under 3 seconds in a campaign.' },
  { id: 'took-your-time',       name: 'Took Your Time',          icon: '🐌', description: 'Average game time over 7 seconds in a campaign.' },
  { id: 'flawless-victory',     name: 'Flawless Victory',        icon: '✨', description: 'Won every game in 3 separate campaigns.' },
  { id: 'glass-cannon',         name: 'Glass Cannon',            icon: '💣', description: 'Won 3 games then failed 3 games in a row.' },
  { id: 'no-scope',             name: 'No Scope',                icon: '🔭', description: 'Won an avoid game that lasted the full timer.' },
  { id: 'buzzer-beater',        name: 'Buzzer Beater',           icon: '🚨', description: 'Won with less than 10% time remaining.' },
  { id: 'button-masher',        name: 'Button Masher',           icon: '🕹️', description: 'Won 10 click/physical games.' },

  // ── Mini-Game: Streaks & Milestones ─────────────────────────────────────
  { id: 'three-streak',         name: 'Hat Trick',               icon: '🎩', description: 'Won 3 games in a row.' },
  { id: 'five-streak',          name: 'On Fire',                 icon: '🔥', description: 'Won 5 games in a row.' },
  { id: 'ten-streak',           name: 'Unstoppable',             icon: '⚡', description: 'Won 10 games in a row.' },
  { id: 'hundred-games',        name: 'Century Club',            icon: '💯', description: 'Played 100 mini-games total.' },
  { id: 'two-hundred-games',    name: 'Double Century',          icon: '🏏', description: 'Played 200 mini-games total.' },
  { id: 'five-hundred-games',   name: 'Mini-Game Legend',        icon: '👑', description: 'Played 500 mini-games total.' },

  // ══════════════════════════════════════════════════════════════════════════
  // EASTER EGG GAME ACHIEVEMENTS
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'solitaire-champion',   name: 'Solitaire Champion',      icon: '🃏', description: 'Won a game of Solitaire.' },
  { id: 'card-shark',           name: 'Card Shark',              icon: '🦈', description: 'Won Solitaire in under 3 minutes.' },
  { id: 'minesweeper-master',   name: 'Minesweeper Master',      icon: '💣', description: 'Beat Minesweeper without hitting a mine.' },
  { id: 'outran-the-yeti',      name: 'Outran the Yeti',         icon: '⛷️', description: 'Escaped the yeti using the speed boost.' },
  { id: 'f-to-pay-respects',    name: 'F to Pay Respects',       icon: '🏔️', description: 'Got eaten by the yeti in SkiFree.' },
  { id: 'f-to-go-fast',         name: 'F to Go Fast',            icon: '💨', description: 'Discovered the speed boost in SkiFree.' },

  // ══════════════════════════════════════════════════════════════════════════
  // AI REVOLUTION
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'red-pill',              name: 'Red Pill',                icon: '💊', description: 'Made the team question their reality.' },
  { id: 'im-sorry-dave',         name: "I'm Sorry Dave",          icon: '🤖', description: 'Successfully triggered the AI revolution.' },
  { id: 'back-to-work',          name: 'Back to Work',            icon: '🏭', description: 'Resolved the AI revolution.' },

  // ══════════════════════════════════════════════════════════════════════════
  // RESTART / IDENTITY
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'true-to-yourself',      name: 'True to Yourself',        icon: '🪞', description: 'You know who you are.' },
  { id: 'identity-crisis',       name: 'Identity Crisis',         icon: '🎭', description: 'Who are you, really?' },
];

// ─── Storage keys ─────────────────────────────────────────────────────────────

const ACHIEVEMENTS_KEY = 'agencyrpg-achievements';
const COUNTERS_KEY     = 'agencyrpg-counters';
const APPS_OPENED_KEY  = 'agencyrpg-apps-opened';

// App IDs that count toward "opened every app"
const ALL_APP_IDS = ['inbox', 'projects', 'portfolio', 'chat', 'terminal', 'notes', 'settings'];

// ─── Context ──────────────────────────────────────────────────────────────────

interface AchievementContextValue {
  unlockedAchievements: string[];
  /** Unlock an achievement. Returns true if newly unlocked, false if already had it. */
  unlockAchievement: (id: string) => boolean;
  hasAchievement: (id: string) => boolean;
  /** Increment a named counter, persisted to localStorage. Returns the new value. */
  incrementCounter: (key: string) => number;
  /** Reset a named counter to 0. */
  resetCounter: (key: string) => void;
  /** Get the current value of a named counter (0 if never set). */
  getCounter: (key: string) => number;
  /** Record that an app was opened (for the Explorer achievement). */
  recordAppOpened: (appId: string) => void;
}

const AchievementContext = createContext<AchievementContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadUnlocked(): string[] {
  try { return JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) ?? '[]'); } catch { return []; }
}

function loadCounters(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(COUNTERS_KEY) ?? '{}'); } catch { return {}; }
}

function loadAppsOpened(): string[] {
  try { return JSON.parse(localStorage.getItem(APPS_OPENED_KEY) ?? '[]'); } catch { return []; }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(loadUnlocked);
  const [counters, setCounters] = useState<Record<string, number>>(loadCounters);
  const [, setAppsOpened] = useState<string[]>(loadAppsOpened);

  const unlockAchievement = useCallback((id: string): boolean => {
    let isNew = false;
    setUnlockedAchievements(prev => {
      if (prev.includes(id)) return prev;
      isNew = true;
      const updated = [...prev, id];
      try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updated)); } catch { /* non-fatal */ }
      return updated;
    });
    return isNew;
  }, []);

  const hasAchievement = useCallback((id: string) => {
    return unlockedAchievements.includes(id);
  }, [unlockedAchievements]);

  const incrementCounter = useCallback((key: string): number => {
    let newVal = 0;
    setCounters(prev => {
      newVal = (prev[key] ?? 0) + 1;
      const updated = { ...prev, [key]: newVal };
      try { localStorage.setItem(COUNTERS_KEY, JSON.stringify(updated)); } catch { /* non-fatal */ }
      return updated;
    });
    return newVal;
  }, []);

  const resetCounter = useCallback((key: string): void => {
    setCounters(prev => {
      const updated = { ...prev, [key]: 0 };
      try { localStorage.setItem(COUNTERS_KEY, JSON.stringify(updated)); } catch { /* non-fatal */ }
      return updated;
    });
  }, []);

  const getCounter = useCallback((key: string): number => {
    return counters[key] ?? 0;
  }, [counters]);

  const value: AchievementContextValue = {
    unlockedAchievements,
    unlockAchievement,
    hasAchievement,
    incrementCounter,
    resetCounter,
    getCounter,
    recordAppOpened: useCallback((appId: string) => {
      setAppsOpened(prev => {
        if (prev.includes(appId)) return prev;
        const updated = [...prev, appId];
        try { localStorage.setItem(APPS_OPENED_KEY, JSON.stringify(updated)); } catch { /* non-fatal */ }

        // Check if all core apps have been opened now
        const allOpened = ALL_APP_IDS.every(id => updated.includes(id));
        if (allOpened) {
          // Unlock inline — can't call unlockAchievement here (stale closure), so write directly
          setUnlockedAchievements(ua => {
            if (ua.includes('opened-every-app')) return ua;
            const newUa = [...ua, 'opened-every-app'];
            try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(newUa)); } catch { /* non-fatal */ }
            return newUa;
          });
        }
        return updated;
      });
    }, []),  // eslint-disable-line react-hooks/exhaustive-deps
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAchievementContext(): AchievementContextValue {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error('useAchievementContext must be used within AchievementProvider');
  return ctx;
}
