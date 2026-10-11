/* ===== Round 15, Agent B: window.PICK, the shared person picklist (searchable combobox).
   Replaces rows of person pills. Shows name, title, team and cost center; type to filter; keyboard friendly.
   PICK.person({id,value,multi,onPick,placeholder,label,kinds,exclude,showMe}) -> html
   PICK.formField(fid,field,val) -> html used by kit forms for type:"people"
   PICK.applyDefaults(spec,vals) -> fills "Requested by" style fields with the logged-in user
   PICK.me() -> name of the logged-in user ===== */
(function(){
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const tryv=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const ME=()=>tryv(()=>(window.INBOX&&INBOX.me&&INBOX.me())||"Casey Rowan","Casey Rowan");
const REGP={};
const REQRE=/^(requested by|requester|requestor|raised by|reporter|submitted by|opened by|caller|requested for)\b/i;
const info=n=>{const r=tryv(()=>window.who&&who(n),null)||tryv(()=>(window.DIR||[]).find(d=>d.name===n),null);
 const cc=tryv(()=>window.CCMAP&&CCMAP.ccOfPerson(n),null);
 const u=tryv(()=>window.CCMAP&&CCMAP.unitOfPerson(n),null);return {name:n,title:r?(r.role||""):"",team:u||(r?(r.team||""):""),cc:cc?cc.code:"",kind:r?r.kind:"human"}};
function pool(o){const kinds=o.kinds||["human","contractor"];const ex=new Set(o.exclude||[]);
 return (window.DIR||[]).filter(d=>kinds.includes(d.kind)&&!ex.has(d.name)).map(d=>d.name)}
function reports(me){return tryv(()=>window.RF&&RF.directOf&&me!==ME()?RF.directOf(me):(window.ORGX&&ORGX.kids?ORGX.kids(me):[]),[])||[]}
function rank(names,q,o){const me=(o&&o.me)||ME(),rep=new Set(reports(me));q=(q||"").trim().toLowerCase();
 const rows=names.map(n=>{const i=info(n),hay=(i.name+" "+i.title+" "+i.team+" "+i.cc).toLowerCase();return {i,hay}});
 let out=rows;if(q){const t=q.split(/\s+/);out=rows.filter(r=>t.every(x=>r.hay.includes(x)));out.forEach(r=>{r.s=(r.i.name.toLowerCase().startsWith(q)?0:r.i.name.toLowerCase().includes(q)?1:2)})}
 else out.forEach(r=>{r.s=r.i.name===me?0:rep.has(r.i.name)?1:2});
 out.sort((a,b)=>a.s-b.s||a.i.name.localeCompare(b.i.name));return out.map(r=>({...r.i,grp:r.i.name===me?"You":rep.has(r.i.name)?"Your reports":"Everyone"}))}
function rowHTML(x,sel,act,id){return `<button type="button" role="option" class="pk-o ${act?"act":""}" aria-selected="${sel}" data-pk-pick="${H(id)}" data-n="${H(x.name)}"><span class="pk-ono"><b>${H(x.name)}${x.grp==="You"?" (you)":""}</b><small>${H([x.title,x.team].filter(Boolean).join(" · "))}</small></span>${x.cc?`<span class="pk-cc">${H(x.cc)}</span>`:""}</button>`}
function listHTML(id,q){const R=REGP[id];if(!R)return "";const o=R.o,all=rank(pool(o),q,o),cap=40,show=all.slice(0,cap);
 const cur=o.multi?(R.val||[]):[R.val];let g="",h="";show.forEach((x,i)=>{if(!q&&x.grp!==g){g=x.grp;h+=`<div class="pk-g">${H(g)}</div>`}h+=rowHTML(x,cur.includes(x.name),i===0,id)});
 if(!show.length)h=`<div class="pk-none">No one matches. Try a name, title, team or cost center code.</div>`;
 return h+`<div class="pk-ft">${show.length<all.length?`Showing ${show.length} of ${all.length}. Keep typing to narrow.`:`${all.length} ${all.length===1?"person":"people"}`}</div>`}
function face(R){const o=R.o,v=R.val;
 const one=n=>{const i=info(n);return `<span class="pk-av">${tryv(()=>avatar(n,{size:26}),"")}</span><span class="pk-t"><b>${H(n)}${n===((o&&o.me)||ME())?" (you)":""}</b><small>${H([i.title,i.team,i.cc].filter(Boolean).join(" · "))}</small></span>`};
 if(o.multi){return ""}
 return v?one(v):`<span class="pk-t"><b class="pk-ph">${H(o.placeholder||"Choose a person")}</b><small>Type to search by name, title, team or cost center</small></span>`}
function person(o){const id=o.id||("pk"+(++PICK._n));const prev=REGP[id];const R=REGP[id]={o,val:o.multi?(o.value||[]).slice():(o.value||"")};if(prev&&prev.o&&o.keepOpen==null)R.open=false;
 const lab=H(o.label||"Person");
 const tags=o.multi?`<div class="pk-tags">${R.val.map(n=>`<span class="pk-tag">${H(n)}<button type="button" data-pk-rm="${H(id)}" data-n="${H(n)}" aria-label="Remove ${H(n)}">×</button></span>`).join("")||`<span class="muted small">No one added yet</span>`}</div>`:"";
 const btn=o.multi?`<span class="pk-t"><b class="pk-ph">${H(o.placeholder||"Add a person")}</b><small>Type to search</small></span>`:face(R);
 return `<div class="pk" data-pk="${H(id)}">${tags}<button type="button" class="pk-btn" aria-haspopup="listbox" aria-expanded="false" aria-label="${lab}: ${H(o.multi?"add a person":R.val||"choose")}" data-pk-open="${H(id)}">${btn}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
 <div class="pk-pop" hidden><input type="search" class="pk-q" role="combobox" aria-expanded="true" aria-label="Search people" placeholder="Search name, title, team or cost center" autocomplete="off" data-pk-q="${H(id)}"><div class="pk-list" role="listbox" aria-label="${lab}">${""}</div></div></div>`}
function closeAll(except){document.querySelectorAll(".pk-pop:not([hidden])").forEach(p=>{if(p.parentElement===except)return;p.hidden=true;const b=p.parentElement.querySelector(".pk-btn");if(b)b.setAttribute("aria-expanded","false")})}
function open(root){const id=root.dataset.pk,pop=root.querySelector(".pk-pop"),b=root.querySelector(".pk-btn");closeAll(root);
 if(!pop.hidden){pop.hidden=true;b.setAttribute("aria-expanded","false");return}
 pop.hidden=false;b.setAttribute("aria-expanded","true");const q=pop.querySelector(".pk-q");q.value="";pop.querySelector(".pk-list").innerHTML=listHTML(id,"");
 const r=b.getBoundingClientRect();pop.classList.toggle("up",r.bottom+360>innerHeight&&r.top>360);q.focus({preventScroll:true});
 try{pop.scrollIntoView({block:"nearest"})}catch(e){}}
function choose(id,n){const R=REGP[id];if(!R)return;const o=R.o;
 if(o.multi){R.val=R.val.includes(n)?R.val.filter(x=>x!==n):R.val.concat(n)}else R.val=n;
 const root=document.querySelector(`[data-pk="${CSS.escape(id)}"]`);
 if(o.onPick)o.onPick(o.multi?R.val.slice():n);
 const again=document.querySelector(`[data-pk="${CSS.escape(id)}"]`);if(again&&again===root&&root.isConnected){const t=document.createElement("div");t.innerHTML=person(Object.assign({},o,{value:R.val}));again.replaceWith(t.firstElementChild);const nb=document.querySelector(`[data-pk="${CSS.escape(id)}"] .pk-btn`);if(nb)nb.focus({preventScroll:true})}}
document.addEventListener("click",e=>{let t;
 if(t=e.target.closest("[data-pk-open]")){open(t.closest(".pk"));return}
 if(t=e.target.closest("[data-pk-pick]")){e.preventDefault();choose(t.dataset.pkPick,t.dataset.n);return}
 if(t=e.target.closest("[data-pk-rm]")){const R=REGP[t.dataset.pkRm];if(R&&R.o.multi){R.val=R.val.filter(x=>x!==t.dataset.n);if(R.o.onPick)R.o.onPick(R.val.slice())}return}
 if(!e.target.closest(".pk"))closeAll(null)});
document.addEventListener("input",e=>{const t=e.target.closest("[data-pk-q]");if(!t)return;t.closest(".pk-pop").querySelector(".pk-list").innerHTML=listHTML(t.dataset.pkQ,t.value)});
document.addEventListener("keydown",e=>{const q=e.target.closest&&e.target.closest("[data-pk-q]");const root=e.target.closest&&e.target.closest(".pk");
 if(!root)return;const pop=root.querySelector(".pk-pop");
 if(e.key==="Escape"&&!pop.hidden){e.stopPropagation();pop.hidden=true;const b=root.querySelector(".pk-btn");b.setAttribute("aria-expanded","false");b.focus();return}
 if(!q)return;const items=[...pop.querySelectorAll(".pk-o")];if(!items.length)return;let i=items.findIndex(x=>x.classList.contains("act"));
 if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();items.forEach(x=>x.classList.remove("act"));i=e.key==="ArrowDown"?Math.min(items.length-1,i+1):Math.max(0,i-1);items[i].classList.add("act");items[i].scrollIntoView({block:"nearest"})}
 else if(e.key==="Enter"){e.preventDefault();e.stopPropagation();const a=items[Math.max(0,i)];if(a)choose(root.dataset.pk,a.dataset.n)}},true);
function formField(fid,f,val){return person({id:"form:"+fid+":"+f.k,value:f.multi?(Array.isArray(val)?val:[]):(val||""),multi:!!f.multi,label:f.label,placeholder:f.ph,kinds:f.kinds,exclude:f.exclude,
 onPick:v=>{const st=FORMST[fid];if(!st)return;st.vals[f.k]=v;if(st.err)delete st.err[f.k];refreshForm(fid);refreshLive(fid)}})}
function applyDefaults(spec,vals){try{(spec.fields||[]).forEach(f=>{if(f.type!=="people"||f.multi||f.me===false||!f.k)return;if((f.me===true||REQRE.test(f.label||""))&&!vals[f.k])vals[f.k]=ME()})}catch(e){}return vals}
const PICK=window.PICK={_n:0,person,formField,applyDefaults,me:ME,info,reqRe:REQRE,close:()=>closeAll(null)};
})();
