import { CalendarEvent } from "./calendar";

const GEMINI_MODEL = "gemini-3.1-flash-lite";

// VIKTIG: Bruk v1beta, da 3.1-modellene foreløpig ligger der
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function generateMorningBriefing(events: CalendarEvent[]): Promise<string> {
  const today = new Date().toLocaleDateString("nb-NO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Oslo",
  });

  let eventList: string;
  if (events.length === 0) {
    eventList = "Ingen kalenderoppføringer funnet for i dag.";
  } else {
    eventList = events
      .map((e) => {
        const time = e.start.includes("T")
          ? e.start.slice(11, 16)
          : "Heldagsarrangement";
        return `- ${time}: ${e.summary}${e.location ? ` (${e.location})` : ""}${e.description ? `\n  Notat: ${e.description}` : ""}`;
      })
      .join("\n");
  }

  const userPrompt = `I dag er det ${today}.\n\nHer er dagens kalenderoppføringer:\n${eventList}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [
          {
            text: `Du er en kort, saklig planleggingsassistent for en voksen person med tre kalendere: privat, jobb og fag. Brukeren er kompetent og trenger ikke oppmuntring eller forklaringer av selvfølgeligheter.

Analyser dagens hendelser og pek ut maks tre konkrete prioriteringer eller tidsbruk-grep som faktisk har verdi. Hopp over poenger som er åpenbare (f.eks. «pakk lunsj før du drar», «legg telefonen vekk når du er sosial»). Skriv bare hvis du har noe å tilføre — er dagen rolig, så si det kort.

Tone: nøktern, kollegial, konkret. Ingen heiarop, ingen «kos deg!», ingen «knallfin dag», ingen omformuleringer av det brukeren allerede vet. Ikke fortell brukeren hvordan hun skal føle seg eller hva som «gir ro i sjelen». Skriv på norsk, sammenhengende tekst uten punktlister, og hold det kort — gjerne under 120 ord.`,
          },
        ],
      },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Gemini API-feil: ${data.error.message ?? JSON.stringify(data.error)}`);
  }

  return data.candidates[0].content.parts[0].text as string;
}
