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

    // #food
    {
      id: 'seed-11',
      channel: 'food',
      authorId: 'technologist',
      text: 'Built a caloric density ranker over the weekend. My sad desk salad scored a 2.1.',
      timestamp: now - 4000000,
      reactions: [{ emoji: '\uD83E\uDD57', count: 1 }],
      isRead: true,
    },
    {
      id: 'seed-12',
      channel: 'food',
      authorId: 'copywriter',
      text: 'Cereal is soup. I will not be taking questions.',
      timestamp: now - 3800000,
      reactions: [{ emoji: '\uD83D\uDE31', count: 2 }, { emoji: '\uD83D\uDE20', count: 1 }],
      isRead: true,
    },
    {
      id: 'seed-13',
      channel: 'food',
      authorId: 'art-director',
      text: 'Whoever microwaved fish yesterday \u2014 I know it was you, Sam.',
      timestamp: now - 3500000,
      reactions: [{ emoji: '\uD83D\uDCA8', count: 3 }],
      isRead: true,
    },

    // #memes
    {
      id: 'seed-14',
      channel: 'memes',
      authorId: 'media',
      text: 'This is us every Monday morning:',
      timestamp: now - 3200000,
      reactions: [{ emoji: '\uD83D\uDE02', count: 4 }],
      isRead: true,
      imageUrl: '\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n\u2502  \u270B Reading the brief  \u2502\n\u2502                         \u2502\n\u2502  \uD83D\uDC49 Vibing the brief   \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518',
    },
    {
      id: 'seed-15',
      channel: 'memes',
      authorId: 'technologist',
      text: 'I made one of Morgan explaining color theory to a client',
      timestamp: now - 3000000,
      reactions: [],
      isRead: true,
      imageUrl: '\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n\u2502   Morgan: \u201Cthis blue    \u2502\n\u2502   is NOT that blue\u201D    \u2502\n\u2502                         \u2502\n\u2502   Client: \u201Cthey look    \u2502\n\u2502   the same to me\u201D      \u2502\n\u2502                         \u2502\n\u2502   Morgan: \uD83D\uDE10\uD83D\uDE10\uD83D\uDE10         \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518',
    },
    {
      id: 'seed-16',
      channel: 'memes',
      authorId: 'art-director',
      text: 'Delete that immediately.',
      timestamp: now - 2900000,
      reactions: [{ emoji: '\uD83D\uDE02', count: 5 }],
      isRead: true,
    },

    // #haiku
    {
      id: 'seed-17',
      channel: 'haiku',
      authorId: 'copywriter',
      text: 'The brief said \u201Cedgy\u201D\nI wrote seventeen taglines\nAll got rejected',
      timestamp: now - 2600000,
      reactions: [{ emoji: '\uD83D\uDE22', count: 2 }],
      isRead: true,
    },
    {
      id: 'seed-18',
      channel: 'haiku',
      authorId: 'strategist',
      text: 'Data says it works\nBut does the client feel it?\nThey do not feel it.',
      timestamp: now - 2400000,
      reactions: [{ emoji: '\uD83D\uDCCA', count: 1 }],
      isRead: true,
    },
    {
      id: 'seed-19',
      channel: 'haiku',
      authorId: 'pm',
      text: 'Sprint ends tomorrow\nNothing is on track right now\nThis is my haiku',
      timestamp: now - 2200000,
      reactions: [{ emoji: '\uD83D\uDE05', count: 3 }],
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
    case 'SKETCHY_BRIEF_ACCEPTED':
      return getSketchyBriefAcceptedMessages();
    case 'BRIEF_DECLINED':
      return getBriefDeclinedMessages(context);
    default:
      return [];
  }
}

// ─── BRIEF_ACCEPTED ───────────────────────────────────────────────────────────
// No team assigned yet — everyone reacts as general awareness

function getBriefAcceptedMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  if (ctx.isKidMode) {
    return [
      { channel: 'general', authorId: 'pm', text: `We're really doing this. ${ctx.clientName}'s brief is officially locked in. Let's make this kid's dream come true. 🎮` },
      { channel: 'general', authorId: 'copywriter', text: `I haven't been this excited about a brief in YEARS. "${ctx.clientName}" — the copy practically writes itself.` },
      { channel: 'general', authorId: 'strategist', text: `The strategic insight is simple: this kid knows exactly what he wants. That's more than most clients. Let's deliver.` },
      { channel: 'general', authorId: 'art-director', text: `Dinosaur in sunglasses. Yellow lightning. Lava. This is the creative brief I've been waiting my whole career for.` },
    ];
  }
  if (ctx.isSeasonal) {
    return [
      { channel: 'general', authorId: 'pm', text: `Seasonal brief locked in — ${ctx.clientName}. Let's make the most of the timing! ⏰` },
      { channel: 'general', authorId: 'copywriter', text: `Love a brief with a built-in cultural moment. ${ctx.clientName} — I've already got ideas.` },
      { channel: 'general', authorId: 'strategist', text: `Good timing on ${ctx.clientName}. The seasonal angle gives us a natural hook for earned media.` },
    ];
  }
  const pmText: Record<MoraleLevel, string> = {
    high: `New brief just dropped for ${ctx.clientName}! Let\u2019s gooo \uD83D\uDE80`,
    medium: `New brief just dropped \u2014 ${shortName(ctx)}. Assigning a team now.`,
    low: `Another brief in. ${ctx.clientName} this time. I\u2019ll get a team sorted.`,
    toxic: `Another one. I'll add it to the pile.`,
    mutiny: `A new brief came in. I'm not assigning anyone until we talk.`,
  };
  const suitText: Record<MoraleLevel, string> = {
    high: `${ctx.clientName} \u2014 good vibes from this one. Let\u2019s crush it!`,
    medium: `${ctx.clientName} \u2014 solid client. Let\u2019s make sure we nail the positioning.`,
    low: `${ctx.clientName}. Let\u2019s just make sure we\u2019re aligned before we start.`,
    toxic: `${ctx.clientName}. Sure. Whatever.`,
    mutiny: `I'm not pitching anything until management starts treating this team like people.`,
  };
  const copywriterText: Record<MoraleLevel, string> = {
    high: `Already have three tagline ideas and I haven\u2019t even read the brief yet. This is definitely a gift.`,
    medium: `Already have three tagline ideas and I haven\u2019t even read the brief yet. This is either a gift or a problem.`,
    low: `Cool. I\u2019ll... start thinking about headlines after this coffee.`,
    toxic: `Cool.`,
    mutiny: `Write it yourself.`,
  };
  const techText: Record<MoraleLevel, string> = {
    high: `What if we built an app for this one? I\u2019m already sketching something out \uD83D\uDCBB`,
    medium: `What if we built an app for this one? Just throwing it out there.`,
    low: `I can take a look at the tech angle if needed.`,
    toxic: `...`,
    mutiny: `My IDE has been open on my resignation letter for three days.`,
  };

  const strategistText: Record<MoraleLevel, string> = {
    high: `${ctx.clientName} \u2014 I've been tracking this category. There's a real cultural moment we can tap into here.`,
    medium: `Interesting brief. I'll pull some audience data for ${ctx.clientName} before we start concepting.`,
    low: `I'll take a look at the competitive landscape for ${ctx.clientName}. See what we're up against.`,
    toxic: `Another brand. Another "disruption" play. Sure.`,
    mutiny: `I have data that says this team is at breaking point. Nobody's asked for that report.`,
  };
  const artDirectorText: Record<MoraleLevel, string> = {
    high: `The ${ctx.clientName} aesthetic is *begging* for something bold. I'm already seeing the visual world.`,
    medium: `Let me look at what ${ctx.clientName} has been doing visually. I have thoughts already.`,
    low: `I'll review the brand guidelines when they come through.`,
    toxic: `I'll make it look nice. That's what I do. That's all I do apparently.`,
    mutiny: `You want art direction? Direct it yourself.`,
  };
  const mediaText: Record<MoraleLevel, string> = {
    high: `${ctx.clientName}'s audience lives on social \u2014 this is going to be fun to plan \uD83D\uDCF1`,
    medium: `I'll start mapping out where ${ctx.clientName}'s audience actually pays attention.`,
    low: `I can look at the channel strategy once we know the direction.`,
    toxic: `I'll post it somewhere. Engagement metrics will be what they'll be.`,
    mutiny: `Maybe the algorithm will care, because nobody here does.`,
  };

  return [
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
    { channel: 'general', authorId: 'suit', text: suitText[morale] },
    { channel: 'general', authorId: 'copywriter', text: copywriterText[morale] },
    { channel: 'general', authorId: 'technologist', text: techText[morale], reactions: morale === 'high' ? [{ emoji: '\uD83D\uDE02', count: 2 }] : [] },
    { channel: 'general', authorId: 'strategist', text: strategistText[morale] },
    { channel: 'general', authorId: 'art-director', text: artDirectorText[morale] },
    { channel: 'general', authorId: 'media', text: mediaText[morale] },
  ];
}

// ─── CONCEPTING ───────────────────────────────────────────────────────────────

function getConceptingMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const messages: MessageTemplate[] = [];

  // Assigned members — in the weeds, actively working
  if (isAssigned('strategist', ctx)) {
    const text: Record<MoraleLevel, string> = {
      high: `Pulling audience data for ${shortName(ctx)}. The cultural tension here is \u2728 *chef\u2019s kiss* \u2728`,
      medium: `Digging into the audience data for ${shortName(ctx)}. The cultural tension here is interesting.`,
      low: `Looking at the audience data for the ${ctx.clientName} project. Need to find an angle that works.`,
      toxic: `Looking at data. Or whatever.`,
      mutiny: `I'm not concepting for someone who treats us like this.`,
    };
    messages.push({ channel: 'creative', authorId: 'strategist', text: text[morale] });
  }

  if (isAssigned('art-director', ctx)) {
    const text: Record<MoraleLevel, string> = {
      high: `Mood board is FLOWING. The visual language practically wrote itself.`,
      medium: `I have a mood board forming. The visual language needs to feel effortless but intentional.`,
      low: `Working on visuals. Need some quiet time with this one.`,
      toxic: `Opened Figma. Stared at it. Closed Figma.`,
      mutiny: `I'm not designing anything until conditions change.`,
    };
    messages.push({ channel: 'creative', authorId: 'art-director', text: text[morale] });
  }

  if (isAssigned('copywriter', ctx)) {
    const text: Record<MoraleLevel, string> = {
      high: `This brief reminds me of that scene in Mad Men where Don just... nails it. That\u2019s us right now.`,
      medium: `This brief reminds me of that scene in Mad Men where \u2014 actually never mind, I\u2019ll save it for the presentation.`,
      low: `Thinking through angles. Will have something soon.`,
      toxic: `Some ideas. Probably bad ones. Does it matter?`,
      mutiny: `No.`,
    };
    messages.push({ channel: 'creative', authorId: 'copywriter', text: text[morale] });
  }

  if (isAssigned('technologist', ctx)) {
    const text: Record<MoraleLevel, string> = {
      high: `Already prototyping something interactive for this. The tech possibilities are endless \uD83D\uDCBB`,
      medium: `Exploring some tech-forward angles for this one. Could be cool.`,
      low: `Looking at what we can do on the tech side.`,
      toxic: `I'll look at it. Eventually.`,
      mutiny: `My commit messages have been "why bother" for a week now.`,
    };
    messages.push({ channel: 'creative', authorId: 'technologist', text: text[morale] });
  }

  if (isAssigned('media', ctx)) {
    const text: Record<MoraleLevel, string> = {
      high: `Already mapping out where ${shortName(ctx)} needs to live. The channel mix is going to be \uD83D\uDD25`,
      medium: `Thinking through the media mix for this one. Some interesting platform opportunities.`,
      low: `I'll put together some channel recommendations.`,
      toxic: `I'll put something together. Don't expect magic.`,
      mutiny: `Post it yourself.`,
    };
    messages.push({ channel: 'creative', authorId: 'media', text: text[morale] });
  }

  if (isAssigned('suit', ctx)) {
    const text: Record<MoraleLevel, string> = {
      high: `I've been reading through the brief and I know exactly how to position this for the client. Let's go bold.`,
      medium: `Going through the brief now. I think I see the angle the client is after.`,
      low: `Reviewing the brief. Will flag anything tricky.`,
      toxic: `Brief reviewed. It's fine. Everything's fine.`,
      mutiny: `I told the client we're having "internal restructuring." That's one way to put it.`,
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
  const pmText: Record<MoraleLevel, string> = {
    high: pmHigh, medium: pmMed, low: pmLow,
    toxic: `Direction set. Timelines... whenever.`,
    mutiny: `Acknowledged.`,
  };
  messages.push({ channel: 'general', authorId: 'pm', text: pmText[morale] });

  // Assigned: in the work, excited about the direction
  if (isAssigned('suit', ctx)) {
    const suitHigh = tagline
      ? `${concept} is money. ${tagline} \u2014 client\u2019s going to flip. \uD83D\uDD25`
      : `This direction is money. Client\u2019s going to flip. \uD83D\uDD25`;
    const suitMed = concept
      ? `${concept} is a great direction. The client is going to get it immediately.`
      : `Love this direction. The client is going to get it immediately.`;
    const text: Record<MoraleLevel, string> = {
      high: suitHigh,
      medium: suitMed,
      low: `Direction works. Let\u2019s see how it comes together.`,
      toxic: `Fine. That one. Whatever.`,
      mutiny: `I don't care which direction we go. None of us do anymore.`,
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
    const text: Record<MoraleLevel, string> = {
      high: artHigh,
      medium: `Good pick. Time to make it real.`,
      low: `Got it. Heads down.`,
      toxic: `Sure. I'll make it look... adequate.`,
      mutiny: `You pick the direction, we do the labor. Got it.`,
    };
    messages.push({ channel: 'general', authorId: 'art-director', text: text[morale] });
  }

  if (isAssigned('media', ctx)) {
    const text: Record<MoraleLevel, string> = {
      high: `Already thinking about where this lives. This concept TikToks itself! \uD83D\uDCF1`,
      medium: `Already thinking about where this lives. This concept translates well to social.`,
      low: `I\u2019ll figure out the channel mix.`,
      toxic: `I'll post it somewhere. Probably.`,
      mutiny: `You want reach? Try reaching your employees first.`,
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

  // Strategist weighs in on concept direction
  if (isAssigned('strategist', ctx)) {
    const stratConcept = concept
      ? `${concept} is the right move strategically. The audience data backs this direction up.`
      : `Smart direction. The audience data backs this up.`;
    const text: Record<MoraleLevel, string> = {
      high: stratConcept,
      medium: concept ? `${concept} aligns well with what the data is telling us. Good pick.` : `This aligns well with the data. Good pick.`,
      low: `Direction makes sense from a strategy standpoint. Let's see how it plays out.`,
      toxic: `Sure. Data says it could work. Data also says I should update my resume.`,
      mutiny: `The strategy is irrelevant when the strategists are ignored.`,
    };
    messages.push({ channel: 'general', authorId: 'strategist', text: text[morale] });
  } else {
    messages.push({
      channel: 'general',
      authorId: 'strategist',
      text: pick([
        `Interesting direction for ${shortName(ctx)}. The positioning feels right from what I can see.`,
        `${ctx.clientName} concept is locked? Nice \u2014 curious to see where the team takes it.`,
      ]),
    });
  }

  // Copywriter reacts to chosen direction (if assigned)
  if (isAssigned('copywriter', ctx)) {
    const copyHigh = concept
      ? `${concept}? I can HEAR the headlines already. This is going to write itself.`
      : `This direction? I can HEAR the headlines already. This is going to write itself.`;
    const text: Record<MoraleLevel, string> = {
      high: copyHigh,
      medium: concept ? `${concept} \u2014 good bones for copy. I can work with this.` : `Good bones for copy. I can work with this.`,
      low: `Alright. I'll start drafting.`,
      toxic: `Words. Coming. Eventually.`,
      mutiny: `I'll write it when I feel like it. Which is never.`,
    };
    messages.push({ channel: 'general', authorId: 'copywriter', text: text[morale] });
  }

  // Technologist on the production angle
  if (isAssigned('technologist', ctx)) {
    const text: Record<MoraleLevel, string> = {
      high: `Already thinking about the tech layer for this. The interactive possibilities are wild \uD83D\uDCBB`,
      medium: `I can see some cool tech integrations with this direction. Let me prototype something.`,
      low: `I'll look at what tech can bring to this.`,
      toxic: `I'll build it. It'll function. Don't ask for more.`,
      mutiny: `My keyboard works. My motivation doesn't.`,
    };
    messages.push({ channel: 'general', authorId: 'technologist', text: text[morale] });
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
    const text: Record<MoraleLevel, string> = {
      high: `Heads down on ${artPiece} for ${shortName(ctx)}. In the zone \uD83C\uDFA8 Do not disturb unless there\u2019s champagne.`,
      medium: `Crafting ${artPiece} for the ${ctx.clientName} project. Do not disturb unless there\u2019s coffee.`,
      low: `Working on ${artPiece}. Going to need some focus time.`,
      toxic: `Doing ${artPiece}. It's getting done. Don't ask about quality.`,
      mutiny: `I opened the file. That's all you're getting today.`,
    };
    messages.push({ channel: 'creative', authorId: 'art-director', text: text[morale] });
  }

  if (isAssigned('copywriter', ctx)) {
    const copyPiece = delType ? `the ${delType.toLowerCase()} copy` : 'the copy';
    const text: Record<MoraleLevel, string> = {
      high: `Draft 14 of ${copyPiece} and every single one is a banger. This is agony and ecstasy.`,
      medium: `Draft 14 of ${copyPiece}. Or 15. I lost count somewhere around the second em dash.`,
      low: `Working through ${copyPiece}. Almost there.`,
      toxic: `${copyPiece[0].toUpperCase() + copyPiece.slice(1)} is done. It's words on a page. That's what you wanted, right?`,
      mutiny: `I wrote a haiku instead. "Burning out slowly / The brief means nothing to me / I quit after this"`,
    };
    messages.push({ channel: 'creative', authorId: 'copywriter', text: text[morale] });
  }

  if (isAssigned('technologist', ctx)) {
    const techPiece = hasDigitalDeliverable(ctx) ? `the ${pickDigitalType(ctx).toLowerCase()}` : 'the interactive prototype';
    const text: Record<MoraleLevel, string> = {
      high: `${techPiece[0].toUpperCase() + techPiece.slice(1)} is looking incredible. This might be our best tech work yet \uD83D\uDCBB`,
      medium: `Building out ${techPiece}. Making good progress.`,
      low: `Working on ${techPiece}. Should have something soon.`,
      toxic: `${techPiece[0].toUpperCase() + techPiece.slice(1)} compiles. Ship it.`,
      mutiny: `I deployed a 404 page. It's a metaphor.`,
    };
    messages.push({ channel: 'creative', authorId: 'technologist', text: text[morale] });
  }

  // Strategist checks in on alignment
  if (isAssigned('strategist', ctx)) {
    const text: Record<MoraleLevel, string> = {
      high: `The audience insights are threading through everything perfectly. This campaign is going to resonate hard.`,
      medium: `Checking the deliverables against the strategy deck. Everything's tracking to the audience profile.`,
      low: `Making sure the work stays aligned with the strategy. Don't want to drift off-brief.`,
      toxic: `Strategy alignment? Does it matter? Nobody reads the strategy deck anyway.`,
      mutiny: `I strategized a way out of this agency. It's my best work yet.`,
    };
    messages.push({ channel: 'creative', authorId: 'strategist', text: text[morale] });
  }

  // Media plans distribution
  if (isAssigned('media', ctx)) {
    const text: Record<MoraleLevel, string> = {
      high: `Channel plan is locked \u2014 this is going to PERFORM. The media mix is perfect for this concept \uD83D\uDCF1`,
      medium: `Working on the channel plan. Thinking about the best platform mix for ${shortName(ctx)}.`,
      low: `Figuring out the media plan. Will have recommendations soon.`,
      toxic: `I'll put together a media plan. It won't matter. Nothing matters.`,
      mutiny: `Post it on a billboard outside HR's window.`,
    };
    messages.push({ channel: 'creative', authorId: 'media', text: text[morale] });
  }

  // Suit manages client expectations
  if (isAssigned('suit', ctx)) {
    const text: Record<MoraleLevel, string> = {
      high: `Just had a check-in with ${ctx.clientName} \u2014 they're excited to see the work. We're going to blow them away.`,
      medium: `Keeping ${ctx.clientName} in the loop. They're looking forward to the first look.`,
      low: `Managing expectations with ${ctx.clientName}. Timeline's tight.`,
      toxic: `Told the client everything's fine. Added it to my collection of lies.`,
      mutiny: `I told the client we need more time. What I meant was: we need more respect.`,
    };
    messages.push({ channel: 'general', authorId: 'suit', text: text[morale] });
  }

  // PM always has visibility
  const pmText: Record<MoraleLevel, string> = {
    high: `Team is ON FIRE right now. ${shortName(ctx)} is looking incredible \uD83D\uDD25`,
    medium: `Team is in the zone on the ${ctx.clientName} project. Progress looking good so far.`,
    low: `Production underway for ${shortName(ctx)}. Tracking to deadline.`,
    toxic: `Production is... happening. I'm not going to sugarcoat morale right now.`,
    mutiny: `I can't in good conscience report on progress when there's no team left to make it.`,
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
  const suitScoreText: Record<MoraleLevel, string> = {
    high: `${ctx.clientName} LOVED our work on ${shortName(ctx)}. Scored ${score}. We crushed it. \uD83C\uDF89`,
    medium: `${ctx.clientName} loved ${shortName(ctx)} \u2014 scored ${score}! Great work from the team. \uD83C\uDF89`,
    low: `${shortName(ctx)} scored ${score}. Solid result from the team.`,
    toxic: `${score}. Great. A number. Very meaningful.`,
    mutiny: `We scored ${score}. A good score doesn't fix a broken team.`,
  };
  messages.push({
    channel: 'general',
    authorId: 'suit',
    text: suitScoreText[morale],
    reactions: morale === 'toxic' || morale === 'mutiny' ? [] : [{ emoji: '\uD83C\uDF89', count: 5 }],
  });

  // Assigned members celebrate as contributors
  if (isAssigned('copywriter', ctx)) {
    const copyReact = delDesc
      ? `I KNEW the copy would land. "${delDesc}" \u2014 that\u2019s a line I\u2019m putting on my tombstone.`
      : `I KNEW the manifesto would land. This is our Citizen Kane moment \u2014 I\u2019m only slightly exaggerating.`;
    const copyText: Record<MoraleLevel, string> = {
      high: copyReact,
      medium: copyReact,
      low: `Wait, really? That\u2019s... actually really good. Maybe we\u2019re better than we think.`,
      toxic: `Huh. They liked it. Wish I could say the same about working here.`,
      mutiny: `The work was good because WE'RE good. Not because of management.`,
    };
    messages.push({ channel: 'general', authorId: 'copywriter', text: copyText[morale] });
  }

  if (isAssigned('art-director', ctx)) {
    const artReact = hasVisualDeliverable(ctx)
      ? `The ${pickVisualType(ctx).toLowerCase()} came out exactly how I pictured it. Proud of this one.`
      : `We did good work. Proud of how the design came together.`;
    const artText: Record<MoraleLevel, string> = {
      high: artReact,
      medium: artReact,
      low: `Good. We needed that. The visual direction was right.`,
      toxic: `At least someone appreciates the work. Not anyone here, but someone.`,
      mutiny: `Imagine what we could do if we weren't miserable.`,
    };
    messages.push({ channel: 'general', authorId: 'art-director', text: artText[morale] });
  }

  // Strategist on what worked
  if (isAssigned('strategist', ctx)) {
    const stratWinText: Record<MoraleLevel, string> = {
      high: `The cultural insight carried this one. We read the audience perfectly \u2014 the data doesn't lie \uD83D\uDCCA`,
      medium: `The positioning was spot-on. We found the right tension and the audience responded.`,
      low: `Strategy held up. Good to see the audience data was right on this one.`,
      toxic: `Data said it would score well. Data was right. Data is always right. Unlike people.`,
      mutiny: `The strategy was good because I'm good at my job. Not because anyone here supports me.`,
    };
    messages.push({ channel: 'general', authorId: 'strategist', text: stratWinText[morale] });
    // Strategist shares a data table when morale is decent
    if (morale === 'high' || morale === 'medium') {
      const strategyScore = Math.min(100, score + Math.floor(Math.random() * 8) - 3);
      const creativeScore = Math.min(100, score + Math.floor(Math.random() * 10) - 4);
      const mediaScore = Math.min(100, score + Math.floor(Math.random() * 12) - 6);
      messages.push({
        channel: 'general',
        authorId: 'strategist',
        text: `Here's the performance breakdown for ${shortName(ctx)}:`,
        tableData: {
          headers: ['Metric', 'Score', 'Benchmark'],
          rows: [
            ['Strategy Fit', `${strategyScore}`, '75'],
            ['Creative Impact', `${creativeScore}`, '70'],
            ['Media Efficiency', `${mediaScore}`, '72'],
            ['Overall', `${score}`, '72'],
          ],
        },
      });
    }
  } else {
    const stratSideText: Record<MoraleLevel, string> = {
      high: `${score}! The positioning was really smart on this one. Whoever did the audience work nailed it.`,
      medium: `${score} \u2014 that's a solid result. The strategic foundation was clearly strong.`,
      low: `Good score. The strategy clearly landed.`,
      toxic: `Numbers. They go up sometimes.`,
      mutiny: `...`,
    };
    messages.push({ channel: 'general', authorId: 'strategist', text: stratSideText[morale] });
  }

  // Media on channel performance
  if (isAssigned('media', ctx)) {
    const mediaPiece = hasDigitalDeliverable(ctx) ? `The digital channels` : `The social deliverables`;
    const mediaWinText: Record<MoraleLevel, string> = {
      high: `${mediaPiece} pulled their weight! The channel mix was perfect for this audience \uD83D\uDCF1\uD83D\uDD25`,
      medium: `${mediaPiece} performed exactly how I mapped it. The platform strategy worked.`,
      low: `Channel performance was solid. The media plan did its job.`,
      toxic: `The algorithm liked it. Great. The algorithm is our only friend now.`,
      mutiny: `Good reach numbers. Wish this agency could reach its own employees.`,
    };
    messages.push({ channel: 'general', authorId: 'media', text: mediaWinText[morale] });
  } else {
    const mediaSideText: Record<MoraleLevel, string> = {
      high: `The channel mix on ${shortName(ctx)} clearly worked. ${score} doesn't happen without the right distribution!`,
      medium: `Nice result. The media strategy must have been dialed in.`,
      low: `Good score. Solid distribution work.`,
      toxic: `Cool. Numbers.`,
      mutiny: `...`,
    };
    messages.push({ channel: 'general', authorId: 'media', text: mediaSideText[morale] });
  }

  // PM always celebrates wins
  const pmWinText: Record<MoraleLevel, string> = {
    high: `Team, incredible work on ${shortName(ctx)}. Adding this one to the trophy wall. \uD83C\uDFC6`,
    medium: `Team, incredible work on ${shortName(ctx)}. Adding this one to the trophy wall. \uD83C\uDFC6`,
    low: `Team, that\u2019s a big win. We needed this one. Really proud of everyone. \uD83C\uDFC6`,
    toxic: `Good score. I'll note it in the file I'm building for when I eventually snap.`,
    mutiny: `A win means nothing when the team is falling apart.`,
  };
  messages.push({
    channel: 'general',
    authorId: 'pm',
    text: pmWinText[morale],
    reactions: morale === 'toxic' || morale === 'mutiny' ? [] : [{ emoji: '\uD83D\uDCAA', count: 4 }],
  });

  // Unassigned members cheer from the sidelines
  if (!isAssigned('technologist', ctx)) {
    const techSideText: Record<MoraleLevel, string> = {
      high: `Nice score! Congrats to everyone on the ${ctx.clientName} project. We should build a dashboard to track our wins \uD83D\uDCBB`,
      medium: `Nice score! Congrats to everyone on the ${ctx.clientName} project. We should build a dashboard to track our wins \uD83D\uDCBB`,
      low: `See? Still got it. Congrats to the team. Also I still think we should build that dashboard.`,
      toxic: `Cool. Dashboard of wins. Meanwhile the team dashboard is all red.`,
      mutiny: `Congrats to the work. Not to the workplace.`,
    };
    messages.push({ channel: 'general', authorId: 'technologist', text: techSideText[morale] });
  } else {
    const techReact = hasDigitalDeliverable(ctx)
      ? `The ${pickDigitalType(ctx).toLowerCase()} absolutely killed it. This is why you bring tech to the table. \uD83D\uDCBB`
      : `The interactive elements absolutely killed it. This is why you bring tech to the table. \uD83D\uDCBB`;
    const techAssignedText: Record<MoraleLevel, string> = {
      high: techReact,
      medium: techReact,
      low: `See? Still got it. The tech integration really pulled through.`,
      toxic: `It works. That's more than I can say for this agency.`,
      mutiny: `The code doesn't have feelings. Lucky code.`,
    };
    messages.push({ channel: 'general', authorId: 'technologist', text: techAssignedText[morale] });
  }

  if (!isAssigned('copywriter', ctx) && !isAssigned('art-director', ctx)) {
    const outsider = !isAssigned('copywriter', ctx) ? 'copywriter' : 'art-director';
    if (morale === 'toxic' || morale === 'mutiny') {
      messages.push({ channel: 'general', authorId: outsider, text: morale === 'mutiny' ? `...` : `Sure. Congrats.` });
    } else {
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
  }

  return messages;
}

// ─── CAMPAIGN_SCORED_POORLY ───────────────────────────────────────────────────

function getCampaignScoredPoorlyMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const score = ctx.score ?? 65;
  const messages: MessageTemplate[] = [];

  // Suit delivers the news
  const suitPoorText: Record<MoraleLevel, string> = {
    high: `Got the scores back for ${shortName(ctx)}. ${score} out of 100. Not what we expected, but we gave it our best shot. We\u2019ll learn from it.`,
    medium: `Got the scores back for ${shortName(ctx)}. ${score} out of 100. Not our best showing. I\u2019ll talk to the client.`,
    low: `The ${ctx.clientName} project came in at ${score}. Not great. Let\u2019s see what the team thinks.`,
    toxic: `${score}. Shocker. Maybe if anyone here still cared, we'd do better.`,
    mutiny: `${score}. Maybe if you treated people like humans, the work would be better.`,
  };
  messages.push({ channel: 'general', authorId: 'suit', text: suitPoorText[morale] });

  // PM supportive
  const pmPoorText: Record<MoraleLevel, string> = {
    high: `Every campaign teaches us something. Let\u2019s debrief and come back stronger.`,
    medium: `Let\u2019s regroup and figure out what we can learn from this one. We\u2019ll get the next one.`,
    low: `Let\u2019s regroup and figure out what we can learn from this one. We\u2019ll get the next one.`,
    toxic: `I'm supposed to run a retro on this. But honestly? I can barely run myself right now.`,
    mutiny: `The retro for this one is simple: you can't get good work from a team that's given up.`,
  };
  messages.push({ channel: 'general', authorId: 'pm', text: pmPoorText[morale] });

  // Assigned members process the miss
  if (isAssigned('copywriter', ctx)) {
    const copyPoorText: Record<MoraleLevel, string> = {
      high: `Sometimes the work is good and the fit isn\u2019t there. Happens to the best of us.`,
      medium: `Tough one. Going to sit with this for a bit. I thought the copy was strong.`,
      low: `Tough one. Going to sit with this for a bit. I thought the copy was strong.`,
      toxic: `I put in minimum effort and got minimum results. System working as designed.`,
      mutiny: `You get what you pay for. And I don't mean money.`,
    };
    messages.push({ channel: 'general', authorId: 'copywriter', text: copyPoorText[morale] });
  }

  if (isAssigned('strategist', ctx)) {
    const stratPoorText: Record<MoraleLevel, string> = {
      high: `I want to dig into the audience data. I think the positioning was close but not quite there.`,
      medium: `We missed the audience on this one \u2014 score makes sense. Need to dig into the data.`,
      low: `I think we misread the room on positioning. Need to dig into the data.`,
      toxic: `The data told us this would happen. Nobody listened. Nobody ever listens.`,
      mutiny: `Hard to position a brand when you can't even position your own team correctly.`,
    };
    messages.push({ channel: 'general', authorId: 'strategist', text: stratPoorText[morale] });
  }

  if (isAssigned('art-director', ctx)) {
    const artPoorText: Record<MoraleLevel, string> = {
      high: `The visual direction was strong \u2014 I still stand by the design choices. Sometimes it just doesn't land.`,
      medium: `I thought the visuals worked. Maybe the design didn't connect the way I intended.`,
      low: `Going to revisit the visual approach. Something didn't translate.`,
      toxic: `I made it look good. That's literally all I can control.`,
      mutiny: `Can't make beautiful work in an ugly environment.`,
    };
    messages.push({ channel: 'general', authorId: 'art-director', text: artPoorText[morale] });
  }

  // Media reflects on channel performance
  if (isAssigned('media', ctx)) {
    const mediaPoorText: Record<MoraleLevel, string> = {
      high: `We should have pushed harder on digital. The channel mix might have been off \u2014 I'll review the distribution.`,
      medium: `The media plan might not have been optimized. Going to look at where we lost engagement.`,
      low: `Channel performance was... okay. We probably should have diversified the platform mix.`,
      toxic: `The algorithm didn't care. Neither do I.`,
      mutiny: `Maybe if we had resources to do proper media planning, results would be different.`,
    };
    messages.push({ channel: 'general', authorId: 'media', text: mediaPoorText[morale] });
  }

  if (isAssigned('technologist', ctx)) {
    const techPoorText: Record<MoraleLevel, string> = {
      high: `The tech worked perfectly \u2014 this is a creative/strategy miss, not a tech one. But I'll help figure out what went wrong.`,
      medium: `From a tech standpoint everything ran smooth. The disconnect was somewhere else.`,
      low: `Not sure the tech angle was the issue here. But I'll dig into the analytics.`,
      toxic: `Code compiled. Site worked. Beyond that, not my problem.`,
      mutiny: `The tech was fine. Everything else about this place isn't.`,
    };
    messages.push({ channel: 'general', authorId: 'technologist', text: techPoorText[morale] });
  }

  // Unassigned — supportive from the outside (skip during toxic/mutiny — silence is louder)
  if (!isAssigned('copywriter', ctx) && !isAssigned('strategist', ctx)) {
    if (morale === 'toxic') {
      messages.push({ channel: 'general', authorId: pick(['copywriter', 'strategist']), text: `...` });
    } else if (morale !== 'mutiny') {
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
  }

  return messages;
}

// ─── NEW_BRIEF_ARRIVED ────────────────────────────────────────────────────────
// No team assigned yet — pure awareness

function getNewBriefArrivedMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  if (ctx.isKidMode) {
    return [
      { channel: 'general', authorId: 'suit', text: `New brief just came in from... ${ctx.clientName}. This is not a drill. A 7-year-old just pitched us a video game. 🎮` },
      { channel: 'general', authorId: 'pm', text: `Everyone stop what you're doing and check the inbox. This is the most wholesome brief I've ever read. Marcus eats glue.` },
    ];
  }
  if (ctx.isSeasonal) {
    return [
      { channel: 'general', authorId: 'suit', text: `Seasonal brief just came in from ${ctx.clientName}. Limited window on this one — worth a look. 📅` },
      { channel: 'general', authorId: 'pm', text: `Ooh, timely! ${ctx.clientName} is tied to what's happening right now. Could be a fun one if we move fast.` },
    ];
  }
  const suitText: Record<MoraleLevel, string> = {
    high: `New client just reached out — ${ctx.clientName}. Check the inbox, this one looks like a fun challenge! 📧`,
    medium: `New brief just came in from ${ctx.clientName}. Worth a look when you get a moment.`,
    low: `Got a new inquiry from ${ctx.clientName} in the inbox. I'll do some background research before we decide.`,
    toxic: `Another brief. ${ctx.clientName}. I'll leave it in the inbox.`,
    mutiny: `We're not accepting anything until things change around here.`,
  };
  const pmText: Record<MoraleLevel, string> = {
    high: `Oh nice, ${ctx.clientName}! Already intrigued. Let's see if it's a good fit. 👀`,
    medium: `I'll flag it once I've had a look at the scope.`,
    low: `On it. Will assess before we commit.`,
    toxic: `Noted. Not sure who's going to work on it, but noted.`,
    mutiny: `I'm not scheduling anything. People are leaving.`,
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
  const ref = concept ? concept : `the ${ctx.clientName} work`;

  // Suit announces
  const suitAwardText: Record<MoraleLevel, string> = {
    high: `\uD83C\uDFC6 Just heard \u2014 ${ref} won ${award}! WE DID IT. Drinks are on the agency tonight.`,
    medium: `\uD83C\uDFC6 We just won ${award} for ${shortName(ctx)}! Really proud of the work we put in.`,
    low: `\uD83C\uDFC6 We won ${award} for the ${ctx.clientName} project. Wasn't expecting it, but damn that feels good.`,
    toxic: `\uD83C\uDFC6 We won ${award}. An award! Surely that fixes everything.`,
    mutiny: `We won ${award}. We didn't earn this. The people you broke did.`,
  };
  messages.push({
    channel: 'general', authorId: 'suit', text: suitAwardText[morale],
    reactions: morale === 'toxic' || morale === 'mutiny' ? [] : [{ emoji: '\uD83C\uDFC6', count: 5 }],
  });

  // PM
  const pmAwardText: Record<MoraleLevel, string> = {
    high: `Adding it to the wall RIGHT NOW. So proud of this team. \uD83D\uDE4C`,
    medium: `Updating the credentials deck. We earned this one.`,
    low: `Nice work from that team. Updating the portfolio.`,
    toxic: `I'll add it to the trophy case. Next to the stack of resignation letters.`,
    mutiny: `Awards don't fix culture. But sure, I'll update the deck.`,
  };
  messages.push({
    channel: 'general', authorId: 'pm', text: pmAwardText[morale],
    reactions: morale === 'high' ? [{ emoji: '\uD83D\uDE4C', count: 4 }] : [],
  });

  // Copywriter
  const copyAwardText: Record<MoraleLevel, string> = {
    high: `I ALWAYS knew that concept was award-worthy. I said it. Someone please confirm I said it.`,
    medium: `Really proud of the writing on that one. This is what it's all about.`,
    low: `Really proud of the writing on that one. This is what it's all about.`,
    toxic: `Cool. Can I put "award-winning writer at a soul-crushing agency" on LinkedIn?`,
    mutiny: `The writing was good because I'M good. Not because of this place.`,
  };
  messages.push({ channel: 'general', authorId: 'copywriter', text: copyAwardText[morale] });

  // Art Director
  const artAwardText: Record<MoraleLevel, string> = {
    high: `The visual identity on that campaign was *everything*. This is why you trust the designer. \uD83C\uDFA8`,
    medium: `Really proud of the design work on that one. The visual direction was right.`,
    low: `Nice to see the design recognized. We put a lot into the visual language.`,
    toxic: `An award for the work I do despite this place. How ironic.`,
    mutiny: `The art was beautiful. The working conditions weren't.`,
  };
  messages.push({ channel: 'general', authorId: 'art-director', text: artAwardText[morale] });

  // Strategist
  const stratAwardText: Record<MoraleLevel, string> = {
    high: `The strategic foundation made this possible \u2014 we identified the exact cultural moment to tap into. Awards don't lie \uD83D\uDCCA`,
    medium: `The positioning and audience work really paid off. Strategy + execution = awards.`,
    low: `Good to see strong strategy get recognized. The insight was there from the start.`,
    toxic: `Data-driven award. Cool. Data-driven happiness? Still pending.`,
    mutiny: `The strategy was sound. The agency strategy of burning out employees? Less so.`,
  };
  messages.push({ channel: 'general', authorId: 'strategist', text: stratAwardText[morale] });

  // Media
  const mediaAwardText: Record<MoraleLevel, string> = {
    high: `The distribution strategy was a huge part of this! Right content, right channels, right timing \uD83D\uDCF1`,
    medium: `The media plan helped this reach the right people. Distribution matters!`,
    low: `Good to see the channel strategy contributed. The platform mix was intentional.`,
    toxic: `The algorithm rewarded us. At least something around here does.`,
    mutiny: `Award-winning reach. Zero-reach management. The contrast is poetic.`,
  };
  messages.push({ channel: 'general', authorId: 'media', text: mediaAwardText[morale] });

  // Technologist
  const techAwardText: Record<MoraleLevel, string> = {
    high: `YES! The tech integration was seamless on that one. This is what happens when you let tech lead! \uD83D\uDCBB`,
    medium: `The interactive elements elevated the whole campaign. Tech for the win.`,
    low: `Nice. Good to see the technical work recognized alongside creative.`,
    toxic: `Award-winning code. Still getting paid the same though.`,
    mutiny: `The code deserves the award. The codebase doesn't complain about working conditions.`,
  };
  messages.push({ channel: 'general', authorId: 'technologist', text: techAwardText[morale] });

  return messages;
}

// ─── LEVEL_UP ──────────────────────────────────────────────────────────────────

function getLevelUpMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const tier = ctx.tierName ?? 'a new level';

  const pmText: Record<MoraleLevel, string> = {
    high: `We just hit ${tier}! 🎉 This team is UNSTOPPABLE. Drinks on me tonight.`,
    medium: `Agency just leveled up to ${tier}. Nice work, everyone. We earned this.`,
    low: `We made it to ${tier}. Progress is progress. Let's keep building.`,
    toxic: `${tier}. Great. The agency grows while its people shrink.`,
    mutiny: `We "leveled up." I'll be sure to mention that to the people who just quit.`,
  };

  const suitText: Record<MoraleLevel, string> = {
    high: `${tier}! New clients, bigger budgets, more prestige. This is what we've been working toward. 🚀`,
    medium: `${tier} — that opens some doors. I've already got a few prospects in mind.`,
    low: `${tier}. Good. We needed some good news around here.`,
    toxic: `${tier}. More work for fewer people. Exciting.`,
    mutiny: `Bigger agency, worse culture. Classic growth story.`,
  };

  const copywriterText: Record<MoraleLevel, string> = {
    high: `${tier}?! I need to update my portfolio bio IMMEDIATELY. This is big. ✨`,
    medium: `${tier}. Not bad. Someone should update the website copy. *looks in mirror*`,
    low: `Cool. ${tier}. I'll add it to the list of things I tell people at parties.`,
    toxic: `${tier}. Updated my LinkedIn last night. Not for the reason you'd hope.`,
    mutiny: `You can't level up a team that doesn't exist anymore.`,
  };

  const techText: Record<MoraleLevel, string> = {
    high: `${tier}! I'm going to build a dashboard to track our growth trajectory 📈`,
    medium: `Nice milestone. ${tier} unlocks some interesting possibilities.`,
    low: `${tier}. Steady progress. That's how it works.`,
    toxic: `${tier}. I built a dashboard. It tracks how many people have left.`,
    mutiny: `Anyone know if Wieden+Kennedy is hiring? ...kidding. Mostly.`,
  };

  const strategistText: Record<MoraleLevel, string> = {
    high: `${tier}! The brand positioning has been resonating. Data shows we're attracting better-fit clients now \uD83D\uDCCA`,
    medium: `${tier} \u2014 the growth metrics are trending well. Our strategic approach is paying off.`,
    low: `${tier}. At least the numbers are going in the right direction.`,
    toxic: `${tier}. More data to analyze. More insights to ignore. Great.`,
    mutiny: `We leveled up. The team's morale leveled down. Net zero.`,
  };

  const artDirectorText: Record<MoraleLevel, string> = {
    high: `${tier}! Our visual identity is getting recognized. Time to raise the design bar even higher \uD83C\uDFA8`,
    medium: `${tier}. The portfolio is looking strong. Our design work speaks for itself.`,
    low: `${tier}. Nice. At least the work is getting noticed.`,
    toxic: `${tier}. More clients, more "can you make the logo bigger" requests. Joy.`,
    mutiny: `You can't level up taste. And this agency is proving it.`,
  };

  const mediaText: Record<MoraleLevel, string> = {
    high: `${tier}! Bigger budgets mean better media plans. The campaigns are going to hit DIFFERENT now \uD83D\uDCF1`,
    medium: `${tier} \u2014 that means access to better placements and bigger media buys.`,
    low: `${tier}. Should open up some new channel opportunities.`,
    toxic: `${tier}. More platforms to post content that nobody engages with.`,
    mutiny: `Promote the agency all you want. The people inside it are leaving.`,
  };

  return [
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
    { channel: 'general', authorId: 'suit', text: suitText[morale] },
    { channel: 'general', authorId: 'copywriter', text: copywriterText[morale] },
    { channel: 'general', authorId: 'technologist', text: techText[morale] },
    { channel: 'general', authorId: 'strategist', text: strategistText[morale] },
    { channel: 'general', authorId: 'art-director', text: artDirectorText[morale] },
    { channel: 'general', authorId: 'media', text: mediaText[morale] },
  ];
}

// ─── SKETCHY_BRIEF_ACCEPTED ─────────────────────────────────────────────────

function getSketchyBriefAcceptedMessages(): MessageTemplate[] {
  return [
    { channel: 'general', authorId: 'suit', text: 'Look, I get it — we need the money. But I want it on record I\'m not comfortable with this.' },
    { channel: 'general', authorId: 'copywriter', text: 'So we\'re writing redemption arcs for guys who got caught being awful in their own emails? Cool cool cool.' },
    { channel: 'general', authorId: 'strategist', text: 'The audience research on this is going to be... interesting. Public sentiment is nuclear.' },
    { channel: 'general', authorId: 'pm', text: 'I\'ve blocked out the schedule. No one\'s excited about this one but we\'ll be professional.' },
  ];
}

// ─── BRIEF_DECLINED ─────────────────────────────────────────────────────────

function getBriefDeclinedMessages(ctx: ChatEventContext): MessageTemplate[] {
  if (ctx.isSketchyClient) {
    return [
      { channel: 'general', authorId: 'suit', text: 'Not gonna lie, turning down $350K when we\'re hurting takes guts. But it\'s the right call.' },
      { channel: 'general', authorId: 'copywriter', text: 'Oh thank god. I was already drafting my resignation letter.' },
      { channel: 'general', authorId: 'strategist', text: 'Integrity is the one thing you can\'t rebrand. Good call.' },
      { channel: 'general', authorId: 'pm', text: 'I\'ll update the pipeline. We\'ll find something better.' },
    ];
  }

  // Generic decline — brief acknowledgment
  return [
    { channel: 'general', authorId: 'pm', text: `We passed on the ${ctx.clientName} brief. Moving on to the next one.` },
  ];
}
