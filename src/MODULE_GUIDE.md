# Oukala module guide (read fully before writing code)

Oukala is a single-file prototype (no backend) of an AI-native enterprise work platform (PPM, ITSM, ITOM, knowledge, workflow, AI governance). You are building ONE OR MORE feature modules as `mod_<name>.js` (+ optional `mod_<name>.css`) in `/tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/`. Omar (CIO, first customer is "Meridian Standards Foundation", a ~FAF-sized standards body; Microsoft E5 assumed) wants to SEE forms, features, working interactions. Not mockups of boxes: working prototypes with realistic data.

## Hard rules
1. Do NOT edit any shared file (data*.js, ui.js, kit.js, screens*.js, style*.css, build.py). Only create your `mod_*.js/.css`. If you need a shared change, write it in your final report.
2. Wrap your JS in an IIFE `(function(){ ... })();`. All globals from shared files are readable (see list). Namespace every data attribute and CSS class with your module prefix (e.g. `data-itsm-...`, `.itsm-...`). Never reuse names from other modules.
3. Register screens with `REG(id, name, group, iconPath, renderFn)` where iconPath is an SVG path `d` string for a 24x24 viewBox, stroke style (like the ones in SCREENS in data.js; draw something simple and meaningful, e.g. "M4 6h16M4 12h16M4 18h10"). group is one of: portfolio, service, ops, know, people, automate, ai, platform. renderFn returns an HTML string. Re-render with `render()`. Persist your state on `S.<prefix>` (create inside your IIFE: `S.itsm=S.itsm||{...}`).
4. Event handling: add your own delegated `document.addEventListener("click"/"input"/"change"/"keydown", ...)` that only reacts to YOUR namespaced attributes (use `e.target.closest("[data-yourattr]")`). Call `audit("did something","detail")` for every user action that changes something. Call `toast("Saved","good")` for feedback.
5. Design rules (Omar's, non-negotiable):
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
6. Data realism: Meridian Standards Foundation, people from `PEOPLE`, vendors Lumen (search/indexing vendor), existing projects PR1..PR4, systems like Codification Platform, Contract Repository, Lease subledger (ERP), Azure, Entra ID, M365. Dates: today is Tue Oct 6 2026 (work calendar helpers fmtD/wdOf). Money via `money(n)` or `K$(n)`.
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
