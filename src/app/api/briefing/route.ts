import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTodaysEvents } from "@/lib/calendar";
import { generateMorningBriefing } from "@/lib/gemini";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }

  try {
    const events = await getTodaysEvents(session.accessToken);
    const briefing = await generateMorningBriefing(events);
    return NextResponse.json({ briefing });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Briefing error:", msg);
    return NextResponse.json(
      { error: "Kunne ikke hente morgenbriefing. Prøv igjen.", detail: msg },
      { status: 500 }
    );
  }
}
