import type { Metadata } from "next";
import Link from "next/link";
import OpenNow from "@/components/OpenNow";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import {
  formatHour,
  fullAddress,
  locations,
  mapsEmbedUrl,
  mapsUrl,
  site,
  type Location,
} from "@/data/site";

/**
 * One shop's page. The two routes (/marshall, /battle-creek) are thin wrappers
 * around this so a fact correction stays a one-place edit in site.ts. The
 * pages exist because the shops genuinely differ — hours and what's behind
 * the counter — and because "ice cream <city> MI" deserves a page that
 * answers for that city specifically.
 */

export function locationMetadata(l: Location): Metadata {
  return {
    title: `${l.name} Shop`,
    description: `True North Ice Cream in ${l.city}, MI — ${l.hoursSummary.toLowerCase()} at ${fullAddress(l)}. ${l.offerings}`,
    alternates: { canonical: `/${l.slug}` },
  };
}

export default function LocationPage({ location }: { location: Location }) {
  const other = locations.find((l) => l.key !== location.key)!;

  return (
    <>
      <PageHero
        kicker="Our shops"
        title={`The ${location.name} shop`}
        lede={location.note}
      />

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid items-start gap-6 md:grid-cols-[1.1fr_1fr]">
          <Reveal className="lift overflow-hidden rounded-[--radius-panel] border border-ink/10">
            <iframe
              src={mapsEmbedUrl(location)}
              title={`Map to ${site.name} ${location.name}`}
              loading="lazy"
              className="h-72 w-full border-0 md:h-full md:min-h-96"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Reveal>

          <div className="grid gap-6">
            <Reveal delay={60}>
              <div className="rounded-[--radius-panel] border border-ink/10 bg-white p-6">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
                  Hours
                </h2>
                <p className="mt-2 text-ink">
                  {formatHour(location.hours[0].open)} to {formatHour(location.hours[0].close)},
                  Sunday through Saturday.
                </p>
                <div className="mt-3">
                  <OpenNow location={location} />
                </div>
                <p className="mt-4 text-sm text-ink-soft">
                  The {other.name} shop keeps its own hours:{" "}
                  <Link
                    href={`/${other.slug}`}
                    className="tap font-medium text-north-deep underline-offset-4 hover:underline"
                  >
                    {other.hoursSummary.toLowerCase()} →
                  </Link>
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-[--radius-panel] border border-ink/10 bg-white p-6">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
                  Find us
                </h2>
                <address className="mt-2 text-sm not-italic leading-relaxed text-ink">
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
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={mapsUrl(location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm"
                  >
                    Directions
                  </a>
                  <a href={location.phoneHref} className="btn-secondary text-sm">
                    Call the shop
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal>
          <div className="mt-10 rounded-[--radius-panel] bg-cream-dim px-6 py-6 md:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
              Behind this counter
            </h2>
            <p className="mt-2 max-w-3xl text-ink-soft">{location.offerings}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/flavors" className="btn-primary text-sm">
                What&apos;s in the case
              </Link>
              <Link href="/menu" className="btn-secondary text-sm">
                Menu and prices
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
