/* ===== mod_s_packgen: Bring your company (DC-43). window.PACKGEN builds a full tenant pack in the browser from a few answers,
   runs the same checks as tools/generators/gen_pack.py (links, R12 owner and different backup, R25 metric definitions, R26 six
   maturity dimensions, no em dash, no banned or real names, no other tenant's organization, no collision with Meridian people)
   and registers it through the path every pack takes (DATA.pack, DATA.addTenant), so the tenant-aware screens show it.
   API:  PACKGEN.industries() · PACKGEN.match(text) · PACKGEN.spec(answers,opts) · PACKGEN.build(spec) -> {pack,errors,warnings}
         PACKGEN.fromAnswers({name,industry,size,pain,role},{id,switch}) -> {ok,id,pack,errors,warnings,industry,fallback}
         PACKGEN.current() · PACKGEN.forget() · PACKGEN.openSetup() (the setup dialog lives in mod_s_exp_company.js)
   Every figure is generated sample data and labeled simulated. People are fictional names drawn from pools and checked against
   every name in the page. The company name the buyer types stays in this browser: it is kept only in U.store key "exp.company"
   for the session (eight hours at most) and PACKGEN.forget() clears it. Tenant isolation is simulated (R52). No CSS. ===== */
(function(){
const W=window;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const PG=W.PACKGEN=W.PACKGEN||{};
const KEY="exp.company",TTL=8*36e5,DEF_ID="yourco";
const DIMS=["defined","owned","measured","integrated","automated","governed"];
const KINDS=new Set(["human","agent","robot"]),LABELS=new Set(["fact","modeled","hypothesis","simulated"]);
const AUG={rep:.6,mtg:.25,apr:.3,ops:.35};
const BANNED=[/\bCore\b/,/\bFabric\b/,/\bTrellis\b/,/\u2014/],BANNED_N=["a banned product word (C.)","a banned product word (F.)","a banned product word (T.)","an em dash"];
/* the owner's name and employer (R32), assembled from fragments so no source string spells them (same convention as tools/lint) */
const REAL=[["Om","ar ","Ha","mid"],["Ha","mid"],["Fin","ancial Acc","ounting Found","ation"],["Fin","ancial Acc","ounting Stand","ards Board"],["Gov","ernmental Acc","ounting Stand","ards Board"]].map(a=>new RegExp("\\b"+a.join("")+"\\b","i"));
const sl=s=>String(s==null?"":s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");

/* ---------- answers ---------- */
const SIZES={s:{n:"Under 1,000 people",m:.35},m:{n:"1,000 to 10,000 people",m:1},l:{n:"10,000 to 50,000 people",m:2.6},xl:{n:"Over 50,000 people",m:6}};
const PAINS={
 cost:{n:"Spend runs ahead of plan",why:"contract rates rose after the budget was approved",w:"spend runs ahead of plan"},
 speed:{n:"Work takes too long",why:"overlap staffing runs longer while the new process settles",w:"work takes too long to get through"},
 risk:{n:"Incidents and audit findings",why:"extra checks were added after an incident review",w:"incidents and audit findings keep coming back"},
 customer:{n:"Customers wait or leave",why:"demand came in higher than planned",w:"customers wait too long or leave"},
 people:{n:"Teams are stretched thin",why:"overtime covers open roles",w:"teams are stretched thin"}};
const ROLES={coo:"Chief operating officer",cfo:"Chief financial officer",cio:"Chief information officer",ciso:"Chief information security officer",ceo:"Chief executive"};

/* ---------- industry templates ----------
   fns [name, lead title, teams, three staff roles] · obj [pain tag, fn, name, short, story, pillar, pillar meaning, metric keys]
   met key: [name, unit, baseline, current, target, dir, formula, remediation] · prj [name, short, objective, budget (thousands), paid share, story, lines [category, name]]
   prc [name, fn, metric keys, steps [name, kind]] · dem [name, team, cost, benefit (thousands), objective, why] · vc [flow, steps [n, in system, who, minutes, note, bridge, agent]]
   ag [[agent, does],[agent, does]] · rb [robot, does] · voc {key: [one, many]} */
const IND={
health:{label:"Healthcare",sample:"health",kind:"a health system",kw:["health","hospital","clinic","care","medical","patient","pharma","nursing","dental"],
 fns:[["Patient access","Vice president, patient access",["Scheduling center","Referral intake","Patient registration"],["Director, scheduling","Referral intake manager","Registration supervisor"]],
  ["Clinical services","Chief nursing officer",["Inpatient units","Care transitions","Pharmacy services"],["Director, care transitions","Nurse manager, medical units","Pharmacy operations lead"]],
  ["Operations","Vice president, operations",["Bed management","Environmental services","Biomedical engineering"],["Bed management lead","Biomedical engineering manager","Facilities supervisor"]],
  ["Finance and revenue","Chief financial officer",["Billing","Payer relations","Financial planning"],["Director, billing","Payer relations manager","Financial planning analyst"]]],
 obj:[["customer",0,"Every patient is seen within a week of referral","Timely access","Cut the wait from referral to first visit to five working days.","Easy to reach","Patients get care when they need it.",["wait","refbook"]],
  ["cost",3,"Claims are paid on the first submission","Clean claims","Raise the first-pass claim rate and lower write-offs.","Paid right the first time","Fewer denials and less rework.",["firstpass","denrate"]],
  ["speed",2,"Beds are ready when the patient is","Patient flow","Shorten the time from discharge order to a clean, ready bed.","Flow without waiting","Rooms and beds turn over quickly and safely.",["bedturn","dcnoon"]],
  ["risk",1,"Medication and device events keep falling","Safe care","Fewer medication events and no overdue device checks.","Safe every time","Patients are protected by reliable checks.",["medev","devpm"]]],
 met:{wait:["Working days from referral to first visit","days",11,9,5,"min","Median working days from referral received to the first completed visit","Release held templates and send new referrals to the intake agent queue"],
  refbook:["Referrals scheduled within two working days","%",38,49,75,"max","Referrals scheduled within two working days / referrals received x 100","Add a second intake shift and assign incomplete referrals the same day"],
  firstpass:["First-pass claim acceptance","%",81,85,94,"max","Claims accepted on first submission / claims submitted x 100","Run the claim scrubber before submission and fix the top three edit failures"],
  denrate:["Claim denial share","%",9.5,8.1,5,"min","Denied claims / claims adjudicated x 100","Route denials by reason code to the appeal queue the same day"],
  bedturn:["Minutes from discharge order to ready bed","min",210,185,120,"min","Median minutes from discharge order to a bed marked clean and ready","Page environmental services at the discharge order, not at departure"],
  dcnoon:["Discharges completed before noon","%",18,24,40,"max","Discharges before 12:00 / all discharges x 100","Start discharge preparation the evening before for planned discharges"],
  medev:["Medication events per 1,000 doses","per 1,000",2.4,2.1,1.2,"min","Reported medication events / doses administered x 1,000","Review the top event type weekly and add a pharmacist check"],
  devpm:["Device checks overdue","%",7,6,1,"min","Medical device preventive checks past due / checks scheduled x 100","Schedule overdue checks first and borrow a technician from the next site"],
  nps:["Patient experience score","points",71,73,80,"max","Share of patients rating the visit 9 or 10, less the share rating 0 to 6","Call back every low score within two days"],
  overtime:["Nursing overtime share","%",11,12,7,"min","Overtime hours / worked hours for nursing x 100","Open float pool shifts before approving overtime"]},
 prj:[["Central scheduling hub","Scheduling hub",0,1900,.45,"Four scheduling desks become one hub with shared templates.",[["Labor","Scheduler training and overlap shifts"],["Software","Scheduling and referral software"]]],
  ["Claim scrubber rollout","Claim scrubber",1,1250,.4,"Edits run before claims go out.",[["Software","Claim editing software"],["Services","Edit rule configuration"]]],
  ["Bed status board","Bed board",2,980,.5,"Live bed status for transport and environmental services.",[["Hardware","Status displays and badges"],["Services","Integration with admissions"]]],
  ["Medication safety program","Medication safety",3,760,.35,"Barcode scanning at every bedside.",[["Hardware","Bedside scanners"],["Labor","Pharmacist review hours"]]],
  ["Device maintenance catch-up","Device catch-up",3,420,.3,"Clear the overdue preventive checks.",[["Services","Contract technicians"],["Labor","Biomedical overtime"]]]],
 ven:["Brightmoor Health Software","Tallis Staffing Partners","Quayside Medical Devices","Ferncliff Claims Services","Holloway Biomedical","Lanternfield Analytics"],
 prc:[["Referral to first visit",0,["wait","refbook"],[["Receive the referral","robot"],["Check the referral is complete","agent"],["Verify insurance","robot"],["Book the visit","human"],["Approve an urgent override","gate"]]],
  ["Claim build and submission",3,["firstpass","denrate"],[["Code the encounter","human"],["Scrub the claim","robot"],["Suggest fixes for failed edits","agent"],["Submit to the payer","robot"],["Approve a write-off","gate"]]],
  ["Discharge to ready bed",2,["bedturn","dcnoon"],[["Enter the discharge order","human"],["Alert environmental services","robot"],["Clean the room","human"],["Predict the next bed need","agent"],["Mark the bed ready","human"]]],
  ["Medication administration check",1,["medev"],[["Scan the patient band","human"],["Match the dose to the order","robot"],["Flag an unusual dose","agent"],["Pharmacist review","human"],["Approve an override","gate"]]],
  ["Device preventive maintenance",2,["devpm"],[["Plan the checks","robot"],["Assign a technician","human"],["Run the check","human"],["Spot devices at risk","agent"],["Sign off the device","gate"]]],
  ["Patient feedback follow-up",0,["nps","overtime"],[["Collect the survey","robot"],["Group comments by theme","agent"],["Call back a low score","human"],["Agree the fix","human"],["Close the loop","robot"]]]],
 dem:[["Online self-scheduling for return visits","Scheduling center",320,780,0,"Patients book their own return visit, which frees schedulers for new referrals."],
  ["Denial prediction before submission","Billing",260,640,1,"Flags claims likely to be denied while they can still be fixed."],
  ["Transport request tracking","Bed management",140,300,2,"Shows where each transport request is, so beds are not held waiting."],
  ["Infusion pump dose library update","Pharmacy services",380,420,3,"Keeps dose limits current on every pump."]],
 vc:["Referral to paid claim",[["Take the referral",false,"Referral coordinator",16,"Fax and email retyped into scheduling","Intake Triage Agent reads the referral and fills the order for a person to confirm","Intake Triage Agent"],
  ["Check coverage",true,"Registration clerk",9,"Payer portal lookups"],["Book the visit",true,"Scheduler",12,"Scheduling software"],["See the patient",true,"Clinician",30,"Clinical record"],
  ["Code and bill",false,"Coder",14,"Coding worksheet outside the billing system","Claim Prep Agent suggests codes from the note for the coder to accept","Claim Prep Agent"],["Collect payment",true,"Billing specialist",8,"Billing system"]]],
 ag:[["Intake Triage Agent","Reads incoming referrals and drafts the order"],["Claim Prep Agent","Suggests codes and fixes for failed edits"]],rb:["Coverage Check Robot","Checks coverage before every visit"],
 voc:{customer:["patient","patients"],incident:["patient safety event","patient safety events"],ticket:["service request","service requests"],request:["referral","referrals"],asset:["medical device","medical devices"],site:["hospital","hospitals"],downtime:["downtime","downtime"],workforce:["care team","care teams"],work_item:["case","cases"],frontline:["scheduling center","scheduling centers"],service:["service line","service lines"],order:["order","orders"],case:["encounter","encounters"],supplier:["supplier","suppliers"],revenue:["net patient revenue","net patient revenue"]}},

mining:{label:"Mining and operational technology",sample:"mining",kind:"a mining and processing company with operational technology",kw:["mine","mining","metals","oil","gas","energy","utility","utilities","ot","operational technology","chemical","quarry","power"],
 fns:[["Mine operations","General manager, mine operations",["Load and haul","Drill and blast","Mine planning"],["Mine planning superintendent","Load and haul superintendent","Drill and blast lead"]],
  ["Processing","General manager, processing",["Crushing","Flotation","Tailings"],["Plant superintendent","Metallurgy lead","Tailings engineer"]],
  ["Maintenance and technology","Vice president, maintenance and technology",["Fixed plant maintenance","Mobile fleet maintenance","Control systems"],["Maintenance planning lead","Control systems engineer","Reliability engineer"]],
  ["Finance and supply","Chief financial officer",["Supply chain","Cost control","Contracts"],["Supply chain manager","Cost controller","Contracts lead"]]],
 obj:[["speed",2,"Equipment runs when the plan needs it","Availability","Raise haul truck and crusher availability to plan.","Run to plan","Equipment is ready for every shift.",["avail","planned"]],
  ["risk",0,"Nobody is hurt and every permit is closed safely","Zero harm","Fewer high-potential events and no open permits at shift change.","Home safe","Every person goes home safe.",["hipo","permit"]],
  ["cost",3,"Cost per tonne moves back to budget","Unit cost","Bring cost per tonne milled back to plan.","Spend where it pays","Every dollar moves tonnes or safety.",["cpt","stockouts"]],
  ["customer",1,"Shipments meet grade and date","Reliable delivery","Ship concentrate on grade and on the agreed date.","Keep our word","Customers get the grade and date we promised.",["ontime","recov"]]],
 met:{avail:["Haul fleet availability","%",82,84,90,"max","Hours available / calendar hours for the haul fleet x 100","Move the worst three trucks to planned repair this week"],
  planned:["Planned maintenance share","%",58,62,80,"max","Planned work hours / all maintenance hours x 100","Freeze unplanned work orders without a failure code"],
  hipo:["High-potential safety events","per month",6,5,2,"min","High-potential events reported in the month","Run a critical control check on the top event type every shift"],
  permit:["Permits open at shift change","count",9,7,0,"min","Work permits still open at the end of each shift, daily average","Make the permit close-out a gate before the shift handover"],
  cpt:["Cost per tonne milled","$/t",31,34,30,"min","Site operating cost / tonnes milled","Cut rental equipment that ran under half its hours last month"],
  stockouts:["Critical spares stockouts","per month",11,9,3,"min","Work orders delayed because a critical spare was out of stock","Raise minimum stock for the ten most used critical spares"],
  ontime:["Shipments on grade and on date","%",86,88,96,"max","Shipments meeting grade and date / shipments x 100","Hold blending until the assay is confirmed"],
  recov:["Metal recovery to concentrate","%",87.5,88.1,90,"max","Metal in concentrate / metal in feed x 100","Retune flotation reagents when the feed grade changes"],
  alarms:["Control room alarms per hour","per hour",42,38,15,"min","Alarms raised in the control room / operating hours","Rationalize the twenty noisiest alarms"],
  mtbf:["Crusher hours between failures","hours",160,175,240,"max","Crusher operating hours / crusher failures","Add a vibration check to the daily round"]},
 prj:[["Haul fleet health monitoring","Fleet health",0,2600,.4,"Sensors and alerts on every haul truck.",[["Hardware","Truck sensors and gateways"],["Software","Condition monitoring software"],["Labor","Reliability engineering hours"]]],
  ["Critical control verification","Critical controls",1,640,.5,"Shift checks of the controls that prevent serious harm.",[["Software","Mobile check app"],["Labor","Supervisor coaching time"]]],
  ["Spares optimization","Spares",2,880,.35,"Right stock levels for critical spares.",[["Services","Inventory analysis services"],["Vendor","Consignment stock setup"]]],
  ["Flotation control upgrade","Flotation control",3,1700,.45,"Advanced control on the flotation circuit.",[["Software","Advanced process control licenses"],["Services","Control tuning engineers"]]],
  ["Alarm rationalization","Alarm cleanup",0,360,.25,"Fewer, clearer alarms in the control room.",[["Services","Alarm review workshops"],["Labor","Control systems overtime"]]]],
 ven:["Granitevale Mining Services","Ironbark Fleet Parts","Sablecreek Automation","Coppermoor Reagents","Ridgeline Engineering Contractors","Basalt Point Logistics"],
 prc:[["Failure alert to work order",2,["avail","mtbf"],[["Receive the sensor alert","robot"],["Assess the condition","agent"],["Raise the work order","robot"],["Plan the repair","human"],["Approve the shutdown","gate"]]],
  ["Permit to work",0,["permit","hipo"],[["Request the permit","human"],["Check isolations","human"],["Check for conflicting permits","robot"],["Approve the permit","gate"],["Close out at shift end","human"]]],
  ["Spares replenishment",3,["stockouts","cpt"],[["Watch stock levels","robot"],["Forecast the next usage","agent"],["Raise the requisition","robot"],["Approve the purchase","gate"],["Receive and bin","human"]]],
  ["Concentrate shipment release",1,["ontime","recov"],[["Sample the stockpile","human"],["Confirm the assay","robot"],["Plan the blend","agent"],["Book the shipment","human"],["Approve the release","gate"]]],
  ["Control room alarm response",2,["alarms","planned"],[["Raise the alarm","robot"],["Group related alarms","agent"],["Acknowledge and act","human"],["Log the cause","human"],["Review repeat alarms","human"]]],
  ["Monthly site cost review",3,["cpt"],[["Pull actuals","robot"],["Explain variances","agent"],["Review with area leads","human"],["Agree actions","human"],["Approve the reforecast","gate"]]]],
 dem:[["Autonomous drill trial","Drill and blast",900,1400,0,"Tests one autonomous drill on the day shift."],
  ["Tailings monitoring dashboard","Tailings",280,350,1,"Puts piezometer readings in one view for the dam engineer."],
  ["Supplier consignment for wear parts","Supply chain",120,420,2,"Moves wear parts stock to the supplier until used."],
  ["Assay turnaround tracking","Flotation",90,260,3,"Shows when each assay will be back, so blends are not held."]],
 vc:["Ore to cash",[["Plan the month",true,"Mine planner",110,"Mine planning software"],["Drill and blast",true,"Drill and blast engineer",240,"Drill navigation system"],
  ["Load and haul",false,"Dispatcher",45,"Radio calls and a whiteboard for truck assignments","Haul Dispatch Agent suggests truck assignments for the dispatcher to confirm","Haul Dispatch Agent"],
  ["Crush and process",true,"Plant operator",480,"Control system"],["Assay and blend",false,"Metallurgist",60,"Spreadsheet blend plan","Blend Planning Agent drafts the blend from the latest assays for the metallurgist to approve","Blend Planning Agent"],
  ["Ship and invoice",true,"Logistics coordinator",35,"Sales and logistics system"]]],
 ag:[["Haul Dispatch Agent","Suggests truck assignments each shift"],["Blend Planning Agent","Drafts blends from the latest assays"]],rb:["Permit Conflict Robot","Checks for overlapping permits on the same equipment"],
 voc:{customer:["offtake customer","offtake customers"],incident:["safety event","safety events"],ticket:["work order","work orders"],request:["work request","work requests"],asset:["piece of equipment","equipment"],site:["mine site","mine sites"],downtime:["unplanned downtime","unplanned downtime"],workforce:["crew","crews"],work_item:["work order","work orders"],frontline:["control room","control rooms"],service:["operation","operations"],order:["shipment","shipments"],case:["investigation","investigations"],supplier:["supplier","suppliers"],revenue:["concentrate revenue","concentrate revenue"]}},

storage:{label:"Storage and backup",sample:"storage",kind:"a storage and backup technology company",kw:["storage","backup","software","saas","technology","tech","data","cloud","it services","telecom","hardware","semiconductor","cyber"],
 fns:[["Customer success","Chief customer officer",["Support","Customer success","Professional services"],["Director, support","Customer success lead","Services delivery manager"]],
  ["Product and engineering","Senior vice president, engineering",["Firmware","Cloud services","Quality engineering"],["Engineering manager, firmware","Cloud operations lead","Quality engineering lead"]],
  ["Sales and partners","Chief revenue officer",["Field sales","Partner sales","Sales engineering"],["Partner sales director","Sales engineering lead","Deal desk manager"]],
  ["Finance and supply chain","Chief financial officer",["Supply chain","Revenue operations","Financial planning"],["Supply chain director","Revenue operations manager","Financial planning lead"]]],
 obj:[["customer",0,"Customers recover their data fast and stay with us","Retention","Faster recoveries and higher gross retention.","Trusted with data","Customers trust us on their worst day.",["restore","retain"]],
  ["speed",1,"Releases ship on time without regressions","Release quality","Ship on the release date with fewer escaped defects.","Ship with confidence","Every release is predictable and clean.",["onrel","escdef"]],
  ["cost",3,"Margin grows on every appliance shipped","Gross margin","Lower cost per appliance and fewer returns.","Margin with quality","Profitable growth, not just growth.",["rma","landcost"]],
  ["risk",2,"Deals close with clean terms","Deal hygiene","Fewer non-standard terms and faster quote approval.","Win clean","Deals close without surprises later.",["nonstd","quote"]]],
 met:{restore:["Hours to complete a customer restore","hours",9,7.5,4,"min","Median hours from restore request to verified recovery","Send restores over four hours to the recovery swarm queue"],
  retain:["Gross revenue retention","%",88,89,94,"max","Recurring revenue kept from customers at the start of the year / that starting revenue x 100","Start renewal outreach 120 days out for at-risk accounts"],
  onrel:["Releases on the planned date","%",60,67,90,"max","Releases shipped on the planned date / releases planned x 100","Cut scope at the feature freeze instead of moving the date"],
  escdef:["Escaped defects per release","count",14,12,5,"min","Defects found by customers within 30 days of a release","Add the top escaped defect type to the regression suite"],
  rma:["Appliance return rate","%",3.1,2.8,1.5,"min","Appliances returned / appliances shipped in the quarter x 100","Run burn-in tests on the two drive models with the most returns"],
  landcost:["Landed cost per appliance","$",4200,4350,3900,"min","Bill of materials, freight and duty / appliances shipped","Consolidate freight to two forwarders"],
  nonstd:["Deals with non-standard terms","%",27,24,10,"min","Deals signed with any non-standard term / deals signed x 100","Publish three pre-approved fallback clauses"],
  quote:["Hours to approve a quote","hours",30,26,8,"min","Median hours from quote submitted to quote approved","Approve quotes inside the discount guardrails without a review"],
  csat:["Support satisfaction","%",86,87,93,"max","Cases rated satisfied / cases rated x 100","Review every dissatisfied case within one working day"],
  backlog:["Support cases older than 14 days","count",130,118,40,"min","Open support cases older than 14 days","Swarm the oldest cases daily for a week"]},
 prj:[["Recovery swarm program","Recovery swarm",0,1500,.4,"Senior engineers join any restore that runs long.",[["Labor","Swarm engineer time"],["Software","Case routing software"]]],
  ["Release train rework","Release train",1,1100,.5,"Fixed release trains with a feature freeze.",[["Labor","Release engineering hours"],["Software","Test automation licenses"]]],
  ["Drive burn-in line","Burn-in line",2,2300,.3,"Burn-in racks at the contract manufacturer.",[["Hardware","Burn-in racks"],["Services","Contract manufacturer setup"]]],
  ["Guided quote approvals","Quote guardrails",3,520,.45,"Discount guardrails inside the quote tool.",[["Software","Quote tool configuration"],["Services","Deal desk process design"]]],
  ["Renewal health scoring","Renewal health",0,680,.35,"A health score for every renewal.",[["Software","Customer health software"],["Labor","Customer success analyst time"]]]],
 ven:["Northgale Contract Manufacturing","Pinecrest Freight","Tessaline Drive Supply","Brookhaven Test Systems","Saltmarsh Software Partners","Kestrel Ridge Consulting"],
 prc:[["Restore request to verified recovery",0,["restore","csat"],[["Open the restore case","robot"],["Gather logs and versions","agent"],["Run the restore","human"],["Join the swarm when it runs long","human"],["Confirm with the customer","human"]]],
  ["Release readiness review",1,["onrel","escdef"],[["Freeze features","human"],["Run the regression suite","robot"],["Summarize open risks","agent"],["Go or no-go decision","gate"],["Publish the release","robot"]]],
  ["Return and replace",3,["rma","landcost"],[["Receive the return request","robot"],["Diagnose remotely","agent"],["Ship the replacement","robot"],["Inspect the returned unit","human"],["Approve a credit","gate"]]],
  ["Quote to approved deal",2,["quote","nonstd"],[["Build the quote","human"],["Check the discount guardrails","robot"],["Flag non-standard terms","agent"],["Deal desk approval","gate"],["Send to the customer","human"]]],
  ["Renewal outreach",0,["retain"],[["Score renewal health","agent"],["Open the renewal","robot"],["Call the customer","human"],["Agree the terms","human"],["Approve the renewal discount","gate"]]],
  ["Support case aging review",0,["backlog","csat"],[["List old cases","robot"],["Suggest next actions","agent"],["Assign an owner","human"],["Work the case","human"],["Close and survey","robot"]]]],
 dem:[["Self-service restore portal","Support",420,900,0,"Lets customers start and watch a restore themselves."],
  ["Firmware canary rings","Firmware",300,520,1,"Ships firmware to a small ring of customers first."],
  ["Second source for drives","Supply chain",160,700,2,"Adds a second qualified drive supplier."],
  ["Contract clause library","Deal desk",110,330,3,"Pre-approved fallback clauses for common asks."]],
 vc:["Quote to renewal",[["Size the environment",false,"Sales engineer",80,"Spreadsheet sizing","Sizing Draft Agent drafts the sizing from the customer's export for the sales engineer to check","Sizing Draft Agent"],
  ["Approve the quote",true,"Deal desk",45,"Quote tool"],["Build and ship",true,"Supply chain planner",240,"Planning system"],["Install and onboard",true,"Services engineer",300,"Services portal"],
  ["Support and restore",true,"Support engineer",120,"Case system"],["Renew",false,"Customer success manager",60,"Email and a renewal spreadsheet","Renewal Brief Agent prepares the renewal brief from usage and cases","Renewal Brief Agent"]]],
 ag:[["Sizing Draft Agent","Drafts environment sizing from exports"],["Renewal Brief Agent","Prepares renewal briefs from usage and cases"]],rb:["Discount Guardrail Robot","Checks every quote against the discount bands"],
 voc:{customer:["customer","customers"],incident:["data recovery event","data recovery events"],ticket:["support case","support cases"],request:["service request","service requests"],asset:["appliance","appliances"],site:["customer site","customer sites"],downtime:["outage","outages"],workforce:["field team","field teams"],work_item:["support case","support cases"],frontline:["support desk","support desks"],service:["subscription","subscriptions"],order:["order","orders"],case:["support case","support cases"],supplier:["supplier","suppliers"],revenue:["recurring revenue","recurring revenue"]}},

standards:{label:"Standards and publishing",sample:"core",kind:"a standards and publishing organization",kw:["standard","standards","publishing","publisher","media","association","nonprofit","non-profit","education","university","research","journal","books"],
 fns:[["Standards development","Vice president, standards development",["Technical committees","Editorial","Ballot management"],["Director, technical committees","Managing editor","Ballot manager"]],
  ["Publishing and products","Vice president, publishing",["Production","Digital products","Translations"],["Production manager","Digital product lead","Translations coordinator"]],
  ["Members and sales","Chief member officer",["Membership","Licensing sales","Events"],["Membership director","Licensing sales manager","Events manager"]],
  ["Finance and operations","Chief financial officer",["Finance","Technology","Facilities"],["Controller","Technology operations lead","Procurement lead"]]],
 obj:[["speed",0,"A standard moves from proposal to publication in under a year","Time to publish","Cut the median cycle from proposal to publication.","Faster to publish","Experts see their work in use sooner.",["cycle","ballot"]],
  ["customer",2,"Members renew and use what they buy","Member value","Raise member renewal and active use of licensed content.","Worth joining","Members get value every month.",["renew","active"]],
  ["cost",3,"Each published page costs less to produce","Production cost","Lower production cost per page without cutting review quality.","Lean production","Every review hour is spent where it counts.",["cpp","rework"]],
  ["risk",1,"Every published edition is correct and traceable","Edition integrity","No production errata and a full trace for every change.","Right the first time","Readers can rely on every edition.",["errata","trace"]]],
 met:{cycle:["Months from proposal to publication","months",22,19,12,"min","Median months from accepted proposal to published edition","Start editorial review in parallel with the final ballot"],
  ballot:["Ballots closed on schedule","%",64,70,90,"max","Ballots closed by the planned date / ballots opened x 100","Send reminders at day 10 and escalate at day 20 to the committee chair"],
  renew:["Member renewal rate","%",84,85,92,"max","Members who renewed / members due to renew x 100","Call members with low use 90 days before renewal"],
  active:["Licensed seats used monthly","%",48,52,70,"max","Licensed seats with a sign-in in the month / licensed seats x 100","Run a quarterly how-to session for each large account"],
  cpp:["Production cost per page","$",86,91,70,"min","Production spend / pages published","Move tables to the structured template that needs no manual layout"],
  rework:["Pages sent back for rework","%",14,13,6,"min","Pages returned by proofing / pages proofed x 100","Add the top three rework causes to the author checklist"],
  errata:["Errata caused by production","count",7,5,0,"min","Errata caused by production in the year","Add a second proof for every changed table"],
  trace:["Changes traced to a ballot comment","%",78,83,100,"max","Published changes linked to a ballot comment / published changes x 100","Hold publication until every change has a linked comment"],
  translate:["Weeks to a translated edition","weeks",20,18,10,"min","Median weeks from source publication to translated edition","Send stable chapters to translation before the final ballot"],
  event:["Event attendee satisfaction","%",81,83,90,"max","Attendees rating the event good or better / respondents x 100","Review session feedback within one week"]},
 prj:[["Parallel editorial review","Parallel review",0,820,.45,"Editors review while the final ballot runs.",[["Labor","Editor overlap hours"],["Software","Review workflow software"]]],
  ["Member usage insights","Usage insights",1,540,.4,"Usage reports for every licensed account.",[["Software","Usage analytics software"],["Services","Report design services"]]],
  ["Structured authoring templates","Structured templates",2,960,.35,"Templates that lay out tables and figures automatically.",[["Software","Authoring template licenses"],["Services","Template conversion services"]]],
  ["Change traceability program","Traceability",3,450,.5,"Every published change linked to its ballot comment.",[["Software","Comment tracking configuration"],["Labor","Editorial audit time"]]],
  ["Translation pipeline","Translations",1,610,.3,"Chapters go to translation as they stabilize.",[["Services","Translation vendor services"],["Software","Translation memory licenses"]]]],
 ven:["Inkwell Typesetting Services","Larchmont Translation Group","Paperbirch Print Partners","Clearwater Content Systems","Ashdown Event Services","Mosswood Analytics"],
 prc:[["Proposal to published edition",0,["cycle","ballot"],[["Accept the proposal","gate"],["Draft with the committee","human"],["Run the ballot","robot"],["Summarize ballot comments","agent"],["Publish the edition","human"]]],
  ["Ballot comment resolution",0,["trace","ballot"],[["Collect comments","robot"],["Group duplicate comments","agent"],["Resolve with the committee","human"],["Record the resolution","robot"],["Chair approval","gate"]]],
  ["Production and proofing",1,["cpp","rework","errata"],[["Convert the manuscript","robot"],["Lay out tables and figures","human"],["Check style and references","agent"],["Proof the pages","human"],["Approve the release","gate"]]],
  ["Member renewal outreach",2,["renew","active"],[["Score member use","agent"],["Send the renewal","robot"],["Call low-use members","human"],["Agree the renewal","human"],["Approve a renewal discount","gate"]]],
  ["Translation release",1,["translate"],[["Send stable chapters","robot"],["Translate","human"],["Check terminology","agent"],["Review the translation","human"],["Publish the translation","human"]]],
  ["Event planning and budget",2,["event"],[["Set the program","human"],["Book the venue","human"],["Open registration","robot"],["Draft the attendee guide","agent"],["Approve the budget","gate"]]]],
 dem:[["Online comment portal for ballots","Ballot management",260,520,0,"Comments arrive structured instead of in documents."],
  ["Content subscription bundles","Licensing sales",180,610,1,"Packages related standards in one subscription."],
  ["Automated reference checks","Editorial",120,280,2,"Checks every reference against the catalog."],
  ["Edition comparison viewer","Digital products",220,340,3,"Shows readers what changed between editions."]],
 vc:["Need to published standard",[["Accept the proposal",true,"Committee chair",60,"Committee portal"],
  ["Draft the text",false,"Working group",900,"Shared documents and email","Drafting Assist Agent proposes consistent wording from the style guide for the working group to accept","Drafting Assist Agent"],
  ["Ballot",true,"Ballot manager",120,"Ballot system"],["Resolve comments",false,"Committee",600,"Spreadsheet of comments","Comment Grouping Agent groups duplicate comments for the committee to resolve","Comment Grouping Agent"],
  ["Produce and proof",true,"Production editor",480,"Production system"],["Publish and license",true,"Digital product lead",40,"Store and licensing system"]]],
 ag:[["Drafting Assist Agent","Proposes consistent wording from the style guide"],["Comment Grouping Agent","Groups duplicate ballot comments"]],rb:["Ballot Reminder Robot","Sends ballot reminders on day 10 and day 20"],
 voc:{customer:["member","members"],incident:["production issue","production issues"],ticket:["request","requests"],request:["request","requests"],asset:["publication","publications"],site:["office","offices"],downtime:["outage","outages"],workforce:["committee","committees"],work_item:["work item","work items"],frontline:["member services","member services"],service:["product","products"],order:["order","orders"],case:["case","cases"],supplier:["vendor","vendors"],revenue:["licensing revenue","licensing revenue"]}},

manufacturing:{label:"Manufacturing",sample:"mining",kind:"a discrete manufacturer",kw:["manufactur","factory","logistics","freight","warehous","industrial","automotive","aerospace","plant","electronics","machinery","assembly","packaging","food"],
 fns:[["Plant operations","Vice president, manufacturing",["Assembly","Machining","Paint and finish"],["Plant manager","Production supervisor, assembly","Continuous improvement lead"]],
  ["Quality","Vice president, quality",["Incoming inspection","Process quality","Customer quality"],["Quality manager","Supplier quality engineer","Customer quality engineer"]],
  ["Supply chain","Vice president, supply chain",["Purchasing","Production planning","Logistics"],["Production planning manager","Purchasing manager","Logistics lead"]],
  ["Finance","Chief financial officer",["Plant controlling","Cost accounting","Financial planning"],["Plant controller","Cost accountant","Financial planning analyst"]]],
 obj:[["speed",0,"Lines run at their rated speed","Line performance","Raise equipment effectiveness on the three bottleneck lines.","Run the line","Every shift runs to plan.",["oee","changeover"]],
  ["risk",1,"Defects stop at the plant door","First-time quality","Raise first-pass yield and cut customer complaints.","Quality built in","Customers never see our defects.",["fpy","complaints"]],
  ["customer",2,"Orders ship complete and on time","Delivery","Ship complete orders on the promised date.","Promise kept","Customers plan around our dates.",["otif","leadtime"]],
  ["cost",3,"Conversion cost falls every quarter","Conversion cost","Lower conversion cost per unit with less scrap.","Lean and steady","Less waste and more margin.",["convcost","scrap"]]],
 met:{oee:["Bottleneck equipment effectiveness","%",61,64,75,"max","Availability x performance x quality for the bottleneck lines","Run a one-week focused improvement on the line with the lowest score"],
  changeover:["Minutes per changeover","min",74,66,35,"min","Median minutes from last good part to first good part","Stage tools and material before the changeover starts"],
  fpy:["First-pass yield","%",91,92.5,97,"max","Units passing every test the first time / units started x 100","Contain the top defect and add an error-proofing check"],
  complaints:["Customer complaints per million units","ppm",420,380,150,"min","Customer complaints / units shipped x 1,000,000","Open a corrective action for every repeat complaint"],
  otif:["Orders shipped on time and in full","%",83,85,95,"max","Orders shipped complete by the promised date / orders shipped x 100","Freeze the schedule three days out and expedite only short parts"],
  leadtime:["Days from order to shipment","days",19,17,10,"min","Median days from order entry to shipment","Hold safety stock for the twenty fastest-moving parts"],
  convcost:["Conversion cost per unit","$",38,40,34,"min","Labor and overhead for production / units produced","Move overtime to the bottleneck only"],
  scrap:["Scrap rate","%",4.2,3.9,2,"min","Scrapped material cost / material issued cost x 100","Review scrap by cause at every morning meeting"],
  supplierotd:["Supplier on-time delivery","%",88,87,96,"max","Supplier lines received on time / supplier lines due x 100","Hold a monthly scorecard review with the five latest suppliers"],
  safety:["Recordable injury rate","per 200,000 hours",2.1,1.9,1,"min","Recordable injuries x 200,000 / hours worked","Run a safety walk on every shift for two weeks"]},
 prj:[["Bottleneck line improvement","Line improvement",0,1400,.45,"Focused improvement on the three bottleneck lines.",[["Labor","Improvement team time"],["Hardware","Line sensors and counters"]]],
  ["Quick changeover program","Quick changeover",0,520,.4,"Standard changeover kits and staging.",[["Hardware","Changeover carts and fixtures"],["Labor","Operator training time"]]],
  ["Inline vision inspection","Vision inspection",1,1150,.3,"Cameras catch defects at the station.",[["Hardware","Inspection cameras"],["Services","Integration engineering"]]],
  ["Schedule freeze and planning reset","Planning reset",2,600,.5,"A frozen three-day schedule with short-part expediting.",[["Software","Planning software configuration"],["Services","Planning process design"]]],
  ["Scrap reduction sprint","Scrap sprint",3,380,.35,"Daily scrap review by cause.",[["Labor","Quality engineer time"],["Services","Material testing"]]]],
 ven:["Carrow Tooling Supply","Bellhaven Automation","Quillon Vision Systems","Marrowstone Logistics","Heathfield Steel Service","Oxbridge Planning Consultants"],
 prc:[["Order to shipment",2,["otif","leadtime"],[["Enter the order","human"],["Check material availability","robot"],["Propose the schedule slot","agent"],["Build and pack","human"],["Release the shipment","gate"]]],
  ["Line changeover",0,["changeover","oee"],[["Stage tools and material","human"],["Run the changeover checklist","robot"],["Make the first part","human"],["Approve the first article","gate"],["Log the changeover time","robot"]]],
  ["Nonconformance and corrective action",1,["fpy","complaints"],[["Record the defect","human"],["Contain the stock","human"],["Suggest the likely cause","agent"],["Agree the corrective action","gate"],["Verify the fix","human"]]],
  ["Supplier delivery follow-up",2,["supplierotd"],[["Watch due lines","robot"],["Predict late deliveries","agent"],["Call the supplier","human"],["Expedite if short","human"],["Score the supplier","robot"]]],
  ["Daily scrap review",3,["scrap","convcost"],[["Pull scrap by cause","robot"],["Explain the top causes","agent"],["Review at the morning meeting","human"],["Assign actions","human"],["Approve a scrap write-off","gate"]]],
  ["Shift safety walk",0,["safety"],[["Plan the walk","robot"],["Walk the area","human"],["Record observations","human"],["Spot repeat hazards","agent"],["Close actions","human"]]]],
 dem:[["Predictive maintenance for presses","Machining",520,900,0,"Warns of press failures before they stop the line."],
  ["Supplier portal for delivery dates","Purchasing",210,460,2,"Suppliers confirm dates themselves."],
  ["Digital work instructions","Assembly",300,520,1,"Instructions on a screen at every station."],
  ["Energy monitoring by line","Plant controlling",180,320,3,"Shows energy cost per unit by line."]],
 vc:["Order to cash",[["Take the order",true,"Customer service rep",15,"Order system"],
  ["Plan production",false,"Production planner",90,"Spreadsheet schedule","Schedule Draft Agent proposes the schedule from orders and capacity for the planner to approve","Schedule Draft Agent"],
  ["Buy material",true,"Buyer",40,"Purchasing system"],["Build and test",true,"Operator",360,"Manufacturing execution system"],
  ["Inspect and release",false,"Quality inspector",30,"Paper inspection sheets","Inspection Summary Agent summarizes test results for the inspector to release","Inspection Summary Agent"],["Ship and invoice",true,"Shipping clerk",25,"Shipping and billing system"]]],
 ag:[["Schedule Draft Agent","Proposes the production schedule"],["Inspection Summary Agent","Summarizes test results for release"]],rb:["Material Check Robot","Checks material before a slot is offered"],
 voc:{customer:["customer","customers"],incident:["quality incident","quality incidents"],ticket:["work request","work requests"],request:["request","requests"],asset:["machine","machines"],site:["plant","plants"],downtime:["unplanned downtime","unplanned downtime"],workforce:["shift team","shift teams"],work_item:["work order","work orders"],frontline:["plant floor","plant floors"],service:["product line","product lines"],order:["order","orders"],case:["corrective action","corrective actions"],supplier:["supplier","suppliers"],revenue:["net sales","net sales"]}},

finserv:{label:"Financial services",sample:"storage",kind:"a financial services company",kw:["bank","banking","insurance","insurer","financial","fintech","credit","lending","asset management","payments","wealth","mortgage"],
 fns:[["Customer operations","Head of customer operations",["Account opening","Contact center","Payments operations"],["Account opening manager","Contact center director","Payments operations lead"]],
  ["Risk and compliance","Chief risk officer",["Financial crime","Operational risk","Regulatory reporting"],["Financial crime manager","Operational risk lead","Regulatory reporting manager"]],
  ["Lending","Head of lending",["Underwriting","Loan servicing","Collections"],["Underwriting manager","Loan servicing lead","Collections manager"]],
  ["Finance","Chief financial officer",["Financial planning","Treasury","Procurement"],["Financial planning lead","Treasury manager","Procurement manager"]]],
 obj:[["customer",0,"New customers can use their account the same day","Onboarding","Open accounts the same day with fewer drop-offs.","Easy to join","Customers start in minutes, not days.",["open","dropoff"]],
  ["risk",1,"Alerts are cleared on time with fewer false positives","Financial crime","Clear screening alerts within the service level and cut false positives.","Safe and sound","We stop crime without stopping customers.",["alerts","falsepos"]],
  ["speed",2,"Loan decisions in a day","Lending speed","Decide most loan applications within one working day.","Fast decisions","Borrowers hear back quickly and fairly.",["decide","docs"]],
  ["cost",3,"Cost to serve falls every quarter","Cost to serve","Lower the cost per account served.","Efficient by design","Every process costs less to run.",["cts","contact"]]],
 met:{open:["Accounts opened the same day","%",42,51,80,"max","Accounts opened on the day of application / accounts opened x 100","Pre-fill identity data and route exceptions to the onboarding queue"],
  dropoff:["Application drop-off","%",31,28,15,"min","Applications started but not finished / applications started x 100","Cut the form to the fields the policy requires"],
  alerts:["Screening alerts cleared in two days","%",71,76,95,"max","Alerts closed within two working days / alerts raised x 100","Add a second review shift and group alerts by customer"],
  falsepos:["False positive alert share","%",93,92,80,"min","Alerts closed as false positives / alerts closed x 100","Tune the three rules with the most false positives"],
  decide:["Loan decisions within a day","%",38,45,75,"max","Applications decided within one working day / applications x 100","Route complete low-risk applications to the fast lane"],
  docs:["Applications sent back for missing documents","%",26,23,10,"min","Applications returned for documents / applications x 100","Ask for every document up front with a checklist"],
  cts:["Cost to serve per account","$",61,63,52,"min","Operations cost / active accounts","Move the top three contact reasons to self-service"],
  contact:["Contacts per 100 accounts","count",38,36,25,"min","Customer contacts in the month / active accounts x 100","Fix the cause of the top contact reason each month"],
  breaks:["Payment breaks open over a day","count",44,39,10,"min","Payment reconciliation breaks older than one working day","Assign breaks by value every morning"],
  regfile:["Regulatory filings on time","%",96,97,100,"max","Filings submitted by the deadline / filings due x 100","Start the filing checklist ten working days before the deadline"]},
 prj:[["Same-day account opening","Same-day opening",0,1600,.4,"Digital identity checks and pre-filled forms.",[["Software","Identity verification software"],["Labor","Onboarding team overlap"]]],
  ["Alert triage improvement","Alert triage",1,1250,.45,"Grouped alerts and tuned rules.",[["Software","Screening rule tuning"],["Labor","Second review shift"]]],
  ["Lending fast lane","Fast lane",2,980,.35,"Complete low-risk applications go straight to decision.",[["Software","Decision engine configuration"],["Services","Credit policy design"]]],
  ["Self-service for top contact reasons","Self-service",3,720,.5,"Customers fix the top three issues themselves.",[["Software","Self-service portal"],["Services","Content design"]]],
  ["Payment break reduction","Break reduction",3,430,.3,"Daily break assignment by value.",[["Labor","Reconciliation analyst time"],["Software","Matching rules"]]]],
 ven:["Ardenwick Identity Services","Kingsmere Data Partners","Tidewell Compliance Tools","Hartwell Contact Solutions","Fennimore Decision Systems","Silverbank Consulting Group"],
 prc:[["Application to open account",0,["open","dropoff"],[["Receive the application","robot"],["Verify identity","robot"],["Review an exception","agent"],["Approve the exception","gate"],["Open and fund the account","human"]]],
  ["Screening alert review",1,["alerts","falsepos"],[["Raise the alert","robot"],["Group related alerts","agent"],["Review the customer","human"],["Escalate a true match","gate"],["Close and record","human"]]],
  ["Loan application to decision",2,["decide","docs"],[["Collect documents","robot"],["Check completeness","agent"],["Underwrite","human"],["Credit approval","gate"],["Send the decision","robot"]]],
  ["Contact reason review",3,["contact","cts"],[["Tag every contact","agent"],["Rank the reasons","robot"],["Find the cause","human"],["Agree the fix","human"],["Check the result","robot"]]],
  ["Payment reconciliation",0,["breaks"],[["Match payments","robot"],["Suggest matches for breaks","agent"],["Investigate the break","human"],["Approve the adjustment","gate"],["Post and close","robot"]]],
  ["Regulatory filing preparation",1,["regfile"],[["Gather the data","robot"],["Draft the narrative","agent"],["Review the filing","human"],["Sign off","gate"],["Submit","human"]]]],
 dem:[["Consented account data for underwriting","Underwriting",380,820,2,"Uses consented account data instead of statements."],
  ["Voice authentication in the contact center","Contact center",290,410,3,"Shortens identity checks on calls."],
  ["Entity resolution for screening","Financial crime",450,700,1,"Matches the same person across systems."],
  ["Instant payments readiness","Payments operations",600,650,0,"Prepares operations for instant payments."]],
 vc:["Application to first transaction",[["Apply",true,"Customer",12,"Mobile app"],
  ["Verify identity",false,"Onboarding analyst",25,"Document images reviewed by eye","Identity Review Agent checks the documents and flags only exceptions for the analyst","Identity Review Agent"],
  ["Screen",true,"Screening analyst",5,"Screening system"],["Approve",true,"Onboarding manager",15,"Workflow"],["Fund the account",true,"Payments team",10,"Payments system"],
  ["First contact",false,"Contact center agent",9,"Notes in a shared mailbox","Contact Summary Agent drafts the answer for the agent to send","Contact Summary Agent"]]],
 ag:[["Identity Review Agent","Checks identity documents and flags exceptions"],["Contact Summary Agent","Drafts answers for contact center agents"]],rb:["Payment Matching Robot","Matches payments to invoices by rule"],
 voc:{customer:["customer","customers"],incident:["operational incident","operational incidents"],ticket:["service request","service requests"],request:["request","requests"],asset:["account","accounts"],site:["branch","branches"],downtime:["outage","outages"],workforce:["team","teams"],work_item:["case","cases"],frontline:["contact center","contact centers"],service:["product","products"],order:["transaction","transactions"],case:["case","cases"],supplier:["supplier","suppliers"],revenue:["net revenue","net revenue"]}},

public:{label:"Public sector",sample:"core",kind:"a public sector agency",kw:["government","public","agency","city","county","state","federal","municipal","council","ministry","department","school district","transit"],
 fns:[["Resident services","Director, resident services",["Contact center","Permits and licensing","Benefits"],["Contact center manager","Permits manager","Benefits program manager"]],
  ["Infrastructure and facilities","Director, public works",["Roads","Water","Facilities"],["Roads superintendent","Water operations manager","Facilities manager"]],
  ["Technology","Chief information officer",["Digital services","Infrastructure","Security"],["Digital services lead","Infrastructure manager","Security officer"]],
  ["Finance and procurement","Chief financial officer",["Budget office","Procurement","Grants"],["Budget director","Procurement officer","Grants manager"]]],
 obj:[["customer",0,"Residents get answers on the first contact","Resident experience","Resolve most requests on the first contact.","Easy to deal with","Residents get help the first time.",["fcr","permitdays"]],
  ["speed",1,"Repairs happen before residents report them","Planned upkeep","Shift road and water work from reactive to planned.","Ahead of the problem","Infrastructure is fixed before it fails.",["plannedw","pothole"]],
  ["risk",2,"Public services stay up and safe","Resilience","Keep resident services online and patch on time.","Always on","Services work when residents need them.",["uptime","patch"]],
  ["cost",3,"Every grant dollar is spent and reported on time","Stewardship","Spend grants on schedule with clean reporting.","Trusted with public money","Every dollar is accounted for.",["grantspend","pocycle"]]],
 met:{fcr:["Requests resolved on first contact","%",58,63,80,"max","Requests resolved on the first contact / requests received x 100","Give agents the top twenty answers and permit status lookups"],
  permitdays:["Days to issue a permit","days",24,21,10,"min","Median days from complete application to permit issued","Review complete applications in a daily batch"],
  plannedw:["Planned work share","%",41,46,70,"max","Planned work orders / all work orders x 100","Inspect the twenty worst road segments each month"],
  pothole:["Days to fix a reported pothole","days",9,8,3,"min","Median days from report to repair","Batch repairs by area every morning"],
  uptime:["Resident portal availability","%",99.1,99.3,99.9,"max","Minutes the resident portal is available / minutes in the month x 100","Add a second region for the portal"],
  patch:["Critical patches applied in 14 days","%",72,78,98,"max","Critical patches applied within 14 days / critical patches released x 100","Pre-approve a weekly patch window"],
  grantspend:["Grant funds spent on schedule","%",76,80,95,"max","Grant funds spent by the planned date / funds planned x 100","Review grant burn monthly with each program manager"],
  pocycle:["Days from requisition to purchase order","days",32,28,14,"min","Median days from approved requisition to issued purchase order","Use cooperative contracts for common purchases"],
  calls:["Average wait in the contact center","min",11,9,4,"min","Mean minutes from queue entry to answer","Offer a callback at four minutes"],
  water:["Water main breaks per 100 miles","count",21,19,12,"min","Main breaks in the year / miles of main x 100","Replace mains with two breaks in five years first"]},
 prj:[["Resident answer center","Answer center",0,900,.4,"One knowledge base for every contact channel.",[["Software","Knowledge base software"],["Labor","Agent training time"]]],
  ["Online permitting","Online permits",0,1300,.35,"Apply, pay fees and track permits online.",[["Software","Permitting software"],["Services","Process redesign"]]],
  ["Road condition survey","Road survey",1,700,.5,"Every road segment scored for planned repair.",[["Services","Survey contractor"],["Hardware","Vehicle cameras"]]],
  ["Portal resilience upgrade","Portal resilience",2,1100,.45,"A second hosting region and weekly patching.",[["Services","Hosting migration"],["Labor","Infrastructure team time"]]],
  ["Grant tracking and reporting","Grant tracking",3,420,.3,"Monthly grant burn reviews and reports.",[["Software","Grant tracking software"],["Labor","Grants analyst time"]]]],
 ven:["Civicline Software","Stonebridge Survey Contractors","Harborview Hosting","Mapleton Training Group","Greywater Engineering","Clearfield Grants Advisory"],
 prc:[["Resident request to resolution",0,["fcr","calls"],[["Receive the request","robot"],["Suggest the answer","agent"],["Answer or route","human"],["Approve a fee waiver","gate"],["Close and survey","robot"]]],
  ["Permit application to issue",0,["permitdays"],[["Receive the application","robot"],["Check completeness","agent"],["Review the plans","human"],["Approve the permit","gate"],["Issue the permit","robot"]]],
  ["Road inspection to repair",1,["plannedw","pothole","water"],[["Score the segment","robot"],["Rank repairs","agent"],["Plan the crew","human"],["Repair","human"],["Inspect the repair","human"]]],
  ["Patch management",2,["patch","uptime"],[["Receive the patch notice","robot"],["Assess the impact","agent"],["Test the patch","human"],["Approve the change","gate"],["Deploy","robot"]]],
  ["Grant drawdown and report",3,["grantspend"],[["Track spend","robot"],["Draft the report","agent"],["Review with the program","human"],["Approve the drawdown","gate"],["Submit","human"]]],
  ["Requisition to purchase order",3,["pocycle"],[["Raise the requisition","human"],["Check the budget","robot"],["Suggest a contract","agent"],["Approve the purchase","gate"],["Issue the order","robot"]]]],
 dem:[["Text message updates on requests","Contact center",120,300,0,"Residents get status updates without calling."],
  ["Leak detection sensors","Water",480,760,1,"Finds leaks before mains break."],
  ["Single sign-on for residents","Digital services",260,380,2,"One account for every resident service."],
  ["Cooperative contract catalog","Procurement",80,240,3,"Lists contracts ready to use."]],
 vc:["Request to resolved service",[["Report the need",true,"Resident",6,"Resident portal"],
  ["Route the request",false,"Contact center agent",8,"Email and phone notes","Request Routing Agent suggests the department and priority for the agent to confirm","Request Routing Agent"],
  ["Plan the work",true,"Supervisor",30,"Work management system"],["Do the work",true,"Field crew",180,"Mobile work orders"],
  ["Inspect",false,"Inspector",25,"Paper checklists","Inspection Notes Agent turns photos and notes into the record for the inspector to sign","Inspection Notes Agent"],["Close and report",true,"Program manager",15,"Reporting system"]]],
 ag:[["Request Routing Agent","Suggests the department and priority for requests"],["Inspection Notes Agent","Turns inspection photos and notes into records"]],rb:["Budget Check Robot","Checks the budget before a requisition moves on"],
 voc:{customer:["resident","residents"],incident:["service disruption","service disruptions"],ticket:["service request","service requests"],request:["request","requests"],asset:["public asset","public assets"],site:["facility","facilities"],downtime:["outage","outages"],workforce:["crew","crews"],work_item:["work order","work orders"],frontline:["contact center","contact centers"],service:["public service","public services"],order:["work order","work orders"],case:["case","cases"],supplier:["contractor","contractors"],revenue:["revenue","revenue"]}},

retail:{label:"Retail",sample:"storage",kind:"a retailer with stores and online sales",kw:["retail","store","stores","shop","shops","coffee","bakery","cafe","ecommerce","e-commerce","consumer","grocery","restaurant","hospitality","fashion","apparel","hotel"],
 fns:[["Store operations","Vice president, store operations",["Regional operations","Store standards","Loss prevention"],["Regional director","Store standards manager","Loss prevention manager"]],
  ["Digital and customer","Chief customer officer",["Online store","Customer care","Loyalty"],["Online store director","Customer care manager","Loyalty program lead"]],
  ["Supply chain","Vice president, supply chain",["Distribution centers","Replenishment","Transportation"],["Distribution center manager","Replenishment manager","Transportation lead"]],
  ["Finance and merchandising","Chief financial officer",["Merchandise planning","Financial planning","Procurement"],["Merchandise planning director","Financial planning lead","Procurement manager"]]],
 obj:[["customer",1,"Customers find what they came for","Availability","Raise on-shelf availability and the online fill rate.","Always in stock","The item is there when the customer is.",["osa","fill"]],
  ["speed",2,"Online orders reach customers in two days","Fast delivery","Ship most online orders within two days.","Fast to the door","Orders arrive when promised.",["ship2","dcpick"]],
  ["cost",3,"Markdowns and shrink fall","Margin","Cut markdowns and shrink without losing sales.","Protect the margin","Less waste and a better margin.",["markdown","shrink"]],
  ["risk",0,"Stores run safely and to standard","Store standards","Pass store standards audits and cut incidents.","Safe stores","Every store is safe to shop and work in.",["audit","incid"]]],
 met:{osa:["On-shelf availability","%",91,92,97,"max","Store item checks found on the shelf / items checked x 100","Move replenishment for the top 200 items to daily"],
  fill:["Online order fill rate","%",93,94,98,"max","Online order lines filled / lines ordered x 100","Reserve stock for online orders at the two busiest stores"],
  ship2:["Online orders delivered in two days","%",62,68,85,"max","Online orders delivered within two days / orders shipped x 100","Ship from the nearest store when the warehouse is short"],
  dcpick:["Warehouse lines picked per hour","lines",88,92,115,"max","Lines picked / picker hours","Re-slot the fastest movers near the packing stations"],
  markdown:["Markdown share of sales","%",11.5,12.2,9,"min","Markdown dollars / gross sales x 100","Move slow sellers between stores before marking down"],
  shrink:["Shrink rate","%",1.9,2.0,1.4,"min","Inventory loss / sales x 100","Focus loss prevention on the ten stores with the highest shrink"],
  audit:["Store standards audit pass rate","%",78,81,95,"max","Stores passing the standards audit / stores audited x 100","Coach the stores below 80 on the three most missed items"],
  incid:["Incidents per store per month","count",1.6,1.5,0.8,"min","Customer and staff incidents reported / stores in the month","Fix the top incident cause in every store in the region"],
  care:["Customer care first contact resolution","%",66,70,85,"max","Contacts resolved the first time / contacts x 100","Give care agents refund authority up to a set limit"],
  nps2:["Customer satisfaction score","points",44,46,55,"max","Share of promoters less the share of detractors","Call back detractors within two days"]},
 prj:[["Daily replenishment for top items","Daily replenishment",0,980,.45,"Daily store orders for the top 200 items.",[["Software","Replenishment engine configuration"],["Labor","Store ordering time"]]],
  ["Ship from store","Ship from store",1,1500,.4,"Stores fill online orders when the warehouse is short.",[["Software","Order routing software"],["Labor","Store packing staff"],["Hardware","Store packing stations"]]],
  ["Warehouse re-slotting","Re-slotting",1,640,.35,"Fast movers move near the packing stations.",[["Services","Slotting analysis"],["Labor","Warehouse overtime"]]],
  ["Markdown optimization","Markdown tool",2,720,.5,"Model-based markdown timing.",[["Software","Pricing analytics software"],["Services","Merchandise analyst training"]]],
  ["Store standards app","Standards app",3,350,.3,"Mobile audits with photo evidence.",[["Software","Audit app licenses"],["Labor","Regional coaching time"]]]],
 ven:["Wrenfield Packaging","Brackenridge Freight","Sunmeadow Store Fixtures","Halcyon Pricing Analytics","Copperleaf Staffing","Northmarch Software"],
 prc:[["Store replenishment",2,["osa"],[["Count the shelf gaps","human"],["Calculate the order","robot"],["Adjust for promotions","agent"],["Approve a large order","gate"],["Receive and fill","human"]]],
  ["Online order to delivery",1,["ship2","fill"],[["Receive the order","robot"],["Choose where to ship from","agent"],["Pick and pack","human"],["Hand to the carrier","human"],["Confirm delivery","robot"]]],
  ["Warehouse picking",2,["dcpick"],[["Release the wave","robot"],["Pick","human"],["Suggest re-slotting","agent"],["Pack","human"],["Ship","human"]]],
  ["Markdown decision",3,["markdown","shrink"],[["Find slow sellers","robot"],["Model markdown timing","agent"],["Propose transfers first","human"],["Approve the markdown","gate"],["Change the price","robot"]]],
  ["Store standards audit",0,["audit","incid"],[["Schedule the audit","robot"],["Walk the store","human"],["Score from photos","agent"],["Agree the actions","human"],["Sign off","gate"]]],
  ["Customer care contact",1,["care","nps2"],[["Receive the contact","robot"],["Suggest the answer","agent"],["Resolve or refund","human"],["Approve a large refund","gate"],["Survey","robot"]]]],
 dem:[["Electronic shelf labels pilot","Store standards",420,600,2,"Prices change without paper labels."],
  ["Curbside pickup in every store","Online store",350,780,1,"Customers collect orders without coming inside."],
  ["Camera shelf gap checks","Regional operations",510,820,0,"Cameras spot empty shelves."],
  ["Returns triage at the warehouse","Distribution centers",160,350,2,"Sorts returns for resale faster."]],
 vc:["Range to delivered order",[["Plan the range",true,"Merchandise planner",240,"Planning system"],["Buy and receive",true,"Buyer",60,"Purchasing system"],
  ["Replenish stores",false,"Store manager",45,"Handheld counts and a spreadsheet","Replenishment Assist Agent proposes the store order for the manager to approve","Replenishment Assist Agent"],
  ["Sell",true,"Store associate",5,"Point of sale"],["Fulfill online orders",true,"Warehouse picker",20,"Warehouse system"],
  ["Handle returns",false,"Customer care agent",12,"Email and notes","Returns Triage Agent drafts the return decision for the agent to confirm","Returns Triage Agent"]]],
 ag:[["Replenishment Assist Agent","Proposes store orders for managers to approve"],["Returns Triage Agent","Drafts return decisions for care agents"]],rb:["Price Change Robot","Applies approved price changes to every channel"],
 voc:{customer:["customer","customers"],incident:["store incident","store incidents"],ticket:["service request","service requests"],request:["request","requests"],asset:["store fixture","store fixtures"],site:["store","stores"],downtime:["outage","outages"],workforce:["store team","store teams"],work_item:["task","tasks"],frontline:["store floor","store floors"],service:["channel","channels"],order:["order","orders"],case:["customer case","customer cases"],supplier:["supplier","suppliers"],revenue:["net sales","net sales"]}}};
/* the fallback when nothing in the answer matches: the template closest to the default sample company (standards publishing) */
const FALLBACK="standards";

/* ---------- fictional name pools (never a full name in this file; every full name is checked against the page) ---------- */
const FIRST=["Anouk","Bram","Caius","Delphine","Emeric","Farida","Gideon","Hollis","Imogen","Jory","Kesia","Lorcan","Mireille","Nikhil","Odette","Perrin","Quilla","Rafferty","Saoirse","Tobiah",
 "Ulla","Vashti","Wendell","Xiomara","Yusra","Zebulon","Amara","Benedikt","Calla","Dashiell","Elowen","Fenwick","Greer","Hamza","Isolde","Jasper","Kalinda","Leopold","Marisela","Nnamdi"];
const LAST=["Ashgrove","Calloway","Dunmore","Everhart","Fairbanks","Glenholm","Harrowgate","Ingleby","Jessamine","Kettering","Lindqvist","Marchetti","Northcott","Oyelaran","Pemberton","Quarles",
 "Ravensdale","Stroud","Thistlewood","Underhill","Vandermeer","Whitlock","Yardley","Zellner","Abernethy","Brightwater","Coldwell","Delacroix","Foxley","Gallard","Hethersett","Kilbride",
 "Lowenthal","Merriweather","Pellegrini","Rookwood","Sandoval","Tremaine","Wexford","Okonta"];

/* ---------- deterministic randomness: the same answers give the same company ---------- */
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}

/* ---------- names in the page that a generated person may not share (the browser port of gen_pack's source check) ---------- */
let SRC_TXT=null;
function pageText(){if(SRC_TXT!=null)return SRC_TXT;let t="";G(()=>{document.querySelectorAll("script").forEach(s=>{if(!s.src&&s.textContent.length>1000)t+=s.textContent})});
 /* the pools themselves are in the page as single words, which cannot form a full name */
 SRC_TXT=t;return t}
function takenNames(){const s=new Set();const add=n=>{if(n&&String(n).split(/\s+/).length>=2)s.add(String(n))};
 G(()=>DIR.forEach(d=>add(d.name)));G(()=>PEOPLE.forEach(p=>add(Array.isArray(p)?p[0]:p.name)));G(()=>IDENT.people.forEach(p=>add(p.name)));
 G(()=>AGENTRT.registry().forEach(r=>add(r.name)));
 G(()=>DATA.tenants().forEach(t=>{if(t.gen)return;DATA.get("people",{tenant:t.id}).forEach(p=>add(p.name));if(t.lead)add(t.lead.n)}));
 G(()=>Object.keys(TENANT.info).forEach(k=>{const l=TENANT.info[k].lead;if(l&&!(DATA.tenantInfo(k)||{}).gen)add(l.n)}));return s}
const inPage=n=>{const t=pageText();return !!t&&t.indexOf(n)>=0};

/* ---------- industry matching ---------- */
function match(text){const q=String(text||"").toLowerCase().trim();if(!q)return{id:FALLBACK,score:0,fallback:true};
 if(IND[q])return{id:q,score:9,fallback:false};
 const lab=Object.keys(IND).find(k=>IND[k].label.toLowerCase()===q);if(lab)return{id:lab,score:9,fallback:false};
 let best=null,bs=0;Object.keys(IND).forEach(k=>{let s=0;IND[k].kw.forEach(w=>{const re=new RegExp("(^|[^a-z])"+w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));if(re.test(q))s+=w.length>3?2:1});if(s>bs){bs=s;best=k}});
 return best?{id:best,score:bs,fallback:false}:{id:FALLBACK,score:0,fallback:true}}
function sampleName(k){return G(()=>(DATA.tenantInfo(k)||{}).org,k)}

/* ---------- the company name the buyer types: kept honest and safe ---------- */
function cleanName(raw){let n=String(raw==null?"":raw).replace(/[\u2014\u2013]/g,"-").replace(/[<>{}`]/g,"").replace(/\s+/g," ").trim().slice(0,60);const notes=[];
 if(!n)return{name:"Your company",notes:["No name given, so the sample is called Your company."]};
 if(REAL.some(re=>re.test(n))){notes.push("That name cannot be used in the prototype, so the sample is called Your company.");return{name:"Your company",notes}}
 const other=G(()=>DATA.tenants().filter(t=>!t.gen).some(t=>[t.org,t.short].filter(Boolean).some(o=>o.toLowerCase()===n.toLowerCase()||n.toLowerCase().indexOf(String(o).toLowerCase())>=0)),false);
 if(other){notes.push("That is the name of a sample company, so yours is called Your company.");return{name:"Your company",notes}}
 const before=n;n=n.replace(/\b(Core|Fabric|Trellis)\b/g,w=>w[0]+".");if(n!==before)notes.push("A word the prototype does not show was shortened.");
 return{name:n,notes}}
function prefixOf(name){const w=name.replace(/[^A-Za-z ]/g," ").split(/\s+/).filter(Boolean);let p=(w.length>1?w[0][0]+w[1][0]:(w[0]||"YC").slice(0,2)).toUpperCase();
 const used=new Set(["LH","RR","CV","MS","PR","BL","IV","LG","PJ","KR","YC0"]);G(()=>Object.values(W.TENANT_PACKS||{}).forEach(pk=>{const id=((pk.rows||{}).objectives||[])[0];if(id&&id.id)used.add(String(id.id).split("-")[0])}));
 if(p.length<2||used.has(p)||!/^[A-Z]{2}$/.test(p))p="YC";return p}

/* ---------- answers -> spec (the same shape as tools/generators/gen_pack_specs/<id>.json) ---------- */
function spec(ans,opts){ans=ans||{};opts=opts||{};const m=match(ans.industry);const T=IND[m.id];const cn=cleanName(ans.name);const name=cn.name;
 const size=SIZES[ans.size]?ans.size:"m",pain=PAINS[ans.pain]?ans.pain:"speed",role=ROLES[ans.role]?ans.role:"coo";const mult=SIZES[size].m;
 const R=rng(hash([name,m.id,size,pain].join("|")));const ri=(a,b)=>a+Math.floor(R()*(b-a+1));const rk=n=>Math.round(n/10)*10;
 const P=prefixOf(name),p=P.toLowerCase(),tid=opts.id||DEF_ID;const short=name.length>26?name.split(" ").slice(0,3).join(" "):name;
 /* people: fresh fictional names, none taken anywhere in the page */
 const taken=takenNames();const used=new Set();const fi=FIRST.slice(),la=LAST.slice();
 for(let i=fi.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[fi[i],fi[j]]=[fi[j],fi[i]]}for(let i=la.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[la[i],la[j]]=[la[j],la[i]]}
 let ni=0;const person=()=>{for(let k=0;k<FIRST.length*LAST.length;k++){const n=fi[ni%fi.length]+" "+la[(ni+Math.floor(ni/la.length))%la.length];ni++;if(!used.has(n)&&!taken.has(n)&&!inPage(n)){used.add(n);return n}}return "Person "+(++ni)};
 const leadT=T.lead||"Chief operating officer";const lead={n:person(),t:leadT};
 const fnPeople=T.fns.map(f=>{const L={n:person(),t:f[1]};return{f,lead:L,staff:f[3].map(()=>person())}});
 const org={lead,fns:fnPeople.map(x=>({n:x.f[0],lead:x.lead,teams:x.f[2].slice()}))};
 const people=[];fnPeople.forEach(x=>x.staff.forEach((n,i)=>people.push({name:n,role:x.f[3][i],team:x.f[2][i%x.f[2].length],mgr:i===0?x.lead.n:x.staff[0]})));
 const pool=fi2=>[fnPeople[fi2].lead.n].concat(fnPeople[fi2].staff);const rot={};
 const pair=f=>{const a=pool(f);rot[f]=(rot[f]||0)+1;const k=rot[f];return[a[k%a.length],a[(k+1)%a.length]]};
 T.ag.forEach((a,i)=>{const f=i===0?0:Math.min(3,T.fns.length-1);people.push({name:a[0],role:"AI agent",team:T.fns[f][2][0],kind:"agent",sponsor:fnPeople[f].lead.n,backup:fnPeople[f].staff[0],tier:2,hrs:ri(6,14),does:a[1]})});
 people.push({name:T.rb[0],role:"Robot",team:T.fns[2][2][0],kind:"robot",sponsor:fnPeople[2].staff[0],backup:fnPeople[2].lead.n,does:T.rb[1]});
 /* the buyer's pain decides which objective leads and which project runs over */
 const order=T.obj.map((o,i)=>i);const pi=T.obj.findIndex(o=>o[0]===(pain==="people"?"speed":pain));if(pi>0){order.splice(order.indexOf(pi),1);order.unshift(pi)}
 const oid=i=>P+"-O"+(order.indexOf(i)+1);const mid=k=>p+"_m_"+k;
 const metrics=Object.keys(T.met).map(k=>{const x=T.met[k];const oi=T.obj.findIndex(o=>o[7].indexOf(k)>=0);const f=oi>=0?T.obj[oi][1]:ri(0,3);const [o,b]=pair(f);
  const r={id:mid(k),n:x[0],u:x[1],base:x[2],cur:x[3],tgt:x[4],dir:x[5],owner:o,backup:b,f:x[6],rem:x[7],label:"simulated"};if(oi>=0)r.obj=oid(oi);return r});
 const objectives=order.map((i,pos)=>{const o=T.obj[i];const f=o[1];return{id:P+"-O"+(pos+1),n:o[2],sub:o[3],owner:fnPeople[f].lead.n,backup:fnPeople[f].staff[0],story:o[4],
  krs:o[7].map((k,j)=>{const x=T.met[k];const [ow,bk]=pair(f);return{id:P+"-K"+(pos+1)+(j+1),n:x[0],u:x[1]==="%"?"%":" "+x[1],start:x[2],cur:x[3],tgt:x[4],metric:mid(k),owner:ow,backup:bk}})}});
 const pillars=order.map((i,pos)=>({id:P+"-PL"+(pos+1),n:T.obj[i][5],d:T.obj[i][6],obj:P+"-O"+(pos+1)}));
 const CAT={Labor:"LAB",Software:"SW",Services:"SVC",Hardware:"HW",Vendor:"VEN"};
 const painProj=T.prj.findIndex(x=>x[2]===pi);const projects=[],lines=[],invoices=[];let inv=6101;const days=[9,12,14,16,19,21,23,27,30];
 T.prj.forEach((x,i)=>{const id=P+"-PR"+(i+1);const f=T.obj[x[2]][1];const [o,b]=pair(f);const bac=Math.max(40,rk(x[3]*mult));const over=i===(painProj>=0?painProj:0);
  const sh=x[6].length===3?[.45,.35,.2]:[.6,.4];let act=0;
  x[6].forEach((l,j)=>{const appr=Math.round(bac*1000*sh[j]/1000)*1000;const [lo,lb]=pair(f);const a=Math.round(appr*x[4]*(.9+R()*.2)/1000)*1000;act+=a;
   const row={id:id+"-"+CAT[l[0]],p:id,cat:l[0],n:l[1],appr,comm:Math.round(appr*(over&&j===0?.99:.8+R()*.15)/1000)*1000,act:a,fcst:over&&j===0?Math.round(appr*1.09/1000)*1000:Math.round(appr*(.95+R()*.05)/1000)*1000,own:lo,bk:lb};
   if(over&&j===0)row.why="Forecast runs about 9% over approved because "+PAINS[pain].why+".";lines.push(row)});
  projects.push({id,n:x[0],short:x[1],owner:o,backup:b,obj:oid(x[2]),bac,paid:Math.round(act/1000),health:over?"bad":(R()<.5?"good":"warn"),pct:Math.round(x[4]*100),story:x[5]+(over?" The forecast is over budget: "+PAINS[pain].why+".":"")})});
 const mkInv=(l,k,rec)=>{const amt=Math.max(1000,Math.round(l.appr*(.08+R()*.08)/100)*100);
  invoices.push({id:P+"-INV-"+(inv++),vendor:T.ven[k%T.ven.length],amt,p:l.p,line:l.id,due:"Oct "+days[k%days.length],rec,own:l.own,bk:l.bk,
   story:rec==="hold"?"Bills more than the line has left, and the line's forecast is already over approved. Hold until the owner confirms the work.":rec==="review"?"The quantity differs from the receipt by a small amount. Review before paying.":"Matches the purchase order and the delivery record."})};
 projects.forEach((pr,i)=>{const l=lines.find(x=>x.p===pr.id);mkInv(l,i,pr.health==="bad"?"hold":i===(painProj===1?2:1)?"review":"pay")});
 {const l=lines.filter(x=>x.p===projects[0].id)[1]||lines[1];mkInv(l,5,"pay")}
 const demand=T.dem.map((d,i)=>{const f=T.obj[d[4]][1];const [s,b]=pair(f);return{id:P+"-D"+(i+1),n:d[0],who:d[1],sp:s,bk:b,cost:rk(d[2]*mult),ben:rk(d[3]*mult),strat:ri(2,5),risk:ri(1,4),urg:ri(2,5),obj:oid(d[4]),why:d[5]}});
 const processes=T.prc.map((x,i)=>{const [o,b]=pair(x[1]);const dims={};DIMS.forEach(d=>dims[d]=U.clamp(ri(1,4)-(d==="automated"&&R()<.5?1:0),1,5));const lvl=Math.min(...DIMS.map(d=>dims[d]));
  return{id:P+"-P0"+(i+1),n:x[0],owner:o,backup:b,metrics:x[2].map(mid),steps:x[3].map(s=>s.slice()),maturity:{dims,target:U.clamp(lvl+ri(1,2),2,5),label:"simulated"}}});
 /* COO brief inputs: the executive, the four function leads and their first people, hours a week (modeled) */
 const bump=pain==="people"?8:0;const wl=[[lead.n,lead.t,"Executive office",true]].concat(fnPeople.map(x=>[x.lead.n,x.lead.t,x.f[0],true]),fnPeople.map(x=>[x.staff[0],x.f[3][0],x.f[0],false]),fnPeople.slice(0,3).map(x=>[x.staff[1],x.f[3][1],x.f[0],false]));
 const workload=wl.map(w=>{const cap=w[3]?45:40,load=ri(92,124)+bump,tot=cap*load/100;const wt=w[3]?[.16,.34,.18,.2,.12]:[.2,.16,.1,.44,.1];const h=wt.map(x=>Math.max(1,Math.round(tot*x*(.85+R()*.3))));
  return[w[0],w[1],w[2],load,cap].concat(h)});
 const value_chain={n:T.vc[0],steps:T.vc[1].map(s=>{const r={n:s[0],in:s[1],who:s[2],min:s[3],note:s[4]};if(s[5]){r.bridge=s[5];r.agent=s[6]}return r})};
 const cust=T.voc.customer[1],pw=PAINS[pain].w.replace("customers",cust);
 const story=short+": "+T.kind+" with "+SIZES[size].n.toLowerCase()+". The "+ROLES[role].toLowerCase()+"'s first goal: "+objectives[0].n.charAt(0).toLowerCase()+objectives[0].n.slice(1)+". Today "+pw+".";
 return{tenant:tid,prefix:p,label:"simulated",generated:true,
  info:{org:name,short,kind:T.kind.charAt(0).toUpperCase()+T.kind.slice(1),industry:T.label,fund:rk(2000*mult),fy:"FY27",story,gen:true,simulated:true},
  answers:{industry:m.id,matched:!m.fallback,size,pain,role},notes:cn.notes.concat(m.fallback?["No industry matched, so the company is built on the closest sample ("+T.label.toLowerCase()+")."]:[]),
  reuse:["journeys","workflows","personas"],sample:T.sample,images:{},org,people,pillars,objectives,projects,budget_lines:lines,invoices,demand,metrics,processes,
  vocabulary:JSON.parse(JSON.stringify(T.voc)),coo:{workload,value_chain}}}

/* ---------- spec -> rows, with the checks of gen_pack.py (port; same messages) ---------- */
function build(sp,otherOrgs){const E=[],Wn=[];const tid=sp.tenant;const info=Object.assign({},sp.info||{});const pfx=sp.prefix||(tid||"x").slice(0,2);
 if(!tid||!/^[a-z][a-z0-9_]*$/.test(tid))E.push("tenant: a lowercase id is required");["org","short","kind"].forEach(k=>{if(!info[k])E.push("info."+k+" is required")});
 const rows={};const org=sp.org||{};const lead=org.lead||{};if(!lead.n)E.push("org.lead.n (the executive the demo is told to) is required");const fns=org.fns||[];const people=[];
 const addP=(p,team)=>{if(!p.name){E.push("person without a name");return}if(people.some(x=>x.name===p.name))return;const kind=p.kind||"human";if(!KINDS.has(kind))E.push("person "+p.name+": kind must be human, agent or robot");
  const r={id:pfx+"-"+sl(p.name),name:p.name,kind,role:p.role||"",team:p.team||team||"",org:kind==="human"?info.org||"":"",loc:p.loc||"",skills:p.skills||[]};
  ["backup","sponsor","tier","hrs","does","mgr"].forEach(k=>{if(p[k]!=null)r[k]=p[k]});people.push(r)};
 if(lead.n)addP({name:lead.n,role:lead.t||"",team:"Executive office"});
 fns.forEach(f=>{if(!f.n||!(f.lead||{}).n){E.push("org.fns: each function needs n and lead.n");return}addP({name:f.lead.n,role:f.lead.t||"",mgr:lead.n},f.n)});
 (sp.people||[]).forEach(p=>addP(p));rows.people=people;const names=new Set(people.map(p=>p.name));const humans=new Set(people.filter(p=>p.kind==="human").map(p=>p.name));
 const pair=(where,r,ok,bk,need)=>{ok=ok||"owner";bk=bk||"backup";const o=r[ok],b=r[bk];if(!o)E.push(where+": "+ok+" is required (R12)");else if(!humans.has(o))E.push(where+": "+ok+" "+o+" is not a person in this pack");
  if(need!==false){if(!b)E.push(where+": "+bk+" is required (R12)");else if(!humans.has(b))E.push(where+": "+bk+" "+b+" is not a person in this pack");else if(b===o)E.push(where+": owner and backup must differ (R12)")}};
 people.forEach(p=>{if(p.kind!=="human"){if(!p.sponsor)E.push("person "+p.name+": an agent or robot needs a human sponsor (R12)");else if(!humans.has(p.sponsor))E.push("person "+p.name+": sponsor "+p.sponsor+" is not a person in this pack")}});
 const ids=(ent,L,key)=>{key=key||"id";const s=new Set();L.forEach((r,i)=>{const v=r[key];if(!v)E.push(ent+"["+i+"]: missing "+key);else if(s.has(v))E.push(ent+": duplicate "+key+" "+v);s.add(v)});return s};
 const objs=[],krs=[];(sp.objectives||[]).forEach(o=>{const r=Object.assign({},o);delete r.krs;r.t="obj";pair("objective "+o.id,o);objs.push(r);
  (o.krs||[]).forEach(k=>{const kr=Object.assign({},k,{o:o.id});pair("key result "+k.id,kr);if(kr.start==null||kr.tgt==null||kr.cur==null)E.push("key result "+k.id+": start, cur and tgt are required");if(!kr.label)kr.label="simulated";krs.push(kr)})});
 const oids=ids("objectives",objs);ids("key_results",krs);rows.objectives=objs;rows.key_results=krs;rows.pillars=(sp.pillars||[]).map(x=>Object.assign({},x));ids("pillars",rows.pillars);
 rows.projects=(sp.projects||[]).map(x=>Object.assign({},x));const pids=ids("projects",rows.projects);
 rows.projects.forEach(p=>{pair("project "+p.id,p);if(p.obj&&!oids.has(p.obj))E.push("project "+p.id+": objective "+p.obj+" not in the pack");["n","bac","paid"].forEach(k=>{if(p[k]==null)E.push("project "+p.id+": "+k+" is required")})});
 rows.budget_lines=(sp.budget_lines||[]).map(x=>Object.assign({},x));const bids=ids("budget_lines",rows.budget_lines);
 rows.budget_lines.forEach(b=>{if(!pids.has(b.p))E.push("budget line "+b.id+": project "+b.p+" not in the pack");pair("budget line "+b.id,b,"own","bk")});
 rows.invoices=(sp.invoices||[]).map(x=>Object.assign({},x));ids("invoices",rows.invoices);
 rows.invoices.forEach(v=>{if(!pids.has(v.p))E.push("invoice "+v.id+": project "+v.p+" not in the pack");if(v.line&&!bids.has(v.line))E.push("invoice "+v.id+": budget line "+v.line+" not in the pack");
  if(!v.vendor||v.amt==null)E.push("invoice "+v.id+": vendor and amt are required");pair("invoice "+v.id,v,"own","bk")});
 rows.demand=(sp.demand||[]).map(x=>Object.assign({},x));ids("demand",rows.demand);rows.demand.forEach(d=>{if(d.obj&&!oids.has(d.obj))E.push("demand "+d.id+": objective "+d.obj+" not in the pack");pair("demand "+d.id,d,"sp","bk")});
 rows.metrics=(sp.metrics||[]).map(m=>{const r=Object.assign({},m);pair("metric "+m.id,r);["n","u","cur","tgt","base","dir","f","rem"].forEach(k=>{if(r[k]==null)E.push("metric "+m.id+": "+k+" is required (R25)")});
  if(r.dir!=="min"&&r.dir!=="max")E.push("metric "+m.id+": dir is min or max");if(!r.label)r.label=sp.label||"simulated";if(!LABELS.has(r.label))E.push("metric "+m.id+": label must be one of fact, hypothesis, modeled, simulated");return r});
 const mids=ids("metrics",rows.metrics);krs.forEach(k=>{if(k.metric&&!mids.has(k.metric))E.push("key result "+k.id+": metric "+k.metric+" not in the pack")});
 rows.processes=[];rows.maturity=[];(sp.processes||[]).forEach(p=>{const r=Object.assign({},p);delete r.maturity;pair("process "+p.id,r);rows.processes.push(r);const mt=p.maturity||{},dims=mt.dims||{};
  const bad=DIMS.filter(d=>!Number.isInteger(dims[d])||dims[d]<1||dims[d]>5);if(bad.length)E.push("process "+p.id+": maturity needs all six dimensions 1 to 5 ("+bad.join(", ")+")");
  if(!Number.isInteger(mt.target)||mt.target<1||mt.target>5)E.push("process "+p.id+": maturity target 1 to 5 is required (R26)");
  if(!bad.length){const d={};DIMS.forEach(k=>d[k]=dims[k]);rows.maturity.push({id:"mat-"+p.id,process:p.id,model:mt.model||"cmmi",dims:d,level:Math.min(...DIMS.map(k=>dims[k])),target:mt.target,assessed:mt.assessed||"2026-09-30",label:mt.label||"simulated",owner:p.owner,backup:p.backup})}
  (p.metrics||[]).forEach(m=>{if(!mids.has(m))E.push("process "+p.id+": metric "+m+" not in the pack")})});ids("processes",rows.processes);
 rows.vocabulary=[];Object.keys(sp.vocabulary||{}).forEach(k=>{const v=sp.vocabulary[k];if(!Array.isArray(v)||v.length!==2){E.push("vocabulary "+k+": give [singular, plural]");return}rows.vocabulary.push({id:k,one:v[0],many:v[1]})});
 rows.workload=[];((sp.coo||{}).workload||[]).forEach(w=>{const [n,role,unit,load,cap,rep,mtg,apr,ops,prj]=w;if(!humans.has(n))E.push("workload: "+n+" is not a person in this pack");
  const aug=rep*AUG.rep+mtg*AUG.mtg+apr*AUG.apr+ops*AUG.ops;rows.workload.push({id:"wl-"+sl(n),n,role,unit,pct:load,cap,hrs:Math.round(load*cap/100),rep,mtg,apr,ops,prj,tot:Math.round((rep+mtg+apr+ops+prj)*10)/10,aug:Math.round(aug*10)/10,label:"modeled"})});
 const vc=(sp.coo||{}).value_chain||{};rows.value_chain=(vc.steps||[]).map((s,i)=>Object.assign({},s,{id:tid+"-vc"+(i+1),flow:vc.n||"",label:s.label||"modeled"}));
 /* honesty and naming over everything the pack shows */
 const txt=JSON.stringify({rows,info,org});BANNED.forEach((re,i)=>{if(re.test(txt))E.push("banned text in the pack: "+BANNED_N[i])});
 REAL.forEach(re=>{if(re.test(txt))E.push("a real name is in the pack (R32)")});
 (otherOrgs||[]).forEach(o=>{if(o&&o!==info.org&&txt.indexOf(o)>=0)E.push("the pack mentions another tenant: "+o)});
 const taken=takenNames();[...names].sort().forEach(n=>{if(n.split(/\s+/).length>=2&&(taken.has(n)||(humans.has(n)&&inPage(n))))E.push("name collision: "+n+" is already a name in the page")});
 ["projects","budget_lines","invoices","metrics","objectives","key_results","processes","vocabulary","workload","value_chain","demand","pillars"].forEach(e=>{if(!(rows[e]||[]).length)Wn.push("gap: "+e+" (the screens show an empty state, never another tenant's rows)")});
 const pack={id:tid,spec:"generated in the browser (PACKGEN, DC-43)",generated:true,info:Object.assign({},info,{lead}),org:{lead,fns},images:sp.images||{},reuse:sp.reuse||[],label:sp.label||"simulated",sample:sp.sample,rows};
 return{pack,errors:E,warnings:Wn}}

/* ---------- reuse: journeys, workflows and personas of the closest sample, relabeled for this company ---------- */
function relabel(x,map,memo){if(typeof x==="string"){let s=x;map.forEach(([a,b])=>{if(s.indexOf(a)>=0)s=s.split(a).join(b)});return s}
 if(!x||typeof x!=="object")return x;if(memo.has(x))return memo.get(x);const out=Array.isArray(x)?[]:{};memo.set(x,out);
 Object.keys(x).forEach(k=>{const v=x[k];out[k]=typeof v==="function"?v:relabel(v,map,memo)});return out}
function reuseFrom(sample,pack){const P=G(()=>SCN.pack[sample],null)||{wfs:[],jys:[],pers:[]};const si=G(()=>DATA.tenantInfo(sample),{})||{};const info=pack.info;
 const map=[];[[si.org,info.org],[si.short,info.short],[String(si.org||"").split(" ")[0],info.short]].forEach(([a,b])=>{if(a&&a.length>3&&!map.some(m=>m[0]===a))map.push([a,b])});
 /* people of the sample named in its journeys become this company's people */
 const theirs=G(()=>DATA.get("people",{tenant:sample}).filter(r=>r.kind==="human").map(r=>r.name),[]);const mine=pack.rows.people.filter(r=>r.kind==="human").map(r=>r.name);
 theirs.forEach((n,i)=>{if(n&&n.split(" ").length>=2)map.push([n,mine[i%mine.length]])});map.sort((a,b)=>b[0].length-a[0].length);
 const memo=new Map();const jys=P.jys.map(j=>Object.assign(relabel(j,map,memo),{id:j.id+"-"+pack.id}));
 return{wfs:P.wfs.slice(),jys,pers:P.pers.slice()}}

/* ---------- register: the path every pack takes (R20), plus the org, the journeys and a demo membership ---------- */
function register(pack,ans){const id=pack.id;
 /* a regenerated company that is already open: step out first, so the old journeys and workflows are unloaded before they are replaced */
 if(G(()=>DATA.tenant(),"core")===id||G(()=>SCN.cur,"")===id)G(()=>TENANT.switch("core"));const reuse=reuseFrom(pack.sample||"core",pack);
 const rows=Object.assign({},pack.rows,{journeys:reuse.jys,workflows:reuse.wfs,personas:reuse.pers.map(n=>({id:U.slug(n),name:n}))});pack.rows=rows;
 (W.TENANT_PACKS=W.TENANT_PACKS||{})[id]=pack;
 DATA.pack(id,rows,Object.assign({},pack.info,{n:pack.info.org,ind:pack.info.industry,d:pack.info.story}));DATA.addTenant(id,{gen:true});
 G(()=>{TENANT.info[id]=Object.assign({},TENANT.info[id]||{},pack.info);TENANT.orgs[id]={fns:pack.org.fns}});
 G(()=>{SCN.list[id]={n:pack.info.org,ind:pack.info.industry,d:pack.info.short+" (generated in your browser, simulated): "+pack.info.story,gen:true};SCN.pack[id]=reuse});
 /* simulated identity: the demo presenter becomes a member of the company they just built */
 G(()=>{const me=IDENT.me();if(!me.memberships.some(m=>m.tenant===id))me.memberships.push({tenant:id,roles:["Executive","Tenant admin"],gen:true})});
 G(()=>U.store.set(KEY,{answers:ans,at:Date.now(),id}));CUR={id,answers:ans};
 DATA.touch();return id}
let CUR=null;

function fromAnswers(ans,opts){opts=opts||{};ans=Object.assign({},ans||{});const sp=spec(ans,opts);
 const others=["core"].concat(G(()=>DATA.tenants().map(t=>t.id),[])).filter((x,i,a)=>a.indexOf(x)===i&&x!==sp.tenant).map(k=>G(()=>DATA.tenantInfo(k).org,null)).filter(Boolean);
 const r=build(sp,others);const out={ok:!r.errors.length,id:sp.tenant,pack:r.pack,errors:r.errors,warnings:r.warnings,industry:sp.answers.industry,fallback:!sp.answers.matched,notes:sp.notes,sample:sp.sample,spec:sp};
 if(!out.ok){G(()=>console.warn("PACKGEN refused the pack",r.errors));return out}
 register(r.pack,Object.assign({},ans,{name:sp.info.org}));
 const v=G(()=>DATA.validate(sp.tenant),{ok:false,errors:["validate failed"]});out.validate=v;if(!v.ok){out.ok=false;out.errors=out.errors.concat(v.errors)}
 G(()=>audit("Bring your company (simulated)","Generated "+IND[sp.answers.industry].label.toLowerCase()+" tenant: "+Object.keys(r.pack.rows).map(k=>r.pack.rows[k].length).reduce((a,b)=>a+b,0)+" records"));
 G(()=>W.EVENTS&&EVENTS.emit&&EVENTS.emit("exp.company",{tenant:sp.tenant,industry:sp.answers.industry,simulated:true}));
 if(opts.switch!==false)G(()=>TENANT.switch(sp.tenant));return out}

function forget(){const c=CUR;G(()=>U.store.del(KEY));CUR=null;if(!c)return false;const id=c.id;
 if(G(()=>DATA.tenant(),"")===id)G(()=>TENANT.switch("core"));
 G(()=>{const me=IDENT.me();me.memberships=me.memberships.filter(m=>m.tenant!==id)});G(()=>{delete SCN.list[id];delete SCN.pack[id]});
 G(()=>{const empty={};Object.keys((W.TENANT_PACKS[id]||{}).rows||{}).forEach(k=>empty[k]=[]);DATA.pack(id,empty);delete W.TENANT_PACKS[id]});
 G(()=>{delete TENANT.info[id];delete TENANT.orgs[id]});DATA.touch();return true}

/* a company built earlier in this session comes back after a reload (eight hours at most, this browser only) */
function restore(){const s=G(()=>U.store.get(KEY,null),null);if(!s||!s.answers)return null;if(!s.at||Date.now()-s.at>TTL){G(()=>U.store.del(KEY));return null}
 return fromAnswers(s.answers,{id:s.id||DEF_ID,switch:false})}

Object.assign(PG,{industries:()=>Object.keys(IND).map(k=>({id:k,label:IND[k].label,sample:IND[k].sample,sampleName:sampleName(IND[k].sample)})),
 sizes:()=>Object.keys(SIZES).map(k=>({id:k,label:SIZES[k].n})),pains:()=>Object.keys(PAINS).map(k=>({id:k,label:PAINS[k].n})),roles:()=>Object.keys(ROLES).map(k=>({id:k,label:ROLES[k]})),
 match,spec,build:sp=>build(sp,[]),fromAnswers,forget,restore,current:()=>CUR?{id:CUR.id,answers:Object.assign({},CUR.answers)}:null,TENANT_ID:DEF_ID,STORE_KEY:KEY});
setTimeout(()=>{try{restore()}catch(e){console.error("PACKGEN restore",e)}},0);
})();
