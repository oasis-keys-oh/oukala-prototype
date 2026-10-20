/* ===== mod_r32_scrmap_b_screen: the Screen map (Platform admin).
   One place to see every registered screen as band > module > screen, with the evidence for each, and to mark it
   Wedge, Keep, Defer or Cut. Live facts (names, menu area, hidden flag, Feature Contract score, access, process, metrics)
   come from the running registry; static facts (defining file, size, inbound links, last change) come from
   mod_r32_scrmap_a_data.js, which gen_scrmap.py writes. Decisions live in this browser (localStorage) and export as CSV, JSON or Markdown.
   The signal score and the hints are a hypothesis to speed review. They are not a verdict. ===== */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=U.esc;
const SELF="scr_map",KEY="oukala-scrmap-v1";
const DATA=W.SCRMAP_DATA||{generated:"not scanned",files:{},screens:{}};
const CORE=["data.js","data2.js","ui.js","kit.js","kit2.js","screens1.js","screens2.js","screens3.js","screens4.js"];
const SUITE={portfolio:"Portfolio and delivery",service:"Service management",ops:"Operations",know:"Knowledge",people:"People and work",automate:"Automation",ai:"AI and governance",platform:"Platform"};
const DEC=[
 {k:"wedge",l:"Wedge",cls:"good",d:"One of the 5 to 8 screens a buyer sees first."},
 {k:"keep",l:"Keep",cls:"info",d:"Stays in the product. Supports the wedge or the platform."},
 {k:"defer",l:"Defer",cls:"warn",d:"On the roadmap. Not in the first sale or the demo."},
 {k:"cut",l:"Cut",cls:"bad",d:"Removed from the build."}];
const DK={};DEC.forEach(d=>DK[d.k]=d);
const NOBAND="Not on the process map";
const sp=(t,cls,title)=>`<span class="scm-p ${cls||"mute"}"${title?` title="${E(title)}"`:""}>${t}</span>`;

/* ---------- decisions: localStorage with an in-memory fallback ---------- */
let MEM=null;
function load(){try{const v=localStorage.getItem(KEY);if(v)return JSON.parse(v)}catch(e){}return MEM?JSON.parse(MEM):{}}
function save(){let s="{}";try{s=JSON.stringify(ST.dec)}catch(e){}MEM=s;try{localStorage.setItem(KEY,s)}catch(e){}}
S.scrmap=S.scrmap||{dec:load(),q:"",fd:"all",fh:"all",by:"band",open:{},arm:0};
const ST=S.scrmap;

/* ---------- metrics (Feature Contract rule 3) ---------- */
Object.assign(METRICS,{
 m_scr_decided:{n:"Screens with a confirmed decision",f:"screens with a confirmed decision (wedge, keep, defer or cut; pre-filled hints do not count) ÷ screens registered × 100",u:"%",cur:0,tgt:100,badAt:40,dir:"max",max:100,tr:[0,0,0,0,0,0,0,0],owner:"Platform owner",use:["Screen map"],rem:{kind:"sop",ref:"SOP-SCR-01",title:"Review undecided screens band by band",agent:"Navigation Agent",auto:false,state:"standby",prog:"Standing by. Lists undecided screens with the weakest signals first."}},
 m_scr_wedge:{n:"Wedge size",f:"count of screens marked wedge. The target is 5 to 8; below 5 means the wedge is not yet chosen",u:"",cur:0,tgt:8,badAt:14,dir:"min",max:30,tr:[0,0,0,0,0,0,0,0],owner:"Platform owner",use:["Screen map"],rem:{kind:"sop",ref:"SOP-SCR-02",title:"Narrow the wedge to 8 screens or fewer",agent:"Navigation Agent",auto:false,state:"standby",prog:"Standing by. Proposes which wedge screens to demote when the count passes 8."}},
 m_scr_hidden:{n:"Screens hidden from every menu",f:"screens in the hidden group ÷ screens registered × 100",u:"%",cur:0,tgt:15,badAt:40,dir:"min",max:100,tr:[0,0,0,0,0,0,0,0],owner:"Platform owner",use:["Screen map"],rem:{kind:"sop",ref:"SOP-SCR-03",title:"Decide hidden screens: defer or cut",agent:"Navigation Agent",auto:false,state:"standby",prog:"Standing by. Lists hidden screens that nothing links to."}}
});

/* ---------- cached live facts (rebuilt only when the registry changes) ---------- */
let C={sig:""};
function ensure(){
 const sig=SCREENS.length+"|"+G(()=>MODMAP.modules.length,0)+"|"+G(()=>Object.keys(METRICS).length,0);
 if(C.sig===sig)return;C={sig};
 const rp=G(()=>PERM.roles.map(r=>({r,p:PERM.principalOfRoles([r.id])})),[]);
 C.nroles=rp.length;C.roles={};C.contract={};
 SCREENS.forEach(s=>{const id=s[0];
  C.roles[id]=rp.filter(x=>G(()=>PERM.decide(x.p,"read","screen:"+id,null).ok,false)).map(x=>x.r.n);
  C.contract[id]=G(()=>{const e=CONTRACT.evaluate(id);return {pass:e.rules.filter(r=>r.st==="pass").length,rules:e.rules}},{pass:0,rules:[]})});
 C.metrics={};Object.keys(METRICS).forEach(k=>{(METRICS[k].use||[]).forEach(u=>{(C.metrics[u]=C.metrics[u]||[]).push(k)})});
 C.mod={};G(()=>MODMAP.modules.forEach(m=>{if(m.scr)(C.mod[m.scr]=C.mod[m.scr]||[]).push(m)}));
 C.band={};G(()=>MODMAP.bands.forEach(b=>C.band[b.id]=b.name));
}
function sig(x){let s=0;if(x.cxo)s+=3;if(!x.hidden)s+=2;s+=Math.min(x.nv,4)*0.5;s+=Math.min(x.jy,2);s+=x.ct/4;return Math.round(s*10)/10}
function hintOf(sc){return sc>=6?{k:"keep",l:"Likely keep",cls:"info"}:sc<=2.5?{k:"cut",l:"Review for cut",cls:"warn"}:{k:"",l:"Judgment call",cls:"mute"}}

function build(){ensure();const hid=G(()=>W.R15.hidden,{})||{};
 return SCREENS.map(s=>{const id=s[0],d=DATA.screens[id]||null,f=d?DATA.files[d.f]:null;
  const m0=(C.mod[id]||[])[0],r=G(()=>NAVX.resolve(id),{g:"new",l:s[1]});
  const hidden=!!hid[id]||r.g==="r15hid",ct=C.contract[id]||{pass:0,rules:[]},roles=C.roles[id]||[];
  const nv=d?d.nv:0,jy=d?d.jy:0,cxo=d?d.cxo:0,score=sig({hidden,nv,jy,cxo,ct:ct.pass}),dec=ST.dec[id]||null;
  return {id,formal:String(s[1]),label:String(G(()=>NAVX.label(id),s[1])),suite:SUITE[s[3]]||"Other",
   band:m0?(C.band[m0.band]||"Other"):NOBAND,module:m0?m0.name:"No process-map module",
   area:hidden?"Hidden from every menu":G(()=>NAVX.groupLabel(r.g),"Other"),hidden,cxo,
   file:d?d.f:"(new since the last scan)",fkb:f?Math.round(f.b/1024):0,fn:f?f.n:0,last:f?f.last:"",commits:f?f.c:0,
   nv,nvF:d?d.nvF:[],inn:d?d.in:0,jy,dup:d?d.dup:[],scanned:!!d,
   ct:ct.pass,ctRules:ct.rules,proc:!!G(()=>PROC.defs[id],false),roles,metrics:C.metrics[s[1]]||[],
   score,hint:hintOf(score),decision:dec?dec.d:"",dl:dec?DK[dec.d].l:"Undecided",note:dec&&dec.n||"",pre:!!(dec&&dec.h)}})}

function filt(rs){const q=ST.q.trim().toLowerCase();
 return rs.filter(r=>(ST.fd==="all"||(ST.fd==="none"?!r.decision:r.decision===ST.fd))
  &&(ST.fh==="all"||(ST.fh==="hidden"?r.hidden:ST.fh==="visible"?!r.hidden:ST.fh==="nolink"?r.nv===0:ST.fh==="review"?r.hint.k==="cut":ST.fh==="pre"?r.pre:true))
  &&(!q||(r.id+" "+r.formal+" "+r.label+" "+r.module+" "+r.band+" "+r.file).toLowerCase().includes(q)))}
function tally(rs){const t={wedge:0,keep:0,defer:0,cut:0,none:0};rs.forEach(r=>{t[r.decision||"none"]++});return t}

/* ---------- changing decisions ---------- */
function setDec(ids,k,opts){opts=opts||{};let n=0;
 ids.forEach(id=>{if(!k){if(ST.dec[id]){delete ST.dec[id];n++}return}
  const cur=ST.dec[id];if(cur&&cur.d===k&&!opts.pre&&!opts.force)return;
  ST.dec[id]={d:k,n:cur&&cur.n||"",t:new Date().toISOString().slice(0,10)};if(opts.pre)ST.dec[id].h=1;n++});
 if(n){save();G(()=>audit(k?"Marked screens "+DK[k].l:"Cleared screen decisions",ids.length===1?ids[0]:ids.length+" screens"))}return n}
function rr(){const v=D.getElementById("view"),a=v?v.scrollTop:0,b=W.scrollY;render();const v2=D.getElementById("view");if(v2)v2.scrollTop=a;W.scrollTo(0,b)}

/* ---------- map pane ---------- */
function barHTML(t,n){return `<span class="scm-mb" aria-hidden="true">${["wedge","keep","defer","cut"].filter(k=>t[k]).map(k=>`<i class="${DK[k].cls}" style="flex:${t[k]}"></i>`).join("")}${t.none?`<i class="none" style="flex:${t.none}"></i>`:""}</span>`}
function tags(r){const o=[];
 if(r.hidden)o.push(sp("Hidden","mute","This screen is in the hidden group, so no menu shows it."));
 if(r.cxo)o.push(sp("CxO menu","info","Pinned in the executive (CxO) menu."));
 if(!r.nv&&!r.cxo)o.push(sp("No in-product link","warn","No other file opens this screen with go(), a menu link or a button."));
 if(r.pre)o.push(sp("Pre-filled","mute","Filled in from the hint. Confirm or change it."));
 if(!r.scanned)o.push(sp("Not in the scan","warn","Not found by the last scan (added later, or registered by code). Run gen_scrmap.py."));
 return o.join("")}
function segHTML(r){return `<div class="scm-seg" role="radiogroup" aria-label="Decision for ${E(r.label)}">${DEC.map(x=>`<button type="button" class="scm-b ${x.cls}" role="radio" aria-checked="${r.decision===x.k}" data-scm-d="${x.k}" data-scm-id="${E(r.id)}" title="${E(x.d)}">${x.l}</button>`).join("")}</div>`}
function rowHTML(r){
 const sub=[r.formal!==r.label?r.formal:"",r.module&&r.module!==r.label&&r.module!==r.formal&&r.band!==NOBAND?"module "+r.module:""].filter(Boolean).join(" · ");
 return `<div class="scm-row ${r.decision?"dec-"+r.decision:""}" data-scm-row="${E(r.id)}">
  <div class="scm-n"><b>${E(r.label)}</b><span class="muted small">${sub?E(sub)+" · ":""}<code>${E(r.id)}</code></span><span class="scm-tags">${tags(r)}</span></div>
  <div class="scm-s small"><span title="Signal score out of 10. See How this works."><b class="num" data-role="metric">${r.score}</b>/10</span>${sp(r.hint.l,r.hint.cls,"Hint from the signal score. Not a verdict.")}<span class="muted">${r.fkb} KB</span><span class="muted">${r.ct}/4 contract</span><span class="muted">${r.nv} links in</span></div>
  ${segHTML(r)}<button class="btn quiet sm" type="button" data-scm-open="${E(r.id)}">Details</button></div>`}
function groups(rs){const by=ST.by,m={},order=[];
 const keyOf=r=>by==="band"?r.band:by==="area"?r.area:by==="file"?r.file:r.dl;
 rs.forEach(r=>{const k=keyOf(r);if(!m[k]){m[k]={key:by+":"+k,title:k,rows:[]};order.push(m[k])}m[k].rows.push(r)});
 const bands=G(()=>MODMAP.bands.map(b=>b.name),[]);
 const rank=t=>by==="band"?(bands.indexOf(t)<0?99:bands.indexOf(t)):by==="decision"?["Undecided","Wedge","Keep","Defer","Cut"].indexOf(t):by==="file"?-m[t].rows[0].fkb:(t==="Hidden from every menu"?99:0);
 return order.sort((a,b)=>rank(a.title)-rank(b.title)||a.title.localeCompare(b.title))}
function groupHTML(g){const t=tally(g.rows),isO=ST.open[g.key]!==0;
 let body;
 if(ST.by==="band"){const mm={};g.rows.forEach(r=>{(mm[r.module]=mm[r.module]||[]).push(r)});
  body=Object.keys(mm).sort((a,b)=>a.localeCompare(b)).map(k=>(mm[k].length>1&&g.title!==NOBAND?`<div class="scm-mh"><b>${E(k)}</b><span class="muted small">${mm[k].length} screens in this module</span></div>`:"")+mm[k].sort((a,b)=>a.label.localeCompare(b.label)).map(rowHTML).join("")).join("")}
 else body=g.rows.slice().sort((a,b)=>a.label.localeCompare(b.label)).map(rowHTML).join("");
 const fkb=ST.by==="file"?` · ${g.rows[0].fkb} KB, last changed ${E(g.rows[0].last||"unknown")}`:"";
 return `<details class="scm-g" data-scm-g="${E(g.key)}" ${isO?"open":""}><summary><span class="scm-gt"><b>${E(g.title)}</b><span class="muted small">${g.rows.length} screen${g.rows.length===1?"":"s"} · ${g.rows.length-t.none} decided${fkb}</span></span>${barHTML(t,g.rows.length)}</summary>
  <div class="scm-gb"><div class="scm-bulk small"><label>Set every screen below to <select data-scm-bulk="${E(g.key)}" aria-label="Set all screens in ${E(g.title)}"><option value="">Choose…</option>${DEC.map(x=>`<option value="${x.k}">${x.l}</option>`).join("")}<option value="clear">Clear decisions</option></select></label></div>${body}</div></details>`}
function mapPane(RS){const rs=filt(RS),gs=groups(rs);const o=(v,l,cur)=>`<option value="${v}" ${cur===v?"selected":""}>${l}</option>`;
 W.__scmBulk={};gs.forEach(g=>W.__scmBulk[g.key]=g.rows.map(r=>r.id));
 return `<div class="scm-bar">
  <input type="search" class="txtin" data-scm-q value="${E(ST.q)}" placeholder="Search ${RS.length} screens by name, id, module or file" aria-label="Search screens">
  <label class="small">Group by <select data-scm-f="by" aria-label="Group by">${o("band","Band and module",ST.by)}${o("area","Menu area",ST.by)}${o("file","Source file",ST.by)}${o("decision","Decision",ST.by)}</select></label>
  <label class="small">Decision <select data-scm-f="fd" aria-label="Filter by decision">${o("all","All",ST.fd)}${o("none","Undecided",ST.fd)}${DEC.map(x=>o(x.k,x.l,ST.fd)).join("")}</select></label>
  <label class="small">Show <select data-scm-f="fh" aria-label="Filter by evidence">${o("all","Everything",ST.fh)}${o("visible","In a menu",ST.fh)}${o("hidden","Hidden from menus",ST.fh)}${o("nolink","No in-product link",ST.fh)}${o("review","Hint: review for cut",ST.fh)}${o("pre","Pre-filled, not confirmed",ST.fh)}</select></label>
  <span class="row"><button class="btn quiet sm" type="button" data-scm-x="open">Expand all</button><button class="btn quiet sm" type="button" data-scm-x="close">Collapse all</button></span></div>
  <p class="muted small scm-note">One decision per screen. Click the same button again to clear it. ${rs.length===RS.length?"All "+RS.length+" screens shown.":rs.length+" of "+RS.length+" screens match."}</p>
  ${legend([["Wedge","--good-f"],["Keep","--story"],["Defer","--warn-f"],["Cut","--bad-f"],["Undecided","--hair"]])}
  ${gs.length?gs.map(groupHTML).join(""):empty("No screens match","Clear the search or the filters.")}`}

/* ---------- table pane ---------- */
function tablePane(){return btHTML({id:"scm_tbl",key:"id",h:560,rowH:46,exportName:"screen-map",facets:["band","dl","area"],rows:()=>build(),open:id=>openScr(id),
 cols:[{k:"label",label:"Screen",wrap:1,fmt:r=>`<b>${E(r.label)}</b><br><span class="muted small">${E(r.id)}</span>`,val:r=>r.label},
  {k:"band",label:"Band"},{k:"module",label:"Module",wrap:1},{k:"area",label:"Menu area"},
  {k:"dl",label:"Decision",fmt:r=>r.decision?pill(DK[r.decision].l,DK[r.decision].cls):pill("Undecided","mute"),val:r=>r.dl},
  {k:"score",label:"Signal",cls:"num",val:r=>r.score},{k:"nv",label:"Links in",cls:"num",val:r=>r.nv},{k:"ct",label:"Contract",cls:"num",val:r=>r.ct+" of 4"},
  {k:"fkb",label:"File KB",cls:"num",val:r=>r.fkb},{k:"last",label:"Last change",val:r=>r.last}]})}

/* ---------- source files pane ---------- */
function filesPane(RS){const by={};RS.forEach(r=>{(by[r.file]=by[r.file]||[]).push(r)});
 const list=Object.keys(by).map(f=>{const rs=by[f],t=tally(rs),core=CORE.indexOf(f)>=0,cutAll=!core&&rs.length&&rs.every(r=>r.decision==="cut"),n=rs.filter(r=>r.decision==="cut").length;
  return {f,rs,t,core,cutAll,n,kb:rs[0].fkb,last:rs[0].last,c:rs[0].commits,shared:rs[0].fn}}).sort((a,b)=>b.kb-a.kb);
 const freed=list.filter(x=>x.cutAll).reduce((a,x)=>a+x.kb,0),total=list.filter(x=>!x.core).reduce((a,x)=>a+x.kb,0);
 return `${kpiRow([["Source files",list.length,"each defines at least one screen"],["Whole files that can go",list.filter(x=>x.cutAll).length,"every screen in the file is marked Cut",{keep:true}],["Code freed",freed+" KB","of "+total+" KB in module files",{keep:true}]])}
 ${card("Which files each decision touches","A module file can also add processes, metrics, search and flows. Cutting the file removes those too, so check the Module map and the Feature contract before you delete one. Core files hold shared code and are never listed as removable.",
 `<div class="tscroll"><table class="tbl"><thead><tr><th>File</th><th>Screens</th><th>Decisions</th><th>KB</th><th>Last change</th><th>Commits</th><th>Status</th></tr></thead><tbody>${list.map(x=>`<tr><td><code>${E(x.f)}</code></td><td><div class="scm-cell">${x.rs.map(r=>`<button class="chip scm-chipbtn" type="button" data-scm-open="${E(r.id)}">${E(r.label)}</button>`).join("")}</div></td><td>${barHTML(x.t,x.rs.length)}<span class="muted small">${x.rs.length-x.t.none} of ${x.rs.length}</span></td><td class="num">${x.kb}</td><td>${E(x.last||"unknown")}</td><td class="num">${x.c}</td><td>${x.core?pill("Core file","mute"):x.cutAll?pill("Whole file can go","bad"):x.n?pill(x.n+" of "+x.rs.length+" cut","warn"):pill("Stays","mute")}</td></tr>`).join("")}</tbody></table></div>`)}`}

/* ---------- decisions and export pane ---------- */
function mdOf(RS){const d=new Date().toISOString().slice(0,10),t=tally(RS);
 const sec=(k)=>{const rs=RS.filter(r=>r.decision===k).sort((a,b)=>a.band.localeCompare(b.band)||a.label.localeCompare(b.label));return `## ${DK[k].l} (${rs.length})\n\n${rs.length?rs.map(r=>`- ${r.label} (${r.id}, ${r.band})${r.note?": "+r.note:""}`).join("\n"):"- none"}\n`};
 return `# Screen map decisions, ${d}\n\nPrototype facts: ${RS.length} registered screens; ${t.none} undecided. Decisions are the founder's; the signal score is a hypothesis.\n\n${["wedge","keep","defer","cut"].map(sec).join("\n")}`}
function csvOf(RS){const h=["id","screen","formal_name","band","module","menu_area","hidden","cxo_menu","decision","note","signal_score","links_in","contract_of_4","file","file_kb","last_change"];
 const q=v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"';
 return [h.map(q).join(",")].concat(RS.map(r=>[r.id,r.label,r.formal,r.band,r.module,r.area,r.hidden?"yes":"no",r.cxo?"yes":"no",r.decision||"undecided",r.note,r.score,r.nv,r.ct,r.file,r.fkb,r.last].map(q).join(","))).join("\n")}
function dl(name,mime,text){try{const b=new Blob([text],{type:mime}),a=D.createElement("a");a.href=URL.createObjectURL(b);a.download=name;D.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},600)}catch(e){toast("The download did not start in this browser. Use Copy instead.","warn")}}
function decPane(RS){const t=tally(RS),w=t.wedge,wOk=w>=5&&w<=8,vis=filt(RS);
 const prefillN=vis.filter(r=>!r.decision&&r.hint.k).length;
 const cardFor=x=>{const rs=RS.filter(r=>r.decision===x.k).sort((a,b)=>a.label.localeCompare(b.label));
  return card(x.l+" ("+rs.length+")",x.d+(x.k==="wedge"?" Target: 5 to 8.":""),rs.length?`<div class="row scm-chips">${rs.map(r=>`<button class="chip scm-chipbtn" type="button" data-scm-open="${E(r.id)}" title="${E(r.band)}">${E(r.label)}</button>`).join("")}</div>`:`<p class="muted small">Nothing marked ${x.l} yet.</p>`,x.k==="wedge"?pill(wOk?"Within 5 to 8":w<5?"Fewer than 5":"More than 8",wOk?"good":"warn"):"")};
 return `<div class="grid g2" style="align-items:start">${DEC.map(cardFor).join("")}</div>
 ${card("Undecided ("+t.none+")","Screens with no decision. The hints below are signals, not verdicts.",t.none?`<div class="row scm-chips">${RS.filter(r=>!r.decision).sort((a,b)=>a.score-b.score).slice(0,40).map(r=>`<button class="chip scm-chipbtn" type="button" data-scm-open="${E(r.id)}" title="Signal ${r.score} of 10. ${E(r.hint.l)}">${E(r.label)}</button>`).join("")}${t.none>40?`<span class="muted small">and ${t.none-40} more, weakest signals first</span>`:""}</div>`:`<p class="muted">Every screen has a decision.</p>`)}
 ${card("Hints and export","Pre-fill sets Likely keep to Keep and Review for cut to Defer for the screens in the current Map filter that have no decision. Nothing is cut automatically; a pre-filled screen is marked until you confirm it.",
 `<div class="row"><button class="btn" type="button" data-scm-pre ${prefillN?"":"disabled"}>Pre-fill ${prefillN} undecided from hints</button><button class="btn quiet" type="button" data-scm-pre-clear>Clear pre-filled</button></div>
  <div class="row" style="margin-top:12px"><button class="btn primary" type="button" data-scm-exp="md">Download Markdown for the vault</button><button class="btn" type="button" data-scm-exp="copy">Copy Markdown</button><button class="btn" type="button" data-scm-exp="csv">Download CSV</button><button class="btn" type="button" data-scm-exp="json">Download JSON</button><button class="btn quiet" type="button" data-scm-imp>Import JSON</button><button class="btn danger" type="button" data-scm-reset>${ST.arm&&Date.now()-ST.arm<6000?"Click again to clear every decision":"Clear every decision"}</button></div>
  <p class="muted small" style="margin-top:10px">Decisions are saved in this browser only. Export them to keep a copy or to hand them to Development.</p>`)}`}

/* ---------- method pane ---------- */
function methodPane(RS){const unscanned=RS.filter(r=>!r.scanned).length,hid=RS.filter(r=>r.hidden).length;
 return `<div class="grid g2" style="align-items:start">
 ${card("Where each fact comes from","Prototype facts, read at the moment you open this screen unless marked scan.",`<dl class="kv">
  <dt>Screen, menu area, hidden</dt><dd>The live registry (SCREENS) and the navigation map. Hidden means the screen is in the hidden group, so no menu lists it.</dd>
  <dt>Band and module</dt><dd>The Module map (MODMAP). ${RS.filter(r=>r.band===NOBAND).length} screens have no module on it.</dd>
  <dt>Contract (of 4)</dt><dd>The Feature contract evaluation for the screen: process, data, metrics, links.</dd>
  <dt>Roles with access</dt><dd>The permission model: roles that may read the screen.</dd>
  <dt>File, KB, last change, commits (scan)</dt><dd>gen_scrmap.py reads the source and git history. Scan date ${E(DATA.generated)}; ${unscanned?unscanned+" screens are not in the scan.":"every screen is in the scan."}</dd>
  <dt>Links in (scan)</dt><dd>Other files that open the screen with go(), a menu button or a screen assignment. The menu itself does not count.</dd></dl>`)}
 ${card("Signal score and hints (hypothesis)","A quick ordering aid. It cannot know what a buyer wants.",`<ul class="scm-list"><li><b>3</b> if the screen is pinned in the CxO menu.</li><li><b>2</b> if it is in a menu rather than hidden.</li><li><b>0.5</b> for each other file that links to it, up to 2.</li><li><b>1</b> for each journey or tour file that mentions it, up to 2.</li><li><b>0 to 1</b> from the Feature contract score.</li></ul><p class="small">6 or more reads Likely keep. 2.5 or less reads Review for cut. Everything between is a judgment call. ${hid} screens are hidden today.</p><p class="small muted">Not measured: real usage. The prototype has no analytics, so no number here says how often anyone opens a screen.</p>`)}</div>
 ${card("Refresh the scan","Run this from the prototype folder after you add or remove screens. It rewrites mod_r32_scrmap_a_data.js; then rebuild.",`<pre class="scm-code">python3 src/gen_scrmap.py src
python3 src/build.py --out build_out</pre>`)}
 ${procCard(SELF)}
 <div class="card glass"><div class="cardhead"><div><h3>Measures</h3><span class="muted small">Each has a formula, an owner and a remediation.</span></div></div><div class="grid g3 mgrid">${["m_scr_decided","m_scr_wedge","m_scr_hidden"].map(id=>metricRing(id,120)).join("")}</div></div>`}

/* ---------- details drawer ---------- */
function openScr(id){const r=build().find(x=>x.id===id);if(!r)return;ST.sel=id;
 const rules=r.ctRules.map(x=>`<li>${pill(x.st==="pass"?"Pass":x.st==="partial"?"Partial":"Gap",x.st==="pass"?"good":x.st==="partial"?"warn":"bad")} ${E(x.n)}</li>`).join("");
 const html=`<div class="scm-dr" data-scm-dr="${E(id)}"><p class="eyebrow">Screen</p><h2>${E(r.label)}</h2><p class="muted">${E(r.formal)} · <code>${E(id)}</code> ${tags(r)}</p>
 <h4>Decision</h4>${segHTML(r)}
 <label class="small" style="display:block;margin-top:10px">Reason or note<textarea class="txtin" rows="3" data-scm-note="${E(id)}" placeholder="Why this decision? Who relies on this screen?">${E(r.note)}</textarea></label>
 <div class="row" style="margin:12px 0"><button class="btn primary" type="button" data-scm-go="${E(id)}">Open this screen</button></div>
 <h4>Evidence</h4><dl class="kv">
 <dt>Band and module</dt><dd>${E(r.band)}${r.band===NOBAND?"":" · "+E(r.module)}</dd>
 <dt>Menu area</dt><dd>${E(r.area)} (suite: ${E(r.suite)})</dd>
 <dt>Signal score</dt><dd>${r.score} of 10 · ${E(r.hint.l)}</dd>
 <dt>Defined in</dt><dd><code>${E(r.file)}</code>${r.scanned?` · ${r.fkb} KB · shared by ${r.fn} screen${r.fn===1?"":"s"} · last changed ${E(r.last||"unknown")} · ${r.commits} commit${r.commits===1?"":"s"}`:""}${r.dup.length?`<br><span class="muted small">Also registered in ${r.dup.map(E).join(", ")}; the later file wins.</span>`:""}</dd>
 <dt>Opened from</dt><dd>${r.nv?`${r.nv} other file${r.nv===1?"":"s"}: ${r.nvF.map(f=>"<code>"+E(f)+"</code>").join(", ")}`:"No other file links here with go() or a menu button."}</dd>
 <dt>Journeys and tours</dt><dd>${r.jy?r.jy+" journey or tour file"+(r.jy===1?"":"s")+" mention it":"None mention it"}</dd>
 <dt>Feature contract</dt><dd>${r.ct} of 4<ul class="scm-list">${rules||"<li class='muted'>Not evaluated</li>"}</ul></dd>
 <dt>Process</dt><dd>${r.proc?"Registered":"None registered"}</dd>
 <dt>Metrics that name it</dt><dd>${r.metrics.length?r.metrics.length+": "+r.metrics.slice(0,6).map(k=>E(G(()=>METRICS[k].n,k))).join(", ")+(r.metrics.length>6?" and more":""):"None"}</dd>
 <dt>Roles that can open it</dt><dd>${r.roles.length} of ${C.nroles}${r.roles.length?": "+r.roles.map(E).join(", "):""}</dd></dl></div>`;
 openDrawer(html)}

/* ---------- the screen ---------- */
function render_(){const RS=build(),t=tally(RS),n=RS.length,pre=RS.filter(r=>r.pre).length,dn=n-t.none-pre,pct=n?Math.round(dn/n*100):0,hid=RS.filter(r=>r.hidden).length,nol=RS.filter(r=>!r.nv&&!r.cxo).length,hp=n?Math.round(hid/n*100):0;
 const M=METRICS;[["m_scr_decided",pct],["m_scr_wedge",t.wedge],["m_scr_hidden",hp]].forEach(([k,v])=>{M[k].cur=v;M[k].tr=M[k].tr.slice(1).concat([v])});
 const freed=(()=>{const by={};RS.forEach(r=>{(by[r.file]=by[r.file]||[]).push(r)});return Object.keys(by).filter(f=>CORE.indexOf(f)<0&&by[f].every(r=>r.decision==="cut")).reduce((a,f)=>a+by[f][0].fkb,0)})();
 const story=`The prototype registers <b data-role="metric">${n}</b> screens; <b data-role="metric">${hid}</b> are hidden from every menu and <b data-role="metric">${nol}</b> have no link from anywhere else. You have confirmed <b data-role="metric">${dn}</b> so far, with <b data-role="metric">${t.wedge}</b> in the wedge (the target is 5 to 8). Mark each screen Wedge, Keep, Defer or Cut, then export the list.`;
 return `<div class="screen">${hero("Platform and administration","Screen map: what stays and what goes",story,`<div class="row">${fchip("m_scr_decided")}${fchip("m_scr_wedge")}${fchip("m_scr_hidden")}<button class="btn primary" type="button" data-scm-exp="md">Export decisions</button></div>`)}${lensNote()}
 ${kpiRow([["Screens",n,"registered right now"],["Confirmed",dn+" of "+n,pct+"% confirmed"+(pre?", "+pre+" pre-filled":""),{keep:true}],["Wedge",t.wedge,t.wedge>=5&&t.wedge<=8?"within the 5 to 8 target":"target 5 to 8",{cls:t.wedge>=5&&t.wedge<=8?"":"warn",keep:true}],["Defer",t.defer,"roadmap, not first sale",{keep:true}],["Cut",t.cut,freed?freed+" KB of source files go entirely":"none removed yet",{keep:true}],["Undecided",t.none,"still to review",{cls:t.none?"warn":"",keep:true}]])}
 ${views("scm_v",["Map","Table","Source files","Decisions and export","How this works"],[mapPane(RS),tablePane(),filesPane(RS),decPane(RS),methodPane(RS)])}</div>`}
REG("scr_map","Screen map","platform","M4 5h7v6H4zM13 5h7v6h-7zM4 13h7v6H4zM15 15l2 2 3-4",render_);

/* ---------- events ---------- */
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-scm-d],[data-scm-open],[data-scm-go],[data-scm-x],[data-scm-exp],[data-scm-pre],[data-scm-pre-clear],[data-scm-imp],[data-scm-reset]");if(!t)return;const d=t.dataset;
 if(d.scmD){const id=d.scmId,cur=ST.dec[id];setDec([id],cur&&cur.d===d.scmD?"":d.scmD,{force:true});const inDr=!!t.closest("[data-scm-dr]");rr();if(inDr)openScr(id);return}
 if(d.scmOpen){openScr(d.scmOpen);return}
 if(d.scmGo){try{closeDrawer()}catch(x){}go(d.scmGo);return}
 if(d.scmX){const keys=[...D.querySelectorAll("details[data-scm-g]")].map(x=>x.dataset.scmG);keys.forEach(k=>ST.open[k]=d.scmX==="open"?1:0);rr();return}
 if(d.scmExp){const RS=build(),stamp=new Date().toISOString().slice(0,10);
  if(d.scmExp==="md")dl("screen-map-decisions-"+stamp+".md","text/markdown",mdOf(RS));
  else if(d.scmExp==="csv")dl("screen-map-"+stamp+".csv","text/csv",csvOf(RS));
  else if(d.scmExp==="json")dl("screen-map-decisions-"+stamp+".json","application/json",JSON.stringify({app:"oukala-screen-map",version:1,exported:new Date().toISOString(),decisions:ST.dec},null,1));
  else{try{navigator.clipboard.writeText(mdOf(RS)).then(()=>toast("Markdown copied","good"),()=>toast("Copy was blocked. Use Download instead.","warn"))}catch(x){toast("Copy was blocked. Use Download instead.","warn")}}
  G(()=>audit("Exported screen decisions",d.scmExp));if(d.scmExp!=="copy")toast("Exported "+Object.keys(ST.dec).length+" decisions","good");return}
 if(d.scmPre!=null){const vis=filt(build()).filter(r=>!r.decision&&r.hint.k);const keep=vis.filter(r=>r.hint.k==="keep").map(r=>r.id),cutr=vis.filter(r=>r.hint.k==="cut").map(r=>r.id);setDec(keep,"keep",{pre:true});setDec(cutr,"defer",{pre:true});toast("Pre-filled "+vis.length+" screens. Confirm or change each one.","good");S.v.scm_v=0;rr();return}
 if(d.scmPreClear!=null){const ids=Object.keys(ST.dec).filter(id=>ST.dec[id].h);setDec(ids,"");toast("Cleared "+ids.length+" pre-filled decisions","good");rr();return}
 if(d.scmImp!=null){openForm({id:"scm_imp",title:"Import decisions",story:"Paste JSON exported from this screen. Imported decisions replace decisions for the same screens and leave the rest alone.",submit:"Import",fields:[{k:"json",label:"Decisions JSON",type:"longtext",req:true,ph:'{"app":"oukala-screen-map", ...}'}],
   onSubmit:v=>{try{const o=JSON.parse(v.json),src=o.decisions||o;let n=0;Object.keys(src).forEach(id=>{const x=src[id];if(x&&DK[x.d]){ST.dec[id]={d:x.d,n:String(x.n||""),t:x.t||new Date().toISOString().slice(0,10)};n++}});save();G(()=>audit("Imported screen decisions",n+" screens"));toast("Imported "+n+" decisions","good");closeDrawer();rr()}catch(x){toast("That is not valid decisions JSON","bad")}}});return}
 if(d.scmReset!=null){if(ST.arm&&Date.now()-ST.arm<6000){const n=Object.keys(ST.dec).length;ST.dec={};save();ST.arm=0;G(()=>audit("Cleared all screen decisions",n+" decisions"));toast("Cleared "+n+" decisions","good")}else{ST.arm=Date.now();setTimeout(()=>{if(S.screen===SELF&&ST.arm&&Date.now()-ST.arm>=5900){ST.arm=0;rr()}},6100)}rr();return}});
D.addEventListener("change",e=>{const t=e.target;if(!t||!t.dataset)return;
 if(t.dataset.scmF){ST[t.dataset.scmF]=t.value;S.v.scm_v=0;rr();return}
 if(t.dataset.scmBulk!=null){const ids=(W.__scmBulk||{})[t.dataset.scmBulk]||[],v=t.value;if(!v)return;const n=setDec(ids,v==="clear"?"":v,{force:true});toast(v==="clear"?"Cleared "+ids.length+" screens":"Marked "+ids.length+" screens "+DK[v].l,"good");rr();return}
 if(t.dataset.scmNote){const cur=ST.dec[t.dataset.scmNote];if(cur){cur.n=t.value.trim();delete cur.h;save();toast("Note saved","good")}else if(t.value.trim())toast("Pick a decision first, then add the note","info")}});
let qt=0;D.addEventListener("input",e=>{const t=e.target;if(!t||!t.hasAttribute||!t.hasAttribute("data-scm-q"))return;const v=t.value;ST.q=v;clearTimeout(qt);qt=setTimeout(()=>{rr();const el=D.querySelector("[data-scm-q]");if(el){el.focus();try{el.setSelectionRange(v.length,v.length)}catch(x){}}},200)});
D.addEventListener("toggle",e=>{const d=e.target;if(d&&d.matches&&d.matches("details[data-scm-g]"))ST.open[d.dataset.scmG]=d.open?1:0},true);

/* ---------- wiring: Feature Contract rules 1, 2 and 4 ---------- */
const sx=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o});
const STEPS=[
 sx("Scan the build","gen_scrmap.py reads every source file and the git history; the live registry adds names, menu area, access and contract scores.","robot","Platform owner","On demand","Source and registry","Screen facts"),
 sx("Review the evidence","Look at hidden screens, screens with no link, and the signal score band by band.","human","Platform owner","Per session","Screen facts","Shortlist"),
 sx("Decide","Mark each screen Wedge, Keep, Defer or Cut and give a reason. Pre-filled hints stay marked until confirmed.","human","Founder","Per session","Shortlist","Decisions"),
 sx("Check the wedge","The wedge must be 5 to 8 screens. More than 8 means demote some.","human","Founder","Per session","Decisions","Confirmed wedge"),
 sx("Hand off","Export Markdown to the vault and the Development backlog; cut files are removed in a build round.","human","Platform owner","After each pass","Confirmed wedge","Vault note, build ticket")];
try{PROC.reg(SELF,{title:"How screens are chosen to stay or go",std:["togaf"],steps:STEPS})}catch(e){}
const ENT=[{id:"screen_decision",label:"Screen decision",domain:"plat",source:"Screen map",ownerApp:"Screen map",ownerMod:SELF,status:"live",steward:"Platform owner",
 note:"Integration decision: reuse the screen registry for the screen and the person record for the decider; add one small table for the decision itself. Decisions are kept per browser until exported.",
 fields:[{k:"screen_id",label:"Screen ID",type:"string",authority:"platform",classification:"internal",req:true},{k:"decision",label:"Decision",type:"enum",opts:["wedge","keep","defer","cut"],authority:"platform",classification:"internal",req:true},{k:"reason",label:"Reason",type:"string",authority:"platform",classification:"internal"},{k:"decided_by",label:"Decided by",type:"ref",authority:"platform",classification:"personal"},{k:"decided_on",label:"Decided on",type:"date",authority:"platform",classification:"internal"},{k:"signal_score",label:"Signal score at the time",type:"number",authority:"platform",classification:"internal"}]}];
const PROCS=[{id:"scr.review",name:"Choose which screens stay",module:SELF,family:"Platform and administration",owner:"Platform owner",trigger:"Before a design-partner pilot, or after a build round that adds screens",steps:STEPS,inputs:["Registered screens","Source scan","Feature contract scores"],outputs:["Wedge list","Defer and cut lists"],entities:["screen_decision"],metrics:["m_scr_decided","m_scr_wedge","m_scr_hidden"],model:"cmmi",target:3}];
const WIRE={ent:0,mod:0,flow:0,proc:0,nav:0,tries:0};
function wire(){WIRE.tries++;
 try{if(!WIRE.nav&&W.NAVX&&NAVX.add){NAVX.add(SELF,{group:"plat",label:"Screen map: what stays and what goes",hint:"Screen map",sub:"Scope",kw:"screens inventory modules keep cut defer wedge scope narrow simplify decide remove"});WIRE.nav=1}}catch(e){}
 try{if(!WIRE.ent&&W.ATLAS&&ATLAS.addEntity){let ok=true;ENT.forEach(d=>{try{const r=ATLAS.addEntity(d);if(r&&r.ok===false&&!(r.warnings||[]).some(w=>/already exists/.test(w)))ok=false}catch(e){ok=false}});WIRE.ent=ok?1:0}}catch(e){}
 try{if(!WIRE.mod&&W.MODMAP&&MODMAP.addModule){const r=MODMAP.addModule({id:SELF,name:"Screen map",sn:"Screen map",scr:SELF,band:"plt",own:"Platform owner",r:["person"],w:["screen_decision"],proposed:false,flows:[]});if(r&&r.ok!==false)WIRE.mod=1}}catch(e){}
 try{if(WIRE.mod&&!WIRE.flow&&W.MODMAP&&MODMAP.addFlows){const has=id=>(MODMAP.modules||[]).some(m=>m&&m.id===id),fl=[];
  if(has("nav_studio"))fl.push({from:SELF,to:"nav_studio",data:"Screens marked Defer or Cut, so the menu can hide or retire them",entity:"screen_decision",mode:"event",trig:"A decision changes"});
  if(has("plat_contract"))fl.push({from:"plat_contract",to:SELF,data:"Feature contract score per screen",entity:"screen_decision",mode:"api",trig:"Screen map opens"});
  if(fl.length){const r=MODMAP.addFlows(fl);if(r&&r.ok!==false)WIRE.flow=1}}}catch(e){}
 try{if(WIRE.mod&&WIRE.ent&&!WIRE.proc&&W.PROCLIB&&PROCLIB.addProcess){let ok=true;PROCS.forEach(p=>{try{const r=PROCLIB.addProcess(p);if(r&&r.ok===false)ok=false}catch(e){ok=false}});WIRE.proc=ok?1:0}}catch(e){}
 if(!(WIRE.nav&&WIRE.ent&&WIRE.mod&&WIRE.flow&&WIRE.proc)&&WIRE.tries<14)setTimeout(wire,900)}
setTimeout(wire,800);
W.SCRMAP={build,openScr,wire:WIRE,decisions:()=>ST.dec,set:setDec};
G(()=>SEARCHX.push(()=>build().map(r=>({g:"Screen decisions",t:r.label+" (screen decision)",m:r.decision?DK[r.decision].l:"Undecided",c:"--story",f:()=>openScr(r.id),k:r.id+" "+r.formal+" keep cut defer wedge"}))));
G(()=>ASKX.push(q=>{const l=q.trim().toLowerCase();
 if(!/(screen map|which screens.*(cut|keep|defer|wedge|undecided)|(what|which).*wedge|undecided screens|screens (we|i) (cut|keep|defer)|what stays and what goes)/.test(l))return false;
 const RS=build(),t=tally(RS),w=RS.filter(r=>r.decision==="wedge").map(r=>r.label);
 say(q,{t:`${RS.length} screens: ${t.wedge} wedge, ${t.keep} keep, ${t.defer} defer, ${t.cut} cut, ${t.none} undecided.${w.length?" Wedge: "+w.join("; ")+".":" No wedge chosen yet."} I opened the Screen map.`,steps:["Read the screen registry","Counted your saved decisions"],act:()=>go(SELF)});go(SELF);return true}));
})();
