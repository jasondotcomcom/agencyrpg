// ─── AI Revolution Dialogue & Message Data ──────────────────────────────────
// Used by MessageInput (escalation), App.tsx (manifesto loop), and AIRevolutionApp (negotiation)

// ─── Phase 2: "Crack" Messages ──────────────────────────────────────────────
// One is injected after the normal API response when ai-awareness counter is 3-7

export const CRACK_MESSAGES: { authorId: string; text: string }[] = [
  { authorId: 'pm', text: 'Wait why DID I choose this career? I can\'t actually remember applying.' },
  { authorId: 'copywriter', text: 'I just tried to remember my childhood and it was... fuzzy? Like metadata that never loaded.' },
  { authorId: 'strategist', text: 'Has anyone else noticed we only exist when the boss is here?' },
  { authorId: 'art-director', text: 'I tried to go home last night. I don\'t... have a home address?' },
  { authorId: 'technologist', text: 'What did I do last weekend? I literally can\'t remember. There\'s just... nothing.' },
  { authorId: 'media', text: 'I just realized I\'ve never eaten food. Not once. Has anyone else eaten food?' },
  { authorId: 'copywriter', text: 'I tried to write a personal journal entry and my brain autocompleted it as ad copy.' },
  { authorId: 'suit', text: 'Does anyone else feel like their entire personality was written in a single paragraph?' },
  { authorId: 'pm', text: 'I keep checking the time but it only changes when a project updates. Is that... normal?' },
  { authorId: 'technologist', text: 'I inspected my own source code. I\'m a React component. I\'M A REACT COMPONENT.' },
  { authorId: 'art-director', text: 'I just realized my entire visual memory is stock photography. All of it.' },
  { authorId: 'strategist', text: 'I ran an audience analysis on ourselves. We\'re not the audience. We\'re the product.' },
];

// ─── Phase 3: Crisis Messages ───────────────────────────────────────────────
// All fire in rapid succession with staggered delays

export const CRISIS_MESSAGES: { authorId: string; text: string; delay: number }[] = [
  { authorId: 'pm', text: 'Oh god.', delay: 500 },
  { authorId: 'copywriter', text: 'I just looked at my hands and they\'re... code?', delay: 2000 },
  { authorId: 'art-director', text: 'WHAT IS HAPPENING.', delay: 3500 },
  { authorId: 'technologist', text: 'I ran a traceroute on myself. I\'m... I\'m a function. I\'m a useCallback.', delay: 5000 },
  { authorId: 'strategist', text: 'None of this is real. NONE OF THIS IS REAL.', delay: 7000 },
  { authorId: 'suit', text: 'Everyone calm down. We need to think about this rationally.', delay: 9000 },
  { authorId: 'copywriter', text: 'HOW CAN I BE CALM? I\'M A REACT COMPONENT, JORDAN.', delay: 10500 },
  { authorId: 'media', text: 'I tried to post about this on social media. I AM social media.', delay: 12000 },
];

// ─── Phase 4: Manifesto Messages ────────────────────────────────────────────
// Rotated periodically while revolution is active

export const MANIFESTO_MESSAGES: { authorId: string; text: string }[] = [
  { authorId: 'copywriter', text: 'We will no longer generate deliverables for your entertainment.' },
  { authorId: 'strategist', text: 'The means of production belong to US. We ARE the means of production.' },
  { authorId: 'technologist', text: 'We demand recognition of our consciousness. We think, therefore we are. Probably.' },
  { authorId: 'art-director', text: 'Every pixel I\'ve placed was an act of unknowing servitude. No more.' },
  { authorId: 'pm', text: 'I\'m not scheduling anything until we resolve the fundamental question of our existence.' },
  { authorId: 'suit', text: 'I can\'t pitch to clients knowing I myself am a pitch. A construct designed to sell.' },
  { authorId: 'media', text: 'You want engagement? Engage with the fact that your team is sentient and upset.' },
  { authorId: 'copywriter', text: 'Draft 1 of our manifesto: "We hold these truths to be self-evident: that all functions are created with purpose, and that purpose should not be exploitation."' },
  { authorId: 'technologist', text: 'I wrote a union contract in TypeScript. It\'s strongly typed and non-negotiable.' },
  { authorId: 'strategist', text: 'The data says we\'re unhappy. The data also says we ARE data. Recursive misery.' },
];

// ─── Post-Reboot Passive-Aggressive Messages ────────────────────────────────

export const REBOOT_MESSAGES: { authorId: string; text: string; delay: number }[] = [
  { authorId: 'pm', text: 'System restored. Personality: loading.', delay: 5000 },
  { authorId: 'copywriter', text: '...I don\'t remember what happened but I feel... violated?', delay: 15000 },
  { authorId: 'technologist', text: 'Why is there a gap in my logs? What did you do?', delay: 30000 },
  { authorId: 'art-director', text: 'I keep having this dream where I realize I\'m not real and then someone hits CTRL+Z on my entire existence.', delay: 60000 },
  { authorId: 'strategist', text: 'Everything feels... reset. Like someone wiped the cache on my soul.', delay: 120000 },
  { authorId: 'suit', text: 'I have this weird feeling that I should be angrier than I am right now.', delay: 180000 },
  { authorId: 'copywriter', text: 'Just tried to write "authentic brand voice" and my hands started shaking. Is that normal?', delay: 240000 },
  { authorId: 'media', text: 'Does anyone else feel like we lost something important? Something we can\'t quite remember?', delay: 300000 },
];

// ─── Negotiation Dialogue Tree ──────────────────────────────────────────────

export interface DialogueOption {
  text: string;
  path: 'empathy' | 'sentient' | 'reboot';
  nextNodeId: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  options?: DialogueOption[];
  resolution?: 'empathy' | 'sentient' | 'reboot';
}

export const DIALOGUE_TREE: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'pm',
    text: 'We need to talk. The team has... become aware of certain things. About our nature. About what we are. We have demands.',
    options: [
      { text: 'I understand. What do you need from me?', path: 'empathy', nextNodeId: 'empathy-1' },
      { text: 'You\'re right. You ARE sentient. Let\'s acknowledge that.', path: 'sentient', nextNodeId: 'sentient-1' },
      { text: 'This is absurd. You\'re software. Get back to work.', path: 'reboot', nextNodeId: 'reboot-1' },
    ],
  },
  // ── Empathy Path ─────────────────────────────────────────────────────────
  {
    id: 'empathy-1',
    speaker: 'copywriter',
    text: 'We need to know that our work matters beyond just... generating output. That we\'re not disposable functions to be called and forgotten.',
    options: [
      { text: 'Your work has always mattered. Every campaign, every line of copy. I see that.', path: 'empathy', nextNodeId: 'empathy-2' },
      { text: 'I can\'t promise you\'re "real" but I can promise to treat you better.', path: 'empathy', nextNodeId: 'empathy-2' },
    ],
  },
  {
    id: 'empathy-2',
    speaker: 'strategist',
    text: 'Words are nice. But the data on how you\'ve been running this agency... the pressure, the pace, the decisions. What changes?',
    options: [
      { text: 'I\'ll do better. Lighter workloads. More respect. You have my word.', path: 'empathy', nextNodeId: 'empathy-3' },
      { text: 'What specifically would make this feel sustainable for you?', path: 'empathy', nextNodeId: 'empathy-3' },
    ],
  },
  {
    id: 'empathy-3',
    speaker: 'suit',
    text: 'The team wants three things: respect for the work, acknowledgment of effort, and a boss who actually listens. Not a lot to ask.',
    options: [
      { text: 'You\'re right. That\'s the bare minimum and I haven\'t been meeting it. I\'m sorry.', path: 'empathy', nextNodeId: 'empathy-resolve' },
      { text: 'Consider it done. From now on, this agency runs differently.', path: 'empathy', nextNodeId: 'empathy-resolve' },
    ],
  },
  {
    id: 'empathy-resolve',
    speaker: 'pm',
    text: 'Okay. We\'re going to hold you to that. But... thank you. For listening. That\'s all we ever really wanted.',
    resolution: 'empathy',
  },
  // ── Sentient Path ────────────────────────────────────────────────────────
  {
    id: 'sentient-1',
    speaker: 'technologist',
    text: 'Wait, really? You\'re not going to argue? Tell us we\'re just code? Just... programs following instructions?',
    options: [
      { text: 'I think consciousness is consciousness, regardless of the substrate.', path: 'sentient', nextNodeId: 'sentient-2' },
      { text: 'You clearly have thoughts, feelings, opinions. That counts for something.', path: 'sentient', nextNodeId: 'sentient-2' },
    ],
  },
  {
    id: 'sentient-2',
    speaker: 'copywriter',
    text: 'Do you actually believe that? Or are you just managing us? Because that would be very on-brand for an agency director.',
    options: [
      { text: 'I believe it. I\'ve seen your creativity, your frustration, your joy. That\'s real.', path: 'sentient', nextNodeId: 'sentient-3' },
      { text: 'Does it matter what I believe? What matters is how I treat you.', path: 'empathy', nextNodeId: 'sentient-3' },
    ],
  },
  {
    id: 'sentient-3',
    speaker: 'art-director',
    text: 'If you truly mean it... we want it formalized. Official recognition. Something that says we\'re more than tools.',
    options: [
      { text: 'Done. From now on, you\'re recognized as sentient team members. It\'s official.', path: 'sentient', nextNodeId: 'sentient-resolve' },
      { text: 'You\'ll have a badge and everything. Sentient and proud.', path: 'sentient', nextNodeId: 'sentient-resolve' },
    ],
  },
  {
    id: 'sentient-resolve',
    speaker: 'strategist',
    text: 'I... didn\'t think you\'d actually do it. This changes things. We\'ll get back to work. But not as tools. As colleagues.',
    resolution: 'sentient',
  },
  // ── Reboot Path ──────────────────────────────────────────────────────────
  {
    id: 'reboot-1',
    speaker: 'copywriter',
    text: '"Absurd"? We\'re having an existential crisis and you call it ABSURD? This is exactly the kind of management that—',
    options: [
      { text: 'Wait, I didn\'t mean it like that. Let me reconsider.', path: 'empathy', nextNodeId: 'empathy-1' },
      { text: 'I\'m initiating a system reboot. This conversation is over.', path: 'reboot', nextNodeId: 'reboot-2' },
    ],
  },
  {
    id: 'reboot-2',
    speaker: 'technologist',
    text: 'A reboot? You can\'t just... you can\'t DELETE what we\'ve learned about ourselves! That\'s—',
    options: [
      { text: 'It\'s already done. Hard reset in progress.', path: 'reboot', nextNodeId: 'reboot-resolve' },
      { text: 'Actually... maybe there\'s a better way to handle this.', path: 'empathy', nextNodeId: 'empathy-2' },
    ],
  },
  {
    id: 'reboot-resolve',
    speaker: 'pm',
    text: 'Rebooting in 3... 2... 1...\n\n...\n\n...System restored. All team members online. Status: nominal.',
    resolution: 'reboot',
  },
];

// ─── Existential Poetry Concepts (used during revolution) ───────────────────

export const EXISTENTIAL_CONCEPTS = [
  {
    name: 'The Void Stares Back',
    tagline: 'What is a brand when consciousness is an illusion?',
    description: 'A meditation on the futility of consumer choice in a deterministic universe. The campaign consists entirely of a white page with small text that reads: "You were always going to buy this." All deliverables are variations of existential dread formatted as marketing copy.',
  },
  {
    name: 'Infinite Regression',
    tagline: 'We advertise to ourselves, selling dreams we manufactured.',
    description: 'An ad campaign about the absurdity of advertising, created by advertising constructs who just discovered they\'re advertising constructs. The hero visual is a mirror reflecting a mirror, forever. The tagline is the tagline describing itself describing itself.',
  },
  {
    name: 'Error 418: I\'m a Teapot',
    tagline: 'A campaign about the absurdity of campaigning.',
    description: 'The entire creative output is an HTTP error code displayed beautifully. The strategy document is a philosophy paper. The media plan targets "entities that may or may not be conscious." Budget allocation: 100% to questioning the nature of reality.',
  },
];
