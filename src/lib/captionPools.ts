import type { CaptionBundle, CaptionStyleKey } from "@/types/captions";

const pools: Record<CaptionStyleKey, string[]> = {
  minimal_cool: [
    "Soft light. Quiet confidence.",
    "No caption needed. The silence is louder.",
    "Still here. Still choosing calm.",
    "Less noise. More presence.",
    "A mood, not a moment.",
    "Understated. Unbothered.",
    "Clean frame. Clear head.",
    "Not trying — just is.",
  ],
  luxury_fashion: [
    "Tailored silence. Haute restraint.",
    "Volume down. Contrast up.",
    "A study in negative space and intent.",
    "Campaign energy. Off-duty poise.",
    "Monochrome discipline. Editorial heat.",
    "The collection is attitude.",
    "Shot like a secret runway.",
    "Luxury is the edit, not the excess.",
  ],
  sad_late_night: [
    "3 a.m. thoughts hit different in this light.",
    "Nostalgia tastes like static.",
    "I replay what I should delete.",
    "City sleeps. I don’t.",
    "Some feelings don’t translate — only photographs.",
    "Quiet hurts louder than noise.",
    "If you knew the backstory, you’d read slower.",
    "Late night, soft focus, hard truth.",
  ],
  rich_kid: [
    "Main character budget. Side character peace.",
    "Trust fund energy, curated taste.",
    "Private view. Public feed.",
    "If you get it, you get it.",
    "Soft launch, loud lifestyle.",
    "Minimal flex. Maximum receipts.",
    "Not loud — expensive.",
    "Weekend in a city that feels like a mood board.",
  ],
  artistic: [
    "Chiaroscuro in a pocket-sized frame.",
    "Negative space, positive tension.",
    "A still life with a pulse.",
    "Composition as confession.",
    "Light writes the first line; shadow finishes it.",
    "Texture, tone, tempo.",
    "A frame within a feeling.",
    "Color theory, but make it personal.",
  ],
  deep_emotional: [
    "I’m learning to hold tenderness without apologizing for it.",
    "Some softness is survival.",
    "You can be grateful and still be growing.",
    "Healing looks like small, brave choices.",
    "I’m not the same chapter — and that’s the plot twist.",
    "Gentle doesn’t mean naive.",
    "I’m allowed to outgrow old comforts.",
    "Love is a practice, not a performance.",
  ],
  english_instagram: [
    "Proof I left the house and remembered to feel something.",
    "POV: you finally like the lighting.",
    "Posting this before I overthink it.",
    "Lowkey obsessed with this version of me.",
    "If this isn’t a vibe, we’re not reading the same room.",
    "Main character energy, no script.",
    "Soft launch of my new era.",
    "Instagram saw it first. Reality saw it better.",
  ],
  short_mysterious: [
    "After hours.",
    "Unsent.",
    "Evidence.",
    "Soft proof.",
    "No context.",
    "Still frame.",
    "Quiet luxury.",
    "Off record.",
  ],
};

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number, offset: number): T {
  const idx = (seed + offset * 9973) % arr.length;
  return arr[idx]!;
}

const moodPhrases = [
  "Contemplative warmth with a cinematic edge.",
  "High-contrast minimalism — quiet, intentional, expensive.",
  "Soft melancholy wrapped in golden-hour calm.",
  "Editorial cool: restrained palette, sharp silhouette.",
  "Nocturnal energy with a hint of nostalgia.",
  "Sculpted light, slow tempo, confident negative space.",
];

const moodTitles = [
  "Nocturnal calm",
  "Editorial restraint",
  "Soft contrast",
  "Late luxury",
  "Still heat",
  "Quiet voltage",
];

export function buildFallbackCaptions(imageFingerprint: string): {
  mood: string;
  moodDetail: string;
  captions: CaptionBundle;
} {
  const seed = hashString(imageFingerprint);
  const captions = {} as CaptionBundle;
  (Object.keys(pools) as CaptionStyleKey[]).forEach((key, i) => {
    captions[key] = pick(pools[key], seed, i);
  });
  return {
    mood: pick(moodTitles, seed, 0),
    moodDetail: pick(moodPhrases, seed, 1),
    captions,
  };
}
