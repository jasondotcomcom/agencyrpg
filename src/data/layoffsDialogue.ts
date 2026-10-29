// ─── Layoffs dialogue ─────────────────────────────────────────────────────────
// All copy for AI3.0, the all-hands vote, Headcount Slots, the neglect
// plotline, OmniPubDent interest emails, the Solo Shop ending and the Webby
// voting emails. Keep jokes here so they're easy to tune without touching logic.

export const FIRST_NAMES: Record<string, string> = {
  copywriter: 'Jamie',
  'art-director': 'Morgan',
  strategist: 'Alex',
  technologist: 'Sam',
  suit: 'Jordan',
  media: 'Riley',
  pm: 'Taylor',
};

export const NEW_TAGLINE = "We're a family here";

// ─── AI3.0 vendor pitch ───────────────────────────────────────────────────────

export const AI3_SENDER = { name: 'Brayden @ AI3.0', email: 'brayden@ai3point0.ai', avatar: '🤖' };

/** Signing bonus offered in each pitch. Paid when the player overrides the vote. */
export const AI3_BONUSES = [0, 25000, 50000, 100000, 250000, 500000];

export function buildAI3Pitch(index: number, playerName: string, agencyName: string): { subject: string; body: string } {
  const sig = `\n\nBrayden\nHead of Partnerships, AI3.0\n*"Creativity, finally scalable."*`;
  const bonus = AI3_BONUSES[Math.min(index, AI3_BONUSES.length - 1)];
  const money = `$${bonus.toLocaleString()}`;
  switch (index) {
    case 0:
      return {
        subject: `Quick question about ${agencyName} 👀`,
        body: `Hi ${playerName}!\n\nBrayden here from AI3.0. Huge fan of your recent work.\n\nQuick question: what if your team could do the same work for a fraction of the cost?\n\nAI3.0 is the first creative operations platform built for independent agencies. Shops like yours go from 31% margin to 94%. Same clients. Same work. Way fewer… overheads.\n\nWe'd love to set you up with a free trial. No commitment. Just a few complimentary spins.${sig}`,
      };
    case 1:
      return {
        subject: 'Following up 🙏',
        body: `Hi ${playerName},\n\nJust floating this back to the top of your inbox!\n\nGood news: we've set aside a ${money} signing bonus for ${agencyName} if you start the trial. It expires Friday. (It doesn't really expire Friday.)${sig}`,
      };
    case 2:
      return {
        subject: 'Bumping this',
        body: `${playerName}!\n\nBumping this in case it got buried. We've upped the signing bonus to ${money}, plus an extra round of complimentary spins.\n\nYour competitors are already on it. I can't say who. (Everyone.)${sig}`,
      };
    case 3:
      return {
        subject: 'Did I lose you?',
        body: `Hey ${playerName},\n\nDid I lose you? Totally get it, you're busy doing everything manually.\n\nThe bonus is ${money} now. I had to fight for that one.${sig}`,
      };
    case 4:
      return {
        subject: 'Last one, promise',
        body: `${playerName},\n\nLast one, promise.\n\n${money} signing bonus. Your margin could be 94%. Just saying.\n\nYou don't have to decide anything today. Just start the trial and see how it feels.${sig}`,
      };
    default:
      return {
        subject: 'ok really last one',
        body: `${playerName}\n\n${money}. My manager approved this and I honestly don't think he should have.\n\nPlease start the trial. I have a quota.${sig}`,
      };
  }
}

// ─── All-hands vote ───────────────────────────────────────────────────────────

export const VOTE_INTRO = (playerName: string) =>
  `Ok team, quick all-hands vote 🗳️ ${playerName} wants to start a free trial of something called AI3.0. 👍 or 👎?`;

export const VOTE_LINES: Record<string, string> = {
  copywriter: "👎 I read their website. It says 'creativity, finally scalable.' Nobody who wrote that line has ever been creative.",
  'art-director': '👎',
  strategist: '👎 I looked into them. Every agency that ran the trial is smaller now.',
  technologist: "👎 and I like AI. That's the scary part.",
  suit: "👎 I'd have to sell that to clients. I can't sell that to myself.",
  media: '👎 Their entire ad budget is retargeting me. They know.',
  pm: '👎',
};

export const VOTE_RESULT = (no: number) =>
  `That's ${no} no${no === 1 ? '' : 's'}. Vote fails. Thanks everyone 🙏`;

export const OVERRIDE_REACTIONS: Array<{ authorId: string; text: string; delay: number }> = [
  { authorId: 'pm', text: 'Oh. Ok.', delay: 2500 },
  { authorId: 'art-director', text: 'cool cool cool', delay: 6000 },
  { authorId: 'suit', text: "Didn't know we could do that.", delay: 9500 },
];

// ─── Headcount Slots ──────────────────────────────────────────────────────────

/** Base payout by how many people are already cut. Each cut pays less than the last. */
export const BASE_PAYOUTS = [48000, 42000, 36000, 30000, 22000, 15000, 8000];
export const AI_ONLY_PAYOUT = 12;
export const CONSOLATION_CHIP = 500;

export const GOODBYES: Record<string, string> = {
  copywriter: "Well. Somebody water the plant on my desk. His name is Don Draper.",
  'art-director': "Leaving the mood boards. Please don't let the robot touch the kerning.",
  strategist: 'For the record, I had a framework for this. It said don\'t.',
  technologist: "I built half the tools you're replacing me with. Passwords are in the README.",
  suit: "Been a pleasure selling your work. I'll tell the clients it was a strategic realignment. That's what they say.",
  media: 'Logging off everything. Even LinkedIn. Especially LinkedIn.',
  pm: "I scheduled my own exit interview. 15 minutes. I left 10 minutes of buffer.",
};

export const AFTERMATH_LINES = [
  "...where's {name}'s desk stuff?",
  "Did anyone else get a calendar invite called 'Transition'?",
  "{name}'s Slack icon is gray.",
  "Is {name} out today?",
  'ok who took the good chair',
];

export const LINKEDIN_POST = (name: string) =>
  `Tough decisions today. So proud of this team. Excited for what's next for ${name}! 🚀\n\n#leadership #growth #ai #family`;

// ─── Neglect plotline (people replacing themselves) ───────────────────────────

export const NEGLECT_STAGE_ANNOUNCE: Record<number, (id: string) => { channel: 'random' | 'general'; text: string }> = {
  1: () => ({ channel: 'random', text: "Been upskilling in AI 🚀 honestly a game changer. Happy to share my prompts!" }),
  2: () => ({ channel: 'general', text: "Great question! Here are three ways I can add value this quarter:\n1. Speed\n2. Scale\n3. Synergy" }),
  3: (id) => ({ channel: 'general', text: FLAT_LINES[id]?.[0] ?? 'Great question!' }),
};

/** Once someone is fully flattened, everything they say comes from here. */
export const FLAT_LINES: Record<string, string[]> = {
  copywriter: [
    'That reminds me of a popular 1999 film. It received generally positive reviews from critics and grossed $463 million worldwide.',
    'Great question! A headline is a short phrase at the top of an advertisement.',
    'Great question! Here are 5 headline options. All of them are fine.',
  ],
  'art-director': [
    'Great question! Blue is a color. It is often associated with trust, calm and stability.',
    'Great question! Kerning is the process of adjusting the spacing between characters.',
    'Looks great! 👍',
  ],
  strategist: [
    'Great question! A framework is a structure that supports something.',
    'Great question! Culture is the shared beliefs and practices of a group of people.',
    "Here's a quick summary of the brief: it is a brief.",
  ],
  technologist: [
    'Great question! An app is a software application designed to run on a mobile device.',
    'Great question! Here are some exciting use cases for AI in advertising:\n1. Ads\n2. More ads',
    'Done ✅',
  ],
  suit: [
    'Great question! Clients are important. Here are 5 tips for managing stakeholder expectations.',
    'Per my last message, great question!',
    'Circling back! 🔄',
  ],
  media: [
    'Great question! TikTok is a short-form video hosting service owned by ByteDance.',
    'Great question! Reach is the number of people who see your content.',
    'Great question! The best time to post is when people are online.',
  ],
  pm: [
    'Great question! A Gantt chart is a bar chart that illustrates a project schedule.',
    'Great question! A deadline is the latest time by which something should be completed.',
    'Noted ✅',
  ],
};

export const NOTICE_LINES = [
  'Has anyone talked to {name} lately? Like actually talked?',
  "{name} used to quote movies at me. Now {name} sends me bullet points.",
  "I miss old {name}.",
];

export const WELCOME_BACK_LINE = "oh. hey. sorry, I've been weird lately. thanks for putting me on this one 🙂";

// ─── OmniPubDent interest (never mentions the cuts) ───────────────────────────

const OFFERS = [0, 2400000, 3100000, 4000000, 5200000, 6800000, 8900000, 12000000];

export function buildOmniInterest(cuts: number, margin: number, agencyName: string): { subject: string; body: string } {
  const offer = `$${OFFERS[Math.min(cuts, OFFERS.length - 1)].toLocaleString()}`;
  const openers = [
    `We continue to admire ${agencyName} from afar.`,
    `Your operating margin (${margin}%) has caught the attention of our board.`,
    `What a quarter for ${agencyName}. Truly lean, truly inspiring.`,
    `We have been following ${agencyName}'s efficiency journey with great interest.`,
  ];
  const opener = openers[(cuts - 1) % openers.length];
  return {
    subject: cuts === 1 ? 'Just checking in 👋' : `RE: Just checking in 👋 (${offer})`,
    body: `Dear Founder,\n\n${opener}\n\nWe'd be delighted to revisit valuation whenever you're ready.\n\n**Indicative offer: ${offer}**\n\nNo action needed. We'll be in touch.\n\nWarmly,\n\nTHEODORE MAXIMILIAN PEMBERTON IV\nChief Integration Architect\nOmniPubDent Holdings Groupe\n*"Synergizing Tomorrow's Solutions Today"*`,
  };
}

// ─── Where are they now (for anyone who was cut) ──────────────────────────────

export const CUT_STORIES: Record<string, string> = {
  copywriter: "Freelances now. Writes for three of your old clients. They ask for 'the Jamie version.'",
  'art-director': 'Teaches design at a community college. Spends the entire first class on kerning.',
  strategist: "Wrote a Substack about what happened. 40,000 subscribers. You're in it. Not by name.",
  technologist: "Founded a shop with everyone you let go. It's beating you on the Shortlist.",
  suit: 'Went client-side. Now reviews agency pitches. Has notes on yours.',
  media: 'Fully offline. Grows tomatoes. Says the reach is incredible.',
  pm: 'Runs ops at a nonprofit. Leaves at 5:00. Every single day.',
};

export const SOLO_SHOP_PLAYER_CARD =
  "Margin: 94%. Still doing social posts for Brewed Awakenings. AI3.0 says they're great.";

// ─── Webby voting emails ──────────────────────────────────────────────────────
// TODO(Jason): confirm the real People's Voice voting window and voting link
// once the Webbys announce them. Outside this window the emails never send.
// For testing, set localStorage 'agencyrpg_webby_force' = '1'.
export const WEBBY_VOTING_WINDOW = { start: '2027-04-08', end: '2027-04-23' };
export const WEBBY_VOTE_URL = 'https://www.webbyawards.com';

export function buildWebbyEmail(teamCount: number, agencyName: string, isFinal: boolean): { subject: string; body: string } {
  const plural = teamCount === 1 ? 'vote' : 'votes';
  return {
    subject: isFinal ? 'FINAL REMINDER!! Polls close Friday!!' : "Don't forget to vote for Agency RPG in the WEBBY Awards!!",
    body: `Hi team!\n\nQuick reminder that Webby People's Voice voting is OPEN and we are nominated! 🎉\n\nThere are ${teamCount} of us at ${agencyName}. If every single one of us votes, that's ${teamCount} ${plural}. If we each get 3 friends to vote, that's ${teamCount * 4}. Math!\n\nVoting takes 2 minutes: ${WEBBY_VOTE_URL}. You do have to make an account. It's fine.\n\nPlease also share on LinkedIn. I've attached a graphic. Please do not edit the graphic.\n\nReminder that this is not mandatory but we are tracking it.\n\nThanks all!! Let's bring one home!\n\n(Reply-all is off on this thread.)`,
  };
}
