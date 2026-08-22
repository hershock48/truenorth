/**
 * Every business fact lives here and nowhere else, so a correction is one edit.
 * Facts came from truenorthicecream.com, the Choose Marshall welcome article,
 * and each shop's Google Business profile (checked August 21, 2026). Anything
 * marked PLACEHOLDER is unconfirmed and is listed on the README's
 * before-launch checklist.
 */

export const site = {
  name: "True North Ice Cream",
  shortName: "True North",
  /** Their own words, from the current site. */
  tagline: "Happiness is homemade.",
  blurb:
    "Homemade ice cream made fresh daily in Marshall and Battle Creek, Michigan. Around thirty hand-scooped flavors at a time, soft serve, dairy-free options, ice cream cakes, and catering for weddings, birthdays, and everything between.",
  established: 2021,
  /** Canonical host. Their real domain, never the vercel.app one. */
  url: "https://truenorthicecream.com",
  email: "truenorthicecream@gmail.com",
  /** The catering line published on their catering page. */
  cateringPhone: "(517) 937-6299",
  cateringPhoneHref: "tel:+15179376299",
  social: {
    facebook: "https://www.facebook.com/Truenorthicecream",
    /** PLACEHOLDER: their site links Instagram but the handle is unconfirmed. */
    instagram: "https://www.instagram.com/",
    yelpMarshall: "https://www.yelp.com/biz/true-north-ice-cream-marshall",
    yelpBattleCreek: "https://www.yelp.com/biz/true-north-icecream-battle-creek",
  },
} as const;

export type Hours = { day: number; label: string; short: string; open: number; close: number };

function daily(open: number, close: number): Hours[] {
  return [
    { day: 0, label: "Sunday", short: "Sun", open, close },
    { day: 1, label: "Monday", short: "Mon", open, close },
    { day: 2, label: "Tuesday", short: "Tue", open, close },
    { day: 3, label: "Wednesday", short: "Wed", open, close },
    { day: 4, label: "Thursday", short: "Thu", open, close },
    { day: 5, label: "Friday", short: "Fri", open, close },
    { day: 6, label: "Saturday", short: "Sat", open, close },
  ];
}

export type Location = {
  key: "marshall" | "battlecreek";
  /** URL segment for the shop's own page. */
  slug: "marshall" | "battle-creek";
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  phoneHref: string;
  /** A short line of character for the location card. */
  note: string;
  /** What this shop in particular does, kept to confirmed facts. */
  offerings: string;
  /**
   * Hours are PER SHOP because they genuinely differ, the finding that shaped
   * this layout. Each shop's Google Business profile (Aug 21, 2026): Marshall
   * noon–9 daily, Battle Creek 2–9 daily. Their current site contradicts
   * itself, header "12–9", hero "2–9", because each number belongs to a
   * different store and the single-store-era template never split them. (The
   * Marshall profile also lists Friday as "12 AM–9 PM", a midnight typo that
   * third-party listings have been scraping verbatim.) Confirm both schedules
   * with the owners before launch; it is one edit, here.
   */
  hours: Hours[];
  /** The one-line version for cards and ledes. */
  hoursSummary: string;
};

export const locations: Location[] = [
  {
    key: "marshall",
    slug: "marshall",
    name: "Marshall",
    street: "403 S Kalamazoo Ave",
    city: "Marshall",
    state: "MI",
    zip: "49068",
    phone: "(269) 781-7623",
    phoneHref: "tel:+12697817623",
    note: "The original shop, scooping since 2021.",
    offerings:
      "The full spread: the hand-scooped case, the soft serve machine, and the espresso bar, with a walk-up window and outdoor tables.",
    hours: daily(12, 21),
    hoursSummary: "Open noon to 9pm, every day",
  },
  {
    key: "battlecreek",
    slug: "battle-creek",
    name: "Battle Creek",
    street: "928 W Columbia Ave",
    city: "Battle Creek",
    state: "MI",
    zip: "49015",
    phone: "(269) 224-6188",
    phoneHref: "tel:+12692246188",
    note: "Same ice cream, made the same way, closer to home.",
    offerings:
      "Hand-scooped flavors and waffle cones made fresh in the shop, with a deep dairy-free and sorbet lineup.",
    hours: daily(14, 21),
    hoursSummary: "Open 2 to 9pm, every day",
  },
];

/*
  ORDERING IS BUILT AND OFF.

  /order and /api/order work end to end (see the README), but the demo does
  not show them: an order button in front of the owner promises a service
  nobody has switched on yet, and "it does not really send" is the wrong
  sentence to say in a pitch. Flip this to true the day ORDER_TO is set and
  the owners want it - every entry point reads this one flag.
*/
export const ORDERING_LIVE = false;

export function locationBySlug(slug: string) {
  return locations.find((l) => l.slug === slug);
}

/*
  Every link into a shop goes through these, so the URL contracts live in one
  place: the /order?at= param is the SLUG (OrderForm matches on slug, a bare
  l.key would silently preselect the wrong shop for Battle Creek), and the
  #case / #menu anchors must match the section ids LocationPage renders.
*/
export function shopHref(l: Location) {
  return `/${l.slug}`;
}
export function orderHref(l: Location) {
  return `/order?at=${l.slug}`;
}
/** Section ids on the shop pages; LocationPage renders these, links target them. */
export const shopAnchors = { case: "case", menu: "menu" } as const;
export function shopCaseHref(l: Location) {
  return `${shopHref(l)}#${shopAnchors.case}`;
}
export function shopMenuHref(l: Location) {
  return `${shopHref(l)}#${shopAnchors.menu}`;
}

export function fullAddress(l: Location) {
  return `${l.street}, ${l.city}, ${l.state} ${l.zip}`;
}

export function mapsUrl(l: Location) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${site.name}, ${fullAddress(l)}`,
  )}`;
}

export function mapsEmbedUrl(l: Location) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress(l))}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
}

export function formatHour(h: number) {
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${suffix}`;
}
