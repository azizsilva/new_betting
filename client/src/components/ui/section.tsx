"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Section({ children }: { children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

export function SectionHeader({
  icon,
  title,
  actionLabel = "View all",
  actionHref = "#",
}: {
  icon?: ReactNode;
  title: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        {icon}
        {title}
      </h2>
      <Link
        href={actionHref}
        className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-gold/50"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
