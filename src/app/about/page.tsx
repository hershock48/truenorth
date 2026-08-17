import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CompassRose from "@/components/CompassRose";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "True North Ice Cream started in a Marshall, Michigan kitchen in 2021 and grew into shops in Marshall and Battle Creek. Small batches, real ingredients, made fresh daily.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    title: "Made here, daily",
    body: "Every batch is churned in the shop. What you order today was made today or close to it, which is most of why it tastes the way it does.",
  },
  {
    title: "Real ingredients",
    body: "Non-GMO recipes with no added dyes, hormones, or stabilizers. If it would not go in a home kitchen batch, it does not go in ours.",
  },
  {
    title: "Neighbors first",
    body: "Our cases carry collaborations with local makers, like Old Pan Toffee, and we run fundraisers for local organizations all season long.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        kicker="Our story"
        title="Find your way to good ice cream"
        lede="True North started in a Marshall kitchen: a couple hundred quarts a month, made for friends and neighbors, until it was obvious the town wanted a shop."
      />

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal className="lift overflow-hidden rounded-[--radius-panel]">
            <Image
              src="/photos/toffee-cup.jpg"
              alt="A generous scoop of toffee ice cream in a blue striped cup"
              width={662}
              height={960}
              className="h-96 w-full object-cover"
            />
          </Reveal>
          <Reveal delay={80}>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink md:text-3xl">
              From a home kitchen to two shops
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-ink-soft">
              <p>
                We opened the Marshall shop in 2021, on South Kalamazoo Avenue,
                scooping the same recipes that had been coming out of our
                kitchen for years. The line out the door that first summer told
                us we were onto something.
              </p>
              <p>
                {/* PLACEHOLDER: confirm the Battle Creek opening year with the owners. */}
                Battle Creek came next: a second shop on Columbia Avenue. Same
                batches, same standards, shorter drive for half our regulars.
              </p>
              <p>
                The name is the promise: true north is the direction you trust.
                For us that means ice cream made from scratch, priced fairly,
                and served by people who are glad you came in.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 80}>
              <div className="h-full rounded-[--radius-panel] border border-ink/10 bg-white p-6 md:p-8">
                <CompassRose size={26} className="text-north" />
                <h2 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold text-ink">
                  {v.title}
                </h2>
                <p className="mt-3 leading-relaxed text-ink-soft">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-[--radius-panel] bg-cream-dim px-6 py-6 md:px-8">
            <p className="text-lg font-medium text-ink">
              Come see what is in the case. It changes almost daily.
            </p>
            <Link href="/flavors" className="btn-primary">
              Today&apos;s flavors
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
