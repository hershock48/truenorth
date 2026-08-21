import FlavorBadge from "@/components/FlavorBadge";
import ShopChip from "@/components/ShopChip";
import { effectiveTag, shopOnlyLabel } from "@/data/shops";
import { locations } from "@/data/site";
import type { Board } from "@/data/flavors";

/**
 * One flavor board as a card, shared by the all-shops flavors page and the
 * per-shop pages. On the shared page, a board or flavor one shop scoops alone
 * gets a "{Shop} only" chip (same mechanism as the menu — shops.ts computes
 * the label from the same effective tag the filters use); the shop pages pass
 * pre-filtered boards and no chips. The chip sits beside the title and never
 * replaces the subtitle.
 */
export default function FlavorBoardCard({
  board,
  showShopTags = false,
}: {
  board: Board;
  showShopTags?: boolean;
}) {
  const boardTag = showShopTags ? shopOnlyLabel(locations, board.at) : null;

  return (
    <section
      aria-labelledby={`board-${board.key}`}
      className="h-full rounded-[--radius-panel] border border-ink/10 bg-white p-6 md:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2
          id={`board-${board.key}`}
          className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink"
        >
          {board.title}
          {boardTag ? <ShopChip label={boardTag} size="heading" /> : null}
        </h2>
        <p className="text-sm font-medium text-ink-soft">{board.subtitle}</p>
      </div>
      <ul className="mt-5 divide-y divide-ink/5">
        {board.flavors.map((f) => {
          const flavorTag =
            showShopTags && !boardTag
              ? shopOnlyLabel(locations, effectiveTag(board.at, f.at))
              : null;
          return (
            <li key={`${board.key}-${f.name}`} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <span className="font-medium text-ink">{f.name}</span>
                {flavorTag ? <ShopChip label={flavorTag} /> : null}
                {f.note ? <p className="text-sm text-ink-soft">{f.note}</p> : null}
              </div>
              {f.allergens?.length ? (
                <span className="flex gap-1.5">
                  {f.allergens.map((a) => (
                    <FlavorBadge key={a} allergen={a} />
                  ))}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
