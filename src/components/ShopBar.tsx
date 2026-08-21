"use client";

import Link from "next/link";
import { StatusDot, useOpenState } from "@/components/OpenNow";
import { uniformDailySpan } from "@/data/shops";
import { formatHour, locations, shopHref, type Location } from "@/data/site";

/**
 * The strip above the nav that puts both shops one tap away from every page —
 * the pjs pattern. Each entry is a real, visible BUTTON (border, hover fill,
 * arrow), not bare text: a first-time visitor has to see that their shop is
 * clickable, or the strip is decoration. Links to the shop's own page. It
 * renders inside <header>, so the measured --header-h keeps anchor offsets
 * honest without extra wiring.
 */
function ShopEntry({ location }: { location: Location }) {
  const state = useOpenState(location.hours);
  /*
    One span for the whole week ONLY while every day genuinely shares it —
    uniformDailySpan goes null the moment any day diverges, and we fall back
    to the wordy summary rather than crown Sunday's hours as everyone's.
  */
  const span = uniformDailySpan(location.hours);

  return (
    <Link
      href={shopHref(location)}
      /* min-h-11 = 44px, the repo's own touch-target floor (globals .tap). */
      className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-cream/30 px-3.5 py-1 text-cream/90 transition-colors hover:border-cream/70 hover:bg-cream/10 hover:text-cream focus-visible:border-cream"
    >
      {/* Static dot until mounted, so no-JS visitors still get the hours. */}
      {state ? <StatusDot open={state.open} /> : <span className="inline-flex h-2 w-2 rounded-full bg-cream/40" />}
      {/* The dot is color-only; say it in words for screen readers. */}
      {state ? <span className="sr-only">{state.open ? "open now," : "closed now,"}</span> : null}
      <span className="font-semibold text-cream">{location.name}</span>
      <span className="font-medium">
        {span ? `${formatHour(span.open)}–${formatHour(span.close)}` : location.hoursSummary}
      </span>
      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}

export default function ShopBar() {
  return (
    <div className="bg-ink text-xs md:text-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-5 py-2 md:justify-between md:gap-x-6">
        <p className="hidden font-medium text-cream/70 md:block">Pick your shop:</p>
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {locations.map((l) => (
            <ShopEntry key={l.key} location={l} />
          ))}
        </div>
      </div>
    </div>
  );
}
