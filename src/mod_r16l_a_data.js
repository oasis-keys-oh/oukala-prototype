/* mod_r16l_a_data.js (Round 16, Agent L). Business continuity and disaster recovery: data layer, window.BCX.
   Framework (six dimensions, editable name), recovery tiers driven by CMDB criticality, applications, components (sites, equipment,
   CIs, data assets, roles, third parties), plans, exercises, obligations, traceability and metrics. State lives in S.bc.d and is kept
   by STORE.track("bc.d"). Nothing here calls heavy rebuilds; derived values are memoized on a version counter. */
(function(){
"use strict";
const G=(f,d)=>{try{const r=f();return r===undefined||r===null?d:r}catch(e){return d}};
const arr=x=>Array.isArray(x)?x:[];
const uniq=a=>[...new Set(a)];
const BX=window.BCX=window.BCX||{};
const TODAY=G(()=>GRCX.TODAY,"2026-10-10");
const iso=off=>{const d=new Date(TODAY+"T12:00:00");d.setDate(d.getDate()+off);return d.toISOString().slice(0,10)};
const days=s=>Math.round((new Date(s+"T12:00:00")-new Date(TODAY+"T12:00:00"))/864e5);
const dow=s=>new Date(s+"T12:00:00").getDay();
const addM=(s,m)=>{const d=new Date(s+"T12:00:00");d.setMonth(d.getMonth()+m);return d.toISOString().slice(0,10)};
const addD=(s,n)=>{const d=new Date(s+"T12:00:00");d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
BX.TODAY=TODAY;BX.iso=iso;BX.days=days;BX.dow=dow;BX.addM=addM;BX.addD=addD;
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
BX.date=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||""));return m?MON[+m[2]-1]+" "+(+m[3])+", "+m[1]:String(s||"-")};
BX.mins=m=>{m=+m;if(!isFinite(m))return"-";if(m===0)return"0 min";if(m<60)return m+" min";if(m<2880){const h=m/60;return(Math.round(h*10)/10)+" h"}return Math.round(m/1440*10)/10+" d"};

S.bc=S.bc||{d:null,ui:{}};
const UI=BX.ui=S.bc.ui;
let VER=1;BX.ver=()=>VER;BX.bump=()=>{VER++;_memo={};try{BX.save&&BX.save()}catch(e){}};
let _memo={};const memo=(k,f)=>{if(_memo[k]!==undefined&&_memo[k].v===VER)return _memo[k].r;const r=f();_memo[k]={v:VER,r};return r};

/* ------------------------------------------------------------------ framework ------------------------------------------------------------------ */
const LV=(a,b,c,d,e)=>[a,b,c,d,e];
const DIMS=()=>[
 {k:"B",key:"fac",letter:"B",n:"Buildings and facilities",tone:"--p4",target:3,scope:"Offices, data centers, colocation and cloud regions: where people work and where systems run.",
  q:["Which sites and regions does each Tier 1 and Tier 2 application depend on?","What is the plan if a site is unusable for 72 hours (fire, flood, access denied)?","Is there an alternate site or work-from-anywhere arrangement, and when was it last used?","Who can authorize closing and reopening a site, and how are staff accounted for?","Are physical access, lease and landlord obligations recorded and current?"],
  lv:LV("No list of sites; recovery is improvised.","Sites are listed with an owner.","Each site has an approved plan and an alternate.","Alternates are exercised on the tier schedule.","Site loss is rehearsed with measured recovery times and fed back to the lease and cloud strategy.")},
 {k:"E",key:"eqp",letter:"E",n:"Equipment: power, HVAC, plumbing, safety",tone:"--e4",target:3,scope:"Utilities and building systems that keep sites and server rooms running: UPS, generator, cooling, water, fire suppression, access control.",
  q:["Which equipment is a single point of failure for a Tier 1 site?","When was each system last load-tested or inspected, and by whom?","How long can the UPS and generator carry the critical load?","Do maintenance contracts commit to response times that fit the RTO?","Who is called when an alarm fires after hours?"],
  lv:LV("Equipment is unknown or unmaintained.","Inventory with owners and maintenance dates.","Annual tests are recorded and gaps have owners.","Tests are scheduled in change windows and results are traced to the applications they protect.","Redundancy (N+1 or better) is proven by live tests and monitored continuously.")},
 {k:"T",key:"tec",letter:"T",n:"Technology",tone:"--s3",target:3,scope:"Applications, servers, networks, cloud resources and the configuration items that make them up, with their recovery method.",
  q:["Does every CI in a Tier 1 and Tier 2 application have a recovery owner and a recovery method?","Which CIs are single points of failure?","Is infrastructure rebuilt from code, restored from image, or failed over, and is that tested?","Are dependencies between applications recorded in the CMDB so impact can be traced?","Do recovery steps run as automation, and who approves running them?"],
  lv:LV("Recovery depends on individuals' memory.","CIs and dependencies are recorded in the CMDB.","Every CI has a recovery owner and method; plans are approved.","Live or tabletop exercises run on the tier schedule, with RTO measured.","Recovery is automated, rehearsed, and single points of failure are removed.")},
 {k:"D",key:"dat",letter:"D",n:"Data",tone:"--u3",target:3,scope:"New dimension. Backups, replication, recovery points, lineage, classification, retention and integrity of the data the business cannot lose.",
  q:["What data does each application own, how is it classified, and who is the data owner?","What is the RPO, and does the backup or replication frequency meet it?","When was a full restore last proven, and was the data verified as intact?","Is at least one backup copy offsite, immutable and in a different failure domain?","Where does derived data come from (lineage), and can it be rebuilt instead of restored?","How long must the data be kept, and when can it be disposed of?"],
  lv:LV("Backups are assumed to work.","Data assets are listed with a classification and a backup method.","Backups meet the RPO and a restore test happens yearly.","Restores are tested on the tier schedule; integrity checks and lineage are recorded.","Immutable offsite copies, automated integrity checks and measured recovery points on every asset.")},
 {k:"H",key:"hr",letter:"H",n:"Human resources",tone:"--w1",target:3,scope:"Roles, succession, cross-training and contact trees: the people who run recovery and who steps in when they cannot.",
  q:["Which roles are critical to recovery and who is the named successor for each?","Who is cross-trained on the Tier 1 recovery steps?","Is the contact tree current, and when was it last tested out of hours?","How are staff supported when a disaster affects them personally?","Which roles depend on a single person?"],
  lv:LV("Recovery depends on a few heroes.","Critical roles are named.","Each critical role has a successor and a contact tree.","Contact trees are tested at least twice a year and cross-training is tracked.","No single-person dependency; succession is reviewed each quarter.")},
 {k:"3",key:"tp",letter:"3",n:"Third parties: vendors, contracts, services",tone:"--p2",target:3,scope:"Vendors and providers whose failure stops us, with the contracts, SLAs and exit plans that govern them.",
  q:["Which vendors support Tier 1 and Tier 2 applications, and what do their contracts promise for recovery?","Does each critical vendor have an exit or substitution plan, and has it been tested?","Do vendor SLAs fit our RTO and RPO?","Do we hold the vendor's own continuity evidence (SOC 2, DR test summary) and is it under a year old?","Who at the vendor do we call in a disaster?"],
  lv:LV("Vendor dependence is unrecorded.","Critical vendors and contracts are listed.","Critical vendors have continuity evidence and an exit plan.","Vendor recovery is part of our exercises; SLAs match the tier.","Vendors are substitutable within the MTD and joint exercises are routine.")}];

/* ------------------------------------------------------------------ people helpers ------------------------------------------------------------------ */
BX.humans=()=>arr(G(()=>DIR,[])).filter(d=>d.kind==="human").map(d=>d.name);
const isHuman=n=>BX.humans().includes(n);
BX.isHuman=isHuman;

/* ------------------------------------------------------------------ seed ------------------------------------------------------------------ */
const GROUPS=()=>[
 {id:"G-RC",n:"Resilience council",members:["Casey Rowan","Sam Patel","Tom Becker","Rina Okafor","Marcus Reid"],purpose:"Approves Tier 1 plans and exercise results; decides when to declare a disaster."},
 {id:"G-CAB",n:"Change advisory board",members:["Nia Brooks","Sam Patel","Jordan Lee","Tom Becker"],purpose:"Approves the change record for every live failover exercise."},
 {id:"G-AOF",n:"Application owners forum",members:["Maya Ortiz","Jordan Lee","Avery Chen","Tom Becker"],purpose:"Approves Tier 3 and Tier 4 plans and documented reviews."},
 {id:"G-FAC",n:"Facilities and safety group",members:["Wes Hartley","Maribel Cruz","Joanna Pierce"],purpose:"Owns site, power, cooling and safety recovery."},
 {id:"G-VND",n:"Vendor risk group",members:["Camille Ortega","Theo Marlowe","Maya Ortiz"],purpose:"Approves vendor continuity and exit plans."}];

const TIERS=()=>[
 {t:1,alpha:"Alpha",n:"Tier 1",crit:"1 - Mission critical",rto:240,rpo:15,mtd:480,type:"live",months:12,wins:["CW-B"],notice:21,grp:"G-RC",retest:180,firstDays:90,why:"Stops publishing or reader access, or is a dependency of everything else."},
 {t:2,alpha:"Bravo",n:"Tier 2",crit:"2 - Somewhat critical",rto:720,rpo:240,mtd:1440,type:"alternate",months:12,wins:["CW-A","CW-B"],notice:14,grp:"G-CAB",retest:180,firstDays:180,why:"Business-critical but can run on a manual workaround for a day."},
 {t:3,alpha:"Charlie",n:"Tier 3",crit:"3 - Less critical",rto:2880,rpo:1440,mtd:7200,type:"tabletop",months:12,wins:["CW-C"],notice:10,grp:"G-AOF",retest:365,firstDays:365,why:"Convenience or support systems; users can wait two days."},
 {t:4,alpha:"Delta",n:"Tier 4",crit:"4 - Not critical",rto:7200,rpo:10080,mtd:20160,type:"review",months:12,wins:["CW-C"],notice:5,grp:"G-AOF",retest:365,firstDays:365,why:"Can be rebuilt from scratch; a yearly documented review is enough."}];
const TYPEN={live:"Live failover",tabletop:"Tabletop",review:"Documented review",alternate:"Live one year, tabletop the next"};
BX.TYPEN=TYPEN;

const WINDOWS=()=>[
 {id:"CW-A",n:"Weeknight off-hours",dows:[1,2,3,4],from:"22:00",to:"02:00",live:true,src:"Change records: Off-hours 22:00 to 02:00"},
 {id:"CW-B",n:"Weekend maintenance",dows:[6],from:"01:00",to:"07:00",live:true,src:"Change records and the Oct 24 rehearsal request: Saturday 01:00 to 07:00"},
 {id:"CW-C",n:"Business hours",dows:[1,2,3,4,5],from:"09:00",to:"17:00",live:false,src:"Change records: Business hours (tabletops and reviews need no change window)"}];

/* application owners, classification overrides and extra (non-service) applications */
const APPOWN={svc_portal:["Tom Becker","Sam Patel"],svc_cod:["Priya Shah","Jordan Lee"],svc_search:["Jordan Lee","Rina Kovacs"],svc_id:["Rina Okafor","Colette Brandt"],svc_m365:["Sam Patel","Paula Grant"],svc_net:["Ben Ito","Sam Patel"],svc_cr:["Maya Ortiz","Theo Marlowe"],svc_erp:["Avery Chen","Victor Amaya"],svc_fin:["Victor Amaya","Avery Chen"],svc_data:["Anil Mehta","Dev Rao"],svc_end:["Tom Becker","Ines Duarte"],svc_int:["Jordan Lee","Carla Reyes"],svc_desk:["Tom Becker","Priti Joshi"],app_wiki:["Wes Hartley","Maribel Cruz"],app_print:["Camille Ortega","Noelle Park"]};
const APPX=()=>[{id:"app_wiki",n:"Intranet and policy wiki",crit:4,sites:["SITE-NOR"],vendors:[],data:[],cis:["ci_m362"],process:"BP8",note:"SharePoint site collection; rebuilt from the policy library."},{id:"app_print",n:"Print and mail services",crit:4,sites:[],vendors:["APX"],data:[],cis:[],process:"BP3",note:"Board packs and member mailings; Apex Print produces from files we send."}];

const BPS=()=>[
 {id:"BP1",n:"Publish standards",owner:"Elena Marsh",bak:"Noor Haddad",mtd:480,apps:["svc_cod","svc_search","svc_portal","svc_id"],peak:"Beta publication Nov 13",users:"Editors and technical committees"},
 {id:"BP2",n:"Serve readers and subscribers",owner:"Maya Ortiz",bak:"Leila Haddad",mtd:480,apps:["svc_portal","svc_search","svc_id","svc_net"],peak:"All year; 180,000 readers",users:"Readers and subscribers"},
 {id:"BP3",n:"Run committee ballots",owner:"Theo Marlowe",bak:"Elena Marsh",mtd:1440,apps:["svc_cod","svc_id","svc_m365","app_print"],peak:"Ballot windows",users:"Committee members"},
 {id:"BP4",n:"Close the books",owner:"Avery Chen",bak:"Victor Amaya",mtd:1440,apps:["svc_erp","svc_fin","svc_id","svc_data"],peak:"Month-end, Nov 16 to 20 close",users:"Finance"},
 {id:"BP5",n:"Manage contracts and renewals",owner:"Maya Ortiz",bak:"Camille Ortega",mtd:2880,apps:["svc_cr","svc_m365"],peak:"Renewal dates",users:"Procurement and legal"},
 {id:"BP6",n:"Support users",owner:"Tom Becker",bak:"Priti Joshi",mtd:1440,apps:["svc_desk","svc_id","svc_m365","svc_end"],peak:"Weekdays",users:"All staff"},
 {id:"BP7",n:"Report and analyze",owner:"Anil Mehta",bak:"Femi Adeyemi",mtd:2880,apps:["svc_data","svc_int"],peak:"Monthly reporting",users:"Leadership"},
 {id:"BP8",n:"Collaborate and communicate",owner:"Sam Patel",bak:"Paula Grant",mtd:480,apps:["svc_m365","svc_id","svc_net","app_wiki"],peak:"All year",users:"All staff"}];

const SITES=()=>[
 {id:"SITE-NOR",n:"Norwalk headquarters",loc:"Norwalk, CT",kind:"Office",owner:"Wes Hartley",bak:"Maribel Cruz",staff:140,apps:["svc_net","svc_desk","app_wiki"],alt:"Work from anywhere through VPN and M365; DC office for editors",lease:"Lease to 2029; landlord notice 24 h",ev:["EQ-UPS","EQ-GEN","EQ-HVAC","EQ-FIRE","EQ-WATER","EQ-ACCESS"]},
 {id:"SITE-DC",n:"Washington DC office",loc:"Washington, DC",kind:"Office",owner:"Leila Haddad",bak:"Isla Fenn",staff:22,apps:["svc_m365"],alt:"Committee meetings move to Teams; hotel meeting rooms on call",lease:"Lease to 2027",ev:["EQ-DCNET"]},
 {id:"SITE-AZE",n:"Azure East US 2 (primary region)",loc:"Virginia, US",kind:"Cloud region",owner:"Sam Patel",bak:"Ben Ito",staff:0,apps:["svc_cod","svc_portal","svc_search","svc_erp","svc_fin","svc_data","svc_int","svc_cr"],alt:"Azure Central US recovery region",lease:"Microsoft Enterprise Agreement CT-105",ev:["EQ-AZPWR"],vend:"MSF"},
 {id:"SITE-AZC",n:"Azure Central US (recovery region)",loc:"Iowa, US",kind:"Cloud region",owner:"Sam Patel",bak:"Ben Ito",staff:0,apps:["svc_cod","svc_portal"],alt:"Paired with East US 2; capacity reserved for Tier 1",lease:"Microsoft Enterprise Agreement CT-105",ev:["EQ-AZPWR"],vend:"MSF"},
 {id:"SITE-NWC",n:"Northwind hosting facility",loc:"Ashburn, VA",kind:"Colocation",owner:"Tom Becker",bak:"Sam Patel",staff:0,apps:["svc_portal"],alt:"Portal web tier can run in Azure Central US (rehearsal planned Oct 24)",lease:"Northwind MSA CT-101",ev:[],vend:"NWC"}];

const EQUIP=()=>[
 {id:"EQ-UPS",n:"Server-room UPS pair",kind:"Power",site:"SITE-NOR",red:"n+1",last:iso(-120),months:12,runtime:"22 min at full load",owner:"Wes Hartley",bak:"Maribel Cruz",grp:"Facilities and safety group",ctr:"Coastal Facilities Services, 4 h response"},
 {id:"EQ-GEN",n:"Standby generator (100 kW diesel)",kind:"Power",site:"SITE-NOR",red:"single",last:iso(-410),months:12,runtime:"36 h on a full tank",owner:"Wes Hartley",bak:"Maribel Cruz",grp:"Facilities and safety group",ctr:"Coastal Facilities Services, 4 h response"},
 {id:"EQ-HVAC",n:"Server-room cooling (2 CRAC units)",kind:"HVAC",site:"SITE-NOR",red:"n+1",last:iso(-75),months:6,runtime:"One unit carries the load",owner:"Wes Hartley",bak:"Maribel Cruz",grp:"Facilities and safety group",ctr:"Coastal Facilities Services, 8 h response"},
 {id:"EQ-FIRE",n:"Clean-agent fire suppression",kind:"Safety",site:"SITE-NOR",red:"single",last:iso(-200),months:12,runtime:"Discharge test not required",owner:"Joanna Pierce",bak:"Wes Hartley",grp:"Facilities and safety group",ctr:"Landmark Fire Protection, annual inspection"},
 {id:"EQ-WATER",n:"Water leak detection (server room)",kind:"Plumbing",site:"SITE-NOR",red:"single",last:iso(-330),months:12,runtime:"Alerts the service desk",owner:"Wes Hartley",bak:"Maribel Cruz",grp:"Facilities and safety group",ctr:"Coastal Facilities Services"},
 {id:"EQ-ACCESS",n:"Badge access control",kind:"Safety",site:"SITE-NOR",red:"single",last:iso(-90),months:12,runtime:"Fails open for fire code",owner:"Joanna Pierce",bak:"Wes Hartley",grp:"Facilities and safety group",ctr:"Landmark Fire Protection"},
 {id:"EQ-DCNET",n:"DC office network closet power and cooling",kind:"Power",site:"SITE-DC",red:"single",last:iso(-250),months:12,runtime:"Battery 15 min",owner:"Leila Haddad",bak:"Isla Fenn",grp:"Facilities and safety group",ctr:"Building management"},
 {id:"EQ-AZPWR",n:"Azure region power and cooling (provider managed)",kind:"Power",site:"SITE-AZE",red:"2n",last:iso(-60),months:12,runtime:"Provider evidence: SOC 2 Type II",owner:"Sam Patel",bak:"Ben Ito",grp:"Platform team",ctr:"Microsoft Enterprise Agreement CT-105"}];

const DATA=()=>[
 {id:"DA-STD",n:"Published standards corpus",cls:"Public",ci:"ci_cod5",apps:["svc_cod","svc_portal","svc_search"],owner:"Elena Marsh",bak:"Noor Haddad",method:"Blob geo-redundant storage with versioning",freq:60,offsite:true,immut:true,repl:"Async to Azure Central US",rpoT:240,rpoA:60,ret:"Permanent (published record)",integ:{freq:"Weekly hash check",last:iso(-3),ok:true},restore:iso(-40),restoreOk:true,from:[],to:["DA-IDX"]},
 {id:"DA-DRAFT",n:"Draft standards and editor workspace",cls:"Confidential",ci:"ci_cod2",apps:["svc_cod"],owner:"Priya Shah",bak:"Jordan Lee",method:"SQL log shipping every 15 minutes plus nightly full",freq:15,offsite:true,immut:false,repl:"Async to Azure Central US",rpoT:15,rpoA:12,ret:"7 years after publication",integ:{freq:"Nightly restore check",last:iso(-1),ok:true},restore:iso(-210),restoreOk:true,from:[],to:["DA-STD"]},
 {id:"DA-BALLOT",n:"Ballots and committee records",cls:"Restricted",ci:"ci_cod2",apps:["svc_cod"],owner:"Theo Marlowe",bak:"Elena Marsh",method:"SQL log shipping every 15 minutes plus nightly full",freq:15,offsite:true,immut:true,repl:"Async to Azure Central US",rpoT:15,rpoA:15,ret:"10 years (antitrust record)",integ:{freq:"Nightly restore check",last:iso(-1),ok:true},restore:iso(-210),restoreOk:true,from:[],to:[]},
 {id:"DA-MEMBER",n:"Member and subscriber records",cls:"Personal",ci:"ci_por4",apps:["svc_portal","svc_id"],owner:"Maya Ortiz",bak:"Leila Haddad",method:"Managed database point-in-time restore (35 days)",freq:5,offsite:true,immut:false,repl:"Zone redundant, no cross-region copy",rpoT:15,rpoA:5,ret:"Life of membership plus 3 years",integ:{freq:"None recorded",last:"",ok:null},restore:iso(-430),restoreOk:null,from:[],to:[]},
 {id:"DA-IDX",n:"Search index",cls:"Internal",ci:"ci_sea3",apps:["svc_search","svc_portal"],owner:"Jordan Lee",bak:"Rina Kovacs",method:"Rebuilt from the corpus (derived data); no backup",freq:0,offsite:false,immut:false,repl:"None",rpoT:1440,rpoA:1440,ret:"Rebuilt on demand",integ:{freq:"Index document count vs corpus",last:iso(-1),ok:true},restore:iso(-30),restoreOk:true,from:["DA-STD"],to:[],derived:true},
 {id:"DA-IDENT",n:"Directory, groups and conditional access configuration",cls:"Restricted",ci:"ci_tenant",apps:["svc_id","svc_m365","svc_portal","svc_cod"],owner:"Rina Okafor",bak:"Colette Brandt",method:"Provider recycle bin plus nightly configuration export to a separate tenant",freq:1440,offsite:true,immut:true,repl:"Provider-managed",rpoT:240,rpoA:1440,ret:"Life of employment plus 1 year",integ:{freq:"Weekly export diff",last:iso(-5),ok:true},restore:iso(-160),restoreOk:true,from:[],to:[]},
 {id:"DA-MAIL",n:"Mail, files and Teams content",cls:"Confidential",ci:"ci_m360",apps:["svc_m365","svc_cr"],owner:"Sam Patel",bak:"Paula Grant",method:"Provider retention and third-party backup of mailboxes and SharePoint",freq:480,offsite:true,immut:true,repl:"Provider geo-redundant",rpoT:480,rpoA:480,ret:"7 years by policy",integ:{freq:"Monthly sample restore",last:iso(-26),ok:true},restore:iso(-26),restoreOk:true,from:[],to:[]},
 {id:"DA-CONTR",n:"Contracts and obligations",cls:"Confidential",ci:"ci_cr1",apps:["svc_cr"],owner:"Maya Ortiz",bak:"Theo Marlowe",method:"Nightly database backup, blob snapshots",freq:1440,offsite:true,immut:false,repl:"None",rpoT:240,rpoA:1440,ret:"Contract term plus 7 years",integ:{freq:"Quarterly sample restore",last:iso(-95),ok:true},restore:iso(-148),restoreOk:true,from:[],to:[]},
 {id:"DA-LEDGER",n:"Lease and general ledger",cls:"Restricted",ci:"ci_erp1",apps:["svc_erp","svc_fin"],owner:"Avery Chen",bak:"Victor Amaya",method:"Transaction log backup every 15 minutes plus nightly full",freq:15,offsite:true,immut:true,repl:"Async to Azure Central US",rpoT:240,rpoA:15,ret:"7 years (tax and audit)",integ:{freq:"Nightly checksum, monthly restore",last:iso(-2),ok:true},restore:iso(-35),restoreOk:true,from:[],to:["DA-LAKE"]},
 {id:"DA-LAKE",n:"Lakehouse datasets",cls:"Internal",ci:"ci_dat0",apps:["svc_data","svc_int"],owner:"Anil Mehta",bak:"Rosa Delgado",method:"Delta table versioning and weekly snapshot",freq:10080,offsite:true,immut:false,repl:"None",rpoT:1440,rpoA:10080,ret:"3 years",integ:{freq:"Pipeline row-count checks",last:iso(-1),ok:true},restore:iso(-300),restoreOk:true,from:["DA-LEDGER"],to:[]},
 {id:"DA-CFG",n:"Infrastructure configuration (Terraform state, firewall rules)",cls:"Internal",ci:"ci_az",apps:["svc_net","svc_portal","svc_cod"],owner:"Ben Ito",bak:"Sam Patel",method:"Git repository mirror and versioned state storage",freq:5,offsite:true,immut:true,repl:"Mirrored to a second provider",rpoT:60,rpoA:5,ret:"Permanent",integ:{freq:"Nightly plan check",last:iso(-1),ok:true},restore:iso(-45),restoreOk:true,from:[],to:[]},
 {id:"DA-TICKET",n:"Service desk tickets and knowledge",cls:"Internal",ci:"ci_dsk1",apps:["svc_desk","svc_end"],owner:"Tom Becker",bak:"Priti Joshi",method:"Nightly export to Azure storage",freq:1440,offsite:true,immut:false,repl:"None",rpoT:1440,rpoA:1440,ret:"5 years",integ:{freq:"None recorded",last:"",ok:null},restore:"",restoreOk:null,from:[],to:[]}];

const ROLES=()=>[
 {id:"HR-IC",n:"Incident commander (major incident)",primary:"Tom Becker",succ:"Sam Patel",cross:["Priti Joshi","Paula Grant"],apps:["svc_portal","svc_cod","svc_search","svc_id","svc_m365","svc_net"],contact:"Mobile, Teams, personal phone",trained:iso(-70)},
 {id:"HR-PLAT",n:"Platform on-call lead",primary:"Sam Patel",succ:"Ben Ito",cross:["Leah Moss","Carla Reyes"],apps:["svc_portal","svc_cod","svc_net","svc_data"],contact:"Pager, mobile",trained:iso(-45)},
 {id:"HR-SEARCH",n:"Search and indexing engineer",primary:"Leah Moss",succ:"",cross:["Rina Kovacs"],apps:["svc_search","svc_portal"],contact:"Mobile",trained:iso(-210)},
 {id:"HR-IAM",n:"Identity and access engineer",primary:"Colette Brandt",succ:"Rina Okafor",cross:["Imran Sheikh"],apps:["svc_id","svc_m365"],contact:"Mobile, Teams",trained:iso(-100)},
 {id:"HR-PUB",n:"Publishing approver (Chief Editor)",primary:"Elena Marsh",succ:"Noor Haddad",cross:["Pierce Caldwell"],apps:["svc_cod","svc_portal"],contact:"Mobile, email",trained:iso(-150)},
 {id:"HR-COMM",n:"Communications lead",primary:"Leila Haddad",succ:"Owen Pryce",cross:["Isla Fenn"],apps:["svc_portal","svc_m365"],contact:"Mobile, Teams",trained:iso(-80)},
 {id:"HR-FIN",n:"Finance close lead",primary:"Avery Chen",succ:"Victor Amaya",cross:["Noelle Park"],apps:["svc_erp","svc_fin"],contact:"Mobile, email",trained:iso(-190)},
 {id:"HR-DATA",n:"Data platform engineer",primary:"Yuki Tanaka",succ:"Rosa Delgado",cross:[],apps:["svc_data","svc_int"],contact:"Mobile",trained:iso(-260)},
 {id:"HR-VND",n:"Vendor continuity manager",primary:"Camille Ortega",succ:"Theo Marlowe",cross:["Maya Ortiz"],apps:["svc_search","svc_portal","svc_cr"],contact:"Mobile, email",trained:iso(-130)}];

const VENDORS=()=>[
 {id:"NWC",apps:["svc_portal"],exit:true,exitDoc:"Northwind exit and Azure fallback runbook v1.2",exitTested:iso(-210),att:"SOC 2 Type II and DR test summary",attDate:iso(-95),slaRto:240,sites:["SITE-NWC"],contact:"Northwind NOC, 24x7 bridge",sole:false},
 {id:"MSF",apps:["svc_id","svc_m365","svc_cod","svc_portal","svc_search","svc_erp","svc_fin","svc_data","svc_cr","svc_int","svc_net"],exit:false,exitDoc:"Provider is the platform; fallback is documented per service, no full exit plan",exitTested:"",att:"SOC 2 Type II and region failover report",attDate:iso(-60),slaRto:60,sites:["SITE-AZE","SITE-AZC"],contact:"Microsoft support, premier line",sole:true},
 {id:"LUM",apps:["svc_search","svc_cod","svc_data"],exit:false,exitDoc:"",exitTested:"",att:"Questionnaire only, no DR evidence",attDate:iso(-400),slaRto:720,sites:[],contact:"Marco Ellis, Lumen delivery lead",sole:true},
 {id:"LGD",apps:["svc_cr"],exit:false,exitDoc:"",exitTested:"",att:"SOC 2 Type I",attDate:iso(-330),slaRto:1440,sites:[],contact:"LegacyDocs support desk",sole:true},
 {id:"CBL",apps:[],exit:true,exitDoc:"Replaceable by any penetration test firm",exitTested:"",att:"Not required (no production access)",attDate:iso(-100),slaRto:0,sites:[],contact:"Account manager",sole:false},
 {id:"BRT",apps:["svc_cod","svc_data"],exit:false,exitDoc:"",exitTested:"",att:"None on file",attDate:"",slaRto:0,sites:[],contact:"Staffing agency desk",sole:false},
 {id:"APX",apps:["app_print"],exit:true,exitDoc:"Alternate print vendor list (two named)",exitTested:"",att:"Not required (Tier 4)",attDate:"",slaRto:2880,sites:[],contact:"Dale Moreno, Apex Print",sole:false}];

/* CI recovery overrides (the rest inherit defaults from class and application) */
const CIX={ci_vpn:{red:"single",dr:"none"},ci_fw:{red:"2n",dr:"pair"},ci_sea3:{red:"single",dr:"rebuild"},ci_por3:{red:"single",dr:"none"},ci_dat3:{red:"single",dr:"none",own:null},ci_dsk0:{red:"single",dr:"none"},ci_sea4:{own:null},ci_dat1:{own:null},ci_int2:{own:null},ci_end1:{own:null},ci_por2:{own:null},ci_cr1:{red:"single",dr:"backup"},ci_cr2:{red:"single",dr:"backup"},ci_erp1:{red:"active-passive",dr:"replica"},ci_cod2:{red:"active-passive",dr:"replica"},ci_cod5:{red:"2n",dr:"replica"},ci_sea0:{red:"single",dr:"rebuild"},ci_sea1:{red:"n+1",dr:"rebuild"},ci_tenant:{red:"2n",dr:"provider"},ci_az:{red:"2n",dr:"provider"}};

const KBREF=()=>[
 {id:"KB0031",why:"Portal failover runbook (RB-031), flagged 14 months old"}];

/* SOPs: runbooks as process records. step = [name, description, who, owner, sla, in, out] */
const SOPS=()=>[
 {id:"SOP-BC-101",n:"Fail over the Portal web tier to Azure Central US",plan:"BCP-101",kb:"KB0031",steps:[["Confirm scope","Incident commander confirms the Northwind facility or web tier is down and the RTO clock has started.","human","Tom Becker","5 min","Declaration","Scope note"],["Freeze changes","Change manager places a freeze on the Portal and dependent services.","human","Nia Brooks","5 min","Scope note","Freeze notice"],["Promote database replica","Promote the Central US replica of the member and corpus databases and record the recovery point.","human","Sam Patel","30 min","Freeze notice","Writable database, RPO figure"],["Start web tier in Central US","Run the web tier pipeline against the recovery subscription.","auto","Pipeline","20 min","Writable database","Running web tier"],["Move traffic","Update DNS and WAF origin; confirm certificates.","human","Ben Ito","15 min","Running web tier","Traffic on Central US"],["Run smoke tests","Search, login, reader page and API checks pass.","auto","Synthetic checks","10 min","Traffic on Central US","Test report"],["Approve go-live and communicate","Incident commander approves; communications lead posts the status update.","gate","Tom Becker","15 min","Test report","Recovery declared"]]},
 {id:"SOP-BC-102",n:"Restore the editor workspace database",plan:"BCP-102",kb:"",steps:[["Stop writes","Put the editor workspace in read-only mode and tell editors.","human","Priya Shah","5 min","Declaration","Read-only notice"],["Choose the recovery point","Pick the latest log-shipping point and record the data loss window.","human","Ben Ito","10 min","Read-only notice","Recovery point"],["Restore to the recovery region","Restore the database from the replica or backup.","auto","Restore job","60 min","Recovery point","Restored database"],["Repoint the application","Update connection settings for both app servers.","human","Sam Patel","15 min","Restored database","Application online"],["Verify content integrity","Compare document counts and run the checksum report against the corpus.","human","Priya Shah","20 min","Application online","Integrity report"],["Reopen to editors","Editors resume; send the recovery summary.","gate","Priya Shah","10 min","Integrity report","Service restored"]]},
 {id:"SOP-BC-103",n:"Break-glass access and conditional access restore",plan:"BCP-104",kb:"",steps:[["Retrieve break-glass credentials","Two sealed administrators retrieve the emergency accounts from the safe.","human","Rina Okafor","10 min","Declaration","Admin session"],["Check provider health","Confirm Entra ID status and scope of the outage.","human","Colette Brandt","10 min","Admin session","Health note"],["Restore policy from export","Re-apply the last configuration export to the tenant.","auto","Config export job","30 min","Health note","Policies restored"],["Test sign-in","Sign-in and MFA checks for editors, staff and administrators.","human","Colette Brandt","15 min","Policies restored","Test report"],["Rotate emergency credentials","Reseal and rotate the break-glass accounts.","human","Rina Okafor","20 min","Test report","Credentials rotated"]]},
 {id:"SOP-BC-104",n:"Switch to the backup internet circuit and VPN",plan:"BCP-106",kb:"",steps:[["Confirm primary circuit down","Network on-call confirms the carrier outage.","human","Ben Ito","5 min","Alert","Confirmation"],["Fail over the edge","Force the firewall pair to the secondary circuit.","auto","Firewall pair","5 min","Confirmation","Traffic on secondary"],["Re-establish VPN","Bring the VPN gateway up on the secondary address.","human","Ben Ito","15 min","Traffic on secondary","VPN restored"],["Verify remote staff","Service desk checks remote access with five staff.","human","Tom Becker","10 min","VPN restored","Verification"]]},
 {id:"SOP-BC-105",n:"Fail over the lease subledger and close calendar",plan:"BCP-202",kb:"",steps:[["Confirm close calendar","Controller confirms which close tasks are in flight.","human","Avery Chen","10 min","Declaration","Close status"],["Promote the replica","Promote the ERP database replica and capture the last transaction.","human","Sam Patel","45 min","Close status","Writable ledger"],["Reconcile the last hour","Finance reconciles postings against the last transaction.","human","Victor Amaya","60 min","Writable ledger","Reconciled ledger"],["Approve reopening","Controller approves posting.","gate","Avery Chen","15 min","Reconciled ledger","Posting resumed"]]},
 {id:"SOP-BC-106",n:"Work from anywhere when Norwalk is closed",plan:"BCP-301",kb:"",steps:[["Account for staff","Managers confirm each person is safe using the call list.","human","Joanna Pierce","60 min","Declaration","Roll call"],["Announce alternate working","Communications lead sends the staff notice.","human","Leila Haddad","15 min","Roll call","Staff notice"],["Check remote capacity","Network on-call confirms VPN and M365 capacity.","human","Ben Ito","15 min","Staff notice","Capacity confirmed"],["Move phones and the service desk","Forward the service desk number to the cloud queue.","human","Tom Becker","30 min","Capacity confirmed","Desk operating"]]},
 {id:"SOP-BC-107",n:"Invoke the Northwind exit and Azure fallback",plan:"BCP-501",kb:"",steps:[["Notify Northwind and invoke SLA clause","Vendor manager sends the formal notice.","human","Camille Ortega","30 min","Declaration","Notice sent"],["Export hosted data","Request the latest backup and configuration export.","human","Tom Becker","120 min","Notice sent","Export received"],["Stand up in Azure","Run the Portal pipeline in the recovery subscription.","auto","Pipeline","90 min","Export received","Service in Azure"],["Confirm contract position","Legal confirms termination rights and credits.","gate","Theo Marlowe","1 day","Notice sent","Position memo"]]},
 {id:"SOP-BC-108",n:"Rebuild the search index from the corpus",plan:"BCP-103",kb:"",steps:[["Check the corpus","Confirm the corpus store is intact and the recovery point.","human","Jordan Lee","10 min","Declaration","Corpus verified"],["Provision a new cluster","Provision the cluster from code in the recovery subscription.","auto","Pipeline","40 min","Corpus verified","Empty cluster"],["Run the full index","Index all documents; monitor throughput.","human","Leah Moss","240 min","Empty cluster","Populated index"],["Compare counts and switch","Document counts match; switch the Portal to the new index.","gate","Jordan Lee","15 min","Populated index","Search restored"]]}];

const mkSteps=(kind,scopeName)=>{
 const A=(n,who,owner,sla,i,o)=>({n,who,owner,sla,in:i,out:o});
 if(kind==="application")return[A("Declare and open the bridge","gate","Incident commander","15 min","Major incident","Declaration"),A("Assess scope and impact","human","Incident commander","15 min","Declaration","Scope and impact"),A("Notify the call tree","auto","Call tree","5 min","Declaration","Notifications sent"),A("Recover data tier","human","Data owner","Per RTO","Scope and impact","Data restored or promoted"),A("Recover application tier","human","Application owner","Per RTO","Data restored or promoted","Application running"),A("Redirect users","human","Network on-call","15 min","Application running","Traffic restored"),A("Validate and approve go-live","gate","Application owner","15 min","Traffic restored","Recovery approved"),A("Communicate and stand down","human","Communications lead","15 min","Recovery approved","Closing notice")];
 if(kind==="site")return[A("Declare site loss","gate","Incident commander","15 min","Event","Declaration"),A("Account for people","human","People operations","60 min","Declaration","Roll call"),A("Activate alternate working","human","Facilities","60 min","Roll call","Alternate in use"),A("Restore network, power and services","human","Facilities","Per RTO","Alternate in use","Services restored"),A("Reopen or relocate","gate","Resilience council","Day","Services restored","Decision")];
 if(kind==="vendor")return[A("Confirm vendor failure","human","Vendor manager","30 min","Alert","Confirmation"),A("Invoke SLA and escalate","human","Vendor manager","30 min","Confirmation","Vendor engaged"),A("Switch to fallback","human","Application owner","Per RTO","Vendor engaged","Fallback running"),A("Confirm data export","human","Data owner","Per RTO","Fallback running","Data confirmed"),A("Review contract position","gate","General counsel","1 day","Fallback running","Position memo")];
 return[A("Declare process interruption","gate","Process owner","15 min","Event","Declaration"),A("Switch to the manual workaround","human","Process owner","60 min","Declaration","Workaround running"),A("Log work done offline","human","Process owner","Per MTD","Workaround running","Offline log"),A("Resume and reconcile","human","Process owner","Per MTD","Offline log","Reconciled records")]};
BX.mkSteps=mkSteps;

const TREE=(rows)=>rows.map((r,i)=>({n:i+1,role:r[0],person:r[1],method:r[2],wait:r[3]}));
const TREE_ENT=TREE([["Incident commander","Tom Becker","Pager, then mobile",5],["Platform on-call lead","Sam Patel","Pager, then mobile",5],["Security lead","Rina Okafor","Mobile",10],["CIO","Casey Rowan","Mobile, then personal phone",10],["Communications lead","Leila Haddad","Mobile",15],["Chief editor (publishing)","Elena Marsh","Mobile",15],["Chief executive","Catherine Doyle","Mobile",30]]);

const V=(v,date,by,change,st)=>({v,date,by,change,st});
const COMMS=()=>[
 {id:"CM-1",plan:"BCP-901",aud:"All staff",ch:"Teams and SMS",subject:"Service disruption: {{plan}} is active",body:"We have declared a disruption affecting {{scope}}. Recovery target is {{rto}}. Do not restart systems. The incident commander is {{ic}}. Next update in 30 minutes."},
 {id:"CM-2",plan:"BCP-901",aud:"Members and readers",ch:"Status page and email",subject:"We are restoring standards access",body:"Some services are unavailable. We expect to restore access within {{rto}}. Published standards remain available at the mirror. We will update this page every hour."},
 {id:"CM-3",plan:"BCP-901",aud:"Board and executives",ch:"Email",subject:"Disaster declared: {{scope}}",body:"A disaster has been declared at {{when}}. Impact: {{impact}}. Recovery owner: {{ic}}. Decisions needed from the Resilience council are listed in the bridge notes."},
 {id:"CM-4",plan:"BCP-101",aud:"Editors",ch:"Teams",subject:"Editor workspace and Portal: failover in progress",body:"The Portal is moving to the recovery region. Save your drafts now. Expected restoration: {{rto}}."},
 {id:"CM-5",plan:"BCP-301",aud:"All staff",ch:"SMS and email",subject:"Norwalk office closed",body:"The Norwalk office is closed. Work from home using the VPN and Teams. Managers will call you to confirm you are safe."},
 {id:"CM-6",plan:"BCP-501",aud:"Vendor",ch:"Phone and email",subject:"Invocation of continuity clause",body:"Under Section 9 of the master services agreement we are invoking recovery support. Please confirm your bridge details and an engineer within 30 minutes."}];

function seedPlans(){
 const P=(id,n,kind,scope,o)=>Object.assign({id,n,kind,scope,tier:1,status:"Approved",own:"",bak:"",grp:"G-RC",cadence:12,lastReview:iso(-120),
  vers:[],kb:[],sops:[],wf:true,tree:"ent",rtoT:0,rpoT:0,cis:[],data:[],vendors:[],sites:[],roles:[],lines:[],contracts:[],risks:[],ctls:[],metrics:["m_bc_plan_cov"],proj:"",proc:[],note:""},o);
 return[
 P("BCP-101","Standards Portal disaster recovery plan","application","svc_portal",{tier:1,own:"Tom Becker",bak:"Sam Patel",lastReview:iso(-205),vers:[V("3.2",iso(-205),"Tom Becker","Added Azure Central US web tier option","Approved"),V("3.1",iso(-420),"Tom Becker","Annual review","Retired"),V("3.0",iso(-610),"Sam Patel","Northwind hosting section rewritten","Retired")],kb:["KB0031","RB-3101"],sops:["SOP-BC-101"],data:["DA-STD","DA-MEMBER","DA-IDX","DA-CFG"],vendors:["NWC","MSF"],sites:["SITE-NWC","SITE-AZE","SITE-AZC"],roles:["HR-IC","HR-PLAT","HR-COMM"],lines:["PR3-CLD","PR1-CLD","PR3-LAB"],contracts:["CT-101","CT-102"],risks:["GR-101","GR-111"],ctls:["GC-203","GC-202"],proj:"PR3",proc:["BP1","BP2"],note:"Runbook RB-031 is 14 months old; refresh drafted for the Oct 24 rehearsal."}),
 P("BCP-102","Standards Platform disaster recovery plan","application","svc_cod",{tier:1,own:"Priya Shah",bak:"Jordan Lee",lastReview:iso(-60),vers:[V("2.1",iso(-60),"Priya Shah","Updated after the March failover","Approved"),V("2.0",iso(-300),"Priya Shah","Log shipping interval to 15 minutes","Retired")],kb:["RB-3102"],sops:["SOP-BC-102"],data:["DA-DRAFT","DA-BALLOT","DA-STD","DA-CFG"],vendors:["MSF","LUM","BRT"],sites:["SITE-AZE","SITE-AZC"],roles:["HR-IC","HR-PLAT","HR-PUB"],lines:["PR3-CLD","PR1-LAB"],contracts:["CT-105"],risks:["GR-101","GR-111"],ctls:["GC-203"],proj:"PR1",proc:["BP1","BP3"],note:""}),
 P("BCP-103","Search and indexing recovery plan","application","svc_search",{tier:1,status:"Draft",own:"Jordan Lee",bak:"Rina Kovacs",lastReview:"",vers:[V("0.9",iso(-35),"Jordan Lee","Draft; index rebuild steps only","Draft")],kb:["RB-3103"],sops:["SOP-BC-108"],data:["DA-IDX","DA-STD"],vendors:["LUM"],sites:["SITE-AZE"],roles:["HR-SEARCH","HR-VND"],lines:["PR1-VEN"],contracts:["CT-103"],risks:["GR-103"],ctls:["GC-206"],proj:"PR2",proc:["BP1","BP2"],wf:true,note:"Draft only. No approved plan exists for this Tier 1 application."}),
 P("BCP-104","Identity (Entra ID) recovery plan","application","svc_id",{tier:1,own:"Rina Okafor",bak:"Colette Brandt",lastReview:iso(-150),vers:[V("1.3",iso(-150),"Rina Okafor","Break-glass accounts rotated","Approved"),V("1.2",iso(-400),"Rina Okafor","Annual review","Retired")],kb:["RB-3104"],sops:["SOP-BC-103"],data:["DA-IDENT"],vendors:["MSF"],sites:["SITE-AZE"],roles:["HR-IAM","HR-IC"],lines:["RB-IT-PLAT"],contracts:["CT-105"],risks:["GR-101"],ctls:["GL-001"],proj:"",proc:["BP1","BP2","BP6","BP8"]}),
 P("BCP-105","Email and collaboration (M365) recovery plan","application","svc_m365",{tier:1,own:"Sam Patel",bak:"Paula Grant",lastReview:iso(-100),vers:[V("1.1",iso(-100),"Sam Patel","Mail routing fallback added","Approved")],kb:[],sops:[],data:["DA-MAIL"],vendors:["MSF"],sites:["SITE-DC","SITE-NOR"],roles:["HR-IAM","HR-COMM"],lines:["RB-IT-PLAT"],contracts:["CT-105"],risks:["GR-101"],ctls:["GC-202"],proc:["BP3","BP6","BP8"]}),
 P("BCP-106","Network and VPN recovery plan","application","svc_net",{tier:1,own:"Ben Ito",bak:"Sam Patel",lastReview:iso(-250),vers:[V("1.4",iso(-250),"Ben Ito","Secondary circuit procedure","Approved")],kb:[],sops:["SOP-BC-104"],data:["DA-CFG"],vendors:["MSF"],sites:["SITE-NOR","SITE-AZE"],roles:["HR-PLAT"],lines:["PR3-HW"],contracts:[],risks:["GR-111"],ctls:[],proj:"PR3",proc:["BP2","BP8"]}),
 P("BCP-201","Contract Repository recovery plan","application","svc_cr",{tier:2,own:"Maya Ortiz",bak:"Theo Marlowe",grp:"G-CAB",lastReview:iso(-130),vers:[V("1.2",iso(-130),"Maya Ortiz","Storage account renamed; tabletop findings applied","Approved")],kb:[],sops:[],data:["DA-CONTR","DA-MAIL"],vendors:["LGD","MSF"],sites:["SITE-AZE"],roles:["HR-VND"],lines:["PR4-CLD","PR4-LIC"],contracts:["CT-109"],risks:["GR-112"],ctls:[],proj:"PR4",proc:["BP5"]}),
 P("BCP-202","Lease subledger (ERP) recovery plan","application","svc_erp",{tier:2,own:"Avery Chen",bak:"Victor Amaya",grp:"G-CAB",lastReview:iso(-280),vers:[V("1.0",iso(-280),"Avery Chen","First approved version","Approved")],kb:[],sops:["SOP-BC-105"],data:["DA-LEDGER"],vendors:["MSF"],sites:["SITE-AZE"],roles:["HR-FIN"],lines:["RB-IT-PLAT"],contracts:["CT-105"],risks:["GR-111"],ctls:[],proc:["BP4"]}),
 P("BCP-203","Data platform recovery plan","application","svc_data",{tier:2,own:"Anil Mehta",bak:"Dev Rao",grp:"G-CAB",lastReview:iso(-90),vers:[V("1.1",iso(-90),"Anil Mehta","Snapshot cadence changed","Approved")],kb:[],sops:[],data:["DA-LAKE"],vendors:["MSF","LUM","BRT"],sites:["SITE-AZE"],roles:["HR-DATA"],lines:["PR2-CLD"],contracts:["CT-104"],risks:[],ctls:[],proj:"PR2",proc:["BP4","BP7"]}),
 P("BCP-204","Finance systems recovery plan","application","svc_fin",{tier:2,status:"In review",own:"Victor Amaya",bak:"Avery Chen",grp:"G-CAB",lastReview:"",vers:[V("0.8",iso(-12),"Victor Amaya","Submitted to the change advisory board","In review")],kb:[],sops:[],data:["DA-LEDGER"],vendors:["MSF"],sites:["SITE-AZE"],roles:["HR-FIN"],lines:["RB-IT-PLAT"],contracts:["CT-105"],risks:[],ctls:[],proc:["BP4"]}),
 P("BCP-301","Norwalk office closure plan","site","SITE-NOR",{tier:1,own:"Wes Hartley",bak:"Maribel Cruz",grp:"G-FAC",lastReview:iso(-180),vers:[V("2.0",iso(-180),"Wes Hartley","Work-from-anywhere is the default alternate","Approved"),V("1.0",iso(-540),"Wes Hartley","First version","Retired")],kb:["RB-3105"],sops:["SOP-BC-106"],sites:["SITE-NOR"],roles:["HR-COMM","HR-IC"],lines:[],contracts:[],risks:[],ctls:[],proc:["BP8"],tree:"ent"}),
 P("BCP-302","Azure East US 2 region loss plan","site","SITE-AZE",{tier:1,own:"Sam Patel",bak:"Ben Ito",lastReview:iso(-95),vers:[V("1.1",iso(-95),"Sam Patel","Central US capacity reservation","Approved")],kb:[],sops:[],sites:["SITE-AZE","SITE-AZC"],vendors:["MSF"],roles:["HR-PLAT"],lines:["PR3-CLD"],contracts:["CT-105"],risks:["GR-101"],ctls:["GC-203"],proj:"PR3",proc:["BP1","BP2"]}),
 P("BCP-401","Standards publishing continuity plan","process","BP1",{tier:1,own:"Elena Marsh",bak:"Noor Haddad",lastReview:iso(-240),vers:[V("1.0",iso(-240),"Elena Marsh","Manual PDF release path","Approved")],kb:[],sops:[],roles:["HR-PUB"],lines:[],contracts:[],risks:["GR-104"],ctls:[],proc:["BP1"],wf:true,note:"Describes the manual release path when the publishing pipeline is down."}),
 P("BCP-501","Northwind Cloud continuity and exit plan","vendor","NWC",{tier:1,own:"Camille Ortega",bak:"Tom Becker",grp:"G-VND",lastReview:iso(-210),vers:[V("1.2",iso(-210),"Camille Ortega","Azure fallback runbook","Approved")],kb:[],sops:["SOP-BC-107"],vendors:["NWC"],sites:["SITE-NWC"],roles:["HR-VND"],lines:["RB-IT-HOST"],contracts:["CT-101"],risks:["GR-108"],ctls:["GC-206"],proc:["BP2"]}),
 P("BCP-901","Enterprise crisis management and communications plan","enterprise","ALL",{tier:1,own:"Sam Patel",bak:"Tom Becker",lastReview:iso(-160),vers:[V("2.3",iso(-160),"Sam Patel","Call tree rebuilt after reorganization","Approved"),V("2.2",iso(-520),"Sam Patel","Annual review","Retired")],kb:["RB-3106"],sops:[],roles:["HR-IC","HR-COMM"],lines:[],contracts:[],risks:["GR-101","GR-107"],ctls:["GC-202"],proc:["BP1","BP2","BP3","BP4","BP5","BP6","BP7","BP8"],tree:"ent",wf:true})];}

function seedExercises(){
 const E=(id,planId,app,type,date,o)=>Object.assign({id,planId,app,type,title:"",date,win:type==="live"?"CW-B":"CW-C",status:"Completed",chg:"",fac:"",fbak:"",grp:"",parts:[],cis:[],scn:"",res:null,notes:""},o);
 const R=(rto,rpo,est,extra)=>Object.assign({rtoA:rto,rpoA:rpo,est:!!est,findings:[],lessons:"",doneOn:""},extra||{});
 return[
 E("EX-2025-014","BCP-101","svc_portal","live","2025-08-09",{fac:"Tom Becker",fbak:"Sam Patel",grp:"G-RC",scn:"Fail the Northwind web tier over to Azure.",res:R(290,22,false,{doneOn:"2025-08-09",lessons:"DNS cutover and certificate binding added 50 minutes."})}),
 E("EX-2026-008","BCP-102","svc_cod","live","2026-03-14",{fac:"Priya Shah",fbak:"Jordan Lee",grp:"G-RC",scn:"Region failover of the editor workspace and publishing pipeline.",res:R(310,12,false,{doneOn:"2026-03-14",findings:["FND-111"],lessons:"Warm-up of the search tier and DNS time to live were the long poles."})}),
 E("EX-2026-004","BCP-104","svc_id","live","2026-02-21",{fac:"Rina Okafor",fbak:"Colette Brandt",grp:"G-RC",scn:"Tenant unavailable; use break-glass accounts and restore policy from export.",res:R(95,0,false,{doneOn:"2026-02-21"})}),
 E("EX-2026-011","BCP-105","svc_m365","live","2026-06-13",{fac:"Sam Patel",fbak:"Paula Grant",grp:"G-RC",scn:"Mail flow through the backup routing service.",res:R(180,0,false,{doneOn:"2026-06-13"})}),
 E("EX-2025-021","BCP-106","svc_net","live","2025-11-08",{fac:"Ben Ito",fbak:"Sam Patel",grp:"G-RC",scn:"Primary internet circuit cut; secondary carries traffic.",res:R(35,0,false,{doneOn:"2025-11-08"})}),
 E("EX-2026-012","BCP-201","svc_cr","tabletop","2026-05-14",{fac:"Maya Ortiz",fbak:"Theo Marlowe",grp:"G-CAB",scn:"Repository database corruption discovered on Monday morning.",res:R(360,240,true,{doneOn:"2026-05-14",findings:["FND-112"],lessons:"The restore steps named a storage account retired in March."})}),
 E("EX-2025-019","BCP-202","svc_erp","tabletop","2025-11-05",{fac:"Avery Chen",fbak:"Victor Amaya",grp:"G-CAB",scn:"ERP unavailable on the third working day of close.",res:R(480,60,true,{doneOn:"2025-11-05"})}),
 E("EX-2026-009","BCP-203","svc_data","live","2026-04-18",{fac:"Anil Mehta",fbak:"Dev Rao",grp:"G-CAB",scn:"Restore the lakehouse snapshot into the recovery subscription.",res:R(420,1440,false,{doneOn:"2026-04-18"})}),
 E("EX-2026-013","","svc_int","live","2026-05-30",{fac:"Jordan Lee",fbak:"Carla Reyes",grp:"G-CAB",scn:"API gateway region failover.",res:R(150,0,false,{doneOn:"2026-05-30"})}),
 E("EX-2025-024","","svc_fin","live","2025-12-06",{fac:"Victor Amaya",fbak:"Avery Chen",grp:"G-CAB",scn:"Reporting server rebuild and ledger replica promotion.",res:R(540,15,false,{doneOn:"2025-12-06"})}),
 E("EX-2025-025","","svc_desk","tabletop","2025-12-12",{fac:"Tom Becker",fbak:"Priti Joshi",grp:"G-AOF",scn:"Service desk phone system down; chat and email only.",res:R(240,0,true,{doneOn:"2025-12-12"})}),
 E("EX-2026-006","","app_wiki","review","2026-04-02",{fac:"Wes Hartley",fbak:"Maribel Cruz",grp:"G-AOF",scn:"Documented review of the rebuild steps.",res:R(0,0,true,{doneOn:"2026-04-02"})}),
 E("EX-2026-022","","svc_end","tabletop",iso(-1),{status:"In progress",fac:"Tom Becker",fbak:"Ines Duarte",grp:"G-AOF",scn:"Intune tenant locked; reenroll 640 devices by Autopilot.",parts:["Tom Becker","Ines Duarte","Colette Brandt","Wes Hartley"]}),
 E("EX-2026-021","BCP-101","svc_portal","live",iso(14),{status:"Planned",fac:"Tom Becker",fbak:"Sam Patel",grp:"G-RC",scn:"Rehearse the Portal failover to Azure Central US including the member database.",cis:["ci_por0","ci_por1","ci_por3","ci_por4"],parts:["Tom Becker","Sam Patel","Ben Ito","Leila Haddad"],notes:"Matches decision D5 awaiting executive approval."}),
 E("EX-2026-024","BCP-106","svc_net","live",iso(28),{status:"Planned",fac:"Ben Ito",fbak:"Sam Patel",grp:"G-RC",scn:"Repeat the circuit cut with a VPN gateway restart.",cis:["ci_vpn","ci_fw"]}),
 E("EX-2026-025","BCP-202","svc_erp","live","2026-11-18",{status:"Planned",win:"CW-A",fac:"Avery Chen",fbak:"Victor Amaya",grp:"G-CAB",scn:"Promote the ledger replica and run the close checklist.",cis:["ci_erp0","ci_erp1","ci_erp2"]}),
 E("EX-2026-026","BCP-204","svc_fin","tabletop",iso(40),{status:"Planned",fac:"Victor Amaya",fbak:"Avery Chen",grp:"G-CAB",scn:"Accounts payable unavailable during the vendor payment run."}),
 E("EX-2026-027","BCP-901","","tabletop",iso(60),{status:"Planned",fac:"Sam Patel",fbak:"Tom Becker",grp:"G-RC",scn:"Enterprise tabletop: ransomware found on a Friday evening; communications and decisions.",parts:["Casey Rowan","Marcus Reid","Catherine Doyle","Leila Haddad","Rina Okafor"]})];}

function seedDecl(){return[{id:"DEC-001",planId:"BCP-101",title:"Northwind hosting degradation (drill)",inc:"",sev:"P2",by:"Tom Becker",at:iso(-300)+" 14:05",status:"Closed",sim:true,inst:"",notified:["Tom Becker","Sam Patel","Rina Okafor","Casey Rowan"],tl:[["Declared",iso(-300)+" 14:05","Tom Becker"],["Bridge open",iso(-300)+" 14:12","Tom Becker"],["Recovered",iso(-300)+" 17:40","Sam Patel"],["Closed",iso(-299)+" 09:30","Tom Becker"]]}]}

function seed(){return{
 v:1,programStart:"2026-03-01",
 fw:{name:"BETH3D",opts:[{n:"BETH3-D",why:"Keeps the BETH3 you know and marks Data as the new dimension with a hyphen."},{n:"DEBTH3",why:"Puts Data first because the data is what you recover first and the thing nobody can rebuild."},{n:"THEB-D3",why:"Starts with Technology, the dimension most teams exercise first, and groups Data with the third parties it depends on."}],dims:DIMS(),history:[{v:"1",date:iso(-3200),by:"Original author",change:"BETH3: Buildings, Equipment, Technology, Human resources, Third parties"},{v:"2",date:TODAY,by:"Resilience program",change:"Data added as a sixth dimension; name BETH3D proposed"}]},
 tiers:TIERS(),wins:WINDOWS(),groups:GROUPS(),
 map:{"1 - Mission critical":1,"2 - Somewhat critical":2,"3 - Less critical":3,"4 - Not critical":4},
 cls:{svc_end:{crit:3,reason:"Devices re-enroll through Autopilot; nothing else restores from it.",by:"Tom Becker",at:iso(-90)},svc_desk:{crit:3,reason:"Staff can use email and chat while the desk tools recover.",by:"Tom Becker",at:iso(-90)}},
 appx:APPX(),appown:JSON.parse(JSON.stringify(APPOWN)),bps:BPS(),sites:SITES(),equip:EQUIP(),data:DATA(),roles:ROLES(),vendors:VENDORS(),cix:JSON.parse(JSON.stringify(CIX)),
 plans:seedPlans(),ex:seedExercises(),decl:seedDecl(),sops:SOPS(),comms:COMMS(),trees:{ent:TREE_ENT},kbMade:{},log:[]}}

S.bc.d=S.bc.d||seed();
const D=()=>S.bc.d;BX.D=D;BX.reset=()=>{S.bc.d=seed();BX.bump()};
G(()=>{if(window.STORE&&STORE.track)STORE.track("bc.d")});
BX.save=()=>{};

/* findings seeded in the GRC register (FN shape) so exercise results trace to Issues and findings */
G(()=>{const X=window.GRCX;if(!X||!X.findings)return;const have=new Set(X.findings.map(f=>f.id));
 const FN=(id,t,sev,own,bak,due,st,o)=>Object.assign({id,t,src:"Self-identified",sref:"",sev,own,bak,due,st,ctl:"",risk:"",vend:"",steps:[],opened:iso(-20),debt:"",desc:""},o);
 if(!have.has("FND-111"))X.findings.push(FN("FND-111","Standards Platform failover missed the 4-hour target by 70 minutes","High","Priya Shah","Jordan Lee",iso(21),"In remediation",{sref:"EX-2026-008",ctl:"GC-203",risk:"GR-111",opened:"2026-03-20",desc:"The March live failover took 5 h 10 min. DNS time to live and search warm-up were the long poles.",steps:[{n:"Lower DNS time to live to 60 seconds",own:"Ben Ito",due:iso(-20),done:true},{n:"Pre-warm the search tier in the recovery region",own:"Jordan Lee",due:iso(10),done:false},{n:"Re-test in the next live window",own:"Priya Shah",due:iso(21),done:false}]}));
 if(!have.has("FND-112"))X.findings.push(FN("FND-112","Contract Repository restore steps name a retired storage account","Medium","Maya Ortiz","Theo Marlowe",iso(-4),"In remediation",{sref:"EX-2026-012",opened:"2026-05-20",desc:"Found in the May tabletop. The plan was updated in v1.2 but the runbook was not.",steps:[{n:"Correct the runbook",own:"Maya Ortiz",due:iso(-4),done:false}]}))});

/* ------------------------------------------------------------------ applications and classification ------------------------------------------------------------------ */
const critOf=a=>{const o=D().cls[a.id];return o?o.crit:(a.crit||1)};
BX.apps=()=>memo("apps",()=>{const d=D();const base=arr(G(()=>SVCREG,[])).map(s=>({id:s.id,n:s.n,svc:s,crit:s.tier==="Tier 1"?1:2,src:"Service catalog tier "+s.tier,users:s.users,avail:s.avail,deps:s.deps,cost:s.cost,
   sites:d.sites.filter(x=>x.apps.includes(s.id)).map(x=>x.id),cisDirect:arr(G(()=>CIREG,[])).filter(c=>c.svc===s.id).map(c=>c.id)}));
 const extra=d.appx.map(a=>({id:a.id,n:a.n,svc:null,crit:a.crit,src:"CMDB business criticality",users:0,avail:null,deps:[],cost:0,sites:a.sites,cisDirect:a.cis,note:a.note,vendors:a.vendors,process:a.process}));
 return base.concat(extra).map(a=>{const c=critOf(a);const tn=d.map[BX.critName(c)]||c;const tier=d.tiers.find(t=>t.t===tn)||d.tiers[1];const ov=d.cls[a.id];
  const ow=d.appown[a.id]||["Sam Patel","Tom Becker"];
  return Object.assign(a,{crit:c,critName:BX.critName(c),tier:tier.t,pol:tier,override:ov||null,own:ow[0],bak:ow[1],rtoT:tier.rto,rpoT:tier.rpo,mtd:tier.mtd})})});
BX.critName=n=>["","1 - Mission critical","2 - Somewhat critical","3 - Less critical","4 - Not critical"][n];
BX.app=id=>BX.apps().find(a=>a.id===id||a.n===id)||null;
BX.tierOf=t=>D().tiers.find(x=>x.t===t);
BX.tierLabel=t=>{const x=BX.tierOf(t);return x?x.n+(t===1?" (Alpha)":""):"Tier "+t};

/* ------------------------------------------------------------------ CI sets, recovery attributes ------------------------------------------------------------------ */
const CIS=()=>arr(G(()=>CIREG,[]));
const ciById=id=>CIS().find(c=>c.id===id||c.name===id)||null;BX.ci=ciById;
BX.ciSet=appId=>memo("ciSet:"+appId,()=>{const a=BX.app(appId);if(!a)return[];const seen=new Set(),out=[];const svcSeen=new Set();
 const addSvc=sid=>{if(svcSeen.has(sid))return;svcSeen.add(sid);const s=arr(G(()=>SVCREG,[])).find(x=>x.id===sid);if(!s)return;CIS().filter(c=>c.svc===sid).forEach(c=>walk(c.id,sid===appId?"direct":"via "+s.n));s.deps.forEach(addSvc)};
 const walk=(id,via)=>{if(seen.has(id))return;seen.add(id);out.push({id,via});arr(G(()=>CIEDGE,[])).filter(e=>e[0]===id).forEach(e=>walk(e[1],"depends on"))};
 if(a.svc)addSvc(a.id);else a.cisDirect.forEach(id=>walk(id,"direct"));
 return out});
const DRL={replica:"Geo replica",rebuild:"Rebuild from code",backup:"Restore from backup",pair:"Active pair",provider:"Provider managed",none:"None recorded"};BX.DRL=DRL;
BX.ciRec=id=>{const c=ciById(id);if(!c)return null;const x=D().cix[c.id]||{};const hasOwn=!(("own" in x)&&x.own===null);
 const apps=BX.ciApps(c.id);const top=apps.reduce((m,a)=>Math.min(m,a.tier),9);
 const own=hasOwn?(x.own||((BX.app(c.svc)||{}).own)||c.owner):"";
 const cl=String(c.class||"");const dr=x.dr||(/Database/.test(cl)?"backup":/Virtual machine|Application/.test(cl)?"rebuild":/Storage/.test(cl)?"replica":/Network/.test(cl)?"pair":"provider");
 const red=x.red||(/Cloud/.test(cl)?"2n":"n+1");
 return{id:c.id,name:c.name,class:cl,svc:c.svc,own,grp:c.grp||"Platform team",tier:top===9?null:top,apps,dr,red,spof:red==="single"&&top<=1,crit:c.crit}};
BX.ciApps=ciId=>memo("ciApps:"+ciId,()=>BX.apps().filter(a=>BX.ciSet(a.id).some(x=>x.id===ciId)));
BX.allCis=()=>memo("allCis",()=>CIS().map(c=>BX.ciRec(c.id)));

/* ------------------------------------------------------------------ components of an application, by dimension ------------------------------------------------------------------ */
BX.comps=()=>memo("comps",()=>{const d=D();const out=[];
 d.sites.forEach(s=>out.push({dim:"B",id:s.id,n:s.n,kind:s.kind,own:s.owner,bak:s.bak,apps:s.apps.slice()}));
 d.equip.forEach(e=>{const s=d.sites.find(x=>x.id===e.site);out.push({dim:"E",id:e.id,n:e.n,kind:e.kind,own:e.owner,bak:e.bak,apps:s?s.apps.slice():[],site:e.site})});
 BX.allCis().forEach(c=>out.push({dim:"T",id:c.id,n:c.name,kind:c.class,own:c.own,bak:"",apps:c.apps.map(a=>a.id),ci:true}));
 d.data.forEach(x=>out.push({dim:"D",id:x.id,n:x.n,kind:x.cls,own:x.owner,bak:x.bak,apps:x.apps.slice()}));
 d.roles.forEach(r=>out.push({dim:"H",id:r.id,n:r.n,kind:"Role",own:r.primary,bak:r.succ,apps:r.apps.slice()}));
 d.vendors.forEach(v=>{const n=G(()=>S.bud.vend.find(x=>x.id===v.id).n,v.id);out.push({dim:"3",id:v.id,n,kind:"Vendor",own:G(()=>S.bud.vend.find(x=>x.id===v.id).own,""),bak:"",apps:v.apps.slice()})});
 return out});
BX.compsOf=appId=>BX.comps().filter(c=>c.apps.includes(appId));
BX.comp=id=>BX.comps().find(c=>c.id===id)||null;
BX.dim=k=>D().fw.dims.find(x=>x.k===k);

/* ------------------------------------------------------------------ plans and exercises ------------------------------------------------------------------ */
BX.plans=()=>D().plans;
BX.plan=id=>D().plans.find(p=>p.id===id)||null;
BX.planOf=appId=>{const ps=D().plans.filter(p=>p.kind==="application"&&p.scope===appId&&p.status!=="Retired");return ps.find(p=>p.status==="Approved")||ps[0]||null};
BX.exs=()=>D().ex;
BX.ex=id=>D().ex.find(e=>e.id===id)||null;
const exApp=e=>e.app||((BX.plan(e.planId)||{}).scope)||"";
BX.exApp=exApp;
BX.exsOf=appId=>D().ex.filter(e=>exApp(e)===appId);
BX.lastDone=appId=>BX.exsOf(appId).filter(e=>e.status==="Completed").sort((a,b)=>b.date.localeCompare(a.date))[0]||null;
BX.passed=e=>{if(!e||!e.res)return null;const a=BX.app(exApp(e));if(!a)return null;return{rto:e.res.rtoA<=a.rtoT,rpo:e.res.rpoA<=a.rpoT}};
/* next exercise obligation for an application */
BX.obligation=appId=>memo("obl:"+appId,()=>{const a=BX.app(appId);if(!a)return null;const pol=a.pol,last=BX.lastDone(appId);
 const open=BX.exsOf(appId).filter(e=>e.status==="Planned"||e.status==="In progress").sort((x,y)=>x.date.localeCompare(y.date));
 let type=pol.type==="alternate"?(last?(last.type==="live"?"tabletop":"live"):"live"):pol.type;
 let due,basis;const pass=last?BX.passed(last):null;
 if(last){due=addM(last.res&&last.res.doneOn||last.date,pol.months);basis="12 months after the last "+TYPEN[last.type].toLowerCase()+" on "+BX.date(last.date);
  if(pass&&(!pass.rto||!pass.rpo)&&pol.type!=="review"){const rt=addD(last.date,pol.retest);if(rt<due){due=rt;type=last.type==="review"?"review":"live";basis="Targets missed on "+BX.date(last.date)+": re-test within "+pol.retest+" days"}}}
 else{due=addD(D().programStart,pol.firstDays);basis="Never exercised: first exercise due "+pol.firstDays+" days after the program start"}
 const sched=open.find(e=>e.date<=addD(due,30))||open[0]||null;
 const ok=open.find(e=>e.type===type&&e.date<=due)||null;
 let status;
 if(ok)status=ok.status==="In progress"?"In progress":"Scheduled";
 else if(open.some(e=>e.status==="In progress"))status="In progress";
 else if(due<TODAY)status="Overdue";
 else if(days(due)<=60)status="Due soon";else status="Current";
 if(sched&&!ok&&status!=="In progress"){status=due<TODAY?"Overdue":"Scheduled late"}
 return{app:a,tier:a.tier,type,typeName:TYPEN[type],due,basis,status,last,pass,open,sched:ok||sched,daysSince:last?-days(last.date):null,daysTo:days(due)}});
BX.obligations=()=>BX.apps().map(a=>BX.obligation(a.id)).filter(Boolean);
/* CI obligations: a CI inherits the strictest tier of the applications that depend on it */
BX.ciObligation=ciId=>{const r=BX.ciRec(ciId);if(!r||!r.tier)return null;const t=BX.tierOf(r.tier);const win=addM(TODAY,-t.months);
 const cov=D().ex.filter(e=>e.status==="Completed"&&e.date>=win&&(r.apps.some(a=>a.id===exApp(e))&&(e.type==="live"||e.type==="tabletop"||e.type==="review")));
 const live=cov.find(e=>e.type==="live"&&(arr(e.cis).length===0||arr(e.cis).includes(ciId)||BX.ciDirect(exApp(e),ciId)));
 return{ci:r,tier:r.tier,required:t.type==="alternate"?"live or tabletop":t.type,covered:!!cov.length,live:!!live,last:cov.sort((a,b)=>b.date.localeCompare(a.date))[0]||null}};
BX.ciDirect=(appId,ciId)=>{const x=BX.ciSet(appId).find(s=>s.id===ciId);return !!x&&x.via==="direct"};

/* ------------------------------------------------------------------ change windows and conflicts ------------------------------------------------------------------ */
BX.freezes=()=>arr(G(()=>ITSMX.freezes,[])).length?ITSMX.freezes:[{id:"fz1",n:"Financial close freeze",from:"2026-11-16",to:"2026-11-20",kind:"Blackout",why:"No Tier 1 or finance system changes."},{id:"fz2",n:"Thanksgiving reduced staffing",from:"2026-11-25",to:"2026-11-27",kind:"Restricted",why:"Standard changes only."},{id:"fz3",n:"Year-end freeze",from:"2026-12-21",to:"2027-01-04",kind:"Blackout",why:"Audit and year-end processing."}];
BX.winOf=id=>D().wins.find(w=>w.id===id)||null;
BX.openChanges=()=>arr(G(()=>ITSMX.changes,[])).filter(c=>c.st!=="Closed"&&c.st!=="Rejected"&&c.st!=="Cancelled"&&c.start&&!c.hist);
/* conflicts for a draft/planned exercise {app,type,date,win,id} */
BX.conflicts=(x)=>{const out=[];const a=BX.app(x.app||exApp(x));const t=a?a.pol:null;const d=x.date;if(!d)return[["bad","No date chosen"]];
 const w=BX.winOf(x.win);const live=x.type==="live";
 if(d<TODAY)out.push(["warn","Date is in the past"]);
 if(live){if(!w||!w.live)out.push(["bad","A live failover needs an approved change window; "+(w?w.n+" is for business hours":"none chosen")]);
  else if(!w.dows.includes(dow(d)))out.push(["bad",w.n+" runs on "+w.dows.map(i=>["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][i]).join(", ")+"; "+BX.date(d)+" is a "+["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dow(d)]]);
  if(t&&!t.wins.includes(x.win)&&w&&w.live)out.push(["warn",t.n+" policy prefers "+t.wins.map(i=>(BX.winOf(i)||{}).n).join(" or ")]);
  BX.freezes().forEach(f=>{if(d>=f.from&&d<=f.to)out.push([f.kind==="Blackout"?"bad":"warn",(f.kind==="Blackout"?"Inside blackout: ":"Restricted period: ")+f.n+" ("+BX.date(f.from)+" to "+BX.date(f.to)+"). "+(f.kind==="Blackout"?"No live exercise may run.":"Only Standard changes; a live failover is a Normal change.")])});
  if(t&&days(d)<t.notice)out.push(["warn","Less than "+t.notice+" days of notice for "+t.n+" ("+Math.max(0,days(d))+" days left); needs expedited change approval"]);
  const sv=a&&a.svc?a.n:"";const cis=arr(x.cis).length?x.cis:(a?BX.ciSet(a.id).filter(s=>s.via==="direct").map(s=>s.id):[]);const cn=cis.map(i=>(ciById(i)||{}).name).filter(Boolean);
  BX.openChanges().forEach(c=>{if(x.chg&&c.id===x.chg)return;if(d<c.start||d>(c.end||c.start))return;const sh=arr(c.cis).filter(n=>cn.includes(n));if(sh.length)out.push(["bad",c.id+" touches "+sh.join(", ")+" on the same day"]);else if(sv&&c.svc===sv)out.push(["warn",c.id+" changes the same service ("+sv+") that day"])});
  arr(G(()=>S.obs.wins,[])).forEach(mw=>{if(mw.on&&mw.kind==="weekly"&&mw.dow===dow(d)&&arr(mw.cis).some(i=>cis.includes(i)))out.push(["info","Maintenance window "+mw.n+" (alert suppression) overlaps"])})}
 else{BX.freezes().forEach(f=>{if(d>=f.from&&d<=f.to&&f.kind==="Blackout"&&a&&a.tier<=2)out.push(["info","Blackout period "+f.n+": key owners may be unavailable"])});
  if(w&&!w.dows.includes(dow(d))&&w.id==="CW-C")out.push(["warn","Business hours window: "+BX.date(d)+" is a weekend"])}
 D().ex.forEach(o=>{if(o.id!==x.id&&o.date===d&&o.status!=="Completed"&&o.status!=="Cancelled"&&(o.fac===x.fac&&x.fac||exApp(o)===(x.app||exApp(x))))out.push(["warn",o.id+" is on the same day with the same "+(o.fac===x.fac?"facilitator":"application")])});
 return out};
BX.conflictsOf=e=>e.status==="Completed"||e.status==="Cancelled"?[]:BX.conflicts(e);

/* ------------------------------------------------------------------ gaps ------------------------------------------------------------------ */
BX.gaps=()=>memo("gaps",()=>{const g=[];const d=D();const add=(k,sev,what,ref,type,why,own)=>g.push({k,sev,what,ref,type,why,own:own||""});
 BX.apps().forEach(a=>{const p=BX.planOf(a.id);
  if(a.tier===1&&(!p||p.status!=="Approved"))add("noplan","bad",a.n+" has "+(p?"only a "+p.status.toLowerCase()+" plan":"no plan"),a.id,"app","Tier 1 application without an approved plan",a.own);
  else if(a.tier===2&&!p)add("noplan","warn",a.n+" has no plan",a.id,"app","Tier 2 application without a plan",a.own);
  const o=BX.obligation(a.id);if(o.status==="Overdue")add("overdue",a.tier===1?"bad":"warn",a.n+": "+o.typeName.toLowerCase()+" overdue since "+BX.date(o.due),a.id,"app",o.basis,a.own);
  if(p&&p.status==="Approved"&&(!o.last||days(o.last.date)<-400)&&a.tier<=2)add("stale","warn",p.id+" has no exercise in the last 13 months",p.id,"plan","Plan without recent exercise",p.own)});
 BX.plans().forEach(p=>{if(p.status==="Approved"&&p.lastReview&&days(addM(p.lastReview,p.cadence))<0)add("review","warn",p.id+" review overdue since "+BX.date(addM(p.lastReview,p.cadence)),p.id,"plan","Plan review cadence "+p.cadence+" months",p.own);
  if(p.status==="Approved"&&!p.kb.length&&p.tier===1&&p.kind==="application")add("kb","info",p.id+" has no knowledge article",p.id,"plan","Tier 1 plan without a linked article",p.own)});
 BX.allCis().forEach(c=>{if(c.tier&&c.tier<=2&&!c.own)add("ciown",c.tier===1?"bad":"warn",c.name+" has no recovery owner",c.id,"ci","Tier "+c.tier+" CI without a recovery owner",""); if(c.spof)add("spof","warn",c.name+" is a single point of failure for a Tier 1 application",c.id,"ci","No redundancy and no replica",c.own)});
 d.vendors.forEach(v=>{const hi=v.apps.map(i=>BX.app(i)).filter(Boolean).reduce((m,a)=>Math.min(m,a.tier),9);const n=G(()=>S.bud.vend.find(x=>x.id===v.id).n,v.id);
  if(hi<=2&&!v.exit)add("exit",hi===1?"bad":"warn",n+" supports a Tier "+hi+" application and has no exit plan",v.id,"vendor",v.exitDoc||"No exit or substitution plan",G(()=>S.bud.vend.find(x=>x.id===v.id).own,""));
  if(hi<=2&&(!v.attDate||days(v.attDate)<-365))add("vatt",hi===1?"warn":"info",n+": continuity evidence missing or older than 12 months",v.id,"vendor",v.att,"")});
 d.data.forEach(x=>{const hi=x.apps.map(i=>BX.app(i)).filter(Boolean).reduce((m,a)=>Math.min(m,a.tier),9);if(hi>2)return;
  if(!x.restore||days(x.restore)<-365)add("restore",hi===1?"bad":"warn",x.n+": no proven restore in 12 months",x.id,"data","Last restore "+(x.restore?BX.date(x.restore):"never"),x.owner);
  else if(x.rpoA>x.rpoT)add("rpo","warn",x.n+": recovery point "+BX.mins(x.rpoA)+" exceeds target "+BX.mins(x.rpoT),x.id,"data","Backup frequency does not meet RPO",x.owner)});
 d.equip.forEach(e=>{if(days(addM(e.last,e.months))<0)add("equip","warn",e.n+": test overdue since "+BX.date(addM(e.last,e.months)),e.id,"equip","Test cadence "+e.months+" months",e.owner)});
 d.roles.forEach(r=>{if(!r.succ)add("succ","warn",r.n+": no named successor ("+r.primary+")",r.id,"role","Single-person dependency",r.primary)});
 return g});
BX.GAPK={noplan:"Tier 1 and 2 applications without an approved plan",overdue:"Exercises overdue",stale:"Plans without a recent exercise",review:"Plan reviews overdue",kb:"Tier 1 plans without a knowledge article",ciown:"CIs without a recovery owner",spof:"Single points of failure",exit:"Vendors without an exit plan",vatt:"Vendor continuity evidence",restore:"Data without a proven restore",rpo:"Recovery point above target",equip:"Equipment tests overdue",succ:"Roles without a successor"};

/* ------------------------------------------------------------------ metrics and maturity ------------------------------------------------------------------ */
BX.dimScore=(appId,k)=>memo("ds:"+appId+k,()=>{const d=D();const a=BX.app(appId);if(!a)return null;const pct=(n,m)=>m?Math.round(100*n/m):null;
 if(k==="B"){const ss=d.sites.filter(s=>s.apps.includes(appId)||(s.vend&&false));if(!ss.length)return null;const ok=ss.filter(s=>{const pl=d.plans.find(p=>p.kind==="site"&&p.scope===s.id&&p.status==="Approved")||(s.kind==="Cloud region"&&d.plans.find(p=>p.kind==="site"&&p.status==="Approved"&&p.sites.includes(s.id)));return pl&&days(addM(pl.lastReview||"2000-01-01",pl.cadence))>=0}).length;return pct(ok,ss.length)}
 if(k==="E"){const es=d.equip.filter(e=>{const s=d.sites.find(x=>x.id===e.site);return s&&s.apps.includes(appId)});if(!es.length)return null;return pct(es.filter(e=>days(addM(e.last,e.months))>=0).length,es.length)}
 if(k==="T"){const cs=BX.ciSet(appId).map(x=>BX.ciRec(x.id)).filter(Boolean);if(!cs.length)return null;const own=cs.filter(c=>c.own).length,dr=cs.filter(c=>c.dr!=="none").length,sp=cs.filter(c=>c.red==="single").length;return Math.round((pct(own,cs.length)+pct(dr,cs.length)+pct(cs.length-sp,cs.length))/3)}
 if(k==="D"){const ds=d.data.filter(x=>x.apps.includes(appId));if(!ds.length)return null;const ok=ds.map(x=>[!!x.restore&&days(x.restore)>=-365&&x.restoreOk!==false,x.rpoA<=x.rpoT,x.offsite,x.integ.ok!==null]);return Math.round(100*ok.reduce((s,r)=>s+r.filter(Boolean).length,0)/(ok.length*4))}
 if(k==="H"){const rs=d.roles.filter(r=>r.apps.includes(appId));if(!rs.length)return null;return Math.round(100*rs.reduce((s,r)=>s+(r.succ?.5:0)+(r.cross.length?.5:0),0)/rs.length)}
 if(k==="3"){const vs=d.vendors.filter(v=>v.apps.includes(appId));if(!vs.length)return null;const ok=vs.map(v=>[v.exit,!!v.attDate&&days(v.attDate)>=-365,!v.slaRto||v.slaRto<=a.rtoT*(a.tier===1?1:3)]);return Math.round(100*ok.reduce((s,r)=>s+r.filter(Boolean).length,0)/(ok.length*3))}
 return null});
BX.appStats=appId=>memo("as:"+appId,()=>{const a=BX.app(appId);if(!a)return null;const p=BX.planOf(appId),o=BX.obligation(appId),l=o.last,ps=l?BX.passed(l):null;
 const dims={};D().fw.dims.forEach(x=>dims[x.k]=BX.dimScore(appId,x.k));
 const vals=Object.values(dims).filter(v=>v!==null);const dimAvg=vals.length?Math.round(vals.reduce((s,v)=>s+v,0)/vals.length):0;
 const comps=BX.compsOf(appId);const spof=comps.filter(c=>{if(c.ci)return BX.ciRec(c.id).red==="single"&&!BX.ciRec(c.id).apps.length?false:BX.ciRec(c.id).red==="single";if(c.dim==="H"){const r=D().roles.find(x=>x.id===c.id);return r&&!r.succ}if(c.dim==="E"){const e=D().equip.find(x=>x.id===c.id);return e&&e.red==="single"}if(c.dim==="3"){const v=D().vendors.find(x=>x.id===c.id);return v&&v.sole&&!v.exit}return false}).length;
 let lvl=1;const planOk=p&&p.status==="Approved";if(planOk)lvl=2;if(planOk&&o.last&&o.status!=="Overdue")lvl=3;if(lvl===3&&ps&&ps.rto&&ps.rpo&&dimAvg>=70)lvl=4;if(lvl===4&&spof===0&&dimAvg>=85&&p.wf)lvl=5;
 return{app:a,plan:p,planOk:!!planOk,obl:o,last:l,rtoA:l?l.res.rtoA:null,rpoA:l?l.res.rpoA:null,rtoOk:ps?ps.rto:null,rpoOk:ps?ps.rpo:null,daysSince:o.daysSince,dims,dimAvg,spof,lvl,compN:comps.length}});
BX.ML=["","Initial","Planned","Exercised","Measured","Optimized"];
BX.MLdesc=["","No approved plan; recovery is improvised.","Approved plan exists.","Exercised inside the tier schedule.","Targets met in the last exercise and dimensions at 70% or more.","Targets met, no single point of failure, dimensions at 85% or more, recovery automated."];
BX.tone=v=>v>=80?"good":v>=50?"warn":"bad";

BX.calc=()=>memo("calc",()=>{const st=BX.apps().map(a=>BX.appStats(a.id));const t12=st.filter(s=>s.app.tier<=2),t1=st.filter(s=>s.app.tier===1);const pc=(n,m)=>m?Math.round(1000*n/m)/10:0;
 const ex=st.filter(s=>s.last&&s.app.tier<=2);const ciIn=BX.allCis().filter(c=>c.tier&&c.tier<=2);
 const venT=D().vendors.filter(v=>v.apps.some(i=>(BX.app(i)||{tier:9}).tier<=2));const dataT=D().data.filter(x=>x.apps.some(i=>(BX.app(i)||{tier:9}).tier<=2));
 const oblAll=st.map(s=>s.obl);
 const R={plan:pc(t12.filter(s=>s.planOk).length,t12.length),planN:t12.filter(s=>s.planOk).length,planD:t12.length,
  exComp:pc(oblAll.filter(o=>o.status!=="Overdue").length,oblAll.length),exN:oblAll.filter(o=>o.status!=="Overdue").length,exD:oblAll.length,
  rto:pc(ex.filter(s=>s.rtoOk).length,ex.length),rtoN:ex.filter(s=>s.rtoOk).length,rtoD:ex.length,
  rpo:pc(ex.filter(s=>s.rpoOk).length,ex.length),rpoN:ex.filter(s=>s.rpoOk).length,rpoD:ex.length,
  spof:BX.allCis().filter(c=>c.spof).length+D().roles.filter(r=>!r.succ&&r.apps.some(i=>(BX.app(i)||{tier:9}).tier===1)).length+D().equip.filter(e=>e.red==="single"&&D().sites.some(s=>s.id===e.site&&s.apps.some(i=>(BX.app(i)||{tier:9}).tier===1))).length,
  days:t1.filter(s=>s.daysSince!=null).length?Math.round(t1.filter(s=>s.daysSince!=null).reduce((s,x)=>s+x.daysSince,0)/t1.filter(s=>s.daysSince!=null).length):0,
  ciOwn:pc(ciIn.filter(c=>c.own).length,ciIn.length),ciOwnN:ciIn.filter(c=>c.own).length,ciOwnD:ciIn.length,
  exit:pc(venT.filter(v=>v.exit).length,venT.length),exitN:venT.filter(v=>v.exit).length,exitD:venT.length,
  restore:pc(dataT.filter(x=>x.restore&&days(x.restore)>=-365&&x.restoreOk!==false).length,dataT.length),restoreN:dataT.filter(x=>x.restore&&days(x.restore)>=-365&&x.restoreOk!==false).length,restoreD:dataT.length,
  mat:t1.length?Math.round(10*t1.reduce((s,x)=>s+x.lvl,0)/t1.length)/10:0,overdue:oblAll.filter(o=>o.status==="Overdue").length,
  dimAvg:{}};
 D().fw.dims.forEach(x=>{const v=st.map(s=>s.dims[x.k]).filter(y=>y!==null&&y!==undefined);R.dimAvg[x.k]=v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):0});
 return R});

const MET={
 m_bc_plan_cov:{n:"Continuity plan coverage",f:"Tier 1 and Tier 2 applications with an approved plan ÷ Tier 1 and Tier 2 applications × 100",u:"%",cur:0,tgt:100,badAt:70,dir:"max",max:100,tr:[40,46,53,60,60,66,66,70],owner:"Sam Patel",use:["Continuity plans","Recovery tiers","Resilience overview","Resilience metrics"],rem:{kind:"sop",ref:"SOP-BC-PLAN",title:"Write and approve the missing plan",agent:"Ops Agent",auto:false,state:"idle",prog:"Lists Tier 1 and 2 applications with no approved plan and drafts the outline from the CMDB"}},
 m_bc_ex_comp:{n:"Exercise compliance",f:"Applications whose next required exercise is not overdue ÷ all applications × 100 (required exercise comes from the tier policy)",u:"%",cur:0,tgt:95,badAt:75,dir:"max",max:100,tr:[60,64,70,72,75,78,76,78],owner:"Sam Patel",use:["Resilience overview","Exercise calendar"],rem:{kind:"sop",ref:"SOP-BC-EX",title:"Schedule the overdue exercise in the next window",agent:"Ops Agent",auto:false,state:"idle",prog:"Proposes the next approved window that clears freezes and collisions"}},
 m_bc_rto_att:{n:"Recovery time attainment",f:"Tier 1 and 2 applications whose last exercise recovered within the RTO target ÷ Tier 1 and 2 applications with a completed exercise × 100",u:"%",cur:0,tgt:90,badAt:60,dir:"max",max:100,tr:[50,50,55,60,62,60,66,66],owner:"Sam Patel",use:["Declare disaster","Recovery tiers","Resilience overview","Resilience metrics"],rem:{kind:"sop",ref:"SOP-BC-RTO",title:"Shorten the recovery path and re-test",agent:"Ops Agent",auto:false,state:"idle",prog:"Shows the longest step from each missed exercise"}},
 m_bc_rpo_att:{n:"Recovery point attainment",f:"Tier 1 and 2 applications whose last exercise lost no more data than the RPO target ÷ Tier 1 and 2 applications with a completed exercise × 100",u:"%",cur:0,tgt:90,badAt:60,dir:"max",max:100,tr:[60,62,64,66,70,70,72,73],owner:"Anil Mehta",use:["Resilience overview","Resilience metrics"],rem:{kind:"sop",ref:"SOP-BC-RPO",title:"Increase backup or replication frequency",agent:"Ops Agent",auto:false,state:"idle",prog:"Compares each data asset's frequency with its RPO"}},
 m_bc_spof:{n:"Single points of failure",f:"CIs with no redundancy supporting a Tier 1 application + Tier 1 roles without a successor + single-instance equipment at Tier 1 sites",u:"",cur:0,tgt:3,badAt:10,dir:"min",max:30,tr:[17,16,16,15,14,14,13,13],owner:"Sam Patel",use:["Resilience overview","Continuity traceability"],rem:{kind:"sop",ref:"SOP-BC-SPOF",title:"Add redundancy or a named successor",agent:"Ops Agent",auto:false,state:"idle",prog:"Ranks single points by the number of Tier 1 applications behind them"}},
 m_bc_days:{n:"Days since last exercise (Tier 1)",f:"Average of (today − date of the last completed exercise) over Tier 1 applications that have one",u:"d",cur:0,tgt:240,badAt:365,dir:"min",max:600,tr:[300,290,280,270,260,250,240,235],owner:"Sam Patel",use:["Resilience overview","Resilience metrics"],rem:{kind:"sop",ref:"SOP-BC-EX",title:"Schedule the overdue exercise in the next window",agent:"Ops Agent",auto:false,state:"idle",prog:"Proposes the next approved window"}},
 m_bc_ci_owner:{n:"CIs with a recovery owner",f:"CIs of Tier 1 and 2 applications with a named recovery owner ÷ CIs of Tier 1 and 2 applications × 100",u:"%",cur:0,tgt:100,badAt:80,dir:"max",max:100,tr:[70,74,78,80,82,84,86,88],owner:"Ines Duarte",use:["Continuity traceability","Resilience metrics"],rem:{kind:"sop",ref:"SOP-BC-OWN",title:"Assign a recovery owner",agent:"Ops Agent",auto:false,state:"idle",prog:"Suggests the owner of the application the CI supports"}},
 m_bc_vend_exit:{n:"Critical vendors with an exit plan",f:"Vendors supporting Tier 1 or 2 applications with a documented exit plan ÷ vendors supporting Tier 1 or 2 applications × 100",u:"%",cur:0,tgt:100,badAt:50,dir:"max",max:100,tr:[20,25,25,33,33,33,40,40],owner:"Camille Ortega",use:["Continuity traceability","Resilience metrics"],rem:{kind:"sop",ref:"SOP-BC-EXIT",title:"Write the vendor exit plan",agent:"Ops Agent",auto:false,state:"idle",prog:"Starts from the contract termination and data return clauses"}},
 m_bc_data_restore:{n:"Data assets with a proven restore",f:"Data assets of Tier 1 and 2 applications with a successful restore test in the last 12 months ÷ data assets of Tier 1 and 2 applications × 100",u:"%",cur:0,tgt:100,badAt:60,dir:"max",max:100,tr:[50,55,58,60,64,70,72,75],owner:"Anil Mehta",use:["Resilience framework","Resilience metrics","Resilience overview"],rem:{kind:"sop",ref:"SOP-BC-RESTORE",title:"Run a restore test and record the result",agent:"Ops Agent",auto:false,state:"idle",prog:"Schedules the restore with the next failover exercise"}},
 m_bc_maturity:{n:"Tier 1 continuity maturity",f:"Average maturity level (1 Initial to 5 Optimized) over Tier 1 applications; level rules are on the Resilience metrics screen",u:"",cur:0,tgt:3.5,badAt:2,dir:"max",max:5,tr:[1.8,1.9,2.0,2.1,2.3,2.4,2.5,2.6],owner:"Sam Patel",use:["Resilience framework","Resilience overview","Resilience metrics"],rem:{kind:"sop",ref:"SOP-BC-MAT",title:"Move the lowest Tier 1 application up one level",agent:"Ops Agent",auto:false,state:"idle",prog:"Names the single missing condition for each application"}}};
Object.keys(MET).forEach(k=>{if(!METRICS[k])METRICS[k]=MET[k]});
BX.sync=()=>{const R=BX.calc();const set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=v;m.tr=m.tr.slice(0,-1).concat([v])};
 set("m_bc_plan_cov",R.plan);set("m_bc_ex_comp",R.exComp);set("m_bc_rto_att",R.rto);set("m_bc_rpo_att",R.rpo);set("m_bc_spof",R.spof);set("m_bc_days",R.days);set("m_bc_ci_owner",R.ciOwn);set("m_bc_vend_exit",R.exit);set("m_bc_data_restore",R.restore);set("m_bc_maturity",R.mat);return R};
/* formula lineage: numerator, denominator and the source fields behind each metric */
BX.lineage=id=>{const R=BX.calc();const apps=BX.apps().map(a=>BX.appStats(a.id));
 const row=(a,why)=>({id:a.app?a.app.id:a.id,t:a.app?a.app.n:a.n,sub:why});
 const L={
  m_bc_plan_cov:{num:["Approved plans for Tier 1 and 2 applications",R.planN],den:["Tier 1 and 2 applications",R.planD],src:["BcPlan.status","BcPlan.scope","config_item.business_criticality"],rows:apps.filter(s=>s.app.tier<=2).map(s=>row(s,s.planOk?"Approved "+s.plan.id:s.plan?s.plan.id+" "+s.plan.status:"No plan"))},
  m_bc_ex_comp:{num:["Applications not overdue",R.exN],den:["All applications",R.exD],src:["BcExercise.status","BcExercise.date","Tier policy.exercise type and months"],rows:apps.map(s=>row(s,s.obl.status+" · "+s.obl.typeName+" due "+BX.date(s.obl.due)))},
  m_bc_rto_att:{num:["Last exercise within RTO",R.rtoN],den:["Tier 1 and 2 applications with a completed exercise",R.rtoD],src:["BcExercise.rto_achieved","BcRecoveryObjective.rto_target"],rows:apps.filter(s=>s.last&&s.app.tier<=2).map(s=>row(s,BX.mins(s.rtoA)+" achieved vs "+BX.mins(s.app.rtoT)+" target"))},
  m_bc_rpo_att:{num:["Last exercise within RPO",R.rpoN],den:["Tier 1 and 2 applications with a completed exercise",R.rpoD],src:["BcExercise.rpo_achieved","BcRecoveryObjective.rpo_target"],rows:apps.filter(s=>s.last&&s.app.tier<=2).map(s=>row(s,BX.mins(s.rpoA)+" achieved vs "+BX.mins(s.app.rpoT)+" target"))},
  m_bc_spof:{num:["Single points of failure",R.spof],den:["",1],src:["BcComponent.redundancy","BcDependency","person succession"],rows:BX.allCis().filter(c=>c.spof).map(c=>({id:c.id,t:c.name,sub:"CI, no redundancy"})).concat(D().roles.filter(r=>!r.succ).map(r=>({id:r.id,t:r.n,sub:"Role, no successor"})))},
  m_bc_days:{num:["Sum of days since last exercise",R.days],den:["Tier 1 applications with an exercise",1],src:["BcExercise.date"],rows:apps.filter(s=>s.app.tier===1).map(s=>row(s,s.daysSince==null?"Never":s.daysSince+" days"))},
  m_bc_ci_owner:{num:["CIs with a recovery owner",R.ciOwnN],den:["CIs of Tier 1 and 2 applications",R.ciOwnD],src:["config_item.recovery_owner","BcDependency"],rows:BX.allCis().filter(c=>c.tier&&c.tier<=2&&!c.own).map(c=>({id:c.id,t:c.name,sub:"No recovery owner"}))},
  m_bc_vend_exit:{num:["Vendors with an exit plan",R.exitN],den:["Vendors supporting Tier 1 or 2",R.exitD],src:["core_company.exit_plan","contract"],rows:D().vendors.map(v=>({id:v.id,t:G(()=>S.bud.vend.find(x=>x.id===v.id).n,v.id),sub:v.exit?"Exit plan: "+v.exitDoc:"No exit plan"}))},
  m_bc_data_restore:{num:["Data assets restored in 12 months",R.restoreN],den:["Data assets of Tier 1 and 2 applications",R.restoreD],src:["data_asset.last_restore_test","BcDataAsset.restore_ok"],rows:D().data.map(x=>({id:x.id,t:x.n,sub:x.restore?"Restored "+BX.date(x.restore):"Never restored"}))},
  m_bc_maturity:{num:["Sum of maturity levels",Math.round(R.mat*10)/10],den:["Tier 1 applications",1],src:["BcPlan.status","BcExercise","dimension scores"],rows:apps.filter(s=>s.app.tier===1).map(s=>row(s,"Level "+s.lvl+" "+BX.ML[s.lvl]))}};
 return L[id]||null};

/* ------------------------------------------------------------------ traceability graph ------------------------------------------------------------------ */
BX.nodes=()=>memo("nodes",()=>{const N=[];const d=D();
 BX.apps().forEach(a=>N.push({id:a.id,t:"app",n:a.n,sub:BX.tierLabel(a.tier),tier:a.tier}));
 BX.comps().forEach(c=>N.push({id:c.id,t:c.dim==="T"?"ci":"comp",dim:c.dim,n:c.n,sub:(BX.dim(c.dim)||{}).n}));
 d.plans.forEach(p=>N.push({id:p.id,t:"plan",n:p.n,sub:p.kind+" plan · "+p.status}));
 d.bps.forEach(b=>N.push({id:b.id,t:"proc",n:b.n,sub:"Business process"}));
 return N});
BX.nodeById=id=>BX.nodes().find(n=>n.id===id)||null;
/* up: what depends on x. down: what x depends on. */
BX.trace=id=>{const d=D();const n=BX.nodeById(id);if(!n)return null;const res={node:n,up:[],down:[],plans:[],apps:[],ex:[],owners:[],lines:[],risks:[],ctls:[],contracts:[],metrics:[],procs:[],kb:[],sops:[]};
 if(n.t==="app"){const a=BX.app(id);res.apps=[a];res.procs=d.bps.filter(b=>b.apps.includes(id));res.down=BX.compsOf(id).map(c=>({id:c.id,n:c.n,dim:c.dim,via:c.ci?(BX.ciSet(id).find(s=>s.id===c.id)||{}).via:"recorded dependency"}));
  res.up=BX.apps().filter(o=>o.id!==id&&arr(G(()=>(o.svc||{}).deps,[])).includes(id)).map(o=>({id:o.id,n:o.n,dim:"A",via:"depends on "+a.n}));}
 else if(n.t==="proc"){const b=d.bps.find(x=>x.id===id);res.procs=[b];res.down=b.apps.map(i=>BX.app(i)).filter(Boolean).map(a=>({id:a.id,n:a.n,dim:"A",via:BX.tierLabel(a.tier)}));res.apps=res.down.map(x=>BX.app(x.id))}
 else if(n.t==="plan"){const p=BX.plan(id);res.plans=[p];res.apps=p.kind==="application"?[BX.app(p.scope)].filter(Boolean):p.proc.length?[]:[];res.down=[].concat(p.cis.map(i=>({id:i,n:(ciById(i)||{}).name||i,dim:"T",via:"plan"})),p.data.map(i=>({id:i,n:(d.data.find(x=>x.id===i)||{}).n||i,dim:"D",via:"plan"})),p.vendors.map(i=>({id:i,n:G(()=>S.bud.vend.find(x=>x.id===i).n,i),dim:"3",via:"plan"})),p.sites.map(i=>({id:i,n:(d.sites.find(x=>x.id===i)||{}).n||i,dim:"B",via:"plan"})),p.roles.map(i=>({id:i,n:(d.roles.find(x=>x.id===i)||{}).n||i,dim:"H",via:"plan"})));res.up=p.proc.map(i=>({id:i,n:(d.bps.find(x=>x.id===i)||{}).n||i,dim:"P",via:"business process"}))}
 else{const c=BX.comp(id);if(c){res.apps=c.apps.map(i=>BX.app(i)).filter(Boolean);res.up=res.apps.map(a=>({id:a.id,n:a.n,dim:"A",via:BX.tierLabel(a.tier)}));
   if(c.dim==="T"){res.down=arr(G(()=>CIEDGE,[])).filter(e=>e[0]===id).map(e=>({id:e[1],n:(ciById(e[1])||{}).name||e[1],dim:"T",via:e[2]}));res.up=res.up.concat(arr(G(()=>CIEDGE,[])).filter(e=>e[1]===id).map(e=>({id:e[0],n:(ciById(e[0])||{}).name||e[0],dim:"T",via:"depends on this"})))}
   if(c.dim==="E"){const e=d.equip.find(x=>x.id===id);const s=d.sites.find(x=>x.id===e.site);res.down=[{id:s.id,n:s.n,dim:"B",via:"located at"}]}
   if(c.dim==="B"){const s=d.sites.find(x=>x.id===id);res.down=s.ev.map(i=>({id:i,n:(d.equip.find(x=>x.id===i)||{}).n||i,dim:"E",via:"protects this site"}))}
   if(c.dim==="D"){const x=d.data.find(y=>y.id===id);res.down=[{id:x.ci,n:(ciById(x.ci)||{}).name||x.ci,dim:"T",via:"stored on"}].concat(x.from.map(i=>({id:i,n:(d.data.find(y=>y.id===i)||{}).n||i,dim:"D",via:"derived from"})));res.up=res.up.concat(x.to.map(i=>({id:i,n:(d.data.find(y=>y.id===i)||{}).n||i,dim:"D",via:"feeds"})))}
   if(c.dim==="3"){const v=d.vendors.find(x=>x.id===id);res.down=v.sites.map(i=>({id:i,n:(d.sites.find(x=>x.id===i)||{}).n||i,dim:"B",via:"hosts for the vendor"}))}
   if(c.dim==="H"){}
  }}
 const aid=new Set(res.apps.map(a=>a.id));
 res.plans=res.plans.length?res.plans:d.plans.filter(p=>(p.kind==="application"&&aid.has(p.scope))||p.cis.includes(id)||p.data.includes(id)||p.vendors.includes(id)||p.sites.includes(id)||p.roles.includes(id)||p.scope===id);
 res.ex=d.ex.filter(e=>aid.has(exApp(e))||res.plans.some(p=>p.id===e.planId));
 res.lines=uniq(res.plans.flatMap(p=>p.lines));res.risks=uniq(res.plans.flatMap(p=>p.risks));res.ctls=uniq(res.plans.flatMap(p=>p.ctls));res.contracts=uniq(res.plans.flatMap(p=>p.contracts));
 res.kb=uniq(res.plans.flatMap(p=>p.kb));res.sops=uniq(res.plans.flatMap(p=>p.sops));
 return res};
/* impact: if this component fails, what breaks, with RTO exposure */
BX.impact=id=>{const c=BX.comp(id)||(BX.app(id)&&{id,n:BX.app(id).n,dim:"A",apps:[id].concat(BX.apps().filter(o=>o.id!==id&&arr(G(()=>(o.svc||{}).deps,[])).includes(id)).map(o=>o.id))});if(!c)return null;const d=D();
 let recov=null,how="";
 if(c.dim==="T"){const r=BX.ciRec(id);recov=({replica:45,rebuild:120,backup:240,pair:15,provider:60,none:1440})[r.dr]||240;how=DRL[r.dr]+(r.red==="single"?", single instance":", "+r.red)}
 else if(c.dim==="D"){const x=d.data.find(y=>y.id===id);recov=x.derived?240:x.restoreOk===null?1440:x.freq<=15?90:240;how=x.method}
 else if(c.dim==="3"){const v=d.vendors.find(y=>y.id===id);recov=v.slaRto||1440;how="Vendor SLA"+(v.exit?", exit plan on file":", no exit plan")}
 else if(c.dim==="H"){const r=d.roles.find(y=>y.id===id);recov=r.succ?60:1440;how=r.succ?"Successor "+r.succ:"No successor; wait for "+r.primary}
 else if(c.dim==="E"){const e=d.equip.find(y=>y.id===id);recov=e.red==="single"?480:15;how=e.red+" redundancy, "+e.ctr}
 else if(c.dim==="B"){const s=d.sites.find(y=>y.id===id);recov=s.kind==="Cloud region"?240:120;how=s.alt}
 else {const st=BX.appStats(id);recov=st&&st.rtoA!=null?st.rtoA:null;how="Last exercise result"}
 const rows=c.apps.map(i=>BX.app(i)).filter(Boolean).map(a=>{const exposure=recov==null?null:recov-a.rtoT;return{app:a,rtoT:a.rtoT,recov,exposure,users:a.users,bp:d.bps.filter(b=>b.apps.includes(a.id)),plan:BX.planOf(a.id)}}).sort((x,y)=>x.app.tier-y.app.tier||(y.exposure||0)-(x.exposure||0));
 return{c,recov,how,rows,users:rows.reduce((m,r)=>Math.max(m,r.users||0),0),worst:rows.filter(r=>r.exposure>0).length}};

/* edit helpers used by the screens */
BX.log=(a,dt)=>{try{audit(a,dt)}catch(e){}D().log.unshift({t:Date.now(),a,dt})};
BX.nextId=(prefix,list)=>{let n=list.reduce((m,x)=>{const r=new RegExp("^"+prefix+"(\\d+)$").exec(x.id);return r?Math.max(m,+r[1]):m},0);return prefix+String(n+1).padStart(3,"0")};
BX.groupName=id=>(D().groups.find(g=>g.id===id)||{n:id}).n;
BX.groupMembers=id=>(D().groups.find(g=>g.id===id)||{members:[]}).members;
BX.search=(q)=>{q=String(q||"").toLowerCase().trim();const N=BX.nodes();if(!q)return N.slice(0,12);return N.filter(n=>(n.id+" "+n.n+" "+n.sub).toLowerCase().includes(q)).slice(0,24)};
})();
