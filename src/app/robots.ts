import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { site } from "@/data/site";

/**
 * Open on their own domain, shut everywhere else. The same rule as the
 * X-Robots-Tag header in next.config.ts, which keeps the list of real hosts;
 * this is the second lock, because robots.txt is a request well-behaved
 * crawlers honor and the header is an instruction on every response.
 *
 * Scoped by host since 9 Nov 2026 so launch day has nothing to flip: the pitch
 * host and every .vercel.app name stay disallowed for good, and
 * truenorthicecream.com is crawlable the moment the DNS points here.
 */
const REAL_HOSTS = new Set(["truenorthicecream.com", "www.truenorthicecream.com"]);

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").toLowerCase().split(":")[0];
  if (REAL_HOSTS.has(host)) {
    return {
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${site.url}/sitemap.xml`,
    };
  }
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
