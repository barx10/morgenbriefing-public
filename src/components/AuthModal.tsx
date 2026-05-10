"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AuthButton from "./AuthButton";

export default function AuthModal() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (session) {
      setOpen(false);
    }
  }, [session]);

  return (
    <div className="fixed left-4 top-4 z-20 sm:left-6 sm:top-6">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="premium-ring flex items-center gap-3 rounded-full border border-white/70 bg-[var(--panel-strong)] px-2.5 py-2.5 text-sm font-bold text-[var(--foreground)] backdrop-blur-md transition hover:bg-white"
        aria-expanded={open}
        aria-controls="auth-panel"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--foreground)] text-xs font-bold text-white">
          {session?.user?.name?.charAt(0)?.toUpperCase() ?? "G"}
        </span>
        {!session && (
          <span className="hidden sm:inline">Logg inn</span>
        )}
      </button>

      {open && (
        <div
          id="auth-panel"
          className="editorial-panel absolute left-0 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-[1.4rem] p-5"
        >
          <div className="space-y-4">
            <div>
              <p className="fine-label text-[var(--muted)]">
                Konto
              </p>
              <h2 className="mt-2 display-font text-4xl leading-none text-[var(--foreground)]">
                {session ? "Du er inne" : "Fortsett med Google"}
              </h2>
            </div>

            <p className="text-sm leading-6 text-[var(--muted)]">
              {session
                ? `Innlogget som ${session.user?.email ?? session.user?.name ?? "bruker"}.`
                : "Logg inn når du vil hente dagens briefing og åpne kalenderen din."}
            </p>

            <AuthButton variant={session ? "ghost" : "primary"} />
          </div>
        </div>
      )}
    </div>
  );
}
