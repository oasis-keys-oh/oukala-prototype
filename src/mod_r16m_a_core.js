/* mod_r16m_a_core.js (Round 16, Agent M). Implementation and setup: shared core.
   Tenants, setup steps, import batches, data sources, process guides and tenant overlays live in STORE (IndexedDB) with seeds written once.
   Owns: window.R16M {G,H,arr,ST,X,tenants,groups,groupOf,TPL,csv,zip,download,validate,...}. Other r16m files call it lazily at runtime. */
(function(){
"use strict";
const W=window;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const arr=x=>Array.isArray(x)?x:[];
const H=U.esc;
const R=W.R16M=W.R16M||{};
Object.assign(R,{G,H,arr});
const ME=()=>G(()=>INBOX.me(),null)||G(()=>PERSONAS[S.persona].n,"Casey Rowan");
R.me=ME;
const X=S.r16m=S.r16m||{cur:"TEN-MSF",baseVer:{},baseOps:{},decisions:[],tab:{},wiz:{}};
["cur","baseVer","baseOps","decisions"].forEach(p=>G(()=>STORE.track("r16m."+p)));
R.X=X;
/* ------------------------------------------------------------------ store wrapper with in-memory fallback */
const MEM={};
const ST=R.ST={
 ok(){return !!(W.STORE&&STORE.isReady&&STORE.isReady())},
 put(en,rec,opt){if(W.STORE&&STORE.put){const r=STORE.put(en,rec,opt);if(r)return r}const m=MEM[en]||(MEM[en]=new Map());const o=Object.assign({},rec);m.set(String(o.id),o);return o},
 patch(en,id,part,opt){const p=ST.get(en,id);if(!p)return null;return ST.put(en,Object.assign({},p,part,{id:p.id}),opt)},
 get(en,id){return (W.STORE&&STORE.get&&STORE.get(en,id))||(MEM[en]&&MEM[en].get(String(id)))||null},
 all(en){const a=(W.STORE&&STORE.all)?STORE.all(en):[];return a.length?a:(MEM[en]?[...MEM[en].values()]:[])},
 del(en,id){if(W.STORE&&STORE.delete)STORE.delete(en,id);if(MEM[en])MEM[en].delete(String(id))}};
const emitted={};
function ev(id,label,fields,payload){try{if(!W.EVENTS)return null;if(!emitted[id]){emitted[id]=1;EVENTS.register({id,label,module:"r16m_setup",fields:fields||[{name:"record",type:"text"}],owner:"Jordan Lee"})}return EVENTS.emit(id,payload||{},{source:"r16m",actor:ME()})}catch(e){return null}}
R.ev=ev;
const AU=(k,label,type,o)=>Object.assign({k,label,type:type||"string",authority:"platform",classification:"internal"},o||{});
/* ------------------------------------------------------------------ groups (approvals and ownership route to groups, never to individuals) */
const GROUPS=R.groups=[
 {id:"G-CAB",n:"Change advisory board",owner:"Tom Becker",backup:"Sam Patel",members:["Tom Becker","Sam Patel","Jordan Lee","Rina Okafor"],kind:"approver"},
 {id:"G-EXEC",n:"Executive approvers",owner:"Casey Rowan",backup:"Maya Ortiz",members:["Casey Rowan","Maya Ortiz","Avery Chen"],kind:"approver"},
 {id:"G-FIN",n:"Finance approvers",owner:"Avery Chen",backup:"Maya Ortiz",members:["Avery Chen","Maya Ortiz"],kind:"approver"},
 {id:"G-SEC",n:"Security approvers",owner:"Rina Okafor",backup:"Jordan Lee",members:["Rina Okafor","Jordan Lee"],kind:"approver"},
 {id:"G-PGB",n:"Process governance board",owner:"Theo Marlowe",backup:"Casey Rowan",members:["Theo Marlowe","Casey Rowan","Jordan Lee","Maya Ortiz"],kind:"approver"},
 {id:"G-PROC",n:"Procurement approvers",owner:"Camille Ortega",backup:"Avery Chen",members:["Camille Ortega","Avery Chen"],kind:"approver"},
 {id:"G-PPL",n:"People approvers",owner:"Joanna Pierce",backup:"Theo Marlowe",members:["Joanna Pierce","Theo Marlowe"],kind:"approver"},
 {id:"G-DATA",n:"Data council",owner:"Jordan Lee",backup:"Sam Patel",members:["Jordan Lee","Sam Patel","Avery Chen"],kind:"approver"},
 {id:"G-ARCH",n:"Architecture review board",owner:"Jordan Lee",backup:"Sam Patel",members:["Jordan Lee","Sam Patel","Priya Shah","Casey Rowan"],kind:"approver"},
 {id:"G-PLAT",n:"Platform team",owner:"Sam Patel",backup:"Jordan Lee",members:["Sam Patel","Jordan Lee","Priya Shah"],kind:"fulfillment"},
 {id:"G-SD",n:"Service desk",owner:"Tom Becker",backup:"Nia Brooks",members:["Tom Becker","Nia Brooks"],kind:"fulfillment"},
 {id:"G-PMO",n:"PMO",owner:"Maya Ortiz",backup:"Priya Shah",members:["Maya Ortiz","Priya Shah","Dev Rao"],kind:"fulfillment"},
 {id:"G-REQ",n:"Requesters",owner:"Casey Rowan",backup:"Maya Ortiz",members:[],kind:"performer"},
 {id:"G-OWN",n:"Process owners",owner:"Maya Ortiz",backup:"Priya Shah",members:["Maya Ortiz","Priya Shah"],kind:"performer"},
 {id:"G-AUTO",n:"Robots",owner:"Sam Patel",backup:"Jordan Lee",members:[],kind:"system"}];
R.groupByName=n=>GROUPS.find(g=>g.n===n)||null;
const P2G={"Casey Rowan":"Executive approvers","Avery Chen":"Finance approvers","Rina Okafor":"Security approvers","Theo Marlowe":"Process governance board","Jordan Lee":"Architecture review board","Sam Patel":"Platform team","Camille Ortega":"Procurement approvers","Maya Ortiz":"PMO","Priya Shah":"PMO","Dev Rao":"PMO","Tom Becker":"Service desk","Joanna Pierce":"People approvers"};
R.groupOf=function(owner,pid,who){owner=String(owner||"").trim();if(!owner)return STEPMODE.of(who)==="robot"&&who!=="gate"?"Robots":"Process owners";
 if(GROUPS.some(g=>g.n===owner))return owner;
 if(/^requester$/i.test(owner)||/^anyone$/i.test(owner))return"Requesters";
 if(/^approvers?$/i.test(owner)||/approver by/i.test(owner))return/^itsm_chg$|chg|change/.test(pid||"")?"Change advisory board":"Executive approvers";
 if(/automatic|robot|service|engine/i.test(owner)||(STEPMODE.of(who)==="robot"&&who!=="gate"))return"Robots";
 if(/agent/i.test(owner))return"Robots";
 if(P2G[owner])return P2G[owner];
 if(/finance/i.test(owner))return"Finance approvers";if(/security/i.test(owner))return"Security approvers";if(/portfolio|pmo/i.test(owner))return"PMO";if(/council/i.test(owner))return"Data council";
 return"Process owners"};
/* ------------------------------------------------------------------ tenants */
R.EDITIONS=[
 {id:"core",n:"Base",old:"Core",conn:3,env:1,note:"Platform-internal sync, file import, one identity provider connection"},
 {id:"fabric",n:"Data layer",old:"Fabric",conn:15,env:2,note:"Certified connectors, mapping studio, webhooks, dev plus prod"},
 {id:"enterprise",n:"Data layer, enterprise",old:"Fabric Enterprise",conn:60,env:5,note:"Unlimited-class connectors, change-data-capture, five environments"}];
/* CL-44: edition names are plain descriptions; tenants saved under the old working names still read */
const edFix=t=>{if(t&&t.edition){const e=R.EDITIONS.find(x=>x.old===t.edition);if(e)t.edition=e.n}return t};
R.DEPLOY=[
 {id:"pooled",n:"Pooled SaaS (multi-tenant)",short:"Pooled"},
 {id:"dedicated_vendor",n:"Dedicated stack, vendor AWS account",short:"Dedicated, vendor AWS"},
 {id:"dedicated_customer",n:"Dedicated stack, customer AWS account",short:"Dedicated, customer AWS"},
 {id:"private",n:"Private VPC or on-premises container install",short:"Private or on-premises"}];
const SEED_T=[
 {id:"TEN-MSF",name:"Meridian Standards Foundation",edition:"Data layer",deployment:"dedicated_vendor",region:"us-east-1",residency:"United States",idp:"Microsoft Entra ID",status:"Pilot",go_live:"2026-11-13",owner:"Jordan Lee",backup:"Sam Patel",sponsor:"Casey Rowan (CIO)",brand:{name:"Meridian",primary:"#1f6f78",mode:"auto",density:"comfortable"},users:420,sample:true},
 {id:"TEN-CA",name:"Customer A: Cascade Regional Health",edition:"Data layer",deployment:"pooled",region:"us-west-2",residency:"United States",idp:"Okta",status:"Onboarding",go_live:"2026-12-07",owner:"Sam Patel",backup:"Jordan Lee",sponsor:"VP Operations",brand:{name:"Cascade",primary:"#2b6cb0",mode:"light",density:"compact"},users:1850,sample:true},
 {id:"TEN-CB",name:"Customer B: Summit Credit Union",edition:"Data layer, enterprise",deployment:"dedicated_customer",region:"us-east-2",residency:"United States, customer account",idp:"Microsoft Entra ID",status:"Onboarding",go_live:"2027-01-18",owner:"Jordan Lee",backup:"Rina Okafor",sponsor:"Chief Risk Officer",brand:{name:"Summit",primary:"#7b4ea3",mode:"dark",density:"comfortable"},users:3200,sample:true}];
R.tenants=()=>ST.all("tenant").map(edFix).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
R.tenant=id=>edFix(ST.get("tenant",id||X.cur))||R.tenants()[0]||SEED_T[0];
R.curId=()=>{const t=ST.get("tenant",X.cur);return t?t.id:(R.tenants()[0]||SEED_T[0]).id};
R.setTenant=id=>{if(!ST.get("tenant",id))return false;X.cur=id;R.syncMetrics&&R.syncMetrics();render();return true};
/* ------------------------------------------------------------------ foundation templates (11) */
const C=(k,label,o)=>Object.assign({k,label,req:false,type:"string"},o||{});
const TPL=R.TPL=[
 {id:"org_unit",n:"Org units",file:"org_units.csv",ent:"organization_unit",order:1,key:"org_unit_id",keyLabel:"org unit id",dep:[],desc:"Divisions, departments and teams. Parent links build the org chart.",
  cols:[C("org_unit_id","Org unit ID",{req:1,ex:["OU-100","OU-110"],syn:["id","unit id","code","dept id"]}),C("name","Name",{req:1,ex:["Clinical Operations","Patient Access"],syn:["unit name","department"]}),C("parent_id","Parent org unit ID",{type:"ref",ref:"org_unit",ex:["","OU-100"],syn:["parent","reports to unit"]}),C("unit_type","Unit type",{type:"enum",opts:["Division","Department","Team"],ex:["Division","Department"],syn:["type","level"]}),C("head_email","Head (email)",{type:"ref",ref:"person",cls:"personal",ex:["dana.cole@example.org","lee.park@example.org"],syn:["head","manager","leader email"]}),C("cost_center_id","Cost center ID",{type:"ref",ref:"cost_center",ex:["CC-1000","CC-1010"],syn:["cost center","cc"]})]},
 {id:"person",n:"People",file:"people.csv",ent:"person",order:2,key:"email",keyLabel:"email",dep:["org_unit"],desc:"Employees, contractors, managed-service staff. AI agents are registered separately with a human sponsor.",
  cols:[C("email","Email",{req:1,type:"email",cls:"personal",ex:["dana.cole@example.org","lee.park@example.org"],syn:["email address","mail","upn","user principal name"]}),C("name","Full name",{req:1,cls:"personal",ex:["Dana Cole","Lee Park"],syn:["display name","employee name"]}),C("title","Job title",{ex:["VP Operations","Access Manager"],syn:["role","position"]}),C("org_unit_id","Org unit ID",{req:1,type:"ref",ref:"org_unit",ex:["OU-100","OU-110"],syn:["department id","unit","team id"]}),C("manager_email","Manager (email)",{type:"ref",ref:"person",cls:"personal",ex:["","dana.cole@example.org"],syn:["manager","reports to"]}),C("employment_type","Employment type",{req:1,type:"enum",opts:["Employee","Contractor","Managed service provider"],ex:["Employee","Employee"],syn:["type","worker type"]}),C("start_date","Start date",{type:"date",ex:["2019-03-04","2022-08-15"],syn:["hire date","joined"]}),C("location","Location",{ex:["Portland, OR","Portland, OR"],syn:["site","office"]})]},
 {id:"group_role",n:"Groups and roles",file:"groups_roles.csv",ent:"role",order:3,key:"group_id",keyLabel:"group id",dep:["person"],desc:"Assignment, approver and role groups. Every approval routes to a group; each group has an owner and a different backup.",
  cols:[C("group_id","Group ID",{req:1,ex:["GRP-CAB","GRP-SD"],syn:["id","code"]}),C("name","Group name",{req:1,ex:["Change advisory board","Service desk"],syn:["group"]}),C("kind","Kind",{req:1,type:"enum",opts:["Approver","Fulfillment","Role"],ex:["Approver","Fulfillment"],syn:["type","purpose"]}),C("members","Members (emails, semicolon separated)",{type:"list",ref:"person",cls:"personal",ex:["dana.cole@example.org;lee.park@example.org","lee.park@example.org"],syn:["member emails","users"]}),C("owner_email","Owner (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["dana.cole@example.org","lee.park@example.org"],syn:["owner","group owner"]}),C("backup_email","Backup (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["lee.park@example.org","dana.cole@example.org"],syn:["backup","deputy"]})]},
 {id:"cost_center",n:"Cost centers",file:"cost_centers.csv",ent:"cost_center",order:4,key:"cost_center_id",keyLabel:"cost center id",dep:["org_unit","person"],desc:"Finance cost centers mapped to org units. Budget lines reference them.",
  cols:[C("cost_center_id","Cost center ID",{req:1,ex:["CC-1000","CC-1010"],syn:["code","cc","id"]}),C("name","Name",{req:1,ex:["Clinical Operations","Patient Access"],syn:["description"]}),C("org_unit_id","Org unit ID",{type:"ref",ref:"org_unit",ex:["OU-100","OU-110"],syn:["unit","department"]}),C("owner_email","Owner (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["dana.cole@example.org","lee.park@example.org"],syn:["budget owner","manager"]}),C("backup_email","Backup (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["lee.park@example.org","dana.cole@example.org"],syn:["delegate"]}),C("gl_segment","GL segment",{ex:["6100","6110"],syn:["gl code","general ledger"]})]},
 {id:"vendor_contract",n:"Vendors and contracts",file:"vendors_contracts.csv",ent:"core_company",order:5,key:"contract_id",keyLabel:"contract id",dep:["person"],desc:"One row per contract; vendor attributes repeat on each row and are merged on vendor ID.",
  cols:[C("vendor_id","Vendor ID",{req:1,type:"ref",ref:"vendor",selfKey:1,ex:["V-001","V-002"],syn:["supplier id","vendor code"]}),C("vendor_name","Vendor name",{req:1,ex:["Northwind Cloud","Lumen Data Partners"],syn:["supplier","company"]}),C("contract_id","Contract ID",{req:1,ex:["CT-2201","CT-2202"],syn:["agreement","contract number"]}),C("start_date","Start date",{req:1,type:"date",ex:["2025-01-01","2025-07-01"],syn:["effective","begin"]}),C("end_date","End date",{req:1,type:"date",ex:["2027-12-31","2026-12-31"],syn:["expiry","term end","renewal date"]}),C("annual_value","Annual value (USD)",{type:"number",cls:"confidential",ex:["480000","120000"],syn:["value","amount","acv"]}),C("risk_tier","Risk tier",{type:"enum",opts:["1","2","3"],ex:["1","2"],syn:["tier","criticality"]}),C("owner_email","Owner (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["dana.cole@example.org","lee.park@example.org"],syn:["contract owner","relationship owner"]}),C("backup_email","Backup (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["lee.park@example.org","dana.cole@example.org"],syn:["delegate"]})]},
 {id:"service_catalog",n:"Services and catalog items",file:"services_catalog.csv",ent:"catalog_item",order:6,key:"item_id",keyLabel:"item id",dep:["group_role"],desc:"Business services, catalog items and order guides. Each item names a fulfillment group and an approver group.",
  cols:[C("item_id","Item ID",{req:1,ex:["SVC-010","CAT-101"],syn:["number","id","code"]}),C("name","Name",{req:1,ex:["Patient Portal","New laptop"],syn:["title","item name"]}),C("kind","Kind",{req:1,type:"enum",opts:["Business service","Catalog item","Order guide"],ex:["Business service","Catalog item"],syn:["type","class"]}),C("service_id","Parent service ID",{type:"ref",ref:"service",ex:["","SVC-010"],syn:["service","parent"]}),C("fulfillment_group","Fulfillment group ID",{type:"ref",ref:"group",ex:["GRP-SD","GRP-SD"],syn:["assignment group","fulfiller"]}),C("approver_group","Approver group ID",{type:"ref",ref:"group",ex:["","GRP-CAB"],syn:["approval group","approvals"]}),C("sla_hours","SLA (hours)",{type:"number",ex:["4","40"],syn:["sla","target hours"]}),C("owner_email","Owner (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["dana.cole@example.org","lee.park@example.org"],syn:["service owner"]}),C("backup_email","Backup (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["lee.park@example.org","dana.cole@example.org"],syn:["delegate"]})]},
 {id:"config_item",n:"CMDB configuration items",file:"cmdb_cis.csv",ent:"config_item",order:7,key:"ci_id",keyLabel:"ci id",dep:["group_role","service_catalog"],desc:"Configuration items. End-user devices have an individual owner; shared infrastructure has a group owner. Each CI names a support group and an approver group.",
  cols:[C("ci_id","CI ID",{req:1,ex:["CI-5001","CI-5002"],syn:["id","asset id","correlation id"]}),C("name","Name",{req:1,ex:["ehr-app-01","LT-4471"],syn:["hostname","ci name"]}),C("ci_class","Class",{req:1,type:"enum",opts:["Server","Application","Database","Network device","End-user device","Cloud subscription"],ex:["Server","End-user device"],syn:["class","type","ci class"]}),C("environment","Environment",{type:"enum",opts:["Production","Test","Development"],ex:["Production","Production"],syn:["env"]}),C("owner","Owner (email or group ID)",{req:1,type:"ref",ref:"person_or_group",cls:"personal",ex:["GRP-PLAT","lee.park@example.org"],syn:["owned by","owner email"]}),C("support_group","Primary support group ID",{req:1,type:"ref",ref:"group",ex:["GRP-PLAT","GRP-SD"],syn:["support group","assignment group"]}),C("approver_group","Approver group ID",{type:"ref",ref:"group",ex:["GRP-CAB",""],syn:["change approver","approval group"]}),C("criticality","Criticality",{type:"enum",opts:["1 - Mission critical","2 - High","3 - Medium","4 - Low"],ex:["1 - Mission critical","4 - Low"],syn:["business criticality","priority"]}),C("service_id","Service ID",{type:"ref",ref:"service",ex:["SVC-010",""],syn:["business service"]})]},
 {id:"application",n:"Applications",file:"applications.csv",ent:"application",order:8,key:"app_id",keyLabel:"app id",dep:["person","vendor_contract"],desc:"Application inventory with tier, data classification and recovery tier.",
  cols:[C("app_id","Application ID",{req:1,ex:["APP-01","APP-02"],syn:["id","code"]}),C("name","Name",{req:1,ex:["Epic EHR","Patient Portal"],syn:["application","app name"]}),C("tier","Tier",{req:1,type:"enum",opts:["1","2","3","4"],ex:["1","2"],syn:["application tier","criticality tier"]}),C("owner_email","Owner (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["dana.cole@example.org","lee.park@example.org"],syn:["business owner","product owner"]}),C("backup_email","Backup (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["lee.park@example.org","dana.cole@example.org"],syn:["delegate"]}),C("data_class","Data classification",{type:"enum",opts:["Public","Internal","Confidential","Restricted","Personal"],ex:["Restricted","Internal"],syn:["classification","data class"]}),C("vendor_id","Vendor ID",{type:"ref",ref:"vendor",ex:["V-001",""],syn:["vendor","supplier"]}),C("sso","SSO enabled",{type:"bool",ex:["yes","no"],syn:["sso","single sign on"]})]},
 {id:"process_owner",n:"Processes with owners",file:"process_owners.csv",ent:"process_definition",order:9,key:"process_id",keyLabel:"process id",dep:["person"],desc:"Assign a named owner and backup to platform processes (process IDs come from the Process library).",
  cols:[C("process_id","Process ID",{req:1,type:"ref",ref:"process",ex:["itsm_chg","procure_to_pay"],syn:["process","id"]}),C("owner_email","Owner (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["dana.cole@example.org","lee.park@example.org"],syn:["process owner"]}),C("backup_email","Backup (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["lee.park@example.org","dana.cole@example.org"],syn:["delegate"]}),C("target_maturity","Target maturity (1 to 5)",{type:"number",ex:["3","3"],syn:["target","maturity"]})]},
 {id:"budget_line",n:"Budget lines",file:"budget_lines.csv",ent:"budget_line",order:10,key:"line_id",keyLabel:"line id",dep:["cost_center","vendor_contract"],desc:"Approved budget by cost center, fiscal year and color of money.",
  cols:[C("line_id","Line ID",{req:1,ex:["BL-001","BL-002"],syn:["id","line"]}),C("name","Name",{req:1,ex:["EHR licenses","Patient portal build"],syn:["description","title"]}),C("cost_center_id","Cost center ID",{req:1,type:"ref",ref:"cost_center",ex:["CC-1000","CC-1010"],syn:["cost center","cc"]}),C("fiscal_year","Fiscal year",{req:1,type:"number",ex:["2027","2027"],syn:["fy","year"]}),C("amount","Approved amount (USD)",{req:1,type:"number",cls:"confidential",ex:["650000","210000"],syn:["budget","approved","amount usd"]}),C("color","Color of money",{type:"enum",opts:["Operating","Capital","Grant"],ex:["Operating","Capital"],syn:["funding color","nature"]}),C("owner_email","Owner (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["dana.cole@example.org","lee.park@example.org"],syn:["budget owner"]}),C("backup_email","Backup (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["lee.park@example.org","dana.cole@example.org"],syn:["delegate"]}),C("vendor_id","Vendor ID",{type:"ref",ref:"vendor",ex:["V-001",""],syn:["vendor"]})]},
 {id:"data_source",n:"Integrations and data sources",file:"data_sources.csv",ent:"connector",order:11,key:"source_id",keyLabel:"source id",dep:["person"],desc:"Inventory of source systems and integrations. Rows become entries in the Data sources registry (status Planned).",
  cols:[C("source_id","Source ID",{req:1,ex:["DS-01","DS-02"],syn:["id","code"]}),C("name","Name",{req:1,ex:["Okta","Epic EHR"],syn:["system name","source"]}),C("system_type","System type",{req:1,type:"enum",opts:["Identity","HR","ITSM","CMDB","ERP and finance","Monitoring","Cloud","Clinical","CRM","Files"],ex:["Identity","Clinical"],syn:["type","category"]}),C("direction","Direction",{req:1,type:"enum",opts:["Inbound","Outbound","Both"],ex:["Inbound","Inbound"],syn:["flow"]}),C("schedule","Schedule",{type:"enum",opts:["Live","Near-live","Hourly","Daily","Manual"],ex:["Live","Daily"],syn:["frequency","freshness"]}),C("owner_email","Owner (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["dana.cole@example.org","lee.park@example.org"],syn:["system owner"]}),C("backup_email","Backup (email)",{req:1,type:"ref",ref:"person",cls:"personal",ex:["lee.park@example.org","dana.cole@example.org"],syn:["delegate"]}),C("endpoint_alias","Endpoint alias (no secrets)",{ex:["okta-prod","epic-clarity"],syn:["endpoint","url alias"]})]}];
R.tpl=id=>TPL.find(t=>t.id===id);
/* ------------------------------------------------------------------ CSV and zip helpers */
R.csv={
 parse(text){text=String(text||"").replace(/^﻿/,"");const rows=[];let row=[],cur="",q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
   if(q){if(c==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}
   else if(c==='"')q=true;else if(c===","){row.push(cur);cur=""}
   else if(c==="\n"||c==="\r"){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cur);cur="";if(row.length>1||row[0]!=="")rows.push(row);row=[]}
   else cur+=c}
  if(cur!==""||row.length){row.push(cur);if(row.length>1||row[0]!=="")rows.push(row)}
  return{header:(rows.shift()||[]).map(h=>String(h).trim()),rows}},
 esc(v){v=String(v==null?"":v);return/[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v},
 write(header,rows){return [header].concat(rows).map(r=>r.map(R.csv.esc).join(",")).join("\r\n")+"\r\n"}};
R.templateCsv=function(t){return R.csv.write(t.cols.map(c=>c.k),[t.cols.map(c=>c.ex[0]),t.cols.map(c=>c.ex[1])])};
R.sampleCsv=function(t,defects){const good=[t.cols.map(c=>c.ex[0]),t.cols.map(c=>c.ex[1])];const rows=good.map(r=>r.slice());
 if(!defects)return R.csv.write(t.cols.map(c=>c.k),rows);
 const ki=t.cols.findIndex(c=>c.k===t.key);const mk=(n)=>{const r=good[n%2].slice();if(ki>=0&&t.cols[ki].type!=="ref"&&!t.cols[ki].selfKey)r[ki]=(r[ki]||"X")+"-"+(10+rows.length);return r};
 for(let i=0;i<4;i++)rows.push(mk(i));
 const dup=good[0].slice();rows.push(dup);                                                  /* duplicate key */
 const miss=mk(1);const rc=t.cols.findIndex((c,j)=>c.req&&j!==ki);if(rc>=0)miss[rc]="";rows.push(miss);   /* missing required */
 const bad=mk(0);const rf=t.cols.findIndex(c=>c.type==="ref"&&c.ref!=="person_or_group"&&c.k.indexOf("owner")<0&&c.k.indexOf("backup")<0);if(rf>=0)bad[rf]="ZZ-404";rows.push(bad);   /* unknown reference */
 const oe=t.cols.findIndex(c=>c.k==="owner_email"||c.k==="owner"),be=t.cols.findIndex(c=>c.k==="backup_email");
 const same=mk(1);if(oe>=0&&be>=0)same[be]=same[oe];rows.push(same);                      /* owner equals backup */
 const en=t.cols.findIndex(c=>c.type==="enum");const bn=mk(0);if(en>=0)bn[en]="Unknown value";rows.push(bn);
 const dt=t.cols.findIndex(c=>c.type==="date");if(dt>=0){const bd=mk(1);bd[dt]="13/45/2026";rows.push(bd)}
 return R.csv.write(t.cols.map(c=>c.k),rows)};
R.workbookText=function(){
 const L=["OUKALA FOUNDATION DATA WORKBOOK","Eleven sheets, one CSV file per sheet. Load in the order shown; each sheet lists what it depends on.","",
  "Load order | File | Maps to entity | Key column | Depends on | Required columns"];
 TPL.forEach(t=>L.push(t.order+" | "+t.file+" | "+t.ent+" | "+t.key+" | "+(t.dep.length?t.dep.map(d=>R.tpl(d).file).join(", "):"none")+" | "+t.cols.filter(c=>c.req).map(c=>c.k).join(", ")));
 L.push("","Rules applied on every sheet","1. Required columns present and non-empty.","2. Reference columns resolve to a row in this file, a row loaded earlier for the tenant, or a registered object (process IDs, groups, people).","3. Keys are unique in the file; a key already loaded for the tenant is an update, flagged as a warning.","4. Owner and backup are two different named people. Approvals and assignments reference groups, never individuals.","5. Columns classified personal or restricted need handling confirmation before commit.","6. A dry run reports every issue by row and column; only rows without errors are committed.","","Columns per sheet");
 TPL.forEach(t=>{L.push("","["+t.file+"] "+t.n+": "+t.desc);t.cols.forEach(c=>L.push("  "+c.k+" | "+(c.req?"required":"optional")+" | "+c.type+(c.opts?" ("+c.opts.join(", ")+")":"")+(c.ref?" -> "+c.ref:"")+" | "+(c.cls||"internal")+" | e.g. "+(c.ex[0]||c.ex[1]||"")))});
 return L.join("\r\n")+"\r\n"};
R.download=function(name,data,type){try{const b=data instanceof Blob?data:new Blob([data],{type:type||"text/csv;charset=utf-8"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=name;a.style.display="none";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},800);R.lastDownload={name,bytes:b.size,at:Date.now()};return true}catch(e){return false}};
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=t[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}})();
R.zip=function(files){/* files: [{name,text}] stored (no compression) */
 const enc=new TextEncoder(),parts=[],cen=[];let off=0;const u16=v=>[v&255,(v>>>8)&255],u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
 files.forEach(f=>{const nm=enc.encode(f.name),d=enc.encode(f.text),crc=CRC(d);
  const lh=new Uint8Array([0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(d.length),...u32(d.length),...u16(nm.length),...u16(0)]);
  parts.push(lh,nm,d);
  cen.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(d.length),...u32(d.length),...u16(nm.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nm);
  off+=lh.length+nm.length+d.length});
 const cs=cen.reduce((a,b)=>a+b.length,0);
 const end=new Uint8Array([0x50,0x4b,5,6,...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cs),...u32(off),...u16(0)]);
 return new Blob(parts.concat(cen,[end]),{type:"application/zip"})};
/* ------------------------------------------------------------------ reference resolution and validation */
const norm=s=>String(s==null?"":s).trim().toLowerCase();
const people=()=>{if(R._ppl)return R._ppl;const m=new Map();DIR.forEach(d=>{if(d.email)m.set(norm(d.email),d);m.set(norm(d.name),d)});return R._ppl=m};
function committed(tenant,tplId){const s=new Set();ST.all("foundation_record").forEach(r=>{if(r.tenant===tenant&&r.template===tplId)s.add(norm(r.key))});return s}
R.committedKeys=committed;
function liveKeys(kind){/* the prototype's own registries (tenant Meridian only) */
 const s=new Set();try{
  if(kind==="process")PROCLIB.list().forEach(p=>s.add(norm(p.id)));
  else if(kind==="group")GROUPS.forEach(g=>{s.add(norm(g.id));s.add(norm(g.n))});
  else if(kind==="org_unit"){DIR.forEach(d=>d.team&&s.add(norm(d.team)));G(()=>CCMAP.unitList().forEach(u=>{s.add(norm(u.id||u.code||u.name));s.add(norm(u.name))}),0)}
  else if(kind==="cost_center")G(()=>CCMAP.rows().forEach(r=>{s.add(norm(r.code));s.add(norm(r.name))}),0);
  else if(kind==="vendor")G(()=>S.bud.vend.forEach(v=>{s.add(norm(v.id));s.add(norm(v.n))}),0);
  else if(kind==="service")SVCREG.forEach(v=>{s.add(norm(v.id));s.add(norm(v.n))});
  else if(kind==="person")DIR.forEach(d=>{d.email&&s.add(norm(d.email));s.add(norm(d.name))});
 }catch(e){}return s}
const TPLOF={person:"person",org_unit:"org_unit",group:"group_role",cost_center:"cost_center",vendor:"vendor_contract",service:"service_catalog"};
function knownSet(kind,tenant,fileKeys){
 const out=new Set();const kinds=kind==="person_or_group"?["person","group"]:[kind];
 kinds.forEach(k=>{if(tenant==="TEN-MSF"||k==="process")liveKeys(k).forEach(x=>out.add(x));if(TPLOF[k])committed(tenant,TPLOF[k]).forEach(x=>out.add(x));(fileKeys[k]||[]).forEach(x=>out.add(x))});
 /* group ids and service ids also appear as plain keys of their own sheets */
 return out}
const pat={email:/^[^@\s]+@[^@\s]+\.[^@\s]+$/,date:/^\d{4}-\d{2}-\d{2}$/,num:/^-?\d+(\.\d+)?$/,ssn:/\b\d{3}-\d{2}-\d{4}\b/};
R.dmClass=function(t,c){const f=G(()=>DATAMODEL.tables[t.ent].fields.find(x=>x.k===c.k||x.k===c.k.replace(/_email$/,"")),null);return(f&&f.classification)||c.cls||"internal"};
R.autoMap=function(t,header){/* returns {target:sourceIndex}; match by exact key, label, then synonyms, then token overlap */
 const map={},used=new Set();const nh=header.map(h=>norm(h).replace(/[_\-]+/g," "));
 const tok=s=>norm(s).replace(/[_\-()]+/g," ").split(/\s+/).filter(x=>x.length>1&&!/^(id|the|of|and|usd)$/.test(x));
 t.cols.forEach(c=>{let j=nh.findIndex((h,i)=>!used.has(i)&&(h===norm(c.k).replace(/_/g," ")||h===norm(c.label)));
  if(j<0)j=nh.findIndex((h,i)=>!used.has(i)&&arr(c.syn).some(s=>norm(s)===h));
  if(j<0){let best=0;nh.forEach((h,i)=>{if(used.has(i))return;const a=tok(h),b=tok(c.label+" "+c.k);const ov=a.filter(x=>b.includes(x)).length;const sc=ov/Math.max(1,Math.max(a.length,1));if(ov>0&&sc>best&&sc>=.5){best=sc;j=i}})}
  if(j>=0){map[c.k]=j;used.add(j)}});
 return map};
R.validate=function(t,header,rows,map,tenant){
 const issues=[],out=[];const idx={};t.cols.forEach(c=>{idx[c.k]=map[c.k]!=null?map[c.k]:-1});
 const val=(r,k)=>idx[k]>=0?String(r[idx[k]]==null?"":r[idx[k]]).trim():"";
 /* keys defined in this file, for self references */
 const fileKeys={};const own={person:t.id==="person"?"email":null,org_unit:t.id==="org_unit"?"org_unit_id":null,group:t.id==="group_role"?"group_id":null,cost_center:t.id==="cost_center"?"cost_center_id":null,vendor:t.id==="vendor_contract"?"vendor_id":null,service:t.id==="service_catalog"?"item_id":null};
 Object.keys(own).forEach(k=>{if(own[k]&&idx[own[k]]>=0)fileKeys[k]=rows.map(r=>norm(val(r,own[k]))).filter(Boolean)});
 const sets={};const known=(kind)=>sets[kind]||(sets[kind]=knownSet(kind,tenant,fileKeys));
 const exist=committed(tenant,t.id);const seen=new Map();
 const add=(row,col,rule,sev,msg)=>issues.push({row,col,rule,sev,msg});
 rows.forEach((r,i)=>{const rn=i+2;let rowErr=0;const rec={};
  const A=(col,rule,sev,msg)=>{add(rn,col,rule,sev,msg);if(sev==="error")rowErr++};
  t.cols.forEach(c=>{const v=val(r,c.k);rec[c.k]=v;
   if(idx[c.k]<0){if(c.req&&i===0)add(1,c.k,"required column",  "error","Column "+c.k+" is not mapped");return}
   if(!v){if(c.req)A(c.k,"required","error",c.label+" is required");return}
   if(pat.ssn.test(v))A(c.k,"restricted pattern","error","Value looks like a national identifier; remove it before loading");
   if(c.type==="email"&&!pat.email.test(v))A(c.k,"type","error","Not a valid email address");
   else if(c.type==="date"&&(!pat.date.test(v)||isNaN(Date.parse(v))))A(c.k,"type","error","Date must be YYYY-MM-DD");
   else if(c.type==="number"&&!pat.num.test(v))A(c.k,"type","error","Not a number");
   else if(c.type==="bool"&&!/^(yes|no|true|false|y|n|1|0)$/i.test(v))A(c.k,"type","error","Use yes or no");
   else if(c.type==="enum"){const o=arr(c.opts).find(x=>norm(x)===norm(v));if(!o)A(c.k,"enum","error","Allowed: "+c.opts.join(", "));else if(o!==v){add(rn,c.k,"enum","warn","Normalized to "+o);rec[c.k]=o}}
   else if(c.type==="ref"&&c.ref){const k=known(c.ref);if(!k.has(norm(v))){const tt=R.TPL.find(x=>x.id===c.ref||x.ent===c.ref);const fwd=tt&&tt.order>t.order;if(fwd)A(c.k,"reference","warn","Later sheet: "+c.ref.replace(/_/g," ")+" "+v+" is not loaded yet; load the "+tt.n+" sheet next and re-check");else A(c.k,"reference","error","No "+c.ref.replace(/_/g," ")+" "+v+" in this file, in data loaded earlier, or in the registry")}}
   else if(c.type==="list"&&c.ref){v.split(/[;|]/).map(x=>x.trim()).filter(Boolean).forEach(x=>{if(!known(c.ref).has(norm(x)))A(c.k,"reference","error","Member "+x+" is not a known "+c.ref)})}
  });
  /* owner and backup */
  const ok=t.cols.find(c=>c.k==="owner_email"||c.k==="owner"),bk=t.cols.find(c=>c.k==="backup_email");
  if(ok&&bk&&idx[ok.k]>=0&&idx[bk.k]>=0){const o=norm(val(r,ok.k)),b=norm(val(r,bk.k));if(o&&b&&o===b)A(bk.k,"owner and backup","error","Backup must be a different person from the owner")}
  /* template rules */
  if(t.id==="person"&&norm(val(r,"manager_email"))&&norm(val(r,"manager_email"))===norm(val(r,"email")))A("manager_email","hierarchy","error","A person cannot manage themselves");
  if(t.id==="vendor_contract"&&val(r,"start_date")&&val(r,"end_date")&&val(r,"end_date")<=val(r,"start_date"))A("end_date","dates","error","End date must be after start date");
  if(t.id==="budget_line"){const fy=+val(r,"fiscal_year");if(val(r,"fiscal_year")&&(fy<2020||fy>2035))A("fiscal_year","range","error","Fiscal year out of range");if(val(r,"amount")&&+val(r,"amount")<=0)A("amount","range","error","Amount must be above zero")}
  if(t.id==="process_owner"&&val(r,"target_maturity")&&(+val(r,"target_maturity")<1||+val(r,"target_maturity")>5))A("target_maturity","range","error","Target maturity is 1 to 5");
  if(t.id==="group_role"&&norm(val(r,"kind"))==="approver"&&!val(r,"members"))add(rn,"members","approver group","warn","Approver group has no members yet");
  /* duplicates */
  const key=norm(val(r,t.key));
  if(key){if(seen.has(key))A(t.key,"duplicate","error","Duplicate of row "+seen.get(key)+" in this file");else{seen.set(key,rn);if(exist.has(key))add(rn,t.key,"existing","warn","Already loaded for this tenant; commit will update it")}}
  out.push({row:rn,rec,errors:rowErr,key});
 });
 const clsCols=t.cols.filter(c=>R.dmClass(t,c)==="personal"||R.dmClass(t,c)==="restricted").map(c=>c.k);
 const sum={rows:rows.length,errors:issues.filter(x=>x.sev==="error").length,warnings:issues.filter(x=>x.sev==="warn").length,rowsWithErrors:out.filter(o=>o.errors).length,valid:out.filter(o=>!o.errors).length,personalCols:clsCols,unmapped:t.cols.filter(c=>idx[c.k]<0).map(c=>c.k)};
 return{issues,rows:out,sum}};
/* ------------------------------------------------------------------ live counts for readiness (what exists in the prototype or was loaded) */
R.liveCount=function(tplId){return G(()=>{switch(tplId){
 case"org_unit":return G(()=>CCMAP.unitList().length,new Set(DIR.map(d=>d.team)).size);
 case"person":return DIR.length;
 case"group_role":return(S.adm.roles||[]).length+GROUPS.length;
 case"cost_center":return G(()=>CCMAP.rows().length,0);
 case"vendor_contract":return(S.bud.vend||[]).length;
 case"service_catalog":return SVCREG.length;
 case"config_item":return CIREG.length;
 case"application":return(S.exe.apps||[]).length;
 case"process_owner":return PROCLIB.list().filter(p=>p.named&&p.owner).length;
 case"budget_line":return(S.bud.lines||[]).length;
 case"data_source":return G(()=>FAB.connectors.length,0)}return 0},0)};
R.loadedCount=function(tenant,tplId){if(tenant==="TEN-MSF")return R.liveCount(tplId)+ST.all("foundation_record").filter(r=>r.tenant===tenant&&r.template===tplId).length;
 return ST.all("import_batch").filter(b=>b.tenant===tenant&&b.template===tplId&&b.status==="Committed").reduce((a,b)=>a+(b.committed||0),0)};
/* ------------------------------------------------------------------ entity definitions (Feature Contract rule 2) */
const ENTS=[
 {id:"tenant",label:"Tenant",steward:"Jordan Lee",note:"Integration decision: new. environment (reused as the promotion stage of one customer) has no customer, edition, deployment model or region; organization_unit describes the customer's own org, not the customer relationship. A tenant is one customer environment with its edition, deployment model, residency and brand. Closest: environment, organization_unit.",
  fields:[AU("name","Tenant name"),AU("edition","Edition","enum",{opts:["Base","Data layer","Data layer, enterprise"]}),AU("deployment","Deployment model","enum",{opts:["pooled","dedicated_vendor","dedicated_customer","private"]}),AU("region","Cloud region"),AU("residency","Data residency"),AU("idp","Identity provider"),AU("status","Status","enum",{opts:["Draft","Onboarding","Pilot","Live","Suspended"]}),AU("go_live","Planned go-live","date"),AU("owner","Implementation lead","ref",{ref:"person",classification:"personal"}),AU("backup","Backup lead","ref",{ref:"person",classification:"personal"}),AU("sponsor","Customer sponsor"),AU("brand","Brand and theme","text"),AU("users","Licensed users","number"),AU("sample","Sample record","boolean")]},
 {id:"tenant_overlay",label:"Tenant overlay",steward:"Jordan Lee",note:"Integration decision: new. process_definition holds the base process; change_approval_policy holds one global approval rule. An overlay is a versioned delta (add or remove step, change owner group, approval levels, SLA, parameter) on a base process for one tenant, with its own approval and guardrail result. Closest: process_definition, change_approval_policy.",
  fields:[AU("tenant","Tenant","ref",{ref:"tenant"}),AU("process","Base process","ref",{ref:"process_definition"}),AU("title","Title"),AU("status","Status","enum",{opts:["Draft","Pending approval","Active","Rejected","Superseded","Promoted to base"]}),AU("version","Version","number"),AU("base_ver","Base version","number"),AU("ops","Deltas","text"),AU("guard","Guardrail result","text"),AU("required","Required approver groups","list"),AU("approvals","Approvals","text"),AU("proposer","Proposed by","ref",{ref:"person",classification:"personal"}),AU("history","Version history","text"),AU("note","Note","text"),AU("updated","Updated","date")]},
 {id:"import_batch",label:"Import batch",steward:"Sam Patel",note:"Integration decision: new. audit_event records that something happened; a batch records one upload with its mapping, validation result, dry-run counts and commit. Closest: audit_event, mapping.",
  fields:[AU("tenant","Tenant","ref",{ref:"tenant"}),AU("template","Template"),AU("file_name","File name"),AU("rows","Rows","number"),AU("valid","Valid rows","number"),AU("errors","Errors","number"),AU("warnings","Warnings","number"),AU("owners_ok","Rows with owner and backup","number"),AU("committed","Rows committed","number"),AU("status","Status","enum",{opts:["Dry run","Committed","Rejected"]}),AU("mapping","Column mapping","text"),AU("issues","Issue sample","text"),AU("personal_ack","Personal data handling confirmed","boolean"),AU("by","Loaded by","ref",{ref:"person",classification:"personal"}),AU("at","Date","date"),AU("sample","Sample record","boolean")]},
 {id:"foundation_record",label:"Foundation record",steward:"Sam Patel",note:"Integration decision: new and thin. Committed rows are kept per tenant and template as key plus normalized values so later loads can resolve references and detect updates. The prototype does not merge them into the demo registries (people, CIs, budget lines) so the Meridian data stays intact. Closest: the target entities themselves.",
  fields:[AU("tenant","Tenant","ref",{ref:"tenant"}),AU("template","Template"),AU("key","Key"),AU("data","Row values","text",{classification:"personal"}),AU("batch","Batch","ref",{ref:"import_batch"})]},
 {id:"data_source",label:"Data source",steward:"Jordan Lee",note:"Integration decision: extend connector. The fabric connector describes one certified connector instance; a data source is the tenant-level inventory entry for a source system (type, direction, schedule, owner, backup, field mapping) that may or may not have a connector yet. Closest: connector, mapping.",
  fields:[AU("tenant","Tenant","ref",{ref:"tenant"}),AU("name","Name"),AU("system","Source system"),AU("system_type","System type","enum"),AU("direction","Direction","enum",{opts:["Inbound","Outbound","Both"]}),AU("schedule","Schedule","enum",{opts:["Live","Near-live","Hourly","Daily","Manual"]}),AU("owner","Owner","ref",{ref:"person",classification:"personal"}),AU("backup","Backup","ref",{ref:"person",classification:"personal"}),AU("status","Status","enum",{opts:["Planned","Configured","Connected","Degraded","Retired"]}),AU("simulated","Simulated","boolean"),AU("fabric_connector","Data layer connector","ref",{ref:"connector"}),AU("mapping","Field mapping","text"),AU("endpoint_alias","Endpoint alias"),AU("last_run","Last run"),AU("records","Records last run","number"),AU("sample","Sample record","boolean")]},
 {id:"process_guide",label:"Process guide",steward:"Maya Ortiz",note:"Integration decision: extend knowledge_article. A guide is generated from the process record (levels 1 to 5) and kept in the knowledge base with a reviewer and status; only reviews and edits are stored, the content is regenerated from the record. Closest: knowledge_article, process_definition.",
  fields:[AU("process","Process","ref",{ref:"process_definition"}),AU("status","Status","enum",{opts:["Generated from record","Edited","Under review","Reviewed","Out of date"]}),AU("reviewer","Named reviewer","ref",{ref:"person",classification:"personal"}),AU("reviewed_at","Reviewed on","date"),AU("record_hash","Record hash at generation"),AU("generated_at","Generated on","date"),AU("edits","Edits by level","text"),AU("link_gaps","Link gaps","number"),AU("links","Linked objects","number")]},
 {id:"setup_step",label:"Setup step state",steward:"Jordan Lee",note:"Integration decision: new and thin. Records the manual status, sign-off and cutover checklist for one setup step of one tenant. Readiness checks themselves are computed from live state and never stored. Closest: none.",
  fields:[AU("tenant","Tenant","ref",{ref:"tenant"}),AU("step","Step"),AU("status","Manual status","enum",{opts:["Not started","In progress","Blocked","Ready for sign-off","Signed off"]}),AU("owner","Owner","ref",{ref:"person",classification:"personal"}),AU("backup","Backup","ref",{ref:"person",classification:"personal"}),AU("note","Note","text"),AU("signed_by","Signed off by","ref",{ref:"person",classification:"personal"}),AU("signed_at","Signed off on","date"),AU("checklist","Checklist","text")]}];
R.ENTS=ENTS;
const W_={ent:0,mod:0,flow:0,proc:0,own:0,rec:0,met:0,tries:0};R.wire=W_;
const OWN={r16m_setup:["Jordan Lee","Sam Patel"],r16m_deploy:["Sam Patel","Jordan Lee"],r16m_import:["Sam Patel","Avery Chen"],r16m_sources:["Jordan Lee","Sam Patel"],r16m_guides:["Maya Ortiz","Priya Shah"],r16m_overlay:["Jordan Lee","Rina Okafor"]};
R.OWN=OWN;
const NAMES={r16m_setup:"Implementation and setup",r16m_deploy:"Deployment paths",r16m_import:"Import foundation data",r16m_sources:"Data sources and integrations",r16m_guides:"Process guides",r16m_overlay:"Tenant overlays"};
R.NAMES=NAMES;
const SX=a=>({n:a[0],d:a[1],who:a[2],owner:a[3],sla:a[4],in:a[5],out:a[6]});
const PROCS=R.PROCS=[
 {id:"r16m.tenant_onboarding",screen:"r16m_setup",name:"Onboard a customer tenant",trigger:"A signed order form names a customer, an edition and a deployment model",std:["itil5","cobit"],metrics:["m_r16m_ready","m_r16m_deploy_days"],entities:["tenant","setup_step"],steps:[
  ["Create the tenant","Record customer, edition, deployment model, region and the named implementation lead and backup.","human","Jordan Lee","1 day","Signed order form","Tenant record"],
  ["Provision the environment","Provision the stack from the deployment pattern, run migrations and register the tenant in the control plane.","robot","Robot","2 days","Tenant record","Empty tenant environment"],
  ["Connect identity","Configure the identity provider and single sign-on; test with two named users.","human","Sam Patel","3 days","Empty tenant environment","Working sign-in"],
  ["Load foundation data","Run the eleven foundation sheets through the import wizard in dependency order.","human","Sam Patel","2 weeks","Working sign-in","Loaded foundation data"],
  ["Register data sources and configure processes","Register connectors, then apply tenant overlays for approvals, owners and SLAs.","human","Jordan Lee","2 weeks","Loaded foundation data","Connected sources and effective processes"],
  ["Sign off readiness","The Architecture review board confirms every readiness check and the cutover plan.","gate","Architecture review board","3 days","Readiness report","Go-live decision"],
  ["Cut over and hypercare","Switch production traffic, monitor for 14 days, then close the onboarding.","human","Jordan Lee","14 days","Go-live decision","Live tenant"]]},
 {id:"r16m.deployment_choice",screen:"r16m_deploy",name:"Choose a deployment path",trigger:"A prospect or customer states isolation, residency or hosting constraints",std:["togaf","iso27k"],metrics:["m_r16m_deploy_days"],entities:["tenant"],steps:[
  ["Capture constraints","Record isolation, residency, hosting account, upgrade cadence and budget.","human","Sam Patel","2 days","Customer requirements","Constraint list"],
  ["Score the options","Rate pooled, dedicated vendor, dedicated customer and private install against the constraints.","robot","Robot","Instant","Constraint list","Option scores"],
  ["Decide","The Architecture review board confirms the path and records the decision.","gate","Architecture review board","3 days","Option scores","Decision record"],
  ["Plan provisioning","Pick the infrastructure-as-code pattern, accounts, networking and cost.","human","Sam Patel","1 week","Decision record","Provisioning plan"],
  ["Provision","Hand over to tenant onboarding.","robot","Robot","2 days","Provisioning plan","Tenant environment"]]},
 {id:"r16m.data_import",screen:"r16m_import",name:"Import foundation data",trigger:"A tenant needs a foundation sheet loaded or refreshed",std:["dmbok","cobit"],metrics:["m_r16m_import_ok"],entities:["import_batch","foundation_record"],steps:[
  ["Download the template","Use the CSV template for the sheet; load in dependency order.","human","Sam Patel","Same day","Workbook description","Template CSV"],
  ["Upload and map columns","Upload the customer file and map its columns to template fields.","human","Sam Patel","1 day","Customer CSV","Column mapping"],
  ["Dry run and validate","Check required fields, reference targets, classification, duplicates, owners and backups.","robot","Robot","Instant","Column mapping","Error report"],
  ["Fix and re-run","The customer corrects the file until errors are zero or accepted for skipping.","human","Sam Patel","2 days","Error report","Clean file"],
  ["Approve the load","The Data council confirms personal data handling for sheets that carry it.","gate","Data council","2 days","Dry run summary","Load approval"],
  ["Commit with audit","Write records to the store, emit import events and add the batch to the audit trail.","robot","Robot","Instant","Load approval","Committed batch"]]},
 {id:"r16m.source_register",screen:"r16m_sources",name:"Register a data source",trigger:"A source system is named in the integration inventory",std:["dmbok","nist"],metrics:["m_r16m_src_conn"],entities:["data_source"],steps:[
  ["Add to the inventory","Record system, type, direction, schedule, owner and backup.","human","Jordan Lee","Same day","Integration inventory sheet","Data source (Planned)"],
  ["Evaluate fit","Check for a certified connector, field authority and classification of the data.","human","Jordan Lee","3 days","Data source (Planned)","Evaluation"],
  ["Map fields","Map source fields to registry fields; approve the mapping.","human","Sam Patel","1 week","Evaluation","Approved mapping"],
  ["Approve the connection","The Data council approves sources that carry personal or restricted data.","gate","Data council","3 days","Approved mapping","Approval"],
  ["Enable and schedule","Connect, run a test sync and enable the schedule.","robot","Robot","Instant","Approval","Connected source"],
  ["Monitor","Run history, quarantine and freshness feed the Integration fabric.","robot","Robot","Continuous","Run results","Health status"]]},
 {id:"r16m.overlay_change",screen:"r16m_overlay",name:"Change a tenant process overlay",trigger:"A customer asks for a different approval, owner group, step or SLA",std:["itil5","cobit"],metrics:["m_r16m_ovl_pending"],entities:["tenant_overlay"],steps:[
  ["Draft the delta","Record the change as a delta on the base process; nothing in the base changes.","human","Jordan Lee","1 day","Customer request","Draft overlay"],
  ["Check guardrails","Segregation of duties, minimum approvals for the process class, groups only, locked steps.","robot","Robot","Instant","Draft overlay","Guardrail result"],
  ["Submit for approval","The overlay routes to the Process governance board, plus Security approvers when a security process is touched.","human","Jordan Lee","Same day","Guardrail result","Approval request"],
  ["Approve by group","Each required group decides; the proposer cannot decide.","gate","Process governance board","3 days","Approval request","Decision"],
  ["Activate","The overlay becomes the tenant's effective process: base plus overlay.","robot","Robot","Instant","Decision","Active overlay"],
  ["Review for promotion","A recurring change is promoted to the base for all tenants through a second approval.","gate","Process governance board","Quarterly","Active overlays","Promoted or kept as overlay"]]},
 {id:"r16m.guide_review",screen:"r16m_guides",name:"Generate and review a process guide",trigger:"A process guide is opened, or its process record changes",std:["kcs","bpmn"],metrics:["m_r16m_guide_cov"],entities:["process_guide"],steps:[
  ["Generate from the record","Build levels 1 to 5 from the process, its steps, owners, metrics and entities.","robot","Robot","Instant","Process record","Guide (generated from record)"],
  ["Check links","Resolve every linked object and list the gaps.","robot","Robot","Instant","Guide","Link gap list"],
  ["Edit","Owners add detail where the generated text is thin.","human","Maya Ortiz","1 week","Link gap list","Edited guide"],
  ["Review","A named reviewer confirms the guide against how the work is done.","gate","Maya Ortiz","1 week","Edited guide","Reviewed guide"],
  ["Publish to the knowledge base","The reviewed guide is published and linked from the process page.","robot","Robot","Instant","Reviewed guide","Published guide"],
  ["Flag out of date","A changed process record marks the guide out of date.","robot","Robot","Continuous","Process change","Out of date flag"]]}];
const MET={
 m_r16m_ready:{n:"Tenant go-live readiness",f:"Passing readiness checks ÷ all readiness checks for the selected tenant × 100",u:"%",cur:0,tgt:100,badAt:50,dir:"max",max:100,tr:[18,26,35,44,52,58,64,70],owner:"Jordan Lee",use:["Implementation and setup"],rem:{kind:"sop",ref:"SOP-R16-SETUP",title:"Clear the failing readiness checks",agent:"",auto:false,state:"idle",prog:""}},
 m_r16m_deploy_days:{n:"Time to provision a tenant",f:"Calendar days from signed order form to a working empty tenant environment",u:"d",cur:6,tgt:5,badAt:14,dir:"min",max:30,tr:[18,16,14,12,10,9,7,6],owner:"Sam Patel",use:["Deployment paths"],rem:{kind:"sop",ref:"SOP-R16-PROV",title:"Provisioning runbook",agent:"",auto:false,state:"idle",prog:""}},
 m_r16m_import_ok:{n:"Import first-pass validity",f:"Rows without errors on the first dry run ÷ rows uploaded × 100",u:"%",cur:0,tgt:90,badAt:60,dir:"max",max:100,tr:[52,58,61,66,70,74,78,80],owner:"Sam Patel",use:["Import foundation data"],rem:{kind:"kb",ref:"KB0421",title:"Prepare a clean foundation sheet",agent:"",auto:false,state:"idle",prog:""}},
 m_r16m_src_conn:{n:"Data sources connected",f:"Sources with status Connected ÷ sources not Retired × 100",u:"%",cur:0,tgt:80,badAt:40,dir:"max",max:100,tr:[10,22,31,40,46,52,58,60],owner:"Jordan Lee",use:["Data sources and integrations"],rem:{kind:"sop",ref:"SOP-R16-SRC",title:"Bring a planned source to connected",agent:"",auto:false,state:"idle",prog:""}},
 m_r16m_ovl_pending:{n:"Overlays waiting for approval",f:"Tenant overlays with status Pending approval",u:"",cur:0,tgt:2,badAt:6,dir:"min",max:12,tr:[1,2,2,3,2,1,2,1],owner:"Jordan Lee",use:["Tenant overlays"],rem:{kind:"sop",ref:"SOP-R16-OVL",title:"Decide pending overlays",agent:"",auto:false,state:"idle",prog:""}},
 m_r16m_guide_cov:{n:"Process guides reviewed",f:"Process guides with status Reviewed ÷ processes in the library × 100",u:"%",cur:0,tgt:60,badAt:10,dir:"max",max:100,tr:[0,0,0,0,0,0,0,0],owner:"Maya Ortiz",use:["Process guides"],rem:{kind:"sop",ref:"SOP-R16-GUIDE",title:"Review a process guide",agent:"",auto:false,state:"idle",prog:""}}};
G(()=>Object.keys(MET).forEach(k=>{if(typeof METRICS!=="undefined"&&!METRICS[k])METRICS[k]=MET[k]}));
R.syncMetrics=function(){try{const set=(id,v)=>{const m=METRICS[id];if(!m||v==null||isNaN(v))return;m.cur=v;m.tr=m.tr.slice(0,-1).concat([v])};
 if(R.readiness)set("m_r16m_ready",R.readiness(R.curId()).pct);
 const bs=ST.all("import_batch");const f=bs.filter(b=>b.rows);set("m_r16m_import_ok",f.length?Math.round(100*f.reduce((a,b)=>a+(b.valid||0),0)/Math.max(1,f.reduce((a,b)=>a+b.rows,0))):0);
 const ds=ST.all("data_source").filter(d=>d.status!=="Retired");set("m_r16m_src_conn",ds.length?Math.round(100*ds.filter(d=>d.status==="Connected").length/ds.length):0);
 set("m_r16m_ovl_pending",ST.all("tenant_overlay").filter(o=>o.status==="Pending approval").length);
 const gs=ST.all("process_guide").filter(g=>g.status==="Reviewed").length;set("m_r16m_guide_cov",Math.round(100*gs/Math.max(1,G(()=>PROCLIB.list().length,189))))}catch(e){}};
/* ------------------------------------------------------------------ registrations (lazy, retried; the same pattern as the GRC suite) */
const SCREENS=Object.keys(NAMES);
const FLOWS=[["r16m_setup","r16m_import","Foundation sheet status","import_batch","human","Setup step opened"],["r16m_import","r16m_setup","Committed batches and load coverage","import_batch","event","import.committed"],["r16m_setup","r16m_sources","Integration checklist","data_source","human","Setup step opened"],["r16m_sources","r16m_setup","Connected source counts","data_source","batch","Daily"],["r16m_setup","r16m_overlay","Process and approval configuration","tenant_overlay","human","Setup step opened"],["r16m_overlay","r16m_setup","Pending and active overlays","tenant_overlay","event","tenant.overlay_activated"],["r16m_deploy","r16m_setup","Deployment model and edition","tenant","api","Tenant created"],["r16m_guides","plat_proc","Guide levels on the process page","process_guide","api","Process opened"],["plat_proc","r16m_guides","Process records and steps","process_definition","api","Guide opened"],["r16m_overlay","plat_proc","Effective process = base plus overlay","tenant_overlay","api","Process read"],["r16m_import","plat_data","Template columns checked against the model","tenant","api","Dry run"],["r16m_sources","plat_fab","Source inventory feeds connectors","data_source","api","Source registered"],["plat_fab","r16m_sources","Data layer connectors and health","connector","api","Page opened"],["r16m_setup","adm_audit","Setup sign-offs","setup_step","event","tenant.step_signed_off"],["r16m_import","adm_audit","Import commits","import_batch","event","import.committed"],["r16m_overlay","flw_appr","Overlay approvals by group","tenant_overlay","event","tenant.overlay_submitted"],["r16m_guides","kcs_home","Reviewed guides as knowledge","process_guide","api","Guide reviewed"],["r16m_setup","r15_iam","Roles and SSO checks","role","api","Readiness computed"],["r16m_deploy","adm_env","Environment pattern","tenant","api","Decision recorded"],["r16m_sources","zevt","Source events","data_source","event","datasource.registered"]];
function wire(){W_.tries++;
 try{if(!W_.ent&&W.ATLAS&&ATLAS.addEntity&&W.PLAT&&W.COVER){let ok=true;ENTS.forEach(e=>{if(G(()=>DATAMODEL.tables[e.id],null)){return}try{const r=ATLAS.addEntity({id:e.id,label:e.label,domain:"plat",source:"Implementation and setup",ownerApp:"Implementation and setup",ownerMod:"r16m_setup",status:"live",steward:e.steward,note:e.note,fields:e.fields});if(r&&r.ok===false&&!(r.warnings||[]).some(w=>/already exists/.test(w)))ok=false}catch(x){ok=false}});W_.ent=ok?1:0}}catch(e){}
 try{if(!W_.mod&&W.MODMAP&&MODMAP.addModule&&MODMAP.modules&&MODMAP.modules.length){let n=0;
  const RW={r16m_setup:[["tenant","setup_step","person","role","data_source","import_batch"],["tenant","setup_step"]],r16m_deploy:[["tenant","environment"],["tenant"]],r16m_import:[["tenant","person","organization_unit","cost_center","core_company","catalog_item","config_item","application","budget_line"],["import_batch","foundation_record"]],r16m_sources:[["connector","tenant","person"],["data_source"]],r16m_guides:[["process_definition","metric_definition","knowledge_article","person"],["process_guide"]],r16m_overlay:[["process_definition","tenant","approval"],["tenant_overlay"]]};
  SCREENS.forEach(id=>{const r=G(()=>MODMAP.addModule({id,name:NAMES[id],sn:NAMES[id],band:"plt",own:OWN[id][0],proposed:false,scr:id,r:RW[id][0],w:RW[id][1],flows:[]}),null);if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))n++});
  if(n===SCREENS.length)W_.mod=1}}catch(e){}
 try{if(W_.mod&&!W_.flow&&MODMAP.addFlows){const r=MODMAP.addFlows(FLOWS.map(f=>({from:f[0],to:f[1],data:f[2],entity:f[3],mode:f[4],trig:f[5]})));if(r&&r.ok!==false)W_.flow=1}}catch(e){}
 try{if(W_.mod&&W_.ent&&!W_.proc&&W.PROCLIB&&PROCLIB.addProcess){let ok=true;PROCS.forEach(p=>{try{const st=p.steps.map(SX);const r=PROCLIB.addProcess({id:p.id,name:p.name,module:p.screen,family:"gov",owner:OWN[p.screen][0],backup:OWN[p.screen][1],trigger:p.trigger,steps:st,inputs:[p.steps[0][5]],outputs:[p.steps[p.steps.length-1][6]],entities:p.entities,metrics:p.metrics,model:"cmmi",target:3,std:p.std});if(r&&r.ok===false&&!(r.warnings||[]).some(w=>/already exists/.test(w)))ok=false}catch(e){ok=false}});W_.proc=ok?1:0}}catch(e){}
 try{if(W_.proc&&!W_.own&&W.OWNX&&OWNX.assign){let ok=true;PROCS.forEach(p=>{const o=OWN[p.screen];const r=OWNX.assign("process",p.id,o[0],o[1]);if(!r||!r.ok)ok=false});SCREENS.forEach(id=>{OWNX.assign("module",id,OWN[id][0],OWN[id][1]);OWNX.assign("process",id,OWN[id][0],OWN[id][1])});ENTS.forEach(e=>{const sc=e.id==="process_guide"?"r16m_guides":e.id==="tenant_overlay"?"r16m_overlay":e.id==="data_source"?"r16m_sources":e.id==="import_batch"||e.id==="foundation_record"?"r16m_import":"r16m_setup";OWNX.assign("entity",e.id,OWN[sc][0],OWN[sc][1])});Object.keys(MET).forEach(k=>{const sc=PROCS.find(p=>p.metrics.includes(k));const o=OWN[sc?sc.screen:"r16m_setup"];OWNX.assign("metric",k,o[0],o[1])});W_.own=ok?1:0}}catch(e){}
 try{if(!W_.rec&&W.COVER&&Array.isArray(COVER.recs)){[["R16M_TENANT","Tenants and setup steps","r16m_setup","tenant"],["R16M_IMPORT","Import batches and foundation records","r16m_import","import_batch"],["R16M_SRC","Data source inventory","r16m_sources","data_source"],["R16M_OVL","Tenant overlays","r16m_overlay","tenant_overlay"],["R16M_GUIDE","Process guides","r16m_guides","process_guide"]].forEach(x=>{if(!COVER.recs.some(r=>r.key===x[0]))COVER.recs.push({key:x[0],label:x[1],scr:[x[2]],mod:x[2],n:1,ent:x[3],how:"new",path:"STORE "+x[3]})});W_.rec=1}}catch(e){}
 if(!W_.met&&typeof METRICS!=="undefined"){Object.keys(MET).forEach(k=>{if(!METRICS[k])METRICS[k]=MET[k]});W_.met=1}
 if(W_.proc&&W.MODMAP&&MODMAP.refresh&&!W_.refreshed){W_.refreshed=1;G(()=>MODMAP.refresh())}
 if(!(W_.ent&&W_.mod&&W_.flow&&W_.proc&&W_.own&&W_.rec)&&W_.tries<24)setTimeout(wire,900);else R.syncMetrics()}
setTimeout(wire,1300);
/* process strips exist at once */
PROCS.forEach(p=>G(()=>PROC.reg(p.screen,{title:p.name,std:p.std,steps:p.steps.map(SX)})));
/* ------------------------------------------------------------------ seeds (written once, after the store has loaded) */
function sampleBatches(){const mk=(tenant,template,rows,valid,errors,committed,status,at)=>({id:"IB-"+tenant.slice(4)+"-"+template.slice(0,3).toUpperCase()+"-"+(1+Math.floor(Math.random()*0)),tenant,template,file_name:R.tpl(template).file,rows,valid,errors,warnings:Math.round(errors/3),owners_ok:valid,committed,status,mapping:"{}",issues:"[]",personal_ack:true,by:tenant==="TEN-CA"?"Sam Patel":"Jordan Lee",at,sample:true});
 return[mk("TEN-CA","org_unit",24,24,0,24,"Committed","2026-09-28"),mk("TEN-CA","person",1850,1792,58,1792,"Committed","2026-10-01"),mk("TEN-CA","group_role",26,26,0,26,"Committed","2026-10-02"),mk("TEN-CA","cost_center",31,29,2,29,"Committed","2026-10-02"),mk("TEN-CA","vendor_contract",62,55,7,0,"Dry run","2026-10-08"),mk("TEN-CA","application",118,118,0,118,"Committed","2026-10-07"),
  mk("TEN-CB","org_unit",38,38,0,38,"Committed","2026-10-05"),mk("TEN-CB","person",3200,2988,212,0,"Dry run","2026-10-09"),mk("TEN-CB","group_role",41,41,0,41,"Committed","2026-10-06")]}
function sampleSources(){const s=(tenant,id,name,system,type,dir,sch,owner,backup,status,fab,recs,last,map)=>({id,tenant,name,system,system_type:type,direction:dir,schedule:sch,owner,backup,status,simulated:true,fabric_connector:fab||"",mapping:JSON.stringify(map||[]),endpoint_alias:name.toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-"+(tenant==="TEN-MSF"?"prod":"pilot"),last_run:last||"",records:recs||0,sample:true});
 const M=(a)=>a.map(x=>({src:x[0],ent:x[1],field:x[2],rule:x[3]||"As is"}));
 return[
  s("TEN-MSF","DS-MSF-01","Microsoft Entra ID","Microsoft Entra ID","Identity","Inbound","Live","Jordan Lee","Sam Patel","Connected","c_dir",412,"Oct 11 06:00",M([["userPrincipalName","person","email"],["displayName","person","name"],["jobTitle","person","role"],["department","person","team"],["manager","person","manager","Resolve to name"]])),
  s("TEN-MSF","DS-MSF-02","Microsoft 365 via Graph","Microsoft 365 (E5)","Files","Both","Near-live","Jordan Lee","Sam Patel","Connected","c_graph",2400,"Oct 11 06:10",M([["startDateTime","project_task","planned_start","ISO date to date"],["dueDateTime","project_task","planned_finish","ISO date to date"],["percentComplete","project_task","percent_complete"]])),
  s("TEN-MSF","DS-MSF-03","HR system of record","HRIS (file export)","HR","Inbound","Daily","Joanna Pierce","Theo Marlowe","Configured","",0,"Oct 10 23:00",M([["employee_id","person","id"],["end_date","person","end_date"],["fte","person","fte"]])),
  s("TEN-MSF","DS-MSF-04","Lease subledger (ERP)","ERP finance","ERP and finance","Both","Daily","Avery Chen","Maya Ortiz","Configured","",0,"Oct 10 22:00",M([["gl_account","budget_line","dept"],["period_actual","budget_line","actual"]])),
  s("TEN-MSF","DS-MSF-05","Azure Monitor","Microsoft Azure","Monitoring","Inbound","Near-live","Sam Patel","Jordan Lee","Connected","",8800,"Oct 11 06:20",M([["alertId","incident","number"],["severity","incident","priority"]])),
  s("TEN-MSF","DS-MSF-06","Azure cost management","Microsoft Azure","Cloud","Inbound","Daily","Sam Patel","Avery Chen","Planned","",0,"",[]),
  s("TEN-MSF","DS-MSF-07","Contract repository","SharePoint library","Files","Inbound","Hourly","Camille Ortega","Avery Chen","Degraded","",146,"Oct 11 03:00",M([["contractId","contract","number"],["endDate","contract","end"]])),
  s("TEN-CA","DS-CA-01","Okta","Okta Workforce Identity","Identity","Inbound","Live","Sam Patel","Jordan Lee","Configured","",0,"",M([["profile.email","person","email"],["profile.displayName","person","name"],["profile.title","person","role"]])),
  s("TEN-CA","DS-CA-02","Epic EHR (reporting extract)","Epic Clarity","Clinical","Inbound","Daily","Sam Patel","Jordan Lee","Planned","",0,"",[]),
  s("TEN-CA","DS-CA-03","Workday HCM","Workday","HR","Inbound","Daily","Sam Patel","Jordan Lee","Planned","",0,"",[]),
  s("TEN-CA","DS-CA-04","ServiceNow incidents (migration)","ServiceNow","ITSM","Inbound","Manual","Jordan Lee","Sam Patel","Configured","",0,"",M([["number","incident","number"],["short_description","incident","title"],["priority","incident","priority"]])),
  s("TEN-CB","DS-CB-01","Microsoft Entra ID","Microsoft Entra ID","Identity","Inbound","Live","Jordan Lee","Rina Okafor","Connected","c_dir",3188,"Oct 11 05:50",M([["userPrincipalName","person","email"],["displayName","person","name"]])),
  s("TEN-CB","DS-CB-02","Core banking extract","Core banking (file)","ERP and finance","Inbound","Daily","Jordan Lee","Rina Okafor","Planned","",0,"",[]),
  s("TEN-CB","DS-CB-03","Splunk security events","Splunk","Monitoring","Inbound","Near-live","Rina Okafor","Jordan Lee","Configured","",0,"",M([["event_id","incident","number"]]))]}
function sampleOverlays(){const now="2026-10-09";
 const h=(v,by,status,note,ops)=>({v,at:now,by,status,note,ops});
 const A1=[{op:"approvals",step:"Approve",levels:[{group:"Change advisory board",cond:"",mode:"any"}]},{op:"sla",step:"Approve",sla:"1 working day"},{op:"param",key:"emergency_fast_path",value:"yes"}];
 const B1=[{op:"approvals",step:"Approve",levels:[{group:"Change advisory board",cond:"",mode:"any"},{group:"Security approvers",cond:"risk is High or the change touches production data",mode:"all"}]},{op:"add_step",after:"Check conflicts",step:{n:"Security review",d:"Architecture review board checks production-impacting changes for security before approval.",who:"human",group:"Architecture review board",sla:"2 working days",in:"Conflict check result",out:"Security review result"}},{op:"param",key:"evidence_retention_months",value:"84"}];
 const A2=[{op:"approvals",step:"Approve and order",levels:[{group:"Procurement approvers",cond:"amount over 25,000",mode:"any"}]},{op:"owner_group",step:"Receive",group:"Service desk"}];
 const B2=[{op:"approvals",step:"Approve and order",levels:[{group:"Finance approvers",cond:"",mode:"any"},{group:"Executive approvers",cond:"amount over 100,000",mode:"any"}]},{op:"approvals",step:"Match and pay",levels:[{group:"Finance approvers",cond:"",mode:"any"}]}];
 const bad=[{op:"approvals",step:"Approve or reject",levels:[]},{op:"owner_group",step:"Request",group:"Requesters"}];
 const bad2=[{op:"approvals",step:"Approve and order",levels:[{group:"Requesters",cond:"",mode:"any"}]}];
 return[
  {id:"OVL-CA-001",tenant:"TEN-CA",process:"itsm_chg",title:"Single approval at step 4, fast path for emergency changes",status:"Active",version:2,base_ver:1,ops:A1,required:["Process governance board"],approvals:[{level:1,group:"Process governance board",decision:"approved",by:"Casey Rowan",at:"2026-10-07",note:"Matches the customer's risk appetite."}],proposer:"Sam Patel",history:[h(1,"Sam Patel","Draft","First draft",A1.slice(0,1)),h(2,"Sam Patel","Active","Added SLA and fast path",A1)],note:"",updated:now},
  {id:"OVL-CB-001",tenant:"TEN-CB",process:"itsm_chg",title:"Two approvals at step 4 and a security review step",status:"Active",version:1,base_ver:1,ops:B1,required:["Process governance board","Security approvers"],approvals:[{level:1,group:"Process governance board",decision:"approved",by:"Theo Marlowe",at:"2026-10-08",note:"Regulatory requirement."},{level:2,group:"Security approvers",decision:"approved",by:"Rina Okafor",at:"2026-10-08",note:""}],proposer:"Jordan Lee",history:[h(1,"Jordan Lee","Active","Credit union change policy",B1)],note:"",updated:now},
  {id:"OVL-CA-002",tenant:"TEN-CA",process:"procure_to_pay",title:"Procurement approval above $25,000; receiving by service desk",status:"Pending approval",version:1,base_ver:1,ops:A2,required:["Process governance board"],approvals:[],proposer:"Sam Patel",history:[h(1,"Sam Patel","Pending approval","Submitted",A2)],note:"",updated:now},
  {id:"OVL-CB-002",tenant:"TEN-CB",process:"procure_to_pay",title:"Finance then executive approval, payment match by finance",status:"Pending approval",version:1,base_ver:1,ops:B2,required:["Process governance board"],approvals:[],proposer:"Jordan Lee",history:[h(1,"Jordan Lee","Pending approval","Submitted",B2)],note:"",updated:now},
  {id:"OVL-CA-003",tenant:"TEN-CA",process:"grc.exception_approval",title:"Remove the approval from risk acceptance (blocked by guardrails)",status:"Draft",version:1,base_ver:1,ops:bad,required:[],approvals:[],proposer:"Sam Patel",history:[h(1,"Sam Patel","Draft","Customer request, fails guardrails",bad)],note:"Customer asked to skip approvals for acceptances; guardrails block it.",updated:now},
  {id:"OVL-CB-003",tenant:"TEN-CB",process:"procure_to_pay",title:"Requesters approve their own orders (blocked by guardrails)",status:"Draft",version:1,base_ver:1,ops:bad2,required:[],approvals:[],proposer:"Jordan Lee",history:[h(1,"Jordan Lee","Draft","Fails segregation of duties",bad2)],note:"",updated:now}]}
let seeded=false;
function seed(){if(seeded||!ST.ok())return;seeded=true;
 const q={silent:true};
 SEED_T.forEach(t=>{if(!ST.get("tenant",t.id))ST.put("tenant",Object.assign({},t,{brand:JSON.stringify(t.brand)}),q)});
 if(!ST.all("import_batch").length)sampleBatches().forEach((b,i)=>{b.id=b.id+"-"+(i+1);ST.put("import_batch",b,q)});
 if(!ST.all("data_source").length)sampleSources().forEach(d=>ST.put("data_source",Object.assign({},d,{mapping:d.mapping}),q));
 if(!ST.all("tenant_overlay").length)sampleOverlays().forEach(o=>ST.put("tenant_overlay",Object.assign({},o,{ops:o.ops,guard:null}),q));
 R.syncMetrics();G(()=>{if(R.afterSeed)R.afterSeed()})}
R.seed=seed;
(function boot(){let n=0;const t=setInterval(()=>{n++;if(W.STORE&&STORE.onHydrate&&!R._hyd){R._hyd=1;STORE.onHydrate(()=>setTimeout(seed,60))}if(seeded||n>80)clearInterval(t)},250)})();
R.ensure=function(){if(!ST.ok())return false;if(!seeded)seed();return true};
R.waitScreen=function(sid){/* shown while the store loads */return `<div class="screen"><div class="r16m-wait">Opening the store</div></div>`};
if(W.STORE&&STORE.ready&&STORE.ready.then)STORE.ready.then(()=>setTimeout(()=>{if(S.screen&&/^r16m_/.test(S.screen))render()},120));
R.fmt={d:s=>s||"",pct:n=>Math.round(n)+"%"};
})();
