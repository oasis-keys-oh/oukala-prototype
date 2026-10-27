/* ===== Round 16, Agent H, core: shared helpers for Change status, CI ownership, Approval groups and Approval rules.
   Loads first among the mod_r16h_* files. Holds the shared state slice S.r16h, id aliases (old Leaver ids resolve to the new ids),
   and one batched Feature Contract wiring (process, entities, metrics, map flows, search) for all four screens. ===== */
(function(){
"use strict";
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const R=window.R16H=window.R16H||{};
S.r16h=S.r16h||{};
const TODAY="2026-10-10";
const addDays=(s,n)=>{const d=new Date(s+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const daysBetween=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/864e5);
const fmtD=s=>{try{return new Date(s+"T00:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})}catch(e){return s||""}};
Object.assign(R,{G,H,TODAY,addDays,daysBetween,fmtD});
/* PR-32 B9 tenant rows (R16 to R18): Atlantic Systems reads the entity part's own source live through the entity layer (the same objects, so
   edits and new rows reach it); another tenant reads its own pack rows through DATA.get; no rows is [] and a labeled gap, never Atlantic Systems rows. */
const TCORE=()=>!window.DATA||DATA.tenant()==="core";
const TPARTS=new WeakMap();
const TROWS=(e,part)=>{if(TCORE()){const d=window.TENANT_ENTITIES&&TENANT_ENTITIES.get(e);const p=d&&(part?d.src.find(x=>x[0]===part):d.src[0]);
  let v=null;try{v=p?p[1]():null}catch(x){}return v==null?[]:v}
 const all=DATA.get(e);if(!part)return all;let m=TPARTS.get(all);if(!m){m={};TPARTS.set(all,m)}return m[part]||(m[part]=all.filter(r=>r.part===part))};
const TGAP=w=>`<p class="muted small" data-tenant-gap="1">No data in this sample company yet${w?": "+H(w):""}.</p>`;
const fchipT=id=>typeof fchip!=="function"?"":TCORE()||DATA.byId("metrics",id)?fchip(id):"";   /* an Atlantic Systems metric chip is hidden under another tenant (R18) */
/* people of the active tenant (names); Atlantic Systems keeps the org chart list */
const TPEOPLE=()=>TCORE()?G(()=>ORGX.staff.map(p=>p.n),[]):G(()=>DATA.get("people").filter(p=>p.kind!=="agent"&&p.kind!=="robot").map(p=>p.name).filter(Boolean),[]);
Object.assign(R,{TCORE,TROWS,TGAP,fchipT,TPEOPLE});
/* ---------- aliases: old ids keep resolving ---------- */
R.alias={process:{org_leaver:"org_separation"},event:{},screen:{},term:{Leaver:"Change status",leaver:"change status"}};
R.resolveProcess=id=>R.alias.process[id]||id;
function installAliases(){
 G(()=>{if(window.PROCLIB&&!PROCLIB._r16h){const og=PROCLIB.get;PROCLIB.get=function(id){return og.call(this,R.resolveProcess(id))};PROCLIB._r16h=1}});
 G(()=>{if(window.PROC&&PROC.defs){Object.keys(R.alias.process).forEach(k=>{if(!Object.getOwnPropertyDescriptor(PROC.defs,k)){const to=R.alias.process[k];Object.defineProperty(PROC.defs,k,{get:()=>PROC.defs[to],enumerable:false,configurable:true})}})}});
 G(()=>{if(window.R15&&R15.alias)Object.keys(R.alias.screen).forEach(k=>{if(!R15.alias[k])R15.alias[k]={to:R.alias.screen[k]}})});
}
R.installAliases=installAliases;
/* ---------- small UI helpers ---------- */
R.pill=(t,c)=>`<span class="pill ${c||"info"}">${H(t)}</span>`;
R.kp=(l,v,sub,o)=>typeof kpi==="function"?kpi(l,String(v),sub||"",o||{}):`<div class="stat"><small>${H(l)}</small><span class="num">${H(v)}</span><em>${H(sub||"")}</em></div>`;
R.people=()=>G(()=>ORGX.staff.map(p=>p.n),[]);
R.viewer=()=>G(()=>INBOX.me(),null)||G(()=>PICK.me(),null)||"Casey Rowan";
R.log=(kind,subject,detail)=>{const L=S.r16h.activity=S.r16h.activity||[];L.unshift({t:Date.now(),kind,subject,detail,by:R.viewer()});if(L.length>300)L.length=300;audit(kind,subject+(detail?" · "+detail:""))};
/* ---------- Feature Contract: one batched wiring ---------- */
const SC=R.screens=[];  /* each: {id,name,own,bk,ents:[{id,label,note,fields,extend?,decision}],steps,met,fin,fout,k,hint,sub,navGroup,std} */
const WS={};
const F=(k,label,type,cls,req)=>({k,label,type:type||"string",authority:"platform",classification:cls||"internal",req:!!req});
R.F=F;
R.addScreen=function(s){SC.push(s);if(S.r16h._wired)return;setTimeout(wire,1200)};
function wire(){
 try{
  installAliases();
  SC.forEach(s=>{
   if(!s.m&&typeof METRICS!=="undefined"){s.met.forEach(m=>{if(!METRICS[m[0]])METRICS[m[0]]={n:m[1],f:m[2],u:m[3],cur:m[4],tgt:m[5],badAt:m[6],dir:m[7],max:m[3]==="%"?100:Math.max(10,m[5]*3),tr:[0,1,2,3,4,5,6,7].map(i=>m[4]),owner:s.own,use:[s.name],rem:{kind:"sop",ref:"SOP-"+String(s.id).toUpperCase().slice(0,12),title:m[8]||("Review "+s.name),agent:"",auto:false,state:"idle",prog:m[9]||""}}});s.m=1}
   if(!s.e&&window.ATLAS&&ATLAS.addEntity&&window.PLAT&&window.COVER){
    s.ents.forEach(e=>{
     if(e.extend){G(()=>DATAMODEL.register(e.id,{label:(DATAMODEL.tables[e.id]||{}).label||e.id,fields:e.fields.map(f=>({k:f.k,label:f.label,type:f.type,opts:f.opts}))}));G(()=>{const dm=window.CONTRACT&&CONTRACT.decisions&&CONTRACT.decisions();if(dm&&dm.push)dm.push({id:e.id,decision:"extend",why:e.decision})});return}
     if(DATAMODEL.tables[e.id])return;
     G(()=>ATLAS.addEntity({id:e.id,label:e.label,domain:e.domain||"gov",source:s.name,ownerApp:s.id,ownerMod:s.id,status:"proposed",steward:s.own,note:e.note,fields:e.fields.map(f=>Object.assign({},f))}))});
    G(()=>{if(window.COVER&&Array.isArray(COVER.recs))s.ents.forEach(e=>{const key=(s.id+"."+e.id).toUpperCase();if(!COVER.recs.some(r=>r.key===key))COVER.recs.push({key,label:e.label+(e.extend?" (extended)":""),scr:[s.id],mod:s.id,n:e.n||1,ent:e.id,how:e.extend?"ext":(e.reuse?"direct":"new"),path:e.path||"S.r16h"})})});
    s.e=1}
   if(!s.mm&&window.MODMAP&&MODMAP.addModule&&s.e){
    const ids=new Set((MODMAP.modules||[]).map(m=>m.id));
    const fl=s.fin.filter(f=>ids.has(f[0])).map(f=>({dir:"pull",other:f[0],data:f[1],entity:f[2],mode:f[3]||"api",trig:f[4]||"Screen opened"})).concat(s.fout.filter(f=>ids.has(f[0])).map(f=>({dir:"push",other:f[0],data:f[1],entity:f[2],mode:f[3]||"event",trig:f[4]||"State changed"})));
    const r=G(()=>MODMAP.addModule({id:s.id,name:s.name,sn:s.name,band:"plt",own:s.own,proposed:false,scr:s.id,r:s.fin.map(f=>f[2]),w:s.ents.filter(e=>!e.extend).map(e=>e.id),flows:fl}),null);
    if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))s.mm=1}
   if(!s.p&&window.PROCLIB&&PROCLIB.addProcess&&s.mm){
    const steps=s.steps.map(x=>({n:x[0],d:x[1],who:x[2],owner:x[3],sla:x[4],in:x[5],out:x[6]}));
    G(()=>PROC.reg(s.id,{title:s.name+" process",std:s.std||["itil5","cobit"],steps}));
    (s.procs||[{id:s.id+"_process",name:s.name+" process"}]).forEach((pp,ix)=>{
     const st=pp.steps?pp.steps.map(x=>({n:x[0],d:x[1],who:x[2],owner:x[3],sla:x[4],in:x[5],out:x[6]})):steps;
     const r=G(()=>PROCLIB.addProcess({id:pp.id,name:pp.name,module:ix===0?s.id:(pp.module||s.id),family:pp.family||"gov",owner:s.own,backup:s.bk,trigger:pp.trigger||s.trigger||"The screen is opened or its source data changes",steps:st,inputs:[st[0].in],outputs:[st[st.length-1].out],entities:s.ents.filter(e=>!e.extend).map(e=>e.id),metrics:s.met.map(m=>m[0]),model:"cmmi",std:s.std||["bpmn","itil5"]}),null);
     G(()=>{S.plib.own[pp.id]={owner:s.own,backup:s.bk}})});
    G(()=>PROCLIB.refresh());s.p=1}
   if(!s.n){G(()=>{if(window.NAVX&&NAVX.add){NAVX.add(s.id,{group:s.navGroup||"plat",label:s.name,hint:s.hint,sub:s.sub||"",kw:s.k});s.n=1}})}
  });
  if(SC.every(s=>s.p))G(()=>MODMAP.refresh&&MODMAP.refresh());
  S.r16h._wired=SC.every(s=>s.m&&s.e&&s.mm&&s.p&&s.n);
  if(!S.r16h._wired&&(WS.t=(WS.t||0)+1)<14)setTimeout(wire,1800);
 }catch(e){console.error("r16h wire",e)}
}
R.wire=wire;R.wireState=()=>SC.map(s=>({id:s.id,m:s.m,e:s.e,mm:s.mm,p:s.p,n:s.n}));
setTimeout(wire,1500);setTimeout(wire,4000);
/* search: one provider for all screens */
if(window.SEARCHX)SEARCHX.push(()=>SC.map(s=>({g:"Go to",t:s.name,m:s.hint,c:"--p3",f:()=>go(s.id),k:s.id+" "+s.k})));
})();
