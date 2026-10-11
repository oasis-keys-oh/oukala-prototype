/* ===== Round 16, Agent I: notification center inside the bell panel.
   Tab "Notifications" next to the approval tabs: mark read, clear all (with undo), defer one or many (1 hour, tomorrow, next week,
   pick a date; resurfaces on a timer), escalate with a reason to the owning group or the approver group (emits notification.escalated
   on the EVENTS bus), bulk select, filter by type and priority, group by type, priority or source. Nothing here floats over the page:
   it lives in the panel the bell already opens; the docked banners from Round 15 are untouched. ===== */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const q1=(s,r)=>(r||D).querySelector(s),qa=(s,r)=>[...(r||D).querySelectorAll(s)];
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const NOW=()=>Date.now(),H=3600e3;
const me=()=>G(()=>R15D.me().name,"Casey Rowan");
const KEY=()=>"oukala-r16i-notif:"+G(()=>S.persona,"exec");
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY())||"null")}catch(e){return null}};
const save=()=>{try{localStorage.setItem(KEY(),JSON.stringify({items:ST.items,seeded:1}))}catch(e){}};
const TYPES=[["alert","Alerts"],["approval","Approvals"],["mention","Mentions"],["decision","Decisions"],["system","System"]];
const PR=[["high","High"],["normal","Normal"],["low","Low"]];
const ICON={alert:"M12 3l9 16H3zM12 10v4M12 17h.01",approval:"M5 12l4 4 10-10",mention:"M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7",decision:"M4 5h16l-6 8v6l-4-2v-4z",system:"M12 8v4l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"};
const svg=(d,s)=>`<svg viewBox="0 0 24 24" width="${s||16}" height="${s||16}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const ST={items:[],open:false,type:"all",prio:"all",grp:"none",view:"active",sel:{},def:null,esc:null,undo:null};
const R=W.NOTIF={state:ST};

/* ---------- data: seeded once per persona, then the EVENTS bus adds more ---------- */
function seed(){const t=NOW();const m=(h)=>t-h*H;
 const L=[["alert","high","Standards Portal p95 latency is above 3 seconds for 12 minutes","Observability alert on the Standards Portal service","itom_evt","Platform team",0.2],
 ["alert","high","INC0098 will breach its resolve target in 40 minutes","Service desk SLA timer","itsm_inc","Service desk",0.5],
 ["approval","normal","Invoice INV-2207 (Lumen, $45,000) is waiting for the Finance approver group","Over the commitment by $45,000","inv","Finance",1.5],
 ["decision","normal","BR-0042 moved to Council review","Budget request stage change","bud_req","Finance",3],
 ["mention","normal","Priya Shah mentioned you in the lease export fix","Comment on CHG0061","itsm_chg","Platform team",4],
 ["alert","normal","Lumen indexer milestone is 9 days late","Vendor delivery alert","port","PMO",6],
 ["approval","normal","CHG0057 needs a change advisory board decision before Thursday","Portal TLS certificate renewal","itsm_chg","Change management",7],
 ["system","low","Nightly CMDB discovery finished with 3 warnings","Discovery source: Azure","itom_cmdb","Ops team",9],
 ["decision","low","Knowledge article KB0421 was published","Knowledge review decision","kcs_home","Editors",12],
 ["mention","low","Avery Chen shared the FY27 forecast with you","Budget workbook","bud_over","Finance",20],
 ["system","low","Weekly access review is ready","Entra ID access review","adm_sec","Security",26],
 ["alert","normal","Backup job for the Contract Repository missed its window","Operations alert","itom_run","Ops team",30],
 ["system","low","Three agent skills were retrained","Model governance log","ai_gov","AI agents",40],
 ["approval","high","Segregation of duties check failed on PO-1180","Delegation of authority rule DOA-3","bud_doa","Finance",52]];
 return L.map((x,i)=>({id:"N"+(1000+i),type:x[0],prio:x[1],title:x[2],sub:x[3],src:x[4],group:x[5],ts:m(x[6]),read:i>7&&i%2===0,cleared:false,defer:0,esc:null}))}
function init(){if(ST.inited&&ST.persona===G(()=>S.persona))return;ST.persona=G(()=>S.persona);ST.inited=1;const s=load();ST.items=s&&s.items?s.items:seed();ST.sel={};ST.def=ST.esc=ST.undo=null;tick()}
const known=id=>G(()=>SCREENS.some(s=>s[0]===id),false);
const live=()=>ST.items.filter(n=>!n.cleared&&!(n.defer&&n.defer>NOW()));
const deferred=()=>ST.items.filter(n=>!n.cleared&&n.defer&&n.defer>NOW());
const cleared=()=>ST.items.filter(n=>n.cleared);
const unread=()=>live().filter(n=>!n.read).length;
R.items=()=>ST.items.map(n=>Object.assign({},n));R.unread=unread;
const ago=ts=>{const d=NOW()-ts;if(d<6e4)return"just now";if(d<H)return Math.round(d/6e4)+" min ago";if(d<24*H)return Math.round(d/H)+" h ago";return Math.round(d/24/H)+" d ago"};
const whenTxt=ts=>{const d=new Date(ts);return d.toLocaleString("en-US",{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})};

/* ---------- actions ---------- */
function ev(id,p){G(()=>{if(W.EVENTS){if(!EVENTS.catalog.has(id))EVENTS.register({id,label:id==="notification.escalated"?"Notification escalated":id==="notification.deferred"?"Notification deferred":"Notifications cleared",module:"Notifications",owner:"Tom Becker",notification:false,fields:Object.keys(p).map(k=>({name:k,type:typeof p[k]==="number"?"number":"text"}))});EVENTS.emit(id,p,{source:"notifications",actor:me()})}})}
const byIds=ids=>ids.map(i=>ST.items.find(n=>n.id===i)).filter(Boolean);
function markRead(ids,v){byIds(ids).forEach(n=>n.read=v);save();after("mark")}
function clearIds(ids){const its=byIds(ids).filter(n=>!n.cleared);if(!its.length)return;its.forEach(n=>n.cleared=true);ST.sel={};ST.undo={ids:its.map(n=>n.id),at:NOW(),label:its.length===1?"Cleared 1 notification":"Cleared "+its.length+" notifications"};clearTimeout(ST.ut);ST.ut=setTimeout(()=>{ST.undo=null;paint()},10000);
 G(()=>audit("Cleared notifications",String(its.length)));ev("notification.cleared",{count:its.length,by:me()});save();after("clear")}
function undoClear(){if(!ST.undo)return;byIds(ST.undo.ids).forEach(n=>n.cleared=false);ST.undo=null;clearTimeout(ST.ut);save();G(()=>audit("Restored cleared notifications",""));after("undo")}
function restore(ids){byIds(ids).forEach(n=>n.cleared=false);save();after("restore")}
function deferIds(ids,until){const its=byIds(ids);its.forEach(n=>{n.defer=until;n.read=true});ST.sel={};ST.def=null;G(()=>audit("Deferred notifications",its.length+" until "+whenTxt(until)));ev("notification.deferred",{count:its.length,until:new Date(until).toISOString(),by:me()});save();after("defer");G(()=>toast(its.length+" notification"+(its.length>1?"s":"")+" deferred until "+whenTxt(until),"info"))}
R.defer=(id,ms)=>deferIds([].concat(id),NOW()+ms);
const preset=k=>{const d=new Date();if(k==="1h")return NOW()+H;if(k==="tomorrow"){d.setDate(d.getDate()+1);d.setHours(9,0,0,0);return d.getTime()}if(k==="week"){const add=((8-d.getDay())%7)||7;d.setDate(d.getDate()+add);d.setHours(9,0,0,0);return d.getTime()}return 0};
function tick(){let n=0;ST.items.forEach(x=>{if(x.defer&&x.defer<=NOW()){x.defer=0;x.read=false;x.ts=NOW();x.resurfaced=NOW();n++}});if(n){save();G(()=>audit("Deferred notifications came back",String(n)));after("tick");try{const b=q1("#inbxBell");if(b){b.classList.add("r15d-pulse");setTimeout(()=>b.classList.remove("r15d-pulse"),1600)}}catch(e){}}return n}
R.tick=tick;
function owners(n){const t=G(()=>TEAMS,[]);const tm=t.find(x=>x.n===n.group)||{};const mgr=tm.mgr||"Casey Rowan";
 const appr=/^(approval|decision)$/.test(n.type)?(n.group==="Finance"?"Finance approver group":n.group==="Change management"?"Change advisory board":n.group+" approver group"):G(()=>(window.APPRGRP&&APPRGRP.groupFor&&APPRGRP.groupFor(n.src)),"")||"Platform approver group";
 return{group:n.group,manager:mgr,approver:appr}}
function escalate(ids,k,reason){const its=byIds(ids);if(!reason||reason.trim().length<4)return false;its.forEach(n=>{const o=owners(n);const to=k==="appr"?o.approver:o.group;n.esc={to,manager:o.manager,reason:reason.trim(),at:NOW(),by:me(),via:k==="appr"?"approver group":"owner group"};n.prio="high";n.read=true;
  ev("notification.escalated",{id:n.id,title:n.title,to,manager:o.manager,reason:n.esc.reason,source:n.src,priority:"high",by:me()});
  G(()=>window.NTFX&&NTFX.send&&NTFX.send("approval.escalated",{to:to,msg:"Escalated: "+n.title+". Reason: "+n.esc.reason}))});
 ST.esc=null;ST.sel={};G(()=>audit("Escalated notifications",its.length+" to "+(k==="appr"?"approver group":"owner group")));save();after("esc");G(()=>toast(its.length+" escalated to "+owners(its[0])[k==="appr"?"approver":"group"]+(its.length>1?" and others":""),"good"));return true}

/* ---------- rendering ---------- */
function visible(){let L=ST.view==="deferred"?deferred():ST.view==="cleared"?cleared():live();if(ST.type!=="all")L=L.filter(n=>n.type===ST.type);if(ST.prio!=="all")L=L.filter(n=>n.prio===ST.prio);
 const rank={high:0,normal:1,low:2};return L.slice().sort((a,b)=>(ST.view==="deferred"?a.defer-b.defer:rank[a.prio]-rank[b.prio]||b.ts-a.ts))}
const sel=(id,label,opts,cur)=>`<label class="r16n-f"><span>${label}</span><select data-r16n-f="${id}" aria-label="${label}">${opts.map(o=>`<option value="${o[0]}" ${o[0]===cur?"selected":""}>${E(o[1])}</option>`).join("")}</select></label>`;
function defForm(forIds){const id=forIds.join("|");return `<div class="r16n-pop" role="group" aria-label="Defer until"><b>Defer until</b><div class="r16n-pr"><button type="button" class="btn" data-r16n-defgo="1h" data-ids="${E(id)}">In 1 hour</button><button type="button" class="btn" data-r16n-defgo="tomorrow" data-ids="${E(id)}">Tomorrow 9:00</button><button type="button" class="btn" data-r16n-defgo="week" data-ids="${E(id)}">Next week</button></div><form class="r16n-pick" data-r16n-pickform data-ids="${E(id)}"><label><span class="small muted">Pick a date and time</span><input type="datetime-local" required aria-label="Pick a date and time"></label><button class="btn primary" type="submit">Defer</button></form><button type="button" class="btn quiet" data-r16n-canc>Cancel</button></div>`}
function escForm(forIds){const first=byIds(forIds)[0];if(!first)return"";const o=owners(first);const id=forIds.join("|");
 return `<form class="r16n-pop" data-r16n-escform data-ids="${E(id)}" aria-label="Escalate"><b>Escalate ${forIds.length>1?forIds.length+" notifications":"this notification"}</b><label class="r16n-rad"><input type="radio" name="r16nTo" value="group" checked> <span>Owner group: <b>${E(o.group)}</b> <small class="muted">manager ${E(o.manager)}</small></span></label><label class="r16n-rad"><input type="radio" name="r16nTo" value="appr"> <span>Approver group: <b>${E(o.approver)}</b></span></label><label><span class="small muted">Reason (required, the group sees it)</span><textarea rows="2" required minlength="4" data-r16n-reason placeholder="Why this cannot wait"></textarea></label><div class="row" style="gap:8px"><button class="btn primary" type="submit">Escalate</button><button type="button" class="btn quiet" data-r16n-canc>Cancel</button></div></form>`}
function rowHTML(n){const o=ST.sel[n.id];const dF=ST.def===n.id,eF=ST.esc===n.id;
 return `<div class="r16n-row${n.read?"":" unread"} prio-${n.prio}" data-r16n-row="${E(n.id)}" role="listitem"><label class="r16n-ck"><input type="checkbox" data-r16n-sel="${E(n.id)}" ${o?"checked":""} aria-label="Select: ${E(n.title)}"><i></i></label>
  <span class="r16n-ic ${n.type}">${svg(ICON[n.type],15)}</span>
  <div class="r16n-b"><button type="button" class="r16n-t" data-r16n-open="${E(n.id)}" title="Open the source">${n.read?"":'<i class="r16n-dot" aria-label="Unread"></i>'}${E(n.title)}</button>
  <small class="muted">${E(n.sub)} · ${E(n.group)} · ${n.defer&&n.defer>NOW()?"back "+whenTxt(n.defer):ago(n.ts)}${n.resurfaced?" · came back":""}</small>
  <span class="r16n-tags"><span class="pill ${n.prio==="high"?"bad":n.prio==="normal"?"info":"mute"}">${n.prio==="high"?"High":n.prio==="normal"?"Normal":"Low"}</span>${n.esc?`<span class="pill warn" title="${E(n.esc.reason)}">Escalated to ${E(n.esc.to)}</span>`:""}</span></div>
  <div class="r16n-act">${ST.view==="cleared"?`<button type="button" class="btn quiet" data-r16n-restore="${E(n.id)}">Restore</button>`:`<button type="button" class="btn quiet" data-r16n-read="${E(n.id)}" aria-label="${n.read?"Mark unread":"Mark read"}: ${E(n.title)}" title="${n.read?"Mark unread":"Mark read"}">${n.read?"Unread":"Read"}</button><button type="button" class="btn quiet" data-r16n-def="${E(n.id)}" aria-expanded="${dF}" title="Defer">Defer</button><button type="button" class="btn quiet" data-r16n-esc="${E(n.id)}" aria-expanded="${eF}" title="Escalate">Escalate</button><button type="button" class="btn quiet" data-r16n-clr="${E(n.id)}" aria-label="Clear: ${E(n.title)}" title="Clear">Clear</button>`}</div>
  ${dF?defForm([n.id]):""}${eF?escForm([n.id]):""}</div>`}
function listHTML(L){if(!L.length)return `<div class="r16n-empty"><b>${ST.view==="deferred"?"Nothing is deferred":ST.view==="cleared"?"Nothing cleared":"All clear"}</b><span class="muted small">${ST.view==="active"?(deferred().length?deferred().length+" deferred will come back.":"New alerts, decisions and mentions land here."):""}</span></div>`;
 if(ST.grp==="none")return L.map(rowHTML).join("");
 const keyOf=n=>ST.grp==="type"?(TYPES.find(t=>t[0]===n.type)||[0,n.type])[1]:ST.grp==="prio"?(PR.find(p=>p[0]===n.prio)||[0,n.prio])[1]:(G(()=>NAVX.label(n.src),n.src)||n.src);
 const m=new Map();L.forEach(n=>{const k=keyOf(n);(m.get(k)||m.set(k,[]).get(k)).push(n)});
 return [...m].map(([k,rows])=>`<div class="r16n-gh" role="heading" aria-level="4"><span>${E(k)}</span><small>${rows.length}</small></div>${rows.map(rowHTML).join("")}`).join("")}
function centerHTML(){const L=visible();const sIds=Object.keys(ST.sel).filter(k=>ST.sel[k]&&ST.items.some(n=>n.id===k));const all=L.length&&L.every(n=>ST.sel[n.id]);
 return `<div class="r16n" data-r16n-root>
 ${ST.undo?`<div class="r16n-undo" role="status"><span>${E(ST.undo.label)}.</span><button type="button" class="btn" data-r16n-undo>Undo</button></div>`:""}
 <div class="r16n-bar"><label class="r16n-ck" title="Select all shown"><input type="checkbox" data-r16n-all ${all?"checked":""} aria-label="Select all shown"><i></i></label>
  <span class="r16n-cnt"><b>${L.length}</b> ${ST.view==="deferred"?"deferred":ST.view==="cleared"?"cleared":"shown"} <span class="muted small">${unread()} unread</span></span>
  <span class="r16n-spacer"></span>${ST.view==="active"?`<button type="button" class="btn quiet" data-r16n-readall ${L.some(n=>!n.read)?"":"disabled"}>Mark all read</button><button type="button" class="btn" data-r16n-clearall ${L.length?"":"disabled"}>Clear all${ST.type!=="all"||ST.prio!=="all"?" shown":""}</button>`:ST.view==="cleared"?`<button type="button" class="btn" data-r16n-restoreall ${L.length?"":"disabled"}>Restore all</button>`:""}</div>
 <div class="r16n-filters" role="group" aria-label="Filter notifications">${sel("view","Show",[["active","Active ("+live().length+")"],["deferred","Deferred ("+deferred().length+")"],["cleared","Cleared ("+cleared().length+")"]],ST.view)}${sel("type","Type",[["all","All types"]].concat(TYPES),ST.type)}${sel("prio","Priority",[["all","Any priority"]].concat(PR),ST.prio)}${sel("grp","Group by",[["none","No grouping"],["type","Type"],["prio","Priority"],["src","Source screen"]],ST.grp)}</div>
 ${sIds.length?`<div class="r16n-selbar" role="region" aria-label="Bulk actions"><b>${sIds.length} selected</b><button type="button" class="btn quiet" data-r16n-bulk="read">Mark read</button><button type="button" class="btn quiet" data-r16n-bulk="def">Defer</button><button type="button" class="btn quiet" data-r16n-bulk="esc">Escalate</button><button type="button" class="btn quiet" data-r16n-bulk="clr">Clear</button><button type="button" class="btn quiet" data-r16n-bulk="none">Deselect</button></div>${ST.def==="bulk"?defForm(sIds):""}${ST.esc==="bulk"?escForm(sIds):""}`:""}
 <div class="r16n-list" role="list" aria-label="Notifications">${listHTML(L)}</div></div>`}
function paint(){const p=q1("#inbxPanel");if(!p||!ST.open)return;const pb=q1(".inbx-pb",p);if(!pb)return;const top=pb.scrollTop;const ae=D.activeElement;const fk=ae&&pb.contains(ae)?[...ae.attributes].filter(a=>/^data-r16n-/.test(a.name)).map(a=>"["+a.name+(a.value?'="'+a.value.replace(/"/g,"")+'"':"")+"]").join(""):"";busy=1;pb.innerHTML=centerHTML();pb.scrollTop=top;if(fk){const nf=q1(fk,pb);if(nf)try{nf.focus({preventScroll:true})}catch(x){}}try{mo.takeRecords()}catch(e){}busy=0}
let busy=0;
function decorate(){const p=q1("#inbxPanel");if(!p||busy)return;init();const tabs=q1(".inbx-tabs",p);if(!tabs)return;busy=1;
 try{if(!q1("[data-r16n-tab]",tabs)){tabs.insertAdjacentHTML("afterbegin",`<button role="tab" class="inbx-tab" data-r16n-tab aria-selected="${ST.open}" tabindex="${ST.open?0:-1}">Notifications<b>${unread()}</b></button>`)}
  if(ST.open){qa("[data-inbx-tab]",tabs).forEach(b=>{b.setAttribute("aria-selected","false")});const t=q1("[data-r16n-tab]",tabs);t.setAttribute("aria-selected","true");t.tabIndex=0;
   const pr=q1(".inbx-prog",p);if(pr)pr.hidden=true;const pb=q1(".inbx-pb",p);if(pb&&!q1("[data-r16n-root]",pb))pb.innerHTML=centerHTML()}}
 finally{try{mo.takeRecords()}catch(e){}busy=0}}
const mo=new MutationObserver(()=>{if(!busy){clearTimeout(mo._t);mo._t=setTimeout(decorate,0)}});
function watch(){const p=q1("#inbxPanel");if(p&&!p._r16n){p._r16n=1;mo.observe(p,{childList:true})}}
function after(why){const t=q1("[data-r16n-tab] b");if(t)t.textContent=unread();paint()}
const openSrc=id=>{const n=byIds([id])[0];if(!n)return;markRead([id],true);if(known(n.src)){try{q1("#inbxPanel").hidePopover()}catch(e){}go(n.src)}};

/* ---------- events ---------- */
D.addEventListener("click",e=>{const T=e.target;if(!T.closest)return;let b;
 if(T.closest("[data-r16n-tab]")){e.preventDefault();e.stopPropagation();init();ST.open=true;const p=q1("#inbxPanel");const pb=q1(".inbx-pb",p);qa("[data-inbx-tab]",p).forEach(x=>x.setAttribute("aria-selected","false"));const t=q1("[data-r16n-tab]",p);t.setAttribute("aria-selected","true");const pr=q1(".inbx-prog",p);if(pr)pr.hidden=true;if(pb)pb.innerHTML=centerHTML();return}
 if(ST.open&&T.closest("#inbxPanel [data-inbx-tab]")){ST.open=false;return}
 if(!T.closest("#inbxPanel"))return;
 if(b=T.closest("[data-r16n-open]")){openSrc(b.dataset.r16nOpen);return}
 if(b=T.closest("[data-r16n-read]")){const n=byIds([b.dataset.r16nRead])[0];markRead([n.id],!n.read);return}
 if(b=T.closest("[data-r16n-clr]")){clearIds([b.dataset.r16nClr]);return}
 if(b=T.closest("[data-r16n-restore]")){restore([b.dataset.r16nRestore]);return}
 if(T.closest("[data-r16n-restoreall]")){restore(visible().map(n=>n.id));return}
 if(T.closest("[data-r16n-readall]")){markRead(visible().map(n=>n.id),true);return}
 if(T.closest("[data-r16n-clearall]")){clearIds(visible().map(n=>n.id));return}
 if(T.closest("[data-r16n-undo]")){undoClear();return}
 if(b=T.closest("[data-r16n-def]")){ST.def=ST.def===b.dataset.r16nDef?null:b.dataset.r16nDef;ST.esc=null;paint();const f=q1("[data-r16n-defgo]");if(f)f.focus();return}
 if(b=T.closest("[data-r16n-esc]")){ST.esc=ST.esc===b.dataset.r16nEsc?null:b.dataset.r16nEsc;ST.def=null;paint();const f=q1("[data-r16n-reason]");if(f)f.focus();return}
 if(T.closest("[data-r16n-canc]")){ST.def=ST.esc=null;paint();return}
 if(b=T.closest("[data-r16n-defgo]")){deferIds(b.dataset.ids.split("|"),preset(b.dataset.r16nDefgo));return}
 if(b=T.closest("[data-r16n-bulk]")){const ids=Object.keys(ST.sel).filter(k=>ST.sel[k]);const k=b.dataset.r16nBulk;
  if(k==="read")markRead(ids,true);else if(k==="clr")clearIds(ids);else if(k==="none"){ST.sel={};ST.def=ST.esc=null;paint()}else if(k==="def"){ST.def=ST.def==="bulk"?null:"bulk";ST.esc=null;paint()}else if(k==="esc"){ST.esc=ST.esc==="bulk"?null:"bulk";ST.def=null;paint();const f=q1("[data-r16n-reason]");if(f)f.focus()}return}},true);
D.addEventListener("change",e=>{const t=e.target;if(!t.matches||!t.closest("#inbxPanel"))return;
 if(t.matches("[data-r16n-sel]")){ST.sel[t.dataset.r16nSel]=t.checked;paint();return}
 if(t.matches("[data-r16n-all]")){visible().forEach(n=>ST.sel[n.id]=t.checked);paint();return}
 if(t.matches("[data-r16n-f]")){ST[t.dataset.r16nF]=t.value;ST.sel={};paint()}});
D.addEventListener("submit",e=>{const f=e.target;if(!f.matches)return;
 if(f.matches("[data-r16n-pickform]")){e.preventDefault();const v=f.querySelector("input").value;const ts=v?new Date(v).getTime():0;if(!ts||ts<=NOW()){G(()=>toast("Pick a time in the future","warn"));return}deferIds(f.dataset.ids.split("|"),ts);return}
 if(f.matches("[data-r16n-escform]")){e.preventDefault();const k=(f.querySelector('input[name="r16nTo"]:checked')||{}).value==="appr"?"appr":"owner";if(!escalate(f.dataset.ids.split("|"),k,(f.querySelector("[data-r16n-reason]")||{}).value))G(()=>toast("Give a reason of a few words","warn"))}},true);
D.addEventListener("toggle",e=>{if(e.target&&e.target.id==="inbxPanel"){if(e.newState==="open"){watch();setTimeout(decorate,30)}else{ST.def=ST.esc=null}}},true);
/* arrow keys across the tab strip: the inbox handler only knows its own tabs, so decide here before it runs */
W.addEventListener("keydown",e=>{if((e.key!=="ArrowRight"&&e.key!=="ArrowLeft")||!e.target.closest||!e.target.closest("#inbxPanel [role=tab]"))return;const tabs=qa("#inbxPanel [role=tab]");const i=tabs.indexOf(e.target.closest("[role=tab]"));if(i<0)return;const n=tabs[(i+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length];
 if(n.hasAttribute("data-r16n-tab")){e.preventDefault();e.stopImmediatePropagation();n.click();n.focus()}else if(ST.open&&e.target.closest("[data-r16n-tab]")){ST.open=false}},true);
/* events from the bus become notifications (bounded; no per-event heavy work) */
function listen(){if(!W.EVENTS||listen.done)return;listen.done=1;EVENTS.on("*",(evn)=>{try{if(/^notification\./.test(evn.id)||!evn.id)return;const d=EVENTS.catalog.get(evn.id)||{};if(!d.notification&&!/escalat|breach|failed|override|rejected/.test(evn.id))return;init();
  ST.items.unshift({id:"N"+(5000+ST.items.length),type:/approval|decision/.test(evn.id)?"decision":"alert",prio:/urgent|high/i.test(d.severity||"")||/breach|failed/.test(evn.id)?"high":"normal",title:String(d.label||evn.id).slice(0,90),sub:"Event "+evn.id,src:"zevt",group:"Platform team",ts:NOW(),read:false,cleared:false,defer:0,esc:null});if(ST.items.length>200)ST.items.length=200;save();if(ST.open)paint()}catch(x){}})}
setInterval(()=>{try{if(ST.inited)tick();listen();watch()}catch(e){}},15000);
setTimeout(()=>{try{listen();watch();init()}catch(e){}},1500);
})();
/* metrics for the notification center (formula, owner, target, remediation) */
(function(){if(typeof METRICS==="undefined")return;
 const mk=(n,f,u,cur,tgt,badAt,dir,tr,rem)=>({n,f,u,cur,tgt,badAt,dir,max:100,tr,owner:"Tom Becker",use:["Notifications (bell panel)"],rem:{kind:"sop",ref:"SOP-NTF-1",title:rem,agent:"Triage Agent",auto:false,state:"idle",prog:"Lists what to clear, defer or escalate"}});
 Object.assign(METRICS,{
  m_r16_ntf_stale:mk("Notifications unread after one day","Notifications unread for more than 24 hours ÷ notifications received in the period × 100","%",18,10,35,"max",[26,24,23,21,22,20,19,18],"Clear, defer or escalate what has sat unread for a day"),
  m_r16_ntf_esc:mk("Escalations acknowledged within four hours","Σ escalations acknowledged by the receiving group within 4 hours ÷ escalations sent × 100","%",88,90,70,"min",[80,82,85,84,86,87,88,88],"Re-escalate to the approver group and page the group manager")})})();
