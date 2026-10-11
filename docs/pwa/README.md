# Oukala mobile PWA (approvals and on-call)

The in-app mobile view is `oukala.html#m` (screen `r15_mobile`). Two files cannot live inside the single-file build, so they ship here:

| File | Purpose |
| --- | --- |
| `manifest.webmanifest` | Name, colors, standalone display, start URL `oukala.html#m`. |
| `sw.js` | Cache-first shell (works offline), background-sync outbox, push notifications. |

## Install steps
1. Put `oukala.html`, `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png` in one folder served over HTTPS (service workers need it).
2. Add to the `<head>` of `oukala.html`:
   ```html
   <link rel="manifest" href="manifest.webmanifest">
   <meta name="theme-color" content="#0C6074">
   <script>if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js")}</script>
   ```
3. On the phone open `https://your-host/oukala.html#m`, then Add to Home Screen. It launches straight into approvals and on-call.

## What works today and what is simulated
- Works: the 390 px layout, swipe or button decisions through the inbox engine, acknowledge and escalate, role guard on every decision.
- Simulated in the prototype: offline mode (More tab, "Simulate offline") and the incoming page. With `sw.js` installed the same queue is replayed by the `sync` event.
- Needs a backend: real push (Web Push with VAPID keys) and authenticated sync. Payload shape is in `sw.js`.

## Test checklist
1. Turn on Simulate offline, approve two items, see "2 decisions queued", turn it off, see both sent.
2. Open `/#m` in a 390 px window: no horizontal scroll, buttons at least 48 px tall.
3. Switch the acting person to the Service desk lead in Identity and access, press Approve: denial drawer and an audit entry appear.
