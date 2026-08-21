/**
 * The "{Shop} only" chip, one implementation for the menu and flavor cards.
 * Two sizes: heading (next to a section/board title) and inline (next to an
 * item name). Label text comes from shops.ts's shopOnlyLabel so the chip can
 * never disagree with the filters about who serves what.
 */
export default function ShopChip({
  label,
  size = "inline",
}: {
  label: string;
  size?: "heading" | "inline";
}) {
  const pad = size === "heading" ? "ml-3 px-3 py-1 align-middle" : "ml-2 px-2 py-0.5";
  return (
    <span
      className={`whitespace-nowrap rounded-full bg-north-deep/10 text-xs font-semibold text-north-deep ${pad}`}
    >
      {label}
    </span>
  );
}
