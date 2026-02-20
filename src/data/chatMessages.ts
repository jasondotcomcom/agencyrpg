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
    default:
      return [];
  }
}

// ─── BRIEF_ACCEPTED ───────────────────────────────────────────────────────────

function getBriefAcceptedMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const pmText = {
    high: `New brief just dropped! \u201C${ctx.campaignName}\u201D for ${ctx.clientName}. Let\u2019s gooo \uD83D\uDE80`,
    medium: `New brief just dropped! \u201C${ctx.campaignName}\u201D for ${ctx.clientName}. Assigning a team now.`,
    low: `Another brief in. \u201C${ctx.campaignName}\u201D for ${ctx.clientName}. I\u2019ll get a team sorted.`,
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
  const strategistText = {
    high: `Pulling audience data for \u201C${ctx.campaignName}\u201D. The cultural tension here is \u2728 *chef\u2019s kiss* \u2728`,
    medium: `Pulling audience data for \u201C${ctx.campaignName}\u201D. The cultural tension here is interesting.`,
    low: `Looking at the audience data for \u201C${ctx.campaignName}\u201D. Need to find an angle that works.`,
  };
  const artDirectorText = {
    high: `Mood board is FLOWING. The visual language practically wrote itself.`,
    medium: `I have a mood board forming. The visual language needs to feel effortless but intentional.`,
    low: `Working on visuals. Need some quiet time with this one.`,
  };
  const copywriterText = {
    high: `This brief reminds me of that scene in Mad Men where Don just... nails it. That\u2019s us right now.`,
    medium: `This brief reminds me of that scene in Mad Men where \u2014 actually never mind, I\u2019ll save it for the presentation.`,
    low: `Thinking through angles. Will have something soon.`,
  };

  return [
    { channel: 'creative', authorId: 'strategist', text: strategistText[morale] },
    { channel: 'creative', authorId: 'art-director', text: artDirectorText[morale] },
    { channel: 'creative', authorId: 'copywriter', text: copywriterText[morale] },
  ];
}

// ─── CONCEPT_CHOSEN ───────────────────────────────────────────────────────────

function getConceptChosenMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const pmText = {
    high: `Direction locked for \u201C${ctx.campaignName}\u201D! Moving into production \u2014 timelines coming your way! \uD83D\uDCCB`,
    medium: `Direction locked for \u201C${ctx.campaignName}\u201D. Moving into production \u2014 I\u2019ll have timelines out by EOD.`,
    low: `Direction set for \u201C${ctx.campaignName}\u201D. Let\u2019s get through production. Timelines incoming.`,
  };
  const suitText = {
    high: `This direction is money. Client\u2019s going to flip. \uD83D\uDD25`,
    medium: `Love this direction. The client is going to get it immediately.`,
    low: `Direction works. Let\u2019s see how it comes together.`,
  };
  const artDirectorText = {
    high: `Yes. This is the one. Time to make something beautiful.`,
    medium: `Good pick. Time to make it real.`,
    low: `Got it. Heads down.`,
  };
  const mediaText = {
    high: `Already thinking about where this lives. This concept TikToks itself! \uD83D\uDCF1`,
    medium: `Already thinking about where this lives. This concept translates well to social.`,
    low: `I\u2019ll figure out the channel mix.`,
  };

  return [
    { channel: 'general', authorId: 'pm', text: pmText[morale] },
    { channel: 'general', authorId: 'suit', text: suitText[morale] },
    { channel: 'general', authorId: 'art-director', text: artDirectorText[morale] },
    { channel: 'general', authorId: 'media', text: mediaText[morale] },
  ];
}

// ─── DELIVERABLES_GENERATING ──────────────────────────────────────────────────

function getDeliverablesGeneratingMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const artDirectorText = {
    high: `Heads down on \u201C${ctx.campaignName}\u201D deliverables. In the zone \uD83C\uDFA8 Do not disturb unless there\u2019s champagne.`,
    medium: `Heads down on \u201C${ctx.campaignName}\u201D deliverables. Do not disturb unless there\u2019s coffee.`,
    low: `Working on \u201C${ctx.campaignName}\u201D deliverables. Going to need some focus time.`,
  };
  const copywriterText = {
    high: `Draft 14 and every single one is a banger. I can\u2019t choose. This is agony and ecstasy.`,
    medium: `Draft 14. Or 15. I lost count somewhere around the second em dash.`,
    low: `Working through the copy. Almost there.`,
  };
  const pmText = {
    high: `Team is ON FIRE right now. \u201C${ctx.campaignName}\u201D is looking incredible \uD83D\uDD25`,
    medium: `Team is in the zone on \u201C${ctx.campaignName}\u201D. Progress looking good so far.`,
    low: `Production underway for \u201C${ctx.campaignName}\u201D. Tracking to deadline.`,
  };

  return [
    { channel: 'creative', authorId: 'art-director', text: artDirectorText[morale] },
    { channel: 'creative', authorId: 'copywriter', text: copywriterText[morale] },
    { channel: 'general', authorId: 'pm', text: pmText[morale], reactions: morale === 'high' ? [{ emoji: '\uD83D\uDD25', count: 3 }] : [] },
  ];
}

// ─── CAMPAIGN_SCORED_WELL ─────────────────────────────────────────────────────

function getCampaignScoredWellMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const score = ctx.score ?? 85;

  return [
    {
      channel: 'general',
      authorId: 'suit',
      text: `${ctx.clientName} LOVED it. \u201C${ctx.campaignName}\u201D scored ${score}. We should celebrate. \uD83C\uDF89`,
      reactions: [{ emoji: '\uD83C\uDF89', count: 5 }],
    },
    {
      channel: 'general',
      authorId: 'copywriter',
      text: morale === 'low'
        ? `Wait, really? That\u2019s... actually really good. Maybe we\u2019re better than we think.`
        : `I KNEW the manifesto would land. This is our Citizen Kane moment \u2014 I\u2019m only slightly exaggerating.`,
    },
    {
      channel: 'general',
      authorId: 'art-director',
      text: morale === 'low'
        ? `Good. We needed that.`
        : `We did good work. The visual direction was right.`,
    },
    {
      channel: 'general',
      authorId: 'pm',
      text: morale === 'low'
        ? `Team, that\u2019s a big win. We needed this one. Really proud of everyone. \uD83C\uDFC6`
        : `Team, incredible work. Adding this one to the trophy wall. \uD83C\uDFC6`,
      reactions: [{ emoji: '\uD83D\uDCAA', count: 4 }],
    },
    {
      channel: 'general',
      authorId: 'technologist',
      text: morale === 'low'
        ? `See? Still got it. Also I still think we should build that dashboard.`
        : `We should build a dashboard to track our win rate. Just saying. \uD83D\uDCBB`,
    },
  ];
}

// ─── CAMPAIGN_SCORED_POORLY ───────────────────────────────────────────────────

function getCampaignScoredPoorlyMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const score = ctx.score ?? 65;

  return [
    {
      channel: 'general',
      authorId: 'suit',
      text: morale === 'high'
        ? `Got the scores back for \u201C${ctx.campaignName}\u201D. ${score} out of 100. Not what we expected, but we\u2019ll learn from it.`
        : `Got the scores back for \u201C${ctx.campaignName}\u201D. ${score} out of 100. Not our best showing.`,
    },
    {
      channel: 'general',
      authorId: 'pm',
      text: morale === 'high'
        ? `Every campaign teaches us something. Let\u2019s debrief and come back stronger.`
        : `Let\u2019s regroup and figure out what we can learn from this one. We\u2019ll get the next one.`,
    },
    {
      channel: 'general',
      authorId: 'copywriter',
      text: morale === 'high'
        ? `Sometimes the work is good and the fit isn\u2019t there. Happens to the best of us.`
        : `Tough one. Going to sit with this for a bit.`,
    },
    {
      channel: 'general',
      authorId: 'strategist',
      text: morale === 'high'
        ? `I want to dig into the audience data. I think the positioning was close but not quite there.`
        : `I think we misread the room on positioning. Need to dig into the data.`,
    },
  ];
}

// ─── NEW_BRIEF_ARRIVED ────────────────────────────────────────────────────────

// ─── AWARD_WON ────────────────────────────────────────────────────────────────

function getAwardWonMessages(ctx: ChatEventContext, morale: MoraleLevel): MessageTemplate[] {
  const award = ctx.awardName ?? 'an award';
  const suitText = {
    high: `🏆 Just heard — "${ctx.campaignName}" won ${award}! This is HUGE for us. Drinks are on the agency tonight.`,
    medium: `🏆 We just won ${award} for "${ctx.campaignName}"! Really great news for the team.`,
    low: `🏆 We won ${award} for "${ctx.campaignName}". Wasn't expecting it, but I'll take it.`,
  };
  const pmText = {
    high: `Adding it to the wall RIGHT NOW. This one's for the whole team. 🙌`,
    medium: `Updating the credentials deck. Nice work everyone.`,
    low: `Good. We needed a win. Updating the portfolio.`,
  };
  const copywriterText = {
    high: `I ALWAYS knew that concept was award-worthy. I said it. Someone please confirm I said it.`,
    medium: `Really proud of the writing on that one. This is what it's all about.`,
    low: `Huh. Maybe the work was better than I thought.`,
  };

  return [
    { channel: 'general', authorId: 'suit', text: suitText[morale], reactions: [{ emoji: '🏆', count: 5 }] },
    { channel: 'general', authorId: 'pm', text: pmText[morale], reactions: morale === 'high' ? [{ emoji: '🙌', count: 4 }] : [] },
    { channel: 'general', authorId: 'copywriter', text: copywriterText[morale] },
  ];
}

// ─── NEW_BRIEF_ARRIVED ────────────────────────────────────────────────────────

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
