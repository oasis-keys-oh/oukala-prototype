/* ===== mod_org3: Agent studio, agent builder, chat intents, search and the Feature Contract wiring (prefix org). ===== */
(function(){
const O=window.ORGX,OS=S.org;
const H=s=>esc(s==null?"":String(s));
const first=n=>String(n).split(" ")[0];
const riskCls=r=>r==="low"?"good":r==="med"?"warn":"bad";
const riskTxt=r=>r==="low"?"Low risk":r==="med"?"Medium risk":"High risk";
OS.pick=OS.pick||{};
const drawerOpen=()=>{try{return document.getElementById("drawer").matches(":popover-open")}catch(e){return false}};
function refresh(n,studio){if(drawerOpen()&&OS.cur){if(n)OS.cur=n;S.v.org_p=6;O.openProfile(OS.cur,6)}else{if(studio&&S.screen!=="org_chart"){go("org_chart")}render()}}
/* ---------- the studio for one person ---------- */
function ladder(a){return `<div class="org-lad" role="group" aria-label="Autonomy for ${H(a.name)}">${Object.keys(O.LVL).map(k=>{const dis=k==="act"&&hiRisk(a);return `<button type="button" data-org-lvl="${H(a.name)}|${k}" aria-pressed="${a.autonomy===k}" ${dis?'disabled title="Act is not available for high-risk work"':""}>${O.LVL[k].short}</button>`}).join("")}</div>`}
function hiRisk(a){return O.opps(a.sponsor).some(o=>(a.opps||[]).indexOf(o.id)>=0&&o.risk==="high")}
function agentRow(a){
 const stc=a.status==="running"?"good":a.status==="paused"?"warn":"bad";
 return `<div class="org-agr is-agent"><div class="org-agh">${O.hexAvatar(a.name,40)}<div><button type="button" class="org-lnk" data-org-agent="${H(a.name)}"><b>${H(a.name)}</b> ${O.aiChip("AI")}</button><small class="muted">${H(a.does).slice(0,110)}</small></div></div>
 <div class="org-agm"><span class="pill ${stc}">${H(a.status==="running"?(a.source==="built"&&!a.eval.runs?"Pilot":"Running"):a.status)}</span><span class="pill info">${a.hrs} h/week</span>${ladder(a)}<span class="org-agb">${a.status==="running"?`<button type="button" class="btn quiet" data-org-state="${H(a.name)}|paused">Pause</button>`:`<button type="button" class="btn quiet" data-org-state="${H(a.name)}|running">Restore</button>`}<button type="button" class="btn quiet danger" data-org-state="${H(a.name)}|killed" ${a.status==="killed"?"disabled":""}>Stop</button></span></div></div>`}
function oppCard(o,i,p,pickSet){
 const state=o.builtBy?`<span class="pill good">Built: ${H(o.builtBy)}</span>`:o.cov?`<span class="pill good">Covered by ${H(o.cov)}</span>`:"";
 const open=!o.builtBy&&!o.cov;
 return `<article class="org-op ${open?"":"done"}"><div class="org-opr">${open?i+1:"✓"}</div>
 <div class="org-opb"><div class="row sp"><h4>${H(o.title)}</h4><div class="row"><span class="pill ${riskCls(o.risk)}">${riskTxt(o.risk)}</span><span class="pill info" data-role="metric">${o.hrs} h/week</span></div></div>
 <p class="muted small">${H(o.why)} <span class="pill mute">${H(o.src)}</span> ${state} ${aiChip?aiChip({model:"Claude Sonnet",conf:o.conf,title:"How this was found",note:"Matched to the role's recurring tasks and to items currently waiting on "+first(o.who)+". Hours are an estimate until a pilot measures them.",src:[o.src]}):""}</p>
 <div class="org-opd"><div><small class="eyebrow">Data it needs</small><div class="row">${o.data.map(d=>`<span class="pill mute">${H(d)}</span>`).join("")}</div></div><div><small class="eyebrow">Guardrails</small><ul class="org-gl">${o.guard.map(g=>`<li>${H(g.charAt(0).toUpperCase()+g.slice(1))}</li>`).join("")}</ul></div></div>
 ${open?`<div class="row org-opa"><label class="org-pk"><input type="checkbox" data-org-pick="${H(o.id)}" ${pickSet.has(o.id)?"checked":""}><span>Add to bundle</span></label><button type="button" class="btn primary" data-org-build="${H(o.id)}">Build agent</button><button type="button" class="btn" data-org-cust="${H(o.id)}">Customize</button></div>`:""}
 </div></article>`}
function studioHTML(n,inDrawer){
 const p=O.P(n);if(!p)return "<p class='muted'>Pick a person.</p>";
 const c=O.capacity(n),ag=O.agentsOf(n),ops=O.opps(n),open=ops.filter(o=>!o.cov&&!o.builtBy);const pick=new Set(OS.pick[n]||[]);
 const rec=open.filter(o=>o.risk!=="high").slice(0,3);const recH=rec.reduce((s,o)=>s+o.hrs,0);
 const after=+(c.returned+recH).toFixed(1);
 const frame=`<div class="org-frame"><b>Supercharge ${H(first(n))}, do not replace ${H(first(n))}.</b> Agents take routine preparation off ${H(first(n))}'s plate; the hours come back to ${H(first(n))}, to spend on ${H(O.reinvest(n))}. No agent is ever sized against headcount.</div>`;
 const bar=`<div class="org-capb" role="img" aria-label="${c.returned} hours returned, ${c.available} hours available, of ${c.cap}"><i class="r" style="width:${Math.min(100,100*c.returned/c.cap)}%"></i><i class="a" style="width:${Math.min(100-100*c.returned/c.cap,100*c.available/c.cap)}%"></i></div>${legend([["Returned to "+first(n)+" by agents now ("+c.returned+" h)","--good-f"],["Available in ranked opportunities ("+c.available+" h)","--p4"]])}`;
 return `${frame}
 <div class="p360grid">${[["Returned now",c.returned+" h","a week, "+c.pctReturned+"% of "+c.cap],["Still available",c.available+" h","a week in "+open.length+" opportunities"],["Agents",String(ag.length),ag.length?"sponsored by "+first(n):"none yet"],["If you build the top "+rec.length,after+" h","back to "+first(n)+", "+Math.round(100*after/c.cap)+"% of the week"]].map(x=>`<div class="stat"><small>${x[0]}</small><span class="num" data-role="metric">${x[1]}</span><em>${x[2]}</em></div>`).join("")}</div>
 ${bar}
 ${ag.length?`<div class="eyebrow" style="margin:16px 0 8px">${H(first(n))}'s agents</div><div class="org-agl">${ag.map(agentRow).join("")}</div>`:""}
 <div class="row sp" style="margin:18px 0 8px"><div class="eyebrow">Ranked automation opportunities</div><div class="row">${rec.length?`<button type="button" class="btn primary" data-org-bundle="${H(n)}">Build the recommended agent (${rec.length} tasks, ${+recH.toFixed(1)} h/week)</button>`:""}${pick.size?`<button type="button" class="btn" data-org-buildpick="${H(n)}">Build from ${pick.size} selected</button>`:""}</div></div>
 <p class="muted small">Ranked by hours returned × risk × confidence. Low-risk work can run with approval or on its own; high-risk work stays at suggest or approval. New agents start in a two-week pilot.</p>
 <div class="org-ops">${ops.length?ops.map((o,i)=>oppCard(o,open.indexOf(o),p,pick)).join(""):"<p class='muted'>No recurring tasks recorded for this role yet.</p>"}</div>`}
O.studioHTML=studioHTML;
/* ---------- the Agent studio tab ---------- */
function studioPane(){
 if(!OS.stud||!O.P(OS.stud))OS.stud="Avery Chen";const st=O.stats();
 const leads=O.staff.map(p=>({p,c:O.capacity(p.n),n:O.agentsOf(p.n).length})).sort((a,b)=>b.c.available-a.c.available).slice(0,10);
 const ags=O.agents();
 return `<div class="statrow">${kpi("AI agents",String(st.agents),"all with a sponsor and a kill switch",{metric:"m_org_gov"})}${kpi("Hours returned",st.returned+" h","a week, accepted work only",{metric:"m_org_cap"})}${kpi("Waiting to be built",st.open+" h","a week in ranked opportunities")}${kpi("Suggestions accepted",st.accept+"%","across agents with enough runs",{metric:"m_org_accept"})}</div>
 <div class="grid g2" style="align-items:start">
 <section class="card glass org-st1"><div class="cardhead"><div><h3>Choose a person</h3><span class="muted small">The studio ranks what an agent could take off their plate.</span></div></div>
  <label class="org-so" for="org-stud">Person</label><select id="org-stud" class="txtin" data-org-stud>${O.staff.map(p=>`<option ${p.n===OS.stud?"selected":""}>${H(p.n)}</option>`).join("")}</select>
  <div class="org-pp">${avatar(OS.stud,{size:56})}<div><b>${H(OS.stud)}</b><div class="muted small">${H(O.P(OS.stud).role)} · ${H(O.P(OS.stud).unit)}</div><div class="muted small">Go to ${H(first(OS.stud))} for ${H(O.P(OS.stud).fn[0].toLowerCase())}</div></div></div>
  <div class="eyebrow" style="margin:14px 0 8px">Where the next hours are</div>
  <div class="tscroll"><table><thead><tr><th>Leader</th><th>Agents</th><th>Returned</th><th>Available</th></tr></thead><tbody>${leads.map(l=>`<tr><td><button type="button" class="org-lnk" data-org-stud-set="${H(l.p.n)}"><b>${H(l.p.n)}</b><small>${H(l.p.role)}</small></button></td><td class="num">${l.n}</td><td class="num">${l.c.returned} h</td><td class="num">${l.c.available} h</td></tr>`).join("")}</tbody></table></div></section>
 <section class="card glass"><div class="cardhead"><div><h3>Every agent, one rulebook</h3><span class="muted small">Sponsor, autonomy, guardrails and a kill switch on each. Also listed in the AI Control Tower.</span></div><button type="button" class="btn" data-org-go="tower">Open AI Control Tower</button></div>
  <div class="tscroll"><table><thead><tr><th>Agent</th><th>Sponsor</th><th>Autonomy</th><th>State</th></tr></thead><tbody>${ags.map(a=>`<tr><td><button type="button" class="org-lnk" data-org-agent="${H(a.name)}"><b>${H(a.name)}</b></button></td><td>${H(a.sponsor)}</td><td><span class="pill ${a.autonomy==="act"?"warn":a.autonomy==="approval"?"info":"mute"}">${H(O.LVL[a.autonomy].short)}</span></td><td><span class="pill ${a.status==="running"?"good":a.status==="paused"?"warn":"bad"}">${H(a.status)}</span></td></tr>`).join("")}</tbody></table></div></section></div>
 <section class="card glass" style="margin-top:16px"><div class="cardhead"><div><h3>${H(first(OS.stud))}'s agent studio</h3><span class="muted small">Opportunities from recurring work and from what is waiting right now.</span></div></div>${studioHTML(OS.stud,false)}</section>`}
O.studioPane=studioPane;
/* ---------- the builder form (customize) ---------- */
function openBuilder(sponsor,oppIds){
 const ops=O.openOpps(sponsor);if(!ops.length){toast("No open opportunities for "+sponsor,"warn");return}
 const pre=(oppIds&&oppIds.length?oppIds:[ops[0].id]);const sel0=ops.filter(o=>pre.indexOf(o.id)>=0);
 const stdG=["Every action is written to the audit trail","Sponsor can pause or stop it at any time","Redacts personal data before any model call","Cannot send anything outside Meridian without approval"];
 const gOpts=[...new Set(ops.flatMap(o=>o.guard).concat(stdG))];
 const tOpts=[...new Set(ops.flatMap(o=>o.tools))],dOpts=[...new Set(ops.flatMap(o=>o.data))];
 const hasHi=()=>false;
 openForm({id:"org_agent",title:"Build an agent for "+sponsor,
  story:"Creates an agent record sponsored by "+first(sponsor)+", registers it in the AI Control Tower and the people directory, and shows it as an AI node under "+first(sponsor)+" on the org chart. It starts in a two-week pilot. Everything it does is audited, and "+first(sponsor)+" can pause or stop it.",submit:"Build agent",
  fields:[{section:"Identity"},{k:"name",label:"Agent name",type:"text",req:true,help:"People will see this on the org chart.",ai:{label:"Suggest",fn:v=>O.agentName(sponsor,ops.filter(o=>(v.opps||[]).indexOf(o.id)>=0))}},
   {k:"opps",label:"What it takes on",type:"multi",req:true,opts:ops.map(o=>[o.id,o.title+" ("+o.hrs+" h)"]),help:"Pick the tasks to bundle. Hours returned add up."},
   {section:"Autonomy and control"},{k:"autonomy",label:"Autonomy level",type:"chips",opts:[["suggest","Suggest"],["approval","Act with approval"],["act","Act within rules"]],help:"Start at Suggest. Act within rules is only for low-risk, reversible work."},
   {k:"kill",label:"Kill switch scope",type:"chips",opts:[["agent","This agent"],["capability","All of "+first(sponsor)+"'s agents"]],help:"Who can stop it, and how wide."},
   {section:"Tools, data and guardrails"},{k:"tools",label:"Tools it may use",type:"multi",opts:tOpts},{k:"data",label:"Data scope",type:"multi",opts:dOpts,help:"It sees only these records, and only what "+first(sponsor)+" may see."},
   {k:"guards",label:"Guardrails",type:"multi",opts:gOpts,help:"Standard guardrails are always added."},
   {section:"Measuring it"},{k:"eval",label:"Evaluation metrics",type:"multi",opts:["Suggestions accepted","Hours returned a week","Errors found in review","Escalation rate","Guardrail hits","Cost per task"]},
   {k:"reinvest",label:"What "+first(sponsor)+" does with the hours",type:"text",ph:O.reinvest(sponsor),help:"Capacity returned is reinvested. It is never counted as headcount."}],
  live:v=>{const chosen=ops.filter(o=>(v.opps||[]).indexOf(o.id)>=0),h=+chosen.reduce((s,o)=>s+o.hrs,0).toFixed(1),hi=chosen.some(o=>o.risk==="high"),med=chosen.some(o=>o.risk==="med");const cap=O.capacity(sponsor);
   return `<p class="story">${H(first(sponsor))} gets about <b>${h} hours a week</b> back (${Math.round(100*h/cap.cap)}% of the week) from ${chosen.length} task${chosen.length===1?"":"s"}. ${H(v.reinvest||O.reinvest(sponsor))}.</p>
   <p class="muted small">${hi?"High-risk work is bundled in, so Act within rules is switched off. ":""}${med&&v.autonomy==="act"?"Medium-risk work will need approval for any action outside the rules. ":""}Pilot ends Oct 24. Reviewed by the AI platform lead before it goes beyond a pilot.</p>
   <div class="row">${chosen.slice(0,4).map(o=>`<span class="pill ${riskCls(o.risk)}">${H(o.dom)}: ${riskTxt(o.risk)}</span>`).join("")}</div>`},
  onSubmit:v=>{const r=O.build({sponsor,name:v.name,opps:v.opps,autonomy:v.autonomy||"suggest",kill:v.kill,tools:v.tools,guards:v.guards,eval:v.eval,reinvest:v.reinvest});
   if(!r.ok){toast(r.err,"warn");return}OS.pick[sponsor]=[];toast(r.agent.name+" is live in pilot, "+LVLN(r.agent)+", "+r.agent.hrs+" h/week for "+first(sponsor),"good");closeDrawer();setTimeout(()=>{OS.cur=sponsor;O.openProfile(sponsor,6);if(S.screen==="org_chart")render()},50)}},
  {name:O.agentName(sponsor,sel0),opps:sel0.map(o=>o.id),autonomy:"suggest",kill:"agent",tools:[...new Set(sel0.flatMap(o=>o.tools))],data:[...new Set(sel0.flatMap(o=>o.data))],guards:[...new Set(sel0.flatMap(o=>o.guard))],eval:["Suggestions accepted","Hours returned a week","Errors found in review"]})}
const LVLN=a=>O.LVL[a.autonomy].n;
/* ---------- agent drawer ---------- */
function openAgent(name){
 const a=O.agentByName(name);if(!a)return;const stc=a.status==="running"?"good":a.status==="paused"?"warn":"bad";
 const ev=a.eval||{};const pilot=a.source==="built"&&!ev.runs;
 const log=OS.log.filter(l=>l.agent===name);
 const base=[{t:0,what:"Registered in the AI Control Tower with a named sponsor ("+a.sponsor+")",by:"AI platform lead"},{t:0,what:"Guardrails attached: "+a.guards.slice(0,2).join("; "),by:"AI platform lead"}];
 const evalP=pilot?`<p class="muted">In pilot: evaluation starts after 20 runs. Pilot review is on ${H(a.pilotEnds||"Oct 24")}. Use <b>Simulate a week</b> to see how the pilot would report.</p>`:`<div class="p360grid">${[["Suggestions accepted",ev.accept+"%","accepted ÷ shown"],["Errors found",ev.err+"%","found in review"],["Escalation",ev.esc+"%","sent back to a person"],["Runs",String(ev.runs),"all time"]].map(x=>`<div class="stat"><small>${x[0]}</small><span class="num" data-role="metric">${x[1]}</span><em>${x[2]}</em></div>`).join("")}</div>`;
 openDrawer(`<div class="org-dr"><div class="p360h">${O.hexAvatar(a.name,76)}<div><h2>${H(a.name)} ${O.aiChip("AI agent")}</h2><div class="p360kv"><span class="pill ${stc}">${H(a.status)}</span><span>Sponsor <b>${H(a.sponsor)}</b></span></div></div></div>
 <p class="story" data-role="story">${H(a.does)} Returns about <b>${a.hrs} hours a week</b> to ${H(first(a.sponsor))}${a.realized!=null&&a.source==="built"?`; measured so far: <b>${a.realized.toFixed(1)} h</b>`:""}. It supports ${H(first(a.sponsor))}; it does not replace anyone.</p>
 <div class="eyebrow">Autonomy</div>${ladder(a)}<p class="muted small">${a.autonomy==="suggest"?"A person does the work; the agent drafts and recommends.":a.autonomy==="approval"?"The agent prepares the action; the sponsor approves each one.":"The agent acts alone inside the rules below, and everything is logged."}</p>
 <div class="row" style="margin:10px 0 16px">${a.status==="running"?`<button type="button" class="btn" data-org-state="${H(a.name)}|paused">Pause</button>`:`<button type="button" class="btn primary" data-org-state="${H(a.name)}|running">Restore</button>`}<button type="button" class="btn danger" data-org-state="${H(a.name)}|killed" ${a.status==="killed"?"disabled":""}>Kill switch: stop</button>${a.source==="built"?`<button type="button" class="btn" data-org-sim="${H(a.name)}">Simulate a week</button>`:""}<button type="button" class="btn quiet" data-org-go="tower">AI Control Tower</button></div>
 <dl class="kv"><dt>Sponsor</dt><dd>${pchip(a.sponsor)}</dd><dt>Model</dt><dd>${H(a.model)}</dd><dt>Tools</dt><dd><div class="row">${a.tools.map(t=>`<span class="pill mute">${H(t)}</span>`).join("")}</div></dd><dt>Data scope</dt><dd><div class="row">${a.data.map(t=>`<span class="pill mute">${H(t)}</span>`).join("")}</div></dd><dt>Guardrails</dt><dd><ul class="org-gl">${a.guards.map(g=>`<li>${H(g.charAt(0).toUpperCase()+g.slice(1))}</li>`).join("")}</ul></dd><dt>Kill switch</dt><dd>${a.kill==="capability"?"All of the sponsor's agents":"This agent"}; the AI platform lead can stop any scope</dd>${a.evalMetrics?`<dt>Measured by</dt><dd>${a.evalMetrics.map(m=>`<span class="pill info">${H(m)}</span>`).join(" ")}</dd>`:""}${a.reinvest?`<dt>Hours go to</dt><dd>${H(a.reinvest)}</dd>`:""}<dt>Created</dt><dd>${H(a.created)}</dd></dl>
 <div class="eyebrow" style="margin-top:16px">Evaluation</div>${evalP}
 <div class="eyebrow" style="margin-top:16px">Audit trail</div><div class="stream">${log.concat(base).map(l=>`<div class="ev-line" style="grid-template-columns:90px 1fr"><span class="faint tabular">${l.t?new Date(l.t).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}):a.created}</span><span>${H(l.what)} <span class="muted small">${H(l.by||"")}</span></span></div>`).join("")}</div></div>`);
 audit("Opened agent",name)}
O.openAgent=openAgent;
/* ---------- events ---------- */
document.addEventListener("click",e=>{
 const t=e.target.closest&&e.target.closest("[data-org-build],[data-org-cust],[data-org-bundle],[data-org-buildpick],[data-org-lvl],[data-org-state],[data-org-sim],[data-org-stud-set]");if(!t)return;const d=t.dataset;
 if(d.orgBuild){const o=oppById(d.orgBuild);if(!o)return;const r=O.build({sponsor:o.who,opps:[o.id],autonomy:"suggest"});if(!r.ok){toast(r.err,"warn");return}toast(r.agent.name+" created in pilot (Suggest mode). Registered in the AI Control Tower, "+r.agent.hrs+" h/week for "+first(o.who),"good");refresh(o.who,true);return}
 if(d.orgCust){const o=oppById(d.orgCust);if(o)openBuilder(o.who,[o.id]);return}
 if(d.orgBundle){const n=d.orgBundle,rec=O.openOpps(n).filter(o=>o.risk!=="high").slice(0,3);openBuilder(n,rec.map(o=>o.id));return}
 if(d.orgBuildpick){const n=d.orgBuildpick;openBuilder(n,OS.pick[n]||[]);return}
 if(d.orgLvl){const [nm,lv]=d.orgLvl.split("|");if(!O.setAutonomy(nm,lv)){toast("Act within rules is not available for this agent: it takes on high-risk work","warn");return}toast(nm+" set to "+O.LVL[lv].n,"good");if(drawerOpen()&&!OS.cur)openAgent(nm);else refresh(null);return}
 if(d.orgState){const [nm,st]=d.orgState.split("|");O.setState(nm,st);toast(nm+(st==="running"?" restored":st==="paused"?" paused":" stopped by the kill switch"),st==="running"?"good":"warn");const dr=document.querySelector("#drawer .p360h h2");if(dr&&dr.textContent===nm)openAgent(nm);else refresh(null);return}
 if(d.orgSim){const a=O.agentByName(d.orgSim);if(!a)return;const r=RNG(a.name+(a.eval.runs||0));const runs=24+Math.round(r()*14);a.eval={accept:Math.round(74+r()*16),err:+(1+r()*3.5).toFixed(1),esc:Math.round(5+r()*8),runs:(a.eval.runs||0)+runs};a.realized=+Math.min(a.hrs,(a.realized||0)+a.hrs*(.3+r()*.25)).toFixed(1);O.bump();OS.log.unshift({t:Date.now(),agent:a.name,sponsor:a.sponsor,what:"Pilot week simulated: "+runs+" runs, "+a.eval.accept+"% accepted, "+a.realized+" h returned",by:"Pilot"});audit("Agent pilot week",a.name);toast("Pilot week: "+runs+" runs, "+a.eval.accept+"% of suggestions accepted","good");openAgent(a.name);return}
 if(d.orgStudSet){OS.stud=d.orgStudSet;render();return}});
document.addEventListener("change",e=>{
 const s=e.target.closest&&e.target.closest("[data-org-stud]");if(s){OS.stud=s.value;render();return}
 const p=e.target.closest&&e.target.closest("[data-org-pick]");if(p){const id=p.dataset.orgPick,o=oppById(id);if(!o)return;const arr=OS.pick[o.who]=OS.pick[o.who]||[];const i=arr.indexOf(id);if(p.checked&&i<0)arr.push(id);if(!p.checked&&i>=0)arr.splice(i,1);refresh(o.who,true)}});
function oppById(id){const n=String(id).split(":")[0];return O.opps(n).find(o=>o.id===id)||null}
/* ---------- search and chat ---------- */
SEARCHX.push(()=>{const o=[{g:"People and teams",t:"Org chart",m:"Reporting lines, agents, permissions, ownership",c:"--p4",f:()=>{OS.tab="chart";go("org_chart")},k:"org_chart org chart reporting structure hierarchy headcount span of control dotted line matrix human ai"},
  {g:"People and teams",t:"Agent studio",m:"Automation opportunities and agent builder",c:"--p4",f:()=>{OS.tab="studio";go("org_chart")},k:"org_chart agent studio automation opportunities build agent supercharge assistant"}];
 O.staff.forEach(p=>o.push({g:"People and teams",t:p.n,m:p.role+" · "+p.unit,c:"--p3",f:()=>O.openProfile(p.n),k:"org_chart person profile "+p.role+" "+p.unit+" "+p.fn.join(" ")}));
 O.agents().forEach(a=>o.push({g:"AI agents",t:a.name,m:"Agent sponsored by "+a.sponsor+" · "+O.LVL[a.autonomy].n,c:"--p4",f:()=>O.openAgent(a.name),k:"org_chart agent "+a.does+" "+a.sponsor}));return o});
const norm=s=>String(s||"").toLowerCase().replace(/['’]s\b/g,"").replace(/[?.!,]/g," ").replace(/\s+/g," ").trim();
function findPerson(t){t=norm(t);if(!t)return null;let hit=O.staff.find(p=>norm(p.n)===t)||O.staff.find(p=>t.indexOf(norm(p.n))>=0);if(hit)return hit.n;
 const f=O.staff.filter(p=>norm(first(p.n))===t||t.split(" ").indexOf(norm(first(p.n)))>=0);if(f.length===1)return f[0].n;
 const l=O.staff.filter(p=>t.split(" ").indexOf(norm(p.n.split(" ").pop()))>=0);if(l.length===1)return l[0].n;
 const r=O.staff.filter(p=>norm(p.role)===t);return r.length===1?r[0].n:null}
function findAgent(t){t=norm(t);return O.agents().find(a=>t.indexOf(norm(a.name))>=0)||O.agents().find(a=>norm(a.name).indexOf(t)>=0&&t.length>3)||null}
function whoFor(topic){const q=norm(topic).split(" ").filter(w=>w.length>2&&!/^(the|for|and|with|about|any)$/.test(w));if(!q.length)return[];
 return O.staff.map(p=>{const hay=norm(p.fn.join(" ")+" "+p.role+" "+p.value+" "+((O.dir(p.n)||{}).skills||[]).join(" "));let s=0;q.forEach(w=>{if(hay.indexOf(w)>=0)s+=2;if(norm(p.fn.join(" ")).indexOf(w)>=0)s+=2});return{p,s}}).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,3).map(x=>x.p)}
function lvlFrom(t){return /\bact with approval\b|\bwith approval\b|\bapproval\b/.test(t)?"approval":/\bact\b|\bautonomous\b|\bwithin rules\b/.test(t)?"act":/\bsuggest/.test(t)?"suggest":null}
ASKX.push(q=>{
 const t=norm(q);let m;
 if(!/\b(org|team|agent|assistant|report|reports|permission|permissions|own|owns|owner|automat|span|headcount|human|capacity|hours|go to|handles|expert|pause|stop|restore|kill|opportunit|supercharge|supercharging)\b/.test(t))return false;
 /* view toggles */
 if((m=t.match(/(?:show|switch to|open|see)\s+(?:the\s+)?(human and ai|human \+ ai|human plus ai|human ai|ai|human|people)\s+(?:view|org|chart)/))||(m=t.match(/(human and ai|human \+ ai|human plus ai|ai only|humans only|human only)\s+(?:view|org chart)/))){const k=m[1];OS.mode=/and|\+|plus/.test(k)?"both":/^ai/.test(k)?"ai":"human";OS.tab="chart";OS.k=0;go("org_chart");say(q,{t:"Showing the <b>"+(OS.mode==="both"?"Human + AI":OS.mode==="ai"?"AI":"Human")+"</b> view of the org chart.",steps:["Switched the view","Opened the org chart"]});return true}
 /* build an agent */
 if((m=t.match(/(?:build|create|make|set up)\s+(?:an?\s+)?(?:ai\s+)?(?:agent|assistant)\s+(?:for|to help)\s+(.+)/))||(m=t.match(/(?:build|create|make)\s+(.+?)\s+(?:an?\s+)?(?:agent|assistant)$/))||(m=t.match(/(?:supercharge)\s+(.+)/))){
  const who=findPerson(m[1]);if(!who){say(q,{t:"I could not tell who that is. Try a full name, for example “build an agent for Avery Chen”.",steps:["Looked for a person in the org chart"]});return true}
  const lvl=lvlFrom(t)||"suggest";const ops=O.openOpps(who);if(!ops.length){say(q,{t:"<b>"+H(who)+"</b> has no open automation opportunities; the agents already cover the ranked tasks.",steps:["Ranked opportunities","None open"]});return true}
  const r=O.build({sponsor:who,opps:[ops[0].id],autonomy:lvl});if(!r.ok){say(q,{t:H(r.err),steps:["Tried to build the agent"]});return true}
  OS.tab="chart";OS.cur=who;go("org_chart");setTimeout(()=>O.openProfile(who,6),150);
  say(q,{t:"Built <b>"+H(r.agent.name)+"</b> for "+H(first(who))+": "+H(ops[0].title.toLowerCase())+", about <b>"+r.agent.hrs+" hours a week</b> back to "+H(first(who))+". It runs in <b>"+H(O.LVL[r.agent.autonomy].n)+"</b> mode, in a two-week pilot, registered in the AI Control Tower with a kill switch.",steps:["Ranked "+who+"'s opportunities","Created the agent with guardrails","Registered it and added it to the org chart"]});return true}
 /* opportunities */
 if((m=t.match(/(?:automation|agent)\s+(?:opportunit\w+|ideas)\s+(?:for|of)\s+(.+)/))||(m=t.match(/what (?:could|can|should) (?:an?\s+)?(?:ai\s+)?(?:agent|ai|automation)\s+(?:do|take|handle)\s+for\s+(.+)/))||(m=t.match(/(?:open|show)\s+(.+?)\s+agent studio/))||(m=t.match(/agent studio\s+(?:for\s+)?(.+)/))){
  const who=findPerson(m[1]);if(who){const ops=O.openOpps(who).slice(0,3);OS.cur=who;go("org_chart");setTimeout(()=>O.openProfile(who,6),150);say(q,{t:"Top opportunities for <b>"+H(who)+"</b>: "+(ops.map((o,i)=>(i+1)+". "+H(o.title)+" ("+o.hrs+" h/week, "+riskTxt(o.risk).toLowerCase()+")").join("; ")||"none open")+". Say “build an agent for "+H(first(who))+"” to start the first one.",steps:["Ranked recurring work and pending items","Opened the studio"]});return true}}
 /* who to go to */
 if((m=t.match(/who (?:do i|should i|can i|would i)\s+(?:go|talk|speak|turn|ask)\s+(?:to\s+)?(?:for|about)?\s*(.+)/))||(m=t.match(/who (?:handles|owns|knows|is the expert on|is the go.to for|is responsible for)\s+(.+)/))){
  const r=whoFor(m[1]);if(!r.length){say(q,{t:"I could not match “"+H(m[1])+"” to anyone's primary functions. Try the org chart search.",steps:["Searched primary functions, roles and skills"]});return true}
  OS.q=m[1];OS.tab="chart";OS.k=0;go("org_chart");say(q,{t:"For “"+H(m[1])+"”, go to <b>"+r.map(p=>H(p.n)+" ("+H(p.role)+")").join("</b>, then <b>")+"</b>. "+H(r[0].fn.find(f=>whoFor(m[1])[0]&&norm(f).split(" ").some(w=>norm(m[1]).indexOf(w)>=0&&w.length>3))||r[0].fn[0])+".",steps:["Searched primary functions","Highlighted them on the org chart"]});return true}
 /* reports */
 if((m=t.match(/who reports to (.+)/))||(m=t.match(/(.+?)\s+(?:direct reports|team members|reports)$/))||(m=t.match(/(?:show|list)\s+(.+?)\s+team$/))){
  const who=findPerson(m[1]);if(who){const k=O.kids(who);OS.q="";OS.tab="chart";go("org_chart");const ag=O.agentsOf(who);say(q,{t:"<b>"+H(who)+"</b> has "+k.length+" direct report"+(k.length===1?"":"s")+": "+(k.map(H).join(", ")||"none")+(ag.length?". Their AI agents: "+ag.map(a=>H(a.name)).join(", "):"")+". Whole team: "+O.size(who)+" people.",steps:["Read the reporting lines","Opened the org chart"]});return true}}
 /* permissions */
 if((m=t.match(/(?:permissions?|access|approval limits?|what can)\s+(?:for|of|does|can)?\s*(.+?)(?:\s+(?:approve|access|do|have))?$/))&&/permission|access|approv|what can/.test(t)){
  const who=findPerson(m[1])||findPerson(t);if(who){const x=O.perms(who);OS.cur=who;go("org_chart");setTimeout(()=>O.openProfile(who,1),150);say(q,{t:"<b>"+H(who)+"</b> holds the <b>"+H(x.role.n)+"</b> role. "+(x.app[0]?"Approvals: "+x.app.slice(0,3).map(a=>H(a.what)+" ("+H(a.limit)+")").join("; ")+".":"No approval authority.")+" I opened the permissions matrix.",steps:["Read the access role, DOA tier and role template"]});return true}}
 /* owns */
 if((m=t.match(/what does (.+?) own/))||(m=t.match(/(?:ownership|owns)\s+(?:of\s+)?(.+)/))){const who=findPerson(m[1]);if(who){const w=O.ownRecs(who);OS.cur=who;go("org_chart");setTimeout(()=>O.openProfile(who,2),150);say(q,{t:"<b>"+H(who)+"</b> owns "+w.metrics.length+" metrics, "+w.procs.length+" processes, "+w.ents.length+" data entities, "+w.svcs.length+" services and "+w.projs.length+" projects, computed from each registry's owner field.",steps:["Resolved owner fields to people","Opened the Owns tab"]});return true}}
 /* controls */
 if((m=t.match(/(?:set|change|put)\s+(.+?)\s+(?:to|at)\s+(suggest|act with approval|act within rules|act)\b/))){const a=findAgent(m[1]);if(a){const lv=m[2]==="suggest"?"suggest":m[2]==="act with approval"?"approval":"act";const ok=O.setAutonomy(a.name,lv);say(q,{t:ok?"<b>"+H(a.name)+"</b> is now set to <b>"+H(O.LVL[lv].n)+"</b>. The change is in the audit trail.":"Act within rules is not available for <b>"+H(a.name)+"</b>: it takes on high-risk work.",steps:["Found the agent","Changed autonomy"]});if(ok&&S.screen==="org_chart")render();return true}}
 if((m=t.match(/\b(pause|stop|kill|restore|resume)\s+(.+)/))){const a=findAgent(m[2]);if(a){const st=/pause/.test(m[1])?"paused":/stop|kill/.test(m[1])?"killed":"running";O.setState(a.name,st);say(q,{t:"<b>"+H(a.name)+"</b> is now <b>"+(st==="running"?"running again":st)+"</b>. Its sponsor, "+H(a.sponsor)+", is notified and the action is audited.",steps:["Found the agent","Used the kill switch for this agent"]});if(S.screen==="org_chart")render();return true}}
 /* stats */
 if(/span of control|headcount|how many (people|agents|layers)|org (stats|size)|capacity returned|hours returned|how much (time|capacity)/.test(t)){const s=O.stats();OS.tab=/span|layers/.test(t)?"report":"chart";go("org_chart");say(q,{t:"Meridian has <b>"+s.heads+" people</b> in <b>"+s.layers+" layers</b> with <b>"+s.mgrs+" managers</b> (average span "+s.avgSpan+", widest "+s.maxSpan+") and <b>"+s.agents+" AI agents</b> under "+s.covered+" sponsors. Agents return <b>"+s.returned+" hours a week</b> to their sponsors; "+s.open+" more hours are on the table in ranked opportunities.",steps:["Counted people, managers and agents","Opened the org chart"]});return true}
 if(/\borg chart\b|\breporting structure\b|\bwho works where\b|\borganization chart\b/.test(t)){OS.tab=/reporting/.test(t)?"report":"chart";go("org_chart");say(q,{t:"Here is the org chart: "+O.stats().heads+" people and "+O.stats().agents+" AI teammates. Use Human, AI or Human + AI to change the view, or ask “who do I go to for month-end close”.",steps:["Opened the org chart"]});return true}
 return false});
/* ---------- Feature Contract wiring: data, map, process, record sets, navigation. Lazy, because the registries load after this file. ---------- */
const W={};
function wire(){
 try{
  if(window.NAVX&&NAVX.add&&!W.nav){NAVX.add("org_chart",{group:"people",label:"Org chart and AI teammates",hint:"Who reports to whom, what each person owns and can approve, and the agents that support them",sub:"Org chart",kw:"org chart reporting structure people agents ai teammates permissions ownership span dotted line matrix agent studio supercharge"});W.nav=true}
  if(!W.ent&&window.ATLAS&&ATLAS.addEntity&&window.COVER&&COVER.recs){
   const R=COVER.recs;const add=(key,label,ent,how,n,path)=>{if(!R.some(r=>r.key===key))R.push({key,label,scr:["org_chart"],mod:"org_chart",n,ent,how,path:path||key})};
   add("ORG_STAFF","Org chart staff (people directory)","person","direct",45,"DIR");add("ORG_UNITS","Teams and organization units","organization_unit","direct",15,"ORG_UNITS");add("ORG_LINES","Dotted-line and matrix reporting lines","reporting_line","new",20,"ORG_LINES");add("ORG_OPPS","Automation opportunities","automation_opportunity","new",90,"ORG_OPPS");add("ORG_AGENTS","AI agents as AI-kind people","person","direct",15,"ORG_AGENTS");
   const fld=(k,label,type,cls,req,au)=>({k,label,type,authority:au||"platform",classification:cls||"internal",req:!!req});
   const defs=[
    {id:"reporting_line",label:"Reporting line",domain:"people",source:"Org chart",ownerApp:"org_chart",ownerMod:"org_chart",status:"proposed",note:"A solid, dotted-line or project-matrix line between two people, with a share of time and a reason. The solid manager stays on Person.",
     fields:[fld("from_person","Reports",""+"ref","personal",1),fld("to_person","Lead","ref","personal",1),fld("line_kind","Line type","enum","internal",1),fld("share_pct","Share of time","percent","internal"),fld("project_ref","Project","ref","internal"),fld("reason","Why the line exists","text","internal"),fld("since","Since","date","internal")],
     decision:"New, thin. Person.manager holds one solid line and organization_unit.parent holds teams; neither can hold a second leader, a project lead or a share of time. The line references person and project by id and copies nothing.",searched:"person, organization_unit, position, allocation, raid_item"},
    {id:"automation_opportunity",label:"Automation opportunity",domain:"plat",source:"Org chart",ownerApp:"org_chart",ownerMod:"org_chart",status:"proposed",note:"A ranked piece of recurring or pending work that an agent could prepare, with hours, risk, data needed and guardrails. Becomes an agent when the sponsor builds it.",
     fields:[fld("person","Person supported","ref","personal",1),fld("task","Task","text","internal",1),fld("source_kind","Found from","enum","internal"),fld("hours_week","Hours a week","number","internal",1),fld("risk","Risk","enum","internal",1),fld("data_needed","Data needed","list","internal"),fld("guardrails","Guardrails","list","internal"),fld("agent","Agent built","ref","internal"),fld("state","State","enum","internal")],
     decision:"New. The closest entities are agent_skill (what an existing agent can do) and resource_request (a request for people). Neither describes work that has not been automated yet, nor its hours or risk. An opportunity becomes a Person of kind AI plus the person extension fields (agent_model, autonomy_tier, kill_switch, agent_scope), so agents themselves are reused.",searched:"agent_skill, resource_request, person, debt_item, demand_request"}];
   const rl=window.CONTRACT&&CONTRACT.decisions?CONTRACT.decisions():[];
   defs.forEach(d=>{let r=null;try{r=ATLAS.addEntity({id:d.id,label:d.label,domain:d.domain,source:d.source,ownerApp:d.ownerApp,ownerMod:d.ownerMod,status:d.status,note:d.note,fields:d.fields})}catch(e){}
    W.dec=W.dec||[];W.dec.push({entity:d.id,decision:d.decision,searched:d.searched,warnings:(r&&r.warnings)||[],dups:(r&&r.duplicates)||[]})});
   O.decisions=W.dec;W.ent=true}
  if(!W.mod&&window.MODMAP&&MODMAP.addModule&&W.ent){
   const r=MODMAP.addModule({id:"org_chart",name:"Org chart and Agent studio",sn:"Org chart",band:"ppl",own:"Joanna Pierce",proposed:false,
    r:["person","organization_unit","position","role","access_review","approval","metric_definition","process_definition","raid_item","skill_claim"],w:["reporting_line","automation_opportunity"],
    flows:[{dir:"pull",other:"ppl_org",data:"People, roles, teams and managers",entity:"person",mode:"api",trig:"Directory change"},
     {dir:"pull",other:"ppl_cap",data:"Positions and planned headcount",entity:"position",mode:"batch",trig:"Nightly"},
     {dir:"pull",other:"adm_sec",data:"Access roles and quarterly access reviews",entity:"role",mode:"api",trig:"Profile opened"},
     {dir:"pull",other:"bud_doa",data:"Delegation of authority tiers and limits",entity:"approval",mode:"api",trig:"Profile opened"},
     {dir:"pull",other:"plat_reg",data:"Metric and process owners",entity:"metric_definition",mode:"api",trig:"Ownership computed"},
     {dir:"pull",other:"ppm_raid",data:"Open risks and issues by owner",entity:"raid_item",mode:"api",trig:"Profile opened"},
     {dir:"push",other:"tower",data:"New agents with sponsor, autonomy and guardrails",entity:"person",mode:"event",trig:"Agent built"},
     {dir:"push",other:"flw_appr",data:"Sponsor and governance approvals for new agents",entity:"approval",mode:"human",trig:"Agent leaves pilot"},
     {dir:"push",other:"adm_audit",data:"Agent builds, autonomy changes and kill-switch uses",entity:"audit_event",mode:"event",trig:"Any agent change"},
     {dir:"push",other:"chat_home",data:"Notifications to sponsors about pilots and pauses",entity:"notification",mode:"event",trig:"Agent paused or pilot ends"}]});
   if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.mod=true;if(r&&r.warnings&&r.warnings.length)O.modWarn=r.warnings}
  if(!W.proc&&window.PROCLIB&&PROCLIB.addProcess&&W.mod){
   const st=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o});
   const r=PROCLIB.addProcess({id:"org_chart",name:"Maintain the org chart and agent roster",module:"org_chart",owner:"Joanna Pierce",backup:"Casey Rowan",trigger:"A hire, move, leave or reporting-line change; a sponsor asks for an agent",std:["togaf","agentic"],
    steps:[st("Approve the staffing change","HR confirms the position, reporting line and any dotted or matrix line. RACI: Responsible HR partner, Accountable Joanna Pierce, Consulted the manager, Informed the CIO.","human","Joanna Pierce","2 days","Staffing change request","Approved position and line"),
     st("Update the directory","The directory, teams and reporting lines are updated; the chart redraws.","auto","Directory sync","Immediate","Approved position and line","Person and reporting_line records"),
     st("Derive permissions and ownership","Access role, DOA tier and owned metrics, processes and entities are proposed from the role and owner fields.","agent","Colette Brandt","1 day","Person and reporting_line records","Proposed access and ownership"),
     st("Rank automation opportunities","The studio ranks recurring and pending work by hours, risk and confidence.","agent","Kenji Watanabe","Weekly","Pending work and recurring tasks","Ranked opportunities"),
     st("Sponsor approves the agent","The sponsor chooses tasks, autonomy, guardrails and the kill switch. RACI: Responsible the sponsor, Accountable the sponsor, Consulted the AI platform lead and security lead, Informed People Operations.","gate","The sponsor","2 days","Ranked opportunities","Agent in pilot"),
     st("Governance review","The AI platform lead reviews the pilot after two weeks and registers the agent in the Control Tower.","gate","Kenji Watanabe","2 weeks","Agent in pilot","Registered agent and audit entry"),
     st("Quarterly attestation","Managers confirm reporting lines, access and ownership.","human","Joanna Pierce","Each quarter","Chart, access and ownership","Attested org chart")],
    inputs:["Staffing change request","Pending work","Recurring tasks"],outputs:["Org chart","Registered agents","Ranked opportunities"],entities:["person","reporting_line","automation_opportunity","organization_unit","role"],metrics:["m_org_cap","m_org_gov","m_org_own","m_org_span","m_org_accept"],model:"cmmi"});
   if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.proc=true;O.procWarn=r&&r.warnings}
 }catch(e){console.error("org wire",e)}
 O.wired=!!(W.nav&&W.ent&&W.mod&&W.proc);
 if(O.wired&&window.MODMAP&&MODMAP.refresh&&!W.ref){W.ref=1;try{MODMAP.refresh()}catch(e){}}
}
O.wire=wire;[700,2200,4500].forEach(ms=>setTimeout(wire,ms));
O.wireState=W;
})();
