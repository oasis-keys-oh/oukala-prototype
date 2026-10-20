/* ===== mod_r32_num_b: numbers for every process, step, child step and build, so each one can be named, searched and linked.
   P-014 is a process, P-014.3 a step in it, P-014.3.1 a child step (a step inside a collapsed sub-flow group), B-012 an agent or robot to build.
   Numbers are stored, not derived from sort order: mod_r32_num_a_data.js is the committed list (written by gen_num.py), and anything newer
   (a process or step added in the designer) is appended in this browser. A number is never reused and never changes when a process is edited.
   A step that is deleted keeps its number, retired.
   DC-02: records are numbered too, with the same rules: O-003 objective, O-003.2 key result 2 of that objective, PJ-004 project, BL-012 budget line,
   IV-003 invoice, LG-005 ledger line (management reserve ledger). The number is stored in NUM_DATA.r (committed) or this browser, and written onto the
   record itself as rec.num, so every screen that shows the record can show its number. ===== */
(function(){
const W=window,D=document;
const DATA=W.NUM_DATA||{v:1,p:{},s:{},c:{},b:{},t:{}};DATA.r=DATA.r||{};
const LS="fx.num.v1";
let L={p:{},s:{},c:{},b:{},t:{},r:{}};
{const r=U.store.get(LS,null);if(r&&r.v===1)L=Object.assign(L,r)}
L.r=L.r||{};
const save=()=>{U.store.set(LS,Object.assign({v:1},L))};
const NUM=W.NUM={};
/* any number this module can read: P-014, P-014.3, B-012, O-003, O-003.2, PJ-004, BL-012, IV-003, LG-005 */
const NRX=/^#?(pj|bl|iv|lg|p|b|o)-?\d/i;NUM.RX=NRX;
const pad=(n,w)=>String(n).padStart(w||3,"0");
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---------- keys ---------- */
NUM.keyOf=f=>{if(!f)return null;const id=String(f.id||"");if(id.indexOf("wfx:")===0)return"WFX|"+id.slice(4);if(id.indexOf("proc:")===0)return"PROC|"+id.slice(5);if(/^gen_\d+$/.test(id))return null;return"FLOW|"+id};
NUM.flowId=key=>{const [s,...r]=String(key).split("|"),x=r.join("|");return s==="WFX"?"wfx:"+x:s==="PROC"?"proc:"+x:x};
const tenantNow=()=>(W.SCN&&SCN.cur)||"core";

/* ---------- processes ---------- */
const maxP=()=>{let m=0;[DATA.p,L.p].forEach(o=>Object.keys(o).forEach(k=>{if(o[k]>m)m=o[k]}));return m};
NUM.pnum=function(key,create){if(!key)return null;let n=L.p[key]!=null?L.p[key]:DATA.p[key];if(n==null&&create!==false){n=maxP()+1;L.p[key]=n;L.t[key]=tenantNow();save()}return n==null?null:n};
NUM.pstr=n=>n==null?"":"P-"+pad(n);
NUM.proc=key=>NUM.pstr(NUM.pnum(key));
NUM.procOf=f=>NUM.proc(NUM.keyOf(f));
NUM.tenantOf=key=>L.t[key]||DATA.t[key]||"core";

/* ---------- steps and child steps ---------- */
const top=key=>(DATA.s[key]||[]).concat(L.s[key]||[]);
const kids=(key,g)=>(DATA.c[key+"#"+g]||[]).concat(L.c[key+"#"+g]||[]);
const addTop=(key,e)=>{(L.s[key]=L.s[key]||[]).push(e)};
const addKid=(key,g,id)=>{const k=key+"#"+g;(L.c[k]=L.c[k]||[]).push(id)};
const isTE=n=>n.t==="trigger"||n.t==="end";
/* the step number of a node. Registers the node the first time it is seen. */
NUM.snum=function(f,node){const key=NUM.keyOf(f);if(!key||!node||isTE(node))return null;const P=NUM.pnum(key);if(P==null)return null;
 let T=top(key);const g=node.g;
 if(g){const ge="g:"+g;let gi=T.indexOf(ge);if(gi<0){addTop(key,ge);save();T=top(key);gi=T.indexOf(ge)}
  let K=kids(key,g),ci=K.indexOf(node.id);if(ci<0){addKid(key,g,node.id);save();K=kids(key,g);ci=K.indexOf(node.id)}
  return [P,gi+1,ci+1]}
 let i=T.indexOf(node.id);if(i<0){addTop(key,node.id);save();T=top(key);i=T.indexOf(node.id)}return [P,i+1]};
NUM.sstr=a=>a?NUM.pstr(a[0])+"."+a.slice(1).join("."):"";
NUM.step=(f,node)=>NUM.sstr(NUM.snum(f,node));
/* a collapsed group is itself a step: P-014.4 */
NUM.group=function(f,gid){const key=NUM.keyOf(f);if(!key)return "";const P=NUM.pnum(key);let T=top(key);const ge="g:"+gid;let i=T.indexOf(ge);if(i<0){addTop(key,ge);save();T=top(key);i=T.indexOf(ge)}return NUM.pstr(P)+"."+(i+1)};
/* register every step of a flow in one pass, in the order the flow draws them */
NUM.syncFlow=function(f){if(!f||!f.nodes)return;f.nodes.forEach(n=>NUM.snum(f,n))};

/* ---------- builds ---------- */
const maxB=()=>{let m=0;[DATA.b,L.b].forEach(o=>Object.keys(o).forEach(k=>{if(o[k]>m)m=o[k]}));return m};
NUM.bnum=function(key){if(!key)return null;let n=L.b[key]!=null?L.b[key]:DATA.b[key];if(n==null){n=maxB()+1;L.b[key]=n;save()}return n};
NUM.bstr=n=>n==null?"":"B-"+pad(n);
NUM.build=key=>NUM.bstr(NUM.bnum(key));

/* ---------- reading a typed number ---------- */
const rev=()=>{const m=new Map();[DATA.p,L.p].forEach(o=>Object.keys(o).forEach(k=>m.set(o[k],k)));return m};
NUM.resolve=function(text){const t=String(text||"").trim().toUpperCase().replace(/^#/,"");
 const rr=NUM.rresolve(t);if(rr)return rr;
 let m=/^B-?(\d{1,4})$/.exec(t);if(m){const n=+m[1];const k=[DATA.b,L.b].map(o=>Object.keys(o).find(x=>o[x]===n)).find(Boolean);return k?{kind:"b",n,key:k}:null}
 m=/^P-?(\d{1,4})((?:\.\d+){0,3})$/.exec(t);if(!m)return null;const n=+m[1],key=rev().get(n);if(!key)return null;
 const parts=m[2]?m[2].slice(1).split(".").map(Number):[];if(!parts.length)return {kind:"p",n,key};
 const T=top(key),e=T[parts[0]-1];if(!e)return {kind:"p",n,key,miss:true};
 if(e.indexOf("g:")===0){const g=e.slice(2);if(parts.length===1)return {kind:"g",n,key,g};const id=kids(key,g)[parts[1]-1];return id?{kind:"s",n,key,id,g,child:true}:{kind:"g",n,key,g}}
 return {kind:"s",n,key,id:e}};
/* open it: a process or step opens the designer (switching tenant first when it belongs to another), a build opens its summary */
NUM.open=function(text){const r=NUM.resolve(text);if(!r)return false;
 if(r.kind==="r")return NUM.ropen(r);
 if(r.kind==="b"){try{const B=JXR.builds().find(x=>NUM.build(x.key)===NUM.bstr(r.n));if(B){go("ppl_jrny");setTimeout(()=>{try{JXR.buildDrawer(B.id)}catch(e){}},200);return true}}catch(e){}return false}
 const ten=NUM.tenantOf(r.key);if(W.TENANT&&ten&&ten!==SCN.cur&&SCN.list[ten])TENANT.switch(ten);
 const fid=NUM.flowId(r.key);try{FLOWX.open(fid,r.kind==="s"?r.id:r.kind==="g"?"grp:"+r.g:undefined);return true}catch(e){console.error("NUM.open",e);return false}};

/* step number from the stored list alone (no flow needed): used for journey boxes and process lists */
NUM.stepById=(key,id)=>{const P=NUM.pnum(key,false);if(P==null||!id)return "";const i=top(key).indexOf(id);return i<0?"":NUM.pstr(P)+"."+(i+1)};
/* ---------- little chips other views can use ---------- */
NUM.chip=(txt,title)=>txt?`<span class="num-chip" title="${E(title||"Number. Type it in search to open it.")}">${E(txt)}</span>`:"";
NUM.pchip=key=>NUM.chip(NUM.proc(key),"Process number");
NUM.schip=(f,node)=>NUM.chip(NUM.step(f,node),"Step number");
NUM.bchip=key=>NUM.chip(NUM.build(key),"Build number");

/* ---------- search (Ctrl K) and links ---------- */
try{SEARCHX.push(()=>{const inp=D.getElementById("q"),t=String((inp&&inp.value)||"").trim();if(!NRX.test(t))return[];const r=NUM.resolve(t);if(!r)return[];if(r.kind==="r")return [{g:"Go to",t:NUM.rlabel(r,t),m:"Number",c:"--p4",f:()=>NUM.open(t),k:t.toLowerCase()}];
 let nm="";try{if(r.kind==="b"){const B=JXR.builds().find(x=>NUM.build(x.key)===NUM.bstr(r.n));nm=B?B.title:""}else{const f=FLOWX.get(NUM.flowId(r.key));nm=f?f.name:"";if(r.kind!=="p"&&f){const nd=f.nodes.find(n=>n.id===r.id);if(nd)nm+=" · "+nd.n}}}catch(e){}
 const label=(r.kind==="b"?"Build ":r.kind==="p"?"Process ":"Step ")+t.toUpperCase()+(nm?" · "+nm:"");
 return [{g:"Go to",t:label,m:"Number",c:"--p4",f:()=>NUM.open(t),k:t.toLowerCase()}]})}catch(e){}
/* the Ctrl K palette builds a cached index, so a typed number is handled here: a row at the top, and Enter opens it */
(function(){
 const inp=()=>D.getElementById("nxPalIn"),ul=()=>D.getElementById("nxPalList");
 const label=(r,t)=>{if(r.kind==="r")return NUM.rlabel(r,t);let nm="";try{if(r.kind==="b"){const B=JXR.builds().find(x=>NUM.build(x.key)===NUM.bstr(r.n));nm=B?B.title:""}else{const f=FLOWX.get(NUM.flowId(r.key));nm=f?f.name:"";if(r.kind==="s"&&f){const nd=f.nodes.find(n=>n.id===r.id);if(nd)nm+=" · "+nd.n}}}catch(e){}
  return (r.kind==="b"?"Build ":r.kind==="p"?"Process ":r.kind==="g"?"Step group ":"Step ")+t.toUpperCase()+(nm?" · "+nm:"")};
 function paint(){const i=inp(),l=ul();if(!i||!l)return;const t=i.value.trim();let el=l.querySelector(":scope>.num-pal");
  const r=NRX.test(t)?NUM.resolve(t):null;
  if(!r){if(el)el.remove();return}
  const txt=label(r,t);if(el&&el.dataset.sig===t+"|"+txt&&l.firstElementChild===el)return;if(el)el.remove();
  el=D.createElement("li");el.className="num-pal";el.setAttribute("role","presentation");el.dataset.sig=t+"|"+txt;
  el.innerHTML=`<div class="eyebrow">Number</div><button type="button" class="num-palrow" data-num-open="${E(t)}">${NUM.chip(t.toUpperCase())}<span>${E(txt)}</span><small>Enter to open</small></button>`;
  l.insertBefore(el,l.firstChild)}
 let tm=0;const sch=()=>{clearTimeout(tm);tm=setTimeout(paint,60)};
 try{new MutationObserver(()=>{const i=inp();if(i&&NRX.test(i.value.trim())||D.querySelector(".num-pal"))sch()}).observe(D.body,{childList:true,subtree:true})}catch(e){}
 D.addEventListener("input",e=>{if(e.target&&e.target.id==="nxPalIn")sch()},true);
 W.addEventListener("keydown",e=>{if(e.key!=="Enter"||!e.target||e.target.id!=="nxPalIn")return;const t=e.target.value.trim();
  if(NRX.test(t)&&NUM.resolve(t)){e.preventDefault();e.stopPropagation();try{NAVX.palette.close()}catch(x){}NUM.open(t)}},true);
 D.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".num-palrow");if(b){try{NAVX.palette.close()}catch(x){}}},true);
})();
const fromHash=()=>{const h=decodeURIComponent((location.hash||"").replace(/^#\/?/,""));if(NRX.test(h)&&NUM.resolve(h)){setTimeout(()=>{try{NUM.open(h)}catch(e){}},900)}};
W.addEventListener("hashchange",fromHash);fromHash();
/* link to a number: #P-014.3 */
NUM.link=text=>location.href.split("#")[0]+"#"+String(text).toUpperCase();
/* a click on any element with data-num-open opens that number */
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-num-open]");if(t){e.preventDefault();NUM.open(t.getAttribute("data-num-open"))}});

/* ---------- records: objectives, key results, projects, budget lines, invoices, ledger lines (DC-02) ----------
   Keys are "<tenant>|<native id>", so two tenants can both have a PR1 without sharing a number. A key result is numbered inside its objective:
   O-003.2 is the second key result registered under O-003, and keeps that number even if it later moves to another objective. */
const G_=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const ten=()=>G_(()=>W.DATA.tenant(),"core");
const RK=NUM.RKINDS={
 obj:{pre:"O",label:"Objective",ent:"objectives",core:()=>G_(()=>S.exe.objs,[]),name:r=>r.n},
 kr:{pre:"O",label:"Key result",core:()=>G_(()=>S.exe.krs,[]),pf:"o",name:r=>r.n},
 proj:{pre:"PJ",label:"Project",ent:"projects",core:()=>G_(()=>PROJ,[]),name:r=>r.n},
 line:{pre:"BL",label:"Budget line",ent:"budget_lines",core:()=>G_(()=>S.bud.lines,[]),name:r=>r.n},
 inv:{pre:"IV",label:"Invoice",ent:"invoices",core:()=>G_(()=>INVOICES,[]),name:r=>(r.vendor?r.vendor+" ":"")+r.id},
 led:{pre:"LG",label:"Ledger line",core:()=>G_(()=>S.bud.led,[]),name:r=>r.id+(r.why?" · "+r.why:"")}};
/* rows of one kind for a tenant: Meridian reads its own registries; any other tenant reads its pack through DATA (none for key results or ledger yet) */
NUM.rrows=(kind,t)=>{t=t||ten();const k=RK[kind];if(!k)return[];if(t==="core")return k.core()||[];return k.ent?G_(()=>W.DATA.get(k.ent,{tenant:t}),[]):[]};
const rkey=(t,id)=>t+"|"+id;
const rget=(kind,key)=>{const a=L.r[kind]&&L.r[kind][key];return a!=null?a:(DATA.r[kind]?DATA.r[kind][key]:undefined)};
const rmax=kind=>{let m=0;[DATA.r[kind]||{},L.r[kind]||{}].forEach(o=>Object.keys(o).forEach(k=>{const v=o[k];if(typeof v==="number"&&v>m)m=v}));return m};
const krmax=on=>{let m=0;[DATA.r.kr||{},L.r.kr||{}].forEach(o=>Object.keys(o).forEach(k=>{const v=o[k];if(Array.isArray(v)&&v[0]===on&&v[1]>m)m=v[1]}));return m};
const rput=(kind,key,v)=>{(L.r[kind]=L.r[kind]||{})[key]=v;save()};
NUM.rstr=(kind,v)=>v==null||!RK[kind]?"":kind==="kr"?(Array.isArray(v)?"O-"+pad(v[0])+"."+v[1]:""):RK[kind].pre+"-"+pad(v);
/* the number of a record. Registers it the first time it is seen and writes it onto the record itself (rec.num). */
NUM.rnum=function(kind,id,t,create){t=t||ten();const K=RK[kind];if(!K||id==null||id==="")return "";const key=rkey(t,id);let v=rget(kind,key);
 if(v==null&&create!==false){
  if(kind==="kr"){const row=NUM.rrows("kr",t).find(r=>r&&r.id===id);if(!row)return "";const on=NUM.rnum("obj",row[K.pf],t);if(!on)return "";const o=+on.slice(2);v=[o,krmax(o)+1]}
  else{if(!NUM.rrows(kind,t).some(r=>r&&r.id===id))return "";v=rmax(kind)+1}
  rput(kind,key,v)}
 if(v==null)return "";const s=NUM.rstr(kind,v);const row=NUM.rrows(kind,t).find(r=>r&&r.id===id);if(row&&row.num!==s)G_(()=>{row.num=s});return s};
NUM.rec=(kind,id,t)=>NUM.rnum(kind,id,t);
NUM.recIf=(kind,id,t)=>NUM.rnum(kind,id,t,false);
/* number every record of a tenant in one pass (a few dozen rows); returns how many numbers were new */
NUM.syncRecords=function(t){t=t||ten();let n=0;Object.keys(RK).forEach(kind=>NUM.rrows(kind,t).forEach(r=>{if(!r||r.id==null||r.gen)return;const had=rget(kind,rkey(t,r.id))!=null;if(NUM.rnum(kind,r.id,t)&&!had)n++}));return n};
const RRX=/^(PJ|BL|IV|LG|O)-?(\d{1,4})(?:\.(\d{1,3}))?$/;
NUM.rresolve=function(text){const m=RRX.exec(String(text||"").trim().toUpperCase().replace(/^#/,""));if(!m)return null;const pre=m[1],n=+m[2],sub=m[3]!=null?+m[3]:null;
 const kind=pre==="O"?(sub!=null?"kr":"obj"):Object.keys(RK).find(k=>RK[k].pre===pre);if(!kind)return null;
 for(const src of [L.r[kind]||{},DATA.r[kind]||{}])for(const key of Object.keys(src)){const v=src[key];const ok=kind==="kr"?(Array.isArray(v)&&v[0]===n&&v[1]===sub):v===n;
  if(ok){const i=key.indexOf("|");return {kind:"r",rk:kind,n,sub,tenant:key.slice(0,i),id:key.slice(i+1),num:NUM.rstr(kind,v)}}}
 return null};
NUM.rrow=r=>r&&r.kind==="r"?NUM.rrows(r.rk,r.tenant).find(x=>x&&x.id===r.id)||null:null;
NUM.rlabel=(r,t)=>{const row=NUM.rrow(r),K=RK[r.rk];return K.label+" "+(r.num||String(t||"").toUpperCase())+(row?" · "+G_(()=>K.name(row),r.id):" · "+r.id)};
/* open a numbered record where it lives. Another tenant's record switches tenant first (if allowed) and opens its thread. */
NUM.ropen=function(r){const t=r.tenant,id=r.id;
 if(t&&t!==ten()){if(!G_(()=>W.DATA.allowed(t),false))return false;G_(()=>SCN.set(t))}
 if(t&&t!=="core"){if(W.THREAD&&THREAD.open){THREAD.open(r.num);return true}return false}
 try{
  if(r.rk==="obj"){go("exe_strat");if(W.THREAD&&THREAD.open)setTimeout(()=>THREAD.open(r.num),120);return true}
  if(r.rk==="kr"){go("exe_strat");setTimeout(()=>G_(()=>EXE.krDrawer(id)),120);return true}
  if(r.rk==="proj"){if(typeof W.ppmOpenProject==="function"){W.ppmOpenProject(id);return true}go("ppm_proj");return true}
  if(r.rk==="line"){if(typeof W.openBudgetDrill==="function"){W.openBudgetDrill("line:"+id);return true}go("bud_lines");return true}
  if(r.rk==="inv"){go("inv",id);return true}
  if(r.rk==="led"){if(typeof W.openBudgetDrill==="function"){W.openBudgetDrill("led:"+id);return true}go("bud_over");return true}
 }catch(e){console.error("NUM.ropen",e)}return false};
NUM.rchip=(kind,id,t)=>NUM.chip(NUM.rec(kind,id,t),(RK[kind]||{label:"Record"}).label+" number. Type it in search to open it.");
/* CSV cross-reference of the record numbers (DC-02): objective, key result, project, budget line, invoice, ledger line, with the links between them */
NUM.recordRows=function(t){t=t||ten();NUM.syncRecords(t);const out=[];const N=(k,id)=>NUM.recIf(k,id,t);
 const objs=NUM.rrows("obj",t),krs=NUM.rrows("kr",t),projs=NUM.rrows("proj",t),lines=NUM.rrows("line",t),invs=NUM.rrows("inv",t),leds=NUM.rrows("led",t);
 const links=t==="core"?G_(()=>S.exe.links,{}):{};const con=t==="core"?G_(()=>S.bud.con,[]):[];
 objs.forEach(o=>out.push([t,N("obj",o.id),"Objective",o.id,o.n||"",o.owner||"","",""]));
 krs.forEach(k=>out.push([t,N("kr",k.id),"Key result",k.id,k.n||"",k.owner||"",N("obj",k.o),"Key result of"]));
 projs.forEach(p=>{const ws=Object.keys(links[p.id]||{});out.push([t,N("proj",p.id),"Project",p.id,p.n||"",p.owner||"",ws.map(o=>N("obj",o)).filter(Boolean).join(" "),ws.length?"Contributes to":""])});
 lines.forEach(l=>out.push([t,N("line",l.id),"Budget line",l.id,l.n||"",l.own||"",N("proj",l.p),"Funds project"]));
 invs.forEach(i=>{const c=con.find(x=>(x.inv||[]).indexOf(i.id)>=0);const ln=c&&lines.find(l=>l.id===c.line);out.push([t,N("inv",i.id),"Invoice",i.id,(i.vendor||"")+(i.contract?" · "+i.contract:""),"",ln?N("line",ln.id):c&&c.proj?N("proj",c.proj):"",ln?"Billed against budget line":c&&c.proj?"Billed to project":""])});
 leds.forEach(e=>out.push([t,N("led",e.id),"Ledger line",e.id,e.why||"",e.req||"",e.line?N("line",e.line):e.p?N("proj",e.p):"",e.line?"Posts to budget line":e.p?"Posts to project":"Portfolio reserve"]));
 return out};
NUM.recordHead=["Tenant","Number","Kind","Native id","Name","Owner","Linked number","Link"];
NUM.recordCSV=function(t){const q=v=>{v=v==null?"":String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};return [NUM.recordHead].concat(NUM.recordRows(t)).map(r=>r.map(q).join(",")).join("\n")};
NUM.exportRecords=function(t){const txt=NUM.recordCSV(t);try{const b=new Blob(["﻿"+txt],{type:"text/csv;charset=utf-8"}),u=URL.createObjectURL(b),a=D.createElement("a");a.href=u;a.download="record-numbers.csv";D.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},500);return true}catch(e){return false}};
/* keep records numbered as they are created (objective form, Self-build project, funded request, reserve draw) */
G_(()=>HOOKS.on("afterRender",()=>G_(()=>NUM.syncRecords(),0),{id:"num.records",order:50}));
G_(()=>HOOKS.on("tenantChange",()=>G_(()=>NUM.syncRecords(),0),{id:"num.records.tenant"}));

/* ---------- used by the generator and the checks ---------- */
NUM.__dump=()=>({v:1,p:Object.assign({},DATA.p,L.p),s:Object.assign({},DATA.s,Object.fromEntries(Object.keys(L.s).map(k=>[k,top(k)]))),c:Object.assign({},DATA.c,Object.fromEntries(Object.keys(L.c).map(k=>[k,kids.apply(null,k.split("#"))]))),b:Object.assign({},DATA.b,L.b),t:Object.assign({},DATA.t,L.t),r:Object.fromEntries(Object.keys(RK).map(k=>[k,Object.assign({},DATA.r[k]||{},L.r[k]||{})]))});
NUM.__reset=()=>{L={p:{},s:{},c:{},b:{},t:{},r:{}};U.store.del(LS)};
NUM.__local=()=>L;
})();
