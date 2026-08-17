import type { Allergen } from "@/data/flavors";

/**
 * Allergen marks as real badges instead of "(N)" typed into a name.
 * Text on cream-dim: ink at 11.70, well past AA at this size.
 */
const labels: Record<Allergen, { short: string; full: string }> = {
  nuts: { short: "N", full: "Contains nuts" },
  gluten: { short: "G", full: "Contains gluten" },
};

export default function FlavorBadge({ allergen }: { allergen: Allergen }) {
  const l = labels[allergen];
  return (
    <abbr
      title={l.full}
      aria-label={l.full}
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cream-dim text-[0.7rem] font-bold text-ink no-underline"
    >
      {l.short}
    </abbr>
  );
}
