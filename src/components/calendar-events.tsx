"use client";

import { useEffect, useState, useCallback } from "react";
import { EventDialog } from "./event-dialog";

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
  colorId?: string;
  conferenceData?: {
    entryPoints?: Array<{ uri?: string; entryPointType?: string }>;
  };
}

const EVENT_COLORS: Record<string, string> = {
  "1": "border-l-blue-500",
  "2": "border-l-green-500",
  "3": "border-l-violet-500",
  "4": "border-l-rose-500",
  "5": "border-l-yellow-500",
  "6": "border-l-orange-500",
  "7": "border-l-cyan-500",
  "8": "border-l-zinc-400",
  "9": "border-l-indigo-500",
  "10": "border-l-emerald-500",
  "11": "border-l-red-500",
};

function formatTime(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function groupByDate(events: CalendarEvent[]) {
  const groups: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const dateStr = event.start?.dateTime || event.start?.date || "";
    const dateKey = dateStr.split("T")[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(event);
  }
  return groups;
}

interface CalendarEventsProps {
  refreshKey: number;
}

export function CalendarEvents({ refreshKey }: CalendarEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEvents = useCallback(() => {
    setLoading(true);
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setEvents(data.events);
          setError(null);
        }
      })
      .catch(() => setError("Error al cargar los eventos"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshKey]);

  const handleDelete = async (eventId: string) => {
    setDeletingId(eventId);
    try {
      const res = await fetch(`/api/calendar/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-800/50" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button onClick={fetchEvents} className="mt-3 text-sm text-red-300 underline">
          Reintentar
        </button>
      </div>
    );
  }

  const grouped = groupByDate(events);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Tus próximos eventos</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            {events.length} evento{events.length !== 1 && "s"} en los próximos 30 días
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo evento
        </button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-lg text-zinc-400">No hay eventos próximos</p>
          <button
            onClick={handleCreate}
            className="mt-4 text-sm font-medium text-blue-400 transition hover:text-blue-300"
          >
            Crear tu primer evento
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([dateKey, dayEvents]) => (
            <div key={dateKey}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {formatDate(dayEvents[0]?.start?.dateTime || dayEvents[0]?.start?.date)}
              </h2>
              <div className="flex flex-col gap-2">
                {dayEvents.map((event) => {
                  const borderColor = EVENT_COLORS[event.colorId || ""] || "border-l-blue-500";
                  const isAllDay = !event.start?.dateTime;
                  const meetLink = event.conferenceData?.entryPoints?.find(
                    (e) => e.entryPointType === "video"
                  )?.uri;

                  return (
                    <div
                      key={event.id}
                      className={`group relative flex flex-col gap-2 rounded-xl border border-zinc-800 border-l-[3px] bg-zinc-900/50 p-4 transition hover:bg-zinc-800/50 ${borderColor} sm:flex-row sm:items-start sm:gap-4`}
                    >
                      <div className="min-w-[60px] text-sm text-zinc-400 sm:pt-0.5 sm:text-right">
                        {isAllDay ? (
                          <span className="text-xs font-medium uppercase tracking-wider">Todo el día</span>
                        ) : (
                          <div className="flex gap-2 sm:flex-col sm:gap-0">
                            <span>{formatTime(event.start?.dateTime)}</span>
                            <span className="text-zinc-600 sm:block">
                              {formatTime(event.end?.dateTime)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-zinc-100 truncate">
                          {event.summary || "(Sin título)"}
                        </h3>
                        {event.location && (
                          <p className="mt-0.5 truncate text-sm text-zinc-500">
                            {event.location}
                          </p>
                        )}
                        {meetLink && (
                          <a
                            href={meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 transition hover:bg-blue-500/20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                            </svg>
                            Google Meet
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleEdit(event)}
                          className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-700 hover:text-white"
                          title="Editar"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          disabled={deletingId === event.id}
                          className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-500/20 hover:text-red-400 disabled:opacity-40"
                          title="Eliminar"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                        {event.htmlLink && (
                          <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-700 hover:text-white"
                            title="Abrir en Google Calendar"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <EventDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingEvent(null);
        }}
        onSaved={fetchEvents}
        editEvent={editingEvent}
      />
    </div>
  );
}
