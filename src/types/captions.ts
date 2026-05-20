export type CaptionStyleKey =
  | "minimal_cool"
  | "luxury_fashion"
  | "sad_late_night"
  | "rich_kid"
  | "artistic"
  | "deep_emotional"
  | "english_instagram"
  | "short_mysterious";

export type CaptionBundle = Record<CaptionStyleKey, string>;

export interface GenerateResponse {
  mood: string;
  moodDetail: string;
  captions: CaptionBundle;
  imagePreview: string;
  usedModel: "openai" | "local";
}

export const CAPTION_STYLE_ORDER: CaptionStyleKey[] = [
  "minimal_cool",
  "luxury_fashion",
  "sad_late_night",
  "rich_kid",
  "artistic",
  "deep_emotional",
  "english_instagram",
  "short_mysterious",
];

export const CAPTION_STYLE_LABELS: Record<CaptionStyleKey, string> = {
  minimal_cool: "Minimal cool",
  luxury_fashion: "Luxury fashion",
  sad_late_night: "Sad / late night",
  rich_kid: "Rich kid aesthetic",
  artistic: "Artistic",
  deep_emotional: "Deep emotional",
  english_instagram: "English Instagram",
  short_mysterious: "Short mysterious",
};
