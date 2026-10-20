(function(){
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const N=n=>Math.round(n).toLocaleString("en-US");
const D$=n=>(n<0?"-":"")+"$"+N(Math.abs(n));
const has=id=>SCREENS.some(s=>s[0]===id);
const goG=id=>has(id)?go(id):toast("That screen is not part of this build","info");
const T=S.tbm=Object.assign({sel:null,focus:null,step:"st_search",mode:"showback",sc:{ai:40000,lic:12,staff:0,growth:1,weeks:52},made:{}},S.tbm||{});
const SX=()=>window.SVCX||{};
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,"_").slice(0,26);

/* ============ taxonomy (TBM Taxonomy v5, Apptio TBM Unified Model) ============ */
const POOLS=[["Labor","--p4"],["Vendor and outside services","--u3"],["Cloud services","--s3"],["Hardware","--w1"],["Software and licences","--e4"],["Facilities and power","--p6"]];
const TOWERS=[["Compute","--p4"],["Storage","--p6"],["Network","--s3"],["End user","--w1"],["Security","--u1"],["Service desk","--e4"],["Applications","--u3"],["Delivery","--p2"]];
const POOL_MIX={Compute:[.15,.1,.4,.2,.05,.1],Storage:[.1,.08,.4,.25,.02,.15],Network:[.15,.25,.1,.3,.05,.15],"End user":[.15,.1,0,.35,.35,.05],Security:[.3,.15,.05,.05,.45,0],"Service desk":[.6,.2,0,0,.15,.05],Applications:[.4,.15,.1,0,.33,.02],Delivery:[.7,.2,.1,0,0,0]};
const SVC_MIX={svc_cod:[.18,.07,.04,.04,.06,.08,.37,.16],svc_portal:[.27,.06,.15,.02,.1,.08,.22,.1],svc_search:[.34,.14,.05,.02,.04,.05,.28,.08],svc_cr:[.14,.12,.03,.08,.08,.1,.36,.09],svc_erp:[.2,.08,.03,.05,.08,.1,.38,.08],svc_fin:[.1,.05,.03,.1,.1,.1,.42,.1],svc_id:[.1,.03,.1,.1,.35,.12,.15,.05],svc_m365:[.05,.05,.05,.3,.1,.1,.3,.05],svc_data:[.3,.25,.05,.02,.06,.04,.18,.1],svc_net:[.1,.02,.6,.03,.1,.05,.02,.08],svc_end:[.05,.02,.04,.55,.1,.1,.06,.08],svc_int:[.2,.05,.1,.02,.08,.05,.4,.1],svc_desk:[.04,.02,.02,.1,.04,.56,.12,.1]};
const CONS=[["Editorial","bu"],["Standards development","bu"],["Finance","bu"],["Legal operations","bu"],["Procurement","bu"],["IT operations","bu"],["Executive office","bu"],["Member services","bu"],["Public readers","ext"],["Subscribers","ext"],["API licensees","ext"],["Unallocated shared overhead","un"]];
const CONS_C={bu:"--p4",ext:"--s3",un:"--faint"};
const STAFF={Editorial:.34,"Standards development":.18,Finance:.09,"Legal operations":.06,Procurement:.04,"IT operations":.13,"Executive office":.06,"Member services":.10};
const CMIX={svc_cod:{Editorial:.55,"Standards development":.35,"IT operations":.05,"Executive office":.05},svc_portal:{"Public readers":.45,Subscribers:.35,"API licensees":.2},svc_search:{"Public readers":.5,Editorial:.2,"Standards development":.12,Subscribers:.1,"API licensees":.08},svc_cr:{"Legal operations":.6,Finance:.2,Procurement:.2},svc_erp:{Finance:.85,"Executive office":.05,Procurement:.1},svc_fin:{Finance:.85,"Executive office":.05,Procurement:.1},svc_data:{"Standards development":.3,Editorial:.2,Finance:.15,"IT operations":.15,"Executive office":.1,"Member services":.1},svc_int:{"IT operations":.5,Finance:.2,Editorial:.2,"Standards development":.1}};
const OFFW={svc_portal:{"Public reader site":.45,"Subscriber access":.25,"API licensing":.3},svc_search:{"Public search":.6,"Editor search":.25,"Related content":.15},svc_cod:{"Editor workspace":.5,"Publishing pipeline":.2,"Standards API":.3},svc_desk:{"Incident handling":.45,Requests:.35,Knowledge:.2}};
/* usage today: [monthly volume in the offering's own unit, unit label, driver, growth per month] */
const USE={"Public search":[2200,"1,000 queries","Search queries",.03],"Editor search":[420,"editors","Active editors",.015],"Related content":[950,"1,000 recommendations","Recommendation calls",.04],"Public reader site":[14000,"1,000 page views","Page views",.02],"Standards API":[11,"million calls","API calls",.04],"API licensing":[4,"million calls","Licensee API calls",.05],"Incident handling":[640,"incidents","Incidents",.02],Requests:[1150,"requests","Requests",.03],"Laptop provisioning":[38,"devices","Devices provisioned",.01],"Publishing pipeline":[22,"releases","Releases",.01],"Editor workspace":[420,"seats","Active seats",.015]};
/* GL accounts feeding the cost pools */
const GL=[["6110","Salaries and wages, IT","Labor",.62],["6125","Benefits and payroll taxes, IT","Labor",.28],["6130","Contract labor","Labor",.10],["6410","Managed services (Northwind)","Vendor and outside services",.55],["6420","Consulting and implementation","Vendor and outside services",.30],["6430","Vendor support and maintenance","Vendor and outside services",.15],["6510","Azure consumption","Cloud services",.8],["6520","SaaS subscriptions (cloud)","Cloud services",.2],["6210","Computer hardware, expensed","Hardware",.55],["6220","Depreciation, hardware","Hardware",.45],["6310","Software licences and subscriptions","Software and licences",.75],["6320","Software maintenance","Software and licences",.25],["6710","Facilities and data center share","Facilities and power",.7],["6720","Power and cooling share","Facilities and power",.3]];

/* ============ the model: conservation of cost from services back to the ledger ============ */
let _m=null,_sig="";
function model(){const sv=window.SVCREG||[];const sig=sv.map(s=>s.id+":"+s.cost+":"+s.offerings.length).join("|")+"|"+(SX().off?SX().off.length:0);if(_m&&sig===_sig)return _m;_sig=sig;
 const svT={},towT=TOWERS.map(()=>0);sv.forEach(s=>{const mix=SVC_MIX[s.id]||[.12,.05,.05,.06,.06,.08,.5,.08];const tot=mix.reduce((a,b)=>a+b,0);svT[s.id]=mix.map(m=>s.cost*m/tot);svT[s.id].forEach((v,i)=>towT[i]+=v)});
 const poolT=POOLS.map(()=>0),tp=TOWERS.map(()=>POOLS.map(()=>0));TOWERS.forEach((t,i)=>{const q=POOL_MIX[t[0]],sm=q.reduce((a,b)=>a+b,0);q.forEach((x,j)=>{const v=towT[i]*x/sm;tp[i][j]=v;poolT[j]+=v})});
 const total=sv.reduce((a,s)=>a+s.cost,0);
 const offs={},cons={};sv.forEach(s=>{const w=OFFW[s.id];let ws=s.offerings.map(o=>(w&&w[o])||1/s.offerings.length);const sm=ws.reduce((a,b)=>a+b,0)||1;offs[s.id]=s.offerings.map((o,i)=>({name:o,cost:s.cost*ws[i]/sm}));
  let mix=CMIX[s.id];if(!mix){mix=Object.assign({},STAFF)}const ms=Object.values(mix).reduce((a,b)=>a+b,0);const c={};Object.entries(mix).forEach(([k,v])=>c[k]=s.cost*.97*v/ms);c["Unallocated shared overhead"]=s.cost*.03;cons[s.id]=c});
 _m={svT,towT,poolT,tp,total,offs,cons};return _m}
const totalCost=()=>model().total;
const staffUsers=()=>640;
const unitOf=(s,o)=>{const m=model();const oc=(m.offs[s.id]||[]).find(x=>x.name===o);const cost=oc?oc.cost:0;const u=USE[o];
 if(u)return{vol:u[0],unit:u[1],drv:u[2],g:u[3],cost,perUnit:cost/u[0]};const vol=Math.max(1,Math.round(s.users*(s.users>5000?.01:1)));return{vol,unit:"user",drv:"Active users",g:.01,cost,perUnit:cost/vol}};

/* ============ scaling steps ============ */
const SCN=()=>T.sc;
const ramp=(w,r)=>Math.min(1,w/r);
const STEPS=[
 {id:"st_desk",svc:"svc_desk",name:"Service desk analysts",res:"analyst",unit:"tickets and requests a month",cap:560,units:4,cost:96000,util:.85,base:1790,g:.012,lead:6,fund:"Operations run budget: service desk labor",alloc:520000,used:384000,kind:"people",ext:(s,w)=>s.staff*2.8*ramp(w,8)+s.ai*.004*ramp(w,12)+s.lic*2.5*ramp(w,4),adds:[],why:"One analyst handles about 560 tickets and requests a month at healthy utilization."},
 {id:"st_search",svc:"svc_search",name:"Search indexer nodes",res:"indexer node",unit:"index queries a month",cap:1700000,units:2,cost:38000,util:.85,base:2200000,g:.015,lead:5,fund:"Run budget: search and indexing (Lumen)",alloc:152000,used:76000,kind:"node",ext:(s,w)=>s.ai*25*ramp(w,14)+s.lic*12500*ramp(w,4),adds:[["Part-time search relevance analyst (0.25 FTE)",24000]],why:"Each Lumen indexer node serves about 1.65 million index queries a month. One AI question fans out to about 25 index queries."},
 {id:"st_api",svc:"svc_portal",name:"API gateway units",res:"gateway unit",unit:"API calls a month",cap:20e6,units:1,cost:27000,util:.85,base:15e6,g:.02,lead:3,fund:"Run budget: integration and API (offset by licence revenue)",alloc:90000,used:27000,kind:"license",ext:(s,w)=>s.lic*1e6*ramp(w,4),adds:[],why:"One gateway unit carries 20 million calls a month. Licence bands: evaluation, 5 million, 50 million."},
 {id:"st_cod",svc:"svc_cod",name:"Standards application servers",res:"server",unit:"concurrent editors",cap:150,units:3,cost:14400,util:.85,base:260,g:.015,lead:4,fund:"Run budget: Standards Platform hosting",alloc:64000,used:43200,kind:"node",ext:(s,w)=>s.staff*.45*ramp(w,8),adds:[],why:"One server holds 150 concurrent editors."},
 {id:"st_cr",svc:"svc_cr",name:"Contract storage blocks",res:"5 TB block",unit:"terabytes stored",cap:5,units:4,cost:4800,util:.9,base:14.5,g:.035,lead:2,fund:"Run budget: Contract Repository storage",alloc:24000,used:19200,kind:"node",ext:()=>0,adds:[],why:"Storage is bought in 5 terabyte blocks."},
 {id:"st_data",svc:"svc_data",name:"Lakehouse capacity units",res:"capacity unit",unit:"scheduled pipelines",cap:40,units:3,cost:31000,util:.85,base:96,g:.012,lead:6,fund:"Run budget: data platform (Azure)",alloc:140000,used:93000,kind:"node",ext:(s,w)=>s.ai*.0003*ramp(w,12),adds:[],why:"One lakehouse unit runs about 40 scheduled pipelines."},
 {id:"st_id",svc:"svc_id",name:"Entra ID P2 licence bands",res:"100-user band",unit:"licensed users",cap:100,units:7,cost:21600,util:.95,base:640,g:.002,lead:2,fund:"Run budget: identity licences",alloc:155000,used:151200,kind:"license",ext:(s,w)=>s.staff*ramp(w,8),adds:[],why:"Licences are bought in bands of 100 users."},
 {id:"st_erp",svc:"svc_erp",name:"Lease subledger servers",res:"server",unit:"concurrent users",cap:40,units:3,cost:9600,util:.7,base:22,g:-.01,lead:3,fund:"Run budget: ERP hosting (retiring under D3)",alloc:30000,used:28800,kind:"node",ext:()=>0,adds:[],why:"The lease subledger is retiring (demand D3); most of its capacity is idle."}];
const stepOf=id=>STEPS.find(s=>s.id===id);
const demandAt=(st,w)=>{const s=SCN();return st.base*Math.pow(1+st.g*s.growth,w/4.33)+Math.max(0,st.ext(s,w))};
const needAt=(st,w)=>Math.max(1,Math.ceil(demandAt(st,w)/(st.cap*st.util)-1e-9));
function evalStep(st,weeks){weeks=weeks||SCN().weeks;let up=null,peak=st.units,low=1e9;for(let w=0;w<=weeks;w++){const n=needAt(st,w);if(n>st.units&&up==null)up=w;peak=Math.max(peak,n);if(w<=26)low=Math.min(low,n)}
 const maxNeed26=Math.max(...Array.from({length:27},(_,w)=>needAt(st,w)));const down=up==null&&maxNeed26<st.units?st.units-maxNeed26:0;const add=Math.max(0,peak-st.units);
 const extra=add?st.adds.reduce((a,b)=>a+b[1],0):0;const cost=add*st.cost+extra;const save=down*st.cost;const util0=demandAt(st,0)/(st.cap*st.units);
 return{st,up,add,down,cost,save,peak,util0,utilPeak:demandAt(st,weeks)/(st.cap*st.units),extra}}
function triggers(){const out=[];STEPS.forEach(st=>{const e=evalStep(st);const s=svcOf(st.svc);const nm=s?s.n:st.svc;
 if(e.add){const w=e.up;out.push({id:"tg_"+st.id,step:st.id,service:st.svc,serviceName:nm,kind:"up",inWeeks:w,units:e.add,annualCost:e.cost,text:(w===0?"Now: ":"In "+w+" week"+(w===1?"":"s")+": ")+nm+" needs "+(e.add===1?"a "+(st.units+1)+(["th","st","nd","rd"][st.units+1]||"th")+" ":e.add+" more ")+st.res+(e.add>1?"s":"")+" ("+D$(e.cost-e.extra)+" a year)"+(e.extra?", plus "+st.adds.map(a=>a[0].toLowerCase()+" ("+D$(a[1])+" a year)").join(", "):"")+". Order "+st.lead+" weeks ahead"+(w<=st.lead?", so start the request now.":"."),orderBy:Math.max(0,w-st.lead),fund:st.fund,alloc:st.alloc,used:st.used,e})}
 else if(e.down){out.push({id:"tg_"+st.id,step:st.id,service:st.svc,serviceName:nm,kind:"down",inWeeks:0,units:e.down,annualCost:-e.save,text:nm+" runs at "+Math.round(e.util0*100)+"% of capacity. You can retire "+e.down+" "+st.res+(e.down>1?"s":"")+" and save "+D$(e.save)+" a year without crossing the "+Math.round(st.util*100)+"% utilization line for 26 weeks.",orderBy:0,fund:st.fund,alloc:st.alloc,used:st.used,e})}});
 return out.sort((a,b)=>(a.kind==="down")-(b.kind==="down")||a.inWeeks-b.inWeeks)}

/* ============ TBMX: the contract for the catalog, SLA and budget builders ============ */
function svcModel(id){const m=model(),s=svcOf(id);if(!s||!m.svT[id])return null;const towers=TOWERS.map((t,i)=>[t[0],Math.round(m.svT[id][i])]);
 const u=s.offerings.map(o=>unitOf(s,o));const main=u.reduce((a,b)=>b.cost>a.cost?b:a,u[0]||{cost:0,perUnit:0,vol:1,unit:"unit"});
 const r=RNG("bud"+id);const ann=Math.round(s.cost*12*(1.015+r()*.03));const ytdB=Math.round(ann/12*3),ytdA=Math.round(s.cost*3*(.97+r()*.07));
 return{monthly:s.cost,towers,unit:{label:"per "+main.unit,cost:main.perUnit,volume:main.vol,vol:main.unit},budget:{annual:ann,ytdBudget:ytdB,ytdActual:ytdA},consumers:Object.entries(m.cons[id]||{})}}
window.TBMX={
 service:svcModel,
 unitCost(id){const s=svcOf(id);if(!s)return null;const m=svcModel(id);return{unit:m.unit.label,cost:m.unit.cost,volume:m.unit.volume,monthly:s.cost}},
 offering(offId){const O=(SX().offerings?SX().offerings():[]).find(o=>o.id===offId);if(!O)return null;const s=svcOf(O.svc);const u=unitOf(s,O.n);return{unit:"per "+u.unit,cost:u.perUnit,volume:u.vol,monthly:Math.round(u.cost)}},
 steps:()=>STEPS.map(s=>({id:s.id,service:s.svc,name:s.name,capacityPerUnit:s.cap,units:s.units,costPerUnit:s.cost})),
 triggers,
 forecast(o){o=o||{};const st=o.step?stepOf(o.step):STEPS.find(s=>s.svc===o.service);if(!st)return null;const save=Object.assign({},T.sc);if(o.scenario)Object.assign(T.sc,o.scenario);const weeks=o.weeks||T.sc.weeks;const pts=[];for(let w=0;w<=weeks;w++)pts.push({week:w,demand:demandAt(st,w),need:needAt(st,w),capacity:st.cap*st.units*st.util});const ev=evalStep(st,weeks);Object.assign(T.sc,save);return{step:st.id,points:pts,crossesInWeeks:ev.up,addUnits:ev.add,annualCost:ev.cost}},
 totalMonthly:totalCost};
Object.assign(METRICS,{
 m_cost_user:{n:"IT cost per employee a month",f:"Σ fully allocated technology cost for the month ÷ number of employees and contractors served (dollars)",u:"",cur:429,tgt:450,badAt:520,dir:"min",max:700,tr:[455,452,447,441,438,434,431,429],owner:"CIO office",use:["Cost transparency (TBM and ATUM)","Service portfolio and map"],rem:{kind:"sop",ref:"SOP-310",title:"Review the highest cost towers",agent:"FinOps Agent",auto:false,state:"idle",prog:"Lists the three towers with the largest month over month rise"}},
 m_unit_cost:{n:"Unit cost against plan",f:"Σ (actual cost per unit ÷ planned cost per unit) across the offerings with a defined unit, weighted by spend",u:"%",cur:103,tgt:100,badAt:112,dir:"min",max:140,tr:[108,107,106,105,105,104,104,103],owner:"Service owners",use:["Cost transparency (TBM and ATUM)","Service offerings"],rem:{kind:"agent",ref:"AG-33",title:"Unit cost explainer",agent:"FinOps Agent",auto:false,state:"idle",prog:"Explains each unit cost change by driver, rate and volume"}},
 m_fc_acc:{n:"Demand forecast accuracy",f:"1 − (Σ |forecast volume − actual volume| ÷ Σ actual volume) over the last 6 months, across scaling drivers",u:"%",cur:91,tgt:90,badAt:80,dir:"max",max:100,tr:[84,86,87,88,89,90,90,91],owner:"Capacity planning",use:["Cost transparency (TBM and ATUM)"],rem:{kind:"kb",ref:"KB0318",title:"Improving capacity forecasts",agent:"Capacity Agent",auto:false,state:"idle",prog:"Refits growth rates with the latest six months"}},
 m_tbm_alloc:{n:"Spend traced to consumers",f:"Σ cost allocated to a named consumer ÷ Σ total technology cost",u:"%",cur:97,tgt:95,badAt:85,dir:"max",max:100,tr:[88,90,92,93,95,96,96,97],owner:"CIO office",use:["Cost transparency (TBM and ATUM)"],rem:{kind:"sop",ref:"SOP-311",title:"Assign shared cost drivers",agent:"FinOps Agent",auto:false,state:"idle",prog:"Proposes allocation drivers for unallocated overhead"}}});
