/* Round 16, Agent K: fixes carried over from round 15.
   1. Multiselect popups never push the page wider (flip to the right edge).  2. Org chart header consolidated.
   3. One current-user accessor (CURUSER).  4. Untraced metrics mapped by the lineage assistant, with an explicit source note.
   5. Screen families: dashboards, risk, notifications (R15 merge mechanism).  6. Phone tap targets (CSS in mod_r16k_fix.css). */
(function(){
"use strict";
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=U.esc;

/* ---- 1. popups flip instead of widening the page ---- */
D.addEventListener("toggle",e=>{const d=e.target;if(!(d&&d.matches&&d.matches("details.mp")&&d.open))return;const p=d.querySelector(".mpp");if(!p)return;
 d.classList.remove("mp-flip");const r=p.getBoundingClientRect();if(r.right>innerWidth-8)d.classList.add("mp-flip");
 const r2=p.getBoundingClientRect();if(r2.left<8)p.style.maxWidth=Math.max(240,r2.width-(8-r2.left))+"px"},true);

/* ---- 3. the one current-user accessor ---- */
const CUR=W.CURUSER=W.CURUSER||{
 name(){return G(()=>INBOX.me(),null)||G(()=>NAVX.persona.me(),null)||G(()=>PERSONAS[S.persona].as,null)||"Casey Rowan"},
 first(){return String(CUR.name()).split(" ")[0]},
 is(n){return !!n&&String(n)===CUR.name()||/^(you|me)$/i.test(String(n||""))},
 /* text that names the actor: "by you" when it is the signed-in person */
 by(n){return CUR.is(n)?"you":n},
 role(){return G(()=>PERSONAS[S.persona].n,"")}};

/* ---- 5. families (same mechanism as mod_r15c_merge.js) ---- */
(function(){const R15=W.R15;if(!R15||!R15.families||!R15.famOf)return;
 const FAMS=[
  {id:"exe_dash",label:"Dashboards",views:[["exe_dash","Leadership"],["obs_dash","Operations and metrics"],["kcs_viz","Build a chart"]]},
  {id:"exe_risk",label:"Risk",views:[["exe_risk","Heat map and Monte Carlo"],["grc_risk","Risk register"],["grc_ven","Third-party risk"]]},
  {id:"svc_notify",label:"Notifications",views:[["svc_notify","Rules, templates and delivery"],["inbox","Alerts and inbox"]]}];
 FAMS.forEach(f=>{if(R15.families.some(x=>x.id===f.id))return;
  f.views.forEach(([id])=>{const old=R15.famOf[id];if(old&&old!==f)old.views=old.views.filter(v=>v[0]!==id)});
  R15.families.push(f);
  f.views.forEach(([id,v])=>{R15.famOf[id]=f;if(id===f.id){R15.names[id]=f.label;delete R15.hidden[id]}else{R15.names[id]=f.label+": "+v;R15.hidden[id]=1}})})})();

/* ---- 2. org chart header: one stat line, tabs on one row ---- */
function orgTidy(){
 const strip=D.querySelector("#view .org-strip");if(!strip)return;const hero=D.querySelector("#view .hero .story");
 if(hero&&!hero.dataset.k16){hero.dataset.k16="1";
  const items=[...strip.querySelectorAll("[role=listitem]")].map(x=>x.textContent.replace(/\s+/g," ").trim());
  const have=hero.textContent.toLowerCase();
  const extra=items.filter(t=>/manager|span/i.test(t)&&!have.includes(t.toLowerCase().replace(/\s*\(.*$/,"")));
  if(extra.length)hero.insertAdjacentHTML("beforeend"," · "+extra.map(E).join(" · "))}
 strip.hidden=true;
 const bar=D.querySelector("#view .org-bar");
 if(bar&&!bar.dataset.k16){bar.dataset.k16="1";const rest=[...bar.children].slice(3);
  if(rest.length){const open=!!(S.k16&&S.k16.more),wrap=D.createElement("div");wrap.className="k16-morebar";wrap.hidden=!open;rest.forEach(k=>wrap.appendChild(k));
   const btn=D.createElement("button");btn.type="button";btn.className="chip k16-morebtn";btn.setAttribute("aria-expanded",String(open));btn.textContent=open?"Hide filters and view options":"More filters and view options";bar.appendChild(btn);bar.appendChild(wrap)}}}
D.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".k16-morebtn");if(!b)return;const w=b.parentElement.querySelector(".k16-morebar");if(!w)return;w.hidden=!w.hidden;S.k16=S.k16||{};S.k16.more=!w.hidden;b.setAttribute("aria-expanded",String(!w.hidden));b.textContent=w.hidden?"More filters and view options":"Hide filters and view options"});
function phoneMaps(){if(!(W.matchMedia&&matchMedia("(max-width:640px)").matches))return;
 [[".at-vpbox","Data model diagram","plat_store","Entity store"],[".mm-vp","Module map","plat_reg","Platform registry"]].forEach(([sel,name,to,lab])=>{D.querySelectorAll("#view "+sel).forEach(el=>{if(el.dataset.k16)return;el.dataset.k16="1";el.classList.add("k16-nocanvas");
  el.insertAdjacentHTML("beforebegin",`<div class="k16-mapnote"><b>${name}</b><span class="muted small">The pan and zoom diagram needs a wider screen. Rotate the phone, or open this on a tablet or desktop. The same records are listed in ${lab}.</span><button type="button" class="btn" data-go="${to}">Open ${lab}</button></div>`)})})}
/* two-pane layouts whose panes differ in height on purpose (tree beside detail) are exempt from the equal-height rule */
function eqOff(){D.querySelectorAll("#view .itom-mgrid:not([data-eq])").forEach(e=>e.setAttribute("data-eq","off"))}
const _render=W.render;
if(typeof _render==="function"&&!W._k16r){W._k16r=1;W.render=function(){const r=_render.apply(this,arguments);try{orgTidy();phoneMaps();eqOff()}catch(e){}return r}}

/* ---- 4. metric lineage: map what the first pass left, then say where the rest comes from ---- */
const tok=s=>String(s||"").toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>2);
const STOP=new Set(["total","rate","count","days","hours","share","average","number","percent","per","the","and","with","for","open","closed","new","active","median","avg","time","spend","metric","index","level","score","coverage","age"]);
let FIDX=null;
function fidx(){if(FIDX)return FIDX;FIDX=[];G(()=>PLAT.entities(),[]).forEach(e=>{if(e.proposed)return;const he=new Set(tok(e.label+" "+e.id));(e.fields||[]).forEach(f=>FIDX.push({e:e.id,lab:e.label,k:f.k,he,hf:new Set(tok(f.label+" "+f.k))}))});return FIDX}
function best(words,extra){const w=words.filter(x=>!STOP.has(x));if(!w.length)return null;let b=null,bs=0;
 fidx().forEach(f=>{let c=0;w.forEach(x=>{if(f.hf.has(x))c+=1;else if(f.he.has(x))c+=.5;else if(extra.has(x))c+=.2});const s=c/w.length;if(s>bs){bs=s;b=f}});return b?{ref:b.e+"."+b.k,ent:b.lab,conf:Math.round(Math.min(.95,bs)*100)}:null}
function traceMore(){
 if(!(W.LIN&&W.PLAT&&S.atlas&&S.atlas.ovr))return {n:0,left:-1};
 const A=S.atlas;let n=0,notes=0;const st=S.r16k=S.r16k||{lin:{}};
 G(()=>LIN.all(),[]).filter(t=>t.status==="none").forEach(t=>{const m=t.m||METRICS[t.id]||{};
  const extra=new Set(tok((m.owner||"")+" "+(m.use||[]).join(" ")+" "+(m.rem&&m.rem.title||"")));let got=false;
  (t.gaps||[]).slice(0,3).forEach(g=>{const key=t.id+"|"+String(g.phrase||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();if(A.ovr[key]){got=true;return}
   const b=best(tok(g.phrase)||[],extra)||best(tok((m.n||"")+" "+(m.f||"")),extra);
   if(b&&b.conf>=20){A.ovr[key]={ref:b.ref,by:"Lineage assistant, round 16 (proposed, steward to confirm)",at:G(()=>TODAY,0),note:"Term match, confidence "+b.conf+"%"};st.lin[key]={metric:t.id,ref:b.ref,conf:b.conf};got=true;n++}});
  if(!got){const b=best(tok((m.n||"")+" "+(m.owner||"")+" "+(m.use||[]).join(" ")),extra);
   if(b){const g0=(t.gaps||[])[0];if(g0){const key=t.id+"|"+String(g0.phrase||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();A.ovr[key]={ref:b.ref,by:"Lineage assistant, round 16 (nearest entity, low confidence)",at:G(()=>TODAY,0),note:"Nearest entity to the metric's owner and screens: "+b.ent}}}
   m.src="Data source: "+(b?b.ent+" (nearest entity, steward to confirm)":"computed in the "+((m.use||[])[0]||"owning")+" screen from live records");notes++}});
 if(n||notes)G(()=>LIN.bump(),0);
 return {n,notes,left:G(()=>LIN.all(),[]).filter(t=>t.status==="none").length}}
let tries=0;
(function poll(){tries++;const ready=G(()=>W.R15E&&R15E.state&&R15E.state.applied,false)||tries>12;
 if(!ready){setTimeout(poll,1500);return}
 setTimeout(()=>{const r=traceMore();W.R16K=W.R16K||{};R16K.lineage=r},600)})();
W.R16K=W.R16K||{};R16K.traceMore=traceMore;
})();
