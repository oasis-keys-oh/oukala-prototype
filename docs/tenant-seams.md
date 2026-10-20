# Tenant seams: audit and loader spike (DC-03)

Describes where tenant data lives in the prototype today, how modules read it, and what the first DATA slice changes. It carries no status or priority: those live in the Product Backlog. Rules: R16 to R20, R43 to R45, R52. Contract: `docs/ARCHITECTURE.md` section 1 (`DATA`).

Tenant isolation in this prototype is **simulated**: one browser page, sample data, application code only. Nothing here is enforcement below the application (R43 is a plan for the real build).

## 1. Where tenant data lives

All Meridian sample data is held in top-level `const` bindings of the core files (`data.js`, `data2.js`, `kit2.js`) or on `S`. A `const` cannot be reassigned, so a tenant switch can only mutate these in place or route reads around them. Counts below come from a static scan of `src/mod_*.js` (references per module). "Captured at load" is a heuristic: a top-level `const`/`let` whose initializer reads the global outside a function, so the value is fixed when the module loads. Treat it as a candidate list, not proof.

| Global | Defined in | Holds | Modules reading it | Captured at load (candidates) |
|---|---|---|---|---|
| `METRICS` | data.js | Metric definitions and values (462 after load) | 110 | mod_exec, mod_itsm, mod_kcs, mod_obs, mod_oncall, mod_org, mod_people, mod_plat_atlas, mod_plat_build, mod_plat_debt, mod_plat_gate, mod_plat_links, mod_plat_modmap, mod_plat_registry, mod_r15d_facts, mod_r17u_a_core, mod_r17u_b_ben, mod_r32_scrmap_b_screen, mod_rel |
| `DIR` | kit2.js | People and agents (113) | 65 | mod_flow, mod_itsm, mod_kcs, mod_meet, mod_meet3, mod_oncall, mod_org, mod_people, mod_ppm, mod_r15e_roles, mod_r15f3_iam, mod_sow, mod_svc, mod_zlink |
| `PERSONAS` (app lenses) | data.js | CIO, PMO and other lenses | 38 | mod_admin, mod_people, mod_r15d_persona, mod_r18g_levels, mod_r22_roles |
| `PROJ` | data2.js | Projects (4) | 34 | mod_budget, mod_budget2, mod_exec, mod_meet3, mod_plat_cover, mod_zlink |
| `SVCREG` | kit2.js | Services | 34 | mod_chat, mod_devops, mod_itom, mod_itsm, mod_obs, mod_oncall, mod_ppm, mod_sla, mod_svc360 |
| `PROC.defs` | kit2.js | Screen process models (307 at load, grows as screens render) | 31 | mod_plat_build, mod_plat_links, mod_r31_jx |
| `S.bud` | mod_budget.js | Budget lines (17), ledger, POs, contracts, vendors | 22 | mod_zlink |
| `DEMAND` | data2.js | Demand requests | 17 | mod_budget, mod_plat_fin2, mod_ppm |
| `TEAMS` | kit2.js | Teams | 17 | mod_flow, mod_itom |
| `CIREG` | kit2.js | Configuration items | 17 | mod_devops, mod_itom, mod_itsm, mod_kgx, mod_obs, mod_sla, mod_svc360 |
| `INVOICES` | data.js | Invoices (4) | 15 | mod_zlink |
| `NODES` | data.js | Trace graph: objectives (2), portfolios, projects, budget lines, contracts | 11 | none |
| `JYX.JY.list` | mod_r28_jy* | Journeys | 10 | mod_people, mod_r31_jzorg |
| `MEETINGS` | data.js | Meetings | 7 | mod_meet |
| `WFX.defs` | mod_flow | Workflows | 6 | none |
| `AGENTS` | data.js | Agent catalog | 4 | mod_people, mod_plat_contract |

Three arrays are tenant-swapped in place today by `SCN` (`mod_r28_scn.js`): `WFX.defs`, `JYX.JY.list` and `JYX.PERSONAS`. Everything else above is Meridian-only.

## 2. Who re-reads the tenant at render

Re-read at render (follow the tenant): `mod_r31_jzorg` (org chart with agent assist, `TENANT.orgs`), `mod_r31_jzx` (build list, `TENANT.name`), `mod_r31_jx` (registers generated workflows into the active pack), `mod_r30_jov` (resets its overlay when `SCN.cur` changes), `mod_r32_orgprop` (cache keyed by tenant), `mod_r32_num_b` (record numbers carry a tenant), `mod_r33_showroom` (tours start on Meridian).

Version-keyed caches and how they now subscribe:
| Cache | Before | Now |
|---|---|---|
| `mod_r32_orgprop` `CACHE/CK` | keyed by `SCN.cur` | keyed by `SCN.cur` and `DATA.version` |
| `mod_r30_jov` `JOV.scn` | resets on `SCN.cur` change | unchanged (correct: overlay state is tenant state) |
| `mod_zlink` `uniVersion` | 2 second time cache over counts | dropped at once on `DATA.on("change")` |

## 3. Decision: live switch, no reload

The switch is live. `DATA` owns the active tenant; `SCN.set` and `TENANT.switch` both go through `DATA.setTenant`; a `DATA` change listener in `SCN` swaps the three arrays; one `tenantChange` hook re-renders the same screen with `S` kept (screen, tabs, filters). Reload stays only as an interim fallback for a demo machine that cannot switch live: `TENANT.reloadTo(id)`, or `?tenant=` (alias of `?scenario=`) in the address.

Screens move to `DATA.get` one by one. Until a screen moves, it is listed as `core` in the screen registry and, under any other tenant, shows a label: the tenant name and "This screen is not tenant-aware yet and still shows the Meridian sample data." That keeps R17 (tenant always visible) and is honest about R18 while the migration runs.

## 4. Loader spike: Healthcare on three screens

`src/mod_s_tenant_health.js` is a small pack in the DC-09 format for Larkspur Health System (fictional): 4 projects, 5 budget lines, 4 metrics, 2 objectives, 4 extra people. Three read-only screens read only through `DATA.get` and were registered from `src/mod_s_tenant.js`, so no other stream's file changed:

| Screen | Entities | Under Healthcare |
|---|---|---|
| `tn_projects` Projects and budget (tenant view) | projects, budget_lines | 4 projects, $5.15M approved (sample, simulated), 5 lines |
| `tn_people` People directory (tenant view) | people | 9 people and agents (function leaders from `TENANT.orgs` plus the pack) |
| `tn_metrics` Metrics and objectives (tenant view) | metrics, objectives | 4 metrics, 2 objectives |

Mining and storage have people, journeys, workflows and personas only; their projects, budget lines, metrics, objectives, invoices and processes are recorded gaps and the screens say so. A gap is never filled with Meridian rows (R18). The full industry packs are wave 2 (DC-11, DC-22, DC-23).

## 5. The DATA slice (CL-55, DC-09)

Entities defined over the existing globals in `mod_s_tenant.js`: `projects`, `budget_lines`, `invoices`, `people`, `metrics`, `objectives`, `processes`, `workflows`, `journeys`, `personas`. Industry tenants get `journeys`, `workflows`, `personas` and `people` from content that already exists (`SCN.pack`, `TENANT.orgs`).

Pack format: `DATA.pack(tenantId, {entity: rows | () => rows}, {org, short, kind})`. Each row carries the entity key (`id`). `DATA.validate(tenant)` reports unknown entities, missing or duplicate keys, missing required fields, and any other tenant's organization name inside the pack; gaps are warnings. `DATA.snapshot(tenant)` gives counts and ids per entity. `tools/tests/tenant.js` checks the Meridian core snapshot in `tools/tests/tenant_core_snapshot.json` (exact ids for record entities; no lost ids for the growing registries `metrics`, `processes`, `workflows`).

Screen registry: `DATA.screen(id, {mode, entities})`, `DATA.screens()`, `DATA.screenMode(id)`. Modes: `data` (reads through DATA: the three spike screens and Tenancy), `tenant` (follows the tenant another way: Journey maps on every tab, Org chart with agent assist), `core` (Meridian only, labeled). The Tenancy screen (`tn_admin`) shows the registry, entity counts per tenant, gaps, pack validation and the demo identity.

## 6. Identity and membership (CL-63, demo side)

`IDENT` holds three fictional identities. Casey Rowan (demo presenter) is a member of all four tenants (Executive and Tenant admin on Meridian, Demo viewer elsewhere); Jordan Lee only of Meridian (Architect); Grace Oduya only of Larkspur Health (Executive). Roles map to actions (`view`, `approve`, `configure`); anything not granted is denied. `DATA.guard` refuses a switch to a registered tenant without a membership, and the switcher, the scenario chooser and search only offer member tenants. Simulated, labeled on screen.

## 7. Leakage test findings (CL-56, `tools/tests/tenant_leak.js`)

- The module owner badge in every screen header (`mod_own2`) showed a Meridian owner under every tenant. Fixed: no badge under another tenant until owner records are tenant-scoped.
- Agent Action (`orgdesign`) presets per tenant but its gaps and options read the Meridian sample. Classified `core` (labeled) instead of tenant-aware.
- Name collision: the Larkspur chief financial officer shared a name with a Meridian person in the onboarding sample. Renamed to Helena Marsh. Tenant packs should check names against the Meridian corpus (wave 2).
- Search: about 1,789 Meridian records are returned under other tenants because the legacy search providers are not tenant-aware. Reported by the test, not failed. Industry tenants' records never appear under another tenant.
- Not tenancy, found on the way: opening `plat_self` adds project PR5 with no run-cost record, after which the budget screens throw (`runTot` reads `run.PR5`). The leak test sweeps legacy screens on a fresh page to stay clear of it.

## 8. Suggested migration order

Read paths with the most modules first, through accessors: `METRICS` (110 modules), `DIR` (65), `PROJ` (34), `SVCREG` (34), `PROC.defs` (31), `S.bud` (22). Search providers should move with their entity, so search follows the tenant. Owner records (`mod_own2`) need a tenant-scoped store before the badge can come back under other tenants.
