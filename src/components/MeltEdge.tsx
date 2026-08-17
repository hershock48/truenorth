/**
 * The signature edge: the band above melting onto whatever sits below.
 * `color` must be the EXACT background of the band above, or a seam shows —
 * same contract as Glazed's own DripDivider.
 */
export default function MeltEdge({ color }: { color: string }) {
  return (
    <div className="melt-edge" aria-hidden="true" style={{ "--melt": color } as React.CSSProperties}>
      <div className="melt-lip" />
      <span className="melt-fall melt-fall-a" />
      <span className="melt-fall melt-fall-b" />
    </div>
  );
}
