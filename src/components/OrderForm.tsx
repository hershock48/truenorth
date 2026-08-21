"use client";

import { useMemo, useState } from "react";
import OpenNow from "@/components/OpenNow";
import { orderablesFor } from "@/data/menu";
import { fullAddress, locations, site, type Location } from "@/data/site";

type Status = "idle" | "sending" | "done" | "error";

/**
 * Order-ahead for pickup, wired PER SHOP: the shop picker is the first step,
 * the `preselect` prop (the ?at= slug, read server-side by the page so this
 * form prerenders into the HTML — see order/page.tsx for why) points it at
 * the right counter, and the item list is that shop's own — soft serve pints
 * only show for Marshall because the data says so, not the form. Same
 * contract as InquiryForm: JSON post with JS, plain form post without, and
 * the failure path tells the truth with a phone number.
 *
 * No payment on purpose. This is v1 — order goes to the shop's inbox, customer
 * pays at the counter. Stripe/Square hosted checkout is the launch upgrade on
 * the README checklist.
 */
export default function OrderForm({ preselect }: { preselect?: string }) {
  const preselected =
    locations.find((l) => l.slug === preselect)?.key ?? locations[0].key;

  const [storeKey, setStoreKey] = useState<Location["key"]>(preselected);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const store = locations.find((l) => l.key === storeKey)!;
  const items = useMemo(() => orderablesFor(storeKey), [storeKey]);
  const anyChosen = items.some((i) => (qty[i.key] ?? 0) > 0);

  const estimate = items.reduce((sum, i) => {
    const n = qty[i.key] ?? 0;
    const price = Number(i.price.replace(/[^0-9.]/g, ""));
    return sum + (Number.isFinite(price) ? n * price : 0);
  }, 0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!anyChosen) {
      setError("Pick at least one thing to order.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setError("");

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof json.error === "string"
            ? json.error
            : `Something went wrong on our end. Please call ${store.phone}.`,
        );
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError(`Something went wrong on our end. Please call ${store.phone}.`);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-[--radius-panel] border border-ink/10 bg-white p-8 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
          Order in. The {store.name} shop will confirm shortly.
        </p>
        <p className="mt-3 text-ink-soft">
          Questions in the meantime? Call{" "}
          <a href={store.phoneHref} className="font-medium text-north-deep underline-offset-4 hover:underline">
            {store.phone}
          </a>
          . You pay at pickup — card or cash.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      action="/api/order"
      method="post"
      className="grid items-start gap-8 md:grid-cols-[1fr_1.2fr]"
    >
      {/* Step one: which counter. */}
      <fieldset>
        <legend className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
          Picking up at
        </legend>
        <div className="mt-4 grid gap-4">
          {locations.map((l) => (
            <label
              key={l.key}
              className={`block cursor-pointer rounded-[--radius-panel] border-2 bg-white p-5 transition-colors ${
                storeKey === l.key ? "border-north-deep" : "border-ink/10 hover:border-ink/25"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-ink">
                  {l.name}
                </span>
                <input
                  type="radio"
                  name="store"
                  value={l.key}
                  checked={storeKey === l.key}
                  onChange={() => setStoreKey(l.key)}
                  className="h-4 w-4 accent-[--color-north-deep]"
                />
              </span>
              <span className="mt-1 block text-sm text-ink-soft">{fullAddress(l)}</span>
              <span className="mt-1 block text-sm font-medium text-ink">{l.hoursSummary}</span>
              <span className="mt-2 block">
                <OpenNow location={l} />
              </span>
            </label>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          The two shops scoop different things — switching shops updates the
          list. Cakes and pies need a few days; the shop confirms timing when
          they confirm the order.
        </p>
      </fieldset>

      {/* Step two: the freezer list, this shop's own. */}
      <div className="rounded-[--radius-panel] border border-ink/10 bg-white p-6 md:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
          From the {store.name} freezer
        </h2>
        <ul className="mt-4 divide-y divide-ink/5">
          {items.map((item) => {
            const n = qty[item.key] ?? 0;
            const id = `qty-${item.key}`;
            return (
              <li key={item.key} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <label htmlFor={id} className="font-medium text-ink">
                    {item.name}{" "}
                    <span className="font-semibold text-north-deep">{item.price}</span>
                  </label>
                  {item.note ? <p className="text-sm text-ink-soft">{item.note}</p> : null}
                </div>
                <input
                  id={id}
                  name={id}
                  type="number"
                  min={0}
                  max={20}
                  value={n === 0 ? "" : n}
                  placeholder="0"
                  onChange={(e) =>
                    setQty((q) => ({
                      ...q,
                      [item.key]: Math.max(0, Math.min(20, Number(e.target.value) || 0)),
                    }))
                  }
                  className="w-20 rounded-xl border border-ink/20 bg-cream px-3 py-2.5 text-center text-ink focus:border-north-deep"
                />
              </li>
            );
          })}
        </ul>

        <div className="mt-5 grid gap-5">
          <div>
            <label htmlFor="ord-flavors" className="block text-sm font-semibold text-ink">
              Flavors and requests
            </label>
            <textarea
              id="ord-flavors"
              name="flavors"
              rows={3}
              placeholder="Two mint chip pints and a quart of whatever chocolate is in the case…"
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-cream px-4 py-3 text-ink placeholder:text-ink/45 focus:border-north-deep"
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="ord-pickup" className="block text-sm font-semibold text-ink">
                When are you coming?
              </label>
              <input
                id="ord-pickup"
                name="pickup"
                required
                placeholder="Tomorrow around 4pm"
                className="mt-1.5 w-full rounded-xl border border-ink/20 bg-cream px-4 py-3 text-ink placeholder:text-ink/45 focus:border-north-deep"
              />
            </div>
            <div>
              <label htmlFor="ord-name" className="block text-sm font-semibold text-ink">
                Your name
              </label>
              <input
                id="ord-name"
                name="name"
                required
                autoComplete="name"
                className="mt-1.5 w-full rounded-xl border border-ink/20 bg-cream px-4 py-3 text-ink focus:border-north-deep"
              />
            </div>
            <div>
              <label htmlFor="ord-phone" className="block text-sm font-semibold text-ink">
                Phone
              </label>
              <input
                id="ord-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="mt-1.5 w-full rounded-xl border border-ink/20 bg-cream px-4 py-3 text-ink focus:border-north-deep"
              />
              <p className="mt-1 text-xs text-ink-soft">A phone number or an email, whichever you prefer.</p>
            </div>
            <div>
              <label htmlFor="ord-email" className="block text-sm font-semibold text-ink">
                Email
              </label>
              <input
                id="ord-email"
                name="email"
                type="email"
                autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-ink/20 bg-cream px-4 py-3 text-ink focus:border-north-deep"
              />
            </div>
          </div>

          {/* Honeypot. Real people never see this field. */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="ord-company">Company</label>
            <input id="ord-company" name="company" tabIndex={-1} autoComplete="off" />
          </div>
        </div>

        {status === "error" ? (
          <p role="alert" className="mt-4 rounded-xl bg-cherry/10 px-4 py-3 text-sm font-medium text-cherry-deep">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-ink-soft">
            {estimate > 0 ? (
              <>
                Estimated <span className="font-semibold text-ink">${estimate.toFixed(2)}</span> —
                pay at pickup.
              </>
            ) : (
              <>Nothing is charged online — you pay at the counter.</>
            )}
          </p>
          <button
            type="submit"
            disabled={status === "sending"}
            className="btn-primary disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : `Send to the ${store.name} shop`}
          </button>
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Rather talk to a person? Call {store.name} at{" "}
          <a href={store.phoneHref} className="tap font-medium text-north-deep underline-offset-4 hover:underline">
            {store.phone}
          </a>{" "}
          or email{" "}
          <a href={`mailto:${site.email}`} className="tap font-medium text-north-deep underline-offset-4 hover:underline">
            {site.email}
          </a>
          .
        </p>
      </div>
    </form>
  );
}
