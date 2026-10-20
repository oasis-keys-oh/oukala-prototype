/* ---------- field lineage ---------- */
function srcFor(e,m){
 const t=e.id;
 if(m.auth==="platform")return{n:"Created in Oukala",d:"People and agents create it in "+(e.writers.map(appN).join(", ")||e.owner)+"."};
 let n="External system";
 if(t==="person"||t==="time_off")n="Entra ID and the HR system";
 else if(t==="invoice")n="ERP, the finance ledger";
 else if(t.indexOf("cmdb_ci")===0||t==="asset")n="Discovery tools";
 else if(["alert_event","metric_series","log_pattern","synthetic_check"].indexOf(t)>=0)n="Monitoring tools";
 else if(t==="pull_request")n="Source control";
 else if(t==="project_task"||t==="wbs_line")n="Project planning tool";
 else if(t==="user_story"||t==="feature")n="Agile tool";
 return{n:m.auth==="shared"?n+" and Oukala":n,d:m.why+"."};
}
const AUTHP={platform:"good",external:"info",shared:"warn"};
function linHTML(){
 const m=model(),L=Z.lin;let e=PLAT.ent(L.ent)||m.es[0];
 const f=e.fields.find(x=>x.k===L.f)||e.fields[0];if(!f)return`<p class="muted">This entity has no fields.</p>`;
 const meta=PLAT.fieldMeta(e.id,f),src=srcFor(e,meta),nown=PLAT.nonOwnerWrites().filter(x=>x.ent===e.id).map(x=>x.app);
 const tg=(f.type==="ref"||f.type==="person")?m.raw.filter(x=>x.type==="ref"&&x.from===e.id&&x.field.split(", ").indexOf(f.label||f.k)>=0).map(x=>x.to):[];
 const apps=appsOf(e.id),mets=metricsFor(apps),procs=procsTouching(e.id);
 const chip=(a,c)=>`<button type="button" class="chip plk-chip ${c||""}" data-plk-appgo="${E(a)}">${E(appN(a))}</button>`;
 const col=(h,body,cls)=>`<section class="plk-lc ${cls||""}"><div class="eyebrow">${h}</div>${body}</section>`;
 const arrow=`<span class="plk-ar" aria-hidden="true"></span>`;
 const opts=DORD.map(d=>`<optgroup label="${E(DOM[d].n)}">${m.es.filter(x=>x.domain===d).map(x=>`<option value="${E(x.id)}" ${x.id===e.id?"selected":""}>${E(x.label)}</option>`).join("")}</optgroup>`).join("");
 return `<div class="plk-brow plk-linsel"><label class="small muted">Entity <select class="fin" data-plk-lin="ent" aria-label="Entity">${opts}</select></label><label class="small muted">Field <select class="fin" data-plk-lin="f" aria-label="Field">${e.fields.map(x=>`<option value="${E(x.k)}" ${x.k===f.k?"selected":""}>${E(x.label||x.k)}</option>`).join("")}</select></label><button class="btn quiet" data-plk-appgo="${E(e.id)}" data-ent="1">Show the entity on the graph</button></div>
 <div class="plk-lin">
 ${col("1. Source",`<h4>${E(src.n)}</h4><p class="small">${E(src.d)}</p><p class="small muted">${meta.auth==="platform"?"No external system to mirror.":meta.auth==="external"?"Mirrored read-only. Edits here are blocked.":"Both sides edit. Differences open a reconciliation item."}</p>`)}${arrow}
 ${col("2. Rules in the registry",`<h4>${E(f.label||f.k)} <span class="muted small">(${E(f.k)})</span></h4><p class="small"><span class="pill ${AUTHP[meta.auth]}">${E(meta.auth)} authority</span> ${clsPill(meta.cls)} <span class="pill mute">${E(f.type||"string")}</span></p><dl class="plk-kv"><dt>Direction</dt><dd>${meta.dir==="in"?"In from the source":meta.dir==="out"?"Out of Oukala":"Both ways"}</dd><dt>Freshness</dt><dd>${E(meta.fresh)}</dd><dt>If they disagree</dt><dd>${E(meta.conflict)}</dd><dt>Quality rule</dt><dd>${E(meta.rule)}</dd><dt>Trust score</dt><dd>${Math.round(meta.trust*100)}%</dd>${tg.length?`<dt>Points to</dt><dd>${tg.map(x=>`<button type="button" class="chip plk-chip" data-plk-entgo="${E(x)}">${E(entN(x))}</button>`).join(" ")}</dd>`:""}</dl>`,"focus")}${arrow}
 ${col("3. Written by",e.writers.length?`<div class="plk-chips">${e.writers.map(a=>chip(a,nown.indexOf(a)>=0?"warn":"")).join("")}</div>${nown.length?`<p class="small muted">Highlighted apps write it but ${E(e.owner)} owns it. See the registry.</p>`:`<p class="small muted">All writers are the owner module.</p>`}`:`<p class="small muted">No app writes this entity yet.</p>`)}${arrow}
 ${col("4. Read by",e.readers.length?`<div class="plk-chips">${e.readers.map(a=>chip(a)).join("")}</div>`:`<p class="small muted">Nothing reads it yet, a candidate for retirement.</p>`)}${arrow}
 ${col("5. Used in",`<p class="small"><b>${mets.length}</b> metrics and <b>${procs.length}</b> processes.</p>${lrHTML({id:"plk_lm",groups:[{key:"m",label:"Metrics on screens that use it",rows:mets.map(k=>({id:k,t:METRICS[k].n,sub:METRICS[k].f,tag:"Metric",st:"info",go:()=>go("metrics")}))},{key:"p",label:"Processes",rows:procs.map(p=>({id:p,t:pName(p),sub:FAM[FIDX[pFam(p)]][1],tag:pEnts(p).w.indexOf(e.id)>=0?"Writes":"Reads",st:"mute",go:()=>pickP(p,true)}))}],limit:5,search:false,empty:"Nothing uses it yet."})}`)}
 </div>
 <p class="small" data-role="story">${E(f.label||f.k)} on ${E(e.label)} starts in <b>${E(src.n)}</b>, passes through the registry rules above, is written by ${plural(e.writers.length,"app")} and read by ${plural(e.readers.length,"app")}, and shows up in ${plural(mets.length,"metric")}. If it changes, ${plural(apps.length,"app")} and ${plural(procs.length,"process","processes")} feel it.</p>`;
}
/* ---------- entity by app matrix ---------- */
function matrixD(){
 const m=model(),doms=mpGet("plk_mdom"),non=new Set(PLAT.nonOwnerWrites().map(x=>x.ent+"|"+x.app)),multi=new Set(PLAT.multiWriters().map(x=>x.ent));
 const apps=PLAT.APPS.slice().sort((a,b)=>a.mod<b.mod?-1:a.mod>b.mod?1:a.n<b.n?-1:1);
 let rows=m.es.filter(e=>doms.indexOf(e.domain)>=0);
 if(Z.mx.issues)rows=rows.filter(e=>multi.has(e.id)||e.writers.some(a=>non.has(e.id+"|"+a)));
 const body=rows.map(e=>`<tr class="${multi.has(e.id)?"mw":""}"><th scope="row"><span class="plk-dot" style="--c:var(--plk-c${DCOL[e.domain]})"></span>${E(e.label)}${multi.has(e.id)?` <span class="pill warn">${e.writers.length} writers</span>`:""}</th>${apps.map(a=>{const w=e.writers.indexOf(a.id)>=0,r=e.readers.indexOf(a.id)>=0;if(!w&&!r)return`<td class="z"></td>`;const no=non.has(e.id+"|"+a.id);const t=w&&r?"RW":w?"W":"R";return`<td class="c ${w&&r?"b":w?"w":"r"}${no?" no":""}"><button type="button" data-plk-cell="${E(e.id)}|${E(a.id)}" aria-label="${E(a.n+" "+(w&&r?"reads and writes ":w?"writes ":"reads ")+e.label+(no?", not the owner":""))}">${t}</button></td>`}).join("")}</tr>`).join("");
 return `<div class="plk-brow">${mpHTML({id:"plk_mdom",label:"Domains",all:"All domains",opts:domOpts()})}${togBtn("m:issues","Only entities with problems",Z.mx.issues,"Show entities with two or more writers or a write by a non-owner")}</div>
 <div class="plk-lg">${legend([["Writes","--s3"],["Reads","--p1"],["Reads and writes","--u3"]])}<div class="legend" role="note"><span><i class="plk-no-sw"></i>Write by an app that is not the owner</span><span><i class="plk-mw-sw"></i>Row with two or more writers</span></div></div>
 <div class="plk-mxwrap"><table class="plk-mx plk-mxd"><thead><tr><th scope="col">Entity (${rows.length})</th>${apps.map(a=>`<th scope="col" class="v" title="${E(a.n+" ("+a.mod+")")}"><span>${E(trunc(a.n,24))}</span></th>`).join("")}</tr></thead><tbody>${body||`<tr><td>No entities match.</td></tr>`}</tbody></table></div>`;
}
function cellDrawer(ent,app){
 const e=PLAT.ent(ent),a=PLAT.app(app);if(!e||!a)return;
 const w=e.writers.indexOf(app)>=0,r=e.readers.indexOf(app)>=0,no=PLAT.nonOwnerWrites().some(x=>x.ent===ent&&x.app===app);
 const others=e.writers.filter(x=>x!==app);
 openDrawer(`<div class="eyebrow">${E(DOM[e.domain].n)}</div><h2 style="margin:4px 0">${E(a.n)} and ${E(e.label)}</h2>
 <p class="story" data-role="story">${E(a.n)} ${w&&r?"reads and writes":w?"writes":"reads"} ${E(e.label)}. ${no?`The owner is ${E(e.owner)}, so this write is outside its module and counts as debt.`:w?"It is the owner module, so the write is expected.":"Reading is always allowed and is how apps share data without copying it."} ${others.length?`Other writers: ${others.map(appN).join(", ")}.`:""}</p>
 <div class="row"><button class="btn primary" data-plk-entgo="${E(ent)}">Show on the graph</button><button class="btn quiet" data-plk-go="plat_reg">Open the registry</button><button class="btn quiet" data-plk-trace="${E(ent)}">Trace a field</button></div>
 ${no?`<div class="story small" style="margin-top:12px"><b>Suggested fix:</b> let ${E(e.owner)} own the write, and have ${E(a.n)} call it through the platform API.</div>`:""}`);
}
/* ---------- gaps: planned entities as ghost nodes ---------- */
function layoutG(){
 const m=model(),ghosts=PLAT.PLANNED.map(p=>m.gset.get(p[0])).sort((a,b)=>DORD.indexOf(a.domain)-DORD.indexOf(b.domain)||(a.label<b.label?-1:1));
 const ents=new Set(),apps=new Set();ghosts.forEach(g=>{m.conn[g.id].ents.forEach(x=>ents.add(x));m.conn[g.id].apps.forEach(x=>apps.add(x))});
 const ea=[...ents].map(x=>m.eset.get(x)).sort((a,b)=>DORD.indexOf(a.domain)-DORD.indexOf(b.domain)||(a.label<b.label?-1:1)),aa=[...apps].map(x=>PLAT.app(x)).sort((a,b)=>a.n<b.n?-1:1);
 const W=176,H=24,STEP=31,nodes=new Map();
 const put=(arr,x,mk)=>arr.forEach((o,i)=>{const n=mk(o);n.x=x;n.y=44+i*STEP;n.w=W;n.h=H;nodes.set(n.id,n)});
 put(ea,0,e=>({id:e.id,kind:"ent",label:e.label,e,v:ovVar(e)}));
 put(ghosts,380,g=>({id:nidG(g.id),kind:"gh",label:g.label,g}));
 put(aa,760,a=>({id:nidA(a.id),kind:"app",label:a.n,app:a}));
 const rows=Math.max(ea.length,ghosts.length,aa.length);
 return{nodes,ea,ghosts,aa,vb:[-20,-10,W+760+40,44+rows*STEP+20],heads:[[0,"Existing entities that would connect"],[380,"Planned entities"],[760,"Apps that would use them"]]};
}
function pickG(id){const G=Z.g;G.sel=G.sel===id?null:id;drawG()}
function drawG(){const h=document.querySelector("[data-plk-ghost]");if(!h){render();return}h.innerHTML=gHost()}
function gGraph(){
 const m=model(),L=layoutG(),sel=Z.g.sel;const lit=new Set();
 const edges=[];
 L.ghosts.forEach(g=>{const c=m.conn[g.id];c.ents.forEach(x=>edges.push({a:x,b:nidG(g.id),type:"pl"}));c.apps.forEach(a=>edges.push({a:nidG(g.id),b:nidA(a),type:"pl"}))});
 if(sel){lit.add(sel);edges.forEach(e=>{if(e.a===sel)lit.add(e.b);if(e.b===sel)lit.add(e.a)})}
 const ep=edges.filter(e=>L.nodes.has(e.a)&&L.nodes.has(e.b)).map(e=>{const c=curve(L.nodes.get(e.a),L.nodes.get(e.b),.6),on=sel&&(e.a===sel||e.b===sel);return`<path class="plk-e pl${on?" lit":""}" d="${c.d}" marker-end="url(#plk-ar-g-pl)"/>`}).join("");
 const st={sel,lit:sel?lit:null,hit:null};
 const ns=[...L.nodes.values()].map(n=>nodeSvg(n,st)).join("");
 const hd=L.heads.map(h=>`<text class="bh" x="${h[0]}" y="14">${E(h[1])}</text>`).join("");
 return svgFrame("g",vbFor("g",L.vb),`${hd}<g class="plk-edges">${ep}</g><g class="plk-nodes">${ns}</g>`,"Planned entities and what would connect to them",sel?"has-sel":"");
}
function gPanel(){
 const G=Z.g,m=model();
 if(!G.sel||!/^g:/.test(G.sel)){
  if(G.sel&&!/^g:/.test(G.sel)){const id=G.sel.replace(/^app:/,"");const gs=PLAT.PLANNED.filter(p=>{const c=m.conn[p[0]];return c.ents.indexOf(id)>=0||c.apps.indexOf(id)>=0}).map(p=>p[0]);
   return `<div class="plk-ph"><div class="eyebrow">${/^app:/.test(G.sel)?"App":"Existing entity"}</div><h3>${E(/^app:/.test(G.sel)?appN(id):entN(id))}</h3><p class="small muted">It would connect to ${gs.length} planned ${gs.length===1?"entity":"entities"}.</p></div>${lrHTML({id:"plk_gn",groups:[{key:"g",label:"Planned entities it connects to",rows:gs.map(x=>({id:x,t:entN(x),sub:m.gset.get(x).why,tag:"Planned",st:"warn",go:()=>pickG(nidG(x))}))}],limit:8,search:false})}`}
  const top=PLAT.PLANNED.map(p=>({p,n:m.conn[p[0]].ents.length+m.conn[p[0]].apps.length})).sort((a,b)=>b.n-a.n).slice(0,8);
  return `<div class="plk-ph"><div class="eyebrow">Nothing selected</div><h3>Pick a planned entity</h3><p class="small muted">Dashed nodes do not exist yet. Select one to see what would connect to it, why it is needed and who would own it.</p></div>${lrHTML({id:"plk_gtop",groups:[{key:"t",label:"Planned entities that would connect to the most",rows:top.map(t=>({id:t.p[0],t:t.p[2],sub:t.p[4],tag:t.n+" links",st:"warn",go:()=>pickG(nidG(t.p[0]))}))}],limit:8,search:false})}`;
 }
 const g=m.gset.get(G.sel.slice(2)),c=m.conn[g.id];
 return `<div class="plk-ph"><div class="eyebrow">Planned entity, ${E(DOM[g.domain].n)}</div><h3>${E(g.label)}</h3><p class="small muted"><code>${E(g.id)}</code>. Proposed steward ${E(g.steward)}. First users: ${E(g.use)}</p></div><div class="story small" data-role="story">${E(g.why)}</div>
 ${c.all?`<p class="small"><b>Every app would use it</b>, so it is not drawn as individual links.</p>`:""}${c.why.length?`<ul class="small plk-ul">${c.why.map(w=>`<li>${w}</li>`).join("")}</ul>`:""}
 ${lrHTML({id:"plk_gp2",groups:[{key:"e",label:"Existing entities that would connect",rows:c.ents.map(x=>({id:x,t:entN(x),sub:"",tag:"Entity",st:"info",go:()=>pickG(x)}))},{key:"a",label:"Apps that would use it",rows:c.apps.map(a=>({id:a,t:appN(a),sub:PLAT.app(a).mod,tag:"App",st:"mute",go:()=>pickG(nidA(a))}))}],limit:8,empty:"Nothing connects yet."})}
 <div class="row" style="margin-top:10px"><button class="btn primary" data-plk-go="plat_reg">Propose it in the registry</button></div>`;
}
function gHost(){return `<div class="plk-split"><div class="plk-main"><div class="plk-bar"><div class="plk-brow"><span class="small muted">Select a node to light its links.</span>${zoomBar("g")}</div></div><div class="plk-lg">${legend([["Existing entity (color is its domain)","--plk-c0"],["Planned entity (dashed)","--faint"],["App or screen","--muted"]])}</div><div class="plk-canvas tall" data-plk-canvas="g">${gGraph()}<p class="plk-hint small muted">Drag to pan. Hold Ctrl or Cmd and scroll to zoom.</p></div></div><aside class="plk-panel card glass" aria-live="polite" data-plk-panel>${gPanel()}</aside></div>`}
function gapTable(){
 const m=model();
 return btHTML({id:"plk_gap",cols:[
  {k:"label",label:"Planned entity",fmt:r=>`<b>${E(r.label)}</b><div class="muted small">${E(r.id)}</div>`,val:r=>r.label,wrap:true,w:200},
  {k:"domain",label:"Domain",fmt:r=>E(DOM[r.domain].n),val:r=>DOM[r.domain].n},
  {k:"ne",label:"Entities it touches",fmt:r=>r.ne,val:r=>r.ne},
  {k:"na",label:"Apps that would use it",fmt:r=>r.all?"All apps":r.na,val:r=>r.all?99:r.na},
  {k:"why",label:"Why",fmt:r=>E(r.why),val:r=>r.why,wrap:true,w:340}
 ],rows:()=>PLAT.PLANNED.map(p=>{const c=m.conn[p[0]];return{id:p[0],label:p[2],domain:p[1],ne:c.ents.length,na:c.apps.length,all:c.all,why:p[4]}}),key:"id",h:380,rowH:56,facets:["domain"],exportName:"planned-connections",open:id=>{Z.g.sel=nidG(id);drawG()}});
}
/* ---------- screens ---------- */
function dmapScreen(){
 const s=syncMetrics(),m=model(),refs=m.raw.filter(e=>e.type==="ref"&&!e.ghost).length,gref=m.raw.filter(e=>e.type==="ref"&&e.ghost).length;
 const hero_=hero("Data connections","How every data element connects to every other",`<b data-role="metric">${s.entities}</b> entities, <b data-role="metric">${refs}</b> field references between them and <b data-role="metric">${PLAT.APPS.length}</b> apps that read or write them, drawn as one graph. Select any node to see who writes it, who reads it and what breaks if a field changes. <b data-role="metric">${s.isolated.length}</b> entities are not linked to anything and <b data-role="metric">${PLAT.PLANNED.length}</b> planned entities would add ${gref} more links.`,
  `<div class="row">${fchip("m_plk_single")}${fchip("m_plk_conn")}${fchip("m_plk_reuse")}${stdChip("dmbok","Entity relationships and data lineage are the core of DMBOK data architecture.")}${stdChip("togaf","The graph is the TOGAF data architecture view, with apps as the application layer.")}</div>`);
 const k0=kpiRow([["Entities",s.entities,"CI classes counted once"],["Field references",refs,"entity points to entity"],["App links",m.raw.filter(e=>e.type!=="ref").length,"reads and writes"],["Single writer",METRICS.m_plk_single.cur+"%","of written entities",{metric:"m_plk_single"}],["Isolated entities",s.isolated.length,"no link at all",{cls:s.isolated.length?"bad":"good",keep:true}]]);
 const ctl=`<div class="plk-brow plk-ctl"><label class="plk-search"><span class="small muted">Search</span><input type="search" class="txtin" data-plk-q="d" value="${E(Z.d.q)}" placeholder="Entity, app or field name" aria-label="Search the graph"></label>${mpHTML({id:"plk_dom",label:"Domains",all:"All domains",opts:domOpts(),onChange:()=>{Z.d.vb=null}})}</div>`;
 const pane0=`${k0}${ctl}<div data-plk-dhost>${dHost()}</div>`;
 const s2=PLAT.stats(),k1=kpiRow([["Fields in the catalog",s2.nf.toLocaleString(),"each with a source rule"],["External authority",s2.extAuth,"mirrored, never edited here"],["Shared authority",s2.shared,"both sides edit"],["Metrics tied to apps",Object.keys(METRICS).filter(k=>metricsFor(PLAT.APPS.map(a=>a.id)).indexOf(k)>=0).length,"read these entities"]]);
 const pane1=`${k1}<div data-plk-linhost>${linHTML()}</div>`;
 const non=PLAT.nonOwnerWrites(),mw=PLAT.multiWriters();
 const k2=kpiRow([["Entities with two or more writers",mw.length,"one owner is the goal",{cls:mw.length?"warn":"good",keep:true}],["Writes by a non-owner",non.length,"counted as debt",{cls:non.length?"warn":"good",keep:true}],["Readers in total",PLAT.stats().readers,"app to entity reads"],["Writers in total",PLAT.stats().writers,"app to entity writes"]]);
 const pane2=`${k2}<div data-plk-mxhost>${matrixD()}</div>`;
 const gh=PLAT.PLANNED.length,ge=new Set(),ga=new Set();PLAT.PLANNED.forEach(p=>{m.conn[p[0]].ents.forEach(x=>ge.add(x));m.conn[p[0]].apps.forEach(x=>ga.add(x))});
 const k3=kpiRow([["Planned entities",gh,"missing from the model",{cls:"warn",keep:true}],["Existing entities that connect",ge.size,"would gain a link"],["Apps that would use them",ga.size,"named by their first users"],["Duplicate fixes open",PLAT.FIXES.filter(f=>!S.plat.applied[f.id]).length,"merge into planned entities"]]);
 const pane3=`${k3}<div data-plk-ghost>${gHost()}</div><div style="margin-top:14px">${gapTable()}</div>`;
 return `<div class="screen plk-screen">${hero_}${lensNote()}${views("plk_d",["Connections","Field lineage","Matrix","Gaps"],[pane0,pane1,pane2,pane3])}${procCard("plat_dmap")}</div>`;
}
function pmapScreen(){
 const s=syncMetrics(),g=pgraph(),fl=FAM.filter(f=>g.ids.some(p=>pFam(p)===f[0])).length;
 const fd=findingsHTML();
 const hero_=hero("Process connections","No process runs alone",`<b data-role="metric">${g.ids.length}</b> processes in <b data-role="metric">${fl}</b> families, joined by <b data-role="metric">${g.ho.length}</b> documented handoffs and <b data-role="metric">${g.dep.length}</b> shared-data dependencies. <b data-role="metric">${s.noShare.length}</b> processes keep their data outside the registry and <b data-role="metric">${s.noHand.length}</b> have no documented handoff.`,
  `<div class="row">${fchip("m_plk_hand")}${fchip("m_plk_reuse")}${fchip("m_plk_single")}${stdChip("bpmn","Handoffs follow BPMN: a message or event between pools, with the data it carries.")}${stdChip("togaf","The map is the TOGAF business architecture view tied to the data architecture.")}</div>`);
 const mode={};g.ho.forEach(h=>mode[h.mode]=(mode[h.mode]||0)+1);
 const k0=kpiRow([["Processes",g.ids.length,fl+" families"],["Handoffs",g.ho.length,(mode.event||0)+" event, "+(mode.batch||0)+" batch, "+(mode.human||0)+" human"],["With a handoff",METRICS.m_plk_hand.cur+"%","of processes",{metric:"m_plk_hand"}],["Data reuse",METRICS.m_plk_reuse.cur+"%","entities used by 2+ processes",{metric:"m_plk_reuse"}],["Hub entities",g.hubs.size,[...g.hubs].slice(0,3).map(entN).join(", ")||"none"]]);
 const ctl=`<div class="plk-brow plk-ctl"><label class="plk-search"><span class="small muted">Search</span><input type="search" class="txtin" data-plk-q="p" value="${E(Z.p.q||"")}" placeholder="Process or family name" aria-label="Search processes"></label>${mpHTML({id:"plk_fam",label:"Families",all:"All families",opts:FAM.filter(f=>g.ids.some(p=>pFam(p)===f[0])).map(f=>({v:f[0],l:f[1]})),onChange:()=>{Z.p.vb=null}})}</div>`;
 const pane0=`${k0}${ctl}<div data-plk-phost>${pHost()}</div>`;
 const famPairs=[];FAM.forEach(a=>FAM.forEach(b=>{if(a[0]<b[0]){const n=famShared(a[0],b[0]).length;if(n)famPairs.push(n)}}));
 const k1=kpiRow([["Family pairs sharing data",famPairs.length,"of "+(fl*(fl-1)/2)+" possible"],["Strongest link",famPairs.length?Math.max.apply(null,famPairs):0,"shared entities"],["Data dependencies",g.dep.length,"one writes, one reads"],["Hub entities set aside",g.hubs.size,Z.p.hub?"counted":"not counted"]]);
 const pane1=`${k1}<div data-plk-pmxhost>${matrixP()}</div>`;
 const k2=kpiRow([["Critical chains",CHAINS.length,"end to end"],["Handoffs on chains",CHAINS.reduce((a,c)=>a+chainView(c).hops.filter(Boolean).length,0),"all documented"],["Longest chain",Math.max.apply(null,CHAINS.map(c=>chainView(c).steps.length)),"processes"],["Widest blast radius",Math.max.apply(null,g.ids.map(p=>downstream(p).procs.length)),"processes downstream"]]);
 const pane2=`${k2}${pathsHTML()}`;
 const k3=kpiRow([["Findings",fd.count,"across 6 checks",{cls:fd.count?"warn":"good",keep:true}],["No shared data",s.noShare.length,"processes"],["No handoff",s.noHand.length,"processes"],["Two writers",s.multiP.length,"entities written by 2+ processes"],["Isolated entities",s.isolated.length,"no link at all"]]);
 const pane3=`${k3}<p class="muted small">Each finding opens the process screen or the registry. Fixing the first two groups raises the handoff metric; fixing the third and fourth raises the single-writer metric.</p>${lrHTML({id:"plk_find",groups:fd.groups,limit:6,empty:"No findings."})}`;
 return `<div class="screen plk-screen">${hero_}${lensNote()}${views("plk_p",["Map","Dependency matrix","Critical paths","Orphans and findings"],[pane0,pane1,pane2,pane3])}${procCard("plat_pmap")}</div>`;
}
const IC1="M5 6a2 2 0 1 0 0 .01M19 6a2 2 0 1 0 0 .01M12 19a2 2 0 1 0 0 .01M7 7l4 10M17 7l-4 10M7 6h10";
REG("plat_dmap","Data connections","platform",IC1,dmapScreen);
REG("plat_pmap","Process connections","platform","M3 6h6v4H3zM15 6h6v4h-6zM9 14h6v4H9zM6 10v2h12v-2M12 12v2",pmapScreen);
PROC.reg("plat_dmap",{title:"How the data connection map stays true",std:["dmbok","togaf"],steps:[
 {n:"Fields declare references",d:"A field of type reference names the entity it points to, so every join is known.",who:"human",owner:"Entity steward",out:"Reference list"},
 {n:"Apps declare reads and writes",d:"Each app lists what it reads and writes; the registry compares writers to the owner module.",who:"auto",owner:"Platform",out:"App links"},
 {n:"The graph is built",d:"References, reads and writes become edges. Nothing is drawn by hand.",who:"auto",owner:"Platform",out:"Graph"},
 {n:"Gaps are proposed",d:"The Registry Agent spots isolated or duplicate entities and drafts a fix.",who:"agent",owner:"Registry Agent",out:"Findings"},
 {n:"Data council decides",d:"The council accepts, reshapes or rejects each proposed link or entity.",who:"gate",owner:"Data council",sla:"3 days",out:"Registry change"}]});
PROC.reg("plat_pmap",{title:"How the process connection map stays true",std:["bpmn","togaf"],steps:[
 {n:"Owners define processes",d:"Each screen registers its steps and who does them.",who:"human",owner:"Process owners",out:"Process definitions"},
 {n:"Handoffs are declared",d:"A handoff names the data it carries, the trigger and whether it is an event, a batch or a person.",who:"human",owner:"Process governance lead",out:"Handoff table"},
 {n:"Data sharing is derived",d:"Two processes that touch the same entity are linked automatically through the registry.",who:"auto",owner:"Platform",out:"Dependencies"},
 {n:"Findings are raised",d:"Processes with no shared data, no handoff or a second writer are listed for review.",who:"agent",owner:"Process Agent",out:"Findings"},
 {n:"Governance reviews",d:"The process governance lead accepts or reshapes each finding.",who:"gate",owner:"Process governance lead",sla:"Monthly",out:"Updated map"}]});
