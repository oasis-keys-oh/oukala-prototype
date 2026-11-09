# Sample data audit and remaining business data gaps

Read-only audit for backlog item PR-05. It lists what every registered screen shows and where its records come from, where the same fact disagrees across screens, what the tenant packs already cover, and which business data gaps remain. It changes no code. It carries no status or priority: the gaps in section 5 are proposals for Omar to accept or reject, and any accepted work becomes backlog rows. Rules cited: R6 (one source of truth), R9 (sample data lives in tenant packs, not in screens), R16 to R20 (tenancy), R29 (label every number), all in `docs/PLATFORM_RULES.md`.

All organizations and people named here are fictional sample data: the core tenant Atlantic Systems ("Atlantic Systems"), Larkspur Health System (healthcare), Redstone Resources (mining), Corvane Data Protection (storage and backup).

## 1. Scope and method

Date of measurement: 2026-10-20. Build: `python3 src/build.py --full --out build_out`, page `build_out/full.html`, opened headless (Chromium through Playwright) with all network calls blocked.

Labels used for every number:
- **Prototype fact (measured)**: read at runtime from the built page, or counted by a static scan of `src/*.js` (the quarantined " 2" files and the generated bundle excluded). The method is named next to the number.
- **Modeled**: computed from measured values with a stated rule.
- **Hypothesis**: a judgment (for example, which records are the "main" records of a screen, or how many rows a real tenant would have).

How each measure was taken (all prototype fact):

| Measure | How | Value |
|---|---|---|
| Registered screens | `SCREENS.length` after load | 195 |
| Screens by tenant mode | `DATA.screens()` grouped by `mode` | 180 Atlantic Systems only (`core`), 12 `data`, 3 `tenant` |
| Tenants | `DATA.tenants()` | 4: Atlantic Systems, health, mining, storage |
| DATA entities | `DATA.entities()` | 17 (projects, budget_lines, invoices, people, metrics, objectives, processes, workflows, journeys, personas, key_results, pillars, demand, maturity, vocabulary, workload, value_chain) |
| Pack validation | `DATA.validate(t)` for each tenant | 0 errors, 0 warnings on all 4 |
| Recorded gaps | `DATA.gaps()` after switching through every tenant and opening every non-Atlantic-only screen | 0 |
| Screen render sweep | `go(id)` for every screen, then `#view` text and table rows | 195 rendered, 0 page errors |
| Owner resolution | every owner-like field in the Atlantic Systems globals compared with `DIR` names | section 3.3 |
| Reference resolution | budget line, task, invoice, demand, service, configuration item (CI) and meeting references compared with the target global's ids | 0 broken references |
| Source per screen | static scan: the module holding the last `REG` call for the id, and which core globals that module reads | section 2 |

Atlantic Systems globals at load (prototype fact, `length` or key count): `DIR` 113, `PEOPLE` 16, `PROJ` 4, `TASKS` 147, `INVOICES` 4, `METRICS` 462, `SVCREG` 16, `CIREG` 141, `DEMAND` 10, `TEAMS` 12, `MEETINGS` 47, `AGENTS` 6, `NODES` 17, `PROCLIB.list()` 329, `S.bud.lines` 17.

Limits: the source column in section 2 is a static scan of the owning module, so it shows what a module can read, not proof that a given screen reads it. "Main records" is a hypothesis drawn from the screen name and rendered text. Search, chat, notifications and drawers were not swept.

## 2. What each screen shows

Every registered screen appears once below, grouped by menu area. Screens that share a module share a row. "Source" lists core globals (the data files `data.js`, `data2.js`, `kit2.js` and `S.bud`), module-local literals (a count of `{id: ...}` object literals and quoted "First Last" name strings in the module, prototype fact from the static scan), or DATA entities. Mode is from `DATA.screens()`: `core` means Atlantic Systems only, labeled under another tenant; `data` means it reads `DATA.get`; `tenant` means it follows the tenant another way.

### 2.1 Home, executive and the original core views (core view files)

| Screens | Main records (hypothesis) | Source | Mode |
|---|---|---|---|
| `home` | Three health scores, decisions due, persona story | `PERSONAS` story text, `METRICS`, `INVOICES`, `DEMAND` | core |
| `trace` | Objective to portfolio to project to budget to contract trace | `NODES` (17 nodes, 2 objectives) | core |
| `inv` | Invoices with a recommendation | `INVOICES` (4) | core |
| `fo`, `tower` | Meeting agent; AI agents with spend and state | `MEETINGS`, `AGENTS` (6), `AGENTS_STATE` | core |
| `kg`, `loop`, `log` | Impact graph, feedback loop, product log | `NODES`, `METRICS`, core literals | core |
| `ims`, `plan` | Master schedule and project plan | `PROJ` (4), `TASKS` (147) | core |
| `port` | Demand and priorities | DATA: projects, demand, objectives (adapter) | data |
| `metrics` | Metric catalog with formula and remediation | DATA: metrics, key_results, processes (adapter) | data |

### 2.2 Strategy, portfolio and executive views

| Screens | Main records (hypothesis) | Source | Mode |
|---|---|---|---|
| `exe_dash` | Chief operating officer (COO), chief financial officer (CFO), chief executive (CEO) tabs | DATA adapter over `mod_exec.js` (`METRICS` 59 refs, `PROJ`, `INVOICES`, `AGENTS`; 87 literals) | data |
| `exe_strat` | Objectives, key results (KRs), coverage, pillars | same module, DATA adapter | data |
| `exe_risk`, `exe_apps`, `exe_board`, `exe_scen` | Risks with simulated dates, applications, board pack, scenarios | `mod_exec.js` literals and `PROJ`, `METRICS` | core |
| `exe_mat` | Process maturity models | DATA adapter over `mod_mat.js` | data |
| `strat_exec` | Pillar to objective to KR to project to process | DATA adapter over `mod_r16k_trace.js` | data |
| `ppm_proj`, `ppm_raid` | Projects and teams; risks, assumptions, issues and dependencies (RAID) | `PROJ`, `TASKS`, `DIR`, `DEMAND` (35 refs) | core |
| `ppm_wbs` | Work breakdown and task sheet | `TASKS`, `PROJ`, `TEAMS` | core |
| `ppm_sow` | Statement of work (SOW) and contract analyzer | 102 literals, 119 name strings, `TASKS` | core |
| `r15_rpt`, `r15_sem` | Reports, semantic model | `METRICS`, 26 literals | core |
| `r15_time`, `r15_p2p` | Timesheets, procure to pay | `TASKS`, `INVOICES`, 25 literals | core |
| `r16j_dash`, `r17u_dash`, `r17q_value`, `r17q_thinking` | Dashboard builder, dashboards, value realized, how it was built | `METRICS`, `AGENTS_STATE`, `LISTS` | core |
| `r15d_evidence` | Control evidence and hash-chained audit entries | `METRICS`, `AGENTS_STATE`, computed | core |

### 2.3 Money and contracts

| Screens | Main records (hypothesis) | Source | Mode |
|---|---|---|---|
| `bud_over`, `bud_model`, `bud_ven`, `bud_doa` | Budget lines, forecast, vendors, delegation of authority | `S.bud` (17 lines, vendors, contracts, purchase orders), `PROJ`, `INVOICES`; 68 literals, 156 name strings | core |
| `bud_req` | Budget requests | `DEMAND`, `NODES`, `S.bud` | core |
| `bud_ben` | Benefits realization | `METRICS`, 4 literals | core |
| `bud_lines`, `bud_ccmap` | All budget lines; cost center mapping | `S.bud`, module literals | core |
| `fin_model`, `fin_color`, `fin_spend` | Financial model, funding color, spend order | `S.bud`, `PROJ`, `DEMAND`; 77 literals | core |
| `fin_budget`, `fin_gates`, `fin_alloc`, `fin_rules` | Budget, funding gates, allocation, controls | `S.bud`, `PROJ`, 19 literals | core |
| `tbm_model` | Technology cost model | 19 module literals, `METRICS` | core |
| `r18_spend` | Enterprise spend | module literals only | core |
| `bst` | Objective to project to budget line to invoice | DATA: objectives, projects, budget_lines, invoices | data |

### 2.4 People

| Screens | Main records (hypothesis) | Source | Mode |
|---|---|---|---|
| `ppl_org`, `ppl_cap`, `ppl_train`, `ppl_av`, `ppl_meet`, `ppl_perf` | Workload, capacity, training, rooms, forums, performance | `DIR` (110 refs), `TASKS`, `MEETINGS`; 215 literals, 396 name strings | core |
| `ppl_jrny` | Journey maps | `JYX`, `WFX`, `SCN` packs | tenant |
| `org_chart` | Org chart | `PROJ`, `PROCLIB`, org data | core |
| `orgassist` | Org chart with agent assist | `TENANT.orgs` | tenant |
| `orgdesign` | Agent Action COO brief | DATA: workload, value_chain, pillars, people; `ODX` | tenant |
| `inbox` | My inbox | `INVOICES`, `MEETINGS`, `DIR` | core |
| `meet_hub`, `meet_act`, `meet_dec`, `meet_series` | Meetings, actions, decisions, series | `MEETINGS` (47), `PROJ` | core |
| `svc_oncall`, `svc_skills` | On-call rotas, skills | `DIR` (25 refs), `TEAMS`; 56 literals | core |
| `r15_mobile`, `r16h_status`, `r15d_firstweek` | Mobile approvals, status catalog, first week | module literals, `DIR` | core |

### 2.5 Service management and operations

| Screens | Main records (hypothesis) | Source | Mode |
|---|---|---|---|
| `itsm_inc`, `itsm_prb`, `itsm_chg`, `itsm_mi`, `itsm_home` | Incidents, problems, changes, major incident | `SVCREG`, `CIREG`, `DIR`; 149 literals, 280 name strings | core |
| `itsm_rel`, `agile_board`, `agile_art` | Releases, sprints, release trains | `SVCREG`, `PROJ`; 73 literals, 201 name strings | core |
| `svc_cat`, `svc_req`, `svc_portal`, `svc_asset`, `svc_notify` | Catalog, requests, portal, assets and licenses, notifications | `SVCREG`, `DIR`; 222 literals, 257 name strings | core |
| `svc_guides` | Order guides | `PROCLIB`, 25 literals | core |
| `svc_sla` | Service, operational and experience level agreements | `SVCREG` (22 refs), 47 literals | core |
| `svc_360` | Service portfolio and map | `SVCREG` (16 services), `CIREG` | core |
| `obs_std`, `itom_evt`, `obs_dash`, `itom_slo`, `itom_run` | Standard changes, events, dashboards, objectives, runbooks | `CIREG` (31 refs), `SVCREG`; 135 literals | core |
| `itom_cmdb`, `itom_model`, `itom_graph`, `itom_disc`, `itom_health`, `itom_fin` | Configuration database, model, impact, discovery, health, cloud cost | `CIREG` (141 CIs), `SVCREG`; 113 literals | core |
| `dev_pipe`, `itom_dev` | Delivery pipeline, environments | `NODES`, `SVCREG`, 40 literals | core |
| `r16h_ci` | CI ownership | `CIREG`, `TEAMS` | core |

### 2.6 Knowledge, AI oversight and automation

| Screens | Main records (hypothesis) | Source | Mode |
|---|---|---|---|
| `kcs_home`, `kcs_edit`, `kcs_ask`, `kcs_gap`, `kcs_prompt`, `kcs_test`, `kcs_skills` | Articles, prompts, AI tests, agent skills | `METRICS`, `SVCREG`; 62 literals, 244 name strings | core |
| `vault`, `kcs_viz` | Knowledge graph, visualization builder | `SVCREG`, `CIREG`, `WFX` | core |
| `r15d_agents`, `r15d_facts` | Agent registry, facts and conflicts | `AGENTS_STATE`, `FACTS`, `DIR` | core |
| `agent_defs` | 20 agent definition cards | `mod_s_steps.js` (no core global) | core |
| `ai_runtime`, `wf_runs` | Agent runtime, run monitor | module literals | core |
| `adm_gate`, `plat_mcp` | AI gateway; AI and coding clients | `mod_admin.js`, `mod_plat_gate.js` literals | core |
| `flw_design`, `flw_asmt`, `flw_appr`, `flw_dmn`, `flw_bpmn`, `flw_agent`, `flw_hub` | Workflows, assessments, approvals, decision tables, process models, integrations | `WFX`, `DIR`, `S.bud`; 132 literals, 180 name strings | core |
| `dec_cov`, `draw_studio`, `r16h_groups`, `r16h_rules` | Decision rule coverage, drawing studio, approval groups and rules | `PROCLIB`, module literals (85 name strings in groups) | core |

### 2.7 Platform, admin, resilience and governance

| Screens | Main records (hypothesis) | Source | Mode |
|---|---|---|---|
| `adm_studio`, `adm_sec`, `adm_env`, `adm_meter`, `adm_audit` | Admin, security, environments, licensing, audit | `mod_admin.js`: 154 literals, 133 name strings | core |
| `plat_map`, `plat_data`, `plat_data_old`, `plat_dmap`, `plat_pmap`, `plat_proc`, `plat_reg`, `plat_store` | Process flow, data model, connections, process library, registry, entity store | `METRICS`, `PROCLIB` | core |
| `plat_build`, `plat_contract`, `plat_debt`, `plat_gate`, `plat_self` | Module build, feature contract, debt, citizen apps, self build | `PROCLIB`, `AGENTS`, literals | core |
| `plat_fab` | Integration layer | 112 literals | core |
| `chat_home`, `nav_studio`, `zevt`, `zl_conn`, `scr_map` | Chat, navigation, events, connections and gaps, screen map | most core globals (`zl_conn` reads 13 of them) | core |
| `r15_iam`, `r16g_perm`, `own_gaps`, `rec_shell` | Identity, permissions, ownership gaps, record shell | `DIR`, `S.bud`, literals | core |
| `grc_home`, `grc_risk`, `grc_ctl`, `grc_find`, `grc_pol`, `grc_aud`, `grc_ven`, `grc_exc` | Governance, risk and compliance (GRC): risks, controls, findings, policies, audits, third parties, exceptions | `S.bud`, 31 literals | core |
| `bc_home`, `bc_frame`, `bc_tiers`, `bc_cal`, `bc_plans`, `bc_decl`, `bc_trace`, `bc_metrics` | Resilience: framework, recovery tiers, exercises, plans, traceability | module literals, `S.bud`, `WFX` | core |
| `r16m_setup`, `r16m_deploy`, `r16m_sources`, `r16m_import`, `r16m_guides`, `r16m_overlay` | Implementation setup, deployment, sources, import, guides, overlays | `PROCLIB`, literals | core |
| `r17p_tour`, `r17s_rules`, `showroom`, `guard`, `studio` | Tour, rules, Showroom, guardrails, VibeCheck | `SHOW.demos`, `PROCLIB` | core |

### 2.8 Build space, lenses and tenancy

| Screens | Main records (hypothesis) | Source | Mode |
|---|---|---|---|
| `r18_builds`, `r18_app`, `r18_debt` | Builds, app record, risk and debt | `PROCLIB`, computed | core |
| `r18_mature` | Maturity roadmaps | DATA: processes, maturity, metrics, projects, workflows | data |
| `r18_access`, `r18_lens`, `r18_strategy`, `r18_levels` | Data access, executive lenses, strategy enablement, views by level | `PERSONAS`, module literals | core |
| `tn_projects`, `tn_people`, `tn_metrics`, `tn_admin` | Tenant views and the Tenancy screen | DATA only | data |

Read across (prototype fact, static scan): the modules with the most module-local name strings are `mod_people.js` (396), `mod_itsm.js` (280), `mod_svc.js` (257), `mod_kcs.js` (244), `mod_rel.js` (201), `mod_flow.js` (180), `mod_obs.js` (169) and `mod_budget.js` (156). Each is a candidate for R9 (sample data in packs, not screens), and together they back 43 screens.

## 3. Thin or inconsistent records (Atlantic Systems)

Evidence is from the render sweep on Atlantic Systems unless stated. All values prototype fact.

### 3.1 The same fact disagrees across screens (R6)

| Fact | Values seen | Where |
|---|---|---|
| Vendor slip on the search indexer | "7 work days late"; "nine days late"; "Beta moved 7 days from Nov 4" while the same story elsewhere says Nov 4 to Nov 13 (9 days) | 7 days: `ims`, `plan`, `bud_over`, `ppm_wbs`, budget line `PR1-VEN`. Nine days: `inv`, the CIO persona story on `home`. "7 days from Nov 4": `exe_dash`. Nov 4 to Nov 13: `exe_board`, `ppm_raid` |
| Beta date | Nov 12 (phase end on `plan`, change on `itsm_chg`), Nov 13 (`exe_board`, `exe_scen`, `itsm_rel`), Nov 20 and Nov 23 as forecast dates | `plan` phase "Aug 27 to Nov 12" while `exe_board` says "forecast for Nov 13" |
| Number of AI agents | 6, 15, 16, 20 | 6: `tower` list and `AGENTS`. 15: `DIR` rows of kind `ai`, `org_chart`, `ppl_org`. 16: `AGENTS_STATE.counts().registered` on `tower`, `ppl_org`, `ppl_cap`, `ppm_proj`, `r15d_agents`. 20: `agent_defs` |
| Number of objectives | 2 versus 5 | DATA `objectives` and `NODES` hold O1 and O2. `exe_strat` and `exe_board` say "2 of 5 objectives are on track". Key result ids run `k11` to `k51`, which implies five objectives |
| Open risks | 7, 8, 28 | `exe_board` "7 risks are open"; `home` "Risks above appetite 8"; `grc_home`, `grc_risk` 28 risks |
| Workforce size | 74, 113, 400, 640 | 74: `org_chart`, `orgdesign` workload rows. 113: `DIR`, `ppl_org`, `ppl_cap`, `svc_skills`. 640 people: `tbm_model` cost per employee. About 400: `ppl_cap` Enterprise mode |
| Invoices | 4 versus 9 | `inv` "4 of 4 invoices open"; `metrics` "Pre-cleared 6 of 9 invoices this week" |
| Budget lines | 17, 9, 24 | `S.bud.lines` 17 ($2.91M approved); `bst` 9 lines ($2.06M, scoped to objective O1); `fin_model` "21 of 24 budget lines carry a funding color" |
| Committed spend | $2.57M on budget lines versus $2.81M with vendors | sum of `S.bud.lines.comm` (modeled from measured rows) versus `bud_ven` "$2.81M committed across 7 vendors" |
| Forecast over approved | +5.6% versus +5.2% | `home`, `exe_dash` (105.6%) versus `bst` "+5.2% modeled". The modeled total from `S.bud.lines` is $3.073M over $2.91M, +5.6% |
| Annual technology cost | $3.84M a year versus $2.91M approved | `tbm_model` versus `S.bud.lines` (they may measure different scopes; no screen says so) |

### 3.2 Records whose numbers contradict themselves

- Metrics whose current value exceeds their own maximum: `m_itsm_mttrall` (cur 39.3, max 30), `m_kb_reuse` (cur 79.3, max 15), `m_own_unowned` (cur 125, max 40). Measured over the 462 `METRICS` entries.
- Key results with no current value: 8 of the 11 Atlantic Systems `key_results` (`k12`, `k21`, `k22`, `k23`, `k31`, `k32`, `k41`, `k42`) have `cur` null, so any screen that reads them shows a target with no progress.
- No number label on metrics: none of the 462 `METRICS` entries has a label field (fact, modeled, hypothesis or simulated). The tenant packs carry one per metric. R29.
- Configuration items: 117 of 141 `CIREG` rows carry generated placeholder attributes ("Description 25", "Resource ID 78"), and 11 cloud CIs name a different cloud provider in `a.cloud_provider` from the one in `src`. Only 2 of 141 CIs are not "Operational".

### 3.3 Owners that do not resolve in DIR

Every project, budget line, invoice, task and service owner that is a person resolves in `DIR`, and so do every screen header owner and every `DIR.mgr`. What does not resolve:
- **"Chief Editor"** is used as a person in `DEMAND.sp`, `SVCREG.processOwner`, `CIREG.owner`, `TASKS.own`, `TASKS.asg`, `TEAMS.mgr` and `MEETINGS.att`, but there is no such person in `DIR`. It is a role in a name slot.
- **`METRICS.owner`** uses about 90 distinct team or role strings ("FP&A", "Each approver", "Process owners", "CIO office") instead of people. R12 asks for a named owner and backup; the packs do this, Atlantic Systems does not.
- **`NODES.owner`** and **`DEMAND.sp`** use "CEO office", "CFO", "CIO", "COO" and "Vendor mgmt".
- **`AGENTS.owner`** uses "You", "Engineering", a real software company name, and team names. `AGENTS.prov` names real AI providers. The project rules forbid real organizations' names in product assets.
- **`TASKS.own`** has the vendor name "Lumen" as an owner.
- People-kind vocabulary differs: Atlantic Systems `DIR` uses `human`, `contractor`, `msp`, `ai`; the packs use `human`, `agent`, `robot`. Atlantic Systems has no row of kind robot, while `agent_defs` says "2 read as deterministic and could be a robot".

### 3.4 Thin lists (fewer rows than a real tenant would have; size judgments are hypothesis)

| List | Rows (fact) | Shown on | A real tenant (hypothesis) |
|---|---|---|---|
| Projects (`PROJ`) | 4 | `ims`, `plan`, `ppm_proj`, `bud_over`, `fin_gates` | 20 to 60 active |
| Invoices (`INVOICES`) | 4 | `inv`, `inbox`, `r15_p2p` | hundreds a month |
| Objectives (`NODES`, DATA) | 2 | `trace`, `bst`, `strat_exec` | 4 to 8 |
| Agent catalog (`AGENTS`) | 6 | `tower` | equal to the registered agents (16 here) |
| Services (`SVCREG`) | 16 | `svc_360`, `svc_cat`, `itom_graph` | 50 to 200 |
| Vendors with contracts | 7 | `bud_ven` | 30 to 100 |
| Process maturity records (DATA `maturity`, Atlantic Systems) | 0 | `exe_mat`, `r18_mature` render from module code instead | one per process |

### 3.5 Placeholders and empty states (fact, render sweep)

- Text labeled placeholder on screen: `fin_model` and `fin_color` ("The seven colors are placeholders until decision D-01 supplies Atlantic Systems' real list"), `fin_budget` ("PLACEHOLDER. BASE values are illustrative"), `fin_alloc`, `fin_rules`, `plat_fab` ("Placeholder names while packaging is decided"). These are honest labels, but they mark missing business data.
- Empty values: `grc_aud` shows "none yet" for evidence on 6 open requests; `svc_sla` shows "No data, 0 clocks" on agreements; `itom_evt` shows "0 open alerts".
- No undefined, NaN, "[object Object]", em dash or lorem ipsum text on any of the 195 screens.
- Sample company names borrowed from a real software vendor's documentation appear as a vendor on `INV-20418` and `INV-20451` and in the first decision on `home`; real product names appear on `tower` and `itsm_home`. Not named here on purpose.

## 4. What the tenant packs already cover

Row counts per tenant and entity (prototype fact, `DATA.snapshot(t)`):

| Entity | Atlantic Systems | Larkspur (health) | Redstone (mining) | Corvane (storage) |
|---|---|---|---|---|
| projects | 4 | 6 | 6 | 6 |
| budget_lines | 17 | 13 | 13 | 12 |
| invoices | 4 | 6 | 6 | 6 |
| people | 113 | 26 | 25 | 22 |
| metrics | 462 | 11 | 11 | 11 |
| objectives | 2 | 4 | 4 | 4 |
| key_results | 11 | 8 | 8 | 8 |
| pillars | 3 | 3 | 3 | 3 |
| demand | 10 | 6 | 6 | 6 |
| processes | 347 | 8 | 8 | 8 |
| maturity | **0** | 8 | 8 | 8 |
| workflows | 46 | 45 | 17 | 13 |
| journeys | 5 | 10 | 3 | 3 |
| personas | 11 | 18 | 16 | 9 |
| vocabulary | 15 | 15 | 15 | 15 |
| workload | 74 | 13 | 12 | 12 |
| value_chain | 7 | 7 | 7 | 7 |

People by kind in the packs (fact): health 21 human, 4 agent, 1 robot; mining 19 human, 5 agent, 1 robot; storage 17 human, 4 agent, 1 robot. Atlantic Systems: 86 human, 9 contractor, 3 provider, 15 AI, 0 robot.

Findings:
- **All 17 DATA entities have rows for every industry tenant.** `DATA.validate` reports no errors and no warnings, and `DATA.gaps()` records none. The pack generator (`tools/generators/gen_pack.py`) enforces owners, backups, metric formulas and maturity records.
- **The one entity gap is on Atlantic Systems itself:** `maturity` has 0 rows for the core tenant. The Atlantic Systems maturity screens draw from module code, not DATA.
- **Atlantic Systems `workload` (74) does not match Atlantic Systems `people` (113).** The packs keep the two closer (13 workload rows for 26 people in health).
- **The entity list is the limit, not the packs.** No DATA entity exists for incidents, problems, changes, services, CIs, assets, tasks, meetings, risks, controls, vendors, contracts, purchase orders, knowledge articles, agent definitions or approvals. Those records live only in Atlantic Systems globals or module literals, so no tenant can supply them.
- **Screens that follow the tenant (15 of 195, fact):** 12 `data` (`metrics`, `port`, `exe_dash`, `exe_strat`, `exe_mat`, `strat_exec`, `r18_mature`, `bst`, `tn_projects`, `tn_people`, `tn_metrics`, `tn_admin`) and 3 `tenant` (`ppl_jrny`, `orgdesign`, `orgassist`). Eight of the 12 are adapters in `mod_s_tenant_screens.js`, not owning-module reads.
- **Screens that fall back to Atlantic Systems (180 of 195, fact):** every other screen. Under each industry tenant, a sample of 8 (`home`, `inv`, `ppm_proj`, `itsm_inc`, `bud_over`, `org_chart`, `tower`, `exe_board`) showed the "not tenant-aware yet" label and Atlantic Systems people, vendors and services, as designed. None of the 15 tenant-following screens showed an Atlantic Systems person or vendor; "Atlantic Systems" appears on them only in the tenant chooser and the honest "Atlantic Systems sample" panel labels on `orgdesign`.

## 5. Remaining business data gaps, ranked

Rank 1 is the most visible in a demo (hypothesis: ranked by judgment on whether the screens sit on the persona home and executive paths, then by how many screens a fix reaches; tour usage was not measured). Sizes are rough and modeled from the row and screen counts above. These are proposals only.

| Rank | What is missing | Where | Rule | Rough size |
|---|---|---|---|---|
| 1 | One canonical vendor slip and beta date story: a single record for the indexer slip (days late, old date, new date, forecast dates) that every screen reads | `PERSONAS` story on `home`, `inv`, `ims`, `plan`, `exe_dash`, `exe_board`, `ppm_raid`, `itsm_chg`, `itsm_rel`, budget line `PR1-VEN` | R6 | 1 record, about 10 screens to repoint |
| 2 | One agent count: the 6-row `AGENTS` catalog, 15 `DIR` agents, 16 registered and 20 definition cards reconciled into one agent entity read by every screen, with robots as their own kind | `tower`, `agent_defs`, `org_chart`, `ppl_org`, `r15d_agents`, `ppm_proj` | R6, R9 | 1 entity of about 20 rows, 6 screens |
| 3 | Objectives and key results for Atlantic Systems: 3 missing objectives behind KRs `k3x` to `k5x`, and current values for 8 KRs with none | DATA `objectives`, `key_results`; `exe_strat`, `exe_board`, `trace`, `strat_exec` | R6, R29 | 3 objectives, 8 values |
| 4 | Operational records as DATA entities, so the most shown service screens can follow the tenant: incidents, problems, changes, services, CIs | `itsm_*`, `svc_*`, `itom_*`, `obs_*` (about 25 screens), today module literals plus `SVCREG`, `CIREG` | R9, R20 | 5 entities; about 40 rows per industry tenant |
| 5 | Number labels on the Atlantic Systems metric registry | 462 `METRICS` entries; every scorecard on `home`, `metrics`, `exe_dash` | R29 | 1 field on 462 rows (default by source) |
| 6 | One headcount and one risk count: workforce (74, 113, about 400, 640) and open risks (7, 8, 28) stated once with their scope | `org_chart`, `orgdesign`, `ppl_org`, `tbm_model`; `home`, `exe_board`, `grc_risk` | R6 | 2 facts, about 8 screens |
| 7 | Money as DATA entities: vendors, contracts, purchase orders, ledger, and one committed total that agrees between budget lines and vendors | `S.bud` (`bud_*`, `fin_*`, `grc_ven`, `ppm_sow`), `bud_ven` | R6, R9, R20 | 4 entities; reconcile $2.57M against $2.81M |
| 8 | Named people for roles in name slots: "Chief Editor", about 90 team strings as metric owners, "You" and company names as agent owners, a vendor as a task owner | `DEMAND`, `SVCREG`, `CIREG`, `TASKS`, `TEAMS`, `MEETINGS`, `METRICS`, `AGENTS` | R6, R12 | 1 person row; owner and backup on about 460 metrics |
| 9 | Real organization and product names replaced with fictional ones | `AGENTS.prov` and `.owner`, `CIREG` cloud attributes, two invoice vendors, `home` decision 1, `tower`, `itsm_home` | project hard rule, R9 | about 10 strings |
| 10 | Deeper Atlantic Systems lists: projects (4), invoices (4), services (16), vendors (7) | `PROJ`, `INVOICES`, `SVCREG`, `S.bud.vend` | R9 | hypothesis: 15 projects, 25 invoices, 40 services, 25 vendors |
| 11 | Atlantic Systems maturity records in DATA, so `exe_mat` and `r18_mature` read the same rows for every tenant | DATA `maturity` (0 rows for Atlantic Systems) | R6, R20 | 1 row per scored process |
| 12 | Clean configuration items: 117 generated placeholder attributes and 11 provider mismatches | `CIREG` (`itom_cmdb`, `itom_health`, `itom_fin`) | R9, R29 | 141 rows |
| 13 | Meeting, task and people literals in the large modules moved to packs | `mod_people.js`, `mod_itsm.js`, `mod_svc.js`, `mod_kcs.js`, `mod_rel.js`, `mod_flow.js`, `mod_obs.js`, `mod_budget.js` (about 1,880 quoted name strings, static scan) | R9 | large; one module at a time |
| 14 | Business values behind the labeled placeholders: funding colors, budget base values, packaging names | `fin_model`, `fin_color`, `fin_budget`, `fin_alloc`, `fin_rules`, `plat_fab` | R29 | waits on decision D-01 and packaging |
| 15 | Empty evidence and timers filled with sample rows | `grc_aud` (6 requests "none yet"), `svc_sla` ("No data, 0 clocks"), `itom_evt` (0 alerts) | R29 | about 15 rows |
| 16 | One metric scale fix: three metrics whose current value exceeds their maximum | `m_itsm_mttrall`, `m_kb_reuse`, `m_own_unowned` | R6 | 3 rows |

## 6. Open questions

These belong in `Open Questions.md`; listed here so the audit is complete.

1. Agent count: which number is the truth for Atlantic Systems, 16 registered (including one observed outside the gateway) or 20 defined? Should robots be counted inside or beside agents on every screen?
2. Objectives: does Atlantic Systems have 2 objectives (as `NODES` and DATA say) or 5 (as the executive screens and KR ids imply)?
3. Workforce scope: is Atlantic Systems 113 workers (directory), 74 (org chart and workload), or 640 (technology cost per employee)? Should `tbm_model` state its own scope?
4. Should the Atlantic Systems metric registry keep team names as owners (an honest "accountable unit") or move to people with backups like the packs (R12)?
5. Which DATA entity comes next after the current 17: operational records (rank 4) or money records (rank 7)? The answer decides which tour can run on an industry tenant first.
6. Is the Atlantic Systems maturity view meant to read DATA `maturity` (now empty) or keep its module-level models?
7. Should the people-kind vocabulary be one set (`human`, `agent`, `robot`, plus contractor and provider as a separate employment field) across Atlantic Systems and the packs?
8. Are the vendor commitment ($2.81M) and the budget line commitment ($2.57M) meant to differ (contracts spanning budgets outside these projects), and if so where is that stated?
