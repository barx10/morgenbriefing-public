"use client";

import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useRef } from "react";

function osloDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function AutoRefresh() {
  const router = useRouter();
  const { data: session } = useSession();
  const renderedDay = useRef(osloDateKey());
  const lastRefresh = useRef(Date.now());

  // Tving ny innlogging når Google-tokenet ikke kan refreshes lenger.
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signIn("google");
    }
  }, [session?.error]);

  useEffect(() => {
    const softRefresh = () => {
      lastRefresh.current = Date.now();
      renderedDay.current = osloDateKey();
      router.refresh();
    };

    const maybeRefresh = (force = false) => {
      const today = osloDateKey();
      const elapsed = Date.now() - lastRefresh.current;
      if (force || today !== renderedDay.current || elapsed > 60 * 1000) {
        softRefresh();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") maybeRefresh();
    };

    const onPageShow = (e: PageTransitionEvent) => {
      maybeRefresh(e.persisted);
    };

    const onFocus = () => maybeRefresh();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  return null;
}
