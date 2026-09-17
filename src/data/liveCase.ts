import "server-only";
import { unstable_cache } from "next/cache";
import { validateCaseFeed, type CaseFeed as Feed, type FeedFlavor } from "./caseFeed";

import { boards, boardUpdatedLabel, boardsFor, type Board, type Flavor, type Allergen } from "@/data/flavors";
import { locations } from "@/data/site";
import type { LocationKey } from "@/data/shops";

/** Validated last-good snapshots use Next's persistent Data Cache, separately
 * keyed by feed origin and shop. Failed revalidation throws, preserving the
 * previous snapshot. A configured feed never falls back to a seeded flavor list.
 * The deployment must retain/share its Data Cache; verify that at launch.
 */
export type CaseData = { boards: Board[]; updatedLabel: string; live: boolean; source: "live" | "cached" | "static" | "unavailable"; notice: string };
type Snapshot = { feed: Feed; fetchedAt: number };

const KNOWN_ALLERGENS: Allergen[] = ["nuts", "gluten"];

function feedUrl(): string | null {
  const base = process.env.SCOOPLIST_FEED_URL;
  return base ? base.replace(/\/$/, "") : null;
}

async function fetchFeed(shop: LocationKey): Promise<Snapshot | null> {
  const base = feedUrl();
  if (!base) return null;
  try {
    return await unstable_cache(async () => {
      const response = await fetch(`${base}/api/v1/case/${shop}`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error("Flavor feed unavailable.");
      const payload = await response.text();
      if (payload.length > 512000) throw new Error("Flavor feed exceeds its size limit.");
      return { feed: validateCaseFeed(JSON.parse(payload), shop), fetchedAt: Date.now() };
    }, ["truenorth-case-v2", base, shop], { revalidate: 60 })();
  } catch { return null; }
}

function toFlavor(f: FeedFlavor): Flavor {
  return {
    name: f.name,
    // "Contains milk", not "Feed allergen: milk". The note is customer-facing
    // text on the flavor card, and "feed" is our word for the pipe, not theirs.
    note: [f.description, ...f.allergens.filter(a => !(KNOWN_ALLERGENS as string[]).includes(a)).map(a => `Contains ${a}`)].filter(Boolean).join(". ") || undefined,
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
  if (!updatedAt) return "date not supplied by the shop";
  return new Date(updatedAt).toLocaleDateString("en-US", {
    timeZone: "America/Detroit",
    month: "long",
    day: "numeric",
  });
}

/** Static demo data is labeled as a snapshot, never current availability. */
export async function caseFor(shop: LocationKey): Promise<CaseData> {
  if (!feedUrl()) return { boards: boardsFor(shop), updatedLabel: boardUpdatedLabel, live: false, source: "static", notice: "This is a sample rotation. Call the shop to confirm today's flavors." };
  const snapshot = await fetchFeed(shop);
  if (!snapshot) return { boards: [], updatedLabel: "unavailable", live: false, source: "unavailable", notice: "Today's flavor board is temporarily unavailable. Call the shop to check what is scooping." };
  const { feed, fetchedAt } = snapshot;
  const live = Date.now() - fetchedAt <= 90000;
  return {
    boards: feed.boards.map(b => ({ key: b.key, title: b.label, subtitle: subtitleFor(b.key), flavors: b.flavors.map(toFlavor) })),
    updatedLabel: label(feed.updatedAt), live, source: live ? "live" : "cached",
    notice: live ? "The case changes throughout the day. Call if you are making a trip for a favorite." : `Showing the last confirmed board, checked ${new Date(fetchedAt).toLocaleString("en-US", { timeZone: "America/Detroit" })} Eastern. Availability may have changed. Call the shop to confirm.`,
  };
}

/**
 * The merged all-shops view for the homepage and /flavors: the union of
 * every shop's case, with `at` tags computed from actual membership so the
 * "{Shop} only" chips reflect what is really scooping where today.
 */
export async function caseAll(): Promise<CaseData> {
  const shops = locations;
  const cases = await Promise.all(shops.map(l => caseFor(l.key)));
  if (cases.some(data => data.source === "unavailable")) return { boards: [], updatedLabel: "one or more shops unavailable", live: false, source: "unavailable", notice: "A shop's board is unavailable. Check each shop separately or call to confirm flavors." };
  const feeds = cases.map(data => ({ boards: data.boards.map(board => ({ key: board.key, label: board.title, flavors: board.flavors })), updatedAt: null }));

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
          board.flavors.push({ ...f });
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

  const live = cases.every(data => data.live);
  const source = cases.some(data => data.source === "unavailable") ? "unavailable" : cases.some(data => data.source === "cached") ? "cached" : cases.every(data => data.source === "static") ? "static" : "live";
  return {
    boards: [...merged.values()], updatedLabel: cases.map((data, i) => `${shops[i].name}: ${data.updatedLabel}`).join("; "), live, source,
    notice: cases.map((data, i) => `${shops[i].name}: ${data.notice}`).join(" "),
  };
}
