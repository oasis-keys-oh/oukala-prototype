# Tenant data: entity plan and migration batches (PR-32)

Goal (PR-32): every screen shows each sample company's own data. The four tenants are fictional: Atlantic Systems (`core`), Larkspur Health System (`health`), Redstone Resources (`mining`) and Corvane Data Protection (`storage`). This plan carries no status or priority: those live in the Product Backlog. Rules: R16 to R20. Contract: `docs/ARCHITECTURE.md` section 1 (`DATA`). Background: `docs/tenant-seams.md`, `docs/tenant-packs.md`. Per-screen detail: `docs/data/tenant-coverage.csv`.

Labels used here: **prototype fact** (measured on the build at 828e227), **hypothesis** (a proposal to check in a demo), **simulated** (sample figures inside a pack). Tenant isolation stays simulated: one browser page, application code only.

## 1. How this was measured

`tools/scratch/data/instrument.js` opens `build_out/full.html` under the core tenant, settles every lazy registry by opening each screen once, then wraps the Atlantic Systems sample data in place: each array gets read trackers on its indexes and its iteration methods, each record object gets trackers on its fields, each dictionary of records (such as `METRICS`) gets trackers on its keys. It covers 657 data paths (prototype fact): the core constants of `data.js`, `data2.js`, `kit.js`, `kit2.js` and the `screens*.js` files, the data members of `S`, and the record arrays of module namespaces on `window` (`GRCX.controls`, `REQREG`, `ORGX.staff` and so on). It then opens all 196 registered screens with `go(id)` and clicks up to eight tabs on each (743 tab clicks on 148 screens, prototype fact). A read counts for a screen only while that screen's registered render function runs and `S.screen` is that screen, so a tab that navigates away is not charged to it. Each read samples its caller (first stack frame in `full.html`, mapped to a source file by the build markers), which separates reads by the screen's own module from reads by shared helpers. Reads inside the person work index (the `WORK` providers behind `workFor`, used by owner chips and load badges) go to their own bucket. `DATA.get` calls are counted per screen. The run had no page errors (prototype fact).

`tools/scratch/data/entity_map.py` classifies each path as tenant records (an entity), tenant configuration, platform definitions (data model, permission engine, module map, contracts) or view state and caches. `analyze.py` writes the CSV; `batches.py` builds the batch plan; `volumes.js` counts the Atlantic Systems rows behind each path; `redirects.js` lists screens that land elsewhere.

What it does not see (limits of the method):
- Drawers, modals, hover cards and timers after render are not opened. Reads behind them are missing.
- Arrays held inside a module's closure are not reachable from the page. A static scan lists their names per module in the CSV column `module_private_seeds`: 129 of the 181 Atlantic-only screens sit in a module with such arrays (prototype fact). They may hold more sample records than this plan names; each batch checks its own modules for them.
- Index reads beyond row 4,000 of one array are not tracked (method calls still are).
- Two registered screens redirect: `trace` opens `strat_exec`, `plat_data_old` opens `plat_data`. Three render no tenant business data: `log`, `plat_self`, `studio` (prototype fact).

## 2. Counts (prototype fact)

| Measure | Count |
|---|---|
| Registered screens | 196 |
| Mode `data` (read through DATA under another tenant) | 12 |
| Mode `tenant` (follow the tenant another way) | 3 |
| Mode `core` (Atlantic Systems only, labeled under other tenants) | 181 |
| Entities DATA defines today | 17 |
| Entities to add | 58 (50 record entities, 8 configuration entities) |
| Atlantic-only screens that need only entities DATA already defines, with rows in all three packs | 23 |
| Atlantic-only screens that read no tenant business data | 5 |
| Atlantic-only screens by number of entities still missing: 0, 1, 2, 3, 4, 5, 6 or more | 28, 34, 22, 21, 16, 20, 40 |
| Atlantic-only screens that get some rows through another file (a shared helper such as `ui.js` or `kit2.js`, or another module's data store) | 174 |

Pack status today: every entity DATA defines has rows in all three industry packs (health, mining and storage each have 6 projects, 11 metrics, 4 objectives, 8 key results, 8 processes and so on). None of the 58 new entities has rows in any pack. So under health, mining or storage the same 23 screens are ready and the same 153 are not; the CSV columns `ready_health`, `ready_mining`, `ready_storage` say so per screen.

The 23 ready screens: `bc_frame`, `bc_trace`, `dec_cov`, `draw_studio`, `flw_bpmn`, `flw_design`, `guard`, `itom_fin`, `kcs_ask`, `nav_studio`, `plat_build`, `plat_dmap`, `plat_map`, `plat_mcp`, `plat_pmap`, `plat_proc`, `plat_reg`, `plat_retrofit`, `ppm_sow`, `r18_levels`, `scr_map`, `showroom`, `wf_runs`. Most read only metrics, processes and people. Treat "ready" as necessary, not sufficient: their modules may also hold private sample arrays (section 1).

## 3. Entities to add

Columns: **Entity** (proposed DATA name), **Key**, **Core getter source** (the Atlantic Systems paths the core getter should return, with Atlantic Systems row counts, prototype fact), **Screens** (registered screens that read it / Atlantic-only screens that read it / Atlantic-only screens for which it is the only missing entity, prototype fact), **Fields the screens read** (measured, most read first; short keys are the existing Atlantic Systems field names). Class is record unless marked configuration.

### Strategy and value

| Entity | Key | Core getter source | Screens | Fields the screens read |
|---|---|---|---|---|
| risks | id | `S.exe.risks` (7), `GRCX.risks` (12), `S.fin.risks` (5); appetite `GRCX.APPETITE` (10) | 26 / 21 / 0 | id, st, own, p, amt, proj, plan, cat, t, n, ctl, due, il, ii |
| benefits | id | `S.bud.ben` (10), `R17U.gapp` (6) | 9 / 9 / 1 (`bud_ben`) | p, start, drv, real, id, own, conf, n, ty |
| trace_links | id | `NODES` (17), `EDGES` (18) | 9 / 6 / 1 (`kg`) | id, n, t, story, s, amt, owner, c, a |
| scenarios | id | `S.exe.scens` (3) | 4 / 4 / 0 | n, note, id, env, plus one delta field per scenario lever |

### Portfolio and delivery

| Entity | Key | Core getter source | Screens | Fields |
|---|---|---|---|---|
| plan_tasks | id | the WBS behind `TMAP.m` (205 tasks), `BASE.R`, `IDX.map`, `PTC.m`, `IMS_SCEN` (5); seed `WBS_SEED` | 28 / 23 / 2 (`ims`, `plan`) | pct, ms, id, dur, as, af, p, own, n, res, wbs, ef, bdur, es |
| raid_items | id | `PPMRAID` (69) | 20 / 20 / 0 | id, mit, s, p, t, n, own, pr, due, im, d, cost, acc |
| work_items | id | `WORK` (50 providers), `S.ppl.work` (20), `S.ppl.acts` (21), `S.ppl.tix` (3), `S.fab.wi` (2) | 23 / 20 / 0 | kind, tag, due, st, doneOn, owner, n, id, t, state |
| capacity | team | `CAP` (6 teams) | 4 / 2 / 0 | hours per team (a dictionary today) |
| budget_requests | id | `S.br.reqs` (14) | 10 / 9 / 0 | st, amt, type, src, req, proj, stIn, id, t, dupOf, cc |

### Money and contracts

| Entity | Key | Core getter source | Screens | Fields |
|---|---|---|---|---|
| cost_centers | code | `BUDX.DEPTS` (6), `S.ccmap.rows` (9) | 20 / 19 / 2 (`bud_ccmap`, `bud_lines`) | code, units, owner, name, gl, st, note |
| vendors | id | `S.bud.vend` (7), `GRCX.vendors` (7) | 18 / 18 / 1 (`bc_plans`) | id, n, tier, last, cat, del, qual, resp, own, risk, data |
| ledger_entries | id | `S.bud.led` (5), `SPEND30` (30 days), `PROV_SHARE` (4) | 16 / 14 / 0 | st, amt, t, line, p, req, id, apr, why, d, ai, num |
| contracts | id | `S.bud.con` (9) | 12 / 11 / 0 | rn, id, n, v, ntc, tcv, dec, co, ty, own, ann, line, s, e |
| purchase_orders | id | `S.bud.po` (13) | 10 / 10 / 0 | inv, rec, st, ord, id, v, paid, d, date, line |
| timesheets | id | `S.r15t.sheets` (36), expense receipts `S.r15t.rcpts` (20), requests `S.r15t.reqs` (15) | 6 / 6 / 0 | id, status, po, desc, date, week, late, person, rows, amt, approver |
| approval_policies (configuration) | id | `S.bud.doa` (6), `S.bud.crules` (10), `APPR.state.rules` (10), `APPR.state.binds` (14), `S.br.rules` (5), `S.bud.pol` (2), `S.rules` (4) | 25 / 25 / 2 (`r16h_status`, `r16h_rules`) | role, id, max, cat, why, min, name, apg, kind, rule |
| finance_policies (configuration) | id | `S.fin.rules` (64), `S.fin.evreg` (19), `S.fin.sources` (8), `S.fin.colors` (7), `S.fin.drv` (6), `S.fin.pols` (6), `S.fin.ladder`, `S.fin.rel`, `S.fin.splits`, `S.fin.log` | 10 / 10 / 2 (`fin_spend`, `fin_rules`) | id, name, st, color, n, src, fund, use, avail, gaap, auth |

### Operations and service

| Entity | Key | Core getter source | Screens | Fields |
|---|---|---|---|---|
| services | id | `SVCREG` (16), offerings `SVCX.off` (54) | 38 / 34 / 1 (`tbm_model`) | id, n, tier, owner, avail, cost, offerings, obj, sme, users, tgt, deps, processOwner |
| config_items | id | `CIREG` (141), relations `CIEDGE` (203), assets `SVC_ASSETS` (140), `CIOWN.state.hist` | 27 / 27 / 3 (`itom_model`, `bc_tiers`, `svc_asset`) | id, name, svc, cls, class, owner, status, env, isSvc, grp, ip, svcLayer, model |
| changes | id | `S.itsm.chg` (24), `S.itsm.cablog` (3) | 21 / 21 / 0 | id, start, st, svc, t, type, end, cis, win, req, stages, env, cost |
| knowledge_articles | id | `KCS_TEST.ART` (18) and its satellites (`PR`, `SU`, `UNANS`, `TOPICS`, `SVCS`, `SRC`, `SUGGEST`), `S.kcsx.imp`, `S.kcsx.runs` (40) | 17 / 17 / 1 (`kcs_test`) | st, id, rev, name, t, s, type, svc, status, risk, purpose, cases, owner |
| incidents | id | `S.itsm.inc` (17) | 15 / 15 / 1 (`bc_decl`) | st, id, svc, t, age, grp, prb, pausedH, resH, respH, own, caller |
| service_requests | id | `REQREG` (240, same rows as `SVC3B.REQS`), `S.svc.dem` (4) | 12 / 12 / 0 | id, state, item, requester, service, onBehalfOf, created, sl, cost, slaTgt |
| catalog_items | id | `SVC3B.CAT` (16) with `GRPS`, `V`, `TY`, `CSP`, `RELN`; portal guides `OGX.guides` (5), `OGX.lanes` (12) | 11 / 11 / 0 | n, id, parts, blurb, cat, short, svc, off, vars, pr, appr, est |
| monitors | id | `S.obs.rules` (12), `S.obs.sc` (15), `S.obs.exec` (30), `S.obs.ar`, `S.obs.syn`, `S.obs.fpMark`, `S.obs.dashes`, `S.obs.wins` | 11 / 11 / 0 | n, id, kind, on, mode, rule, lvl, risk, cis, type, tgt |
| problems | id | `S.itsm.prb` (6), known errors `S.itsm.ke` (5) | 10 / 10 / 0 | st, id, t, svc, workaround, cause, sym, users, owner, chg, kb |
| service_levels | id | `S.obs.slos` (8), `SLAX.SEED` (26) | 9 / 9 / 0 | id, n, svc, good, tgt, kind, target, goal, party, own, sli |
| events | id | `EVENTS.log` (137), `SVCEVT` (12), `LIVEEVENTS` (6) | 7 / 7 / 1 (`svc_notify`) | id, n, src, sev, to, at, payload, outcomes, actor |
| rotas | id | `S.oc.rotas` (10), escalations `S.oc.esc` (5) | 6 / 6 / 0 | n, layers, scope, target, id, tier, rota, sla |
| ops_automations | id | `S.itom.runs` (42), `S.itom.aud` (48), `S.itom.srcs`, `S.itom.prec`, `S.itom.rej`, `S.itom.idr`, `S.itom.tasks`, `S.itom.camps` | 2 / 2 / 0 | id, st, n, src, at, t, due, cls, dep |
| service_tasks | id | `S.itsm.tasks` (1) | 1 / 1 / 0 | id, done, t, who, due, from |
| service_policies (configuration) | id | `S.itsm.apol` (11), templates `S.itsm.tpl` (6), `S.itsm.ovlog` | 7 / 7 / 0 | id, n, cond, on, st, svc, by, role, why, appr |

### Risk, control and AI

| Entity | Key | Core getter source | Screens | Fields |
|---|---|---|---|---|
| agents | id | `AGENTS` (6), `S.agents` (6), `S.ppl.agents` (11), `R18.access` (16), `R18.spend` (8), `R18.kill` (3), `CONTRACT.agents` (5) | 31 / 25 / 4 (`flw_agent`, `plat_contract`, `ai_runtime`, `agent_defs`) | n, st, id, spend, model, runs, act, owner, auto, tools, purpose |
| access_grants | id | `S.adm.roles` (11), `S.r15i.grants` (4), `S.r15i.reqs` (3), `S.r15i.runs` (2) | 17 / 17 / 0 | id, caps, n, person, why, exp, at, st, who, days |
| audit_log | id | `AUDIT` (838), `STORE.log` (530), `S.ownx.log` (211), `S.r16g.hist` (16) | 16 / 16 / 2 (`loop`, `plat_store`) | t, by, id, prev, seq, op, entity, hash |
| controls | id | `GRCX.controls` (29), tests `GRCX.tests` (17), attestations `GRCX.att` (12), `S.adm.ctl` (15) | 14 / 14 / 0 | st, last, own, res, id, bak, maps, freq, ref, ev, fw |
| audits | id | `GRCX.audits` (4), findings `GRCX.findings` (13) | 13 / 13 / 0 | st, id, due, reqs, t, own, sev, firm, ctl, bak, src, risk |
| policies (configuration) | id | `GRCX.policies` (9), exceptions `GRCX.exceptions` (8), `S.adm.pol` (6), retention `S.adm.ret` (7), holds `S.adm.holds` (1) | 14 / 14 / 0 | st, id, req, exp, t, nextRev, n, own, appr, vers, eff, bak |

### People and organization

| Entity | Key | Core getter source | Screens | Fields |
|---|---|---|---|---|
| role_assignments | id | `S.r15e.roles` (230), `S.ownx.asg` (217), role holders `R15E.roles` (10) | 55 / 52 / 4 (`flw_asmt`, `inbox`, `agile_board`, `agile_art`) | owner, backup, holders, runtime, id, name, tier, basis |
| org_units | id | `ORGX.domains` (46) | 25 / 24 / 0 | id, label, aliases, ownerId, backupId |
| teams | id | `TEAMS` (12) | 20 / 19 / 0 | id, n, mgr |
| skills | id | `SKILLS` (293 person-skill rows), `S.skl.custom` (71), agent skills `S.kcsx.skills` (10), scale `SKILLSDB` | 11 / 11 / 0 | id, n, cat, skill, person, level, owner, status |
| learning | id | courses `S.ppl.courses` (10), enrollments `S.ppl.enr` (39), paths `S.ppl.paths` (4), `S.ppl.xapi` (6) | 7 / 7 / 0 | t, id, cat, aud, mand, due, mins, cert, pass, recur |
| leave | id | `S.ppl.leave` (35) | 7 / 7 / 0 | id, who, from, to, st |
| rooms | id | `S.ppl.rooms` (6), bookings `S.ppl.bk` (219) | 6 / 6 / 0 | id, n, cap, eq, room, d, s, e, att |
| forums | id | `S.ppl.forums` (4) | 4 / 4 / 0 | id, n, cadence, next, charter, chair, members, quorum |

### My work

| Entity | Key | Core getter source | Screens | Fields |
|---|---|---|---|---|
| meetings | id | `MEETINGS` (47), `MEETX.series` (10), `MEETX.MON` (12), `EXTRACTED` (5), `S.ppl.agendas`, `S.ppl.minutes` | 13 / 13 / 1 (`fo`) | id, t, type, s, sum, d, dt, inv, n, rev, att, st |
| decisions | id | `MEETX.decs` (35), `R17Q_DATA.decisions` (67), `S.fin.decs` (10), `S.ppl.decs` (10), `OGX.decisions` (9) | 12 / 12 / 0 | id, t, why, st, rat, dt, by, mid, raid, alts |
| action_items | id | `MEETX.acts` (120) | 7 / 7 / 0 | due, st, mid, own, t, id, closed, raid, carry, pri |
| conversations | id | `S.chx.threads` (1) | 4 / 4 / 0 | id, title, msgs, pinned, upd, mode, ctx |

### Transformation

| Entity | Key | Core getter source | Screens | Fields |
|---|---|---|---|---|
| capabilities | id | `S.mat.xcaps` (305), horizons `MAT.HZ`, `MAT.HW` | 15 / 11 / 0 | id, name, cur, model, owner, t, b0, svcs, objs, root, eff |
| applications | id | `S.exe.apps` (15) | 9 / 7 / 0 | id, n, cat, ven, life, users, own, cost, val, hlt |
| tech_debt | id | `S.debt.tasks` (2) | 2 / 2 / 0 | id, title, kind, due, owner |

### Build and admin

| Entity | Key | Core getter source | Screens | Fields |
|---|---|---|---|---|
| builds | id | `S.gate.apps` (14), levels `R18.LEVELS` (5) | 18 / 17 / 0 | id, n, status, builder, tier, owner, reads, writes, purpose |
| tenant_settings (configuration) | id | `S.adm.*` (flags, models, seats, tokens, packages, kits, languages, routes, reviews), `S.admx.forms` (185 fields), `S.r16g.fields` (43) | 16 / 16 / 2 (`adm_env`, `adm_meter`) | n, id, st, on, name, env, bought, assigned, enabled, entity, field |
| connectors (configuration) | id | `S.fab.conns` (19), `S.fab.maps` (38), `S.fab.runs` (176), `S.fab.events` (340), `S.flw.conns` (13), `S.flw.mcps`, `S.flw.hooks`, `S.flw.keys`, `S.flw.dlq` | 12 / 12 / 1 (`flw_hub`) | status, id, kind, conn, tier, ents, name, owner, err |
| reports (configuration) | id | `S.r15r.reports` (3), `S.r15r.scheds`, `S.r15r.runs`, `S.r16d.charts` (5), `S.viz.lib` (19), `S.viz.dash` (3) | 6 / 6 / 1 (`kcs_viz`) | owner, name, id, title, spec, measure, dim, channel |
| decision_tables (configuration) | id | `S.flw.dmn` (4) | 2 / 2 / 1 (`flw_dmn`) | id, name, rows, inputs, outputs |

The entities DATA already defines are read widely and need no new definition: metrics (161 Atlantic-only screens), processes (150), people (118), projects (32), budget_lines (30), objectives (22), demand (18), invoices (13), workflows (12), journeys (5), key_results (4) (prototype fact). Two gaps inside them: the `objectives` core getter returns `NODES` objectives (2) while the strategy screens read `S.exe.objs` (5) and `EXE.E`; and `people` has three more Atlantic Systems sources the screens read (`ORGX.staff` 74, `PEOPLE` 16, `S.ppl.people` 39). The batch that owns the reader aligns them; the core snapshot must not lose ids.

Platform definitions and view state are not tenant data and stay as they are: the permission engine (`PERM`, `S.r16g.rules`), the data model registry (`DATAMODEL`), lineage and link caches (`LIN`, `LINKS`), standards (`STD`), the module map (`MODMAP`), feature contracts (`CONTRACT`), screen helpers (`MPOPT`, `BTC`, `S.bt`, `S.lr`), calendars (`WD`, `MONTHS`, `HOLIDAYS`) and the round-numbered namespaces (`R15`, `R16M`, `R17P`, `R18` constants and so on).

## 4. Record volumes per pack (hypothesis)

Demo scale for one fictional company of about 25 named people and six projects, enough that lists scroll, filters return something and charts are not flat. Atlantic Systems today is the prototype fact for comparison. Enterprise scale (`SCALE.set(true)`) stays an Atlantic Systems-only generator; packs do not need it.

| Entity | Atlantic Systems today (prototype fact) | Each pack (hypothesis) |
|---|---|---|
| risks | 24 across three stores | 16, of which 6 enterprise, 6 control risks, 4 finance |
| benefits | 10 | 8, one or two per project |
| trace_links | 17 nodes, 18 edges | generated from the pack's own objective, project, budget line and invoice links (about 20 nodes); no hand rows |
| scenarios | 3 | 3 |
| plan_tasks | 205 | 60 (about 10 per project, with 6 milestones) |
| raid_items | 69 | 30 (5 per project) |
| work_items | 41 rows plus 50 providers | 30 |
| capacity | 6 teams | 6 teams |
| budget_requests | 14 | 10 |
| cost_centers | 6 departments, 9 mappings | 8 |
| vendors | 7 | 8 (shared by finance and third-party risk) |
| ledger_entries | 5 entries, 30 days of spend | 40 entries, 30 days of spend |
| contracts | 9 | 8 |
| purchase_orders | 13 | 10 |
| timesheets | 36 sheets, 20 receipts, 15 requests | 30 sheets, 10 receipts, 6 requests |
| approval_policies | 6 delegation levels, 10 control rules, 14 group bindings | 6, 8, 10 |
| finance_policies | 64 rules, 19 event types | 20 rules, 10 event types |
| services | 16 | 10 |
| config_items | 141 items, 203 relations, 140 assets | 80 items, 120 relations, 60 assets |
| changes | 24 | 15 |
| knowledge_articles | 18 | 18 |
| incidents | 17 | 20, including one major incident |
| service_requests | 240 | 60 |
| catalog_items | 16 | 14 |
| monitors | 12 rules, 15 scorecards, 30 executions | 10, 8, 20 |
| problems | 6 problems, 5 known errors | 6, 4 |
| service_levels | 8 objectives, 26 agreements | 8, 12 |
| events | 137 logged, 12 service events | 40, 10 |
| rotas | 10 rotas, 5 escalations | 6, 4 |
| ops_automations | 42 runs | 20 |
| service_tasks | 1 | 6 |
| service_policies | 11 policies, 6 templates | 8, 4 |
| agents | 6 to 11 depending on store | 6, matching the agents in the pack's people |
| access_grants | 11 roles, 4 grants | 8 roles, 10 grants |
| audit_log | 838 | 150, generated from the pack's other rows |
| controls | 29 controls, 17 tests, 12 attestations | 20, 12, 8 |
| audits | 4 audits, 13 findings | 3, 10 |
| policies | 9 policies, 8 exceptions | 8, 5 |
| role_assignments | 230 role holders, 217 ownership assignments | 60, 50 |
| org_units | 46 | 15 |
| teams | 12 | 8 (from the pack's org functions) |
| skills | 293 person skills | 80 (about 3 per person) |
| learning | 10 courses, 39 enrollments | 8, 40 |
| leave | 35 | 20 |
| rooms | 6 rooms, 219 bookings | 5, 40 |
| forums | 4 | 4 |
| meetings | 47 | 25 |
| decisions | 131 across five stores | 30 |
| action_items | 120 | 50 |
| conversations | 1 | 3 |
| capabilities | 305 | 40 (two levels) |
| applications | 15 | 12 |
| tech_debt | 2 | 4 |
| builds | 14 | 8 |
| tenant_settings | about 60 settings, 185 form fields | the platform defaults with the tenant's own seats, models and flags (about 30 rows); form fields stay platform defaults |
| connectors | 19 connections, 38 mappings | 8, 16 |
| reports | 3 reports, 19 library charts | 4, 8 |
| decision_tables | 4 | 3 |

Every pack row follows the generator rules already in force: an owner and a different backup who are people in the pack (R12), agents and robots with a human sponsor, no em dash, no banned name, no other tenant's organization name, and no person sharing a full name with Atlantic Systems.

## 5. Vocabulary (DATA.term keys to add, hypothesis)

The 15 keys in `docs/tenant-packs.md` section 4 stay. Proposed new keys name each tenant's own business object; IT nouns that are right in every industry (incident, change on an IT system, ticket) are left alone, as that document already says.

| Key | Default (Atlantic Systems) | Larkspur Health System | Redstone Resources | Corvane Data Protection |
|---|---|---|---|---|
| project | project | initiative | project | program |
| change | change | change | management of change | change |
| problem | problem | root cause review | recurring failure | problem |
| config_item | configuration item | clinical system component | control system component | platform component |
| knowledge_article | knowledge article | clinical protocol | standard work procedure | knowledge base article |
| catalog_item | catalog item | service offering | work request type | support offering |
| alert | alert | clinical alarm | process alarm | health alert |
| service_level | service level | access standard | production target | service level agreement |
| rota | on-call rota | staffing roster | shift roster | on-call rota |
| risk | risk | patient safety risk | material unwanted event | risk |
| control | control | compliance control | critical control | control |
| audit | audit | accreditation survey | safety audit | audit |
| finding | finding | survey finding | audit finding | finding |
| policy | policy | clinical policy | site standard | policy |
| regulator | regulator | accreditor | mine safety regulator | data protection authority |
| contract | contract | supplier contract | supply agreement | contract |
| cost_center | cost center | department | cost center | cost center |
| purchase_order | purchase order | requisition | purchase order | purchase order |
| budget_request | budget request | capital request | authorization for expenditure | budget request |
| capability | capability | clinical capability | operating capability | product capability |
| application | application | clinical application | operational system | product system |
| course | course | competency module | induction module | course |
| meeting | meeting | safety huddle | pre-start meeting | stand-up |
| org_unit | department | department | operation | business unit |
| plan_task | task | task | work package | task |

Plural forms follow the existing `[singular, plural]` pairs. Defaults go into `VOC0` in `mod_s_tenant.js`; tenant words go into each spec's `vocabulary`.

## 6. Migration plan in batches

Each source file appears in exactly one of B2 to B10, so those batches never edit the same file twice and can run in parallel once their prerequisites are merged. B0 runs alone before them; B1 touches only specs and generated packs. Within a batch, the lanes listed are independent groups of files and can be split across streams. The grouping comes from `tools/scratch/data/batches.py` (output `batches.json`): a screen's module set is the file holding its render function plus the files that read rows for it; cross-cutting helpers (files that read rows for 20 or more screens they do not define, plus `mod_s_owner`, which resolves owner chips on 14) form B2; data owners (8 to 19 foreign screens) do not link their readers, because switching an owner's accessors to DATA unlocks the readers without editing them; aggregator screens (rows from 5 or more other modules) move with their own module but only become fully tenant-aware after their sources.

Rules for every screen batch: read through `DATA.get` or through the data owner's accessor that now reads `DATA.get`; register the screen's mode from its own module (`DATA.screen(id, {mode: "data", entities})`), never from `mod_s_tenant.js`; use `DATA.term` for the nouns in section 5; leave Atlantic Systems output unchanged (`tools/tests/tenant.js` core snapshot, `smoke.js`, `tabs.js`); never fill a gap with Atlantic Systems rows (R18); add no lines to `tools/tests/run.sh` (B0 adds one generic check that covers every screen in mode `data`).

| Batch | Name | Depends on | Files | Screens (Atlantic-only today) |
|---|---|---|---|---|
| B0 | Entity layer | none (serial, first) | new `src/mod_s_tenant_entities.js` (58 `DATA.define` calls with core getters over the sources in section 3), `src/modules.json`, `src/mod_s_tenant.js` (vocabulary defaults only), `tools/generators/gen_pack.py` (row rules for the new entities), `tools/tests/tenant.js`, `tools/tests/tenant_core_snapshot.json`, one new `tools/tests/tenant_screens.js` and its line in `run.sh`, `docs/tenant-packs.md` | none |
| B1 | Pack content, three lanes | B0 | lane health: `tools/generators/gen_pack_specs/health.json`, `src/mod_s_pack_health.js`; lane mining: the mining pair; lane storage: the storage pair | none (fills the rows of section 4) |
| B2 | Cross-cutting helpers | B0 | `ui.js`, `kit2.js`, `data.js`, `data2.js`, `mod_org.js`, `mod_zlink.js`, `mod_s_owner.js`, `mod_plat_links.js`, `mod_plat_proclib.js`, `mod_r15e_data.js`, `mod_r16j_h_metrics.js` | 4 (`plat_dmap`, `plat_pmap`, `plat_proc`, `zl_conn`); unlocks the metric, people and process reads that most screens make through these files |
| B3 | Strategy and value | B0 | 17 files | 15 of 19 |
| B4 | Portfolio and delivery | B0 | 5 files | 11 of 12 |
| B5 | Money and contracts | B0 | 9 files | 16 of 16 |
| B6 | Operations and service | B0 | 19 files | 44 of 44 |
| B7 | Risk, control and AI | B0 | 12 files | 22 of 22 |
| B8 | People, organization and my work | B0 | 8 files | 15 of 17 |
| B9 | Build, admin, transformation and showroom | B0 | 40 files | 40 of 47 |
| B10 | Aggregator screens and adapter clean-up | B2 to B9 | 26 files | 14 of 15 |

Order: B0 alone; then B1 (three lanes), B2 and B3 to B9 all in parallel (no shared files); then B10. A screen batch can merge before B1, because its screens then show recorded gaps under the industry tenants (R18), and show rows as soon as B1 lands. Totals: 147 files, 196 screens, 181 of them Atlantic-only today (prototype fact). After each merge the orchestrator reruns `gen_scrmap.py` and the IA inventory's `tenant_mode` column is regenerated once, in B10.

### B2 Cross-cutting helpers
- Lane `ui.js`, `mod_r15e_data.js`, `mod_r16j_h_metrics.js`: metric chips and metric panels on 125 to 153 screens read `METRICS`; switch to `DATA.get("metrics")`.
- Lane `kit2.js`, `data.js`, `data2.js`: people (`DIR`) on 114 screens, processes (`PROC.defs`) on 123, the person work index (`WORK`, `workFor`), plan indexes (`TMAP`, `IDX`, `PTC`, `BASE`) on 27, and the `N()` node lookup. Core files: the orchestrator reviews this lane.
- Lane `mod_org.js`, `mod_s_owner.js`, `mod_zlink.js`: org staff and domains (50 screens), owner chips (people and teams), role holder resolution (49 screens); also `zl_conn`.
- Lane `mod_plat_links.js`, `mod_plat_proclib.js`: process panels on 28 screens; also `plat_dmap`, `plat_pmap`, `plat_proc`.

### B3 Strategy and value
- `mod_exec`: `exe_dash`, `exe_strat`, `exe_risk`, `exe_apps`, `exe_board`, `exe_scen` (risks, applications, scenarios, capabilities; aligns the `objectives` getter with `S.exe.objs`).
- `mod_r16k_trace`, `screens1.js`: `trace` (redirect), `inv`, `strat_exec`, and `home` (aggregator, last to be fully tenant-aware).
- `mod_r15f3_report`, `mod_r16j_e_dash`, `mod_r16j_f_charts`: `r15_sem`, `r15_rpt`, `r16j_dash`.
- `mod_r17u_b_ben`, `mod_r17u_c_dsrc`, `mod_r17u_d_dash`: `bud_ben`, `r17u_dash`.
- `mod_r18h_spend`, `mod_r29_bst`, `mod_r32_num_b`: `r18_spend`, `bst`.
- `mod_r18g_levels`: `r18_levels`. `mod_r25_a_data`, `mod_viz`, `mod_viz2`: `kcs_viz`. Data owner without screens: `mod_r15d_ai`.

### B4 Portfolio and delivery
- `mod_ppm`, `mod_wbs`, `screens4.js`: `port`, `ims`, `plan`, `log`, `ppm_proj`, `ppm_raid`, `ppm_wbs` (plan_tasks, raid_items, capacity, skills).
- `mod_rel`: `itsm_rel`, `agile_board`, `agile_art`.
- `mod_r15f3_time`: `r15_time`, `r15_p2p` (timesheets, purchase orders).

### B5 Money and contracts
- `mod_budget`: `bud_over`, `bud_model`, `bud_ven`, `bud_doa` (data owner for approval policies, ledger, vendors, contracts, purchase orders, benefits on 18 other screens).
- `mod_plat_fin2`: `fin_budget`, `fin_gates`, `fin_alloc`, `fin_rules`. `mod_plat_fin`: `fin_model`, `fin_color`, `fin_spend`.
- `mod_budget3`: `bud_req`. `mod_r15b_ccmap`: `bud_ccmap`. `mod_r15b_lines`: `bud_lines`. `mod_sow`: `ppm_sow`. `mod_tbm`: `tbm_model`. Data owner without screens: `mod_r17u_a_core`.

### B6 Operations and service
- `mod_itsm`: `itsm_inc`, `itsm_prb`, `itsm_chg`, `itsm_mi`, `itsm_home` (incidents, problems, changes, service tasks, service policies).
- `mod_itom`: `itom_cmdb`, `itom_model`, `itom_graph`, `itom_disc`, `itom_health`, `itom_fin` (config_items, ops_automations).
- `mod_devops`, `mod_obs`, `mod_plat_atlas`, `mod_plat_cover`, `mod_plat_modmap`: `dev_pipe`, `itom_dev`, `plat_map`, `plat_data`, `plat_data_old`, `itom_evt`, `obs_dash`, `itom_slo`, `itom_run`, `obs_std` (monitors, service_levels).
- `mod_svc`, `mod_svc3`, `mod_r16i_portal`, `mod_plat_contract`: `svc_cat`, `svc_req`, `svc_portal`, `svc_asset`, `svc_notify`, `svc_guides`, `plat_contract`, `plat_retrofit` (catalog_items, service_requests, events).
- `mod_kcs`: the seven `kcs_*` screens (knowledge_articles, skills).
- `mod_oncall`, `mod_sla`: `svc_oncall`, `svc_skills`, `svc_sla` (rotas, leave, service_levels).
- Single-file lanes: `screens3.js` (`kg`), `mod_chat` (`chat_home`), `mod_kgx` (`vault`), `mod_r16h_b_ci` (`r16h_ci`), `mod_svc360` (`svc_360`).

### B7 Risk, control and AI
- `mod_r15f2_b_grc` with its data owner `mod_r15f2_b_data`: the eight `grc_*` screens (risks, controls, audits, policies, vendors).
- `mod_r16l_b_ui`, `mod_r16l_c_cal`, `mod_r16l_d_plans`, `mod_r16l_e_trace` with data owner `mod_r16l_a_data`: the eight `bc_*` screens. These are separate files and can be split; the data owner goes with whichever lane takes `bc_home`.
- Single-file lanes: `mod_r15d_facts` (`r15d_agents`, `r15d_facts`), `mod_r15f1_c_agent` (`ai_runtime`), `mod_r15f3_iam` (`r15_iam`), `mod_s_guard` (`guard`), `mod_s_steps` (`agent_defs`).

### B8 People, organization and my work
- `mod_people`: `ppl_org`, `ppl_cap`, `ppl_train`, `ppl_av`, `ppl_meet`, `ppl_perf`, and `ppl_jrny` (aggregator, mode `tenant` today).
- `mod_meet`, `mod_meet2`: `meet_hub`, `meet_act`, `meet_dec`, `meet_series` (meetings, decisions, action_items).
- `screens2.js`: `fo`, `tower`, `metrics` (already an adapter screen), `loop`.
- `mod_inbox` (`inbox`), `mod_r15d_front` (`r15d_firstweek`). Data owners without screens: `mod_r30_jov`, `mod_r31_jxr`.

### B9 Build, admin, transformation and showroom
- `mod_flow`: the seven `flw_*` screens (approval_policies, connectors, decision_tables, agents).
- `mod_admin`, `mod_r16j_d_admin`: the six `adm_*` screens (tenant_settings, policies, controls, access_grants).
- `mod_r18c_builds`, `mod_r18d_access`, `mod_r18e_lens` with data owner `mod_r18_0_core`: `r18_builds`, `r18_app`, `r18_mature`, `r18_debt`, `r18_access`, `r18_strategy` (builds, agents).
- `mod_plat_gate` (`plat_gate`, `plat_mcp`), `mod_mat` (`exe_mat`), `mod_plat_debt` (`plat_debt`), `mod_plat_fabric` (`plat_fab`), `mod_r16g_a_perm` with `mod_r16g_c_admin` (`r16g_perm`), `mod_r16h_0_core` with `mod_r16h_c_groups` (`r16h_groups`), `mod_r16h_a_status`, `mod_r16h_d_rules`, `mod_r17s_a_engine` with `mod_r17s_c_ui` (`r17s_rules`), `mod_r15e_ntf` with `mod_zevt` (`zevt`), `mod_r15f1_a_store` (`plat_store`). Data owners without screens: `mod_own`, `mod_r15e_roles` (role assignments).
- Little or no tenant data, a check and a mode registration only: `mod_dec`, `mod_draw2`, `mod_nav` with `mod_zsearch`, `mod_own2`, `mod_plat_build`, `mod_plat_registry`, `mod_r15f1_b_wf`, `mod_r25_b_studio`, `mod_r28_od2` (`orgdesign`, mode `tenant`), `mod_r32_scrmap_b_screen`, `mod_r33_showroom` with `mod_s_showroom_lens`, `mod_selfbuild`.
- `mod_s_tenant.js` and `platform.js` are listed here only so no other batch claims them: `tn_projects`, `tn_people`, `tn_metrics`, `tn_admin` already read through DATA; no work beyond what B0 does.

### B10 Aggregator screens and adapter clean-up
- Aggregators whose module has no other batch: `org_chart` (`mod_org2`), `orgassist` (`mod_r31_jzorg`), `r15d_evidence`, `rec_shell` (`mod_r15f2_c_adopt`), `r15_mobile`, the six `r16m_*` screens (`mod_r16m_*`), `r17p_tour`, `r17q_value`, `r17q_thinking`, `r18_lens` (`mod_r18k_biz`). They read rows through five or more other modules, so they go last, when those sources read through DATA.
- Readers without screens that only serve aggregators: `mod_org3`, `mod_org5`, `mod_r15d_ask`, `mod_r16j_g_contract`, `mod_r16m_a_core`, `mod_r17p_c_moments`, `mod_r17q_b_core`, `mod_r17t_a_actor`, `mod_r18f_wire`, `mod_r31_jx`, `mod_zlink_r15`.
- `mod_s_tenant_screens.js`: delete each adapter whose owning module now reads DATA itself (`metrics`, `exe_strat`, `strat_exec`, `port`, `bst`, `exe_dash`, `exe_mat`, `r18_mature`), so nothing renders twice.
- Regenerate `docs/ia/screen-inventory.csv` `tenant_mode` and rerun the instrument to confirm that no screen in mode `data` reads an Atlantic Systems global directly.

## 7. Rerun

```
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install
python3 src/build.py --full --out "$PWD/build_out"
node tools/scratch/data/instrument.js build_out tools/scratch/data/reads.json     # about 3 minutes
node tools/scratch/data/volumes.js build_out tools/scratch/data/reads.json tools/scratch/data/volumes.json
python3 tools/scratch/data/analyze.py tools/scratch/data/reads.json docs/data     # writes tenant-coverage.csv and summary.json
python3 tools/scratch/data/batches.py docs/data/tenant-coverage.csv tools/scratch/data/reads.json
```

A rerun after each batch shows progress: a migrated screen moves from `core` to `data`, its `core_paths_read` should shrink to platform definitions, and its `ready_*` columns turn to `yes` once B1 has filled the pack.
