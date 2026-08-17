import { NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/data/site";

export const runtime = "nodejs";

/**
 * Catering, special order, and contact inquiries.
 *
 * Sends from the glazedweb.com verified domain so no client DNS setup is
 * needed, delivers to INQUIRY_TO, and sets reply_to to the customer so the
 * owners can just hit reply.
 *
 * When mail is not configured the visitor is told the truth and given the
 * phone number, and the full payload is written to the log so nothing a real
 * customer typed is ever lost. What this route never does is answer ok when
 * the message went nowhere.
 */

const MAX = { name: 120, email: 200, phone: 40, details: 2000 };

function clean(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Deliberately permissive. Bouncing a real customer over a regex is worse. */
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

/**
 * The no-JS path answers with a real page instead of JSON. Tiny, self-styled,
 * honest: the error page carries the same message and the phone number.
 */
function htmlPage(title: string, message: string, status: number, backHref: string) {
  // backHref is a real link, not javascript:history.back() — this page exists
  // precisely for visitors without JavaScript.
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;background:#FDF8EE;color:#17303A;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center">
<div><h1 style="font-size:1.6rem">${title}</h1><p style="max-width:34rem;line-height:1.6">${message}</p>
<p><a href="${backHref}" style="color:#1B6479">Go back to the form</a></p></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

/** Same-origin referer path, so the error page can link back to the form. */
function backHrefFrom(request: Request) {
  const ref = request.headers.get("referer");
  if (ref) {
    try {
      const u = new URL(ref);
      if (u.origin === new URL(request.url).origin) return u.pathname;
    } catch {
      /* fall through */
    }
  }
  return "/catering";
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
      return htmlPage("That did not work", "The form could not be read. Please go back and try again.", 400, backHrefFrom(request));
    }
  } else {
    try {
      b = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
  }

  /** One reply helper so the JSON and form paths cannot drift. */
  const fail = (error: string, status: number) =>
    isForm
      ? htmlPage("One more thing", error, status, backHrefFrom(request))
      : NextResponse.json({ error }, { status });

  // Honeypot. Real people never fill this in because they never see it.
  if (clean(b.company, 100)) {
    return isForm
      ? NextResponse.redirect(new URL("/thanks", request.url), 303)
      : NextResponse.json({ ok: true });
  }

  const variant = clean(b.variant, 20) === "contact" ? "contact" : "catering";
  const name = clean(b.name, MAX.name);
  const email = clean(b.email, MAX.email);
  const phone = clean(b.phone, MAX.phone);
  const kind = clean(b.kind, 60);
  const date = clean(b.date, 60);
  const guests = clean(b.guests, 20);
  const details = clean(b.details, MAX.details);

  if (!name) return fail("Please add your name.", 400);
  if (!phone && !email) {
    return fail("Please add a phone number or an email so we can reach you.", 400);
  }
  if (email && !looksLikeEmail(email)) {
    return fail("That email does not look right.", 400);
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_TO;
  const from = process.env.INQUIRY_FROM ?? "True North Website <inquiries@glazedweb.com>";

  const rows: [string, string][] = [
    ["Name", name],
    ["Phone", phone || "not given"],
    ["Email", email || "not given"],
    ...(variant === "catering"
      ? ([
          ["Planning", kind || "not given"],
          ["Date", date || "flexible"],
          ["Guests", guests || "not given"],
        ] as [string, string][])
      : []),
  ];

  if (!key || !to) {
    // Not configured yet. Log the whole payload so it is never lost, and say
    // so plainly rather than pretending it sent.
    console.error("INQUIRY (mail not configured):", JSON.stringify({ rows, details }));
    return fail(
      `Our form is not quite live yet. Please call ${site.cateringPhone} or email ${site.email} and we will take care of you.`,
      503,
    );
  }

  const subject =
    variant === "catering"
      ? `Catering inquiry from ${name}${guests ? ` (${guests} guests)` : ""}`
      : `Website message from ${name}`;

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: to.split(",").map((s) => s.trim()),
      replyTo: email || undefined,
      subject,
      text: [...rows.map(([k, v]) => `${k}: ${v}`), "", "Details:", details || "none"].join("\n"),
      html: `
        <h2 style="font-family:Georgia,serif">${variant === "catering" ? "Catering inquiry" : "Website message"}</h2>
        <table style="font-family:system-ui,sans-serif;font-size:15px;border-collapse:collapse">
          ${rows
            .map(
              ([k, v]) =>
                `<tr><td style="padding:4px 16px 4px 0;color:#666">${k}</td><td style="padding:4px 0"><strong>${escapeHtml(v)}</strong></td></tr>`,
            )
            .join("")}
        </table>
        <p style="font-family:system-ui,sans-serif;font-size:15px;white-space:pre-wrap">${escapeHtml(details || "No extra details.")}</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return fail(`Could not send that. Please call ${site.cateringPhone}.`, 502);
    }

    return isForm
      ? NextResponse.redirect(new URL("/thanks", request.url), 303)
      : NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Inquiry send failed:", err);
    return fail(`Could not send that. Please call ${site.cateringPhone}.`, 502);
  }
}
