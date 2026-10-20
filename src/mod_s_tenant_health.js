/* ===== mod_s_tenant_health: the Healthcare loader spike (DC-03). A small pack in the DC-09 format for Larkspur Health System
   (fictional), enough to put Healthcare on the three tenant views. Every figure is sample data (simulated). The full industry pack
   replaces this in wave 2 (DC-11). Money follows the core shapes: project bac and paid in thousands, budget lines in dollars. ===== */
(function(){
const W=window,DT=W.DATA;if(!DT)return;
DT.pack("health",{
 projects:[
  {id:"LH-PR1",n:"Patient access center consolidation",short:"Access center",owner:"Priya Venkataraman",bac:2400,paid:1100},
  {id:"LH-PR2",n:"Sterile processing tray tracking",short:"Tray tracking",owner:"Tomasz Brandt",bac:860,paid:310},
  {id:"LH-PR3",n:"Prior authorization automation",short:"Prior auth",owner:"Helena Marsh",bac:1250,paid:540},
  {id:"LH-PR4",n:"Discharge follow-up program",short:"Discharge follow-up",owner:"Dr. Marcus Hale",bac:640,paid:120}],
 budget_lines:[
  {id:"LH-PR1-LAB",p:"LH-PR1",cat:"Labor",n:"Scheduler retraining and overlap staffing",appr:900000,comm:880000,act:510000,fcst:960000,own:"Priya Venkataraman"},
  {id:"LH-PR1-SW",p:"LH-PR1",cat:"Software",n:"Scheduling and referral licenses",appr:620000,comm:620000,act:310000,fcst:620000,own:"Priya Venkataraman"},
  {id:"LH-PR2-HW",p:"LH-PR2",cat:"Equipment",n:"Tray scanners and labels",appr:340000,comm:300000,act:120000,fcst:335000,own:"Tomasz Brandt"},
  {id:"LH-PR3-SVC",p:"LH-PR3",cat:"Services",n:"Payer rules configuration",appr:480000,comm:470000,act:260000,fcst:530000,own:"Helena Marsh"},
  {id:"LH-PR4-LAB",p:"LH-PR4",cat:"Labor",n:"Follow-up nurse calls",appr:280000,comm:150000,act:60000,fcst:270000,own:"Dr. Marcus Hale"}],
 metrics:[
  {id:"lh_m_access",n:"Days to first appointment",u:"days",cur:12,tgt:7,dir:"min",owner:"Priya Venkataraman"},
  {id:"lh_m_denial",n:"Claim denial rate",u:"%",cur:9.4,tgt:6,dir:"min",owner:"Helena Marsh"},
  {id:"lh_m_noon",n:"Discharges before noon",u:"%",cur:31,tgt:40,dir:"max",owner:"Tomasz Brandt"},
  {id:"lh_m_trays",n:"Instrument trays ready on time",u:"%",cur:94,tgt:98,dir:"max",owner:"Tomasz Brandt"}],
 objectives:[
  {id:"LH-O1",t:"obj",n:"Open access: a first appointment within seven days",owner:"Priya Venkataraman",story:"Bring the wait for a first appointment from 12 days to 7 by the end of next year."},
  {id:"LH-O2",t:"obj",n:"Cut avoidable claim denials by a third",owner:"Helena Marsh",story:"Move prior authorization checks before the visit so fewer claims come back denied."}]
},{org:"Larkspur Health System",short:"Larkspur Health",kind:"A regional health system"});
/* a few more people for the directory, beyond the function leaders the org chart already lists */
if(W.STN)STN.extra.health={people:[
 {id:"lh-ana-morales",name:"Ana Morales",kind:"human",role:"Access center manager",team:"Access center",org:"Larkspur Health System"},
 {id:"lh-ben-kowalski",name:"Ben Kowalski",kind:"human",role:"Revenue cycle analyst",team:"Revenue cycle",org:"Larkspur Health System"},
 {id:"lh-referral-agent",name:"Referral Intake Agent",kind:"agent",role:"Reads referrals and drafts the first appointment",team:"Access center",org:""},
 {id:"lh-auth-agent",name:"Prior Auth Agent",kind:"agent",role:"Checks payer rules before the visit",team:"Revenue cycle",org:""}]};
})();
