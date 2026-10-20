/* ===== Oukala observability, event management and automation (module obs) =====
   Screens: itom_evt (Event management), obs_dash (Dashboards and metrics), itom_slo (Observability and SLOs),
   itom_run (Runbooks and automation), obs_std (Standard change catalog and SOPs).
   Everything on screen is computed from one deterministic metric model: a pure function value(ci, metric, minute).
   Alerts are episodes found by running the alert rules over that model, so a threshold preview, the alert stream,
   the patterns and the false positive statistics always agree with each other. */
(function(){
const H=esc,N0=n=>Math.round(n).toLocaleString("en-US"),P1=n=>(Math.round(n*10)/10).toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1}),P2=n=>(Math.round(n*100)/100).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const O=S.obs=S.obs||{ver:0,rng:"24h",selCi:["ci_cod2","ci_cod4"],selMet:"cpu",dash:null,dashSel:"d1",edit:false,st:{},fp:{},fpAct:{},wins:null,rules:null,chg:{},exec:null,ar:null,sc:null,run:null,rbSel:"SC-01",simSel:null,slos:null,syn:null,mark:{},grpSel:null,sevF:"All",stF:"All",host:null,traceSel:0,logQ:"",cand:{}};
const NOW_T=810,DAYMIN=1440;
const pad=n=>String(n).padStart(2,"0");
const dt=t=>new Date(2026,9,6,0,Math.round(t));
const hm=t=>{const d=dt(t);return pad(d.getHours())+":"+pad(d.getMinutes())};
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const dlab=t=>{const d=dt(t);return MON[d.getMonth()]+" "+d.getDate()};
const fT=t=>(t>=0&&t<DAYMIN?"":dlab(t)+" ")+hm(t);
const ago=m=>{m=Math.round(m);return m<1?"just now":m<60?m+" min ago":m<1440?Math.floor(m/60)+" h "+(m%60?pad(m%60)+" min":"")+" ago":Math.floor(m/1440)+" d ago"};
const dur=m=>{m=Math.round(m);return m<60?m+" min":m<1440?Math.floor(m/60)+" h"+(m%60?" "+m%60+" min":""):Math.floor(m/1440)+" d "+Math.round((m%1440)/60)+" h"};
const dowOf=t=>(((Math.floor(t/DAYMIN)+2)%7)+7)%7; /* Oct 6 2026 is a Tuesday = 2 */
const DOWN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
/* deterministic noise */
const hz=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const hn=(seed,t)=>{let x=(typeof seed==="number"?seed:hz(seed))+Math.imul(t|0,374761393);x=Math.imul(x^(x>>>13),1274126177);return((x^(x>>>16))>>>0)/4294967296};
const smooth=(seed,t,w)=>{const a=Math.floor(t/w),f=t/w-a;const u=f*f*(3-2*f);return hn(seed,a)*(1-u)+hn(seed,a+1)*u};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sum=(a,f)=>a.reduce((x,y)=>x+(f?f(y):y),0);
const avg=a=>a.length?sum(a)/a.length:0;
const sd=a=>{const m=avg(a);return Math.sqrt(avg(a.map(x=>(x-m)**2)))};
const who_=()=>PERSONAS[S.persona].n;
const nowTxt=()=>new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"});

/* ---------- metric catalog ---------- */
const MET={
 cpu:{n:"CPU",u:"%",max:100,fmt:v=>P1(v)+"%",base:[22,52],amp:20,col:"--p4"},
 mem:{n:"Memory",u:"%",max:100,fmt:v=>P1(v)+"%",base:[45,72],amp:5,col:"--u3"},
 disk:{n:"Disk used",u:"%",max:100,fmt:v=>P1(v)+"%",base:[38,70],amp:0,col:"--w1"},
 lat:{n:"Latency p95",u:" ms",max:6000,fmt:v=>N0(v)+" ms",base:[140,380],amp:120,col:"--e4"},
 err:{n:"Error rate",u:"%",max:15,fmt:v=>P2(v)+"%",base:[.05,.5],amp:.25,col:"--e1"},
 avail:{n:"Availability",u:"%",max:100,min:90,fmt:v=>P2(v)+"%",base:[99.97,100],amp:0,col:"--s3"},
 thr:{n:"Throughput",u:" req/s",max:1500,fmt:v=>N0(v)+" req/s",base:[70,380],amp:260,col:"--p1"},
 queue:{n:"Queue depth",u:" msgs",max:30000,fmt:v=>N0(v)+" msgs",base:[15,180],amp:140,col:"--u1"},
 util:{n:"Link utilization",u:"%",max:100,fmt:v=>P1(v)+"%",base:[12,40],amp:24,col:"--p6"},
 loss:{n:"Packet loss",u:"%",max:5,fmt:v=>P2(v)+"%",base:[0,.08],amp:.06,col:"--bad-f"}
};
const CLM={"Virtual machine":["cpu","mem","disk","util"],"Database":["cpu","mem","disk","lat"],"Application":["lat","err","thr","avail"],"Load balancer":["lat","err","thr"],"Network device":["util","loss","avail"],"Storage":["disk","lat","err"],"Cloud resource":["avail","thr","err"],"Cloud subscription":["avail"],"Server":["cpu","mem","disk"],"Container":["cpu","mem","err"]};
const EXTRA={ci_sea0:["queue"],ci_sea1:["queue"],ci_sea2:["queue"],ci_dat3:["queue"]};
const metsOf=ci=>(CLM[ci.class]||["avail"]).concat(EXTRA[ci.id]||[]);
const CIM=()=>{if(!CIM._m){CIM._m={};CIREG.forEach(c=>CIM._m[c.id]=c)}return CIM._m};
const ciOf=id=>{const c=CIM()[id];if(c)return c;if(SCALE.on){if(!SCALE._scm){SCALE._scm={};SCALE.cis().forEach(x=>{SCALE._scm[x.id]={id:x.id,name:x.name,class:x.class,svc:x.svc,env:x.env,status:x.status,owner:x.owner,crit:x.crit,uptime:x.uptime,gen:1}})}return SCALE._scm[id]||null}return null};
/* named incidents in the model (all times are minutes since midnight Oct 6) */
const SP=[
 {ci:"ci_cod2",m:"cpu",from:548,amp:50,ramp:12,story:"Portal database CPU saturates at 09:08"},
 {ci:"ci_cod2",m:"lat",from:548,amp:900,ramp:12},
 {ci:"ci_cod4",m:"lat",from:552,amp:3400,ramp:10},{ci:"ci_cod4",m:"err",from:553,amp:6.8,ramp:8},{ci:"ci_cod4",m:"thr",from:553,amp:-150,ramp:10},
 {ci:"ci_por4",m:"lat",from:553,amp:2900,ramp:10},{ci:"ci_por4",m:"err",from:556,amp:4.4,ramp:8},
 {ci:"ci_cod3",m:"lat",from:553,amp:2100,ramp:10},{ci:"ci_cod3",m:"err",from:555,amp:3.2,ramp:8},
 {ci:"ci_cod0",m:"cpu",from:552,amp:34,ramp:12},{ci:"ci_cod1",m:"cpu",from:552,amp:31,ramp:12},
 {ci:"ci_sea0",m:"queue",from:545,amp:19000,ramp:150},{ci:"ci_sea1",m:"queue",from:560,amp:9000,ramp:150},{ci:"ci_sea0",m:"cpu",from:548,amp:41,ramp:20},{ci:"ci_sea2",m:"lat",from:562,amp:1900,ramp:30},{ci:"ci_sea2",m:"err",from:566,amp:2.6,ramp:20},
 {ci:"ci_vpn",m:"avail",from:640,to:790,amp:-4.6,sq:14},{ci:"ci_vpn",m:"util",from:640,to:790,amp:26,sq:14},
 {ci:"ci_fw",m:"loss",from:700,to:782,amp:1.9,ramp:6},{ci:"ci_fw",m:"util",from:700,to:782,amp:38,ramp:6},
 {ci:"ci_int0",m:"err",tod:60,dur:16,amp:9.5,ramp:2},
 {ci:"ci_cr2",m:"err",tod:180,dur:14,amp:3.4,ramp:2},
 {ci:"ci_erp0",m:"cpu",dow:3,tod:120,dur:120,amp:58,ramp:6},
 {ci:"ci_erp0",m:"lat",dow:3,tod:120,dur:120,amp:1400,ramp:6},
 {ci:"ci_erp1",m:"cpu",from:640,to:700,amp:30,ramp:6},
 {ci:"ci_dat1",m:"lat",tod:30,dur:50,amp:1100,ramp:6},{ci:"ci_dat1",m:"err",tod:34,dur:8,amp:2.6,ramp:2},
 {ci:"ci_dat3",m:"mem",from:-8600,amp:30,ramp:8600,leak:1}
];
const SPBY={};SP.forEach(s=>{(SPBY[s.ci+"|"+s.m]=SPBY[s.ci+"|"+s.m]||[]).push(s)});
function spv(s,t){const rise=(x,r)=>clamp(x/Math.max(1,r),0,1);
 if(s.tod!=null){const md=((t%DAYMIN)+DAYMIN)%DAYMIN;if(s.dow!=null&&dowOf(t)!==s.dow)return 0;const x=md-s.tod;if(x<0||x>s.dur)return 0;return s.amp*Math.min(rise(x,s.ramp),rise(s.dur-x,s.ramp))}
 if(t<s.from)return 0;if(s.to!=null&&t>s.to)return 0;
 if(s.sq){return Math.floor((t-s.from)/(s.sq/2))%2===0?s.amp:0}
 return s.amp*rise(t-s.from,s.ramp)}
const bh=t=>{const h=(((t%DAYMIN)+DAYMIN)%DAYMIN)/60,d=dowOf(t);const sh=Math.max(0,Math.sin((h-6)/12*Math.PI));return sh*(d===0||d===6?.32:1)};
const BASEC={};
function baseOf(id,m){const k=id+"|"+m;if(BASEC[k])return BASEC[k];const M=MET[m],r=hn(k,7),b=M.base[0]+(M.base[1]-M.base[0])*r;return BASEC[k]={b,amp:M.amp*(.6+.8*hn(k,9)),nz:(m==="avail"?.02:M.base[1]*.06)*(.5+hn(k,11))}}
const VMEMO={};let REALCI=new Set();
function val(id,m,t){if(t===(t|0)&&t>-19600&&t<1400){if(REALCI.size!==CIREG.length)REALCI=new Set(CIREG.map(c=>c.id));if(REALCI.has(id)){const k=id+"|"+m;const a=VMEMO[k]||(VMEMO[k]=new Float32Array(21000).fill(NaN));const i=t+19600,x=a[i];if(x===x)return x;return a[i]=val0(id,m,t)}}return val0(id,m,t)}
function val0(id,m,t){const M=MET[m],B=baseOf(id,m);let v;
 if(m==="avail"){v=100-Math.max(0,(hn(id+m,Math.floor(t/5))-.985)*3)}
 else if(m==="disk"){const slope=id==="ci_erp1"?1.1:.06+.08*hn(id,3);v=(id==="ci_erp1"?81.4:B.b)+slope*((t-NOW_T)/DAYMIN)+(smooth(id+m,t,180)-.5)*.3}
 else v=B.b+B.amp*bh(t)+(smooth(id+m,t,25)-.5)*2*B.nz+(hn(id+m,t)-.5)*B.nz*.8;
 const sp=SPBY[id+"|"+m];if(sp)for(const s of sp){if(s.leak)v+=s.amp*clamp((t-s.from)/s.ramp,0,1);else v+=spv(s,t)}
 if(m==="loss"||m==="err"||m==="queue"||m==="lat")v=Math.max(0,v);
 return clamp(v,M.min||0,m==="avail"?100:M.max*2)}
const RANGES={"1h":{n:"Last hour",pts:60,step:1},"6h":{n:"Last 6 hours",pts:72,step:5},"24h":{n:"Last 24 hours",pts:96,step:15},"7d":{n:"Last 7 days",pts:168,step:60}};
const SERC={};
function ser(id,m,rg,end){rg=rg||"24h";end=end==null?NOW_T:end;const R=RANGES[rg],k=id+m+rg+end;if(SERC[k])return SERC[k];const out=[];for(let i=R.pts-1;i>=0;i--)out.push(val(id,m,end-i*R.step));return SERC[k]={v:out,t0:end-(R.pts-1)*R.step,step:R.step}}
const lastv=(id,m)=>val(id,m,NOW_T);

/* ---------- alert rules (thresholds) ---------- */
const SENS={1:5,2:4,3:3.2,4:2.6,5:2.2};
function defRules(){return [
 {id:"AR01",n:"CPU high on servers and databases",m:"cpu",cls:["Virtual machine","Database","Server"],kind:"static",op:">",warn:80,crit:92,forMin:15,on:true,own:"Ops team",rule:"SC-02"},
 {id:"AR02",n:"Memory pressure",m:"mem",cls:["Virtual machine","Database","Server"],kind:"static",op:">",warn:85,crit:93,forMin:10,on:true,own:"Ops team",rule:null},
 {id:"AR03",n:"Disk space",m:"disk",cls:["Virtual machine","Database","Storage"],kind:"static",op:">",warn:80,crit:90,forMin:0,on:true,own:"Ops team",rule:"SC-04"},
 {id:"AR04",n:"Latency p95",m:"lat",cls:["Application","Load balancer"],kind:"static",op:">",warn:1500,crit:3000,forMin:10,on:true,own:"Platform team",rule:"SC-09"},
 {id:"AR05",n:"Error rate",m:"err",cls:["Application","Load balancer"],kind:"static",op:">",warn:2,crit:5,forMin:5,on:true,own:"Platform team",rule:"SC-09"},
 {id:"AR06",n:"Availability",m:"avail",cls:["Application","Network device","Cloud resource"],kind:"static",op:"<",warn:99.5,crit:98,forMin:3,on:true,own:"Ops team",rule:"SC-06"},
 {id:"AR07",n:"Queue depth",m:"queue",cls:["Virtual machine"],kind:"static",op:">",warn:5000,crit:15000,forMin:5,on:true,own:"Lumen (vendor)",rule:"SC-01"},
 {id:"AR08",n:"Link utilization",m:"util",cls:["Network device"],kind:"static",op:">",warn:75,crit:90,forMin:10,on:true,own:"Ops team",rule:null},
 {id:"AR09",n:"Packet loss",m:"loss",cls:["Network device"],kind:"static",op:">",warn:.5,crit:2,forMin:5,on:true,own:"Ops team",rule:null},
 {id:"AR10",n:"Memory growth (dynamic baseline)",m:"mem",cls:["Virtual machine"],kind:"baseline",sens:3,forMin:60,on:true,own:"Ops team",rule:null},
 {id:"AR11",n:"Latency anomaly (learned normal)",m:"lat",cls:["Database","Storage"],kind:"anomaly",sens:3,forMin:20,on:true,own:"Data team",rule:null},
 {id:"AR12",n:"Storage error rate",m:"err",cls:["Storage"],kind:"static",op:">",warn:1,crit:5,forMin:0,on:true,own:"Ops team",rule:null}]}
function defWins(){return [
 {id:"MW1",n:"ERP monthly patching",cis:["ci_erp0","ci_erp1","ci_erp2"],kind:"weekly",dow:3,from:120,to:240,mode:"Suppress alerts",on:true,why:"Vendor patches and reboots are planned (standard change SC-12)."},
 {id:"MW2",n:"Nightly data pipeline",cis:["ci_dat0","ci_dat1","ci_dat2"],kind:"daily",from:20,to:90,mode:"Downgrade to info",on:true,why:"The lakehouse load runs every night and is expected to be slow."}]}
O.rules=O.rules||defRules();O.wins=O.wins||defWins();
const rOf=id=>O.rules.find(r=>r.id===id);
const inCls=(r,c)=>r.cls.includes("*")||r.cls.includes(c.class);
const breach=(r,c,t,lv)=>{const v=val(c.id,r.m,t);
 if(r.kind==="static"){const th=lv==="crit"?r.crit:r.warn;return r.op==="<"?v<th:v>th}
 const base=[];for(let k=1;k<=7;k++)for(let j=-1;j<=1;j++)base.push(val(c.id,r.m,t-k*DAYMIN+j*10));const mu=avg(base),s=Math.max(sd(base),MET[r.m].base[1]*.03),z=(v-mu)/s,zt=SENS[r.sens||3]*(lv==="crit"?1.5:1);return z>zt&&v-mu>MET[r.m].max*.015};
const winHit=(c,t)=>{for(const w of O.wins){if(!w.on||!w.cis.includes(c.id))continue;const md=((t%DAYMIN)+DAYMIN)%DAYMIN;if(w.kind==="daily"&&md>=w.from&&md<=w.to)return w;if(w.kind==="weekly"&&dowOf(t)===w.dow&&md>=w.from&&md<=w.to)return w;if(w.kind==="once"&&t>=w.from&&t<=w.to)return w}return null};
/* episodes of a rule on one CI between t0 and t1; returns [{from,fired,to,peak,lvl,count,flaps,sup}] */
const EPC={};
function episodes(r,c,t0,t1,step){const k=[r.id,r.m,r.kind,r.op,r.warn,r.crit,r.sens,r.forMin,c.id,t0,t1,step,O.wins.map(w=>w.on+w.cis.join()+w.from+w.to).join("~")].join("|");const h=EPC[k];if(h)return h.map(e=>Object.assign({},e));return (EPC[k]=episodes0(r,c,t0,t1,step)).map(e=>Object.assign({},e))}
function episodes0(r,c,t0,t1,step){step=step||10;const raw=[];let cur=null;
 for(let t=t0;t<=t1;t+=step){const w=breach(r,c,t,"warn");if(w){if(!cur)cur={from:t,to:t,peak:val(c.id,r.m,t),crit:false};cur.to=t;const v=val(c.id,r.m,t);cur.peak=r.op==="<"?Math.min(cur.peak,v):Math.max(cur.peak,v);if(r.kind==="static"?breach(r,c,t,"crit"):breach(r,c,t,"crit"))cur.crit=true}else if(cur){raw.push(cur);cur=null}}
 if(cur)raw.push(cur);
 const sustained=raw.filter(e=>(e.to-e.from+step)>=Math.max(r.forMin||0,step));
 const merged=[];sustained.forEach(e=>{const l=merged[merged.length-1];if(l&&e.from-l.to<=30){l.to=e.to;l.peak=r.op==="<"?Math.min(l.peak,e.peak):Math.max(l.peak,e.peak);l.crit=l.crit||e.crit;l.flaps++;l.cnt+=e.to-e.from+step}else merged.push(Object.assign({flaps:0,cnt:e.to-e.from+step},e))});
 return merged.map(e=>({from:e.from,fired:e.from+Math.max(0,r.forMin||0),to:e.to,peak:e.peak,lvl:e.crit?"crit":"warn",count:Math.max(1,e.cnt),flaps:e.flaps,active:e.to>=t1-step,sup:winHit(c,e.from+Math.max(0,r.forMin||0))}))}
