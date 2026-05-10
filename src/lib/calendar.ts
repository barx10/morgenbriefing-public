import { google } from "googleapis";

export interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
}

export async function getTodaysEvents(accessToken: string, dayOffset = 0): Promise<CalendarEvent[]> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });

  const TIME_ZONE = "Europe/Oslo";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  const d = Number(parts.find((p) => p.type === "day")!.value);

  const osloMidnightUtc = (year: number, month: number, day: number) => {
    const utcGuess = Date.UTC(year, month - 1, day);
    const asOslo = new Date(utcGuess).toLocaleString("en-US", { timeZone: TIME_ZONE });
    const offsetMs = new Date(asOslo).getTime() - utcGuess;
    return new Date(utcGuess - offsetMs);
  };

  const startOfDay = osloMidnightUtc(y, m, d + dayOffset);
  const endOfDay = osloMidnightUtc(y, m, d + dayOffset + 1);

  const calendarList = await calendar.calendarList.list();
  const calendars = calendarList.data.items ?? [];

  const eventsByCalendar = await Promise.all(
    calendars.map((cal) =>
      calendar.events.list({
        calendarId: cal.id!,
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      })
    )
  );

  const seen = new Set<string>();
  const allEvents = eventsByCalendar
    .flatMap((res) => res.data.items ?? [])
    .filter((event) => {
      const summary = event.summary ?? "";
      if (/^Uke \d+ i \d{4}$/.test(summary)) return false;
      const normalizedSummary = summary.replace(/\\,/g, ",").trim().toLowerCase();
      const start = event.start?.dateTime ?? event.start?.date ?? "";
      const normalizedStart = start.includes("T") ? new Date(start).getTime().toString() : start;
      const key = `${normalizedSummary}|${normalizedStart}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  allEvents.sort((a, b) => {
    const aStart = a.start?.dateTime ?? a.start?.date ?? "";
    const bStart = b.start?.dateTime ?? b.start?.date ?? "";
    return aStart.localeCompare(bStart);
  });

  return allEvents.map((event) => ({
    summary: event.summary ?? "Uten tittel",
    start: event.start?.dateTime ?? event.start?.date ?? "",
    end: event.end?.dateTime ?? event.end?.date ?? "",
    location: event.location ?? undefined,
    description: event.description ?? undefined,
  }));
}
