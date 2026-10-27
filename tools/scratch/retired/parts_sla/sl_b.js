
/* ---------------- agreements: seed data ---------------- */
const C=(f,op,v)=>({f,op,v});
const PH=(rows,m)=>({m:m||"all",rows});
const W=(p,a,ch)=>({p,a,ch:ch||"Teams"});
const SCHD=(cal,tz,hol)=>({cal,tz:tz||"Mountain",hol:hol||"us"});
const RES=C("state","is one of",["Resolved","Closed"]);
const SEED=[
 {id:"SLA-INC-P1",n:"Incident P1: restore service",ty:"SLA",tbl:"incident",kind:"duration",target:{hours:4},goal:95,sch:SCHD("24x7","Mountain","none"),proc:"incident",own:"Tom Becker",
  cond:{start:PH([C("priority","is","P1")]),pause:PH([C("state","is","On hold")]),stop:PH([RES])},
  warn:[W(50,"Page the secondary on-call","Page"),W(75,"Notify the service desk lead in Teams and by text message","Teams"),W(100,"Open a major incident bridge and notify the CIO office","Bridge")],act:{from:"2026-01-01"}},
 {id:"SLA-INC-P1R",n:"Incident P1: first response",ty:"SLA",tbl:"incident",kind:"duration",target:{hours:.25},goal:98,sch:SCHD("24x7","Mountain","none"),proc:"incident",own:"Tom Becker",
  cond:{start:PH([C("priority","is","P1")]),stop:PH([C("state","is none of",["New"])])},warn:[W(50,"Page the primary on-call again","Page"),W(100,"Page the secondary on-call","Page")],act:{from:"2026-01-01"}},
 {id:"SLA-INC-P2",n:"Incident P2: restore service",ty:"SLA",tbl:"incident",kind:"duration",target:{hours:8},goal:95,sch:SCHD("biz"),proc:"incident",own:"Tom Becker",
  cond:{start:PH([C("priority","is","P2")]),pause:PH([C("state","is","On hold")]),stop:PH([RES]),cancel:PH([C("priority","is","P1")])},
  warn:[W(50,"Notify the assignee in Teams"),W(75,"Notify the assignment group manager"),W(100,"Reassign to the on-call primary","Page")],act:{from:"2026-01-01"}},
 {id:"SLA-INC-P3",n:"Incident P3 and P4: restore service",ty:"SLA",tbl:"incident",kind:"duration",target:{hours:27},goal:95,sch:SCHD("biz"),proc:"incident",own:"Tom Becker",
  cond:{start:PH([C("priority","is one of",["P3","P4"])]),pause:PH([C("state","is","On hold")]),stop:PH([RES]),cancel:PH([C("priority","is one of",["P1","P2"])])},
  warn:[W(75,"Notify the assignee in Teams"),W(100,"Notify the assignment group manager","Email")],act:{from:"2026-01-01"}},
 {id:"SLA-INC-P1B",n:"Incident P1: restore service (tighter target)",ty:"SLA",tbl:"incident",kind:"duration",target:{hours:3},goal:95,sch:SCHD("24x7","Mountain","none"),proc:"incident",own:"Tom Becker",
  cond:{start:PH([C("priority","is","P1")]),pause:PH([C("state","is","On hold")]),stop:PH([RES])},warn:[W(50,"Page the secondary on-call","Page"),W(100,"Open a major incident bridge","Bridge")],act:{from:"2026-11-01"},retro:false,note:"Replaces SLA-INC-P1 on November 1 after the board asked for a 3 hour P1 target."},
 {id:"SLA-REQ-HW",n:"Hardware request: deliver",ty:"SLA",tbl:"request_item",kind:"duration",target:{hours:45},goal:90,sch:SCHD("biz"),proc:"request",own:"Nia Brooks",
  cond:{start:PH([C("state","is","Submitted"),C("cat_class","is","Hardware")]),pause:PH([C("state","is","Approval")]),reset:PH([C("state","is","Submitted")]),stop:PH([C("state","is","Delivered")])},
  warn:[W(75,"Notify the fulfillment group lead"),W(100,"Notify the requester and manager with a new date","Email")],act:{from:"2026-01-01"}},
 {id:"SLA-REQ-STD",n:"Standard request: fulfill",ty:"SLA",tbl:"request_item",kind:"duration",target:{hours:45},goal:92,sch:SCHD("biz"),proc:"request",own:"Nia Brooks",
  cond:{start:PH([C("state","is","Submitted"),C("cat_class","is one of",["Software","AV support","New hire"])]),pause:PH([C("state","is","Approval")]),reset:PH([C("state","is","Submitted")]),stop:PH([C("state","is","Delivered")])},
  warn:[W(75,"Notify the fulfillment group lead"),W(100,"Notify the requester","Email")],act:{from:"2026-01-01"}},
 {id:"SLA-REQ-ACC",n:"Access request: provision",ty:"SLA",tbl:"request_item",kind:"duration",target:{hours:9},goal:95,sch:SCHD("biz"),proc:"access",own:"Sam Patel",
  cond:{start:PH([C("state","is","Submitted"),C("cat_class","is","Access")]),pause:PH([C("state","is","Approval")]),stop:PH([C("state","is","Delivered")])},
  warn:[W(75,"Notify the Identity team lead"),W(100,"Notify the requester","Email")],act:{from:"2026-01-01"}},
 {id:"SLA-REQ-RPT",n:"Report request: first draft",ty:"SLA",tbl:"request_item",kind:"duration",target:{hours:90},goal:90,sch:SCHD("biz"),proc:"request",own:"Dev Rao",
  cond:{start:PH([C("state","is","Fulfillment"),C("cat_class","is","Reporting")]),stop:PH([C("state","is","Delivered")])},warn:[W(75,"Notify the Data team lead"),W(100,"Notify the requester with a revised date","Email")],act:{from:"2026-01-01"}},
 {id:"OLA-DESK-ROUTE",n:"Resolver groups accept an assigned incident",ty:"OLA",tbl:"incident",kind:"duration",target:{hours:3},goal:90,sch:SCHD("biz"),proc:"incident",own:"Tom Becker",party:"Resolver groups",
  cond:{start:PH([C("state","is","New"),C("assignment_group","is none of",["Service desk"])]),stop:PH([C("state","is none of",["New"])])},warn:[W(75,"Nudge the group queue in Teams"),W(100,"Notify the service desk lead","Email")],act:{from:"2026-01-01"}},
 {id:"OLA-NET-P2",n:"Network team: resolve its P2 incidents",ty:"OLA",tbl:"incident",kind:"duration",target:{hours:6},goal:92,sch:SCHD("ext"),proc:"incident",own:"Sam Patel",party:"Network team",
  cond:{start:PH([C("priority","is","P2"),C("assignment_group","is","Network team")]),pause:PH([C("state","is","On hold")]),stop:PH([RES])},warn:[W(75,"Notify the network lead"),W(100,"Page the network on-call","Page")],act:{from:"2026-01-01"}},
 {id:"OLA-ENDPT-IMG",n:"Endpoint team: image and ship",ty:"OLA",tbl:"catalog_task",kind:"duration",target:{hours:27},goal:90,sch:SCHD("biz"),proc:"request",own:"Sam Patel",party:"Endpoint team",
  cond:{start:PH([C("state","is","Open"),C("assignment_group","is","Endpoint team")]),pause:PH([C("state","is","Pending")]),stop:PH([C("state","is","Closed complete")])},warn:[W(75,"Notify the Endpoint lead"),W(100,"Notify the service desk lead","Email")],act:{from:"2026-01-01"}},
 {id:"OLA-IAM-ACC",n:"Identity team: provision access",ty:"OLA",tbl:"catalog_task",kind:"duration",target:{hours:12},goal:95,sch:SCHD("biz"),proc:"access",own:"Sam Patel",party:"Identity team",
  cond:{start:PH([C("state","is","Open"),C("assignment_group","is","Identity team")]),stop:PH([C("state","is","Closed complete")])},warn:[W(75,"Notify the Identity lead"),W(100,"Notify the service desk lead","Email")],act:{from:"2026-01-01"}},
 {id:"OLA-SEC-PHISH",n:"Security team: triage a reported phish",ty:"OLA",tbl:"incident",kind:"duration",target:{hours:.5},goal:95,sch:SCHD("ext"),proc:"incident",own:"Jordan Lee",party:"Security team",
  cond:{start:PH([C("assignment_group","is","Security team")]),stop:PH([C("state","is none of",["New"])])},warn:[W(100,"Page the security on-call","Page")],act:{from:"2026-10-20",draft:true},note:"Draft. Waiting for the security lead to confirm the schedule."},
 {id:"UC-LUMEN-P1",n:"Lumen: Severity 1 restore",ty:"UC",tbl:"vendor_ticket",kind:"duration",target:{hours:4},goal:95,sch:SCHD("24x7","Mountain","none"),proc:"vendor",own:"Dev Rao",party:"Lumen",
  cond:{start:PH([C("vendor","is","Lumen"),C("severity","is","1")]),pause:PH([C("state","is","Waiting on Atlantic")]),stop:PH([C("state","is one of",["Restored","Confirmed"])])},
  warn:[W(50,"Call the Lumen duty manager","Page"),W(100,"Apply service credit clause 7.2","Email")],act:{from:"2026-01-01"},contract:{vendor:"Lumen",line:"Schedule C, clause 7.2",fee:38000,pct:5,cap:15,rule:"5% of the monthly fee for each missed Severity 1 restore"}},
 {id:"UC-LUMEN-CHG",n:"Lumen: index rebuild turnaround",ty:"UC",tbl:"vendor_ticket",kind:"duration",target:{hours:18},goal:90,sch:SCHD("biz"),proc:"vendor",own:"Dev Rao",party:"Lumen",
  cond:{start:PH([C("vendor","is","Lumen"),C("type","is","Change")]),pause:PH([C("state","is","Waiting on Atlantic")]),stop:PH([C("state","is one of",["Restored","Confirmed"])])},warn:[W(75,"Email the Lumen account manager","Email")],act:{from:"2026-01-01",to:"2026-12-31"},contract:{vendor:"Lumen",line:"Schedule C, clause 7.5",fee:38000,pct:0,cap:0,rule:"No credit; reviewed each quarter"}},
 {id:"UC-MS-A",n:"Microsoft Unified: Severity A response",ty:"UC",tbl:"vendor_ticket",kind:"duration",target:{hours:1},goal:100,sch:SCHD("24x7","Mountain","none"),proc:"vendor",own:"Sam Patel",party:"Microsoft",
  cond:{start:PH([C("vendor","is","Microsoft"),C("severity","is","1")]),stop:PH([C("state","is none of",["Opened"])])},warn:[W(100,"Escalate through the Microsoft account team","Email")],act:{from:"2026-01-01"}},
 {id:"UC-NORTHWIND-T1",n:"Northwind: Tier 1 desk response",ty:"UC",tbl:"vendor_ticket",kind:"duration",target:{hours:.5},goal:95,sch:SCHD("ext","Eastern","us"),proc:"incident",own:"Tom Becker",party:"Northwind Managed Services",msp:true,
  cond:{start:PH([C("vendor","is","Northwind Managed Services")]),stop:PH([C("state","is none of",["Opened"])])},warn:[W(75,"Message the Northwind shift lead","Teams"),W(100,"Escalate to the Northwind service manager","Email")],act:{from:"2026-01-01"},contract:{vendor:"Northwind Managed Services",line:"Master services agreement, Schedule 4 (service levels)",fee:21000,pct:2,cap:10,rule:"2% of the monthly fee for each 1 point below the 95% goal, up to 10%"}},
 {id:"UC-CONTOSO-MON",n:"Contoso: monitoring alert acknowledgement",ty:"UC",tbl:"vendor_ticket",kind:"duration",target:{hours:.5},goal:98,sch:SCHD("24x7","Pacific","none"),proc:"vendor",own:"Sam Patel",party:"Contoso Cloud Operations",msp:true,
  cond:{start:PH([C("vendor","is","Contoso Cloud Operations"),C("severity","is one of",["1","2"])]),stop:PH([C("state","is none of",["Opened"])])},warn:[W(100,"Page the Contoso duty engineer","Page")],act:{from:"2026-03-01"},contract:{vendor:"Contoso Cloud Operations",line:"Order form 2, service level exhibit",fee:14500,pct:3,cap:12,rule:"3% of the monthly fee for each 1 point below the 98% goal, up to 12%"}},
 {id:"SLA-INC-FCR",n:"Incidents resolved without a hand-off",ty:"SLA",tbl:"incident",kind:"ratio",target:{},goal:60,sch:SCHD("biz"),proc:"incident",own:"Tom Becker",
  cond:{start:PH([RES]),stop:PH([C("reassignment_count","is",0)])},warn:[W(100,"Review the top five hand-off reasons at the service review","Email")],act:{from:"2026-01-01"},note:"Success: the incident was never reassigned. Population: resolved or closed incidents."},
 {id:"SLA-CHG-SUCC",n:"Changes closed as successful",ty:"SLA",tbl:"change_request",kind:"ratio",target:{},goal:93,sch:SCHD("biz"),proc:"change",own:"Nia Brooks",
  cond:{start:PH([C("state","is","Closed")]),stop:PH([C("close_code","is","Successful")])},warn:[W(100,"Add the failed change to the next problem review","Email")],act:{from:"2026-01-01"}},
 {id:"XLA-INC-SAT",n:"Incident experience: sentiment",ty:"XLA",tbl:"incident",kind:"score",target:{stat:"mean"},goal:4.2,sch:SCHD("biz"),proc:"incident",own:"Tom Becker",
  xla:{dim:"Sentiment",src:"Post-resolution survey",q:"Overall, how did working with IT make you feel about this issue?",resp:.38},cond:{start:PH([RES])},warn:[W(100,"Open a service improvement item when the 30 day average falls below goal","Email")],act:{from:"2026-01-01"}},
 {id:"XLA-INC-RES",n:"Incident experience: did it fix the problem",ty:"XLA",tbl:"incident",kind:"score",target:{stat:"favorable"},goal:88,sch:SCHD("biz"),proc:"incident",own:"Tom Becker",
  xla:{dim:"Resolution satisfaction",src:"Post-resolution survey",q:"Is your problem fixed?",resp:.38},cond:{start:PH([RES])},warn:[W(100,"Review every unfavorable answer with the resolver group","Teams")],act:{from:"2026-01-01"}},
 {id:"XLA-REQ-EFF",n:"Request experience: effort",ty:"XLA",tbl:"request_item",kind:"score",target:{stat:"favorable"},goal:85,sch:SCHD("biz"),proc:"request",own:"Nia Brooks",
  xla:{dim:"Effort",src:"Portal feedback",q:"How easy was it to get what you needed?",resp:.3},cond:{start:PH([C("state","is","Delivered")])},warn:[W(100,"Review the five highest effort catalog items","Email")],act:{from:"2026-01-01"}},
 {id:"XLA-ONB",n:"New hire experience: day-one readiness",ty:"XLA",tbl:"request_item",kind:"score",target:{stat:"mean"},goal:4.4,sch:SCHD("biz"),proc:"onboarding",own:"Maya Ortiz",
  xla:{dim:"Sentiment",src:"Day-30 pulse survey",q:"On your first day, did you have what you needed to start work?",resp:.6},cond:{start:PH([C("state","is","Delivered"),C("cat_class","is","New hire")])},warn:[W(100,"Ask Human Resources and the hiring manager to review","Email")],act:{from:"2026-09-01"}},
 {id:"XLA-CHG-COM",n:"Change experience: clarity of communication",ty:"XLA",tbl:"change_request",kind:"score",target:{stat:"mean"},goal:4,sch:SCHD("biz"),proc:"change",own:"Nia Brooks",
  xla:{dim:"Sentiment",src:"Teams pulse",q:"Were you told clearly what would change and when?",resp:.25},cond:{start:PH([C("state","is","Closed")])},warn:[W(100,"Ask the change manager to review the notice template","Email")],act:{from:"2026-01-01"}}];
SEED.forEach(a=>{a.ver=1;a.retro=a.retro||false;a.act=Object.assign({svcs:[],tiers:[],prios:[],cust:[],cis:[],groups:[]},a.act);a.cond=Object.assign({},a.cond)});
/* scale: hundreds of agreements by service, customer tier and template */
const GENT=[["SLA","incident","Incident P2 restore",{hours:8},"biz",{start:PH([C("priority","is","P2")]),pause:PH([C("state","is","On hold")]),stop:PH([RES])},"incident"],["SLA","incident","Incident P3 restore",{hours:27},"biz",{start:PH([C("priority","is","P3")]),pause:PH([C("state","is","On hold")]),stop:PH([RES])},"incident"],["SLA","incident","Incident response",{hours:1},"ext",{start:PH([C("state","is","New")]),stop:PH([C("state","is none of",["New"])])},"incident"],["SLA","request_item","Request fulfill",{hours:45},"biz",{start:PH([C("state","is","Submitted")]),pause:PH([C("state","is","Approval")]),stop:PH([C("state","is","Delivered")])},"request"],["OLA","catalog_task","Fulfillment task",{hours:12},"biz",{start:PH([C("state","is","Open")]),pause:PH([C("state","is","Pending")]),stop:PH([C("state","is","Closed complete")])},"request"],["UC","vendor_ticket","Vendor restore",{hours:8},"biz",{start:PH([C("severity","is one of",["2","3"])]),pause:PH([C("state","is","Waiting on Atlantic")]),stop:PH([C("state","is one of",["Restored","Confirmed"])])},"vendor"],["SLA","change_request","Change lead time",{hours:120},"biz",{start:PH([C("state","is","New")]),stop:PH([C("state","is","Scheduled")])},"change"]];
const TIERMUL={Gold:.8,Silver:1,Bronze:1.4};
let GEN=null;
function genAgs(){if(GEN)return GEN;GEN=[];const names={SLA:"SLA",OLA:"OLA",UC:"UC"};SVCREG.forEach(s=>{GENT.forEach((t,ti)=>{CUST.forEach(ct=>{const h=Math.round(t[3].hours*TIERMUL[ct]*10)/10;GEN.push({id:`${t[0]}-${slug(s.n).slice(0,8).toUpperCase()}-${ti}${ct[0]}`,n:`${ct}: ${t[2]}, ${s.n}`,ty:t[0],tbl:t[1],kind:"duration",target:{hours:h},goal:90+(ct==="Gold"?5:ct==="Silver"?3:0),sch:SCHD(t[4]),proc:t[6],own:s.owner,party:t[0]==="OLA"?"Resolver groups":t[0]==="UC"?"Vendors":"",cond:t[5],warn:[W(75,"Notify the owner in Teams"),W(100,"Notify the service owner","Email")],act:{from:"2026-01-01",svcs:[s.n],cust:[ct],tiers:[],prios:[],cis:[],groups:[]},ver:1,retro:false,gen:true})})})});
 SVCREG.forEach(s=>{GEN.push({id:"XLA-"+slug(s.n).slice(0,8).toUpperCase(),n:"Experience: "+s.n,ty:"XLA",tbl:"incident",kind:"score",target:{stat:"favorable"},goal:82,sch:SCHD("biz"),proc:"incident",own:s.owner,xla:{dim:"Sentiment",src:"Post-resolution survey",q:"How did working with IT make you feel?",resp:.3},cond:{start:PH([RES])},warn:[W(100,"Review with the service owner","Email")],act:{from:"2026-01-01",svcs:[s.n],cust:[],tiers:[],prios:[],cis:[],groups:[]},ver:1,gen:true})});return GEN}
const AGS=()=>SEED.concat(SL.custom).concat(SCALE.on?genAgs():[]);
const agById=id=>AGS().find(a=>a.id===id);
const SERVICE_OPTS=()=>SVCREG.map(s=>[s.n,s.n]);
const TYPEN={SLA:"Service level agreement",OLA:"Operational level agreement",UC:"Underpinning contract",XLA:"Experience level agreement"};
const typeCls=t=>t==="SLA"?"info":t==="OLA"?"metric":t==="UC"?"warn":"good";
const tPill=t=>`<span class="pill ${typeCls(t)}" title="${TYPEN[t]}">${t}</span>`;
const goalTxt=ag=>ag.kind==="duration"?hrsStr(ag.target.hours)+" at "+ag.goal+"%":ag.kind==="ratio"?"At least "+ag.goal+"%":ag.target.stat==="mean"?"Average at least "+ag.goal+" of 5":ag.goal+"% favorable (4 or 5)";
const kindN=ag=>ag.kind==="duration"?"Time target":ag.kind==="ratio"?"Percentage":"Score";

/* ---------------- evaluation (cached) ---------------- */
const CACHE=new Map();
const hash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h};
const agKey=ag=>ag.id+"|"+hash(JSON.stringify([ag.cond,ag.target,ag.sch,ag.act,ag.retro,ag.kind,ag.tbl,ag.xla,ag.goal]))+"|"+(SCALE.on?1:0);
function evalAg(ag){const k=agKey(ag);if(CACHE.has(k))return CACHE.get(k);const res=evalCore(ag);CACHE.set(k,res);if(CACHE.size>2500)CACHE.delete(CACHE.keys().next().value);return res}
function evalCore(ag){const cal=calOf(ag.sch);const pool=poolOf(ag.tbl);const out={n:0,met:0,br:0,open:0,risk:0,paused:0,canc:0,val:null,unit:"%",pctAtt:null,ok:null,items:[],trend:[],causes:{},bySvc:{},noHist:!pool.length,pop:0,resp:0,scores:[]};
 if(!pool.length)return out;const from=NOW-30*DAY;const r=RNG("xla|"+ag.id);const wk=new Array(8).fill(0).map(()=>({m:0,b:0,s:0,n:0,sc:[]}));
 for(const rec of pool){if(!applies(ag,rec))continue;
  if(ag.kind==="duration"){const x=replay(ag,rec,cal);if(!x)continue;const inWin=x.startT>=from||x.fin>=from;
   const w=Math.min(7,Math.floor((NOW-x.fin)/(7*DAY)));if(x.st==="stopped"||x.st==="running"&&x.breached){const b=wk[7-Math.max(0,w)];if(b){if(x.breached)b.b++;else if(x.st==="stopped")b.m++}}
   if(!inWin)continue;out.items.push(x);
   if(x.st==="cancelled")out.canc++;else if(x.st==="stopped"){if(x.breached){out.br++;out.causes[x.cause||"No reason recorded"]=(out.causes[x.cause||"No reason recorded"]||0)+1}else out.met++}
   else{out.open++;if(x.breached){out.br++;out.causes[x.cause||"No reason recorded"]=(out.causes[x.cause||"No reason recorded"]||0)+1}else if(x.pct>=.75)out.risk++;if(x.st==="paused")out.paused++}
   const sb=out.bySvc[x.svc]=out.bySvc[x.svc]||{m:0,b:0};if(x.breached)sb.b++;else if(x.st==="stopped")sb.m++;
  }else{const seen=[];let pop=false,succ=false;const cur={};for(const ev of rec.ev){Object.assign(cur,ev.set);const s=Object.assign({},cur);if(!pop&&phaseMatch(ag.cond.start,s)){pop=true;seen.push(ev.t)}if(pop&&ag.kind==="ratio"&&phaseMatch(ag.cond.stop,s))succ=true}
   if(!pop)continue;const t=seen[0];const total=(rec.ev[rec.ev.length-1].t-rec.ev[0].t)/HR-((TSPEC[ag.tbl]||{}).tail||0);const ref=(TSPEC[ag.tbl]||{med:[10,10,10,10]}).med[Math.min(3,PRI.indexOf(rec.f.priority)<0?2:PRI.indexOf(rec.f.priority))]*1.8;
   if(t<from)continue;const w=Math.min(7,Math.floor((NOW-t)/(7*DAY)));const b=wk[7-Math.max(0,w)];
   if(ag.kind==="ratio"){out.pop++;if(succ){out.met++;b.m++}else{out.br++;b.b++;const c=rec.cause||"No reason recorded";out.causes[c]=(out.causes[c]||0)+1}out.items.push({id:rec.id,rec,stage:succ?"Achieved":"Breached",breached:!succ,svc:rec.f.service,prio:rec.f.priority,fin:t,cause:rec.cause,pct:1})}
   else{out.pop++;const inst={rec,breached:total>ref,cause:rec.cause};const sc=survey(ag,inst,r);if(sc!=null){out.resp++;out.scores.push(sc);wk[7-Math.max(0,w)].sc.push(sc);out.items.push({id:rec.id,rec,stage:sc>=4?"Favorable":sc===3?"Neutral":"Unfavorable",breached:sc<=3,svc:rec.f.service,prio:rec.f.priority,fin:t,cause:rec.cause,score:sc,pct:sc/5});const sb=out.bySvc[rec.f.service]=out.bySvc[rec.f.service]||{m:0,b:0,sc:[]};(sb.sc=sb.sc||[]).push(sc);if(sc<=3){const c=rec.cause||"No reason recorded";out.causes[c]=(out.causes[c]||0)+1}}}}}
 if(ag.kind==="duration"){out.n=out.met+out.br;out.val=out.n?out.met/out.n*100:null;out.pctAtt=out.val;out.ok=out.val==null?null:out.val>=ag.goal;out.trend=wk.map(b=>b.m+b.b?b.m/(b.m+b.b)*100:null)}
 else if(ag.kind==="ratio"){out.n=out.met+out.br;out.val=out.n?out.met/out.n*100:null;out.pctAtt=out.val;out.ok=out.val==null?null:out.val>=ag.goal;out.trend=wk.map(b=>b.m+b.b?b.m/(b.m+b.b)*100:null)}
 else{out.n=out.scores.length;const mean=out.n?out.scores.reduce((a,b)=>a+b,0)/out.n:null;const fav=out.n?out.scores.filter(x=>x>=4).length/out.n*100:null;if(ag.target.stat==="mean"){out.val=mean==null?null:Math.round(mean*100)/100;out.unit=" of 5";out.pctAtt=mean==null?null:mean/5*100;out.ok=mean==null?null:mean>=ag.goal;out.trend=wk.map(b=>b.sc.length?b.sc.reduce((a,c)=>a+c,0)/b.sc.length:null)}else{out.val=fav;out.pctAtt=fav;out.ok=fav==null?null:fav>=ag.goal;out.trend=wk.map(b=>b.sc.length?b.sc.filter(x=>x>=4).length/b.sc.length*100:null)}}
 out.trend=fillTrend(out.trend);return out}
const fillTrend=a=>{let last=null;a=a.slice();for(let i=0;i<a.length;i++){if(a[i]==null){a[i]=last}else last=a[i]}for(let i=a.length-1;i>=0;i--){if(a[i]==null)a[i]=a.find(x=>x!=null)}return a.map(x=>x==null?0:x)};
const valTxt=(ag,r)=>r.val==null?"No data":ag.kind==="score"&&ag.target.stat==="mean"?r.val.toFixed(2)+" of 5":Math.round(r.val*10)/10+"%";
const stOf=(ag,r)=>r.ok==null?"mute":r.ok?"good":r.val!=null&&(ag.kind==="score"&&ag.target.stat==="mean"?r.val>=ag.goal-.3:r.val>=ag.goal-5)?"warn":"bad";
const live=()=>AGS().filter(a=>{const s=agStatus(a);return s==="Active"||s==="Retiring"});
/* roll-ups */
function totals(){const key="T|"+SL.v+"|"+(SCALE.on?1:0)+"|"+AGS().length;if(CACHE.has(key))return CACHE.get(key);const L=live();const t={n:L.length,all:AGS().length,byTy:{},bySvc:{},byCls:{},risk:[],br:0,met:0,open:0,paused:0,xs:[],xn:0,miss:0,weekly:new Array(8).fill(0).map(()=>[0,0])};
 L.forEach(a=>{const r=evalAg(a);const ty=t.byTy[a.ty]=t.byTy[a.ty]||{n:0,ok:0,met:0,br:0,sum:0,cnt:0};ty.n++;if(r.ok)ty.ok++;if(r.ok===false)t.miss++;
  if(a.kind==="duration"){ty.met+=r.met;ty.br+=r.br;t.met+=r.met;t.br+=r.br;t.open+=r.open;t.paused+=r.paused}
  if(r.pctAtt!=null){ty.sum+=r.pctAtt;ty.cnt++}
  const sv=a.act.svcs&&a.act.svcs.length===1?a.act.svcs[0]:null;
  const bump=(map,k)=>{const o=map[k]=map[k]||{met:0,br:0,ok:0,n:0,sum:0,cnt:0};o.n++;if(r.ok)o.ok++;if(a.kind==="duration"){o.met+=r.met;o.br+=r.br}if(r.pctAtt!=null){o.sum+=r.pctAtt;o.cnt++}};
  bump(t.byCls,a.proc||"other");if(sv)bump(t.bySvc,sv);else Object.keys(r.bySvc).forEach(k=>{const o=t.bySvc[k]=t.bySvc[k]||{met:0,br:0,ok:0,n:0,sum:0,cnt:0};o.met+=(r.bySvc[k].m||0);o.br+=(r.bySvc[k].b||0)});
  if(a.kind==="duration")r.items.filter(x=>x.open&&(x.breached||x.pct>=.75)).forEach(x=>t.risk.push({ag:a,x}));
  if(a.ty==="XLA"&&r.val!=null){t.xs.push(a.target.stat==="mean"?r.val/5*100:r.val)}
  r.trend.forEach((v,i)=>{if(a.kind==="duration"&&r.n){t.weekly[i][0]+=v*r.n;t.weekly[i][1]+=r.n}})});
 t.risk.sort((a,b)=>b.x.pct-a.x.pct);t.att=t.met+t.br?t.met/(t.met+t.br)*100:100;t.xla=t.xs.length?t.xs.reduce((a,b)=>a+b,0)/t.xs.length:null;CACHE.set(key,t);return t}
const attOf=o=>o?(o.met+o.br?o.met/(o.met+o.br)*100:o.cnt?o.sum/o.cnt:null):null;
