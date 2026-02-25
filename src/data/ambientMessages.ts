import type { ChannelId, ChatReaction, ChatTableData, MemeData } from '../types/chat';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AmbientMessage {
  authorId: string;
  text: string;
  imageUrl?: string;
  tableData?: ChatTableData;
  memeData?: MemeData;
  delayMs?: number;
  reactions?: ChatReaction[];
}

export interface AmbientChain {
  messages: AmbientMessage[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function solo(authorId: string, text: string, reactions?: ChatReaction[], memeData?: MemeData): AmbientChain {
  return { messages: [{ authorId, text, reactions, memeData }] };
}

function chain(...msgs: AmbientMessage[]): AmbientChain {
  return { messages: msgs.map((m, i) => ({ ...m, delayMs: i === 0 ? 0 : (m.delayMs ?? 3000) })) };
}

function r(emoji: string, count = 1): ChatReaction[] {
  return [{ emoji, count }];
}

// ─── #food ───────────────────────────────────────────────────────────────────

const FOOD_POOL: AmbientChain[] = [
  // Lunch spot debates
  chain(
    { authorId: 'suit', text: 'Anyone want to do that new ramen place for lunch?' },
    { authorId: 'technologist', text: 'Caloric density ranker gives it a 7.8. I\'m in.' },
    { authorId: 'pm', text: 'We have a 1pm client call. 45 minute window max.' },
  ),
  chain(
    { authorId: 'media', text: 'hot take: the cafeteria downstairs is underrated' },
    { authorId: 'art-director', text: 'Riley the cafeteria gave me food poisoning in March' },
    { authorId: 'media', text: 'ok so ONE time' },
  ),
  chain(
    { authorId: 'copywriter', text: 'Is it too early for lunch? It\'s 10:47.' },
    { authorId: 'pm', text: 'Yes.' },
    { authorId: 'copywriter', text: 'Is it too early for a lunch manifesto then?' },
  ),
  // Microwave fish wars
  chain(
    { authorId: 'technologist', text: 'Just microwaved fish in the office. Sorry not sorry.' },
    { authorId: 'art-director', text: 'That\'s a crime, Sam.', reactions: r('💀', 2) },
    { authorId: 'hr', text: 'Per the employee handbook, section 4.7: "aromatic foods should be consumed in designated areas." I\'m documenting this.' },
  ),
  solo('pm', 'Whoever left their mystery container in the fridge for 3 weeks — it\'s growing a personality. I\'m throwing it out at 5pm.', r('🤮', 2)),
  // Diet updates
  chain(
    { authorId: 'suit', text: 'Started intermittent fasting. Day 3. I can hear colors.' },
    { authorId: 'strategist', text: 'Jordan you\'re just hungry. Eat something.' },
    { authorId: 'suit', text: 'I can\'t. My eating window opens at 2pm. The colors are beautiful though.' },
  ),
  solo('media', 'PSA: if you order oat milk at the place downstairs they look at you like you asked for moon dust', r('😂', 1)),
  // Cereal discourse
  chain(
    { authorId: 'strategist', text: 'Reopening the cereal debate: cereal is 100% a soup. Liquid base, solid components, served in a bowl.' },
    { authorId: 'copywriter', text: 'I said this last week and got ratio\'d. Where was this energy then, Alex?', reactions: r('💀', 1) },
    { authorId: 'art-director', text: 'Cereal is not soup. It\'s a cold salad with milk dressing. I will die on this hill.' },
  ),
  // Sad desk lunches
  solo('pm', 'Eating a granola bar at my desk and calling it lunch. This is fine.', r('😢', 1)),
  solo('copywriter', 'My sandwich just fell apart mid-bite. This feels like a metaphor for the current campaign.'),
  chain(
    { authorId: 'technologist', text: 'Ran the team\'s lunch orders through the caloric density ranker. Taylor, your yogurt scored a 0.8.' },
    { authorId: 'pm', text: 'I\'m on a deadline, Sam. Some of us eat for efficiency.' },
    { authorId: 'technologist', text: 'That\'s what someone with a 0.8 caloric density would say.' },
  ),
  // Food rankings
  solo('strategist', 'Controversial: Chipotle is the most strategically sound fast food. Customizable, consistent, scales across demos.', r('📊', 1)),
  chain(
    { authorId: 'media', text: 'ranking the office snack drawer: \n1. Those fancy chips someone brought\n2. The almonds\n3. Everything else\n4. The protein bars from 2023' },
    { authorId: 'suit', text: 'Those protein bars have "character" now' },
  ),
  solo('art-director', 'Brought homemade pasta for lunch. Yes I made the pasta from scratch. No I will not elaborate on why.', r('👏', 2)),
  // Sam's ranker (natural mentions)
  solo('technologist', 'Updated the caloric density ranker to include a "regret factor." My 3am pizza scores off the charts.'),
  chain(
    { authorId: 'suit', text: 'What should I order? Poke bowl or burger?' },
    { authorId: 'technologist', text: 'Poke bowl: 4.2 density. Burger: 8.9. Depends on your afternoon plans.' },
    { authorId: 'suit', text: 'I have a client meeting at 3.' },
    { authorId: 'technologist', text: 'Poke bowl. Trust the ranker.' },
  ),
  // General food takes
  solo('copywriter', 'A good meal is a three-act structure. Appetizer: setup. Main: confrontation. Dessert: resolution. I accept no rebuttals.'),
  solo('media', 'Coffee is a meal. I will hear no arguments.', r('☕', 3)),
  solo('hr', 'Reminder: the shared kitchen should be left clean. I\'ve taken photos of the current state of the sink. They will be referenced.'),
  chain(
    { authorId: 'art-director', text: 'I spent 20 minutes plating my lunch today. The lighting wasn\'t great but the composition was solid.' },
    { authorId: 'copywriter', text: 'Morgan you ate a sandwich.' },
    { authorId: 'art-director', text: 'A beautifully presented sandwich.' },
  ),
];

// ─── #memes ──────────────────────────────────────────────────────────────────

const MEMES_POOL: AmbientChain[] = [
  // Agency life memes
  solo('media', 'just made this:', r('😂', 3), { template: 'drake', items: ['Make it pop', 'Make it good'] }),
  chain(
    { authorId: 'copywriter', text: 'mood:', memeData: { template: 'drake', items: ['Me writing copy', 'Me deleting copy'] } },
    { authorId: 'art-director', text: 'this is just your entire job description', reactions: r('💀', 2) },
  ),
  solo('technologist', 'the duality of agency life:', r('😂', 2), { template: 'two-buttons', items: ['We need to move fast', '12 rounds of revisions'] }),
  chain(
    { authorId: 'strategist', text: 'Found this on my camera roll:', memeData: { template: 'quote', items: ['"I\'ll know it when I see it"', 'Also client: sees it. "That\'s not it."'] } },
    { authorId: 'suit', text: 'I feel personally attacked', reactions: r('😂', 1) },
  ),
  // Making memes about each other
  chain(
    { authorId: 'media', text: 'I made one of Taylor in standups:', memeData: { template: 'expanding-brain', items: ['Quick update', '15 slides later', '47 slides later', '"Any questions?"'] } },
    { authorId: 'pm', text: 'I am thorough. There\'s a difference.', reactions: r('😂', 4) },
  ),
  chain(
    { authorId: 'copywriter', text: 'new Jamie meme just dropped (yes, about myself):', memeData: { template: 'expanding-brain', items: ['Draft 1: "Perfect."', 'Draft 2: "Actually..."', 'Draft 47: ok draft 1 was right'] } },
    { authorId: 'art-director', text: 'painfully accurate', reactions: r('💯', 2) },
  ),
  solo('technologist', 'me every sprint:', r('😂', 2), { template: 'drake', items: ['"Is the build done?"', '"Define done"'] }),
  chain(
    { authorId: 'media', text: 'Pat energy:', memeData: { template: 'quote', items: ['*someone laughs*', 'Pat, from across the office: "Noted."'] } },
    { authorId: 'hr', text: 'I don\'t appreciate being memed. This has been documented.' },
    { authorId: 'media', text: 'thank you for proving my point', reactions: r('😂', 5) },
  ),
  // Client memes
  solo('suit', 'showed this to a client once. almost got fired:', r('💀', 1), { template: 'two-buttons', items: ['$5,000 budget', 'Super Bowl ad quality'] }),
  solo('strategist', 'every pitch deck:', r('📊', 2), { template: 'expanding-brain', items: ['Slide 1: The Insight', 'Slide 2: The Strategy', 'Slide 37: please just buy the idea'] }),
  // Scope creep
  solo('pm', 'this one hurt:', r('😢', 1), { template: 'this-is-fine', items: ['Original scope: 10%', 'Final scope: 300%'] }),
  chain(
    { authorId: 'copywriter', text: 'Morgan every time someone says "can we explore a different direction":', memeData: { template: 'quote', items: ['"Can we explore a different direction?"', 'Morgan: "Which direction, specifically?"'] } },
    { authorId: 'art-director', text: 'I\'m in this meme and I don\'t like it' },
  ),
  // Meta memes
  solo('media', 'us right now in this channel:', r('😂', 2), { template: 'drake', items: ['Working on campaigns', 'Making memes about work'] }),
  solo('technologist', 'every morning:', r('☕', 3), { template: 'expanding-brain', items: ['Brain before coffee', 'Brain after coffee', '(still not great)'] }),
];

// ─── #haiku ──────────────────────────────────────────────────────────────────

const HAIKU_POOL: AmbientChain[] = [
  // Jamie's literary haikus
  solo('copywriter', 'Forty-seven drafts\nThe client wants it "punchier"\nI want to go home', r('😢', 2)),
  solo('copywriter', 'The manifesto\nIs ready for your review\nIt is nine pages'),
  chain(
    { authorId: 'copywriter', text: '"Make it authentic"\nI type "authentic" again\nArt imitates art' },
    { authorId: 'strategist', text: 'That\'s actually beautiful, Jamie', reactions: r('🎋', 1) },
  ),
  // Morgan's visual haikus
  solo('art-director', 'Kerning is off by\nOne pixel and now I can\'t\nSleep until it\'s fixed', r('💯', 1)),
  solo('art-director', 'The color is wrong\nNo the OTHER wrong color\nBoth are wrong. Start fresh.'),
  chain(
    { authorId: 'art-director', text: 'Brand guide says Pantone\nClient sends a screenshot\nJPEG of a JPEG' },
    { authorId: 'technologist', text: '🫡 suffered through this last week' },
  ),
  // Alex's strategic haikus
  solo('strategist', 'The target is clear\nMillennials who feel old\nSo, all millennials', r('📊', 1)),
  solo('strategist', 'We need more data\nBut the data says "trust us"\nThe vibes are the data'),
  // Sam's tech haikus
  solo('technologist', 'Stack overflow says\nJust use a different framework\nI have three weeks left', r('💻', 1)),
  solo('technologist', 'The build is broken\nIt works on my machine though\nShipping it anyway'),
  chain(
    { authorId: 'technologist', text: 'API returns\nFour hundred and four: not found\nJust like my will to' },
    { authorId: 'pm', text: 'Sam that\'s only 16 syllables' },
    { authorId: 'technologist', text: 'The last line is truncated. Like my patience.' },
  ),
  // Jordan's corporate haikus
  solo('suit', 'The client loves it\nBut their boss\'s wife does not\nBack to square one then', r('😅', 2)),
  solo('suit', 'Circle back on this\nLet\'s take it offline for now\nSynergize by noon'),
  // Riley's platform haikus
  solo('media', 'Algorithm changed\nAll our content plans are dead\nNew plan by Friday', r('📱', 1)),
  solo('media', 'Posted at noon sharp\nThree likes, one was my mom\'s friend\nOrganic is dead'),
  // Taylor's PM haikus
  solo('pm', 'The Gantt chart is clear\nNo one has looked at the Gantt\nI update it still', r('😢', 3)),
  solo('pm', 'Deadline is today\nTwo deliverables remain\nI\'ll push the meeting'),
  // Pat's compliance haikus
  solo('hr', 'Per the handbook, section\nFive point three: this poem is\nA policy breach', r('😂', 2)),
  solo('hr', 'Documenting this\nFor the quarterly review\nYou have been observed'),
  // Syllable callout chains
  chain(
    { authorId: 'copywriter', text: 'The brief is unclear\nThe deadline is approaching fast\nWho approved this brief?' },
    { authorId: 'pm', text: 'Jamie. "Approaching fast" is five syllables. The middle line should be seven.' },
    { authorId: 'copywriter', text: 'It\'s artistic license, Taylor.' },
    { authorId: 'pm', text: 'It\'s wrong is what it is.' },
  ),
  chain(
    { authorId: 'suit', text: 'Client call at three\nI have nothing prepared yet\nWinging it again' },
    { authorId: 'strategist', text: '"Yet" could be removed for a cleaner 5-7-5' },
    { authorId: 'suit', text: 'Alex I\'m not here for poetry critique I\'m here to cope' },
  ),
  // Haiku battle chains
  chain(
    { authorId: 'copywriter', text: 'Haiku battle? I\'ll start:\n\nMy words cut like glass\nEvery line a masterpiece\nBow before my craft' },
    { authorId: 'strategist', text: 'Challenge accepted:\n\nYour words are just words\nWithout strategic intent\nInsight beats language', reactions: r('🔥', 1) },
    { authorId: 'art-director', text: 'Amateurs:\n\nOne perfect pixel\nWorth more than all your haikus\nDesign speaks louder', reactions: r('🔥', 2) },
  ),
  chain(
    { authorId: 'technologist', text: 'console.log("help")\nThe function is recursive\nconsole.log("help")' },
    { authorId: 'copywriter', text: 'Ok Sam wins this round', reactions: r('👏', 4) },
  ),
];

// ─── #random (enhanced) ─────────────────────────────────────────────────────

const RANDOM_POOL: AmbientChain[] = [
  // Office conspiracy theories
  chain(
    { authorId: 'media', text: 'I\'m 90% sure the plant in the lobby is fake. I\'ve been watering a fake plant for 6 months.' },
    { authorId: 'technologist', text: 'Riley I tested it. It\'s real. You\'ve just been overwatering it.' },
    { authorId: 'media', text: 'then why does it look exactly the same as the day I started?' },
    { authorId: 'technologist', text: '...because you\'re overwatering it.' },
  ),
  chain(
    { authorId: 'copywriter', text: 'Theory: the meeting room on the 3rd floor is haunted. The whiteboard markers are ALWAYS dead.' },
    { authorId: 'pm', text: 'That\'s because no one caps them. I\'ve sent three emails about this.' },
    { authorId: 'copywriter', text: 'That\'s exactly what a ghost would say.' },
  ),
  // Who keeps moving my chair
  chain(
    { authorId: 'art-director', text: 'WHO. KEEPS. MOVING. MY. CHAIR.' },
    { authorId: 'pm', text: 'Morgan it was probably the cleaners' },
    { authorId: 'art-director', text: 'My chair was set to EXACTLY the right height. It took me 3 weeks to find that height. I measured it. Someone moved it 2 centimeters.' },
    { authorId: 'hr', text: 'Submitting a facilities request for chair height documentation.' },
  ),
  chain(
    { authorId: 'art-director', text: 'Update: the chair was moved again. I\'ve started marking the hydraulic post with tape.' },
    { authorId: 'technologist', text: 'Want me to build a chair height sensor that alerts you?' },
    { authorId: 'art-director', text: 'Yes. Immediately.' },
  ),
  // 4pm existential questions
  solo('copywriter', 'Do you think clients dream of us? Like, does someone at a Fortune 500 company wake up in a cold sweat thinking about our media plan?'),
  chain(
    { authorId: 'strategist', text: 'Genuine question: is advertising real? Like, are we making things that matter or are we just very organized screaming into the void?' },
    { authorId: 'suit', text: 'It\'s 4:15pm isn\'t it' },
    { authorId: 'strategist', text: '4:17 actually' },
  ),
  solo('media', 'What if engagement metrics are just... a collective hallucination? What if none of the numbers mean anything?', r('🤔', 2)),
  chain(
    { authorId: 'copywriter', text: 'I just realized we spend our entire careers trying to make strangers feel things about products they don\'t need.' },
    { authorId: 'suit', text: 'That\'s called "brand building," Jamie.' },
    { authorId: 'copywriter', text: 'Is it though' },
  ),
  // Fake article links
  chain(
    { authorId: 'media', text: 'Just saw this article: "Why Your Brand\'s TikTok Strategy Is Already Dead" — thoughts?' },
    { authorId: 'technologist', text: 'every marketing article is just "the thing you\'re doing is wrong, here\'s a new thing that\'s also wrong"' },
    { authorId: 'strategist', text: 'Honestly the best brand TikTok strategy is just vibing and hoping for the best', reactions: r('💯', 1) },
  ),
  chain(
    { authorId: 'strategist', text: 'Article from AdAge: "Gen Z Doesn\'t Trust Advertising, Study Finds" — well, they\'ve met us, so fair.' },
    { authorId: 'copywriter', text: 'I don\'t trust advertising and I MAKE advertising.' },
    { authorId: 'suit', text: 'Can we not share these articles? My imposter syndrome just got imposter syndrome.' },
  ),
  // Pat's ominous observations
  solo('hr', 'Interesting. The break room coffee consumption has increased 23% this sprint. I\'m adding this to my quarterly wellness report.'),
  solo('hr', 'I noticed several people came in late today. Not naming names. The names are documented elsewhere.'),
  chain(
    { authorId: 'hr', text: 'Does anyone know why there was laughter coming from the 3rd floor meeting room at 11:47pm last Tuesday? The security logs show the room was unoccupied.' },
    { authorId: 'copywriter', text: 'Pat what were YOU doing checking security logs at 11:47pm?' },
    { authorId: 'hr', text: 'That\'s classified.' },
  ),
  // General random chaos
  solo('technologist', 'I automated my morning standup report. It\'s been running for 2 weeks and nobody noticed. Should I be offended or proud?', r('😂', 3)),
  chain(
    { authorId: 'media', text: 'My screen time report just came in. 14 hours average. But like 6 of those are work so it\'s fine.' },
    { authorId: 'pm', text: 'Riley that\'s... still a lot for the other 8 hours.' },
    { authorId: 'media', text: 'Research, Taylor. I\'m researching platforms.' },
  ),
  solo('suit', 'Just overheard a client say "let\'s take a step back and realign on the north star" and I need to lie down for a minute.', r('😂', 2)),
  chain(
    { authorId: 'copywriter', text: 'Someone left a Post-it note on my desk that just says "LOUDER." No context. No signature. I\'m terrified.' },
    { authorId: 'art-director', text: 'That was me. Your headline for the campaign. It needs to be louder.' },
    { authorId: 'copywriter', text: 'Oh. Could you maybe use words like a normal person next time?' },
    { authorId: 'art-director', text: 'LOUDER.' },
  ),
  solo('pm', 'Fun fact: I have 847 unread emails. 400 of them are Jira notifications from Sam.', r('💀', 1)),
  solo('copywriter', 'I\'ve been staring at the same blank doc for 45 minutes and I think it\'s staring back.'),
  chain(
    { authorId: 'technologist', text: 'The wifi name is still "PrettyFly4AWifi" and honestly it\'s the only thing keeping me going' },
    { authorId: 'pm', text: 'I submitted a ticket to change it 4 months ago. IT said they\'d "get to it."' },
  ),
];

// ─── Pool Registry ───────────────────────────────────────────────────────────

const POOLS: Record<string, AmbientChain[]> = {
  food: FOOD_POOL,
  memes: MEMES_POOL,
  haiku: HAIKU_POOL,
  random: RANDOM_POOL,
};

export function getAmbientPool(channel: ChannelId): AmbientChain[] {
  return POOLS[channel] ?? [];
}
