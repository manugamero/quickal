import { auth } from "@/auth";
import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  listEvents,
} from "@/lib/google-calendar";

export const maxDuration = 30;

function buildSystemPrompt() {
  const now = new Date();
  const date = now.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `Eres el asistente de Quickal, una app de calendario inteligente.
Ayudas a gestionar Google Calendar con lenguaje natural (español/inglés).

Hoy: ${date}. Hora: ${time}. Zona: Europe/Madrid.

Reglas:
- Extrae toda la info posible del mensaje del usuario.
- Si falta fecha u hora, pregunta.
- Usa ISO 8601 para fechas. Si dicen "mañana", "el lunes", etc., calcula la fecha.
- Si piden videollamada/Meet, usa addMeet: true.
- Sé conciso. Confirma cada acción con un resumen breve.
- Si el usuario solo saluda, responde brevemente y pregunta en qué ayudar.`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return new Response("Not authenticated", { status: 401 });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: buildSystemPrompt(),
    messages,
    tools: {
      createEvent: tool({
        description: "Create a new Google Calendar event.",
        inputSchema: z.object({
          summary: z.string().describe("Event title"),
          description: z.string().optional().describe("Event description"),
          location: z.string().optional().describe("Event location"),
          startDateTime: z.string().describe("Start in ISO 8601"),
          endDateTime: z.string().describe("End in ISO 8601"),
          addMeet: z.boolean().optional().describe("Add Google Meet call"),
          attendees: z
            .array(z.string())
            .optional()
            .describe("Attendee emails"),
        }),
        execute: async (params) => {
          const event = await createEvent(params);
          return {
            success: true,
            event: {
              id: event.id,
              summary: event.summary,
              start: event.start,
              end: event.end,
              location: event.location,
              meetLink: event.conferenceData?.entryPoints?.[0]?.uri,
              htmlLink: event.htmlLink,
            },
          };
        },
      }),

      updateEvent: tool({
        description: "Update an existing Google Calendar event.",
        inputSchema: z.object({
          eventId: z.string().describe("Event ID to update"),
          summary: z.string().optional().describe("New title"),
          description: z.string().optional().describe("New description"),
          location: z.string().optional().describe("New location"),
          startDateTime: z
            .string()
            .optional()
            .describe("New start ISO 8601"),
          endDateTime: z.string().optional().describe("New end ISO 8601"),
          addMeet: z.boolean().optional().describe("Add Google Meet"),
          attendees: z
            .array(z.string())
            .optional()
            .describe("Updated emails"),
        }),
        execute: async (params) => {
          const { eventId, ...rest } = params;
          const event = await updateEvent(eventId, rest);
          return {
            success: true,
            event: {
              id: event.id,
              summary: event.summary,
              start: event.start,
              end: event.end,
              meetLink: event.conferenceData?.entryPoints?.[0]?.uri,
            },
          };
        },
      }),

      deleteEvent: tool({
        description: "Delete a Google Calendar event.",
        inputSchema: z.object({
          eventId: z.string().describe("Event ID to delete"),
        }),
        execute: async (params) => {
          await deleteEvent(params.eventId);
          return { success: true, deletedId: params.eventId };
        },
      }),

      listEvents: tool({
        description:
          "List or search upcoming calendar events. Use when user asks about schedule.",
        inputSchema: z.object({
          query: z.string().optional().describe("Search query"),
          daysAhead: z.number().optional().describe("Days to look ahead"),
        }),
        execute: async (params) => {
          const events = await listEvents(
            params.query,
            20,
            params.daysAhead || 30
          );
          return {
            events: events.map((e) => ({
              id: e.id,
              summary: e.summary,
              start: e.start,
              end: e.end,
              location: e.location,
              description: e.description?.slice(0, 100),
              meetLink: e.conferenceData?.entryPoints?.[0]?.uri,
            })),
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
