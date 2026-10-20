/* ===== mod_own2: Ownership UI (prefix ownx). Part 2 of 2: badge component, automatic gap injection, assign drawer, screen own_gaps, nav and search chrome. */
(function(){
const W=window,E=s=>esc(s==null?"":String(s)),OW=W.OWNX,OS=S.ownx;
if(!OW){console.error("ownx: mod_own.js missing");return}
const tryv=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const KN=k=>(OW.kinds[k]||{n:k}).n;
const GAPL={unowned:["No owner","bad","Nobody is accountable"],departed:["Owner left","bad","The named owner has left"],roleonly:["Role only","warn","A team or role is named but no person"],agentonly:["Agent only","warn","An AI agent, contractor or provider cannot be accountable; a human sponsor is needed"],nobackup:["No backup","warn","Nobody is named to step in"]};
const ORDER=["unowned","departed","agentonly","roleonly","nobackup"];
const top=r=>ORDER.find(f=>r.act.includes(f));

/* ---------- the badge component ---------- */
function badge(kind,id,o){
 o=o||{};const r=OW.get(kind,id);if(!r)return"";
 if(r.accepted&&!o.always)return `<button type="button" class="pill mute ownx-badge" data-ownx-asg="${E(r.key)}" title="Accepted gap until ${E(r.accepted.exp)}: ${E(r.accepted.reason)}">Accepted until ${E(fmtD?fmtD(r.accepted.exp):r.accepted.exp)}</button>`;
 if(!r.gap){return o.always?`<button type="button" class="pill good ownx-badge" data-ownx-asg="${E(r.key)}" title="Owner ${E(r.ownerName)}${r.backupName?", backup "+E(r.backupName):""}">Owner ${E(r.ownerName)}</button>`:""}
 const f=top(r),g=GAPL[f];
 return `<button type="button" class="pill ${g[1]} ownx-badge" data-ownx-asg="${E(r.key)}" title="${E(g[2])}. Click to assign."><i class="ownx-bd" aria-hidden="true"></i>${E(g[0])}${r.act.length>1&&f!=="nobackup"?` <small>+${r.act.length-1}</small>`:""}</button>`}
OW.badge=badge;
const ownRow=r=>`<div class="ownx-prow" data-ownx-prow><span class="eyebrow">Accountable</span>${r.ownerName?`<span class="row" style="gap:6px">${pchip(r.ownerName)}${r.state==="inferred"?`<span class="pill mute" title="Inferred from the team or role: ${E(r.inferred)}">inferred</span>`:""}</span>`:`<span class="pill ${r.state==="none"?"bad":"warn"}">${r.state==="role"?"Role only: "+E(r.roleText):r.state==="agent"?"Agent or provider only":r.state==="departed"?"Owner left":"No owner"}</span>`}<span class="eyebrow">Backup</span>${r.backupName?pchip(r.backupName):'<span class="pill warn">none named</span>'}${r.gap?`<button type="button" class="btn quiet" data-ownx-asg="${E(r.key)}">Assign</button>`:""}</div>`;

/* ---------- propose an owner and backup for a gap ---------- */
function propose(r){
 const c=OW.candidates(r);if(!c.length)return null;
 if(r.ownerName&&r.act.every(f=>f==="nobackup")){const b=c.find(x=>x.name!==r.ownerName);return b?{owner:r.ownerName,backup:b.name,why:b.why}:null}
 const o=c[0],b=c.find(x=>x.name!==o.name);return{owner:o.name,backup:b?b.name:"",why:o.why}}
OW.propose=propose;

/* ---------- the assign drawer ---------- */
function openAssign(key){
 const r=OW.records().find(x=>x.key===key);if(!r)return;
 const cand=OW.candidates(r),pr=propose(r);OS.draft={key,owner:(pr&&pr.owner)||r.ownerName||"",backup:(pr&&pr.backup)||r.backupName||"",acc:false};
 const hum=OW.people().filter(p=>p.kind==="human").sort((a,b)=>a.name.localeCompare(b.name));
 const opts=(sel)=>`<option value="">Choose a person</option>`+hum.map(p=>`<option value="${E(p.name)}"${p.name===sel?" selected":""}>${E(p.name)} · ${E(p.title)}</option>`).join("");
 const f=top(r);const why=r.accepted?`Accepted as a risk until ${E(r.accepted.exp)}. ${E(r.accepted.reason)}`:r.gap?GAPL[f][2]+".":"This is owned. You can change the owner or the backup.";
 const d=r.domain&&OW.domain(r.domain);
 openDrawer(`<div class="ownx-dr" data-ownx-dr="${E(key)}"><div class="row sp"><span class="eyebrow">Assign owner and backup</span>${r.gap?badge(r.kind,r.id):'<span class="pill good">Owned</span>'}</div>
 <h2 class="ownx-h2">${E(r.label)}</h2><div class="row" style="gap:8px;flex-wrap:wrap"><span class="pill mute">${E(KN(r.kind))}</span>${d?`<span class="pill info" title="Accountability domain">${E(d.label)}</span>`:""}${r.sub?`<span class="muted small">${E(r.sub)}</span>`:""}<button type="button" class="btn quiet" data-ownx-open="${E(key)}">Open it</button></div>
 <p class="story" data-role="story">${E(why)} ${r.kind==="agent"?"An AI agent can never be the accountable owner; name the human sponsor.":"A team, a role or an AI agent does not count: name one person as owner and a different person as backup."}</p>
 <dl class="kv ownx-kv"><dt>Now</dt><dd>${r.ownerName?E(r.ownerName):'<span class="muted">nobody</span>'}${r.roleText?` <span class="muted small">(${E(r.roleText)})</span>`:""}${r.state==="inferred"?` <span class="muted small">(inferred from ${E(r.inferred)})</span>`:""}</dd><dt>Backup now</dt><dd>${r.backupName?E(r.backupName)+(r.bkInherited?' <span class="muted small">(inherited from the team)</span>':""):'<span class="muted">nobody</span>'}</dd>${r.ownerRaw&&r.ownerRaw!==r.ownerName?`<dt>Recorded as</dt><dd>${E(r.ownerRaw)}</dd>`:""}</dl>
 <div class="eyebrow" style="margin-top:12px">Suggested from the org chart</div>
 <div class="ownx-cands">${cand.length?cand.map(c=>`<div class="ownx-cand"><span class="ownx-cn">${avatar(c.name,{size:30})}<span><b>${E(c.name)}</b><small>${E(c.role)} · ${E(c.why)}</small></span></span><span class="row" style="gap:6px"><button type="button" class="chip" data-ownx-pick="owner|${E(c.name)}">As owner</button><button type="button" class="chip" data-ownx-pick="backup|${E(c.name)}">As backup</button></span></div>`).join(""):'<p class="muted small">No candidates could be found from the org chart. Pick anyone below.</p>'}</div>
 <div class="ownx-form"><label class="ownx-l">Accountable owner<select class="ownx-in" id="ownxOwner">${opts(OS.draft.owner)}</select></label><label class="ownx-l">Backup<select class="ownx-in" id="ownxBackup">${opts(OS.draft.backup)}</select></label>
 <label class="ownx-l wide">Note (kept in the audit log)<input class="ownx-in" id="ownxNote" type="text" placeholder="Why this person" autocomplete="off"></label></div>
 <div class="ownx-err small" id="ownxErr" role="alert" hidden></div>
 <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px"><button type="button" class="btn primary" data-ownx-save="${E(key)}">Save owner and backup</button><button type="button" class="btn" data-ownx-ask="${E(key)}">Ask the likely owner</button><button type="button" class="btn quiet" data-ownx-accopen>Accept the risk</button></div>
 <div class="ownx-acc" id="ownxAcc" hidden><p class="small muted">Accepting means you know about the gap and take responsibility for it until a date. It creates a Technical debt item and is audited. At most 90 days.</p>
 <label class="ownx-l wide">Why is it acceptable<textarea class="ownx-in" id="ownxWhy" rows="2" placeholder="For example: the module is retired on Nov 30"></textarea></label><label class="ownx-l">Expires in<select class="ownx-in" id="ownxDays"><option value="14">14 days</option><option value="30" selected>30 days</option><option value="60">60 days</option><option value="90">90 days</option></select></label>
 <button type="button" class="btn danger" data-ownx-acc="${E(key)}">Accept until the date</button></div>
 ${r.kind==="process"?'<p class="muted small">The Process library keeps its own owner field too. Open the process and use Assign owner and backup there to keep them in step.</p>':""}
 <div class="eyebrow" style="margin-top:14px">History</div>${(OS.log.filter(l=>l.kind===r.kind&&l.rid===r.id).slice(0,5).map(l=>`<p class="small"><b>${E(l.at)}</b> ${l.type==="assign"?"Assigned "+E(l.owner)+(l.backup?" with backup "+E(l.backup):""):l.type==="accept"?"Accepted: "+E(l.note):"Asked "+E(l.owner)} by ${E(l.by)}</p>`).join(""))||'<p class="muted small">No changes yet.</p>'}
 ${procCardSafe()}</div>`)}
const procCardSafe=()=>"";
OW.openAssign=openAssign;

/* ---------- screen ---------- */
const SEVP={unowned:"bad",departed:"bad",agentonly:"warn",roleonly:"warn",nobackup:"info"};
const F=()=>OS.f;
function gapTable(){
 const f=F(),all=OW.gaps({kind:f.kind,dom:f.dom,st:f.st==="accepted"?"":f.st,q:f.q,accepted:f.st==="accepted"});
 const list=f.st==="accepted"?all.filter(r=>r.accepted):all;const n=OS.shown||60,rows=list.slice(0,n);
 const stats=OW.stats();
 const kinds=Object.keys(OW.kinds),doms=OW.domains().filter(d=>stats.byDom[d.id]);
 const stLab=[["","All gaps"],["unowned","No owner"],["departed","Owner left"],["roleonly","Role only"],["agentonly","Agent only"],["nobackup","No backup"],["accepted","Accepted"]];
 const sel=rows.filter(r=>OS.sel[r.key]).length;
 const head=`<div class="ownx-filters"><label class="ownx-fl">Kind<select class="ownx-in" data-ownx-fsel="kind"><option value="">All kinds</option>${kinds.map(k=>`<option value="${k}"${f.kind===k?" selected":""}>${E(OW.kinds[k].pl)} (${stats.byKind[k]?stats.byKind[k].gap:0})</option>`).join("")}</select></label>
  <label class="ownx-fl">Domain<select class="ownx-in" data-ownx-fsel="dom"><option value="">All domains</option>${doms.map(d=>`<option value="${E(d.id)}"${f.dom===d.id?" selected":""}>${E(d.label)} (${stats.byDom[d.id].gap})</option>`).join("")}<option value="none"${f.dom==="none"?" selected":""}>No domain</option></select></label>
  <label class="ownx-fl grow">Search<input class="ownx-in" type="search" data-ownx-q value="${E(f.q)}" placeholder="Search gaps, owners, roles" autocomplete="off"></label></div>
  <div class="fchips ownx-st" role="group" aria-label="Gap type">${stLab.map(s=>`<button type="button" class="chip" data-ownx-filter="st|${s[0]}" aria-pressed="${f.st===s[0]}">${s[1]}</button>`).join("")}</div>`;
 const bulk=`<div class="ownx-bulk"><label class="ownx-chk"><input type="checkbox" data-ownx-selall ${rows.length&&sel===rows.length?"checked":""}> Select the ${rows.length} shown</label><span class="muted small">${sel} selected</span><button type="button" class="btn primary" data-ownx-bulk ${sel?"":"disabled"}>Assign suggested owners to ${sel||"selected"}</button><button type="button" class="btn" data-ownx-confirm ${stats.inferred?"":"disabled"} title="Turn owners inferred from a team or role into explicit, audited assignments">Confirm ${stats.inferred} inferred owners</button></div>`;
 const tb=rows.length?`<table class="ownx-t"><thead><tr><th></th><th>Gap</th><th>Thing</th><th>Accountable now</th><th>Suggested</th><th>Actions</th></tr></thead><tbody>${rows.map(r=>{const p=propose(r),f0=top(r)||"accepted";
  return `<tr><td><input type="checkbox" data-ownx-sel="${E(r.key)}" ${OS.sel[r.key]?"checked":""} aria-label="Select ${E(r.label)}"></td>
  <td>${r.accepted?'<span class="pill mute">Accepted</span>':`<span class="pill ${SEVP[f0]}">${E(GAPL[f0][0])}</span>`}${r.act.length>1?`<small class="muted"> +${r.act.length-1}</small>`:""}${r.expired?'<small class="ownx-exp"> expired</small>':""}</td>
  <td class="ownx-tl"><button type="button" class="ownx-link" data-ownx-open="${E(r.key)}">${E(r.label)}</button><small class="muted">${E(OW.kinds[r.kind].n)}${r.sub?" · "+E(r.sub):""}</small></td>
  <td>${r.ownerName?E(r.ownerName)+(r.state==="inferred"?' <small class="muted">via '+E(r.inferred)+"</small>":""):r.roleText?`<span class="muted">${E(r.roleText)}</span>`:'<span class="muted">nobody</span>'}${r.backupName?`<small class="muted">Backup ${E(r.backupName)}</small>`:""}</td>
  <td>${p?`<b>${E(p.owner)}</b>${p.backup?`<small class="muted">Backup ${E(p.backup)}</small>`:""}<small class="muted">${E(p.why)}</small>`:'<span class="muted">none found</span>'}</td>
  <td><div class="ownx-act"><button type="button" class="btn" data-ownx-asg="${E(r.key)}">Assign</button><button type="button" class="btn quiet" data-ownx-ask="${E(r.key)}">${OS.ask[r.key]?"Asked":"Ask the owner"}</button><button type="button" class="btn quiet" data-ownx-asg="${E(r.key)}" data-ownx-accfirst="1">Accept risk</button></div></td></tr>`}).join("")}</tbody></table>`:empty("No gaps match","Change the filters, or celebrate: everything here has a named human owner and backup.");
 return head+bulk+tb+(list.length>rows.length?`<div class="row" style="justify-content:center;margin-top:10px"><button type="button" class="btn" data-ownx-more>Show 60 more (${list.length-rows.length} left)</button></div>`:"")}

function heat(){
 const st=OW.stats(),kinds=Object.keys(OW.kinds);const doms=Object.keys(st.byDom).map(id=>({id,d:OW.domain(id),v:st.byDom[id]})).sort((a,b)=>b.v.gap-a.v.gap||b.v.total-a.v.total);
 const th=kinds.map(k=>`<th title="${E(OW.kinds[k].n)}">${E(OW.kinds[k].pl)}</th>`).join("");
 const cell=(id,k,c)=>{if(!c||!c.total)return'<td class="ownx-h0">·</td>';const p=Math.round(100*c.gap/c.total);return `<td><button type="button" class="ownx-hc${c.gap?"":" ok"}" style="--p:${Math.min(100,p*1.15)}" data-ownx-cell="${E(id)}|${k}" title="${c.gap} of ${c.total} ${E(OW.kinds[k].pl.toLowerCase())} have a gap">${c.gap?c.gap:"0"}<small>/${c.total}</small></button></td>`};
 const rows=doms.map(x=>`<tr><th scope="row"><button type="button" class="ownx-link" data-ownx-cell="${E(x.id)}|">${E(x.d?x.d.label:"No domain")}</button><small class="muted">${x.d&&x.d.o?E(x.d.o)+(x.d.b?" · backup "+E(x.d.b):" · no backup"):x.d?"no owner":"outside every domain"}</small></th>${kinds.map(k=>cell(x.id,k,x.v.k[k])).join("")}<td class="num ownx-ht">${x.v.gap}<small>/${x.v.total}</small></td></tr>`).join("");
 return `<div class="ownx-legend">${legend([["No gap","--good-f"],["Some gaps","--warn-f"],["Mostly gaps","--bad-f"]])}<span class="muted small">Each cell shows records with a gap out of all records. Click a cell to filter the gap list.</span></div>
 <div class="tscroll"><table class="ownx-heat"><thead><tr><th>Accountability domain</th>${th}<th>All</th></tr></thead><tbody>${rows}</tbody></table></div>`}

function people(){
 const L=OW.records(),by={};
 L.forEach(r=>{if(r.ownerName){(by[r.ownerName]=by[r.ownerName]||{o:0,b:0,g:0,u:{}}).o++;if(r.gap)by[r.ownerName].g++;by[r.ownerName].u[r.kind]=(by[r.ownerName].u[r.kind]||0)+1}if(r.backupName){(by[r.backupName]=by[r.backupName]||{o:0,b:0,g:0,u:{}}).b++}});
 const rows=Object.keys(by).map(n=>({n,v:by[n]})).sort((a,b)=>b.v.o-a.v.o).slice(0,14);const mx=Math.max(1,...rows.map(r=>r.v.o));
 return `<p class="muted small">Concentration is a risk too: a person who owns very many things cannot be accountable for them all. Bars show things owned (including those inferred from a team) and things they back up.</p>
 <div class="tscroll"><table class="ownx-t"><thead><tr><th>Person</th><th>Owns</th><th>Backs up</th><th>With a gap</th><th>Mostly</th></tr></thead><tbody>${rows.map(r=>{const top=Object.keys(r.v.u).sort((a,b)=>r.v.u[b]-r.v.u[a]).slice(0,3).map(k=>r.v.u[k]+" "+OW.kinds[k].pl.toLowerCase()).join(", ");return `<tr><td>${pchip(r.n,{role:1})}</td><td><span class="ownx-bar"><i style="width:${Math.round(100*r.v.o/mx)}%"></i></span> <b class="num">${r.v.o}</b>${r.v.o>=60?' <span class="pill warn">heavy</span>':""}</td><td class="num">${r.v.b}</td><td class="num">${r.v.g}</td><td class="small muted">${E(top)}</td></tr>`}).join("")}</tbody></table></div>`}

function activity(){
 const ex=Object.keys(OS.exc).map(k=>({k,e:OS.exc[k],r:OW.records().find(x=>x.key===k)}));
 const exh=ex.length?`<div class="tscroll"><table class="ownx-t"><thead><tr><th>Accepted gap</th><th>Why</th><th>Accepted by</th><th>Expires</th><th></th></tr></thead><tbody>${ex.map(x=>{const d=Math.round((new Date(x.e.exp)-new Date("2026-10-10"))/864e5);return `<tr><td class="ownx-tl"><button type="button" class="ownx-link" data-ownx-asg="${E(x.k)}">${E(x.r?x.r.label:x.k)}</button><small class="muted">${E(x.r?OW.kinds[x.r.kind].n:"")}</small></td><td class="small">${E(x.e.reason)}</td><td>${E(x.e.by)}</td><td><span class="pill ${d<0?"bad":d<14?"warn":"mute"}">${d<0?"Expired":"in "+d+" days"}</span><small class="muted"> ${E(x.e.exp)}</small></td><td><button type="button" class="btn quiet" data-ownx-rmexc="${E(x.k)}">Withdraw</button></td></tr>`}).join("")}</tbody></table></div>`:'<p class="muted small">No gap has been accepted.</p>';
 const lg=OS.log.length?`<ul class="ownx-log">${OS.log.slice(0,25).map(l=>`<li><b>${E(l.at)}</b> ${l.type==="assign"?"<b>Assigned</b> "+E(l.owner)+(l.backup?" with backup "+E(l.backup):"")+" to ":l.type==="accept"?"<b>Accepted a gap</b> on ":"<b>Asked</b> "+E(l.owner)+" to confirm ownership of "}${E(l.label)} <span class="muted small">by ${E(l.by)}</span></li>`).join("")}</ul>`:'<p class="muted small">No ownership changes yet. Assign an owner from the Gaps tab and it shows here and in the audit log.</p>';
 return `<div class="grid g2" style="gap:16px;align-items:start">${card("Accepted gaps","Each has a reason and an expiry of at most 90 days",exh)}${card("Recent changes","Also written to the audit log",lg)}</div>`}

function trend(st){
 const wk=["7 wk ago","6","5","4","3","2","last wk","Now"];const mx=Math.max(...st.tr),mn=Math.min(...st.tr)-4;
 return `<div class="ownx-trend" role="img" aria-label="Ownership coverage over eight weeks, from ${st.tr[0]} to ${st.tr[7]} percent">${st.tr.map((v,i)=>`<div class="ownx-tb" title="${wk[i]}: ${v}%"><i style="height:${Math.max(6,Math.round(100*(v-mn)/Math.max(1,mx-mn)))}%"></i><small>${i===7?"Now":i===0?"7w":""}</small></div>`).join("")}</div><p class="small muted">Coverage ${st.tr[0]}% to ${st.tr[7]}% in eight weeks. Earlier points are rebuilt from the audit trail of assignments.</p>`}

function overview(st){
 const L=OW.records();const worst=OW.gaps().slice(0,5);const find=OS.q?OW.find(OS.q):null;
 const finder=`<div class="ownx-find"><label class="ownx-l wide">Topic, module or contract name<span class="row"><input class="ownx-in" type="text" data-ownx-fq value="${E(OS.q||"")}" placeholder="budget, vendor risk, security, forecast, a module or a contract" autocomplete="off"><button type="button" class="btn primary" data-ownx-findgo>Find the owner</button></span></label>${find?(find.domains.length||find.objects.length?OW.card(find,OS.q):`<p class="small"><span class="pill bad">No owner found</span> Nothing in the registry matches that. That is itself a gap.</p>`):""}</div>`;
 const legendRows=[["Owned","good","A named person is accountable and a different person is the backup."],["Inferred","mute","The record names a team or role and we resolved it to one person. Confirm it to make it explicit."],["Role only","warn","A team or role with no person we can resolve."],["Agent only","warn","An AI agent, contractor or provider. A human sponsor must be accountable."],["No owner / Owner left","bad","Nobody, or the named person has left."],["No backup","info","An owner, but nobody to step in."]];
 return `<div class="grid g2" style="gap:16px;align-items:start">${card("Who do I go to?","Search by topic or by name",finder)}${card("Coverage trend","Weekly, higher is better",trend(st))}</div>
 <div class="grid g2" style="gap:16px;align-items:start;margin-top:16px">${card("Fix these first","Ranked by how bad the gap is and how much depends on it",worst.length?`<ul class="ownx-top">${worst.map(r=>`<li><span class="pill ${SEVP[top(r)]}">${E(GAPL[top(r)][0])}</span><button type="button" class="ownx-link" data-ownx-asg="${E(r.key)}">${E(r.label)}</button><small class="muted">${E(OW.kinds[r.kind].n)}</small></li>`).join("")}</ul><button type="button" class="btn primary" data-ownx-tab="1">See all ${st.gapRecs} gaps</button>`:'<p class="muted small">No gaps.</p>')}
 ${card("How we decide","One rule everywhere: a named human owner and a different named backup",`<ul class="ownx-leg">${legendRows.map(l=>`<li><span class="pill ${l[1]}">${l[0]}</span><span class="small">${l[2]}</span></li>`).join("")}</ul><p class="small muted">Backups can be inherited from the accountability domain or the owner's team. Owners come from the process, the data entity, the metric or the contract; where those name a team, the org chart resolves it.</p>`)}</div>
 ${procCard("own_gaps")}`}

REG("own_gaps","Ownership and gaps","platform","M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c0-4.4 3.6-7 8-7s8 2.6 8 7M18 4v4M16 6h4",()=>{
 OW.refreshMetrics();const st=OW.stats();
 const story=`<b data-role="metric">${st.cov}%</b> of the <b>${st.total}</b> things that matter have a named human owner and backup. <b data-role="metric">${st.unowned}</b> have no owner, <b data-role="metric">${st.roleonly}</b> name only a role or team, <b data-role="metric">${st.agentonly}</b> rest on an AI agent, contractor or provider, and <b data-role="metric">${st.nobackup}</b> have no backup. ${st.inferred} owners are inferred from a team and still need confirming.`;
 const kp=kpiRow([["Coverage",st.cov+"%",st.covered+" of "+st.total+" fully owned",{cls:st.cov>=95?"good":st.cov>=80?"warn":"bad",keep:true,metric:"m_own_cov"}],["No owner",st.unowned,"none, or the owner left",{cls:st.unowned?"bad":"good",keep:true}],["No backup",st.nobackup,"owner but nobody to step in",{cls:st.nobackup?"warn":"good",keep:true,metric:"m_own_nobk"}],["Role only",st.roleonly,"a team, no person",{cls:st.roleonly?"warn":"good",keep:true}],["Agent only",st.agentonly,"needs a human sponsor",{cls:st.agentonly?"warn":"good",keep:true,metric:"m_own_agent"}]]);
 return `<div class="screen">${hero("Ownership and gaps","Every thing has a person who answers for it",story,`<div class="row">${fchip("m_own_cov")}${fchip("m_own_unowned")}<button class="btn primary" data-ownx-next>Assign the worst gap</button></div>`)}${lensNote()}${kp}
 ${views("ownx_v",["Overview","Gaps","Heat map","People","Exceptions and activity"],[overview(st),card("Ranked gap list","Assign, ask the likely owner, or accept the risk with an expiry",gapTable()),card("Where the gaps are","Accountability domain by kind of thing",heat()),card("Who carries the load","Owners, backups and concentration",people()),activity()])}</div>`});
tryv(()=>NAVX.add("own_gaps",{group:"plat",label:"Ownership and gaps",hint:"Who is accountable, and where nobody is",kw:"owner owners backup accountable accountability gaps unowned no owner no backup raci responsible who owns who do i go to deputy"}),0);
tryv(()=>PROC.reg("own_gaps",{title:"Ownership governance",std:["cobit","itil5"],steps:[{n:"Detect gaps",d:"Scan every registry record.",who:"robot",owner:"Ownership service",sla:"Hourly",in:"Registry records",out:"Ranked gaps"},{n:"Propose owner and backup",d:"Suggest candidates from the org chart.",who:"agent",owner:"Ownership Agent",sla:"Minutes",in:"Ranked gaps",out:"Candidates"},{n:"Assign or accept",d:"A person assigns, asks, or accepts the risk with an expiry.",who:"human",owner:"Jordan Lee",sla:"7 days",in:"Candidates",out:"Assignment"},{n:"Gate",d:"No new module registers without a named human owner and backup.",who:"gate",owner:"Platform team",sla:"Immediate",in:"Manifest",out:"Decision"}]}),0);

/* ---------- automatic injection of badges ---------- */
let busy=false,timer=0;
function inject(){
 if(busy)return;busy=true;
 try{
  const sc=S.screen;
  /* screen header */
  const eb=document.querySelector("#view .hero .eyebrow");
  /* ownership records are the Meridian sample: under another tenant there is no owner record yet, so no badge (R18, CL-56) */
  if(eb&&sc&&sc!=="home"&&sc!=="own_gaps"&&(!window.DATA||DATA.tenant()==="core")){const r=OW.get("module",sc);const want=r?(r.gap||r.accepted?"g:"+r.key+top2(r):"ok:"+r.ownerName):"";
   let cur=eb.querySelector(":scope>[data-ownx-slot]");if(cur&&cur.dataset.ownxSlot!==want){cur.remove();cur=null}
   if(r&&!cur){const h=(r.gap||r.accepted)?badge("module",sc):(r.ownerName?badge("module",sc,{always:true}):"");if(h){const s=document.createElement("span");s.className="ownx-slot";s.dataset.ownxSlot=want;s.innerHTML=h;eb.appendChild(s)}}}
  /* metric cards */
  document.querySelectorAll("#view .mcard[id^=m-] .mc-h .eyebrow").forEach(e=>{const id=e.closest(".mcard").id.slice(2);const r=OW.get("metric",id);const has=e.querySelector("[data-ownx-slot]");const g=r&&(r.gap||r.accepted);
   if(!g){if(has)has.remove();return}const want="g:"+r.key+top2(r);if(has&&has.dataset.ownxSlot===want)return;if(has)has.remove();const s=document.createElement("span");s.className="ownx-slot";s.dataset.ownxSlot=want;s.innerHTML=badge("metric",id);e.appendChild(s)});
  /* process page in a drawer or screen */
  document.querySelectorAll("[data-pl-page]").forEach(pg=>{const id=pg.dataset.plPage;const e=pg.querySelector(".eyebrow");if(!e)return;const r=OW.get("process",id);const has=pg.querySelector("[data-ownx-slot]");if(!r||!(r.gap||r.accepted)){if(has)has.remove();return}const want="g:"+r.key+top2(r);if(has&&has.dataset.ownxSlot===want)return;if(has)has.remove();const s=document.createElement("span");s.className="ownx-slot";s.dataset.ownxSlot=want;s.innerHTML=badge("process",id);e.parentNode.appendChild(s)});
  /* entity headers in the data atlas */
  document.querySelectorAll(".at-eh[data-at-ent]").forEach(b=>{const id=b.dataset.atEnt;const r=OW.get("entity",id);const has=b.querySelector(".ownx-dot");const g=r&&r.gap&&!r.accepted;
   if(!g){if(has)has.remove();return}const t=GAPL[top(r)][0];if(has&&has.title===t)return;if(has)has.remove();const i=document.createElement("i");i.className="ownx-dot "+GAPL[top(r)][1];i.title=t+" on "+r.label;i.setAttribute("aria-label",t);b.appendChild(i)});
  /* navigation: a dot on screens with a gap, a count on each group */
  const gapScr=new Set(OW.records().filter(r=>r.kind==="module"&&r.gap&&!r.accepted).map(r=>r.id));
  document.querySelectorAll(".navit[data-nx-it]").forEach(it=>{const id=it.dataset.nxIt;const b=it.querySelector(".navi");if(!b)return;const has=b.querySelector(".ownx-ndot");
   if(!gapScr.has(id)){if(has)has.remove();return}if(has)return;const r=OW.get("module",id),i=document.createElement("i");i.className="ownx-ndot "+GAPL[top(r)][1];i.title=GAPL[top(r)][0]+": "+r.label;const t=b.querySelector(".nx-t");(t||b).insertAdjacentElement(t?"afterend":"beforeend",i)});
  document.querySelectorAll("details.navgd[data-ng]").forEach(d=>{const sm=d.querySelector("summary");if(!sm)return;let n=0;d.querySelectorAll(".navit[data-nx-it]").forEach(it=>{if(gapScr.has(it.dataset.nxIt))n++});const has=sm.querySelector(".ownx-gn");
   if(!n){if(has)has.remove();return}if(has&&has.textContent===String(n))return;if(has)has.remove();const e=document.createElement("em");e.className="ownx-gn";e.textContent=n;e.title=n+" screen"+(n===1?"":"s")+" in this group without a named owner or backup";sm.appendChild(e)});
  paintPal();
 }catch(e){console.error("ownx inject",e)}
 busy=false}
const top2=r=>(r.act||[]).join("")+(r.accepted?"a":"");
function sched(){if(timer)return;timer=setTimeout(()=>{timer=0;inject()},60)}
OW.inject=inject;OW.onChange=()=>{sched()};
const _ca=W.coreAfter;W.coreAfter=function(){const r=_ca&&_ca.apply(this,arguments);sched();return r};
try{new MutationObserver(sched).observe(document.body,{childList:true,subtree:true})}catch(e){}

/* ---------- search palette: who to ask ---------- */
function paintPal(){
 const ul=document.querySelector("#nxPalList");if(!ul)return;const inp=document.querySelector("#nxPalIn");const q=inp?inp.value.trim():"";
 let el=ul.querySelector(":scope>.ownx-pal");
 if(q.length<3||(document.querySelector("#nxPal")||{}).hidden){if(el)el.remove();return}
 const res=OW.find(q);const ds=res.domains.filter(d=>d.owner).slice(0,3);const gaps=res.domains.filter(d=>!d.owner).slice(0,1);
 if(!ds.length&&!gaps.length){if(el)el.remove();return}
 const sig=q+"|"+ds.map(d=>d.id+d.owner+d.backup).join(",")+gaps.length;
 if(el&&el.dataset.sig===sig&&ul.firstElementChild===el)return;
 if(el)el.remove();
 el=document.createElement("li");el.className="ownx-pal";el.setAttribute("role","presentation");el.dataset.sig=sig;
 el.innerHTML=`<div class="eyebrow">Who to ask</div><div class="ownx-pchips">${ds.map(d=>`<div class="ownx-pc"><button type="button" class="ownx-pchip" data-ownx-person="${E(d.owner)}">${avatar(d.owner,{size:30})}<span><b>${E(d.owner)}</b><small>Owns ${E(d.label)}${d.backup?" · backup "+E(d.backup):" · no backup named"}</small></span></button>${d.backup?`<button type="button" class="ownx-pchip alt" data-ownx-person="${E(d.backup)}" title="Backup">${avatar(d.backup,{size:24})}<span><b>${E(d.backup)}</b><small>Backup</small></span></button>`:`<span class="pill warn">No backup</span>`}</div>`).join("")}${gaps.map(d=>`<div class="ownx-pc"><span class="pill bad">No owner</span><span class="small">${E(d.label)} has nobody accountable.</span><button type="button" class="btn quiet" data-ownx-gaps>Fix it</button></div>`).join("")}</div>`;
 ul.insertBefore(el,ul.firstChild)}

/* ---------- formula chip popover: owner row ---------- */
document.addEventListener("toggle",e=>{const p=e.target;if(!p||!p.matches||!p.matches("div.pop[popover]")||e.newState!=="open")return;
 const ch=p.previousElementSibling;if(!ch||!ch.matches(".fchip[data-k]"))return;if(p.querySelector("[data-ownx-prow]"))return;
 const r=OW.get("metric",ch.dataset.k);if(!r)return;const row=document.createElement("div");row.innerHTML=`<div class="eyebrow" style="margin-top:12px">Who answers for this metric</div>`+ownRow(r);const act=p.querySelector(".row:last-child");p.insertBefore(row,act||null)},true);

/* ---------- events ---------- */
const K=e=>e.target.closest&&e.target.closest.bind(e.target);
document.addEventListener("click",e=>{
 const c=K(e);if(!c)return;let t;
 if((t=c("[data-ownx-asg]"))){e.preventDefault();e.stopPropagation();openAssign(t.dataset.ownxAsg);if(t.dataset.ownxAccfirst)setTimeout(()=>{const a=document.getElementById("ownxAcc");if(a)a.hidden=false},30);return}
 if((t=c("[data-ownx-open]"))){const k=t.dataset.ownxOpen,i=k.indexOf(":");OW.open(k.slice(0,i),k.slice(i+1));return}
 if((t=c("[data-ownx-pick]"))){const [w,n]=t.dataset.ownxPick.split("|");const s=document.getElementById(w==="owner"?"ownxOwner":"ownxBackup");if(s)s.value=n;return}
 if((t=c("[data-ownx-accopen]"))){const a=document.getElementById("ownxAcc");if(a)a.hidden=!a.hidden;return}
 if((t=c("[data-ownx-save]"))){const key=t.dataset.ownxSave,i=key.indexOf(":");const o=document.getElementById("ownxOwner").value,b=document.getElementById("ownxBackup").value,n=document.getElementById("ownxNote").value;
  const r=OW.assign(key.slice(0,i),key.slice(i+1),o,b,n);const er=document.getElementById("ownxErr");
  if(!r.ok){er.hidden=false;er.textContent=r.err;return}toast("Saved. "+o+(b?" owns it, with "+b+" as backup.":" owns it. Add a backup to close the last gap."),b?"good":"warn");closeDrawer();render();return}
 if((t=c("[data-ownx-ask]"))){e.stopPropagation();const key=t.dataset.ownxAsk,i=key.indexOf(":");const r=OW.ask(key.slice(0,i),key.slice(i+1));toast("Asked "+r.to+" to confirm ownership. They get an approval-style request in their inbox.","good");closeDrawer();render();return}
 if((t=c("[data-ownx-acc]"))){const key=t.dataset.ownxAcc,i=key.indexOf(":");const r=OW.accept(key.slice(0,i),key.slice(i+1),document.getElementById("ownxWhy").value,document.getElementById("ownxDays").value);
  if(!r.ok){const er=document.getElementById("ownxErr");er.hidden=false;er.textContent=r.err;return}toast("Accepted until "+r.exp+". A Technical debt item tracks it.","warn");closeDrawer();render();return}
 if((t=c("[data-ownx-rmexc]"))){delete OS.exc[t.dataset.ownxRmexc];OW.invalidate();OW.refreshMetrics();tryv(()=>audit("Ownership: withdrew an accepted gap",t.dataset.ownxRmexc));toast("Withdrawn. The gap is open again.");render();return}
 if((t=c("[data-ownx-filter]"))){const [k,v]=t.dataset.ownxFilter.split("|");OS.f[k]=v;OS.shown=60;render();return}
 if((t=c("[data-ownx-cell]"))){const [d,k]=t.dataset.ownxCell.split("|");OS.f.dom=d;OS.f.kind=k||"";OS.f.st="";OS.shown=60;S.v=S.v||{};S.v.ownx_v=1;render();return}
 if((t=c("[data-ownx-more]"))){OS.shown=(OS.shown||60)+60;render();return}
 if((t=c("[data-ownx-tab]"))){S.v=S.v||{};S.v.ownx_v=1;render();return}
 if((t=c("[data-ownx-findgo]"))){const i=document.querySelector("[data-ownx-fq]");OS.q=i?i.value.trim():"";render();return}
 if((t=c("[data-ownx-next]"))){const g=OW.gaps()[0];if(g)openAssign(g.key);else toast("No gaps. Everything has an owner and a backup.","good");return}
 if((t=c("[data-ownx-person]"))){tryv(()=>NAVX.palette.close());person360(t.dataset.ownxPerson);return}
 if((t=c("[data-ownx-gaps]"))){tryv(()=>NAVX.palette.close());go("own_gaps");return}
 if((t=c("[data-ownx-selall]"))){const list=OW.gaps({kind:OS.f.kind,dom:OS.f.dom,st:OS.f.st==="accepted"?"":OS.f.st,q:OS.f.q}).slice(0,OS.shown||60);list.forEach(r=>{if(t.checked)OS.sel[r.key]=1;else delete OS.sel[r.key]});render();return}
 if((t=c("[data-ownx-bulk]"))){const keys=Object.keys(OS.sel);let n=0,bad=0;keys.forEach(k=>{const r=OW.records().find(x=>x.key===k);if(!r)return;const p=propose(r);if(!p){bad++;return}const res=OW.assign(r.kind,r.id,p.owner,p.backup,"Bulk assignment of the suggested owner");if(res.ok)n++;else bad++;delete OS.sel[k]});
  toast("Assigned suggested owners to "+n+(bad?"; "+bad+" had no valid suggestion":"")+".",n?"good":"warn");render();return}
 if((t=c("[data-ownx-confirm]"))){let n=0;OW.records().filter(r=>r.state==="inferred"&&r.ownerName).forEach(r=>{if(OS.asg[r.key])return;OS.asg[r.key]={owner:r.ownerName,backup:r.backupName||"",by:tryv(()=>PERSONAS[S.persona].n,"You"),at:"2026-10-10",note:"Confirmed inferred owner"};n++});
  if(n){OS.log.unshift({id:"A"+(OS.seq++),at:"2026-10-10",kind:"module",rid:"*",label:n+" inferred owners",owner:"(each as inferred)",backup:"",by:tryv(()=>PERSONAS[S.persona].n,"You"),note:"Bulk confirm",type:"assign"});tryv(()=>audit("Ownership: confirmed inferred owners",n+" records made explicit"))}
  OW.invalidate();OW.refreshMetrics();toast("Confirmed "+n+" inferred owners as explicit assignments.","good");render();return}
});
document.addEventListener("change",e=>{const t=e.target;if(!t.matches)return;
 if(t.matches("[data-ownx-fsel]")){OS.f[t.dataset.ownxFsel]=t.value;OS.shown=60;render();return}
 if(t.matches("[data-ownx-q]")){OS.f.q=t.value.trim();OS.shown=60;render();return}
 if(t.matches("[data-ownx-sel]")){if(t.checked)OS.sel[t.dataset.ownxSel]=1;else delete OS.sel[t.dataset.ownxSel];render();return}});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.matches&&e.target.matches("[data-ownx-fq]")){e.preventDefault();OS.q=e.target.value.trim();render()}});
document.addEventListener("input",e=>{if(e.target&&e.target.id==="nxPalIn")sched()},true);

/* ---------- Person 360 tab: what they own ---------- */
tryv(()=>P360_TABS.push({label:"Owns",fn:rec=>{const n=rec.name;const mine=OW.records().filter(r=>r.ownerName===n),bk=OW.records().filter(r=>r.backupName===n);
 if(!mine.length&&!bk.length)return `<div class="row"><span class="pill mute" data-role="metric">Owner of 0</span><span class="pill mute" data-role="metric">Backup for 0</span></div>`;
 const by={};mine.forEach(r=>(by[r.kind]=by[r.kind]||[]).push(r));
 return `<p class="small">Owns <b>${mine.length}</b> things and backs up <b>${bk.length}</b>. ${mine.filter(r=>r.gap).length} have a gap.</p>`+Object.keys(by).map(k=>`<div class="eyebrow" style="margin-top:10px">${E(OW.kinds[k].pl)} (${by[k].length})</div><div class="row" style="gap:6px;flex-wrap:wrap">${by[k].slice(0,8).map(r=>`<button type="button" class="chip" data-ownx-open="${E(r.key)}">${E(r.label)}</button>`).join("")}${by[k].length>8?`<span class="muted small">and ${by[k].length-8} more</span>`:""}</div>`).join("")}}),0);
setTimeout(sched,900);
})();
