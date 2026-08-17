/**
 * Every business fact lives here and nowhere else, so a correction is one edit.
 * Facts came from truenorthicecream.com and the Choose Marshall welcome article,
 * August 2026. Anything marked PLACEHOLDER is unconfirmed and is listed on the
 * README's before-launch checklist.
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

export type Location = {
  key: "marshall" | "battlecreek";
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  phoneHref: string;
  /** A short line of character for the location card. */
  note: string;
};

export const locations: Location[] = [
  {
    key: "marshall",
    name: "Marshall",
    street: "403 S Kalamazoo Ave",
    city: "Marshall",
    state: "MI",
    zip: "49068",
    phone: "(269) 781-7623",
    phoneHref: "tel:+12697817623",
    note: "The original shop, scooping since 2021.",
  },
  {
    key: "battlecreek",
    name: "Battle Creek",
    street: "928 W Columbia Ave",
    city: "Battle Creek",
    state: "MI",
    zip: "49015",
    phone: "(269) 224-6188",
    phoneHref: "tel:+12692246188",
    note: "Same ice cream, made the same way, closer to home.",
  },
];

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

/**
 * Hours. 12 to 9, every day, both shops — the current site says so on every
 * page. (Its homepage meta description still says "2-9", which is one of the
 * findings that started this project. The article-era hours were 2-9 weekdays;
 * 12-9 is what they publish now and what the Battle Creek opening post said.)
 * Confirm with the owners before launch; it is one edit, here.
 */
export type Hours = { day: number; label: string; short: string; open: number; close: number };

export const hours: Hours[] = [
  { day: 0, label: "Sunday", short: "Sun", open: 12, close: 21 },
  { day: 1, label: "Monday", short: "Mon", open: 12, close: 21 },
  { day: 2, label: "Tuesday", short: "Tue", open: 12, close: 21 },
  { day: 3, label: "Wednesday", short: "Wed", open: 12, close: 21 },
  { day: 4, label: "Thursday", short: "Thu", open: 12, close: 21 },
  { day: 5, label: "Friday", short: "Fri", open: 12, close: 21 },
  { day: 6, label: "Saturday", short: "Sat", open: 12, close: 21 },
];

export function formatHour(h: number) {
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${suffix}`;
}

export const hoursSummary = "Open 12pm to 9pm, every day";
