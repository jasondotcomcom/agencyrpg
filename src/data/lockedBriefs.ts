import type { Email } from '../types/email';

export interface LockedBriefEntry {
  unlockAt: number;  // unlock after N completed campaigns
  clientName: string; // for notification copy
  briefId: string;    // matches email id
  buildEmail: () => Email;
}

export const LOCKED_BRIEFS: LockedBriefEntry[] = [

  // ─── Unlock after 1st completed campaign ────────────────────────────────────

  {
    unlockAt: 1,
    clientName: 'Threadbare',
    briefId: 'email-006',
    buildEmail: (): Email => ({
      id: 'email-006',
      type: 'campaign_brief',
      from: {
        name: 'Priya Mehta',
        email: 'priya@threadbaredenim.com',
        avatar: '👖',
      },
      subject: 'Threadbare - Brand Revival Campaign Brief',
      body: `Hi,

I'm Priya, CMO at Threadbare. We've been making denim for 40 years. My parents wore our jeans. Their parents wore our jeans. And now we're watching sales decline because Gen Z thinks we're "old people jeans."

We need to become culturally relevant again without faking it. Because here's the thing: our quality is legitimately excellent, and our sustainability story is real — we use 100% recycled denim. We're not trying to manufacture authenticity. We have it. We just need someone to help us communicate it to a generation that wasn't alive when we started.

The challenge: How do you reach Gen Z without becoming embarrassing trying?

Budget: $150K. We have 10 weeks before our new collection drops.

Priya`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'Threadbare',
        challenge: `Threadbare is a 40-year-old denim brand that our parents wore. Sales are declining as Gen Z sees us as "old people jeans." We need to become culturally relevant again without losing our loyal 45-65 customers or resorting to embarrassing "fellow kids" marketing. Our sustainability story is real — 100% recycled denim — but Gen Z doesn't know we exist.`,
        audience: `Primary: Gen Z (18-25) who value sustainability and authenticity. They're already buying vintage denim on Depop and talking about slow fashion — they just don't know Threadbare yet. Secondary: Existing customers (45-65) who love our quality and need to feel we haven't abandoned them.`,
        message: `Heritage quality meets modern values. We've been doing sustainability before it was a word on marketing decks. 40 years of craft, zero BS.`,
        successMetrics: [
          'Brand awareness lift among 18-25 demographic',
          'Organic social mentions from Gen Z creators',
          'Perception shift ("heritage" not "outdated") in brand tracking',
          'Sell-through on new recycled collection within 60 days',
          'New customer acquisition under age 30',
        ],
        budget: 150000,
        timeline: '10 weeks — materials needed before new collection drops',
        vibe: `Authentic, worn-in, honest. Think vintage editorial meets climate-aware. NOT "cool grandpa trying to be hip." NOT overtly nostalgic. Timeless with a conscience.`,
        openEndedAsk: `How do you make a 40-year-old brand feel like a discovery to Gen Z without alienating the people who already love us? What's the campaign that makes a 22-year-old think "wait, why haven't I heard of these people?"`,
        constraints: [
          "Cannot abandon core denim identity — it's who we are",
          'Must feel authentic, not "fellow kids" cringe',
          'Sustainability claims must be substantiated — no greenwashing',
          'Cannot alienate existing 45-65 customer base',
        ],
        clientPersonality: 'Strategically minded but creatively open, protective of heritage, genuinely excited about the sustainability angle, no patience for hollow trends',
        industry: 'fashion',
      },
    }),
  },

  {
    unlockAt: 1,
    clientName: 'Bella Piatto',
    briefId: 'email-007',
    buildEmail: (): Email => ({
      id: 'email-007',
      type: 'campaign_brief',
      from: {
        name: 'Luca Moretti',
        email: 'luca@bellapiattonyc.com',
        avatar: '🍝',
      },
      subject: 'Bella Piatto - Grand Opening Campaign Brief',
      body: `Ciao!

I'm Luca. I've been cooking in restaurant kitchens for 22 years. Six months ago I quit the Michelin-star world to open my own place — Bella Piatto. We open in 6 weeks in a neighborhood that already has 14 Italian restaurants.

Yes, 14. I know. My family thinks I've lost it.

But here's the thing: none of them actually cook Italian food the way Italians eat at home. They cook Italian food the way Americans think Italian food should taste — big portions, heavy sauce, garlic bread. There's nothing wrong with that. But nobody is doing nonna's kitchen. The real stuff.

My question to you: How do we make food-curious people excited about "actual Italian" when they think they already know Italian?

Budget is tight — $50K. We open in 6 weeks.

Luca`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'Bella Piatto',
        challenge: `Opening a "real Italian" restaurant in a neighborhood saturated with 14 existing Italian restaurants. The challenge isn't awareness — everyone knows Italian food. The challenge is creating a new category in people's minds: "the Italian food Italians actually eat" vs. the American-Italian they think they know. We need food-curious diners to see Bella Piatto as something genuinely new, not just another red-sauce joint.`,
        audience: `Food-curious diners (30-50) who follow chefs on Instagram, watch food documentaries, and have been to Italy or dream about going. They're tired of imitation and hungry for something real. Secondary: Neighborhood locals who want a personal "neighborhood place" with a story — not a chain, not a concept.`,
        message: `This is the Italian food your Italian friend's mom makes. Not the Italian food you think you know. Come with an empty stomach and an open mind.`,
        successMetrics: [
          'Fully booked for opening 2 weeks straight',
          'Coverage from at least 2 local food publications before opening',
          'Instagram following of 2,000+ before opening night',
          'Word-of-mouth referrals trackable via reservation source',
          'Return visit rate above 40% in first month',
        ],
        budget: 50000,
        timeline: '6 weeks to opening — pre-launch buzz is critical',
        vibe: `Warm, intimate, unpretentious. Like being invited to someone's home in Bologna, not a "concept restaurant." Real, not performative. The visual opposite of white tablecloths and opera music.`,
        openEndedAsk: `How do you make food-savvy diners feel like they've been missing something their whole life? What's the campaign that makes someone say "I didn't know Italian food could taste like this"?`,
        constraints: [
          "No red checkered tablecloths, gondolas, or opera — we're not that",
          'Must feel intimate and personal, not corporate or trendy',
          'Budget cannot support paid influencer campaigns',
          'Prix-fixe menu — need to set expectations correctly upfront',
        ],
        clientPersonality: 'Passionate, opinionated about food authenticity, skeptical of marketing fluff, will appreciate creative risk if it feels genuine',
        industry: 'food-beverage',
      },
    }),
  },

  // ─── Unlock after 2nd completed campaign ────────────────────────────────────

  {
    unlockAt: 2,
    clientName: 'Waverly',
    briefId: 'email-008',
    buildEmail: (): Email => ({
      id: 'email-008',
      type: 'campaign_brief',
      from: {
        name: 'Jordan Reeves',
        email: 'jordan@waverly-music.com',
        avatar: '🎵',
      },
      subject: 'Waverly - Album Launch Campaign Brief',
      body: `Hey,

I'm Jordan — manager for Waverly. She's been building a real cult following in the indie folk world for 6 years. Her last album sold 180K copies. Critics love her. Superfans tattoo her lyrics on themselves.

Now she's made an album that sounds like nothing she's released before. Still her voice, but more produced, more electronic, more... pop. She's terrified to lose the fans who've been with her since the beginning. But she also knows this is the music she needs to make.

How do you launch a genre-crossing album without making your core audience feel betrayed — and without the mainstream ignoring you because you're "indie"?

$250K budget. 12 weeks before release.

Jordan`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'Waverly',
        challenge: `Indie folk artist Waverly is releasing her most commercially accessible album yet — a deliberate artistic evolution incorporating electronic production and pop structures. The risk: 6 years of devoted indie fans who fell in love with her acoustic rawness may feel sold out. The opportunity: reaching an audience of millions who've never heard her. How do you honor the past while embracing the future without apologizing for either?`,
        audience: `Core fans: 22-35 indie music devotees who discovered her on Bandcamp or early Spotify. They stream 50+ hours a month and are deeply suspicious of "selling out." New target: 18-30 mainstream music listeners who haven't found Waverly yet but would connect with her voice and songwriting if they heard her.`,
        message: `This is still Waverly. The sound changed because she changed. Growth isn't betrayal — it's the whole point.`,
        successMetrics: [
          'Album streams exceed 50M in first month',
          'Core fan sentiment stays positive — no major social backlash',
          'Press coverage frames evolution as artistic growth, not commercial sellout',
          'Entry into mainstream editorial playlists',
          'New follower growth of 500K+ across platforms',
        ],
        budget: 250000,
        timeline: '12 weeks to album release — phased rollout with single drops',
        vibe: `Honest, evolving, artistically brave. Should feel like watching someone step into the next version of themselves — exciting, not jarring. Not apologetic. Not trying too hard to be cool. Confident in the change.`,
        openEndedAsk: `How do you launch an album that asks your core audience to follow you somewhere new? What's the campaign that makes superfans excited about change instead of threatened by it?`,
        constraints: [
          'Cannot feel like a corporate pop machine — authenticity is everything',
          'Must bridge indie and mainstream audiences without fully alienating either',
          'Waverly has final creative approval on all materials',
          'Cannot overpromise mainstream commercial success before it happens',
        ],
        clientPersonality: 'Protective of artist integrity above all else, commercially pragmatic, will reject anything that feels inauthentic, responds to genuine creative ideas over safe ones',
        industry: 'music',
      },
    }),
  },

  {
    unlockAt: 2,
    clientName: 'PawPath',
    briefId: 'email-009',
    buildEmail: (): Email => ({
      id: 'email-009',
      type: 'campaign_brief',
      from: {
        name: 'Samira Torres',
        email: 'samira@pawpath.app',
        avatar: '🐾',
      },
      subject: 'PawPath - App Launch Campaign Brief',
      body: `Hi there,

Samira here, CEO of PawPath. We've built a wellness app specifically for dog owners — personalized vet checklists, symptom tracking, nutrition guides, and a real community for dog parents. 14 months of development. We genuinely think it's the best pet health app out there.

The problem: There are already 12 apps in the "pet health" space. To most people, we look identical. Same features, same stock photos of golden retrievers, same "your pet deserves the best" messaging.

How do we stand out in a market full of sameness to reach millennial pet parents who will actually pay for a subscription?

$75K budget. We launch in 8 weeks.

Samira`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'PawPath',
        challenge: `Launching a premium pet health app into a crowded market of 12+ competitors that all look and sound identical — same golden retriever stock photos, same "your pet deserves the best" messaging, same feature list. PawPath is genuinely better (personalized vet protocols, real symptom tracking, an actually useful community) but differentiating on features isn't working for anyone in this space. We need a completely different way in.`,
        audience: `Millennial dog owners (27-40) who treat their dogs as family members, spend $1,000+ annually on pet care, and feel genuine anxiety about their dog's health. They're educated, skeptical consumers who will pay premium prices for things that actually work. They're already in pet Facebook groups, follow pet accounts obsessively, and have their vet on speed dial.`,
        message: `Your dog can't tell you what's wrong. PawPath helps you figure it out. Real health tracking for real dog parents who actually worry.`,
        successMetrics: [
          '50,000 downloads in first 3 months',
          '15% conversion from free to $9.99/month subscription',
          'App Store rating above 4.7 stars',
          'Community engagement rate above 30% of active users',
          'Featured in App Store editorial or "New Apps We Love"',
        ],
        budget: 75000,
        timeline: '8 weeks to launch — pre-registration campaign needed immediately',
        vibe: `Real, warm, slightly anxious (because dog parents always are). Should feel like it was made by someone who actually has a dog — not a tech company with dog stock photos. Not cutesy. Not clinical. Somewhere between a trusted vet and your best friend who happens to know a lot about dogs.`,
        openEndedAsk: `How do you make PawPath feel fundamentally different from 12 identical-looking competitors? What's the insight into the dog owner mindset that nobody in this space has tapped yet?`,
        constraints: [
          "No generic 'your pet deserves the best' messaging — absolutely not",
          'Must justify the $9.99/month subscription price point clearly',
          "Can't use stock photo golden retrievers — needs to feel authentic",
          "App not yet rated — can't lead with reviews or social proof",
        ],
        clientPersonality: 'Product-first thinking, frustrated by the generic market, open to unconventional angles, wants to see the strategy before any execution',
        industry: 'pet-tech',
      },
    }),
  },

  // ─── Unlock after 3rd completed campaign ────────────────────────────────────

  {
    unlockAt: 3,
    clientName: 'One Acre',
    briefId: 'email-010',
    buildEmail: (): Email => ({
      id: 'email-010',
      type: 'campaign_brief',
      from: {
        name: 'Dara Williams',
        email: 'dara@oneacre.org',
        avatar: '🌱',
      },
      subject: 'One Acre - Community Campaign Brief',
      body: `Hi,

I'm Dara, Executive Director of One Acre — a nonprofit that converts vacant urban lots into community vegetable gardens. We've been doing this for 11 years. We have 6 active gardens, feed 400 families, and employ 12 people from the neighborhood.

Problem: Nobody outside our immediate community knows we exist. Our fundraising comes from the same 40 donors every year. We're at volunteer capacity. And we just got offered a vacant lot that's 3x the size of anything we've ever worked with — if we can raise $80K in 90 days and recruit 30 new regular volunteers.

We can't do that invisible.

Our campaign budget is $25K. I know you usually work with bigger clients. But this opportunity doesn't come twice.

Dara`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'One Acre',
        challenge: `One Acre has been quietly transforming vacant urban lots into community gardens for 11 years — feeding 400 families and employing 12 neighborhood residents. But they're invisible outside their immediate community. A once-in-a-decade opportunity just appeared: a vacant lot 3x their current capacity, available for free if they can raise $80K and recruit 30 regular volunteers within 90 days. The campaign must build awareness, drive donations, and recruit volunteers simultaneously — with only $25K to work with.`,
        audience: `Primary: City residents aged 25-45 who care about community, sustainability, and local food but don't know One Acre exists. They vote in local elections, shop at farmers markets, and share neighborhood news. Secondary: Local businesses and foundations who could write larger checks if given a compelling impact story.`,
        message: `There's a vacant lot in your city that could feed 200 families. One Acre knows how to make that happen. They just need your help to do it.`,
        successMetrics: [
          '$80K raised within 90 days',
          '30 regular volunteer signups committed',
          'Media coverage in at least 2 local outlets',
          '5+ new recurring donor relationships over $1,000',
          'Social reach expansion beyond current neighborhood audience',
        ],
        budget: 25000,
        timeline: '90 days — fundraising and volunteer deadline is hard and non-negotiable',
        vibe: `Grounded, genuine, community-rooted. Should feel like it was made by neighbors, for neighbors. Not slick nonprofit marketing. Not guilt-trip fundraising. Pride and possibility — this is a story of what a neighborhood can accomplish together.`,
        openEndedAsk: `How do you make an 11-year-old neighborhood organization feel urgent and exciting without being manipulative? What's the campaign that gets someone to donate AND show up with a shovel?`,
        constraints: [
          'Zero tolerance for poverty exploitation or "savior" narratives',
          'Community must be portrayed with dignity and full agency',
          'Severely limited budget means minimal paid media — must be creative with earned and owned',
          '90-day hard deadline — no room for a slow-burn strategy',
          'Volunteer recruitment is as important as fundraising — campaign must serve both goals',
        ],
        clientPersonality: 'Mission-driven, authentic above all else, skeptical of polished marketing but desperate for visibility, will be genuinely moved by creative thinking that understands their community',
        industry: 'nonprofit',
      },
    }),
  },

  {
    unlockAt: 3,
    clientName: 'Luma AI',
    briefId: 'email-011',
    buildEmail: (): Email => ({
      id: 'email-011',
      type: 'campaign_brief',
      from: {
        name: 'Marcus Chen',
        email: 'marcus@lumaai.io',
        avatar: '🤖',
      },
      subject: 'Luma AI - B2B Launch Campaign Brief',
      body: `Hey,

Marcus here, VP Marketing at Luma AI. We've built an AI tool that generates first-draft marketing copy across 40+ formats — ads, emails, landing pages, social posts — trained specifically on high-performing campaigns, not generic internet text. Our beta customers are cutting first-draft time by 70%.

Problem: We're launching into a B2B AI market that's completely overheated. Every week there's a new "AI for marketing" tool. Buyers are fatigued, skeptical, and getting pitched constantly. Our results are genuinely better than competitors, but nobody's listening to claims anymore.

We need to reach marketing directors and CMOs at mid-size companies who need this but have tuned out the category.

$100K budget, 10-week campaign targeting demo signups.

Marcus`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'Luma AI',
        challenge: `Launching a genuinely differentiated B2B AI marketing tool into a market so saturated that buyers have completely tuned out. Marketing directors and CMOs at mid-size companies need this solution but have been burned by AI tool overpromises and are skeptical of every new entrant. Luma AI's beta results are legitimately impressive (70% reduction in first-draft time), but "our AI is better" is what every competitor says. How do you reach decision-makers who've stopped listening to this category?`,
        audience: `Marketing directors and CMOs at mid-size B2B companies ($10M-$100M revenue). They run lean teams, are responsible for 10+ content types, and spend 40% of their time on first drafts that aren't their best work. They're smart, busy, deeply skeptical of vendor claims, and make purchasing decisions based on peer recommendations and visible proof — not ads.`,
        message: `Stop writing first drafts. Luma writes them. Your team makes them great. Ship more, faster, without burning out.`,
        successMetrics: [
          '500 qualified demo signups in 10 weeks',
          '20% demo-to-trial conversion rate',
          'CAC below $400 per customer',
          'Coverage in 2+ marketing trade publications',
          'Referral pipeline activated from existing beta customers',
        ],
        budget: 100000,
        timeline: '10 weeks — demo pipeline needs to hit targets before Series A closes',
        vibe: `Confident, proof-led, respectful of the buyer's intelligence. No hype. No "revolutionary." No stock photos of people smiling at laptops. Show the work. Let results do the talking.`,
        openEndedAsk: `How do you get a skeptical marketing director to give you 30 minutes when their inbox is full of AI tools promising the exact same thing? What makes Luma AI worth a demo when they've already said no to five others this month?`,
        constraints: [
          'Zero hyperbole — B2B buyers will see through it immediately',
          'Must reach decision-makers and budget holders, not just practitioners',
          "Cannot rely on organic social — target audience doesn't discover B2B tools that way",
          'Trial requires IT approval — messaging must speak to both champions and approvers',
        ],
        clientPersonality: 'Data-driven, frustrated by the AI hype cycle, wants to be challenged creatively, knows enough about marketing to recognize when you are bluffing',
        industry: 'saas',
      },
    }),
  },

  // ─── Unlock after 4th completed campaign ────────────────────────────────────

  {
    unlockAt: 4,
    clientName: 'Meridian Studios',
    briefId: 'email-013',
    buildEmail: (): Email => ({
      id: 'email-013',
      type: 'campaign_brief',
      from: {
        name: 'Rachel Kwan',
        email: 'rkwan@meridianstudios.com',
        avatar: '🎬',
      },
      subject: 'Meridian Studios — Unlikely Double Feature (Confidential)',
      body: `Hi team,

Rachel Kwan here, VP of Theatrical Marketing at Meridian Studios.

I've got a situation. We have two films releasing the same weekend — July 18th — that could not be more different:

**"THE LEDGER"** — A gritty true crime thriller about a disgraced forensic accountant who discovers a money laundering operation inside the IRS. Dark, tense, Oscar-bait. Director is coming off a Venice Lion. Rated R.

**"GOOD BOY: THE MUSICAL"** — An animated family musical about a golden retriever named Biscuit who accidentally becomes a pop star after a TikTok goes viral. It's joyful, ridiculous, and the soundtrack is genuinely great. Rated G.

Here's the pitch: We want to manufacture a cultural moment.

You remember Barbenheimer? That wasn't planned. It just happened — the internet decided that seeing both Barbie and Oppenheimer on the same day was an Event. It became a meme, then a movement, then a $2.4 billion box office weekend.

We want to do that — on purpose.

"The Ledger" by day, "Good Boy" by night. The Sad Dad Double Feature. The emotional whiplash weekend. We want the internet to decide that seeing both is the only correct move.

The problem: manufactured virality is an oxymoron. If it feels forced, the internet will roast us. We need it to feel organic, inevitable — like the audience invented it themselves.

Budget: $60,000 for the combined social/grassroots campaign (separate from each film's individual media buy).
Timeline: 26 days until the films are in theaters.

Make the internet obsessed with seeing both. Memes encouraged.

Rachel`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'Meridian Studios',
        challenge: `Two wildly different films release the same weekend: a gritty R-rated crime thriller and a joyful G-rated animated musical about a golden retriever pop star. We want to manufacture a Barbenheimer-style cultural moment — make seeing both on the same day feel like an event the internet invented, not a marketing stunt. The problem: manufactured virality feels forced. We need it to feel organic and inevitable.`,
        audience: `The internet. Specifically: movie Twitter/TikTok (18-35), meme creators, film podcasters, and the general audience that turned Barbenheimer into a phenomenon. They're savvy, they can smell astroturfing, and they'll only participate if they feel like they're in on the joke — not being sold to.`,
        message: `July 18th: The Ledger by day. Good Boy by night. The only correct way to spend the weekend. You're not choosing between them. You're doing both.`,
        successMetrics: [
          'Portmanteau hashtag trends organically on Twitter/TikTok before release weekend',
          'Meme volume exceeds 10K organic posts in the week before release',
          'Combined opening weekend box office exceeds projections by 20%+',
          'Audience exit surveys show 30%+ saw both films on the same day',
          'At least one major media outlet writes "the next Barbenheimer" headline',
        ],
        budget: 60000,
        timeline: '26 days — films are locked. Release date is fixed. Cultural moment is now or never.',
        vibe: `Internet-native, self-aware, playful. Should feel like the audience created it. Memes, not ads. Inside jokes, not taglines. The campaign should feel like discovering something, not being marketed to.`,
        openEndedAsk: `How do you manufacture a cultural moment without it feeling manufactured? What's the seed that makes the internet decide "seeing both is the move"? How do you make emotional whiplash feel like a feature, not a bug?`,
        constraints: [
          'Cannot feel like a corporate marketing stunt — internet will reject it instantly',
          'Must serve both films equally — neither is the "joke" one',
          'Meme seeding must feel organic, not astroturfed',
          'Cannot promise or imply any connection between the two films\' stories',
          'Each film has its own separate traditional media campaign — this is the cultural layer only',
        ],
        clientPersonality: 'Sharp, understands internet culture, will greenlight bold ideas fast, allergic to anything that feels like "fellow kids" energy, trusts the agency but will kill anything inauthentic',
        industry: 'entertainment',
      },
    }),
  },

];
