/* mod_r15f2_a_shell.js (Round 15, Agent F2). Shared record shell: window.RECSHELL.mount(host,{entity,id}).
   One component for every record drawer or page: header (id, status, owner and backup, follow, tags), tabs (Details, Activity,
   Comments, Attachments (metadata only), Related, Audit), @mentions, watchers, linked records through ZLINK, change history and
   inline editing that writes through window.STORE when present (in-memory fallback). Adapters (per entity) are registered by
   RECSHELL.adapter(entity, def); mod_r15f2_c_adopt.js registers the platform entities and adopts existing drawers. */
(function(){
"use strict";
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const H=s=>esc(s==null?"":String(s));
const TODAY="2026-10-10";
const arr=x=>Array.isArray(x)?x:[];
const ME=()=>{const m=G(()=>typeof INBOX.me==="function"?INBOX.me():INBOX.me,"");return typeof m==="string"&&m?m:"Casey Rowan"};
const R=window.RECSHELL=window.RECSHELL||{};
const AD=R.adapters={};
const MEM={};
S.rsh=S.rsh||{tab:{},ed:null,lq:{},mq:"",adopted:0,opened:0,log:[]};
const RS=S.rsh;
const STORE=()=>window.STORE&&typeof window.STORE.put==="function"?window.STORE:null;
const key=(e,id)=>e+":"+id;
const humans=()=>arr(G(()=>DIR,[])).filter(d=>d.kind==="human").map(d=>d.name);
const nowLabel=()=>"Oct 10, "+new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});

/* ---------- events (lazy; the bus is owned by another module) ---------- */
const EV_DONE={};
function emit(id,label,payload){
 try{if(!window.EVENTS)return;
  if(!EV_DONE[id]){EV_DONE[id]=1;EVENTS.register({id,label,module:"rec_shell",fields:[{name:"record",type:"string"},{name:"entity",type:"string"},{name:"actor",type:"string"},{name:"detail",type:"string"}],owner:"Sam Patel"})}
  EVENTS.emit(id,payload,{source:"rec_shell",actor:ME()})}catch(e){}}

/* ---------- adapters ---------- */
R.adapter=function(entity,def){def=def||{};def.entity=entity;def.label=def.label||entity;AD[entity]=def;return def};
R.has=entity=>!!AD[entity];
R.entities=()=>Object.keys(AD);
function rec(entity,id){const a=AD[entity];if(!a)return null;const r=G(()=>a.get(String(id)),null);return r?Object.assign({id:String(id)},r):null}
R.resolve=function(id){id=String(id);for(const e of Object.keys(AD)){const a=AD[e];if(((a.rx&&new RegExp("^(?:"+a.rx+")$").test(id))||(a.owns&&G(()=>a.owns(id),false)))&&rec(e,id))return e}return null};
R.get=rec;

/* ---------- per-record state: comments, tags, watchers, attachments, history, edits ---------- */
const SEED_C={ // a few believable seeded conversations (keyed entity:id)
 "incident:INC0412":[["Tom Becker","Declared major. Web tier at 94% CPU; RB-031 step 4 is holding it.",-170],["Sam Patel","CHG0311 is scaling the tier now. @Tom Becker please post the next update to the Chief Editor's office.",-95]],
 "change:CHG0312":[["Jordan Lee","Architecture is fine with the larger tier if the autoscale rule ships in the same window.",-60],["Avery Chen","Cost is within the $48,000 reforecast. Need the PO line before approval. @Tom Becker",-30]],
 "vendor:LUM":[["Dev Rao","Milestone 2 was nine days late. Renewal of SOW-4 should wait for the Q4 assessment.",-120]],
 "contract:CT-107":[["Jordan Lee","Pen test retainer ends Nov 15. Renewal needs the third-party assessment first.",-40]],
 "project:PR1":[["Priya Shah","Beta moved to Nov 13 after the indexer slip. Updated the plan.",-200]]};
function seedFor(k,s){const c=SEED_C[k];if(!c)return;c.forEach((x,i)=>s.comments.push({id:"c"+(s.seq++),by:x[0],at:ago(x[2]),text:x[1],mentions:mentionsOf(x[1]),ts:Date.now()+x[2]*60000}))}
function ago(min){const m=Math.abs(min);return m<90?m+" min ago":m<2000?Math.round(m/60)+" h ago":Math.round(m/1440)+" days ago"}
function st(e,id){const k=key(e,id);let s=MEM[k];if(s)return s;
 s=MEM[k]={comments:[],tags:[],watchers:[],att:[],hist:[],edits:{},links:[],following:false,seq:1,seeded:false};
 seedFor(k,s);const r=rec(e,id);
 if(r){s.watchers=[r.owner,r.backup].filter(x=>x&&x!=="-"&&humans().includes(x)).filter((x,i,a)=>a.indexOf(x)===i);s.tags=arr(r.tags).slice(0,4)}
 hydrate(k,s);return s}
function hydrate(k,s){const S_=STORE();if(!S_||typeof S_.get!=="function")return;
 try{const r=S_.get("record_shell",k);const ap=v=>{if(!v)return;["comments","tags","watchers","att","hist","links"].forEach(f=>{if(Array.isArray(v[f])&&v[f].length)s[f]=v[f]});if(v.edits)s.edits=v.edits;if(v.seq)s.seq=Math.max(s.seq,v.seq);if(typeof v.following==="boolean")s.following=v.following};
  if(r&&typeof r.then==="function")r.then(v=>{ap(v);repaintAll()}).catch(()=>{});else ap(r)}catch(e){}}
function save(e,id){const s=st(e,id);const S_=STORE();if(!S_)return;try{S_.put("record_shell",Object.assign({id:key(e,id)},JSON.parse(JSON.stringify(s))))}catch(x){}}
function putAtom(entity,o){const S_=STORE();if(!S_)return;try{S_.put(entity,o)}catch(e){}}
R.state=st;R.all=()=>MEM;

/* ---------- mentions ---------- */
function mentionsOf(text){const out=[];const t=String(text||"");humans().slice().sort((a,b)=>b.length-a.length).forEach(n=>{if(t.indexOf("@"+n)>=0&&out.indexOf(n)<0)out.push(n)});return out}
function mentionHTML(text){let h=H(text);humans().slice().sort((a,b)=>b.length-a.length).forEach(n=>{const e=H("@"+n);h=h.split(e).join('<b class="rsh-mn">'+e+"</b>")});return h.replace(/\n/g,"<br>")}

/* ---------- owner and backup resolution: record, then ownership registry, then accountability domain ---------- */
function ownerBackup(a,r){
 let o=r.owner||"",b=r.backup||"",src="";
 const og=a.okind&&G(()=>OWNX.get(a.okind,r.id),null);
 if(og){if(!o&&og.ownerName)o=og.ownerName;if(!b&&og.backupName){b=og.backupName;src=og.bkInherited?"inherited":""}}
 if(a.dom&&(!o||!b)){const d=G(()=>ORGX.domainView(a.dom),null);if(d){if(!o&&d.owner)o=d.owner.name;if(!b&&d.backup&&d.backup.name!==o){b=d.backup.name;src="from "+d.label}}}
 return{o,b,src}}

/* ---------- audit trail slice ---------- */
function auditRows(id,title){const t=String(id).toLowerCase();return arr(G(()=>AUDIT,[])).filter(x=>(String(x.a)+" "+String(x.d)).toLowerCase().indexOf(t)>=0).slice(0,40)}

/* ---------- header ---------- */
const pplSel=(cur,attr)=>`<select class="rsh-in" ${attr} aria-label="Choose a person"><option value="">None</option>${humans().map(n=>`<option ${n===cur?"selected":""}>${H(n)}</option>`).join("")}</select>`;
function personCell(name,kind,k,ed,src){
 const editing=ed&&ed.k===k;
 if(editing)return `<span class="rsh-edit">${pplSel(name,"data-rsh-in")}<button class="btn primary sm" data-rsh-save>Save</button><button class="btn quiet sm" data-rsh-cancel>Cancel</button></span>`;
 const av=name?(typeof avatar==="function"?avatar(name,{size:22}):""):"";
 return `<span class="rsh-person">${name?`${av}<b>${H(name)}</b>${src?`<span class="muted small">${H(src)}</span>`:""}`:`<span class="pill ${kind==="backup"?"warn":"bad"}">${kind==="backup"?"No backup":"No owner"}</span>`}<button class="rsh-pen" data-rsh-edit="${k}" aria-label="Change ${kind}" title="Change ${kind}">${pen()}</button></span>`}
const pen=()=>`<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/></svg>`;
function headHTML(e,id,a,r){
 const s=st(e,id),ob=ownerBackup(a,r),ed=RS.ed&&RS.ed.key===key(e,id)?RS.ed:null;
 const owner=s.edits.owner!=null?s.edits.owner:ob.o,backup=s.edits.backup!=null?s.edits.backup:ob.b;
 const status=s.edits.status!=null?s.edits.status:r.status;
 const tone=r.tone||"info";
 const tags=s.tags.map(t=>`<span class="rsh-tag">${H(t)}<button data-rsh-untag="${H(t)}" aria-label="Remove tag ${H(t)}">&times;</button></span>`).join("");
 const w=s.watchers;
 const stEd=ed&&ed.k==="status";
 return `<header class="rsh-head">
 <div class="rsh-line"><span class="pill info rsh-id">${H(id)}</span>
 ${stEd?`<span class="rsh-edit"><select class="rsh-in" data-rsh-in>${arr(a.statuses).map(o=>`<option ${o===status?"selected":""}>${H(o)}</option>`).join("")}</select><button class="btn primary sm" data-rsh-save>Save</button><button class="btn quiet sm" data-rsh-cancel>Cancel</button></span>`:`<span class="pill ${tone}">${H(status||"No status")}</span>${arr(a.statuses).length?`<button class="rsh-pen" data-rsh-edit="status" aria-label="Change status" title="Change status">${pen()}</button>`:""}`}
 <span class="pill mute">${H(a.label)}</span>
 <span class="rsh-sp"></span>
 <button class="btn ${s.following?"quiet on":"quiet"} sm" data-rsh-follow aria-pressed="${s.following}">${s.following?"Following":"Follow"}</button>
 <span class="muted small" title="${H(w.join(", "))}">${w.length} watcher${w.length===1?"":"s"}</span></div>
 <h2 class="rsh-title" data-role="story">${H(r.title||id)}</h2>
 <div class="rsh-own"><span><em>Owner</em>${personCell(owner,"owner","owner",ed,ob.o&&owner===ob.o&&ob.src&&!r.owner?"":"")}</span><span><em>Backup</em>${personCell(backup,"backup","backup",ed,ob.b&&backup===ob.b?ob.src:"")}</span></div>
 <div class="rsh-tags">${tags}<form class="rsh-tagf" data-rsh-tagform><input class="rsh-in" name="t" placeholder="Add tag" aria-label="Add tag" maxlength="24" list="rsh_tags"><button class="btn quiet sm" type="submit">Add</button></form></div>
 </header>`}

/* ---------- tabs ---------- */
const TABS=[["details","Details"],["activity","Activity"],["comments","Comments"],["attachments","Attachments"],["related","Related"],["audit","Audit"]];
function counts(e,id,a,r){const s=st(e,id);return{comments:s.comments.length,attachments:s.att.length+arr(r.attach).length,related:relatedGroups(e,id,a,r).reduce((n,g)=>n+g.rows.length,0),audit:auditRows(id).length+s.hist.length}}
function tabsHTML(e,id,cur,c){return `<div class="rsh-tabs" role="tablist" aria-label="Record sections">${TABS.map(t=>`<button role="tab" class="rsh-tab${t[0]===cur?" on":""}" aria-selected="${t[0]===cur}" data-rsh-tab="${t[0]}">${t[1]}${c[t[0]]?` <span class="rsh-n">${c[t[0]]}</span>`:""}</button>`).join("")}</div>`}

function fieldHTML(e,id,f,s){
 const ed=RS.ed&&RS.ed.key===key(e,id)&&RS.ed.k===f.k;const ov=s.edits[f.k];const val=ov!=null?ov:f.v;
 if(ed){let inp;const ty=f.edit.type;
  if(ty==="person")inp=pplSel(val,"data-rsh-in");
  else if(ty==="select")inp=`<select class="rsh-in" data-rsh-in>${arr(f.edit.opts).map(o=>`<option ${o===val?"selected":""}>${H(o)}</option>`).join("")}</select>`;
  else inp=`<input class="rsh-in" data-rsh-in type="${ty==="date"?"date":ty==="number"?"number":"text"}" value="${H(val)}">`;
  return `<div class="rsh-f"><dt>${H(f.l)}</dt><dd><span class="rsh-edit">${inp}<button class="btn primary sm" data-rsh-save>Save</button><button class="btn quiet sm" data-rsh-cancel>Cancel</button></span></dd></div>`}
 const shown=f.html&&ov==null?f.v:H(val==null||val===""?"-":val);
 return `<div class="rsh-f"><dt>${H(f.l)}</dt><dd>${shown}${ov!=null?'<span class="pill mute" title="Changed here; see the Audit tab">edited</span>':""}${f.edit?`<button class="rsh-pen" data-rsh-edit="${H(f.k)}" aria-label="Edit ${H(f.l)}" title="Edit ${H(f.l)}">${pen()}</button>`:""}</dd></div>`}
function detailsHTML(e,id,a,r){const s=st(e,id);const fl=arr(r.fields);
 const wl=s.watchers.map(n=>`<span class="rsh-w">${typeof avatar==="function"?avatar(n,{size:20}):""}${H(n)}<button data-rsh-unwatch="${H(n)}" aria-label="Remove watcher ${H(n)}">&times;</button></span>`).join("");
 const acts=arr(r.actions).length?`<div class="rsh-acts">${r.actions.map(x=>`<button class="btn ${x.cls||"quiet"}" data-rsh-act="${H(x.id)}">${H(x.l)}</button>`).join("")}</div>`:"";
 return `${acts}<dl class="rsh-fields">${fl.map(f=>fieldHTML(e,id,f,s)).join("")}</dl>${r.extra?`<div class="rsh-extra">${r.extra}</div>`:""}
 <div class="rsh-watch"><b class="small">Watchers</b><div class="rsh-wl">${wl||'<span class="muted small">Nobody is watching yet.</span>'}</div><span class="rsh-edit">${pplSel("","data-rsh-wsel")}<button class="btn quiet sm" data-rsh-addwatch>Add watcher</button></span></div>`}

function activityRows(e,id,a,r){
 const s=st(e,id);const out=[];
 s.comments.forEach(c=>out.push({ts:c.ts||0,who:c.by,t:"commented",x:c.text,k:"Comment",mn:true}));
 s.hist.forEach(h=>out.push({ts:h.ts||0,who:h.by,t:h.t,x:h.x,k:h.k||"Change"}));
 arr(r.activity).forEach((x,i)=>out.push({ts:x.ts!=null?x.ts:-i,who:x.who,t:x.t||"",x:x.x||"",k:x.k||"Record",at:x.at}));
 return out.sort((p,q)=>q.ts-p.ts)}
function activityHTML(e,id,a,r){const rows=activityRows(e,id,a,r);
 if(!rows.length)return `<p class="muted">No activity yet. Comments, edits, follows and the record's own history appear here.</p>`;
 return `<ol class="rsh-feed">${rows.slice(0,60).map(x=>`<li><span class="rsh-dot ${x.k==="Comment"?"c":x.k==="Change"?"e":""}"></span><div><div class="rsh-who">${typeof avatar==="function"&&x.who?avatar(x.who,{size:20}):""}<b>${H(x.who||"System")}</b> <span class="muted">${H(x.t)}</span> <span class="muted small">${H(x.at||(x.ts>1e9?agoTs(x.ts):""))}</span> <span class="pill mute">${H(x.k)}</span></div>${x.x?`<div class="rsh-x">${x.mn?mentionHTML(x.x):H(x.x)}</div>`:""}</div></li>`).join("")}</ol>`}
function agoTs(ts){return nowLabel()}

function commentsHTML(e,id,a,r){const s=st(e,id);
 const list=s.comments.slice().reverse().map(c=>`<li class="rsh-c"><div class="rsh-who">${typeof avatar==="function"?avatar(c.by,{size:24}):""}<b>${H(c.by)}</b> <span class="muted small">${H(c.at)}</span></div><div class="rsh-x">${mentionHTML(c.text)}</div>${c.mentions&&c.mentions.length?`<div class="muted small">Notified: ${c.mentions.map(H).join(", ")}</div>`:""}</li>`).join("");
 const q=RS.mq||"";const sug=q?humans().filter(n=>n.toLowerCase().indexOf(q.toLowerCase())===0||n.toLowerCase().split(" ").some(w=>w.indexOf(q.toLowerCase())===0)).slice(0,6):[];
 return `<form class="rsh-cform" data-rsh-cform><label class="small muted" for="rsh_ct">Comment. Type @ and a name to notify someone.</label>
 <textarea id="rsh_ct" class="rsh-ta" name="c" rows="3" placeholder="Write a comment" data-rsh-ta></textarea>
 <div class="rsh-sug" data-rsh-sug>${sug.map(n=>`<button type="button" class="chip" data-rsh-mention="${H(n)}">@${H(n)}</button>`).join("")}</div>
 <div class="row" style="gap:8px"><button class="btn primary" type="submit">Post comment</button><span class="muted small">Mentioned people become watchers and get a notice in their inbox.</span></div></form>
 <ul class="rsh-clist">${list||'<li class="muted">No comments yet.</li>'}</ul>`}

function attachHTML(e,id,a,r){const s=st(e,id);const all=arr(r.attach).concat(s.att);
 return `<p class="muted small">Metadata only. Evidence and documents are linked by record or address, never uploaded here.</p>
 ${all.length?`<div class="tscroll"><table class="rsh-tbl"><thead><tr><th>Name</th><th>Type</th><th>Link</th><th>Added by</th><th>When</th><th></th></tr></thead><tbody>${all.map(x=>`<tr><td><b>${H(x.name)}</b>${x.note?`<br><span class="muted small">${H(x.note)}</span>`:""}</td><td>${H(x.kind)}</td><td>${linkCell(x.link)}</td><td>${H(x.by||"")}</td><td class="nowrap">${H(x.at||"")}</td><td>${x.id&&s.att.some(q=>q.id===x.id)?`<button class="btn quiet sm" data-rsh-rmatt="${H(x.id)}">Remove</button>`:""}</td></tr>`).join("")}</tbody></table></div>`:'<p class="muted">Nothing attached yet.</p>'}
 <form class="rsh-aform" data-rsh-aform><div class="rsh-agrid"><label>Name<input class="rsh-in" name="n" required maxlength="80" placeholder="Q3 access review export"></label><label>Type<select class="rsh-in" name="k"><option>Evidence</option><option>Document</option><option>Screenshot</option><option>Report</option><option>Link</option></select></label><label>Record id or address<input class="rsh-in" name="l" placeholder="INC0412, CT-107 or https://..." maxlength="200"></label><label>Note<input class="rsh-in" name="o" maxlength="120"></label></div><button class="btn primary" type="submit">Add attachment record</button></form>`}
function linkCell(l){if(!l)return'<span class="muted">-</span>';const s=String(l);if(/^https?:/i.test(s))return `<a href="${H(s)}" target="_blank" rel="noopener noreferrer">${H(s.replace(/^https?:\/\//,"").slice(0,38))}</a>`;
 return `<button class="rsh-link" data-rsh-open="${H(s)}">${H(s)}</button>`}

function relatedGroups(e,id,a,r){
 const g=[];arr(r.links).forEach(x=>{if(x&&x.rows&&x.rows.length)g.push(x)});
 const s=st(e,id);
 if(s.links.length)g.push({key:"Linked by people",label:"Linked by people",rows:s.links.map(l=>({id:l.id,t:l.t||l.id,sub:l.by?"Linked by "+l.by:"",tag:l.id,st:"info",go:()=>R.openAny(l.id)}))});
 const zc=G(()=>ZLINK.connected(id),[]);zc.forEach(x=>g.push(x));
 return g}
function relatedHTML(e,id,a,r){const g=relatedGroups(e,id,a,r);const q=RS.lq[key(e,id)]||"";
 const res=q.length>=2?G(()=>{const U=ZLINK.universe();const out=[];const lq=q.toLowerCase();U.forEach(v=>{if(out.length<8&&!v.alias&&v.t!=="person"&&(String(v.id).toLowerCase().indexOf(lq)>=0||String(v.label).toLowerCase().indexOf(lq)>=0)&&v.id!==id)out.push(v)});return out},[]):[];
 const body=g.length&&typeof lrHTML==="function"?lrHTML({id:"rsh_"+String(e+id).replace(/\W/g,"_"),groups:g,limit:5,search:true}):'<p class="muted">No linked records yet.</p>';
 return `${body}<div class="rsh-link-add"><label class="small muted" for="rsh_lq">Link another record</label><input id="rsh_lq" class="rsh-in" data-rsh-lq value="${H(q)}" placeholder="Search by id or title" autocomplete="off">${res.length?`<div class="rsh-lres">${res.map(v=>`<button type="button" class="chip" data-rsh-link="${H(v.id)}" data-t="${H(v.label)}">${H(v.id)} ${H(String(v.label).slice(0,40))}</button>`).join("")}</div>`:""}</div>`}

function auditHTML(e,id,a,r){const s=st(e,id);const rows=auditRows(id);
 const ch=s.hist.filter(h=>h.field);
 return `<h3 class="rsh-h3">Change history</h3>${ch.length?`<div class="tscroll"><table class="rsh-tbl"><thead><tr><th>Field</th><th>From</th><th>To</th><th>By</th><th>When</th></tr></thead><tbody>${ch.map(h=>`<tr><td>${H(h.field)}</td><td>${H(h.from==null||h.from===""?"-":h.from)}</td><td>${H(h.to)}</td><td>${H(h.by)}</td><td class="nowrap">${H(h.when)}</td></tr>`).join("")}</tbody></table></div>`:'<p class="muted small">No field changes made from this record yet.</p>'}
 <h3 class="rsh-h3">Platform audit trail</h3>${rows.length?`<div class="tscroll"><table class="rsh-tbl"><thead><tr><th>Time</th><th>Who</th><th>Action</th><th>Detail</th></tr></thead><tbody>${rows.map(x=>`<tr><td class="nowrap">${H(x.t)}</td><td>${H(x.p)}</td><td>${H(x.a)}</td><td>${H(x.d)}</td></tr>`).join("")}</tbody></table></div>`:'<p class="muted small">No audit entries mention this record in this session. The hash-chained log is under Audit trail.</p>'}`}

/* ---------- mount ---------- */
function bodyHTML(e,id,a,r,tab){
 switch(tab){case"activity":return activityHTML(e,id,a,r);case"comments":return commentsHTML(e,id,a,r);case"attachments":return attachHTML(e,id,a,r);case"related":return relatedHTML(e,id,a,r);case"audit":return auditHTML(e,id,a,r);default:return""}}
function paint(root){
 const e=root.dataset.rshE,id=root.dataset.rshId,a=AD[e],r=rec(e,id);if(!a||!r){root.innerHTML='<p class="muted">This record could not be loaded.</p>';return}
 const k=key(e,id),tab=RS.tab[k]||"details";
 const legacy=root.querySelector("[data-rsh-legacy]");
 const keep=legacy;if(keep&&keep.parentNode)keep.parentNode.removeChild(keep);
 root.innerHTML=`${headHTML(e,id,a,r)}${tabsHTML(e,id,tab,counts(e,id,a,r))}<div class="rsh-body" role="tabpanel"><div data-rsh-fields ${tab==="details"?"":"hidden"}>${detailsHTML(e,id,a,r)}</div>${keep?"":""}<div data-rsh-legacy-slot ${tab==="details"?"":"hidden"}></div><div data-rsh-dyn ${tab==="details"?"hidden":""}>${tab==="details"?"":bodyHTML(e,id,a,r,tab)}</div></div><datalist id="rsh_tags">${allTags().map(t=>`<option value="${H(t)}">`).join("")}</datalist>`;
 if(keep){const slot=root.querySelector("[data-rsh-legacy-slot]");slot.appendChild(keep)}
 root.classList.toggle("rsh-adopted",!!keep)}
function allTags(){const m={};Object.keys(MEM).forEach(k=>MEM[k].tags.forEach(t=>m[t]=(m[t]||0)+1));return Object.keys(m).sort((a,b)=>m[b]-m[a]).slice(0,30)}
function repaintAll(){document.querySelectorAll(".rsh[data-rsh-e]").forEach(paint)}
R.repaint=repaintAll;

R.mount=function(host,o){
 o=o||{};const e=o.entity,id=String(o.id);if(!host)return null;
 if(!AD[e]){host.innerHTML='<p class="muted">No record view is registered for '+H(e)+'.</p>';return null}
 const root=document.createElement("div");root.className="rsh";root.dataset.rshE=e;root.dataset.rshId=id;root.setAttribute("data-rsh",key(e,id));
 if(o.legacy){const l=document.createElement("div");l.setAttribute("data-rsh-legacy","");l.className="rsh-legacy";while(o.legacy.firstChild)l.appendChild(o.legacy.firstChild);root.appendChild(l)}
 host.innerHTML="";host.appendChild(root);paint(root);RS.opened++;
 G(()=>NAVX.visit&&0);return root};
R.open=function(entity,id,o){
 if(!AD[entity])return false;const r=rec(entity,id);if(!r)return false;
 window.openDrawer('<div class="rsh-host" data-rsh-skip></div>');
 const host=document.querySelector("#drawer .rsh-host");R.mount(host,{entity,id});
 audit("Opened record",entity+" "+id);return true};
R.openAny=function(id){id=String(id);if(id.indexOf("scr:")===0){G(()=>closeDrawer());go(id.slice(4));return true}const e=R.resolve(id);if(e)return R.open(e,id);if(window.ZLINK&&ZLINK.open&&ZLINK.open(id))return true;if(window.go)toast("No record view for "+id,"warn");return false};

/* ---------- actions ---------- */
function ctx(el){const root=el.closest(".rsh[data-rsh-e]");if(!root)return null;return{root,e:root.dataset.rshE,id:root.dataset.rshId,a:AD[root.dataset.rshE]}}
function logHist(c,t,x,extra){const s=st(c.e,c.id);s.hist.unshift(Object.assign({ts:Date.now(),by:ME(),t,x:x||"",k:"Change",when:nowLabel()},extra||{}))}
function applyEdit(c,k,v){
 const r=rec(c.e,c.id);if(!r)return;const s=st(c.e,c.id);
 const ob=ownerBackup(c.a,r);
 let from;
 if(k==="owner")from=s.edits.owner!=null?s.edits.owner:ob.o;else if(k==="backup")from=s.edits.backup!=null?s.edits.backup:ob.b;else if(k==="status")from=s.edits.status!=null?s.edits.status:r.status;else{const f=arr(r.fields).find(q=>q.k===k);from=s.edits[k]!=null?s.edits[k]:(f?f.v:"")}
 if(String(from||"")===String(v||"")){toast("No change","info");return}
 if(k==="backup"&&v&&v===(s.edits.owner!=null?s.edits.owner:ob.o)){toast("The backup must be a different person from the owner","warn");return}
 if(k==="owner"&&v&&v===(s.edits.backup!=null?s.edits.backup:ob.b)){toast("The owner must be a different person from the backup","warn");return}
 s.edits[k]=v;
 const lab=k==="owner"?"Owner":k==="backup"?"Backup":k==="status"?"Status":(arr(r.fields).find(q=>q.k===k)||{l:k}).l;
 logHist(c,"changed "+lab,(from||"none")+" to "+(v||"none"),{field:lab,from,to:v});
 if(k==="owner"||k==="backup"){if(v&&!s.watchers.includes(v))s.watchers.push(v);
  if(c.a.okind&&window.OWNX&&OWNX.assign){const o2=k==="owner"?v:(s.edits.owner!=null?s.edits.owner:ob.o),b2=k==="backup"?v:(s.edits.backup!=null?s.edits.backup:ob.b);if(o2)G(()=>OWNX.assign(c.a.okind,c.id,o2,b2||""))}}
 let wrote=false;if(c.a.set)wrote=G(()=>c.a.set(c.id,k,v),false);
 audit("Record edited",c.e+" "+c.id+": "+lab+" "+(from||"none")+" to "+(v||"none"));
 const S_=STORE();if(S_){try{const patch={id:c.id};patch[k]=v;S_.put(c.e,Object.assign({},G(()=>S_.get(c.e,c.id),{})||{},patch))}catch(x){}}
 save(c.e,c.id);emit("record.field_changed","Record field changed",{record:c.id,entity:c.e,actor:ME(),detail:lab+": "+(from||"none")+" to "+(v||"none")});
 RS.ed=null;toast(lab+" updated"+(S_?" and saved":" (this session only)"),"good");
 if(typeof render==="function"&&c.a.rerender)render();
 repaintAll()}

document.addEventListener("click",ev=>{
 const t=ev.target;let b;
 if((b=t.closest("[data-rsh-tab]"))){const c=ctx(b);if(!c)return;RS.tab[key(c.e,c.id)]=b.dataset.rshTab;RS.ed=null;paint(c.root);return}
 if((b=t.closest("[data-rsh-edit]"))){const c=ctx(b);if(!c)return;RS.ed={key:key(c.e,c.id),k:b.dataset.rshEdit};paint(c.root);const i=c.root.querySelector("[data-rsh-in]");if(i&&i.focus)i.focus();return}
 if(t.closest("[data-rsh-cancel]")){const c=ctx(t);RS.ed=null;if(c)paint(c.root);return}
 if((b=t.closest("[data-rsh-save]"))){const c=ctx(b);if(!c||!RS.ed)return;const i=c.root.querySelector("[data-rsh-in]");applyEdit(c,RS.ed.k,i?i.value:"");return}
 if((b=t.closest("[data-rsh-follow]"))){const c=ctx(b);if(!c)return;const s=st(c.e,c.id);s.following=!s.following;const me=ME();if(s.following&&!s.watchers.includes(me))s.watchers.push(me);if(!s.following)s.watchers=s.watchers.filter(n=>n!==me);
  logHist(c,s.following?"started following":"stopped following","",{k:"Follow"});audit(s.following?"Followed record":"Unfollowed record",c.e+" "+c.id);emit("record.followed","Record followed",{record:c.id,entity:c.e,actor:me,detail:s.following?"follow":"unfollow"});save(c.e,c.id);toast(s.following?"You will be notified of changes":"Unfollowed","good");paint(c.root);return}
 if((b=t.closest("[data-rsh-untag]"))){const c=ctx(b);if(!c)return;const s=st(c.e,c.id);s.tags=s.tags.filter(x=>x!==b.dataset.rshUntag);logHist(c,"removed tag",b.dataset.rshUntag,{k:"Tag"});save(c.e,c.id);paint(c.root);return}
 if((b=t.closest("[data-rsh-unwatch]"))){const c=ctx(b);if(!c)return;const s=st(c.e,c.id);s.watchers=s.watchers.filter(x=>x!==b.dataset.rshUnwatch);save(c.e,c.id);paint(c.root);return}
 if((b=t.closest("[data-rsh-addwatch]"))){const c=ctx(b);if(!c)return;const sel=c.root.querySelector("[data-rsh-wsel]");const n=sel&&sel.value;if(!n)return;const s=st(c.e,c.id);if(!s.watchers.includes(n)){s.watchers.push(n);logHist(c,"added watcher",n,{k:"Watch"});audit("Watcher added",c.e+" "+c.id+": "+n);save(c.e,c.id)}paint(c.root);return}
 if((b=t.closest("[data-rsh-mention]"))){const c=ctx(b);if(!c)return;const ta=c.root.querySelector("[data-rsh-ta]");if(!ta)return;ta.value=ta.value.replace(/@[A-Za-z]*$/,"@"+b.dataset.rshMention+" ");RS.mq="";const sg=c.root.querySelector("[data-rsh-sug]");if(sg)sg.innerHTML="";ta.focus();return}
 if((b=t.closest("[data-rsh-rmatt]"))){const c=ctx(b);if(!c)return;const s=st(c.e,c.id);s.att=s.att.filter(x=>x.id!==b.dataset.rshRmatt);save(c.e,c.id);paint(c.root);return}
 if((b=t.closest("[data-rsh-act]"))){const c=ctx(b);if(!c||!c.a.act)return;const ok=G(()=>c.a.act(c.id,b.dataset.rshAct),false);if(ok!==false){audit("Record action",c.e+" "+c.id+": "+b.dataset.rshAct);save(c.e,c.id);if(typeof render==="function")render();repaintAll()}return}
 if((b=t.closest("[data-rsh-open]"))){R.openAny(b.dataset.rshOpen);return}
 if((b=t.closest("[data-rsh-link]"))){const c=ctx(b);if(!c)return;const s=st(c.e,c.id);if(!s.links.some(l=>l.id===b.dataset.rshLink)){s.links.push({id:b.dataset.rshLink,t:b.dataset.t,by:ME()});logHist(c,"linked a record",b.dataset.rshLink,{k:"Link"});audit("Record linked",c.e+" "+c.id+" to "+b.dataset.rshLink);save(c.e,c.id);toast("Linked "+b.dataset.rshLink,"good")}RS.lq[key(c.e,c.id)]="";paint(c.root);return}
});
document.addEventListener("input",ev=>{
 const ta=ev.target.closest("[data-rsh-ta]");
 if(ta){const m=ta.value.match(/@([A-Za-z]*)$/);RS.mq=m?m[1]:"";const c=ctx(ta);const sg=c&&c.root.querySelector("[data-rsh-sug]");if(sg){const q=RS.mq.toLowerCase();const sug=m?humans().filter(n=>n.toLowerCase().split(" ").some(w=>w.indexOf(q)===0)).slice(0,6):[];sg.innerHTML=sug.map(n=>`<button type="button" class="chip" data-rsh-mention="${H(n)}">@${H(n)}</button>`).join("")}return}
 const lq=ev.target.closest("[data-rsh-lq]");
 if(lq){const c=ctx(lq);if(!c)return;RS.lq[key(c.e,c.id)]=lq.value;const pos=lq.selectionStart;const d=c.root.querySelector("[data-rsh-dyn]");if(d){d.innerHTML=bodyHTML(c.e,c.id,c.a,rec(c.e,c.id),"related");const i=d.querySelector("[data-rsh-lq]");if(i){i.focus();try{i.setSelectionRange(pos,pos)}catch(x){}}}}});
document.addEventListener("submit",ev=>{
 const f=ev.target;
 if(f.matches("[data-rsh-tagform]")){ev.preventDefault();const c=ctx(f);if(!c)return;const v=(f.t.value||"").trim().toLowerCase().replace(/[^a-z0-9 _-]/g,"");if(!v)return;const s=st(c.e,c.id);if(!s.tags.includes(v)){s.tags.push(v);logHist(c,"added tag",v,{k:"Tag"});audit("Tag added",c.e+" "+c.id+": "+v);putAtom("tag",{id:key(c.e,c.id)+"#"+v,record:c.id,entity:c.e,tag:v,by:ME()});save(c.e,c.id)}paint(c.root);return}
 if(f.matches("[data-rsh-cform]")){ev.preventDefault();const c=ctx(f);if(!c)return;const text=(f.c.value||"").trim();if(!text){toast("Write something first","warn");return}
  const s=st(c.e,c.id);const m=mentionsOf(text);const me=ME();const co={id:"c"+(s.seq++),by:me,at:"just now",text,mentions:m,ts:Date.now()};s.comments.push(co);
  if(!s.watchers.includes(me))s.watchers.push(me);m.forEach(n=>{if(!s.watchers.includes(n))s.watchers.push(n)});
  if(m.length)G(()=>{ZLINK.state.notes.unshift({id:"rsh"+Date.now()+Math.random().toString(36).slice(2,5),to:m.slice(),t:me+" mentioned you on "+c.id+": "+text.slice(0,70),ev:"comment.mentioned",rec:c.id});if(window.INBOX&&INBOX.refresh)INBOX.refresh()});
  audit("Comment posted",c.e+" "+c.id+(m.length?" mentioning "+m.join(", "):""));
  putAtom("comment",{id:key(c.e,c.id)+"#"+co.id,record:c.id,entity:c.e,author:me,body:text,mentions:m,at:TODAY});
  emit("record.commented","Record commented",{record:c.id,entity:c.e,actor:me,detail:text.slice(0,80)});if(m.length)emit("record.mentioned","Person mentioned on a record",{record:c.id,entity:c.e,actor:me,detail:m.join(", ")});
  save(c.e,c.id);toast(m.length?"Comment posted; "+m.length+" notified":"Comment posted","good");RS.mq="";paint(c.root);return}
 if(f.matches("[data-rsh-aform]")){ev.preventDefault();const c=ctx(f);if(!c)return;const n=(f.n.value||"").trim();if(!n)return;const l=(f.l.value||"").trim();
  if(l&&!/^https?:\/\//i.test(l)&&!R.resolve(l)&&!G(()=>ZLINK.universe().has(l),false)){toast("That is not a record id or a web address","warn");return}
  const s=st(c.e,c.id);const at={id:"a"+(s.seq++),name:n,kind:f.k.value,link:l,note:(f.o.value||"").trim(),by:ME(),at:"Oct 10"};s.att.push(at);logHist(c,"attached "+n,l||"no link",{k:"Attachment"});
  putAtom("attachment",{id:key(c.e,c.id)+"#"+at.id,record:c.id,entity:c.e,name:n,kind:at.kind,link:l,by:ME()});audit("Attachment recorded",c.e+" "+c.id+": "+n);save(c.e,c.id);toast("Attachment record added (metadata only)","good");paint(c.root)}});

/* ---------- adopt existing drawers: wrap what a module drew in the shared shell (nothing is removed or re-implemented) ---------- */
function detect(d){
 const head=((d.querySelector("h1,h2")||{}).textContent||"").trim();
 const txt=(d.innerText||"").replace(/\s+/g," ").trim();
 const lead=txt.replace(/^(Full screen|Exit full screen|Close)\s*/g,"").replace(/^(Full screen|Exit full screen|Close)\s*/g,"").slice(0,210);
 let best=null;
 Object.keys(AD).forEach(e=>{const a=AD[e];
  if(a.rx){const m=new RegExp("\\b("+a.rx+")\\b").exec(lead);if(m&&(!best||m.index<best.pos)){const idm=m[1];if(rec(e,idm))best={pos:m.index,e,id:idm}}}
  if(a.sniff){const id=G(()=>a.sniff(lead,head),null);if(id&&rec(e,id)&&(!best||best.pos>0))best={pos:0,e,id:String(id)}}
  if(a.byHead&&head){const id=G(()=>a.byHead(head,lead),null);if(id&&rec(e,id)&&(!best||best.pos>0))best={pos:0,e,id:String(id)}}});
 return best}
function adopt(){
 const d=document.getElementById("drawer");if(!d||!d.children.length)return;
 if(d.querySelector(":scope > .rsh-wrap")||d.querySelector("[data-rsh-skip]")||d.querySelector("form.fform"))return;
 const det=detect(d);if(!det)return;
 const kids=[...d.children].filter(c=>!c.matches(".dctl,.closebtn,.dexpand")&&!/(^|\s)nx-/.test(c.className||""));
 if(!kids.length)return;
 const tmp=document.createElement("div");kids.forEach(k=>tmp.appendChild(k));
 const wrap=document.createElement("div");wrap.className="rsh-wrap";d.appendChild(wrap);
 R.mount(wrap,{entity:det.e,id:det.id,legacy:tmp});RS.adopted++;
 R.last={entity:det.e,id:det.id};G(()=>audit("Record shell attached",det.e+" "+det.id))}
let _t=0;
function watch(){const d=document.getElementById("drawer");if(!d||d.__rsh)return;d.__rsh=1;
 new MutationObserver(()=>{if(d.querySelector(":scope > .rsh-wrap")||d.querySelector("[data-rsh-skip]"))return;clearTimeout(_t);_t=setTimeout(()=>G(adopt),50)}).observe(d,{childList:true})}
setTimeout(watch,300);setTimeout(watch,1500);

/* ---------- stats (for the adoption metric) ---------- */
R.stats=()=>({adapters:Object.keys(AD).length,records:Object.keys(MEM).length,comments:Object.keys(MEM).reduce((n,k)=>n+MEM[k].comments.length,0),adopted:RS.adopted,opened:RS.opened});
})();
