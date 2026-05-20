"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const shots = [
  {
    src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    alt: "Editorial portrait in soft light",
  },
  {
    src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
    alt: "Fashion silhouette on city street",
  },
  {
    src: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    alt: "Minimal white tee, high contrast",
  },
  {
    src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
    alt: "Beauty close-up with cinematic shadows",
  },
];

export function PhotoMosaic() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="mb-12 flex flex-col gap-4 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-luxe text-mist">
            Reference mood
          </p>
          <h2 className="mt-3 font-display text-3xl text-frost sm:text-4xl">
            Built for photos that already feel expensive.
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-mist">
          Upload anything: mirror selfies, street snaps, golden-hour portraits, study-desk still
          lifes. AURA reads tone, light, and energy — then writes captions with intention.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {shots.map((shot, i) => (
          <motion.div
            key={shot.src}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-line bg-graphite"
          >
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover opacity-95 transition duration-700 hover:scale-[1.03] hover:opacity-100"
                priority={i === 0}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/55 via-transparent to-transparent" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
