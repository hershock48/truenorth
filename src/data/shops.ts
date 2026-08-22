import type { Hours, Location } from "@/data/site";

/**
 * THE shop-tag mechanism, in one place. menu.ts, flavors.ts, and both card
 * components all speak this convention; before this module existed there were
 * five hand-rolled copies and they had already drifted (the chip labeler used
 * override semantics while the filters used AND, a flavor could be advertised
 * with a shop chip yet render on neither shop page).
 *
 * The convention: `at` lists the shops that serve a thing. No tag = every
 * shop. A child's tag NARROWS its parent's (intersection), never widens it,
 * so a "Marshall" section can only contain Marshall-or-nowhere items, and the
 * chip label is computed from the same effective tag the filters use. A
 * contradictory nesting yields an empty effective tag: hidden everywhere,
 * chip-less, and never falsely advertised.
 */

export type LocationKey = Location["key"];

/** True when this shop serves a thing carrying `tag`. No tag = every shop. */
export function atShop(key: LocationKey, tag?: readonly LocationKey[]) {
  return !tag || tag.includes(key);
}

/** The shops that actually serve a child inside a parent: child narrows parent. */
export function effectiveTag(
  parent?: readonly LocationKey[],
  child?: readonly LocationKey[],
): readonly LocationKey[] | undefined {
  if (!parent) return child;
  if (!child) return parent;
  return parent.filter((k) => child.includes(k));
}

/** Keep the members of `items` that this shop serves. */
export function filterByShop<T extends { at?: readonly LocationKey[] }>(
  key: LocationKey,
  items: readonly T[],
): T[] {
  return items.filter((i) => atShop(key, i.at));
}

/**
 * "{Shop} only", but only when exactly one shop qualifies. With two shops
 * that is the only interesting case anyway; if a third shop ever arrives, a
 * two-of-three tag renders no chip rather than a wrong one (fail safe).
 */
export function shopOnlyLabel(
  locations: readonly Location[],
  tag?: readonly LocationKey[],
): string | null {
  if (!tag || tag.length !== 1) return null;
  const only = locations.find((l) => l.key === tag[0]);
  return only ? `${only.name} only` : null;
}

/**
 * The single daily open/close span, when every day genuinely shares one,
 * both shops do today. Returns null the moment any day diverges, so surfaces
 * that render "one span for the whole week" (the shop-page hours
 * line) fall back honestly instead of showing Sunday's hours as everyone's.
 */
export function uniformDailySpan(hours: readonly Hours[]) {
  const [first] = hours;
  if (!first) return null;
  return hours.every((h) => h.open === first.open && h.close === first.close)
    ? { open: first.open, close: first.close }
    : null;
}
