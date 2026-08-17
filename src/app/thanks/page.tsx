import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Message Sent",
  description: "Your message to True North Ice Cream was sent.",
  robots: { index: false },
};

/** Landing page for the no-JS form path. The JS path confirms inline instead. */
export default function ThanksPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-[family-name:var(--font-display)] text-4xl font-bold text-ink">
        Got it. We will get back to you soon.
      </p>
      <p className="mt-4 text-lg text-ink-soft">
        Need an answer today? Call{" "}
        <a href={site.cateringPhoneHref} className="font-medium text-north-deep underline-offset-4 hover:underline">
          {site.cateringPhone}
        </a>{" "}
        or email{" "}
        <a href={`mailto:${site.email}`} className="font-medium text-north-deep underline-offset-4 hover:underline">
          {site.email}
        </a>
        .
      </p>
      <Link href="/" className="btn-primary mt-8">
        Back to the shop
      </Link>
    </div>
  );
}
