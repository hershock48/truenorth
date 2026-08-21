import type { Metadata } from "next";
import Link from "next/link";
import FlavorBoardCard from "@/components/FlavorBoardCard";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ShopEntryLinks from "@/components/ShopEntryLinks";
import { caseAll } from "@/data/liveCase";
import { locations, shopCaseHref } from "@/data/site";

export const metadata: Metadata = {
  title: "Flavors",
  description:
    "What's in the case today at True North Ice Cream: hand-scooped flavors, soft serve, dairy-free scoops and sorbets, and 21+ adult flavors. Updated as the case changes.",
  alternates: { canonical: "/flavors" },
};

/* ISR so the live board actually goes live — see the note in app/page.tsx. */
export const revalidate = 60;

export default async function FlavorsPage() {
  const { boards, updatedLabel } = await caseAll();

  return (
    <>
      <PageHero
        kicker="The board"
        title="In the case today"
        lede={`The case rotates through about forty-five flavors a month, so this board changes often. Last updated ${updatedLabel}. Anything one shop scoops alone is marked; everything else is at both counters.`}
      />

      <section className="mx-auto max-w-6xl px-5 pb-20">
        {/*
          "Which board is mine?" answered before the boards, not after: one
          tap into either shop's own page, where its board renders filtered.
        */}
        <ShopEntryLinks href={shopCaseHref} label={(l) => `The ${l.name} board`} />

        <div className="grid gap-8 md:grid-cols-2">
          {boards.map((board, i) => (
            <Reveal key={board.key} delay={(i % 2) * 80}>
              <FlavorBoardCard board={board} showShopTags />
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
              Chasing a favorite? Call your shop and we will tell you if it is
              scooping:{" "}
              {locations.map((l, i) => (
                <span key={l.key}>
                  {i > 0 ? " · " : ""}
                  {l.name}{" "}
                  <a
                    href={l.phoneHref}
                    className="font-medium text-north-deep underline-offset-4 hover:underline"
                  >
                    {l.phone}
                  </a>
                </span>
              ))}
              . Want a flavor made for your event or a custom cake?{" "}
              <Link href="/catering" className="font-medium text-north-deep underline-offset-4 hover:underline">
                We do special orders.
              </Link>
            </p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
