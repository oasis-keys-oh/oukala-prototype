from common import *
# (id, name, goal, scope, depends, priority, size)
EPIC_DEFS=[]
def E(i,name,goal,scope,deps,pri,size): EPIC_DEFS.append(dict(id=i,name=name,goal=goal,scope=scope,deps=deps,pri=pri,size=size))

# screen epics
SCREEN_EPICS=[
 ('S01','Home and first-week experience','Give every persona a home that answers what needs attention now.',['home','r15d_firstweek'],'X01,X02','P0','M'),
 ('S02','Meetings and First Officer','Capture meetings, decisions and actions with named owners.',['fo','meet_hub','meet_act','meet_dec','meet_series','ppl_meet'],'S03,D01','P2','L'),
 ('S03','Inbox, approvals and notifications','One inbox where every approval routes to a group and every decision is audited.',['inbox','flw_appr','svc_notify'],'A01,A02','P0','L'),
 ('S04','Chat, ask and assistant','Answer questions from governed data with lineage, cost and labeled AI output.',['chat_home','kcs_ask','vault'],'AI01','P2','M'),
 ('S05','Navigation, search and maps','Find any screen, record or process in two actions and see how modules connect.',['nav_studio','zl_conn','plat_map','plat_pmap','plat_dmap','plat_data','plat_data_old','kg'],'D16','P1','L'),
 ('S06','Executive trace and strategy to execution','Trace goals to capabilities, projects, money and work with gaps visible.',['trace','loop','metrics','exe_strat','strat_exec','exe_mat','exe_scen','exe_board','exe_dash','r16j_dash','r15d_evidence'],'M01,D12','P1','XL'),
 ('S07','Portfolio, demand and schedule','Prioritize demand, plan projects and keep the master schedule true.',['port','ppm_proj','ppm_raid','ppm_sow','ppm_wbs','ims','plan','exe_apps'],'D02','P1','XL'),
 ('S08','Agile delivery and release','Run backlog, release train and the delivery pipeline against the same work items.',['agile_board','agile_art','dev_pipe','dev','itsm_rel'],'D03','P2','M'),
 ('S09','Capacity, skills and time','Plan capacity from skills, availability and timesheets.',['ppl_cap','svc_skills','r15_time'],'D01','P2','M'),
 ('S10','Budget requests and delegation of authority','Request, route and decide budget with amount-based approval tiers.',['bud_req','bud_doa','bud_ccmap','bud_lines','bud_over','bud_model','fin_budget','fin_model'],'A01,D08','P1','L'),
 ('S11','Finance, allocation and cost transparency','Allocate cost by rule and show showback with color and nature.',['fin_color','fin_spend','fin_gates','fin_alloc','fin_rules','tbm_model','itom_fin','bud_ven','bud_ben'],'D08','P1','L'),
 ('S12','Invoices and procure to pay','Match, approve and pay invoices against contract and receipt.',['inv','r15_p2p'],'S10,A01','P1','M'),
 ('S13','Incident, problem and major incident','Resolve incidents inside SLA and fix root causes.',['itsm_home','itsm_inc','itsm_prb','itsm_mi'],'D04,S18','P1','XL'),
 ('S14','Change enablement','Assess, approve and schedule changes with risk and rollback.',['itsm_chg'],'A01,D04','P1','M'),
 ('S15','Service portal, catalog and requests','One portal for catalog items and order guides with fulfilment tracking.',['svc_portal','svc_cat','svc_req','svc_guides'],'A01,D04','P1','L'),
 ('S16','SLA, on-call and service quality','Measure SLAs, schedule on-call and publish service standards.',['svc_sla','svc_oncall','obs_std'],'D04','P2','M'),
 ('S17','Service 360, assets and ownership','Show every service with owner, assets, cost and risk; every CI has an owner.',['svc_360','svc_asset','own_gaps','r16h_ci','own'],'S18','P1','L'),
 ('S18','CMDB and service mapping','Keep the configuration model, discovery and health trustworthy.',['itom_cmdb','itom_model','itom_graph','itom_disc','itom_health'],'D05','P1','L'),
 ('S19','Observability, events and runbooks','Correlate events, track SLOs and run remediation with approval.',['itom_evt','itom_slo','obs_dash','itom_dev','itom_run'],'S18,EV01','P2','L'),
 ('S20','Knowledge management','Author, review, retire and measure knowledge articles.',['kcs_home','kcs_edit','kcs_gap','kcs_viz'],'D11','P2','M'),
 ('S21','Prompts, AI quality and skills','Version prompts, test answers with a second model and register skills.',['kcs_prompt','kcs_test','kcs_skills'],'AI01','P2','M'),
 ('S22','AI governance and control tower','Register, gate and monitor agents with spend caps and kill switches.',['tower','adm_gate','plat_mcp','r15d_agents','ai_runtime','ai','plat_gate'],'AI01,AI02','P1','L'),
 ('S23','People, org chart and lifecycle','Maintain people, org, journeys, performance and status changes.',['org_chart','ppl_org','ppl_av','ppl_jrny','ppl_perf','ppl_train','r16h_status','r15_iam'],'D01,A01','P1','XL'),
 ('S24','Workflow, decision and process design','Design, validate and run workflows, decision tables and assessments.',['flw_design','flw_bpmn','flw_asmt','flw_dmn','flw_hub','flw_agent','draw_studio','wf_runs','wf','plat_proc'],'EV01','P1','XL'),
 ('S25','Approver groups and approval rules','Define approver groups and rules once and bind them to every approval.',['r16h_groups','r16h_rules'],'A01','P0','M'),
 ('S26','Risk, controls and audit','Keep risk appetite, controls, findings, policies and audits in one register.',['grc_home','grc_risk','grc_ctl','grc_find','grc_pol','grc_aud','grc_exc','grc_ven','exe_risk','adm_audit'],'D12','P1','XL'),
 ('S27','Resilience and business continuity','Plan, exercise and evidence recovery for applications, sites and people.',['bc_home','bc_frame','bc_tiers','bc_cal','bc_plans','bc_decl','bc_trace','bc_metrics'],'D12','P1','L'),
 ('S28','Platform administration and security','Administer environments, permissions, meters, registry and debt.',['adm_studio','adm_sec','adm_env','adm_meter','r16g_perm','plat_store','plat_self','plat_build','plat_reg','plat_contract','plat_debt','plat_cov','plat_fab','zevt','rec_shell','log'],'A01,P01','P0','XL'),
 ('S29','Deployment, tenants and data import','Stand up a tenant, import data and verify readiness.',['r16m_setup','r16m_deploy','r16m_sources','r16m_import','r16m_guides','r16m_overlay'],'D16,I01','P1','L'),
 ('S30','Reporting and semantic layer','Serve governed facts, reports and decisions from one semantic layer.',['r15_rpt','r15_sem','r15d_facts','dec','dec_cov'],'M01','P2','M'),
 ('S31','Mobile approvals and on-call','Approve and acknowledge from a phone with an offline queue.',['r15_mobile'],'S03','P2','S'),
]
for i,name,goal,sids,deps,pri,size in SCREEN_EPICS:
    E(i,name,goal,'Screens: '+', '.join(sids),deps,pri,size)

PREFIX_EPIC={'adm':'S28','plat':'S28','bud':'S10','fin':'S11','itom':'S18','itsm':'S13','kcs':'S20','meet':'S02','ppl':'S23','ppm':'S07','r15d':'S28','r15':'S28','grc':'S26','bc':'S27','r16m':'S29','r16h':'S25','r16g':'S28','r16j':'S06','svc':'S15','flw':'S24','exe':'S06','obs':'S19','agile':'S08','wf':'S24','org':'S23','tbm':'S11','zevt':'S28','zl':'S05','nav':'S05'}
SID_EPIC={}
for i,name,goal,sids,deps,pri,size in SCREEN_EPICS:
    for s in sids: SID_EPIC[s]=i
def screen_epic(sid):
    if sid in SID_EPIC: return SID_EPIC[sid]
    p=sid.split('_')[0]
    return PREFIX_EPIC.get(p,'S28')

# cross-cutting epics
XC=[
 ('X01','Design system, tokens and typography','Ship one token set for color, spacing, radius and type in dark and light.','Design tokens, type scale, spacing, radii, theme switch','','P0','M'),
 ('X02','Accessibility conformance','Keyboard, labels, landmarks, contrast and 44 px targets on every screen.','Accessibility rows for all screens','X01','P1','L'),
 ('X03','Responsive and phone layout','Every screen fits 400 px without horizontal scroll.','Phone rows for all screens','X01','P2','L'),
 ('X04','Performance budgets','Hold render time and DOM size inside a budget per screen.','Performance rows for all screens','','P2','M'),
 ('X05','Screen states and error handling','Empty, loading, denied and error states on every screen.','State rows for all screens','X01','P2','L'),
 ('X06','Persistence and offline state','Persist user state and records across reload and sessions.','Persistence rows for all screens','D16','P1','L'),
 ('X07','Ownership, explanation and audit on screens','Owner and backup badge, Why am I seeing this and audit entries on every screen.','Ownership, explanation and audit rows','A01,D16','P1','M'),
]
for i,name,goal,scope,deps,pri,size in XC: E(i,name,goal,scope,deps,pri,size)

# data epics by entity domain
DOM_NAMES={'service':'Service management data','portfolio':'Portfolio and project data','cmdb':'CMDB and asset data','fin':'Finance data','people':'People and organization data','ops':'Operations and observability data','know':'Knowledge data','gov':'Governance, risk and platform data','plat':'Platform and configuration data','money':'Money and contract data','agile':'Agile and release data','agree':'Agreement and contract data','itom':'IT operations data','sec':'Security and access data','met':'Metric and maturity data','ppl':'People planning data'}
DOM_EPIC={}
dn=0
DOM_ORDER=['people','portfolio','agile','service','cmdb','itom','ops','fin','money','agree','know','gov','sec','met','ppl','plat']
doms=[d for d in DOM_ORDER]+sorted({e['domain'] for e in R['entities'] if e.get('domain')}-set(DOM_ORDER))
for d in doms:
    dn+=1
    DOM_EPIC[d]='D%02d'%dn
for d,i in DOM_EPIC.items():
    E(i,DOM_NAMES.get(d,'Data: '+d),'Store and govern the entities of this domain with owner, classification and retention.',f'Entities with domain {d}','D16' if i!='D16' else '','P1','L')
def data_epic(dom): return DOM_EPIC.get(dom,'D%02d'%max(1,len(doms)))

OTHER=[
 ('P01','Process library and maturity','Run every process from one editable library with owners, SLAs and maturity.','Processes not owned by a screen epic; maturity model','D16','P1','L'),
 ('M01','Metric catalogue and lineage','Define each metric with formula, owner, target, lineage and remediation.','Metric definitions and lineage','D16,P01','P1','XL'),
 ('EV01','Event bus and rules','Emit, persist and react to events through governed rules.','Event catalog, payloads, rules','D16','P1','L'),
 ('A01','Roles, personas and permissions','One global permission model, table to row to attribute, managed in one place.','Roles, personas, rules, field masks, SoD','D16','P0','XL'),
 ('A02','Approval groups, delegation of authority and status changes','Route every approval to a group by amount and status change.','Approval groups, rules, DOA tiers, status definitions','A01','P0','L'),
 ('I01','Integration fabric and connectors','Connect external systems through certified connectors with mapping and quarantine.','Connectors, runs, quarantine, editions','D16,EV01','P1','XL'),
 ('I02','Data importers and templates','Import people, projects and records with validation and dependency order.','Importer templates and columns','I01','P1','M'),
 ('AI01','Agent registry and autonomy levels','Register each agent with sponsor, autonomy, tools, data scope and guards.','Agents, autonomy levels, guards, kill switches','A01','P1','L'),
 ('AI02','AI tooling, MCP and gating','Expose registry tools to agents and gate apps through conformance checks.','MCP tools, gate checks, tiers','AI01','P2','M'),
 ('R01','Business continuity objects','Hold plans, exercises and components with RTO and RPO targets.','BC/DR plans, exercises, components','D12','P1','M'),
]
for i,name,goal,scope,deps,pri,size in OTHER: E(i,name,goal,scope,deps,pri,size)
EPIC_NAME={e['id']:e['name'] for e in EPIC_DEFS}
def en(i): return f'{i} {EPIC_NAME[i]}'

# nav group -> module code
GROUP_CODE={'home':'HOME','my':'MYWK','help':'HELP','plan':'PLAN','fix':'FIX','tech':'TECH','money':'MONY','learn':'LEARN','people':'PEOP','strat':'STRT','grc':'GRC','res':'RES','auto':'AUTO','ai':'AI','plat':'PLAT','new':'NEW','r15hid':'HIDN'}
def module_code(sid):
    nm=NAVMAP.get(sid)
    g=nm['g'] if nm else None
    if g in GROUP_CODE: return GROUP_CODE[g]
    return 'PLAT'
