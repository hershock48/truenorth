import type { Metadata } from "next";
import InquiryForm from "@/components/InquiryForm";
import MapCard from "@/components/MapCard";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { locations, site, hoursSummary } from "@/data/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Find True North Ice Cream at 403 S Kalamazoo Ave in Marshall and 928 W Columbia Ave in Battle Creek, Michigan. Open noon to 9 every day. Call, email, or send a message.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        kicker="Say hello"
        title="Come find us"
        lede={`${hoursSummary}, at both shops. For anything else, send a message and we will get back to you.`}
      />

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          {locations.map((l, i) => (
            <Reveal key={l.key} delay={i * 80}>
              <MapCard location={l} />
            </Reveal>
          ))}
        </div>

        <div className="mt-14 grid items-start gap-10 md:grid-cols-2">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink md:text-3xl">
              Send a message
            </h2>
            <p className="mt-2 text-ink-soft">
              Questions, flavor requests, kind words about the mint chip. Or
              write us directly at{" "}
              <a
                href={`mailto:${site.email}`}
                className="font-medium text-north-deep underline-offset-4 hover:underline"
              >
                {site.email}
              </a>
              .
            </p>
            <p className="mt-4 text-ink-soft">
              Planning an event? The{" "}
              <a
                href="/catering#inquiry"
                className="font-medium text-north-deep underline-offset-4 hover:underline"
              >
                catering form
              </a>{" "}
              asks the right questions.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <InquiryForm variant="contact" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
