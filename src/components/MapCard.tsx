import OpenNow from "@/components/OpenNow";
import { fullAddress, mapsEmbedUrl, mapsUrl, type Location } from "@/data/site";

export default function MapCard({ location }: { location: Location }) {
  return (
    <div className="lift overflow-hidden rounded-[--radius-panel] border border-ink/10 bg-white">
      <iframe
        src={mapsEmbedUrl(location)}
        title={`Map to True North Ice Cream ${location.name}`}
        loading="lazy"
        className="h-56 w-full border-0"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="p-6">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
          {location.name}
        </h3>
        <p className="mt-1 text-sm text-ink-soft">{location.note}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink">
          <a
            href={mapsUrl(location)}
            target="_blank"
            rel="noopener noreferrer"
            className="tap font-medium text-north-deep underline-offset-4 hover:underline"
          >
            {fullAddress(location)}
          </a>
          <br />
          <a
            href={location.phoneHref}
            className="tap font-medium text-north-deep underline-offset-4 hover:underline"
          >
            {location.phone}
          </a>
        </p>
        <div className="mt-3">
          <OpenNow />
        </div>
      </div>
    </div>
  );
}
