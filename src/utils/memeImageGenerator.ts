import type { MemeData, MemeTemplate } from '../types/chat';

// ─── Caches ──────────────────────────────────────────────────────────────────

const bgCache = new Map<MemeTemplate, HTMLImageElement>(); // template → loaded Image
const memeCache = new Map<string, string>();               // content hash → data URL
const pendingBg = new Map<MemeTemplate, Promise<HTMLImageElement>>(); // dedup in-flight

// ─── Static Background Paths ─────────────────────────────────────────────────
// Pre-generated DALL-E backgrounds shipped as static assets.

const STATIC_BG_PATHS: Record<MemeTemplate, string> = {
  drake: '/images/memes/drake.png',
  'expanding-brain': '/images/memes/expanding-brain.png',
  'two-buttons': '/images/memes/two-buttons.png',
  'this-is-fine': '/images/memes/this-is-fine.png',
  quote: '/images/memes/quote.png',
};

// ─── DALL-E Background Prompts (for dynamic memes only) ─────────────────────

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

// ─── "Cooking" messages for dynamic memes ────────────────────────────────────

export const MEME_COOKING_MESSAGES = [
  'Hold on, cooking something up...',
  'Give me a sec, this one needs to be perfect',
  'Making this as we speak...',
  'One moment, the meme factory is working overtime',
  'Hang on, this meme is loading in my brain...',
  'Wait for it...',
];

// ─── Fallback Gradient Backgrounds ───────────────────────────────────────────

function drawFallbackBg(ctx: CanvasRenderingContext2D, template: MemeTemplate, w: number, h: number) {
  switch (template) {
    case 'drake': {
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

// ─── Background Loading ─────────────────────────────────────────────────────

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

async function fetchBackground(template: MemeTemplate, dynamic = false): Promise<HTMLImageElement> {
  // Check cache
  const cached = bgCache.get(template);
  if (cached) return cached;

  // Dedup concurrent requests
  const pending = pendingBg.get(template);
  if (pending) return pending;

  const promise = (async () => {
    try {
      if (!dynamic) {
        // Try static asset first (instant, no API call)
        const img = await loadImageFromUrl(STATIC_BG_PATHS[template]);
        bgCache.set(template, img);
        return img;
      }

      // Dynamic: call DALL-E for a fresh background
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

      if (!response.ok) throw new Error(`DALL-E error ${response.status}`);

      const data = await response.json();
      const b64: string = data.data[0].b64_json;
      const img = await loadImageFromUrl(`data:image/png;base64,${b64}`);
      // Don't overwrite static cache with dynamic results
      return img;
    } catch (err) {
      console.warn(`Background failed for ${template}:`, err);
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
    ctx.strokeStyle = 'black';
    ctx.lineWidth = Math.max(4, fontSize / 8);
    ctx.lineJoin = 'round';
    ctx.strokeText(lines[i], x, ly);
    ctx.fillStyle = 'white';
    ctx.fillText(lines[i], x, ly);
  }

  return lines.length * lineHeight;
}

// ─── Template Compositors ────────────────────────────────────────────────────

function compositeDrake(ctx: CanvasRenderingContext2D, items: string[], w: number, h: number) {
  const [reject, approve] = items;
  const panelH = h / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, w, panelH);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, panelH, w, panelH);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, panelH);
  ctx.lineTo(w, panelH);
  ctx.stroke();

  const fontSize = 42;
  const padding = 60;

  ctx.font = `${fontSize + 10}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText('❌', padding - 40, panelH / 2);
  drawMemeText(ctx, reject || '', w / 2 + 20, panelH / 2 - fontSize / 2, w - padding * 2 - 40, fontSize);

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

    const alpha = 0.55 - (i * 0.08);
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.15, alpha)})`;
    ctx.fillRect(0, y, w, tierH);

    if (i > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const emojiSize = 50 + i * 8;
    ctx.font = `${emojiSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(brains[i] ?? '✨', 30, y + tierH / 2);

    const fontSize = 32 + i * 3;
    drawMemeText(ctx, items[i], w / 2 + 40, y + tierH / 2 - fontSize / 2, w - 160, fontSize);
  }
}

function compositeTwoButtons(ctx: CanvasRenderingContext2D, items: string[], w: number, h: number) {
  const [left, right] = items;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, w, h);

  const btnW = w * 0.38;
  const btnH = h * 0.3;
  const btnY = h * 0.15;
  const gap = w * 0.06;
  const leftX = w / 2 - btnW - gap / 2;
  const rightX = w / 2 + gap / 2;

  for (const bx of [leftX, rightX]) {
    ctx.fillStyle = 'rgba(220, 50, 50, 0.7)';
    ctx.beginPath();
    ctx.roundRect(bx, btnY, btnW, btnH, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  const btnFontSize = 30;
  drawMemeText(ctx, left || '', leftX + btnW / 2, btnY + btnH / 2 - btnFontSize / 2, btnW - 30, btnFontSize);
  drawMemeText(ctx, right || '', rightX + btnW / 2, btnY + btnH / 2 - btnFontSize / 2, btnW - 30, btnFontSize);

  ctx.font = '120px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('😰', w / 2, h * 0.7);
}

function compositeThisIsFine(ctx: CanvasRenderingContext2D, items: string[], w: number, h: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, 0, w, h);

  const fontSize = 36;
  let textY = h * 0.15;
  for (const item of items) {
    const used = drawMemeText(ctx, item, w / 2, textY, w - 120, fontSize);
    textY += used + 20;
  }

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
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(168, 230, 207, 0.6)';
  ctx.fillRect(40, h * 0.15, 5, h * 0.7);

  ctx.font = 'bold 120px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(168, 230, 207, 0.3)';
  ctx.fillText('\u201C', 55, h * 0.08);

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

async function compositeImage(memeData: MemeData, dynamic = false): Promise<string> {
  const W = 1024;
  const H = 1024;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Load background (static asset or DALL-E)
  let bgLoaded = false;
  try {
    const img = await fetchBackground(memeData.template, dynamic);
    ctx.drawImage(img, 0, 0, W, H);
    bgLoaded = true;
  } catch {
    drawFallbackBg(ctx, memeData.template, W, H);
  }

  if (bgLoaded && memeData.template === 'quote') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, W, H);
  }

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

/**
 * Generate a meme image. Standard memes use pre-baked static backgrounds
 * (instant). Dynamic memes (dynamic=true) call DALL-E for a fresh background.
 */
export async function generateMemeImage(memeData: MemeData, dynamic = false): Promise<string> {
  const key = JSON.stringify(memeData);

  const cached = memeCache.get(key);
  if (cached) return cached;

  const dataUrl = await compositeImage(memeData, dynamic);
  memeCache.set(key, dataUrl);
  return dataUrl;
}

/**
 * Generate a fully custom meme image via DALL-E based on a player's description.
 * Returns a data URL of the generated image, or undefined if generation fails.
 */
export async function generateCustomMemeImage(description: string): Promise<string | undefined> {
  const prompt = `Create a funny workplace meme illustration about: ${description}. Style: colorful cartoon illustration, humorous office comedy scene, expressive characters, vibrant colors, clean composition. This should look like a meme someone would share in a work Slack channel. No text anywhere in the image — the humor should be purely visual.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch('/api/openai/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) throw new Error(`DALL-E error ${response.status}`);

    const data = await response.json();
    const b64: string = data.data[0].b64_json;
    return `data:image/png;base64,${b64}`;
  } catch (err) {
    console.warn('Custom meme generation failed:', err);
    return undefined;
  }
}
