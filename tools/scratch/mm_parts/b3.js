/* ---------- inspector ---------- */
const WHO={human:"Person",agent:"AI agent",auto:"Automatic",gate:"Approval gate"};
const FDESC={live:"Updates within seconds","near-live":"Updates within a minute or two",hourly:"Refreshed about every hour",daily:"Refreshed once a day",unknown:"No registered field yet"};
const MDESC={event:"Sent the moment the trigger happens.",batch:"Sent on a schedule, in a group.",human:"Sent when a person acts or decides."};
const AUTH={platform:"Oukala is authoritative",external:"External system wins",shared:"Shared, newest wins"};
const modChip=id=>`<button type="button" class="mm-mc" data-mm-sel="${id}" style="--c:${bandCol(MB[id].bi)}"><i></i>${E(MB[id].sn)}</button>`;
const mdOf=m=>BANDS[m.bi][1];
function flowRow(f,other){
 return `<button type="button" class="mm-fr" data-mm-flow="${f.id}"><b>${E(f.data)}</b><span class="mm-fm">${modePillH(f.mode)}<span>${E(f.trig)}</span></span><span class="small muted">${E(f.why)}</span><span class="mm-fe">${refChips(f)}</span></button>`;
}
function grouped(m,dir){
 const list=dir==="in"?m.inn:m.out,g={};list.forEach(f=>{const o=dir==="in"?f.from:f.to;(g[o]=g[o]||[]).push(f)});
 const ids=Object.keys(g).sort((a,b)=>MB[a].bi-MB[b].bi||MB[a].sn.localeCompare(MB[b].sn));
 if(!ids.length)return empty(dir==="in"?"Nothing flows in":"Nothing flows out","Add a flow in the curation table so this module is not an island.");
 return `<p class="small muted mm-sum">${dir==="in"?`${E(m.sn)} pulls ${list.length} kinds of data from ${ids.length} modules.`:`${E(m.sn)} pushes ${list.length} kinds of data to ${ids.length} modules.`} Select a row for its data contract.</p>`+ids.map(id=>`<section class="mm-g"><button type="button" class="mm-gh" data-mm-sel="${id}" style="--c:${bandCol(MB[id].bi)}"><i></i><b>${dir==="in"?"From ":"To "}${E(MB[id].name)}</b><span class="small muted">${E(mdOf(MB[id]))}</span><span class="pill mute">${g[id].length}</span></button>${g[id].map(f=>flowRow(f)).join("")}</section>`).join("");
}
function procTab(m){
 const st=stepsOf(m.id);
 if(!st)return empty("No process defined yet","This module has no steps in the process registry. Process owners add them in the Workflow designer.")+`<div class="row"><button class="btn" data-nav="flw_design">Open Workflow designer</button></div>`;
 return `<p class="small muted mm-sum">${st.length} steps. Each says who acts, how fast, and how it decides.</p><ol class="mm-steps">${st.map((s,i)=>`<li><span class="mm-sn">${i+1}</span><div><b>${E(s.n)}</b><div class="row">${pill(WHO[s.who||"human"],"info")}${window.PROC&&PROC.modeTag?PROC.modeTag(s):""}${s.sla?`<span class="pill mute">${E(s.sla)}</span>`:""}</div><p class="small muted">${E(s.d||"")}</p></div></li>`).join("")}</ol>`;
}
function dataTab(m){
 const chips=(arr,kind)=>arr.length?arr.map(id=>{const e=PLAT.ent(id);return `<button type="button" class="chip mm-ec" data-mm-ent="${id}" title="Open ${E(e?e.label:id)} in the data model">${E(e?e.label:(PLN[id]?PLN[id].label:id))}${kind==="plan"?" (planned)":""}</button>`}).join(""):`<span class="muted small">None</span>`;
 const plan=[...new Set(m.out.concat(m.inn).flatMap(f=>f.refs.filter(r=>r.kind==="plan").map(r=>r.id)))];
 return `<div class="mm-ds"><div class="eyebrow">Writes (declared)</div><div class="row">${chips(m.w)}</div><div class="eyebrow">Reads (declared)</div><div class="row">${chips(m.r)}</div>
 <div class="eyebrow">Carried in its outgoing flows</div><div class="row">${chips([...m.eo].filter(i=>PLAT.ent(i)))}</div><div class="eyebrow">Carried in its incoming flows</div><div class="row">${chips([...m.ei].filter(i=>PLAT.ent(i)))}</div>
 ${plan.length?`<div class="eyebrow">Needed but not registered yet</div><div class="row">${plan.map(i=>`<span class="pill warn">${E(PLN[i].label)}</span>`).join("")}</div>`:""}
 ${m.nonOwn.length?`<div class="eyebrow">Writes an entity it does not own</div><div class="row">${m.nonOwn.map(x=>`<span class="pill bad">${E(x.ent)}, owned by ${E(x.owner)}</span>`).join("")}</div>`:""}
 <p class="small muted">Select an entity to open it in the data model.</p></div>`;
}
function blastTab(m){
 const lv=blastOf(m.id,3),tot=lv.reduce((a,l)=>a+l.length,0);
 return `<p class="small muted mm-sum">${tot?`If ${E(m.sn)} stops, <b>${lv[0].length}</b> modules lose data at once, <b>${lv[1].length}</b> more within two steps and <b>${lv[2].length}</b> within three.`:`Nothing downstream pulls from ${E(m.sn)}.`}</p>
 ${lv.map((l,i)=>`<div class="eyebrow">${i+1} step${i?"s":""} away (${l.length})</div><div class="row">${l.length?l.map(modChip).join(""):'<span class="muted small">None</span>'}</div>`).join("")}
 <div class="row" style="margin-top:12px"><button type="button" class="btn ${MM.blast?"primary":""}" data-mm-blast aria-pressed="${MM.blast}">${MM.blast?"Hide on map":"Show on map"}</button></div>`;
}
function modHTML(m){
 const bl=blastOf(m.id,3).reduce((a,l)=>a+l.length,0);
 const tabs=[["pulls","Pulls from",m.nin],["pushes","Pushes to",m.nout],["proc","Its process",m.steps],["data","Data",m.r.length+m.w.length],["blast","Blast radius",bl]];
 const body=MM.tab==="pushes"?grouped(m,"out"):MM.tab==="proc"?procTab(m):MM.tab==="data"?dataTab(m):MM.tab==="blast"?blastTab(m):grouped(m,"in");
 return `<div class="mm-ih"><div class="row sp"><span class="eyebrow" style="color:${bandCol(m.bi)}">${E(mdOf(m))}</span><button type="button" class="btn quiet" data-mm-close>Close</button></div><h3>${E(m.name)}</h3><p class="small muted">Accountable: ${E(m.own)}</p>
 <div class="row"><button type="button" class="btn primary" data-mm-open="${m.id}">Open screen</button><button type="button" class="btn" data-mm-cmp="${m.id}">Compare with another</button></div></div>
 <div class="mm-tabs" role="tablist">${tabs.map(t=>`<button type="button" role="tab" class="${MM.tab===t[0]?"on":""}" aria-selected="${MM.tab===t[0]}" data-mm-tab="${t[0]}">${t[1]}<small>${t[2]}</small></button>`).join("")}</div><div class="mm-ib" role="tabpanel">${body}</div>`;
}
function refBlock(r,f){
 if(r.kind==="plan")return `<div class="mm-rb plan"><div class="row sp"><b>${E(r.label)}</b><span class="pill warn">Planned, not registered</span></div><p class="small muted">${E(r.why)}</p><p class="small">Proposed steward: ${E(r.steward)}. Until it exists this data has no single contract.</p></div>`;
 return `<div class="mm-rb"><div class="row sp"><b>${E(r.label)} <code>${E(r.id)}</code></b><span class="pill info">Registered</span></div><p class="small muted">Owner module: ${E(r.owner)}. Steward: ${E(r.steward)}. Highest class: ${E(r.cls)}.</p>
 ${r.f.length?r.f.map(x=>`<div class="mm-ff"><b>${E(x.label)}</b><code>${E(x.k)}</code><span class="pill ${x.fresh==="live"||x.fresh==="near-live"?"good":"mute"}">${E(x.fresh)}</span><span class="pill ${x.auth==="external"?"info":x.auth==="shared"?"warn":"good"}">${E(AUTH[x.auth]||x.auth)}</span><span class="pill mute">${E(x.cls)}</span></div>`).join(""):`<p class="small muted">The whole entity travels; no single field is named.</p>`}
 <button type="button" class="btn quiet" data-mm-ent="${r.id}">Open in data model</button></div>`;
}
function flowHTML(){
 const f=FL.find(x=>x.id===MM.flow);if(!f){MM.flow=null;return inspHTML()}
 const A=MB[f.from],B=MB[f.to],sib=flowsBetween(f.from,f.to);
 return `<div class="mm-ih"><div class="row sp"><span class="eyebrow">Data contract</span><button type="button" class="btn quiet" data-mm-back>Back</button></div><h3>${E(f.data)}</h3>
 <div class="mm-chain">${modChip(f.from)}<span aria-hidden="true">&rarr;</span>${modChip(f.to)}</div>
 ${sib.length>1?`<div class="row">${sib.map((x,i)=>`<button type="button" class="chip ${x.id===f.id?"on":""}" data-mm-flow="${x.id}">Flow ${i+1} of ${sib.length}</button>`).join("")}</div>`:""}</div>
 <div class="mm-ib"><dl class="kv"><dt>Trigger</dt><dd>${E(f.trig)}</dd><dt>Mode</dt><dd>${modePillH(f.mode)} ${E(MDESC[f.mode])}</dd><dt>Purpose</dt><dd>${E(f.why)}</dd><dt>Freshness</dt><dd><span class="pill ${f.fresh==="live"||f.fresh==="near-live"?"good":"mute"}">${E(f.fresh)}</span> ${E(FDESC[f.fresh]||"")}</dd>
 <dt>Sending end</dt><dd>${E(A.name)}, accountable ${E(A.own)}</dd><dt>Receiving end</dt><dd>${E(B.name)}, accountable ${E(B.own)}</dd>
 <dt>Contract</dt><dd>${f.status==="registered"?pill(f.partial?"Registered, part still planned":"Registered","good"):f.status==="planned"?pill("Planned entity only","warn"):pill("No entity yet","bad")}</dd></dl>
 ${f.refs.length?f.refs.map(r=>refBlock(r,f)).join(""):`<div class="mm-rb plan"><p class="small">No registry entity carries this data. It moves as free text or a message, so nobody owns its shape.</p></div>`}
 <div class="row" style="margin-top:12px"><button type="button" class="btn" data-mm-showflow="${f.id}">Show on map</button></div></div>`;
}
function pairHTML(){
 const p=MM.pair;if(!p.a)return introHTML();const A=MB[p.a];
 if(!p.b)return `<div class="mm-ih"><div class="row sp"><span class="eyebrow">Compare</span><button type="button" class="btn quiet" data-mm-close>Close</button></div><h3>${E(A.name)} and ...</h3><p class="small muted">Pick the second module in the Compare menu above the map. You will see every direct and two-step path with the data carried.</p></div>`;
 const B=MB[p.b],r=between(p.a,p.b),nd=r.direct.length+r.rev.length,list=MM.pairAll?r.two:r.two.slice(0,12);
 const path2=q=>{const a=q.dir==="ab"?A:B,b=q.dir==="ab"?B:A,v=MB[q.via];return `<div class="mm-p2"><div class="mm-chain">${modChip(a.id)}<span aria-hidden="true">&rarr;</span>${modChip(q.via)}<span aria-hidden="true">&rarr;</span>${modChip(b.id)}</div><p class="small"><button type="button" class="mm-lk" data-mm-flow="${q.h[0][0].id}">${E(q.h[0][0].data)}</button>${q.h[0].length>1?` (+${q.h[0].length-1})`:""} then <button type="button" class="mm-lk" data-mm-flow="${q.h[1][0].id}">${E(q.h[1][0].data)}</button>${q.h[1].length>1?` (+${q.h[1].length-1})`:""}</p></div>`};
 const sect=(t,fl)=>`<div class="eyebrow">${t} (${fl.length})</div>${fl.length?fl.map(f=>flowRow(f)).join(""):'<p class="small muted">No direct flow in this direction.</p>'}`;
 const story=nd?`<b>${E(A.sn)}</b> and <b>${E(B.sn)}</b> share ${r.direct.length} direct flow${r.direct.length===1?"":"s"} one way and ${r.rev.length} the other, plus ${r.two.length} two-step path${r.two.length===1?"":"s"} through other modules.`:r.two.length?`<b>${E(A.sn)}</b> and <b>${E(B.sn)}</b> do not exchange data directly. They reach each other through ${r.two.length} two-step path${r.two.length===1?"":"s"}.`:r.chain?`<b>${E(A.sn)}</b> and <b>${E(B.sn)}</b> connect only through a longer chain of ${r.chain.length-1} steps.`:`<b>${E(A.sn)}</b> and <b>${E(B.sn)}</b> have no documented path. That is a gap.`;
 return `<div class="mm-ih"><div class="row sp"><span class="eyebrow">Compare</span><button type="button" class="btn quiet" data-mm-close>Clear</button></div><h3>${E(A.sn)} and ${E(B.sn)}</h3><p class="small story" data-role="story">${story}</p>
 <div class="row"><button type="button" class="btn" data-mm-swap>Swap</button><button type="button" class="btn quiet" data-mm-open="${A.id}">Open ${E(A.sn)}</button><button type="button" class="btn quiet" data-mm-open="${B.id}">Open ${E(B.sn)}</button></div></div>
 <div class="mm-ib">${sect(E(A.sn)+" pushes to "+E(B.sn),r.direct)}${sect(E(B.sn)+" pushes to "+E(A.sn),r.rev)}
 <div class="eyebrow">Two-step paths (${r.two.length})</div>${list.length?list.map(path2).join(""):'<p class="small muted">None.</p>'}${r.two.length>12?`<button type="button" class="btn quiet" data-mm-pall>${MM.pairAll?"Show fewer":"Show all "+r.two.length}</button>`:""}
 ${r.chain?`<div class="eyebrow">Shortest chain</div><div class="mm-chain">${r.chain.map(modChip).join('<span aria-hidden="true">&rarr;</span>')}</div>`:""}</div>`;
}
function jnyPanel(){
 const j=JOURNEYS.find(x=>x.id===MM.jny);if(!j)return introHTML();
 return `<div class="mm-ih"><div class="row sp"><span class="eyebrow">Journey</span><button type="button" class="btn quiet" data-mm-close>Clear</button></div><h3>${E(j.t)}</h3><p class="small story">${E(j.story)}</p></div><div class="mm-ib">${j.steps.slice(0,-1).map((s,i)=>{const f=flowsBetween(s,j.steps[i+1])[0];return `<div class="mm-p2"><div class="mm-chain">${modChip(s)}<span aria-hidden="true">&rarr;</span>${modChip(j.steps[i+1])}</div>${f?`<p class="small"><button type="button" class="mm-lk" data-mm-flow="${f.id}">${E(f.data)}</button> ${modePillH(f.mode)}</p>`:`<p class="small"><span class="pill bad">No documented flow</span></p>`}</div>`}).join("")}</div>`;
}
function introHTML(){
 const top=MODS.slice().sort((a,b)=>(b.nin+b.nout)-(a.nin+a.nout)).slice(0,6);
 return `<div class="mm-ih"><h3>Start anywhere</h3><p class="small muted">Select a module to see what it pulls from others and what it pushes to them. Select a line to read its data contract. Use Compare to see how any two modules connect.</p></div><div class="mm-ib"><div class="eyebrow">Most connected modules</div><div class="row">${top.map(m=>`<button type="button" class="mm-mc" data-mm-sel="${m.id}" style="--c:${bandCol(m.bi)}"><i></i>${E(m.sn)} <small>${m.nin+m.nout}</small></button>`).join("")}</div>
 <div class="eyebrow">Try these</div><div class="row"><button type="button" class="chip" data-mm-try="itsm_inc,itsm_chg">How do Incidents and Changes connect?</button><button type="button" class="chip" data-mm-try="itsm_inc,bud_over">How does an incident reach Budgets?</button><button type="button" class="chip" data-mm-try="ppm_proj,inv">Projects to Invoices</button></div></div>`;
}
function inspHTML(){
 if(MM.flow)return flowHTML();
 if(MM.pair)return pairHTML();
 if(MM.jny)return jnyPanel();
 if(MM.sel&&MB[MM.sel])return modHTML(MB[MM.sel]);
 return introHTML();
}
/* ---------- flow list drawer ---------- */
function openFlows(title,fl,sub){
 openDrawer(`<div class="eyebrow">Data flows</div><h2>${E(title)}</h2><p class="muted small">${E(sub||"")}</p><div class="dfullgrid mm-dr">${fl.map(f=>`<div class="mm-dflow"><div class="row sp"><b>${E(f.data)}</b>${modePillH(f.mode)}</div><div class="mm-chain">${modChip(f.from)}<span aria-hidden="true">&rarr;</span>${modChip(f.to)}</div><p class="small">${E(f.why)}</p><p class="small muted">Trigger: ${E(f.trig)}</p><div class="row">${refChips(f)}<button type="button" class="btn quiet" data-mm-showflow="${f.id}">Show on map</button></div></div>`).join("")}</div>`);
}
/* ---------- toolbar ---------- */
function toolbar(){
 const opts=`<option value="">Choose a module</option>`+BANDS.map(b=>`<optgroup label="${E(b[1])}">${MODS.filter(m=>m.band===b[0]).map(m=>`<option value="${m.id}">${E(m.sn)}</option>`).join("")}</optgroup>`).join("");
 return `<div class="mm-bar"><label class="mm-search"><span class="small muted">Find a module</span><input type="search" class="txtin" data-mm-q placeholder="Incidents, budget, CMDB, invoices" aria-label="Find a module" autocomplete="off"><div class="mm-res glass" data-mm-res hidden></div></label>
 <div class="mm-pair"><span class="small muted">Compare</span><select class="mm-sel" data-mm-pa aria-label="First module">${opts}</select><span class="small muted">and</span><select class="mm-sel" data-mm-pb aria-label="Second module">${opts}</select></div>
 <div class="mm-tgs" role="group" aria-label="Layers"><button type="button" class="chip" data-mm-tg="push" aria-pressed="${MM.showPush}">Pushes</button><button type="button" class="chip" data-mm-tg="pull" aria-pressed="${MM.showPull}">Pulls</button><button type="button" class="chip" data-mm-tg="mode" aria-pressed="${MM.byMode}">Color by mode</button></div>
 ${mpHTML({id:"mm_band",label:"Bands",all:"All bands",opts:BANDS.map(b=>({v:b[0],l:b[1]}))})}</div>`;
}
function legendHTML(){
 const ln=(c,t,dash)=>`<span class="mm-lgi"><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="33" y2="5" style="stroke:${c};stroke-width:2.4;${dash?"stroke-dasharray:6 4":""}"/></svg>${t}</span>`;
 return `<div class="mm-lg">${ln("var(--mm-push)","Push: data leaves the selected module",1)}${ln("var(--mm-pull)","Pull: data arrives at it",1)}${ln("var(--mm-event)","Event (with Color by mode)",1)}${ln("var(--mm-batch)","Batch",1)}${ln("var(--mm-human)","Human",1)}${ln("var(--mm-pd)","Direct path between two modules",1)}${ln("var(--mm-p2)","Two-step path",1)}
 <span class="mm-lgi"><svg width="34" height="12" aria-hidden="true"><path d="M30,1 C14,1 14,11 30,11" style="fill:none;stroke:var(--muted);stroke-width:3;opacity:.4"/></svg>Faint arcs: flows between two bands</span>
 <span class="mm-lgi"><i class="mm-npd"></i>No process defined</span><span class="mm-lgi"><i class="mm-sq" style="background:var(--accent)"></i>Selected module</span><span class="mm-lgi">Animated dashes show the direction data moves. Numbers on a line count flows.</span></div>
 ${legend(BANDS.map((b,i)=>[b[1],"--mm-b"+i]))}`;
}
