import { auth } from "@/auth";
import { listEvents, createEvent } from "@/lib/google-calendar";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const query = req.nextUrl.searchParams.get("q") || undefined;
    const events = await listEvents(query);
    return NextResponse.json({ events });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const event = await createEvent(body);
    return NextResponse.json({ event });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
