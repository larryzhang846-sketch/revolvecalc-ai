"use client";

import { motion, useReducedMotion } from "framer-motion";

const lines = [
  { label: "Minimal cool", text: "Less noise. More presence." },
  { label: "Luxury fashion", text: "Monochrome discipline. Editorial heat." },
  { label: "Sad / late night", text: "City sleeps. I don’t." },
  { label: "Rich kid", text: "Not loud — expensive." },
  { label: "Artistic", text: "Light writes the first line; shadow finishes it." },
  { label: "Deep emotional", text: "Some softness is survival." },
  { label: "English IG", text: "Soft launch of my new era." },
  { label: "Short mysterious", text: "Off record." },
];

export function CaptionRail() {
  const loop = [...lines, ...lines];
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-y border-line bg-gradient-to-b from-graphite/40 to-void py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-10 flex flex-col gap-3 sm:mb-14">
          <p className="text-[10px] font-semibold uppercase tracking-luxe text-mist">
            Example captions
          </p>
          <h2 className="font-display text-3xl text-frost sm:text-4xl">
            Lines that read like a campaign.
          </h2>
        </div>
      </div>
      <div className="relative overflow-hidden mask-fade-x">
        <motion.div
          className="flex w-max gap-6 pr-6"
          animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 42, ease: "linear", repeat: Infinity }
          }
        >
          {loop.map((item, idx) => (
            <article
              key={`${item.label}-${idx}`}
              className="w-[min(78vw,320px)] shrink-0 rounded-2xl border border-line bg-white/[0.02] p-6 sm:p-7"
            >
              <p className="text-[10px] font-semibold uppercase tracking-luxe text-accent">
                {item.label}
              </p>
              <p className="mt-4 font-display text-2xl leading-snug text-bone sm:text-[1.65rem]">
                {item.text}
              </p>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
