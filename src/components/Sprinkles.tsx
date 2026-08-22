/**
 * A pinch of sprinkles over a heading: four short rounded pills at jaunty
 * angles, the hero compass's sprinkle language reused as punctuation.
 * Added when a viewer read the page as "a hospital or a financial
 * advisor": the fix is scoop colors used often and small, not a new
 * layout. Static and decorative, aria-hidden, no motion to reduce.
 *
 * `onDark` swaps the teal pill for cream so all four read on the ink band.
 */
export default function Sprinkles({
  onDark = false,
  className = "",
}: {
  onDark?: boolean;
  className?: string;
}) {
  const pills: { color: string; tilt: string }[] = [
    { color: "bg-cherry", tilt: "-rotate-12" },
    { color: "bg-sherbet", tilt: "rotate-6" },
    { color: "bg-mint", tilt: "-rotate-3" },
    { color: onDark ? "bg-cream" : "bg-north", tilt: "rotate-12" },
  ];
  return (
    <span aria-hidden className={`mb-3 flex gap-1.5 ${className}`}>
      {pills.map((p, i) => (
        <span key={i} className={`h-1.5 w-5 rounded-full ${p.color} ${p.tilt}`} />
      ))}
    </span>
  );
}
