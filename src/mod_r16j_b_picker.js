/* ===== Round 16, Agent J: window.PICKER, the shared scalable picker (single or multi).
   Searchable combobox with keyboard, grouping, recent and starred, a virtualized list (10,000+ options), chips with an "n selected" summary
   for multi-select, and an async-ready adapter. Built on the R15 PICK.person pattern (same markup rules, same tokens).
   PICKER.html({id,label,source,multi,value,onPick,placeholder,none,recent,group,inline,maxChips,noun,height}) -> html
     source: a LISTS entity name ("projects"), an array of {v,l,sub,grp} or [value,label] pairs, or an adapter
     adapter: { count():n, query({q,offset,limit}) -> {rows:[{v,l,sub,grp}],total} | Promise of the same, resolve(ids) -> rows | Promise }
   PICKER.value(id) / set(id,val) / open(id) / close() / formField(fid,f,val) / upgrade(root) (turns a group of 8+ toggle chips into a picker)
   PICKER.perf = {open,filter,rows,windowRows} for the scale test ===== */
(function(){
const W=window;
const H=U.esc;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const ROW=44,HEAD=28,PAGE=200;
const REG={};let SEQ=0;
const perf={open:0,filter:0,rows:0,windowRows:0};
/* ---- storage for recent and starred: per viewer convenience only ---- */
const ls={get(k){try{return JSON.parse(localStorage.getItem(k)||"[]")}catch(e){return []}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
/* ---- adapters ---- */
function arrAdapter(arr){const opts=arr.map(x=>Array.isArray(x)?{v:String(x[0]),l:String(x[1]!=null?x[1]:x[0]),sub:x[2]||"",grp:x[3]||""}:(typeof x==="object"?{v:String(x.v),l:String(x.l!=null?x.l:x.v),sub:x.sub||"",grp:x.grp||"",c:x.c}:{v:String(x),l:String(x),sub:"",grp:""}));
 const idx=new Map(opts.map(x=>[x.v,x]));
 return {count:()=>opts.length,all:()=>opts,query({q}){let a=opts;if(q){const t=q.toLowerCase().split(/\s+/).filter(Boolean);a=a.filter(x=>{x._h=x._h||(x.l+" "+x.sub+" "+x.grp+" "+x.v).toLowerCase();return t.every(w=>x._h.includes(w))});
   const ql=q.toLowerCase();a=a.map(x=>[x,x.l.toLowerCase().startsWith(ql)?0:1]).sort((p,r)=>p[1]-r[1]).map(p=>p[0])}return {rows:a,total:a.length}},resolve:ids=>ids.map(i=>idx.get(String(i))||{v:String(i),l:String(i),sub:"",grp:""})}}
function adapterOf(o){const s=o.source;if(typeof s==="string"){if(W.LISTS&&LISTS.meta(s))return LISTS.adapter(s,{consumer:o.consumer||o.id});return arrAdapter([])}
 if(s&&typeof s.query==="function")return s;if(typeof s==="function")return adapterOf(Object.assign({},o,{source:s()}));return arrAdapter(Array.isArray(s)?s:[])}
const isP=x=>x&&typeof x.then==="function";
/* ---- state ---- */
const sel=R=>R.o.multi?R.val:(R.val?new Set([R.val]):new Set());
function lab(R,v){return (R.lab.get(v)||{}).l||v}
function remember(R,rows){rows.forEach(x=>{if(!x.h)R.lab.set(x.v,x)})}
/* ---- build the flat, windowed item list ---- */
function build(R){const t0=performance.now();const q=R.q.trim();
 const done=res=>{R.total=res.total!=null?res.total:res.rows.length;R.rowsAll=res.rows;remember(R,res.rows);
  const items=[],o=R.o;let key=R.rkey;
  if(!q){const fav=new Set(ls.get("pk2:fav:"+key)),rec=ls.get("pk2:rec:"+key);const byV=new Map(res.rows.map(x=>[x.v,x]));
   const favs=[...fav].map(v=>byV.get(v)||R.lab.get(v)).filter(Boolean).slice(0,10),recs=rec.filter(v=>!fav.has(v)).map(v=>byV.get(v)||R.lab.get(v)).filter(Boolean).slice(0,5);
   R.fav=fav;if(o.none&&!o.multi)items.push({o:{v:"",l:o.none,sub:"",grp:"",none:1}});
   if(favs.length){items.push({h:"Starred"});favs.forEach(x=>items.push({o:x}))}
   if(recs.length){items.push({h:"Recent"});recs.forEach(x=>items.push({o:x}))}
   let g=null;const grouped=o.group!==false&&res.rows.some(x=>x.grp);
   res.rows.forEach(x=>{if(grouped&&x.grp!==g){g=x.grp;items.push({h:g||"Other"})}else if(!grouped&&g===null){g="";if(favs.length||recs.length)items.push({h:"All"})}items.push({o:x})})}
  else{R.fav=new Set(ls.get("pk2:fav:"+key));res.rows.forEach(x=>items.push({o:x}))}
  const offs=new Float64Array(items.length+1);let y=0;items.forEach((it,i)=>{offs[i]=y;y+=it.h?HEAD:ROW});offs[items.length]=y;
  R.items=items;R.offs=offs;R.H=y;R.act=items.findIndex(it=>it.o);R.loading=false;perf.filter=Math.round((performance.now()-t0)*10)/10;perf.rows=items.length;
  const first=items.findIndex(it=>it.o&&sel(R).has(it.o.v));if(!q&&first>=0&&!R.opened){R.act=first;R.opened=1}
  paintAll(R)};
 let res;try{res=R.ad.query({q,offset:0,limit:R.ad.paged?PAGE:undefined})}catch(e){res={rows:[],total:0}}
 if(isP(res)){R.loading=true;const tok=R.tok=(R.tok||0)+1;paintAll(R);res.then(r=>{if(tok===R.tok)done(r)},()=>{R.loading=false;paintAll(R)})}else done(res)}
function dom(R){return document.querySelector(`[data-pk2="${CSS.escape(R.id)}"]`)}
function popOf(R){return R.pop||(dom(R)&&dom(R).querySelector(".pk2-pop"))}
function paintAll(R){const pop=popOf(R);if(!pop||pop.hidden&&!R.o.inline)return;const sp=pop.querySelector(".pk2-sp");if(!sp)return;sp.style.height=(R.H||0)+"px";paintWin(R);
 const ft=pop.querySelector(".pk2-ft");if(ft){const n=R.ad.count?G(()=>R.ad.count(),R.total):R.total;const s=sel(R).size;ft.innerHTML=R.loading?"Loading…":`<span>${R.q?`${R.total} match${R.total===1?"":"es"} of ${n}`:`${n} ${H(R.o.noun||"options")}`}</span>${R.o.multi?`<span>${s} selected</span>`:""}`}
 const none=pop.querySelector(".pk2-none");if(none)none.hidden=!(R.items&&!R.items.some(i=>i.o)&&!R.loading);
 const tl=pop.querySelector(".pk2-tools");if(tl&&R.o.multi){const m=tl.querySelector("[data-pk2-all]");if(m){m.textContent=R.q?`Select ${R.total} matching`:`Select all ${R.total}`;m.hidden=R.total>2000}}}
function paintWin(R){const pop=popOf(R);if(!pop)return;const list=pop.querySelector(".pk2-list"),win=pop.querySelector(".pk2-win");if(!list||!win||!R.items)return;
 const st=list.scrollTop,vh=list.clientHeight||R.o.height||300,offs=R.offs;let lo=0,hi=R.items.length-1;
 while(lo<hi){const m=(lo+hi)>>1;if(offs[m+1]<=st)lo=m+1;else hi=m}
 let i0=Math.max(0,lo-4),i1=i0;while(i1<R.items.length&&offs[i1]<st+vh+ROW*4)i1++;
 const cur=sel(R),fav=R.fav||new Set();let h="";
 for(let i=i0;i<i1;i++){const it=R.items[i];if(it.h){h+=`<div class="pk2-g" role="presentation">${H(it.h)}</div>`;continue}
  const x=it.o,on=cur.has(x.v),a=i===R.act;
  h+=`<div class="pk2-o${a?" act":""}${on?" on":""}" role="option" id="pk2-${H(R.id)}-${i}" aria-selected="${on}" data-pk2-opt="${H(R.id)}" data-v="${H(x.v)}" data-i="${i}">${R.o.multi?`<i class="pk2-cb" aria-hidden="true">${on?"✓":""}</i>`:""}<span class="pk2-ono"><b>${H(x.l)}</b>${x.sub?`<small>${H(x.sub)}</small>`:""}</span>${x.none?"":`<button type="button" class="pk2-star${fav.has(x.v)?" on":""}" tabindex="-1" data-pk2-star="${H(R.id)}" data-v="${H(x.v)}" aria-label="${fav.has(x.v)?"Remove star from":"Star"} ${H(x.l)}" title="Star">${fav.has(x.v)?"★":"☆"}</button>`}</div>`}
 win.style.transform=`translateY(${offs[i0]||0}px)`;win.innerHTML=h;perf.windowRows=i1-i0;
 const inp=pop.querySelector(".pk2-q");if(inp&&R.act>=0)inp.setAttribute("aria-activedescendant",`pk2-${R.id}-${R.act}`);
 if(R.ad.paged&&R.rowsAll&&R.rowsAll.length<R.total&&i1>=R.items.length-3&&!R.more){R.more=1;const r=R.ad.query({q:R.q,offset:R.rowsAll.length,limit:PAGE});Promise.resolve(r).then(res=>{R.more=0;R.rowsAll=R.rowsAll.concat(res.rows);remember(R,res.rows);res.rows.forEach(x=>{R.offs=null;R.items.push({o:x})});const offs2=new Float64Array(R.items.length+1);let y=0;R.items.forEach((it,k)=>{offs2[k]=y;y+=it.h?HEAD:ROW});offs2[R.items.length]=y;R.offs=offs2;R.H=y;paintAll(R)})}}
function ensureVisible(R){const pop=popOf(R),list=pop&&pop.querySelector(".pk2-list");if(!list||!(R.act>=0)||!R.offs)return;const top=R.offs[R.act],bot=top+ROW;if(top<list.scrollTop)list.scrollTop=Math.max(0,top-HEAD);else if(bot>list.scrollTop+list.clientHeight)list.scrollTop=bot-list.clientHeight+4}
/* ---- markup ---- */
function chipsHTML(R){const o=R.o;const ids=[...R.val];const max=o.maxChips||5;const show=R.expand?ids:ids.slice(0,max);
 return `<div class="pk2-chips" aria-live="polite">${show.map(v=>`<span class="pk2-chip">${H(lab(R,v))}<button type="button" data-pk2-rm="${H(R.id)}" data-v="${H(v)}" aria-label="Remove ${H(lab(R,v))}">×</button></span>`).join("")}${ids.length>max?`<button type="button" class="pk2-chip more" data-pk2-expand="${H(R.id)}">${R.expand?"Show fewer":"+"+(ids.length-max)+" more"}</button>`:""}${ids.length?`<span class="pk2-sum">${ids.length} selected</span><button type="button" class="pk2-clr" data-pk2-clear="${H(R.id)}">Clear</button>`:`<span class="pk2-sum muted">${H(R.o.none||"None selected")}</span>`}</div>`}
function faceHTML(R){const o=R.o;if(o.multi)return `<span class="pk2-t"><b class="pk2-ph">${H(o.placeholder||"Add "+(o.noun||"items"))}</b><small>Type to search ${H(o.noun||"options")}</small></span>`;
 if(R.val){const x=R.lab.get(R.val);return `<span class="pk2-t"><b>${H(x?x.l:R.val)}</b>${x&&x.sub?`<small>${H(x.sub)}</small>`:""}</span>`}
 return `<span class="pk2-t"><b class="${o.none?"":"pk2-ph"}">${H(o.none||o.placeholder||"Choose "+(o.noun?"a "+String(o.noun).replace(/s$/,""):"one"))}</b><small>Type to search ${H(o.noun||"options")}</small></span>`}
function popHTML(R){const o=R.o,lbl=H(o.label||o.noun||"Options");
 return `<div class="pk2-pop${o.inline?" inline":""}" ${o.inline?"":"hidden"}><input type="search" class="pk2-q" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls="pk2-lb-${H(R.id)}" aria-label="Search ${H(o.noun||"options")}" placeholder="Search ${H(o.noun||"options")}" autocomplete="off" data-pk2-q="${H(R.id)}">
 ${o.multi?`<div class="pk2-tools"><button type="button" class="btn quiet" data-pk2-all="${H(R.id)}">Select all</button><button type="button" class="btn quiet" data-pk2-clear="${H(R.id)}">Clear</button></div>`:""}
 <div class="pk2-list" id="pk2-lb-${H(R.id)}" role="listbox" aria-label="${lbl}" ${o.multi?'aria-multiselectable="true"':""} tabindex="-1" style="height:${o.height||300}px"><div class="pk2-sp"><div class="pk2-win"></div></div></div><div class="pk2-none" hidden>No match. Try a name, ID or owner.</div><div class="pk2-ft"></div></div>`}
function html(o){const id=o.id||("pk2_"+(++SEQ));const prev=REG[id];
 const R=REG[id]=Object.assign(prev||{lab:new Map()},{id,o,ad:adapterOf(Object.assign({},o,{id})),q:"",rkey:o.recent||(typeof o.source==="string"?o.source:id),tok:0});
 if(o.value!==undefined||!prev)R.val=o.multi?new Set((o.value||[]).map(String)):(o.value==null||o.value===""?"":String(o.value));
 if(!R.lab)R.lab=new Map();
 /* seed labels for the selected values so the face is right before the list loads */
 const ids=o.multi?[...R.val]:(R.val?[R.val]:[]);if(ids.length&&!ids.every(v=>R.lab.has(v))){const r=G(()=>R.ad.resolve(ids),[]);if(isP(r))r.then(rows=>{remember(R,rows);refresh(R)});else remember(R,r||[])}
 const lbl=H(o.label||"");
 return `<div class="pk2${o.inline?" inline":""}" data-pk2="${H(id)}">${o.multi?chipsHTML(R):""}${o.inline?"":`<button type="button" class="pk2-btn" aria-haspopup="listbox" aria-expanded="false" ${o.disabled?"disabled":""} aria-label="${lbl||H(o.noun||"Picker")}${!o.multi&&R.val?": "+H(lab(R,R.val)):""}" data-pk2-open="${H(id)}">${faceHTML(R)}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>`}${popHTML(R)}</div>`}
function refresh(R){const root=dom(R);if(!root)return;const pop=root.querySelector(".pk2-pop");const wasHidden=pop&&pop.hidden;const inpv=pop&&pop.querySelector(".pk2-q")?pop.querySelector(".pk2-q").value:"";
 const chips=root.querySelector(".pk2-chips");if(chips&&R.o.multi)chips.outerHTML=chipsHTML(R);const btn=root.querySelector(".pk2-btn");if(btn){btn.innerHTML=faceHTML(R)+btn.querySelector("svg").outerHTML;btn.setAttribute("aria-label",(R.o.label||R.o.noun||"Picker")+(!R.o.multi&&R.val?": "+lab(R,R.val):""))}
 if(pop&&!wasHidden||R.o.inline)paintAll(R)}
/* ---- open and close ---- */
function place(R){const pop=R.pop,btn=R.btn;if(!pop||!btn)return;pop.style.position="fixed";pop.style.left="0px";pop.style.top="0px";const o0=pop.getBoundingClientRect();const r=btn.getBoundingClientRect();
 const w=Math.min(Math.max(r.width,320),innerWidth-16);const up=r.bottom+(R.o.height||300)+110>innerHeight&&r.top>(R.o.height||300)/2+80;
 let left=Math.min(Math.max(8,r.left),innerWidth-w-8);pop.style.width=w+"px";const ph=pop.getBoundingClientRect().height||((R.o.height||300)+110);
 let top=up?Math.max(8,r.top-ph-6):r.bottom+6;pop.style.left=(left-o0.left)+"px";pop.style.top=(top-o0.top)+"px";pop.classList.toggle("up",up)}
function closeAll(except){document.querySelectorAll(".pk2-pop:not([hidden]):not(.inline)").forEach(p=>{const root=p.closest(".pk2");if(except&&root===except)return;p.hidden=true;const b=root&&root.querySelector(".pk2-btn");if(b)b.setAttribute("aria-expanded","false")});}
function open(id){const R=REG[id];if(!R)return;const root=dom(R);if(!root)return;const pop=root.querySelector(".pk2-pop"),btn=root.querySelector(".pk2-btn");closeAll(root);
 if(!pop.hidden){pop.hidden=true;btn.setAttribute("aria-expanded","false");return}
 const t0=performance.now();R.pop=pop;R.btn=btn;R.q="";R.opened=0;pop.hidden=false;btn.setAttribute("aria-expanded","true");const inp=pop.querySelector(".pk2-q");inp.value="";
 place(R);build(R);place(R);const list=pop.querySelector(".pk2-list");list.scrollTop=0;ensureVisible(R);paintWin(R);inp.focus({preventScroll:true});perf.open=Math.round((performance.now()-t0)*10)/10}
function close(id){const R=id?REG[id]:null;if(R){const p=popOf(R);if(p&&!R.o.inline){p.hidden=true;const b=p.parentElement.querySelector(".pk2-btn");if(b){b.setAttribute("aria-expanded","false");b.focus({preventScroll:true})}}}else closeAll(null)}
/* ---- choose ---- */
function choose(R,v,opt){const o=R.o;
 if(v&&!(opt&&opt.none)){const key="pk2:rec:"+R.rkey;const r=ls.get(key).filter(x=>x!==v);r.unshift(v);ls.set(key,r.slice(0,8))}
 if(o.multi){if(R.val.has(v))R.val.delete(v);else{if(o.max&&R.val.size>=o.max){return}R.val.add(v)}}else R.val=v;
 const x=R.lab.get(v)||opt;
 if(o.multi){refresh(R);paintWin(R);fire(R,x)}else{refresh(R);close(R.id);fire(R,x)}}
function fire(R,x){const o=R.o;if(!o.onPick)return;const v=o.multi?[...R.val]:R.val;try{o.onPick(v,x&&x.raw?x.raw:x)}catch(e){console.error("PICKER onPick",e)}}
function setVal(id,val){const R=REG[id];if(!R)return;R.val=R.o.multi?new Set((val||[]).map(String)):(val==null?"":String(val));refresh(R)}
/* ---- events ---- */
document.addEventListener("mousedown",e=>{if(e.target.closest(".pk2-pop")&&!e.target.closest(".pk2-q"))e.preventDefault()},true);
document.addEventListener("click",e=>{let t;
 if(t=e.target.closest("[data-pk2-star]")){e.stopPropagation();const R=REG[t.dataset.pk2Star];if(!R)return;const key="pk2:fav:"+R.rkey,f=ls.get(key),v=t.dataset.v;const n=f.includes(v)?f.filter(x=>x!==v):f.concat(v);ls.set(key,n);const keep=popOf(R).querySelector(".pk2-list").scrollTop;build(R);popOf(R).querySelector(".pk2-list").scrollTop=keep;paintWin(R);return}
 if(t=e.target.closest("[data-pk2-opt]")){const R=REG[t.dataset.pk2Opt];if(!R)return;e.preventDefault();const it=R.items[+t.dataset.i];choose(R,t.dataset.v,it&&it.o);return}
 if(t=e.target.closest("[data-pk2-open]")){open(t.dataset.pk2Open);return}
 if(t=e.target.closest("[data-pk2-rm]")){const R=REG[t.dataset.pk2Rm];if(R&&R.o.multi){R.val.delete(t.dataset.v);refresh(R);fire(R)}return}
 if(t=e.target.closest("[data-pk2-expand]")){const R=REG[t.dataset.pk2Expand];if(R){R.expand=!R.expand;refresh(R)}return}
 if(t=e.target.closest("[data-pk2-clear]")){const R=REG[t.dataset.pk2Clear];if(R){R.val=new Set();refresh(R);if(!popOf(R).hidden)paintWin(R);fire(R)}return}
 if(t=e.target.closest("[data-pk2-all]")){const R=REG[t.dataset.pk2All];if(R){const q=R.q;const res=R.ad.query({q,offset:0,limit:undefined});Promise.resolve(res).then(r=>{r.rows.forEach(x=>{R.val.add(x.v)});remember(R,r.rows);refresh(R);paintWin(R);fire(R)})}return}
 if(!e.target.closest(".pk2"))closeAll(null)});
document.addEventListener("input",e=>{const t=e.target.closest&&e.target.closest("[data-pk2-q]");if(!t)return;const R=REG[t.dataset.pk2Q];if(!R)return;R.q=t.value;R.opened=1;clearTimeout(R.dt);const run=()=>{build(R);const l=popOf(R).querySelector(".pk2-list");l.scrollTop=0;paintWin(R)};
 if(R.ad.async)R.dt=setTimeout(run,180);else run()});
document.addEventListener("scroll",e=>{const l=e.target;if(l&&l.classList&&l.classList.contains("pk2-list")){const root=l.closest(".pk2");const R=root&&REG[root.dataset.pk2];if(R)paintWin(R)}else if(document.querySelector(".pk2-pop:not([hidden]):not(.inline)")){Object.values(REG).forEach(R=>{const p=popOf(R);if(p&&!p.hidden&&!R.o.inline&&R.btn&&R.btn.isConnected&&!(e.target.closest&&e.target.closest(".pk2-pop")))place(R)})}},true);
window.addEventListener("resize",()=>Object.values(REG).forEach(R=>{const p=popOf(R);if(p&&!p.hidden&&!R.o.inline&&R.btn&&R.btn.isConnected)place(R)}));
const stepTo=(R,dir,n)=>{const it=R.items;if(!it||!it.length)return;let i=R.act<0?(dir>0?-1:it.length):R.act;let c=0;while(c<(n||1)){let j=i+dir;while(j>=0&&j<it.length&&!it[j].o)j+=dir;if(j<0||j>=it.length)break;i=j;c++}R.act=i;paintWin(R);ensureVisible(R);paintWin(R)};
document.addEventListener("keydown",e=>{const root=e.target.closest&&e.target.closest(".pk2");if(!root)return;const R=REG[root.dataset.pk2];if(!R)return;const pop=root.querySelector(".pk2-pop");const isOpen=pop&&(!pop.hidden||R.o.inline);
 if(e.target.matches(".pk2-btn")){if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();if(!isOpen)open(R.id)}
  else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key!==" "){e.preventDefault();if(!isOpen)open(R.id);const inp=pop.querySelector(".pk2-q");inp.value=e.key;inp.dispatchEvent(new Event("input",{bubbles:true}))}return}
 if(!e.target.matches(".pk2-q"))return;
 const k=e.key;
 if(k==="Escape"&&!R.o.inline){e.preventDefault();e.stopPropagation();close(R.id)}
 else if(k==="ArrowDown"){e.preventDefault();stepTo(R,1)}else if(k==="ArrowUp"){e.preventDefault();stepTo(R,-1)}
 else if(k==="PageDown"){e.preventDefault();stepTo(R,1,7)}else if(k==="PageUp"){e.preventDefault();stepTo(R,-1,7)}
 else if(k==="Home"&&e.ctrlKey){e.preventDefault();R.act=R.items.findIndex(i=>i.o);paintWin(R);ensureVisible(R)}else if(k==="End"&&e.ctrlKey){e.preventDefault();for(let i=R.items.length-1;i>=0;i--)if(R.items[i].o){R.act=i;break}paintWin(R);ensureVisible(R)}
 else if(k==="Enter"){e.preventDefault();e.stopPropagation();const it=R.items&&R.items[R.act];if(it&&it.o)choose(R,it.o.v,it.o)}
 else if(k==="Tab"&&!R.o.inline){pop.hidden=true;const b=root.querySelector(".pk2-btn");if(b)b.setAttribute("aria-expanded","false")}
 else if(k==="Backspace"&&R.o.multi&&!e.target.value&&R.val.size){const last=[...R.val].pop();R.val.delete(last);refresh(R);paintWin(R);fire(R)}},true);
/* ---- form field adapter (kit.js calls this for chips with many options, multi, and type "pick") ---- */
function formField(fid,f,val){const multi=f.type==="multi"||!!f.multi;const src=f.src||f.source||(f.opts||[]).map(x=>Array.isArray(x)?x:[x,x]);
 const kv=f.opts&&f.opts.length&&Array.isArray(f.opts[0])?f.opts:null;
 return html({id:"form:"+fid+":"+f.k,label:f.label,noun:f.noun||(f.label||"options").toLowerCase(),source:kv&&!f.src?kv:src,multi,value:multi?(Array.isArray(val)?val:[]):val,placeholder:f.ph,none:f.none,recent:f.recent||("form:"+fid+":"+f.k),height:f.height,
  onPick:v=>{const st=W.FORMST&&FORMST[fid];if(!st)return;st.vals[f.k]=v;if(st.err)delete st.err[f.k];const spec=FORMSPEC[fid];const dep=spec&&spec.fields.some(x=>x.show);if(!multi||dep)refreshForm(fid);refreshLive(fid)}})}
/* ---- upgrade a group of toggle chips into a picker, keeping the original buttons (and their handlers) in place, hidden ---- */
const EXEMPT='[role=tablist],.vsw,.org-tabs,.pp2-tabs,.wbs-tabs,.gx-leg,.viz-gal,.viz-sz,.viz-shapes,.mm-world,.grc-hm-g,.statrow,.exe-glrow,.svc-cattiles,form[data-form],.pk2,.pk,.mp,.zs-gaplist,.pdays,.meet-bars,.bt-scroll,.org-chart,.cal,[data-no-picker]';
function upgrade(root){const t0=performance.now();root=root||document.getElementById("view");if(!root)return 0;let n=0;
 let UPN=0;const groups=new Map();root.querySelectorAll("button.chip[aria-pressed],button[aria-pressed][class*=chip],.chip[aria-pressed],button[data-fchip],button[aria-pressed][data-mat-model],button[aria-pressed][data-svc]").forEach(b=>{const p=b.parentElement;if(!p||p.dataset.pkUp||p.closest(EXEMPT))return;(groups.get(p)||groups.set(p,[]).get(p)).push(b)});
 groups.forEach((btns,p)=>{if(btns.length<8)return;if(btns.some(b=>b.hasAttribute("data-go")||b.hasAttribute("popovertarget")))return;
  const kids=[...p.children];if(btns.length<kids.length*0.7)return;
  const label=btns.map(b=>{const tn=[...b.childNodes].find(c=>c.nodeType===3&&c.textContent.trim());const full=b.textContent.trim().replace(/\s+/g," ");const first=tn?tn.textContent.trim():full;return {el:b,l:full,first,rest:tn&&full.length>first.length?full.slice(first.length).trim():""}});
  if(label.some(x=>!x.l))return;
  const pressed=btns.filter(b=>b.getAttribute("aria-pressed")==="true");const multi=p.dataset.multi!=null||pressed.length>1||btns.some(b=>b.hasAttribute("data-fmulti"));
  const id="up:"+S.screen+":"+((p.className||"g")+"").split(" ")[0]+":"+(UPN++);
  const opts=label.map((x,i)=>({v:String(i),l:x.first||x.l,sub:x.rest}));const noun=guessNoun(label.map(x=>x.first||x.l));
  const wrap=document.createElement("div");wrap.className="pk2-up";
  wrap.innerHTML=html({id,label:(p.getAttribute("aria-label")||noun),noun,source:opts,multi,value:multi?pressed.map(b=>String(btns.indexOf(b))):(pressed[0]?String(btns.indexOf(pressed[0])):""),recent:id.replace(/:\d+$/,""),height:280,
   onPick:(v)=>{const want=new Set(multi?v:[v]);btns.forEach((b,i)=>{const on=b.getAttribute("aria-pressed")==="true",w=want.has(String(i));if(!multi){if(w&&!on)b.click()}else if(on!==w){b.click()}});}});
  p.dataset.pkUp="1";p.parentElement.insertBefore(wrap,p);n++});
 perf.upgrade=Math.round((performance.now()-t0)*10)/10;return n}
function guessNoun(a){const j=a.join(" ").toLowerCase();if(/^chg|chg\d/.test(j))return "changes";if(/\bcpu\b|latency|memory/.test(j))return "metrics";if(/service offering|application|virtual machine/.test(j))return "classes";return "options"}
W.PICKER={html,value:id=>{const R=REG[id];return R?(R.o.multi?[...R.val]:R.val):null},set:setVal,open,close,formField,upgrade,perf,adapter:arrAdapter,reg:REG,close_all:()=>closeAll(null),levels:{ROW,HEAD}};
// inline pickers (drawers, panels) paint once they are attached to the DOM
(function(){let q=0;const run=()=>{q=0;try{document.querySelectorAll(".pk2.inline").forEach(r=>{const R=REG[r.dataset.pk2];const sp=r.querySelector(".pk2-sp");if(R&&sp&&!sp.style.height){R.pop=r.querySelector(".pk2-pop");R.q=R.q||"";build(R);paintAll(R)}})}catch(e){}};
try{new MutationObserver(()=>{if(!q)q=requestAnimationFrame(run)}).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}})();
})();
