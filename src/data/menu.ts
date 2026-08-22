/**
 * The menu with prices, verbatim from truenorthicecream.com/menu, August 2026.
 * Prices change at the counter first, confirm this whole file with the owners
 * before launch. It is on the README checklist.
 *
 * STORE TAGS. The two shops scoop different things, so sections and items can
 * carry `at`: which shops serve them. No tag means both; an item's tag NARROWS
 * its section's, never widens it (shops.ts is the authority on the
 * convention). What is tagged today rests on the public record, the Choose
 * Marshall article puts the soft serve machine and the espresso bar in
 * Marshall, and every tag is one edit here when the owners correct it
 * (README checklist).
 */

import { atShop, effectiveTag, filterByShop, type LocationKey } from "@/data/shops";

export type { LocationKey };

export type MenuItem = {
  name: string;
  price: string;
  note?: string;
  /** Shops that serve this item. Omitted = both. Narrows the section tag. */
  at?: LocationKey[];
};

export type MenuSection = {
  key: string;
  title: string;
  subtitle?: string;
  /** Shops that run this whole section. Omitted = both. */
  at?: LocationKey[];
  items: MenuItem[];
};

export const menu: MenuSection[] = [
  {
    key: "homemade",
    title: "Homemade Ice Cream",
    subtitle: "Hand-scooped from the case",
    items: [
      { name: "Mini", price: "$4.75", note: "One scoop" },
      { name: "Small", price: "$5.75", note: "Two scoops" },
      { name: "Large", price: "$6.75", note: "Three scoops" },
      { name: "Waffle cone or bowl", price: "+$2" },
      { name: "Pick 3", price: "$8" },
      { name: "Pint to go", price: "$10" },
      { name: "Quart to go", price: "$13" },
    ],
  },
  {
    key: "softserve",
    title: "Soft Serve",
    at: ["marshall"],
    items: [
      { name: "Mini", price: "$3.75" },
      { name: "Small", price: "$4.75" },
      { name: "Large", price: "$5.75" },
      { name: "Pup cup", price: "$3" },
      { name: "Pint to go", price: "$8" },
      { name: "Quart to go", price: "$10" },
    ],
  },
  {
    key: "specialties",
    title: "Specialties",
    items: [
      { name: "Banana split", price: "$8" },
      { name: "Sundae, small", price: "$7" },
      { name: "Sundae, large", price: "$8" },
      { name: "Extra toppings", price: "+$1" },
      { name: "Adult flavors", price: "+$1", note: "21 and up" },
      // Affogato is a scoop drowned in espresso, so it lives where the
      // espresso machine does.
      { name: "Affogato", price: "$7.50", at: ["marshall"] },
      { name: "Ice cream nachos", price: "$8.50" },
      { name: "Ice cream sandwich", price: "$4.50", note: "Or three for $12" },
      { name: "Ice cream pie", price: "$16" },
      { name: "Ice cream cake", price: "$40" },
      { name: "Ice cream cake, premium", price: "$45" },
    ],
  },
  {
    key: "drinks",
    title: "Drinks",
    /*
      No "Espresso bar in Marshall" subtitle, deliberately: the espresso items
      carry their own Marshall tags (chipped on /menu, filtered elsewhere), and
      a section subtitle survives per-shop filtering, Battle Creek's own board
      was rendering the other shop's amenity as its Drinks heading.
    */
    items: [
      { name: "Malts, shakes, floats, and coolers", price: "$8.50" },
      { name: "Fruit smoothie", price: "$6.50" },
      { name: "Slush, small", price: "$2" },
      { name: "Slush, large", price: "$3" },
      { name: "Coffee, small", price: "$3.50" },
      { name: "Coffee, large", price: "$4.50" },
      { name: "Double espresso", price: "$3.50", at: ["marshall"] },
      { name: "Cappuccino", price: "$5", at: ["marshall"] },
      // PLACEHOLDER: Kevin says they serve matcha; price not published anywhere
      // we can verify. A visible "Ask" beats an invented number (Lemoncello rule).
      { name: "Matcha", price: "Ask", note: "Price at the counter", at: ["marshall"] },
      { name: "Canned pop", price: "$2" },
      { name: "Bottled water", price: "$2" },
    ],
  },
];

/** True when this shop serves the item: the item's tag narrows the section's. */
export function servedAt(key: LocationKey, section: MenuSection, item?: MenuItem) {
  return atShop(key, item ? effectiveTag(section.at, item.at) : section.at);
}

/** The menu as one shop's counter sees it: tagged-away sections and items gone. */
export function menuFor(key: LocationKey): MenuSection[] {
  return filterByShop(key, menu)
    .map((s) => ({ ...s, items: s.items.filter((i) => servedAt(key, s, i)) }))
    .filter((s) => s.items.length > 0);
}

/**
 * Things a customer can order ahead for pickup, freezer goods, not cones.
 * Cakes and pies need lead time; the order form says so. Soft-serve pints
 * inherit the Marshall tag, so the form only offers them for Marshall pickup.
 */
export type Orderable = {
  key: string;
  name: string;
  price: string;
  note?: string;
  at?: LocationKey[];
};

export const orderables: Orderable[] = [
  { key: "pint", name: "Homemade pint", price: "$10", note: "Any flavor in the case" },
  { key: "quart", name: "Homemade quart", price: "$13", note: "Any flavor in the case" },
  { key: "ss-pint", name: "Soft serve pint", price: "$8", at: ["marshall"] },
  { key: "ss-quart", name: "Soft serve quart", price: "$10", at: ["marshall"] },
  { key: "sandwiches", name: "Ice cream sandwiches, three", price: "$12" },
  { key: "pie", name: "Ice cream pie", price: "$16", note: "A few days ahead, please" },
  { key: "cake", name: "Ice cream cake", price: "$40", note: "A few days ahead, please" },
  { key: "cake-premium", name: "Ice cream cake, premium", price: "$45", note: "A few days ahead, please" },
];

export function orderablesFor(key: LocationKey): Orderable[] {
  return filterByShop(key, orderables);
}

/** Catering, per person, from their published price list. */
export const cateringTiers = [
  { guests: "Up to 25", homemade: "$4.75", softServe: "$3.75", sandwiches: "$4.50" },
  { guests: "26 to 100", homemade: "$4.50", softServe: "$3.50", sandwiches: "$4.00" },
  { guests: "101 to 300", homemade: "$4.00", softServe: "$3.00", sandwiches: "$3.75" },
  { guests: "301 and up", homemade: "$3.75", softServe: "$2.75", sandwiches: "$3.75" },
] as const;
