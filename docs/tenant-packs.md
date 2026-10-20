# Tenant packs: format, generator and the path a customer's data takes

Describes how a tenant's content gets into the prototype. It carries no status or priority: those live in the Product Backlog (DC-09, DC-11, DC-22, DC-23, CL-57, JM-07, DC-25). Rules: R16 to R20, R12, R25, R26, R52. Contract: `docs/ARCHITECTURE.md` section 1 (`DATA`). Background: `docs/tenant-seams.md`.

Every tenant other than Meridian is a **fictional** sample organization: Larkspur Health System (healthcare), Redstone Resources (mining and operational technology), Corvane Data Protection (storage and backup). Every figure in a pack is sample data, labeled simulated or modeled. Tenant isolation in this prototype is **simulated**: one browser page, application code only.

## 1. The path (R20)

```
spec (JSON, hand-written)  ->  tools/generators/gen_pack.py  ->  src/mod_s_pack_<id>.js (generated)  ->  DATA.pack(id, rows, info)
                                 validates, refuses on error                                         same call a real customer's data would use
```

1. **Spec.** `tools/generators/gen_pack_specs/<tenant>.json`. Small and readable: the organization, people, strategy, records, metrics, processes, vocabulary and COO inputs. It is the only file a person edits.
2. **Generate.** `python3 tools/generators/gen_pack.py --all` (or one spec path; `--check` validates without writing). The generator expands the spec into rows (ids, the leaders as people, key results under their objective, maturity records with the computed level, workload hours) and refuses to write anything when a check fails.
3. **Load.** The emitted module calls `DATA.pack(id, rows, info)`, registers the organization (functions and leaders) with `TENANT`, and lists the pack in `window.TENANT_PACKS` for the Tenancy screen. No screen code changes when a tenant is added.
4. **Read.** Screens read through `DATA.get(entity)`; the active tenant decides whose rows come back. A tenant with no rows for an entity gets an empty list and a recorded gap (`DATA.gaps()`), never Meridian rows (R18).
5. **Check.** `DATA.validate(id)` in the browser (Tenancy screen, `tools/tests/tenant.js`), the leak test (`tools/tests/tenant_leak.js`) and the rehearsal check (`tools/tests/tenant_tour.js`).

**A real customer's data** would take the same path with a different first step: an onboarding export or connector produces the same spec shape (or the same row shape directly), the same validator runs, and the same `DATA.pack` contract loads it. In the real build that contract sits on a tenant-scoped store with isolation enforced below the application (R43: row-level policies, tenant-scoped keys in caches, search and files). That is a plan, not a claim: nothing in the prototype stores or enforces anything below the page.

## 2. Spec format

Top level:

| Key | Content |
|---|---|
| `tenant` | Lowercase id (`health`, `mining`, `storage`). Must match the id in `SCN.list` for the journeys to be reused. |
| `prefix` | Two letters for generated person ids (`lh-ana-morales`). |
| `label` | Default number label for the pack: `simulated` (or `fact`, `modeled`, `hypothesis`). |
| `info` | `org`, `short`, `kind` (required), `industry`, `fund` (funding available for new work, in thousands, modeled), `fy`, `story` (one sentence for the executive view). |
| `images` | `hero` (an existing asset path) and `provenance`. Brand imagery is AI-generated; provenance applies before any external use (BR-05). |
| `reuse` | Content reused from the existing build instead of copied: `journeys`, `workflows`, `personas` (from `SCN`). |
| `org` | `lead {n, t}` and `fns [{n, lead {n, t}, teams []}]`. Leaders become people automatically; the org chart reads this through `TENANT.orgs`. |
| `people` | `{name, role, team, kind, mgr}`; `kind` is `human`, `agent` or `robot`. Agents and robots need a human `sponsor` (R12); agents carry `tier`, `hrs` (hours a week, modeled) and `does`. |
| `pillars` | Strategy skeleton: `{id, n, d, obj}`. |
| `objectives` | `{id, n, sub, owner, backup, story, krs: [{id, n, u, start, cur, tgt, metric, owner, backup}]}`. |
| `projects` | `{id, n, short, owner, backup, obj, bac, paid, health, pct, story}`. `bac` and `paid` are in thousands, as in the Meridian `PROJ`. |
| `budget_lines` | `{id, p, cat, n, appr, comm, act, fcst, own, bk, why}` in dollars, as in Meridian `S.bud.lines`. |
| `invoices` | `{id, vendor, amt, p, line, due, rec, own, bk, story}`; `rec` is `pay`, `hold` or `review`. |
| `demand` | `{id, n, who, sp, bk, cost, ben, strat, risk, urg, obj, why}`; cost and benefit in thousands, as in Meridian `DEMAND`. |
| `metrics` | `{id, n, u, base, cur, tgt, dir, owner, backup, obj, f, rem, label}`: formula, baseline, target, direction and remediation are required (R25). |
| `processes` | `{id, n, wf, owner, backup, metrics [], steps [[name, kind]], maturity {dims {defined, owned, measured, integrated, automated, governed}, target}}`. `wf` reuses an existing workflow for the steps; `steps` is used when there is none. |
| `vocabulary` | `{key: [singular, plural]}` (section 4). |
| `coo` | `workload [[name, role, unit, pct, cap, rep, mtg, apr, ops, prj]]` and `value_chain {n, steps [{n, in, who, min, note, bridge, agent}]}` (section 5). |

## 3. What the generator checks

A pack is refused when any of these fail; the message names the row.

- Required fields per entity; unique ids; links resolve (budget line to project, invoice to project and line, key result to metric, project and demand to objective, process to metric).
- R12: every objective, key result, project, budget line, invoice, demand, metric and process has an owner and a **different** backup, both people in the pack; every agent and robot has a human sponsor.
- R25: every metric has a formula, a baseline, a target, a direction, a remediation and a number label.
- R26: every process has a maturity record with all six dimensions (1 to 5) and a target; the level is the lowest dimension.
- Honesty and naming: no em dash; no banned external names; no other tenant's organization name.
- **Name collisions:** no person may share a full name with anyone in the Meridian source files. This check renamed two org leaders that collided with Meridian people: the Redstone chief financial officer is now Adaeze Moreland and the Corvane VP of engineering and supply is now Marisol Ekdahl. The generated pack registers its organization with `TENANT`, so the org chart shows the new names; the old literals in `mod_r32_tenant.js` are now fallbacks only and can be removed in the sweep.

`tools/tests/tenant.js` repeats the important checks in the browser (pack generated from a spec, every entity present, owners and backups, maturity, sponsors, no Meridian name, the invoice to line to project to objective thread).

## 4. Vocabulary (CL-57)

`DATA.term(key, n | {many, cap, tenant})` returns the active tenant's word; `DATA.terms(tenant)` returns the map. A tenant without its own word gets the platform default (configuration, not another tenant's data). Keys and words:

| Key | Default (Meridian) | Larkspur | Redstone | Corvane |
|---|---|---|---|---|
| customer | customer | patient | offtake customer | customer |
| incident | incident | patient safety event | safety event | data recovery event |
| ticket | ticket | service request | work order | support case |
| request | request | referral | work request | service request |
| asset | asset | medical device | piece of equipment | appliance |
| site | site | hospital | mine site | customer site |
| downtime | outage | downtime | unplanned downtime | outage |
| workforce | team | care team | crew | field team |
| work_item | ticket | case | work order | support case |
| frontline | service desk | access center | control room | support desk |
| service | service | service line | operation | subscription |
| order | order | order | shipment | order |
| case | case | encounter | investigation | support case |
| supplier | vendor | supplier | supplier | supplier |
| revenue | revenue | net patient revenue | concentrate revenue | recurring revenue |

Used today by the tenant views (`tn_projects`, `tn_metrics`) and the adapters (`port` request wording, invoices supplier column). **Hard-coded nouns elsewhere, for the wave 3 sweep** (lines in `src/mod_*.js` mentioning the word, excluding tenant and journey files; a line can hold several uses):

| Word | Lines | Files | Most uses |
|---|---|---|---|
| incident | about 1,560 | 95 | mod_itsm, mod_chat, mod_kcs, mod_plat_modmap, mod_sla |
| vendor | about 1,660 | 114 | mod_sow, mod_budget, mod_people, mod_kcs, mod_sla |
| asset | about 550 | 40 | mod_svc, mod_r16h_b_ci, mod_plat_fin, mod_oncall, mod_r16h_a_status |
| service desk | about 440 | 66 | mod_itsm, mod_people, mod_kcs, mod_svc, mod_chat |
| customer | about 300 | 44 | mod_r16m_b_setup, mod_r24_ops, mod_r16m_a_core, mod_sla, mod_sow |
| ticket | about 270 | 49 | mod_people, mod_kcs, mod_chat, mod_svc, mod_plat_contract |
| outage | about 80 | 33 | mod_plat_modmap, mod_itsm, mod_r17q_b_core, mod_zsearch, mod_svc360 |
| work order | about 30 | 4 | mod_r24_ops, mod_r25_a_data, mod_plat_contract, mod_org |

Many of these are IT service management screens where the IT word is right for every tenant (an IT incident is an incident in a hospital too). The sweep should replace only the nouns that name the tenant's own business object, and only on screens that move to DATA.

## 5. COO brief inputs (JM-07)

Entities per tenant for the COO brief tabs of Agent Action (`orgdesign`), which the journey stream wires:

| Entity | Row | Meridian (core) source |
|---|---|---|
| `workload` | `{id, n, role, unit, pct, cap, hrs, rep, mtg, apr, ops, prj, tot, aug, label}`: the same shape as `ODX.people()`; `aug` is hours a week an agent could take (modeled with the `ODX.AUG` working defaults) | `ODX.people()` |
| `value_chain` | `{id, flow, n, in, who, min, note, bridge, agent, label}`: the same shape as `ODX.O2C.steps` | `ODX.O2C` (order to cash) |
| `pillars` | `{id, n, d, obj}` | three Meridian pillars (fictional) |
| `objectives`, `key_results`, `metrics` | as above | `NODES`, `S.exe.krs`, `METRICS` |
| `people` with `kind` agent or robot | `sponsor`, `tier`, `hrs`, `does` | `DIR` |

The value chains are Referral to paid claim (Larkspur), Mine plan to cash (Redstone) and Quote to renewal (Corvane). The Executive dashboard adapter's COO tab already shows these per tenant.

## 6. Screens that read through DATA

`mod_s_tenant_screens.js` adapts existing read-only screens without editing their modules: it wraps the registered renderer, so Meridian renders the owning module exactly as before and any other tenant renders the same screen from `DATA.get`, with the tab names the Showroom tours click. Each is registered as mode `data`.

| Screen | Entities | Tabs under a tenant |
|---|---|---|
| `metrics` Metrics | metrics, key_results, processes | one view |
| `exe_strat` Strategy alignment | objectives, key_results, projects, pillars | Objectives and key results, Coverage gaps, Strategy pillars |
| `strat_exec` Strategy to execution | pillars, objectives, key_results, projects, processes | one view |
| `port` Portfolio | projects, demand | Portfolio, Capacity vs demand |
| `bst` Budget and spend traceability | objectives, projects, budget_lines, invoices | Summary, Trace detail |
| `exe_dash` Executive dashboard | workload, value_chain, metrics, people, budget, invoices, objectives | COO, CFO, CEO |
| `exe_mat` Maturity models | processes, maturity | one view |
| `r18_mature` Maturity roadmaps | processes, maturity, metrics, projects, workflows | Maturity roadmaps, By dimension |

Plus the tenant views `tn_projects`, `tn_people`, `tn_metrics` and `tn_admin` (Tenancy), and the two screens that follow the tenant another way (`ppl_jrny`, `orgassist`).

An adapter is a bridge, not the end state: the owning module should read `DATA.get` itself in the sweep, and the adapter is then deleted.

## 7. The 58 entities of PR-32 (B0, B1)

`src/mod_s_tenant_entities.js` defines the 58 entities of `docs/data/entity-plan.md` section 3 (50 records, 8 configuration) on `DATA`, each with a core getter over the Meridian stores the screens read today, and lists them in `window.TENANT_ENTITIES` (`list`, `get`, `part`, `parts`, `links`, `pairs`, `people`). An entity that gathers several Meridian stores has one part per store; a core row keeps its own object, and a row without a usable id gets a read-through copy with a made-up id and `srcId`. No screen reads these entities yet: the screen batches (B2 to B10) move them.

The spec's `records` section holds the industry words (services, configuration item kinds, vendors, risks, controls, audits, policies, courses, rooms, forums, meeting series, capabilities, applications, connectors and so on). `gen_pack.py` expands it into rows at the plan's demo volumes (hypothesis), linked to the pack's own people, projects, budget lines, objectives, metrics and processes, with the Meridian field names, a `part` on every row and `svcId` next to any service name. It refuses the pack when a link does not resolve inside the pack, an owner and backup are missing or the same person (R12), a people field names someone outside the pack, a role has no holders, or a real organization or product name appears. A spec without `records` produces none of these entities (a recorded gap). The rows of these entities (about 1,850 per pack, some 425 KB of JSON) are written to on-demand data, `src/assets/data/pack_<id>.json` (CL-39, `docs/bundle.md`), not into the module, so the first-paint script stays inside its budget: `full.html` embeds the file and the rows load at once; the split build fetches it when that tenant becomes active or the Tenancy screen opens, and until then the entities are gaps (R18). `tools/tests/data_entities.js` repeats the checks in the browser and walks the threads: service to configuration item to change to incident, risk to control and back, agent to sponsor and process, budget line to project to objective, role holders to people, approval policies to groups.
