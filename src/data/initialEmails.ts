import type { Email } from '../types/email';

export const initialEmails: Email[] = [
  // Campaign Brief 1: Local Coffee Shop - Strategic Focus
  {
    id: 'email-001',
    type: 'campaign_brief',
    from: {
      name: 'Maya Chen',
      email: 'maya@brewedawakenings.com',
      avatar: '☕',
    },
    subject: 'Brewed Awakenings - Grand Opening Campaign Brief',
    body: `Hi there! 👋

I'm Maya, the owner of Brewed Awakenings. We're opening a specialty coffee shop in the Arts District next month, and I need your help with a real problem.

Here's my situation: There are already 3 coffee shops within walking distance. People have their routines - their "usual spot." I'm not just competing on coffee quality (though ours is exceptional). I'm asking people to break a habit, leave their comfort zone, and try something new.

What makes us different? We're building a community hub. Local artists display work on our walls. Musicians play on weekends. We host open mic nights. Every cup is ethically sourced and locally roasted. We're not trying to be the fastest or cheapest - we want to be the neighborhood's living room.

But how do I communicate that before people even walk in? How do I get them curious enough to break their routine?

I don't want to just announce "new coffee shop opening!" - every business does that. I want people in the Arts District to feel like they've been waiting for us without knowing it.

Budget is $50K - not huge, but enough to do something meaningful if we're smart about it.

I trust your creative instincts. Tell me: how would you make people care?

Warmly,
Maya ✨`,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false,
    isStarred: false,
    isDeleted: false,
    campaignBrief: {
      clientName: 'Brewed Awakenings',
      challenge: `There are already 3 coffee shops within walking distance. People have their routines - their "usual spot." We're not just competing on coffee quality. We're asking people to break a habit, leave their comfort zone, and try something new. How do we make locals care about another coffee shop? What makes this one worth leaving their routine?`,
      audience: `Arts District locals: young professionals (25-40), local artists and creatives, remote workers seeking a "third place," weekend brunch crowds. They're not looking for another coffee shop - they think they already have one. We need to reach people who don't know they need us yet.`,
      message: `We're not trying to be the fastest or cheapest coffee option. We're the neighborhood's living room - a community hub where art lives on the walls, music fills the weekends, and your coffee funds ethical sourcing. Come for the coffee, stay for the community.`,
      successMetrics: [
        '200+ people through the door opening weekend',
        'Local press/blog coverage before launch',
        'Instagram following of 1,000+ before opening',
        'Waitlist signups for opening day',
        'Artists inquiring about displaying work',
      ],
      budget: 50000,
      timeline: '4 weeks until grand opening - need materials ready 2 weeks before',
      vibe: `Warm, artistic, inviting but not pretentious. We want to feel like your cool friend who happens to know a lot about coffee - approachable premium. Anti-corporate, pro-neighborhood.`,
      openEndedAsk: `How do you make people in the Arts District feel like they've been waiting for us without knowing it? What do you make? Where do you put it? How do you break people out of their coffee shop routines?`,
      constraints: [
        'No location yet has foot traffic - need to drive discovery',
        'Competing against established local favorites with loyal customers',
        'Grand opening is fixed date - no flexibility on timeline',
      ],
      clientPersonality: 'Enthusiastic, trusts creative instincts, loves bold ideas, hates corporate-feeling anything',
    },
  },

  // Campaign Brief 2: Tech Startup App Launch - Strategic Focus
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
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
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

  // Campaign Brief 3: Craft Brewery Rebrand - Strategic Focus
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

The coffee shop one is calling to me - there's something interesting about the "break people's habits" challenge. I keep thinking about what would make ME leave my usual spot... it's usually not an ad. It's something unexpected that makes me curious.

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

**Brewed Awakenings:**
The Arts District actually has a gap - none of the existing coffee shops lean into the artist community angle. There's an art walk every first Friday that draws 2,000+ people. Timing opportunity?

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
