import type { Email } from '../types/email';

export const initialEmails: Email[] = [
  // Campaign Brief: FocusFlow (newest — appears at top of inbox)
  {
    id: 'email-002',
    type: 'campaign_brief',
    from: {
      name: 'Derek Williams',
      email: 'jordan@focusflow.io',
      avatar: '🚀',
    },
    subject: 'FocusFlow - App Launch Campaign Brief',
    body: `Hey team,

I'm Derek, Head of Marketing at FocusFlow. I need your help solving a real problem.

We've built something genuinely different - an AI productivity app that actually works. Our beta users love us (87% retention, which is unheard of in this space). The product is ready. But here's our challenge:

Everyone is exhausted by AI tools.

Every week there's a new app promising to "revolutionize your workflow" or "10x your productivity." People have tried Notion, Todoist, Motion, Reclaim, and a dozen others. They've been burned by overpromises. They're skeptical, and honestly? They should be.

So how do we reach people who've stopped listening?

Our actual differentiator: FocusFlow doesn't add to your cognitive load - it reduces it. We're not another tool to manage. We learn your patterns and protect your focus time automatically. You don't have to think about us at all. That's the whole point.

But "we're the AI tool that doesn't annoy you" isn't exactly a sexy pitch.

We have $250K and 6 weeks before launch. Our audience is knowledge workers, freelancers, and remote workers aged 25-40 who are drowning in context-switching. They want to be productive but they're tired of complicated tools that create more work.

I don't want to tell you what to make. I want you to tell me: how do we cut through the AI fatigue and actually get people to try us?

Best,
Derek`,
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    isRead: false,
    isStarred: true,
    isDeleted: false,
    campaignBrief: {
      clientName: 'FocusFlow',
      challenge: `We're launching in a space where everyone has AI fatigue. Users are overwhelmed by productivity tools promising to "revolutionize their workflow" - they've heard it all and been burned by overpromises. 47 new productivity apps launched last quarter. How do we cut through the noise and actually get skeptical knowledge workers to try us?`,
      audience: `25-40 year olds drowning in tabs, notifications, and context-switching. They want to be productive but are tired of complicated tools that create more work. They've tried Notion, Todoist, and a dozen others. They're skeptical of AI hype and have stopped listening to productivity app marketing.`,
      message: `FocusFlow is different because it gets out of your way. We reduce your cognitive load, not add to it. You don't have to learn us, configure us, or think about us. We just quietly protect your focus time. Calm meets productivity - anti-hustle-culture.`,
      successMetrics: [
        '50K downloads in first month',
        '20% conversion from free to paid tier',
        'Positive sentiment on Reddit/HN (notoriously skeptical communities)',
        'Organic word-of-mouth mentions',
        'Press coverage framing us as "different" from the pack',
      ],
      budget: 250000,
      timeline: '6 weeks to launch - phased campaign rollout',
      vibe: `Clean, modern, Apple-meets-Calm aesthetic. Anti-hustle-culture. We're the quiet competence in a sea of loud promises. Confident but not arrogant. Show, don't tell.`,
      openEndedAsk: `How do you reach people who've stopped listening to productivity app marketing? How do you convince skeptics we're worth their attention? What do you make, where do you put it, and what do you say to break through the AI fatigue?`,
      constraints: [
        'Can\'t out-spend the big players (Notion, etc.)',
        'App store visibility is brutal - need alternative discovery paths',
        'Product demo requires showing "absence" of friction (hard to visualize)',
        'Target audience is ad-blind and influencer-skeptical',
      ],
      clientPersonality: 'Data-driven but appreciates creative risk, wants to do something unexpected, hates "typical startup marketing"',
    },
  },

  // Campaign Brief: VHS Rental Store Launch
  {
    id: 'email-012',
    type: 'campaign_brief',
    from: {
      name: 'Dustin Reeves',
      email: 'dustin@rewindtimevideo.com',
      avatar: '📼',
    },
    subject: 'RewindTime Video - Grand Opening Campaign Brief',
    body: `Hey!

I'm Dustin. I'm opening a VHS rental store in Brooklyn. Yes, in 2025. No, I haven't lost my mind.

Here's the thing — everybody streams now, and everybody hates it. Infinite scroll paralysis. Algorithm fatigue. "We watched the first 10 minutes of 6 things and went to bed." People are over it.

RewindTime is a real, physical video store. Curated shelves. Handwritten staff picks. A "blind date with a movie" wall where you pick a VHS wrapped in brown paper with only 3 words on it. Friday night means actually committing to something.

We've got 4,000 tapes. Horror section is legendary. We're doing themed movie nights in the back — 20 folding chairs, a projector, and free popcorn. Membership cards. Late fees (ironic ones — you get a hand-written guilt trip, not a charge).

The challenge: How do I launch a store built on a dead format and make it feel like the most exciting thing happening in Brooklyn? I need people to feel the nostalgia without it being a joke. This isn't a pop-up. This isn't ironic. We're genuinely building a third place for movie lovers who are tired of watching alone on their couch.

Budget: $35K. Opening is in 4 weeks.

Be kind, rewind.

Dustin`,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isRead: false,
    isStarred: false,
    isDeleted: false,
    campaignBrief: {
      clientName: 'RewindTime Video',
      challenge: `Opening a physical VHS rental store in 2025 Brooklyn. The format is dead but the desire for it isn't — people are exhausted by streaming paralysis and algorithm fatigue. The challenge is launching on a "dead" format and making it feel like the most exciting cultural moment in the neighborhood. Must feel nostalgic without being a gimmick. This isn't ironic. This is a genuine third place for movie lovers.`,
      audience: `Millennials (28-42) who grew up with video stores and miss the ritual of browsing. Gen Z (18-27) who think VHS is charmingly vintage and are already buying analog everything — vinyl, film cameras, zines. Both groups are burned out on infinite scroll and want to commit to something tangible. Brooklyn creatives, cinephiles, date-night couples tired of "what should we watch?" for 45 minutes.`,
      message: `Stop scrolling. Start choosing. RewindTime is a real video store for people who are ready to actually watch something — together, on purpose, with popcorn.`,
      successMetrics: [
        'Sold-out opening night movie event (20 seats)',
        '500+ membership signups in first month',
        'Local press/blog coverage before launch',
        'Instagram following of 2,000+ before opening',
        '"Blind date with a movie" wall becomes an Instagram moment',
      ],
      budget: 35000,
      timeline: '4 weeks to grand opening — pre-launch buzz critical',
      vibe: `Warm analog nostalgia meets Brooklyn cool. Hand-drawn, tactile, human. Should feel like finding a mixtape in a thrift store — personal, surprising, a little romantic. NOT corporate retro. NOT "remember the 90s?" listicle energy. Genuine.`,
      openEndedAsk: `How do you make a dead format feel like the future? What's the campaign that makes Brooklyn feel like it's been waiting for a video store to come back? How do you turn "physical media in 2025" from a punchline into a movement?`,
      constraints: [
        'Cannot feel like a gimmick or ironic pop-up — this is a real, permanent store',
        'Budget is tight — need earned media and word-of-mouth over paid',
        'Must appeal to both nostalgic millennials AND format-curious Gen Z',
        'Competing against the entire streaming industry for attention',
      ],
      clientPersonality: 'Passionate cinephile, infectious enthusiasm, self-aware about the absurdity but dead serious about the mission, wants collaborators not vendors',
    },
  },

  // Spam: Adobe Creative Cloud renewal
  {
    id: 'email-spam-001',
    type: 'team_message' as const,
    from: {
      name: 'Adobe Creative Cloud',
      email: 'no-reply@adobe.com',
      avatar: '🔴',
    },
    subject: 'Your subscription is about to expire',
    body: `Your Creative Cloud subscription expires in 3 days.

Don't lose access to Photoshop, Illustrator, and 20+ creative apps your team depends on.

Renew now to keep your workflow uninterrupted:

━━━━━━━━━━━━━━━━━━━━
  [ Renew Now — $59.99/mo ]
━━━━━━━━━━━━━━━━━━━━

As a valued Creative Cloud member, you've used 847 hours of creative tools this year. Don't let your projects go dark.

If you've already renewed, please disregard this message.

Adobe Creative Cloud Team
This is an automated message. Please do not reply directly to this email.`,
    timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000), // 2.5 days ago
    isRead: false,
    isStarred: false,
    isDeleted: false,
  },

  // Campaign Brief: Craft Brewery Rebrand
  {
    id: 'email-003',
    type: 'campaign_brief',
    from: {
      name: 'Nate & Chloe Rodriguez',
      email: 'cheers@timberwolfbrewing.com',
      avatar: '🍺',
    },
    subject: 'Timberwolf Brewing Co. - Rebrand Campaign Brief',
    body: `Hey friends!

We're Nate and Chloe, siblings who started Timberwolf Brewing in our garage 8 years ago. Now we're in 200+ bars across the region. Wild ride.

Here's our problem: We've outgrown our brand, but we're terrified of losing our soul.

Our current look was slapped together in Year 1. The logo is basically clip art. Our labels are all over the place. On tap walls, we disappear next to breweries with real design. We're about to expand into 3 new states, and we NEED to look like a real brewery.

But here's what scares us: We've seen other breweries "grow up" and lose everything that made them special. They rebrand and suddenly look like every other craft brewery - same geometric mountain logo, same "authentic" hand-drawn fonts, same bland "adventure awaits" messaging.

That's NOT us.

We make weird flavor combinations (our Maple Bacon Stout is legendary). We sponsor mountain biking events and trail cleanups. Our taproom has a dog park. We're outdoorsy, adventurous, and yeah - a little weird. Our fans love that we're not corporate. We're worried a rebrand will feel like we "sold out."

So here's the puzzle: How do we look premium enough to compete on those new state tap walls while keeping the scrappy, weird energy that made people love us in the first place? How do we attract new fans without alienating the ones who've been with us since the garage days?

Budget is $150K. New market expansion begins in 10 weeks.

Don't give us "craft brewery generic." Give us something that's unmistakably us.

Cheers! 🍻
Nate & Chloe`,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isRead: false,
    isStarred: false,
    isDeleted: false,
    campaignBrief: {
      clientName: 'Timberwolf Brewing Co.',
      challenge: `We've outgrown our garage-era brand but we're terrified of losing our soul. We've seen other breweries rebrand and become generic "craft brewery #47." How do we look premium enough to compete on new market tap walls while keeping the scrappy, weird energy that made people love us? How do we attract new fans without alienating the loyal ones?`,
      audience: `Current fans: outdoor adventure enthusiasts (hikers, bikers, climbers) aged 28-45 who love our weird flavors and anti-corporate vibe. New target: craft beer explorers in expansion markets who don't know us yet but would love us if they did. Both groups value authenticity and can smell corporate BS instantly.`,
      message: `We're still the same weird, adventurous, garage-spirit brewery - we just have better art now. We make Maple Bacon Stout and sponsor trail cleanups. We're not for everyone, and that's on purpose. Growth doesn't mean selling out.`,
      successMetrics: [
        'Existing customer sentiment stays positive ("they\'re still cool")',
        'Tap handle visibility/recognition in new markets',
        'Social engagement maintained or increased through transition',
        'Press coverage of rebrand is positive, not "another brewery goes corporate"',
        'Sales increase in expansion markets within 3 months',
      ],
      budget: 150000,
      timeline: '8 weeks - brand assets needed before expansion launch',
      vibe: `Bold, adventurous, authentic, unapologetically weird. NOT corporate craft brewery aesthetic. Should feel like the visual equivalent of a trail run that ends at a taproom. Playful but premium.`,
      openEndedAsk: `How do we evolve our visual identity without losing what made us special? What does "grown up but still weird" look like? What do you make, and how do you roll it out in a way that brings existing fans along for the journey?`,
      constraints: [
        'Must NOT alienate existing loyal customers',
        'Must NOT look like generic "craft brewery" aesthetic',
        'Tap handles need to stand out on crowded walls',
        'Brand needs to work across cans, taproom, merch, digital',
        'Existing fans will scrutinize every change',
      ],
      clientPersonality: 'Collaborative, protective of brand soul, excited about growth but anxious about losing identity, want to be impressed',
    },
  },

  // Team Message 1
  {
    id: 'email-004',
    type: 'team_message',
    from: {
      name: 'Charlie Park',
      email: 'charlie@agency.rpg',
      avatar: '🎨',
    },
    subject: 'Charlie - Quick Note',
    body: `Let's do this! 🎨

Just read through the new briefs. These are JUICY.

The VHS store one is calling to me — there's something about launching a "dead" format that makes the creative challenge so much more interesting. I keep thinking about what would make ME leave Netflix for a night... it's the ritual. The browsing. The commitment.

Also, the brewery rebrand is going to be fun. "Grown up but still weird" is a great brief. I have some ideas about how we could do the rollout in a way that makes existing fans feel like they're IN on it, not being sold to.

Let me know when you want to jam. My sketchbook is ready.

- Charlie

P.S. The FocusFlow brief is interesting because the challenge is almost meta - how do you advertise to people who ignore advertising? Makes you think differently.`,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    isRead: false,
    isStarred: false,
    isDeleted: false,
    teamMessage: {
      characterName: 'Charlie Park',
      mood: 'excited',
    },
  },

  // Team Message 2
  {
    id: 'email-005',
    type: 'team_message',
    from: {
      name: 'Morgan Ellis',
      email: 'morgan@agency.rpg',
      avatar: '📊',
    },
    subject: 'Morgan - Initial Research Notes',
    body: `Hi there,

Did some preliminary digging on our new briefs. Some thoughts:

**RewindTime Video:**
VHS nostalgia is having a moment — TikTok has 2.3B views on #VHSaesthetic. But here's the thing: nobody's actually opened a store around it. Dustin's not riding a trend, he's the only one actually building something physical. That's a story.

**FocusFlow:**
Productivity Reddit (r/productivity) has 2.1M members, and they're BRUTAL about new apps. But when something breaks through there, it spreads fast. High risk, high reward channel. Also noticed their competitors all lead with feature lists - nobody's speaking to the emotional exhaustion.

**Timberwolf:**
Interesting data point: the "adventure/outdoor" segment of craft beer is growing 23% YoY while overall craft is flat. Their positioning is actually perfect for the moment. The rebrand just needs to make that clearer without losing the personality.

Happy to dig deeper on any of these once we accept briefs. Just let me know which direction you want to go.

Best,
Morgan 📈`,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    isRead: true,
    isStarred: true,
    isDeleted: false,
    teamMessage: {
      characterName: 'Morgan Ellis',
      mood: 'thoughtful',
    },
  },
];
