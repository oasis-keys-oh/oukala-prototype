/* ---------- Change requests, obligations, reviews, rounds, audit ---------- */
const STAGES=["Requested","Impact review","Legal review","Approval","Approved"];
const CRT=["Schedule change","Scope or project change","Assumption change","Price or rate change","SLA change","Termination or renewal"];
const CRC={"Schedule change":"--story-f","Scope or project change":"--p4","Assumption change":"--warn-f","Price or rate change":"--s3","SLA change":"--u3","Termination or renewal":"--bad-f"};
const CR0=[
{id:"CR-201",ct:"CLM-1001",type:"Schedule change",title:"Milestone 3 slips 7 work days",st:"Impact review",amt:0,days:7,task:"p2_2",req:"Dev Rao",at:"2026-10-02",reason:"Lumen reports the ingestion pipeline needs another week after reviewer feedback. Milestone 3 was due Sep 30.",oldv:"Sep 30, 2026",newv:"Oct 9, 2026",key:"ms3",thread:[{who:"Dev Rao",t:"Marco says the validator found malformed records. I would take the week rather than accept a bad load.",at:"Oct 2"}]},
{id:"CR-202",ct:"CLM-1001",type:"Price or rate change",title:"Add two Lumen engineers for six weeks",st:"Approval",amt:96000,days:-5,task:"p2_2",req:"Priya Shah",at:"2026-09-28",reason:"Risk R-101 says Lumen keeps slipping. Two more engineers pull work forward about five work days.",oldv:"$610,000",newv:"$706,000",key:"price:fixed-statement",thread:[{who:"Priya Shah",t:"This offsets CR-201 almost exactly. Lumen quoted $2,000 a day per engineer.",at:"Sep 28"},{who:"Avery Chen",t:"Funds are available in PR2 vendor services if the reserve covers the overage.",at:"Sep 30"}]},
{id:"CR-203",ct:"CLM-1008",type:"Termination or renewal",title:"Send non-renewal notice and bridge month to month",st:"Requested",amt:-96000,days:0,task:"",req:"Maya Ortiz",at:"2026-10-05",reason:"PR4 replaces the legacy repository. The agreement auto-renews unless notice arrives by Nov 1, 2026.",oldv:"Auto-renews Dec 31, 2026 for one year",newv:"Ends Dec 31, 2026; month to month to Mar 31, 2027",key:"PB-REN",thread:[]},
{id:"CR-204",ct:"CLM-1003",type:"SLA change",title:"Add a 15 minute Severity 1 response with credits",st:"Legal review",amt:0,days:0,task:"",req:"Tom Becker",at:"2026-09-22",reason:"The desk missed Sev 1 response twice this quarter and the contract has no credit.",oldv:"No Severity 1 response target",newv:"15 minutes, 10 percent monthly credit",key:"PB-RSP",thread:[{who:"Tom Becker",t:"Northwind agreed in principle on the call.",at:"Sep 22"},{who:LEGAL,t:"Drafting the amendment language. Needs Northwind counsel.",at:"Sep 30"}]},
{id:"CR-205",ct:"CLM-1010",type:"Assumption change",title:"Azure landing zone ready Nov 15 instead of Oct 15",st:"Requested",amt:0,days:0,task:"",req:"Sam Patel",at:"2026-10-06",reason:"Network review needs another month. The assumption in the statement of work says the landing zone is ready Oct 15.",oldv:"Oct 15, 2026",newv:"Nov 15, 2026",key:"assumption",thread:[]},
{id:"CR-206",ct:"CLM-1012",type:"Termination or renewal",title:"Extend Elise Park through Mar 26, 2027",st:"Approved",amt:61600,days:0,task:"",req:"Priya Shah",at:"2026-09-14",reason:"Test automation for the beta is not done by Dec 18.",oldv:"Ends Dec 18, 2026",newv:"Ends Mar 26, 2027",key:"term",applied:true,thread:[]},
{id:"CR-207",ct:"CLM-1004",type:"Price or rate change",title:"Reduce unassigned E5 seats by 70 at the true-up",st:"Approval",amt:-44000,days:0,task:"",req:"Jordan Lee",at:"2026-09-30",reason:"About 11 percent of E5 seats are unassigned. The enrollment allows a reduction at the anniversary true-up.",oldv:"640 seats",newv:"570 seats",key:"price",thread:[]},
{id:"CR-208",ct:"CLM-1007",type:"Scope or project change",title:"Add a storage tier for Standards content",st:"Approved",amt:21400,days:0,task:"",req:"Tom Becker",at:"2026-09-02",reason:"Content migration needs a hot tier. Matches invoice INV-20451.",oldv:"Standard storage",newv:"Standard plus hot tier",key:"price",applied:true,thread:[]}
];
const CRS=CR0.map(x=>Object.assign({ver:1},x));
const OBL0=[
 ["CLM-1001","Lumen delivers Milestone 3, the taxonomy ingestion pipeline","Vendor","Marco Ellis","2026-09-30","late"],
 ["CLM-1001","Atlantic Systems reviews the Milestone 3 deliverable within 10 business days","Atlantic Systems","Dev Rao","2026-10-23","open"],
 ["CLM-1001","Lumen delivers Milestone 4, indexer running in the test environment","Vendor","Marco Ellis","2026-10-30","risk"],
 ["CLM-1001","Lumen delivers 8 hours of operator training and the runbook","Vendor","Hana Koval","2026-12-04","open"],
 ["CLM-1001","Final acceptance of all deliverables (Milestone 5)","Atlantic Systems","Chief Editor","2026-12-18","open"],
 ["CLM-1001","Atlantic Systems provides production-like data","Atlantic Systems","Dev Rao","2026-04-15","done","2026-04-13"],
 ["CLM-1001","Lumen delivers Milestone 2, indexer design accepted","Vendor","Marco Ellis","2026-05-22","done","2026-06-02"],
 ["CLM-1001","Lumen delivers Milestone 1, data model approved","Vendor","Hana Koval","2026-04-10","done","2026-04-09"],
 ["CLM-1002","Atlantic Systems signs or rejects proposal v2 (target date)","Atlantic Systems","Priya Shah","2026-11-20","open"],
 ["CLM-1002","Legal returns redlines on liability, renewal and AI terms","Atlantic Systems","Atlantic Legal","2026-10-13","open"],
 ["CLM-1003","Northwind sends the monthly SLA report by the 5th","Vendor","Northwind Managed Services","2026-10-05","late"],
 ["CLM-1003","Hold the quarterly business review","Atlantic Systems","Tom Becker","2026-10-28","open"],
 ["CLM-1003","Decide on renewal or send notice (120 days before Oct 31, 2028)","Atlantic Systems","Tom Becker","2028-07-03","open"],
 ["CLM-1003","Northwind sends the September SLA report","Vendor","Northwind Managed Services","2026-09-05","done","2026-09-04"],
 ["CLM-1004","Annual true-up of seat counts","Atlantic Systems","Jordan Lee","2026-11-30","open"],
 ["CLM-1004","Decide on renewal enrollment (notice 90 days before Jun 30, 2027)","Atlantic Systems","Jordan Lee","2027-04-01","open"],
 ["CLM-1005","Negotiate Beacon terms and target signature","Atlantic Systems","Dev Rao","2026-11-20","open"],
 ["CLM-1007","Claim the Q3 availability service credit of $8,200","Atlantic Systems","Tom Becker","2026-10-31","open"],
 ["CLM-1007","Northwind sends the September usage report","Vendor","Northwind Cloud","2026-10-05","done","2026-10-03"],
 ["CLM-1007","Hold the quarterly business review","Atlantic Systems","Tom Becker","2026-10-28","open"],
 ["CLM-1008","Send notice of non-renewal to LegacyDocs (60 days before Dec 31)","Atlantic Systems","Maya Ortiz","2026-11-01","risk"],
 ["CLM-1008","Export all repository data before support ends","Atlantic Systems","Jordan Lee","2026-12-15","open"],
 ["CLM-1009","Review storage capacity at the quarterly review","Atlantic Systems","Tom Becker","2026-10-28","open"],
 ["CLM-1010","Atlantic Systems provides the Azure landing zone","Atlantic Systems","Sam Patel","2026-10-15","risk"],
 ["CLM-1010","Contoso sends the monthly patch compliance report","Vendor","Contoso Cloud Operations","2026-10-08","open"],
 ["CLM-1010","Contoso sends the September patch compliance report","Vendor","Contoso Cloud Operations","2026-09-08","done","2026-09-08"],
 ["CLM-1011","Approve monthly timesheets","Atlantic Systems","Sam Patel","2026-10-30","open"],
 ["CLM-1011","Decide on extending the engagement (30 days before Jan 29)","Atlantic Systems","Sam Patel","2026-12-30","open"],
 ["CLM-1012","Elise Park hands over test suites and documentation","Vendor","Elise Park","2026-12-11","open"],
 ["CLM-1012","Decide on extension notice","Atlantic Systems","Priya Shah","2026-11-18","open"]
];
const OBL=OBL0.map((o,i)=>({id:"OB-"+String(101+i),ct:o[0],t:o[1],party:o[2],who:o[3],due:o[4],st:o[5],dn:o[6]||"",kind:/invoice|pay/i.test(o[1])?"Payment":/notice|renewal|extension/i.test(o[1])?"Renewal notice":/deliver|handover|export/i.test(o[1])?"Deliverable":/report/i.test(o[1])?"Report":/review|approve|accept/i.test(o[1])?"Review or acceptance":"Other"}));
const REV=[];const RND=[];const AUD=[];
const aud=(who,act,ct,detail)=>{AUD.unshift({at:TDY+" "+String(8+Math.floor(AUD.length/3)%9).padStart(2,"0")+":"+String((AUD.length*7)%60).padStart(2,"0"),who:who,act:act,ct:ct,d:detail});audit(act,(ct?ct+": ":"")+detail)};
const audSeed=(at,who,act,ct,d)=>AUD.push({at:at,who:who,act:act,ct:ct,d:d});
/* ---------- Scale: enterprise volumes ---------- */
function buildGen(){const r=RNG("sowgen"),pick=a=>a[Math.floor(r()*a.length)];
 const A=["Orbit","Helix","Summit","Pioneer","Atlas","Keystone","Vector","Cobalt","Nimbus","Quartz","Lattice","Harbor","Northstar","Redwood","Ironbridge","Clearwater","Bluefin","Skyline","Paragon","Ember","Cascade","Granite","Silverline","Trestle","Monarch"],B=["Systems","Software","Consulting","Cloud","Data","Security","Networks","Services","Analytics","Staffing","Labs","Partners"];
 const TYPESW=[["SOW",.3],["MSA",.12],["Software license",.2],["DPA",.08],["NDA",.1],["Order form",.12],["Support agreement",.08]];
 const own=DIR.filter(d=>d.kind==="human"&&!d.generated).map(d=>d.name),svcs=SVCREG.map(s=>s.n),pj=SCALE.projects().map(p=>p.id).concat(["PR1","PR2","PR3","PR4"]);
 const list=[];for(let i=0;i<420;i++){const vendor=pick(A)+" "+pick(B);let x=r(),ty="SOW";for(const t of TYPESW){x-=t[1];if(x<=0){ty=t[0];break}}
  const yrs=1+Math.floor(r()*4),sd=new Date(Date.UTC(2023,6,1)+Math.floor(r()*1180)*DMS),start=sd.toISOString().slice(0,10),end=addD(start,Math.round(yrs*365)-1);
  const val=ty==="NDA"||ty==="DPA"?0:Math.round((20000+Math.pow(r(),2.4)*2800000)/1000)*1000;let st=end<TDY?"Expired":difD(end,TDY)<120?"Expiring":r()<.08?"In negotiation":r()<.03?"Draft":"Executed";
  if(st==="In negotiation"||st==="Draft"){const s2=addD(TDY,10+Math.floor(r()*90));}
  const off=Math.floor(r()*r()*24),n=12+Math.floor(r()*56),num=2000+i;
  list.push({id:"CLM-"+num,num:num,title:vendor+" "+ty.toLowerCase()+" "+(i%7+1),vendor:vendor,type:ty,status:st,value:val,start:start,end:end,auto:r()<.45&&ty!=="NDA",notice:pick([30,60,90,120]),owner:pick(own),vOwner:vendor,proj:r()<.25?pick(pj):"",svc:pick(svcs),risk:pick(["Low","Low","Medium","Medium","High"]),line:"",gen:true,
   prop:{ver:"v"+(1+Math.floor(r()*3)),vers:[],date:addD(start,-30-Math.floor(r()*40)),file:vendor.replace(/ /g,"_")+"_proposal.pdf",value:Math.round(val*(1+r()*.12)/1000)*1000},exe:st==="Executed"||st==="Expiring"||st==="Expired"?{date:addD(start,-6),ver:"Executed",file:vendor.replace(/ /g,"_")+"_executed.pdf",tcs:"Vendor terms"}:null,amend:r()<.2?[{id:"A1",date:addD(start,90),title:"Scope and price amendment",delta:Math.round(val*.05/1000)*1000,sum:"Generated sample amendment."}]:[],ann:Math.round(val/yrs),n:n,off:off,inv:null})}
 GEN.list=list;GEN.obl=null;GEN.lines=null;GEN.cr=null;GEN.on=true}
function CTS(){if(SCALE.on){if(!GEN.on)buildGen();return CT0.concat(GEN.list)}return CT0}
const ctOf=id=>CTS().find(c=>c.id===id)||CT0.find(c=>c.id===id);
function OBLS(){if(!SCALE.on)return OBL;if(!GEN.obl){const r=RNG("sowobl"),pick=a=>a[Math.floor(r()*a.length)],o=[];GEN.list.filter(c=>c.status==="Executed"||c.status==="Expiring").forEach(c=>{const k=3+Math.floor(r()*4);for(let i=0;i<k;i++){const due=addD(TDY,Math.round(-40+r()*250)),past=due<TDY,x=r();const kind=pick(["Deliverable","Report","Payment","Review or acceptance","Renewal notice","Deliverable","Report"]);const party=kind==="Report"||kind==="Deliverable"?pick(["Vendor","Vendor","Atlantic Systems"]):"Atlantic Systems";
   o.push({id:"OB-G"+o.length,ct:c.id,t:({Deliverable:"Deliver the next scheduled work product",Report:"Send the periodic service report",Payment:"Pay the scheduled invoice",["Review or acceptance"]:"Review and accept the deliverable","Renewal notice":"Decide on renewal before the notice date"})[kind],party:party,who:party==="Vendor"?c.vendor:c.owner,due:due,st:past?(x<.7?"done":x<.82?"done":"late"):x<.04?"risk":"open",dn:past&&x<.7?addD(due,-Math.floor(r()*3)):past&&x<.82?addD(due,2+Math.floor(r()*9)):"",kind:kind})}});GEN.obl=OBL.concat(o)}return GEN.obl}
function CRALL(){if(!SCALE.on)return CRS;if(!GEN.cr){const r=RNG("sowcr"),pick=a=>a[Math.floor(r()*a.length)],o=[];for(let i=0;i<72;i++){const c=pick(GEN.list.filter(x=>x.status==="Executed")),ty=pick(CRT),amt=ty==="Price or rate change"||ty==="Scope or project change"?Math.round((r()-.2)*180000/1000)*1000:0;o.push({id:"CR-G"+(300+i),ct:c.id,type:ty,title:ty+" for "+c.vendor,st:pick(STAGES.slice(0,4).concat(["Approved","Approved"])),amt:amt,days:ty==="Schedule change"?Math.floor(r()*15):0,task:"",req:c.owner,at:addD(TDY,-Math.floor(r()*60)),reason:"Generated enterprise sample.",oldv:"Current terms",newv:"Requested terms",key:"",thread:[],ver:1,applied:false})}GEN.cr=CRS.concat(o)}return GEN.cr}
const ctName=id=>{const c=ctOf(id);return c?c.title:id};
const ctShort=id=>{const c=ctOf(id);return c?c.vendor+" "+(c.type==="SOW"?(c.title.match(/SOW-\d+/)||["SOW"])[0]:c.type):id};
const fmtTz=n=>n>=1e6?"$"+(n/1e6).toFixed(n%1e6?2:0).replace(/0$/,"")+"M":n>=1e3?"$"+Math.round(n/1e3)+"K":"$"+n;
