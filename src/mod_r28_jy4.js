/* ===== mod_r28_jy4: a hospital has about ten journeys and they interconnect. Seven more Larkspur Health System (fictional) journeys, so the healthcare demo carries ten,
   and a shared-touchpoint tag (`key`) on boxes that are the same thing seen from different journeys: the bed board, coverage and authorization, medication reconciliation and so on.
   The Overlay tab on Journey maps reads these tags. Fictional organization, modeled sample figures only. ===== */
(function(){
const W=window,X=W.JYX,I=W.JYI;if(!X||!I)return;
const add=(ps)=>ps.forEach(p=>{if(X.PERSONAS.indexOf(p)<0)X.PERSONAS.push(p)});
const B=(id,who,t,tp,act,em,min,cost,vol,sys,owner,pain,opp,refs,rep,risk,key)=>{const o=X.bx(id,who,t,tp,act,em,min,cost,vol,sys,owner,pain,opp,(refs||[]).map(r=>X.px("WFX",r,I.WFN[r],1,I.WFO[r])),{rep:rep||3,risk:risk||2});if(key)o.key=key;return o};
const S=(id,n,boxes)=>({id,n,boxes});
const J=(id,n,desc,persona,cat,stages)=>{if(!X.JY.list.some(j=>j.id===id))X.JY.list.push({id,n,desc,persona,wf:"",cat,stages})};

/* shared touchpoints: what the same box is called when several journeys depend on it */
X.TP=Object.assign(X.TP||{},{
 ELIG:{n:"Coverage, eligibility and prior authorization",kind:"Outside data",d:"Whether the plan pays, and whether it was approved in advance. Checked by hand in payer portals."},
 BED:{n:"Bed and capacity visibility",kind:"System of record",d:"Which beds are open, being cleaned, or about to empty. Today it is a board that is out of date and phone calls."},
 ID:{n:"Patient identity and registration",kind:"System of record",d:"Matching the person to one record and confirming coverage before care starts."},
 SCHED:{n:"Scheduling and room capacity",kind:"Handoff",d:"Finding a time that fits the patient, the clinician, the room and the equipment."},
 DC:{n:"Discharge readiness",kind:"Handoff",d:"Knowing early who can leave, what they need at home, and who has to act before they can."},
 MEDREC:{n:"Medication reconciliation",kind:"Decision",d:"Comparing what the patient takes with what is ordered, at every move between settings."},
 RES:{n:"Lab and imaging turnaround",kind:"Handoff",d:"Orders, collection, reading and the result reaching the person who decides."},
 DOC:{n:"Clinical documentation",kind:"System of record",d:"Notes, orders and the record that coding, billing and the next clinician all depend on."},
 CODE:{n:"Charge capture and coding",kind:"Decision",d:"Turning what was done into charges and codes that a payer will accept."},
 DEN:{n:"Denials and appeals",kind:"Outside data",d:"Claims a payer refuses, and the work to win them back."},
 PAY:{n:"Statements and patient payment",kind:"Handoff",d:"Making the bill understandable and the balance easy to pay."},
 FUP:{n:"Follow-up and readmission watch",kind:"Handoff",d:"Calls, visits and risk flags after the patient leaves."},
 STAFF:{n:"Nurse staffing and assignment",kind:"Decision",d:"Matching nurses to patients and filling gaps, shift by shift."},
 HAND:{n:"Shift handover",kind:"Handoff",d:"What one team tells the next. Details get lost when it is verbal."},
 SUP:{n:"Supplies and equipment",kind:"System of record",d:"Finding the right item at the bedside or in the room, in time."},
 XFER:{n:"Transport and transfers",kind:"Handoff",d:"Getting the patient or the specimen from one place to the next."}});
X.KPI=Object.assign(X.KPI||{},{JH0:"Episode satisfaction and cost",JH1:"Days from referral to first visit",JH2:"30-day readmissions and days to cash",JH3:"ED length of stay",JH4:"On-time first-case starts",JH5:"Discharge before noon",JH6:"Postpartum follow-up completion",JH7:"Avoidable ED visits",JH8:"Days in accounts receivable",JH9:"Nurse overtime hours",
 JM0:"Cost per tonne and cash cycle",JS0:"Net revenue retention",JY5:"Time from need to published standard"});

add(["Bed manager","Surgeon","OR scheduler","Coder","Nurse manager","Staffing coordinator","Transport"]);

J("JH3","Healthcare: emergency visit, arrival to admit or discharge","Larkspur Health System (fictional). One emergency visit from the door to a bed upstairs or a safe trip home. Figures are modeled sample values.","Patient","Hospital operations",[
 S("s1","Arrive and triage",[
  B("b1","Patient","Arrive and say what is wrong","Front door","Describe symptoms to whoever is nearest",2,25,0,6000,"ED tracking board","Emergency department","Long wait before anyone looks at them","A self check-in with a nurse-led fast track",[],3,3),
  B("b2","Nurse","Triage and set acuity","ED tracking board","Take vitals, ask questions, assign an acuity level",3,10,8,6000,"ED tracking board","Emergency department","Acuity differs between nurses","Decision support suggests acuity for the nurse to confirm",[],3,4),
  B("b3","Access center agent","Register and verify identity and insurance","EHR","Match the person to one record and check coverage",3,12,9,6000,"EHR","Patient access","Duplicate records when identity is unclear","Match identity before the patient reaches the desk",[],4,2,"ID")]),
 S("s2","Assess and test",[
  B("b4","Clinician","Examine and order tests","EHR","Examine, decide what to order",3,25,40,6000,"EHR","Emergency department","Orders are placed one by one and tests are repeated","Order sets for the common presentations",[],3,5,"DOC"),
  B("b5","Lab and imaging technician","Run labs and imaging","Lab and imaging systems","Collect, run and release results",2,30,22,9000,"Lab and imaging systems","Lab and imaging","Results take hours, so the clinician waits","Prioritize emergency orders and alert when ready",[],4,3,"RES"),
  B("b6","Patient","Wait for results","ED tracking board","Wait in a room with no news",1,120,0,5200,"ED tracking board","Emergency department","The longest unexplained wait of the visit","Show status and expected time, and update by text",[],3,2,"RES")]),
 S("s3","Decide",[
  B("b7","Clinician","Decide to admit, observe or discharge","EHR","Weigh results, risk and home support",3,15,25,6000,"EHR","Emergency department","The decision waits for one late result","Flag the one result that blocks the decision",[],3,5),
  B("b8","Case manager","Check coverage and authorize the admission","Payer portals","Check the plan and notify the payer",2,30,22,1500,"Payer portals","Case management","Authorization starts after the patient is already in a bed","Check coverage while the patient is still being assessed",[],4,3,"ELIG")]),
 S("s4","Find a bed",[
  B("b9","Bed manager","Find and assign an inpatient bed","Bed board and phone","Call units, check who is leaving, assign",1,35,26,1500,"Bed board","Patient flow","The bed board is stale, so beds are found by phone calls","Live bed and cleaning status with predicted discharges",[],3,3,"BED"),
  B("b10","Patient","Wait in the emergency department for a bed","ED hallway","Wait on a stretcher",1,240,0,1500,"ED tracking board","Emergency department","Admitted patients board for hours and the department backs up","Move ready patients to the unit as soon as the bed is clean",[],3,3,"BED"),
  B("b11","Transport","Move the patient to the unit","Transport system","Take the patient up",2,20,15,1500,"Transport system","Transport","Transport requests are phoned in","Dispatch automatically when the bed is assigned",[],4,2,"XFER"),
  B("b12","Nurse","Hand over to the unit nurse","EHR","Verbal report and chart",2,15,12,1500,"EHR","Emergency department","Details are lost in a verbal report","A structured handover that the receiving nurse can check",[],3,4,"HAND")]),
 S("s5","Go home safely",[
  B("b13","Nurse","Teach the patient and reconcile medicines","EHR","Explain, check medicines, print instructions",3,20,16,4500,"EHR","Emergency department","Instructions are generic and medicines are not checked","Medicines checked against the pharmacy fill history",[],4,3,"MEDREC"),
  B("b14","Patient","Understand the instructions and follow up","Patient portal","Read and try to book",2,30,0,4500,"Patient portal","Digital front door","No one books the follow-up, so many return to the emergency room","Book the follow-up before they leave",[],3,2,"FUP")])]);

J("JH4","Healthcare: planned surgery, decision to recovery","Larkspur Health System (fictional). A planned procedure from the decision to operate to the call after recovery. Figures are modeled sample values.","Patient","Hospital operations",[
 S("s1","Decide and book",[
  B("b1","Clinician","Recommend surgery and explain the options","EHR","Review options and risk with the patient",4,30,45,900,"EHR","Surgery","Decision aids are on paper","Share a decision aid and record the choice",[],3,5),
  B("b2","Prior-auth specialist","Obtain authorization for the procedure","Payer portals","Submit, chase and track",1,55,40,900,"Payer portals","Patient access","Authorizations lapse or arrive the day before","Start at the decision and track the expiry date",[],4,4,"ELIG"),
  B("b3","OR scheduler","Book the room, surgeon and equipment","OR scheduling system","Find a slot that fits everyone",2,40,30,900,"OR scheduling system","Surgery","Block time and equipment conflicts are found late","Suggest slots that fit surgeon, room and equipment",[],3,3,"SCHED")]),
 S("s2","Prepare",[
  B("b4","Nurse","Pre-operative screening and instructions","EHR","Screen, explain, tick the list",3,30,24,900,"EHR","Surgery","Questions repeat what the patient already answered","Pre-fill from the record and only ask what changed",[],4,3),
  B("b5","Access center agent","Verify identity and insurance before the day","EHR","Check the record and coverage",3,15,11,900,"EHR","Patient access","Insurance changes between booking and the day","Recheck coverage two days out",[],4,2,"ID"),
  B("b6","Patient","Fast, stop medicines and arrange the ride","Patient portal","Follow written instructions",2,60,0,900,"Patient portal","Surgery","Instructions conflict between documents","One instruction set that updates with the booking",[],3,3)]),
 S("s3","Day of surgery",[
  B("b7","Nurse manager","Staff the room and recovery","Staffing tool","Assign nurses and techs to the cases",2,25,20,900,"Staffing tool","Surgery","Staff are assigned the night before and then change","Re-plan when a case is added or moves",[],3,3,"STAFF"),
  B("b8","Nurse","Find instruments and supplies for the case","Supply system","Pick and check the case cart",2,20,14,900,"Supply system","Sterile processing","Missing items delay the first case","Check the cart against the booked procedure the day before",[],4,3,"SUP"),
  B("b9","Surgeon","Perform the procedure","OR system","Operate",3,150,0,900,"OR system","Surgery","First cases start late","Hold the first case for the full team only",[],3,5)]),
 S("s4","Recover",[
  B("b10","Nurse","Recover the patient and find a post-operative bed","Bed board","Hold in recovery until a bed is ready",2,45,34,900,"Bed board","Patient flow","Patients wait in recovery because the unit bed is not ready","Reserve the bed from the case schedule",[],3,3,"BED"),
  B("b11","Pharmacist","Manage pain medicines and reconcile","Pharmacy system","Review orders against the history",3,20,16,900,"Pharmacy system","Pharmacy","Pain orders and home medicines are checked separately","Check both together at the order",[],4,4,"MEDREC")]),
 S("s5","Go home and follow up",[
  B("b12","Case manager","Plan the discharge and home support","EHR","Arrange equipment, home care and transport",3,35,26,900,"EHR","Case management","Discharge needs are found on the day","Screen at the booking and arrange early",[],3,3,"DC"),
  B("b13","Nurse","Call after surgery","EHR","Check pain, wound and medicines",3,10,8,900,"EHR","Surgery","Calls are made by hand in the order of the list","Prioritize the calls by risk",[],5,2,"FUP"),
  B("b14","Billing specialist","Capture charges and code the case","Billing system","Collect charges and codes",3,40,30,900,"Billing system","Revenue cycle","Implants and supplies are missed","Pull charges from the case record",[],3,3,"CODE")])]);

J("JH5","Healthcare: inpatient stay, admission to discharge-ready","Larkspur Health System (fictional). A hospital stay from the admission to the day the patient is ready to leave. Figures are modeled sample values.","Patient","Hospital operations",[
 S("s1","Admit",[
  B("b1","Bed manager","Assign and prepare the bed","Bed board","Assign, confirm clean, notify the unit",2,25,19,1500,"Bed board","Patient flow","The bed is assigned but not ready","Show the clean status and assign only ready beds",[],3,3,"BED"),
  B("b2","Nurse","Admit, assess and reconcile medicines","EHR","Assess, enter history and medicines",3,40,32,1500,"EHR","Inpatient nursing","Medicines are entered from memory","Pull the fill history and confirm with the patient",[],4,4,"MEDREC"),
  B("b3","Access center agent","Confirm coverage and notify the payer","Payer portals","Check the plan, send the notice",2,20,15,1500,"Payer portals","Patient access","Notices are late and days are denied","Send the notice automatically at the admit order",[],5,2,"ELIG")]),
 S("s2","Daily care",[
  B("b4","Clinician","Round and update the plan","EHR","See the patient, update the plan and orders",3,30,45,6000,"EHR","Hospital medicine","Plans are updated late in the day","Surface what changed overnight before rounds",[],3,5,"DOC"),
  B("b5","Lab and imaging technician","Run the daily labs and imaging","Lab and imaging systems","Collect and run",2,30,22,6000,"Lab and imaging systems","Lab and imaging","Morning labs return after rounds","Time the collection so results are ready for rounds",[],4,3,"RES"),
  B("b6","Nurse manager","Match nurses to patients each shift","Staffing tool","Assign by hand from the census",2,30,24,3000,"Staffing tool","Inpatient nursing","Assignments come from yesterday's census","Suggest assignments from live acuity and census",[],3,3,"STAFF"),
  B("b7","Nurse","Hand over at the shift change","EHR","Verbal report and chart",2,20,16,12000,"EHR","Inpatient nursing","Handover is verbal and details are lost","A structured handover that the receiving nurse can check",[],3,4,"HAND"),
  B("b8","Nurse","Find supplies and equipment for the patient","Supply system","Search, ask, borrow",2,12,9,6000,"Supply system","Supply chain","Time is lost looking for the item","Stock the unit from the use history",[],3,2,"SUP")]),
 S("s3","Prepare to leave",[
  B("b9","Case manager","Find what is blocking discharge","EHR","Check home, rehab, equipment and coverage",2,25,19,1500,"EHR","Case management","Barriers are found on the day of discharge","Flag likely barriers at admission",[],3,3,"DC"),
  B("b10","Clinician","Write the discharge order and summary","EHR","Write the order and the summary",3,25,38,1500,"EHR","Hospital medicine","Orders are written late in the afternoon","Draft the summary from the stay for the clinician to sign",[],3,4,"DC"),
  B("b11","Pharmacist","Reconcile medicines before the patient leaves","Pharmacy system","Compare the list, resolve differences",3,25,20,1500,"Pharmacy system","Pharmacy","Differences are resolved after the patient has gone","Reconcile the day before",[],4,4,"MEDREC")]),
 S("s4","Leave",[
  B("b12","Transport","Arrange the ride or transfer","Case record","Book transport",2,30,22,1500,"Transport system","Transport","Rides are booked at the last minute","Book when the order is likely, and confirm when it is signed",[],4,2,"XFER"),
  B("b13","Bed manager","Clean and release the bed","Housekeeping system","Call housekeeping, confirm, release",2,20,14,1500,"Housekeeping system","Patient flow","Cleaning starts after someone remembers to call","Trigger cleaning when the discharge order is signed",[],5,1,"BED")])]);

J("JH6","Healthcare: maternity, first prenatal visit to postpartum","Larkspur Health System (fictional). A pregnancy from the first visit to the postpartum check. Figures are modeled sample values.","Patient","Hospital operations",[
 S("s1","Confirm and plan",[
  B("b1","Patient","Book the first prenatal visit","Scheduling system","Find a time",3,20,0,600,"Scheduling system","Women's health","Slots are weeks away","Offer the earliest slot across clinics",[],4,2,"SCHED"),
  B("b2","Access center agent","Verify coverage","Payer portals","Check the plan and benefits",3,20,15,600,"Payer portals","Patient access","Maternity benefits differ by plan","Show the patient what the plan pays up front",[],5,2,"ELIG"),
  B("b3","Clinician","Run the prenatal visits","EHR","Examine, test and plan",4,30,45,6000,"EHR","Women's health","Notes are retyped across visits","Carry the plan forward",[],3,5,"DOC")]),
 S("s2","Prepare",[
  B("b4","Patient","Pre-register for the delivery","Patient portal","Fill forms, choose preferences",3,25,0,480,"Patient portal","Women's health","Forms repeat what is in the record","Pre-fill from the record",[],4,2,"ID")]),
 S("s3","Labor and delivery",[
  B("b5","Nurse","Admit to labor and delivery","Bed board","Find a labor bed and settle the patient",2,30,24,480,"Bed board","Labor and delivery","Labor beds are full and the patient is told late","Show open beds and predict arrivals",[],3,4,"BED"),
  B("b6","Nurse manager","Staff labor and delivery","Staffing tool","Match nurses to the labor census",2,30,24,480,"Staffing tool","Labor and delivery","The census is unpredictable and cover is late","Forecast from due dates and inductions",[],3,3,"STAFF"),
  B("b7","Clinician","Deliver the baby","EHR","Deliver and document",4,240,0,480,"EHR","Labor and delivery","Documentation is done after","Capture the key events as they happen",[],3,5)]),
 S("s4","Postpartum stay",[
  B("b8","Nurse","Care for mother and baby on the unit","EHR","Check, feed, teach",3,45,36,1440,"EHR","Postpartum","Teaching repeats across nurses","Track what has been taught",[],3,4),
  B("b9","Pharmacist","Reconcile medicines","Pharmacy system","Review orders against history",3,20,16,480,"Pharmacy system","Pharmacy","Home medicines are missed","Reconcile at admission and again at discharge",[],4,4,"MEDREC"),
  B("b10","Case manager","Plan the discharge","EHR","Arrange follow-up and support",3,30,22,480,"EHR","Case management","Support needs are found late","Screen at admission",[],3,3,"DC")]),
 S("s5","Follow-up",[
  B("b11","Nurse","Make the postpartum check call","EHR","Ask about recovery and mood",3,12,10,480,"EHR","Postpartum","Calls are missed in the first week","Prioritize the calls by risk",[],5,2,"FUP"),
  B("b12","Patient","Book the postpartum visit","Scheduling system","Find a time",2,15,0,480,"Scheduling system","Women's health","Booking is left to the patient","Book before discharge",[],4,2,"SCHED"),
  B("b13","Billing specialist","Bundle and bill the delivery","Billing system","Collect charges and code",2,45,34,480,"Billing system","Revenue cycle","Bundled billing is rebuilt by hand","Build the bundle from the record",[],3,3,"CODE")])]);

J("JH7","Healthcare: chronic care, a year with diabetes","Larkspur Health System (fictional). A patient with diabetes over a year: enrollment, daily management, quarterly visits, the bad days and the annual review. Figures are modeled sample values.","Patient","Hospital operations",[
 S("s1","Diagnose and enroll",[
  B("b1","Clinician","Confirm the diagnosis and set targets","EHR","Confirm, explain, agree targets",4,30,45,1200,"EHR","Primary care","Targets are not shared with the team","Share the plan with the care team",[],3,4),
  B("b2","Case manager","Enroll in the care program","Payer portals","Check eligibility and enroll",3,25,19,1200,"Payer portals","Care management","Enrollment depends on a plan check by hand","Check the plan when the diagnosis is entered",[],4,2,"ELIG")]),
 S("s2","Every day",[
  B("b3","Patient","Monitor glucose and take medicines","Home devices","Check, record, adjust",2,20,0,12000,"Home devices","Care management","Readings are not seen until the next visit","Stream readings and alert on trends",[],3,3)]),
 S("s3","Every quarter",[
  B("b4","Access center agent","Book the quarterly visit","Scheduling system","Call, book, remind",3,15,11,3600,"Scheduling system","Primary care","Reminders are manual","Book the series at the first visit",[],5,1,"SCHED"),
  B("b5","Lab and imaging technician","Run the quarterly labs","Lab and imaging systems","Collect and run",3,25,18,3600,"Lab and imaging systems","Lab and imaging","Results arrive after the visit","Draw before the visit so results are there",[],4,3,"RES"),
  B("b6","Clinician","Review results and adjust the plan","EHR","Review and adjust",3,20,30,3600,"EHR","Primary care","Trends are hard to see across visits","Show the trend and the gaps in one view",[],3,4,"DOC"),
  B("b7","Pharmacist","Refill and prior-authorize medicines","Payer portals","Refill, resolve prior authorization",1,30,24,2400,"Payer portals","Pharmacy","Refills stall on prior authorization","Renew the authorization ahead of the expiry",[],4,3,"ELIG")]),
 S("s4","When it goes wrong",[
  B("b8","Nurse","Triage a high-glucose call","Nurse advice line","Assess and advise",3,15,12,900,"Nurse advice line","Care management","Calls arrive without the readings","Send readings with the call",[],3,4),
  B("b9","Case manager","Watch for readmission and avoidable ED visits","EHR","Review the risk list and call",3,15,11,1200,"EHR","Care management","The list is a week old","Update the list daily",[],3,4,"FUP")]),
 S("s5","Every year",[
  B("b10","Clinician","Annual review and care gaps","EHR","Review gaps, update the plan",3,30,45,1200,"EHR","Primary care","Gaps are found by hand","Flag the gaps ahead of the visit",[],3,3,"DOC"),
  B("b11","Billing specialist","Capture care-management charges","Billing system","Log time, charge",3,20,15,1200,"Billing system","Revenue cycle","Time is logged by hand","Log time from the record",[],4,2,"CODE")])]);

J("JH8","Healthcare: revenue cycle, charge to cash","Larkspur Health System (fictional). The money side of care, from the charge to the payment posted. Figures are modeled sample values.","Billing specialist","Hospital operations",[
 S("s1","Capture the charge",[
  B("b1","Clinician","Document so it can be coded","EHR","Complete the note",2,10,15,6000,"EHR","Clinical documentation","Notes lack what coders need","Prompt for the missing detail at the note",[],3,3,"DOC"),
  B("b2","Billing specialist","Capture charges","Billing system","Collect the charges",3,20,15,9000,"Billing system","Revenue cycle","Charges are missed","Pull the charges from the record",[],4,3,"CODE")]),
 S("s2","Code and bill",[
  B("b3","Coder","Assign codes","Coding system","Read the record and assign codes",3,15,12,9000,"Coding system","Coding","Queries to clinicians slow the case","Suggest codes for the coder to confirm",[],4,3,"CODE"),
  B("b4","Billing specialist","Submit the claim","Revenue cycle system","Check and submit",3,6,5,9000,"Revenue cycle system","Revenue cycle","Rejections are found after submission","Check the claim against the payer rules first",[],5,2)]),
 S("s3","Get paid",[
  B("b5","Billing specialist","Check coverage and authorization when a claim is denied","Payer portals","Find the cause of the denial",1,30,24,1800,"Payer portals","Revenue cycle","Most denials trace back to a missing or expired authorization","Catch the authorization gap before the claim",[],4,3,"ELIG"),
  B("b6","Billing specialist","Work the denial and appeal","Revenue cycle system","Gather evidence, write the appeal",1,50,40,900,"Revenue cycle system","Revenue cycle","Appeals are written from scratch","Draft the appeal from the denial reason and the record",[],3,3,"DEN")]),
 S("s4","Patient balance",[
  B("b7","Patient","Understand the statement","Patient portal","Read, call, ask",2,25,0,3600,"Patient portal","Revenue cycle","Statements are hard to read","Explain the statement in plain language",[],3,2,"PAY"),
  B("b8","Billing specialist","Collect the balance","Billing system","Remind, set up plans",2,15,11,2400,"Billing system","Revenue cycle","Collection is a series of calls","Offer a plan when the statement is sent",[],4,2,"PAY")]),
 S("s5","Close",[
  B("b9","Billing specialist","Post payment and reconcile","Revenue cycle system","Match payment to claim",3,10,8,9000,"Revenue cycle system","Revenue cycle","Unmatched payments pile up","Match automatically and queue the exceptions",[],5,1)])]);

J("JH9","Healthcare: nurse shift, staffing to handover","Larkspur Health System (fictional). One nursing shift, from the schedule behind it to the handover at the end. Figures are modeled sample values.","Nurse","Hospital operations",[
 S("s1","Plan the staffing",[
  B("b1","Staffing coordinator","Forecast the census and build the schedule","Staffing tool","Build the schedule",2,90,70,400,"Staffing tool","Nursing operations","The schedule is built from last month's census","Forecast from admissions, surgeries and emergency volume",[],3,3,"STAFF"),
  B("b2","Nurse manager","Fill the open shifts","Staffing tool","Call, text, book agency",1,40,32,1500,"Staffing tool","Nursing operations","Gaps are filled by calls and texts and agency cost spikes","Offer shifts to the internal pool first, automatically",[],3,3,"STAFF")]),
 S("s2","Start the shift",[
  B("b3","Nurse manager","Check the census and assign patients","Bed board","Check census and acuity, assign",2,20,16,6000,"Bed board","Nursing operations","The census is wrong until the morning huddle","Live census and acuity",[],3,3,"BED"),
  B("b4","Nurse","Receive the handover","EHR","Listen, note, ask",2,20,16,6000,"EHR","Inpatient nursing","Handover is verbal and details are lost","A structured handover that the receiving nurse can check",[],3,4,"HAND")]),
 S("s3","During the shift",[
  B("b5","Nurse","Give care and medicines","EHR","Assess, treat, record",3,60,0,6000,"EHR","Inpatient nursing","Time is spent charting","Capture the record as the care happens",[],3,4),
  B("b6","Nurse","Find supplies and equipment","Supply system","Search, ask, borrow",2,12,9,18000,"Supply system","Supply chain","Time is lost looking for the item","Stock the unit from the use history",[],3,2,"SUP")]),
 S("s5","End of the shift",[
  B("b7","Nurse","Chart, reconcile and hand over","EHR","Finish notes, give report",2,25,20,6000,"EHR","Inpatient nursing","Handover and charting run past the end of the shift","A structured handover assembled from the shift",[],3,4,"HAND"),
  B("b8","Nurse manager","Record overtime and exceptions","Timekeeping system","Approve and record",2,15,12,3000,"Timekeeping system","Nursing operations","Overtime is approved after the fact","Approve it as it happens",[],4,1,"STAFF")])]);

/* tag the shared touchpoints in the journeys that already exist */
const TAGS={JH0:{b7:"ELIG",b8:"SCHED",b10:"ID",b12:"DOC",b13:"RES",b14:"RES",b17:"BED",b18:"DC",b19:"MEDREC",b20:"DC",b21:"FUP",b22:"FUP",b24:"CODE",b26:"PAY",b27:"DEN"},
 JH1:{b3:"ELIG",b4:"ELIG",b6:"SCHED",b7:"SCHED",b10:"ID",b11:"DOC"},
 JH2:{b1:"DC",b2:"DC",b3:"MEDREC",b4:"MEDREC",b5:"XFER",b6:"FUP",b7:"CODE",b8:"DEN",b9:"PAY",b10:"FUP",b11:"FUP"}};

/* JM-05, DC-24: shared touchpoints for the Meridian, mining and storage samples too, so their overlays, Process map "shared" counts and
   touchpoint images are not thin. Each key sits in at least two journeys of its own scenario. Fictional samples; names are generic. */
Object.assign(X.TP,{
 /* Meridian Standards Foundation (core) */
 PORTAL:{n:"Self-service portal and request intake",kind:"System of record",d:"Where a person asks for something: one form, one record, one status to follow."},
 APPR:{n:"Manager and budget approvals",kind:"Decision",d:"A manager, budget owner or steering group says yes or no. Waits pile up here."},
 ASSET:{n:"Laptop and equipment hand-over",kind:"Handoff",d:"The device is staged, handed over and recorded against the person."},
 VEND:{n:"Vendor and supplier hand-off",kind:"Outside data",d:"Work that leaves the organization: ordering, provider investigation, contracts."},
 KNOW:{n:"Answers and known fixes",kind:"System of record",d:"Questions answered once and reused: day-one questions, known errors, errata."},
 PLAN:{n:"Planning and staffing the work",kind:"Decision",d:"Turning an approved idea into a plan with named people and dates."},
 /* Redstone Resources (mining, fictional) */
 ALARM:{n:"Plant alarms and condition",kind:"Outside data",d:"An alarm or an abnormal reading from the control system, and who judges it."},
 WO:{n:"Work orders and job plans",kind:"System of record",d:"The maintenance work order: parts, labor, permits and the plan to do the job."},
 PTW:{n:"Permit to work and area clearance",kind:"Decision",d:"Isolation, permits and confirming an area is safe before work or a blast."},
 HSE:{n:"Safety events and corrective actions",kind:"Handoff",d:"A report, its classification and the actions that must close before it recurs."},
 REGR:{n:"Regulator reporting",kind:"Outside data",d:"What the site must tell the regulator, and by when."},
 SHIFT:{n:"Shift briefing",kind:"Handoff",d:"What the crew hears at the start of the shift: the plan, the hazards, the lessons."},
 /* Corvane Data Protection (storage and backup, fictional) */
 POC:{n:"Sizing and proof of concept",kind:"Decision",d:"Showing the system fits the customer's data before anything is quoted."},
 QUOTE:{n:"Configure, price and quote",kind:"System of record",d:"A valid configuration, an approved discount and one quote the customer can sign."},
 ORDER:{n:"Orders, entitlement and returns",kind:"System of record",d:"Booking the order, checking what the customer is entitled to, and tracking parts that come back."},
 SHIP:{n:"Build and ship",kind:"Handoff",d:"Allocating stock, building to order and tracking the delivery."},
 INST:{n:"Install and first protected backup",kind:"Handoff",d:"From boxes on site to the first backup the customer trusts."},
 CASE:{n:"Support cases and restores",kind:"Handoff",d:"A failed job or a data event, the case it opens and the restore that ends it."},
 PART:{n:"Hardware fault and part replacement",kind:"Handoff",d:"Diagnosing a failed part and getting the replacement in and the old one back."},
 RENEW:{n:"Renewal and account health",kind:"Decision",d:"Whether the customer stays, grows or leaves, and what the account team sees first."}});
Object.assign(TAGS,{
 JY1:{b3:"PORTAL",b4:"APPR",b5:"ASSET",b8:"KNOW"},
 JY2:{b1:"PORTAL",b2:"PORTAL",b3:"APPR",b4:"APPR",b5:"VEND",b6:"VEND",b7:"ASSET"},
 JY3:{b1:"PORTAL",b3:"KNOW",b4:"VEND",b6:"APPR"},
 JY4:{b1:"PORTAL",b3:"APPR",b4:"PLAN",b5:"PLAN",b6:"VEND"},
 JY5:{b3:"APPR",b4:"PLAN",b10:"APPR",b15:"KNOW",b16:"KNOW"},
 JM0:{b2:"SHIFT",b5:"PTW",b10:"ALARM",b11:"WO",b12:"HSE",b20:"REGR"},
 JM1:{b1:"ALARM",b2:"ALARM",b3:"ALARM",b5:"WO",b7:"PTW"},
 JM2:{b1:"HSE",b3:"HSE",b4:"REGR",b7:"HSE",b8:"WO",b9:"HSE",b10:"SHIFT"},
 JS0:{b4:"POC",b5:"QUOTE",b7:"ORDER",b8:"SHIP",b9:"INST",b11:"INST",b13:"CASE",b15:"CASE",b16:"CASE",b17:"PART",b18:"PART",b19:"RENEW"},
 JS1:{b1:"POC",b2:"POC",b3:"QUOTE",b4:"QUOTE",b5:"ORDER",b6:"SHIP",b7:"SHIP",b8:"INST",b9:"INST",b10:"CASE",b11:"RENEW"},
 JS2:{b2:"CASE",b3:"ORDER",b7:"CASE",b8:"PART",b9:"ORDER",b11:"RENEW"}});
Object.keys(TAGS).forEach(id=>{const j=X.JY.list.find(x=>x.id===id);if(!j)return;j.stages.forEach(s=>s.boxes.forEach(b=>{if(TAGS[id][b.id])b.key=TAGS[id][b.id]}))});

X.JY.list.sort((a,b)=>(b.cat==="End to end")-(a.cat==="End to end"));
X.syncJy();
})();
