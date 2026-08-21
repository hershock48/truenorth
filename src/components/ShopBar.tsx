"use client";

import Link from "next/link";
import { StatusDot, useOpenState } from "@/components/OpenNow";
import { formatHour, locations, type Location } from "@/data/site";

/**
 * The strip above the nav that puts both shops one tap away from every page —
 * the pjs pattern. Each entry is the live dot, the shop's name, and today's
 * hours, linking to the shop's own page. It renders inside <header>, so the
 * measured --header-h keeps anchor offsets honest without extra wiring.
 */
function ShopEntry({ location }: { location: Location }) {
  const state = useOpenState(location.hours);
  const today = location.hours[0];

  return (
    <Link
      href={`/${location.slug}`}
      className="tap inline-flex items-center gap-2 font-medium text-cream/90 underline-offset-4 hover:text-cream hover:underline"
    >
      {/* Static dot until mounted, so no-JS visitors still get the hours. */}
      {state ? <StatusDot open={state.open} /> : <span className="inline-flex h-2 w-2 rounded-full bg-cream/40" />}
      <span className="font-semibold text-cream">{location.name}</span>
      <span>
        {formatHour(today.open)}–{formatHour(today.close)}
      </span>
    </Link>
  );
}

export default function ShopBar() {
  return (
    <div className="bg-ink text-xs md:text-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-5 py-1.5 md:justify-between">
        <p className="hidden font-medium text-cream/70 md:block">Two shops, every day:</p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          {locations.map((l) => (
            <ShopEntry key={l.key} location={l} />
          ))}
        </div>
      </div>
    </div>
  );
}
