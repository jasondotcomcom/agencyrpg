import type { Campaign, CampaignConcept, DeliverableType, Platform } from '../types/campaign';
import { getTeamMembers } from '../data/team';
import { extractQuickView } from './contentFormatter';

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s for deliverable text

  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: controller.signal,
  });

  clearTimeout(timeout);

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

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
      signal: controller.signal,
    });

    clearTimeout(timeout);

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
): Promise<{ content: string; preview?: string; imageUrl?: string }> {
  try {
    const textContent = await generateDeliverableText(
      deliverable,
      campaign,
      concept,
      feedback
    );

    // Extract Quick View (idea summary) from the response
    const { quickView, rest } = extractQuickView(textContent);

    let imageUrl: string | undefined;
    try {
      const visualDesc = extractVisualDescription(textContent);
      if (visualDesc) {
        imageUrl = await generateDeliverableImage(visualDesc, deliverable.type);
      }
    } catch {
      // Image failure is non-fatal
    }

    return { content: rest, preview: quickView || undefined, imageUrl };
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

  // Short-form types where the full content already IS the idea — no Quick View needed
  const SHORT_FORM_TYPES: DeliverableType[] = [
    'social_post', 'print_ad', 'billboard', 'ooh', 'direct_mail',
    'email_campaign', 'podcast_ad', 'audio', 'blog_post', 'content', 'reddit_ama',
  ];
  const needsQuickView = !SHORT_FORM_TYPES.includes(type);

  const brevityNote = SHORT_FORM_TYPES.includes(type)
    ? '\n\nIMPORTANT: Keep your response SHORT. 2-3 sentences for the core content. No markdown formatting (no ###, no **bold**). No section headers unless the type specifically calls for them. This is for a game — be punchy, not thorough.'
    : '';

  const quickViewBlock = needsQuickView
    ? `
START your response with a section labeled "QUICK VIEW:" — this is 2-3 sentences that describe the IDEA and why it's compelling. Do NOT summarize the execution, shots, copy, or stage direction. Describe the concept so a stranger could immediately understand what this deliverable is and why it's interesting.

Good QUICK VIEW examples:
- Brand film: "A reverent 2-minute film that treats the reattribution of credit like a luxury unboxing — white-gloved hands remove old labels bearing men's names and replace them with the women who actually designed the pieces. The correction itself becomes the product."
- Experience: "A pop-up archive exhibition where visitors can see the original sketches alongside the misattributed final products, then watch the relabeling happen live."
- Social campaign: "A week-long series revealing one misattributed designer per day, each post showing the original sketch in her handwriting next to the piece that made someone else famous."
- Direct mail: "2,500 postcards to Arts District residents that roast their current coffee routine with personalized competitor call-outs."

Bad QUICK VIEW: the first 8 seconds of a script, condensed stage direction, opening lines of copy, or a shortened version of the deliverable. The QUICK VIEW answers "What is this and why should I care?" — NOT "What does the first few seconds look like?"

After the QUICK VIEW, generate the full deliverable:
`
    : '';

  return `You are a world-class creative team at an advertising agency. Generate content for the following deliverable.

${context}
${revisionNote}
${quickViewBlock}
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
      return `Create a print ad (magazine/newspaper). Just the HEADLINE and 1-2 sentences of BODY COPY. No layout direction, no publication targets.`;

    case 'direct_mail':
      return `Create a direct mail piece (postcard, mailer, or catalog insert). Just the HEADLINE, 1-2 sentences of BODY COPY, and a clear CTA. This is physically mailed to recipients — make it grab attention immediately.`;

    case 'ooh':
      return `Create an out-of-home (OOH) ad (bus shelter, poster, mural, transit ad). Just the HEADLINE (6 words max) and one line of supporting copy. Think bold, immediate impact for people passing by.`;

    case 'audio':
      return `Write a radio/audio ad script (30 seconds max). Just the script text — conversational, designed for listening. End with a clear CTA and any tagline. No sections or key messages lists.`;

    case 'content':
      return `Create a content piece (article, whitepaper, or case study). Just the TITLE and a 2-3 sentence summary of the angle, key argument, and target reader. No full outline or section breakdowns.`;

    default: {
      const _exhaustive: never = type;
      return `Create content for this ${String(_exhaustive)} deliverable on ${platform}. Generate appropriate creative content.`;
    }
  }
}
