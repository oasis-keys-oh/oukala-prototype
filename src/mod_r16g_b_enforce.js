/* ===== mod_r16g_b_enforce: enforcement points for PERM (mod_r16g_a_perm.js).
   Navigation (hidden), screens (denied state), tabs and sections in drawers, org chart badges, field masks in drawers and tables,
   every approve/reject/decide/edit control by click, keyboard (Enter, Space, inbox A/R/D) and form submit, inbox adapters, search. ===== */
(function(){
const W=window;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=U.esc;
const PM=()=>W.PERM;
const on=()=>PM()&&PM().state.enforce;
const personaName=()=>G(()=>PERSONAS[S.persona].n,S.persona);
/* ---------------- screens ---------------- */
function deniedScreenHTML(id,d){const nm=G(()=>SCREENS.find(s=>s[0]===id)[1],id);const u=PM().principal();
 const chips=(d.trace||[]).map(t=>`<span class="pm-chip ${t.k}"><small>${E(t.k)}</small>${E(t.t?t.v+" · "+t.t:t.v)}</span>`).join("");
 return `<div class="screen pm-deniedscr" data-perm-denied="${E(id)}"><section class="hero"><div class="eyebrow">Not permitted</div><h1>${E(nm)} is not available to ${E(personaName())}</h1>
 <p class="story">${E(d.why||"Your role does not include this screen.")}</p></section>
 <section class="card glass"><div class="cardhead"><h3>How this was decided</h3><span class="muted small">Evaluated by the Permissions model; the attempt is in the audit trail</span></div>
 <div class="pm-chips">${chips}</div>
 <dl class="pm-kv"><dt>Evaluated as</dt><dd>${E(personaName())} (${E(u.user)})</dd><dt>Roles</dt><dd>${u.roles.map(r=>`<span class="pill info">${E((PM().roles.find(x=>x.id===r)||{}).n||r)}</span>`).join(" ")}</dd><dt>Groups</dt><dd>${u.groups.map(g=>`<span class="pill mute">${E((PM().groups.find(x=>x.id===g)||{}).n||g)}</span>`).join(" ")||"None"}</dd><dt>Screen</dt><dd><code>screen:${E(id)}</code></dd></dl>
 <div class="row" style="margin-top:14px"><button class="btn primary" data-go="home">Go to Home</button><button class="btn" data-pm-explain="${E(u.user)}|read|screen:${E(id)}">Explain this decision</button><button class="btn quiet" data-pm-reqperm>Request access</button></div></section></div>`}
let wrapN=-1;
function wrapScreens(){if(typeof _R==="undefined")return;const ks=Object.keys(_R);
 ks.forEach(id=>{const f=_R[id];if(typeof f!=="function"||f.__pm)return;const w=function(){if(on()&&id!=="home"){const d=PM().can(null,"read","screen:"+id);if(!d.ok){PM().logDenial(PM().principal(),d,{rec:""});return deniedScreenHTML(id,d)}}return f.apply(this,arguments)};w.__pm=1;_R[id]=w})}
/* CL-35: HOOKS, not a render wrapper; orders -2020 and 2020 keep the old wrapper position (outside r15d, inside r18g) */
HOOKS.on("beforeRender",()=>{try{wrapScreens()}catch(e){console.error("perm wrap",e)}},{id:"perm.wrap",order:-2020});
HOOKS.on("afterRender",()=>{try{if(typeof sweep==="function")sweep()}catch(e){console.error("perm sweep",e)}},{id:"perm.sweep",order:2020});

/* ---------------- navigation ---------------- */
function navDenied(id){return !PM().can(null,"read","screen:"+id).ok}
if(W.NAVX&&NAVX.html&&!NAVX._pm){NAVX._pm=1;const h0=NAVX.html;NAVX.html=function(){const raw=h0.apply(this,arguments);if(!on())return raw;
  try{const root=document.createElement("div");root.innerHTML=raw;let n=0;
   root.querySelectorAll("[data-nx-it]").forEach(el=>{const id=el.dataset.nxIt;if(id&&id!=="home"&&navDenied(id)){el.remove();n++}});
   root.querySelectorAll("details.navgd,details.r15d-more").forEach(g=>{if(!g.querySelector("[data-nx-it]"))g.remove();else{const c=g.querySelector(".nx-gc");if(c&&/^\d+$/.test(c.textContent.trim()))c.textContent=g.querySelectorAll("[data-nx-it]").length}});
   root.querySelectorAll("section.r15d-pins").forEach(g=>{if(!g.querySelector("[data-nx-it]"))g.remove()});
   return root.innerHTML}catch(e){console.error("perm nav",e);return raw}}}

/* ---------------- drawers: tabs and sections of a person ---------------- */
const TABMAP=[[/^performance( and growth)?$/i,["person.performance"]],[/^delivery performance$/i,["person.performance"]],[/^pay and pto$/i,["person.pay","person.pto"]],[/^pay$/i,["person.pay"]],[/^pto$/i,["person.pto"]],[/^reviews?$/i,["person.reviews"]],[/^access$/i,["person.access"]],[/^lifecycle$/i,["person.lifecycle"]],[/^time$/i,["person.time"]],[/^pending$/i,["person.plate"]]];
const secOf=l=>{const m=TABMAP.find(x=>x[0].test(String(l).trim()));return m?m[1]:null};
function subjectOf(root){const h=root.querySelector(".p360h h2");return h?h.textContent.trim():""}
function sweepViews(root,subject){let hid=0;
 root.querySelectorAll(".views[data-views]").forEach(v=>{const nm=v.dataset.views;if(nm!=="p360"&&nm!=="org_p")return;if(v.dataset.pmDone===subject)return;
  const labels=[...v.querySelectorAll(":scope > .vsw > label")];const inputs=[...v.querySelectorAll(":scope > input")];const panes=[...v.querySelectorAll(":scope > .panes > .pane")];
  let checked=inputs.findIndex(i=>i.checked);const keep=[];
  labels.forEach((l,i)=>{const secs=secOf(l.textContent);let ok=true;if(secs){ok=secs.some(s=>PM().section(null,s,subject).ok)}else{ok=true}if(ok)keep.push(i);else hid++});
  [...labels.keys()].filter(i=>keep.indexOf(i)<0).forEach(i=>{labels[i].remove();inputs[i]&&inputs[i].remove();panes[i]&&panes[i].remove()});
  const nl=[...v.querySelectorAll(":scope > .vsw > label")],ni=[...v.querySelectorAll(":scope > input")];
  ni.forEach((inp,j)=>{inp.id="v-"+nm+"-"+j;inp.dataset.vw=nm+":"+j;if(nl[j])nl[j].setAttribute("for",inp.id)});
  let ci=keep.indexOf(checked);if(ci<0)ci=0;ni.forEach((inp,j)=>{inp.checked=j===ci});try{S.v[nm]=ci}catch(e){}
  v.dataset.pmDone=subject;
  /* the pay and PTO pane mixes both: remove the blocks the viewer may not see */
  v.querySelectorAll(".pane h4.org5-h").forEach(h=>{const t=h.textContent.trim().toLowerCase();const need=t==="compensation"||t==="benefits"?"person.pay":t==="pto"?"person.pto":null;if(!need)return;
   if(!PM().section(null,need,subject).ok){const rm=[h];let x=h.nextElementSibling;while(x&&x.tagName!=="H4"){rm.push(x);x=x.nextElementSibling}rm.forEach(n=>n.remove());hid++}});
  /* reveal log for sections that are actually shown */
  const act=[...v.querySelectorAll(":scope > .vsw > label")][ci];if(act){const secs=secOf(act.textContent);if(secs)secs.forEach(s=>{if(/pay|performance|pto|reviews/.test(s)&&PM().section(null,s,subject).ok)PM().logReveal(PM().principal(),"section:"+s,subject,"Opened "+act.textContent.trim()+" of "+subject)})}
 });return hid}
function maskKV(root,subject){/* label-bound field masks inside drawers and tables */
 const MAP=[[/^rate$/i,"person","rate"],[/^email$/i,"person","email"],[/^location$/i,"person","location"],[/^next time off$/i,"person","pto_balance"]];
 root.querySelectorAll("dl.kv").forEach(dl=>{[...dl.querySelectorAll("dt")].forEach(dt=>{const m=MAP.find(x=>x[0].test(dt.textContent.trim()));if(!m)return;const dd=dt.nextElementSibling;if(!dd||dd.tagName!=="DD")return;const mode=PM().fieldMode(null,m[1],m[2],subject||null);
   if(mode==="hidden"){dd.remove();dt.remove()}else if(mode==="masked"&&!dd.dataset.pmMask){dd.dataset.pmMask=1;dd.innerHTML='<span class="pm-mask" title="Masked by a field rule">••••••</span>'}})});
 root.querySelectorAll(".p360grid .stat").forEach(st=>{const sm=st.querySelector("small");if(!sm)return;if(/^next time off$/i.test(sm.textContent.trim())){const mode=PM().fieldMode(null,"person","pto_balance",subject||null);if(mode==="hidden"||mode==="masked"){const n=st.querySelector(".num");if(n&&!n.dataset.pmMask){n.dataset.pmMask=1;n.innerHTML='<span class="pm-mask">••••</span>'}}}});
 /* Overview of Person 360 shows a performance baseline stat in some builds */
}
function sweepDrawer(){const d=document.getElementById("drawer");if(!d||!d.firstElementChild)return;const subject=subjectOf(d);if(subject){sweepViews(d,subject);maskKV(d,subject);gateProfileActions(d,subject)}}
function gateProfileActions(d,subject){d.querySelectorAll(".org5-pa [data-org5]").forEach(b=>{const k=b.dataset.org5;const need=/^(edit|move|term|leaver|status)/.test(k)?"person.lifecycle":null;if(!need)return;if(!PM().section(null,need,subject).ok){b.disabled=true;b.setAttribute("aria-disabled","true");b.title="Lifecycle actions need People Operations or the executive office";b.classList.add("pm-locked")}})}

/* ---------------- #view: org chart tabs, badges, tables ---------------- */
function sweepOrg(root){const tabs=root.querySelectorAll(".org-tabs [data-org-tab]");
 if(tabs.length){const MAPT={act:"org.lifecycle",vac:"org.vacancies",sync:"org.sync"};tabs.forEach(b=>{const s=MAPT[b.dataset.orgTab];if(s&&!PM().section(null,s).ok){if(b.getAttribute("aria-selected")==="true"){const pane=root.querySelector(".org-pane");if(pane&&!pane.dataset.pmDen){pane.dataset.pmDen=1;pane.innerHTML=`<div class="pm-deniedsec"><b>${E(b.textContent.trim())} is not permitted for ${E(personaName())}</b><p class="muted small">Rule: section:${E(s)}. <button class="btn sm" data-org-tab="chart">Back to the org chart</button></p></div>`}}b.remove()}})}
 /* cards: workload badge is the field person.load for that person */
 const cache={};const load=n=>cache[n]!=null?cache[n]:(cache[n]=PM().fieldMode(null,"person","load",n)==="hidden"||PM().fieldMode(null,"person","load",n)==="masked");
 root.querySelectorAll(".org-card[data-org-open]").forEach(c=>{if(c.dataset.pmLd)return;c.dataset.pmLd=1;const n=c.dataset.orgOpen;if(!load(n))return;c.querySelectorAll(".org-m em").forEach(em=>{if(/% load/.test(em.textContent))em.remove()});const a=c.getAttribute("aria-label");if(a)c.setAttribute("aria-label",a.replace(/, load \d+ percent/,""))});
 root.querySelectorAll(".org-ol[data-org-open]").forEach(c=>{if(c.dataset.pmLd)return;c.dataset.pmLd=1;const n=c.dataset.orgOpen;if(!load(n))return;const sm=c.querySelector("small");if(sm)sm.textContent=sm.textContent.replace(/ · \d+% load/,"")});
 /* directory table columns bound to restricted attributes */
 root.querySelectorAll("table").forEach(t=>{if(t.dataset.pmCols)return;t.dataset.pmCols=1;const ths=[...t.querySelectorAll("thead th")];ths.forEach((th,i)=>{const L=th.textContent.trim().toLowerCase();let f=null;if(/^(load|workload)$/.test(L))f="load";else if(/^(rating|last rating)$/.test(L))f="rating";else if(/^(salary|base salary|pay)$/.test(L))f="salary";else if(/^rate$/.test(L)&&false)f="rate";if(!f)return;
   const rows=[...t.querySelectorAll("tbody tr")];const first=rows[0];const nm=first&&first.querySelector("[data-person],[data-org-open]");const sample=nm?(nm.dataset.person||nm.dataset.orgOpen):null;if(!sample)return;
   rows.forEach(r=>{const who=r.querySelector("[data-person],[data-org-open]");const n=who&&(who.dataset.person||who.dataset.orgOpen);const m=PM().fieldMode(null,"person",f,n);const td=r.children[i];if(td&&(m==="hidden"||m==="masked"))td.innerHTML='<span class="pm-mask" title="Masked by a field rule">••••</span>'})})})}

/* sensitive tab opened by switching tabs (no re-render): log the reveal */
document.addEventListener("change",e=>{const t=e.target;if(!t||!t.dataset||!t.dataset.vw||!on())return;const m=/^(p360|org_p):(\d+)$/.exec(t.dataset.vw);if(!m)return;const d=document.getElementById("drawer");const subject=d?subjectOf(d):"";if(!subject)return;
 const lab=t.parentElement.querySelectorAll(":scope > .vsw > label")[+m[2]];if(!lab)return;const secs=secOf(lab.textContent);if(secs)secs.forEach(s=>{if(/pay|performance|pto|reviews/.test(s)&&PM().section(null,s,subject).ok)PM().logReveal(PM().principal(),"section:"+s,subject,"Opened "+lab.textContent.trim()+" of "+subject)})},true);
/* ---------------- controls: approve / reject / decide / edit ---------------- */
const SCR_ENT={inv:"invoice",itsm_chg:"change_request",bud_req:"budget_request",flw_appr:"approval",inbox:"approval",plat_gate:"approval",r15_p2p:"requisition",r15_time:"timesheet",adm_sec:"access_review",r15_iam:"access_request",ppl_perf:"perf_feedback",ppl_av:"pto_request",org_chart:"pto_request"};
const ADP_ENT={inv:"invoice",chg:"change_request",budreq:"budget_request",cat:"approval"};
const BUDACT=/^(approve|reject|decline|decide|defer|return)/i;
const GENERIC=/^(approve|reject|decline|decide|release|certify|sign off|approve and (fund|next)|return to requester)\b/i;
function recForBR(id){const r=G(()=>BUDREQ.requests().find(q=>q.id===id),null);return r?{id:r.id,requester:r.req,owner:r.req,stage:r.st,amount:r.amt,named:G(()=>BUDREQ.rev(r.st,r).name,""),classification:"confidential"}:{id,classification:"confidential"}}
/* PR-20: change and catalog decisions carry their record, so the one group model (APG) can bind them */
function recForChg(cid,si,ai){const c=G(()=>ITSMX.getChange(cid),null);const a=G(()=>c.stages[+si].ap[+ai],null);return c?{id:c.id,requester:c.req||"",service:c.svc||"",apg:a&&a.apg||null,role:a&&a.r||"",named:a&&a.w||"",classification:"internal"}:{id:cid}}
function recForCat(rid,k){const r=G(()=>REQREG.find(x=>x.id===rid),null);const a=r&&r.ap&&r.ap[k];const st=G(()=>svcStatus(rid),{})||{};return{kind:"catalog",id:rid,requester:st.requester||(r&&r.requester)||"",apg:a&&a.apg||null,named:a&&a.who||""}}
const recOfIt=(k,it)=>G(()=>APG.recOfItem(k,it),null);
/* returns [action, entity, record, label] or null for an element */
function classify(el){const ds=el.dataset||{};
 if(ds.brAct!==undefined){const [id,a]=ds.brAct.split(":");return["approve","budget_request",recForBR(id),a+" "+id]}
 if(ds.itsmA==="cab"&&ds.id){const [cid,si,ai,dec]=ds.id.split(":");return["approve","change_request",recForChg(cid,si,ai),"Decide change "+cid+(dec?" ("+dec+")":"")]}
 if(ds.svc&&/^(approve|rejectf)\|/.test(ds.svc)){const [,rid,k]=ds.svc.split("|");return["approve","approval",recForCat(rid,k),"Decide catalog request "+rid]}
 if(ds.budLed!==undefined)return["approve","budget_line",null,"Decide a budget ledger entry"];
 if(ds.budEdit!==undefined||ds.budRefc!==undefined||ds.budNewpo!==undefined||ds.budXf!==undefined||ds.budPoa!==undefined)return["update","budget_line",null,"Change a budget line"];
 if(ds.budPo!==undefined||ds.budPoa!==undefined)return["update","budget_line",null,"Purchase order"];
 if(ds.inbxAct&&/^(approve|reject|delegate)$/.test(ds.inbxAct)){const it=G(()=>INBOX.items?INBOX.items().find(x=>x.id===ds.id):null,null);const ent=it&&it.src&&ADP_ENT[it.src]||"approval";return["approve",ent,it&&it.src==="budreq"?recForBR(it.sid):it&&(it.src==="chg"||it.src==="cat")?recOfIt(it.src,it):null,"Decide inbox item"]}
 if(ds.org5==="reveal")return["reveal","compensation_record",ds.n,"Reveal compensation of "+ds.n];
 if(ds.org5==="ptook"||ds.org5==="ptono")return["approve","pto_request",ds.n,"Decide PTO for "+ds.n];
 if(ds.org5==="as")return["update","permission",null,"Switch the viewing identity"];
 if(ds.r3iOk!==undefined||ds.r3iNo!==undefined)return["approve","access_request",null,"Decide an access request"];
 if(ds.r3iKeep!==undefined||ds.r3iRev!==undefined||ds.r3iGrevoke!==undefined)return["approve","access_review",null,"Decide an access review item"];
 if(ds.pmDecide!==undefined)return["approve","permission_change",null,"Decide a permission change"];
 const tx=(el.textContent||"").trim();
 if(el.matches("button,[role=button]")&&GENERIC.test(tx)&&!el.closest("#r16gperm")){const ent=SCR_ENT[S.screen]||"approval";return["approve",ent,null,tx.slice(0,40)]}
 return null}
const CSEL="[data-itsm-a=cab],[data-svc^='approve|'],[data-svc^='rejectf|'],[data-br-act],[data-bud-led],[data-bud-edit],[data-bud-refc],[data-bud-newpo],[data-bud-xf],[data-bud-poa],[data-inbx-act],[data-org5=reveal],[data-org5=ptook],[data-org5=ptono],[data-org5=as],[data-r3i-ok],[data-r3i-no],[data-r3i-keep],[data-r3i-rev],[data-r3i-grevoke],[data-pm-decide],button,[role=button]";
function ctrlOf(t){const el=t.closest&&t.closest(CSEL);return el}
function block(e,el){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation()}
function guardEvent(e){if(!on())return;const el=ctrlOf(e.target);if(!el||el.disabled&&false)return;const c=classify(el);if(!c)return;
 if(c[0]==="reveal"||c[0]==="approve"||c[0]==="update"){if(!PM().require(c[0],c[1],c[2],c[3])){block(e,el)}}}
["click","auxclick"].forEach(t=>document.addEventListener(t,guardEvent,true));
document.addEventListener("keydown",e=>{if(!on())return;const k=e.key;
 if(k==="Enter"||k===" "||k==="Spacebar"){const el=ctrlOf(e.target);if(!el)return;const c=classify(el);if(!c)return;if(!PM().require(c[0],c[1],c[2],c[3]))block(e,el);return}
 /* inbox shortcuts A, R, D act on the current card */
 if(/^[ard]$/i.test(k)&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName||""))){const card=document.querySelector("[data-inbx-act=approve]");if(card&&card.offsetParent!==null&&document.querySelector("#inbxPanel:popover-open,#inbxFocus:popover-open,#inbxFocus[open]")){const c=classify(card);if(c&&!PM().require(c[0],c[1],c[2],c[3]))block(e,card)}}},true);
document.addEventListener("submit",e=>{if(!on())return;const f=e.target;const btn=f.querySelector&&f.querySelector("[data-br-act],[data-fsubmit]");const fid=f.dataset&&f.dataset.form;if(fid&&!formAllowed(fid)){block(e,f)}},true);
/* forms: decide/edit forms are gated by their id, whatever opened them */
const FORMGATE=[[/^budreq_dec$/,"approve","budget_request",t=>{const m=/BR-\d+/.exec(t);return m?recForBR(m[0]):null}],[/^bud_(led|dec|appr)/,"approve","budget_line"],[/^(bud_edit|bud_reforecast|bud_po|bud_xf|bud_line|bud_alloc|bud_rule|budreq_sc)/,"update","budget_line"],[/^adm_bud$/,"update","permission"],[/^(pm_|r16g)/,"update","permission"],[/^(org5_(pay|comp)|hr_comp)/,"update","compensation_record"],[/^itsm_chg_(appr|decide)/,"approve","change_request"],[/^inv_(approve|hold|release)/,"approve","invoice"]];
function formAllowed(fid){const spec=G(()=>FORMSPEC[fid],null);if(!spec)return true;const g=FORMGATE.find(x=>x[0].test(spec.id||fid));if(!g)return true;const rec=g[3]?g[3](spec.title||""):null;
 if(!PM().require(g[1],g[2],rec,spec.title||spec.id))return false;return true}
if(typeof submitForm==="function"&&!W.__pmSubmit){W.__pmSubmit=1;const s0=submitForm;submitForm=function(fid){if(on()&&!formAllowed(fid))return false;return s0.apply(this,arguments)}}
if(typeof openForm==="function"&&!W.__pmOpenForm){W.__pmOpenForm=1;const o0=openForm;openForm=function(spec,init){if(on()&&spec){const g=FORMGATE.find(x=>x[0].test(spec.id||""));if(g){const rec=g[3]?g[3](spec.title||""):null;if(!PM().require(g[1],g[2],rec,spec.title||spec.id))return}}return o0.apply(this,arguments)}}
/* inbox adapters and budget API: gate the function, not just the button */
function wrapAdapters(){const A=G(()=>INBOX.adapters,null);if(!A)return;Object.keys(A).forEach(k=>{const a=A[k];if(!a||a.__pm)return;a.__pm=1;
  ["approve","reject","delegate"].forEach(m=>{const f=a[m];if(typeof f!=="function")return;a[m]=function(it){if(on()){const ent=ADP_ENT[k]||"approval";const rec=k==="budreq"&&it?recForBR(it.sid):(k==="chg"||k==="cat")&&it?recOfIt(k,it):null;if(!PM().require("approve",ent,rec,"Decide "+(it&&it.title||k))){return{ok:false,why:"Not permitted: "+PM().decide(null,"approve",ent,rec).why}}}return f.apply(this,arguments)}})})}
if(W.BUDREQ&&BUDREQ.decide&&!BUDREQ.decide.__pm){const d0=BUDREQ.decide;BUDREQ.decide=function(id,act,note,by){
  /* PR-20: group binding and the requester rule are checked inside BUDREQ.decide (APG.check), so they hold with enforcement off */
  const rec=recForBR(id);
  if(on()&&!PM().require("approve","budget_request",rec,act+" "+id))return{ok:false,why:"Not permitted"};return d0.apply(this,arguments)};BUDREQ.decide.__pm=1}
/* proactively lock controls that would be refused (the guard above stays the authority) */
function lockControls(root){const seen={};root.querySelectorAll(CSEL).forEach(el=>{if(el.dataset.pmL==="1")return;const c=classify(el);if(!c)return;const key=c[0]+"|"+c[1]+"|"+(c[2]&&(c[2].id||c[2])||"");let d=seen[key];if(!d)d=seen[key]=PM().can(null,c[0],c[1],c[2]);
  if(!d.ok){el.dataset.pmL="1";el.setAttribute("aria-disabled","true");el.classList.add("pm-locked");el.title=(el.title?el.title+" · ":"")+"Not permitted: "+d.why;if("disabled" in el)el.disabled=true}})}
ROUTER.on("click","[data-pm-reqperm]",(e,b)=>{e.preventDefault();G(()=>closeDrawer());G(()=>NAVX.persona&&0);G(()=>go("r16g_perm"));setTimeout(()=>{G(()=>PM().ui.requestForm())},400)});

/* ---------------- search: no hidden records, no masked fields ---------------- */
function screenIdByTitle(t){const s=G(()=>SCREENS.find(x=>x[1]===t),null);return s?s[0]:null}
function filterRows(rows,get){return rows.filter(r=>{const x=get(r);if(x.screen&&navDenied(x.screen))return false;if(x.ent&&!PM().can(null,"read",x.ent).ok)return false;return true})}
if(typeof searchIndex==="function"&&!W.__pmSI){W.__pmSI=1;const si=searchIndex;searchIndex=function(){const out=si.apply(this,arguments);if(!on())return out;
  const amtMode=G(()=>PM().fieldMode(null,"invoice","amount"),"read");
  return out.filter(r=>{if(r.g==="Go to"){const id=screenIdByTitle(r.t);return !(id&&navDenied(id))}if(r.g==="Invoices"){const m=/^(INV-\d+)/.exec(r.t);return PM().rows(null,"invoice").test(PM().recordOf("invoice",m?m[1]:null))}return true}).map(r=>{if(r.g==="Invoices"&&amtMode!=="read"&&amtMode!=="write")return Object.assign({},r,{m:"••••••"});return r})}}
if(W.NAVX&&NAVX.search&&!NAVX.search.__pm){const s0=NAVX.search;NAVX.search=function(){const r=s0.apply(this,arguments);if(!on()||!r||!r.results)return r;
  const rs=r.results.filter(x=>{if(x.type==="screen"){const id=screenIdByTitle(x.title);return !(id&&navDenied(id))}return true});return Object.assign({},r,{results:rs,total:r.total-(r.results.length-rs.length)})};NAVX.search.__pm=1}
function sweepSearch(){document.querySelectorAll("#sugg.open button[data-sr],#nxPalList li,#nxPalList [role=option]").forEach(el=>{if(el.dataset.pmS)return;el.dataset.pmS=1;const t=(el.querySelector("span,b,.nx-t")||el).textContent.trim();
   const meta=/screen|module|go to/i.test(el.textContent);const id=meta?screenIdByTitle(t):null;if(id&&navDenied(id)){el.remove();return}
   if(/^INV-\d+/.test(t)&&!PM().can(null,"read","invoice").ok)el.remove()})}

/* ---------------- the sweep: one debounced pass over view, drawer and popovers ---------------- */
let busy=false,tm=0;
function sweep(){if(busy||!PM()||!on())return;busy=true;try{wrapAdapters();const v=document.getElementById("view");if(v&&!v.querySelector("[data-perm-denied]")){sweepOrg(v);lockControls(v)}
  const d=document.getElementById("drawer");if(d&&d.firstElementChild){sweepDrawer();lockControls(d)}["inbxPanel","inbxFocus"].forEach(id=>{const x=document.getElementById(id);if(x&&x.firstElementChild)lockControls(x)});sweepSearch()}catch(e){console.error("perm sweep",e)}finally{busy=false}}
function sched(){clearTimeout(tm);tm=setTimeout(sweep,40)}
const mo=new MutationObserver(()=>{if(!busy)sched()});
function start(){const t=document.body;if(!t){setTimeout(start,100);return}mo.observe(t,{childList:true,subtree:true});sched()}
start();
/* CL-35: lifecycle through HOOKS, not an openDrawer wrapper */
if(!W.__pmOD){W.__pmOD=1;HOOKS.on("afterOpenDrawer",()=>{try{if(on())sweepDrawer()}catch(e){console.error("perm drawer",e)}},{id:"perm.drawer",order:1000})}
document.addEventListener("input",e=>{if(e.target&&(e.target.id==="q"||/nxPal/.test(e.target.id||"")))setTimeout(sweep,60)},true);
W.PERM&&(W.PERM.sweep=sweep);
window.addEventListener("load",()=>{if(W.PERM)PERM.sweep=sweep});
})();
