# 5. Screen catalog

Every menu screen has a stated purpose, one primary action, named data, a named owner and a defined set of personas, and all of them share one template.

The catalog lists the 141 screens in the menu, grouped as in section 3. Another 28 registered screens are hidden members of merge families, reachable from the family switcher, links and search. The registry holds 169 screens in all.

Columns: Data lists up to three entity ids from the data atlas. Owner is the accountable person from the ownership registry. Personas is the number of the 13 personas whose role allows reading the screen. Requirements: see the OK-<group code>-nnn series named in the register filter below.

## 5.1 Screens by group

### Home

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| Home (`home`) | Persona start page: decisions waiting, scores, spend and what changed | Review a Needs you item | meeting | none named | 13 of 13 |

### My work

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| My approvals (`flw_appr`) | One inbox for every decision that needs a person | Approve or reject | change_approval_policy, approval, delegation | Jordan Lee | 11 of 13 |
| Meetings (`meet_hub`) | Meetings that end in decisions and owned actions | New meeting | none registered | Rina Okafor | 11 of 13 |

### Get help or ask for something

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| Order something (`svc_portal`) | One portal to browse and order catalog items and order guides | Order an item | request_item | Tom Becker | 13 of 13 |
| Find an answer (`kcs_ask`) | Ask the knowledge base; answers cite their sources | Ask | knowledge_article | Jordan Lee | 13 of 13 |
| Ask Oukala (chat and agents) (`chat_home`) | Chat and agents that act with approval | Open the chat | conversation_thread, policy, delegation | Tom Becker | 11 of 13 |
| My first week (`r15d_firstweek`) | Accounts, equipment, training and buddy for a new hire | Complete a task | first_week_plan | Jordan Lee | 10 of 13 |

### Plan and deliver projects

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| Ideas and requests for new work (`port`) | Rank and fund ideas and requests for new work | New request | project, demand_request | Maya Ortiz | 6 of 13 |
| Projects (`ppm_proj`) | Projects with owners, teams and health | Open a project | project, resource_request | Priya Shah | 8 of 13 |
| Schedules across projects (`ims`) | Every project on one timeline with critical path | Open a schedule | project, project_task | Priya Shah | 8 of 13 |
| One project's plan (`plan`) | One project's phases, tasks and milestones | Open a plan | project, project_task | Priya Shah | 8 of 13 |
| Tasks and work breakdown (`ppm_wbs`) | Work breakdown and task sheet | New task | project_task | Priya Shah | 8 of 13 |
| Risks, issues and decisions (`ppm_raid`) | Risks, assumptions, issues, dependencies and decisions | Add an entry | raid_item | Priya Shah | 8 of 13 |
| Who is available to do the work (`ppl_cap`) | Capacity against demand by person and skill | Request resources | setting, person, project_task | Nia Brooks | 3 of 13 |
| Team boards and backlogs (`agile_board`) | Sprints, backlogs and team boards | New story | user_story | Sam Patel | 8 of 13 |
| Planning across teams (`agile_art`) | Release trains and program increments | New program increment | feature | Sam Patel | 8 of 13 |
| Plan and track releases (`itsm_rel`) | Plan, gate and track releases | New release | release | Nia Brooks | 7 of 13 |
| Reports and subscriptions (`r15_rpt`) | Reports and subscriptions built from governed measures | Build a report | report_definition, report_schedule, report_run | Jordan Lee | 11 of 13 |
| Timesheets and actuals (`r15_time`) | Timesheets that post to budget actuals on approval | Submit a timesheet | timesheet, time_entry | Maya Ortiz | 11 of 13 |
| Procure to pay (`r15_p2p`) | Requisition to payment with three-way match | New requisition | requisition, goods_receipt, accrual_entry | Avery Chen | 3 of 13 |

### Fix and support services

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| Manage the catalog (`svc_cat`) | Design and manage orderable catalog items | Design a catalog item | service_offering, catalog_item | Tom Becker | 13 of 13 |
| Service desk at a glance (`itsm_home`) | Service desk queues, SLAs and open work | Log incident | incident | Tom Becker | 8 of 13 |
| Fix what is broken (`itsm_inc`) | Log, triage and resolve incidents, team first | Log incident | incident, knowledge_article, action_item | Tom Becker | 8 of 13 |
| Run a major outage (`itsm_mi`) | War room for a major outage | Impact analysis | notification, action_item | Tom Becker | 8 of 13 |
| Find root causes (`itsm_prb`) | Root causes and known errors | New problem | problem_record | Tom Becker | 8 of 13 |
| Plan and approve changes (`itsm_chg`) | Risk-scored changes on a shared calendar | Request change | change_request, standard_change, change_approval_policy | Nia Brooks | 7 of 13 |
| Pre-approved changes and runbooks (`obs_std`) | Pre-approved changes that double as runbooks | New standard change | standard_change | Nia Brooks | 8 of 13 |
| Work the request queue (`svc_req`) | Request queue and fulfillment | Order something | request_item | Tom Becker | 13 of 13 |
| Who is on call (`svc_oncall`) | On-call rotas and escalation coverage | New rota | setting, oncall_rota, time_off | Nia Brooks | 8 of 13 |
| Service promises and targets (`svc_sla`) | SLAs, OLAs and XLAs, and whether they are kept | New agreement | sla_definition | Sam Patel | 8 of 13 |

### Know our technology

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| Services we run and how they connect (`svc_360`) | Service portfolio and map with owner, cost and dependencies | New service | business_service, service_offering, automation_rule | Sam Patel | 8 of 13 |
| Applications we run (`exe_apps`) | Application portfolio and value for money | Add application | application | Catherine Doyle | 8 of 13 |
| Servers, apps and other technology items (`itom_cmdb`) | Configuration items in one trusted view | New CI | cmdb_ci | Sam Patel | 8 of 13 |
| Assets and software licenses (`svc_asset`) | Hardware and software licenses against entitlement | Add an asset | asset, ast_contract | Tom Becker | 8 of 13 |
| What depends on what (`itom_graph`) | Dependency graph and impact analysis | Impact analysis | cmdb_ci | Sam Patel | 8 of 13 |
| Impact and knowledge graph (`kg`) | What a change touches across knowledge and objects | Open a node | objective | Noor Haddad | 8 of 13 |
| How technology records are structured (`itom_model`) | CMDB classes, attributes and relationships | New class | cmdb_ci | Sam Patel | 8 of 13 |
| Scan and import technology (`itom_disc`) | Discovery sources and reconciliation rules | Connect a source | cmdb_ci | Sam Patel | 8 of 13 |
| Is our technology data trustworthy (`itom_health`) | CMDB completeness, correctness and compliance | New attestation campaign | cmdb_ci | Sam Patel | 8 of 13 |
| Alerts and events (`itom_evt`) | Correlated alerts and events | Open an alert | maintenance_window, alert_rule, alert_event | Sam Patel | 8 of 13 |
| Reliability targets (`itom_slo`) | Reliability targets and error budgets | New SLO | slo, synthetic_check | Sam Patel | 8 of 13 |
| Build and release pipelines (`dev_pipe`) | Build and release pipelines from idea to production | Open a pipeline | policy, pull_request | Nia Brooks | 8 of 13 |
| CI ownership (`r16h_ci`) | Owner, support group and approver group for every CI and asset | Apply class defaults | cmdb_ci, asset, ci_ownership_default | Rina Okafor | 12 of 13 |

### Money and contracts

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| Approve invoices (`inv`) | Match, hold and approve invoices against accepted work | Approve | invoice, purchase_order, policy | Avery Chen | 3 of 13 |
| Who can approve what (`bud_doa`) | Delegation of authority and segregation checks | Who approves this? | doa_rule, policy | Marcus Reid | 4 of 13 |
| Review a statement of work (`ppm_sow`) | Line-by-line review of proposals and contracts | Analyze a document | contract, contract_line | Avery Chen | 5 of 13 |
| Budgets (`bud_over`) | Approved budget against forecast, with reserve | Request budget | budget_line, budget_adjustment | Avery Chen | 4 of 13 |
| Which funding pays for what (`fin_color`) | Funding colors and the rules each carries | Open a color | none registered | Jordan Lee | 3 of 13 |
| Test the order money is spent (`fin_spend`) | Simulate the order in which funding is spent | Run a simulation | none registered | Jordan Lee | 3 of 13 |
| Funding approval gates (`fin_gates`) | Six gates that commit funding | Open a gate | none registered | Jordan Lee | 3 of 13 |
| Financial control checks (`fin_rules`) | Ten control checks on color, rule and ledger | Run all rules | none registered | Jordan Lee | 3 of 13 |
| Track benefits (`bud_ben`) | Benefits realization against plan | Record a measurement | benefit | Maya Ortiz | 4 of 13 |
| Vendors and contracts (`bud_ven`) | Vendor scorecards, contracts and purchase orders | New purchase order | purchase_order, contract, core_company | Camille Ortega | 4 of 13 |
| See where IT money goes (`tbm_model`) | Where IT money goes, by tower and service | Forecast demand | cost_allocation | Avery Chen | 4 of 13 |
| Charge costs to teams (`fin_alloc`) | Shared cost allocated by named, versioned drivers | Open a driver | none registered | Jordan Lee | 3 of 13 |
| Cloud spend (`itom_fin`) | Cloud cost by owner and idle spend | Open a recommendation | cost_allocation | Avery Chen | 3 of 13 |
| Budget requests (`bud_req`) | Request, route and decide budget | Request budget | budget_request, approval, budget_line | Avery Chen | 7 of 13 |
| Cost center mapping (`bud_ccmap`) | Cost centers mapped to org units, owners and GL segments | Add a cost center | cost_center_map, cost_center | Avery Chen | 3 of 13 |
| All budget lines (`bud_lines`) | Every budget line with filters, grouping and CSV | Request budget | budget_line | Avery Chen | 4 of 13 |

### Knowledge and learning

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| Browse and manage articles (`kcs_home`) | Browse and manage knowledge articles | New knowledge item | knowledge_article | Jordan Lee | 11 of 13 |
| Write or update an article (`kcs_edit`) | Write or update a structured article with sources | Save version | knowledge_article | Noor Haddad | 7 of 13 |
| What knowledge is missing (`kcs_gap`) | Knowledge people need that does not exist | Draft top 3 | knowledge_article | Noor Haddad | 11 of 13 |
| Training and courses (`ppl_train`) | Courses and who is ready | Design a course | course, learning_event | Grace Whitfield | 11 of 13 |

### People and teams

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| Skills and availability (`svc_skills`) | Who can do what and who is free | Add a skill | skill_claim | Nia Brooks | 11 of 13 |
| Performance reviews (`ppl_perf`) | Performance reviews and growth | Write the next review | perf_feedback, objective | Joanna Pierce | 2 of 13 |
| Experience journeys (`ppl_jrny`) | Journey maps tied to workflows | New journey | journey_map | Joanna Pierce | 11 of 13 |
| Org chart (`org_chart`) | Reporting lines, ownership, access and supporting agents | Add person | person, organization_unit, reporting_line | Joanna Pierce | 12 of 13 |
| Status catalog (`r16h_status`) | Statuses, approval groups, handover rule, and what each launches | Add a status | person, status_definition, status_change | Rina Okafor | 12 of 13 |
| Mobile approvals and on-call (`r15_mobile`) | Approve and acknowledge from a phone | Open the mobile view | oncall_ack, mobile_queue_item | Tom Becker | 11 of 13 |

### Strategy and performance

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| Dashboards (`exe_dash`) | Five executive views from one set of numbers | Open a view | metric_definition | Maya Ortiz | 5 of 13 |
| Goals and objectives (`exe_strat`) | Whether money points at the strategy | New objective | objective, key_result | Maya Ortiz | 5 of 13 |
| Measures and targets (`metrics`) | Metric definitions with formula, start, now and remediation | Open a metric | metric_definition | none named | 12 of 13 |
| Feedback and learning loops (`loop`) | Feedback and learning loops | Log feedback | metric_definition | Grace Whitfield | 12 of 13 |
| Maturity and capability (`exe_mat`) | Capability maturity against strategy | New capability | maturity_capability | Maya Ortiz | 5 of 13 |
| Compare what-if scenarios (`exe_scen`) | What-if scenarios compared | Save a scenario | scenario | Victor Amaya | 5 of 13 |
| Board pack (`exe_board`) | Quarterly board pack from live data | Generate pack | none registered | Catherine Doyle | 3 of 13 |
| Dashboards and charts (`r16j_dash`) | Dashboards and saved charts from governed measures | Save to my library | dashboard_layout, dashboard_default, saved_chart | Jordan Lee | 12 of 13 |
| Evidence room (`r15d_evidence`) | Read-only evidence an auditor can sample | Verify chain | evidence_pack | Casey Rowan | 4 of 13 |
| Strategy to execution (`strat_exec`) | Goals to capabilities, projects, money and work | Add a roadmap item | goal_capability_link, capability_roadmap_item, roadmap_project_link | Rina Okafor | 12 of 13 |

### Governance, risk and compliance

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| Risk (`exe_risk`) | Risk heat map and Monte Carlo on project dates | Log a risk | raid_item | Maya Ortiz | 4 of 13 |
| Audit trail and retention (`adm_audit`) | Hash-chained audit log, retention and legal holds | Filter the log | audit_event, control, policy | Avery Chen | 3 of 13 |
| GRC overview (`grc_home`) | Risk, controls, findings and exceptions overview | Add a risk | raid_item | Theo Marlowe | 4 of 13 |
| Controls and testing (`grc_ctl`) | Controls mapped to frameworks, tested each cycle | Open a control | control, attestation | Rina Okafor | 4 of 13 |
| Issues and findings (`grc_find`) | Findings with plans, owners and due dates | Log a finding | finding | Theo Marlowe | 4 of 13 |
| Policies (`grc_pol`) | Versioned policies with acknowledgement | Open a policy | policy | Theo Marlowe | 4 of 13 |
| Audit management (`grc_aud`) | Audit engagements, requests and evidence | Add an audit request | audit_engagement | Avery Chen | 4 of 13 |
| Exceptions and acceptances (`grc_exc`) | Time-limited exceptions and risk acceptances | Request an exception | exception | Theo Marlowe | 4 of 13 |

### Resilience

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| Resilience overview (`bc_home`) | Readiness by application, dimension and tier | Schedule an exercise | bc_plan | Sam Patel | 12 of 13 |
| Resilience framework (`bc_frame`) | Six dimensions with questions and maturity levels | Rename the framework | bc_data_asset | Sam Patel | 12 of 13 |
| Recovery tiers (`bc_tiers`) | RTO, RPO and exercise policy by tier | Edit a tier | bc_recovery_objective | Tom Becker | 12 of 13 |
| Exercise calendar (`bc_cal`) | Live and tabletop exercises inside change windows | Schedule an exercise | bc_exercise | Tom Becker | 12 of 13 |
| Continuity plans (`bc_plans`) | Plans, versions, call trees, runbooks and comms | New plan | bc_plan | Sam Patel | 12 of 13 |
| Continuity traceability (`bc_trace`) | Plans traced to CIs, data, vendors, people and risks | Open a trace | bc_component | Theo Marlowe | 12 of 13 |
| Resilience metrics (`bc_metrics`) | Resilience metrics with formula lineage | Open a metric | bc_component | Avery Chen | 12 of 13 |
| Declare disaster (`bc_decl`) | Start a plan workflow and notify the call tree | Declare disaster | bc_declaration | Tom Becker | 12 of 13 |

### Automate

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| Design a workflow (`flw_design`) | Workflow designer for every process | Draw a process | process_definition, workflow_definition | Jordan Lee | 5 of 13 |
| Decision rules (`flw_dmn`) | Decision tables for every decision point | Open a table | decision_table | Sam Patel | 5 of 13 |
| Assessments and questionnaires (`flw_asmt`) | Assessments that score a risk | Assign an assessment | assessment | Sam Patel | 5 of 13 |
| Notifications (`svc_notify`) | Notification templates and delivery | New template | notification | Tom Becker | 5 of 13 |
| Runbooks and automatic fixes (`itom_run`) | Runbooks and automatic fixes with guardrails | New automation rule | automation_rule, runbook_execution | Sam Patel | 8 of 13 |
| Draw a process (`draw_studio`) | Draw shapes; saving writes steps back to the process | Draw a process | process_drawing, process_definition, person | Rina Okafor | 5 of 13 |
| Approval groups (`r16h_groups`) | Approver groups, members, delegates and quorum | New group | approver_group, approver_action, approval | Rina Okafor | 12 of 13 |
| Approval rules (`r16h_rules`) | Nested approval rules: levels, groups, modes, conditions | New rule | approval_rule, approval_rule_overlay, approval_binding | Rina Okafor | 12 of 13 |
| Run monitor (`wf_runs`) | Workflow instances, timers, retries and SLAs | Start a run | workflow_instance, step_run, workflow_definition | Rina Okafor | 4 of 13 |

### AI and governance

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| AI agents (`tower`) | Control Tower: every agent, spend and control | Approve | person | Anil Mehta | 5 of 13 |
| AI usage and cost (`adm_gate`) | Model routing, usage and cost | New routing policy | ai_model, ai_request, policy | Kenji Watanabe | 5 of 13 |
| Prompt library (`kcs_prompt`) | Prompt library with owner, version and test | New prompt | none registered | Kenji Watanabe | 4 of 13 |
| Test AI answers (`kcs_test`) | Test AI answers before production | Run a test | none registered | Kenji Watanabe | 4 of 13 |
| Connect AI and coding tools (`plat_mcp`) | Expose registry tools to AI and coding clients | Try a tool | connector | Carla Reyes | 4 of 13 |
| Agent registry (`r15d_agents`) | One list of every agent and its working state | Open an agent | agent_state | Jordan Lee | 4 of 13 |
| Agent runtime (`ai_runtime`) | Lifecycle, tiers, kill switch, run records, gates, budgets | Pause or kill | agent_registry, agent_run, agent_control | Rina Okafor | 4 of 13 |

### Platform and administration

| Screen (id) | Purpose | Primary action | Data | Owner | Personas |
|---|---|---|---|---|---|
| Platform maps (`plat_map`) | Module map, process map and data model | Open screen | none registered | Sam Patel | 4 of 13 |
| Process library (`plat_proc`) | Process library and maturity roll-up | Add a process | none registered | Sam Patel | 4 of 13 |
| Platform registry (`plat_reg`) | Registry of entities, fields and apps | Propose an entity | none registered | Rina Okafor | 4 of 13 |
| Navigation and search settings (`nav_studio`) | Navigation and search settings | Open search | none registered | Rina Okafor | 4 of 13 |
| Build a module (`plat_build`) | Wizard that checks a new module against the contract | Build a module | none registered | Carla Reyes | 4 of 13 |
| Let Oukala extend itself (`plat_self`) | Build tracker for the product itself | Open a task | none registered | Carla Reyes | 4 of 13 |
| Approve citizen-built apps (`plat_gate`) | Certify citizen-built apps | New citizen app | app_manifest | Rina Okafor | 5 of 13 |
| Connect other systems (`flw_hub`) | Connectors, runs and quarantine | Add connector | connector, credential, sync_exception | Sam Patel | 5 of 13 |
| Technical debt (`plat_debt`) | Technical debt ledger and exceptions | Request an exception | debt_item | Rina Okafor | 5 of 13 |
| Feature contract (`plat_contract`) | Feature contract scoring and waivers | Run on a feature | none registered | Rina Okafor | 4 of 13 |
| Admin studio (`adm_studio`) | Custom fields, views and forms | Add a field | audit_event, custom_field, view_definition | Sam Patel | 4 of 13 |
| Security and access (`adm_sec`) | Roles, policies and access reviews | Start an access review | role, policy, exception | Rina Okafor | 3 of 13 |
| Licensing and billing (`adm_meter`) | Licensing and billing | Request a plan change | license | Sam Patel | 3 of 13 |
| Environments and releases (`adm_env`) | Environments, releases and flags | Promote | release, feature_flag | Hollis Grey | 4 of 13 |
| Product log (`log`) | Log of everything requested of the product | Add entry | none registered | Sam Patel | 4 of 13 |
| Ownership and gaps (`own_gaps`) | Ownership registry and gaps | Assign the worst gap | ownership_assignment, ownership_exception, audit_event | Rina Okafor | 4 of 13 |
| Facts and conflicts (`r15d_facts`) | Shared numbers with a conflict check | Run the check again | fact_definition | Casey Rowan | 4 of 13 |
| Record shell (`rec_shell`) | Comments, tags, watchers and history on any record | Add comment | comment, tag, watcher | Sam Patel | 4 of 13 |
| Permissions (`r16g_perm`) | Permissions on tables, rows and attributes | Add a rule | permission, permission_rule, field_rule | Rina Okafor | 3 of 13 |
| Implementation and setup (`r16m_setup`) | Tenant setup with computed readiness | Sign off | tenant | Jordan Lee | 12 of 13 |
| Deployment paths (`r16m_deploy`) | Hosting options compared | Choose a path | none registered | Sam Patel | 12 of 13 |
| Data sources and integrations (`r16m_sources`) | Source systems with field mapping | Add a source | data_source | Jordan Lee | 12 of 13 |
| Import foundation data (`r16m_import`) | Upload, map, dry run and commit foundation data | Upload CSV | import_batch | Sam Patel | 12 of 13 |
| Process guides (`r16m_guides`) | Level 1 to 5 guide for every process | Open a guide | process_guide | Maya Ortiz | 12 of 13 |
| Tenant overlays (`r16m_overlay`) | Per-customer delta on a base process | New overlay | tenant_overlay | Jordan Lee | 12 of 13 |
| Entity store (`plat_store`) | Persisted records, change log and promotion | Promote an entity | app_state_snapshot, entity_promotion, store_event | Rina Okafor | 4 of 13 |
| Events and rules (`zevt`) | Event catalog, rules, dry run and firing log | New rule | event_rule | Rina Okafor | 4 of 13 |
| Identity and access (`r15_iam`) | Roles, access requests, reviews, joiner-mover-leaver, SoD | Request access | permission_set, access_request, access_grant | Rina Okafor | 3 of 13 |
| Semantic model (`r15_sem`) | Semantic metrics and dimensions | Build a report | semantic_metric, semantic_dimension | Jordan Lee | 4 of 13 |
| Connections and gaps (`zl_conn`) | Connectivity audit and gap list | Re-run the audit | connectivity_finding | Rina Okafor | 4 of 13 |

## 5.2 Standard screen template

Every screen is built from the same regions in the same order. Names for the regions are the ones used in code.

| Order | Region | Content | Rule |
|---|---|---|---|
| 1 | Breadcrumb | Group, then screen name | The group opens a popover of its screens |
| 2 | Header actions slot | "Why am I seeing this" and the star | Right aligned, same offset on every screen |
| 3 | Eyebrow | Group, screen, owner and backup badge | Gaps show as a badge, never hidden |
| 4 | Title (h1) | The screen name | Equals sidebar label and tab title |
| 5 | Task line | One line stating the task | Plain language, no first person |
| 6 | Story | Two lines of data-driven fact with a Read more toggle | Numbers come from the screen's data |
| 7 | Action row | One primary action, up to four quiet actions | The primary action is the click-path target |
| 8 | Metric chips | One row of `fchip` metric chips | Each opens the KPI box |
| 9 | First view | Stat tiles, charts and what needs attention, then the list | The first tab is always a dashboard |
| 10 | Body | Cards and tabs from `views()` | Cards in a row have equal height |
| 11 | Process strip | `procCard` with editable steps | Shows who acts: human, agent, auto, gate |
| 12 | Bottom space | 84 px | Keeps content clear of the Ask button |

## 5.3 Acceptance rules every screen must satisfy

1. Name: sidebar label, h1, breadcrumb and title prefix are one string.
2. Ownership: a named human owner and a different backup are shown in the eyebrow.
3. Explanation: exactly one "Why am I seeing this" control sits in the header slot.
4. Metrics: every number is a story or a metric; every metric has formula, owner, target, remediation and a `fchip`.
5. Process: the screen registers a process strip and a process library record with a cited standard.
6. Data: every entity read or written is registered; every field has authority and classification.
7. Drill-down: each number, row and KPI opens its source records, with a breadcrumb back.
8. Forms: create and edit use the shared form kit with validation, a "what happens next" line, a toast and an audit entry.
9. Scale: lists that can pass 200 rows use virtual tables; filters that can pass 6 values use pickers; the screen holds at 2,600 CIs and 6,400 tickets in Enterprise mode.
10. Permissions: a role without access sees a Not permitted state that shows how the decision was made; no data is rendered.
11. States: empty, loading, denied and error states use the shared looks.
12. Phone: no horizontal page scroll at 400 px; tap targets 44 px.
13. Quality gates: zero console errors; spacescan, cardscan and nestscan return zero for the screen in light and dark.
14. Contract: new screens score 4 of 4 on the Feature Contract and the Connections and gaps score does not fall below 99.
15. Language: American English, acronyms defined on first use, no em dashes, no chatty prose, banned words absent.

## 5.4 Coverage facts

| Fact | Value |
|---|---|
| Registered screens | 169 |
| Menu screens (including Home) | 141 |
| Hidden merge-family members | 28 in 12 families |
| Screens with at least one registered record set | 138 |
| Screens with no registered record set | 31 |
| Screens backed by live entities / proposed entities | 70 / 68 |
| Modules on the platform map | 123 (39 live, 84 proposed) |

## Known gaps

1. 18 menu screens show no registered entity, so their data source is not traceable yet.
2. Two menu screens have no owner in the ownership registry.
3. For 37 screens the build shows no primary button; the primary action in the table is the intended one and needs wiring.
4. Seven screens (identity, mobile, semantic model, reports, timesheets, procure to pay, connections) are not yet in the navigation map.
5. Personas column counts are from the permission model with seeded rules; 6 of 13 personas share one generic home.
6. Persona story lines on Home are static text and do not recompute from live data.
7. Enterprise mode is slow on the projects, on-call and org chart screens (up to 20 seconds at Round 15).

Register filter: Module in (HOME, MYWK, HELP, PLAN, FIX, TECH, MONY, LEARN, PEOP, STRT, GRC, RES, AUTO, AI, PLAT), one code per menu group; Category=Experience for template and acceptance rows.
