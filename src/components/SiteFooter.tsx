import Image from "next/image";
import Link from "next/link";
import GlazedPlate from "@/components/GlazedPlate";
import { site, locations, fullAddress, mapsUrl } from "@/data/site";

export default function SiteFooter() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          {/*
            The flat-teal logo measures 3.08 against this ink footer — enough
            for a large graphic (3:1) but tight. The cream wordmark below it
            carries the name legibly; the logo is presence, not the only label.
          */}
          <Image
            src="/brand/logo.png"
            alt=""
            width={878}
            height={185}
            className="h-8 w-auto opacity-90"
          />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/80">
            Homemade ice cream, made fresh in our shops. Open noon to 9pm, every day.
          </p>
        </div>

        {locations.map((l) => (
          <div key={l.key}>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              {l.name}
            </h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-cream/80">
              <a
                href={mapsUrl(l)}
                target="_blank"
                rel="noopener noreferrer"
                className="tap underline-offset-4 hover:underline"
              >
                {fullAddress(l)}
              </a>
              <br />
              <a href={l.phoneHref} className="tap underline-offset-4 hover:underline">
                {l.phone}
              </a>
            </address>
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-cream/15 px-5 py-6 text-sm text-cream/70">
        <p>
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </p>
        <div className="flex gap-5">
          <a
            href={site.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="tap hover:text-cream"
          >
            Facebook
          </a>
          <Link href="/contact" className="tap hover:text-cream">
            Contact
          </Link>
        </div>
      </div>

      {/* Concept build wording until they buy it — glaze.md, the studio credit. */}
      <GlazedPlate line="Concept build by" />
    </footer>
  );
}
