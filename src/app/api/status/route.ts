import { NextResponse } from "next/server";
import { caseAll } from "@/data/liveCase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "Is the flavor board live, or is it still the file?"
 *
 * The same trick that found the Blob mis-naming on Scooplist: guessing at
 * whether an env var reached a deployment wastes an afternoon, and asking
 * the deployment takes a second. Reports whether SCOOPLIST_FEED_URL is set,
 * whether that feed answers from here, and which source the boards actually
 * rendered from. The feed URL is a public address, and everything else is a
 * boolean or a count, nothing secret.
 */
export async function GET() {
  const configured = Boolean(process.env.SCOOPLIST_FEED_URL);
  const feed = process.env.SCOOPLIST_FEED_URL ?? null;

  let reachable: boolean | null = null;
  let feedStatus: number | null = null;
  if (feed) {
    try {
      const res = await fetch(`${feed.replace(/\/$/, "")}/api/v1/case/marshall`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      feedStatus = res.status;
      reachable = res.ok;
    } catch {
      reachable = false;
    }
  }

  const { live, boards, updatedLabel } = await caseAll();

  return NextResponse.json(
    {
      board: {
        // "scooplist" = the owner's taps drive this site. "static" = flavors.ts.
        source: live ? "scooplist" : "static",
        updatedLabel,
        flavors: boards.reduce((n, b) => n + b.flavors.length, 0),
      },
      feed: { configured, url: feed, reachable, status: feedStatus },
      summary: live
        ? "Live: the boards render from Scooplist."
        : configured
          ? "SCOOPLIST_FEED_URL is set but the feed did not answer, showing the built-in board."
          : "SCOOPLIST_FEED_URL is not set on this deployment, showing the built-in board.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
