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
