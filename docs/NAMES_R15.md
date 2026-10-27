# Names, Round 15 (one name per screen)

Rule: the sidebar label, the page headline (h1), the breadcrumb's last item, the browser tab title and the search result for a screen are one string, taken from the sidebar label. The earlier marketing headline moves to a subtitle line above the story; the formal registration name stays in the tooltip only. Measured on all 148 screens at 1440px dark: label = h1 = breadcrumb = title prefix on every screen except Home (no breadcrumb by design, title is the product name).

Merged families: one menu entry with a view switcher at the top of each member. Member screens stay registered and reachable (links, search records, favorites, PROC and MODMAP references keep resolving) but leave the menu and the search screen list. Their label reads `Family: View`. `plat_data_old` redirects to `plat_data` through `R15.alias`.

| Screen id | Group | Name (sidebar = headline = breadcrumb = tab title) | Was in the sidebar | Was the page headline | Formal name (tooltip only) | Change |
|---|---|---|---|---|---|---|
| `home` | Home | **Home** | Home | Good afternoon, Casey | Home | headline moved to subtitle |
| `trace` | Strategy and performance | **Strategy to execution** (alias of `strat_exec`) | Trace goals to money and work | From budget to operations | Executive trace | R16: the old id aliases to `strat_exec` through `R15.alias`; links `go("trace",record)` open the Record chain view of the same screen |
| `strat_exec` | Strategy and performance | **Strategy to execution** | (new in R16) | Goals to capabilities, maturity roadmap, projects, money and work | Strategy to execution | New canonical screen. Views: Tree, Trace graph, Gaps, Mapping, Record chain (the old Executive trace) |
| `inv` | Money and contracts | **Approve invoices** | Approve invoices | Pay what was earned | Invoice approval | headline moved to subtitle |
| `fo` | My work | **Meetings: Calendar and follow-ups** | My meetings, calendar and follow-ups | Meetings that file themselves | First Officer | renamed; merged into "Meetings" as view "Calendar and follow-ups"; hidden from menu; headline moved to subtitle |
| `tower` | AI and governance | **AI agents** | Watch and control AI agents | Everything AI, in one place | AI Control Tower | renamed; family anchor, switcher added; headline moved to subtitle |
| `metrics` | Strategy and performance | **Measures and targets** | Measures and targets | Define once, use everywhere | Metrics | headline moved to subtitle |
| `kg` | Know our technology | **Impact and knowledge graph** | What a change would affect | Know what a change touches | Impact graph | renamed; family anchor, switcher added; headline moved to subtitle |
| `loop` | Strategy and performance | **Feedback and learning loops** | Feedback and learning loops | Every action teaches the product | Feedback loop | headline moved to subtitle |
| `port` | Plan and deliver projects | **Ideas and requests for new work** | Ideas and requests for new work | What should we fund | Demand and priorities | headline moved to subtitle |
| `ims` | Plan and deliver projects | **Schedules across projects** | Schedules across projects | Every project on one timeline | Master schedule | headline moved to subtitle |
| `plan` | Plan and deliver projects | **One project's plan** | One project's plan | Standards | Project plan | headline moved to subtitle |
| `log` | Platform and administration | **Product log** | Product log | Everything you asked for | Product log | headline moved to subtitle |
| `adm_studio` | Platform and administration | **Admin studio** | Admin studio | Shape the platform without code | Admin studio | headline moved to subtitle |
| `adm_sec` | Platform and administration | **Security and access** | Security and access | Know who can see what, and why | Security and access | headline moved to subtitle |
| `adm_env` | Platform and administration | **Environments and releases** | Environments and releases | Promote configuration like code | Environments and releases | family anchor, switcher added; headline moved to subtitle |
| `adm_meter` | Platform and administration | **Licensing and billing** | Licensing and billing | What Atlantic Systems pays for, and why | Licensing and billing | headline moved to subtitle |
| `adm_gate` | AI and governance | **AI usage and cost** | AI usage and cost | Route every model call on purpose | AI gateway and tokenomics | headline moved to subtitle |
| `adm_audit` | Platform and administration | **Audit trail and retention** | Audit and compliance | Prove what happened, and who or what did it | Audit and compliance | renamed; headline moved to subtitle |
| `bud_over` | Money and contracts | **Budgets** | Budgets | The portfolio is 5.6% over budget, and the reserve can cover it | Budgets overall | family anchor, switcher added; headline moved to subtitle |
| `bud_model` | Money and contracts | **Budgets: Forecast model** | Forecast and financial model | The portfolio returns 22% over five years, and Taxonomy is the weakest | Financial model | renamed; merged into "Budgets" as view "Forecast model"; hidden from menu; headline moved to subtitle |
| `bud_ven` | Money and contracts | **Vendors and contracts** | Vendors and contracts | Lumen is the vendor to act on: 0.74 on the scorecard, and 5 renewals n | Vendors and contracts | headline moved to subtitle |
| `bud_ben` | Money and contracts | **Track benefits** | Track benefits | Measured benefit is 85% of plan so far, and $48K over the next year is | Benefits realization | headline moved to subtitle |
| `bud_doa` | Money and contracts | **Who can approve what** | Who can approve what | Anything up to $100,000 you can approve, and 3 of 6 segregation checks | Delegation of authority | headline moved to subtitle |
| `bud_req` | Money and contracts | **Budget requests** | Budget requests | Ask for budget, and see how it is decided | Budget requests | headline moved to subtitle |
| `chat_home` | Get help or ask for something | **Ask Oukala (chat and agents)** | Ask Oukala (chat and agents) | One assistant on every screen, doing the work with your approval | Chat and agents | headline moved to subtitle |
| `dec_cov` | Automate | **Decision rules: Coverage** | Decision rule coverage | Every process has decision rules; 4% are accepted by a person | Decision rule coverage | renamed; merged into "Decision rules" as view "Coverage"; hidden from menu; headline moved to subtitle |
| `dev_pipe` | Know our technology | **Build and release pipelines** | Build and release pipelines | One flow from idea to production | Delivery pipeline | headline moved to subtitle |
| `itom_dev` | Know our technology | **Environments and releases: Delivery speed** | Delivery speed and environments | How fast, how safely, and where it runs | Environments and DORA | renamed; merged into "Environments and releases" as view "Delivery speed"; hidden from menu; headline moved to subtitle |
| `plat_map` | Platform and administration | **Platform maps** | How modules work together | Every module and how they feed each other | Master process flow | renamed; family anchor, switcher added; headline moved to subtitle |
| `plat_data` | Platform and administration | **Platform maps: Data model** | The platform's data model | Master data model, drawn, traced and audited | Master data model | renamed; merged into "Platform maps" as view "Data model"; hidden from menu; headline moved to subtitle |
| `draw_studio` | Automate | **Draw a process** | Process drawing studio | Draw a process, and the steps write themselves | Process drawing studio | renamed; family anchor, switcher added; headline moved to subtitle |
| `exe_dash` | Strategy and performance | **Leadership dashboard** | Leadership dashboard | One set of numbers, five executive views | Executive dashboard | headline moved to subtitle |
| `exe_strat` | Strategy and performance | **Goals and objectives** | Goals and objectives | Is the money pointed at the strategy? | Strategy alignment | headline moved to subtitle |
| `exe_risk` | Strategy and performance | **Project risk simulation** | Risk heat map | How likely are we to hit the date? | Risk heat map and Monte Carlo | renamed; headline moved to subtitle |
| `exe_apps` | Know our technology | **Applications we run** | Applications we run | Which applications earn their keep? | Application portfolio | headline moved to subtitle |
| `exe_board` | Strategy and performance | **Board pack** | Board pack | The quarterly pack, written from live data | Board pack | headline moved to subtitle |
| `exe_scen` | Strategy and performance | **Compare what-if scenarios** | Compare what-if scenarios | What happens if we change course? | Scenario compare | headline moved to subtitle |
| `flw_design` | Automate | **Design a workflow** | Design a workflow | Every process on every tab, drawn once and changed here | Workflow designer | headline moved to subtitle |
| `flw_asmt` | Automate | **Assessments and questionnaires** | Assessments and questionnaires | Questions that score a risk, kept apart from the decision | Assessments | headline moved to subtitle |
| `flw_appr` | My work | **My approvals** | My approvals | One inbox for every decision that needs a person | Approvals inbox | family anchor, switcher added; headline moved to subtitle |
| `flw_dmn` | Automate | **Decision rules** | Decision rules | Write the rule once, see it decide | Decision tables | family anchor, switcher added; headline moved to subtitle |
| `flw_bpmn` | Automate | **Draw a process: BPMN models** | Draw a process | See how work really flows | Process models (BPMN) | renamed; merged into "Draw a process" as view "BPMN models"; hidden from menu; headline moved to subtitle |
| `flw_agent` | Automate | **AI agents: Agent workflows** | Workflows with AI agents | Agents do the work, people keep the say | Agentic workflows | renamed; merged into "AI agents" as view "Agent workflows"; hidden from menu; headline moved to subtitle |
| `flw_hub` | Platform and administration | **Connect other systems** | Connect other systems | Every connection, healthy or not | Integration hub | family anchor, switcher added; headline moved to subtitle |
| `inbox` | My work | **My approvals: Alerts and inbox** | Inbox: approvals and alerts | What needs you, in one place | My inbox | renamed; merged into "My approvals" as view "Alerts and inbox"; hidden from menu; headline moved to subtitle |
| `itom_cmdb` | Know our technology | **Servers, apps and other technology items** | Servers, apps and other technology items | One trusted picture of what runs the Foundation | CMDB | headline moved to subtitle |
| `itom_model` | Know our technology | **How technology records are structured** | How technology records are structured | Classes, attributes and relationships, like the CMDB it replaces | CMDB data model | headline moved to subtitle |
| `itom_graph` | Know our technology | **What depends on what** | What depends on what | Walk the graph to find what breaks and what caused it | Dependency views | headline moved to subtitle |
| `itom_disc` | Know our technology | **Scan and import technology** | Scan and import technology | Tools feed the CMDB; rules decide what is true | Discovery and ingestion | headline moved to subtitle |
| `itom_health` | Know our technology | **Is our technology data trustworthy** | Is our technology data trustworthy | Trust the CMDB, then prove it | CMDB health and governance | headline moved to subtitle |
| `itom_fin` | Money and contracts | **Cloud spend** | Cloud spend | Know who spends what, and stop paying for idle | Cloud cost (FinOps) | headline moved to subtitle |
| `itsm_inc` | Fix and support services | **Fix what is broken** | Fix what is broken | Restore service fast, to a team first | Incidents | headline moved to subtitle |
| `itsm_prb` | Fix and support services | **Find root causes** | Find root causes | Fix the cause, not the symptom | Problems and known errors | headline moved to subtitle |
| `itsm_chg` | Fix and support services | **Plan and approve changes** | Plan and approve changes | Change safely, on a calendar everyone trusts | Changes | headline moved to subtitle |
| `itsm_mi` | Fix and support services | **Run a major outage** | Run a major outage | War room: Standards Platform is degraded | Major incident | headline moved to subtitle |
| `itsm_home` | Fix and support services | **Service desk at a glance** | Service desk at a glance | Service desk overview | Service desk overview | headline moved to subtitle |
| `kcs_home` | Knowledge and learning | **Browse and manage articles** | Browse and manage articles | Knowledge that runs the work | Knowledge management | headline moved to subtitle |
| `kcs_edit` | Knowledge and learning | **Write or update an article** | Write or update an article | Write it once, structured, with sources | Article editor | headline moved to subtitle |
| `kcs_ask` | Get help or ask for something | **Find an answer** | Find an answer | Answers that show their work | Ask the knowledge base | headline moved to subtitle |
| `kcs_gap` | Knowledge and learning | **What knowledge is missing** | What knowledge is missing | Find what people need that we have not written | Knowledge gaps and analytics | headline moved to subtitle |
| `kcs_prompt` | AI and governance | **Prompt library** | Prompt library | Every prompt has an owner, a version and a test | Prompt library | headline moved to subtitle |
| `kcs_test` | AI and governance | **Test AI answers** | Test AI answers | No prompt reaches production without passing | AI test management | headline moved to subtitle |
| `kcs_skills` | AI and governance | **AI agents: Skills** | What AI agents can do | Turn what we know into work that runs itself | Agent skills | renamed; merged into "AI agents" as view "Skills"; hidden from menu; headline moved to subtitle |
| `vault` | Knowledge and learning | **Impact and knowledge graph: Connected knowledge** | Explore connected knowledge | See how everything we know connects | Knowledge graph | renamed; merged into "Impact and knowledge graph" as view "Connected knowledge"; hidden from menu; headline moved to subtitle |
| `exe_mat` | Strategy and performance | **Maturity and capability** | Maturity and capability | Are we on the path to the strategy? | Maturity models | headline moved to subtitle |
| `meet_hub` | My work | **Meetings** | Plan and run meetings | Meetings that end in something | Meetings | renamed; family anchor, switcher added; headline moved to subtitle |
| `meet_act` | My work | **Meetings: Actions** | Meeting actions I own or wait on | Actions that come out of meetings | Meeting actions | renamed; merged into "Meetings" as view "Actions"; hidden from menu; headline moved to subtitle |
| `meet_dec` | My work | **Meetings: Decisions** | Decisions made in meetings | Decisions, with the reasons | Meeting decisions | renamed; merged into "Meetings" as view "Decisions"; hidden from menu; headline moved to subtitle |
| `meet_series` | My work | **Meetings: Forums and series** | Recurring meetings and forums | Forums with a charter | Forums and series | renamed; merged into "Meetings" as view "Forums and series"; hidden from menu; headline moved to subtitle |
| `nav_studio` | Platform and administration | **Navigation and search settings** | Navigation and search settings | Find anything, return to anything | Navigation and search | headline moved to subtitle |
| `itom_evt` | Know our technology | **Alerts and events** | Alerts and events | 7,999 signals in 24 hours, 5 worth a person's time | Event management | headline moved to subtitle |
| `obs_dash` | Know our technology | **Monitoring dashboards** | Monitoring dashboards | Every metric, every host, one place | Dashboards and metrics | headline moved to subtitle |
| `itom_slo` | Know our technology | **Reliability targets** | Reliability targets | Promise a level of service, and watch the budget | Observability and SLOs | headline moved to subtitle |
| `itom_run` | Automate | **Runbooks and automatic fixes** | Runbooks and automatic fixes | From alert to action, with guardrails | Runbooks and automation | headline moved to subtitle |
| `obs_std` | Fix and support services | **Pre-approved changes and runbooks** | Pre-approved changes and runbooks | Pre-approved changes that are also the runbooks | Standard change catalog | headline moved to subtitle |
| `svc_oncall` | Fix and support services | **Who is on call** | Who is on call | Who is on call, and is every required hour covered? | On-call and escalation | headline moved to subtitle |
| `svc_skills` | People and teams | **Skills and availability** | Skills and availability | Who can do what, and who is free right now? | Skills and availability | headline moved to subtitle |
| `org_chart` | People and teams | **Org chart** | Org chart and AI teammates | Who does what, and who supports them | Org chart | renamed; family anchor, switcher added; headline moved to subtitle |
| `own_gaps` | Platform and administration | **Ownership and gaps** | Ownership and gaps | Every thing has a person who answers for it | Ownership and gaps | headline moved to subtitle |
| `ppl_org` | People and teams | **Org chart: Workload** | Who works where and how busy | Who is carrying what | Org chart and workload | renamed; merged into "Org chart" as view "Workload"; hidden from menu; headline moved to subtitle |
| `ppl_cap` | Plan and deliver projects | **Who is available to do the work** | Who is available to do the work | Resource planning | Resource planning | headline moved to subtitle |
| `ppl_train` | Knowledge and learning | **Training and courses** | Training and courses | Is everyone ready to do the work safely | Training and learning | headline moved to subtitle |
| `ppl_av` | My work | **Meetings: Rooms** | Book a room | Is the right room ready | Rooms and conference scheduling | renamed; merged into "Meetings" as view "Rooms"; hidden from menu; headline moved to subtitle |
| `ppl_jrny` | People and teams | **Experience journeys** | Experience journeys | Journey maps tied to workflows | Journey maps | headline moved to subtitle |
| `ppl_meet` | My work | **Meetings: Minutes** | Meeting minutes and decisions | Decisions that stick | Forums and minutes | renamed; merged into "Meetings" as view "Minutes"; hidden from menu; headline moved to subtitle |
| `ppl_perf` | People and teams | **Performance reviews** | Performance reviews | Performance and growth | Performance management | headline moved to subtitle |
| `plat_data` | Platform and administration | **Platform maps: Data model** | The platform's data model | Master data model, drawn, traced and audited | Master data model | renamed; merged into "Platform maps" as view "Data model"; hidden from menu; headline moved to subtitle |
| `plat_build` | Platform and administration | **Build a module** | Build a module | Build a module | Build a module | same |
| `plat_contract` | Platform and administration | **Feature contract** | Feature contract | Every feature carries its process, data, metrics and connections | Feature contract | headline moved to subtitle |
| `plat_debt` | Platform and administration | **Technical debt** | Technical debt | Track, trace and pay down the debt before it compounds | Technical debt ledger | headline moved to subtitle |
| `plat_fab` | Platform and administration | **Connect other systems: Data feeds and mappings** | Connect and keep data fresh | Integration fabric: feed any field, keep control | Integration fabric | renamed; merged into "Connect other systems" as view "Data feeds and mappings"; hidden from menu; headline moved to subtitle |
| `fin_model` | Money and contracts | **Budgets: IT financial model** | IT financial model | Every IT dollar has a nature, a color and a TBM position | IT financial model | renamed; merged into "Budgets" as view "IT financial model"; hidden from menu; headline moved to subtitle |
| `fin_color` | Money and contracts | **Which funding pays for what** | Which funding pays for what | 7 funding colors, each with its own rules | Color of money | headline moved to subtitle |
| `fin_spend` | Money and contracts | **Test the order money is spent** | Test the order money is spent | When several colors can fund a cost, the policy decides the order | Spend-order simulator | headline moved to subtitle |
| `fin_budget` | Money and contracts | **Budgets: By funding type** | Budget and forecast by funding type | Five versions of every line, forecast by color | Budget and forecast | renamed; merged into "Budgets" as view "By funding type"; hidden from menu; headline moved to subtitle |
| `fin_gates` | Money and contracts | **Funding approval gates** | Funding approval gates | Six gates decide when funding is committed and when cost becomes capit | Funding gates | headline moved to subtitle |
| `fin_alloc` | Money and contracts | **Charge costs to teams** | Charge costs to teams | Shared cost reaches consumers by a named, versioned driver | Allocation and showback | headline moved to subtitle |
| `fin_rules` | Money and contracts | **Financial control checks** | Financial control checks | Ten rules prove every dollar has a color, a rule and a ledger match | Financial controls | headline moved to subtitle |
| `plat_gate` | Platform and administration | **Approve citizen-built apps** | Approve citizen-built apps | Build fast on the platform, never beside it | Citizen apps | headline moved to subtitle |
| `plat_mcp` | AI and governance | **Connect AI and coding tools** | Connect AI and coding tools | Let AI tools discover what exists before they build | AI and coding clients | headline moved to subtitle |
| `plat_dmap` | Platform and administration | **Platform maps: Data flows** | Where data flows | How every data element connects to every other | Data connections | renamed; merged into "Platform maps" as view "Data flows"; hidden from menu; headline moved to subtitle |
| `plat_pmap` | Platform and administration | **Platform maps: Processes** | How processes connect | No process runs alone | Process connections | renamed; merged into "Platform maps" as view "Processes"; hidden from menu; headline moved to subtitle |
| `plat_proc` | Platform and administration | **Process library** | Process library | 145 processes, 78 of 78 modules covered | Process library | headline moved to subtitle |
| `plat_reg` | Platform and administration | **Platform registry** | Platform registry | One catalog every app builds on | Platform registry | headline moved to subtitle |
| `ppm_proj` | Plan and deliver projects | **Projects** | Projects | Who runs what, who does the work | Projects and teams | headline moved to subtitle |
| `ppm_raid` | Plan and deliver projects | **Risks, issues and decisions** | Risks, issues and decisions | Risks, assumptions, issues, dependencies | RAID log | headline moved to subtitle |
| `bud_ccmap` |  | **Cost center mapping** | (new this round) |  |  | same |
| `bud_lines` |  | **All budget lines** | (new this round) |  |  | same |
| `r15d_evidence` |  | **Evidence room** | (new this round) |  |  | same |
| `r15d_agents` |  | **Agent registry** | (new this round) |  |  | same |
| `r15d_facts` |  | **Facts and conflicts** | (new this round) |  |  | same |
| `r15d_firstweek` |  | **My first week** | (new this round) |  |  | same |
| `plat_store` |  | **Entity store** | (new this round) |  |  | same |
| `wf_runs` |  | **Run monitor** | (new this round) |  |  | same |
| `ai_runtime` |  | **Agent runtime** | (new this round) |  |  | same |
| `grc_home` |  | **GRC overview** | (new this round) |  |  | same |
| `grc_risk` |  | **Risk register** | (new this round) |  |  | same |
| `grc_ctl` |  | **Controls and testing** | (new this round) |  |  | same |
| `grc_find` |  | **Issues and findings** | (new this round) |  |  | same |
| `grc_pol` |  | **Policies** | (new this round) |  |  | same |
| `grc_aud` |  | **Audit management** | (new this round) |  |  | same |
| `grc_ven` |  | **Third-party risk** | (new this round) |  |  | same |
| `grc_exc` |  | **Exceptions and acceptances** | (new this round) |  |  | same |
| `rec_shell` |  | **Record shell** | (new this round) |  |  | same |
| `r15_iam` |  | **Identity and access** | (new this round) |  |  | same |
| `r15_mobile` |  | **Mobile approvals and on-call** | (new this round) |  |  | same |
| `r15_sem` |  | **Semantic model** | (new this round) |  |  | same |
| `r15_rpt` |  | **Reports and subscriptions** | (new this round) |  |  | same |
| `r15_time` |  | **Timesheets and actuals** | (new this round) |  |  | same |
| `r15_p2p` |  | **Procure to pay** | (new this round) |  |  | same |
| `itsm_rel` | Plan and deliver projects | **Plan and track releases** | Plan and track releases | Ship together, with proof | Releases | headline moved to subtitle |
| `agile_board` | Plan and deliver projects | **Team boards and backlogs** | Team boards and backlogs | Plan in sprints, ship in releases | Sprints and backlogs | headline moved to subtitle |
| `agile_art` | Plan and deliver projects | **Planning across teams** | Planning across teams | Plan together, deliver in increments | Release trains and increments | headline moved to subtitle |
| `plat_self` | Platform and administration | **Let Oukala extend itself** | Let Oukala extend itself | Oukala managing its own build | Self-build | headline moved to subtitle |
| `svc_sla` | Fix and support services | **Service promises and targets** | Service promises and targets | Are we keeping our promises, and does every process have one? | SLAs, OLAs and XLAs | headline moved to subtitle |
| `ppm_sow` | Money and contracts | **Review a statement of work** | Review a statement of work | Every proposal and contract, line by line | SOW and contract analyzer | headline moved to subtitle |
| `svc_cat` | Get help or ask for something | **Manage the catalog** | Order something | 16 items you can order, 240 requests so far | Service catalog | renamed; headline moved to subtitle |
| `svc_req` | Fix and support services | **Work the request queue** | Work the request queue | 86 open, 34 approvals waiting | Requests and fulfillment | headline moved to subtitle |
| `svc_portal` | Get help or ask for something | **Order something** | Report a problem or ask for help | Hi Priya, what do you need? | Self-service portal | renamed; family anchor, switcher added; headline moved to subtitle |
| `svc_asset` | Know our technology | **Assets and software licenses** | Assets and software licenses | 140 devices, 3 titles over entitlement | Assets and software licenses | headline moved to subtitle |
| `svc_notify` | Automate | **Notifications and messages** | Notifications and messages | 96.3% delivered, 87 failures to fix | Notification engine | headline moved to subtitle |
| `svc_guides` | Get help or ask for something | **Order something: Order guides** | Order several things at once | Multi-part orders, one status | Order guides | renamed; merged into "Order something" as view "Order guides"; hidden from menu; headline moved to subtitle |
| `svc_360` | Know our technology | **Services we run and how they connect** | Services we run and how they connect | 16 services, 5 below their availability target | Service portfolio and map | headline moved to subtitle |
| `tbm_model` | Money and contracts | **See where IT money goes** | See where IT money goes | See what each service costs, and when it needs more | Cost transparency (TBM and ATUM) | headline moved to subtitle |
| `kcs_viz` | Strategy and performance | **Build a chart** | Build a chart | Draw any chart from a measure someone owns | Visualization builder | headline moved to subtitle |
| `ppm_wbs` | Plan and deliver projects | **Tasks and work breakdown** | Tasks and work breakdown | WBS and task sheet | WBS and task sheet | headline moved to subtitle |
| `zevt` | Platform and administration | **Events and rules** | Events and rules | Events and rules | Events and rules | same |
| `zl_conn` | Platform and administration | **Connections and gaps** | Connections and gaps | Connections and gaps | Connections and gaps | same |

Totals: 148 screens, 33 sidebar labels changed, 23 screens merged into families (menu entries removed), 1 redirect.

## Round 16 additions (Agent K)

Aliases: `trace` -> `strat_exec` (`R15.alias.trace`, hidden from the menu, old labels resolve through `NAVX.alias`).

New merged families (same mechanism as `mod_r15c_merge.js`, applied in `mod_r16k_fix.js`):

| Anchor | Menu label | Views | Members that left the menu |
|---|---|---|---|
| `exe_dash` | **Dashboards** | Leadership, Operations and metrics, Build a chart | `obs_dash` ("Dashboards: Operations and metrics"), `kcs_viz` ("Dashboards: Build a chart") |
| `exe_risk` | **Risk** | Heat map and Monte Carlo, Risk register, Third-party risk | `grc_risk`, `grc_ven` |
| `svc_notify` | **Notifications** | Rules, templates and delivery, Alerts and inbox | `inbox` (moved from "My approvals") |
