# Domain neutrality: object model and shared screens for non-IT tenants

Review for backlog item CL-61. It changes no code. It carries no status or priority: those live only in the Product Backlog. The ranked changes in section 4 are proposals for Omar to accept or reject; any accepted change becomes a backlog row. Rules cited: `docs/PLATFORM_RULES.md` (Part 1 building blocks, R1, R16 to R20, R21 to R23, R25 to R27). Background: `docs/tenant-packs.md`, `docs/tenant-seams.md`, `docs/inventory/screen-archetypes.md`.

## 1. Scope and method

**Date:** 2026-10-20, on the worktree of `main` at commit `58bad46`.

**Question.** Platform rules Part 1 says every application (projects, services, change, risk and resilience, finance, people, facilities, clinical or site operations) is built from six shared objects: Record, Process, Participant, Metric, Tenant and Chat. IT service management is "one application among them, not the template." This review asks how far the object model and the shared screens hold to that for the three fictional industry tenants (Larkspur Health System, Redstone Resources, Corvane Data Protection) and for facilities, finance, HR (human resources, people) and risk and resilience scenarios.

**What was read.** The documents above and `CLAUDE.md`; then the code: `DATAMODEL` and its ten registrations in `src/kit2.js`, the other `DATAMODEL.register` calls across `src/`, the registry domains in `src/mod_plat_registry.js` (read by the data atlas `src/mod_plat_atlas.js`), `PROC` and `STD` in `src/kit2.js`, the Process library `src/mod_plat_proclib.js`, `SVCREG`, `CIREG`, `TEAMS`, `DIR` and `KINDS` in `src/kit2.js`, `METRICS` in `src/data.js` and `src/data2.js`, the `DATA` slice and vocabulary in `src/mod_s_tenant.js`, the adapters in `src/mod_s_tenant_screens.js`, the three generated packs `src/mod_s_pack_{health,mining,storage}.js` and their specs in `tools/generators/gen_pack_specs/`, and these shared screens: Home (`src/data.js`, `src/mod_r21_home.js`), My inbox (`src/mod_inbox.js`), Approvals and the Workflow designer (`src/mod_flow.js`), approval groups (`src/mod_r16h_c_groups.js`), the record shell (`src/mod_r15f2_a_shell.js`, `src/mod_r15f2_c_adopt.js`), the org charts (`src/mod_org.js`, `src/mod_r31_jzorg.js`), Journey maps (`src/mod_people.js`), Metrics, search (`src/mod_s_search.js`, `src/mod_zsearch.js`), chat (`src/mod_chat.js`), agreements (`src/mod_sla.js`) and resilience (`src/mod_r16l_b_ui.js`).

**How.** Reading plus static scans with `grep` and a small Python line counter over `src/*.js`, excluding the quarantined " 2" duplicate files and the generated `oukala-js.js`. The prototype was not run for this review.

**Number labels.** Every number below is a **prototype fact** (counted from the code on 2026-10-20; the method is given next to it), unless it is marked **reported** (a prototype fact from an earlier dated document, cited) or **hypothesis** (a judgment). Line counts count lines that contain a word at least once, so they understate uses.

| Measure | Value | Label and method |
|---|---|---|
| Distinct tables registered with `DATAMODEL.register` | 56, in 18 files | prototype fact: unique first arguments of `DATAMODEL.register(` |
| Tables registered in `kit2.js` | 10 | prototype fact: count of calls |
| Entities defined in the `DATA` slice | 17 | prototype fact: `DT.define(` calls in `mod_s_tenant.js` |
| Vocabulary keys | 15 | prototype fact: keys of `VOC0` in `mod_s_tenant.js` |
| Vocabulary keys any screen asks for | 2 (`request`, `supplier`) | prototype fact: every `DATA.term(` and its local alias `T(` call |
| Screens that follow the tenant | 15 of 189 (12 `data`, 3 `tenant`) | prototype fact for the 15 (`DT.screen` and `adapt` calls); 189 is reported (screen-archetypes.md, 2026-10-19) |
| Record shell adapters | 22 | prototype fact: unique `R.adapter(` calls |
| Standards in `STD` | 17 in `kit2.js`, plus 8 assignments in other modules | prototype fact |
| Rows per industry pack | about 140 (health: 26 people, 11 metrics, 8 processes, 6 projects, 13 budget lines, 6 invoices, and so on) | prototype fact: header of each generated pack |
| Operational record rows (cases, work orders, events, assets) in any industry pack | 0 | prototype fact: the pack spec has no key for them |

## 2. Findings: the object model

### 2.1 Record

Records are described twice: `DATAMODEL` (table and field definitions that SLAs, workflows and visualizations read) and the record shell (`RECSHELL.adapter`, one drawer for any record type). The `DATA` slice is a third, separate list of tenant entities. None of the three has a neutral "work item" type: the generic thing a hospital, a mine or a backup provider works on every day (a referral, a work order, a safety event, a recovery case) has no table, no `DATA` entity and no pack key.

**Already neutral.**
- The record shell (`mod_r15f2_a_shell.js`): header with id, status, owner and backup, tabs (Details, Activity, Comments, Attachments, Related, Audit), mentions, watchers and links. Nothing in it names IT. It is the right container for any tenant's records.
- `DATAMODEL.register` itself: any table, any fields, a classification, and (through the atlas wrapper) a domain, owner module and steward. A pack could register tables through it today; the generator does not.
- `project` and `project_task` (portfolio vocabulary from PMBOK: work breakdown structure (WBS), schedule performance index (SPI), cost performance index (CPI)) fit any industry's projects. The industry packs already reuse `projects` and `budget_lines`.
- `invoice` (`vendor`, `amount`, `po`, `accepted_work`) is neutral apart from the word "vendor", which the Invoices adapter already swaps for `DATA.term("supplier")`.
- `contract_line` types (Deliverable, Milestone, SLA, Payment, Term, Liability) fit supplier contracts in every scenario.

**IT-specific.**

| Table (file) | What is IT-only | What a non-IT tenant needs |
|---|---|---|
| `incident` (`kit2.js`, extended in `mod_sla.js`) | Fields `ci` (configuration item), `service`, `assignment_group`, `caller`; `impact` options "1 - Service down" to "4 - Single user"; priority P1 to P4 "from impact and urgency" (the IT service management (ITSM) matrix); state model New, In progress, On hold, Resolved, Closed; `contact_type` includes "Monitoring"; source "ITSM" | A patient safety event needs a harm level, an event type, a location and a reporter, and a review state ("reported, triaged, investigated, closed with learning"). A mining safety event needs severity, a potential-severity class, the site and crew, and an investigation link. A data recovery event needs the protected workload and an agreed restore time. All three share owner, backup, state, priority policy and a clock. |
| `change_request` (`kit2.js`, `mod_sla.js`) | Types Standard, Normal, Emergency and states Assess, Authorize, Scheduled, Implement, Review (ITIL change enablement); `ci`, `service`; close codes | Permit to work (mining) and a clinical practice change (healthcare) are change-shaped but carry isolations, a permit holder, a return to service step and different approvers. |
| `request_item` (`kit2.js`, `mod_svc.js`) | `cat_item`, `offering`, catalog classes Hardware, Software, Access, Reporting, AV support, New hire | A referral (healthcare) or a work request (mining, facilities) is request-shaped; it needs the requested service from the tenant's own catalog, the requester and the receiving team. |
| `config_item` and `cmdb_rel_ci` (`kit2.js`, `mod_itom.js`, `mod_svc360.js`) | Environment Production, Test, Dev, DR; `last_discovered`; field authority in `mod_plat_registry.js` lists IP, OS, CPU, RAM, firmware | Equipment (haul truck, ball mill), a medical device or a backup appliance needs a location or site, a class from the tenant, a criticality, maintenance history and a parent. The configuration management database (CMDB) shape of "item, class, relation" is reusable; the enums and the discovery source are not. |
| `business_service` (`kit2.js`) and `SVCREG` | `tier`, `availability_30d`, `users`; the ten `SVCREG` services are Atlantic Systems applications | A service line (healthcare), an operation (mining) or a subscription (storage). The vocabulary key `service` exists; the table and registry are Atlantic Systems only. |
| `asset` (`mod_svc.js`) | Label "Hardware asset"; classes Laptop, Phone, Monitor, Dock, Network, AV; a vendor-specific device compliance flag | The `asset` vocabulary key already reads "medical device", "piece of equipment" and "appliance"; there is no matching table or pack entity. |
| `person` (`kit2.js`) | `kind` enum comes from `KINDS` = Employee, AI agent, Contractor, Managed service provider: **no robot** | See 2.3. |

**Registry domains.** `mod_plat_registry.js` groups tables into twelve domains: people, portfolio, agile, service, cmdb, ops, agree, fin, money ("Money (IT financial model)"), know, gov, plat. `domOf` sends any table it does not know to `ops` ("Operations and observability"). A `referral` or `work_order` table registered by a pack would therefore land in IT operations. The planned entities list (`PLANNED`) has risk, control and policy under "portfolio", and the "Governance, risk and compliance" domain holds no table. There is no site, location, facility, shift or work order entity, planned or built.

**Classification.** `DATAMODEL` has four classes (public, internal, confidential, restricted) and counts "personal" as confidential. Patient-level health data would need to be restricted by default and handled as its own kind of personal data; today a `referral` table would be inferred "internal" (its name matches none of the sensitive patterns in `DM_RX`).

### 2.2 Process

**Already neutral.** `PROC.reg(screen, def)` and the step shape (`n`, `d`, `who`, `owner`, `in`, `out`, `sla`) are domain-free, and step kinds go through `STEPMODE` (human, robot, agent, gate; R21). The pack format carries processes with steps, owners, backups, metrics and a six-dimension maturity record (R26). The three packs hold 8 processes each (prototype fact), all industry processes ("Referral intake and loop closure", "Permit to work and return to service", "Recovery case: ticket to restored"). Workflows (`WFX.defs`) are swapped per tenant by `SCN`, so the Workflow designer shows the tenant's workflows.

**IT-specific.**
- The Process library (`mod_plat_proclib.js`) does not read `DATA`: no `DATA.get`, `TENANT` or `SCN` reference (prototype fact, grep). Its families are `strat, demand, proj, agile, chg, inc, req, cmdb, evt, obs, fin, con, ppl, kn, ai, wf, gov`; six of them map to the ITIL model in `MODEL_BY_FAM`; default owners per family (`NAMED`) are Atlantic Systems people. A tenant's eight processes do not appear there.
- The pack process format has no `std` field, so R27 (name the reference standard) cannot be met for an industry process.

### 2.3 Participant

**Already neutral.** Pack people carry `kind` human, agent or robot, and agents and robots need a human sponsor (R12). `OWNERX.robots` (mod_s_owner) keeps the robot directory with sponsor and backup. `ownerChip` works on any name.

**IT-specific.** `KINDS` in `kit2.js` and therefore the `person` table enum lack the robot kind that R21 and R23 require. `TEAMS` (12 teams: PMO, Service desk, Change management, a vendor team) and `DIR` are Atlantic Systems only; `DIR` sets `org` to the Atlantic Systems name for every human. Person fields have `skills` but no credential or certification with an expiry date, no shift or roster, and no site; a nurse, a haul truck operator and a field engineer all need those. Role lists used for routing are hard-coded IT roles (see 3.2).

### 2.4 Metric

**Already neutral.** The `METRICS` shape (`n`, `f` formula, `u`, `cur`, `tgt`, `badAt`, `dir`, `tr` trend, `owner`, `rem` remediation) fits any domain, and the pack metrics are industry metrics (11 per pack, prototype fact: "30-day readmission rate", "Haul truck availability", "Median hours to restore").

**Gaps.** The Atlantic Systems `METRICS` rows have no baseline field (0 occurrences of `base:` in `data.js` and `data2.js`, prototype fact), while R25 and the pack format require one. `owner` is a team string ("IT Ops" on 3 rows, "PMO" on 7, prototype fact) rather than a person with a backup. The `use` list names screens by their English name, which ties a metric to Atlantic Systems screens. Composite health metrics (`m_ops` = availability, incident score, knowledge freshness) are IT-only and feed the Home rings for every lens.

### 2.5 Tenant

**Already neutral.** `DATA.pack`, `DATA.get`, gaps instead of Atlantic Systems rows (R18), validation, membership and the live switch. `DATA.term` with 15 keys and words for all three industry tenants (`docs/tenant-packs.md` section 4).

**Gaps.** The 17 `DATA` entities cover strategy, portfolio, finance, people, metrics, processes and journeys only. A tenant cannot bring records, sites, assets, services, approval groups, roles, application lenses (`PERSONAS`: exec as CIO, fin, pm, ops) or standards. Only 2 of the 15 vocabulary keys are ever asked for. The vocabulary key list is fixed by the platform (`VOC0`); a pack cannot add a key such as "permit".

### 2.6 Chat

**Already neutral.** `CHATADDR` addresses (`person:`, `team:`, `function:`, `record:<type>:<id>`, `process:`, `agent:`) take any record type.

**IT-specific.** Chat capabilities in `mod_chat.js` are fixed IT verbs per lens: `incident.create`, `incident.write`, `request.order`, `change.write`, `oncall.write`, `runbook.run`, labeled "Report an incident" and "Service desk write". Record lookup in chat recognizes `INC` ids and routes to `itsm_inc`. 62 lines in `mod_chat.js` mention "incident" and 26 mention CI or CMDB (prototype fact, line counter).

## 3. Findings: shared screens

### 3.1 Which screens follow the tenant

15 screens follow the tenant: `tn_projects`, `tn_people`, `tn_metrics`, `tn_admin` and eight adapters (`metrics`, `exe_strat`, `strat_exec`, `port`, `bst`, `exe_dash`, `exe_mat`, `r18_mature`) read `DATA`; `ppl_jrny`, `orgassist` and `orgdesign` follow it another way. Every other screen is `core`: under an industry tenant it shows Atlantic Systems data with the label "This screen is not tenant-aware yet". That is honest (R18) but means Home, the inbox, approvals, the record shell, the Process library and search all show Atlantic IT content to a hospital.

### 3.2 IT nouns on shared screens

Lines mentioning each word (prototype fact, Python line counter over the file; CI counts "CI", "CIs", "configuration item" and "CMDB", case-sensitive):

| Screen (file) | incident | CI or CMDB | CAB | ITIL | service desk | ticket | `DATA` reads |
|---|---|---|---|---|---|---|---|
| Home lenses (`mod_r21_home.js`) | 2 | 0 | 0 | 0 | 1 | 0 | 0 |
| My inbox (`mod_inbox.js`) | 2 | 1 | 3 | 2 | 1 | 0 | 0 |
| Approvals, Workflow designer (`mod_flow.js`) | 15 | 2 | 7 | 7 | 16 | 4 | 0 |
| Approval groups (`mod_r16h_c_groups.js`) | 0 | 0 | 3 | 0 | 1 | 0 | 0 |
| Record shell adapters (`mod_r15f2_c_adopt.js`) | 13 | 0 | 0 | 2 | 0 | 0 | 0 |
| Org chart (`mod_org.js`) | 20 | 7 | 6 | 1 | 13 | 4 | 0 |
| Journey maps and people (`mod_people.js`) | 40 | 0 | 5 | 7 | 36 | 40 | 0 |
| Org chart with agent assist (`mod_r31_jzorg.js`) | 0 | 0 | 0 | 0 | 0 | 0 | via `TENANT.orgs` |
| Search scope (`mod_s_search.js`) | 0 | 0 | 0 | 0 | 0 | 0 | 4 |
| Search palette (`mod_zsearch.js`) | 11 | 4 | 0 | 0 | 0 | 5 | 0 |
| Chat (`mod_chat.js`) | 62 | 26 | 4 | 3 | 24 | 16 | 0 |
| Resilience (`mod_r16l_b_ui.js`) | 0 | 11 | 0 | 0 | 0 | 0 | 0 |

CAB is the change advisory board. Notes on what each hard-codes:
- **Home**: the "Incidents" lens tile ("What is burning right now?") opens `itsm_inc` with mean time to restore (MTTR) as its lead metric; lens names come from `PERSONAS` (the executive lens is "CIO").
- **Inbox and approvals**: inbox sources are wired by module ("Change approvals (CAB)"); approval groups (`APG`) are seeded with Atlantic Systems people and kinds such as `apg_cab`. Approval routing (`APG.route(kind, rec)`) is neutral in shape; its groups and kinds are not tenant data.
- **Workflow designer**: the role picker `ALLROLES` and `USERROLES` list Atlantic IT roles (CIO, Change manager, CAB member, Service owner); `NEEDS` maps record kinds to IT approvers; gate detection matches "CAB" in step names.
- **Record shell**: 22 adapters, of which incident, change, problem and request are ITSM, four are continuity (`bc_*`), six are governance (audit, attestation, control, exception, finding, policy), and the rest are project, budget, purchase order, contract, vendor, person, risk and agent. None reads `DATA`; none is a pack record.
- **Resilience**: the continuity record is an "Application continuity record" (`bc_app`), tied to CIs. A hospital or a mine plans continuity for a site, a service line or a critical process.
- **Search**: `SRCH` is tenant-scoped, but the legacy providers in the palette are not: about 1,789 Atlantic Systems records were returned under other tenants (reported, `docs/tenant-seams.md` section 7, leak test of 2026-10-19).

### 3.3 How the industry tenants see these screens today (hypothesis, from reading the code)

| Scenario | Closest object today | What the tenant sees |
|---|---|---|
| Healthcare: patient referral | `request_item`, process LH-P01, metric "Referrals booked within 48 hours" | The process and metric show on Metrics, Maturity and Strategy; no referral record exists, so the inbox, the record shell and search have nothing to open. The SLA engine could time a referral but has no table to attach to. |
| Healthcare: patient safety event | `incident` | The word exists ("patient safety event"); the screen that would hold it is Atlantic Incidents with IT impact levels. |
| Mining: safety event, permit to work | `incident`, `change_request` | Processes RR-P03 to RR-P06 and the safety metrics exist in the pack; records, permits and investigations do not. |
| Mining: equipment, work orders | `config_item`, `asset`, `request_item` | The vocabulary reads "piece of equipment" and "work order"; the CMDB and asset screens show Atlantic Systems virtual machines and laptops. |
| Storage: recovery case, part replacement (RMA, return merchandise authorization) | `incident`, `request_item`, SLA clock | Closest fit of the three (the business is close to IT support); still Atlantic Systems rows and IT catalog classes. |
| Facilities | `request_item`, `asset` | No site, space or facility work order object; the asset classes are IT hardware. |
| Finance | `invoice`, `budget_line`, `project`, `contract_line` | The most neutral domain: packs bring budget lines and invoices and the trace screens follow the tenant. |
| HR and people | `person`, `time_off`, `skill_claim`, `oncall_shift` | Tables exist but `DIR` and `TEAMS` are Atlantic Systems only; no credential with an expiry, no roster for a shift workforce. |
| Risk and resilience | record shell `risk`, `raid_item`, `bc_*` screens | Risk is a planned table under "portfolio"; continuity is application-centric. |

Many ITSM screens are right to keep their IT words for every tenant (a hospital also has IT incidents), as `docs/tenant-packs.md` section 4 says. The problem is the shared screens and the shared object model, not the ITSM application.

## 4. Ranked changes (rank 1 = most value for least effort)

Sizes are a **hypothesis**: S is about a day or less, M a few days, L a week or more, for one session with tests.

| Rank | What to change | Why (rule) | Affected files or objects | Size | Depends on |
|---|---|---|---|---|---|
| 1 | Add the robot kind to `KINDS` and so to the `person` table enum, aliased so saved data still reads | R21, R23 | `kit2.js` `KINDS`, `DATAMODEL` `person`, readers of `KINDS` | S | none |
| 2 | Use `DATA.term` for the industry nouns on the chrome of shared screens only: Home lens tiles, inbox and approvals headings, record shell labels, search group names, chat capability labels. Leave ITSM screens as they are | R19 | `mod_r21_home.js`, `mod_inbox.js`, `mod_flow.js` (approvals), `mod_r15f2_a_shell.js`, `mod_zsearch.js`, `mod_chat.js` | S | none |
| 3 | Make the registry domain-neutral: an unknown table falls into "Unassigned" (not `ops`); add domains for operations by industry, safety, facilities and risk and resilience (or let a pack declare its domains); rename "Money (IT financial model)" to "Money (financial model)"; move risk, control and policy to the governance domain | R1, R19 | `mod_plat_registry.js` `DOM`, `domOf`, `PLANNED`; `mod_plat_atlas.js` | S | none |
| 4 | Add sensitive-data inference for health and safety records (names and fields such as patient, diagnosis, injury, medical) so they classify as restricted, and say on screen that the data is fictional | R16 (every table carries a classification) | `kit2.js` `DM_RX`, `DM_FX` | S | none |
| 5 | Give every Atlantic Systems metric a baseline and a person owner with a backup; keep the team as a separate field | R25, R12 | `data.js`, `data2.js` `METRICS`; `fchip` readers | S to M | none |
| 6 | Add domain standards to `STD` after researching current editions (for example patient safety and quality, occupational health and safety, asset management, facility management, risk management; business continuity already exists), and add a `std` field to pack processes and the generator check | R27, R20 | `kit2.js` `STD`, `tools/generators/gen_pack.py`, the three specs | S to M | none |
| 7 | Let the Process library index the active tenant's processes from `DATA.get("processes")`, with tenant families, a tenant default model and owners from the pack instead of `NAMED` | R16, R19, R26 | `mod_plat_proclib.js` | M | none |
| 8 | Add one neutral **work item** record: id, title, kind (from the tenant), state from a tenant state model, priority from a tenant priority policy, owner and backup, requester, site, asset, related process step and agreement clock. Register it in `DATAMODEL`, define it in `DATA`, add a `records` key to the pack spec, and give it a record shell adapter. ITSM incident, request and change stay as IT specializations of it (R1: extend, not new) | R1, R19, R20 | `kit2.js` `DATAMODEL`, `mod_s_tenant.js`, `gen_pack.py` and specs, `mod_r15f2_c_adopt.js`, the three packs | L | 3 |
| 9 | Add pack entities for sites, assets (equipment, medical device, appliance), services, approval groups and roles, with the same owner and backup checks | R19, R20 | `mod_s_tenant.js`, `gen_pack.py`, specs, `mod_r16h_c_groups.js` (`APG` reads groups through `DATA`) | M | 8 for links to work items |
| 10 | Let the agreement engine attach to work items: `sla_definition.table` accepts pack tables, customer tiers come from the tenant, and the clock shows on the work item | R19, R25 | `mod_sla.js` | M | 8 |
| 11 | Make chat capabilities and the designer role picker tenant data: verbs per record type (`record.create:<type>`) instead of `incident.create`; roles and approver needs from the pack | R13a, R19 | `mod_chat.js`, `mod_flow.js` (`ALLROLES`, `USERROLES`, `NEEDS`) | M | 9 |
| 12 | Move Home to `DATA`: lenses from the tenant's personas, rings from the tenant's metrics; the IT lens set stays the Atlantic Systems default | R16, R19 | `data.js` `PERSONAS` and Home, `mod_r21_home.js` | M | 2, 5, 9 |
| 13 | Make the legacy search providers tenant-scoped so search returns the work items of the active tenant only | R16, R18 | `mod_zsearch.js`, `mod_nav.js` index sources | M | 8 |
| 14 | Add a build check that fails when a shared screen (mode `data`) shows a vocabulary word without `DATA.term` | R19 | `tools/tests`, `DATA.screens()` | S | 2 |

Not proposed: renaming the ITSM application or its screens. An IT incident is still an incident in a hospital; neutrality belongs in the shared objects and shared screens.

## 5. Open questions for Omar

1. Should the industry tenants get a neutral work item (rank 8) while the ITSM screens stay IT-only and labeled, or should the Incidents screen itself become the generic case screen under the tenant's vocabulary?
2. One work item table with a tenant-defined kind, or let each pack register its own tables (referral, permit, recovery case) through `DATAMODEL.register`?
3. For the healthcare sample, should records be patient-level (fictional) or aggregate only? It changes how strongly rank 4 must classify them.
4. May a pack add vocabulary keys (for example "permit") and registry domains, or does the platform own the key and domain lists?
5. Should approval groups and roles (rank 9) be in scope for the pack generator now, or wait until the work item exists?
6. Which standards should each industry tenant show, and who confirms the current editions before they appear on screen (R27)?
7. Facilities, HR and risk and resilience have no tenant pack. Should one of them become a fourth sample, or are they tested only inside the three existing tenants?
