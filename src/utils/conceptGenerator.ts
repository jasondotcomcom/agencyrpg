import type { Campaign, CampaignConcept, DeliverableType, Platform, SuggestedDeliverable } from '../types/campaign';
import { getTeamMembers, getTeamCompositionDescription } from '../data/team';

// ─── Valid enum values for type-safe parsing ────────────────────────────────

const VALID_DELIVERABLE_TYPES: DeliverableType[] = [
  'social_post', 'video', 'print_ad', 'direct_mail', 'ooh', 'billboard',
  'email_campaign', 'landing_page', 'experiential', 'guerrilla', 'podcast_ad',
  'audio', 'influencer_collab', 'twitter_thread', 'reddit_ama', 'tiktok_series',
  'blog_post', 'content',
];

const VALID_PLATFORMS: Platform[] = [
  'instagram', 'tiktok', 'linkedin', 'twitter', 'facebook', 'youtube',
  'spotify', 'print', 'outdoor', 'web', 'email', 'reddit', 'pr', 'app', 'none',
];

// ─── Build the prompt ───────────────────────────────────────────────────────

function buildConceptPrompt(campaign: Campaign): string {
  const { brief, conceptingTeam, strategicDirection } = campaign;
  const members = conceptingTeam ? getTeamMembers(conceptingTeam.memberIds) : [];
  const teamDesc = conceptingTeam ? getTeamCompositionDescription(conceptingTeam.memberIds) : 'No team assigned';

  const teamDeliverableLines = members.map(m =>
    `${m.name} (${m.role}): [What specifically does ${m.name} build/write/design/strategize for this concept?]`
  ).join('\n');

  return `You are a creative strategist at an innovative advertising agency.

Generate exactly 3 campaign concepts.

CLIENT BRIEF:
Client: ${brief.clientName}
Challenge: ${brief.challenge}
Audience: ${brief.audience}
Message: ${brief.message}
Budget: $${brief.budget.toLocaleString()}
Timeline: ${brief.timeline}
Vibe: ${brief.vibe}
Open-ended ask: ${brief.openEndedAsk}

YOUR TEAM:
${teamDesc}

PLAYER'S CREATIVE DIRECTION — THIS IS THE CREATIVE MANDATE:
"${strategicDirection}"

THIS IS NOT OPTIONAL GUIDANCE. EVERY CONCEPT MUST DIRECTLY EXECUTE THIS DIRECTION.

TAKE THE DIRECTION LITERALLY:
- If direction says "use technology" → Every concept must feature specific named technology (AR, generative AI, IoT sensors, etc.)
- If direction says "make customer part of the art" → Customers must literally become ingredients IN the artwork itself, not viewers of it, not voters on it, not creators of separate art
- If direction says "guerrilla" → Concepts must be unsanctioned, surprising, street-level interventions
- If direction says "data-driven" → Every concept must center on real data, metrics, or analytics

EXAMPLE OF CORRECT vs WRONG interpretation:
Direction: "Use technology to make the customer part of the art"

CORRECT: Digital mural built from customer Instagram posts updating live; sound-reactive installation turning customer voices into visual art; generative mosaic weaving one photo from every customer who visits
WRONG: Gallery night (customers view art); voting on art (customers react); creator toolkit (customers make separate art); open mic nights

The test: In correct concepts, REMOVE the customers and the art DOESN'T EXIST. Customers ARE the material.

RESPONSE FORMAT — You MUST respond with valid JSON matching this exact structure:
{
  "concepts": [
    {
      "name": "Specific Evocative Name",
      "tagline": "${brief.clientName}: Punchy tagline here",
      "bigIdea": "3-4 sentences. Be brutally specific. What is the physical/digital thing? What does a customer literally do? What does the technology literally do? What does the result look like? How does this DIRECTLY execute the player's direction?",
      "recommendedChannels": ["channel1", "channel2", "channel3", "channel4"],
      "suggestedDeliverables": [
        {"type": "landing_page", "platform": "web", "quantity": 1, "description": "Specific description"},
        {"type": "video", "platform": "youtube", "quantity": 1, "description": "Specific description"},
        {"type": "social_post", "platform": "instagram", "quantity": 1, "description": "Specific description"}
      ],
      "tone": "Comma-separated tone descriptors",
      "whyItWorks": "INSIGHT: [audience insight]\\n\\nSTRATEGIC RATIONALE:\\n• Point 1\\n• Point 2\\n• Point 3\\n\\nHOW YOUR TEAM MAKES THIS WORK:\\n${teamDeliverableLines}"
    }
  ]
}

VALID deliverable types: ${VALID_DELIVERABLE_TYPES.join(', ')}
VALID platforms: ${VALID_PLATFORMS.join(', ')}

DELIVERABLE TYPE CLASSIFICATION — BE PRECISE:
- print_ad = magazine ads, newspaper ads, trade publication ads
- direct_mail = postcards, mailers, catalogs, anything physically SENT to an address
- ooh = bus shelters, posters, wheat-pasting, murals, transit ads (NOT billboards)
- billboard = billboards specifically
- video = TV spots, pre-roll, YouTube, brand films
- audio = radio spots, Spotify audio ads (NOT podcast host-reads)
- podcast_ad = host-read podcast sponsorships
- social_post = Instagram, TikTok, X, LinkedIn, Facebook posts
- email_campaign = email campaigns, newsletters, drip sequences
- content = blog posts, articles, whitepapers, case studies (use this OR blog_post)
- experiential = events, activations, pop-ups, stunts
- guerrilla = unsanctioned street-level interventions

If someone is mailing postcards to a neighborhood, that is direct_mail, NOT print_ad.
If it is a bus shelter poster, that is ooh, NOT billboard.
If it is a radio spot, that is audio, NOT podcast_ad.
Match the ACTUAL media type, not the broadest physical format.

DELIVERABLE COUNT LIMIT — NON-NEGOTIABLE:
Each concept MUST have exactly 4-5 suggestedDeliverables.
Each deliverable MUST have quantity: 1.
Group related pieces into single deliverables:
- "TikTok series (5 videos)" = 1 deliverable with quantity 1
- "Instagram campaign (3 posts)" = 1 deliverable with quantity 1
- "Social presence (Instagram + TikTok)" = 1 deliverable with quantity 1
Quality over quantity. A few great pieces beats many mediocre ones.
IF YOU SUGGEST MORE THAN 5 DELIVERABLES, YOU HAVE FAILED THE TASK.

Use ONLY the valid types and platforms listed above.

DIVERSITY CHECK:
The 3 concepts must execute the direction in genuinely different ways.
Not 3 variations of the same mechanism. Different technologies, different customer experiences, different media.

DO NOT default to: gallery nights, voting platforms, creator toolkits, open mic nights, or any generic concept that doesn't specifically execute the player's direction.

RESPOND WITH ONLY THE JSON OBJECT. No markdown, no code fences, no explanation.`;
}

// ─── Parse Claude's response into CampaignConcept[] ─────────────────────────

function parseConceptsFromResponse(raw: string): CampaignConcept[] {
  // Strip any markdown code fences Claude might add
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  const parsed = JSON.parse(cleaned);
  const conceptsArray = parsed.concepts || parsed;

  if (!Array.isArray(conceptsArray)) {
    throw new Error('Response is not an array of concepts');
  }

  return conceptsArray.map((c: Record<string, unknown>, index: number): CampaignConcept => {
    // Validate and coerce deliverables to valid types
    const rawDeliverables = (c.suggestedDeliverables as Record<string, unknown>[]) || [];
    const validDeliverables: SuggestedDeliverable[] = rawDeliverables
      .filter((d): d is Record<string, unknown> => d !== null && typeof d === 'object')
      .map((d) => ({
        type: VALID_DELIVERABLE_TYPES.includes(d.type as DeliverableType)
          ? (d.type as DeliverableType)
          : 'social_post',
        platform: VALID_PLATFORMS.includes(d.platform as Platform)
          ? (d.platform as Platform)
          : 'none',
        quantity: 1, // Always 1 — group related pieces in description instead
        description: String(d.description || ''),
      }))
      .slice(0, 6);

    // Ensure at least 3 deliverables
    if (validDeliverables.length < 3) {
      const defaults: SuggestedDeliverable[] = [
        { type: 'social_post', platform: 'instagram', quantity: 1, description: 'Campaign launch post' },
        { type: 'landing_page', platform: 'web', quantity: 1, description: 'Campaign hub page' },
        { type: 'video', platform: 'youtube', quantity: 1, description: 'Campaign hero video' },
      ];
      while (validDeliverables.length < 3) {
        validDeliverables.push(defaults[validDeliverables.length]);
      }
    }

    return {
      id: `concept-${Date.now()}-${index}`,
      name: String(c.name || `Concept ${index + 1}`),
      tagline: String(c.tagline || ''),
      bigIdea: String(c.bigIdea || ''),
      recommendedChannels: Array.isArray(c.recommendedChannels)
        ? (c.recommendedChannels as string[]).slice(0, 4)
        : [],
      suggestedDeliverables: validDeliverables,
      tone: String(c.tone || ''),
      whyItWorks: String(c.whyItWorks || ''),
    };
  });
}

// ─── Build the tweak prompt ──────────────────────────────────────────────────

function buildTweakPrompt(concept: CampaignConcept, tweakNote: string, campaign: Campaign): string {
  const { brief, conceptingTeam, strategicDirection } = campaign;
  const members = conceptingTeam ? getTeamMembers(conceptingTeam.memberIds) : [];

  return `You are a creative strategist revising a single campaign concept based on specific feedback.

ORIGINAL CONCEPT:
Name: ${concept.name}
Tagline: ${concept.tagline}
Big Idea: ${concept.bigIdea}
Tone: ${concept.tone}
Why It Works: ${concept.whyItWorks}
Recommended Channels: ${concept.recommendedChannels.join(', ')}
Suggested Deliverables:
${concept.suggestedDeliverables.map(d => `  - ${d.type} (${d.platform}): ${d.description}`).join('\n')}

CREATIVE DIRECTOR'S FEEDBACK:
"${tweakNote}"

BRIEF CONTEXT:
Client: ${brief.clientName}
Challenge: ${brief.challenge}
Audience: ${brief.audience}
Message: ${brief.message}
Strategic Direction: "${strategicDirection}"

TEAM: ${members.map(m => m.name).join(', ')}

INSTRUCTIONS:
- Keep the core concept intact
- Apply ONLY the specific change requested
- If feedback is about the tagline, only change the tagline
- If feedback is about a specific deliverable, only change that deliverable
- Make minimal changes to address the feedback
- Do NOT reinvent the concept

VALID deliverable types: ${VALID_DELIVERABLE_TYPES.join(', ')}
VALID platforms: ${VALID_PLATFORMS.join(', ')}

Return ONLY valid JSON (no markdown, no code fences):
{
  "name": "...",
  "tagline": "...",
  "bigIdea": "...",
  "recommendedChannels": ["..."],
  "suggestedDeliverables": [
    {"type": "...", "platform": "...", "quantity": 1, "description": "..."}
  ],
  "tone": "...",
  "whyItWorks": "..."
}`;
}

// ─── Tweak a single concept (calls Claude API) ───────────────────────────────

export async function tweakConcept(
  concept: CampaignConcept,
  tweakNote: string,
  campaign: Campaign,
): Promise<CampaignConcept> {
  const prompt = buildTweakPrompt(concept, tweakNote, campaign);

  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Concept tweak failed (${response.status})`);
  }

  const data = await response.json();
  const raw: string = data.content[0].text;

  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  const rawDeliverables = (parsed.suggestedDeliverables as Record<string, unknown>[]) || [];
  const validDeliverables: SuggestedDeliverable[] = rawDeliverables
    .filter((d): d is Record<string, unknown> => d !== null && typeof d === 'object')
    .map((d) => ({
      type: VALID_DELIVERABLE_TYPES.includes(d.type as DeliverableType)
        ? (d.type as DeliverableType)
        : 'social_post',
      platform: VALID_PLATFORMS.includes(d.platform as Platform)
        ? (d.platform as Platform)
        : 'none',
      quantity: 1,
      description: String(d.description || ''),
    }))
    .slice(0, 6);

  if (validDeliverables.length < 3) {
    const defaults: SuggestedDeliverable[] = [
      { type: 'social_post', platform: 'instagram', quantity: 1, description: 'Campaign launch post' },
      { type: 'landing_page', platform: 'web', quantity: 1, description: 'Campaign hub page' },
      { type: 'video', platform: 'youtube', quantity: 1, description: 'Campaign hero video' },
    ];
    while (validDeliverables.length < 3) {
      validDeliverables.push(defaults[validDeliverables.length]);
    }
  }

  return {
    id: concept.id, // Keep same ID so selection state is preserved
    name: String(parsed.name || concept.name),
    tagline: String(parsed.tagline || concept.tagline),
    bigIdea: String(parsed.bigIdea || concept.bigIdea),
    recommendedChannels: Array.isArray(parsed.recommendedChannels)
      ? (parsed.recommendedChannels as string[]).slice(0, 4)
      : concept.recommendedChannels,
    suggestedDeliverables: validDeliverables,
    tone: String(parsed.tone || concept.tone),
    whyItWorks: String(parsed.whyItWorks || concept.whyItWorks),
    isTweaked: true,
  };
}

// ─── Main generation function (calls Claude API) ────────────────────────────

export async function generateConcepts(campaign: Campaign): Promise<CampaignConcept[]> {
  const { conceptingTeam } = campaign;

  if (!conceptingTeam) {
    return [];
  }

  const prompt = buildConceptPrompt(campaign);

  console.log('=== CONCEPT GENERATION DEBUG ===');
  console.log('Direction received:', campaign.strategicDirection);
  console.log('Team:', getTeamMembers(conceptingTeam.memberIds).map(m => m.name));
  console.log('Full prompt length:', prompt.length);
  console.log('Calling Claude API...');

  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.error('Claude API error:', response.status, errorText);
    throw new Error(`Concept generation failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data.content[0].text;

  console.log('Raw Claude response:', rawText.substring(0, 500) + '...');

  const concepts = parseConceptsFromResponse(rawText);

  console.log('Parsed concepts:', concepts.map(c => c.name));
  console.log('=== END CONCEPT GENERATION ===');

  return concepts;
}
