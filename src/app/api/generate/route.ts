import { NextResponse } from "next/server";
import { buildFallbackCaptions } from "@/lib/captionPools";
import type { CaptionBundle, GenerateResponse } from "@/types/captions";
import { CAPTION_STYLE_ORDER } from "@/types/captions";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = { imageBase64?: string };

const JSON_INSTRUCTION = `Return ONLY compact JSON (no markdown) with this exact shape:
{
  "mood": "2-4 words, title case",
  "moodDetail": "one refined sentence describing mood, light, palette, and social vibe",
  "captions": {
    "minimal_cool": "string",
    "luxury_fashion": "string",
    "sad_late_night": "string",
    "rich_kid": "string",
    "artistic": "string",
    "deep_emotional": "string",
    "english_instagram": "string",
    "short_mysterious": "max 3 words, lowercase ok"
  }
}
Rules:
- Gen Z fluent, tasteful, never cringe, no hashtags unless one subtle hashtag max in english_instagram only.
- Each caption must feel distinct; avoid repeating phrases.
- Match the IMAGE (do not invent objects not implied by the scene).
- short_mysterious must be ultra short.`;

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
  }
  return trimmed;
}

function normalizeCaptions(raw: unknown): CaptionBundle | null {
  if (!raw || typeof raw !== "object") return null;
  const c = (raw as { captions?: unknown }).captions;
  if (!c || typeof c !== "object") return null;
  const out = {} as CaptionBundle;
  for (const key of CAPTION_STYLE_ORDER) {
    const val = (c as Record<string, unknown>)[key];
    if (typeof val !== "string" || !val.trim()) return null;
    out[key] = val.trim();
  }
  return out;
}

async function callOpenAI(imageDataUrl: string): Promise<{
  mood: string;
  moodDetail: string;
  captions: CaptionBundle;
} | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
      temperature: 0.85,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You write premium social captions for Instagram, Xiaohongshu, and TikTok. Tone: minimal, cinematic, luxury-fashion campaign, Apple-like restraint.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: JSON_INSTRUCTION },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("OpenAI error", res.status, errText);
    return null;
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(content));
  } catch {
    return null;
  }

  const captions = normalizeCaptions(parsed);
  if (!captions) return null;

  const mood = (parsed as { mood?: unknown }).mood;
  const moodDetail = (parsed as { moodDetail?: unknown }).moodDetail;
  if (typeof mood !== "string" || typeof moodDetail !== "string") return null;
  if (!mood.trim() || !moodDetail.trim()) return null;

  return { mood: mood.trim(), moodDetail: moodDetail.trim(), captions };
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const imageBase64 = body.imageBase64;
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
  }

  if (!imageBase64.startsWith("data:image/")) {
    return NextResponse.json({ error: "imageBase64 must be a data URL" }, { status: 400 });
  }

  const fingerprint = imageBase64.slice(0, 2400);
  const ai = await callOpenAI(imageBase64);
  const fallback = buildFallbackCaptions(fingerprint);

  const payload: GenerateResponse = ai
    ? {
        mood: ai.mood,
        moodDetail: ai.moodDetail,
        captions: ai.captions,
        imagePreview: imageBase64,
        usedModel: "openai",
      }
    : {
        mood: fallback.mood,
        moodDetail: fallback.moodDetail,
        captions: fallback.captions,
        imagePreview: imageBase64,
        usedModel: "local",
      };

  return NextResponse.json(payload);
}
