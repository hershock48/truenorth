import type { Metadata } from "next";
import Link from "next/link";
import MenuSectionCard from "@/components/MenuSectionCard";
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
        lede="Scoops come as minis for the undecided, larges for the committed, and pints and quarts for the freezer at home. Most of it is at both shops; anything one counter does alone is marked."
      />

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-8 md:grid-cols-2">
          {menu.map((section, i) => (
            <Reveal key={section.key} delay={(i % 2) * 80}>
              <MenuSectionCard section={section} showShopTags />
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
