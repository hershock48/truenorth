import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOINDEX, DELIBERATELY, UNTIL THIS IS THEIR SITE.
  //
  // This is a spec build: a full copy of True North Ice Cream's content, menu, and
  // flavors, served from a hostname that is not theirs. Letting search engines index
  // it competes with the business we are trying to win, and a duplicate of their
  // content on a Glazed Web domain is a fair complaint waiting to happen.
  //
  // src/app/robots.ts disallows everything, and this header is the belt to its
  // braces: robots.txt is a request that well-behaved crawlers honor, X-Robots-Tag
  // is an instruction on every response, and the two disagree less often than one
  // of them gets forgotten.
  //
  // Remove BOTH on the day it becomes their site, and not before. It is on the
  // before-launch checklist in the README.
  async headers() {
    return [
      { source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
