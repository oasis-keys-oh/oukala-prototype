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
exe_strat>ppm_proj|Objective each project serves|demand_request.objective,project.id|Project initiated|e|Every project names its objective.
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
bud_over>bud_model|Actuals|forecast_entry,project.actual_cost|Monthly|b|Forecasts are rebuilt from actuals.
bud_over>tbm_model|Cost by tower|cost_allocation.from,to,driver,amount|Monthly|b|Cost transparency uses the same numbers.
bud_over>exe_dash|Budget against actual|project.budget,actual_cost|Daily|b|Executives see variance without a spreadsheet.
bud_over>inv|Open commitments and purchase orders|purchase_order,invoice.po|Budget line approved|e|Invoices are checked against what was committed.
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
agile_art>itsm_rel|Feature release assignment|feature.release,release_train,state|Increment planned|e|Releases are built from planned features.
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
