# Connectivity audit, Round 14

Owner: Connectivity Auditor. Screen: Platform, Connections and gaps (`zl_conn`). Code: `mod_zlink.js`, `mod_zlink.css` (load last). Harness: `zl_walk.js` (links), `zl_measure.js` (counts), `zl_func.js` (functional test). Baseline: `out_v13/full.html`; result: `out_g14/full.html`.

## Before and after

| Measure | Baseline v13 | Round 14 build |
|---|---|---|
| Connectivity score (mean share of records that connect, 0 to 100) | 83 | 92 |
| Findings across all checks | 1740 | 1031 |
| Cross-module references that do not resolve | 609 of 6299 | 329 of 6656 |
| Invoice decision consumers updated (of 10) | 3 | 10 |
| Chips and drill links whose target does not exist (static scan, every screen) | 9 of 2654 | 1 of 2786 |
| Chips and drill links that dead-end or mislead (walker, 39 screens, up to 8 links each) | 1 of 275 | 1 of 267 |

Baseline and result totals differ slightly because other agents added entities, processes, workflows and metrics to the shared source during the round; every check uses the same code in both runs (baseline runs the module with fixes switched off).

## Checks that changed or remain open

| Area | Check | Checked | Before | After |
|---|---|---|---|---|
| Approvals | Screens with a gate step that do not register in the inbox | 94 | 78 | 79 |
| Approvals | Assigned-work providers the inbox never shows | 50 | 13 | 0 |
| Approvals | Business events with no notification | 8 | 8 | 0 |
| Data | Metrics not traced to any field | 292 | 76 | 79 |
| Data | Reference fields with no declared target entity | 323 | 130 | 68 |
| Data | Fields with no declared authority or classification | 1478 | 55 | 55 |
| Data | Duplicate or near-duplicate concepts | 155 | 6 | 6 |
| Data | Planned entities not yet created | 155 | 5 | 5 |
| Interoperability | Invoice decision consumers that do not update | 10 | 7 | 0 |
| Interoperability | Expected invoice flows missing from the module map | 9 | 5 | 0 |
| Links and people | Metric to screen does not resolve | 448 | 34 | 33 |
| Links and people | Metric remediation article does not resolve | 22 | 22 | 22 |
| Links and people | Metric remediation agent does not resolve | 295 | 12 | 12 |
| Links and people | PO to budget line does not resolve | 13 | 6 | 6 |
| Links and people | Incident to knowledge article does not resolve | 4 | 4 | 4 |
| Links and people | Process owner does not resolve | 145 | 4 | 3 |
| Links and people | Demand sponsor does not resolve | 10 | 6 | 2 |
| Platform | Key objects with no MCP read tool | 18 | 16 | 0 |
| Platform | Approval kinds with no MCP list or decide tool | 19 | 17 | 0 |
| Process | Processes with no backup owner | 145 | 104 | 119 |
| Process | Steps with no input or no output | 784 | 306 | 85 |
| Process | Steps with no owner | 784 | 26 | 26 |
| Process | Processes linked to no entity | 145 | 24 | 23 |
| Process | Flows with no data contract (no entity named) | 564 | 23 | 23 |
| Process | Screens with no process strip | 123 | 18 | 18 |
| Process | Modules writing an entity another module owns | 78 | 11 | 11 |
| Process | Processes with no metric | 145 | 10 | 10 |
| Process | Processes with no named owner | 145 | 12 | 9 |
| Search and chat | Cross-cutting questions chat cannot answer | 8 | 7 | 0 |
| Workflow | Step assignees that resolve to nobody | 1893 | 418 | 199 |
| Workflow | Workflows pointing at an unknown service | 130 | 148 | 60 |
| Workflow | Approvers that resolve to nobody | 233 | 78 | 36 |
| Workflow | Decision points with no owner | 359 | 27 | 27 |
| Workflow | Workflow owners that resolve to nobody | 189 | 24 | 11 |

## Link walker

`zl_walk.js` visits each screen, collects linked-record chips and drill links (data-go, data-person, data-rec, data-lr-go and every data attribute named go, open, goto, drill, jump or link; destructive names excluded), clicks one of each kind round-robin up to 8 per screen, and checks the destination: something changed, the drawer or screen has content, no error text, and the destination shows the record id or person name that the chip named. Screens covered in both runs: 39.

Before: 1 of 275 flagged ({'ok': 274, 'badtext': 1}). After: 1 of 267 flagged ({'ok': 266, 'badtext': 1}). Links of the form `data-go="screen:record"` (about 100 of them, the Open in Metrics chips) are counted as passing when the screen is right; the record argument is handled by `go()` and was not separately verified. The one `badtext` is a person drawer whose delivery log legitimately contains the words not found. Clicks that lost their element after a re-render are dropped as harness noise. The walker found no dead-end among the links it clicked; the dead chips came from the static scan, which reads every chip.

Static scan (`zl_scan.js`): baseline 9 chips whose target does not exist, now 1. The baseline ones were person chips that name a role (Chief Editor on 7 screens, the CEO) and opened nothing. A wrapper on `who()` and `person360()` now resolves a role to the person who holds it. Still open: a chip for the team name Platform team on plat_fab.

Remaining flagged links (after):

| Screen | Link | Result | Why |
|---|---|---|---|
| svc_notify | Avery Chen | badtext | not found |

## What was fixed (registration APIs, all in mod_zlink.js)

- fx_ref 247 partial: 296 left for the steward
- fx_wfsvc 162 applied
- fx_people 2 applied
- fx_alias 24 partial: 45 names resolve to nobody
- fx_metricuse 2 partial: 33 names match no screen
- fx_stepio 409 partial: first and last steps need the real source and result
- fx_flows 14 applied
- fx_inbox 14 applied
- fx_mcp 6 applied
- fx_search 9 applied
- fx_ask 6 applied
- fx_debt 6 applied
- fx_lineage 7 partial: 149 terms need a steward

Also added: a **Connected records** panel at the foot of record and person drawers (reverse links from the relation graph, grouped with `lrHTML`); the **Connections and gaps** screen (Overview, Gaps by check, Dead links, Orphans, Event fan-out, Fixes and resolvers, Metrics); metrics `m_zl_score`, `m_zl_dead`, `m_zl_fanout`, `m_zl_orphans`; process `connectivity_audit` (CMMI maturity record), entity `connectivity_finding` (new, thin; near duplicate `contract_finding` documented), module `zl_conn` with flows in and out, SEARCHX groups and ASKX intents; Feature contract score for `zl_conn`: 4 of 4. Owner Rina Okafor, backup Jordan Lee.

### Invoice decision fan-out (interoperability)
Baseline: approving an invoice recorded the decision, wrote one audit line, bumped the override metric when the human disagreed, and removed the item from the inbox. It did not touch the PO, contract milestone, budget line actuals, forecast to complete, reserve, project paid-to-date, vendor record or any notification. Now an `invoice.decided` event (hooked on the audit call the invoice screen already makes, so no shared file was edited) updates PO paid, the contract milestone, line actuals, project paid, vendor last decision, evaluates a reserve draw, sends a notice, and writes one audit line listing the consumers. Undo on the invoice reverses every effect. The test in Event fan-out approves INV-20433 through the real handler in a sandbox and restores state.

## What was not fixed, and why (needs a person or a shared-file owner)
- Owners and backups: 9 processes have no named owner and 119 of 145 have no backup; 26 steps have no owner. Needs people, not code.
- Authority and classification: 55 entities hold fields nobody has declared; routed to Technical debt.
- 79 metrics still trace to no field (about 150 formula terms); only exact single-field matches were mapped, marked proposed.
- Knowledge references with no article: 4 incident links and 22 metric remediation links (KB ids that do not exist).
- 12 metric remediation agents are not registered agents; 33 metric "used on" names match no screen; 6 of 13 POs point at a run-budget line that is not a budget line.
- 79 of 94 screens that declare a gate step do not register an approval in the inbox (the gate is a process step, not a record).
- The notification engine keeps its event list inside `mod_svc.js`; the eight business events are registered in the connectivity layer (notices, inbox, search) until that list is made registerable.

## Top 10 improvements above and beyond (ranked)

| # | Improvement | Evidence | Approach | Effort |
|---|---|---|---|---|
| 1 | Make every gate step a real approval record | 79 of 94 screens with a gate step do not register in the inbox; approvals live in 8 private stores. | One `APPROVAL` entity plus `INBOX.register(kind, {list, decide})`; migrate gates screen by screen. | L |
| 2 | A real event bus for decisions | Only invoices fan out now, through an audit hook. Change approval, budget request, risk acceptance and meeting actions each update different subsets by hand. | Publish and subscribe `BUS.emit(event, record)` with consumers declared on the module map; the map flow becomes the subscription. | M |
| 3 | Backup owner by default | 119 of 145 processes have no backup; 26 steps have no owner. | Inherit backup from the accountability domain at registration, flag as inferred, require confirmation within 30 days. | S |
| 4 | Role registry with holders | 199 workflow step assignees and 36 approver roles resolve to no person or team. | A `role` entity (name, holder, backup, delegation of authority tier); workflow pickers choose roles from it. | M |
| 5 | Declare reference targets in the schema | 68 entities still have reference fields with no target entity; refs are inferred from names. | Make `ref` mandatory in `DATAMODEL.register`; gate rejects untargeted refs. | S |
| 6 | Metric lineage assistant | 79 metrics trace to no field; 156 terms unmapped. | Suggest `entity.field` per formula term with confidence; steward accepts in one click (the Lineage tab already stores overrides). | M |
| 7 | Create the missing knowledge articles | 4 incident links and 22 metric remediation links point at KB ids that do not exist. | KCS draft generator from the metric remediation title and the incident resolution notes. | S |
| 8 | Move notification events into a registry | 8 of 8 business events have no template in the engine; the list is private to one module. | `NTF.registerEvent` with owner, audience and template; invoice, budget, risk and contract events first. | S |
| 9 | Link convention and CI walker | Chips use 14 different attribute names; the walker has to guess the target id. | One `data-link="type:id"` attribute and one `openRecord(type,id)`; run `zl_walk.js` in the build. | M |
| 10 | Resolve run-budget lines and renamed screens | 6 of 13 POs point at a run-budget line that is not a budget line; 33 metric screen names are stale. | Add run-budget lines to the budget model; resolve screen names by id, not by label. | S |

## How to re-run

```
python3 build.py --out out_g14
NODE_PATH=$(npm root -g) node zl_measure.js out_g14/full.html scr/after.json
NODE_PATH=$(npm root -g) node zl_measure.js scr/base.html scr/before.json inject   # baseline: module injected with fixes off
ZL_SCREENS=inv,port,... NODE_PATH=$(npm root -g) node zl_walk.js out_g14/full.html scr/walk_a.json 0 1 8
python3 zl_embed.py && python3 zl_doc.py
```
