import CompassRose from "@/components/CompassRose";
import Reveal from "@/components/Reveal";

/** Standard interior-page opener: kicker, title, lede, on cream. */
export default function PageHero({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede?: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-10 pt-14 md:pt-20">
      <Reveal>
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-north-deep">
          <CompassRose size={20} className="text-north" />
          {kicker}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-ink md:text-5xl">
          {title}
        </h1>
        {lede ? <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{lede}</p> : null}
      </Reveal>
    </section>
  );
}
