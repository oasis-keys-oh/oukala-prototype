/* ===== mod_s_owner: one owner chip and one address directory (CL-53 chip behavior, CL-54 directories; rules R12, R13, R13a).
   window.OWNERX = {resolve(addr), addrFor(name,o), kindOf(name), teams(), functions(), open(chipEl), close()}
   window.ownerChip(name,{record,role,size,kind,sponsor}) keeps the platform.js signature and data attributes
   (data-owner, data-owner-rec, data-owner-role) and adds data-owner-kind and data-owner-addr.
   ownerChip.pair(owner,backup,{record}) renders both and a "No backup" badge when the backup is missing or the same person.
   Click on any [data-owner]:
     person          small popover anchored to the chip: Person 360, Message, Open chat on this record (when data-owner-rec is set)
     team, group,    their page in the drawer (members, lead, source registry) with Message group
     function
     agent, robot    their card in the popover with the human sponsor and backup, Message, Open profile (agents)
   Directories reuse what exists: people from DIR, teams from TEAMS (kit2), approval groups from APG (mod_r16h_c_groups), agents from
   R17T and AGENTS_STATE. Functions use R18.FUNCTIONS names; their leads and team lists are a small prototype registry here.
   Messages are simulated: they open a thread in the one platform chat (CHATX.openAddress) and nobody is notified. ===== */
(function(){
"use strict";
const W=window;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const slug=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const low=s=>String(s||"").trim().toLowerCase();
const O=W.OWNERX=W.OWNERX||{};

/* ---------- directories ---------- */
/* function registry (prototype): names from R18.FUNCTIONS when loaded; lead and teams are sample data */
const FUNC_SEED=[["Standards","Elena Marsh",["Editors","Editorial"]],["Finance","Avery Chen",["Finance"]],["Delivery","Priya Shah",["PMO","Platform team","Data team"]],
 ["Membership","Maya Ortiz",["PMO"]],["Technology","Jordan Lee",["Architecture","Ops team","Platform team"]],["IT service","Tom Becker",["Service desk","Change management"]],
 ["Security","Rina Okafor",["Security"]],["Facilities","Ruben Castillo",["People operations"]],["People","Joanna Pierce",["People operations"]]];
O.functions=function(){const names=G(()=>W.R18&&R18.FUNCTIONS&&R18.FUNCTIONS.length?R18.FUNCTIONS:null,null)||FUNC_SEED.map(f=>f[0]);
 return names.map(n=>{const s=FUNC_SEED.find(f=>f[0]===n)||[n,"",[]];return{id:slug(n),name:n,lead:s[1],teams:s[2].slice()}})};
const dir=()=>G(()=>W.DIR,[])||[];
const membersOfTeam=n=>dir().filter(d=>d.team===n).map(d=>d.name);
O.teams=function(){const t=(G(()=>W.TEAMS,[])||[]).map(x=>({id:x.id,name:x.n,lead:x.mgr,members:membersOfTeam(x.n),source:"Org chart",go:"org_chart",kind:"team"}));
 const g=(G(()=>W.APG&&APG.groups(),[])||[]).map(x=>({id:x.id,name:x.name,lead:x.owner,backup:x.backup,members:(x.members||[]).slice(),desc:x.desc||"",source:"Approval groups",go:"r16h_groups",kind:"group"}));
 return t.concat(g)};
function findTeam(q){const k=low(q);if(!k)return null;return O.teams().find(t=>low(t.id)===k||low(t.name)===k)||null}
function findFunc(q){const k=low(q);if(!k)return null;return O.functions().find(f=>f.id===k||low(f.name)===k)||null}
const isAgentName=n=>!!G(()=>W.R17T&&R17T.isAgent(n),false);
const agentName=n=>G(()=>R17T.canon(n),null)||n;
const agentModel=n=>G(()=>R17T.model(agentName(n)),null);

O.kindOf=function(name,o){o=o||{};if(o.kind)return o.kind;if(isAgentName(name))return"agent";if(G(()=>who(name),null))return"person";
 if(findTeam(name))return"team";if(findFunc(name))return"function";return"person"};
O.addrFor=function(name,o){const k=O.kindOf(name,o);
 if(k==="team"){const t=findTeam(name);return"team:"+(t?t.id:slug(name))}
 if(k==="function"){const f=findFunc(name);return"function:"+(f?f.id:slug(name))}
 if(k==="agent"||k==="robot")return"agent:"+agentName(name);
 return"person:"+String(name)};

/* resolve(addr) -> {type,id,label,sub,members,lead,backup,sponsor,source,go} for every CHATADDR type */
O.resolve=function(addr){const p=G(()=>CHATADDR.parse(addr),null);if(!p)return null;
 if(p.type==="person"){const r=G(()=>who(p.id),null);return{type:"person",id:p.id,label:r?r.name:p.id,sub:r?[r.role,r.team].filter(Boolean).join(" · "):"",members:[r?r.name:p.id]}}
 if(p.type==="team"){const t=findTeam(p.id);return t?{type:"team",id:t.id,label:t.name,sub:(t.kind==="group"?"Approval group":"Team")+" · "+t.members.length+" members",members:t.members,lead:t.lead,backup:t.backup||"",source:t.source,go:t.go,kind:t.kind,desc:t.desc||""}:{type:"team",id:p.id,label:p.id,members:[]}}
 if(p.type==="function"){const f=findFunc(p.id);if(!f)return{type:"function",id:p.id,label:p.id,members:[]};
  const m=[f.lead].concat(dir().filter(d=>f.teams.indexOf(d.team)>=0).map(d=>d.name)).filter((x,i,a)=>x&&a.indexOf(x)===i);
  return{type:"function",id:f.id,label:f.name+" function",sub:"Function · "+m.length+" people",members:m,lead:f.lead,teams:f.teams,source:"Function directory (prototype registry)",go:"org_chart"}}
 if(p.type==="record")return{type:"record",id:p.id,recType:p.recType,label:p.recType.replace(/_/g," ")+" "+p.id,members:[]};
 if(p.type==="process"){const pr=G(()=>PROCLIB.get(p.id),null);return{type:"process",id:p.id,label:pr&&pr.name?"Process "+pr.name:"Process "+p.id,lead:pr?pr.owner:"",backup:pr?pr.backup:"",members:[]}}
 if(p.type==="agent"){const m=agentModel(p.id);return{type:"agent",id:p.id,label:m?m.d.full||m.name:p.id,sponsor:m?m.sponsor:"",backup:m?m.backup:"",members:[]}}
 return null};

/* ---------- the chip ---------- */
const GRP_ICO=`<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 15c3 0 6 1.5 6 5"/></svg>`;
const BOT_ICO=`<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01"/></svg>`;
function attrs(name,o,kind,addr){return ` data-owner="${H(name)}" data-owner-kind="${H(kind)}" data-owner-addr="${H(addr)}"`+(o.record?` data-owner-rec="${H(o.record)}"`:"")+(o.role?` data-owner-role="${H(o.role)}"`:"")+(o.sponsor?` data-owner-sponsor="${H(o.sponsor)}"`:"")}
function ownerChip(name,o){o=o||{};if(name==null||name==="")return`<span class="muted small">none</span>`;name=String(name);
 const kind=O.kindOf(name,o),addr=O.addrFor(name,o);
 if(kind==="team"||kind==="function"){const r=O.resolve(addr)||{label:name};
  return`<button type="button" class="pchipx own-grp"${attrs(r.label,o,kind,addr)} aria-haspopup="dialog"><span class="own-gi">${GRP_ICO}</span><span>${H(r.label)}${o.showRole&&r.sub?` <small>${H(r.sub)}</small>`:""}</span></button>`}
 if(kind==="robot")return`<button type="button" class="pchipx own-grp own-bot"${attrs(name,o,kind,addr)} aria-haspopup="dialog"><span class="own-gi">${BOT_ICO}</span><span>${H(name)}</span><i class="r17t-tag">Robot</i></button>`;
 const base=G(()=>W.pchip(name,{size:o.size,role:o.showRole}),null);
 if(!base||!/^<button /.test(base))return`<button type="button" class="pchipx"${attrs(name,o,kind,addr)} aria-haspopup="dialog"><span>${H(name)}</span></button>`;
 return base.replace(/^<button /,"<button"+attrs(name,o,kind,addr)+' aria-haspopup="dialog" ')}
ownerChip.noBackup=function(owner,backup){return !backup||low(backup)===low(owner)};
ownerChip.badge=function(owner,backup){return`<span class="pill warn own-nob" title="${!backup?"No backup is named":"The backup is the same person as the owner"}">No backup</span>`};
ownerChip.pair=function(owner,backup,o){o=o||{};const nb=ownerChip.noBackup(owner,backup);
 return`<span class="own-pair">${ownerChip(owner,Object.assign({},o,{role:o.ownerRole||"Owner"}))}${backup?ownerChip(backup,Object.assign({},o,{role:o.backupRole||"Backup"})):""}${nb?ownerChip.badge(owner,backup):""}</span>`};
W.ownerChip=ownerChip;

/* ---------- the popover (person, agent, robot) ---------- */
let POP=null,ANCHOR=null;
function closePop(focus){if(!POP)return;G(()=>POP.hidePopover());G(()=>POP.remove());POP=null;if(focus&&ANCHOR&&ANCHOR.isConnected)G(()=>ANCHOR.focus({preventScroll:true}));ANCHOR=null}
O.close=()=>closePop(false);
function place(pop,chip){const r=chip.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight,g=8;
 const w=Math.min(300,vw-2*g);pop.style.width=w+"px";const h=pop.offsetHeight||180;
 let x=Math.max(g,Math.min(r.left,vw-w-g)),y=r.bottom+6;if(y+h>vh-g&&r.top-h-6>=g)y=r.top-h-6;y=Math.max(g,Math.min(y,vh-h-g));
 pop.style.left=Math.round(x)+"px";pop.style.top=Math.round(y)+"px"}
const btn=(act,label,primary)=>`<button type="button" class="btn${primary?" primary":""}" data-own-act="${act}">${H(label)}</button>`;
function head(avatarHtml,title,sub){return`<div class="own-hd">${avatarHtml}<div class="own-ht"><b>${H(title)}</b>${sub?`<small>${H(sub)}</small>`:""}</div><button type="button" class="btn quiet own-x" data-own-act="close" aria-label="Close">×</button></div>`}
function popHTML(d){const rec=d.rec?`<div class="own-rec muted small">${d.role?H(d.role)+" on ":"On "}${H(d.rec.replace(":"," "))}</div>`:(d.role?`<div class="own-rec muted small">${H(d.role)}</div>`:"");
 if(d.kind==="agent"||d.kind==="robot"){const m=d.kind==="agent"?agentModel(d.name):null;const sponsor=m?m.sponsor:d.sponsor||"";const backup=m?m.backup:"";
  const tier=m?G(()=>R17T.TIERN[m.tier],""):"";const label=m?(m.d.full||m.name):d.name;
  return head(d.kind==="agent"?G(()=>W.avatar(agentName(d.name),{size:34}),""):`<span class="own-gi own-gi-l">${BOT_ICO}</span>`,label,d.kind==="agent"?"AI teammate"+(tier?" · "+tier:""):"Robot step · runs rules, no judgment")+rec+
   `<dl class="own-kv"><dt>Human sponsor</dt><dd>${sponsor?ownerChip(sponsor,{role:"Sponsor"}):'<span class="pill warn">No sponsor</span>'}</dd>${d.kind==="agent"?`<dt>Backup</dt><dd>${backup&&!ownerChip.noBackup(sponsor,backup)?ownerChip(backup,{role:"Backup"}):ownerChip.badge(sponsor,backup)}</dd>`:""}</dl>
   <div class="own-acts">${d.kind==="agent"&&G(()=>!!R17T.openProfile,false)?btn("profile","Open profile",true):""}${btn("msg",d.kind==="agent"?"Message":"Message sponsor")}${d.rec?btn("rec","Open chat on this record"):""}</div>
   <p class="own-note muted small">Messages are simulated: nobody is notified.</p>`}
 const r=G(()=>who(d.name),null);
 return head(G(()=>W.avatar(d.name,{size:34}),""),r?r.name:d.name,r?[r.role,r.team].filter(Boolean).join(" · "):"")+rec+
  `<div class="own-acts">${btn("p360","Person 360",true)}${btn("msg","Message")}${d.rec?btn("rec","Open chat on this record"):""}</div><p class="own-note muted small">Messages are simulated: nobody is notified.</p>`}
function dataOf(chip){const ds=chip.dataset;return{name:ds.owner,kind:ds.ownerKind||O.kindOf(ds.owner),addr:ds.ownerAddr||O.addrFor(ds.owner),rec:ds.ownerRec||"",role:ds.ownerRole||"",sponsor:ds.ownerSponsor||""}}
O.open=function(chip){const d=dataOf(chip);
 if(d.kind==="team"||d.kind==="function"){closePop(false);return openGroupPage(d.addr,d.rec)}
 closePop(false);const pop=document.createElement("div");pop.className="own-pop";pop.setAttribute("popover","manual");pop.setAttribute("role","dialog");pop.setAttribute("aria-label",d.name);
 pop.innerHTML=popHTML(d);pop._d=d;const host=chip.closest("[popover]")||document.body;host.appendChild(pop);POP=pop;ANCHOR=chip;
 G(()=>pop.showPopover());place(pop,chip);const f=pop.querySelector("[data-own-act]:not(.own-x)");if(f)G(()=>f.focus({preventScroll:true}));
 G(()=>audit("opened owner card",d.name));return pop};

/* ---------- team, group and function page ---------- */
function openGroupPage(addr,rec){const r=O.resolve(addr);if(!r){G(()=>toast("No directory entry for "+addr,"warn"));return null}
 const members=(r.members||[]).slice(0,40);
 const html=`<div class="own-page" data-own-page="${H(addr)}"><div class="eyebrow">${H(r.type==="function"?"Function":r.kind==="group"?"Approval group":"Team")}</div><h2>${H(r.label)}</h2>
  ${r.desc?`<p class="muted">${H(r.desc)}</p>`:""}
  <dl class="kv">${r.lead?`<dt>${r.kind==="group"?"Owner":"Lead"}</dt><dd>${r.kind==="group"?ownerChip.pair(r.lead,r.backup,{record:rec||undefined}):ownerChip(r.lead,{role:"Lead",record:rec||undefined})}</dd>`:""}${r.teams?`<dt>Teams</dt><dd>${r.teams.map(t=>ownerChip(t)).join(" ")}</dd>`:""}<dt>Source</dt><dd>${H(r.source||"Directory")}</dd></dl>
  <div class="row own-pacts"><button type="button" class="btn primary" data-own-msg="${H(addr)}"${rec?` data-own-msg-rec="${H(rec)}"`:""}>Message group</button>${rec?`<button type="button" class="btn" data-own-msg="record:${H(rec)}">Open chat on this record</button>`:""}${r.go?`<button type="button" class="btn quiet" data-own-go="${H(r.go)}">Open ${H(r.source&&/Approval/.test(r.source)?"Approval groups":"Org chart")}</button>`:""}</div>
  <h3 class="own-mh">Members <small class="muted">${members.length}</small></h3><div class="own-mem">${members.map(n=>ownerChip(n,{record:rec||undefined})).join("")||'<span class="muted">No members recorded.</span>'}</div>
  <p class="muted small">Group messages are simulated: one thread in the platform chat, nobody is notified.</p></div>`;
 G(()=>openDrawer(html));G(()=>audit("opened group page",r.label));return r}
O.openGroupPage=openGroupPage;

/* ---------- actions ---------- */
function message(addr,rec){closePop(false);const o=rec?{record:rec}:{};return G(()=>CHATADDR.open(addr,o),null)}
O.message=message;
function act(a,d){if(a==="close"){closePop(true);return}
 if(a==="p360"){closePop(false);G(()=>person360(d.name));return}
 if(a==="profile"){closePop(false);G(()=>R17T.openProfile(agentName(d.name)));return}
 if(a==="msg"){if(d.kind==="robot"){const m=d.sponsor;if(m)message("person:"+m,d.rec);else{closePop(false);G(()=>toast("This robot step has no sponsor to message","warn"))}return}message(d.addr,d.rec);return}
 if(a==="rec"){message("record:"+d.rec);return}}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
 const a=t.closest("[data-own-act]");if(a&&POP&&POP.contains(a)){e.preventDefault();e.stopPropagation();act(a.dataset.ownAct,POP._d);return}
 const m=t.closest("[data-own-msg]");if(m){e.preventDefault();G(()=>closeDrawer());message(m.dataset.ownMsg,m.dataset.ownMsgRec||"");return}
 const g=t.closest("[data-own-go]");if(g){e.preventDefault();G(()=>closeDrawer());G(()=>go(g.dataset.ownGo));return}
 const c=t.closest("[data-owner]");if(!c)return;e.preventDefault();e.stopPropagation();
 if(POP&&ANCHOR===c){closePop(true);return}O.open(c)});
document.addEventListener("pointerdown",e=>{if(!POP)return;const t=e.target;if(POP.contains(t)||(ANCHOR&&ANCHOR.contains(t)))return;closePop(false)},true);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&POP){e.stopPropagation();closePop(true)}},true);
window.addEventListener("resize",()=>closePop(false));
document.addEventListener("scroll",e=>{if(POP&&!POP.contains(e.target))closePop(false)},true);
})();
