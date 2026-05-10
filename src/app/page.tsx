import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTodaysEvents, type CalendarEvent } from "@/lib/calendar";
import Image from "next/image";
import AuthModal from "@/components/AuthModal";
import BriefingButton from "@/components/BriefingButton";
import Greeting from "@/components/Greeting";
import DayNav from "@/components/DayNav";
import RefreshButton from "@/components/RefreshButton";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function getDayIntensity(eventCount: number, busyHours: number) {
  if (eventCount === 0) {
    return {
      label: "Belastning",
      value: "Lett dag",
      detail: "Ingen kalenderpunkter foreløpig.",
    };
  }

  if (eventCount >= 6 || busyHours >= 5) {
    return {
      label: "Belastning",
      value: "Høy puls",
      detail: "Timeplanen er tett og krever litt ekstra luft.",
    };
  }

  if (eventCount >= 3 || busyHours >= 2.5) {
    return {
      label: "Belastning",
      value: "Jevn flyt",
      detail: "Du har en aktiv dag med grei rytme.",
    };
  }

  return {
    label: "Belastning",
    value: "Rolig start",
    detail: "Det ser ut som du har litt mer pusterom i dag.",
  };
}

function formatTime(value: string) {
  if (!value || !value.includes("T")) {
    return "Heldag";
  }

  return new Date(value).toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Oslo",
  });
}

function getDayLabel(offset: number): string {
  if (offset === 0) return "i dag";
  if (offset === 1) return "i morgen";
  if (offset === -1) return "i går";
  if (offset > 0) return `om ${offset} dager`;
  return `for ${Math.abs(offset)} dager siden`;
}

function getDayHeading(offset: number): string {
  if (offset === 0) return "Dagens tidslinje";
  if (offset === 1) return "I morgen";
  if (offset === -1) return "I går";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  const d = Number(parts.find((p) => p.type === "day")!.value);
  const target = new Date(Date.UTC(y, m - 1, d + offset));
  return target.toLocaleDateString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function getSuggestions(events: CalendarEvent[], busyHours: number, dayOffset: number) {
  if (events.length === 0) {
    if (dayOffset === 0) {
      return [
        "Ingen avtaler i kalenderen — bruk dagen til det du selv prioriterer.",
        "Sett av en blokk tidlig til det viktigste, før noe nytt dukker opp.",
      ];
    }
    return ["Ingen avtaler er lagt inn for denne dagen ennå."];
  }

  const timed = events.filter((e) => e.start.includes("T") && e.end.includes("T"));
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("nb-NO", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Oslo",
    });

  const suggestions: string[] = [];
  const first = timed[0] ?? events[0];
  const last = timed[timed.length - 1] ?? events[events.length - 1];

  if (first?.start.includes("T")) {
    suggestions.push(`Første avtale er ${first.summary} kl. ${fmt(first.start)}.`);
  } else if (first) {
    suggestions.push(`Heldagsoppføring: ${first.summary}.`);
  }

  let backToBack = 0;
  let longestGapMinutes = 0;
  let longestGapStart: string | null = null;
  let longestGapEnd: string | null = null;

  for (let i = 1; i < timed.length; i++) {
    const prevEnd = new Date(timed[i - 1].end).getTime();
    const nextStart = new Date(timed[i].start).getTime();
    const gapMinutes = (nextStart - prevEnd) / 60000;
    if (gapMinutes < 15) backToBack++;
    if (gapMinutes >= 90 && gapMinutes > longestGapMinutes) {
      longestGapMinutes = gapMinutes;
      longestGapStart = timed[i - 1].end;
      longestGapEnd = timed[i].start;
    }
  }

  if (backToBack >= 2) {
    suggestions.push(`${backToBack} overganger uten pause — vurder en buffer.`);
  } else if (longestGapStart && longestGapEnd) {
    suggestions.push(
      `Ledig luke ${fmt(longestGapStart)}–${fmt(longestGapEnd)} egner seg til fokusarbeid.`,
    );
  } else if (busyHours >= 5) {
    suggestions.push("Tett dag — legg inn korte pauser der du kan.");
  } else if (timed.length === 1 && first?.start.includes("T")) {
    suggestions.push("Bare én avtale — resten av dagen er din.");
  }

  if (last?.end.includes("T") && last !== first) {
    suggestions.push(`Siste avtale: ${last.summary} kl. ${fmt(last.start)}–${fmt(last.end)}.`);
  }

  return suggestions.slice(0, 3);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ dag?: string }>;
}) {
  const params = await searchParams;
  const dayOffset = Math.max(-14, Math.min(14, parseInt(params.dag ?? "0", 10) || 0));

  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Auth error:", error);
  }
  let events: CalendarEvent[] = [];
  let upcomingDays: { offset: number; events: CalendarEvent[] }[] = [];

  if (session?.accessToken) {
    try {
      const [todayEvents, ...nextDays] = await Promise.all([
        getTodaysEvents(session.accessToken, dayOffset),
        getTodaysEvents(session.accessToken, dayOffset + 1),
        getTodaysEvents(session.accessToken, dayOffset + 2),
        getTodaysEvents(session.accessToken, dayOffset + 3),
        getTodaysEvents(session.accessToken, dayOffset + 4),
      ]);
      events = todayEvents;
      upcomingDays = nextDays.map((evts, i) => ({ offset: dayOffset + i + 1, events: evts }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Home page calendar error:", msg);
    }
  }

  const busyHours = events.reduce((total, event) => {
    if (!event.start.includes("T") || !event.end.includes("T")) {
      return total;
    }

    const duration = new Date(event.end).getTime() - new Date(event.start).getTime();
    return total + Math.max(duration, 0) / (1000 * 60 * 60);
  }, 0);

  const firstEvent = events[0];
  const intensity = getDayIntensity(events.length, busyHours);
  const suggestions = getSuggestions(events, busyHours, dayOffset);
  const userName = session?.user?.name?.split(" ")[0];
  const dayLabel = getDayLabel(dayOffset);
  const dayHeading = getDayHeading(dayOffset);
  const bookedTime =
    busyHours >= 1
      ? `${busyHours.toFixed(1).replace(".", ",")} timer booket`
      : events.length > 0
        ? "flere korte punkter"
        : "ingen booket tid";
  const daySummary = session
    ? events.length > 0
      ? `Du har ${events.length} avtale${events.length === 1 ? "" : "r"} i kalenderen ${dayLabel}, med ${bookedTime}. ${firstEvent ? `Første punkt er ${firstEvent.summary.toLowerCase()} kl. ${formatTime(firstEvent.start)}.` : ""}`
      : `Du har ingen kalenderpunkter ${dayLabel}.`
    : "Logg inn med Google for å hente kalenderen din. Da får du en AI-oppsummering av dagen, konkrete assistentforslag og en kronologisk tidslinje.";

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-5 sm:px-6 sm:py-8">
      <AuthModal />
      {session && <AutoRefresh />}

      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl items-center">
        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.78fr)]">
          <section className="ink-panel relative overflow-hidden rounded-[1.6rem] px-5 py-7 sm:px-9 sm:py-10">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.55] to-transparent" />
            <div className="absolute right-0 top-0 h-full w-px bg-white/10" />
            <div className="relative space-y-9">
              <header className="space-y-8">
                <div className="flex items-center gap-4">
                  <p className="fine-label text-[#ad9d8a]">Morgenbriefing</p>
                </div>

                <div className="space-y-4">
                  <h1 className="display-font max-w-3xl text-5xl leading-[0.94] text-[#fff8eb] sm:text-6xl lg:text-7xl">
                    {session ? <Greeting name={userName} offset={dayOffset} /> : "Dagens briefing."}
                  </h1>
                  {!session && (
                    <p className="max-w-2xl text-base leading-7 text-[#d8cbb8] sm:text-lg">
                      Når du logger inn, blir denne siden til en konkret morgenbriefing basert på kalenderen din.
                    </p>
                  )}
                </div>
              </header>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_16rem]">
                <section className="space-y-4 border-t border-white/[0.13] pt-6">
                  <p className="fine-label text-[#ad9d8a]">AI-assistent</p>
                  <div className="space-y-4">
                    <p className="text-xl leading-8 text-[#fff8eb] sm:text-2xl sm:leading-9">
                      {daySummary}
                    </p>
                    {session && <BriefingButton />}
                  </div>
                </section>

                <aside className="border-t border-white/[0.13] pt-6 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                  <p className="fine-label text-[#ad9d8a]">{intensity.label}</p>
                  <p className="mt-3 display-font text-4xl leading-none text-[#fff8eb]">
                    {session ? intensity.value : "Ikke hentet"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#d8cbb8]">
                    {session
                      ? intensity.detail
                      : "Belastning beregnes når kalenderen er koblet til."}
                  </p>
                </aside>
              </div>

              <section className="space-y-4 border-t border-white/[0.13] pt-6">
                <p className="fine-label text-[#ad9d8a]">Dagens fokus</p>
                {session ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion}
                        className="border-l border-[var(--accent)] bg-white/[0.06] px-4 py-3 text-sm leading-6 text-[#fff8eb]"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-white/[0.18] px-4 py-4 text-sm leading-7 text-[#d8cbb8]">
                    <p>
                      Logg inn via konto-knappen oppe til høyre for å få forslag som matcher
                      dagens kalender.
                    </p>
                  </div>
                )}
              </section>

            </div>
          </section>

          <aside className="editorial-panel rounded-[1.6rem] px-5 py-7 sm:px-8 sm:py-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="fine-label text-[var(--muted)]">Kalender</p>
                  {session && (
                    <div className="flex items-center gap-2">
                      <RefreshButton />
                      <DayNav offset={dayOffset} />
                    </div>
                  )}
                </div>
                <h2 className="display-font text-3xl leading-[0.95] text-[var(--foreground)] sm:text-5xl">
                  {session ? dayHeading : "Kalenderen vises her"}
                </h2>
                <p className="text-sm leading-7 text-[var(--muted)] sm:text-base">
                  {session
                    ? `Innlogget som ${session.user?.name ?? "bruker"}. Her ser du avtalene i rekkefølge.`
                    : "Logg inn fra konto-knappen oppe til høyre for å hente kalender og briefing for dagen."}
                </p>
              </div>

              <div className="border-y border-[color:var(--line)] py-5 sm:py-6">
                {session ? (
                  events.length > 0 ? (
                    <div className="space-y-5">
                      {events.map((event, index) => (
                        <div key={`${event.start}-${event.summary}-${index}`} className="flex gap-3">
                          <div className="flex w-14 shrink-0 flex-col items-center pt-1 sm:w-20">
                            <div className="display-font text-lg leading-none text-[var(--blue)] sm:text-2xl">
                              {formatTime(event.start)}
                            </div>
                            {index < events.length - 1 && (
                              <div className="mt-3 h-full w-px bg-[color:var(--line)]" />
                            )}
                          </div>
                          <div className="flex-1 border-l-2 border-[var(--accent)] bg-white/[0.55] px-3 py-2 shadow-[0_12px_35px_rgba(23,19,15,0.06)] sm:px-4 sm:py-3">
                            <p className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
                              {event.summary}
                            </p>
                            <p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">
                              {formatTime(event.start)} - {formatTime(event.end)}
                            </p>
                            {event.location && (
                              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                                {event.location}
                              </p>
                            )}
                            {event.description && (
                              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--foreground)] opacity-80">
                                {event.description.replace(/\n*AUTO-SYNC-ID:.*$/m, "").replace(/<[^>]+>/g, "").trim()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-[color:var(--line)] bg-white/[0.45] px-4 py-5 text-sm leading-7 text-[var(--muted)]">
                      Ingen aktiviteter i kalenderen {dayLabel}.
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm leading-7 text-[var(--muted)]">
                      Når du er logget inn, vises dagens avtaler som en tidslinje her.
                    </p>
                    <div className="border border-dashed border-[color:var(--line)] bg-white/[0.45] px-4 py-5 text-sm leading-7 text-[var(--muted)]">
                      Kalenderpunkter, tidspunkter og eventuelle steder kommer inn automatisk.
                    </div>
                  </div>
                )}
              </div>

              {session && upcomingDays.length > 0 && (
                <div className="space-y-4">
                  <p className="fine-label text-[var(--muted)]">Kommende dager</p>
                  {upcomingDays.map(({ offset, events: dayEvents }) => (
                    <div key={offset} className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        {getDayHeading(offset)}
                      </p>
                      {dayEvents.length === 0 ? (
                        <p className="text-sm text-[var(--muted)] opacity-50">Ingen avtaler</p>
                      ) : (
                        dayEvents.map((e, i) => (
                          <div key={i} className="flex gap-2 text-sm text-[var(--foreground)]">
                            <span className="w-12 shrink-0 text-[var(--muted)]">{formatTime(e.start)}</span>
                            <span className="line-clamp-2 leading-snug">{e.summary}</span>
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <footer className="fixed bottom-4 inset-x-0 flex flex-col items-center gap-1.5 pointer-events-none">
        <Image
          src="/laererliv-logo.png"
          alt="Lærerliv logo"
          width={36}
          height={36}
          className="rounded-[0.65rem] border border-white/[0.14] bg-white/[0.92] p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
        />
        <p className="text-[10px] tracking-wide text-[#ad9d8a]/60">Lærerliv &copy; 2026</p>
      </footer>
    </main>
  );
}
