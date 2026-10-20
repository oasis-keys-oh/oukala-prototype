
/* ---------- the alert engine: rules run over the metric model for 7 days ---------- */
const nbh=x=>String(x).replace(/-/g,"\u2011");
const SVN=id=>{const s=svcOf(id);return s?s.n:id};
const tierOf=svc=>{const s=svcOf(svc);return s?s.tier:"Tier 3"};
const ALIAS_INC={"Search and indexing":["Search service"],"Identity (Entra ID)":["Entra ID"],"Email and collaboration (M365)":["Microsoft 365"],"Endpoint management (Intune)":["End-user devices"],"Integration hub":["Taxonomy API"]};
const incFor=svc=>{const a=[svc].concat(ALIAS_INC[svc]||[]);return((S.itsm&&S.itsm.inc)||[]).find(i=>a.includes(i.svc)&&!/Resolved|Closed/.test(i.st||""))||null};
const SEVN={1:["Sev 1","bad"],2:["Sev 2","bad"],3:["Sev 3","warn"],4:["Sev 4","info"]};
const thTxt=(r,lvl)=>r.kind==="static"?(r.op+" "+MET[r.m].fmt(lvl==="crit"?r.crit:r.warn)):(r.kind==="baseline"?"above learned weekly baseline":"outside learned band, sensitivity "+(r.sens||3));
const EXT=[
 {id:"EX1",ci:"ci_por2",m:"event",fired:NOW_T-470,from:NOW_T-470,to:NOW_T,lvl:"warn",count:3,flaps:0,active:true,peak:14,sev:4,msg:"TLS certificate for standards.meridian.example expires in 14 days (renewal failed validation twice)",src:"Azure Monitor",rule:"EXT"},
 {id:"EX2",ci:"ci_ca",m:"event",fired:680,from:672,to:NOW_T,lvl:"warn",count:12,flaps:0,active:true,peak:212,sev:3,msg:"Blocked legacy sign-ins: 212 in 10 minutes (CA-007, one mail client)",src:"Entra ID",rule:"EXT"},
 {id:"EX3",ci:"ci_end0",m:"event",fired:495,from:495,to:NOW_T,lvl:"warn",count:8,flaps:0,active:true,peak:8,sev:4,msg:"8 devices fail the disk encryption compliance check",src:"Intune",rule:"EXT"},
 {id:"EX4",ci:"ci_m362",m:"event",fired:300,from:300,to:312,lvl:"warn",count:2,flaps:0,active:false,peak:1,sev:4,msg:"Teams recording webhook returned 429 twice",src:"Microsoft Graph",rule:"EXT"}];
const SRCN=m=>({cpu:"Azure Monitor",mem:"Azure Monitor",disk:"Azure Monitor",lat:"Application Insights",err:"Application Insights",avail:"Synthetic and heartbeat",thr:"Application Insights",queue:"Lumen feed",util:"Network scan (SNMP)",loss:"Network scan (SNMP)",event:"Event feed"})[m]||"Azure Monitor";
const ak=a=>a.rule+"|"+a.ci+"|"+a.fired;
function scaleAlerts(){if(scaleAlerts._c)return scaleAlerts._c;const r=RNG("scalealerts"),pick=a=>a[Math.floor(r()*a.length)],cis=SCALE.cis(),out=[];
 const msgs=[["cpu","CPU 91% for 15 minutes"],["mem","Memory 94% used"],["disk","Data disk 86% used"],["lat","Latency p95 2.4 s"],["err","Error rate 3.1%"],["avail","Heartbeat missed 3 times"],["util","Link utilization 82%"],["queue","Queue depth 7,200 messages"]];
 for(let i=0;i<2600;i++){const c=pick(cis),m=pick(msgs),fired=NOW_T-Math.floor(r()*r()*1430),cnt=1+Math.floor(r()*r()*80),lvl=r()<.2?"crit":"warn",act=fired>NOW_T-240&&r()<.5;
  out.push({id:"S"+(1000+i),rule:"AR"+pad(1+Math.floor(r()*12)),ci:c.id,m:m[0],fired,from:fired-5,to:act?NOW_T:fired+10+Math.floor(r()*60),lvl,count:cnt,flaps:r()<.1?2+Math.floor(r()*5):0,active:act,peak:0,msg:m[1],src:SRCN(m[0]),svc:c.svc,sev:lvl==="crit"?(r()<.1?1:2):(r()<.5?3:4),scaleGen:true})}
 return scaleAlerts._c=out}
let AC=null;
function computeAll(){const key=O.ver+"|"+SCALE.on+"|"+JSON.stringify(O.corr||0)+"|"+JSON.stringify(O.st).length+"|"+Object.keys(O.fpMark||{}).length;if(AC&&AC.key===key)return AC;
 const alerts=[],hist=[],t0=NOW_T-7*DAYMIN;
 O.rules.forEach(r=>{if(!r.on)return;CIREG.forEach(c=>{if(!inCls(r,c)||!metsOf(c).includes(r.m))return;episodes(r,c,t0,NOW_T,10).forEach(e=>{const sv=c.svc,tier=tierOf(sv);const crit=e.lvl==="crit";const sev=crit?(tier==="Tier 1"&&(r.m==="avail"||r.m==="err")?1:tier==="Tier 3"?3:2):(tier==="Tier 1"?3:4);
   const a=Object.assign({rule:r.id,ci:c.id,m:r.m,svc:sv,sev,src:SRCN(r.m),msg:"",tier},e);a.msg=MET[r.m].n+" "+MET[r.m].fmt(e.peak)+" (threshold "+thTxt(r,e.lvl)+")"+(e.flaps?", flapped "+(e.flaps+1)+" times":"");hist.push(a)})})});
 EXT.forEach(x=>{const c=ciOf(x.ci);hist.push(Object.assign({svc:c?c.svc:"",tier:c?tierOf(c.svc):"Tier 2"},x))});
 hist.sort((a,b)=>a.fired-b.fired);hist.forEach((a,i)=>{a.id=a.id&&/^EX/.test(a.id)?a.id:"A-"+(5000+i);a.k=ak(a)});
 const mark=O.fpMark=O.fpMark||{};
 if(!O.seeded){O.seeded=1;const why={"AR12|ci_cr2":"Expected: nightly backup job warning, no data loss","AR05|ci_int0":"Expected during the Taxonomy nightly batch (PRB0008)"};hist.forEach(a=>{const k=a.rule+"|"+a.ci;if(why[k]&&a.fired<NOW_T-DAYMIN*.9&&hn(a.k,5)>.12){mark[k+"|"+a.fired]={why:why[k],by:"Sam Patel",at:a.fired+30,kind:"Expected behavior"}}})}
 hist.forEach(a=>{a.fp=!!mark[a.rule+"|"+a.ci+"|"+a.fired];a.win=a.sup;a.state=a.sup?(a.sup.mode==="Suppress alerts"?"Suppressed":"Downgraded"):a.fp?"False positive":O.st[a.k]?O.st[a.k].st:a.active?"Open":"Cleared"});
 const day=hist.filter(a=>a.fired>=NOW_T-DAYMIN);
 let all=day;if(SCALE.on)all=day.concat(scaleAlerts());
 /* correlation */
 const adj={};CIEDGE.forEach(([a,b])=>{(adj[a]=adj[a]||new Set()).add(b);(adj[b]=adj[b]||new Set()).add(a)});
 const CR=O.corr=O.corr||{topo:true,svc:true,win:45};
 const near=(a,b)=>{if(a===b)return true;if(!CR.topo)return false;const s=adj[a];if(!s)return false;if(s.has(b))return true;for(const x of s){if(adj[x]&&adj[x].has(b))return true}return false};
 const live=day.filter(a=>!a.sup&&!a.fp);const par=live.map((_,i)=>i);const f=i=>par[i]===i?i:(par[i]=f(par[i]));
 for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){const a=live[i],b=live[j];if(Math.abs(a.fired-b.fired)<=CR.win&&((CR.svc&&a.svc===b.svc)||near(a.ci,b.ci)))par[f(i)]=f(j)}
 const gm={};live.forEach((a,i)=>{(gm[f(i)]=gm[f(i)]||[]).push(a)});
 const down=(from)=>{const seen=new Set([from]),q=[from];while(q.length){const x=q.shift();CIEDGE.forEach(([a,b])=>{if(a===x&&!seen.has(b)){seen.add(b);q.push(b)}})}return seen};
 const groups=Object.values(gm).map((al,i)=>{al.sort((a,b)=>a.fired-b.fired);const cis=[...new Set(al.map(a=>a.ci))];let rc=cis[0],best=-1;cis.forEach(c=>{const dependents=cis.filter(o=>o!==c&&down(o).has(c)).length;if(dependents>best||(dependents===best&&al.find(a=>a.ci===c).fired<al.find(a=>a.ci===rc).fired)){best=dependents;rc=c}});
  const svcs=[...new Set(al.map(a=>a.svc))],sev=Math.min(...al.map(a=>a.sev)),act=al.some(a=>a.active),rcc=ciOf(rc),edge=CIEDGE.find(e=>e[1]===rc&&cis.includes(e[0]));
  const reason=cis.length>1?(best>0?"Topology: "+best+" of the other "+(cis.length-1)+" CIs depend on "+nbh(rcc?rcc.name:rc)+(edge?" ("+nbh((ciOf(edge[0])||{name:edge[0]}).name)+" "+edge[2]+" "+nbh(rcc?rcc.name:rc)+" in the CMDB)":""):"Time and service proximity: alerts within 45 minutes on connected CIs"):"Single alert, no correlated neighbors";
  const inc=incFor(SVN(svcs[0]));return {id:"G"+(i+1),al,cis,rc,svcs,sev,active:act,start:al[0].fired,reason,inc,n:al.length,cnt:sum(al,a=>a.count),topo:cis.length>1}}).sort((a,b)=>(a.sev-b.sev)||(b.n-a.n));
 groups.forEach((g,i)=>{g.id="G"+(i+1);g.al.forEach(a=>a.grp=g.id)});
 const stm={};all.forEach(a=>{if(a.active&&!a.sup&&!a.fp&&a.state!=="Resolved"&&a.state!=="Cleared"){const o=stm[a.ci]||(stm[a.ci]={s:9,flap:false});o.s=Math.min(o.s,a.sev);if(a.flaps>=2)o.flap=true}});
 const supN=day.filter(a=>a.sup&&a.sup.mode==="Suppress alerts").length,fpN=day.filter(a=>a.fp).length;
 const info=2950+Math.round(hn("info",O.ver)*40),rawN=sum(day,a=>a.count)+info,uniq=day.length;
 const actionable=groups.filter(g=>g.sev<=3||g.n>=3),inc=groups.filter(g=>g.sev<=2&&g.active);
 const sc=SCALE.on?{raw:rawN*28,uniq:uniq+scaleAlerts().length,after:uniq+scaleAlerts().length-Math.round(scaleAlerts().length*.35),groups:groups.length+Math.round(scaleAlerts().length*.18),act:actionable.length+Math.round(scaleAlerts().length*.04),inc:inc.length+9}:null;
 const fun=sc?[sc.raw,sc.uniq,sc.after,sc.groups,sc.act,sc.inc]:[rawN,uniq,uniq-supN-fpN,groups.length,actionable.length,inc.length];
 /* MTTD / MTTA */
 const detected=day.filter(a=>a.m!=="event"&&!a.sup);const mttd=detected.length?avg(detected.map(a=>a.fired-a.from))+1:0;
 const ack=a=>O.st[a.k]&&O.st[a.k].at!=null?O.st[a.k].at-a.fired:(a.active&&!a.sup?null:2+9*hn(a.k,1));
 const acks=day.filter(a=>!a.sup&&!a.fp).map(ack).filter(x=>x!=null);const mtta=acks.length?avg(acks):0;
 const resp=6,perResp=day.filter(a=>!a.sup).length/resp,nonAct=1-actionable.length/Math.max(1,groups.length);
 const fatigue=Math.round(50*Math.min(1,perResp/25)+50*Math.max(0,Math.min(1,nonAct)));
 const w7=hist.filter(a=>!a.sup);const fpTot=hist.filter(a=>a.fp).length;
 AC={key,hist,day,all,stm,groups,fun,supN,fpN,info,rawN,mttd,mtta,fatigue,perResp,nonAct,fpRate:w7.length?fpTot/w7.length*100:0,ack};
 return AC}
const bump=()=>{O.ver++;AC=null};
/* host and group status: worst open alert */
function ciStatus(id){const A=computeAll();const o=A.stm[id];if(!o){const c=ciOf(id);return c&&/Non-operational/.test(c.status||"")?"unknown":"ok"}return o.s<=2?(o.flap?"flap":"crit"):"warn"}
const STC={ok:["OK","--good-f","good"],warn:["Warning","--warn-f","warn"],crit:["Critical","--bad-f","bad"],unknown:["Unknown","--faint","mute"],flap:["Flapping","--u3","info"]};
