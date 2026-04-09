import type { Email } from '../types/email';

// ─── Seasonal Brief Entry ─────────────────────────────────────────────────────

export interface SeasonalBriefEntry {
  briefId: string;
  clientName: string;
  /** Month (1-indexed) when the brief becomes available */
  availableMonth: number;
  /** Day of month when the brief becomes available */
  availableDay: number;
  /** Month (1-indexed) when the brief expires (exclusive) */
  expiresMonth: number;
  expiresDay: number;
  buildEmail: () => Email;
}

/** Check if a seasonal brief is currently active based on real-world date */
export function isSeasonalBriefActive(entry: SeasonalBriefEntry, now: Date = new Date()): boolean {
  const month = now.getMonth() + 1; // 1-indexed
  const day = now.getDate();
  const start = entry.availableMonth * 100 + entry.availableDay;
  const end = entry.expiresMonth * 100 + entry.expiresDay;
  const current = month * 100 + day;
  return current >= start && current < end;
}

// ─── Seasonal Briefs ──────────────────────────────────────────────────────────
//
// Seasonal content comes and goes.
//
// - SEASONAL_BRIEFS: active rotation. These auto-deliver within their date
//   window. Add new seasonal briefs here.
// - RETIRED_SEASONAL_BRIEFS: retired content. No longer auto-delivered, but
//   the definitions are kept around so Easter-egg cheat codes can still
//   conjure them for players who know the secret. Any retired-brief email
//   still sitting unstarted in a player's inbox is cleaned out on next load
//   (see useCoreGameEffects.ts). Mid-campaign and completed campaigns are
//   left alone.

export const SEASONAL_BRIEFS: SeasonalBriefEntry[] = [];

export const RETIRED_SEASONAL_BRIEFS: SeasonalBriefEntry[] = [

  // ─── Women's History Month — ran March 1 through March 31 ──────────────────

  {
    briefId: 'email-seasonal-whm-001',
    clientName: 'Maison Aura',
    availableMonth: 3,
    availableDay: 1,
    expiresMonth: 4,
    expiresDay: 1,
    buildEmail: (): Email => ({
      id: 'email-seasonal-whm-001',
      type: 'campaign_brief',
      from: {
        name: 'Colette Renard',
        email: 'colette@maisonaura.com',
        avatar: '👗',
      },
      subject: "Maison Aura — Women's History Month Campaign Brief",
      body: `Hello,

I'm Colette Renard, Chief Brand Officer at Maison Aura. We're an 80-year-old heritage fashion house, and we have a story we've never told — one that's long overdue.

Over half of our most iconic pieces were created by women who were never credited. Their male creative directors got the spotlight while the actual designers remained anonymous. We have the archives. We have the sketches. We have the names. And this Women's History Month, we want to correct the record.

We're planning to open the archives, name the names, and publicly reattribute the work. This isn't a feel-good campaign — it's an overdue reckoning with our own history.

We need the fashion press, culture writers, and our own customers to care about this. The risk is it looks like corporate guilt or a PR stunt. The opportunity is it becomes a genuine cultural moment that redefines how the industry treats attribution.

Budget: $75,000. We need this to land in March.

Colette`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      isSeasonal: true,
      campaignBrief: {
        clientName: 'Maison Aura',
        challenge: "Maison Aura has 80 years of design archives and over half our most iconic pieces were created by women who were never credited — their male creative directors got the spotlight. We want to correct the record publicly during Women's History Month. This isn't a feel-good campaign — it's an overdue reckoning with our own history. We need the fashion press, culture writers, and our own customers to care.",
        audience: "Primary: Fashion press and culture writers who cover industry accountability and women's stories. Secondary: Maison Aura's existing customer base (affluent, design-conscious, 30-60) who need to understand why the brand is doing this. Tertiary: Broader cultural conversation — people who care about attribution, women's history, and institutional accountability.",
        message: "The women who built Maison Aura deserve to be named. We're opening our archives, correcting the record, and ensuring the designers who shaped fashion get the credit they were denied.",
        successMetrics: [
          'Coverage in at least 3 major fashion publications (Vogue, WWD, BoF)',
          'Social engagement rate 3x above brand average',
          'Positive sentiment ratio above 80% in earned media',
          'Archive exhibition or digital experience with 50K+ visits in March',
        ],
        budget: 75000,
        timeline: "Must launch by March 1 and sustain through the month",
        vibe: "Elegant, honest, historically grounded, not apologetic — triumphant. This is a celebration of these women's genius, not a corporate mea culpa.",
        openEndedAsk: "How do you tell a story about institutional failure in a way that centers the women who were erased rather than the institution doing the erasing? How do we make this feel like a genuine cultural reckoning and not a PR exercise?",
        constraints: [
          'Must feel like genuine accountability, not corporate PR',
          'Fashion press is cynical — they\'ve seen performative campaigns before',
          'Internal stakeholders are nervous about admitting the brand got credit wrong for decades',
          'Balancing celebration of these women\'s work with acknowledgment of how they were erased',
        ],
        clientPersonality: "Thoughtful, conviction-driven, willing to take real reputational risk. Colette has been pushing for this internally for years and finally has board approval. She wants it done right, not safe.",
        industry: 'fashion',
      },
    }),
  },

  // ─── March Madness — ran March 15 through April 8 ──────────────────────────

  {
    briefId: 'email-seasonal-mm-001',
    clientName: 'Decant',
    availableMonth: 3,
    availableDay: 15,
    expiresMonth: 4,
    expiresDay: 8,
    buildEmail: (): Email => ({
      id: 'email-seasonal-mm-001',
      type: 'campaign_brief',
      from: {
        name: 'Owen Bates',
        email: 'owen@decantwinebar.com',
        avatar: '🍷',
      },
      subject: 'Decant Wine Bar — March Madness Campaign Brief',
      body: `Hey there,

I'm Owen, owner of Decant — a wine bar in the arts district. Every March our business dies because everyone goes to sports bars for March Madness. Instead of fighting it, we want to lean in.

March Madness watch parties — but at a wine bar. Sommeliers doing color commentary. Wine pairings matched to regions. Bracket picks but for vintages. Make it absurd, make it fun, make the sports bar crowd curious enough to try something different.

We have a loyal clientele who think sports bars are beneath them and a sports crowd who think wine bars are pretentious. We need to bring both worlds together without alienating either.

Budget: $40,000. Small budget means scrappy execution — we can't buy media, we need to earn attention.

Owen`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
      isDeleted: false,
      isSeasonal: true,
      campaignBrief: {
        clientName: 'Decant',
        challenge: "Every March, Decant loses business to sports bars during March Madness. Instead of fighting it, we want to lean in — March Madness watch parties at a wine bar. Sommeliers doing color commentary, wine pairings matched to regions, bracket picks for vintages. The concept has to be genuinely fun, not ironic or condescending. We need to bring wine bar regulars and sports bar crowds together without alienating either.",
        audience: "Primary: Sports fans (25-45) who are curious but think wine bars are pretentious — they need to feel genuinely welcome, not like they're being mocked. Secondary: Decant's loyal wine bar regulars (30-55) who think sports bars are beneath them — they need to see this as fun, not an invasion. Tertiary: Local food/drink media and social creators who love a good 'worlds colliding' story.",
        message: "Wine and basketball have more in common than you think. Both reward knowledge, reward taste, and are way more fun when you're yelling with friends. Decant is where both worlds meet — no pretension, no apologies, just great wine and great games.",
        successMetrics: [
          'March revenue matches or exceeds average non-March month (currently drops 35%)',
          'At least 3 sold-out watch party events during the tournament',
          'Local press coverage in at least 2 food/drink outlets',
          'Social content reaches 100K+ impressions organically',
        ],
        budget: 40000,
        timeline: "Campaign must launch by tip-off of the tournament and sustain through the Final Four",
        vibe: "Playful, confident, self-aware, a little ridiculous. Think sports bar energy meets wine bar taste — the vibe of a sommelier in a basketball jersey who actually knows what they're talking about.",
        openEndedAsk: "How do you make a wine bar feel like the most fun place to watch basketball without turning it into a gimmick? How do you get sports fans through the door without the regulars feeling invaded?",
        constraints: [
          'Wine bar regulars might hate the sports crowd invasion',
          'Sports fans might feel like it\'s mocking them',
          'The concept has to be genuinely fun, not ironic or condescending',
          'Small budget means scrappy execution — can\'t buy media, need to earn attention',
        ],
        clientPersonality: "Laid-back, entrepreneurial, genuinely loves both wine and basketball. Owen is the kind of guy who watches the Final Four while drinking natural wine. He wants this campaign to reflect his actual personality, not a marketing persona.",
        industry: 'food-beverage',
      },
    }),
  },
];

/** IDs of retired seasonal briefs — used for inbox cleanup on load. */
export const RETIRED_SEASONAL_BRIEF_IDS: string[] = RETIRED_SEASONAL_BRIEFS.map(b => b.briefId);
