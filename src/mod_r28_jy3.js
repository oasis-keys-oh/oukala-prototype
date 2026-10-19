/* ===== mod_r28_jy3: end-to-end journeys. The whole relationship, not a single request: from the first sign of the need to the last payment and the end of the relationship.
   One per demo scenario (healthcare, mining, storage and backup) plus one for the Meridian core sample. Fictional organizations, modeled sample figures only.
   Each box carries minutes, cost and monthly volume, a pain point and an opportunity, and links to the detailed workflows from the other journey files where they exist. ===== */
(function(){
const W=window,X=W.JYX,I=W.JYI;if(!X||!I)return;
const add=(ps)=>ps.forEach(p=>{if(X.PERSONAS.indexOf(p)<0)X.PERSONAS.push(p)});
const B=(id,who,t,tp,act,em,min,cost,vol,sys,owner,pain,opp,refs,rep,risk)=>X.bx(id,who,t,tp,act,em,min,cost,vol,sys,owner,pain,opp,(refs||[]).map(r=>X.px("WFX",r,I.WFN[r],1,I.WFO[r])),{rep:rep||3,risk:risk||2});
const S=(id,n,boxes)=>({id,n,boxes});
const J=(id,n,desc,persona,cat,stages)=>{if(!X.JY.list.some(j=>j.id===id))X.JY.list.unshift({id,n,desc,persona,wf:"",cat,stages})};

/* ---------- Healthcare: Larkspur Health System (fictional) ---------- */
add(["Payer","Pharmacist","Lab and imaging technician"]);
J("JH0","Healthcare: from ailment to cured and paid","Larkspur Health System (fictional). The whole relationship: the first sign of an ailment, choosing where to go, access, intake, diagnosis, treatment, discharge, aftercare, every bill paid, and the episode closed. Figures are modeled sample values.","Patient","End to end",[
 S("s1","Something is wrong",[
  B("b1","Patient","Notice symptoms and judge how serious they are","Home, search and family","Search symptoms, ask family, wait to see if it passes",2,120,0,9000,"Web search","Digital front door","No trusted guidance, so many wait too long or go to the emergency room","A symptom checker and nurse line that point to the right level of care",[],3,3),
  B("b2","Nurse","Take the advice-line call","Phone","Advise on self-care, same-day care or the emergency room",3,14,11,2600,"Nurse advice line","Nurse advice line","Hold times, and the advice is not linked to the record","Link advice to the chart and book the next step in the same call",[],3,3)]),
 S("s2","Decide where to go",[
  B("b3","Patient","Compare facilities and clinicians","Search, payer directory and friends","Weigh distance, cost, wait time, quality and whether it is in network",2,90,0,8000,"Directory and review sites","Marketing and access","Prices, waits and outcomes are hard to compare","Publish waits, prices and outcomes in plain language",[],4,2),
  B("b4","Payer","Keep the provider directory accurate","Directory","Maintain network status and contact details",3,5,3,4000,"Provider directory","Payer contracting","Directory errors send patients out of network","Verify network status in real time at booking",[],3,3),
  B("b5","Referring clinician","Recommend a specialist and refer","EHR","Choose a site and send the referral",3,8,12,4200,"EHR","Referral management","Referrals go where the clinician knows, not where capacity exists","Suggest sites by urgency, coverage and open capacity",["wf_h_ref"],4,3)]),
 S("s3","Get access",[
  B("b6","Access center agent","Receive and validate the referral","EHR referral inbox","Check completeness and demographics",3,14,11,4200,"EHR","Referral management","About a third arrive by fax and are retyped","Accept structured referrals and read faxes into the record",["wf_h_ref"],4,3),
  B("b7","Prior-auth specialist","Verify coverage and obtain prior authorization","Payer portals and phone","Submit clinicals and chase the decision",1,45,36,1500,"Payer portals","Patient financial services","Median wait of six days; status found by phone","Assemble the packet from the chart and track status automatically",["wf_h_auth"],4,4),
  B("b8","Patient","Find a time and learn what it will cost","Phone and portal","Call, wait on hold and ask what they will owe",2,20,4,4200,"Scheduling system","Access center","Eight-minute holds and no price estimate","Offer the first suitable slot with a price estimate",["wf_h_sched"],4,2)]),
 S("s4","Arrival and intake",[
  B("b9","Patient","Prepare and travel to the visit","Portal, parking and wayfinding","Fill in forms and find the entrance",3,45,6,3600,"Patient portal","Ambulatory operations","Forms, directions and parking are not planned","Prefill forms and send directions and parking by message",["wf_h_prev"],5,1),
  B("b10","Access center agent","Register and verify identity and insurance at the door","Front desk","Scan the card and confirm consent",3,12,10,3600,"EHR","Ambulatory operations","The card is scanned again and consent is on paper","Check in from the phone, with coverage verified at booking",["wf_h_prev"],4,2),
  B("b11","Nurse","Triage and room the patient","Waiting room","Take vitals and set priority",3,15,14,3600,"EHR","Clinical operations","Patients wait with no updates","Send queue updates and room by acuity",[],4,3)]),
 S("s5","Diagnose",[
  B("b12","Clinician","Examine, order tests and explain the working diagnosis","Exam room","See the patient and write the note",3,30,90,3600,"EHR","Clinical operations","Documentation takes as long as the visit","Draft an ambient note for the clinician to approve",[],3,4),
  B("b13","Lab and imaging technician","Collect samples and perform imaging","Lab and radiology","Run the orders",3,25,40,5200,"Lab and imaging systems","Diagnostics","Results sit unread for a day","Route critical results to the right clinician at once",[],4,3),
  B("b14","Patient","Wait for results and understand them","Portal and phone","Read results and ask what they mean",2,60,3,3600,"Patient portal","Patient experience","Results appear in the portal before anyone explains them","Release results with a plain-language note",[],4,2)]),
 S("s6","Treat",[
  B("b15","Clinician","Agree the treatment plan with the patient","Exam room","Explain options and decide together",4,20,60,3000,"EHR","Clinical operations","Options are explained once and forgotten","Send a plan summary with decision support",[],3,4),
  B("b16","Pharmacist","Fill and counsel on medicines","Pharmacy","Check interactions and dispense",3,12,14,2800,"Pharmacy system","Pharmacy","Prior authorization surprises at the counter","Check coverage before the prescription is sent",["wf_h_rx"],4,3),
  B("b17","Case manager","Coordinate the care team, procedure or admission","Phone and EHR","Schedule the procedure and brief each team",3,25,30,1500,"EHR","Care coordination","Handoffs between teams lose detail","Share one care plan across teams",[],3,4)]),
 S("s7","Discharge",[
  B("b18","Case manager","Plan the discharge","Bedside and EHR","Arrange transport, equipment and home support",3,40,35,1200,"EHR","Care coordination","Discharge is planned on the day, so patients wait for a bed to free","Start planning at admission from the expected stay",["wf_h_dc"],4,3),
  B("b19","Nurse","Teach the patient and reconcile medicines","Bedside","Walk through instructions and check understanding",3,30,28,1200,"EHR","Clinical operations","Instructions are a dense printout","Teach back in the patient's language and send it to the phone",["wf_h_dc"],4,3),
  B("b20","Patient","Go home and make sense of the instructions","Home","Follow the plan alone",2,90,0,1200,"None","Care coordination","Questions arise at night with nobody to ask","Offer a number or message line staffed around the clock",[],3,3)]),
 S("s8","Aftercare",[
  B("b21","Case manager","Book follow-up and arrange home or rehab services","Phone and EHR","Schedule visits and services",3,20,20,1200,"EHR","Care coordination","Follow-up is booked weeks later than it should be","Book the follow-up before discharge",["wf_h_fu"],4,3),
  B("b22","Nurse","Call to check how recovery is going","Phone","Ask about symptoms and medicines",3,10,9,1100,"EHR","Care coordination","Calls reach people who are fine, not those at risk","Call in order of readmission risk",["wf_h_fu"],4,3),
  B("b23","Patient","Recover and report progress","Home and phone app","Record symptoms and attend follow-up",3,60,0,1100,"Patient app","Patient experience","Recovery data stays at home","Share monitoring data with the care team",[],3,3)]),
 S("s9","Bills and payment",[
  B("b24","Billing specialist","Capture charges, code and submit the claim","Billing system","Code the stay and send the claim",3,35,30,4000,"Billing system","Revenue cycle","Coding backlog delays claims","Suggest codes from the note for a coder to confirm",["wf_h_claim"],4,3),
  B("b25","Payer","Adjudicate the claim and pay or deny","Payer system","Match the claim to coverage and authorization",3,15,6,4000,"Payer system","Payer operations","Denials for missing authorization","Match the authorization to the claim before it is sent",[],4,3),
  B("b26","Patient","Understand the statement and pay the balance","Mail, portal and phone","Read the statement and pay or set up a plan",2,25,5,3600,"Patient portal","Patient financial services","The statement arrives before the insurer explanation","Send one statement after insurance and offer a payment plan online",["wf_h_claim"],4,2),
  B("b27","Billing specialist","Work denials, appeals and collections","Phone and portal","Appeal and follow up on unpaid balances",2,40,55,900,"Billing system","Revenue cycle","Appeals are worked by age, not by value","Rank by likelihood and value to recover",["wf_h_claim"],4,3)]),
 S("s10","Cured, and the relationship ends",[
  B("b28","Clinician","Confirm the outcome and close the episode","EHR","Record whether the patient recovered",3,10,15,3600,"EHR","Quality","Nobody records whether the patient got better","Record the outcome at 30 and 90 days",[],3,3),
  B("b29","Patient","Say how it went and decide whether to come back","Survey and phone","Give feedback and raise any complaint",3,8,2,3000,"Survey tool","Patient experience","Surveys arrive weeks later and are not acted on","Ask once and close complaints within a week",[],3,2),
  B("b30","Patient","Receive the final statement, records and prevention advice","Portal and mail","Confirm a zero balance and collect records",4,15,4,3000,"Patient portal","Patient experience","Records and the final balance take several requests","Send a closing summary with prevention advice and a zero-balance confirmation",[],4,2)])]);

/* ---------- Mining and operational technology: Redstone Resources (fictional) ---------- */
add(["Mine planner","Drill and blast engineer","Metallurgist","Logistics coordinator","Buyer","Finance analyst","Community liaison"]);
J("JM0","Mining: from mine plan to cash received and the site returned","Redstone Resources (fictional). The whole chain: planning the pit, drilling and blasting, hauling, processing, keeping people and machines safe, blending and shipping, being paid on the final assay, and handing the land back. Figures are modeled sample values.","Mine planner","End to end",[
 S("s1","Plan the mine",[
  B("b1","Mine planner","Turn the resource model into the short-term plan","Planning software and spreadsheets","Sequence blocks against equipment and crew",3,480,320,40,"Planning software and spreadsheets","Mine planning","The plan is rebuilt by hand when conditions change","Re-plan from live fleet and grade data each shift",[],3,4),
  B("b2","Supervisor","Brief the crew on the day's plan","Shift meeting","Share targets, hazards and constraints",3,20,24,900,"Whiteboard and radio","Operations","The briefing is verbal and the plan changes within hours","Push the current plan and changes to each crew's device",[],4,3)]),
 S("s2","Drill and blast",[
  B("b3","Drill and blast engineer","Design the blast pattern and approve the shot","Blast design tool","Set the pattern, charge and exclusion zone",3,120,140,60,"Blast design tool","Drill and blast","Designs rely on last month's rock data","Update patterns from drill-hole measurements",[],3,5),
  B("b4","Operator","Drill, charge and fire","Drill rigs and field","Drill to the pattern and clear the area",3,360,190,60,"Rig control system","Drill and blast","Hole depth and accuracy vary by crew","Guide holes by rig automation and record as-drilled data",[],4,5),
  B("b5","HSE advisor","Confirm the area is clear before the blast","Radio and site","Check exclusion zone and sign off",3,25,30,60,"Permit system","HSE","Clearances are confirmed by radio and written later","Record the clearance digitally at the point of check",["wf_m_ptw"],4,5)]),
 S("s3","Load and haul",[
  B("b6","Control room","Dispatch trucks and shovels","Fleet management system","Assign trucks to shovels and dumps",3,10,18,5200,"Fleet management system","Operations","Dispatch follows habit, not the live queue","Optimize assignment against the plan and the queue",[],4,3),
  B("b7","Operator","Load, haul and dump","Cab and radio","Run the cycle",3,38,22,52000,"Truck telemetry","Operations","Fuel and tyre events are noticed late","Flag events to the planner while the truck is still in cycle",[],4,3)]),
 S("s4","Crush and process",[
  B("b8","Control room","Run the crusher and plant to target throughput","Plant control system and historian","Hold feed rate, grind and reagents",3,480,260,30,"SCADA and historian","Processing","Operators tune by feel when ore changes","Recommend setpoints from the incoming grade",[],3,4),
  B("b9","Metallurgist","Track recovery and fix losses","Lab results and plant data","Compare recovery with plan",3,90,110,30,"Lab system","Processing","Recovery is known after the shift ends","Show recovery against plan during the shift",[],3,3)]),
 S("s4b","Keep people and machines safe",[
  B("b10","Control room","Spot and report an alarm on the plant","Alarm console","Rank alarms by consequence",2,10,12,3800,"SCADA and historian","Reliability","Alarm floods bury the real signals","Group alarms and rank by consequence",["wf_m_det"],3,5),
  B("b11","Maintenance planner","Plan, permit and carry out the repair","Work order system","Release the work and the parts",3,90,65,900,"Maintenance system","Reliability","Parts and permits are found after the job is released","Check parts and permit readiness before release",["wf_m_wo","wf_m_ptw","wf_m_inv"],4,4),
  B("b12","HSE advisor","Investigate an event and close the corrective action","Safety system","Record cause and corrective action",2,60,75,60,"Safety system","HSE","Corrective actions close late and without proof","Track each action to verified closure",["wf_m_hse","wf_m_ca"],3,5)]),
 S("s5","Blend and sample",[
  B("b13","Metallurgist","Sample the stockpile and release the assay","Lab","Prepare samples and run assays",3,180,95,300,"Lab system","Processing","Assays take a day and hold up shipping","Predict grade and release on the first assay",[],3,3),
  B("b14","Operator","Blend the stockpiles to the sales specification","Loader and blending plan","Mix stockpiles to meet the grade and penalty limits",3,120,80,60,"Stockpile model","Operations","Blends are made on the last assay, not the next","Plan blends with grade prediction",[],3,3)]),
 S("s6","Ship",[
  B("b15","Logistics coordinator","Book rail and port capacity and load the train","Rail and port systems","Match tonnes to the vessel window",3,90,100,40,"Rail and port systems","Logistics","Delays at the port are found when the train arrives","Show the full chain and the vessel window on one screen",[],3,4),
  B("b16","Logistics coordinator","Weigh, certify and release the shipment","Weighbridge and certificates","Issue weights and quality certificates",3,45,50,40,"Weighbridge system","Logistics","Certificates are typed from three systems","Issue certificates from the source records",[],4,3)]),
 S("s7","Sell and get paid",[
  B("b17","Buyer","Agree the provisional price and receive the cargo","Contract and portal","Confirm quantity, quality and price terms",3,60,70,40,"Contract system","Commercial","Terms are read from PDFs at invoice time","Hold the terms as structured data",[],3,3),
  B("b18","Metallurgist","Agree the final assay with the buyer","Lab and email","Resolve splits and disputes",2,120,140,10,"Lab system","Commercial","Disputes over assays take weeks","Share the evidence in one record",[],3,3),
  B("b19","Finance analyst","Issue the final invoice and collect cash","ERP and bank","Invoice on the final assay and apply cash",3,45,40,40,"ERP","Finance","Cash is applied by hand against several adjustments","Match receipts to the settlement automatically",[],4,3)]),
 S("s8","The community, the regulator and the land",[
  B("b20","Community liaison","Answer the community and report to the regulator","Meetings, email and portal","Log concerns and report monitoring data",3,60,55,80,"Reporting tools","Community and compliance","Reports are assembled from spreadsheets each quarter","Report from the same records the site uses",[],3,4),
  B("b21","Finance analyst","Set aside and release the closure provision","ERP","Update the closure cost and the provision",3,90,100,4,"ERP","Finance","The closure estimate is updated rarely","Update the closure estimate as disturbed area changes",[],3,4),
  B("b22","Community liaison","Rehabilitate the land and hand it back","Field and regulator","Rehabilitate, monitor and close out the site",4,480,300,2,"Field records","Community and compliance","Close-out evidence is gathered at the end, years later","Collect rehabilitation evidence as the work happens",[],3,4)])]);

/* ---------- Storage and backup: Corvane Data Protection (fictional vendor, an industry pattern) ---------- */
add(["Customer IT admin","Sales engineer","Account manager","Order desk","Supply chain","Field engineer","Support engineer"]);
J("JS0","Storage and backup: from data risk to relationship end","Corvane Data Protection (fictional; an industry pattern, not any real vendor). The whole relationship: a customer realizes they are at risk, evaluates, buys, is installed, adopts, runs, recovers, renews or expands, and eventually leaves. Figures are modeled sample values.","Customer IT admin","End to end",[
 S("s1","Realize the risk",[
  B("b1","Customer IT admin","Notice a gap: a scare, an audit finding or capacity running out","Internal review","Find that backups cannot be restored or are too slow",2,240,0,600,"Customer systems","Customer IT","The gap is found by accident","Offer a free restore-readiness check",[],3,4),
  B("b2","Customer IT admin","Build the case and get a budget","Email and meetings","Write the risk and cost for the executive",3,300,0,600,"Customer systems","Customer IT","The case takes months","Give a ready business-case template with sample savings",[],3,3)]),
 S("s2","Evaluate and choose",[
  B("b3","Customer IT admin","Compare vendors and read reviews","Web, analysts and peers","Build a shortlist",2,480,0,500,"Web and analyst reports","Customer IT","Claims are hard to compare","Provide comparable benchmarks and references",[],3,3),
  B("b4","Sales engineer","Run the demo and proof of concept","Demo and trial","Prove the restore on the customer's data",3,960,520,300,"Demo environment","Pre-sales","Proofs of concept take weeks to set up","Stand up a trial from a template in a day",[],3,3)]),
 S("s3","Quote and order",[
  B("b5","Account manager","Configure the quote and get approval","Quoting tool","Choose capacity, support and term",3,90,70,300,"Quoting tool","Sales operations","Quotes are assembled by hand and approved by email","Configure and price in one step",["wf_s_q2d"],4,3),
  B("b6","Customer IT admin","Negotiate and sign","Contract and email","Agree terms and sign",2,360,0,200,"Contract system","Customer procurement","Legal review of standard terms takes weeks","Offer pre-approved terms",["wf_s_q2d"],3,3),
  B("b7","Order desk","Book the order and confirm it is complete","Order system","Check the order and release it",3,35,28,200,"Order system","Sales operations","Missing details are found when the box is on the dock","Check completeness at booking",["wf_s_o2d"],4,3)]),
 S("s4","Deliver and install",[
  B("b8","Supply chain","Source, build and ship the system","Warehouse and carrier","Allocate stock and ship",3,180,160,200,"Supply chain system","Supply chain","Stock is allocated after the order","Reserve stock at quote",["wf_s_o2d"],3,4),
  B("b9","Field engineer","Install and cable","Customer site","Rack, power and connect",3,360,420,180,"Field service system","Field services","Site readiness is checked on arrival","Confirm site readiness before dispatch",["wf_s_inst"],3,4),
  B("b10","Customer IT admin","Accept the install and sign off","Portal","Check the install against the checklist",3,60,0,180,"Customer portal","Customer IT","Acceptance is a signed paper","Accept on a shared checklist",["wf_s_inst"],4,3)]),
 S("s5","Adopt",[
  B("b11","Customer IT admin","Set policies and run the first protected backup","Console","Choose what to protect and how often",3,240,0,180,"Console","Customer success","Defaults are generic","Recommend policies from the workloads discovered",[],3,3),
  B("b12","Account manager","Hold the onboarding review and agree success measures","Meeting","Agree recovery objectives and reporting",3,90,70,180,"CRM","Customer success","Success is not defined, so renewal is a guess","Define success measures at onboarding",[],3,2)]),
 S("s6","Run and protect",[
  B("b13","Support engineer","Watch health and fix failed jobs","Support console","Triage failed backups",3,25,18,6200,"Monitoring","Support","The same failures are fixed again and again","Resolve repeat failures at the cause",[],4,3),
  B("b14","Customer IT admin","Report protection status for an audit","Reports","Show backup success and restore tests",3,120,0,400,"Reports","Customer IT","Evidence is assembled by hand","Produce audit evidence from the system",[],3,3)]),
 S("s7","Recover when it matters",[
  B("b15","Customer IT admin","Declare the event and ask for help","Phone and portal","Open a priority case",1,15,0,70,"Support portal","Support","The case starts with questions the vendor already knows","Open the case with the environment and last good backup attached",["wf_s_rec"],5,5),
  B("b16","Support engineer","Guide the restore and confirm the data is back","Support console","Lead the restore and verify it",2,420,380,70,"Support console","Support","Verification is manual and slow","Verify restored data automatically and report it",["wf_s_rec"],4,5)]),
 S("s8","Fix and replace",[
  B("b17","Support engineer","Diagnose a hardware fault and authorize a replacement","Support console","Confirm failure and approve the part",3,30,25,310,"Support console","Support","Faults are confirmed after the customer sends logs","Detect and confirm from telemetry",["wf_s_rma"],4,3),
  B("b18","Field engineer","Replace the part and return the old one","Customer site and carrier","Install the part and close the return",3,150,210,310,"Field service system","Field services","Returns are chased for months","Track the return with the replacement",["wf_s_rma"],4,3)]),
 S("s9","Renew or expand",[
  B("b19","Account manager","Prepare the renewal and propose growth","CRM and quoting tool","Check usage, risk and capacity",3,120,95,300,"CRM","Account management","The renewal starts a month before it is due","Start from usage and risk signals 120 days out",["wf_s_ren"],4,3),
  B("b20","Customer IT admin","Decide to renew, expand, switch or reduce","Meetings","Compare value with cost",3,180,0,300,"Customer systems","Customer IT","Value is not summarized for the decision-maker","Send a one-page value summary before the renewal",["wf_s_ren"],3,4)]),
 S("s10","Leave, and the relationship ends",[
  B("b21","Customer IT admin","Plan the exit: move or return data","Support and project","Export data and decommission",2,480,0,40,"Customer systems","Customer IT","Exit steps are not documented","Provide an exit plan with certified data erasure",[],3,4),
  B("b22","Finance analyst","Issue the final invoice and close the account","ERP","Settle the account and release the licence",3,45,40,40,"ERP","Finance","Final billing and returns are reconciled by hand","Close the account from one checklist",[],4,3),
  B("b23","Account manager","Understand why and keep the door open","Call","Hold an exit interview",3,45,35,40,"CRM","Account management","Reasons are recorded loosely","Record structured reasons and a win-back date",[],3,2)])]);

/* ---------- Meridian Standards Foundation (the core fictional sample) ---------- */
add(["Committee member","Standards editor","Chief editor","Publishing manager","Member","Licensing and sales"]);
J("JY5","Meridian: a standard from the first need to renewal","Meridian Standards Foundation (fictional). The whole life of a standard and the member who depends on it: the need appears, the work is approved, drafted, put to public comment and a ballot, published, sold and licensed, used and supported, then renewed or retired. Figures are modeled sample values.","Member","End to end",[
 S("s1","A need appears",[
  B("b1","Member","Notice a gap and ask for a standard","Email and meetings","Describe the need to a committee or staff",3,90,0,60,"Email","Standards development","Requests arrive by email and some are lost","Take proposals in one place with a status the requester can see",[],3,2),
  B("b2","Committee member","Weigh the proposal against the agenda","Committee meeting","Debate whether it merits the effort",3,60,80,40,"Meeting notes","Standards development","The agenda is set by who speaks loudest","Score proposals against the strategy and capacity",[],3,3)]),
 S("s2","Approve the work",[
  B("b3","Chief editor","Approve the project and set the date","Planning meeting","Choose scope, editor and timeline",3,45,60,20,"Project plan","Editorial","Dates are set before editor capacity is known","Check editor load before a date is promised",[],3,3),
  B("b4","Project manager","Staff the work and baseline the plan","Project plan","Assign editors and reviewers",3,90,75,20,"Project tool","Portfolio and delivery","Staffing is decided by email","Match the work to available editors",[],3,3)]),
 S("s3","Draft and committee review",[
  B("b5","Standards editor","Draft and revise the text","Word processor and shared folder","Write and track the changes",3,2400,1500,20,"Word processor","Editorial","Versions multiply across email","Keep one draft with a change history",[],3,3),
  B("b6","Committee member","Review the draft and vote on changes","Meetings and email","Read and mark up",2,360,420,240,"Email","Standards development","Reviewers disagree about which version is current","Review in one place with the comments attached",[],3,3)]),
 S("s4","Public comment",[
  B("b7","Member","Read the draft and send a comment","Web form and email","Submit a comment",3,60,0,900,"Comment form","Standards development","Comments arrive in several channels","Take every comment in one register",[],4,2),
  B("b8","Standards editor","Triage and answer each comment","Spreadsheet","Group, answer and record the response",2,12,10,900,"Spreadsheet","Editorial","Responses take weeks and some are missed","Group similar comments and draft the response for the editor",[],4,3)]),
 S("s5","Ballot and approve",[
  B("b9","Committee member","Cast a ballot and resolve the negative votes","Ballot system","Vote and explain",3,30,35,300,"Ballot system","Standards development","Negative votes are resolved by phone","Resolve each negative vote in one thread",[],4,3),
  B("b10","Approver","Approve the final text for release","Approval record","Sign off the final version",3,30,45,20,"Approval record","Editorial","Sign-off is by email and hard to find later","Approve on the record with the evidence attached",[],4,3)]),
 S("s6","Edit and publish",[
  B("b11","Publishing manager","Typeset, check and release in every format","Publishing system","Produce print, web and data formats",3,480,350,20,"Publishing system","Publishing and licensing","Each format is checked by hand","Check numbering and cross-references automatically",[],3,3),
  B("b12","Licensing and sales","Announce the release to members","Email and web","Send release notes and update the catalog",3,60,45,20,"Email platform","Membership","Members hear about it late","Notify each member by the standards they use",[],3,2)]),
 S("s7","Sell and license",[
  B("b13","Member","Find the standard and buy a licence","Website","Search, choose and pay",3,25,0,4200,"Website","Membership","Search does not understand how people name the topic","Search by the problem, not the number",[],4,2),
  B("b14","Licensing and sales","Quote, license and invoice","Order system","Set terms and issue the invoice",3,40,35,900,"Order system","Publishing and licensing","Enterprise licences are quoted by hand","Quote from the licence terms automatically",[],4,3)]),
 S("s8","Use and support",[
  B("b15","Member","Apply the standard and ask a question","Email and portal","Ask how a clause applies",3,40,0,1400,"Portal","Editorial","Questions wait days for an editor","Answer from the standard, with the clause cited, and send the rest to an editor",[],4,3),
  B("b16","Standards editor","Answer questions and log errata","Email and tracker","Respond and record corrections",3,30,28,1400,"Tracker","Editorial","Errata are collected but released late","Release errata on a schedule with a notice",[],4,3)]),
 S("s9","Renew, revise or retire",[
  B("b17","Member","Decide to renew, upgrade or stop","Email and portal","Weigh the value of the licence",3,30,0,3000,"Portal","Membership","Value is not shown at renewal","Show what the member used before they decide",[],3,3),
  B("b18","Chief editor","Decide to revise, reaffirm or withdraw the standard","Review meeting","Review use, errata and demand",3,60,80,60,"Usage reports","Editorial","Reviews happen on a fixed cycle, not on demand","Trigger a review from usage, errata and requests",[],3,3),
  B("b19","Licensing and sales","Close out withdrawn standards and notify holders","Email","Inform members and update records",3,45,35,20,"Order system","Publishing and licensing","Holders find out when they try to use it","Notify every holder with a successor if there is one",[],3,3)])]);
X.JY.list.sort((a,b)=>(b.cat==="End to end")-(a.cat==="End to end"));
X.syncJy();
})();
