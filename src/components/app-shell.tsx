"use client";

import { useState } from "react";
import { CalendarEvents } from "./calendar-events";
import { AiAssistant } from "./ai-assistant";

export function AppShell() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEventChanged = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex flex-1">
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <CalendarEvents refreshKey={refreshKey} />
      </main>
      <AiAssistant onEventChanged={handleEventChanged} />
    </div>
  );
}
