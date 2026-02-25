#!/usr/bin/env node
/**
 * One-time script: generates DALL-E backgrounds for all 5 meme templates
 * and saves them as static assets in public/images/memes/.
 *
 * Usage: node scripts/generate-meme-backgrounds.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'memes');

// Load API key from .env.local
const envPath = path.join(ROOT, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKey = envContent.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim();
if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not found in .env.local');
  process.exit(1);
}

const TEMPLATES = {
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

// Ensure output directory exists
fs.mkdirSync(OUT_DIR, { recursive: true });

async function generateBackground(name, prompt) {
  const outFile = path.join(OUT_DIR, `${name}.png`);

  // Skip if already exists
  if (fs.existsSync(outFile)) {
    console.log(`⏭️  ${name}.png already exists, skipping`);
    return;
  }

  console.log(`🎨 Generating ${name}...`);

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    console.error(`❌ ${name} failed: ${response.status} ${err}`);
    return;
  }

  const data = await response.json();
  const b64 = data.data[0].b64_json;
  const buffer = Buffer.from(b64, 'base64');
  fs.writeFileSync(outFile, buffer);
  console.log(`✅ ${name}.png saved (${(buffer.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  console.log(`\n📁 Output: ${OUT_DIR}\n`);

  for (const [name, prompt] of Object.entries(TEMPLATES)) {
    await generateBackground(name, prompt);
  }

  console.log('\n🎉 Done! All meme backgrounds generated.\n');
}

main().catch(console.error);
