# Falconaire navigation architecture

Design paper for backlog item PH-14 (sidenav sprint), written with PR-06 (top bar) in mind and building on CL-51 (screen archetype inventory). It describes; it carries no status, priority or task list. Work that follows from it becomes backlog rows, cited here by ID. The per-screen detail is in `docs/ia/screen-inventory.csv` (one row per registered screen, 195 rows); the one-page summary is `docs/ia/README.md`.

Binding inputs: Omar's decisions of 2026-10-20 (menu by role, six business areas, a separate Build and admin space, an own Transformation group, a contribution anchor for every person, team and screen) and the platform rules in `docs/PLATFORM_RULES.md` (R2 archetypes, R3 no new screen when a view will do, R34 screen order, R38 information by level).

**Labels.** Counts of screens, groups, families, tabs and links are **prototype facts**, measured on 2026-10-20 by building the prototype (`python3 src/build.py --full`) and reading the live registry in a headless browser (`tools/scratch/ia/extract.js`, `tools/scratch/ia/demos.js`). Proposed placements, labels and families are **proposals**. Science claims are summaries of well-known findings, each one line; effect sizes are not claimed. Targets in section (g) are **hypotheses** until measured. Contribution points in section (f) are **modeled**. All people, teams and objectives named are fictional sample data for the Atlantic Systems.

## What the prototype has today (prototype facts)

| Measure | Value |
|---|---|
| Registered screens (`SCREENS`) | 195 |
| Navigation groups (`NAVX.groups`) | 20, including "New and unsorted" and "Story and demo" |
| Screens hidden from every menu (`R15.hidden`) | 57: 55 family views and 2 aliases (`trace` to `strat_exec`, `plat_data_old` to `plat_data`) |
| Screens in a menu | 138 |
| View-switcher families (`R15.families`, after `mod_r18b_families`) | 19 |
| Personas (`PERSONAS`) | 26 |
| What the CIO persona sees by default | The CxO Simple menu (`mod_r28_cxo.js`): 9 fixed items and a 6-item Strategy and value block. With the Full menu: 4 role pins, 8 groups, and 11 more groups behind "More areas" |
| Screens that read through the tenant data layer (`DATA.screenMode`) | 15 (12 data, 3 tenant); 180 are Atlantic-only (core) |
| Showroom tours (`SHOW.demos`) | 16, opening 37 distinct screens; none of the 37 is merged, retired or search-only in this proposal, so every beat keeps its deep link |
| Screens with no shared group in `REG` (`port`, `ims`, `plan`, `log`) | 4 |

Why Omar could not find the Screen map (PH-14 scope item 1): it is registered under Platform admin, but the default Simple menu for executive personas (`mod_r28_cxo.js`) shows a fixed list of seven items and drops every group, and for other personas Platform admin sits inside the collapsed "More areas" block. Search found it only after PH-12. The proposal below puts it one click away in Build and admin and keeps it searchable for everyone.

## (a) Principles, with the science behind each

1. **Seven or fewer at the top level.** Working memory holds about four chunks at once (Cowan), so a short top level is read, not scanned.
2. **Chunk by business area, then sub-group, then view.** Chunking turns many items into a few meaningful units (Miller; chunking research), so 195 screens become 7 areas of 3 to 5 sub-groups.
3. **Fewer choices per step.** Decision time grows with the log of the number of equally likely choices (Hick and Hyman), so each step offers one small set.
4. **Recognition over recall.** Recognizing a visible label is easier than recalling a name (Nielsen's heuristics; memory research), so menus show plain labels and search accepts the words people type.
5. **Stable placement.** People remember where things are (spatial memory; method-of-loci research), so area order, icons and positions never reorder by themselves; personalization only adds pins.
6. **Strong information scent.** People follow the label that best predicts their goal (Pirolli and Card, information foraging), so labels name the task or the object ("Approve invoices"), not the module ("Invoice approval").
7. **Progressive disclosure.** Showing the next level only on demand lowers load (Shneiderman's overview first, then detail), so area, sub-group, item, view, record drawer and 360 view are the six depths.
8. **Low extraneous load.** Cognitive load theory separates the load of the task from the load of the interface (Sweller), so duplicates fold into one entry with a view switcher instead of three entries that look alike.
9. **One salient signal per place.** Attention is captured by contrast and novelty and is limited (Treisman; attentional capture), so each area shows at most one count badge, and only for items waiting on the viewer.
10. **Habit loops.** Behavior repeats when a cue, an action and a reward are stable (Duhigg's loop; Wood on habits in context), so Home always shows the same three cues: what waits on me, my contribution, what changed.
11. **Purpose and progress motivate.** Seeing progress on meaningful work is a strong daily motivator (Amabile and Kramer, the progress principle), and goals work when they are specific and visible (Locke and Latham), so every screen and person shows the objective it serves.
12. **Search and chat are doors, not fallbacks.** Experts navigate by intent faster than by menus (command line and command palette studies), so the search palette and chat reach every screen, view and record.

## (b) The proposed menu for each persona

### Rail layout (every persona)

| Position | Item | Notes |
|---|---|---|
| Top | Product mark, opens **Home** | Home is not a slot; it carries the My contribution thread and the next three things |
| Fixed | **My work** | My approvals, Meetings, My first week (new hires), My contribution |
| Fixed | **Ask or request** | Ask Falconaire (chat), Find an answer, Report a problem or order something |
| Slots 1 to 7 | **Business areas in purview**, always in this order: Strategy and value; Portfolio and delivery; Operations and service; Money and contracts; People and organization; Risk, control and AI; Transformation | A persona sees only its purview areas, never reordered. Inside each area the persona's role pins come first |
| Fixed, after the areas | **All screens** | One click opens every area and every visible entry for everyone with access; filters: area, object, my objectives |
| Bottom | **Showroom** | Tours and lenses; hidden for Vendor guest |
| Bottom | **Build and admin** (gear) | Shown to Architect and Platform admin; reachable by anyone through search and All screens |

The fixed four (My work, Ask or request, Showroom, Build and admin) sit outside the seven-slot budget, as Omar's decision allows. "All screens" sits outside it too, because it is the escape hatch, not a destination.

### Areas and first screens by persona

Areas are listed in canonical order. "First screens" are the role pins (at most four) shown at the top of their area flyout and on Home; ids are given so the mapping can be checked against the inventory.

| Persona | Areas shown (count) | First screens (role pins) | Gear | Notes |
|---|---|---|---|---|
| CEO | Strategy and value; Portfolio and delivery; Money and contracts; People and organization; Risk, control and AI; Transformation (6) | Board pack `exe_board`; Executive lenses `r18_lens`; Goals and objectives `exe_strat`; Dashboards `exe_dash` | no | |
| CIO (persona key `exec`) | Strategy and value; Portfolio and delivery; Operations and service; Money and contracts; Risk, control and AI; Transformation (6) | Budget and spend traceability `bst`; Dashboards `exe_dash`; Watch and control AI agents `tower`; Build list `r18_builds` | no | Default persona (Casey Rowan) |
| CFO | Strategy and value; Portfolio and delivery; Money and contracts; Risk, control and AI (4) | `bst`; Approve invoices `inv`; Budgets `bud_over`; `exe_dash` | no | |
| COO | Strategy and value; Portfolio and delivery; Operations and service; People and organization; Risk, control and AI; Transformation (6) | `exe_strat`; Trace goals to money and work `strat_exec`; Journey maps `ppl_jrny`; Agent Action `orgdesign` | no | The wedge order of the COO cut; `strat_exec` and `port` join the CxO menu per Omar 2026-10-20 (PR-18 follow-up) |
| CCO | Strategy and value; Operations and service; Money and contracts; People and organization; Transformation (5) | Measures and targets `metrics`; Work the request queue `svc_req`; Org chart `org_chart`; Processes `plat_proc` | no | |
| CHRO | Strategy and value; People and organization; Transformation (3) | `org_chart`; Performance reviews `ppl_perf`; Training and courses `ppl_train`; Who is available to do the work `ppl_cap` | no | |
| CISO | Strategy and value; Operations and service; Risk, control and AI (3) | Governance, risk and compliance `grc_home`; Identity and access `r15_iam`; Risk `exe_risk`; Guardrails `guard` | no | Permissions are one search away |
| CAIO | Strategy and value; Risk, control and AI; Transformation (3) | `tower`; Agent registry `r15d_agents`; Test AI answers `kcs_test`; Value realized `r17q_value` | no | Pins may open a family view directly |
| General counsel | Strategy and value; Money and contracts; Risk, control and AI (3) | Review a statement of work `ppm_sow`; Policies `grc_pol`; Exceptions and acceptances `grc_exc`; Vendors and contracts `bud_ven` | no | |
| Board member | Strategy and value; Risk, control and AI (2) | `exe_board`; Evidence room `r15d_evidence`; `exe_risk`; `exe_dash` | no | Read only: no create, no request forms |
| Portfolio lead | Strategy and value; Portfolio and delivery; Money and contracts; People and organization; Transformation (5) | Ideas and requests for new work `port`; Schedules across projects `ims`; Risks, issues and decisions `ppm_raid`; `ppl_cap` | no | |
| Auditor | Strategy and value; Money and contracts; Risk, control and AI (3) | `r15d_evidence`; `grc_home`; Who can approve what `bud_doa`; `exe_board` | no | Read only |
| Project manager | Portfolio and delivery; Money and contracts; People and organization (3) | Projects `ppm_proj`; `ims`; `ppm_raid`; Timesheets and actuals `r15_time` | no | Meetings sit in My work |
| Service desk lead | Operations and service; People and organization; Risk, control and AI (3) | Fix what is broken `itsm_inc`; Run a major outage `itsm_mi`; Who is on call `svc_oncall`; Browse and manage articles `kcs_home` | no | |
| Distribution manager | Portfolio and delivery; Operations and service; Transformation (3) | `svc_req`; `plat_proc`; `metrics`; Order guides `svc_guides` | no | |
| Facilities lead | Operations and service; Money and contracts; Transformation (3) | `svc_req`; `plat_proc`; `metrics`; `bud_ven` | no | |
| Procurement lead | Operations and service; Money and contracts; Transformation (3) | `bud_ven`; Procure to pay `r15_p2p`; `ppm_sow`; `plat_proc` | no | |
| Plant manager | Portfolio and delivery; Operations and service; Risk, control and AI; Transformation (4) | `metrics`; `plat_proc`; Process maturity `exe_mat`; `svc_req` | no | |
| Process control lead | Operations and service; Risk, control and AI; Transformation (3) | Plan and approve changes `itsm_chg`; `plat_proc`; `metrics`; `svc_req` | no | |
| Change manager | Portfolio and delivery; Operations and service; Transformation (3) | `itsm_chg`; Plan and track releases `itsm_rel`; Build and release pipelines `dev_pipe`; Runbooks and automatic fixes `itom_run` | no | |
| Architect | Portfolio and delivery; Operations and service; Risk, control and AI; Transformation (4) | Platform maps `plat_map`; Registries `plat_reg`; Technical debt `plat_debt`; Servers, apps and other technology `itom_cmdb` | yes | |
| Platform admin | Operations and service; People and organization; Risk, control and AI (3) | Fields, forms and themes `adm_studio`; Permissions `r16g_perm`; `plat_reg`; Tenancy `tn_admin` | yes | Sees the hidden tenant test views |
| Finance approver | Portfolio and delivery; Money and contracts (2) | `inv`; `bud_over`; Budget requests `bud_req`; `bud_ven` | no | |
| Employee | People and organization (1) | Report a problem or order something `svc_portal`; Find an answer `kcs_ask`; `svc_guides`; `ppl_train` | no | My work and Ask or request carry most of the job |
| New hire | People and organization (1) | My first week `r15d_firstweek`; `svc_portal`; `ppl_train`; `kcs_ask` | no | |
| Vendor guest | none (0) | `svc_portal` (shared requests only) | no | No All screens and no Showroom: the guest's purview is enforced by permission, not by navigation |

Effect (prototype fact for today, proposal for tomorrow): today the CIO sees 15 items in the Simple menu, or 8 groups plus 11 behind "More areas" in the Full menu; tomorrow 6 areas with 4 pins first. No persona sees more than 6 areas. The most a persona scans to reach a purview screen is one area flyout of at most 7 sub-groups with at most 7 entries each (Operations and service is the largest: 5 sub-groups, 16 entries).

### The business areas and their visible entries (proposal)

| Area | Sub-groups (entries) | Visible entries | Screens placed in the area (all actions) |
|---|---|---|---|
| Strategy and value | Direction (Goals and objectives, Executive lenses, Board pack); Performance (Dashboards, Measures and targets); Value and money (Budget and spend traceability, Benefits and value realized) | 7 | 18 |
| Portfolio and delivery | Choose the work (Ideas and requests); Plan and run (Projects, Schedules, Risks issues and decisions, Timesheets); Staff and ship (Who is available, Team boards, Releases, Pipelines) | 9 | 13 |
| Operations and service | Service desk (6); Change and service levels (3); Technology and services (4); Monitoring (2); Knowledge (1) | 16 | 28 |
| Money and contracts | Approve and pay (4); Budgets (2); Where money goes (1); Vendors and contracts (2) | 9 | 19 |
| People and organization | Organization (Org chart); Capacity and skills (Skills and availability); Learning and performance (Performance reviews, Training) | 4 | 5 |
| Risk, control and AI | Risk (Risk, Guardrails); Control, audit and access (GRC, Evidence room, Identity and access); AI oversight (AI agents, Test AI answers); Resilience (Resilience) | 8 | 30 |
| Transformation | Redesign the work (Journey maps, Org chart with agent assist, Agent Action); Processes and maturity (Processes, Process maturity); Scale what was built (Build list, VibeCheck) | 7 | 15 |
| Build and admin (gear) | Build (4); Automate (4); Data and integration (5); Access and tenants (3); Run the platform (6); Product (2) | 24 | 48 |
| My work, Ask or request, Home, Showroom | fixed items | 8 | 19 |
| **Total** | | **92** (138 today) | **195** |

## (c) Group merges, collapses and re-orders

| Group today (id) | Becomes | Reason |
|---|---|---|
| Home (`home`) | Product mark and Home | Home is a place, not a menu choice |
| Story and demo (`story`) | Showroom family | One demo space (CLAUDE.md); the Tour and How it was built become Showroom views |
| My work (`my`) | My work | Kept; approval routing setup leaves it (an employee should not see admin setup next to their inbox) |
| Get help or ask for something (`help`) | Ask or request | Same purpose, shorter label that matches the verbs people use |
| Projects and delivery (`plan`) | Portfolio and delivery | Omar's area name; the report builder leaves for Dashboards |
| Service and support (`fix`) and Enterprise IT (`tech`) | Operations and service | Service desk and the technology behind it are one operating area; two sub-groups keep them apart |
| Money and contracts (`money`) | Money and contracts | Kept; four funding screens fold into one Funding rules entry and four cost screens into one Cost transparency entry |
| People and teams (`people`) | People and organization | Kept; Journey maps leave for Transformation |
| Knowledge and learning (`learn`) | Split: Knowledge to Operations and service; Training to People and organization | Knowledge is used to resolve work; training is about people |
| Executive lenses (`lens`) | Strategy and value, Direction sub-group | One Lenses family instead of three screens |
| Strategy and value (`strat`) | Strategy and value | Kept; cloud cost, showback and TBM move to Money; Agent Action and the org assist move to Transformation |
| Risk and control (`grc`), Resilience (`res`), AI oversight (`ai`) | Risk, control and AI | Omar's area; three sub-groups keep risk, resilience and AI distinct |
| Registry and truth (`reg`) | Split: impact to Operations; registries to Build and admin | Registries are a builder concern |
| My builds and access (`make`) | Transformation (Build list, VibeCheck); data access merges into Identity and access | The build list is the COO wedge story; access belongs with access |
| Design, data and controls (`kit`) and Platform admin (`plat`) | Build and admin (gear) | Builder and admin tools leave the business menu (Omar's decision) |
| New and unsorted (`new`) | Removed; `wf_runs` moves to Build and admin | A group named "unsorted" is a leftover |

Re-order rule: areas keep one canonical order everywhere (menus, All screens, search facets, Showroom lens chips). A persona's purview removes areas; it never reorders them, so spatial memory transfers between roles. Old group ids keep resolving: the existing `OLDG` and `NAVX.alias` maps gain one row per old group pointing to its new area, so saved menu overrides (`oukala-nav-map`) and favorites still open.

## (d) Duplicates and combinations

Two mechanisms, both keep every screen id working (R3):
- **Fold into a family**: the screen stays registered with its own render; the menu shows one entry (the canonical id); a view switcher at the top of every member links them (the existing `R15.families` mechanism, `mod_r15c_merge.js` and `mod_r18b_families.js`).
- **Merge as a view**: the screen's content is already a tab, or is too small to stand alone; its id redirects (`R15.alias` with a tab argument) to the canonical screen opened at that tab. The render code of the old id is kept until CL-41 shows it unused and Omar approves removal.

Counts (proposal): 36 families, of which 17 exist today (10 unchanged, 7 changed) and 19 are new; 10 screens merge as views into 9 targets; 2 current families end (`adm_env`, whose Delivery speed view moves to the pipeline, and `metrics`, whose three views move to the areas that own them).

| Family (menu entry) | Area | Canonical id | Views in the switcher (id: label) | Today |
|---|---|---|---|---|
| My approvals | My work | `flw_appr` | `flw_appr`: My approvals; `inbox`: Alerts and inbox | exists, changed |
| Meetings | My work | `meet_hub` | `meet_hub`: Meetings; `fo`: My calendar and follow-ups; `meet_act`: Meeting actions; `meet_dec`: Decisions made in meetings; `meet_series`: Recurring meetings and forums; `ppl_av`: Book a room; `ppl_meet`: Meeting minutes | exists, unchanged |
| Report a problem or order something | Ask or request | `svc_portal` | `svc_portal`: Report a problem or order something; `svc_guides`: Order guides | exists, unchanged |
| Executive lenses | Strategy and value | `r18_lens` | `r18_lens`: Executive lenses; `r18_strategy`: How each function enables the strategy; `r18_levels`: Views by level (merged tab) | proposed |
| Dashboards | Strategy and value | `exe_dash` | `exe_dash`: Dashboards; `r15_rpt`: Reports and subscriptions; `r16j_dash`: Build a dashboard; `kcs_viz`: Chart library and builder (merged tab); `r17u_dash`: Dashboard viewer and templates (merged tab) | exists, changed |
| Benefits and value realized | Strategy and value | `bud_ben` | `bud_ben`: Benefits and value realized; `r17q_value`: Value realized | proposed |
| Budget and spend traceability | Strategy and value | `bst` | `bst`: Budget and spend traceability; `r18_spend`: Spend detail; `strat_exec`: Trace goals to money and work | exists, unchanged |
| Schedules across projects | Portfolio and delivery | `ims` | `ims`: Schedules across projects; `ppm_wbs`: Tasks and work breakdown; `plan`: One project's plan (merged tab) | proposed |
| Team boards and backlogs | Portfolio and delivery | `agile_board` | `agile_board`: Team boards and backlogs; `agile_art`: Planning across teams | proposed |
| Browse and manage articles | Operations and service | `kcs_home` | `kcs_home`: Browse and manage articles; `kcs_edit`: Write or update an article; `kcs_gap`: What knowledge is missing | proposed |
| See what a change would affect | Operations and service | `kg` | `kg`: See what a change would affect; `vault`: Explore connected knowledge; `itom_graph`: Technology dependencies | exists, unchanged |
| Monitor systems | Operations and service | `obs_dash` | `obs_dash`: Monitor systems; `itom_evt`: Alerts and events; `itom_slo`: Reliability targets | proposed |
| Services we run | Operations and service | `svc_360` | `svc_360`: Services we run; `exe_apps`: Applications we run | proposed |
| Servers, apps and other technology | Operations and service | `itom_cmdb` | `itom_cmdb`: Servers, apps and other technology; `itom_disc`: Scan and import technology; `itom_health`: Is our technology data trustworthy; `itom_model`: How technology records are structured; `r16h_ci`: Who owns each technology item | proposed |
| Budgets | Money and contracts | `bud_over` | `bud_over`: Budgets; `bud_lines`: All budget lines; `bud_model`: Forecast model; `fin_budget`: Budget by funding type; `fin_model`: IT financial model | exists, changed |
| Which funding pays for what | Money and contracts | `fin_color` | `fin_color`: Which funding pays for what; `fin_gates`: Funding approval gates; `fin_rules`: Financial control checks; `fin_spend`: Test the order money is spent | proposed |
| See what technology costs | Money and contracts | `tbm_model` | `tbm_model`: See what technology costs; `bud_ccmap`: Cost center mapping; `fin_alloc`: Charge costs to teams; `itom_fin`: Cloud spend | proposed |
| Org chart | People and organization | `org_chart` | `org_chart`: Org chart; `ppl_org`: Workload by team | exists, unchanged |
| Watch and control AI agents | Risk, control and AI | `tower` | `tower`: Watch and control AI agents; `adm_gate`: AI usage and cost; `agent_defs`: Agent definitions; `ai_runtime`: Agent runtime; `flw_agent`: Workflows with AI agents; `kcs_skills`: What AI agents can do; `r15d_agents`: Agent registry | exists, changed |
| Test AI answers | Risk, control and AI | `kcs_test` | `kcs_test`: Test AI answers; `kcs_prompt`: Prompt library | proposed |
| Governance, risk and compliance | Risk, control and AI | `grc_home` | `grc_home`: Governance, risk and compliance; `grc_aud`: Audit management; `grc_ctl`: Controls and testing; `grc_find`: Issues and findings; `grc_pol`: Policies | proposed |
| Resilience | Risk, control and AI | `bc_home` | `bc_home`: Resilience; `bc_cal`: Exercise calendar; `bc_decl`: Declare a disaster; `bc_frame`: Resilience framework; `bc_metrics`: Resilience measures; `bc_plans`: Continuity plans; `bc_tiers`: Recovery tiers; `bc_trace`: Continuity traceability | proposed |
| Risk | Risk, control and AI | `exe_risk` | `exe_risk`: Risk; `grc_exc`: Exceptions and acceptances; `grc_risk`: Risk register; `grc_ven`: Third-party risk | exists, unchanged |
| Processes | Transformation | `plat_proc` | `plat_proc`: Processes; `draw_studio`: Draw a process; `flw_bpmn`: Process models (BPMN); `flw_design`: Workflow designer; `r16m_guides`: Process guides | exists, unchanged |
| Process maturity | Transformation | `exe_mat` | `exe_mat`: Process maturity; `r18_mature`: Maturity roadmaps | proposed |
| Build list | Transformation | `r18_builds` | `r18_builds`: Build list; `plat_gate`: Approve citizen-built apps | exists, changed |
| Showroom | Showroom | `showroom` | `showroom`: Showroom; `r15_mobile`: Phone approvals and on-call (preview); `r17p_tour`: Tour; `r17q_thinking`: How it was built | proposed |
| Permissions | Build and admin | `r16g_perm` | `r16g_perm`: Permissions; `adm_sec`: Security and access | exists, unchanged |
| Tenancy | Build and admin | `tn_admin` | `tn_admin`: Tenancy; `r16m_overlay`: Tenant overlays | proposed |
| Rules and decisions | Build and admin | `flw_dmn` | `flw_dmn`: Rules and decisions; `dec_cov`: Rule coverage; `r17s_rules`: In-app rules and scripts; `svc_notify`: Notifications; `zevt`: Events and rules | exists, unchanged |
| Approval groups | Build and admin | `r16h_groups` | `r16h_groups`: Approval groups; `r16h_rules`: Approval rules | proposed |
| Registries | Build and admin | `plat_reg` | `plat_reg`: Registries; `own_gaps`: Ownership and gaps; `plat_store`: Entity store; `r15d_facts`: Facts and conflicts | exists, changed |
| Platform maps | Build and admin | `plat_map` | `plat_map`: Platform maps; `plat_data`: Data model; `plat_dmap`: Data flows; `plat_pmap`: How processes connect; `zl_conn`: Connections and gaps | exists, changed |
| Connect other systems | Build and admin | `flw_hub` | `flw_hub`: Connect other systems; `plat_fab`: Data feeds and mappings | exists, unchanged |
| Data sources | Build and admin | `r16m_sources` | `r16m_sources`: Data sources; `r16m_import`: Import foundation data | proposed |
| Implementation and setup | Build and admin | `r16m_setup` | `r16m_setup`: Implementation and setup; `r16m_deploy`: Deployment paths | proposed |

Merge-only targets (a screen that absorbs a merged tab without becoming a family head): `exe_strat` gains Compare what-if scenarios (`exe_scen`); `dev_pipe` gains Delivery speed (`itom_dev`); `itsm_chg` gains Pre-approved changes (`obs_std`); `r15_iam` gains Data access requests (`r18_access`); `plat_build` gains Let Falconaire extend itself (`plat_self`); `plat_debt` gains Risk and debt (`r18_debt`).

Kept apart on purpose (R3 comparison recorded): `org_chart` and `orgassist` share 32% of rendered text, but one is the org of record and the other is a proposal tool for the COO story; `exe_mat` and the Process maturity roadmaps are one family because one scores and the other plans the same processes; `ppm_raid` (project-level) and `exe_risk` (enterprise risk) stay separate because they have different owners and escalation.

## (e) What nobody should see, and what only some roles should see

| Item | What it is | Proposal |
|---|---|---|
| `trace` | Exact duplicate of `strat_exec` (99% same text), already an alias | Candidate to retire (Omar decides); id redirects forever |
| `plat_data_old` | Exact duplicate of `plat_data`, labeled "Data tables and checks (old)" | Candidate to retire (Omar decides); id redirects forever |
| `loop` | Feedback loop diagram with no unique records | Candidate to retire (Omar decides); fallback is a Learning view on AI agents |
| Group "New and unsorted" | Leftover holding `wf_runs` | Removed |
| Group "Story and demo" | Leftover beside Showroom | Removed; content becomes Showroom views |
| Tab "Process areas (original)" on `plat_map` | Leftover tab name | Rename or drop the tab in the next touch of that module |
| `rec_shell` Record shell | Pattern reference for the record archetype | Search only, Build and admin |
| `r18_app` App record | One record shown as a screen | Search only; opens from Build list rows |
| `tn_projects`, `tn_people`, `tn_metrics` | Test views of the tenant data layer (CL-55) | Hidden from everyone except Platform admin; Showroom tenant briefs keep deep linking to `tn_metrics` |
| `r15_mobile` | Phone preview | Showroom view |
| Tab "SolarWinds uptime lab" on `itom_disc`, tab "Project Online coverage" on `ims` | Real product names in visible tabs | Check against R32; prefer generic names ("Uptime monitor import", "Project tool coverage") |
| Tab "Roadmap and Standards Update 2025-06" on `fin_model` | Reads close to a banned accounting-standards term (R31) | Wording check |
| `adm_audit` line naming certifications with "current evidence" | Reads close to a certification claim (R30, DC-27) | Reword before any demo |

Only some roles: the Build and admin gear shows for Architect and Platform admin; Board member and Auditor never see the gear or any create action (read only); the Vendor guest sees only the request portal and items shared with the vendor, and no All screens; tenant test views show for Platform admin only; the Product log and Screen map are in Build and admin, so builders find them in one click and everyone else through search (builder mode in search keeps showing hidden screens, PH-12).

## (f) The contribution anchor

Goal (Omar, 2026-10-20): everyone knows which part of the enterprise they contribute to; every person, team and screen is anchored to the enterprise objectives it serves, so later performance management can measure each person's contribution as their part of the enterprise objectives.

### What already exists (prototype facts)
- The cascade (`EXE.cascade()` in `src/mod_exec.js`, DC-12): company objective C1, five enterprise objectives O1 to O5, five group objectives G1 to G5 in three business groups, eleven team objectives T1 to T11, each team objective measured by one key result. Each link has a weight (sample assumption, modeled). Progress of a node is the weighted mean of its children; a leaf's contribution to the company is its progress times the product of normalized weights up the chain, in percentage points.
- Links from work to objectives (`E.links`) and from groups to projects (`CGRP.proj`).
- One accountable owner and a backup on every record (R12), rendered through `ownerChip` with `data-owner` and `data-owner-rec` (CL-53).
- Time on work (`r15_time` timesheets and actuals) and the one work index per render pass (`workFor.index`).
- The objective numbers O-001 and key result numbers O-001.2 (`NUM`), and the Trace this drawer (`THREAD.open`).

### How it appears in navigation
1. **The thread** (top bar, under the screen title, every screen): `Company > Enterprise objective > Group objective > Team objective > This screen`. Each segment is a number chip that opens `THREAD.open` at that node. On a screen anchored to a team objective the viewer belongs to, the last segment reads "Your team" and shows the team's key result. Wording example (fictional): "Trusted standards, published faster, at lower risk > Reduce operating risk > Tier 1 services stay up > Keep Tier 1 available (your team)".
2. **My contribution** (My work, and a card on Home, not a new screen): the viewer's thread from company to their own open and closed work, with modeled points: "Your work this quarter: 3.1 points of the company score (modeled), through Keep Tier 1 available". Three cues in a fixed place (habit loop): waiting on me, my contribution, what changed.
3. **Scent in menus**: an entry that serves one of the viewer's objectives carries a small anchor mark; All screens has a filter "Serves my objectives". One mark per entry, no color shouting (principle 9).
4. **Gaps are visible**: work with no path to an objective shows "Not linked to an objective", in the same style as the "No backup" badge (R12), and is counted in the cascade's orphan list.
5. **By level** (R38): an executive sees the company and enterprise levels with drill-down; a manager sees their group and teams; an individual sees their own thread first. A higher level can always open what is below.

### How it is computed
- **Screen anchor**: each screen declares the objective level it serves in its REG metadata (`objective`, section g); the inventory column `contribution_anchor` is the starting value. Where a screen serves a record type, the anchor comes from the record's links, not the screen.
- **Record path**: record > owning project or process (link or process owner) > objective (`E.links`) > group > enterprise > company. A process step links through its process owner's team objective.
- **Person to team**: memberships from the people directory (`DIR`); a person may serve several teams with a share each.
- **Person's share of a team objective (modeled)**: by default equal shares among the team's members; when time data exists, the share is the person's hours on work linked to that objective divided by the team's hours (`r15_time`); robot and agent work is credited to its human sponsor's team, never to a person as personal output.
- **Contribution points (modeled)**: for person p, Σ over team leaves t of contribution(t) × share(p, t), where contribution(t) is the existing cascade number. Shown with an `fchip` metric that names its formula, owner and target (R25) and is labeled modeled.

### Guardrails before performance management uses it
Contribution points describe how work connects; they are not a rating. Before any review or pay process reads them: a written people policy, a way for each person to see and correct their own links, no ranking of individuals, aggregate views for managers by default, and tenant-level controls (R16 to R20). This is an open decision (section i).

## (g) Scaling model for 1,000 and 9,000 screens

At 195 screens the menu can list screens. At 1,000 it cannot; at 9,000 the word "screen" stops being the unit of navigation. The model below keeps the visible menu inside a fixed budget no matter how many screens register.

1. **Records, not screens.** The unit of navigation is an **object type** (incident, contract, objective, process, agent, invoice, work order, referral). Each object type has one object home (dashboard-first list archetype), a record drawer, a 360 view and optional board, calendar, report and designer views. A new feature adds views to an object type before it adds a screen. At enterprise scale this is roughly 150 to 300 object types times 4 to 6 archetypes times tenant vocabularies, which is how 9,000 screens arise without 9,000 menu entries (hypothesis).
2. **Facets, not folders.** All screens and search filter by five facets: area, object type, process number (`P-014`, R5), objective (`O-001`), and owner or team. Every screen and record carries all five through metadata, so a new screen appears under the right facets without anyone editing a menu.
3. **Intent is the primary door.** The search palette (Ctrl K) and chat accept verb plus object plus filter ("approve invoices from Lumen", "open P-014.3", "who is on call for the Standards Platform") and land on the screen, view, filter and record. Menus are for orientation and learning; frequent users go by intent (principle 12).
4. **Role and purview filters.** Purview is a function of persona, memberships and permissions (the same function JM-13 uses for the Build list). Menus, All screens, search and chat apply it; nothing is hidden by navigation alone that permissions should hide.
5. **Personal and team workspaces.** My work is the personal workspace (inbox, approvals, meetings, my contribution, pinned views). Each team gets a generated team workspace: the team objective and key result, the team queue, its boards and its processes. Workspaces hold pins to views, never copies of screens.
6. **Stable spatial placement.** Areas never move; sub-groups append; entries append at the end of a sub-group; nothing reorders by usage. Suggestions ("you open this often, pin it?") are offered, never applied.
7. **Automatic registration into the taxonomy.** `REG` gains a metadata argument (R2 remedy, CL-51):

   ```
   REG(id, name, group, icon, render, {
     area: "ops", sub: "service-desk",            // taxonomy keys, from one TAXO registry
     objects: ["incident"],                        // object types shown (ATLAS entity ids)
     archetype: "list",                            // one of the pattern library archetypes
     personas: ["desk", "change"],                 // primary roles (purview hint, not permission)
     objective: "team",                            // company | enterprise | group | team | individual | platform
     compare: "itsm_mi",                           // the existing screen it was compared with (R3)
     family: null, view: null,                     // or the canonical id and view label
     menu: "search"                                // entry | view | search (default: search)
   })
   ```
   Area and sub-group default from the owning domain of the first object type, so most modules register correctly without choosing. A screen with no metadata lands in search only, never in a menu.
8. **Governance that stops menu growth.**
   - Menu budget: at most 7 areas; at most 7 sub-groups per area; at most 7 entries per sub-group. A new entry over budget must fold into a family, replace an entry, or stay search only.
   - Every new screen declares its archetype and its R3 comparison; the build fails without them (lint proposed with CL-46 and CL-51).
   - New screens start as `menu: "search"`; promotion to a menu entry needs a role need and usage evidence (`USAGE`, PR-16).
   - An entry with no opens in 90 days is proposed for demotion to search only; Omar approves (CL-41, hide first, never delete).
   - Every non-hidden screen appears in exactly one menu place (`NAVX.check`, PH-14 scope item 6); every hidden screen is reachable through its family, an alias or search.
9. **Measurable targets (hypotheses, measured with existing instruments).**

   | Measure | Today (prototype fact) | Target | Instrument |
   |---|---|---|---|
   | Top-level items a persona sees | up to 19 groups in the Full menu (8 before "More areas" for the CIO); 15 items in the CxO Simple menu | at most 7 areas plus the fixed four | rail render, `NAVX.persona.groups()` |
   | Visible menu entries, all areas | 138 | at most 92 now; never more than 7 x 7 x 7 at any scale | `NAVX.check()` |
   | Clicks from the rail to a purview screen | 2 to 3 (group, sometimes More areas, item) | 2 (area, entry); 3 for a view | path count per screen from the inventory |
   | Clicks to any screen for any internal persona | up to 3 plus scrolling | 2 through All screens, or 1 search | same |
   | Search success rate | `m_search_success` (seeded telemetry, modeled) | 90% or more | `m_search_success`, `USAGE` |
   | Zero-result searches | `m_search_zero_results` (modeled) | 3% or less | same |
   | Average navigation depth | `m_nav_depth` (modeled) | 2.0 or less | same |
   | Time to find, top 10 tasks per persona | not measured | median 10 seconds or less; first-click success 80% or more | tree test and first-click test with the inventory labels (to plan with Omar) |
   | Screens with no menu place, alias or family | 0 by `NAVX.check` today | 0 | `NAVX.check()` in `tools/tests/search.js` |

## (h) Migration plan

Each step keeps every old link, favorite, search record, Showroom deep link and process reference working. No screen id is deleted at any step.

1. **Taxonomy as data, no visible change** (PH-14). Add the area, sub-group and label table beside the existing `RAW` map in `mod_nav.js`, plus a check that every screen has exactly one place. The inventory CSV is the seed.
2. **Families and merges** (PH-14, CL-51). Apply the 19 new families and the 7 changed ones through the existing `R15.families` mechanism; apply the 10 merges as aliases with a tab argument (`R15.alias` gains an optional tab). Old ids open the right view.
3. **New rail** (PH-14). Switch the rail to the seven areas, My work, Ask or request, All screens, Showroom and the Build and admin gear. Old group ids map to new areas in `OLDG` and `NAVX.alias`, so saved overrides and old group links resolve. The CxO Simple menu (`mod_r28_cxo.js`) becomes the purview menu for CxO personas instead of a separate list.
4. **Menus by purview** (PH-14, JM-13). Translate each persona's `groups` in `R15D.DEFS` to areas (section b) and add the All screens view. The Build list adopts the same purview function (JM-13).
5. **Top bar** (PR-06). Simplify the top bar around the search palette, the tenant badge (R17), View as, and the contribution thread; move other controls to the profile panel.
6. **Search by facets** (PH-12). Add area and object facets and view-level results; builder mode keeps showing hidden screens.
7. **Wedge mode on top of purview** (PR-18). Wedge mode keeps working as a filter over the new menu; its screen set stays the COO cut plus Home and Showroom, with `strat_exec` and `port` added per Omar 2026-10-20.
8. **Metadata and lint** (CL-51, R2, R3). Add the REG metadata argument and the lint that fails a new screen with no archetype or comparison.
9. **Contribution thread** (DC-12 follow-up row to be added). Render the thread and My contribution from `EXE.cascade()`, links and owners; label points modeled.
10. **Retire only with evidence** (CL-41). After usage counts (PR-16) show no direct opens, remove the losing render code of aliases (`trace`, `plat_data_old`, and `loop` if Omar retires it). Ids keep redirecting.

## (i) Open decisions for Omar

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 1 | Where Knowledge lives | Operations and service; People and organization; its own area (an eighth) | Operations and service, Knowledge sub-group; training stays in People. Keeps seven areas |
| 2 | Where Resilience lives | Risk, control and AI; Operations and service | Risk, control and AI: continuity is a risk discipline; Declare a disaster stays reachable from Run a major outage |
| 3 | Where the process library lives | Transformation; Build and admin | Transformation: it is business-facing and five operations roles pin it; the designer is its view, so R4 holds |
| 4 | Top level form | Areas only, in fixed order, pins inside; or a mixed list of pinned screens and areas (today's CxO Simple menu) | Areas only with pins first inside each area and on Home: one model for all 26 personas, stable placement |
| 5 | Accept the 19 new families and 10 merges | All; only the measured duplicates; family by family | All, applied in step 2; each is reversible because no id is removed |
| 6 | Retire the render code of `trace`, `plat_data_old` and `loop` | Retire; keep hidden | Retire `trace` and `plat_data_old` after CL-41 evidence; decide `loop` after a look at its content |
| 7 | Who sees the Build and admin gear | Architect and Platform admin only; also the CIO | Architect and Platform admin; the CIO reaches it through search and All screens |
| 8 | Contribution points and performance reviews | Display only; feed reviews later under a policy; never feed reviews | Display only now, labeled modeled; a people policy, self-correction of links and no individual ranking before any review uses them |
| 9 | Label style | Task verbs everywhere; nouns everywhere; nouns for objects and verbs for tasks | Nouns for object homes ("Projects", "Budgets"), verbs for tasks ("Approve invoices", "Run a major outage") |
| 10 | Real product names in tabs (`itom_disc`, `ims`) and the certification-like line on `adm_audit` | Keep; rename | Rename to generic wording and reword the audit line before the next demo |
| 11 | How time-to-find is measured | Tree test with the inventory labels; first-click test in the prototype; usage only | A short tree test with the 26 persona tasks, then usage counts after the new rail ships |
