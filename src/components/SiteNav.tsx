"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const links = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Upload" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/80 bg-void/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="font-display text-2xl tracking-tight text-frost sm:text-[1.65rem]">
            AURA
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-luxe text-mist/90 sm:inline">
            Caption atelier
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative px-3 py-2 text-[11px] font-medium uppercase tracking-wide transition-colors sm:px-4 ${
                  active ? "text-frost" : "text-mist hover:text-bone"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full border border-line bg-white/[0.04]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
