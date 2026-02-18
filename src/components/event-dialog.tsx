"use client";

import { useState, useEffect } from "react";

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

interface EventData {
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

export function EventDialog({ open, onClose, onSaved, editEvent }: EventDialogProps) {
  const [form, setForm] = useState<EventData>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editEvent) {
      setForm({
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
      setError("Título requerido");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      summary: form.summary,
      description: form.description || undefined,
      location: form.location || undefined,
      startDateTime: `${form.startDate}T${form.startTime}:00`,
      endDateTime: `${form.endDate}T${form.endTime}:00`,
      addMeet: form.addMeet,
      attendees: form.attendees ? form.attendees.split(",").map((e) => e.trim()) : undefined,
    };

    try {
      const url = isEdit ? `/api/calendar/${editEvent!.id}` : "/api/calendar";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error");
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-bg-secondary shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-sm font-medium text-text">
            {isEdit ? "Editar" : "Nuevo evento"}
          </p>
          <button onClick={onClose} className="text-text-tertiary hover:text-text">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-5">
          <input
            type="text"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="Título"
            className={inputClass}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} />
            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} />
            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={inputClass} />
          </div>

          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Ubicación"
            className={inputClass}
          />

          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            placeholder="Notas"
            className={`${inputClass} resize-none`}
          />

          <input
            type="text"
            value={form.attendees}
            onChange={(e) => setForm({ ...form, attendees: e.target.value })}
            placeholder="Invitados (emails separados por coma)"
            className={inputClass}
          />

          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={form.addMeet}
              onChange={(e) => setForm({ ...form, addMeet: e.target.checked })}
              className="h-3.5 w-3.5 rounded accent-accent"
            />
            <span className="text-xs text-text-secondary">Añadir Google Meet</span>
          </label>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-text transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? "..." : isEdit ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
