import ShopChip from "@/components/ShopChip";
import { effectiveTag, shopOnlyLabel } from "@/data/shops";
import { locations } from "@/data/site";
import type { MenuSection } from "@/data/menu";

/**
 * One menu section as a card. The full-menu page passes `showShopTags` so
 * anything one shop doesn't serve gets a "{Shop} only" chip; the per-shop
 * pages pass a pre-filtered section and no tags. The chip sits beside the
 * title and never replaces the subtitle, a section's descriptor is content,
 * not a slot to reclaim.
 */
export default function MenuSectionCard({
  section,
  showShopTags = false,
}: {
  section: MenuSection;
  showShopTags?: boolean;
}) {
  const sectionTag = showShopTags ? shopOnlyLabel(locations, section.at) : null;

  return (
    <section
      aria-labelledby={`menu-${section.key}`}
      className="h-full rounded-[--radius-panel] border border-ink/10 bg-white p-6 md:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2
          id={`menu-${section.key}`}
          className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink"
        >
          {section.title}
          {sectionTag ? <ShopChip label={sectionTag} size="heading" /> : null}
        </h2>
        {section.subtitle ? (
          <p className="text-sm font-medium text-ink-soft">{section.subtitle}</p>
        ) : null}
      </div>
      <ul className="mt-5 divide-y divide-ink/5">
        {section.items.map((item) => {
          // The item chip reflects the same effective tag the filters use,
          // and stays quiet when the section chip already says it.
          const itemTag =
            showShopTags && !sectionTag
              ? shopOnlyLabel(locations, effectiveTag(section.at, item.at))
              : null;
          return (
            <li key={item.name} className="flex items-baseline justify-between gap-4 py-2.5">
              <div>
                <span className="font-medium text-ink">{item.name}</span>
                {itemTag ? <ShopChip label={itemTag} /> : null}
                {item.note ? <p className="text-sm text-ink-soft">{item.note}</p> : null}
              </div>
              <span className="whitespace-nowrap font-semibold text-north-deep">{item.price}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
