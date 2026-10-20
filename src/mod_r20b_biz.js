/* Round 20b: the business layer. Meridian is a standards body, not an IT shop: add the operating processes,
   modules and metrics that the business teams run, each with a named owner and backup. Additive only. */
(function(){
const G=(f,d)=>{try{return f()}catch(e){return d}};
const W=window;
const M={
 m_biz_comment:{n:"Public comments answered by close of review",f:"Comments with a logged response ÷ comments received in the review period",u:"%",cur:91,tgt:98,badAt:85,dir:"max",max:100,tr:[84,86,88,87,90,89,90,91],owner:"Greta Halloran",use:["Standards development"],rem:{kind:"sop",ref:"SOP-B-01",title:"Chase unanswered comments with the responsible editor",agent:"Editorial Agent",auto:false,state:"idle",prog:"Lists comments with no response and drafts a reminder"}},
 m_biz_ballot:{n:"Ballots reaching quorum on first call",f:"Ballots that reach quorum before the first deadline ÷ ballots opened",u:"%",cur:78,tgt:90,badAt:70,dir:"max",max:100,tr:[70,72,71,74,75,77,76,78],owner:"Priya Raman",use:["Standards development"],rem:{kind:"sop",ref:"SOP-B-02",title:"Send quorum reminders to members who have not voted",agent:"Member Agent",auto:false,state:"idle",prog:"Lists members who have not voted"}},
 m_biz_cycle:{n:"Days from draft to published standard",f:"Average calendar days from approved draft to publication, standards published this year",u:"days",cur:41,tgt:30,badAt:50,dir:"min",max:80,tr:[55,53,52,49,47,45,43,41],owner:"Lucia Ferrante",use:["Publishing"],rem:{kind:"sop",ref:"SOP-B-03",title:"Escalate drafts waiting on proof or layout",agent:"Editorial Agent",auto:false,state:"idle",prog:"Lists drafts older than 30 days"}},
 m_biz_committee:{n:"Committee seats filled",f:"Filled seats ÷ chartered seats, across active committees",u:"%",cur:88,tgt:95,badAt:80,dir:"max",max:100,tr:[82,83,84,85,86,87,87,88],owner:"Owen Prescott",use:["Standards development"],rem:{kind:"sop",ref:"SOP-B-04",title:"Open a call for volunteers on committees with vacancies",agent:"Member Agent",auto:false,state:"idle",prog:"Lists committees with vacant seats"}},
 m_biz_renew:{n:"Member renewal rate",f:"Member organizations renewed ÷ memberships due for renewal this year",u:"%",cur:92,tgt:95,badAt:88,dir:"max",max:100,tr:[90,91,91,90,92,92,91,92],owner:"Daniel Okoye",use:["Membership"],rem:{kind:"sop",ref:"SOP-B-05",title:"Call members who have not renewed 30 days before the due date",agent:"Member Agent",auto:false,state:"idle",prog:"Lists members due in 30 days"}},
 m_biz_onb:{n:"New members active in 90 days",f:"New member organizations with a first ballot vote or comment within 90 days ÷ new members",u:"%",cur:64,tgt:80,badAt:55,dir:"max",max:100,tr:[55,57,58,60,61,62,63,64],owner:"Sofia Lindqvist",use:["Membership"],rem:{kind:"sop",ref:"SOP-B-06",title:"Schedule a welcome call for members with no activity",agent:"Member Agent",auto:false,state:"idle",prog:"Lists new members with no activity"}},
 m_biz_dso:{n:"Days to collect dues",f:"Average days from dues invoice date to payment",u:"days",cur:38,tgt:30,badAt:45,dir:"min",max:70,tr:[46,45,44,42,41,40,39,38],owner:"Dev Anand",use:["Dues"],rem:{kind:"sop",ref:"SOP-B-07",title:"Send a payment reminder on invoices past 30 days",agent:"Invoice Agent",auto:false,state:"idle",prog:"Lists dues invoices past 30 days"}},
 m_biz_lic:{n:"Licensing requests answered in 5 days",f:"Copyright and licensing requests answered within 5 business days ÷ requests received",u:"%",cur:83,tgt:95,badAt:75,dir:"max",max:100,tr:[74,76,78,79,80,81,82,83],owner:"Graham Wells",use:["Publishing"],rem:{kind:"sop",ref:"SOP-B-08",title:"Route stalled requests to the publishing manager",agent:"Editorial Agent",auto:false,state:"idle",prog:"Lists requests older than 4 days"}},
 m_biz_close:{n:"Days to close the books",f:"Business days from month end to books closed, average of the last 12 months",u:"days",cur:7,tgt:5,badAt:9,dir:"min",max:14,tr:[10,10,9,9,8,8,7,7],owner:"Beatrice Nolan",use:["Financial reporting"],rem:{kind:"sop",ref:"SOP-B-09",title:"Chase open reconciliations before month end",agent:"Close Agent",auto:false,state:"idle",prog:"Lists unreconciled accounts"}},
 m_biz_hire:{n:"Days to fill an open role",f:"Average days from approved requisition to accepted offer",u:"days",cur:52,tgt:45,badAt:65,dir:"min",max:90,tr:[66,64,61,60,58,56,54,52],owner:"Naomi Fields",use:["People operations"],rem:{kind:"sop",ref:"SOP-B-10",title:"Review roles open more than 45 days with the hiring manager",agent:"People Agent",auto:false,state:"idle",prog:"Lists roles open more than 45 days"}},
 m_biz_conf:{n:"Conference registrations against goal",f:"Registrations to date ÷ registration goal, adjusted for days remaining",u:"%",cur:71,tgt:100,badAt:60,dir:"max",max:120,tr:[20,28,35,42,50,57,64,71],owner:"Harriet Yu",use:["Events"],rem:{kind:"sop",ref:"SOP-B-11",title:"Send a registration reminder to members who attended last year",agent:"Member Agent",auto:false,state:"idle",prog:"Lists last year's attendees not yet registered"}},
 m_biz_contract:{n:"Contracts reviewed before renewal date",f:"Contracts reviewed ≥ 60 days before renewal ÷ contracts renewing this year",u:"%",cur:86,tgt:100,badAt:75,dir:"max",max:100,tr:[76,78,80,81,83,84,85,86],owner:"Julian Park",use:["Contracts"],rem:{kind:"sop",ref:"SOP-B-12",title:"Start review for contracts renewing in 90 days",agent:"Contract Agent",auto:false,state:"idle",prog:"Lists contracts renewing in 90 days"}}
};
G(()=>{if(typeof METRICS!=="undefined")Object.keys(M).forEach(k=>{if(!METRICS[k])METRICS[k]=M[k]})});

const st=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o});
const MODS=[
 {id:"biz_stds",name:"Standards development",sn:"Standards development",band:"kai",own:"Priya Raman",proposed:false,r:["person","approval"],w:["standard_change"],flows:[{dir:"push",other:"adm_audit",data:"Ballot results, comments and approvals",entity:"approval",mode:"event",trig:"Ballot closed or comment logged"}]},
 {id:"biz_mem",name:"Membership and dues",sn:"Membership and dues",band:"mon",own:"Daniel Okoye",proposed:false,r:["person","invoice"],w:["invoice"],flows:[{dir:"push",other:"adm_audit",data:"Renewals, invoices and payments",entity:"invoice",mode:"event",trig:"Invoice issued or paid"}]},
 {id:"biz_corp",name:"Corporate operations",sn:"Corporate operations",band:"ppl",own:"Joanna Pierce",proposed:false,r:["person","contract"],w:["contract"],flows:[{dir:"push",other:"adm_audit",data:"Hires, contracts and statements",entity:"approval",mode:"event",trig:"Record saved"}]}];
const PR=[
 {id:"biz_comment",name:"Public comment period",module:"biz_stds",family:"stdv",owner:"Greta Halloran",backup:"Priya Raman",trigger:"A committee approves a draft for public comment",metrics:["m_biz_comment"],steps:[
  st("Open the comment period","Publish the draft and the closing date; notify members.","human","Ballot and comment coordinator","1 day","Approved draft","Open period"),
  st("Log each comment","Every comment is recorded with its author and section.","robot","Robot","Instant","Comment","Logged comment"),
  st("Draft responses","Editors draft a response to each comment; AI suggestions are labeled drafts.","human","Standards editor","10 days","Logged comment","Draft response"),
  st("Committee review","The committee accepts, changes or rejects each response.","gate","Technical committee","7 days","Draft response","Committee decision"),
  st("Publish the response letter","Responses go back to every commenter.","human","Ballot and comment coordinator","2 days","Committee decision","Response letter")]},
 {id:"biz_ballot",name:"Ballot and vote tally",module:"biz_stds",family:"stdv",owner:"Priya Raman",backup:"Greta Halloran",trigger:"A revised standard is ready for member vote",metrics:["m_biz_ballot"],steps:[
  st("Open the ballot","Set quorum and deadline; confirm who may vote.","human","Ballot and comment coordinator","1 day","Revised standard","Open ballot"),
  st("Remind members","Reminders go to members who have not voted.","agent","Member Agent","Weekly","Open ballot","Reminder"),
  st("Close and tally","Count votes and check quorum.","robot","Robot","Instant","Votes","Tally"),
  st("Resolve negative votes","Each negative vote is answered and the voter asked to confirm.","human","Standards editor","10 days","Tally","Resolved votes"),
  st("Approve for publication","The editorial board approves the result.","gate","Editorial board","5 days","Resolved votes","Approval to publish")]},
 {id:"biz_publish",name:"Standard publication",module:"biz_stds",family:"stdv",owner:"Lucia Ferrante",backup:"Elena Marsh",trigger:"A standard is approved for publication",metrics:["m_biz_cycle"],steps:[
  st("Final edit and proof","Cross-references, numbering and final proof.","human","Standards editor","5 days","Approved standard","Proofed standard"),
  st("Layout and formats","Print, PDF and digital editions.","human","Publishing manager","5 days","Proofed standard","Editions"),
  st("Chief editor sign-off","The chief editor confirms the edition.","gate","Chief editor","2 days","Editions","Signed-off edition"),
  st("Release","Publish, announce to members and update the catalog.","human","Publishing manager","1 day","Signed-off edition","Published standard"),
  st("Track errata","Reported errors are logged and corrected.","human","Standards editor","Ongoing","Published standard","Errata list")]},
 {id:"biz_committee",name:"Committee formation and charter",module:"biz_stds",family:"stdv",owner:"Owen Prescott",backup:"Priya Raman",trigger:"A new standards project needs a committee",metrics:["m_biz_committee"],steps:[
  st("Draft the charter","Scope, seats, balance of interests and term.","human","Committee liaison","5 days","Project proposal","Draft charter"),
  st("Approve the charter","The director of standards development approves.","gate","Director of standards development","3 days","Draft charter","Approved charter"),
  st("Call for volunteers","Open call to members; screen for conflicts of interest.","human","Committee liaison","14 days","Approved charter","Candidate list"),
  st("Seat the committee","Confirm members and publish the roster.","human","Committee liaison","3 days","Candidate list","Seated committee")]},
 {id:"biz_renew",name:"Membership renewal",module:"biz_mem",family:"memb",owner:"Daniel Okoye",backup:"Sofia Lindqvist",trigger:"A membership is within 90 days of its renewal date",metrics:["m_biz_renew"],steps:[
  st("Forecast renewals","List memberships due and flag those at risk.","agent","Member Agent","Monthly","Membership list","Renewal forecast"),
  st("Reach out","Member services contacts each member due.","human","Member services manager","30 days","Renewal forecast","Member response"),
  st("Issue the dues invoice","Hand off to dues invoicing.","robot","Robot","Instant","Member response","Dues invoice"),
  st("Record the outcome","Renewed, lapsed or changed tier, with the reason.","human","Dues and renewals analyst","2 days","Dues invoice","Renewal record")]},
 {id:"biz_onboard",name:"New member onboarding",module:"biz_mem",family:"memb",owner:"Sofia Lindqvist",backup:"Daniel Okoye",trigger:"A new member organization signs",metrics:["m_biz_onb"],steps:[
  st("Confirm membership and tier","Check the agreement and dues tier.","human","Member services manager","1 day","Signed agreement","Confirmed membership"),
  st("Set up access","Give the member's representatives access to ballots and drafts.","human","Member services manager","2 days","Confirmed membership","Member accounts"),
  st("Welcome call","Explain committees, ballots and benefits.","human","Member services manager","10 days","Member accounts","Welcome notes"),
  st("90-day check","Confirm first activity; offer help if none.","agent","Member Agent","90 days","Welcome notes","Activity check")]},
 {id:"biz_dues",name:"Dues invoicing and collections",module:"biz_mem",family:"memb",owner:"Dev Anand",backup:"Noelle Park",trigger:"A membership renews or a dues cycle opens",metrics:["m_biz_dso"],steps:[
  st("Issue the invoice","Amount from the member's tier.","robot","Robot","Instant","Renewal record","Dues invoice"),
  st("Remind","A reminder goes out at 30 days if unpaid.","agent","Invoice Agent","30 days","Dues invoice","Reminder"),
  st("Follow up","Call the member and offer a payment plan if needed.","human","Dues billing and collections analyst","7 days","Reminder","Payment or plan"),
  st("Approve a write-off","Write-offs need the controller.","gate","Controller","5 days","Unpaid invoice","Approved write-off"),
  st("Record payment","Match the payment to the invoice.","robot","Robot","Instant","Payment","Closed invoice")]},
 {id:"biz_license",name:"Copyright and licensing request",module:"biz_stds",family:"stdv",owner:"Graham Wells",backup:"Lucia Ferrante",trigger:"Someone asks to reuse or translate a publication",metrics:["m_biz_lic"],steps:[
  st("Log the request","Who, what and for what use.","human","Licensing specialist","1 day","Request","Logged request"),
  st("Check rights","Confirm ownership and any existing licence.","human","Licensing specialist","2 days","Logged request","Rights check"),
  st("Set terms and fee","Standard terms; unusual terms go to legal.","gate","Publishing manager","2 days","Rights check","Licence terms"),
  st("Send the licence","Signed copy filed with the contract record.","human","Licensing specialist","1 day","Licence terms","Signed licence")]},
 {id:"biz_audit",name:"Annual audit and financial statements",module:"biz_corp",family:"corp",owner:"Beatrice Nolan",backup:"Avery Chen",trigger:"Fiscal year end",metrics:["m_biz_close"],steps:[
  st("Close the year","Reconcile accounts and recognize dues revenue.","human","Financial reporting manager","10 days","Ledger","Closed year"),
  st("Prepare statements","Draft financial statements and notes.","human","Financial reporting manager","10 days","Closed year","Draft statements"),
  st("Support the auditors","Provide evidence for each request.","human","Controller","20 days","Draft statements","Audit evidence"),
  st("Audit committee approval","The audit committee approves the statements.","gate","Audit committee","7 days","Audit evidence","Approved statements"),
  st("Publish to members","Annual report and Form 990.","human","Chief financial officer","5 days","Approved statements","Published report")]},
 {id:"biz_hire",name:"Hiring and onboarding",module:"biz_corp",family:"corp",owner:"Naomi Fields",backup:"Joanna Pierce",trigger:"A manager opens an approved requisition",metrics:["m_biz_hire"],steps:[
  st("Approve the requisition","Within approved headcount.","gate","Head of People Operations","3 days","Requisition","Approved requisition"),
  st("Source and interview","Post the role; the hiring manager interviews.","human","Talent acquisition partner","30 days","Approved requisition","Shortlist"),
  st("Make the offer","Offer approval by the hiring manager and People Operations.","gate","Hiring manager","3 days","Shortlist","Accepted offer"),
  st("Onboard","Equipment, access, facilities and first-week plan.","human","Facilities and office manager","7 days","Accepted offer","New starter ready")]},
 {id:"biz_conf",name:"Annual conference planning",module:"biz_corp",family:"corp",owner:"Harriet Yu",backup:"Daniel Okoye",trigger:"Twelve months before the conference",metrics:["m_biz_conf"],steps:[
  st("Set goals and budget","Registration goal and budget approved.","gate","Chief executive","10 days","Last year's results","Approved plan"),
  st("Book venue and speakers","Contracts reviewed before signing.","human","Events and conference manager","60 days","Approved plan","Booked venue and speakers"),
  st("Open registration","Announce to members and track registrations.","human","Events and conference manager","Ongoing","Booked venue and speakers","Registrations"),
  st("Run and review","Run the event; report results against goal.","human","Events and conference manager","30 days","Registrations","Results report")]},
 {id:"biz_contract",name:"Contract review and renewal",module:"biz_corp",family:"corp",owner:"Julian Park",backup:"Theo Marlowe",trigger:"A contract is 90 days from its renewal date or a new one is requested",metrics:["m_biz_contract"],steps:[
  st("List contracts due","Renewals in the next 90 days.","robot","Robot","Weekly","Contract register","Renewal list"),
  st("Review terms","Check terms, price and liability.","human","Contracts paralegal","10 days","Renewal list","Redlines"),
  st("Legal approval","General counsel approves terms outside the standard.","gate","General counsel","5 days","Redlines","Approved terms"),
  st("Route for signature","The signer is set by delegation of authority.","human","Contracts paralegal","5 days","Approved terms","Signed contract")]}];
const done={mod:{},proc:{}};
G(()=>{if(W.LINKS&&LINKS.families&&!LINKS.families.some(f=>f.id==='stdv')){LINKS.families.push({id:'stdv',name:'Standards and publishing'},{id:'memb',name:'Membership and dues'},{id:'corp',name:'Corporate operations'})}});
function wire(){
 if(!(W.MODMAP&&MODMAP.addModule&&G(()=>MODMAP.modules.length,0)&&W.PROCLIB&&PROCLIB.addProcess))return false;
 let all=true;
 MODS.forEach(m=>{if(!done.mod[m.id]){const r=G(()=>MODMAP.addModule(m),null);if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))done.mod[m.id]=1;else all=false}});
 if(!MODS.every(m=>done.mod[m.id]))return false;
 PR.forEach(p=>{if(!done.proc[p.id]){const r=G(()=>PROCLIB.addProcess(Object.assign({entities:["person","approval"],model:"cmmi",std:["bpmn"],inputs:[p.steps[0].in],outputs:[p.steps[p.steps.length-1].out]},p)),null);if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))done.proc[p.id]=1;else all=false}});
 if(all&&MODMAP.refresh)G(()=>MODMAP.refresh());
 return all;
}
W.R20B={wire,metrics:M,processes:PR,modules:MODS,done};
[400,1200,2500,5000,9000].forEach(t=>setTimeout(()=>{try{if(!(PR.every(p=>done.proc[p.id])))wire()}catch(e){console.error("r20b",e)}},t));
})();
