interface BriefingDisplayProps {
  text: string;
  onClose?: () => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

export default function BriefingDisplay({ text, onClose, onRegenerate, regenerating }: BriefingDisplayProps) {
  return (
    <div className="relative border border-white/[0.12] bg-white/[0.08] p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="absolute right-3 top-3 flex items-center gap-2">
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            aria-label="Lag ny plan"
            title="Lag ny plan"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.18] bg-white/[0.08] text-[#fff8eb] transition hover:bg-white/[0.18] disabled:opacity-50"
          >
            <span className={`inline-block ${regenerating ? "animate-spin" : ""}`}>↻</span>
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Skjul AI-assistent"
            title="Skjul"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.18] bg-white/[0.08] text-lg leading-none text-[#fff8eb] transition hover:bg-white/[0.18]"
          >
            ×
          </button>
        )}
      </div>
      <p className="whitespace-pre-wrap text-base leading-7 text-[#fff8eb] pr-20">{text}</p>
    </div>
  );
}
