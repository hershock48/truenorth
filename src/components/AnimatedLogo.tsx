"use client";

import { useEffect, useRef } from "react";
import { site } from "@/data/site";

/**
 * Their real logo, with the compass star alive. THE BRAND IS THE MOTION:
 * scrolling knocks the needle off course, and the moment you stop it swings
 * back and settles on true north. That is the name doing the animating.
 *
 * HOW THE MARK STAYS THEIRS. The logo is a flat-teal raster, so nothing is
 * redrawn: `scripts` in the repo history cut the original PNG into two layers,
 * verified by pixel diff (reassembly bbox: None, i.e. identical):
 *
 *   logo-plate.png  — TRUE, the small N, NORTH ICE CREAM. Never moves.
 *   logo-star.png   — the 158x158 compass star, cropped so the box center sits
 *                     on the star's measured ink center (offset 0.00, -0.50px),
 *                     which is what makes rotation wobble-free.
 *
 * The star box geometry below is measured, not eyeballed: box (331,28)-(489,186)
 * of the 878x185 original. It covers only the zero-ink gap columns either side
 * of the star, so the text layers can never be clipped by it.
 *
 * MOTION RULES (glaze.md §4): the un-animated state is the finished logo —
 * no JS, reduced motion, or a dead rAF loop all leave the composite identical
 * to the original PNG at rest. Transform-only, so it never triggers layout.
 * The loop parks itself when settled instead of spinning the main thread.
 */

/* Star box as percentages of the 878x185 canvas. */
const STAR = { left: 37.6993, top: 15.1351, width: 17.9954 };

/* Spring constants, tuned by eye at 60fps: a stiff-ish needle with a little
   overshoot, settled in about a second. */
const STIFFNESS = 0.016;
const DAMPING = 0.12;
const IMPULSE = 0.03; // degrees of kick per scrolled pixel
const MAX_DEFLECTION = 30;

export default function AnimatedLogo({ className = "" }: { className?: string }) {
  const starRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const star = starRef.current;
    if (!star) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let angle = -22; // wakes up off-north and finds it: the load-in is the brand move
    let velocity = 0;
    let lastY = window.scrollY;
    let raf = 0;
    let running = false;

    const step = () => {
      velocity += -STIFFNESS * angle - DAMPING * velocity;
      angle += velocity;
      // Hard stop at the deflection limit, IN THE INTEGRATOR — clamping only
      // in the scroll handler let accumulated velocity carry the needle to
      // 49.7 degrees between events (measured). The small bounce-back reads
      // as the needle hitting the end of its travel.
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
        running = false; // park the loop; the next scroll restarts it
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
      const kick = Math.max(-10, Math.min(10, (y - lastY) * IMPULSE));
      lastY = y;
      velocity += kick;
      start();
    };

    start(); // the initial find-north settle
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <span
      className={`relative block ${className}`}
      style={{ aspectRatio: "878 / 185" }}
    >
      {/*
        Plain <img>, deliberately: these are two tiny already-optimized PNGs
        composing one mark; next/image's wrapper and srcset add nothing and its
        layout modes fight the measured absolute geometry below.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-plate.png"
        alt={site.name}
        className="absolute inset-0 h-full w-full"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={starRef}
        src="/brand/logo-star.png"
        alt=""
        aria-hidden="true"
        className="absolute will-change-transform"
        style={{
          left: `${STAR.left}%`,
          top: `${STAR.top}%`,
          width: `${STAR.width}%`,
          height: "auto",
        }}
      />
    </span>
  );
}
