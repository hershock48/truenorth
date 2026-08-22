import "server-only";

import { boards, boardUpdatedLabel, boardsFor, type Board, type Flavor, type Allergen } from "@/data/flavors";
import { locations } from "@/data/site";
import type { LocationKey } from "@/data/shops";

/**
 * The live flavor board, fed by Scooplist (the studio's flavor-board app).
 *
 * With SCOOPLIST_FEED_URL set, every board on this site renders from
 * GET {feed}/api/v1/case/{shop}, the owner taps a tub out at the counter
 * and the site follows within a minute, no deploy. Without the env var, or
 * on ANY feed failure, everything falls back to the static board in
 * flavors.ts and the site renders exactly as it did before Scooplist
 * existed. The feed is an enhancement, never a dependency: a menu that
 * sometimes 500s is worse than one that is occasionally a day stale.
 *
 * Fetches carry a 3s abort and 60s ISR revalidate, so a dead feed costs one
 * slow render per minute, not a hung page.
 */

type FeedFlavor = {
  name: string;
  description: string;
  allergens: string[];
  tags: string[];
};

type FeedBoard = { key: string; label: string; flavors: FeedFlavor[] };

type Feed = { updatedAt: number | null; boards: FeedBoard[] };

/** The result every consumer gets: boards plus the honest "last updated" label. */
export type CaseData = { boards: Board[]; updatedLabel: string; live: boolean };

const KNOWN_ALLERGENS: Allergen[] = ["nuts", "gluten"];

function feedUrl(): string | null {
  const base = process.env.SCOOPLIST_FEED_URL;
  return base ? base.replace(/\/$/, "") : null;
}

async function fetchFeed(shop: LocationKey): Promise<Feed | null> {
  const base = feedUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/v1/case/${shop}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return (await res.json()) as Feed;
  } catch {
    return null;
  }
}

function toFlavor(f: FeedFlavor): Flavor {
  return {
    name: f.name,
    note: f.description || undefined,
    // The site's badge system knows nuts and gluten; other feed allergens
    // ride in the note-free zone rather than rendering an unstyled badge.
    allergens: f.allergens.filter((a): a is Allergen =>
      (KNOWN_ALLERGENS as string[]).includes(a),
    ),
  };
}

/** Subtitles are site voice, not feed data, keep the static ones by key. */
function subtitleFor(key: string): string {
  return boards.find((b) => b.key === key)?.subtitle ?? "";
}

function label(updatedAt: number | null): string {
  if (!updatedAt) return boardUpdatedLabel;
  return new Date(updatedAt).toLocaleDateString("en-US", {
    timeZone: "America/Detroit",
    month: "long",
    day: "numeric",
  });
}

/** One shop's boards, live when the feed answers, static otherwise. */
export async function caseFor(shop: LocationKey): Promise<CaseData> {
  const feed = await fetchFeed(shop);
  if (!feed) {
    return { boards: boardsFor(shop), updatedLabel: boardUpdatedLabel, live: false };
  }
  return {
    boards: feed.boards.map((b) => ({
      key: b.key,
      title: b.label,
      subtitle: subtitleFor(b.key),
      flavors: b.flavors.map(toFlavor),
    })),
    updatedLabel: label(feed.updatedAt),
    live: true,
  };
}

/**
 * The merged all-shops view for the homepage and /flavors: the union of
 * every shop's case, with `at` tags computed from actual membership so the
 * "{Shop} only" chips reflect what is really scooping where today.
 */
export async function caseAll(): Promise<CaseData> {
  const shops = locations;
  const feeds = await Promise.all(shops.map((l) => fetchFeed(l.key)));
  // All shops or none: a merged board where one shop's feed failed would
  // render half the truth with confident chips on it.
  if (feeds.some((f) => f === null)) {
    return { boards, updatedLabel: boardUpdatedLabel, live: false };
  }

  const merged = new Map<string, Board>();
  const membership = new Map<string, Set<LocationKey>>();

  feeds.forEach((feed, i) => {
    const shop = shops[i].key;
    for (const b of feed!.boards) {
      if (!merged.has(b.key)) {
        merged.set(b.key, { key: b.key, title: b.label, subtitle: subtitleFor(b.key), flavors: [] });
      }
      const board = merged.get(b.key)!;
      for (const f of b.flavors) {
        const memberKey = `${b.key}:${f.name}`;
        if (!membership.has(memberKey)) {
          membership.set(memberKey, new Set());
          board.flavors.push(toFlavor(f));
        }
        membership.get(memberKey)!.add(shop);
      }
    }
  });

  for (const board of merged.values()) {
    for (const flavor of board.flavors) {
      const at = [...(membership.get(`${board.key}:${flavor.name}`) ?? [])];
      if (at.length > 0 && at.length < shops.length) flavor.at = at;
    }
    // Board-level tag when every flavor on it belongs to the same lone shop.
    const allAts = board.flavors.map((f) => f.at?.join() ?? "");
    if (allAts.length > 0 && allAts.every((a) => a && a === allAts[0])) {
      board.at = board.flavors[0].at;
    }
    board.flavors.sort((a, b) => a.name.localeCompare(b.name));
  }

  const updatedAt = Math.max(...feeds.map((f) => f!.updatedAt ?? 0)) || null;
  return {
    boards: [...merged.values()],
    updatedLabel: label(updatedAt),
    live: true,
  };
}
