# Round 8 audit trace (build: review_build/full.html, 91 screens, 192 registered metrics)

Method: Playwright against the running build. Every screen visited via go(id) at 1440x900, all tabs clicked and text dumped (aud/txt), first-view full-page screenshots of all 91 screens (aud/first_*.png, aud/mont_*.png), timing with SCALE.set(true), drawers opened on all screens, cross-module wiring exercised through the page globals. No console page errors except bug B1.

## Verdict table

| ID | Verdict | Evidence | Fix needed (owner) |
|---|---|---|---|
| R0a | DONE | Single token set, no new palettes seen across 91 screens | - |
| R0b | PARTIAL | SCALE.set(true): 2,600 CIs (CIREG 2,822), 6,400 requests, 3,100 assets, 380 people. But only 42 projects (not hundreds/thousands), incidents stay at 17, DEMAND stays 10. Screen build times at scale: itom_evt 9.8s (24s on a loaded run), svc_oncall 2.5s (2.4s even without SCALE), ppm_proj 2.3s (7s loaded), vault 1.0s; SCALE.set itself 0.9-1.9s. Others under 1.5s | obs (itom_evt render + cache), sla (svc_oncall), ppm (ppm_proj), core (SCALE.build: add projects, incidents, changes, demand) |
| R0c | DONE | #drawer gets a Full screen button via kit2 openDrawer wrapper; drawers on 85 of 91 screens opened and all carried it; INC0412 drawer widens 470 to 1126 px. State persists across drawers | - |
| R0d | PARTIAL | 56 of 91 screens open on KPI tiles + chart + list (itsm_*, ppm_proj/raid/sow, itom_*, svc_*, agile_*, ppl_*, kcs_home/skills, obs_*). First tab is NOT dashboard+list on: trace, inv, fo, kg, loop, log, home (no list), all adm_* (Fields, Roles, Pipeline, Routing, Audit log...), bud_model/ven/ben/doa, exe_dash (Group overview, no list), exe_board, exe_scen, exe_risk, exe_apps, flw_dmn/bpmn/agent/hub, itom_fin, kcs_edit/ask/prompt/test, ppl_train/av/meet, tower | exec, core, flow, know, people |
| R0e | DONE | lrHTML used at about 90 call sites (every module). person360 shows 92 linked records with search + accordions + "show more". Caveat: ui.js recDrawer still renders all neighbours as chips (unbounded at scale) | core (recDrawer to lrHTML) |
| R0f | PARTIAL | METRICS holds 192 entries, each with formula, target, owner, use list; popover shows formula, trend, remediation SOP, auto-start toggle. 7 metrics have no rem (m_ops, m_vendor, m_mttr, m_aispend, m_yield, m_viz_a11y, m_viz_reuse), 22 have no unit. Only 15 of 263 KPI tiles carry their own fchip (hero chips exist, 7 screens have none: trace, metrics, kg, loop, log, bud_doa, svc_portal). 36 screens have a row of 4-18 tiles with zero linked metric | all modules: attach fchip to tiles; core: stat() accept metric id |
| R0g | PARTIAL | spacescan: 0 flagged squeezed text on first views. Defects: ims Milestones table has a ~165 px blank gap between header and first row; milestone drawer table clips the Duration column; Ask Oukala FAB overlaps content bottom-right; metric popover anchors top-left of viewport | wbs (ims milestone table row height), core (drawer table overflow, popover anchor) |
| R0h | DONE | Incident/problem/change/release drawers all have Impact analysis; openImpact works for incident, change, problem, release, ci, service (map, $ at risk, SLAs, projects). Service attached on every record (SVCX.attach) | - |
| R0i | DONE | ITIL 5, CSDM 5, DORA, PMBOK, COBIT, ISO 20000, TBM/ATUM, SAFe, CMMI chips on screens | - |
| R0j | DONE | Incident drawer: team first ("Ops team", claimed from queue) then person, swarm, ITIL guidance; team-first assignment metric 94% | - |
| R0k | PARTIAL | 50 chat tools, 3 autonomy modes, plan card with guardrails + Approve/Edit/Cancel, audit entry per action, Lineage tab in tower, chat_home Audit/Guardrails/Permissions tabs. Not chat-controllable: problem, release, SLA/agreement, CMDB CI, rota, workflow, budget, SOW change, KB publish actions | chat |
| S1 | DONE | exe_strat OKR cards readable, no squeezing | - |
| S2 | PARTIAL | Milestone drawer now shows Start/Finish/Float/Complete tiles and Float explained (good). Baseline/plan/actual table clips Duration column ("DUR", "mil"), cards stack with no gap | wbs, core |
| S3 | DONE | Board pack approval stepper + Submit/Print/Why buttons spaced | - |
| S4 | DONE | .fchip font-style normal, padding 2px 11px | - |
| N1 | PARTIAL | Portfolio and delivery now has parent link to Executive dashboard, Strategy alignment + Maturity first, Demand and delivery (demand, trace, schedule, plan, WBS, projects, RAID, SOW), Money and contracts (invoices, budgets, TBM). Delivery pipeline (dev_pipe) and Releases still sit in Automation / Service management; exe_dash is both parent and absent from list | core (NAVGRP/NAVORD) |
| W1 | DONE | ppm_wbs: 195 lines, WBS numbers, nested levels, duration, start/finish, actual start/finish, baseline start/finish, variance, %, predecessors, resources, float, critical, cost; Gantt, network, usage, baseline compare, EV tabs; milestones table shows fed-by/feeds. PPMX.addTasks adds line and shows on sheet and person plate. See bug B1 | wbs (B1) |
| O1 | DONE | ppm_sow: Repository, Analyzer (41 lines typed commitment/outcome/measure, standard/variance/new), Terms playbook (AI fallback, legal routing, guardrails), Proposal vs contract (+$62K, promised-not-in-contract), Changes (schedule, scope, assumption, price, SLA) with approvals, Obligations | - |
| T1 | DONE | Four kinds human/AI/contractor/MSP with badges and counts (187/12/16/6) | - |
| T2 | DONE | Photo and agent avatars, kind badges | - |
| T3 | DONE | person360: 35 WORK providers, Sam Patel 21 groups, 92 records | people (see providers gap, B6) |
| T4 | DONE | Filters are dropdown pickers with counts ("All projects 42") | - |
| M1 | DONE | exe_mat: 10 models, ingest, build, models and levels | - |
| M2 | DONE | Objective glide paths, Year 1/3/5, attainment 70%, glide index 93, actions | - |
| M3 | DONE | "What if we need level N": 18 capabilities, 3 models, 7 services, 5 projects, $887K, finish date (small: button says level 5, result level 4) | exec |
| I1 | DONE | Same as R0j | - |
| I2 | DONE | Standards chips on every module | - |
| I3 | DONE | tbm_model: cost flow, unit economics, scaling steps (service desk analysts, gateway units), triggers 52 weeks, AI search and API licensee sliders | - |
| I4 | DONE | svc_360 service page: Technical, Business and strategy, Projects, Stakeholders, Performance, Financial, Impact + Offerings + Linked records | - |
| I5 | DONE | itsm_inc Priority calculator: impact score from service metrics (users, function, availability, revenue, tier, regulatory), urgency bounded by who is choosing, override rights, P1 downgrade second approver | - |
| P1 | DONE | itsm_prb Fishbone and RCA: drawn fishbone with categories, causes, root cause marker | - |
| P2 | DONE | lrHTML on problems, release, SOW etc. | - |
| P3 | DONE | see R0c | - |
| C1 | DONE | Calendar header, legend and grid spaced; legend between | - |
| C2 | DONE | Impact analysis on change (CHG0314 map) | - |
| C3 | DONE | Approval policies tab: 11 policies matching service, CI, class, type, risk, group, env, cost; reorder/copy/delete/new/reset | - |
| C4 | DONE | Calendar legend explains stripe (type), dot (risk), chip style (state), day backgrounds with hover. Note: confirm Omar meant this bar | - |
| R1 | DONE | agile_board (sprints, backlogs, burndown charts, teams, ceremonies), agile_art (PI planning, objectives, system demo, I&A, trains) | - |
| R2 | DONE | Dashboard, pull requests, quality and tests, clash register, exit criteria, go/no-go | - |
| R3 | DONE | Readiness tree and checklist (training, comms, OCM) generated as child tasks and pushed through PPMX.addTasks | - |
| R4 | DONE | Person plate with load %, capacity verdict, peer comparison, performance vs peer median | - |
| V1 | DONE | wf_laptop and wf_onboard (60 steps, 10 subflows) in WFX and visible in flw_design (92 workflows) | - |
| V2 | DONE | Service Offerings tab with sub-offerings (3 offerings, 8 sub-offerings) | - |
| V3 | DONE | REQREG states pending 276 / approved 137 / deployed / decommissioned per offering on service page | - |
| V4 | DONE | tbm triggers create demand via addDemand (see B2) | tbm |
| V5 | DONE | Onboarding workflow with laptop as a subflow | - |
| V6 | DONE | Step cost and SLA/OLA/XLA per step in designer and strips | - |
| V7 | DONE | svc_portal Customer view / Admin view toggle | - |
| V8 | DONE | Item-specific forms with sections and AI-assist (not individually exercised) | - |
| V9 | DONE | Portal My requests: "Waiting for approval - Waiting for Avery Chen", visibleToRequester on WFX | - |
| H1 | DONE | Chat context chips: PAGE, YOU, act on behalf of someone, attach | - |
| H2 | DONE | Dock on all screens, threads, activities, slash commands | - |
| H3 | DONE | "Raise a P2 incident" returns plan, guardrails, Approve and run | - |
| L1 | DONE | Experience (XLA) tab | - |
| L2 | DONE | Designer uses real platform fields | - |
| L3 | DONE | Clock starts/pauses/resumes/stops/resets/cancels conditions | - |
| L4 | DONE | Coverage by process: 72.4% required agreements in place | - |
| L5 | PARTIAL | Process strip with Add a step / Open in Workflow designer on 193 of 319 tabs (60 of 91 first views); svc_sla only 1 of 7 tabs; none on adm_*, bud_*, flw_*, home, inv, tower | sla, core, all |
| G1 | DONE | Rotas per team, service, asset class | - |
| G2 | DONE | Coverage map Daily/Weekly/Hourly | - |
| G3 | DONE | Recommendations tab | - |
| G4 | DONE | Auto-assignment tab; routeBy used by chat, flow, oncall | - |
| G5 | DONE | svc_skills 7 tabs, SKILLSDB | - |
| Q1 | DONE | Portal with illustrations, categories, popular, 18 items | - |
| D1 | DONE | 2,822 CIs: render 1.5s, paged rows. Unverified: CMDB table row click opened no drawer in my generic click test (impact opens via button) | cmdb (check) |
| D2 | DONE | Impact on CI | - |
| D3 | DONE | SolarWinds uptime lab in itom_disc | - |
| D4 | DONE | itom_model: class hierarchy, relationship types, CSDM 5 domains, rules | - |
| E1 | DONE | NOC wall, alert stream, correlation, patterns, false positives, thresholds | - |
| E2 | DONE | itom_run rules + obs_std catalog with SOPs and pre-approvals | - |
| E3 | DONE | itom_slo "what this replaces" | - |
| X1 | DONE | dev_pipe "One flow from idea to production" | - |
| X2 | DONE | plat_map and plat_data | - |
| K1 | DONE | kcs_home lifecycle: article to automated fulfilment | - |
| K2 | DONE | itom_graph Explorer and vault graph both interactive | - |
| Z1 | DONE | ppl_perf | - |
| Z2 | DONE | ppl_cap resource planning across work types | - |
| Z3 | DONE | ppl_jrny boxes assessed for agentic, raise demand | - |
| F1 | DONE | flw_design, decision tables, agentic | - |
| F2 | DONE | flw_appr covers budget, contract, SLA, change, security | - |
| F3 | DONE | flw_asmt gate vs advisory | - |
| Y1 | DONE | 97 chart types, 14 shapes, 11 map types, pictograms | - |
| Standing (R6/7) | PARTIAL | Not re-verified in this audit: demand drag and drop, score hover, fund-to-project, RAID. addDemand/intake wiring verified | - |

Totals: DONE 74, PARTIAL 9, MISSING 0 (83 IDs).

## Cross-module wiring checks
- addDemand: creates D11, visible on port (Priorities, Pipeline, All requests, Intake). OK.
- TBM trigger: demand created ("Add 1 gateway unit to Codification Portal", trig source TBM trigger). OK but B2.
- openImpact from incident, change, problem, release, ci, service: all open drawer with map, cost, SLAs, projects. OK.
- REQREG states on service Offerings tab. OK.
- WFX shows catalog flows (wf_laptop, wf_onboard) in designer. OK.
- SKILLSDB used by routeBy (chat, flow, oncall). OK.
- PPMX.addTasks: used by release readiness, SOW, chat; line appears on WBS sheet and person plate. OK.
- person360: 35 WORK providers; groups from ITSM, PPM, REL, SLA, SOW, SVC, people, mat, obs, oncall, chat. Missing providers: flow approvals/assessments, budget approvals/POs, KB review, training, PTO requests, exec risk mitigations (B6).

## Integration bugs (priority order)
1. B1 (high). Summary-line drawer crashes: data2.js:350 wbsKids maps with undefined `LN` (ReferenceError "LN is not defined", thrown from sumDrawer in screens4.js:149). Repro: go('ims') or go('plan'), Gantt tab, click any phase/summary bar or sheet summary row: drawer never opens. Fix: use wbsLn instead of LN. Owner wbs.
2. B2 (med). TBM demand id mismatch: mod_tbm.js demandForm onSubmit does `r&&r.id` but addDemand returns a string id, so SVCX.demands and T.made record "TBM-1" instead of the real D-number; port and service link do not match. Owner svc360/tbm.
3. B3 (high, perf). itom_evt build 10-24s at scale (first visit, then 0.9s); svc_oncall 2.4-4s even at base size; ppm_proj 2.3-7s at scale; vault 1-3s; SCALE.set 1-2s. All block the UI thread. Owners obs, sla, ppm, know.
4. B4 (med). ppm_* service links call window.openService360, which is never defined, so they fall back to openImpact instead of the service page (mod_ppm.js:126). Owner svc360 (export openService360) or ppm.
5. B5 (med). SCALE does not scale projects (42), incidents (17), changes, demand; "hundreds of projects" and ticket lists at scale are untested by the build. Owner core.
6. B6 (med). person360 plate lacks approvals inbox (flw), assessments, budget approvals, KB reviews, training assignments, PTO. Owners flow, exec, know, people.
7. B7 (low-med). Visual: ims Milestones table giant empty gap before first row; milestone drawer Duration column clipped; metric popover opens at viewport top-left rather than near its chip; Ask Oukala FAB overlaps last table rows. Owners wbs, core.
8. B8 (low). recDrawer in ui.js lists all neighbours as chips (no lrHTML): will bloat at scale. Owner core.
9. B9 (low). Copy: "If 2 configuration items is taken out"; "What if we need level 5?" button leads to level 4 default; "Show 1 more of 1 remaining" wording. Owners svc360, exec, core.
10. B10 (low). R0f: 7 metrics missing remediation, 22 missing unit; 248 of 263 KPI tiles carry no metric chip. Owner all.
