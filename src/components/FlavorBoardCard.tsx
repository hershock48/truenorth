import FlavorBadge from "@/components/FlavorBadge";
import ShopChip from "@/components/ShopChip";
import { effectiveTag, shopOnlyLabel } from "@/data/shops";
import { locations } from "@/data/site";
import type { Board } from "@/data/flavors";

/*
  A flavor board should look like flavors. Each board gets a scoop color for
  its top ribbon and heading rule - drawn from the palette already measured
  in globals.css, so nothing new needed a contrast check: these are fills and
  rules, never text.
*/
const ACCENT: Record<string, { ribbon: string; rule: string }> = {
  homemade: { ribbon: "from-waffle/70 to-scoop", rule: "bg-waffle/40" },
  softserve: { ribbon: "from-north/60 to-mint", rule: "bg-north/35" },
  dairyfree: { ribbon: "from-mint to-scoop", rule: "bg-mint" },
  adult: { ribbon: "from-cherry/60 to-waffle/60", rule: "bg-cherry/35" },
};

/**
 * One flavor board as a card, shared by the all-shops flavors page and the
 * per-shop pages. On the shared page, a board or flavor one shop scoops alone
 * gets a "{Shop} only" chip (same mechanism as the menu, shops.ts computes
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
      className="h-full overflow-hidden rounded-[--radius-panel] border border-ink/10 bg-white"
    >
      <div
        aria-hidden
        className={`h-2 w-full bg-gradient-to-r ${(ACCENT[board.key] ?? ACCENT.homemade).ribbon}`}
      />
      <div className="p-6 md:p-8">
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
      <div aria-hidden className={`mt-3 h-1 w-14 rounded-full ${(ACCENT[board.key] ?? ACCENT.homemade).rule}`} />
      <ul className="mt-4 divide-y divide-ink/5">
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
      </div>
    </section>
  );
}
