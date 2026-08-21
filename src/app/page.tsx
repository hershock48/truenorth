import Image from "next/image";
import Link from "next/link";
import AnimatedLogo from "@/components/AnimatedLogo";
import CompassRose from "@/components/CompassRose";
import MapCard from "@/components/MapCard";
import MeltEdge from "@/components/MeltEdge";
import OpenNow from "@/components/OpenNow";
import Reveal from "@/components/Reveal";
import { caseAll } from "@/data/liveCase";
import { locations, shopCaseHref, shopHref } from "@/data/site";

/*
  Copy discipline (glaze.md): "homemade" is their word and their promise, so it
  appears in the hero and nowhere else on this page — once, where it counts.
  Rendered-text repetition was counted, not vibed.
*/

/*
  ISR, because the board can be live (liveCase.ts): the page re-renders in
  the background at most once a minute, which is when the feed fetch runs.
  A plain static page would freeze the build-time board forever — the exact
  trap the /order page shipped with once already.
*/
export const revalidate = 60;

export default async function Home() {
  // Live from Scooplist when the feed is configured, static otherwise.
  const { boards, updatedLabel } = await caseAll();
  // By key, not position — reordering the boards must not change what
  // "In the case today" shows.
  const homemadeBoard = boards.find((b) => b.key === "homemade") ?? boards[0];
  const homemadeCount = homemadeBoard.flavors.length;

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-14 md:grid-cols-[1.1fr_1fr] md:pt-20">
        <div className="hero-in">
          {/*
            The mark, large, with the live needle — the first thing the page
            does is the brand finding north. The header carries the same
            component small; both react to the same scroll, which reads as one
            system rather than a repeat.
          */}
          <AnimatedLogo className="h-16 md:h-24" />
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-north-deep">
            Marshall and Battle Creek, Michigan
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold leading-tight tracking-tight text-ink md:text-6xl">
            Homemade ice cream, made fresh every day.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            Around thirty hand-scooped flavors in the case at a time, churned in
            the shop from real ingredients. No dyes, no stabilizers, nothing you
            would not put in it yourself.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/flavors" className="btn-primary">
              See what&apos;s in the case
            </Link>
            <Link href="/catering" className="btn-secondary">
              Catering and cakes
            </Link>
          </div>
          {/*
            One row per shop — they keep different hours, and each row IS the
            door into that shop's page. Bordered and arrowed so it reads as a
            button, not a status line.
          */}
          <div className="mt-7 grid max-w-md gap-2.5">
            {locations.map((l) => (
              <Link
                key={l.key}
                href={shopHref(l)}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-ink/15 bg-white/70 px-5 py-3 transition-colors hover:border-north-deep hover:bg-white"
              >
                <OpenNow location={l} label={l.name} />
                <span
                  aria-hidden
                  className="font-semibold text-north-deep transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
        <Reveal className="lift overflow-hidden rounded-[--radius-panel]">
          <Image
            src="/photos/flight-trays.jpg"
            alt="Three sampler trays of hand-scooped ice cream on the counter, nine scoops from vanilla to mint chip"
            width={720}
            height={441}
            priority
            className="h-full w-full object-cover"
          />
        </Reveal>
      </section>

      {/* The case today — teal band with the melt below it */}
      <section className="bg-north-deep text-cream">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
                  In the case today
                </h2>
                <p className="mt-2 max-w-xl text-cream/85">
                  The hand-scooped board both counters scoop from, rotating all
                  the time. Last updated {updatedLabel}.
                </p>
              </div>
              <Link
                href="/flavors"
                className="tap font-semibold text-cream underline-offset-4 hover:underline"
              >
                The full board →
              </Link>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <ul className="mt-8 flex flex-wrap gap-2.5">
              {homemadeBoard.flavors.slice(0, 12).map((f) => (
                <li
                  key={f.name}
                  className="rounded-full border border-cream/25 bg-cream/10 px-4 py-2 text-sm font-medium"
                >
                  {f.name}
                </li>
              ))}
              {/* Only when there genuinely are more — a live board can shrink. */}
              {homemadeCount > 12 ? (
                <li>
                  <Link
                    href="/flavors"
                    className="tap inline-flex rounded-full bg-cream px-4 py-2 text-sm font-semibold text-north-deep"
                  >
                    and {homemadeCount - 12} more
                  </Link>
                </li>
              ) : null}
            </ul>
          </Reveal>
          <Reveal delay={140}>
            {/* "Whose case?" gets a one-tap answer, per shop. */}
            <div className="mt-7 flex flex-wrap gap-x-8 gap-y-2">
              {locations.map((l) => (
                <Link
                  key={l.key}
                  href={shopCaseHref(l)}
                  className="tap font-semibold text-cream underline-offset-4 hover:underline"
                >
                  The {l.name} board →
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
      <MeltEdge color="var(--color-north-deep)" />

      {/* Photos + menu teaser */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Reveal className="lift overflow-hidden rounded-[--radius-card]">
            <Image
              src="/photos/waffle-basket.jpg"
              alt="A scoop of chocolate toffee ice cream in a waffle basket"
              width={1024}
              height={767}
              className="h-64 w-full object-cover"
            />
          </Reveal>
          <Reveal delay={80} className="lift overflow-hidden rounded-[--radius-card]">
            <Image
              src="/photos/soft-serve-flights.jpg"
              alt="Soft serve flights with waffle pieces and dipping sauces"
              width={768}
              height={1024}
              className="h-64 w-full object-cover"
            />
          </Reveal>
          <Reveal delay={160} className="lift overflow-hidden rounded-[--radius-card]">
            <Image
              src="/photos/mint-chip.jpg"
              alt="A bowl of mint chip ice cream"
              width={1024}
              height={1014}
              className="h-64 w-full object-cover"
            />
          </Reveal>
        </div>
        <Reveal>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[--radius-panel] bg-cream-dim px-6 py-6 md:px-8">
            <p className="text-lg font-medium text-ink">
              Scoops from $4.75 at both shops, sundaes, splits, shakes, and ice
              cream nachos. Soft serve from $3.75 and a real espresso bar —
              matcha included — at the Marshall counter. Cakes and pies made to
              order.
            </p>
            <Link href="/menu" className="btn-primary">
              Menu and prices
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Locations */}
      <section className="bg-cream-dim">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-ink md:text-4xl">
              Two shops, one freezer full of good ideas
            </h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              Marshall scoops from noon, Battle Creek from 2 — both open every
              day until 9. Each shop keeps its own counter, so see what yours
              does best.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {locations.map((l, i) => (
              <Reveal key={l.key} delay={i * 90}>
                <MapCard location={l} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <MeltEdge color="var(--color-cream-dim)" />

      {/* Catering band */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2">
        <Reveal className="lift order-2 overflow-hidden rounded-[--radius-panel] md:order-1">
          <Image
            src="/photos/lemon-cup.jpg"
            alt="Two scoops of lemon ice cream in a cup on a wooden table"
            width={720}
            height={960}
            className="h-80 w-full object-cover"
          />
        </Reveal>
        <Reveal delay={80} className="order-1 md:order-2">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-ink md:text-4xl">
            We bring the ice cream to you
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Weddings, birthdays, work parties, fundraisers. Scooped fresh for
            groups of any size up to three hundred and beyond, with per-person
            pricing that gets friendlier as the crowd grows. You can rent the
            whole shop, too.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/catering" className="btn-primary">
              Plan an event
            </Link>
            <Link href="/catering#pricing" className="btn-secondary">
              Catering prices
            </Link>
          </div>
        </Reveal>
      </section>

      {/* About teaser */}
      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <Reveal className="needle-settle">
            <CompassRose size={44} className="mx-auto text-north" />
            <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
              Happiness is homemade
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-cream/85">
              True North started in a Marshall kitchen, a couple hundred quarts a
              month for friends and neighbors, and grew into two shops. The
              recipes have not changed: real ingredients, small batches, made
              the day you eat them.
            </p>
            <Link href="/about" className="btn-primary mt-8 inline-flex bg-north-deep">
              Our story
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
