# Falconaire module guide (read fully before writing code)

Updated 2026-10-20 (CL-47) to match the code and `docs/PLATFORM_RULES.md`. Where this guide and the rules disagree, the rules win. Contracts of the shared foundation are in `docs/ARCHITECTURE.md`; how each rule is checked is in `docs/enforcement.md`. The product name is Falconaire, read from `BRAND.name` (`src/brand.json`); "Oukala" survives only in storage keys, ids and class names so saved state keeps working.

Falconaire is a database-free, single-page prototype of an AI-native work platform. Every application on it (projects, service, change, risk, finance, people, facilities, clinical or site operations) is built from the same five objects: record, process, participant, metric, tenant, plus one shared chat. Sample data is fictional: the core tenant is Atlantic Systems and the sample executive is Casey Rowan.

## 1. Files and build

- A feature is a module pair `src/mod_s_<domain>.js` and optional `.css`, named for its domain, never for a build round.
- **List it in `src/modules.json`.** `build.py` concatenates the core files (platform.js first, then data.js, data2.js, ui.js, kit.js, kit2.js, screens1, 2 and 4), then the modules in the order of that list, then screens3.js. Put `"mod_s_<domain>"` among the `mod_s_` entries in alphabetical order (after `mod_r33_showroom`, before `mod_sla`). An unlisted module file, or a listed name with no file, fails the build.
- Build: `python3 src/build.py --out build_out` (add `--full` for the single-file `full.html` the tests use). Output: `index.html`, `oukala-js.js`, `full.html`.
- Generated data files start with `/* GENERATED`: `mod_r32_scrmap_a_data.js` (`tools/generators/gen_scrmap.py`), `mod_s_facts.js` (`node tools/lint/facts.js --write`). Never edit them by hand; regenerate after adding screens.
- The " 2" duplicate files are quarantined (CL-07): never edit, build or delete them.

## 2. Module shape

```js
(function(){                                   /* one IIFE per module (R39, lint rule iife) */
 S.wo=S.wo||{sel:null};                        /* state on S.<prefix> */
 DATA.define("work_order",{core:()=>WO,key:"id",label:"Work orders"});   /* or read an existing entity */
 const rows=()=>DATA.get("work_order");        /* every read goes through the tenant data layer (R16) */
 REG("wo_list","Work orders","service","M4 6h16M4 12h16M4 18h10",()=>`<div class="screen">
  ${hero("Service","Close work fast",`<b>${rows().length}</b> open ${DATA.term("ticket",rows().length)}`,"")}
  ${lensNote()}${card("Open work",`Owner and backup on every row`,list())}${procCard("wo_list")}</div>`);
 DATA.screen("wo_list",{mode:"data",entities:["work_order"]});
 PROC.reg("wo_list",{title:"Work order flow",std:["itil5"],steps:[{n:"Log",who:"human",owner:"Requester",sla:"Same day",in:"Request",out:"Work order"},
  {n:"Route",who:"robot",owner:"Robot",sla:"Immediate",in:"Work order",out:"Assigned team"},{n:"Approve",who:"gate",owner:"Facilities lead",sla:"1 day",in:"Plan",out:"Decision"}]});
 HOOKS.on("afterRender",s=>{if(s==="wo_list")wire()},{id:"wo_wire"});   /* never wrap render, go or openDrawer (R40) */
 NAVX.add("wo_list",{group:"fix",label:"Work orders",hint:"Open and closed work orders",kw:"work order repair facilities"});
 SEARCHX.push(()=>rows().map(r=>({g:"Work orders",t:r.id+" "+r.t,m:r.st,c:"--info-f",f:()=>go("wo_list"),k:r.t})));
 ASKX.push(q=>/work orders?/i.test(q)?(go("wo_list"),say(q,{t:"Opened work orders."}),true):false);
 document.addEventListener("click",e=>{const t=e.target.closest("[data-wo-open]");if(!t)return;/* ... */});
})();
```

- Namespace every class and data attribute with the module prefix (`.wo-...`, `data-wo-...`). Do not edit another owner's file; if you need a shared change, say so in your report.
- Read globals lazily and guarded (`window.X&&X.y`); load order is the modules.json order.
- Call `audit(action,detail)` for every change a person makes and `toast(text,"good")` for feedback.

## 3. The foundation (`src/platform.js`, contracts in docs/ARCHITECTURE.md)

| Need | Use | Rule |
|---|---|---|
| Helpers | `U.esc`, `U.money`, `U.moneyShort`, `U.pct`, `U.clamp`, `U.slug`, `U.uid`, `U.TODAY_ISO`, `U.todayDate()`, `U.fmtDate()`; never redeclare them | R10 |
| Browser storage | `U.store.get/set/del` (keys are cleared by the demo reset); never call `localStorage` directly | CL-42 |
| Lifecycle | `HOOKS.on(name,fn,{order,id})`: `beforeGo`, `beforeRender`, `afterRender`, `afterOpenDrawer`, `tenantChange`, `tenantDenied` | R40 |
| Data | `DATA.define`, `DATA.get(entity,{where})`, `DATA.byId`, `DATA.term(key,n)`, `DATA.screen(id,{mode,entities})`; tenant packs supply rows with `DATA.pack` | R16 to R20 |
| Step kinds | `STEPMODE.of`, `label`, `pill`, `kinds()`: human, robot, agent, plus the approval gate. "Automatic" and "Function" are never a step kind | R21 to R24 |
| Triggers | `TRIGGERS.list()` (metric threshold, schedule, process step, event, record change); robots and agents need one | R21a |
| Owners | `ownerChip(name,{record,role})`, `ownerChip.pair(owner,backup,{record})`; behavior (Person 360, Message, Open chat on this record) comes from `OWNERX` (mod_s_owner.js). Robots pass `{kind:"robot",sponsor}` | R12, R13 |
| Chat | `CHATADDR.open("person:Name"|"team:id"|"record:type:id"|"process:P-014"|"agent:id",{record})`; no module builds its own comment box or inbox | R13a |
| Step helpers | `STEPKIT.needsTrigger`, `ensureTrig`, `trigChip`, `agentDef`, `openAgent`, `robotTest` (mod_s_steps.js); never `window.STEPS` | R21, R22 |
| Approvals | `APG.route(kind,rec)` and `APG.check` (one route, requester never approves own) | R14 |

Other module APIs you may call are listed in docs/ARCHITECTURE.md section 1b (NUM record numbers, THREAD, ZLINK, SHOW, SRCH, PROCLIB.count, DATAMODEL.classOf, GUARD).

## 4. Shared screen parts (kit.js, kit2.js, ui.js)

- Screen frame: `hero(eyebrow,headline,story,extra)`, `lensNote()`, `card(title,sub,body,right)`, `procCard(screenId)` near the bottom (R34). Dashboard first: stats and charts, then what needs attention, then lists, then detail and forms.
- Metrics: add to `METRICS` (`n`, `f` formula in words, `u`, `cur`, `tgt`, `badAt`, `dir`, `owner` a person, `rem` remediation) and show with `fchip("m_id")`, `kpi` or `kpiRow` (R25). Label every number as prototype fact, modeled, hypothesis or simulated (R29).
- Lists that can reach hundreds: `btHTML` (virtual, sortable, faceted; `data-bt-row`); filters over about 6 values: `mpHTML`; linked records: `lrHTML`; tabs: `views("prefix_name",[labels],[panes])`; forms: `openForm(spec)`; detail: `openDrawer(html)`; drag and drop: `DND.on(scope,fn)` with a keyboard fallback (R7).
- Navigation: `data-link="type:id"` and `go(screen,arg)`. Standards: `stdChip(key,detail)` (R27). Legends for every meaningful color: `legend([[label,"--token"]])` (R28). AI output: `aiChip({...})` and `whyPop(text)` (R35).
- At Enterprise scale (`SCALE.set(true)`) every list, picker and graph must stay usable (R11).

## 5. Styling and text

- Tokens only (`var(--...)` from `src/tokens.py`, scales in docs/css-tokens.md). No new hex colors, no new `!important`, z-index from the token list, breakpoints 700, 900, 1100, 1500 px. No literal colors or font sizes in JS view code (R8). Close controls sit top right, never over content (PH-10).
- Text never squeezed: `overflow-wrap:break-word`, `minmax(0,1fr)`, no horizontal scroll at 400 px; check light, dark and phone.
- Plain American English, acronyms defined on first use, no em dashes, no visible raw text boxes, buttons are buttons (R37).
- Never use Core (as a product), Fabric, Fabric Enterprise or Trellis, and never the accounting-standard names listed in R31. No real people or organizations (R32), no price points, no certification claims except as plans (R30, R52). Sample people and customers come from data and tenant packs, not string literals in a screen (R9).

## 6. The Feature Contract (docs/FEATURE_CONTRACT.md)

Scored 0 to 4: process model (`PROC.reg` plus `PROCLIB.addProcess`), data model with a recorded reuse, extend or new decision (`ATLAS.addEntity`, `DATAMODEL.register`), metrics with a maturity record, interconnectivity (`MODMAP.addModule`, `addFlows`, a `SEARCHX` provider and an `ASKX` intent). Rule 5: a named human owner and a different backup (`ownx`).

Foundation checks reported beside the score (CL-59, Platform rules Part 3). They block citizen-app promotion from the team tier up; existing screens are scored on the Retrofit matrix (`plat_retrofit`) with no compliance date yet:
- `ct_reuse`: declare the archetype and the screen you compared with, `CONTRACT.declare(id,{archetype,compared:[ids]})` (archetypes: `CONTRACT.archetypes`), register `PROC.reg`, use the shared components.
- `ct_tenant`: read through `DATA` and declare `DATA.screen(id,{mode:"data"})`; take industry nouns from `DATA.term`.
- `ct_people`: owners through `ownerChip`, chat through `CHATADDR`, steps through `STEPMODE` (no `who:"auto"` or `"fn"`).
Check a screen with `CONTRACT.evaluate(id)` and `CONTRACT.foundation(id)`. A rule that cannot be met needs a waiver with a reason, owner and an expiry of at most 90 days (R41).

## 7. Screens: hide, never delete

Folded or unreachable screens keep their id: `R15.hidden` and `R15.alias` keep links, saved favorites and URLs working. Unreachable screens (no menu, family, link or tour path; `tools/lint/reach.js`) are listed in `HIDE.LIST` (mod_s_hide.js) and can be unhidden on Administration, Environments and releases, Hidden screens. After adding screens rerun `python3 src/gen_scrmap.py src` and `node tools/lint/facts.js --write`, then rebuild.

## 8. Tests (all green before any push)

`npm test` (`tools/tests/run.sh`) builds with `--full`, then runs:
- `tools/lint/lint.js`: the build lint over `src/` (CSS variables, hex, banned and real names, em dashes, IIFE, price, certification, JS literals, sample data, helpers, plain owners, step labels, product name, wrappers). It fails only above `tools/lint/baseline.json`; lower the baseline with `--update` after a cleanup. It warns when `mod_s_facts.js` is stale.
- `showlint.js`, `css_lint.js`, then `smoke.js` (every screen), `tabs.js`, `journey.js`, `showroom.js`, `platform.js` (foundation contract), `people.js`, `steps.js`, `guard.js`, `gate.js` (foundation checks, hidden screens), `tenant.js`, `tenant_leak.js`, `thread.js`, `sweep_a.js` to `sweep_c.js`, `search.js`, `nav_usage.js`, `nav_close.js`, `tenant_tour.js`, the `fixes_*.js` checks and the `perf.js` report.
- Per commit at least: build, `node tools/lint/lint.js`, `node tools/tests/smoke.js build_out` and the suites your change touches. Playwright needs a Chromium (`CHROMIUM_PATH` if Playwright's own is not installed).

## 9. Final report

Per backlog ID: done, partial or not done, with evidence (files, test output); the Feature Contract score and the three foundation checks of every screen you added or changed; shared-file changes you need; open questions. Commit messages start with the backlog ID and keep the `Co-Authored-By` and `Claude-Session` trailers.
