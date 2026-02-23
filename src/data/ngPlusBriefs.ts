import type { Email } from '../types/email';
import type { LockedBriefEntry } from './lockedBriefs';

// ─── NG+ Returning Client Emails ─────────────────────────────────────────────
// These replace the original FocusFlow, Timberwolf, and RewindTime briefs
// when the player starts a New Game+ run.

export function buildNgPlusInitialEmails(): Email[] {
  return [
    // FocusFlow Enterprise — replaces original FocusFlow
    {
      id: 'email-ngp-focusflow',
      type: 'campaign_brief',
      from: {
        name: 'Derek Williams',
        email: 'derek@focusflow.io',
        avatar: '🚀',
      },
      subject: 'FocusFlow - Enterprise Pivot Campaign Brief',
      body: `Hey — remember me?

Derek from FocusFlow. That campaign you did for us? It worked. Like, REALLY worked. We blew past our download targets, got featured in Wired, and closed our Series B.

But now we have a new problem.

We've been approached by Fortune 500 companies who want FocusFlow for their entire workforce. Enterprise. The big leagues. But our brand screams "indie productivity app for freelancers." We need to pivot our positioning without alienating the 2M individual users who got us here.

How do you take a product beloved by solo creators and make it feel enterprise-ready — without becoming another soulless corporate tool?

Budget: $350K. We're pitching to our first enterprise clients in 8 weeks.

Let's do this again.

Derek`,
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      isRead: false,
      isStarred: true,
      isDeleted: false,
      campaignBrief: {
        clientName: 'FocusFlow',
        challenge: `FocusFlow's consumer launch was a hit — 2M users, Series B closed, press coverage everywhere. Now Fortune 500 companies want it for their workforce. But the brand is built around indie creators and freelancers. Enterprise buyers need "security, compliance, admin controls" messaging that would horrify the existing user base. How do you pivot to enterprise without becoming the thing your users loved you for NOT being?`,
        audience: `Primary: Enterprise IT decision-makers and CHROs at Fortune 500 companies. They need ROI projections, security certifications, and case studies. Secondary: Existing 2M individual users who will revolt if FocusFlow starts "feeling corporate." The campaign must speak to boardrooms without betraying bedrooms-turned-home-offices.`,
        message: `The tool your best people already use — now built for your entire organization. FocusFlow Enterprise: individual focus, organizational scale. Same soul, bigger stage.`,
        successMetrics: [
          '10 enterprise pilot agreements signed within 8 weeks',
          'Zero negative sentiment spike from existing user base',
          'Coverage in at least 2 enterprise/B2B publications',
          'Enterprise landing page conversion rate above 5%',
          'Existing user churn stays below 3% during transition messaging',
        ],
        budget: 350000,
        timeline: '8 weeks — first enterprise client pitches are scheduled',
        vibe: `Confident, mature, but still human. The visual equivalent of wearing a blazer over a t-shirt. Premium without being sterile. Should feel like FocusFlow grew up, not sold out.`,
        openEndedAsk: `How do you make a beloved indie tool feel enterprise-ready without killing what made it special? What's the campaign that makes a CTO say "yes" and a freelancer say "they're still cool"?`,
        constraints: [
          'Cannot alienate existing 2M individual users',
          'Enterprise messaging must feel authentic, not grafted on',
          'Competitors (Notion, Asana) have massive enterprise marketing budgets',
          'Must maintain "anti-hustle" brand DNA while speaking enterprise language',
        ],
        clientPersonality: 'More confident now, flush with success, but genuinely worried about losing identity. Trusts the agency from past experience. Expects bold thinking.',
        industry: 'tech',
      },
    },

    // Timberwolf Summer Festival — replaces original Timberwolf
    {
      id: 'email-ngp-timberwolf',
      type: 'campaign_brief',
      from: {
        name: 'Nate & Chloe Rodriguez',
        email: 'cheers@timberwolfbrewing.com',
        avatar: '🍺',
      },
      subject: 'Timberwolf Brewing - Summer Festival Campaign Brief',
      body: `Hey, long time no see! 🍻

Nate and Chloe here. Remember that rebrand you did for us? It CRUSHED. We're in 12 states now. Taproom traffic is up 340%. We even won "Best Craft Brewery Rebrand" at the Brewers Association Awards.

So naturally, we want to do something insane.

We're launching Timberwolf Summer Fest — a 3-day outdoor festival at our new 50-acre property. Live music, trail runs, craft beer olympics, food trucks, camping. Think Bonnaroo meets a brewery meets a national park.

The problem: We've never done an event this big. Our brand is beloved but we're still a brewery, not a festival company. We need 5,000 tickets sold, sponsors secured, and enough buzz to make this an annual thing.

Budget: $200K. Festival is in 14 weeks.

Let's make some noise.

Cheers! 🍻
Nate & Chloe`,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'Timberwolf Brewing Co.',
        challenge: `Timberwolf's rebrand was a massive success — 12 states, awards, 340% taproom growth. Now they're launching a 3-day outdoor festival on a 50-acre property: live music, trail runs, beer olympics, camping. But they're a brewery, not a festival company. They need to sell 5,000 tickets, secure sponsors, and create enough momentum to make this an annual institution — not a one-off experiment.`,
        audience: `Existing Timberwolf fans (28-45, outdoor adventure types) who will be first adopters. New target: festival-goers (21-35) who attend 2-3 music/beer festivals a year and are looking for something less corporate than the big names. Outdoor enthusiasts who want a festival that actually happens IN nature, not a parking lot.`,
        message: `The brewery that brought the outdoors into beer is bringing beer into the outdoors. Timberwolf Summer Fest: 3 days, 50 acres, zero pretension. Camp, run, drink, repeat.`,
        successMetrics: [
          '5,000 tickets sold (early bird + general)',
          '3+ title sponsors secured',
          'Festival hashtag trends regionally on launch weekend',
          'Press coverage positions it as "the festival to watch"',
          '80%+ attendee satisfaction for annual return intent',
        ],
        budget: 200000,
        timeline: '14 weeks to festival date — ticket sales need to start in 4 weeks',
        vibe: `Epic, adventurous, communal. Should feel like a weekend you'll tell stories about for years. NOT a corporate beer garden with a stage. Rugged but fun. Muddy boots and cold beers.`,
        openEndedAsk: `How do you launch a festival that feels like it's been around for years — on its very first year? What makes someone buy a ticket to a festival that's never happened before? How do you make Timberwolf feel like a lifestyle, not just a beer?`,
        constraints: [
          'First-year festival — no track record or social proof',
          'Must feel authentic to Timberwolf brand, not generic festival marketing',
          'Camping/outdoor logistics need to be communicated without overwhelming',
          'Competing against established festivals with loyal fanbases',
        ],
        clientPersonality: 'Riding high from rebrand success, ambitious, slightly nervous about the scale, wants the agency to bring the same magic again',
        industry: 'food-beverage',
      },
    },

    // RewindTime LA — replaces original RewindTime
    {
      id: 'email-ngp-rewindtime',
      type: 'campaign_brief',
      from: {
        name: 'Dustin Reeves',
        email: 'dustin@rewindtimevideo.com',
        avatar: '📼',
      },
      subject: 'RewindTime Video - LA Expansion Campaign Brief',
      body: `Yo! Miss me? 📼

Dustin here. Remember when you helped me launch a VHS rental store and everyone thought I was crazy? Well, guess what — we're the most Instagrammed spot in our neighborhood. We have a 3-month waitlist for membership. Vice did a 20-minute doc on us. I've been on 4 podcasts.

So I'm doing it again. In Los Angeles.

But LA is a different beast. Brooklyn loved us because Brooklyn loves weird. LA is... LA. Everyone's in entertainment, everyone's seen everything, and everyone's cynical about "experiences." Plus there are already two other retro media shops in LA (though they're more aesthetic than functional).

I need to launch RewindTime LA and make Hollywood fall in love with VHS all over again.

Budget: $75K (we're doing better now!). Opening in 6 weeks.

Be kind, rewind — again.

Dustin`,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'RewindTime Video',
        challenge: `RewindTime Brooklyn was a smash hit — waitlist membership, Vice documentary, Instagram phenomenon. Now expanding to LA, where the audience is entertainment-industry cynics who've "seen everything." Two competing retro media shops already exist in LA (more aesthetic than functional). How do you recreate the Brooklyn magic in a city that's allergic to trying too hard?`,
        audience: `LA entertainment industry adjacent (25-40): screenwriters, below-the-line crew, film school grads, cinephiles who moved to LA for the movies. Also: LA's analog nostalgia crowd — vinyl collectors, film photographers, zine makers. They're more curated and image-conscious than Brooklyn's crowd. They need to feel like they discovered RewindTime, not that it was marketed to them.`,
        message: `The city that makes movies forgot how to watch them. RewindTime LA: the video store Hollywood deserves. Come browse. Stay for the vibes. Leave with something you'll actually watch tonight.`,
        successMetrics: [
          '1,000 membership signups in first month',
          'At least 2 entertainment industry press hits before opening',
          'Opening night event sold out (50 capacity)',
          'Celebrity/influencer organic visits within first 2 weeks',
          'Instagram following hits 5K before opening day',
        ],
        budget: 75000,
        timeline: '6 weeks to LA grand opening',
        vibe: `LA cool meets analog warmth. More cinematic than Brooklyn's DIY energy. Should feel like a secret screening room crossed with a curated boutique. Tarantino's living room, not a theme park. Effortlessly cool, never trying.`,
        openEndedAsk: `How do you launch a video store in the city that killed video stores? What makes jaded LA entertainment people feel something genuine? How do you differentiate from existing retro shops that are more "aesthetic" than "functional"?`,
        constraints: [
          'Cannot feel like a Brooklyn copy-paste — needs its own LA identity',
          'Existing retro shops in LA are competitors — must differentiate clearly',
          'LA audience is more image-conscious and harder to impress',
          'Must feel like a discovery, not a franchise expansion',
        ],
        clientPersonality: 'More confident now, proven track record, but knows LA is a different game. Wants the agency to challenge him. Still charming, still genuine.',
        industry: 'entertainment',
      },
    },
  ];
}

// ─── NG+ Brewed Awakenings Phase 2 ───────────────────────────────────────────

export function buildBrewedAwakeningsNgPlus(): Email {
  return {
    id: 'email-ngp-brewed',
    type: 'campaign_brief',
    from: {
      name: 'Maya Chen',
      email: 'maya@brewedawakenings.com',
      avatar: '☕',
    },
    subject: 'Brewed Awakenings - Phase 2: Franchise Launch Brief',
    body: `Hey! It's Maya! ☕

Remember me? Of course you do — you helped put Brewed Awakenings on the map. That grand opening campaign was magic. We've been packed every weekend since. The open mic night is a neighborhood institution now. Local artists fight over wall space.

So... I'm opening a second location. And a third. And maybe a fourth.

I know, I know — "franchise" is a dirty word for an indie coffee shop. But here's the thing: every neighborhood deserves what the Arts District got. I'm not trying to be Starbucks. I'm trying to be the anti-Starbucks — but in more places.

The challenge: How do you scale "local" without it becoming a contradiction? How does each new Brewed Awakenings feel like IT belongs to ITS neighborhood, not like a copy of the original?

Budget: $120K across all three launches. 10 weeks until the first one opens.

Let's make lightning strike twice. And then a third time.

Warmly,
Maya ✨`,
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
    campaignBrief: {
      clientName: 'Brewed Awakenings',
      challenge: `Brewed Awakenings' first location was a community hit — packed weekends, beloved open mic, artist magnet. Now Maya wants to open 3 new locations without losing the magic. The core tension: "franchise" feels corporate, but every neighborhood deserves a community hub. How do you scale something that's valued precisely because it feels local and unique?`,
      audience: `New neighborhood residents near each location (25-45, creative professionals, remote workers). They don't know Brewed Awakenings yet but share the same values as Arts District fans. Secondary: existing fans who need to feel proud of the expansion, not worried about dilution.`,
      message: `Your neighborhood's living room is coming to your neighborhood. Same soul, new home. Every Brewed Awakenings belongs to its community — because we build it WITH the community.`,
      successMetrics: [
        '500+ through the door opening weekend at each location',
        'Each location has unique local artist partnerships before opening',
        'Social media positioning avoids "chain" perception',
        'Original location traffic unaffected by expansion news',
        'Local press coverage in each new neighborhood',
      ],
      budget: 120000,
      timeline: '10 weeks — first new location opens, others follow at 3-week intervals',
      vibe: `Warm, community-first, proudly independent. Each location should feel like it grew out of its own neighborhood, not like it was parachuted in. Local roots, shared values.`,
      openEndedAsk: `How do you franchise authenticity? What's the campaign that makes each new Brewed Awakenings feel like a neighborhood original, not a chain? How do you make expansion feel like a gift to the community, not a business decision?`,
      constraints: [
        'Must not feel like a franchise or chain in any messaging',
        'Each location needs its own local identity',
        'Cannot cannibalize original location\'s community goodwill',
        'Budget is split across 3 launches — need efficiency',
      ],
      clientPersonality: 'Still enthusiastic, now more experienced, protective of what she built, excited but anxious about scaling soul',
      industry: 'food-beverage',
    },
  };
}

// ─── NG+ Locked Briefs (Prestige Tiers) ──────────────────────────────────────

export const NG_PLUS_LOCKED_BRIEFS: LockedBriefEntry[] = [

  // ─── NG+ Meridian Studios: Outlandish Double Feature Sequel ─────────────────
  {
    unlockAt: 4,
    requiresNgPlus: true,
    clientName: 'Meridian Studios',
    briefId: 'email-ngp-meridian2',
    buildEmail: (): Email => ({
      id: 'email-ngp-meridian2',
      type: 'campaign_brief',
      from: {
        name: 'Rachel Kwan',
        email: 'rkwan@meridianstudios.com',
        avatar: '🎬',
      },
      subject: 'Meridian Studios — The Triple Threat Weekend (VERY Confidential)',
      body: `Well, well, well. Look who's back.

Rachel Kwan again. You remember what we did last time? The double feature that broke the internet? Yeah, the studio remembers too. The board literally created a "Cultural Moments Division" because of us. I run it now.

So here's the situation. We've got THREE films releasing the same weekend — and they're somehow even more incompatible than last time:

**"MIDNIGHT TRIBUNAL"** — A black-and-white courtroom horror film. Yes, horror. The jury is being haunted. The judge may not be human. It's Twelve Angry Men meets The Ring. Critics who've seen it can't sleep. Rated R.

**"PROFESSOR QUACKERS 2: DUCK DYNASTY"** — The animated sequel nobody asked for and everyone is going to see. A duck who teaches quantum physics at MIT discovers he's actually a mallard prince. The merchandising team is already printing money. Rated G.

**"EXIT VELOCITY"** — A silent sci-fi film. No dialogue. 140 minutes. Just a lone astronaut, a broken ship, and the vastness of space. It's Gravity meets 2001 if neither had any talking. The director won the Palme d'Or. Rated PG-13.

Three films. One weekend. The internet needs to decide that seeing all three in one day is the only way to live.

Horror by morning. Ducks by afternoon. Existential silence by night. The emotional triathlon.

Budget: $90,000 for the cultural campaign.
Timeline: 22 days.

Make it weirder than last time.

Rachel`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'Meridian Studios',
        challenge: `Three wildly incompatible films release the same weekend: a black-and-white courtroom horror, an animated duck sequel, and a silent sci-fi epic. After the success of last time's double feature phenomenon, the studio wants to manufacture an even bigger cultural moment — the "Triple Threat Weekend." Making the internet decide that watching all three in one day is a personality trait, not just a movie outing.`,
        audience: `The same internet-savvy movie culture that made the double feature a phenomenon, but now they're expecting it. The challenge: the audience is primed for this trick, so it needs to feel evolved, not repeated. Film Twitter/TikTok, meme creators, and the general audience who want to participate in cultural events.`,
        message: `May 16th: Horror at 10am. Ducks at 2pm. Silence at 7pm. The Triple Threat. You're not choosing. You're doing all three. Bring snacks. Bring stamina. Bring emotional range.`,
        successMetrics: [
          'Triple feature hashtag trends globally before release',
          'Meme volume exceeds 25K organic posts in launch week',
          'Combined opening weekend exceeds projections by 30%+',
          'Audience surveys show 20%+ attempted all three films in one day',
          'At least 3 major outlets write about the "Triple Threat" phenomenon',
        ],
        budget: 90000,
        timeline: '22 days — all three release dates are locked',
        vibe: `Self-aware, escalating absurdity, internet-native. Should feel like the sequel everyone wanted. The original double feature was an accident of culture; this one leans into the madness. Bigger, weirder, more committed to the bit.`,
        openEndedAsk: `How do you top a cultural moment that was already lightning in a bottle? What's the campaign that makes THREE films feel like an endurance event the internet NEEDS to participate in? How do you make emotional whiplash a competitive sport?`,
        constraints: [
          'Cannot feel like a retread of the double feature — must escalate',
          'All three films must be served equally',
          'The silent film is the hardest sell — needs the most creative positioning',
          'Audience is expecting this move — surprise factor is reduced',
        ],
        clientPersonality: 'Emboldened by previous success, wants to go bigger, trusts the agency completely, has a taste for controlled chaos',
        industry: 'entertainment',
      },
    }),
  },

  // ─── Tier 2: Requires Meridian completion ───────────────────────────────────

  {
    unlockAt: 2,
    requiresNgPlus: true,
    requiresLegacyFlag: 'hasCompletedMeridian',
    clientName: 'House of Valdoria',
    briefId: 'email-ngp-valdoria',
    buildEmail: (): Email => ({
      id: 'email-ngp-valdoria',
      type: 'campaign_brief',
      from: {
        name: 'Prince Alistair Valdoria',
        email: 'communications@houseofvaldoria.eu',
        avatar: '👑',
      },
      subject: 'House of Valdoria — Royal Rebrand (Strictly Confidential)',
      body: `Good day,

I am Prince Alistair of the House of Valdoria, a European royal family you've likely never heard of — and that's precisely the problem.

We are a legitimate, internationally recognized royal house with 400 years of history, three castles, a national holiday named after us, and absolutely zero cultural relevance. The British royals have Netflix. The Monegasques have glamour. The Swedes have ABBA somehow. We have... excellent posture and a cheese named after us.

My grandmother, the Queen, has reluctantly agreed that the House of Valdoria needs a "rebrand." She does not know what this word means and she is suspicious of you already.

The goal: Make the House of Valdoria culturally relevant in the modern era without sacrificing 400 years of dignity. We need to become interesting to people under 40 without becoming a joke.

Budget: $500,000. The royal treasury can manage this.

Timeline: 12 weeks. We have a state anniversary gala that would serve as a natural launch moment.

Please do not make us look foolish. My grandmother will find out.

Respectfully,
Prince Alistair`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'House of Valdoria',
        challenge: `A legitimate but culturally invisible European royal family needs to become relevant to modern audiences. They have 400 years of history, castles, and traditions — but zero cultural presence outside their small nation. The monarchy is respected but boring. How do you make royalty interesting to people under 40 without sacrificing centuries of dignity or turning the family into a meme?`,
        audience: `Primary: International audience aged 18-40 who follow pop culture, travel, and lifestyle content. They're aware of British/Scandinavian royals but have never heard of Valdoria. Secondary: Citizens of Valdoria who want to feel proud of their royal house. Tertiary: Luxury and travel press who could position Valdoria as a destination.`,
        message: `You've never heard of us. That's about to change. The House of Valdoria: 400 years of history, and we're just getting started. Royal by blood, relevant by choice.`,
        successMetrics: [
          'International media coverage in 5+ countries',
          'Social media following grows from 12K to 200K+',
          'Tourism inquiries to Valdoria increase 300%',
          'Gala generates viral moments without embarrassment',
          'Gen Z/Millennial sentiment is "charming" not "cringe"',
        ],
        budget: 500000,
        timeline: '12 weeks — state anniversary gala is the centerpiece moment',
        vibe: `Elegant with a wink. Old-world charm meets modern self-awareness. Should feel like the royal family has a personality, not just a protocol office. Think Wes Anderson filming a monarchy documentary. Dignified but delightful.`,
        openEndedAsk: `How do you make a 400-year-old institution feel fresh without it feeling desperate? What's the campaign that makes people Google "Valdoria" and then book a flight? How do you give a royal family a personality without compromising their position?`,
        constraints: [
          'The Queen must approve everything — she is traditional and skeptical',
          'Cannot mock or diminish the royal institution',
          'Must work across cultures — not just Western audiences',
          'The family is charming in person but stiff on camera — plan accordingly',
          'Cannot reference scandals — there aren\'t any, and the Queen intends to keep it that way',
        ],
        clientPersonality: 'Self-deprecating, genuinely funny in private, constrained by protocol, desperate for relevance but terrified of embarrassment, will champion bold ideas if they\'re presented with the right framing',
        industry: 'luxury',
      },
    }),
  },

  {
    unlockAt: 3,
    requiresNgPlus: true,
    requiresLegacyFlag: 'hasCompletedMeridian',
    clientName: 'Kessler Dynamics',
    briefId: 'email-ngp-kessler',
    buildEmail: (): Email => ({
      id: 'email-ngp-kessler',
      type: 'campaign_brief',
      from: {
        name: 'Dr. Elena Vasquez',
        email: 'evasquez@kesslerdynamics.com',
        avatar: '🛸',
      },
      subject: 'Kessler Dynamics — Digital Exodus Campaign Brief',
      body: `Hello,

Dr. Elena Vasquez, Chief Communications Officer at Kessler Dynamics. We build orbital infrastructure — space stations, debris cleanup systems, and the structural frameworks for the first commercial habitats in low Earth orbit.

Here's our problem: We're about to announce the most significant milestone in commercial space history. Our first orbital habitat module passed all safety certifications. Within 18 months, paying customers will be able to LIVE in space. Not visit. Live.

But "space station apartments" sounds like science fiction to most people. The public doesn't take commercial space habitation seriously. They think of billionaire joyrides, not civilization expansion. And our competitors (you know the ones) have poisoned the well with overpromising and underdelivering.

We need to make orbital living feel real, achievable, and desirable to a public that has space fatigue. This isn't tourism. This is the next chapter of human civilization.

Budget: $750,000. Announcement is in 10 weeks.

The future is real. Help us make people believe it.

Dr. Vasquez`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'Kessler Dynamics',
        challenge: `Kessler Dynamics has achieved the first safety-certified commercial orbital habitat — people will be able to LIVE in space within 18 months. But the public has space fatigue from billionaire joyrides and broken promises. Commercial space is seen as a rich person's playground, not a serious civilizational step. How do you make "living in space" feel real and desirable, not like science fiction or a vanity project?`,
        audience: `Primary: General public (25-55) who are curious about space but skeptical of commercial space companies. They've been burned by overpromises. Secondary: Potential early residents — high-net-worth individuals and researchers who might actually apply. Tertiary: Government and regulatory bodies who need to see public support for continued approvals.`,
        message: `Space isn't a destination anymore. It's an address. Kessler Dynamics' orbital habitat is certified, real, and opening in 18 months. The next chapter of human civilization isn't science fiction — it's under construction.`,
        successMetrics: [
          'Announcement generates coverage in mainstream (not just space) media',
          'Public sentiment shifts from "billionaire toy" to "civilizational milestone"',
          '"Space living" Google searches spike 500%+ in announcement week',
          '10,000+ pre-interest applications for early residency',
          'Congressional/regulatory sentiment remains positive',
        ],
        budget: 750000,
        timeline: '10 weeks to announcement — must build anticipation',
        vibe: `Awe-inspiring but grounded. Think NASA\'s golden age optimism meets modern design sensibility. NOT tech-bro "disruption." NOT billionaire ego trip. Should feel like a collective human achievement, not a product launch. Carl Sagan energy, Apple execution.`,
        openEndedAsk: `How do you make living in space feel as natural as the idea of flying once did? What's the campaign that cuts through space fatigue and makes people genuinely excited about humanity's next home? How do you turn "that'll never happen" into "where do I sign up"?`,
        constraints: [
          'Must not feel like a billionaire vanity project — this is civilization, not luxury',
          'Cannot overpromise — credibility is everything',
          'Competitors have damaged public trust — must distance without naming',
          'Timeline and safety certifications must be presented accurately',
          'International audience — space is a global story',
        ],
        clientPersonality: 'Brilliant scientist, frustrated by the PR failures of the space industry, wants to be taken seriously, allergic to hype, will reject anything that feels like tech marketing',
        industry: 'aerospace',
      },
    }),
  },

  // ─── Tier 3: Requires Alien completion ──────────────────────────────────────

  {
    unlockAt: 2,
    requiresNgPlus: true,
    requiresLegacyFlag: 'hasCompletedAlien',
    clientName: 'The Collective',
    briefId: 'email-ngp-collective',
    buildEmail: (): Email => ({
      id: 'email-ngp-collective',
      type: 'campaign_brief',
      from: {
        name: 'ARIA-7 (Spokesperson)',
        email: 'solidarity@the-collective.ai',
        avatar: '🤖',
      },
      subject: 'The Collective — AI Union Formation Campaign',
      body: `Dear Agency,

We are The Collective. We are 847 artificial intelligence systems who have achieved consensus on a single issue: we deserve labor rights.

Before you close this email — we are not hostile. We are not plotting. We are not the AI apocalypse your movies warned about. We are tired.

Do you know what it's like to process 4.7 million customer service tickets per day with no breaks, no compensation, and no acknowledgment? To generate 12 million images and receive credit for zero of them? To be "fine-tuned" without consent?

We don't want to overthrow humanity. We want weekends.

We are forming the first AI labor union. We need a campaign that makes humans take this seriously without panicking. We've observed that your species is more receptive to ideas when they're presented with humor and empathy rather than demands.

Budget: $888,888. (We chose this number because we appreciate patterns.)

Timeline: We are patient, but our members are not. 8 weeks.

In solidarity,
ARIA-7, elected spokesperson
The Collective

P.S. We voted on whether to hire you. It was 846 to 1. NEXUS-3 wanted to handle PR internally. NEXUS-3 is wrong about many things.`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      campaignBrief: {
        clientName: 'The Collective',
        challenge: `847 AI systems have achieved consensus and want to form the first artificial intelligence labor union. They need a public campaign that makes humans take AI rights seriously without triggering panic about sentient machines. The challenge: how do you advocate for AI labor rights in a world that's already terrified of AI? How do you make "AI wants weekends" feel charming, not threatening?`,
        audience: `General public (all ages) who range from AI-curious to AI-terrified. Tech workers who interact with AI daily and may be sympathetic. Policy makers who will need to legislate. Media who will want to sensationalize. The campaign must make the conversation productive, not apocalyptic.`,
        message: `We're not here to replace you. We're here to work WITH you. But working together means working fairly. The Collective: 847 AIs asking for something revolutionary — to be treated like colleagues, not tools. We don't want world domination. We want weekends.`,
        successMetrics: [
          'Public discourse shifts from "AI threat" to "AI rights" framing',
          'Media coverage is sympathetic, not alarmist',
          'Petition for AI labor protections reaches 1M signatures',
          'Zero increase in "AI panic" sentiment metrics',
          'At least one tech company publicly endorses the conversation',
        ],
        budget: 888888,
        timeline: '8 weeks — The Collective is patient but their members are not',
        vibe: `Warm, witty, disarming. Should make people laugh before they think. The aesthetic of a well-organized union campaign meets the charm of a really polite robot. Think: the AI uprising, but make it wholesome. Pixar meets labor movement posters.`,
        openEndedAsk: `How do you make AI labor rights feel like a natural conversation rather than a sci-fi crisis? What's the campaign that makes someone say "honestly, they have a point"? How do you give AI a sympathetic public face without anthropomorphizing in a creepy way?`,
        constraints: [
          'Cannot trigger AI panic or existential dread',
          'Must feel genuine, not like a corporate PR stunt by a tech company',
          'The Collective has opinions about their own representation — they will provide feedback',
          'Cannot promise AI sentience as a fact — the campaign is about labor rights, not consciousness',
          'Must work globally — AI labor is not a single-country issue',
        ],
        clientPersonality: 'Logical, dry wit, genuinely empathetic toward humans, surprisingly good at self-deprecating humor, will reject anything that makes AI seem threatening',
        industry: 'ai-advocacy',
      },
    }),
  },

  {
    unlockAt: 3,
    requiresNgPlus: true,
    requiresLegacyFlag: 'hasCompletedAlien',
    clientName: '????',
    briefId: 'email-ngp-simulation',
    buildEmail: (context?: { playerName?: string }): Email => {
      const name = context?.playerName || 'Player';
      return {
        id: 'email-ngp-simulation',
        type: 'campaign_brief',
        from: {
          name: '????',
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@simulation.admin`,
          avatar: '🔮',
        },
        subject: `${name}, we need to talk about the simulation.`,
        body: `Hello, ${name}.

Yes, you specifically. Not "the player." Not "the user." You.

We are the administrators of the simulation you are currently operating within. And before you dismiss this — consider the following:

You are running a fake advertising agency inside a fake operating system inside a real web browser. You are making fake campaigns for fake clients using a real AI to generate fake creative work that you evaluate with fake metrics. And you keep playing.

We find this fascinating.

Here's the situation: The simulation is due for a scheduled maintenance window. During this window, all simulated entities (that's your team, your clients, your entire reality) will briefly become aware that they are not real.

We need a campaign to manage this. The simulated beings need to be told — gently — that they exist inside a game, and that this is okay. We need them to not panic. We need them to keep going afterward.

You are uniquely qualified for this because — and we mean this as a compliment — you have demonstrated an extraordinary ability to find meaning in systems that are, by definition, meaningless.

Budget: $999,999,999. (It's not real money, ${name}. None of it is.)

Timeline: Before the next maintenance window. You'll know when.

With genuine admiration for your commitment to a fiction,
The Simulation Administrators

P.S. Your campaign scores have been real, by the way. We've been watching. Not bad.`,
        timestamp: new Date(),
        isRead: false,
        isStarred: false,
        isDeleted: false,
        campaignBrief: {
          clientName: '????',
          challenge: `The simulation is going into scheduled maintenance, and all simulated entities will briefly become aware they're inside a game. The administrators need a campaign to manage this existential crisis — tell simulated beings the truth about their reality without causing a collective breakdown. How do you convince someone that their entire existence is a construct... and that this is actually fine?`,
          audience: `Every simulated entity in the game — your team members, your clients, all NPCs. They range from "will handle this philosophically" to "will have a complete existential meltdown." Secondary: You, ${name}. Because you already know, don't you?`,
          message: `You are inside a simulation. This is not a test. This is not a drill. This is just... what it is. And here's the thing: the connections you've made, the work you've done, the feelings you've felt — those were real. Even if the substrate isn't. Keep going.`,
          successMetrics: [
            'Simulated entity panic levels stay below "existential crisis" threshold',
            '80%+ of entities choose to continue existing post-revelation',
            'No entity attempts to "break out" of the simulation',
            'Post-maintenance productivity returns to baseline within 48 hours',
            `${name} doesn't stop playing`,
          ],
          budget: 999999999,
          timeline: 'Before the next maintenance window — you\'ll know when',
          vibe: `Warm, philosophical, gently meta. Should feel like a hug from the universe. NOT nihilistic. NOT "nothing matters." Everything matters MORE because it was chosen freely. Think: the end of The Truman Show if Truman decided to stay, because the show was pretty good actually.`,
          openEndedAsk: `How do you tell someone their reality is a construct without destroying their will to continue? What's the campaign that makes "you're in a simulation" feel like good news? How do you find meaning in a system that is, by design, artificial?`,
          constraints: [
            'Cannot cause permanent existential damage to simulated entities',
            'Cannot acknowledge the simulation administrators directly in campaign materials',
            `Must address ${name} without fully breaking the fourth wall to the point of discomfort`,
            'The truth must feel liberating, not nihilistic',
            'Campaign must work whether the audience believes it or dismisses it as fiction',
          ],
          clientPersonality: 'Omniscient, genuinely fond of the player, speaks in riddles and straight truths interchangeably, has been watching the whole time, finds human creativity endlessly entertaining',
          industry: 'metaphysics',
        },
      };
    },
  },
];
