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
  // Delete the pitch file and these rewrites once the client signs or passes.
  async rewrites() {
    const onPitchHost = [{ type: "host" as const, value: "truenorth.glazedweb.com" }];
    return {
      beforeFiles: [
        { source: "/", destination: "/pitch/truenorth.html", has: onPitchHost },
        { source: "/demo", destination: "/", has: onPitchHost },
        { source: "/demo/:path*", destination: "/:path*", has: onPitchHost },
      ],
    };
  },
};

export default nextConfig;
