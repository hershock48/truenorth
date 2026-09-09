import type { CSSProperties } from "react";

/**
 * A pinch of sprinkles over a heading: four short rounded pills at jaunty
 * angles, the hero compass's sprinkle language reused as punctuation.
 * Added when a viewer read the page as "a hospital or a financial
 * advisor": the fix is scoop colors used often and small, not a new
 * layout. Decorative, aria-hidden.
 *
 * They wiggle, a little (Kevin, 9 Sep 2026). Each pill rocks a few degrees
 * either side of its own resting tilt, on its own clock, so the four never
 * move in step and it reads as a pinch of sprinkles settling rather than a
 * row of metronomes. The resting tilt lives in a custom property rather
 * than a rotate utility so the animation can swing AROUND it instead of
 * overwriting it; without that the keyframes would throw the tilt away.
 * Transform only. Under reduced motion nothing animates and each pill sits
 * at its resting tilt, which is the drawing as it was before it moved.
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
  const pills: { color: string; tilt: string; dur: string; delay: string }[] = [
    { color: "bg-cherry", tilt: "-12deg", dur: "2.6s", delay: "0s" },
    { color: "bg-sherbet", tilt: "6deg", dur: "3.1s", delay: "-1.2s" },
    { color: "bg-mint", tilt: "-3deg", dur: "2.9s", delay: "-0.5s" },
    { color: onDark ? "bg-cream" : "bg-north", tilt: "12deg", dur: "3.4s", delay: "-2.1s" },
  ];
  return (
    <span aria-hidden className={`mb-3 flex gap-1.5 ${className}`}>
      {pills.map((p, i) => (
        <span
          key={i}
          className={`tn-wiggle h-1.5 w-5 rounded-full ${p.color}`}
          style={{ "--tilt": p.tilt, "--dur": p.dur, "--delay": p.delay } as CSSProperties}
        />
      ))}
    </span>
  );
}
