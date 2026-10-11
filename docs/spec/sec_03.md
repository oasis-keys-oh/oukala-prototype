# 3. Experience architecture

The shell is one rail, one top bar and one content canvas, with search, Ask, notifications, favorites and "Why am I seeing this" in fixed places on every screen.

All sizes below were measured in the build `out_v16b` with Playwright at 1440 by 900, 1000 by 900 and 400 by 820. Positions are in CSS pixels from the top left of the viewport.

## 3.1 Shell regions

| Region | Element | 1440 px | 1000 px | 400 px |
|---|---|---|---|---|
| App grid | `.app` | 2 columns, 268 and 1126, gap 18, padding 14 | Rail collapses | 1 column, 380, padding 10 |
| Rail | `aside.rail` | 268 x 872 at (14, 14), sticky | 92 x 872 icon rail | Off-canvas panel 352 x 820, opened by Menu tab |
| Top bar | `.topbar` | 1126 x 61 at (300, 14), sticky | 862 x 61 | 380 x 58, sticky |
| Content | `#view` | 1126 wide from (300, 93); bottom padding 84 | 862 wide | 380 wide |
| Bottom tab bar | `#nxTab` | Hidden | Hidden | 380 x 66: Home, Search, Saved, Recent, Menu |
| Ask button | `#chxOrb` | 48 x 48, 18 from right and bottom | Same | 48 x 48 above the tab bar |
| Ask dock | `#chatDock` | 446 x 846, right side | Same | Full screen 400 x 820 |
| Drawer | `#drawer` | 470 wide, inset 16, radius 30, full height | Same | Bottom sheet 384 wide, max 82 percent height |
| Toast dock | `#inbxBanners` | Bottom left of content, 400 wide | Same | Same, above the tab bar |

The rail collapses automatically between 901 and 1100 px and the content gap between stacked screens is 24 px. Requirements: see OK-SHELL-nnn.

## 3.2 Navigation groups

The menu has 15 groups holding 141 entries, plus Home. Another 28 screens are registered but hidden because a merge family replaced them; they stay reachable by link, search and favorites. Seven screens are not yet mapped to a group and fall into a default group.

| Group | Entries | Sub-groups |
|---|---|---|
| Home | 1 | Pinned alone |
| My work | 2 | None |
| Get help or ask for something | 4 | Start here |
| Plan and deliver projects | 13 | Choose the work; Run projects; Staff and release |
| Fix and support services | 10 | None |
| Know our technology | 13 | Services and records; Data quality; Watch and deliver |
| Money and contracts | 16 | Pay and approve; Budgets and funding; Vendors; Where money goes; Budget requests |
| Knowledge and learning | 4 | None |
| People and teams | 6 | Org chart |
| Strategy and performance | 10 | Assurance; Goals to work |
| Governance, risk and compliance | 8 | Risk; Audit; Governance; Controls; Findings; Policies; Exceptions |
| Resilience | 8 | Overview to Declare, one per screen |
| Automate | 9 | Drag, drop, auto-connect; Instances, timers, retries |
| AI and governance | 7 | Agents; Lifecycle, gates, kill switch |
| Platform and administration | 30 | Data and processes; Build and connect; Administer; Access; Tenants and setup |

A dynamic block named Budget requests adds four shortcuts (Request budget, My requests, Review queue, Decisions) that open one screen. The "More areas" fold lists eight groups (82 screens) for the Executive persona. Each menu row shows a short label and the formal name as a hint.

## 3.3 Top bar items and order

Seven items sit in the top bar in this order from left to right.

| Order | Item | Size at 1440 | Behavior |
|---|---|---|---|
| 1 | Search field | 367 x 39 | Opens the palette with `/` or Ctrl+K |
| 2 | New | 42 x 34 | Opens the create menu (3.9); Alt+Shift+N |
| 3 | View as | 143 x 36 | Switches persona |
| 4 | Agents working | 162 x 36 | Lists agents running now |
| 5 | Needs you bell | 40 x 36 | Opens the inbox panel |
| 6 | Favorites | 71 x 34 | Drops a favorites list |
| 7 | History | 42 x 34 | Drops modules and records visited |

At 400 px the search field is hidden and Search moves to the bottom tab bar. Top bar controls are 44 px high there.

## 3.4 Personas and role-based homes

Thirteen personas filter the menu and set the home layout. A persona maps to a signed-in user and to roles in the permission model. Menu counts are the distinct screens in the rail.

| Persona | Signed in as | Screens in rail | Home sections |
|---|---|---|---|
| Executive | Casey Rowan | 141 | 8: scores, needs you, spend, forecast, schedule, SPI, projects, changes |
| Finance approver | Avery Chen | 70 | 5 |
| Project manager | Priya Shah | 76 | 6 |
| Service desk lead | Tom Becker | 68 | 4 |
| Portfolio lead | Maya Ortiz | 84 | 2 (Do next, Start with a question) |
| Change manager | Nia Brooks | 76 | 2 |
| Architect | Jordan Lee | 104 | 2 |
| Platform admin | Sam Patel | 116 | 2 |
| Auditor (read only) | Rina Okafor | 130 | 2 |
| Board member (read only) | Board member | 45 | 2 |
| Vendor guest | Vendor guest | 5 | 1 (Shared with you) |
| Employee | Casey Rowan | 40 | 4 |
| New hire | Rosa Delgado | 40 | 5 |

Each persona has 2 to 4 pinned items above the menu. Employee, New hire and Vendor guest use the lighter portal layout automatically. Requirements: see OK-HOME-nnn.

## 3.5 Search

Search covers screens and records. It is a palette over the whole viewport and shows type chips, counts and a preview panel.

The index holds 92 search providers and about 100 record types; coverage was 105 of 154 entity types at Round 14. Results for "laptop" must rank "Order something" above "Request budget".

## 3.6 Ask

Ask is one assistant on every screen, opened from the 48 px button. It answers from governed data and labels AI output. It has 72 chat intents and handles ordinary questions as well as commands.

## 3.7 Notifications and the inbox

The bell opens a 490 x 795 panel headed "Needs you" with counts of waiting and urgent items. Tabs are All, Approvals, Actions and Mentions and alerts, with a Notifications tab beside them.

| Capability | Specification |
|---|---|
| Item types | alert, approval, mention, decision, system |
| Priority | high, normal, low |
| Actions | mark read, clear all with undo, defer (1 hour, tomorrow, next week, date), escalate with reason |
| Review mode | "Review one by one" renders inside the content area; chrome stays visible |
| Registry | 24 notification types, 5 channels (Teams, email, SMS, push, in-app) |
| Toasts | Docked at bottom left, 400 wide, with "Open approvals" action |

## 3.8 Favorites and history

Favorites appear in two places that share one store. The rail accordion lists starred screens and records with a count. The top bar drop-down (430 x 374) lists the same items with "Star this page" and "Open history". A star sits in the page header beside "Why am I seeing this". History (429 x 699) groups visits by day and splits modules from records.

## 3.9 "Why am I seeing this" placement

The control lives in one slot, the page-header actions slot, on every screen. It is a 165 x 36 chip at 6 px from the top and 8 px from the right edge of the content, with a 36 x 36 star flush right and an 8 px gap.

Measured on 30 screens at 1440: 0 deviations, exactly one control per screen, no overlap with the title. It opens a dialog (`aria-haspopup="dialog"`) showing source, model, formula and owner. Check: `whyscan.js`.

## 3.10 Portal URLs and hash routing

The prototype is one static page, so routes live in the hash. The address bar keeps a stable form and never shows internal ids for portal pages.

| Pattern | Meaning |
|---|---|
| `#screen` | Open a screen; aliases redirect (2 aliases) |
| `#screen?arg=ID&tab=view:index` | Open with a record argument and tab state |
| `#new/key` | Open a create form; keys: budget-request, order, incident, change, demand, po, person |
| `#portal`, `#portal/catalog/ID`, `#portal/guides/ID`, `#portal/orders/ID` | Customer portal |
| `#m` | Mobile approvals view |

Production uses one host per tenant and one path per object: `https://portal.<tenant>.<domain>/`, `/catalog/<id>`, `/guides/<id>`, `/orders/<id>`. The portal host serves only the employee view. Ids are stable and never reused; a signed-out visitor returns to the same path after sign-in.

Page titles follow "Screen name · Oukala"; Home is "Oukala". Sidebar label, h1, breadcrumb and title prefix are one string on all 169 screens except Home, which has no breadcrumb. The breadcrumb is "Group / Screen" and the group opens a popover.

## 3.11 The New menu and the click-path rule

The New menu (340 x 484) lists seven create actions: Request budget, Order something, New incident, New change, New project demand, New purchase order, New person.

1. Any create action reaches an open form in at most 2 clicks from any screen.
2. On the owning screen the same action takes 1 click.
3. Every action has a deep link `#new/key` and appears in search.
4. "Requested by" fields default to the signed-in user; other people come from a searchable picklist.

Measured with `b15/clicks.js` in Round 15 for all seven actions, zero console errors.

## Known gaps

1. Six of 13 personas share a generic home (Do next, Start with a question).
2. Seven screens are unmapped to a menu group; the "New and unsorted" group is empty.
3. The persona seed actors differ: "Myself" in the catalog is Priya Shah, ITSM uses Tom Becker, the shell uses Casey Rowan.
4. Phone tap targets under 44 px numbered 830 at Round 15 and have not been recounted.
5. The URL does not encode drawer or filter state, and portal production hosts are specification only.
6. Bell counts change with simulated events during a session.

Register filter: Module=SHELL (3.1 to 3.3, 3.5 to 3.11), Module=HOME (3.4), Module=HELP (3.6, portal).
