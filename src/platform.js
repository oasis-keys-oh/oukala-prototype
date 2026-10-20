/* ============ platform.js: the shared foundation (docs/ARCHITECTURE.md) ============
   Core file, loaded after kit2.js and before every mod_*.js. Everything is a property of window so it can never
   collide with a module's own top-level names. New code uses these; old code migrates in the sweep waves.
   U (CL-31) helpers · HOOKS (CL-35) lifecycle registry · DATA (CL-55) tenant-scoped data access ·
   STEPMODE (CL-58) human, robot, agent · TRIGGERS (CL-73) shared trigger catalog · ownerChip (CL-53) ·
   CHATADDR (CL-54) chat addresses. Every API is guarded: a failing listener or source never breaks the shell. */
(function(){
const W=window;
const safe=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){console.error("platform",e);return d}};

/* ---- U: shared helpers (R10). One definition each; modules extend here, never redeclare. ---- */
const U=W.U=W.U||{};
U.TODAY_ISO="2026-10-06"; /* fixed demo date (decision adopted 2026-10-19, CL-34) */
U.esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
U.money=n=>"$"+Math.round(+n||0).toLocaleString("en-US");
U.moneyShort=n=>{n=+n||0;const a=Math.abs(n),s=n<0?"-":"";return a>=1e9?s+"$"+(a/1e9).toFixed(1).replace(/\.0$/,"")+"B":a>=1e6?s+"$"+(a/1e6).toFixed(2).replace(/0$/,"").replace(/\.0$/,"")+"M":a>=1e3?s+"$"+Math.round(a/1e3)+"K":s+"$"+Math.round(a)};
U.pct=(v,d)=>{v=+v||0;const p=Math.abs(v)<=1&&!Number.isInteger(v)?v*100:v;return p.toFixed(d==null?(p%1?1:0):d)+"%"};
U.clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
U.slug=s=>String(s==null?"":s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
let _uid=0;U.uid=(p)=>(p||"u")+Date.now().toString(36)+(++_uid).toString(36);
U.today=()=>safe(()=>TODAY,null); /* working-day index from data2.js */
U.todayDate=()=>new Date(U.TODAY_ISO+"T00:00:00Z");
U.fmtDate=(d,o)=>{const x=d instanceof Date?d:new Date(String(d).length===10?d+"T00:00:00Z":d);return isNaN(x)?String(d):x.toLocaleDateString("en-US",Object.assign({month:"short",day:"numeric",timeZone:"UTC"},o||{}))};
/* one guarded browser store (CL-42): keys are listed in U.store.keys so the demo reset can clear them */
U.store={keys:new Set(),get(k,d){this.keys.add(k);try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
 set(k,v){this.keys.add(k);try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}},
 del(k){try{localStorage.removeItem(k)}catch(e){}}};

/* ---- HOOKS: lifecycle registry (R40). Replaces wrapping render, go or openDrawer. ----
   Names: beforeGo(screen,arg) · afterRender(screen) · afterOpenDrawer(el) · tenantChange(tenant,prev).
   HOOKS.on(name,fn,{order,id}) returns an off function. Lower order runs first; same id replaces. */
const HK={};const HOOKS=W.HOOKS=W.HOOKS||{};
HOOKS.names=["beforeGo","afterRender","afterOpenDrawer","tenantChange"];
HOOKS.on=(name,fn,o)=>{o=o||{};const L=HK[name]=HK[name]||[];if(o.id){const i=L.findIndex(x=>x.id===o.id);if(i>=0)L.splice(i,1)}
 const h={fn,order:o.order||0,id:o.id||null};L.push(h);L.sort((a,b)=>a.order-b.order);return()=>{const i=L.indexOf(h);if(i>=0)L.splice(i,1)}};
HOOKS.run=(name,...a)=>{(HK[name]||[]).slice().forEach(h=>{try{h.fn(...a)}catch(e){console.error("hook "+name+(h.id?" ("+h.id+")":""),e)}})};
HOOKS.list=name=>(HK[name]||[]).map(h=>({id:h.id,order:h.order}));

/* ---- DATA: tenant-scoped data access layer (R16 to R20, CL-55) ----
   DATA.define(entity,{core:()=>rows,key,label})   the Meridian (core) source, usually a getter over an existing global
   DATA.pack(tenant,{entity:rows|()=>rows,...})      a tenant pack supplies its own rows (DC-09 pack format)
   DATA.get(entity,{tenant,where})                   rows for the active tenant; memoized by version
   DATA.tenant() · DATA.setTenant(id) · DATA.version · DATA.on("change",fn) · DATA.entities() · DATA.gaps()
   No leakage (R18): a non-core tenant with no rows for an entity gets [] and the gap is recorded, never Meridian rows. */
const DEF={},PACKS={},MEMO=new Map(),GAPS=new Set(),LIS=[];
const DATA=W.DATA=W.DATA||{};
DATA.version=1;
let _tenant="core";
DATA.tenant=()=>_tenant;
DATA.define=(entity,o)=>{DEF[entity]=Object.assign({key:"id",label:entity},o||{});MEMO.clear();return DATA};
DATA.pack=(tenant,ents)=>{PACKS[tenant]=Object.assign(PACKS[tenant]||{},ents||{});MEMO.clear();DATA.version++;return DATA};
DATA.packs=()=>Object.keys(PACKS);
DATA.entities=()=>Object.keys(DEF).map(k=>({entity:k,label:DEF[k].label,key:DEF[k].key,tenants:["core"].concat(Object.keys(PACKS).filter(t=>PACKS[t][k]!=null))}));
DATA.gaps=()=>[...GAPS];
const rowsOf=(entity,t)=>{const d=DEF[entity];if(t==="core"){const p=PACKS.core&&PACKS.core[entity];const src=p!=null?p:d&&d.core;return src==null?[]:(typeof src==="function"?safe(src,[]):src)}
 const p=PACKS[t]&&PACKS[t][entity];if(p==null){GAPS.add(t+":"+entity);return[]}return typeof p==="function"?safe(p,[]):p};
DATA.get=(entity,ctx)=>{ctx=ctx||{};const t=ctx.tenant||_tenant;const k=t+"|"+entity+"|"+DATA.version;
 let rows=MEMO.get(k);if(!rows){rows=rowsOf(entity,t)||[];MEMO.set(k,rows)}
 return ctx.where?rows.filter(ctx.where):rows};
DATA.byId=(entity,id,ctx)=>{const d=DEF[entity]||{key:"id"};return DATA.get(entity,ctx).find(r=>r&&r[d.key]===id)||null};
DATA.on=(ev,fn)=>{if(ev==="change"){LIS.push(fn);return()=>{const i=LIS.indexOf(fn);if(i>=0)LIS.splice(i,1)}}return()=>{}};
DATA.touch=()=>{DATA.version++;MEMO.clear();LIS.slice().forEach(f=>{try{f(_tenant,_tenant)}catch(e){console.error("DATA change",e)}})};
DATA.setTenant=id=>{if(!id||id===_tenant)return;const prev=_tenant;_tenant=id;DATA.version++;MEMO.clear();
 LIS.slice().forEach(f=>{try{f(id,prev)}catch(e){console.error("DATA change",e)}});HOOKS.run("tenantChange",id,prev)};

/* ---- STEPMODE: every process step is human, robot or agent (R21 to R24); approval gate is a separate step type ----
   Legacy values map through ALIAS: "fn"/"function" are the robot; "auto"/"automatic" are retired and read as robot until
   CL-72 classifies each use. Never show "Automatic" or "Function" as a step kind. */
const STEPMODE=W.STEPMODE=W.STEPMODE||{};
STEPMODE.MODES={
 human:{label:"Human",desc:"A person does the step. It starts by assignment."},
 robot:{label:"Robot",desc:"A deterministic, predefined function (if, then, else) that runs when its trigger fires. Same input, same output, no model."},
 agent:{label:"Agent",desc:"An AI agent with model-backed reasoning, guided by versioned prompts and guidelines, deciding one narrow task inside a box (tier, budget, confidence floor, kill switch) with a human sponsor."},
 gate:{label:"Approval gate",desc:"A decision point routed to a group. The requester can never approve their own request."}};
STEPMODE.ALIAS={human:"human",person:"human",manual:"human",robot:"robot",fn:"robot",function:"robot",auto:"robot",automatic:"robot",system:"robot",agent:"agent",ai:"agent",gate:"gate",approval:"gate"};
STEPMODE.of=v=>STEPMODE.ALIAS[String(v==null?"":v).toLowerCase()]||"human";
STEPMODE.label=v=>STEPMODE.MODES[STEPMODE.of(v)].label;
STEPMODE.kinds=()=>["human","robot","agent"];
STEPMODE.pill=v=>{const k=STEPMODE.of(v);return `<span class="stepmode sm-${k}" title="${U.esc(STEPMODE.MODES[k].desc)}">${STEPMODE.MODES[k].label}</span>`};

/* ---- TRIGGERS: one catalog for every robot and agent step (R21a, CL-73). Human steps start by assignment. ---- */
const TRIGGERS=W.TRIGGERS=W.TRIGGERS||{};
TRIGGERS.CATALOG=[
 {id:"metric",label:"Metric crosses a threshold",fields:["metric","op","value"]},
 {id:"schedule",label:"Schedule or timer",fields:["cron","every"]},
 {id:"step",label:"Process step is reached",fields:["process","step"]},
 {id:"event",label:"Event occurs",fields:["event"]},
 {id:"record",label:"Record changes",fields:["entity","field","to"]}];
TRIGGERS.list=()=>TRIGGERS.CATALOG.slice();
TRIGGERS.get=id=>TRIGGERS.CATALOG.find(t=>t.id===id)||null;
TRIGGERS.label=t=>{if(!t)return"No trigger";const c=TRIGGERS.get(t.type||t);if(!c)return String(t.type||t);const p=t.params||{};
 return c.label+(Object.keys(p).length?": "+Object.entries(p).map(([k,v])=>k+" "+v).join(", "):"")};

/* ---- CHATADDR: one chat service; every person, team, function, record, process and agent is an address (R13a) ----
   Address strings: "person:<name>" "team:<id>" "function:<id>" "record:<type>:<id>" "process:<P-014>" "agent:<id>".
   CHATADDR.open(addr,{record}) opens or creates that thread in the platform chat (CHATX.openAddress, CL-54). */
const CHATADDR=W.CHATADDR=W.CHATADDR||{};
CHATADDR.TYPES=["person","team","function","record","process","agent"];
CHATADDR.fmt=(type,...id)=>type+":"+id.join(":");
CHATADDR.parse=a=>{const s=String(a||"");const i=s.indexOf(":");if(i<0)return null;const type=s.slice(0,i),rest=s.slice(i+1);
 if(CHATADDR.TYPES.indexOf(type)<0)return null;if(type==="record"){const j=rest.indexOf(":");return{type,recType:rest.slice(0,j),id:rest.slice(j+1)}}return{type,id:rest}};
CHATADDR.open=(addr,ctx)=>{if(W.CHATX&&CHATX.openAddress)return CHATX.openAddress(addr,ctx||{});
 safe(()=>{const c=document.getElementById("chatOpen");if(c)c.checked=true});return null};

/* ---- ownerChip: every owner, backup, approver, assignee, sponsor, requester or reviewer renders through this (R13, CL-53) ----
   ownerChip(name,{record:"type:id",role:"Owner"|"Backup"|...,size}) -> markup. Click behavior (Person 360, Message, Open chat on
   this record, group and agent variants) is delegated on [data-owner]; until that ships it falls back to the person chip. */
W.ownerChip=W.ownerChip||function(name,o){o=o||{};const base=safe(()=>pchip(name,{size:o.size,role:o.showRole}),U.esc(name));
 const attrs=` data-owner="${U.esc(name)}"`+(o.record?` data-owner-rec="${U.esc(o.record)}"`:"")+(o.role?` data-owner-role="${U.esc(o.role)}"`:"");
 return base.replace(/^<button /,"<button"+attrs+" ")};
})();
