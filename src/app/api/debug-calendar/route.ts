import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ error: "No session or access token" });
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const calendar = google.calendar({ version: "v3", auth });

    const calendarList = await calendar.calendarList.list();
    const calendars = (calendarList.data.items ?? []).map((c) => ({
      id: c.id,
      summary: c.summary,
    }));

    return Response.json({ ok: true, calendars });
  } catch (error: unknown) {
    const e = error as { message?: string; status?: number; response?: { data?: unknown } };
    return Response.json({
      error: e.message,
      status: e.status,
      data: e.response?.data,
    });
  }
}
