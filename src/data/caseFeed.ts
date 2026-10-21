/**
 * The Scooplist v1 feed contract, checked before a byte of it reaches a
 * page. liveCase.ts fetches `GET {feed}/api/v1/case/{shop}` and used to
 * trust whatever parsed as JSON; a feed that answered with the wrong shop,
 * an error object with a 200, or a flavor whose `allergens` was null would
 * have rendered as the day's board, or thrown mid-render. Every rejection
 * here is a thrown Error, and the caller treats it exactly like a dead
 * feed: the static board in flavors.ts renders instead. That is the one
 * rule of the live board (README, "The feed is an enhancement, never a
 * dependency"), and validation must never weaken it into an empty page.
 *
 * Only the fields this site reads are checked; the feed is additive-only
 * (Scooplist's lib/feed.ts) and extra keys pass through untouched.
 * Salvaged from hershock48/truenorth#1, with the limits kept and the
 * "never fall back" behavior left behind.
 */

export type FeedFlavor = {
  name: string;
  description: string;
  allergens: string[];
  tags: string[];
};

export type FeedBoard = { key: string; label: string; flavors: FeedFlavor[] };

export type CaseFeed = { updatedAt: number | null; boards: FeedBoard[] };

/** Bigger than any real case by an order of magnitude; a cap, not a budget. */
export const MAX_FEED_BYTES = 512_000;
const MAX_BOARDS = 20;
const MAX_FLAVORS_PER_BOARD = 200;
const MAX_LIST = 20;
/** A clock five minutes ahead of ours is a skewed server, not a bug; more is a lie. */
const FUTURE_SLACK_MS = 5 * 60_000;

function object(value: unknown, what: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Feed ${what} is not an object.`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, max: number, what: string, required = false): string {
  if (typeof value !== "string" || value.length > max) {
    throw new Error(`Feed ${what} is not a string under ${max} characters.`);
  }
  const trimmed = value.trim();
  if (required && !trimmed) throw new Error(`Feed ${what} is empty.`);
  return trimmed;
}

function list(value: unknown, max: number, what: string): unknown[] {
  if (!Array.isArray(value) || value.length > max) {
    throw new Error(`Feed ${what} is not a list of at most ${max}.`);
  }
  return value;
}

/**
 * Returns the feed as this site reads it, or throws. `shop` is the location
 * key the caller asked for: a feed that identifies itself as another shop
 * is refused, because a proxy or a misconfigured SCOOPLIST_FEED_URL that
 * answers every path with Marshall's case would otherwise put Marshall's
 * soft serve on Battle Creek's page.
 */
export function validateCaseFeed(raw: unknown, shop: string, now = Date.now()): CaseFeed {
  const data = object(raw, "body");

  const location = object(data.location, "location");
  if (location.id !== shop) {
    throw new Error(`Feed answered for "${String(location.id)}", not "${shop}".`);
  }

  const updatedAt = data.updatedAt;
  if (
    updatedAt !== null &&
    (typeof updatedAt !== "number" ||
      !Number.isSafeInteger(updatedAt) ||
      updatedAt <= 0 ||
      updatedAt > now + FUTURE_SLACK_MS)
  ) {
    throw new Error("Feed updatedAt is not a plausible timestamp.");
  }

  const keys = new Set<string>();
  const boards = list(data.boards, MAX_BOARDS, "boards").map((rawBoard) => {
    const board = object(rawBoard, "board");
    const key = text(board.key, 80, "board key", true);
    const label = text(board.label, 120, "board label", true);
    if (keys.has(key)) throw new Error(`Feed board "${key}" appears twice.`);
    keys.add(key);

    const names = new Set<string>();
    const flavors = list(board.flavors, MAX_FLAVORS_PER_BOARD, "flavors").map((rawFlavor) => {
      const flavor = object(rawFlavor, "flavor");
      const name = text(flavor.name, 120, "flavor name", true);
      if (names.has(name)) throw new Error(`Feed flavor "${name}" appears twice on "${key}".`);
      names.add(name);
      return {
        name,
        description: text(flavor.description ?? "", 1000, "flavor description"),
        allergens: list(flavor.allergens ?? [], MAX_LIST, "allergens").map((a) =>
          text(a, 80, "allergen", true),
        ),
        tags: list(flavor.tags ?? [], MAX_LIST, "tags").map((t) => text(t, 80, "tag", true)),
      };
    });

    return { key, label, flavors };
  });

  return { updatedAt: updatedAt as number | null, boards };
}
