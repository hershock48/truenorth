import Link from "next/link";
import OpenNow from "@/components/OpenNow";
import { uniformDailySpan } from "@/data/shops";
import {
  ORDERING_LIVE,
  formatHour,
  fullAddress,
  mapsEmbedUrl,
  mapsUrl,
  orderHref,
  shopHref,
  type Location,
} from "@/data/site";
import type { Flavor } from "@/data/flavors";

/**
 * A shop card, built to the shape the pjs build proved: the NAME leads, a
 * live status sits beside it, the hours are a real table, and two real
 * buttons close it out. The old version opened with a half-height Google
 * map, which took all the visual weight and made two shops look like two
 * map widgets, the map lives on the shop's own page, where someone who
 * wants directions is already headed.
 *
 * `showMap` puts it back for /contact, where a map IS the point.
 * `scooping` adds a few of what that counter has today, the difference
 * between "here are our addresses" and "here is what you would eat".
 */
export default function MapCard({
  location,
  showMap = false,
  scooping = [],
}: {
  location: Location;
  showMap?: boolean;
  scooping?: Flavor[];
}) {
  const span = uniformDailySpan(location.hours);

  return (
    <div className="lift flex h-full flex-col overflow-hidden rounded-[--radius-panel] border border-ink/10 bg-white">
      {/* A ribbon of the shop's colors, so a card reads as ice cream at a glance. */}
      <div aria-hidden className="h-1.5 w-full bg-gradient-to-r from-scoop via-mint to-north" />

      {showMap ? (
        <iframe
          src={mapsEmbedUrl(location)}
          title={`Map to True North Ice Cream ${location.name}`}
          loading="lazy"
          className="h-56 w-full border-0"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : null}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink">
            {location.name}
          </h3>
          <OpenNow location={location} pill />
        </div>
        <p className="mt-1.5 text-sm text-ink-soft">{location.note}</p>

        {/* Hours as a table, pjs-style. One row while every day matches; the
            moment a day diverges it becomes seven honest rows. */}
        <dl className="mt-4 border-y border-ink/10 py-3 text-sm">
          {span ? (
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-ink-soft">Every day</dt>
              <dd className="font-semibold text-ink">
                {formatHour(span.open)} to {formatHour(span.close)}
              </dd>
            </div>
          ) : (
            location.hours.map((h) => (
              <div key={h.day} className="flex justify-between gap-4 py-0.5">
                <dt className="font-medium text-ink-soft">{h.label}</dt>
                <dd className="font-semibold text-ink">
                  {formatHour(h.open)} to {formatHour(h.close)}
                </dd>
              </div>
            ))
          )}
        </dl>

        <address className="mt-4 text-sm not-italic leading-relaxed text-ink">
          <a
            href={mapsUrl(location)}
            target="_blank"
            rel="noopener noreferrer"
            className="tap font-medium text-north-deep underline-offset-4 hover:underline"
          >
            {fullAddress(location)}
          </a>
          <br />
          <a
            href={location.phoneHref}
            className="tap font-medium text-north-deep underline-offset-4 hover:underline"
          >
            {location.phone}
          </a>
        </address>

        {scooping.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Scooping today
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {scooping.slice(0, 5).map((f, i) => (
                <li
                  key={f.name}
                  className={`rounded-full px-3 py-1 text-sm font-medium text-ink ${
                    ["bg-scoop", "bg-mint/60", "bg-cherry/15", "bg-north/15", "bg-waffle/15"][i % 5]
                  }`}
                >
                  {f.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Buttons, not text links, the pjs card ends on something you press. */}
        <div className="mt-auto flex flex-wrap gap-3 pt-5">
          {ORDERING_LIVE ? (
            <>
              <Link href={orderHref(location)} className="btn-primary !px-5 !py-2.5 text-sm">
                Order from {location.name}
              </Link>
              <Link href={shopHref(location)} className="btn-secondary !px-5 !py-2.5 text-sm">
                Details
              </Link>
            </>
          ) : (
            <>
              <Link href={shopHref(location)} className="btn-primary !px-5 !py-2.5 text-sm">
                The {location.name} shop
              </Link>
              <a href={location.phoneHref} className="btn-secondary !px-5 !py-2.5 text-sm">
                Call
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
