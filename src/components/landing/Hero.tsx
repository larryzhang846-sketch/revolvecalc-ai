"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      <div className="mx-auto flex min-h-[calc(100dvh-7rem)] max-w-6xl flex-col justify-center px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-[10px] font-semibold uppercase tracking-luxe text-mist"
        >
          AI caption atelier
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-4xl font-display text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] text-frost text-balance"
        >
          Your photo.
          <span className="block text-bone/80">Eight ways to say it.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-xl text-sm leading-relaxed text-mist sm:text-base"
        >
          AURA reads mood and style, then writes captions for Instagram, Xiaohongshu, and TikTok —
          minimal, cinematic, and quietly luxurious.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <Link
            href="/upload"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-line bg-frost px-10 py-4 text-[11px] font-semibold uppercase tracking-luxe text-ink transition hover:border-white/20"
          >
            <span className="relative z-10">Begin upload</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition duration-700 group-hover:translate-x-full" />
          </Link>
          <p className="text-[11px] text-mist">
            Private by default. Images are used only to generate your session.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
