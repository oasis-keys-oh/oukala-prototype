/* mod_plat_cover: coverage audit of the Master data model (tab "Coverage" and "Module matrix" on plat_data).
   Part 1 data: proposed entities, extensions, aliases, record catalog, flow assignments.
   Part 2 engine: window.COVER {coverage, summary, addEntity, approve, use, alias} and window.ATLAS.addEntity/coverage (shims in the atlas file).
   Part 3 views. Loads after the atlas and before the registry, modmap and fin modules, so PLAT, MODMAP and LINKS are only touched inside functions. */
(function(){
const E=esc,N0=n=>Math.round(n).toLocaleString("en-US"),pc=(a,b)=>b?Math.round(100*a/b):100;
S.atlas=S.atlas||{};const A=S.atlas;["approved","confirmed","debtLogged"].forEach(k=>{if(!A[k])A[k]={}});
S.cov=Object.assign({gapF:"all",rec:"all"},S.cov||{});
const scrName=id=>{const s=SCREENS.find(x=>x[0]===id);return s?s[1]:id};
const hasScr=id=>SCREENS.some(x=>x[0]===id);
const pill_=(t,c)=>`<span class="pill ${c||"mute"}">${E(t)}</span>`;

/* ================= PART 1: DATA ================= */
/* type tokens: string text enum ref number currency percent date datetime boolean list duration. flags after "/": e external, s shared, c confidential, r restricted, p personal, q required */
const ENT=`knowledge_article|Knowledge article|know|Knowledge|kcs_home|Knowledge manager|Articles live only in the knowledge module today, so incidents, requests, the portal and agents link to them by text.|number:Number:string/q;title:Title:string/q;kb:Knowledge base:enum;state:State:enum;author:Author:ref/p;owner:Owner:ref/p;service:Service:ref;audience:Audience:enum;version:Version:number;published_at:Published:datetime;review_due:Review due:date;views_30d:Views, last 30 days:number;helpful_pct:Found helpful:percent;incident:Created from:ref;ai_drafted:Drafted by AI:boolean;confidence:Draft confidence:percent
agent_skill|Agent skill|know|Agent skills|kcs_skills|AI platform lead|Agent skills have their own list in the skills module; the gateway and control tower need one record to suspend or limit.|name:Name:string/q;owner:Owner:ref/p;status:Status:enum;risk:Risk level:enum;version:Version:string;inputs:Inputs:list;steps:Steps:number;allowed_entities:Entities it may read:list;calls_30d:Calls, last 30 days:number;suspended:Suspended:boolean
ai_request|AI gateway request|know|AI gateway|adm_gate|AI platform lead|Every prompt that passes the gateway: who asked, which model, tokens, cost, guardrail result and feedback.|id:Request ID:string/q;person:Agent or user:ref/p;ai_model:Model:ref;task:Task:enum;tokens_in:Tokens in:number;tokens_out:Tokens out:number;cost:Cost:currency/c;latency_ms:Latency (ms):number;route:Route:enum;guardrail_hits:Guardrail hits:number;zero_retention:Zero data retention:boolean;status:Result:enum;requested_at:Requested:datetime;feedback_score:Answer quality:number;conversation_thread:Thread:ref
ai_model|AI model|know|AI gateway|adm_gate|AI platform lead|The model catalog the gateway routes to: provider, price, speed, quality and where data may go.|name:Name:string/q;provider:Provider:enum;price_in:Price per million tokens in:currency/c;price_out:Price per million tokens out:currency/c;latency_ms:Typical latency (ms):number;quality:Quality score:number;residency:Data residency:enum;zero_retention:Zero data retention:boolean;pinned_version:Pinned version:string;status:Status:enum
conversation_thread|Conversation thread|know|Chat and agents|chat_home|AI platform lead|Chat threads, incident war rooms and board questions share one record so notes and decisions can be found later.|title:Title:string/q;mode:Mode:enum;pinned:Pinned:boolean;archived:Archived:boolean;created_at:Created:datetime;updated_at:Updated:datetime;participants:Participants:list/p;message_count:Messages:number;pending_approvals:Pending approvals:number;incident:Related record:ref
policy|Policy|gov|Admin and security|adm_sec|Compliance lead|One record for AI guardrails, access rules, retention, budget policy versions and delivery gates, each with an owner, version and enforcement.|id:Policy ID:string/q;name:Name:string/q;kind:Kind:enum;version:Version:string;owner:Owner:ref/p;status:Status:enum;effective_from:Effective from:date;enforcement:Enforcement:enum;scope:Scope:list;control:Control:ref;rationale:Why it exists:text;review_due:Review due:date
control|Control|gov|Audit and compliance|adm_audit|Compliance lead|Controls are rows on the compliance screen; evidence and findings need them as records.|ref:Control reference:string/q;framework:Framework:enum;title:Title:string/q;owner:Owner:ref/p;feature:Platform feature:string;evidence_last:Latest evidence:date;test_frequency:Test frequency:enum;status:Status:enum;policy:Policy:ref;result:Last result:enum
exception|Exception|gov|Governance|plat_gate|Data council chair|Time-boxed overrides: citizen app exceptions, break-glass access and legal holds, each with approver and expiry.|id:Exception ID:string/q;kind:Kind:enum;rule:Rule overridden:string;entity:Entity:ref;requested_by:Requested by:ref/p;approver:Approved by:ref/p;reason:Reason:text;expires:Expires:date/q;status:Status:enum
audit_event|Audit event|gov|Audit and compliance|adm_audit|Security lead|The audit trail, priority override log, reassignment log and data change events become one append-only record.|at:Time:datetime/q;person:Actor:ref/p;persona:Role in use:string;screen:Screen:string;action:Action:string/q;detail:Detail:text;object_type:Object type:string;object_id:Object ID:string;result:Result:enum;prev_hash:Previous hash:string/r
role|Role|gov|Admin and security|adm_sec|Security lead|Roles are a list in the security screen; the registry and approvals need them as records.|id:Role ID:string/q;name:Name:string/q;capabilities:Capabilities:list;scope:Scope:enum;assignable:Assignable:boolean;member_count:Members:number;owner:Owner:ref/p
access_review|Access review|gov|Admin and security|adm_sec|Security lead|Quarterly access reviews with the recommendation, confidence and the reviewer's decision.|person:User:ref/p;access:Access held:string;last_used:Last used:date;risk:Risk:enum;recommendation:Recommendation:enum;reason:Reason:text;confidence:Confidence:percent;decision:Decision:enum;reviewer:Reviewer:ref/p
connector|Connector|plat|Integration fabric|plat_fab|Integration lead|The integration hub and the fabric each keep a connection list. One catalog covers API, database, file, MCP server and webhook connections.|name:Name:string/q;kind:Kind:enum;vendor:Provider:string;tier:Tier:enum;auth_type:Authentication:enum;status:Status:enum;owner:Owner:ref/p;environment:Environment:enum;last_sync:Last sync:datetime;error_rate:Error rate:percent;calls_30d:Calls, last 30 days:number;latency_p95:Latency p95 (ms):number;credential:Credential:ref
mapping|Field mapping|plat|Integration fabric|plat_fab|Integration lead|Versioned mapping from an external field to a registry field, with a confidence and an approver.|connector:Connector:ref;source_field:Source field:string/q;source_type:Source type:string;entity:Entity:ref;field:Registry field:string;transform:Transform:string;confidence:Confidence:percent;status:Status:enum;version:Version:number;approved_by:Approved by:ref/p
sync_run|Sync run|plat|Integration fabric|plat_fab|Integration lead|Each pipeline run, data import kit and platform upgrade pass with counts and errors.|connector:Connector:ref;mode:Mode:enum;started_at:Started:datetime;duration_s:Duration (seconds):number;rows_read:Rows read:number;rows_valid:Rows valid:number;rows_quarantined:Rows quarantined:number;status:Status:enum;error:Error:text
sync_exception|Sync exception|plat|Integration fabric|plat_fab|Integration lead|Quarantined records, reconciliation differences, dead letter events and directory sync errors share one work queue.|connector:Connector:ref;entity:Entity:ref;record:Record:string;field:Field:string;value:Value:string;platform_value:${BRAND.name} value:string;external_value:External value:string/e;reason:Reason:text;status:Status:enum;raised_at:Raised:datetime
credential|Credential|plat|Admin and security|adm_sec|Security lead|API keys, scan credentials and connector secrets. Only a reference to the vault is stored.|name:Name:string/q;kind:Kind:enum;prefix:Visible prefix:string;scope:Scope:list;owner:Owner:ref/p;created:Created:date;expires:Expires:date;last_used:Last used:datetime;rate_limit:Rate limit per minute:number;vault_ref:Vault reference:string/r
app_manifest|App manifest|plat|Citizen apps|plat_gate|Platform lead|Declares what a citizen app reads, writes and reuses, and which checks it passed.|name:Name:string/q;owner:Owner:ref/p;tier:Tier:enum;reads:Reads:list;writes:Writes:list;reuses:Reuses:list;new_entities:New entities requested:number;status:Status:enum;published_at:Published:datetime;checks_passed:Checks passed:number
custom_field|Custom field|plat|Admin studio|adm_studio|Platform lead|Field definitions added in the admin studio: table, label, type, rule and who can see it.|table:Table:string/q;key:Key:string/q;label:Label:string;type:Type:enum;required:Required:boolean;default_value:Default:string;options:Options:list;rule:Rule:string;visibility:Visible to:enum;help:Help text:text
view_definition|Form layout or saved view|plat|Admin studio|adm_studio|Platform lead|Form layouts and saved list views are configuration records with an owner and a sharing setting.|table:Table:string/q;name:Name:string/q;kind:Kind:enum;keys:Fields shown:list;owner:Owner:ref/p;shared:Shared:boolean
feature_flag|Feature flag|plat|Environments and releases|adm_env|Platform lead|Switches that turn a feature on per environment, with an owner and an expiry.|key:Key:string/q;name:Name:string;description:What it does:text;owner:Owner:ref/p;environment:Enabled in:list;rollout_pct:Rollout:percent;expires:Remove by:date
setting|Tenant setting|plat|Admin studio|adm_studio|Platform lead|Themes, languages, holidays and other tenant-wide settings with who changed them.|key:Key:string/q;category:Category:enum;value:Value:string;scope:Scope:enum;changed_by:Changed by:ref/p;changed_at:Changed:datetime
license|License|plat|Licensing and billing|adm_meter|Finance controller|Seats and licenses with price, assignment and renewal.|product:Product:string/q;seats_bought:Seats bought:number;seats_assigned:Seats assigned:number;price:Price per seat:currency/c;renews_on:Renews on:date;vendor:Vendor:ref;owner:Owner:ref/p
environment|Environment|plat|Environments and releases|adm_env|Platform lead|Dev, test, staging and production are strings today. A record carries the data policy, owner and last deployment.|name:Name:string/q;kind:Kind:enum;tier:Tier:enum;owner:Owner:ref/p;promoted_from:Promoted from:ref;data_policy:Data policy:enum;status:Status:enum;last_deploy:Last deployment:datetime
debt_item|Debt item|plat|Debt ledger|plat_debt|Platform lead|The technical debt ledger keeps its items inside the module. Other screens and the gate need them as records.|title:Title:string/q;kind:Type:enum;entity:Entity:ref;severity:Severity:enum;effort_hours:Effort (hours):number;owner:Owner:ref/p;state:State:enum;due:Due:date;source:Source:string;fix:Planned fix:text
data_asset|Data asset|plat|Platform registry|plat_reg|Data council chair|The registry catalog itself: entity, owner, steward, retention and highest classification, so rules and agents can read it.|entity:Entity:string/q;label:Label:string;domain:Domain:enum;owner_module:Owner module:string;steward:Steward:ref/p;retention:Retention:string;highest_class:Highest class:enum;field_count:Fields:number;status:Status:enum
metric_definition|Metric definition|plat|Metrics|metrics|Data architect|Every metric has a name, formula, owner, target and remediation. They are code today, not records.|id:Metric ID:string/q;name:Name:string/q;formula:Formula:text/q;unit:Unit:string;owner:Owner:ref/p;target:Target:number;bad_at:Off-target threshold:number;direction:Direction:enum;remediation:Remediation:text;used_on:Shown on:list
process_definition|Process definition|plat|Workflow designer|flw_design|Process governance lead|The process strip on every screen is a definition with steps, standards and owners. The process library registers these.|id:Process ID:string/q;title:Title:string/q;screen:Screen:string;owner:Owner:ref/p;standards:Standards:list;steps:Steps:number;maturity:Maturity level:number;status:Status:enum
objective|Strategic objective|portfolio|Strategy alignment|exe_strat|Chief strategy officer|Objectives and their weights. Demand requests and projects already point to an objective that is not a table.|id:Objective ID:string/q;name:Name:string/q;level:Level:enum;parent:Parent objective:ref;owner:Owner:ref/p;period:Period:string;status:Confidence:enum;weight:Weight:number;story:Story:text
key_result|Key result|portfolio|Strategy alignment|exe_strat|Chief strategy officer|Measurable results under an objective, with a start, current and target value.|objective:Objective:ref/q;name:Name:string/q;unit:Unit:string;start:Start value:number;current:Current value:number;target:Target value:number;owner:Owner:ref/p;status:Status:enum
application|Application|portfolio|Application portfolio|exe_apps|Enterprise architect|The application portfolio screen lists applications with cost, users and lifecycle. Citizen apps and the CMDB need the same record.|name:Name:string/q;category:Category:enum;owner:Owner:ref/p;annual_cost:Annual cost:currency/c;users:Active users:number;lifecycle:Lifecycle:enum;business_value:Business value:number;health:Health:number;hosting:Hosting:enum
scenario|Scenario|portfolio|Scenario compare|exe_scen|Chief strategy officer|Saved what-if cases: vendor cut, funding envelope and crash assumptions.|name:Name:string/q;assumptions:Assumptions:text;vendor_cut:Vendor cut:percent;envelope:Funding envelope:currency/c;crash_case:Crash case:boolean;owner:Owner:ref/p;note:Note:text
resource_request|Resource request|portfolio|Resource planning|ppl_cap|Resource manager|Two screens keep requests for people. One record covers role, skills, dates and fill status.|title:Title:string/q;project:Project:ref;team:Team:ref;role:Role:string;skills:Skills:list;fte:FTE:number;from:From:date;to:To:date;preferred:Preferred person:ref/p;status:Status:enum
decision:Decision|portfolio|Forums and minutes|ppl_meet|PMO director|Decisions are buried in meeting notes, so nobody can find what was decided or why.|id:Decision ID:string/q;forum:Forum:ref;date:Date:date;title:Title:string/q;rationale:Why:text;decided_by:Decided by:ref/p;status:Status:enum;supersedes:Supersedes:ref
action_item|Action item|portfolio|Forums and minutes|ppl_meet|PMO director|Follow-up tasks from meetings, incidents and decisions, with an owner and a due date.|title:Title:string/q;forum:Forum:ref;owner:Owner:ref/p;due:Due:date;status:Status:enum;source:Source:enum
budget_line|Budget line|fin|Budgets|bud_over|Finance controller|Budget numbers live inside invoice, project and TBM views. One line gives every module the same approved, committed, actual and forecast figure.|project:Project:ref;category:Category:enum;name:Name:string/q;dept:Department:ref;approved:Approved:currency/c;committed:Committed:currency/c;actual:Actual:currency/c;forecast:Forecast:currency/c
budget_adjustment|Budget adjustment|fin|Budgets|bud_over|Finance controller|The budget ledger of transfers, releases and reserves, each with a reason and an approver.|date:Date:date/q;type:Type:enum;amount:Amount:currency/c;project:Project:ref;budget_line:Budget line:ref;reason:Reason:text;requested_by:Requested by:ref/p;approver:Approved by:ref/p
forecast_entry|Forecast entry|fin|Financial model|bud_model|Finance controller|Forecast is typed in several places. A forecast entry per line and period makes variance a computed field.|budget_line:Budget line:ref/q;period:Period:date/q;amount:Amount:currency/c;basis:Basis:enum;version:Version:number;author:Author:ref/p;reason:Reason:text
purchase_order|Purchase order|fin|Vendors and contracts|bud_ven|Procurement lead|Invoices cite a purchase order that has no record of its own.|id:PO number:string/q;vendor:Vendor:ref;contract:Contract:ref;date:Date:date;ordered:Ordered:currency/c;received:Received:currency/c;invoiced:Invoiced:currency/c;paid:Paid:currency/c;created_by:Created by:ref/p
doa_rule|Delegation of authority rule|fin|Delegation of authority|bud_doa|CFO office|Spending limits by role and category, with the number of approvers each level needs.|tier:Tier:string/q;max_amount:Limit:currency/c;role:Role:ref;category:Category:enum;min_approvers:Approvers needed:number;reason:Why:text;effective_from:Effective from:date;status:Status:enum
benefit|Benefit|fin|Benefits realization|bud_ben|PMO director|Planned and realized benefits per project, with a driver and a confidence.|project:Project:ref;name:Name:string/q;kind:Type:enum;owner:Owner:ref/p;driver:Driver:string;start:Start:date;confidence:Confidence:percent;realized:Realized:currency/c
cost_center|Cost center|fin|Budgets|bud_over|Finance controller|Needed for allocation and showback. The ERP is the authority.|code:Code:string/e/q;name:Name:string/e;owner:Owner:ref/p;parent:Parent:ref;status:Status:enum
approval|Approval|service|Approvals inbox|flw_appr|Process governance lead|One approval record for changes, invoices, budgets, requests and AI actions.|kind:Kind:enum/q;subject:Subject:string;requester:Requester:ref/p;approver:Approver:ref/p;amount:Amount:currency/c;risk:Risk:enum;state:State:enum;requested_at:Requested:datetime;decided_at:Decided:datetime;sla_due:Respond by:datetime;delegated_from:Delegated from:ref/p;decision_reason:Reason:text;policy:Policy:ref
notification|Notification|service|Notification engine|svc_notify|Platform lead|Major incident updates, approval nudges and portal messages all send through one record.|audience:Audience:list/p;channel:Channel:enum;subject:Subject:string;body:Body:text;sent_at:Sent:datetime;status:Status:enum;triggered_by:Triggered by:string;ai_drafted:Drafted by AI:boolean;incident:Related record:ref
delegation|Delegation|service|Approvals inbox|flw_appr|Process governance lead|Out of office and standing delegations are kept in two places today.|from:From:ref/p/q;to:To:ref/p/q;scope:Scope:list;starts:Starts:date;until:Until:date;reason:Reason:text;created_by:Created by:ref/p;active:Active:boolean
workflow_definition|Workflow definition|service|Workflow designer|flw_design|Process governance lead|Workflows, BPMN models and agentic workflows share lanes, nodes, an owner and a version.|name:Name:string/q;description:What it does:text;kind:Kind:enum;owner:Owner:ref/p;service:Service:ref;table:Table:string;lanes:Lanes:number;nodes:Nodes:number;version:Version:number;status:Status:enum;kill_switch:Kill switch:boolean
decision_table|Decision table|service|Decision tables|flw_dmn|Process governance lead|Rules a person can read: hit policy, inputs, outputs and the rows.|name:Name:string/q;hit_policy:Hit policy:enum;description:Description:text;inputs:Inputs:list;outputs:Outputs:list;rule_count:Rules:number;ai_assisted:AI assisted:boolean;owner:Owner:ref/p;version:Version:number
assessment|Assessment|service|Assessments|flw_asmt|Process governance lead|Assessment types and the results recorded against a subject, with a bias check.|kind:Type:enum/q;subject:Subject:string;service:Service:ref;by:Assessed by:ref/p;status:Status:enum;bias_flag:Bias flagged:boolean;mode:Mode:enum;approver:Approver:ref/p;score:Score:number;completed_at:Completed:datetime
oncall_rota|On-call rota|service|On-call|svc_oncall|Operations lead|A rota defines the layers and coverage; on-call shifts are its instances.|name:Name:string/q;scope:Scope:string;target:Covers:string;tier:Tier:enum;required_coverage:Required coverage:string;sla:Response SLA:string;layers:Layers:number;owner:Owner:ref/p
organization_unit|Team or organization unit|people|Directory|ppl_org|Head of People Operations|Teams exist as strings. A real org tree drives assignment, workload and access.|name:Name:string/q;manager:Manager:ref/p;parent:Parent unit:ref;kind:Kind:enum;cost_center:Cost center:ref;member_count:Members:number;mailbox:Shared mailbox:string/p
position|Position|people|Resource planning|ppl_cap|Head of People Operations|Vacancies and planned headcount are positions apart from people.|title:Title:string/q;organization_unit:Team:ref;grade:Grade:string;fte:FTE:number;status:Status:enum;hiring_manager:Hiring manager:ref/p;opened:Opened:date;skills:Skills:list
allocation|Allocation|people|Resource planning|ppl_cap|Resource manager|Hours a person is planned on a project, business as usual or leave in a week.|person:Person:ref/p/q;project:Project:ref;week:Week:date/q;hours:Hours:number;kind:Kind:enum;status:Status:enum
forum|Forum|people|Forums and minutes|ppl_meet|PMO director|A standing group such as a steering group, with chair, cadence and quorum.|name:Name:string/q;chair:Chair:ref/p;members:Members:list/p;cadence:Cadence:string;next_meeting:Next meeting:date;length_min:Length (minutes):number;quorum:Quorum:number;room:Room:ref
meeting|Meeting|people|Forums and minutes|ppl_meet|PMO director|Calendar meetings with agenda, attendees, minutes and approval.|forum:Forum:ref;date:Date:date/q;title:Title:string;attendees:Attendees:list/p;quorum_met:Quorum met:boolean;agenda:Agenda:list;minutes:Minutes:text;approved:Minutes approved:boolean;approved_by:Approved by:ref/p
course:Course or learning path|people|Training|ppl_train|Head of People Operations|Courses and paths with modules, a pass mark and a refresh cycle.|title:Title:string/q;category:Category:enum;minutes:Minutes:number;modules:Modules:number;pass_mark:Pass mark:percent;recurrence:Refresh every:string;audience:Audience:string;kind:Kind:enum
learning_event|Learning event|people|Training|ppl_train|Head of People Operations|xAPI statements: who did what, with the result.|person:Learner:ref/p;verb:Verb:string;object:Object:string;result:Result:string;context:Context:string;timestamp:Time:datetime/q
room|Room|people|Rooms and conference scheduling|ppl_av|Facilities lead|Rooms with capacity, equipment and floor.|name:Name:string/q;capacity:Capacity:number;kind:Type:enum;floor:Floor:string;equipment:Equipment:list;tracks:Tracks usage:boolean
room_booking|Room booking|people|Rooms and conference scheduling|ppl_av|Facilities lead|Bookings with attendees, hybrid setup and AV needs.|room:Room:ref/q;date:Date:date/q;start:Start:string;end:End:string;title:Title:string;attendees:Attendees:number;hybrid:Hybrid:boolean;av_needed:AV support:boolean
perf_feedback|Feedback or 360 review|people|Performance management|ppl_perf|Head of People Operations|Feedback and 360 reviews between people, with visibility rules.|from:From:ref/p;to:To:ref/p;kind:Kind:enum;text:Feedback:text/p;date:Date:date;visibility:Visible to:enum;review_cycle:Review cycle:string
journey_map|Journey map|people|Journey maps|ppl_jrny|Service portfolio manager|Journey maps for a persona with stages and the workflow behind them.|name:Name:string/q;persona:Persona:string;workflow:Workflow:ref;category:Category:string;stages:Stages:list;owner:Owner:ref/p`.replace(/^decision:Decision\|/m,"decision|Decision|").replace(/^course:Course or learning path\|/m,"course|Course or learning path|");

/* extensions: new fields on entities that already exist (reuse-first). Tagged ext so they count as new work. */
const EXT={
 core_company:{why:"Vendors are Company records. Delivery, quality and responsiveness scores from the vendor screen become fields instead of a second vendor entity.",f:"delivery_score:Delivery score:percent;quality_score:Quality score:percent;responsiveness_score:Responsiveness score:percent;spend_ytd:Spend year to date:currency/c;contract_owner:Contract owner:ref/p"},
 raid_item:{why:"Enterprise risks are RAID items with a level. One risk concept, two levels.",f:"level:Level:enum;category:Category:enum;mitigation:Mitigation:text;response_plan:Response plan:text"},
 person:{why:"AI agents are people of kind AI. Model, autonomy tier and kill switch become fields on Person.",f:"agent_model:Agent model:string;autonomy_tier:Autonomy tier:enum;kill_switch:Kill switch:boolean;agent_scope:Agent scope:list"},
 change_approval_policy:{why:"The approval policy for every domain extends this entity (see the open registry fix). It gains the domain it applies to.",f:"applies_to:Applies to:enum;auto_approve_below:Auto approve below:currency/c;stop_conditions:Stop conditions:list"},
 problem_record:{why:"A known error is a problem in a state, not a second record.",f:"known_error:Known error:boolean;symptoms:Symptoms:text;known_error_updated:Known error updated:date"}
};
/* planned ids that an existing entity satisfies. key: planned id, value: entity id */
const ALIAS={vendor:"core_company",risk:"raid_item",integration:"connector",permission_policy:"policy",approval_policy:"change_approval_policy"};
/* records the audit found. key|label|screens|module|count|entity|how|path.   how: direct (entity already modeled), ext (extends an existing entity), alias (a kind of an entity), new (new entity), derived (a view, not a table) */
const REC=`PROJ|Projects|ppm_proj,port,ims,plan|ppm_proj|4|project|direct|PROJ
TASKS|Project tasks|ppm_wbs,ims,plan|ppm_wbs|147|project_task|direct|TASKS
DEMAND|Demand requests|port|port|10|demand_request|direct|DEMAND
INVOICES|Invoices|inv|inv|4|invoice|direct|INVOICES
MEETINGS|Calendar meetings|ppl_meet,home|ppl_meet|12|meeting|new|MEETINGS
NODES|Executive trace nodes|trace,kg||17|objective|derived|NODES
DIR|People, agents and providers|ppl_org,fo|ppl_org|85|person|direct|DIR
TEAMS|Teams|ppl_org|ppl_org|12|organization_unit|new|TEAMS
HOLIDAYS|Holidays|ppl_cap,svc_oncall|ppl_cap|7|setting|alias|HOLIDAYS
SKILLS|Skill claims|svc_skills|svc_skills|203|skill_claim|direct|SKILLS
SVCREG|Business services|svc_360|svc_360|16|business_service|direct|SVCREG
CIREG|Configuration items|itom_cmdb,itom_graph,itom_disc,itom_health,itom_model|itom_cmdb|45|config_item|direct|CIREG
PPMRAID|Project RAID items|ppm_raid|ppm_raid|21|raid_item|direct|PPMRAID
REQREG|Requests|svc_req,svc_portal|svc_req|240|request_item|direct|REQREG
SVC_ASSETS|Hardware and software assets|svc_asset|svc_asset|140|asset|direct|SVC_ASSETS
METRICS|Metric definitions|metrics,exe_dash,loop|exe_dash|0|metric_definition|new|METRICS
AUDIT|Audit log|adm_audit,adm_studio|adm_audit|0|audit_event|new|AUDIT
PROCDEFS|Process definitions|plat_pmap,flw_design,flw_bpmn|flw_design|0|process_definition|new|PROC
S.itsm.inc|Incidents|itsm_inc,itsm_home|itsm_inc|17|incident|direct
S.itsm.prb|Problems|itsm_prb|itsm_prb|6|problem_record|direct
S.itsm.ke|Known errors|itsm_prb|itsm_prb|5|problem_record|ext
S.itsm.kb|Knowledge links on tickets|itsm_inc|itsm_inc|5|knowledge_article|alias
S.itsm.chg|Changes|itsm_chg|itsm_chg|24|change_request|direct
S.itsm.tpl|Change templates|itsm_chg,obs_std|obs_std|6|standard_change|direct
S.itsm.mi.comms|Major incident updates|itsm_mi|itsm_mi|3|notification|new
S.itsm.tasks|Follow up tasks|itsm_inc,itsm_mi|itsm_mi|1|action_item|alias
S.itsm.ovlog|Priority overrides|itsm_inc|itsm_inc|1|audit_event|alias
S.itsm.apol|Approval policies|itsm_chg,flw_appr|itsm_chg|11|change_approval_policy|ext
S.itsm.pol.roles|Priority roles|itsm_inc|itsm_inc|6|incident_priority_policy|direct
S.itsm.pol.vip|VIP rules|itsm_inc|itsm_inc|4|incident_priority_policy|direct
S.itsm.req|Requests raised from incidents|itsm_inc|itsm_inc|3|request_item|direct
S.obs.wins|Maintenance windows|itom_evt,itsm_chg|itom_evt|2|maintenance_window|direct
S.obs.rules|Alert rules|itom_evt|itom_evt|12|alert_rule|direct
S.obs.ar|Auto response rules|itom_run|itom_run|8|automation_rule|direct
S.obs.sc|Automation scripts|itom_run|itom_run|15|automation_rule|direct
S.obs.exec|Runbook executions|itom_run|itom_run|30|runbook_execution|direct
S.obs.slos|SLOs|itom_slo|itom_slo|8|slo|direct
S.obs.syn|Synthetic checks|itom_slo|itom_slo|10|synthetic_check|direct
S.obs.dashes|Dashboards|obs_dash|obs_dash|3|dashboard|direct
S.oc.rotas|On-call rotas|svc_oncall|svc_oncall|10|oncall_rota|new
S.exe.objs|Strategic objectives|exe_strat|exe_strat|5|objective|new
S.exe.krs|Key results|exe_strat|exe_strat|11|key_result|new
S.exe.risks|Enterprise risks|exe_risk|exe_risk|7|raid_item|ext
S.exe.apps|Applications|exe_apps||15|application|new
S.exe.scens|Scenarios|exe_scen||3|scenario|new
S.bud.lines|Budget lines|bud_over,bud_model|bud_over|17|budget_line|new
S.bud.led|Budget ledger|bud_over|bud_over|5|budget_adjustment|new
S.bud.doa|Authority tiers|bud_doa|bud_doa|6|doa_rule|new
S.bud.crules|Category approval rules|bud_doa|bud_doa|10|doa_rule|new
S.bud.po|Purchase orders|bud_ven,inv|bud_ven|13|purchase_order|new
S.bud.con|Vendor contracts|bud_ven,ppm_sow|bud_ven|9|contract|direct
S.bud.vend|Vendors|bud_ven|bud_ven|7|core_company|ext
S.bud.ben|Benefits|bud_ben|bud_ben|10|benefit|new
S.bud.pol|Budget policy versions|bud_doa|bud_doa|2|policy|alias
FCST|Forecast periods|bud_model|bud_model|12|forecast_entry|new|
S.itom.fin.rules|Cloud cost allocation rules|itom_fin|itom_fin|1|cost_allocation|direct
S.chx.threads|Chat threads|chat_home|chat_home|1|conversation_thread|new
S.chx.pol|Chat policies|chat_home|chat_home|10|policy|alias
S.chx.deleg|Delegations|chat_home|chat_home|2|delegation|new
S.agents|AI agents|tower,fo||6|person|ext
S.ppl.agents|Agent roster|ppl_org|ppl_org|11|person|ext
S.ppl.people|People (planning copy)|ppl_cap|ppl_cap|39|person|direct
S.adm.roles|Roles|adm_sec|adm_sec|11|role|new
S.adm.pol|Access policies|adm_sec|adm_sec|6|policy|alias
S.adm.bg|Break glass grants|adm_sec|adm_sec|2|exception|alias
S.adm.rev|Access reviews|adm_sec|adm_sec|8|access_review|new
S.adm.fields|Custom fields|adm_studio||40|custom_field|new
S.adm.layout|Form layouts|adm_studio||12|view_definition|new
S.adm.savedViews|Saved views|adm_studio||2|view_definition|alias
S.adm.themeHist|Theme history|adm_studio||1|setting|alias
S.adm.langs|Languages|adm_studio||5|setting|alias
S.adm.scim.errors|Directory sync errors|adm_sec|adm_sec|3|sync_exception|alias
S.adm.pkgs|Deployment packages|adm_env||4|release|alias
S.adm.kits|Data import kits|adm_studio||3|sync_run|alias
S.adm.upg.list|Platform upgrades|adm_env||2|release|alias
S.adm.flags|Feature flags|adm_env||7|feature_flag|new
S.adm.seats|License seats|adm_meter||4|license|new
S.adm.models|AI models|adm_gate|adm_gate|7|ai_model|new
S.adm.routes|Model routes|adm_gate|adm_gate|7|ai_model|alias
S.adm.tok|Token budgets by agent|adm_gate|adm_gate|5|ai_request|alias
S.adm.gr|Guardrails|adm_gate|adm_gate|5|policy|alias
S.adm.ctl|Controls|adm_audit|adm_audit|15|control|new
S.adm.ret|Retention rules|adm_audit|adm_audit|7|policy|alias
S.adm.holds|Legal holds|adm_audit|adm_audit|1|exception|alias
S.flw.W|Workflows|flw_design|flw_design|7|workflow_definition|new
S.flw.asm.types|Assessment types|flw_asmt||6|assessment|new
S.flw.asm.results|Assessment results|flw_asmt||12|assessment|new
S.flw.apx.items|Approval items|flw_appr|flw_appr|33|approval|new
S.flw.apx.ooo|Out of office delegations|flw_appr|flw_appr|2|delegation|new
S.flw.dmn|Decision tables|flw_dmn||4|decision_table|new
S.flw.bps|BPMN models|flw_bpmn||2|workflow_definition|alias
S.flw.wfs|Agentic workflows|flw_agent||3|workflow_definition|alias
S.flw.conns|Integration hub connections|flw_hub||13|connector|new
S.flw.mcps|MCP servers|flw_hub,plat_mcp||5|connector|alias
S.flw.hooks|Webhooks|flw_hub||4|connector|alias
S.flw.keys|API keys|flw_hub||3|credential|new
S.flw.dlq|Dead letter queue|flw_hub||9|sync_exception|alias
S.fab.conns|Data layer connections|plat_fab|plat_fab|19|connector|new
S.fab.maps|Field mappings|plat_fab|plat_fab|38|mapping|new
S.fab.runs|Sync runs|plat_fab|plat_fab|176|sync_run|new
S.fab.quar|Quarantined records|plat_fab|plat_fab|8|sync_exception|new
S.fab.recon|Reconciliation items|plat_fab|plat_fab|9|sync_exception|alias
S.fab.events|Data change events|plat_fab|plat_fab|340|audit_event|alias
S.fab.proj|Project data requests|plat_fab|plat_fab|7|app_manifest|alias
S.fab.reqs|Data layer requests|plat_fab|plat_fab|7|approval|alias
S.fab.wi|Data layer work items|plat_fab|plat_fab|2|action_item|alias
S.gate.apps|Citizen apps|plat_gate|plat_gate|8|app_manifest|new
DEBTITEMS|Debt items|plat_debt|plat_debt|0|debt_item|new|DEBT
S.kcsx.skills|Agent skills|kcs_skills|kcs_skills|10|agent_skill|new
ARTICLES|Knowledge articles|kcs_home,kcs_edit,kcs_ask,kcs_gap|kcs_home|40|knowledge_article|new|
S.ppl.work|Work queue|ppl_org,ppl_cap|ppl_cap|20|project_task|alias
S.pp2.org.wq|Work queue (second copy)|ppl_org|ppl_org|14|project_task|alias
S.ppl.alloc|Weekly allocations|ppl_cap|ppl_cap|312|allocation|new
S.ppl.leave|Leave|svc_oncall,ppl_cap|ppl_cap|7|time_off|direct
S.ppl.reassign|Reassignment log|ppl_org|ppl_org|2|audit_event|alias
S.ppl.courses|Courses|ppl_train||10|course|new
S.ppl.paths|Learning paths|ppl_train||4|course|alias
S.ppl.xapi|Learning events|ppl_train||6|learning_event|new
S.ppl.rooms|Rooms|ppl_av||6|room|new
S.ppl.bk|Room bookings|ppl_av||219|room_booking|new
S.ppl.tix|AV support tickets|ppl_av||3|incident|alias
S.ppl.jr.list|Journey maps|ppl_jrny||3|journey_map|new
S.pp2.jy.list|Journey maps (second copy)|ppl_jrny||4|journey_map|alias
S.ppl.forums|Forums|ppl_meet||4|forum|new
S.ppl.decs|Decisions|ppl_meet||10|decision|new
S.ppl.acts|Action items|ppl_meet||21|action_item|new
S.ppl.agendas|Agendas|ppl_meet||2|meeting|alias
S.ppl.minutes|Minutes|ppl_meet||3|meeting|new
S.pp2.vac|Vacancies|ppl_cap|ppl_cap|6|position|new
S.pp2.pf.fb|Feedback|ppl_perf||8|perf_feedback|new
S.pp2.pf.f360|360 reviews|ppl_perf||3|perf_feedback|alias
S.pp2.pf.gc|Goals cascaded to people and teams|ppl_perf||90|objective|alias
S.rules|Invoice auto approval rules|inv|inv|4|policy|alias
S.mat.xcaps|Added maturity capabilities|exe_mat|exe_mat|92|maturity_capability|direct
S.itsm.histI|Historic incidents|itsm_inc|itsm_inc|6|incident|direct
SVCOFFER|Service offerings|svc_360,svc_cat|svc_360|30|service_offering|direct|
ASTCON|Asset contracts and warranties|svc_asset|svc_asset|10|ast_contract|direct|
S.pp2.cap.reqs|Resource requests|ppl_cap|ppl_cap|6|resource_request|new
S.ppm.reqs|Project resource requests|ppm_proj|ppm_proj|4|resource_request|alias
S.svc.capRules|Capacity rules|svc_360|svc_360|4|automation_rule|alias
S.viz.lib|Saved visualizations|kcs_viz||19|dashboard|alias
S.viz.dash|Visualization dashboards|kcs_viz||3|dashboard|direct
S.dev.pol|Delivery gate policies|dev_pipe|dev_pipe|12|policy|alias
SLAREC|SLA definitions|svc_sla|svc_sla|18|sla_definition|direct|
CATREC|Catalog items|svc_cat|svc_cat|30|catalog_item|direct|
RELREC|Releases|itsm_rel|itsm_rel|8|release|direct|
FEATREC|Features and epics|agile_art|agile_art|10|feature|direct|
STORYREC|User stories|agile_board|agile_board|30|user_story|direct|
PRREC|Pull requests|dev_pipe|dev_pipe|8|pull_request|direct|
COSTREC|Cost allocations|tbm_model,itom_fin|tbm_model|40|cost_allocation|direct|
CONTRACTREC|SOW contract lines|ppm_sow|ppm_sow|21|contract_line|direct|
MATREC|Maturity capabilities|exe_mat|exe_mat|40|maturity_capability|direct|
ALERTREC|Alerts and correlation groups|itom_evt|itom_evt|60|alert_event|direct|
NOTIFREC|Notification rules|svc_notify|svc_notify|8|notification|new|`;
/* flows that carry data no registry reference names. key from>to, value entity id (assigned by the audit) */
const FLOWMAP={"itsm_inc>chat_home":"conversation_thread","chat_home>itsm_mi":"conversation_thread","itsm_mi>chat_home":"conversation_thread","adm_sec>itom_disc":"credential","bud_ben>exe_strat":"benefit","bud_ben>exe_dash":"benefit","adm_sec>dev_pipe":"policy","adm_gate>kcs_ask":"ai_model","kcs_ask>adm_gate":"ai_request","adm_gate>kcs_skills":"policy","tower>kcs_skills":"agent_skill","kcs_skills>chat_home":"agent_skill","kcs_skills>tower":"agent_skill","kcs_skills>adm_gate":"ai_request","chat_home>adm_gate":"ai_request","adm_gate>tower":"ai_request","tower>adm_gate":"policy","chat_home>tower":"ai_request","tower>chat_home":"person","kcs_ask>tower":"ai_request","plat_reg>flw_design":"data_asset","plat_reg>itom_health":"data_asset","exe_dash>chat_home":"conversation_thread"};
/* why the entities that stay undefined stay undefined */
const WHYNOT={gl_account:"The ERP is the authority and no module stores ledger accounts yet; budget lines carry a free text category. Needs a decision on the ERP connector first.",customer_or_stakeholder:"Stakeholders are free text on projects and demand. The decision to make: is a stakeholder a Person with a kind, or its own entity?",document:"Attachments belong to each module. Needs a decision on one storage service (Microsoft 365 or a platform store) before a Document entity can be authoritative.",subscription:"No module stores who gets which notification, so there are no records to define fields from. Defined when the notification engine keeps preferences.",tag:"No module has tags yet; the field list would be a guess. Defined with the first module that labels records."};
const OWNERS={know:"Knowledge manager",gov:"Compliance lead",plat:"Platform lead",portfolio:"Portfolio office lead",fin:"Finance controller",service:"Process governance lead",people:"Head of People Operations"};

/* ---------- parse seeds ---------- */
const SEED={},SEEDF={};
const INFCLS=(k,l,fl)=>{const t=(k+" "+l).toLowerCase();if(/r/.test(fl))return"restricted";if(/p/.test(fl))return"personal";if(/c/.test(fl)||/amount|cost|price|budget|spend|approved|committed|actual|forecast|limit|paid|invoiced|ordered|received|envelope|realized|salary/.test(t))return"confidential";if(/secret|vault|hash|token_value/.test(t))return"restricted";if(/email|phone|home|mailbox/.test(t))return"personal";return"internal"};
const FT={string:"string",text:"text",enum:"enum",ref:"ref",number:"number",currency:"currency",percent:"percent",date:"date",datetime:"datetime","boolean":"boolean",list:"list",duration:"duration"};
ENT.split("\n").forEach(line=>{const c=line.split("|");if(c.length<8)return;
 const fields=c[7].split(";").map(s=>{const p=s.split(":");const tf=(p[2]||"string").split("/");const fl=tf.slice(1).join("");const ty=FT[tf[0]]||"string";
  const o={k:p[0],label:p[1],type:ty,authority:/e/.test(fl)?"external":/s/.test(fl)?"shared":"platform",classification:INFCLS(p[0],p[1],fl),proposed:true};if(/q/.test(fl))o.req=true;return o});
 SEED[c[0]]={id:c[0],label:c[1],domain:c[2],source:c[3],ownerMod:c[4],steward:c[5],note:c[6],fields}});
const EXTD={};Object.keys(EXT).forEach(t=>{EXTD[t]={why:EXT[t].why,fields:EXT[t].f.split(";").map(s=>{const p=s.split(":");const tf=(p[2]||"string").split("/");const fl=tf.slice(1).join("");const ty=FT[tf[0]]||"string";return{k:p[0],label:p[1],type:ty,authority:"platform",classification:INFCLS(p[0],p[1],fl),ext:true,proposed:true}})}});
const RECS=REC.split("\n").map(l=>{const c=l.split("|");return{key:c[0],label:c[1],scr:c[2].split(",").filter(Boolean),mod:c[3]||null,n:+c[4]||0,ent:c[5],how:c[6],path:c[7]||c[0]}});
const RUNTIME={};   /* entities added through ATLAS.addEntity */
const isNew=id=>!!(SEED[id]||RUNTIME[id]);

/* register the seeds now (this file loads before the process map), proposed unless approved earlier */
Object.keys(SEED).forEach(id=>{const d=SEED[id];if(DATAMODEL.tables[id]&&!DATAMODEL.tables[id].seed)return;
 DATAMODEL.register(id,{label:d.label,source:d.source,fields:d.fields.map(f=>Object.assign({},f)),domain:d.domain,status:A.approved[id]?"live":"proposed",ownerMod:d.ownerMod,steward:d.steward,note:d.note,seed:true})});
Object.keys(EXTD).forEach(t=>{if(DATAMODEL.tables[t])DATAMODEL.register(t,{label:DATAMODEL.tables[t].label,fields:EXTD[t].fields.map(f=>Object.assign({},f))})});

/* ---------- live record counts ---------- */
function walk(path){const p=path.split(".");let v=S;for(let i=1;i<p.length;i++){if(v==null)return null;v=v[p[i]]}return v}
function cnt(r){let v=null;try{
 if(/^S\./.test(r.path)){v=walk(r.path);if(v&&!Array.isArray(v)&&typeof v==="object"){v=Object.keys(v).reduce((a,k)=>a+(Array.isArray(v[k])?v[k].length:0),0)}}
 else if(r.path==="PROJ")v=PROJ;else if(r.path==="TASKS")v=TASKS;else if(r.path==="DEMAND")v=DEMAND;else if(r.path==="INVOICES")v=INVOICES;else if(r.path==="MEETINGS")v=MEETINGS;else if(r.path==="NODES")v=NODES;else if(r.path==="DIR")v=DIR;else if(r.path==="TEAMS")v=TEAMS;else if(r.path==="HOLIDAYS")v=HOLIDAYS;
 else if(r.path==="SKILLS")v=window.SKILLS;else if(r.path==="SVCREG")v=SVCREG;else if(r.path==="CIREG")v=CIREG;else if(r.path==="PPMRAID")v=window.PPMRAID;else if(r.path==="REQREG")v=window.REQREG;else if(r.path==="SVC_ASSETS")v=window.SVC_ASSETS;
 else if(r.path==="METRICS")v=Object.keys(METRICS);else if(r.path==="AUDIT")v=AUDIT;else if(r.path==="PROC")v=Object.keys((window.PROC&&PROC.defs)||{});else if(r.path==="DEBT")v=window.DEBT&&DEBT.items?DEBT.items():null}catch(e){v=null}
 if(Array.isArray(v))return v.length;return r.n}

/* what each entity gets from the catalog: used by the registry for readers and writers (static, no process map call) */
let _use=null;
function useMap(){if(_use&&_use.k===DATAMODEL.tables&&_use.n===RECS.length)return _use.m;const m={};
 const add=(e,k,id)=>{if(!id)return;(m[e]=m[e]||{r:[],w:[]})[k].includes(id)||m[e][k].push(id)};
 Object.keys(SEED).forEach(id=>add(id,"w",SEED[id].ownerMod));
 RECS.forEach(r=>{if(r.mod)add(r.ent,"w",r.mod)});
 Object.keys(RUNTIME).forEach(id=>{const t=DATAMODEL.tables[id];if(t&&t.ownerMod)add(id,"w",t.ownerMod)});
 _use={k:DATAMODEL.tables,n:RECS.length,m};return m}
function use(t){return useMap()[t]||null}

/* ================= PART 2: ENGINE ================= */
const entMap=()=>{const m=new Map();PLAT.entities().forEach(e=>m.set(e.id,e));return m};
const scrMods=()=>{const m={};MODMAP.modules.forEach(x=>m[x.id]=x);return m};
function stateOfEnts(es){/* live beats proposed */ if(!es.length)return"none";return es.some(e=>!e.proposed)?"live":"proposed"}

let _cache=null,_ck="";
function coverage(o){o=o||{};const key=[DMV(),DATAMODEL.cnt(),Object.keys(A.approved).length,Object.keys(A.confirmed).length,MODMAP.flows.length,MODMAP.modules.length,Object.keys(RUNTIME).length].join("|");
 if(_cache&&_ck===key&&!o.fresh)return _cache;
 const after=compute(false),before=compute(true);
 _ck=key;_cache=Object.assign({},after,{before:before.stats,after:after.stats,stats:after.stats});return _cache}
const DMV=()=>{try{return window.ATLAS&&ATLAS._dmv?ATLAS._dmv():0}catch(e){return 0}};

function compute(base){
 const EM=entMap(),MODS=MODMAP.modules,MB=scrMods();
 const ent=id=>{const e=EM.get(id);if(!e)return null;if(base&&isNew(id))return null;return e};
 const resolve=(id,viaAlias)=>{let e=ent(id);if(e)return{e,via:"direct"};if(!base){const a=ALIAS[id];if(a){e=ent(a);if(e)return{e,via:"alias"}}}return null};
 /* fields: count of unreviewed labels, base mode ignores extension fields and confirmations */
 const fieldStat=e=>{let n=0,def=0;(e.fields||[]).forEach(f=>{if(base&&f.ext)return;n++;const m=PLAT.fieldMeta(e.id,f);if(m.basis==="default"||(base&&m.basis==="confirmed"&&!f.authority))def++});return{n,def}};
 /* flows */
 const flows=MODMAP.flows.map(f=>{const ents=[];let via="none";
  f.refs.forEach(r=>{const x=resolve(r.id);if(x&&!ents.includes(x.e)){ents.push(x.e);via=x.via==="alias"&&via==="none"?"alias":"registry"}});
  if(!ents.length&&!base){const id=FLOWMAP[f.from+">"+f.to];const e=id&&ent(id);if(e){ents.push(e);via="assigned"}}
  return{f,ents,state:stateOfEnts(ents),via}});
 const flowBy={};flows.forEach(x=>{(flowBy[x.f.from]=flowBy[x.f.from]||[]).push(x);(flowBy[x.f.to]=flowBy[x.f.to]||[]).push(x)});
 /* records */
 const recs=RECS.map(r=>{let e=ent(r.ent),st="none",cov=false;
  if(e){st=e.proposed?"proposed":"live";cov=base?(r.how==="direct"):true}
  if(r.how==="derived"&&e)cov=!base;
  return{r,e,st:cov?st:"none",cov}});
 /* modules */
 const recByMod={};recs.forEach(x=>{if(x.r.mod)(recByMod[x.r.mod]=recByMod[x.r.mod]||[]).push(x)});
 const owners=new Map();   /* entity id -> modules that own it */
 const addOwn=(eid,m)=>{if(!owners.has(eid))owners.set(eid,new Set());owners.get(eid).add(m)};
 MODS.forEach(m=>{m.w.forEach(eid=>{if(ent(eid))addOwn(eid,m.id)})});
 PLAT.APPS.forEach(a=>a.writes.forEach(eid=>{if(ent(eid))addOwn(eid,a.id)}));
 if(!base){recs.forEach(x=>{if(x.r.mod&&x.e)addOwn(x.e.id,x.r.mod)});Object.keys(SEED).concat(Object.keys(RUNTIME)).forEach(id=>{const t=DATAMODEL.tables[id];if(t&&t.ownerMod&&EM.get(id))addOwn(id,t.ownerMod)})}
 const modRows=MODS.map(m=>{
  const mr=recByMod[m.id]||[],fl=flowBy[m.id]||[];
  const ownedIds=new Set(m.w.filter(eid=>ent(eid)));mr.forEach(x=>{if(x.e&&x.cov)ownedIds.add(x.e.id)});
  if(!base)owners.forEach((set,eid)=>{if(set.has(m.id))ownedIds.add(eid)});
  const owned=[...ownedIds].map(id=>EM.get(id)).filter(Boolean);
  const fs=owned.reduce((a,e)=>{const s=fieldStat(e);a.n+=s.n;a.def+=s.def;return a},{n:0,def:0});
  const noRec=mr.filter(x=>!x.cov),noFlow=fl.filter(x=>x.state==="none");
  const labelBad=owned.filter(e=>fieldStat(e).def>0);
  const usesProp=owned.some(e=>e.proposed)||mr.some(x=>x.st==="proposed")||fl.some(x=>x.state==="proposed");
  const chk={entities:owned.length>0||mr.length===0,records:noRec.length===0,flows:noFlow.length===0,labels:labelBad.length===0};
  const gaps=[];
  if(!chk.entities)gaps.push("No registered entity owned by this module");
  if(noRec.length)gaps.push(noRec.length+" record collection"+(noRec.length===1?"":"s")+" not in the model: "+noRec.slice(0,3).map(x=>x.r.label).join(", "));
  if(noFlow.length)gaps.push(noFlow.length+" flow"+(noFlow.length===1?"":"s")+" with no entity");
  if(labelBad.length)gaps.push(fs.def+" field label"+(fs.def===1?"":"s")+" on "+labelBad.length+" entit"+(labelBad.length===1?"y":"ies")+" not yet reviewed");
  const struct=chk.entities&&chk.records&&chk.flows,ok=struct&&chk.labels;
  return{id:m.id,name:m.name,sn:m.sn,band:m.band,bi:m.bi,owner:m.own,screen:m.scr,owned:owned.map(e=>e.id),entities:owned.length,
   read:[...new Set(m.r.filter(eid=>ent(eid)).concat(fl.filter(x=>x.f.to===m.id).flatMap(x=>x.ents.map(e=>e.id))))],
   write:owned.map(e=>e.id),records:mr.length,recordsMissing:noRec.length,flows:fl.length,flowsMissing:noFlow.length,fields:fs.n,fieldsDefault:fs.def,
   chk,struct,usesProp,state:!struct?"gaps":usesProp?"proposed":ok?"full":"labels",gaps}});
 /* screens */
 const scr=SCREENS.map(s=>{const rs=recs.filter(x=>x.r.scr.includes(s[0]));
  const miss=rs.filter(x=>!x.cov);const st=!rs.length?"none":miss.length?"gaps":rs.some(x=>x.st==="proposed")?"proposed":"full";
  return{id:s[0],name:s[1],group:s[3],records:rs,missing:miss,state:st,inMap:!!MB[s[0]]}});
 /* entities */
 const entRows=[...EM.values()].filter(e=>!(base&&isNew(e.id))).map(e=>{const s=fieldStat(e);const own=owners.get(e.id);return{e,fields:s.n,def:s.def,owners:own?[...own]:[],hasOwner:!!(own&&own.size)}});
 const missing=PLAT.PLANNED.filter(p=>{if(base)return !EM.has(p[0])||isNew(p[0]);return !EM.has(p[0])&&!ALIAS[p[0]]});
 /* stats */
 const nm=MODS.length,full=modRows.filter(m=>m.struct&&!m.usesProp).length,prop=modRows.filter(m=>m.struct&&m.usesProp).length,fullAll=modRows.filter(m=>m.struct&&m.chk.labels).length;
 const fl_l=flows.filter(x=>x.state==="live").length,fl_p=flows.filter(x=>x.state==="proposed").length;
 const sb=scr.filter(s=>s.state!=="none"),sl=sb.filter(s=>s.state==="full").length,sp=sb.filter(s=>s.state==="proposed").length;
 const allF=entRows.reduce((a,x)=>a+x.fields,0),defF=entRows.reduce((a,x)=>a+x.def,0);
 const stats={modTotal:nm,modFull:full+prop,modStruct:full+prop,modLive:full,modProposed:prop,modLabelsOk:fullAll,modGaps:nm-full-prop,
  flowTotal:flows.length,flowLive:fl_l,flowProposed:fl_p,flowNone:flows.length-fl_l-fl_p,flowCovered:fl_l+fl_p,
  scrTotal:SCREENS.length,scrRec:sb.length,scrFull:sl+sp,scrLive:sl,scrProposed:sp,scrGaps:sb.length-sl-sp,scrNone:scr.length-sb.length,
  recTotal:recs.length,recCovered:recs.filter(x=>x.cov).length,
  entTotal:entRows.length,entProposed:entRows.filter(x=>x.e.proposed).length,entNoOwner:entRows.filter(x=>!x.hasOwner).length,
  fieldTotal:allF,fieldDefault:defF,fieldClassified:allF-defF,missing:missing.length,
  modPct:pc(full+prop,nm),flowPct:pc(fl_l+fl_p,flows.length),scrPct:pc(sl+sp,sb.length),classPct:pc(allF-defF,allF),
  modLivePct:pc(full,nm),flowLivePct:pc(fl_l,flows.length),scrLivePct:pc(sl,sb.length)};
 return{modules:modRows,flows,screens:scr,records:recs,entities:entRows,missing,stats,owners}}

/* gaps, each with a remediation and an owner. Click opens the module or entity. */
let _gaps=null,_gk="";
function gaps(){const c=coverage();const k=_ck+"|"+Object.keys(RUNTIME).length;if(_gaps&&_gk===k)return _gaps;const g=[];let n=0;
 const push=(o)=>{o.id="g"+(++n);g.push(o)};
 c.modules.forEach(m=>{
  if(m.state==="gaps"){m.gaps.filter(t=>!/field label/.test(t)).forEach(t=>push({kind:"Module",sev:/No registered|not in the model/.test(t)?"High":/flow/.test(t)?"Medium":"Low",title:m.name+": "+t,mod:m.id,target:{type:"module",id:m.id},
   action:/field label/.test(t)?"A steward confirms the default labels for this module's entities (one click per entity, or per domain).":/flow/.test(t)?"Name the entity each flow carries in the process map, or approve the proposed entity.":/record/.test(t)?"Define the entity from the record's fields and approve it.":"Assign the module an owned entity.",owner:m.owner||"Module owner"}))}
  else if(m.state==="proposed"&&m.owned.some(id=>(PLAT.ent(id)||{}).proposed)){push({kind:"Module",sev:"Info",title:m.name+" depends on proposed entities",mod:m.id,target:{type:"module",id:m.id},action:"Approve the proposed entities this module relies on ("+m.owned.filter(id=>(PLAT.ent(id)||{}).proposed).slice(0,3).join(", ")+").",owner:"Data council chair"})}});
 c.screens.forEach(s=>{if(s.state==="gaps")s.missing.forEach(x=>push({kind:"Screen record",sev:"High",title:s.name+": "+x.r.label+" ("+x.r.path+") is not in the model",mod:x.r.mod,target:{type:"screen",id:s.id},action:"Define an entity for these "+(cnt(x.r))+" records or map them to "+(x.r.ent||"an existing entity")+".",owner:"Registry steward"}))});
 c.flows.forEach(x=>{if(x.state==="none")push({kind:"Flow",sev:"Medium",title:x.f.from+" to "+x.f.to+": "+x.f.data+" has no entity",mod:x.f.from,target:{type:"module",id:x.f.from},action:"Add the entity this flow carries in the process map.",owner:"Process governance lead"})});
 c.entities.forEach(x=>{if(!x.hasOwner&&x.e.id.indexOf("config_item")!==0)push({kind:"Entity owner",sev:"Medium",title:x.e.label+" has no owning module",target:{type:"entity",id:x.e.id},action:"Name the module that writes it, or retire the entity.",owner:x.e.steward});
  if(x.def>0)push({kind:"Field labels",sev:x.def>x.fields/2?"Medium":"Low",title:x.e.label+": "+x.def+" of "+x.fields+" fields carry a default label",target:{type:"entity",id:x.e.id},action:"The Registry Agent proposed labels from field names; "+x.e.steward+" confirms them.",owner:x.e.steward,confirm:x.e.id,fieldsDefault:x.def})});
 c.missing.forEach(p=>push({kind:"Undefined entity",sev:"Low",title:p[2]+" is planned but not defined",target:{type:"planned",id:p[0]},action:WHYNOT[p[0]]||"Define it from the first module that needs it.",owner:p[3]}));
 c.entities.filter(x=>x.e.proposed).forEach(x=>push({kind:"Proposed",sev:"Info",title:x.e.label+" is proposed and waits for approval",target:{type:"entity",id:x.e.id},action:"Review the fields, then approve to make it live.",owner:x.e.steward,approve:x.e.id}));
 discover().forEach(d=>push({kind:"Unmapped records",sev:"High",title:d.path+" holds "+d.n+" records no entity describes",target:{type:"unmapped",id:d.path},action:"Map the collection to an entity or define a new one.",owner:"Registry steward"}));
 dupes().forEach(d=>push({kind:"Duplicate",sev:"Medium",title:d.title,target:d.target,action:d.action,owner:d.owner}));
 _gaps=g;_gk=k;return g}

/* record collections on S that no catalog entry covers: found by walking the state */
let _disc=null,_dk=-1;
function discover(){const k=Object.keys(S).length+"|"+RECS.length;if(_disc&&_dk===k)return _disc;const out=[];const known=RECS.filter(r=>/^S\./.test(r.path)).map(r=>r.path);
 const SKIP=/(^|\.)_|\.alloc\.|\.sel$|\.ov$|\.seq$|\.hist$|\.saved$|\.log$|\.cabLog$|\.camps$|\.tasks$|\.errors$|\.team$|\.acc$|\.cards$/;
 const seen=new Set();
 (function w(o,pre,d){if(d>3||!o||typeof o!=="object")return;Object.keys(o).forEach(key=>{const v=o[key],p=pre+key;
   if(Array.isArray(v)){if(v.length&&typeof v[0]==="object"&&v[0]&&!Array.isArray(v[0])&&v[0].id!==undefined){if(SKIP.test(p)||known.some(kp=>p===kp||p.indexOf(kp+".")===0||kp.indexOf(p+".")===0))return;if(!seen.has(p)){seen.add(p);out.push({path:p,n:v.length})}}}
   else if(v&&typeof v==="object"&&Object.keys(v).length<80)w(v,p+".",d+1)})})(S,"S.",0);
 _disc=out;_dk=k;return out}

/* real duplicate concepts the audit found. Logged once to the debt ledger. */
const DUPS=[
 {key:"people3",title:"Three people lists: the directory (DIR), the planning copy (S.ppl.people) and the demo roster (PEOPLE)",ents:["person"],mods:["ppl_org","ppl_cap"],fix:"Read people from the directory only; the planning screens keep allocations, not people.",action:"Retire the planning copy and point it at Person.",owner:"Head of People Operations",sev:"High"},
 {key:"conn2",title:"Two connector lists: the integration hub (S.flw.conns) and the fabric (S.fab.conns)",ents:["connector"],mods:["plat_fab"],fix:"One connector catalog; the hub and the fabric are two views of it.",action:"Merge into Connector.",owner:"Integration lead",sev:"Medium"},
 {key:"deleg2",title:"Two delegation stores: chat delegations (S.chx.deleg) and out of office (S.flw.apx.ooo)",ents:["delegation"],mods:["flw_appr","chat_home"],fix:"One Delegation entity read by the approvals inbox and chat.",action:"Merge into Delegation.",owner:"Process governance lead",sev:"Medium"},
 {key:"wq2",title:"Work queue stored twice (S.ppl.work and S.pp2.org.wq)",ents:["project_task"],mods:["ppl_cap","ppl_org"],fix:"Both screens read the same queue.",action:"Keep one queue.",owner:"Resource manager",sev:"Low"},
 {key:"risk3",title:"Risk is kept in three places: enterprise risks (S.exe.risks), project RAID (PPMRAID) and the RAID log const",ents:["raid_item"],mods:["exe_risk","ppm_raid"],fix:"Enterprise risks become RAID items with level Enterprise.",action:"Apply the Raid item extension and migrate.",owner:"Risk manager",sev:"Medium"},
 {key:"req2",title:"Resource requests kept twice (S.ppm.reqs and S.pp2.cap.reqs)",ents:["resource_request"],mods:["ppm_proj","ppl_cap"],fix:"One Resource request entity.",action:"Merge into Resource request.",owner:"Resource manager",sev:"Low"},
 {key:"jr2",title:"Journey maps kept twice (S.ppl.jr.list and S.pp2.jy.list)",ents:["journey_map"],mods:["ppl_jrny"],fix:"One Journey map entity.",action:"Merge into Journey map.",owner:"Service portfolio manager",sev:"Low"},
 {key:"vend2",title:"Vendors exist as Company records in the CMDB, as vendor rows (S.bud.vend) and as plain text on invoices and contracts",ents:["core_company"],mods:["bud_ven"],fix:"Vendors are Company records with vendor fields.",action:"Apply the Company extension; invoices point to Company.",owner:"Procurement lead",sev:"Medium"}];
function dupes(){return DUPS.map(d=>({title:d.title,target:{type:"entity",id:d.ents[0]},action:d.action,owner:d.owner,d}))}
function logDebt(){if(!window.DEBT||!DEBT.add)return 0;let n=0;DUPS.forEach(d=>{if(A.debtLogged[d.key])return;
  try{const id=DEBT.add({type:"dup_entity",title:d.title,sev:d.sev,source:"coverage audit",ents:d.ents,apps:d.mods.filter(m=>PLAT.app(m)),owner:d.owner,steward:d.owner,principal:8,fix:d.fix,note:"Found by the Master data model coverage audit."});if(id){A.debtLogged[d.key]=id;n++}}catch(e){}});
 return n}

/* summary used by the hero */
function summary(){const c=coverage();return{before:c.before,after:c.after,modTotal:c.after.modTotal,proposed:c.after.entProposed,gapsOpen:gaps().filter(g=>g.kind!=="Proposed"&&g.kind!=="Field labels"&&!(g.kind==="Module"&&g.sev==="Info")).length,all:c}}

/* ---------- addEntity: reuse first, then register ---------- */
const GENERIC=new Set(["id","name","number","state","status","type","kind","owner","title","description","created","updated","date","notes","note","reason","version","category","scope","key","label","value","amount","from","to","start","end","due","project","service","person","team","manager","user","role","text","detail"]);
const nrm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
const stm=s=>nrm(s).split("_").filter(w=>w.length>2).map(w=>w.replace(/(ies)$/,"y").replace(/s$/,""));
function addEntity(d){
 const warnings=[],duplicates=[];d=d||{};
 const id=nrm(d.id||d.label);if(!id){return{ok:false,id:null,duplicates,warnings:["An entity needs an id or a label."]}}
 if(DATAMODEL.tables[id]&&!(SEED[id]&&DATAMODEL.tables[id].seed)){return{ok:false,id,duplicates:[{field:"(entity)",existing:id}],warnings:["An entity with this id already exists. Extend it instead of defining it again."]}}
 const label=d.label||id.replace(/_/g," ").replace(/^./,c=>c.toUpperCase());
 const fields=(d.fields||[]).filter(f=>f&&f.k);if(!fields.length)warnings.push("No fields were given. The entity is defined but empty; add fields before approval.");
 /* field level: same key or same meaning (label words) with the same type in another entity */
 const EMp=entMap(),idx=new Map(),idxL=new Map();
 EMp.forEach(e=>(e.fields||[]).forEach(f=>{const k=nrm(f.k);if(!GENERIC.has(k)){(idx.get(k)||idx.set(k,[]).get(k)).push(e.id+"."+f.k)}const l=stm(f.label).join("_");if(l&&stm(f.label).length>=2)(idxL.get(l)||idxL.set(l,[]).get(l)).push(e.id+"."+f.k)}));
 const perEnt={};
 fields.forEach(f=>{const k=nrm(f.k),l=stm(f.label||f.k).join("_");let hit=null;
  if(!GENERIC.has(k)&&idx.has(k))hit=idx.get(k)[0];else if(stm(f.label||f.k).length>=2&&idxL.has(l))hit=idxL.get(l)[0];
  if(hit){duplicates.push({field:f.k,existing:hit});const en=hit.split(".")[0];perEnt[en]=(perEnt[en]||0)+1}});
 Object.keys(perEnt).forEach(en=>{if(perEnt[en]>=2&&perEnt[en]>=Math.ceil(fields.length*.4))warnings.push("Reuse first: "+perEnt[en]+" of "+fields.length+" fields already exist on "+((EMp.get(en)||{}).label||en)+". Extend that entity instead of defining a near duplicate.")});
 /* entity level */
 try{const rc=PLAT.reuseCheck(label,fields.map(f=>f.k+" "+(f.label||"")).join(" "));rc.filter(h=>h.kind==="existing"&&h.sc>=.5&&h.id!==id).forEach(h=>{duplicates.push({field:"(entity)",existing:h.id});warnings.push("Close match to "+h.label+" ("+Math.round(h.sc*100)+"% of the words). Check that it is not the same concept.")})}catch(e){}
 const AU=["platform","external","shared"],CL=["public","internal","confidential","restricted","personal"];
 let fixed=0;
 const fl=fields.map(f=>{let au=AU.includes(f.authority)?f.authority:null,cl=CL.includes(f.classification)?f.classification:null;if(!au||!cl)fixed++;
  return Object.assign({},f,{type:FT[f.type]||f.type||"string",authority:au||"platform",classification:cl||INFCLS(f.k,f.label||"",""),label:f.label||f.k,proposed:true})});
 if(fixed)warnings.push(fixed+" field"+(fixed===1?"":"s")+" had no authority or classification; defaults were applied and need a steward's review.");
 const domain=d.domain||(/^fin_/.test(id)?"money":"plat");if(window.PLAT&&PLAT.ensureDom)PLAT.ensureDom(domain);
 const live=d.status==="live";
 RUNTIME[id]=true;
 DATAMODEL.register(id,{label,source:d.source||d.ownerApp||"Added at runtime",fields:fl,domain,status:live?"live":"proposed",ownerMod:d.ownerMod||d.module||null,steward:d.steward,note:d.note||"Added at runtime by "+(d.ownerApp||d.source||"a module")+".",seed:false});
 if(live)A.approved[id]=Date.now();
 audit("Entity "+(live?"added":"proposed"),label+" ("+id+")"+(duplicates.length?", "+duplicates.length+" possible duplicate fields":""));
 return{ok:true,id,duplicates,warnings}}

function approve(id,quiet){const t=DATAMODEL.tables[id];if(!t)return false;A.approved[id]=Date.now();t.status="live";
 t.fields.forEach(f=>{if(f.proposed)delete f.proposed});
 if(window.PLAT&&PLAT.refresh)PLAT.refresh();if(window.ATLAS&&ATLAS.bump)ATLAS.bump();
 audit("Entity approved and made live",(t.label||id)+" ("+id+")");if(!quiet){toast("Approved: "+(t.label||id),"good");render()}return true}
function approveMany(ids){let n=0;ids.forEach(id=>{if(approve(id,true))n++});toast(n+" entities approved","good");render()}
function confirmLabels(id){const t=DATAMODEL.tables[id];if(!t)return;A.confirmed[id]=Date.now();if(window.PLAT&&PLAT.refresh)PLAT.refresh();if(window.ATLAS&&ATLAS.bump)ATLAS.bump();audit("Field labels confirmed by steward",t.label||id);toast("Labels confirmed for "+(t.label||id),"good");render()}

window.COVER={coverage,summary,addEntity,approve,confirmLabels,use,alias:ALIAS,seeds:SEED,gaps,recs:RECS,whyNot:WHYNOT,compute,discover,logDebt,counts:cnt,coverPane,matrixPane,modDrawer,gapDrawer,usageDrawer};

/* ---------- metrics ---------- */
const rem=(ref,title,agent,prog)=>({kind:"agent",ref,title,agent,auto:false,state:"idle",prog});
Object.assign(METRICS,{
 m_cov_module:{n:"Modules covered by the data model",f:"Modules that own a registered entity, whose record collections and flows all map to a registered entity ÷ all modules in the process map × 100",u:"%",cur:0,tgt:100,badAt:50,dir:"max",max:100,tr:[10,10,12,12,12,15,15,15],owner:"Data council",use:["Master data model"],rem:rem("RB-COV1","Define or approve the missing entity","Registry Agent","Drafts the entity from the record's fields; the data council approves")},
 m_cov_flow:{n:"Flows that carry a registered entity",f:"Flows between modules that name a registered entity ÷ all flows × 100",u:"%",cur:0,tgt:100,badAt:70,dir:"max",max:100,tr:[70,72,76,78,79,80,80,80],owner:"Process governance lead",use:["Master data model","Master process flow"],rem:rem("RB-COV2","Name the entity each flow carries","Registry Agent","Matches the flow text to an entity and proposes it")},
 m_cov_screen:{n:"Screens whose records are in the model",f:"Screens that hold records and whose record collections all map to an entity ÷ screens that hold records × 100",u:"%",cur:0,tgt:100,badAt:60,dir:"max",max:100,tr:[40,42,45,48,50,52,52,52],owner:"Data council",use:["Master data model"],rem:rem("RB-COV3","Map the record collection to an entity","Registry Agent","Reads the collection's fields and proposes an entity")},
 m_cov_class:{n:"Fields with a reviewed label",f:"Fields whose authority and classification come from a rule, a declaration or a steward's confirmation ÷ all fields × 100",u:"%",cur:0,tgt:95,badAt:40,dir:"max",max:100,tr:[20,22,24,26,28,30,30,30],owner:"Data council",use:["Master data model","Platform registry"],rem:rem("RB-COV4","Confirm the proposed labels","Registry Agent","Proposes a label from field names; the steward confirms")},
 m_cov_prop:{n:"Proposed entities waiting for approval",f:"Count of entities defined with status Proposed and not yet approved",u:"",cur:0,tgt:0,badAt:40,dir:"min",max:80,tr:[0,0,0,0,0,0,0,0],owner:"Data council chair",use:["Master data model"],rem:rem("RB-COV5","Review and approve the proposed entities","Registry Agent","Lists the fields and the modules that depend on each one")}});
function syncM(c){const s=c.stats,set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=v;m.tr=m.tr.slice(0,-1).concat([v])};set("m_cov_module",s.modPct);set("m_cov_flow",s.flowPct);set("m_cov_screen",s.scrPct);set("m_cov_class",s.classPct);set("m_cov_prop",s.entProposed)}

/* ================= PART 3: VIEWS ================= */
const STP={labels:["Covered, field labels to review","warn"],full:["Covered","good"],proposed:["Covered by proposed entities","info"],gaps:["Gaps","warn"],none:["No own records","mute"],live:["Live","good"]};
const bar=(live,prop,total,labels)=>{const l=pc(live,total),p=pc(prop,total);return `<div class="cv-bar" role="img" aria-label="${E(labels||"")}"><i class="l" style="width:${l}%"></i><i class="p" style="width:${p}%"></i></div>`};
const legendBar=()=>legend([["Live and approved","--good-f"],["Defined, waiting for approval","--p4"],["Gap","--faint"]]);
function tile(label,aft,bef,total,live,prop,metric,note){const d=aft-bef;return `<div class="cv-tile"><div class="row sp"><b>${E(label)}</b>${metric?fchip(metric):""}</div><div class="cv-big"><span class="num" data-role="metric">${aft}%</span><span class="muted small">was <b>${bef}%</b> before${d>0?` <span class="pill good">+${d} points</span>`:""}</span></div>${bar(live,prop,total,label)}<p class="small muted" data-role="story">${E(note)}</p></div>`}
function coverPane(){
 const c=coverage(),s=c.stats,b=c.before;syncM(c);
 setTimeout(()=>{if(logDebt()&&S.screen==="plat_data"){}},50);
 const g=gaps();const open=g.filter(x=>x.kind!=="Proposed"&&x.kind!=="Field labels"&&!(x.kind==="Module"&&x.sev==="Info"));
 const kp=kpiRow([["Modules covered",s.modFull+" of "+s.modTotal,"was "+b.modFull+" before",{metric:"m_cov_module",keep:true}],["Screens with records covered",s.scrFull+" of "+s.scrRec,"was "+b.scrFull+" before",{metric:"m_cov_screen",keep:true}],["Flows with an entity",s.flowCovered+" of "+s.flowTotal,"was "+b.flowCovered+" before",{metric:"m_cov_flow",keep:true}],["Proposed entities",s.entProposed,"waiting for approval",{metric:"m_cov_prop",keep:true,cls:s.entProposed?"warn":"good"}],["Open gaps",open.length,"each has an owner",{cls:open.length?"bad":"good",keep:true}]]);
 const story=`<div class="story" data-role="story"><b>Answer.</b> No, the model did not include every module. Before this audit it carried the entities, records and flows of <b>${b.modFull} of ${s.modTotal}</b> modules, <b>${b.scrFull} of ${b.scrRec}</b> screens that hold records and <b>${b.flowCovered} of ${b.flowTotal}</b> flows between modules. It now carries <b>${s.modFull}</b>, <b>${s.scrFull}</b> and <b>${s.flowCovered}</b> (${s.modTotal-s.modFull} modules still have gaps), because <b>${s.entProposed}</b> missing entities are defined as <i>Proposed</i> and extensions were made to existing ones. Nothing is live until the data council approves it. What is left is listed below with an owner.</div>`;
 const tiles=`<div class="cv-tiles">${tile("Module coverage",s.modPct,b.modPct,s.modTotal,s.modLive,s.modProposed,"m_cov_module","A module counts when it owns a registered entity, every record collection on its screens is in the model and every flow it takes part in carries an entity. "+s.modLabelsOk+" of them also have every field label reviewed.")}${tile("Screen records",s.scrPct,b.scrPct,s.scrRec,s.scrLive,s.scrProposed,"m_cov_screen",s.scrRec+" screens hold their own records; "+s.scrNone+" only show other modules' data.")}${tile("Flow to entity",s.flowPct,b.flowPct,s.flowTotal,s.flowLive,s.flowProposed,"m_cov_flow",s.flowNone+" flows still carry data no entity describes.")}${tile("Reviewed field labels",s.classPct,b.classPct,s.fieldTotal,s.fieldClassified,0,"m_cov_class",N0(s.fieldDefault)+" fields still show a default label that a steward has not reviewed.")}</div>`;
 /* gap summary by kind */
 const kinds={};g.forEach(x=>{(kinds[x.kind]=kinds[x.kind]||{n:0,h:0});kinds[x.kind].n++;if(x.sev==="High")kinds[x.kind].h++});
 const kc=Object.keys(kinds).map(k=>`<button class="cv-kind" data-cov-kind="${E(k)}"><b class="num">${kinds[k].n}</b><span>${E(k)}</span>${kinds[k].h?`<small class="pill bad">${kinds[k].h} high</small>`:""}</button>`).join("");
 const ba=`<div class="tscroll"><table class="cv-ba"><thead><tr><th>What</th><th class="num">Before</th><th class="num">Now</th><th>Closed by</th></tr></thead><tbody>
  <tr><td>Modules fully covered</td><td class="num">${b.modFull} of ${s.modTotal}</td><td class="num">${s.modFull} of ${s.modTotal}</td><td class="small">${s.modLive} live, ${s.modProposed} on proposed entities</td></tr>
  <tr><td>Screens that hold records, covered</td><td class="num">${b.scrFull} of ${b.scrRec}</td><td class="num">${s.scrFull} of ${s.scrRec}</td><td class="small">${s.recCovered-b.recCovered} record collections mapped</td></tr>
  <tr><td>Flows with a registered entity</td><td class="num">${b.flowCovered} of ${b.flowTotal}</td><td class="num">${s.flowCovered} of ${s.flowTotal}</td><td class="small">${s.flowCovered-b.flowCovered} flows assigned an entity</td></tr>
  <tr><td>Entities in the model</td><td class="num">${b.entTotal}</td><td class="num">${s.entTotal}</td><td class="small">${s.entProposed} proposed, ${Object.keys(EXTD).length} extended</td></tr>
  <tr><td>Entities with no owning module</td><td class="num">${b.entNoOwner}</td><td class="num">${s.entNoOwner}</td><td class="small">owners taken from the record catalog</td></tr>
  <tr><td>Fields with a reviewed label</td><td class="num">${b.fieldClassified} of ${b.fieldTotal}</td><td class="num">${s.fieldClassified} of ${s.fieldTotal}</td><td class="small">new fields are declared</td></tr>
  <tr><td>Core entities still undefined</td><td class="num">${b.missing}</td><td class="num">${s.missing}</td><td class="small">${s.missing} need a decision first</td></tr></tbody></table></div>`;
 const byDom={};c.entities.forEach(x=>{if(x.def>0){const d=byDom[x.e.domain]=byDom[x.e.domain]||{e:0,f:0};d.e++;d.f+=x.def}});
 const lbl=Object.keys(byDom).length?`<ul class="at-ul">${Object.keys(byDom).map(d=>`<li><span><b>${E((PLAT.DOM[d]||{n:d}).n)}</b> <small class="muted">${byDom[d].e} entities, ${N0(byDom[d].f)} fields</small></span><button class="btn quiet" data-cov-confirmdom="${E(d)}">Confirm labels</button></li>`).join("")}</ul><div class="row" style="margin-top:8px"><button class="btn primary" data-cov-confirmdom="*">Confirm all ${N0(s.fieldDefault)}</button></div>`:`<p class="muted small">Every field label has been reviewed.</p>`;
 const dash=`${kp}${story}${tiles}${card("Before and after","Counted the same way, from the same code",ba)}<div class="cv-two">${card("Gaps by kind","Select one to see the list",`<div class="cv-kinds">${kc}</div>`)}${card("Field labels waiting for a steward",N0(s.fieldDefault)+" fields carry a default label",`<p class="small muted">The Registry Agent proposed these labels from field names. A steward confirms them by domain; each confirmation is audited. Nothing is confirmed automatically.</p>${lbl}`)}</div>${legendBar()}`;
 const gapTbl=btHTML({id:"cov_gaps",h:520,rowH:64,key:"id",exportName:"model-coverage-gaps",facets:["kind","sev","owner"],groupBy:["kind","owner"],cols:[
  {k:"kind",label:"Kind",val:r=>r.kind,fmt:r=>pill_(r.kind,r.sev==="High"?"bad":r.sev==="Medium"?"warn":r.sev==="Info"?"info":"mute")},
  {k:"title",label:"Gap",val:r=>r.title,wrap:true,w:360,fmt:r=>`<b>${E(r.title)}</b>`},
  {k:"sev",label:"Severity",val:r=>r.sev,fmt:r=>E(r.sev)},
  {k:"action",label:"Remediation",val:r=>r.action,wrap:true,w:360,fmt:r=>E(r.action)},
  {k:"owner",label:"Owner",val:r=>r.owner,wrap:true,fmt:r=>E(r.owner)}],rows:()=>gaps(),open:id=>gapDrawer(id)});
 const propRows=()=>c2().entities.filter(x=>x.e.proposed).map(x=>({id:x.e.id,label:x.e.label,domain:x.e.domain,nf:x.e.nf,steward:x.e.steward,mod:x.owners[0]||(x.e.ownerMod||""),note:x.e.note}));
 const c2=()=>coverage();
 const propTbl=btHTML({id:"cov_prop",h:520,rowH:60,key:"id",exportName:"proposed-entities",facets:["domain"],cols:[
  {k:"label",label:"Proposed entity",val:r=>r.label,wrap:true,w:240,fmt:r=>`<b>${E(r.label)}</b><div class="muted small">${E(r.id)}</div>`},
  {k:"domain",label:"Domain",val:r=>r.domain,fmt:r=>E((PLAT.DOM[r.domain]||{n:r.domain}).n)},
  {k:"nf",label:"Fields",val:r=>r.nf,fmt:r=>r.nf},
  {k:"mod",label:"Owning module",val:r=>r.mod,fmt:r=>E(modName(r.mod))},
  {k:"steward",label:"Steward",val:r=>r.steward,wrap:true,fmt:r=>E(r.steward)},
  {k:"note",label:"Why it is needed",val:r=>r.note,wrap:true,w:380,fmt:r=>E(r.note)},
  {k:"a",label:"",val:r=>0,fmt:r=>`<button class="btn primary" data-cov-approve="${E(r.id)}">Approve</button>`}],rows:propRows,open:id=>{const e=PLAT.ent(id);if(e)ATLAS.focus(id)}});
 const recRows=c.records.map((x,i)=>({id:x.r.key+i,label:x.r.label,path:x.r.path,scr:x.r.scr.map(scrName).join(", "),n:cnt(x.r),ent:x.e?x.e.label:x.r.ent,how:x.r.how,st:x.cov?x.st:"gap",mod:x.r.mod,entId:x.r.ent}));
 const recTbl=btHTML({id:"cov_rec",h:520,rowH:52,key:"id",exportName:"record-collections",facets:["how","st"],cols:[
  {k:"label",label:"Records",val:r=>r.label,wrap:true,w:220,fmt:r=>`<b>${E(r.label)}</b><div class="muted small">${E(r.path)}</div>`},
  {k:"scr",label:"Shown on",val:r=>r.scr,wrap:true,w:240,fmt:r=>E(r.scr)},
  {k:"n",label:"Rows",val:r=>r.n,fmt:r=>`<span class="num">${N0(r.n)}</span>`},
  {k:"ent",label:"Entity",val:r=>r.ent,wrap:true,fmt:r=>E(r.ent)},
  {k:"how",label:"How it maps",val:r=>r.how,fmt:r=>pill_({direct:"Already modeled",ext:"Extends an entity",alias:"A kind of an entity",new:"New entity",derived:"A view"}[r.how]||r.how,r.how==="direct"?"good":r.how==="new"?"info":"warn")},
  {k:"st",label:"State",val:r=>r.st,fmt:r=>r.st==="live"?pill_("Live","good"):r.st==="proposed"?pill_("Proposed","info"):pill_("Not in the model","bad")}],rows:()=>recRows,open:id=>{const r=recRows.find(x=>x.id===id);if(r&&r.entId&&PLAT.ent(r.entId))ATLAS.focus(r.entId)}});
 const flowRows=c.flows.map(x=>({id:x.f.id,from:modName(x.f.from),to:modName(x.f.to),data:x.f.data,ent:x.ents.map(e=>e.label).join(", ")||"None",st:x.state,via:x.via,fid:x.f.from}));
 const flowTbl=btHTML({id:"cov_flow",h:520,rowH:52,key:"id",exportName:"flow-coverage",facets:["st","via"],cols:[
  {k:"from",label:"From",val:r=>r.from,wrap:true,fmt:r=>E(r.from)},{k:"to",label:"To",val:r=>r.to,wrap:true,fmt:r=>E(r.to)},{k:"data",label:"Data",val:r=>r.data,wrap:true,w:240,fmt:r=>E(r.data)},
  {k:"ent",label:"Entity",val:r=>r.ent,wrap:true,fmt:r=>E(r.ent)},
  {k:"via",label:"Found through",val:r=>r.via,fmt:r=>E({registry:"The flow names it",alias:"An existing entity covers it",assigned:"Assigned by this audit",none:"Nothing"}[r.via]||r.via)},
  {k:"st",label:"State",val:r=>r.st,fmt:r=>r.st==="live"?pill_("Live","good"):r.st==="proposed"?pill_("Proposed","info"):pill_("No entity","bad")}],rows:()=>flowRows,open:id=>{const f=flowRows.find(x=>x.id===id);if(f){S.v.mm_v=0;go("plat_map")}}});
 const scrRows=c.screens.map(x=>({id:x.id,name:x.name,group:x.group,n:x.records.length,miss:x.missing.length,st:x.state,list:x.records.map(r=>r.r.label).join(", ")}));
 const scrTbl=btHTML({id:"cov_scr",h:520,rowH:52,key:"id",exportName:"screen-coverage",facets:["st","group"],cols:[
  {k:"name",label:"Screen",val:r=>r.name,wrap:true,w:220,fmt:r=>`<b>${E(r.name)}</b><div class="muted small">${E(r.id)}</div>`},{k:"group",label:"Group",val:r=>r.group,fmt:r=>E(r.group)},
  {k:"n",label:"Record collections",val:r=>r.n,fmt:r=>r.n},{k:"list",label:"What it holds",val:r=>r.list,wrap:true,w:320,fmt:r=>E(r.list||"Shows other modules' data")},
  {k:"st",label:"State",val:r=>r.st,fmt:r=>{const p=STP[r.st];return pill_(p[0],p[1])}}],rows:()=>scrRows,open:id=>{if(hasScr(id))go(id)}});
 const extHtml=Object.keys(EXTD).map(t=>`<div class="cv-ext"><b>${E((DATAMODEL.tables[t]||{label:t}).label)}</b> <span class="muted small">gains ${EXTD[t].fields.length} fields</span><p class="small">${E(EXTD[t].why)}</p></div>`).join("");
 const whyHtml=Object.keys(WHYNOT).map(k=>{const p=PLAT.PLANNED.find(x=>x[0]===k);return `<div class="cv-ext"><b>${E(p?p[2]:k)}</b> ${pill_("Undefined","warn")}<p class="small">${E(WHYNOT[k])}</p></div>`}).join("");
 const approveAll=`<div class="row" style="gap:8px;margin:0 0 10px"><button class="btn primary" data-cov-approveall>Approve all ${s.entProposed} proposed entities</button><span class="muted small">Or review one at a time. Approval flips the status to live and writes the audit log.</span></div>`;
 const panes=[dash,
  `<p class="muted small">Every gap has a remediation and an owner. Select a row to open the module or entity.</p>${gapTbl}`,
  `<p class="muted small">${s.entProposed} entities are defined but not live. They appear on the diagram with a dashed outline and a Proposed pill.</p>${s.entProposed?approveAll:""}${propTbl}<div class="cv-two" style="margin-top:14px">${card("Extended, not duplicated","Existing entities that gained fields instead of a near duplicate",extHtml)}${card("Still undefined, and why","These need a decision before fields can be defined",whyHtml)}</div>`,
  `<p class="muted small">Every record collection the code holds, and the entity that describes it. "Already modeled" means it was in the model before this audit.</p>${recTbl}`,
  `<p class="muted small">Every screen and whether its records are in the model.</p>${scrTbl}`,
  `<p class="muted small">Every flow between modules and the entity it carries.</p>${flowTbl}`];
 const TN=["Dashboard","Gaps and owners","Proposed entities","Record collections","Screens","Flows"];const ct=Math.min(S.v.cov||0,5);
 return `<div class="cv-root"><div class="cv-subtabs" role="tablist" aria-label="Coverage views">${TN.map((n,i)=>`<button role="tab" class="chip" aria-selected="${ct===i}" aria-pressed="${ct===i}" data-cov-tab="${i}">${n}</button>`).join("")}</div>${panes[ct]}${procCard("plat_cov")}</div>`}

const modName=id=>{try{const m=MODMAP.modules.find(x=>x.id===id);if(m)return m.name}catch(e){}return id?scrName(id):""};

/* ---------- module by domain matrix ---------- */
const band=i=>{try{return MODMAP.bands[i].name}catch(e){return""}};
function matrixPane(){
 const c=coverage(),doms=[...new Set(c.entities.map(x=>x.e.domain))];
 const order=Object.keys(PLAT.DOM);doms.sort((a,b)=>order.indexOf(a)-order.indexOf(b));
 const eById=new Map(c.entities.map(x=>[x.e.id,x.e]));
 const cell=(m,d)=>{const r=m.read.filter(id=>eById.has(id)&&eById.get(id).domain===d&&!m.write.includes(id)),w=m.write.filter(id=>eById.has(id)&&eById.get(id).domain===d);return{r,w}};
 const tot={};doms.forEach(d=>tot[d]={r:0,w:0});
 const rows=c.modules.map(m=>{const cs=doms.map(d=>{const x=cell(m,d);tot[d].r+=x.r.length;tot[d].w+=x.w.length;return x});return{m,cs}});
 const head=`<tr><th scope="col" class="cv-sticky">Module</th>${doms.map(d=>`<th scope="col"><i class="cv-dot" style="background:var(${(window.ATLAS&&ATLAS.color&&ATLAS.color(d))||"--faint"})"></i><span class="cv-th">${E(PLAT.DOM[d].n)}</span></th>`).join("")}</tr>`;
 const body=rows.map(({m,cs})=>`<tr><th scope="row" class="cv-sticky"><button class="at-lnk" data-cov-mod="${E(m.id)}">${E(m.sn||m.name)}</button><small class="muted">${E(band(m.bi))}</small></th>${cs.map((x,i)=>{const n=x.r.length+x.w.length;return `<td>${n?`<button class="cv-cell${x.w.length?" w":""}" data-cov-cell="${E(m.id)}|${E(doms[i])}" aria-label="${E(m.name)} in ${E(PLAT.DOM[doms[i]].n)}: reads ${x.r.length}, writes ${x.w.length}"><span>${x.r.length}</span><b>${x.w.length}</b></button>`:`<span class="cv-c0" aria-hidden="true">·</span>`}</td>`}).join("")}</tr>`).join("");
 const foot=`<tr class="cv-foot"><th scope="row" class="cv-sticky">All modules</th>${doms.map(d=>`<td class="num small">${tot[d].r}/${tot[d].w}</td>`).join("")}</tr>`;
 const unused=c.entities.filter(x=>!c.modules.some(m=>m.read.includes(x.e.id)||m.write.includes(x.e.id)));
 return `<div class="cv-root"><p class="muted small" data-role="story">${c.modules.length} modules by ${doms.length} domains. Each cell shows entities the module <b>reads</b> (left) and <b>writes</b> (bold, right). Writes come from the module's owned entities, reads from its data sources and from the flows that bring data in. Select a cell to list the entities, a module to open its coverage.</p>
 ${legend([["Module writes entities in the domain","--accent"],["Module only reads","--p5"]])}
 <div class="tscroll cv-mwrap"><table class="cv-mx"><thead>${head}</thead><tbody>${body}${foot}</tbody></table></div>
 ${unused.length?`<p class="small muted" style="margin-top:10px">${unused.length} entities are not read or written by any of the ${c.modules.length} mapped modules: ${unused.slice(0,10).map(x=>E(x.e.label)).join(", ")}${unused.length>10?" and more":""}. They belong to screens outside the process map.</p>`:""}</div>`}

/* ---------- drawers ---------- */
function gapDrawer(id){const g=gaps().find(x=>x.id===id);if(!g)return;const t=g.target||{};
 let btns="";
 if(t.type==="module")btns+=`<button class="btn" data-cov-mod="${E(t.id)}">Open the module coverage</button>${hasScr(t.id)?`<button class="btn quiet" data-cov-go="${E(t.id)}">Open the module screen</button>`:""}`;
 if(t.type==="entity"){btns+=`<button class="btn" data-atlas-go="${E(t.id)}">Open on the data diagram</button><button class="btn quiet" data-cov-mods="${E(t.id)}">Which modules use it</button>`}
 if(t.type==="screen")btns+=`<button class="btn" data-cov-go="${E(t.id)}">Open the screen</button>`;
 if(t.type==="planned")btns+=`<button class="btn" data-go-reg="1">Open the registry</button>`;
 if(g.approve)btns+=`<button class="btn primary" data-cov-approve="${E(g.approve)}">Approve and make live</button>`;
 if(g.confirm)btns+=`<button class="btn primary" data-cov-confirm="${E(g.confirm)}">Confirm the proposed labels</button>`;
 openDrawer(`<div class="eyebrow">${E(g.kind)} · ${E(g.sev)}</div><h2 style="margin:4px 0">${E(g.title)}</h2><div class="story" data-role="story"><b>Remediation.</b> ${E(g.action)}</div><dl class="kv small"><dt>Owner</dt><dd>${E(g.owner)}</dd><dt>Opens</dt><dd>${E(t.type||"")} ${E(t.id||"")}</dd></dl><div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap">${btns}</div>`)}
function modDrawer(id){const c=coverage(),m=c.modules.find(x=>x.id===id);if(!m)return;const b=compute(true).modules.find(x=>x.id===id);
 const chk=(ok,t)=>`<li>${ok?pill_("Pass","good"):pill_("Gap","warn")} ${E(t)}</li>`;
 const ents=m.owned.map(eid=>PLAT.ent(eid)).filter(Boolean);
 const recs=c.records.filter(x=>x.r.mod===id);
 const fl=c.flows.filter(x=>x.f.from===id||x.f.to===id);
 openDrawer(`<div class="eyebrow">${E(band(m.bi))}</div><h2 style="margin:4px 0">${E(m.name)}</h2><p class="muted small">Owner ${E(m.owner||"")} · ${b?`was <b>${b.state==="full"?"covered":"not covered"}</b> before the audit`:""}</p>
 <div class="story" data-role="story">${m.state==="full"?"Fully covered by live entities.":m.state==="proposed"?"Covered, but some entities are only proposed.":"Gaps remain: "+E(m.gaps.join("; "))+"."}</div>
 <ul class="cv-chk">${chk(m.chk.entities,"Owns a registered entity ("+m.entities+")")}${chk(m.chk.records,m.records+" record collection"+(m.records===1?"":"s")+", "+m.recordsMissing+" not in the model")}${chk(m.chk.flows,m.flows+" flows, "+m.flowsMissing+" with no entity")}${chk(m.chk.labels,N0(m.fields)+" fields, "+N0(m.fieldsDefault)+" with a default label")}</ul>
 <h3>Entities it owns</h3><div class="at-chips">${ents.map(e=>`<button class="chip at-chip" data-atlas-go="${E(e.id)}">${E(e.label)}${e.proposed?' <span class="pill info">Proposed</span>':""}</button>`).join("")||'<span class="muted small">None</span>'}</div>
 <h3>Record collections</h3>${recs.length?`<ul class="at-ul">${recs.map(x=>`<li><span>${E(x.r.label)} <small class="muted">${E(x.r.path)}</small></span>${x.cov?pill_(x.st==="proposed"?"Proposed":"Live",x.st==="proposed"?"info":"good"):pill_("Not in the model","bad")}</li>`).join("")}</ul>`:'<p class="muted small">No record collections; this module shows other modules\' data.</p>'}
 <div class="row" style="gap:8px;margin-top:12px">${hasScr(id)?`<button class="btn" data-cov-go="${E(id)}">Open the module</button>`:""}<button class="btn quiet" data-cov-flows="${E(id)}">Open its flows</button></div>`)}
function usageDrawer(eid){const c=coverage(),e=PLAT.ent(eid);if(!e)return;
 const r=c.modules.filter(m=>m.read.includes(eid)&&!m.write.includes(eid)),w=c.modules.filter(m=>m.write.includes(eid));
 const li=(m,k)=>`<li><span><b>${E(m.name)}</b> <small class="muted">${E(band(m.bi))}</small></span><span class="at-lr">${pill_(k,k==="Writes"?"good":"info")}<button class="btn quiet" data-cov-mod="${E(m.id)}">Coverage</button></span></li>`;
 openDrawer(`<div class="eyebrow">Which modules use this entity</div><h2 style="margin:4px 0">${E(e.label)}${e.proposed?' <span class="pill info">Proposed</span>':""}</h2><p class="muted small"><code>${E(eid)}</code> · ${w.length} module${w.length===1?"":"s"} write it, ${r.length} read it.</p>
 <h3>Writes (${w.length})</h3>${w.length?`<ul class="at-ul">${w.map(m=>li(m,"Writes")).join("")}</ul>`:'<p class="muted small">No mapped module writes it.</p>'}
 <h3>Reads (${r.length})</h3>${r.length?`<ul class="at-ul">${r.map(m=>li(m,"Reads")).join("")}</ul>`:'<p class="muted small">No mapped module reads it.</p>'}
 <div class="row" style="margin-top:12px"><button class="btn" data-atlas-go="${E(eid)}">Open on the data diagram</button></div>`)}
function cellDrawer(mid,d){const c=coverage(),m=c.modules.find(x=>x.id===mid);if(!m)return;
 const ids=[...new Set(m.write.concat(m.read))].map(id=>PLAT.ent(id)).filter(e=>e&&e.domain===d);
 openDrawer(`<div class="eyebrow">${E(PLAT.DOM[d].n)}</div><h2 style="margin:4px 0">${E(m.name)}</h2><ul class="at-ul">${ids.map(e=>`<li><span><b>${E(e.label)}</b>${e.proposed?' <span class="pill info">Proposed</span>':""}<small class="muted"> ${E(e.id)}</small></span><span class="at-lr">${pill_(m.write.includes(e.id)?"Writes":"Reads",m.write.includes(e.id)?"good":"info")}<button class="btn quiet" data-atlas-go="${E(e.id)}">Inspect</button></span></li>`).join("")}</ul>`)}

/* ---------- events ---------- */
document.addEventListener("click",e=>{
 let t=e.target.closest("[data-cov-tab]");if(t){S.v.cov=+t.dataset.covTab;render();return}
 t=e.target.closest("[data-cov-open]");if(t){S.v.atlas=3;S.v.cov=1;render();audit("Opened the data model coverage","Gaps");return}
 t=e.target.closest("[data-cov-approve]");if(t){e.stopPropagation();closeDrawer();approve(t.dataset.covApprove);return}
 t=e.target.closest("[data-cov-approveall]");if(t){const ids=coverage().entities.filter(x=>x.e.proposed).map(x=>x.e.id);openDrawer(`<div class="eyebrow">Approve</div><h2 style="margin:4px 0">Approve ${ids.length} proposed entities</h2><div class="story" data-role="story">Each entity becomes live in the model, appears without the dashed outline and is audited. No data is migrated by this step.</div><div class="row" style="gap:8px;margin-top:12px"><button class="btn primary" data-cov-approveyes>Approve all</button><button class="btn quiet" onclick="closeDrawer()">Not now</button></div>`);return}
 t=e.target.closest("[data-cov-approveyes]");if(t){const ids=coverage().entities.filter(x=>x.e.proposed).map(x=>x.e.id);closeDrawer();approveMany(ids);return}
 t=e.target.closest("[data-cov-confirmdom]");if(t){const d=t.dataset.covConfirmdom;const es=coverage().entities.filter(x=>x.def>0&&(d==="*"||x.e.domain===d));es.forEach(x=>{A.confirmed[x.e.id]=Date.now()});if(PLAT.refresh)PLAT.refresh();ATLAS.bump();audit("Field labels confirmed by steward",(d==="*"?"all domains":(PLAT.DOM[d]||{n:d}).n)+": "+es.length+" entities");toast("Labels confirmed for "+es.length+" entities","good");render();return}
 t=e.target.closest("[data-cov-confirm]");if(t){closeDrawer();confirmLabels(t.dataset.covConfirm);return}
 t=e.target.closest("[data-cov-mods]");if(t){usageDrawer(t.dataset.covMods);return}
 t=e.target.closest("[data-cov-mod]");if(t){modDrawer(t.dataset.covMod);return}
 t=e.target.closest("[data-cov-cell]");if(t){const p=t.dataset.covCell.split("|");cellDrawer(p[0],p[1]);return}
 t=e.target.closest("[data-cov-go]");if(t){closeDrawer();go(t.dataset.covGo);return}
 t=e.target.closest("[data-cov-flows]");if(t){closeDrawer();S.v.mm_v=0;if(window.MODMAP&&window.MM){}go("plat_map");return}
 t=e.target.closest("[data-cov-kind]");if(t){S.v.cov=1;S.cov.gapF=t.dataset.covKind;render();return}
});

/* ---------- chat and search ---------- */
function openCov(){S.v.atlas=3;S.v.cov=0;go("plat_data")}
ASKX.unshift(q=>{const t=q.toLowerCase();
 let m=/(?:does|is) the (?:master )?data model (?:cover|include|have)\s+(?:the )?(.+?)\??$/.exec(t)||/data model coverage (?:of|for) (?:the )?(.+?)\??$/.exec(t);
 if(m){const w=m[1].replace(/ module$/,"").trim();let mods=MODMAP.modules.filter(x=>x.name.toLowerCase()===w||x.sn.toLowerCase()===w||x.id===w);if(!mods.length)mods=MODMAP.modules.filter(x=>x.name.toLowerCase().indexOf(w)>=0||x.sn.toLowerCase().indexOf(w)>=0||(x.al||[]).includes(w));
  if(mods.length){const mm=mods[0],c=coverage(),r=c.modules.find(x=>x.id===mm.id);openCov();setTimeout(()=>modDrawer(mm.id),200);
   say(q,{t:"<b>"+E(mm.name)+"</b>: "+(r.state==="full"?"fully covered by live entities.":r.state==="proposed"?"covered, with "+r.owned.filter(id=>(PLAT.ent(id)||{}).proposed).length+" proposed entities waiting for approval.":"not fully covered. "+E(r.gaps.join("; "))+".")+" It owns "+r.entities+" entities and takes part in "+r.flows+" flows.",steps:["Opened the module coverage"]});return true}}
 if(/missing (from|in) the (master )?data model|what('s| is) missing.*(model|registry)|data model (gaps?|coverage)|(show|open).*data model.*coverage|does the (master )?data model (cover|include)/.test(t)){
  const c=coverage(),s=c.stats,b=c.before;openCov();const hi=gaps().filter(x=>x.sev==="High").length;
  say(q,{t:"No, not every module was in the model. Before the audit it carried "+b.modFull+" of "+s.modTotal+" modules, "+b.scrFull+" of "+b.scrRec+" screens with records and "+b.flowCovered+" of "+b.flowTotal+" flows. It now carries "+s.modFull+", "+s.scrFull+" and "+s.flowCovered+" because "+s.entProposed+" entities are proposed and wait for approval. "+s.missing+" core entities stay undefined and "+hi+" high severity gaps are open.",steps:["Opened the Coverage tab","Listed gaps with owners"]});return true}
 return false});
SEARCHX.push(()=>{try{const c=coverage();return c.modules.map(m=>({g:"Data model coverage",t:m.name+" coverage",m:(STP[m.state]||["",""])[0]+" · "+m.entities+" entities",c:"--p4",f:()=>{S.v.atlas=3;go("plat_data");setTimeout(()=>modDrawer(m.id),250)},k:m.id+" "+m.name+" data model coverage entities gaps"}))
 .concat(gaps().filter(g=>g.sev==="High"||g.kind==="Undefined entity").map(g=>({g:"Data model gaps",t:g.title,m:g.kind+" · "+g.owner,c:"--bad-f",f:()=>{S.v.atlas=3;S.v.cov=1;go("plat_data");setTimeout(()=>gapDrawer(g.id),250)},k:g.kind+" "+g.title+" missing from the data model gap"})))
 .concat(c.entities.filter(x=>x.e.proposed).map(x=>({g:"Proposed entities",t:x.e.label+" (proposed)",m:"Waiting for approval · "+(PLAT.DOM[x.e.domain]||{n:""}).n,c:"--p4",f:()=>ATLAS.focus(x.e.id),k:x.e.id+" proposed entity "+x.e.label})))}catch(e){return[]}});

/* the atlas shows the color of a domain in the matrix */
if(window.ATLAS&&!ATLAS.color){}
PROC.reg("plat_cov",{title:"How the model stays complete",std:["dmbok","togaf"],steps:[
 {n:"Audit",d:"Walk every module, screen, record collection and flow and compare them with the registry.",who:"robot",owner:"Registry Agent",out:"Gap list"},
 {n:"Reuse check",d:"A new entity is compared with existing fields and meanings. Close matches extend an existing entity.",who:"robot",owner:"Platform",out:"Matches and warnings"},
 {n:"Define",d:"The Registry Agent drafts fields, authority and classification. The entity is Proposed.",who:"agent",owner:"Registry Agent",out:"Proposed entity"},
 {n:"Approve",d:"The data council approves; the entity becomes live and the audit log records who approved it.",who:"gate",owner:"Data council",sla:"3 days",out:"Live entity"},
 {n:"Re-audit",d:"Coverage recomputes whenever a module adds an entity.",who:"robot",owner:"Platform",out:"New coverage"}]});
})();
