/* ===== mod_s_thread: the golden thread (stream thread, wave 2). Prefix thr-.
   DC-10 "Trace this": from any numbered item (O-003 objective, O-003.2 key result, PJ-004 project, BL-012 budget line, IV-003 invoice,
   LG-005 ledger line, P-014 process or step, B-012 build) open the thread: objective, key results, project, budget line, invoice, ledger
   line and the process steps that govern each, with the hand-offs between owners shown through ownerChip. Every NUM number on screen
   gets a small "Trace" chip next to it (added after render; never inside another button).
   Links come from the registries through ZLINK.chains (invoice to project, variance to objective) and S.exe.links (work to objective);
   nothing is copied. Dollar figures are modeled. window.THREAD = {build, open, html, steps}. ===== */
(function(){
"use strict";
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const H=U.esc;
const arr=x=>Array.isArray(x)?x:[];
const uniq=a=>[...new Set(a.filter(x=>x!=null&&x!==""))];
const usd=n=>G(()=>U.moneyShort(n),"$"+Math.round(+n||0));
const T=W.THREAD=W.THREAD||{};
const ten=()=>G(()=>DATA.tenant(),"core");
const rows=(k,t)=>G(()=>NUM.rrows(k,t||ten()),[]);
const num=(k,id,t)=>G(()=>NUM.rec(k,id,t),"");
const chipOf=(k,id,t)=>G(()=>NUM.rchip(k,id,t),"");
const own=(name,rec,role)=>name?G(()=>ownerChip(name,{record:rec,role:role||"Owner",size:22}),H(name)):`<span class="muted small">No owner recorded</span>`;
const modeled=`<span class="pill info thr-tag" title="Dollar figures are modeled from the sample organization's budget and contract records">modeled</span>`;

/* ---------- the process step that governs each kind of record (screen process models; numbers from NUM) ---------- */
const STEPMAP={obj:["exe_strat",/state objectives/i],kr:["exe_strat",/key results/i],proj:["port",/turn into a project/i],
 line:["bud_over",/match spend|flag overruns/i],inv:["inv",/^decide/i],led:["bud_req",/fund and record/i]};
const KLAB={obj:"Objective",kr:"Key results",proj:"Project",line:"Budget line",inv:"Invoice",led:"Ledger line",step:"Process steps"};
const ORDER=["obj","kr","proj","line","inv","led"];
T.steps=function(kind){const m=STEPMAP[kind];if(!m)return null;const f=G(()=>FLOWX.get("proc:"+m[0]),null);if(!f)return null;
 const nd=arr(f.nodes).find(n=>n.t!=="trigger"&&n.t!=="end"&&m[1].test(n.n||""));const pn=G(()=>NUM.proc("PROC|"+m[0]),"");
 return {proc:f.name,pnum:pn,step:nd?nd.n:"",snum:nd?G(()=>NUM.step(f,nd),""):"",screen:m[0]}};

/* ---------- build the thread for a start record ---------- */
const ownerOf={obj:r=>r.owner,kr:r=>r.owner,proj:r=>r.owner,line:r=>r.own,inv:r=>{const c=G(()=>S.bud.con.find(x=>arr(x.inv).includes(r.id)),null);return c&&c.own||G(()=>N(r.node).owner,"")},led:r=>r.req};
/* resolve any typed number or native id to {kind,id,tenant} */
function startOf(x){const s=String(x||"").trim();const r=G(()=>NUM.resolve(s),null);
 if(r&&r.kind==="r")return {kind:r.rk,id:r.id,tenant:r.tenant,num:r.num};
 if(r&&(r.kind==="p"||r.kind==="s"||r.kind==="g"))return {kind:"proc",key:r.key,id:r.id||"",num:s.toUpperCase()};
 if(r&&r.kind==="b")return {kind:"build",key:r.key,num:s.toUpperCase()};
 const t=ten();for(const k of ORDER){if(rows(k,t).some(o=>o&&o.id===s))return {kind:k,id:s,tenant:t,num:num(k,s,t)}}
 return null}
T.build=function(x){const st=startOf(x);if(!st)return null;const t=st.tenant||ten();const core=t==="core";
 const R={start:st,tenant:t,levels:{},focus:{},handoffs:[],notes:[]};ORDER.forEach(k=>R.levels[k]=[]);
 if(st.kind==="proc"||st.kind==="build"){R.process=procThread(st);return R}
 const all={};ORDER.forEach(k=>all[k]=rows(k,t));
 const links=core?G(()=>S.exe.links,{}):{};const byId=(k,id)=>all[k].find(o=>o&&o.id===id);
 const objOfProj=p=>Object.keys(links[p]||{}).filter(o=>links[p][o]>0);
 const invP=id=>core?G(()=>ZLINK.chains.invoiceToProject(id),{proj:"",line:""}):{proj:"",line:""};
 let projs=[],objs=[],lines=null,invs=null,leds=null,krs=null;const s=st.id;R.focus[st.kind]=s;
 if(st.kind==="obj"){objs=[s];projs=Object.keys(links).filter(p=>(links[p]||{})[s]>0&&byId("proj",p))}
 if(st.kind==="kr"){const k=byId("kr",s);objs=k?[k.o]:[];krs=[s];projs=Object.keys(links).filter(p=>objs.some(o=>(links[p]||{})[o]>0)&&byId("proj",p))}
 if(st.kind==="proj"){projs=[s]}
 if(st.kind==="line"){const l=byId("line",s);projs=l?[l.p]:[];lines=[s]}
 if(st.kind==="inv"){const ip=invP(s);projs=ip.proj?[ip.proj]:[];lines=ip.line?[ip.line]:null;invs=[s];if(!ip.proj)R.notes.push(ip.via?"This invoice is billed to "+ip.via+": it reaches no project.":"No contract or trace record links this invoice to a project.")}
 if(st.kind==="led"){const e=byId("led",s);projs=e&&e.p?[e.p]:[];lines=e&&e.line?[e.line]:null;leds=[s];if(e&&!e.p)R.notes.push("A portfolio reserve entry: it is not posted to one project.")}
 if(!objs.length)objs=uniq(projs.flatMap(objOfProj));
 if(!krs)krs=all.kr.filter(k=>objs.includes(k.o)).map(k=>k.id);
 if(!lines)lines=all.line.filter(l=>projs.includes(l.p)).map(l=>l.id);
 if(!invs)invs=all.inv.filter(i=>{const ip=invP(i.id);return ip.proj&&projs.includes(ip.proj)&&(!ip.line||lines.includes(ip.line)||st.kind!=="line")}).map(i=>i.id);
 if(st.kind==="line")invs=invs.filter(i=>{const ip=invP(i);return !ip.line||ip.line===s});
 if(!leds)leds=all.led.filter(e=>e.line?lines.includes(e.line):e.p&&projs.includes(e.p)).map(e=>e.id);
 const put=(k,ids)=>{R.levels[k]=uniq(ids).map(id=>byId(k,id)).filter(Boolean).map(r=>rowOf(k,r,t,links,objs))};
 put("obj",objs);put("kr",krs);put("proj",projs);put("line",lines);put("inv",invs);put("led",leds);
 if(!projs.length&&st.kind==="obj")R.notes.push(core?"No funded work is linked to this objective yet.":"This tenant's pack records no link from objectives to work yet.");
 /* hand-offs: walk the spine in order and note each change of owner (focus record first at each level) */
 let prev=null;ORDER.forEach(k=>{const L=R.levels[k];if(!L.length)return;const f=L.find(x=>x.id===R.focus[k])||L[0];if(!f.owner)return;
  if(prev&&prev.owner!==f.owner)R.handoffs.push({from:prev,to:f});prev=f});
 R.steps=ORDER.filter(k=>R.levels[k].length).map(k=>Object.assign({kind:k},T.steps(k)||{})).filter(x=>x.pnum);
 return R};
function rowOf(k,r,t,links,objs){const o={kind:k,id:r.id,num:num(k,r.id,t),name:G(()=>NUM.RKINDS[k].name(r),r.id),owner:G(()=>ownerOf[k](r),"")||"",fig:"",figT:"",st:""};
 if(k==="obj"){const pg=G(()=>EXE.objProg(r),null);if(pg){o.fig=Math.round(pg.p*100)+"% of the way";o.figT="Score from its key results (prototype fact from the key result values)";o.st=pg.st}}
 if(k==="kr"){const cur=G(()=>EXE.fmtKr(r),null);if(cur!=null){o.fig=cur+" toward "+G(()=>EXE.fmtKr(r,r.tgt),"");o.st=G(()=>EXE.krSt(r),"")}}
 if(k==="proj"){const w=links[r.id]||{};const ws=Object.keys(w).filter(x=>w[x]>0);o.fig=(r.bac!=null?usd(r.bac*1000)+" approved":"")+(ws.length?" · counts toward "+ws.map(x=>Math.round(w[x]*100)+"% "+(G(()=>NUM.rec("obj",x,t),"")||x)).join(", "):"");o.money=true}
 if(k==="line"){const v=(+r.fcst||0)-(+r.appr||0);o.fig=usd(r.appr)+" approved, "+usd(r.fcst)+" forecast ("+(v>0?"+":"")+usd(v)+")";o.money=true;o.st=v>0?"warn":"good";
  if(t==="core"){const vo=G(()=>ZLINK.chains.varianceToObjective(r.id),null);if(vo&&vo.rows&&vo.rows.length&&v)o.sub="Variance carried to objectives: "+vo.rows.map(x=>(G(()=>NUM.rec("obj",x.obj,t),"")||x.obj)+" "+(x.wvar>0?"+":"")+usd(x.wvar)+" (score "+x.score+"%)").join(", ")}}
 if(k==="inv"){o.fig=usd(r.amt)+(r.rec?" · advisor: "+r.rec:"");o.money=true;o.st=r.rec==="hold"||r.rec==="reject"?"bad":"good"}
 if(k==="led"){o.fig=(r.amt<0?"draws ":"adds ")+usd(Math.abs(r.amt))+" · "+(r.st||"");o.money=true;o.st=r.st==="Pending"?"warn":"good"}
 return o}
/* a process or build number: the step, the records it governs, and their thread anchors */
function procThread(st){let key=st.key;if(st.kind==="build"){const B=G(()=>JXR.builds().find(x=>NUM.build(x.key)===st.num),null);return {build:B?B.title:"",note:"A build is an agent or robot to build for a journey step. Open it to see the process step it serves.",num:st.num}}
 const f=G(()=>FLOWX.get(NUM.flowId(key)),null);const pk=String(key).indexOf("PROC|")===0?key.slice(5):"";
 const kinds=Object.keys(STEPMAP).filter(k=>STEPMAP[k][0]===pk);
 return {name:f?f.name:"",num:st.num,kinds,records:kinds.flatMap(k=>rows(k).slice(0,12).map(r=>({kind:k,id:r.id,num:num(k,r.id),name:G(()=>NUM.RKINDS[k].name(r),r.id)})))}}

/* ---------- render ---------- */
const stp=s=>s?`<span class="thr-st thr-${H(s)}" aria-hidden="true"></span>`:"";
function rowHTML(o,focus,t){const rec=(o.kind==="line"?"budget_line":o.kind==="led"?"ledger":o.kind==="inv"?"invoice":o.kind==="kr"?"key_result":o.kind==="obj"?"objective":"project")+":"+o.id;
 return `<li class="thr-row${focus?" thr-focus":""}"><div class="thr-rh">${stp(o.st)}<button type="button" class="thr-open" data-num-open="${H(o.num)}" title="Open ${H(o.num)}">${o.num?`<span class="num-chip">${H(o.num)}</span>`:""}<b>${H(o.name)}</b></button></div>
 <div class="thr-rm">${own(o.owner,rec)}${o.fig?`<span class="small thr-fig">${H(o.fig)}${o.money?" "+modeled:""}</span>`:""}</div>${o.sub?`<p class="small muted thr-sub">${H(o.sub)}</p>`:""}</li>`}
T.html=function(R){if(!R)return `<p class="muted">Nothing to trace for that number.</p>`;const st=R.start;
 if(R.process){const P=R.process;if(P.build!=null&&P.records==null)return `<h2 class="thr-h">Thread for ${H(P.num)}${P.build?": "+H(P.build):""}</h2><p class="muted">${H(P.note)}</p><button type="button" class="btn" data-num-open="${H(P.num)}">Open ${H(P.num)}</button>`;
  return `<h2 class="thr-h">Thread for ${H(P.num)}: ${H(P.name||"process")}</h2>${P.records.length?`<p class="small muted">This process governs ${P.kinds.map(k=>H((KLAB[k]||k).toLowerCase())).join(" and ")}. Trace one of them for the full thread.</p><ul class="thr-list">${P.records.map(r=>`<li class="thr-row"><div class="thr-rh"><button type="button" class="thr-open" data-thr-trace="${H(r.num)}"><span class="num-chip">${H(r.num)}</span><b>${H(r.name)}</b></button></div></li>`).join("")}</ul>`:`<p class="muted">No objective, project, budget line, invoice or ledger record is governed by this process in the golden thread. Open it in the designer to see its steps.</p>`}<div class="row"><button type="button" class="btn" data-num-open="${H(P.num)}">Open ${H(P.num)} in the designer</button></div>`}
 const head=R.levels[st.kind].find(x=>x.id===st.id)||{name:st.id,num:st.num};
 const lv=ORDER.map(k=>{const L=R.levels[k];return `<section class="thr-lv" data-thr-level="${k}"><div class="thr-lh"><span class="eyebrow">${H(KLAB[k])}</span><span class="small muted">${L.length||"none"}</span></div>${L.length?`<ul class="thr-list">${L.map(o=>rowHTML(o,o.id===R.focus[k],R.tenant)).join("")}</ul>`:`<p class="small muted thr-none">${k==="inv"?"No invoice on this thread yet.":k==="led"?"No reserve ledger entry on this thread.":k==="kr"?"No key results recorded.":"None linked."}</p>`}</section>`}).join("");
 const ho=R.handoffs.length?`<ol class="thr-ho">${R.handoffs.map(h=>`<li><span class="thr-hol">${H(KLAB[h.from.kind])} <span class="num-chip">${H(h.from.num)}</span> to ${H(KLAB[h.to.kind].toLowerCase())} <span class="num-chip">${H(h.to.num)}</span></span><span class="thr-hop">${own(h.from.owner,"",h.from.kind==="obj"?"Owner":"Hands off")}<span class="thr-arrow" aria-label="hands off to">→</span>${own(h.to.owner,"","Receives")}</span></li>`).join("")}</ol>`:`<p class="small muted">One owner carries the whole thread, so there is no hand-off.</p>`;
 const steps=R.steps.length?`<ul class="thr-steps">${R.steps.map(s=>`<li><span class="small muted">${H(KLAB[s.kind])}</span> <button type="button" class="thr-open" data-num-open="${H(s.snum||s.pnum)}"><span class="num-chip">${H(s.snum||s.pnum)}</span>${H(s.step||s.proc)}</button> <span class="small muted">in ${H(s.pnum)} ${H(s.proc)}</span></li>`).join("")}</ul>`:"";
 return `<div class="thr" data-thr="${H(st.num||st.id)}"><div class="eyebrow">Golden thread</div><h2 class="thr-h">${st.num?`<span class="num-chip">${H(st.num)}</span> `:""}${H(head.name||st.id)}</h2>
 <p class="small muted">From the objective to the money and the work: each level reads its own registry, and a click opens the record. ${R.tenant!=="core"?"Shown for "+H(G(()=>DATA.tenantInfo(R.tenant).org,R.tenant))+". ":""}Dollar figures are modeled; scores come from key result values (prototype facts).</p>
 ${R.notes.map(n=>`<p class="small thr-note">${H(n)}</p>`).join("")}
 <div class="thr-spine">${lv}</div>
 <section class="thr-lv"><div class="thr-lh"><span class="eyebrow">Hand-offs between owners</span><span class="small muted">${R.handoffs.length}</span></div>${ho}</section>
 ${steps?`<section class="thr-lv"><div class="thr-lh"><span class="eyebrow">${H(KLAB.step)}</span></div>${steps}</section>`:""}</div>`};
T.open=function(x){const R=T.build(x);G(()=>openDrawer(T.html(R)));G(()=>audit("traced golden thread",String(x)));return !!R};

/* ---------- "Trace" chip next to every number on screen ---------- */
function decorate(root){root=root||D;arr([...root.querySelectorAll(".num-chip:not([data-thr-done])")]).forEach(c=>{c.setAttribute("data-thr-done","1");
 if(c.closest("button,a,[role=button],.thr,.num-pal,.thr-open,select,option,label"))return;const n=String(c.textContent||"").trim();if(!n||!G(()=>NUM.resolve(n),null))return;
 const b=D.createElement("button");b.type="button";b.className="thr-chip";b.setAttribute("data-thr-trace",n);b.setAttribute("aria-label","Trace this: "+n);b.title="Trace this: the golden thread from "+n;b.textContent="Trace";c.insertAdjacentElement("afterend",b)})}
T.decorate=decorate;
let dq=0;const sch=()=>{if(dq)return;dq=setTimeout(()=>{dq=0;G(()=>decorate(D),0)},120)};
G(()=>HOOKS.on("afterRender",sch,{id:"thread.decorate",order:60}));
G(()=>HOOKS.on("afterOpenDrawer",sch,{id:"thread.decorate.drawer",order:60}));
G(()=>new MutationObserver(m=>{for(const r of m)for(const n of r.addedNodes){if(n.nodeType===1&&(n.classList&&n.classList.contains("num-chip")||n.querySelector&&n.querySelector(".num-chip:not([data-thr-done])"))){sch();return}}}).observe(D.body,{childList:true,subtree:true}));
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-thr-trace]");if(!t)return;e.preventDefault();e.stopPropagation();T.open(t.getAttribute("data-thr-trace"))},true);
})();
