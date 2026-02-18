"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useMemo } from "react";

interface AiAssistantProps {
  onEventChanged: () => void;
}

export function AiAssistant({ onEventChanged }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ai" }),
    []
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
    onFinish: () => onEventChanged(),
  });

  const busy = status === "streaming" || status === "submitted";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || busy) return;
    const text = inputValue;
    setInputValue("");
    await sendMessage({ text });
  };

  const chat = (
    <ChatPanel
      messages={messages}
      inputValue={inputValue}
      setInputValue={setInputValue}
      onSubmit={send}
      busy={busy}
      error={error}
      endRef={endRef}
    />
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:border-l lg:border-border">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-medium text-text-secondary">Asistente</p>
        </div>
        {chat}
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-text shadow-lg transition-transform active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </button>
        )}

        {isOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-bg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-xs font-medium text-text-secondary">Asistente</p>
              <button
                onClick={() => setIsOpen(false)}
                className="text-text-tertiary hover:text-text"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {chat}
          </div>
        )}
      </div>
    </>
  );
}

interface UIPart {
  type: string;
  text?: string;
  toolInvocation?: { toolName: string; state: string };
}

interface Msg {
  id: string;
  role: string;
  parts?: UIPart[];
}

function ChatPanel({
  messages,
  inputValue,
  setInputValue,
  onSubmit,
  busy,
  error,
  endRef,
}: {
  messages: Msg[];
  inputValue: string;
  setInputValue: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  busy: boolean;
  error: Error | undefined;
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  const suggestions = [
    "Reunión mañana a las 10 con Meet",
    "¿Qué tengo esta semana?",
    "Borra mi evento de las 15:00",
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 pt-8">
            <p className="text-xs text-text-tertiary mb-2">Prueba con:</p>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInputValue(s)}
                className="rounded-lg border border-border px-3 py-2 text-left text-xs text-text-secondary transition-colors hover:bg-bg-tertiary"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {messages.map((msg) => {
            const text = msg.parts
              ?.filter((p) => p.type === "text")
              .map((p) => p.text)
              .join("") || "";
            const tools = msg.parts?.filter((p) => p.type === "tool-invocation") || [];

            return (
              <div key={msg.id}>
                {text && (
                  <div
                    className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "ml-6 bg-accent text-accent-text"
                        : "mr-6 bg-bg-tertiary text-text"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{text}</p>
                  </div>
                )}
                {tools.map((t, i) => {
                  if (t.toolInvocation?.state !== "result") return null;
                  const labels: Record<string, string> = {
                    createEvent: "Creado",
                    updateEvent: "Actualizado",
                    deleteEvent: "Eliminado",
                    listEvents: "Consultado",
                  };
                  return (
                    <p key={i} className="mr-6 mt-1 text-[11px] text-success">
                      {labels[t.toolInvocation.toolName] || "OK"}
                    </p>
                  );
                })}
              </div>
            );
          })}

          {busy && (
            <div className="mr-6 flex gap-1 px-3 py-2">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-tertiary [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-tertiary [animation-delay:100ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-tertiary [animation-delay:200ms]" />
            </div>
          )}

          {error && (
            <p className="mr-6 text-xs text-danger">{error.message}</p>
          )}

          <div ref={endRef} />
        </div>
      </div>

      <form onSubmit={onSubmit} className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe algo..."
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !inputValue.trim()}
            className="rounded-lg bg-accent px-3 py-2 text-accent-text transition-colors hover:bg-accent-hover disabled:opacity-30"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
