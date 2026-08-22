import type { MetadataRoute } from "next";

/**
 * Disallow everything. This is a spec build on a Glazed Web host, indexing
 * it would put a duplicate of True North's content in competition with them.
 * next.config.ts sends X-Robots-Tag on every response as the second lock.
 * Both flip together on launch day; it is on the README checklist.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
