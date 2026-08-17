import type { Metadata } from "next";
import { Sora, Figtree } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { site, locations, hours } from "@/data/site";

/**
 * Sora carries display sizes: geometric and slightly technical, which is the
 * compass side of the brand. Figtree carries body copy, which is the warm
 * side. Both are downloaded at build time by next/font — nothing is fetched
 * from a third party at runtime.
 */
const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Homemade Ice Cream in Marshall and Battle Creek, MI`,
    template: `%s | ${site.name}`,
  },
  description: site.blurb,
  keywords: [
    "True North Ice Cream",
    "ice cream Marshall MI",
    "ice cream Battle Creek MI",
    "homemade ice cream Michigan",
    "ice cream cakes Marshall",
    "ice cream catering Michigan",
    "soft serve Marshall MI",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: site.name,
    title: `${site.name} | Homemade ice cream, made fresh daily`,
    description: site.blurb,
    /*
      ABSOLUTE, ON THE PITCH HOST, DELIBERATELY — for now. A relative /og.jpg
      resolves against metadataBase (their real domain), where nothing is
      deployed yet, so sharing the demo would show no picture. glaze.md §3:
      og:image lives on an origin that actually serves it. At launch this
      goes back to plain "/og.jpg" — it is on the README checklist.
    */
    images: [
      {
        url: "https://truenorth.glazedweb.com/og.jpg",
        width: 1200,
        height: 630,
        alt: "True North Ice Cream",
      },
    ],
  },
  /*
    Card type only. A root twitter block carrying title/description/image is
    inherited by every sub-page, and a page overriding openGraph would still
    hand the homepage's card to any scraper that prefers twitter:* tags.
  */
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  icons: { icon: "/brand/logo.png" },
};

/*
  One IceCreamShop node per location, linked from an Organization node, so
  each shop can carry its own address, phone, and map. Hours come from the
  same constants the visible site renders — one edit changes both.
*/
const hoursSpec = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: `${String(hours[0].open).padStart(2, "0")}:00`,
    closes: `${String(hours[0].close).padStart(2, "0")}:00`,
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#org`,
      name: site.name,
      url: site.url,
      email: site.email,
      sameAs: [site.social.facebook],
      foundingDate: String(site.established),
    },
    ...locations.map((l) => ({
      "@type": "IceCreamShop",
      "@id": `${site.url}/#${l.key}`,
      name: `${site.name} ${l.name}`,
      parentOrganization: { "@id": `${site.url}/#org` },
      url: site.url,
      telephone: l.phone,
      servesCuisine: ["Ice Cream", "Dessert"],
      priceRange: "$",
      address: {
        "@type": "PostalAddress",
        streetAddress: l.street,
        addressLocality: l.city,
        addressRegion: l.state,
        postalCode: l.zip,
        addressCountry: "US",
      },
      openingHoursSpecification: hoursSpec,
      hasMenu: `${site.url}/menu`,
    })),
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        {/*
          Flags that JS is available, before first paint. Reveal animations
          only engage on .js, so without this everything renders visible and
          nothing ever flashes.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-cream"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
