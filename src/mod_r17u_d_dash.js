/* ===== Round 17, Agent U, part D: Dashboards (screen r17u_dash). Library picker, viewer, builder (add, remove, resize, reorder by drag or keyboard),
   filter bar, drill-down, undo and redo, share to a group, publish through a group approval, schedule delivery (simulated), full screen,
   print view, template gallery. Persistence: S.r17u.dash is tracked by STORE. ===== */
(function(){
"use strict";
const W=window,U=W.R17U,D=U&&U.D;if(!D)return;
const {G,H,usd,nf,fmtD,TODAY}=U;
const X=S.r17u,DS=X.dash,UI=X.ui;
const PERSONAS_=[["exec","Executive"],["fin","Finance approver"],["pm","Project manager"],["ops","Service desk lead"],["portfolio","Portfolio lead"],["admin","Platform admin"]];
const me=()=>U.me();
const pl=(t,c)=>`<span class="pill ${c||"mute"}">${H(t)}</span>`;
const person=n=>n?(typeof pchip==="function"&&U.isHuman(n)?pchip(n):H(n)):`<span class="pill bad">None</span>`;
const pn=k=>(PERSONAS_.find(p=>p[0]===k)||[k,k])[1];
const groups=()=>G(()=>APG.groups(),[]);
/* ---------------- seed ---------------- */
function seed(){if(DS.items)return;
 DS.items=D.TEMPLATES.map(t=>({id:"d_"+t.id,name:t.name,desc:t.desc,owner:t.owner,backup:t.backup,tpl:t.id,tiles:D.build(t),status:t.id==="del"?"draft":"published",ver:1,shared:t.id==="exec"?["Technology leadership"]:t.id==="fin"?["Finance approvers"]:[],created:"2026-09-2"+(1+D.TEMPLATES.indexOf(t))}));
 DS.def={exec:"d_exec",fin:"d_fin",ops:"d_svc"};DS.myDef={};
 const r=U.gapp.propose("dash_publish","Delivery: default for Project manager",{dash:"d_del",persona:"pm"},"Project managers asked for one page with budget use, schedule performance and benefits flagged.","Priya Shah");if(r)r.at="2026-10-05 11:40"}
DS.F=DS.F||{range:"90d",owner:"",pf:""};DS.seq=DS.seq||1;G(seed);DS.myDef=DS.myDef||{};DS.def=DS.def||{};DS.sched=DS.sched||{};DS.runs=DS.runs||[];
const items=()=>DS.items||[];
const byId=id=>items().find(x=>x.id===id);
function cur(){let d=byId(UI.sel);if(d)return d;const p=S.persona;d=byId(DS.myDef[p])||byId(DS.def[p])||items()[0];UI.sel=d&&d.id;return d}
const canEdit=d=>d.owner===me()||d.backup===me()||/admin/.test(S.persona||"");
const pendingFor=d=>U.gapp.items("dash_publish").find(r=>r.status==="pending"&&r.payload.dash===d.id);
const stat=d=>pendingFor(d)?["Waiting on group","warn"]:d.status==="published"?["Published","good"]:["Draft","mute"];
UI.F=null;const F=()=>DS.F;
/* ---------------- undo and redo ---------------- */
const snap=d=>JSON.stringify({name:d.name,desc:d.desc,tiles:d.tiles});
const stk=d=>{const u=UI.undo=UI.undo||{};return u[d.id]=u[d.id]||{undo:[],redo:[]}};
function mutate(d,fn,what){const s=stk(d);s.undo.push(snap(d));if(s.undo.length>60)s.undo.shift();s.redo.length=0;fn(d);U.audit("edited dashboard",d.name+": "+what);render()}
function undo(d){const s=stk(d);if(!s.undo.length)return;s.redo.push(snap(d));const o=JSON.parse(s.undo.pop());Object.assign(d,o);U.audit("undo dashboard edit",d.name);render()}
function redo(d){const s=stk(d);if(!s.redo.length)return;s.undo.push(snap(d));const o=JSON.parse(s.redo.pop());Object.assign(d,o);U.audit("redo dashboard edit",d.name);render()}
const nid=d=>{let n=d.tiles.length+1;while(d.tiles.some(t=>t.id==="t"+n))n++;return "t"+n};
/* ---------------- tile bodies ---------------- */
const empty=(t,s)=>`<p class="muted small r17u-empty">${H(t)}${s?" "+H(s):""}</p>`;
function spark_(v,w,h){if(!v||v.length<2)return "";const mn=Math.min(...v),mx=Math.max(...v),r=mx-mn||1,pts=v.map((x,i)=>(i*(w/(v.length-1))).toFixed(1)+","+(h-3-(x-mn)/r*(h-6)).toFixed(1)).join(" ");return `<svg class="r17u-spk" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline class="r17u-sl" fill="none" points="${pts}"/><circle class="r17u-sd" cx="${w}" cy="${(h-3-(v[v.length-1]-mn)/r*(h-6)).toFixed(1)}" r="3"/></svg>`}
function trendSvg(v,label){if(!v||v.length<2)return empty("Not enough points in this range.");const w=420,h=150,l=36,b=20,t=10,r=10,mn=Math.min(...v),mx=Math.max(...v),pad=(mx-mn||1)*.15,lo=mn-pad,hi=mx+pad,X_=i=>l+(w-l-r)*i/(v.length-1),Y=x=>t+(h-t-b)*(1-(x-lo)/(hi-lo||1));
 return `<svg class="r17u-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${H(label)} trend, ${v.length} points"><line class="r17u-gl" x1="${l}" x2="${w-r}" y1="${Y(mn)}" y2="${Y(mn)}"/><line class="r17u-gl" x1="${l}" x2="${w-r}" y1="${Y(mx)}" y2="${Y(mx)}"/><text class="r17u-ax" x="${l-4}" y="${Y(mx)+4}" text-anchor="end">${nf(mx,mx%1?1:0)}</text><text class="r17u-ax" x="${l-4}" y="${Y(mn)+4}" text-anchor="end">${nf(mn,mn%1?1:0)}</text><polyline class="r17u-l-plan" fill="none" points="${v.map((x,i)=>X_(i).toFixed(1)+","+Y(x).toFixed(1)).join(" ")}"/>${v.map((x,i)=>`<circle class="r17u-l-plan-d" cx="${X_(i).toFixed(1)}" cy="${Y(x).toFixed(1)}" r="3"><title>${nf(x,x%1?1:0)}</title></circle>`).join("")}<text class="r17u-ax" x="${X_(v.length-1)}" y="${Y(v[v.length-1])-8}" text-anchor="end">${nf(v[v.length-1],v[v.length-1]%1?1:0)}</text></svg>`}
function ringSvg(p,txt,tone){p=Math.max(0,Math.min(1,p));const R=44,C=2*Math.PI*R;return `<svg class="r17u-ring" viewBox="0 0 110 110" role="img" aria-label="${H(txt)}"><circle class="r17u-rg" cx="55" cy="55" r="${R}"/><circle class="r17u-rv" data-tone="${tone||""}" cx="55" cy="55" r="${R}" stroke-dasharray="${(C*p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 55 55)"/><text x="55" y="60" text-anchor="middle" class="r17u-rt num">${H(txt)}</text></svg>`}
function body(t,c,print){
 if(c.err)return `<p class="r17u-err">${H(c.err)}</p>`;
 const ty=t.type;
 if(ty==="card"){const dl=c.tgt!=null?`<span class="small muted">target ${nf(c.tgt,c.tgt%1?1:0)}${c.unit&&c.kind==="metric"&&c.unit!=="pts"?" "+H(c.unit):""}</span>`:"";
  return `<div class="r17u-card"><b class="r17u-big num" data-role="metric" data-tone="${c.tone||""}">${H(c.disp)}</b>${dl}${c.series&&c.series.length>1?spark_(c.series,120,34):""}${c.tone?pl(c.tone==="good"?"On target":c.tone==="bad"?"Off target":"Watch",c.tone):""}</div>`}
 if(ty==="ring"){const m=c.kind==="metric"?c.value/(c.max||100):c.tgt!=null?c.value/(c.max||100):c.value/Math.max(1,c.value*1.25);return `<div class="r17u-ringw">${ringSvg(m,c.disp,c.tone)}<div class="small muted">${c.tgt!=null?"target "+nf(c.tgt,c.tgt%1?1:0)+(c.unit&&c.unit!=="pts"&&c.kind==="metric"?" "+H(c.unit):""):"share of scale"}</div></div>`}
 if(ty==="trend"){return trendSvg(c.series,c.title)}
 if(ty==="bar"){if(!c.bars)return empty("Pick a measure and a dimension for this bar chart.");const mx=Math.max(...c.bars.map(b=>Math.abs(b.v)),1);const m=D.M[t.bind.id];
  return `<div class="r17u-bars" role="list" aria-label="${H(c.title)} by ${H(D.DIMN[c.by]||c.by)}">${c.bars.map(b=>`<div class="r17u-br" role="listitem"><span class="r17u-bl" title="${H(b.k)}">${H(b.k)}</span><span class="r17u-bt"><i style="width:${Math.max(2,Math.round(Math.abs(b.v)/mx*100))}%"></i></span>${print?`<span class="num r17u-bv">${H(m.fmt(b.v))}</span>`:`<button type="button" class="r17u-bv num" data-r17u-drill="${t.id}|${H(b.k)}" title="Show the ${b.n} rows behind this bar">${H(m.fmt(b.v))}</button>`}</div>`).join("")}</div><p class="muted small r17u-by">${H(c.title)} by ${H(D.DIMN[c.by]||c.by)}</p>`}
 if(ty==="table"){if(c.kind!=="list")return empty("A table needs a registry source.");return `<div class="r17u-tw2"><table class="r17u-st"><thead><tr>${c.cols.map(x=>`<th>${H(x[1])}</th>`).join("")}</tr></thead><tbody>${c.rows.map(r=>`<tr>${c.cols.map(x=>`<td data-l="${H(x[1])}">${cell(r,x[0])}</td>`).join("")}</tr>`).join("")||`<tr><td colspan="${c.cols.length}">${empty("No rows match the filters.")}</td></tr>`}</tbody></table></div><p class="muted small">${c.rows.length} of ${c.total} rows</p>`}
 if(ty==="list"){if(c.kind!=="list")return empty("A list needs a registry source.");return `<ul class="r17u-ul">${c.rows.map((r,i)=>`<li>${print?`<span><b>${H(r.id)}</b> ${H(r.t)}</span>`:`<button type="button" class="r17u-li" data-r17u-rec="${t.id}|${i}"><b>${H(r.id)}</b><span>${H(r.t)}</span><span class="muted small">${H(r.owner||"")}</span></button>`}</li>`).join("")||`<li>${empty("No rows match the filters.")}</li>`}</ul><p class="muted small">${c.rows.length} of ${c.total} records</p>`}
 return ""}
function cell(r,k){const v=r[k];if(v==null||v==="")return "";if(["appr","fcst","cost","ann","bac","paid","amt","ben"].includes(k))return usd(v);if(k==="spend")return "$"+nf(v,2);if(k==="age")return nf(v,1);if(k==="date")return fmtD(v);if(k==="owner")return H(v);return H(v)}
let _p=0;const pid_=()=>"r17up"+(++_p);
function fchipFor(t,c){if(c.err)return "";if(c.kind==="metric"&&typeof fchip==="function")return fchip(c.id);
 const p=typeof pid==="function"?pid():pid_();
 return `<button type="button" class="chip r17u-fc" popovertarget="${p}" aria-label="Formula and source for ${H(c.title)}">ƒ Formula</button><div popover id="${p}" class="pop glass"><div class="eyebrow">Formula</div><p class="r17u-pp"><b>${H(c.formula)}</b></p><div class="eyebrow">Source</div><p class="r17u-pp">${H(c.src)}. Entity ${H(c.ent)}.</p>${c.notes&&c.notes.length?`<div class="eyebrow">Filters</div><p class="r17u-pp">${H(c.notes.join("; "))}.</p>`:""}</div>`}
function tileHTML(d,t,i,n,edit,print){const c=D.compute(t,F());const title=t.title||c.title||"Tile";
 const ctl=edit?`<div class="r17u-tc" role="toolbar" aria-label="Tile controls: ${H(title)}"><button type="button" class="btn quiet r17u-mini" data-r17u-t="left" data-id="${t.id}" aria-label="Move ${H(title)} earlier" ${i===0?"disabled":""}>↑ Earlier</button><button type="button" class="btn quiet r17u-mini" data-r17u-t="right" data-id="${t.id}" aria-label="Move ${H(title)} later" ${i===n-1?"disabled":""}>↓ Later</button><button type="button" class="btn quiet r17u-mini" data-r17u-t="narrow" data-id="${t.id}" aria-label="Make ${H(title)} narrower" ${t.w<=3?"disabled":""}>Narrower</button><button type="button" class="btn quiet r17u-mini" data-r17u-t="wide" data-id="${t.id}" aria-label="Make ${H(title)} wider" ${t.w>=12?"disabled":""}>Wider</button><button type="button" class="btn quiet r17u-mini" data-r17u-t="short" data-id="${t.id}" aria-label="Make ${H(title)} shorter" ${t.h<=1?"disabled":""}>Shorter</button><button type="button" class="btn quiet r17u-mini" data-r17u-t="tall" data-id="${t.id}" aria-label="Make ${H(title)} taller" ${t.h>=4?"disabled":""}>Taller</button><button type="button" class="btn quiet r17u-mini" data-r17u-t="edit" data-id="${t.id}">Edit</button><button type="button" class="btn quiet r17u-mini" data-r17u-t="remove" data-id="${t.id}" aria-label="Remove ${H(title)}">Remove</button></div>`:"";
 const act=!edit&&!print?`<button type="button" class="btn quiet r17u-mini" data-r17u-drill="${t.id}">Drill down</button>`:"";
 const nt=c.notes&&c.notes.length&&(F().range!=="all"&&F().range||F().owner||F().pf)?`<span class="r17u-nf" title="${H(c.notes.join("; "))}">${H(c.notes[0].replace(/^time range does not apply.*/,"range n/a").replace(/^owner filter.*/,"owner n/a").replace(/^portfolio filter.*/,"portfolio n/a"))}</span>`:"";
 return `<section class="r17u-tile${edit?" r17u-ed":""}" style="--w:${t.w};--h:${t.h}" data-tile="${t.id}" ${edit?`data-dnd-id="${t.id}" tabindex="0" aria-label="${H(title)}, tile ${i+1} of ${n}. Alt plus arrow keys moves it."`:""}>
  <header class="r17u-th">${edit?'<span class="grip" aria-hidden="true"></span>':""}<h4>${H(title)}</h4>${act}</header>${ctl}
  <div class="r17u-tb">${body(t,c,print)}</div>
  <footer class="r17u-tf"><span class="r17u-src" title="${H(c.src||"")}">${H(c.src?c.src.replace(/ \(.*$/,""):"")}</span>${print?`<span class="r17u-ff">${H(c.formula||"")}</span>`:fchipFor(t,c)}<span class="r17u-fr" title="${H(c.fresh||"")}">${H((c.fresh||"").replace(/^Live: computed from the registry when the tile renders.*/,"Live").replace(/^Metric snapshot as of /,"As of "))}</span>${nt}<span class="r17u-ow" title="Owner and backup">${c.owner?(U.isHuman(c.owner)&&typeof pchip==="function"?pchip(c.owner,{size:18}):H(c.owner)):""}${c.backup?`<span class="muted small"> / ${H(c.backup)}</span>`:""}</span></footer></section>`}
function canvas(d,edit,print){if(!d.tiles.length)return `<div class="r17u-blank">${typeof W.empty==="function"?W.empty("This dashboard has no tiles","Choose Edit, then Add tile.") :"<p class='muted'>No tiles. Choose Edit, then Add tile.</p>"}</div>`;
 return `<div class="r17u-canvas" ${edit?'data-dnd="r17u_tiles" data-dnd-scope="r17u_tile"':""} role="group" aria-label="Dashboard tiles">${d.tiles.map((t,i)=>tileHTML(d,t,i,d.tiles.length,edit,print)).join("")}</div>`}
/* ---------------- toolbar, filters, tabs ---------------- */
function pickHTML(d){const src=items().map(x=>({v:x.id,l:x.name,sub:stat(x)[0]+" · owner "+x.owner,grp:x.status==="published"?"Published":"Drafts and mine"}));
 return window.PICKER?PICKER.html({id:"r17u_dpick",label:"Dashboard",noun:"dashboards",source:src,value:d.id,none:"",onPick:v=>{if(v&&byId(v)){UI.sel=v;UI.edit=false;render()}}}):`<select class="fin" data-r17u-sel aria-label="Dashboard">${src.map(s=>`<option value="${s.v}" ${s.v===d.id?"selected":""}>${H(s.l)}</option>`).join("")}</select>`}
function filterBar(){const f=F();
 const sel=(k,lab,opts)=>`<label class="r17u-sel"><span>${lab}</span><select class="fin" data-r17u-f="${k}" aria-label="${lab}">${opts.map(o=>`<option value="${H(o[0])}" ${String(f[k])===String(o[0])?"selected":""}>${H(o[1])}</option>`).join("")}</select></label>`;
 const owners=[["","All owners"]].concat(D.owners().map(o=>[o,o])),pfs=[["","All portfolios"]].concat(D.PFS());
 const act=f.owner||f.pf||f.range!=="90d";
 return `<div class="r17u-fb" role="group" aria-label="Filters">${sel("range","Time range",D.RANGES)}${sel("owner","Owner",owners)}${sel("pf","Portfolio",pfs)}<button type="button" class="btn quiet" data-r17u-freset ${act?"":"disabled"}>Reset filters</button><span class="muted small r17u-fn">Registry tiles recompute from the filtered rows. Company-wide metrics use the range for their trend window only; a tile says when a filter does not apply to its source.</span></div>`}
function toolbar(d){const s=stk(d),e=UI.edit&&canEdit(d),st=stat(d),isMy=DS.myDef[S.persona]===d.id,isDef=DS.def[S.persona]===d.id;
 return `<div class="r17u-tb1"><div class="r17u-pk">${pickHTML(d)}</div><div class="row r17u-tbr">${pl(st[0],st[1])}${isMy?pl("Your default","info"):isDef?pl("Default for "+pn(S.persona),"info"):""}${e?`<button class="btn primary" data-r17u-done>Done editing</button><button class="btn" data-r17u-add>Add tile</button><button class="btn" data-r17u-undo ${s.undo.length?"":"disabled"}>Undo</button><button class="btn" data-r17u-redo ${s.redo.length?"":"disabled"}>Redo</button><button class="btn quiet" data-r17u-rename>Rename</button>`:`<button class="btn primary" data-r17u-edit>${canEdit(d)?"Edit":"Edit a copy"}</button>`}</div></div>
 <div class="row r17u-tbr r17u-tb2"><button class="btn" data-r17u-new>New dashboard</button><button class="btn" data-r17u-dup>Duplicate</button><button class="btn" data-r17u-share>Share to a group${d.shared.length?" ("+d.shared.length+")":""}</button><button class="btn" data-r17u-pub ${pendingFor(d)?"disabled":""}>${pendingFor(d)?"Waiting on the group":"Publish"}</button><button class="btn" data-r17u-mydef ${isMy?"disabled":""}>${isMy?"Your default":"Make my default"}</button><button class="btn" data-r17u-sched>Schedule delivery${DS.sched[d.id]&&DS.sched[d.id].on?" (on)":""}</button><button class="btn" data-r17u-print>Print view</button><button class="btn" data-r17u-full>Full screen</button></div>`}
function viewer(d){const e=UI.edit&&canEdit(d);const nt=d.tiles.length;
 return `<div class="r17u-viewer${UI.full?" r17u-full":""}" id="r17uViewer">${UI.full?`<div class="r17u-fbar"><b>${H(d.name)}</b><span class="muted small">${nt} tiles · filters: ${H((D.RANGES.find(r=>r[0]===F().range)||[0,""])[1])}${F().owner?", owner "+H(F().owner):""}${F().pf?", "+H(F().pf):""}</span><button class="btn primary" data-r17u-full>Exit full screen</button></div>`:""}
 ${UI.full?"":toolbar(d)}
 <p class="story r17u-desc" data-role="story">${H(d.desc||"")} Owner ${H(d.owner)}, backup ${H(d.backup)}. Version ${d.ver}.${e?" Editing: drag a tile by its grip, or focus it and press Alt with the arrow keys; use the buttons to resize.":""}</p>
 ${filterBar()}${canvas(d,e,false)}</div>`}
/* ---------------- gallery, library, approvals ---------------- */
function gallery(){return `<p class="story" data-role="story">Six templates, each built from live registries and the metric dictionary. Numbers below are computed now from this tenant's data; a template becomes a dashboard you own, with a different backup, when you use it.</p><div class="grid g3 r17u-gal">${D.TEMPLATES.map(t=>{const tiles=D.build({tiles:t.tiles});const cards=tiles.filter(x=>x.type==="card").slice(0,3).map(x=>({x,c:D.compute(x,F())}));const lib=items().find(i=>i.tpl===t.id);
  return `<div class="card glass r17u-gc"><div class="eyebrow">${tiles.length} tiles</div><h3>${H(t.name)}</h3><p class="small muted">${H(t.desc)}</p><div class="r17u-gp">${cards.map(k=>`<div><b class="num">${H(k.c.disp||"")}</b><span>${H(k.c.title||"")}</span></div>`).join("")}</div><div class="row"><button class="btn primary" data-r17u-use="${t.id}">Use this template</button>${lib?`<button class="btn" data-r17u-openlib="${lib.id}">Open library copy</button>`:""}</div></div>`}).join("")}</div>`}
function library(){return `<div class="row r17u-bar"><button class="btn primary" data-r17u-new>New dashboard</button><span class="muted small">${items().length} dashboards. Share and default are separate: sharing lets a group see it, a default needs the approver group.</span></div><div class="tablewrap glass r17u-tw"><table class="r17u-st" style="min-width:900px"><thead><tr><th>Dashboard</th><th>Owner and backup</th><th>Status</th><th>Default for</th><th>Shared with</th><th>Tiles</th><th></th></tr></thead><tbody>${items().map(d=>{const st=stat(d),defs=Object.keys(DS.def).filter(k=>DS.def[k]===d.id).map(pn);return `<tr><td data-l="Dashboard"><b>${H(d.name)}</b><span class="sub">${H(d.desc||"").slice(0,90)}</span></td><td data-l="Owner and backup"><div class="r17u-ob">${person(d.owner)}${person(d.backup)}</div></td><td data-l="Status">${pl(st[0],st[1])}<span class="sub">version ${d.ver}</span></td><td data-l="Default for" class="small">${defs.join(", ")||"None"}</td><td data-l="Shared with" class="small">${d.shared.join(", ")||"Not shared"}</td><td data-l="Tiles" class="num">${d.tiles.length}</td><td data-l=""><div class="row"><button class="btn" data-r17u-openlib="${d.id}">Open</button><button class="btn" data-r17u-duplib="${d.id}">Duplicate</button>${d.status==="draft"&&canEdit(d)&&!pendingFor(d)?`<button class="btn quiet" data-r17u-dellib="${d.id}">Delete</button>`:""}</div></td></tr>`}).join("")}</tbody></table></div>`}
function nextRun(s){if(!s||!s.on)return "Off";const t=s.time||"08:00";if(s.freq==="Daily")return "Wed Oct 7, "+t;if(s.freq==="Weekly"){const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],i=days.indexOf(s.day||"Mon"),add=((i-2+7)%7)||7;return fmtD(U.addDays(TODAY,add))+", "+t}return "Nov 1, 2026, "+t}
function apprPane(){const rec=U.gapp.items("dash_publish");const card=r=>{const c=U.gapp.canVote(r),yes=r.votes.filter(v=>v.ok).length;return `<div class="card glass r17u-ac"><div class="row sp"><div><div class="eyebrow">${r.id} · ${H(r.group)} · ${yes} of ${r.need}</div><h3>${H(r.subject)}</h3></div>${pl(r.status[0].toUpperCase()+r.status.slice(1),r.status==="approved"?"good":r.status==="rejected"?"bad":"warn")}</div><p class="small" data-role="story">${H(r.note)}</p><p class="small muted">Proposed by ${H(r.by)} on ${H(r.at)}. Decided by the group, not by one person.${r.votes.length?" "+r.votes.map(v=>H(v.by)+" "+(v.ok?"approved":"rejected")).join(", ")+".":""}</p>${r.status==="pending"?`<div class="row"><button class="btn primary" data-r17u-vote="${r.id}|1">Approve as ${H(me())}</button><button class="btn" data-r17u-vote="${r.id}|0">Reject</button><button class="btn quiet" data-r17u-openlib="${r.payload.dash}">Open the dashboard</button>${c.ok?"":`<span class="muted small">${H(c.why)}</span>`}</div>`:""}</div>`};
 const sc=items().filter(d=>DS.sched[d.id]);
 return `<h3 class="r17u-h3">Publication approvals</h3>${rec.length?`<div class="grid g2" style="align-items:start">${rec.map(card).join("")}</div>`:`<p class="muted small">Nothing has been sent to the approver group.</p>`}
 <h3 class="r17u-h3">Scheduled delivery <span class="pill info">Simulated</span></h3><p class="muted small">Schedules are recorded and the next run is computed, but this prototype sends nothing. A run writes an audit entry and an event so the flow can be shown.</p>
 ${sc.length?`<div class="tablewrap glass r17u-tw"><table class="r17u-st" style="min-width:760px"><thead><tr><th>Dashboard</th><th>Frequency</th><th>Recipients</th><th>Format</th><th>Next run</th><th></th></tr></thead><tbody>${sc.map(d=>{const s=DS.sched[d.id];return `<tr><td data-l="Dashboard"><b>${H(d.name)}</b></td><td data-l="Frequency">${H(s.freq)}${s.freq==="Weekly"?" on "+H(s.day):""} at ${H(s.time)}</td><td data-l="Recipients">${H(s.to)}</td><td data-l="Format">${H(s.fmt)}</td><td data-l="Next run">${H(nextRun(s))}</td><td data-l=""><div class="row"><button class="btn" data-r17u-run="${d.id}">Run now (simulated)</button><button class="btn quiet" data-r17u-schedoff="${d.id}">${s.on?"Turn off":"Turn on"}</button></div></td></tr>`}).join("")}</tbody></table></div>`:`<p class="muted small">No schedules yet. Open a dashboard and choose Schedule delivery.</p>`}
 ${DS.runs.length?`<h3 class="r17u-h3">Run log</h3><ul class="r17u-fl">${DS.runs.slice(0,8).map(r=>`<li>${H(r.at)}: <b>${H(r.dash)}</b> to ${H(r.to)} as ${H(r.fmt)} <span class="pill info">Simulated, nothing sent</span></li>`).join("")}</ul>`:""}`}
/* ---------------- screen ---------------- */
function syncDash(){const pub=items().filter(d=>d.status==="published"),tl=pub.flatMap(d=>d.tiles);const g=tl.filter(t=>D.governed(t)).length;
 const own=pub.filter(d=>U.isHuman(d.owner)&&U.isHuman(d.backup)&&d.owner!==d.backup).length;
 const set=(id,v,f)=>{const m=METRICS[id];if(!m)return;m.cur=v;if(f)m.f=f;m.tr[m.tr.length-1]=v};
 set("m_dash_bound",tl.length?Math.round(g/tl.length*100):100,"Tiles bound to a governed source with a formula and an owner ("+g+" of "+tl.length+") ÷ tiles on published dashboards × 100");
 set("m_dash_owned",pub.length?Math.round(own/pub.length*100):100,"Published dashboards with a named owner and a different named backup ("+own+" of "+pub.length+") ÷ published dashboards × 100");
 set("m_dash_pubq",U.gapp.pending("dash_publish").length)}
U.syncDashMetrics=syncDash;
function render_(){seed();D.clear();const d=cur();syncDash();const pub=items().filter(x=>x.status==="published").length,pend=U.gapp.pending("dash_publish").length;
 return `<div class="screen r17u-scr">${hero("Dashboards","Pick a dashboard, change what it shows, share it and publish it",`<b>${items().length}</b> dashboards in the library, <b>${pub}</b> published${pend?`, <b>${pend}</b> waiting on the approver group`:""}. Every tile names its source, shows its formula, says how fresh it is and who owns it. The filter bar recomputes the registry tiles; publishing needs a group, not one person.`,`<div class="row">${fchip("m_dash_bound")}${fchip("m_dash_owned")}${fchip("m_dash_pubq")}</div>`)}${lensNote()}
 ${views("r17ud",["Viewer","Template gallery","Library","Approvals and schedules"],[viewer(d),gallery(),library(),apprPane()])}${procCard("r17u_dash")}</div>`}
REG("r17u_dash","Dashboards","strat","M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z",render_);
/* ---------------- drill-down ---------------- */
function drill(tid,key){const d=cur(),t=d.tiles.find(x=>x.id===tid);if(!t)return;const c=D.compute(t,F());if(c.err)return;
 let rows=c.rows||[],cols=c.cols||(c.srcId?D.SRC[c.srcId].cols:null);
 if(key&&c.by){rows=(c.allRows||[]).filter(r=>String(r[c.by]==null||r[c.by]===""?"None":r[c.by])===key);const m=D.M[t.bind.id];if(m&&m.where)rows=rows.filter(m.where)}
 if(c.kind==="list")rows=c.allRows;
 UI.drill={title:c.title+(key?" · "+key:""),rows,cols};
 const f=F();
 openDrawer(`<div class="eyebrow">Drill down</div><h2 style="font-size:24px;margin:6px 0;padding-right:60px">${H(c.title)}${key?" · "+H(key):""}</h2>
 <dl class="kv"><dt>Source</dt><dd>${H(c.src)}</dd><dt>Formula</dt><dd>${H(c.formula)}</dd><dt>Freshness</dt><dd>${H(c.fresh)}</dd><dt>Owner</dt><dd>${person(c.owner)} <span class="muted small">backup ${H(c.backup||"none")}</span></dd><dt>Filters</dt><dd>${H((D.RANGES.find(r=>r[0]===f.range)||[0,""])[1])}${f.owner?", owner "+H(f.owner):""}${f.pf?", "+H(f.pf):""}${c.notes&&c.notes.length?". Not applied: "+H(c.notes.join("; ")):""}</dd></dl>
 ${cols&&rows.length?`<div class="eyebrow" style="margin:12px 0 8px">${rows.length} source rows${rows.length>100?" (first 100 shown)":""}</div><div class="tablewrap glass r17u-tw"><table class="r17u-st"><thead><tr>${cols.map(x=>`<th>${H(x[1])}</th>`).join("")}</tr></thead><tbody>${rows.slice(0,100).map((r,i)=>`<tr data-r17u-rowgo="${i}" tabindex="0">${cols.map(x=>`<td data-l="${H(x[1])}">${cell(r,x[0])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`:c.kind==="metric"?`<div class="eyebrow" style="margin:12px 0 8px">Trend values in this range</div><p class="num">${(c.series||[]).map(v=>nf(v,v%1?1:0)).join(", ")}</p>${typeof metricBody==="function"?metricBody(c.id):""}`:empty("No rows match the filters.")}
 <div class="row" style="margin-top:14px">${rows.length&&cols?`<button class="btn primary" data-r17u-drillcsv>Export these rows (CSV)</button>`:""}<button class="btn" data-go="${H(c.scr||"home")}">Open the source screen</button></div>`)}
/* ---------------- forms ---------------- */
const liveBox=h=>h;
function openF(spec,init){openForm(spec,init||{})}
const SIZES=[["3","Small (3 of 12)"],["4","Third (4)"],["6","Half (6)"],["8","Two thirds (8)"],["12","Full (12)"]];
function tileForm(d,t){const edit=!!t;const b=(t&&t.bind)||{k:"measure",id:"inc_open"};
 openF({id:"r17u_tile",title:edit?"Edit tile":"Add a tile",story:"Choose the view, then the source. A tile must be bound to a governed metric or a registry measure; its formula, owner and freshness come with it.",submit:edit?"Save tile":"Add tile",
 fields:[{k:"type",label:"Tile type",type:"chips",req:true,opts:[["card","Metric card"],["trend","Trend line"],["bar","Bar"],["table","Table"],["list","List of records"],["ring","KPI ring"]]},{k:"kind",label:"Source",type:"chips",req:true,opts:[["metric","Governed metric"],["measure","Registry measure"],["list","Registry records"]]},
  {k:"metric",label:"Metric",type:"pick",noun:"metrics",src:D.metricOpts(),show:v=>v.kind==="metric"},{k:"measure",label:"Measure",type:"select",opts:D.measureOpts(),show:v=>v.kind==="measure"},{k:"by",label:"Group by (bar charts)",type:"select",ph:"No grouping",opts:Object.keys(D.DIMN).map(k=>[k,D.DIMN[k]]),show:v=>v.kind==="measure"&&v.type==="bar"},
  {k:"src",label:"Records from",type:"select",opts:D.listOpts(),show:v=>v.kind==="list"},{k:"where",label:"Which records",type:"select",opts:[["","All records"],["open","Open"],["over","Forecast above approval"],["flag","Flagged"],["below","Below target"]],show:v=>v.kind==="list"},{k:"top",label:"Rows or bars to show",type:"number",min:3,max:20,show:v=>v.type==="bar"||v.kind==="list"},
  {k:"title",label:"Title (optional)",type:"text",ph:"Uses the source name"},{k:"w",label:"Width",type:"chips",opts:SIZES},{k:"h",label:"Height",type:"chips",opts:[["1","Short"],["2","Medium"],["3","Tall"],["4","Very tall"]]}],
 defaults:{type:t?t.type:"card",kind:b.k,metric:b.k==="metric"?b.id:"m_delivery",measure:b.k==="measure"?b.id:"inc_open",by:b.by||"",src:b.k==="list"?b.src:"incidents",where:b.where||"",top:b.top||6,title:t?t.title:"",w:String(t?t.w:4),h:String(t?t.h:2)},
 live:v=>{const probe={type:v.type,bind:bindOf(v)};const c=probe.bind?D.compute(probe,F()):{err:"Choose a source"};liveBox(c.err?`<div class="rem"><div><b>${H(c.err)}</b></div></div>`:`<div class="small muted"><b>${H(c.title||"")}</b> shows ${H(c.disp||(c.rows?c.total+" records":"a series"))}. Source ${H(c.src)}. Owner ${H(c.owner||"")}.</div>`)},
 onSubmit:v=>{const bind=bindOf(v);const bad=check(v.type,bind);if(bad)return {close:false,toast:bad,audit:"rejected tile"};
  const nt={id:edit?t.id:nid(d),type:v.type,bind,title:v.title||"",w:+v.w||4,h:+v.h||2};
  mutate(d,dd=>{if(edit)dd.tiles[dd.tiles.findIndex(x=>x.id===t.id)]=nt;else dd.tiles.push(nt)},(edit?"edited":"added")+" tile "+(v.title||D.compute(nt,F()).title));return {toast:(edit?"Tile saved":"Tile added")+". Undo is available.",audit:"dashboard tile"}}})}
function bindOf(v){if(v.kind==="metric")return v.metric?{k:"metric",id:v.metric}:null;if(v.kind==="measure")return v.measure?{k:"measure",id:v.measure,by:v.type==="bar"?(v.by||(D.dimsOf(v.measure)[0]||"")):"",top:+v.top||6}:null;if(v.kind==="list")return {k:"list",src:v.src,where:v.where||"",top:+v.top||6};return null}
function check(type,b){if(!b)return "Choose a source for this tile.";
 if((type==="card"||type==="ring")&&b.k==="list")return "A "+(type==="card"?"metric card":"KPI ring")+" needs a metric or a measure, not a record list.";
 if(type==="trend"&&b.k==="list")return "A trend needs a metric or a dated measure.";
 if(type==="trend"&&b.k==="measure"&&!D.M[b.id].dated)return "That measure has no dates, so it cannot draw a trend. Use a metric, or a dated measure such as open incidents.";
 if(type==="bar"&&b.k!=="measure")return "A bar chart needs a registry measure grouped by a dimension.";
 if(type==="bar"&&!D.dimsOf(b.id).includes(b.by))return "Group that measure by one of: "+D.dimsOf(b.id).map(k=>D.DIMN[k]).join(", ")+".";
 if((type==="table"||type==="list")&&b.k!=="list")return "A "+type+" needs registry records as its source.";return ""}
function newForm(pre){
 openF({id:"r17u_newd",title:"New dashboard",story:"Start blank or from a template built from live data. You become the owner; name a different person as backup.",submit:"Create dashboard",
 fields:[{k:"name",label:"Name",type:"text",req:true,ph:"For example: Release readiness"},{k:"tpl",label:"Start from",type:"chips",opts:[["","Blank"]].concat(D.TEMPLATES.map(t=>[t.id,t.name]))},{k:"desc",label:"What it is for",type:"text",ph:"One sentence"},{k:"backup",label:"Backup (a different person)",type:"people",req:true}],defaults:{name:"",tpl:pre||"",desc:"",backup:""},
 live:v=>{const t=D.TEMPLATES.find(x=>x.id===v.tpl);liveBox(`<div class="small muted">${t?H(t.desc)+" Tiles: "+D.build({tiles:t.tiles}).length+".":"An empty dashboard; add tiles after creating it."} Owner ${H(me())}.</div>`)},
 onSubmit:v=>{if(!(v.name||"").trim())return {close:false,toast:"Give the dashboard a name.",audit:"rejected dashboard"};if(v.backup===me())return {close:false,toast:"The backup must be a different person from you.",audit:"rejected dashboard"};
  const t=D.TEMPLATES.find(x=>x.id===v.tpl),id="d_"+(DS.seq++)+"_"+Date.now().toString(36).slice(-3);
  const d={id,name:v.name.trim(),desc:v.desc||(t?t.desc:""),owner:me(),backup:v.backup,tpl:t?t.id:"",tiles:t?D.build(t):[],status:"draft",ver:1,shared:[],created:TODAY};items().push(d);UI.sel=id;UI.edit=!t;S.v.r17ud=0;U.audit("created dashboard",d.name);render();return {toast:"Dashboard created as a draft. Share or publish when ready.",audit:"created dashboard "+d.name}}})}
function dupDash(src){if(!src)return;const d=JSON.parse(JSON.stringify(src));d.id="d_"+(DS.seq++)+"_"+Date.now().toString(36).slice(-3);d.name=src.name+" (copy)";const oo=src.owner;d.owner=me();d.backup=oo!==me()?oo:src.backup;d.status="draft";d.ver=1;d.shared=[];d.created=TODAY;items().push(d);UI.sel=d.id;S.v.r17ud=0;U.audit("duplicated dashboard",src.name+" to "+d.name);G(()=>toast("Duplicated as a draft you own","good"));return d}
function shareForm(d){const gs=groups();
 openF({id:"r17u_share",title:"Share "+d.name,story:"Sharing lets the chosen groups open this dashboard. It does not make it anyone's default; that needs the approver group (Publish).",submit:"Save sharing",
 fields:[{k:"groups",label:"Groups that can see it",type:"multi",opts:gs.map(g=>[g.name,g.name])}],defaults:{groups:d.shared.slice()},
 live:v=>liveBox(`<div class="small muted">${(v.groups||[]).length?"Visible to "+(v.groups||[]).length+" group(s), "+(v.groups||[]).reduce((a,n)=>a+((gs.find(g=>g.name===n)||{members:[]}).members.length),0)+" member seats.":"Only you, the backup and administrators can open it."}</div>`),
 onSubmit:v=>{d.shared=(v.groups||[]).slice();U.audit("shared dashboard",d.name+" to "+d.shared.join(", "));render();return {toast:d.shared.length?"Shared with "+d.shared.length+" group(s).":"Sharing removed.",audit:"shared dashboard"}}})}
function pubChecks(d){const ck=[];ck.push([U.isHuman(d.owner),"Owner is a named person ("+d.owner+")"]);ck.push([U.isHuman(d.backup)&&d.backup!==d.owner,"Backup is a different named person ("+(d.backup||"none")+")"]);ck.push([d.tiles.length>0,d.tiles.length+" tiles"]);
 const un=d.tiles.filter(t=>!D.governed(t)).length;ck.push([un===0,un?un+" tile(s) without a governed source":"Every tile has a governed source, formula and owner"]);return ck}
function pubForm(d){const gi=U.gapp.info("dash_publish");
 openF({id:"r17u_pub",title:"Publish "+d.name,story:"Publishing makes this dashboard the default for a role. It goes to the "+gi.name+" ("+gi.qtext+" approves); you cannot approve your own request. Until then the current default stays.",submit:"Send to the approver group",
 fields:[{k:"persona",label:"Default for this role",type:"select",req:true,opts:PERSONAS_.map(p=>[p[0],p[1]])},{k:"note",label:"What it shows and why",type:"longtext",req:true}],defaults:{persona:S.persona&&PERSONAS_.some(p=>p[0]===S.persona)?S.persona:"exec",note:""},
 live:v=>{const ck=pubChecks(d),cur_=byId(DS.def[v.persona]);liveBox(`<ul class="r17u-fl">${ck.map(c=>`<li>${c[0]?"✓":"✗"} ${H(c[1])}</li>`).join("")}</ul><div class="small muted">Replaces ${cur_?H(cur_.name):"no current default"} for ${H(pn(v.persona))}.</div>`)},
 onSubmit:v=>{const ck=pubChecks(d).filter(c=>!c[0]);if(ck.length)return {close:false,toast:"Fix first: "+ck[0][1],audit:"rejected publish"};if(!(v.note||"").trim())return {close:false,toast:"Say what it shows and why.",audit:"rejected publish"};
  U.gapp.propose("dash_publish",d.name+": default for "+pn(v.persona),{dash:d.id,persona:v.persona},v.note);S.v.r17ud=3;render();return {toast:"Sent to "+gi.name+".",audit:"sent dashboard for publication"}}})}
U.dashApplyPublish=rec=>{const d=byId(rec.payload.dash);if(!d)return;d.status="published";d.ver++;DS.def[rec.payload.persona]=d.id;syncDash()};
function schedForm(d){const s=DS.sched[d.id]||{on:true,freq:"Weekly",day:"Mon",time:"08:00",to:"Technology leadership",fmt:"PDF snapshot"};
 openF({id:"r17u_sched",title:"Schedule delivery of "+d.name,story:"Simulated: the schedule is saved and the next run is computed, but nothing is sent from this prototype. A real tenant would deliver through the report schedule service.",submit:"Save schedule",
 fields:[{k:"on",label:"Schedule is on",type:"toggle"},{k:"freq",label:"Frequency",type:"chips",opts:["Daily","Weekly","Monthly"]},{k:"day",label:"Day",type:"select",opts:["Mon","Tue","Wed","Thu","Fri"].map(x=>[x,x]),show:v=>v.freq==="Weekly"},{k:"time",label:"Time",type:"select",opts:["07:00","08:00","12:00","17:00"].map(x=>[x,x])},{k:"to",label:"Recipients (a group)",type:"select",opts:groups().map(g=>[g.name,g.name])},{k:"fmt",label:"Format",type:"chips",opts:["PDF snapshot","CSV of tiles","Link only"]}],defaults:s,
 live:v=>liveBox(`<div class="small muted"><span class="pill info">Simulated</span> Next run: ${H(nextRun(v))}.</div>`),
 onSubmit:v=>{DS.sched[d.id]={on:!!v.on,freq:v.freq,day:v.day,time:v.time,to:v.to,fmt:v.fmt};S.v.r17ud=3;U.audit("scheduled dashboard delivery (simulated)",d.name+" "+v.freq+" to "+v.to);G(()=>STORE.put&&0);render();return {toast:"Schedule saved (simulated). Next run "+nextRun(DS.sched[d.id])+".",audit:"scheduled delivery"}}})}
function renameForm(d){openF({id:"r17u_ren",title:"Rename dashboard",story:"Name and description show in the library and the picker.",submit:"Save",fields:[{k:"name",label:"Name",type:"text",req:true},{k:"desc",label:"What it is for",type:"text"}],defaults:{name:d.name,desc:d.desc},
 onSubmit:v=>{if(!(v.name||"").trim())return {close:false,toast:"A name is required.",audit:"rejected rename"};mutate(d,x=>{x.name=v.name.trim();x.desc=v.desc||""},"renamed");return {toast:"Renamed.",audit:"renamed dashboard"}}})}
function delForm(d){openF({id:"r17u_del",title:"Delete "+d.name,story:"Only drafts can be deleted. The dashboard and its tiles are removed from the library; published dashboards are retired through a new publication instead.",submit:"Delete dashboard",fields:[],defaults:{},
 onSubmit:()=>{DS.items=items().filter(x=>x.id!==d.id);if(UI.sel===d.id)UI.sel=null;U.audit("deleted dashboard",d.name);render();return {toast:"Deleted "+d.name+".",audit:"deleted dashboard"}}})}
/* ---------------- print and full screen ---------------- */
function printView(){closePrint();const d=cur(),f=F(),el=document.createElement("div");el.className="r17u-pv";el.setAttribute("role","dialog");el.setAttribute("aria-label","Print view");
 el.innerHTML=`<div class="r17u-pvbar"><button type="button" class="btn primary" data-r17u-pvprint>Print or save as PDF</button><button type="button" class="btn" data-r17u-pvclose>Close print view</button></div><article class="r17u-page"><header><div class="r17u-pvt">${H(d.name)}</div><div class="r17u-pvs">Meridian Standards Foundation (sample) · ${fmtD(TODAY)} · owner ${H(d.owner)}, backup ${H(d.backup)} · filters: ${H((D.RANGES.find(r=>r[0]===f.range)||[0,""])[1])}${f.owner?", owner "+H(f.owner):""}${f.pf?", "+H(f.pf):""}</div></header>${canvas(d,false,true)}</article>`;
 document.body.appendChild(el);document.body.classList.add("r17u-pvon");U.audit("opened dashboard print view",d.name)}
function closePrint(){document.querySelectorAll(".r17u-pv").forEach(x=>x.remove());document.body.classList.remove("r17u-pvon","r17u-printing")}
/* ---------------- events ---------------- */
document.addEventListener("click",e=>{const T=e.target.closest&&e.target.closest("[data-r17u-drill],[data-r17u-rec],[data-r17u-t],[data-r17u-edit],[data-r17u-done],[data-r17u-add],[data-r17u-undo],[data-r17u-redo],[data-r17u-rename],[data-r17u-new],[data-r17u-dup],[data-r17u-share],[data-r17u-pub],[data-r17u-mydef],[data-r17u-sched],[data-r17u-print],[data-r17u-full],[data-r17u-freset],[data-r17u-use],[data-r17u-openlib],[data-r17u-duplib],[data-r17u-dellib],[data-r17u-run],[data-r17u-schedoff],[data-r17u-pvprint],[data-r17u-pvclose],[data-r17u-drillcsv],[data-r17u-rowgo]");if(!T)return;
 const d=cur();const ds=T.dataset;
 if("r17uDrill" in ds){const [a,b]=ds.r17uDrill.split("|");drill(a,b);return}
 if("r17uRec" in ds&&T.matches(".r17u-li")){const [tid,i]=ds.r17uRec.split("|"),t=d.tiles.find(x=>x.id===tid),c=t&&D.compute(t,F()),r=c&&c.rows&&c.rows[+i];if(r&&r.go){r.go()}return}
 if("r17uT" in ds){const t=d.tiles.find(x=>x.id===ds.id);if(!t)return;const i=d.tiles.indexOf(t),a=ds.r17uT;
  if(a==="left"||a==="right"){const j=i+(a==="left"?-1:1);if(j<0||j>=d.tiles.length)return;mutate(d,x=>{x.tiles.splice(j,0,x.tiles.splice(i,1)[0])},"moved "+(t.title||t.id)+" "+(a==="left"?"earlier":"later"));setTimeout(()=>{const b=document.querySelector(`[data-r17u-t="${a}"][data-id="${t.id}"]`);b&&b.focus()},30)}
  else if(a==="narrow"||a==="wide"){const S_=[3,4,6,8,12];let k=S_.findIndex(x=>x>=t.w);if(k<0)k=S_.length-1;k=Math.max(0,Math.min(S_.length-1,k+(a==="wide"?1:-1)));mutate(d,()=>{t.w=S_[k]},"resized "+(t.title||t.id)+" to "+S_[k]+" of 12")}
  else if(a==="short"||a==="tall"){mutate(d,()=>{t.h=Math.max(1,Math.min(4,t.h+(a==="tall"?1:-1)))},"changed height of "+(t.title||t.id))}
  else if(a==="edit"){tileForm(d,t)}
  else if(a==="remove"){mutate(d,x=>{x.tiles=x.tiles.filter(y=>y.id!==t.id)},"removed "+(t.title||t.id));G(()=>toast("Tile removed. Choose Undo to bring it back.","good"))}return}
 if("r17uEdit" in ds){if(!canEdit(d)){const c=dupDash(d);if(c){UI.edit=true;render()}}else{UI.edit=true;render()}return}
 if("r17uDone" in ds){UI.edit=false;G(()=>toast("Changes are saved in this browser.","good"));render();return}
 if("r17uAdd" in ds){tileForm(d);return}
 if("r17uUndo" in ds){undo(d);return}if("r17uRedo" in ds){redo(d);return}
 if("r17uRename" in ds){renameForm(d);return}
 if("r17uNew" in ds){newForm();return}
 if("r17uDup" in ds){dupDash(d);render();return}
 if("r17uShare" in ds){shareForm(d);return}
 if("r17uPub" in ds){pubForm(d);return}
 if("r17uMydef" in ds){DS.myDef[S.persona]=d.id;U.audit("set personal default dashboard",d.name+" for "+pn(S.persona));G(()=>toast(d.name+" opens first for you as "+pn(S.persona)+".","good"));render();return}
 if("r17uSched" in ds){schedForm(d);return}
 if("r17uPrint" in ds){printView();return}
 if("r17uFull" in ds){UI.full=!UI.full;if(UI.full)G(()=>document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{}));else G(()=>document.fullscreenElement&&document.exitFullscreen());render();return}
 if("r17uFreset" in ds){DS.F={range:"90d",owner:"",pf:""};render();return}
 if("r17uUse" in ds){newForm(ds.r17uUse);return}
 if("r17uOpenlib" in ds){UI.sel=ds.r17uOpenlib;UI.edit=false;S.v.r17ud=0;render();return}
 if("r17uDuplib" in ds){const s=byId(ds.r17uDuplib);dupDash(s);render();return}
 if("r17uDellib" in ds){const s=byId(ds.r17uDellib);s&&delForm(s);return}
 if("r17uRun" in ds){const s=byId(ds.r17uRun),sc=DS.sched[ds.r17uRun];if(!s||!sc)return;DS.runs.unshift({at:"Oct 6, 2026 "+new Date().toTimeString().slice(0,5),dash:s.name,to:sc.to,fmt:sc.fmt});if(DS.runs.length>40)DS.runs.length=40;U.emit("dashboard.delivery_simulated",{dashboard:s.id,recipients:sc.to});U.audit("dashboard delivery run (simulated)",s.name);G(()=>toast("Simulated run recorded. Nothing was sent.","good"));render();return}
 if("r17uSchedoff" in ds){const sc=DS.sched[ds.r17uSchedoff];if(sc){sc.on=!sc.on;U.audit("schedule "+(sc.on?"on":"off")+" (simulated)",ds.r17uSchedoff);render()}return}
 if("r17uPvprint" in ds){document.body.classList.add("r17u-printing");G(()=>window.print());setTimeout(()=>document.body.classList.remove("r17u-printing"),500);G(()=>toast("Print dialog requested","good"));return}
 if("r17uPvclose" in ds){closePrint();return}
 if("r17uDrillcsv" in ds){const dr=UI.drill;if(!dr||!dr.cols)return;const ok=U.download("dashboard-rows.csv",U.csv([dr.cols.map(x=>x[1])].concat(dr.rows.map(r=>dr.cols.map(x=>r[x[0]]==null?"":r[x[0]]))) ));G(()=>toast(ok?"Rows exported to CSV":"Export blocked by the browser",ok?"good":"bad"));return}
 if("r17uRowgo" in ds){const r=UI.drill&&UI.drill.rows[+ds.r17uRowgo];if(r&&r.go){closeDrawer();r.go()}return}});
document.addEventListener("change",e=>{const t=e.target;if(!t.matches)return;
 if(t.matches("[data-r17u-f]")){DS.F=Object.assign({range:"90d",owner:"",pf:""},DS.F);DS.F[t.dataset.r17uF]=t.value;render()}
 else if(t.matches("[data-r17u-sel]")){UI.sel=t.value;UI.edit=false;render()}});
document.addEventListener("click",e=>{const v=e.target.closest&&e.target.closest("[data-r17u-vote]");if(!v)return;const [id,ok]=v.dataset.r17uVote.split("|");U.gapp.vote(id,ok==="1");render()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(UI.full){UI.full=false;render()}else if(document.querySelector(".r17u-pv")){closePrint()}}
 if(e.key==="Enter"){const r=e.target.closest&&e.target.closest("tr[data-r17u-rowgo]");if(r)r.click()}});
window.addEventListener("beforeprint",()=>{if(document.querySelector(".r17u-pv"))document.body.classList.add("r17u-printing")});window.addEventListener("afterprint",()=>document.body.classList.remove("r17u-printing"));
/* drag and drop (kit DND, with its built-in Alt+Arrow keyboard fallback) */
G(()=>DND.on("r17u_tile",(id,from,to,idx)=>{const d=cur(),i=d.tiles.findIndex(t=>t.id===id);if(i<0)return;const j=Math.max(0,Math.min(d.tiles.length-1,idx>i?idx-1:idx));if(j===i)return;mutate(d,x=>{x.tiles.splice(j,0,x.tiles.splice(i,1)[0])},"reordered tiles")}));
/* the default selection follows the persona, until the person picks another dashboard */
let lastP=null;const _r=W.render;
/* search */
SEARCHX.push(()=>[{g:"Dashboard templates",t:"Executive, Service desk, Finance, Resilience, AI agents, Delivery",m:"Template gallery",c:"--accent",f:()=>{S.v.r17ud=1;go("r17u_dash")},k:"dashboard template gallery executive service desk finance resilience ai agents delivery"}]);
})();
