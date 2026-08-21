import { locations } from "@/data/site";
import type { MenuItem, MenuSection } from "@/data/menu";

/**
 * One menu section as a card. The full-menu page passes `showShopTags` so
 * anything one shop doesn't serve gets a small "{Shop} only" chip; the
 * per-shop pages pass a pre-filtered section and no tags.
 */

function shopTag(section: MenuSection, item?: MenuItem): string | null {
  const tag = item?.at ?? section.at;
  if (!tag || tag.length >= locations.length) return null;
  const only = locations.find((l) => tag.includes(l.key));
  return only ? `${only.name} only` : null;
}

export default function MenuSectionCard({
  section,
  showShopTags = false,
}: {
  section: MenuSection;
  showShopTags?: boolean;
}) {
  const sectionTag = showShopTags ? shopTag(section) : null;

  return (
    <section
      aria-labelledby={`menu-${section.key}`}
      className="h-full rounded-[--radius-panel] border border-ink/10 bg-white p-6 md:p-8"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id={`menu-${section.key}`}
          className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink"
        >
          {section.title}
        </h2>
        {sectionTag ? (
          <p className="whitespace-nowrap rounded-full bg-north-deep/10 px-3 py-1 text-xs font-semibold text-north-deep">
            {sectionTag}
          </p>
        ) : section.subtitle ? (
          <p className="text-sm font-medium text-ink-soft">{section.subtitle}</p>
        ) : null}
      </div>
      <ul className="mt-5 divide-y divide-ink/5">
        {section.items.map((item) => {
          // An item chip repeats nothing the section chip already says.
          const itemTag = showShopTags && !sectionTag ? shopTag(section, item) : null;
          return (
            <li key={item.name} className="flex items-baseline justify-between gap-4 py-2.5">
              <div>
                <span className="font-medium text-ink">{item.name}</span>
                {itemTag ? (
                  <span className="ml-2 rounded-full bg-north-deep/10 px-2 py-0.5 text-xs font-semibold text-north-deep">
                    {itemTag}
                  </span>
                ) : null}
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
