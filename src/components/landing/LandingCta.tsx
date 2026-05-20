"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function LandingCta() {
  return (
    <section className="border-t border-line bg-gradient-to-b from-graphite/30 to-void">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-10 px-5 py-20 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-28">
        <div className="max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-luxe text-mist">Next</p>
          <h3 className="mt-4 font-display text-3xl text-frost sm:text-4xl">
            Drop a frame. Leave with language.
          </h3>
        </div>
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-10 py-4 text-[11px] font-semibold uppercase tracking-luxe text-frost backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.06]"
          >
            Open upload
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
