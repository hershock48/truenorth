import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/flavors", "/menu", "/order", "/catering", "/about", "/contact", "/marshall", "/battle-creek"].map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: p === "/flavors" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
}
