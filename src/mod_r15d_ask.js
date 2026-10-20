/* Round 15, Agent D. Ask handles ordinary questions.
   Intents (run before module intents, then fall through): navigate, find a record, what is X, how do I, who owns X, status of X,
   who can approve $N, how many agents are working, first day. Answers are built from live records, link to them, say where they looked,
   and when nothing fits they say so and offer three screens for the current role. No generated prose beyond a one-line fact. */
(function(){
const W=window;const R15D=W.R15D=W.R15D||{};
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=U.esc;
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9$.,\s-]/g," ").replace(/\s+/g," ").trim();
const STOP=/^(the|a|an|of|is|are|to|for|my|me|i|do|does|can|what|who|whom|how|where|which|status|owns|owner|own|about|on|in|at|please|tell|show|find|open|go|take|us|our|current|currently|now|there|this|that|it)$/;
const toks=s=>norm(s).split(" ").filter(w=>w.length>1&&!STOP.test(w));
const link=(t,src,fn)=>({t,src,go:fn});
const sayA=(q,t,steps,items,sugg)=>{const r={t:t,steps:steps||[]};if(items&&items.length)r.cards=[{t:"cites",items:items.slice(0,6)}];if(sugg)r.sugg=sugg;say(q,r);return true};
const money=q=>{const m=q.match(/\$\s?(\d[\d,]*(?:\.\d+)?)\s*(k|m|million|thousand)?/i)||q.match(/\b(\d{1,3}(?:,\d{3})+|\d{4,})\b/);if(!m)return null;let v=parseFloat(m[1].replace(/,/g,""));const u=(m[2]||"").toLowerCase();if(u==="k"||u==="thousand")v*=1e3;if(u==="m"||u==="million")v*=1e6;return v};
const fmt$=n=>"$"+Math.round(n).toLocaleString("en-US");
const pers=()=>PERSONAS[S.persona]||PERSONAS.exec;
const roleSuggest=()=>{const p=pers(),pins=(G(()=>NAVX.persona.pin(),[])||[]).filter(id=>SCREENS.some(s=>s[0]===id));return pins.slice(0,3).map(id=>link(G(()=>NAVX.label(id),id),"Suggested for "+p.n,()=>go(id)))};
const fallback=q=>sayA(q,"I cannot answer that from the records I can read. "+(roleSuggest().length?"Three places to start as "+E(pers().n)+":":"Try searching by a record name or number."),["Searched screens, records, metrics, agents, projects, incidents and knowledge","No record matched every word"],roleSuggest(),["Who owns the Invoice approval process?","Status of INC1","How do I order a laptop?"]);

/* ----- lookups over live records ----- */
function metricByText(q){const t=toks(q);if(!t.length)return null;let best=null,bs=0;Object.keys(METRICS).forEach(id=>{const m=METRICS[id];const h=norm(m.n+" "+id.replace(/^m_/,"").replace(/_/g," "));let s=0;t.forEach(w=>{if(h.indexOf(w)>=0)s++});if(s>bs&&s>=Math.max(1,Math.ceil(t.length*.7))){bs=s;best=id}});return best}
function agentByText(q){const l=norm(q);return G(()=>AGENTS_STATE.rows(),[]).find(a=>l.indexOf(a.name.toLowerCase())>=0||(a.first&&l.indexOf(a.first.toLowerCase()+" ")>=0)||l.indexOf(a.display.toLowerCase())>=0)||null}
function personByText(q){const l=norm(q);return G(()=>DIR.filter(d=>!d.generated).find(d=>l.indexOf(d.name.toLowerCase())>=0),null)}
function incByText(q){const m=q.match(/\b(INC\d+|CHG\d+|PRB\d+|SR\d+|REQ\d+)\b/i);const id=m?m[1].toUpperCase():null;const incs=G(()=>S.itsm.inc,[])||[];
 if(id&&incs.find(i=>i.id===id))return {k:"incident",r:incs.find(i=>i.id===id)};
 const chg=G(()=>S.itsm.chg,[])||[];if(id&&chg.find(i=>i.id===id))return {k:"change",r:chg.find(i=>i.id===id)};
 const t=toks(q);if(t.length){const f=incs.find(i=>t.every(w=>norm(i.t||i.title||"").indexOf(w)>=0));if(f)return {k:"incident",r:f}}return null}
function invByText(q){const m=q.match(/\bINV-?\d+\b/i);const l=norm(q);return G(()=>INVOICES.find(i=>(m&&i.id.toLowerCase()===m[0].toLowerCase().replace(/^inv(\d)/,"inv-$1"))||(l.indexOf(i.vendor.toLowerCase().split(" ")[0])>=0&&/invoice|pay/.test(l))),null)}
function projByText(q){const l=norm(q);return G(()=>PROJ.find(p=>l.indexOf(String(p.n||p.name||"").toLowerCase())>=0||new RegExp("\\b"+String(p.short||p.id||"zz").toLowerCase()+"\\b").test(l)),null)}
function svcByText(q){const t=toks(q);if(!t.length)return null;return G(()=>SVCREG.find(s=>t.every(w=>norm(s.n||s.name).indexOf(w)>=0)),null)}
function articlesFor(q){const t=toks(q).filter(w=>!/^(order|get|new|request|do|start)$/.test(w)||toks(q).length<2);const it=G(()=>KCSX.items(),[]);if(!t.length)return[];return it.map(a=>{const h=norm((a.t||a.title||a.n||"")+" "+(a.kw||""));let s=0;t.forEach(w=>{if(h.indexOf(w)>=0)s++});return {a,s}}).filter(x=>x.s>0&&x.s>=Math.ceil(t.length*.66)).sort((x,y)=>y.s-x.s).slice(0,4).map(x=>x.a)}
function guideFor(q){const l=norm(q);return G(()=>OGX.guides.find(g=>l.indexOf(norm(g.n))>=0||norm(g.n).split(" ").filter(w=>w.length>3).some(w=>l.indexOf(w)>=0)),null)}
function itemFor(q){const l=norm(q);const items=G(()=>SVCX&&SVCX.items&&SVCX.items(),null);return null}
function screensFor(q,n){const t=toks(q);let res=[];try{res=NAVX.search(q,{limit:8}).results||[]}catch(e){}
 return res.slice(0,n||4)}

/* ----- intents ----- */
const INTENTS=[
 /* agents: one answer, same source as the top bar */
 {re:/\b(how many|number of|count of)\b.{0,25}\bagents?\b|\bagents?\b.{0,30}\b(working|running|active|enabled|on shift|idle|paused)\b|\bwhat (are|is) (the )?agents? (doing|status)/,run:q=>{
  const c=AGENTS_STATE.counts();S.r15d.agFilter="working";
  return sayA(q,`<b>${c.working}</b> of <b>${c.registered}</b> registered agents are working at ${AGENTS_STATE.clock()}. ${c.enabled} are enabled, ${c.idle} idle, ${c.paused} paused, ${c.observed} observed only. Working means enabled, on shift and a run in progress this hour.`,["Read the agent registry (the same list the top bar and org chart use)"],[link("Agent registry","Opens the list, filtered to working",()=>go("r15d_agents")),link("Org chart","Sponsors and levels",()=>go("org_chart")),link("AI Control Tower","Gateway view",()=>go("tower"))])}},
 /* delegation: who can approve $N */
 {re:/\b(who|which role|what role)\b.{0,30}\b(approve|sign|authori[sz]e)\b|\bapproval (limit|authority)\b|\bdelegation of authority\b/,run:q=>{
  const amt=money(q);const tiers=(G(()=>S.bud.doa,[])||[]).slice().sort((a,b)=>a.max-b.max);
  const steps=["Read the delegation of authority table ("+tiers.length+" tiers)"].concat(amt!=null?["Parsed the amount "+fmt$(amt)+" from the question"]:["No amount found in the question"]);
  const openDoa=link("Delegation of authority","Open the table",()=>go("bud_doa"));
  if(amt==null)return sayA(q,"Approval limits: "+tiers.map(t=>E(t.role)+" up to "+fmt$(t.max)).join("; ")+". Add an amount to find the approver.",steps,[openDoa]);
  const t=tiers.find(x=>x.max>=amt);
  if(t)return sayA(q,`For <b>${fmt$(amt)}</b> the approver is the <b>${E(t.role)}</b> (tier ${E(t.id)}, up to ${fmt$(t.max)}). Lower tiers cannot approve it.`,steps,[openDoa,link("Invoice approval","Where holds and approvals are decided",()=>go("inv"))]);
  const top=tiers[tiers.length-1];return sayA(q,`<b>${fmt$(amt)}</b> is above the highest tier in the table (${E(top.role)}, up to ${fmt$(top.max)}). The table names no approver above that, so this needs a rule added.`,steps,[openDoa])}},
 /* first day / new hire */
 {re:/\b(first (day|week)|new hire|new here|just (started|joined)|i am new|i'm new|onboard(ing)?\b.*\bme|what should i do (first|today))\b/,run:q=>{
  const g=guideFor("new hire onboarding");return sayA(q,"The first-week view lists your accounts, equipment, training due, who to ask and your buddy. It reads the order guide and the training records.",["Matched your question to the new-hire onboarding guide and process","Checked Training and Order guides for linked items"],[link("My first week","Checklist for this week",()=>go("r15d_firstweek")),link("Order guide: New hire onboarding","What a manager orders for a new person",()=>go("svc_guides")),link("Training and learning","Mandatory courses and due dates",()=>go("ppl_train"))],["Who is my buddy?","How do I order a laptop?"])}},
 /* who owns */
 {re:/\bwho (owns|is the owner of|is responsible for|runs|manages|sponsors)\b|\bowner of\b|\bwho is accountable\b/,run:q=>{
  const steps=["Looked in metrics, agents, services, projects and the ownership register"];
  const a=agentByText(q);if(a)return sayA(q,`<b>${E(a.display)}</b> is sponsored by <b>${E(a.sponsor||"no one recorded")}</b>.`,steps,[link(a.display,"Agent profile",()=>G(()=>ORGX.openAgent(a.name),0)||go("r15d_agents"))]);
  const m=metricByText(q);if(m)return sayA(q,`<b>${E(METRICS[m].n)}</b> is owned by <b>${E(METRICS[m].owner||"no owner recorded")}</b>.`,steps,[link(METRICS[m].n,"Open the metric and its formula",()=>go("metrics",m)),link("Ownership and gaps","Owners and backups",()=>go("own_gaps"))]);
  const s=svcByText(q);if(s)return sayA(q,`<b>${E(s.n||s.name)}</b> is owned by <b>${E(s.owner||"no owner recorded")}</b>${s.processOwner&&s.processOwner!==s.owner?"; process owner "+E(s.processOwner):""}.`,steps,[link("Service portfolio and map","Open the service",()=>go("svc_360"))]);
  const p=projByText(q);if(p)return sayA(q,`<b>${E(p.n||p.name)}</b> is led by <b>${E(p.owner||p.pm||p.sponsor||"no one recorded")}</b>.`,steps,[link("Projects and teams","Open the project",()=>go("ppm_proj"))]);
  const hit=screensFor(q.replace(/who (owns|is the owner of|is responsible for|runs|manages|sponsors)/i,""),3);
  if(hit.length)return sayA(q,"No single owner matched; these are the closest records. Ownership and gaps lists every owner and backup.",steps,hit.map(h=>link(h.title,h.meta||h.type,()=>G(()=>NAVX.open(h),0))).concat([link("Ownership and gaps","Owners and backups",()=>go("own_gaps"))]));
  return fallback(q)}},
 /* status of */
 {re:/\b(status|state|progress|where is|what happened (to|with)|update on|how is|how are)\b/,run:q=>{
  const steps=["Looked in invoices, incidents, changes, projects, agents and metrics"];
  const inv=invByText(q);if(inv)return sayA(q,`<b>${E(inv.id)}</b> from ${E(inv.vendor)}: ${fmt$(inv.amt)}, due ${E(inv.due)}. ${S.dec&&S.dec[inv.id]?"Decision: "+E(S.dec[inv.id])+".":"Recommendation: "+E(inv.rec)+" ("+inv.checks.filter(c=>c[1]==="good").length+" of "+inv.checks.length+" checks pass)."}`,steps,[link(inv.id,"Open the invoice",()=>go("inv",inv.id))]);
  const it=incByText(q);if(it)return sayA(q,`<b>${E(it.r.id)}</b> ${E(it.r.t||it.r.title||"")}: ${E(it.r.st||it.r.status||"status not recorded")}${it.r.sev||it.r.pri?" · "+E(it.r.sev||it.r.pri):""}.`,steps,[link(it.r.id,"Open the "+it.k,()=>go(it.k==="change"?"itsm_chg":"itsm_inc"))]);
  const ag=agentByText(q);if(ag)return sayA(q,`<b>${E(ag.display)}</b>: ${E(AGENTS_STATE.labels[ag.state])}. ${ag.runsHour} runs this hour, ${ag.runsToday} today. Sponsor ${E(ag.sponsor||"not recorded")}.`,steps,[link("Agent registry","Definitions and the full list",()=>go("r15d_agents"))]);
  const p=projByText(q);if(p)return sayA(q,`<b>${E(p.n||p.name)}</b>: ${E(p.status||p.s||"status not recorded")}${p.pct!=null?" · "+p.pct+"% complete":""}.`,steps,[link("Projects and teams","Open",()=>go("ppm_proj"))]);
  const m=metricByText(q);if(m){const x=METRICS[m];return sayA(q,`<b>${E(x.n)}</b> is <b>${E(mfmt(x))}</b> against a target of ${E(mfmt(x,x.tgt))}. Formula: ${E(x.f)}.`,steps.concat(["Metric "+m]),[link(x.n,"Formula, trend and remediation",()=>go("metrics",m))])}
  return false}},
 /* how do I */
 {re:/^(how (do|can|would|should) (i|we)|how to|where (do|can) i|what('| i)?s the (process|steps) (for|to))\b/,run:q=>{
  const steps=["Searched knowledge articles, then order guides, then screens"];const items=[];
  articlesFor(q.replace(/^(how (do|can|would|should) (i|we)|how to)\s*/i,"")).forEach(a=>items.push(link(a.t||a.title||a.id,"Knowledge article "+(a.id||""),()=>G(()=>KCSX.openItem(a.id),0))));
  const g=guideFor(q);if(g)items.push(link("Order guide: "+g.n,"Orders everything in one request",()=>go("svc_guides")));
  const sv=screensFor(q.replace(/^(how (do|can|would|should) (i|we)|how to|where (do|can) i)\s*/i,""),3);sv.forEach(h=>items.push(link(h.title,h.meta||h.type,()=>G(()=>NAVX.open(h),0))));
  if(!items.length)return fallback(q);
  return sayA(q,items.length+" place"+(items.length===1?"":"s")+" to start. Knowledge articles come first, then order guides and screens.",steps,items,["Who owns this?","Status of my requests"])}},
 /* what is X */
 {re:/^(what('| i)?s|what is|what are|define|explain|meaning of)\b/,run:q=>{
  const subj=q.replace(/^(what('| i)?s|what is|what are|define|explain|meaning of)\s+(a |an |the )?/i,"").replace(/[?.!]+$/,"");
  const m=metricByText(subj);if(m){const x=METRICS[m];return sayA(q,`<b>${E(x.n)}</b>: ${E(x.f)}. Now ${E(mfmt(x))}, target ${E(mfmt(x,x.tgt))}, owner ${E(x.owner||"not recorded")}.`,["Read the metric registry (definition, current value, owner)"],[link(x.n,"Formula and remediation",()=>go("metrics",m))])}
  const ag=agentByText(subj);if(ag)return sayA(q,`<b>${E(ag.display)}</b>: ${E(ag.kind)}, sponsored by ${E(ag.sponsor||"not recorded")}, ${E(AGENTS_STATE.labels[ag.state]).toLowerCase()}.`,["Read the agent registry"],[link("Agent registry","Definitions",()=>go("r15d_agents"))]);
  const per=personByText(subj);if(per)return sayA(q,`<b>${E(per.name)}</b>: ${E(per.role||"")}${per.team?", "+E(per.team):""}${per.mgr?". Reports to "+E(per.mgr):""}.`,["Read the people directory"],[link("Org chart","Open",()=>go("org_chart"))]);
  const hits=screensFor(subj,4);if(hits.length)return sayA(q,"These records match <b>"+E(subj)+"</b>.",["Searched screens, records and metrics"],hits.map(h=>link(h.title,h.meta||h.type,()=>G(()=>NAVX.open(h),0))));
  return false}}
];
ASKX.unshift(q=>{
 const raw=String(q||"").trim();if(!raw||/^\s*\//.test(raw))return false;
 for(const it of INTENTS){if(it.re.test(raw.toLowerCase())){let r;try{r=it.run(raw)}catch(e){console.error("ask intent",e);r=false}if(r)return true}}
 return false});
/* a question that no one handled: cannot answer, with suggestions (runs last, only for short questions) */
R15D.askFallback=fallback;R15D.suggestScreens=roleSuggest;
SEARCHX.push(()=>[{g:"Go to",t:"Agent registry",m:"Who is working, idle, paused",c:"--p4",f:()=>go("r15d_agents"),k:"agents working idle enabled registry count status"},{g:"Go to",t:"Facts and conflicts",m:"One registry of shared numbers",c:"--p4",f:()=>go("r15d_facts"),k:"facts single source of truth conflicts units duplicates"}]);
})();
