# Observers and intervals (CL-38)

Inventory of every `new MutationObserver` and `setInterval(` in `src/*.js` (quarantined " 2" copies excluded), wave 4, stream runtime. Line numbers are at the stream's head commit. "Off-screen" says whether the callback can run while its own screen is not open. `tools/tests/runtime.js` fails the build if either count rises.

Counts: **44 MutationObservers** (backlog row said 40; 41 at wave 3) and **39 setIntervals** (40 before this stream; one removed).

## What changed in this stream (no visible behavior change)
- `mod_r15f3_mobile`: the 250 ms poll that set the `r3m-on` body class is gone; the class follows the screen through the `afterRender` hook (interval removed).
- `mod_r15f1_b_wf`: the observer that adds the Run button to the drawing studio watched `#view` on every screen and returned at once unless `draw_studio` was open; it now observes only while `draw_studio` is open (connected and disconnected from `afterRender`, with one run on connect).
- `mod_r15f3_iam`: the 700 ms Act-as chip rewrote its markup every tick while acting as someone, which woke every body-subtree observer (permission sweep, ownership slots, guides, sliders) 1.4 times a second; it now writes only when the text changes.
- `mod_r21a_quiet`: the 5 s tick rewrote the bell title while notifications were silenced; it now writes only when the title changes.

## Candidates left for later (owner decides)
- Body-subtree observers that only care about drawers: `mod_r16m_d_guides` (guide strip) could run from `afterOpenDrawer`; `mod_own2` (ownership slots) from `afterRender` plus `afterOpenDrawer`.
- Polls that are idempotent and could follow `afterRender` only: `mod_r18a_shell` lens host (500 ms), `mod_r16i_core` rail clean-up (3 s), `mod_r15b_newmenu` New menu remount (3 s, product-2).
- `mod_s_search_usage` (product-2): observe `#view` only while `scr_map` is open, as done for the drawing studio here.

## MutationObservers (44)
| Where | Owner | Purpose | Runs off-screen | Action |
|---|---|---|---|---|
| `kit.js:119` | runtime | formula copy buttons and popups: enhance added nodes | yes, body subtree, debounced 160 ms; needed on every screen | keep |
| `kit2.js:289` | runtime | table token cells (tableFix) on any added table | yes, document subtree, one frame | keep |
| `mod_cardalign.js:29` | runtime | align sibling card sections | on #view only (every screen) | keep |
| `mod_flow.js:1518` | runtime | drag ghost above an open drawer | body; acts only on .dnd-ghost | keep (cheap) |
| `mod_inbox.js:632` | runtime | remount the bell when the top bar is redrawn | top bar only | keep |
| `mod_meet3.js:209` | runtime | record links in drawers | drawer children only | keep |
| `mod_org4.js:39` | runtime | agent display names in added text | #view and drawer subtree, one frame | keep |
| `mod_own2.js:155` | runtime | ownership slots (inject) | yes, body subtree, debounced 60 ms | keep; candidate for afterRender plus afterOpenDrawer |
| `mod_plat_atlas.js:1249` | product-1 | atlas drawer go-links | drawer only | keep (product-1) |
| `mod_r15c_core.js:134` | product-2 | accessibility pass on view and drawer | view and drawer, debounced 250 ms | keep (product-2) |
| `mod_r15c_task.js:45` | runtime | task-first reorder | #view only | keep |
| `mod_r15d_notify.js:35` | runtime | tidy the notification dock | dock children only | keep |
| `mod_r15d_notify.js:37` | runtime | wait for the dock to exist, then disconnects | boot only | keep |
| `mod_r15f1_b_wf.js:304` | runtime | Run button on the drawing studio | was: #view subtree on every screen, returned unless draw_studio | CL-38: observes only while draw_studio is open (afterRender) |
| `mod_r15f1_c_agent.js:225` | runtime | agent drawer tabs | drawer only | keep |
| `mod_r15f2_a_shell.js:282` | runtime | record shell adopts drawers | drawer children only | keep |
| `mod_r16g_b_enforce.js:155` | runtime | permission sweep of view, drawer and panels | yes, body subtree, debounced 40 ms; enforcement must follow every change | keep |
| `mod_r16i_core.js:110` | runtime | decorate the nav | nav only | keep |
| `mod_r16i_core.js:124` | runtime | favorites popup decoration | favorites list only | keep |
| `mod_r16i_notif.js:107` | runtime | notification center in the bell panel | panel only | keep |
| `mod_r16j_b_picker.js:159` | runtime | paint inline pickers | document subtree, one frame | keep |
| `mod_r16m_d_guides.js:79` | runtime | guide strip in process drawers | yes, body subtree, debounced 80 ms | keep; candidate for afterOpenDrawer |
| `mod_r17n_notify.js:127` | runtime | dismiss a card when its anchor goes | one card while shown | keep |
| `mod_r17n_notify.js:129` | runtime | adopt cards added to the layer | layer only | keep |
| `mod_r17n_notify.js:133` | runtime | wait for the layer, then disconnects | boot only | keep |
| `mod_r17o1_shell.js:30` | runtime | theme attribute | root attribute only | keep |
| `mod_r17o1_shell.js:173` | runtime | phone shell on view changes | #view children only | keep |
| `mod_r17o1_shell.js:174` | runtime | drawer title on phones | drawer children; acts on phones only | keep |
| `mod_r17o2_content.js:24` | runtime | phone tables, canvases, text floor | #view subtree; returns at once off phones | keep (cheap) |
| `mod_r17r_tables.js:20` | runtime | tag flat tables and sticky heads | #view subtree, one frame | keep |
| `mod_r18j_people.js:23` | runtime | avatar bubble on names | #view subtree, debounced 120 ms | keep |
| `mod_r20a_topbar.js:18` | runtime | icon-only top bar buttons | top bar only | keep |
| `mod_r27_prefs.js:138` | product-2 | translation of added text (non-English only) | only when a language other than English is set | keep (product-2) |
| `mod_r27_prefs.js:186` | product-2 | accessibility preferences | yes, body subtree | keep (product-2) |
| `mod_r32_num_b.js:105` | runtime | number palette in search | yes, body subtree; acts only when a number is typed | keep |
| `mod_s_search_usage.js:47` | product-2 | Screen map usage counts | #view subtree; acts only on scr_map | product-2: observe only while scr_map is open |
| `mod_s_showroom.js:60` | runtime | wedge menu | nav children only | keep |
| `mod_s_thread.js:116` | runtime | Trace this chips on added nodes | drawer and view | keep |
| `mod_viz.js:4` | bundle | chart hydration | document subtree, one frame | keep (bundle) |
| `mod_zlink.js:400` | runtime | connections panel in drawers | drawer children only | keep |
| `mod_zlink_r15.js:81` | runtime | link decoration in the view | #view subtree, debounced 120 ms | keep |
| `mod_zlink_r15.js:81` | runtime | link decoration in the drawer | drawer subtree, debounced 120 ms | keep |
| `mod_zslide.js:286` | runtime | attach sliders to new scrollers | yes, body subtree | keep |
| `ui.js:138` | runtime | header alignment of number columns | #view subtree, one frame | keep |

## setIntervals (39)
| Where | Owner | Purpose | Runs off-screen | Action |
|---|---|---|---|---|
| `mod_flow.js:678` | runtime | workflow simulation playback | stops itself when the designer is gone | keep |
| `mod_inbox.js:633` | runtime | inbox poll and bell remount, 6 s | yes (simulated arrivals are global) | keep |
| `mod_meet3.js:96` | runtime | meeting agenda timer | returns unless a timer runs | keep |
| `mod_nav.js:547` | runtime | wait for a table filter after go, then clears | short-lived | keep |
| `mod_nav.js:631` | runtime | wait for a button after go, then clears | short-lived | keep |
| `mod_org5.js:93` | runtime | event bus drain for people lifecycle | returns when the queue is empty | keep |
| `mod_plat_contract.js:561` | gate | contract run playback | short-lived | keep (gate) |
| `mod_plat_proclib.js:257` | runtime | whenSettled: wait for stable process counts | short-lived | keep |
| `mod_r15b_newmenu.js:8` | product-2 | wait for a form button after go | short-lived | keep (product-2) |
| `mod_r15b_newmenu.js:30` | product-2 | remount the New menu, 3 s | yes | product-2: mount from afterRender and the top-bar observer instead |
| `mod_r15d_evidence.js:42` | runtime | evidence sync, 4 s | skips when the tab is hidden | keep |
| `mod_r15f1_a_store.js:115` | runtime | store scan, 1.2 s | yes (durable store) | keep |
| `mod_r15f1_b_wf.js:309` | runtime | simulated clock label, 1 s | querySelector only when the label is absent | keep (cheap) |
| `mod_r15f1_b_wf.js:316` | runtime | workflow runtime tick, 600 ms | yes: simulated runtime | keep |
| `mod_r15f1_b_wf.js:316` | runtime | save the simulated clock, 4 s | yes | keep |
| `mod_r15f1_c_agent.js:246` | runtime | agent lifecycle events | yes | keep |
| `mod_r15f3_iam.js:77` | runtime | Act-as chip, 700 ms | yes; rewrote the chip every tick while acting as someone, which woke every body observer | CL-38: writes only when the text changes |
| `mod_r16h_d_rules.js:276` | runtime | approval rule timers | returns unless a run is active | keep |
| `mod_r16i_core.js:83` | runtime | wait for the budget form, then clears | short-lived | keep |
| `mod_r16i_core.js:142` | runtime | retry after-render decoration 12 times, then clears | boot only | keep |
| `mod_r16i_core.js:143` | runtime | rail clean-up and favorite star, 3 s | yes; idempotent | keep; candidate for afterRender |
| `mod_r16i_notif.js:145` | runtime | notification tick, 15 s | yes | keep |
| `mod_r16j_e_dash.js:23` | runtime | wait for the store schema, then clears | boot only | keep |
| `mod_r16m_a_core.js:378` | runtime | wait for store hydration, then clears | boot only | keep |
| `mod_r17n_notify.js:81` | runtime | card countdown, clears when no card | only while a card shows | keep |
| `mod_r17o1_shell.js:175` | runtime | phone tab mark, 4 s | skips when hidden or not a phone | keep |
| `mod_r17p_b_engine.js:60` | runtime | tour spotlight position | only during a tour | keep |
| `mod_r17s_e_wire.js:68` | runtime | rule metrics sync, 15 s | yes | keep |
| `mod_r18a_shell.js:90` | runtime | lens host, 500 ms | yes; idempotent (signature check) | keep; candidate for afterRender only |
| `mod_r18d_access.js:194` | runtime | access sync, 15 s | yes | keep |
| `mod_r18f_wire.js:96` | runtime | build metrics sync, 15 s | yes | keep |
| `mod_r18i_wire2.js:50` | runtime | spend metrics sync, 15 s | yes | keep |
| `mod_r21a_quiet.js:22` | runtime | silence expiry and bell state, 5 s | yes; rewrote the bell title every tick while silenced | CL-38: no attribute write when unchanged |
| `mod_r33_showroom.js:227` | runtime | Showroom beat timer | only during a tour | keep |
| `mod_r33_showroom.js:243` | runtime | wait for the studio, then clears | short-lived | keep |
| `mod_zslide.js:128` | runtime | press-and-hold pan | only while a button is held | keep |
| `mod_zslide.js:192` | runtime | slider positions, 350 ms | skips when hidden | keep |
| `screens3.js:96` | runtime | activity stream ticker | returns unless #stream is on screen | keep |
| `ui.js:129` | runtime | tooltip hide check | only while a tooltip shows | keep |
