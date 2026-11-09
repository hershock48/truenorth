import type { NextConfig } from "next";

/**
 * Their real domain, both spellings. Everything that must behave differently on
 * the site's own address keys off this one list: the noindex header below and
 * src/app/robots.ts (which keeps its own copy, since a config file cannot be
 * imported into app code).
 */
const realHosts = [
  { type: "host" as const, value: "truenorthicecream.com" },
  { type: "host" as const, value: "www.truenorthicecream.com" },
];

const nextConfig: NextConfig = {
  // NOINDEX EVERYWHERE EXCEPT THEIR OWN DOMAIN.
  //
  // Until 9 Nov 2026 this header went on every response, and the plan was to
  // delete it on launch day. That plan had a trap in it: pointing the domain
  // before the deploy that removed it would have told Google to drop his real
  // site. So the header is now scoped by host instead. The pitch host, the
  // .vercel.app names and any preview keep "noindex, nofollow" forever, because a
  // copy of their content on a Glazed Web address must never compete with them.
  // truenorthicecream.com and www get no header at all, from whatever moment the
  // DNS points here, with nothing to remember on the day.
  //
  // `missing` matches only when NONE of the listed hosts match, so this reads:
  // send the header unless the request is for the real domain. robots.ts follows
  // the same rule, belt and braces as before.
  async headers() {
    return [
      {
        source: "/:path*",
        missing: realHosts,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },

  // THE OLD SITE'S ADDRESSES, so nothing Google has indexed or anybody has
  // bookmarked lands on a 404 after the switch. Read from the WordPress site's own
  // sitemaps on 9 Nov 2026: 79 public URLs. Five survive as they are (/, /about,
  // /contact, /flavors, /menu; the trailing slash is dropped by Next on its own).
  // The other 74 are covered by the rules below, all permanent, so search engines
  // move what those pages had earned onto the new ones. Checked against a
  // production build that day: all 79 end on a 200 page, none on a 404.
  //
  // Each old single-item page goes where that item lives now: a flavor to
  // /flavors, anything with a price on it (cones, sundaes, drinks, treats) to
  // /menu. The named list is the menu side; every other /our-menu/ address was a
  // flavor, which is what the catch-all after it says. Order matters: Next takes
  // the first match, so the specific rules sit above the catch-alls.
  async redirects() {
    const menuItems = [
      "affogato", "banana-split", "bottled-water", "bowl-cone", "bowl-cone-2", "bowl-cone-mini",
      "canned-pop", "cappuccino", "coffee", "double-espresso", "extra-toppings", "fruit-smoothie",
      "hand-dipped", "ice-cream-cake", "ice-cream-nachos", "ice-cream-pie",
      "malts-shakes-floats-coolers", "pick-3", "pup-cup", "sandwiches", "slush", "soft-serve",
      "sundaes", "waffle-cone-bowl",
    ].join("|");
    const flavorCategories = [
      "adult-flavors-21", "dairy-free", "homemade", "homemade-flavors", "soft-serve-flavors",
    ].join("|");
    return [
      { source: "/catering-events", destination: "/catering", permanent: true },
      { source: "/our-menu", destination: "/menu", permanent: true },
      { source: `/our-menu/:item(${menuItems})`, destination: "/menu", permanent: true },
      { source: "/our-menu/:item*", destination: "/flavors", permanent: true },
      { source: "/our-menu-category", destination: "/menu", permanent: true },
      { source: `/our-menu-category/:cat(${flavorCategories})`, destination: "/flavors", permanent: true },
      { source: "/our-menu-category/:cat*", destination: "/menu", permanent: true },
    ];
  },

  // The pitch host split (glaze.md §5): proposal at the root of
  // truenorth.glazedweb.com, the demo site under /demo, and the client's own
  // domain (when it goes live) serving the site at its root with no proposal
  // anywhere. These MUST be in beforeFiles: a plain rewrites() array is
  // afterFiles, which only runs after Next has failed to find a page, and
  // app/page.tsx already answers "/", so the root rewrite would silently
  // never fire. Host scoping rather than basePath, because basePath is global
  // to the build and would bury the real site under /demo on launch day.
  // Accepted wart: links are root-relative, so the /demo prefix drops off
  // after the first click. Nothing 404s.
  // Delete the pitch folder and these rewrites once the client signs or passes.
  //
  // The proposal is a FOLDER (public/pitch/truenorth/), not a lone html file,
  // because it carries its own favicons and its own share card. Without them
  // the page falls back to the origin root and a Glazed sales document goes
  // out wearing the client's own mark and the demo's picture.
  async rewrites() {
    const onPitchHost = [{ type: "host" as const, value: "truenorth.glazedweb.com" }];
    return {
      beforeFiles: [
        { source: "/", destination: "/pitch/truenorth/index.html", has: onPitchHost },
        { source: "/demo", destination: "/", has: onPitchHost },
        { source: "/demo/:path*", destination: "/:path*", has: onPitchHost },
        // The proposal answers at "/" on the pitch host and NOWHERE else. Any
        // other hostname (the .vercel.app name, the client's domain on launch
        // day) asking for /pitch/... gets the 404 it should. Schulers has this
        // guard; this build did not, which left the letter readable at a
        // second address that nothing points at but anything can crawl.
        { source: "/pitch/:path*", destination: "/_not-found", missing: onPitchHost },
      ],
    };
  },
};

export default nextConfig;
