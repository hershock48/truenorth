import Image from "next/image";
import Link from "next/link";
import SpinningCompass from "@/components/SpinningCompass";
import Sprinkles from "@/components/Sprinkles";
import CompassRose from "@/components/CompassRose";
import MapCard from "@/components/MapCard";
import MeltEdge from "@/components/MeltEdge";
import Reveal from "@/components/Reveal";
import { caseFor } from "@/data/liveCase";
import { locations } from "@/data/site";

/*
  Copy discipline (glaze.md): "homemade" is their word and their promise, so it
  appears in the hero and nowhere else on this page, once, where it counts.
  Rendered-text repetition was counted, not vibed.
*/

/*
  ISR, because the board can be live (liveCase.ts): the page re-renders in
  the background at most once a minute, which is when the feed fetch runs.
  A plain static page would freeze the build-time board forever, the exact
  trap the /order page shipped with once already.
*/
export const revalidate = 60;

export default async function Home() {
  /*
    ONE CASE PER SHOP, never a merged list. The band used to blend both
    shops' hand-scooped boards into one row of chips, so a Battle Creek
    customer read twelve flavors when their counter had one. Each shop now
    gets its own column, named, with its own count and its own link.
  */
  const cases = await Promise.all(
    locations.map(async (l) => {
      const { boards } = await caseFor(l.key);
      const homemade = boards.find((b) => b.key === "handscooped") ?? boards[0];
      return {
        shop: l,
        flavors: homemade?.flavors ?? [],
        total: boards.reduce((n, b) => n + b.flavors.length, 0),
      };
    }),
  );

  return (
    <>
      {/*
        Hero. On a phone this is one centred column with the PHOTO first,
        three problems fixed at once:

          1. Left-aligned copy under a wordmark that nearly fills the width
             read as "off centre", there is no second column on a phone for
             the eye to balance against, so it centres.
          2. The photograph used to land BELOW the shop rows, stranded between
             the hero and the next section, and on a phone it crowded out the
             thing worth leading with. It is desktop-only now.
          3. The mark leads on every width, because the motion IS the brand:
             the needle spins in and settles on north. The sticky header
             carries the same component small; both answer the same scroll.

        Above md nothing changes: two columns, copy left, photo right.
      */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 md:grid-cols-[1.1fr_1fr] md:pt-20">
        <div className="hero-in text-center md:text-left">
          {/*
            THE COMPASS ALONE, not the full lockup. The sticky header carries
            the wordmark on every page, so repeating it here bought nothing,
            and the star is the part that moves, which is the whole idea: it
            wakes a turn off north, rings back to it, and throws sprinkles
            doing it. Their own star from the logo, never a redraw.
          */}
          <SpinningCompass className="mx-auto w-[132px] md:mx-0 md:w-[188px]" />
          {/* Cherry, not teal: the first words after the mark set the page's
              temperature, and teal-on-cream was reading clinical. */}
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cherry-deep md:mt-6">
            Marshall and Battle Creek, Michigan
          </p>
          {/*
            THEIR line, not ours, it is the promise on their own site, and
            Kevin picked it for the hero. The lede underneath carries the
            plain facts a first-time visitor and a search engine need
            ("ice cream", the towns, what is in the case), so the headline is
            free to be the brand rather than a description.
          */}
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl font-bold leading-tight tracking-tight text-ink md:text-7xl">
            Happiness is Homemade.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-soft md:mx-0">
            Ice cream made fresh every day in Marshall and Battle Creek,
            around thirty hand-scooped flavors in the case at a time, churned
            in the shop from real ingredients. No dyes, no stabilizers, nothing
            you would not put in it yourself.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link href="/flavors" className="btn-primary">
              See what&apos;s in the case
            </Link>
            <Link href="/catering" className="btn-secondary">
              Catering and cakes
            </Link>
          </div>
          {/*
            The per-shop status rows used to live here. They came out once the
            shops section moved directly beneath the hero: the same two names,
            the same live open/closed, the same links, a screen apart. The
            cards below say it properly, with hours, addresses and what each
            counter is scooping, so the hero stops repeating them.
          */}
        </div>
        {/* Desktop only: on a phone it pushed the shops below the fold. */}
        <Reveal className="lift hidden overflow-hidden rounded-[--radius-panel] md:block">
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
      {/* The hero sits on the page cream, so the drip is cream, the trap is
          that this MUST be the colour of the band ABOVE it, and it melts onto
          the cream-dim shops section below. */}
      <MeltEdge color="var(--color-cream)" />

      {/* Locations, first after the hero: which shop, before which flavor.
          The band is SCOOP, the warm vanilla sampled from their own photo:
          the old cream-dim was a shade of the same beige as everything
          around it, which is where the "financial advisor" read came from. */}
      <section className="bg-scoop">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <Sprinkles />
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-ink md:text-4xl">
              Two shops, one freezer full of good ideas
            </h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              Marshall scoops from noon, Battle Creek from 2, both open every
              day until 9. Each shop keeps its own counter, so see what yours
              does best.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {cases.map((c, i) => (
              <Reveal key={c.shop.key} delay={i * 90}>
                {/* Each card carries a taste of that counter, not just an address. */}
                <MapCard location={c.shop} scooping={c.flavors} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <MeltEdge color="var(--color-scoop)" />
      {/*
        The "In the case today" band used to sit here. It listed each shop's
        name, count and flavour chips, which is exactly what the two cards
        above now carry, one screen higher. Two answers to one question, back
        to back, so the second one went. /flavors is still a tap away from the
        hero and from each card.
      */}

      {/* Photos + menu teaser */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        {/*
          Two photographs, not three, and the two most COLORFUL ones in the
          set: the green mint chip and the yellow lemon cup. The old pair
          (chocolate in a waffle basket, white soft serve) was handsome and
          beige, and a viewer's "didn't love the photos" tracked exactly
          with the beige. The rest of the set is chocolate-and-vanilla
          toned; the real fix beyond this swap is three bright shots from
          the shop (Blue Moon is BLUE), noted in the README checklist.
        */}
        <div className="grid gap-6 md:grid-cols-2">
          <Reveal className="lift overflow-hidden rounded-[--radius-card]">
            <Image
              src="/photos/mint-chip.jpg"
              alt="A cup piled with green mint chip ice cream"
              width={1024}
              height={1014}
              className="h-64 w-full object-cover md:h-72"
            />
          </Reveal>
          <Reveal delay={80} className="lift overflow-hidden rounded-[--radius-card]">
            <Image
              src="/photos/lemon-cup.jpg"
              alt="Two scoops of bright lemon ice cream in a cup"
              width={720}
              height={960}
              className="h-64 w-full object-cover md:h-72"
            />
          </Reveal>
        </div>
        <Reveal>
          {/* Mint, because the panel sits between two photographs of green
              and yellow ice cream and should join the conversation. */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[--radius-panel] bg-mint-soft px-6 py-6 md:px-8">
            <p className="text-lg font-medium text-ink">
              Scoops from $4.75. Banana splits, sundaes, malts, and ice cream
              nachos, which are exactly what they sound like. The Marshall
              counter adds soft serve from $3.75, real espresso, and matcha.
              Cakes and pies made to order!
            </p>
            <Link href="/menu" className="btn-primary">
              Menu and prices
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Catering band, on blush: the page's bands now go cream, scoop,
          cream, blush, ink, an actual sundae instead of three creams in a
          row. The melt above it must be CREAM (the band above), the melt
          after it blush, the seam rule. */}
      <MeltEdge color="var(--color-cream)" />
      <section className="bg-blush">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2">
        <Reveal className="lift order-2 overflow-hidden rounded-[--radius-panel] md:order-1">
          {/* The toffee cup: the ONE photo in the set with a big block of
              brand-adjacent color in it, the bright blue cup. */}
          <Image
            src="/photos/toffee-cup.jpg"
            alt="A heaping scoop of toffee ice cream in a bright blue cup"
            width={662}
            height={960}
            /* object-bottom: the blue cup IS the color this photo was picked
               for, and it lives in the bottom half; a center crop showed
               beige scoop on a dark background, rendered and seen. */
            className="h-80 w-full object-cover object-bottom"
          />
        </Reveal>
        <Reveal delay={80} className="order-1 md:order-2">
          <Sprinkles />
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
        </div>
      </section>
      <MeltEdge color="var(--color-blush)" />

      {/* About teaser */}
      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <Reveal className="needle-settle">
            <CompassRose size={44} className="mx-auto text-north" />
            <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
              Two shops, one recipe book
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
