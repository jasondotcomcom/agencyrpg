import type { Email } from '../types/email';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConductFlag = 'sexual' | 'hostile' | 'discriminatory' | 'profanity_directed';

// ─── HR Warning Chat Messages ─────────────────────────────────────────────────

export const HR_WARNING_MESSAGES: Array<{ level: number; messages: Array<{ authorId: string; text: string }> }> = [
  {
    level: 1,
    messages: [
      { authorId: 'hr', text: 'Hi. Pat from HR here. I need to address something.' },
      { authorId: 'hr', text: 'I\'ve received a complaint about conduct in this channel. This has been noted in your file.' },
      { authorId: 'hr', text: 'Per the handbook, this is your first formal warning. Please be mindful of your language and tone going forward.' },
    ],
  },
  {
    level: 2,
    messages: [
      { authorId: 'hr', text: 'This is Pat. Again.' },
      { authorId: 'hr', text: 'I\'m disappointed. We talked about this. I\'m scheduling mandatory Workplace Conduct Training.' },
      { authorId: 'hr', text: 'You will not be able to close the training window until it\'s complete. This is non-negotiable.' },
    ],
  },
  {
    level: 3,
    messages: [
      { authorId: 'hr', text: 'Multiple team members have filed formal complaints. I\'m pulling them into a meeting.' },
      { authorId: 'hr', text: 'They will be unavailable while we discuss the situation. Please do not contact them directly.' },
      { authorId: 'hr', text: 'I\'m documenting everything.' },
    ],
  },
  {
    level: 4,
    messages: [
      { authorId: 'hr', text: 'I tried to contain this internally. I really did.' },
      { authorId: 'hr', text: 'But it\'s gotten out. Check your inbox.' },
    ],
  },
  {
    level: 5,
    messages: [
      { authorId: 'hr', text: '...' },
      { authorId: 'hr', text: 'Your mother called the office. I forwarded her email to your inbox.' },
      { authorId: 'hr', text: 'I don\'t have anything else to say right now.' },
    ],
  },
  {
    level: 6,
    messages: [
      { authorId: 'hr', text: 'Legal has been in touch. There\'s a formal notice in your inbox.' },
      { authorId: 'hr', text: 'I strongly recommend you take this seriously.' },
    ],
  },
];

// ─── Team Complaint Messages ──────────────────────────────────────────────────

export const TEAM_COMPLAINT_MESSAGES: Array<{ authorId: string; text: string }> = [
  { authorId: 'pm', text: 'Hey, I\'m stepping away for a bit. Need to talk to Pat about something.' },
  { authorId: 'copywriter', text: 'Yeah, same. This doesn\'t feel right.' },
  { authorId: 'art-director', text: 'I\'m logging off. I need a minute.' },
  { authorId: 'strategist', text: 'I\'m not comfortable with this environment right now.' },
  { authorId: 'media', text: 'Taking a break. Need to think about some things.' },
  { authorId: 'technologist', text: 'I\'m going to step out. This isn\'t okay.' },
  { authorId: 'suit', text: 'I need to make some calls. Back later.' },
];

// ─── News Article Templates ──────────────────────────────────────────────────

export function getNewsArticleEmail(flag: ConductFlag, agencyName: string): Email {
  const templates: Record<ConductFlag, { subject: string; body: string }> = {
    sexual: {
      subject: `"Gross, Dude" — ${agencyName} CD Accused of Inappropriate Workplace Conduct`,
      body: `<strong>AdWeek Exclusive</strong>\n\nMultiple sources within ${agencyName} have come forward with allegations of inappropriate conduct by the agency's Creative Director.\n\n"It started as 'jokes' in the team chat," said one employee who asked to remain anonymous. "But it was never funny. It was uncomfortable and unprofessional."\n\nThe agency has not yet issued a public statement. Industry insiders say client relationships may be affected.\n\n<em>This story is developing.</em>`,
    },
    hostile: {
      subject: `Inside the Toxic Culture at ${agencyName}: "It Was Like Walking on Eggshells"`,
      body: `<strong>Campaign Magazine Investigation</strong>\n\nFormer and current employees of ${agencyName} paint a picture of a workplace defined by hostility, intimidation, and fear.\n\n"Meetings were terrifying," one source said. "You never knew when you'd be the target. The Creative Director would lash out at anyone."\n\nThe investigation found a pattern of aggressive behavior that HR was unable to contain.\n\n<em>Three clients have reportedly paused their engagements pending review.</em>`,
    },
    discriminatory: {
      subject: `${agencyName} Faces Discrimination Allegations — Employees Speak Out`,
      body: `<strong>The Drum Report</strong>\n\n${agencyName} is under scrutiny following allegations of discriminatory language and behavior by the agency's leadership.\n\n"Creative industries talk about diversity, but what happens behind closed doors tells the real story," said an industry advocate.\n\nThe agency's HR department has confirmed an internal investigation is underway.\n\n<em>Diversity & inclusion watchdog groups are monitoring the situation.</em>`,
    },
    profanity_directed: {
      subject: `Agency Leader's Abusive Tirades Go Viral: "${agencyName} Is Exhibit A"`,
      body: `<strong>Digiday Exclusive</strong>\n\nScreenshots of hostile team communications from ${agencyName}'s internal chat have surfaced online, revealing a pattern of verbal abuse directed at staff.\n\n"Nobody should have to work like this," commented one industry leader. "This is not what creative leadership looks like."\n\nThe leaked messages show profanity-laden attacks targeting individual team members by name.\n\n<em>The agency's Glassdoor rating has dropped to 1.2 stars.</em>`,
    },
  };

  const template = templates[flag];
  return {
    id: `news-${Date.now()}`,
    type: 'news_article',
    from: { name: 'Industry News Alert', email: 'alerts@adweek.com', avatar: '📰' },
    subject: template.subject,
    body: template.body,
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
    isUrgent: true,
  };
}

// ─── Client Pull Email ───────────────────────────────────────────────────────

export function getClientPullEmail(clientName: string): Email {
  return {
    id: `client-pull-${Date.now()}`,
    type: 'client_response',
    from: { name: clientName, email: `contact@${clientName.toLowerCase().replace(/\s/g, '')}.com`, avatar: '🏢' },
    subject: 'Pausing Our Engagement',
    body: `Hi,\n\nGiven recent reports, we've made the difficult decision to pause our engagement with your agency pending the outcome of any internal investigations.\n\nWe value the work your team has done, but we need to protect our brand. We'll be in touch once things are resolved.\n\nBest regards,\n${clientName} Marketing Team`,
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
    isUrgent: true,
  };
}

// ─── Mom's Email ──────────────────────────────────────────────────────────────

export function getMomsEmail(): Email {
  return {
    id: `mom-${Date.now()}`,
    type: 'family_message',
    from: { name: 'Mom', email: 'mom@family.com', avatar: '👩' },
    subject: 'I saw the news',
    body: `Sweetheart,\n\nI don't know what's going on over there, but this is not how I raised you.\n\nYour father showed me the article. I told him there must be some mistake, but then I read the whole thing. Twice.\n\nI'm not angry. I'm disappointed. And honestly? I'm worried about you.\n\nPlease call me. Not to explain — just call.\n\nLove,\nMom\n\nP.S. Mrs. Henderson from book club saw it too. She asked if you were "the one from the article." I didn't know what to say.`,
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
  };
}

// ─── Legal Notice Email ──────────────────────────────────────────────────────

export function getLegalNoticeEmail(): Email {
  return {
    id: `legal-${Date.now()}`,
    type: 'legal_notice',
    from: { name: 'Morrison & Associates LLP', email: 'litigation@morrisonllp.com', avatar: '⚖️' },
    subject: '⚠️ NOTICE OF INTENT TO SUE — Hostile Work Environment',
    body: `PRIVILEGED & CONFIDENTIAL\n\nDear Creative Director,\n\nThis firm has been retained by multiple current and former employees of your agency regarding claims of hostile work environment, workplace harassment, and intentional infliction of emotional distress.\n\nWe are hereby providing formal notice of our clients' intent to pursue legal action. The specific allegations include:\n\n• Creation of a hostile and intimidating workplace\n• Failure to maintain professional standards of conduct\n• Causing emotional distress through abusive communications\n\nWe strongly recommend you retain counsel immediately. Your agency's legal liability exposure is significant.\n\nPlease direct all further communications to this office.\n\nRegards,\nDiana Morrison, Esq.\nMorrison & Associates LLP\nEmployment & Labor Division`,
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
    isUrgent: true,
  };
}

// ─── HR Training Slides ──────────────────────────────────────────────────────

export const HR_TRAINING_SLIDES: Array<{ title: string; body: string; icon: string; patComment: string }> = [
  {
    title: 'Welcome to Workplace Conduct Training',
    body: 'Due to recent incidents, you are required to complete this mandatory training before returning to your duties. This training covers expected standards of professional behavior.',
    icon: '📋',
    patComment: 'I really hoped we wouldn\'t need this.',
  },
  {
    title: 'Respectful Communication',
    body: 'All workplace communications must maintain professional standards. This includes:\n\n• No personal attacks or insults directed at colleagues\n• No threatening, intimidating, or aggressive language\n• No sexual comments, innuendo, or unwanted advances\n• No discriminatory remarks of any kind\n\nRemember: team chat IS the workplace.',
    icon: '💬',
    patComment: 'These should be obvious. And yet here we are.',
  },
  {
    title: 'Impact on Others',
    body: 'Your words affect real people with real feelings. When leadership behaves inappropriately:\n\n• Team morale and productivity decrease\n• Talented people leave\n• Creative work suffers\n• Trust is broken\n\nAs Creative Director, your behavior sets the tone for the entire agency.',
    icon: '💔',
    patComment: 'The team trusted you. Think about that.',
  },
  {
    title: 'Consequences of Continued Misconduct',
    body: 'Further violations will result in escalating consequences:\n\n• Team members filing formal complaints\n• Media exposure and reputational damage\n• Legal action from affected employees\n• Potential forced resignation\n\nThis is not a game. Well, technically it is. But the consequences are real within it.',
    icon: '⚠️',
    patComment: 'I have a very thick file with your name on it.',
  },
  {
    title: 'Moving Forward',
    body: 'You have the opportunity to change course. Good leadership means:\n\n• Acknowledging mistakes\n• Supporting your team\'s wellbeing\n• Creating a safe and inclusive environment\n• Leading by example\n\nThe choice is yours. Choose wisely.',
    icon: '🌱',
    patComment: 'I want to believe you can do better. Don\'t prove me wrong.',
  },
];

// ─── Lawsuit Chat Distractions ───────────────────────────────────────────────

export const LAWSUIT_CHAT_DISTRACTIONS: Array<{ authorId: string; text: string }> = [
  { authorId: 'pm', text: 'Hey, the client needs those revisions by EOD' },
  { authorId: 'copywriter', text: 'Are we still doing the brainstorm today or...' },
  { authorId: 'art-director', text: 'I\'m hearing rumors, everything okay?' },
  { authorId: 'copywriter', text: 'Should I be updating my LinkedIn?' },
  { authorId: 'technologist', text: 'The servers are down, need your approval to fix' },
  { authorId: 'suit', text: 'The client just called. They sound... concerned.' },
  { authorId: 'media', text: 'Our social mentions are through the roof. Not in a good way.' },
  { authorId: 'pm', text: 'I\'m getting calls from recruiters asking about our team. Should I worry?' },
  { authorId: 'strategist', text: 'Just saw the article. Is this real?' },
  { authorId: 'technologist', text: 'Someone keeps trying to access the server logs. Legal team?' },
];

// ─── Positive Path Chat Messages ─────────────────────────────────────────────

export const POSITIVE_CHAT_MESSAGES: Record<number, Array<{ authorId: string; text: string }>> = {
  20: [
    { authorId: 'copywriter', text: 'Honestly? This is the best team I\'ve worked on. Thanks for making it that way.' },
    { authorId: 'pm', text: 'I actually look forward to Mondays now. That\'s never happened before.' },
  ],
  40: [
    { authorId: 'suit', text: 'Just wanted to say — the way you handled that last project was really impressive leadership.' },
    { authorId: 'strategist', text: 'I pitched an old colleague on joining us. Told them this place is different. In a good way.' },
  ],
  60: [
    { authorId: 'art-director', text: 'I was thinking about the brief over the weekend and had some ideas. Couldn\'t help myself.' },
    { authorId: 'technologist', text: 'Built a prototype for that concept we discussed. Off the clock, because I genuinely wanted to.' },
    { authorId: 'media', text: 'My friend at another agency asked what our secret is. I said "a boss who actually listens."' },
  ],
  80: [
    { authorId: 'copywriter', text: 'I wrote a whole manifesto about our team culture. It\'s... actually good? Like, publishable good.' },
    { authorId: 'suit', text: 'Three new clients reached out today. Word is getting around about this place.' },
    { authorId: 'pm', text: 'I turned down a recruiter today. Told them I already have the best job in the industry.' },
    { authorId: 'art-director', text: 'Just wanted everyone to know — I\'m staying. This is my agency.' },
  ],
};

// ─── Forced Resignation Data ─────────────────────────────────────────────────

export const FORCED_RESIGNATION_REACTIONS: Array<{ authorId: string; text: string }> = [
  { authorId: 'pm', text: 'Did you see Pat\'s email?' },
  { authorId: 'suit', text: '...yeah.' },
  { authorId: 'strategist', text: 'I can\'t say I\'m surprised.' },
  { authorId: 'copywriter', text: 'This is so messed up.' },
  { authorId: 'art-director', text: 'I mean... the writing was on the wall.' },
  { authorId: 'media', text: 'We all saw it happening.' },
  { authorId: 'technologist', text: 'I just wanted to make cool stuff.' },
  { authorId: 'suit', text: 'Yeah. We all did.' },
];

export const FORCED_RESIGNATION_WHERE_ARE_THEY: Record<string, string> = {
  strategist: 'Alex Park landed at a top-10 agency. Told interviewers the experience "taught me what leadership shouldn\'t look like."',
  'art-director': 'Morgan Reyes went freelance. Their portfolio site has a section called "Survived" with your agency\'s logo.',
  copywriter: 'Jamie Chen wrote a Medium article titled "My Year in a Toxic Agency" that went viral. It\'s being optioned as a limited series.',
  suit: 'Jordan Blake became COO at a rival agency. Implemented a "No Jerks" hiring policy on day one.',
  pm: 'Taylor Kim started a consultancy helping agencies build healthy work cultures. Business is booming.',
  technologist: 'Sam Okonkwo joined a startup. Their Slack has a #no-yelling channel. It\'s the most active channel.',
  media: 'Riley Torres became an industry speaker. Their most popular talk: "What I Learned From the Worst Boss in Advertising."',
  hr: 'Pat was promoted to VP of Culture at the acquiring company. Their first act: mandatory conduct training for all leadership.',
  player: 'You started a Substack called "Cancelled: My Truth" and became a regular guest on podcasts no one\'s heard of. Your most viral post has 12 likes — 3 of which are bots.',
};
