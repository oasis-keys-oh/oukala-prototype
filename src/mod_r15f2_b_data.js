/* mod_r15f2_b_data.js (Round 15, Agent F2). GRC data layer: window.GRCX. One register per concept, reusing what exists:
   risks mirror project risks (RK, RAID) and add enterprise risks; controls extend the control library (adm_audit) with test
   cycles and attestations; findings, policies, audits, third-party assessments and exceptions are new records that link back to
   existing risks, controls, vendors, contracts, budget lines, processes, metrics and owners. Writes go through window.STORE when present. */
(function(){
"use strict";
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const arr=x=>Array.isArray(x)?x:[];
const TODAY="2026-10-10";
const iso=off=>{const d=new Date(TODAY+"T12:00:00");d.setDate(d.getDate()+off);return d.toISOString().slice(0,10)};
const days=s=>Math.round((new Date(s+"T12:00:00")-new Date(TODAY+"T12:00:00"))/864e5);
const X=window.GRCX=window.GRCX||{};
X.TODAY=TODAY;X.iso=iso;X.days=days;
const humans=()=>arr(G(()=>DIR,[])).filter(d=>d.kind==="human").map(d=>d.name);

/* ---------- scoring: 5 by 5, one scale for every risk source ---------- */
X.score=(l,i)=>(+l||0)*(+i||0);
X.band=s=>s>=15?["bad","Critical"]:s>=10?["warn","High"]:s>=5?["info","Moderate"]:["good","Low"];
X.APPETITE={Cyber:8,Privacy:6,Regulatory:5,Vendor:10,Financial:10,Operational:10,People:10,Strategic:12,"AI":8,Project:12};
X.CATS=Object.keys(X.APPETITE);
X.FW=["NIST CSF","ISO 27001","SOC 2","Internal policy"];

/* ---------- persistence: write through STORE when present, otherwise keep in memory ---------- */
const S_=()=>window.STORE&&typeof window.STORE.put==="function"?window.STORE:null;
X.put=function(entity,rec){const s=S_();if(!s)return false;try{s.put(entity,JSON.parse(JSON.stringify(rec)));return true}catch(e){return false}};
X.persisted=()=>!!S_();
function hydrate(entity,list){const s=S_();if(!s||typeof s.get!=="function")return;list.forEach(r=>{try{const v=s.get(entity,r.id);if(v&&typeof v==="object"&&!v.then)Object.assign(r,v)}catch(e){}})}

/* ---------- people: owner and backup always named humans ---------- */
const OB={ // domain defaults used when a library entry names a team or role
 "AI governance":["Kenji Watanabe","Aaron Whitfield"],"Test Agent":["Aaron Whitfield","Rina Okafor"],"Rosa Alvarez":["Colette Brandt","Rina Okafor"]};

/* ---------- risks ---------- */
const ER=(id,t,cat,own,bak,il,ii,rl,ri,st,o)=>Object.assign({id,t,cat,own,bak,il,ii,rl,ri,st,src:"Enterprise",ctl:[],proc:"",ent:"",met:"",proj:"",vend:"",svc:"",kri:null,plan:"",due:iso(60),rev:iso(-20),exc:"",desc:""},o);
X.risks=[
 ER("GR-101","Ransomware halts the publishing platform","Cyber","Rina Okafor","Aaron Whitfield",4,5,3,4,"Treating",{ctl:["GL-001","GL-004","GC-202","GC-203"],proc:"grc.control_test",ent:"business_service",met:"m_grc_ctl_cov",proj:"PR3",svc:"Standards Platform",kri:{n:"Critical vulnerabilities open over 14 days",v:6,th:3,u:""},plan:"Patch within 14 days, verify offsite restore, add immutable backups before the Nov freeze.",due:iso(28),desc:"Encryption of the editor workspace and portal would stop publication for every member."}),
 ER("GR-102","Member personal data exposed through a misconfigured store","Privacy","Theo Marlowe","Rina Okafor",3,5,2,4,"Treating",{ctl:["GC-204","GC-205","GL-008"],proc:"grc.policy_review",ent:"person",met:"m_grc_pol_ack",plan:"Finish the personal data inventory and enable storage configuration alerts.",due:iso(45),kri:{n:"Stores without a data classification label",v:5,th:2,u:""},desc:"Member contact and ballot data sits in several Azure stores."}),
 ER("GR-103","Search indexing depends on one vendor (Lumen)","Vendor","Camille Ortega","Maya Ortiz",4,4,3,4,"Treating",{ctl:["GC-206"],proc:"grc.vendor_assessment",ent:"core_company",met:"m_grc_ven_t1",proj:"PR2",vend:"LUM",plan:"Add an exit clause to SOW-4, document the indexer and keep two engineers shadowing.",due:iso(35),kri:{n:"Lumen milestone days late",v:9,th:5,u:" d"},desc:"Milestone 2 slipped nine days; the Taxonomy Data Hub reads the same index."}),
 ER("GR-104","Conflict of interest in technical committee balloting","Regulatory","Theo Marlowe","Elena Marsh",3,5,2,5,"Treating",{ctl:["GC-207","GC-208"],proc:"grc.attestation",ent:"policy",met:"m_grc_att_rate",plan:"Collect annual declarations before ballots open and record recusals.",due:iso(20),kri:{n:"Committee members without a current declaration",v:4,th:0,u:""},desc:"Independence is what members pay for; one undeclared conflict is a reputational event."}),
 ER("GR-105","Antitrust guidance missed in committee meetings","Regulatory","Theo Marlowe","Joanna Pierce",3,4,2,4,"Open",{ctl:["GC-208"],proc:"grc.attestation",ent:"policy",met:"m_grc_pol_ack",plan:"Brief the chair before each ballot and file the briefing with the minutes.",due:iso(14),desc:"An August ballot ran without the briefing (see finding FND-107)."}),
 ER("GR-106","Membership renewals fall short of budget","Financial","Marcus Reid","Avery Chen",3,4,3,3,"Open",{ctl:["GC-209"],proc:"grc.risk_review",ent:"forecast_entry",met:"m_grc_risk_app",plan:"Monitor monthly renewals against the forecast; trigger the reserve review at 5% below plan.",due:iso(90),kri:{n:"Renewal rate vs plan",v:-2,th:-5,u:"%"},desc:"Renewals fund about 61% of operating cost."}),
 ER("GR-107","Loss of key platform engineers","People","Joanna Pierce","Grace Whitfield",3,3,2,3,"Open",{ctl:[],proc:"grc.risk_review",ent:"person",met:"m_grc_risk_app",plan:"Cross-train two engineers on the search stack and document runbooks.",due:iso(75),desc:"Three engineers hold most of the platform knowledge."}),
 ER("GR-108","Cloud spend exceeds the hosting commitment","Financial","Sam Patel","Avery Chen",3,3,3,3,"Open",{ctl:["GC-209"],proc:"grc.risk_review",ent:"forecast_entry",met:"m_grc_risk_app",vend:"NWC",plan:"Autoscale rule with a spend alert at 90% of commitment.",due:iso(40),desc:"Tier change CHG0312 adds $48,000 a year."}),
 ER("GR-109","An AI agent acts outside its guardrails","AI","Kenji Watanabe","Theo Marlowe",3,4,2,4,"Treating",{ctl:["GC-212","GL-011","GL-012","GL-014"],proc:"grc.control_test",ent:"agent",met:"m_grc_ctl_cov",plan:"Quarterly guardrail tests and a kill-switch drill with every new agent.",due:iso(33),desc:"Agents can file records and draft approvals."}),
 ER("GR-110","Retention schedule not applied to expired contracts","Regulatory","Theo Marlowe","Camille Ortega",3,3,3,3,"Open",{ctl:["GC-213"],proc:"grc.policy_review",ent:"contract",met:"m_grc_pol_ack",plan:"Apply the schedule at contract close and report quarterly.",due:iso(80),desc:"Contract Repository holds records past their retention date."}),
 ER("GR-111","Platform restore never proven end to end","Operational","Sam Patel","Ben Ito",4,4,3,4,"Treating",{ctl:["GC-203","GC-214"],proc:"grc.control_test",ent:"business_service",met:"m_grc_ctl_cov",proj:"PR3",svc:"Standards Platform",plan:"Restore rehearsal on Oct 24 during the failover test.",due:iso(14),exc:"EXC-104",desc:"Backups run nightly but a full restore was last verified 14 months ago."}),
 ER("GR-112","Contract Repository vendor ends support","Vendor","Maya Ortiz","Jordan Lee",4,3,3,3,"Accepted",{ctl:["GC-206"],proc:"grc.exception_approval",ent:"contract",met:"m_grc_exc_exp",proj:"PR4",vend:"LGD",plan:"Accept until the replacement platform goes live (PR4); review monthly.",due:iso(170),exc:"EXC-103",desc:"LegacyDocs support ends Mar 31 2027."})];
X.risks.forEach(r=>{r.cat=r.cat||"Operational"});
hydrate("raid_item",X.risks);

/* ---------- unify: enterprise risks plus project risks (RK) plus RAID risks, one scale ---------- */
const lOfP=p=>Math.max(1,Math.min(5,Math.ceil((+p||0)/0.2)));
const iOfAmt=a=>a>=500?5:a>=250?4:a>=100?3:a>=50?2:1;
X.allRisks=function(){
 const out=X.risks.map(r=>Object.assign({},r,{inh:X.score(r.il,r.ii),res:X.score(r.rl,r.ri),own_:r.own}));
 arr(G(()=>EXE.E.risks,[])).filter(r=>r.st!=="Closed").forEach(r=>out.push({id:r.id,t:r.n,cat:"Project",own:r.own,bak:G(()=>OBK(r.own),""),il:lOfP(r.p),ii:iOfAmt(r.amt),rl:lOfP(r.p),ri:iOfAmt(r.amt),st:r.st,src:"Project risk",ctl:[],proc:"",ent:"",met:"m_riskexp",proj:r.proj,vend:"",svc:"",kri:null,plan:r.plan,due:iso(30),rev:iso(-10),exc:"",desc:"$"+r.amt+"K exposure at "+Math.round(r.p*100)+"% likelihood.",inh:X.score(lOfP(r.p),iOfAmt(r.amt)),res:X.score(lOfP(r.p),iOfAmt(r.amt)),ro:1}));
 arr(G(()=>PPMRAID,[])).filter(r=>r.t==="R"&&r.s!=="closed").forEach(r=>out.push({id:r.id,t:r.n,cat:"Project",own:r.own,bak:G(()=>OBK(r.own),""),il:r.pr,ii:r.im,rl:r.pr,ri:r.im,st:r.s==="active"?"Treating":"Open",src:"Project RAID",ctl:[],proc:"",ent:"",met:"m_riskexp",proj:r.p,vend:"",svc:"",kri:null,plan:r.mit,due:r.due,rev:iso(-7),exc:"",desc:r.d,inh:X.score(r.pr,r.im),res:X.score(r.pr,r.im),ro:1}));
 return out};
function OBK(name){const d=G(()=>ORGX.person&&ORGX.person(name),null);const dm=G(()=>ORGX.domainView("delivery"),null);return dm&&dm.backup&&dm.backup.name!==name?dm.backup.name:"Maya Ortiz"}
X.riskById=id=>X.allRisks().find(r=>r.id===id)||null;
X.aboveAppetite=r=>(X.APPETITE[r.cat]!=null)&&r.res>X.APPETITE[r.cat]&&r.st!=="Accepted"&&r.st!=="Closed";

/* ---------- controls: the existing library (adm_audit) plus internal controls, one list ---------- */
const CT=(id,t,fw,maps,own,bak,freq,last,res,ev,o)=>Object.assign({id,ref:id,t,fw,maps,own,bak,freq,last,res,ev:ev||[],risks:[],proc:"",met:"m_grc_ctl_cov",ent:"",pol:"",src:"Internal",st:"Active"},o);
const NEW=[
 CT("GC-201","Privileged access reviewed every quarter","Internal policy",["NIST CSF: Protect","ISO 27001: Access control","SOC 2: Logical access"],"Colette Brandt","Rina Okafor","Quarterly",iso(-85),"Exceptions noted",[["Q2 privileged access export","scr:adm_sec"]],{risks:["GR-101"],pol:"POL-003",ent:"role_assignment"}),
 CT("GC-202","Critical vulnerabilities patched within 14 days","NIST CSF",["NIST CSF: Protect","ISO 27001: Technical vulnerability management"],"Sam Patel","Ben Ito","Monthly",iso(-40),"Exceptions noted",[["Vulnerability report September","m_grc_ctl_cov"]],{risks:["GR-101"],pol:"POL-001",ent:"config_item"}),
 CT("GC-203","Offsite backups restored and verified","ISO 27001",["ISO 27001: Backup","NIST CSF: Recover","SOC 2: Availability"],"Sam Patel","Ben Ito","Semiannual",iso(-430),"Not tested",[],{risks:["GR-101","GR-111"],pol:"POL-006",ent:"business_service",proc:"grc.control_test"}),
 CT("GC-204","Member data stores encrypted at rest","ISO 27001",["ISO 27001: Cryptography","SOC 2: Confidentiality"],"Aaron Whitfield","Rina Kovacs","Annual",iso(-120),"Effective",[["Encryption configuration review","scr:adm_sec"]],{risks:["GR-102"],pol:"POL-001",ent:"config_item"}),
 CT("GC-205","Personal data inventory kept current","Internal policy",["Internal policy: Data classification","ISO 27001: Information classification"],"Theo Marlowe","Rosa Delgado","Semiannual",iso(-200),"Needs retest",[],{risks:["GR-102"],pol:"POL-008",ent:"data_asset"}),
 CT("GC-206","Vendor security assessment before onboarding and renewal","Internal policy",["Internal policy: Vendor management","ISO 27001: Supplier relationships","SOC 2: Vendor management"],"Camille Ortega","Avery Chen","Annual",iso(-60),"Exceptions noted",[["Cobalt assessment","CBL"]],{risks:["GR-103","GR-112"],pol:"POL-005",ent:"core_company",proc:"grc.vendor_assessment"}),
 CT("GC-207","Conflict-of-interest declarations collected from committee members","Internal policy",["Internal policy: Conflict of interest"],"Theo Marlowe","Elena Marsh","Annual",iso(-300),"Exceptions noted",[],{risks:["GR-104"],pol:"POL-009",ent:"attestation",proc:"grc.attestation"}),
 CT("GC-208","Antitrust briefing before each technical committee ballot","Internal policy",["Internal policy: Antitrust"],"Theo Marlowe","Elena Marsh","Quarterly",iso(-52),"Ineffective",[["August ballot minutes","scr:meet_hub"]],{risks:["GR-104","GR-105"],pol:"POL-009",ent:"meeting_note"}),
 CT("GC-209","Three-way match on vendor invoices","SOC 2",["SOC 2: Processing integrity","Internal policy: Financial controls"],"Noelle Park","Avery Chen","Monthly",iso(-25),"Effective",[["Invoice approval queue","scr:inv"]],{risks:["GR-106","GR-108"],pol:"POL-005",ent:"invoice"}),
 CT("GC-210","Segregation of duties in purchase approvals","SOC 2",["SOC 2: Control environment","Internal policy: Financial controls"],"Avery Chen","Marcus Reid","Quarterly",iso(-70),"Exceptions noted",[["PO approval rules","scr:bud_ven"]],{risks:["GR-106"],ent:"purchase_order"}),
 CT("GC-211","Production change approved before release","SOC 2",["SOC 2: Change management","ISO 27001: Change management","NIST CSF: Protect"],"Nia Brooks","Hollis Grey","Monthly",iso(-12),"Effective",[["CHG0312","CHG0312"],["CHG0311","CHG0311"]],{risks:[],pol:"POL-001",ent:"change_request",proc:"grc.control_test"}),
 CT("GC-212","AI agent guardrails tested every quarter","NIST CSF",["NIST CSF: Govern","Internal policy: AI use"],"Kenji Watanabe","Aaron Whitfield","Quarterly",iso(-118),"Needs retest",[["Red-team run","scr:adm_gate"]],{risks:["GR-109"],pol:"POL-007",ent:"agent"}),
 CT("GC-213","Retention schedule applied at contract close","Internal policy",["Internal policy: Records retention"],"Theo Marlowe","Camille Ortega","Annual",iso(-380),"Not tested",[],{risks:["GR-110"],pol:"POL-004",ent:"contract"}),
 CT("GC-214","Incident response plan exercised","NIST CSF",["NIST CSF: Respond","ISO 27001: Incident management","SOC 2: Incident response"],"Tom Becker","Priti Joshi","Annual",iso(-190),"Effective",[["INC0412 post-incident review","INC0412"]],{risks:["GR-111"],pol:"POL-006",ent:"incident"})];
const FWMAP={"SOC 2":"SOC 2","ISO 27001":"ISO 27001","NIST AI RMF":"NIST CSF"};
const ADM_EXTRA={ // freq, last test, result, backup, process, risk links for the 15 existing library controls
 "GL-001":["Quarterly",iso(-30),"Effective","Rina Okafor",["GR-101"]],"GL-002":["Quarterly",iso(-30),"Effective","Rina Okafor",[]],"GL-003":["Quarterly",iso(-90),"Exceptions noted","Rina Okafor",["GR-101"]],
 "GL-004":["Quarterly",iso(-30),"Effective","Priti Joshi",["GR-101"]],"GL-005":["Monthly",iso(-12),"Effective","Hollis Grey",[]],"GL-006":["Annual",iso(-60),"Effective","Rina Okafor",[]],
 "GL-007":["Quarterly",iso(-9),"Effective","Rina Okafor",[]],"GL-008":["Annual",iso(-400),"Not tested","Theo Marlowe",["GR-102"]],"GL-009":["Quarterly",iso(-30),"Effective","Priti Joshi",[]],
 "GL-010":["Monthly",iso(-12),"Effective","Hollis Grey",[]],"GL-011":["Annual",iso(-20),"Effective","Theo Marlowe",["GR-109"]],"GL-012":["Quarterly",iso(-129),"Needs retest","Rina Okafor",["GR-109"]],
 "GL-013":["Quarterly",iso(-30),"Effective","Theo Marlowe",[]],"GL-014":["Annual",iso(-7),"Effective","Aaron Whitfield",["GR-109"]],"GL-015":["Quarterly",iso(-400),"Not tested","Theo Marlowe",[]]};
X.controls=[];
function buildControls(){
 if(X.controls.length)return;
 arr(G(()=>S.adm.ctl,[])).forEach(c=>{const lid="GL-"+String(c.id.slice(1)).padStart(3,"0");const x=ADM_EXTRA[lid]||["Annual",iso(-60),"Effective","Rina Okafor",[]];const fix=OB[c.own];
  const own=humans().includes(c.own)?c.own:(fix?fix[0]:"Rina Okafor");let bak=x[3];if(bak===own)bak="Theo Marlowe";
  X.controls.push(CT(lid,c.t,FWMAP[c.fw]||c.fw,[(FWMAP[c.fw]||c.fw)+": "+c.ref],own,bak,x[0],x[1],x[2],arr(c.items).map(it=>[it,"scr:"+c.go]),{ref:c.fw+" "+c.ref,risks:x[4],src:"Control library",admEv:c.ev,met:"m_ctrl",proc:"",go:c.go}))});
 NEW.forEach(c=>X.controls.push(c));
 X.controls.forEach(c=>{if(c.own===c.bak)c.bak="Theo Marlowe"});
 hydrate("control",X.controls)}
X.ctl=()=>{buildControls();return X.controls};
X.ctlById=id=>X.ctl().find(c=>c.id===id)||null;
X.nextDue=c=>{const f={Monthly:30,Quarterly:91,Semiannual:182,Annual:365}[c.freq]||365;return iso(days(c.last)+f)};
X.tested=c=>c.res!=="Not tested";
X.testCurrent=c=>X.tested(c)&&days(X.nextDue(c))>=0;

/* ---------- test cycle and attestation ---------- */
X.cycles=[{id:"TC-2026Q3",name:"Q3 2026 control test cycle",start:iso(-100),end:iso(-10),st:"Closed"},{id:"TC-2026Q4",name:"Q4 2026 control test cycle",start:iso(-9),end:iso(52),st:"In progress"}];
const TS=(c,tester,due,st,res,notes)=>({id:"TST-Q4-"+c,ctl:c,cycle:"TC-2026Q4",tester,due,st,res:res||"",notes:notes||"",ev:[]});
X.tests=[
 TS("GL-001","Aaron Whitfield",iso(10),"In testing"),TS("GL-003","Aaron Whitfield",iso(5),"Evidence requested","","Waiting on the Q3 access review export"),TS("GL-004","Priti Joshi",iso(14),"Passed","Effective","Audit log export sampled; no gaps"),
 TS("GL-005","Hollis Grey",iso(12),"Passed","Effective","Ten of ten sampled changes had approval before release"),TS("GL-008","Theo Marlowe",iso(20),"Not started"),TS("GL-012","Aaron Whitfield",iso(8),"Evidence requested","","Red-team report older than 120 days"),
 TS("GL-015","Theo Marlowe",iso(22),"Not started"),TS("GC-201","Rina Okafor",iso(9),"In testing"),TS("GC-202","Ben Ito",iso(11),"In testing"),TS("GC-203","Ben Ito",iso(14),"Failed","Ineffective","No restore verified in the last 12 months (FND-104)"),
 TS("GC-205","Rosa Delgado",iso(18),"Not started"),TS("GC-206","Avery Chen",iso(16),"In testing"),TS("GC-207","Elena Marsh",iso(7),"Evidence requested","","Four declarations missing"),TS("GC-208","Elena Marsh",iso(6),"Failed","Ineffective","August ballot had no briefing (FND-107)"),
 TS("GC-212","Aaron Whitfield",iso(19),"Not started"),TS("GC-213","Camille Ortega",iso(25),"Not started"),TS("GC-209","Noelle Park",iso(13),"Passed","Effective","Three-way match on 40 of 40 invoices")];
X.tests.forEach(t=>{const c=G(()=>X.ctlById(t.ctl),null);if(c&&t.st==="Passed"){t.ev=[["Sample workpaper",c.ev[0]?c.ev[0][1]:"scr:adm_audit"]]}});
hydrate("control_test",X.tests);
X.attCycles=[{id:"ATT-2026Q3",name:"Q3 control owner attestation",due:iso(-12),st:"Closed"},{id:"ATT-2026Q4",name:"Q4 control owner attestation",due:iso(21),st:"Open"}];
X.att=[];
function buildAtt(){if(X.att.length)return;const by={};X.ctl().forEach(c=>{(by[c.own]=by[c.own]||[]).push(c.id)});
 Object.keys(by).sort().forEach((p,i)=>{const done=i%3!==0,over=!done&&i%2===0;X.att.push({id:"ATT-Q4-"+String(i+1).padStart(2,"0"),cycle:"ATT-2026Q4",person:p,ctls:by[p],st:done?"Attested":over?"Overdue":"Pending",at:done?iso(-(i%8)-1):"",note:""})});
 hydrate("attestation",X.att)}
X.attList=()=>{buildAtt();return X.att};
X.attRate=()=>{const l=X.attList();return l.length?Math.round(100*l.filter(a=>a.st==="Attested").length/l.length):0};

/* ---------- findings ---------- */
const FN=(id,t,src,sref,sev,own,bak,due,st,o)=>Object.assign({id,t,src,sref,sev,own,bak,due,st,ctl:"",risk:"",vend:"",steps:[],opened:iso(-30),debt:"",desc:""},o);
const SP=(n,own,due,done)=>({n,own,due,done:!!done});
X.findings=[
 FN("FND-101","Q2 access review missed three contractor accounts","Control test","GL-003","High","Colette Brandt","Rina Okafor",iso(-10),"In remediation",{ctl:"GL-003",risk:"GR-101",opened:iso(-70),desc:"Contractors added after the review snapshot were never reviewed.",steps:[SP("Review the three accounts","Colette Brandt",iso(-20),true),SP("Add contractors to the review scope","Colette Brandt",iso(-5),false),SP("Re-run the review and attach the export","Rina Okafor",iso(10),false)]}),
 FN("FND-102","No evidence that sensitivity labels block data leakage","Audit","AUD-2026-04","Medium","Avery Chen","Theo Marlowe",iso(36),"Plan approved",{ctl:"GL-008",risk:"GR-102",opened:iso(-14),desc:"Labels exist but no monthly export is kept as evidence.",steps:[SP("Export label coverage monthly","Avery Chen",iso(20),false),SP("Link the export as control evidence","Avery Chen",iso(30),false)]}),
 FN("FND-103","Red-team evidence is older than 120 days","Control test","GL-012","Medium","Aaron Whitfield","Rina Okafor",iso(10),"In remediation",{ctl:"GL-012",risk:"GR-109",opened:iso(-18),steps:[SP("Run the red-team set","Aaron Whitfield",iso(7),false),SP("Attach the report","Aaron Whitfield",iso(10),false)]}),
 FN("FND-104","Backup restore not verified in the last 12 months","Control test","GC-203","High","Sam Patel","Ben Ito",iso(14),"In remediation",{ctl:"GC-203",risk:"GR-111",opened:iso(-9),debt:"yes",desc:"Nightly backups run; a full restore was last proven 14 months ago.",steps:[SP("Schedule restore with the failover rehearsal","Sam Patel",iso(-2),true),SP("Restore the search index and editor workspace","Ben Ito",iso(14),false),SP("Record the result as control evidence","Sam Patel",iso(16),false)]}),
 FN("FND-105","Two vendors onboarded before a security assessment","Audit","AUD-2026-03","High","Camille Ortega","Avery Chen",iso(-5),"Open",{ctl:"GC-206",risk:"GR-103",vend:"BRT",opened:iso(-45),debt:"yes",desc:"Brightline Staffing and Apex Print started work without a recorded assessment.",steps:[SP("Assess Brightline Staffing","Camille Ortega",iso(-5),false),SP("Assess Apex Print","Camille Ortega",iso(15),false)]}),
 FN("FND-106","Four purchase orders approved by their requester","Audit","AUD-2026-03","Medium","Avery Chen","Marcus Reid",iso(51),"Plan approved",{ctl:"GC-210",opened:iso(-21),steps:[SP("Add a block on self-approval","Avery Chen",iso(40),false)]}),
 FN("FND-107","August ballot held without the antitrust briefing","Self-identified","GC-208","High","Theo Marlowe","Elena Marsh",iso(5),"In remediation",{ctl:"GC-208",risk:"GR-105",opened:iso(-30),debt:"yes",steps:[SP("Brief the chair and file the record","Theo Marlowe",iso(1),true),SP("Add the briefing to the ballot checklist","Elena Marsh",iso(5),false)]}),
 FN("FND-108","Retention schedule not applied to expired contracts","Control test","GC-213","Low","Theo Marlowe","Camille Ortega",iso(66),"Open",{ctl:"GC-213",risk:"GR-110",opened:iso(-4),steps:[]}),
 FN("FND-109","Service accounts without multi-factor sign-in","Audit","AUD-2026-01","Medium","Colette Brandt","Rina Okafor",iso(2),"Ready to validate",{ctl:"GL-001",risk:"GR-101",opened:iso(-50),steps:[SP("Move accounts to managed identities","Colette Brandt",iso(-3),true),SP("Document the exception for the remaining two","Colette Brandt",iso(-1),true)],desc:"Exception EXC-102 covers two legacy accounts until Oct 20."}),
 FN("FND-110","LegacyDocs has no documented exit plan","Third-party review","LGD","Medium","Maya Ortiz","Jordan Lee",iso(41),"Plan approved",{vend:"LGD",risk:"GR-112",opened:iso(-12),steps:[SP("Document data export format","Jordan Lee",iso(25),false),SP("Agree exit support terms","Maya Ortiz",iso(40),false)]}),
 FN("FND-099","Audit log retention below policy","Audit","AUD-2026-01","Low","Tom Becker","Priti Joshi",iso(-60),"Closed",{ctl:"GL-004",opened:iso(-120),steps:[SP("Extend retention to 7 years","Tom Becker",iso(-70),true)]})];
hydrate("finding",X.findings);
X.open=f=>f.st!=="Closed";
X.overdue=f=>X.open(f)&&days(f.due)<0;

/* ---------- policies ---------- */
const PV=(v,date,by,change,st)=>({v,date,by,change,st});
const PL=(id,t,own,bak,cycle,aud,req,done,vers,o)=>Object.assign({id,t,own,bak,cycle,aud,req,done,vers,ctl:[],fw:[],ack:{due:"",campaign:""},me:false},o);
X.policies=[
 PL("POL-001","Information security policy","Rina Okafor","Aaron Whitfield",12,"All staff",45,41,[PV("4.2",iso(-120),"Rina Okafor","Added AI tools clause","Published"),PV("4.1",iso(-480),"Rina Okafor","Annual review","Retired")],{ctl:["GL-001","GC-202","GC-204"],fw:["ISO 27001","SOC 2","NIST CSF"],ack:{due:iso(-60),campaign:"Annual 2026"},nextRev:iso(245)}),
 PL("POL-002","Acceptable use policy","Rina Okafor","Colette Brandt",12,"All staff",45,45,[PV("3.1",iso(-200),"Rina Okafor","Personal device section","Published")],{ctl:["GL-006"],fw:["ISO 27001"],ack:{due:iso(-100),campaign:"Annual 2026"},nextRev:iso(165)}),
 PL("POL-003","Access control standard","Colette Brandt","Rina Okafor",12,"Engineering and IT",18,15,[PV("2.5",iso(-8),"Colette Brandt","Draft: quarterly privileged review","In review"),PV("2.4",iso(-300),"Colette Brandt","MFA for all admins","Published")],{ctl:["GL-001","GL-003","GC-201"],fw:["ISO 27001","SOC 2","NIST CSF"],ack:{due:iso(20),campaign:"Q4 2026"},nextRev:iso(-5)}),
 PL("POL-004","Records retention schedule","Theo Marlowe","Camille Ortega",24,"All staff",45,33,[PV("5.0",iso(-90),"Theo Marlowe","Seven-year hold for audit records","Published")],{ctl:["GC-213","GL-004"],fw:["Internal policy"],ack:{due:iso(14),campaign:"Q4 2026"},nextRev:iso(640)}),
 PL("POL-005","Vendor management policy","Camille Ortega","Avery Chen",12,"Procurement and owners",14,12,[PV("2.0",iso(-150),"Camille Ortega","Tiered assessments","Published")],{ctl:["GC-206","GC-209","GC-210"],fw:["SOC 2","ISO 27001"],ack:{due:iso(-20),campaign:"Annual 2026"},nextRev:iso(215)}),
 PL("POL-006","Incident response policy","Tom Becker","Priti Joshi",12,"Operations",16,16,[PV("3.3",iso(-240),"Tom Becker","Major incident roles","Published")],{ctl:["GC-214","GC-203"],fw:["NIST CSF","ISO 27001"],ack:{due:iso(-90),campaign:"Annual 2026"},nextRev:iso(125)}),
 PL("POL-007","AI use policy","Kenji Watanabe","Aaron Whitfield",6,"All staff",45,29,[PV("1.5",iso(-3),"Kenji Watanabe","Draft: external model pilots","Draft"),PV("1.4",iso(-110),"Kenji Watanabe","Agent sponsor duties","Published")],{ctl:["GC-212","GL-011","GL-012"],fw:["NIST CSF","Internal policy"],ack:{due:iso(30),campaign:"Q4 2026"},nextRev:iso(70)}),
 PL("POL-008","Data classification standard","Theo Marlowe","Rosa Delgado",12,"All staff",45,38,[PV("2.2",iso(-170),"Theo Marlowe","Personal data class","Published")],{ctl:["GC-205","GL-008"],fw:["ISO 27001","Internal policy"],ack:{due:iso(-30),campaign:"Annual 2026"},nextRev:iso(195)}),
 PL("POL-009","Conflict of interest and antitrust policy","Theo Marlowe","Elena Marsh",12,"Committee members and staff",82,78,[PV("6.1",iso(-330),"Theo Marlowe","Recusal procedure","Published")],{ctl:["GC-207","GC-208"],fw:["Internal policy"],ack:{due:iso(10),campaign:"Annual 2026"},nextRev:iso(35)})];
hydrate("policy",X.policies);
X.polAckRate=p=>p.req?Math.round(100*p.done/p.req):100;
X.polDue=p=>days(p.nextRev)<=30;

/* ---------- audits ---------- */
const RQ=(id,t,own,due,st,ev)=>({id,t,own,due,st,ev:ev||[]});
X.audits=[
 {id:"AUD-2026-01",t:"SOC 2 Type II examination",kind:"External",firm:"Northgate Assurance",lead:"Rina Okafor",bak:"Aaron Whitfield",period:"Jan 1 to Sep 30, 2026",st:"Fieldwork",start:iso(-35),report:iso(48),fw:"SOC 2",ctl:["GL-001","GL-003","GL-004","GL-005","GL-009"],
  reqs:[RQ("PBC-101","Access review evidence, Q1 to Q3","Colette Brandt",iso(-3),"Overdue",[]),RQ("PBC-102","Audit log export and retention settings","Priti Joshi",iso(4),"Provided",[["Audit log export","scr:adm_audit"]]),RQ("PBC-103","Change approvals for 25 sampled releases","Nia Brooks",iso(6),"Provided",[["CHG0312","CHG0312"],["CHG0311","CHG0311"]]),RQ("PBC-104","Role matrix and conditional access policy","Colette Brandt",iso(9),"Open",[]),RQ("PBC-105","Incident records for Sev 1 and Sev 2","Tom Becker",iso(12),"Accepted",[["INC0412","INC0412"]]),RQ("PBC-106","Vendor assessments for critical vendors","Camille Ortega",iso(15),"Open",[])]},
 {id:"AUD-2026-02",t:"Annual financial statement audit",kind:"External",firm:"Harbor Row LLP",lead:"Marcus Reid",bak:"Avery Chen",period:"Fiscal 2026",st:"Planning",start:iso(20),report:iso(110),fw:"Internal policy",ctl:["GC-209","GC-210"],
  reqs:[RQ("PBC-201","Trial balance and subledger reconciliations","Avery Chen",iso(30),"Open",[]),RQ("PBC-202","Purchase orders over $50,000","Noelle Park",iso(34),"Open",[["PO-77120","PO-77120"]]),RQ("PBC-203","Lease subledger roll-forward","Avery Chen",iso(38),"Open",[])]},
 {id:"AUD-2026-03",t:"Internal audit: vendor payments and three-way match",kind:"Internal",firm:"Internal audit",lead:"Avery Chen",bak:"Theo Marlowe",period:"Jan 1 to Aug 31, 2026",st:"Reporting",start:iso(-60),report:iso(12),fw:"Internal policy",ctl:["GC-209","GC-210","GC-206"],
  reqs:[RQ("PBC-301","Invoices without a matching receipt","Noelle Park",iso(-20),"Accepted",[["Invoice approval queue","scr:inv"]]),RQ("PBC-302","Vendor onboarding records","Camille Ortega",iso(-10),"Accepted",[["BRT","BRT"]])]},
 {id:"AUD-2026-04",t:"ISO 27001 surveillance audit",kind:"External",firm:"Northgate Assurance",lead:"Rina Okafor",bak:"Aaron Whitfield",period:"Certification year 2",st:"Planning",start:iso(35),report:iso(75),fw:"ISO 27001",ctl:["GL-006","GL-007","GL-008","GL-009","GL-010"],
  reqs:[RQ("PBC-401","Statement of applicability","Rina Okafor",iso(30),"Open",[]),RQ("PBC-402","Internal audit report","Avery Chen",iso(32),"Open",[["AUD-2026-03","AUD-2026-03"]])]}];
hydrate("audit_engagement",X.audits);
X.reqOpen=r=>r.st==="Open"||r.st==="Overdue";

/* ---------- third-party risk ---------- */
const VI=(id,tier,inh,last,score,dom,findings,o)=>Object.assign({id,tier,inh,last,score,dom,findings:findings||[],data:"",note:""},o);
X.vendors={
 LUM:VI("LUM",1,"High",iso(-190),71,{Security:78,Privacy:70,Financial:64,Continuity:62,Compliance:80},[],{data:"Taxonomy and search index content",contracts:["CT-103","CT-104"],lines:["PR1-VEN","PR2-VEN"]}),
 NWC:VI("NWC",1,"High",iso(-150),84,{Security:88,Privacy:82,Financial:90,Continuity:84,Compliance:78},[],{data:"Hosting for the Standards Portal",contracts:["CT-101","CT-102"],lines:["PR1-CLD","RB-IT-HOST"]}),
 MSF:VI("MSF",1,"Medium",iso(-95),90,{Security:94,Privacy:90,Financial:92,Continuity:88,Compliance:86},[],{data:"Identity, mail and productivity",contracts:["CT-105"],lines:["RB-IT-PLAT"]}),
 CBL:VI("CBL",2,"Medium",iso(-330),76,{Security:86,Privacy:70,Financial:68,Continuity:72,Compliance:80},[],{data:"Penetration test findings",contracts:["CT-107"],lines:["RB-SEC"]}),
 BRT:VI("BRT",2,"Medium",iso(-420),58,{Security:55,Privacy:60,Financial:62,Continuity:54,Compliance:60},["FND-105"],{data:"Contract engineers with system access",contracts:["CT-108"],lines:["RB-IT-STAFF"]}),
 LGD:VI("LGD",2,"High",iso(-250),63,{Security:70,Privacy:66,Financial:44,Continuity:60,Compliance:74},["FND-110"],{data:"Contract Repository and records",contracts:["CT-109"],lines:["RB-LEGAL-REPO"]}),
 APX:VI("APX",3,"Low",null,0,{},["FND-105"],{data:"Printed board packs",contracts:["CT-106"],lines:["RB-OPS-PRINT"]})};
X.vendorInfo=id=>{const v=X.vendors[id];if(!v)return null;return Object.assign({},v,{last:v.last,findings:v.findings})};
X.TIER_FREQ={1:12,2:18,3:36};
X.vAssessDue=v=>v.last?iso(days(v.last)+Math.round(X.TIER_FREQ[v.tier]*30.4)):iso(-1);
X.vStatus=v=>{if(!v.last)return["bad","Not assessed"];const d=days(X.vAssessDue(v));return d<0?["bad","Overdue"]:d<=60?["warn","Due in "+d+" days"]:["good","Current"]};
Object.keys(X.vendors).forEach(id=>hydrate("assessment",[X.vendors[id]]));

/* ---------- exceptions and acceptances ---------- */
const EX=(id,t,kind,ref,req,own,bak,appr,exp,st,o)=>Object.assign({id,t,kind,ref,req,own,bak,appr,exp,st,why:"",comp:"",debt:"",risk:"",ctl:"",opened:iso(-30)},o);
X.exceptions=[
 EX("EXC-101","Legacy Contract Repository signs in with a password only","Policy exception","POL-003","Maya Ortiz","Maya Ortiz","Jordan Lee","Rina Okafor",iso(66),"Approved",{why:"The repository vendor cannot support Entra ID sign-in until the replacement ships.",comp:"IP allow-list, 12-character passphrase, quarterly access review.",ctl:"GC-201",risk:"GR-112",opened:iso(-90)}),
 EX("EXC-102","Two service accounts without multi-factor sign-in","Control exception","GL-001","Colette Brandt","Colette Brandt","Rina Okafor","Rina Okafor",iso(10),"Approved",{why:"Legacy integration cannot present an MFA prompt.",comp:"Network restriction and 30-day password rotation.",ctl:"GL-001",risk:"GR-101",opened:iso(-50)}),
 EX("EXC-103","Accept the end-of-support risk for the Contract Repository","Risk acceptance","GR-112","Maya Ortiz","Maya Ortiz","Jordan Lee","Casey Rowan",iso(172),"Requested",{why:"Replacement platform goes live in PR4; early migration costs more than the residual risk.",comp:"Monthly vendor health check, escrow agreement.",risk:"GR-112",opened:iso(-6)}),
 EX("EXC-104","Defer the restore test to the failover rehearsal on Oct 24","Control exception","GC-203","Sam Patel","Sam Patel","Ben Ito","Rina Okafor",iso(21),"Approved",{why:"One combined rehearsal avoids two production freezes.",comp:"Backup job alerts reviewed daily.",ctl:"GC-203",risk:"GR-111",opened:iso(-14)}),
 EX("EXC-105","Pilot an external model with member-free data","Policy exception","POL-007","Aaron Whitfield","Aaron Whitfield","Rina Kovacs","Kenji Watanabe",iso(113),"Requested",{why:"Evaluate a hosted model for taxonomy suggestions; no member or ballot data.",comp:"Prompt redaction, no retention, weekly review of outputs.",opened:iso(-3)}),
 EX("EXC-106","Litigation hold overrides the retention schedule","Policy exception","POL-004","Theo Marlowe","Theo Marlowe","Camille Ortega","Theo Marlowe",iso(-10),"Approved",{why:"Hold h1 (Lumen SOW-4 dispute) keeps contract and invoice records past retention.",comp:"Records tagged and excluded from deletion.",opened:iso(-150)}),
 EX("EXC-107","Onboard Brightline Staffing before the security assessment","Policy exception","POL-005","Nia Brooks","Nia Brooks","Camille Ortega","Rina Okafor",iso(-25),"Approved",{why:"Urgent contract engineers for PR1.",comp:"Read-only access until assessment completes.",opened:iso(-70),risk:"GR-103"}),
 EX("EXC-108","Skip the quarterly privileged access review for Q3","Control exception","GC-201","Colette Brandt","Colette Brandt","Rina Okafor","Rina Okafor",iso(-40),"Rejected",{why:"Team capacity.",comp:"None offered.",opened:iso(-45)})];
hydrate("exception",X.exceptions);
X.excState=e=>{if(e.st==="Rejected"||e.st==="Closed")return e.st;if(e.st==="Requested")return"Requested";const d=days(e.exp);return d<0?"Expired":d<=30?"Expiring":"Approved"};
X.excOpen=e=>["Requested","Approved","Expiring","Expired"].includes(X.excState(e));

/* ---------- metrics (computed from the live registers) ---------- */
X.stats=function(){
 const rs=X.allRisks(),cs=X.ctl(),fs=X.findings;
 const above=rs.filter(X.aboveAppetite).length;
 const inScope=cs.filter(c=>c.st==="Active");
 const covered=inScope.filter(c=>c.own&&c.bak&&c.maps.length&&X.testCurrent(c)).length;
 const od=fs.filter(X.overdue).length,openF=fs.filter(X.open).length;
 const exp30=X.exceptions.filter(e=>["Expiring","Expired"].includes(X.excState(e))).length;
 const ven1=Object.values(X.vendors).filter(v=>v.tier===1),ven1ok=ven1.filter(v=>v.last&&days(X.vAssessDue(v))>=0).length;
 const ack=Math.round(100*X.policies.reduce((a,p)=>a+p.done,0)/Math.max(1,X.policies.reduce((a,p)=>a+p.req,0)));
 const ct=X.tests,done=ct.filter(t=>t.st==="Passed"||t.st==="Failed").length;
 return{risks:rs.length,above,ctl:inScope.length,covered,cov:Math.round(100*covered/Math.max(1,inScope.length)),openF,od,att:X.attRate(),exp30,ven1:ven1.length,ven1ok,ven1pct:Math.round(100*ven1ok/Math.max(1,ven1.length)),ack,tests:ct.length,testsDone:done,pol:X.policies.length,polDue:X.policies.filter(X.polDue).length,aud:X.audits.length,reqOpen:X.audits.reduce((n,a)=>n+a.reqs.filter(X.reqOpen).length,0)}};
const mk=(n,f,u,cur,tgt,badAt,dir,tr,owner,use,rem)=>({n,f,u,cur,tgt,badAt,dir,max:u==="%"?100:30,tr,owner,use,rem});
Object.assign(METRICS,{
 m_grc_ctl_cov:mk("Control coverage","Controls in scope that have a named owner and backup, a framework mapping and a current test ÷ Controls in scope","%",0,85,60,"max",[48,52,55,58,61,64,66,69],"Rina Okafor",["Controls and testing","GRC overview"],{kind:"sop",ref:"SOP-481",title:"Schedule the overdue control tests",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Lists controls past their test date by owner"}),
 m_grc_find_od:mk("Overdue findings","Open findings with a due date before today","",0,0,3,"min",[1,1,2,2,3,2,3,3],"Theo Marlowe",["Issues and findings","GRC overview"],{kind:"sop",ref:"SOP-482",title:"Escalate an overdue finding",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Drafts the escalation to the owner's backup"}),
 m_grc_att_rate:mk("Attestation completion","Control owners who attested this cycle ÷ Control owners in the cycle","%",0,100,60,"max",[40,48,50,55,57,60,62,64],"Theo Marlowe",["Controls and testing","GRC overview"],{kind:"sop",ref:"SOP-483",title:"Chase an attestation",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Sends a reminder to each pending owner"}),
 m_grc_risk_app:mk("Risks above appetite","Risks whose residual score is above the appetite for their category","",0,0,4,"min",[3,4,5,5,6,6,5,5],"Rina Okafor",["Risk register","GRC overview"],{kind:"sop",ref:"SOP-484",title:"Treat a risk above appetite",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Proposes treatments from linked controls"}),
 m_grc_exc_exp:mk("Exceptions expiring or expired","Approved exceptions that expire within 30 days or already expired","",0,0,2,"min",[1,1,1,2,2,2,3,3],"Theo Marlowe",["Exceptions and acceptances","GRC overview"],{kind:"sop",ref:"SOP-485",title:"Renew or close an exception",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Lists exceptions by expiry date and approver"}),
 m_grc_ven_t1:mk("Tier 1 vendors with a current assessment","Tier 1 vendors assessed within 12 months ÷ Tier 1 vendors","%",0,100,70,"max",[50,50,67,67,67,67,100,100],"Camille Ortega",["Third-party risk","GRC overview"],{kind:"sop",ref:"SOP-486",title:"Assess a vendor before renewal",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Pre-fills the assessment from the contract"}),
 m_grc_pol_ack:mk("Policy acknowledgement rate","Acknowledgements received ÷ Acknowledgements required, across published policies","%",0,95,80,"max",[72,75,78,80,83,85,86,88],"Theo Marlowe",["Policies","GRC overview"],{kind:"sop",ref:"SOP-487",title:"Close an acknowledgement campaign",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Reminds people who have not acknowledged"}),
 m_grc_audit_req:mk("Audit requests on time","Audit requests provided or accepted on or before their due date ÷ Requests due so far","%",0,95,75,"max",[70,72,75,78,80,80,82,83],"Avery Chen",["Audit management"],{kind:"sop",ref:"SOP-488",title:"Clear an overdue audit request",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Finds evidence records already linked to the control"})});
X.syncMetrics=function(){const s=X.stats();const set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=v;m.tr=(m.tr||[]).slice(0,7).concat([v])};
 set("m_grc_ctl_cov",s.cov);set("m_grc_find_od",s.od);set("m_grc_att_rate",s.att);set("m_grc_risk_app",s.above);set("m_grc_exc_exp",s.exp30);set("m_grc_ven_t1",s.ven1pct);set("m_grc_pol_ack",s.ack);
 const due=X.audits.flatMap(a=>a.reqs).filter(r=>days(r.due)<=0||r.st==="Accepted"||r.st==="Provided");const ontime=due.filter(r=>r.st!=="Overdue"&&r.st!=="Open").length;set("m_grc_audit_req",due.length?Math.round(100*ontime/due.length):100);return s};
X.syncMetrics();
})();
