"use client";

import { useRouter } from "next/navigation";

interface DayNavProps {
  offset: number;
}

export default function DayNav({ offset }: DayNavProps) {
  const router = useRouter();

  const go = (delta: number) => {
    const next = offset + delta;
    router.push(next === 0 ? "/" : `/?dag=${next}`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => go(-1)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/[0.5] text-[var(--muted)] transition hover:bg-white/[0.8] hover:text-[var(--foreground)]"
        aria-label="Forrige dag"
      >
        ←
      </button>
      {offset !== 0 && (
        <button
          onClick={() => go(-offset)}
          className="fine-label px-3 py-1 rounded-full border border-[color:var(--line)] bg-white/[0.5] text-[var(--muted)] transition hover:bg-white/[0.8] hover:text-[var(--foreground)]"
        >
          I dag
        </button>
      )}
      <button
        onClick={() => go(1)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/[0.5] text-[var(--muted)] transition hover:bg-white/[0.8] hover:text-[var(--foreground)]"
        aria-label="Neste dag"
      >
        →
      </button>
    </div>
  );
}
