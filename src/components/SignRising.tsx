import Image from "next/image";

/**
 * Their carved sign, with the sun coming up behind the peaks.
 *
 * THE SIGN IS THREE LAYERS, not one picture, because the sun has to rise
 * from BEHIND the mountain and a flat PNG cannot occlude anything. The
 * original export (brand/logo-sign.png, still used flat on /about) was split
 * by tools in the session that added it, and every number below is a
 * measurement of that file, not a guess:
 *
 *   1. The sky: a plain rectangle of the sign's own teal, 70,145,161, sitting
 *      where the sky was. It runs a little past the sky on every side on
 *      purpose; the frame and the snow in the front layer are opaque and
 *      cover the overshoot, and a rectangle cut exactly to the sky would
 *      show a hairline of cream at any edge that rounded the wrong way.
 *   2. The sun: a CSS disc in the sign's own yellow, 232,214,74, centred
 *      where the sun was (991, 180.5 of 1263 x 743) and the same 147px
 *      across. The sun in the original is a flat disc, so a circle is not
 *      an approximation of it, it IS it.
 *   3. The front: brand/logo-sign-front.png, the export with the sky and the
 *      sun disc made transparent. Frame, peaks, pines and type, all opaque,
 *      all exactly where they were.
 *
 * At rest the three reassemble to the original pixel for pixel (verified by
 * compositing them offline and looking). The animation moves ONLY the sun,
 * transform only, from 140% of its own height lower (its top is then below
 * the lowest point of the ridge across its width, y 312 of 743, so it is
 * fully hidden) up to its resting place. Ease out, so it slows as it clears
 * the ridge the way a sunrise does. Under reduced motion there is no
 * animation and the sun is simply up, which is the finished drawing, the
 * same rule as the compass and the melt.
 *
 * Desktop only, same slot and same reason as the photo this replaced.
 */
export default function SignRising({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-[1263/743] w-full max-w-[34rem] ${className}`}
      role="img"
      aria-label="True North Ice Cream, on their carved sign: snowy peaks, pines, and the sun coming up under a teal sky"
    >
      {/* 1. the sky */}
      <div aria-hidden className="absolute left-[3.5%] top-[6.5%] h-[44%] w-[93%] bg-[#4691A1]" />
      {/* 2. the sun */}
      <div
        aria-hidden
        className="tn-sun absolute left-[72.64%] top-[14.4%] aspect-square w-[11.64%] rounded-full bg-[#E8D64A]"
      />
      {/* 3. the front */}
      <Image
        src="/brand/logo-sign-front.png"
        alt=""
        fill
        priority
        sizes="(min-width: 768px) 34rem, 100vw"
        className="object-contain"
      />
    </div>
  );
}
