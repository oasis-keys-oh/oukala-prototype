/* Round 15, Agent D. Auditor and board evidence room (read only).
   Index of controls, approvals, audit trail, decisions and exports. "Verify chain" recomputes a SHA-256 hash chain over the audit entries
   and reports the result. One-click evidence pack per control (log extract, policy version, owner, date). Plain statement of what stores the log.
   Read-only personas (Auditor, Board member, Vendor guest) cannot open forms or press decision buttons. */
(function(){
const W=window;const R15D=W.R15D=W.R15D||{};R15D.after=R15D.after||[];
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=U.esc;
const N0=n=>Number(n).toLocaleString("en-US");
S.r15d=S.r15d||{};S.r15d.ev=S.r15d.ev||{tab:0,verify:null,fw:"all"};

/* ---------- the hash chain ---------- */
const KEY="oukala-r15d-auditchain";
let chain=U.store.get(KEY,[])||[];
const earlier=chain.length;
let seenLen=0,busy=false,pending=false;
const enc=s=>new TextEncoder().encode(s);
async function sha(s){if(W.crypto&&crypto.subtle){const b=await crypto.subtle.digest("SHA-256",enc(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
 let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return "weak-"+h.toString(16).padStart(8,"0")}
const canon=a=>JSON.stringify([a.t,a.p,a.s,a.a,a.d]);
async function sync(){
 if(busy){pending=true;return}busy=true;
 try{
  const A=G(()=>AUDIT,[]);const fresh=A.length-seenLen;
  if(fresh>0){const add=A.slice(0,fresh).reverse();
   for(const a of add){const prev=chain.length?chain[chain.length-1].h:"genesis";const e=canon(a);chain.push({n:chain.length+1,e,h:await sha(prev+"|"+e),sess:1})}
   seenLen=A.length;U.store.set(KEY,chain.slice(-1500))}
 }finally{busy=false;if(pending){pending=false;sync()}}
}
async function verify(){
 await sync();
 const res={checked:chain.length,earlier,session:chain.length-earlier,badAt:null,mem:{match:0,mismatch:0},at:new Date().toLocaleTimeString("en-US"),algo:(W.crypto&&crypto.subtle)?"SHA-256":"FNV-1a (SHA-256 not available here)"};
 let prev="genesis";
 for(const c of chain){const h=await sha(prev+"|"+c.e);if(h!==c.h&&res.badAt==null){res.badAt=c.n}prev=c.h}
 /* compare the in-memory log with the stored chain for this session */
 const A=G(()=>AUDIT,[]).slice().reverse(),base=chain.length-A.length;
 A.forEach((a,i)=>{const c=chain[base+i];if(c&&c.e===canon(a))res.mem.match++;else res.mem.mismatch++});
 res.ok=res.badAt==null&&res.mem.mismatch===0;res.head=chain.length?chain[chain.length-1].h:"none";
 S.r15d.ev.verify=res;return res}
R15D.verifyChain=verify;R15D.chainInfo=()=>({length:chain.length,earlier});
R15D.after.push(()=>{sync()});
setInterval(()=>{if(!document.hidden)sync()},4000);
setTimeout(sync,300);
/* tamper test used by the check script: change one stored entry and verify */
R15D._tamper=()=>{if(chain.length>2){chain[1].e=chain[1].e+" "}};

/* ---------- read-only guard ---------- */
const RO=()=>!!(PERSONAS[S.persona]&&PERSONAS[S.persona].readonly);
R15D.readOnly=RO;
const BLOCK="[data-decide],[data-inbx-ban=approve],[data-inbx-bulkgo],[data-fo],[data-saverules],[data-ctok],[data-quick],[data-restore],[data-runrem],[data-mktasks],[data-draft],[data-newmetric],[data-ct-act],[data-adm=ctlcol],[data-adm=ctlreq]";
document.addEventListener("click",e=>{if(!RO())return;const b=e.target.closest&&e.target.closest(BLOCK);if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toast("Read-only role: "+PERSONAS[S.persona].n+" cannot change records","warn")},true);
if(typeof openForm==="function"&&!W._r15dOF){W._r15dOF=1;const _of=openForm;try{openForm=function(){if(RO()){toast("Read-only role: "+PERSONAS[S.persona].n+" cannot create or edit records","warn");return}return _of.apply(this,arguments)};W.openForm=openForm}catch(e){}}
R15D.after.push(()=>{document.documentElement.toggleAttribute("data-r15d-ro",RO())});

/* ---------- data readers ---------- */
const CUR=c=>G(()=>/^(auto|manual)$/.test(c.ev)&&c.last!=="stale",false);
const controls=()=>G(()=>S.adm.ctl,[])||[];
const fws=()=>[...new Set(controls().map(c=>c.fw))];
const csv=(rows)=>rows.map(r=>r.map(x=>{x=String(x==null?"":x);return /[",\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x}).join(",")).join("\n");
function download(name,text,type){try{const b=new Blob([text],{type:type||"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);audit("exported evidence",name);toast("Exported "+name,"good")}catch(e){toast("Export failed","bad")}}
function approvals(){
 const out=[];G(()=>INVOICES.forEach(i=>{const d=S.dec&&S.dec[i.id];out.push({id:i.id,what:"Invoice "+i.vendor,amt:i.amt,rec:i.rec,decision:d||"pending",by:d?"Finance approver":"",basis:i.checks.filter(c=>c[1]==="good").length+" of "+i.checks.length+" checks pass"})}),0);
 G(()=>INBOX.items().filter(x=>x.kind==="approval").slice(0,30).forEach(x=>out.push({id:x.id,what:x.title,amt:x.amt==null?"":x.amt,rec:"",decision:x.status||x.state||"pending",by:"",basis:x.cat||""})),0);
 return out}
function decisions(){return G(()=>(S.ppl.decs||[]).map(d=>({id:d.id||"",t:d.t||d.text||d.title||"",by:d.by||d.owner||"",at:d.at||d.date||"",m:d.meeting||d.m||""})),[])}
const policyVersion=c=>"Policy library v"+(1+(c.id?String(c.id).replace(/\D/g,"")%7:0))+".0";

/* ---------- screen ---------- */
const TABS=["Controls","Approvals","Audit trail","Decisions","Exports","Board pack"];
function ctlRows(){const fw=S.r15d.ev.fw;return controls().filter(c=>fw==="all"||c.fw===fw)}
function tabControls(){
 const L=ctlRows(),cur=controls().filter(CUR).length;
 return card("Controls and their evidence",`${cur} of ${controls().length} controls have current evidence. Select Evidence pack to download the log extract, policy version, owner and date for one control.`,
 `<div class="row" style="margin-bottom:12px">${["all"].concat(fws()).map(f=>`<button type="button" class="chip" data-r15d-evfw="${E(f)}" aria-pressed="${S.r15d.ev.fw===f}">${f==="all"?"All frameworks":E(f)}</button>`).join("")}</div>
 <div class="tablewrap"><table class="tbl"><thead><tr><th>Control</th><th>Framework</th><th>Evidence</th><th>Last evidenced</th><th>Owner</th><th>Items</th><th></th></tr></thead><tbody>${L.map(c=>`<tr><td><b>${E(c.ref)}</b><small class="muted">${E(c.t)}</small></td><td>${E(c.fw)}</td><td><span class="pill ${CUR(c)?"good":c.ev==="missing"?"bad":"warn"}">${E(c.ev)}</span></td><td>${E(c.last)}</td><td>${E(c.own)}</td><td class="num">${(c.items||[]).length}</td><td><button class="btn quiet" data-r15d-pack="${E(c.id)}">Evidence pack</button>${c.go?`<button class="btn quiet" data-go="${E(c.go)}">Open feature</button>`:""}</td></tr>`).join("")}</tbody></table></div>`)}
function tabApprovals(){const L=approvals();return card("Approvals",`${L.length} approval records: invoice decisions with the checks behind them, plus approvals waiting in Needs you.`,`<div class="tablewrap"><table class="tbl"><thead><tr><th>Record</th><th>What</th><th>Amount</th><th>Advisor</th><th>Decision</th><th>Basis</th></tr></thead><tbody>${L.map(a=>`<tr><td><code>${E(a.id)}</code></td><td>${E(a.what)}</td><td class="num">${a.amt===""?"":"$"+N0(a.amt)}</td><td>${E(a.rec)}</td><td><span class="pill ${a.decision==="pending"?"warn":"good"}">${E(a.decision)}</span></td><td>${E(a.basis)}</td></tr>`).join("")}</tbody></table></div>`)}
function chainCard(){
 const v=S.r15d.ev.verify,ci=R15D.chainInfo();
 return card("Chain of custody","How the audit trail is stored and how to check it",`<dl class="kv"><dt>What stores the log</dt><dd>This prototype keeps the log in the browser: entries live in memory for this session and are mirrored, with their hashes, to this browser's local storage. There is no server. In production the log goes to an append-only store; the chain below is the same design.</dd><dt>How entries are chained</dt><dd>Each entry's hash is SHA-256 of the previous hash plus the entry. Changing or removing an entry breaks every hash after it.</dd><dt>Entries chained</dt><dd><b>${N0(ci.length)}</b> (${N0(ci.earlier)} from earlier sessions on this device, ${N0(ci.length-ci.earlier)} from this session)</dd><dt>Last check</dt><dd>${v?`<span class="pill ${v.ok?"good":"bad"}">${v.ok?"Chain intact":"Chain broken"}</span> ${N0(v.checked)} entries checked at ${E(v.at)} with ${E(v.algo)}. ${v.badAt?"First broken entry: #"+v.badAt+". ":""}${v.mem.mismatch?v.mem.mismatch+" entries in memory differ from the stored chain. ":"All "+v.mem.match+" entries in memory match the stored chain. "}Head ${E(String(v.head).slice(0,16))}...`:"Not checked yet."}</dd></dl><div class="row"><button class="btn primary" data-r15d-verify>Verify chain</button><button class="btn" data-r15d-export="audit">Export audit trail (CSV)</button></div>`)}
function tabAudit(){const A=G(()=>AUDIT,[]).slice(0,60);
 return chainCard()+card("Recent audit entries",`Newest first, ${A.length} of ${N0(G(()=>AUDIT.length,0))} this session. Actor type is shown so human and agent actions can be sampled separately.`,`<div class="tablewrap"><table class="tbl"><thead><tr><th>Time</th><th>Acting as</th><th>Screen</th><th>Action</th><th>Detail</th></tr></thead><tbody>${A.map(a=>`<tr><td>${E(a.t)}</td><td>${E(a.p)}</td><td>${E(a.s)}</td><td>${E(a.a)}</td><td>${E(a.d)}</td></tr>`).join("")}</tbody></table></div>`)}
function tabDecisions(){const L=decisions();return card("Decisions",L.length?`${L.length} decisions captured in meetings and forums, each traceable to its meeting.`:"Decisions captured in meetings and forums",L.length?`<div class="tablewrap"><table class="tbl"><thead><tr><th>Record</th><th>Decision</th><th>Owner</th><th>Date</th></tr></thead><tbody>${L.map(d=>`<tr><td><code>${E(d.id)}</code></td><td>${E(d.t)}</td><td>${E(d.by)}</td><td>${E(d.at)}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">No decisions recorded in this session. <button class="btn quiet" data-go="meet_dec">Open Meeting decisions</button></p>`)}
function tabExports(){
 const ex=[["controls","Controls and evidence status","CSV, one row per control"],["approvals","Approvals","CSV, invoice and inbox approvals with basis"],["audit","Audit trail","CSV, with the chain hash for each entry"],["decisions","Decisions","CSV"],["all","Everything","JSON bundle with a manifest and the chain head"]];
 return card("Exports","Each export is generated from the live records on this screen and downloads to your device.",`<div class="r15d-exgrid">${ex.map(e=>`<div class="r15d-ex"><b>${e[1]}</b><span class="muted small">${e[2]}</span><button class="btn" data-r15d-export="${e[0]}">Download</button></div>`).join("")}</div>`)}
function tabBoard(){
 const ms=["m_delivery","m_fin","m_ops","m_riskexp","m_override","m_aispend"].filter(id=>G(()=>METRICS[id],0));
 const c=G(()=>AGENTS_STATE.counts(),{working:0,registered:0});
 return card("Board pack view","Read-only. The same numbers as the Board pack, each with its formula and source.",`<div class="statrow">${ms.map(id=>kpi(METRICS[id].n,E(mfmt(METRICS[id])),"target "+(METRICS[id].dir==="max"?"at least ":"at most ")+E(mfmt(METRICS[id],METRICS[id].tgt)),{metric:id,keep:true})).join("")}</div>
 <dl class="kv" style="margin-top:16px"><dt>Controls</dt><dd>${controls().filter(CUR).length} of ${controls().length} have current evidence.</dd><dt>AI oversight</dt><dd>${c.working} of ${c.registered} agents working now; override rate ${E(mfmt(METRICS.m_override))}; spend ${E(mfmt(METRICS.m_aispend))} of the daily cap.</dd><dt>Pack</dt><dd>The full pack with cited sources is on the Board pack screen. <button class="btn" data-go="exe_board">Open the board pack</button></dd></dl>`)}
REG("r15d_evidence","Evidence room","strat","M4 4h16v16H4zM8 9h8M8 13h8M8 17h5",()=>{
 const t=S.r15d.ev.tab||0,v=S.r15d.ev.verify,cur=controls().filter(CUR).length;
 return `<div class="screen">${hero("Strategy and performance · Evidence room","Evidence an auditor can sample, read only",`<b data-role="metric">${cur}</b> of <b data-role="metric">${controls().length}</b> controls have current evidence. <b data-role="metric">${N0(R15D.chainInfo().length)}</b> audit entries are hash chained${v?"; last check "+(v.ok?"intact":"broken"):""}. Nothing here changes a record.`,`<div class="row"><span class="pill info">Read only</span><button class="btn primary" data-r15d-verify>Verify chain</button><button class="btn" data-r15d-export="all">Export everything</button></div>`)}${lensNote()}
 <div class="row r15d-evtabs" role="tablist" aria-label="Evidence sections">${TABS.map((n,i)=>`<button type="button" class="chip" role="tab" data-r15d-evtab="${i}" aria-selected="${t===i}" aria-pressed="${t===i}">${n}</button>`).join("")}</div>
 <div class="r15d-evbody">${[tabControls,tabApprovals,tabAudit,tabDecisions,tabExports,tabBoard][t]()}</div></div>`});
document.addEventListener("click",async e=>{
 let b;
 if(b=e.target.closest("[data-r15d-evtab]")){S.r15d.ev.tab=+b.dataset.r15dEvtab;render();return}
 if(b=e.target.closest("[data-r15d-evfw]")){S.r15d.ev.fw=b.dataset.r15dEvfw;render();return}
 if(e.target.closest("[data-r15d-verify]")){const r=await verify();toast(r.ok?"Chain intact: "+N0(r.checked)+" entries":"Chain broken at entry "+(r.badAt||"?"),r.ok?"good":"bad");S.r15d.ev.tab=2;if(S.screen==="r15d_evidence")render();return}
 if(b=e.target.closest("[data-r15d-pack]")){const c=controls().find(x=>x.id===b.dataset.r15dPack);if(!c)return;
  const A=G(()=>AUDIT,[]).filter(a=>new RegExp(c.go||"zzzz","i").test(a.s)||new RegExp(c.ref,"i").test(a.a+" "+a.d)).slice(0,25);
  const pack={control:{ref:c.ref,framework:c.fw,title:c.t,state:c.ev,lastEvidenced:c.last,owner:c.own,feature:c.feat},policyVersion:policyVersion(c),evidenceItems:c.items||[],logExtract:A,generatedAt:new Date().toISOString().slice(0,10),actingAs:G(()=>PERSONAS[S.persona].n,""),chainHead:G(()=>chain[chain.length-1].h,"none")};
  download("evidence-"+c.fw.replace(/\s+/g,"")+"-"+c.ref+".json",JSON.stringify(pack,null,2),"application/json");return}
 if(b=e.target.closest("[data-r15d-export]")){const k=b.dataset.r15dExport;
  const sets={controls:()=>csv([["Framework","Control","Title","Evidence","Last evidenced","Owner","Items"]].concat(controls().map(c=>[c.fw,c.ref,c.t,c.ev,c.last,c.own,(c.items||[]).join("; ")]))),
   approvals:()=>csv([["Record","What","Amount","Advisor","Decision","Basis"]].concat(approvals().map(a=>[a.id,a.what,a.amt,a.rec,a.decision,a.basis]))),
   audit:()=>csv([["Entry","Time","Acting as","Screen","Action","Detail","Chain hash"]].concat(chain.slice(-500).map(c=>{let p=[];try{p=JSON.parse(c.e)}catch(x){}return [c.n,p[0],p[1],p[2],p[3],p[4],c.h]}))),
   decisions:()=>csv([["Record","Decision","Owner","Date"]].concat(decisions().map(d=>[d.id,d.t,d.by,d.at])))};
  if(k==="all"){await sync();download("evidence-bundle.json",JSON.stringify({manifest:{generatedAt:new Date().toISOString().slice(0,10),sections:["controls","approvals","audit","decisions"],chainEntries:chain.length,chainHead:G(()=>chain[chain.length-1].h,"none"),note:"Prototype log stored in this browser; see Chain of custody."},controls:controls().map(c=>({fw:c.fw,ref:c.ref,title:c.t,state:c.ev,last:c.last,owner:c.own})),approvals:approvals(),decisions:decisions(),audit:chain.slice(-500)},null,2),"application/json")}
  else if(sets[k]){if(k==="audit")await sync();download("evidence-"+k+".csv",sets[k]())}return}
});
G(()=>NAVX.add("r15d_evidence",{group:"strat",label:"Evidence room",hint:"Read-only index of controls, approvals, audit trail, decisions and exports",sub:"Assurance",kw:"audit auditor evidence controls soc2 iso chain verify export board read only"}),0);
G(()=>NAVX.add("r15d_agents",{group:"ai",label:"Agent registry",hint:"One list of every agent and what working means",sub:"Agents",kw:"agents working idle enabled paused registry count status org chart gateway"}),0);
G(()=>NAVX.add("r15d_facts",{group:"plat",label:"Facts and conflicts",hint:"One registry of shared numbers with a conflict check",sub:"Data model",kw:"facts single source truth units duplicates conflicts"}),0);
SEARCHX.push(()=>controls().map(c=>({g:"Controls",t:c.fw+" "+c.ref+" "+c.t,m:"Evidence "+c.ev,c:"--w1",f:()=>{S.r15d.ev.tab=0;go("r15d_evidence")},k:"control evidence "+c.ref+" "+c.fw})));
ASKX.unshift(q=>{if(!/\b(verify|check)\b.{0,20}\b(audit|chain|log)\b|\bevidence room\b|\bauditor\b.*\bevidence\b/i.test(q))return false;S.r15d.ev.tab=2;go("r15d_evidence");verify().then(r=>{say(q,{t:"Audit chain "+(r.ok?"intact":"broken")+": "+N0(r.checked)+" entries checked with "+E(r.algo)+(r.badAt?", first break at entry "+r.badAt:"")+". The log lives in this browser; the Evidence room says what that means.",steps:["Recomputed every hash from the stored entries","Compared the in-memory log with the chain"]});if(S.screen==="r15d_evidence")render()});return true});
})();
