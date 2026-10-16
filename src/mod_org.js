/* ===== mod_org: Org chart, person profiles and Agent studio (prefix org). Part 1 of 3: people, ownership, permissions, opportunities, agent engine.
   Globals: window.ORGX {staff, P, kids, owns, perms, perf, time, pending, opps, agents, build, ...}. mod_org2 draws the chart, mod_org3 the studio, chat and contract wiring.
   Reuses: DIR (the people directory), TEAMS, WORK providers, METRICS, PROCLIB, PLAT entities, SVCREG, PROJ, DOA, S.adm.roles, S.agents (AI Control Tower registry). No second people table. */
(function(){
const H=s=>esc(s==null?"":String(s));
const O=window.ORGX=window.ORGX||{};
S.org=S.org||{};
Object.assign(S.org,Object.assign({tab:"chart",mode:"both",collapsed:{},sel:null,q:"",f:{team:"",agents:"",load:""},lines:{dotted:false,matrix:false},k:0,x:0,y:0,outline:false,stud:null,log:[],built:[],ptab:0,seq:1,ov:{}},S.org));
const OS=S.org;
const _slugC=new Map();const slug=s=>{const k=String(s);let v=_slugC.get(k);if(v===undefined){v=k.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");if(_slugC.size<20000)_slugC.set(k,v)}return v};
const first=n=>String(n).split(" ")[0];
const rnd=(seed)=>RNG(seed);
const TODAY="2026-10-10";

/* ---------- the 59 staff of Meridian Standards Foundation. name|title|reports to|unit|template|dotted line to|matrix (project:percent)|go to them for|value |location|years ---------- */
const RAW=`Catherine Doyle|Chief executive|-|Executive office|ceo|||Board relations and annual priorities;The final call when two departments disagree;Member and regulator relationships|Keeps 300 member organizations confident that the standards they rely on are independent, current and trusted.|Norwalk, CT|3
Casey Rowan|Chief information officer|Catherine Doyle|Technology|cio|||Technology strategy and the portfolio;Spend above $25,000 on technology;Escalated vendor problems|Turns the Foundation's publishing mission into systems that work, and protects every dollar of technology spend.|Norwalk, CT|6
Marcus Reid|Chief financial officer|Catherine Doyle|Finance|cfo|||Budget and forecast questions;Audit, tax and treasury;Spend above $100,000|Gives the board a single, trusted view of the Foundation's money and keeps it audit-ready.|Norwalk, CT|5
Elena Marsh|Chief editor|Catherine Doyle|Editorial|chiefed|||Whether a draft standard is ready to publish;Editorial policy and the style guide;Disputes with technical committees|Guards the quality and independence of every published standard, which is what members pay for.|Norwalk, CT|12
Joanna Pierce|Head of People Operations|Catherine Doyle|People operations|hr|||Hiring, onboarding and role changes;Leave, benefits and policy questions;Review cycles and calibration|Makes sure the right people are in the right roles, and that every employee knows what good looks like.|Norwalk, CT|4
Theo Marlowe|General counsel|Catherine Doyle|Legal and compliance|legal|||Contract terms and liability;Conflict-of-interest and antitrust questions;Regulatory filings|Protects the Foundation's independence and signs off on every commitment that binds it.|Washington, DC|7
Maya Ortiz|Portfolio lead|Casey Rowan|Portfolio and delivery|pmo|||Which projects are funded and in what order;Project status and risks across the portfolio;Resource conflicts between projects|Makes sure the four most important projects get the people and money they need, in the right order.|Washington, DC|7
Priya Shah|Project manager|Maya Ortiz|Portfolio and delivery|pm|||Standards Platform Upgrade plan and dates;Release readiness;Lumen delivery follow-up|Keeps the Standards Platform Upgrade on a plan the vendor and the editors both believe.|Norwalk, CT|5
Dev Rao|Project manager|Maya Ortiz|Portfolio and delivery|pm|||Taxonomy Data Hub plan and dates;Data migration sequencing;Taxonomy workshops|Delivers the Taxonomy Data Hub so search, publishing and reporting use one vocabulary.|Chicago, IL|4
Hannah Lowe|Scrum master|Maya Ortiz|Portfolio and delivery|pm|||Sprint ceremonies and team health;Removing blockers fast;Agile coaching for the editors|Keeps the delivery teams shipping every two weeks without burning out.|Remote|2
Leila Haddad|Communications lead|Maya Ortiz|Portfolio and delivery|comms|Elena Marsh||Announcements to members and staff;Release notes and newsletters;Change communications|Makes sure members and staff hear about changes from us first, in plain language.|Remote|2
Owen Pryce|Organizational change manager|Maya Ortiz|Portfolio and delivery|comms|Nia Brooks||Adoption plans and training for new tools;Stakeholder readiness checks;Resistance and feedback|Gets people to actually use what the projects deliver, so the benefit shows up.|Remote|2
Jordan Lee|Chief architect|Casey Rowan|Architecture|arch|||Whether a design fits the target architecture;Integration patterns and standards;Technology decisions that last five years|Stops the Foundation from building the same thing twice and keeps systems able to talk to each other.|Remote|8
Rina Kovacs|Solutions architect|Jordan Lee|Architecture|arch||PR1:20|Search and indexing design;Data model reviews;API contracts with vendors|Turns requirements into designs that engineers and vendors can build without guessing.|Remote|6
Aaron Whitfield|Security architect|Jordan Lee|Architecture|arch|Rina Okafor||Threat models for new systems;Identity and encryption patterns;Security design review|Builds security into designs early, when it is cheapest.|Remote|9
Sam Patel|Platform engineering lead|Casey Rowan|Platform engineering|eng|||Production platform health and on-call;Azure cost and capacity;Anything that needs a release to production|Keeps the Standards Platform up for 420 editors and thousands of readers.|Remote|5
Leah Moss|Platform engineer|Sam Patel|Platform engineering|eng||PR1:40|Search index jobs and relevance deployments;Pipelines;Environment problems|Ships search relevance changes safely and quickly.|Remote|2
Ben Ito|Platform engineer|Sam Patel|Platform engineering|eng||PR1:30,PR3:30|Failover and resilience tests;Kubernetes upgrades;Monitoring dashboards|Makes the portal resilient so an outage does not stop a publication date.|Remote|4
Elise Park|Developer|Sam Patel|Platform engineering|dev|||Contract Repository fixes and incident follow-up;Platform team stories;Support rotation|Keeps the Contract Repository stable for the editors who use it every day.|Remote|3
Mei Tan|Developer|Sam Patel|Platform engineering|dev|||Search relevance code in Python;Platform team stories;Index job fixes|Ships search relevance improvements the editors can feel.|Remote|2
Luis Ortega|Developer|Sam Patel|Platform engineering|dev|||TypeScript and React front end;Accessibility fixes;Platform team stories|Makes the portal usable for every editor and reader.|Remote|2
Ravi Menon|Network engineer (contractor)|Tom Becker|Service desk and operations|ops|||Network and VPN incidents;Ops team on-call;Network changes|Keeps staff connected to the network and VPN.|Remote|2
Carla Reyes|Platform engineer|Sam Patel|Platform engineering|eng||PR1:50|Integrations with the Contract Repository;API gateway;Service accounts|Connects the Foundation's systems so data moves once and stays correct.|Remote|9
Anita Cole|Developer|Sam Patel|Platform engineering|dev||PR1:60|Editor workspace features;Front-end fixes;Pull request reviews|Builds the features editors use every day.|Remote|2
Ben Alvarez|QA analyst|Sam Patel|Platform engineering|dev||PR1:30,PR4:20|Test plans and acceptance testing;Regression results;Whether a release is safe|Finds the defect before a member does.|Remote|2
Anil Mehta|Data engineering lead|Casey Rowan|Data and analytics|data|||Data pipeline priorities;Data quality rules;Who may see which dataset|Gives the Foundation data it can trust, and gives every team one version of the numbers.|Chicago, IL|3
Yuki Tanaka|Data engineer|Anil Mehta|Data and analytics|data||PR2:50|Taxonomy loading jobs;Pipeline failures;Azure Data Factory|Keeps the Taxonomy Data Hub fed with clean, current data.|Chicago, IL|5
Rosa Delgado|Data engineer|Anil Mehta|Data and analytics|data||PR2:40|Data catalog and lineage;Data steward questions;Master data matching|Makes it possible to answer "where did this number come from?" in a minute.|Chicago, IL|7
Femi Adeyemi|Data analyst|Anil Mehta|Data and analytics|data|Maya Ortiz|PR2:20|Portfolio and service reports;Ad hoc analysis;Dashboards|Turns operational data into answers leaders can act on.|Remote|3
Tom Becker|Service desk lead|Casey Rowan|Service desk and operations|desk|||Incidents and major incident command;Service desk staffing and queues;Request fulfilment problems|Gets staff and editors working again fast, and spots the problem behind the problem.|Norwalk, CT|9
Maribel Cruz|Service desk analyst|Tom Becker|Service desk and operations|desk|||First-line help for editors;Password and access requests;Ticket status|Is the friendly first answer when something breaks.|Norwalk, CT|6
Priti Joshi|Tier 2 support analyst|Tom Becker|Service desk and operations|desk|||Escalated incidents;Problem records and workarounds;Service level reporting|Solves the harder tickets and writes the fix down so it is solved once.|Norwalk, CT|8
Ines Duarte|Operations engineer|Tom Becker|Service desk and operations|ops|||The configuration database;Backup and restore tests;Hardware and AV lifecycle|Keeps the map of what we run accurate, so every impact analysis is right.|Norwalk, CT|6
Paula Grant|Operations engineer|Tom Becker|Service desk and operations|ops|||On-call rota and handoffs;Patching windows;Endpoint management|Makes sure someone competent is always on call and ready.|Norwalk, CT|1
Wes Hartley|Service desk analyst|Tom Becker|Service desk and operations|desk|||Facilities and room bookings;Onboarding laptops;Meeting room AV|Gets new starters productive on day one.|Norwalk, CT|8
Rina Okafor|Security lead|Casey Rowan|Security|sec|||Access requests for restricted data;Security incidents;Quarterly access reviews|Keeps member and staff data safe, and proves it to auditors.|Remote|4
Rosa Alvarez|Internal auditor|Catherine Doyle|Internal audit|ctrl|||Access review and control testing evidence;Audit log review;SOC 2 and ISO 27001 testing|Gives the board independent assurance, separate from the teams she tests.|Remote|5
Imran Sheikh|Security analyst|Rina Okafor|Security|sec|Tom Becker||Alert triage;Phishing reports;Vulnerability follow-up|Watches the alerts so nobody else has to.|Remote|3
Colette Brandt|Identity engineer|Rina Okafor|Security|sec|||Entra ID groups and conditional access;Joiner, mover, leaver automation;Privileged access|Makes sure people have exactly the access they need and no more.|Remote|9
Nia Brooks|Change manager|Casey Rowan|Change and release|chg|Maya Ortiz||Whether a change can go in this week;The change calendar and freezes;CAB agenda|Prevents Friday-afternoon surprises by making every change visible before it happens.|Norwalk, CT|3
Hollis Grey|Release coordinator|Nia Brooks|Change and release|chg|||Release schedules;Go-live checklists;Rollback plans|Makes releases boring, which is the goal.|Norwalk, CT|9
Avery Chen|Controller|Marcus Reid|Finance|ctrl|||Month-end close and journal entries;Invoice approval exceptions;Audit evidence and accounting policy|Closes the books accurately and on time, so the board and auditors trust every number.|Norwalk, CT|6
Noelle Park|Accounts payable lead|Avery Chen|Finance|apfa|||Why an invoice has not been paid;Vendor payment runs;Three-way match exceptions|Pays vendors correctly and on time, and catches duplicates before the money leaves.|Norwalk, CT|6
Victor Amaya|Finance and budget lead|Avery Chen|Finance|apfa|Maya Ortiz||Budget versus actual;Forecast updates;Technology business management reports|Explains where the money went and where it is going.|Norwalk, CT|5
Camille Ortega|Procurement lead|Marcus Reid|Finance|legal|Theo Marlowe||Vendor selection and quotes;Purchase orders over $25,000;Contract renewals calendar|Gets the Foundation better terms and no surprise auto-renewals.|Norwalk, CT|6
Kenji Watanabe|AI platform lead|Casey Rowan|Technology|ai|Theo Marlowe||Whether an AI agent may go live;Guardrails, models and spend caps;AI incident reviews|Lets the Foundation use AI aggressively and safely, with every agent sponsored and governed.|Remote|2
Noor Haddad|Standards editor|Elena Marsh|Editorial|editor|||Edits to a standard in progress;Comment-letter responses;Terminology questions|Turns committee drafts into clear, consistent standards.|Norwalk, CT|1
Pierce Caldwell|Standards editor|Elena Marsh|Editorial|editor|||Cross-reference and numbering checks;Redlines and change logs;Final proofs|Makes sure a standard says the same thing everywhere it appears.|Norwalk, CT|9
Isla Fenn|Associate editor|Elena Marsh|Editorial|editor|||Comment tracking;Meeting minutes for technical committees;Style-guide lookups|Keeps every public comment answered and on the record.|Norwalk, CT|3
Grace Whitfield|Training lead|Joanna Pierce|People operations|hr||PR4:20|Training paths and compliance courses;New-hire onboarding sessions;Skills gaps|Builds the skills the next three years of work will need.|Remote|2
Priya Raman|Director of standards development|Elena Marsh|Standards development|pm|||Which committees are active and on what schedule;Whether a draft is ready for public comment;Ballot calendar conflicts|Keeps every standard moving from proposal to publication on a schedule members can trust.|Norwalk, CT|11
Greta Halloran|Ballot and comment coordinator|Priya Raman|Standards development|editor|||Opening and closing comment periods;Ballot tallies and quorum;Who may vote|Makes sure every comment is logged and every ballot is counted correctly.|Norwalk, CT|6
Owen Prescott|Committee liaison|Priya Raman|Standards development|pm|||Committee rosters and charters;Meeting schedules and minutes;Volunteer onboarding|Keeps volunteer committees staffed, informed and productive.|Remote|8
Daniel Okoye|Director of membership|Catherine Doyle|Membership|comms|||Member renewals and lapses;Member benefits and tiers;Member complaints|Keeps the member organizations who fund the Foundation engaged and renewing.|Norwalk, CT|9
Sofia Lindqvist|Member services manager|Daniel Okoye|Membership|comms|||New member onboarding;Member questions and access;Renewal outreach|Is the first call for any member organization with a question.|Norwalk, CT|5
Tariq Bashir|Dues and renewals analyst|Daniel Okoye|Membership|apfa|||Dues tiers and invoices;Renewal forecasts;Lapse reasons|Forecasts dues revenue early enough to act on it.|Remote|3
Lucia Ferrante|Publishing manager|Elena Marsh|Publishing and licensing|editor|||Publication dates and formats;Print and digital releases;Errata|Gets finished standards into members' hands in every format they need.|Norwalk, CT|10
Graham Wells|Licensing specialist|Lucia Ferrante|Publishing and licensing|comms|||Copyright and reuse requests;Licence terms and fees;Translations|Protects the Foundation's publications while making them easy to license.|Remote|4
Beatrice Nolan|Financial reporting manager|Avery Chen|Finance|ctrl|||Annual audit support;Financial statements;Dues revenue recognition|Produces statements the board and auditors trust.|Norwalk, CT|8
Dev Anand|Dues billing and collections analyst|Noelle Park|Finance|apfa|||Dues invoices;Overdue member accounts;Payment plans|Gets dues billed on time and collected without friction.|Norwalk, CT|4
Harriet Yu|Events and conference manager|Catherine Doyle|Executive office|comms|||Annual conference planning;Venues and speakers;Registration|Turns the annual conference into a reason for members to renew.|Remote|7
Ruben Castillo|Facilities and office manager|Joanna Pierce|People operations|hr|||Office space and leases;Safety and access badges;Mail and supplies|Keeps the Norwalk office running so staff can focus on the work.|Norwalk, CT|12
Naomi Fields|Talent acquisition partner|Joanna Pierce|People operations|hr|||Open roles and interviews;Offer approvals;Onboarding paperwork|Finds and welcomes the people the Foundation needs.|Remote|3
Julian Park|Contracts paralegal|Theo Marlowe|Legal and compliance|legal|||Contract drafts and redlines;Renewal calendar;Signature routing|Keeps every contract on file, current and signed by the right person.|Norwalk, CT|6
Lena Hargrove|Chief commercial officer|Catherine Doyle|Commercial|comms|||Publication sales and pricing;Customer and member experience;Partnerships and sponsorships|Turns what the Foundation publishes into revenue and keeps every buyer and member coming back.|Norwalk, CT|4
Zainab Ali|Customer care lead|Lena Hargrove|Commercial|comms|||Customer complaints and refunds;Order questions;Survey results|Is the first and last call for any buyer who is not happy.|Remote|5
Tomas Reyes|Distribution and fulfillment manager|Elena Marsh|Distribution|ops|||Order shipping and delivery dates;Stock levels;Returns|Gets every printed standard to the right member on the day promised.|Edison, NJ|9
Kofi Mensah|Warehouse supervisor|Tomas Reyes|Distribution|ops|||Daily pick and pack plan;Dock schedule;Cycle counts|Runs the floor so the day's orders leave on time.|Edison, NJ|7
Dmitri Kowal|Plant operations manager|Elena Marsh|Applied Standards Center|eng|||Pilot plant schedule and output;Equipment downtime;Quality holds|Runs the pilot plant where draft standards are proved on real equipment before they are published.|Pittsburgh, PA|11
Mei-Ling Zhou|Quality engineer|Dmitri Kowal|Applied Standards Center|eng|||Nonconformance reports;Inspection plans;Test results|Makes sure what the plant produces meets the standard it is testing.|Pittsburgh, PA|6
Sofia Arenas|Process control lead|Dmitri Kowal|Applied Standards Center|eng|||Control room alarms;Changes to control logic;Permits to work|Keeps the plant's control systems safe, quiet and under change control.|Pittsburgh, PA|8
Hugo Baptiste|Control room operator|Sofia Arenas|Applied Standards Center|ops|||Shift handover notes;Alarm response;Equipment start-up and shutdown|Watches the plant around the clock and acts first when something drifts.|Pittsburgh, PA|5
Joel Tran|Maintenance and facilities planner|Ruben Castillo|People operations|ops|||Preventive maintenance schedule;Work orders;Contractor visits|Keeps buildings and equipment working before they break.|Norwalk, CT|6
Alba Torres|Buyer|Camille Ortega|Finance|proc|||Purchase requisitions;Supplier quotes;Inbound shipment status|Turns approved requests into purchase orders at the best terms.|Norwalk, CT|4`;

/* ---------- role templates: access level per module group, data class access, approvals, recurring tasks ---------- */
const MG=["Portfolio and delivery","Service and support","Operations and monitoring","Knowledge and learning","People and teams","Money and contracts","Strategy and performance","AI and governance","Platform and admin"];
const LV=["None","View","Edit","Approve","Admin"];
const DC=["Public","Internal","Confidential","Restricted","Personal"];
const DA=["None","Read","Read and write"];
/* t: [id, title, domain noun, hours a week, risk, data entities, guardrails, tools, covered by existing agent] */
const T=(id,title,dom,hrs,risk,data,guard,tools,cov)=>({id,title,dom,hrs,risk,data:data.split(","),guard:guard.split(";"),tools:tools.split(","),cov:cov||""});
const RT={
 ceo:{role:"exec",mod:"211132210",dat:"222120",app:[["Spend above $1,000,000","Board finance committee also signs"],["Executive hires","Within approved headcount plan"]],tasks:[T("brief","Board pack and briefing preparation","Briefing",5,"med","objective,project,metric_definition","Drafts only; the chief executive edits and sends;No board material leaves without approval","Records API,Documents"),T("digest","Weekly leadership digest","Digest",2.5,"low","project,raid_item,incident","Reads summaries, never raw HR or legal files","Records API"),T("inbox","Stakeholder correspondence triage","Inbox",4,"med","notification","Never sends; proposes replies;Redacts personal data","Mail,Calendar")],mix:[32,20,6,18,18,6]},
 cio:{role:"exec",mod:"333133243",dat:"222120",app:[["Technology spend to $100,000","DOA tier T3"],["Emergency changes","With the change manager"],["New AI agent go-live (executive sponsor)","With the AI platform lead"]],tasks:[T("brief","Executive briefings from portfolio status","Briefing",4,"low","project,raid_item,business_service","Reads only; cites every figure","Records API"),T("queue","Approval queue preparation","Approvals",3,"low","approval,change_request,invoice","Never approves; sorts and summarizes;Shows DOA route for each item","Inbox"),T("vendor","Vendor escalation summaries","Vendor",2.5,"med","contract,invoice,project","Drafts only;No external email without approval","Mail,Contract Repository"),T("steer","Steering committee follow-ups","Meeting",2,"low","meeting,raid_item","Posts to the minutes only after the chair approves","Calendar,Transcripts","fo")],mix:[30,20,14,14,16,6]},
 cfo:{role:"finance",mod:"112123230",dat:"222221",app:[["Spend to $250,000","DOA tier T4"],["Budget transfers between departments","Any amount"],["Audit adjustments","Above materiality"]],tasks:[T("narr","Board financial narrative","Finance narrative",5,"med","budget_line,invoice,forecast","Numbers come from the ledger only;Drafts reviewed before release","Ledger read,Documents"),T("scen","Forecast scenario drafts","Forecast",4,"med","budget_line,project","Scenarios are labeled as draft;Cannot change approved budgets","Ledger read"),T("cov","Policy and covenant checks","Policy check",2,"low","policy,contract","Reads only","Contract Repository")],mix:[24,22,6,12,30,6]},
 chiefed:{role:"exec",mod:"221221212",dat:"222120",app:[["Publish a standard","Editorial board quorum required"],["Style guide exceptions","Documented in the guide"]],tasks:[T("cmt","Comment-letter summarization","Comments",5,"low","comment_thread,document","Summaries cite the letter and paragraph;Editors verify before use","Standards Platform"),T("stl","Style-guide consistency pass","Style",4,"low","document,style_rule","Suggests edits as tracked changes only","Standards Platform"),T("sched","Review scheduling","Scheduling",2,"low","meeting,person","Proposes times; never sends invites without approval","Calendar")],mix:[22,22,10,28,12,6]},
 hr:{role:"portfolio",mod:"111112210",dat:"212221",app:[["Hiring requisitions","Within approved headcount"],["Leave beyond policy","Case by case"]],tasks:[T("onb","Onboarding checklists","Onboarding",3,"low","person,position,asset","Creates tasks; never changes pay or access","Directory,Tasks"),T("trn","Training assignment and reminders","Training",3,"low","course,learning_event","Nudges only; assignments follow the policy table","Learning records","lc"),T("pol","Policy questions","Policy answers",4,"med","policy,person","Answers cite the handbook;Escalates anything about a named person","Knowledge"),T("rev","Review-cycle chasing","Reviews",3,"low","perf_feedback","Reminders only; no ratings suggested","Directory")],mix:[18,16,6,34,20,6]},
 legal:{role:"finance",mod:"112122211",dat:"222221",app:[["Contract signature","Below $250,000 with delegated authority"],["Purchase orders over $25,000","With procurement"]],tasks:[T("clause","Contract clause extraction","Contract review",5,"med","contract,contract_line","Flags clauses against the playbook; counsel decides;Never edits the executed copy","Contract Repository","ca"),T("nda","NDA triage","NDA",3,"med","contract","Auto-approves only standard NDAs on the pre-approved template","Contract Repository"),T("obl","Obligation and renewal tracking","Obligations",2.5,"low","contract,obligation","Reads only; reminders go to owners","Contract Repository"),T("quote","Vendor quote comparison","Quotes",3,"low","vendor_quote,company","Comparison table with sources;Never selects a vendor","Documents")],mix:[18,24,6,30,16,6]},
 pmo:{role:"portfolio",mod:"311222222",dat:"222220",app:[["Spend to $25,000","DOA tier T2"],["Stage-gate moves","Gate G1 to G3"],["Resource assignments","Across projects"]],tasks:[T("stat","Weekly status roll-up","Status",5,"low","project,project_task,raid_item","Reads project data only;Flags any number it cannot source","Records API","pm"),T("lvl","Resource conflict leveling","Capacity",3,"med","allocation,resource_request","Proposes moves; Maya approves each;No change to a person's allocation without approval","Capacity plan","ra"),T("raid","RAID item chasing","RAID",2.5,"low","raid_item","Sends reminders to owners only","Mail"),T("min","Meeting minutes and actions","Minutes",3,"low","meeting,raid_item","Files only items above 85% confidence","Transcripts","fo")],mix:[24,14,28,10,18,6]},
 pm:{role:"pm",mod:"311211111",dat:"221120",app:[["Task changes inside baseline","Within project tolerance"],["Spend to $10,000","Budget owner, DOA tier T1"]],tasks:[T("stat","Status report drafting","Status",3,"low","project,project_task","Drafts from the plan; the PM edits and sends","Records API"),T("act","Action item chasing","Actions",2.5,"low","raid_item,meeting","Reminders only; escalates after two misses to the PM","Mail"),T("risk","Schedule risk check","Schedule",2,"low","project_task","Reads plan; proposes, never edits dates","Records API"),T("upd","Stakeholder update emails","Updates",2,"med","project,notification","Drafts only; no external recipients without approval","Mail")],mix:[20,8,46,6,14,6]},
 comms:{role:"pm",mod:"211221111",dat:"221120",app:[["Member announcements","With the chief editor for standards content"]],tasks:[T("news","Newsletter and announcement drafts","Comms",3,"low","release,notification","Drafts only; two-person review before send","Documents"),T("imp","Change impact communications","Change comms",3,"low","change_request,release","Uses approved change summaries only","Records API"),T("sur","Adoption survey summaries","Survey",2,"low","survey_response","Aggregates only; no names shown","Forms")],mix:[16,6,36,12,24,6]},
 arch:{role:"arch",mod:"221122211",dat:"222120",app:[["Architecture exceptions","Documented in the decision log"],["Design approval","For systems above Tier 2"]],tasks:[T("rev","Design review preparation","Design review",3,"low","business_service,ci,data_asset","Reads designs; comments are suggestions","Documents"),T("std","Standards conformance checks","Conformance",3,"low","policy,app_manifest","Checks against published standards only","Registry"),T("dia","Integration diagram updates","Diagrams",2.5,"low","ci,business_service","Proposes edits to the model; architect approves","CMDB read")],mix:[20,18,30,10,16,6]},
 eng:{role:"admin",mod:"122233122",dat:"222120",app:[["Production deployments","Standard changes pre-approved; others via CAB"],["Cost anomalies","Up to $5,000 a month"]],tasks:[T("run","Runbook drafts and updates","Runbooks",3,"low","knowledge_article,ci","Drafts for engineer review;Never executes commands","Knowledge,Observability"),T("alert","Alert noise triage","Alerts",4,"low","event,incident","Groups and suppresses nothing without approval","Observability","ec"),T("patch","Patch window planning","Patching",2.5,"med","ci,change_request","Proposes the window; change manager approves","CMDB read"),T("cost","Cloud cost anomaly review","Cloud cost",2,"low","cost_pool,ci","Reads billing only","Azure billing")],mix:[10,4,30,40,10,6]},
 dev:{role:"pm",mod:"211211111",dat:"221120",app:[["Merge to main","Peer review required"]],tasks:[T("tc","Test case generation","Testing",4,"low","test_case,project_task","Sandbox only; second model validates","Test runner","tq"),T("pr","Pull request summaries","Reviews",2.5,"low","pull_request","Read-only comments","Repository"),T("rn","Release notes","Release notes",2,"low","release","Drafts only","Repository")],mix:[12,4,60,6,12,6]},
 data:{role:"arch",mod:"121222122",dat:"222220",app:[["Dataset access requests","For datasets they steward"],["Data quality rule changes","With the data council"]],tasks:[T("dq","Data quality rule triage","Data quality",4,"low","data_asset,quality_rule","Proposes rules; steward approves","Data catalog"),T("pipe","Pipeline failure first response","Pipelines",3,"med","pipeline_run,incident","Restarts only idempotent jobs, within a retry cap","Data Factory"),T("meta","Catalog descriptions","Metadata",3,"low","data_asset,field","Drafts descriptions with source lineage","Data catalog"),T("req","Report requests","Reporting",3,"low","report,metric_definition","Builds drafts in a sandbox workspace","BI workspace")],mix:[12,6,44,24,8,6]},
 desk:{role:"desk",mod:"122223122",dat:"221120",app:[["Major incident declaration","Service desk lead"],["Standard requests","Within catalog rules"]],tasks:[T("route","Ticket categorization and routing","Triage",6,"low","incident,request_item,business_service","Suggests class and queue; humans confirm below 90% confidence","Service desk","ta"),T("kb","Knowledge articles from resolved tickets","Knowledge",3,"low","knowledge_article,incident","Drafts only; owner publishes","Knowledge","kc"),T("mi","Major incident communications","Incident comms",2,"med","incident,notification","Drafts for the incident commander; no external send","Mail,Status page"),T("id","Access and password requests","Access",4,"med","request_item,person","Executes only pre-approved, reversible actions with identity checks","Entra ID")],mix:[8,12,6,60,8,6]},
 ops:{role:"desk",mod:"122333122",dat:"221120",app:[["Standard changes","Pre-approved list"],["Emergency access","Break-glass, logged"]],tasks:[T("cmdb","Configuration record reconciliation","CMDB",4,"low","ci,asset","Proposes merges; engineer approves","CMDB"),T("bk","Backup and restore verification","Backups",3,"low","ci,backup_job","Read-only checks; reports failures","Azure Backup"),T("hand","On-call handoff notes","On-call",2,"low","oncall_shift,incident","Drafts from the last shift's activity","Observability")],mix:[8,8,10,58,10,6]},
 sec:{role:"admin",mod:"122222122",dat:"222222",app:[["Access to restricted data","Security lead; two-person for Restricted"],["Privileged access","Time-boxed, logged"],["Policy exceptions","Up to 90 days"]],tasks:[T("rev","Access review evidence preparation","Access review",5,"low","access_review,person,role","Pulls entitlements; reviewer decides","Entra ID,Directory"),T("alert","Alert triage and enrichment","Security alerts",5,"med","event,incident","Enriches only; never isolates a host without approval","SIEM"),T("exc","Policy exception follow-ups","Exceptions",2,"low","exception","Reminders to owners only","Mail"),T("phish","Phishing report triage","Phishing",3,"med","incident","Quarantine requires approval above 5 recipients","Mail security")],mix:[10,22,12,42,8,6]},
 chg:{role:"change",mod:"121233122",dat:"221120",app:[["Normal changes","Change manager; CAB for high risk"],["Release go-live","With the release coordinator"]],tasks:[T("cab","CAB pack assembly","CAB",4,"low","change_request,release","Assembles from change records; cites each","Change records"),T("risk","Change collision and risk summary","Change risk",3,"low","change_request,ci,business_service","Scores and explains; the manager decides","CMDB read","cr"),T("frz","Freeze calendar communications","Freezes",1.5,"low","change_request","Sends only the approved calendar text","Mail"),T("pir","Post-implementation review chasing","Reviews",2,"low","change_request","Reminders only","Mail")],mix:[14,32,16,26,6,6]},
 ctrl:{role:"finance",mod:"112123220",dat:"222221",app:[["Invoices and spend to $25,000","DOA tier T2 for portfolio items; Controller for AP"],["Journal entries","Above $10,000 with CFO review"],["Vendor bank changes","Dual control with AP lead"]],tasks:[T("close","Month-end close checklist and reconciliations","Close",7.5,"med","invoice,budget_line,contract_line,journal_entry","Posts nothing to the ledger; drafts entries for Avery to approve;Every figure links to its source","ERP read,Lease subledger"),T("code","Invoice coding exception triage","Invoices",4,"low","invoice,contract_line,project","Suggests coding; cannot release payment","ERP read","ia"),T("var","Variance commentary for budget owners","Variance",3,"low","budget_line,project","Drafts commentary from actuals;Owners confirm explanations","ERP read,Budgets"),T("vend","Vendor statement reconciliation","Vendor statements",2.5,"low","invoice,company","Matches and flags; no payment actions","ERP read,Mail"),T("aud","Audit evidence pulls","Audit",2,"low","audit_event,invoice,contract","Read-only exports with an access log","Document store")],mix:[14,22,4,40,14,6]},
 apfa:{role:"finance",mod:"112122210",dat:"222221",app:[["Payment runs","Up to $50,000 with Controller above"],["Invoice holds","AP lead"]],tasks:[T("match","Three-way match exceptions","Invoice match",6,"low","invoice,purchase_order,receipt","Suggests resolutions; cannot release payment","ERP read","ia"),T("inq","Vendor inquiries","Vendor inquiries",3,"low","invoice,company","Drafts replies from payment status only","Mail,ERP read"),T("acc","Accrual schedules","Accruals",3,"med","invoice,budget_line","Drafts schedules; controller approves","ERP read"),T("fc","Forecast refresh","Forecast",4,"med","budget_line,project","Updates in a draft version only","Budgets","fc")],mix:[8,22,4,50,10,6]},
 proc:{role:"finance",mod:"112122210",dat:"222221",app:[["Purchase orders","To $25,000; above needs CFO"]],tasks:[T("clause","Contract clause extraction","Contract review",3.5,"med","contract,contract_line","Flags clauses against the playbook","Contract Repository","ca"),T("quote","Vendor quote comparison","Quotes",3,"low","vendor_quote,company","Comparison with sources; never selects","Documents")],mix:[14,28,6,30,16,6]},
 ai:{role:"admin",mod:"121222134",dat:"222120",app:[["AI agent go-live","Sponsor plus AI platform lead"],["Model and spend cap changes","Up to $1,000 a month"],["Kill switch","Any scope up to tenant"]],tasks:[T("eval","Agent evaluation report compilation","Evaluations",4,"low","agent_skill,ai_request","Reads evaluation data only","AI gateway"),T("grd","Guardrail hit review","Guardrails",3,"low","ai_request,audit_event","Groups hits; reviewer decides","AI gateway"),T("att","Model inventory attestations","Attestations",2,"low","agent_skill,person","Reminders and drafts only","Registry")],mix:[16,22,26,14,16,6]},
 editor:{role:"pm",mod:"211221111",dat:"221120",app:[["Editorial changes","Within the editor's assigned standards"]],tasks:[T("cmt","Comment-letter summarization","Comments",5,"low","comment_thread,document","Summaries cite the letter and paragraph","Standards Platform"),T("red","Redline comparison and change logs","Redlines",3,"low","document,release","Shows differences only; editor accepts","Standards Platform"),T("sty","Style-guide consistency pass","Style",4,"low","document,style_rule","Tracked-change suggestions only","Standards Platform"),T("sch","Review scheduling","Scheduling",2,"low","meeting,person","Proposes; never sends","Calendar")],mix:[12,10,50,12,10,6]}
};
/* ---------- owner resolution: names and role titles used by METRICS, PROCLIB, PLAT and SVCREG ---------- */
const ALIAS={};
const A=(who,list)=>list.split(",").forEach(k=>ALIAS[k.trim().toLowerCase()]=who);
A("Sam Patel","platform team,platform owner,platform lead,release train engineers");A("Tom Becker","service desk,service desk lead,service desk manager,ops team,it ops,operations,operations lead,incident commander,incident manager,service owners");
A("Maya Ortiz","pmo,pmo director,portfolio office,portfolio office lead,resource office,resource management,resource manager,capacity planning,benefit owners,pmo and procurement");A("Avery Chen","finance,controller,finance controller,accounting policy,finance and it ops,finance (controller)");
A("Marcus Reid","cfo,cfo office");A("Casey Rowan","cio office,executive office");A("Catherine Doyle","chief strategy officer,strategy office,chief of staff");A("Anil Mehta","data council,data council chair");A("Rosa Delgado","data governance,data stewards,field stewards");
A("Kenji Watanabe","ai governance,ai governance board,ai platform lead,ai governance lead,governance office");A("Noor Haddad","knowledge,knowledge manager,knowledge office,knowledge and automation");A("Nia Brooks","change manager,change management,process governance lead,process office,process owners");
A("Hollis Grey","release management,release manager,release office");A("Camille Ortega","vendor management,vendor mgmt,vendor manager,contract owners,procurement lead");A("Theo Marlowe","compliance lead,meridian legal,procurement and legal,general counsel delegate,internal audit");
A("Leila Haddad","experience office");A("Rina Kovacs","data architect");A("Jordan Lee","architecture,enterprise architect");A("Noelle Park","finance operations,accounts payable");A("Joanna Pierce","people office,head of people operations");A("Ines Duarte","cmdb owner,cmdb team,configuration manager,it asset management");
A("Priti Joshi","service level manager,problem manager");A("Rina Okafor","security,security lead,security and risk");A("Carla Reyes","integration lead,integration team");A("Leah Moss","automation team");A("Victor Amaya","tbm practice lead,fp&a,finops,it finance");A("Ruben Castillo","facilities,facilities lead,facilities and campus lead,campus");A("Wes Hartley","room bookings");A("Lena Hargrove","commercial,chief commercial officer,customer experience,sales");A("Tomas Reyes","distribution,fulfillment,warehouse,distribution and fulfillment manager");A("Dmitri Kowal","plant,plant operations,pilot plant,plant operations manager");A("Sofia Arenas","process control,control room,control systems");A("Mei-Ling Zhou","quality engineer,quality");A("Joel Tran","maintenance,maintenance planner");A("Alba Torres","buyer,purchasing");A("Zainab Ali","customer care,customer care lead");A("Ben Alvarez","quality,ai quality");A("Anita Cole","design systems");A("Dev Rao","service portfolio manager");A("Elena Marsh","chief editor");
/* ---------- build the staff list and make sure the directory has everyone ---------- */
const STAFF=RAW.split("\n").map(l=>{const c=l.split("|");return{n:c[0],role:c[1],mgr:c[2]==="-"?null:c[2],unit:c[3],rt:c[4],dot:c[5]||"",mx:(c[6]||"").split(",").filter(Boolean).map(z=>{const p=z.split(":");return{p:p[0],pct:+p[1]}}),fn:(c[7]||"").split(";").filter(Boolean),value:c[8]||"",loc:c[9]||"Remote",yrs:+c[10]||1}});
const BY={};STAFF.forEach(p=>BY[p.n]=p);
const NAMES=new Set(STAFF.map(p=>p.n));
const SKILL_BY={ceo:["Executive leadership","Board relations"],cio:["Executive sponsor","Portfolio","Strategy"],cfo:["Financial management","Audit"],chiefed:["Standards writing","Editorial review"],hr:["People operations","Policy"],legal:["Contract law","Compliance"],pmo:["Portfolio management","PMP","Risk"],pm:["PMP","Agile delivery"],comms:["Communications","Change adoption"],arch:["Enterprise architecture","Integration"],eng:["Azure","Kubernetes","On-call"],dev:["Software development","Test automation"],data:["Data engineering","Taxonomy"],desk:["ITIL 4","Incident management"],ops:["Observability","Backup and restore"],sec:["Entra ID","NIST CSF"],chg:["ITIL 4 Change","CAB facilitation"],ctrl:["Accounting","Invoice approval","Budgeting"],apfa:["Accounts payable","Forecasting"],proc:["Procurement","Vendor management"],ai:["AI governance","Evaluation"],editor:["Editorial review","Standards"]};
const COLS=["--p1","--p2","--p3","--p4","--s2","--s3","--e3","--e4","--u2","--u3","--w1","--w2"];
function ensureDir(){
 STAFF.forEach((p,i)=>{if(window.who&&who(p.n))return;
  const id=slug(p.n);DIR.push({id,name:p.n,kind:"human",role:p.role,team:p.unit,org:"Meridian Standards Foundation",skills:(SKILL_BY[p.rt]||[]).slice(),loc:p.loc,hrs:40,rate:0,c:COLS[i%COLS.length],email:id.replace(/-/g,".")+"@meridian.example",mgr:p.mgr||undefined,tenure:p.yrs})})}
/* data hygiene: a person must never carry a role as a name. The seeded directory had "Chief Editor" as a person; the person is Elena Marsh. */
(function(){const d=DIR.find(x=>x.name==="Chief Editor"&&x.kind==="human");if(d){Object.assign(d,{name:"Elena Marsh",id:"elena-marsh",role:"Chief editor",team:"Editorial",email:"elena.marsh@meridian.example",mgr:"Catherine Doyle"})}
 const c=DIR.find(x=>x.name==="Casey Rowan");if(c)c.email="casey.rowan@meridian.example"})();
ensureDir();
O.ensureDir=ensureDir;
const dirRec=n=>(window.who&&who(n))||null;

/* ---------- the tree ---------- */
let REV=1;const bump=()=>{REV++;memo={}};let memo={};
const memoF=(k,f)=>{const key=k+"|"+REV;if(memo[key]===undefined)memo[key]=f();return memo[key]};
function humanKids(n){return STAFF.filter(p=>p.mgr===n).map(p=>p.n)}
function chainUp(n){const o=[];let c=BY[n];while(c&&c.mgr){o.push(c.mgr);c=BY[c.mgr]}return o}
function depthOf(n){return chainUp(n).length}
function orgSize(n){let t=0;const go=x=>humanKids(x).forEach(k=>{t++;go(k)});go(n);return t}
function layers(){return Math.max(...STAFF.map(p=>depthOf(p.n)))+1}
/* ---------- AI agents: seeds from the directory and the AI Control Tower, plus agents built here ---------- */
const AG_SEED={
 "First Officer":{sp:"Maya Ortiz",hrs:3,does:"Joins meetings, takes notes, files decisions and actions with owners."},
 "Invoice Advisor":{sp:"Avery Chen",hrs:2.5,does:"Scores invoices against the PO, contract and history; recommends approve, hold or reject."},
 "Knowledge Curator":{sp:"Tom Becker",hrs:2,does:"Drafts knowledge articles from resolved incidents for an owner to publish."},
 "Test Agent":{sp:"Sam Patel",hrs:3,does:"Generates and runs sandbox tests; a second model validates results."},
 "Personal assistant":{sp:"Casey Rowan",hrs:3.5,does:"Prepares briefings and drafts replies from the executive's own calendar and tasks."},
 "Triage Agent":{sp:"Tom Becker",hrs:5,does:"Classifies and routes incidents; finds similar past incidents."},
 "PMO Agent":{sp:"Maya Ortiz",hrs:4,does:"Drafts status, checks critical path and forecasts finish dates."},
 "Change Risk Agent":{sp:"Nia Brooks",hrs:2.5,does:"Scores change risk and detects collisions with freezes and other changes."},
 "Contract Analyst Agent":{sp:"Camille Ortega",hrs:3.5,does:"Extracts clauses and obligations and matches them to the playbook."},
 "Ops Agent":{sp:"Tom Becker",hrs:2,does:"Runs approved remediation runbooks for known alerts."},
 "Event Correlator":{sp:"Sam Patel",hrs:3.5,does:"Groups alerts into incidents and suppresses duplicates."},
 "Resource Agent":{sp:"Maya Ortiz",hrs:2,does:"Levels capacity and proposes staffing moves for approval."},
 "Room Scheduler":{sp:"Tom Becker",hrs:1.5,does:"Books rooms and AV for meetings within booking rules."},
 "Learning Coach":{sp:"Nia Brooks",hrs:1.5,does:"Nudges people on assigned training and answers course questions."},
 "Forecast Agent":{sp:"Avery Chen",hrs:3,does:"Drafts financial reforecasts for the controller to approve."}};
const LVL={suggest:{n:"Suggest",auto:0,short:"Suggest"},approval:{n:"Act with approval",auto:2,short:"Approve"},act:{n:"Act within rules",auto:3,short:"Act"}};
O.LVL=LVL;O.agSeed=AG_SEED;
const lvlOfAuto=a=>a>=3?"act":a>=2?"approval":"suggest";
function seedAgents(){
 return DIR.filter(d=>d.kind==="ai"&&AG_SEED[d.name]).map(d=>{const s=AG_SEED[d.name],g=(window.S&&S.agents||[]).find(a=>a.id===d.agent||a.n===d.name);
  const pa=((S.ppl&&S.ppl.agents)||[]).find(a=>a.n===d.name);
  const auto=g&&g.auto>=0?g.auto:pa?(pa.tier>=3?3:pa.tier===2?2:0):0;
  const r=rnd(d.name+"ev");
  return{id:g?g.id:slug(d.name),name:d.name,sponsor:s.sp,autonomy:lvlOfAuto(auto),status:g?(g.st==="killed"?"killed":g.st==="paused"?"paused":"running"):"running",does:s.does,hrs:s.hrs,tools:g?g.tools.slice():(pa?pa.scope.slice():["Records API"]),data:g?g.data.slice():(pa?pa.scope.slice():["Records"]),guards:g?g.guards.slice():(pa?pa.guards.slice():["Drafts only"]),kill:pa?pa.kill:"agent",model:g?g.model:(pa?pa.model:"Claude Sonnet"),
   opps:[],created:"2026-0"+(3+Math.floor(r()*5))+"-"+(10+Math.floor(r()*15)),source:"seed",eval:{accept:Math.round(72+r()*21),err:+(1+r()*4).toFixed(1),esc:Math.round(4+r()*9),runs:Math.round(40+r()*320)},realized:s.hrs*(0.78+r()*.2),dirName:d.name}})}
const agentsAll=()=>memoF("agents",()=>seedAgents().concat(OS.built));
O.agents=agentsAll;
const agentsOf=n=>agentsAll().filter(a=>a.sponsor===n);
O.agentsOf=agentsOf;
O.agentByName=nm=>agentsAll().find(a=>a.name===nm)||null;
/* ---------- ownership: computed from the owner fields that already exist in each registry ---------- */
function res(s){if(!s)return null;s=String(s);if(NAMES.has(s))return s;const k=s.toLowerCase().replace(/\s*\(.*?\)\s*/g,"").trim();if(ALIAS[k])return ALIAS[k];const m=Object.keys(NAMES.size?BY:{}).find(n=>k===n.toLowerCase());return m||null}
O.resolve=res;
function ownIndex(){return memoF("own",()=>{
 const o={};STAFF.forEach(p=>o[p.n]={metrics:[],procs:[],ents:[],svcs:[],projs:[],raid:[],backup:[]});const un={metrics:[],procs:[],ents:[],svcs:[]};
 const add=(k,key,owner,id)=>{const r=res(owner);if(r&&o[r])o[r][k].push(id);else un[k].push({id,owner})};
 Object.keys(METRICS).forEach(id=>add("metrics","metrics",METRICS[id].owner,id));
 try{PROCLIB.list().forEach(p=>{add("procs","procs",p.owner,p.id);const b=res(p.backup);if(b&&o[b])o[b].backup.push(p.id)})}catch(e){}
 try{PLAT.entities().forEach(e=>add("ents","ents",e.steward||e.owner,e.id))}catch(e){}
 try{SVCREG.forEach(s=>{add("svcs","svcs",s.owner,s.id)})}catch(e){}
 try{PROJ.forEach(p=>{const r=res(p.owner);if(r&&o[r])o[r].projs.push(p.id)})}catch(e){}
 try{(window.PPMRAID||[]).filter(r=>r.s!=="closed").forEach(r=>{const x=res(r.own);if(x&&o[x])o[x].raid.push(r.id)})}catch(e){}
 const tot=Object.keys(METRICS).length+(()=>{try{return PROCLIB.list().length}catch(e){return 0}})()+(()=>{try{return PLAT.entities().length}catch(e){return 0}})()+(()=>{try{return SVCREG.length}catch(e){return 0}})();
 const bad=un.metrics.length+un.procs.length+un.ents.length+un.svcs.length;
 return{by:o,un,total:tot,named:tot-bad,pct:tot?Math.round(100*(tot-bad)/tot):100}})}
O.ownIndex=ownIndex;
O.ownRecs=n=>ownIndex().by[n]||{metrics:[],procs:[],ents:[],svcs:[],projs:[],raid:[],backup:[]};
/* ---------- permissions: from the access roles in Admin, the DOA tiers in Budgets and the role template ---------- */
const CAPL={view:"View records",fin:"View finance records",contract:"Manage contracts",restricted:"View restricted data",edit:"Edit records",approve:"Approve invoices",agents:"Run AI agents",export:"Export data",config:"Change configuration",secadm:"Manage security"};
function doaFor(n){
 const p=BY[n];if(!p)return null;let tiers=[];try{tiers=DOA.tiers()}catch(e){}
 const map={"Chief executive":"CEO","Chief financial officer":"CFO","Chief information officer":"CIO","Portfolio lead":"Portfolio lead"};
 let role=map[p.role]||null;if(!role&&humanKids(n).length)role="Budget owner";
 const t=tiers.find(x=>x.role===role);return t?{tier:t.id,role:t.role,max:t.max}:null}
O.doaFor=doaFor;
function perms(n){
 const p=BY[n];if(!p)return null;const t=RT[p.rt]||RT.pm;
 const roles=(S.adm&&S.adm.roles)||[];const r=roles.find(x=>x.id===t.role)||{id:t.role,n:t.role,caps:["view"]};
 const mod=MG.map((g,i)=>({g,lvl:+t.mod[i]}));
 const dat=DC.map((c,i)=>({c,lvl:+t.dat[i]}));
 const d=doaFor(n);const app=[];
 if(d)app.push({what:"Spend and budget approvals",limit:d.max?("Up to $"+d.max.toLocaleString("en-US")):"Above all tiers (board)",basis:"Delegation of authority, tier "+d.tier+" ("+d.role+")"});
 t.app.forEach(a=>app.push({what:a[0],limit:a[1],basis:"Role: "+r.n}));
 if(humanKids(n).length)app.push({what:"Time off and expenses for direct reports",limit:humanKids(n).length+" direct report"+(humanKids(n).length===1?"":"s"),basis:"Manager"});
 const ag=agentsOf(n);if(ag.length)app.push({what:"Accountable sponsor for AI agents",limit:ag.length+" agent"+(ag.length===1?"":"s")+"; can pause or stop each",basis:"AI governance policy"});
 let dr=[];try{dr=(DOA.rules()||[]).filter(x=>x.role&&(p.role.indexOf(x.role)>=0||(p.rt==="legal"&&/Legal|Procurement/.test(x.role))||(p.rt==="sec"&&/Security/.test(x.role))||(p.rt==="arch"&&/Architecture/.test(x.role))||(p.rt==="hr"&&/HR/.test(x.role))))}catch(e){}
 dr.forEach(x=>app.push({what:"Required reviewer: "+x.cat,limit:"From $"+(x.min||0).toLocaleString("en-US"),basis:x.why||"Control rule"}));
 return{role:r,caps:(r.caps||[]).map(c=>CAPL[c]||c),mod,dat,app,groupAdmin:t.mod.indexOf("4")>=0}}
O.perms=perms;O.MG=MG;O.LV=LV;O.DC=DC;O.DA=DA;
/* ---------- work, performance, time ---------- */
function pending(n){return memoF("pend:"+n,()=>{try{return workFor(n)}catch(e){return[]}})}
O.pending=pending;
function perf(n){
 const p=BY[n],r=rnd(n+"perf"),own=O.ownRecs(n),wl=(()=>{try{return workload(n)}catch(e){return{pct:60,hrs:20,cap:40,items:0}}})();
 const ms=own.metrics.map(id=>METRICS[id]).filter(Boolean);
 const ratio=m=>{const c=+m.cur,t=+m.tgt;if(!t&&t!==0)return 1;if(m.dir==="max")return Math.min(1,c/t);return c<=t?1:Math.max(0,t/c)};
 const att=ms.length?Math.round(100*ms.reduce((a,m)=>a+ratio(m),0)/ms.length):Math.round(78+r()*18);
 const goals=ms.slice(0,4).map(m=>({n:m.n,pct:Math.round(100*ratio(m)),src:"Metric you own"}));
 while(goals.length<3){const extra=[["Deliver assigned work by due date",Math.round(80+r()*18)],["Complete required training",Math.round(85+r()*15)],["Peer feedback score",Math.round(72+r()*24)]][goals.length];goals.push({n:extra[0],pct:extra[1],src:"Goal in review cycle"})}
 const sla=Math.round(86+r()*12);
 const cyc=["Annual","Semiannual"][Math.floor(r()*2)];const lastM=Math.floor(r()*6)+1;
 return{att,goals,sla,wl,review:{cycle:cyc,last:"2026-0"+lastM+"-"+(10+Math.floor(r()*15)),next:cyc==="Annual"?"2027-0"+lastM+"-15":"2026-12-"+(10+Math.floor(r()*10)),rating:att>=92?"Exceeds":att>=82?"Meets":"Developing"},delivery:Math.round(80+r()*18),quality:Math.round(78+r()*20)}}
O.perf=perf;
const TM=["Meetings and calls","Approvals and reviews","Project and delivery work","Operations and support","Reporting and administration","Learning and other"];
function time(n){
 const p=BY[n],t=RT[p.rt]||RT.pm,r=rnd(n+"time");const mix=t.mix.map(v=>Math.max(2,v+Math.round((r()-.5)*6)));const sum=mix.reduce((a,b)=>a+b,0);const cap=(dirRec(n)||{}).hrs||40;
 const opps=O.opps(n);
 const rows=mix.map((v,i)=>({k:TM[i],pct:Math.round(100*v/sum),hrs:+(cap*v/sum).toFixed(1)}));
 /* map opportunity domains onto time buckets for the automatable share */
 const bucket=o=>/Minutes|Meeting|Status|Briefing|Digest/i.test(o.dom)?(o.dom==="Status"?4:0):/Approv|Queue|Invoice|CAB|Review|Close|Access|Quote|Contract|NDA|Change|Comments/i.test(o.dom)?1:/Triage|Alert|Pipeline|CMDB|Backup|On-call|Runbook|Patching|Cloud|Knowledge/i.test(o.dom)?3:/Comms|Newsletter|Survey|Onboarding|Training|Policy|Scheduling|Reports|Reporting|Metadata|Data/i.test(o.dom)?4:2;
 const avail=[0,0,0,0,0,0];opps.filter(o=>!o.cov).forEach(o=>avail[bucket(o)]+=o.hrs);
 rows.forEach((x,i)=>{x.auto=Math.min(+(x.hrs*.6).toFixed(1),+avail[i].toFixed(1))});
 return rows}
O.time=time;
/* ---------- automation opportunities: from recurring tasks and from pending work ---------- */
const PT={ // pending work tag -> opportunity
 APPR:["Approval briefing packs","Approvals",.25,"low","approval,change_request,invoice","Never approves; shows the DOA route and policy checks","Inbox",""],
 INV:["Invoice pre-check","Invoices",.3,"low","invoice,purchase_order,contract_line","Suggests only; cannot release payment","ERP read","ia"],
 MACT:["Meeting action follow-up","Actions",.2,"low","meeting,raid_item","Reminders to owners only","Mail","fo"],PTO:["Time-off conflict checks","Leave",.15,"low","time_off,allocation","Reads calendars; proposes only","Directory",""],
 REV:["Review draft preparation","Reviews",.8,"low","perf_feedback","Collates evidence; no ratings suggested","Directory",""],RAID:["RAID status chasing","RAID",.25,"low","raid_item","Reminders only","Mail","pa"],
 INC:["First-response triage","Incidents",.3,"low","incident,business_service","Suggests class and queue","Service desk","ta"],CHG:["Change risk summaries","Change risk",.35,"low","change_request,ci","Scores and explains; manager decides","CMDB read","cr"],
 KB:["Knowledge review pre-checks","Knowledge",.3,"low","knowledge_article","Flags gaps; owner publishes","Knowledge","kc"],TASK:["Task status updates","Task updates",.12,"low","project_task","Drafts updates; owner confirms","Records API",""],
 WQ:["Work queue sorting","Queue",.1,"low","request_item","Suggests order","Service desk",""],STORY:["Backlog grooming notes","Backlog",.2,"low","project_task","Drafts only","Repository",""],PR:["Pull request summaries","Reviews",.25,"low","pull_request","Read-only","Repository",""],
 TRN:["Training reminders","Training",.1,"low","course,learning_event","Nudges only","Learning records","lc"],SLA:["Agreement review prep","Agreements",.5,"low","sla_definition","Reads only","Registry",""],OBL:["Obligation reminders","Obligations",.3,"low","contract","Reminders to owners","Contract Repository","ca"]};
const RISKW={low:1,med:.72,high:.45},SHARE={low:.65,med:.5,high:.3};
function opps(n){return memoF("opps:"+n,()=>{
 const p=BY[n];if(!p)return[];const t=RT[p.rt]||RT.pm;const r=rnd(n+"opp");const out=[];
 const mine=agentsOf(n);const coveredBy=cov=>{if(!cov)return null;const map={ia:"Invoice Advisor",fo:"First Officer",ta:"Triage Agent",kc:"Knowledge Curator",tq:"Test Agent",lc:"Learning Coach",fc:"Forecast Agent",ra:"Resource Agent",ec:"Event Correlator",cr:"Change Risk Agent",ca:"Contract Analyst Agent",pa:"Personal assistant",pm:"PMO Agent"};const a=mine.find(x=>x.name===map[cov]);return a?a.name:null};
 t.tasks.forEach(k=>{const cv=coveredBy(k.cov);const done=OS.built.find(b=>b.sponsor===n&&(b.opps||[]).indexOf(n+":"+k.id)>=0);
  const sv=+(k.hrs*SHARE[k.risk]).toFixed(1);out.push({id:n+":"+k.id,who:n,title:k.title,dom:k.dom,hrs:sv,task:k.hrs,risk:k.risk,src:"Recurring task",why:"Task "+k.hrs+" h/wk · agent-preparable "+sv+" h/wk ("+Math.round(sv/k.hrs*100)+"%)",data:k.data,guard:k.guard,tools:k.tools,conf:+(0.74+r()*.2).toFixed(2),cov:cv,builtBy:done?done.name:null})});
 const pw=pending(n);
 pw.forEach(g=>{const d=PT[g.tag];if(!d)return;const cnt=g.rows.length;const hrs=+Math.min(4,Math.max(.5,cnt*d[2]*SHARE[d[3]])).toFixed(1);if(cnt<2||hrs<.8)return;
  const key="pw"+g.tag;if(out.some(o=>o.dom===d[1]))return;const cv=coveredBy(d[7]);const done=OS.built.find(b=>b.sponsor===n&&(b.opps||[]).indexOf(n+":"+key)>=0);
  out.push({id:n+":"+key,who:n,title:d[0],dom:d[1],hrs,task:hrs,risk:d[3],src:"Pending work",why:"Queue: "+cnt+" open in "+g.kind.toLowerCase(),data:d[4].split(","),guard:d[5].split(";"),tools:d[6].split(","),conf:+(0.8+r()*.15).toFixed(2),cov:cv,builtBy:done?done.name:null,pendKind:g.kind,pendCount:cnt})});
 out.forEach(o=>{o.score=+(o.hrs*RISKW[o.risk]*o.conf).toFixed(2)});
 return out.sort((a,b)=>(a.cov||a.builtBy?1:0)-(b.cov||b.builtBy?1:0)||b.score-a.score)})}
O.opps=opps;
O.openOpps=n=>opps(n).filter(o=>!o.cov&&!o.builtBy);
function capacity(n){const a=agentsOf(n);const ret=+a.filter(x=>x.status!=="killed").reduce((s,x)=>s+(x.realized!=null?x.realized:x.hrs),0).toFixed(1);const avail=+O.openOpps(n).reduce((s,o)=>s+o.hrs,0).toFixed(1);const cap=(dirRec(n)||{}).hrs||40;return{returned:ret,available:avail,cap,pctReturned:Math.round(100*ret/cap),pctAvail:Math.round(100*avail/cap)}}
O.capacity=capacity;
/* ---------- build an agent (the one-click path and the customized path both end here) ---------- */
const REINVEST={ctrl:"forecast partnering with budget owners and audit readiness",pmo:"stakeholder coaching and portfolio scenario planning",pm:"risk conversations and vendor relationships",desk:"problem management and coaching new analysts",sec:"threat hunting and design reviews",chg:"improving the change process with delivery teams",editor:"substantive review of the hardest drafts",data:"modeling and data product design",eng:"resilience work and engineering improvements",arch:"design coaching and roadmap work",hr:"manager coaching and workforce planning",legal:"negotiation and risk advice",cio:"vendor strategy and relationships with the board",ceo:"members, regulators and strategy",cfo:"scenario planning with the board",ai:"new use cases with business teams",comms:"member listening",dev:"feature work and design",ops:"reliability improvements",apfa:"vendor relationships and analysis",proc:"supplier negotiation"};
O.reinvest=n=>REINVEST[(BY[n]||{}).rt]||"higher-value work";
function agentName(n,opps){const dom=(opps[0]&&opps[0].dom)||"Work";const d={"Close":"Close","Briefing":"Briefing","Invoices":"Invoice","Status":"Status","Triage":"Service desk","Comments":"Editorial","Alerts":"Alert","Security alerts":"Security alert","Access review":"Access review","CAB":"Change","Contract review":"Contract","Runbooks":"Runbook","Data quality":"Data quality","Incident comms":"Incident comms","Invoice match":"Payables"}[dom]||dom;return first(n)+"'s "+d+" Assistant"}
O.agentName=agentName;
function build(o){
 o=o||{};const n=o.sponsor;const p=BY[n];if(!p)return{ok:false,err:"Unknown sponsor"};
 const all=opps(n);let sel=(o.opps||[]).map(id=>all.find(x=>x.id===id)).filter(Boolean);
 if(!sel.length){const top=all.filter(x=>!x.cov&&!x.builtBy)[0];if(top)sel=[top]}
 if(!sel.length)return{ok:false,err:"No open opportunities for "+n};
 const high=sel.some(x=>x.risk==="high");let al=o.autonomy||"suggest";if(high&&al==="act")al="approval";
 const nm=(o.name||agentName(n,sel)).trim();
 if(agentsAll().some(a=>a.name===nm)){return{ok:false,err:"An agent named "+nm+" already exists. Pick another name."}}
 const hrs=+sel.reduce((s,x)=>s+x.hrs,0).toFixed(1);
 const tools=[...new Set(sel.flatMap(x=>x.tools))],data=[...new Set(sel.flatMap(x=>x.data))],guards=[...new Set((o.guards&&o.guards.length?o.guards:sel.flatMap(x=>x.guard)).concat(["Every action is written to the audit trail","Sponsor can pause or stop it at any time"]))];
 const id="ag_"+slug(nm).replace(/-/g,"_")+"_"+(OS.seq++);
 const metrics=o.eval&&o.eval.length?o.eval:["Suggestions accepted","Hours returned a week","Errors found in review"];
 const rec={id,name:nm,sponsor:n,autonomy:al,status:"running",does:sel.map(x=>x.title).join("; ")+".",hrs,tools,data,guards,kill:o.kill||"agent",model:o.model||"Claude Sonnet",opps:sel.map(x=>x.id),created:TODAY,source:"built",evalMetrics:metrics,reinvest:o.reinvest||O.reinvest(n),eval:{accept:null,err:null,esc:null,runs:0},realized:0,pilotEnds:"2026-10-24",dirName:nm};
 OS.built.push(rec);bump();
 /* registry: the AI Control Tower list, the people directory and the people module's agent list */
 try{S.agents.push({id,n:nm,kind:"Personal agent",prov:"Anthropic",model:rec.model,cap:"personal",auto:LVL[al].auto,runs:0,spend:0,"cap$":5,hits:0,st:"running",owner:p.unit,tools:tools.slice(0,6),data:data.slice(0,6),guards:guards.slice(0,5),act:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],sponsor:n,orgBuilt:true})}catch(e){}
 try{if(!(window.who&&who(nm)))DIR.push({id:slug(nm),name:nm,kind:"ai",role:"Agent sponsored by "+n+": "+sel[0].dom.toLowerCase()+" assistant",team:"AI agents",org:"",skills:sel.map(x=>x.dom),loc:"",hrs:168,rate:0,c:"--p4",agent:id,mgr:n})}catch(e){}
 try{const pp=S.ppl&&S.ppl.people&&S.ppl.people.find(q=>q.n===n);if(pp&&S.ppl.agents)S.ppl.agents.push({id,n:nm,tier:al==="act"?3:al==="approval"?2:1,model:rec.model,owner:pp.id,scope:data.slice(0,4),cap:20,base:0,kill:rec.kill,guards:guards.slice(0,4),does:rec.does,kind:"agent",c:"--p4"})}catch(e){}
 OS.log.unshift({t:Date.now(),agent:nm,sponsor:n,what:"Agent created in "+LVL[al].n+" mode with "+sel.length+" capability"+(sel.length===1?"":"ies").replace("ies","ies")+" ("+hrs+" h/week estimated)",by:"Casey Rowan"});
 audit("Agent built",nm+" sponsored by "+n+", "+LVL[al].n+", "+hrs+" h/week");
 if(window.ATLAS&&ATLAS.bump)try{ATLAS.bump()}catch(e){}
 return{ok:true,agent:rec}}
O.build=build;
function setAutonomy(name,al){const a=agentsAll().find(x=>x.name===name);if(!a)return false;const opp=opps(a.sponsor).filter(o=>(a.opps||[]).indexOf(o.id)>=0);if(al==="act"&&opp.some(o=>o.risk==="high"))return false;a.autonomy=al;try{const g=S.agents.find(x=>x.id===a.id);if(g)g.auto=LVL[al].auto}catch(e){}
 OS.log.unshift({t:Date.now(),agent:name,sponsor:a.sponsor,what:"Autonomy changed to "+LVL[al].n,by:"Casey Rowan"});audit("Agent autonomy",name+": "+LVL[al].n);bump();return true}
function setState(name,st){const a=agentsAll().find(x=>x.name===name);if(!a)return false;a.status=st;try{const g=S.agents.find(x=>x.id===a.id);if(g)g.st=st}catch(e){}
 OS.log.unshift({t:Date.now(),agent:name,sponsor:a.sponsor,what:st==="running"?"Restored to running":st==="paused"?"Paused by the sponsor (kill switch, this agent)":"Stopped (kill switch, this agent)",by:"Casey Rowan"});audit("Agent "+st,name);bump();return true}
O.setAutonomy=setAutonomy;O.setState=setState;
/* ---------- roll-ups used by the screens and the metrics ---------- */
function stats(){return memoF("stats",()=>{
 const mgrs=STAFF.filter(p=>humanKids(p.n).length);const spans=mgrs.map(p=>humanKids(p.n).length);const ag=agentsAll();const loads=STAFF.map(p=>{try{return workload(p.n).pct}catch(e){return 60}});
 const ret=ag.filter(a=>a.status!=="killed").reduce((s,a)=>s+(a.realized!=null?a.realized:a.hrs),0);
 const open=STAFF.reduce((s,p)=>s+O.openOpps(p.n).reduce((q,o)=>q+o.hrs,0),0);
 const gov=ag.filter(a=>a.sponsor&&a.guards&&a.guards.length&&a.kill).length;
 let vac=0;try{vac=O.vacOpen?O.vacOpen().length:((S.pp2&&S.pp2.vac)||[]).filter(v=>v.status!=="Filled").length}catch(e){}
 return{heads:STAFF.length,agents:ag.length,mgrs:mgrs.length,avgSpan:+(spans.reduce((a,b)=>a+b,0)/Math.max(1,spans.length)).toFixed(1),maxSpan:Math.max(...spans),layers:layers(),over:loads.filter(x=>x>95).length,returned:+ret.toFixed(1),open:+open.toFixed(1),govPct:ag.length?Math.round(100*gov/ag.length):100,dotted:STAFF.filter(p=>p.dot).length,matrix:STAFF.filter(p=>p.mx.length).length,vac,
  covered:STAFF.filter(p=>agentsOf(p.n).length).length,unowned:ownIndex().total-ownIndex().named,ownPct:ownIndex().pct,
  accept:(()=>{const q=ag.filter(a=>a.eval&&a.eval.accept!=null);return q.length?Math.round(q.reduce((s,a)=>s+a.eval.accept,0)/q.length):0})(),
  inBand:mgrs.filter(p=>{const s=humanKids(p.n).length;return s>=3&&s<=9}).length}})}
O.stats=stats;
Object.assign(O,{staff:STAFF,P:n=>BY[n]||null,by:BY,names:NAMES,kids:humanKids,up:chainUp,depth:depthOf,size:orgSize,layers,RT,TM,dir:dirRec,slug,first,bump,sidebar:null,res,rev:()=>REV});
/* ---------- engine metrics: used on the screen and in the contract ---------- */
const MR=(kind,ref,title,agent,prog)=>({kind,ref,title,agent,auto:false,state:"idle",prog});
Object.assign(METRICS,{
 m_org_cap:{n:"Capacity returned by agents",f:"Σ hours a week that sponsored agents take off their sponsors (accepted work only) ÷ Σ sponsors' contracted hours × 100",u:"%",cur:5,tgt:6,badAt:1.5,dir:"max",max:25,tr:[1,1.5,2,2.6,3.2,3.9,4.5,5],owner:"Joanna Pierce",use:["Org chart"],rem:MR("agent","AG-ORG1","Rank the next best automation opportunity per leader and offer to build it","Agent studio",true?"Ranks opportunities by hours returned and risk; the sponsor builds or declines":"")},
 m_org_gov:{n:"Agents fully governed",f:"Agents with a named sponsor, guardrails, an autonomy level and a kill switch ÷ all agents × 100",u:"%",cur:100,tgt:100,badAt:90,dir:"max",max:100,tr:[80,86,90,92,95,98,100,100],owner:"Kenji Watanabe",use:["Org chart"],rem:MR("sop","SOP-ORG2","Assign a sponsor and guardrails before an agent can go live","AI platform lead","Agent studio will not build an agent without a sponsor and guardrails")},
 m_org_own:{n:"Ownership coverage",f:"Metrics, processes, entities and services whose owner field resolves to a named person ÷ all of them × 100",u:"%",cur:78,tgt:95,badAt:60,dir:"max",max:100,tr:[60,64,68,70,73,75,77,78],owner:"Joanna Pierce",use:["Org chart"],rem:MR("sop","SOP-ORG3","Replace a role title or team name with a named owner and a backup","People Operations","Open the person profile, Owns tab, and assign the owner")},
 m_org_span:{n:"Managers within span of control",f:"Managers with 3 to 9 direct reports ÷ all managers × 100",u:"%",cur:60,tgt:80,badAt:50,dir:"max",max:100,tr:[50,52,55,55,58,58,60,60],owner:"Joanna Pierce",use:["Org chart"],rem:MR("kb","KB0788","Rebalance reporting lines or add a team lead","People Operations","Compare spans on the Reporting structures tab before moving anyone")},
 m_org_accept:{n:"Agent suggestions accepted",f:"Suggestions a person accepted without edits or with minor edits ÷ suggestions shown × 100",u:"%",cur:82,tgt:80,badAt:65,dir:"max",max:100,tr:[70,72,74,76,78,80,81,82],owner:"Kenji Watanabe",use:["Org chart"],rem:MR("agent","AG-ORG4","Review the lowest-accepted agent with its sponsor and tighten the prompt or scope","Agent studio","Opens the evaluation tab for the agent")}});
O.sync=function(){const s=stats();const set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=v;m.tr=m.tr.slice(0,7).concat([v])};
 const sp=STAFF.reduce((a,p)=>a+(((dirRec(p.n)||{}).hrs)||40),0);set("m_org_cap",+(100*s.returned/sp).toFixed(1));set("m_org_gov",s.govPct);set("m_org_own",s.ownPct);set("m_org_span",s.mgrs?Math.round(100*s.inBand/s.mgrs):100);if(s.accept)set("m_org_accept",s.accept)};
/* Person 360 gets a tab that points to the full org profile */
P360_TABS.push({label:"Role and agents",fn:r=>{const p=BY[r.name];if(r.kind==="ai"){const a=agentsAll().find(x=>x.name===r.name);return a?`<div class="org-facts"><span class="org-fc"><small>Sponsor</small><b>${H(a.sponsor)}</b></span><span class="org-fc"><small>Autonomy</small><b>${H(LVL[a.autonomy].n)}</b></span><span class="org-fc"><small>Hours returned</small><b data-role="metric">${a.hrs} h/wk</b></span><span class="org-fc"><small>State</small><b>${H(a.status)}</b></span></div><div class="row"><button class="btn primary" data-org-open="${H(a.sponsor)}" data-org-tab="6">Open ${H(first(a.sponsor))}'s agent studio</button></div>`:"<p class='muted'>Not in the org chart.</p>"}
 if(!p)return "<p class='muted'>This person is not on the Meridian org chart.</p>";const c=capacity(p.n);
 return `<p class="story" data-role="story"><b>Go to ${H(first(p.n))} for:</b> ${p.fn.map(H).join("; ")}.</p><p class="muted">${H(p.value)}</p><div class="row"><span class="pill info">${agentsOf(p.n).length} agent${agentsOf(p.n).length===1?"":"s"}</span><span class="pill good">${c.returned} h/week returned</span><span class="pill warn">${c.available} h/week still available</span></div><div class="row" style="margin-top:12px"><button class="btn primary" data-org-open="${H(p.n)}">Open org profile</button><button class="btn" data-org-open="${H(p.n)}" data-org-tab="6">Agent studio</button></div>`}});

/* ---------- ORGX contract (Round 13): people, accountability domains, ownerOf, byDomain, owns. Consumed by search, gap detection and the budget funnel. ---------- */
const DOM_RAW=`budget|Budget|budget,budgets,forecast,forecasting,funding,fund,spend,cost,costs,money,financial plan,variance|Victor Amaya|Marcus Reid
close|Financial close and reporting|close,month end,month-end,journal,journals,general ledger,financial statements|Avery Chen|Marcus Reid
ap|Accounts payable and invoices|invoice,invoices,payables,payment,payments,three-way match,vendor payment|Noelle Park|Avery Chen
proc|Procurement and purchasing|purchase,purchase order,po,sourcing,quotes,buying|Camille Ortega|Marcus Reid
vendor|Vendor management|vendor,vendors,supplier,suppliers,lumen,renewal,renewals|Camille Ortega|Maya Ortiz
contract|Contracts|contract,contracts,sow,terms,clauses,obligations,msa|Theo Marlowe|Camille Ortega
legal|Legal and regulatory|legal,regulatory,regulator,antitrust,conflict of interest,liability|Theo Marlowe|Catherine Doyle
audit|Audit and compliance|audit,auditor,compliance,controls,evidence,sox|Avery Chen|Theo Marlowe
risk|Enterprise risk|risk,risks,raid,risk register,exposure|Rina Okafor|Theo Marlowe
security|Information security|security,cyber,vulnerability,vulnerabilities,threat,phishing,encryption|Rina Okafor|Aaron Whitfield
access|Identity and access|access,identity,entra,permissions,joiner,leaver,privileged,entitlement|Colette Brandt|Rina Okafor
datagov|Data governance|data governance,governance,stewardship,data owner,data classification,lineage|Anil Mehta|Rosa Delgado
dataq|Data quality|data quality,quality rules,master data,duplicates,dq|Rosa Delgado|Yuki Tanaka
arch|Architecture and standards|architecture,design,integration pattern,target architecture,tech standards|Jordan Lee|Rina Kovacs
integ|Integrations and APIs|integration,integrations,api,interfaces,gateway,connectors|Carla Reyes|Rina Kovacs
know|Knowledge management|knowledge,articles,kb,runbook,runbooks,how-to,documentation|Noor Haddad|
change|Change enablement|change,changes,cab,change calendar,freeze,freezes,change request|Nia Brooks|Hollis Grey
adopt|Adoption and organizational change|adoption,training rollout,readiness,change management people,stakeholder readiness|Owen Pryce|Leila Haddad
incident|Incident management|incident,incidents,outage,major incident,p1,sev1,restore|Tom Becker|Priti Joshi
problem|Problem management|problem,problems,root cause,workaround,known error|Priti Joshi|Tom Becker
request|Service desk and requests|service desk,request,requests,catalog,helpdesk,help desk,tickets|Tom Becker|Maribel Cruz
sla|Service levels|sla,slas,service level,service levels,response time,targets|Priti Joshi|Tom Becker
release|Release management|release,releases,go-live,go live,rollback,deployment schedule|Hollis Grey|Nia Brooks
platform|Platform operations and availability|platform,uptime,availability,production,on-call platform,azure,capacity|Sam Patel|Ben Ito
cmdb|Configuration management|cmdb,configuration items,ci,assets,configuration database|Ines Duarte|Paula Grant
oncall|On-call and coverage|on-call,on call,rota,escalation,pager,coverage|Paula Grant|Sam Patel
finops|Cloud cost (FinOps)|cloud cost,finops,azure cost,azure spend,cost anomalies|Sam Patel|
bcdr|Business continuity and disaster recovery|continuity,disaster recovery,dr,bcp,backup,restore test,resilience||Sam Patel
portfolio|Portfolio management|portfolio,prioritization,funding order,stage gate,demand,pipeline|Maya Ortiz|Casey Rowan
delivery|Project delivery and status|project,projects,delivery,status,schedule,milestone,plan dates|Priya Shah|Maya Ortiz
qa|Testing and quality assurance|testing,qa,test plan,acceptance,regression,defects|Ben Alvarez|Anita Cole
strategy|Strategy and objectives|strategy,objectives,okr,okrs,board,priorities,annual plan|Catherine Doyle|Casey Rowan
techstrat|Technology strategy|technology strategy,roadmap,tech roadmap,digital strategy|Casey Rowan|Jordan Lee
aigov|AI governance|ai governance,ai policy,guardrails,model risk,ai risk,responsible ai|Kenji Watanabe|Theo Marlowe
aiops|AI agent operations|agents,ai agents,agent go-live,kill switch,autonomy,agent spend|Kenji Watanabe|Casey Rowan
people|People and HR|hr,hiring,onboarding,leave,benefits,performance review,headcount,people operations|Joanna Pierce|Grace Whitfield
skills|Training and skills|training,skills,courses,learning,certification|Grace Whitfield|Joanna Pierce
editorial|Editorial quality and publishing|editorial,publish,publishing,style guide,standards content,drafts|Elena Marsh|Pierce Caldwell
comms|Communications|communications,comms,announcements,newsletter,release notes,members|Leila Haddad|Elena Marsh
customer|Customer and member experience|customer,customers,buyers,complaint,refund,survey,csat,satisfaction|Lena Hargrove|Zainab Ali
fulfil|Distribution and fulfillment|warehouse,shipping,shipment,orders,inventory,stock,returns,fulfillment,pick|Tomas Reyes|Kofi Mensah
plantops|Pilot plant operations|plant,production,equipment,downtime,oee,yield,pilot plant|Dmitri Kowal|Sofia Arenas
quality|Quality and nonconformance|quality,nonconformance,ncr,inspection,quality hold,test results|Mei-Ling Zhou|Dmitri Kowal
control|Process control and safety|alarm,alarms,control room,permit to work,management of change,moc,handover,shift|Sofia Arenas|Dmitri Kowal
facilities|Facilities and maintenance|facilities,maintenance,work order,building,campus,safety inspection,space|Ruben Castillo|Joel Tran`;
const pid2=n=>n?slug(n):"";
const DOMAINS=DOM_RAW.split("\n").map(l=>{const c=l.split("|");return{id:c[0],label:c[1],aliases:c[2].split(",").map(x=>x.trim()).filter(Boolean),ownerId:c[3]?pid2(c[3]):"",backupId:c[4]?pid2(c[4]):""}});
const DOMBY={};DOMAINS.forEach(d=>DOMBY[d.id]=d);
const PBYID={};STAFF.forEach(p=>PBYID[slug(p.n)]=p);O.PBYID=PBYID;
const personRec=idOrName=>{if(!idOrName)return null;const k=String(idOrName);const h=PBYID[k]||PBYID[slug(k)]||null;if(h)return{id:slug(h.n),name:h.n,title:h.role,kind:"human",sponsor:null,unit:h.unit};
 const a=agentsAll().find(x=>x.name===k||x.id===k||slug(x.name)===k);return a?{id:a.id,name:a.name,title:"AI agent",kind:"agent",sponsor:a.sponsor,unit:"AI agents"}:null};
Object.defineProperty(O,"people",{configurable:true,enumerable:true,get(){return STAFF.map(p=>personRec(p.n)).concat(agentsAll().map(a=>personRec(a.id)))}});
O.domains=DOMAINS;
O.addDomain=d=>{if(!d||!d.id)return null;if(DOMBY[d.id])return DOMBY[d.id];const x=Object.assign({aliases:[],ownerId:"",backupId:""},d);DOMAINS.push(x);DOMBY[x.id]=x;try{if(O.bump)O.bump()}catch(e){}return x};
O.person=personRec;
O.ownerOf=id=>{const d=typeof id==="string"?DOMBY[id]:id;return d?personRec(d.ownerId):null};
O.backupOf=id=>{const d=typeof id==="string"?DOMBY[id]:id;return d?personRec(d.backupId):null};
const dview=d=>({id:d.id,label:d.label,aliases:d.aliases,ownerId:d.ownerId||null,backupId:d.backupId||null,owner:personRec(d.ownerId),backup:personRec(d.backupId),gap:!d.ownerId?"no owner":!d.backupId?"no backup":""});
O.domainView=dview;
function scoreDom(d,q,toks){let s=0;const L=d.label.toLowerCase();if(L===q||d.id===q)s+=100;if(L.indexOf(q)>=0)s+=40;
 d.aliases.forEach(a=>{if(a===q)s+=300;else if(q.indexOf(a)>=0&&a.length>2)s+=30+a.length;else if(a.indexOf(q)>=0&&q.length>2)s+=25});
 toks.forEach(t=>{if(t.length<3)return;if(L.indexOf(t)>=0)s+=12;d.aliases.forEach(a=>{if(a.split(" ").indexOf(t)>=0||a===t)s+=14;else if(a.indexOf(t)>=0&&t.length>3)s+=6})});return s}
O.searchDomains=text=>{const q=String(text||"").toLowerCase().trim();if(!q)return [];const toks=q.split(/[^a-z0-9&-]+/).filter(Boolean);return DOMAINS.map(d=>({d,s:scoreDom(d,q,toks)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).map(x=>dview(x.d))};
O.byDomain=text=>{const r=O.searchDomains(text);return r.length?r[0]:null};
O.owns=idOrName=>{const p=personRec(idOrName);if(!p)return [];return DOMAINS.filter(d=>d.ownerId===p.id||d.backupId===p.id).map(d=>({domainId:d.id,label:d.label,role:d.ownerId===p.id?"owner":"backup",other:personRec(d.ownerId===p.id?d.backupId:d.ownerId)}))};
O.gaps=()=>DOMAINS.filter(d=>!d.ownerId||!d.backupId).map(dview);
O.ownerLine=n=>{const r=O.owns(n).filter(x=>x.role==="owner");return r.map(x=>x.label+(x.other?" (backup: "+x.other.name+")":" (no backup)")).join("; ")};

})();
