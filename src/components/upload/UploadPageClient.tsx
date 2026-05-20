"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { fileToResizedDataUrl } from "@/lib/resizeImage";
import { RESULT_STORAGE_KEY } from "@/lib/storage";
import type { GenerateResponse } from "@/types/captions";

export default function UploadPageClient() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const ingestFile = useCallback(async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Use a JPG, PNG, or HEIC photo.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setPreview(dataUrl);
    } catch {
      setError("Could not read that image. Try another file.");
    } finally {
      setBusy(false);
    }
  }, []);

  const runGenerate = useCallback(async () => {
    if (!preview) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: preview }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? "Generation failed");
      }
      const payload = (await res.json()) as GenerateResponse;
      sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(payload));
      router.push("/result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }, [preview, router]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      void ingestFile(f ?? null);
    },
    [ingestFile],
  );

  const reset = useCallback(() => {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-6 sm:px-8">
      <header className="mb-12 sm:mb-16">
        <p className="text-[10px] font-semibold uppercase tracking-luxe text-mist">Upload</p>
        <h1 className="mt-4 font-display text-4xl text-frost sm:text-5xl">One frame. Eight voices.</h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-mist">
          Drop a photo, confirm the crop, then generate. We compress locally for speed, then analyze
          mood and lighting to craft captions in distinct styles.
        </p>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          void ingestFile(f ?? null);
        }}
      />

      {!preview ? (
        <motion.button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          whileTap={{ scale: busy ? 1 : 0.995 }}
          className={`group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed px-6 py-16 text-center transition sm:py-24 ${
            dragOver
              ? "border-accent/60 bg-white/[0.04]"
              : "border-line bg-gradient-to-b from-white/[0.03] to-transparent hover:border-white/15"
          } ${busy ? "opacity-70" : ""}`}
        >
          <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-700 group-hover:opacity-100">
            <div className="absolute -left-1/2 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <AnimatePresence mode="wait">
            {busy ? (
              <motion.div
                key="preparing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-8 flex h-40 w-40 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-graphite/60 sm:h-48 sm:w-48"
              >
                <span className="h-px w-10 bg-gradient-to-r from-transparent via-accent to-transparent" />
                <span className="text-[10px] font-semibold uppercase tracking-luxe text-mist">
                  Importing
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-8 flex h-40 w-40 items-center justify-center rounded-2xl border border-line bg-graphite/60 sm:h-48 sm:w-48"
              >
                <span className="text-[10px] font-semibold uppercase tracking-luxe text-mist">
                  Drop
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-sm text-bone">
            {busy ? "Optimizing your frame…" : "Drop your photo here"}
          </p>
          <p className="mt-3 text-[11px] text-mist">
            {busy ? "Local resize for a fast, clean upload." : "or click to choose from your library"}
          </p>
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          <div className="relative overflow-hidden rounded-3xl border border-line bg-graphite">
            <div className="relative h-[min(70vh,520px)] w-full">
              <Image src={preview} alt="Selected" fill className="object-contain" unoptimized />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/55 via-transparent to-transparent" />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-line px-7 py-3 text-[10px] font-semibold uppercase tracking-luxe text-mist transition hover:border-white/20 hover:text-frost"
            >
              Choose different photo
            </button>
            <motion.button
              type="button"
              disabled={busy}
              whileTap={{ scale: busy ? 1 : 0.98 }}
              onClick={() => void runGenerate()}
              className="inline-flex items-center justify-center rounded-full border border-line bg-frost px-10 py-4 text-[11px] font-semibold uppercase tracking-luxe text-ink transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Analyzing & writing…" : "Generate captions"}
            </motion.button>
          </div>
        </motion.div>
      )}

      {error ? (
        <p className="mt-6 text-sm text-red-300/90" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
