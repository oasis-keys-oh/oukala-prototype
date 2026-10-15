/* ===== Round 18, G: information scales with the level of the role. Executives get a headline view with drill-down; directors and managers get working views and control; specialists and contributors see their own part of the work.
   R18.levelOf(persona), simplified executive home with "Show everything", default lens per role, dashboard tabs that belong to operational roles hidden at executive level, and screen r18_levels explaining who sees what. ===== */
(function(){
"use strict";
const W=window,D=document;const R18=W.R18;if(!R18)return;
const {G,H,arr,pill}=R18;const ST=R18.st;
const LV={exec:"exec",cfo:"exec",coo:"exec",ceo:"exec",chro:"exec",ciso:"exec",caio:"exec",clo:"exec",cto:"exec",board:"exec",portfolio:"director",dir:"director",fin:"manager",pm:"manager",ops:"manager",change:"manager",arch:"specialist",admin:"specialist",audit:"specialist",emp:"contributor",newhire:"contributor",guest:"contributor"};
const LEVELS=[
 {id:"exec",n:"Executive",who:"CEO, CFO, COO, CTO, CIO, board",see:"A headline, three scores, up to three decisions that need you, and tiles that lead to the next level of detail.",ctl:"Approve, decline and delegate. Open anything; nothing is hidden, it is one step down.",not:"Queues, builders, ledgers and configuration live with the roles that run them."},
 {id:"director",n:"Director",who:"Portfolio director, function directors",see:"Everything in their function: delivery, spend, risks, builds, approvals and the numbers behind each.",ctl:"Reassign owners, set targets, approve within their limit, change process settings for their function.",not:"Other functions appear as summaries."},
 {id:"manager",n:"Manager",who:"Finance, project, operations and change managers",see:"Their queues, projects and approvals with the working detail, history and evidence.",ctl:"Work items, decide inside delegated limits, edit the records they own.",not:"Enterprise totals and other teams' queues."},
 {id:"specialist",n:"Specialist",who:"Architects, platform administrators, auditors",see:"The tools and records for their craft: catalogs, controls, evidence, configuration.",ctl:"Configure, review and attest within their scope. Auditors are read only.",not:"Business decisions outside their remit."},
 {id:"contributor",n:"Contributor",who:"Employees, new hires, guests",see:"Their own tasks, requests, learning and the apps they can use.",ctl:"Start requests, complete assigned steps, build within guardrails.",not:"Anything outside their part of the work."}];
const LENS_OF={exec:"cio",cfo:"cfo",coo:"coo",ceo:"ceo",chro:"chro",ciso:"ciso",caio:"caio",clo:"ceo",cto:"cio",board:"ceo",portfolio:"coo",dir:"coo"};
R18.levels=LEVELS;
R18.levelOf=k=>LV[k||S.persona]||"manager";
const lvl=()=>R18.levelOf();
const E=s=>H(s);
function applyLens(){const k=S.persona;const l=LENS_OF[k];if(l&&ST.lensBy!==k){ST.lens=l;ST.lensBy=k}}
function drill(){const tiles=[["r18_spend","Where the money goes","Spend by executive and domain, forecast against approved"],["exe_dash","Delivery and risk","Beta date, budget forecast and open decisions"],["r18_lens","Your lens","Figures for the question this role owns"],["r18_strategy","Strategy and builds","Which functions advance which objective"]];
 return `<section class="card glass r18-drill"><div class="cardhead"><div><h3>Where to look next</h3><span class="muted small">Each tile opens the next level of detail.</span></div></div><div class="r18-dg">${tiles.map(t=>`<button type="button" class="r18-dt" data-go="${t[0]}"><b>${E(t[1])}</b><small>${E(t[2])}</small><span aria-hidden="true">Open</span></button>`).join("")}</div></section>`}
function simple(){const k=S.persona,P=PERSONAS[k];const sm=G(()=>R18.spend.stats(),null);
 const head=sm?`Forecast spend is <b>${R18.usd(sm.F)}</b> against <b>${R18.usd(sm.A)}</b> approved (${sm.v>=0?"+":""}${sm.v.toFixed(1)}%). `:"";
 const story=head+(P.story||"");
 const needs=Object.assign({},P,{needs:arr(P.needs).slice(0,3)});
 const lh=G(()=>R18.lensHome?R18.lensHome():"","");
 return `<div class="screen r18-screen r18-exec">${hero(G(()=>NOW.day,"Today")+" · Meridian Standards Foundation","Good afternoon, "+E(G(()=>meOf().split(" ")[0],"Casey")),story,`<div class="row"><span class="persona-note">Viewing as <b>${E(P.n)}</b> · Executive level</span><button type="button" class="chip" data-r18-full="1" title="Show the full working home for this role">Show everything</button></div>`)}
 ${lh}
 <section class="card glass"><div class="cardhead"><h3>How we're doing</h3><span class="muted small">Three scores. Select one for its formula and trend.</span></div><div class="rings">${arr(P.rings).slice(0,3).map(id=>G(()=>metricRing(id,132),"")).join("")}</div></section>
 ${arr(P.needs).length?BLK.needs(needs):""}${drill()}</div>`}
const OWNFN={portfolio:"Standards",pm:"Standards",fin:"Finance",ops:"IT service",change:"Technology"};
/* directors and managers see the functions their own work connects to, summarized, with a way in */
function connected(){const fn=OWNFN[S.persona];if(!fn)return"";const B=R18.BIZ||{};const rows=G(()=>R18.portfolio().rows,[]);const mine=rows.filter(r=>r.m.fn===fn);const objs=new Set(mine.map(r=>r.m.obj).filter(Boolean));if(!objs.size)return"";
 const ADJ={Standards:{Membership:"Members who ballot also renew",Finance:"Publishing revenue and dues",Technology:"The standards platform"},"IT service":{Standards:"Runs the systems standards work depends on"},Technology:{Standards:"Builds for standards work"}};const fns=[...new Set(rows.map(r=>r.m.fn))].filter(x=>x&&x!==fn);const items=[];
 fns.forEach(f2=>{let sh=rows.filter(r=>r.m.fn===f2&&objs.has(r.m.obj));let on=[...new Set(sh.map(r=>(R18.objective(r.m.obj)||{}).n||r.m.obj))];const why=(ADJ[fn]||{})[f2];if(!sh.length&&why){sh=rows.filter(r=>r.m.fn===f2);on=[why]}if(!sh.length)return;const top=sh.find(r=>B[r.a.id]&&B[r.a.id].kpi)||sh[0];const b=B[top.a.id]||{};
  items.push({f2,on,top,b,n:sh.length,users:sh.reduce((s,r)=>s+(r.a.users||0),0)})});
 if(!items.length)return"";
 const fmt=b=>b.money?R18.usd(b.vol):Math.round(b.vol).toLocaleString("en-US");
 return `<section class="card glass r18-conn" aria-label="Connected functions"><div class="cardhead"><div><h3>Connected to your work</h3><span class="muted small">Other functions summarized because they advance the same objective as ${H(fn)}. Open one for the detail you are allowed to see.</span></div><button type="button" class="btn quiet" data-go="r18_strategy">All functions</button></div><div class="r18-cg">${items.slice(0,4).map(i=>`<article class="r18-cc"><div class="r18-cc-h"><b>${H(i.f2)}</b><span class="muted small">${i.n} ${i.n===1?"tool":"tools"} · ${i.users} ${i.users===1?"person":"people"}</span></div><p class="r18-cc-t">${i.b.did?`<b>${H(fmt(i.b))}</b> ${H(i.b.did.toLowerCase())} ${H(i.b.per||"")}`:H(i.top.a.n)}</p>${i.b.kpi?`<p class="small muted">${H(i.b.kpi)}: ${H(R18.chgText?R18.chgText(i.b):i.b.from+" to "+i.b.to)}</p>`:""}<p class="small muted">Connected through: ${H(i.on.join("; "))}</p><div class="r18-cc-f"><span>${H(i.top.m.owner||"")}</span><button type="button" class="btn quiet" data-r18-app="${H(i.top.a.id)}">Open</button></div></article>`).join("")}</div></section>`}
function install(){const prev=_R.home;if(!prev||prev.__r18g)return;const f=function(){const k=S.persona;if(lvl()==="exec"&&!ST.fullHome&&(k==="exec"||k==="board")&&PERSONAS[k]&&!PERSONAS[k].generic){try{return simple()}catch(e){console.error("r18 simple home",e)}}
  let h=prev.apply(this,arguments);
  if(OWNFN[S.persona]){try{const c=connected();const i=h.indexOf("</section>");if(c&&i>0)h=h.slice(0,i+10)+c+h.slice(i+10)}catch(e){console.error('r18 connected',e)}}
  if(ST.fullHome&&lvl()==="exec"){h=h.replace(/<div class="screen([^"]*)">/,m=>m+`<p class="small muted r18-simplelink">You are seeing the full working home. <button type="button" class="r18-lk" data-r18-full="0">Back to the simple view</button></p>`)}
  return h};f.__r18g=1;_R.home=f}
install();
D.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r18-full]");if(b){ST.fullHome=b.dataset.r18Full==="1";render();return}
 const r=e.target.closest&&e.target.closest("[data-r15d-role]");if(r){setTimeout(()=>{ST.lensBy=null;applyLens();render()},30)}});
applyLens();
/* the dashboards family reads Leadership first, then Operations, then the builders */
G(()=>{const f=R15.famOf.exe_dash;if(f){const ord=["exe_dash","obs_dash","r17u_dash","kcs_viz","r16j_dash"];f.views.sort((a,b)=>ord.indexOf(a[0])-ord.indexOf(b[0]))}});
/* tabs of the Dashboards family that belong to directors and managers are not shown at executive level */
function tag(){D.documentElement.dataset.r18lvl=lvl();applyLens()}
const _render=W.render;W.render=function(){tag();const r=_render.apply(this,arguments);try{execNote()}catch(x){}return r};
function execNote(){if(lvl()!=="exec")return;if(S.screen!=="exe_dash")return;const v=D.getElementById("view");if(!v||v.querySelector(".r18-lvnote"))return;const n=v.querySelector(".r15-fam");const html=`<p class="small muted r18-lvnote">Operations and metrics, chart builders and layout tools sit with directors and managers. <button type="button" class="r18-lk" data-go="r18_levels">See who sees what</button></p>`;if(n)n.insertAdjacentHTML("afterend",html)}
function levelsScreen(){const me=lvl();
 const rows=LEVELS.map(l=>`<tr class="${l.id===me?"on":""}"><td><b>${E(l.n)}</b>${l.id===me?" "+pill("Your level","info"):""}<small class="muted">${E(l.who)}</small></td><td>${E(l.see)}</td><td>${E(l.ctl)}</td><td>${E(l.not)}</td></tr>`).join("");
 const roles=Object.keys(PERSONAS).map(k=>`<tr><td>${E(PERSONAS[k].n)}</td><td>${E((LEVELS.find(l=>l.id===LV[k])||{}).n||"Manager")}</td><td>${E(LENS_OF[k]?LENS_OF[k].toUpperCase():"None")}</td></tr>`).join("");
 return `<div class="screen r18-screen">${hero("Oversee · Views by level","Each level sees what it needs, and can reach the rest","Executives get the headline and drill into anything. Directors and managers get working views and control for their part. Specialists and contributors see their own work. The permission model underneath is one nested model, so a higher level can always open what is below it.")}
 <section class="card glass"><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Level</th><th>What they see first</th><th>What they can do</th><th>What stays out of the way</th></tr></thead><tbody>${rows}</tbody></table></div></section>
 <section class="card glass"><div class="cardhead"><h3>Roles and their level</h3><span class="muted small">Switch roles from the top bar to see the difference.</span></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Role</th><th>Level</th><th>Default lens</th></tr></thead><tbody>${roles}</tbody></table></div></section>
 ${typeof procCard==="function"?procCard("r18_levels"):""}</div>`}
REG("r18_levels","Views by level","lens","M4 20V10M10 20V4M16 20v-8M22 20H2",levelsScreen);
})();
