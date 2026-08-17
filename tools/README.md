# tools

Verification harnesses, kept because they have each caught something real and are
tedious to rewrite from memory. They are not part of the site — nothing here is
imported by the Next build, and the two packages they need are deliberately **not**
in `package.json`, so a production deploy never installs a browser driver.

They live in this repo rather than a client repo because Node resolves modules
upward from a script's own location, so a harness has to sit somewhere that
`playwright-core` resolves. They point at whatever you tell them to with `--base` or
`--url`, so use them against any of the client sites.

## Setup

```bash
npm install axe-core playwright-core --no-save
```

Install **both together**. `npm install <pkg> --no-save` prunes packages that are not
in `package.json`, so installing one on its own removes the other.

Chromium is already on the machine at `/opt/pw-browsers/chromium` and every script
launches it explicitly. Do not run `playwright install`.

## The scripts

| Script | Answers |
| --- | --- |
| `audit.mjs` | Is this build shippable? axe against WCAG 2.1 AA, horizontal overflow, console and page errors, and 4xx/5xx, across every route at 390px and 1440px. |
| `animating.mjs` | Is this element's animation actually moving, or does it only claim to be? |
| `gap.mjs` | Does the clearance between two elements hold at every width, or only at the two you screenshotted? |
| `contrast.mjs` | Which colour pairs fail contrast, grouped so one bad token does not look like fifty separate bugs? |
| `egress.mjs` | Can the browser reach the public internet at all? (Currently: no.) |

Each file opens with the specific failure that caused it to exist. Those comments are
the point — read the one you are about to use.

## Two rules before you believe any of them

**Point them at a production build, not the dev server.** `npm run build` then
`npx next start -p 4490`. Dev serves different CSS and hides build-time failures.

**Kill stale servers by PID and confirm the port is clear first.** An old process
still holding the port keeps serving the old build, the new stylesheet 404s, the page
renders unstyled, and then `audit.mjs` reports a 1834px overflow, console errors and
an error boundary — none of it real. Never `pkill -f "next start"`: that pattern
matches your own shell's command line and kills the session.

```bash
ps -eo pid,args | grep -E "next-server|next start" | grep -v grep
kill <pids>; sleep 2
rm -rf .next && npm run build
npx next start -p 4490 -H 127.0.0.1 &
# then confirm EVERY stylesheet the page references returns 200, not just the first
for C in $(curl -s http://127.0.0.1:4490/ | grep -o '/_next/static/css/[a-z0-9]*\.css' | sort -u); do
  curl -s -o /dev/null -w "$C %{http_code}\n" "http://127.0.0.1:4490$C"
done
```

A number too large to be plausible — a big overflow on a page that was clean five
minutes ago — is evidence of a broken environment, not a broken layout. Check the
server before you check the CSS.
