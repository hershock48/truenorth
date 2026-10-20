import type { MetadataRoute } from "next";
import { ORDERING_LIVE, site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  /* /order rides the ORDERING_LIVE flag with its page and its endpoint. */
  const paths = [
    "",
    "/flavors",
    "/menu",
    ...(ORDERING_LIVE ? ["/order"] : []),
    "/catering",
    "/about",
    "/contact",
    "/marshall",
    "/battle-creek",
  ];
  return paths.map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: p === "/flavors" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
}
