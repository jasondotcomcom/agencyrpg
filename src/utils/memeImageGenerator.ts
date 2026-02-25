import type { MemeData, MemeTemplate } from '../types/chat';

// ─── Caches ──────────────────────────────────────────────────────────────────

const bgCache = new Map<MemeTemplate, string>();          // template → base64 bg
const memeCache = new Map<string, string>();              // content hash → data URL
const pendingBg = new Map<MemeTemplate, Promise<string>>(); // dedup in-flight requests

// ─── DALL-E Background Prompts ───────────────────────────────────────────────

const BG_PROMPTS: Record<MemeTemplate, string> = {
  drake:
    'Two-panel vertical split illustration. Top panel: warm coral/salmon tones, figure with hand raised in dismissal, looking away. Bottom panel: cool teal/mint tones, figure pointing forward with confident approval. Simple flat illustration style, clean lines, meme template background, no text anywhere in the image.',
  'expanding-brain':
    'Vertical tiered illustration showing escalating levels of cosmic consciousness. Top tier: dim small ordinary brain. Middle tiers: glowing expanding. Bottom tier: exploding galaxy brain with cosmic nebula energy. Dark background, neon glow effects, digital art, no text anywhere in the image.',
  'two-buttons':
    'Cartoon character sweating nervously in front of a control panel with two large red buttons, dramatic spotlight lighting, anxious expression, simple flat illustration style, no text anywhere in the image.',
  'this-is-fine':
    'Cozy interior room completely engulfed in cartoon flames, warm orange and red tones everywhere, a small calm cartoon dog sitting at a table with coffee, everything burning around them, simple illustration style, no text anywhere in the image.',
  quote:
    'Moody dark office environment at night, single desk lamp casting warm light, atmospheric bokeh, soft shadows, cinematic mood, photographic style, no text anywhere in the image.',
};

// ─── Fallback Gradient Backgrounds ───────────────────────────────────────────

function drawFallbackBg(ctx: CanvasRenderingContext2D, template: MemeTemplate, w: number, h: number) {
  switch (template) {
    case 'drake': {
      // Top half red, bottom half green
      const g1 = ctx.createLinearGradient(0, 0, w, h / 2);
      g1.addColorStop(0, '#c0392b');
      g1.addColorStop(1, '#e74c3c');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h / 2);
      const g2 = ctx.createLinearGradient(0, h / 2, w, h);
      g2.addColorStop(0, '#27ae60');
      g2.addColorStop(1, '#2ecc71');
      ctx.fillStyle = g2;
      ctx.fillRect(0, h / 2, w, h / 2);
      // Divider line
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      break;
    }
    case 'expanding-brain': {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#1a0533');
      g.addColorStop(0.5, '#2d1b69');
      g.addColorStop(1, '#0d47a1');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'two-buttons': {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#4a1a2e');
      g.addColorStop(1, '#2d1a1a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'this-is-fine': {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#e65100');
      g.addColorStop(0.6, '#bf360c');
      g.addColorStop(1, '#b71c1c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'quote': {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#1a1a2e');
      g.addColorStop(1, '#2d2d3e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
  }
}

// ─── DALL-E Background Generation ────────────────────────────────────────────

async function fetchBackground(template: MemeTemplate): Promise<string> {
  // Check cache
  const cached = bgCache.get(template);
  if (cached) return cached;

  // Dedup concurrent requests for the same template
  const pending = pendingBg.get(template);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const response = await fetch('/api/openai/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: BG_PROMPTS[template],
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`DALL-E error ${response.status}`);
      }

      const data = await response.json();
      const b64: string = data.data[0].b64_json;
      bgCache.set(template, b64);
      return b64;
    } catch (err) {
      console.warn(`DALL-E background failed for ${template}:`, err);
      throw err;
    } finally {
      pendingBg.delete(template);
    }
  })();

  pendingBg.set(template, promise);
  return promise;
}

// ─── Text Wrapping ───────────────────────────────────────────────────────────

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawMemeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  align: CanvasTextAlign = 'center',
): number {
  ctx.font = `bold ${fontSize}px Impact, 'Arial Black', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.2;

  for (let i = 0; i < lines.length; i++) {
    const ly = y + i * lineHeight;
    // Black outline
    ctx.strokeStyle = 'black';
    ctx.lineWidth = Math.max(4, fontSize / 8);
    ctx.lineJoin = 'round';
    ctx.strokeText(lines[i], x, ly);
    // White fill
    ctx.fillStyle = 'white';
    ctx.fillText(lines[i], x, ly);
  }

  return lines.length * lineHeight;
}

// ─── Template Compositors ────────────────────────────────────────────────────

function compositeDrake(ctx: CanvasRenderingContext2D, items: string[], w: number, h: number) {
  const [reject, approve] = items;
  const panelH = h / 2;

  // Dark overlay on each panel for readability
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, w, panelH);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, panelH, w, panelH);

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, panelH);
  ctx.lineTo(w, panelH);
  ctx.stroke();

  const fontSize = 42;
  const padding = 60;

  // ❌ emoji + reject text (top)
  ctx.font = `${fontSize + 10}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText('❌', padding - 40, panelH / 2);
  drawMemeText(ctx, reject || '', w / 2 + 20, panelH / 2 - fontSize / 2, w - padding * 2 - 40, fontSize);

  // ✅ emoji + approve text (bottom)
  ctx.font = `${fontSize + 10}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText('✅', padding - 40, panelH + panelH / 2);
  drawMemeText(ctx, approve || '', w / 2 + 20, panelH + panelH / 2 - fontSize / 2, w - padding * 2 - 40, fontSize);
}

function compositeExpandingBrain(ctx: CanvasRenderingContext2D, items: string[], w: number, h: number) {
  const brains = ['🧠', '🤔', '🤯', '🌌'];
  const tierH = h / items.length;

  for (let i = 0; i < items.length; i++) {
    const y = i * tierH;

    // Progressive overlay — darker at top, lighter at bottom
    const alpha = 0.55 - (i * 0.08);
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.15, alpha)})`;
    ctx.fillRect(0, y, w, tierH);

    // Tier divider
    if (i > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Brain emoji
    const emojiSize = 50 + i * 8;
    ctx.font = `${emojiSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(brains[i] ?? '✨', 30, y + tierH / 2);

    // Text
    const fontSize = 32 + i * 3;
    drawMemeText(ctx, items[i], w / 2 + 40, y + tierH / 2 - fontSize / 2, w - 160, fontSize);
  }
}

function compositeTwoButtons(ctx: CanvasRenderingContext2D, items: string[], w: number, h: number) {
  const [left, right] = items;

  // Dark overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, w, h);

  // Two "button" rectangles
  const btnW = w * 0.38;
  const btnH = h * 0.3;
  const btnY = h * 0.15;
  const gap = w * 0.06;
  const leftX = w / 2 - btnW - gap / 2;
  const rightX = w / 2 + gap / 2;

  // Draw button backgrounds
  for (const bx of [leftX, rightX]) {
    ctx.fillStyle = 'rgba(220, 50, 50, 0.7)';
    ctx.beginPath();
    ctx.roundRect(bx, btnY, btnW, btnH, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Button text
  const btnFontSize = 30;
  drawMemeText(ctx, left || '', leftX + btnW / 2, btnY + btnH / 2 - btnFontSize / 2, btnW - 30, btnFontSize);
  drawMemeText(ctx, right || '', rightX + btnW / 2, btnY + btnH / 2 - btnFontSize / 2, btnW - 30, btnFontSize);

  // Sweating emoji
  ctx.font = '120px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('😰', w / 2, h * 0.7);
}

function compositeThisIsFine(ctx: CanvasRenderingContext2D, items: string[], w: number, h: number) {
  // Dark overlay for text area
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, 0, w, h);

  // Text items in upper portion
  const fontSize = 36;
  let textY = h * 0.15;
  for (const item of items) {
    const used = drawMemeText(ctx, item, w / 2, textY, w - 120, fontSize);
    textY += used + 20;
  }

  // "This is fine." footer
  const footerY = h * 0.78;
  ctx.font = 'bold 48px Impact, "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.strokeText('🐕  This is fine.  🔥', w / 2, footerY);
  ctx.fillStyle = '#ffcc00';
  ctx.fillText('🐕  This is fine.  🔥', w / 2, footerY);
}

function compositeQuote(ctx: CanvasRenderingContext2D, items: string[], w: number, h: number) {
  // Dark overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, w, h);

  // Left accent bar
  ctx.fillStyle = 'rgba(168, 230, 207, 0.6)';
  ctx.fillRect(40, h * 0.15, 5, h * 0.7);

  // Opening quote mark
  ctx.font = 'bold 120px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(168, 230, 207, 0.3)';
  ctx.fillText('\u201C', 55, h * 0.08);

  // Quote text
  const mainFontSize = 36;
  let textY = h * 0.25;
  for (let i = 0; i < items.length; i++) {
    const isAttribution = i === items.length - 1 && items.length > 1;
    const size = isAttribution ? 28 : mainFontSize;
    if (isAttribution) textY += 20;
    const used = drawMemeText(ctx, items[i], w / 2 + 20, textY, w - 140, size);
    textY += used + 12;
  }
}

// ─── Main Compositor ─────────────────────────────────────────────────────────

async function compositeImage(memeData: MemeData): Promise<string> {
  const W = 1024;
  const H = 1024;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Try to load DALL-E background
  let bgLoaded = false;
  try {
    const b64 = await fetchBackground(memeData.template);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = `data:image/png;base64,${b64}`;
    });
    ctx.drawImage(img, 0, 0, W, H);
    bgLoaded = true;
  } catch {
    // Fall back to gradient
    drawFallbackBg(ctx, memeData.template, W, H);
  }

  // If DALL-E bg loaded, we need slightly stronger overlay for some templates
  if (bgLoaded && memeData.template === 'quote') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, W, H);
  }

  // Composite text per template
  switch (memeData.template) {
    case 'drake':
      compositeDrake(ctx, memeData.items, W, H);
      break;
    case 'expanding-brain':
      compositeExpandingBrain(ctx, memeData.items, W, H);
      break;
    case 'two-buttons':
      compositeTwoButtons(ctx, memeData.items, W, H);
      break;
    case 'this-is-fine':
      compositeThisIsFine(ctx, memeData.items, W, H);
      break;
    case 'quote':
      compositeQuote(ctx, memeData.items, W, H);
      break;
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function generateMemeImage(memeData: MemeData): Promise<string> {
  const key = JSON.stringify(memeData);

  const cached = memeCache.get(key);
  if (cached) return cached;

  const dataUrl = await compositeImage(memeData);
  memeCache.set(key, dataUrl);
  return dataUrl;
}
