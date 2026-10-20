# Tenant data coverage (PR-32)

Goal: every screen shows each sample company's own data. The tenants are fictional: Meridian Standards Foundation (`core`), Larkspur Health System (`health`), Redstone Resources (`mining`), Corvane Data Protection (`storage`). This folder describes; the Product Backlog tracks status and priority.

## Files
- `tenant-coverage.csv`: one row per registered screen. Columns: `id`, `name`, `area` (from `docs/ia/screen-inventory.csv`), `module_file` (the file holding the render function), `other_files`, `tenant_mode` today (`data`, `tenant`, `core`), `core_paths_read` (Meridian data paths read at render, measured), `entities_read_by_screen` (by its own files), `entities_read_by_shared_helpers` and `shared_helper_modules` (rows that come through other files), `entities_via_DATA`, `entities_via_work_index` (owner chips and load badges), `entities_needed`, `entities_not_in_DATA`, `module_private_seeds` (sample arrays inside the module that the harness cannot see), then per tenant the row count for each needed entity (`gap` when DATA defines it but the pack has no rows, `no entity` when DATA does not define it) and `ready_<tenant>`.
- `entity-plan.md`: the 58 entities to add, grouped by business area, with core getter sources, fields, screen counts, demo volumes per pack, vocabulary keys and the batch plan.
- Scripts in `tools/scratch/data/`: `instrument.js` (the measurement), `entity_map.py` (path to entity), `analyze.py` (writes the CSV), `batches.py` (batch plan), `volumes.js` (Meridian row counts), `redirects.js`. Their outputs `reads.json`, `summary.json`, `batches.json`, `volumes.json` sit next to them.

## Counts (prototype fact, build at 828e227, core tenant)

| Measure | Count |
|---|---|
| Registered screens | 196 |
| Read through DATA (`data`) | 12 |
| Follow the tenant another way (`tenant`) | 3 |
| Meridian only (`core`) | 181 |
| Data paths instrumented | 657 |
| Tabs clicked | 743 on 148 screens |
| Page errors during the run | 0 |
| Entities DATA defines today | 17, all with rows in the three industry packs |
| Entities to add | 58: 50 record entities and 8 configuration entities; none has pack rows yet |
| Meridian-only screens ready now (need only defined entities with pack rows) | 23 |
| Meridian-only screens with no tenant business data | 5 (two redirect, three are product pages) |
| Meridian-only screens still missing 1, 2, 3, 4, 5, 6 or more entities | 34, 22, 21, 16, 20, 40 |
| Meridian-only screens whose module holds private sample arrays | 129 |

Meridian-only screens by area (prototype fact): Build and admin 44, Risk, control and AI 30, Operations and service 28, Money and contracts 19, Strategy and value 13, Portfolio and delivery 12, My work 10, Transformation 10, People and organization 5, Ask or request 4, Showroom 4, Home 1, not in the IA inventory 1.

## Entities that unlock the most screens (Meridian-only screens that read them, prototype fact)

Already defined, widest reach: metrics 161, processes 150, people 118, projects 32, budget_lines 30. To add, widest reach: role_assignments 52, services 34, config_items 27, agents 25, approval_policies 25, org_units 24, plan_tasks 23, risks 21, changes 21, raid_items 20, work_items 20.

## Batch plan (headline)

Eleven batches. B2 to B10 cover 147 source files and no file is in two of them; B0 and B1 touch only the entity layer, the generator and the packs. B0 adds the 58 entity definitions in one new file (serial, first). Then in parallel: B1 fills the three packs (one lane per tenant), B2 moves the cross-cutting helpers (`ui.js`, `kit2.js`, `mod_org`, `mod_zlink`, `mod_s_owner` and others), and seven area batches move the screens: Strategy and value (15 screens), Portfolio and delivery (11), Money and contracts (16), Operations and service (44), Risk, control and AI (22), People and my work (15), Build, admin, transformation and showroom (40). B10 goes last: 14 aggregator screens that read through five or more other modules, plus deleting the screen adapters. Detail: `entity-plan.md` section 6.

Volumes and vocabulary in `entity-plan.md` are hypotheses. Tenant isolation remains simulated.
