/**
 * The menu with prices, verbatim from truenorthicecream.com/menu, August 2026.
 * Prices change at the counter first — confirm this whole file with the owners
 * before launch. It is on the README checklist.
 */

export type MenuItem = {
  name: string;
  price: string;
  note?: string;
};

export type MenuSection = {
  key: string;
  title: string;
  subtitle?: string;
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
      { name: "Affogato", price: "$7.50" },
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
    subtitle: "Espresso bar included",
    items: [
      { name: "Malts, shakes, floats, and coolers", price: "$8.50" },
      { name: "Fruit smoothie", price: "$6.50" },
      { name: "Slush, small", price: "$2" },
      { name: "Slush, large", price: "$3" },
      { name: "Coffee, small", price: "$3.50" },
      { name: "Coffee, large", price: "$4.50" },
      { name: "Double espresso", price: "$3.50" },
      { name: "Cappuccino", price: "$5" },
      // PLACEHOLDER: Kevin says they serve matcha; price not published anywhere
      // we can verify. A visible "Ask" beats an invented number (Lemoncello rule).
      { name: "Matcha", price: "Ask", note: "Price at the counter" },
      { name: "Canned pop", price: "$2" },
      { name: "Bottled water", price: "$2" },
    ],
  },
];

/** Catering, per person, from their published price list. */
export const cateringTiers = [
  { guests: "Up to 25", homemade: "$4.75", softServe: "$3.75", sandwiches: "$4.50" },
  { guests: "26 to 100", homemade: "$4.50", softServe: "$3.50", sandwiches: "$4.00" },
  { guests: "101 to 300", homemade: "$4.00", softServe: "$3.00", sandwiches: "$3.75" },
  { guests: "301 and up", homemade: "$3.75", softServe: "$2.75", sandwiches: "$3.75" },
] as const;
