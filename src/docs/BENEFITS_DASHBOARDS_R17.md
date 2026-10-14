# Benefits and Dashboards, Round 17 (Agent U)

Owner feedback: "Track benefits does nothing" and "Dashboards does nothing".

## Findings: what was inert and why

**Track benefits (bud_ben, "Benefits realization").** A click-through of every control found one real no-op, the header Owner button. The rest of the screen was a passive read-only register: no targets, backups or baselines, no checkpoints computed from dates, no net benefit, no way to record a measurement that changed any total, no group approval for a target change, no list of what needs attention. "Does nothing" meant "nothing you can do here".

**Dashboards.** The sidebar item (data-nav exe_dash) belongs to a family of views (Leadership, Operations and metrics, Build a chart, Charts and defaults) and landed on a fixed set of monitoring tiles. You could not pick a dashboard, change what a tile shows, filter, drill down, share, publish or schedule. Navigation worked; there was nothing to operate.

## What works now

**bud_ben** (7 tabs): planned versus realized timeline; register; checkpoints (computed per quarter from the planned amount, due date and the latest recorded actual); net benefit and payback by portfolio (benefit minus line cost, labeled computed); by owner, portfolio and quarter; needs attention (missing owner, backup, baseline or measure); changes and traceability. Record an actual, edit, add a benefit, and propose a target change. A target change goes to the Portfolio board, a group (2 of 4); one seeded request is waiting on its second vote. Recording an actual updates every total and the Benefits realized metric at once. CSV export.

**Dashboards** (screen r17u_dash, now the default for the sidebar item): library picker; six templates built from live registries and the metric dictionary; tile types card, trend, bar, table, list, ring; filter bar (range, owner, portfolio) that recomputes registry tiles and states when a filter does not apply; drill-down to source rows with CSV export; edit mode with add, edit, remove, resize, reorder by drag or by keyboard buttons, undo and redo; new, duplicate, rename, delete drafts; share to groups; publish through the Dashboard approver group (a requester cannot approve their own); personal default per role; simulated scheduled delivery with run log (labeled, nothing is sent); print view; full screen; template gallery.

Every tile shows its source, formula, freshness and named owner and backup. Numbers are computed live from registries or the metric dictionary. Schedules are the only simulated part.

## Verification

Fast in-page click-through (u17_fast.js): bud_ben 161 controls across 7 tabs, 148 changed state; the 13 flagged were "Record actual" (opens a form, false positive from the fingerprint), the shared breadcrumb group chip, and "Why am I seeing this?" (opens a popover). r17u_dash 163 controls across 4 tabs, 160 changed state; the 3 flagged are the shared breadcrumb group chip. No page errors on either.

## Files
mod_r17u_a_core.js, mod_r17u_b_ben.js, mod_r17u_c_dsrc.js, mod_r17u_d_dash.js, mod_r17u.css. Shared file edits: mod_budget.js, two surgical edits (benToDate defers to R17U.benToDate; search opens R17U.openBen).

## Gaps
Scheduled delivery is simulated. The older dashboard views (obs_dash, r16j_dash, kcs_viz) stay reachable as hidden family views and were not rebuilt. Dashboard state is stored per browser through STORE, not on a server.
