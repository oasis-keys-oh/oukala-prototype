/* Round 15, Agent D. One source of truth.
   Provides: window.R15D (shared post-render hooks), window.FACTS (registry of numbers with id, value, unit, source, scope, probes),
   window.AGENTS_STATE (the single function behind every agent count), unit-aware mfmt, the agent registry screen,
   the "Facts and conflicts" screen and FACTS.test() (duplicates, conflicts, unit checks).
   Guarded: every cross-module call is wrapped so a missing module cannot break the shell. */
(function(){
const W=window;
const R15D=W.R15D=W.R15D||{};
R15D.after=R15D.after||[];
R15D.onAfter=fn=>{R15D.after.push(fn)};
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=U.esc;
const N0=n=>Number(n).toLocaleString("en-US");
const store={get:(k,d)=>U.store.get("oukala-r15d-"+k,d),set:(k,v)=>{U.store.set("oukala-r15d-"+k,v)}};
R15D.store=store;
S.r15d=S.r15d||{agFilter:"all",agHour:null};

/* ---------- shared post-render hook for all r15d modules (CL-35: HOOKS, not a render wrapper) ----------
   Orders -2010 and 2010 keep the old wrapper position: before and after the r16g_b and r18g hooks, which wrapped later. */
if(!R15D.wrapped){R15D.wrapped=true;
 HOOKS.on("beforeRender",()=>{R15D.beginRender&&R15D.beginRender()},{id:"r15d.begin",order:-2010});
 HOOKS.on("afterRender",()=>{R15D.after.forEach(fn=>{try{fn()}catch(e){console.error("r15d after",e)}})},{id:"r15d.after",order:2010});
}

/* ---------- units: one formatter for every metric ---------- */
const UNIT_FIX={ /* metrics whose stored unit disagreed with what the number is */
 m_spi:"idx",m_pf_calspread:" pts",m_tokcost:"$",m_chx_steps:"steps",m_inbox_decisions_per_session:" per session",m_rel_df:" per week",m_sow_trap:" contracts",
 m_renew:" contracts",m_svc_ftime:" d"};
const NAME_FIX={ /* same name, different scope: say which */
 m_dora_cfr:"Change failure rate (releases)",m_itsm_cfr:"Change failure rate (service changes)",
 m_dora_ttr:"Time to restore (releases)",m_itsm_mttrall:"Time to restore (all incidents)",
 m_apcycle:"Approval cycle time (invoices)",m_itsm_appr:"Approval cycle time (changes)",
 m_deflect_kb:"Deflection by knowledge",m_deflect:"Deflection by portal and chat",
 m_org_own:"Ownership coverage (org chart)",m_own_cov:"Ownership coverage (registry)",
 m_agentauto:"Agent automation rate",m_pf_ag_acc:"Agent accuracy (performance review)",
 m_pf_sla:"SLA attainment (performance review)",m_slaatt:"SLA attainment (service levels)",
 m_dora_lead:"Lead time for changes (releases)",m_rel_ltc:"Lead time for changes (release trains)"};
function fixMetrics(){
 Object.keys(UNIT_FIX).forEach(k=>{const m=typeof METRICS!=="undefined"&&METRICS[k];if(m&&!m._r15u){m._r15u=1;m.u=UNIT_FIX[k]}});
 Object.keys(NAME_FIX).forEach(k=>{const m=typeof METRICS!=="undefined"&&METRICS[k];if(m&&!m._r15n&&!/\(/.test(m.n)){m._r15n=1;m.n=NAME_FIX[k]}});
}
const plural=(v,w)=>v+" "+w+(Math.abs(v)===1?"":"s");
function fmtVal(m,v){
 v=v==null?m.cur:v;if(v==null||isNaN(v))return "n/a";
 const r2=x=>Math.round(x*100)/100;const u=m.u==null?"":m.u;
 switch(u){
  case "%":return r2(v)+"%";case "idx":return Number(v).toFixed(2);case " pts":return r2(v)+" pts";
  case "h":case " h":return r2(v)+" h";case "days":case " days":case "d":case " d":return r2(v)+(Math.abs(v)===1?" day":" days");
  case " min":return r2(v)+" min";case "$":return "$"+r2(v);case "x":return r2(v)+"x";case "K":return "$"+r2(v)+"K";
  case " per week":return r2(v)+" per week";case "FTE":return r2(v)+" FTE";case "steps":return r2(v)+" steps";case "ms":return r2(v)+" ms";
  case "clicks":return r2(v)+" clicks";case "fields":return plural(r2(v),"field");case "modules":return plural(r2(v),"module");
  default:return typeof v==="number"?(u&&/^ /.test(u)?r2(v)+u:String(r2(v))):String(v)}
}
W.mfmt=function(m,v){return fmtVal(m,v)};
R15D.fmtVal=fmtVal;
/* the unit a displayed string implies, for the conflict test */
R15D.unitOf=id=>G(()=>METRICS[id].u,"");

/* ---------- AGENTS_STATE: the one place that decides how many agents there are and what they are doing ---------- */
const SHAPE_BIZ=[0,0,0,0,0,0,1,3,6,8,9,8,6,8,9,8,6,3,1,0,0,0,0,0],SHAPE_24=[3,3,3,3,3,3,4,5,6,6,6,6,6,6,6,6,5,5,4,4,3,3,3,3];
const ALWAYS=/event|ops agent|triage|correlator|test agent|change risk/i;
const hs=s=>{let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h};
const SIM_HOUR=13;
function hourNow(){const h=S.r15d.agHour;return h==null?SIM_HOUR:h}
function buildRows(){
 const org=G(()=>ORGX.agents(),[]),gw=G(()=>S.agents,[])||[];
 const gwBy={};gw.forEach(g=>gwBy[String(g.n).toLowerCase()]=g);const used=new Set();const rows=[];const h=hourNow();
 const mk=(o,g)=>{
  const name=o?o.name:g.n,key=name.toLowerCase();if(g)used.add(g.id);
  const alw=ALWAYS.test(name),runsToday=g?g.runs:Math.max(3,Math.round(((o.eval&&o.eval.runs)||60)/10));
  const shape=alw?SHAPE_24:SHAPE_BIZ,tot=shape.reduce((a,b)=>a+b,0);
  const act=g&&g.act&&g.act.length===24?g.act.slice():shape.map(s=>Math.round(runsToday*s/tot));
  const gwState=g?g.st:null;
  const orgState=o?o.status:null;
  const observed=g&&g.st==="observed";
  const enabled=!observed&&!(gwState==="paused"||gwState==="killed"||orgState==="paused"||orgState==="killed"||orgState==="retired"||orgState==="suspended");
  const onShift=alw||(h>=7&&h<19);
  const runsHour=act[h]||0;
  let state;if(observed)state="observed";else if(!enabled)state="paused";else if(!onShift)state="offshift";else if(runsHour>0)state="working";else state="idle";
  const d=G(()=>agentDisplay(name),{full:name,first:name});
  return {id:(o&&o.id)||(g&&g.id),name,display:d.full,first:d.first,sponsor:o?o.sponsor:(g&&g.owner)||"",source:o&&g?"org chart and gateway":o?"org chart":"gateway",kind:observed?"Third party":"AI agent",
   gateway:!!g&&!observed,observed,enabled,onShift,runsHour,runsToday,act,state,autonomy:o?o.autonomy:(g?G(()=>AUTO_LEVELS[g.auto],""):""),shift:alw?"24 hours":"07:00 to 19:00",model:(o&&o.model)||(g&&g.model)||"",cap:g?g["cap$"]:null,spend:g?g.spend:null,gid:g?g.id:null}};
 org.forEach(o=>rows.push(mk(o,gwBy[String(o.name).toLowerCase()])));
 gw.forEach(g=>{if(!used.has(g.id))rows.push(mk(null,g))});
 return rows;
}
const ST_ORDER=["working","idle","offshift","paused","observed"];
const ST_LABEL={working:"Working",idle:"Idle",offshift:"Off shift",paused:"Paused",observed:"Observed only"};
const ST_DEF={working:"Enabled, on shift and has a run in progress this hour (run log).",idle:"Enabled and on shift, but no run this hour.",offshift:"Enabled, outside its shift window, so it does not start runs.",paused:"Switched off by a person or by the kill switch.",observed:"Third-party AI outside the gateway. Seen, not governed."};
const AGENTS_STATE=W.AGENTS_STATE={
 hour:hourNow,setHour(h){S.r15d.agHour=h===SIM_HOUR?null:h;R15D.refreshRail&&R15D.refreshRail()},
 clock(){const h=hourNow();return (h<10?"0":"")+h+":29"},
 rows:buildRows,
 counts(){const r=buildRows(),c={registered:r.length,working:0,idle:0,offshift:0,paused:0,observed:0,enabled:0,gateway:0,gatewayEnabled:0,org:0};
  r.forEach(a=>{c[a.state]++;if(a.enabled)c.enabled++;if(a.gateway)c.gateway++;if(a.gateway&&a.enabled)c.gatewayEnabled++;if(a.source!=="gateway")c.org++});
  c.governed=r.filter(a=>!a.observed).length;c.gatewayRegistered=G(()=>S.agents.length,0);return c},
 list(f){const r=buildRows();return !f||f==="all"?r:r.filter(a=>f==="enabled"?a.enabled:a.state===f)},
 labels:ST_LABEL,defs:ST_DEF,order:ST_ORDER,
 line(){const c=this.counts();return c.working+" working now · "+c.enabled+" enabled · "+c.registered+" registered"},
 meaning:"Working = enabled, on shift and a run in progress this hour. Enabled = switched on and not paused. Registered = known to the org chart or the AI gateway."
};
const RAIL_BTN='.tb-right .live[data-nav="tower"],.tb-right .live[data-r15d-rail]';
R15D.refreshRail=function(){
 const b=document.querySelector(RAIL_BTN);if(!b)return;const c=AGENTS_STATE.counts();
 b.setAttribute("data-r15d-rail","1");b.removeAttribute("data-nav");
 const l=b.querySelector(".lbl-long");if(l)l.textContent=c.working+" of "+c.registered+" agents working";
 b.title=c.working+" of "+c.registered+" registered agents are running a task now ("+c.org+" are on the org chart, "+(c.registered-c.org)+" outside it) at "+AGENTS_STATE.clock()+", "+c.enabled+" enabled, "+c.registered+" registered. Select to see the list.";
 b.setAttribute("aria-label",b.title);
};
R15D.onAfter(()=>R15D.refreshRail());
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r15d-rail]");if(!b)return;e.preventDefault();e.stopPropagation();S.r15d.agFilter="working";go("r15d_agents")},true);

/* strip of agent states shown on every screen that mentions agents */
function agStrip(){
 const c=AGENTS_STATE.counts();
 return `<div class="r15d-agstrip" data-r15d-agstrip role="group" aria-label="Agent states from the agent registry"><span class="r15d-agt"><b>${c.registered}</b> agents registered</span>${ST_ORDER.filter(s=>c[s]||s==="working").map(s=>`<button type="button" class="chip r15d-ags ${s}" data-r15d-agf="${s}" title="${E(ST_DEF[s])}">${c[s]} ${ST_LABEL[s].toLowerCase()}</button>`).join("")}<button type="button" class="btn quiet" data-r15d-agf="all">Definitions and list</button></div>`;
}
R15D.agStrip=agStrip;
const STRIP_SCREENS=["tower","org_chart","ppl_org","ppm_proj","ppl_cap"];
R15D.onAfter(()=>{
 if(!STRIP_SCREENS.includes(S.screen))return;const v=document.getElementById("view");if(!v||v.querySelector("[data-r15d-agstrip]"))return;
 const h=v.querySelector(".hero");if(h)h.insertAdjacentHTML("afterend",agStrip());
});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r15d-agf]");if(!b)return;S.r15d.agFilter=b.dataset.r15dAgf;go("r15d_agents")});

/* ---------- FACTS ---------- */
const FR={},DUPE_DEF=[];
const FACTS=W.FACTS=W.FACTS||{};
FACTS.define=function(d){if(FR[d.id])DUPE_DEF.push(d.id);FR[d.id]=Object.assign({scope:"",probes:[],unit:"count"},d);return d.id};
FACTS.get=id=>{const f=FR[id];if(!f)return undefined;try{return typeof f.value==="function"?f.value():f.value}catch(e){return undefined}};
FACTS.def=id=>FR[id];
FACTS.list=()=>Object.keys(FR).map(id=>Object.assign({},FR[id],{current:FACTS.get(id)}));
FACTS.fmt=id=>{const f=FR[id];if(!f)return "";const v=FACTS.get(id);switch(f.unit){case "$":return "$"+N0(Math.round(v*100)/100);case "%":return v+"%";case "idx":return Number(v).toFixed(2);case "days":return v+" days";case " pts":return v+" pts";default:return N0(v)}};
FACTS.metric=id=>({id,value:G(()=>METRICS[id].cur),unit:R15D.unitOf(id),text:G(()=>mfmt(METRICS[id]),"n/a"),source:"METRICS."+id});
FACTS.ids=()=>Object.keys(FR);
FACTS.dupeDefs=()=>DUPE_DEF.slice();
const agc=()=>AGENTS_STATE.counts();
const D=FACTS.define;
D({id:"agents.registered",concept:"agents",scope:"org chart and gateway",label:"AI agents registered",value:()=>agc().registered,unit:"count",source:"AGENTS_STATE (ORGX.agents + S.agents)",probes:[]});
D({id:"agents.working",concept:"agents working",scope:"run in progress this hour",label:"Agents working now",value:()=>agc().working,unit:"count",source:"AGENTS_STATE",probes:[{dom:RAIL_BTN,label:'top bar',re:/(\d+) agents? working/}]});
D({id:"agents.enabled",concept:"agents enabled",scope:"switched on",label:"Agents enabled",value:()=>agc().enabled,unit:"count",source:"AGENTS_STATE"});
D({id:"agents.org",concept:"agents in org chart",scope:"org chart",label:"AI agents on the org chart",value:()=>agc().org,unit:"count",source:"ORGX.agents()",probes:[{screen:"org_chart",re:/(\d+) AI agents, each with a named sponsor/}]});
D({id:"agents.gateway",concept:"agents under gateway",scope:"gateway",label:"Agents under the AI gateway",value:()=>agc().gateway,unit:"count",source:"S.agents (not observed)",probes:[]});
D({id:"agents.gateway_registered",concept:"agents in gateway registry",scope:"gateway registry",label:"Agents in the gateway registry",value:()=>agc().gatewayRegistered,unit:"count",source:"S.agents",probes:[{screen:"tower",re:/\d+ of (\d+) agents/}]});
D({id:"ai.daily_cap",concept:"AI daily cap",scope:"all agents",label:"AI daily spend cap",value:()=>G(()=>S.agents.reduce((a,b)=>a+(b["cap$"]||0),0),0),unit:"$",source:"S.agents cap$ (sum)",probes:[{screen:"tower",re:/of \$(\d+) daily cap/},{screen:"tower",re:/Daily cap \$(\d+)/}]});
D({id:"ai.spend_today",concept:"AI spend today",scope:"all agents",label:"AI spend today",value:()=>G(()=>Math.round(S.agents.reduce((a,b)=>a+b.spend,0)*100)/100,0),unit:"$",source:"S.agents spend (sum)",probes:[]});
D({id:"workforce.directory",concept:"workers",scope:"people directory",label:"Workers in the directory",value:()=>G(()=>DIR.length,0),unit:"count",source:"DIR",probes:[{screen:"ppl_org",re:/(\d+) workers: /}]});
D({id:"workforce.employees",concept:"employees",scope:"people directory",label:"Employees in the directory",value:()=>G(()=>DIR.filter(d=>d.kind==="human").length,0),unit:"count",source:"DIR kind=human",probes:[{screen:"ppl_org",re:/workers: (\d+) employees/}]});
D({id:"workforce.org_chart",concept:"people on org chart",scope:"org chart",label:"People placed on the org chart",value:()=>G(()=>ORGX.stats().heads,0),unit:"count",source:"ORGX.stats().heads",probes:[{screen:"org_chart",re:/(\d+) people · \d+ layers/}]});
D({id:"projects.assigned",concept:"people on projects",scope:"active projects (last Projects and teams render)",label:"People and agents assigned to active projects",value:()=>R15D._pa==null?null:R15D._pa,unit:"count",source:"PPM membersOf() read from the Projects and teams screen",observed:true});
FACTS.syncFromScreen=function(){const v=document.getElementById("view");const m=v&&v.innerText.match(/with (\d+) people and agents/);if(m)R15D._pa=+m[1]};
/* metrics are facts too: units come from METRICS.u through mfmt */
D({id:"metric.m_spi",concept:"schedule performance index",scope:"portfolio",label:"Schedule performance index",value:()=>G(()=>METRICS.m_spi.cur),unit:"idx",source:"METRICS.m_spi",probes:[{screen:"ppm_proj",re:/Schedule performance index[:\s]*([0-9]\.[0-9]{2})(%)?/,noPct:true}]});
D({id:"metric.m_pf_calspread",concept:"calibration spread",scope:"performance reviews",label:"Calibration spread between managers",value:()=>G(()=>METRICS.m_pf_calspread.cur),unit:"pts",source:"METRICS.m_pf_calspread",probes:[]});

/* ---------- conflict test ---------- */
function textOf(screen){
 let html="";try{html=(_R[screen]||(()=>""))()}catch(e){return ""}
 const t=document.createElement("div");t.innerHTML=html;return t.textContent.replace(/\s+/g," ")}
FACTS.test=function(opts){
 opts=opts||{};fixMetrics();const out={duplicates:[],conflicts:[],unitProblems:[],probes:[],metricNameConflicts:[],defErrors:FACTS.dupeDefs()};
 /* 1. two facts that claim the same concept and scope */
 const seen={};Object.keys(FR).forEach(id=>{const f=FR[id],k=f.concept+"|"+f.scope;if(seen[k])out.duplicates.push(seen[k]+" and "+id+" both define "+f.concept+" ("+f.scope+")");else seen[k]=id});
 /* 2. probes: a screen that shows a different number than the registry */
 const cache={};
 Object.keys(FR).forEach(id=>{const f=FR[id];const want=FACTS.get(id);(f.probes||[]).forEach(p=>{
   let txt;if(p.dom){const el=document.querySelector(p.dom);txt=el?(el.textContent+" "+(el.title||"")):""}else{txt=cache[p.screen]||(cache[p.screen]=textOf(p.screen))}
   const m=txt.match(p.re);const r={fact:id,screen:p.label||p.screen||p.dom,want,found:m?+m[1]:null};
   if(!m){r.status="not shown";}else if(p.noPct&&m[2]==="%"){r.status="wrong unit (percent sign on an index)";out.unitProblems.push(r)}else if(+m[1]!==+want){r.status="conflict";out.conflicts.push(r)}else r.status="ok";
   out.probes.push(r)})});
 /* 3. metrics with the same name but different values or units */
 const names={};Object.keys(METRICS).forEach(k=>{const n=METRICS[k].n.toLowerCase().replace(/[^a-z0-9]/g,"");(names[n]=names[n]||[]).push(k)});
 Object.keys(names).forEach(n=>{const ks=names[n];if(ks.length>1)out.metricNameConflicts.push(ks.map(k=>k+"="+METRICS[k].cur+METRICS[k].u).join(" vs "))});
 /* 4. unit sanity: a percent metric whose scale is 0 to 3, or a ratio shown with a percent sign */
 Object.keys(METRICS).forEach(k=>{const m=METRICS[k];if(m.u==="%"&&m.max<=3)out.unitProblems.push({fact:"metric."+k,status:"percent with a scale of 0 to "+m.max});if(/\bindex\b|\bratio\b/i.test(m.n)&&m.u==="%"&&m.cur<5)out.unitProblems.push({fact:"metric."+k,status:"index shown as percent"});if(/\b(days?|time|age)\b/i.test(m.n)&&m.u===""&&!/count|per|rate/i.test(m.n))out.unitProblems.push({fact:"metric."+k,status:"duration with no unit"})});
 out.pass=!out.duplicates.length&&!out.conflicts.length&&!out.unitProblems.length&&!out.metricNameConflicts.length&&!out.defErrors.length;
 out.summary=Object.keys(FR).length+" facts, "+out.probes.length+" probes, "+out.conflicts.length+" conflicts, "+out.duplicates.length+" duplicates, "+out.unitProblems.length+" unit problems";
 return out};
R15D.factsTest=FACTS.test;

/* ---------- the agent registry screen ---------- */
const AGF=["all","working","idle","offshift","paused","observed"];
function agRowHTML(a){
 const cls=a.state==="working"?"good":a.state==="idle"?"info":a.state==="observed"?"mute":"warn";
 return `<tr><td><button type="button" class="linkish" data-r15d-agopen="${E(a.name)}"><b>${E(a.display)}</b></button><small class="muted">${E(a.kind)} · ${E(a.model||"model not recorded")}</small></td><td>${a.sponsor?ownerChip(a.sponsor,{role:"Sponsor"}):E("none")}</td><td><span class="pill ${cls}">${ST_LABEL[a.state]}</span></td><td class="num">${a.runsHour}</td><td class="num">${a.runsToday}</td><td>${a.shift}</td><td>${a.gateway?"Under the gateway":a.observed?"Outside the gateway":"Org chart only"}</td><td>${E(a.autonomy||"")}</td></tr>`}
REG("r15d_agents","Agent registry","ai","M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7zM9 12l2 2 4-4",()=>{
 const f=AGF.includes(S.r15d.agFilter)?S.r15d.agFilter:"all",c=AGENTS_STATE.counts(),rows=AGENTS_STATE.list(f==="all"?null:f);const h=AGENTS_STATE.hour();
 return `<div class="screen">${hero("AI and governance · Agent registry","One list of every agent, one meaning of working",`<b data-role="metric">${c.working}</b> of <b data-role="metric">${c.registered}</b> registered agents are working at ${AGENTS_STATE.clock()}. <b>${c.enabled}</b> are enabled and <b>${c.governed}</b> run under governance. The top bar, the org chart, the Control Tower and Ask all read this list.`,`<div class="row">${typeof fchip==="function"?"":""}<label class="r15d-hr">Time of day <select class="fin" data-r15d-hour aria-label="Time of day for the shift check">${Array.from({length:24},(_,i)=>`<option value="${i}" ${i===h?"selected":""}>${(i<10?"0":"")+i}:29</option>`).join("")}</select></label></div>`)}${lensNote()}
 ${R15D.agStrip()}
 <section class="card glass"><div class="cardhead"><div><h3>What the words mean</h3><span class="muted small">Used by every screen</span></div></div><div class="r15d-defs">${ST_ORDER.map(s=>`<div><span class="pill ${s==="working"?"good":s==="idle"?"info":s==="observed"?"mute":"warn"}">${ST_LABEL[s]} · ${c[s]}</span><span class="small muted">${E(ST_DEF[s])}</span></div>`).join("")}<div><span class="pill mute">Enabled · ${c.enabled}</span><span class="small muted">Not paused or killed, not observed-only. Includes working, idle and off shift.</span></div><div><span class="pill mute">Registered · ${c.registered}</span><span class="small muted">${c.org} on the org chart plus gateway entries not on it. The 15 AI agents shown on the org chart are the same records.</span></div></div></section>
 <section class="card glass"><div class="cardhead"><div><h3>${f==="all"?"All agents":ST_LABEL[f]+" agents"} · ${rows.length}</h3><span class="muted small">Runs this hour and today come from the gateway run log; agents off the gateway use the org chart evaluation log. Select a name for the profile.</span></div><div class="row r15d-agfilters">${AGF.map(x=>`<button type="button" class="chip" data-r15d-agf="${x}" aria-pressed="${f===x}">${x==="all"?"All "+c.registered:ST_LABEL[x]+" "+c[x]}</button>`).join("")}</div></div>
 <div class="tablewrap"><table class="tbl"><thead><tr><th>Agent</th><th>Sponsor</th><th>State</th><th>Runs this hour</th><th>Runs today</th><th>Shift</th><th>Governance</th><th>Autonomy</th></tr></thead><tbody>${rows.map(agRowHTML).join("")||`<tr><td colspan="8" class="muted">No agents in this state at ${AGENTS_STATE.clock()}.</td></tr>`}</tbody></table></div></section></div>`});
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest("[data-r15d-hour]");if(!s)return;AGENTS_STATE.setHour(+s.value);render()});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r15d-agopen]");if(!b)return;const n=b.dataset.r15dAgopen;if(G(()=>ORGX.agentByName(n),null)&&ORGX.openAgent)ORGX.openAgent(n);else go("tower")});

/* ---------- Facts and conflicts screen ---------- */
REG("r15d_facts","Facts and conflicts","plat","M4 5h16M4 12h16M4 19h10M18 17l2 2 3-4",()=>{
 fixMetrics();FACTS.syncFromScreen();const T=FACTS.test(),L=FACTS.list();
 const row=f=>`<tr><td><code>${E(f.id)}</code><small class="muted">${E(f.label)}</small></td><td class="num">${E(FACTS.fmt(f.id))}</td><td>${E(f.unit)}</td><td>${E(f.scope)}</td><td>${E(f.source)}</td></tr>`;
 return `<div class="screen">${hero("Platform · Facts and conflicts","Every number has one home",`<b data-role="metric">${L.length}</b> facts are registered with a value, a unit, a scope and a source. The test below renders each screen that shows one and compares what it shows. <b data-role="metric">${T.conflicts.length+T.duplicates.length+T.unitProblems.length}</b> problems found.`,`<div class="row"><button class="btn primary" data-r15d-factrun>Run the check again</button><span class="pill ${T.pass?"good":"warn"}">${T.pass?"All consistent":"Needs attention"}</span></div>`)}${lensNote()}
 ${card("Check result",T.summary,`<div class="tablewrap"><table class="tbl"><thead><tr><th>Fact</th><th>Screen</th><th>Registry says</th><th>Screen shows</th><th>Result</th></tr></thead><tbody>${T.probes.map(p=>`<tr><td><code>${E(p.fact)}</code></td><td>${E(p.screen)}</td><td class="num">${E(p.want)}</td><td class="num">${p.found==null?"not shown":E(p.found)}</td><td><span class="pill ${p.status==="ok"?"good":p.status==="not shown"?"mute":"bad"}">${E(p.status)}</span></td></tr>`).join("")}${T.duplicates.map(d=>`<tr><td colspan="4">${E(d)}</td><td><span class="pill bad">duplicate</span></td></tr>`).join("")}${T.unitProblems.filter(u=>!u.screen).slice(0,12).map(u=>`<tr><td colspan="4"><code>${E(u.fact)}</code></td><td><span class="pill warn">${E(u.status)}</span></td></tr>`).join("")}</tbody></table></div>`)}
 ${T.metricNameConflicts.length?card("Metrics with the same name",T.metricNameConflicts.length+" name clashes still open",`<ul class="steps">${T.metricNameConflicts.map(x=>`<li>${E(x)}</li>`).join("")}</ul>`):""}
 ${card("Registered facts","Each screen reads these through FACTS.get(id) or through the metric registry (unit comes from the metric).",`<div class="tablewrap"><table class="tbl"><thead><tr><th>Fact</th><th>Value</th><th>Unit</th><th>Scope</th><th>Source</th></tr></thead><tbody>${L.map(row).join("")}</tbody></table></div>`)}</div>`});
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-r15d-factrun]")){toast("Check run","good");render()}});

/* ---------- text fixes on screens that print their own sums (read from the registry, not typed) ---------- */
R15D.onAfter(()=>{
 const v=document.getElementById("view");if(!v)return;
 if(S.screen==="tower"){
  const c=AGENTS_STATE.counts();
  v.querySelectorAll(".hero .story,.hero p").forEach(p=>{p.innerHTML=p.innerHTML.replace(/(<b[^>]*>)?\d+ of \d+(<\/b>)? agents are running inside the gateway/,(m)=>`<b>${c.gatewayEnabled}</b> of <b>${c.gatewayRegistered}</b> gateway agents are enabled and <b>${c.working}</b> are working now`)});
 }
 if(S.screen==="ppm_proj"){FACTS.syncFromScreen()}
});

/* scope labels: the same word means different populations on different screens, so each screen says which */
R15D.onAfter(()=>{
 const v=document.getElementById("view");if(!v)return;
 const sub=(re,fn)=>v.querySelectorAll(".hero .story,.hero p,.stat em,.muted.small").forEach(p=>{if(re.test(p.innerHTML)&&!p.dataset.r15dScope){p.dataset.r15dScope="1";p.innerHTML=p.innerHTML.replace(re,fn)}});
 const emp=FACTS.get("workforce.employees"),dir=FACTS.get("workforce.directory");
 if(S.screen==="org_chart")sub(/(<b[^>]*>)?(\d+) people(<\/b>)? · (\d+) layers/,(m,a,n,b,l)=>`${a||""}${n} people${b||""} on the chart (directory: ${emp} employees) · ${l} layers`);
 if(S.screen==="ppm_proj")sub(/(<b[^>]*>)(\d+)<\/b> people and agents:/,(m,a,n)=>`${a}${n}</b> people and agents on active projects (directory: ${dir} workers):`);
});
/* apply unit and name fixes as early as possible and again before the first render */
const early=()=>{try{fixMetrics()}catch(e){}try{if(!R15D._sp&&typeof SPEND30!=="undefined"&&S.agents){R15D._sp=1;const sp=S.agents.reduce((a,b)=>a+b.spend,0),k=sp/SPEND30[SPEND30.length-1];for(let i=0;i<SPEND30.length;i++)SPEND30[i]=Math.round(SPEND30[i]*k*10)/10}}catch(e){}};
R15D.beginRender=(function(prev){return function(){prev&&prev();early()}})(R15D.beginRender);
setTimeout(early,0);
})();
