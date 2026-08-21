import type { Metadata } from "next";
import Link from "next/link";
import FlavorBoardCard from "@/components/FlavorBoardCard";
import MeltEdge from "@/components/MeltEdge";
import MenuSectionCard from "@/components/MenuSectionCard";
import OpenNow from "@/components/OpenNow";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { boardsFor, boardUpdatedLabel } from "@/data/flavors";
import { menuFor } from "@/data/menu";
import { uniformDailySpan } from "@/data/shops";
import {
  formatHour,
  fullAddress,
  locations,
  mapsEmbedUrl,
  mapsUrl,
  orderHref,
  shopAnchors,
  shopHref,
  site,
  type Location,
} from "@/data/site";

/**
 * One shop's page — the destination the rest of the site steers people into,
 * pjs-style. The two routes (/marshall, /battle-creek) are thin wrappers
 * around this so a fact correction stays a one-place edit in site.ts. The
 * pages exist because the shops genuinely differ — hours and what's behind
 * the counter — so each carries its own hours, its own menu (menuFor), and
 * its own order-ahead entry point.
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
  const shopMenu = menuFor(location.key);
  const shopBoards = boardsFor(location.key);
  const span = uniformDailySpan(location.hours);

  return (
    <>
      <PageHero
        kicker="Our shops"
        title={`The ${location.name} shop`}
        lede={`${location.note} ${location.offerings}`}
      />

      <section className="mx-auto max-w-6xl px-5 pb-16">
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
                {/* One line only while every day truly shares one span. */}
                {span ? (
                  <p className="mt-2 text-ink">
                    {formatHour(span.open)} to {formatHour(span.close)}, Sunday through Saturday.
                  </p>
                ) : (
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-ink">
                    {location.hours.map((h) => (
                      <div key={h.day} className="contents">
                        <dt className="font-medium">{h.label}</dt>
                        <dd>
                          {formatHour(h.open)} to {formatHour(h.close)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                <div className="mt-3">
                  <OpenNow location={location} />
                </div>
                <p className="mt-4 text-sm text-ink-soft">
                  The {other.name} shop keeps its own hours:{" "}
                  <Link
                    href={shopHref(other)}
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

            <Reveal delay={180}>
              <div className="rounded-[--radius-panel] bg-north-deep p-6 text-cream">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                  Order ahead from {location.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-cream/85">
                  Pints, quarts, sandwiches, cakes, and pies, ready at this
                  counter when you are. Pay when you pick up.
                </p>
                <Link
                  href={orderHref(location)}
                  className="btn-primary mt-4 inline-flex bg-cream !text-north-deep"
                >
                  Start a pickup order
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/*
        This shop's board. The copy claims the rotation, not the day's case —
        the case genuinely changes daily and the per-flavor split waits on the
        owners' real lists (flavors.ts), so the honest promise is "this is
        what this counter scoops from, call to confirm today."
      */}
      <section id={shopAnchors.case} className="anchor-offset bg-north-deep text-cream">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
              The {location.name} board
            </h2>
            <p className="mt-2 max-w-2xl text-cream/85">
              Everything this counter scoops comes off this rotation, and the
              case changes daily — board last updated {boardUpdatedLabel}.
              Chasing a favorite? Call{" "}
              <a href={location.phoneHref} className="tap font-semibold text-cream underline-offset-4 hover:underline">
                {location.phone}
              </a>{" "}
              and we will tell you if it is in today.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {shopBoards.map((board, i) => (
              <Reveal key={board.key} delay={(i % 2) * 80}>
                <FlavorBoardCard board={board} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      {/* The signature melt closes the teal band, exactly as on the homepage. */}
      <MeltEdge color="var(--color-north-deep)" />

      {/* This shop's menu, exactly as its counter serves it. */}
      <section id={shopAnchors.menu} className="anchor-offset bg-cream-dim">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-ink md:text-4xl">
              What the {location.name} counter serves
            </h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              This is {location.name}&apos;s own board. The{" "}
              <Link
                href="/menu"
                className="tap font-medium text-north-deep underline-offset-4 hover:underline"
              >
                full menu
              </Link>{" "}
              shows both shops side by side.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {shopMenu.map((section, i) => (
              <Reveal key={section.key} delay={(i % 2) * 80}>
                <MenuSectionCard section={section} />
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[--radius-panel] bg-white px-6 py-6 md:px-8">
              <p className="text-lg font-medium text-ink">
                Want it waiting for you? Pints, quarts, cakes, and pies, ready
                at this counter.
              </p>
              <Link href={orderHref(location)} className="btn-primary">
                Order from {location.name}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
