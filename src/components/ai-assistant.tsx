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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ai" }),
    []
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
    onFinish: () => {
      onEventChanged();
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue;
    setInputValue("");
    await sendMessage({ text });
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-[380px] lg:flex-col lg:border-l lg:border-zinc-800 lg:bg-zinc-900/50">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold">Asistente AI</h2>
        </div>
        <ChatContent
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {/* Mobile floating button + full-screen panel */}
      <div className="lg:hidden">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/25 transition hover:scale-105 active:scale-95"
          >
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </button>
        )}

        {isOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold">Asistente AI</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ChatContent
              messages={messages}
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              messagesEndRef={messagesEndRef}
            />
          </div>
        )}
      </div>
    </>
  );
}

interface UIMessagePart {
  type: string;
  text?: string;
  toolInvocation?: {
    toolName: string;
    state: string;
  };
}

interface ChatMessageType {
  id: string;
  role: string;
  parts?: UIMessagePart[];
}

function ChatContent({
  messages,
  inputValue,
  setInputValue,
  handleSubmit,
  isLoading,
  error,
  messagesEndRef,
}: {
  messages: ChatMessageType[];
  inputValue: string;
  setInputValue: (v: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: Error | undefined;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 pt-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800">
              <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300">Dime qué necesitas</p>
              <p className="mt-1 text-xs text-zinc-500">
                Puedo crear, editar y eliminar eventos usando lenguaje natural
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2 w-full">
              {[
                "Crea una reunión mañana a las 10 con Meet",
                "¿Qué tengo para esta semana?",
                "Elimina mi evento de las 15:00",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInputValue(suggestion)}
                  className="rounded-xl border border-zinc-800 bg-zinc-800/50 px-3 py-2 text-left text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {messages.map((message) => {
            const textParts = message.parts?.filter((p) => p.type === "text") || [];
            const toolParts = message.parts?.filter((p) => p.type === "tool-invocation") || [];
            const textContent = textParts.map((p) => p.text).join("");

            return (
              <div key={message.id}>
                {textContent && (
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "ml-8 bg-blue-600 text-white"
                        : "mr-8 bg-zinc-800 text-zinc-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{textContent}</p>
                  </div>
                )}
                {toolParts.map((part, i) => {
                  const inv = part.toolInvocation;
                  if (!inv || inv.state !== "result") return null;
                  return (
                    <div
                      key={i}
                      className="mr-8 mt-1 rounded-xl border border-zinc-700/50 bg-zinc-800/30 px-3 py-2 text-xs text-zinc-400"
                    >
                      <span className="font-medium text-emerald-400">
                        {inv.toolName === "createEvent" && "Evento creado"}
                        {inv.toolName === "updateEvent" && "Evento actualizado"}
                        {inv.toolName === "deleteEvent" && "Evento eliminado"}
                        {inv.toolName === "listEvents" && "Eventos consultados"}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {isLoading && (
            <div className="mr-8 flex gap-1.5 rounded-2xl bg-zinc-800 px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
            </div>
          )}

          {error && (
            <div className="mr-8 rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-sm text-red-400">
              Error: {error.message}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-4">
        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ej: Crea un evento mañana a las 15:00..."
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
