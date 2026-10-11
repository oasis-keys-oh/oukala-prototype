# Requirements register summary

Workbook: `oukala-requirements-register.xlsx`. Build read: `out_v16b`, extracted 2026-10-11. Requirement rows: 15104. Epics: 64. Story seeds: 300.

### Counts by module

| Value | Rows | Share |
|---|---|---|
| HOME | 61 | 0.4% |
| MYWK | 208 | 1.4% |
| HELP | 208 | 1.4% |
| PLAN | 658 | 4.4% |
| FIX | 669 | 4.4% |
| TECH | 814 | 5.4% |
| MONY | 997 | 6.6% |
| LEARN | 214 | 1.4% |
| PEOP | 605 | 4.0% |
| STRT | 612 | 4.1% |
| GRC | 476 | 3.2% |
| RES | 673 | 4.5% |
| AUTO | 653 | 4.3% |
| AI | 377 | 2.5% |
| PLAT | 2318 | 15.3% |
| HIDN | 1697 | 11.2% |
| DATA | 3076 | 20.4% |
| METR | 10 | 0.1% |
| EVNT | 212 | 1.4% |
| SECU | 167 | 1.1% |
| APPR | 51 | 0.3% |
| INTG | 46 | 0.3% |
| IMPT | 93 | 0.6% |
| AGNT | 85 | 0.6% |
| DSGN | 124 | 0.8% |
| Total | 15104 | 100% |

### Counts by category

| Value | Rows | Share |
|---|---|---|
| Experience | 4269 | 28.3% |
| Layout | 1047 | 6.9% |
| Data | 3623 | 24.0% |
| Process | 2211 | 14.6% |
| Metric | 1236 | 8.2% |
| Security | 896 | 5.9% |
| Integration | 53 | 0.4% |
| AI | 218 | 1.4% |
| Operations | 1551 | 10.3% |
| Total | 15104 | 100% |

### Counts by priority

| Value | Rows | Share |
|---|---|---|
| P0 | 519 | 3.4% |
| P1 | 6552 | 43.4% |
| P2 | 6810 | 45.1% |
| P3 | 1223 | 8.1% |
| Total | 15104 | 100% |

### Counts by prototype status

| Value | Rows | Share |
|---|---|---|
| Built | 9705 | 64.3% |
| Partial | 3217 | 21.3% |
| Simulated | 1123 | 7.4% |
| Gap | 1059 | 7.0% |
| Total | 15104 | 100% |

## Priority rubric

| Priority | Meaning | Typical rows |
|---|---|---|
| P0 | Release blocker: the production system is unsafe, unusable or untrustworthy without it | Screen access rules, masking of personal, restricted and confidential data, audit of writes, approval routing by group, core shell screens (home, inbox, approvals, admin, permissions), tier 1 continuity plans, primary actions on core screens |
| P1 | Core workflow needed for the first customer release | Live entities and key fields, process steps with an SLA, primary actions, data bindings, focus order and labels, contrast, persistence of written entities, header and KPI layout on core screens, metrics tied to a process |
| P2 | Expected quality before general availability | Secondary regions and tables, tabs, empty, loading and error states, responsive layout, 44 px targets, performance budgets, remediation, secondary metrics |
| P3 | Enhancement or polish that can follow general availability | Proposed (not live) entities and fields, visualization palettes, extra scale work |

## Prototype status values

- Built: the prototype shows the behavior or fact, measured or read from a registry.
- Partial: present but incomplete (measured shortfall, missing backup, entity designed but not backed).
- Simulated: UI and seeded data exist, no real execution (connectors, AI, agents, metric calculation, deployments).
- Gap: no prototype evidence, or the registry shows a missing declaration.

## Method

1. `spec/extract_registry.js` opens `out_v16b/full.html` in Chromium (HTTPS aborted), reads the in-page registries (SCREENS, NAVX, MODMAP, PLAT entities, PROCLIB, METRICS, EVENTS, PERM, GUARD, APG, APPR, STATUS, FAB, R16M, MCPX, GATE, ORGX, AGENTS, BCX, CONTRACT, STORE), reads `:root` variables in dark and light, then visits every screen at 1440x900 dark and 400x820 and records region boxes, gaps, computed fonts, tables, buttons, fields, tabs, headings, ARIA facts, states, timing and DOM size. Output: `spec/registry.json`.
2. `spec/gen/build.py` turns those records into requirement rows with fixed templates. Every row carries measured or registry values in its text. Rows are de-duplicated on module, screen, category and requirement text.
3. The workbook is written with openpyxl and recalculated with LibreOffice to confirm zero formula errors.
4. Position tolerance in acceptance criteria is 2 px at 1440x900 dark with the 268 px rail.

## Known limits

- Layout facts are for the default tab and default data of each screen. Other tabs list headings only, not boxes.
- Primary-action results come from a click probe on up to three enabled buttons per screen. Other buttons list label and size only.
- Region labels come from the first heading in the region; regions without a heading carry the component class.
- Persona access is evaluated by the permission engine for 13 personas; section-level and row-level rules are listed but not evaluated per record.
- Metric current values are seeded in the prototype; calculation rows are marked Simulated.
- Owners are named humans only where the ownership registry has them; many backups are not named in the prototype and are flagged.
- Only 400 px and 1440 px were measured; tablet widths are not.
- Contrast ratios are computed for tokens, not for every rendered text node.
- Screen rows that say 'Gap' for empty, loading or error states mean no such element was found on the default view, not that the screen lacks the capability by design.
- Req IDs follow insertion order per module and can change when the prototype changes; keep a mapping if rows are tracked externally.
