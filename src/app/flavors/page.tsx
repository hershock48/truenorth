import type { Metadata } from "next";
import Link from "next/link";
import FlavorBadge from "@/components/FlavorBadge";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { boards, boardUpdated } from "@/data/flavors";

export const metadata: Metadata = {
  title: "Flavors",
  description:
    "What's in the case today at True North Ice Cream: hand-scooped flavors, soft serve, dairy-free scoops and sorbets, and 21+ adult flavors. Updated as the case changes.",
  alternates: { canonical: "/flavors" },
};

const updatedLabel = new Date(boardUpdated + "T12:00:00").toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export default function FlavorsPage() {
  return (
    <>
      <PageHero
        kicker="The board"
        title="In the case today"
        lede={`The case rotates through about forty-five flavors a month, so this board changes often. Last updated ${updatedLabel}. If you are chasing a favorite, call ahead and we will tell you if it is scooping.`}
      />

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-8 md:grid-cols-2">
          {boards.map((board, i) => (
            <Reveal key={board.key} delay={(i % 2) * 80}>
              <section
                aria-labelledby={`board-${board.key}`}
                className="h-full rounded-[--radius-panel] border border-ink/10 bg-white p-6 md:p-8"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2
                    id={`board-${board.key}`}
                    className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink"
                  >
                    {board.title}
                  </h2>
                  <p className="text-sm font-medium text-ink-soft">{board.subtitle}</p>
                </div>
                <ul className="mt-5 divide-y divide-ink/5">
                  {board.flavors.map((f) => (
                    <li key={`${board.key}-${f.name}`} className="flex items-center justify-between gap-3 py-2.5">
                      <div>
                        <span className="font-medium text-ink">{f.name}</span>
                        {f.note ? <p className="text-sm text-ink-soft">{f.note}</p> : null}
                      </div>
                      {f.allergens?.length ? (
                        <span className="flex gap-1.5">
                          {f.allergens.map((a) => (
                            <FlavorBadge key={a} allergen={a} />
                          ))}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
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
              Want a flavor made for your event or a custom cake?{" "}
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
