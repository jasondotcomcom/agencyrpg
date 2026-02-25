// ─── Agency Name Generator ───────────────────────────────────────────────────

export type NameCategory =
  | 'adjective-animal'
  | 'color-object'
  | 'pretentious'
  | 'ampersand'
  | 'initials'
  | 'honest';

interface GeneratedName {
  name: string;
  category: NameCategory;
  label: string;
}

const ADJECTIVE_ANIMAL: string[] = [
  'Curious Elk', 'Electric Badger', 'Velvet Mammoth', 'Anxious Penguin',
  'Stubborn Fox', 'Midnight Otter', 'Restless Falcon', 'Polished Crow',
  'Neon Coyote', 'Iron Heron', 'Gentle Panther', 'Wistful Raccoon',
  'Bold Ibis', 'Silver Lynx', 'Quiet Thunder', 'Lucid Moth',
];

const COLOR_OBJECT: string[] = [
  'Red Anvil', 'Cobalt Fridge', 'Neon Paperclip', 'Golden Ladder',
  'Rust & Iron', 'Jade Compass', 'Copper Bell', 'Ivory Hammer',
  'Amber Signal', 'Slate & Wire', 'Onyx Lantern', 'Coral Engine',
];

const PRETENTIOUS: string[] = [
  'Nomenclature', 'Aperture', 'Kindling', 'Substrate',
  'Vermillion', 'Monolith', 'Parallax', 'Meridian',
  'Cadence', 'Provenance', 'Caliber', 'Resonance',
];

const AMPERSAND: string[] = [
  'Salt & Light', 'Grit & Wonder', 'Chaos & Co.', 'Hammer & Pixel',
  'Thread & Bone', 'Ink & Signal', 'Spark & Stone', 'Root & Branch',
  'Form & Fury', 'Pulse & Grain', 'Drift & Anchor', 'Bloom & Edge',
];

const INITIALS: string[] = [
  'MKW Creative', 'The JSP Group', 'BDL Partners', 'CRNR Studios',
  'HVN Agency', 'KLM Collective', 'NXT Bureau', 'VRD Creative',
  'FWD Group', 'ARC Studios', 'TRU Partners', 'ZNT Agency',
];

const HONEST: string[] = [
  'Another Agency', 'Please Hire Us', 'Award Hopeful', 'Deadline Panic',
  '"We\'re Different"', 'Placeholder Name', 'Untitled Agency', 'The Other Guys',
  'Almost Famous', 'Work in Progress', 'Good Enough', 'Technically Creative',
];

const CATEGORY_POOLS: Record<NameCategory, { names: string[]; label: string }> = {
  'adjective-animal': { names: ADJECTIVE_ANIMAL, label: 'Adjective + Animal' },
  'color-object':     { names: COLOR_OBJECT,     label: 'Color + Object' },
  'pretentious':      { names: PRETENTIOUS,      label: 'Pretentious Single Word' },
  'ampersand':        { names: AMPERSAND,        label: 'Ampersand Combo' },
  'initials':         { names: INITIALS,         label: 'Important-Sounding Initials' },
  'honest':           { names: HONEST,           label: 'Honest / Funny' },
};

const CATEGORIES: NameCategory[] = Object.keys(CATEGORY_POOLS) as NameCategory[];

// Track recently generated to avoid immediate repeats
let lastGenerated: string | null = null;

export function generateAgencyName(): GeneratedName {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const pool = CATEGORY_POOLS[category];
  let name: string;

  // Avoid repeating the same name twice in a row
  do {
    name = pool.names[Math.floor(Math.random() * pool.names.length)];
  } while (name === lastGenerated && pool.names.length > 1);

  lastGenerated = name;
  return { name, category, label: pool.label };
}

/** Names in the "honest" category that qualify for meta/placeholder achievements */
export const META_NAMES = new Set([
  'Placeholder Name', 'Untitled Agency', 'Work in Progress',
]);

/** Names in the "honest" category that qualify for self-deprecating achievement */
export const HONEST_NAMES = new Set(HONEST);
