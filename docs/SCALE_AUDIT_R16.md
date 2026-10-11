# Scale audit, Round 16 (Agent J)

Question: do pickers read the right source, is anything duplicated, and what happens with 50 or 500 projects?
Answer: pills stay only for small fixed sets. Anything that grows with data now uses `PICKER` (searchable, keyboard, grouped, recent and starred, virtualized) and reads one registry, `LISTS`.

## One registry, no copies
`mod_r16j_a_lists.js` defines `window.LISTS`. Each entity has one accessor that reads the system of record and memoizes on a cheap version key. Nothing is copied into a second array.

| Accessor | Source of record | Consumers repointed |
|---|---|---|
| `LISTS.projects()` | `PROJ` plus `SCALE.projects()` in Enterprise mode | Master schedule `allProj()`, Budget model, cost pool, benefits, new-benefit initiative, Plan picker, change request form, service relationships, Executive trace, trace records |
| `people()`, `teams()` | `DIR`, `TEAMS` | person pickers |
| `vendors()`, `costCenters()` | `BUDX.B().vend`, `BUDX.DEPTS` | Budget |
| `cis()`, `services()` | `CMDBX.all()`, `SVCREG` | CMDB, service pickers |
| `tables()`, `entities()`, `fields(t)` | `DATAMODEL.tables` plus `PLAT.entities` | Admin studio |
| `metrics()`, `processes()`, `changes()`, `incidents()`, `demand()`, `traceRecords()` | `METRICS`, `PROCLIB`, tickets, `DEMAND`, `NODES` plus projects | chart builder, dashboards, trace |

`LISTS.adapter(entity,{consumer,filter})` gives pickers `query`, `resolve`, `count`, and paged async reads. `LISTS.use()` records consumers so Platform registry can show who reads a list.

## Duplicated sources found
1. Projects were six lists: `PROJ` (4), `SCALE.projects()` (236 or n), `UPROJ()` and `XT.proj` (copies with a work breakdown), `allProj()` in Master schedule, `NODES` in the trace graph (PR1 and PR2 only), and `PROJ.map` pills in Budget. Now one list. `UPROJ()` and `XT.proj` stay as the derived work breakdown for the same ids; the Enterprise test checks `UPROJ ids ⊆ LISTS ids`.
2. Executive trace could not trace PR3, PR4 or any Enterprise project. `LISTS.traceRecords()` adds registry projects and synthesizes the node and a `contains` edge on pick.
3. Budget had three separate `PROJ.map(...)` selectors (model, cost pool, benefits). They are one adapter filtered to projects that have budget lines.
4. Project lookup by id used `PROJ.find` and `SCALE.projects().find` in two modules. Both call `LISTS.project(id)`.
5. Admin studio kept its own 4-object list. It reads `LISTS.tables()` (254 tables).

Not repointed: Agent K's `D.reg` (trace goals) is a derived registry; the Enterprise test asserts it stays a subset of `LISTS.projects()` but it still holds its own array.

## Converted controls
Shared kit: `fieldHTML` types `chips`, `multi` and the new `pick` delegate to `PICKER` when the field has a source or more than 7 options.

| Screen | Control | Data source |
|---|---|---|
| Executive trace | project and record picker `sx_proj` | `LISTS.traceRecords` |
| Budget | model project `bud_mproj`, cost pool project, benefit register `bud_benproj`, new benefit initiative | `LISTS.projects` filtered by budget lines |
| Plan | `plan_proj` (when more than 6 projects) | `LISTS.projects` |
| Demand, change request | project field | `LISTS.projects` plus `DEMAND` |
| Service 360 | relationship project | `LISTS.projects` |
| Admin studio | object chips, table picker, field picker | `LISTS.tables`, `LISTS.fields` |
| Dashboards | library, chart builder measure, dimension, filter | semantic layer, `METRICS`, saved charts |
| Activity log | kind chips (9) | fixed log kinds, grouped |
| Change, Knowledge editor, Discovery, Material, Observability | CHG ids (12), multi (12), rows (9), chips (10), filters (10) | upgraded by `PICKER.upgrade()` |
| Service catalog, GRC risk, Visualization builder | categories (14), chips (9), families (16) | upgraded by `PICKER.upgrade()` |

Scan result (`j16_scan.js`, groups of 8 or more chips): 67 screens before, 66 after, and 13 groups gone from the DOM.

## Left as pills or lists on purpose
Tabs and view switches, legends, galleries, graph nodes, heatmap cells, stat rows, nav rows (`data-go`), months (12 fixed), calendar strips, and any group of 7 or fewer.

## Honest gaps
- `mpHTML` / `MPOPT` multi-selects (class `mpl2`, about 60 sites) are already searchable lists but cap at 200 rows and re-render fully. Left as is. Move them onto `PICKER` when a list can exceed 200.
- Master-detail lists with their own detail pane were not converted: Admin security people (11), CMDB classes (`itom-hb`, 12), CMDB model rows (9, 19), People org team mix (22), Fabric connectors (11), Service guides people (60). They are navigation lists, not filters. The 60-row people list will need virtualization when it passes about 200.
- Dashboard library uses `VIZ.lib` (19 saved visuals) as kind `viz`; Visualization builder dashboards (`S.viz.dash`) are not yet bridged into the layout engine.
- Async adapter is simulated (50,000 rows in the List registry tab). No server exists yet.
- Open time is dominated by page layout (about 9,000 nodes, 100 to 350 ms for a forced reflow on this machine). Picker compute is under 8 ms at 500 projects.

## Enterprise-scale test
`node j16_enterprise.js out_j16 [50,500]` loads a fresh page per size, switches Enterprise data on, then asserts: `LISTS.projects().length` equals n, no duplicate ids, `UPROJ` ids are a subset of `LISTS`, adapter count equals n, and for `sx_proj`, `bud_mproj`, `plan_proj`: best of 3 opens, filter time under 50 ms, rendered window under 60 rows.

| Projects | Open (best of 3) | Filter | Rows | Window |
|---|---|---|---|---|
| 50 | 20 to 50 ms | 0.3 to 7 ms | 4 to 61 | 4 to 11 |
| 500 | 12 to 119 ms | 0.5 to 4 ms | 4 to 500 | 4 to 11 |

Budget shows 4 rows by design (only projects with budget lines). Result: ENTERPRISE PASS. A 10,000-option picker (List registry tab) opens with a 14-row window (185 ms on a loaded machine).
