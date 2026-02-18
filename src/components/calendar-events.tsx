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
  conferenceData?: {
    entryPoints?: Array<{ uri?: string; entryPointType?: string }>;
  };
}

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

export function CalendarEvents({ refreshKey }: { refreshKey: number }) {
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
        if (data.error) setError(data.error);
        else {
          setEvents(data.events);
          setError(null);
        }
      })
      .catch(() => setError("Error al cargar eventos"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshKey]);

  const handleDelete = async (eventId: string) => {
    setDeletingId(eventId);
    try {
      const res = await fetch(`/api/calendar/${eventId}`, { method: "DELETE" });
      if (res.ok) setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-bg-tertiary" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-sm text-text-secondary">
        <p>{error}</p>
        <button onClick={fetchEvents} className="mt-2 text-text underline">
          Reintentar
        </button>
      </div>
    );
  }

  const grouped = groupByDate(events);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-xs text-text-tertiary">
          {events.length} evento{events.length !== 1 && "s"}
        </p>
        <button
          onClick={() => {
            setEditingEvent(null);
            setDialogOpen(true);
          }}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-text transition-colors hover:bg-accent-hover"
        >
          + Nuevo
        </button>
      </div>

      {events.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-text-secondary">Sin eventos próximos</p>
          <button
            onClick={() => {
              setEditingEvent(null);
              setDialogOpen(true);
            }}
            className="mt-2 text-xs text-text-tertiary underline"
          >
            Crear evento
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([dateKey, dayEvents]) => (
            <div key={dateKey}>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-text-tertiary">
                {formatDate(dayEvents[0]?.start?.dateTime || dayEvents[0]?.start?.date)}
              </p>
              <div className="flex flex-col">
                {dayEvents.map((event) => {
                  const isAllDay = !event.start?.dateTime;
                  const meetLink = event.conferenceData?.entryPoints?.find(
                    (e) => e.entryPointType === "video"
                  )?.uri;

                  return (
                    <div
                      key={event.id}
                      className="group flex items-start gap-3 border-b border-border/50 py-3 last:border-0"
                    >
                      <div className="w-12 shrink-0 pt-0.5 text-right text-[11px] text-text-tertiary">
                        {isAllDay ? (
                          "día"
                        ) : (
                          <span>{formatTime(event.start?.dateTime)}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text truncate">
                          {event.summary || "(Sin título)"}
                        </p>
                        {event.location && (
                          <p className="mt-0.5 truncate text-xs text-text-tertiary">
                            {event.location}
                          </p>
                        )}
                        {meetLink && (
                          <a
                            href={meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block text-[11px] text-text-secondary underline decoration-border hover:text-text"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Meet
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => {
                            setEditingEvent(event);
                            setDialogOpen(true);
                          }}
                          className="rounded p-1 text-text-tertiary transition-colors hover:text-text"
                          title="Editar"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          disabled={deletingId === event.id}
                          className="rounded p-1 text-text-tertiary transition-colors hover:text-danger disabled:opacity-30"
                          title="Eliminar"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
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
