"use client";

import { useEffect, useRef } from "react";

/**
 * The compass star from their logo, alone and spinning, throwing sprinkles.
 *
 * WHY THE STAR AND NOT A REDRAW. `/brand/logo-star.png` is their own mark:
 * the repo's scripts cut the original PNG into two layers (plate + star) and
 * verified the reassembly pixel-for-pixel. So this is the client's compass,
 * not the CompassRose ornament, which stays what it has always been — site
 * furniture that must never stand in for the mark. The full wordmark still
 * opens every page from the sticky header.
 *
 * MOTION. Same spring as AnimatedLogo, same numbers: it wakes a full turn off
 * north and rings back to it, and scrolling kicks it. Transform-only, and the
 * loop parks itself when settled instead of holding the main thread.
 *
 * The sprinkles are decoration on top of that — CSS-only, transform-only,
 * aria-hidden, and gone entirely under reduced motion, where the resting
 * frame is simply their compass sitting on north.
 */

const STIFFNESS = 0.012;
const DAMPING = 0.085;
const IMPULSE = 0.05;
const MAX_DEFLECTION = 380;

/* Angle around the dial, colour, and when it lets go. Odd angles and mixed
   delays so it never reads as a clock face. */
const SPRINKLES = [
  { a: 8, c: "#F5C84C", d: 0 },
  { a: 47, c: "#6BC1E8", d: 1.4 },
  { a: 86, c: "#C0452F", d: 0.5 },
  { a: 121, c: "#A8CE8F", d: 2.1 },
  { a: 158, c: "#F5934B", d: 0.9 },
  { a: 194, c: "#C79BE8", d: 2.6 },
  { a: 232, c: "#F5C84C", d: 1.8 },
  { a: 268, c: "#6BC1E8", d: 0.2 },
  { a: 303, c: "#A8CE8F", d: 2.3 },
  { a: 338, c: "#F5934B", d: 1.1 },
];

export default function SpinningCompass({ className = "" }: { className?: string }) {
  const starRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const star = starRef.current;
    if (!star) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let angle = -382;
    let velocity = 0;
    let lastY = window.scrollY;
    let raf = 0;
    let running = false;

    const step = () => {
      velocity += -STIFFNESS * angle - DAMPING * velocity;
      angle += velocity;
      if (angle > MAX_DEFLECTION) {
        angle = MAX_DEFLECTION;
        velocity = Math.min(0, velocity * -0.25);
      } else if (angle < -MAX_DEFLECTION) {
        angle = -MAX_DEFLECTION;
        velocity = Math.max(0, velocity * -0.25);
      }
      if (Math.abs(angle) < 0.02 && Math.abs(velocity) < 0.02) {
        angle = 0;
        star.style.transform = "rotate(0deg)";
        running = false;
        return;
      }
      star.style.transform = `rotate(${angle}deg)`;
      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(step);
      }
    };

    const onScroll = () => {
      const y = window.scrollY;
      velocity += Math.max(-18, Math.min(18, (y - lastY) * IMPULSE));
      lastY = y;
      start();
    };

    start();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <span className={`tn-compass relative isolate block aspect-square ${className}`}>
      {/* Colour behind their mark, never on it. */}
      <span aria-hidden className="tn-logo-halo pointer-events-none absolute -inset-6 -z-10" />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={starRef}
        src="/brand/logo-star.png"
        alt="True North Ice Cream"
        className="relative h-full w-full will-change-transform"
      />

      <span aria-hidden className="pointer-events-none absolute inset-0">
        {SPRINKLES.map((s) => (
          <span
            key={s.a}
            className="tn-ray absolute inset-0"
            style={{ ["--a" as string]: `${s.a}deg` }}
          >
            <i
              className="tn-sprinkle"
              style={{ background: s.c, animationDelay: `${s.d}s` }}
            />
          </span>
        ))}
      </span>
    </span>
  );
}
