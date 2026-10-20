/* Round 24: the Operations division. Meridian also distributes what it publishes, runs a pilot plant where draft standards are proved,
   keeps its buildings working and buys what it needs. Six new roles, each with named people, processes, metrics and data.
   Additive only: every id is new, every entity reuses an existing one first, and each process has an owner and a different backup. */
(function(){
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const W=window;
const mt=(n,f,u,cur,tgt,badAt,dir,max,tr,owner,use,ref,title,agent)=>({n,f,u,cur,tgt,badAt,dir,max,tr,owner,use:[use],rem:{kind:"sop",ref,title,agent,auto:false,state:"idle",prog:"Lists what is off target and drafts the first action for the owner"}});
const M={
 m_ops_csat:mt("Customer satisfaction after a support case","Customers rating the outcome 4 or 5 of 5 ÷ customers who answered the follow-up survey","%",88,92,82,"max",100,[82,83,85,84,86,87,87,88],"Zainab Ali","Customer care","SOP-O-01","Call back every customer who rated 1 or 2 within one working day","Customer Care Agent"),
 m_ops_pubrev:mt("Publication revenue against plan","Year to date revenue from standards, books and subscriptions ÷ plan to date","%",96,100,90,"max",120,[91,92,93,95,94,95,96,96],"Lena Hargrove","Commercial","SOP-O-02","Review price and promotion for the three lowest titles against plan","Pricing Agent"),
 m_ops_case:mt("Days to resolve a customer case","Average calendar days from case opened to case closed, cases closed this month","days",3.4,2,5,"min",8,[5.1,4.9,4.6,4.4,4.1,3.9,3.6,3.4],"Zainab Ali","Customer care","SOP-O-03","Reassign cases older than 5 days and tell the customer the new date","Customer Care Agent"),
 m_ops_otd:mt("Orders shipped by the promised date","Orders shipped on or before the promised ship date ÷ orders due to ship","%",94,98,90,"max",100,[90,91,92,93,92,93,94,94],"Tomas Reyes","Distribution","SOP-O-04","Re-plan the day's pick list around orders due today","Fulfillment Agent"),
 m_ops_invacc:mt("Stock count accuracy","Locations where counted quantity equals system quantity ÷ locations counted in the cycle","%",97.2,99,95,"max",100,[95.1,95.6,96,96.3,96.8,96.7,97,97.2],"Kofi Mensah","Distribution","SOP-O-05","Recount locations that differ and find the cause before adjusting","Inventory Agent"),
 m_ops_d2s:mt("Hours from order to shipped","Average hours between order release and carrier handover","hours",31,24,40,"min",60,[42,40,38,37,35,34,32,31],"Tomas Reyes","Distribution","SOP-O-06","Move waiting orders to the next wave and book an extra carrier pickup","Fulfillment Agent"),
 m_ops_pick:mt("Pick lines without a correction","Order lines packed correctly the first time ÷ order lines packed","%",99.1,99.7,98.5,"max",100,[98.4,98.6,98.8,98.7,98.9,99,99,99.1],"Kofi Mensah","Distribution","SOP-O-07","Review the pick errors by shelf and relabel the worst five locations","Inventory Agent"),
 m_ops_pm:mt("Preventive maintenance done on time","Preventive tasks completed by their due date ÷ preventive tasks due","%",89,95,80,"max",100,[80,82,84,85,86,88,88,89],"Joel Tran","Facilities","SOP-O-08","Schedule the overdue tasks into the next two weeks and notify the contractor","Facilities Agent"),
 m_ops_wo_age:mt("Age of open work orders","Median days open across work orders that are not closed","days",6.5,5,10,"min",16,[11,10.4,9.5,8.8,8,7.6,7,6.5],"Ruben Castillo","Facilities","SOP-O-09","List work orders older than 14 days with the blocking reason","Facilities Agent"),
 m_ops_safety:mt("Safety inspections complete","Inspections completed in the month ÷ inspections scheduled","%",96,100,90,"max",100,[90,91,93,94,93,95,95,96],"Ruben Castillo","Facilities","SOP-O-10","Book the missed inspections and tell the site lead","Facilities Agent"),
 m_ops_sotd:mt("Supplier on-time delivery","Purchase order lines delivered by the promised date ÷ lines due in the period","%",91,95,85,"max",100,[86,87,88,89,89,90,90,91],"Camille Ortega","Supply chain","SOP-O-11","Call the five latest suppliers and agree a recovery date","Sourcing Agent"),
 m_ops_req2po:mt("Days from requisition to purchase order","Average business days from approved requisition to purchase order sent","days",2.6,2,4,"min",8,[4.2,4,3.7,3.5,3.2,3,2.8,2.6],"Alba Torres","Supply chain","SOP-O-12","Release requisitions waiting on a quote and flag those without a supplier","Sourcing Agent"),
 m_ops_contract:mt("Spend under contract","Spend with a signed contract or catalog price ÷ total purchase spend","%",78,90,70,"max",100,[70,71,73,74,75,76,77,78],"Camille Ortega","Supply chain","SOP-O-13","List the top suppliers with no contract and start a renewal for each","Sourcing Agent"),
 m_ops_supprisk:mt("Suppliers with an open risk finding","Suppliers with an unresolved risk finding ÷ active suppliers","%",7,3,12,"min",25,[14,13,12,11,10,9,8,7],"Camille Ortega","Supply chain","SOP-O-14","Ask each supplier with an open finding for a dated fix","Sourcing Agent"),
 m_ops_oee:mt("Pilot plant equipment effectiveness","Availability × performance × quality, runs this month","%",71,80,62,"max",100,[62,64,65,67,68,69,70,71],"Dmitri Kowal","Plant operations","SOP-O-15","Review the three largest losses and agree one fix for each","Plant Agent"),
 m_ops_downtime:mt("Unplanned downtime hours","Hours the pilot plant stopped without a plan, this month","hours",18,10,30,"min",50,[34,31,29,27,24,22,20,18],"Dmitri Kowal","Plant operations","SOP-O-16","Open the downtime log and assign a cause to every stop over 30 minutes","Plant Agent"),
 m_ops_fpy:mt("Batches right the first time","Batches passing inspection with no rework ÷ batches produced","%",93,97,88,"max",100,[88,89,90,91,91,92,92,93],"Mei-Ling Zhou","Quality","SOP-O-17","Hold the next batch until the last failure cause is closed","Quality Agent"),
 m_ops_ncr:mt("Open nonconformance reports older than 30 days","Nonconformance reports not closed after 30 days","reports",4,0,8,"min",15,[11,10,9,8,7,6,5,4],"Mei-Ling Zhou","Quality","SOP-O-18","Escalate each aged report to its owner with the evidence still missing","Quality Agent"),
 m_ops_alarm:mt("Alarms per operator per hour","Alarms raised in the control room ÷ operator hours on shift","per hour",9,6,14,"min",24,[16,15,14,13,12,11,10,9],"Sofia Arenas","Process control","SOP-O-19","Rank the top ten nuisance alarms and propose a limit change for each","Control Agent"),
 m_ops_moc:mt("Control changes with an approved change record","Control logic changes made with an approved management of change ÷ control logic changes made","%",100,100,95,"max",100,[96,97,98,98,99,99,100,100],"Sofia Arenas","Process control","SOP-O-20","Compare the controller change log to approved records and list gaps","Control Agent"),
 m_ops_permit:mt("Permits to work closed on the day","Permits closed by the end of the shift they were issued ÷ permits issued","%",95,100,88,"max",100,[88,89,91,92,93,94,94,95],"Sofia Arenas","Process control","SOP-O-21","List open permits and confirm each with the issuer before shift change","Control Agent"),
 m_ops_handover:mt("Shift handovers with every item acknowledged","Handover notes acknowledged by the incoming operator ÷ handovers made","%",92,100,85,"max",100,[84,85,87,88,89,90,91,92],"Hugo Baptiste","Process control","SOP-O-22","Send unacknowledged items to the incoming operator at start of shift","Control Agent")
};
G(()=>{if(typeof METRICS!=="undefined")Object.keys(M).forEach(k=>{if(!METRICS[k])METRICS[k]=M[k]})});

/* ---------- data: reuse first, five new proposed entities ---------- */
const f=(k,label,type,o)=>Object.assign({k,label,type,authority:"platform",classification:"internal",proposed:true},o||{});
const ENT={
 customer_case:{label:"Customer case",source:"Customer care",ownerMod:"ops_cust",steward:"Zainab Ali",note:"A buyer's question, complaint or refund request. Reuses person and core_company; does not copy buyer details.",fields:[f("case_no","Case number","text",{req:true}),f("customer","Customer","text",{ref:"core_company",classification:"personal"}),f("kind","Kind","enum",{opts:["question","complaint","refund","delivery"]}),f("opened","Opened","date"),f("status","Status","enum",{opts:["new","working","waiting on customer","resolved"]}),f("owner","Owner","text",{ref:"person"}),f("rating","Satisfaction rating","num")]},
 sales_order:{label:"Sales order",source:"Distribution",ownerMod:"ops_dist",steward:"Tomas Reyes",note:"An order for printed or digital standards. Invoicing stays with the existing invoice entity.",fields:[f("order_no","Order number","text",{req:true}),f("customer","Customer","text",{ref:"core_company",classification:"personal"}),f("ordered","Ordered","date"),f("promised","Promised ship date","date"),f("status","Status","enum",{opts:["open","picking","shipped","delivered","returned"]}),f("invoice","Invoice","text",{ref:"invoice"})]},
 inventory_item:{label:"Inventory item",source:"Distribution",ownerMod:"ops_dist",steward:"Kofi Mensah",note:"Stock by location. The product itself is the existing catalog_item.",fields:[f("sku","Product","text",{ref:"catalog_item",req:true}),f("location","Location","text",{ref:"config_item_site"}),f("on_hand","On hand","num"),f("reorder_at","Reorder at","num"),f("counted","Last counted","date")]},
 shipment:{label:"Shipment",source:"Distribution",ownerMod:"ops_dist",steward:"Tomas Reyes",note:"Carrier handover and delivery for a sales order or a purchase order receipt.",fields:[f("ship_no","Shipment number","text",{req:true}),f("order","Sales order","text",{ref:"sales_order"}),f("carrier","Carrier","text",{ref:"core_company"}),f("shipped","Shipped","date"),f("tracking","Tracking reference","text"),f("delivered","Delivered","date")]},
 work_order:{label:"Work order",source:"Facilities and maintenance",ownerMod:"ops_fac",steward:"Joel Tran",note:"Planned or requested work on a building or piece of equipment. Reuses asset and config_item_site.",fields:[f("wo_no","Work order number","text",{req:true}),f("asset","Asset","text",{ref:"asset"}),f("site","Site","text",{ref:"config_item_site"}),f("kind","Kind","enum",{opts:["preventive","repair","inspection","request"]}),f("priority","Priority","enum",{opts:["low","normal","high","urgent"]}),f("due","Due","date"),f("assignee","Assigned to","text",{ref:"person"}),f("status","Status","enum",{opts:["open","scheduled","in progress","done"]})]},
 production_run:{label:"Production run",source:"Pilot plant",ownerMod:"ops_plant",steward:"Dmitri Kowal",note:"One batch at the pilot plant that proves a draft standard on real equipment.",fields:[f("run_no","Run number","text",{req:true}),f("standard","Standard under test","text"),f("asset","Equipment","text",{ref:"asset"}),f("started","Started","date"),f("ended","Ended","date"),f("yield","Yield","num"),f("status","Status","enum",{opts:["planned","running","held","released","closed"]})]},
 quality_hold:{label:"Quality hold",source:"Quality",ownerMod:"ops_plant",steward:"Mei-Ling Zhou",note:"A batch or lot stopped until a nonconformance is closed.",fields:[f("hold_no","Hold number","text",{req:true}),f("run","Production run","text",{ref:"production_run"}),f("reason","Reason","text"),f("raised","Raised","date"),f("owner","Owner","text",{ref:"person"}),f("status","Status","enum",{opts:["open","investigating","released","scrapped"]})]},
 permit_to_work:{label:"Permit to work",source:"Process control",ownerMod:"ops_ctrl",steward:"Sofia Arenas",note:"Written permission for work in a live area. Linked to a work order and a change request where one exists.",fields:[f("permit_no","Permit number","text",{req:true}),f("work_order","Work order","text",{ref:"work_order"}),f("area","Area","text",{ref:"config_item_site"}),f("issued_by","Issued by","text",{ref:"person"}),f("issued","Issued","date"),f("closed","Closed","date"),f("status","Status","enum",{opts:["requested","issued","closed","cancelled"]})]}
};

/* ---------- modules and processes ---------- */
const st=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o});
const fl=(dir,other,data,entity,mode,trig)=>({dir,other,data,entity,mode,trig});
const AUD=fl("push","adm_audit","Events and approvals written to the audit trail","audit_event","event","Any change");
const MODS=[
 {id:"ops_cust",name:"Customer care and commercial",sn:"Customer care",band:"mon",own:"Lena Hargrove",proposed:true,r:["person","core_company","invoice"],w:["customer_case"],flows:[fl("pull","biz_mem","Member and buyer records","core_company","api","A case is opened"),fl("push","ops_dist","Refund and return requests","sales_order","event","A refund is approved"),AUD]},
 {id:"ops_dist",name:"Distribution and fulfillment",sn:"Distribution",band:"ops",own:"Tomas Reyes",proposed:true,r:["catalog_item","core_company","goods_receipt"],w:["sales_order","inventory_item","shipment"],flows:[fl("pull","ops_scm","Inbound goods receipts","goods_receipt","event","Purchase order delivered"),fl("push","ops_cust","Shipment status for customer cases","shipment","api","Carrier handover"),AUD]},
 {id:"ops_fac",name:"Facilities and maintenance",sn:"Facilities",band:"ppl",own:"Ruben Castillo",proposed:true,r:["asset","config_item_site","room","maintenance_window"],w:["work_order"],flows:[fl("push","ops_ctrl","Work orders that need a permit","work_order","event","Work in a live area"),fl("pull","ops_scm","Contractor purchase orders","purchase_order","api","Contractor booked"),AUD]},
 {id:"ops_scm",name:"Supply chain and sourcing",sn:"Sourcing",band:"mon",own:"Camille Ortega",proposed:true,r:["requisition","purchase_order","core_company","contract","budget_line"],w:["purchase_order","goods_receipt"],flows:[fl("pull","bud_lines","Budget availability","budget_line","api","Requisition approved"),fl("push","ops_dist","Expected receipts","goods_receipt","event","Purchase order sent"),AUD]},
 {id:"ops_plant",name:"Pilot plant and quality",sn:"Pilot plant",band:"ops",own:"Dmitri Kowal",proposed:true,r:["asset","config_item_site","person"],w:["production_run","quality_hold"],flows:[fl("pull","ops_fac","Equipment work orders","work_order","api","Run planned"),fl("push","biz_stds","Test results for draft standards","production_run","event","Run closed"),AUD]},
 {id:"ops_ctrl",name:"Process control and safety",sn:"Process control",band:"ops",own:"Sofia Arenas",proposed:true,r:["asset","change_request","alert_event","alert_rule"],w:["permit_to_work"],flows:[fl("pull","ops_fac","Work orders needing a permit","work_order","event","Work in a live area"),fl("push","adm_audit","Alarm, change and permit events","alert_event","event","Alarm raised or permit issued"),AUD]}
];
const PR=[
 {id:"ops_complaint",name:"Customer complaint and refund",module:"ops_cust",family:"cust",owner:"Zainab Ali",backup:"Lena Hargrove",trigger:"A buyer reports a problem with an order or a publication",metrics:["m_ops_csat","m_ops_case"],entities:["customer_case","sales_order","invoice"],steps:[
  st("Log the case","Capture the buyer, the order and the problem; link the order.","human","Customer care","Same day","Buyer contact","Logged case"),
  st("Check the facts","Pull order, shipment and payment status; suggest the likely cause as a labeled draft.","agent","Customer Care Agent","Instant","Logged case","Case summary"),
  st("Decide the remedy","Replacement, refund or explanation inside the support limit.","human","Customer care","1 day","Case summary","Remedy"),
  st("Approve refunds over the limit","Amounts over the limit go to the commercial officer.","gate","Chief commercial officer","2 days","Remedy","Approved refund"),
  st("Close and ask","Tell the buyer, issue the refund, send a one-question survey.","robot","Robot","Immediate","Approved refund","Closed case and survey")]},
 {id:"ops_pricing",name:"Publication price change",module:"ops_cust",family:"cust",owner:"Lena Hargrove",backup:"Daniel Okoye",trigger:"A title misses plan or a cost changes",metrics:["m_ops_pubrev"],entities:["catalog_item","invoice"],steps:[
  st("Propose the change","Price, promotion or bundle with the expected effect on revenue.","human","Commercial","3 days","Revenue against plan","Price proposal"),
  st("Test the effect","Compare with past price changes and member discounts.","agent","Pricing Agent","Instant","Price proposal","Expected effect"),
  st("Approve","Finance confirms margin; the commercial officer decides.","gate","Chief commercial officer","3 days","Expected effect","Approved price"),
  st("Publish and watch","Update the catalog and watch sales for 30 days.","robot","Robot","Immediate","Approved price","New price live")]},
 {id:"ops_survey",name:"Customer survey and follow-up",module:"ops_cust",family:"cust",owner:"Zainab Ali",backup:"Lena Hargrove",trigger:"A case closes or an order is delivered",metrics:["m_ops_csat"],entities:["customer_case"],steps:[
  st("Send the survey","One question and a free text box.","robot","Robot","Immediate","Closed case","Survey sent"),
  st("Read the answers","Group answers by cause and flag low ratings.","agent","Customer Care Agent","Daily","Survey answers","Themes and low ratings"),
  st("Call back low ratings","A person calls every customer who rated 1 or 2.","human","Customer care","1 day","Low ratings","Callback done"),
  st("Report themes","Monthly themes go to the commercial officer.","human","Customer care lead","Monthly","Themes","Theme report")]},
 {id:"ops_bulk",name:"Institutional order quote",module:"ops_cust",family:"cust",owner:"Lena Hargrove",backup:"Tomas Reyes",trigger:"A company or university asks for a large order",metrics:["m_ops_pubrev"],entities:["sales_order","catalog_item"],steps:[
  st("Capture the request","Titles, quantities, dates and delivery site.","human","Commercial","1 day","Request","Quote request"),
  st("Check stock and lead time","Stock on hand and print lead time.","agent","Fulfillment Agent","Instant","Quote request","Availability"),
  st("Price and approve","Volume price inside the discount limit; above it, approval.","gate","Chief commercial officer","2 days","Availability","Approved quote"),
  st("Send and convert","Quote to the buyer; accepted quotes become sales orders.","robot","Robot","Immediate","Approved quote","Sales order")]},
 {id:"ops_order2ship",name:"Order to shipment",module:"ops_dist",family:"fulf",owner:"Tomas Reyes",backup:"Kofi Mensah",trigger:"A paid order is released to the warehouse",metrics:["m_ops_otd","m_ops_d2s"],entities:["sales_order","inventory_item","shipment"],steps:[
  st("Release and allocate","Reserve stock for the order; short orders are flagged.","robot","Robot","Immediate","Paid order","Allocated order"),
  st("Plan the wave","Group orders by carrier and promised date.","agent","Fulfillment Agent","Hourly","Allocated order","Pick wave"),
  st("Pick and pack","Pick, check and pack.","human","Warehouse team","4 hours","Pick wave","Packed order"),
  st("Hand to carrier","Label, scan and hand over.","human","Warehouse supervisor","2 hours","Packed order","Shipment"),
  st("Tell the buyer","Tracking sent; late orders trigger a note and a case.","robot","Robot","Immediate","Shipment","Buyer notified")]},
 {id:"ops_returns",name:"Return receipt and restock",module:"ops_dist",family:"fulf",owner:"Kofi Mensah",backup:"Tomas Reyes",trigger:"A returned parcel arrives",metrics:["m_ops_invacc"],entities:["sales_order","inventory_item"],steps:[
  st("Receive and match","Scan the parcel and match it to the order.","human","Warehouse team","1 day","Returned parcel","Matched return"),
  st("Inspect","Resell, repair or scrap.","human","Warehouse supervisor","1 day","Matched return","Disposition"),
  st("Restock or write off","Update stock; scrap above the limit needs approval.","gate","Distribution manager","2 days","Disposition","Stock updated"),
  st("Trigger the refund","Tell customer care the item is back.","robot","Robot","Immediate","Stock updated","Refund trigger")]},
 {id:"ops_cycle",name:"Cycle count and stock adjustment",module:"ops_dist",family:"fulf",owner:"Kofi Mensah",backup:"Tomas Reyes",trigger:"The weekly count list is generated",metrics:["m_ops_invacc","m_ops_pick"],entities:["inventory_item"],steps:[
  st("Choose locations","Fast movers and past misses first.","agent","Inventory Agent","Weekly","Stock history","Count list"),
  st("Count","Blind count by someone who does not own the location.","human","Warehouse team","1 day","Count list","Counts"),
  st("Recount differences","Recount before any adjustment.","human","Warehouse supervisor","1 day","Counts","Confirmed differences"),
  st("Approve adjustments","Large adjustments need the distribution manager.","gate","Distribution manager","2 days","Confirmed differences","Approved adjustments"),
  st("Adjust and learn","Post the adjustment and record the cause.","robot","Robot","Immediate","Approved adjustments","Updated stock and cause")]},
 {id:"ops_inbound",name:"Receive stock",module:"ops_dist",family:"fulf",owner:"Tomas Reyes",backup:"Kofi Mensah",trigger:"A supplier delivery arrives",metrics:["m_ops_invacc","m_ops_sotd"],entities:["goods_receipt","purchase_order","inventory_item"],steps:[
  st("Match to purchase order","Scan the delivery against the open purchase order.","human","Warehouse team","2 hours","Delivery","Matched delivery"),
  st("Count and inspect","Quantity and damage.","human","Warehouse team","4 hours","Matched delivery","Receipt"),
  st("Post the receipt","Goods receipt posted; the invoice can now be matched.","robot","Robot","Immediate","Receipt","Goods receipt"),
  st("Put away","Move to the pick location.","human","Warehouse team","1 day","Goods receipt","Stocked item")]},
 {id:"ops_pm",name:"Preventive maintenance cycle",module:"ops_fac",family:"fclt",owner:"Joel Tran",backup:"Ruben Castillo",trigger:"A maintenance task falls due",metrics:["m_ops_pm"],entities:["work_order","asset"],steps:[
  st("Generate the task","Tasks come from the asset's maintenance plan.","robot","Robot","Weekly","Maintenance plan","Work order"),
  st("Schedule","Pick a window that avoids events and freezes.","human","Maintenance planner","2 days","Work order","Scheduled order"),
  st("Do the work","In-house or contractor; contractors need a purchase order.","human","Technician or contractor","Per task","Scheduled order","Completed work"),
  st("Verify and close","Photo and checklist attached before closing.","gate","Facilities and office manager","1 day","Completed work","Closed order")]},
 {id:"ops_wo",name:"Work request to close",module:"ops_fac",family:"fclt",owner:"Ruben Castillo",backup:"Joel Tran",trigger:"An employee reports a problem in the building",metrics:["m_ops_wo_age"],entities:["work_order","room","config_item_site"],steps:[
  st("Report it","From the service portal with a photo and the room.","human","Employee","Minutes","Problem","Request"),
  st("Triage","Safety first, then urgency and who can fix it.","agent","Facilities Agent","Instant","Request","Prioritized work order"),
  st("Assign","Technician or contractor.","human","Maintenance planner","1 day","Prioritized work order","Assigned order"),
  st("Fix and confirm","The reporter confirms the fix.","human","Technician","Per priority","Assigned order","Confirmed fix")]},
 {id:"ops_contractor",name:"Contractor visit and access",module:"ops_fac",family:"fclt",owner:"Joel Tran",backup:"Ruben Castillo",trigger:"A contractor is booked",metrics:["m_ops_pm"],entities:["purchase_order","work_order","person"],steps:[
  st("Check insurance and purchase order","Valid insurance and an approved purchase order.","robot","Robot","Instant","Booking","Cleared contractor"),
  st("Issue access","Time-limited badge and a named escort.","human","Maintenance planner","1 day","Cleared contractor","Access"),
  st("Permit if needed","Work in a live area needs a permit to work.","gate","Process control lead","1 day","Access","Permit"),
  st("Sign off","Work reviewed; access removed.","human","Facilities and office manager","1 day","Permit","Closed visit")]},
 {id:"ops_inspect",name:"Site safety inspection",module:"ops_fac",family:"fclt",owner:"Ruben Castillo",backup:"Joel Tran",trigger:"The monthly inspection schedule",metrics:["m_ops_safety"],entities:["work_order","config_item_site"],steps:[
  st("Schedule","Rooms and equipment by risk.","robot","Robot","Monthly","Inspection plan","Inspection list"),
  st("Inspect","Checklist with photos.","human","Facilities and office manager","3 days","Inspection list","Findings"),
  st("Raise work orders","Each finding becomes a work order with a due date.","robot","Robot","Immediate","Findings","Work orders"),
  st("Review","Open findings reported to the chief operating officer.","gate","Chief operating officer","Monthly","Work orders","Review record")]},
 {id:"ops_req2po",name:"Requisition to purchase order",module:"ops_scm",family:"supc",owner:"Alba Torres",backup:"Camille Ortega",trigger:"An approved requisition arrives",metrics:["m_ops_req2po","m_ops_contract"],entities:["requisition","purchase_order","core_company","budget_line"],steps:[
  st("Check the budget","Funds in the budget line.","robot","Robot","Instant","Requisition","Funded requisition"),
  st("Pick the source","Contract or catalog price first; quote only if none.","agent","Sourcing Agent","Instant","Funded requisition","Source choice"),
  st("Get quotes","Three quotes when no contract exists.","human","Buyer","3 days","Source choice","Quotes"),
  st("Approve over limit","Orders over the delegation limit need approval.","gate","Procurement lead","2 days","Quotes","Approved choice"),
  st("Send the purchase order","Order sent and receipt expected.","robot","Robot","Immediate","Approved choice","Purchase order")]},
 {id:"ops_supplier_onb",name:"Supplier onboarding and risk check",module:"ops_scm",family:"supc",owner:"Camille Ortega",backup:"Alba Torres",trigger:"A new supplier is proposed",metrics:["m_ops_supprisk"],entities:["core_company","contract"],steps:[
  st("Collect details","Legal name, tax form, bank details by the supplier.","human","Supplier","5 days","Proposal","Supplier record"),
  st("Check risk","Sanctions, financial health and security answers.","agent","Sourcing Agent","Instant","Supplier record","Risk findings"),
  st("Approve","High-risk suppliers need compliance.","gate","Procurement lead","3 days","Risk findings","Approved supplier"),
  st("Activate","Supplier available for purchase orders.","robot","Robot","Immediate","Approved supplier","Active supplier")]},
 {id:"ops_sourcing",name:"Quote and award",module:"ops_scm",family:"supc",owner:"Camille Ortega",backup:"Alba Torres",trigger:"A purchase over the quote threshold",metrics:["m_ops_contract"],entities:["purchase_order","contract","core_company"],steps:[
  st("Write the request","Needs, quantity, dates and scoring criteria.","human","Buyer","2 days","Requisition","Request for quote"),
  st("Collect and score","Compare quotes against the criteria.","agent","Sourcing Agent","1 day","Quotes","Scored quotes"),
  st("Award","Approver chooses; reason recorded.","gate","Procurement lead","3 days","Scored quotes","Award"),
  st("Contract","Contract review starts for awards over the limit.","human","Contracts paralegal","10 days","Award","Signed contract")]},
 {id:"ops_expedite",name:"Late delivery recovery",module:"ops_scm",family:"supc",owner:"Alba Torres",backup:"Camille Ortega",trigger:"A purchase order line passes its promised date",metrics:["m_ops_sotd"],entities:["purchase_order","goods_receipt"],steps:[
  st("Detect","Lines past their date with no receipt.","robot","Robot","Daily","Open purchase orders","Late lines"),
  st("Ask the supplier","Request a dated recovery plan.","agent","Sourcing Agent","Same day","Late lines","Recovery date"),
  st("Decide","Wait, split, or buy elsewhere.","human","Buyer","1 day","Recovery date","Decision"),
  st("Warn the receiver","Distribution plans labour for the new date.","robot","Robot","Immediate","Decision","Updated expected receipt")]},
 {id:"ops_run",name:"Production run release and close",module:"ops_plant",family:"plnt",owner:"Dmitri Kowal",backup:"Sofia Arenas",trigger:"A draft standard is ready to be proved",metrics:["m_ops_oee","m_ops_fpy"],entities:["production_run","asset","work_order"],steps:[
  st("Plan the run","Equipment, materials and test plan.","human","Plant operations manager","3 days","Draft standard","Run plan"),
  st("Check readiness","Equipment healthy, no open holds, permits in place.","agent","Plant Agent","Instant","Run plan","Readiness"),
  st("Release","Plant manager releases.","gate","Plant operations manager","1 day","Readiness","Released run"),
  st("Run and record","Operators run; yields and readings recorded.","human","Control room operator","Per run","Released run","Run record"),
  st("Close and report","Results go back to the standards committee.","robot","Robot","Immediate","Run record","Test report")]},
 {id:"ops_ncr",name:"Nonconformance and quality hold",module:"ops_plant",family:"plnt",owner:"Mei-Ling Zhou",backup:"Dmitri Kowal",trigger:"A test result is outside its limit",metrics:["m_ops_ncr","m_ops_fpy"],entities:["quality_hold","production_run"],steps:[
  st("Hold the batch","Automatic hold on the affected run.","robot","Robot","Instant","Out-of-limit result","Quality hold"),
  st("Find the cause","Evidence from readings, equipment and material.","human","Quality engineer","5 days","Quality hold","Cause"),
  st("Decide","Release, rework or scrap.","gate","Plant operations manager","2 days","Cause","Disposition"),
  st("Fix and verify","Corrective action; verify on the next run.","human","Quality engineer","10 days","Disposition","Closed report")]},
 {id:"ops_downtime",name:"Equipment downtime response",module:"ops_plant",family:"plnt",owner:"Sofia Arenas",backup:"Dmitri Kowal",trigger:"Equipment stops without a plan",metrics:["m_ops_downtime","m_ops_oee"],entities:["work_order","alert_event","asset"],steps:[
  st("Detect and log","The stop, the time and the alarm.","robot","Robot","Instant","Equipment signal","Downtime event"),
  st("Triage","Operator checks safe state; the agent suggests likely causes.","agent","Plant Agent","Instant","Downtime event","Likely cause"),
  st("Repair","Work order to maintenance.","human","Maintenance planner","Per priority","Likely cause","Repaired equipment"),
  st("Restart","Process control confirms safe restart.","gate","Process control lead","1 hour","Repaired equipment","Restart")]},
 {id:"ops_pilotrelease",name:"Pilot result release to standards",module:"ops_plant",family:"plnt",owner:"Dmitri Kowal",backup:"Mei-Ling Zhou",trigger:"A production run is closed",metrics:["m_ops_fpy"],entities:["production_run","quality_hold"],steps:[
  st("Review results","Compare with the draft standard's limits.","human","Quality engineer","3 days","Test report","Review"),
  st("Sign off","Plant manager signs the report.","gate","Plant operations manager","2 days","Review","Signed report"),
  st("Send to committee","Attach to the draft standard's ballot.","robot","Robot","Immediate","Signed report","Evidence for ballot")]},
 {id:"ops_alarm",name:"Alarm response and rationalization",module:"ops_ctrl",family:"ctrl",owner:"Sofia Arenas",backup:"Hugo Baptiste",trigger:"An alarm is raised, and monthly for nuisance alarms",metrics:["m_ops_alarm"],entities:["alert_event","alert_rule"],steps:[
  st("Raise and rank","Alarms ranked by consequence.","robot","Robot","Instant","Signal","Ranked alarm"),
  st("Respond","Operator acts on the alarm response sheet.","human","Control room operator","Per alarm","Ranked alarm","Response"),
  st("Review nuisance alarms","Monthly top-ten review.","agent","Control Agent","Monthly","Alarm history","Proposed limits"),
  st("Approve limit changes","Changes follow management of change.","gate","Process control lead","5 days","Proposed limits","Approved limits")]},
 {id:"ops_moc",name:"Management of change for control logic",module:"ops_ctrl",family:"ctrl",owner:"Sofia Arenas",backup:"Dmitri Kowal",trigger:"Someone wants to change a controller, limit or interlock",metrics:["m_ops_moc"],entities:["change_request","permit_to_work"],steps:[
  st("Request","What changes, why, and what could go wrong.","human","Requester","1 day","Idea","Change request"),
  st("Assess risk","Safety, quality and rollback.","agent","Control Agent","Instant","Change request","Risk assessment"),
  st("Approve","Process control lead and plant manager.","gate","Process control lead","3 days","Risk assessment","Approval"),
  st("Implement and test","Change made, tested, recorded.","human","Process control lead","Per change","Approval","Tested change"),
  st("Close","Drawings and training updated.","human","Process control lead","5 days","Tested change","Closed record")]},
 {id:"ops_permit",name:"Permit to work",module:"ops_ctrl",family:"ctrl",owner:"Sofia Arenas",backup:"Dmitri Kowal",trigger:"Work is planned in a live area",metrics:["m_ops_permit"],entities:["permit_to_work","work_order"],steps:[
  st("Request","Work, area, people and hazards.","human","Requester","Same day","Work order","Permit request"),
  st("Check isolation","Equipment is safe and isolated.","human","Control room operator","2 hours","Permit request","Isolation record"),
  st("Issue","Issuer and receiver both sign.","gate","Process control lead","1 hour","Isolation record","Issued permit"),
  st("Close","Work done, area handed back.","human","Control room operator","Same shift","Issued permit","Closed permit")]},
 {id:"ops_handover",name:"Shift handover",module:"ops_ctrl",family:"ctrl",owner:"Hugo Baptiste",backup:"Sofia Arenas",trigger:"A shift ends",metrics:["m_ops_handover"],entities:["alert_event","permit_to_work"],steps:[
  st("Draft the note","Open alarms, permits, abnormal readings and pending work, drafted from the shift log.","agent","Control Agent","Instant","Shift log","Draft note"),
  st("Edit and sign","Outgoing operator edits and signs.","human","Control room operator","30 minutes","Draft note","Signed note"),
  st("Acknowledge","Incoming operator acknowledges each item.","gate","Incoming operator","15 minutes","Signed note","Acknowledged handover")]}
];

/* ---------- people on the roles ---------- */
const PEOPLE={cco:"Lena Hargrove",dist:"Tomas Reyes",fac:"Ruben Castillo",scm:"Camille Ortega",plant:"Dmitri Kowal",proc:"Sofia Arenas"};
const FAMS=[{id:"cust",name:"Customers and commercial"},{id:"fulf",name:"Distribution and fulfillment"},{id:"fclt",name:"Facilities and maintenance"},{id:"supc",name:"Supply chain and sourcing"},{id:"plnt",name:"Pilot plant and quality"},{id:"ctrl",name:"Process control and safety"}];
G(()=>{if(W.LINKS&&LINKS.families)FAMS.forEach(x=>{if(!LINKS.families.some(y=>y.id===x.id))LINKS.families.push(x)})});

const DEFS={
 cco:{n:"CCO",who:"Chief commercial officer: sales, customers and members",role:"commercial",family:"decide",as:PEOPLE.cco,groups:["strat","money","people","my"],pin:["metrics","plat_proc","org_chart","svc_req"],kpis:["m_ops_pubrev","m_ops_csat","m_ops_case"],sugg:["Which customer cases are late?","How is publication revenue against plan?","Show refunds waiting for approval"]},
 dist:{n:"Distribution manager",who:"Gets every order out on the day promised",role:"fulfil",family:"operate",as:PEOPLE.dist,groups:["fix","help","plan","my"],pin:["plat_proc","metrics","svc_req","svc_guides"],kpis:["m_ops_otd","m_ops_invacc","m_ops_d2s"],sugg:["Which orders will ship late?","Where does stock differ from the count?","Show returns waiting"]},
 fac:{n:"Facilities lead",who:"Keeps buildings and equipment working",role:"fclt",family:"operate",as:PEOPLE.fac,groups:["fix","help","plan","my"],pin:["svc_req","metrics","plat_proc","svc_guides"],kpis:["m_ops_pm","m_ops_wo_age","m_ops_safety"],sugg:["Which maintenance is overdue?","Show work orders older than two weeks","Which inspections are missed?"]},
 scm:{n:"Procurement lead",who:"Buys what the Foundation needs at the best terms",role:"supply",family:"operate",as:PEOPLE.scm,groups:["money","plan","fix","my"],pin:["plat_proc","metrics","svc_req","bud_ven"],kpis:["m_ops_sotd","m_ops_req2po","m_ops_contract"],sugg:["Which suppliers are late?","What spend has no contract?","Show requisitions waiting for a quote"]},
 plant:{n:"Plant manager",who:"Runs the pilot plant where draft standards are proved",role:"plant",family:"operate",as:PEOPLE.plant,groups:["fix","plan","tech","my"],pin:["plat_proc","metrics","svc_req","svc_guides"],kpis:["m_ops_oee","m_ops_downtime","m_ops_fpy"],sugg:["Why did equipment stop this week?","Which batches are on hold?","Show open nonconformance reports"]},
 proc:{n:"Process control lead",who:"Keeps control systems safe, quiet and under change control",role:"control",family:"operate",as:PEOPLE.proc,groups:["fix","tech","plan","my"],pin:["itsm_chg","plat_proc","metrics","svc_req"],kpis:["m_ops_alarm","m_ops_moc","m_ops_permit"],sugg:["Which alarms are nuisance alarms?","Show open permits","Which control changes lack a record?"]}
};
const PANELS={
 cust:{t:"Customers and revenue",q:"Are buyers happy and are publications selling to plan?",go:"metrics",cta:"Open the numbers",lead:"m_ops_csat",rows:["m_ops_pubrev","m_ops_case"]},
 fulfil:{t:"Orders and stock",q:"Is every order leaving on time, and is stock right?",go:"plat_proc",cta:"Open processes",lead:"m_ops_otd",rows:["m_ops_invacc","m_ops_d2s"]},
 fclt:{t:"Buildings and maintenance",q:"Is maintenance on time and is anything unsafe?",go:"svc_req",cta:"Open requests",lead:"m_ops_pm",rows:["m_ops_wo_age","m_ops_safety"]},
 supply:{t:"Suppliers and spend",q:"Are suppliers delivering and is spend under contract?",go:"plat_proc",cta:"Open processes",lead:"m_ops_sotd",rows:["m_ops_contract","m_ops_supprisk"]},
 plantp:{t:"Plant performance",q:"Is the pilot plant running and are batches right?",go:"metrics",cta:"Open the numbers",lead:"m_ops_oee",rows:["m_ops_downtime","m_ops_fpy"]},
 quality:{t:"Quality holds",q:"Which batches are held and how old are the reports?",go:"plat_proc",cta:"Open processes",lead:"m_ops_ncr",rows:["m_ops_fpy"]},
 ctrlp:{t:"Control room",q:"Are alarms under control and are changes recorded?",go:"itsm_chg",cta:"Open changes",lead:"m_ops_alarm",rows:["m_ops_moc","m_ops_permit"]},
 handover:{t:"Shift handover",q:"Is every item handed over and acknowledged?",go:"plat_proc",cta:"Open processes",lead:"m_ops_handover",rows:["m_ops_permit"]}
};
const PROFILES={
 cco:{kind:"exec",art:"pages",pal:["#3a2a12","#c98a2e","#f7dfa6"],sub:"Chief commercial officer",top:[["m_ops_pubrev","Revenue against plan"],["m_ops_csat","Customer satisfaction"],["m_ops_case","Days to resolve a case"]],care:["cust","cash","fulfil"],dec:{want:/refund|price|customer|quote|discount|order|member|sponsor/i,amt:25000}},
 dist:{kind:"line",art:"signal",pal:["#2b3d24","#7fae52","#f0d58a"],sub:"Distribution and fulfillment manager",top:[["m_ops_otd","Orders shipped on time"],["m_ops_invacc","Stock count accuracy"],["m_ops_d2s","Hours from order to shipped"]],care:["fulfil"],work:true},
 fac:{kind:"line",art:"timeline",pal:["#3b3a2a","#9aa86a","#f1d99a"],sub:"Facilities and office manager",top:[["m_ops_pm","Maintenance on time"],["m_ops_wo_age","Age of open work orders"],["m_ops_safety","Safety inspections complete"]],care:["fclt"],work:true},
 scm:{kind:"line",art:"ledger",pal:["#12404f","#3a9aa5","#f1cf86"],sub:"Procurement lead",top:[["m_ops_sotd","Supplier on-time delivery"],["m_ops_req2po","Days to purchase order"],["m_ops_contract","Spend under contract"]],care:["supply"],work:true},
 plant:{kind:"line",art:"network",pal:["#3a2418","#c4693a","#f2c490"],sub:"Plant operations manager",top:[["m_ops_oee","Equipment effectiveness"],["m_ops_downtime","Unplanned downtime hours"],["m_ops_fpy","Batches right first time"]],care:["plantp","quality"],work:true},
 proc:{kind:"line",art:"signal",pal:["#2a2230","#8a6fb0","#efd3a0"],sub:"Process control lead",top:[["m_ops_alarm","Alarms per operator hour"],["m_ops_moc","Changes with a record"],["m_ops_permit","Permits closed on the day"]],care:["ctrlp","handover"],work:true}
};
const LVL={cco:"exec",dist:"manager",fac:"manager",scm:"manager",plant:"director",proc:"manager"};
const LENS={cco:"ceo",dist:"coo",fac:"coo",scm:"coo",plant:"coo",proc:"coo"};
const ROLEFAM={commercial:["Customers and commercial"],fulfil:["Distribution and fulfillment"],fclt:["Facilities and maintenance"],supply:["Supply chain and sourcing"],plant:["Pilot plant and quality"],control:["Process control and safety"]};
/* least privilege: operations roles start as employees; proc also runs management of change. A dedicated operations, procurement and commercial role is a follow-up for the permission model. */
const PROLES={cco:["employee"],dist:["employee"],fac:["employee"],scm:["employee"],plant:["employee"],proc:["change_manager","employee"]};

const done={ent:{},mod:{},proc:{},persona:false,wire:false};
function wirePersona(){
 if(done.persona)return true;
 if(!(W.R15D&&R15D.addPersona&&typeof PERSONAS!=="undefined"&&W.R21H&&W.R18&&R18.LV&&R18.ROLE_FAM))return false;
 G(()=>{if(W.PERM&&PERM.personaRoles){Object.keys(PROLES).forEach(k=>{PERM.personaRoles[k]=PROLES[k].slice()});Object.assign(PERM.personaUser,PEOPLE)}});
 Object.keys(DEFS).forEach(k=>R15D.addPersona(k,DEFS[k]));
 Object.assign(R21H.panels,PANELS);Object.assign(R21H.profiles,PROFILES);
 Object.assign(R18.LV,LVL);Object.assign(R18.LENS_OF,LENS);Object.assign(R18.ROLE_FAM,ROLEFAM);
 G(()=>{if(window.HEROMAP)Object.assign(HEROMAP,{cco:{f:"street-dusk"},dist:{f:"warehouse"},fac:{f:"campus-hill"},scm:{f:"port"},plant:{f:"steel-mill"},proc:{f:"refinery"}})});
 /* keep the executive roles together and the operations roles after the service desk */
 G(()=>{const ORDER=["exec","ceo","cco","cfo","coo","chro","ciso","caio","clo","board","portfolio","audit","pm","ops","dist","fac","scm","plant","proc","change","arch","admin","fin","emp","newhire","guest"];
  const ks=ORDER.filter(k=>PERSONAS[k]).concat(Object.keys(PERSONAS).filter(k=>ORDER.indexOf(k)<0));const keep=Object.assign({},PERSONAS);ks.forEach(k=>{delete PERSONAS[k]});ks.forEach(k=>{PERSONAS[k]=keep[k]})});
 done.persona=true;return true}
function wire(){
 wirePersona();
 if(!(W.MODMAP&&MODMAP.addModule&&G(()=>MODMAP.modules.length,0)&&W.PROCLIB&&PROCLIB.addProcess))return false;
 let all=true;
 if(W.DATAMODEL&&DATAMODEL.register){Object.keys(ENT).forEach(k=>{if(!done.ent[k]){const e=ENT[k];const r=G(()=>DATAMODEL.register(k,Object.assign({domain:"operations",status:"proposed"},e)),null);if(r!==null)done.ent[k]=1;else all=false}})}else all=false;
 MODS.forEach(m=>{if(!done.mod[m.id]){const r=G(()=>MODMAP.addModule(m),null);if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))done.mod[m.id]=1;else all=false}});
 if(!MODS.every(m=>done.mod[m.id]))return false;
 PR.forEach(p=>{if(!done.proc[p.id]){const r=G(()=>PROCLIB.addProcess(Object.assign({model:"cmmi",std:["bpmn","iso9001"],inputs:[p.steps[0].in],outputs:[p.steps[p.steps.length-1].out]},p)),null);if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))done.proc[p.id]=1;else{all=false;done.err=done.err||{};done.err[p.id]=r&&r.warnings}}});
 if(all&&!done.wire){done.wire=true;G(()=>MODMAP.refresh&&MODMAP.refresh())}
 return all&&done.persona}
W.R24OPS={wire,metrics:M,processes:PR,modules:MODS,entities:ENT,done,people:PEOPLE};
[200,600,1200,2500,5000,9000].forEach(t=>setTimeout(()=>{try{if(!(done.wire&&done.persona))wire()}catch(e){console.error("r24 ops",e)}},t));
wirePersona();
})();
