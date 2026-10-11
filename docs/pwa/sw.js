/* Oukala service worker (cache-first shell, network-first data, background-sync outbox, push banner).
   Host this file at the same origin and path as oukala.html. It cannot be inlined into the single-file build. */
const CACHE = "oukala-shell-v1";
const SHELL = ["./oukala.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
/* Shell: cache first so the mobile view opens with no connection. Everything else: network, then cache. */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("./oukala.html")))
  );
});
/* Outbox: the page posts {type:"queue", item} when a decision is made offline; sync replays it to the page. */
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "queue" && self.registration.sync) self.registration.sync.register("oukala-outbox").catch(() => {});
});
self.addEventListener("sync", (e) => {
  if (e.tag !== "oukala-outbox") return;
  e.waitUntil(self.clients.matchAll({ type: "window" }).then((cs) => cs.forEach((c) => c.postMessage({ type: "sync-outbox" }))));
});
/* Push: a page for the on-call person or an approval assigned to them. Payload: {title, body, url}. */
self.addEventListener("push", (e) => {
  const d = e.data ? e.data.json() : { title: "Oukala", body: "Something needs you", url: "./oukala.html#m" };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: "icon-192.png", badge: "icon-192.png", tag: d.tag || "oukala", requireInteraction: !!d.page, data: { url: d.url || "./oukala.html#m" } }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.openWindow(e.notification.data.url));
});
