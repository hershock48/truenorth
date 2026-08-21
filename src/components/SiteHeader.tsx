"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AnimatedLogo from "@/components/AnimatedLogo";
import ShopBar from "@/components/ShopBar";
import { usePathname } from "next/navigation";
import { site } from "@/data/site";

const links = [
  { href: "/flavors", label: "Flavors" },
  { href: "/menu", label: "Menu" },
  { href: "/order", label: "Order" },
  { href: "/catering", label: "Catering" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement | null>(null);
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);

  /* Publish the measured header height so anchor offsets stay honest at
     every breakpoint instead of trusting a hardcoded guess. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () =>
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close the mobile menu on navigation, or it hides the page you arrived at. */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      ref={ref}
      data-stuck={stuck ? "" : undefined}
      className="site-header sticky top-0 z-40 bg-cream/95 backdrop-blur"
    >
      {/* Inside <header> so the measured --header-h includes it. */}
      <ShopBar />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center" aria-label={`${site.name} home`}>
          {/*
            Their real logo with the compass star alive: scroll knocks the
            needle, stopping lets it settle back on north. See AnimatedLogo
            for how the mark stays pixel-identical to their PNG at rest.
          */}
          <AnimatedLogo className="h-9 md:h-10" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className="nav-link relative text-[0.95rem] font-semibold text-ink"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/catering#inquiry" className="btn-primary !px-5 !py-2.5 text-sm">
            Book catering
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="tap rounded-lg px-3 py-2 text-sm font-semibold text-ink md:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Main menu"
        className={`${open ? "block" : "hidden"} border-t border-ink/10 bg-cream px-5 pb-5 pt-2 md:hidden`}
      >
        <ul>
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className="tap block w-full py-1 text-base font-semibold text-ink"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/catering#inquiry" className="btn-primary mt-3 w-full text-sm">
          Book catering
        </Link>
      </nav>
    </header>
  );
}
