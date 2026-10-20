# Close-control audit (PH-11)

Scripted by `tools/tests/nav_close.js` (runs in `npm test`). Rule PH-10: a close or minimize control sits at the top right of its container, never over content. This file describes the audit and lists what it found on 2026-10-20. It carries no status or priority: those live in the Product Backlog.

## How the audit works
- Opens all 195 registered screens at 1440 x 900. On each screen it opens, in turn, the first drawer (a record link, Details, Open or View button), the first popover, the first metric chip popover, the first AI chip popover and the first New, Add, Create or Request form it can reach.
- Then, each on a fresh page, it opens every panel the top bar and rail reach: chat, VibeCheck, tenant switcher, profile, New menu, View as, agents working, inbox, favorites, history, search palette, the tour button and the rail group flyout (Full menu, collapsed rail).
- For each open popover, dialog, drawer or fixed floating panel it finds the close, minimize, Done or Esc control and measures how far the control's right edge sits from the container's right edge (dx) and how far its top sits below the container's top (dy). The control passes when both are within 80 px. Menus, list boxes, tooltips and status regions are exempt.
- Outliers are grouped by container (id, or element and classes) and reason. The run fails only on a group that is not in `tools/tests/nav_close_baseline.json`. Remove a group from the baseline once it is fixed; `node tools/tests/nav_close.js build_out --update` rewrites the baseline from a fresh run.

Containers measured in the baseline run: 162 (42 record drawers, 112 popovers, chat dock, inbox panel, history and search). Passing: `#drawer` (the shared `.dctl` header bar), `#chatDock`, `#inbxPanel`, `#nxHistPop`, `#nxFavPop`, `#nxPal`.

## Outliers found (baseline, 7 groups)

| Container | Reason | Measured (dx, dy) | Control | Where it shows (examples) | Source file | Owner |
|---|---|---|---|---|---|---|
| `[popover].pop` (AI output chip popover, `aiChip`) | Close not top right: in a button row at the bottom | 429, 720 | Close | Home, Feedback loop, Executive dashboard, BPMN | `src/ui.js` (`aiChip`) | CSS stream (wave 3) |
| `[popover].pop.anch` (metric chip and ring popovers, anchored by kit2) | Close not top right: bottom button row | 428, 813 | Close | Executive trace, First Officer, AI Control Tower, Demand | `src/ui.js` (`fchip`, `metricRing`), `src/kit2.js` (anchoring) | CSS stream |
| `#r18LensPop` (executive lens popover) | Close not top right | 196, 527 | Close | Home, Executive trace, First Officer, AI Control Tower (on most screens) | `src/mod_r18a_shell.js` | CSS stream (lens content is the showroom stream's `mod_r18e_lens`) |
| `#profilePop` (profile and preferences) | Close not top right: Done at the end of a long panel | 200, 3047 | Done | Top bar, profile chip | `src/screens3.js`, `src/mod_r27_prefs.js` | CSS stream |
| `#r15dVas` (View as role picker) | Close not top right: at the bottom | 349, 2422 | Close | Top bar, View as | `src/mod_r15d_persona.js` | CSS stream |
| `#nwPop` (New: create something) | No close control (light dismiss only) | none | none | Top bar, New | `src/mod_r15b_newmenu.js` | CSS stream |
| `#r15GrpPop` (group picker in a form) | No close control (light dismiss only) | none | none | Workflow runs, New form | `src/mod_r15c_core.js` | CSS stream |

## Fixed in the nav territory
- `#nxFly` (rail group flyout in the collapsed rail, `src/mod_nav.js`): had no close control; now has an icon close button at the top right of its header (`.nx-flyx`). The default Simple menu replaces the rail markup, so the audit opens it with the Full menu and a collapsed rail; it passes.
- `#nxFavPop`, `#nxHistPop` and the search palette (`#nxPal`, Esc button) already pass.

## Not covered yet
- Phone width (400 px): the run is desktop only. The phone shell moves several panels to bottom sheets, where top right may not be the right rule; decide before adding a phone pass.
- Drawers that open only from a deeper interaction (a second click, a drag, a chat intent) and screens whose first candidate button navigates away instead of opening a drawer: 42 of 195 screens reached a drawer in this run.
- Toasts are measured only if they are 200 x 80 px or larger.
