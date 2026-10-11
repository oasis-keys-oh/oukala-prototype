/* ============ On-call rotas, skills and availability database (module: oncall) ============
   Registers svc_oncall (On-call and escalation) and svc_skills (Skills and availability).
   Exposes: window.SKILLSDB, window.AVAIL(name,date), window.routeBy({skills,team,service,priority,language,at}), window.ONCALL */
(function(){
const E=esc;
const NOW=Date.UTC(2026,9,6,13,30); /* Tue Oct 6 2026 13:30, treated as Mountain local clock */
const DAY=864e5,HR=36e5;
const MN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],DN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],DL=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const z2=n=>String(n).padStart(2,"0");
const d0=t=>Math.floor(t/DAY)*DAY;
const isoD=t=>new Date(t).toISOString().slice(0,10);
const pdate=s=>Date.parse(String(s).slice(0,10)+"T00:00:00Z");
const monOf=t=>{const d=d0(t),w=new Date(d).getUTCDay();return d-((w+6)%7)*DAY};
const fd=t=>{const d=new Date(t);return MN[d.getUTCMonth()]+" "+d.getUTCDate()};
const fdw=t=>{const d=new Date(t);return DN[d.getUTCDay()]+" "+MN[d.getUTCMonth()]+" "+d.getUTCDate()};
const fdt=t=>{const d=new Date(t);return DN[d.getUTCDay()]+" "+MN[d.getUTCMonth()]+" "+d.getUTCDate()+", "+z2(d.getUTCHours())+":"+z2(d.getUTCMinutes())};
const fh=h=>h===24?"24:00":z2(h%24)+":00";
const mpS=(id,def)=>{if(!S.mpSel[id])S.mpSel[id]=(def||[]).slice();return S.mpSel[id].slice()};
const hw=t=>{const d=new Date(t);return ((d.getUTCDay()+6)%7)*24+d.getUTCHours()}; /* hour of week, Monday 0 */
const toMs=v=>{if(typeof v==="number")return v;if(!v)return NOW;const s=String(v);const m=/^(\d+)-(\d+)-(\d+)(?:[T ](\d+):(\d+))?/.exec(s);if(!m)return NOW;return Date.UTC(+m[1],+m[2]-1,+m[3],+(m[4]||12),+(m[5]||0))};
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const money0=n=>"$"+Math.round(n).toLocaleString("en-US");
S.oc=S.oc||{rota:"all",tier:"Primary",wk:0,day:1,map:"hourly",sel:"R2",plan:{rota:"R4",tier:"Tier 1",resp:15,vol:24,handle:45,util:60,skills:[],sup:"",ai:true},ver:0,ov:[],swaps:[],notes:[],rules:null,esc:null,sim:{svc:"svc_search",prio:"P2",skills:["search"],lang:"",dow:1,hour:14,team:""},assigned:[],rotas:null,applied:[]};
S.skl=S.skl||{added:[],ov:{},custom:[],ptoSt:{},learn:[],avN:24,certF:"all",v:0,cat:"All",q:{skills:["azure"],min:3,now:true,team:"All"},wkoff:0,pto:[],hrs:{}};
const OC=S.oc,SK=S.skl;

/* ---------------- holidays and locations ---------------- */
window.HOLIDAYS=window.HOLIDAYS||[{d:"2026-10-12",n:"Indigenous Peoples' Day"},{d:"2026-11-11",n:"Veterans Day"},{d:"2026-11-26",n:"Thanksgiving"},{d:"2026-11-27",n:"Day after Thanksgiving"},{d:"2026-12-24",n:"Christmas Eve"},{d:"2026-12-25",n:"Christmas Day"},{d:"2027-01-01",n:"New Year's Day"}];
const holOf=t=>window.HOLIDAYS.find(h=>h.d===isoD(t));
/* offsets in hours from Mountain time (the platform clock) */
const TZ=[[/washington|norwalk|new york|boston|atlanta|\bct\b$/i,2,"Eastern"],[/chicago|austin|dallas|houston/i,1,"Central"],[/phoenix/i,-1,"Arizona"],[/seattle|portland|san francisco|los angeles/i,-1,"Pacific"],[/prague|berlin|paris|madrid|europe/i,8,"Central European"],[/denver|parker|boulder/i,0,"Mountain"]];
const tzOf=r=>{const l=(r&&r.loc)||"";for(const t of TZ)if(t[0].test(l))return {off:t[1],n:t[2]};return {off:0,n:"Mountain"}};
const MSPH={"Northwind Managed Services":{from:5,to:17,days:[1,2,3,4,5],tz:"Eastern",note:"Tier 1 desk 7am to 7pm Eastern"},"Contoso Cloud Operations":{from:0,to:24,days:[0,1,2,3,4,5,6],tz:"Pacific",note:"Monitoring 24x7"},"Lumen Search Services":{from:0,to:24,days:[1,2,3,4,5],tz:"Central",note:"Tier 2 search support, 24x5"}};
function hoursOf(r){if(!r)return{from:8,to:17,days:[1,2,3,4,5],tz:"Mountain"};const o=SK.hrs[r.name];if(o)return o;
 if(r.kind==="ai")return{from:0,to:24,days:[0,1,2,3,4,5,6],tz:"Always on"};
 if(r.kind==="msp")return MSPH[r.name]||{from:0,to:24,days:[1,2,3,4,5],tz:tzOf(r).n,note:"24x5"};
 const z=tzOf(r);const a=(r.kind==="contractor"?9:8)-z.off,b=(r.kind==="contractor"?18:17)-z.off;return{from:((a%24)+24)%24,to:b>24?b-24:b<=0?b+24:b,days:[1,2,3,4,5],tz:z.n}}
const inHours=(w,h,dow)=>{const d=w.days.includes(dow);if(w.from===0&&w.to===24)return d;if(w.from<w.to)return d&&h>=w.from&&h<w.to;return (d&&h>=w.from)||(w.days.includes((dow+6)%7)&&h<w.to)};

/* ---------------- time off ---------------- */
const PTO0=[["Sam Patel","2026-10-12","2026-10-16","Vacation","approved","Family trip"],["Tom Becker","2026-10-07","2026-10-07","Appointment","approved","Dentist"],["Priya Shah","2026-10-14","2026-10-14","Sick day","approved",""],["Nia Brooks","2026-10-19","2026-10-23","Vacation","approved","Booked in July"],["Jordan Lee","2026-10-26","2026-10-30","Vacation","pending","Wedding abroad"],["Dev Rao","2026-11-02","2026-11-06","Vacation","pending",""],["Hana Koval","2026-10-09","2026-10-09","Public holiday (Czechia)","approved",""],["Ravi Menon","2026-10-20","2026-10-21","Vacation","approved",""],["Maya Ortiz","2026-11-23","2026-11-27","Vacation","approved","Thanksgiving week"],["Rina Okafor","2026-10-12","2026-10-13","Conference","approved","Security summit"],["Marco Ellis","2026-10-28","2026-10-30","Vacation","approved",""],["Chief Editor","2026-10-22","2026-10-23","Vacation","approved",""]];
let ptoGen=null,ptoGenN=-1;
function allPto(){const out=PTO0.map((p,i)=>({id:"PTO"+(i+1),who:p[0],from:p[1],to:p[2],type:p[3],st:p[4],note:p[5]})).concat(SK.pto);
 try{const pp=S.ppl;if(pp&&pp.leave&&pp.people)pp.leave.forEach(l=>{const pe=pp.people.find(x=>x.id===l.who),nm=pe&&(pe.n||pe.name);if(nm&&who(nm)&&!out.some(o=>o.who===nm&&o.from===l.from))out.push({id:"PPL"+l.id,who:nm,from:l.from,to:l.to,type:l.type||"Leave",st:l.st==="approved"?"approved":"pending",note:l.note||""})})}catch(e){}
 out.forEach(p=>{const o=SK.ptoSt[p.id];if(o)p.st=o});
 if(ptoGenN!==DIR.length){ptoGen=[];DIR.filter(d=>d.generated&&d.kind!=="ai").forEach(d=>{const r=RNG(d.name+"pto");if(r()<.14){const a=pdate("2026-10-07")+Math.floor(r()*28)*DAY,n=1+Math.floor(r()*4);ptoGen.push({id:"PG"+ptoGen.length,who:d.name,from:isoD(a),to:isoD(a+n*DAY),type:"Vacation",st:r()<.8?"approved":"pending",note:""})}});ptoGenN=DIR.length}
 const gen=ptoGen.map(p=>SK.ptoSt[p.id]?Object.assign({},p,{st:SK.ptoSt[p.id]}):p);return out.concat(gen)}
const ptoIdx={k:"",m:{}};
function ptoHit(name,t){const all=allPto();const k=all.length+":"+DIR.length;if(ptoIdx.k!==k){ptoIdx.k=k;ptoIdx.m={};all.forEach(p=>(ptoIdx.m[p.who]=ptoIdx.m[p.who]||[]).push(p))}const d=d0(t);return (ptoIdx.m[name]||[]).find(p=>p.st!=="denied"&&pdate(p.from)<=d&&pdate(p.to)>=d)||null}
function AVAIL(name,date){const r=who(name);if(!r)return{status:"unknown",ok:false,reason:"Not in the directory",hours:""};const dateOnly=typeof date==="string"&&!/[T ]\d/.test(date);const t=toMs(date==null?NOW:date);const w=hoursOf(r);const dow=new Date(t).getUTCDay(),h=new Date(t).getUTCHours();
 const base={tz:w.tz,hours:w.from===0&&w.to===24?(w.days.length===7?"24x7":"24x5"):fh(w.from)+" to "+fh(w.to)+" MT",kind:r.kind};
 const p=ptoHit(name,t);if(p)return Object.assign(base,{status:"pto",ok:false,reason:p.type+(p.st==="pending"?" (pending approval)":""),pto:p});
 if(r.kind==="human"){const hol=holOf(t);if(hol)return Object.assign(base,{status:"holiday",ok:false,reason:hol.n})}
 if(!w.days.includes(dow)&&!(w.from>=w.to&&inHours(w,h,dow)))return Object.assign(base,{status:"off",ok:false,reason:"Not a working day ("+DN[dow]+")"});
 if(!dateOnly&&!inHours(w,h,dow))return Object.assign(base,{status:"off",ok:false,reason:"Outside working hours ("+base.hours+")"});
 return Object.assign(base,{status:"available",ok:true,reason:dateOnly?"Working that day":"Working now, until "+fh(w.to)})}
window.AVAIL=AVAIL;

/* ---------------- skills taxonomy ---------------- */
const LEVELS=[{n:1,l:"Aware",d:"Knows the vocabulary; needs close guidance"},{n:2,l:"Working",d:"Does routine tasks with occasional help"},{n:3,l:"Proficient",d:"Works alone and handles most cases; can be on call"},{n:4,l:"Expert",d:"Handles hard cases and coaches others"},{n:5,l:"Authority",d:"Sets the standard; final escalation"}];
const CATS=["Cloud and infrastructure","Service management","Security and identity","Data and search","Applications","End-user support","Delivery and governance","Finance and editorial","Languages","Other"];
const SK0=[["azure","Azure","Cloud and infrastructure"],["k8s","Kubernetes","Cloud and infrastructure"],["tf","Terraform","Cloud and infrastructure"],["net","Networking and VPN","Cloud and infrastructure"],["bkp","Backup and restore","Cloud and infrastructure"],["obs","Observability","Cloud and infrastructure"],["azops","Azure operations","Cloud and infrastructure"],["oncall","On-call practice","Cloud and infrastructure"],
["inc","Incident management","Service management"],["mi","Major incident command","Service management"],["itil","ITIL 4","Service management",1],["chg","Change and release","Service management"],["prb","Problem analysis","Service management"],["snow","ServiceNow","Service management"],["cab","CAB facilitation","Service management"],["kcs","Knowledge management (KCS)","Service management"],["triage","Triage and routing","Service management"],
["entra","Entra ID","Security and identity"],["def","Defender","Security and identity"],["nist","NIST CSF","Security and identity"],["accrev","Access reviews","Security and identity"],["cissp","CISSP","Security and identity",1],
["search","Search indexing","Data and search"],["es","Elasticsearch","Data and search"],["de","Data engineering","Data and search"],["sql","SQL","Data and search"],["tax","Taxonomy","Data and search"],["py","Python","Data and search"],["adf","Azure Data Factory","Data and search"],["rel","Relevance tuning","Data and search"],
["cod","Standards platform","Applications"],["lease","Lease subledger (ERP)","Applications"],["crepo","Contract Repository","Applications"],["integ","Integration and APIs","Applications"],["java","Java","Applications"],["qa","Test automation","Applications"],["ea","Enterprise architecture","Applications"],["togaf","TOGAF","Applications",1],
["t1","Tier 1 service desk","End-user support"],["intune","Intune and endpoint","End-user support"],["m365","Microsoft 365 and Teams","End-user support"],["av","AV support","End-user support"],["patch","Patching","End-user support"],
["pmp","PMP","Delivery and governance",1],["agile","Agile delivery","Delivery and governance"],["vendor","Vendor management","Delivery and governance"],["stake","Stakeholder management","Delivery and governance"],["risk","Risk assessment","Delivery and governance"],["port","Portfolio management","Delivery and governance"],["relp","Release planning","Delivery and governance"],
["acct","Accounting and ASC 842","Finance and editorial"],["inv","Invoice approval","Finance and editorial"],["budget","Budgeting","Finance and editorial"],["edit","Editorial review","Finance and editorial"],["stdw","Standards writing","Finance and editorial"],["uat","Acceptance testing","Finance and editorial"],
["en","English","Languages"],["es_","Spanish","Languages"],["fr","French","Languages"],["cs","Czech","Languages"],["de_","German","Languages"]];
const SKILLS=SK0.map(s=>({id:s[0],n:s[1],cat:s[2],cert:!!s[3]}));
const ALIAS={"azure":"azure","kubernetes":"k8s","terraform":"tf","on-call":"oncall","observability":"obs","monitoring":"obs","azure operations":"azops","backup and restore":"bkp","itil 4":"itil","itil 4 change":"chg","incident management":"inc","major incident command":"mi","servicenow":"snow","cab facilitation":"cab","risk assessment":"risk","risk":"risk","release coordination":"chg","entra id":"entra","defender":"def","nist csf":"nist","access reviews":"accrev","cissp":"cissp","search indexing":"search","indexing":"search","search operations":"search","elasticsearch":"es","java":"java","relevance tuning":"rel","relevance":"rel","taxonomy":"tax","python":"py","data engineering":"de","azure data factory":"adf","integration":"integ","enterprise architecture":"ea","togaf":"togaf","pmp":"pmp","agile delivery":"agile","vendor management":"vendor","stakeholder management":"stake","portfolio management":"port","portfolio":"port","release planning":"relp","tier 1 service desk":"t1","endpoint management":"intune","intune":"intune","patching":"patch","test automation":"qa","playwright":"qa","api testing":"qa","accounting":"acct","asc 842":"acct","invoice approval":"inv","budgeting":"budget","editorial review":"edit","standards writing":"stdw","standards":"cod","acceptance testing":"uat","incident classification":"triage","routing":"triage","similar incidents":"triage","articles":"kcs","knowledge":"kcs"};
const TEAMDOM={"Service desk":["inc","t1","m365","itil","kcs","snow","triage"],"Ops team":["azure","k8s","obs","net","oncall","bkp","tf"],"Platform team":["azure","cod","integ","qa","oncall","k8s"],"Data team":["de","sql","search","py","adf","tax"],"Architecture":["ea","integ","azure","togaf"],"Security":["entra","def","nist","accrev","inc"],"Change management":["chg","cab","risk","itil","relp"],"PMO":["port","agile","vendor","stake","pmp"],"Finance":["acct","inv","budget","lease"],"Editors":["edit","stdw","uat","cod"],"Lumen (vendor)":["search","es","rel","tax"]};
const EXTRA={"Tom Becker":[["inc",5],["mi",5],["itil",5],["snow",4],["t1",4],["m365",3],["kcs",3],["en",5]],"Nia Brooks":[["chg",5],["cab",5],["inc",3],["es_",3],["en",5]],"Sam Patel":[["azure",5],["k8s",4],["obs",4],["net",4],["entra",3],["oncall",5],["inc",4],["bkp",3],["en",5]],"Jordan Lee":[["azure",4],["integ",5],["inc",3],["sql",4],["oncall",4],["lease",3],["cod",3],["en",5]],"Dev Rao":[["search",4],["de",5],["sql",5],["adf",4],["oncall",3],["inc",3],["crepo",3],["en",5]],"Priya Shah":[["cod",4],["inc",3],["relp",5],["es_",3],["m365",3],["oncall",3],["en",5]],"Maya Ortiz":[["search",3],["vendor",5],["inc",3],["mi",3],["crepo",4],["en",5],["fr",3]],"Rina Okafor":[["entra",5],["def",4],["nist",5],["accrev",5],["inc",4],["oncall",4],["en",5]],"Ravi Menon":[["azure",4],["obs",5],["k8s",3],["net",3],["oncall",4],["inc",3],["en",4]],"Hana Koval":[["search",4],["tax",5],["py",4],["oncall",3],["inc",3],["cs",5],["de_",3],["en",4]],"Marco Ellis":[["search",5],["es",5],["rel",4],["java",4],["oncall",4],["inc",4],["en",5]],"Avery Chen":[["acct",5],["inv",5],["lease",4],["budget",4],["en",5]],"Chief Editor":[["edit",5],["stdw",5],["cod",4],["uat",5],["en",5]],"Elise Park":[["qa",5],["en",4]],"Northwind Managed Services":[["t1",5],["intune",5],["m365",4],["patch",4],["inc",4],["triage",3],["en",5],["es_",3]],"Contoso Cloud Operations":[["azops",5],["bkp",4],["obs",4],["azure",4],["inc",3],["en",5]],"Lumen Search Services":[["search",5],["es",4],["rel",4],["inc",3],["en",5]],"Triage Agent":[["triage",5],["inc",4],["kcs",3],["en",5],["es_",4],["fr",4]],"Test Agent":[["qa",4]],"Change Risk Agent":[["chg",4],["risk",4],["cab",3]]};
const skillById=id=>SKILLS.find(s=>s.id===id)||SK.custom.find(s=>s.id===id);
function allSkills(){return SKILLS.concat(SK.custom)}
function resolveSkill(v){if(v&&typeof v==="object")v=v.id||v.n;if(!v)return null;const s=allSkills().find(x=>x.id===v||x.n.toLowerCase()===String(v).toLowerCase());return s?s.id:ALIAS[String(v).toLowerCase()]||null}
function ensureSkill(txt){let id=resolveSkill(txt);if(id)return id;id="x_"+String(txt).toLowerCase().replace(/[^a-z0-9]+/g,"_").slice(0,24);if(!skillById(id))SK.custom.push({id,n:String(txt),cat:"Other",cert:false,auto:true});return id}
const CERT_NAMES={itil:"ITIL 4 Foundation",cissp:"CISSP",togaf:"TOGAF 9 Certified",pmp:"Project Management Professional"};
let rowsC=null,rowsSig="",byP=null,byS=null;
function buildRows(){const rows=[];const keep=new Set();
 const add=(p,sid,lvl,r,src)=>{const k=p+"|"+sid;if(keep.has(k)){const x=rows.find(y=>y.person===p&&y.skill===sid);if(x&&lvl>x.level)x.level=lvl;return}keep.add(k);const sk=skillById(sid);const cert=sk&&sk.cert;let st=cert?"certified":(r()<.62?"verified":"self-declared"),exp=null,on=isoD(pdate("2026-01-05")+Math.floor(r()*270)*DAY),by="";
  if(cert){const x=r();exp=isoD(NOW+(x<.12?-Math.floor(r()*60)-3:x<.38?Math.floor(r()*85)+2:Math.floor(r()*500)+120)*DAY);if(pdate(exp)<d0(NOW))st="expired"}
  if(st==="verified"||st==="certified")by=pick(r,["Tom Becker","Sam Patel","Maya Ortiz","Rina Okafor","Jordan Lee"]);
  rows.push({id:"SK"+rows.length,person:p,skill:sid,level:lvl,st,by,on,exp,ev:cert?CERT_NAMES[sid]||sk.n+" certificate":st==="verified"?pick(r,["Practical assessment","Peer review","Incident review","Pairing session"]):"",src})};
 DIR.forEach(d=>{const r=RNG(d.name+"skl");const base=d.kind==="ai"?4:d.kind==="msp"?4:d.kind==="contractor"?3.4:Math.min(4.2,2+(d.tenure||3)/4);const lv=()=>Math.max(1,Math.min(5,Math.round(base+(r()*2-1)*1.1)));
  (EXTRA[d.name]||[]).forEach(x=>add(d.name,x[0],x[1],r,"seed"));
  (d.skills||[]).forEach(s=>add(d.name,ensureSkill(s),Math.max(2,lv()),r,"directory"));
  if(d.generated){const dom=TEAMDOM[d.team]||["inc","azure"];const n=2+Math.floor(r()*3);for(let i=0;i<n;i++)add(d.name,pick(r,dom),Math.max(1,lv()),r,"team");add(d.name,"en",4+(r()<.4?1:0),r,"seed");if(r()<.15)add(d.name,pick(r,["es_","fr","de_"]),2+Math.floor(r()*3),r,"seed");if(r()<.3)add(d.name,"oncall",3,r,"team")}});
 try{(window.SKILLS||[]).forEach(x=>{if(x&&x.person&&x.skill&&who(x.person)){const sid=ensureSkill(x.skill);if(!rows.some(y=>y.person===x.person&&y.skill===sid))rows.push({id:"SK"+rows.length,person:x.person,skill:sid,level:+x.level||2,st:x.verified?"verified":"self-declared",by:"",on:"2026-09-01",exp:null,ev:"",src:"PPM"})}})}catch(e){}
 SK.added.forEach(a=>{const x=rows.find(y=>y.person===a.person&&y.skill===a.skill);if(x)Object.assign(x,a);else rows.push(Object.assign({id:"SK"+rows.length,by:"",on:isoD(NOW),exp:null,ev:"",src:"form"},a))});
 rows.forEach(x=>{const o=SK.ov[x.person+"|"+x.skill];if(o)Object.assign(x,o)});
 return rows}
function syncSk(){const sig=DIR.length+":"+SK.v+":"+SK.custom.length;if(rowsC&&sig===rowsSig)return;rowsSig=sig;rowsC=buildRows();byP=new Map();byS=new Map();rowsC.forEach(x=>{(byP.get(x.person)||byP.set(x.person,[]).get(x.person)).push(x);(byS.get(x.skill)||byS.set(x.skill,[]).get(x.skill)).push(x)})}
const levelOf=(p,s)=>{syncSk();const x=(byP.get(p)||[]).find(y=>y.skill===s);return x&&x.st!=="expired"?x.level:x?Math.max(1,x.level-2):0};
const SKILLSDB=window.SKILLSDB={cats:CATS,levels:LEVELS,get skills(){return allSkills()},get rows(){syncSk();return rowsC},of(p){syncSk();return byP.get(p)||[]},holders(s){syncSk();return byS.get(resolveSkill(s)||s)||[]},level:(p,s)=>levelOf(p,resolveSkill(s)||s),id:resolveSkill,skill:skillById,
 qualified(s,min,o){o=o||{};const id=resolveSkill(s)||s;return this.holders(id).filter(x=>x.level>=(min||3)&&x.st!=="expired"&&(!o.now||AVAIL(x.person,NOW).ok)&&(!o.kind||who(x.person).kind===o.kind))},
 add(p,s,level,st){const sid=ensureSkill(s);const i=SK.added.findIndex(a=>a.person===p&&a.skill===sid);const rec={person:p,skill:sid,level:+level||2,st:st||"self-declared"};if(i>=0)SK.added[i]=rec;else SK.added.push(rec);SK.v++;return rec},
 verify(p,s,by,how){const sid=resolveSkill(s)||s;SK.ov[p+"|"+sid]={st:"verified",by,ev:how||"Practical assessment",on:isoD(NOW)};SK.v++}};
