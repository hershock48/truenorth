/**
 * The flavor board. This file IS the "In the Case Today" feature: the owners
 * (or whoever updates the site) edit these lists and the board, the homepage
 * teaser, and the flavor count all update together.
 *
 * Since Scooplist went live this is the FALLBACK board: liveCase.ts renders
 * the owner's own case from the feed and only reaches for these lists when
 * the feed does not answer. So they mirror the Marshall shop's wall boards as
 * photographed on 11 Nov 2026 and entered in Scooplist that day, names
 * spelled exactly as Scooplist spells them, so an outage shows the same
 * board a minute-old page did. (The August lists came from the old website.)
 * Allergen marks are structured data rather than "(N)" typed into the name,
 * so they render as real, consistent badges.
 *
 * The case rotates through roughly 45 flavors a month, so treat this as a
 * snapshot, not a catalog. Updating it should never take more than a minute:
 * add or remove a line.
 */

import { filterByShop, type LocationKey } from "@/data/shops";

export type Allergen = "nuts" | "gluten";

export type Flavor = {
  name: string;
  allergens?: Allergen[];
  /** One short line, only where a name needs it. Most don't. */
  note?: string;
  /**
   * Shops scooping this flavor. Omitted = both; a tag NARROWS the board's own
   * tag, never widens it (shops.ts is the authority on the convention). The
   * owner says the two counters scoop different things; until he hands over
   * each shop's real case list (README checklist), the hand-scooped flavors
   * stay untagged and the structure is ready, tag a flavor and every board,
   * chip, and shop page updates itself.
   */
  at?: LocationKey[];
};

export const homemade: Flavor[] = [
  { name: "Almond Joy", allergens: ["nuts"] },
  { name: "Apple Pie" },
  { name: "Banana Cream" },
  { name: "Biscoff Cookie Butter", allergens: ["gluten"] },
  { name: "Birthday Cake" },
  { name: "Blue Moon" },
  { name: "Blueberry Swirl" },
  { name: "Butter Pecan", allergens: ["nuts"] },
  { name: "Cascarelli Cashew", allergens: ["nuts"], note: "Made with the famous nuts from Cascarelli's of Homer." },
  { name: "Chocolate" },
  { name: "Chocolate Avalanche", allergens: ["gluten"] },
  { name: "Chocolate Peanut Butter", allergens: ["nuts"] },
  { name: "Coffee Crunch", allergens: ["nuts"] },
  { name: "Cookie Dough", allergens: ["gluten"] },
  { name: "Dark Cherry Chip" },
  { name: "Lemon" },
  { name: "Lia's Butter Beer Crunch" },
  { name: "Maple Walnut", allergens: ["nuts"] },
  { name: "Mint Chip" },
  { name: "Old Pan Toffee", allergens: ["nuts"], note: "A collaboration with Old Pan Toffee, made down the road." },
  { name: "Oreo", allergens: ["gluten"] },
  { name: "Pumpkin Pie" },
  { name: "Raspberry Chip" },
  { name: "Snickers", allergens: ["nuts"] },
  { name: "Strawberry" },
  // The wall board lists the two sugar-free flavors under Dairy Free, but
  // sugar-free ice cream usually has milk in it. They sit here until the
  // owner confirms: a dairy-free label on a dairy flavor is the one mistake
  // on this board that could hurt someone.
  { name: "Sugar Free Chocolate" },
  { name: "Sugar Free Vanilla" },
  { name: "Vanilla Bean" },
];

export const softServe: Flavor[] = [
  { name: "Black Cherry" },
  { name: "Blue Goo" },
  { name: "Bubble Gum" },
  { name: "Butter Pecan Soft Serve", allergens: ["nuts"] },
  { name: "Caramel" },
  { name: "Chocolate Soft Serve" },
  { name: "Green Apple" },
  { name: "Raspberry" },
  { name: "Strawberry Soft Serve" },
  { name: "Twist" },
  { name: "Vanilla" },
];

export const adult: Flavor[] = [
  { name: "Bailey Mountain" },
  { name: "Bourbon Pecan Cream", allergens: ["nuts"] },
  { name: "Honey Bourbon" },
  { name: "Pumpkin Spice" },
  { name: "True North Slide" },
];

export const dairyFree: Flavor[] = [
  { name: "Dairy Free Pumpkin Pie" },
  { name: "Dairy Free Vanilla" },
  { name: "Dark Cherry Sorbet" },
  { name: "Lemon Sorbet" },
  { name: "Pistachio", allergens: ["nuts"] },
  { name: "Strawberry Lemonade Sorbet" },
  { name: "Vegan Chocolate" },
];

export type Board = {
  key: string;
  title: string;
  subtitle: string;
  flavors: Flavor[];
  /** Shops running this board. Omitted = both. */
  at?: LocationKey[];
};

/*
  BOARD KEYS ARE SCOOPLIST'S KEYS, not our titles. The live feed
  (liveCase.ts) sends its own key and label per board, and this file is what
  a key is looked up in: the subtitle by key, the accent colour by key, and
  the homepage's "which board do the shop cards show" by key. Scooplist's
  scoops preset calls the first board `handscooped`, so ours does too, and
  the TITLE stays Homemade because that is their word and their promise.
  Rename a key here only when the Scooplist preset renames it, or a live
  board silently loses its subtitle and its colour.
*/
export const boards: Board[] = [
  { key: "handscooped", title: "Homemade", subtitle: "Hand-scooped, made in the shop", flavors: homemade },
  // The soft serve machine is Marshall's (Choose Marshall article), same
  // sourcing and same one-edit correction as the menu's store tags.
  { key: "softserve", title: "Soft Serve", subtitle: "Cones, cups, and twists", flavors: softServe, at: ["marshall"] },
  { key: "adult", title: "Adult Flavors", subtitle: "21 and up, ID at the counter", flavors: adult },
  { key: "dairyfree", title: "Dairy Free", subtitle: "Sorbets and vegan scoops", flavors: dairyFree },
];

/** The board as one shop's counter scoops it: tagged-away boards and flavors gone. */
export function boardsFor(key: LocationKey): Board[] {
  return filterByShop(key, boards)
    .map((b) => ({ ...b, flavors: filterByShop(key, b.flavors) }))
    .filter((b) => b.flavors.length > 0);
}

/**
 * The date the board was last edited. Rendered on the flavors page so a
 * visitor can see the list is current, and so a stale board is visible to
 * the owner instead of silently wrong. Update it when you update the lists.
 */
export const boardUpdated = "2026-11-11";

/**
 * The one rendered form of that date. Every surface uses this export, three
 * hand-rolled copies of the expression had already drifted (one showed the
 * year, two didn't). The T12:00:00 anchors parsing at local noon so the
 * printed date never slips a day across timezones.
 */
export const boardUpdatedLabel = new Date(boardUpdated + "T12:00:00").toLocaleDateString(
  "en-US",
  { month: "long", day: "numeric" },
);
