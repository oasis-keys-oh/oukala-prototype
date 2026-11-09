/* ===== mod_s_tenant_screens: screen adapters that move existing read-only screens to DATA (CL-55, DC-11, DC-22, DC-23, CL-57, JM-07).
   CSS prefix stn-. No owning module is edited: an adapter wraps the screen's registered renderer. Under Atlantic Systems (core) the owning
   module renders exactly as before; under any other tenant the adapter renders the same screen, with the same purpose and the tab
   names the Showroom tours click, from DATA.get only, in the tenant's vocabulary (DATA.term). Registered as mode "data" in the
   tenant-aware screen registry, so the "not tenant-aware yet" label no longer applies to them.
   The wrapper is re-applied lazily (beforeGo, tenantChange, timers) because modules that load later may register the same id again.
   Every figure comes from a fictional tenant pack: sample data, simulated or modeled as labeled. Tenant isolation is simulated (R52). ===== */
(function(){
const W=window,D=document,DT=W.DATA,X=W.STN;if(!DT||!X||!X.head)return;
const {E,G,T,n0,money,head,gap,table,own,good,mst,unit,krProg,labPill}=X;
S.stn=S.stn||{tab:{}};

/* ---------- adapter registry ---------- */
const AD={};
function adapt(id,o){AD[id]=o;DT.screen(id,{mode:"data",entities:o.entities,note:"Adapter in mod_s_tenant_screens: Atlantic Systems renders the owning module; other tenants render from DATA",adapter:"mod_s_tenant_screens"})}
function wrap(id){if(typeof _R==="undefined")return;const cur=_R[id];if(typeof cur!=="function"||cur.__stn)return;
 const f=function(){if(DT.tenant()==="core")return cur.apply(this,arguments);
  try{return AD[id].render()}catch(e){console.error("stn adapter "+id,e);return `<div class="screen stn">${empty("This view could not be drawn for this tenant","The error is in the console. No other tenant's data is shown in its place.")}</div>`}};
 f.__stn=1;f.__orig=cur;_R[id]=f}
const ensure=()=>Object.keys(AD).forEach(wrap);
X.adapters=()=>Object.keys(AD);

/* ---------- small helpers ---------- */
const info=()=>DT.tenantInfo(DT.tenant())||{};
const tabs=(id,labels,panes)=>{const cur=Math.min(n0(S.stn.tab[id]),labels.length-1);
 return `<div class="stn-tabs" role="tablist" aria-label="Views">${labels.map((l,i)=>`<button type="button" role="tab" class="chip" aria-selected="${i===cur}" aria-pressed="${i===cur}" data-stn-tab="${E(id)}|${i}">${E(l)}</button>`).join("")}</div><div role="tabpanel" class="stn-pane">${panes[cur]()}</div>`};
const bar=(p,cls)=>`<span class="stn-bar" role="img" aria-label="${Math.round(p*100)} percent"><i class="${cls||""}" style="width:${Math.round(U.clamp(p,0,1)*100)}%"></i></span>`;
const hpill=h=>pill(h==="good"?"On track":h==="bad"?"Off track":"Watch",h==="good"?"good":h==="bad"?"bad":"warn");
const objName=id=>(DT.byId("objectives",id)||{}).n||"";
const projOf=oid=>DT.get("projects").filter(p=>p.obj===oid);
const linesOf=pid=>DT.get("budget_lines").filter(l=>l.p===pid);
const invOf=lid=>DT.get("invoices").filter(v=>v.line===lid);
const krsOf=oid=>DT.get("key_results").filter(k=>k.o===oid);
const matOf=pid=>DT.get("maturity").find(m=>m.process===pid)||null;
const metricOf=id=>DT.byId("metrics",id);
const DIMS=[["defined","Defined"],["owned","Owned"],["measured","Measured"],["integrated","Integrated"],["automated","Automated"],["governed","Governed"]];
const LVN=["","Initial","Managed","Defined","Quantitatively managed","Optimizing"];
const stepsOf=p=>{if(p.steps)return p.steps.map(s=>({n:s[0],kind:STEPMODE.of(s[1])}));const w=p.wf&&DT.byId("workflows",p.wf);
 return w?(w.steps||[]).map(s=>({n:s.n||s.name||"",kind:s.type==="wait"?"human":STEPMODE.of(s.type)})):[]};
const sumBy=(a,k)=>a.reduce((s,r)=>s+n0(r[k]),0);
const objStatus=o=>{const ks=krsOf(o.id);if(!ks.length)return{p:0,n:0};return{p:ks.reduce((s,k)=>s+krProg(k),0)/ks.length,n:ks.length}};
const vchip=(id,label)=>`<button type="button" class="chip" data-go="${E(id)}">${E(label)}</button>`;

/* ---------- metrics: every number is a defined metric (R25) ---------- */
adapt("metrics",{entities:["metrics","key_results","processes"],render:()=>{
 const M=DT.get("metrics"),K=DT.get("key_results"),P=DT.get("processes");const on=M.filter(good).length;
 const uses=m=>K.filter(k=>k.metric===m.id).map(k=>"Key result: "+k.n).concat(P.filter(p=>(p.metrics||[]).includes(m.id)).map(p=>"Process: "+p.n));
 return `<div class="screen stn">${head("Metrics","Every number has an owner, a formula and a target",`The measures ${E(info().org||"")} runs on, each with an accountable owner and a different named backup, a formula, a baseline, a target and what to do when it is off target. Values are sample figures (simulated).`)}
 ${tiles([TL("Metrics",M.length,"Sample count","mute"),TL("On target",on,M.length?Math.round(on/M.length*100)+"% of metrics, simulated":"Gap recorded",on===M.length?"good":"warn"),TL("Off target",M.length-on,"Each has a remediation","mute"),TL("Without a backup",M.filter(m=>!m.backup||m.backup===m.owner).length,"Owner and backup must differ (R12)","mute")])}
 ${card("Metric definitions",M.length+" in this tenant",M.length?table(["Metric","Formula","Baseline","Current","Target","Status","Owner and backup","When off target","Used by","Source"],M.map(m=>[`<b>${E(m.n)}</b>`,E(m.f||""),m.base!=null?unit(m.base,m.u):"",unit(m.cur,m.u),(m.dir==="min"?"at most ":"at least ")+unit(m.tgt,m.u),mst(m),own(m.owner,m.backup,"metric:"+m.id),E(m.rem||""),uses(m).map(E).join("<br>")||`<span class="muted">Not linked yet</span>`,labPill(m.label)])):gap("metrics"))}</div>`}});

/* ---------- exe_strat: strategy alignment ---------- */
adapt("exe_strat",{entities:["objectives","key_results","projects","demand","pillars"],render:()=>{
 const O=DT.get("objectives"),P=DT.get("projects");const tot=sumBy(P,"bac"),linked=sumBy(P.filter(p=>p.obj&&O.some(o=>o.id===p.obj)),"bac");
 const gaps=O.filter(o=>!projOf(o.id).length),orph=P.filter(p=>!p.obj||!O.some(o=>o.id===p.obj));const score=tot?linked/tot*100:0;
 const onTrack=O.filter(o=>objStatus(o).p>=.5).length;
 const objCard=o=>{const st=objStatus(o),ks=krsOf(o.id),ps=projOf(o.id);return `<section class="card glass stn-obj"><div class="cardhead"><div><h3>${E(o.n)}</h3><span class="muted small">${E(o.story||"")}</span></div>${own(o.owner,o.backup,"objective:"+o.id)}</div>
  ${ks.length?ks.map(k=>`<div class="stn-kr"><span>${E(k.n)}</span>${bar(krProg(k),krProg(k)>=.5?"good":"warn")}<span class="num">${unit(k.cur,k.u)} toward ${unit(k.tgt,k.u)}</span></div>`).join(""):empty("No key results yet","Add one so progress can be measured.")}
  <p class="muted small">${Math.round(st.p*100)}% of the way on ${st.n} key result${st.n===1?"":"s"} (simulated). Funded work: ${ps.length?ps.map(p=>E(p.n)+" ("+money(p.bac)+")").join(", "):"none"}.</p></section>`};
 return `<div class="screen stn">${head("Strategy alignment","Is the money pointed at the strategy?",`The alignment score is <b>${Math.round(score)}</b> of 100. <b>${O.length-gaps.length} of ${O.length}</b> objectives have funded work${gaps.length?"; "+E(gaps[0].n)+" has none":""}. ${onTrack} of ${O.length} objectives are at least halfway on their key results.`)}
 ${tiles([TL("Alignment score",String(Math.round(score)),"Funded dollars linked to an objective, modeled",score>=90?"good":"warn"),TL("Funded dollars linked",money(linked),"of "+money(tot)+" approved, simulated","mute"),TL("Objectives with no funded work",gaps.length,gaps.length?E(gaps[0].sub||gaps[0].n):"None",gaps.length?"bad":"good"),TL("Funded work with no objective",orph.length,orph.length?money(sumBy(orph,"bac"))+" at stake":"None",orph.length?"warn":"good")])}
 ${tabs("exe_strat",["Objectives and key results","Coverage gaps","Strategy pillars"],[
  ()=>O.length?`<div class="grid g2 stn-two">${O.map(objCard).join("")}</div>`:gap("objectives"),
  ()=>card("Coverage gaps","Objectives without funded work, and funded work without an objective",(gaps.length||orph.length)?table(["Gap","Kind","Owner and backup"],gaps.map(o=>[E(o.n),"Objective with no funded work",own(o.owner,o.backup,"objective:"+o.id)]).concat(orph.map(p=>[E(p.n),"Funded work with no objective",own(p.owner,p.backup,"project:"+p.id)]))):empty("No coverage gaps","Every objective has funded work and every project serves an objective.")),
  ()=>{const PL=DT.get("pillars");return card("Strategy pillars",PL.length+" pillars",PL.length?table(["Pillar","What it means","Objective"],PL.map(p=>[`<b>${E(p.n)}</b>`,E(p.d||""),E(objName(p.obj))])):gap("pillars"))}])}</div>`}});

/* the dollar trace: objective, project, budget line, invoices (shared by strat_exec and bst) */
const recPill=x=>pill(x.rec==="pay"?"Pay":x.rec==="hold"?"Hold":"Review",x.rec==="pay"?"good":x.rec==="hold"?"bad":"warn");
const lineRow=l=>{const v=n0(l.fcst)-n0(l.appr);return[`<b>${E(l.n)}</b><small class="muted"> ${E(l.id)}${l.why?" · "+E(l.why):""}</small>`,U.moneyShort(l.appr),U.moneyShort(l.act),U.moneyShort(l.fcst),v>0?pill("+"+U.moneyShort(v),"bad"):pill(U.moneyShort(v),"good"),invOf(l.id).map(x=>`<div>${E(x.id)} ${E(x.vendor)} ${U.moneyShort(x.amt)} ${recPill(x)}</div>`).join("")||`<span class="muted">None</span>`,own(l.own,l.bk,"budget_line:"+l.id)]};
const LINECOLS=["Budget line","Approved","Spent","Forecast","Variance","Invoices","Owner and backup"];
const traceCards=O=>O.map(o=>card(E(o.n),"Objective owner and backup: "+E(o.owner||"")+", "+E(o.backup||""),projOf(o.id).map(p=>`<div class="stn-trace"><h4>${E(p.n)} ${hpill(p.health)}</h4>${table(LINECOLS,linesOf(p.id).map(lineRow))}</div>`).join("")||empty("No funded work","This objective has no project yet."))).join("");

/* ---------- strat_exec: strategy to execution (pillar, objective, key result, project, process) ---------- */
adapt("strat_exec",{entities:["pillars","objectives","key_results","projects","processes","metrics","budget_lines","invoices"],render:()=>{
 const O=DT.get("objectives"),PL=DT.get("pillars"),PR=DT.get("processes");
 const procsFor=o=>{const ms=new Set(krsOf(o.id).map(k=>k.metric).concat(DT.get("metrics").filter(m=>m.obj===o.id).map(m=>m.id)));return PR.filter(p=>(p.metrics||[]).some(m=>ms.has(m)))};
 const rows=O.map(o=>[E((PL.find(p=>p.obj===o.id)||{}).n||""),`<b>${E(o.n)}</b>`,krsOf(o.id).map(k=>`<div>${E(k.n)} <span class="muted">${Math.round(krProg(k)*100)}%</span></div>`).join(""),projOf(o.id).map(p=>`<div>${E(p.n)} ${hpill(p.health)}</div>`).join("")||`<span class="muted">No funded work</span>`,procsFor(o).map(p=>`<div>${E(p.n)}</div>`).join("")||`<span class="muted">None linked</span>`]);
 return `<div class="screen stn">${head("Strategy to execution","Every goal traces to the work and the process that delivers it",`From each strategy pillar to its objective, the key results that measure it, the projects that fund it and the processes whose metrics move it, then every dollar from the objective to the invoice. Read only from ${E(info().short||"")} records.`)}
 ${tiles([TL("Pillars",PL.length,"Strategy skeleton, sample","mute"),TL("Objectives",O.length,"Each with an owner and a backup","mute"),TL("Key results",DT.get("key_results").length,"Measured against a metric","mute"),TL("Projects linked",DT.get("projects").filter(p=>p.obj).length,"of "+DT.get("projects").length+" projects","mute")])}
 ${card("The cascade",O.length+" objectives",O.length?table(["Pillar","Objective","Key results","Projects","Processes"],rows):gap("objectives"))}
 ${O.length?`<h2 class="stn-h2">Follow the dollar to the goal</h2>`+traceCards(O):""}</div>`}});

/* ---------- port: portfolio, capacity against demand ---------- */
adapt("port",{entities:["projects","demand","objectives"],render:()=>{
 const P=DT.get("projects"),Dm=DT.get("demand").slice(),fund=n0(info().fund);
 const sc=d=>Math.round((n0(d.strat)*2+n0(d.urg)+Math.min(5,n0(d.ben)/Math.max(1,n0(d.cost))*2)-n0(d.risk))*10)/10;
 Dm.sort((a,b)=>sc(b)-sc(a));let run=0;const ranked=Dm.map(d=>{run+=n0(d.cost);return{d,s:sc(d),cum:run,in:run<=fund}});
 const funded=ranked.filter(r=>r.in);
 return `<div class="screen stn">${head("Portfolio","What we are doing, and what we could fund next",`${P.length} projects in flight and ${Dm.length} ${E(T("request",{many:true}))} for new work, ranked against the funding available (${money(fund)}, modeled).`)}
 ${tiles([TL("Projects in flight",P.length,"Sample count","mute"),TL("Approved budget",money(sumBy(P,"bac")),"Simulated","mute"),TL("New work above the funding line",funded.length+" of "+Dm.length,money(sumBy(funded.map(r=>r.d),"cost"))+" of "+money(fund)+", modeled","mute"),TL("Off track",P.filter(p=>p.health==="bad").length,"Health from the pack, simulated",P.some(p=>p.health==="bad")?"bad":"good")])}
 ${tabs("port",["Portfolio","Capacity vs demand"],[
  ()=>card("Projects",P.length+" in flight",P.length?table(["Project","Objective","Health","Earned","Approved","Owner and backup"],P.map(p=>[`<b>${E(p.n)}</b><small class="muted"> ${E(p.story||"")}</small>`,E(objName(p.obj)),hpill(p.health),bar(n0(p.pct)/100)+` <span class="num">${n0(p.pct)}%</span>`,money(p.bac),own(p.owner,p.backup,"project:"+p.id)])):gap("projects")),
  ()=>card("Capacity vs demand","Ranked by modeled value: strategic fit, urgency and benefit for cost, less risk. The line is the funding available.",ranked.length?table(["Rank",T("request",{cap:true}),"Objective","Cost","Benefit","Score","Funding","Sponsor and backup"],ranked.map((r,i)=>[String(i+1),`<b>${E(r.d.n)}</b><small class="muted"> ${E(r.d.why||"")}</small>`,E(objName(r.d.obj)),money(r.d.cost),money(r.d.ben),String(r.s),r.in?pill("Above the line","good"):pill("Below the line","warn"),own(r.d.sp,r.d.bk,"demand:"+r.d.id)]))+`<p class="muted small">Scores and the funding line are modeled from the pack's sample figures. Money in thousands is shown as dollars.</p>`:gap("demand"))])}</div>`}});

/* ---------- bst: budget and spend traceability ---------- */
adapt("bst",{entities:["objectives","projects","budget_lines","invoices"],render:()=>{
 const O=DT.get("objectives"),P=DT.get("projects"),B=DT.get("budget_lines"),I=DT.get("invoices");
 const appr=sumBy(B,"appr"),comm=sumBy(B,"comm"),act=sumBy(B,"act"),fc=sumBy(B,"fcst"),over=B.filter(l=>n0(l.fcst)>n0(l.appr));
 return `<div class="screen stn">${head("Budget and spend traceability","Follow the dollar to the goal",`Every invoice belongs to a budget line, every line to a project, and every project to an objective. ${over.length} budget line${over.length===1?" is":"s are"} forecast over approved (simulated).`)}
 ${tiles([TL("Approved",U.moneyShort(appr),"Simulated","mute"),TL("Committed",U.moneyShort(comm),Math.round(appr?comm/appr*100:0)+"% of approved","mute"),TL("Spent to date",U.moneyShort(act),"Simulated","mute"),TL("Forecast variance",(fc-appr>0?"+":"")+U.moneyShort(fc-appr),over.length+" lines over",fc>appr?"bad":"good")])}
 ${tabs("bst",["By objective","By budget line"],[
  ()=>card("By objective","Approved, spent and forecast per objective",O.length?table(["Objective","Projects","Approved","Spent","Forecast","Invoices on hold"],O.map(o=>{const ps=projOf(o.id),ls=B.filter(l=>ps.some(p=>p.id===l.p));return[`<b>${E(o.n)}</b>`,String(ps.length),U.moneyShort(sumBy(ls,"appr")),U.moneyShort(sumBy(ls,"act")),U.moneyShort(sumBy(ls,"fcst")),String(I.filter(v=>ps.some(p=>p.id===v.p)&&v.rec==="hold").length)]})):gap("objectives")),
  ()=>card("By budget line",B.length+" lines, sorted by forecast variance",B.length?table(["Project"].concat(LINECOLS),B.slice().sort((a,b)=>(n0(b.fcst)-n0(b.appr))-(n0(a.fcst)-n0(a.appr))).map(l=>[E((DT.byId("projects",l.p)||{}).short||l.p)].concat(lineRow(l)))):gap("budget_lines"))])}
 <p class="muted small">Trace detail (the family view) follows every dollar from the objective to the invoice.</p></div>`}});

/* ---------- exe_dash: one dashboard per role, the same underlying numbers ---------- */
adapt("exe_dash",{entities:["workload","value_chain","metrics","people","projects","budget_lines","invoices","objectives","key_results"],render:()=>{
 const WL=DT.get("workload"),VC=DT.get("value_chain"),M=DT.get("metrics"),PE=DT.get("people"),P=DT.get("projects"),B=DT.get("budget_lines"),I=DT.get("invoices"),O=DT.get("objectives");
 const avg=WL.length?Math.round(sumBy(WL,"pct")/WL.length):0,hot=WL.filter(w=>n0(w.pct)>100),aug=Math.round(sumBy(WL,"aug")),outside=VC.filter(s=>!s.in);
 const agents=PE.filter(p=>p.kind==="agent"),robots=PE.filter(p=>p.kind==="robot"),off=M.filter(m=>!good(m));
 const coo=()=>`${tiles([TL("Average workload",avg+"%",hot.length+" of "+WL.length+" leaders above 100%, modeled",hot.length?"warn":"good"),TL("Value chain steps outside a system",outside.length+" of "+VC.length,E(VC[0]?VC[0].flow:"")+", modeled",outside.length?"warn":"good"),TL("Hours a week an agent could take",String(aug),"Modeled from the time each leader logs","mute"),TL("Agents and robots",agents.length+" and "+robots.length,"Each with a human sponsor; suggest mode, simulated","mute")])}
  ${card(E(VC[0]?VC[0].flow:"Value chain"),"Where the work runs today, and the bridge for the steps outside a system (modeled)",VC.length?table(["Step","Who","Minutes","Today","Bridge"],VC.map(s=>[`<b>${E(s.n)}</b>`,E(s.who||""),String(n0(s.min)),s.in?pill("In a system","good"):pill("Outside a system","warn")+`<small class="muted"> ${E(s.note||"")}</small>`,s.in?`<span class="muted">${E(s.note||"")}</span>`:E(s.bridge||"")])):gap("value_chain"))}
  ${card("Metrics off target",off.length+" of "+M.length,off.length?table(["Metric","Current","Target","Owner and backup"],off.map(m=>[`<b>${E(m.n)}</b>`,unit(m.cur,m.u),unit(m.tgt,m.u),own(m.owner,m.backup,"metric:"+m.id)])):empty("Every metric is on target","Simulated values."))}
  ${card("Workload",WL.length+" leaders. Hours a week logged against capacity, and the hours an agent could plausibly take (modeled, working defaults)",WL.length?table(["Leader","Unit","Workload","Reporting","Meetings","Approvals","Operations","Agent could take"],WL.map(w=>[`<b>${E(w.n)}</b><small class="muted"> ${E(w.role||"")}</small>`,E(w.unit||""),bar(n0(w.pct)/150,n0(w.pct)>100?"warn":"good")+` <span class="num">${n0(w.pct)}%</span>`,String(w.rep),String(w.mtg),String(w.apr),String(w.ops),String(w.aug)+" h"])):gap("workload"))}`;
 const cfo=()=>{const appr=sumBy(B,"appr"),fc=sumBy(B,"fcst"),hold=I.filter(v=>v.rec!=="pay");return `${tiles([TL("Approved budget",U.moneyShort(appr),"Simulated","mute"),TL("Forecast",U.moneyShort(fc),(fc>appr?"+":"")+U.moneyShort(fc-appr)+" against approved",fc>appr?"bad":"good"),TL("Invoices to hold or review",hold.length,U.moneyShort(sumBy(hold,"amt"))+", simulated",hold.length?"warn":"good"),TL("Projects off track",P.filter(p=>p.health==="bad").length,"of "+P.length,"mute")])}
  ${card("Invoices to hold or review",hold.length+" of "+I.length,hold.length?table(["Invoice",T("supplier",{cap:true}),"Amount","Why","Owner and backup"],hold.map(v=>[E(v.id),E(v.vendor),U.money(v.amt),E(v.story||""),own(v.own,v.bk,"invoice:"+v.id)])):empty("Nothing to hold","Every invoice matches its order."))}`};
 const ceo=()=>card("Objectives",O.length+" objectives",O.length?table(["Objective","Progress on key results","Owner and backup"],O.map(o=>{const s=objStatus(o);return[`<b>${E(o.n)}</b>`,bar(s.p)+` <span class="num">${Math.round(s.p*100)}%</span>`,own(o.owner,o.backup,"objective:"+o.id)]})):gap("objectives"));
 return `<div class="screen stn">${head("Executive dashboard","One dashboard per role, the same underlying numbers",`${E(info().story||"")} Each view reads the same ${E(info().short||"")} records; nothing is copied.`)}
 ${tabs("exe_dash",["COO","CFO","CEO"],[coo,cfo,ceo])}</div>`}});

/* ---------- exe_mat: process maturity against target (R26: six dimensions, shared scale) ---------- */
const matTable=PR=>table(["Process","Level","Target"].concat(DIMS.map(d=>d[1])).concat(["Owner and backup"]),PR.map(p=>{const m=matOf(p.id);if(!m)return[`<b>${E(p.n)}</b>`,`<span class="muted">No maturity record</span>`,"","","","","","","",own(p.owner,p.backup,"process:"+p.id)];
 return[`<b>${E(p.n)}</b><small class="muted"> ${E(p.id)}</small>`,`<span class="num">${m.level}</span> <small class="muted">${E(LVN[m.level]||"")}</small>`,String(m.target)].concat(DIMS.map(([k])=>`<span class="stn-lv stn-lv${m.dims[k]}${m.dims[k]<m.target?" stn-low":""}" title="${E(k)}: level ${m.dims[k]} of 5">${m.dims[k]}</span>`)).concat([own(p.owner,p.backup,"process:"+p.id)])}));
adapt("exe_mat",{entities:["processes","maturity"],render:()=>{
 const PR=DT.get("processes"),MT=DT.get("maturity");const met=MT.filter(m=>m.level>=m.target).length,avg=MT.length?Math.round(sumBy(MT,"level")/MT.length*10)/10:0;
 const weakest=DIMS.map(([k,l])=>({l,v:MT.length?sumBy(MT.map(m=>({v:m.dims[k]})),"v")/MT.length:0})).sort((a,b)=>a.v-b.v)[0];
 return `<div class="screen stn">${head("Maturity models","Maturity today against target",`Each process has a maturity record on the shared process capability scale (CMMI style, levels 1 to 5) with six dimensions and a target. The process level is the lowest of its six dimensions. Assessments are sample data (simulated).`)}
 ${tiles([TL("Processes assessed",MT.length+" of "+PR.length,"Simulated assessment","mute"),TL("At or above target",met,MT.length?Math.round(met/MT.length*100)+"%":"Gap recorded",met===MT.length?"good":"warn"),TL("Average level",String(avg),"of 5","mute"),TL("Weakest dimension",weakest&&MT.length?E(weakest.l):"None",weakest&&MT.length?"Average "+(Math.round(weakest.v*10)/10):"","warn")])}
 ${card("Processes by dimension","Shaded cells are below the process target",PR.length?matTable(PR):gap("processes"))}
 <p class="muted small">Scale: ${LVN.slice(1).map((n,i)=>(i+1)+" "+E(n)).join(", ")}. Mapping to a capability scale, not a certification.</p></div>`}});

/* ---------- r18_mature: maturity roadmaps ---------- */
adapt("r18_mature",{entities:["processes","maturity","metrics","projects","workflows"],render:()=>{
 const PR=DT.get("processes");
 const road=p=>{const m=matOf(p.id);if(!m)return null;const low=DIMS.filter(([k])=>m.dims[k]<m.target);const st=stepsOf(p);const n={human:0,robot:0,agent:0,gate:0};st.forEach(s=>n[s.kind]=(n[s.kind]||0)+1);
  const ms=(p.metrics||[]).map(metricOf).filter(Boolean),objs=new Set(ms.map(x=>x.obj)),projs=DT.get("projects").filter(x=>objs.has(x.obj));
  return{p,m,low,st,n,ms,projs}};
 const R=PR.map(road).filter(Boolean).sort((a,b)=>(b.m.target-b.m.level)-(a.m.target-a.m.level));
 const rowR=r=>[`<b>${E(r.p.n)}</b><small class="muted"> ${E(r.p.id)}</small>`,`${r.m.level} to ${r.m.target}`,r.low.length?r.low.map(([k,l])=>E(l)+" "+r.m.dims[k]).join(", "):pill("Target met","good"),r.st.length?`${r.st.length} steps: ${r.n.human} human, ${r.n.robot} robot, ${r.n.agent} agent${r.n.gate?", "+r.n.gate+" gate":""}`:`<span class="muted">No steps recorded</span>`,r.projs.map(x=>E(x.n)).join("<br>")||`<span class="muted">No funded project</span>`,own(r.p.owner,r.p.backup,"process:"+r.p.id)];
 return `<div class="screen stn">${head("Maturity roadmaps","Each process's path to a higher level",`Ordered by the gap between today's level and the target. The dimensions below target are what to raise first; the funded projects are the ones whose objective the process's metrics serve (modeled link).`)}
 ${tabs("r18_mature",["Roadmap by process","By dimension"],[
  ()=>card("Roadmaps",R.length+" processes",R.length?table(["Process","Level now to target","Raise first","Steps today","Funded projects that help","Owner and backup"],R.map(rowR)):gap("maturity")),
  ()=>card("By dimension","Average level per dimension across the tenant's processes (simulated)",R.length?table(["Dimension","Average","Processes below target"],DIMS.map(([k,l])=>[E(l),String(Math.round(R.reduce((s,r)=>s+r.m.dims[k],0)/R.length*10)/10),String(R.filter(r=>r.m.dims[k]<r.m.target).length)])):gap("maturity"))])}</div>`}});

/* ---------- events and lifecycle ---------- */
D.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-stn-tab]");if(!b)return;const [id,i]=b.dataset.stnTab.split("|");S.stn.tab[id]=+i;render()});
ensure();
G(()=>HOOKS.on("beforeGo",()=>ensure(),{order:-100,id:"stn-adapt-go"}));
G(()=>HOOKS.on("tenantChange",()=>ensure(),{order:-100,id:"stn-adapt-tenant"}));
[0,800,3000].forEach(t=>setTimeout(ensure,t));
})();
