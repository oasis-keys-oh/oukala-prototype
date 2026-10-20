# Screen archetype inventory

Read-only inventory for backlog item CL-51. It classifies every registered screen into one of the archetypes named in rule R2 of `docs/PLATFORM_RULES.md`, lists outliers and near-duplicates, and proposes fold or keep for each family. It changes no code and deletes no screen id (rule R3). It carries no status or priority. Proposals are for Omar to accept or reject, and any resulting work becomes backlog rows.

Every count below is a **prototype fact** unless labeled otherwise: it was measured on 2026-10-19 by building the prototype (`python3 src/build.py`), opening the built page in a headless browser, reading the `SCREENS` list and opening every screen once. The classification itself is a **hypothesis**: it is a judgment from the screen name, the module and the rendered content, not a declared property, because no `REG` call declares an archetype today.

## 1. How the screens were counted

| Measure | Value | Label |
|---|---|---|
| Screens registered at runtime (`SCREENS` after load) | 189 | prototype fact |
| `REG(` call sites in `src/*.js` (excluding the quarantined " 2" duplicate files and the generated `oukala-js.js`) | 193 in 98 files | prototype fact |
| Screens in the generated Screen map data (`src/mod_r32_scrmap_a_data.js`, generated 2026-10-19) | 187 | prototype fact |
| Screens at runtime that the Screen map data does not list | 2 (`kcs_viz`, `showroom`) | prototype fact |
| Screens listed by the backlog row CL-51 and by `docs/PLATFORM_RULES.md` | 186 | stale: the count was taken before the Showroom and other additions |

The 189 runtime count is the one used below. `REG` is defined in `src/kit.js` as `REG(id, name, group, icon, render)`; the group is the suite shown in the menu. A later `REG` with the same id replaces the name, icon and group of the earlier entry, so the render function that wins is the last one loaded. The Screen map data records these shadowed definitions as `dup`: eleven ids (`bud_ben`, `itom_dev`, `kcs_gap`, `kcs_home`, `kcs_prompt`, `plat_data`, `plat_map`, `ppl_cap`, `ppl_jrny`, `ppl_org`, `r18_lens`) are defined in more than one module.

## 2. Archetype counts

| Archetype | Screens | Share of 189 |
|---|---|---|

| Dashboard-first list | 90 | 48% |
| Record detail drawer | 2 | 1% |
| 360 view | 1 | 1% |
| Board | 2 | 1% |
| Designer canvas | 9 | 5% |
| Intake form | 7 | 4% |
| Approval inbox | 3 | 2% |
| Report | 19 | 10% |
| Other | 56 | 30% |
| Total | 189 | 100% |

Reading the table:
- **Dashboard-first list** dominates. This matches rule R34 (hero, then stats and charts, then lists, then detail), so it is the expected default, not a defect.
- **Record detail drawer** and **360 view** are almost empty as registered screens. In the prototype these archetypes mostly live as drawers opened from a list row (`openDrawer`) and as the Person 360 opened by `ownerChip`, so they are not separate screen ids. Only `rec_shell` and `r18_app` render a single record as a screen, and only `svc_360` is a 360 style screen. This is a finding for R2: the pattern library should name drawers and 360 panels as archetypes that are not screens, so a new feature does not register a screen to get one.
- **Board** is small: the two agile screens. The lane-like element counts on `itsm_inc`, `itsm_prb`, `itsm_mi`, `kcs_home` and `kcs_skills` are status columns inside a list screen, not a board archetype.
- **Other** is large (see section 4). Most of it is admin configuration, graph explorers, lens pickers and help screens, which are real archetypes that R2's example list does not yet name.

## 3. Classification by archetype
Columns: screen id, name, suite (the `REG` group), defining module (last definition that wins), and inbound references from other modules (Screen map data; `n/a` where the screen is newer than the data).


### Dashboard-first list (90)

| Id | Name | Suite | Module | Inbound |
|---|---|---|---|---|
| `tower` | AI Control Tower | ai | `data.js` | 29 |
| `port` | Demand and priorities | (none) | `screens4.js` | 31 |
| `adm_meter` | Licensing and billing | platform | `mod_admin.js` | 2 |
| `adm_audit` | Audit and compliance | platform | `mod_admin.js` | 35 |
| `bud_over` | Budgets overall | portfolio | `mod_budget.js` | 39 |
| `bud_ven` | Vendors and contracts | portfolio | `mod_budget.js` | 25 |
| `bud_ben` | Benefits realization | portfolio | `mod_r17u_b_ben.js` | 11 |
| `bud_doa` | Delegation of authority | portfolio | `mod_budget.js` | 14 |
| `bud_req` | Budget requests | portfolio | `mod_budget3.js` | 8 |
| `dec_cov` | Decision rule coverage | automate | `mod_dec.js` | 4 |
| `dev_pipe` | Delivery pipeline | automate | `mod_devops.js` | 6 |
| `itom_dev` | Environments and DORA | ops | `mod_devops.js` | 2 |
| `exe_dash` | Executive dashboard | portfolio | `mod_exec.js` | 17 |
| `exe_strat` | Strategy alignment | portfolio | `mod_exec.js` | 12 |
| `exe_risk` | Risk heat map and Monte Carlo | portfolio | `mod_exec.js` | 14 |
| `exe_apps` | Application portfolio | portfolio | `mod_exec.js` | 6 |
| `flw_hub` | Integration hub | automate | `mod_flow.js` | 3 |
| `itom_cmdb` | CMDB | ops | `mod_itom.js` | 16 |
| `itom_disc` | Discovery and ingestion | ops | `mod_itom.js` | 2 |
| `itom_health` | CMDB health and governance | ops | `mod_itom.js` | 3 |
| `itom_fin` | Cloud cost (FinOps) | ops | `mod_itom.js` | 2 |
| `itsm_inc` | Incidents | service | `mod_itsm.js` | 36 |
| `itsm_prb` | Problems and known errors | service | `mod_itsm.js` | 11 |
| `itsm_chg` | Changes | service | `mod_itsm.js` | 37 |
| `itsm_home` | Service desk overview | service | `mod_itsm.js` | 2 |
| `kcs_home` | Knowledge management | know | `mod_kcs.js` | 16 |
| `kcs_prompt` | Prompt library | ai | `mod_kcs.js` | 3 |
| `kcs_test` | AI test management | ai | `mod_kcs.js` | 3 |
| `kcs_skills` | Agent skills | know | `mod_kcs.js` | 6 |
| `exe_mat` | Maturity models | portfolio | `mod_mat.js` | 17 |
| `meet_hub` | Meetings | people | `mod_meet2.js` | 7 |
| `meet_act` | Meeting actions | people | `mod_meet2.js` | 2 |
| `meet_dec` | Meeting decisions | people | `mod_meet2.js` | 3 |
| `meet_series` | Forums and series | people | `mod_meet2.js` | 2 |
| `itom_evt` | Event management | ops | `mod_obs.js` | 9 |
| `obs_dash` | Observability dashboards | ops | `mod_obs.js` | 7 |
| `itom_slo` | Observability and SLOs | ops | `mod_obs.js` | 5 |
| `itom_run` | Runbooks and automation | ops | `mod_obs.js` | 7 |
| `obs_std` | Standard change catalog | service | `mod_obs.js` | 4 |
| `svc_oncall` | On-call and escalation | service | `mod_oncall.js` | 9 |
| `svc_skills` | Skills and availability | people | `mod_oncall.js` | 6 |
| `own_gaps` | Ownership and gaps | platform | `mod_own2.js` | 10 |
| `ppl_org` | Workload by team | people | `mod_people.js` | 27 |
| `ppl_cap` | Resource planning | people | `mod_people.js` | 14 |
| `ppl_train` | Training and learning | people | `mod_people.js` | 5 |
| `ppl_meet` | Forums and minutes | people | `mod_people.js` | 2 |
| `ppl_perf` | Performance management | people | `mod_people.js` | 9 |
| `plat_debt` | Technical debt ledger | platform | `mod_plat_debt.js` | 20 |
| `plat_fab` | Integration fabric | platform | `mod_plat_fabric.js` | 10 |
| `fin_color` | Funding color | portfolio | `mod_plat_fin.js` | 3 |
| `fin_budget` | Budget and forecast | portfolio | `mod_plat_fin2.js` | 4 |
| `fin_gates` | Funding gates | portfolio | `mod_plat_fin2.js` | 5 |
| `fin_alloc` | Allocation and showback | portfolio | `mod_plat_fin2.js` | 2 |
| `fin_rules` | Financial controls | portfolio | `mod_plat_fin2.js` | 2 |
| `plat_gate` | Citizen apps | platform | `mod_plat_gate.js` | 20 |
| `plat_proc` | Process library | platform | `mod_plat_proclib.js` | 21 |
| `plat_reg` | Platform registry | platform | `mod_plat_registry.js` | 19 |
| `ppm_proj` | Projects and teams | portfolio | `mod_ppm.js` | 30 |
| `ppm_raid` | RAID log | portfolio | `mod_ppm.js` | 16 |
| `bud_ccmap` | Cost center mapping | portfolio | `mod_r15b_ccmap.js` | 3 |
| `bud_lines` | All budget lines | portfolio | `mod_r15b_lines.js` | 5 |
| `r15d_evidence` | Evidence room | strat | `mod_r15d_evidence.js` | 6 |
| `r15d_agents` | Agent registry | ai | `mod_r15d_facts.js` | 9 |
| `r15d_facts` | Facts and conflicts | plat | `mod_r15d_facts.js` | 7 |
| `plat_store` | Entity store | platform | `mod_r15f1_a_store.js` | 6 |
| `wf_runs` | Run monitor | automate | `mod_r15f1_b_wf.js` | 6 |
| `ai_runtime` | Agent runtime | ai | `mod_r15f1_c_agent.js` | 9 |
| `grc_home` | GRC overview | platform | `mod_r15f2_b_grc.js` | 3 |
| `grc_risk` | Risk register | platform | `mod_r15f2_b_grc.js` | 5 |
| `grc_ctl` | Controls and testing | platform | `mod_r15f2_b_grc.js` | 5 |
| `grc_find` | Issues and findings | platform | `mod_r15f2_b_grc.js` | 4 |
| `grc_pol` | Policies | platform | `mod_r15f2_b_grc.js` | 4 |
| `grc_aud` | Audit management | platform | `mod_r15f2_b_grc.js` | 2 |
| `grc_ven` | Third-party risk | platform | `mod_r15f2_b_grc.js` | 4 |
| `grc_exc` | Exceptions and acceptances | platform | `mod_r15f2_b_grc.js` | 4 |
| `r15_iam` | Identity and access | platform | `mod_r15f3_iam.js` | 7 |
| `r15_p2p` | Procure to pay | portfolio | `mod_r15f3_time.js` | 1 |
| `r16h_ci` | CI ownership | tech | `mod_r16h_b_ci.js` | 3 |
| `bc_home` | Resilience overview | platform | `mod_r16l_b_ui.js` | 3 |
| `bc_tiers` | Recovery tiers | platform | `mod_r16l_b_ui.js` | 3 |
| `bc_plans` | Continuity plans | platform | `mod_r16l_d_plans.js` | 4 |
| `r16m_sources` | Data sources and integrations | platform | `mod_r16m_c2_sources.js` | 4 |
| `r17u_dash` | Dashboards | strat | `mod_r17u_d_dash.js` | 2 |
| `r18_builds` | My builds | make | `mod_r18c_builds.js` | 5 |
| `r18_access` | Data access | make | `mod_r18d_access.js` | 4 |
| `itsm_rel` | Releases | service | `mod_rel.js` | 14 |
| `svc_sla` | SLAs, OLAs and XLAs | service | `mod_sla.js` | 9 |
| `svc_cat` | Service catalog | service | `mod_svc.js` | 17 |
| `svc_req` | Requests and fulfillment | service | `mod_svc.js` | 18 |
| `svc_asset` | Assets and software licenses | service | `mod_svc.js` | 6 |

### Record detail drawer (2)

| Id | Name | Suite | Module | Inbound |
|---|---|---|---|---|
| `rec_shell` | Record shell | platform | `mod_r15f2_c_adopt.js` | 2 |
| `r18_app` | App record | make | `mod_r18c_builds.js` | 2 |

### 360 view (1)

| Id | Name | Suite | Module | Inbound |
|---|---|---|---|---|
| `svc_360` | Service portfolio and map | service | `mod_svc360.js` | 10 |

### Board (2)

| Id | Name | Suite | Module | Inbound |
|---|---|---|---|---|
| `agile_board` | Sprints and backlogs | service | `mod_rel.js` | 5 |
| `agile_art` | Release trains and increments | service | `mod_rel.js` | 5 |

### Designer canvas (9)

| Id | Name | Suite | Module | Inbound |
|---|---|---|---|---|
| `draw_studio` | Process drawing studio | automate | `mod_draw2.js` | 3 |
| `flw_design` | Workflow designer | automate | `mod_flow.js` | 24 |
| `flw_dmn` | Decision tables | automate | `mod_flow.js` | 8 |
| `flw_bpmn` | Process models (BPMN) | automate | `mod_flow.js` | 3 |
| `flw_agent` | Agentic workflows | automate | `mod_flow.js` | 2 |
| `r16j_dash` | Dashboard builder | strat | `mod_r16j_f_charts.js` | 4 |
| `r17s_rules` | Rules and scripts | platform | `mod_r17s_c_ui.js` | 4 |
| `orgassist` | Org chart with agent assist | people | `mod_r31_jzorg.js` | 1 |
| `kcs_viz` | Visualization builder | know | `mod_viz2.js` | n/a |

### Intake form (7)

| Id | Name | Suite | Module | Inbound |
|---|---|---|---|---|
| `flw_asmt` | Assessments | automate | `mod_flow.js` | 2 |
| `kcs_edit` | Article editor | know | `mod_kcs.js` | 3 |
| `plat_build` | Build a module | platform | `mod_plat_build.js` | 4 |
| `r15_time` | Timesheets and actuals | portfolio | `mod_r15f3_time.js` | 2 |
| `bc_decl` | Declare disaster | platform | `mod_r16l_d_plans.js` | 5 |
| `r16m_import` | Import foundation data | platform | `mod_r16m_c_import.js` | 4 |
| `svc_guides` | Order guides | service | `mod_svc3.js` | 8 |

### Approval inbox (3)

| Id | Name | Suite | Module | Inbound |
|---|---|---|---|---|
| `inv` | Invoice approval | portfolio | `data.js` | 35 |
| `flw_appr` | Approvals inbox | automate | `mod_flow.js` | 26 |
| `inbox` | My inbox | people | `mod_inbox.js` | 34 |

### Report (19)

| Id | Name | Suite | Module | Inbound |
|---|---|---|---|---|
| `trace` | Executive trace | portfolio | `data.js` | 15 |
| `bud_model` | Budget model and forecast | portfolio | `mod_budget.js` | 9 |
| `exe_board` | Board pack | portfolio | `mod_exec.js` | 9 |
| `exe_scen` | Scenario compare | portfolio | `mod_exec.js` | 4 |
| `kcs_gap` | Knowledge gaps and analytics | know | `mod_kcs.js` | 3 |
| `plat_contract` | Feature contract | platform | `mod_plat_contract.js` | 6 |
| `fin_model` | IT financial model | portfolio | `mod_plat_fin.js` | 2 |
| `r15_rpt` | Reports and subscriptions | portfolio | `mod_r15f3_report.js` | 3 |
| `strat_exec` | Strategy to execution | portfolio | `mod_r16k_trace.js` | 6 |
| `bc_trace` | Continuity traceability | platform | `mod_r16l_e_trace.js` | 5 |
| `bc_metrics` | Resilience metrics | platform | `mod_r16l_e_trace.js` | 4 |
| `r17q_value` | Value realized | strat | `mod_r17q_c_value.js` | 8 |
| `r17q_thinking` | How it was built | strat | `mod_r17q_d_thinking.js` | 4 |
| `r18_mature` | Maturity roadmaps | make | `mod_r18c_builds.js` | 3 |
| `r18_debt` | Risk and debt | make | `mod_r18c_builds.js` | 3 |
| `r18_spend` | Enterprise spend | money | `mod_r18h_spend.js` | 5 |
| `bst` | Budget and spend traceability | money | `mod_r29_bst.js` | 2 |
| `scr_map` | Screen map | platform | `mod_r32_scrmap_b_screen.js` | 0 |
| `tbm_model` | Technology cost transparency (TBM) | portfolio | `mod_tbm.js` | 11 |

### Other (56)

Sub-types are a proposal for archetypes to add to R2.

| Id | Name | Suite | Module | Inbound | Sub-type |
|---|---|---|---|---|---|
| `fo` | First Officer | people | `data.js` | 0 | AI assistant |
| `log` | Product log | (none) | `screens4.js` | 4 | activity log |
| `adm_env` | Environments and releases | platform | `mod_admin.js` | 3 | admin configuration |
| `adm_gate` | AI gateway and tokenomics | ai | `mod_admin.js` | 6 | admin configuration |
| `adm_sec` | Security and access | platform | `mod_admin.js` | 15 | admin configuration |
| `adm_studio` | Admin studio | platform | `mod_admin.js` | 7 | admin configuration |
| `nav_studio` | Navigation and search | platform | `mod_nav.js` | 5 | admin configuration |
| `plat_mcp` | AI and coding clients | ai | `mod_plat_gate.js` | 4 | admin configuration |
| `r15_sem` | Semantic model | platform | `mod_r15f3_report.js` | 2 | admin configuration |
| `r16g_perm` | Permissions | platform | `mod_r16g_c_admin.js` | 8 | admin configuration |
| `r16h_groups` | Approval groups | automate | `mod_r16h_c_groups.js` | 7 | admin configuration |
| `r16h_rules` | Approval rules | automate | `mod_r16h_d_rules.js` | 4 | admin configuration |
| `r16h_status` | Status catalog | people | `mod_r16h_a_status.js` | 3 | admin configuration |
| `r16m_overlay` | Tenant overlays | platform | `mod_r16m_e_overlay.js` | 3 | admin configuration |
| `svc_notify` | Notification engine | automate | `mod_svc.js` | 6 | admin configuration |
| `zevt` | Events and rules | platform | `mod_zevt.js` | 7 | admin configuration |
| `orgdesign` | Agent Action | people | `mod_r28_od2.js` | 2 | agent action surface |
| `kcs_ask` | Ask the knowledge base | know | `mod_kcs.js` | 6 | assistant |
| `plat_self` | Self-build | platform | `mod_selfbuild.js` | 1 | builder entry |
| `studio` | VibeCheck | new | `mod_r25_b_studio.js` | 7 | builder entry |
| `bc_cal` | Exercise calendar | platform | `mod_r16l_c_cal.js` | 5 | calendar |
| `ppl_av` | Rooms and conference scheduling | people | `mod_people.js` | 3 | calendar |
| `metrics` | Metrics | platform | `data.js` | 38 | catalog |
| `chat_home` | Chat and agents | platform | `mod_chat.js` | 13 | chat |
| `itsm_mi` | Major incident | service | `mod_itsm.js` | 7 | command center |
| `showroom` | Showroom | platform | `mod_r33_showroom.js` | n/a | demo space |
| `r15_mobile` | Mobile approvals and on-call | people | `mod_r15f3_mobile.js` | 1 | device preview |
| `loop` | Feedback loop | platform | `data.js` | 7 | diagram |
| `ppm_sow` | SOW and contract analyzer | portfolio | `mod_sow.js` | 15 | document analyzer |
| `itom_graph` | Impact Explorer | ops | `mod_itom.js` | 2 | graph explorer |
| `itom_model` | CMDB data model | ops | `mod_itom.js` | 1 | graph explorer |
| `kg` | Impact graph | know | `data.js` | 0 | graph explorer |
| `plat_data` | Master data model | platform | `mod_plat_atlas.js` | 19 | graph explorer |
| `plat_data_old` | Data tables and model checks | platform | `mod_plat_atlas.js` | 0 | graph explorer |
| `vault` | Knowledge graph | know | `mod_kgx.js` | 5 | graph explorer |
| `zl_conn` | Connections and gaps | platform | `mod_zlink.js` | 3 | graph explorer |
| `r15d_firstweek` | My first week | help | `mod_r15d_front.js` | 6 | help or onboarding |
| `r16m_guides` | Process guides | platform | `mod_r16m_d_guides.js` | 4 | help or onboarding |
| `r17p_tour` | Tour | platform | `mod_r17p_d_screen.js` | 3 | help or onboarding |
| `home` | Home | platform | `data.js` | 25 | landing page |
| `r18_lens` | Executive lenses | lens | `mod_r18k_biz.js` | 6 | lens picker |
| `r18_levels` | Views by level | lens | `mod_r18g_levels.js` | 1 | lens picker |
| `r18_strategy` | Strategy enablement | lens | `mod_r18e_lens.js` | 7 | lens picker |
| `org_chart` | Org chart | people | `mod_org2.js` | 25 | map or diagram |
| `plat_dmap` | Data connections | platform | `mod_plat_links.js` | 1 | map or diagram |
| `plat_map` | Master process flow | platform | `mod_plat_modmap.js` | 12 | map or diagram |
| `plat_pmap` | Process connections | platform | `mod_plat_links.js` | 3 | map or diagram |
| `ppl_jrny` | Journey maps | people | `mod_people.js` | 10 | map or diagram |
| `svc_portal` | Self-service portal | service | `mod_svc.js` | 24 | portal |
| `bc_frame` | Resilience framework | platform | `mod_r16l_b_ui.js` | 3 | reference |
| `r16m_deploy` | Deployment paths | platform | `mod_r16m_b_setup.js` | 3 | reference |
| `fin_spend` | Spend-order simulator | portfolio | `mod_plat_fin.js` | 2 | simulator |
| `ppm_wbs` | WBS and task sheet | portfolio | `mod_wbs.js` | 12 | spreadsheet |
| `ims` | Master schedule | (none) | `screens4.js` | 13 | timeline |
| `plan` | Project plan | (none) | `screens4.js` | 30 | timeline |
| `r16m_setup` | Implementation and setup | platform | `mod_r16m_b_setup.js` | 3 | wizard |

Other by sub-type: admin configuration 14; graph explorer 7; map or diagram 5; help or onboarding 3; lens picker 3; timeline 2; calendar 2; reference 2; builder entry 2; landing page 1; AI assistant 1; catalog 1; diagram 1; activity log 1; chat 1; command center 1; assistant 1; simulator 1; device preview 1; wizard 1; agent action surface 1; demo space 1; document analyzer 1; portal 1; spreadsheet 1. (prototype fact for counts; the sub-types are hypotheses)

## 4. Suggested additions to the archetype list (hypothesis)
Rule R2 names eight archetypes. The "Other" group suggests the library will need at least these names, otherwise authors build one-offs:
- **Admin configuration** (14 screens): settings, matrices and rule editors for administrators.
- **Graph or map explorer** (12 screens): impact graphs, process and data connection maps, org and journey maps.
- **Lens picker** (3): executive lens, strategy enablement, views by level.
- **Help or onboarding** (3): tour, first week, process guides.
- **Calendar or timeline** (4).

## 5. Outliers
Selected on measured size, wiring or definition. All figures are prototype facts from the build of 2026-10-19; "text" is the visible text length of the rendered screen on first open.

| Screen | Why it stands out | Proposal |
|---|---|---|
| `nav_studio` Navigation and search | Largest screen by far: about 74,700 characters of text and 393 form controls, as one scroll | Keep. Split into tabs on the shared `views` component when it is next touched (R7) |
| `scr_map` Screen map | 28,300 characters; zero inbound references (reached from the menu only) | Keep. Add to the Admin suite menu group |
| `zevt` Events and rules | 19,000 characters, 244 rows, 209 form controls | Keep. Candidate for the admin configuration archetype |
| `r18_debt` Risk and debt | 18,900 characters although the other three screens of its suite (`make`) are about 2,200 to 2,600 | Keep. Fold the content as a tab of `plat_debt` (see 6.8) |
| `trace` and `strat_exec` | 17,300 characters each, 57 rows each, and the same content (see 6.1) | Fold |
| `plat_map` Master process flow | 13,500 characters, 10 lane-like elements, defined twice (shadowed `dup` in `mod_devops.js`) | Keep; remove the shadow only in a no-behavior-change cleanup |
| `exe_mat` Maturity models | 11,400 characters, 247 rows, 12 tables | Keep |
| `r16g_perm` Permissions | 504 rows on first open | Keep. Check at Enterprise scale (R11) |
| `fo`, `kg`, `plat_data_old`, `scr_map` | No inbound references from any other module (Screen map data) | `plat_data_old` fold (6.2); `fo` and `kg` keep, but each needs an entry point |
| 11 ids with shadowed definitions | `bud_ben`, `itom_dev`, `kcs_gap`, `kcs_home`, `kcs_prompt`, `plat_data`, `plat_map`, `ppl_cap`, `ppl_jrny`, `ppl_org`, `r18_lens` | Keep ids; schedule removal of the losing definition as a cleanup row |
| `port`, `ims`, `plan`, `log` | Registered in `screens4.js` with no suite (group) in `REG`, so the menu cannot place them by suite | Keep ids; assign a suite when the menu is next revised |
| 11 screens with one inbound reference or fewer | `fo`, `kg`, `plat_data_old`, `scr_map` have none; `itom_model`, `orgassist`, `plat_dmap`, `plat_self`, `r15_mobile`, `r15_p2p`, `r18_levels` have one (Screen map data, `in` field) | Review each against R3 before adding more siblings |

## 6. Near-duplicates and families: fold or keep
"Fold" means: keep every screen id and link working, and present the screens as one family with a view switcher (R3), or make one id an alias that renders the other. No id is ever deleted. "Keep" means the screens answer different questions. Evidence in 6.1 is a measured match of rendered text; 6.2 lists name and purpose overlaps judged from the screen list, so they are hypotheses to confirm by opening the screens side by side.

### 6.1 Exact duplicates (measured)
| Pair | Evidence | Proposal |
|---|---|---|
| `plat_data` Master data model and `plat_data_old` Data tables and model checks | Rendered text matches 100%; same 451 drawings and 263 rows; `plat_data_old` has no inbound reference | Fold: make `plat_data_old` an alias of `plat_data` and hide it from menus |
| `trace` Executive trace and `strat_exec` Strategy to execution | Rendered text matches 99% (17,300 and 17,299 characters); both in the portfolio suite | Fold: one screen, the other id an alias with the same content. `strat_exec` is the better name to keep visible |

### 6.2 Same question, several screens (hypothesis; fold unless an owner shows a different purpose)
| Family | Screens | Proposal |
|---|---|---|
| Budget and forecast | `bud_model` Budget model and forecast, `fin_budget` Budget and forecast, `fin_model` IT financial model, `bud_over` Budgets overall | Fold `bud_model` and `fin_budget` into one with a view switcher; keep `bud_over` and `fin_model` |
| Spend views | `bst` Budget and spend traceability, `r18_spend` Enterprise spend, `tbm_model` Technology cost transparency, `fin_alloc` Allocation and showback | `bst` and `r18_spend` have near-identical purpose (spend traceability): fold into one; keep `tbm_model` and `fin_alloc` |
| Integrations | `flw_hub` Integration hub, `plat_fab` Integration fabric, `r16m_sources` Data sources and integrations, `zl_conn` Connections and gaps | `flw_hub` and `plat_fab` overlap in purpose (hub and fabric): fold. Keep `r16m_sources` (setup) and `zl_conn` (gaps) |
| Lens family | `r18_lens` Executive lenses, `r18_strategy` Strategy enablement, `r18_levels` Views by level | Fold into one lens screen with three tabs; `r18_lens` is already defined twice |
| Maturity | `exe_mat` Maturity models, `r18_mature` Maturity roadmaps | Keep both for now: one scores, the other plans; link them (see `docs/inventory/maturity-tour-map.md`) |
| Debt | `plat_debt` Technical debt ledger, `r18_debt` Risk and debt | Fold `r18_debt` into `plat_debt` as a tab |
| Dashboards | `exe_dash`, `r17u_dash`, `obs_dash`, `r16j_dash` Dashboard builder, `kcs_viz` Visualization builder | Keep `exe_dash` and `obs_dash`. Fold `r17u_dash` (generic Dashboards) with `r16j_dash`, and `kcs_viz` with the builder, so there is one builder |
| Graph explorers | `kg` Impact graph, `itom_graph` Impact Explorer, `vault` Knowledge graph, `plat_dmap`, `plat_pmap`, `plat_map` | Fold `kg` and `itom_graph` (same name of purpose: impact). Keep the others |
| Org | `org_chart`, `orgassist` Org chart with agent assist, `orgdesign` Agent Action | Fold `orgassist` into `org_chart` as a mode; keep `orgdesign`. `org_chart` and `orgassist` share 32% of rendered text |
| Meetings | `meet_hub`, `meet_act`, `meet_dec`, `meet_series` Forums and series, `ppl_meet` Forums and minutes | Fold `ppl_meet` into `meet_series`; consider `meet_act` and `meet_dec` as tabs of `meet_hub` (each has one or two inbound references) |
| Agents | `r15d_agents` Agent registry, `ai_runtime` Agent runtime, `flw_agent` Agentic workflows, `tower` AI Control Tower, `adm_gate` AI gateway and tokenomics | Keep `tower` as the entry; fold `r15d_agents` and `ai_runtime` as tabs of one agent screen |
| Approvals | `inv`, `flw_appr`, `inbox`, `r16h_groups`, `r16h_rules` | Keep. They are the approval inbox archetype plus its two admin screens |
| Resilience | eight `bc_*` screens (`bc_home`, `bc_frame`, `bc_tiers`, `bc_cal`, `bc_plans`, `bc_decl`, `bc_trace`, `bc_metrics`) | Fold into one Resilience screen with tabs; all eight are wired from one module and each has three to five inbound references |
| Governance, risk and compliance | eight `grc_*` screens | Keep as a family; already share a shell. Add a view switcher if not present |
| Build | `plat_build`, `plat_self`, `plat_gate`, `r18_builds`, `studio`, `r18_app` | Keep; confirm the entry point for each with CL-52 |
| Identity and access | `adm_sec`, `r15_iam`, `r16g_perm` | Fold `adm_sec` and `r15_iam` (Security and access; Identity and access); keep `r16g_perm` |
| Data registry | `plat_store`, `plat_reg`, `r15_sem` | Keep; different layers (store, registry, semantic model) |
| Capacity | `ppl_cap` Resource planning, `ppl_org` Workload by team, `svc_skills` Skills and availability | Keep `ppl_cap`; fold `ppl_org` as a tab. Both are defined twice |
| Schedules | `ims` Master schedule, `plan` Project plan, `ppm_wbs` WBS and task sheet | Keep; different scopes |

### 6.3 Summary of the proposal (hypothesis)
Fold candidates are 2 exact pairs plus 13 families, which would reduce the visible screens by an estimated 24 of 189 (26 with the optional meeting tabs) while keeping every id. That estimate is a hypothesis; the two measured pairs account for 2.

## 7. What this inventory does not cover
- Drawers, modals, portal pages and mobile pages that are not registered with `REG`.
- Whether a screen follows the full R34 order (hero, lens note, `procCard`, dashboard, lists, detail).
- Tenant behavior: which screens read through the tenant data layer (R16). That is CL-55 and DC-03.
- Archetype is not recorded in code. Adding an `archetype` argument to `REG` is the declared remedy in R2; this paper supplies the starting classification for it.
