import type { Campaign, CampaignConcept, DeliverableType, Platform } from '../types/campaign';
import { getTeamMembers } from '../data/team';

// ─── Claude Text Generation ──────────────────────────────────────────────────

async function generateDeliverableText(
  deliverable: { type: DeliverableType; platform: Platform; description: string },
  campaign: Campaign,
  concept: CampaignConcept,
  feedback?: string
): Promise<string> {
  const prompt = getDeliverablePrompt(
    deliverable.type,
    deliverable.platform,
    deliverable.description,
    campaign,
    concept,
    feedback
  );

  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// ─── DALL-E Image Generation ─────────────────────────────────────────────────

async function generateDeliverableImage(
  visualDescription: string,
  deliverableType: DeliverableType
): Promise<string | undefined> {
  const size = getSizeForDeliverableType(deliverableType);

  try {
    const response = await fetch('/api/openai/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: visualDescription,
        n: 1,
        size,
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`DALL-E API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.warn('Image generation failed:', error);
    return undefined;
  }
}

// ─── Visual Description Extraction ───────────────────────────────────────────

export function extractVisualDescription(textContent: string): string | null {
  const marker = 'VISUAL DESCRIPTION:';
  const index = textContent.lastIndexOf(marker);
  if (index === -1) return null;
  return textContent.substring(index + marker.length).trim();
}

// ─── Image Sizes ─────────────────────────────────────────────────────────────

function getSizeForDeliverableType(
  type: DeliverableType
): '1024x1024' | '1792x1024' | '1024x1792' {
  switch (type) {
    case 'billboard':
    case 'print_ad':
    case 'landing_page':
    case 'video':
      return '1792x1024'; // Landscape
    case 'tiktok_series':
      return '1024x1792'; // Portrait
    default:
      return '1024x1024'; // Square
  }
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

export async function generateDeliverable(
  deliverable: { type: DeliverableType; platform: Platform; description: string },
  campaign: Campaign,
  concept: CampaignConcept,
  feedback?: string,
  retryCount = 0
): Promise<{ content: string; imageUrl?: string }> {
  try {
    const textContent = await generateDeliverableText(
      deliverable,
      campaign,
      concept,
      feedback
    );

    let imageUrl: string | undefined;
    try {
      const visualDesc = extractVisualDescription(textContent);
      if (visualDesc) {
        imageUrl = await generateDeliverableImage(visualDesc, deliverable.type);
      }
    } catch {
      // Image failure is non-fatal
    }

    return { content: textContent, imageUrl };
  } catch (error) {
    if (retryCount < 1) {
      await new Promise((r) => setTimeout(r, 1000));
      return generateDeliverable(deliverable, campaign, concept, feedback, retryCount + 1);
    }
    throw error;
  }
}

// ─── Prompt Templates ────────────────────────────────────────────────────────

function getDeliverablePrompt(
  type: DeliverableType,
  platform: Platform,
  description: string,
  campaign: Campaign,
  concept: CampaignConcept,
  feedback?: string
): string {
  const members = campaign.conceptingTeam
    ? getTeamMembers(campaign.conceptingTeam.memberIds)
    : [];
  const teamNames = members.map((m) => `${m.name} (${m.role})`).join(', ');

  const context = `
CAMPAIGN CONTEXT:
Client: ${campaign.clientName}
Campaign: ${campaign.campaignName}
Brief Challenge: ${campaign.brief.challenge}
Target Audience: ${campaign.brief.audience}
Key Message: ${campaign.brief.message}
Vibe/Tone: ${campaign.brief.vibe}

CHOSEN CONCEPT: "${concept.name}"
Tagline: "${concept.tagline}"
Big Idea: ${concept.bigIdea}
Tone: ${concept.tone}

PLAYER'S STRATEGIC DIRECTION: ${campaign.strategicDirection}

CREATIVE TEAM: ${teamNames}

DELIVERABLE: ${description}
PLATFORM: ${platform}
`.trim();

  const revisionNote = feedback
    ? `\n\nPREVIOUS FEEDBACK (address this in your revision):\n${feedback}\n`
    : '';

  const typePrompt = getTypeSpecificPrompt(type, platform);

  const isScript = type === 'video' || type === 'tiktok_series';
  const brevityNote = isScript
    ? ''
    : '\n\nIMPORTANT: Keep your response SHORT. 2-3 sentences for the core content. No markdown formatting (no ###, no **bold**). No section headers unless the type specifically calls for them. This is for a game — be punchy, not thorough.';

  return `You are a world-class creative team at an advertising agency. Generate content for the following deliverable.

${context}
${revisionNote}
${typePrompt}
${brevityNote}

End your response with a section labeled "VISUAL DESCRIPTION:" that describes a single compelling image to accompany this deliverable. Be specific about composition, colors, mood, style, lighting, and subject matter. This description will be used to generate the image via AI. Do NOT include any text or words in the visual description — describe only the visual elements.`;
}

function getTypeSpecificPrompt(type: DeliverableType, platform: Platform): string {
  switch (type) {
    case 'social_post':
      return `Create a ${platform} social media post. Keep it punchy.

CAPTION: 2-3 sentences max, on-brand
HASHTAGS: 5-8 tags
CTA: one line`;

    case 'video':
      return `Create a professional production script (30-60 seconds).

Generate an integrated shot-by-shot script. DO NOT separate visual descriptions from shots — each shot must be a self-contained block with its own VISUAL, AUDIO, and TEXT OVERLAY directions.

Format your response EXACTLY like this:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [DELIVERABLE NAME] — [DURATION]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MUSIC: [overall music direction — genre, energy, tempo, mood]

━━━ SHOT 1 — COLD OPEN (0:00–0:05) ━━━
VISUAL: [camera angle, movement, lighting, mood, colors, what we see]
AUDIO: [music cue / VO / SFX for this moment]
TEXT OVERLAY: [any on-screen text]

━━━ SHOT 2 — [SHOT NAME] (0:05–0:15) ━━━
VISUAL: [camera angle, movement, lighting, mood, colors, what we see]
AUDIO: [music cue / VO / SFX for this moment]
TEXT OVERLAY: [any on-screen text]

...continue for each shot (4-6 shots total)...

━━━ END CARD ━━━
VISUAL: [final frame composition]
AUDIO: [music resolve / final VO]
TEXT OVERLAY: [tagline + CTA]

PRODUCTION NOTES:
- [any additional direction]`;

    case 'tiktok_series':
      return `Create a TikTok series (3 episodes, 15-30 seconds each) as integrated production scripts.

DO NOT separate visual descriptions from shots. Each shot must be a self-contained block with VISUAL, AUDIO, and TEXT OVERLAY.

Format your response EXACTLY like this:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EPISODE 1 — [TITLE] ([DURATION])
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MUSIC: [sound/music direction for this episode]

━━━ SHOT 1 — HOOK (0:00–0:03) ━━━
VISUAL: [camera angle, framing, what we see, energy]
AUDIO: [sound cue / VO / SFX]
TEXT OVERLAY: [on-screen text]

━━━ SHOT 2 — [SHOT NAME] (0:03–0:08) ━━━
VISUAL: [camera angle, framing, what we see, energy]
AUDIO: [sound cue / VO / SFX]
TEXT OVERLAY: [on-screen text]

...continue for 3-5 shots per episode...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EPISODE 2 — [TITLE] ([DURATION])
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

...same format...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EPISODE 3 — [TITLE] ([DURATION])
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

...same format...

HASHTAGS: #tag1 #tag2 #tag3 ...`;

    case 'twitter_thread':
      return `Create a Twitter/X thread (4-5 tweets). Each under 280 characters. Hook first, CTA last. Format as: 1/ [text] 2/ [text] etc.`;

    case 'reddit_ama':
      return `Create a Reddit AMA concept in 2-3 sentences: the AMA title, target subreddit, and the core angle/hook. Keep it brief — just the concept, not a full brief.`;

    case 'billboard':
      return `Create billboard creative. HEADLINE (8 words max) and one line of BODY copy. That's it — no logistics, no format specs.`;

    case 'email_campaign':
      return `Create an email campaign. Just the SUBJECT line, one short BODY paragraph (2-3 sentences), and a CTA button text. No sections, no headers, no sign-offs.`;

    case 'landing_page':
      return `Create landing page content. Just the hero headline, a 2-sentence value proposition, and a CTA button text. No full page layouts or multiple sections.`;

    case 'experiential':
      return `Describe this experiential activation in 2-3 sentences. Just the core concept and the one moment that makes it special. No logistics, no staffing, no sections.`;

    case 'blog_post':
      return `Create a blog post concept. Just the TITLE and a 2-3 sentence summary of the angle and key argument. No full outline or section breakdowns.`;

    case 'podcast_ad':
      return `Write a podcast host-read ad script (30 seconds max). Just the script text in quotes — conversational and authentic. End with a short CTA. No sections or key messages lists.`;

    case 'influencer_collab':
      return `Describe this influencer collaboration in 2-3 sentences: what the creator does, the key message they convey, and the content format. No briefs, no do's/don'ts lists.`;

    case 'guerrilla':
      return `Describe this guerrilla marketing activation in 2-3 sentences. Just the concept: what happens, where, and the surprise/reveal moment. No logistics, documentation plans, or legal notes.`;

    case 'print_ad':
      return `Create a print ad. Just the HEADLINE and 1-2 sentences of BODY COPY. No layout direction, no publication targets.`;

    default: {
      const _exhaustive: never = type;
      return `Create content for this ${String(_exhaustive)} deliverable on ${platform}. Generate appropriate creative content.`;
    }
  }
}
