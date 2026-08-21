"use client";

import { useEffect, useState } from "react";
import { formatHour, type Location } from "@/data/site";

/**
 * Live open/closed state for ONE shop, computed in America/Detroit so it is
 * correct for a visitor in any timezone. The two shops keep different hours
 * (Marshall from noon, Battle Creek from 2), so there is deliberately no
 * location-less version of this badge — every caller says which shop it means.
 * Renders nothing until mounted to avoid a hydration mismatch between server
 * and client clocks.
 */
export default function OpenNow({
  location,
  label,
  tone = "dark",
}: {
  location: Location;
  /** Optional prefix, e.g. the shop name when two badges sit together. */
  label?: string;
  tone?: "dark" | "light";
}) {
  const [state, setState] = useState<{ open: boolean; text: string } | null>(null);
  const { hours } = location;

  useEffect(() => {
    function compute() {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Detroit",
        weekday: "short",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      }).formatToParts(new Date());

      const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
      const dayMap: Record<string, number> = {
        Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
      };
      const day = dayMap[get("weekday")] ?? 0;
      const now = Number(get("hour")) + Number(get("minute")) / 60;

      const today = hours.find((h) => h.day === day);
      if (today && now >= today.open && now < today.close) {
        setState({ open: true, text: `Open now until ${formatHour(today.close)}` });
        return;
      }

      // Find the next opening, scanning forward up to a week.
      for (let i = 0; i < 8; i++) {
        const d = (day + i) % 7;
        const slot = hours.find((h) => h.day === d);
        if (!slot) continue;
        if (i === 0 && now >= slot.open) continue;
        const when =
          i === 0
            ? `today at ${formatHour(slot.open)}`
            : i === 1
              ? `tomorrow at ${formatHour(slot.open)}`
              : `${slot.label} at ${formatHour(slot.open)}`;
        setState({ open: false, text: `Closed. Opens ${when}` });
        return;
      }
    }

    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, [hours]);

  if (!state) {
    return <span className="inline-block h-5 w-40" aria-hidden />;
  }

  const dot = state.open ? "bg-emerald-500" : "bg-cherry";
  const text = tone === "light" ? "text-cream/80" : "text-ink/70";

  return (
    <span className={`inline-flex items-center gap-2 text-sm font-medium ${text}`}>
      <span className={`relative flex h-2 w-2`}>
        {state.open && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-60`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      {label ? (
        <>
          <span className={tone === "light" ? "font-semibold text-cream" : "font-semibold text-ink"}>
            {label}
          </span>
          <span aria-hidden>·</span>
        </>
      ) : null}
      {state.text}
    </span>
  );
}
