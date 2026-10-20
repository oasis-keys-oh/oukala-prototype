# PR-32: how each data path read at render maps to a tenant data entity (docs/data/entity-plan.md).
# A path is what tools/scratch/data/instrument.js recorded: a core const (PROJ), a member of S (S.bud.lines),
# or a member of a module namespace on window (GRCX.controls). Classes:
#   entity    tenant business records: each sample company needs its own rows
#   config    tenant configuration (approval rules, policies, settings): each company has its own, but it is set up, not transacted
#   platform  the product's own definitions, the same for every tenant (data model, permission engine, module map, contracts)
#   ui        view state, caches, calendars and derived indexes (recomputed from entities; no tenant rows needed)
# First matching rule wins. Entities already defined in DATA (src/mod_s_tenant.js) keep their DATA name.
import re
RULES = [
 # ---- already in DATA ----
 (r'^PROJ$|^XT\.proj$|^S\.fab\.proj$', 'projects'),
 (r'^S\.bud\.lines$', 'budget_lines'),
 (r'^INVOICES$', 'invoices'),
 (r'^DIR$|^PEOPLE$|^S\.ppl\.people$|^ORGX\.(staff|PBYID|by)$|^KINDS\.(human|ai|contractor|msp)$', 'people'),
 (r'^METRICS$|^OBSX\.metrics$', 'metrics'),
 (r'^S\.exe\.objs$|^EXE\.E$|^S\.exe\.links$|^ROLLUP\.RULES$', 'objectives'),
 (r'^S\.exe\.krs$', 'key_results'),
 (r'^PROC\.defs$', 'processes'),
 (r'^WFX\.defs$|^S\.flw\.(wfs|W|bps)$', 'workflows'),
 (r'^JYX\.JY\.list$', 'journeys'),
 (r'^DEMAND$|^S\.ppm\.reqs$|^DW0\.', 'demand'),
 (r'^ODX\.O2C', 'value_chain'),
 # ---- strategy and value ----
 (r'^S\.exe\.risks$|^GRCX\.risks$|^GRCX\.APPETITE$|^S\.fin\.risks$', 'risks'),
 (r'^S\.exe\.scens$', 'scenarios'),
 (r'^S\.bud\.ben$|^R17U\.gapp$', 'benefits'),
 (r'^NODES$|^EDGES$', 'trace_links'),
 (r'^S\.exe\.apps$', 'applications'),
 (r'^S\.mat\.xcaps$|^MAT\.(HW|HZ)$', 'capabilities'),
 (r'^S\.debt\.tasks$|^DEBT\.rate$', 'tech_debt'),
 (r'^R17Q_DATA\.decisions$|^S\.fin\.decs$|^S\.fin\.dlog$|^S\.ppl\.decs$|^MEETX\.decs$|^OGX\.decisions$', 'decisions'),
 # ---- portfolio and delivery ----
 (r'^PPMRAID$', 'raid_items'),
 (r'^(PC|PTC|TMAP|IDX)\.|^BASE\.R$|^IMS_SCEN$|^WBS_SEED$', 'plan_tasks'),
 (r'^CAP\.', 'capacity'),
 (r'^S\.fab\.wi$|^WORK$|^S\.ppl\.work$|^S\.ppl\.tix$|^S\.ppl\.reassign$|^S\.ppl\.acts$', 'work_items'),
 (r'^S\.br\.reqs$', 'budget_requests'),
 (r'^SKILLS$|^S\.kcsx\.skills$|^S\.skl\.custom$|^SKILLSDB\.', 'skills'),
 (r'^S\.gate\.apps$|^R18\.(stateClass|stateText|LEVELS)$', 'builds'),
 # ---- money and contracts ----
 (r'^S\.bud\.led$|^SPEND30$|^PROV_SHARE$', 'ledger_entries'),
 (r'^S\.bud\.po$', 'purchase_orders'),
 (r'^S\.bud\.con$', 'contracts'),
 (r'^S\.bud\.vend$|^GRCX\.vendors$', 'vendors'),
 (r'^BUDX\.DEPTS$|^S\.ccmap\.rows$', 'cost_centers'),
 (r'^S\.r15t\.(sheets|rcpts|reqs)$', 'timesheets'),
 (r'^S\.bud\.(doa|crules|pol)$|^APPR\.state\.(binds|rules)$|^S\.rules$|^S\.br\.rules$', 'approval_policies'),
 (r'^S\.fin\.(rules|colors|drv|evreg|ladder|pols|rel|sources|splits|log)$', 'finance_policies'),
 # ---- operations and service ----
 (r'^S\.itsm\.inc$', 'incidents'),
 (r'^S\.itsm\.chg$|^S\.itsm\.cablog$', 'changes'),
 (r'^S\.itsm\.(prb|ke)$', 'problems'),
 (r'^REQREG$|^S\.itsm\.req$|^SVC3B\.REQS$|^S\.svc\.dem$', 'service_requests'),
 (r'^S\.itsm\.tasks$', 'service_tasks'),
 (r'^SVCREG$|^SVCX\.(off|created)$', 'services'),
 (r'^SVC3B\.CAT$|^OGX\.(guides|lanes)$|^SVC3B\.(GRPS|CSP|RELN|TY|V|ME)$', 'catalog_items'),
 (r'^CIREG$|^CIEDGE$|^CIOWN\.|^SVC_ASSETS$', 'config_items'),
 (r'^S\.obs\.slos$|^SLAX\.SEED$', 'service_levels'),
 (r'^S\.obs\.', 'monitors'),
 (r'^S\.oc\.(rotas|esc)$', 'rotas'),
 (r'^S\.ppl\.leave$', 'leave'),
 (r'^S\.itom\.', 'ops_automations'),
 (r'^KCS_TEST\.(ART|PR|SU|UNANS|TOPICS|SVCS|SRC|SUGGEST)$|^S\.kcsx\.(imp|runs)$', 'knowledge_articles'),
 (r'^SVCEVT$|^EVENTS\.log$|^LIVEEVENTS$', 'events'),
 (r'^S\.itsm\.(tpl|apol|ovlog)$', 'service_policies'),
 # ---- risk, control and AI ----
 (r'^GRCX\.(controls|tests|att|cycles|TIER_FREQ)$|^S\.adm\.ctl$', 'controls'),
 (r'^GRCX\.(audits|findings)$', 'audits'),
 (r'^GRCX\.(policies|exceptions)$|^S\.adm\.(pol|holds|ret)$', 'policies'),
 (r'^AGENTS$|^S\.agents$|^S\.ppl\.agents$|^AGENTS_STATE\.|^R18\.(access|kill|spend)$|^CONTRACT\.agents$', 'agents'),
 (r'^AUDIT$|^STORE\.log$|^S\.ownx\.log$|^S\.zlink\.log$|^S\.r16g\.hist$', 'audit_log'),
 (r'^S\.r15i\.(grants|reqs|runs)$|^S\.adm\.roles$|^PERM\.extraUsers$', 'access_grants'),
 (r'^RULES$', 'automation_rules'),
 # ---- people and organization ----
 (r'^TEAMS$', 'teams'),
 (r'^ORGX\.domains$', 'org_units'),
 (r'^R15E\.roles$|^S\.r15e\.roles$|^S\.ownx\.asg$', 'role_assignments'),
 (r'^S\.ppl\.(courses|enr|paths|xapi)$', 'learning'),
 (r'^S\.ppl\.(rooms|bk)$', 'rooms'),
 (r'^S\.ppl\.forums$', 'forums'),
 # ---- my work ----
 (r'^MEETX\.acts$', 'action_items'),
 (r'^MEETINGS$|^MEETX\.(series|MON)$|^EXTRACTED$|^TRANSCRIPT$|^S\.ppl\.(agendas|minutes)$', 'meetings'),
 (r'^S\.chx\.threads$', 'conversations'),
 (r'^NOTIF\.state\.items$', 'notifications'),
 # ---- tenant configuration (no business rows) ----
 (r'^S\.adm\.(flags|gr|kits|models|pkgs|seats|tok|langs|bg|routes|rev)$|^S\.admx\.forms$|^S\.r16g\.fields$', 'tenant_settings'),
 (r'^S\.fab\.(conns|maps|events|quar|recon|reqs|runs)$|^S\.flw\.(conns|mcps|hooks|keys|dlq)$', 'connectors'),
 (r'^S\.flw\.dmn$', 'decision_tables'),
 (r'^S\.r15r\.(reports|runs|scheds)$|^S\.r16d\.charts$|^S\.viz\.(dash|lib)$', 'reports'),
]
CLASS = {
 'approval_policies':'config','finance_policies':'config','service_policies':'config','tenant_settings':'config','connectors':'config',
 'decision_tables':'config','policies':'config','automation_rules':'config','reports':'config',
}
# platform definitions and UI state: everything else. Listed for the record (instrument.js paths seen in the core run).
PLATFORM = r'^(PERM|PERM_UI|DATAMODEL|LIN|LINKS|STD|MPOPT|BTC|SCALE|MODMAP|PLAT|CONTRACT|GATE|COVER|R15|R15D|R15E|R15F3|R15I|R15R|R16H|R16J_DUPES|R16M|R17P|R17Q|R17Q_DATA|R17U|R18|R21H|HIDE|JOV|NUM_DATA|PICKER|RECSHELL|STORE|SRCFACTS|VIZ|DASHX|ZLINK15|ZLINK_REL_HOOKS|STUDIO|HEROMAP|ODX|EVENTS|MAT|ASSESSX|CHATX|MCPX|INBOX|STATUS|OWNX|KCSX|KCS_TEST|MEETX|FIN|BUDX|DEBT|GRCX|BCX|KGXDATA|SVC3B|EXE|ORGX|KINDS|PERSONAS|S\.r16g|S\.r15e|S\.contract|S\.bt|S\.lr|S\.pp2|S\.flw|S\.chx|S\.svc|S\.zlink|S\.r16d|WD|MONTHS|LST|COV|VERS|LOG0|TREE|TRENDS|KGN|KGE|KSCEN|FLOW|STEPS|LANES|PATHS|R15E)\b'
DEFINED = {'projects','budget_lines','invoices','people','metrics','objectives','processes','workflows','journeys','personas','key_results','pillars','demand','maturity','vocabulary','workload','value_chain'}
AREA = {  # business area per entity, for the plan
 'projects':'Portfolio and delivery','budget_lines':'Money and contracts','invoices':'Money and contracts','people':'People and organization','metrics':'Strategy and value',
 'objectives':'Strategy and value','key_results':'Strategy and value','processes':'Build and admin','workflows':'Build and admin','journeys':'People and organization','demand':'Portfolio and delivery',
 'value_chain':'Strategy and value','risks':'Risk, control and AI','scenarios':'Strategy and value','benefits':'Strategy and value','trace_links':'Strategy and value','applications':'Transformation',
 'capabilities':'Transformation','tech_debt':'Transformation','decisions':'My work','raid_items':'Portfolio and delivery','plan_tasks':'Portfolio and delivery','capacity':'Portfolio and delivery',
 'work_items':'Portfolio and delivery','budget_requests':'Money and contracts','skills':'People and organization','builds':'Build and admin','ledger_entries':'Money and contracts',
 'purchase_orders':'Money and contracts','contracts':'Money and contracts','vendors':'Money and contracts','cost_centers':'Money and contracts','timesheets':'Money and contracts',
 'approval_policies':'Money and contracts','finance_policies':'Money and contracts','incidents':'Operations and service','changes':'Operations and service','problems':'Operations and service',
 'service_requests':'Operations and service','service_tasks':'Operations and service','services':'Operations and service','catalog_items':'Operations and service','config_items':'Operations and service',
 'service_levels':'Operations and service','monitors':'Operations and service','rotas':'Operations and service','leave':'People and organization','ops_automations':'Operations and service','knowledge_articles':'Operations and service','events':'Operations and service',
 'service_policies':'Operations and service','controls':'Risk, control and AI','audits':'Risk, control and AI','policies':'Risk, control and AI','agents':'Risk, control and AI','audit_log':'Risk, control and AI',
 'access_grants':'Risk, control and AI','automation_rules':'Risk, control and AI','teams':'People and organization','org_units':'People and organization','role_assignments':'People and organization',
 'learning':'People and organization','rooms':'People and organization','forums':'People and organization','meetings':'My work','action_items':'My work','conversations':'My work','notifications':'My work','tenant_settings':'Build and admin',
 'connectors':'Build and admin','decision_tables':'Build and admin','reports':'Build and admin','personas':'People and organization','pillars':'Strategy and value','maturity':'Transformation',
 'vocabulary':'Build and admin','workload':'People and organization',
}
_R = [(re.compile(p), e) for p, e in RULES]
_P = re.compile(PLATFORM)
def classify(path):
    """-> (entity or None, class)"""
    for rx, e in _R:
        if rx.search(path):
            return e, CLASS.get(e, 'entity')
    return None, ('platform' if _P.search(path) else 'ui')
