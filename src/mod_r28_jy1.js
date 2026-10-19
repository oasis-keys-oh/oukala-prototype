/* ===== mod_r28_jy1: industry journey maps, part 1 of 2: workflows. Prefix jyi.
   Three fictional sample organizations, none based on a real company's data: Larkspur Health System (healthcare), Redstone Resources (mining, operational technology heavy),
   Corvane Data Protection (a storage and backup vendor; an industry pattern, not any real vendor). Each workflow step has a type today and a target type (tobe). ===== */
(function(){
const W=window;if(!W.WFX)return;
const TY={h:"human",a:"agent",u:"auto",g:"gate",w:"wait"};
const hrs=s=>{const m=String(s).match(/([\d.]+)\s*(min|h|day|days|week|weeks)/);if(!m)return 1;const v=+m[1],u=m[2];return +(u==="min"?v/60:u==="h"?v:u.indexOf("day")===0?v*8:v*40).toFixed(2)};
const WFN={},WFO={},WFI={};
function WF(id,name,industry,service,owner,lines){
 const L=lines.trim().split("\n");
 const steps=L.map((l,i)=>{const a=l.split("|"),t=TY[a[1]]||"human";return{id:"st"+(i+1),n:a[0],type:t,tobe:TY[a[6]||a[1]]||t,owner:a[2],team:a[2],sla:a[3],olaHrs:hrs(a[3]),cost:+a[4]||0,in:[],out:[],cond:"",next:i<L.length-1?["st"+(i+2)]:[],requesterVisible:i===0,system:a[5]||""}});
 W.WFX.reg({id,name,kind:"request",service,owner,steps,visibleToRequester:[steps[0].id],std:[],industry});
 WFN[id]=name;WFO[id]=owner;WFI[id]=industry}
W.JYI={WFN,WFO,WFI,TY};

/* ---------- healthcare: Larkspur Health System (fictional) ---------- */
WF("wf_h_ref","Referral intake and loop closure","Healthcare","Patient access","Referral management lead",`
Receive the referral (fax, portal or e-referral)|h|Referral coordinator|1 h|6|Fax server and EHR inbox|a
Read the fax into structured fields|h|Referral coordinator|2 h|8|EHR inbox|a
Check notes, imaging and demographics are complete|h|Access center agent|2 h|10|EHR|a
Request missing items from the referrer|h|Access center agent|1 day|8|Phone and fax|u
Triage urgency with a nurse|g|Triage nurse|4 h|22|EHR|g
Route to the receiving clinic|u|System|5 min|0|EHR|u
Close the loop: send the visit outcome to the referrer|h|Clinician|2 days|12|EHR and letter|a`);
WF("wf_h_auth","Eligibility and prior authorization","Healthcare","Patient access","Patient financial services director",`
Verify coverage and benefits|h|Prior-auth specialist|1 h|14|Payer portals|u
Decide whether authorization is required|h|Prior-auth specialist|30 min|6|Payer rules|u
Assemble the clinical packet|h|Prior-auth specialist|1 day|28|EHR|a
Submit to the payer|h|Prior-auth specialist|1 h|10|Payer portal|u
Wait for the payer's decision|w|Payer|6 days|0|Payer portal|w
Check status and chase|h|Prior-auth specialist|1 day|18|Payer portal and phone|a
Handle a denial: peer-to-peer or appeal|g|Medical director|3 days|140|EHR|g
Record the result and tell the patient|h|Access center agent|1 h|8|EHR|a`);
WF("wf_h_sched","Scheduling","Healthcare","Patient access","Access center manager",`
Receive the request to schedule|u|System|1 min|0|EHR|u
Call the patient|h|Access center agent|1 day|9|Phone|a
Offer suitable slots by urgency and location|h|Access center agent|10 min|7|Scheduling system|a
Book the appointment|h|Access center agent|5 min|4|Scheduling system|u
Send confirmation and reminders|u|System|1 min|0|Messaging|u
Handle cancellations and refill the slot|h|Access center agent|1 day|9|Scheduling system|a`);
WF("wf_h_prev","Pre-visit and check-in","Healthcare","Patient access","Ambulatory operations lead",`
Send forms and instructions|u|System|1 min|0|Patient portal|u
Collect forms (portal or paper)|h|Patient|2 days|5|Patient portal|u
Predict no-show risk|h|Nurse|1 h|8|EHR|a
Reach out to high-risk patients|h|Nurse|1 day|10|Phone|a
Verify insurance again at the door|h|Front desk|10 min|7|EHR|u
Check in and room the patient|h|Front desk|15 min|14|EHR|u`);
WF("wf_h_dc","Discharge planning and transition","Healthcare","Care coordination","Care coordination director",`
Identify discharge needs at admission|h|Case manager|1 day|30|EHR|a
Request post-acute placement|h|Case manager|1 day|40|Fax and portals|a
Choose a facility with the patient|g|Case manager|1 day|45|EHR|g
Draft the discharge summary|h|Clinician|4 h|75|EHR|a
Approve the discharge order|g|Attending physician|1 h|60|EHR|g
Arrange transport and equipment|h|Case manager|1 day|25|Phone|u
Hand over to the receiving team|h|Nurse|1 h|30|EHR|a`);
WF("wf_h_rx","Medication reconciliation and instructions","Healthcare","Pharmacy","Director of pharmacy",`
Collect the home medication list|h|Nurse|30 min|18|EHR|a
Compare with inpatient orders|h|Pharmacist|1 h|40|EHR and pharmacy system|a
Resolve differences with the prescriber|g|Pharmacist|2 h|55|EHR|g
Send prescriptions to the pharmacy|u|System|5 min|0|E-prescribing|u
Write patient instructions in plain language|h|Nurse|30 min|20|EHR|a
Teach back with the patient|h|Nurse|20 min|18|Bedside|h`);
WF("wf_h_fu","Follow-up and readmission watch","Healthcare","Care coordination","Care coordination director",`
Text the patient 24 hours after discharge|u|System|1 min|0|Messaging|u
Call at 48 hours if there is no reply|h|Nurse|1 day|10|Phone|a
Book the primary care visit within 7 days|h|Care coordinator|2 days|9|Scheduling system|a
Score readmission risk|h|Case manager|1 day|18|EHR|a
Escalate high-risk patients|g|Case manager|4 h|30|EHR|g`);
WF("wf_h_claim","Coding, claim and denials","Healthcare","Revenue cycle","Revenue cycle director",`
Wait for the discharge summary|w|Coder|1 day|0|EHR|w
Code the stay|h|Coder|45 min|30|Revenue cycle system|a
Check the claim against payer rules|h|Billing specialist|20 min|14|Revenue cycle system|u
Submit the claim|u|System|1 min|0|Clearinghouse|u
Receive payment or denial|w|Payer|14 days|0|Clearinghouse|w
Work the denial|h|Billing specialist|3 days|42|Payer portal|a
Approve write-offs above the limit|g|Revenue cycle director|2 days|90|Revenue cycle system|g
Send one patient statement|h|Billing specialist|1 day|6|Mail and portal|u`);

/* ---------- mining: Redstone Resources (fictional), operational technology heavy ---------- */
WF("wf_m_det","Alarm to assessed condition","Mining","Reliability","Reliability superintendent",`
Alarm raised by the control system|u|SCADA|1 min|0|SCADA and historian|u
Operator acknowledges and checks the area|h|Operator|10 min|12|Radio and control screen|h
Create the notification|h|Control room|10 min|10|Shift log and CMMS|u
Pull condition data from four tools|h|Reliability engineer|40 min|55|Historian and condition monitoring|a
Judge criticality|g|Reliability engineer|1 h|60|CMMS|g
Decide to run, derate or stop|g|Shift supervisor|15 min|30|Shift log|g`);
WF("wf_m_wo","Work order: plan, execute, close","Mining","Maintenance","Maintenance superintendent",`
Draft the job plan and estimate hours|h|Maintenance planner|70 min|65|CMMS|a
Check parts and lead time|h|Warehouse|35 min|28|ERP inventory|a
Schedule into a maintenance window|h|Maintenance planner|1 day|40|CMMS and schedule|a
Approve the work order|g|Maintenance superintendent|4 h|45|CMMS|g
Stage parts and tools|h|Warehouse|1 day|30|Store|u
Execute the repair under permit|h|Technician|4 h|210|Handheld|h
Close out with failure code and notes|h|Technician|30 min|35|CMMS|a
Review repeat failures|h|Reliability engineer|1 week|110|CMMS and historian|a`);
WF("wf_m_ptw","Permit to work and return to service","Mining","Safety and operations","HSE manager",`
Draft the isolation plan from the equipment record|h|HSE advisor|50 min|55|Permit system|a
Approve the permit|g|Area authority|2 h|50|Permit system|g
Apply locks and verify isolation|h|Technician|40 min|45|Site|h
Work under the permit|h|Technician|4 h|210|Site|h
Remove locks and hand back|h|Control room|20 min|25|SCADA|u
Confirm return to service|g|Operator|10 min|18|SCADA|g`);
WF("wf_m_hse","Safety event reporting and classification","Mining","Safety and operations","HSE manager",`
Report the event at the scene|h|Operator|12 min|14|Handheld or paper|a
Make safe and notify the supervisor|h|Shift supervisor|25 min|40|Radio|u
Create the incident record|h|Shift supervisor|20 min|18|HSE system|a
Classify severity|g|HSE advisor|30 min|38|HSE system|g
Check the reporting duty and deadline|h|HSE advisor|20 min|22|Spreadsheet|u
Notify the regulator|h|HSE advisor|2 h|45|Regulator portal|a
Notify leadership|u|System|5 min|0|Messaging|u`);
WF("wf_m_inv","Safety investigation","Mining","Safety and operations","HSE manager",`
Secure evidence and process data|h|HSE advisor|1 day|60|Historian and site|a
Interview witnesses|h|HSE advisor|2 days|120|Site|h
Build the timeline|h|HSE advisor|1 day|80|HSE system|a
Analyze causes with the crew|g|Investigation lead|1 day|140|Workshop|g
Review and approve the findings|g|Site manager|2 days|90|HSE system|g`);
WF("wf_m_ca","Corrective actions","Mining","Safety and operations","HSE manager",`
Agree actions and owners|g|Shift supervisor|1 day|40|HSE system|g
Create work orders and tasks|h|HSE advisor|1 day|25|CMMS|u
Plan engineering controls|h|Maintenance planner|3 days|60|CMMS|a
Track completion|h|HSE advisor|1 week|15|Spreadsheet|u
Verify effectiveness after 30 days|h|HSE advisor|1 day|50|Site|a
Share the learning at pre-shift talks|h|Shift supervisor|1 day|12|Pre-shift meeting|a`);

/* ---------- storage and backup vendor: Corvane Data Protection (fictional industry pattern) ---------- */
WF("wf_s_q2d","Evaluate to quote","Storage and backup","Sales and presales","VP of sales operations",`
Capture requirements and size the environment|h|Sales engineer|2 h|110|Sizing tool|a
Run a proof of concept|h|Sales engineer|2 weeks|520|Lab|a
Configure a valid system|h|Sales engineer|90 min|110|CPQ|a
Check configuration rules|h|Sales engineer|1 day|60|CPQ|u
Price and apply the discount|h|Account manager|1 h|45|CPQ|a
Approve the discount|g|Sales director|2 days|60|CPQ|g
Send the quote|u|System|1 min|0|CPQ and email|u`);
WF("wf_s_o2d","Order to delivery","Storage and backup","Order management","Director of order management",`
Accept the order and rekey it into the ERP|h|Order desk|30 min|30|ERP|u
Credit and export check|h|Order desk|1 day|35|ERP and screening tool|a
Check entitlement and contract terms|h|Order desk|2 h|20|Contract repository|a
Confirm the promise date|h|Supply planner|1 day|40|ERP|a
Allocate stock or place a build order|h|Supply planner|1 day|80|ERP and supplier portal|a
Pick, pack and ship|h|Warehouse|1 day|45|Warehouse system|u
Send tracking and the invoice|u|System|1 min|0|ERP|u`);
WF("wf_s_inst","Install and onboard","Storage and backup","Services","Director of professional services",`
Check site readiness|h|Field engineer|1 day|60|Checklist|a
Pre-configure remotely|h|Field engineer|2 h|60|Management console|a
Install and cable|h|Field engineer|4 h|480|Customer site|h
Connect telemetry|h|Field engineer|1 h|30|Management console|u
Run the first backup and restore test|h|Customer IT admin|1 day|0|Management console|a
Hand over and train|h|Field engineer|2 h|120|Customer site|h`);
WF("wf_s_ren","Renewal","Storage and backup","Customer success","VP of customer success",`
Identify upcoming renewals|h|Account manager|2 h|30|CRM|u
Check usage and health|h|Customer success manager|2 h|40|Telemetry|a
Build the renewal quote|h|Account manager|1 day|130|Spreadsheet and CPQ|a
Approve non-standard terms|g|Sales director|1 day|60|CPQ|g
Send the quote and chase|h|Account manager|2 weeks|50|CRM|a
Book the renewal|u|System|1 min|0|ERP|u`);
WF("wf_s_rec","Recovery case: ticket to restored","Storage and backup","Support","VP of global support",`
Alert or customer report received|u|System|1 min|0|Console and support portal|u
Open the case with the diagnostic bundle|h|Customer IT admin|18 min|0|Support portal|u
Verify entitlement|h|Support engineer|10 min|12|Case tool|u
Set severity and route|h|Support engineer|10 min|12|Case tool|a
Analyze logs and telemetry|h|Support engineer|75 min|95|Log tools|a
Escalate to engineering with context|g|Escalation engineer|4 h|380|Defect tracker|g
Guide the restore|h|Support engineer|2 h|150|Remote session|a
Confirm recovery with the customer|h|Support engineer|30 min|25|Case tool|h
Send the incident summary|h|Support engineer|1 day|20|Email|a`);
WF("wf_s_rma","Part replacement (RMA)","Storage and backup","Field service","Director of field service",`
Decide that a part has failed|h|Support engineer|30 min|40|Diagnostics|a
Create the RMA|h|Order desk|35 min|30|ERP|u
Pick the nearest depot with stock|h|Logistics coordinator|1 h|25|ERP and logistics portal|a
Ship the replacement|h|Warehouse|4 h|60|Carrier|u
Install and verify|h|Field engineer|3 h|260|Customer site|h
Receive the failed part|w|Warehouse|10 days|0|Logistics portal|w
Match the return and close|h|Order desk|1 day|18|ERP|u`);
})();
