# True North Ice Cream, concept rebuild

Spec build of [truenorthicecream.com](https://truenorthicecream.com) by
[Glazed Web](https://glazedweb.com), August 2026. Next.js App Router, TypeScript,
Tailwind 4, no CMS, no paid services. The client has not bought this; the footer
carries the studio credit until they do ("Double Dipped by", Kevin's Aug 2026
override of the glaze.md "Concept build by" spec-build wording).

## Run it

```
npm install
npm run build && npm start     # audit against THIS, never the dev server
npm run dev                    # development only
```

## Where content lives

Every fact is in `src/data/` and nowhere else:

- `site.ts`, names, addresses, phones, hours, socials. One edit per correction.
- `flavors.ts`, **the flavor board.** This file is the "In the Case Today"
  feature: edit the lists, and the flavors page, homepage teaser, and counts all
  update together. Update `boardUpdated` when you touch it; it renders on the page.
- `menu.ts`, the menu with prices, and the catering tiers.

Surfaces that cannot read from these constants: `public/og.jpg` (a rendered
image; remake it if the logo or tagline changes) and the copy on `/about`
(prose, checked by hand). You cannot grep a JPEG.

## Traps, this will break if you do not know

- **The noindex is deliberate and lives in TWO places:** `src/app/robots.ts`
  (disallow all) and `next.config.ts` (`X-Robots-Tag` on every response). This is
  a spec build on a Glazed Web host; indexing it would compete with the client
  for their own name. Remove BOTH on launch day, and not before.
- **`.gitignore` is `.env*` plus `!.env.example`.** A bare `.env*` silently
  ignores the example file too, that is how glazedweb itself ended up unable to
  track the file its docs call the authority.
- **The melt edge (`MeltEdge`) must receive the EXACT background color of the
  band above it** or a seam appears. Same contract as Glazed's drip divider.
- **The reveal system hides content only after JS flags `<html class="js">`.**
  No JS, no hiding, crawlers and no-JS visitors get a complete page. Do not
  "simplify" the flag away.
- **`min-w-0` on the catering grid columns is load-bearing.** Without it the
  pricing table's min-width widens the grid column past the viewport instead of
  scrolling inside its card (grid `min-width:auto` blowout, found at 320px).
- **No `scroll-behavior: smooth`, deliberately.** It breaks measurement
  harnesses (glaze.md §8) and instant anchor jumps are fine.
- **The scrollable pricing table carries `tabIndex={0}` + `role="region"`.**
  Removing them re-introduces the one axe violation this build ever had.
- **Logo hole:** the logo PNG is flat teal with alpha, so it sits on any
  background. If it is ever traced to SVG, keep the compass holes real holes.

## Forms

`/api/inquiry` (catering + contact variants) and `/api/order` (pickup orders).
Both send via Resend **from the glazedweb.com verified domain** with `reply_to`
set to the customer, so client DNS is never on the critical path. See
`.env.example` for the variables; Kevin sets real values in the Vercel
dashboard. Orders deliver to `ORDER_TO` if set, else `INQUIRY_TO`, per-store
inboxes are a one-line env change when the owners want them.

`/api/order` specifics: item names and prices resolve server-side from
`orderables` in `menu.ts` (a tampered post cannot invent a price), quantities
clamp to 0–20, and an item the chosen shop doesn't carry is refused. **No
payment in v1, deliberately**: order-to-inbox, pay at the counter, honest and
zero-dependency for the pitch. Stripe/Square hosted checkout is the launch
upgrade (checklist).

Behavior, verified by hand on the production build:

- JS path: inline states, honest failure copy with the real phone number.
- No-JS path: the same endpoint accepts a plain form post; success redirects to
  `/thanks` (303), failure returns a small real HTML page with the message and a
  link back to the form.
- Unconfigured (`RESEND_API_KEY`/`INQUIRY_TO` missing): visitor is told the
  truth (503) and given phone + email, and the full payload is written to the
  server log so nothing a customer typed is lost. It never fakes an "ok".
- Honeypot field `company` silently accepts and discards bots.

## Decisions, with reasoning

- **Palette is measured, not styled.** All 31,121 opaque pixels of their logo
  PNG are exactly `#2A8196`. That teal fails AA for small text on cream (4.24),
  so `--color-north-deep #1B6479` (6.31) carries buttons and small text while
  the true logo teal carries the mark and display sizes. Ratios are in
  `globals.css` next to the tokens.
- **The compass ornament (`CompassRose`) is deliberately NOT the logo**, house
  rule says never redraw a client's mark next to their type. It is site
  furniture in the same geometric vocabulary. The real mark is `/brand/logo.png`.
- **Signature motion is the melt** (cream dripping off a band edge, CSS mask,
  transforms only) plus a compass needle that settles on north when scrolled
  into view. Resting states are the finished drawing; reduced motion gets a
  complete, static page (verified, not assumed).
- **The flavor board is a data file, not a CMS.** Editing `flavors.ts` takes
  under a minute and costs nothing monthly, which is the studio's whole pitch.
  If the owners want to edit from a phone without a deploy, that is a scoped
  follow-on (small admin + KV), not a reason to rent a CMS today.
- **"Strawberry Lemondade"** on their live flavors page is corrected to
  "Lemonade" here; allergen "(N)/(G)" suffixes became structured badges.
- **Footer plate inverts to cream** (`--gw-plate #FDF6EC` under the `#17303A`
  footer, measured 12.87; chocolate would be 1.27, invisible). Values and
  reasoning in `globals.css`, procedure in glaze.md.
- **Hours are per shop: Marshall 12–9 daily, Battle Creek 2–9 daily**, each
  shop's own Google Business profile, checked Aug 21, 2026. This explains why
  their current site contradicts itself (header "12–9", hero "2–9"): each
  number belongs to a different store and the single-store template never
  split them. Bonus pitch finding: the Marshall Google profile lists Friday as
  "12 AM–9 PM", a midnight typo that third-party listings (Restaurantji,
  Bing) have scraped verbatim. Offer to fix the profile as part of onboarding.
- **The site is store-first**, the full pjs pattern, per the owner (Aug 2026):
  each shop is a destination you click into. `/marshall` and `/battle-creek`
  carry their own hours, their own filtered menu (`menuFor` in `menu.ts` honors
  `at` tags on sections and items), and their own order entry point; a ShopBar
  strip inside the header puts both shops one tap from every page; homepage
  cards and the order form route people to their counter. JSON-LD gives each
  IceCreamShop node its own hours and URL. "Ice cream Battle Creek MI" now has
  a page that answers for Battle Creek.
- **Store tags rest on the public record**, the Choose Marshall article puts
  the soft serve machine and espresso bar in Marshall, so soft serve, affogato,
  espresso drinks, and matcha are tagged `marshall` today. Every tag is one
  edit in `menu.ts` when the owners correct the split (checklist).
- **The tag mechanism lives ONCE, in `src/data/shops.ts`**, filter, chip
  label, and the narrowing rule (a child's `at` narrows its parent's, never
  widens; a contradictory nesting is hidden everywhere and chip-less). Before
  this module there were five hand-rolled copies and the chip labeler had
  already drifted from the filters. Do not re-inline any of it. Same idea for
  URLs: every link into a shop goes through `shopHref`/`orderHref`/
  `shopCaseHref`/`shopMenuHref` in `site.ts`, the /order?at= param is the
  SLUG, and a bare `l.key` would silently preselect the wrong shop for
  Battle Creek.
- **/order is request-rendered, deliberately.** The page reads `?at=`
  server-side and passes it to the form as a prop. An earlier version used
  `useSearchParams` in the client component, which bailed the form out of the
  prerendered HTML entirely, blank page before hydration, dead end without
  JS. If you "optimize" this back to static, you will reintroduce that.
- **The flavor board is store-aware too**, `boardsFor` in `flavors.ts` filters
  boards and flavors by the same `at` convention (soft serve board → Marshall),
  each shop page renders its own case under `#case`, and the shared flavors
  page marks anything one shop scoops alone. The hand-scooped flavors are
  untagged until the owners hand over each shop's real case list (checklist), 
  the structure is ready, the data waits for facts.
- **"Whose shop?" is never ambiguous**, every surface that answers a customer
  question resolves through a shop: the header ShopBar entries are visible
  buttons (border, hover, arrow), the hero shop rows are doors into the shop
  pages, the homepage case band links each shop's case, and /flavors and
  /menu open with per-shop entry buttons. The UX rule, from the pjs build: the
  customer picks their counter first; everything else renders through it.

## Audit state (August 17, 2026, this sandbox)

`tools/` carries the studio harnesses (copied from the glazedweb repo, install
`npm install axe-core playwright-core --no-save`, both together). Against the
production build, all seven routes at 390 and 1440:

- axe violations: **0** · horizontal overflow: **none** (320 also checked) ·
  console errors: **none** · 4xx/5xx: **none** · contrast (reduced-motion
  settled state): **no failures**
- Plate render verified: `.gw-plate` computed cream, drip inherits footer ink.
- Google Maps embeds return 502 **in this sandbox only** (egress-blocked); they
  load from any normal network. Verify on the deployment.
- **Total JS ~184KB gzipped, over the 150KB budget line.** Almost all of it is
  the Next 16 + React 19 baseline; page code is a few KB. Recorded rather than
  hidden: trimming below 150KB means leaving the framework, not tuning this app.
- `npm audit`: 0 vulnerabilities at install time.

## Before launch (when this stops being a spec build)

- [ ] Remove the noindex from BOTH `robots.ts` and `next.config.ts`
- [ ] og:image in `layout.tsx` is pinned to the truenorth.glazedweb.com host so
      shares show a picture during the pitch, change it back to "/og.jpg" so it
      resolves against the real domain at launch
- [ ] Point the canonical host at the client's real domain everywhere it appears
- [ ] Set `RESEND_API_KEY`, `INQUIRY_TO` (owner-confirmed, human-monitored inbox),
      `ORDER/INQUIRY_FROM` in Vercel; submit both forms; confirm arrival in the real inbox
- [ ] Replace the PLACEHOLDER Instagram URL in `site.ts` with their real handle
- [ ] Confirm the Battle Creek opening year on `/about` (PLACEHOLDER comment)
- [ ] Confirm per-shop hours with the owners (Marshall 12–9 daily, Battle Creek
      2–9 daily, per each shop's Google Business profile, Aug 21, 2026) and
      every price in `menu.ts`
- [ ] Confirm the per-shop offerings lines in `site.ts`, which shop runs the
      soft serve machine and the espresso bar (sources put both in Marshall;
      Battle Creek unconfirmed)
- [ ] Get each shop's real daily case list from the owners and tag
      `flavors.ts` (`at:` per flavor), the boards are store-aware but the
      hand-scooped flavors are untagged until the owners split them.
      (Or skip the tags entirely: set `SCOOPLIST_FEED_URL` and the boards
      render live from the owner's Scooplist case, `src/data/liveCase.ts`,
      static fallback on any feed failure. The scooplist repo is the app.)
- [ ] Tell the owners their Marshall Google profile lists Friday as "12 AM–9 PM"
      (midnight typo), offer to fix it with them
- [ ] Matcha is listed with price "Ask" (PLACEHOLDER), get the real price, and the
      rest of the espresso-bar lineup while at it
- [ ] Ordering v1 (`/order`, order-to-inbox, pay at counter) is live, set
      `ORDER_TO` (or let it fall back to `INQUIRY_TO`), submit a test order,
      confirm arrival; ask the owners if each store wants its own inbox
- [ ] Upgrade ordering to paid checkout when the owners want it: Stripe or
      Square hosted checkout, built in, nothing rented
- [ ] Confirm current flavor lists and set `boardUpdated`
- [ ] Verify Google Maps embeds on the deployed URL
- [ ] LCP < 2.5s / CLS < 0.1 on a throttled mobile profile against the deployment
- [ ] Check anything visually unusual on a real iPhone (headless WebKit lies)
- [ ] Tell the owners the studio credit is there, and what removing it takes (one line)
