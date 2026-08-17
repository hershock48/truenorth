"use client";

import { useState } from "react";
import { site } from "@/data/site";

type Status = "idle" | "sending" | "done" | "error";

/**
 * The booking form. Posts JSON to /api/inquiry, which sends from the
 * glazedweb.com verified domain with reply_to set to the customer.
 *
 * The failure path never lies: if sending is not configured or errors, the
 * visitor sees the real phone number and email, not a fake "we got it."
 */
export default function InquiryForm({ variant = "catering" }: { variant?: "catering" | "contact" }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, variant }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof json.error === "string"
            ? json.error
            : `Something went wrong on our end. Please call ${site.cateringPhone} or email ${site.email}.`,
        );
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError(`Something went wrong on our end. Please call ${site.cateringPhone} or email ${site.email}.`);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-[--radius-panel] border border-ink/10 bg-white p-8 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
          Got it. We will get back to you soon.
        </p>
        <p className="mt-3 text-ink-soft">
          Need an answer today? Call{" "}
          <a href={site.cateringPhoneHref} className="font-medium text-north-deep underline-offset-4 hover:underline">
            {site.cateringPhone}
          </a>
          .
        </p>
      </div>
    );
  }

  const isCatering = variant === "catering";

  return (
    /*
      action + method are the no-JS path: the same endpoint accepts a plain
      form post and answers with a real page. With JS, onSubmit intercepts
      and the inline states take over.
    */
    <form
      onSubmit={onSubmit}
      action="/api/inquiry"
      method="post"
      className="rounded-[--radius-panel] border border-ink/10 bg-white p-6 md:p-8"
    >
      <input type="hidden" name="variant" value={variant} />
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="inq-name" className="block text-sm font-semibold text-ink">
            Your name
          </label>
          <input
            id="inq-name"
            name="name"
            required
            autoComplete="name"
            className="mt-1.5 w-full rounded-xl border border-ink/20 bg-cream px-4 py-3 text-ink placeholder:text-ink/45 focus:border-north-deep"
          />
        </div>
        <div>
          <label htmlFor="inq-email" className="block text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="inq-email"
            name="email"
            type="email"
            autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-ink/20 bg-cream px-4 py-3 text-ink placeholder:text-ink/45 focus:border-north-deep"
          />
        </div>
        <div>
          <label htmlFor="inq-phone" className="block text-sm font-semibold text-ink">
            Phone
          </label>
          <input
            id="inq-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="mt-1.5 w-full rounded-xl border border-ink/20 bg-cream px-4 py-3 text-ink placeholder:text-ink/45 focus:border-north-deep"
          />
          <p className="mt-1 text-xs text-ink-soft">A phone number or an email, whichever you prefer.</p>
        </div>

        {isCatering ? (
          <>
            <div>
              <label htmlFor="inq-kind" className="block text-sm font-semibold text-ink">
                What are you planning?
              </label>
              <select
                id="inq-kind"
                name="kind"
                className="mt-1.5 w-full rounded-xl border border-ink/20 bg-cream px-4 py-3 text-ink focus:border-north-deep"
              >
                <option>Event catering</option>
                <option>Custom cake or special order</option>
                <option>Shop rental</option>
                <option>Something else</option>
              </select>
            </div>
            <div>
              <label htmlFor="inq-date" className="block text-sm font-semibold text-ink">
                Date, if you have one
              </label>
              <input
                id="inq-date"
                name="date"
                placeholder="June 14, flexible, etc."
                className="mt-1.5 w-full rounded-xl border border-ink/20 bg-cream px-4 py-3 text-ink placeholder:text-ink/45 focus:border-north-deep"
              />
            </div>
            <div>
              <label htmlFor="inq-guests" className="block text-sm font-semibold text-ink">
                Rough guest count
              </label>
              <input
                id="inq-guests"
                name="guests"
                inputMode="numeric"
                placeholder="50"
                className="mt-1.5 w-full rounded-xl border border-ink/20 bg-cream px-4 py-3 text-ink placeholder:text-ink/45 focus:border-north-deep"
              />
            </div>
          </>
        ) : null}

        <div className="md:col-span-2">
          <label htmlFor="inq-details" className="block text-sm font-semibold text-ink">
            {isCatering ? "Tell us about it" : "Your message"}
          </label>
          <textarea
            id="inq-details"
            name="details"
            required
            rows={4}
            className="mt-1.5 w-full rounded-xl border border-ink/20 bg-cream px-4 py-3 text-ink placeholder:text-ink/45 focus:border-north-deep"
          />
        </div>

        {/* Honeypot. Real people never see this field. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="inq-company">Company</label>
          <input id="inq-company" name="company" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      {status === "error" ? (
        <p role="alert" className="mt-4 rounded-xl bg-cherry/10 px-4 py-3 text-sm font-medium text-cherry">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={status === "sending"} className="btn-primary mt-6 w-full disabled:opacity-60 md:w-auto">
        {status === "sending" ? "Sending…" : isCatering ? "Send the inquiry" : "Send the message"}
      </button>
    </form>
  );
}
