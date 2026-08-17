/**
 * The flavor board. This file IS the "In the Case Today" feature: the owners
 * (or whoever updates the site) edit these lists and the board, the homepage
 * teaser, and the flavor count all update together.
 *
 * Names came verbatim from truenorthicecream.com/flavors, August 2026, with two
 * deliberate edits: their page spells "Strawberry Lemondade Sorbet" — corrected
 * here — and allergen marks are structured data rather than "(N)" typed into
 * the name, so they render as real, consistent badges.
 *
 * The case rotates through roughly 45 flavors a month, so treat this as a
 * snapshot, not a catalog. Updating it should never take more than a minute:
 * add or remove a line.
 */

export type Allergen = "nuts" | "gluten";

export type Flavor = {
  name: string;
  allergens?: Allergen[];
  /** One short line, only where a name needs it. Most don't. */
  note?: string;
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

export const boards = [
  { key: "homemade", title: "Homemade", subtitle: "Hand-scooped, made in the shop", flavors: homemade },
  { key: "softserve", title: "Soft Serve", subtitle: "Cones, cups, and twists", flavors: softServe },
  { key: "adult", title: "Adult Flavors", subtitle: "21 and up, ID at the counter", flavors: adult },
  { key: "dairyfree", title: "Dairy Free", subtitle: "Sorbets and vegan scoops", flavors: dairyFree },
] as const;

/**
 * The date the board was last edited. Rendered on the flavors page so a
 * visitor can see the list is current — and so a stale board is visible to
 * the owner instead of silently wrong. Update it when you update the lists.
 */
export const boardUpdated = "2026-08-17";
