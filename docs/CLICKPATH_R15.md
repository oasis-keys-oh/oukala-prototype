# Click-path audit, Round 15 (Agent B)

Goal: every main create action opens its form in one click from where the person already is, and has a deep link. Measured with `b15/clicks.js` (real Playwright clicks from the Home screen, dark theme, 1440 px, zero console errors).

## Before (v14) and after

| Create action | v14 path from Home | Round 15 path | Deep link |
|---|---|---|---|
| Request budget | rail group (1), Budgets overall (2), Request budget button goes to the Budget requests screen (3), Request budget again (4). From the budget home the button only navigated: 2 clicks | Budget home: **1 click** (primary "Request budget"). Top bar: **1 click** (a Request budget button next to New: icon only below 1700 px wide, icon and label above, hidden on phones where the New menu is the entry). Anywhere: New menu, 2 clicks | `#new/budget-request` |
| Order something | rail group, Service catalog, item, form: 3 to 4 | New menu, Order something: opens the catalog with the search box focused (2 clicks); the item card then opens its form. An order needs an item choice, so this one stays a browse | `#new/order` |
| New incident | rail group, Incidents, Log incident: 2 to 3 | New menu: 2 clicks, form open | `#new/incident` |
| New change | rail group, Changes, Request change: 2 to 3 | New menu: 2 clicks, form open | `#new/change` |
| New project demand | rail group, Portfolio, New request: 2 to 3 | New menu: 2 clicks, form open | `#new/demand` |
| New purchase order | rail group, Vendors and contracts, New purchase order: 2 to 3 | New menu: 2 clicks, form open | `#new/po` |
| New person | rail group, Org chart, Add person: 2 to 3 | New menu: 2 clicks, form open | `#new/person` |

On the owning screen each action was and still is 1 click (Log incident, Request change, New request, New purchase order, Add person). The New menu removes the navigation step and the need to know which screen owns the action. Keyboard: Alt+Shift+N opens the menu. The same seven actions are in global search ("new", "create") and the palette.

## What was built

- `+ New` button at the start of the top bar (`mod_r15b_newmenu.js`), a popover listing the seven actions, `window.NEWMENU`.
- `Request budget` button in the top bar (icon only below 1700 px, hidden on phones) and as the primary button on the budget home hero. The budget home actions moved to their own row, because the hero chip row scrolled sideways and hid buttons.
- Deep links `#new/<key>` work on load and on hash change (budget-request, order, incident, change, demand, po, person).

## Other 2-click paths found and left as is

- Budget requests screen: "Request budget" (1 click, `data-br-new`).
- Order guides: the guide card opens a wizard; the wizard is the form.
- Approvals and decisions are not create actions.

## Requester default

Single source of truth: `PICK.me()` returns the logged-in user (the rail shows Casey Rowan; `INBOX.me()`).
Every form field of type people whose label starts with "Requested by", "Requester", "Raised by", "Reporter", "Submitted by", "Opened by", "Caller" or "Requested for" defaults to that user (`PICK.applyDefaults`, called by the form kit). Explicit changes made in source: budget request, budget transfer, purchase order, incident caller, change requester. Demand (`requester`) is covered by the kit rule. Where another person must be picked, the people field is now the searchable picklist `window.PICK.person(...)`: type to filter, shows name, title, team and cost center, groups You and Your reports first. The "Someone else" and team choices in the service catalog use it too; the delegate and policy rules are unchanged.

Known gap: the service catalog actor (`mod_svc.js`, "Myself") is Priya Shah and the ITSM actor (`mod_itsm.js`) is Tom Becker, so "Myself" in an order and "You are logging as" in an incident are persona simulations that differ from the logged-in user. Changing them needs a decision on the demo personas.

## Tests added

- `b15/clicks.js`: real clicks from Home to an open form for the seven actions, the one-click buttons and the seven deep links. Result: all open the expected form, zero console errors, light and dark.
- `nestscan.js` (rule N, also noted in the cardscan and spacescan headers): a table wrapper inside a bordered card that has its own border, shadow or fill and scrolls. v14 flagged `bud_over` (border plus inner vertical scrollbar, the owner's screenshot) and `bud_doa`; the Round 15 build flags 0 of 148 screens. The fix is one rule (`.card .tablewrap`: flat wrapper, no border, no shadow, no inner vertical scroll) in `mod_r15b_pick.css`.
