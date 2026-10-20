/* ===== mod_r29_bst: Budget and spend traceability. One family, three views: Combined (one page: money in your purview, and the goals it serves), Spend detail (the Enterprise spend screen)
   and Trace detail (the Executive trace screen). Purview rules: the chief executive, chief operating and chief financial officers see every domain; other executives see the domains they own;
   an executive who owns none sees their own lines plus allocated shared cost. Figures come from the sample organization and the planning data. ===== */
(function(){
"use strict";
const W=window;const R18=W.R18,R15=W.R15;if(!R18||!R18.spend||!R18.spend.purview||!R15||!R15.families)return;
const {G,H,pill,usd}=R18;
const sum=(a,f)=>a.reduce((s,x)=>s+(+x[f]||0),0);
const varPct=(f,a)=>a?((f-a)/a*100):0;
const fv=v=>(v>=0?"+":"")+v.toFixed(1)+"%";const tone=v=>v>5?"bad":v>0?"warn":"good";
const num=v=>`<td class="n num">${usd(v)}</td>`;
function money(pv){
 if(pv.none){const x=R18.spend.alloc(pv.mine);return{A:x.totA,F:x.totF,label:"Your function ("+x.hc+" staff)",head:["Component"],rows:[["Budget lines you own",x.dA,x.dF],["Shared technology allocated to you, by headcount",x.aA,x.aF]],note:"Modeled: shared cloud and licence cost split by headcount."}}
 const st=pv.st;return{A:st.A,F:st.F,label:pv.scoped?"Domains you own":"Every domain",head:["Domain"],rows:st.rows.slice().sort((a,b)=>b.fcst-a.fcst).map(r=>[r.dom+" ("+r.cc+")",r.appr,r.fcst]),note:pv.scoped?"Only the domains you own.":"The chief executive, chief operating and chief financial officers see every domain."}}
/* ---------- DC-14: group view. One business group: its objectives (from the cascade), its spend (budget lines, reserve draws and
   invoices of the group's projects) and its work (projects, earned value, open budget requests). Dollar figures are modeled. ---------- */
const GS=S.thrGrp=S.thrGrp||{g:"DP"};
const nchip=(k,id)=>G(()=>NUM.rchip(k,id),"");
const oc=(n,rec)=>n?G(()=>ownerChip(n,{record:rec,size:20}),H(n)):"";
const pc=v=>v==null?"n/a":Math.round(v*100)+"%";
function groupData(gid){const X=G(()=>EXE.cascade(),null);const grp=(G(()=>EXE.CGRP,[])||[]).find(g=>g.id===gid);if(!grp)return null;
 const projs=grp.proj.filter(id=>PROJ.some(p=>p.id===id));const lines=G(()=>S.bud.lines,[]).filter(l=>projs.includes(l.p));
 const gobj=X?X.nodes.filter(n=>n.lvl==="group"&&n.grp===gid):[];const teams=X?X.nodes.filter(n=>n.lvl==="team"&&gobj.some(g=>(n.up[g.id]||0)>0)):[];
 const ent=X?[...new Set(gobj.flatMap(g=>Object.keys(g.up)))].map(id=>X.by[id]).filter(Boolean):[];
 const led=G(()=>S.bud.led,[]).filter(e=>e.p&&projs.includes(e.p));const invs=INVOICES.filter(i=>{const ip=G(()=>ZLINK.chains.invoiceToProject(i.id),{});return ip.proj&&projs.includes(ip.proj)});
 const brs=G(()=>BUDREQ.requests(),[]).filter(r=>projs.includes(r.proj)&&["funded","declined","deferred","returned"].indexOf(r.st)<0);
 const ev=G(()=>EXE.snap().ev,{});
 const T={appr:sum(lines,"appr"),fcst:sum(lines,"fcst"),act:sum(lines,"act"),comm:sum(lines,"comm")};
 return {grp,projs,lines,gobj,teams,ent,led,invs,brs,ev,T,drawn:-led.filter(e=>e.st==="Approved").reduce((s,e)=>s+e.amt,0),pend:-led.filter(e=>e.st==="Pending").reduce((s,e)=>s+e.amt,0)}}
function groupView(){const gs=G(()=>EXE.CGRP,[])||[];if(!gs.length)return "";if(!gs.some(g=>g.id===GS.g))GS.g=gs[0].id;const d=groupData(GS.g);if(!d)return "";
 const v=varPct(d.T.fcst,d.T.appr),mod='<span class="pill info" title="Dollar figures are modeled from the sample budget">modeled</span>';
 const pick=`<div class="thr-gpick" role="group" aria-label="Choose a group">${gs.map(g=>`<button type="button" class="chip" data-bst-grp="${H(g.id)}" aria-pressed="${g.id===GS.g}">${H(g.n)}</button>`).join("")}</div>`;
 const objs=d.gobj.length?`<ul class="thr-list">${d.gobj.map(g=>`<li class="thr-row"><div class="thr-rh"><b>${H(g.n)}</b>${oc(g.owner,"objective:"+g.id)}<span class="num">${pc(g.p)}</span></div><p class="small muted thr-sub">Feeds ${Object.keys(g.up).map(u=>{const o=G(()=>S.exe.objs.find(x=>x.id===u),null);return o?nchip("obj",u)+" "+H(o.n):H(u)}).join(", ")} · teams: ${d.teams.filter(t=>(t.up[g.id]||0)>0).map(t=>H(t.team)+" "+pc(t.p)).join(", ")||"none"}</p></li>`).join("")}</ul>`:`<p class="small muted">No group objectives in the cascade.</p>`;
 const spend=`<table class="tbl r18-t"><thead><tr><th>Budget line</th><th class="n">Approved</th><th class="n">Forecast</th><th class="n">Against approved</th></tr></thead><tbody>${d.lines.map(l=>`<tr><td>${nchip("line",l.id)} ${H(l.n)}</td>${num(l.appr)}${num(l.fcst)}<td class="n">${pill(fv(varPct(l.fcst,l.appr)),tone(varPct(l.fcst,l.appr)))}</td></tr>`).join("")}<tr class="r18-sp-t"><td><b>Total</b></td>${num(d.T.appr)}${num(d.T.fcst)}<td class="n">${pill(fv(v),tone(v))}</td></tr></tbody></table>
  <p class="small muted">Reserve drawn ${usd(d.drawn)}, pending ${usd(d.pend)} (${d.led.map(e=>nchip("led",e.id)).join(" ")||"no entries"}). Invoices: ${d.invs.map(i=>nchip("inv",i.id)+" "+usd(i.amt)).join(", ")||"none"}. ${mod}</p>`;
 const work=`<ul class="thr-list">${d.projs.map(id=>{const p=PROJ.find(x=>x.id===id),e=d.ev[id];return `<li class="thr-row"><div class="thr-rh">${nchip("proj",id)}<b>${H(p.n)}</b>${oc(p.owner,"project:"+id)}</div><p class="small muted thr-sub">${e?"Work earned "+pc(e.ev)+" against "+pc(e.pv)+" planned":"No plan in the schedule"} · ${usd(p.bac*1000)} approved ${mod}</p></li>`}).join("")}</ul>
  <p class="small muted">${d.brs.length?d.brs.length+" open budget request"+(d.brs.length===1?"":"s")+": "+d.brs.map(r=>H(r.id)+" "+usd(r.amt)).join(", "):"No open budget requests."}</p>`;
 return `<section class="card glass thr-grp" data-bst-group="${H(d.grp.id)}"><div class="cardhead"><div><h3>Group view: ${H(d.grp.n)}</h3><span class="muted small">One group: its objectives, its spend and its work. Objectives come from the strategy cascade, spend from the budget lines of the group's projects. Dollar figures are modeled.</span></div>${oc(d.grp.owner,"group:"+d.grp.id)}</div>
 ${pick}
 ${typeof kpiRow==="function"?kpiRow([["Group objectives",String(d.gobj.length),"average progress "+pc(d.gobj.length?d.gobj.reduce((s,g)=>s+(g.p||0),0)/d.gobj.length:null)],["Approved",usd(d.T.appr),d.lines.length+" budget lines, modeled"],["Forecast against approved",fv(v),"modeled",{cls:v>5?"crit":v>0?"warn":""}],["Projects",String(d.projs.length),d.brs.length+" open requests"]]):""}
 <div class="thr-gcols"><div><div class="eyebrow">Objectives</div>${objs}</div><div><div class="eyebrow">Work</div>${work}</div></div><div><div class="eyebrow">Spend</div><div class="tscroll">${spend}</div></div></section>`}
G(()=>document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-bst-grp]");if(!b)return;GS.g=b.getAttribute("data-bst-grp");render()}));
W.BSTX={groupData,groupView};
function screen(){
 const pv=R18.spend.purview();const m=money(pv);const c=G(()=>EXE.coverage(),null);const E=G(()=>EXE.E,{objs:[]});
 const v=varPct(m.F,m.A);const linked=c&&c.tot?Math.round(c.linked/c.tot*100):null;
 const tbl=m.rows.map(r=>`<tr><td><b>${H(r[0])}</b></td>${num(r[1])}${num(r[2])}<td class="n">${r[1]?pill(fv(varPct(r[2],r[1])),tone(varPct(r[2],r[1]))):""}</td></tr>`).join("")
  +`<tr class="r18-sp-t"><td><b>Total</b></td>${num(m.A)}${num(m.F)}<td class="n">${pill(fv(v),tone(v))}</td></tr>`;
 let goals="";
 if(c&&E.objs&&E.objs.length){const tot=E.objs.reduce((s,o)=>s+((c.res[o.id]||{}).fund||0),0)||1;
  goals=E.objs.map(o=>{const r=c.res[o.id]||{fund:0,n:0};return `<tr><td><b>${H(o.n)}</b><small class="muted">${H(o.owner||"")}</small></td><td class="n num">${r.n}</td>${num(r.fund)}<td class="n num">${Math.round(r.fund/tot*100)}%</td><td>${r.fund?"":pill("No funded work","bad")}</td></tr>`}).join("");
  const orph=(c.orph||[]).slice(0,6).map(i=>`<li>${H(i.n)} <span class="muted small">${usd(i.cost)}</span></li>`).join("");
  goals=`<section class="card glass"><div class="cardhead"><div><h3>Where the money goes: the goals it serves</h3><span class="muted small">Funded work weighted by how much each piece supports each objective. Enterprise-wide, from the planning data.</span></div><button class="btn quiet" type="button" data-go="strat_exec">Open the trace</button></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Objective</th><th class="n">Funded work</th><th class="n">Funded dollars</th><th class="n">Share</th><th></th></tr></thead><tbody>${goals}</tbody></table></div>${orph?`<p class="small"><b>Funded without an objective</b></p><ul class="small">${orph}</ul>`:""}</section>`}
 return `<div class="screen r18-screen">${hero("Budget and spend traceability · Combined","From the dollar to the goal",`${H(m.note)} Follow any line into the detail with the views above: the spend detail by org chart, executive, domain and type, and the trace from a goal down to the work and the money.`)}
 ${typeof kpiRow==="function"?kpiRow([["Approved",usd(m.A),m.label],["Forecast",usd(m.F),m.label],["Forecast against approved",fv(v),"purview",{cls:v>5?"crit":v>0?"warn":""}],["Funded dollars linked to a goal",linked==null?"n/a":linked+"%","enterprise",{cls:linked!=null&&linked<85?"warn":""}]]):""}
 <section class="card glass"><div class="cardhead"><div><h3>Money in your purview</h3><span class="muted small">${H(m.note)}</span></div><button class="btn quiet" type="button" data-go="r18_spend">Open the spend detail</button></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>${H(m.head[0])}</th><th class="n">Approved</th><th class="n">Forecast</th><th class="n">Against approved</th></tr></thead><tbody>${tbl}</tbody></table></div></section>
 ${goals}
 ${groupView()}</div>`}
REG("bst","Budget and spend traceability","money","M12 2v20M17 6.5C17 4.6 14.8 4 12 4S7 5 7 7c0 4.5 10 2.5 10 7 0 2.2-2.2 3-5 3s-5-.9-5-3",screen);
G(()=>NAVX.add("bst",{group:"money",label:"Budget and spend traceability",hint:"Where the money goes and which goals it serves",sub:"Traceability",kw:"budget spend traceability trace goals money purview combined detail enterprise spend executive trace"}));
/* one family: Combined first, then the two detail screens leave the menu and are reached from the view switcher */
const fam={id:"bst",label:"Budget and spend traceability",views:[["bst","Combined"],["r18_spend","Spend detail"],["strat_exec","Trace detail"]]};
R15.families.push(fam);
R15.hidden.trace=1;
fam.views.forEach(([id,v])=>{R15.famOf[id]=fam;if(id!=="bst"){R15.names[id]=fam.label+": "+v;R15.hidden[id]=1}});
/* Funding color: how accounting standards describe the idea (it is budget vocabulary, not a GAAP term) */
function gaapNote(){if(G(()=>S.screen,"")!=="fin_color")return;const sc=document.querySelector("#view .screen");if(!sc||sc.querySelector(".r29-gaap"))return;
 const h='<details class="r29-gaap card glass" style="margin:10px 0;padding:10px 14px"><summary><b>Is this a GAAP term?</b> <span class="muted small">How accounting standards describe the idea</span></summary><p class="small" style="margin:8px 0 4px">No. "Color of money" is budget vocabulary from government appropriations, and GAAP does not define it. The idea behind it, that money carries limits on what it may pay for, appears in the standards like this:</p><ul class="small"><li><b>Not-for-profit GAAP (FASB ASC 958, as amended by ASU 2016-14):</b> net assets with donor restrictions and net assets without donor restrictions.</li><li><b>Governmental GAAP (GASB Statement 54):</b> fund balance is classified as nonspendable, restricted, committed, assigned or unassigned, by how tightly the money is bound.</li><li><b>Federal accounting (FASAB standards and the Treasury Standard General Ledger):</b> appropriations carry purpose, time and amount limits. This is where the phrase "color of money" comes from.</li><li><b>Commercial GAAP:</b> no such concept. The nearest idea is the split between capital and operating cost.</li></ul><p class="small muted">Reference summary, not accounting advice. Confirm treatment with your controller or auditor.</p></details>';
 const hero=sc.querySelector(":scope > .hero");hero?hero.insertAdjacentHTML("afterend",h):sc.insertAdjacentHTML("afterbegin",h)}
if(W.HOOKS&&HOOKS.on)HOOKS.on("afterRender",()=>{try{gaapNote()}catch(e){console.error("r29 gaap",e)}},{id:"r29.gaap"});else{const _rn=W.render;W.render=function(){const r=_rn.apply(this,arguments);try{gaapNote()}catch(e){console.error("r29 gaap",e)}return r}}
})();
