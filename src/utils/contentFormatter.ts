export interface ContentSection {
  type: 'header' | 'text';
  content: string;
}

// Strip markdown syntax (### headers, **bold**, *italic*) from a line
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/, '')        // ### Header → Header
    .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1')      // *italic* → italic
    .replace(/__(.+?)__/g, '$1')      // __bold__ → bold
    .replace(/_(.+?)_/g, '$1');       // _italic_ → italic
}

// Patterns that indicate section headers in AI output
const HEADER_PATTERNS = [
  /^#{1,6}\s+(.+)$/,                        // ### Markdown headers
  /^([A-Z][A-Z\s&/]{2,}):(.*)$/,           // HEADLINE: ..., BODY COPY: ...
  /^\[([A-Z][A-Z\s&/]{2,})\]\s*(.*)$/,     // [HERO], [CTA]
  /^(SCENE\s*\d+)\s*[:\-—]\s*(.*)$/i,       // SCENE 1: ...
  /^(ACT\s*\d+)\s*[:\-—]\s*(.*)$/i,         // ACT 1: ...
  /^(SLIDE\s*\d+)\s*[:\-—]\s*(.*)$/i,       // SLIDE 1: ...
  /^(FRAME\s*\d+)\s*[:\-—]\s*(.*)$/i,       // FRAME 1: ...
  /^(PANEL\s*\d+)\s*[:\-—]\s*(.*)$/i,       // PANEL 1: ...
];

// Sections to hide (image is already shown above)
const HIDDEN_SECTIONS = [
  'VISUAL DESCRIPTION',
  'IMAGE DESCRIPTION',
  'IMAGE PROMPT',
  'ART DIRECTION',
];

export function parseContent(raw: string): ContentSection[] {
  if (!raw) return [];

  const lines = raw.split('\n');
  const sections: ContentSection[] = [];
  let currentText: string[] = [];
  let isHidden = false;

  const flushText = () => {
    if (currentText.length > 0) {
      const text = currentText.join('\n').trim();
      if (text && !isHidden) {
        sections.push({ type: 'text', content: text });
      }
      currentText = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentText.push('');
      continue;
    }

    let matched = false;
    for (const pattern of HEADER_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        flushText();
        const headerName = match[1].trim();

        // Check if this section should be hidden
        isHidden = HIDDEN_SECTIONS.some(
          (h) => headerName.toUpperCase().includes(h),
        );

        if (!isHidden) {
          sections.push({ type: 'header', content: stripMarkdown(headerName) });
          // If there's inline content after the header label, add it
          const inline = match[2]?.trim();
          if (inline) {
            currentText.push(stripMarkdown(inline));
          }
        }
        matched = true;
        break;
      }
    }

    if (!matched) {
      currentText.push(stripMarkdown(line));
    }
  }

  flushText();
  return sections;
}

export function isVideoType(type: string): boolean {
  return type === 'video' || type === 'tiktok_series';
}

/**
 * Extract a "Director's Cut" summary from a full video/TikTok script.
 * Returns 3-5 bullet points capturing key beats.
 */
export function generateScriptSummary(raw: string): string {
  const clean = stripTrailingVisualDescription(raw);
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract the title line (first line with a name/duration)
  const titleLine = lines.find(l => /━/.test(l) && /[A-Z]/.test(l))
    || lines.find(l => /^\s*\w.*—.*\d/.test(l))
    || null;

  // Extract VISUAL lines — these are the key beats
  const visuals: string[] = [];
  const textOverlays: string[] = [];
  const musicLine = lines.find(l => /^MUSIC:/i.test(l));

  for (const line of lines) {
    if (/^VISUAL:/i.test(line)) {
      visuals.push(line.replace(/^VISUAL:\s*/i, '').trim());
    }
    if (/^TEXT OVERLAY:/i.test(line)) {
      const text = line.replace(/^TEXT OVERLAY:\s*/i, '').trim();
      if (text && text.toLowerCase() !== 'none' && text !== '—') {
        textOverlays.push(text);
      }
    }
  }

  // Also look for episode headers for TikTok series
  const episodes = lines.filter(l => /EPISODE\s*\d/i.test(l) && /━/.test(l));

  const bullets: string[] = [];

  // Title/duration
  if (titleLine) {
    const cleaned = titleLine.replace(/━/g, '').trim();
    if (cleaned) bullets.push(cleaned);
  }

  // Music vibe
  if (musicLine) {
    bullets.push(musicLine.replace(/^MUSIC:\s*/i, '').trim());
  }

  // Pick key visuals (first, a middle one, and last)
  if (visuals.length > 0) {
    bullets.push(visuals[0]); // Opening shot
    if (visuals.length > 2) {
      bullets.push(visuals[Math.floor(visuals.length / 2)]); // Mid beat
    }
    if (visuals.length > 1) {
      bullets.push(visuals[visuals.length - 1]); // Closing shot
    }
  }

  // Closing tagline from text overlays
  if (textOverlays.length > 0) {
    const last = textOverlays[textOverlays.length - 1];
    if (!bullets.some(b => b.includes(last))) {
      bullets.push(`Closes with: "${last}"`);
    }
  }

  // For TikTok, mention episode count
  if (episodes.length > 1 && !bullets.some(b => /episode/i.test(b))) {
    bullets.unshift(`${episodes.length}-part series`);
  }

  // Cap at 5 bullets
  return bullets.slice(0, 5).map(b => `• ${b}`).join('\n');
}

export function stripTrailingVisualDescription(raw: string): string {
  const marker = 'VISUAL DESCRIPTION:';
  const index = raw.lastIndexOf(marker);
  if (index === -1) return raw;
  return raw.substring(0, index).trimEnd();
}
