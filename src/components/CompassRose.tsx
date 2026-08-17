/**
 * A small compass ornament for section headers and dividers.
 *
 * DELIBERATELY NOT THE LOGO. The real mark is the flat-teal compass inside
 * their wordmark PNG, and per the lift-don't-approximate rule we never redraw
 * a client's mark next to their type. This is site furniture in the same
 * geometric vocabulary: an eight-point star with a north tick, drawn simple
 * enough that it reads at 20px and can take any fill. Where the actual logo
 * is needed, use /brand/logo.png.
 *
 * Wrapped in .needle-settle by callers that want the swing-and-settle motion;
 * the resting state points due north, so no JS means it simply points north.
 */
export default function CompassRose({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g className="needle" style={{ transformOrigin: "50% 50%" }}>
        {/* Cardinal points */}
        <path
          d="M50 2 L58 42 L98 50 L58 58 L50 98 L42 58 L2 50 L42 42 Z"
          fill="currentColor"
          opacity="0.9"
        />
        {/* Intercardinal points, shorter */}
        <path
          d="M50 22 L72 28 L78 50 L72 72 L50 78 L28 72 L22 50 L28 28 Z"
          fill="currentColor"
          opacity="0.35"
          transform="rotate(45 50 50)"
        />
        {/* The needle's north half, picked out */}
        <path d="M50 2 L58 42 L50 50 L42 42 Z" fill="currentColor" />
      </g>
    </svg>
  );
}
