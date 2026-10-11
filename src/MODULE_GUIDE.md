# Oukala module guide (read fully before writing code)

Oukala is a single-file prototype (no backend) of an AI-native enterprise work platform (PPM, ITSM, ITOM, knowledge, workflow, AI governance). You are building ONE OR MORE feature modules as `mod_<name>.js` (+ optional `mod_<name>.css`) in `/tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/`. Casey (CIO, first customer is "Meridian Standards Foundation", a mid-sized standards body; Microsoft E5 assumed) wants to SEE forms, features, working interactions. Not mockups of boxes: working prototypes with realistic data.

## Hard rules (rewritten in Round 11: the Feature Contract comes first and wins where it conflicts)
0. **The Feature Contract (Casey's standing rules; full text in `docs/FEATURE_CONTRACT.md`).** Every new feature, module, citizen app or AI agent must bring: (1) a PROCESS MODEL developed or researched and editable in the tool (`PROC.reg` plus `PROCLIB.addProcess`: steps, who acts, owners, SLAs, gates, RACI, a cited standard); (2) a DATA MODEL plus a research-and-integration decision (search the registry; reuse, then extend, then new; rationale recorded; `ATLAS.addEntity` and `DATAMODEL.register`; authority and classification on every field); (3) METRICS and a MATURITY model connected to the larger models (`METRICS` with formula, owner, target and remediation; `PROCLIB.maturity` rolling up in the `MAT` engine, never a parallel scale); (4) INTERCONNECTIVITY (`MODMAP.addModule` and `addFlows` with a flow in and a flow out, links to projects, strategy, tickets, people, approvals, a `SEARCHX` provider and an `ASKX` intent). It is checked at design time (agents in `agents/`, skill in `skills/oukala-feature-contract/`), at the publish gate (`ct_process`, `ct_data`, `ct_metrics`, `ct_links` in `GATE.CHECKS`; Build a module blocks Register; MCP tool `run_feature_contract`) and at runtime (Feature contract screen, `plat_contract`). A feature that cannot meet a rule needs a waiver: a debt item with an owner and an expiry of at most 90 days. Run `CONTRACT.evaluate("<screenId>")` and report the score (out of 4) for every screen you touch. Product naming rule: never write FAF, Codification or ASU (or ASC, FASB, GASB); sample customer Meridian Standards Foundation, sample systems the Standards Portal and the Standards Platform.
   *What this replaces:* the old "2 to 4 metrics per module" is now "at least one outcome metric and one health metric, each with formula, owner, target and remediation, plus a maturity record"; "register a PROC for each screen" is now "PROC.reg plus a PROCLIB record with a named owner"; "Everything controllable by chat" now also requires a chat intent for the feature's main questions; a shared "Final report" must include the Feature Contract score of each new screen.
1. Do NOT edit any shared file (data*.js, ui.js, kit.js, screens*.js, style*.css, build.py). Only create your `mod_*.js/.css`. If you need a shared change, write it in your final report.
2. Wrap your JS in an IIFE `(function(){ ... })();`. All globals from shared files are readable (see list). Namespace every data attribute and CSS class with your module prefix (e.g. `data-itsm-...`, `.itsm-...`). Never reuse names from other modules.
3. Register screens with `REG(id, name, group, iconPath, renderFn)` where iconPath is an SVG path `d` string for a 24x24 viewBox, stroke style (like the ones in SCREENS in data.js; draw something simple and meaningful, e.g. "M4 6h16M4 12h16M4 18h10"). group is one of: portfolio, service, ops, know, people, automate, ai, platform. renderFn returns an HTML string. Re-render with `render()`. Persist your state on `S.<prefix>` (create inside your IIFE: `S.itsm=S.itsm||{...}`).
4. Event handling: add your own delegated `document.addEventListener("click"/"input"/"change"/"keydown", ...)` that only reacts to YOUR namespaced attributes (use `e.target.closest("[data-yourattr]")`). Call `audit("did something","detail")` for every user action that changes something. Call `toast("Saved","good")` for feedback.
5. Design rules (Casey's, non-negotiable):
   - Every number or label is a story or a metric. Metrics need a formula and remediation: add to `METRICS` (see below) and show with `fchip("m_id")`. Wrap displayed metric values in `data-role="metric"` and narrative in `data-role="story"` (Clarity lens uses these).
   - Each screen starts with `hero(eyebrow, headline, storyHtml, extraHtml)`, then `lensNote()`. The story is plain-English, specific ("3 of 9 changes collide with the Nov 16 freeze"), never generic.
   - Show AI lineage: `aiChip({model:"Claude Sonnet",conf:.86,...})` (look at ui.js aiChip for fields) wherever AI drafted/decided; show guardrails or a "why" via `whyPop("text")`.
   - Everything controllable by chat: add `ASKX.push(q=>...)` intents and `SEARCHX.push(()=>[...])` records for your screens.
   - Forms: use `openForm(spec)` from kit.js (see below). Every create/edit flow is a real form with validation, help text, AI-suggest fields where sensible, and on submit mutate your data + toast + audit + re-render. Also give each form a "what happens next" story line.
   - Drag and drop wherever ordering/assignment/status makes sense: kit DND (see below). Include keyboard fallback (built in).
   - Liquid-glass look: use existing classes (`card glass`, `tile glass`, `mini glass`, `pill good|warn|bad|info|mute|metric`, `chip`, `btn`, `btn primary|quiet|danger`, `grid g2|g3|g4`, `row`, `muted`, `small`, `num`, `eyebrow`, `kv` dl, `story`). Use CSS variables from tokens (e.g. `var(--accent)`, `var(--good-f)`, `--warn-f`, `--bad-f`, `--info-f`, `--ink`, `--muted`, `--glass`); use `col("--x")` in JS for SVG fills. Never use literal hex colors in component rules; never visible raw text boxes (kit field classes already style inputs). Subtle hover lift and animation; honor prefers-reduced-motion.
   - Tabs inside a screen: `views("name",["A","B"],[paneA,paneB])` (radio+:has, JS-free; the name must be unique and prefixed).
   - Details: `openDrawer(html)` for slide-in detail; `popover` for lightweight hovers.
   - Accessible: buttons are `<button>`, labels, `aria-*`, focus visible, contrast. Phone width (400px) must not scroll horizontally: use grid `minmax(0,1fr)`, wrap rows, wide tables inside `overflow-x:auto` wrappers.
   - Plain language, American English, define acronyms on first use, NO em dashes.
   - Spacing: stack siblings with flex/grid `gap`; cards in a `.pane`/`.screen` are already spaced. Never let tiles touch cards below.
6. Data realism: Meridian Standards Foundation, people from `PEOPLE`, vendors Lumen (search/indexing vendor), existing projects PR1..PR4, systems like Standards Platform, Contract Repository, Lease subledger (ERP), Azure, Entra ID, M365. Dates: today is Tue Oct 6 2026 (work calendar helpers fmtD/wdOf). Money via `money(n)` or `K$(n)`.
7. Size discipline: aim 25-60KB per module. Quality over breadth inside each screen, but cover EVERY sub-feature listed in your assignment with at least a working list, a detail drawer, and a create/edit form.

## Globals you can use
State/utility: `S`, `$`, `$$`, `esc`, `money`, `K$`, `pid()`, `col()`, `ico(key)`, `IC(path)`, `ring`, `spark`, `lineChart`, `metricRing(id,size)`, `audit(action,detail)`, `go(screen,arg)`, `render()`, `openDrawer`, `closeDrawer`, `toast`, `PEOPLE` ([name, role, colorVar]), `PERSONAS`, `METRICS`, `INVOICES`, `MEETINGS`, `PROJ`, `TASKS`, `DEMAND`, `CAP`, `fmtD`, `NODES` (records).
kit: `REG`, `card(title,sub,body,right,style)`, `TL(label,big,delta,cls)` + `tiles([...])`, `pill(t,cls)`, `empty(t,s)`, `openForm(spec,init)`, `DND.on(scope,fn)`, `grip` markup helper, `SEARCHX`, `ASKX`, `say(q,{t,steps})` for chat replies.
Icons: `ico(key)` only knows sparkle warn check info bolt search chev lock book. For anything else use `IC("M... path d ...")` which wraps a 24x24 stroke path in an svg.

METRICS entry shape (see data2.js m_prio): `m_x:{n:"Name",f:"formula in words with × ÷",u:"%"|""|"h",cur:68,tgt:60,badAt:45,dir:"max"|"min",max:100,tr:[8 numbers],owner:"Team",use:["Screen name"],rem:{kind:"sop"|"kb"|"agent",ref:"SOP-301",title:"...",agent:"Some Agent",auto:false,state:"idle",prog:"what it does"}}` via `Object.assign(METRICS,{...})`. Add 2-4 metrics per module and show them with `fchip`.

## kit.openForm
```
openForm({id:"itsm_inc",title:"Log an incident",story:"Plain-English what this does and what happens next.",submit:"Create incident",
 fields:[{section:"What happened"},{k:"title",label:"Title",type:"text",req:true,ph:"...",help:"...",ai:{label:"Suggest",fn:vals=>"suggested text"}},
  {k:"sev",label:"Impact",type:"chips",opts:["Low","Medium","High"]},{k:"cis",label:"Affected services",type:"multi",opts:[...]},
  {k:"owner",label:"Assign to",type:"people"},{k:"due",label:"Due",type:"date"},{k:"cost",label:"Cost",type:"money"},{k:"p",label:"Priority",type:"range",min:1,max:5},
  {k:"notify",label:"Notify",type:"toggle"},{k:"doc",label:"Attach",type:"file"},{k:"x",label:"...",show:v=>v.sev==="High"}],
 live:vals=>"html shown live under the form (e.g. computed priority + formula)", onSubmit:vals=>{ ...mutate; toast("Created"); audit(...); render(); closeDrawer(); }, defaults:{...}})
```
types: text, longtext, number, money, date, select, chips (single choice), multi, range, toggle, people, file. Options: `req`, `help`, `ph`, `opts` (["A","B"] or [["val","Label"]]), `ai`, `show`, `wide`, `unit`, `min/max/step`. The form validates required fields, shows errors, and the drawer closes only when you call `closeDrawer()`.

## kit drag and drop
Mark list container `data-dnd="listName" data-dnd-scope="scopeName"` (add `data-dnd-dir="x"` for horizontal lists) and each item `data-dnd-id="id" tabindex="0"`. Register once inside your IIFE: `DND.on("scopeName",(id,fromList,toList,index)=>{ mutate data; audit(...); toast(...); render(); })`. Items can move between lists that share a scope (kanban). Include a visible grip (`<span class="grip" aria-hidden="true"></span>`). Keyboard Alt+Arrows works automatically.

## Minimal module skeleton
```js
(function(){
 S.itsm=S.itsm||{sel:null};
 const INC=[{id:"INC0012",t:"Portal latency",sev:"High",st:"Investigating",own:"Tom Becker"}];
 Object.assign(METRICS,{m_mttr:{n:"Mean time to restore",f:"Σ(restore time − start time) ÷ incidents",u:"h",cur:2.4,tgt:3,badAt:6,dir:"min",max:10,tr:[3.1,3,2.9,2.8,2.7,2.6,2.5,2.4],owner:"Service desk",use:["Incidents"],rem:{kind:"kb",ref:"KB0421",title:"Restore playbook",agent:"Triage Agent",auto:false,state:"idle",prog:"Drafts next-step guidance"}}});
 REG("itsm_inc","Incidents","service","M12 3l9 16H3zM12 10v4M12 17h.01",()=>`<div class="screen">${hero("Incidents","Restore service fast","<b>1 open</b> incident...",`<div class="row">${fchip("m_mttr")}<button class="btn primary" data-itsm-new>Log incident</button></div>`)}${lensNote()}${card("Open incidents","...","...")}</div>`);
 document.addEventListener("click",e=>{const t=e.target.closest("[data-itsm-new]");if(!t)return;openForm({...})});
 SEARCHX.push(()=>INC.map(i=>({g:"Incidents",t:i.id+" "+i.t,m:i.sev,c:"--bad-f",f:()=>go("itsm_inc"),k:i.t})));
})();
```

## Testing (mandatory before you report)
From the v2 dir, build into YOUR OWN output dir so you do not collide with others:
`python3 build.py --only <yourmod1>,<yourmod2> --out /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/out_<name>`
then `node --check out_<name>/oukala-js.js` and screenshots:
`NODE_PATH=$(npm root -g) node shot.js out_<name> screenId1,screenId2 [--phone] [--dark] [--eval "js"]` (writes out_<name>/shots/*.png; prints console errors and horizontal overflow). Read the PNGs and fix what is ugly, cramped, clipped, overflowing, or empty. Test: desktop light, desktop dark, phone for each screen; open each form (`--eval "openForm(...)"` or click its button via an eval script) and screenshot it; test a drag (use `--eval` or a custom playwright script with mouse moves) at least once; check zero console errors. Run your own custom playwright script when needed (copy shot.js).
Important: the first build will include other modules' files only if you omit `--only`, so ALWAYS pass `--only`.

## Final report (keep under 300 words)
List: screens registered (id, name, group), metrics added, forms built, DND scopes, ASKX intents, any shared-file changes you wish for, known gaps. Do not paste code.

## Research context
Four recon reports are in the scratchpad parent dir (recon-servicenow.md, recon-atlassian-github.md, recon-salesforce-microsoft.md, recon-ppm-itsm-standards.md). Skim the sections relevant to your assignment for real field lists, workflows and vocabulary (ServiceNow tables/fields, ITIL 4 practices, Jira/Confluence, Dynamics/Project Online). Use real-world field sets in your forms. Use WebSearch for any additional field-level research you need (e.g. ITIL change fields, NIST incident severity, CSDM classes) if the recon is thin.

---
# ROUND 8 ADDENDUM (read this too; it overrides the older text where they differ)

## What changed in the shared files (already done; do not redo)
- `kit2.js` (core, loaded after kit.js) and `style4.css` add the shared foundation below. Core is NOT editable by you unless your assignment says you own a core file.
- Text spacing rule: NEVER use `overflow-wrap:anywhere` or `word-break:break-all`. Use `overflow-wrap:break-word` and give text columns `minmax(0,1fr)` with a real minimum width. Tables are auto-wrapped in `.tscroll` so they scroll sideways instead of squeezing, and single-token ids get `white-space:nowrap`. Stat tiles use `.statrow` + `.stat` (small label, `.num`, `em` subtext). Do NOT put `.mini` tiles inside a grid of columns for label/value pairs.
- Gate: run `NODE_PATH=$(npm root -g) node spacescan.js OUT --w 1000 --only yourscreen1,yourscreen2` (also `--w 1440` and `--phone`) and fix every flagged squeezed or broken-word text before you report. It must print `total flagged 0` for your screens.
- Nav: Home is the only pinned item. The "Portfolio and delivery" group parent opens the Executive dashboard; ordering is in `NAVORD` (kit2.js). New portfolio screen ids reserved: `exe_mat` (maturity models), `ppm_wbs` (WBS editor), `ppm_sow` (SOW and contract analyzer). To place your screens in the nav ordering you only need the right `group` in REG.

## kit2 API (all globals)
- People: `DIR` (array of {name,kind:"human"|"ai"|"contractor"|"msp",role,team,org,skills,rate,contract,sla,mgr,email,loc,hrs,c}), `who(name)`, `avatar(nameOrRec,{size})`, `pchip(name,{role:1})` (click opens Person 360 automatically), `kindPill(kind)`, `KINDS`, `TEAMS`, `person360(name)`, `workload(name)` -> {hrs,cap,pct,items}, `workFor(name)`.
  Everything that assigns work to a person MUST register a provider so Person 360 ("everything assigned") shows it: `WORK.push({kind:"Incidents",tag:"INC",fn:(name,rec)=>[{id,t:"title",sub:"service",due:"Oct 9",st:"warn",hrs:2,go:()=>go("itsm_inc")}]})`. Add Person 360 tabs with `P360_TABS.push({label,fn:rec=>html})`. Use `pchip(name)` or `avatar(name)` anywhere a person, AI agent, contractor or managed service provider is shown (never bare initials or plain names). Distinguish the four kinds visually (kindPill and avatar badge) wherever assignment happens.
- Service and CI registry (one graph everyone uses): `SVCREG` (13 services: tier, owner, processOwner, sme, users, avail, tgt, cost, obj, proj, maturity, offerings, deps), `CIREG` (45 CIs), `CIEDGE` ([from,to,type]; from depends on to), `svcOf(idOrName)`, `impactOf(id)` -> {services,cis,users,cost,projects,objectives,tier1,order}. You may PUSH more services/CIs/edges (unique ids) but do not rename or remove existing ones. `openImpact({type:"change"|"incident"|"problem"|"ci"|"service",id,service,ci})` opens the visual impact analysis (registered by the Service 360 module; before it exists it toasts). Every incident, problem, change, request, and release record must carry a `service` (a SVCREG name) and offer an "Impact analysis" button calling `openImpact`.
- `mpHTML({id,label,opts:[{v,l,sub,grp}],all:"All projects",onChange:sel=>{}})` + `mpGet(id)` + `mpSet(id,arr)`: searchable multi-select dropdown with select all / clear / invert. USE IT INSTEAD OF PILL ROWS wherever a filter could exceed about 6 values (projects, services, teams, people, classes).
- `btHTML({id,cols:[{k,label,fmt:r=>html,val:r=>sortValue,wrap,cls}],rows:[...]|()=>[...],key:"id",h:520,rowH:40,group:"colKey",groupBy:["k1","k2"],facets:["k1"],exportName:"x",open:id=>{}})`: virtual-scrolling, sortable, searchable, facet-filtered, groupable table that stays fast at tens of thousands of rows. Use it for any list that could reach hundreds (CIs, incidents, requests, assets, people, WBS lines, contract lines, events). `btRefresh(id)` after you mutate rows.
- `lrHTML({id,groups:[{key,label,rows:[{id,t,sub,tag,st,go}]}],limit:6,search:true})`: Linked records as accordion groups with counts, search and "show more" so hundreds of links stay usable. Use for every "linked records", "related", "affected" list.
- Full screen drawers: every `openDrawer` gets an automatic "Full screen" button. In a drawer, content that benefits from width should use `.dfullgrid` (auto-fit grid) so it spreads out when expanded.
- `DATAMODEL.register(table,{label,source,fields:[{k,label,type,opts}]})` / `DATAMODEL.tables` / `DATAMODEL.fields(t)`: the platform field catalog. SLA/XLA definitions, workflow parameters, the visualization builder and decision tables pick REAL fields from here; register your records' fields (10 core tables are pre-registered: incident, change_request, request_item, project, project_task, cmdb_ci, business_service, invoice, person, contract_line).
- `STD` + `stdChip(key,detail)`: industry standards badges (itil5, itil4, tbm, csdm, pmbok, safe, cobit, iso20k, iso27k, nist, cmmi, togaf, dmbok, kcs, xla, devops, bpmn). Add more with `STD.key={n,by,d}`. Show a `stdChip` wherever your design follows a standard and say HOW in the detail text. ITIL 5 is now released; research its terms (use WebSearch) rather than assuming ITIL 4.
- `PROC.reg(screenId,{title,std:["itil5"],steps:[{n,d,who:"human|agent|auto|gate",owner,sla,in,out}]})` and `procCard(screenId)`: every screen shows the process behind it as a clickable strip (admins can add steps / open the Workflow designer). Register one for EACH of your screens and include `${procCard("yourscreen")}` near the bottom of its render.
- `legend([["Label","--css-var"],...])`: every colored bar, stripe, dot or swatch that carries meaning MUST have a legend or tooltip text saying what the color means (Casey asked "what is the purple bar?").
- `SCALE.on` (Demo / Enterprise switch in the nav footer) plus generators `SCALE.cis()` (2,600 CIs), `SCALE.tickets()` (6,400), `SCALE.projects()` (38 extra), and ~330 extra people in `DIR` when on. EVERY list, picker, graph, chart and dropdown you build must stay usable with these volumes (tables via `btHTML`, filters via `mpHTML`, graphs via aggregation/clustering and "focus on this node" rather than drawing thousands of nodes). Test your screens with `SCALE.set(true)` evaluated before opening them.
- `RNG(seed)` deterministic random for generated data; `avatar` is deterministic per name.

## Standing design rules added by Casey this round
1. Text must never be squeezed into slivers (see gate above). If a row has a name plus other cells, the name gets the full row on narrow containers (container queries or stacked layout).
2. Every tab's first view is a dashboard (stats, charts, what needs attention) plus the list view. Detail/forms come after.
3. Drawers can go full screen (automatic). Design drawer content that can use width.
4. Linked records everywhere use `lrHTML`; big lists use `btHTML`; filters use `mpHTML`.
5. Assign to teams first (ITIL), individual assignment is allowed only by claiming or with a stated reason; show who/what (human, AI agent, contractor, managed service provider) with avatars.
6. Every metric uses the standard metric framework (METRICS entry with formula, target, owner, remediation + `fchip`). Use industry standards and name them with `stdChip`.
7. Every service/process is traceable: technical composition, strategy/objective and maturity, projects using/impacting/improving/deprecating it, stakeholders, performance, financial and impact measures.
8. Everything must hold at hundreds or thousands of records; never design only for the demo volume.
9. Show each tab's process (procCard) and where an AI agent, a person, an automatic action or a gate acts.
10. Plain language, American English, define acronyms on first use, no em dashes, no visible raw text boxes.

## File ownership this round (only edit what you own; create new `mod_*` files freely if prefixed)
Owner assignments are in your prompt. If two modules must interact, use the contracts above (globals guarded with `window.fn&&fn()`), never edit another owner's file. When you REMOVE a screen from a file you own because another module now registers it, say so in your report.

## Testing additions
- `node --check`, `shot.js`/`shotw.js` (`NODE_PATH=$(npm root -g) node shotw.js OUT screen WIDTH [--dark] [--eval js] [--full]`), `spacescan.js`, `allscreens.js OUT`.
- Build in your own out dir: `python3 build.py --only <your modules> --out out_<name>` (always pass --only). Note core `kit2.js` + `style4.css` are always included. If you own a core file (data2.js, screens4.js, etc.) your edits are included in everyone's builds, so keep them syntactically safe and re-run `node --check` after every edit.

## CORE FIX NOTES (round 8, core)
- `kpi(label,value,sub,{cls,metric,keep})` and `kpiRow([[label,value,sub,opts],...])` (kit2.js): shared tile; `metric:"m_id"` adds an fchip; zero values dim (pass keep:true to stop). Guard with `typeof kpi==="function"`.
- SCALE counts: `SCALE.n.{projects:240,incidents:1200,changes:300,demand:160,raid:1500,cis,tickets,people,assets}`; generators `SCALE.projects()/incidents()/changes()/demand()/raid()` return deterministic arrays (incident/change/demand/raid have id,t,service,st,group,owner...; projects add phase,start,durMonths,spent,service). Core build is under 20 ms; module hooks on SCALE.set (itom, ppm, svc, flow) dominate its time.
- Tabs: `views()` now supports any number of tabs (CSS up to 20), a single scrollable row with fade cues, role=tablist/tab and aria-selected. `.tscroll`, `.bt-scroll`, `.flowscroll` get left/right fade cues automatically.
- Hero is compact (2 line headline and story, "Read more" toggle, chip rows scroll in one line unless they hold .recchips/.fchips). Do not add more than one chip row.
- Ask Oukala is a 48 px round button (expands on hover, hides while scrolling down); `#view` has 84 px bottom padding.
- Metric popovers (.fchip, ring cards) open anchored under the chip; add class `anch` logic only through `popovertarget` on `.fchip`, `.chip`, `.navhelp`, or inside `.hero`.
- `normMetrics()` runs on every render: fills missing unit and remediation (generic standby SOP) so every metric is complete; still give your metrics a real rem and u.
- recDrawer uses lrHTML (grouped Goes to / Comes from). Metrics screen: search, 24 at a time, "Show 24 more".
- Nav: accordion (one group open), active item scrolled into view, "How to read this menu" popover, parenthetical label suffix dropped in the menu (full label in tooltip), `dev_pipe` now lives under Portfolio and delivery, sidebar auto-collapses between 901 and 1100 px.
- `lrHTML` "show more" button copy fixed. `.screen` entrance animation is 200 ms and starts at opacity .001 (no blank first second).
- `window.coreAfter()` runs after each render (tab aria, hero toggle, scroll cues).

## ROUND 9 ADDENDUM (standing rules)
- CARD CONSISTENCY IS A SHIPPING CHECK. Repeated cards (same class, same row) must share heights and section offsets: badge, value, formula, agent card, toggle row and chips line up across the row. Metric cards use a 7-row subgrid (`.mgrid>.mcard`); every other family is aligned at runtime by `mod_cardalign.js`. Run `NODE_PATH=$(npm root -g) node cardscan.js OUTDIR` with allscreens and spacescan; zero findings is the bar. Absolutely positioned graph nodes are exempt.
- Formula chips (`fchip`) carry `data-k`; hover or focus shows the KPI box (`kpiBox`), and the Clarity lens swaps every chip for an inline mini KPI card (`kpiMini`). Always emit chips through `fchip`.
- Drawer controls (Full screen, Close) live in the sticky `.dctl` bar created in kit2.js; never position controls absolutely over drawer content.
- Large diagrams in drawers fit the width and offer an Enlarge button (drawer full screen) rather than a horizontal scroll.
- Process steps show how they decide (`PROC.modeOf`: Deterministic, AI reasoning, Human judgment, or Rules then judgment; override with `mode:` on a step). Gate steps open a three-path table (pre-approved, AI-reasoned, human) with factors from `PROC.policyFor(screen)` and a try-it simulator.


---
# ROUND 11 ADDENDUM: the Feature Contract (standing rules)

## What exists
- `docs/FEATURE_CONTRACT.md`: the four rules, artifacts, definition of done, evidence, exceptions, naming rule.
- `agents/`: `oukala-process-architect.md`, `oukala-data-integrator.md`, `oukala-metrics-maturity-steward.md`, `oukala-connectivity-steward.md` and the orchestrator `oukala-feature-contract.md` (Claude Code style sub-agent definitions with frontmatter name, description, tools). `skills/oukala-feature-contract/SKILL.md` orchestrates them. One definition, three forms: design-time agents, design-time skill, and the in-product runtime checks below.
- `mod_plat_contract.js/.css`: screen `plat_contract` "Feature contract" (group platform). Tabs: Dashboard, Matrix, The four rules, Agents, Run on a feature, Exceptions, Enforcement.
- `window.CONTRACT`: `rules`, `agents`, `evaluate(featureId)` (screen, module or citizen app id), `matrix()` (every screen, every module without a screen, every citizen app), `run(featureId|manifest)` (agents in sequence, returns `{ev, steps, verdict}`), `stats()`, `evaluateManifest(m)`, `fromDraft(buildDraft)`, `plugGate(CHECKS,R)`, `plugMcp(TOOLS,IMPL)`.
- Gate: four additional conformance checks `ct_process`, `ct_data`, `ct_metrics`, `ct_links` (tier team, so personal apps see them as advice). `mod_plat_gate.js` calls `CONTRACT.plugGate` and `CONTRACT.plugMcp` right after `window.MCPX` is created, guarded. A citizen app may carry a `contract` object (same shape as the manifest below); otherwise a minimal one is derived from its reads and new entities.
- Build a module: `toApp(d)` adds `contract:CONTRACT.fromDraft(d)`, so the review step shows the four checks and Register stays disabled until they pass or an exception is raised.
- MCP: tool `run_feature_contract {feature_id | manifest}`; try it in the console on AI and coding clients, or on a draft in Build a module.
- Records the contract registers for itself (dogfooding): `PROC.reg("plat_contract")` and process `feature_contract` in `PROCLIB`; metrics `m_contract_cov`, `m_contract_full`, `m_contract_gaps`, `m_contract_waivers`, `m_contract_ttc`; entities `contract_finding` (new, thin, references `debt_item`) and `contract_waiver` (extends `exception` by reference), each registered through `ATLAS.addEntity` with the decision logged (`CONTRACT.decisions()`); module `plat_contract` on the Master process flow (pulls Process, Entity, Metric, Maturity and Module records; pushes findings to Technical debt, waivers to the gate, approvals to the inbox); `SEARCHX` records and `ASKX` intents ("run the feature contract on <feature>", "which features fail the contract", "contract waivers", "the four rules").

## Contract manifest (what `run_feature_contract` and `CONTRACT.run` accept)
`{name, purpose, owner, process:{ref?, trigger, steps:[{n,who,owner,sla}]}, data:{reuse:[entityId], extend:[{entity,add:[k]}], new:[{id,label,why,fields:[{k,classification,authority}],dup?}], none?, rationale?}, metrics:[{n,f,owner,tgt,rem}], maturity:{model,target}, links:{modules:[{id,dir:"push|pull",entity}], search, projects, strategy, tickets, people, chat, inbox, approvals, notifications}}`

## Rules of thumb for builders
- Load order is alphabetical, so the contract module loads before the gate, proclib, modmap and debt. Everything that touches them is lazy: `CONTRACT` registers its own entities, module and process in a deferred `wire()` (timeouts), never at load.
- Start from the agents: run `oukala-feature-contract` (or the four in order) before writing the module, paste the manifest into Run on a feature, and fix gaps before you build.
- Score your own screens: `CONTRACT.evaluate("<id>").rules` shows evidence for each rule. Target 4 of 4 before you report.
- A waiver is never a way to skip the work quietly: it needs a reason, the covering control, a named owner and an expiry; it shows on the Feature contract screen and in Technical debt.
- Tests for contract work: build with `--only` including `mod_plat_contract`, `mod_plat_gate`, `mod_plat_build`, `mod_plat_proclib`, `mod_plat_modmap`, `mod_plat_cover`, `mod_plat_atlas`, `mod_plat_debt`, `mod_plat_registry`, `mod_mat`, then one full build; `node --check`; spacescan at 1000, 1440 and phone; cardscan; allscreens; zero console errors; screenshots light, dark and phone.
