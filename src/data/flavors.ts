/**
 * The flavor board. This file IS the "In the Case Today" feature: the owners
 * (or whoever updates the site) edit these lists and the board, the homepage
 * teaser, and the flavor count all update together.
 *
 * Names came verbatim from truenorthicecream.com/flavors, August 2026, with two
 * deliberate edits: their page spells "Strawberry Lemondade Sorbet", corrected
 * here, and allergen marks are structured data rather than "(N)" typed into
 * the name, so they render as real, consistent badges.
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
  { name: "Birthday Cake" },
  { name: "Biscoff Cookie Butter", allergens: ["gluten"] },
  { name: "Blue Moon" },
  { name: "Butter Pecan", allergens: ["nuts"] },
  { name: "Cascarelli Cashew", allergens: ["nuts"], note: "Made with the famous nuts from Cascarelli's of Homer." },
  { name: "Chocolate" },
  { name: "Chocolate Avalanche", allergens: ["gluten"] },
  { name: "Cookie Dough", allergens: ["gluten"] },
  { name: "Coffee Crunch", allergens: ["nuts"] },
  { name: "Dark Cherry Chip" },
  { name: "Lemon" },
  { name: "Mint Chip" },
  { name: "Old Pan Toffee", allergens: ["nuts"], note: "A collaboration with Old Pan Toffee, made down the road." },
  { name: "Oreo", allergens: ["gluten"] },
  { name: "Peanut Butter Cup", allergens: ["nuts"] },
  { name: "Raspberry Chip" },
  { name: "Snickers", allergens: ["nuts"] },
  { name: "Strawberry" },
  { name: "Totally Coconut", allergens: ["nuts"] },
  { name: "Vanilla Bean" },
];

export const softServe: Flavor[] = [
  { name: "Black Cherry" },
  { name: "Blue Goo" },
  { name: "Bubble Gum" },
  { name: "Butter Pecan" },
  { name: "Chocolate" },
  { name: "Cool Lemon" },
  { name: "Green Apple" },
  { name: "Raspberry" },
  { name: "Strawberry" },
  { name: "Twist" },
  { name: "Vanilla" },
];

export const adult: Flavor[] = [
  { name: "Bailey Mountain" },
  { name: "Cherry Amaretto" },
  { name: "Honey Bourbon" },
  { name: "Rum Chatta" },
  { name: "True North Slide" },
];

export const dairyFree: Flavor[] = [
  { name: "Dark Cherry Sorbet" },
  { name: "Chocolate", note: "Vegan." },
  { name: "Pumpkin Pie" },
  { name: "Strawberry" },
  { name: "Strawberry Lemonade Sorbet" },
];

export type Board = {
  key: string;
  title: string;
  subtitle: string;
  flavors: Flavor[];
  /** Shops running this board. Omitted = both. */
  at?: LocationKey[];
};

export const boards: Board[] = [
  { key: "homemade", title: "Homemade", subtitle: "Hand-scooped, made in the shop", flavors: homemade },
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
export const boardUpdated = "2026-08-21";

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
