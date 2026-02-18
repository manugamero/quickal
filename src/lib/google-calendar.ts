import { google, calendar_v3 } from "googleapis";
import { auth } from "@/auth";

export async function getCalendarClient() {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function listEvents(
  query?: string,
  maxResults = 50,
  daysAhead = 30
) {
  const calendar = await getCalendarClient();
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);

  const params: calendar_v3.Params$Resource$Events$List = {
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  };

  if (query) params.q = query;

  const response = await calendar.events.list(params);
  return response.data.items || [];
}

export async function createEvent(params: {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  addMeet?: boolean;
  attendees?: string[];
}) {
  const calendar = await getCalendarClient();

  const eventBody: calendar_v3.Schema$Event = {
    summary: params.summary,
    description: params.description,
    location: params.location,
    start: { dateTime: params.startDateTime, timeZone: "Europe/Madrid" },
    end: { dateTime: params.endDateTime, timeZone: "Europe/Madrid" },
  };

  if (params.attendees?.length) {
    eventBody.attendees = params.attendees.map((email) => ({ email }));
  }

  const requestParams: calendar_v3.Params$Resource$Events$Insert = {
    calendarId: "primary",
    requestBody: eventBody,
  };

  if (params.addMeet) {
    eventBody.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
    requestParams.conferenceDataVersion = 1;
  }

  const response = await calendar.events.insert(requestParams);
  return response.data;
}

export async function updateEvent(
  eventId: string,
  params: {
    summary?: string;
    description?: string;
    location?: string;
    startDateTime?: string;
    endDateTime?: string;
    addMeet?: boolean;
    attendees?: string[];
  }
) {
  const calendar = await getCalendarClient();

  const existing = await calendar.events.get({
    calendarId: "primary",
    eventId,
  });

  const eventBody: calendar_v3.Schema$Event = {
    ...existing.data,
    ...(params.summary !== undefined && { summary: params.summary }),
    ...(params.description !== undefined && {
      description: params.description,
    }),
    ...(params.location !== undefined && { location: params.location }),
  };

  if (params.startDateTime) {
    eventBody.start = {
      dateTime: params.startDateTime,
      timeZone: "Europe/Madrid",
    };
  }
  if (params.endDateTime) {
    eventBody.end = {
      dateTime: params.endDateTime,
      timeZone: "Europe/Madrid",
    };
  }
  if (params.attendees?.length) {
    eventBody.attendees = params.attendees.map((email) => ({ email }));
  }

  const requestParams: calendar_v3.Params$Resource$Events$Update = {
    calendarId: "primary",
    eventId,
    requestBody: eventBody,
  };

  if (params.addMeet && !existing.data.conferenceData) {
    eventBody.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
    requestParams.conferenceDataVersion = 1;
  }

  const response = await calendar.events.update(requestParams);
  return response.data;
}

export async function deleteEvent(eventId: string) {
  const calendar = await getCalendarClient();
  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}

export async function getEvent(eventId: string) {
  const calendar = await getCalendarClient();
  const response = await calendar.events.get({
    calendarId: "primary",
    eventId,
  });
  return response.data;
}
