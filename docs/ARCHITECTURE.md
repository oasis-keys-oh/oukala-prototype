# Falconaire prototype: architecture and build orchestration

Describes how the backlog is built. It carries no status or priority: those live only in the Product Backlog (vault note). Rules: `docs/PLATFORM_RULES.md`.

## 1. The foundation: `src/platform.js`

One core file, loaded first (before data.js and every other core file), so core files and modules can use `U` and `HOOKS` at load. Every name is a property of `window`, never a top-level `const`, because all modules are concatenated into one script and 20 of them already declare their own `slug`, `pct` or `uid`. `tools/tests/platform.js` is the contract test; it runs in `npm test` and must stay green.

| Namespace | Rule | Backlog | Contract |
|---|---|---|---|
| `U` | R10 | CL-31, CL-34, CL-42 | `U.esc money moneyShort pct clamp slug uid today todayDate fmtDate TODAY_ISO` and `U.store.get/set/del` (guarded browser storage, keys listed for demo reset). Fixed demo date 2026-10-06. |
| `HOOKS` | R40 | CL-35 | `HOOKS.on(name, fn, {order, id})` returns `off`; `HOOKS.run(name, ...args)`. Names: `beforeGo(screen,arg)`, `beforeRender(screen)`, `afterRender(screen)`, `afterOpenDrawer(el)`, `tenantChange(tenant,prev)`, `tenantDenied(tenant,prev)`. Fired from `ui.js` `go`, `render`, `openDrawer` and from `DATA.setTenant`. New code never wraps `render`, `go` or `openDrawer`. |
| `DATA` | R16 to R20 | CL-55, CL-56, DC-03, DC-09, DC-31 | `define(entity,{core,key,label})`, `pack(tenant,{entity:rows},info?)`, `get(entity,{tenant,where})`, `byId`, `tenant()`, `setTenant(id)` (returns true or false; a denied switch fires the `tenantDenied` hook), `version`, `on("change",fn)`, `touch()`, `entities()`, `gaps()`; tenants: `addTenant(id,info)`, `tenants()`, `tenantInfo(id)`, `guard(fn)`, `allowed(id)`; screens: `screen(id,{mode,entities,note})`, `screens()`, `screenMode(id)` (mode data, tenant or core; core screens are labeled Meridian-only under other tenants); packs: `validate(tenant)`, `snapshot(tenant)`. Demo identities and memberships: `IDENT` (mod_s_tenant.js), default deny. A non-core tenant with no rows for an entity gets `[]` and a recorded gap, never Meridian rows (R18). `SCN.set` calls `DATA.setTenant`. |
| `STEPMODE` | R21 to R24 | CL-58, CL-72 | `MODES {human, robot, agent, gate}`, `ALIAS` (`fn`, `function`, `auto`, `automatic` map to `robot` until CL-72 classifies them), `of`, `label`, `kinds`, `pill`. Colors: classes `sm-human sm-robot sm-agent sm-gate` and tokens `--sm-*` (mod_s_steps.css). Step helpers and the agent definition card: `window.STEPKIT` (mod_s_steps.js: `needsTrigger`, `ensureTrig`, `trigChip`, `agentDef`, `openAgent`, `robotTest`); never use `window.STEPS`, which core data declares. "Automatic" and "Function" never appear as a step kind. |
| `TRIGGERS` | R21a | CL-73, CL-74 | `CATALOG` of five: metric threshold, schedule, process step, event, record change. `list`, `get`, `label`. |
| `CHATADDR` | R13a | CL-54 | Addresses `person:` `team:` `function:` `record:<type>:<id>` `process:<P-014>` `agent:`. `fmt`, `parse`, `open(addr,{record})`; `open` delegates to `CHATX.openAddress(addr,{record,open})`, which returns the thread or null (one thread per address; record context kept; visibility through `CHATX.access(t)` returning `{ok,why,simulated:true}` and `CHATX.canSee(t)`; `CHATX.findAddress`). Approval groups use `team:<apg id>`. |
| `ownerChip(name,{record,role,size})` | R12, R13 | CL-53 | Markup with `data-owner`, `data-owner-rec`, `data-owner-role` on top of `pchip`. Behavior (Person 360, Message, Open chat on this record; group and agent variants; "No backup" badge) is delegated on `[data-owner]` (mod_s_owner.js, `window.OWNERX`), which also adds `data-owner-kind` and `data-owner-addr`. `ownerChip.pair(owner,backup,{record,ownerRole,backupRole})` and `ownerChip.noBackup(owner,backup)` show the "No backup" badge. Robots pass `{kind:"robot",sponsor}`. |

Changing a contract: only the orchestrating session edits `platform.js`, except that the tenancy stream may extend the `DATA` section. Anyone else asks in their final report.

### 1b. Module APIs other modules may call (from wave 1 and 2 reports)
| Global | Module | Use |
|---|---|---|
| `STEPMODE.needsTrigger`, `ownerFor`, `robotFor` | platform.js | trigger rule and owner wording per step kind; robots resolve through `OWNERX.robotFor` |
| `OWNERX.robots`, `robot`, `robotFor` | mod_s_owner | robot directory: every robot step has a human sponsor and a different backup (CL-78) |
| `DATA.term(key,n)`, `DATA.terms()` | mod_s_tenant | tenant vocabulary (CL-57); entities include `key_results`, `pillars`, `demand`, `maturity`, `vocabulary`, `workload`, `value_chain`; packs in `window.TENANT_PACKS`; `DATA.screen(id,{mode,adapter})` |
| `NUM` (`pnum`, `snum`, `rec`, `rresolve`, `recordCSV`, `exportRecords`) | mod_r32_num_b | numbers for processes, steps, builds, objectives (O-001), key results (O-001.2), projects (PJ-), budget lines (BL-), invoices (IV-), ledger lines (LG-) |
| `ZLINK.chains`, `verify`, `refresh` | mod_zlink | the three golden-thread chains |
| `THREAD.build`, `THREAD.open` | mod_s_thread | Trace this drawer from any number chip |
| `EXE` (`cascade`, `gateCheck`, `publishStrat`, `krDrawer`) | mod_exec | strategy cascade and authoring with a quality gate |
| `SHOW` (`add`, `paths`, `setups`, `applyLens`, `wedge`, `reset`, `buildFix`, `lint`) | mod_r33_showroom, mod_s_showroom* | tours, lenses, wedge mode, demo reset, Build the fix hand-off (`data-sr-fix="kind|ref|title"`); the attribute `data-sr` is reserved by the core click handler |
| `SRCH.allow`, `USAGE` | mod_s_search, mod_s_search_usage | tenant-scoped search; screen, module and tab names rank first; real usage counts (this browser only) |
| `JX.TABS`, `demoTabs(on)`, `JXR.countBuilds`, `buildKey` | mod_r31_* | journey tabs, demo view, the one shared build count |
| `GUARD`, `APG.route`, `APG.check` | mod_s_guard, mod_r16h_c_groups | guardrail register, one approval route |
| `AGENTRT.canDecide`, `delegate`, `towerSync`, `scope` | mod_r15f1_c_agent | sponsor-only agent decisions, kill switch honored at runtime, per-tenant agent memory |
| `workFor.index(build)`, `workFor.clear()` | kit2 | one work index per render pass |
| `PROCLIB.count`, `whenSettled`, `draftMaturity` | mod_plat_proclib | stable process counts; every draft has a maturity record |
| `DATAMODEL.classOf`, `classify`, `inferred` | kit2 | every table has a classification (CL-77) |

## 2. Module conventions for new work
- New feature modules: `mod_s_<domain>.js` and `.css`, listed in `src/modules.json` right after `mod_r33_showroom` in alphabetical order (the build fails on an unlisted or missing module). Domain names, not round numbers.
- Guardrail register and approval routing: `GUARD` (mod_s_guard.js: `rails`, `verify`, `matrix`, `attempt`, `child`), one approval route `APG.route(kind,rec)` with `APG.check` (requester never approves own; group binding).
- A drawer that must not be adopted by the record shell carries `data-rsh-skip`.
- After adding screens: `PYTHONHASHSEED=0 python3 tools/generators/gen_scrmap.py src` (orchestrator runs it after each merge).
- Register screens with `REG`; search through `SEARCHX`; lifecycle through `HOOKS`; data through `DATA`; owners through `ownerChip`; step kinds through `STEPMODE`; storage through `U.store`.
- Tokens only in CSS; no new hex colors, no new `!important`; close controls top right (PH-10).
- Labels: every number is prototype fact, modeled, hypothesis or simulated. Nothing simulated reads as live.

## 3. How streams run
- One stream = one Claude Code session in its own git worktree and branch (`../wt-<stream>`, branch `<stream>`), started from `main` at the start of the wave.
- Each stream touches only the files in its territory (section 4). If it must touch another file, it keeps the change small and says so in its report.
- Before each commit: `npm install` once per worktree (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`), then `npm test` green. One commit per backlog ID where practical, message starts with the ID, trailers `Co-Authored-By` and `Claude-Session`.
- Streams do not push, do not merge, and do not edit the Product Backlog, `Handoff.md`, `CLAUDE.md` or this file. Their final report lists, per backlog ID: done, partial or not done, with evidence (files, test output), plus contract change requests and open questions.
- The orchestrating session merges each stream branch into `main`, runs the full suite, updates the backlog rows, and pushes once per green wave (decision 2026-10-19: push each green wave).

## 4. Waves (views of backlog IDs; the backlog holds status)

**Wave 0 (orchestrator):** CL-03, `platform.js` foundation (first slices of CL-31, CL-35, CL-55, CL-58, CL-73, CL-53, CL-54), this document.

**Wave 1 (parallel):**
| Stream | Territory | IDs |
|---|---|---|
| `repo` | build.py, tools/, .gitignore, README, netlify.toml, non-build files in src/ | CL-04, CL-05, CL-08, CL-09, CL-10, CL-11, CL-12, CL-13, CL-16, CL-48, DC-06, CL-01, JM-10 |
| `tenancy` | mod_r28_scn, mod_r32_tenant, `DATA` section of platform.js, new mod_s_tenant* | CL-55, DC-03, DC-31, CL-56, CL-63 (demo identity), DC-09 |
| `people` | mod_chat.js/.css, kit2.js person chip section, mod_r17t_a_actor, new mod_s_owner | CL-53 (chip behavior), CL-54, PH-10 (chat), PH-05 |
| `steps` | mod_r25_*, mod_r26_*, mod_r17r_procdiagram, mod_plat_modmap, mod_flow (triggers), mod_r17s_a_engine, mod_plat_contract | CL-58, CL-73, CL-74, PH-10 (VibeCheck), DC-01 (typing queue) |
| `perf` | mod_obs, mod_ppm, mod_mat, mod_sow, mod_sla, kit2.js `who` and scale stub | PR-12, PH-08 |
| `guard` | new mod_s_guard, mod_r16g_*, mod_r16h_*, mod_r15f1_c_agent, mod_r15d_ai, mod_budget3 approval adapters | DC-18, DC-19, DC-20, DC-21, PR-20, CL-67, CL-71 |
| `docs` | docs/ only | CL-62, CL-68, CL-69 (drafts), CL-51, DC-33, JM-11, PR-22 and PR-23 (option papers) |

**Wave 2 (parallel, after wave 1 is merged):**
| Stream | Territory | IDs |
|---|---|---|
| `showroom` | mod_r33_showroom, mod_r18e_lens, mod_r28_cxo | DC-05, DC-07, DC-15, DC-16, DC-17, DC-28, DC-30, DC-36, PR-18, PR-19, DC-27 |
| `thread` | mod_r32_num_*, gen_num, mod_zlink*, mod_exec, mod_budget*, mod_r29_bst, mod_r16k_trace, mod_r17q_c_value | DC-02, DC-04, DC-10, DC-12, DC-13, DC-14, PR-21, PR-02 |
| `journey` | mod_r31_*, mod_r32_orgprop, mod_r28_jy*, mod_r30_jov, mod_org5, mod_people journey section | DC-01 (org chart, FTE, tile), CL-33, DC-24, JM-01, JM-02, JM-04, JM-05, JM-06, JM-08, JM-09 |
| `packs` | new tenant pack files, mod_s_tenant* | DC-11, DC-22, DC-23, JM-07, CL-57, DC-25 |
| `nav` | mod_nav, mod_zsearch, tools/tests | PH-12, PH-11, PR-16 |

**Wave 3 (parallel: one JS sweep stream, one CSS stream):**
- `sweep-js` (sequential commits, every module): CL-45, CL-44, CL-17, CL-72, CL-32, CL-34, CL-42, CL-35 (migrate wrappers), CL-53 (migrate plain-text owners), CL-43, CL-52.
- `css` (CSS files only): CL-18, CL-19, CL-20, CL-21, CL-22, CL-23, CL-24, CL-25, CL-26, CL-29, CL-30 (measure only), PR-04.

**Wave 3 sweep rules (every sweep agent applies the same decisions):**
- Partition: `sweep-a` = core files (data.js, data2.js, ui.js, kit.js, kit2.js, screens1-4.js; not platform.js) and modules from `mod_admin` to `mod_obs` in modules.json order; `sweep-b` = `mod_oncall` to `mod_r16l_d_plans`; `sweep-c` = `mod_r16l_e_trace` to the end (includes `mod_s_*`, `mod_z*`). An agent edits only JS files in its range; CSS belongs to the `css` stream.
- CL-45 em dashes: in user-visible strings replace with a comma, colon, parentheses or "to" as the sentence needs; comments may keep them.
- CL-44 and R31 names: visible "Fabric", "Fabric Enterprise", "Core" (as a product name), "Trellis" become plain descriptions ("platform data layer"); FASB, GASB, FAF, ASC, ASU, Codification become "accounting standards". File and id names stay.
- CL-17 brand: visible "Oukala" and "Shaheen" become `${BRAND.name}` (global injected by the build). Storage keys, ids and CSS class names that contain "oukala" stay unchanged so saved state survives.
- CL-72 step kinds: each `who:"auto"` becomes `"robot"` when the step is a fixed rule, `"agent"` when it reasons with a model; ordinary uses of "auto" or "automatic" (auto-save, automatically) stay. Labels go through `STEPMODE`. Saved data keeps reading old values (aliases).
- CL-32 helpers: a local money, pct, esc, slug, clamp or uid that behaves exactly like `U.*` is replaced by `U.*`; a variant with different output stays and is listed in the report.
- CL-34 date: literal "Oct 6", "October 6" or "2026-10-06" used as today reads from `U.TODAY_ISO`, `U.todayDate()` or `U.fmtDate(U.todayDate())`; seed data dates stay.
- CL-42 storage: `localStorage` calls go through `U.store` with the same key names.
- CL-35 hooks: wrappers of `render`, `go`, `openDrawer` move to `HOOKS.on` with an `id`; keep order with `order` when two depend on each other.
- CL-53 owners: owner, backup, approver, assignee, sponsor, requester and reviewer names rendered as plain text become `ownerChip(name,{role,record})`; pairs use `ownerChip.pair`.
- CL-43 escaping: any innerHTML that includes user-typed text uses `U.esc`.
- CL-57 vocabulary: hard-coded industry nouns on shared screens use `DATA.term(key)` (list in docs/tenant-packs.md section 4).
- Never change behavior beyond the rule; screens must render identically except for the corrected strings. Run smoke, tabs and the stream's relevant tests per commit and the full suite before the last commit.

**Wave 4 (bundle, lint, gate, final measure):** CL-14, CL-15, CL-39, CL-27, CL-28, CL-36, CL-37, CL-38, CL-40, CL-41 (hide, never delete), CL-46, CL-60, CL-59, CL-61, CL-47, PR-05, PR-08, PR-11 (simulated upload), CL-49.

**Not built in this program** (need a person, a decision, a backend or a date): DC-26, JM-03, PH-06, PH-07, PH-14 and PR-06 (planned together with Omar), PR-01, PR-03, PR-07, PR-09, PR-10, PR-13, PR-14, PR-15, PR-17, CL-06, CL-07 (after 2026-11-17), CL-70, DC-34, CL-64 to CL-66, BR-01 to BR-09, GM-01 to GM-20. BR-10 placement waits for a decision.

## 5. Decisions adopted for this program (2026-10-19)
Interim reload or `SCN.set` until CL-55 lands; Healthcare is the first industry tenant; tenant skeletons approved; fixed demo date; hide screens, never delete; measure glass effects before changing them; COO wedge supersedes GTM option B (unblocks PR-18).
