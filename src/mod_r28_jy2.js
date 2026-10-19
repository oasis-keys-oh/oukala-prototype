/* ===== mod_r28_jy2: industry journey maps, part 2 of 2: journeys. Prefix jyi.
   Adds six fully decomposed journeys to the Journey maps screen: journey, stages, boxes (touchpoint, experience, minutes, cost, volume, system, owner, pain, opportunity),
   the workflows behind each box (typed steps with a target type), and the agentic assessment the screen already computes. Fictional organizations only. All figures are sample values. ===== */
(function(){
const W=window,X=W.JYX,I=W.JYI;if(!X||!I)return;
["Patient","Referring clinician","Access center agent","Prior-auth specialist","Clinician","Case manager","Nurse","Billing specialist",
 "Operator","Control room","Reliability engineer","Maintenance planner","Technician","Warehouse","HSE advisor","Supervisor","Regulator",
 "Customer IT admin","Sales engineer","Account manager","Order desk","Supply chain","Field engineer","Support engineer"].forEach(p=>{if(X.PERSONAS.indexOf(p)<0)X.PERSONAS.push(p)});
const B=(id,who,t,tp,act,em,min,cost,vol,sys,owner,pain,opp,refs,rep,risk)=>X.bx(id,who,t,tp,act,em,min,cost,vol,sys,owner,pain,opp,(refs||[]).map(r=>X.px("WFX",r,I.WFN[r],1,I.WFO[r])),{rep:rep||3,risk:risk||2});
const S=(id,n,boxes)=>({id,n,boxes});
const J=(id,n,desc,persona,wf,cat,stages)=>{if(!X.JY.list.some(j=>j.id===id))X.JY.list.push({id,n,desc,persona,wf,cat,stages})};

/* ---------- Healthcare ---------- */
J("JH1","Healthcare: patient access, referral to first visit","Larkspur Health System (fictional). A referral becomes a completed first visit, and the referrer hears the outcome.","Patient","wf_h_ref","Healthcare",[
 S("s1","Referral received",[
  B("b1","Referring clinician","Send the referral","Fax and EHR inbox","Send the referral with clinical notes",2,12,9,4200,"EHR referral inbox","Referral management","About a third arrive by fax and are retyped","Accept structured e-referrals and read faxes into the record",["wf_h_ref"],4,3),
  B("b2","Access center agent","Register and validate the referral","EHR","Check demographics and completeness",3,14,11,4200,"EHR","Referral management","Missing notes are found after the patient is called","Check completeness on receipt and request missing items automatically",["wf_h_ref"],4,3)]),
 S("s2","Eligibility and authorization",[
  B("b3","Prior-auth specialist","Verify coverage and benefits","Payer portals","Check eligibility and benefits",2,18,14,4200,"Payer portals","Patient financial services","The same check is repeated by three teams","Verify once at referral and share the result",["wf_h_auth"],5,2),
  B("b4","Prior-auth specialist","Obtain prior authorization","Payer portal and phone","Submit clinicals and chase the decision",1,45,36,1500,"Payer portals","Patient financial services","Median wait of six days; status found by phone","Assemble the packet from the chart and track status automatically",["wf_h_auth"],4,4),
  B("b5","Patient","Understand cost and coverage","Phone and letter","Ask what they will owe",2,20,0,4200,"Estimate tool","Patient financial services","No estimate before the visit","Show a price estimate with the booking",[],3,2)]),
 S("s3","Scheduling",[
  B("b6","Patient","Find a time","Phone and portal","Call and wait on hold",2,18,4,4200,"Scheduling system","Access center","Hold times over eight minutes; the portal shows few slots","Offer the first suitable slot by message",["wf_h_sched"],4,2),
  B("b7","Access center agent","Book and confirm the appointment","Scheduling system","Match urgency to an open slot",3,12,9,4200,"Scheduling system","Access center","Clinic templates block good slots","Match referral urgency to open capacity",["wf_h_sched"],4,2)]),
 S("s4","Before the visit",[
  B("b8","Patient","Complete forms and read instructions","Patient portal and email","Fill in forms ahead of time",3,15,2,4000,"Patient portal","Ambulatory operations","Paper forms at the door","Prefill from the record and send reminders",["wf_h_prev"],5,1),
  B("b9","Nurse","Prevent a no-show","Phone","Call patients likely to miss",3,10,8,900,"EHR","Ambulatory operations","Calls go to everyone, not those likely to miss","Predict no-show risk and call those first",["wf_h_prev"],4,2)]),
 S("s5","Visit day",[
  B("b10","Patient","Check in and be roomed","Front desk","Show a card, confirm details",3,20,14,3600,"EHR","Ambulatory operations","Waits while the insurance card is scanned","Check in from the phone",["wf_h_prev"],4,1),
  B("b11","Clinician","Consult and document","EHR","See the patient and write the note",3,30,90,3600,"EHR","Clinical operations","Documentation takes as long as the visit","Draft an ambient note for the clinician to approve",[],3,4)]),
 S("s6","After the visit",[
  B("b12","Clinician","Close the loop with the referrer","EHR and letter","Send the outcome back",3,8,12,3600,"EHR","Referral management","Referrers are not told the outcome","Send a summary automatically",["wf_h_ref"],4,2)])]);

J("JH2","Healthcare: discharge to follow-up and claim","Larkspur Health System (fictional). An inpatient stay ends safely at home or in post-acute care, and the claim is paid.","Patient","wf_h_dc","Healthcare",[
 S("s1","Discharge planned",[
  B("b1","Case manager","Plan discharge and post-acute placement","EHR and phone","Find and confirm the next setting",2,55,60,1100,"EHR","Care coordination","Placement requests faxed to eight facilities","Send one request and rank the replies",["wf_h_dc"],3,3),
  B("b2","Clinician","Write the discharge summary","EHR","Summarize the stay",3,25,75,1100,"EHR","Clinical operations","Written after the patient has left","Draft from the chart for review",["wf_h_dc"],3,4)]),
 S("s2","Medicines and instructions",[
  B("b3","Nurse","Reconcile medications","EHR and pharmacy","Compare home and inpatient lists",2,30,38,1100,"EHR and pharmacy system","Pharmacy","Lists differ between systems","Compare lists and flag differences",["wf_h_rx"],4,4),
  B("b4","Patient","Understand instructions and get prescriptions","Paper and pharmacy","Read the instructions and collect medicines",2,40,0,1100,"Pharmacy system","Pharmacy","Leaves with a stack of paper","Plain-language instructions in their language and on the phone",["wf_h_rx"],3,3)]),
 S("s3","Transition",[
  B("b5","Patient","Transport and home setup","Phone","Arrange the ride and equipment",2,60,25,600,"Case record","Care coordination","Equipment arrives after the patient","Order equipment at discharge planning",["wf_h_dc"],3,3),
  B("b6","Nurse","Call at 48 hours","Phone","Check on the patient at home",3,12,10,1100,"EHR","Care coordination","Reached in one of two calls","Text first and call when there is no reply",["wf_h_fu"],4,2)]),
 S("s4","Claim and billing",[
  B("b7","Billing specialist","Code the stay and submit the claim","Revenue cycle system","Assign codes and send",3,28,24,1100,"Revenue cycle system","Revenue cycle","Coding waits for the summary","Suggest codes from the note",["wf_h_claim"],4,3),
  B("b8","Billing specialist","Work a denial","Payer portal","Appeal or correct the claim",1,50,42,260,"Revenue cycle system","Revenue cycle","Denials worked in date order, not by value","Rank by value and likelihood to overturn; draft the appeal",["wf_h_claim"],3,3),
  B("b9","Patient","Understand the bill and pay","Mail and portal","Read the statement and pay",2,25,6,1100,"Patient portal","Revenue cycle","Several bills for one stay","One statement in plain language with a payment plan",["wf_h_claim"],4,1)]),
 S("s5","Follow-up",[
  B("b10","Patient","See primary care within seven days","Phone","Book and attend the visit",2,20,5,1100,"Scheduling system","Care coordination","Booked by the patient after getting home","Book before discharge",["wf_h_fu"],4,2),
  B("b11","Case manager","Watch for readmission risk","Dashboards","Review the risk list",3,15,18,1100,"EHR","Care coordination","No early signal","Score the first 30 days and flag the highest risk",[],3,4)])]);

/* ---------- Mining (operational technology heavy) ---------- */
J("JM1","Mining: maintenance, alarm to asset back in service","Redstone Resources (fictional). A control-system alarm becomes a safe, planned repair and the asset returns to service. OT and IT meet here.","Operator","wf_m_wo","Mining",[
 S("s1","Detect",[
  B("b1","Operator","Notice an abnormal condition","Radio and control screen","Spot and report the signal",3,10,12,3800,"SCADA and historian (OT)","Operations","Alarm floods bury the real signals","Group alarms and rank by consequence",["wf_m_det"],4,4),
  B("b2","Control room","Acknowledge and call it in","Radio and phone","Log the event and notify",3,8,10,3800,"SCADA (OT)","Operations","Calls logged on paper, then retyped","Create the notification from the alarm",["wf_m_det"],4,3)]),
 S("s2","Assess",[
  B("b3","Reliability engineer","Judge condition and criticality","Historian and condition monitoring","Combine vibration, temperature and history",3,40,55,900,"Historian and CMMS","Reliability","Data lives in four tools","Pull it into one view and suggest the likely cause",["wf_m_det"],3,3),
  B("b4","Supervisor","Decide: run, derate or stop","Radio","Weigh risk against production",3,15,30,900,"Shift log","Operations","Decided on partial information","Show the production consequence next to the risk",[],2,5)]),
 S("s3","Plan",[
  B("b5","Maintenance planner","Build the work order and job plan","CMMS","Write the plan and estimate hours",2,70,65,900,"CMMS (EAM)","Maintenance planning","Plans are rewritten for repeat jobs","Start from the last similar job and its actual hours",["wf_m_wo"],4,2),
  B("b6","Warehouse","Reserve and stage parts","CMMS and store","Find and stage parts",2,35,28,900,"ERP inventory","Supply","Parts found missing at the job","Check stock and lead time at planning and suggest substitutes",["wf_m_wo"],4,2),
  B("b7","HSE advisor","Permit to work and isolation plan","Permit system","Write the isolation plan",2,50,55,900,"Permit system","HSE","Permits on paper; isolation steps retyped","Draft the isolation plan from the equipment record; people approve",["wf_m_ptw"],4,5)]),
 S("s4","Execute",[
  B("b8","Technician","Isolate, repair and test","Handheld","Do the work under permit",3,240,210,900,"Handheld and CMMS","Maintenance","Waits for lock-out; paperwork in the field","Offline-capable handheld with steps and drawings",["wf_m_wo","wf_m_ptw"],3,4),
  B("b9","Control room","Return to service","SCADA","Accept the handback",3,20,25,900,"SCADA (OT)","Operations","Handback by radio, not recorded","Digital handback tied to the permit",["wf_m_ptw"],4,4)]),
 S("s5","Verify and learn",[
  B("b10","Reliability engineer","Close out and record the failure cause","CMMS","Choose a failure code and write notes",2,25,35,900,"CMMS","Reliability","Failure codes picked from a long list, often wrong","Suggest the code from the job notes",["wf_m_wo"],4,2),
  B("b11","Reliability engineer","Update the maintenance strategy","Meetings","Review repeat failures",3,90,110,60,"CMMS and historian","Reliability","Quarterly review of a few assets","Rank repeat failures every week",[],2,2)])]);

J("JM2","Mining: safety event, report to corrective action","Redstone Resources (fictional). A near miss or incident is reported, investigated and closed with actions that are verified to work.","Operator","wf_m_hse","Mining",[
 S("s1","Report",[
  B("b1","Operator","Report a near miss or incident","Handheld or paper","Describe what happened",2,12,14,520,"HSE system","HSE","Filed at end of shift from memory; many near misses never filed","Voice-to-form on the handheld at the scene",["wf_m_hse"],4,2),
  B("b2","Supervisor","Make the area safe and notify","Radio","Secure the scene and call it in",3,25,40,520,"Radio and shift log","Operations","Notifications by phone tree","Notify the right people from the event type",["wf_m_hse"],4,5)]),
 S("s2","Classify and notify",[
  B("b3","HSE advisor","Classify severity and check the reporting duty","HSE system","Rate the event and check deadlines",3,30,38,520,"HSE system","HSE","Regulator deadlines tracked in a spreadsheet","Flag duties and a countdown automatically",["wf_m_hse"],4,5),
  B("b4","Regulator","Receive the notification","Regulator portal","Review the report",3,40,45,40,"Regulator portal","HSE","Retyped from the incident record","Pre-fill the notification for the advisor to submit",["wf_m_hse"],4,4)]),
 S("s3","Investigate",[
  B("b5","HSE advisor","Collect evidence and interview","Site and interviews","Gather facts and data",3,180,200,220,"HSE system and historian (OT)","HSE","Process data is pulled from the historian by hand","Attach the 30 minutes of process data around the event",["wf_m_inv"],3,3),
  B("b6","Supervisor","Contribute to cause analysis","Workshop","Explain what the crew saw",3,60,80,220,"HSE system","Operations","Causes named as human error too often","Prompt for systemic causes using similar past events",["wf_m_inv"],3,3)]),
 S("s4","Corrective action",[
  B("b7","Supervisor","Agree and assign actions","HSE system","Decide what to change and who owns it",2,30,40,220,"HSE system","Operations","Actions agreed in meetings and tracked in email","Actions land as work orders with owners and dates",["wf_m_ca"],4,3),
  B("b8","Maintenance planner","Plan engineering controls","CMMS","Schedule the change",3,45,60,90,"CMMS","Maintenance planning","Competes with production work","Rank by risk reduction",["wf_m_ca"],3,3),
  B("b9","HSE advisor","Verify the action worked","Site","Check the leading indicator",3,40,50,220,"HSE system","HSE","Closed on completion, not on effect","Check the indicator after 30 days",["wf_m_ca"],3,3)]),
 S("s5","Share the learning",[
  B("b10","Operator","Hear about it at the pre-shift talk","Pre-shift meeting","Listen and discuss",3,10,12,4000,"Pre-shift meeting","Operations","The same few events come up","Pick the five most relevant to this crew's work",[],3,2)])]);

/* ---------- Storage and backup vendor ---------- */
J("JS1","Storage and backup: customer evaluate to protected","Corvane Data Protection (fictional industry pattern, not a real vendor). A customer evaluates, buys, installs and is running protected backups.","Customer IT admin","wf_s_q2d","Storage and backup",[
 S("s1","Evaluate",[
  B("b1","Customer IT admin","Size the environment and shortlist","Web and calls","Estimate capacity and retention",3,120,0,380,"Sizing tool","Presales","Sizing is guesswork","Size from the customer's own backup catalog export",["wf_s_q2d"],3,2),
  B("b2","Sales engineer","Run a proof of concept","Remote and on site","Prove the design with sample data",3,360,520,90,"Lab and demo systems","Presales","Proof-of-concept hardware waits weeks","Virtual proof of concept with sample data",["wf_s_q2d"],3,3)]),
 S("s2","Quote and configure",[
  B("b3","Sales engineer","Configure a valid system","Configurator","Choose components that work together",2,90,110,380,"CPQ","Presales","Invalid configurations found at order; one in six reworked","Validate rules at design time and propose the nearest valid configuration",["wf_s_q2d"],4,3),
  B("b4","Account manager","Price, approve the discount and send the quote","CPQ and email","Set price and get approval",2,70,85,380,"CPQ and CRM","Sales operations","Discount approvals take days","Approve inside the policy band automatically",["wf_s_q2d"],4,2)]),
 S("s3","Order and ship",[
  B("b5","Order desk","Check credit, entitlement and create the order","ERP","Run checks and enter the order",2,45,38,320,"ERP","Order management","Orders rekeyed from the quote; four checks happen outside the system","Create the order from the accepted quote and run the checks as one step",["wf_s_o2d"],5,3),
  B("b6","Supply chain","Allocate stock or build to order","ERP and supplier portal","Reserve stock or place a build",2,90,80,320,"ERP and supplier portal","Supply chain","Component shortages learned late; promise dates slip","Promise a date from live supply and flag risk early",["wf_s_o2d"],3,3),
  B("b7","Supply chain","Ship and track","Carrier portals","Release and follow the shipment",3,40,45,320,"Warehouse system","Supply chain","Customers email for status","Send proactive tracking messages",["wf_s_o2d"],4,2)]),
 S("s4","Install and onboard",[
  B("b8","Field engineer","Install and configure","On site","Rack, cable and configure",3,300,480,210,"Field service","Services","Site readiness is not checked; second visits","Pre-install readiness checklist and remote pre-configuration",["wf_s_inst"],3,3),
  B("b9","Customer IT admin","Connect telemetry and verify the first backup","Management console","Run a first backup and restore",3,90,0,320,"Management console","Services","First restore test happens months later","Guided first-restore test in week one",["wf_s_inst"],4,3)]),
 S("s5","Operate and renew",[
  B("b10","Customer IT admin","Get answers and keep capacity right","Support portal","Search and plan capacity",3,40,0,2600,"Support portal","Support","Capacity alerts arrive too late","Forecast capacity from telemetry",[],4,2),
  B("b11","Account manager","Renew and expand","CRM","Quote and close the renewal",2,120,130,380,"CRM","Customer success","Renewal quotes built from spreadsheets 60 days out","Quote from the install base and usage 120 days out",["wf_s_ren"],4,2)])]);

J("JS2","Storage and backup: data recovery event, ticket to restored","Corvane Data Protection (fictional industry pattern). A customer cannot back up or restore; the case ends with data recovered and the cause prevented.","Customer IT admin","wf_s_rec","Storage and backup",[
 S("s1","Detect and report",[
  B("b1","Customer IT admin","Notice a failed backup or restore","Console and email","See the alert",1,25,0,1400,"Management console","Support","Alerts are ignored until a restore is needed","Prioritize alerts that threaten recovery objectives",["wf_s_rec"],3,4),
  B("b2","Customer IT admin","Open a case","Portal and phone","Describe the problem and attach logs",2,18,0,1400,"Support portal","Support","Logs attached by hand","Open the case from the device with the diagnostic bundle",["wf_s_rec"],4,4)]),
 S("s2","Triage",[
  B("b3","Support engineer","Verify entitlement and set severity","Case tool and install base","Check coverage and impact",3,12,15,1400,"Case tool and install base","Support","Contract status is wrong in one of ten cases","Read entitlement from the install base automatically",["wf_s_rec"],5,3),
  B("b4","Support engineer","Route to the right tier","Case tool","Assign the case",3,8,10,1400,"Case tool","Support","Mis-routing adds a day","Route from the error signature and history",["wf_s_rec"],5,2)]),
 S("s3","Diagnose",[
  B("b5","Support engineer","Analyze logs and telemetry","Log tools","Read logs and find the cause",2,75,95,1100,"Telemetry and log tools","Support","Manual log reading; known issues rediscovered","Match to known issues and suggest the fix",["wf_s_rec"],4,3),
  B("b6","Escalation engineer","Reproduce and engage engineering","Lab","Recreate and hand to engineering",2,240,380,120,"Lab and defect tracker","Engineering","The handoff loses context","Package the case with a reproduction summary",["wf_s_rec"],2,4)]),
 S("s4","Restore or replace",[
  B("b7","Support engineer","Guide the restore","Remote session","Walk the customer through recovery",3,120,150,500,"Remote session tools","Support","Customer under pressure; steps differ by version","Version-specific runbook checked live",["wf_s_rec"],3,5),
  B("b8","Field engineer","Replace a failed part","Logistics portal","Install the replacement",2,180,260,330,"ERP and logistics portal","Field service","Part shipped from the wrong depot; four-hour service level missed","Pick the nearest depot with stock",["wf_s_rma"],3,3),
  B("b9","Order desk","Create the RMA and track the return","ERP","Raise the return and match it",2,35,30,330,"ERP","Order management","Returns not matched to the shipment","Create the return with the shipment",["wf_s_rma"],4,2)]),
 S("s5","Review and prevent",[
  B("b10","Customer IT admin","Confirm recovery and review","Meeting","Check data and agree next steps",3,45,0,700,"Case tool","Support","No post-incident report","Send a plain summary and the prevention steps",["wf_s_rec"],3,2),
  B("b11","Account manager","Follow up on health and risk","CRM","Check in on the account",3,30,35,700,"CRM","Customer success","The account team learns of incidents late","Alert the account team on severity one and two",[],3,2)])]);
X.syncJy();
})();
