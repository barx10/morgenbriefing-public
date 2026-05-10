"use client";
import { useState } from "react";
import BriefingDisplay from "./BriefingDisplay";

export default function BriefingButton() {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (briefing) {
      setOpen((v) => !v);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/briefing", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Noe gikk galt");
      setBriefing(data.briefing);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/briefing", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Noe gikk galt");
      setBriefing(data.briefing);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setLoading(false);
    }
  }

  const buttonLabel = loading
    ? null
    : briefing
      ? open
        ? "Skjul AI-assistent"
        : "Vis AI-assistent"
      : "Spør AI-assistenten";

  return (
    <div className="space-y-4 w-full">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-full bg-[#fff8eb] px-7 py-4 text-base font-bold text-[#111827] shadow-[0_18px_45px_rgba(0,0,0,0.2)] transition hover:bg-white hover:shadow-[0_22px_55px_rgba(0,0,0,0.24)] disabled:cursor-not-allowed disabled:bg-[#d4c7b5] disabled:text-[#5f564a]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Henter dagens program...
          </span>
        ) : (
          buttonLabel
        )}
      </button>

      {error && (
        <p className="text-center text-sm text-[#f3a08d]">{error}</p>
      )}
      {briefing && open && (
        <BriefingDisplay
          text={briefing}
          onClose={() => setOpen(false)}
          onRegenerate={handleRegenerate}
          regenerating={loading}
        />
      )}
    </div>
  );
}
