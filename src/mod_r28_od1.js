/* ===== mod_r28_od1: Agent Action (working name). Part 1 of 2: data and models. Prefix od. Global: window.ODX.
   Reads the live prototype org (ORGX: 74 staff of the fictional Atlantic Systems, per-person workload and time, AI agents, vacancies).
   Every number carries a source label: fact (computed from prototype data), modeled (computed with a stated assumption), hyp (working default or judgment), sim (simulated).
   Nothing here is a live connector. 10-K parsing runs in the browser on text the person supplies; sample filings are fictional. ===== */
(function(){
const W=window;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const O=W.ORGX;if(!O||!O.staff)return;
const X=W.ODX={};
const r1=n=>Math.round(n*10)/10,r0=Math.round;
const sum=a=>a.reduce((s,x)=>s+x,0);
const avg=a=>a.length?sum(a)/a.length:0;
let C=null;

/* ---------- people, load, time ---------- */
const kidsOf=n=>G(()=>typeof O.kids==="function"?O.kids(n):O.kids[n],[])||[];
const wlOf=n=>G(()=>O.perf(n).wl,{pct:60,hrs:24,cap:40});
const tmOf=n=>G(()=>O.time(n),[])||[];
const cat=(n,key)=>{const c=tmOf(n).find(x=>String(x.k).toLowerCase().indexOf(key)>=0);return c?{hrs:+c.hrs||0,auto:+c.auto||0}:{hrs:0,auto:0}};
const AUG={rep:.6,mtg:.25,apr:.3,ops:.35};/* modeled: share of each time category an agent can plausibly take (working defaults, not benchmarks) */
X.AUG=AUG;
function people(){
 if(C)return C;
 const L=G(()=>O.staff,[]);
 C=L.map(s=>{const w=wlOf(s.n),rep=cat(s.n,"reporting"),mtg=cat(s.n,"meeting"),apr=cat(s.n,"approval"),ops=cat(s.n,"operations"),prj=cat(s.n,"project");
  const aug=Math.max(0,rep.hrs*AUG.rep-rep.auto)+Math.max(0,mtg.hrs*AUG.mtg-mtg.auto)+Math.max(0,apr.hrs*AUG.apr-apr.auto)+Math.max(0,ops.hrs*AUG.ops-ops.auto);
  const auto=sum(tmOf(s.n).map(x=>+x.auto||0)),tot=sum(tmOf(s.n).map(x=>+x.hrs||0));
  return{n:s.n,role:s.role,unit:s.unit,mgr:s.mgr,rt:s.rt,span:kidsOf(s.n).length,pct:+w.pct||0,hrs:+w.hrs||0,cap:+w.cap||40,rep:rep.hrs,mtg:mtg.hrs,apr:apr.hrs,ops:ops.hrs,prj:prj.hrs,repA:rep.auto,mtgA:mtg.auto,aprA:apr.auto,opsA:ops.auto,aug:r1(aug),auto:auto,tot:tot,yrs:+s.yrs||0,et:s.et||"ft",fn:(s.fn||[]).length,mx:sum((s.mx||[]).map(m=>+m.pct||0))}});
 return C}
X.people=people;
X.units=()=>{const u={};people().forEach(p=>{(u[p.unit]=u[p.unit]||[]).push(p)});return u};
X.agents=()=>G(()=>O.agents(),[]).map(a=>({id:a.id,name:a.name,sponsor:a.sponsor,tier:a.autonomy,status:a.status,plan:+a.hrs||0,real:a.realized!=null?+a.realized:+a.hrs||0,runs:G(()=>a.eval.runs,0),acc:G(()=>a.eval.accept,0),err:G(()=>a.eval.err,0),esc:G(()=>a.eval.esc,0),does:a.does,guards:a.guards||[],kill:a.kill,model:a.model}));
X.stats=()=>G(()=>O.stats(),{});
X.vacs=()=>G(()=>O.vacs(),[]);

/* ---------- the 20 organizational excellence principles ----------
   dir: band = lo..hi; max = at or below hi; min = at or above lo. calc returns a number. Bands are working defaults for discussion, not published benchmarks. */
X.PR=[
 {id:"P01",n:"Span of control is wide enough to add value",g:"Structure",dir:"band",lo:5,hi:9,u:"avg direct reports per manager",f:"Sum of direct reports / managers",why:"Narrow spans add layers and cost. Very wide spans starve people of coaching.",src:"fact",calc:()=>{const m=people().filter(p=>p.span>0);return r1(avg(m.map(p=>p.span)))},hyp:["H6"]},
 {id:"P02",n:"Few managers lead only one or two people",g:"Structure",dir:"max",hi:15,u:"% of managers with span 1 or 2",f:"Managers with span at most 2 / managers",why:"A manager with one report is usually a role waiting to be redesigned.",src:"fact",calc:()=>{const m=people().filter(p=>p.span>0);return m.length?r0(m.filter(p=>p.span<=2).length/m.length*100):0},hyp:["H6"]},
 {id:"P03",n:"No manager has more people than they can lead",g:"Structure",dir:"max",hi:10,u:"largest span",f:"Max direct reports",why:"Beyond about ten, one-to-ones and reviews stop working.",src:"fact",calc:()=>Math.max(0,...people().map(p=>p.span))},
 {id:"P04",n:"Few layers between the top and the front line",g:"Structure",dir:"band",lo:3,hi:6,u:"layers",f:"Longest reporting chain",why:"Each layer slows decisions and filters information.",src:"fact",calc:()=>+G(()=>O.layers,0)||+(X.stats().layers||0)},
 {id:"P05",n:"Managers are a minority of headcount",g:"Structure",dir:"max",hi:20,u:"% of staff who manage people",f:"Managers / headcount",why:"A high manager share points to coordination work humans or agents could carry.",src:"fact",calc:()=>r0(people().filter(p=>p.span>0).length/Math.max(1,people().length)*100),hyp:["H6"]},
 {id:"P06",n:"Nobody is chronically overloaded",g:"Load",dir:"max",hi:10,u:"% of staff above 100% load",f:"Staff with workload over 100% / headcount",why:"Sustained overload predicts errors, attrition and slow approvals.",src:"fact",calc:()=>r0(people().filter(p=>p.pct>100).length/Math.max(1,people().length)*100),hyp:["H3","H5"]},
 {id:"P07",n:"Capacity is not stranded",g:"Load",dir:"max",hi:15,u:"% of staff below 50% load",f:"Staff with workload under 50% / headcount",why:"Idle capacity next to overload means work is not flowing to where the capacity is.",src:"fact",calc:()=>r0(people().filter(p=>p.pct<50).length/Math.max(1,people().length)*100),hyp:["H5"]},
 {id:"P08",n:"Matrix allocations never exceed 100%",g:"Load",dir:"max",hi:0,u:"people allocated over 100% to projects",f:"Staff whose project allocations sum above 100",why:"Over-allocation hides the real cost of each project.",src:"fact",calc:()=>people().filter(p=>p.mx>100).length,hyp:["H8"]},
 {id:"P09",n:"Dotted-line reporting stays the exception",g:"Structure",dir:"max",hi:10,u:"% of staff with a dotted line",f:"Dotted lines / headcount",why:"Every dotted line is a second boss to satisfy.",src:"fact",calc:()=>r0((+X.stats().dotted||0)/Math.max(1,people().length)*100)},
 {id:"P10",n:"Vacancies are kept short and few",g:"Capacity",dir:"max",hi:8,u:"% of positions vacant",f:"Open vacancies / (staff + vacancies)",why:"Long vacancies quietly overload the people who stay.",src:"fact",calc:()=>r1(X.vacs().length/Math.max(1,people().length+X.vacs().length)*100),hyp:["H7"]},
 {id:"P11",n:"Contractors do not carry the core",g:"Capacity",dir:"max",hi:15,u:"% of staff who are contractors",f:"Contractors / headcount",why:"Core knowledge that lives with contractors leaves with them.",src:"fact",calc:()=>r0(people().filter(p=>p.et==="ct").length/Math.max(1,people().length)*100)},
 {id:"P12",n:"No function depends on a single person",g:"Resilience",dir:"max",hi:2,u:"units with one person",f:"Units with headcount 1",why:"One person is a single point of failure for the whole function.",src:"fact",calc:()=>Object.values(X.units()).filter(a=>a.length===1).length,hyp:["H9"]},
 {id:"P13",n:"Reporting and administration are a small share of time",g:"Work mix",dir:"max",hi:10,u:"% of hours",f:"Reporting and administration hours / all hours",why:"This is the work agents do best and people value least.",src:"fact",calc:()=>r0(sum(people().map(p=>p.rep))/Math.max(1,sum(people().map(p=>p.tot)))*100),hyp:["H1"]},
 {id:"P14",n:"Meetings do not crowd out the work",g:"Work mix",dir:"max",hi:18,u:"% of hours",f:"Meeting hours / all hours",why:"Capturing decisions and actions well shortens meetings and prevents repeats.",src:"fact",calc:()=>r0(sum(people().map(p=>p.mtg))/Math.max(1,sum(people().map(p=>p.tot)))*100),hyp:["H2"]},
 {id:"P15",n:"Routine operations are automated where safe",g:"Work mix",dir:"min",lo:15,u:"% of hours already automated",f:"Automated hours / all hours",why:"Automation share shows how much of the routine is already off human plates.",src:"fact",calc:()=>r0(sum(people().map(p=>p.auto))/Math.max(1,sum(people().map(p=>p.tot)))*100),hyp:["H3","H4"]},
 {id:"P16",n:"AI agents are a meaningful share of the workforce",g:"AI",dir:"band",lo:15,hi:50,u:"agents per 100 staff",f:"Agents / headcount x 100",why:"Working default band for an organization with heavy routine work. Hypothesis, not a benchmark.",src:"hyp",calc:()=>r0(X.agents().length/Math.max(1,people().length)*100)},
 {id:"P17",n:"Every agent works inside a box",g:"AI",dir:"min",lo:100,u:"% of agents with sponsor and kill switch",f:"Agents with a named sponsor and a kill switch / agents",why:"Governed agents are the precondition for giving them more work.",src:"fact",calc:()=>{const a=X.agents();return a.length?r0(a.filter(x=>x.sponsor&&x.kill).length/a.length*100):0}},
 {id:"P18",n:"Every area has a named owner",g:"Accountability",dir:"min",lo:95,u:"% of areas with an owner",f:"Areas with an owner / areas",why:"Unowned areas are where problems wait.",src:"fact",calc:()=>+(X.stats().ownPct||0)},
 {id:"P19",n:"Experience is spread, not concentrated at the edges",g:"Capability",dir:"max",hi:35,u:"% of staff with 2 years or less",f:"Staff with tenure at most 2 years / headcount",why:"A junior-heavy bench needs more review and coaching than managers have time for.",src:"fact",calc:()=>r0(people().filter(p=>p.yrs<=2).length/Math.max(1,people().length)*100),hyp:["H7"]},
 {id:"P20",n:"Roles state what people are the go-to for",g:"Accountability",dir:"min",lo:90,u:"% of roles with 2 or more stated responsibilities",f:"Roles with at least 2 go-to items / headcount",why:"Unclear decision rights create escalations and delays.",src:"fact",calc:()=>r0(people().filter(p=>p.fn>=2).length/Math.max(1,people().length)*100)}
];
X.prVal=p=>G(()=>p.calc(),null);
X.prStatus=(p,v)=>{if(v==null)return"na";
 const ok=p.dir==="max"?v<=p.hi:p.dir==="min"?v>=p.lo:(v>=p.lo&&v<=p.hi);if(ok)return"pass";
 const gap=p.dir==="max"?(v-p.hi)/Math.max(1,p.hi||1):p.dir==="min"?(p.lo-v)/Math.max(1,p.lo):(v<p.lo?(p.lo-v)/p.lo:(v-p.hi)/p.hi);
 return gap>0.5?"fail":"watch"};
X.prBand=p=>p.dir==="max"?"at most "+p.hi:p.dir==="min"?"at least "+p.lo:p.lo+" to "+p.hi;

/* ---------- reference architectures (names are standard terms; descriptions are paraphrased, not the published text) ---------- */
X.REFS={
 itil:{n:"ITIL 4 service value chain",note:"Six activities that turn demand into value. Practice names are public terms; descriptions here are paraphrased. Check licensing before reusing the published text in customer assets.",acts:{plan:["Plan","Set direction, priorities and the shape of the organization."],improve:["Improve","Keep raising the performance of products, services and practices."],engage:["Engage","Understand needs and keep people informed and involved."],dt:["Design and transition","Make sure what is built meets expectations when it goes live."],ob:["Obtain or build","Make components available when and where they are needed."],ds:["Deliver and support","Run services and fix them fast when they break."]}},
 it4it:{n:"IT4IT value streams",note:"Four value streams across the IT lifecycle. Mapped from the six activities above by this prototype; the mapping is a hypothesis.",acts:{plan:["Strategy to Portfolio","Decide what to invest in."],improve:["Detect to Correct","Find and fix what is wrong."],engage:["Request to Fulfill","Take requests and deliver them."],dt:["Requirement to Deploy","Turn requirements into running services."],ob:["Requirement to Deploy","Turn requirements into running services."],ds:["Detect to Correct","Find and fix what is wrong."]}}
};
X.actLabel=(ref,k)=>G(()=>X.REFS[ref].acts[k][0],k);

/* ---------- strategy lens: themes counted in 10-K text ---------- */
X.THEMES=[
 {k:"ai",n:"AI and automation",re:/\b(artificial intelligence|machine learning|generative|automation|automate[sd]?|AI)\b/gi,hy:["H1","H2","H3","H4"]},
 {k:"cost",n:"Cost and efficiency",re:/(cost reduction|efficien|productivity|restructur|headcount|workforce reduction|optimi[sz])/gi,hy:["H5","H6","H7"]},
 {k:"talent",n:"Talent and skills",re:/(talent|retention|hiring|attrition|reskill|upskill|skills|workforce)/gi,hy:["H7","H9"]},
 {k:"cyber",n:"Cyber and resilience",re:/(cyber|security|breach|resilien|business continuity|outage)/gi,hy:["H3","H9"]},
 {k:"reg",n:"Regulation and compliance",re:/(regulat|complian|audit|privacy|disclosure)/gi,hy:["H4","H8"]},
 {k:"data",n:"Data and analytics",re:/(data|analytics|insight|reporting)/gi,hy:["H1"]},
 {k:"grow",n:"Growth and customers",re:/(growth|customer|member|revenue|market share|expan)/gi,hy:["H7"]}
];
const STOPW=new Set("the and for that with this from have are our may not will which their its was were been has had can any such other these those into than also more most some under over upon while including because through between within about would could should shall each both only same when where who whom whose what how all one two three year years company companies fiscal".split(" "));
X.parseFiling=function(raw,name,fict){
 let t=String(raw||"");
 if(/<\/?[a-z][\s\S]*?>/i.test(t.slice(0,8000)))t=t.replace(/<(script|style)[\s\S]*?<\/\1>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/&#8217;|&rsquo;/g,"'");
 t=t.replace(/\s+/g," ").trim();
 const words=t?t.split(" ").length:0;
 const re=/\bItem\s+(1A|1B|1C|1|2|3|4|5|6|7A|7|8|9A|9B|9|10|11|12|13|14|15)\s*[.:\-–—]\s*([A-Z][A-Za-z ,&'’\/\-]{3,70})/g;
 const hits=[];let m;while((m=re.exec(t)))hits.push({k:m[1],t:m[2].trim(),i:m.index});
 const secs={};hits.forEach((h,j)=>{const end=j+1<hits.length?hits[j+1].i:t.length,len=end-h.i;if(!secs[h.k]||len>secs[h.k].len)secs[h.k]={k:h.k,t:h.t,len:len,i:h.i,end:end}});
 const sec=k=>secs[k]?t.slice(secs[k].i,secs[k].end):"";
 const emp=t.match(/approximately\s+([\d,]{2,9})\s+(?:full[- ]time\s+)?(?:employees|team members|associates|people)/i);
 const risk=sec("1A"),risks=[];
 (risk.match(/[^.]{30,190}\./g)||[]).forEach(s=>{if(risks.length<5&&/^(We|Our|If|The loss|Failure|Changes|A|Any)\b/.test(s.trim())&&/(could|may|might|adversely)/i.test(s))risks.push(s.trim())});
 const themes={};X.THEMES.forEach(th=>{const c=(t.match(th.re)||[]).length;themes[th.k]=words?r1(c/words*10000):0});
 const freq={};t.toLowerCase().replace(/[^a-z ]/g," ").split(/\s+/).forEach(w=>{if(w.length>=5&&!STOPW.has(w))freq[w]=(freq[w]||0)+1});
 const top=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,12).map(e=>e[0]);
 return{name:name,fict:!!fict,words:words,secs:Object.values(secs).sort((a,b)=>b.len-a.len).slice(0,8).map(s=>({k:s.k,t:s.t,w:Math.round(s.len/6)})),emp:emp?emp[1]:null,risks:risks,themes:themes,top:top}};
X.SAMPLE=[
 {name:"Harbor Standards Group, annual report (fictional sample)",text:"Item 1. Business. Harbor Standards Group publishes technical standards for member organizations. We employ approximately 1,900 employees. Our strategy is to grow member revenue while reducing cost per published standard through automation and generative AI. We are investing in analytics to improve reporting and in upskilling our workforce. Item 1A. Risk Factors. We may fail to retain key talent, and attrition in our editorial teams could adversely affect publication schedules. A cyber incident or outage of our publishing platform could damage member confidence. Changes in regulation and privacy rules may increase compliance cost. If we do not realize productivity gains from automation, our margins may decline. Item 7. Management's Discussion. Revenue grew while headcount was held flat. We expanded automation of reporting and approvals, and our efficiency program reduced administrative effort. Customer and member satisfaction improved. We continue to optimize our operating model and resilience planning."},
 {name:"Calder Data and Publishing, annual report (fictional sample)",text:"Item 1. Business. Calder Data and Publishing licenses datasets and analytics. We have approximately 4,200 team members. We will use machine learning and automation to improve data quality and customer insight, and to streamline our service operations. Item 1A. Risk Factors. Our ability to hire and reskill technical talent may be limited, which could adversely affect growth. A security breach or business continuity failure could harm customers. We rely on third parties for hosting and our audit and disclosure obligations may become more complex. Item 7. Management's Discussion. Operating expense grew more slowly than revenue as we reduced cost through restructuring of support teams and expanded self-service. We invested in data and analytics capabilities, and in security and resilience. Productivity per employee improved."},
 {name:"Veridian Assurance Corp., annual report (fictional sample)",text:"Item 1. Business. Veridian Assurance Corp. provides certification and audit services. We had approximately 760 employees. Our strategy focuses on regulation and compliance expertise, customer growth, and automation of evidence collection with AI. Item 1A. Risk Factors. Regulation may change quickly, and failure to meet disclosure and privacy requirements could adversely affect us. Loss of auditors through attrition could limit capacity. Cyber events may disrupt service. Item 7. Management's Discussion. We expanded automation of routine audit reporting, held headcount flat, and invested in upskilling. Efficiency gains from workflow automation reduced cycle time for customer reports."}
];
X.themeAgg=function(list){const o={};X.THEMES.forEach(th=>{const v=list.filter(f=>f.parsed).map(f=>f.parsed.themes[th.k]);o[th.k]=r1(avg(v))});return o};
X.signalLevel=function(agg,k){const v=agg[k]||0,vals=Object.values(agg).sort((a,b)=>b-a);if(!vals.length||v<=0)return"none";return v>=vals[1]&&v>0?(v>=vals[0]?"high":"medium"):"low"};

/* ---------- restructure hypotheses, generated from the live org ----------
   aff: [{n, hrs}] hours per week moved off (positive) or onto (negative) each person. All effects are modeled, every confidence is a judgment. */
let HC=null;
X.hyps=function(){
 if(HC)return HC;
 const P=people(),by={};P.forEach(p=>by[p.n]=p);
 const top=(key,min,share)=>P.filter(p=>p[key]>=min).map(p=>({n:p.n,hrs:r1(Math.max(0,p[key]*share-(p[key+"A"]||0)))})).filter(a=>a.hrs>0);
 const H=[];
 H.push({id:"H1",t:"Hand routine reporting and administration to a reporting agent",ch:"agent",agent:"PMO Agent (existing, extend to reporting)",tier:"suggest",unit:"",pr:["P13"],aff:top("rep",3,AUG.rep),conf:.72,why:"Reporting and administration is the work agents do best. People review and send; the agent drafts from the system of record."});
 H.push({id:"H2",t:"Extend meeting and decision capture to every team with heavy meeting load",ch:"agent",agent:"First Officer (existing)",tier:"act",pr:["P14"],aff:top("mtg",4.5,AUG.mtg),conf:.68,why:"First Officer already files decisions and actions with owners. Extending it removes note-taking and follow-up chasing."});
 H.push({id:"H3",t:"Put an operations triage agent in front of support and incident work",ch:"agent",agent:"Triage Agent (existing, extend to first-line triage)",tier:"suggest",pr:["P06","P15"],aff:top("ops",10,AUG.ops),conf:.64,why:"First-line classification, routing and known-fix lookup are repeatable. Humans keep diagnosis and change."});
 H.push({id:"H4",t:"Pre-screen approvals so approvers only see exceptions",ch:"agent",agent:"Invoice Advisor (existing, extend to other approvals)",tier:"suggest",pr:["P15"],aff:top("apr",2.5,AUG.apr),conf:.6,why:"Score each request against policy, history and limits. Approvers decide; the agent cannot execute."});
 /* H5 rebalance: move excess hours from overloaded people to peers in the same unit with headroom */
 const U=X.units(),aff5=[];let unresolved=0;
 P.filter(p=>p.pct>100).forEach(p=>{let need=(p.pct-95)/100*p.cap;const peers=(U[p.unit]||[]).filter(q=>q.n!==p.n&&q.pct<80).sort((a,b)=>a.pct-b.pct);
  let moved=0;peers.forEach(q=>{if(need<=0.5)return;const room=Math.max(0,(85-q.pct)/100*q.cap),m=Math.min(need,room);if(m>=0.5){aff5.push({n:q.n,hrs:-r1(m)});moved+=m;need-=m}});
  if(moved>0.5)aff5.push({n:p.n,hrs:r1(moved)});if(need>0.5)unresolved++});
 H.push({id:"H5",t:"Rebalance work from overloaded people to peers with headroom",ch:"human",agent:"Resource Agent (existing, proposes the moves for approval)",tier:"approval",pr:["P06","P07"],aff:aff5,conf:.55,why:"Where a peer in the same unit has room, move work first. "+unresolved+" overloaded "+(unresolved===1?"person has":"people have")+" no peer headroom in their unit, so the agent hypotheses above are the lever there."});
 const narrow=P.filter(p=>p.span>0&&p.span<=2&&p.rt!=="ceo");
 H.push({id:"H6",t:"Consolidate managers who lead one or two people",ch:"human",agent:"",pr:["P01","P02","P05"],aff:[],freed:Math.floor(narrow.length/2),names:narrow.map(p=>p.n),conf:.5,why:"Merging adjacent teams under one manager reduces layers and cost. People decisions need leaders; this is a design hypothesis to test, not a verdict."});
 const vac=X.vacs().filter(v=>(v.kind||"human")==="human");
 H.push({id:"H7",t:"Reshape open vacancies as agent-augmented roles",ch:"mixed",agent:"Role-specific agents (see roadmap)",pr:["P10","P19"],aff:[],reqs:vac.map(v=>v.title),conf:.5,why:"Before filling "+vac.length+" open human requisitions, check how much of each role an agent can take. Modeled at about 30% of a role, which is a working default."});
 const mx=P.filter(p=>p.mx>100);
 H.push({id:"H8",t:"Fix project allocations that exceed 100%",ch:"human",agent:"",pr:["P08"],aff:[],names:mx.map(p=>p.n),conf:.7,why:"Over-allocation hides the true cost of projects and makes plans fiction. Resolve with the portfolio lead."});
 const solo=Object.entries(U).filter(e=>e[1].length===1).map(e=>e[1][0].n+" ("+e[0]+")");
 H.push({id:"H9",t:"Add continuity for single-person functions: runbooks and a knowledge agent",ch:"mixed",agent:"Knowledge Curator (existing, extend to runbooks)",tier:"suggest",pr:["P12"],aff:[],names:solo,conf:.58,why:"Cross-train a named backup, and have an agent keep the runbook current from tickets and changes."});
 H.forEach(h=>{h.hrs=r1(sum(h.aff.filter(a=>a.hrs>0).map(a=>a.hrs)));if(h.id==="H7")h.hrs=r1(vac.length*40*0.3);if(h.id==="H5")h.hrs=0;h.n=h.aff.filter(a=>a.hrs>0).length||(h.names?h.names.length:0)||(h.reqs?h.reqs.length:0);h.fte=r1(h.hrs/40)});
 HC=H.filter(h=>h.id!=="H8"||(h.names&&h.names.length));return HC};
X.hypById=id=>X.hyps().find(h=>h.id===id);

/* ---------- before and after, from accepted hypotheses ---------- */
X.state=function(){const s=W.S=W.S||{};return null};
X.after=function(acc){
 const P=people(),delta={};let agentHrs=0,freed=0;
 X.hyps().filter(h=>acc[h.id]==="accepted").forEach(h=>{h.aff.forEach(a=>{delta[a.n]=(delta[a.n]||0)+a.hrs});if(h.ch==="agent"||h.id==="H7")agentHrs+=h.hrs;if(h.freed)freed+=h.freed});
 const AP=P.map(p=>Object.assign({},p,{pctA:r0(p.pct-(delta[p.n]||0)/p.cap*100)}));
 const mg=P.filter(p=>p.span>0),reports=sum(mg.map(p=>p.span));
 const tot=sum(P.map(p=>p.tot));
 return{AP:AP,agentHrs:r1(agentHrs),freed:freed,
  over:[P.filter(p=>p.pct>100).length,AP.filter(p=>p.pctA>100).length],
  under:[P.filter(p=>p.pct<50).length,AP.filter(p=>p.pctA<50).length],
  load:[r0(avg(P.map(p=>p.pct))),r0(avg(AP.map(p=>p.pctA)))],
  span:[r1(reports/Math.max(1,mg.length)),r1(reports/Math.max(1,mg.length-freed))],
  mgrShare:[r0(mg.length/P.length*100),r0((mg.length-freed)/P.length*100)],
  agents:X.agents().length,agentsA:X.agents().length+X.hyps().filter(h=>acc[h.id]==="accepted"&&h.agent&&!/existing|Role-specific/.test(h.agent)).length,
  adminPct:[r0(sum(P.map(p=>p.rep))/tot*100),r0((sum(P.map(p=>p.rep))-sum(X.hyps().filter(h=>acc.H1==="accepted"&&h.id==="H1").map(h=>h.hrs)))/tot*100)]}};

/* ---------- the transition engine: dimensions, gaps, options, ERP posture ----------
   Clients rarely have an ideal state. Each gap has a hypothesis, three options and a recommendation that moves with the ERP posture:
   stay (keep the ERP, cover gaps around it), wean (cover now, extract customizations later), replace (rebuild where it pays).
   Effort in person-weeks and value shares are modeled with working defaults, not estimates for a real engagement. */
X.DIMS=[
 {k:"org",n:"Organizational",owner:"Head of People Operations",retrain:"Manager coaching and role-redesign workshops, then a 30-day buddy period",verb:"Redesign"},
 {k:"exp",n:"Experiential",owner:"Communications lead",retrain:"Persona walkthroughs and a pilot group that gives weekly feedback",verb:"Smooth"},
 {k:"fin",n:"Financial",owner:"Chief financial officer",retrain:"Finance partners learn the new cost-per-transaction view in a two-session clinic",verb:"Expose"},
 {k:"tech",n:"Technical",owner:"Chief architect",retrain:"Platform team pairs with the builder on the first bridge, then owns it",verb:"Connect"},
 {k:"data",n:"Data",owner:"Head of data and analytics",retrain:"Stewards trained on definitions, owners and the quality rules they now own",verb:"Define"},
 {k:"sc",n:"Supply chain",owner:"Procurement lead",retrain:"Buyers and suppliers trained on the new intake and exception path",verb:"Streamline"},
 {k:"ops",n:"Operational",owner:"Platform engineering lead",retrain:"Shadow the agent for two weeks, then supervise, then hand over routine cases",verb:"Automate"},
 {k:"gov",n:"Governance and risk",owner:"General counsel",retrain:"Approvers briefed on what the agent checks and what it cannot do",verb:"Control"}
];
X.WAVES=[
 {k:0,n:"Prepare",span:"0 to 3 months",d:"Baselines, owners, decisions, quick wins"},
 {k:1,n:"Bridge",span:"3 to 6 months",d:"Cover the gaps around the core without replacing it"},
 {k:2,n:"Simplify",span:"6 to 12 months",d:"Remove workarounds, retire manual steps, consolidate"},
 {k:3,n:"Wean",span:"12 to 24 months",d:"Extract customizations, decide what the core still needs to do"}
];
X.POSTURES={stay:{n:"Stay on the ERP",d:"Keep the ERP. Cover the gaps around it and make staying easy."},wean:{n:"Wean off the ERP",d:"Cover the gaps now, then extract customizations and shrink the ERP's footprint."},replace:{n:"Replace the ERP",d:"Rebuild the processes where the payoff is high and plan the cutover."}};
/* g: id|dim|title|now|next|size 1-5|reach 1-5|erp 0-2|label|bridge|rebuild|leave|hyp ids */
const GRAW=`G01|org|Spans are narrow while some teams are overloaded|Managers lead few people; some staff run above 100% while peers have room|Right-sized spans and work flowing to where capacity is|2|3|0|fact|Rebalance work inside units and merge adjacent small teams|Full org redesign across units with new layers|Accept uneven load and manager overhead|H5,H6
G02|org|Open roles are designed as if no agent existed|Requisitions copy last year's job description|Each role states what an agent takes and what a person owns|3|4|0|modeled|Add an agent-share line to every requisition before approval|Redesign the job families and career paths|Hire as before|H7
G03|exp|Staff re-key the same order data across four screens|Order, credit, pricing and invoice data typed again in each place|One entry, carried through|3|4|2|modeled|Add a capture form that writes once and syncs to each system|Rebuild the order experience end to end|Keep the re-keying and train around it|
G04|exp|Members cannot see the status of a request without emailing|Status lives in inboxes and spreadsheets|A single status view per request|2|4|1|modeled|Publish a read-only status page fed from existing records|Rebuild intake and tracking as one product|Keep answering status emails|
G05|fin|The cost of manual work is invisible|No cost per transaction; effort not tied to process|Cost per transaction and hours returned by process|2|3|1|modeled|Add a cost-per-transaction measure fed from time and volume data|Rebuild chargeback and costing in the ERP|Keep annual allocations|
G06|fin|Module licence spend is not tied to use|Renewals negotiated without usage evidence|Renew only what is used; shrink what is not|3|3|2|modeled|Usage report per module and a renewal checklist|Re-platform modules that are costly and little used|Renew as is|
G07|tech|Four order-to-cash steps happen outside the ERP|Credit check, price validation, cash application and disputes run in spreadsheets, email and a bank portal|Every step is recorded, owned and measured|4|5|2|modeled|Cover the four steps with workflows and agents that read and write the ERP through its interfaces|Rebuild order to cash as a new process and cut over|Leave the four steps as they are|H3,H4
G08|tech|Point-to-point integrations with no shared event layer|Each connection built and fixed one at a time|One governed interface layer other systems use|4|4|2|modeled|Put a thin interface layer in front of the ERP and move the busiest integrations to it|Replace all integrations with a new integration platform|Keep patching individual links|
G09|data|Customer and item records differ across systems|Same customer under several names and keys|One golden record with a named owner|4|5|2|modeled|Match and merge into a governed reference set the ERP reads from|Rebuild master data in a new system of record|Reconcile by hand when it breaks|
G10|data|Finance numbers have no lineage or owner|Metrics defined in slide decks|Every number has an owner, a formula and a baseline|2|3|1|modeled|Register the top 20 finance metrics with owner, formula and baseline|Rebuild the reporting layer on a new model|Keep decks as the definition|
G11|sc|Supplier onboarding and PO exceptions run on email|Supplier forms and exceptions pass between inboxes|One intake and one exception queue|3|4|2|modeled|An intake form and an exception queue with an agent that drafts the resolution|Replace the procurement module|Keep the inbox|
G12|sc|No early warning when supplier delivery is at risk|Late deliveries found when production waits|Risk flagged days before the miss|3|3|1|modeled|Daily check of open orders against promised dates with alerts to buyers|Rebuild planning in a new supply platform|React when it happens|
G13|ops|Incident and support triage is manual|People classify and route every ticket|First-line triage by an agent with human diagnosis|2|4|0|fact|Ops triage agent in suggest mode in front of the queue|Rebuild the service desk workflows|Keep manual triage|H3
G14|ops|Runbooks are stale and some functions depend on one person|Knowledge lives in heads|Current runbooks and a named backup for every function|2|3|0|fact|Runbook agent plus a cross-training plan|Rewrite the operating model for each function|Accept the key-person risk|H9
G15|gov|Approvals have no policy pre-screen|Approvers read everything|Approvers see exceptions with the evidence|2|3|1|modeled|Pre-screen requests against policy and limits; humans decide|Rebuild the approval policy engine|Keep reading everything|H4
G16|gov|New agents are added without a standard box|Controls differ by builder|Every agent has tier, budget, confidence floor and a kill switch|1|3|0|fact|Make the box a required step in VibeCheck for every new agent|Rebuild agent governance as a platform service|Review agents case by case|`;
X.GAPS=GRAW.split("\n").map(l=>{const a=l.split("|");return{id:a[0],dim:a[1],t:a[2],now:a[3],next:a[4],size:+a[5],reach:+a[6],erp:+a[7],src:a[8],br:a[9],rb:a[10],lv:a[11],hy:(a[12]||"").split(",").filter(Boolean)}});
X.gapById=id=>X.GAPS.find(g=>g.id===id);
/* options: effort in person-weeks, value as a share of the gap's reach, risk 1-5 */
X.options=function(g){
 return{
  rebuild:{k:"rebuild",n:"Rebuild",d:g.rb,eff:g.size*12,val:1,risk:Math.min(5,2+g.erp+Math.floor(g.size/2)),wave:g.size>=4||g.erp>=2?2:1,rev:"hard to reverse"},
  bridge:{k:"bridge",n:"Cover with a bridge",d:g.br,eff:Math.max(2,g.size*4),val:.7,risk:Math.max(1,1+Math.floor(g.erp/1)),wave:1,rev:"easy to reverse"},
  leave:{k:"leave",n:"Leave as is",d:g.lv,eff:0,val:0,risk:1,wave:0,rev:"nothing to reverse",carry:g.reach*6}};
};
X.recommend=function(g,posture){
 const o=X.options(g);let best="bridge",bs=-1;
 ["rebuild","bridge","leave"].forEach(k=>{let s=o[k].val*g.reach*10/(o[k].eff+8);
  if(k==="rebuild"){if(g.erp>=1&&posture==="stay")s*=.35;if(g.erp>=1&&posture==="wean")s*=.6;if(g.erp>=1&&posture==="replace"&&g.reach>=4)s*=1.8;if(g.erp===0)s*=.8}
  if(k==="bridge"&&posture==="wean"&&g.erp>=1)s*=1.15;
  if(k==="leave"){s=g.reach<=2?s=3.5:.2}
  if(s>bs){bs=s;best=k}});
 return best};
X.why=function(g,posture,k){
 const P={stay:"you are keeping the ERP",wean:"you are weaning off the ERP",replace:"you are replacing the ERP"}[posture];
 if(k==="bridge")return "Covers about 70% of the value for about a third of the effort and can be undone. Because "+P+", "+(g.erp>=1&&posture==="replace"?"revisit once the replacement target is firm.":"this is the lowest-regret move now.")+(posture==="wean"&&g.erp>=1?" It also isolates ERP customizations so they can be extracted later.":"");
 if(k==="rebuild")return "Full value, but about three times the effort and harder to undo. It pays here because "+P+" and the reach is high ("+g.reach+" of 5).";
 return "The reach is low ("+g.reach+" of 5), so effort is better spent elsewhere. Revisit if the carrying cost rises.";};
/* ---------- the order-to-cash example: four of seven steps live outside the system ---------- */
X.O2C={n:"Order to cash",steps:[
 {n:"Capture the order",in:true,who:"Order desk",min:12,note:"Entered in the ERP"},
 {n:"Credit check",in:false,who:"Credit analyst",min:35,note:"Spreadsheet and email to the account owner",bridge:"Credit Check Agent reads the ERP balance and history, recommends hold or release; analyst decides",agent:"Credit Check Agent"},
 {n:"Validate price and contract terms",in:false,who:"Order desk",min:25,note:"Looked up in PDF contracts",bridge:"Contract Analyst Agent (existing) returns the price and terms with the clause cited",agent:"Contract Analyst Agent (existing)"},
 {n:"Schedule fulfillment",in:true,who:"Fulfillment planner",min:20,note:"In the ERP"},
 {n:"Issue the invoice",in:true,who:"Billing",min:10,note:"In the ERP"},
 {n:"Apply cash",in:false,who:"Cash application",min:40,note:"Bank portal downloads matched by hand",bridge:"Cash Match Agent proposes matches above a confidence floor; the rest go to a person",agent:"Cash Match Agent"},
 {n:"Resolve disputes",in:false,who:"Collections",min:55,note:"Email threads, no shared record",bridge:"Dispute queue with an agent that drafts the response and files the outcome in the ERP",agent:"Dispute Desk Agent"}
]};
X.o2cStats=function(mode){/* mode: now | bridge | rebuild */
 const S0=X.O2C.steps,out=S0.filter(s=>!s.in).length;
 if(mode==="now")return{inSys:S0.length-out,total:S0.length,min:sum(S0.map(s=>s.min)),weeks:0,risk:1,days:6.5};
 if(mode==="bridge")return{inSys:S0.length,total:S0.length,min:sum(S0.map(s=>s.in?s.min:Math.round(s.min*.45))),weeks:16,risk:2,days:3.8};
 return{inSys:S0.length,total:S0.length,min:sum(S0.map(s=>Math.round(s.min*.4))),weeks:48,risk:4,days:3.2}};

/* ---------- measures and agents per gap, then the roadmap generator ---------- */
const MRAW=`G01|Staff above 100% load|%|p:P06|5|fact
G02|Requisitions with an agent-share line|%|0|100|modeled
G03|Fields re-keyed per order|fields|34|8|modeled
G04|Requests with self-serve status|%|10|90|modeled
G05|Processes with a cost per transaction|%|5|60|modeled
G06|Module spend backed by usage evidence|%|20|100|modeled
G07|Order-to-cash steps recorded in the system|%|43|100|modeled
G08|Integrations on the shared layer|%|0|60|modeled
G09|Customers with one golden record|%|62|98|modeled
G10|Finance metrics with owner, formula and baseline|%|15|100|modeled
G11|Supplier exceptions resolved in the queue|%|0|85|modeled
G12|Late orders flagged before the miss|%|0|70|modeled
G13|Tickets triaged by an agent within 5 minutes|%|0|60|modeled
G14|Functions with a current runbook and named backup|%|40|100|modeled
G15|Approvals pre-screened|%|0|70|modeled
G16|Agents with a complete box|%|p:P17|100|fact`;
X.FORM={"G01": "Staff above 100% workload / headcount", "G02": "Open requisitions with an agent-share line / open requisitions", "G03": "Fields typed more than once per order, averaged over a month", "G04": "Requests with a self-serve status view / all requests", "G05": "Processes with a cost per transaction / processes in scope", "G06": "Module spend with usage evidence / total module spend", "G07": "Order-to-cash steps recorded in the system / steps", "G08": "Integrations on the shared layer / integrations", "G09": "Customers with one matched record / customers", "G10": "Finance metrics with owner, formula and baseline / finance metrics", "G11": "Supplier exceptions closed in the queue / supplier exceptions", "G12": "Late orders flagged at least 2 days early / late orders", "G13": "Tickets triaged by an agent within 5 minutes / tickets", "G14": "Functions with a current runbook and a named backup / functions", "G15": "Approvals pre-screened by an agent / approvals", "G16": "Agents with tier, budget, confidence floor and kill switch / agents"};
X.MEAS={};MRAW.split("\n").forEach(l=>{const a=l.split("|");X.MEAS[a[0]]={n:a[1],u:a[2],base:a[3],target:+a[4],src:a[5]}});
X.measure=function(gid){const m=X.MEAS[gid];if(!m)return null;let b=m.base;
 if(String(b).indexOf("p:")===0){const p=X.PR.find(x=>x.id===b.slice(2));b=p?X.prVal(p):0}
 return{n:m.n,u:m.u,base:+b||0,target:m.target,src:m.src,id:gid,f:X.FORM[gid]||""}};
X.AGENT={G03:"Capture Assistant",G04:"Status Reporter",G05:"Forecast Agent (existing) plus a new Cost Tracker",G06:"Renewal Checker",G07:"Contract Analyst Agent (existing); new: Credit Check, Cash Match and Dispute Desk agents",G08:"Interface Watcher",G09:"Match and Merge Agent",G10:"Metric Registrar",G11:"Exception Drafter",G12:"Delivery Watcher",G13:"Triage Agent (existing)",G14:"Knowledge Curator (existing)",G15:"Invoice Advisor (existing)",G16:"Box Checker",G01:"Resource Agent (existing)",G02:""};
X.box=function(g){return{tier:g.erp>=1?"suggest":"suggest",budget:150*g.size,floor:g.erp>=2?.9:.85,kill:"this agent and its workflow"}};
X.choiceOf=function(g,posture,choices){return(choices&&choices[g.id])||X.recommend(g,posture)};
X.roadmap=function(posture,choices){
 const steps=[];let n=0;const D={};X.DIMS.forEach(d=>D[d.k]=d);
 const mk=o=>{o.id="S"+String(++n).padStart(2,"0");steps.push(o);return o};
 X.DIMS.forEach(d=>{
  mk({dim:d.k,wave:0,gap:"",type:"Prepare",title:d.n+": name the owner, define the measures, agree the first gate",
   acts:["Name the owner: "+d.owner,"Define each measure with an owner, formula and baseline","Freeze today's baseline and date it","Agree the gate that decides whether wave 1 starts"],owner:d.owner,measure:null,retrain:"",agent:""})});
 X.GAPS.forEach(g=>{
  const k=X.choiceOf(g,posture,choices),d=D[g.dim],m=X.measure(g.id),o=X.options(g)[k];
  if(k==="leave")return;
  if(k==="bridge"){
   const w=(g.erp===0&&g.size<=2)?0:1;
   mk({dim:g.dim,wave:w,gap:g.id,type:"Bridge",title:g.t,
    acts:["Map today's manual steps and who does them","Build the bridge in VibeCheck: "+g.br,"Run a pilot with 3 to 5 people next to today's way","Train: "+d.retrain,"Compare to baseline, then keep, extend or hand to wave 2"],
    owner:d.owner,measure:m,retrain:d.retrain+". Learning Coach (existing agent) nudges completion",agent:X.AGENT[g.id]||"",box:X.AGENT[g.id]?X.box(g):null,eff:o.eff});
   if(g.erp>=1&&posture==="wean")mk({dim:g.dim,wave:3,gap:g.id,type:"Extract",title:"Extract the ERP customization the bridge now covers: "+g.t,
    acts:["List the customization and everyone who uses it","Confirm nothing else depends on it","Switch it off for one group, then for all","Remove it and record the saving"],owner:D.tech.owner,measure:null,retrain:"Affected users briefed before the switch-off",agent:"",eff:Math.max(2,g.size*2)});
   else if(g.erp>=1&&posture==="stay")mk({dim:g.dim,wave:2,gap:g.id,type:"Harden",title:"Make staying easy: keep the ERP upgrade-safe around "+g.t,
    acts:["Document the interfaces the bridge relies on","Add tests that run before every ERP upgrade","Move logic out of ERP customization where the bridge now holds it"],owner:D.tech.owner,measure:null,retrain:"Platform team runs the upgrade rehearsal",agent:"",eff:Math.max(2,g.size)});
  }else{
   mk({dim:g.dim,wave:o.wave,gap:g.id,type:"Rebuild",title:g.t,
    acts:["Design the target process with the people who run it","Build it in VibeCheck with the agent box set","Migrate the data and run both ways in parallel","Cut over group by group with a rollback plan","Retire the old path and record the saving"],
    owner:d.owner,measure:m,retrain:d.retrain+". Learning Coach (existing agent) nudges completion",agent:X.AGENT[g.id]||"",box:X.AGENT[g.id]?X.box(g):null,eff:o.eff});
   if(g.erp>=1&&posture==="replace")mk({dim:g.dim,wave:3,gap:g.id,type:"Retire",title:"Retire the ERP module this replaces: "+g.t,
    acts:["Confirm every consumer has moved","Archive history in a read-only store","Switch off licences at the next renewal date"],owner:D.tech.owner,measure:null,retrain:"",agent:"",eff:Math.max(2,g.size*2)})}
 });
 steps.sort((a,b)=>a.wave-b.wave||X.DIMS.findIndex(x=>x.k===a.dim)-X.DIMS.findIndex(x=>x.k===b.dim)||a.id.localeCompare(b.id));
 return steps};
X.signalLevel=function(agg,k){const vals=Object.values(agg).filter(v=>v>0).sort((a,b)=>b-a),v=agg[k]||0;if(v<=0)return"none";if(v>=vals[0])return"high";if(v>=(vals[2]||0))return"medium";return"low"};
/* simulated actuals for the impact view: progress by month with a seeded wobble. These are not measurements. */
X.simActual=function(base,target,month,seed){let h=0;for(let i=0;i<seed.length;i++)h=(h*31+seed.charCodeAt(i))%997;const wob=.85+(h%30)/100,p=Math.min(1,Math.max(0,(month/6)));const ease=p*p*(3-2*p);return base+(target-base)*Math.min(1,ease*wob)};
})();
