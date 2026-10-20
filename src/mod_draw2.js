/* ===== mod_draw2: Process drawing studio (prefix dr). Part 2 of 2: the studio screen, canvas, shape drawer, properties drawer, save and export, entry points and the Feature Contract wiring.
   The studio keeps all state in ST (view) and S.draw (documents), so any app-wide render() rebuilds it from state. */
(function(){
"use strict";
const D=window.DRAW,H=s=>esc(s==null?"":String(s)),G=16;
const SD=S.draw;
const ST=D.ST={doc:null,sel:new Set(),selC:null,k:1,px:60,py:40,tool:"select",undo:[],redo:[],clip:null,drag:null,prev:null,checks:false,sugg:null,aiOpen:false,lay:null,q:"",dirty:false,fit:true,kb:false,edit:null,pick:"",ro:false,msg:""};
const WHOL=D.WHOL,BY=D.BY,isFlow=D.isFlow;
const $q=(s,r)=>(r||document).querySelector(s),$$q=(s,r)=>Array.from((r||document).querySelectorAll(s));
const slug=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
const phone=()=>window.innerWidth<760;
const IC_=p=>`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${p}"/></svg>`;
const ICN={undo:"M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",redo:"M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3",zin:"M11 5v12M5 11h12M20 20l-4-4",zout:"M5 11h12M20 20l-4-4",fit:"M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",grid:"M4 4h16v16H4zM4 12h16M12 4v16",snap:"M5 5l14 14M12 3v4M12 17v4M3 12h4M17 12h4",dup:"M8 8h12v12H8zM4 16V4h12",del:"M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",sel:"M5 3l13 8-6 1.5L9 19z",pan:"M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8c0 4-2 6-5 6s-5-2-6-5l-1.5-3a1.5 1.5 0 0 1 2.5-1.5L8 13",arr:"M4 6h16M4 12h10M4 18h16",ai:D.IC.aistep,chk:"M5 12l4 4 10-10",save:"M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6",pub:"M12 3v12M7 8l5-5 5 5M5 17v3h14v-3",imp:"M12 15V3M7 10l5 5 5-5M5 21h14",exp:"M12 3v12M7 8l5-5 5 5M5 21h14",lane:"M3 5h18v14H3zM8 5v14M8 12h13",tidy:"M4 6h6v4H4zM14 6h6v4h-6zM9 14h6v4H9zM7 10v2h10v-2",help:"M12 17v.5M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7",plus:"M12 5v14M5 12h14",left:"M15 5l-7 7 7 7",right:"M9 5l7 7-7 7",close:"M6 6l12 12M18 6L6 18",back:"M15 5l-7 7 7 7"};
const ico=k=>IC_(ICN[k]||"");

/* ---------- people, systems, rules (all guarded) ---------- */
function peopleNames(){
 const out=[];try{if(window.ORGX&&ORGX.staff&&ORGX.staff.length)ORGX.staff.forEach(p=>out.push(p.name||p.n))}catch(e){}
 try{if(window.DIR)DIR.forEach(p=>{if(!out.includes(p.name))out.push(p.name)})}catch(e){}
 try{if(window.ORGX&&ORGX.agents){ORGX.agents().forEach(a=>{const n=a.name||a.n;if(n&&!out.includes(n))out.push(n)})}}catch(e){}
 return out.filter(Boolean).slice(0,500);
}
function sysNames(){try{return SVCREG.map(s=>s.name||s.id)}catch(e){return["Standards Platform","Contract Repository","Lease subledger","Azure","Entra ID","Microsoft 365"]}}
function rules(){try{return(S.flw&&S.flw.dmn||[]).map(t=>({id:t.id,name:t.name}))}catch(e){return[]}}
function ownerSuggest(sh){
 const text=sh.n+" "+(sh.inp||"")+" "+(sh.out||"");let name=null,why="";
 try{if(window.ORGX&&ORGX.byDomain){const r=ORGX.byDomain(text);if(r){const o=Array.isArray(r)?r[0]:r;const nm=typeof o==="string"?o:(o.owner&&(o.owner.name||o.owner))||o.ownerName||(o.ownerId&&ORGX.P&&ORGX.P(o.ownerId)&&ORGX.P(o.ownerId).name)||o.name;if(typeof nm==="string"&&nm){name=nm;why="Accountable for "+(o.label||o.domain||"this area")+" in the org model"}}}}catch(e){}
 if(!name){const w=text.toLowerCase().split(/[^a-z]+/).filter(x=>x.length>3);let best=0;try{(window.DIR||[]).forEach(p=>{if(p.kind&&p.kind!=="human")return;const hay=((p.role||"")+" "+(p.team||"")+" "+(p.skills||[]).join(" ")).toLowerCase();let sc=0;w.forEach(x=>{if(hay.includes(x))sc++});if(sc>best){best=sc;name=p.name;why="Role and skills match: "+p.role}})}catch(e){}}
 return name?{name,why}:null;
}

/* ---------- document handling ---------- */
function stepsNow(pid){try{if(window.PROCLIB&&PROCLIB.get){const g=PROCLIB.get(pid);if(g&&g.stepsList)return g.stepsList}}catch(e){}const d=window.PROC&&PROC.defs[pid];return d?(S.proc&&S.proc[pid])||d.steps||[]:[]}
function procName(pid){try{const g=PROCLIB.get(pid);if(g)return g.name}catch(e){}const d=window.PROC&&PROC.defs[pid];return d?d.title:pid}
function loadDoc(pid,name){
 if(pid&&SD.docs[pid])return D.clone(SD.docs[pid]);
 if(pid){const st=stepsNow(pid),doc=D.fromSteps(st,procName(pid),pid);doc.basis=D.sig(st);return doc}
 return D.newDoc(name||"New process");
}
function setDoc(doc){ST.doc=doc;ST.sel=new Set();ST.selC=null;ST.undo=[];ST.redo=[];ST.fit=true;ST.sugg=null;ST.aiOpen=false;ST.lay=null;ST.dirty=false;ST.checks=false;ST.lastSave=null;SD.cur=doc.pid||"_new"}
function persist(){const d=ST.doc;if(!d)return;const key=d.pid||"_new";SD.docs[key]=D.clone(d);syncMetrics()}
const snap=()=>JSON.stringify({s:ST.doc.shapes,c:ST.doc.conns,q:ST.doc.seq});
function pushU(){ST.undo.push(snap());if(ST.undo.length>100)ST.undo.shift();ST.redo=[]}
function restore(j){const o=JSON.parse(j);ST.doc.shapes=o.s;ST.doc.conns=o.c;ST.doc.seq=o.q}
function mut(fn,opt){opt=opt||{};if(!ST.doc||ST.ro)return;if(!opt.noUndo)pushU();const r=fn();ST.dirty=true;ST.doc.rev++;persist();const ids=new Set(ST.doc.shapes.map(s=>s.id));ST.sel.forEach(i=>{if(!ids.has(i))ST.sel.delete(i)});if(ST.selC&&!ST.doc.conns.some(c=>c.id===ST.selC))ST.selC=null;refresh();return r}
function pruneSel(){const ids=new Set(ST.doc.shapes.map(s=>s.id));ST.sel.forEach(i=>{if(!ids.has(i))ST.sel.delete(i)});if(ST.selC&&!ST.doc.conns.some(c=>c.id===ST.selC))ST.selC=null}
function undo(){if(!ST.undo.length)return;ST.redo.push(snap());restore(ST.undo.pop());ST.dirty=true;persist();pruneSel();refresh();openProps()}
function redo(){if(!ST.redo.length)return;ST.undo.push(snap());restore(ST.redo.pop());ST.dirty=true;persist();pruneSel();refresh();openProps()}

/* ---------- screen ---------- */
function pickerRows(){
 let L=[];try{L=PROCLIB.list()}catch(e){}
 const q=(ST.pick||"").toLowerCase().trim();
 if(q)L=L.filter(p=>(p.name+" "+p.id+" "+p.familyName+" "+(p.owner||"")).toLowerCase().includes(q));
 L=L.slice().sort((a,b)=>(!!SD.docs[b.id]-!!SD.docs[a.id])||a.name.localeCompare(b.name));
 return L;
}
function pickerHTML(){
 const L=pickerRows(),n=L.length;
 const tpl=[["tpl_approval","Approval request","A request is submitted, checked by an AI agent, approved by a person and recorded."],["tpl_incident","Incident triage","An alert becomes an incident, is classified, fixed and reviewed."],["tpl_onboard","New hire onboarding","Accounts, equipment and first-week plan, with a manager check."]];
 return `<section class="card glass dr-pick" aria-label="Choose a process to draw"><div class="cardhead"><div><h3>Choose what to draw</h3><span class="muted small" data-role="story">Open any process from the library as a drawing (its steps become shapes), start from a template, or start blank. Saving writes the steps, owners and who acts back to the process.</span></div></div>
 <div class="grid g3 dr-tpls">${tpl.map(t=>`<button type="button" class="dr-tpl glass" data-dr-tpl="${t[0]}"><b>${H(t[1])}</b><span class="small muted">${H(t[2])}</span><span class="pill info">Template</span></button>`).join("")}<button type="button" class="dr-tpl glass" data-dr-new><b>Start blank</b><span class="small muted">Name it, then drag shapes from the drawer. Start is added for you.</span><span class="pill mute">Blank</span></button></div>
 <div class="row dr-psearch"><label class="small muted" for="drPick">Find a process</label><input id="drPick" class="fin" type="search" data-dr-pick placeholder="Search ${n} processes" value="${H(ST.pick)}" autocomplete="off"></div>
 <div class="dr-plist" role="list">${L.slice(0,40).map(p=>`<button type="button" class="dr-prow" role="listitem" data-dr-open="${H(p.id)}"><span class="dr-pn"><b>${H(p.name)}</b><span class="small muted">${H(p.familyName)} · ${p.steps} step${p.steps===1?"":"s"} · ${H(p.owner||"no owner")}</span></span>${SD.docs[p.id]?'<span class="pill good">Drawn</span>':'<span class="pill mute">Not drawn</span>'}<span class="pill info">Level ${p.level}</span></button>`).join("")||'<p class="small muted">No process matches. Start blank instead.</p>'}${n>40?`<p class="small muted">Showing 40 of ${n}. Type to narrow the list.</p>`:""}</div></section>`;
}
function palHTML(){
 const q=(ST.q||"").toLowerCase().trim(),col=SD.pal?"":" col";
 const groups=D.CATS.map(c=>{const items=D.SHAPES.filter(s=>s.cat===c[0]&&(!q||(s.name+" "+s.tip).toLowerCase().includes(q)));return{c,items}}).filter(g=>g.items.length);
 return `<aside class="dr-pal${col}" data-dr-aside aria-label="Shape drawer"><div class="dr-palhead"><button type="button" class="dr-ib" data-dr-cmd="pal" aria-expanded="${SD.pal}" aria-label="${SD.pal?"Collapse":"Expand"} the shape drawer" title="${SD.pal?"Collapse":"Expand"} the shape drawer">${ico(SD.pal?"right":"left")}</button><b class="dr-paltitle">Shapes</b></div>
 <div class="dr-palbody"><input type="search" class="fin dr-qs" data-dr-q placeholder="Search shapes" aria-label="Search shapes" value="${H(ST.q)}" autocomplete="off">
 <p class="small muted dr-hint">Drag onto the canvas, or select a shape and press Enter. Drop near a shape to connect.</p>
 ${groups.map(g=>`<details class="dr-cat" ${(q||!SD.cats[g.c[0]])?"open":""} data-dr-cat="${g.c[0]}"><summary>${H(g.c[1])}<span class="small muted">${g.items.length}</span></summary><div class="dr-items" role="group" aria-label="${H(g.c[1])} shapes">${g.items.map(it=>palItem(it)).join("")}</div></details>`).join("")||'<p class="small muted">No shape matches.</p>'}</div>
 <div class="dr-railitems" aria-hidden="${SD.pal}">${D.SHAPES.map(it=>palItem(it,1)).join("")}</div></aside>`;
}
function palItem(it,rail){return `<button type="button" class="dr-pi${rail?" rail":""}" data-dr-pi="${it.id}" data-dr-tip="${H(it.name+": "+it.tip)}" aria-label="${H(it.name)}. ${H(it.tip)}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${it.ic}"/></svg>${rail?"":`<span>${H(it.name)}</span>`}</button>`}
function menu(id,label,icon,items){return `<details class="dr-menu" data-dr-menu="${id}"><summary class="dr-tb" aria-label="${H(label)}" title="${H(label)}">${ico(icon)}<span>${H(label)}</span></summary><div class="dr-mpop" role="menu">${items.map(i=>i.sep?'<hr>':`<button type="button" role="menuitem" data-dr-cmd="${i.c}" ${i.d?"disabled":""}>${H(i.l)}</button>`).join("")}</div></details>`}
function tbtn(c,icon,label,o){o=o||{};return `<button type="button" class="dr-tb${o.on?" on":""}${o.txt?" txt":""}" data-dr-cmd="${c}" title="${H(o.tip||label)}" aria-label="${H(o.tip||label)}"${o.pressed!=null?` aria-pressed="${o.pressed}"`:""}${o.d?" disabled":""}>${ico(icon)}${o.txt?`<span>${H(label)}</span>`:""}</button>`}
function toolbarHTML(){
 const d=ST.doc,n=ST.sel.size;
 return `<div class="dr-toolbar" role="toolbar" aria-label="Drawing tools">
 <div class="dr-grp"><button type="button" class="dr-tb txt" data-dr-cmd="back" title="Choose another process">${ico("back")}<span>Processes</span></button><label class="dr-name"><span class="sr">Process name</span><input class="fin" data-dr-name value="${H(d.name)}" aria-label="Process name" maxlength="80"></label><span class="pill ${ST.dirty?"warn":"good"}" data-dr-state>${ST.dirty?"Unsaved changes":"Saved"}</span></div>
 <div class="dr-grp">${tbtn("tool_sel","sel","Select",{on:ST.tool==="select",pressed:ST.tool==="select"})}${tbtn("tool_pan","pan","Pan (hold Space)",{on:ST.tool==="pan",pressed:ST.tool==="pan"})}${tbtn("undo","undo","Undo (Ctrl+Z)",{d:!ST.undo.length})}${tbtn("redo","redo","Redo (Ctrl+Shift+Z)",{d:!ST.redo.length})}</div>
 <div class="dr-grp">${tbtn("zout","zout","Zoom out")}<span class="dr-zoom num" data-dr-zoom>${Math.round(ST.k*100)}%</span>${tbtn("zin","zin","Zoom in")}${tbtn("fit","fit","Fit to window")}${tbtn("grid","grid","Show grid",{on:SD.grid,pressed:SD.grid})}${tbtn("snap","snap","Snap to grid",{on:SD.snap,pressed:SD.snap})}</div>
 <div class="dr-grp">${tbtn("dup","dup","Duplicate (Ctrl+D)",{d:!n})}${tbtn("del","del","Delete (Del)",{d:!n&&!ST.selC})}${menu("arr","Arrange","arr",[{l:"Align left",c:"al_l",d:n<2},{l:"Align center",c:"al_c",d:n<2},{l:"Align right",c:"al_r",d:n<2},{l:"Align top",c:"al_t",d:n<2},{l:"Align middle",c:"al_m",d:n<2},{l:"Align bottom",c:"al_b",d:n<2},{sep:1},{l:"Distribute horizontally",c:"di_h",d:n<3},{l:"Distribute vertically",c:"di_v",d:n<3},{sep:1},{l:"Group into swimlanes by role",c:"lanes"},{l:"Remove swimlanes",c:"nolanes"}])}</div>
 <div class="dr-grp dr-right">${tbtn("ai","ai","AI draft",{txt:1,on:ST.aiOpen,tip:"AI draft: suggest a next step or a tidier layout. You accept or discard."})}${tbtn("checks","chk","Checks",{txt:1,on:ST.checks,tip:"Show the checklist"})}${menu("imp","Import","imp",[{l:"From the process's current steps",c:"imp_steps"},{l:"From a JSON file",c:"imp_file"},{l:"Paste JSON",c:"imp_paste"}])}${menu("exp","Export","exp",[{l:"Export JSON",c:"exp_json"},{l:"Export SVG",c:"exp_svg"}])}${tbtn("save","save","Save draft",{txt:1,tip:"Keep the drawing without changing the process steps"})}<button type="button" class="btn primary dr-pub" data-dr-cmd="publish" title="Check the drawing, then write its steps, owners and who acts into the process">Save to process</button></div></div>`;
}
function screenHTML(){
 const nd=Object.keys(SD.docs).filter(k=>k!=="_new").length;
 const hero_=hero("Automation · Process drawing studio","Draw a process, and the steps write themselves",
  `Drag shapes from the drawer. Drop one near another and the arrow is drawn for you; decisions get Yes and No exits. Select any shape to set who acts, the owner, the target time and the system. <b>${nd} process${nd===1?"":"es"}</b> drawn so far. Saving writes the steps back to the Process library, so maturity, owners and the Feature contract see them.`,
  `<div class="row">${fchip("m_draw_cov")}${fchip("m_draw_valid")}${stdChip("bpmn","Shapes, gateways, lanes and annotations follow BPMN 2.0; approval gates and owners follow ITIL 4 and RACI.")}</div>`);
 let body;
 if(phone()){
  ST.ro=true;
  body=`<section class="card glass dr-phone"><b>Drawing needs a larger screen</b><p class="small muted">The drawing studio uses drag and drop and a side drawer, so it opens read-only on a phone. You can still look at the diagram, export it, and pick a process. Open it on a tablet or computer to edit.</p>${ST.doc?`<div class="dr-ro-wrap" data-dr-wrap><svg id="drSvg" class="dr-svg" role="img" aria-label="Process diagram, read only"></svg></div><div class="row"><button class="btn" data-dr-cmd="exp_svg">Export SVG</button><button class="btn" data-dr-cmd="exp_json">Export JSON</button><button class="btn quiet" data-dr-cmd="back">Choose another</button></div>`:""}</section>${ST.doc?"":pickerHTML()}`;
 }else if(!ST.doc){ST.ro=false;body=pickerHTML()}
 else{ST.ro=false;body=`<section class="dr-studio glass${SD.pal?"":" palcol"}" data-dr-studio>${toolbarHTML()}${savedBanner()}${staleBanner()}<div class="dr-body"><div class="dr-canvas" data-dr-wrap tabindex="-1">
  <svg id="drSvg" class="dr-svg${SD.grid?" grid":""}" role="application" aria-label="Process canvas. Tab moves between shapes. Arrow keys move the selected shape. Enter opens its properties. Delete removes it." tabindex="0"></svg>
  <div class="dr-hud"><div class="dr-checks" data-dr-checks></div><div class="dr-ai" data-dr-ai></div></div><div class="dr-empty" data-dr-empty hidden><b>An empty canvas</b><span>Drag a shape from the drawer. Start is added for you.</span></div></div>${palHTML()}</div>
  <div class="dr-status small muted" data-dr-status></div></section>`}
 return `<div class="screen dr-screen${ST.doc&&!phone()?" dr-editing":""}" data-dr-root>${hero_}${lensNote()}${body}${phone()?"":(window.procCard?procCard("draw_studio"):"")}</div>`;
}
function staleBanner(){
 const d=ST.doc;if(!d||!d.pid||d.basis==null)return"";
 const st=stepsNow(d.pid);if(!st.length||D.sig(st)===d.basis)return"";
 return `<div class="dr-stale" role="status"><b>The process steps changed after this drawing was saved.</b> Re-import to redraw from the current steps, or keep your drawing and save it over them. <button class="btn" data-dr-cmd="imp_steps">Re-import from steps</button><button class="btn quiet" data-dr-cmd="keep">Keep my drawing</button></div>`;
}

/* ---------- painting the canvas ---------- */
const LBL_OUT=new Set(["start","end","wait","gateway","parallel","merge","datastore","risk"]);
const ICON_BY_TYPE=new Set(["notification","integration","apicall","subprocess","sysaction","approval","aistep","humantask"]);
function wrapText(t,max,lines){t=String(t||"").trim();if(!t)return[""];const w=t.split(/\s+/),out=[];let cur="";w.forEach(x=>{if((cur+" "+x).trim().length<=max)cur=(cur+" "+x).trim();else{if(cur)out.push(cur);cur=x.length>max?x.slice(0,max-1)+"…":x}});if(cur)out.push(cur);if(out.length>lines){const r=out.slice(0,lines);r[lines-1]=r[lines-1].replace(/.{0,2}$/,"")+"…";return r}return out}
const gl=(p,x,y,sc)=>`<path class="dr-gl" transform="translate(${x} ${y}) scale(${sc})" d="${p}"/>`;
function bodySVG(s){
 const w=s.w,h=s.h,t=s.t,cx=w/2,cy=h/2;
 switch(t){
  case"start":return `<circle class="dr-bd" cx="${cx}" cy="${cy}" r="${cx-1}"/><path class="dr-fill" d="M${cx-5} ${cy-8}l14 8-14 8z"/>`;
  case"end":return `<circle class="dr-bd dr-thick" cx="${cx}" cy="${cy}" r="${cx-2}"/><rect class="dr-fill" x="${cx-7}" y="${cy-7}" width="14" height="14" rx="2"/>`;
  case"wait":return `<circle class="dr-bd" cx="${cx}" cy="${cy}" r="${cx-1}"/><circle class="dr-ln" cx="${cx}" cy="${cy}" r="${cx-6}" fill="none"/>${gl("M12 8v4l3 2",cx-12*.9,cy-12*.9,.9)}`;
  case"gateway":case"parallel":case"merge":{const g=t==="gateway"?`<path class="dr-ln" d="M${cx-9} ${cy-9}l18 18M${cx+9} ${cy-9}l-18 18"/>`:t==="parallel"?`<path class="dr-ln" d="M${cx} ${cy-11}v22M${cx-11} ${cy}h22"/>`:`<circle class="dr-ln" cx="${cx}" cy="${cy}" r="9" fill="none"/>`;return `<polygon class="dr-bd" points="${cx},1 ${w-1},${cy} ${cx},${h-1} 1,${cy}"/>${g}`}
  case"document":return `<path class="dr-bd" d="M1 1H${w-1}V${h-12}C${w*.75} ${h+2} ${w*.3} ${h-24} 1 ${h-8}Z"/>`;
  case"datastore":return `<path class="dr-bd" d="M1 12V${h-12}C1 ${h+2} ${w-1} ${h+2} ${w-1} ${h-12}V12"/><ellipse class="dr-bd" cx="${cx}" cy="12" rx="${cx-1}" ry="11"/><path class="dr-ln" d="M1 ${h*.45}C1 ${h*.45+12} ${w-1} ${h*.45+12} ${w-1} ${h*.45}" fill="none"/>`;
  case"aistep":return `<polygon class="dr-bd" points="18,1 ${w-18},1 ${w-1},${cy} ${w-18},${h-1} 18,${h-1} 1,${cy}"/>`;
  case"approval":return `<polygon class="dr-bd" points="12,1 ${w-12},1 ${w-1},12 ${w-1},${h-12} ${w-12},${h-1} 12,${h-1} 1,${h-12} 1,12"/>`;
  case"note":return `<path class="dr-bd dr-dash" d="M1 1H${w-18}L${w-1} 18V${h-1}H1Z"/><path class="dr-ln" d="M${w-18} 1V18H${w-1}" fill="none"/>`;
  case"swimlane":return `<rect class="dr-lane-bd" x="0.5" y="0.5" width="${w-1}" height="${h-1}" rx="6"/><rect class="dr-lane-head" data-dr-lh x="0.5" y="0.5" width="34" height="${h-1}" rx="6"/>`;
  case"risk":return `<polygon class="dr-bd" points="${cx},2 ${w-2},${h-2} 2,${h-2}"/><path class="dr-ln" d="M${cx} ${cy-6}v9M${cx} ${cy+9}v.5"/>`;
  case"control":return `<rect class="dr-bd" x="1" y="1" width="${w-2}" height="${h-2}" rx="8"/>`;
  case"subprocess":return `<rect class="dr-bd" x="1" y="1" width="${w-2}" height="${h-2}" rx="10"/><rect class="dr-ln" x="${cx-8}" y="${h-20}" width="16" height="14" rx="2" fill="none"/><path class="dr-ln" d="M${cx} ${h-17}v8M${cx-4} ${h-13}h8"/>`;
  default:return `<rect class="dr-bd" x="1" y="1" width="${w-2}" height="${h-2}" rx="10"/>`;
 }
}
function iconFor(s){
 const t=s.t,w=s.who||BY[t].who;
 if(!(D.ACT.has(t)||t==="control"))return"";
 let p;if(ICON_BY_TYPE.has(t)&&t!=="humantask"&&t!=="aistep"&&t!=="approval")p=BY[t].ic;else p=({human:D.IC.humantask,agent:D.IC.aistep,auto:D.IC.sysaction,gate:D.IC.approval})[w]||BY[t].ic;
 if(t==="control")p=D.IC.control;
 return gl(p,t==="aistep"?24:9,t==="aistep"?8:8,.62);
}
function labelSVG(s){
 const w=s.w,h=s.h,out=LBL_OUT.has(s.t);
 if(s.t==="swimlane"){const ls=wrapText(s.n,Math.max(8,Math.floor((h-12)/7)),2);return `<text class="dr-lt dr-lane-t" transform="translate(${ls.length>1?12:18} ${h/2}) rotate(-90)" text-anchor="middle">${ls.map((l,i)=>`<tspan x="0" y="${i*14}">${H(l)}</tspan>`).join("")}</text>`}
 const icon=iconFor(s)&&!out;
 const max=Math.max(8,Math.floor(((out?Math.max(w,130):w)-(icon?38:18))/6.3));
 const ls=wrapText(s.n,max,out?2:3);
 const lh=14,x=out?w/2:(icon?w/2+10:w/2);
 const y0=out?(s.t==="risk"?h+14:h+15):(h/2-(ls.length-1)*lh/2+4.5);
 const ctlWho=s.t==="note"?"start":"middle";
 const xx=s.t==="note"?10:x;
 return `<text class="dr-lt${out?" out":""}" text-anchor="${ctlWho}" x="${xx}">${ls.map((l,i)=>`<tspan x="${xx}" y="${y0+i*lh}">${H(l)}</tspan>`).join("")}</text>`;
}
function shapeSVG(s,v){
 const sel=ST.sel.has(s.id),iss=v.issuesFor(s.id),w=s.who||BY[s.t].who;
 const cls=["dr-s","dr-t-"+s.t,w?"dr-w-"+w:"",sel?"sel":"",iss.some(i=>i.lv==="err")?"bad":iss.length?"warn":"",ST.prev&&ST.prev.src===s.id?"plan-src":""].filter(Boolean).join(" ");
 const lab=(BY[s.t].name+": "+s.n+(w&&D.ACT.has(s.t)?". "+WHOL[w]:"")+(s.owner?". Owner "+s.owner:"")+(iss.length?". "+iss.length+" check"+(iss.length>1?"s":"")+" to fix":""));
 const ports=isFlow(s.t)||D.DATA.has(s.t)||s.t==="note"?["t","r","b","l"].map(p=>{const q=D.portPt({x:0,y:0,w:s.w,h:s.h},p);return `<circle class="dr-port" data-dr-port="${p}" cx="${q[0]}" cy="${q[1]}" r="5.5"/>`}).join(""):"";
 const aib=(s.t==="aistep"||w==="agent")&&D.ACT.has(s.t)?`<g class="dr-aib" transform="translate(${s.w-30} -9)"><rect width="28" height="17" rx="8.5"/><text x="14" y="12.5" text-anchor="middle">AI</text></g>`:"";
 const warn=iss.length?`<g class="dr-flag ${iss.some(i=>i.lv==="err")?"e":"w"}" transform="translate(-6 -6)"><circle r="8"/><text y="4" text-anchor="middle">!</text></g>`:"";
 const own=s.owner&&D.ACT.has(s.t)&&s.w>=140?`<text class="dr-own" x="${s.w/2}" y="${s.h-6}" text-anchor="middle">${H(String(s.owner).length>22?String(s.owner).slice(0,21)+"…":s.owner)}</text>`:"";
 return `<g class="${cls}" data-dr-s="${s.id}" transform="translate(${s.x} ${s.y})" tabindex="${ST.ro?-1:0}" role="button" aria-label="${H(lab)}" aria-pressed="${sel}">${s.t==="swimlane"?"":'<rect class="dr-hitbox" x="-4" y="-4" width="'+(s.w+8)+'" height="'+(s.h+(LBL_OUT.has(s.t)?30:8))+'"/>'}${sel&&s.t!=="swimlane"?`<rect class="dr-selring" x="-5" y="-5" width="${s.w+10}" height="${s.h+10}" rx="12"/>`:""}${bodySVG(s)}${iconFor(s)}${labelSVG(s)}${own}${aib}${warn}${ST.ro||s.t==="swimlane"?"":ports}</g>`;
}
function connSVG(c,doc){
 const pts=D.route(doc,c);if(pts.length<2)return"";
 const d=D.pathD(pts),sel=ST.selC===c.id,assoc=c.kind==="assoc";
 const lp=c.lb?D.labelPt(pts):null;
 return `<g class="dr-c${sel?" sel":""}${assoc?" assoc":""}${ST.hov&&ST.hov.cid===c.id?" ins":""}" data-dr-c="${c.id}" role="button" tabindex="${ST.ro?-1:0}" aria-label="${assoc?"Association":"Connector"} from ${H((D.getS(doc,c.a)||{}).n)} to ${H((D.getS(doc,c.b)||{}).n)}${c.lb?", labeled "+H(c.lb):""}"><path class="dr-chit" d="${d}"/><path class="dr-cp" d="${d}" ${(!assoc||c.arrow)?'marker-end="url(#drArr)"':""}/>${lp?`<g class="dr-clb" transform="translate(${lp[0]} ${lp[1]})"><rect x="${-(c.lb.length*3.4+8)}" y="-9" width="${c.lb.length*6.8+16}" height="18" rx="9"/><text text-anchor="middle" y="4">${H(c.lb)}</text></g>`:""}</g>`;
}
function worldSVG(){
 const doc=ST.doc,v=D.validate(doc),lanes=doc.shapes.filter(s=>s.t==="swimlane"),rest=doc.shapes.filter(s=>s.t!=="swimlane");
 let lay="";
 if(ST.lay){lay=`<g class="dr-lay" aria-hidden="true">${doc.shapes.filter(s=>ST.lay.pos[s.id]).map(s=>{const p=ST.lay.pos[s.id];return `<rect x="${p[0]}" y="${p[1]}" width="${s.w}" height="${s.h}" rx="10"/><line x1="${s.x+s.w/2}" y1="${s.y+s.h/2}" x2="${p[0]+s.w/2}" y2="${p[1]+s.h/2}"/>`}).join("")}</g>`}
 let pv="";
 if(ST.prev){const p=ST.prev;pv=`<g class="dr-prev" aria-hidden="true"><rect x="${p.sh.x}" y="${p.sh.y}" width="${p.sh.w}" height="${p.sh.h}" rx="10"/>${p.line||""}</g>`}
 const hv=hovSVG();
 const mq=ST.drag&&ST.drag.k==="marq"&&ST.drag.moved?`<rect class="dr-marq" x="${Math.min(ST.drag.x0,ST.drag.x1)}" y="${Math.min(ST.drag.y0,ST.drag.y1)}" width="${Math.abs(ST.drag.x1-ST.drag.x0)}" height="${Math.abs(ST.drag.y1-ST.drag.y0)}"/>`:"";
 const rb=ST.drag&&ST.drag.k==="conn"&&ST.drag.moved?`<path class="dr-rub" d="M${ST.drag.sx} ${ST.drag.sy}L${ST.drag.x1} ${ST.drag.y1}"/>`:"";
 return `<defs><marker id="drArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1.5L9 5 1 8.5z" class="dr-arrow"/></marker><pattern id="drGrid" width="${G}" height="${G}" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" class="dr-gdot"/></pattern><pattern id="drGridM" width="${G*5}" height="${G*5}" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1.3" class="dr-gdot m"/></pattern></defs>
 <g id="drWorld" transform="translate(${ST.px} ${ST.py}) scale(${ST.k})"><rect class="dr-gridrect" x="-6000" y="-6000" width="12000" height="12000" fill="url(#drGrid)"/><rect class="dr-gridrect m" x="-6000" y="-6000" width="12000" height="12000" fill="url(#drGridM)"/>
 ${lanes.map(s=>shapeSVG(s,v)).join("")}${doc.conns.map(c=>connSVG(c,doc)).join("")}${rest.map(s=>shapeSVG(s,v)).join("")}${lay}${pv}${hv}${mq}${rb}</g>`;
}
function viewPt(cx,cy){const r=$q("#drSvg").getBoundingClientRect();return[(cx-r.left-ST.px)/ST.k,(cy-r.top-ST.py)/ST.k]}
let raf=0;
function paint(){cancelAnimationFrame(raf);raf=requestAnimationFrame(paintNow)}
function paintNow(){
 const svg=$q("#drSvg");if(!svg||!ST.doc)return;
 const ae=document.activeElement,fid=ae&&ae.getAttribute&&ae.closest&&svg.contains(ae)?(ae.getAttribute("data-dr-s")||ae.getAttribute("data-dr-c")):null;
 svg.innerHTML=worldSVG();applyNudge();
 if(fid&&ST.kb){const el=svg.querySelector(`[data-dr-s="${fid}"],[data-dr-c="${fid}"]`);if(el)el.focus({preventScroll:true})}
 const em=$q("[data-dr-empty]");if(em)em.hidden=ST.doc.shapes.length>0;
 const z=$q("[data-dr-zoom]");if(z)z.textContent=Math.round(ST.k*100)+"%";
 paintStatus();paintChecks();paintAI();
}
function paintStatus(){
 const el=$q("[data-dr-status]");if(!el||!ST.doc)return;const d=ST.doc,v=D.validate(d);
 el.innerHTML=`<span>${d.shapes.filter(s=>D.isFlow(s.t)).length} steps · ${d.conns.length} connectors · ${v.errs} to fix · ${v.warns} advice</span>${legend([["Person","--accent"],["AI agent (dashed, AI badge)","--p4"],["Robot","--muted"],["Approval gate","--warn-f"]])}<span>Grid ${SD.grid?"on":"off"} · snap ${SD.snap?"on":"off"} · saved copy kept in this session</span>`;
 const st=$q("[data-dr-state]");if(st){st.className="pill "+(ST.dirty?"warn":"good");st.textContent=ST.dirty?"Unsaved changes":"Saved"}
}
function refresh(){
 paint();
 const tb=$q(".dr-toolbar");if(tb){const nm=tb.querySelector("[data-dr-name]"),val=nm&&nm.value,foc=document.activeElement===nm;tb.outerHTML=toolbarHTML();const n2=$q("[data-dr-name]");if(n2&&foc){n2.focus()}}
}
function fitView(){
 const wrap=$q("[data-dr-wrap]"),svg=$q("#drSvg");if(!wrap||!svg||!ST.doc)return;
 const r=svg.getBoundingClientRect();if(r.width<50)return;
 const sh=ST.doc.shapes.filter(s=>s.t!=="swimlane").length?ST.doc.shapes:[];
 if(!sh.length){ST.k=1;ST.px=70;ST.py=60;return}
 const x0=Math.min(...sh.map(s=>s.x)),y0=Math.min(...sh.map(s=>s.y)),x1=Math.max(...sh.map(s=>s.x+s.w)),y1=Math.max(...sh.map(s=>s.y+s.h+(LBL_OUT.has(s.t)?24:0)));
 const bw=x1-x0+100,bh=y1-y0+90,k=Math.max(.3,Math.min(1.25,Math.min(r.width/bw,r.height/bh)));
 ST.k=Math.round(k*100)/100;ST.px=(r.width-(x1-x0)*ST.k)/2-x0*ST.k;ST.py=(r.height-(y1-y0)*ST.k)/2-y0*ST.k;
}
function zoomAt(f,cx,cy){const svg=$q("#drSvg");if(!svg)return;const r=svg.getBoundingClientRect();const k=Math.max(.25,Math.min(2.2,Math.round(ST.k*f*100)/100));const mx=(cx==null?r.width/2:cx-r.left),my=(cy==null?r.height/2:cy-r.top);ST.px=mx-(mx-ST.px)*(k/ST.k);ST.py=my-(my-ST.py)*(k/ST.k);ST.k=k;paintNow()}
function centerOn(ids){const svg=$q("#drSvg");if(!svg)return;const ss=ST.doc.shapes.filter(s=>ids.includes(s.id));if(!ss.length)return;const r=svg.getBoundingClientRect();const x=ss.reduce((a,s)=>a+s.x+s.w/2,0)/ss.length,y=ss.reduce((a,s)=>a+s.y+s.h/2,0)/ss.length;ST.px=r.width/2-x*ST.k;ST.py=r.height/2-y*ST.k;paintNow()}

/* ---------- checks panel and AI draft panel ---------- */
function paintChecks(){
 const el=$q("[data-dr-checks]");if(!el||!ST.doc)return;const v=D.validate(ST.doc);
 const head=`<button type="button" class="dr-chk-h ${v.errs?"bad":v.warns?"warn":"good"}" data-dr-cmd="checks" aria-expanded="${ST.checks}" aria-controls="drChkList"><span class="dr-dot"></span><b>${v.empty?"Nothing to check yet":(v.errs?v.errs+" to fix":v.warns?"Valid, "+v.warns+" advice":"All checks pass")}</b><span class="small muted">${v.oks} of ${v.total} passed</span></button>`;
 el.innerHTML=head+(ST.checks?`<ul id="drChkList" class="dr-chk-l" aria-label="Validation checklist">${v.items.map(i=>`<li class="${i.lv}"><button type="button" ${i.ids.length?`data-dr-chk="${i.ids.join(",")}"`:"disabled"}><span class="dr-ci" aria-hidden="true">${i.lv==="ok"?"✓":i.lv==="err"?"✕":"!"}</span><span><b>${H(i.title)}</b><span class="small muted">${H(i.detail)}</span></span></button></li>`).join("")}</ul>`:"");
}
function paintAI(){
 const el=$q("[data-dr-ai]");if(!el)return;
 if(!ST.aiOpen){el.innerHTML="";return}
 const sel=[...ST.sel][0],from=sel?D.getS(ST.doc,sel):null;
 const L=ST.sugg||[];
 el.innerHTML=`<div class="dr-aicard glass" role="region" aria-label="AI draft"><div class="row sp"><span class="dr-aitag"><i aria-hidden="true">${IC_(D.IC.aistep)}</i> AI draft · a person accepts</span><button type="button" class="dr-ib" data-dr-cmd="ai" aria-label="Close AI draft">${ico("close")}</button></div>
 ${ST.lay?`<p class="small"><b>Proposed tidy layout.</b> Dashed outlines show where each shape would move. Nothing changes until you accept.</p><div class="row"><button class="btn primary" data-dr-cmd="lay_ok">Accept layout</button><button class="btn" data-dr-cmd="lay_no">Discard</button></div>`
 :`<p class="small muted">${from?"After <b>"+H(from.n)+"</b>, a person might add:":"Next steps for the open end of this drawing:"}</p>${L.length?L.map((s,i)=>`<div class="dr-sug"><span class="dr-sugi">${IC_(BY[s.t].ic)}</span><span><b>${H(s.n)}</b><span class="small muted">${H(BY[s.t].name)} · ${H(s.why)}</span></span><span class="pill mute" title="Model confidence in this suggestion">${Math.round(s.conf*100)}%</span><button type="button" class="btn" data-dr-sug="${i}">Add</button></div>`).join(""):'<p class="small muted">Nothing to suggest. The drawing has no open end.</p>'}<div class="row"><button class="btn" data-dr-cmd="lay_ask">Suggest a tidy layout</button></div>`}
 <p class="small muted">Drafted by the Process Drawing Agent from the shapes and names on this canvas. It never saves on its own.</p></div>`;
}

/* ---------- editing operations ---------- */
const snapV=v=>SD.snap?Math.round(v/G)*G:Math.round(v);
const ctr=D.ctr;
function facing(A,B){const a=ctr(A),b=ctr(B),dx=b[0]-a[0],dy=b[1]-a[1];if(Math.abs(dx)>=Math.abs(dy)*.8)return dx>=0?["r","l"]:["l","r"];return dy>=0?["b","t"]:["t","b"]}
function connectShapes(a,b,o){
 o=o||{};const doc=ST.doc,A=D.getS(doc,a),B=D.getS(doc,b);if(!A||!B||a===b)return null;
 const assoc=!(isFlow(A.t)&&isFlow(B.t));
 if(doc.conns.some(c=>c.a===a&&c.b===b))return null;
 if(!assoc&&(A.t==="end"||B.t==="start"))return null;
 let [ap,bp]=o.ap&&o.bp?[o.ap,o.bp]:facing(A,B);
 if(!assoc){ap=D.freePort(doc,A,ap,true)||ap;if(o.bp==null)bp=D.freePort(doc,B,bp,false)||bp}
 const c=D.addConn(doc,a,b,ap,bp,{kind:assoc?"assoc":"flow",lb:assoc?"":D.branchLabel(doc,A),auto:!!o.auto,arrow:assoc&&(D.DATA.has(B.t))});
 SD.conns++;if(o.auto)SD.auto++;return c;
}
function placeShape(t,cx,cy,over,opt){
 opt=opt||{};const c=BY[t];if(!c||ST.ro)return null;let made=null;
 mut(()=>{
  const doc=ST.doc,fl=doc.shapes.filter(s=>isFlow(s.t));
  const ns=D.addShape(doc,t,snapV(cx-c.w/2),snapV(cy-c.h/2),over);
  if(!fl.length&&isFlow(t)&&t!=="start"){D.addShape(doc,"start",ns.x-48-72,Math.round(ns.y+ns.h/2-24));ST.msg="Start was added for you."}
  const hv=insertable(ns)?probeAt(ns,[ns.id]):null;
  let p;
  if(hv&&hv.kind==="conn"){const cn=doc.conns.find(x=>x.id===hv.cid);if(cn){const cs0=D.insertInto(doc,cn,ns);cs0.forEach(()=>{SD.conns++;SD.auto++});D.resolve(doc,[ns.id]);made={shape:ns,plan:{kind:"insert"},conns:cs0};return}}
  if(hv&&hv.kind==="box"){const T=D.getS(doc,hv.id);if(T){const cs0=D.insertBox(doc,T,hv.zone,ns);cs0.forEach(()=>{SD.conns++;SD.auto++});D.resolve(doc,[ns.id]);made={shape:ns,plan:{kind:"insert"},conns:cs0};ST.msg="Placed "+hv.zone+" "+T.n+".";return}}
  p=D.plan(doc,ns);
  if(p&&p.kind==="insert"){const A=D.getS(doc,p.via.a),B=D.getS(doc,p.via.b),bp=p.conn.bp;
   if(bp==="l"&&B.x>=A.x){const gap=B.x-(A.x+A.w),need=ns.w+110;if(gap<need){const sh=need-gap;doc.shapes.forEach(o=>{if(o.t!=="swimlane"&&o.x>=B.x-1)o.x+=sh})}const g2=B.x-(A.x+A.w);ns.x=Math.round(A.x+A.w+(g2-ns.w)/2);ns.y=Math.round(A.y+A.h/2-ns.h/2)}
   else if(bp==="t"&&B.y>=A.y){const gap=B.y-(A.y+A.h),need=ns.h+90;if(gap<need){const sh=need-gap;doc.shapes.forEach(o=>{if(o.t!=="swimlane"&&o.y>=B.y-1)o.y+=sh})}const g2=B.y-(A.y+A.h);ns.y=Math.round(A.y+A.h+(g2-ns.h)/2);ns.x=Math.round(A.x+A.w/2-ns.w/2)}
  }else D.settle(doc,ns,p);
  const cs=D.applyPlan(doc,ns,p);cs.forEach(()=>{SD.conns++;SD.auto++});
  D.resolve(doc,[ns.id]);
  made={shape:ns,plan:p,conns:cs};
 });
 if(made){ST.sel=new Set([made.shape.id]);ST.selC=null;SD.drawn++;
  const p=made.plan;const lab=p&&p.kind==="flow"?" and connected "+(p.up?"to "+p.dst.n:"after "+p.src.n):p&&p.kind==="insert"?" and inserted into the flow":"";
  announce("Added "+c.name+lab+(ST.msg?". "+ST.msg:""));ST.msg="";paint();openProps()}
 return made;
}
function addAuto(t,over){
 const doc=ST.doc;if(!doc)return null;const c=BY[t];const svg=$q("#drSvg");const r=svg?svg.getBoundingClientRect():{width:800,height:500};
 const selS=[...ST.sel].map(i=>D.getS(doc,i)).filter(Boolean)[0];
 let ref=selS&&isFlow(selS.t)&&D.openOut(doc,selS)?selS:null;
 if(!ref&&selS&&D.ACT.has(selS.t))ref=selS;
 if(!ref){const tail=D.order(doc).filter(s=>isFlow(s.t)&&D.openOut(doc,s));ref=tail[tail.length-1]||null}
 let cx,cy;
 if(!doc.shapes.length){cx=(r.width/2-ST.px)/ST.k;cy=(r.height/2-ST.py)/ST.k}
 else if(ref&&!(D.ANN.has(t)||D.DATA.has(t))){const p=D.freePort(doc,ref,"r",true);if(p==="r"||!p){cx=ref.x+ref.w+82+c.w/2;cy=ref.y+ref.h/2}else{cx=ref.x+ref.w/2;cy=ref.y+ref.h+70+c.h/2}}
 else if(ref){cx=ref.x+ref.w+40+c.w/2;cy=ref.y-c.h-14}
 else{const mx=Math.max(...doc.shapes.map(s=>s.x+s.w));cx=mx+90+c.w/2;cy=doc.shapes[0].y+doc.shapes[0].h/2}
 const m=placeShape(t,cx,cy,over);
 if(m){const s=m.shape,rr=$q("#drSvg").getBoundingClientRect(),sx=s.x*ST.k+ST.px,sy=s.y*ST.k+ST.py;if(sx<20||sy<20||sx+s.w*ST.k>rr.width-20||sy+s.h*ST.k>rr.height-20)centerOn([s.id])}
 return m;
}
function delSel(){
 if(ST.selC){const id=ST.selC;mut(()=>{ST.doc.conns=ST.doc.conns.filter(c=>c.id!==id)});ST.selC=null;closeProps();announce("Connector deleted");return}
 const ids=[...ST.sel];if(!ids.length)return;
 mut(()=>{const doc=ST.doc;
  if(ids.length===1){const id=ids[0],ci=D.ins(doc,id),co=D.outs(doc,id);if(ci.length===1&&co.length===1&&ci[0].a!==co[0].b){const a=ci[0],b=co[0];doc.conns=doc.conns.filter(c=>c.a!==id&&c.b!==id);D.addConn(doc,a.a,b.b,a.ap,b.bp,{lb:a.lb||b.lb||"",auto:true});doc.shapes=doc.shapes.filter(s=>s.id!==id);return}}
  doc.conns=doc.conns.filter(c=>!ids.includes(c.a)&&!ids.includes(c.b));doc.shapes=doc.shapes.filter(s=>!ids.includes(s.id))});
 ST.sel.clear();closeProps();announce(ids.length+" shape"+(ids.length>1?"s":"")+" deleted");
}
function copySel(){const ids=new Set([...ST.sel]);if(!ids.size)return;ST.clip={shapes:D.clone(ST.doc.shapes.filter(s=>ids.has(s.id))),conns:D.clone(ST.doc.conns.filter(c=>ids.has(c.a)&&ids.has(c.b))),n:0};announce("Copied "+ids.size+" shape"+(ids.size>1?"s":""))}
function pasteClip(){
 if(!ST.clip||ST.ro)return;const cl=ST.clip;cl.n++;const off=G*2*cl.n,map={};
 mut(()=>{const doc=ST.doc;cl.shapes.forEach(s=>{const n=Object.assign({},s,{id:"n"+(doc.seq++),x:s.x+off,y:s.y+off});map[s.id]=n.id;doc.shapes.push(n)});cl.conns.forEach(c=>doc.conns.push(Object.assign({},c,{id:"c"+(doc.seq++),a:map[c.a],b:map[c.b]})))});
 ST.sel=new Set(Object.values(map));ST.selC=null;paint();announce("Pasted");
}
function dupSel(){copySel();pasteClip()}
function align(how){
 const ss=[...ST.sel].map(i=>D.getS(ST.doc,i)).filter(s=>s&&s.t!=="swimlane");if(ss.length<2)return;
 const L=Math.min(...ss.map(s=>s.x)),R=Math.max(...ss.map(s=>s.x+s.w)),T=Math.min(...ss.map(s=>s.y)),B=Math.max(...ss.map(s=>s.y+s.h));
 mut(()=>{ss.forEach(s=>{if(how==="l")s.x=L;if(how==="r")s.x=R-s.w;if(how==="c")s.x=Math.round((L+R)/2-s.w/2);if(how==="t")s.y=T;if(how==="b")s.y=B-s.h;if(how==="m")s.y=Math.round((T+B)/2-s.h/2)})});
}
function distribute(axis){
 const ss=[...ST.sel].map(i=>D.getS(ST.doc,i)).filter(s=>s&&s.t!=="swimlane");if(ss.length<3)return;
 const k=axis==="h"?"x":"y",z=axis==="h"?"w":"h";ss.sort((a,b)=>a[k]-b[k]);
 const total=ss[ss.length-1][k]+ss[ss.length-1][z]-ss[0][k],used=ss.reduce((a,s)=>a+s[z],0),gap=(total-used)/(ss.length-1);
 mut(()=>{let p=ss[0][k]+ss[0][z]+gap;for(let i=1;i<ss.length-1;i++){ss[i][k]=Math.round(p);p+=ss[i][z]+gap}});
}
function moveBy(dx,dy){const ss=[...ST.sel].map(i=>D.getS(ST.doc,i)).filter(Boolean);if(!ss.length)return;mut(()=>{ss.forEach(s=>{s.x+=dx;s.y+=dy})})}
function announce(t){const el=$q("#drLive");if(el)el.textContent=t}
function toast_(t,k){try{toast(t,k||"good")}catch(e){}}

/* ---------- properties drawer ---------- */
function drawerEl(){return document.getElementById("drawer")}
function ensureManual(){const d=drawerEl();if(!d)return;if(d.getAttribute("popover")!=="manual"){try{d.hidePopover()}catch(e){}d.setAttribute("popover","manual")}document.body.classList.add("dr-on")}
function studioClass(){const st=$q("[data-dr-studio]"),d=drawerEl();const open=!!(d&&d.dataset.dr&&d.matches(":popover-open"));if(st)st.classList.toggle("autocol",open);document.body.classList.toggle("dr-drawer",open)}
function closeProps(){const d=drawerEl();if(d&&d.dataset.dr){delete d.dataset.dr;try{closeDrawer()}catch(e){}}studioClass()}
function issuesHTML(id){const v=D.validate(ST.doc),L=v.issuesFor(id);return L.length?`<ul class="dr-iss">${L.map(i=>`<li class="${i.lv}"><b>${H(i.title)}.</b> ${H(i.detail)}</li>`).join("")}</ul>`:'<p class="small dr-okline"><span class="pill good">No checks to fix on this shape</span></p>'}
function whoChips(s){return `<div class="dr-who" role="group" aria-label="Who acts">${D.WHOS.map(w=>`<button type="button" class="chip" data-dr-who="${w}" aria-pressed="${(s.who||BY[s.t].who)===w}">${WHOL[w]}</button>`).join("")}</div>`}
const EVT_=s=>D.EVT.has(s.t);
function propsHTML(s){
 const t=s.t,c=BY[t],act=D.ACT.has(t),gw=D.GW.has(t),flow=isFlow(t);
 const input=(k,ph,list)=>`<input class="fin" id="drp_${k}" data-dr-p="${k}" value="${H(s[k])}" placeholder="${H(ph||"")}" ${list?`list="${list}"`:""} autocomplete="off">`;
 const lab=(k,txt)=>`<label class="small" for="drp_${k}"><b>${H(txt)}</b></label>`;
 const own=act&&!s.owner?ownerSuggest(s):null;
 const outsL=D.outs(ST.doc,s.id).concat(ST.doc.conns.filter(x=>x.kind==="assoc"&&(x.a===s.id||x.b===s.id))),insL=D.ins(ST.doc,s.id);
 const others=ST.doc.shapes.filter(o=>o.id!==s.id&&o.t!=="swimlane");
 const cRow=(cn,dir)=>{const o=D.getS(ST.doc,dir==="out"?cn.b:cn.a);return `<div class="dr-cr"><span class="small">${dir==="out"?"to":"from"} <b>${H(o?o.n:"?")}</b>${cn.kind==="assoc"?' <span class="pill mute">link</span>':""}</span>${dir==="out"&&cn.kind==="flow"&&(s.t==="gateway"||s.t==="parallel"||cn.lb)?`<input class="fin dr-lbi" data-dr-cl="${cn.id}" value="${H(cn.lb)}" placeholder="Label, e.g. Yes" aria-label="Label for the connector to ${H(o?o.n:"")}">`:""}<button type="button" class="btn quiet" data-dr-crev="${cn.id}" aria-label="Reverse direction">Reverse</button><button type="button" class="btn quiet" data-dr-crm="${cn.id}" aria-label="Remove connector">Remove</button></div>`};
 return `<div data-dr-props="${s.id}" class="dr-props"><datalist id="drOwners">${peopleNames().map(n=>`<option value="${H(n)}"></option>`).join("")}</datalist><datalist id="drSys">${sysNames().map(n=>`<option value="${H(n)}"></option>`).join("")}</datalist>
 <div class="eyebrow">Process drawing · ${H(c.name)}</div><h2 class="dr-ph" data-dr-ph>${H(s.n||c.name)}</h2>
 <p class="small muted">${H(c.tip)}</p>${issuesHTML(s.id)}
 <div class="dr-f">${lab("n","Name")}${input("n","What happens, in a few words")}</div>
 ${act||gw?`<div class="dr-f"><span class="small"><b>Who acts</b></span>${whoChips(s)}<span class="small muted">A person uses judgment, an AI agent drafts inside guardrails, an automatic action runs on rules, a gate needs a named approver.</span></div>`:""}
 ${act?`<div class="dr-f">${lab("owner","Owner")}<div class="dr-orow">${input("owner","Person, team or AI agent","drOwners")}</div>${s.owner&&window.pchip?`<div class="dr-ochip">${pchip(s.owner)}</div>`:""}${own&&own.name!==s.owner?`<div class="dr-sugo"><span class="dr-aitag"><i aria-hidden="true">${IC_(D.IC.aistep)}</i> AI draft</span><span class="small">Suggested owner: <b>${H(own.name)}</b>. ${H(own.why)}.</span><button type="button" class="btn" data-dr-accown="${H(own.name)}">Accept</button></div>`:""}${s.t==="aistep"||s.who==="agent"?'<span class="small muted">For an AI agent, name the agent as owner and its human sponsor in the description.</span>':""}</div>
 <div class="grid g2 dr-g2"><div class="dr-f">${lab("sla","Target time (SLA)")}${input("sla","e.g. 4 business hours")}</div><div class="dr-f">${lab("sys","System")}${input("sys","Where this happens","drSys")}</div></div>
 <div class="grid g2 dr-g2"><div class="dr-f">${lab("inp","Inputs")}${input("inp","What it needs")}</div><div class="dr-f">${lab("out","Outputs")}${input("out","What it produces")}</div></div>
 <div class="dr-f">${lab("ctl","Controls")}${input("ctl","e.g. four-eyes review, limit check")}</div>`:""}
 ${t==="datastore"||t==="document"?`<div class="dr-f">${lab("sys","System of record")}${input("sys","Where it lives","drSys")}</div>`:""}
 ${s.t==="gateway"?`<div class="dr-f">${lab("rule","Decision rule")}<div class="row"><select class="fin" id="drp_rule" data-dr-p="rule"><option value="">No rule linked (describe it in the description)</option>${rules().map(r=>`<option value="${H(r.id)}" ${s.rule===r.id?"selected":""}>${H(r.name)}</option>`).join("")}</select><button type="button" class="btn" data-dr-rule>Open decision tables</button></div><span class="small muted">Linking a table lets the workflow designer run the same rule.</span></div>`:""}
 ${s.t==="swimlane"?`<div class="dr-f">${lab("lane","Role for this lane")}${input("lane","e.g. Finance controller")}</div>`:""}
 ${act?`<div class="dr-f">${lab("lane","Swimlane role")}${input("lane","Empty uses the owner's role")}</div>`:""}
 <div class="dr-f">${lab("note","Description")}<textarea class="fin" id="drp_note" data-dr-p="note" rows="3" placeholder="What happens here, and why">${H(s.note)}</textarea></div>
 ${flow?`<div class="dr-f"><span class="small"><b>Connections</b></span>${insL.map(x=>cRow(x,"in")).join("")}${outsL.map(x=>cRow(x,"out")).join("")||'<span class="small muted">No exits yet. Drop a shape next to this one, drag from a dot on its edge, or use Connect to.</span>'}<div class="row"><label class="sr" for="drp_to">Connect to</label><select class="fin" id="drp_to" data-dr-cto><option value="">Connect to…</option>${others.map(o=>`<option value="${o.id}">${H(o.n)} (${H(BY[o.t].name)})</option>`).join("")}</select><button type="button" class="btn" data-dr-conn>Connect</button></div></div>`:""}
 <div class="row dr-pact"><button type="button" class="btn" data-dr-cmd="dup">Duplicate</button><button type="button" class="btn danger" data-dr-cmd="del">Delete</button>${flow?'<button type="button" class="btn" data-dr-ai-after>Suggest what comes next</button>':""}</div></div>`;
}
function connHTML(c){
 const A=D.getS(ST.doc,c.a),B=D.getS(ST.doc,c.b);
 return `<div data-dr-props-c="${c.id}" class="dr-props"><div class="eyebrow">Process drawing · ${c.kind==="assoc"?"Link":"Connector"}</div><h2 class="dr-ph">${H(A?A.n:"?")} to ${H(B?B.n:"?")}</h2>
 <p class="small muted">${c.kind==="assoc"?"A dashed link joins a document, note, risk or control to a step. It does not carry the flow.":"A connector carries the flow from one step to the next. Exits of a decision should be labeled."}</p>
 <div class="dr-f"><label class="small" for="drc_lb"><b>Label</b></label><input class="fin" id="drc_lb" data-dr-cl="${c.id}" value="${H(c.lb)}" placeholder="e.g. Yes, No, Rejected" autocomplete="off"></div>
 <div class="row dr-pact"><button type="button" class="btn" data-dr-crev="${c.id}">Reverse direction</button><button type="button" class="btn danger" data-dr-crm="${c.id}">Delete connector</button></div></div>`;
}
function openProps(){
 if(ST.ro||!ST.doc)return;
 let html=null;
 if(ST.selC){const c=ST.doc.conns.find(x=>x.id===ST.selC);if(c)html=connHTML(c)}
 else if(ST.sel.size===1){const s=D.getS(ST.doc,[...ST.sel][0]);if(s)html=propsHTML(s)}
 if(!html){closeProps();return}
 ensureManual();openDrawer(html);const d=drawerEl();d.dataset.dr="1";
 setTimeout(studioClass,60);
}

/* ---------- pointer interaction ---------- */
let ghost=null,space=false,clickGuard=0;
function overSvg(cx,cy){const s=$q("#drSvg");if(!s)return false;const r=s.getBoundingClientRect();return cx>=r.left&&cx<=r.right&&cy>=r.top&&cy<=r.bottom}
function previewFor(type,cx,cy){
 const [wx,wy]=viewPt(cx,cy),c=BY[type],doc=ST.doc;
 const hypo={id:"__g",t:type,x:snapV(wx-c.w/2),y:snapV(wy-c.h/2),w:c.w,h:c.h,n:"x"};
 const raw=Object.assign({},hypo);
 const tmp={shapes:doc.shapes.concat([hypo]),conns:doc.conns,seq:0};
 const p=D.plan(doc,hypo);D.settle({shapes:doc.shapes},hypo,p);
 let line="",src=null,via=null;
 if((p.kind==="flow"||p.kind==="assoc")&&p.conn){const cn=Object.assign({id:"__c"},p.conn);const pts=D.route(tmp,cn);line=`<path class="dr-prevline" d="${D.pathD(pts)}"/>`;src=p.src&&p.src.id;if(p.kind==="flow"&&p.src&&p.src.t==="gateway"&&p.conn.lb)line+=`<text class="dr-prevlb" x="${D.labelPt(pts)[0]}" y="${D.labelPt(pts)[1]-6}" text-anchor="middle">${H(p.conn.lb)}</text>`}
 else if(p.kind==="insert"){via=p.via.id;line=`<path class="dr-prevline" d="${D.pathD(D.route(doc,p.via))}"/>`}
 ST.prev={sh:hypo,line,src,via,kind:p.kind};
 const hv=insertable(raw)?probeAt(raw,[raw.id]):null;ST.hov=hv;if(hv)ST.prev=null;
}
/* ===== R14: insert between, box nudge, hover handle, mini picker ===== */
const reduceMo=()=>matchMedia("(prefers-reduced-motion: reduce)").matches||document.documentElement.dataset.motion==="reduced";
const insertable=s=>!!s&&(D.ACT.has(s.t)||s.t==="gateway"||s.t==="parallel"||s.t==="merge"||s.t==="wait");
function projPt(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;let t=l?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));return[a[0]+t*dx,a[1]+t*dy]}
function probeAt(sh,self){
 const doc=ST.doc;if(!doc)return null;const c0=D.ctr(sh);let T=null;
 doc.shapes.forEach(o=>{if(self.includes(o.id)||!isFlow(o.t))return;if(c0[0]>=o.x&&c0[0]<=o.x+o.w&&c0[1]>=o.y&&c0[1]<=o.y+o.h)T=o});
 if(T){const fx=(c0[0]-T.x)/T.w,zone=fx<.34?"before":fx>.66?"after":"branch";
  const nudge=zone==="before"?[{id:T.id,dx:10,dy:0}]:zone==="after"?[{id:T.id,dx:-10,dy:0}]:[{id:T.id,dx:0,dy:-10}];
  return{kind:"box",id:T.id,zone,nudge,pt:[T.x+T.w/2,T.y]}}
 const skip=doc.conns.filter(c=>self.includes(c.a)||self.includes(c.b)).map(c=>c.id);
 const hit=D.hitConn(doc,c0,18,skip);
 if(hit){const c=hit.c,A=D.getS(doc,c.a),B=D.getS(doc,c.b),hor=B.x>A.x+A.w&&c.ap!=="b";
  const pt=projPt(c0,hit.pts[hit.i-1],hit.pts[hit.i]);
  return{kind:"conn",cid:c.id,pt,nudge:[{id:A.id,dx:hor?-10:0,dy:hor?0:-10},{id:B.id,dx:hor?10:0,dy:hor?0:10}]}}
 return null;
}
function hovSVG(){
 const h=ST.hov;if(!h||!ST.doc)return"";const k=1/ST.k;
 if(h.kind==="conn"){const x=h.pt[0],y=h.pt[1];return `<g class="dr-hov" aria-hidden="true"><circle class="dr-insdot" cx="${x}" cy="${y}" r="${5*k}"/><g transform="translate(${x} ${y-24*k}) scale(${k})"><rect class="dr-inspill" x="-50" y="-12" width="100" height="24" rx="12"/><text class="dr-insl" text-anchor="middle" y="4.5">+ Insert here</text></g></g>`}
 const T=D.getS(ST.doc,h.id);if(!T)return"";
 const off=reduceMo()||!h.nudge?{dx:0,dy:0}:h.nudge[0],Z=[["before","Place before"],["branch","Branch"],["after","Place after"]],w=T.w/3;
 const cells=Z.map((z,i)=>`<rect class="dr-zone${h.zone===z[0]?" on":""}" x="${T.x+off.dx+i*w}" y="${T.y+off.dy}" width="${w}" height="${T.h}" rx="${i===1?2:10}"/>`).join("");
 const strip=Z.map((z,i)=>`<g class="dr-zp${h.zone===z[0]?" on":""}" transform="translate(${(i-1)*94} 0)"><rect x="-45" y="-12" width="90" height="24" rx="12"/><text text-anchor="middle" y="4.5">${z[1]}</text></g>`).join("");
 return `<g class="dr-hov" aria-hidden="true">${cells}<g transform="translate(${T.x+off.dx+T.w/2} ${T.y+off.dy-24*k}) scale(${k})">${strip}</g></g>`;
}
function applyNudge(){
 const h=ST.hov,svg=$q("#drSvg");if(!svg)return;
 if(!h||!h.nudge||reduceMo()){ST.nk="";return}
 const key=h.nudge.map(n=>n.id+":"+n.dx+":"+n.dy).join();
 h.nudge.forEach(n=>{const el=svg.querySelector(`[data-dr-s="${n.id}"]`);if(!el)return;el.style.translate=n.dx+"px "+n.dy+"px";
  if(ST.nk!==key&&el.animate)try{el.animate([{translate:"0px 0px"},{translate:(n.dx*1.7)+"px "+(n.dy*1.7)+"px",offset:.55},{translate:n.dx+"px "+n.dy+"px"}],{duration:320,easing:"cubic-bezier(.3,.9,.4,1)"})}catch(e){}});
 ST.nk=key;
}
function finishMove(d){
 const doc=ST.doc,hv=ST.hov;ST.hov=null;ST.nk="";
 if(d.ids.length===1&&hv){const s=D.getS(doc,d.ids[0]);
  if(insertable(s)){const tc=hv.kind==="conn"?doc.conns.find(x=>x.id===hv.cid):null,ts=hv.kind==="box"?D.getS(doc,hv.id):null;
   if(tc||ts){if(D.detach(doc,s)){const cs=tc?D.insertInto(doc,tc,s):D.insertBox(doc,ts,hv.zone,s);SD.conns+=cs.length;SD.auto+=cs.length;announce("Moved "+s.n+" into the flow"+(ts?" ("+hv.zone+" "+ts.n+")":""))}
    else toast_("That shape has several connectors, so it was moved but not inserted.","warn")}}}
 D.resolve(doc,d.ids);
}
/* hover handle and the mini shape picker */
const MINI=["task","gateway","approval","aistep","notification","wait"],MINI_L={task:"Task",gateway:"Decision",approval:"Approval",aistep:"AI step",notification:"Notify",wait:"Wait"};
let mini=null,plusT=0;
function closeMini(){if(mini){mini.remove();mini=null}}
function insertAtConn(cid,type){
 let made=null;
 mut(()=>{const doc=ST.doc,c=doc.conns.find(x=>x.id===cid);if(!c)return;const ns=D.addShape(doc,type,0,0),cs=D.insertInto(doc,c,ns);SD.conns+=cs.length;SD.auto+=cs.length;D.resolve(doc,[ns.id]);made=ns});
 if(made){ST.sel=new Set([made.id]);ST.selC=null;SD.drawn++;announce("Inserted "+BY[type].name+" into the connector");paint();openProps()}
 return made;
}
function openMini(cid){
 closeMini();const doc=ST.doc,c=doc&&doc.conns.find(x=>x.id===cid);if(!c||c.kind!=="flow"||ST.ro)return;
 const m=D.midPt(doc,c,c.lb?.62:.5),svg=$q("#drSvg");if(!m||!svg)return;const r=svg.getBoundingClientRect();
 const sx=r.left+ST.px+m[0]*ST.k,sy=r.top+ST.py+m[1]*ST.k;
 const el=document.createElement("div");el.className="dr-mini";el.setAttribute("role","menu");el.setAttribute("aria-label","Insert a step here");el.dataset.cid=cid;
 el.innerHTML=`<div class="dr-mini-t">Insert here</div><div class="dr-mini-g">${MINI.map(t=>`<button type="button" role="menuitem" class="dr-mini-b" data-dr-mini="${t}" data-cid="${cid}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${BY[t].ic}"/></svg><span>${MINI_L[t]}</span></button>`).join("")}</div>`;
 document.body.appendChild(el);const w=el.offsetWidth,h=el.offsetHeight;
 el.style.left=Math.max(8,Math.min(innerWidth-w-8,sx-w/2))+"px";el.style.top=(sy+20+h>innerHeight-8?Math.max(8,sy-20-h):sy+20)+"px";
 mini=el;hidePlus();const b=el.querySelector("button");if(b)b.focus();
}
function hidePlus(){clearTimeout(plusT);const e=$q("#drWorld .dr-plus");if(e)e.remove()}
function showPlus(cid){
 if(ST.drag||ST.ro||!ST.doc||mini)return;const w=$q("#drWorld");if(!w)return;
 const ex=w.querySelector(".dr-plus");if(ex&&ex.dataset.drPlus===cid){clearTimeout(plusT);return}
 hidePlus();const c=ST.doc.conns.find(x=>x.id===cid);if(!c||c.kind!=="flow")return;const m=D.midPt(ST.doc,c,c.lb?.62:.5);if(!m)return;
 w.insertAdjacentHTML("beforeend",`<g class="dr-plus" data-dr-plus="${cid}" transform="translate(${m[0]} ${m[1]}) scale(${1/ST.k})" role="button" tabindex="0" aria-label="Insert a step here"><title>Insert a step here</title><circle r="13" class="dr-plus-bg"/><path d="M-5.5 0H5.5M0 -5.5V5.5"/></g>`);
}
document.addEventListener("mouseover",e=>{
 if(S.screen!=="draw_studio"||!ST.doc||ST.drag)return;const t=e.target;if(!t.closest)return;
 const cn=t.closest("#drSvg [data-dr-c]"),pl=t.closest(".dr-plus");
 if(cn&&!cn.classList.contains("assoc"))showPlus(cn.dataset.drC);else if(pl)clearTimeout(plusT);else if($q("#drWorld .dr-plus")){clearTimeout(plusT);plusT=setTimeout(hidePlus,320)}
},true);
document.addEventListener("focusin",e=>{if(S.screen!=="draw_studio"||!ST.doc)return;const cn=e.target.closest&&e.target.closest("#drSvg [data-dr-c]");if(cn&&!cn.classList.contains("assoc"))showPlus(cn.dataset.drC)});
document.addEventListener("pointerdown",e=>{
 if(S.screen!=="draw_studio")return;const t=e.target;if(!t.closest)return;
 const pl=t.closest("[data-dr-plus]");if(pl){e.preventDefault();e.stopImmediatePropagation();openMini(pl.dataset.drPlus);return}
 if(mini&&!t.closest(".dr-mini"))closeMini();
},true);
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-dr-mini]");if(!b)return;e.preventDefault();const cid=b.dataset.cid,t=b.dataset.drMini;closeMini();insertAtConn(cid,t);const s=$q("#drSvg");if(s)s.focus({preventScroll:true})},true);
document.addEventListener("keydown",e=>{
 const t=e.target;
 if(mini&&t.closest&&t.closest(".dr-mini")){
  if(e.key==="Escape"){e.preventDefault();e.stopPropagation();const id=mini.dataset.cid;closeMini();const s=$q("#drSvg");if(s)s.focus({preventScroll:true});ST.selC=id;return}
  const bs=$$q(".dr-mini-b",mini),i=bs.indexOf(t);
  if(/^Arrow/.test(e.key)&&i>=0){e.preventDefault();e.stopPropagation();const n=(e.key==="ArrowRight"||e.key==="ArrowDown")?(i+1)%bs.length:(i-1+bs.length)%bs.length;bs[n].focus()}
  return;
 }
 if(S.screen!=="draw_studio"||!ST.doc||ST.ro)return;
 if(t.closest&&t.closest(".dr-plus")&&(e.key==="Enter"||e.key===" ")){e.preventDefault();e.stopPropagation();openMini(t.closest(".dr-plus").dataset.drPlus);return}
 if(e.key==="Enter"||e.key==="+"||e.key==="="){
  const typing=t.matches&&t.matches("input,textarea,select,[contenteditable='true']");if(typing||e.ctrlKey||e.metaKey)return;
  const cel=t.closest&&t.closest("#drSvg [data-dr-c]"),inCanvas=t===document.body||(t.closest&&(t.closest("#drSvg")||!t.closest("button,a,summary,[role=button],[role=menuitem]")));
  const id=cel?cel.dataset.drC:(ST.selC&&inCanvas?ST.selC:null);
  if(id){const c=ST.doc.conns.find(x=>x.id===id);if(c&&c.kind==="flow"){e.preventDefault();e.stopPropagation();ST.selC=id;ST.sel.clear();openMini(id)}}
 }
},true);
window.addEventListener("scroll",closeMini,true);
document.addEventListener("pointerdown",e=>{
 if(!ST.doc||S.screen!=="draw_studio")return;
 if(e.pointerType==="mouse"&&e.button>1)return;
 const pi=e.target.closest("[data-dr-pi]");
 if(pi&&!ST.ro){ST.drag={k:"pal",type:pi.dataset.drPi,x0:e.clientX,y0:e.clientY,moved:false};return}
 const svg=e.target.closest("#drSvg");if(!svg||ST.ro)return;
 if(ST.edit)endEdit(true);
 const port=e.target.closest("[data-dr-port]"),sh=e.target.closest("[data-dr-s]"),cn=e.target.closest("[data-dr-c]");
 svg.focus({preventScroll:true});ST.kb=false;
 if(port&&sh){e.preventDefault();const s=D.getS(ST.doc,sh.dataset.drS),p=D.portPt(s,port.dataset.drPort);ST.drag={k:"conn",from:s.id,port:port.dataset.drPort,sx:p[0],sy:p[1],x1:p[0],y1:p[1],moved:false,cx0:e.clientX,cy0:e.clientY};return}
 if(sh&&!(ST.tool==="pan"||space||e.button===1)){
  e.preventDefault();const id=sh.dataset.drS;
  if(e.shiftKey||e.ctrlKey||e.metaKey){if(ST.sel.has(id))ST.sel.delete(id);else ST.sel.add(id)}else if(!ST.sel.has(id))ST.sel=new Set([id]);
  ST.selC=null;
  let ids=[...ST.sel];const orig={};
  const dsh=D.getS(ST.doc,id);
  if(dsh&&dsh.t==="swimlane"&&ids.length===1){ST.doc.shapes.forEach(o=>{if(o.t!=="swimlane"&&o.x>=dsh.x&&o.x<dsh.x+dsh.w&&o.y+o.h/2>=dsh.y&&o.y+o.h/2<=dsh.y+dsh.h)ids.push(o.id)})}
  ids.forEach(i=>{const o=D.getS(ST.doc,i);if(o)orig[i]=[o.x,o.y]});
  ST.drag={k:"move",ids,orig,cx0:e.clientX,cy0:e.clientY,moved:false,snapshot:snap(),sid:id};paint();return;
 }
 if(cn&&!(ST.tool==="pan"||space)){e.preventDefault();ST.selC=cn.dataset.drC;ST.sel.clear();paint();openProps();setTimeout(()=>{const sv=$q("#drSvg");if(sv&&ST.selC&&!ST.edit&&!(document.activeElement&&document.activeElement.matches&&document.activeElement.matches("input,textarea,select")))sv.focus({preventScroll:true})},90);return}
 if(ST.tool==="pan"||space||e.button===1){e.preventDefault();ST.drag={k:"pan",cx0:e.clientX,cy0:e.clientY,px:ST.px,py:ST.py,moved:false};svg.classList.add("panning");return}
 const [wx,wy]=viewPt(e.clientX,e.clientY);
 if(!(e.shiftKey||e.ctrlKey||e.metaKey)){ST.sel.clear();ST.selC=null;closeProps()}
 ST.drag={k:"marq",x0:wx,y0:wy,x1:wx,y1:wy,moved:false,cx0:e.clientX,cy0:e.clientY,add:e.shiftKey||e.ctrlKey||e.metaKey};paint();
},true);
document.addEventListener("pointermove",e=>{
 const d=ST.drag;if(!d)return;
 const dx=e.clientX-(d.cx0!=null?d.cx0:d.x0),dy=e.clientY-(d.cy0!=null?d.cy0:d.y0);
 if(d.k==="pal"){
  if(!d.moved&&Math.hypot(dx,dy)>5){d.moved=true;ghost=document.createElement("div");ghost.className="dr-ghost";const it=BY[d.type];ghost.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${it.ic}"/></svg><span>${H(it.name)}</span>`;document.body.appendChild(ghost);document.body.classList.add("dr-dragging")}
  if(d.moved){ghost.style.transform=`translate(${e.clientX+12}px,${e.clientY+12}px)`;const over=overSvg(e.clientX,e.clientY);ghost.classList.toggle("ok",over);if(over){previewFor(d.type,e.clientX,e.clientY)}else{ST.prev=null;ST.hov=null}paint()}
  return;
 }
 if(!d.moved&&Math.hypot(dx,dy)>3){d.moved=true;if(d.k==="move"){ST.undo.push(d.snapshot);if(ST.undo.length>100)ST.undo.shift();ST.redo=[];}}
 if(!d.moved)return;
 if(d.k==="move"){d.ids.forEach(i=>{const o=D.getS(ST.doc,i);if(o){o.x=snapV(d.orig[i][0]+dx/ST.k);o.y=snapV(d.orig[i][1]+dy/ST.k)}});const ms=d.ids.length===1?D.getS(ST.doc,d.ids[0]):null;ST.hov=ms&&insertable(ms)?probeAt(ms,[ms.id]):null;paint()}
 else if(d.k==="pan"){ST.px=d.px+dx;ST.py=d.py+dy;paint()}
 else if(d.k==="marq"){const p=viewPt(e.clientX,e.clientY);d.x1=p[0];d.y1=p[1];paint()}
 else if(d.k==="conn"){const p=viewPt(e.clientX,e.clientY);d.x1=p[0];d.y1=p[1];const t=document.elementFromPoint(e.clientX,e.clientY),sh=t&&t.closest&&t.closest("[data-dr-s]");const tid=sh&&sh.dataset.drS!==d.from?sh.dataset.drS:null;if(d.over!==tid){d.over=tid;$$q("#drSvg .dr-s.drop").forEach(x=>x.classList.remove("drop"));if(tid){const el=$q(`#drSvg [data-dr-s="${tid}"]`);if(el)el.classList.add("drop")}}paint()}
},true);
document.addEventListener("pointerup",e=>{
 const d=ST.drag;if(!d)return;ST.drag=null;document.body.classList.remove("dr-dragging");const svg=$q("#drSvg");if(svg)svg.classList.remove("panning");
 if(d.k==="pal"){
  if(ghost){ghost.remove();ghost=null}ST.prev=null;ST.hov=null;
  if(d.moved){clickGuard=Date.now();if(overSvg(e.clientX,e.clientY)){const [wx,wy]=viewPt(e.clientX,e.clientY);placeShape(d.type,wx,wy)}else{paint();toast_("Drop the shape on the canvas to add it.","warn")}}
  else{clickGuard=Date.now();addAuto(d.type);const b=$q(`[data-dr-pi="${d.type}"]`);if(b)b.focus()}
  return;
 }
 if(d.k==="move"){
  if(d.moved){finishMove(d);ST.dirty=true;ST.doc.rev++;persist();refresh();const dr=drawerEl();if(dr&&dr.dataset.dr)openProps()}
  else{if(ST.sel.size===1)openProps();else closeProps();paint()}
 }
 else if(d.k==="pan"){paint()}
 else if(d.k==="marq"){
  if(d.moved){const x0=Math.min(d.x0,d.x1),x1=Math.max(d.x0,d.x1),y0=Math.min(d.y0,d.y1),y1=Math.max(d.y0,d.y1);if(!d.add)ST.sel.clear();ST.doc.shapes.forEach(s=>{if(s.t==="swimlane")return;if(s.x<x1&&s.x+s.w>x0&&s.y<y1&&s.y+s.h>y0)ST.sel.add(s.id)});announce(ST.sel.size+" selected")}
  paint();
 }
 else if(d.k==="conn"){
  const t=document.elementFromPoint(e.clientX,e.clientY),sh=t&&t.closest&&t.closest("[data-dr-s]"),pt=t&&t.closest&&t.closest("[data-dr-port]");
  $$q("#drSvg .dr-s.drop").forEach(x=>x.classList.remove("drop"));
  if(!d.moved){paint();return}
  if(sh&&sh.dataset.drS!==d.from){const tid=sh.dataset.drS;let made=null;mut(()=>{made=connectShapes(d.from,tid,pt&&pt.closest("[data-dr-s]")===sh?{ap:d.port,bp:pt.dataset.drPort}:{ap:d.port})});if(made){announce("Connected");ST.selC=made.id;ST.sel.clear();paint();openProps()}else{toast_("Those two shapes are already connected, or the direction is not allowed.","warn")}}
  else if(Math.hypot(e.clientX-d.cx0,e.clientY-d.cy0)>70&&overSvg(e.clientX,e.clientY)){
   const [wx,wy]=viewPt(e.clientX,e.clientY),src=D.getS(ST.doc,d.from);if(src&&isFlow(src.t)&&src.t!=="end"){let ns=null;mut(()=>{const c=BY.task;ns=D.addShape(ST.doc,"task",snapV(wx-c.w/2),snapV(wy-c.h/2));const bp=D.OPP[d.port];D.addConn(ST.doc,src.id,ns.id,d.port,bp,{lb:D.branchLabel(ST.doc,src),auto:false});SD.conns++});if(ns){ST.sel=new Set([ns.id]);paint();openProps()}}
  }else paint();
 }
},true);
document.addEventListener("click",e=>{if(Date.now()-clickGuard<400&&e.target.closest&&e.target.closest("[data-dr-pi]")){e.preventDefault();e.stopPropagation();return}
 const pi=e.target.closest&&e.target.closest("[data-dr-pi]");if(pi&&S.screen==="draw_studio"&&e.detail===0&&!ST.ro){addAuto(pi.dataset.drPi)}},true);
document.addEventListener("wheel",e=>{const svg=e.target.closest&&e.target.closest("#drSvg");if(!svg||!ST.doc)return;e.preventDefault();if(e.ctrlKey||e.metaKey){zoomAt(e.deltaY<0?1.1:1/1.1,e.clientX,e.clientY)}else{ST.px-=e.deltaX;ST.py-=e.deltaY;paintNow()}},{passive:false});
document.addEventListener("dblclick",e=>{const sh=e.target.closest&&e.target.closest("#drSvg [data-dr-s]");if(sh&&!ST.ro){startEdit(sh.dataset.drS)}});
document.addEventListener("focusin",e=>{const sh=e.target.closest&&e.target.closest("#drSvg [data-dr-s]");if(sh&&!ST.drag&&!ST.ro){const id=sh.dataset.drS;if(!(ST.sel.size===1&&ST.sel.has(id))){ST.sel=new Set([id]);ST.selC=null;ST.kb=true;paint();const dr=drawerEl();if(dr&&dr.dataset.dr)openProps()}}});
document.addEventListener("focusout",e=>{if(e.target.closest&&e.target.closest("[data-dr-p],[data-dr-cl]"))ST.fs=null});

/* inline rename */
function startEdit(id){
 const s=D.getS(ST.doc,id),wrap=$q("[data-dr-wrap]"),svg=$q("#drSvg");if(!s||!wrap)return;
 const r=svg.getBoundingClientRect(),wr=wrap.getBoundingClientRect();
 const inp=document.createElement("input");inp.className="fin dr-inline";inp.value=s.n;inp.setAttribute("aria-label","Rename "+s.n);
 const w=Math.max(150,s.w*ST.k);inp.style.cssText=`left:${r.left-wr.left+ST.px+s.x*ST.k+s.w*ST.k/2-w/2}px;top:${r.top-wr.top+ST.py+(s.y+s.h/2)*ST.k-16}px;width:${w}px`;
 wrap.appendChild(inp);inp.focus();inp.select();ST.edit={id,inp};
 inp.addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();endEdit(true)}else if(ev.key==="Escape"){ev.preventDefault();ev.stopPropagation();endEdit(false)}});
 inp.addEventListener("blur",()=>{if(ST.edit)endEdit(true)});
}
function endEdit(ok){const e=ST.edit;if(!e)return;ST.edit=null;const v=e.inp.value.trim();e.inp.remove();if(ok&&v){const s=D.getS(ST.doc,e.id);if(s&&s.n!==v){mut(()=>{s.n=v});const dr=drawerEl();if(dr&&dr.dataset.dr)openProps()}}}

/* ---------- keyboard ---------- */
document.addEventListener("keydown",e=>{
 if(!ST.doc||S.screen!=="draw_studio")return;
 const tg=e.target,typing=tg.matches&&tg.matches("input,textarea,select,[contenteditable='true']");
 if(e.key==="Escape"){
  if(ST.edit){return}
  if(ST.drag){if(ghost){ghost.remove();ghost=null}document.body.classList.remove("dr-dragging");ST.drag=null;ST.prev=null;ST.hov=null;paint();return}
  if(ST.lay){ST.lay=null;paint();return}
  if(ST.sel.size||ST.selC||(drawerEl()&&drawerEl().dataset.dr)){ST.sel.clear();ST.selC=null;closeProps();paint();const s=$q("#drSvg");if(s)s.focus({preventScroll:true})}
  return;
 }
 const pi=tg.closest&&tg.closest("[data-dr-pi]");
 if(pi&&/^Arrow/.test(e.key)){const items=$$q("[data-dr-pi]",pi.closest(".dr-items,.dr-railitems")),i=items.indexOf(pi),n=(e.key==="ArrowDown"||e.key==="ArrowRight")?i+1:i-1;if(items[n]){e.preventDefault();items[n].focus()}return}
 if(typing)return;
 const mod=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
 if(ST.ro)return;
 if(mod&&k==="z"){e.preventDefault();e.shiftKey?redo():undo();return}
 if(mod&&k==="y"){e.preventDefault();redo();return}
 if(mod&&k==="c"){e.preventDefault();copySel();return}
 if(mod&&k==="v"){e.preventDefault();pasteClip();return}
 if(mod&&k==="d"){e.preventDefault();dupSel();return}
 if(mod&&k==="a"){e.preventDefault();ST.sel=new Set(ST.doc.shapes.filter(s=>s.t!=="swimlane").map(s=>s.id));paint();return}
 if(mod&&k==="s"){e.preventDefault();saveDraft();return}
 if(e.key==="Delete"||e.key==="Backspace"){if(ST.sel.size||ST.selC){e.preventDefault();delSel()}return}
 if(/^Arrow/.test(e.key)&&ST.sel.size&&!(tg.closest&&tg.closest("[data-dr-pi]"))){e.preventDefault();const st=e.shiftKey?1:G,dx=e.key==="ArrowLeft"?-st:e.key==="ArrowRight"?st:0,dy=e.key==="ArrowUp"?-st:e.key==="ArrowDown"?st:0;ST.kb=true;moveBy(dx,dy);return}
 if(e.key==="Enter"&&ST.sel.size===1&&tg.closest&&tg.closest("#drSvg")){e.preventDefault();openProps();return}
 if(e.key==="F2"&&ST.sel.size===1){e.preventDefault();startEdit([...ST.sel][0]);return}
 if(e.key==="+"||e.key==="="){zoomAt(1.15);return}
 if(e.key==="-"){zoomAt(1/1.15);return}
 if(e.key==="0"){fitView();paintNow();return}
 if(e.key==="/"){const q=$q("[data-dr-q]");if(q){e.preventDefault();q.focus()}return}
 if(e.key===" "&&tg.closest&&tg.closest("#drSvg")){space=true;e.preventDefault()}
});
document.addEventListener("keyup",e=>{if(e.key===" ")space=false});

/* ---------- export and import ---------- */
function download(name,text,type){try{const b=new Blob([text],{type}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}catch(e){}}
function exportJSON(){const t=D.toJSON(ST.doc);ST.lastExport=t;download(slug(ST.doc.name||"process")+".drawing.json",t,"application/json");audit("Process drawing: exported JSON",ST.doc.name);toast_("Exported "+slug(ST.doc.name)+".drawing.json");return t}
function exportSVG(){
 const live=$q("#drWorld");if(!live||!ST.doc||!ST.doc.shapes.length){toast_("Draw something first.","warn");return null}
 const clone=live.cloneNode(true),KEEP=["fill","stroke","stroke-width","stroke-dasharray","stroke-linecap","stroke-linejoin","opacity","font-size","font-family","font-weight","text-anchor","paint-order"];
 clone.querySelectorAll(".dr-gridrect,.dr-port,.dr-hitbox,.dr-chit,.dr-selring,.dr-marq,.dr-prev,.dr-lay,.dr-rub,.dr-flag").forEach(n=>n.remove());
 const A=live.querySelectorAll("*"),B=clone.querySelectorAll("*");
 const liveAll=Array.from(A),cloneAll=Array.from(B);
 /* the clone dropped some nodes; match by walking both trees in parallel */
 (function walk(a,b){const cs=getComputedStyle(a);let st="";KEEP.forEach(k=>{const v=cs.getPropertyValue(k);if(v)st+=k+":"+v+";"});if(b.setAttribute&&a.tagName!=="g"){b.setAttribute("style",st)}
  const ac=Array.from(a.children).filter(n=>!n.matches(".dr-gridrect,.dr-port,.dr-hitbox,.dr-chit,.dr-selring,.dr-marq,.dr-prev,.dr-lay,.dr-rub,.dr-flag")),bc=Array.from(b.children);
  ac.forEach((x,i)=>{if(bc[i])walk(x,bc[i])})})(live,clone);
 clone.removeAttribute("transform");
 const sh=ST.doc.shapes,x0=Math.min(...sh.map(s=>s.x))-30,y0=Math.min(...sh.map(s=>s.y))-30,x1=Math.max(...sh.map(s=>s.x+s.w))+30,y1=Math.max(...sh.map(s=>s.y+s.h+26))+30;
 const arrow=getComputedStyle(live.querySelector(".dr-cp")||live).stroke||"#555";
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${x1-x0} ${y1-y0}" width="${x1-x0}" height="${y1-y0}" font-family="Hanken Grotesk, Arial, sans-serif"><title>${H(ST.doc.name)}</title><rect x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" fill="#ffffff"/><defs><marker id="drArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1.5L9 5 1 8.5z" fill="${arrow}"/></marker></defs>${clone.outerHTML}</svg>`;
 ST.lastExportSVG=svg;download(slug(ST.doc.name||"process")+".drawing.svg",svg,"image/svg+xml");audit("Process drawing: exported SVG",ST.doc.name);toast_("Exported "+slug(ST.doc.name)+".drawing.svg");return svg;
}
function importFile(){const i=document.createElement("input");i.type="file";i.accept=".json,application/json";i.onchange=()=>{const f=i.files&&i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>applyJSON(String(r.result));r.readAsText(f)};i.click()}
function applyJSON(txt){const r=D.fromJSON(txt);if(!r.ok){toast_(r.msg,"warn");return false}
 mut(()=>{const keep=ST.doc.pid;ST.doc.shapes=r.doc.shapes;ST.doc.conns=r.doc.conns;ST.doc.seq=r.doc.seq;if(!keep&&r.doc.name)ST.doc.name=r.doc.name});ST.fit=true;fitView();paintNow();refresh();audit("Process drawing: imported JSON",ST.doc.name);toast_("Imported "+r.doc.shapes.length+" shapes");return true}
function importSteps(){
 const d=ST.doc;if(!d.pid){toast_("This drawing is not linked to a process yet. Save it to a process first.","warn");return}
 const st=stepsNow(d.pid);if(!st.length){toast_("That process has no steps to import.","warn");return}
 const nd=D.fromSteps(st,d.name,d.pid);mut(()=>{d.shapes=nd.shapes;d.conns=nd.conns;d.seq=nd.seq;d.basis=D.sig(st)});ST.fit=true;fitView();paintNow();render_();toast_("Redrawn from the "+st.length+" current steps");
}
function render_(){const sc=document.querySelector(".dr-screen");if(sc&&S.screen==="draw_studio"){const keepSel=new Set(ST.sel);render();ST.sel=keepSel}}

/* ---------- saving ---------- */
function saveDraft(){if(!ST.doc||ST.ro)return;persist();ST.dirty=false;SD.saved[ST.doc.pid||"_new"]=Object.assign(SD.saved[ST.doc.pid||"_new"]||{},{draft:true});audit("Process drawing: saved draft",ST.doc.name);toast_("Drawing saved as a draft. The process steps did not change.");paintStatus();refresh();syncMetrics()}
function writeSteps(pid,name,steps){
 if(window.PROCLIB&&PROCLIB.setSteps)return PROCLIB.setSteps(pid,steps,{name});
 if(!PROC.defs[pid])PROC.reg(pid,{title:name,std:["bpmn"],steps:steps.map(s=>Object.assign({},s))});S.proc[pid]=steps.map(s=>Object.assign({},s));try{PROCLIB.refresh()}catch(e){}return true;
}
function publish(){
 const doc=ST.doc;if(!doc||ST.ro)return null;const v=D.validate(doc);
 if(!v.valid){ST.checks=true;paintChecks();const bad=v.items.filter(i=>i.lv==="err");announce(v.errs+" checks to fix before saving to the process");toast_("Fix "+v.errs+" check"+(v.errs===1?"":"s")+" before saving to the process: "+(bad[0]?bad[0].title:"")+". Save draft keeps your work.","warn");return null}
 const steps=D.toSteps(doc);let warnings=[],created=false;
 if(!doc.pid){
  const r=PROCLIB.addProcess({name:doc.name,module:doc.module||"plat_reg",family:"wf",owner:doc.owner||"",trigger:doc.trigger||"A request or event starts this process",steps,entities:[],metrics:[],std:["bpmn"],inputs:[],outputs:[]});
  if(!r.ok){toast_(r.warnings[0],"warn");return null}
  doc.pid=r.id;warnings=r.warnings;created=true;delete SD.docs._new;
 }
 writeSteps(doc.pid,doc.name,steps);
 doc.basis=D.sig(stepsNow(doc.pid));ST.dirty=false;doc.rev++;
 SD.docs[doc.pid]=D.clone(doc);SD.saved[doc.pid]={at:"Oct 10",steps:steps.length,valid:true,sig:doc.basis};SD.cur=doc.pid;
 let lv=null;try{const g=PROCLIB.get(doc.pid);if(g)lv={level:g.level,target:g.target,max:5,name:g.name,own:g.owner}}catch(e){}
 ST.lastSave={pid:doc.pid,name:doc.name,steps:steps.length,lv,warnings,created};
 audit("Process drawing: saved to process",doc.name+" ("+steps.length+" steps)");
 toast_("Saved "+steps.length+" steps to "+doc.name+(lv?". Maturity level "+lv.level+" of 5.":"."));
 syncMetrics();render_();return ST.lastSave;
}
function savedBanner(){const s=ST.lastSave;if(!s)return"";return `<div class="dr-saved" role="status" ${s.warnings.length?`title="${H(s.warnings.join(" "))}"`:""}><span><b>Saved to the process.</b> ${s.steps} steps with owners and who acts${s.lv?`, maturity level ${s.lv.level} of ${s.lv.max}`:""}${s.warnings.length?`, ${s.warnings.length} thing${s.warnings.length>1?"s":""} still missing on the process`:""}.</span><button class="btn" data-dr-openproc="${H(s.pid)}">Open the process page</button><button class="btn quiet" data-dr-cmd="dismiss">Dismiss</button></div>`}

/* ---------- metrics ---------- */
Object.assign(METRICS,{
 m_draw_cov:{n:"Processes with a drawing",f:"Processes in the library that have a saved drawing ÷ all processes × 100",u:"%",cur:0,tgt:40,badAt:10,dir:"max",max:100,tr:[0,0,0,0,0,0,0,0],owner:"Process designer",use:["Process drawing studio","Process library"],rem:{kind:"sop",ref:"SOP-DR-01",title:"Draw the highest-value undocumented processes first",agent:"Process Drawing Agent",auto:false,state:"idle",prog:"Lists processes with steps but no drawing, ranked by how many modules they feed"}},
 m_draw_valid:{n:"Drawings that pass every check",f:"Drawings with no failed check (one start, an end, no dangling ends, gateways with 2 or more exits) ÷ drawings × 100",u:"%",cur:0,tgt:90,badAt:60,dir:"max",max:100,tr:[0,0,0,0,0,0,0,0],owner:"Process designer",use:["Process drawing studio"],rem:{kind:"sop",ref:"SOP-DR-02",title:"Fix failed checks before saving to the process",agent:"Process Drawing Agent",auto:false,state:"idle",prog:"Points at each shape that fails a check and drafts the missing connector"}},
 m_draw_auto:{n:"Connectors drawn automatically",f:"Connectors created by drop-near auto-connect ÷ all connectors × 100",u:"%",cur:0,tgt:60,badAt:20,dir:"max",max:100,tr:[0,0,0,0,0,0,0,0],owner:"Process designer",use:["Process drawing studio"],rem:{kind:"kb",ref:"KB-DR-01",title:"Drop shapes next to the step they follow",agent:"Process Drawing Agent",auto:false,state:"idle",prog:"Suggests the next step so the connector draws itself"}},
 m_draw_sync:{n:"Drawings in sync with their process steps",f:"Saved drawings whose steps match the process record now ÷ saved drawings × 100",u:"%",cur:100,tgt:95,badAt:70,dir:"max",max:100,tr:[100,100,100,100,100,100,100,100],owner:"Process owner",use:["Process drawing studio","Process library"],rem:{kind:"sop",ref:"SOP-DR-03",title:"Re-import or re-save a drawing after the steps change",agent:"Process Drawing Agent",auto:false,state:"idle",prog:"Flags the drawing and offers a redraw from the current steps"}}
});
function syncMetrics(){
 try{
  const keys=Object.keys(SD.docs),pids=keys.filter(k=>k!=="_new");let total=1;try{total=PROCLIB.stats().processes||1}catch(e){}
  const set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=Math.round(v);m.tr=(m.tr||[]).slice(0,7).concat([m.cur])};
  set("m_draw_cov",100*pids.length/total);
  const valid=keys.filter(k=>D.validate(SD.docs[k]).valid).length;set("m_draw_valid",keys.length?100*valid/keys.length:0);
  set("m_draw_auto",SD.conns?100*SD.auto/SD.conns:0);
  const sv=pids.filter(k=>SD.saved[k]&&SD.saved[k].sig!=null);const ok=sv.filter(k=>SD.saved[k].sig===D.sig(stepsNow(k))).length;set("m_draw_sync",sv.length?100*ok/sv.length:100);
 }catch(e){}
}

/* ---------- commands ---------- */
const AL={al_l:"l",al_c:"c",al_r:"r",al_t:"t",al_m:"m",al_b:"b"};
function setTool(t){ST.tool=t;refresh();const s=$q("#drSvg");if(s)s.classList.toggle("pan",t==="pan")}
function cmd(c){
 if(!ST.doc&&c!=="back"&&c!=="new")return;
 if(AL[c]){align(AL[c]);return}
 switch(c){
  case"tool_sel":setTool("select");break;case"tool_pan":setTool(ST.tool==="pan"?"select":"pan");break;
  case"undo":undo();break;case"redo":redo();break;
  case"zin":zoomAt(1.2);break;case"zout":zoomAt(1/1.2);break;case"fit":fitView();paintNow();break;
  case"grid":SD.grid=!SD.grid;$q("#drSvg").classList.toggle("grid",SD.grid);refresh();break;
  case"snap":SD.snap=!SD.snap;refresh();break;
  case"dup":dupSel();break;case"del":delSel();break;
  case"di_h":distribute("h");break;case"di_v":distribute("v");break;
  case"lanes":{let n=0;mut(()=>{n=D.makeLanes(ST.doc)});if(n){announce(n+" swimlanes by role");fitView();paintNow();toast_(n+" swimlane"+(n>1?"s":"")+" created from owners and who acts")}else toast_("Set owners or who acts first, then group into lanes.","warn");break}
  case"nolanes":mut(()=>{ST.doc.shapes=ST.doc.shapes.filter(s=>s.t!=="swimlane")});break;
  case"checks":ST.checks=!ST.checks;paintChecks();refresh();break;
  case"ai":ST.aiOpen=!ST.aiOpen;ST.lay=null;if(ST.aiOpen){const s=[...ST.sel][0];ST.sugg=D.suggest(ST.doc,s?D.getS(ST.doc,s):null);SD.ai++}paint();refresh();break;
  case"lay_ask":{const pos=D.layout(ST.doc);ST.lay={pos};SD.ai++;paint();announce("Proposed layout shown as dashed outlines. Accept or discard.");break}
  case"lay_ok":mut(()=>{ST.doc.shapes.forEach(s=>{const p=ST.lay.pos[s.id];if(p){s.x=snapV(p[0]);s.y=snapV(p[1])}})});ST.lay=null;fitView();paintNow();toast_("Layout accepted. Undo brings the old one back.");break;
  case"lay_no":ST.lay=null;paint();break;
  case"imp_steps":importSteps();break;case"imp_file":importFile();break;
  case"imp_paste":openForm({id:"dr_paste",title:"Paste a process drawing",story:"Paste JSON exported from this studio. It replaces the shapes and connectors on the canvas (Undo brings them back).",submit:"Import",fields:[{k:"json",label:"Drawing JSON",type:"longtext",req:true,wide:true}],onSubmit:v=>{if(!applyJSON(v.json))return{toast:"Could not import that JSON",close:false}}});break;
  case"exp_json":exportJSON();break;case"exp_svg":exportSVG();break;
  case"save":saveDraft();break;case"publish":publish();break;
  case"pal":SD.pal=!SD.pal;render_();break;
  case"keep":{ST.doc.basis=D.sig(stepsNow(ST.doc.pid));render_();break}
  case"dismiss":ST.lastSave=null;render_();break;
  case"back":closeProps();ST.doc=null;ST.lastSave=null;SD.cur=null;render();break;
  case"new":newForm();break;
 }
 document.querySelectorAll(".dr-menu[open]").forEach(m=>m.removeAttribute("open"));
}
function newForm(tplName){
 const mods=(window.MODMAP&&MODMAP.modules?MODMAP.modules:[]).filter(m=>!m.proposed).map(m=>[m.id,m.name]);
 openForm({id:"dr_new",title:"Draw a new process",story:"Names the process and where it lives. You draw it next; saving adds it to the Process library with a maturity score and a list of what is still missing.",submit:"Start drawing",
  fields:[{k:"name",label:"Process name",type:"text",req:true,ph:"Vendor onboarding"},{k:"module",label:"Module it belongs to",type:"select",opts:mods.length?mods:[["plat_reg","Platform registry"]]},{k:"owner",label:"Accountable owner",type:"people"},{k:"trigger",label:"What starts it",type:"text",ph:"A vendor is approved by procurement"}],defaults:{module:"plat_reg",name:tplName||""},
  onSubmit:v=>{const doc=D.newDoc(v.name,null);doc.module=v.module;doc.owner=v.owner;doc.trigger=v.trigger;setDoc(doc);audit("Process drawing: started",v.name);go("draw_studio")}});
}
const TPL={
 tpl_approval:{name:"Approval request",steps:[{n:"Submit the request",who:"human",owner:"Requester",in:"Request form"},{n:"Classify and check the request",who:"agent",owner:"Process Drawing Agent",d:"An agent checks completeness and policy."},{n:"Approve or decline",who:"gate",owner:"Budget owner",sla:"2 business days"},{n:"Record the decision",who:"robot",owner:"Workflow engine"},{n:"Notify the requester",who:"robot",owner:"Workflow engine"}]},
 tpl_incident:{name:"Incident triage",steps:[{n:"Detect the alert",who:"robot",owner:"Monitoring"},{n:"Classify and prioritize",who:"agent",owner:"Triage Agent",sla:"5 minutes"},{n:"Assign to a resolver group",who:"human",owner:"Service desk"},{n:"Restore service",who:"human",owner:"Platform engineering",sla:"4 hours"},{n:"Confirm with the user",who:"human",owner:"Service desk"},{n:"Review and learn",who:"gate",owner:"Problem manager"}]},
 tpl_onboard:{name:"New hire onboarding",steps:[{n:"Create the employee record",who:"human",owner:"People operations"},{n:"Create accounts and access",who:"robot",owner:"Identity service"},{n:"Order equipment",who:"robot",owner:"Service catalog"},{n:"Draft the first-week plan",who:"agent",owner:"Onboarding Agent"},{n:"Manager checks the plan",who:"gate",owner:"Hiring manager"},{n:"Welcome the new hire",who:"human",owner:"Hiring manager"}]}
};

/* ---------- opening the studio ---------- */
function open(pid,o){
 o=o||{};let doc;
 if(pid&&(pid in SD.docs||stepsNow(pid).length||(window.PROCLIB&&PROCLIB.get&&PROCLIB.get(pid)))){doc=loadDoc(pid)}
 else if(o.tpl&&TPL[o.tpl]){doc=D.fromSteps(TPL[o.tpl].steps,TPL[o.tpl].name,null)}
 else if(pid||o.name){doc=D.newDoc(o.name||pid)}
 else{ST.doc=null;go("draw_studio");return true}
 setDoc(doc);audit("Process drawing: opened",doc.name);go("draw_studio");return true;
}
function btn(pid,label,cls,name){return `<button type="button" class="btn ${cls||""} dr-open" data-dr-open="${H(pid||"")}" ${name?`data-dr-name-hint="${H(name)}"`:""} title="Open this process in the drawing studio">${H(label||"Draw")}</button>`}

document.addEventListener("click",e=>{
 let t;
 if((t=e.target.closest("[data-dr-open]"))){e.preventDefault();open(t.dataset.drOpen||null,t.dataset.drNameHint?{name:t.dataset.drNameHint}:{});return}
 if((t=e.target.closest("[data-dr-openproc]"))){if(window.PROCLIB)PROCLIB.open(t.dataset.drOpenproc);return}
 if((t=e.target.closest("[data-dr-tpl]"))){open(null,{tpl:t.dataset.drTpl});return}
 if(e.target.closest("[data-dr-new]")){newForm();return}
 if(S.screen!=="draw_studio")return;
 if((t=e.target.closest("[data-dr-cmd]"))){e.preventDefault();cmd(t.dataset.drCmd);return}
 if((t=e.target.closest("[data-dr-chk]"))){const ids=t.dataset.drChk.split(",");ST.sel=new Set(ids.filter(i=>D.getS(ST.doc,i)));ST.selC=null;centerOn(ids);paint();if(ST.sel.size===1)openProps();return}
 if((t=e.target.closest("[data-dr-sug]"))){const s=(ST.sugg||[])[+t.dataset.drSug];if(!s)return;const over={n:s.n};if(s.who)over.who=s.who;if(s.owner)over.owner=s.owner;addAuto(s.t,over);ST.sugg=D.suggest(ST.doc,[...ST.sel][0]?D.getS(ST.doc,[...ST.sel][0]):null);paint();toast_("Added "+s.n+" from the AI draft. You accepted it, so it is yours.");return}
 if(e.target.closest("[data-dr-ai-after]")){ST.aiOpen=true;ST.lay=null;const s=[...ST.sel][0];ST.sugg=D.suggest(ST.doc,s?D.getS(ST.doc,s):null);SD.ai++;paint();refresh();return}
 if((t=e.target.closest("[data-dr-who]"))){const id=t.closest("[data-dr-props]").dataset.drProps,s=D.getS(ST.doc,id);if(s){mut(()=>{s.who=t.dataset.drWho});openProps();const b=document.querySelector(`#drawer [data-dr-who="${t.dataset.drWho}"]`);if(b)b.focus()}return}
 if((t=e.target.closest("[data-dr-accown]"))){const id=t.closest("[data-dr-props]").dataset.drProps,s=D.getS(ST.doc,id);if(s){mut(()=>{s.owner=t.dataset.drAccown});openProps();toast_("Owner set to "+s.owner+" (accepted from the AI draft)")}return}
 if((t=e.target.closest("[data-dr-crm]"))){const id=t.dataset.drCrm;mut(()=>{ST.doc.conns=ST.doc.conns.filter(c=>c.id!==id)});if(ST.selC===id){ST.selC=null}openProps();return}
 if((t=e.target.closest("[data-dr-crev]"))){const c=ST.doc.conns.find(x=>x.id===t.dataset.drCrev);if(c){mut(()=>{[c.a,c.b]=[c.b,c.a];[c.ap,c.bp]=[c.bp,c.ap]});openProps()}return}
 if(e.target.closest("[data-dr-conn]")){const sel=document.querySelector("#drawer [data-dr-cto]"),pr=document.querySelector("#drawer [data-dr-props]");if(sel&&sel.value&&pr){let made=null;mut(()=>{made=connectShapes(pr.dataset.drProps,sel.value)});if(made){openProps();announce("Connected")}else toast_("Already connected, or that direction is not allowed.","warn")}return}
 if(e.target.closest("[data-dr-rule]")){try{S.flw.dsel=S.flw.dsel||"dt_inv"}catch(x){}go("flw_dmn");return}
});
document.addEventListener("input",e=>{
 const el=e.target;
 if(el.matches&&el.matches("[data-dr-q]")){ST.q=el.value;const pal=$q("[data-dr-aside]");if(pal){const pos=el.selectionStart;pal.outerHTML=palHTML();const n=$q("[data-dr-q]");if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}}return}
 if(el.matches&&el.matches("[data-dr-pick]")){ST.pick=el.value;const l=$q(".dr-plist");const tmp=document.createElement("div");tmp.innerHTML=pickerHTML();const nl=tmp.querySelector(".dr-plist");if(l&&nl)l.innerHTML=nl.innerHTML;return}
 if(!ST.doc||S.screen!=="draw_studio")return;
 if(el.matches("[data-dr-name]")){ST.doc.name=el.value;ST.dirty=true;persist();paintStatus();return}
 const pr=el.closest&&el.closest("[data-dr-props]");
 if(pr&&el.matches("[data-dr-p]")){
  const s=D.getS(ST.doc,pr.dataset.drProps);if(!s)return;const k=el.dataset.drP,key=s.id+":"+k;
  if(ST.fs!==key){pushU();ST.fs=key}
  s[k]=el.value;ST.dirty=true;ST.doc.rev++;persist();
  if(k==="n"){const h=document.querySelector("#drawer [data-dr-ph]");if(h)h.textContent=el.value||BY[s.t].name}
  paint();return;
 }
 if(el.matches("[data-dr-cl]")){const c=ST.doc.conns.find(x=>x.id===el.dataset.drCl);if(c){const key="c"+c.id;if(ST.fs!==key){pushU();ST.fs=key}c.lb=el.value;ST.dirty=true;persist();paint()}}
});
document.addEventListener("change",e=>{
 const el=e.target;if(!ST.doc||S.screen!=="draw_studio")return;
 if(el.matches&&el.matches("select[data-dr-p]")){const pr=el.closest("[data-dr-props]"),s=pr&&D.getS(ST.doc,pr.dataset.drProps);if(s){mut(()=>{s[el.dataset.drP]=el.value});toast_(el.value?"Decision rule linked":"Decision rule unlinked")}}
 if(el.matches&&el.matches("[data-dr-p]")&&!el.matches("select")){refresh();const dr=drawerEl();if(dr&&dr.dataset.dr&&el.dataset.drP==="owner")openProps()}
});
document.addEventListener("toggle",e=>{if(e.target&&e.target.id==="drawer"&&document.body.classList.contains("dr-on")){studioClass();if(e.newState==="closed"){const d=drawerEl();if(d)delete d.dataset.dr}}},true);
document.addEventListener("toggle",e=>{if(e.target&&e.target.matches&&e.target.matches("[data-dr-cat]")){SD.cats[e.target.dataset.drCat]=!e.target.open}},true);
/* palette tooltip with the BPMN or ITIL meaning */
let tipEl=null;
function showTip(el){const t=el.getAttribute("data-dr-tip");if(!t)return;if(!tipEl){tipEl=document.createElement("div");tipEl.className="dr-tip";tipEl.setAttribute("role","tooltip");document.body.appendChild(tipEl)}
 const i=t.indexOf(": ");tipEl.innerHTML=`<b>${H(t.slice(0,i))}</b><span>${H(t.slice(i+2))}</span>`;tipEl.hidden=false;const r=el.getBoundingClientRect();tipEl.style.top=Math.max(8,Math.min(innerHeight-tipEl.offsetHeight-8,r.top-4))+"px";tipEl.style.left=Math.max(8,r.left-tipEl.offsetWidth-10)+"px"}
function hideTip(){if(tipEl)tipEl.hidden=true}
document.addEventListener("mouseover",e=>{const el=e.target.closest&&e.target.closest("[data-dr-pi]");if(el&&!ST.drag)showTip(el);else if(!el)hideTip()});
document.addEventListener("focusin",e=>{const el=e.target.closest&&e.target.closest("[data-dr-pi]");if(el)showTip(el);else hideTip()});
document.addEventListener("pointerdown",hideTip,true);

/* ---------- mounting ---------- */
let RO=null;
function leave(){
 if(!document.body.classList.contains("dr-on"))return;
 document.body.classList.remove("dr-on","dr-drawer");const d=drawerEl();
 if(d){if(d.dataset.dr){delete d.dataset.dr;try{d.hidePopover()}catch(e){}}if(d.getAttribute("popover")==="manual")d.setAttribute("popover","auto")}
 if(RO){RO.disconnect();RO=null}
}
function mount(){
 if(S.screen!=="draw_studio"){leave();return}
 document.body.classList.add("dr-on");
 if(!$q("#drLive")){const l=document.createElement("div");l.id="drLive";l.className="sr";l.setAttribute("aria-live","polite");document.body.appendChild(l)}
 const svg=$q("#drSvg");if(!svg||!ST.doc){return}
 if(ST.fit){fitView();ST.fit=false}
 paintNow();studioClass();
 if(window.ResizeObserver){if(RO)RO.disconnect();RO=new ResizeObserver(()=>{if(S.screen==="draw_studio")paint()});const w=$q("[data-dr-wrap]");if(w)RO.observe(w)}
}
const _ca=window.coreAfter;window.coreAfter=function(){const r=_ca&&_ca.apply(this,arguments);try{mount()}catch(e){console.error("draw mount",e)}return r};
REG("draw_studio","Process drawing studio","automate","M4 6h6v5H4zM14 13h6v5h-6zM10 8.5h4v7",screenHTML);
window.addEventListener("resize",()=>{if(S.screen==="draw_studio"&&(phone()!==ST.ro))render()});

/* ---------- the Feature Contract: process, data, metrics, connectivity ---------- */
PROC.reg("draw_studio",{title:"How a process gets drawn, checked and saved",std:["bpmn","itil4"],steps:[
 {n:"Pick or start a process",d:"Open a process from the library, start from a template, or start blank. An existing process opens as shapes drawn from its steps.",who:"human",owner:"Process designer",sla:"Minutes",in:"A process in the library, a template or a blank page",out:"A drawing"},
 {n:"Place shapes",d:"Drag shapes from the drawer. Drop one near another and the connector is drawn to the nearest open exit.",who:"human",owner:"Process designer",sla:"Minutes",in:"Shape drawer",out:"Shapes and connectors"},
 {n:"Auto-connect and route",d:"The studio picks the nearest open output, labels Yes and No on decisions, and reroutes elbow lines when shapes move.",who:"robot",owner:"Drawing studio",sla:"Instant",in:"Drop position",out:"Connector"},
 {n:"Draft the next step",d:"The Process Drawing Agent suggests the next step or a tidier layout. It never saves; each suggestion is a draft.",who:"agent",owner:"Process Drawing Agent",sla:"Seconds",in:"Shapes on the canvas",out:"Suggested steps (draft)"},
 {n:"Accept or edit the draft",d:"A person accepts, edits or discards each AI suggestion before it becomes part of the drawing.",who:"human",owner:"Process designer",sla:"Minutes",in:"Suggested steps (draft)",out:"Accepted shapes"},
 {n:"Check the drawing",d:"One start, an end, no dangling ends, every gateway with 2 or more exits, owners named, AI steps followed by a person.",who:"robot",owner:"Drawing studio",sla:"Instant",in:"The drawing",out:"Checklist"},
 {n:"Approve and save to the process",d:"The process owner approves the drawing. Steps, owners, who acts and target times are written to the Process library.",who:"gate",owner:"Process owner",sla:"Per change",in:"A drawing with no failed check",out:"Updated process steps"},
 {n:"Re-score maturity",d:"The Process library re-scores the six maturity dimensions from the new steps, owners and gates.",who:"robot",owner:"Process library",sla:"Instant",in:"Updated process steps",out:"Maturity level"}]});
const DRENT=[{id:"process_drawing",label:"Process drawing",note:"Integration decision: the process and its steps already exist in the Process library, so the drawing is a thin layout record that points at the existing process_definition (the entity the Process library and Workflow designer already use for processes and steps). Meaning (who acts, owner, target time, system, control) is written to the step, never kept only in the picture. Reuses process_definition and person; adds only the layout, the validation result and the version.",fields:[
 {k:"drawing_id",label:"Drawing id",type:"string",req:true},{k:"process_id",label:"Process (process_definition)",type:"reference"},{k:"name",label:"Name",type:"string"},{k:"shapes",label:"Shapes (JSON layout)",type:"text"},{k:"connectors",label:"Connectors (JSON layout)",type:"text"},{k:"valid",label:"Passes every check",type:"boolean"},{k:"basis_signature",label:"Signature of the steps it was saved from",type:"string"},{k:"auto_connector_share",label:"Share of connectors drawn automatically",type:"number"},{k:"saved_by_id",label:"Saved by",type:"reference",classification:"internal"},{k:"saved_at",label:"Saved at",type:"datetime"},{k:"revision",label:"Revision",type:"number"}]}];
const DRFLOWS=[["flw_design","pull","Decision tables to link from a gateway","decision_table","api","Person links a rule to a decision shape"],["org_chart","pull","People and AI agents to name as owners","person","api","Person sets an owner on a step"],["plat_reg","pull","Process definitions and their steps","process_definition","api","Person opens a process in the studio"],["plat_reg","push","Steps, owners, who acts and target times","process_definition","api","Person saves the drawing to the process"],["exe_mat","push","New steps and owners for re-scoring maturity","process_definition","event","Drawing saved to a process"],["flw_design","push","Process steps the Workflow designer can automate","process_definition","api","Drawing saved to a process"],["plat_contract","push","Process evidence for the Feature contract","process_definition","event","Drawing saved to a process"]];
const CON=window.DRAWCON={done:{},log:[]};
function tryReg(){let again=false;
 if(!CON.done.ent){if(window.ATLAS&&ATLAS.addEntity&&window.PLAT){DRENT.forEach(e=>{const r=ATLAS.addEntity({id:e.id,label:e.label,domain:"plat",source:"Process drawing studio",status:"proposed",ownerApp:"Process drawing studio",ownerMod:"draw_studio",steward:"Process designer",note:e.note,fields:e.fields.map(f=>Object.assign({authority:"platform",classification:f.classification||"internal"},f))});CON.log.push("ATLAS.addEntity "+e.id+": "+(r&&r.ok!==false?"proposed":"not added"))});if(window.COVER&&Array.isArray(COVER.recs)){const R=COVER.recs,add=(key,label,ent,how,n,path)=>{if(!R.some(r=>r.key===key))R.push({key,label,scr:["draw_studio"],mod:"draw_studio",n,ent,how,path:path||key})};add("DRAW_DOCS","Process drawings (layout, validation, signature)","process_drawing","new",Object.keys(SD.docs).length,"S.draw.docs");add("DRAW_STEPS","Process steps written from drawings","process_definition","direct",0,"PROC");add("DRAW_PEOPLE","Owners: people and AI agents","person","direct",85,"DIR")}
 CON.done.ent=1}else again=true}
 if(!CON.done.mm){if(window.MODMAP&&MODMAP.addModule&&MODMAP.modules&&MODMAP.modules.length){const ids=new Set(MODMAP.modules.map(m=>m.id));const fl=DRFLOWS.filter(f=>ids.has(f[0])).map(f=>({dir:f[1],other:f[0],data:f[2],entity:f[3],mode:f[4],trig:f[5]}));const r=MODMAP.addModule({id:"draw_studio",name:"Process drawing studio",sn:"Drawing studio",band:"plt",own:"Process designer",proposed:false,r:["process_definition","person"],w:["process_drawing","process_definition"],flows:fl});CON.mm=r;CON.log.push("MODMAP.addModule draw_studio: "+(r&&r.ok!==false?"added ("+fl.length+" flows)":((r&&r.warnings&&r.warnings[0])||"not added")));CON.done.mm=1}else again=true}
 if(!CON.done.pl){if(window.PROCLIB&&PROCLIB.addProcess&&CON.done.mm){const r=PROCLIB.addProcess({id:"draw_process",name:"Draw, check and save a process",module:"draw_studio",family:"gov",owner:"Casey Rowan",trigger:"A person needs a process drawn, changed or documented.",steps:PROC.defs.draw_studio.steps.map(s=>Object.assign({},s)),inputs:["Process steps","Decision tables","People and AI agents"],outputs:["Process steps with owners and who acts","Validated drawing","Maturity re-score"],entities:["process_drawing","process_definition","person"],metrics:["m_draw_cov","m_draw_valid","m_draw_auto","m_draw_sync"],model:"cmmi",std:["bpmn","itil4"]});CON.pl=r;CON.log.push("PROCLIB.addProcess draw_process: "+(r.ok?"added":r.warnings[0]));CON.done.pl=1}else again=true}
 if(again&&(CON.tries=(CON.tries||0)+1)<40)setTimeout(tryReg,900);
 else if(again&&!CON.done.ent&&window.DATAMODEL&&DATAMODEL.register){DRENT.forEach(e=>DATAMODEL.register(e.id,{label:e.label,source:"Process drawing studio",fields:e.fields.map(f=>({k:f.k,label:f.label,type:f.type}))}));CON.done.ent=2}
 syncMetrics();
}
function boot(){
 try{if(window.NAVX&&NAVX.add)NAVX.add("draw_studio",{group:"auto",label:"Process drawing studio",hint:"Drag shapes onto a canvas; connectors draw themselves; saving writes the steps back to the process",sub:"Drag, drop, auto-connect",kw:"draw process diagram flowchart bpmn swimlane visio shapes canvas map model"})}catch(e){}
 tryReg();
}
window.addEventListener("load",()=>setTimeout(boot,700));if(document.readyState==="complete")setTimeout(boot,700);
SEARCHX.push(()=>{const out=[{g:"Go to",t:"Process drawing studio",m:"Draw a process",c:"--accent",f:()=>open(null),k:"draw process diagram flowchart bpmn swimlane visio drawing studio shapes"}];
 try{PROCLIB.list().slice(0,200).forEach(p=>out.push({g:"Draw a process",t:"Draw: "+p.name,m:p.steps+" steps · "+(SD.docs[p.id]?"drawn":"not drawn yet"),c:"--accent",f:()=>open(p.id),k:p.id+" "+p.name+" draw diagram flowchart map "+p.familyName}))}catch(e){}return out});
ASKX.push(q=>{
 const t=q.toLowerCase().trim();let m;
 if((m=t.match(/^(?:please )?(?:draw|diagram|map|sketch|flowchart)\s+(?:me )?(?:a |an |the )?(?:process|flow|diagram|workflow)?\s*(?:for|of|about)?\s*(.+)$/))&&!/^(it|this|that)$/.test(m[1])){
  const nm=m[1].replace(/\s+(process|workflow)$/,"").trim();let id=null;try{id=PROCLIB.find(nm)}catch(e){}
  if(id){open(id);say(q,{t:`Opened the drawing studio on ${procName(id)}. Its ${stepsNow(id).length} steps are drawn as shapes. Drag more shapes from the drawer; saving writes the steps back to the process.`,steps:["Found the process in the library","Drew its steps as shapes","Opened the Process drawing studio"]});return true}
  const nice=nm.replace(/\b\w/g,c=>c.toUpperCase());open(null,{name:nice});say(q,{t:`There is no process called "${nm}" in the library yet, so I started a blank drawing named ${nice}. Drag shapes from the drawer; saving adds it to the Process library.`,steps:["Searched the Process library","Started a blank drawing","Opened the Process drawing studio"]});return true}
 if(/(open|show|go to|take me to|start).*(process )?(drawing|draw) (studio|tool|canvas)|^draw a process$/.test(t)){open(null);say(q,{t:"Opened the Process drawing studio. Pick a process to draw, start from a template, or start blank.",steps:["Opened Process drawing studio"]});return true}
 if(/(validate|check).*(drawing|diagram)/.test(t)&&ST.doc){const v=D.validate(ST.doc);if(S.screen!=="draw_studio")go("draw_studio");ST.checks=true;say(q,{t:v.errs||v.warns?`The drawing "${ST.doc.name}" has ${v.errs} thing${v.errs===1?"":"s"} to fix and ${v.warns} piece${v.warns===1?"":"s"} of advice: ${v.items.filter(i=>i.lv!=="ok").slice(0,3).map(i=>i.title).join("; ")}.`:`The drawing "${ST.doc.name}" passes all ${v.total} checks.`,steps:["Ran the drawing checks"]});return true}
 if(/which processes (have|are) (drawn|drawings)|how many processes (are )?drawn/.test(t)){const n=Object.keys(SD.docs).filter(k=>k!=="_new").length;say(q,{t:`${n} process${n===1?" has":"es have"} a drawing so far. Open the Process drawing studio to draw the rest.`,steps:["Read the drawings"]});return true}
 return false;
});
window.DRAW=Object.assign(D,{ST,SD,open,btn,placeShape,addAuto,previewFor,publish,saveDraft,exportJSON,exportSVG,applyJSON,importSteps,connectShapes,delSel,dupSel,copySel,pasteClip,align,distribute,undo,redo,fit:()=>{fitView();paintNow()},paint:paintNow,syncMetrics,cmd,contract:CON,TPL,screenHTML,openProps,closeProps,mount,viewPt,stepsNow,newForm});
try{syncMetrics()}catch(e){}
})();
