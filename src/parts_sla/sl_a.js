/* ============ Agreements: SLAs, OLAs, underpinning contracts and XLAs (module: sla) ============
   Registers svc_sla. The engine replays record state history through start, pause, resume, stop, reset and cancel
   conditions built from real DATAMODEL fields, on a schedule (calendar, time zone, holidays). */
(function(){
const E=esc;
const NOW=Date.UTC(2026,9,6,13,30); /* Tue Oct 6 2026 13:30, treated as Mountain local clock */
const DAY=864e5,HR=36e5;
const MN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],DN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const z2=n=>String(n).padStart(2,"0");
const d0=t=>Math.floor(t/DAY)*DAY;
const isoD=t=>new Date(t).toISOString().slice(0,10);
const pdate=s=>Date.parse(String(s).slice(0,10)+"T00:00:00Z");
const fd=t=>{const d=new Date(t);return MN[d.getUTCMonth()]+" "+d.getUTCDate()};
const fdt=t=>{const d=new Date(t);return DN[d.getUTCDay()]+" "+MN[d.getUTCMonth()]+" "+d.getUTCDate()+", "+z2(d.getUTCHours())+":"+z2(d.getUTCMinutes())};
const mpS=(id,def)=>{if(!S.mpSel[id])S.mpSel[id]=(def||[]).slice();return S.mpSel[id].slice()};
const r1=n=>Math.round(n*10)/10;
const hrsStr=h=>{if(h==null||isNaN(h))return "n/a";if(h<1)return Math.max(1,Math.round(h*60))+" min";if(h<48)return r1(h)+" h";return r1(h/24)+" days"};
const pct1=n=>(Math.round(n*10)/10)+"%";
const pickR=(r,a)=>a[Math.floor(r()*a.length)];
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
S.sla=S.sla||{sel:null,dr:null,tab:0,v:0,stepT:{},tags:{},credits:{},claims:[],typeF:"All",cov:{by:"process",tierF:"All"},need:null,sim:{ag:"SLA-INC-P2",day:3,hour:15,pAt:2,pLen:3},rec:{},custom:[],edits:{},scaleN:0,desk:{}};
const SL=S.sla;

/* ---------------- schedules, time zones, holidays ---------------- */
const TZS={Mountain:0,Central:1,Eastern:2,Pacific:-1,UTC:6,"Central European":8};
const SCH=[
 {id:"24x7",n:"24x7, every day",days:[0,1,2,3,4,5,6],a:0,b:24},
 {id:"biz",n:"Business hours, Monday to Friday 8:00 to 17:00",days:[1,2,3,4,5],a:8,b:17},
 {id:"ext",n:"Extended hours, Monday to Friday 6:00 to 20:00",days:[1,2,3,4,5],a:6,b:20},
 {id:"24x5",n:"24x5, Monday to Friday around the clock",days:[1,2,3,4,5],a:0,b:24},
 {id:"wkd",n:"7:00 to 19:00, every day",days:[0,1,2,3,4,5,6],a:7,b:19}];
const HOLSETS={none:"No holidays (every day counts)",us:"Meridian holidays (U.S. federal)"};
const holDays=k=>k==="us"?(window.HOLIDAYS||[]).map(h=>pdate(h.d)):[];
const calOf=sc=>{sc=sc||{};const c=SCH.find(x=>x.id===sc.cal)||SCH[1];return {c,off:TZS[sc.tz]||0,hs:new Set(holDays(sc.hol||"us")),sc}};
/* all working windows (Mountain clock) that overlap [s,e] */
function wins(cal,s,e){const out=[];const zs=s+cal.off*HR,ze=e+cal.off*HR;for(let d=d0(zs),n=0;d<=ze&&n<900;d+=DAY,n++){const dw=new Date(d).getUTCDay();if(!cal.c.days.includes(dw)||cal.hs.has(d))continue;const a=Math.max(d+cal.c.a*HR,zs),b=Math.min(d+cal.c.b*HR,ze);if(b>a)out.push([a-cal.off*HR,b-cal.off*HR])}return out}
function workBetween(s,e,cal){if(e<=s)return 0;if(cal.c.id==="24x7"&&!cal.hs.size)return(e-s)/HR;let t=0;wins(cal,s,e).forEach(w=>t+=w[1]-w[0]);return t/HR}
function addWork(s,hours,cal){let left=hours*HR,z=s+cal.off*HR;for(let d=d0(z),n=0;n<1500;d+=DAY,n++){const dw=new Date(d).getUTCDay();if(!cal.c.days.includes(dw)||cal.hs.has(d))continue;const a=Math.max(d+cal.c.a*HR,z),b=d+cal.c.b*HR;if(b<=a)continue;if(left<=b-a)return a+left-cal.off*HR;left-=b-a}return s+hours*HR*3}
const isOpen=(t,cal)=>wins(cal,t,t+1).length>0;
const hoursPerDay=cal=>cal.c.b-cal.c.a;

/* ---------------- platform fields (DATAMODEL) ---------------- */
const F=(k,label,type,o)=>Object.assign({k,label,type:type||"string"},o||{});
const TEAMN=["Service desk","Network team","Identity team","Endpoint team","Data team","Platform team","Security team"];
const CUST=["Gold","Silver","Bronze"];
DATAMODEL.register("incident",{label:"Incident",source:"ITSM",fields:[F("reassignment_count","Reassignment count","number"),F("reopen_count","Reopen count","number"),F("customer_tier","Customer tier","enum",{opts:CUST}),F("contact_type","Contact type","enum",{opts:["Portal","Email","Phone","Chat","Monitoring"]}),F("made_sla","Made SLA","boolean"),F("first_response_at","First response at","datetime")]});
DATAMODEL.register("request_item",{label:"Request item",source:"Service catalog",fields:[F("priority","Priority","enum",{opts:["P2","P3","P4"]}),F("service","Service","ref"),F("assignment_group","Assignment group","ref"),F("customer_tier","Customer tier","enum",{opts:CUST}),F("cat_class","Catalog class","enum",{opts:["Hardware","Software","Access","Reporting","AV support","New hire"]}),F("returned","Returned to requester","boolean")]});
DATAMODEL.register("change_request",{label:"Change request",source:"ITSM",fields:[F("priority","Priority","enum",{opts:["P2","P3","P4"]}),F("customer_tier","Customer tier","enum",{opts:CUST}),F("close_code","Close code","enum",{opts:["Successful","Successful with issues","Failed"]})]});
DATAMODEL.register("catalog_task",{label:"Catalog task (fulfillment task)",source:"Service catalog",fields:[F("number","Number"),F("request_item","Request item","ref"),F("state","State","enum",{opts:["Open","Work in progress","Pending","Closed complete"]}),F("assignment_group","Assignment group","enum",{opts:TEAMN}),F("service","Service","ref"),F("priority","Priority","enum",{opts:["P2","P3","P4"]}),F("customer_tier","Customer tier","enum",{opts:CUST}),F("opened_at","Opened","datetime"),F("closed_at","Closed","datetime")]});
DATAMODEL.register("vendor_ticket",{label:"Vendor ticket (underpinning contract)",source:"Vendor management",fields:[F("number","Vendor reference"),F("vendor","Vendor or provider","enum",{opts:["Lumen","Microsoft","Northwind Managed Services","Contoso Cloud Operations"]}),F("severity","Severity","enum",{opts:["1","2","3","4"]}),F("type","Type","enum",{opts:["Incident","Change","Request"]}),F("state","State","enum",{opts:["Opened","Vendor working","Waiting on Meridian","Restored","Confirmed"]}),F("service","Service","ref"),F("priority","Priority","enum",{opts:["P1","P2","P3","P4"]}),F("customer_tier","Customer tier","enum",{opts:CUST}),F("opened_at","Opened","datetime")]});
DATAMODEL.register("sla_definition",{label:"Agreement definition (SLA, OLA, UC, XLA)",source:"Agreements",fields:[F("number","Number"),F("name","Name"),F("type","Type","enum",{opts:["SLA","OLA","UC","XLA"]}),F("table","Applies to table","ref"),F("target","Target"),F("goal","Attainment goal","percent"),F("schedule","Schedule","ref"),F("time_zone","Time zone source","enum",{opts:["Fixed","Caller location","Assignment group location"]}),F("active_from","Active from","date"),F("retire_on","Retire on","date"),F("retroactive","Retroactive start","boolean"),F("start_condition","Start condition"),F("pause_condition","Pause condition"),F("resume_condition","Resume condition"),F("stop_condition","Stop condition"),F("reset_condition","Reset condition"),F("cancel_condition","Cancel condition"),F("owner","Owner","ref")]});
DATAMODEL.register("task_sla",{label:"Agreement clock (one per record and agreement)",source:"Agreements",fields:[F("definition","Definition","ref"),F("task","Task","ref"),F("stage","Stage","enum",{opts:["In progress","Paused","Achieved","Breached","Cancelled"]}),F("start_time","Start time","datetime"),F("end_time","End time","datetime"),F("planned_end_time","Planned end time","datetime"),F("business_duration","Business elapsed time","duration"),F("business_percentage","Business percentage elapsed","percent"),F("pause_duration","Pause duration","duration"),F("has_breached","Has breached","boolean"),F("original_breach_time","Original breach time","datetime")]});
DATAMODEL.register("xla_response",{label:"Experience response",source:"Surveys and telemetry",fields:[F("definition","Definition","ref"),F("task","Task","ref"),F("dimension","Dimension","enum",{opts:["Sentiment","Effort","Resolution satisfaction"]}),F("source","Source","enum",{opts:["Post-resolution survey","Portal feedback","Teams pulse","Day-30 pulse survey","Digital experience telemetry"]}),F("score","Score (1 to 5)","number"),F("comment","Comment"),F("responded_at","Responded","datetime")]});
const FTYPE=t=>({enum:"enum",ref:"ref",string:"string",number:"number",percent:"number",duration:"number",boolean:"boolean",datetime:"datetime",date:"datetime",currency:"number"})[t]||"string";
const fieldDef=(tbl,k)=>DATAMODEL.fields(tbl).find(f=>f.k===k);
const fieldLabel=(tbl,k)=>{const f=fieldDef(tbl,k);return f?f.label:k};
const SIMTABLES=["incident","request_item","change_request","catalog_task","vendor_ticket"];
const tblOpts=()=>Object.keys(DATAMODEL.tables).filter(t=>DATAMODEL.fields(t).length).map(t=>[t,DATAMODEL.tables[t].label+(SIMTABLES.includes(t)?"":" (no sample history)")]);

/* ---------------- condition engine ---------------- */
const OPS={"is":(x,v)=>String(x)===String(v),"is not":(x,v)=>String(x)!==String(v),"is one of":(x,v)=>[].concat(v).map(String).includes(String(x)),"is none of":(x,v)=>![].concat(v).map(String).includes(String(x)),"contains":(x,v)=>String(x==null?"":x).toLowerCase().includes(String(v).toLowerCase()),">=":(x,v)=>+x>=+v,"<=":(x,v)=>+x<=+v,"is empty":x=>x==null||x==="","is not empty":x=>!(x==null||x==="")};
const opsFor=t=>t==="enum"||t==="ref"?["is","is not","is one of","is none of","is empty","is not empty"]:t==="number"?[">=","<=","is","is not"]:t==="boolean"?["is"]:t==="datetime"?["is empty","is not empty"]:["is","is not","contains","is empty","is not empty"];
const rowMatch=(r,s)=>{const f=OPS[r.op];if(!f)return false;let x=s[r.f];if(x===true)x="true";if(x===false)x="false";return !!f(x,r.v)};
const phaseMatch=(ph,s)=>{if(!ph||!ph.rows||!ph.rows.length)return null;return ph.m==="any"?ph.rows.some(r=>rowMatch(r,s)):ph.rows.every(r=>rowMatch(r,s))};
const rowText=(tbl,r)=>{const f=fieldDef(tbl,r.f);const lab=f?f.label:r.f;const v=r.op==="is empty"||r.op==="is not empty"?"":" "+([].concat(r.v==null?"":r.v).join(" or "));return lab+" "+r.op+v};
const phaseText=(tbl,ph)=>!ph||!ph.rows||!ph.rows.length?"Not set":ph.rows.map(r=>rowText(tbl,r)).join(ph.m==="any"?"; or ":"; and ");
const PHASES=[["start","Start","The clock starts the first time this is true.",1],["pause","Pause","While this is true the clock stops counting (for example on hold, waiting for the customer).",0],["resume","Resume","The clock counts again when this is true. Leave empty to resume as soon as the pause condition stops being true.",0],["stop","Stop","The clock stops and the result is recorded: met if inside the target.",1],["reset","Reset","Starts the elapsed time again from zero when this becomes true (for example a request returned to the requester).",0],["cancel","Cancel","The clock is thrown away and nothing is measured (for example the priority changed so another agreement now applies).",0]];

/* ---------------- sample record history (deterministic) ---------------- */
const PRI=["P1","P2","P3","P4"];
const PW=[.07,.2,.45,.28];
const CAUSES=[["Waiting on a vendor",.2],["Sent to the wrong group first",.18],["Short staffed at the peak",.16],["Request was unclear",.14],["Approval delay",.12],["No runbook for this case",.1],["Dependency was down",.1]];
const TSPEC={
 incident:{pre:"INC00",n0:4300,path:["New","In progress","Resolved","Closed"],fr:[.07,.93,0],hold:"On hold",holdP:.3,med:[1.2,5,17,40],bump:.1,tail:20},
 request_item:{pre:"RITM00",n0:10300,path:["Submitted","Approval","Fulfillment","Delivered"],fr:[.03,.25,.72],hold:null,holdP:0,med:[18,22,34,60],ret:.08,tail:0,cls:{Hardware:1.5,Software:.5,Access:.25,Reporting:2.6,"AV support":.3,"New hire":1.3}},
 change_request:{pre:"CHG00",n0:2500,path:["New","Assess","Authorize","Scheduled","Implement","Review","Closed"],fr:[.05,.2,.15,.4,.1,.1],hold:null,holdP:0,med:[24,60,100,160],tail:0},
 catalog_task:{pre:"SCTASK00",n0:21000,path:["Open","Work in progress","Closed complete"],fr:[.1,.9],hold:"Pending",holdP:.25,med:[3,4,9,24],tail:0},
 vendor_ticket:{pre:"VND-",n0:88000,path:["Opened","Vendor working","Restored","Confirmed"],fr:[.02,.93,.05],hold:"Waiting on Meridian",holdP:.25,med:[2.6,6,18,40],tail:2}};
const SVCN=()=>SVCREG.map(s=>s.n);
const POOL={};
function genPool(tbl,n,seed){const sp=TSPEC[tbl];if(!sp)return[];const r=RNG("sla|"+tbl+"|"+seed);const out=[];const svcs=SVCREG;
 const opt=k=>{const f=fieldDef(tbl,k);return f&&f.opts?f.opts:null};
 for(let i=0;i<n;i++){const svc=svcs[Math.floor(Math.pow(r(),1.2)*svcs.length)];
  const pr=r();let pi=0,c=0;for(let k=0;k<4;k++){c+=PW[k];if(pr<=c){pi=k;break}}
  const prName=tbl==="request_item"||tbl==="catalog_task"||tbl==="change_request"?PRI[Math.max(1,pi)]:PRI[pi];
  const base={priority:prName,service:svc.n,customer_tier:r()<.15?"Gold":r()<.5?"Silver":"Bronze",assignment_group:pickR(r,TEAMN)};
  const cis=CIREG.filter(c=>c.svc===svc.id);if(cis.length)base.ci=cis[Math.floor(r()*cis.length)].name;
  if(tbl==="incident"){Object.assign(base,{impact:pickR(r,opt("impact")||["3 - Minor degradation"]),urgency:pickR(r,opt("urgency")||["3 - Medium"]),reassignment_count:r()<.7?0:r()<.7?1:2+Math.floor(r()*3),reopen_count:r()<.92?0:1,contact_type:pickR(r,["Portal","Portal","Email","Phone","Chat","Monitoring"])});if(pi===0)base.assignment_group=pickR(r,["Platform team","Network team","Security team"])}
  if(tbl==="request_item"){base.cat_class=pickR(r,["Hardware","Software","Software","Access","Access","Access","Reporting","AV support","New hire"]);base.returned=false;base.assignment_group=base.cat_class==="Access"?"Identity team":base.cat_class==="Hardware"?"Endpoint team":base.cat_class==="Reporting"?"Data team":"Service desk"}
  if(tbl==="change_request"){base.close_code=r()<.88?"Successful":r()<.6?"Successful with issues":"Failed";base.type=pickR(r,["Standard","Normal","Normal","Emergency"])}
  if(tbl==="vendor_ticket"){const vv=r();base.vendor=vv<.35?"Lumen":vv<.6?"Microsoft":vv<.82?"Northwind Managed Services":"Contoso Cloud Operations";base.severity=String(pi+1);base.type=r()<.8?"Incident":r()<.6?"Change":"Request";base.priority=PRI[pi];if(base.vendor==="Lumen")base.service="Search and indexing";if(base.vendor==="Microsoft")base.service="Email and collaboration (M365)";if(base.vendor==="Northwind Managed Services")base.service="Endpoint management (Intune)";if(base.vendor==="Contoso Cloud Operations")base.service="Network and VPN"}
  let cause=null;if(r()<.2){let x=r()*1,k=0;for(const c of CAUSES){k+=c[1]/1.0;if(x<=k){cause=c[0];break}}if(!cause)cause=CAUSES[0][0]}
  const wk=r();let off=Math.floor(Math.pow(r(),.9)*56);let ot=d0(NOW)-off*DAY;let h;if(r()<.85){h=8+r()*9}else h=r()*24;ot+=Math.floor(h*60)*60000;const liveRec=i<14&&i%1===0;if(liveRec){ot=NOW-(.3+r()*26)*HR}
  const dow=new Date(ot).getUTCDay();if(!liveRec&&(dow===0||dow===6)&&r()<.85)ot+=((dow===6?2:1))*DAY;
  if(ot>NOW)ot-=7*DAY;
  let med=sp.med[Math.min(3,pi)];if(sp.cls)med=sp.med[Math.min(3,pi)]*(sp.cls[base.cat_class]||1);
  const sig=r()+r()+r()-1.5;let total=Math.max(.2,med*Math.exp(sig*.8))*(cause?2.4:1);
  base.cause=cause;base.number=sp.pre+String(sp.n0+i+(tbl==="vendor_ticket"?0:0));
  const ev=[{t:ot,set:Object.assign({},base,{state:sp.path[0]})}];let t=ot;const P=sp.path;
  for(let k=1;k<P.length;k++){const frac=sp.fr[k-1];const gap=k===P.length-1&&sp.tail?sp.tail*HR*(.5+r()):frac!=null?frac*total*HR:total*HR*.1;t+=gap;
   if(k===P.length-1||P[k]===P[P.length-1]){}
   ev.push({t,set:{state:P[k]}});
   if(sp.hold&&k===1&&r()<sp.holdP){const hs=t+total*HR*.25*r(),hl=total*HR*(.12+r()*.25);ev.push({t:hs,set:{state:sp.hold}});ev.push({t:hs+hl,set:{state:P[1]}});t+=hl;if(cause==null&&r()<.3)base.cause="Waiting on a vendor"}
   if(tbl==="request_item"&&k===2&&r()<sp.ret){ev.push({t:t+HR*.2,set:{state:"Submitted",returned:true}});ev.push({t:t+HR*1.5,set:{state:"Approval"}});t+=HR*1.6}
   if(tbl==="incident"&&k===1&&r()<sp.bump&&pi>0){ev.push({t:t+total*HR*.3,set:{priority:PRI[pi-1]}})}
   if(tbl==="incident"&&k===1&&base.reassignment_count>0)ev.push({t:t+total*HR*.15,set:{assignment_group:pickR(r,TEAMN)}});
   if(k===2&&tbl==="incident")ev.push({t,set:{first_response_at:t,made_sla:true}});
  }
  ev.sort((a,b)=>a.t-b.t);const e2=ev.filter(x=>x.t<=NOW);
  /* a few records stay open: cut the tail */
  out.push({id:base.number,tbl,f:base,ev:e2.length?e2:[ev[0]],cause:base.cause});
 }return out}
const HT=(h,m,d)=>Date.UTC(2026,9,d||6,h,m);
const HOT=()=>{const mk=(tbl,id,f,evs)=>({id,tbl,f:Object.assign({number:id,customer_tier:"Gold",assignment_group:"Service desk"},f),ev:evs.map((e,i)=>({t:e[0],set:i?e[1]:Object.assign({},f,{number:id,state:e[1].state})})),cause:f.cause||null,hot:true});
 const I=(id,pr,svc,ci,start,evs,x)=>mk("incident",id,Object.assign({priority:pr,service:svc,ci,impact:"2 - Major degradation",urgency:"2 - High",reassignment_count:0,contact_type:"Portal",title:""},x||{}),[[start,{state:"New"}]].concat(evs));
 return {incident:[
  I("INC0004423","P1","Codification Platform","Publish queue workers",HT(10,5),[[HT(10,20),{state:"In progress"}]],{assignment_group:"Platform team",title:"Publish queue is stuck"}),
  I("INC0004417","P2","Contract Repository","Contract search index",HT(15,30,5),[[HT(15,50,5),{state:"In progress"}]],{assignment_group:"Data team",title:"Contract search timing out",cause:"Waiting on a vendor"}),
  I("INC0004421","P2","Network and VPN","Edge firewall pair",HT(8,30),[[HT(8,50),{state:"In progress"}]],{assignment_group:"Network team",title:"Teams call quality drops"}),
  I("INC0004409","P3","Lease subledger (ERP)","Lease subledger database",HT(10,0,2),[[HT(11,0,2),{state:"In progress"}],[HT(13,0,2),{state:"On hold"}],[HT(15,0,2),{state:"In progress"}]],{assignment_group:"Data team",title:"Export fails for the October close"}),
  I("INC0004426","P1","Search and indexing","Search cluster",HT(11,40),[[HT(12,5),{state:"In progress"}],[HT(12,45),{state:"On hold"}]],{assignment_group:"Platform team",title:"Public search returns no results"})],
  vendor_ticket:[
  mk("vendor_ticket","LUM-88213",{vendor:"Lumen",severity:"3",type:"Change",service:"Search and indexing",priority:"P3"},[[HT(9,0,5),{state:"Opened"}],[HT(9,40,5),{state:"Vendor working"}]]),
  mk("vendor_ticket","LUM-88231",{vendor:"Lumen",severity:"1",type:"Incident",service:"Search and indexing",priority:"P1"},[[HT(10,30),{state:"Opened"}],[HT(10,50),{state:"Vendor working"}]]),
  mk("vendor_ticket","NW-55102",{vendor:"Northwind Managed Services",severity:"2",type:"Incident",service:"Endpoint management (Intune)",priority:"P2"},[[HT(13,12),{state:"Opened"}]])],
  request_item:[
  mk("request_item","RITM0010441",{priority:"P3",service:"Endpoint management (Intune)",cat_class:"Hardware",assignment_group:"Endpoint team",returned:false},[[HT(9,12,1),{state:"Submitted"}],[HT(9,15,1),{state:"Approval"}],[HT(10,41,5),{state:"Fulfillment"}]])]}};
const poolOf=tbl=>{const n=SCALE.on?900:260;const k=tbl+"|"+n;if(!POOL[k]){POOL[k]=genPool(tbl,n,SCALE.on?"S":"D");const h=HOT()[tbl];if(h)POOL[k]=h.concat(POOL[k])}return POOL[k]};

/* ---------------- clock replay ---------------- */
function replay(ag,rec,cal,log){const c=ag.cond||{};const snap=Object.assign({},rec.f);delete snap.state;const cur={};let st="idle",run=0,last=null,startT=null,endT=null,pausedH=0,resets=0,pauseStart=null,prevReset=false,justStarted=false;
 const tgt=ag.target.hours;
 for(const ev of rec.ev){Object.assign(cur,ev.set);const s=Object.assign({},snap,cur);
  if(ev.set.priority===undefined&&false){}
  const t=ev.t;
  if(st==="running"&&last!=null)run+=workBetween(last,t,cal);else if(st==="paused"&&last!=null)pausedH+=(t-last)/HR;
  last=t;justStarted=false;
  if(st==="idle"){const m=phaseMatch(c.start,s);if(m){st="running";startT=t;justStarted=true;prevReset=!!phaseMatch(c.reset,s)}else{log&&log.push({t,set:ev.set,st:"idle",run:0,note:"Start condition not met yet"});continue}}
  if(st==="running"||st==="paused"){
   if(c.cancel&&phaseMatch(c.cancel,s)){st="cancelled";endT=t;log&&log.push({t,set:ev.set,st,run,note:"Cancel condition met"});break}
   if(!justStarted&&c.reset){const m=phaseMatch(c.reset,s);if(m&&!prevReset){run=0;pausedH=0;startT=t;resets++;if(st==="paused")st="running"}prevReset=!!m}
   if(!justStarted&&c.stop&&phaseMatch(c.stop,s)){st="stopped";endT=t;log&&log.push({t,set:ev.set,st,run,note:"Stop condition met"});break}
   if(justStarted&&c.stop&&phaseMatch(c.stop,s)){st="stopped";endT=t;log&&log.push({t,set:ev.set,st,run,note:"Stop condition met"});break}
   const pm=c.pause?phaseMatch(c.pause,s):false;
   if(st==="running"&&pm){st="paused";pauseStart=t}
   else if(st==="paused"){const rm=c.resume&&c.resume.rows&&c.resume.rows.length?phaseMatch(c.resume,s):!pm;if(rm)st="running"}
   log&&log.push({t,set:ev.set,st,run,note:justStarted?"Start condition met":st==="paused"?"Pause condition met":resets&&false?"":""});
  }}
 if(st==="running")run+=workBetween(last,NOW,cal);else if(st==="paused")pausedH+=(NOW-last)/HR;
 if(st==="idle")return null;
 const breached=run>tgt+1e-9;
 const stage=st==="stopped"?(breached?"Breached":"Achieved"):st==="cancelled"?"Cancelled":st==="paused"?"Paused":"In progress";
 return {id:rec.id,rec,st,stage,run,tgt,pct:tgt?run/tgt:0,startT,endT,pausedH,resets,breached,open:st==="running"||st==="paused",cause:rec.cause,svc:rec.f.service,prio:rec.f.priority,fin:endT||NOW}}

/* agreement status from activation window */
const agStatus=ag=>{const a=ag.act||{};if(a.draft)return "Draft";if(a.to&&pdate(a.to)<d0(NOW))return "Retired";if(a.from&&pdate(a.from)>d0(NOW))return "Scheduled";if(a.to&&pdate(a.to)-d0(NOW)<=45*DAY)return "Retiring";return "Active"};
const stCls=s=>s==="Active"?"good":s==="Retiring"||s==="Scheduled"?"warn":s==="Draft"?"info":"mute";
/* does an agreement apply to a record */
function applies(ag,rec,at){const a=ag.act||{};const f=rec.f;const t=at==null?rec.ev[0].t:at;
 if(a.svcs&&a.svcs.length&&!a.svcs.includes(f.service))return false;
 if(a.prios&&a.prios.length&&f.priority&&!a.prios.includes(f.priority))return false;
 if(a.cust&&a.cust.length&&f.customer_tier&&!a.cust.includes(f.customer_tier))return false;
 if(a.tiers&&a.tiers.length){const sv=SVCREG.find(s=>s.n===f.service);if(!sv||!a.tiers.includes(sv.tier))return false}
 if(a.cis&&a.cis.length&&!a.cis.includes(f.ci))return false;
 if(a.groups&&a.groups.length&&!a.groups.includes(f.assignment_group))return false;
 const from=a.from?pdate(a.from):0,to=a.to?pdate(a.to)+DAY:1e15;
 if(a.draft)return false;
 if(t<from&&!ag.retro)return false;if(t>to)return false;return true}
/* experience responses derived from the record outcome */
function survey(ag,inst,r){const x=ag.xla||{};const base=x.dim==="Effort"?4.6:x.dim==="Resolution satisfaction"?4.85:4.8;const rr=+(x.resp||.35);if(r()>rr)return null;
 let s=base-(inst&&inst.breached?1.1:0)-((inst&&inst.rec.f.reassignment_count)||0)*.35-(inst&&inst.cause?.35:0)-(inst&&inst.rec.f.reopen_count?1.2:0)-(x.dim==="Effort"&&inst&&inst.rec.f.contact_type==="Phone"?.3:0)+(r()+r()-1)*.9;
 return Math.max(1,Math.min(5,Math.round(s)))}
