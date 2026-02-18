"use client";

import { useState, useEffect } from "react";

interface EventData {
  id?: string;
  summary: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  addMeet: boolean;
  attendees: string;
}

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
}

interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editEvent?: CalendarEvent | null;
}

function toLocalDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toISOString().split("T")[0];
}

function toLocalTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const defaultForm = (): EventData => {
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    summary: "",
    description: "",
    location: "",
    startDate: now.toISOString().split("T")[0],
    startTime: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    endDate: later.toISOString().split("T")[0],
    endTime: `${String(later.getHours()).padStart(2, "0")}:${String(later.getMinutes()).padStart(2, "0")}`,
    addMeet: false,
    attendees: "",
  };
};

export function EventDialog({
  open,
  onClose,
  onSaved,
  editEvent,
}: EventDialogProps) {
  const [form, setForm] = useState<EventData>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editEvent) {
      setForm({
        id: editEvent.id,
        summary: editEvent.summary || "",
        description: editEvent.description || "",
        location: editEvent.location || "",
        startDate: toLocalDate(editEvent.start?.dateTime) || editEvent.start?.date || "",
        startTime: toLocalTime(editEvent.start?.dateTime) || "09:00",
        endDate: toLocalDate(editEvent.end?.dateTime) || editEvent.end?.date || "",
        endTime: toLocalTime(editEvent.end?.dateTime) || "10:00",
        addMeet: false,
        attendees: "",
      });
    } else {
      setForm(defaultForm());
    }
    setError("");
  }, [editEvent, open]);

  if (!open) return null;

  const isEdit = !!editEvent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.summary.trim()) {
      setError("El título es obligatorio");
      return;
    }

    setSaving(true);
    setError("");

    const startDateTime = `${form.startDate}T${form.startTime}:00`;
    const endDateTime = `${form.endDate}T${form.endTime}:00`;

    const payload = {
      summary: form.summary,
      description: form.description || undefined,
      location: form.location || undefined,
      startDateTime,
      endDateTime,
      addMeet: form.addMeet,
      attendees: form.attendees
        ? form.attendees.split(",").map((e) => e.trim())
        : undefined,
    };

    try {
      const url = isEdit ? `/api/calendar/${editEvent!.id}` : "/api/calendar";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Editar evento" : "Nuevo evento"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Título *</label>
            <input
              type="text"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Reunión de equipo"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Fecha inicio</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Hora inicio</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Fecha fin</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Hora fin</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Ubicación</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Sala 3 / https://..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Notas del evento..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Invitados (emails separados por coma)
            </label>
            <input
              type="text"
              value={form.attendees}
              onChange={(e) => setForm({ ...form, attendees: e.target.value })}
              placeholder="maria@email.com, juan@email.com"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 cursor-pointer transition hover:border-zinc-600">
            <input
              type="checkbox"
              checked={form.addMeet}
              onChange={(e) => setForm({ ...form, addMeet: e.target.checked })}
              className="h-4 w-4 rounded accent-blue-500"
            />
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
              <span className="text-sm text-zinc-300">Añadir videollamada de Google Meet</span>
            </div>
          </label>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
