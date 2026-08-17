import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { menu } from "@/data/menu";

export const metadata: Metadata = {
  title: "Menu and Prices",
  description:
    "The full True North Ice Cream menu: hand-scooped bowls and cones, soft serve, sundaes, banana splits, shakes, malts, affogato, ice cream cakes and pies, coffee and more.",
  alternates: { canonical: "/menu" },
};

export default function MenuPage() {
  return (
    <>
      <PageHero
        kicker="The menu"
        title="Menu and prices"
        lede="Scoops come as minis for the undecided, larges for the committed, and pints and quarts for the freezer at home."
      />

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-8 md:grid-cols-2">
          {menu.map((section, i) => (
            <Reveal key={section.key} delay={(i % 2) * 80}>
              <section
                aria-labelledby={`menu-${section.key}`}
                className="h-full rounded-[--radius-panel] border border-ink/10 bg-white p-6 md:p-8"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2
                    id={`menu-${section.key}`}
                    className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink"
                  >
                    {section.title}
                  </h2>
                  {section.subtitle ? (
                    <p className="text-sm font-medium text-ink-soft">{section.subtitle}</p>
                  ) : null}
                </div>
                <ul className="mt-5 divide-y divide-ink/5">
                  {section.items.map((item) => (
                    <li key={item.name} className="flex items-baseline justify-between gap-4 py-2.5">
                      <div>
                        <span className="font-medium text-ink">{item.name}</span>
                        {item.note ? <p className="text-sm text-ink-soft">{item.note}</p> : null}
                      </div>
                      <span className="whitespace-nowrap font-semibold text-north-deep">{item.price}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[--radius-panel] bg-cream-dim px-6 py-6 md:px-8">
            <p className="text-lg font-medium text-ink">
              Feeding a crowd? Catering runs as low as $2.75 a person.
            </p>
            <Link href="/catering" className="btn-primary">
              Catering and events
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
