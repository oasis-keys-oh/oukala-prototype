/* mod_r16l_b_ui.js (Round 16, Agent L). Resilience screens, part 1: shared helpers, Resilience overview, Resilience framework, Recovery tiers.
   Screens: bc_home, bc_frame, bc_tiers. Helpers are shared with the other mod_r16l_* files through window.BCX.h. */
(function(){
"use strict";
const BX=window.BCX;if(!BX)return;
const G=(f,d)=>{try{const r=f();return r===undefined||r===null?d:r}catch(e){return d}};
const arr=x=>Array.isArray(x)?x:[];
const H=s=>esc(s==null?"":String(s));
const D=BX.D,UI=BX.ui,days=BX.days,date=BX.date,mins=BX.mins;
const ME=()=>{const m=G(()=>typeof INBOX.me==="function"?INBOX.me():INBOX.me,"");return typeof m==="string"&&m?m:"Casey Rowan"};
const nm=v=>v&&typeof v==="object"?(v.name||""):(v||"");
const h=BX.h=BX.h||{};
G(()=>{if(window.STD&&!STD.iso22301)STD.iso22301={n:"ISO 22301",by:"ISO",d:"Business continuity management systems: business impact analysis, strategies, exercising and review"}});
h.H=H;h.ME=ME;h.nm=nm;h.G=G;
const pill=h.pill=(t,c)=>`<span class="pill ${c||"mute"}">${H(t)}</span>`;
h.ppl=n=>n?(typeof pchip==="function"?pchip(n):H(n)):pill("None","bad");
h.bk=n=>n?h.ppl(n):pill("No backup","warn");
h.tierPill=t=>pill(BX.tierLabel(t),t===1?"bad":t===2?"warn":t===3?"info":"mute");
h.tone=BX.tone;
h.lk=(id,label)=>`<button class="rsh-link bc-lk" data-rsh-open="${H(id)}">${H(label||id)}</button>`;
h.dl=(type,id,label)=>`<button class="bc-lk" data-link="${type}:${H(id)}">${H(label||id)}</button>`;
h.tr=(id,label)=>`<button class="bc-lk" data-bc-trace="${H(id)}">${H(label||id)}</button>`;
h.appLk=id=>{const a=BX.app(id);return a?h.lk("BCA-"+id,a.n):H(id)};
h.tbl=(cols,rows,cls)=>`<div class="tscroll"><table class="bc-tbl ${cls||""}"><thead><tr>${cols.map(c=>`<th${c.cls?` class="${c.cls}"`:""}>${H(c.h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td${c.cls?` class="${c.cls}"`:""}>${c.f(r)}</td>`).join("")}</tr>`).join("")||`<tr><td colspan="${cols.length}" class="muted">Nothing matches.</td></tr>`}</tbody></table></div>`;
h.bar=(p,cls)=>`<span class="bc-bar" role="img" aria-label="${Math.round(p)} percent"><i class="${cls||""}" style="width:${Math.max(0,Math.min(100,p))}%"></i></span>`;
h.chips=(items,cur,attr)=>`<div class="bc-chips" role="group">${items.map(i=>`<button type="button" class="chip${i[0]===cur?" on":""}" ${attr}="${H(i[0])}" aria-pressed="${i[0]===cur}">${H(i[1])}</button>`).join("")}</div>`;
h.stPill=s=>pill(s,({Overdue:"bad",Current:"good",Scheduled:"info","Scheduled late":"warn","Due soon":"warn","In progress":"info",Planned:"info",Completed:"good",Cancelled:"mute",Approved:"good",Draft:"warn","In review":"info",Retired:"mute",Active:"bad",Stabilised:"warn",Recovered:"good",Closed:"mute"})[s]||"mute");
h.cell=v=>v==null?`<span class="bc-cell na" title="Not applicable to this application">n/a</span>`:`<span class="bc-cell ${BX.tone(v)}" title="${v}% of the checks in this dimension pass">${v}%</span>`;
h.sim=()=>`<span class="pill info" title="Nothing real is sent or run">Simulated</span>`;
h.ev=(id,label,payload)=>{try{if(!window.EVENTS)return;if(!h.ev.d)h.ev.d={};if(!h.ev.d[id]){h.ev.d[id]=1;EVENTS.register({id,label,module:"bc_home",fields:[{name:"record",type:"string"},{name:"actor",type:"string"},{name:"detail",type:"string"}],owner:"Sam Patel"})}EVENTS.emit(id,payload,{source:"bcdr",actor:ME()})}catch(e){}};
h.notify=(to,t,rec,ev)=>G(()=>{ZLINK.state.notes.unshift({id:"bc"+Date.now()+Math.random().toString(36).slice(2,5),to:arr(to).filter(Boolean),t,ev:ev||"bcdr.notice",rec});if(window.INBOX&&INBOX.refresh)INBOX.refresh()});
h.fw=()=>D().fw.name||"BETH3D";
h.done=(t,dt)=>{BX.log(t,dt);BX.bump();try{BX.sync()}catch(e){}render()};
h.hero=(label,story,extra)=>hero("Resilience",H(label),story,extra||"");
h.fwChip=()=>`<span class="pill metric" title="Resilience framework name; editable on Resilience framework">${H(h.fw())}</span>`;
/* tab state: views() radio state is JS-free; tab data lives in S.v */
const kpi=(l,v,s,o)=>[l,v,s||"",o||{}];

/* ------------------------------------------------------------------ Resilience overview ------------------------------------------------------------------ */
function overview(){
 const R=BX.sync();const st=BX.apps().map(a=>BX.appStats(a.id));const t1=st.filter(s=>s.app.tier===1);const gaps=BX.gaps();
 const sev={bad:0,warn:1,info:2};const attn=gaps.slice().sort((a,b)=>sev[a.sev]-sev[b.sev]).slice(0,9);
 const up=BX.exs().filter(e=>e.status==="Planned"||e.status==="In progress").sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6);
 const decl=BX.D().decl.filter(x=>x.status==="Active"||x.status==="Stabilised");
 const story=`<b>${R.planN} of ${R.planD}</b> Tier 1 and 2 applications have an approved plan. <b>${R.overdue}</b> exercises are overdue. In the last exercise <b>${R.rtoN} of ${R.rtoD}</b> applications met their recovery time and <b>${R.rpoN} of ${R.rpoD}</b> met their recovery point. ${R.spof} single points of failure back Tier 1 applications.`;
 return `<div class="screen bc">${h.hero("Resilience overview",story,`<div class="row">${h.fwChip()}<button class="btn primary" data-bc-act="sched">Schedule an exercise</button><button class="btn" data-bc-go="bc_plans">Continuity plans</button><button class="btn danger" data-bc-go="bc_decl">Declare disaster</button></div>`)}${lensNote()}
 ${decl.length?`<div class="bc-alert glass"><b>${decl.length} active declaration${decl.length>1?"s":""}</b> ${decl.map(x=>h.lk(x.id,x.id+" "+x.title)).join(", ")} ${h.sim()}</div>`:""}
 ${kpiRow([["Plan coverage",R.plan+"%",R.planN+" of "+R.planD+" Tier 1 and 2 applications",{metric:"m_bc_plan_cov"}],["Exercise compliance",R.exComp+"%",R.exN+" of "+R.exD+" applications on schedule",{metric:"m_bc_ex_comp"}],["Recovery time attainment",R.rto+"%",R.rtoN+" of "+R.rtoD+" met RTO",{metric:"m_bc_rto_att"}],["Recovery point attainment",R.rpo+"%",R.rpoN+" of "+R.rpoD+" met RPO",{metric:"m_bc_rpo_att"}],["Single points of failure",R.spof,"behind Tier 1 applications",{metric:"m_bc_spof",keep:true}],["Tier 1 maturity",R.mat.toFixed(1),"average of 5 levels",{metric:"m_bc_maturity"}]])}
 <div class="bc-two wide">${card("Tier 1 readiness by application","Each row is a Tier 1 (Alpha) application. Targets come from the tier policy; achieved values come from the last completed exercise.",h.tbl([{h:"Application",f:s=>h.appLk(s.app.id)},{h:"Plan",f:s=>s.plan?h.lk(s.plan.id,s.plan.id)+" "+h.stPill(s.plan.status):pill("None","bad")},{h:"Last exercise",f:s=>s.last?h.lk(s.last.id,date(s.last.date)):pill("Never","bad")},{h:"RTO achieved / target",f:s=>s.rtoA==null?"-":`<span class="${s.rtoOk?"bc-ok":"bc-miss"}">${mins(s.rtoA)}</span> / ${mins(s.app.rtoT)}`},{h:"RPO achieved / target",f:s=>s.rpoA==null?"-":`<span class="${s.rpoOk?"bc-ok":"bc-miss"}">${mins(s.rpoA)}</span> / ${mins(s.app.rpoT)}`},{h:"Next exercise",f:s=>h.stPill(s.obl.status)+` <span class="small muted">${date(s.obl.due)}</span>`},{h:"Maturity",f:s=>pill("L"+s.lvl+" "+BX.ML[s.lvl],s.lvl>=4?"good":s.lvl>=3?"info":s.lvl>=2?"warn":"bad")}],t1))}
  ${card("Needs attention","Gaps across plans, exercises, CIs, data, vendors, equipment and people, most severe first.",attn.length?h.tbl([{h:"Severity",f:g=>pill(g.sev==="bad"?"High":g.sev==="warn"?"Medium":"Low",g.sev)},{h:"What",f:g=>H(g.what)},{h:"Owner",f:g=>g.own?h.ppl(g.own):'<span class="muted">Unassigned</span>'},{h:"",f:g=>`<button class="btn quiet sm" data-bc-gapopen="${H(g.type)}:${H(g.ref)}">Open</button>`}],attn)+`<button class="btn" data-bc-go="bc_trace" data-bc-tab="2">All ${gaps.length} gaps</button>`:'<p class="muted">No gaps found.</p>',fchip("m_bc_ex_comp"))}</div>
 <div class="bc-two">${card("Readiness by dimension ("+H(h.fw())+")","Average pass rate of the checks in each dimension across all applications. Data is the dimension added to BETH3.",D().fw.dims.map(d=>`<div class="bc-dimrow"><span class="bc-letter" style="--c:var(${d.tone})">${H(d.letter)}</span><span class="bc-dn">${H(d.n)}</span>${h.bar(R.dimAvg[d.k],BX.tone(R.dimAvg[d.k]))}<b>${R.dimAvg[d.k]}%</b></div>`).join("")+`<button class="btn" data-bc-go="bc_frame">Open the framework</button>`)}
  ${card("Next exercises","Planned and in-progress exercises. A red flag means a conflict with a freeze, window or open change.",up.length?h.tbl([{h:"Exercise",f:e=>h.lk(e.id,e.id)+"<br>"+H(e.title||(BX.app(BX.exApp(e))||{n:e.scn}).n)},{h:"Type",f:e=>H(BX.TYPEN[e.type])},{h:"Date",f:e=>date(e.date)},{h:"Status",f:e=>h.stPill(e.status)},{h:"Conflicts",f:e=>{const c=BX.conflictsOf(e).filter(x=>x[0]==="bad");return c.length?pill(c.length+" blocking","bad"):pill("None","good")}}],up)+`<button class="btn" data-bc-go="bc_cal">Open the Exercise calendar</button>`:'<p class="muted">Nothing is scheduled.</p>')}</div>
 ${card("Maturity by application and dimension","Percent of checks passing. n/a means the dimension does not apply (no vendor, for example). Click an application for its continuity record.",heat(st),fchip("m_bc_maturity"))}
 ${procCard("bc_home")}</div>`}
function heat(st){const dims=D().fw.dims;
 return h.tbl([{h:"Application",f:s=>h.appLk(s.app.id)},{h:"Tier",f:s=>h.tierPill(s.app.tier)}].concat(dims.map(d=>({h:d.letter+" "+d.n.split(":")[0].split(" ")[0],cls:"c",f:s=>h.cell(s.dims[d.k])}))).concat([{h:"Level",cls:"c",f:s=>pill("L"+s.lvl,s.lvl>=4?"good":s.lvl>=3?"info":s.lvl>=2?"warn":"bad")}]),st.slice().sort((a,b)=>a.app.tier-b.app.tier||a.lvl-b.lvl))+legend([["80% or more","--good"],["50 to 79%","--warn"],["Under 50%","--bad"]])}
BX.heat=heat;

/* ------------------------------------------------------------------ Resilience framework ------------------------------------------------------------------ */
const lvlOf=p=>p<30?1:p<50?2:p<70?3:p<85?4:5;
function framework(){
 const R=BX.sync();const fw=D().fw;
 const dimCards=fw.dims.map((d,i)=>{const sc=R.dimAvg[d.k],lv=lvlOf(sc);
  return `<article class="card glass bc-dim"><div class="bc-dimhead"><span class="bc-letter lg" style="--c:var(${d.tone})">${H(d.letter)}</span><div><h3>${H(d.n)}</h3><div class="small muted">${H(d.scope)}</div></div></div>
  <div class="row bc-dimstat"><span class="pill ${BX.tone(sc)}">Readiness ${sc}%</span><span class="pill info">Level ${lv} of 5</span><span class="pill mute">Target level ${d.target}</span>${d.k==="D"?'<span class="pill metric">New dimension</span>':""}</div>
  <h4 class="bc-h">Guidance questions</h4><ol class="bc-ol">${d.q.map(q=>`<li>${H(q)}</li>`).join("")}</ol>
  <h4 class="bc-h">Maturity levels</h4><ol class="bc-ol bc-lvl">${d.lv.map((l,j)=>`<li class="${j+1===lv?"cur":""}${j+1===d.target?" tgt":""}"><b>${j+1} ${BX.ML[j+1]}.</b> ${H(l)}</li>`).join("")}</ol>
  <div class="row sp"><span class="small muted">Owner ${h.ppl(d.own||"Sam Patel")} · backup ${h.bk(d.bak||"Tom Becker")}</span><button class="btn sm" data-bc-act="editdim" data-id="${i}">Edit definition</button></div></article>`}).join("");
 const nameOpts=fw.opts.map((o,i)=>`<div class="bc-opt${o.n===fw.name?" on":""}"><div><b class="bc-nm">${H(o.n)}</b>${o.n===fw.name?' <span class="pill good">In use</span>':""}<div class="small muted">${H(o.why)}</div></div><button class="btn sm${o.n===fw.name?" quiet":""}" data-bc-act="usename" data-id="${i}" ${o.n===fw.name?"disabled":""}>Use this name</button></div>`).join("");
 const letters=fw.dims.slice().sort((a,b)=>"BETH3D".indexOf(a.letter)-"BETH3D".indexOf(b.letter));
 const assess=h.tbl([{h:"Dimension",f:d=>`<span class="bc-letter" style="--c:var(${d.tone})">${H(d.letter)}</span> ${H(d.n)}`},{h:"Readiness",f:d=>h.bar(R.dimAvg[d.k],BX.tone(R.dimAvg[d.k]))+" <b>"+R.dimAvg[d.k]+"%</b>"},{h:"Level reached",f:d=>pill(lvlOf(R.dimAvg[d.k])+" "+BX.ML[lvlOf(R.dimAvg[d.k])],lvlOf(R.dimAvg[d.k])>=d.target?"good":"warn")},{h:"Target",f:d=>d.target+" "+BX.ML[d.target]},{h:"Gap",f:d=>lvlOf(R.dimAvg[d.k])>=d.target?pill("Met","good"):pill((d.target-lvlOf(R.dimAvg[d.k]))+" level"+(d.target-lvlOf(R.dimAvg[d.k])>1?"s":"")+" short","warn")},{h:"Owner and backup",f:d=>h.ppl(d.own||"Sam Patel")+" "+h.bk(d.bak||"Tom Becker")}],fw.dims);
 return `<div class="screen bc">${h.hero("Resilience framework",`The framework is named <b>${H(fw.name)}</b> and has <b>6 dimensions</b>. Data is new: it covers backups, replication, recovery points, lineage, classification, retention and integrity. Dimensions are assessed from live records; readiness ranges from ${Math.min(...Object.values(R.dimAvg))}% to ${Math.max(...Object.values(R.dimAvg))}%.`,`<div class="row">${h.fwChip()}<button class="btn primary" data-bc-act="editname">Rename the framework</button></div>`)}${lensNote()}
 ${views("bc_fw",["Dimensions","Name","Assessment","History"],[
  `<div class="bc-two bc-dims">${dimCards}</div>`,
  card("Name the framework","The name is a label: nothing in the data depends on it, so changing it is safe. Pick one of three proposals or type your own. It appears in headings across the Resilience screens.",
   `<div class="bc-nameedit"><label class="small muted" for="bc-name-in">Framework name</label><div class="row"><input id="bc-name-in" class="bc-in" value="${H(fw.name)}" maxlength="24" aria-label="Framework name"><button class="btn primary" data-bc-act="savename">Save name</button></div></div>
   <h4 class="bc-h">Three options</h4>${nameOpts}
   <h4 class="bc-h">How the letters map</h4><div class="bc-letters">${letters.map(d=>`<div class="bc-lt"><span class="bc-letter lg" style="--c:var(${d.tone})">${H(d.letter)}</span><span class="small">${H(d.n)}</span></div>`).join("")}</div><p class="small muted">The original BETH3 reads Buildings, Equipment, Technology, Human resources and the 3 for Third parties. The default BETH3D keeps that order and appends D for Data.</p>`),
  card("Assessment against target level","Readiness is the average pass rate across applications. Level bands: under 30% = 1, under 50% = 2, under 70% = 3, under 85% = 4, otherwise 5. Targets are editable on each dimension.",assess+`<p class="small muted">Formula: pass rate of the dimension's checks per application ÷ applications where the dimension applies. Sources: Continuity plans, Exercise calendar, CMDB, Third-party risk and the data asset register.</p>`,fchip("m_bc_maturity")),
  card("Framework history","Each change to the name or a dimension is recorded here and in the audit trail.",h.tbl([{h:"Version",f:x=>H(x.v)},{h:"Date",f:x=>date(x.date)},{h:"By",f:x=>H(x.by)},{h:"Change",f:x=>H(x.change)}],fw.history.slice().reverse()))])}
 ${procCard("bc_frame")}</div>`}
function dimForm(i){const d=D().fw.dims[i];if(!d)return;
 openForm({id:"bc_dim",title:"Edit "+d.n,story:"Change the scope, the guidance questions (one per line) or the five maturity descriptions (one per line). The change is recorded in the framework history.",submit:"Save dimension",
  fields:[{k:"n",label:"Name",type:"text",req:true},{k:"letter",label:"Letter",type:"text",req:true,help:"One character shown in the framework name"},{k:"scope",label:"Scope",type:"longtext",wide:true},{k:"q",label:"Guidance questions",type:"longtext",wide:true,help:"One question per line"},{k:"lv",label:"Maturity levels 1 to 5",type:"longtext",wide:true,help:"Exactly five lines, level 1 first"},{k:"target",label:"Target level",type:"range",min:1,max:5},{k:"own",label:"Owner",type:"people",req:true},{k:"bak",label:"Backup",type:"people",req:true}],
  defaults:{n:d.n,letter:d.letter,scope:d.scope,q:d.q.join("\n"),lv:d.lv.join("\n"),target:d.target,own:d.own||"Sam Patel",bak:d.bak||"Tom Becker"},
  onSubmit:v=>{const lv=String(v.lv).split("\n").map(s=>s.trim()).filter(Boolean);if(lv.length!==5){toast("Maturity levels need exactly five lines","warn");return}if(nm(v.own)===nm(v.bak)){toast("The backup must be a different person","warn");return}
   d.n=v.n;d.letter=String(v.letter).trim().slice(0,1)||d.letter;d.scope=v.scope;d.q=String(v.q).split("\n").map(s=>s.trim()).filter(Boolean);d.lv=lv;d.target=+v.target||3;d.own=nm(v.own);d.bak=nm(v.bak);
   D().fw.history.push({v:String(D().fw.history.length+1),date:BX.TODAY,by:ME(),change:"Edited dimension "+d.n});h.ev("bcdr.framework_updated","Resilience framework updated",{record:"fw:"+d.k,actor:ME(),detail:d.n});h.done("Edited framework dimension",d.n);toast("Dimension saved","good");closeDrawer()}})}
function nameForm(){openForm({id:"bc_name",title:"Rename the framework",story:"Pick any name. The three proposals are on the Name tab. The change is recorded in the history.",submit:"Save name",fields:[{k:"n",label:"Framework name",type:"text",req:true}],defaults:{n:D().fw.name},onSubmit:v=>setName(v.n)})}
function setName(n){n=String(n||"").trim();if(!n)return toast("Enter a name","warn");const old=D().fw.name;D().fw.name=n;D().fw.history.push({v:String(D().fw.history.length+1),date:BX.TODAY,by:ME(),change:"Renamed from "+old+" to "+n});h.ev("bcdr.framework_updated","Resilience framework updated",{record:"fw:name",actor:ME(),detail:old+" to "+n});h.done("Renamed resilience framework",old+" to "+n);toast("Framework is now "+n,"good");closeDrawer()}

/* ------------------------------------------------------------------ Recovery tiers ------------------------------------------------------------------ */
UI.tiF=UI.tiF||0;
function tiers(){
 const R=BX.sync();const d=D();const obl=BX.obligations();const apps=BX.apps();
 const pol=h.tbl([{h:"Tier",f:t=>h.tierPill(t.t)},{h:"CMDB criticality",f:t=>H(t.crit)},{h:"RTO",f:t=>mins(t.rto)},{h:"RPO",f:t=>mins(t.rpo)},{h:"MTD",f:t=>mins(t.mtd)},{h:"Exercise",f:t=>`<b>${H(BX.TYPEN[t.type])}</b><br><span class="small muted">every ${t.months} months${t.type==="alternate"?"; the other type the next year":""}</span>`},{h:"Window",f:t=>t.wins.map(w=>H((BX.winOf(w)||{n:w}).n)).join(", ")},{h:"Notice",f:t=>t.notice+" days"},{h:"Approver group",f:t=>H(BX.groupName(t.grp))},{h:"Applications",f:t=>apps.filter(a=>a.tier===t.t).length},{h:"",f:t=>`<button class="btn sm" data-bc-act="edittier" data-id="${t.t}">Edit</button>`}],d.tiers);
 const fl=UI.tiF;const rows=obl.filter(o=>!fl||o.tier===fl).sort((a,b)=>a.tier-b.tier||a.due.localeCompare(b.due));
 const oblT=h.tbl([{h:"Application",f:o=>h.appLk(o.app.id)},{h:"Tier",f:o=>h.tierPill(o.tier)},{h:"Required exercise",f:o=>H(o.typeName)},{h:"Due",f:o=>date(o.due)+`<br><span class="small muted">${H(o.basis)}</span>`},{h:"Status",f:o=>h.stPill(o.status)+(o.sched?`<br>${h.lk(o.sched.id,o.sched.id+" "+date(o.sched.date))}`:"")},{h:"Last exercise",f:o=>o.last?h.lk(o.last.id,date(o.last.date))+" "+(o.pass?(o.pass.rto&&o.pass.rpo?pill("Targets met","good"):pill("Missed","bad")):""):pill("Never","bad")},{h:"",f:o=>o.status==="Overdue"||o.status==="Due soon"||o.status==="Current"&&!o.sched?`<button class="btn sm" data-bc-act="sched" data-app="${o.app.id}">Schedule</button>`:""}],rows);
 const ciRows=()=>BX.allCis().filter(c=>c.tier).map(c=>{const o=BX.ciObligation(c.id);return{id:c.id,name:c.name,cls:c.class,tier:c.tier,apps:c.apps.map(a=>a.n).join(", "),own:c.own||"",dr:BX.DRL[c.dr],red:c.red,req:o.required,cov:o.covered?(o.live?"Live":"Tabletop"):"Not covered",last:o.last?o.last.date:""}});
 const cis=typeof btHTML==="function"?btHTML({id:"bc_tier_ci",cols:[{k:"name",label:"Configuration item",fmt:r=>`<button class="bc-lk" data-link="ci:${H(r.id)}">${H(r.name)}</button>`,val:r=>r.name,wrap:1},{k:"cls",label:"Class",val:r=>r.cls},{k:"tier",label:"Inherited tier",fmt:r=>h.tierPill(r.tier),val:r=>r.tier},{k:"apps",label:"Supports",val:r=>r.apps,wrap:1},{k:"req",label:"Required",val:r=>r.req},{k:"cov",label:"Exercise coverage",fmt:r=>pill(r.cov,r.cov==="Not covered"?"bad":r.cov==="Live"?"good":"info"),val:r=>r.cov},{k:"last",label:"Last exercise",fmt:r=>r.last?date(r.last):"-",val:r=>r.last},{k:"own",label:"Recovery owner",fmt:r=>r.own?H(r.own):pill("None","bad"),val:r=>r.own}],rows:ciRows,key:"id",h:460,rowH:44,facets:["tier","cov"],exportName:"ci-obligations"}):"";
 const cl=h.tbl([{h:"Application",f:a=>h.appLk(a.id)},{h:"CMDB criticality",f:a=>H(a.critName)},{h:"Tier",f:a=>h.tierPill(a.tier)},{h:"Source",f:a=>H(a.override?"Reclassified by "+a.override.by:a.src)},{h:"Reason",f:a=>H(a.override?a.override.reason:"Follows the service catalog tier")},{h:"",f:a=>`<button class="btn sm" data-bc-act="reclass" data-app="${a.id}">Change</button>`}],apps.slice().sort((a,b)=>a.tier-b.tier));
 const map=h.tbl([{h:"CMDB business criticality",f:r=>H(r[0])},{h:"Recovery tier",f:r=>`<select class="bc-in" data-bc-map="${H(r[0])}" aria-label="Tier for ${H(r[0])}">${[1,2,3,4].map(t=>`<option value="${t}" ${t===r[1]?"selected":""}>${H(BX.tierLabel(t))}</option>`).join("")}</select>`},{h:"Applications",f:r=>apps.filter(a=>a.critName===r[0]).length}],Object.entries(d.map));
 return `<div class="screen bc">${h.hero("Recovery tiers",`Tiers come from the CMDB business criticality. <b>${apps.filter(a=>a.tier===1).length}</b> applications are Tier 1 (Alpha) and need an annual live failover; Tier 2 alternates live and tabletop. <b>${R.overdue}</b> applications are overdue for the exercise their tier requires.`,`<div class="row">${h.fwChip()}<button class="btn primary" data-bc-act="sched">Schedule an exercise</button></div>`)}${lensNote()}
 ${kpiRow([["Tier 1 (Alpha)",apps.filter(a=>a.tier===1).length,"live failover yearly"],["Tier 2",apps.filter(a=>a.tier===2).length,"live, then tabletop"],["Tier 3",apps.filter(a=>a.tier===3).length,"tabletop yearly"],["Tier 4",apps.filter(a=>a.tier===4).length,"documented review"],["Overdue",R.overdue,"exercises past due",{metric:"m_bc_ex_comp",keep:true}],["CIs with a tier",BX.allCis().filter(c=>c.tier).length,"inherited from applications"]])}
 ${views("bc_tiers",["Policy","Obligations","CIs","Classification"],[
  card("Tier policy","One row per tier. RTO is the recovery time objective, RPO the recovery point objective (data you can lose) and MTD the maximum tolerable downtime. All values are minutes behind the scenes and editable.",pol+`<p class="small muted">${stdChip("iso22301","Business continuity management: business impact analysis sets RTO, RPO and MTD per tier")} ${stdChip("nist","Contingency planning: exercise type and frequency follow the impact level")}</p>`,fchip("m_bc_ex_comp")),
  card("Computed exercise obligations","Required type and due date for every application, from the policy and its last completed exercise. A missed target forces a re-test.",`<div class="row" style="gap:8px;margin-bottom:10px">${h.chips([["0","All"],["1","Tier 1"],["2","Tier 2"],["3","Tier 3"],["4","Tier 4"]],String(fl),"data-bc-tif")}</div>`+oblT),
  card("Obligations per CI","A CI inherits the strictest tier of every application that depends on it. Coverage means the CI sat inside a completed exercise within the tier cycle.",cis),
  card("Classification","CMDB criticality maps to a tier. Changing an application's criticality is a reclassification and goes to its approver group.",map+cl)])}
 ${procCard("bc_tiers")}</div>`}
function tierForm(t){const x=BX.tierOf(+t);if(!x)return;
 openForm({id:"bc_tier",title:"Edit "+x.n+(x.t===1?" (Alpha)":""),story:"Changing a tier changes the obligations of every application in it. Targets are in minutes: 240 is four hours, 1440 is one day.",submit:"Save tier policy",
  fields:[{section:"Objectives"},{k:"rto",label:"RTO (minutes)",type:"number",req:true},{k:"rpo",label:"RPO (minutes)",type:"number",req:true},{k:"mtd",label:"MTD (minutes)",type:"number",req:true},{section:"Exercise policy"},{k:"type",label:"Required exercise",type:"select",opts:[["live","Live failover every cycle"],["alternate","Live failover one cycle, tabletop the next"],["tabletop","Tabletop every cycle"],["review","Documented review every cycle"]]},{k:"months",label:"Cycle (months)",type:"number"},{k:"wins",label:"Approved windows for live exercises",type:"multi",opts:D().wins.map(w=>[w.id,w.n])},{k:"notice",label:"Notice before a live exercise (days)",type:"number"},{k:"retest",label:"Re-test within (days) after a missed target",type:"number"},{k:"grp",label:"Approver group",type:"select",opts:D().groups.map(g=>[g.id,g.n]),help:"Approvals route to a group, never to a person"}],
  defaults:{rto:x.rto,rpo:x.rpo,mtd:x.mtd,type:x.type,months:x.months,wins:x.wins,notice:x.notice,retest:x.retest,grp:x.grp},
  live:v=>`<p class="story">Applies to <b>${BX.apps().filter(a=>a.tier===x.t).length}</b> applications. ${+v.rto>+v.mtd?'<b class="bc-miss">RTO is longer than MTD; recovery would exceed what the business tolerates.</b>':"RTO fits inside MTD."}</p>`,
  onSubmit:v=>{if(+v.rto>+v.mtd){toast("RTO cannot exceed MTD","warn");return}Object.assign(x,{rto:+v.rto,rpo:+v.rpo,mtd:+v.mtd,type:v.type,months:+v.months||12,wins:arr(v.wins).length?v.wins:x.wins,notice:+v.notice||0,retest:+v.retest||180,grp:v.grp});h.ev("bcdr.tier_policy_changed","Recovery tier policy changed",{record:"tier:"+x.t,actor:ME(),detail:x.n});h.done("Edited recovery tier policy",x.n);toast(x.n+" policy saved","good");closeDrawer()}})}
function reclassForm(appId){const a=BX.app(appId);if(!a)return;
 openForm({id:"bc_reclass",title:"Change classification: "+a.n,story:"The new criticality maps to a tier through the mapping on this screen. A change to Tier 1 or 2 is sent to the application's approver group.",submit:"Reclassify",
  fields:[{k:"crit",label:"CMDB business criticality",type:"select",opts:[1,2,3,4].map(n=>[String(n),BX.critName(n)])},{k:"reason",label:"Reason",type:"longtext",req:true,wide:true}],defaults:{crit:String(a.crit),reason:""},
  live:v=>{const tn=D().map[BX.critName(+v.crit)]||+v.crit;return `<p class="story">Becomes <b>${H(BX.tierLabel(tn))}</b>: RTO ${mins(BX.tierOf(tn).rto)}, RPO ${mins(BX.tierOf(tn).rpo)}, ${H(BX.TYPEN[BX.tierOf(tn).type].toLowerCase())}. Approver group: ${H(BX.groupName(BX.tierOf(tn).grp))}.</p>`},
  onSubmit:v=>{D().cls[a.id]={crit:+v.crit,reason:v.reason,by:ME(),at:BX.TODAY};h.notify(BX.groupMembers(BX.tierOf(D().map[BX.critName(+v.crit)]||+v.crit).grp),a.n+" reclassified to "+BX.critName(+v.crit),a.id,"bcdr.reclassified");h.ev("bcdr.reclassified","Application reclassified",{record:a.id,actor:ME(),detail:BX.critName(+v.crit)});h.done("Reclassified application",a.n+" to "+BX.critName(+v.crit));toast(a.n+" reclassified; approver group notified","good");closeDrawer()}})}

/* ------------------------------------------------------------------ registrations and events ------------------------------------------------------------------ */
const IC={home:"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",frame:"M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM17 13v7M13.5 16.5h7",tiers:"M4 6h16M4 12h12M4 18h8",cal:"M5 5h14v15H5zM5 10h14M9 3v4M15 3v4M9 14h2M13 14h2",plan:"M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5",trace:"M5 6a2 2 0 100 4 2 2 0 000-4zM19 4a2 2 0 100 4 2 2 0 000-4zM19 16a2 2 0 100 4 2 2 0 000-4zM7 8l10-3M7 9l10 8",met:"M4 19V9M10 19V5M16 19v-7M22 19H2",decl:"M12 3l9 16H3zM12 10v4M12 17h.01"};
BX.IC=IC;
REG("bc_home","Resilience overview","platform",IC.home,overview);
REG("bc_frame","Resilience framework","platform",IC.frame,framework);
REG("bc_tiers","Recovery tiers","platform",IC.tiers,tiers);

document.addEventListener("click",e=>{
 const g=e.target.closest("[data-bc-go]");if(g){go(g.dataset.bcGo);if(g.dataset.bcTab){S.v.bc_trace=+g.dataset.bcTab;setTimeout(render,0)}return}
 const f=e.target.closest("[data-bc-tif]");if(f){UI.tiF=+f.dataset.bcTif;render();return}
 const a=e.target.closest("[data-bc-act]");if(!a)return;const act=a.dataset.bcAct;
 if(act==="editdim")dimForm(+a.dataset.id);
 else if(act==="editname")nameForm();
 else if(act==="usename")setName(D().fw.opts[+a.dataset.id].n);
 else if(act==="savename"){const el=document.getElementById("bc-name-in");setName(el&&el.value)}
 else if(act==="edittier")tierForm(a.dataset.id);
 else if(act==="reclass")reclassForm(a.dataset.app);
});
document.addEventListener("change",e=>{const m=e.target.closest("[data-bc-map]");if(!m)return;D().map[m.dataset.bcMap]=+m.value;h.ev("bcdr.tier_policy_changed","Recovery tier policy changed",{record:"map",actor:ME(),detail:m.dataset.bcMap});h.done("Changed criticality to tier mapping",m.dataset.bcMap+" to tier "+m.value);toast("Mapping saved","good")});
})();
