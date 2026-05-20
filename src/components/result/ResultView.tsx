"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RESULT_STORAGE_KEY } from "@/lib/storage";
import {
  CAPTION_STYLE_LABELS,
  CAPTION_STYLE_ORDER,
  type CaptionStyleKey,
  type GenerateResponse,
} from "@/types/captions";

export function ResultView() {
  const router = useRouter();
  const [data, setData] = useState<GenerateResponse | null>(null);
  const [copied, setCopied] = useState<CaptionStyleKey | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (!raw) {
      router.replace("/upload");
      return;
    }
    try {
      setData(JSON.parse(raw) as GenerateResponse);
    } catch {
      router.replace("/upload");
    }
  }, [router]);

  const items = useMemo(() => {
    if (!data) return [];
    return CAPTION_STYLE_ORDER.map((key) => ({
      key,
      label: CAPTION_STYLE_LABELS[key],
      text: data.captions[key],
    }));
  }, [data]);

  async function copy(text: string, key: CaptionStyleKey) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-32 text-center text-mist sm:px-8">
        Loading your session…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-4 sm:px-8">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-line bg-graphite lg:sticky lg:top-32 lg:max-w-md"
        >
          <Image
            src={data.imagePreview}
            alt="Your upload"
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/70 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <p className="text-[10px] font-semibold uppercase tracking-luxe text-bone/80">Mood</p>
            <p className="mt-2 font-display text-3xl text-frost">{data.mood}</p>
            <p className="mt-3 text-sm leading-relaxed text-mist">{data.moodDetail}</p>
            <p className="mt-4 text-[10px] uppercase tracking-wide text-mist/80">
              Engine: {data.usedModel === "openai" ? "Vision model" : "Curated local blend"}
            </p>
          </div>
        </motion.div>

        <div className="flex-1 space-y-5">
          <header>
            <p className="text-[10px] font-semibold uppercase tracking-luxe text-mist">Results</p>
            <h1 className="mt-3 font-display text-4xl text-frost sm:text-5xl">Choose your line.</h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-mist">
              Tap copy on anything that fits your platform voice — then tweak freely. Captions are
              written to feel native to Gen Z social, without the clutter.
            </p>
            <div className="mt-8">
              <Link
                href="/upload"
                className="inline-flex items-center justify-center rounded-full border border-line bg-white/[0.03] px-8 py-3 text-[10px] font-semibold uppercase tracking-luxe text-frost transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                New photo
              </Link>
            </div>
          </header>

          <div className="grid gap-4 pt-4">
            {items.map((item, idx) => (
              <motion.article
                key={item.key}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-line bg-gradient-to-br from-white/[0.035] to-transparent p-6 sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-luxe text-accent">
                      {item.label}
                    </p>
                    <p className="mt-4 font-display text-2xl leading-snug text-bone sm:text-[1.75rem]">
                      {item.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copy(item.text, item.key)}
                    className="shrink-0 rounded-full border border-line bg-void/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-luxe text-frost transition hover:border-white/20"
                  >
                    {copied === item.key ? "Copied" : "Copy"}
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
