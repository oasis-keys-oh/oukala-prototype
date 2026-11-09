/* ===== mod_r31_jzorg: org chart with agent assist.
   The organization as the journeys see it: teams, the roles inside them, and the agents and robots recommended for the steps each role does.
   Everything is computed from the journey boxes; every figure is a modeled sample value (a robot frees 80% and an agent 60% of the hours, 140 hours is one FTE a month).
   One proposed teammate stands for one build, counted by the same rule as the Build list (JXR.countBuilds, JM-04). ===== */
(function(){
const W=window,X=W.JYX,R=W.JXR;if(!X||!X.api||!R||!R.av)return;
const A=()=>X.api,E=R.E,fmt=n=>A().fmt(Math.round(n)),f1=n=>A().f1(n);
const FTE_H=A().FTE_H||140;
const EXT=new Set(["Patient","Payer","Vendor","Regulator","Member","Customer IT admin","Referring clinician"]);
const O=R.org={flt:"all"};
/* JM-04: the scope and the teammate count come from JXR (mod_r31_jx), the same rule the Build list uses */
const scopeNow=()=>R.scopeNow();
const orgName=()=>(W.TENANT&&TENANT.name())||(W.SCN&&SCN.list[SCN.cur]&&SCN.list[SCN.cur].n)||"The organization";
const rows2st=rows=>{const c=rows.filter(x=>x.r.st==="cand"),cb=R.countBuilds(c),ag=cb.agents,rb=cb.robots;
 const ra=rows.filter(x=>x.r.st==="running"&&x.r.k==="agent").length,rr=rows.filter(x=>x.r.st==="running"&&x.r.k==="robot").length;
 const hrs=rows.reduce((s,x)=>s+x.hrs,0),freed=c.reduce((s,x)=>s+x.r.save,0);
 return {n:rows.length,hrs,agents:ag,robots:rb,runA:ra,runR:rr,freed,fte:hrs/FTE_H,fteF:freed/FTE_H,pain:rows.filter(x=>x.b.pain&&x.b.em<=2).length,nop:rows.filter(x=>!x.b.procs.length).length}};
function model(){const a=A(),sc=scopeNow();const T=new Map(),OUT={n:"Outside the organization",ext:true,roles:new Map()};
 const hasDetail=R.hasDetail();
 X.JY.list.forEach(j=>{if(!R.inScope(j))return;
  a.allBoxes(j).forEach(({b,s})=>{const r=a.rec(b),hrs=b.min*b.vol/60,ext=EXT.has(b.who);
   const t=ext?OUT:(T.get(b.owner||"Unassigned")||(T.set(b.owner||"Unassigned",{n:b.owner||"Unassigned",roles:new Map()}),T.get(b.owner||"Unassigned")));
   const ro=t.roles.get(b.who)||(t.roles.set(b.who,{p:b.who,rows:[]}),t.roles.get(b.who));ro.rows.push({j,s,b,r,hrs})})});
 const fin=t=>{t.rl=[...t.roles.values()].map(ro=>Object.assign(ro,{st:rows2st(ro.rows)})).sort((p,q)=>q.st.fteF-p.st.fteF||q.st.hrs-p.st.hrs);t.st=rows2st(t.rl.flatMap(x=>x.rows));return t};
 const teams=[...T.values()].map(fin).sort((p,q)=>q.st.fteF-p.st.fteF||q.st.hrs-p.st.hrs);
 if(OUT.roles.size)fin(OUT);
 const staff=teams.flatMap(t=>t.rl.flatMap(r=>r.rows));
 /* effort and FTE are staff only; the teammate count covers every step, inside and outside the organization, exactly as the Build list does */
 const all=rows2st(staff),every=R.countBuilds(staff.concat(OUT.roles.size?OUT.rl.flatMap(r=>r.rows):[]).filter(x=>x.r.st==="cand"));all.agents=every.agents;all.robots=every.robots;
 return {teams,out:OUT.roles.size?OUT:null,all,outSt:OUT.roles.size?OUT.st:null,sc,hasDetail}}
R.orgModel=model;

const grp=(k,cand,run,sz)=>{if(!cand&&!run)return "";const show=Math.min(3,cand+run);let h="";
 for(let i=0;i<show;i++){const on=i<run;h+=R.av(k,(k==="robot"?"Robot":"Agent")+(on?" (automated today, modeled)":" (proposed)"),sz,(on?"":"jav-cand ")+"jav-ov")}
 return `<span class="jo-grp" title="${E(k==="robot"?"Robots":"Agents")}: ${run} automated today (modeled from the process automation level, not live), ${cand} proposed">${h}<b>${run?run+" modeled":""}${run&&cand?" · ":""}${cand?"+"+cand+" proposed":""}</b></span>`};
const crew=(st,sz)=>grp("agent",st.agents,st.runA,sz)+grp("robot",st.robots,st.runR,sz);
const dimmed=st=>{const f=O.flt;return (f==="agent"&&!st.agents)||(f==="robot"&&!st.robots)||(f==="run"&&!(st.runA+st.runR))};
const pct=(st)=>st.hrs?Math.min(100,Math.round(st.freed/st.hrs*100)):0;
const q=s=>encodeURIComponent(s);

function roleCard(t,ro,ext){const st=ro.st;
 return `<button class="jo-role${dimmed(st)?" is-dim":""}" data-pp2-act="jorgn" data-a="${q(t.n)}|${q(ro.p)}" title="${E(ro.p)}: open the steps">
  <span class="jo-rh">${R.av("human",ro.p,34)}<span class="jo-rn"><b>${E(ro.p)}</b><small>${st.n} step${st.n===1?"":"s"} · ${ext?fmt(st.hrs)+" h a month":st.fte.toFixed(1)+" FTE now"}</small></span></span>
  ${st.agents+st.robots+st.runA+st.runR?`<span class="jo-crew">${crew(st,24)}</span>`:`<span class="jo-none small muted">No agent or robot recommended</span>`}
  ${st.freed>0?`<span class="jo-bar" role="img" aria-label="${pct(st)} percent released"><i style="width:${pct(st)}%"></i></span><small class="jo-rel">${ext?fmt(st.freed)+" h a month back":st.fteF.toFixed(1)+" FTE released"} · ${pct(st)}%</small>`:""}</button>`}
function teamCol(t){const st=t.st;
 return `<div class="jo-team${t.ext?" is-ext":""}"><button class="jo-th" data-pp2-act="jorgn" data-a="${q(t.n)}|" title="Open every step this team owns"><span class="jo-tn"><b>${E(t.n)}</b><small>${t.rl.length} role${t.rl.length===1?"":"s"} · ${t.ext?fmt(st.hrs)+" h a month":st.fte.toFixed(1)+" FTE now"}</small></span>
  <span class="jo-tc">${st.agents+st.robots+st.runA+st.runR?crew(st,22):`<small class="muted">No teammates recommended</small>`}</span>${st.freed>0?`<span class="jo-bar"><i style="width:${pct(st)}%"></i></span><small class="jo-rel">${t.ext?fmt(st.freed)+" h a month back":st.fteF.toFixed(1)+" FTE released"} · ${pct(st)}%</small>`:""}</button>
  <div class="jo-roles">${t.rl.map(ro=>roleCard(t,ro,t.ext)).join("")}</div></div>`}


/* Atlantic Systems only: the real org chart (reporting lines, 15 governed agents) with the recommendations drawn on it */
const realOrg=()=>!!(W.SCN&&SCN.cur==="core"&&W.ORGX&&ORGX.chartPane&&ORGX.propFor);
function realChart(){const OS=S.org;OS.tab="chart";OS.outline=OS.outline||false;if(!O.propInit){O.propInit=1;OS.props=true;OS.k=0;try{ORGX.openProp()}catch(e){console.error(e)}setTimeout(()=>{try{ORGX.focusProp()}catch(e){}},300)}
 return `<section class="jo-chart real" aria-label="The organization's chart with recommended agents and robots"><p class="small muted jo-realnote">This is the organization's real chart. Dashed cards are agents and robots recommended from the journey maps, each under the head of the team it would help. Open one for its build summary. Proposed, not built; figures are modeled.</p><div class="jo-jump" role="group" aria-label="Jump to a recommendation">${ORGX.propAll().map(pr=>`<button type="button" class="chip" data-r32-jump="${E(pr.id)}" title="${E(pr.title)} under ${E(pr.head)}">${E(pr.k==="agent"?"Agent":"Robot")}: ${E(pr.title)} <span class="muted">under ${E(pr.head)}</span></button>`).join("")}</div>${ORGX.chartPane()}</section>`}

/* a tenant without a real org chart: the COO at the top, functions below, each with its teams, drawn from the journey owners */
function tenantChart(M,all){const spec=W.TENANT&&TENANT.orgs&&TENANT.orgs[SCN.cur];if(!spec)return null;const info=TENANT.info[SCN.cur]||{},lead=info.lead||{n:"Chief operating officer",t:""};
 const byName=new Map(M.teams.map(t=>[t.n,t]));const used=new Set();
 const fns=spec.fns.map(f=>{const ts=f.teams.map(n=>byName.get(n)).filter(Boolean);ts.forEach(t=>used.add(t.n));return {f,ts}}).filter(x=>x.ts.length);
 const rest=M.teams.filter(t=>!used.has(t.n));if(rest.length)fns.push({f:{n:"Other teams",lead:{n:"To be assigned",t:"Owner not named in the sample"}},ts:rest});
 const stOf=ts=>rows2st(ts.flatMap(t=>t.rl.flatMap(r=>r.rows)));
 return `<section class="jo-chart tenant" aria-label="Org chart of ${E(orgName())} with recommended agents and robots"><p class="small muted jo-realnote">An optional view: the same teams, drawn from the owners of each journey step, grouped under functions that were typed by hand for the sample. People and leaders are fictional samples. Importing an HR org chart is an open decision and is not built.</p>
 <div class="jo-root"><span class="jo-ri">${R.av("human",lead.n,44)}</span><div><b>${E(lead.n)}</b><small>${E(lead.t)} · ${E(orgName())} · ${M.teams.length} teams · ${fmt(all.hrs)} staff hours a month in mapped steps</small></div><span class="jo-crew">${crew(all,28)}</span></div><div class="jo-rail" aria-hidden="true"></div>
 <div class="tscroll"><div class="jo-fns">${fns.map(({f,ts})=>{const st=stOf(ts);return `<div class="jo-fn"><div class="jo-fh"><span class="jo-ri">${R.av("human",f.lead.n,40)}</span><div><b>${E(f.lead.n)}</b><small>${E(f.lead.t)} · ${E(f.n)}</small><small>${ts.length} team${ts.length===1?"":"s"} · ${st.fte.toFixed(1)} FTE now · ${st.fteF.toFixed(1)} FTE released, modeled</small></div><span class="jo-crew">${crew(st,24)}</span></div><div class="jo-fteams">${ts.map(teamCol).join("")}</div></div>`}).join("")}${M.out?`<div class="jo-fn"><div class="jo-fh"><div><b>Outside the organization</b><small>Patients, customers, vendors and others who touch the journey</small></div></div><div class="jo-fteams">${teamCol(M.out)}</div></div>`:""}</div></div></section>`}
/* JM-01: for an industry tenant the org chart is built from the box owners by default: each team is the owning team named on a journey step.
   The hand-typed grouping under functions (TENANT.orgs) is an optional view. Importing an HR org chart is an open decision and is not built. */
const OWNERS_NOTE="Built from the journey maps: each team is the owning team named on a journey step, and each role is the persona doing it. This is the default org chart for an industry tenant. Importing an HR org chart is an open decision and is not built; nothing is imported.";
const hasFns=()=>!!(W.TENANT&&TENANT.orgs&&W.SCN&&TENANT.orgs[SCN.cur]);
function srcSwitch(){if(!hasFns())return "";const s=O.src==="fns"?"fns":"owners";
 return `<div class="jmood jo-ctl jo-src" role="group" aria-label="How the chart is drawn"><span class="small muted">Chart</span><div class="vsw glass" role="group" aria-label="Chart source"><button class="${s==="owners"?"on":""}" data-pp2-act="jorgsrc" data-a="owners" aria-pressed="${s==="owners"}">From step owners</button><button class="${s==="fns"?"on":""}" data-pp2-act="jorgsrc" data-a="fns" aria-pressed="${s==="fns"}">Grouped by sample functions</button></div></div>`}
R.orgSource=()=>realOrg()?"real":(O.src==="fns"&&hasFns())?"functions":"owners";
R.orgView=function(){const a=A(),M=model();const all=M.all,tiles=(l,v,s,c)=>`<div class="jk${c?" t-"+c:""}"><span class="jk-l">${l}</span><b>${v}</b><small>${s}</small></div>`;
 const top=M.teams.filter(t=>t.st.fteF>0).slice(0,4);
 const chip=(id,txt,num)=>`<button class="jmc${O.flt===id?" is-on":""}" data-pp2-act="jorgf" data-a="${id}" aria-pressed="${O.flt===id}">${num!=null?`<b>${num}</b> `:""}${txt}</button>`;
 const o=M.outSt;
 return `<div class="jx-brief" data-role="story"><b>${E(orgName())}</b> as the journeys see it: <b>${M.teams.length} teams</b>, ${M.teams.reduce((s,t)=>s+t.rl.length,0)} roles, about <b>${all.fte.toFixed(1)} FTE</b> of effort in the steps mapped. Recommended: <span class="jx-bt g">${all.agents} agents</span> <span class="jx-bt r">${all.robots} robots</span> releasing about <b>${all.fteF.toFixed(1)} FTE</b> (modeled). ${all.runA+all.runR} step${all.runA+all.runR===1?" is":"s are"} modeled as already automated, from the automation level of the linked process; that is not a live run.</div>
 <div class="jh-kpis">${tiles("Teams",M.teams.length,"that own mapped steps")}${tiles("Effort now",all.fte.toFixed(1)+" FTE","staff, "+fmt(all.hrs)+" hours a month")}${tiles("Agents proposed",all.agents,"one per build, as on the Build list","agent")}${tiles("Robots proposed",all.robots,"one per build, as on the Build list","robot")}${tiles("Capacity released",all.fteF.toFixed(1)+" FTE",pct(all)+"% of staff effort, modeled","good")}${o?tiles("Outside the organization",fmt(o.freed)+" h","a month returned to patients, payers and partners"):""}</div>
 <div class="jmood jo-ctl" role="group" aria-label="Show">${chip("all","Everything")}${chip("agent","Agents",all.agents)}${chip("robot","Robots",all.robots)}${chip("run","Automated today, modeled",all.runA+all.runR)}<span class="jo-sp"></span><span class="small muted">Steps counted</span><div class="vsw glass" role="group" aria-label="Journeys counted"><button class="${M.sc==="detail"?"on":""}" data-pp2-act="jorgs" data-a="detail" aria-pressed="${M.sc==="detail"}">Detailed journeys</button><button class="${M.sc==="all"?"on":""}" data-pp2-act="jorgs" data-a="all" aria-pressed="${M.sc==="all"}">All journeys</button></div></div>
 ${top.length?`<div class="jo-start"><span class="jk-l">Where to start</span>${top.map((t,i)=>`<button class="pp2-lnk" data-pp2-act="jorgn" data-a="${q(t.n)}|"><b>${i+1}. ${E(t.n)}</b> <span class="small muted">${t.st.fteF.toFixed(1)} FTE, ${t.st.agents} agents, ${t.st.robots} robots</span></button>`).join("")}</div>`:""}
 ${realOrg()?realChart():`${srcSwitch()}${(O.src==="fns"&&tenantChart(M,all))||`<section class="jo-chart owners" aria-label="Org chart with recommended agents and robots, built from the owners of each journey step"><p class="small muted jo-realnote">${OWNERS_NOTE}</p><div class="jo-root"><span class="jo-ri">${R.av("human",orgName(),44)}</span><div><b>${E(orgName())}</b><small>${M.teams.length} teams · ${fmt(all.hrs)} staff hours a month in mapped steps</small></div><span class="jo-crew">${crew(all,28)}</span></div><div class="jo-rail" aria-hidden="true"></div>
 <div class="tscroll"><div class="jo-teams">${M.teams.map(teamCol).join("")}${M.out?teamCol(M.out):""}</div></div></section>`}`}
 <div class="jfl jo-leg"><span>${R.av("human","Person",20)} A role, with the effort it carries</span><span>${R.av("agent","Agent",20)} Agent: reasons and decides inside limits</span><span>${R.av("robot","Robot",20)} Robot: rules, no model cost</span><span>${R.av("agent","Proposed",20,"jav-cand")} Dashed ring: proposed, not built</span></div>
 <p class="muted small jhint">${M.sc==="detail"&&M.hasDetail?"The end-to-end journey summarizes work the detailed journeys already cover, so it is left out to avoid counting the same effort twice. Switch to All journeys to include it. ":"Where two journeys cover the same work it is counted in both. "}One proposed teammate stands for one build, counted the same way as the Build list: recommended steps of the same kind that share a process are one build, and a build that serves two teams shows under both. Modeled: a robot frees 80% and an agent 60% of the hours, ${FTE_H} hours is one FTE a month, ${E(R.capNote().replace(/^Each/,"each").replace(/, modeled$/,""))}, and patient or partner time is shown in hours and never priced. Teams are the owning team named on each step; the sample organization is fictional.</p>
 ${W.SCN&&SCN.cur==="core"?`<div class="row" style="margin-top:8px"><button class="btn quiet" data-go="org_chart">Open the full org chart with the 15 governed agents</button></div>`:""}`};

R.orgDrawer=function(tn,pn){const a=A(),M=model();const all=M.teams.concat(M.out?[M.out]:[]);const t=all.find(x=>x.n===tn);if(!t)return;
 const ro=pn?t.rl.find(x=>x.p===pn):null;const rows=(ro?ro.rows:t.rl.flatMap(x=>x.rows)).slice().sort((p,q2)=>q2.hrs-p.hrs);const st=ro?ro.st:t.st;
 const tile=(l,v,s)=>`<div class="jd-tile"><span>${l}</span><b>${v}</b>${s?`<small>${s}</small>`:""}</div>`;const ext=t.ext;
 openDrawer(`<div class="jd"><div class="eyebrow">${E(t.n)}${ro?" · role":""}</div><h2 class="jd-t">${E(ro?ro.p:t.n)}</h2>
 <div class="jd-crew">${ro?R.av("human",ro.p,38):""}${crew(st,30)||`<span class="small muted">No agent or robot recommended</span>`}</div>
 <div class="jd-tiles">${tile("Steps",st.n,ro?"in this role":"in this team")}${tile(ext?"Hours a month":"Effort now",ext?fmt(st.hrs):st.fte.toFixed(1)+" FTE",ext?"their time, not priced":fmt(st.hrs)+" hours a month")}${tile(ext?"Hours back":"Released",ext?fmt(st.freed):st.fteF.toFixed(1)+" FTE",pct(st)+"% if every candidate is built")}</div>
 <p class="small muted">${st.agents} agent${st.agents===1?"":"s"} and ${st.robots} robot${st.robots===1?"":"s"} proposed; ${st.runA+st.runR} modeled as already automated (from the process automation level, not live). ${st.pain} painful step${st.pain===1?"":"s"}, ${st.nop} with no process. Modeled.</p>
 <h3 class="jd-h">${ro?"Steps":"Steps by role"}</h3><div class="jo-steps">${rows.map(x=>`<button class="jo-step" data-pp2-act="jgo" data-a="${x.j.id}|${x.b.id}"><span class="jo-sa">${x.r.k==="people"?R.av("human",x.b.who,26):R.av(x.r.k,R.dwName(x.b,x.r.k)+(x.r.st==="cand"?" (proposed)":" (automated today, modeled)"),26,x.r.st==="cand"?"jav-cand":"")}</span><span class="jo-sb"><span>${R.tnChip(x.j,x.b)} <b>${E(x.b.t)}</b></span><small>${ro?"":E(x.b.who)+" · "}${E(R.jshort(x.j))} · ${fmt(x.hrs)} h a month · ${E(a.recLabel(x.r))}${x.r.st==="cand"?", frees about "+fmt(x.r.save)+" h":""}</small></span></button>`).join("")}</div>
 <div class="row" style="margin-top:12px"><button class="btn primary" data-pp2-act="jov" data-a="">Open the overlay</button></div></div>`)};

const refresh=()=>{try{if(S.screen==="ppl_jrny")A().paneRefresh();else render()}catch(e){}};
const ACT=A().ACT;if(ACT){ACT.jorgf=t=>{O.flt=t.dataset.a;refresh()};ACT.jorgs=t=>{R.scope.sel=t.dataset.a;refresh()};ACT.jorgsrc=t=>{O.src=t.dataset.a==="fns"?"fns":null;refresh()};
 ACT.jorgn=t=>{const [x,y]=t.dataset.a.split("|");R.orgDrawer(decodeURIComponent(x),decodeURIComponent(y||""))}}
/* the same view as its own screen, reachable from the executive menu and search */
try{if(typeof REG==="function"){
 const screen=()=>`<div class="screen">${hero("Operations and strategy","Org chart with agent assist","Where agents and robots would take work off each team, drawn on the organization the journeys describe. A COO's view of capacity and where to start.",`<div class="row"><button class="btn" data-go="ppl_jrny">Journey maps and demo scenarios</button><button class="btn quiet" data-go="orgdesign">Agent Action</button></div>`)}${R.orgView()}</div>`;
 REG("orgassist","Org chart with agent assist","people","M12 3h-3v5h3M9 5.5H5v4M15 5.5h4v4M5 14h3v5H5zM16 14h3v5h-3zM10.5 14h3v5h-3zM12 8v3M6.5 11h11v3",screen);
 try{NAVX.add("orgassist",{group:"strat",label:"Org chart with agent assist",hint:"The org chart with the agents and robots recommended for each team",sub:"Org, work and change",kw:"org chart agent assist agents robots recommended digital workforce fte capacity released teams roles coo headcount"})}catch(e){}}}catch(e){console.error("org assist",e)}
})();
