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
 ${goals}</div>`}
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
const _rn=W.render;W.render=function(){const r=_rn.apply(this,arguments);try{gaapNote()}catch(e){console.error("r29 gaap",e)}return r};
})();
