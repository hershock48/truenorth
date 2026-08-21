import Link from "next/link";
import Reveal from "@/components/Reveal";
import { locations, type Location } from "@/data/site";

/**
 * The "which shop is mine?" entry row that opens /flavors and /menu — one
 * button per shop, same look on both pages by construction instead of by
 * copy-paste. `href` and `label` are functions of the shop so each page keeps
 * its own destination anchor and wording.
 */
export default function ShopEntryLinks({
  href,
  label,
}: {
  href: (l: Location) => string;
  label: (l: Location) => string;
}) {
  return (
    <Reveal>
      <div className="mb-8 flex flex-wrap gap-3">
        {locations.map((l) => (
          <Link key={l.key} href={href(l)} className="btn-secondary !px-5 !py-2.5 text-sm">
            {label(l)} →
          </Link>
        ))}
      </div>
    </Reveal>
  );
}
