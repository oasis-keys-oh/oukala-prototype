/* ===== Round 18, E: executive lenses and the strategy enablement map. Every executive weighs value against cost and risk; a lens picks the figures that lead.
   Screens r18_lens (Oversee) and r18_strategy. R18.lensHome() puts a strip on every home. Figures are modeled from the builds and labeled illustrative. ===== */
(function(){
"use strict";
const W=window,D=document;const R18=W.R18;if(!R18)return;
const {G,H,arr,pill,usd}=R18;const ST=R18.st;
const n0=n=>Math.round(n).toLocaleString("en-US");

/* ---------- the figures every lens draws from ---------- */
function F(){const P=R18.portfolio();const ac=G(()=>R18.access.stats(),{pending:0,over:0,exp:0,soon:0});
 const rows=P.rows;const aiRows=rows.filter(r=>arr(r.a.ai).length);
 const aiVal=aiRows.reduce((s,r)=>s+r.v.gross,0),aiCost=rows.reduce((s,r)=>s+(r.a.aiCost||0),0);
 const high=rows.reduce((s,r)=>s+R18.debt(r.a.id).filter(d=>d.sev==="High").length,0);
 const fails=rows.reduce((s,r)=>s+R18.conf(r.a.id).fail,0);
 const dup=rows.filter(r=>R18.scale(r.a.id).similar.length).length;
 const killOk=rows.filter(r=>R18.kill.tested(r.a.id)).length;
 const gone=rows.filter(r=>r.m.ownerGone).length;
 const objs=R18.objectives();const hit=o=>rows.filter(r=>r.m.obj===o.id);
 const bare=objs.filter(o=>!hit(o).length);
 const tied=rows.filter(r=>r.m.obj).length;
 const sec=rows.reduce((s,r)=>s+((R18.facets(r.a.id).find(f=>f.k==="security")||{}).s==="active"?1:0),0);
 return{P,ac,rows,aiRows,aiVal,aiCost,high,fails,dup,killOk,gone,objs,bare,tied,sec,hit}}

/* ---------- the lenses ---------- */
const L=R18.LENSES=[
 {id:"coo",short:"COO",name:"Chief Operating Officer",balance:"Throughput against cost to serve",q:"Where does work stall, and what is ready to scale?",
  v:["Throughput gained",f=>[["Hours returned a month",n0(f.P.hours),"people time no longer spent on the manual steps"],["Builds ready to scale",f.P.scaleReady+" of "+f.P.n,"another team already does something similar, or enough people use it"],["Builds in use",f.P.n,f.P.users+" people use them"]]],
  c:["Cost to serve",f=>[["Run cost a month",usd(f.P.cost),"platform, connectors and AI"],["Duplicate builds",f.dup,"overlap with another build; merge before more are made"],["Handoffs to a person",f.rows.reduce((s,r)=>s+R18.process(r.a.id).counts.human,0),"steps across all builds that wait on someone"]]],
  r:["Operating risk",f=>[["Builds without a backup owner",f.P.noOwner,"work stops if the owner is out"],["Owner has left",f.gone,"nobody is accountable"],["High-severity debt",f.high,"decisions that will not scale"]]],
  say:"Modeled net value is {net} a month across {n} builds. {stall} of {n} builds have no backup owner."},
 {id:"cfo",short:"CFO",name:"Chief Financial Officer",balance:"Spend against profitability",q:"Where is the money going, and is it controlled?",
  v:["Value realized",f=>[["Modeled net a month",usd(f.P.net),"hours returned at the set rate, less run cost"],["Gross value a month",usd(f.P.gross),"at "+usd(ST.rate)+" an hour"],["Value per dollar spent",f.P.cost?(f.P.gross/f.P.cost).toFixed(1)+"x":"n/a","gross value over run cost"]]],
  c:["Spend",f=>[["Run cost a month",usd(f.P.cost),"all builds"],["AI spend a month",usd(f.aiCost),"model usage through the gateway"],["Builds not tied to a strategy",f.P.unlinked,"spend with no stated purpose in the strategy"]]],
  r:["Spend outside control",f=>[["Models called outside the gateway",f.P.aiDirect,"uncapped spend"],["Builds without an owner",f.P.noOwner,"no one answers for the cost"],["Data access waiting",f.ac.pending,"value held up by approvals"]]],
  say:"Modeled net value is {net} a month for {cost} of run cost. {unl} of {n} builds are not tied to a strategic objective."},
 {id:"caio",short:"CAIO",name:"Chief AI Officer",balance:"AI value against AI risk",q:"What would a CAIO make us do, done for us?",
  v:["AI value",f=>[["Builds using AI",f.aiRows.length+" of "+f.P.n,"inventoried automatically"],["Value from AI builds a month",usd(f.aiVal),"gross, modeled"],["Reuse of AI builds",f.aiRows.filter(r=>R18.scale(r.a.id).ready).length,"AI builds ready to offer to other teams"]]],
  c:["AI cost",f=>[["AI spend a month",usd(f.aiCost),"through the gateway, with caps"],["Builds with a cap",f.aiRows.filter(r=>arr(r.a.ai).every(x=>x.gw&&x.cap)).length+" of "+f.aiRows.length,"every model use has a monthly cap"],["Gateway coverage",f.aiRows.length?Math.round(100*f.aiRows.filter(r=>arr(r.a.ai).every(x=>x.gw)).length/f.aiRows.length)+"%":"100%","model calls that pass the gateway"]]],
  r:["AI risk",f=>[["Ungoverned model use",f.P.aiDirect,"calls made outside the gateway"],["Over-privileged builds",f.ac.over,"personal tier holding confidential data"],["Kill switch not tested",f.rows.length-f.killOk,"cannot be stopped on demand yet"]]],
  say:"{ai} of {n} builds use AI. {direct} call a model outside the gateway. {noks} of {n} builds have a kill switch that has never been tested."},
 {id:"ceo",short:"CEO",name:"Chief Executive Officer",balance:"Strategic progress against investment",q:"How does every function enable our strategy?",
  v:["Strategic progress",f=>[["Objectives with enabling work",(f.objs.length-f.bare.length)+" of "+f.objs.length,"at least one build advances it"],["Builds tied to strategy",f.tied+" of "+f.P.n,"each names the objective it advances"],["Functions building",new Set(f.rows.map(r=>r.m.fn)).size,"of "+R18.FUNCTIONS.length+" functions have a build"]]],
  c:["Investment",f=>[["Run cost a month",usd(f.P.cost),"all builds"],["Net value a month",usd(f.P.net),"modeled"],["People using builds",f.P.users,"across the organization"]]],
  r:["Strategic gaps",f=>[["Objectives with no enabling work",f.bare.length,f.bare.map(o=>o.n||o.name).slice(0,2).join(", ")||"none"],["Builds not tied to strategy",f.P.unlinked,"effort with no stated aim"],["Owner has left",f.gone,"work with no accountable person"]]],
  say:"{cov} of {obj} objectives have enabling work. {unl} of {n} builds are not tied to any objective."},
 {id:"ciso",short:"CISO",name:"Chief Information Security Officer",balance:"Security against cost",q:"Can I prove control without blocking people?",
  v:["Control proven",f=>[["Builds with security active",f.sec+" of "+f.P.n,"all gate checks pass"],["Guardrail coverage",f.P.cov+"%","average across the eight guardrails"],["Access decided by policy",(f.ac.pol||0)+"%","no person needed for safe requests"]]],
  c:["Friction and cost",f=>[["Average time to decide access",(f.ac.avg||0).toFixed(1)+" days","excluding policy decisions"],["Requests waiting",f.ac.pending,"builders are held up"],["Run cost a month",usd(f.P.cost),"all builds"]]],
  r:["Open exposure",f=>[["Gate checks failing",f.fails,"across all builds"],["Over-privileged builds",f.ac.over,"personal tier holding confidential data"],["Grants expired or ending soon",(f.ac.exp||0)+(f.ac.soon||0),"recertify or let lapse"]]],
  say:"{sec} of {n} builds pass every security check. Over-privileged: {over}. Gate checks failing: {fails}."},
 {id:"cio",short:"CIO",name:"Chief Information Officer",balance:"Productivity against cost",q:"How do I stop sprawl without blocking builders?",
  v:["Productivity",f=>[["Hours returned a month",n0(f.P.hours),"modeled"],["Builds in use",f.P.n,f.P.users+" people use them"],["Builds with every guardrail",f.rows.filter(r=>r.cov>=90).length,"ready to run without IT help"]]],
  c:["Sprawl and run cost",f=>[["Run cost a month",usd(f.P.cost),"all builds"],["Overlapping builds",f.dup,"candidates to merge"],["New data objects proposed",f.rows.reduce((s,r)=>s+arr(r.a.newEnts).length,0),"each needs a data owner"]]],
  r:["Technical debt",f=>[["High-severity debt",f.high,"will not scale as built"],["Builds below maturity target",f.rows.filter(r=>r.mt.lvl<r.mt.tgt).length,"see the roadmaps"],["Models outside the gateway",f.P.aiDirect,"shadow AI"]]],
  say:"{n} builds run on the platform with {dup} overlapping. High-severity debt items needing a plan: {high}."},
 {id:"chro",short:"CHRO",name:"Chief Human Resources Officer",balance:"Capacity freed against workforce impact",q:"How does work shift between people and AI?",
  v:["Capacity freed",f=>[["Hours returned a month",n0(f.P.hours),"modeled from time saved per use"],["Equivalent full-time roles",(f.P.hours/160).toFixed(1),"at 160 hours a month"],["People building",new Set(f.rows.map(r=>r.a.builder)).size,"employees creating their own tools"]]],
  c:["Change load",f=>[["People using builds",f.P.users,"changed how they work"],["Steps now done by AI",f.rows.reduce((s,r)=>s+R18.process(r.a.id).counts.ai,0),"previously done by a person"],["Steps still done by a person",f.rows.reduce((s,r)=>s+R18.process(r.a.id).counts.human,0),"judgement and approval"]]],
  r:["Workforce impact",f=>[["Builder or owner has left",f.gone,"build needs a new owner"],["Builds without a backup",f.P.noOwner,"depends on one person"],["Builds with no trained backup",f.rows.filter(r=>!r.m.backup).length,"succession gap"]]],
  say:"About {fte} full-time roles of capacity returned a month across {people} people. The owner has left on {gone} of {n} builds."},
 /* DC-28: the CLO lens, configuration only, drawn from the same figures */
 {id:"clo",short:"CLO",name:"Chief Legal Officer",balance:"Exposure against the speed of the business",q:"Where are we exposed, and what slows decisions down?",
  v:["Obligations kept",f=>[["Builds with an owner and a backup",(f.P.n-f.P.noOwner)+" of "+f.P.n,"someone answers for every build"],["Access decided by policy",(f.ac.pol||0)+"%","no person needed for safe requests"],["Builds tied to strategy",f.tied+" of "+f.P.n,"each names the objective it serves"]]],
  c:["Review load",f=>[["Data access requests waiting",f.ac.pending,"each waits on an owner group"],["Average time to decide access",(f.ac.avg||0).toFixed(1)+" days","excluding policy decisions"],["Run cost a month",usd(f.P.cost),"all builds"]]],
  r:["Legal exposure",f=>[["Models called outside the gateway",f.P.aiDirect,"no log of what data left"],["Over-privileged builds",f.ac.over,"personal tier holding confidential data"],["Grants expired or ending soon",(f.ac.exp||0)+(f.ac.soon||0),"recertify or let lapse"]]],
  say:"{over} builds hold confidential data at the personal tier. {direct} of {n} builds call a model outside the gateway, with no log."}];const cur=()=>L.find(l=>l.id===ST.lens)||L[0];
R18.lensOf=cur;
function say(l,f){const m={"{net}":usd(f.P.net),"{n}":f.P.n,"{stall}":f.P.noOwner,"{cost}":usd(f.P.cost),"{unl}":f.P.unlinked,"{ai}":f.aiRows.length,"{direct}":f.P.aiDirect,"{noks}":f.rows.length-f.killOk,"{cov}":f.objs.length-f.bare.length,"{obj}":f.objs.length,"{sec}":f.sec,"{over}":f.ac.over||0,"{fails}":f.fails,"{dup}":f.dup,"{high}":f.high,"{fte}":(f.P.hours/160).toFixed(1),"{people}":f.P.users,"{gone}":f.gone};
 return l.say.replace(/\{[a-z]+\}/g,k=>m[k]!==undefined?m[k]:k)}

/* ---------- the CAIO playbook, run automatically ---------- */
function playbook(f){const rows=f.rows;const accOk=rows.filter(r=>G(()=>R18.access.stateOf(r.a.id).ok,true)).length;
 const tiers=rows.filter(r=>r.a.tier).length;
 return[
  {t:"Inventory every use of AI",s:"active",d:f.aiRows.length+" uses across "+f.P.n+" builds, found from what each build declares",go:"r18_builds"},
  {t:"Risk-tier each use",s:tiers===rows.length?"active":"drafted",d:"Each build has a tier (personal, team, enterprise) that sets how much data it may touch",go:"plat_gate"},
  {t:"Route data access to the data owner",s:accOk===rows.length?"active":"drafted",d:accOk+" of "+rows.length+" builds have every source approved; "+(f.ac.pending||0)+" requests wait on an owner group",go:"r18_access"},
  {t:"Enforce kill switches",s:f.killOk===rows.length?"active":f.killOk?"drafted":"missing",d:f.killOk+" of "+rows.length+" builds have a kill switch that has been tested",go:"r18_builds"},
  {t:"Keep model use inside the gateway",s:f.P.aiDirect?"missing":"active",d:f.P.aiDirect?f.P.aiDirect+" builds call a model directly, outside the cap and the log":"Every model call passes the gateway, with caps and a log",go:"tower"},
  {t:"Measure value",s:"active",d:"Hours returned and net value are modeled for every build; the rate and minutes are yours to set",go:"r18_builds"},
  {t:"Prevent duplicate builds",s:f.dup?"drafted":"active",d:f.dup?f.dup+" builds overlap with another; see Scale on each build":"No overlapping builds found",go:"r18_builds"},
  {t:"Report to the board",s:"active",d:"The summary below is generated from the same figures, so the board sees what you see",go:"r18_lens"}]}

/* ---------- lens screen ---------- */
function col(tone,[title,fn],f){const rows=fn(f);return `<section class="card glass r18-vcr r18-vcr-${tone}"><div class="r18-vh"><span class="r18-vk">${tone==="v"?"Value":tone==="c"?"Cost":"Risk"}</span><h3>${H(title)}</h3></div><ul class="r18-vl">${rows.map(([a,b,c])=>`<li><div class="r18-vn">${H(b)}</div><div><b>${H(a)}</b><span class="muted small">${H(c)}</span></div></li>`).join("")}</ul></section>`}
function lensScreen(){const l=cur(),f=F();const pb=l.id==="caio"||ST.showPb?playbook(f):null;
 const top=f.rows.slice().sort((a,b)=>b.v.net-a.v.net).slice(0,5);const watch=f.rows.filter(r=>r.cov<70||r.m.ownerGone||!r.m.owner||!r.m.backup).slice(0,5);
 return `<div class="screen r18-screen">${hero("Oversee · Executive lens · "+l.short,l.q,l.name+" weighs "+l.balance.toLowerCase()+". Switch lens from the top bar. Dollar figures are modeled and illustrative; change the rate and minutes saved on any build.")}
 <section class="card glass r18-say"><div class="r18-lensrow">${L.map(x=>`<button type="button" class="r18-lopt ${x.id===l.id?"on":""}" data-r18-lens="${H(x.id)}" aria-pressed="${x.id===l.id}"><b>${H(x.short)}</b><span>${H(x.balance)}</span></button>`).join("")}</div><p class="r18-lead">${H(say(l,f))}</p></section>
 <div class="r18-three">${col("v",l.v,f)}${col("c",l.c,f)}${col("r",l.r,f)}</div>
 ${pb?`<section class="card glass"><div class="cardhead"><div><h3>If you had a CAIO, this is what they would make you do</h3><span class="muted small">Done for you on every build, with no one to hire. Each line is checked against the live builds.</span></div></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Duty</th><th>State</th><th>Evidence</th><th class="n"></th></tr></thead><tbody>${pb.map(p=>`<tr><td><b>${H(p.t)}</b></td><td>${pill(R18.stateText[p.s],R18.stateClass[p.s])}</td><td>${H(p.d)}</td><td class="n"><button class="btn quiet" type="button" data-go="${H(p.go)}">Open</button></td></tr>`).join("")}</tbody></table></div></section>`:`<p class="small muted"><button class="btn quiet" type="button" data-r18-pb="1">Show the CAIO playbook</button> The duties a Chief AI Officer would carry, checked against these builds.</p>`}
 <div class="r18-two"><section class="card glass"><div class="cardhead"><div><h3>Largest modeled value</h3><span class="muted small">Open a build to see its process, data, and guardrails.</span></div></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Build</th><th>Function</th><th class="n">Net a month</th><th class="n">Guardrails</th></tr></thead><tbody>${top.map(r=>`<tr><td><button class="r18-lk" type="button" data-r18-app="${H(r.a.id)}">${H(r.a.n)}</button></td><td>${H(r.m.fn)}</td><td class="n num">${usd(r.v.net)}</td><td class="n num">${r.cov}%</td></tr>`).join("")}</tbody></table></div></section>
 <section class="card glass"><div class="cardhead"><div><h3>Needs attention</h3><span class="muted small">Missing guardrails, an owner, or a backup.</span></div></div>${watch.length?`<div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Build</th><th>Why</th></tr></thead><tbody>${watch.map(r=>`<tr><td><button class="r18-lk" type="button" data-r18-app="${H(r.a.id)}">${H(r.a.n)}</button></td><td>${r.m.ownerGone?"Owner has left":!r.m.owner?"No owner":!r.m.backup?"No backup owner":"Only "+r.cov+"% of guardrails in place"}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">Nothing needs attention.</p>`}</section></div>
 <p class="small muted">The strategy view for this lens: <button class="btn quiet" type="button" data-go="r18_strategy">How each function enables the strategy</button></p>
 ${typeof procCard==="function"?procCard("r18_lens"):""}</div>`}
REG("r18_lens","Executive lenses","lens","M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",lensScreen);

/* ---------- strategy enablement map ---------- */
function stratPerson(n){return n?(typeof pchip==="function"?pchip(n):H(n)):'<span class="muted">Not named</span>'}
function stratByObj(f,objs,fns){return `<section class="card glass"><div class="cardhead"><div><h3>Each objective and who is working on it</h3><span class="muted small">Modeled net value a month is illustrative. Open a build to see its process, data and guardrails.</span></div></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Objective</th><th>Owner</th><th>Functions doing the work</th><th>Builds</th><th class="n">Net a month</th></tr></thead><tbody>${objs.map(o=>{const hit=f.rows.filter(r=>r.m.obj===o.id);const fn=[...new Set(hit.map(r=>r.m.fn))];const net=hit.reduce((x,r)=>x+r.v.net,0);return `<tr><td><b>${H(o.n||o.name||o.id)}</b><small class="muted">${H(o.id)}</small></td><td>${stratPerson(o.owner)}</td><td>${fn.length?fn.map(x=>pill(x,"mute")).join(" "):pill("No work yet","warn")}</td><td>${hit.length?hit.map(r=>`<button class="r18-lk" type="button" data-r18-app="${H(r.a.id)}">${H(r.a.n)}</button>`).join("<br>"):'<span class="muted">None</span>'}</td><td class="n num">${hit.length?usd(net):"&ndash;"}</td></tr>`}).join("")}</tbody></table></div></section>`}
function stratByFn(f,objs,fns){return `<section class="card glass"><div class="cardhead"><div><h3>Each function and the objectives it advances</h3><span class="muted small">A function with no objective is effort with no stated aim.</span></div></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Function</th><th>Objectives it advances</th><th>Builds</th><th class="n">Net a month</th></tr></thead><tbody>${fns.map(fn=>{const hit=f.rows.filter(r=>r.m.fn===fn);const os=[...new Set(hit.map(r=>r.m.obj).filter(Boolean))].map(id=>{const o=objs.find(x=>x.id===id);return o?(o.n||o.name||id):id});const net=hit.reduce((x,r)=>x+r.v.net,0);return `<tr><td><b>${H(fn)}</b></td><td>${os.length?os.map(x=>pill(x,"mute")).join(" "):pill(hit.length?"No objective named":"No builds yet","warn")}</td><td>${hit.length?hit.map(r=>`<button class="r18-lk" type="button" data-r18-app="${H(r.a.id)}">${H(r.a.n)}</button>`).join("<br>"):'<span class="muted">None</span>'}</td><td class="n num">${hit.length?usd(net):"&ndash;"}</td></tr>`}).join("")}</tbody></table></div></section>`}
function stratScreen(){const f=F(),objs=f.objs;const fns=R18.FUNCTIONS.filter(fn=>f.rows.some(r=>r.m.fn===fn)||true);
 const cell=(fn,o)=>{const hit=f.rows.filter(r=>r.m.fn===fn&&r.m.obj===o.id);if(!hit.length)return `<td class="r18-cell"><span class="muted">&ndash;</span></td>`;const net=hit.reduce((s,r)=>s+r.v.net,0);
  return `<td class="r18-cell on"><button type="button" class="r18-cb" data-r18-app="${H(hit[0].a.id)}" title="${H(hit.map(r=>r.a.n).join(", "))}"><b>${hit.length}</b><span>${usd(net)}</span></button></td>`};
 const idle=fns.filter(fn=>!f.rows.some(r=>r.m.fn===fn&&r.m.obj));
 return `<div class="screen r18-screen">${hero("Oversee · Strategy","How every function enables the strategy","Each build names the objective it advances. See it by objective or by function: who owns it, which functions do the work, and the builds and modeled net value behind it. Objectives and functions with no work are the gaps.")}
 ${typeof kpiRow==="function"?kpiRow([["Objectives with work",(objs.length-f.bare.length)+" of "+objs.length,"at least one build advances them",{cls:f.bare.length?"warn":""}],["Builds tied to strategy",f.tied+" of "+f.P.n,"the rest are effort with no stated aim",{cls:f.P.unlinked?"warn":""}],["Functions with no link",idle.length,idle.slice(0,3).join(", ")||"every function is tied to an objective",{cls:idle.length?"warn":""}],["Value behind strategy",usd(f.rows.filter(r=>r.m.obj).reduce((s,r)=>s+r.v.net,0)),"modeled net a month, illustrative"]]):""}
 ${typeof views==="function"?views("r18stv",["By objective","By function"],[stratByObj(f,objs,fns),stratByFn(f,objs,fns)]):stratByObj(f,objs,fns)}
 <div class="r18-two"><section class="card glass"><div class="cardhead"><div><h3>Objectives with no enabling work</h3></div></div>${f.bare.length?`<ul class="r18-vl">${f.bare.map(o=>`<li><div class="r18-vn">${H(o.id)}</div><div><b>${H(o.n||o.name||"")}</b><span class="muted small">Owner ${H(o.owner||"not named")}. No build advances this yet.</span></div></li>`).join("")}</ul>`:`<p class="muted">Every objective has at least one build.</p>`}</section>
 <section class="card glass"><div class="cardhead"><div><h3>Builds not tied to an objective</h3><span class="muted small">Choose the objective on the build's Process tab.</span></div></div>${f.P.unlinked?`<ul class="r18-vl">${f.rows.filter(r=>!r.m.obj).map(r=>`<li><div class="r18-vn">&nbsp;</div><div><button class="r18-lk" type="button" data-r18-app="${H(r.a.id)}">${H(r.a.n)}</button><span class="muted small">${H(r.m.fn)} · ${usd(r.v.net)} a month</span></div></li>`).join("")}</ul>`:`<p class="muted">Every build names an objective.</p>`}</section></div>
 ${typeof procCard==="function"?procCard("r18_strategy"):""}</div>`}
REG("r18_strategy","Strategy enablement","lens","M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18",stratScreen);

/* ---------- strip on every home ---------- */
R18.lensHome=function(){const l=cur(),f=F();const k=l.v[1](f)[0],c=l.c[1](f)[0],r=l.r[1](f)[0];
 const t=(tone,x)=>`<div class="r18-hs r18-hs-${tone}"><span class="r18-vk">${tone==="v"?"Value":tone==="c"?"Cost":"Risk"}</span><b>${H(x[1])}</b><span class="small muted">${H(x[0])}</span></div>`;
 return `<section class="card glass r18-homelens" aria-label="Executive lens"><div class="r18-hl-h"><div><div class="eyebrow">${H(l.short)} lens</div><h3>${H(l.q)}</h3></div><button type="button" class="btn quiet" data-go="r18_lens">Open</button></div><p class="small muted r18-hl-x">A lens is how one executive weighs value, cost and risk. It changes the question and these three figures, never what you can open or change. Switch it from the Lens button in the top bar.</p><div class="r18-hl-row">${t("v",k)}${t("c",c)}${t("r",r)}</div></section>`};

D.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r18-pb]");if(b){ST.showPb=true;render()}});

R18.lensFigs=F;R18.playbook=playbook;
})();
