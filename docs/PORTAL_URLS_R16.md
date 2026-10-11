# Customer portal URLs (Round 16)

The customer portal is ONE screen where catalog items and order guides are browsed, searched and ordered together. Back-end management stays in two separate screens: Service catalog (`svc_cat`, "Manage the catalog") and Order guides (`svc_guides`, "Order guide admin"). Nothing an administrator manages appears on the portal page.

## Prototype

| What | URL |
| --- | --- |
| Portal home (unified browse, search, order) | https://oukala-prototype.netlify.app/#portal |
| One catalog item | https://oukala-prototype.netlify.app/#portal/catalog/laptop |
| One order guide (opens the guide's order form) | https://oukala-prototype.netlify.app/#portal/guides/onboarding |
| One of my orders or requests | https://oukala-prototype.netlify.app/#portal/orders/ORD-1042 |

The prototype is a single static page, so the route lives in the hash. `#portal` loads the `svc_portal` screen in the employee view layout. The address bar keeps the stable form (`#portal`, `#portal/catalog/<id>`) while a person browses; it does not show internal screen ids such as `#svc_portal`.

Item ids come from the catalog (for example `laptop`), guide ids from the order guides (`onboarding`, `project`, `move`), order ids from My recent on the portal (`ORD-` for order guide orders, `RITM`-style ids for single requests).

## Production convention

One host per tenant, one path per object. Paths mirror the prototype hash, minus the `#portal`.

| Path | Meaning |
| --- | --- |
| `https://portal.<tenant>.<domain>/` | Portal home: unified tiles with a type badge, categories, popular, my recent, who is this for, one search |
| `https://portal.<tenant>.<domain>/catalog/<id>` | Catalog item page and request form |
| `https://portal.<tenant>.<domain>/guides/<id>` | Order guide form (one order, several fulfilled parts) |
| `https://portal.<tenant>.<domain>/orders/<id>` | Status of one order or request, as the requester sees it |

Example for the first customer: `https://portal.meridian.example/catalog/laptop`.

Rules:

1. The portal host serves only the employee view. No admin sidebar, no management screens. Management lives on the console host (`https://console.<tenant>.<domain>/service-catalog`, `/order-guides`).
2. Ids are stable and never reused; a retired item keeps its path and shows a replacement.
3. A signed-out visitor to any path is sent to sign-in and returned to the same path.
4. Search state (`?q=`) and the category filter (`?cat=`) are optional query parameters on the home path; they are not part of the object URL.
5. Who the order is for is not in the URL; it is chosen on the page and follows the signed-in person's rights (reports, delegates, new hires).

## Employee view layout

The portal is a distinct layout mode: lighter shell (brand, Portal, My requests, Knowledge, search, notifications, person), no admin sidebar. It is selected by persona: the Request personas (Employee, New hire, Vendor guest) get it automatically. Anyone else can switch with "Employee view" on the portal page and return with "Open the console". The choice is remembered on the device.

## Code

`mod_r16i_portal.js`, `mod_r16i_portal.css`. API: `R16I.portal.entries()`, `R16I.portal.open(kind, id)` with kind `catalog`, `guides` or `orders`, `R16I.portal.urls.hashFor(kind, id)` and `R16I.portal.urls.production(tenant, domain, kind, id)`.
