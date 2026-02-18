"use client";

import { useEffect, useState } from "react";

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
  colorId?: string;
}

const EVENT_COLORS: Record<string, string> = {
  "1": "bg-blue-500/20 border-blue-500/40",
  "2": "bg-green-500/20 border-green-500/40",
  "3": "bg-violet-500/20 border-violet-500/40",
  "4": "bg-rose-500/20 border-rose-500/40",
  "5": "bg-yellow-500/20 border-yellow-500/40",
  "6": "bg-orange-500/20 border-orange-500/40",
  "7": "bg-cyan-500/20 border-cyan-500/40",
  "8": "bg-zinc-500/20 border-zinc-500/40",
  "9": "bg-indigo-500/20 border-indigo-500/40",
  "10": "bg-emerald-500/20 border-emerald-500/40",
  "11": "bg-red-500/20 border-red-500/40",
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

export function CalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setEvents(data.events);
        }
      })
      .catch(() => setError("Error al cargar los eventos"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl bg-zinc-800/50"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
        <p className="text-lg text-zinc-400">
          No hay eventos próximos en tu calendario
        </p>
      </div>
    );
  }

  const grouped = groupByDate(events);

  return (
    <div className="flex flex-col gap-8">
      {Object.entries(grouped).map(([dateKey, dayEvents]) => (
        <div key={dateKey}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            {formatDate(dayEvents[0]?.start?.dateTime || dayEvents[0]?.start?.date)}
          </h2>
          <div className="flex flex-col gap-2">
            {dayEvents.map((event) => {
              const colorClass =
                EVENT_COLORS[event.colorId || ""] ||
                "bg-zinc-800/50 border-zinc-700";
              const isAllDay = !event.start?.dateTime;

              return (
                <a
                  key={event.id}
                  href={event.htmlLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-start gap-4 rounded-xl border p-4 transition hover:scale-[1.01] hover:shadow-lg ${colorClass}`}
                >
                  <div className="min-w-[60px] pt-0.5 text-right text-sm text-zinc-400">
                    {isAllDay ? (
                      <span className="text-xs font-medium uppercase tracking-wider">
                        Todo el día
                      </span>
                    ) : (
                      <>
                        <div>{formatTime(event.start?.dateTime)}</div>
                        <div className="text-zinc-600">
                          {formatTime(event.end?.dateTime)}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-zinc-100 group-hover:text-white">
                      {event.summary || "(Sin título)"}
                    </h3>
                    {event.location && (
                      <p className="mt-1 text-sm text-zinc-500">
                        📍 {event.location}
                      </p>
                    )}
                    {event.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <svg
                    className="mt-1 h-4 w-4 text-zinc-600 transition group-hover:text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                    />
                  </svg>
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
