import { NextResponse } from "next/server";
import { Resend } from "resend";
import { orderables } from "@/data/menu";
import { locations } from "@/data/site";

export const runtime = "nodejs";

/**
 * Pickup orders, one route for both shops — the store field says which
 * counter pulls the order. Same contract as /api/inquiry: JSON from the JS
 * form or a plain form post without JS, honeypot, and a failure path that
 * tells the truth (phone number, payload logged) instead of a fake "ok".
 *
 * Item names and prices come from the orderables list server-side, never
 * from the request, so a tampered post cannot invent a $1 cake. Quantities
 * are clamped to 0–20. No payment here on purpose: v1 is order-to-inbox,
 * pay at the counter; hosted checkout is the launch upgrade (README).
 *
 * Delivery: ORDER_TO if set (can differ per deployment), else INQUIRY_TO —
 * both shops read the same inbox today; per-store inboxes are a one-line env
 * change when the owners want them.
 */

const MAX = { name: 120, email: 200, phone: 40, text: 1000 };

function clean(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function looksLikeEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function escapeHtml(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlPage(title: string, message: string, status: number, backHref: string) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;background:#FDF8EE;color:#17303A;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center">
<div><h1 style="font-size:1.6rem">${title}</h1><p style="max-width:34rem;line-height:1.6">${message}</p>
<p><a href="${backHref}" style="color:#1B6479">Go back to the order form</a></p></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isForm = !contentType.includes("application/json");

  let b: Record<string, unknown>;
  if (isForm) {
    try {
      const fd = await request.formData();
      b = Object.fromEntries(fd.entries());
    } catch {
      return htmlPage("That did not work", "The form could not be read. Please go back and try again.", 400, "/order");
    }
  } else {
    try {
      b = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
  }

  const fail = (error: string, status: number) =>
    isForm ? htmlPage("One more thing", error, status, "/order") : NextResponse.json({ error }, { status });

  // Honeypot. Real people never fill this in because they never see it.
  if (clean(b.company, 100)) {
    return isForm
      ? NextResponse.redirect(new URL("/thanks", request.url), 303)
      : NextResponse.json({ ok: true });
  }

  const store = locations.find((l) => l.key === clean(b.store, 20));
  const name = clean(b.name, MAX.name);
  const email = clean(b.email, MAX.email);
  const phone = clean(b.phone, MAX.phone);
  const pickup = clean(b.pickup, 120);
  const flavors = clean(b.flavors, MAX.text);

  if (!store) return fail("Please pick a shop for pickup.", 400);
  if (!name) return fail("Please add your name.", 400);
  if (!phone && !email) {
    return fail("Please add a phone number or an email so the shop can confirm your order.", 400);
  }
  if (email && !looksLikeEmail(email)) {
    return fail("That email does not look right.", 400);
  }

  // Quantities come as qty-{key}; names and prices resolve server-side, and
  // an item the chosen shop does not carry is refused, not silently accepted.
  const lines: { name: string; price: string; qty: number }[] = [];
  for (const item of orderables) {
    const qty = Math.max(0, Math.min(20, Math.floor(Number(clean(b[`qty-${item.key}`], 6)) || 0)));
    if (qty === 0) continue;
    if (item.at && !item.at.includes(store.key)) {
      return fail(`${item.name} is not available at the ${store.name} shop.`, 400);
    }
    lines.push({ name: item.name, price: item.price, qty });
  }
  if (lines.length === 0) return fail("Pick at least one thing to order.", 400);

  const estimate = lines.reduce((sum, l) => {
    const p = Number(l.price.replace(/[^0-9.]/g, ""));
    return sum + (Number.isFinite(p) ? p * l.qty : 0);
  }, 0);

  const key = process.env.RESEND_API_KEY;
  const to = process.env.ORDER_TO ?? process.env.INQUIRY_TO;
  const from = process.env.ORDER_FROM ?? process.env.INQUIRY_FROM ?? "True North Website <orders@glazedweb.com>";

  const itemsText = lines.map((l) => `${l.qty} × ${l.name} (${l.price})`).join("\n");
  const rows: [string, string][] = [
    ["Pickup at", `${store.name} — ${store.street}`],
    ["When", pickup || "not given"],
    ["Name", name],
    ["Phone", phone || "not given"],
    ["Email", email || "not given"],
    ["Estimated total", `$${estimate.toFixed(2)} — pay at pickup`],
  ];

  if (!key || !to) {
    console.error("ORDER (mail not configured):", JSON.stringify({ rows, lines, flavors }));
    return fail(
      `Ordering online is not quite live yet. Please call the ${store.name} shop at ${store.phone} and they will set it aside for you.`,
      503,
    );
  }

  const summary = lines.map((l) => `${l.qty}× ${l.name}`).join(", ");
  const subject = `Pickup order — ${store.name}: ${name} (${summary})`;

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: to.split(",").map((s) => s.trim()),
      replyTo: email || undefined,
      subject,
      text: [
        ...rows.map(([k, v]) => `${k}: ${v}`),
        "",
        "Order:",
        itemsText,
        "",
        "Flavors and requests:",
        flavors || "none given",
      ].join("\n"),
      html: `
        <h2 style="font-family:Georgia,serif">Pickup order — ${escapeHtml(store.name)}</h2>
        <table style="font-family:system-ui,sans-serif;font-size:15px;border-collapse:collapse">
          ${rows
            .map(
              ([k, v]) =>
                `<tr><td style="padding:4px 16px 4px 0;color:#666">${k}</td><td style="padding:4px 0"><strong>${escapeHtml(v)}</strong></td></tr>`,
            )
            .join("")}
        </table>
        <h3 style="font-family:system-ui,sans-serif">Order</h3>
        <ul style="font-family:system-ui,sans-serif;font-size:15px">
          ${lines.map((l) => `<li>${l.qty} × ${escapeHtml(l.name)} (${escapeHtml(l.price)})</li>`).join("")}
        </ul>
        <p style="font-family:system-ui,sans-serif;font-size:15px;white-space:pre-wrap">${escapeHtml(flavors || "No flavor notes.")}</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return fail(`Could not send that. Please call the ${store.name} shop at ${store.phone}.`, 502);
    }

    return isForm
      ? NextResponse.redirect(new URL("/thanks", request.url), 303)
      : NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Order send failed:", err);
    return fail(`Could not send that. Please call the ${store.name} shop at ${store.phone}.`, 502);
  }
}
