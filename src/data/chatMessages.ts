import type { ChatMessage, ChatCampaignEvent, ChatEventContext, MessageTemplate, MoraleLevel } from '../types/chat';

// ─── Seed Messages ────────────────────────────────────────────────────────────
// These appear when the app first loads to make chat feel lived-in

export function getInitialMessages(): ChatMessage[] {
  const now = Date.now();

  return [
    // #general
    {
      id: 'seed-1',
      channel: 'general',
      authorId: 'pm',
      text: 'Morning everyone! New week, new campaigns. Check the inbox for incoming briefs.',
      timestamp: now - 7200000,
      reactions: [],
      isRead: true,
    },
    {
      id: 'seed-2',
      channel: 'general',
      authorId: 'suit',
      text: "Heard we might have a new brief coming in. Fingers crossed it's a fun one.",
      timestamp: now - 6800000,
      reactions: [],
      isRead: true,
    },
    {
      id: 'seed-3',
      channel: 'general',
      authorId: 'copywriter',
      text: "Every brief is fun if you squint hard enough \u2014 like that time we compared insurance to a heist movie.",
      timestamp: now - 6500000,
      reactions: [{ emoji: '\uD83D\uDE02', count: 2 }],
      isRead: true,
    },

    // #creative
    {
      id: 'seed-4',
      channel: 'creative',
      authorId: 'art-director',
      text: 'Reorganized the asset library. If anyone touches my folder structure I will know.',
      timestamp: now - 5400000,
      reactions: [],
      isRead: true,
    },
    {
      id: 'seed-5',
      channel: 'creative',
      authorId: 'strategist',
      text: "Sharing a trend report I put together. TL;DR: short-form is still king, but long-form is having a moment with Gen Z.",
      timestamp: now - 5000000,
      reactions: [{ emoji: '\uD83D\uDCCA', count: 1 }],
      isRead: true,
    },
    {
      id: 'seed-6',
      channel: 'creative',
      authorId: 'copywriter',
      text: "Anyone else feel like every brief lately wants \"authentic but aspirational\"? That's just... all of advertising.",
      timestamp: now - 4500000,
      reactions: [],
      isRead: true,
    },

    // #random
    {
      id: 'seed-7',
      channel: 'random',
      authorId: 'technologist',
      text: "Built a Slack bot over the weekend that ranks our lunch orders by caloric density. You're welcome.",
      timestamp: now - 4200000,
      reactions: [{ emoji: '\uD83D\uDE02', count: 3 }],
      isRead: true,
    },
    {
      id: 'seed-8',
      channel: 'random',
      authorId: 'media',
      text: 'the algorithm giveth and the algorithm taketh away',
      timestamp: now - 3600000,
      reactions: [],
      isRead: true,
    },
    {
      id: 'seed-9',
      channel: 'random',
      authorId: 'pm',
      text: "Reminder: Friday standups are mandatory. Yes, even you, Jamie.",
      timestamp: now - 3000000,
      reactions: [],
      isRead: true,
    },
    {
      id: 'seed-10',
      channel: 'random',
      authorId: 'copywriter',
      text: 'I will attend when the meeting has a three-act structure',
      timestamp: now - 2800000,
      reactions: [{ emoji: '\uD83D\uDE02', count: 1 }],
      isRead: true,
    },
  ];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAssigned(authorId: string, ctx: ChatEventContext): boolean {
  return ctx.assignedTeamIds?.includes(authorId) ?? false;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Casual short reference instead of the full campaign name */
function shortName(ctx: ChatEventContext): string {
  return `the ${ctx.clientName} campaign`;
}

/** Pick a random deliverable type label from context, or fallback */
function pickDeliverableType(ctx: ChatEventContext): string | undefined {
  if (ctx.deliverableTypes && ctx.deliverableTypes.length > 0) {
    return pick(ctx.deliverableTypes);
  }
  return undefined;
}

/** Check if context includes a visual deliverable */
function hasVisualDeliverable(ctx: ChatEventContext): boolean {
  const visual = ['Video', 'Print Ad', 'Billboard', 'Social Post', 'TikTok Series'];
  return ctx.deliverableTypes?.some(t => visual.includes(t)) ?? false;
}

/** Check if context includes a digital/tech deliverable */
function hasDigitalDeliverable(ctx: ChatEventContext): boolean {
  const digital = ['Landing Page', 'Email Campaign', 'Blog Post', 'Twitter Thread', 'Reddit AMA'];
  return ctx.deliverableTypes?.some(t => digital.includes(t)) ?? false;
}

/** Get a specific visual deliverable label */
function pickVisualType(ctx: ChatEventContext): string {
  const visual = ['Video', 'Print Ad', 'Billboard', 'Social Post', 'TikTok Series'];
  const match = ctx.deliverableTypes?.filter(t => visual.includes(t)) ?? [];
  return match.length > 0 ? pick(match) : 'visuals';
}

/** Get a specific digital deliverable label */
function pickDigitalType(ctx: ChatEventContext): string {
  const digital = ['Landing Page', 'Email Campaign', 'Blog Post', 'Twitter Thread', 'Reddit AMA'];
  const match = ctx.deliverableTypes?.filter(t => digital.includes(t)) ?? [];
  return match.length > 0 ? pick(match) : 'the digital pieces';
}

// ─── Campaign Event Messages ──────────────────────────────────────────────────

export function getCampaignEventMessages(
  event: ChatCampaignEvent,
  context: ChatEventContext,
  morale: MoraleLevel,
): MessageTemplate[] {
  switch (event) {
    case 'BRIEF_ACCEPTED':
      return getBriefAcceptedMessages(context, morale);
    case 'CONCEPTING':
      return getConceptingMessages(context, morale);
    case 'CONCEPT_CHOSEN':
      return getConceptChosenMessages(context, morale);
    case 'DELIVERABLES_GENERATING':
      return getDeliverablesGeneratingMessages(context, morale);
    case 'CAMPAIGN_SCORED_WELL':
      return getCampaignScoredWellMessages(context, morale);
    case 'CAMPAIGN_SCORED_POORLY':
      return getCampaignScoredPoorlyMessages(context, morale);
    case 'NEW_BRIEF_ARRIVED':
      return getNewBriefArrivedMessages(context, morale);
    case 'AWARD_WON':
      return getAwardWonMessages(context, morale);
    case 'LEVEL_UP':
      return getLevelUpMessages(context, morale);
    default:
      return [];
  }
}

// ─── BRIEF_ACCEPTED ───────────────────────────────────────────────────────────
// No team assigned yet — everyone reacts as general awareness

function getBriefAcceptedMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const pmText = {
    high: `New brief just dropped for ${ctx.clientName}! Let\u2019s gooo \uD83D\uDE80`,
    medium: `New brief just dropped \u2014 ${shortName(ctx)}. Assigning a team now.`,
    low: `Another brief in. ${ctx.clientName} this time. I\u2019ll get a team sorted.`,
  };
  const suitText = {
    high: `${ctx.clientName} \u2014 good vibes from this one. Let\u2019s crush it!`,
    medium: `${ctx.clientName} \u2014 solid client. Let\u2019s make sure we nail the positioning.`,
    low: `${ctx.clientName}. Let\u2019s just make sure we\u2019re aligned before we start.`,
  };
  const copywriterText = {
    high: `Already have three tagline ideas and I haven\u2019t even read the brief yet. This is definitely a gift.`,
    medium: `Already have three tagline ideas and I haven\u2019t even read the brief yet. This is either a gift or a problem.`,
    low: `Cool. I\u2019ll... start thinking about headlines after this coffee.`,
  };
  const techText = {
    high: `What if we built an app for this one? I\u2019m already sketching something out \uD83D\uDCBB`,
    medium: `What if we built an app for this one? Just throwing it out there.`,
    low: `I can take a look at the tech angle if needed.`,
  };

  return [
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
    { channel: 'general', authorId: 'suit', text: suitText[morale] },
    { channel: 'general', authorId: 'copywriter', text: copywriterText[morale] },
    { channel: 'general', authorId: 'technologist', text: techText[morale], reactions: morale === 'high' ? [{ emoji: '\uD83D\uDE02', count: 2 }] : [] },
  ];
}

// ─── CONCEPTING ───────────────────────────────────────────────────────────────

function getConceptingMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const messages: MessageTemplate[] = [];

  // Assigned members — in the weeds, actively working
  if (isAssigned('strategist', ctx)) {
    const text = {
      high: `Pulling audience data for ${shortName(ctx)}. The cultural tension here is \u2728 *chef\u2019s kiss* \u2728`,
      medium: `Digging into the audience data for ${shortName(ctx)}. The cultural tension here is interesting.`,
      low: `Looking at the audience data for the ${ctx.clientName} project. Need to find an angle that works.`,
    };
    messages.push({ channel: 'creative', authorId: 'strategist', text: text[morale] });
  }

  if (isAssigned('art-director', ctx)) {
    const text = {
      high: `Mood board is FLOWING. The visual language practically wrote itself.`,
      medium: `I have a mood board forming. The visual language needs to feel effortless but intentional.`,
      low: `Working on visuals. Need some quiet time with this one.`,
    };
    messages.push({ channel: 'creative', authorId: 'art-director', text: text[morale] });
  }

  if (isAssigned('copywriter', ctx)) {
    const text = {
      high: `This brief reminds me of that scene in Mad Men where Don just... nails it. That\u2019s us right now.`,
      medium: `This brief reminds me of that scene in Mad Men where \u2014 actually never mind, I\u2019ll save it for the presentation.`,
      low: `Thinking through angles. Will have something soon.`,
    };
    messages.push({ channel: 'creative', authorId: 'copywriter', text: text[morale] });
  }

  if (isAssigned('technologist', ctx)) {
    const text = {
      high: `Already prototyping something interactive for this. The tech possibilities are endless \uD83D\uDCBB`,
      medium: `Exploring some tech-forward angles for this one. Could be cool.`,
      low: `Looking at what we can do on the tech side.`,
    };
    messages.push({ channel: 'creative', authorId: 'technologist', text: text[morale] });
  }

  if (isAssigned('media', ctx)) {
    const text = {
      high: `Already mapping out where ${shortName(ctx)} needs to live. The channel mix is going to be \uD83D\uDD25`,
      medium: `Thinking through the media mix for this one. Some interesting platform opportunities.`,
      low: `I'll put together some channel recommendations.`,
    };
    messages.push({ channel: 'creative', authorId: 'media', text: text[morale] });
  }

  if (isAssigned('suit', ctx)) {
    const text = {
      high: `I've been reading through the brief and I know exactly how to position this for the client. Let's go bold.`,
      medium: `Going through the brief now. I think I see the angle the client is after.`,
      low: `Reviewing the brief. Will flag anything tricky.`,
    };
    messages.push({ channel: 'creative', authorId: 'suit', text: text[morale] });
  }

  // Unassigned members — aware but on the sidelines
  if (!isAssigned('strategist', ctx)) {
    messages.push({
      channel: 'general',
      authorId: 'strategist',
      text: pick([
        `Heard the team is concepting for ${shortName(ctx)}. Sounds like a fun one.`,
        `How\u2019s the ${ctx.clientName} concepting going? Let me know if you need a second opinion on positioning.`,
        `${ctx.clientName} brief looks interesting. Curious to see what the team comes up with.`,
      ]),
    });
  }

  if (!isAssigned('copywriter', ctx) && isAssigned('art-director', ctx)) {
    messages.push({
      channel: 'general',
      authorId: 'copywriter',
      text: pick([
        `Not on this one but I peeked at the brief. Whoever\u2019s writing copy \u2014 make it cinematic.`,
        `Heard you\u2019re working on the ${ctx.clientName} thing. Jealous tbh.`,
        `The ${ctx.clientName} brief sounded cool. If you need a headline gut-check, you know where to find me.`,
      ]),
    });
  }

  if (!isAssigned('technologist', ctx) && messages.length < 4) {
    messages.push({
      channel: 'general',
      authorId: 'technologist',
      text: pick([
        `Not staffed on the ${ctx.clientName} project but if anyone needs a tech perspective, holler.`,
        `Saw the ${ctx.clientName} brief come through. If there\u2019s a digital angle I can help with, just say the word.`,
      ]),
    });
  }

  return messages;
}

// ─── CONCEPT_CHOSEN ───────────────────────────────────────────────────────────

function getConceptChosenMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const messages: MessageTemplate[] = [];
  const concept = ctx.conceptName;
  const tagline = ctx.conceptTagline;

  // PM always comments (project awareness)
  const pmHigh = concept
    ? `Love it \u2014 ${concept} is locked for ${shortName(ctx)}! Moving into production \uD83D\uDCCB`
    : `Direction locked for ${shortName(ctx)}! Moving into production \u2014 timelines coming your way! \uD83D\uDCCB`;
  const pmMed = concept
    ? `${concept} is the direction for ${shortName(ctx)}. Moving into production \u2014 timelines by EOD.`
    : `Direction locked for ${shortName(ctx)}. Moving into production \u2014 I\u2019ll have timelines out by EOD.`;
  const pmLow = concept
    ? `Going with ${concept} for the ${ctx.clientName} project. Timelines incoming.`
    : `Direction set for the ${ctx.clientName} project. Let\u2019s get through production. Timelines incoming.`;
  const pmText = { high: pmHigh, medium: pmMed, low: pmLow };
  messages.push({ channel: 'general', authorId: 'pm', text: pmText[morale] });

  // Assigned: in the work, excited about the direction
  if (isAssigned('suit', ctx)) {
    const suitHigh = tagline
      ? `${concept} is money. ${tagline} \u2014 client\u2019s going to flip. \uD83D\uDD25`
      : `This direction is money. Client\u2019s going to flip. \uD83D\uDD25`;
    const suitMed = concept
      ? `${concept} is a great direction. The client is going to get it immediately.`
      : `Love this direction. The client is going to get it immediately.`;
    const text = {
      high: suitHigh,
      medium: suitMed,
      low: `Direction works. Let\u2019s see how it comes together.`,
    };
    messages.push({ channel: 'general', authorId: 'suit', text: text[morale] });
  } else {
    messages.push({
      channel: 'general',
      authorId: 'suit',
      text: pick([
        `Heard the team locked a direction for ${shortName(ctx)}. Love to see momentum.`,
        `Nice, the ${ctx.clientName} project is moving. Curious to see the final work.`,
      ]),
    });
  }

  if (isAssigned('art-director', ctx)) {
    const artHigh = concept
      ? `${concept}. Yes. This is the one. Time to make something beautiful.`
      : `Yes. This is the one. Time to make something beautiful.`;
    const text = {
      high: artHigh,
      medium: `Good pick. Time to make it real.`,
      low: `Got it. Heads down.`,
    };
    messages.push({ channel: 'general', authorId: 'art-director', text: text[morale] });
  }

  if (isAssigned('media', ctx)) {
    const text = {
      high: `Already thinking about where this lives. This concept TikToks itself! \uD83D\uDCF1`,
      medium: `Already thinking about where this lives. This concept translates well to social.`,
      low: `I\u2019ll figure out the channel mix.`,
    };
    messages.push({ channel: 'general', authorId: 'media', text: text[morale] });
  } else if (Math.random() > 0.5) {
    messages.push({
      channel: 'general',
      authorId: 'media',
      text: pick([
        `If they need help with the media mix on the ${ctx.clientName} project, I\u2019m around.`,
        `How\u2019s the ${ctx.clientName} project coming along? Just being nosy \uD83D\uDE05`,
      ]),
    });
  }

  return messages;
}

// ─── DELIVERABLES_GENERATING ──────────────────────────────────────────────────

function getDeliverablesGeneratingMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const messages: MessageTemplate[] = [];
  const delType = pickDeliverableType(ctx);

  // Assigned: in the zone, producing work
  if (isAssigned('art-director', ctx)) {
    const artPiece = hasVisualDeliverable(ctx) ? `the ${pickVisualType(ctx).toLowerCase()}` : 'the visuals';
    const text = {
      high: `Heads down on ${artPiece} for ${shortName(ctx)}. In the zone \uD83C\uDFA8 Do not disturb unless there\u2019s champagne.`,
      medium: `Crafting ${artPiece} for the ${ctx.clientName} project. Do not disturb unless there\u2019s coffee.`,
      low: `Working on ${artPiece}. Going to need some focus time.`,
    };
    messages.push({ channel: 'creative', authorId: 'art-director', text: text[morale] });
  }

  if (isAssigned('copywriter', ctx)) {
    const copyPiece = delType ? `the ${delType.toLowerCase()} copy` : 'the copy';
    const text = {
      high: `Draft 14 of ${copyPiece} and every single one is a banger. This is agony and ecstasy.`,
      medium: `Draft 14 of ${copyPiece}. Or 15. I lost count somewhere around the second em dash.`,
      low: `Working through ${copyPiece}. Almost there.`,
    };
    messages.push({ channel: 'creative', authorId: 'copywriter', text: text[morale] });
  }

  if (isAssigned('technologist', ctx)) {
    const techPiece = hasDigitalDeliverable(ctx) ? `the ${pickDigitalType(ctx).toLowerCase()}` : 'the interactive prototype';
    const text = {
      high: `${techPiece[0].toUpperCase() + techPiece.slice(1)} is looking incredible. This might be our best tech work yet \uD83D\uDCBB`,
      medium: `Building out ${techPiece}. Making good progress.`,
      low: `Working on ${techPiece}. Should have something soon.`,
    };
    messages.push({ channel: 'creative', authorId: 'technologist', text: text[morale] });
  }

  // PM always has visibility
  const pmText = {
    high: `Team is ON FIRE right now. ${shortName(ctx)} is looking incredible \uD83D\uDD25`,
    medium: `Team is in the zone on the ${ctx.clientName} project. Progress looking good so far.`,
    low: `Production underway for ${shortName(ctx)}. Tracking to deadline.`,
  };
  messages.push({ channel: 'general', authorId: 'pm', text: pmText[morale], reactions: morale === 'high' ? [{ emoji: '\uD83D\uDD25', count: 3 }] : [] });

  // Unassigned: aware from the sidelines
  if (!isAssigned('copywriter', ctx) && Math.random() > 0.4) {
    messages.push({
      channel: 'random',
      authorId: 'copywriter',
      text: pick([
        `The ${ctx.clientName} team seems locked in. Good energy in the office today.`,
        `Peeked at the ${ctx.clientName} work in progress. Looking sharp from what I can see.`,
        `Anyone else notice the ${ctx.clientName} team hasn\u2019t left the creative room in 3 hours? Respect.`,
      ]),
    });
  }

  if (!isAssigned('technologist', ctx) && Math.random() > 0.5) {
    messages.push({
      channel: 'random',
      authorId: 'technologist',
      text: pick([
        `Sounds like the ${ctx.clientName} build is going well. Glad that one\u2019s not on my plate today \uD83D\uDE05`,
        `If the ${ctx.clientName} team needs any last-minute tech support, I\u2019ve got bandwidth.`,
      ]),
    });
  }

  return messages;
}

// ─── CAMPAIGN_SCORED_WELL ─────────────────────────────────────────────────────

function getCampaignScoredWellMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const score = ctx.score ?? 85;
  const messages: MessageTemplate[] = [];
  const delDesc = ctx.deliverableDescriptions && ctx.deliverableDescriptions.length > 0
    ? pick(ctx.deliverableDescriptions) : undefined;

  // Account director always announces scores
  if (isAssigned('suit', ctx)) {
    messages.push({
      channel: 'general',
      authorId: 'suit',
      text: `${ctx.clientName} LOVED our work on ${shortName(ctx)}. Scored ${score}. We crushed it. \uD83C\uDF89`,
      reactions: [{ emoji: '\uD83C\uDF89', count: 5 }],
    });
  } else {
    messages.push({
      channel: 'general',
      authorId: 'suit',
      text: `${ctx.clientName} loved ${shortName(ctx)} \u2014 scored ${score}! Great work from the team. \uD83C\uDF89`,
      reactions: [{ emoji: '\uD83C\uDF89', count: 5 }],
    });
  }

  // Assigned members celebrate as contributors
  if (isAssigned('copywriter', ctx)) {
    const copyReact = delDesc
      ? `I KNEW the copy would land. "${delDesc}" \u2014 that\u2019s a line I\u2019m putting on my tombstone.`
      : `I KNEW the manifesto would land. This is our Citizen Kane moment \u2014 I\u2019m only slightly exaggerating.`;
    messages.push({
      channel: 'general',
      authorId: 'copywriter',
      text: morale === 'low'
        ? `Wait, really? That\u2019s... actually really good. Maybe we\u2019re better than we think.`
        : copyReact,
    });
  }

  if (isAssigned('art-director', ctx)) {
    const artReact = hasVisualDeliverable(ctx)
      ? `The ${pickVisualType(ctx).toLowerCase()} came out exactly how I pictured it. Proud of this one.`
      : `We did good work. Proud of how the design came together.`;
    messages.push({
      channel: 'general',
      authorId: 'art-director',
      text: morale === 'low'
        ? `Good. We needed that. The visual direction was right.`
        : artReact,
    });
  }

  // PM always celebrates wins
  messages.push({
    channel: 'general',
    authorId: 'pm',
    text: morale === 'low'
      ? `Team, that\u2019s a big win. We needed this one. Really proud of everyone. \uD83C\uDFC6`
      : `Team, incredible work on ${shortName(ctx)}. Adding this one to the trophy wall. \uD83C\uDFC6`,
    reactions: [{ emoji: '\uD83D\uDCAA', count: 4 }],
  });

  // Unassigned members cheer from the sidelines
  if (!isAssigned('technologist', ctx)) {
    messages.push({
      channel: 'general',
      authorId: 'technologist',
      text: morale === 'low'
        ? `See? Still got it. Congrats to the team. Also I still think we should build that dashboard.`
        : `Nice score! Congrats to everyone on the ${ctx.clientName} project. We should build a dashboard to track our wins \uD83D\uDCBB`,
    });
  } else {
    const techReact = hasDigitalDeliverable(ctx)
      ? `The ${pickDigitalType(ctx).toLowerCase()} absolutely killed it. This is why you bring tech to the table. \uD83D\uDCBB`
      : `The interactive elements absolutely killed it. This is why you bring tech to the table. \uD83D\uDCBB`;
    messages.push({
      channel: 'general',
      authorId: 'technologist',
      text: morale === 'low'
        ? `See? Still got it. The tech integration really pulled through.`
        : techReact,
    });
  }

  if (!isAssigned('copywriter', ctx) && !isAssigned('art-director', ctx)) {
    const outsider = !isAssigned('copywriter', ctx) ? 'copywriter' : 'art-director';
    messages.push({
      channel: 'general',
      authorId: outsider,
      text: pick([
        `Congrats to the ${ctx.clientName} team! ${score} is no joke.`,
        `Saw the ${ctx.clientName} results. Great work from that crew.`,
        `${score}! That\u2019s what happens when the team is dialed in. Well done.`,
      ]),
    });
  }

  return messages;
}

// ─── CAMPAIGN_SCORED_POORLY ───────────────────────────────────────────────────

function getCampaignScoredPoorlyMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const score = ctx.score ?? 65;
  const messages: MessageTemplate[] = [];

  // Suit delivers the news
  if (isAssigned('suit', ctx)) {
    messages.push({
      channel: 'general',
      authorId: 'suit',
      text: morale === 'high'
        ? `Got the scores back for ${shortName(ctx)}. ${score} out of 100. Not what we expected, but we gave it our best shot. We\u2019ll learn from it.`
        : `Got the scores back for ${shortName(ctx)}. ${score} out of 100. Not our best showing. I\u2019ll talk to the client.`,
    });
  } else {
    messages.push({
      channel: 'general',
      authorId: 'suit',
      text: morale === 'high'
        ? `Scores came in for the ${ctx.clientName} project \u2014 ${score}. Tough break for the team, but every campaign is a lesson.`
        : `The ${ctx.clientName} project came in at ${score}. Not great. Let\u2019s see what the team thinks.`,
    });
  }

  // PM supportive
  messages.push({
    channel: 'general',
    authorId: 'pm',
    text: morale === 'high'
      ? `Every campaign teaches us something. Let\u2019s debrief and come back stronger.`
      : `Let\u2019s regroup and figure out what we can learn from this one. We\u2019ll get the next one.`,
  });

  // Assigned members process the miss
  if (isAssigned('copywriter', ctx)) {
    messages.push({
      channel: 'general',
      authorId: 'copywriter',
      text: morale === 'high'
        ? `Sometimes the work is good and the fit isn\u2019t there. Happens to the best of us.`
        : `Tough one. Going to sit with this for a bit. I thought the copy was strong.`,
    });
  }

  if (isAssigned('strategist', ctx)) {
    messages.push({
      channel: 'general',
      authorId: 'strategist',
      text: morale === 'high'
        ? `I want to dig into the audience data. I think the positioning was close but not quite there.`
        : `I think we misread the room on positioning. Need to dig into the data.`,
    });
  }

  // Unassigned — supportive from the outside
  if (!isAssigned('copywriter', ctx) && !isAssigned('strategist', ctx)) {
    messages.push({
      channel: 'general',
      authorId: pick(['copywriter', 'strategist']),
      text: pick([
        `Tough score on the ${ctx.clientName} project. You win some, you learn from some.`,
        `${score} isn\u2019t the end of the world. The ${ctx.clientName} brief was tricky.`,
        `Happens to every team. Next one\u2019s going to be the comeback.`,
      ]),
    });
  }

  return messages;
}

// ─── NEW_BRIEF_ARRIVED ────────────────────────────────────────────────────────
// No team assigned yet — pure awareness

function getNewBriefArrivedMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const suitText = {
    high: `New client just reached out — ${ctx.clientName}. Check the inbox, this one looks like a fun challenge! 📧`,
    medium: `New brief just came in from ${ctx.clientName}. Worth a look when you get a moment.`,
    low: `Got a new inquiry from ${ctx.clientName} in the inbox. I'll do some background research before we decide.`,
  };
  const pmText = {
    high: `Oh nice, ${ctx.clientName}! Already intrigued. Let's see if it's a good fit. 👀`,
    medium: `I'll flag it once I've had a look at the scope.`,
    low: `On it. Will assess before we commit.`,
  };

  return [
    { channel: 'general', authorId: 'suit', text: suitText[morale] },
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
  ];
}

// ─── AWARD_WON ────────────────────────────────────────────────────────────────

function getAwardWonMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const award = ctx.awardName ?? 'an award';
  const concept = ctx.conceptName;
  const messages: MessageTemplate[] = [];

  // Suit announces — tone differs based on involvement
  if (isAssigned('suit', ctx)) {
    const ref = concept ? concept : `the ${ctx.clientName} work`;
    const text = {
      high: `\uD83C\uDFC6 Just heard \u2014 ${ref} won ${award}! WE DID IT. Drinks are on the agency tonight.`,
      medium: `\uD83C\uDFC6 We just won ${award} for ${shortName(ctx)}! Really proud of the work we put in.`,
      low: `\uD83C\uDFC6 We won ${award} for the ${ctx.clientName} project. Wasn't expecting it, but damn that feels good.`,
    };
    messages.push({ channel: 'general', authorId: 'suit', text: text[morale], reactions: [{ emoji: '\uD83C\uDFC6', count: 5 }] });
  } else {
    const ref = concept ? concept : `the ${ctx.clientName} project`;
    const text = {
      high: `\uD83C\uDFC6 ${ref} won ${award}! HUGE congrats to that team. This is big for the agency!`,
      medium: `\uD83C\uDFC6 ${shortName(ctx)} just won ${award}. Great work from the team on that one.`,
      low: `\uD83C\uDFC6 The ${ctx.clientName} project won ${award}. Nice to see a win. Congrats to the team.`,
    };
    messages.push({ channel: 'general', authorId: 'suit', text: text[morale], reactions: [{ emoji: '\uD83C\uDFC6', count: 5 }] });
  }

  // PM
  messages.push({
    channel: 'general',
    authorId: 'pm',
    text: isAssigned('pm', ctx)
      ? (morale === 'high' ? `Adding it to the wall RIGHT NOW. So proud of this team. \uD83D\uDE4C` : `Updating the credentials deck. We earned this one.`)
      : (morale === 'high' ? `Congrats to the ${ctx.clientName} team! Adding it to the wall. \uD83D\uDE4C` : `Nice work from that team. Updating the portfolio.`),
    reactions: morale === 'high' ? [{ emoji: '\uD83D\uDE4C', count: 4 }] : [],
  });

  // Assigned copywriter celebrates their work
  if (isAssigned('copywriter', ctx)) {
    messages.push({
      channel: 'general',
      authorId: 'copywriter',
      text: morale === 'high'
        ? `I ALWAYS knew that concept was award-worthy. I said it. Someone please confirm I said it.`
        : `Really proud of the writing on that one. This is what it's all about.`,
    });
  } else {
    messages.push({
      channel: 'general',
      authorId: 'copywriter',
      text: pick([
        `Congrats to the team! ${award} is no small thing. \uD83C\uDFC6`,
        `Award-winning work happening around here. Love to see it.`,
        `The ${ctx.clientName} project picked up ${award}? That's awesome. Well deserved.`,
      ]),
    });
  }

  return messages;
}

// ─── LEVEL_UP ──────────────────────────────────────────────────────────────────

function getLevelUpMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const tier = ctx.tierName ?? 'a new level';

  const pmText = {
    high: `We just hit ${tier}! 🎉 This team is UNSTOPPABLE. Drinks on me tonight.`,
    medium: `Agency just leveled up to ${tier}. Nice work, everyone. We earned this.`,
    low: `We made it to ${tier}. Progress is progress. Let's keep building.`,
  };

  const suitText = {
    high: `${tier}! New clients, bigger budgets, more prestige. This is what we've been working toward. 🚀`,
    medium: `${tier} — that opens some doors. I've already got a few prospects in mind.`,
    low: `${tier}. Good. We needed some good news around here.`,
  };

  const copywriterText = {
    high: `${tier}?! I need to update my portfolio bio IMMEDIATELY. This is big. ✨`,
    medium: `${tier}. Not bad. Someone should update the website copy. *looks in mirror*`,
    low: `Cool. ${tier}. I'll add it to the list of things I tell people at parties.`,
  };

  const techText = {
    high: `${tier}! I'm going to build a dashboard to track our growth trajectory 📈`,
    medium: `Nice milestone. ${tier} unlocks some interesting possibilities.`,
    low: `${tier}. Steady progress. That's how it works.`,
  };

  return [
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
    { channel: 'general', authorId: 'suit', text: suitText[morale] },
    { channel: 'general', authorId: 'copywriter', text: copywriterText[morale] },
    { channel: 'general', authorId: 'technologist', text: techText[morale] },
  ];
}
