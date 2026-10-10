
/* ---------- enterprise scale: generated incidents, problems and changes (deterministic) ---------- */
const GSVC_TEAM={svc_cod:"Platform team",svc_portal:"Platform team",svc_search:"Lumen (vendor)",svc_cr:"Platform team",svc_erp:"Finance",svc_fin:"Finance",svc_id:"Security",svc_m365:"Service desk",svc_data:"Data team",svc_net:"Ops team",svc_end:"Service desk",svc_int:"Platform team",svc_desk:"Service desk"};
const GISSUE=["is slow for several users","returns errors on save","cannot sign in","report shows wrong totals","sync is failing","certificate expires soon","disk space is low on the host","access change was not applied","times out intermittently","alert keeps flapping","needs a configuration review","fails after the overnight update"];
function genProblems(){if(X._gp)return X._gp;const r=RNG("itsm-prb"),pick=a=>a[Math.floor(r()*a.length)];const out=[];const sts=["New","Assess","Root cause analysis","Fix in progress","Resolved","Resolved","Fix in progress"];
 for(let n=0;n<120;n++){const s=pick(SVCREG);const st=pick(sts);out.push({id:"PRB"+(1100+n),t:s.n+" "+pick(GISSUE),svc:s.n,pr:1+Math.floor(r()*4),st,owner:pick(DIR.filter(d=>d.kind==="human"&&!d.generated)).name,opened:addD(TODAYI,-Math.floor(r()*90)),users:Math.floor(5+r()*r()*400),why:["","","","",""],fb:{},cause:st==="Resolved"?"Confirmed: configuration drift.":"",workaround:r()<.6?"Restart the component and retry.":"",fix:"",chg:"",past:Array.from({length:8},()=>Math.floor(r()*r()*5)),kb:"",gen:1,fish:{People:[],Process:[],Technology:[{id:"g"+n,t:"Configuration drift on "+s.n,st:"probable"}],Environment:[],Vendor:[],Data:[]}})}
 return X._gp=out}
function genInc(){if(X._gi)return X._gi;const r=RNG("itsm-inc"),pick=a=>a[Math.floor(r()*a.length)];const allP=X.prb.concat(genProblems()).map(p=>p.id);const hot=["PRB0010","PRB0007","PRB0008","PRB0009"];const out=[];
 const cis={};CIREG.forEach(c=>{(cis[c.svc]=cis[c.svc]||[]).push(c.id)});
 const NG=(SCALE.n&&SCALE.n.incidents)||1200;for(let n=0;n<NG;n++){const s=pick(SVCREG),tm=GSVC_TEAM[s.id]||"Service desk",x=r(),st=x<.1?"New":x<.34?"In progress":x<.41?"On hold":"Resolved",age=Math.round((r()*r()*r()*(st==="Resolved"?2400:160)+.2)*10)/10,pr=r();
  const mem=members(tm);const o=st==="New"||r()<.1?"":(mem.length?mem[Math.floor(r()*mem.length)].name:"");
  const i={id:"INC"+(500000+n),t:s.n+" "+pick(GISSUE),d:"Generated enterprise incident for scale testing.",caller:"User "+(1000+Math.floor(r()*4000)),ch:pick(CHAN),svc:s.n,ci:pick(cis[s.id]||["ci_az"]),cat:pick(CATS),grp:tm,own:o,st,age,respH:st==="New"?null:Math.round(r()*3*10)/10,gen:1,
   ua:Math.floor(r()*r()*s.users*(r()<.02?.4:.02)),deg:Math.floor(r()*r()*100),txh:r()<.15?Math.floor(r()*r()*12000):0,reg:r()<.04?(r()<.3?2:1):0,urg:r()<.04?1:r()<.3?2:r()<.7?3:4,role:r()<.8?"analyst":"lead",vip:r()<.03?pick(["exec","board","crit"]):"",
   prb:r()<.14?(r()<.5?pick(hot):pick(allP)):"",chg:"",kb:"",maj:false,notes:[]};
  if(st==="On hold"){i.pausedH=Math.round(age*.5*10)/10;i.hold="Waiting on vendor"}
  if(st==="Resolved"){i.resH=Math.round(Math.max(.2,Math.min(age,r()*r()*40+.5))*10)/10;i.code="Solved (permanently)";i.resNotes="Generated record.";i.age=Math.max(age,i.resH)}
  if(o&&!members(tm).some(m=>m.name===o))i.direct={by:ME,why:"Skills match"};
  out.push(i)}
 return X._gi=out}
function genChg(){if(X._gc)return X._gc;const r=RNG("itsm-chg"),pick=a=>a[Math.floor(r()*a.length)];const out=[];const things=["patching","configuration update","capacity change","certificate renewal","version upgrade","firewall rule change","access policy update","backup job change"];
 const NC=(SCALE.n&&SCALE.n.changes)||300;for(let n=0;n<NC;n++){const s=pick(SVCREG),ty=r()<.55?"Standard":r()<.9?"Normal":"Emergency",x=r(),st=x<.04?"Draft":x<.08?"Assess":x<.14?"Authorize":x<.44?"Scheduled":x<.47?"Implement":x<.52?"Review":x<.97?"Closed":"Rejected";
  const start=st==="Closed"||st==="Review"?addD(TODAYI,-Math.floor(r()*70)-1):addD(TODAYI,Math.floor(r()*100)-2);const ci=CIREG.filter(c=>c.svc===s.id);
  const rs=ty==="Standard"?Math.floor(5+r()*15):Math.floor(10+r()*r()*70);
  out.push({id:"CHG"+(6000+n),t:s.n+" "+pick(things),type:ty,svc:s.n,cis:ci.length?[pick(ci).id]:[],st,req:pick(["Sam Patel","Jordan Lee","Dev Rao","Priya Shah"]),own:pick(["Sam Patel","Jordan Lee","Ravi Menon","Elise Park"]),grp:GSVC_TEAM[s.id]||"Ops team",start,end:start,win:"Off-hours: 22:00 to 02:00",env:pick(["Production","Production","Production","Test","Dev"]),just:"Generated change for scale testing.",impl:"",back:"",test:"",rq:{},prb:"",inc:"",rel:"",proj:"",cost:r()<.15?Math.floor(r()*40000):0,appr:[],stages:[],ok:[],gen:1,rs,out:st==="Closed"?(r()<.1?"Failed":"Successful"):undefined,hist:st==="Closed"&&start<"2026-09-07"?1:0}) }
 return X._gc=out}
const ALLI=()=>{const k=X.inc.length+"|"+SCALE.on;if(X._ak===k)return X._all;X._ak=k;X._all=SCALE.on?X.inc.concat(genInc()):X.inc;X._map=null;X._pidx=null;return X._all};
const ALLP=()=>SCALE.on?X.prb.concat(genProblems()):X.prb;
const ALLC=()=>SCALE.on?X.chg.concat(genChg()):X.chg;
const INC=id=>{const a=ALLI();if(!X._map){X._map=new Map();a.forEach(i=>X._map.set(i.id,i))}return X._map.get(id)};
const PRB=id=>ALLP().find(p=>p.id===id),CHGB=id=>ALLC().find(c=>c.id===id),KBA=id=>X.kb.find(k=>k.id===id)||X.ke.find(k=>k.id===id);
const pidxReset=()=>{X._pidx=null};
const incsOf=p=>{if(!X._pidx){ALLI();X._pidx=new Map();ALLI().forEach(i=>{if(i.prb){(X._pidx.get(i.prb)||X._pidx.set(i.prb,[]).get(i.prb)).push(i)}})}return X._pidx.get(p.id)||[]};
const isOpen=i=>i.st!=="Resolved";
const nextId=(k,p,w)=>p+String(X.seq[k]++).padStart(w||4,"0");
const noteAdd=(i,w,k,x)=>i.notes.push({a:0,w,k,x});
`SLA_COPY`
const slaChip=(lab,t)=>`<span class="itsm-sla ${t.cls}" title="${esc(lab)} target ${fH(t.tgt)}"><b>${lab}</b>${esc(t.txt)}</span>`;
const slaMeter=(lab,t,paused)=>`<div class="itsm-m"><div class="row sp"><b>${lab}</b><span class="itsm-sla ${t.cls}">${paused?"Paused: ":""}${esc(t.txt)}</span></div><div class="itsm-bar"><i class="${t.cls}" style="width:${t.pct}%"></i><u style="left:75%" title="Risk zone starts at 75% of the target"></u></div><small class="muted">Target ${fH(t.tgt)}</small></div>`;

/* ---------- AI triage: suggestions only, a person confirms ---------- */
const TRULES=[[/latenc|slow|timeout|time out|502|503|saturat|hang|performance/i,"Performance","Ops team","Sam Patel"],[/mfa|password|sign.?in|login|entra|locked out|access|403/i,"Access and identity","Service desk","Tom Becker"],[/vpn|network|wifi|dns|switch/i,"Network","Ops team","Ravi Menon"],[/search|index|taxonomy|export|report|data/i,"Data","Data team","Dev Rao"],[/lease|ledger|erp|posting|invoice/i,"Application","Finance","Avery Chen"],[/laptop|printer|print|intune|device|keyboard/i,"Hardware","Service desk","Northwind Managed Services"],[/certificate|phish|malware|security|breach/i,"Security","Security","Rina Okafor"],[/upload|save|error|crash|portal|app/i,"Application","Platform team","Elise Park"]];
const SRULES=[[/portal|reader|subscriber/i,"Standards Portal"],[/codification|editor|workbench/i,"Standards Platform"],[/search|index/i,"Search and indexing"],[/taxonomy|lakehouse|pipeline/i,"Data platform"],[/lease|ledger|erp/i,"Lease subledger (ERP)"],[/contract/i,"Contract Repository"],[/mfa|entra|sign.?in/i,"Identity (Entra ID)"],[/teams|outlook|m365|sharepoint|recording|mailbox/i,"Email and collaboration (M365)"],[/azure|vpn|network/i,"Network and VPN"],[/laptop|print|intune/i,"Endpoint management (Intune)"]];
const STOP=new Set("the and for with that this from when after during over under not are was were has have been into your their they them cannot".split(" "));
const toks=s=>new Set((s||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>3&&!STOP.has(w)));
function classify(text,skip){const t=text||"";const hit=TRULES.find(r=>r[0].test(t));const sv=SRULES.find(r=>r[0].test(t));
 const num=(t.match(/\b(\d{1,4})\s+(editors|users|people|directors|laptops|reports)/i)||[])[1];const ua=num?+num:/everyone|all users|all editors/i.test(t)?120:/one user|single|my /i.test(t)?1:5;
 const deg=/down|outage|cannot|can't|unable|blocked|stopped|fails|failing/i.test(t)?70:/slow|degrad|intermittent/i.test(t)?40:15;
 const urg=/cannot|can't|fails|failing|blocked|stopped|down|unable/i.test(t)?2:/cosmetic|minor|question|slow print/i.test(t)?4:3;
 const words=[...toks(t)].filter(w=>TRULES.some(r=>r[0].test(w))||SRULES.some(r=>r[0].test(w)));
 const conf=t.length<6?0:hit?Math.min(.94,.62+words.length*.1):.4;
 const A=toks(t),sim=[...X.inc.filter(i=>i.id!==skip).map(i=>({id:i.id,t:i.t,svc:i.svc,res:i.resNotes||(i.kb?"Documented in "+i.kb:"Still open"),h:i.st==="Resolved"?i.resH:null,src:i})),...X.histI].map(o=>{const B=toks(o.t+" "+(o.d||""));let n=0;A.forEach(w=>{if(B.has(w))n++});const u=A.size+B.size-n;return {...o,sc:u?n/u+(sv&&o.svc===sv[1]?.12:0):0}}).filter(o=>o.sc>.12).sort((a,b)=>b.sc-a.sc).slice(0,3);
 return {cat:hit?hit[1]:"Other",grp:hit?hit[2]:"Service desk",own:hit?hit[3]:"",svc:sv?sv[1]:"",urg,ua,deg,conf,words,sim}}

/* ---------- assignment: team first, a person only by claiming or with a reason ---------- */
function asg(i){const m=i.own?who(i.own):null,inTeam=!!(m&&m.team===i.grp);return {team:i.grp,person:i.own||"",kind:i.own?kindOf(i.own):"",inTeam,direct:!!(i.own&&(i.direct||(!inTeam&&m&&m.kind==="human"))),type:!i.own?"Team queue":i.direct?"Direct assignment":m&&m.kind==="ai"?"Agent":"Claimed from the team queue"}}
const ITILNOTE="ITIL 5 practice guidance: route work to a team and let a member claim it, so the work survives absence and the whole team owns the service. Name an individual only when their knowledge is unique, and say why. Swarm when the problem needs more than one skill.";
function claim(i,name,why,direct){i.own=name;if(i.st==="New")i.st="In progress";if(i.respH==null)i.respH=i.age;if(direct){i.direct={by:ME,why:why}}else delete i.direct;i.notes.push({a:0,w:name,k:"System",x:direct?"Assigned directly to "+name+". Reason: "+why:"Claimed from the "+i.grp+" queue."})}

/* ---------- metrics tied to records ---------- */
function syncM(){const A=ALLI();let open=0,el=0,res=0,resh=0,met=0,tm=0,ov=0,rep=0;const openP=new Set(ALLP().filter(p=>p.st!=="Resolved").map(p=>p.id));
 A.forEach(i=>{if(i.st!=="Resolved"){open++;el+=i.age-(i.pausedH||0)}else{res++;resh+=i.resH||0;if(slaOf(i).res.rem>=0)met++}if(!i.direct)tm++;if(i.ovr)ov++;if(i.prb&&openP.has(i.prb))rep++});
 METRICS.m_itsm_backlog.cur=open?Math.round(el/open*10)/10:0;
 METRICS.m_itsm_sla.cur=SCALE.on?Math.round((met/Math.max(1,res))*100):Math.round((18+met)/(19+res)*100);
 METRICS.m_itsm_mttrall.cur=res?Math.round(resh/res*10)/10:0;METRICS.m_itsm_team.cur=Math.round(tm/A.length*100);METRICS.m_itsm_ovr.cur=Math.round(ov/A.length*1000)/10;
 METRICS.m_itsm_repeat.cur=Math.round(rep/A.length*100);
 const done=X.chg.filter(c=>c.out&&c.start>="2026-09-07"),f=done.filter(c=>c.out==="Failed").length;METRICS.m_itsm_cfr.cur=done.length?Math.round(f/done.length*1000)/10:0;
 const m=X.mi,cur=m.restored!=null?m.start-m.restored:m.start;METRICS.m_itsm_mttr.cur=Math.round((7.9+(m.on||m.restored!=null?cur:0))/(m.on||m.restored!=null?4:3)*10)/10}
const dayRange=(a,b)=>{const o=[];for(let d=a;d<=b;d=addD(d,1))o.push(d);return o};
const CTC={Standard:"info",Normal:"good",Emergency:"bad"};
function done(msg,d,keep){syncM();audit(msg,d||"");toast(msg+(d?": "+d:""),"good");render();if(keep)keep()}
