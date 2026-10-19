/* ============ Budget requests (Round 13): an input funnel (guided Request budget form) and a decision funnel (staged review,
   routed by amount through the delegation of authority, decided at the matching funding gate), with funnel analytics.
   Reuses: budget lines and reserve (window.BUDX, mod_budget), DOA (window.DOA), colors and gates (window.FIN), demand scoring (DEMAND, dscore),
   owners by domain (window.ORGX, guarded), the Needs you inbox (INBOX.adapters). ============ */
(function(){
"use strict";
const K=()=>window.BUDX||null;
const H=s=>esc(s==null?"":String(s));
const D$=n=>typeof money==="function"?money(n):"$"+Math.round(n).toLocaleString("en-US");
const tryv=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const TODAY=Date.UTC(2026,9,6);
const iso=ms=>new Date(ms).toISOString().slice(0,10);
const ms=s=>Date.parse(s+"T12:00:00Z");
const dago=n=>iso(TODAY-n*864e5);
const dbet=(a,b)=>Math.round((ms(b)-ms(a))/864e5);
const fD=s=>new Date(ms(s)).toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"});
const CATS=["Labor","Vendor","Hardware","Cloud","Licences"];
const TYPES=["New initiative","Increase","Reallocation","One-time","Emergency"];
/* ---------- stages ---------- */
const STG=[
 {id:"sub",n:"Submitted",domain:"budget",role:"Requester",sla:0,fb:["",""],entry:"A complete request form with a human sponsor.",opts:["Submit"],sn:"Submitted"},
 {id:"tri",n:"Triage",domain:"portfolio",role:"Portfolio office",sla:2,fb:["Maya Ortiz","Priya Shah"],entry:"Form complete, sponsor is a person, objective linked, no unresolved duplicate.",opts:["Accept and route","Return to requester","Merge as duplicate","Decline"]},
 {id:"fin",n:"Finance review",domain:"budget",role:"Finance business partner",sla:3,fb:["Avery Chen","Jordan Lee"],entry:"Triaged. Cost model adds up to the ask; a color and source are proposed.",opts:["Approve and next","Return to requester","Defer","Decline"]},
 {id:"arc",n:"Architecture and security review",domain:"security",role:"Architecture and security lead",sla:4,fb:["Dev Rao","Tom Becker"],entry:"Finance fit confirmed. Existing architecture and security reviews are linked or requested.",opts:["Approve and next","Approve with conditions","Return to requester","Decline"]},
 {id:"val",n:"Business value scoring",domain:"portfolio",role:"Portfolio analyst",sla:3,fb:["Maya Ortiz","Priya Shah"],entry:"Review passed. Strategy fit, return, risk reduction and urgency are scored the same way as demand.",opts:["Approve and next","Re-score","Defer","Decline"]},
 {id:"cnc",n:"Portfolio council ranking",domain:"strategy",role:"Portfolio council",sla:7,fb:["Casey Rowan","Maya Ortiz"],entry:"Scored. The council ranks it against other asks inside the envelope.",opts:["Approve and next","Defer to next cycle","Decline"]},
 {id:"dec",n:"Funding decision",domain:"budget",role:"Approver set by delegation of authority",sla:3,fb:["Casey Rowan","Avery Chen"],entry:"Ranked or routed. The approver for the amount decides at the matching funding gate.",opts:["Approve and fund","Defer","Decline"]},
 {id:"done",n:"Approved and funded",domain:"budget",role:"Finance",sla:0,fb:["Avery Chen",""],entry:"A budget line exists and the gate is recorded.",opts:[],sn:"Funded"}];
const SB=Object.fromEntries(STG.map(s=>[s.id,s]));
const FLOWS=["sub","tri","fin","arc","val","cnc","dec","done"];
const ENDS={declined:["Declined","bad"],deferred:["Deferred","warn"],funded:["Approved and funded","good"],returned:["Returned to requester","info"]};
const DEFRULES=[
 {id:"A",max:10000,stages:["tri","dec"],note:"Small asks: triage, then the budget owner decides."},
 {id:"B",max:25000,stages:["tri","fin","dec"],note:"Finance checks fit before the portfolio lead decides."},
 {id:"C",max:100000,stages:["tri","fin","arc","dec"],note:"Adds architecture and security review before the CIO decides."},
 {id:"D",max:250000,stages:["tri","fin","arc","val","dec"],note:"Adds business value scoring before the CFO decides."},
 {id:"E",max:Infinity,stages:["tri","fin","arc","val","cnc","dec"],note:"Council ranks it, then the CEO or board decides."}];
/* ---------- state and seeds ---------- */
const S_=S.br=S.br||{};
const PEOPLE_FB={tri:["Maya Ortiz","Priya Shah"]};
function seed(){
 const R=[
 /* id,title,type,amt,yrs,cost,color,src,proj,line,req,sp,cc,obj,ben,risk,stage,hist(days in earlier stages),ago(days in current),dem,why,alt,flags */
 ["BR-0101","Next hosting tier for the Standards Portal","Increase",48000,1,{Cloud:48000},"OP-U","Management reserve","PR1","PR1-CLD","Tom Becker","Tom Becker","CC-4420","O2",90000,"High","dec",[1,2,2,3,2],1,null,"After the Oct 5 latency incident the portal needs the next hosting tier, adding $48K over the year.","Tune the current tier (tried, failed under load); move to a second region (costs $120K)."],
 ["BR-0102","Retire the legacy lease subledger","New initiative",680000,2,{Labor:260000,Vendor:340000,Licences:80000},"BD-C","Restricted color","PR4","","Avery Chen","Avery Chen","CC-4430","O2",910000,"High","cnc",[1,2,3,4,3],5,"D3","The old subledger cannot support the lease accounting amendment effective Jan 1, 2027.","Patch the subledger (no vendor support after Dec); outsource to a service bureau (higher run cost)."],
 ["BR-0103","Editor experience: mobile approvals for editors","New initiative",540000,2,{Labor:300000,Vendor:200000,Licences:40000},"OP-U","Operating budget","PR1","","Priya Shah","Chief Editor","CC-4411","O1",480000,"Medium","val",[1,2,2,3],2,"D4","Lets editors approve changes from a phone, cutting the time to publish.","Responsive web only (cheaper, weaker offline)."],
 ["BR-0104","AI drafting assistant for standards","New initiative",350000,1,{Labor:150000,Cloud:120000,Licences:80000},"XR-P","Restricted color","PR1","","Dev Rao","CEO office","CC-4411","O1",1400000,"High","arc",[1,1,3,5],3,"D6","Drafts first versions from approved source text with every sentence cited.","Buy a drafting tool (no citation control)."],
 ["BR-0105","Disaster recovery for the Standards Portal","New initiative",460000,1,{Labor:140000,Cloud:200000,Hardware:80000,Vendor:40000},"BD-O","Restricted color","PR3","","Tom Becker","CIO","CC-4420","O2",800000,"High","dec",[1,2,3,4,6,4],2,"D7","The Sev 2 incident showed there is no tested failover. Tier 1 availability depends on it.","Accept the downtime risk (Tier 1 breach)."],
 ["BR-0106","Lumen change order CO-2 funding","Increase",45000,1,{Vendor:45000},"OP-U","Management reserve","PR2","PR2-VEN","Dev Rao","Dev Rao","CC-4412","O2",0,"Medium","fin",[1,2],5,null,"Change order CO-2 was signed on Sep 22 without a budget transfer.","Reject the change order (it was already signed)."],
 ["BR-0107","Standby region: last $5K","Increase",5000,1,{Cloud:5000},"BD-O","Operating budget","PR3","PR3-CLD","Tom Becker","Tom Becker","CC-4420","O2",0,"Low","funded",[1,1],0,null,"Standby capacity priced above the first estimate.","Smaller standby (loses the failover target)."],
 ["BR-0108","Vendor risk scorecards","New initiative",210000,1,{Labor:90000,Licences:60000,Vendor:60000},"OP-U","Operating budget","PR4","","Maya Ortiz","CFO","CC-4430","O2",600000,"Medium","tri",[],1,"D5","Turns the vendor index into a monthly scorecard before renewals.","Spreadsheet scorecards by hand."],
 ["BR-0109","Meeting room AV refresh","One-time",160000,1,{Hardware:140000,Vendor:20000},"OP-U","Operating budget","PR3","","Sam Patel","COO","CC-4420","",90000,"Low","declined",[1,2,3,4,5],3,null,"Replaces ageing cameras and displays in four rooms.","Replace two rooms only."],
 ["BR-0110","Data warehouse consolidation","New initiative",900000,3,{Labor:420000,Cloud:300000,Vendor:180000},"OP-U","Operating budget","PR2","","Dev Rao","CIO","CC-4412","O2",1200000,"High","deferred",[1,2,3,4,5,7],4,null,"Merges three warehouses into one. It overlaps the Taxonomy Data Hub.","Fold into the Data Hub roadmap."],
 ["BR-0111","Test-lead capacity for integration testing","Increase",20000,1,{Labor:20000},"OP-U","Management reserve","PR1","PR1-LAB","Priya Shah","Priya Shah","CC-4411","O1",0,"Low","funded",[1,2,2],0,null,"Integration testing needs 1.5 more test-lead FTE for two months.","Move the migration rehearsal two weeks."],
 ["BR-0112","Reviewer workload dashboard","New initiative",120000,1,{Labor:80000,Licences:40000},"OP-U","Operating budget","PR1","","Priya Shah","Chief Editor","CC-4411","O1",340000,"Low","tri",[],6,"D2","Shows who is overloaded with reviews so deadlines stop slipping.","Reuse the publishing analytics request (D10).","dup"],
 ["BR-0113","Contract repository storage growth","One-time",18000,1,{Cloud:18000},"OP-U","Operating budget","PR4","PR4-CLD","Maya Ortiz","Maya Ortiz","CC-4430","O2",0,"Low","fin",[1],1,null,"Scanned contract backfill doubles storage this year.","Archive older scans offline."],
 ["BR-0114","Web application firewall after the Oct 5 incident","Emergency",32000,1,{Cloud:22000,Licences:10000},"BD-O","Management reserve","PR1","","Tom Becker","Tom Becker","CC-4420","O2",0,"High","fin",[0],0,null,"The latency incident included hostile traffic. A managed firewall rule set closes the exposure this week.","Rate limiting only (leaves injection traffic through)."]];
 return R.map(r=>mkSeed(r));
}
function mkSeed(a){
 const [id,t,type,amt,yrs,cost,color,src,proj,line,req,sp,cc,obj,ben,risk,st,hist,ago,dem,why,alt,flag]=a;
 const r={id,t,type,amt,yrs,cost,color,src,proj,line,req,sp,cc,obj,ben,risk,alt,why,what:t+". "+why,att:"",dem,dupOf:flag==="dup"?"D10":"",cm:[],rv:{},sc:null,st,tl:[],rank:0};
 r.route=route(r);
 const stages=r.route.filter(s=>s!=="sub");const total=sum(hist,x=>x)+ago;let day=total;
 r.tl.push({d:dago(day),st:"sub",k:"enter",ev:"Submitted by "+req+" with sponsor "+sp,by:req});
 const done=st==="funded"||st==="declined"||st==="deferred";
 const upto=done?stages.length:Math.max(0,stages.indexOf(st));
 for(let i=0;i<Math.min(upto+(done?0:1),stages.length);i++){const s=stages[i];
  r.tl.push({d:dago(day),st:s,k:"enter",ev:"Entered "+SB[s].n,by:"System"});
  const dw=i<hist.length?hist[i]:ago;
  if(i<upto||done){day-=dw;const last=done&&i===stages.length-1;
   if(done&&i===hist.length-1&&st!=="funded"){r.rv[s]={dec:st==="declined"?"Decline":"Defer",by:rev(s,r).name,d:dago(day),note:st==="declined"?"Low strategic fit for the cost. Revisit in the next planning cycle.":"Overlaps the Taxonomy Data Hub roadmap; decide after its design review."};r.tl.push({d:dago(day),st:s,k:"end",ev:(st==="declined"?"Declined":"Deferred")+" at "+SB[s].n,by:rev(s,r).name});break}
   r.rv[s]={dec:"Approve",by:rev(s,r).name,d:dago(day),note:"Meets the entry criteria."};r.tl.push({d:dago(day),st:s,k:"exit",ev:SB[s].n+" passed",by:rev(s,r).name})}}
 if(st==="funded"){r.tl.push({d:dago(0),st:"done",k:"end",ev:"Funded: budget line "+(line||"created"),by:"Finance"});r.lineId=line}
 if(!done&&st!=="sub")r.stIn=dago(ago);
 r.sc=scoreOf(r);return r}
/* ---------- routing, reviewers, gates ---------- */
const RULES=()=>S_.rules;
function route(r){
 if(r.type==="Emergency")return ["sub","tri","fin","dec"];
 if(r.type==="Reallocation")return ["sub","tri","fin","dec"];
 const t=RULES().find(x=>r.amt<=x.max)||RULES()[RULES().length-1];return ["sub"].concat(t.stages)}
function tierOf(r){return RULES().find(x=>r.amt<=x.max)||RULES()[RULES().length-1]}
function norm(x){if(!x)return "";if(typeof x==="string")return x;return x.name||tryv(()=>ORGX.P(x.ownerId||x.id).name,"")||""}
function rev(sid,r){
 const s=SB[sid];let name="",back="",via="";
 if(sid==="dec"){const d=tryv(()=>DOA.approverFor(r.amt,r.type==="Emergency"||/reserve/i.test(r.src)?"Reserve release":"",r.req,{proj:r.proj}),null);
  if(d){name=/Casey/.test(d.name)?"Casey Rowan":d.name;via="Delegation of authority, tier "+d.tier+" ("+d.role+")";return {name:name,back:s.fb[1],role:d.role,via,isPerson:/^[A-Z][a-z]+ [A-Z]/.test(name)}}}
 if(window.ORGX&&ORGX.byDomain){const o=tryv(()=>ORGX.byDomain(s.domain),null);if(o){name=norm(o.owner)||norm(o.name)||norm(o[0]);back=norm(o.backup)||norm(o.backupId&&ORGX.P(o.backupId));if(name)via="Owner of the "+s.domain+" domain (ORGX)"}}
 if(!name){name=s.fb[0];back=s.fb[1];via="Default reviewer (organization directory not loaded)"}
 if(name===r.req&&back){name=back;via+="; requester cannot review own request, backup used"}
 return {name,back:back||s.fb[1],role:s.role,via,isPerson:true}}
function gateFor(r){
 const cur=tryv(()=>FIN.gateBoard.board().find(b=>b.id===r.proj).gate,"G2");
 if(r.type==="New initiative"||r.type==="One-time")return {id:"G1",why:"A new commitment is authorized at G1 Fund, where the color and source are assigned."};
 if(r.type==="Emergency")return {id:cur,why:"Emergency spend is authorized at the project's current gate ("+cur+") and reviewed after the fact."};
 if(r.type==="Reallocation")return {id:cur,why:"Moving money does not change the gate; the color rules are re-checked on the receiving line."};
 return {id:cur,why:"An increase is decided at the project's current gate ("+cur+"); a material change goes back to G5."}}
/* ---------- scoring (same formula as demand scoring) ---------- */
function scoreOf(r){
 const d=r.dem&&tryv(()=>DEMAND.find(x=>x.id===r.dem),null);
 if(d)return {s:d.strat,f:Math.min(5,+(d.ben/d.cost*2).toFixed(1)),r:d.risk,u:d.urg,from:"Demand item "+d.id};
 const roi=r.ben*r.yrs/Math.max(1,r.amt);
 return {s:r.obj?4:2,f:Math.min(5,+(roi*2).toFixed(1)),r:r.risk==="High"?4:r.risk==="Medium"?3:1,u:r.type==="Emergency"?5:r.type==="Increase"?3:2,from:"Scored from the form"}}
function scoreNum(sc){const w=tryv(()=>DW0,{s:.35,f:.25,r:.2,u:.2}),t=w.s+w.f+w.r+w.u||1;return Math.round((w.s*sc.s+w.f*sc.f+w.r*sc.r+w.u*sc.u)/t/5*100)}
/* ---------- dwell, SLA, stuck ---------- */
function visits(r){const out=[];const tl=r.tl.slice().sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
 tl.forEach((e,i)=>{if(e.k!=="enter")return;let end=null;for(let j=i+1;j<tl.length;j++){if(tl[j].k==="exit"&&tl[j].st===e.st){end=tl[j].d;break}if(tl[j].k==="end"){end=tl[j].d;break}if(tl[j].k==="enter"&&tl[j].st!==e.st){end=tl[j].d;break}}
  const open=!end&&!isEnd(r)&&r.st===e.st;if(!end&&!open)end=e.d;out.push({st:e.st,d0:e.d,d1:end||iso(TODAY),days:dbet(e.d,end||iso(TODAY)),open})});return out}
const isEnd=r=>!!ENDS[r.st];
const curDays=r=>isEnd(r)?0:dbet(r.stIn||r.tl[r.tl.length-1].d,iso(TODAY));
const slaOf=(r,sid)=>Math.max(1,Math.round(SB[sid].sla*(r.type==="Emergency"?.34:1)));
function stuck(r){
 if(isEnd(r))return null;const sid=r.st,d=curDays(r),sla=slaOf(r,sid),v=rev(sid,r),k=K();
 if(sid==="sub")return null;
 if(d<=sla)return {lvl:"good",t:"On track: "+d+" of "+sla+" days in "+SB[sid].n+". Waiting on "+v.name+"."};
 let why="";
 if(sid==="tri"&&r.dupOf)why="Triage found a possible duplicate of demand item "+r.dupOf+"; it needs a merge or keep decision.";
 else if(sid==="fin"&&k&&/reserve/i.test(r.src)&&r.amt>k.resBal()-k.resPend())why="The ask is more than the reserve has free ("+D$(k.resBal()-k.resPend())+"); Finance is waiting for a different source.";
 else if(sid==="arc")why="Architecture and security review has a queue of "+FLOWS.length+" items; a linked review may be missing evidence.";
 else if(sid==="cnc")why="The council meets monthly; this request is waiting for the next ranking session.";
 else if(sid==="dec")why="Waiting for "+v.name+" ("+v.role+"). Backup: "+(v.back||"none")+".";
 else why=v.name+" has not decided; the backup is "+(v.back||"not named")+".";
 return {lvl:d>2*sla?"bad":"warn",t:d+" days in "+SB[sid].n+" against a "+sla+"-day target. "+why+" Nudge "+v.name+" or move to the backup."}}
/* ---------- state init ---------- */
if(!S_.reqs){S_.rules=DEFRULES.map(x=>({...x,stages:x.stages.slice()}));S_.reqs=seed();S_.nx=115;S_.tab=0;S_.log=[]}
const RQ=()=>S_.reqs;
const byId=id=>RQ().find(r=>r.id===id);
/* ---------- metrics ---------- */
function dwellBy(){const o={};STG.forEach(s=>o[s.id]=[]);RQ().forEach(r=>visits(r).forEach(v=>{if(v.st!=="sub"&&v.st!=="done"&&o[v.st])o[v.st].push(v)}));return o}
const med=a=>{if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2};
function stats(){
 const rs=RQ(),dw=dwellBy(),open=rs.filter(r=>!isEnd(r)),closed=rs.filter(r=>isEnd(r));
 const per=STG.filter(s=>s.id!=="sub"&&s.id!=="done").map(s=>{
  const reached=rs.filter(r=>r.tl.some(e=>e.st===s.id&&e.k==="enter")),here=rs.filter(r=>r.st===s.id),dwd=dw[s.id].map(v=>v.days);
  const pass=reached.filter(r=>r.rv[s.id]&&r.rv[s.id].dec==="Approve").length,decided=reached.filter(r=>r.rv[s.id]).length;
  const ontime=dw[s.id].filter(v=>v.days<=s.sla).length;
  return {id:s.id,n:s.n,sla:s.sla,reached:reached.length,here:here.length,amt:sum(reached,r=>r.amt),amtHere:sum(here,r=>r.amt),med:+med(dwd).toFixed(1),avg:dwd.length?+(sum(dwd,x=>x)/dwd.length).toFixed(1):0,pass,decided,conv:decided?Math.round(pass/decided*100):0,sla_pct:dw[s.id].length?Math.round(ontime/dw[s.id].length*100):100,ratio:s.sla?(dwd.length?sum(dwd,x=>x)/dwd.length/s.sla:0):0}});
 const cyc=closed.filter(r=>r.st==="funded"||r.st==="declined"||r.st==="deferred").map(r=>dbet(r.tl[0].d,r.tl[r.tl.length-1].d));
 const funded=rs.filter(r=>r.st==="funded").length;
 const stuckN=open.filter(r=>{const x=stuck(r);return x&&x.lvl==="bad"}).length;
 const worst=per.filter(p=>p.reached).sort((a,b)=>b.ratio-a.ratio)[0];
 const all=per.filter(p=>p.decided);
 return {per,open,closed,cycle:+(cyc.length?sum(cyc,x=>x)/cyc.length:0).toFixed(1),funded,total:rs.length,rate:closed.length?Math.round(funded/closed.length*100):0,stuckN,worst,
  conv:rs.length?Math.round(funded/rs.length*100):0,sla:all.length?Math.round(sum(all,p=>p.sla_pct)/all.length):100,
  openAmt:sum(open,r=>r.amt),first:Math.round(rs.filter(r=>!(r.rv.tri&&r.rv.tri.returned)).length/Math.max(1,rs.length)*100)}}
Object.assign(METRICS,{
 m_br_cycle:{n:"Budget request cycle time",f:"Date of funding decision − Date submitted, in days, for requests that reached a decision",u:" days",cur:14,tgt:15,badAt:25,dir:"min",max:40,tr:[24,22,21,19,18,17,15,14],owner:"Finance business partner",use:["Budget requests"],rem:{kind:"agent",ref:"Budget Request Agent",title:"Nudge slow stages",agent:"Budget Request Agent",auto:false,state:"idle",prog:"Reminds the reviewer at 80% of the stage target and offers the backup at 100%"}},
 m_br_conv:{n:"Request funnel conversion",f:"Requests approved and funded ÷ Requests submitted × 100",u:"%",cur:21,tgt:30,badAt:12,dir:"max",max:100,tr:[18,19,20,20,21,21,21,21],owner:"Portfolio office",use:["Budget requests"],rem:{kind:"sop",ref:"SOP-330",title:"Coach requesters before submit",agent:"Budget Request Agent",auto:false,state:"idle",prog:"Flags thin business cases and duplicates before they enter triage"}},
 m_br_sla:{n:"Review stages inside target",f:"Stage visits that ended within the stage target days ÷ All stage visits × 100",u:"%",cur:70,tgt:85,badAt:60,dir:"max",max:100,tr:[80,78,76,75,73,72,71,70],owner:"Finance business partner",use:["Budget requests"],rem:{kind:"sop",ref:"SOP-331",title:"Rebalance reviewers",agent:"Budget Request Agent",auto:false,state:"idle",prog:"Proposes backup reviewers for the slowest stage"}},
 m_br_stuck:{n:"Requests stuck past twice the target",f:"Count of open requests whose days in the current stage exceed 2 × that stage's target",u:"",cur:2,tgt:0,badAt:4,dir:"min",max:10,tr:[0,1,1,2,2,3,2,2],owner:"Portfolio office",use:["Budget requests"],rem:{kind:"kb",ref:"KB-140",title:"Unblock a stalled budget request",agent:"Budget Request Agent",auto:false,state:"idle",prog:"Explains why each request is stuck and drafts the nudge"}},
 m_br_first:{n:"Requests complete at first submit",f:"Requests not returned at triage ÷ Requests submitted × 100",u:"%",cur:86,tgt:90,badAt:70,dir:"max",max:100,tr:[70,74,78,80,82,84,85,86],owner:"Portfolio office",use:["Budget requests"],rem:{kind:"kb",ref:"KB-141",title:"Write a request that passes triage",agent:"Budget Request Agent",auto:false,state:"idle",prog:"Drafts missing sections of the form from similar approved requests"}}});
function syncM(){const s=stats(),set=(id,v)=>{const m=METRICS[id];if(m){m.cur=v;m.tr=m.tr.slice(0,7).concat([v])}};set("m_br_cycle",s.cycle);set("m_br_conv",s.conv);set("m_br_sla",s.sla);set("m_br_stuck",s.stuckN);set("m_br_first",s.first)}
/* ---------- duplicates, similar, colors, what-if ---------- */
const tok=t=>String(t||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>3&&!/^(with|from|that|this|their|them|have|will|into|more|than|over|new|for|the)$/.test(w));
const jac=(a,b)=>{const A=new Set(tok(a)),B=new Set(tok(b));if(!A.size||!B.size)return 0;let i=0;A.forEach(w=>{if(B.has(w))i++});return i/(A.size+B.size-i)};
function dupes(title,text,exclude){const out=[];const t=title+" "+(text||"");
 tryv(()=>K().B().lines,[]).forEach(l=>{const s=jac(t,l.n+" "+(l.why||""));if(s>=.18)out.push({kind:"Budget line",id:l.id,t:l.n,s,go:()=>go("bud_over")})});
 tryv(()=>DEMAND,[]).forEach(d=>{const s=jac(t,d.n+" "+d.why);if(s>=.2)out.push({kind:"Demand item",id:d.id,t:d.n,s,go:()=>go("port")})});
 RQ().forEach(r=>{if(r.id===exclude)return;const s=jac(t,r.t+" "+r.why);if(s>=.2)out.push({kind:"Budget request",id:r.id,t:r.t,s,go:()=>openReq(r.id)})});
 return out.sort((a,b)=>b.s-a.s).slice(0,4)}
function colorOpts(){return tryv(()=>FIN.colors.map(c=>[c.id,c.id+" · "+c.name]),[["OP-U","OP-U · Operating: unrestricted"]])}
function headroomOf(id){const h=tryv(()=>FIN.headroom(id),null);if(h==null)return null;return typeof h==="object"?(h.headroom!=null?h.headroom:h.head):h}
function suggestColor(v){
 const a=+v.amt||0,c=v.cost||{},cap=(c.Hardware||0)+(v.type==="New initiative"?.8*((c.Labor||0)+(c.Vendor||0)):0),txt=(v.what||"")+" "+(v.why||"")+" "+(v.t||"");
 let id="OP-U",why="Operating cost with no purpose restriction; any approved operating budget can fund it.";
 if(v.type==="Emergency"){id="BD-O";why="Emergency resilience work fits the board-designated operating reserve."}
 else if(a&&cap/a>=.5){id="XR-K";why="More than half of the cost is build or hardware, which the capital-restricted color allows once the asset is placed in service."}
 else if(/taxonom|data standard|gift|donor/i.test(txt)){id="XR-P";why="The words in the request match the purpose of the taxonomy and data gift."}
 else if(/reserve|resilien|failover|standby/i.test(txt)){id="BD-O";why="Resilience work matches the board-designated operating reserve."}
 const known=colorOpts().some(o=>o[0]===id);return {id:known?id:"OP-U",why,head:headroomOf(id)}}
function whatIf(r){
 const k=K();if(!k)return null;const bal=k.resBal(),pend=k.resPend(),res=/reserve/i.test(r.src),T=k.T(k.B().lines);
 const fcst=T.fcst+(r.type==="Reallocation"?0:r.amt),appr=T.appr;
 return {res,bal,pend,after:res?bal-pend-r.amt:bal-pend,ok:!res||bal-pend>=r.amt||r.st==="funded",varNow:T.fcst-T.appr,varAfter:fcst-(res||r.type==="Increase"&&!res?appr:appr+r.amt),fcst}}
/* ---------- actions ---------- */
function log(r,k,ev,by,st){r.tl.push({d:iso(TODAY),st:st||r.st,k,ev,by:by||tryv(()=>INBOX.me(),"Casey Rowan")})}
const ME=()=>tryv(()=>INBOX.me(),"Casey Rowan");
function enter(r,sid){r.st=sid;r.stIn=iso(TODAY);log(r,"enter","Entered "+SB[sid].n,"System",sid);const v=rev(sid,r);tryv(()=>window.INBOX&&INBOX.refresh())}
function nextStage(r){const i=r.route.indexOf(r.st);return r.route[i+1]||"done"}
function decide(id,act,note,by){
 const r=byId(id);if(!r||isEnd(r)||r.st==="sub")return {ok:false,why:"That request is not waiting for a decision."};
 by=by||ME();const sid=r.st;
 if(by===r.req)return {ok:false,why:"Separation of duties: the requester cannot decide their own request."};
 if(act!=="Approve"&&!String(note||"").trim())return {ok:false,why:"A reason is required."};
 const rvw=rev(sid,r),onBehalf=by!==rvw.name&&by!==rvw.back&&!(rvw.role==="CIO"&&by==="Casey Rowan");
 r.rv[sid]={dec:act,by,d:iso(TODAY),note:note||"",behalf:onBehalf};
 const tag=onBehalf?" (on behalf of "+rvw.name+")":"";
 if(act==="Approve"){log(r,"exit",SB[sid].n+" passed"+tag+(note?": "+note:""),by,sid);
  if(sid==="dec")return fund(r,by);
  const nx=nextStage(r);enter(r,nx==="done"?"dec":nx);audit("Budget request advanced",r.id+" "+SB[sid].n+" to "+SB[r.st].n);return {ok:true,next:r.st}}
 if(act==="Return"){r.rv[sid].returned=true;r.st="returned";log(r,"end","Returned to "+r.req+": "+note,by,sid);audit("Budget request returned",r.id+": "+note);tryv(()=>INBOX.refresh());return {ok:true}}
 const end=act==="Defer"?"deferred":"declined";r.st=end;log(r,"end",(act==="Defer"?"Deferred":"Declined")+" at "+SB[sid].n+tag+": "+note,by,sid);audit("Budget request "+end,r.id+": "+note);tryv(()=>INBOX.refresh());return {ok:true}}
function fund(r,by){
 const k=K(),g=gateFor(r);let lineMsg="";
 if(k&&!r.lineId){const B=k.B();
  const dept=(k.DEPTS.find(d=>d[2]===r.cc)||["IT"])[0],proj=r.proj||"PR3",ids=[];
  const reserve=/reserve/i.test(r.src);
  if(reserve&&r.line){const pe=B.led.find(x=>x.st==="Pending"&&x.line===r.line&&-x.amt===r.amt);if(pe){pe.st="Approved";pe.apr=by;pe.why+=" (decided in budget request "+r.id+")";lineMsg="Reserve request "+pe.id+" approved against "+r.line}else{const nx=B.led.length+1;B.led.push({id:"RL-"+String(nx).padStart(2,"0"),d:iso(TODAY),t:"draw",amt:-r.amt,p:proj,line:r.line,why:"Funded from budget request "+r.id+": "+r.t,req:r.req,apr:by,st:"Approved"});lineMsg="Reserve draw posted against "+r.line}r.lineId=r.line}
  else if(r.line&&r.type==="Increase"){const l=k.LN(r.line);if(l){l.appr+=r.amt;l.fcst=Math.max(l.fcst,l.appr);lineMsg=r.line+" approved amount raised by "+D$(r.amt);r.lineId=r.line}}
  else if(r.type==="Reallocation"&&r.fromLine){const f=k.LN(r.fromLine);if(f)f.appr-=r.amt;lineMsg="Moved from "+r.fromLine}
  if(!r.lineId){CATS.forEach(c=>{const a=(r.cost||{})[c]||0;if(!a)return;const id=r.id.replace("BR-","BR")+"-"+c.slice(0,3).toUpperCase();
    B.lines.push({id,p:proj,cat:c,n:r.t+" ("+c.toLowerCase()+")",dept,appr:a,comm:0,act:0,fcst:a,own:r.sp,why:"Funded from budget request "+r.id+". "+r.why,fix:""});ids.push(id)});
   r.lineId=ids[0]||"";r.lineIds=ids;lineMsg=ids.length+" budget line"+(ids.length===1?"":"s")+" created ("+ids.join(", ")+")"}}
 r.st="funded";r.gate=g.id;log(r,"end","Funded at gate "+g.id+(lineMsg?". "+lineMsg:""),by,"dec");log(r,"enter","Approved and funded","System","done");
 audit("Budget request funded",r.id+" "+D$(r.amt)+" at "+g.id+(lineMsg?"; "+lineMsg:""));tryv(()=>INBOX.refresh());syncM();return {ok:true,funded:true,line:lineMsg}}
function submit(v){
 const id="BR-0"+(S_.nx++),cost={};CATS.forEach(c=>{if(+v["c_"+c])cost[c]=+v["c_"+c]});
 const r={id,t:v.t,type:v.type,amt:+v.amt,yrs:+v.yrs||1,cost,color:v.color,src:v.src,proj:v.proj,line:v.line||"",fromLine:v.fromLine||"",req:v.req,sp:v.sp,cc:v.cc,obj:v.obj,ben:+v.ben||0,risk:v.risk,alt:v.alt,why:v.why,what:v.what,att:v.att||"",dem:null,dupOf:(dupes(v.t,v.what+" "+v.why)[0]||{}).kind==="Demand item"?(dupes(v.t,v.what+" "+v.why)[0]||{}).id:"",cm:[],rv:{},tl:[],rank:0,st:"sub"};
 r.route=route(r);r.sc=scoreOf(r);log(r,"enter","Submitted by "+r.req+" with sponsor "+r.sp,r.req,"sub");
 const small=tierOf(r).id==="A"&&r.type!=="Emergency";enter(r,"tri");RQ().unshift(r);
 audit("Budget request submitted",id+" "+D$(r.amt)+" "+r.t);syncM();return r}
/* ---------- inbox adapter (Needs you) ---------- */
function inboxList(me){
 const first=n=>String(n||"").split(/[ (]/)[0],out=[];
 RQ().forEach(r=>{if(isEnd(r)||r.st==="sub")return;const v=rev(r.st,r);
  const mine=first(v.name)===first(me)||(v.back&&first(v.back)===first(me)&&curDays(r)>slaOf(r,r.st))||(/CIO/.test(v.role)&&me==="Casey Rowan");
  if(!mine||r.req===me)return;
  const d=curDays(r),sla=slaOf(r,r.st),due=(sla-d)*24,sc=scoreNum(r.sc),st=stuck(r),w=whatIf(r);
  const urgent=due<0||r.type==="Emergency"||r.risk==="High"&&r.amt>=100000;
  out.push({kind:"approval",cat:"Budget request",ic:"budget",title:r.id+" "+r.t+" · "+SB[r.st].n,req:r.req,ageH:d*24,slaH:sla*24,dueH:due,amt:r.amt,risk:r.risk==="High"?"high":r.risk==="Medium"?"med":"low",
   why:"You are the "+(v.name===me?"named reviewer":"reviewer or backup")+" for "+SB[r.st].n+" ("+v.via+").",
   ai:{sum:r.why+" Value score "+sc+" of 100. "+(w&&w.res?"Reserve after this ask: "+D$(w.after)+".":""),conf:.8,model:"Budget Request Agent",srcs:["Request form","Budget lines","Funding gate rules","Demand scoring"],rec:sc>=55?"approve":"conditions"},rec:sc>=55?"approve":"conditions",
   guard:"Approve and next moves the request to the next routed stage. A decline or deferral needs a reason. The requester cannot decide their own request.",
   ev:[["Type",r.type+(r.dupOf?" · possible duplicate of "+r.dupOf:""),r.dupOf?"warn":""],["Ask",D$(r.amt)+" over "+r.yrs+" year"+(r.yrs===1?"":"s"),""],["Color",r.color+(headroomOf(r.color)!=null?" · headroom "+D$(headroomOf(r.color)):""),""],["Route",r.route.slice(1).map(s=>SB[s].n).join(" > "),""],["Time in stage",d+" of "+sla+" days",st&&st.lvl!=="good"?"warn":"good"],["Business value",sc+" of 100","info"]],
   extra:"",can:{approve:true,reject:true,delegate:false},delegateWhy:"Reviewer changes are made on the request page.",needNote:false,flag:due<0,vendor:"",blk:"",sim:false,openLabel:"Open request",open:()=>openReq(r.id),
   id:"budreq:"+r.id+":"+r.st,src:"budreq",sid:r.id,sx:r.st,group:due<0?"Overdue":due<=24?"Due today":due<=168?"This week":"Later",urgent:!!urgent,sc:(urgent?0:1)*1e6+Math.max(-48,due)+(r.risk==="High"?-30:0)})});
 return out}
function regInbox(){
 if(!window.INBOX||!INBOX.adapters)return false;
 INBOX.adapters.budreq={key:"budreq",label:"Budget requests",mod:"Budget requests",fn:"BUDREQ.decide",wired:true,list:inboxList,
  approve(it,note){return decide(it.sid,"Approve",note,ME())},reject(it,why){return decide(it.sid,"Decline",why,ME())},
  check(it){const r=byId(it.sid);return r?{st:r.st}:null}};
 tryv(()=>INBOX.refresh());return true}
/* ---------- views ---------- */
const stagePill=r=>isEnd(r)?`<span class="pill ${ENDS[r.st][1]}">${ENDS[r.st][0]}</span>`:`<span class="pill info">${H(SB[r.st].n)}</span>`;
const typePill=t=>`<span class="pill ${t==="Emergency"?"bad":t==="Increase"?"warn":t==="Reallocation"?"mute":"info"}">${H(t)}</span>`;
function funnelViz(){const s=stats(),rs=RQ();
 const rows=[{id:"sub",n:"Submitted",reached:rs.length,here:0,amt:sum(rs,r=>r.amt),med:0,sla:0,conv:null,decided:0}].concat(s.per).concat([{id:"done",n:"Approved and funded",reached:s.funded,here:0,amt:sum(rs.filter(r=>r.st==="funded"),r=>r.amt),med:0,sla:0,conv:null,decided:0}]);
 const mx=Math.max(1,rs.length),w=s.worst&&s.worst.ratio>1?s.worst.id:"";
 return `<div class="br-fun" role="list">${rows.map((x,i)=>{const pct=Math.max(8,Math.round(x.reached/mx*100)),late=x.sla&&x.med>x.sla,bn=x.id===w;
  return `<div class="br-frow${bn?" bn":""}" role="listitem"><button type="button" class="br-fname" data-br-stage="${x.id}"><b>${H(x.n)}</b><span class="small muted">${x.sla?"Target "+x.sla+" days":x.id==="sub"?"Everyone starts here":"End state"}</span></button>
   <div class="br-bar"><i style="width:${pct}%" class="${x.id==="done"?"ok":bn?"bn":""}"><span>${x.reached}</span></i><em>${D$(x.amt)}</em></div>
   <div class="br-fmeta small">${x.here?`<span class="pill info">${x.here} here now (${D$(x.amtHere)})</span>`:""}${x.decided?`<span class="muted">Passed ${x.conv}% of ${x.decided}</span>`:""}${x.sla?`<span class="pill ${late?"bad":x.med>x.sla*.8?"warn":"good"}">Median ${x.med} d</span>`:""}${bn?'<span class="pill bad">Bottleneck</span>':""}</div></div>`}).join("")}</div>`+legend([["Bar length: requests that reached the stage","--accent"],["Funded","--good-f"],["Bottleneck: slowest against its target","--bad-f"]])}
function queueRows(){return RQ().filter(r=>!isEnd(r)&&r.st!=="sub").sort((a,b)=>curDays(b)/slaOf(b,b.st)-curDays(a)/slaOf(a,a.st)).map(r=>{const st=stuck(r),v=rev(r.st,r);
 return `<tr><td><button type="button" class="br-link" data-br-open="${r.id}"><b>${r.id}</b><span class="sub">${H(r.t)}</span></button></td><td>${typePill(r.type)}</td><td class="tabular">${D$(r.amt)}</td><td>${stagePill(r)}</td><td>${pchip(v.name)}</td><td class="tabular"><span class="pill ${st&&st.lvl}">${curDays(r)} of ${slaOf(r,r.st)} d</span></td><td class="small" style="white-space:normal;min-width:220px" data-role="story">${H(st?st.t:"")}</td></tr>`}).join("")}
function paneFunnel(){const s=stats(),open=s.open;
 const kp=kpiRow([["Open requests",String(open.length),D$(s.openAmt)+" asked",{keep:true}],["Funded so far",String(s.funded),D$(sum(RQ().filter(r=>r.st==="funded"),r=>r.amt)),{keep:true}],["Cycle time",s.cycle+" days","submit to decision",{metric:"m_br_cycle",keep:true}],["Stuck past 2x target",String(s.stuckN),"open requests",{metric:"m_br_stuck",keep:true}]]);
 const cnc=open.filter(r=>r.st==="cnc").sort((a,b)=>(a.rank||99)-(b.rank||99)||scoreNum(b.sc)-scoreNum(a.sc));
 return `${kp}${card("The decision funnel","Every request, by stage: how many reached it, the dollars asked, how many passed, and the median days against the target. Select a stage to see its entry criteria, reviewer and options.",funnelViz(),`<span class="row">${fchip("m_br_conv")}${fchip("m_br_sla")}</span>`)}
 <div id="br_stage"></div>
 ${card("Waiting on a reviewer","Most overdue first. The line under each request says why it is stuck and what to do.",`<div class="tscroll"><table><thead><tr><th>Request</th><th>Type</th><th>Ask</th><th>Stage</th><th>Reviewer</th><th>Time in stage</th><th>Why it is stuck, or on track</th></tr></thead><tbody>${queueRows()||`<tr><td colspan="7" class="muted">Nothing is waiting.</td></tr>`}</tbody></table></div>`)}
 ${cnc.length?card("Portfolio council ranking","Drag to rank the requests waiting for the council. The score is the same formula demand uses; the order you set is what the funding decision sees.",`<div class="br-rank" data-dnd="cnc" data-dnd-scope="budrank">${cnc.map((r,i)=>`<div class="br-rk" data-dnd-id="${r.id}" tabindex="0"><span class="grip" aria-hidden="true"></span><b class="tabular">#${i+1}</b><button type="button" class="br-link" data-br-open="${r.id}"><b>${H(r.t)}</b><span class="sub">${D$(r.amt)} · value score ${scoreNum(r.sc)} of 100</span></button></div>`).join("")}</div>`):""}`}
function stageDrawer(sid){const s=SB[sid],st=stats().per.find(p=>p.id===sid),inS=RQ().filter(r=>r.st===sid);
 const sample=RQ().find(r=>r.st===sid)||RQ()[0],v=sid==="sub"||sid==="done"?{name:s.fb[0],back:s.fb[1],via:"Finance records the funding"}:rev(sid,sample);
 openDrawer(`<h2>${H(s.n)}</h2><p class="muted">${H(s.entry)}</p><div class="grid g2"><div class="card glass"><div class="eyebrow">Reviewer</div><p>${v.name?pchip(v.name):"Requester"} <span class="small muted">backup ${H(v.back||"none")}</span></p><p class="small muted">${H(v.via)}</p></div><div class="card glass"><div class="eyebrow">Target and results</div><p><b>${s.sla||"None"}</b> ${s.sla?"days":""}</p>${st?`<p class="small muted">Median ${st.med} d · average ${st.avg} d · within target ${st.sla_pct}% · passed ${st.conv}% of ${st.decided} decided</p>`:""}</div></div>
 <h3>Decision options</h3><p>${(s.opts||[]).map(o=>`<span class="pill mute">${H(o)}</span>`).join(" ")||"None"}</p><h3>In this stage now</h3>${inS.length?inS.map(r=>`<p><button type="button" class="br-link" data-br-open="${r.id}"><b>${r.id}</b> ${H(r.t)} <span class="sub">${D$(r.amt)} · ${curDays(r)} days</span></button></p>`).join(""):`<p class="muted">Nothing is here now.</p>`}
 <h3>Which requests use this stage</h3><p class="small muted">${S_.rules.filter(t=>t.stages.indexOf(sid)>=0).map(t=>"Tier "+t.id+" up to "+(t.max===Infinity?"any amount":D$(t.max))).join("; ")||"Emergency and reallocation requests, or none"}</p>`)}
function paneRequests(){
 return card("All budget requests","Every request ever raised, with its stage and reviewer. Select one to open the full page: timeline, scorecard, comments, what-if and the next decision.",`<div class="tscroll"><table><thead><tr><th>Request</th><th>Type</th><th>Ask</th><th>Stage</th><th>Requester</th><th>Color</th><th>Value score</th><th>Age</th></tr></thead><tbody>${RQ().map(r=>`<tr><td><button type="button" class="br-link" data-br-open="${r.id}"><b>${r.id}</b><span class="sub">${H(r.t)}</span></button></td><td>${typePill(r.type)}</td><td class="tabular">${D$(r.amt)}</td><td>${stagePill(r)}</td><td>${pchip(r.req)}</td><td><span class="chip">${H(r.color)}</span></td><td class="tabular">${scoreNum(r.sc)}</td><td class="tabular">${dbet(r.tl[0].d,iso(TODAY))} d</td></tr>`).join("")}</tbody></table></div>`,`<button class="btn primary" data-br-new>Request budget</button>`)}
function paneAnalytics(){const s=stats(),rs=RQ();
 const maxR=Math.max(1.2,...s.per.map(p=>p.ratio));
 const cyc=`<div class="tscroll"><table><thead><tr><th>Stage</th><th>Visits</th><th>Median days</th><th>Average days</th><th>Target</th><th>Average against target</th><th>Within target</th></tr></thead><tbody>${s.per.map(p=>`<tr class="${s.worst&&s.worst.id===p.id&&p.ratio>1?"br-bn":""}"><td><button type="button" class="br-link" data-br-stage="${p.id}"><b>${H(p.n)}</b></button></td><td class="tabular">${p.reached}</td><td class="tabular">${p.med}</td><td class="tabular">${p.avg}</td><td class="tabular">${p.sla} d</td><td><div class="br-mini"><i style="width:${Math.min(100,p.ratio/maxR*100)}%" class="${p.ratio>1?"bad":p.ratio>.8?"warn":"ok"}"></i></div><span class="small tabular">${(p.ratio*100).toFixed(0)}%</span></td><td class="tabular">${p.sla_pct}%</td></tr>`).join("")}</tbody></table></div>`;
 const closed=rs.filter(isEnd).filter(r=>r.st!=="returned");
 const grp=(f)=>{const m={};closed.forEach(r=>{const k=f(r);(m[k]=m[k]||{n:k,f:0,t:0,amt:0});m[k].t++;m[k].amt+=r.amt;if(r.st==="funded")m[k].f++});return Object.values(m).sort((a,b)=>b.t-a.t)};
 const deptOf=r=>tryv(()=>K().DEPTS.find(d=>d[2]===r.cc)[1],r.cc);
 const rate=(rows)=>`<div class="tscroll"><table><thead><tr><th></th><th>Decided</th><th>Funded</th><th>Approval rate</th><th>Dollars asked</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${H(x.n)}</b></td><td class="tabular">${x.t}</td><td class="tabular">${x.f}</td><td><div class="br-mini"><i style="width:${x.f/x.t*100}%" class="ok"></i></div><span class="small tabular">${Math.round(x.f/x.t*100)}%</span></td><td class="tabular">${D$(x.amt)}</td></tr>`).join("")}</tbody></table></div>`;
 const bk=[["0 to 3 days",0,3],["4 to 7 days",4,7],["8 to 14 days",8,14],["15 days or more",15,999]],open=s.open.filter(r=>r.st!=="sub");
 const ag=bk.map(b=>({n:b[0],c:open.filter(r=>{const d=dbet(r.tl[0].d,iso(TODAY));return d>=b[1]&&d<=b[2]}).length}));const mxa=Math.max(1,...ag.map(a=>a.c));
 const w=s.worst;
 const rem=w&&w.ratio>1?`<div class="rem"><div class="ico warn">${ico("warn")}</div><div><b>Bottleneck: ${H(w.n)}</b><div class="small muted" data-role="story">Requests spend ${w.avg} days here on average against a ${w.sla}-day target (${Math.round(w.ratio*100)}%). ${s.stuckN} open request${s.stuckN===1?" is":"s are"} past twice their target.</div><div class="small" style="margin-top:6px"><b>Remediation:</b> name a backup reviewer for this stage and let small asks skip it (see Routing rules). The Budget Request Agent can nudge at 80% of the target. ${fchip("m_br_sla")} ${fchip("m_br_stuck")}</div><p class="row" style="margin-top:8px"><button class="btn" data-br-nudge="${w.id}">Nudge the reviewer</button><button class="btn" data-br-tab="3">Edit routing rules</button></p></div></div>`:`<div class="rem"><div class="ico">${ico("check")}</div><div><b>No stage is over its target.</b></div></div>`;
 return `${kpiRow([["Conversion",s.conv+"%","submitted to funded",{metric:"m_br_conv",keep:true}],["Cycle time",s.cycle+" days","submit to decision",{metric:"m_br_cycle",keep:true}],["Inside target",s.sla+"%","stage visits",{metric:"m_br_sla",keep:true}],["Complete first time",s.first+"%","not returned at triage",{metric:"m_br_first",keep:true}]])}
 ${card("Where the time goes",'Cycle time per stage from the timeline of every request. The stage that runs furthest over its target is marked.',cyc)}${card("Bottleneck and remediation","",rem)}
 <div class="grid g2">${card("Approval rate by funding color","Decided requests only.",rate(grp(r=>r.color)))}${card("Approval rate by requester organization","Decided requests only.",rate(grp(deptOf)))}</div>
 ${card("Aging of open requests","Days since submission.",`<div class="br-ag">${ag.map(a=>`<div><b class="tabular">${a.c}</b><div class="br-agb"><i style="height:${a.c/mxa*100}%"></i></div><span class="small muted">${a.n}</span></div>`).join("")}</div>`)}
 ${card("Metrics behind this page","Each has a formula, an owner and a remediation in the metrics catalog.",`<div class="row" style="flex-wrap:wrap">${["m_br_cycle","m_br_conv","m_br_sla","m_br_stuck","m_br_first"].map(m=>fchip(m)).join("")}</div>`)}`}
function paneRules(){
 return `${card("Routing rules","The amount decides which stages a request goes through, so small asks skip stages. Tiers follow the delegation of authority; emergency and reallocation requests always take the short path.",`<div class="tscroll"><table><thead><tr><th>Tier</th><th>Up to</th><th>Stages</th><th>Decides</th><th></th></tr></thead><tbody>${S_.rules.map(t=>{const d=tryv(()=>DOA.approverFor(t.max===Infinity?1e7:t.max,"","",{}),null);return `<tr><td><b>${t.id}</b></td><td class="tabular">${t.max===Infinity?"Any amount":D$(t.max)}</td><td>${t.stages.map(s=>`<span class="pill ${s==="dec"?"good":"mute"}">${H(SB[s].n)}</span>`).join(" ")}<div class="small muted">${H(t.note)}</div></td><td>${d?H(/Casey/.test(d.name)?"Casey Rowan":d.name)+' <span class="small muted">'+H(d.role)+"</span>":"By delegation of authority"}</td><td><button class="btn" data-br-rule="${t.id}">Edit</button></td></tr>`}).join("")}</tbody></table></div><p class="small muted">Emergency: Triage, Finance review, Funding decision, with targets cut to a third. Reallocation: Triage, Finance review, Funding decision.</p>`,`<button class="btn" data-br-reset>Reset to defaults</button>`)}
 ${card("Reviewers by stage","Resolved from the ownership model by domain, with a backup. If the directory is not loaded a default reviewer is shown.",`<div class="tscroll"><table><thead><tr><th>Stage</th><th>Domain</th><th>Reviewer</th><th>Backup</th><th>Target</th><th>Entry criteria</th></tr></thead><tbody>${STG.filter(s=>s.id!=="sub"&&s.id!=="done").map(s=>{const v=rev(s.id,{amt:50000,type:"Increase",req:"",src:"",proj:"PR1"});return `<tr><td><button type="button" class="br-link" data-br-stage="${s.id}"><b>${H(s.n)}</b></button></td><td>${H(s.domain)}</td><td>${pchip(v.name)}</td><td>${v.back?pchip(v.back):"None"}</td><td class="tabular">${s.sla} d</td><td class="small" style="white-space:normal;min-width:240px">${H(s.entry)}</td></tr>`}).join("")}</tbody></table></div>`)}
 ${card("Funding gate match","The decision is made at the gate that fits the request type. Colors and sources are assigned at G1; the allowability rules are checked at every gate.",`<div class="tscroll"><table><thead><tr><th>Request type</th><th>Decided at</th><th>Why</th></tr></thead><tbody>${TYPES.map(t=>{const g=gateFor({type:t,proj:"PR1"});return `<tr><td>${typePill(t)}</td><td><b>${g.id}</b> ${H(tryv(()=>FIN.gates.find(x=>x.id===g.id).n,""))}</td><td class="small" style="white-space:normal">${H(g.why)}</td></tr>`}).join("")}</tbody></table></div>`,`<button class="btn" data-go="fin_gates">Open funding gates</button>`)}`}
function paneHow(){return `${card("From idea to funded line","Two funnels. The input funnel makes the ask complete and checked before anyone reviews it. The decision funnel moves it through the stages its size requires.",`<ol class="br-how">${["Request budget: a guided form with a human sponsor, an objective, cost model, benefits, risk and alternatives. AI suggests a category and color and checks duplicates; every AI suggestion is a labeled draft.","Triage: completeness, duplicates, routing. A small ask is routed straight to its approver.","Finance review: does it fit the color and the budget, and what does it do to the reserve and forecast.","Architecture and security review, linked to existing reviews where there are any.","Business value scoring with the same formula as demand.","Portfolio council ranking by drag and drop.","Funding decision at the matching gate by the approver the delegation of authority names. It arrives in Needs you.","Approved and funded: a budget line (and optionally a project intake) is created and the audit trail is written."].map(t=>`<li>${H(t)}</li>`).join("")}</ol>`,`<span class="row">${stdChip?stdChip("tbm","Request, review and fund steps follow the TBM budget and planning flow"):""}${stdChip?stdChip("cobit","Segregation of duties and delegated authority"):""}</span>`)}${typeof procCard==="function"?procCard("bud_req"):""}`}
function viewScreen(){syncM();const s=stats(),w=s.worst;
 return `<div class="screen">${hero("Budgets · Requests and funding decisions","Ask for budget, and see how it is decided",`<b>${s.open.length}</b> requests (<b>${D$(s.openAmt)}</b>) are moving through the funnel. ${w&&w.ratio>1?`The slowest stage is <b>${H(w.n)}</b> at ${w.avg} days against ${w.sla}.`:"Every stage is inside its target."} ${s.stuckN?`<b>${s.stuckN}</b> ${s.stuckN===1?"is":"are"} stuck past twice the target.`:""} Small asks skip stages; large ones are ranked by the council and decided at the matching funding gate.`,`<div class="row"><button class="btn primary" data-br-new>Request budget</button><button class="btn" data-go="bud_over">Budgets overall</button>${fchip("m_br_cycle")}</div>`)}${lensNote()}
 ${views("budreq",["Decision funnel","Requests","Analytics","Routing rules","How it works"],[paneFunnel(),paneRequests(),paneAnalytics(),paneRules(),paneHow()])}</div>`}
/* ---------- request page (drawer) ---------- */
function openReq(id){const r=byId(id);if(!r)return;S_.sel=id;openDrawer(reqHTML(r))}
function reqHTML(r){
 const v=isEnd(r)||r.st==="sub"?null:rev(r.st,r),st=stuck(r),w=whatIf(r),g=gateFor(r),sc=r.sc,num=scoreNum(sc),sug=suggestColor(r);
 const strip=r.route.map((s,i)=>{const done=r.tl.some(e=>e.st===s&&(e.k==="exit"))||(r.st==="funded"&&s!=="done"),cur=r.st===s;return `<span class="br-step ${cur?"cur":done?"done":""}"><i></i>${H(SB[s].n)}</span>`}).join("")+`<span class="br-step ${r.st==="funded"?"done":""}"><i></i>Approved and funded</span>`;
 const actions=v?`<div class="row" style="flex-wrap:wrap"><button class="btn primary" data-br-act="${r.id}:Approve">${r.st==="dec"?"Approve and fund":"Approve and next"}</button><button class="btn" data-br-act="${r.id}:Return">Return to requester</button><button class="btn" data-br-act="${r.id}:Defer">Defer</button><button class="btn danger" data-br-act="${r.id}:Decline">Decline</button><button class="btn quiet" data-br-nudge="${r.st}">Nudge reviewer</button></div><p class="small muted">Reviewer: ${pchip(v.name)} (${H(v.role)}); backup ${H(v.back||"none")}. ${H(v.via)}. You are acting as ${H(ME())}${v.name!==ME()?"; a decision is logged as on behalf of the reviewer":""}.</p>`:"";
 const cost=CATS.filter(c=>(r.cost||{})[c]).map(c=>`<tr><td>${c}</td><td class="tabular">${D$(r.cost[c])}</td><td class="tabular">${Math.round(r.cost[c]/r.amt*100)}%</td></tr>`).join("");
 const pay=r.ben?Math.round(r.amt/(r.ben/12)):0;
 return `<div class="br-req"><div class="eyebrow">${r.id} · ${H(r.type)}</div><h2>${H(r.t)}</h2><div class="row" style="flex-wrap:wrap;gap:8px">${stagePill(r)}${typePill(r.type)}<span class="chip">${D$(r.amt)} over ${r.yrs} yr</span><span class="chip">Color ${H(r.color)}</span><span class="chip">Gate ${H(r.gate||g.id)}</span>${aiChip?"":""}</div>
 <div class="br-strip" aria-label="Route">${strip}</div>
 ${st?`<div class="rem"><div class="ico ${st.lvl==="good"?"":"warn"}">${ico(st.lvl==="good"?"check":"warn")}</div><div><b>${st.lvl==="good"?"On track":"Why is this stuck?"}</b><div class="small" data-role="story">${H(st.t)}</div></div></div>`:""}
 ${actions}
 <div class="grid g2 dfullgrid"><section class="card glass"><div class="eyebrow">The ask</div><p data-role="story">${H(r.what)}</p><p class="small"><b>Why now.</b> ${H(r.why)}</p><p class="small"><b>Alternatives considered.</b> ${H(r.alt)}</p><dl class="kv small"><dt>Requester</dt><dd>${pchip(r.req)}</dd><dt>Sponsor</dt><dd>${pchip(r.sp)}</dd><dt>Cost center</dt><dd>${H(r.cc)}</dd><dt>Objective</dt><dd>${H(tryv(()=>NODES.find(n=>n.id===r.obj).n,r.obj||"None"))}</dd><dt>Funding source</dt><dd>${H(r.src)}</dd>${r.line?`<dt>Budget line</dt><dd>${H(r.line)}</dd>`:""}${r.dupOf?`<dt>Possible duplicate</dt><dd>Demand item ${H(r.dupOf)}</dd>`:""}${r.lineIds&&r.lineIds.length?`<dt>Created</dt><dd>${H(r.lineIds.join(", "))}</dd>`:""}</dl></section>
 <section class="card glass"><div class="eyebrow">Cost model</div><div class="tscroll"><table><thead><tr><th>Category</th><th>Amount</th><th>Share</th></tr></thead><tbody>${cost}</tbody></table></div><p class="small muted">Benefit ${r.ben?D$(r.ben)+" a year":"none claimed"}${pay?"; payback about "+pay+" months":""}. Risk ${H(r.risk)}.</p></section></div>
 <section class="card glass"><div class="eyebrow">Scorecard</div><p class="small muted">${H(sc.from)}. Same weights as demand scoring: strategy 35%, return 25%, risk reduction 20%, urgency 20%.</p><div class="row" style="gap:18px;flex-wrap:wrap">${[["Strategic fit",sc.s],["Financial return",sc.f],["Risk reduction",sc.r],["Urgency",sc.u]].map(x=>`<div><b class="tabular">${x[1]}</b> <span class="small muted">of 5 ${x[0]}</span></div>`).join("")}<div><b class="tabular">${num}</b> <span class="small muted">of 100</span> ${fchip("m_prio")}</div></div>${r.st==="val"?`<p><button class="btn" data-br-score="${r.id}">Re-score</button></p>`:""}</section>
 <section class="card glass"><div class="eyebrow">What if this is approved</div>${w?`<div class="grid g2 dfullgrid"><div class="small"><b>Reserve.</b> ${w.res?`Balance ${D$(w.bal)}, ${D$(w.pend)} pending, so ${D$(w.bal-w.pend)} free. After this ask: <b style="color:var(${w.ok?"--good":"--bad"})">${D$(w.after)}</b>${w.ok?"":" (not enough)"}.`:"Funded from "+H(r.src)+", the reserve is not touched."}</div><div class="small"><b>Forecast.</b> Portfolio forecast becomes ${D$(w.fcst)}${r.type==="Reallocation"?" (no change; money moves)":""}. ${r.type==="Increase"&&!w.res?"The approved amount rises with it, so the variance does not change.":""}</div></div>`:`<p class="muted">Budget model not loaded.</p>`}<p class="small"><b>Color.</b> ${H(r.color)}${headroomOf(r.color)!=null?" has "+D$(headroomOf(r.color))+" headroom. ":". "}${r.color!==sug.id?`<span data-role="story">Suggested ${H(sug.id)}: ${H(sug.why)} ${aiChip({model:"Budget Request Agent",conf:.78,title:"Color suggestion (draft)",src:["Cost model","Color rules","Headroom"],guards:["A person confirms the color at the gate"]})}</span>`:"The suggested color matches."}</p><p class="small"><b>Gate.</b> ${H(g.id)}. ${H(g.why)}</p></section>
 <section class="card glass"><div class="eyebrow">Timeline and audit</div><ol class="br-tl">${r.tl.slice().sort((a,b)=>a.d<b.d?-1:0).map(e=>`<li class="${e.k}"><b>${fD(e.d)}</b> ${H(e.ev)} <span class="small muted">${H(e.by)}</span></li>`).join("")}</ol>${Object.keys(r.rv).length?`<div class="tscroll"><table><thead><tr><th>Stage</th><th>Decision</th><th>By</th><th>Note</th></tr></thead><tbody>${Object.keys(r.rv).map(s=>`<tr><td>${H(SB[s].n)}</td><td>${H(r.rv[s].dec)}</td><td>${H(r.rv[s].by)}${r.rv[s].behalf?' <span class="small muted">on behalf</span>':""}</td><td class="small" style="white-space:normal">${H(r.rv[s].note)}</td></tr>`).join("")}</tbody></table></div>`:""}</section>
 <section class="card glass"><div class="eyebrow">Comments</div>${r.cm.length?r.cm.map(c=>`<p class="small"><b>${H(c.by)}</b> <span class="muted">${fD(c.d)}</span><br>${H(c.t)}</p>`).join(""):`<p class="small muted">No comments yet.</p>`}<p><button class="btn" data-br-comment="${r.id}">Add a comment</button> <button class="btn quiet" data-go="bud_over">Open Budgets</button> <button class="btn quiet" data-go="port">Open Demand and priorities</button></p></section></div>`}
/* ---------- forms ---------- */
function sponsorHuman(n){const p=tryv(()=>who(n),null);return !p||p.kind==="human"||p.kind==="contractor"}
function requestForm(init){
 init=init||{};const objs=tryv(()=>NODES.filter(n=>n.t==="obj").map(n=>[n.id,n.n]),[["O1","Modernize standards publishing"],["O2","Keep the platform resilient"]]);
 const projs=[["","No project yet"]].concat(tryv(()=>PROJ.map(p=>[p.id,p.id+" "+p.short]),[]));
 const lines=[["","None"]].concat(tryv(()=>K().B().lines.map(l=>[l.id,l.id+" · "+l.n]),[]));
 const ccs=tryv(()=>K().DEPTS.map(d=>[d[2],d[1]+" ("+d[2]+")"]),[["CC-4420","IT Operations (CC-4420)"]]);
 const live=v=>{const a=+v.amt||0;if(!a&&!v.t)return "";const tmp=Object.assign({},v,{amt:a,yrs:+v.yrs||1,cost:{},src:v.src||"",proj:v.proj||"PR1"});CATS.forEach(c=>{if(+v["c_"+c])tmp.cost[c]=+v["c_"+c]});
  const rt=route(tmp),t=tierOf(tmp),d=tryv(()=>DOA.approverFor(a,tmp.type==="Emergency"?"Reserve release":"",v.req,{proj:tmp.proj}),null),dp=dupes(v.t||"",(v.what||"")+" "+(v.why||"")),sg=suggestColor(tmp),tot=sum(CATS,c=>+v["c_"+c]||0),pay=+v.ben>0&&a?Math.round(a/(+v.ben/12)):0;
  return `<div class="br-live"><div class="rem"><div class="ico">${ico("info")}</div><div><b>Route: ${rt.slice(1).map(s=>SB[s].n).join(" > ")}</b><div class="small muted">${t.note} ${d?`Decided by <b>${H(/Casey/.test(d.name)?"Casey Rowan":d.name)}</b> (${H(d.role)}, tier ${d.tier}).`:""} Gate ${gateFor(tmp).id}.</div></div></div>
  <div class="small ${tot&&Math.abs(tot-a)>a*.05?"br-bad":"muted"}">Cost model adds up to ${D$(tot)} of ${D$(a)}${tot&&Math.abs(tot-a)>a*.05?". It must be within 5% of the ask.":"."}${pay?" Payback about "+pay+" months.":""}</div>
  <div class="small"><span class="pill mute">AI draft</span> Suggested color <b>${H(sg.id)}</b>${sg.head!=null?" (headroom "+D$(sg.head)+")":""}: ${H(sg.why)}</div>
  ${dp.length?`<div class="small"><span class="pill warn">Check for duplicates</span> ${dp.map(x=>H(x.kind+" "+x.id+": "+x.t)+" ("+Math.round(x.s*100)+"% similar)").join("; ")}. Explain below why this is different, or merge.</div>`:`<div class="small muted">No similar budget line, demand item or earlier request found.</div>`}</div>`};
 const cf=(c)=>({k:"c_"+c,label:c,type:"money"});
 openForm({id:"budreq_new",title:"Request budget",story:"Say what you need, why, and what the business gets. Oukala checks the form, suggests a category and color, looks for duplicates, and shows the route your request will take and who decides. Nothing is approved here; the request goes to triage and you can follow it.",submit:"Submit request",
  fields:[{section:"What and why"},{k:"t",label:"What are you asking for",type:"text",req:true,ph:"Short name, for example Next hosting tier for the Portal"},{k:"type",label:"Type of request",type:"chips",opts:TYPES,req:true},
   {k:"what",label:"Describe it",type:"longtext",req:true,ai:{label:"Draft with Claude",fn:v=>(v.t||"This request")+" supports the standards work by "+(v.type==="Emergency"?"closing an exposure found in the Oct 5 incident":"improving delivery of a service the business depends on")+". Scope, owner and timing to be confirmed at triage."}},
   {k:"why",label:"Why now",type:"longtext",req:true,help:"Emergency requests need a clear reason."},
   {k:"obj",label:"Business outcome: strategy objective it serves",type:"select",opts:objs,req:true},
   {section:"Money"},{k:"amt",label:"Total amount",type:"money",req:true},{k:"yrs",label:"Years",type:"chips",opts:["1","2","3"]},
   {k:"cost",label:"Cost model (enter what applies; it should add up to the amount)",type:"toggle",show:()=>false},cf("Labor"),cf("Vendor"),cf("Hardware"),cf("Cloud"),cf("Licences"),
   {k:"color",label:"Funding color",type:"select",opts:colorOpts(),req:true,ai:{label:"Suggest",fn:v=>suggestColor({amt:+v.amt,type:v.type,cost:{Labor:+v.c_Labor,Vendor:+v.c_Vendor,Hardware:+v.c_Hardware,Cloud:+v.c_Cloud,Licences:+v.c_Licences},what:v.what,why:v.why,t:v.t}).id}},
   {k:"src",label:"Funding source",type:"chips",opts:["Operating budget","Management reserve","Restricted color","Reallocation"],req:true},
   {k:"proj",label:"Project",type:"select",opts:projs},{k:"line",label:"Existing budget line it changes",type:"select",opts:lines,help:"Required for an increase."},{k:"fromLine",label:"Reallocate from line",type:"select",opts:lines,show:v=>v.type==="Reallocation"},
   {section:"Value and risk"},{k:"ben",label:"Benefit per year",type:"money",help:"Money saved, avoided or earned each year. Leave blank if not measurable."},{k:"risk",label:"Risk if we do not fund it",type:"chips",opts:["Low","Medium","High"],req:true},
   {k:"alt",label:"Alternatives considered",type:"longtext",req:true,help:"At least one, and why it was not chosen."},
   {section:"Who"},{k:"req",label:"Requested by",type:"people",req:true},{k:"sp",label:"Sponsor (a person who is accountable)",type:"people",req:true,help:"AI agents cannot be sponsors."},{k:"cc",label:"Cost center",type:"select",opts:ccs,req:true},{k:"att",label:"Attach a quote or document",type:"file"}],
  defaults:Object.assign({type:"Increase",yrs:"1",src:"Operating budget",risk:"Medium",req:ME(),sp:"Priya Shah",cc:"CC-4411",color:"OP-U",proj:"PR1"},init),
  live,
  onSubmit:v=>{const a=+v.amt,tot=sum(CATS,c=>+v["c_"+c]||0),bad=m=>({close:false,toast:m,audit:"rejected budget request: "+m});
   if(!(a>0))return bad("Enter an amount above zero.");if(!sponsorHuman(v.sp))return bad("The sponsor must be a person. AI agents can draft but not sponsor.");
   if(v.req===v.sp&&a>=250000)return bad("For a request this size the sponsor must be someone other than the requester.");
   if(tot&&Math.abs(tot-a)>a*.05)return bad("The cost model adds up to "+D$(tot)+", more than 5% away from "+D$(a)+".");
   if(!tot)return bad("Fill in at least one cost category.");
   if(v.type==="Increase"&&!v.line)return bad("Choose the budget line the increase applies to.");
   if(v.type==="Reallocation"&&!v.fromLine)return bad("Choose the line the money comes from.");
   if(v.type==="Reallocation"&&v.src!=="Reallocation")return bad("A reallocation uses Reallocation as its funding source.");
   if(String(v.alt||"").trim().length<20)return bad("Describe at least one alternative (20 characters or more).");
   if(v.type==="Emergency"&&String(v.why||"").trim().length<30)return bad("An emergency needs a clear reason (30 characters or more).");
   if(/reserve/i.test(v.src)&&tryv(()=>a>K().resBal()-K().resPend()+K().resPend(),false)&&tryv(()=>a>K().resBal(),false))return bad("The reserve balance is "+D$(K().resBal())+", below this request.");
   const r=submit(v);return {toast:r.id+" submitted. Route: "+r.route.slice(1).map(s=>SB[s].n).join(", "),audit:r.id+" submitted "+D$(a),after:setTimeout(()=>openReq(r.id),400)}}})}
function decisionForm(id,act){const r=byId(id);if(!r)return;const lab={Approve:r.st==="dec"?"Approve and fund":"Approve and next",Return:"Return to requester",Defer:"Defer",Decline:"Decline"}[act];
 openForm({id:"budreq_dec",title:lab+": "+r.id,story:act==="Approve"?"The request moves to the next stage its size requires"+(r.st==="dec"?", and a budget line is created at the matching gate":"")+". Your decision is written to the audit trail.":"Give the reason. The requester sees it and the decision is written to the audit trail.",submit:lab,
  fields:[{k:"note",label:act==="Approve"?"Note (optional)":"Reason",type:"longtext",req:act!=="Approve"}],
  onSubmit:v=>{const x=decide(r.id,act,v.note);if(!x.ok)return {close:false,toast:x.why,audit:"rejected: "+x.why};render();return {toast:r.id+(x.funded?" funded. "+x.line:act==="Approve"?" moved to "+SB[r.st].n:" "+({Return:"returned",Defer:"deferred",Decline:"declined"})[act]),audit:r.id+" "+act,after:setTimeout(()=>openReq(r.id),400)}}})}
function ruleForm(id){const t=S_.rules.find(x=>x.id===id);if(!t)return;
 openForm({id:"budreq_rule",title:"Edit routing tier "+t.id,story:"Change the top of the tier or which stages it uses. The Funding decision stage cannot be removed. New requests use the change; requests already in the funnel keep their route.",submit:"Save tier",
  fields:[{k:"max",label:"Up to (dollars)",type:"money",req:t.max!==Infinity,show:()=>t.max!==Infinity},{k:"stages",label:"Stages",type:"multi",opts:STG.filter(s=>s.id!=="sub"&&s.id!=="done"&&s.id!=="dec").map(s=>[s.id,s.n])},{k:"note",label:"Note",type:"text"}],
  defaults:{max:t.max===Infinity?0:t.max,stages:t.stages.filter(s=>s!=="dec"),note:t.note},
  onSubmit:v=>{const st=(v.stages||[]);if(st.indexOf("tri")<0)return {close:false,toast:"Triage is always required.",audit:"rejected"};
   if(t.max!==Infinity){const i=S_.rules.indexOf(t),prev=S_.rules[i-1],nxt=S_.rules[i+1];if((prev&&+v.max<=prev.max)||(nxt&&nxt.max!==Infinity&&+v.max>=nxt.max))return {close:false,toast:"The limit must stay between the neighbouring tiers.",audit:"rejected"};t.max=+v.max}
   t.stages=FLOWS.filter(s=>s!=="sub"&&s!=="done"&&(st.indexOf(s)>=0||s==="dec"));t.note=v.note||t.note;render();return {toast:"Tier "+t.id+" updated",audit:"routing tier "+t.id+" changed"}}})}
/* ---------- events ---------- */
document.addEventListener("click",e=>{let t;
 if(t=e.target.closest("[data-br-new]")){requestForm();return}
 if(t=e.target.closest("[data-br-open]")){openReq(t.dataset.brOpen);return}
 if(t=e.target.closest("[data-br-stage]")){stageDrawer(t.dataset.brStage);return}
 if(t=e.target.closest("[data-br-act]")){const [id,a]=t.dataset.brAct.split(":");decisionForm(id,a);return}
 if(t=e.target.closest("[data-br-rule]")){ruleForm(t.dataset.brRule);return}
 if(t=e.target.closest("[data-br-reset]")){S_.rules=DEFRULES.map(x=>({...x,stages:x.stages.slice()}));audit("Budget routing rules reset","defaults");toast("Routing rules reset","good");render();return}
 if(t=e.target.closest("[data-br-tab]")){S.v.budreq=+t.dataset.brTab;render();return}
 if(t=e.target.closest("[data-br-nudge]")){const sid=t.dataset.brNudge,r=RQ().find(x=>x.st===sid)||byId(S_.sel);const v=r?rev(r.st,r):rev(sid,{amt:1,type:"",req:"",src:"",proj:""});audit("Nudged reviewer",v.name+" about "+(SB[sid]||{n:sid}).n);toast("Reminder sent to "+v.name+(v.back?" and "+v.back:"")+" (simulated).","good");return}
 if(t=e.target.closest("[data-br-comment]")){const id=t.dataset.brComment;openForm({id:"budreq_cm",title:"Comment on "+id,story:"Comments stay on the request and show in the audit trail.",submit:"Add comment",fields:[{k:"t",label:"Comment",type:"longtext",req:true}],onSubmit:v=>{const r=byId(id);r.cm.push({by:ME(),d:iso(TODAY),t:v.t});log(r,"comment","Comment added",ME());return {toast:"Comment added",audit:id+" comment",after:setTimeout(()=>openReq(id),400)}}});return}
 if(t=e.target.closest("[data-br-score]")){const id=t.dataset.brScore,r=byId(id);openForm({id:"budreq_sc",title:"Re-score "+id,story:"Scores are 1 to 5 and use the demand formula.",submit:"Save scores",fields:[{k:"s",label:"Strategic fit",type:"range",min:1,max:5},{k:"f",label:"Financial return",type:"range",min:1,max:5},{k:"r",label:"Risk reduction",type:"range",min:1,max:5},{k:"u",label:"Urgency",type:"range",min:1,max:5}],defaults:{s:r.sc.s,f:Math.round(r.sc.f),r:r.sc.r,u:r.sc.u},onSubmit:v=>{r.sc={s:+v.s,f:+v.f,r:+v.r,u:+v.u,from:"Re-scored by "+ME()};return {toast:"Value score is now "+scoreNum(r.sc),audit:id+" re-scored",after:setTimeout(()=>openReq(id),400)}}});return}
});
DND.on("budrank",(id,from,to,idx)=>{const ids=RQ().filter(r=>r.st==="cnc").sort((a,b)=>(a.rank||99)-(b.rank||99)||scoreNum(b.sc)-scoreNum(a.sc)).map(r=>r.id);const o=ids.indexOf(id);if(o<0)return;ids.splice(o,1);ids.splice(Math.min(idx,ids.length),0,id);ids.forEach((x,i)=>byId(x).rank=i+1);audit("Council ranking changed",id+" to position "+(ids.indexOf(id)+1));toast("Ranking updated","good");render()});
/* ---------- screen, nav, search, chat, work ---------- */
REG("bud_req","Budget requests","portfolio","M4 5h16l-6 8v6l-4-2v-4zM8 3h8",viewScreen);
if(typeof PROC!=="undefined")PROC.reg("bud_req",{title:"Request budget and decide",std:["tbm","cobit"],steps:[
 {n:"Request budget",d:"A guided form: what, why, objective, type, amount, cost model, color, benefits, risk, alternatives, human sponsor.",who:"human",owner:"Requester",sla:"1 day",in:"An idea or a need",out:"Budget request record"},
 {n:"Check and draft",d:"AI suggests a category and color, finds duplicates and similar requests. All suggestions are labeled drafts.",who:"agent",owner:"Budget Request Agent",sla:"Instant",in:"Form values",out:"Checked request"},
 {n:"Triage",d:"Completeness, duplicates, routing by amount.",who:"human",owner:"Portfolio office",sla:"2 days",in:"Checked request",out:"Routed request"},
 {n:"Finance review",d:"Fit to color and budget, reserve and forecast effect.",who:"human",owner:"Finance business partner",sla:"3 days",in:"Routed request",out:"Finance opinion"},
 {n:"Architecture and security review",d:"Linked to existing reviews where present.",who:"human",owner:"Architecture and security lead",sla:"4 days",in:"Finance opinion",out:"Review outcome"},
 {n:"Business value scoring",d:"Demand scoring formula: strategy, return, risk reduction, urgency.",who:"auto",owner:"Portfolio analyst",sla:"3 days",in:"Review outcome",out:"Value score"},
 {n:"Portfolio council ranking",d:"The council ranks requests inside the envelope.",who:"gate",owner:"Portfolio council",sla:"7 days",in:"Value score",out:"Ranked list"},
 {n:"Funding decision",d:"The delegation of authority names the approver; decided at the matching funding gate.",who:"gate",owner:"Approver by DOA tier",sla:"3 days",in:"Ranked or routed request",out:"Decision with reason"},
 {n:"Fund and record",d:"A budget line and a reserve draw are created, the gate is recorded, the requester is told.",who:"auto",owner:"Finance",sla:"Immediate",in:"Approval",out:"Budget line, audit entry"}]});
let lastNav=0;
const cm_=q=>{const t=String(q||"").toLowerCase();let m;
 if((m=t.match(/(?:i|we)\s+(?:need|want)\s+(?:a\s+|some\s+)?budget\s+(?:for|to)\s+(.+)/))||(m=t.match(/(?:request|ask for)\s+budget\s+(?:for|to)\s+(.+)/))||(m=t.match(/can i (?:get|have)\s+\$?([\d.,]+\s*[km]?)?\s*(?:for|to)\s+(.+)/))){
  const txt=(m[2]||m[1]),am=(t.match(/\$\s?([\d.,]+)\s*(k|m)?/)||[]),n=am[1]?+am[1].replace(/,/g,"")*(am[2]==="m"?1e6:am[2]==="k"?1e3:1):0;
  const title=txt.replace(/\$\s?[\d.,]+\s*[km]?/,"").replace(/^(a|an|the)\s+/,"").trim();go("bud_req");setTimeout(()=>requestForm({t:title.charAt(0).toUpperCase()+title.slice(1),amt:n||undefined}),150);
  say(q,{t:"I opened the Request budget form with “"+H(title)+"” filled in"+(n?" and "+D$(n)+" as the amount":"")+". Add the cost model, objective and sponsor. I will check duplicates, suggest a color (labeled as a draft) and show who decides.",steps:["Started a budget request","Opened the guided form"]});return true}
 if((m=t.match(/why is (br-?\s?0?\d+) stuck/))||(m=t.match(/(br-?\s?0?\d+)/))){const id="BR-"+(m[1].replace(/\D/g,"").padStart(4,"0")),r=byId(id);if(r){go("bud_req");setTimeout(()=>openReq(id),150);const s=stuck(r);say(q,{t:"<b>"+H(id)+" "+H(r.t)+"</b> is "+(isEnd(r)?ENDS[r.st][0].toLowerCase():"in "+H(SB[r.st].n))+". "+H(s?s.t:""),steps:["Read the request timeline","Checked time in stage against its target"]});return true}}
 if(/budget request|request(s)? funnel|funding request|who decides.*budget|how (is|are) budget(s)? (decided|approved)|budget approval process|decision funnel/.test(t)){const s=stats();go("bud_req");say(q,{t:"<b>"+s.open.length+" budget requests</b> ("+D$(s.openAmt)+") are in the funnel; "+s.funded+" funded so far. Median cycle time is "+s.cycle+" days"+(s.worst&&s.worst.ratio>1?"; the slowest stage is "+H(s.worst.n)+" ("+s.worst.avg+" days against "+s.worst.sla+")":"")+". Small asks skip stages; large ones go to the portfolio council and are decided at the matching funding gate by the approver the delegation of authority names.",steps:["Counted requests by stage","Opened Budget requests"]});return true}
 return false};
if(typeof ASKX!=="undefined")ASKX.push(cm_);
if(typeof SEARCHX!=="undefined")SEARCHX.push(()=>[{g:"Actions",t:"Request budget",m:"Start a guided budget request",c:"--accent",f:()=>{go("bud_req");setTimeout(()=>requestForm(),150)},k:"request budget ask for funding need money new request intake"},{g:"Budget requests",t:"Budget requests and funding decisions",m:"Decision funnel, routing, analytics",c:"--accent",f:()=>go("bud_req"),k:"budget request funnel intake decision funding gate approval routing"}].concat(RQ().map(r=>({g:"Budget requests",t:r.id+" "+r.t,m:(isEnd(r)?ENDS[r.st][0]:SB[r.st].n)+" · "+D$(r.amt),c:"--accent",f:()=>{go("bud_req");setTimeout(()=>openReq(r.id),150)},k:r.id+" "+r.type+" "+r.req+" "+r.color+" budget request"}))));
if(typeof WORK!=="undefined")WORK.push({kind:"Budget requests",tag:"BR",fn:(name)=>RQ().filter(r=>!isEnd(r)&&(r.req===name||r.sp===name||(r.st!=="sub"&&rev(r.st,r).name===name))).map(r=>({id:r.id,t:r.t,sub:SB[r.st].n+" · "+D$(r.amt),due:curDays(r)+" of "+slaOf(r,r.st)+" d",st:stuck(r)&&stuck(r).lvl==="bad"?"bad":"info",hrs:1,go:()=>{go("bud_req");setTimeout(()=>openReq(r.id),150)}}))});
window.BUDREQ={requests:()=>RQ().map(r=>({...r})),stats,decide,submit,route,rev,gateFor,stuck,openReq,openForm:requestForm,rules:()=>RULES().map(x=>({...x})),inbox:regInbox,score:scoreNum};
/* ---------- registry wiring (lazy) ---------- */
const W={};
function wire(){try{
 if(window.NAVX&&NAVX.add&&!W.nav){NAVX.add("bud_req",{group:"money",label:"Budget requests",hint:"Ask for budget and follow how it is decided",sub:"Budget requests",kw:"budget request funnel intake ask for funding approval triage finance review council funding gate routing decision"});W.nav=true}
 if(!W.inbox&&regInbox())W.inbox=true;
 if(!W.ent&&window.ATLAS&&ATLAS.addEntity&&window.COVER&&COVER.recs){
  const fld=(k,label,type,cls,req,au)=>({k,label,type,authority:au||"platform",classification:cls||"internal",req:!!req});
  const add=(key,label,ent,how,n,path)=>{if(!COVER.recs.some(x=>x.key===key))COVER.recs.push({key,label,scr:["bud_req"],mod:"bud_req",n,ent,how,path:path||key})};
  const def={id:"budget_request",label:"Budget request",domain:"fin",source:"Budget requests",ownerApp:"bud_req",ownerMod:"bud_req",status:"proposed",note:"A request for money before any budget line exists: type, amount, cost model, color suggestion, sponsor, objective, route and stage. When funded it creates or changes a budget line and links to it.",
   fields:[fld("request_id","Request id","string","internal",1),fld("request_type","Type","enum","internal",1),fld("amount","Amount","money","confidential",1),fld("years","Years","number","internal"),fld("cost_model","Cost model by category","json","confidential"),fld("color_ref","Color of money","ref","internal"),fld("sponsor_id","Sponsor (a person)","ref","personal",1),fld("requester_id","Requester","ref","personal",1),fld("objective_ref","Strategy objective","ref","internal",1),fld("cost_center_ref","Cost center","ref","internal",1),fld("stage","Stage","enum","internal",1),fld("route","Stages for this amount","list","internal"),fld("benefit_per_year","Benefit per year","money","confidential"),fld("risk","Risk","enum","internal"),fld("budget_line_ref","Budget line created or changed","ref","internal"),fld("gate_ref","Funding gate","enum","internal"),fld("decision_reason","Decision reason","text","internal")],
   decision:"New, thin. budget_line holds approved, committed and forecast money for work that is already funded; a request exists before that and needs stages, a sponsor and a route. Approval (proposed) is reused for every stage decision, budget_line for what a funded request creates, cost_center and objective by reference, and demand scoring is reused as is.",searched:"budget_line, budget_adjustment, demand_request, approval, funding_line, cost_center, objective"};
  let r=null;try{r=ATLAS.addEntity(def)}catch(e){}
  W.dec=[{entity:"budget_request",decision:def.decision,searched:def.searched,warnings:(r&&r.warnings)||[],dups:(r&&r.duplicates)||[]},{entity:"budget_line",decision:"Reuse: a funded request creates budget lines through the existing structure.",searched:"budget_line"},{entity:"approval",decision:"Reuse: each stage decision is an approval record in the Needs you inbox.",searched:"approval"},{entity:"funding gate (fin_funding_line)",decision:"Reuse: the gate id is stored on the request and the gate rules are read from the finance model.",searched:"fin_funding_line"},{entity:"demand item",decision:"Reuse: value scoring uses the demand formula; a request links to its demand item.",searched:"demand_request"}];
  add("BUDREQ","Budget requests","budget_request","new",14,"S.br.reqs");add("BUDREQ_REVIEWS","Stage decisions on budget requests","approval","ext",30,"S.br.reqs.rv");add("BUDREQ_LINES","Budget lines created from funded requests","budget_line","direct",17,"S.bud.lines");add("BUDREQ_RULES","Routing rules by amount","approval","ext",5,"S.br.rules");
  window.BUDREQ.decisions=W.dec;W.ent=true}
 if(!W.mod&&window.MODMAP&&MODMAP.addModule&&W.ent&&tryv(()=>MODMAP.modules.some(m=>m.id==="fin_gates")&&MODMAP.modules.some(m=>m.id==="flw_appr"),false)){
  const r=MODMAP.addModule({id:"bud_req",name:"Budget requests",sn:"Budget requests",band:tryv(()=>MODMAP.modules.find(m=>m.id==="bud_over").band,"fin"),own:"Avery Chen",proposed:false,
   r:["budget_line","cost_center","objective","approval","person","project"],w:["budget_request","approval","budget_adjustment","audit_event"],
   flows:[{dir:"pull",other:"bud_over",data:"Budget lines, reserve balance and forecast",entity:"budget_line",mode:"api",trig:"Request opened or evaluated"},
    {dir:"pull",other:"port",data:"Demand items and value scores",entity:"approval",mode:"api",trig:"Business value scoring"},
    {dir:"pull",other:"fin_gates",data:"Funding gates, colors and headroom",entity:"budget_line",mode:"api",trig:"Finance review and funding decision"},
    {dir:"pull",other:"bud_doa",data:"Delegation of authority tiers",entity:"approval",mode:"api",trig:"Routing by amount"},
    {dir:"push",other:"bud_over",data:"New or changed budget lines and reserve draws",entity:"budget_line",mode:"event",trig:"Funding decision approved"},
    {dir:"push",other:"flw_appr",data:"Stage approvals for the Needs you inbox",entity:"approval",mode:"human",trig:"Request enters a review stage"},
    {dir:"push",other:"adm_audit",data:"Request, stage and funding audit events",entity:"audit_event",mode:"event",trig:"Any request change"}]});
  if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.mod=true;if(r&&r.warnings&&r.warnings.length)window.BUDREQ.modWarn=r.warnings}
 if(!W.proc&&window.PROCLIB&&PROCLIB.addProcess&&W.mod){
  const st=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o});
  const r=PROCLIB.addProcess({id:"bud_req_funnel",name:"Request budget and decide (input and decision funnel)",module:"bud_req",family:"fin",owner:"Avery Chen",backup:"Casey Rowan",trigger:"Someone needs money that is not in an approved budget line",std:["tbm","cobit"],
   steps:[st("Request budget","Guided form with a human sponsor. RACI: Responsible requester, Accountable sponsor, Consulted finance partner, Informed portfolio office.","human","Requester","1 day","An idea or need","Budget request"),
    st("Check and draft","Duplicates, similar requests, category and color suggestions, all labeled drafts.","agent","Budget Request Agent","Instant","Budget request","Checked request"),
    st("Triage","Completeness, duplicates, routing by amount.","human","Portfolio office","2 days","Checked request","Routed request"),
    st("Finance review","Fit to color and budget; reserve and forecast effect.","human","Finance business partner","3 days","Routed request","Finance opinion"),
    st("Architecture and security review","Linked to existing reviews.","human","Architecture and security lead","4 days","Finance opinion","Review outcome"),
    st("Business value scoring","Demand formula.","auto","Portfolio analyst","3 days","Review outcome","Value score"),
    st("Portfolio council ranking","Council ranks inside the envelope. RACI: Responsible council chair, Accountable CIO, Consulted finance, Informed sponsors.","gate","Portfolio council","7 days","Value score","Ranked list"),
    st("Funding decision","Approver per delegation of authority at the matching gate. RACI: Responsible approver, Accountable CFO, Consulted finance, Informed requester.","gate","Approver by DOA tier","3 days","Ranked request","Decision with reason"),
    st("Fund and record","Budget line, reserve draw, gate and audit written.","auto","Finance","Immediate","Approval","Budget line and audit entry")],
   inputs:["Budget request form","Budget lines and reserve","Funding gate rules","Demand scores"],outputs:["Decision with reason","Budget line","Audit entry"],entities:["budget_request","budget_line","approval","cost_center","objective"],metrics:["m_br_cycle","m_br_conv","m_br_sla","m_br_stuck","m_br_first"],model:"cmmi"});
  if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.proc=true;window.BUDREQ.procWarn=r&&r.warnings}
 }catch(e){console.error("budreq wire",e)}
 window.BUDREQ.wired=!!(W.nav&&W.ent&&W.mod&&W.proc&&W.inbox);
 if(W.mod&&W.proc&&!W.ref&&window.MODMAP&&MODMAP.refresh){W.ref=1;tryv(()=>MODMAP.refresh())}}
window.BUDREQ.wire=wire;window.BUDREQ.wireState=W;[600,2000,4500,8000].forEach(t=>setTimeout(wire,t));
})();
