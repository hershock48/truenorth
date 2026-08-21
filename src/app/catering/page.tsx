import type { Metadata } from "next";
import Image from "next/image";
import InquiryForm from "@/components/InquiryForm";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { cateringTiers } from "@/data/menu";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Catering and Events",
  description:
    "Ice cream catering for weddings, birthdays, and company events across Marshall, Battle Creek, and south-central Michigan. Custom cakes and special orders, or rent the whole shop.",
  alternates: { canonical: "/catering" },
};

const offerings = [
  {
    title: "Events and catering",
    body: "We scoop at weddings, birthdays, graduations, and company parties. Fresh flavors, real toppings, and enough of both that nobody has to be polite about seconds.",
  },
  {
    title: "Cakes and special orders",
    body: "Ice cream cakes and pies made to order, custom flavors included. Tell us the occasion and the flavors you love and we will build it.",
  },
  {
    title: "Rent the shop",
    body: "Birthday party, ice cream social, fundraiser: take the whole place over and we will staff the counter while you host.",
  },
];

export default function CateringPage() {
  return (
    <>
      <PageHero
        kicker="Bring us along"
        title="Catering and events"
        lede="From backyard birthdays to three hundred people and up. Tell us about the day and we will handle the dessert."
      />

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {offerings.map((o, i) => (
            <Reveal key={o.title} delay={i * 80}>
              <div className="lift h-full rounded-[--radius-panel] border border-ink/10 bg-white p-6 md:p-8">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-ink">
                  {o.title}
                </h2>
                <p className="mt-3 leading-relaxed text-ink-soft">{o.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-14 grid items-start gap-10 md:grid-cols-[1fr_1.1fr]">
          {/* min-w-0: otherwise min-width:auto lets the table widen the column past the viewport */}
          <div className="min-w-0">
            <Reveal>
              <h2
                id="pricing"
                className="anchor-offset font-[family-name:var(--font-display)] text-2xl font-bold text-ink md:text-3xl"
              >
                Per-person pricing
              </h2>
              <p className="mt-2 max-w-md text-ink-soft">
                The bigger the crowd, the friendlier the number. Sandwiches are
                our ice cream sandwiches, not the deli kind.
              </p>
            </Reveal>
            <Reveal delay={80}>
              {/* overflow-x-auto, not hidden: four columns cannot fit 320px, and a
                  table you can scroll beats a page that grows a horizontal bar.
                  tabIndex + role make the scroll region reachable by keyboard,
                  or the phone-width price columns are mouse-only. */}
              <div
                tabIndex={0}
                role="region"
                aria-label="Catering prices"
                className="mt-6 overflow-x-auto rounded-[--radius-panel] border border-ink/10 bg-white"
              >
                <table className="w-full min-w-[430px] text-left text-sm">
                  <caption className="sr-only">
                    Catering prices per person by guest count
                  </caption>
                  <thead>
                    <tr className="bg-cream-dim text-ink">
                      <th scope="col" className="px-4 py-3 font-semibold">Guests</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Hand-scooped</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Soft serve</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Sandwiches</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {cateringTiers.map((t) => (
                      <tr key={t.guests}>
                        <th scope="row" className="px-4 py-3 font-medium text-ink">
                          {t.guests}
                        </th>
                        <td className="px-4 py-3 text-ink-soft">{t.homemade}</td>
                        <td className="px-4 py-3 text-ink-soft">{t.softServe}</td>
                        <td className="px-4 py-3 text-ink-soft">{t.sandwiches}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
            <Reveal delay={140}>
              <div className="lift mt-6 overflow-hidden rounded-[--radius-panel]">
                <Image
                  src="/photos/soft-serve-flights.jpg"
                  alt="Soft serve flights with dipping sauces, ready for an event"
                  width={768}
                  height={1024}
                  className="h-64 w-full object-cover"
                />
              </div>
            </Reveal>
          </div>

          <div className="min-w-0">
            <Reveal>
              <h2
                id="inquiry"
                className="anchor-offset font-[family-name:var(--font-display)] text-2xl font-bold text-ink md:text-3xl"
              >
                Start the conversation
              </h2>
              <p className="mt-2 text-ink-soft">
                A few details and we will get back to you with a plan. Or skip
                the form: call{" "}
                <a
                  href={site.cateringPhoneHref}
                  className="font-medium text-north-deep underline-offset-4 hover:underline"
                >
                  {site.cateringPhone}
                </a>{" "}
                or email{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="font-medium text-north-deep underline-offset-4 hover:underline"
                >
                  {site.email}
                </a>
                .
              </p>
            </Reveal>
            <Reveal delay={80}>
              <div className="mt-6">
                <InquiryForm variant="catering" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
