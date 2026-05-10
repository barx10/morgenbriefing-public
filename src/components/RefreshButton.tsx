"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);
  const [, startTransition] = useTransition();

  const handleRefresh = () => {
    setSpinning(true);
    startTransition(() => {
      router.refresh();
    });
    setTimeout(() => setSpinning(false), 800);
  };

  return (
    <button
      onClick={handleRefresh}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/[0.5] text-[var(--muted)] transition hover:bg-white/[0.8] hover:text-[var(--foreground)]"
      aria-label="Oppdater kalender"
      title="Oppdater kalender"
    >
      <span
        style={{
          display: "inline-block",
          transition: "transform 0.8s ease",
          transform: spinning ? "rotate(360deg)" : "rotate(0deg)",
        }}
      >
        ↻
      </span>
    </button>
  );
}
