/* ===== mod_org4: AI agents get human first names (single display map + post-render pass), plus agent search and chat lookup (prefix org). ===== */
(function(){
const O=window.ORGX;if(!O)return;
/* one registry: original title (the key used everywhere in data) -> human first name. Titles stay the role. */
const NAMES={"First Officer":"Nova","Invoice Advisor":"Iris","Knowledge Curator":"Sage","Test Agent":"Kai","Personal assistant":"Wren","Triage Agent":"Tate","PMO Agent":"Pia","Change Risk Agent":"Rhea","Contract Analyst Agent":"Orin","Ops Agent":"Ember","Event Correlator":"Lyra","Resource Agent":"Reed","Room Scheduler":"Juno","Learning Coach":"Milo","Forecast Agent":"Finn"};
const TITLES=Object.keys(NAMES);
const lc=s=>String(s||"").trim().toLowerCase();
const BYFIRST={};TITLES.forEach(t=>BYFIRST[lc(NAMES[t])]=t);
const BYLC={};TITLES.forEach(t=>BYLC[lc(t)]=t);
/* agentDisplay("Invoice Advisor") -> {first:"Iris", title:"Invoice Advisor", full:"Iris · Invoice Advisor", sub:"Invoice Advisor · AI", known:true}; accepts a title or a first name */
function agentDisplay(n){const t=BYLC[lc(n)]||BYFIRST[lc(n)];if(!t)return{first:String(n||""),title:"",full:String(n||""),sub:"AI",known:false};
 return{first:NAMES[t],title:t,full:NAMES[t]+" · "+t,sub:t+" · AI",known:true}}
window.agentDisplay=agentDisplay;O.agentDisplay=agentDisplay;O.agentNames=NAMES;
/* the Control Tower, directory and people registries keep the title as the key; add the human name alongside so lookups by either work */
try{(window.S&&S.agents||[]).forEach(a=>{const d=agentDisplay(a.n);if(d.known)a.first=d.first})}catch(e){}
try{(window.DIR||[]).forEach(r=>{if(r.kind==="ai"){const d=agentDisplay(r.name);if(d.known){r.first=d.first;r.aka=d.first}}})}catch(e){}
/* ---------- post-render pass: replace title text nodes with "Name · Title" ---------- */
const BSKIP="script,style,textarea,input,select,[contenteditable],title";
const SKIP=BSKIP+",option,[data-noag],#nav,#tbActions,#q,#sugg,.hero,.eyebrow,h1,[role=tab],.crumb,.breadcrumb";
const EMBED=TITLES.filter(t=>t!=="First Officer"&&t!=="Personal assistant");
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const RX=new RegExp("()(?<![A-Za-z])(?<!·\\s)(?<!·)(?<!\\()("+EMBED.map(esc).join("|")+")(?![A-Za-z])","g");
/* a person must never be shown under a job title: the legacy record "Chief Editor" is the person Elena Marsh (role: Chief editor) */
const ALIAS=/Chief Editor/g;
function fixAlias(n,p){const v=n.nodeValue;if(v.indexOf("Chief Editor")<0||p.closest(BSKIP))return false;const host=p.parentElement||p;if(/Elena Marsh/.test(host.textContent))return false;n.nodeValue=v.replace(ALIAS,"Elena Marsh");return true}
function fixNode(n){const v=n.nodeValue;if(!v||v.length>600)return;const tv=v.trim();if(!tv)return;
 const p=n.parentElement;if(!p)return;fixAlias(n,p);if(p.closest(SKIP))return;if(n.nodeValue!==v)return;
 if(BYLC[lc(tv)]&&tv.length<40&&tv===BYLC[lc(tv)]){const t=tv;const lead=v.slice(0,v.indexOf(tv)),trail=v.slice(v.indexOf(tv)+tv.length);
  /* title cases that read as nav labels or generic words are left alone when they sit in a heading-like link */
  n.nodeValue=lead+NAMES[t]+" · "+t+trail;return}
 let hit=false;const out=v.replace(RX,(m,a,t)=>{hit=true;return a+NAMES[t]+" ("+t+")"});if(hit)n.nodeValue=out;
 /* sender lines that begin with First Officer / Personal assistant followed by a separator */
 const m=/^(\s*)(First Officer|Personal assistant)(\s*[·,:\-–|])/.exec(n.nodeValue);if(m&&!p.closest("a[href],button[data-nav],[data-nav]"))n.nodeValue=n.nodeValue.replace(m[0],m[1]+NAMES[m[2]]+" · "+m[2]+m[3])}
function walk(root){if(!root)return;if(root.nodeType===3){fixNode(root);return}if(root.nodeType!==1)return;if(root.closest&&root.closest(SKIP)&&root.id!=="drawer")return;
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const a=[];let x;while((x=w.nextNode()))a.push(x);a.forEach(fixNode)}
let pend=new Set(),sched=false;
function flush(){sched=false;const ns=[...pend];pend=new Set();ns.forEach(n=>{try{walk(n)}catch(e){}})}
function queue(n){pend.add(n);if(!sched){sched=true;(window.requestAnimationFrame||setTimeout)(flush)}}
function start(){const mo=new MutationObserver(ms=>{for(const m of ms){if(m.type==="characterData"){if(m.target.nodeValue&&!/·|\(/.test(m.target.nodeValue.slice(0,0)))queue(m.target)}else m.addedNodes.forEach(n=>{if(n.nodeType===1||n.nodeType===3)queue(n)})}});
 ["view","drawer","chatDock","nxFavBtn"].forEach(id=>{const e=document.getElementById(id);if(e)mo.observe(e,{childList:true,subtree:true,characterData:true})});
 /* inbox panel, toasts and chat portals live outside #view: watch the body for added top-level panels */
 mo.observe(document.body,{childList:true});
 const v=document.getElementById("view");if(v)queue(v);const d=document.getElementById("drawer");if(d)queue(d);const c=document.getElementById("chatDock");if(c)queue(c)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(start,0));else setTimeout(start,0);
const _ca=window.coreAfter;window.coreAfter=function(){if(_ca)_ca.apply(this,arguments);try{const v=document.getElementById("view");if(v)walk(v);const d=document.getElementById("drawer");if(d)walk(d)}catch(e){}};

/* ---------- agent profile: data blocks instead of prose (facts, trends, last decisions, tier check as labeled deltas) ---------- */
const hsh=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return((h>>>0)%1000)/1000};
const series=(key,end,n,spread,dec)=>{const a=[];let v=end;for(let i=0;i<n;i++){a.unshift(+v.toFixed(dec));v=end+(hsh(key+i)-.5)*spread*(1+i*.15)}return a};
const hx=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const chip=(l,v,cls,sub)=>`<span class="org-fc ${cls||""}"><small>${hx(l)}</small><b data-role="metric">${hx(v)}</b>${sub?`<em>${hx(sub)}</em>`:""}</span>`;
/* tier check: each rule is a metric delta, never advice */
function tierCheck(c){const rows=[["Acceptance",c.acc,"%",92,"min"],["Escalation",c.esc,"%",12,"max"],["Guardrail violations",c.viol,"",1.5,"max"]];
 const out=rows.map(r=>{const ok=r[4]==="min"?r[1]>=r[3]:r[1]<=r[3];const d=+(r[1]-r[3]).toFixed(1);return{l:r[0],v:r[1],u:r[2],t:r[3],ok,d,op:r[4]==="min"?(ok?"≥":"<"):(ok?"≤":">")}});
 const up=out.every(x=>x.ok)&&c.tier<3,down=c.acc<80||c.viol>4;return{rows:out,flag:up?"Tier change eligible":down?"Tier review triggered":"Tier hold",cls:up?"good":down?"bad":"mute"}}
O.tierCheck=tierCheck;
O.tierLabel=c=>{const t=tierCheck(c);const f=t.rows.find(x=>!x.ok);return t.flag==="Tier change eligible"?"Tier change eligible: all rules met":t.flag==="Tier review triggered"?"Tier review: acceptance "+c.acc+"% < 80% or violations "+c.viol+" > 4":f?"Tier hold: "+f.l.toLowerCase()+" "+f.v+f.u+" "+f.op+" "+f.t+f.u:"Tier hold"};
function decisions(n,c,sponsor){const out=["Accepted","Edited","Rejected","Escalated"];const rows=[];for(let i=0;i<5;i++){const r=hsh(n+"d"+i);const o=r<c.acc/100-.04?0:r<c.acc/100+.02?1:r<.97?2:3;const day=9-i;rows.push({t:"Oct "+Math.max(1,day),id:"T-"+(4100+Math.round(hsh(n+"i"+i)*800)),o:out[o],cf:(0.7+hsh(n+"c"+i)*.25).toFixed(2),by:sponsor||"Sponsor"})}return rows}
O.agentBlock=function(n,c,sponsor){const lv=O.LVL?O.LVL[c.tier>=3?"act":c.tier===2?"approval":"suggest"].n:"Suggest";const tc=tierCheck(c);
 const t7=Math.round(c.runs*7/30);const chips=[chip("Tier",c.tier,"",null),chip("Sponsor",sponsor||"Unassigned","",null),chip("Autonomy",lv,"",null),chip("Tasks 7d",t7,"",null),
  chip("Acceptance",c.acc+"%",c.acc>=90?"good":"warn","vs target 90%"),chip("Escalation",c.esc+"%",c.esc<=15?"good":"warn","vs target 15%"),chip("Guardrail violations",c.viol,c.viol<=2?"good":"bad","per 1,000, target 2"),chip("Cost per task","$"+c.cost.toFixed(2),"","30-day average")].join("");
 const sp=(l,vals,col,fmt)=>`<div class="org-tr"><small>${l}</small><span class="num" data-role="metric">${fmt(vals[vals.length-1])}</span>${typeof spark==="function"?spark(vals,120,34,col):""}<em>8 weeks</em></div>`;
 const col=x=>{try{return window.col(x)}catch(e){return "currentColor"}};
 const sA=series(n+"a",c.acc,8,6,0),sE=series(n+"e",c.esc,8,5,0),sC=series(n+"c",c.cost,8,.12,2),sV=series(n+"v",c.viol,8,1.2,1);
 const dec=decisions(n,c,sponsor);
 return `<div class="org-facts" role="group" aria-label="Key facts">${chips}</div>
 <div class="org-trends">${sp("Acceptance %",sA,col("--good-f"),v=>v+"%")}${sp("Escalation %",sE,col("--warn-f"),v=>v+"%")}${sp("Cost per task",sC,col("--accent"),v=>"$"+(+v).toFixed(2))}${sp("Violations per 1,000",sV,col("--bad-f"),v=>v)}</div>
 <div class="org-tc"><span class="eyebrow">Tier check</span><span class="pill ${tc.cls}">${tc.flag}</span>${tc.rows.map(r=>`<span class="pill ${r.ok?"good":"warn"}" title="Rule for a tier change">${r.l} ${r.v}${r.u} ${r.op} ${r.t}${r.u} (${r.d>0?"+":""}${r.d}${r.u?" pts":""})</span>`).join("")}</div>
 <div class="tscroll"><table class="org-dt"><thead><tr><th>Date</th><th>Task</th><th>Outcome</th><th>Confidence</th><th>Reviewed by</th></tr></thead><tbody>${dec.map(d=>`<tr><td>${d.t}</td><td class="num">${d.id}</td><td><span class="pill ${d.o==="Accepted"?"good":d.o==="Edited"?"info":d.o==="Rejected"?"bad":"warn"}">${d.o}</span></td><td class="num">${d.cf}</td><td>${hx(d.by)}</td></tr>`).join("")}</tbody></table></div>`};
/* ---------- search: find an agent by name or by title ---------- */
try{SEARCHX.push(()=>O.agents().map(a=>{const d=agentDisplay(a.name);return{g:"AI agents",t:d.full,m:"AI agent · sponsor "+a.sponsor,c:"--p4",f:()=>O.openAgent(a.name),k:"agent ai "+d.first+" "+a.name+" "+a.sponsor}}))}catch(e){}
/* ---------- chat: "who is Iris", "tell me about Wren" ---------- */
try{ASKX.push(q=>{const l=lc(q).replace(/[?.!,]/g," ");const w=l.split(/\s+/);const f=w.find(x=>BYFIRST[x]);const t=f?BYFIRST[f]:TITLES.find(t=>l.indexOf(lc(t))>=0);if(!t)return false;if(!/who|what|tell|about|agent|open|show/.test(l))return false;
 const a=O.agents().find(x=>x.name===t);if(!a)return false;const d=agentDisplay(t);O.openAgent(t);say(q,{t:d.full+" · AI agent, sponsor "+a.sponsor+", "+O.LVL[a.autonomy].n+", "+a.hrs+" h/wk returned.",steps:["Opened the agent profile"]});return true})}catch(e){}
})();
