import type { Metadata } from "next";
import Link from "next/link";
import FlavorBoardCard from "@/components/FlavorBoardCard";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { caseFor } from "@/data/liveCase";
import { locations, locationBySlug, orderHref, shopHref } from "@/data/site";

export const metadata: Metadata = {
  title: "Flavors",
  description:
    "What's in the case today at True North Ice Cream, shop by shop: hand-scooped flavors, soft serve, dairy-free scoops and sorbets, and 21+ adult flavors.",
  alternates: { canonical: "/flavors" },
};

/* ISR so the live board actually goes live — see the note in app/page.tsx. */
export const revalidate = 60;

/*
  ONE SHOP AT A TIME, ALWAYS.

  This page used to merge both cases into a single list with "{Shop} only"
  chips, and it was the site's worst screen: you could not tell whose case
  you were reading, and the honest answer — "some of these, at one of our
  two shops" — is useless to someone deciding where to drive. Worse, it
  was actively misleading: Battle Creek scoops one hand-scooped flavor
  today, and the merged page showed twelve.

  So there is no merged view. Pick a shop; see that shop's case; every
  heading says which shop it is.
*/
export default async function FlavorsPage({
  searchParams,
}: {
  searchParams: Promise<{ at?: string }>;
}) {
  const { at } = await searchParams;
  const shop = locationBySlug(at ?? "") ?? locations[0];
  const { boards, updatedLabel } = await caseFor(shop.key);
  const count = boards.reduce((n, b) => n + b.flavors.length, 0);

  return (
    <>
      <PageHero
        kicker="The board"
        title={`In the ${shop.name} case`}
        lede={`${count} flavors scooping at our ${shop.name} shop right now — the case changes daily, and this list follows it. Last updated ${updatedLabel}.`}
      />

      <section className="mx-auto max-w-6xl px-5 pb-20">
        {/* The shop is the first decision, and it is never implied. */}
        <Reveal>
          <div
            role="tablist"
            aria-label="Choose a shop"
            className="mb-8 flex flex-wrap gap-3"
          >
            {locations.map((l) => {
              const current = l.key === shop.key;
              return (
                <Link
                  key={l.key}
                  href={`/flavors?at=${l.slug}`}
                  role="tab"
                  aria-selected={current}
                  className={`tap rounded-full px-6 py-3 font-semibold transition-colors ${
                    current
                      ? "bg-north-deep text-cream"
                      : "border border-ink/20 text-ink hover:border-north-deep hover:text-north-deep"
                  }`}
                >
                  {l.name}
                </Link>
              );
            })}
          </div>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-2">
          {boards.map((board, i) => (
            <Reveal key={board.key} delay={(i % 2) * 80}>
              <FlavorBoardCard board={board} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 rounded-[--radius-panel] bg-cream-dim px-6 py-6 md:px-8">
            <p className="text-ink">
              <span className="font-semibold">N</span> contains nuts ·{" "}
              <span className="font-semibold">G</span> contains gluten. Adult flavors are 21 and up,
              ID at the counter. Everything is made without added dyes, hormones, or stabilizers.
            </p>
            <p className="mt-3 text-ink-soft">
              Chasing a favorite? Call {shop.name} at{" "}
              <a
                href={shop.phoneHref}
                className="font-medium text-north-deep underline-offset-4 hover:underline"
              >
                {shop.phone}
              </a>{" "}
              and we will tell you if it is in today.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={orderHref(shop)} className="btn-primary text-sm">
                Order from {shop.name}
              </Link>
              <Link href={shopHref(shop)} className="btn-secondary text-sm">
                The {shop.name} shop
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
