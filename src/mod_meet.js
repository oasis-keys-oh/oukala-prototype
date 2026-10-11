/* mod_meet.js  Meetings, calendars, invitees, notes, actions and decisions: the model, the seed and the platform contracts.
   First feature built under the Feature Contract (process model, data model with integration decision, metrics and maturity, interconnectivity).
   Reuses MEETINGS (First Officer calendar), DIR (people), PROJ, NODES, the RAID log (PPMRAID) and ITSM records. UI lives in mod_meet2.js and mod_meet3.js. */
(function(){
if(window.MEETX)return;
const M=window.MEETX={};
S.meet=S.meet||{cal:"week",cur:"2026-10-06",sel:null,ap:{},colt:null};
const TODAY="2026-10-06",NOWH=13.5;
const MS=864e5,D0=Date.UTC(2026,8,30);
const isoOf=n=>new Date(D0+n*MS).toISOString().slice(0,10);
const dOf=iso=>Math.round((Date.parse(iso+"T00:00:00Z")-D0)/MS);
const addD=(iso,n)=>isoOf(dOf(iso)+n);
const dowOf=iso=>new Date(iso+"T00:00:00Z").getUTCDay();
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],DN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const fd=(iso,y)=>{if(!iso)return "";const d=new Date(iso+"T00:00:00Z");return MON[d.getUTCMonth()]+" "+d.getUTCDate()+(y?", "+d.getUTCFullYear():"")};
const fdw=iso=>DN[dowOf(iso)]+" "+fd(iso);
const tm=h=>{const hr=Math.floor(h),mi=Math.round((h-hr)*60);return (hr%12||12)+":"+String(mi).padStart(2,"0")+" "+(hr>=12?"PM":"AM")};
const R=RNG("meet-r11-seed"),pick=a=>a[Math.floor(R()*a.length)],chance=p=>R()<p;
Object.assign(M,{TODAY,NOWH,isoOf,dOf,addD,dowOf,fd,fdw,tm,MON,DN});

/* ---------- meeting types (templates) ---------- */
const TYPES={
 steer:{n:"Steering committee",k:"proj",c:"--p1",dur:1,gov:1,quorum:{min:4,roles:["Chief information officer","Portfolio lead"]},ag:[["Minutes and actions from last time",5],["Delivery status and risks",15],["Decisions needed",25],["Finance and vendor items",10],["Any other business",5]]},
 cab:{n:"Change advisory board",k:"ops",c:"--e4",dur:1,gov:1,quorum:{min:4,roles:["Change manager","Security lead"]},ag:[["Emergency changes since last meeting",10],["Changes for approval",30],["Collision and freeze check",10],["Post-implementation reviews",10]]},
 standup:{n:"Daily standup",k:"ops",c:"--s3",dur:.5,ag:[["What changed overnight",5],["Open incidents",15],["Blockers",10]]},
 retro:{n:"Retrospective",k:"proj",c:"--u3",dur:1,ag:[["What went well",15],["What did not",15],["Experiments to try",20],["Review last actions",10]]},
 design:{n:"Design review",k:"proj",c:"--p4",dur:1,ag:[["Context and goals",10],["Design walkthrough",25],["Risks and open questions",15],["Decision",10]]},
 one:{n:"One-on-one",k:"pers",c:"--u4",dur:.5,ag:[["Wins and blockers",10],["Priorities",10],["Growth and feedback",10]]},
 vendor:{n:"Vendor review",k:"vend",c:"--w3",dur:1,ag:[["Delivery against the statement of work",20],["Quality and service levels",15],["Invoices and commercial items",15],["Next steps",10]]},
 board:{n:"Board",k:"board",c:"--u1",gov:1,dur:1.5,quorum:{min:4,roles:["Chief information officer"]},ag:[["Audit readiness",25],["Technology risk and availability",25],["Vendor performance",20],["Decisions for the board",20]]},
 budget:{n:"Budget review",k:"fin",c:"--w1",dur:1,ag:[["Spend against budget",20],["Forecast changes",20],["Vendor commitments",15],["Decisions",5]]},
 gonogo:{n:"Go or no-go",k:"proj",c:"--e1",gov:1,dur:1.5,quorum:{min:4,roles:["Chief information officer","Project manager"]},ag:[["Readiness criteria",25],["Open defects and risks",25],["Operational readiness",20],["Decision",20]]}
};
M.TYPES=TYPES;

/* ---------- series and governance forums ---------- */
const SER=[
 {id:"sr_steer",n:"Standards steering group",type:"steer",chair:"Casey Rowan",secy:"Maya Ortiz",cad:"Every other Monday, 10:00 AM",s:10,e:11,room:"Teams",purpose:"Steers the Standards Platform Upgrade and the Taxonomy Data Hub: scope, dates and money.",rights:"Approves scope, date and budget changes up to $100,000. Larger changes go to the executive team.",esc:"Executive committee within 2 working days",
  mem:[["Casey Rowan","req"],["Maya Ortiz","req"],["Priya Shah","req"],["Dev Rao","req"],["Tom Becker","req"],["Avery Chen","opt"],["Chief Editor","opt"],["First Officer","info"]],
  dates:["2026-09-08","2026-09-21","2026-10-05","2026-10-19","2026-11-02"],mids:{"2026-10-05":"m1"},ex:{"2026-09-08":"Moved from Monday Sep 7 (Labor Day)"},links:[["project","PR1"],["objective","O1"]]},
 {id:"sr_cab",n:"Change advisory board",type:"cab",chair:"Nia Brooks",secy:"Sam Patel",cad:"Weekly, Wednesday 10:00 AM",s:10,e:11,room:"Teams",purpose:"Assesses and authorizes normal changes and emergency changes after the fact.",rights:"Authorizes normal changes. Emergency changes need the chair and one of Security or Operations.",esc:"CIO for any change that touches a freeze period",
  mem:[["Nia Brooks","req"],["Rina Okafor","req"],["Sam Patel","req"],["Tom Becker","req"],["Jordan Lee","opt"],["Priya Shah","opt"],["Change Risk Agent","info"],["Northwind Managed Services","info"]],
  dates:["2026-09-02","2026-09-09","2026-09-16","2026-09-24","2026-09-30","2026-10-07","2026-10-14","2026-10-21","2026-10-28"],mids:{"2026-10-07":"m6"},ex:{"2026-09-24":"Moved from Wednesday Sep 23 (Security lead travelling)","2026-10-14":"Light agenda: held as a 30 minute written review"},links:[["process","meet.schedule"]]},
 {id:"sr_ops",n:"IT operations daily",type:"standup",chair:"Tom Becker",secy:"Triage Agent",cad:"Weekdays, 9:00 AM",s:9,e:9.5,room:"Teams",purpose:"Shares what changed overnight, open incidents and blockers.",rights:"Can declare a major incident and call the incident commander.",esc:"Major incident manager",
  mem:[["Tom Becker","req"],["Sam Patel","req"],["Ravi Menon","req"],["Triage Agent","req"],["Northwind Managed Services","opt"],["Contoso Cloud Operations","info"]],
  dates:["2026-09-28","2026-09-29","2026-09-30","2026-10-01","2026-10-02","2026-10-05","2026-10-06","2026-10-07","2026-10-08","2026-10-09"],mids:{"2026-10-06":"m3"},ex:{"2026-10-09":"Cancelled: company offsite morning"},links:[["incident","INC0412"],["service","Standards Portal"]]},
 {id:"sr_retro",n:"Platform team retrospective",type:"retro",chair:"Priya Shah",secy:"Elise Park",cad:"Every other Friday, 3:00 PM",s:15,e:16,room:"Aspen room (hybrid)",purpose:"Learn from the last two weeks and agree one or two experiments.",rights:"Changes team working agreements.",esc:"Portfolio lead",
  mem:[["Priya Shah","req"],["Sam Patel","req"],["Elise Park","req"],["Ravi Menon","opt"],["Jordan Lee","opt"],["Test Agent","info"]],
  dates:["2026-09-18","2026-10-02","2026-10-16","2026-10-30"],mids:{},ex:{},links:[["project","PR1"]]},
 {id:"sr_design",n:"Taxonomy design review",type:"design",chair:"Dev Rao",secy:"Hana Koval",cad:"Every other Tuesday, 3:00 PM",s:15,e:16,room:"Aspen room (hybrid)",purpose:"Reviews the taxonomy model, interfaces and pipeline design before they are built.",rights:"Approves design changes inside the agreed scope.",esc:"Steering committee",
  mem:[["Dev Rao","req"],["Hana Koval","req"],["Marco Ellis","req"],["Jordan Lee","req"],["Lumen Search Services","opt"],["Knowledge Curator","info"]],
  dates:["2026-09-22","2026-10-06","2026-10-20","2026-11-03"],mids:{"2026-10-06":"m5"},ex:{},links:[["project","PR2"],["objective","O1"]]},
 {id:"sr_one",n:"One-on-one: Casey and Tom",type:"one",chair:"Casey Rowan",secy:"",cad:"Weekly, Wednesday 1:00 PM",s:13,e:13.5,room:"Casey's office",purpose:"Priorities, blockers and development.",rights:"None. Not a decision forum.",esc:"",
  mem:[["Casey Rowan","req"],["Tom Becker","req"]],dates:["2026-09-23","2026-09-30","2026-10-07","2026-10-14"],mids:{"2026-10-07":"m7"},ex:{},links:[]},
 {id:"sr_vendor",n:"Lumen vendor review",type:"vendor",chair:"Maya Ortiz",secy:"Priya Shah",cad:"Monthly, second Thursday",s:14,e:15,room:"Teams",purpose:"Reviews Lumen delivery against SOW-4, quality, and invoices before they are paid.",rights:"Accepts milestones and releases or holds payments up to $100,000.",esc:"Steering committee",
  mem:[["Maya Ortiz","req"],["Priya Shah","req"],["Marco Ellis","req"],["Hana Koval","opt"],["Lumen Search Services","opt"],["Avery Chen","opt"],["Contract Analyst Agent","info"]],
  dates:["2026-09-10","2026-10-08"],mids:{"2026-10-08":"m9"},ex:{},links:[["contract","V2"],["project","PR1"]]},
 {id:"sr_board",n:"Board and audit preparation",type:"board",chair:"Casey Rowan",secy:"Maya Ortiz",cad:"Monthly, second Thursday",s:9.5,e:11,room:"Boardroom",purpose:"Prepares the technology material for the board and the audit committee.",rights:"Approves what technology reports to the board.",esc:"Chief executive",
  mem:[["Casey Rowan","req"],["Maya Ortiz","req"],["Avery Chen","req"],["Tom Becker","req"],["Rina Okafor","opt"],["Chief Editor","opt"]],
  dates:["2026-09-10","2026-10-08"],mids:{"2026-10-08":"m8"},ex:{},links:[["objective","O2"]]},
 {id:"sr_budget",n:"Finance and budget review",type:"budget",chair:"Avery Chen",secy:"Maya Ortiz",cad:"Monthly, third Thursday",s:13,e:14,room:"Teams",purpose:"Spend against budget, reforecasts and vendor commitments.",rights:"Approves reforecasts that move less than $50,000 between lines.",esc:"CFO",
  mem:[["Avery Chen","req"],["Tom Becker","req"],["Maya Ortiz","req"],["Casey Rowan","opt"],["Invoice Advisor","info"]],
  dates:["2026-09-17","2026-10-15"],mids:{"2026-10-15":"m11"},ex:{},links:[["budget","B1"],["budget","B2"]]},
 {id:"sr_gate",n:"Standards Portal beta gate",type:"gonogo",chair:"Casey Rowan",secy:"Priya Shah",cad:"Gate reviews, as scheduled",s:11,e:12,room:"Teams",purpose:"Decides whether the Standards Portal beta can start on the planned date.",rights:"Go, conditional go, or no-go on the beta date.",esc:"Executive committee",
  mem:[["Casey Rowan","req"],["Priya Shah","req"],["Maya Ortiz","req"],["Sam Patel","req"],["Chief Editor","req"],["Rina Okafor","opt"],["Test Agent","info"]],
  dates:["2026-10-09","2026-10-22","2026-10-29"],mids:{"2026-10-09":"m10","2026-10-22":"m12"},ex:{},links:[["project","PR1"],["service","Standards Portal"]]}
];
M.series=SER;
const serById=id=>SER.find(s=>s.id===id)||(M.scSer||[]).find(s=>s.id===id);
M.serById=serById;

/* ---------- people helpers ---------- */
const kindOf=n=>{const r=who(n);return r?r.kind:"human"};
const tzOf=n=>{const r=who(n);const l=(r&&r.loc||"").toLowerCase();return /prague/.test(l)?"CET":/seattle/.test(l)?"PT":/phoenix/.test(l)?"AZ":/austin|chicago/.test(l)?"CT":/denver/.test(l)?"MT":"ET"};
const TZ={ET:["Eastern",-4],CT:["Central",-5],MT:["Mountain",-6],AZ:["Arizona",-7],PT:["Pacific",-7],CET:["Central Europe",2]};
const tzTime=(h,from,to)=>{let x=h+TZ[to][1]-TZ[from][1];const day=x<0?-1:x>=24?1:0;x=(x+24)%24;return {h:x,day}};
const rateOf=n=>{const r=who(n)||{};if(r.rate>0)return r.rate;if(r.kind==="ai")return 12;if(r.kind==="msp")return 150;return /Chief|Controller/.test(r.role||"")?190:/lead|manager|Architect/i.test(r.role||"")?120:95};
Object.assign(M,{kindOf,tzOf,TZ,tzTime,rateOf});

/* ---------- store ---------- */
const ACTS=[],DECS=[];
M.acts=ACTS;M.decs=DECS;
let scM=[],scA=[],scD=[];
M.scM=()=>scM;
const allM=()=>MEETINGS.concat(scM),allA=()=>ACTS.concat(scA),allD=()=>DECS.concat(scD);
Object.assign(M,{meetings:allM,allActs:allA,allDecs:allD});
const mById=id=>MEETINGS.find(m=>m.id===id)||scM.find(m=>m.id===id);
const aById=id=>ACTS.find(a=>a.id===id)||scA.find(a=>a.id===id);
const dById=id=>DECS.find(a=>a.id===id)||scD.find(a=>a.id===id);
Object.assign(M,{mById,aById,dById});
const ST_A={open:["Open","info"],prog:["In progress","info"],blocked:["Blocked","bad"],done:["Done","good"],carried:["Carried over","mute"],cancelled:["Cancelled","mute"]};
M.ST_A=ST_A;
const isOpenA=a=>a.st==="open"||a.st==="prog"||a.st==="blocked";
const isLate=a=>isOpenA(a)&&a.due<TODAY;
Object.assign(M,{isOpenA,isLate});
M.seq=0;

/* ---------- link registry (what a meeting can be about) ---------- */
const OBJS=[["O1","Modernize standards publishing"],["O2","Reduce operating risk"],["O3","Protect revenue through contract discipline"],["O4","Trusted AI"],["O5","Improve editor and reviewer experience"]];
const LK={project:["Project","--p4"],objective:["Strategy item","--p1"],incident:["Incident","--e4"],change:["Change","--p4"],problem:["Problem","--w1"],request:["Request","--s3"],contract:["Contract","--w3"],process:["Process","--u3"],service:["Service","--p5"],budget:["Budget line","--w1"]};
M.LK=LK;
function itsm(kind){try{return kind==="incident"?ITSMX.incidents:kind==="change"?ITSMX.changes:ITSMX.problems}catch(e){return []}}
function linkLabel(l){if(!l)return "";const id=l.id;try{
 if(l.k==="project"){const p=PROJ.find(x=>x.id===id)||(window.allProj&&allProj().find(x=>x.id===id));return p?p.n:id}
 if(l.k==="objective"){const o=OBJS.find(x=>x[0]===id);return o?o[1]:id}
 if(l.k==="incident"||l.k==="change"||l.k==="problem"){const r=itsm(l.k).find(x=>x.id===id);return r?r.t:id}
 if(l.k==="contract"||l.k==="budget"){const n=N(id);return n?n.n:id}
 if(l.k==="process"){const d=PROC.defs[id];return d?d.title:id}
 if(l.k==="service"){return id}
 }catch(e){}return l.label||id}
M.linkLabel=linkLabel;
function linkables(q,kinds){q=(q||"").toLowerCase();const out=[];const add=(k,id,label,sub)=>{if(kinds&&!kinds.includes(k))return;if(q&&!(id+" "+label+" "+(sub||"")).toLowerCase().includes(q))return;out.push({k,id,label,sub})};
 try{PROJ.forEach(p=>add("project",p.id,p.n,p.owner));if(SCALE.on&&window.allProj)allProj().filter(p=>p.scaled).slice(0,400).forEach(p=>add("project",p.id,p.n,p.owner))}catch(e){}
 OBJS.forEach(o=>add("objective",o[0],o[1],"Strategy item"));
 ["incident","change","problem"].forEach(k=>itsm(k).slice(0,q?3000:60).forEach(r=>add(k,r.id,r.t,r.svc||"")));
 try{(window.REQREG||[]).slice(0,q?2000:20).forEach(r=>add("request",r.id,r.t||r.n||r.title||r.id,r.svc||""))}catch(e){}
 try{NODES.filter(n=>n.t==="con"||n.t==="bud").forEach(n=>add(n.t==="con"?"contract":"budget",n.id,n.n,n.owner))}catch(e){}
 try{Object.keys(PROC.defs).slice(0,q?900:40).forEach(k=>add("process",k,PROC.defs[k].title||k,"Process"))}catch(e){}
 try{SVCREG.forEach(s=>add("service",s.n,s.n,"Tier "+s.tier))}catch(e){}
 return out.slice(0,q?40:80)}
M.linkables=linkables;
function projOf(m){const l=(m.links||[]).find(x=>x.k==="project");return l?l.id:"PR1"}
M.projOf=projOf;
function openByGlobalSearch(id){for(const fn of SEARCHX){try{const r=fn().find(x=>String(x.t).split(" ")[0]===id||String(x.t)===id);if(r){r.f();return true}}catch(e){}}return false}
M.linkGo=function(l){try{
 if(l.k==="project"&&window.ppmOpenProject){window.ppmOpenProject(l.id);return}
 if(l.k==="objective"){go("exe_strat");return}
 if(l.k==="process"){if(window.PROCLIB&&PROCLIB.open){PROCLIB.open(l.id);return}}
 if(l.k==="service"){const s=SVCREG.find(x=>x.n===l.id);if(s&&window.openService360){window.openService360(s.id);return}}
 if(l.k==="contract"||l.k==="budget"){if(N(l.id)){openDrawerRec(l.id);return}}
 if(openByGlobalSearch(l.id))return;
 const scr={incident:"itsm_inc",change:"itsm_chg",problem:"itsm_prb",request:"svc_req",project:"ppm_proj"}[l.k];if(scr)go(scr)}catch(e){toast("Could not open "+l.id,"warn")}};
function openDrawerRec(id){if(typeof recDrawer==="function")recDrawer(id)}

/* ---------- audit trail on the meeting ---------- */
function maud(m,what,detail,by){m.aud=m.aud||[];m.aud.unshift({at:"Oct 6 "+tm(NOWH),by:by||(S.persona&&PERSONAS[S.persona]?PERSONAS[S.persona].n:"Casey Rowan"),a:what,d:detail||""});if(m.aud.length>60)m.aud.length=60;audit("Meetings: "+what,(m.t||"")+(detail?" · "+detail:""))}
M.maud=maud;

/* ---------- seed: patch the existing 12 meetings and add the rest ---------- */
function mkInv(mem,extra){const inv=mem.map(x=>({n:x[0],role:x[1],rsvp:"none",att:null,dlg:"",tz:tzOf(x[0])}));(extra||[]).forEach(x=>{if(!inv.some(i=>i.n===x[0]))inv.push({n:x[0],role:x[1],rsvp:"none",att:null,dlg:"",tz:tzOf(x[0])})});return inv}
const PROJS=["PR1","PR2","PR3","PR4"];
const CHGS=["CHG0312","CHG0311","CHG0313","CHG0314","CHG0315","CHG0316","CHG0317","CHG0318"],INCS=["INC0412","INC0413","INC0408","INC0405","INC0409","INC0410"],PRBS=["PRB0010","PRB0007","PRB0008","PRB0009"];
const SHORT={PR1:"Standards Platform",PR2:"Taxonomy Hub",PR3:"Portal Resilience",PR4:"Contract Repository"};
const OBJSH={O1:"standards publishing",O2:"operating risk",O3:"contract discipline",O4:"trusted AI",O5:"editor experience"};
let mseq=12;
const EXIST_PATCH={
 m2:{type:"vendor",series:"",inv:[["Tom Becker","req"],["Avery Chen","opt"],["Northwind Managed Services","req"]],links:[["contract","V1"],["budget","B1"]]},
 m4:{type:"budget",series:"",inv:[["Tom Becker","req"],["Avery Chen","req"],["Invoice Advisor","info"]],links:[["budget","B2"]]}
};
function addMeeting(def){const m=Object.assign({id:"m"+(++mseq),agenda:[],links:[],files:[],aud:[],minutes:{st:"none"}},def);m.d=dOf(m.dt);normM(m);MEETINGS.push(m);return m}
function normM(m){m.att=m.inv.map(i=>i.n);m.k=(TYPES[m.type]||{}).k||m.k||"proj";m.tz=m.tz||"ET";m.inv.forEach(i=>{if(!i.tz)i.tz=tzOf(i.n)});m.agenda=m.agenda||[];m.links=m.links||[];m.files=m.files||[];m.aud=m.aud||[];m.minutes=m.minutes||{st:"none"};m.nt=m.nt||"";m.prop=m.prop||[]}
function fillAgenda(m,i){const T=TYPES[m.type];const mem=m.inv.filter(x=>x.role!=="info").map(x=>x.n);m.agenda=T.ag.map((a,k)=>({id:m.id+"_g"+k,t:a[0],min:a[1],own:k===0?(m.chair||mem[0]):mem[(k+i)%mem.length],note:"",st:"todo"}))}
const MTITLE={standup:"IT operations daily",cab:"Change advisory board",retro:"Platform team retrospective",design:"Taxonomy design review",steer:"Standards steering group",one:"1:1 with Tom Becker",vendor:"Lumen vendor review",board:"Board and audit preparation",budget:"Finance review",gonogo:"Standards Portal beta go or no-go"};
SER.forEach(s=>{
 s.dates.forEach((dt,idx)=>{
  const mid=s.mids[dt];let m=mid&&MEETINGS.find(x=>x.id===mid);
  if(!m){m=addMeeting({t:MTITLE[s.type],type:s.type,series:s.id,dt,s:s.s,e:s.e,room:s.room,inv:mkInv(s.mem),links:s.links.map(l=>({k:l[0],id:l[1]})),chair:s.chair,secy:s.secy,
    online:/Teams|hybrid/i.test(s.room)?"https://teams.example/meet/"+s.id.slice(3)+"-"+dt.replace(/-/g,""):"",st:(dt<TODAY||(dt===TODAY&&s.e<=NOWH))?"done":"next"});
    if(s.type==="gonogo"&&dt==="2026-10-29"){m.t="Standards Portal beta go or no-go"}
  }else{
   Object.assign(m,{type:s.type,series:s.id,dt,chair:s.chair,secy:s.secy,inv:mkInv(s.mem),links:(EXIST_PATCH[m.id]&&EXIST_PATCH[m.id].links?[]:s.links.map(l=>({k:l[0],id:l[1]}))),agenda:[],files:[],aud:[],minutes:{st:"none"},online:/Teams|hybrid|Webex/i.test(m.room)?"https://teams.example/meet/"+m.id:""});
   if(m.link&&!m.links.some(l=>l.id===m.link)){const lk=m.link;if(/^(PR\d|O\d|B\d|V\d|S1)$/.test(lk))m.links.push({k:/^PR/.test(lk)?"project":/^O/.test(lk)?"objective":/^B/.test(lk)?"budget":/^V/.test(lk)?"contract":"service",id:lk==="S1"?"Standards Portal":lk})}
   if(m.id==="m3"){m.links.push({k:"incident",id:"INC0412"})}
   normM(m)}
  m.occ=idx+1;if(s.ex[dt]){m.exc=s.ex[dt];if(/Cancelled/.test(s.ex[dt]))m.cancel=true}
  m.idx=idx;
 });
});
/* the extra one-offs patch */
["m2","m4"].forEach(id=>{const m=MEETINGS.find(x=>x.id===id),p=EXIST_PATCH[id];Object.assign(m,{type:p.type,series:p.series,dt:isoOf(m.d),chair:p.inv[0][0],secy:"",inv:mkInv(p.inv),links:p.links.map(l=>({k:l[0],id:l[1]})),agenda:[],files:[],aud:[],minutes:{st:"none"},online:/Teams|Webex/i.test(m.room)?"https://teams.example/meet/"+id:""});normM(m)});
/* keep the original order stable: sort by date and start for display, not in the array (First Officer reads the array) */

/* ---------- seed detail for every meeting ---------- */
const MEMBERS_FALLBACK=["Maya Ortiz","Priya Shah","Dev Rao","Tom Becker"];
MEETINGS.forEach((m,i)=>{
 const held=m.dt<TODAY||(m.dt===TODAY&&m.e<=NOWH);m.st=held?"done":"next";
 if(m.cancel){m.st="next"}
 const T=TYPES[m.type];fillAgenda(m,i);
 if(m.cancel){m.agenda=[]}
 /* tz: organizer eastern; some online sessions show invitees in other zones */
 m.tz="ET";
 if(held&&!m.cancel){
  m.inv.forEach(x=>{const k=kindOf(x.n);if(k==="ai"||k==="msp"){x.rsvp="yes";x.att="present";return}
   const r=R();x.rsvp=r<.82?"yes":r<.9?"maybe":"no";
   const a=R();if(x.rsvp==="no"||a>(x.role==="req"?.9:.7)){x.att=x.role==="req"&&chance(.55)?"delegate":"absent";if(x.att==="delegate"){const alt=(who(x.n)||{}).team;const d=DIR.find(p=>p.kind==="human"&&p.team===alt&&p.name!==x.n&&!m.inv.some(y=>y.n===p.name));if(d)x.dlg=d.name;else x.att="absent"}}else x.att="present"});
  m.agenda.forEach(a=>{a.st="done"});
 }else{m.inv.forEach(x=>{x.rsvp=chance(.7)?"yes":chance(.5)?"maybe":"none"});if(!held&&dOf(m.dt)-dOf(TODAY)>9)m.inv.forEach(x=>{if(chance(.4))x.rsvp="none"})}
 /* upcoming within 7 days: most have a prep brief; a few have no agenda or no brief */
 const dd=dOf(m.dt)-dOf(TODAY);
 if(!held){m.prep=(dd<=7&&dd>=0&&!(m.type==="retro"||m.id==="m13"))?{at:"Oct 6 07:30",conf:.84}:null;m.files=dd<=7&&T.gov?[{n:"Pre-read: "+(T.n)+" pack.pdf",kind:"Pre-read",size:"1.2 MB",by:m.secy||m.chair}]:[]}
});
/* make some upcoming meetings thin on purpose so the dashboard has real work */
(function(){const up=MEETINGS.filter(m=>m.dt>TODAY&&m.dt<=addD(TODAY,10)&&!m.cancel&&m.type!=="standup");let k=0;up.forEach(m=>{if(m.type==="retro"||m.type==="design"&&m.dt>"2026-10-12"){m.agenda=[];m.prep=null;k++}});
 ["m11"].forEach(id=>{const x=MEETINGS.find(m=>m.id===id);if(x){x.agenda=[];x.prep=null}});["m7","m10"].forEach(id=>{const x=MEETINGS.find(m=>m.id===id);if(x)x.prep=null});const c14=MEETINGS.find(m=>m.series==="sr_cab"&&m.dt==="2026-10-14");if(c14){c14.agenda=[];c14.prep=null}})();

/* ---------- actions and decisions ---------- */
const AT={
 steer:[["Confirm acceptance criteria for milestone 3 with Lumen","Priya Shah",4,"High"],["Bring the hosting tier cost estimate to the finance review","Tom Becker",9,"High"],["Draft the revised {p} schedule with the Nov 13 beta date","Priya Shah",7,"High"],["Brief the executive team on the {p} risk exposure","Maya Ortiz",6,"Medium"],["Request two more Lumen engineers through the change process","Maya Ortiz",10,"Medium"],["Share the reviewer testing calendar with the Chief Editor","Priya Shah",5,"Medium"],["Update the benefits case for {o}","Avery Chen",14,"Low"],["Confirm editor availability during the November close","Chief Editor",8,"Medium"],["Publish the steering decisions log to all sponsors","Maya Ortiz",2,"Low"],["Review the Lumen vendor index before the next steering meeting","Casey Rowan",12,"Medium"],["Agree the cutover window with Operations","Sam Patel",9,"High"],["Send the weekly {p} status to sponsors","Priya Shah",3,"Low"]],
 cab:[["Attach the rollback test evidence to {c}","Sam Patel",3,"High"],["Re-score the risk for {c} after the collision check","Change Risk Agent",2,"Medium"],["Confirm the maintenance window for {c} with Northwind","Nia Brooks",4,"High"],["Add the security review result to {c}","Rina Okafor",5,"High"],["Notify affected editors about the {c} window","Tom Becker",3,"Medium"],["Update the standard change catalog entry used by {c}","Nia Brooks",9,"Low"],["Schedule a post-implementation review for {c}","Sam Patel",14,"Medium"],["Confirm there is no freeze conflict for {c}","Nia Brooks",2,"High"]],
 standup:[["Update {i} with the customer impact count","Tom Becker",1,"High"],["Rehearse the failover for the Standards Portal","Sam Patel",3,"High"],["Link {i} to the open problem record","Triage Agent",2,"Medium"],["Review overnight alerts for the Taxonomy API","Ravi Menon",1,"Medium"],["Close {i} once the editors confirm the fix","Tom Becker",4,"Medium"],["Check backup success for the Contract Repository","Contoso Cloud Operations",2,"Low"]],
 retro:[["Write down the test environment hand-off steps","Elise Park",10,"Medium"],["Agree a definition of done for the search work","Priya Shah",7,"Medium"],["Try pairing on the failover rehearsal","Sam Patel",14,"Low"],["Cut the stand-up to 15 minutes","Priya Shah",5,"Low"],["Move the flaky tests to the quarantine list","Test Agent",6,"Medium"],["Document how reviewers are chosen","Jordan Lee",12,"Low"]],
 design:[["Freeze the taxonomy model after reviewer feedback","Dev Rao",7,"High"],["Share the indexer interface contract with the Data team","Marco Ellis",5,"High"],["Prototype the two new categories","Hana Koval",9,"Medium"],["Review the API versioning approach","Jordan Lee",8,"Medium"],["Estimate the pipeline test effort","Elise Park",6,"Medium"]],
 vendor:[["Send the milestone 3 acceptance checklist to Lumen","Priya Shah",3,"High"],["Ask Lumen for a recovery plan for the indexer slip","Maya Ortiz",4,"High"],["Confirm the next Lumen invoice is held until acceptance","Avery Chen",2,"High"],["Review SOW-4 obligations with the Contract Analyst Agent","Maya Ortiz",10,"Medium"],["Agree a weekly checkpoint with the Lumen delivery lead","Priya Shah",5,"Medium"],["Share Lumen engineer availability for December","Marco Ellis",7,"Medium"]],
 board:[["Prepare the Tier 1 availability chart for the audit committee","Tom Becker",6,"High"],["Summarize vendor index trends for the board pack","Maya Ortiz",6,"Medium"],["Confirm the audit evidence list with Finance","Avery Chen",8,"High"],["Draft the risk appetite statement update","Casey Rowan",14,"Medium"],["Collect the access review results","Rina Okafor",9,"High"]],
 budget:[["Reforecast hosting contingency for two extra engineers","Avery Chen",5,"High"],["Explain the $45,000 vendor services overage","Tom Becker",4,"High"],["Update the commitment report with SOW-4 changes","Avery Chen",7,"Medium"],["Validate the cloud cost forecast with Contoso","Contoso Cloud Operations",9,"Medium"],["Prepare the benefits realization update","Maya Ortiz",12,"Low"]],
 one:[["Share the on-call coverage plan for December","Tom Becker",7,"Medium"],["Draft the service desk improvement plan","Tom Becker",14,"Medium"],["Nominate two people for the incident command course","Tom Becker",10,"Low"]],
 gonogo:[["Close the open severity 1 and 2 defects","Priya Shah",6,"High"],["Confirm the rollback plan with Operations","Sam Patel",4,"High"],["Get editor sign-off on acceptance testing","Chief Editor",7,"High"]]
};
const DT={
 steer:[["Keep the Nov 13 beta date and review again on Oct 22","The slip is confined to the indexer and the cutover still fits before the freeze.",["Move beta to Dec 1","Cut scope to hold Nov 4"],true,"pending"],["Hold the next Lumen payment until milestone 3 is accepted","Paying now would overpay accepted work by about $23,000.",["Pay in full and recover later","Pay 50 percent"],true,"ratified"],["Fund two extra Lumen engineers from hosting contingency ($48,000)","Fastest way to recover the indexer slip without moving the beta.",["Use internal engineers","Accept the slip"],true,"pending"],["Run the Taxonomy pilot with 40 editors, not 80","Support capacity is limited and 40 gives enough evidence.",["Pilot with 80 editors"],true,"ratified"],["Freeze scope for {p} until beta","Late changes broke pipeline tests last cycle.",["Allow weekly change requests"],true,"ratified"]],
 cab:[["Approve {c} for the next standard window","Risk score is low and the rollback test passed.",["Defer a week","Reject"],true,"na"],["Approve {c} as an emergency change","An active incident affects 140 editors and the fix is tested.",["Wait for the standard window"],false,"na"],["Defer {c} until the freeze exception is granted","The only window falls inside the year-end freeze.",["Approve inside the freeze"],true,"na"],["Reject {c} until a rollback plan is attached","No rollback was tested.",["Approve with a manual rollback"],true,"na"]],
 vendor:[["Accept Lumen's recovery plan with weekly checkpoints","The plan adds two engineers and a named delivery lead.",["Escalate to the executive sponsor","Invoke the delay clause"],true,"pending"],["Extend SOW-4 by three weeks at no cost to the Foundation","The delay was caused by the vendor.",["Extend at a rate discount"],false,"ratified"],["Do not renew the indexer support add-on","Low use and the new build replaces it.",["Renew for six months"],true,"ratified"]],
 board:[["Report Tier 1 availability to the audit committee as a risk measure","The board asked for evidence that availability is trending to 99.9%.",["Report quarterly only"],true,"pending"],["Adopt a vendor index threshold of 0.85 for the risk appetite statement","Matches the objective for operating risk.",["Use 0.80"],true,"ratified"]],
 budget:[["Approve the reforecast moving $48,000 of contingency to engineers","Keeps the hosting line inside its approved total.",["Request new funding"],true,"pending"],["Carry the vendor services overage to Q3 with a recovery plan","The overage is timing, not scope.",["Cut other vendor lines"],true,"ratified"]],
 design:[["Adopt a single taxonomy API version for the pilot","Two versions doubled the test matrix.",["Support two versions"],true,"na"],["Use the managed search tier for the pilot","Removes two weeks of infrastructure work.",["Self-host"],true,"na"]],
 gonogo:[["Go for beta on the Nov 13 date if no severity 1 defects remain on Nov 5","Conditions are measurable and the rollback is tested.",["No-go and move to Dec 1"],true,"pending"]],
 retro:[["Adopt a 15 minute stand-up for the Platform team","Longest meeting of the sprint with the least value.",["Keep 30 minutes"],true,"na"]],
 one:[["Make Tom the incident commander on call for December","Best fit for the role and he asked.",["Rotate weekly"],true,"na"]]
};
const fill=(s,c)=>s.replace(/\{p\}/g,c.p).replace(/\{c\}/g,c.c).replace(/\{i\}/g,c.i).replace(/\{o\}/g,c.o);
const heldMs=MEETINGS.filter(m=>m.st==="done"&&!m.cancel).sort((a,b)=>a.dt<b.dt?-1:a.dt>b.dt?1:a.s-b.s);
const NOOUT=m=>m.type==="standup"&&(m.dt==="2026-09-30"||m.dt==="2026-10-01"||m.dt==="2026-10-02");
const CNT={steer:6,cab:4,standup:2,retro:5,design:4,vendor:6,board:5,budget:5,one:3,gonogo:3};
const ctxOf=(m,i)=>({p:SHORT[projOf(m)]||"project",c:CHGS[(i+(m.idx||0))%CHGS.length],i:INCS[(i*2+(m.idx||0))%INCS.length],o:OBJSH[(m.links.find(l=>l.k==="objective")||{}).id]||"operating risk"});
let aseq=0,dseq=0;
function mkAction(m,t,own,due,pri,ctx,extra){const a=Object.assign({id:"MA-"+String(++aseq).padStart(3,"0"),mid:m.id,t,own,due,st:"open",pri,link:null,raid:"",carry:0,from:"",created:m.dt,closed:"",src:"note",conf:0,acc:true},extra||{});ACTS.push(a);return a}
heldMs.forEach((m,i)=>{
 const pool=AT[m.type]||AT.one,n=NOOUT(m)?0:(CNT[m.type]||2),ctx=ctxOf(m,i);const start=(i*3)%pool.length;
 for(let k=0;k<n;k++){const t=pool[(start+k)%pool.length];
  let own=t[1];const inv=m.inv.map(x=>x.n);if(!inv.includes(own)&&!who(own))own=inv[0];
  const due=addD(m.dt,t[2]+Math.floor(R()*3)-1);
  const a=mkAction(m,fill(t[0],ctx),own,due,t[3],ctx);
  if(m.type==="cab"||/\{c\}/.test(t[0]))a.link={k:"change",id:ctx.c};else if(m.type==="standup"||/\{i\}/.test(t[0]))a.link={k:"incident",id:ctx.i};else if(chance(.35))a.link={k:"project",id:projOf(m)};
  /* status by date */
  if(due<TODAY){const r=R();a.st=r<.6?"done":r<.72?"blocked":r<.85?"prog":"open"}else{const r=R();a.st=r<.2?"done":r<.5?"prog":"open"}
  if(a.st==="done"){a.closed=addD(a.due,-Math.floor(R()*5)+(chance(.2)?3:0));if(a.closed>TODAY)a.closed=TODAY}
  a.src=chance(.55)?"ai":"note";a.conf=a.src==="ai"?+(0.78+R()*.2).toFixed(2):0;
 }
});
/* repeat offenders: carry overdue actions of weekly forums to the next occurrence a couple of times */
ACTS.filter(a=>isLate(a)&&chance(.55)).forEach(a=>{a.carry=1+(chance(.4)?1:0)});
/* a few actions created on the upcoming meetings (pre-assigned or carried) */
MEETINGS.filter(m=>m.st==="next"&&!m.cancel&&["steer","cab","vendor","board","gonogo","budget"].includes(m.type)&&m.dt<=addD(TODAY,14)).forEach((m,i)=>{const pool=AT[m.type];for(let k=0;k<2;k++){const t=pool[(i+k)%pool.length];const ctx=ctxOf(m,i+3);const a=mkAction(m,fill(t[0],ctx),t[1],addD(m.dt,t[2]),t[3],ctx,{src:"manual",created:TODAY});if(m.type==="cab")a.link={k:"change",id:ctx.c}}});
while(ACTS.length>120)ACTS.pop();
let guard=0;const padMs=heldMs.filter(m=>!NOOUT(m));guard=0;while(ACTS.length<120&&guard++<40){const m=padMs[ACTS.length%padMs.length],pool=AT[m.type]||AT.one,t=pool[ACTS.length%pool.length],ctx=ctxOf(m,ACTS.length);mkAction(m,fill(t[0],ctx),t[1],addD(m.dt,t[2]),t[3],ctx,{st:"done",closed:addD(m.dt,t[2]-1)})}
/* carried-over copies on the next occurrence of the same series */
ACTS.filter(a=>a.carry&&isLate(a)).slice(0,10).forEach(a=>{const m=mById(a.mid),nx=MEETINGS.filter(x=>x.series&&x.series===m.series&&x.dt>m.dt&&!x.cancel).sort((p,q)=>p.dt<q.dt?-1:1)[0];if(nx){a.nextMid=nx.id}});
/* decisions */
heldMs.forEach((m,i)=>{
 const pool=DT[m.type];if(!pool||DECS.length>=35)return;const ctx=ctxOf(m,i);
 const n=m.type==="cab"?2:m.type==="steer"?3:m.type==="standup"?0:1;
 for(let k=0;k<n&&DECS.length<35;k++){const t=pool[(i+k)%pool.length];
  const gov=!!TYPES[m.type].gov&&m.type!=="cab";
  let rat=t[4];if(m.dt>="2026-10-02"&&rat==="ratified")rat="pending";
  const d={id:"MD-"+String(++dseq).padStart(3,"0"),mid:m.id,t:fill(t[0],ctx),why:fill(t[1],ctx),alts:t[2].slice(),by:m.chair,dt:m.dt,eff:addD(m.dt,m.type==="cab"?1:3),rev:t[3],raid:"",rat,ratBy:"",ratAt:"",links:m.links.slice(0,2).map(l=>({k:l.k,id:l.id})),src:chance(.5)?"ai":"note",conf:0,gov};
  if(d.src==="ai")d.conf=+(0.8+R()*.18).toFixed(2);
  if(d.rat==="ratified"){d.ratBy=m.type==="board"?"Board chair":"Casey Rowan";d.ratAt=addD(m.dt,2+Math.floor(R()*7));if(d.ratAt>TODAY)d.ratAt=TODAY}
  if(m.type==="cab"){d.links=[{k:"change",id:ctx.c}]}
  DECS.push(d)}
});
guard=0;while(DECS.length<35&&guard++<30){const m=padMs[(DECS.length*2)%padMs.length],pool=DT[m.type]||DT.steer,t=pool[DECS.length%pool.length],ctx=ctxOf(m,DECS.length);DECS.push({id:"MD-"+String(++dseq).padStart(3,"0"),mid:m.id,t:fill(t[0],ctx),why:fill(t[1],ctx),alts:t[2].slice(),by:m.chair,dt:m.dt,eff:addD(m.dt,3),rev:t[3],raid:"",rat:"na",ratBy:"",ratAt:"",links:m.links.slice(0,1).map(l=>({k:l.k,id:l.id})),src:"note",conf:0,gov:false})}
/* link some to the RAID log (both ways) */
DECS.forEach((d,i)=>{if(d.gov||i%3===0)d.raid="X-M"+String(100+i)});
ACTS.filter((a,i)=>(a.pri==="High"&&i%3===0)||(i%11===0)).slice(0,26).forEach((a,i)=>{a.raid="I-M"+String(100+i)});
M.nextA=()=>"MA-"+String(++aseq).padStart(3,"0");M.nextD=()=>"MD-"+String(++dseq).padStart(3,"0");

/* notes, summary and minutes for held meetings, built from what was recorded */
const SUMLINE={steer:"Reviewed delivery and risks, recorded decisions and assigned follow-ups.",cab:"Reviewed the changes for approval and the freeze calendar.",standup:"Short sync on overnight events and open incidents.",retro:"Agreed experiments for the next two weeks.",design:"Walked through the design and settled the open questions.",vendor:"Reviewed Lumen delivery against the statement of work.",board:"Prepared the board and audit committee material.",budget:"Reviewed spend against budget and the reforecast.",one:"Priorities and development.",gonogo:"Checked readiness against the go criteria."};
function buildNotes(m){const acts=ACTS.filter(a=>a.mid===m.id),decs=DECS.filter(d=>d.mid===m.id);const lines=[];
 m.agenda.forEach((g,k)=>{lines.push("# "+g.t);lines.push((k===0?"Reviewed the actions from last time and noted two carried over.":k===1?"Discussed status and the main risks. No new surprises.":"Discussion was short and focused."));
  if(k===1)acts.slice(0,Math.ceil(acts.length/2)).forEach(a=>lines.push("@"+a.own+" to "+a.t.charAt(0).toLowerCase()+a.t.slice(1)+" by "+fd(a.due)));
  if(k===2){acts.slice(Math.ceil(acts.length/2)).forEach(a=>lines.push("@"+a.own+" to "+a.t.charAt(0).toLowerCase()+a.t.slice(1)+" by "+fd(a.due)));decs.forEach(d=>lines.push("#decision "+d.t))}});
 return lines.join("\n")}
M.buildNotes=buildNotes;
MEETINGS.forEach(m=>{if(m.st!=="done"||m.cancel){return}
 const acts=ACTS.filter(a=>a.mid===m.id),decs=DECS.filter(d=>d.mid===m.id);
 if(!["m1","m2","m3","m4"].includes(m.id))m.sum=SUMLINE[m.type]+(decs.length?" "+decs.length+" decision"+(decs.length>1?"s":"")+" recorded.":"")+(acts.length?" "+acts.length+" action"+(acts.length>1?"s":"")+" assigned.":"")
 /* leave a few meetings with no outcome and a few with unpublished notes */
 const noOut=NOOUT(m);
 if(noOut){m.sum="";m.nt=""}
 else m.nt=buildNotes(m);
 const age=dOf(TODAY)-dOf(m.dt);
 if(noOut){m.minutes={st:"none"}}
 else if(age>=5||m.type==="one"){m.minutes={st:"published",by:m.secy||m.chair,at:addD(m.dt,1),appr:m.chair,apprAt:addD(m.dt,1),dist:m.inv.filter(x=>x.role!=="info").map(x=>x.n)}}
 else if(age>=2){m.minutes={st:chance(.5)?"review":"draft",by:m.secy||m.chair,at:addD(m.dt,1)}}
 else{m.minutes={st:"none"}}
 if(m.id==="m1"){m.minutes={st:"published",by:"Maya Ortiz",at:"2026-10-06",appr:"Casey Rowan",apprAt:"2026-10-06",dist:m.inv.filter(x=>x.role!=="info").map(x=>x.n)}}
 /* pending AI proposals on the two most recent meetings */
 if(m.id==="m3"||m.id==="m4"){m.prop=[{id:m.id+"_p1",kind:"Action",txt:"Tom Becker to confirm the failover rehearsal time with Northwind",own:"Tom Becker",due:addD(m.dt,2),conf:.91,line:3},{id:m.id+"_p2",kind:"Decision",txt:"Keep the failover rehearsal at 16:00 today",own:"",due:"",conf:.74,line:5}]}
 m.aud=[{at:fd(m.dt)+" "+tm(m.s),by:m.chair||"Casey Rowan",a:"Meeting held",d:m.inv.filter(x=>x.att==="present"||x.att==="delegate").length+" attended"}];
 if(m.minutes.st==="published")m.aud.unshift({at:fd(m.minutes.at),by:m.minutes.appr||m.chair,a:"Minutes published",d:"Sent to "+(m.minutes.dist||[]).length+" people"});
});
/* a few older actions refer to the removed no-outcome meetings; fix numbering gaps is not needed, ids stay unique */
/* meetings: AI prep brief for upcoming */
M.prepBrief=function(m){const T=TYPES[m.type]||TYPES.steer;const prev=MEETINGS.filter(x=>x.series&&x.series===m.series&&x.dt<m.dt).sort((a,b)=>a.dt<b.dt?-1:1).pop();
 const open=ACTS.concat(scA).filter(a=>isOpenA(a)&&((prev&&a.mid===prev.id)||(m.series&&mById(a.mid)&&mById(a.mid).series===m.series)));const late=open.filter(isLate);
 const pend=DECS.filter(d=>d.rat==="pending"&&((mById(d.mid)||{}).series===m.series));
 const lk=(m.links||[]).filter(l=>l.k!=="process").map(l=>{const t=linkLabel(l);return t===l.id?l.id:l.id+" "+t});
 const bits=[];bits.push(open.length?open.length+" open action"+(open.length>1?"s":"")+" from earlier meetings, "+late.length+" overdue"+(late.length?" ("+late.slice(0,2).map(a=>M.kindOf(a.own)==="ai"?a.own:a.own.split(" ")[0]).filter((v,i,s)=>s.indexOf(v)===i).join(", ")+")":"")+".":"No open actions from earlier meetings.");
 if(pend.length)bits.push(pend.length+" decision"+(pend.length>1?"s":"")+" from this forum still await ratification.");
 if(lk.length)bits.push("Linked to "+lk.slice(0,3).join("; ")+".");
 const att=(m.inv||[]).filter(x=>x.role==="req"&&x.rsvp==="no");if(att.length)bits.push(att.map(x=>x.n).join(", ")+" declined: confirm a delegate.");
 return {txt:bits.join(" "),n:open.length,late:late.length,src:["Open actions","RAID log","Linked records","Previous minutes","Calendar"]}};

/* ---------- RAID log sync (both ways) ---------- */
const RS={open:"open",prog:"active",blocked:"active",done:"done",carried:"done",cancelled:"done"};
function raidFor(x,isDec){const m=mById(x.mid)||{};const p=projOf(m);
 if(isDec)return {id:x.raid,t:"X",p,n:x.t,d:x.why,pr:0,im:0,cost:0,own:x.by,s:x.rat==="ratified"||x.rat==="na"?"done":x.rat==="pending"?"active":"open",due:x.eff,mit:"Decided at "+(m.t||"")+" on "+fd(x.dt)+". "+(x.rat==="pending"?"Awaiting ratification.":x.rat==="ratified"?"Ratified by "+x.ratBy+".":""),task:"",meetingId:x.mid,decisionId:x.id};
 return {id:x.raid,t:"I",p,n:"Action: "+x.t,d:"Raised at "+(m.t||"a meeting")+" on "+fd((m.dt||x.created))+". Owner "+x.own+".",pr:0,im:0,cost:0,own:x.own,s:RS[x.st]||"open",due:x.due,mit:"",task:"",meetingId:x.mid,actionId:x.id}}
function raidSync(){const P=window.PPMRAID;if(!P)return false;
 ACTS.filter(a=>a.raid).forEach(a=>{const ex=P.find(r=>r.id===a.raid);if(ex){ex.s=RS[a.st]||ex.s;ex.due=a.due;ex.own=a.own}else P.push(raidFor(a,false))});
 DECS.filter(d=>d.raid).forEach(d=>{const ex=P.find(r=>r.id===d.raid);if(ex){ex.s=d.rat==="pending"?"active":"done";ex.mit=ex.mit}else P.push(raidFor(d,true))});
 try{if(window.ppmRaid&&ppmRaid.reset)ppmRaid.reset()}catch(e){}return true}
M.raidSync=raidSync;
M.toRaid=function(kind,id){const x=kind==="act"?aById(id):dById(id);if(!x)return null;if(!x.raid){const nums=ACTS.concat(DECS).map(y=>+(String(y.raid||"").replace(/\D/g,""))).filter(Boolean);const nx=Math.max(100,...nums)+1;x.raid=(kind==="act"?"I-M":"X-M")+nx}
 const P=window.PPMRAID;if(P&&!P.some(r=>r.id===x.raid))P.push(raidFor(x,kind!=="act"));try{if(window.ppmRaid&&ppmRaid.reset)ppmRaid.reset()}catch(e){}
 const m=mById(x.mid);if(m)maud(m,"Linked to the RAID log",x.id+" is "+x.raid);return x.raid};
M.raidGroup=function(r){const aid=r.actionId,did=r.decisionId,x=aid?aById(aid):did?dById(did):null;if(!x)return null;const m=mById(x.mid);if(!m)return null;
 return {key:"mtg",label:"Source meeting",rows:[{id:m.id,t:m.t,sub:fd(m.dt)+" · "+(aid?"Action "+aid:"Decision "+did),tag:"Meeting",st:"info",go:()=>{closeDrawer();M.open(m.id)}}]}};

/* ---------- mutations ---------- */
M.setAction=function(id,st,why){const a=aById(id);if(!a)return;const was=a.st;a.st=st;if(st==="done"){a.closed=TODAY}else a.closed="";
 const m=mById(a.mid);if(m)maud(m,"Action "+(st==="done"?"closed":"changed"),a.id+" "+ST_A[was][0]+" to "+ST_A[st][0]+(why?" · "+why:""));
 if(a.raid&&window.PPMRAID){const r=PPMRAID.find(x=>x.id===a.raid);if(r)r.s=RS[st]||r.s;try{if(window.ppmRaid&&ppmRaid.reset)ppmRaid.reset()}catch(e){}}
 M.sync();return a};
M.carryOver=function(id){const a=aById(id);if(!a)return null;const m=mById(a.mid);const nx=allM().filter(x=>m&&x.series&&x.series===m.series&&x.dt>TODAY&&!x.cancel).sort((p,q)=>p.dt<q.dt?-1:1)[0];
 if(!nx){toast("No later meeting in this series to carry to","warn");return null}
 a.st="carried";a.nextMid=nx.id;const c=Object.assign({},a,{id:M.nextA(),mid:nx.id,st:"open",carry:(a.carry||0)+1,from:a.id,created:TODAY,closed:"",raid:""});ACTS.push(c);
 maud(m,"Action carried over",a.id+" to "+nx.t+" on "+fd(nx.dt));maud(nx,"Action carried in",c.id+" from "+a.id);M.sync();return c};
M.addAction=function(m,o){const a=Object.assign({id:M.nextA(),mid:m.id,t:"",own:m.chair,due:addD(TODAY,7),st:"open",pri:"Medium",link:null,raid:"",carry:0,from:"",created:TODAY,closed:"",src:"manual",conf:0},o);ACTS.push(a);maud(m,"Action added",a.id+" for "+a.own+", due "+fd(a.due));
 if(a.link&&a.link.k==="task"){try{if(window.PPMX&&PPMX.addTasks)PPMX.addTasks(projOf(m),[{n:a.t,dur:2,own:a.own}])}catch(e){}}
 M.sync();return a};
M.addDecision=function(m,o){const d=Object.assign({id:M.nextD(),mid:m.id,t:"",why:"",alts:[],by:m.chair,dt:m.dt,eff:addD(m.dt,3),rev:true,raid:"",rat:"na",ratBy:"",ratAt:"",links:(m.links||[]).slice(0,2).map(l=>({k:l.k,id:l.id})),src:"manual",conf:0,gov:!!(TYPES[m.type]||{}).gov},o);DECS.push(d);maud(m,"Decision recorded",d.id+": "+d.t);
 if(d.gov&&d.rat==="na")d.rat="pending";M.sync();return d};
M.ratify=function(id,ok,by){const d=dById(id);if(!d)return;d.rat=ok?"ratified":"rejected";d.ratBy=by||"Casey Rowan";d.ratAt=TODAY;const m=mById(d.mid);if(m)maud(m,ok?"Decision ratified":"Decision rejected",d.id+" by "+d.ratBy);
 if(d.raid&&window.PPMRAID){const r=PPMRAID.find(x=>x.id===d.raid);if(r){r.s=ok?"done":"open";r.mit=(r.mit||"")+" "+(ok?"Ratified by ":"Rejected by ")+d.ratBy+" on "+fd(TODAY)+"."}}M.sync();return d};
M.reschedule=function(id,dt,s){const m=mById(id);if(!m)return;const old=m.dt;m.dt=dt;m.d=dOf(dt);if(s!=null){const du=m.e-m.s;m.s=s;m.e=s+du}maud(m,"Rescheduled",fd(old)+" to "+fd(dt)+(s!=null?" at "+tm(m.s):""));if(m.st==="next")m.exc=(m.exc?m.exc+"; ":"")+"Moved from "+fd(old);M.sync();return m};
M.conflicts=function(m,dt,s){const e=s+(m.e-m.s);const out=[];const mine=new Set(m.inv.filter(x=>x.role!=="info").map(x=>x.n));
 allM().forEach(o=>{if(o.id===m.id||o.dt!==dt||o.cancel)return;if(!(o.s<e&&s<o.e))return;const shared=o.inv.filter(x=>x.role!=="info"&&mine.has(x.n)).map(x=>x.n);const room=o.room&&m.room&&o.room===m.room&&!/Teams|Webex/.test(m.room);
  if(shared.length||room)out.push({m:o,people:shared,room:!!room})});return out};
M.cost=function(m,planned){const du=m.e-m.s;let c=0,h=0;(m.inv||[]).forEach(x=>{const present=planned?(x.role!=="info"||kindOf(x.n)==="ai"):(x.att==="present"||x.att==="delegate");if(!present)return;const nm=x.att==="delegate"&&x.dlg?x.dlg:x.n;c+=rateOf(nm)*du;if(kindOf(nm)!=="ai")h+=du});return {cost:Math.round(c),hours:h}};
M.quorum=function(m){const s=serById(m.series),q=(s&&s.type&&TYPES[s.type].quorum)||(TYPES[m.type]||{}).quorum;if(!q)return null;const here=m.inv.filter(x=>x.att==="present"||x.att==="delegate").map(x=>x.att==="delegate"&&x.dlg?x.dlg:x.n).filter(n=>kindOf(n)!=="ai");
 const roleOf=n=>((who(n)||{}).role||"");const miss=q.roles.filter(r=>!here.some(n=>roleOf(n).toLowerCase().includes(r.toLowerCase())));return {min:q.min,roles:q.roles,here,met:here.length>=q.min&&!miss.length,missing:miss,count:here.length}};
M.minutesText=function(m){const acts=allA().filter(a=>a.mid===m.id),decs=allD().filter(d=>d.mid===m.id);const present=m.inv.filter(x=>x.att==="present"||x.att==="delegate").map(x=>x.n+(x.att==="delegate"&&x.dlg?" (delegate: "+x.dlg+")":""));
 return ["Minutes: "+m.t,fdw(m.dt)+", "+tm(m.s)+" to "+tm(m.e)+", "+m.room,"","Present: "+(present.join(", ")||"not recorded"),"Absent: "+(m.inv.filter(x=>x.att==="absent").map(x=>x.n).join(", ")||"none"),"","Decisions",...(decs.length?decs.map(d=>"- "+d.id+" "+d.t+" (decided by "+d.by+", effective "+fd(d.eff)+", "+(d.rev?"reversible":"not reversible")+")"):["- None"]),"","Actions",...(acts.length?acts.map(a=>"- "+a.id+" "+a.own+": "+a.t+" by "+fd(a.due)):["- None"]),"",m.sum?"Summary: "+m.sum:""].join("\n")};
M.followUp=function(m){const acts=allA().filter(a=>a.mid===m.id),decs=allD().filter(d=>d.mid===m.id);const to=m.inv.filter(x=>x.role!=="info"&&kindOf(x.n)==="human").map(x=>x.n.split(" ")[0]);
 return "Subject: Follow-up: "+m.t+", "+fd(m.dt)+"\n\nHello "+(to.slice(0,4).join(", ")||"all")+",\n\nThank you for joining. "+(m.sum||"")+"\n\n"+(decs.length?"Decisions\n"+decs.map(d=>"  - "+d.t).join("\n")+"\n\n":"")+(acts.length?"Your actions\n"+acts.map(a=>"  - "+a.own+": "+a.t+" (due "+fd(a.due)+")").join("\n")+"\n\n":"")+"Full minutes: Meetings, "+m.t+", "+fd(m.dt)+".\n\nBest regards,\n"+(m.secy||m.chair||"Casey Rowan")};

/* ---------- metrics ---------- */
Object.assign(METRICS,{
 m_meet_prep:{n:"Meetings prepared",f:"Meetings in the next 7 days that have an agenda and a prep brief or pre-read ÷ meetings in the next 7 days × 100",u:"%",cur:78,tgt:90,badAt:70,dir:"max",max:100,tr:[64,66,70,72,74,75,77,78],owner:"PMO",use:["Meetings"],rem:{kind:"sop",ref:"SOP-611",title:"Prepare a meeting: agenda, owner per item, pre-read",agent:"First Officer",auto:false,state:"idle",prog:"Drafts the agenda and prep brief 48 hours ahead and asks the chair to approve"}},
 m_meet_actions_closed:{n:"Meeting actions closed on time",f:"Actions due on or before today that are done ÷ actions due on or before today (carried over counts as late) × 100",u:"%",cur:64,tgt:85,badAt:60,dir:"max",max:100,tr:[58,60,59,62,63,62,64,64],owner:"PMO",use:["Meetings","Meeting actions"],rem:{kind:"sop",ref:"SOP-612",title:"Chase late actions and escalate repeat offenders",agent:"First Officer",auto:false,state:"idle",prog:"Nudges owners two days before the due date and lists repeat offenders for the chair"}},
 m_meet_decision_latency:{n:"Decision ratification latency",f:"Average days from a governance decision to its ratification, counting pending decisions to today",u:"days",cur:6.2,tgt:5,badAt:9,dir:"min",max:14,tr:[7.8,7.4,7.1,6.9,6.6,6.5,6.3,6.2],owner:"Chief of staff",use:["Meeting decisions"],rem:{kind:"sop",ref:"SOP-613",title:"Ratify or reject a decision within the decision-rights window",agent:"First Officer",auto:false,state:"idle",prog:"Sends a ratification request to the approver and escalates after the window"}},
 m_meet_attendance:{n:"Required attendance",f:"Required invitees who attended or sent a delegate ÷ required invitees, held meetings, last 6 weeks × 100",u:"%",cur:88,tgt:90,badAt:80,dir:"max",max:100,tr:[85,86,85,87,88,88,89,88],owner:"PMO",use:["Meetings","Forums"],rem:{kind:"sop",ref:"SOP-614",title:"Fix a forum with poor attendance: time, membership, delegate rules",agent:"First Officer",auto:false,state:"idle",prog:"Proposes a new time and trims the required list when attendance stays under target"}},
 m_meet_cost:{n:"Meeting cost per month ($ thousands)",f:"Σ over held meetings (attendee hours × loaded hourly rate), last 30 days, in thousands of dollars",u:"",cur:12,tgt:15,badAt:22,dir:"min",max:30,tr:[9.8,10.4,11,11.6,12.2,12.4,12.1,12],owner:"CIO office",use:["Meetings","Forums"],rem:{kind:"sop",ref:"SOP-615",title:"Review forums that cost more than they decide",agent:"PMO Agent",auto:false,state:"idle",prog:"Ranks forums by cost per decision and suggests merging or shortening"}},
 m_meet_notes_published:{n:"Minutes published on time",f:"Held meetings with minutes published within 2 working days ÷ held meetings older than 2 working days × 100",u:"%",cur:81,tgt:90,badAt:70,dir:"max",max:100,tr:[70,72,74,76,78,79,80,81],owner:"PMO",use:["Meetings"],rem:{kind:"sop",ref:"SOP-616",title:"Publish minutes the next working day",agent:"First Officer",auto:true,state:"idle",prog:"Drafts the minutes from the notes and sends them to the chair for approval"}}
});
M.stats=function(){
 const MS=allM(),A=allA(),Dc=allD();const wk=addD(TODAY,7);const next7=MS.filter(m=>m.dt>=TODAY&&m.dt<=wk&&!m.cancel&&m.st==="next");
 const prepOk=next7.filter(m=>m.agenda.length&&(m.prep||m.files.length));
 const heldAll=MS.filter(m=>m.st==="done"&&!m.cancel);const held6=heldAll.filter(m=>m.dt>=addD(TODAY,-42));
 let req=0,got=0;held6.forEach(m=>m.inv.forEach(x=>{if(x.role==="req"&&kindOf(x.n)!=="ai"){req++;if(x.att==="present"||x.att==="delegate")got++}}));
 const due=A.filter(a=>a.due<=TODAY&&a.st!=="cancelled");const onTime=due.filter(a=>a.st==="done"&&a.closed<=a.due);
 const old=heldAll.filter(m=>dOf(TODAY)-dOf(m.dt)>=2),pub=old.filter(m=>m.minutes.st==="published");
 const lat=Dc.filter(d=>(d.rat==="ratified"||d.rat==="pending")).map(d=>(d.rat==="ratified"?dOf(d.ratAt):dOf(TODAY))-dOf(d.dt));
 const cost30=heldAll.filter(m=>m.dt>=addD(TODAY,-30)).reduce((s,m)=>s+M.cost(m).cost,0);
 return {next7:next7.length,prepOk:prepOk.length,prep:next7.length?Math.round(prepOk.length/next7.length*100):100,att:req?Math.round(got/req*100):100,
  closed:due.length?Math.round(onTime.length/due.length*100):100,due:due.length,noAgenda:MS.filter(m=>m.st==="next"&&!m.cancel&&m.dt<=addD(TODAY,14)&&!m.agenda.length),noOutcome:heldAll.filter(m=>!A.some(a=>a.mid===m.id)&&!Dc.some(d=>d.mid===m.id)),
  unpub:old.filter(m=>m.minutes.st!=="published"),pubPct:old.length?Math.round(pub.length/old.length*100):100,lat:lat.length?+(lat.reduce((a,b)=>a+b,0)/lat.length).toFixed(1):0,cost30:Math.round(cost30/100)/10,
  openA:A.filter(isOpenA),late:A.filter(isLate),awaiting:Dc.filter(d=>d.rat==="pending"),held:heldAll.length,heldAll,wkMeet:MS.filter(m=>m.dt>=TODAY&&m.dt<=wk&&!m.cancel)}};
M.sync=function(){try{const s=M.stats();METRICS.m_meet_prep.cur=s.prep;METRICS.m_meet_actions_closed.cur=s.closed;METRICS.m_meet_decision_latency.cur=s.lat;METRICS.m_meet_attendance.cur=s.att;METRICS.m_meet_cost.cur=s.cost30;METRICS.m_meet_notes_published.cur=s.pubPct;raidSync()}catch(e){}};

/* ---------- scaled data (Enterprise mode) ---------- */
function buildScale(){scM=[];scA=[];scD=[];M.scSer=[];if(!SCALE.on)return;
 const r=RNG("meet-scale"),pk=a=>a[Math.floor(r()*a.length)];let pj=[];try{pj=SCALE.projects().slice(0,40)}catch(e){}
 const people=DIR.filter(d=>d.kind==="human").map(d=>d.name);let ms=0,as=0,ds=0;
 pj.forEach((p,i)=>{const s={id:"sx"+i,n:(p.short||p.n)+" weekly status",type:i%7===0?"steer":i%5===0?"design":"standup",chair:pk(people),secy:pk(people),cad:"Weekly",s:9+(i%6),e:9.5+(i%6),room:"Teams",purpose:"Weekly status for "+p.n+".",rights:"Project team decisions.",esc:"Portfolio lead",mem:[],dates:[],links:[["project",p.id]],scaled:1};
  s.mem=[[s.chair,"req"],[s.secy,"req"],[pk(people),"req"],[pk(people),"opt"],[pk(people),"opt"]].filter((x,k,a)=>a.findIndex(y=>y[0]===x[0])===k);M.scSer.push(s);
  for(let w=-6;w<=3;w++){const dt=addD(TODAY,w*7+(i%5)-1);const held=dt<TODAY;
   const m={id:"sm"+(++ms),t:s.n,type:s.type,series:s.id,dt,d:-999,s:s.s,e:s.e,k:TYPES[s.type].k,room:"Teams",att:s.mem.map(x=>x[0]),inv:s.mem.map(x=>({n:x[0],role:x[1],rsvp:"yes",att:held?(r()<.88?"present":"absent"):null,dlg:"",tz:tzOf(x[0])})),chair:s.chair,secy:s.secy,links:[{k:"project",id:p.id}],files:[],aud:[],tz:"ET",st:held?"done":"next",agenda:r()<.85?TYPES[s.type].ag.slice(0,3).map((g,k)=>({id:"sa"+ms+"_"+k,t:g[0],min:g[1],own:s.chair,note:"",st:held?"done":"todo"})):[],minutes:{st:held?(r()<.8?"published":"draft"):"none"},nt:"",prop:[],sum:held?"Weekly status for "+(p.short||p.n)+".":"",prep:!held&&r()<.7?{at:"Oct 6 07:30",conf:.8}:null,scaled:1,idx:w+6};
   scM.push(m);
   const na=held?Math.floor(r()*4):0;for(let k=0;k<na;k++){const due=addD(dt,3+Math.floor(r()*14));const late=due<TODAY;const st=late?(r()<.55?"done":"open"):(r()<.3?"done":"open");scA.push({id:"SA-"+(++as),mid:m.id,t:pk(["Update the plan","Confirm vendor dates","Close the open defects","Share the test results","Review the budget line","Confirm access for the pilot group"])+" for "+(p.short||p.n),own:pk(s.mem)[0],due,st,pri:pk(["High","Medium","Medium","Low"]),link:null,raid:"",carry:0,from:"",created:dt,closed:st==="done"?due:"",src:"note",conf:0})}
   if(held&&r()<.25)scD.push({id:"SD-"+(++ds),mid:m.id,t:pk(["Hold scope until the next review","Approve the revised schedule","Use the shared test environment"])+" for "+(p.short||p.n),why:"Agreed by the project team.",alts:["Do nothing"],by:s.chair,dt,eff:addD(dt,2),rev:true,raid:"",rat:r()<.3?"pending":"na",ratBy:"",ratAt:"",links:[{k:"project",id:p.id}],src:"note",conf:0,gov:false});
  }});
 M.sync()}
if(window.SCALE&&SCALE.set){const _s=SCALE.set;SCALE.set=function(on){const r=_s.apply(this,arguments);try{buildScale();S.bt.meet_act&&(S.bt.meet_act.f={});}catch(e){}return r}}
M.buildScale=buildScale;

/* ---------- Person 360, search, chat ---------- */
(function(){const w=WORK.find(x=>x.kind==="Meetings this week");const fn=n=>{const out=[];allM().filter(m=>m.dt>=TODAY&&!m.cancel&&m.inv&&m.inv.some(i=>i.n===n)).sort((a,b)=>a.dt<b.dt?-1:a.dt>b.dt?1:a.s-b.s).slice(0,8).forEach(m=>{const i=m.inv.find(x=>x.n===n);out.push({id:m.id,t:m.t,sub:fdw(m.dt)+" · "+tm(m.s)+" · "+(i.role==="req"?"required":i.role==="opt"?"optional":"informational"),st:m.agenda.length?"mute":"warn",hrs:m.e-m.s,go:()=>M.open(m.id)})});return out};
 if(w){w.fn=fn;w.tag="MTG"}else WORK.push({kind:"Meetings this week",tag:"MTG",fn});
 WORK.push({kind:"Meeting actions",tag:"MACT",fn:n=>allA().filter(a=>a.own===n&&isOpenA(a)).sort((a,b)=>a.due<b.due?-1:1).slice(0,12).map(a=>({id:a.id,t:a.t,sub:(mById(a.mid)||{}).t+" · "+(isLate(a)?"overdue "+(dOf(TODAY)-dOf(a.due))+" days":"due "+fd(a.due)),due:fd(a.due),st:isLate(a)?"bad":"info",hrs:1,go:()=>{M.open(a.mid)}}))})})();
SEARCHX.push(()=>[].concat(
 allM().filter(m=>!m.scaled||(m.idx%3===0)).slice(0,260).map(m=>({g:"Meetings",t:m.t+" "+fd(m.dt),m:(TYPES[m.type]||{}).n+" · "+tm(m.s),c:(TYPES[m.type]||{c:"--p4"}).c,f:()=>M.open(m.id),k:(m.inv||[]).map(x=>x.n).join(" ")+" "+(m.sum||"")+" "+(m.links||[]).map(l=>l.id).join(" ")})),
 allA().slice(0,400).map(a=>({g:"Meeting actions",t:a.id+" "+a.t,m:a.own+" · "+(ST_A[a.st]||[a.st])[0]+" · due "+fd(a.due),c:isLate(a)?"--bad-f":"--info-f",f:()=>M.open(a.mid),k:(mById(a.mid)||{}).t})),
 allD().slice(0,300).map(d=>({g:"Meeting decisions",t:d.id+" "+d.t,m:d.by+" · "+fd(d.dt)+(d.rat==="pending"?" · awaiting ratification":""),c:"--s3",f:()=>M.open(d.mid),k:d.why+" "+(d.alts||[]).join(" ")})),
 SER.map(s=>({g:"Forums",t:s.n,m:s.cad,c:(TYPES[s.type]||{}).c,f:()=>{S.meet.ser=s.id;go("meet_series")},k:s.purpose}))));
function nameIn(q){const l=q.toLowerCase();return DIR.filter(d=>{const f=d.name.split(" ")[0].toLowerCase();return l.includes(d.name.toLowerCase())||(f.length>2&&new RegExp("\\b"+f+"\\b").test(l)&&d.kind!=="msp")})}
function nextDow(name){const i=DN.findIndex(d=>d.toLowerCase().startsWith(name.slice(0,3)));if(i<0)return null;let x=dOf(TODAY);for(let k=1;k<=7;k++){if(dowOf(isoOf(x+k))===i)return isoOf(x+k)}return null}
ASKX.push(q=>{const l=q.toLowerCase();
 let mm;if(/(schedule|set up|book|create).*(cab|change advisory|steering|standup|retro|review|meeting|board|one.on.one|1:1)/.test(l)){const ty=/cab|change advisory/.test(l)?"cab":/steering/.test(l)?"steer":/standup/.test(l)?"standup":/retro/.test(l)?"retro":/design/.test(l)?"design":/vendor/.test(l)?"vendor":/board/.test(l)?"board":/budget|finance/.test(l)?"budget":/1:1|one.on.one/.test(l)?"one":"design";
  const dw=l.match(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*/);const dt=dw?nextDow(dw[1]):/tomorrow/.test(l)?addD(TODAY,1):addD(TODAY,3);const ppl=nameIn(q).filter(d=>d.kind==="human"||d.kind==="ai").map(d=>d.name);
  if(M.compose){go("meet_hub");M.compose({type:ty,dt,people:ppl});say(q,{t:"I opened a draft "+TYPES[ty].n.toLowerCase()+" for <b>"+fdw(dt)+"</b>"+(ppl.length?" with "+ppl.map(esc).join(" and "):"")+". Check the agenda and links, then press Schedule. Nothing is sent until you do.",steps:["Parsed the type, date and people","Applied the "+TYPES[ty].n+" template","Checked the calendar for conflicts"]})}return true}
 if(/what did we decide|decisions? (about|on|for)|decided (about|on)/.test(l)){const w=l.replace(/.*(about|on|for)\s+/,"").replace(/[?.!]/g,"").trim();const ws=w.split(/\s+/).filter(x=>x.length>3);const hit=allD().filter(d=>ws.some(x=>(d.t+" "+d.why).toLowerCase().includes(x)));
  go("meet_dec");say(q,{t:hit.length?`${hit.length} decision${hit.length>1?"s":""} match. Most recent: <b>${esc(hit.sort((a,b)=>a.dt<b.dt?1:-1)[0].t)}</b> (${esc(hit[0].by)}, ${fd(hit[0].dt)}, ${hit[0].rat==="pending"?"awaiting ratification":hit[0].rat==="ratified"?"ratified":"no ratification needed"}). I opened the decisions register.`:"I found no recorded decision about that. The register is open if you want to search it.",steps:["Searched decision statements and rationale","Linked each decision to its meeting"]});return true}
 if(/overdue.*(action)|actions? .*overdue|late actions/.test(l)){const s=/steer/.test(l)?"sr_steer":/cab|change/.test(l)?"sr_cab":/vendor|lumen/.test(l)?"sr_vendor":"";const late=allA().filter(a=>isLate(a)&&(!s||(mById(a.mid)||{}).series===s));go("meet_act");say(q,{t:`${late.length} actions are overdue${s?" from "+esc(serById(s).n):""}${late.length?": oldest is <b>"+esc(late.sort((a,b)=>a.due<b.due?-1:1)[0].t)+"</b> ("+esc(late[0].own)+", due "+fd(late[0].due)+")":""}. The register is open, overdue first.`,steps:["Read meeting actions","Filtered to open and past due"]});return true}
 if(/summari[sz]e.*(last|latest).*(standup|stand-up|daily|steering|cab|retro|meeting)/.test(l)){const ty=/steer/.test(l)?"steer":/cab/.test(l)?"cab":/retro/.test(l)?"retro":/standup|stand-up|daily/.test(l)?"standup":null;const m=allM().filter(x=>x.st==="done"&&!x.cancel&&(!ty||x.type===ty)).sort((a,b)=>a.dt<b.dt?1:a.dt>b.dt?-1:b.s-a.s)[0];
  if(m){const a=allA().filter(x=>x.mid===m.id).length,d=allD().filter(x=>x.mid===m.id).length;M.open(m.id);say(q,{t:`<b>${esc(m.t)}</b>, ${fdw(m.dt)}: ${esc(m.sum||"No summary recorded yet.")} ${a} actions and ${d} decisions came out of it. Minutes are ${m.minutes.st==="published"?"published":"not published yet"}.`,steps:["Found the latest held meeting","Read its notes, actions and decisions"]})}return true}
 if(/meetings? (with)?(out)? ?(no|without|missing).*(agenda)|no agenda/.test(l)){const s=M.stats();go("meet_hub");say(q,{t:`${s.noAgenda.length} upcoming meetings in the next two weeks have no agenda${s.noAgenda.length?": "+s.noAgenda.slice(0,4).map(m=>esc(m.t)+" ("+fd(m.dt)+")").join(", "):""}. The dashboard lists them.`,steps:["Checked agendas for the next two weeks"]});return true}
 return false});

/* ---------- process model, data model, metrics and interconnectivity (Feature Contract) ---------- */
const st=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o});
const PRC={
 "meet.schedule":{name:"Schedule a meeting",module:"meet_hub",trigger:"Someone needs a conversation, a forum cycle comes due, or a decision needs a forum",steps:[st("Pick the type","The template sets length, agenda, required roles and quorum.","human","Organizer","Same day","Need","Meeting type"),st("Invite and link","Required, optional and informational invitees from the directory; link the project, strategy item or ticket.","human","Organizer","Same day","Meeting type","Invite list and links"),st("Check conflicts and time zones","Find overlaps for people and rooms and show each invitee's local time.","auto","Calendar","Seconds","Invite list","Conflict report"),st("Draft agenda and prep brief","First Officer drafts the agenda from open actions, pending decisions and linked records.","agent","First Officer","48 hours before","Links and open items","Draft agenda, prep brief"),st("Approve and send","The chair approves the agenda; invitations and pre-reads go out.","gate","Chair","24 hours before","Draft agenda","Sent invitations")]},
 "meet.run":{name:"Run a meeting and capture",module:"meet_hub",trigger:"Meeting start time",steps:[st("Open and check quorum","Attendance is recorded; governance bodies need the required roles present.","human","Chair","At start","Invite list","Attendance, quorum result"),st("Work the agenda","Timer per item; notes taken live with @mentions and #decision tags.","human","Secretary","Meeting length","Agenda","Live notes"),st("Extract actions and decisions","The agent proposes actions and decisions with confidence and lineage.","agent","First Officer","Minutes after","Live notes","Proposed items"),st("Accept or reject","A person accepts, edits or rejects every proposal.","gate","Secretary","Same day","Proposed items","Actions and decisions"),st("Sync to the RAID log and tasks","Accepted items are linked to the RAID log and project tasks.","auto","Platform","Seconds","Actions and decisions","RAID and task links")]},
 "meet.minutes":{name:"Publish minutes",module:"meet_hub",trigger:"Meeting ends",steps:[st("Draft the minutes","Built from notes, attendance, decisions and actions.","agent","First Officer","1 hour","Notes","Draft minutes"),st("Review","The secretary edits the draft.","human","Secretary","1 working day","Draft minutes","Reviewed minutes"),st("Approve","The chair approves; governance bodies keep the approval on record.","gate","Chair","2 working days","Reviewed minutes","Approved minutes"),st("Distribute","Minutes and the follow-up email go to the distribution list and attach to linked records.","auto","Platform","Seconds","Approved minutes","Published minutes")]},
 "meet.actions":{name:"Track meeting actions to closure",module:"meet_hub",trigger:"An action is accepted",steps:[st("Assign","Owner, due date, priority and link to a ticket or task.","human","Secretary","Same day","Accepted action","Owned action"),st("Nudge","Owners are reminded two days before and on the due date.","agent","First Officer","Daily","Owned action","Reminder"),st("Close or carry over","The owner closes it, or the chair carries it to the next meeting.","human","Owner","Due date","Owned action","Closed or carried action"),st("Escalate repeat offenders","Actions carried over twice go to the chair and the escalation path.","gate","Chair","Weekly","Carried actions","Escalation")]},
 "meet.decision":{name:"Record and ratify a decision",module:"meet_hub",trigger:"A decision is made in a meeting",steps:[st("Record","Statement, rationale, alternatives, decider, effective date and whether it can be reversed.","human","Secretary","Same day","Meeting notes","Decision record"),st("Link to the RAID log","A decision item is created or linked both ways.","auto","Platform","Seconds","Decision record","RAID decision item"),st("Ratify","Governance decisions need ratification by the body or person named in the charter.","gate","Ratifier","Decision-rights window","Decision record","Ratified decision"),st("Publish and apply","The decision appears on linked projects and strategy items and takes effect on its date.","auto","Platform","Effective date","Ratified decision","Applied decision")]}
};
M.PRC=PRC;
const SCRPROC={meet_hub:["meet.schedule","meet.run"],meet_act:["meet.actions"],meet_dec:["meet.decision"],meet_series:["meet.schedule","meet.minutes"]};
Object.keys(SCRPROC).forEach(k=>{const ps=SCRPROC[k];let steps=[];ps.forEach(p=>steps=steps.concat(PRC[p].steps));PROC.reg(k,{title:ps.map(p=>PRC[p].name).join(" and "),std:["itil4","cobit","pmbok"],steps:steps.map(s=>Object.assign({},s))})});

const ENTS=[
 ["meeting","Meeting",[["id","Meeting id","string","platform","internal"],["title","Title","string","platform","internal"],["type","Type","enum","platform","internal"],["series_id","Series","ref:meeting_series","platform","internal"],["start","Start","datetime","shared","internal"],["end","End","datetime","shared","internal"],["room","Room or online link","string","shared","internal"],["chair","Chair","ref:person","platform","internal"],["state","State","enum","platform","internal"],["minutes_state","Minutes state","enum","platform","confidential"],["time_zone","Time zone","string","shared","internal"]]],
 ["meeting_series","Meeting series (forum)",[["id","Series id","string","platform","internal"],["name","Name","string","platform","internal"],["purpose","Charter purpose","text","platform","internal"],["chair","Chair","ref:person","platform","internal"],["secretary","Secretary","ref:person","platform","internal"],["cadence","Cadence","string","platform","internal"],["quorum_min","Quorum minimum","number","platform","internal"],["quorum_roles","Quorum roles","string","platform","internal"],["decision_rights","Decision rights","text","platform","confidential"],["escalation","Escalation path","string","platform","internal"]]],
 ["meeting_attendee","Meeting attendee",[["meeting_id","Meeting","ref:meeting","platform","internal"],["person_id","Person","ref:person","platform","internal"],["requirement","Required, optional or informational","enum","platform","internal"],["rsvp","RSVP","enum","platform","internal"],["attendance","Attendance","enum","platform","internal"],["delegate_id","Delegate","ref:person","platform","internal"]]],
 ["agenda_item","Agenda item",[["meeting_id","Meeting","ref:meeting","platform","internal"],["title","Item","string","platform","internal"],["owner_id","Owner","ref:person","platform","internal"],["minutes_box","Time box (minutes)","number","platform","internal"],["state","State","enum","platform","internal"]]],
 ["meeting_note","Meeting note",[["meeting_id","Meeting","ref:meeting","platform","internal"],["agenda_item_id","Agenda item","ref:agenda_item","platform","internal"],["body","Note","text","platform","confidential"],["author_id","Author","ref:person","platform","internal"],["extraction_conf","AI extraction confidence","number","platform","internal"]]],
 ["meeting_action","Meeting action",[["id","Action id","string","platform","internal"],["meeting_id","Source meeting","ref:meeting","platform","internal"],["owner_id","Owner","ref:person","platform","internal"],["due","Due date","date","platform","internal"],["state","State","enum","platform","internal"],["priority","Priority","enum","platform","internal"],["carry_count","Times carried over","number","platform","internal"],["raid_item_id","RAID item","ref:raid_item","platform","internal"],["ticket_id","Linked ticket or task","string","shared","internal"]]],
 ["meeting_decision","Meeting decision",[["id","Decision id","string","platform","internal"],["meeting_id","Source meeting","ref:meeting","platform","internal"],["statement","Decision","text","platform","confidential"],["rationale","Rationale","text","platform","confidential"],["alternatives","Alternatives considered","text","platform","confidential"],["decider_id","Decider","ref:person","platform","internal"],["effective","Effective date","date","platform","internal"],["reversible","Reversible","boolean","platform","internal"],["ratification","Ratification state","enum","platform","internal"],["raid_item_id","RAID item","ref:raid_item","platform","internal"]]],
 ["meeting_link","Meeting link",[["meeting_id","Meeting","ref:meeting","platform","internal"],["kind","Kind (project, objective, incident, change, problem, request, contract, process)","enum","platform","internal"],["target_id","Target record","string","shared","internal"]]]
];
const INTEG="Reused: person (every invitee, chair, owner and delegate), project, raid_item (actions become RAID issue items and decisions become RAID decision items, linked both ways through meeting_id), objective, incident, change_request, problem_record, request_item, contract and process_definition (through meeting_link, no copies). Calendar: the First Officer MEETINGS list is extended in place, not duplicated. New: meeting_series (a charter with quorum and decision rights does not exist anywhere), meeting_attendee (RSVP, attendance and delegates are per meeting), agenda_item, meeting_note, meeting_action and meeting_decision (they carry meeting context and ratification that a task or RAID item cannot hold), and meeting_link (one polymorphic edge table instead of one column per record type). The proposed action_item and decision stubs from Forums and minutes are superseded by meeting_action and meeting_decision.";
M.INTEG=INTEG;M.ENTS=ENTS;
let wired=0;
function wire(){if(wired>=4)return;
 if(wired<1){try{ENTS.forEach(e=>{const def={id:e[0],label:e[1],domain:"gov",source:"Meetings",ownerApp:"Meetings",status:"live",note:INTEG,fields:e[2].map(f=>({k:f[0],label:f[1],type:f[2],authority:f[3],classification:f[4],req:f[0]==="id"||f[0]==="meeting_id"}))};
  let ok=false;if(window.ATLAS&&ATLAS.addEntity){try{const r=ATLAS.addEntity(def);ok=!!(r&&r.ok);M.atlas=(M.atlas||[]).concat([{id:e[0],ok:r&&r.ok,dup:(r&&r.duplicates||[]).length,warn:(r&&r.warnings||[]).slice(0,2)}])}catch(x){}}
  if(!ok&&window.DATAMODEL)DATAMODEL.register(e[0],{label:e[1],source:"Meetings",domain:"gov",fields:e[2].map(f=>({k:f[0],label:f[1],type:f[2]}))})});wired=1}catch(e){}}
 if(wired===1&&window.MODMAP&&MODMAP.addModule){try{const r=MODMAP.addModule({id:"meet_hub",name:"Meetings and decisions",sn:"Meetings",band:"plt",own:"PMO",r:["person","project","objective","incident","change_request","problem_record","raid_item"],w:["meeting","meeting_series","meeting_attendee","agenda_item","meeting_note","meeting_action","meeting_decision","meeting_link","raid_item"],proposed:false,flows:[
  {dir:"push",other:"ppm_raid",data:"Action as a RAID issue item and decision as a RAID decision item",entity:"raid_item",mode:"event",trig:"Action or decision accepted"},
  {dir:"push",other:"ppm_wbs",data:"Action as a project task",entity:"project_task",mode:"event",trig:"Action linked to a task"},
  {dir:"push",other:"exe_strat",data:"Decision shown on the linked strategy item",entity:"meeting_decision",mode:"event",trig:"Decision ratified"},
  {dir:"push",other:"ppm_proj",data:"Meetings, actions and decisions on the project page",entity:"meeting_link",mode:"event",trig:"Meeting linked"},
  {dir:"pull",other:"ppm_proj",data:"Project, manager and finish date",entity:"project",mode:"api",trig:"Link picker or prep brief"},
  {dir:"pull",other:"itsm_inc",data:"Incident title and state",entity:"incident",mode:"api",trig:"Link picker or prep brief"},
  {dir:"pull",other:"itsm_chg",data:"Change title, risk and window",entity:"change_request",mode:"api",trig:"CAB agenda"},
  {dir:"pull",other:"exe_strat",data:"Objective and key result",entity:"objective",mode:"api",trig:"Link picker"},
  {dir:"pull",other:"ppl_org",data:"Person, role, time zone and rate",entity:"person",mode:"api",trig:"Invitee picker and meeting cost"},
  {dir:"pull",other:"ppl_cap",data:"Calendar load and availability",entity:"person",mode:"api",trig:"Conflict check"}]});M.modmap=r;wired=2}catch(e){}}
 if(wired===2&&window.PROCLIB&&PROCLIB.addProcess){try{Object.keys(PRC).forEach(k=>{const p=PRC[k];const r=PROCLIB.addProcess({id:k,name:p.name,module:"meet_hub",family:"Platform and governance",owner:"Maya Ortiz",trigger:p.trigger,steps:p.steps,inputs:[p.trigger],outputs:[p.steps[p.steps.length-1].out],entities:["meeting","meeting_action","meeting_decision"],metrics:["m_meet_prep","m_meet_actions_closed","m_meet_decision_latency","m_meet_attendance","m_meet_cost","m_meet_notes_published"],model:"cmmi",target:3,std:["itil4","cobit"]});(M.proc=M.proc||{})[k]=r});wired=3}catch(e){}}
 if(wired===3){wired=4}}
function ensure(){try{wire()}catch(e){}raidSync();M.sync();if(wired<4)setTimeout(ensure,700)}
setTimeout(ensure,300);
M.wired=()=>wired;
M.addMeeting=addMeeting;M.normM=normM;M.fillAgenda=fillAgenda;
/* Round 12: fix search subtitle "Oct -4" for meetings outside October. ui.js builds the subtitle from m.d (day of October); we wrap searchIndex and use the real date. */
try{if(typeof searchIndex==="function"&&!window.__meetSearchFix){window.__meetSearchFix=1;const _si=searchIndex;searchIndex=function(){const out=_si.apply(this,arguments);let k=0;const ms=MEETINGS.slice();out.forEach(x=>{if(x.g==="Meetings"){const m=ms[k++];if(m&&m.dt)x.m=fd(m.dt)+(m.s!=null?" · "+tm(m.s):"")}});return out}}}catch(e){}
M.sync();
})();
