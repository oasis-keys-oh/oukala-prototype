/* ===== mod_r32_num_b: numbers for every process, step, child step and build, so each one can be named, searched and linked.
   P-014 is a process, P-014.3 a step in it, P-014.3.1 a child step (a step inside a collapsed sub-flow group), B-012 an agent or robot to build.
   Numbers are stored, not derived from sort order: mod_r32_num_a_data.js is the committed list (written by gen_num.py), and anything newer
   (a process or step added in the designer) is appended in this browser. A number is never reused and never changes when a process is edited.
   A step that is deleted keeps its number, retired. ===== */
(function(){
const W=window,D=document;
const DATA=W.NUM_DATA||{v:1,p:{},s:{},c:{},b:{},t:{}};
const LS="fx.num.v1";
let L={p:{},s:{},c:{},b:{},t:{}};
try{const r=JSON.parse(localStorage.getItem(LS)||"null");if(r&&r.v===1)L=Object.assign(L,r)}catch(e){}
const save=()=>{try{localStorage.setItem(LS,JSON.stringify(Object.assign({v:1},L)))}catch(e){}};
const NUM=W.NUM={};
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
 let m=/^B-?(\d{1,4})$/.exec(t);if(m){const n=+m[1];const k=[DATA.b,L.b].map(o=>Object.keys(o).find(x=>o[x]===n)).find(Boolean);return k?{kind:"b",n,key:k}:null}
 m=/^P-?(\d{1,4})((?:\.\d+){0,3})$/.exec(t);if(!m)return null;const n=+m[1],key=rev().get(n);if(!key)return null;
 const parts=m[2]?m[2].slice(1).split(".").map(Number):[];if(!parts.length)return {kind:"p",n,key};
 const T=top(key),e=T[parts[0]-1];if(!e)return {kind:"p",n,key,miss:true};
 if(e.indexOf("g:")===0){const g=e.slice(2);if(parts.length===1)return {kind:"g",n,key,g};const id=kids(key,g)[parts[1]-1];return id?{kind:"s",n,key,id,g,child:true}:{kind:"g",n,key,g}}
 return {kind:"s",n,key,id:e}};
/* open it: a process or step opens the designer (switching tenant first when it belongs to another), a build opens its summary */
NUM.open=function(text){const r=NUM.resolve(text);if(!r)return false;
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
try{SEARCHX.push(()=>{const inp=D.getElementById("q"),t=String((inp&&inp.value)||"").trim();if(!/^[pb]-?\d/i.test(t))return[];const r=NUM.resolve(t);if(!r)return[];
 let nm="";try{if(r.kind==="b"){const B=JXR.builds().find(x=>NUM.build(x.key)===NUM.bstr(r.n));nm=B?B.title:""}else{const f=FLOWX.get(NUM.flowId(r.key));nm=f?f.name:"";if(r.kind!=="p"&&f){const nd=f.nodes.find(n=>n.id===r.id);if(nd)nm+=" · "+nd.n}}}catch(e){}
 const label=(r.kind==="b"?"Build ":r.kind==="p"?"Process ":"Step ")+t.toUpperCase()+(nm?" · "+nm:"");
 return [{g:"Go to",t:label,m:"Number",c:"--p4",f:()=>NUM.open(t),k:t.toLowerCase()}]})}catch(e){}
/* the Ctrl K palette builds a cached index, so a typed number is handled here: a row at the top, and Enter opens it */
(function(){
 const inp=()=>D.getElementById("nxPalIn"),ul=()=>D.getElementById("nxPalList");
 const label=(r,t)=>{let nm="";try{if(r.kind==="b"){const B=JXR.builds().find(x=>NUM.build(x.key)===NUM.bstr(r.n));nm=B?B.title:""}else{const f=FLOWX.get(NUM.flowId(r.key));nm=f?f.name:"";if(r.kind==="s"&&f){const nd=f.nodes.find(n=>n.id===r.id);if(nd)nm+=" · "+nd.n}}}catch(e){}
  return (r.kind==="b"?"Build ":r.kind==="p"?"Process ":r.kind==="g"?"Step group ":"Step ")+t.toUpperCase()+(nm?" · "+nm:"")};
 function paint(){const i=inp(),l=ul();if(!i||!l)return;const t=i.value.trim();let el=l.querySelector(":scope>.num-pal");
  const r=/^[pb]-?\d/i.test(t)?NUM.resolve(t):null;
  if(!r){if(el)el.remove();return}
  const txt=label(r,t);if(el&&el.dataset.sig===t+"|"+txt&&l.firstElementChild===el)return;if(el)el.remove();
  el=D.createElement("li");el.className="num-pal";el.setAttribute("role","presentation");el.dataset.sig=t+"|"+txt;
  el.innerHTML=`<div class="eyebrow">Number</div><button type="button" class="num-palrow" data-num-open="${E(t)}">${NUM.chip(t.toUpperCase())}<span>${E(txt)}</span><small>Enter to open</small></button>`;
  l.insertBefore(el,l.firstChild)}
 let tm=0;const sch=()=>{clearTimeout(tm);tm=setTimeout(paint,60)};
 try{new MutationObserver(()=>{const i=inp();if(i&&/^[pb]-?\d/i.test(i.value.trim())||D.querySelector(".num-pal"))sch()}).observe(D.body,{childList:true,subtree:true})}catch(e){}
 D.addEventListener("input",e=>{if(e.target&&e.target.id==="nxPalIn")sch()},true);
 W.addEventListener("keydown",e=>{if(e.key!=="Enter"||!e.target||e.target.id!=="nxPalIn")return;const t=e.target.value.trim();
  if(/^[pb]-?\d/i.test(t)&&NUM.resolve(t)){e.preventDefault();e.stopPropagation();try{NAVX.palette.close()}catch(x){}NUM.open(t)}},true);
 D.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".num-palrow");if(b){try{NAVX.palette.close()}catch(x){}}},true);
})();
const fromHash=()=>{const h=decodeURIComponent((location.hash||"").replace(/^#\/?/,""));if(/^[PpBb]-?\d/.test(h)){setTimeout(()=>{try{NUM.open(h)}catch(e){}},900)}};
W.addEventListener("hashchange",fromHash);fromHash();
/* link to a number: #P-014.3 */
NUM.link=text=>location.href.split("#")[0]+"#"+String(text).toUpperCase();
/* a click on any element with data-num-open opens that number */
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-num-open]");if(t){e.preventDefault();NUM.open(t.getAttribute("data-num-open"))}});

/* ---------- used by the generator and the checks ---------- */
NUM.__dump=()=>({v:1,p:Object.assign({},DATA.p,L.p),s:Object.assign({},DATA.s,Object.fromEntries(Object.keys(L.s).map(k=>[k,top(k)]))),c:Object.assign({},DATA.c,Object.fromEntries(Object.keys(L.c).map(k=>[k,kids.apply(null,k.split("#"))]))),b:Object.assign({},DATA.b,L.b),t:Object.assign({},DATA.t,L.t)});
NUM.__reset=()=>{L={p:{},s:{},c:{},b:{},t:{}};try{localStorage.removeItem(LS)}catch(e){}};
NUM.__local=()=>L;
})();
