/* mod_plat_modmap: the Module map. Takes over plat_map (Master process flow). Every module, every push and pull of data between them,
   pair paths, journeys, a matrix and a coverage audit. Reads window.PLAT, window.LINKS and PROC lazily because it loads before the registry. */
(function(){
S.mm=S.mm||{sel:"itsm_inc",tab:"pulls",pair:null,jny:null,showPush:true,showPull:true,byMode:false,blast:false,insp:true,view:null,edge:null,q:""};
const MM=S.mm,E=esc;
const OLD=(typeof _R!=="undefined"&&_R["plat_map"])||null;
const ICON="M4 6h5v4H4zM15 6h5v4h-5zM9.5 8h5M17.5 10v6M4 16h5v4H4zM15 16h5v4h-5zM9 18h6";
/* ---------- bands ---------- */
const BANDS=[["str","Strategy and portfolio"],["dem","Demand and projects"],["mon","Money and contracts"],["bld","Build and release"],["ops","Service operations"],["inf","Infrastructure and CMDB"],["obs","Observability and automation"],["ppl","People and skills"],["kai","Knowledge and AI"],["plt","Platform and governance"]];
const BI={};BANDS.forEach((b,i)=>BI[b[0]]=i);
/* ---------- module curation: id | short name | band | accountable role | aliases | extra reads | extra writes ---------- */
const CUR=`exe_strat|Strategy alignment|str|Chief strategy officer|strategy,objectives,okr,objective||
exe_dash|Executive dashboard|str|CIO office|executive dashboard,exec dashboard,dashboard||
exe_risk|Risk heat map|str|Risk manager|risk,risks,risk heat map,monte carlo||
exe_mat|Maturity models|str|Process governance lead|maturity,maturity models||
port|Demand and priorities|str|Portfolio office lead|demand,priorities,portfolio,intake,prioritization|business_service|
bud_ben|Benefits realization|str|PMO director|benefits,benefit,benefits realization|project|
ppm_proj|Projects|dem|PMO director|project,projects,ppm||
ims|Master schedule|dem|PMO director|master schedule,schedule,milestone,milestones|project_task|project_task
ppm_wbs|WBS and tasks|dem|Project managers|wbs,work breakdown,tasks,task||
ppm_raid|RAID log|dem|PMO director|raid,raid log,issues log|incident,problem_record|
bud_over|Budgets|mon|Finance controller|budget,budgets,money,cost,spend|incident,change_request,invoice|cost_allocation
bud_model|Financial model|mon|Finance controller|financial model,forecast,reforecast|cost_allocation|
bud_doa|Delegation of authority|mon|CFO office|delegation of authority,doa,approval limits,authority|person|change_approval_policy
inv|Invoices|mon|Accounts payable lead|invoice,invoices,accruals,accrual||
bud_ven|Vendors and contracts|mon|Procurement lead|vendor,vendors,contracts,procurement||
ppm_sow|SOW and contracts|mon|General counsel delegate|sow,contract,statement of work,contract analyzer||
tbm_model|Cost transparency|mon|TBM office|tbm,cost transparency,technology business management|cost_allocation,business_service,cmdb_ci|cost_allocation
itom_fin|Cloud cost (FinOps)|mon|FinOps lead|finops,cloud cost,cloud|cmdb_ci|cost_allocation
agile_board|Sprints and backlogs|bld|Scrum masters|sprint,sprints,backlog,agile board,boards,agile||
agile_art|Release trains|bld|Release train engineer|release train,release trains,art,safe||
dev_pipe|Delivery pipeline|bld|Platform engineering lead|pipeline,delivery pipeline,deploy,deployment,ci/cd|pull_request,release,change_request|pull_request
itsm_rel|Releases|bld|Release manager|release,releases||
itom_dev|Environments and DORA|bld|Platform engineering lead|dora,environments|release,incident,change_request|
itsm_mi|Major incident|ops|Major incident manager|major incident,major incidents|incident,oncall_shift|incident
itsm_inc|Incidents|ops|Service desk manager|incident,incidents||
itsm_prb|Problems|ops|Problem manager|problem,problems,known error,known errors||
itsm_chg|Changes|ops|Change manager|change,changes,change management||
obs_std|Standard changes|ops|Change manager|standard change,standard changes,standard change catalog|change_request|standard_change
svc_portal|Self-service portal|ops|Service desk manager|portal,self-service,self service|catalog_item|request_item
svc_cat|Service catalog|ops|Service catalog manager|catalog,service catalog||
svc_req|Requests|ops|Service desk manager|request,requests,fulfillment||
svc_sla|SLAs|ops|Service level manager|sla,slas,olas,xla||
svc_360|Service 360|ops|Service portfolio manager|service 360,service portfolio,services,business service|business_service,service_offering,cmdb_rel_ci|business_service
itom_cmdb|CMDB|inf|Configuration manager|cmdb,configuration,ci,cis||
itom_graph|Dependency views|inf|Configuration manager|dependency,dependencies,topology,dependency views|cmdb_rel_ci,cmdb_ci|
itom_disc|Discovery|inf|Configuration manager|discovery|cmdb_ci|cmdb_ci
itom_health|CMDB health|inf|Configuration manager|cmdb health,data quality|cmdb_ci|
svc_asset|Assets and licenses|inf|Asset manager|asset,assets,licenses,software licenses|contract,invoice|asset
itom_evt|Event management|obs|Operations lead|event,events,alerts,event management||
itom_slo|SLOs|obs|Reliability lead|slo,slos,observability,error budget|metric_series,business_service,incident|slo,synthetic_check
obs_dash|Dashboards and metrics|obs|Reliability lead|dashboards,metrics,monitoring||
itom_run|Runbooks|obs|Operations lead|runbook,runbooks,automation||
ppl_org|Directory|ppl|Head of People Operations|directory,org chart,people||
ppl_cap|Resource planning|ppl|Resource manager|resource planning,capacity,resources|person,project,skill_claim|
svc_skills|Skills|ppl|Head of People Operations|skills,skill||
svc_oncall|On-call|ppl|Operations lead|on-call,on call,oncall,escalation||
kcs_home|Knowledge|kai|Knowledge manager|knowledge,knowledge management,articles,kb||
kcs_ask|Ask the knowledge base|kai|Knowledge manager|ask,search,ask the knowledge base|business_service|
kcs_skills|Agent skills|kai|AI platform lead|agent skills||
adm_gate|AI gateway|kai|AI platform lead|ai gateway,gateway,tokens,tokenomics||cost_allocation
tower|AI control tower|kai|AI governance lead|control tower,ai control tower|alert_event,runbook_execution|false_positive_feedback
chat_home|Chat and agents|kai|AI platform lead|chat,agents|incident,request_item|
plat_reg|Platform registry|plt|Data council chair|registry,platform registry,entities||
plat_fab|Integration fabric|plt|Integration lead|fabric,integration,integrations,connectors||
plat_debt|Debt ledger|plt|Platform lead|debt,debt ledger,technical debt||
plat_gate|Citizen apps|plt|Platform lead|citizen apps,citizen,citizen gate||
flw_appr|Approvals inbox|plt|Process governance lead|approvals,approval,workflow,approvals inbox|catalog_item|
flw_design|Workflow designer|plt|Process governance lead|workflow designer,workflows|incident,change_request|
adm_sec|Admin and security|plt|Security lead|security,admin,access,rbac||
adm_audit|Audit and compliance|plt|Compliance lead|audit,compliance||`;
/* ---------- flows: from>to | data | entity.fields (; separated, - for none) | trigger | mode e/b/h | why ---------- */
const FLOWS=`itom_cmdb>itsm_inc|Affected CI, owner and support group|cmdb_ci.name,owned_by,support_group,business_criticality|Caller names a service or an alert links a CI|e|Routes the ticket to the team that owns the CI without a phone call.
svc_360>itsm_inc|Business service, owner and tier|business_service.name,service_owner,tier|Service picked on the incident form|e|Tier and service owner set the priority and decide who is told.
ppm_proj>itsm_inc|Affected project and its manager|project.id,name,manager,finish|The service has a live project depending on it|e|Shows which project deadline is at risk before anyone asks.
svc_sla>itsm_inc|SLA clock, goal and schedule|sla_definition.target,goal,schedule|Priority is set or changes|e|Starts the response and resolution timers with the right targets.
svc_oncall>itsm_inc|Current on-call engineer and tier|oncall_shift.rota,tier,person,starts,ends|Priority 1 or 2 raised|e|Pages the person on shift instead of searching a spreadsheet.
itsm_prb>itsm_inc|Known error and workaround|problem_record.number,workaround,root_cause|Incident text matches a known error|e|Lets the resolver apply the documented workaround in minutes.
itom_run>itsm_inc|Matching runbook and its last result|standard_change.id,name,automation_level;runbook_execution.result|Incident category matches a runbook|e|Offers the fix that already worked, with its success history.
itom_evt>itsm_inc|Correlated alert group and root-cause CI|correlation_group.id,root_cause_ci,severity;alert_event.number,service|Alert group crosses the incident threshold|e|Opens one incident for a storm of alerts instead of dozens.
kcs_home>itsm_inc|Suggested knowledge article|knowledge_article|Resolver opens the incident|e|Puts the best article beside the ticket.
ppl_org>itsm_inc|Caller, role, team and manager|person.name,role,team,manager|Caller selected|e|Applies VIP handling and contacts the right manager.
svc_skills>itsm_inc|Assignment suggestions by skill|skill_claim.person,skill,level|Incident assigned to a group|e|Suggests the person who can fix it, not just the group.
chat_home>itsm_inc|Incident created from chat|incident.short_description,service,caller|User reports a problem to an agent|e|Lets people report in plain words and still get a clean ticket.
itsm_chg>itsm_inc|Recent changes on the affected CI|change_request.number,ci,end_date,close_code|Incident opened on a CI|e|Shows the most likely culprit change.
svc_portal>itsm_inc|Incident reported from the portal|incident.short_description,caller,service|Employee submits a form|e|Gives the desk a structured ticket with the service filled in.
itsm_inc>bud_over|Downtime cost and lost hours (cost of poor quality)|cost_allocation.from,to,driver,amount;incident.service,business_duration|Incident resolved|e|Charges the outage to the service so budget owners see what failure costs.
itsm_inc>ppm_raid|Risk or issue for the affected project|raid_item.type,project,probability,impact,exposure|Priority 1 or 2 touches a project service|e|Adds the issue to the project RAID log without retyping.
itsm_inc>ims|Possible milestone slip|project_task.wbs,planned_finish,milestone|Outage uses up the milestone buffer|e|Warns the schedule owner before the date moves.
itsm_inc>itsm_prb|Problem record candidate|problem_record.short_description,service,repeat_incidents,users_affected|Third repeat in 30 days or resolver choice|e|Turns repeat failures into root-cause work.
itsm_inc>itsm_chg|Request for change to fix|change_request.type,service,ci,risk|Resolver chooses Raise change|h|Keeps the fix under change control instead of an ad hoc edit.
itsm_inc>kcs_home|Knowledge draft from resolution notes|knowledge_article|Resolved with no matching article|e|An AI agent drafts the article while details are fresh.
itsm_inc>svc_sla|Task SLA result and breach flag|task_sla.definition,task,has_breached,business_duration,stage|Each state change and at resolve|e|Keeps attainment and service credits accurate.
itsm_inc>svc_360|Service impact and SLA breach|business_service.availability_30d,tier;incident.service,priority|Priority 1 or 2 opened or closed|e|Service owners see outage minutes on the service page.
itsm_inc>itsm_mi|Escalation to major incident|incident.number,priority,service,impact|Duty manager declares|h|Moves a serious incident onto the major incident bridge.
itsm_inc>svc_oncall|Page acknowledgement and override|oncall_shift.person,tier,override|Page not acknowledged in 5 minutes|e|Escalates to the next tier automatically.
itsm_inc>exe_dash|Open priority 1 and 2, time to restore|incident.priority,state,opened_at,resolved_at|Every 15 minutes|b|Executives see service health without asking.
itsm_inc>itom_cmdb|CI status after a fault|cmdb_ci.operational_status|Incident resolved with a CI fault|e|Keeps the CI record true and flags fragile CIs.
itsm_inc>itom_slo|Outage minutes against the error budget|slo.service,budget_left;incident.business_duration|Incident resolved|e|Burns the right error budget.
itsm_inc>exe_risk|Operational risk exposure|raid_item.exposure;incident.priority|Daily roll up|b|Feeds the enterprise risk heat map.
itsm_inc>chat_home|War room thread and live notes|-|Priority 1 raised|e|Opens one shared channel so updates are not scattered.
itom_cmdb>itsm_prb|CI history and relationships|cmdb_ci.name,lifecycle_stage;cmdb_rel_ci.parent,child,type|Problem record opened|e|Shows what else shares the failing CI.
itom_graph>itsm_prb|Dependency path to a shared cause|cmdb_rel_ci.parent,child,type|Analyst opens the impact view|h|Finds the common upstream CI behind several incidents.
itom_evt>itsm_prb|Alert group and root-cause hypothesis|correlation_group.root_cause_ci,reason,alert_count|Alert group linked to a problem|e|Gives the analyst evidence for the root cause.
itsm_chg>itsm_prb|Recent changes on the same CI|change_request.number,ci,end_date,close_code|Problem record opened|e|Tests whether a recent change caused the problem.
svc_360>itsm_prb|Service, owner and tier|business_service.name,service_owner,tier|Problem record opened|e|Ties the problem to the accountable service owner.
kcs_home>itsm_prb|Earlier root cause analyses|knowledge_article|Analyst searches similar problems|e|Reuses past root cause work.
itsm_prb>itsm_chg|Permanent fix as a change|change_request.type,service,ci,risk|Root cause confirmed|h|Moves the permanent fix into change control.
itsm_prb>kcs_home|Known error article|knowledge_article;problem_record.workaround|Known error published|e|Makes the workaround findable by everyone.
itsm_prb>port|Demand for a permanent fix|demand_request.title,service,cost,stage|Fix is too big for a change|h|Sends fixes that need funding into prioritization.
itsm_prb>ppm_raid|Risk of recurrence|raid_item.type,probability,impact|Known error without a fix date|e|Records the standing risk against the affected project.
itsm_prb>svc_360|Open problems and repeat incidents|problem_record.service,state,repeat_incidents|Daily|b|Shows service health beyond uptime.
itsm_prb>bud_over|Cost of recurring incidents for the business case|cost_allocation.driver,amount;problem_record.repeat_incidents|Fix proposed|e|Gives the funding decision a real cost of doing nothing.
itsm_prb>itom_health|CI facts found wrong or stale|cmdb_ci.last_discovered,owned_by|Root cause traced to bad data|e|Sends CMDB data fixes to the health queue.
itsm_prb>agile_board|Bug from a known error|user_story.kind,severity,feature|Fix agreed with engineering|h|Puts the product defect in the right team backlog.
ppm_wbs>itsm_chg|Linked project task and milestone|wbs_line.wbs,n,ms,es,ef|Change linked to a task|e|Shows which task and date depend on this change.
itsm_rel>itsm_chg|Release package and readiness|release.number,version,planned_date,readiness,exit_criteria_pass|Release scheduled|e|Bundles changes under one release record.
bud_over>itsm_chg|Budget line and remaining funds|project.budget,actual_cost;budget_line|Change estimate above its threshold|e|Stops a change that has no money behind it.
bud_doa>itsm_chg|Approval limits and approvers|change_approval_policy.min_cost,approvers,quorum,sla_hours|Risk and cost computed|e|Chooses the right approvers for the amount.
itom_cmdb>itsm_chg|Affected CIs and service|cmdb_ci.name,class,business_criticality,support_group|CI added to the change|e|Scopes the risk by what the CI supports.
itom_graph>itsm_chg|Downstream impact of the CI|cmdb_rel_ci.parent,child,type|Risk assessment opened|e|Lists every service that could be hit.
itom_evt>itsm_chg|Maintenance windows and open alerts|maintenance_window.name,ci,schedule,mode|Schedule picked|e|Prevents a change during an open alert or a conflicting window.
svc_360>itsm_chg|Service tier and freeze calendar|business_service.name,tier|Service chosen|e|Applies stricter rules to tier 1 services.
obs_std>itsm_chg|Pre-approved template|standard_change.id,name,risk,pre_approval|Standard change selected|e|Skips committee review for changes that have proven safe.
itom_slo>itsm_chg|Error budget remaining|slo.service,budget_left|Change submitted for a tier 1 service|e|Holds risky change when the budget is already spent.
svc_oncall>itsm_chg|Implementer availability|oncall_shift.person,starts,ends;time_off.person,from,to|Window chosen|e|Avoids a window when the implementer is away.
itom_fin>itsm_chg|Rightsizing as a standard change|standard_change.id,name,risk|Saving opportunity approved|h|Turns a cloud saving into a controlled change.
itsm_prb>itsm_chg: skipped
itsm_chg>bud_over|Actual cost of the change|cost_allocation.from,to,amount|Change closed|e|Charges the real cost back to the budget line.
itsm_chg>ppm_proj|Schedule impact and date slip|project.finish,spi|Change completed late or early|e|Moves project dates with evidence.
itsm_chg>ims|Milestone effect|project_task.planned_finish,milestone|Change window moved|e|The master schedule shows slips caused by change.
itsm_chg>dev_pipe|Approved deployment record|change_request.number,state,start_date,end_date|Change approved|e|Lets the pipeline deploy only inside an approved window.
itsm_chg>itom_cmdb|CI updates after implementation|cmdb_ci.lifecycle_stage,operational_status;cmdb_rel_ci.type|Change closed successful|e|Keeps the CMDB true after every change.
itsm_chg>flw_appr|Approval request|change_request.number,risk,approval;change_approval_policy.approvers|Risk assessed|e|Routes the change to its approvers.
itsm_chg>itsm_rel|Change state for the release|release.state;change_request.state|Change state changes|e|Release readiness reflects the state of its changes.
itsm_chg>itom_evt|Maintenance window to quiet alerts|maintenance_window.ci,schedule,change|Change scheduled|e|Stops planned work from paging anyone.
itsm_chg>kcs_home|Post-implementation notes|knowledge_article;change_request.close_code|Change closed|e|Captures what changed and how it was verified.
itsm_chg>exe_dash|Change success rate and failures|change_request.close_code,type|Daily|b|Executive view of change quality.
itsm_chg>svc_360|Change history for the service|change_request.service,close_code|Daily|b|Shows how unstable a service is.
itsm_chg>obs_std|Repeated normal changes to promote|standard_change.name,risk,success_rate;change_request.type|Monthly review|b|Finds routine changes that should become pre-approved.
itsm_chg>itom_dev|Change failure data for DORA|change_request.close_code,end_date|Change closed|e|Feeds the change failure rate.
itsm_chg>svc_oncall|Implementer on standby|oncall_shift.person,starts,ends|Change window approved|e|Books on-call cover for risky windows.
svc_oncall>itsm_mi|Bridge roster|oncall_shift.rota,tier,person|Major incident declared|e|Gets the right responders onto the bridge.
svc_360>itsm_mi|Affected services, users and tier|business_service.name,tier,users|Major incident declared|e|Sizes the customer impact in minutes.
chat_home>itsm_mi|Bridge notes and decisions|-|During the major incident|e|Keeps a time-stamped record without a scribe.
itsm_mi>chat_home|Status updates for the war room|-|Every update|e|One shared channel for responders and stakeholders.
itsm_mi>bud_over|Major incident cost|cost_allocation.driver,amount|Major incident closed|e|Records the full cost of the outage.
itsm_mi>exe_dash|Executive status|incident.priority,service,state|Declared and at each update|e|Gives executives one place to follow instead of calling.
itsm_mi>itsm_prb|Mandatory problem record|problem_record.short_description,service|Major incident closed|e|Every major incident gets a root cause review.
itsm_mi>svc_sla|Breach evidence|task_sla.has_breached,business_duration|Major incident closed|e|Supplies the downtime that decides credits.
itsm_mi>exe_risk|Exposure raised|raid_item.exposure,type|Impact above the risk appetite|e|Lets the risk manager see enterprise exposure.
itsm_mi>ppm_proj|Projects blocked by the outage|project.id,status|Declared|e|Warns project managers whose work depends on the service.
svc_360>svc_cat|Offering, owner and support group|service_offering.name,owned_by,support_group|Item published|e|Every catalog item hangs off a managed offering.
bud_doa>svc_cat|Approval rules by price|catalog_item.price,approvals_required|Item price changes|e|Sets who must approve an item by cost.
svc_cat>svc_portal|Published items and prices|catalog_item.number,name,category,price,visible_to|Item published|e|The portal shows only what the person may order.
svc_cat>svc_req|Fulfillment flow and steps|catalog_item.fulfillment_flow,sla_hours;fulfillment_step.step,type,target_hours|Request created|e|Tells the fulfillment team the steps and times.
svc_cat>svc_sla|Target hours per item|catalog_item.sla_hours|Item published or changed|e|Each item gets its own SLA target.
svc_cat>flw_appr|Approval rule per item|catalog_item.approvals_required|Request needs approval|e|Routes the request to the right approvers.
flw_design>svc_cat|Fulfillment flow templates|catalog_item.fulfillment_flow|Flow published|e|Catalog items reuse a designed flow.
svc_portal>svc_cat|Searches with no matching item|catalog_item.name,category|Weekly|b|Shows which new items to publish.
svc_portal>svc_req|Request submitted|request_item.cat_item,requested_for,state|Employee submits|e|Starts fulfillment with the form answers.
kcs_ask>svc_portal|Deflection answers|knowledge_article|Employee types a question|e|Answers many questions before a ticket exists.
kcs_home>svc_portal|Articles in portal search|knowledge_article|Article published|e|Self-service finds the same articles agents use.
svc_portal>kcs_home|Searches with no answer|knowledge_article|Daily|b|Tells knowledge managers what to write next.
svc_req>flw_appr|Approval request|request_item.number,price,stage|Item needs approval|e|Routes the request and waits for a decision.
flw_appr>svc_req|Approval decision|request_item.state,stage|Approver decides|e|Releases or stops fulfillment.
ppl_org>svc_req|Requester, manager and team|person.name,manager,team;request_item.requested_for|Request created|e|Shows who the request is for and who approves.
svc_asset>svc_req|Stock and entitlement|asset.class,lifecycle,model|Hardware or software item chosen|e|Tells the requester what is in stock.
svc_req>svc_asset|Asset assigned to the person|asset.asset_tag,assigned_to,request|Request fulfilled|e|Records who holds the asset.
svc_req>svc_sla|Request timer start and stop|task_sla.definition,task,stage,has_breached|Each stage|e|Measures fulfillment against the item target.
svc_req>bud_over|Chargeback for fulfilled items|cost_allocation.from,to,driver,amount;request_item.price|Request fulfilled|e|Charges the cost to the requesting team.
svc_req>itom_cmdb|New CI created by fulfillment|cmdb_ci.name,class,owned_by|Server or software delivered|e|Every delivered item lands in the CMDB with an owner.
svc_req>ppl_org|Joiner, mover and leaver progress|person.name,team,manager|Onboarding request completes|e|Marks the person as ready in the directory.
chat_home>svc_req|Request raised in chat|request_item.cat_item,requested_for|User asks an agent|e|Lets people order in plain words.
svc_req>kcs_home|Steps that keep repeating|knowledge_article|Same request three times in a week|e|Suggests an article or an automation.
bud_ven>svc_sla|Vendor underpinning contract terms|contract.id,vendor,end;sla_definition.target|Contract signed or renewed|e|Vendor terms set the internal SLA limits.
ppm_sow>svc_sla|SLA clauses from the contract|contract_line.clause,measure,target,sla_link|Contract analysis approved|e|Turns contract promises into measured SLAs.
itom_slo>svc_sla|Measured availability for attainment|slo.service,sli,budget_left|Daily|b|SLA attainment uses measured data, not estimates.
svc_sla>svc_360|SLA attainment and breaches|task_sla.has_breached;sla_definition.goal|Hourly|b|Service owners see attainment beside cost.
svc_sla>bud_ven|Vendor SLA miss and credit due|contract.id,vendor;task_sla.has_breached|Breach on a vendor-owned task|e|Starts the service credit claim.
svc_sla>exe_dash|Attainment and breaches|task_sla.business_percentage,has_breached|Daily|b|Shows service levels to executives.
svc_sla>svc_oncall|Breach warning|oncall_shift.tier|80 percent of time used|e|Escalates before the breach, not after.
svc_sla>bud_over|Service credits owed or earned|cost_allocation.amount;contract.value|Month end|b|Credits reduce the bill.
svc_sla>itsm_mi|Clock for the major incident|task_sla.stage,planned_end_time|Major incident declared|e|Shows how long until the breach.
itom_cmdb>svc_360|Service composition|cmdb_rel_ci.parent,child,type;business_service.name|CI or relationship changes|e|Builds the service map from true relationships.
itom_slo>svc_360|SLO status|slo.service,objective,budget_left|Hourly|b|Shows reliability next to cost and risk.
bud_over>svc_360|Cost per service|business_service.monthly_cost|Monthly close|b|Makes cost a property of the service.
ppm_proj>svc_360|Projects that change or retire the service|project.id,name,status;business_service.name|Project linked to a service|e|Shows what is changing the service next.
exe_mat>svc_360|Service maturity|business_service.maturity;maturity_capability.cur,t1|Quarterly|b|Shows how well managed each service is.
svc_360>tbm_model|Service as a cost object|business_service.name,monthly_cost,users|Monthly|b|Lets cost transparency price services.
svc_360>exe_dash|Service health|business_service.availability_30d,tier|Hourly|b|Executives see the services that matter.
svc_360>exe_mat|Service data for maturity scoring|business_service.maturity,availability_30d|Quarterly|b|Maturity scores use real service data.
svc_360>port|Lifecycle trigger for demand|demand_request.service,objective|Service reaches end of life|e|Starts replacement demand before the service fails.
svc_360>kcs_ask|Service context for answers|business_service.name,service_owner,tier|Question mentions a service|e|Answers say who owns the service and how critical it is.
svc_360>itom_slo|Service targets|business_service.availability_30d,tier|Service changed|e|Defaults SLO targets from the service tier.
itom_disc>itom_cmdb|Discovered CIs and attributes|cmdb_ci.name,class,environment,operational_status,last_discovered|Discovery run|b|Keeps hardware and cloud facts current without typing.
svc_asset>itom_cmdb|Asset to CI link|asset.asset_tag,class;cmdb_ci.name|Asset received|e|Ties finance assets to technical CIs.
plat_fab>itom_cmdb|Cloud and identity inventory|cmdb_ci.name,class,environment,owned_by|Hourly sync|b|Brings external inventory into one CMDB.
itom_health>itom_cmdb|Remediation tasks|cmdb_ci.owned_by,last_discovered,lifecycle_stage|Weekly|b|Sends stale CI records back to their owners.
itom_cmdb>itom_graph|Relationships between CIs|cmdb_rel_ci.parent,child,type,source|CI or relationship changes|e|Draws dependencies from the same source of truth.
itom_cmdb>itom_evt|CI context for alerts|cmdb_ci.name,class,business_criticality|Alert arrives|e|Tells the operator how critical the CI is.
itom_cmdb>tbm_model|CI cost pools|cmdb_ci.class,environment,business_criticality|Monthly|b|Lets TBM allocate infrastructure cost.
itom_cmdb>itom_health|CI records to score|cmdb_ci.last_discovered,owned_by|Nightly|b|Measures completeness and freshness.
itom_cmdb>itom_fin|Owner and tags for cloud resources|cmdb_ci.owned_by,environment|Hourly|b|Lets FinOps charge cloud spend to an owner.
itom_cmdb>obs_dash|CI list for metric binding|cmdb_ci.name,class|CI added|e|Dashboards attach metrics to real CIs.
itom_cmdb>itom_disc|Known CIs for reconciliation|cmdb_ci.name,class,last_discovered|Discovery run|b|Lets discovery match instead of duplicating.
itom_evt>itom_disc|Unknown hosts seen in alerts|alert_event.ci,service|Alert for an unknown CI|e|Triggers a scan for CIs nobody recorded.
adm_sec>itom_disc|Scan credentials|-|Credential rotation|e|Discovery uses vaulted credentials, never stored ones.
plat_fab>itom_disc|Cloud account connections|connector|Connector added|e|Points discovery at new cloud accounts.
itom_graph>itom_evt|Topology for correlation|cmdb_rel_ci.parent,child|CMDB changes|e|Lets alerts be grouped by shared parents.
itom_graph>svc_360|Service map|cmdb_rel_ci.parent,child,type;business_service.name|CMDB changes|e|The map on the service page uses the same graph.
itom_health>exe_mat|CMDB completeness score|cmdb_ci.last_discovered,owned_by|Weekly|b|Feeds the maturity score for configuration management.
itom_health>plat_debt|Data quality debt|debt_item|Weekly|b|Records stale data as debt with an owner.
itom_cmdb>itom_graph: skipped
bud_ven>svc_asset|License contracts and renewals|contract.id,vendor,end,auto_renew|Contract signed|e|Tracks what is licensed against what is installed.
inv>svc_asset|Purchase cost of an asset|invoice.id,po,amount;asset.purchase_cost|Invoice posted|e|Fills purchase cost and warranty dates.
svc_asset>bud_over|License and hardware cost|asset.purchase_cost|Monthly|b|Shows the cost of what was bought.
svc_asset>bud_ven|Licenses nearing renewal|contract.end,notice_days|90 days before renewal|b|Starts the renewal review early.
svc_asset>tbm_model|Asset cost pool|asset.class,purchase_cost|Monthly|b|Prices end-user and software towers.
svc_asset>inv|Goods receipt for matching|asset.asset_tag,purchase_cost;invoice.po|Asset received|e|Supports three-way match before payment.
ppl_org>svc_asset|Assignee and team|person.name,team|Asset assigned|e|Ties each asset to a real person.
svc_asset>ppl_org|Equipment still held|asset.assigned_to,asset_tag|Leaver request|e|Blocks offboarding until equipment is returned.
plat_fab>itom_evt|Monitoring alerts|alert_event.severity,ci,service,first_seen|Event stream|e|Brings Azure Monitor and other alerts into one place.
obs_dash>itom_evt|Metric threshold breaches|alert_rule.metric,critical;metric_series.ci,value|Threshold crossed|e|Turns a metric into an alert only when it matters.
itom_slo>itom_evt|Burn rate alert rules|alert_rule.metric,warning,critical|SLO defined|e|Alerts on error budget burn, not raw noise.
itom_evt>itom_run|Alert that matches an automation rule|automation_rule.id,min_severity;alert_event.number|Alert meets a rule|e|Starts the safe automatic fix.
itom_evt>svc_oncall|Page for a critical alert|oncall_shift.rota,tier|Critical alert unacknowledged|e|Pages the person on shift.
svc_oncall>itom_evt|Who to page for the service|oncall_shift.person,tier|Alert routed|e|Routes by service and tier, not by a static list.
itom_evt>tower|False-positive feedback|false_positive_feedback.alert,kind,marked_by|Operator marks an alert as noise|e|Teaches the AI which alerts to suppress.
itom_run>itom_evt|Automation result on the alert|runbook_execution.alert,result|Runbook finished|e|Closes or escalates the alert with proof.
itom_evt>itom_slo|Alert counts as a signal|alert_event.severity,service|Hourly|b|Adds alert evidence to reliability scoring.
dev_pipe>itom_evt|Deployment marker|alert_event.ci,first_seen|Deployment starts|e|Lets operators see that an alert follows a deploy.
obs_dash>itom_slo|Metric series for indicators|metric_series.ci,metric,value,resolution|Every minute|e|Computes the service level indicator from live metrics.
plat_fab>obs_dash|Metrics from Azure Monitor|metric_series.ci,metric,timestamp,value|Every minute|e|Gives dashboards live data without a second collector.
itom_slo>exe_dash|Error budget status|slo.budget_left,service|Hourly|b|Executives see reliability in one number.
itom_slo>ppm_raid|Risk when the error budget is spent|raid_item.type,probability|Budget below 10 percent|e|Records a delivery risk for projects on that service.
obs_dash>exe_dash|Operational tiles|dashboard.name,owner,tile_count|Page opened|e|Embeds live operational charts on the executive page.
kcs_home>itom_run|Procedure text|knowledge_article|Runbook edited|e|Runbooks and articles share one procedure.
obs_std>itom_run|Pre-approved change definition|standard_change.id,pre_approval,automation_level|Standard change published|e|Automation may only run what is pre-approved.
flw_appr>itom_run|Approval for higher autonomy|automation_rule.approver,max_level|Level raised|e|A person must approve before automation gains power.
itom_run>itsm_chg|Standard change created by automation|change_request.type,service,ci|Automation runs|e|Leaves a change record for every automatic fix.
itom_run>kcs_home|Run history updates the article|runbook_execution.result;knowledge_article|Run completes|e|Keeps the procedure true to what works.
itom_run>flw_appr|Approval for level 3 automation|runbook_execution.approver,dry_run|Run needs approval|e|Puts a human in the loop for risky steps.
itom_run>tower|Outcome for trust score|runbook_execution.result,executor|Run completes|e|Success and rollback rates drive each agent's autonomy.
itom_run>obs_std|Success rate|standard_change.success_rate|Weekly|b|Proves a standard change is safe.
itom_run>itom_cmdb|CI facts changed by automation|cmdb_ci.operational_status,last_discovered|Run completes|e|Keeps the CMDB right after an automatic fix.
obs_std>flw_appr|Pre-approval policy|standard_change.pre_approval|Policy changed|e|Approvers see what is already pre-approved.
bud_ben>exe_strat|Realized benefits against objectives|-|Quarterly|b|Shows whether strategy paid off.
exe_strat>port|Objectives and weights|demand_request.objective,capability,score|Annual and quarterly review|h|Scores new demand against what leadership chose.
exe_strat>ppm_proj|Objective each project serves|demand_request.objective;project.id|Project initiated|e|Every project names its objective.
exe_strat>bud_model|Strategic investment envelope|forecast_entry|Annual planning|h|Sets how much can be invested per objective.
exe_strat>exe_dash|Targets for key measures|maturity_capability.t1,t3,t5|Quarterly|b|Executive dashboard compares results to targets.
exe_dash>exe_strat|Performance against targets|maturity_capability.cur;project.status|Monthly|b|Strategy reviews use actuals, not slides.
exe_dash>port|Reprioritization signals|demand_request.stage,score|Monthly review|h|Moves money to what is working.
exe_dash>bud_model|Variance for reforecast|forecast_entry|Monthly|b|Executives ask for a reforecast when variance grows.
exe_risk>exe_dash|Risk heat map|raid_item.exposure,status|Daily|b|Puts risk beside performance.
exe_risk>exe_strat|Risk appetite breaches|raid_item.exposure|Quarterly|h|Lets strategy respond when risk passes appetite.
exe_risk>port|Risk score for prioritization|demand_request.score;raid_item.exposure|Demand scored|e|High-risk demand is flagged before funding.
exe_risk>bud_model|Contingency reserve|forecast_entry|Quarterly|b|Sizes reserve from simulated exposure.
exe_risk>ppm_proj|Risk-adjusted completion date|project.finish;raid_item.exposure|Simulation run|b|Gives project managers a realistic date range.
ppm_raid>exe_risk|Project risks and exposure|raid_item.probability,impact,exposure,status|Hourly|b|Rolls project risks into the enterprise view.
bud_ven>exe_risk|Vendor concentration risk|contract.vendor,risk,value|Monthly|b|Shows over-reliance on one vendor.
ppm_sow>exe_risk|Contract risk score|contract.risk;contract_line.risk|Analysis approved|e|Puts contract exposure in the risk register.
adm_sec>exe_risk|Security risk findings|risk|Daily|b|Security findings reach the same risk view.
tower>exe_risk|AI risk register|risk|Weekly|b|Tracks risk from AI agents and models.
adm_audit>exe_risk|Audit findings|control|Quarterly|h|Open findings become enterprise risks.
itom_health>exe_mat: skipped
itom_dev>exe_mat|DORA measures|maturity_capability.cur|Monthly|b|Delivery maturity uses real deployment data.
exe_mat>exe_strat|Capability gaps against target|maturity_capability.cur,t1,t3|Quarterly|b|Strategy sees which capabilities lag.
exe_mat>port|Gaps become demand|demand_request.capability,objective|Quarterly|h|Turns a maturity gap into a funded improvement.
exe_mat>exe_dash|Maturity scorecard|maturity_capability.name,cur|Quarterly|b|Shows capability next to results.
ppm_proj>exe_mat|Projects that raise a capability|project.status;maturity_capability.name|Project closes|e|Credits maturity gains to the project that made them.
ppl_cap>port|Capacity by skill|person.skills,hours,load|Weekly|b|Scores demand against who can actually do it.
bud_model>port|Funding envelope|forecast_entry|Quarterly|b|Prioritization respects the money available.
port>ppm_proj|Approved demand becomes a project|demand_request.id,stage;project.id,name,budget|Demand approved|e|No retyping from idea to project.
port>bud_over|Funding request|demand_request.cost,objective;budget_line|Demand scored|e|Asks Finance to reserve money for approved ideas.
port>ppl_cap|Resource demand|person.skills,hours|Demand approved|e|Shows the staffing needed before the project starts.
port>flw_appr|Approval to fund|demand_request.id,cost,stage|Demand scored|e|Routes the funding decision to the right authority.
flw_appr>port|Funding decision|demand_request.stage|Approver decides|e|Moves approved demand forward.
port>exe_dash|Pipeline value|demand_request.cost,stage,score|Weekly|b|Executives see what is queued and its value.
plat_debt>port|Platform debt as demand|debt_item;demand_request.title|Quarterly|h|Funds the cleanup of duplicated data and integrations.
tbm_model>port|Cost of run for prioritization|cost_allocation.amount;demand_request.cost|Quarterly|b|Shows the run cost of what already exists.
ppm_proj>bud_ben|Project outcomes|project.status,percent_complete,cpi|Project phase gate|e|Compares what was delivered with what was promised.
bud_over>bud_ben|Actual cost|project.actual_cost,budget|Monthly|b|Benefits are measured against real spend.
svc_360>bud_ben|Service value measures|business_service.availability_30d,users|Quarterly|b|Shows the effect on service use and reliability.
bud_ben>exe_dash|Realized benefits|-|Monthly|b|Executives see value, not only spend.
bud_ben>bud_model|Benefit forecast|forecast_entry|Quarterly|b|Feeds future forecasts with proven benefits.
bud_ben>port|Post-investment review|demand_request.score|Six months after close|h|Calibrates future scoring against reality.
ppl_cap>ppm_proj|Capacity and assignments|person.name,hours,load|Weekly|b|Project managers see who is free.
bud_over>ppm_proj|Approved funding|project.budget|Funding approved|e|The project starts with a funded budget.
ppm_sow>ppm_proj|Contract obligations and milestones|contract_obligation.id,due,status,kind|Contract approved|e|Obligations appear as project tasks and dates.
ppm_wbs>ppm_proj|Progress rollup|project.percent_complete,spi;wbs_line.pct|Task updated|e|The project status is computed, not typed.
ims>ppm_proj|Dates and baselines|project.start,finish,baseline_finish|Nightly|b|Project dates follow the master schedule.
ppm_raid>ppm_proj|Risk-adjusted status|project.status;raid_item.exposure|RAID item changes|e|Status turns amber when exposure grows.
ppm_proj>bud_over|Funding request, forecast and actuals|project.budget,actual_cost;demand_request.cost|Stage gate|e|Turns project demand into budget requests.
ppm_proj>ppl_cap|Resource requests|person.skills,hours;project.id|Plan baselined|e|Reserves capacity for the plan.
ppm_proj>inv|Invoice expectations|invoice.po,vendor,accepted_work|Milestone accepted|e|Tells Accounts Payable what to expect and when.
ppm_proj>bud_ven|Vendor demand and purchase request|contract.vendor,project|Project needs outside help|h|Starts sourcing early.
ppm_proj>ppm_sow|SOW request|contract.project,type|Statement of work needed|h|Opens the contract analysis with project context.
ppm_proj>ppm_wbs|Scope and baseline|project.id,budget,start,finish|Baseline approved|e|The work breakdown starts inside budget and dates.
ppm_proj>exe_dash|Portfolio health|project.status,spi,cpi|Hourly|b|Executives see schedule and cost performance.
ppm_proj>ppm_raid|Project context for risks|raid_item.project;project.status|Project created|e|Risks always belong to a project.
ppm_proj>ims|Project dates|project.start,finish|Baseline approved|e|The master schedule shows every project.
ppm_proj>agile_art|Funded epics|feature.epic,project|Funding approved|e|Release trains plan only what is funded.
ppm_proj>svc_skills|Skill demand|skill.skill,level|Plan baselined|e|Reveals skills the plan needs but nobody has.
agile_art>ppm_proj|Increment progress|feature.state,program_increment;project.percent_complete|End of increment|b|Project status uses delivered features.
plat_fab>ims|Dates from the external planning tool|project_task.planned_start,planned_finish,actual_start,actual_finish|Hourly|b|Master schedule shows dates the team already maintains.
ppm_wbs>ims|Task dates|project_task.planned_start,planned_finish,duration|Task changed|e|Schedule moves when tasks move.
itsm_rel>ims|Release dates|release.planned_date,actual_date|Release scheduled|e|Shows releases as milestones.
ims>ppl_cap|Schedule demand|project_task.wbs,owner,duration|Schedule baselined|e|Capacity planning sees the real time demand.
ims>exe_dash|Milestone health|project_task.milestone,float|Daily|b|Executives see milestones at risk.
ims>itsm_rel|Milestone dates|project_task.milestone,planned_finish|Schedule changed|e|Release dates follow the milestones that need them.
ims>ppm_wbs|Date constraints|project_task.planned_start,predecessors|Schedule changed|e|Tasks respect cross-project dependencies.
ims>ppm_raid|Float shortage|project_task.float,milestone|Float below 5 days|e|Warns the project of a schedule risk.
ppm_sow>ppm_wbs|Deliverables from SOW lines|contract_line.wbs_link,clause;wbs_line.wbs|Contract approved|e|Each contract deliverable becomes a planned task.
ppl_cap>ppm_wbs|Assignees|wbs_line.own;person.name|Plan staffed|e|Tasks carry real named owners.
bud_over>ppm_wbs|Budget by cost code|wbs_line.cost;project.budget|Funding approved|e|Cost plans start from the approved budget.
ppm_wbs>bud_over|Cost plan by task|wbs_line.cost,ac|Plan baselined|e|Budgets show where project money will go.
ppm_wbs>inv|Milestone acceptance|wbs_line.ms;invoice.accepted_work|Milestone accepted|e|Releases the vendor invoice for payment.
ppm_wbs>ppl_cap|Task assignments|wbs_line.own,dur|Plan changed|e|Capacity updates when tasks move.
agile_board>ppm_wbs|Story completion|user_story.state,story_points;wbs_line.pct|Story done|e|Waterfall and agile work show on one plan.
ppm_wbs>ppm_raid|Late critical tasks|wbs_line.crit,fl;raid_item.type|Critical task late|e|Records a schedule issue automatically.
ppm_sow>ppm_raid|Contract risks|contract.risk;raid_item.type|Analysis approved|e|Risky clauses become tracked risks.
ppm_raid>bud_model|Contingency need|forecast_entry|Quarterly|b|Reserve follows real exposure.
ppm_raid>exe_dash|Open risks and issues|raid_item.status,exposure|Daily|b|Executives see risk beside performance.
inv>bud_over|Accruals and posted amounts|invoice.amount,status,paid_to_date;cost_allocation.amount|Invoice approved|e|Budget actuals follow what is owed, not just what is paid.
itom_fin>bud_over|Cloud spend|cost_allocation.from,to,driver,amount|Daily|b|Puts cloud bills into budgets within a day.
ppl_cap>bud_over|Labor cost|person.hours;cost_allocation.amount|Monthly|b|Shows internal labor cost against budget.
plat_fab>bud_over|ERP actuals|invoice.amount;gl_account|Nightly|b|Ledger actuals reach budgets without re-keying.
adm_gate>bud_over|Token spend by team|cost_allocation.driver,amount|Daily|b|AI usage becomes a cost line.
bud_model>bud_over|Annual plan and budget lines|budget_line|Budget approved|h|Every budget line starts from the approved plan.
bud_over>bud_model|Actuals|forecast_entry;project.actual_cost|Monthly|b|Forecasts are rebuilt from actuals.
bud_over>tbm_model|Cost by tower|cost_allocation.from,to,driver,amount|Monthly|b|Cost transparency uses the same numbers.
bud_over>exe_dash|Budget against actual|project.budget,actual_cost|Daily|b|Executives see variance without a spreadsheet.
bud_over>inv|Open commitments and purchase orders|purchase_order;invoice.po|Budget line approved|e|Invoices are checked against what was committed.
bud_model>bud_doa|Spend thresholds|change_approval_policy.min_cost|Budget approved|h|Approval limits follow the budget size.
ppl_org>bud_doa|Reporting lines and roles|person.role,manager|Org change|e|Authority follows the org chart.
bud_doa>flw_appr|Approval routes|change_approval_policy.approvers,quorum,min_cost,sla_hours|Policy changed|e|Approvals route by amount and role.
bud_doa>inv|Invoice approval limits|change_approval_policy.min_cost,approvers|Invoice received|e|Chooses who can approve each invoice.
bud_doa>ppm_sow|Signing authority|change_approval_policy.approvers,min_cost|Contract ready to sign|e|Stops anyone signing above their limit.
bud_ven>inv|Purchase order and contract rates|contract.id,vendor,value;purchase_order|Invoice received|e|Checks invoice price against the contract.
ppm_sow>inv|Payment milestones|contract_line.invoice_link,value,due|Contract approved|e|Invoices match agreed payment terms.
plat_fab>inv|ERP posted amounts and payment status|invoice.amount,status,paid_to_date|Nightly|b|Shows what has been paid.
flw_appr>inv|Invoice approval decision|invoice.status|Approver decides|e|Releases the invoice for payment.
inv>bud_ven|Vendor invoice history|invoice.vendor,amount,paid_to_date|Invoice posted|e|Shows real spend per vendor.
inv>ppm_proj|Actual project cost|project.actual_cost;invoice.amount|Invoice posted|e|Project cost updates as invoices post.
inv>flw_appr|Invoice approval request|invoice.id,amount,status|Invoice matched|e|Sends only matched invoices for approval.
inv>exe_risk|Invoices that fail matching|invoice.status,amount|Weekly|b|Repeated mismatches flag vendor or process risk.
ppm_sow>bud_ven|Executed contract and obligations|contract.id,value,start,end,auto_renew;contract_obligation.due|Contract signed|e|The vendor record shows the contract it runs on.
kcs_home>ppm_sow|Contract playbook clauses|contract_line.playbook;knowledge_article|Contract uploaded|e|Checks clauses against the approved playbook.
bud_ven>ppm_sow|Renewal triggers contract review|contract.end,notice_days|120 days before renewal|b|Starts review before the notice window closes.
bud_ven>bud_over|Committed spend|contract.value;cost_allocation.amount|Contract signed|e|Budgets show committed as well as paid.
bud_ven>flw_appr|Renewal approval|contract.id,value|90 days before renewal|b|Routes the renewal decision.
itom_fin>tbm_model|Cloud cost pools|cost_allocation.from,to,driver,amount|Monthly|b|Prices the cloud tower.
ppl_cap>tbm_model|Labor cost pools|person.hours,team|Monthly|b|Prices labor towers by team.
tbm_model>svc_360|Cost per service|business_service.monthly_cost|Monthly|b|Service pages show unit cost.
tbm_model>exe_dash|Run against change spend|cost_allocation.amount|Monthly|b|Executives see how much goes to keeping the lights on.
tbm_model>bud_model|Unit costs and benchmarks|scaling_step.cost_per_step,units_in_place|Monthly|b|Forecasts use unit cost, not guesses.
tbm_model>itom_fin|Allocation rules|cost_allocation.driver|Rules changed|e|Cloud charges use the same drivers.
plat_fab>itom_fin|Cloud billing export|cost_allocation.amount|Daily|b|Cloud cost arrives straight from the provider.
itom_fin>itom_cmdb|Rightsizing facts|cmdb_ci.class,environment|Weekly|b|CI records show size and waste.
itom_fin>ppm_raid|Budget overrun risk|raid_item.type,exposure|Forecast above budget|e|Flags cost risk to the project.
itom_fin>exe_dash|Cloud savings|cost_allocation.amount|Monthly|b|Shows saving achieved against target.
agile_art>agile_board|Features to break down|feature.number,short_description,epic,wsjf|Planning event|e|Teams plan stories for the right features.
plat_fab>agile_board|Stories and pull requests from Jira and GitHub|user_story.number,state,story_points;pull_request.number,status,checks|Webhook|e|Teams keep their tools; the board stays current.
ppl_cap>agile_board|Team capacity|person.name,hours,load|Sprint planning|e|Sprints are planned against real availability.
dev_pipe>agile_board|Build and check status|pull_request.checks,status|Build finishes|e|Developers see failed checks on their story.
agile_board>agile_art|Feature completion|feature.state;user_story.state,feature|Story done|e|The train sees progress without asking teams.
agile_board>itsm_rel|Stories included in the release|user_story.number,release,state|Sprint closes|e|Release scope is computed from done stories.
agile_board>dev_pipe|Merge-ready pull request|pull_request.number,repository,status,story|Review approved|e|Starts the build for approved work.
agile_board>ppl_cap|Velocity and actual hours|user_story.story_points,assigned_to,team|Sprint closes|b|Capacity plans improve with real throughput.
agile_art>itsm_rel|Feature release assignment|feature.release,state;release.release_train|Increment planned|e|Releases are built from planned features.
agile_art>port|Increment scope and value|feature.program_increment,wsjf,project|Increment planning|h|Trade-offs go back to portfolio owners.
agile_art>bud_over|Train cost|cost_allocation.driver,amount|Monthly|b|Charges delivery teams to the right budget.
ppl_cap>agile_art|Train capacity|person.team,hours|Increment planning|e|Plans features inside real capacity.
itom_dev>agile_art|Delivery metrics|feature.state|Monthly|b|Shows lead time and deployment frequency to the train.
itsm_rel>dev_pipe|Release contents and window|release.number,version,planned_date|Release approved|e|Pipeline builds exactly what was approved.
adm_sec>dev_pipe|Scan results and policy gates|-|On every build|e|Blocks a deploy that fails a security check.
dev_pipe>itsm_chg|Deployment record|change_request.number,state,end_date|Deployment ends|e|Closes the change with proof of deployment.
dev_pipe>itom_cmdb|Version deployed|cmdb_ci.name,environment,lifecycle_stage|Deployment ends|e|The CMDB knows what version runs where.
dev_pipe>itom_dev|Deployment events for DORA|release.actual_date,state|Deployment ends|e|Measures deployment frequency and lead time.
dev_pipe>itsm_rel|Readiness and exit criteria|release.readiness,exit_criteria_pass|Each pipeline stage|e|Release readiness comes from tests, not opinions.
itsm_rel>itsm_chg: skipped
itsm_rel>dev_pipe: skipped
itsm_rel>kcs_home|Release notes|knowledge_article;release.version|Release done|e|Support sees what changed before calls arrive.
itsm_rel>svc_360|Deployed version|release.version,service|Release done|e|The service page shows its current version.
itsm_rel>ppm_proj|Release done against project scope|feature.project,release;project.percent_complete|Release done|e|Project progress follows shipped scope.
itsm_rel>agile_art|Release outcome|release.state,release_train|Release done|e|The train learns from release results.
itom_dev>exe_dash|DORA metrics|release.actual_date,state|Weekly|b|Executives see delivery speed and stability.
itom_dev>dev_pipe|Environment availability|cmdb_ci.environment,operational_status|Environment status changes|e|Pipeline avoids a broken environment.
itsm_inc>itom_dev|Change-caused incidents|incident.service,opened_at|Incident linked to a change|e|Feeds change failure rate.
plat_fab>ppl_org|Entra ID and HR people data|person.name,role,team,manager|Hourly|b|People data is entered once in the identity system.
ppl_org>svc_oncall|Roster|person.name,team|Person changes team|e|On-call rotas follow the org.
ppl_org>ppl_cap|Headcount and teams|person.name,team,hours,manager|Org change|e|Capacity reflects the real org.
ppl_org>svc_skills|People to attach skills to|person.name,role|Person added|e|Skills stay tied to a real person record.
ppl_org>flw_appr|Approver org tree|person.manager,role|Org change|e|Approval routes follow managers.
ppl_org>adm_sec|Identity and roles|person.name,role,kind|Person added or leaves|e|Access is granted and removed with employment.
svc_skills>ppl_cap|Skill gaps and supply|skill_claim.person,skill,level,status;skill.level|Weekly|b|Shows where hiring or training is needed.
svc_skills>svc_oncall|Qualified responders|skill_claim.person,skill,level|Rota built|e|Only people with the skill go on the rota.
svc_skills>ppm_proj|Staffing options|skill.person,skill,level,verified|Resource request|e|Suggests people who match the plan.
svc_skills>ppl_org|Skills profile|skill_claim.person,skill|Skill verified|e|The directory shows verified skills.
ppl_cap>ppl_org|Hire request becomes a person record|person.name,role,team|Hire approved|h|Starts the new hire record before day one.
ppl_cap>svc_skills|Skills needed for hires|skill.skill,level|Gap confirmed|h|Writes the skill profile for the role.
ppl_cap>exe_dash|Utilization|person.load,hours|Weekly|b|Executives see load across teams.
svc_oncall>ppl_cap|On-call hours and time off|oncall_shift.person,starts,ends;time_off.person,from,to,status|Weekly|b|Capacity excludes people on call or away.
plat_fab>svc_oncall|Time off from HR|time_off.person,type,from,to,status|Hourly|b|The rota knows who is away.
svc_oncall>ppm_proj|Availability of key people|time_off.person,from,to|Weekly|b|Project managers see conflicts early.
kcs_home>kcs_ask|Indexed content|knowledge_article|Article published|e|Search answers come from reviewed articles.
kcs_home>kcs_skills|Articles turned into skills|knowledge_article|Skill build|h|Reuses vetted procedures as agent skills.
adm_gate>kcs_ask|Model routing and quota|-|Query|e|Chooses the right model and cost cap.
kcs_ask>chat_home|Cited answers|knowledge_article|Agent asks a question|e|Chat answers cite their sources.
kcs_ask>kcs_home|Unanswered questions|knowledge_article|Daily|b|Shows what to write next.
kcs_ask>adm_gate|Token use|-|Each query|e|Meters AI usage for cost and policy.
adm_gate>kcs_skills|Policy limits for skills|-|Skill published|e|Skills inherit data and cost limits.
plat_reg>kcs_skills|Entities an agent skill may read|app_manifest|Registry change|e|Agents see only registered, permitted entities.
tower>kcs_skills|Suspend a misbehaving skill|-|Guardrail breach|e|Stops harm quickly.
kcs_skills>chat_home|Skills agents may call|-|Skill published|e|Chat agents get new abilities without code.
kcs_skills>tower|Skill inventory|-|Daily|b|Governance sees every skill and its owner.
kcs_skills>itom_run|Skills that run runbook steps|runbook_execution.executor,dry_run|Skill linked to a runbook|h|Lets an agent perform a runbook step.
kcs_skills>adm_gate|Skill call volume|-|Each call|e|Meters skill usage.
adm_sec>adm_gate|AI policy and data limits|policy|Policy changed|e|The gateway enforces security rules for every model call.
chat_home>adm_gate|Prompts and token count|-|Each message|e|Every chat message passes the gateway.
adm_gate>tower|Usage and guardrail hits|-|Each call|e|Governance sees which controls fire.
tower>adm_gate|Throttle or block|-|Risk threshold crossed|e|Stops a risky agent within seconds.
chat_home>tower|User feedback on agent answers|-|Thumbs down or correction|e|Feeds quality scoring.
tower>flw_appr|Human review of risky AI actions|approval|Action above autonomy level|e|Puts a person in the loop.
tower>chat_home|Autonomy level per agent|-|Level changed|e|Chat agents know what they may do alone.
kcs_ask>tower|Answer quality scores|-|Daily|b|Shows which answers need review.
flw_appr>chat_home|Approval cards|approval|Approval waiting|e|Approvers can decide from chat.
chat_home>flw_appr|Approval given in chat|approval|User approves|e|Records the decision in one place.
chat_home>kcs_home|Questions answered by people|knowledge_article|Agent hands off to a person|e|Captures new answers as drafts.
plat_fab>plat_reg|New external fields found|mapping|Sync discovers a field|e|Proposes registry changes when a source adds a field.
plat_gate>plat_reg|Entity proposals|app_manifest|Citizen app declares a new entity|h|Runs the reuse check.
plat_debt>plat_reg|Fix proposals|debt_item|Debt item accepted|h|Duplicate entities get a fix plan.
adm_sec>plat_reg|Classification rules|permission_policy|Policy changed|e|Fields inherit the security class.
plat_reg>plat_gate|Reuse check result|app_manifest|App submitted|e|Citizen apps reuse instead of duplicate.
plat_reg>plat_fab|Mapping targets|mapping|Registry change|e|Connectors map into registered fields.
plat_reg>plat_debt|Duplicate entities|debt_item|Weekly|b|Duplicates become tracked debt.
plat_reg>flw_design|Entity and field picker|-|Designer opened|e|Workflows use real fields, not typed names.
plat_reg>adm_sec|Field classes for access rules|permission_policy|Registry change|e|Access rules use the same classes.
plat_reg>itom_health|Authority rules per field|-|Weekly|b|CMDB checks follow the declared source of truth.
adm_sec>plat_fab|Connector secrets|connector|Connector added|e|Connectors never store passwords in plain view.
plat_gate>plat_fab|Connector requests|connector|Citizen app needs a source|h|Requests an approved connector.
plat_fab>plat_gate|Approved connectors|connector|Weekly|b|Citizen apps see which sources are allowed.
adm_sec>plat_gate|Permitted use rules|policy|Policy changed|e|The gate enforces data rules.
plat_gate>plat_debt|Exceptions with expiry|exception|Exception granted|h|Overrides carry an owner and an end date.
plat_gate>flw_appr|Approval to publish|approval|App ready|e|Routes citizen app publishing to approvers.
flw_appr>plat_gate|Publishing decision|approval|Approver decides|e|Releases the citizen app.
adm_audit>plat_debt|Control gaps|control|Audit finding|h|Control gaps become funded debt.
plat_debt>exe_dash|Debt trend|debt_item|Monthly|b|Executives see platform health.
plat_debt>exe_risk|Debt risk|debt_item|Monthly|b|Large debt becomes a risk.
flw_design>flw_appr|Approval route definitions|approval_policy|Route published|e|Approvers see the designed routes.
flw_design>itsm_inc|State model and automations|incident.state|Workflow published|e|Incident states follow the designed workflow.
adm_sec>flw_design|Roles for steps|role|Roles changed|e|Workflows assign steps to real roles.
tower>adm_sec|Blocked agent identities|role|Agent blocked|e|Revokes access when an agent misbehaves.
adm_sec>adm_audit|Access reviews and policy changes|audit_event|Quarterly|b|Gives auditors evidence.
adm_audit>exe_dash|Compliance posture|control|Monthly|b|Executives see open findings.
adm_audit>adm_sec|Review findings|control|Quarterly|h|Security fixes what auditors found.
plat_fab>dev_pipe|Pull requests and build events|pull_request.number,status,checks|Webhook|e|Pipeline sees code events from source control.
plat_fab>exe_dash|Source health|sync_run|Hourly|b|Shows whether data feeding the dashboards is fresh.
itom_evt>exe_dash|Open critical alerts|alert_event.severity,state|Every 15 minutes|b|Executives see live operational risk.
svc_portal>exe_dash|Portal usage and deflection|request_item.state|Weekly|b|Shows how much self-service avoids tickets.
exe_dash>chat_home|Board questions|-|Question asked|e|Agents answer from the live dashboard.`.split("\n").filter(l=>l.indexOf(": skipped")<0);
const FLOWS2=`flw_appr>itsm_chg|Approval decision|change_request.approval,state|Approver decides|e|Moves the change to scheduled or rejected.
flw_appr>chat_home: skipped`.split("\n").filter(l=>l.indexOf(": skipped")<0);
FLOWS.push.apply(FLOWS,FLOWS2);
const JOURNEYS=[
 {id:"j1",t:"Idea to benefit",story:"A strategic objective scores an idea, a funder approves it, the project is planned and costed, and the benefit is measured against the objective that started it.",steps:["exe_strat","port","flw_appr","port","ppm_proj","ppm_wbs","bud_over","bud_ben","exe_dash","exe_strat"]},
 {id:"j2",t:"Alert to incident to problem to fix",story:"A correlated alert opens one incident, repeat failures open a problem, the permanent fix goes through change and the pipeline, and the CMDB feeds the next alert with true data.",steps:["itom_evt","itsm_inc","itsm_prb","itsm_chg","dev_pipe","itom_cmdb","itom_evt"]},
 {id:"j3",t:"Request to fulfillment to invoice",story:"An employee orders from the portal, the item is approved, fulfilled from stock, matched to the vendor invoice and charged to a budget.",steps:["svc_cat","svc_portal","svc_req","flw_appr","svc_req","svc_asset","inv","bud_over"]},
 {id:"j4",t:"Change from ask to deployed to cost",story:"A project task needs a change, approvers decide inside their limits, the pipeline deploys in the approved window, and cost and schedule impact flow back to the project and budget.",steps:["ppm_wbs","itsm_chg","flw_appr","itsm_chg","dev_pipe","itsm_chg","ppm_proj","bud_over"]},
 {id:"j5",t:"Contract to obligation to invoice to budget",story:"A signed contract creates deliverables and payment milestones, accepted work releases the invoice, approval posts the accrual, and the forecast is rebuilt from actuals.",steps:["ppm_sow","ppm_wbs","inv","flw_appr","inv","bud_over","bud_model"]},
 {id:"j6",t:"Skill gap to hire to onboarding",story:"A project needs a skill nobody has, capacity planning confirms the gap, a hire becomes a directory record, onboarding requests equipment, and the new skills profile closes the gap.",steps:["ppm_proj","svc_skills","ppl_cap","ppl_org","svc_req","svc_asset","ppl_org","svc_skills"]}
];
/* ---------- metrics ---------- */
Object.assign(METRICS,{
 m_mm_pp:{n:"Modules with a documented push and pull",f:"Modules that have at least one outgoing and one incoming data flow, each carrying a registered entity ÷ all modules × 100",u:"%",cur:90,tgt:100,badAt:70,dir:"max",max:100,tr:[52,60,66,72,78,84,88,90],owner:"Platform team",use:["Master process flow"],rem:{kind:"sop",ref:"SOP-720",title:"Document a module's data flows",agent:"Registry Agent",auto:false,state:"idle",prog:"Proposes the missing flow and the registry entity it should carry"}},
 m_mm_ct:{n:"Cross-module flows with a registered data contract",f:"Flows whose data maps to at least one registered entity ÷ all documented flows × 100",u:"%",cur:85,tgt:95,badAt:70,dir:"max",max:100,tr:[48,55,63,70,76,80,83,85],owner:"Data council",use:["Master process flow","Platform registry"],rem:{kind:"agent",ref:"AG-MM1",title:"Register the missing entity",agent:"Registry Agent",auto:false,state:"idle",prog:"Drafts the entity with owner and steward from the planned list"}},
 m_mm_live:{n:"Flows on a live or near-live path",f:"Flows whose slowest field is live or near-live ÷ flows with a registered contract × 100",u:"%",cur:60,tgt:70,badAt:40,dir:"max",max:100,tr:[40,44,48,52,55,57,59,60],owner:"Integration lead",use:["Master process flow","Integration fabric"],rem:{kind:"kb",ref:"KB0722",title:"Move a batch flow to events",agent:"Integration Agent",auto:false,state:"idle",prog:"Finds batch flows whose source can publish events"}}
});
/* ---------- state ---------- */
let READY=false,MODS=[],MB={},FL=[],OUT={},INN={},PLN={},DROP=[],PAIRN=new Map(),LAY=null;
const FRESH=["live","near-live","hourly","daily"],MODEN={e:"event",b:"batch",h:"human"};
const NW=150,NH=54,GX=22,GL=104,ROWP=80,LTOP=40,LGAP=12,MAXC=8;
const scName=id=>{const s=SCREENS.find(x=>x[0]===id);return s?s[1]:id};
const stepsOf=id=>{const d=window.PROC&&PROC.defs[id];return d?(S.proc&&S.proc[id])||d.steps||[]:null};
function init(){
 if(READY)return true;
 if(!window.PLAT||!PLAT.entities||!window.PROC)return false;
 const ents=PLAT.entities();PLN={};(PLAT.PLANNED||[]).forEach(p=>PLN[p[0]]={id:p[0],dom:p[1],label:p[2],steward:p[3],why:p[4],use:p[5]});
 const entMap={};ents.forEach(e=>entMap[e.id]=e);
 MODS=[];MB={};
 CUR.split("\n").forEach(line=>{
  const c=line.split("|");if(c.length<5)return;
  const id=c[0],ap=PLAT.APPS.find(a=>a.id===id);
  const r=new Set(ap?ap.reads:[]),w=new Set(ap?ap.writes:[]);
  (c[5]||"").split(",").filter(Boolean).forEach(x=>{if(entMap[x])r.add(x)});(c[6]||"").split(",").filter(Boolean).forEach(x=>{if(entMap[x])w.add(x)});
  const st=stepsOf(id);
  const m={id,sn:c[1],name:scName(id),band:c[2],bi:BI[c[2]],own:c[3],al:c[4].split(",").map(s=>s.trim().toLowerCase()).filter(Boolean),app:ap?ap.id:null,r:[...r],w:[...w],proc:st?id:null,steps:st?st.length:0,scr:id};
  m.al.push(m.sn.toLowerCase());if(m.name.toLowerCase()!==m.sn.toLowerCase())m.al.push(m.name.toLowerCase());
  MODS.push(m);MB[id]=m;
 });
 /* flows */
 FL=[];OUT={};INN={};DROP=[];PAIRN=new Map();
 MODS.forEach(m=>{OUT[m.id]=[];INN[m.id]=[]});
 FLOWS.forEach((line,i)=>{
  const p=line.split("|");if(p.length<6)return;
  const ft=p[0].split(">"),a=ft[0],b=ft[1];
  if(!MB[a]||!MB[b]||a===b){DROP.push({flow:p[0],why:"Unknown module"});return}
  const refs=[];
  if(p[2]!=="-")p[2].split(";").forEach(tok=>{
   const q=tok.split("."),id=q[0],fs=(q[1]||"").split(",").filter(Boolean),e=entMap[id];
   if(e){const keys={};e.fields.forEach(f=>keys[f.k]=f);const ok=[];fs.forEach(k=>{if(keys[k])ok.push(k);else DROP.push({flow:p[0],why:"Unknown field "+id+"."+k})});
    refs.push({id,kind:"reg",label:e.label,owner:e.owner,steward:e.steward,cls:e.cls,f:ok.map(k=>{const fm=PLAT.fieldMeta(id,keys[k]);return Object.assign({k,label:keys[k].label||k,type:keys[k].type||"string"},fm)})})}
   else if(PLN[id])refs.push({id,kind:"plan",label:PLN[id].label,owner:"Not yet registered",steward:PLN[id].steward,why:PLN[id].why,f:[]});
   else DROP.push({flow:p[0],why:"Unknown entity "+id});
  });
  const reg=refs.some(r=>r.kind==="reg"),plan=refs.some(r=>r.kind==="plan");
  let fresh=null;refs.forEach(r=>r.f.forEach(f=>{const ix=FRESH.indexOf(f.fresh);if(ix>=0&&(fresh===null||ix>FRESH.indexOf(fresh)))fresh=f.fresh}));
  const f={id:"f"+FL.length,from:a,to:b,data:p[1],refs,trig:p[3],mode:MODEN[p[4]]||"event",why:p[5],reg,plan,partial:reg&&plan,status:reg?"registered":plan?"planned":"none",fresh:fresh||(reg?"live":"unknown")};
  FL.push(f);OUT[a].push(f);INN[b].push(f);
  const k=a+">"+b;if(!PAIRN.has(k))PAIRN.set(k,[]);PAIRN.get(k).push(f);
 });
 const NOW=PLAT.nonOwnerWrites();
 MODS.forEach(m=>{m.out=OUT[m.id];m.inn=INN[m.id];m.nout=OUT[m.id].length;m.nin=INN[m.id].length;
  m.eo=new Set();m.out.forEach(f=>f.refs.forEach(r=>m.eo.add(r.id)));m.ei=new Set();m.inn.forEach(f=>f.refs.forEach(r=>m.ei.add(r.id)));
  m.nonOwn=NOW.filter(x=>x.app===m.id)});
 layout();stats();
 READY=true;return true;
}
function layout(){
 const rowsOf=[];let y=0;const lanes=[];
 BANDS.forEach((bd,bi)=>{
  const ms=MODS.filter(m=>m.band===bd[0]);const per=ms.length>MAXC?Math.ceil(ms.length/2):MAXC;const rows=Math.max(1,Math.ceil(ms.length/per));
  const h=LTOP+rows*ROWP-14+14;
  ms.forEach((m,i)=>{const r=Math.floor(i/per),c=i%per;m.col=c;m.row=r;m.x=GL+18+c*(NW+GX);m.y=y+LTOP+r*ROWP;m.cx=m.x+NW/2;m.cy=m.y+NH/2});
  lanes.push({b:bd[0],name:bd[1],bi,y,h,n:ms.length});y+=h+LGAP;
 });
 LAY={lanes,W:GL+18+MAXC*(NW+GX)+10,H:y};
}
function stats(){
 const n=MODS.length,nf=FL.length;
 const pp=MODS.filter(m=>m.out.some(f=>f.reg)&&m.inn.some(f=>f.reg)).length;
 const ct=FL.filter(f=>f.reg).length;
 const reg=FL.filter(f=>f.reg);const live=reg.filter(f=>f.fresh==="live"||f.fresh==="near-live").length;
 METRICS.m_mm_pp.cur=Math.round(100*pp/Math.max(1,n));METRICS.m_mm_ct.cur=Math.round(100*ct/Math.max(1,nf));METRICS.m_mm_live.cur=Math.round(100*live/Math.max(1,reg.length));
 const bandPairs=new Map();FL.forEach(f=>{const a=MB[f.from].bi,b=MB[f.to].bi;if(a===b)return;const k=Math.min(a,b)+"-"+Math.max(a,b);bandPairs.set(k,(bandPairs.get(k)||[]).concat(f))});
 const fnd={noPush:MODS.filter(m=>!m.nout),noPull:MODS.filter(m=>!m.nin),noProc:MODS.filter(m=>!m.proc),noReg:MODS.filter(m=>!m.out.some(f=>f.reg)||!m.inn.some(f=>f.reg)),
  nonOwn:MODS.filter(m=>m.nonOwn.length),planned:{}};
 FL.forEach(f=>f.refs.forEach(r=>{if(r.kind==="plan")fnd.planned[r.id]=(fnd.planned[r.id]||0)+1}));
 fnd.noContract=FL.filter(f=>!f.reg);fnd.batch=FL.filter(f=>f.mode==="batch").length;
 window._mmStats=Object.assign({n,nf,pp,ct,live,reg:reg.length,bandPairs},{fnd});
}
const ST=()=>{init();return window._mmStats};
/* ---------- graph helpers ---------- */
const flowsBetween=(a,b)=>PAIRN.get(a+">"+b)||[];
const nameOf=id=>MB[id]?MB[id].sn:id;
function neighbors(id){const o=new Set(),i=new Set();(OUT[id]||[]).forEach(f=>o.add(f.to));(INN[id]||[]).forEach(f=>i.add(f.from));return{push:[...o],pull:[...i]}}
function blastOf(id,maxHop){
 maxHop=maxHop||3;const seen=new Set([id]);let fr=[id];const lv=[];
 for(let h=1;h<=maxHop;h++){const nx=[];fr.forEach(x=>(OUT[x]||[]).forEach(f=>{if(!seen.has(f.to)){seen.add(f.to);nx.push(f.to)}}));lv.push(nx);fr=nx}
 return lv;
}
function between(a,b){
 const direct=flowsBetween(a,b),rev=flowsBetween(b,a),two=[];
 MODS.forEach(x=>{if(x.id===a||x.id===b)return;
  const f1=flowsBetween(a,x.id),f2=flowsBetween(x.id,b);if(f1.length&&f2.length)two.push({dir:"ab",via:x.id,h:[f1,f2]});
  const g1=flowsBetween(b,x.id),g2=flowsBetween(x.id,a);if(g1.length&&g2.length)two.push({dir:"ba",via:x.id,h:[g1,g2]});});
 two.sort((p,q)=>(q.h[0].length*q.h[1].length)-(p.h[0].length*p.h[1].length)||nameOf(p.via).localeCompare(nameOf(q.via)));
 let chain=null;
 if(!direct.length&&!rev.length&&!two.length){
  const bfs=(s,t,undirected)=>{const prev={};prev[s]=null;let fr=[s];for(let d=0;d<5&&fr.length;d++){const nx=[];for(const x of fr){const nb=undirected?neighbors(x).push.concat(neighbors(x).pull):neighbors(x).push;for(const y of nb)if(!(y in prev)){prev[y]=x;if(y===t){const path=[t];let c=t;while(prev[c]!==null){c=prev[c];path.unshift(c)}return path}nx.push(y)}}fr=nx}return null};
  chain=bfs(a,b,false)||bfs(b,a,false)||bfs(a,b,true);
 }
 return{a,b,direct,rev,two,chain};
}
function matchMods(text){
 init();const t=" "+text.toLowerCase().replace(/[?.,]/g," ")+" ";const al=[];
 MODS.forEach(m=>m.al.forEach(x=>al.push([x,m.id])));al.sort((p,q)=>q[0].length-p[0].length);
 const found=[];let work=t;
 al.forEach(([x,id])=>{let i=work.indexOf(" "+x+" ");if(i<0)i=work.indexOf(" "+x+"s ");if(i<0)i=work.indexOf(" "+x+"'s ");if(i>=0){found.push([i,id]);const len=x.length+2;work=work.slice(0,i)+" ".repeat(len)+work.slice(i+len)}});
 const out=[];found.sort((p,q)=>p[0]-q[0]).forEach(f=>{if(!out.includes(f[1]))out.push(f[1])});return out;
}
window.MODMAP={
 get modules(){init();return MODS},get flows(){init();return FL},get bands(){return BANDS.map(b=>({id:b[0],name:b[1]}))},get dropped(){init();return DROP},
 between(a,b){init();return between(a,b)},neighbors(id){init();return neighbors(id)},blast(id,h){init();return blastOf(id,h)},match:matchMods,stats(){return ST()}
};
/* ---------- canvas ---------- */
const ARR=["push","pull","event","batch","human","pd","pr","p2","jn"];
const bandCol=bi=>"var(--mm-b"+bi+")";
function modePillH(md){return `<span class="mm-md ${md}">${md}</span>`}
function refChips(f){
 if(!f.refs.length)return `<span class="pill mute" title="No registry entity carries this data yet">no entity</span>`;
 return f.refs.slice(0,3).map(r=>`<span class="pill ${r.kind==="reg"?"info":"warn"}" title="${E(r.kind==="reg"?"Registered entity":"Planned entity, not registered yet")}">${E(r.label)}${r.kind==="plan"?" (planned)":""}</span>`).join("")+(f.refs.length>3?`<span class="pill mute">+${f.refs.length-3}</span>`:"");
}
function mapHTML(){
 const W=LAY.W,H=LAY.H;
 const lanes=LAY.lanes.map(l=>`<div class="mm-lane" style="top:${l.y}px;height:${l.h}px;left:${GL}px;width:${W-GL-6}px;--c:${bandCol(l.bi)}"><span class="mm-lt">${E(l.name)}<small>${l.n} modules</small></span></div>`).join("");
 const nodes=MODS.map(m=>`<button type="button" class="mm-n" data-mm-n="${m.id}" style="left:${m.x}px;top:${m.y}px;--c:${bandCol(m.bi)}" aria-label="${E(m.name)}, ${m.nout} pushes, ${m.nin} pulls${m.proc?"":", no process defined"}"><i class="mm-bar"></i><b>${E(m.sn)}</b><span class="mm-io"><em class="o">${m.nout}</em> out <em class="i">${m.nin}</em> in</span>${m.proc?"":`<u class="mm-np" title="No process defined for this module yet"></u>`}</button>`).join("");
 const mk=ARR.map(c=>`<marker id="mm-ar-${c}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" class="mm-mk ${c}"/></marker>`).join("");
 return `<div class="mm-vp" data-mm-vp tabindex="0" role="application" aria-label="Module map. Drag to pan. Control plus scroll or the plus and minus buttons to zoom. Select a module for its pushes and pulls."><div class="mm-world" data-mm-world style="width:${W}px;height:${H}px">${lanes}<svg class="mm-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs>${mk}</defs><g class="mm-bund" data-mm-bund-g></g><g class="mm-edges" data-mm-edges></g></svg>${nodes}</div>
 <div class="mm-ctl" role="group" aria-label="Zoom"><button type="button" class="btn quiet" data-mm-z="in" aria-label="Zoom in">+</button><button type="button" class="btn quiet" data-mm-z="out" aria-label="Zoom out">&minus;</button><button type="button" class="btn quiet" data-mm-z="fit">Fit all</button><button type="button" class="btn quiet" data-mm-z="cluster">Incident cluster</button><button type="button" class="btn quiet" data-mm-collapse>Details</button><span class="small muted" data-mm-zl>100%</span><details class="mm-lgd"><summary>Legend</summary><div class="mm-lgp glass">${legendHTML()}</div></details></div>
 <svg class="mm-mini" data-mm-mini viewBox="${GL-8} 0 ${W-GL+8} ${H}" preserveAspectRatio="xMidYMid meet" aria-label="Minimap. Click to move."><g data-mm-minig></g><rect class="mm-mvp" data-mm-mvp x="0" y="0" width="10" height="10"/></svg>
 <div class="mm-tip" data-mm-tip hidden></div></div>`;
}
function drawStatic(){
 const g=document.querySelector("[data-mm-bund-g]");if(!g)return;
 const s=ST();let h="";
 s.bandPairs.forEach((fl,k)=>{const [i,j]=k.split("-").map(Number),li=LAY.lanes[i],lj=LAY.lanes[j];const y1=li.y+li.h/2,y2=lj.y+lj.h/2,x=GL-10,b=12+Math.min(70,(j-i)*9);
  h+=`<path class="mm-bu" data-mm-bund="${k}" d="M${x},${y1}C${x-b},${y1} ${x-b},${y2} ${x},${y2}" style="stroke-width:${Math.min(9,1.4+fl.length*.22)}"><title>${E(BANDS[i][1])} and ${E(BANDS[j][1])}: ${fl.length} flows. Select to list them.</title></path>`});
 g.innerHTML=h;
 const mg=document.querySelector("[data-mm-minig]");
 if(mg)mg.innerHTML=LAY.lanes.map(l=>`<rect x="${GL}" y="${l.y}" width="${LAY.W-GL}" height="${l.h}" style="fill:${bandCol(l.bi)}" opacity=".35"/>`).join("")+MODS.map(m=>`<rect x="${m.x}" y="${m.y}" width="${NW}" height="${NH}" rx="8" class="mm-md0" data-mm-mm="${m.id}"/>`).join("");
}
function bandSet(){const s=new Set(mpGet("mm_band"));return s}
function edgesNow(){
 const bands=bandSet(),allB=bands.size>=BANDS.length,vis=id=>allB||bands.has(MB[id].band),list=[],seen={};
 const add=(a,b,cls)=>{const k=a+">"+b;if(seen[k])return;const fl=flowsBetween(a,b);if(!fl.length||!vis(a)||!vis(b))return;seen[k]=1;list.push({k,a,b,n:fl.length,fl,cls,far:Math.abs(MB[a].bi-MB[b].bi)>2})};
 if(MM.pair&&MM.pair.a&&MM.pair.b){
  const r=between(MM.pair.a,MM.pair.b);add(r.a,r.b,"pd");add(r.b,r.a,"pr");
  r.two.slice(0,MM.pairAll?99:12).forEach(p=>{if(p.dir==="ab"){add(r.a,p.via,"p2");add(p.via,r.b,"p2")}else{add(r.b,p.via,"p2");add(p.via,r.a,"p2")}});
  if(r.chain)for(let i=0;i<r.chain.length-1;i++)add(r.chain[i],r.chain[i+1],"p2");
 }else if(MM.jny){const j=JOURNEYS.find(x=>x.id===MM.jny);if(j)for(let i=0;i<j.steps.length-1;i++)add(j.steps[i],j.steps[i+1],"jn")}
 else if(MM.sel&&MB[MM.sel]){
  if(MM.showPush)neighbors(MM.sel).push.forEach(t=>add(MM.sel,t,"push"));
  if(MM.showPull)neighbors(MM.sel).pull.forEach(s=>add(s,MM.sel,"pull"));
 }
 if(MM.byMode)list.forEach(e=>{if(e.cls==="push"||e.cls==="pull"){const c={event:0,batch:0,human:0};e.fl.forEach(f=>c[f.mode]++);e.cls=c.human>=c.batch&&c.human>c.event?"human":c.batch>c.event?"batch":"event";e.dirc=1}});
 return list;
}
function geom(list){
 const ends={};
 list.forEach(e=>{const A=MB[e.a],B=MB[e.b],same=Math.abs(A.cy-B.cy)<NH;let sa,sb;
  if(same){sa=sb=(A.cx<B.cx?"t":"b")}else{sa=B.cy>A.cy?"b":"t";sb=sa==="b"?"t":"b"}
  e.sa=sa;e.sb=sb;e.same=same;(ends[e.a+sa]=ends[e.a+sa]||[]).push({e,end:"a",o:B.cx});(ends[e.b+sb]=ends[e.b+sb]||[]).push({e,end:"b",o:A.cx})});
 Object.keys(ends).forEach(k=>{const arr=ends[k].sort((p,q)=>p.o-q.o),c=arr.length,step=Math.min(15,(NW-36)/Math.max(1,c-1));arr.forEach((x,i)=>{x.e["o"+x.end]=(i-(c-1)/2)*step})});
 list.forEach(e=>{const A=MB[e.a],B=MB[e.b],x1=A.cx+e.oa,y1=e.sa==="b"?A.y+NH:A.y,x2=B.cx+e.ob,y2=e.sb==="b"?B.y+NH:B.y;
  if(e.same){const h=24+Math.min(80,Math.abs(x2-x1)*.17),s=e.sa==="t"?-1:1;e.d=`M${x1},${y1}C${x1},${y1+s*h} ${x2},${y2+s*h} ${x2},${y2}`;e.mx=(x1+x2)/2;e.my=y1+s*h*.75}
  else{const dy=y2-y1,s=dy>0?1:-1,k=Math.max(30,Math.abs(dy)*.5);e.d=`M${x1},${y1}C${x1},${y1+s*k} ${x2},${y2-s*k} ${x2},${y2}`;e.mx=(x1+x2)/2;e.my=(y1+y2)/2}});
}
function drawEdges(){
 const g=document.querySelector("[data-mm-edges]");if(!g)return;
 const list=edgesNow();geom(list);
 g.innerHTML=list.map(e=>`<g class="mm-e ${e.cls}${e.far?" far":""}${MM.edge===e.k?" on":""}" data-mm-edge="${e.k}"><path class="mm-hit" d="${e.d}"/><path class="mm-line" d="${e.d}" marker-end="url(#mm-ar-${e.cls})"/>${e.n>1?`<g class="mm-bub" transform="translate(${e.mx},${e.my})"><circle r="9"/><text y="3.6" text-anchor="middle">${e.n}</text></g>`:""}</g>`).join("");
 const note=document.querySelector("[data-mm-note]");if(note)note.textContent=noteText(list);
}
function noteText(list){
 if(MM.pair&&MM.pair.a&&MM.pair.b)return `Showing direct flows and up to ${MM.pairAll?"all":"12"} two-step paths between ${nameOf(MM.pair.a)} and ${nameOf(MM.pair.b)}.`;
 if(MM.jny){const j=JOURNEYS.find(x=>x.id===MM.jny);return j?`Tracing the journey: ${j.t}.`:""}
 if(MM.sel&&MB[MM.sel]){const m=MB[MM.sel];return `${m.name}: ${list.filter(e=>e.cls!=="pull"&&e.a===m.id).length} modules receive its data, ${list.filter(e=>e.b===m.id).length} send it data. Only this module's flows are drawn.`}
 return "Select a module to draw its pushes and pulls. The faint arcs on the left count flows between bands.";
}
function styleNodes(){
 const cls={},add=(id,c)=>{cls[id]=(cls[id]||" hl")+" "+c},bands=bandSet(),allB=bands.size>=BANDS.length;
 let focus=false;
 if(MM.pair&&MM.pair.a){focus=true;add(MM.pair.a,"on pa");if(MM.pair.b){add(MM.pair.b,"on pb");const r=between(MM.pair.a,MM.pair.b);r.two.slice(0,MM.pairAll?99:12).forEach(p=>add(p.via,"nb-via"));(r.chain||[]).forEach(x=>{if(x!==MM.pair.a&&x!==MM.pair.b)add(x,"nb-via")})}}
 else if(MM.jny){focus=true;const j=JOURNEYS.find(x=>x.id===MM.jny);if(j)j.steps.forEach(s=>add(s,"nb-jn"))}
 else if(MM.sel&&MB[MM.sel]){focus=true;add(MM.sel,"on");
  if(MM.blast){blastOf(MM.sel,3).forEach((lv,i)=>lv.forEach(x=>add(x,"bl"+(i+1))))}
  else{const nb=neighbors(MM.sel);if(MM.showPush)nb.push.forEach(x=>add(x,"nb-push"));if(MM.showPull)nb.pull.forEach(x=>add(x,"nb-pull"))}}
 document.querySelectorAll("[data-mm-n]").forEach(el=>{const id=el.dataset.mmN,m=MB[id];el.className="mm-n"+(cls[id]||"")+((!allB&&!bands.has(m.band))?" off":"");el.setAttribute("aria-pressed",MM.sel===id?"true":"false")});
 const w=document.querySelector("[data-mm-world]");if(w)w.classList.toggle("focus",focus);
 const mini=document.querySelectorAll("[data-mm-mm]");mini.forEach(r=>{const c=cls[r.dataset.mmMm]||"";r.setAttribute("class","mm-md0"+(/on/.test(c)?" hi":/nb|bl/.test(c)?" nb":""))});
}
/* ---------- view (pan and zoom) ---------- */
function vpEl(){return document.querySelector("[data-mm-vp]")}
function applyView(){
 const vp=vpEl(),w=document.querySelector("[data-mm-world]");if(!vp||!w||!MM.view)return;const v=MM.view;
 w.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.k})`;vp.classList.toggle("lo",v.k<.62);
 const z=document.querySelector("[data-mm-zl]");if(z)z.textContent=Math.round(v.k*100)+"%";
 const r=document.querySelector("[data-mm-mvp]");if(r){r.setAttribute("x",-v.x/v.k);r.setAttribute("y",-v.y/v.k);r.setAttribute("width",vp.clientWidth/v.k);r.setAttribute("height",vp.clientHeight/v.k)}
}
function boxView(ids,pad,maxK,res){
 const vp=vpEl();if(!vp)return null;const ms=ids.map(i=>MB[i]).filter(Boolean);if(!ms.length)return null;
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;ms.forEach(m=>{x0=Math.min(x0,m.x);y0=Math.min(y0,m.y);x1=Math.max(x1,m.x+NW);y1=Math.max(y1,m.y+NH)});
 x0-=pad;y0-=pad;x1+=pad;y1+=pad;const cw=(vp.clientWidth||900)-(res||0),ch=vp.clientHeight||600;
 const k=Math.max(.2,Math.min(maxK||1.2,cw/(x1-x0),ch/(y1-y0)));
 return{k,x:cw/2-k*(x0+x1)/2,y:ch/2-k*(y0+y1)/2};
}
const panelOpen=()=>!!(MM.sel||MM.pair||MM.flow||MM.jny)&&MM.insp&&window.innerWidth>1000;
function clusterView(){return boxView(["itsm_mi","itsm_inc","itsm_prb","itsm_chg"],64,1.05,panelOpen()?400:0)}
function fitView(){const vp=vpEl();if(!vp)return null;const cw=vp.clientWidth||900,ch=vp.clientHeight||600,k=Math.min(cw/(LAY.W-GL+80),ch/LAY.H)*.97;return{k,x:cw/2-k*(LAY.W+GL-80)/2+0,y:(ch-LAY.H*k)/2}}
let anim=0;
function setView(v,smooth){
 if(!v)return;cancelAnimationFrame(anim);
 const reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 if(!smooth||reduce||!MM.view){MM.view=v;applyView();return}
 const s0=Object.assign({},MM.view),t0=performance.now(),D=380;
 const step=t=>{const p=Math.min(1,(t-t0)/D),e=1-Math.pow(1-p,3);MM.view={x:s0.x+(v.x-s0.x)*e,y:s0.y+(v.y-s0.y)*e,k:s0.k+(v.k-s0.k)*e};applyView();if(p<1)anim=requestAnimationFrame(step)};anim=requestAnimationFrame(step);
}
function zoomAt(f,cx,cy){
 const vp=vpEl();if(!vp||!MM.view)return;const v=MM.view,nk=Math.max(.2,Math.min(2.2,v.k*f));
 cx=cx==null?vp.clientWidth/2:cx;cy=cy==null?vp.clientHeight/2:cy;MM.touched=true;MM.view={x:cx-(cx-v.x)*nk/v.k,y:cy-(cy-v.y)*nk/v.k,k:nk};applyView();
}
function flyTo(ids){const v=boxView(ids,ids.length>1?90:170,1.1,panelOpen()?400:0);if(v){MM.touched=true;setView(v,true)}}
/* ---------- selection ---------- */
function update(){styleNodes();drawEdges();const el=document.querySelector("[data-mm-insp]");if(el){el.innerHTML=`<div class="mm-colr"><button type="button" class="btn quiet" data-mm-collapse>Hide panel</button></div>`+inspHTML();el.classList.toggle("open",!!(MM.sel||MM.pair||MM.flow)&&MM.insp)}
 const pa=document.querySelector("[data-mm-pa]"),pb=document.querySelector("[data-mm-pb]");if(pa)pa.value=MM.pair?MM.pair.a||"":"";if(pb)pb.value=MM.pair?MM.pair.b||"":"";
 document.querySelectorAll("[data-mm-tg]").forEach(b=>{const k=b.dataset.mmTg;b.setAttribute("aria-pressed",String(k==="push"?MM.showPush:k==="pull"?MM.showPull:MM.byMode))});
 document.querySelectorAll("[data-mm-jsel]").forEach(b=>b.classList.toggle("on",b.dataset.mmJsel===MM.jny));
}
function selectMod(id,fly,tab){
 if(!MB[id])return;MM.sel=id;MM.pair=null;MM.jny=null;MM.flow=null;MM.edge=null;MM.insp=true;if(tab)MM.tab=tab;if(!/^(pulls|pushes|proc|data|blast)$/.test(MM.tab))MM.tab="pulls";
 MM.blast=MM.tab==="blast"&&MM.blast;update();if(fly)flyTo([id].concat(neighbors(id).push.slice(0,0)));
 audit("Module map: selected module",MB[id].name);
}
function setPair(a,b,fly){
 MM.pair={a:a||"",b:b||""};MM.sel=null;MM.jny=null;MM.flow=null;MM.edge=null;MM.insp=true;MM.pairAll=false;update();
 if(a&&b){const r=between(a,b),ids=[a,b].concat(r.two.slice(0,12).map(p=>p.via));if(fly!==false)flyTo(ids);audit("Module map: compared modules",nameOf(a)+" and "+nameOf(b))}
}
/* ---------- inspector ---------- */
const WHO={human:"Person",agent:"AI agent",auto:"Automatic",gate:"Approval gate"};
const FDESC={live:"Updates within seconds","near-live":"Updates within a minute or two",hourly:"Refreshed about every hour",daily:"Refreshed once a day",unknown:"No registered field yet"};
const MDESC={event:"Sent the moment the trigger happens.",batch:"Sent on a schedule, in a group.",human:"Sent when a person acts or decides."};
const AUTH={platform:"Oukala is authoritative",external:"External system wins",shared:"Shared, newest wins"};
const modChip=id=>`<button type="button" class="mm-mc" data-mm-sel="${id}" style="--c:${bandCol(MB[id].bi)}"><i></i>${E(MB[id].sn)}</button>`;
const mdOf=m=>BANDS[m.bi][1];
function flowRow(f,other){
 return `<button type="button" class="mm-fr" data-mm-flow="${f.id}"><b>${E(f.data)}</b><span class="mm-fm">${modePillH(f.mode)}<span>${E(f.trig)}</span></span><span class="small muted">${E(f.why)}</span><span class="mm-fe">${refChips(f)}</span></button>`;
}
function grouped(m,dir){
 const list=dir==="in"?m.inn:m.out,g={};list.forEach(f=>{const o=dir==="in"?f.from:f.to;(g[o]=g[o]||[]).push(f)});
 const ids=Object.keys(g).sort((a,b)=>MB[a].bi-MB[b].bi||MB[a].sn.localeCompare(MB[b].sn));
 if(!ids.length)return empty(dir==="in"?"Nothing flows in":"Nothing flows out","Add a flow in the curation table so this module is not an island.");
 return `<p class="small muted mm-sum">${dir==="in"?`${E(m.sn)} pulls ${list.length} kinds of data from ${ids.length} modules.`:`${E(m.sn)} pushes ${list.length} kinds of data to ${ids.length} modules.`} Select a row for its data contract.</p>`+ids.map(id=>`<section class="mm-g"><button type="button" class="mm-gh" data-mm-sel="${id}" style="--c:${bandCol(MB[id].bi)}"><i></i><b>${dir==="in"?"From ":"To "}${E(MB[id].name)}</b><span class="small muted">${E(mdOf(MB[id]))}</span><span class="pill mute">${g[id].length}</span></button>${g[id].map(f=>flowRow(f)).join("")}</section>`).join("");
}
function procTab(m){
 const st=stepsOf(m.id);
 if(!st)return empty("No process defined yet","This module has no steps in the process registry. Process owners add them in the Workflow designer.")+`<div class="row"><button class="btn" data-nav="flw_design">Open Workflow designer</button></div>`;
 return `<p class="small muted mm-sum">${st.length} steps. Each says who acts, how fast, and how it decides.</p><ol class="mm-steps">${st.map((s,i)=>`<li><span class="mm-sn">${i+1}</span><div><b>${E(s.n)}</b><div class="row">${pill(WHO[s.who||"human"],"info")}${window.PROC&&PROC.modeTag?PROC.modeTag(s):""}${s.sla?`<span class="pill mute">${E(s.sla)}</span>`:""}</div><p class="small muted">${E(s.d||"")}</p></div></li>`).join("")}</ol>`;
}
function dataTab(m){
 const chips=(arr,kind)=>arr.length?arr.map(id=>{const e=PLAT.ent(id);return `<button type="button" class="chip mm-ec" data-mm-ent="${id}" title="Open ${E(e?e.label:id)} in the data model">${E(e?e.label:(PLN[id]?PLN[id].label:id))}${kind==="plan"?" (planned)":""}</button>`}).join(""):`<span class="muted small">None</span>`;
 const plan=[...new Set(m.out.concat(m.inn).flatMap(f=>f.refs.filter(r=>r.kind==="plan").map(r=>r.id)))];
 return `<div class="mm-ds"><div class="eyebrow">Writes (declared)</div><div class="row">${chips(m.w)}</div><div class="eyebrow">Reads (declared)</div><div class="row">${chips(m.r)}</div>
 <div class="eyebrow">Carried in its outgoing flows</div><div class="row">${chips([...m.eo].filter(i=>PLAT.ent(i)))}</div><div class="eyebrow">Carried in its incoming flows</div><div class="row">${chips([...m.ei].filter(i=>PLAT.ent(i)))}</div>
 ${plan.length?`<div class="eyebrow">Needed but not registered yet</div><div class="row">${plan.map(i=>`<span class="pill warn">${E(PLN[i].label)}</span>`).join("")}</div>`:""}
 ${m.nonOwn.length?`<div class="eyebrow">Writes an entity it does not own</div><div class="row">${m.nonOwn.map(x=>`<span class="pill bad">${E(x.ent)}, owned by ${E(x.owner)}</span>`).join("")}</div>`:""}
 <p class="small muted">Select an entity to open it in the data model.</p></div>`;
}
function blastTab(m){
 const lv=blastOf(m.id,3),tot=lv.reduce((a,l)=>a+l.length,0);
 return `<p class="small muted mm-sum">${tot?`If ${E(m.sn)} stops, <b>${lv[0].length}</b> modules lose data at once, <b>${lv[1].length}</b> more within two steps and <b>${lv[2].length}</b> within three.`:`Nothing downstream pulls from ${E(m.sn)}.`}</p>
 ${lv.map((l,i)=>`<div class="eyebrow">${i+1} step${i?"s":""} away (${l.length})</div><div class="row">${l.length?l.map(modChip).join(""):'<span class="muted small">None</span>'}</div>`).join("")}
 <div class="row" style="margin-top:12px"><button type="button" class="btn ${MM.blast?"primary":""}" data-mm-blast aria-pressed="${MM.blast}">${MM.blast?"Hide on map":"Show on map"}</button></div>`;
}
function modHTML(m){
 const bl=blastOf(m.id,3).reduce((a,l)=>a+l.length,0);
 const tabs=[["pulls","Pulls from",m.nin],["pushes","Pushes to",m.nout],["proc","Its process",m.steps],["data","Data",m.r.length+m.w.length],["blast","Blast radius",bl]];
 const body=MM.tab==="pushes"?grouped(m,"out"):MM.tab==="proc"?procTab(m):MM.tab==="data"?dataTab(m):MM.tab==="blast"?blastTab(m):grouped(m,"in");
 return `<div class="mm-ih"><div class="row sp"><span class="eyebrow" style="color:${bandCol(m.bi)}">${E(mdOf(m))}</span><button type="button" class="btn quiet" data-mm-close>Close</button></div><h3>${E(m.name)}</h3><p class="small muted">Accountable: ${E(m.own)}</p>
 <div class="row"><button type="button" class="btn primary" data-mm-open="${m.id}">Open screen</button><button type="button" class="btn" data-mm-cmp="${m.id}">Compare with another</button></div></div>
 <div class="mm-tabs" role="tablist">${tabs.map(t=>`<button type="button" role="tab" class="${MM.tab===t[0]?"on":""}" aria-selected="${MM.tab===t[0]}" data-mm-tab="${t[0]}">${t[1]}<small>${t[2]}</small></button>`).join("")}</div><div class="mm-ib" role="tabpanel">${body}</div>`;
}
function refBlock(r,f){
 if(r.kind==="plan")return `<div class="mm-rb plan"><div class="row sp"><b>${E(r.label)}</b><span class="pill warn">Planned, not registered</span></div><p class="small muted">${E(r.why)}</p><p class="small">Proposed steward: ${E(r.steward)}. Until it exists this data has no single contract.</p></div>`;
 return `<div class="mm-rb"><div class="row sp"><b>${E(r.label)} <code>${E(r.id)}</code></b><span class="pill info">Registered</span></div><p class="small muted">Owner module: ${E(r.owner)}. Steward: ${E(r.steward)}. Highest class: ${E(r.cls)}.</p>
 ${r.f.length?r.f.map(x=>`<div class="mm-ff"><b>${E(x.label)}</b><code>${E(x.k)}</code><span class="pill ${x.fresh==="live"||x.fresh==="near-live"?"good":"mute"}">${E(x.fresh)}</span><span class="pill ${x.auth==="external"?"info":x.auth==="shared"?"warn":"good"}">${E(AUTH[x.auth]||x.auth)}</span><span class="pill mute">${E(x.cls)}</span></div>`).join(""):`<p class="small muted">The whole entity travels; no single field is named.</p>`}
 <button type="button" class="btn quiet" data-mm-ent="${r.id}">Open in data model</button></div>`;
}
function flowHTML(){
 const f=FL.find(x=>x.id===MM.flow);if(!f){MM.flow=null;return inspHTML()}
 const A=MB[f.from],B=MB[f.to],sib=flowsBetween(f.from,f.to);
 return `<div class="mm-ih"><div class="row sp"><span class="eyebrow">Data contract</span><button type="button" class="btn quiet" data-mm-back>Back</button></div><h3>${E(f.data)}</h3>
 <div class="mm-chain">${modChip(f.from)}<span aria-hidden="true">&rarr;</span>${modChip(f.to)}</div>
 ${sib.length>1?`<div class="row">${sib.map((x,i)=>`<button type="button" class="chip ${x.id===f.id?"on":""}" data-mm-flow="${x.id}">Flow ${i+1} of ${sib.length}</button>`).join("")}</div>`:""}</div>
 <div class="mm-ib"><dl class="kv"><dt>Trigger</dt><dd>${E(f.trig)}</dd><dt>Mode</dt><dd>${modePillH(f.mode)} ${E(MDESC[f.mode])}</dd><dt>Purpose</dt><dd>${E(f.why)}</dd><dt>Freshness</dt><dd><span class="pill ${f.fresh==="live"||f.fresh==="near-live"?"good":"mute"}">${E(f.fresh)}</span> ${E(FDESC[f.fresh]||"")}</dd>
 <dt>Sending end</dt><dd>${E(A.name)}, accountable ${E(A.own)}</dd><dt>Receiving end</dt><dd>${E(B.name)}, accountable ${E(B.own)}</dd>
 <dt>Contract</dt><dd>${f.status==="registered"?pill(f.partial?"Registered, part still planned":"Registered","good"):f.status==="planned"?pill("Planned entity only","warn"):pill("No entity yet","bad")}</dd></dl>
 ${f.refs.length?f.refs.map(r=>refBlock(r,f)).join(""):`<div class="mm-rb plan"><p class="small">No registry entity carries this data. It moves as free text or a message, so nobody owns its shape.</p></div>`}
 <div class="row" style="margin-top:12px"><button type="button" class="btn" data-mm-showflow="${f.id}">Show on map</button></div></div>`;
}
function pairHTML(){
 const p=MM.pair;if(!p.a)return introHTML();const A=MB[p.a];
 if(!p.b)return `<div class="mm-ih"><div class="row sp"><span class="eyebrow">Compare</span><button type="button" class="btn quiet" data-mm-close>Close</button></div><h3>${E(A.name)} and ...</h3><p class="small muted">Pick the second module in the Compare menu above the map. You will see every direct and two-step path with the data carried.</p></div>`;
 const B=MB[p.b],r=between(p.a,p.b),nd=r.direct.length+r.rev.length,list=MM.pairAll?r.two:r.two.slice(0,12);
 const path2=q=>{const a=q.dir==="ab"?A:B,b=q.dir==="ab"?B:A,v=MB[q.via];return `<div class="mm-p2"><div class="mm-chain">${modChip(a.id)}<span aria-hidden="true">&rarr;</span>${modChip(q.via)}<span aria-hidden="true">&rarr;</span>${modChip(b.id)}</div><p class="small"><button type="button" class="mm-lk" data-mm-flow="${q.h[0][0].id}">${E(q.h[0][0].data)}</button>${q.h[0].length>1?` (+${q.h[0].length-1})`:""} then <button type="button" class="mm-lk" data-mm-flow="${q.h[1][0].id}">${E(q.h[1][0].data)}</button>${q.h[1].length>1?` (+${q.h[1].length-1})`:""}</p></div>`};
 const sect=(t,fl)=>`<div class="eyebrow">${t} (${fl.length})</div>${fl.length?fl.map(f=>flowRow(f)).join(""):'<p class="small muted">No direct flow in this direction.</p>'}`;
 const story=nd?`<b>${E(A.sn)}</b> and <b>${E(B.sn)}</b> share ${r.direct.length} direct flow${r.direct.length===1?"":"s"} one way and ${r.rev.length} the other, plus ${r.two.length} two-step path${r.two.length===1?"":"s"} through other modules.`:r.two.length?`<b>${E(A.sn)}</b> and <b>${E(B.sn)}</b> do not exchange data directly. They reach each other through ${r.two.length} two-step path${r.two.length===1?"":"s"}.`:r.chain?`<b>${E(A.sn)}</b> and <b>${E(B.sn)}</b> connect only through a longer chain of ${r.chain.length-1} steps.`:`<b>${E(A.sn)}</b> and <b>${E(B.sn)}</b> have no documented path. That is a gap.`;
 return `<div class="mm-ih"><div class="row sp"><span class="eyebrow">Compare</span><button type="button" class="btn quiet" data-mm-close>Clear</button></div><h3>${E(A.sn)} and ${E(B.sn)}</h3><p class="small story" data-role="story">${story}</p>
 <div class="row"><button type="button" class="btn" data-mm-swap>Swap</button><button type="button" class="btn quiet" data-mm-open="${A.id}">Open ${E(A.sn)}</button><button type="button" class="btn quiet" data-mm-open="${B.id}">Open ${E(B.sn)}</button></div></div>
 <div class="mm-ib">${sect(E(A.sn)+" pushes to "+E(B.sn),r.direct)}${sect(E(B.sn)+" pushes to "+E(A.sn),r.rev)}
 <div class="eyebrow">Two-step paths (${r.two.length})</div>${list.length?list.map(path2).join(""):'<p class="small muted">None.</p>'}${r.two.length>12?`<button type="button" class="btn quiet" data-mm-pall>${MM.pairAll?"Show fewer":"Show all "+r.two.length}</button>`:""}
 ${r.chain?`<div class="eyebrow">Shortest chain</div><div class="mm-chain">${r.chain.map(modChip).join('<span aria-hidden="true">&rarr;</span>')}</div>`:""}</div>`;
}
function jnyPanel(){
 const j=JOURNEYS.find(x=>x.id===MM.jny);if(!j)return introHTML();
 return `<div class="mm-ih"><div class="row sp"><span class="eyebrow">Journey</span><button type="button" class="btn quiet" data-mm-close>Clear</button></div><h3>${E(j.t)}</h3><p class="small story">${E(j.story)}</p></div><div class="mm-ib">${j.steps.slice(0,-1).map((s,i)=>{const f=flowsBetween(s,j.steps[i+1])[0];return `<div class="mm-p2"><div class="mm-chain">${modChip(s)}<span aria-hidden="true">&rarr;</span>${modChip(j.steps[i+1])}</div>${f?`<p class="small"><button type="button" class="mm-lk" data-mm-flow="${f.id}">${E(f.data)}</button> ${modePillH(f.mode)}</p>`:`<p class="small"><span class="pill bad">No documented flow</span></p>`}</div>`}).join("")}</div>`;
}
function introHTML(){
 const top=MODS.slice().sort((a,b)=>(b.nin+b.nout)-(a.nin+a.nout)).slice(0,6);
 return `<div class="mm-ih"><h3>Start anywhere</h3><p class="small muted">Select a module to see what it pulls from others and what it pushes to them. Select a line to read its data contract. Use Compare to see how any two modules connect.</p></div><div class="mm-ib"><div class="eyebrow">Most connected modules</div><div class="row">${top.map(m=>`<button type="button" class="mm-mc" data-mm-sel="${m.id}" style="--c:${bandCol(m.bi)}"><i></i>${E(m.sn)} <small>${m.nin+m.nout}</small></button>`).join("")}</div>
 <div class="eyebrow">Try these</div><div class="row"><button type="button" class="chip" data-mm-try="itsm_inc,itsm_chg">How do Incidents and Changes connect?</button><button type="button" class="chip" data-mm-try="itsm_inc,bud_over">How does an incident reach Budgets?</button><button type="button" class="chip" data-mm-try="ppm_proj,inv">Projects to Invoices</button></div></div>`;
}
function inspHTML(){
 if(MM.flow)return flowHTML();
 if(MM.pair)return pairHTML();
 if(MM.jny)return jnyPanel();
 if(MM.sel&&MB[MM.sel])return modHTML(MB[MM.sel]);
 return introHTML();
}
/* ---------- flow list drawer ---------- */
function openFlows(title,fl,sub){
 openDrawer(`<div class="eyebrow">Data flows</div><h2>${E(title)}</h2><p class="muted small">${E(sub||"")}</p><div class="dfullgrid mm-dr">${fl.map(f=>`<div class="mm-dflow"><div class="row sp"><b>${E(f.data)}</b>${modePillH(f.mode)}</div><div class="mm-chain">${modChip(f.from)}<span aria-hidden="true">&rarr;</span>${modChip(f.to)}</div><p class="small">${E(f.why)}</p><p class="small muted">Trigger: ${E(f.trig)}</p><div class="row">${refChips(f)}<button type="button" class="btn quiet" data-mm-showflow="${f.id}">Show on map</button></div></div>`).join("")}</div>`);
}
/* ---------- toolbar ---------- */
function toolbar(){
 const opts=`<option value="">Choose a module</option>`+BANDS.map(b=>`<optgroup label="${E(b[1])}">${MODS.filter(m=>m.band===b[0]).map(m=>`<option value="${m.id}">${E(m.sn)}</option>`).join("")}</optgroup>`).join("");
 return `<div class="mm-bar"><label class="mm-search"><input type="search" class="txtin" data-mm-q placeholder="Incidents, budget, CMDB, invoices" aria-label="Find a module" autocomplete="off"><div class="mm-res glass" data-mm-res hidden></div></label>
 <div class="mm-pair"><span class="small muted">Compare</span><select class="mm-sel" data-mm-pa aria-label="First module">${opts}</select><span class="small muted">and</span><select class="mm-sel" data-mm-pb aria-label="Second module">${opts}</select></div>
 <div class="mm-tgs" role="group" aria-label="Layers"><button type="button" class="chip" data-mm-tg="push" aria-pressed="${MM.showPush}">Pushes</button><button type="button" class="chip" data-mm-tg="pull" aria-pressed="${MM.showPull}">Pulls</button><button type="button" class="chip" data-mm-tg="mode" aria-pressed="${MM.byMode}">Color by mode</button></div>
 ${mpHTML({id:"mm_band",label:"Bands",all:"All bands",opts:BANDS.map(b=>({v:b[0],l:b[1]}))})}</div>`;
}
function legendHTML(){
 const ln=(c,t,dash)=>`<span class="mm-lgi"><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="33" y2="5" style="stroke:${c};stroke-width:2.4;${dash?"stroke-dasharray:6 4":""}"/></svg>${t}</span>`;
 return `<div class="mm-lg">${ln("var(--mm-push)","Push: data leaves the selected module",1)}${ln("var(--mm-pull)","Pull: data arrives at it",1)}${ln("var(--mm-event)","Event (with Color by mode)",1)}${ln("var(--mm-batch)","Batch",1)}${ln("var(--mm-human)","Human",1)}${ln("var(--mm-pd)","Direct path between two modules",1)}${ln("var(--mm-p2)","Two-step path",1)}
 <span class="mm-lgi"><svg width="34" height="12" aria-hidden="true"><path d="M30,1 C14,1 14,11 30,11" style="fill:none;stroke:var(--muted);stroke-width:3;opacity:.4"/></svg>Faint arcs: flows between two bands</span>
 <span class="mm-lgi"><i class="mm-npd"></i>No process defined</span><span class="mm-lgi"><i class="mm-sq" style="background:var(--accent)"></i>Selected module</span><span class="mm-lgi">Animated dashes show the direction data moves. Numbers on a line count flows.</span></div>
 ${legend(BANDS.map((b,i)=>[b[1],"--mm-b"+i]))}`;
}
/* ---------- matrix ---------- */
const BSH=["Strategy","Projects","Money","Build","Service ops","CMDB","Observe","People","Knowledge","Platform"];
function matrixPane(){
 const n=MODS.length,bm=BANDS.map(()=>BANDS.map(()=>[]));FL.forEach(f=>bm[MB[f.from].bi][MB[f.to].bi].push(f));
 const hv=c=>c?`--v:${Math.min(1,.2+c*.16).toFixed(2)}`:"";
 const mxMax=Math.max.apply(null,bm.flat().map(a=>a.length));
 const bsum=`<div class="mm-bmx" style="--n:${BANDS.length}"><span class="mm-bh0">From (rows) to (columns)</span>${BANDS.map((b,i)=>`<span class="mm-bh" title="${E(b[1])}">${BSH[i]}</span>`).join("")}${BANDS.map((b,i)=>`<span class="mm-bh r">${E(b[1])}</span>`+BANDS.map((c,j)=>{const k=bm[i][j].length;return k?`<button type="button" class="mm-c big" style="--v:${Math.min(1,.15+k/mxMax*.85).toFixed(2)}" data-mm-bcell="${i}-${j}" aria-label="${E(b[1])} to ${E(c[1])}: ${k} flows">${k}</button>`:`<i class="mm-z"></i>`}).join("")).join("")}</div>`;
 let hdr=`<span class="mm-corner">Pushes from (rows), pulls to (columns)</span>`+MODS.map(m=>`<button type="button" class="mm-ch" data-mm-sel="${m.id}" style="--c:${bandCol(m.bi)}" title="${E(m.name)}">${E(m.sn)}</button>`).join("");
 let rows="";MODS.forEach(a=>{rows+=`<button type="button" class="mm-rh" data-mm-sel="${a.id}" style="--c:${bandCol(a.bi)}"><i></i>${E(a.sn)}</button>`+MODS.map((b,j)=>{const k=flowsBetween(a.id,b.id).length;const bs=j&&MODS[j-1].bi!==b.bi?" bs":"";return a.id===b.id?`<i class="mm-z dg${bs}"></i>`:k?`<button type="button" class="mm-c${bs}" style="${hv(k)}" data-mm-cell="${a.id}>${b.id}" aria-label="${E(a.sn)} to ${E(b.sn)}: ${k} flows">${k}</button>`:`<i class="mm-z${bs}"></i>`}).join("")});
 const sp=BANDS.map(()=>0);
 return `<div class="mm-grid2"><div class="card glass"><div class="eyebrow">Band by band</div><h3 class="mm-h">Where the 10 bands exchange data</h3><p class="small muted">Rows push, columns pull. Darker means more flows. Select a cell to list them.</p><div class="mm-sc">${bsum}</div>${legend([["More flows","--p1"],["No flow","--hair"]])}</div>
 <div class="card glass"><div class="eyebrow">Reading it</div><h3 class="mm-h">What the matrix tells you</h3><ul class="small mm-ul"><li><b>${ST().fnd.noPush.length+ST().fnd.noPull.length}</b> modules have no push or no pull at all.</li><li>The densest block is <b>${(()=>{let b=[0,0,0];BANDS.forEach((x,i)=>BANDS.forEach((y,j)=>{if(bm[i][j].length>b[2])b=[i,j,bm[i][j].length]}));return E(BANDS[b[0]][1])+" to "+E(BANDS[b[1]][1])+" ("+b[2]+")"})()}</b>.</li><li>A filled cell near the diagonal inside one band is a local handoff. A filled cell far from it is a cross-team dependency that needs an owner.</li><li>Rows are listed in band order, so each block of columns is one band.</li></ul></div></div>
 <div class="card glass" style="margin-top:14px"><div class="eyebrow">Module by module</div><h3 class="mm-h">${n} modules, ${FL.length} flows</h3><div class="mm-mxs" tabindex="0" aria-label="Module by module matrix, scrolls sideways"><div class="mm-mx" style="--n:${n}">${hdr}${rows}</div></div>${legend([["Flow count (1 lightest, 4 or more darkest)","--p1"],["Same module","--hair"]])}</div>`;
}
/* ---------- journeys ---------- */
function journeyCard(j){
 const hops=j.steps.slice(0,-1).map((s,i)=>flowsBetween(s,j.steps[i+1])[0]||null);
 const bandsX=new Set(j.steps.map(s=>MB[s].bi)).size,ev=hops.filter(h=>h&&h.mode==="event").length,hu=hops.filter(h=>h&&h.mode==="human").length,miss=hops.filter(h=>!h).length;
 const steps=j.steps.map((s,i)=>{const m=MB[s],st=stepsOf(s);return `<div class="mm-js"><button type="button" class="mm-jm" data-mm-gomod="${s}" style="--c:${bandCol(m.bi)}"><span class="small muted">Step ${i+1}</span><b>${E(m.sn)}</b><small>${E(BANDS[m.bi][1])}</small></button>${i<hops.length?`<div class="mm-jc">${hops[i]?`<span class="mm-jar" aria-hidden="true"></span><b>${E(hops[i].data)}</b><span class="small muted">${E(hops[i].trig)}</span><span class="row">${modePillH(hops[i].mode)}${hops[i].refs[0]?`<span class="pill ${hops[i].refs[0].kind==="reg"?"info":"warn"}">${E(hops[i].refs[0].label)}</span>`:`<span class="pill mute">no entity</span>`}</span>`:`<span class="pill bad">No documented flow</span>`}</div>`:""}</div>`}).join("");
 return `<div class="card glass mm-jcard"><div class="row sp"><div><div class="eyebrow">Journey</div><h3 class="mm-h">${E(j.t)}</h3></div><div class="row"><button type="button" class="btn primary" data-mm-trace="${j.id}">Trace on map</button></div></div>
 <p class="story small" data-role="story">${E(j.story)}</p><div class="row mm-jstat"><span class="pill info">${j.steps.length} steps</span><span class="pill mute">${bandsX} bands</span><span class="pill good">${ev} event handoffs</span><span class="pill warn">${hu} human handoffs</span>${miss?`<span class="pill bad">${miss} undocumented</span>`:`<span class="pill good">All handoffs documented</span>`}</div>
 <div class="mm-jscroll flowscroll" tabindex="0" aria-label="${E(j.t)} steps, scrolls sideways"><div class="mm-jrow">${steps}</div></div></div>`;
}
function journeysPane(){return `<p class="muted small" style="margin:0 0 12px">Each journey crosses several modules. The caption on every arrow is the data handed over, when, and how. Select a module to open it on the map.</p><div class="mm-jwrap">${JOURNEYS.map(journeyCard).join("")}</div>${legend([["Event: sent when it happens","--mm-event"],["Batch: sent on a schedule","--mm-batch"],["Human: a person acts","--mm-human"]])}`}
/* ---------- coverage ---------- */
function covRows(){
 return MODS.map(m=>{const f=[];if(!m.nout)f.push("No push");if(!m.nin)f.push("No pull");if(!m.proc)f.push("No process");
  if(m.nout&&!m.out.some(x=>x.reg))f.push("No registered data on push");if(m.nin&&!m.inn.some(x=>x.reg))f.push("No registered data on pull");if(m.nonOwn.length)f.push("Writes "+m.nonOwn.length+" entity not owned");
  const noEnt=m.out.concat(m.inn).filter(x=>!x.reg).length;
  return{id:m.id,n:m.name,band:BANDS[m.bi][1],push:m.nout,pull:m.nin,proc:m.proc?m.steps+" steps":"None",entities:m.w.length+" write, "+m.r.length+" read",gaps:noEnt,find:f,status:f.length?"Needs work":"Complete"}});
}
function coveragePane(){
 const s=ST(),F=s.fnd,rows=covRows();
 const pl=Object.keys(F.planned).sort((a,b)=>F.planned[b]-F.planned[a]);
 const fc=(t,n,body,rem,cls)=>`<div class="mm-fc"><div class="row sp"><b>${t}</b><span class="pill ${cls||(n?"warn":"good")}">${n}</span></div><div class="mm-fcb">${body}</div><p class="small muted mm-fcr">${rem}</p></div>`;
 const chips=a=>a.length?`<div class="row">${a.slice(0,8).map(m=>modChip(m.id)).join("")}${a.length>8?`<span class="pill mute">+${a.length-8}</span>`:""}</div>`:`<span class="small">None. Every module qualifies.</span>`;
 const cards=[
  fc("No outgoing flow",F.noPush.length,chips(F.noPush),"Add at least one flow that publishes this module's data.",F.noPush.length?"bad":"good"),
  fc("No incoming flow",F.noPull.length,chips(F.noPull),"Add at least one flow that feeds this module from its source.",F.noPull.length?"bad":"good"),
  fc("No process definition",F.noProc.length,chips(F.noProc),"Define who does what in Workflow designer, with times and gates."),
  fc("Push or pull with no registered data",F.noReg.length,chips(F.noReg),"Register the entity or point the flow at an existing one."),
  fc("Writes an entity it does not own",F.nonOwn.length,chips(F.nonOwn),"Move the write behind the owning module or transfer ownership in the registry."),
  fc("Planned entities that block a contract",pl.length,pl.length?`<div class="row">${pl.slice(0,6).map(i=>`<span class="pill warn">${E(PLN[i].label)} ${F.planned[i]}</span>`).join("")}${pl.length>6?`<span class="pill mute">+${pl.length-6}</span>`:""}</div>`:"None.","Registering these removes the most gaps first. The count is flows that need it.")
 ];
 const tbl=btHTML({id:"mm_cov",h:460,rowH:54,key:"id",sort:{k:"n",d:1},exportName:"module-coverage",facets:["band","status"],cols:[
  {k:"n",label:"Module",val:r=>r.n,fmt:r=>`<b>${E(r.n)}</b>`},{k:"band",label:"Band",val:r=>r.band,fmt:r=>E(r.band)},
  {k:"push",label:"Pushes",val:r=>r.push,fmt:r=>`<span class="num">${r.push}</span>`},{k:"pull",label:"Pulls",val:r=>r.pull,fmt:r=>`<span class="num">${r.pull}</span>`},
  {k:"proc",label:"Process",val:r=>r.proc,fmt:r=>r.proc==="None"?pill("None","warn"):pill(r.proc,"good")},{k:"entities",label:"Registry entities",val:r=>r.entities,fmt:r=>E(r.entities)},
  {k:"gaps",label:"Flows with no registered data",val:r=>r.gaps,fmt:r=>`<span class="num">${r.gaps}</span>`},
  {k:"status",label:"Findings",val:r=>r.status+r.find.length,wrap:1,fmt:r=>r.find.length?r.find.map(x=>`<span class="pill warn">${E(x)}</span>`).join(" "):pill("Complete","good")}],rows,open:id=>{S.v.mm_v=0;MM.sel=id;MM.pair=null;MM.jny=null;MM.flow=null;MM.flyIds=[id];render()}});
 return `<div class="mm-fcg">${cards.join("")}</div><div style="margin-top:14px">${tbl}</div>`;
}
/* ---------- screen ---------- */
function oldPane(){let h="";try{h=OLD?OLD():"";h=h.replace(procCard("plat_map"),"")}catch(e){h=""}return `<div class="mm-old"><p class="small muted">The original 14-area view: a high-level loop from strategy to demand, projects, build, change, deploy, operate, incident and problem, with its handoffs and process coverage. Kept so nothing is lost.</p>${h}</div>`}
function screen(){
 if(!init())return `<div class="screen">${hero("Master process flow","Loading the module map","The platform registry is still starting.","")}</div>`;
 const s=ST(),nB=BANDS.length;
 if(!MM._seen){MM._seen=1;if(window.innerWidth<=1000)MM.insp=false}
 const kp=kpiRow([["Modules",s.n,"in "+nB+" bands"],["Data flows",s.nf,"push and pull"],["Documented push and pull",METRICS.m_mm_pp.cur+"%","modules, with registered data",{metric:"m_mm_pp"}],["With a data contract",METRICS.m_mm_ct.cur+"%","flows, registered entity",{metric:"m_mm_ct"}],["Live or near-live",METRICS.m_mm_live.cur+"%","of contracted flows",{metric:"m_mm_live"}]]);
 const hero_=hero("Master process flow","Every module and how they feed each other",`<b data-role="metric">${s.n}</b> modules in <b data-role="metric">${nB}</b> bands exchange data through <b data-role="metric">${s.nf}</b> documented flows. <b data-role="metric">${s.nf-s.fnd.noContract.length}</b> of them map to a registered entity, <b data-role="metric">${s.fnd.noContract.length}</b> still move data nobody has defined, and <b data-role="metric">${s.fnd.noProc.length}</b> modules have no process definition.`,`<div class="row">${stdChip("itil5")}${stdChip("togaf")}${stdChip("bpmn")}</div>`);
 const pane0=`${toolbar()}<div class="mm-cv">${mapHTML()}<aside class="mm-insp glass" data-mm-insp aria-label="Module details"></aside></div><div class="mm-note small muted" data-mm-note aria-live="polite"></div><div style="margin-top:12px">${kp}</div>`;
 setTimeout(mount,0);
 return `<div class="screen mm-screen">${hero_}${lensNote()}${views("mm_v",["Module map","Matrix","Journeys","Coverage","Process areas (original)"],[pane0,matrixPane(),journeysPane(),coveragePane(),oldPane()])}${procCard("plat_map")}</div>`;
}
REG("plat_map","Master process flow","platform",ICON,screen);
/* ---------- mount ---------- */
let RO=null;
function mount(){
 const vp=vpEl();if(!vp||!init())return;
 drawStatic();update();
 if((!MM.view||!MM.touched)&&vp.clientWidth>0){MM.view=clusterView()}
 if(MM.view&&vp.clientWidth>0)applyView();
 if(MM.flyIds&&vp.clientWidth>0){const ids=MM.flyIds;MM.flyIds=null;if(MM.jny){const j=JOURNEYS.find(x=>x.id===MM.jny);flyTo(j?j.steps:ids)}else flyTo(ids)}
 if(window.ResizeObserver){if(RO)RO.disconnect();let w0=vp.clientWidth;RO=new ResizeObserver(()=>{const w=vp.clientWidth;if(w>0&&!MM.touched&&(w0===0||Math.abs(w-w0)>30))MM.view=clusterView();if(w>0){applyView()}w0=w});RO.observe(vp)}
 /* wheel zoom needs a non-passive listener */
 requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!MM.touched&&vpEl()===vp&&vp.clientWidth>0){MM.view=clusterView();applyView()}}));
 vp.addEventListener("wheel",ev=>{if(!(ev.ctrlKey||ev.metaKey))return;ev.preventDefault();const r=vp.getBoundingClientRect();zoomAt(ev.deltaY<0?1.12:1/1.12,ev.clientX-r.left,ev.clientY-r.top)},{passive:false});
}
function goMap(o){S.v.mm_v=0;Object.assign(MM,o);go("plat_map")}
function openEnt(id){if(S.map&&S.map.er)S.map.er.sel=id;if(window.ATLAS&&ATLAS.focus)ATLAS.focus(id);else go("plat_data")}
/* ---------- events ---------- */
let drag=null,sup=false;const pts=new Map();let pinch=null;
document.addEventListener("pointerdown",e=>{
 const vp=e.target.closest&&e.target.closest("[data-mm-vp]");if(!vp||e.target.closest(".mm-ctl,.mm-mini,.mm-insp")||!MM.view)return;
 pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pts.size===1)drag={x:e.clientX,y:e.clientY,vx:MM.view.x,vy:MM.view.y,moved:0};
 else if(pts.size===2){const p=[...pts.values()];pinch={d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),k:MM.view.k,vx:MM.view.x,vy:MM.view.y,mx:(p[0].x+p[1].x)/2,my:(p[0].y+p[1].y)/2};drag=null}
});
window.addEventListener("pointermove",e=>{
 if(pts.has(e.pointerId))pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
 const vp=vpEl();if(!vp)return;
 if(pinch&&pts.size>=2){const p=[...pts.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),nk=Math.max(.2,Math.min(2.2,pinch.k*d/pinch.d)),r=vp.getBoundingClientRect(),cx=pinch.mx-r.left,cy=pinch.my-r.top;MM.view={k:nk,x:cx-(cx-pinch.vx)*nk/pinch.k,y:cy-(cy-pinch.vy)*nk/pinch.k};applyView();sup=true;return}
 if(drag&&pts.has(e.pointerId)){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved=Math.max(drag.moved,Math.abs(dx)+Math.abs(dy));if(drag.moved>5){MM.touched=true;MM.view={k:MM.view.k,x:drag.vx+dx,y:drag.vy+dy};applyView();vp.classList.add("pan")}}
});
const pend=e=>{pts.delete(e.pointerId);if(drag&&drag.moved>5){sup=true;setTimeout(()=>{sup=false},60)}if(pts.size<2)pinch=null;if(!pts.size)drag=null;const vp=vpEl();if(vp)vp.classList.remove("pan")};
window.addEventListener("pointerup",pend);window.addEventListener("pointercancel",pend);
document.addEventListener("click",e=>{if(sup){e.stopPropagation();e.preventDefault();sup=false}},true);
document.addEventListener("pointerover",e=>{
 const t=e.target.closest&&e.target.closest("[data-mm-edge],[data-mm-bund]"),tip=document.querySelector("[data-mm-tip]");if(!tip)return;
 if(!t){tip.hidden=true;return}
 let txt="";
 if(t.dataset.mmEdge){const k=t.dataset.mmEdge.split(">"),fl=flowsBetween(k[0],k[1]);txt=`<b>${E(nameOf(k[0]))} to ${E(nameOf(k[1]))}</b><br>${E(fl[0].data)}${fl.length>1?` and ${fl.length-1} more`:""}. Select for the data contract.`}
 else{const [i,j]=t.dataset.mmBund.split("-").map(Number),n=(ST().bandPairs.get(t.dataset.mmBund)||[]).length;txt=`<b>${E(BANDS[i][1])} and ${E(BANDS[j][1])}</b><br>${n} flows between the two bands. Select to list them.`}
 tip.innerHTML=txt;tip.hidden=false;const vp=vpEl(),r=vp.getBoundingClientRect();tip.style.left=Math.min(r.width-250,Math.max(8,e.clientX-r.left+12))+"px";tip.style.top=Math.max(8,e.clientY-r.top+14)+"px";
});
document.addEventListener("click",e=>{
 let t;
 if((t=e.target.closest("[data-mm-n]"))){selectMod(t.dataset.mmN,false);return}
 if((t=e.target.closest("[data-mm-edge]"))){const k=t.dataset.mmEdge,fl=PAIRN.get(k);if(fl){MM.edge=k;MM.flow=fl[0].id;MM.insp=true;update()}return}
 if((t=e.target.closest("[data-mm-bund]"))){const k=t.dataset.mmBund,[i,j]=k.split("-").map(Number);openFlows(BANDS[i][1]+" and "+BANDS[j][1],ST().bandPairs.get(k)||[],"Every documented flow between these two bands, both directions.");return}
 if((t=e.target.closest("[data-mm-sel]"))){const id=t.dataset.mmSel;if(t.closest(".mm-insp")){selectMod(id,true)}else{if(t.closest(".mm-dr")&&window.closeDrawer)closeDrawer();goMap({sel:id,pair:null,jny:null,flow:null,edge:null,flyIds:[id]})}return}
 if((t=e.target.closest("[data-mm-gomod]"))){goMap({sel:t.dataset.mmGomod,pair:null,jny:null,flow:null,edge:null,flyIds:[t.dataset.mmGomod]});return}
 if((t=e.target.closest("[data-mm-tab]"))){MM.tab=t.dataset.mmTab;if(MM.tab!=="blast")MM.blast=false;update();return}
 if((t=e.target.closest("[data-mm-flow]"))){const f=FL.find(x=>x.id===t.dataset.mmFlow);if(f){MM.flow=f.id;MM.edge=f.from+">"+f.to;MM.insp=true;if(t.closest(".mm-dr")&&window.closeDrawer)closeDrawer();update()}return}
 if((t=e.target.closest("[data-mm-showflow]"))){const f=FL.find(x=>x.id===t.dataset.mmShowflow);if(f){const was=!!document.querySelector("[data-mm-vp]");if(t.closest(".mm-dr")&&window.closeDrawer)closeDrawer();goMap({sel:f.from,pair:null,jny:null,flow:f.id,edge:f.from+">"+f.to,flyIds:[f.from,f.to]})}return}
 if(e.target.closest("[data-mm-collapse]")){MM.insp=!MM.insp;if(!MM.touched){MM.view=clusterView()}update();applyView();return}
 if(e.target.closest("[data-mm-back]")){MM.flow=null;update();return}
 if((t=e.target.closest("[data-mm-close]"))){MM.sel=null;MM.pair=null;MM.jny=null;MM.flow=null;MM.edge=null;MM.blast=false;update();return}
 if((t=e.target.closest("[data-mm-open]"))){const id=t.dataset.mmOpen;audit("Module map: opened screen",scName(id));go(id);return}
 if((t=e.target.closest("[data-mm-cmp]"))){setPair(t.dataset.mmCmp,"",false);const b=document.querySelector("[data-mm-pb]");if(b)b.focus();return}
 if((t=e.target.closest("[data-mm-try]"))){const p=t.dataset.mmTry.split(",");setPair(p[0],p[1]);return}
 if(e.target.closest("[data-mm-swap]")){if(MM.pair){setPair(MM.pair.b,MM.pair.a)}return}
 if(e.target.closest("[data-mm-pall]")){MM.pairAll=!MM.pairAll;update();return}
 if(e.target.closest("[data-mm-blast]")){MM.blast=!MM.blast;update();return}
 if((t=e.target.closest("[data-mm-ent]"))){openEnt(t.dataset.mmEnt);return}
 if((t=e.target.closest("[data-mm-tg]"))){const k=t.dataset.mmTg;if(k==="push")MM.showPush=!MM.showPush;else if(k==="pull")MM.showPull=!MM.showPull;else MM.byMode=!MM.byMode;update();return}
 if((t=e.target.closest("[data-mm-z]"))){const k=t.dataset.mmZ;if(k==="in")zoomAt(1.25);else if(k==="out")zoomAt(.8);else if(k==="fit"){MM.touched=true;setView(fitView(),true)}else{MM.touched=false;setView(clusterView(),true)}return}
 if((t=e.target.closest("[data-mm-cell]"))){const p=t.dataset.mmCell.split(">"),fl=flowsBetween(p[0],p[1]);openFlows(nameOf(p[0])+" pushes to "+nameOf(p[1]),fl,fl.length+" flow"+(fl.length===1?"":"s")+" in this direction.");return}
 if((t=e.target.closest("[data-mm-bcell]"))){const p=t.dataset.mmBcell.split("-").map(Number),fl=FL.filter(f=>MB[f.from].bi===p[0]&&MB[f.to].bi===p[1]);openFlows(BANDS[p[0]][1]+" pushes to "+BANDS[p[1]][1],fl,fl.length+" flows.");return}
 if((t=e.target.closest("[data-mm-trace]"))){goMap({jny:t.dataset.mmTrace,sel:null,pair:null,flow:null,edge:null,flyIds:[]});audit("Module map: traced journey",t.dataset.mmTrace);return}
 if((t=e.target.closest("[data-mm-res] [data-mm-pick]"))){const id=t.dataset.mmPick;const r=document.querySelector("[data-mm-res]");if(r)r.hidden=true;const q=document.querySelector("[data-mm-q]");if(q)q.value=MB[id].name;selectMod(id,true);return}
 if(!e.target.closest(".mm-search")){const r=document.querySelector("[data-mm-res]");if(r)r.hidden=true}
});
document.addEventListener("change",e=>{
 const a=e.target.closest("[data-mm-pa]"),b=e.target.closest("[data-mm-pb]");
 if(a||b){const pa=document.querySelector("[data-mm-pa]").value,pb=document.querySelector("[data-mm-pb]").value;
  if(pa&&pb&&pa===pb){toast("Pick two different modules","warn");return}
  if(pa||pb)setPair(pa,pb);else{MM.pair=null;update()}}
});
document.addEventListener("input",e=>{
 const q=e.target.closest("[data-mm-q]");if(!q)return;const r=document.querySelector("[data-mm-res]"),v=q.value.toLowerCase().trim();
 if(!v){r.hidden=true;return}
 const hits=MODS.filter(m=>(m.name+" "+m.sn+" "+m.al.join(" ")+" "+BANDS[m.bi][1]+" "+m.r.join(" ")+" "+m.w.join(" ")).toLowerCase().includes(v)).slice(0,8);
 r.innerHTML=hits.length?hits.map(m=>`<button type="button" class="mm-pick" data-mm-pick="${m.id}"><i style="background:${bandCol(m.bi)}"></i><b>${E(m.name)}</b><small>${E(BANDS[m.bi][1])}</small></button>`).join(""):`<span class="small muted" style="padding:8px">No module matches</span>`;r.hidden=false;
});
document.addEventListener("keydown",e=>{
 const q=e.target.closest&&e.target.closest("[data-mm-q]");
 if(q&&e.key==="Enter"){const f=document.querySelector("[data-mm-res] [data-mm-pick]");if(f){e.preventDefault();f.click()}return}
 if(q&&e.key==="Escape"){const r=document.querySelector("[data-mm-res]");if(r)r.hidden=true;return}
 const vp=e.target.closest&&e.target.closest("[data-mm-vp]");if(!vp||e.target!==vp||!MM.view)return;
 const st=60;if(e.key==="ArrowLeft")MM.view.x+=st;else if(e.key==="ArrowRight")MM.view.x-=st;else if(e.key==="ArrowUp")MM.view.y+=st;else if(e.key==="ArrowDown")MM.view.y-=st;else if(e.key==="+"||e.key==="=")zoomAt(1.2);else if(e.key==="-")zoomAt(.83);else return;
 e.preventDefault();applyView();
});
/* minimap click and drag */
function miniMove(e){const m=document.querySelector("[data-mm-mini]"),vp=vpEl();if(!m||!vp||!MM.view)return;const r=m.getBoundingClientRect(),VW=LAY.W-GL+8,sc=Math.min(r.width/VW,r.height/LAY.H),ox=(r.width-VW*sc)/2,oy=(r.height-LAY.H*sc)/2;
 MM.touched=true;const wx=(e.clientX-r.left-ox)/sc+GL-8,wy=(e.clientY-r.top-oy)/sc;MM.view={k:MM.view.k,x:vp.clientWidth/2-wx*MM.view.k,y:vp.clientHeight/2-wy*MM.view.k};applyView()}
let miniDown=false;
document.addEventListener("pointerdown",e=>{if(e.target.closest&&e.target.closest("[data-mm-mini]")){miniDown=true;miniMove(e);e.preventDefault()}});
window.addEventListener("pointermove",e=>{if(miniDown)miniMove(e)});window.addEventListener("pointerup",()=>{miniDown=false});
/* ---------- search and chat ---------- */
SEARCHX.push(()=>{if(!init())return[];return MODS.map(m=>({g:"Modules",t:m.name,m:BANDS[m.bi][1]+" · "+m.nout+" out, "+m.nin+" in",c:"--p4",f:()=>goMap({sel:m.id,pair:null,jny:null,flow:null,edge:null,flyIds:[m.id]}),k:m.al.join(" ")+" module map pushes pulls "+m.r.join(" ")+" "+m.w.join(" ")}))});
ASKX.push(q=>{
 const t=q.toLowerCase();if(!/connect|relat|link|between|reach|path|push|pull|read|module map|how do|how does|what does|what pulls|what reads/.test(t))return false;
 if(!init())return false;const ids=matchMods(q);
 let m;
 if((/connect|relate|link|between|reach|path|talk/.test(t)||/how (do|does)/.test(t))&&ids.length>=2){
  const r=between(ids[0],ids[1]);goMap({pair:{a:ids[0],b:ids[1]},sel:null,jny:null,flow:null,edge:null,pairAll:false,flyIds:[ids[0],ids[1]].concat(r.two.slice(0,12).map(p=>p.via))});
  say(q,{t:`${nameOf(ids[0])} and ${nameOf(ids[1])}: ${r.direct.length} direct flow${r.direct.length===1?"":"s"} one way, ${r.rev.length} the other, and ${r.two.length} two-step paths. ${r.direct[0]?`For example ${nameOf(ids[0])} sends "${r.direct[0].data}" to ${nameOf(ids[1])}.`:r.chain?"They connect through a longer chain.":""}`,steps:["Opened the module map","Compared the two modules"]});return true}
 if((m=t.match(/what does (.+?) (push|send|write|give)\w* to (.+)/))&&ids.length>=2){
  const a=ids[0],b=ids[1],fl=flowsBetween(a,b);goMap({pair:{a,b},sel:null,jny:null,flow:null,edge:null,flyIds:[a,b]});
  say(q,{t:fl.length?`${nameOf(a)} pushes to ${nameOf(b)}: ${fl.map(f=>f.data+" ("+f.trig.toLowerCase()+")").join("; ")}.`:`${nameOf(a)} has no direct push to ${nameOf(b)}. The map shows two-step paths instead.`,steps:["Opened the module map"]});return true}
 if(/what (pulls|reads|takes|uses|consumes)\w* (data )?from/.test(t)&&ids.length){
  const a=ids[0],nb=neighbors(a).push;goMap({sel:a,tab:"pushes",pair:null,jny:null,flow:null,edge:null,flyIds:[a]});
  say(q,{t:nb.length?`${nb.length} modules pull from ${nameOf(a)}: ${nb.map(nameOf).join(", ")}.`:`No module pulls from ${nameOf(a)} yet.`,steps:["Opened the module map on "+nameOf(a)]});return true}
 if(/what does .* pull from|where does .* get|what feeds/.test(t)&&ids.length){
  const a=ids[0],nb=neighbors(a).pull;goMap({sel:a,tab:"pulls",pair:null,jny:null,flow:null,edge:null,flyIds:[a]});
  say(q,{t:`${nameOf(a)} pulls from ${nb.length} modules: ${nb.map(nameOf).join(", ")}.`,steps:["Opened the module map on "+nameOf(a)]});return true}
 if(/module map|master process flow|every module/.test(t)){goMap({});say(q,{t:`The module map shows ${MODS.length} modules and ${FL.length} data flows.`,steps:["Opened the module map"]});return true}
 return false;
});
})();
