# Usability Audit, Round 14 (baseline out_v13/full.html)

Method: Playwright and chromium against a copy of full.html. A sweep of all 121 screens at 1440px and at 400px, with light and dark screenshots on the screens I viewed. Hands-on walkthroughs of search, the service portal, the laptop and new hire orders, and the approvals inbox. The machine was heavily loaded (load average about 30) during the sweeps, so timings are relative, not absolute.

Honest gaps: tasks 4 to 12 below were judged from screen inspection and the sweep data. I did not click through them end to end. I did not complete an approve-and-next sequence, the incident resolve flow, or the process drawing flow. Click counts marked "est." are estimates.

## Executive summary

The product is visually polished and the search palette is strong. The weak points are orientation and task focus, not features.

1. There is no URL state. The hash is empty on all 121 screens and document.title is "Oukala" on every screen, so deep links, browser back, and refresh-to-same-place do not work.
2. One screen has three names. The rail label, the page headline, and the formal name all differ. Example: "Find root causes", "Fix the cause, not the symptom", "Problems and known errors". Users cannot match what they clicked to what they see.
3. Many screens lead with analytics, not the task. "Order something" opens an operations dashboard for the catalog owner. The 17 approvals waiting on the user sit about 1,280px down the page, below KPI chips, tiles and charts.
4. The language reads like a developer's. Search shows "request_exception", and several records appear as raw tool names.
5. Basic accessibility is missing. There is no skip link and no html lang attribute. #view takes programmatic focus after navigation and shows a visible ring. Unlabeled controls were not confirmed (my first count was a measurement error).
6. Feedback is mostly good. The ticket drawer after submit is an excellent pattern. But system toasts stack over page content, and a fresh form shows "I could not tell what to fill" before the user has typed anything.
7. Mobile at 400px has no horizontal overflow on any of the 121 screens. Many screens have 9 to 176 tap targets under 24px (plat_data 176, plat_dmap 128, bud_over 56, exe_board 60).
8. Perceived speed. First load of the 8.7MB file took about 10s on an unloaded run. Under load, per-screen render median was about 1.4s at desktop and 0.9s at phone, p90 about 2.4s, max 4.4s. Slowest: plat_pmap, svc_asset, inv, exe_scen, svc_oncall, exe_dash.

## Heuristic scores (Nielsen, 1 poor to 5 excellent)

| # | Heuristic | Score | Evidence |
|---|---|---|---|
| 1 | Visibility of system status | 3.5 | Strong ticket drawer, SLA clocks, "5 agents working". Weak: toasts overlay content (svc_cat), no loading state seen, no title change. |
| 2 | Match with real world | 3 | Rail groups use plain verbs ("Get help or ask for something"). Search results leak "request_exception"; "1 items", "1 are past" grammar; ITIL/COBIT/CSDM chips on most screens. |
| 3 | User control and freedom | 3 | Esc closes palette, Cancel on forms, "Back to the portal". No browser back, no deep link, no undo seen. |
| 4 | Consistency and standards | 2.5 | Three names per screen; near-duplicate screens (Org chart / Org chart and workload; Forums and series / Forums and minutes; Impact graph / Knowledge graph; Environments and releases / Environments and DORA). Same KPI shown three times on one screen. |
| 5 | Error prevention | 3 | Required fields marked; "Needed by" is optional even though an approver clock depends on it. Bulk approve labeled "7 are safe". |
| 6 | Recognition over recall | 3.5 | Favorites, recents, history, palette hints. 121 screens in 13 groups still needs search. |
| 7 | Flexibility and efficiency | 4 | Ctrl K, Ask, favorites, bulk approve, drag to delegate, natural-language order box. |
| 8 | Aesthetic and minimal design | 3 | Beautiful, but heavy. Pages stack hero, KPI chips, tiles, charts, process strips. The task is below the fold. |
| 9 | Help recognize and recover from errors | 2.5 | "I could not tell what to fill" appears on load. "filled 0 fields. Check them before you submit." gives no next step. |
| 10 | Help and documentation | 3.5 | "How to read this menu", "Why am I seeing this?", formulas on metrics. No first-run tour found. |

Average 3.2 of 5.

## Task walkthroughs

| # | Task | Steps and clicks | Blockers and notes |
|---|---|---|---|
| 1 | Request a laptop for myself | Rail "Get help" (1), "Report a problem or ask for help" portal (2), laptop card (3), Next (4), Submit (5). 5 clicks, measured. Search shortcut: Ctrl K, type, Enter is 2 actions but the top hit for "laptop" is "Request budget". | Rail "Order something" opens an ops dashboard, not an order form. Portal greets "Hi Priya" while the signed-in persona is Casey. "I need a new laptop" chip fills 0 fields. Submit succeeds without "Needed by". |
| 2 | Request a laptop for a new hire | Portal, "Hire someone new", 4-step form (person, equipment, access, workplace). About 6 clicks plus typing. | Bundle includes the laptop, which is good. A plain laptop order has no "requested for" field. |
| 3 | Approve and next | Rail "My approvals" (1). Queue is under the "On you (17)" tab at about 1,280px down. Est. 4 clicks to first decision. | Did not complete an approve and next sequence. Metrics lead, queue trails. |
| 4 | Find who owns the budget | Ctrl K, type "who owns the budget". 1 action. | Works well: "Victor Amaya, backup Marcus Reid" appears at the top. Best flow in the product. |
| 5 | Request budget | Search "budget" lists "Request budget" as an action. Est. 3 clicks. | Not walked end to end. "Budget requests" vs "Budgets overall" vs "Budget and forecast" are three similar names. |
| 6 | Draw a process | Rail "Automate", "Process drawing studio". Est. 3 clicks. | Not walked. draw_studio is in the slowest group (about 2.5s under load). |
| 7 | See a project's health | Rail "Plan and deliver projects", "Projects and teams". Est. 3 clicks. | ppm_proj rendered slowly (2.8s under load). Health labeled by SPI, not red/amber/green words. |
| 8 | Trace a goal to money | "Executive trace" (est. 3 clicks). | Rail label "Trace goals to money and work", headline "From budget to operations", formal name "Executive trace". |
| 9 | Build a new module | "Platform and administration", "Build a module". Est. 3 clicks. | Not walked. |
| 10 | Find a record by search | Ctrl K and type. Palette shows 487 record matches with type tabs. 2 actions. | Strong. Ranking and snake_case leaks are the problems. |
| 11 | Set a favorite | Star on the page (1 click). Favorites appear in the rail and top bar. | Works. Star is in the top right, away from the title on some screens. |
| 12 | Review meeting actions | "My work", "Meeting actions". Est. 3 clicks. | Not walked. |
| 13 | Resolve an incident | "Fix and support services", "Fix what is broken", open a record. Est. 4 clicks. | Not walked to resolve. |

## Information architecture and navigation

- 121 screens in 13 rail groups. Group sizes: Platform and administration 22, Money and contracts 17, Know our technology 14. Group names are good plain English. A group of "New and unsorted" exists for unmapped screens.
- Active state: the rail marks the current item on every screen (all 121). The rail item has a verb label and a formal name as a second line.
- Breadcrumbs: none. Hash: none. Browser title: one value.
- Duplicate or confusable names are listed under heuristic 4.
- State persistence: recents, favorites and history exist (palette shows "Last opened Oct 8, 11 visits").
- Persona drift: the portal speaks as "Priya" inside Casey's session.

## Learnability and first run

- Rail has a "How to read this menu" link and a "Not sure where to go?" box. Both help.
- No guided first-run tour found.
- The "Describe what you need and Claude fills the form" box is a good idea. It fails visibly on simple input.
- Each page header is a marketing sentence (for example "One inbox for every decision that needs a person"), not the screen name.

## Feedback, empty and error states

- Good: ticket drawer with 7-step progress, approver and cost; "RITM0010720 submitted. Waiting for Maya Ortiz."
- Bad: toasts such as "Demand created by trigger: Scale up Laptop provisioning" float over charts on svc_cat and hide text.
- No-results state in search is good: "No match for xyzzy", plus an Ask Oukala fallback.
- Nine screens contain words like "no data" or "empty" in normal copy (for example plat_data, itsm_mi, svc_cat). I did not verify each is a true empty state.

## Keyboard and screen reader

- Present: roles on tabs (tablist found on many screens), aria-label on the search box, dialog role on the palette, aria-live regions (5).
- Missing: skip link, html lang, a visible-focus design that does not outline the whole main region after navigation.
- Tab order starts inside the content after navigation, which is fine.
- Many table-row and chip controls are small tap targets.

## Mobile at 400px

- No horizontal overflow on any of the 121 screens (measured).
- Tap targets under 24px are common on dense screens (plat_data 176, plat_dmap 128, exe_board 60, bud_over 56, port 49).
- I did not view phone screenshots, so layout quality beyond overflow is unverified.

## Performance perception

- First load about 10s (8.7MB single file, unloaded run).
- Per-screen render to second animation frame, under load: desktop median about 1.4s, p90 2.4s, max 4.4s. 97 of 121 screens took over 1s and 26 took over 2s. Phone median about 0.9s.
- Slowest at desktop: plat_pmap 4.4s, svc_asset 4.1s, inv 3.9s, exe_scen 3.3s, svc_oncall 3.1s, exe_dash 3.4s in the earlier run.
- Treat the absolute numbers as inflated by machine load. The ranking is more reliable.

## Terminology and jargon

- Standards chips (ITIL 5, COBIT 2019, CSDM 5, DORA) on most screens, with no plain meaning shown.
- Sigma formulas in KPI tiles ("Σ pending past SLA ÷ pending = 2%").
- Grammar: "1 items", "1 are past their service level".
- Tool names in search: request_exception.
- XLA, OLA, RAID, WBS, CMDB, FinOps, TBM and ATUM in labels with no expansion.

## TOP 10 RECOMMENDATIONS (ranked by impact and effort)

| Rank | Recommendation | Evidence | Proposed fix | Effort | Expected outcome |
|---|---|---|---|---|---|
| 1 | Add URL state and page titles | Hash empty on 121 of 121 screens; document.title is "Oukala" on every one | Write #/screen-id on go(), restore on load, handle popstate, set title to the screen name | M | Working back button, refresh and shareable links; far better orientation |
| 2 | Put the task first on action screens | flw_appr: queue at about 1,280px down under KPIs; svc_cat opens as an ops dashboard | Default to the work tab (queue, order form) with KPIs collapsed or in a second tab; keep the dashboard one click away | M | Fewer clicks and scrolls to first decision; fewer wrong turns |
| 3 | One name per screen | itsm_prb: "Find root causes" / "Fix the cause, not the symptom" / "Problems and known errors" | Show rail label as the page eyebrow and h1; move the tagline to the subtitle | S | Users can confirm they are where they meant to be |
| 4 | Fix search ranking and hide tool names | "laptop": top hit "Request budget", "Order something" is fourth; "request_exception" listed | Boost title and keyword matches, hide MCP tool ids from the default view | S | Faster first-try success for the most common intent |
| 5 | Add breadcrumbs or a group eyebrow | Zero breadcrumbs on 121 screens | Show "Group > Screen" above the title | S | Orientation in a 121-screen product |
| 6 | Stop the focus ring and toast overlap | #view ring visible after navigation (home, cat); toasts over charts on svc_cat | Move focus without ring (outline none on programmatic focus); dock toasts to a corner and cap them to 2 | S | Cleaner screens; less obscured content |
| 7 | Fix the order forms' first impression | "I could not tell what to fill" shown on load; "filled 0 fields"; "Needed by" optional | Show the hint only after input; give the fill result a next step; require a date or default one | S | Less perceived failure on first use |
| 8 | Merge or rename near-duplicate screens | Org chart vs Org chart and workload; Forums and series vs Forums and minutes; Impact graph vs Knowledge graph; Environments pair | Merge or rename with clear differences | M | Smaller menu and fewer wrong choices |
| 9 | Accessibility basics | No skip link, html lang empty, small tap targets (plat_data 176) | Add skip link and lang="en"; set a 32px minimum target on touch widths | S | Better keyboard use, screen readers and mobile use |
| 10 | Speed up first load and heavy screens | About 10s first load (8.7MB); plat_pmap, svc_asset, inv, exe_scen over 3s under load | Lazy-load module code per screen, add a skeleton, render heavy charts after first paint | L | Faster perceived start; less waiting on the heaviest screens |

Also worth fixing (small): the portal greets "Priya" in Casey's session; "1 items" and "1 are" plurals; expand XLA, OLA, RAID, WBS, CMDB on first use; the same KPI appears three times on one screen (svc_cat, flw_appr).
