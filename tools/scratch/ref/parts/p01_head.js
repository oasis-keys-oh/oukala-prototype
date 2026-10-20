/* ============ Operations module: CMDB, data model, dependency views, ingestion, CMDB health, FinOps. prefix itom ============
   Round 8 rebuild. Event management, SLOs, runbooks and DevOps moved to the Observability module (mod_obs.js); v4 ideas are in ref/mod_itom_v4.js.
   One graph: configuration items are the shared CIREG records and relationships are the shared CIEDGE rows (from depends on to). This module only adds. */
(function(){
"use strict";
const NOWH=NOW.h;
const fmt=n=>Number(n).toLocaleString("en-US");
const f1=n=>(Math.round(n*10)/10).toFixed(1);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const nextId=p=>p+(++I.seq);
const enc=s=>String(s).replace(/[^A-Za-z0-9_-]/g,"");
const dl=(a)=>a&&a.length?a:[];
/* shared helpers */
function setLive(fid,html){const f=document.querySelector(`[data-form="${fid}"]`);if(!f)return;let b=f.querySelector(".itom-live");if(!b){b=document.createElement("div");b.className="itom-live glass";b.setAttribute("aria-live","polite");const a=f.querySelector(".fact");f.insertBefore(b,a)}b.innerHTML=html}
function OF(spec,init){if(spec.liveH){spec.live=(v,fid)=>setLive(fid,spec.liveH(v))}openForm(spec,init||{});if(spec.liveH){const st=FORMST[spec.id];setLive(spec.id,spec.liveH(st.vals))}}
const bad=(m)=>({toast:m,close:false,audit:"validation: "+m});
const K1=n=>"$"+(n/1000).toFixed(1)+"K";
const T2=h=>{const x=Math.floor(h),m=Math.round((h-x)*60);return (x<10?"0":"")+x+":"+(m<10?"0":"")+m};
const stp=(s)=>s==="good"?"good":s==="warn"?"warn":"bad";
const sp=(v,c)=>spark(v,110,30,col(c||"--accent"));
const me=()=>PERSONAS[S.persona].n;
const nowT=()=>new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
const tbl=(head,rows,min)=>`<div class="tablewrap itom-tw"><table style="min-width:${min||640}px"><thead><tr>${head.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
/* line and bar chart helpers (kept from v4 for the FinOps screen) */
function chart(o){const W=o.w||640,H=o.h||240,L=o.L||46,R=o.R||16,T=14,B=28,mn=o.min||0,mx=o.max,n=o.labels.length,ys=v=>T+(H-T-B)*(1-(v-mn)/(mx-mn)),xs=i=>L+(W-L-R)*i/Math.max(1,n-1);let g="";const tk=o.ticks||4;
 for(let i=0;i<=tk;i++){const v=mn+(mx-mn)*i/tk;g+=`<line class="grid-l" x1="${L}" x2="${W-R}" y1="${ys(v)}" y2="${ys(v)}"/><text class="ax" x="${L-8}" y="${ys(v)+4}" text-anchor="end">${o.fmt?o.fmt(v):Math.round(v)}</text>`}
 if(mn<0)g+=`<line x1="${L}" x2="${W-R}" y1="${ys(0)}" y2="${ys(0)}" stroke="var(--muted)" stroke-width="1.2"/>`;
 o.labels.forEach((l,i)=>{if(!o.every||i%o.every===0||i===n-1)g+=`<text class="ax" x="${xs(i)}" y="${H-8}" text-anchor="middle">${l}</text>`});
 (o.series||[]).forEach(s=>{const p=s.vals.map((v,i)=>[xs(i+(s.start||0)),ys(Math.max(mn,Math.min(mx,v)))]);const d=p.map((q,i)=>(i?"L":"M")+q[0].toFixed(1)+" "+q[1].toFixed(1)).join("");if(s.area)g+=`<path d="${d}L${p[p.length-1][0]} ${ys(Math.max(mn,0))}L${p[0][0]} ${ys(Math.max(mn,0))}Z" fill="${s.color}" opacity=".14"/>`;g+=`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.w||2.4}" stroke-linecap="round" stroke-linejoin="round"${s.dash?` stroke-dasharray="${s.dash}"`:""}/>`});
 (o.marks||[]).forEach(m=>{const y=ys(m.v);g+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="${m.color}" stroke-width="1.5" stroke-dasharray="3 5"/><text class="ax" x="${W-R-4}" y="${y-5}" text-anchor="end" style="fill:${m.color}">${m.label}</text>`});
 return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(o.alt||"Chart")}">${g}</svg>`}
function bars(o){const W=o.w||640,H=o.h||230,L=50,R=14,T=14,B=28,mx=o.max,n=o.labels.length,bw=(W-L-R)/n,ys=v=>T+(H-T-B)*(1-v/mx);let g="";
 for(let i=0;i<=4;i++){const v=mx*i/4;g+=`<line class="grid-l" x1="${L}" x2="${W-R}" y1="${ys(v)}" y2="${ys(v)}"/><text class="ax" x="${L-8}" y="${ys(v)+4}" text-anchor="end">${o.fmt(v)}</text>`}
 o.labels.forEach((l,i)=>{const x=L+i*bw+bw*.18,w=bw*.64,v=o.vals[i],f=o.fc&&o.fc.includes(i);g+=`<rect x="${x}" y="${ys(v)}" width="${w}" height="${ys(0)-ys(v)}" rx="6" style="fill:${v>o.line&&!f?"var(--warn-f)":"var(--accent)"}" opacity="${f?.45:.9}" ${f?'stroke="var(--accent)" stroke-dasharray="4 3" fill-opacity=".3"':""}><title>${l}: ${o.fmt(v)}</title></rect><text class="ax" x="${x+w/2}" y="${H-8}" text-anchor="middle">${l}</text>`});
 g+=`<line x1="${L}" x2="${W-R}" y1="${ys(o.line)}" y2="${ys(o.line)}" stroke="var(--bad-f)" stroke-width="1.8" stroke-dasharray="4 4"/><text class="ax" x="${W-R-2}" y="${ys(o.line)-6}" text-anchor="end" style="fill:var(--bad)">${o.lineLabel}</text>`;
 return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(o.alt||"Bar chart")}">${g}</svg>`}

/* ================= STATE ================= */
const I=S.itom=S.itom||{};
Object.assign(I,{rev:I.rev||0,seq:I.seq||100,sel:I.sel||null,view:I.view||"all",saved:I.saved||[],dupNo:I.dupNo||{},tasks:I.tasks||null,camps:I.camps||null,aud:I.aud||null,
 g:I.g||{view:"explore",focus:"ci_x_db2",focus2:null,depth:3,mode:"impact",rels:null,cls:null,sel:null,exp:{},path:null,walk:{start:"svc_erp",steps:[]},labels:true},
 mdl:I.mdl||{sel:"cmdb_ci_server",col:{}},ing:I.ing||{src:"orion",scn:"normal",last:null,pay:null},dims:I.dims||"Service",fin:I.fin||{accepted:{},tagFixed:false,rules:null},
 srcs:I.srcs||null,runs:I.runs||null,rej:I.rej||null,prec:I.prec||null,idr:I.idr||null,sync:I.sync||{scaled:false}});

/* ================= DATA MODEL: class hierarchy, attributes, relationship catalog, CSDM domains ================= */
const A=(k,label,t,o)=>Object.assign({k,label,t:t||"string"},o||{});
const ENVS=["Production","Test","Dev","DR"],OPS=["Operational","Degraded","Non-operational","Retired"],LIFE=["Planned","Build","Operational","Retiring","Retired"];
const CRIT=["1 - Mission critical","2 - Somewhat critical","3 - Less critical","4 - Not critical"];
const GROUPS=["Platform team","Ops team","Data team","Service desk","Security","Finance","Architecture","Lumen (vendor)"];
const DOM={foundation:{n:"Foundation",was:"Foundation",c:"--e4",d:"Shared reference data every other domain points at: locations, companies, people, groups, contracts."},
 ideation:{n:"Ideation and Strategy",was:"new in CSDM 5",c:"--u3",d:"What the Foundation wants to be able to do: business capabilities, goals and strategic portfolios."},
 design:{n:"Design and Planning",was:"Design",c:"--p4",d:"The business view of what is built: business applications, information objects and dynamic CI groups."},
 build:{n:"Build and Integration",was:"Build",c:"--s3",d:"The software and cloud assets teams build and release: applications, middleware, containers, functions."},
 delivery:{n:"Service Delivery",was:"Manage Technical Services",c:"--w1",d:"How technology is run: technology management services, application services (service instances), servers, databases, network and storage."},
 consume:{n:"Service Consumption",was:"Sell and Consume (ordering, service offerings)",c:"--p2",d:"What people consume and order: business services and service offerings with their support hours and prices."},
 portfolio:{n:"Manage Portfolio",was:"new in CSDM 5",c:"--u2",d:"Planning and investment view: demand, projects and portfolios linked to the services they change (lives in the PPM modules)."}};
const CL=[
{id:"cmdb_ci",label:"Configuration item",parent:null,abs:1,dom:"foundation",own:[A("name","Name","string",{req:1,idf:1}),A("environment","Environment","enum",{req:1,opts:ENVS}),A("operational_status","Operational status","enum",{req:1,opts:OPS}),A("lifecycle_stage","Lifecycle stage","enum",{req:1,opts:LIFE}),A("owned_by","Owned by","ref",{req:1,ref:"person"}),A("support_group","Support group","ref",{req:1,ref:"group"}),A("business_criticality","Business criticality","enum",{req:1,opts:CRIT}),A("managed_by_group","Managed by group","ref",{ref:"group"}),A("location","Location","ref",{rec:1,ref:"site"}),A("vendor","Vendor","ref",{rec:1,ref:"vendor"}),A("discovery_source","Discovery source","enum",{rec:1}),A("last_discovered","Last discovered","date"),A("correlation_id","Correlation ID","string",{idf:1}),A("short_description","Description","string",{rec:1})]},
{id:"cmdb_ci_hardware",label:"Hardware",parent:"cmdb_ci",abs:1,dom:"delivery",own:[A("manufacturer","Manufacturer","string",{rec:1}),A("model_id","Model","string",{rec:1}),A("asset_tag","Asset tag","ref",{ref:"asset",rec:1}),A("serial_number","Serial number","string",{idf:1,rec:1}),A("warranty_expiration","Warranty expiration","date")]},
{id:"cmdb_ci_computer",label:"Computer",parent:"cmdb_ci_hardware",abs:1,dom:"delivery",own:[A("cpu_count","CPU count","int",{req:1}),A("ram_mb","Memory (MB)","int",{req:1}),A("os","Operating system","string",{req:1}),A("os_version","OS version","string",{rec:1}),A("ip_address","IP address","ip",{req:1,idf:1}),A("mac_address","MAC address","string",{idf:1}),A("disk_space_gb","Disk space (GB)","int"),A("fqdn","Fully qualified name","string",{rec:1})]},
{id:"cmdb_ci_server",label:"Server",parent:"cmdb_ci_computer",dom:"delivery",own:[A("rack","Rack","ref",{ref:"cmdb_ci_rack",rec:1}),A("rack_u","Rack position (U)","int"),A("is_virtual","Virtual","bool"),A("chassis_type","Chassis type","enum",{opts:["Rack","Blade","Tower"]})]},
{id:"cmdb_ci_linux_server",label:"Linux server",parent:"cmdb_ci_server",dom:"delivery",own:[A("distribution","Distribution","enum",{req:1,opts:["Ubuntu","Red Hat","Debian","SUSE"]}),A("kernel_version","Kernel version","string")]},
{id:"cmdb_ci_win_server",label:"Windows server",parent:"cmdb_ci_server",dom:"delivery",own:[A("domain","Domain","string",{req:1}),A("ad_site","Active Directory site","string"),A("patch_group","Patch group","enum",{opts:["Ring 0","Ring 1","Ring 2"]})]},
{id:"cmdb_ci_esx_server",label:"Virtualization host",parent:"cmdb_ci_server",dom:"delivery",own:[A("hypervisor","Hypervisor","enum",{req:1,opts:["VMware ESXi","Hyper-V","KVM"]}),A("cluster","Cluster","string",{req:1}),A("vm_capacity","VM capacity","int"),A("vm_count","VMs running","int")]},
{id:"cmdb_ci_pc_hardware",label:"Endpoint device",parent:"cmdb_ci_computer",dom:"delivery",own:[A("assigned_user","Assigned user","ref",{req:1,ref:"person"}),A("compliance_state","Compliance state","enum",{req:1,opts:["Compliant","In grace period","Non-compliant"]}),A("enrolled_in","Enrolled in","enum",{opts:["Intune","Jamf","Not managed"]})]},
{id:"cmdb_ci_netgear",label:"Network device",parent:"cmdb_ci_hardware",dom:"delivery",own:[A("ip_address","IP address","ip",{req:1,idf:1}),A("firmware_version","Firmware version","string",{req:1}),A("port_count","Port count","int"),A("management_protocol","Management protocol","enum",{opts:["SNMPv3","SSH","REST API"]})]},
{id:"cmdb_ci_firewall",label:"Firewall",parent:"cmdb_ci_netgear",dom:"delivery",own:[A("policy_count","Policy count","int"),A("ha_mode","High availability","enum",{req:1,opts:["Active/Active","Active/Passive","Standalone"]})]},
{id:"cmdb_ci_ip_switch",label:"Switch",parent:"cmdb_ci_netgear",dom:"delivery",own:[A("stack_size","Stack size","int"),A("vlan_count","VLAN count","int")]},
{id:"cmdb_ci_ip_router",label:"Router",parent:"cmdb_ci_netgear",dom:"delivery",own:[A("routing_protocol","Routing protocol","enum",{opts:["BGP","OSPF","Static"]})]},
{id:"cmdb_ci_lb",label:"Load balancer",parent:"cmdb_ci_netgear",dom:"delivery",own:[A("vip_count","Virtual IPs","int"),A("algorithm","Algorithm","enum",{req:1,opts:["Round robin","Least connections","Weighted"]})]},
{id:"cmdb_ci_storage_device",label:"Storage",parent:"cmdb_ci_hardware",dom:"delivery",own:[A("capacity_gb","Capacity (GB)","int",{req:1}),A("used_gb","Used (GB)","int"),A("storage_tier","Tier","enum",{req:1,opts:["Premium","Standard","Archive"]}),A("protocol","Protocol","enum",{opts:["NFS","SMB","Blob","iSCSI"]}),A("replication","Replication","enum",{opts:["Local","Zone","Geo"]})]},
{id:"cmdb_ci_software",label:"Software",parent:"cmdb_ci",abs:1,dom:"build",own:[A("version","Version","string",{rec:1})]},
{id:"cmdb_ci_appl",label:"Application",parent:"cmdb_ci_software",dom:"build",own:[A("tech_stack","Technology stack","string",{rec:1}),A("url","URL","string"),A("data_classification","Data classification","enum",{req:1,opts:["Public","Internal","Confidential","Restricted"]}),A("recovery_tier","Recovery tier","enum",{req:1,opts:["RTO 1 hour","RTO 4 hours","RTO 24 hours"]}),A("sso_enabled","Single sign-on","bool")]},
{id:"cmdb_ci_business_app",label:"Business application",parent:"cmdb_ci_appl",dom:"design",own:[A("product_owner","Product owner","ref",{req:1,ref:"person"}),A("business_capability","Business capability","ref",{req:1,ref:"cmdb_ci_business_capability"}),A("user_count","Users","int"),A("strategic_fit","Strategic fit","enum",{opts:["Invest","Maintain","Migrate","Retire"]})]},
{id:"cmdb_ci_db_instance",label:"Database",parent:"cmdb_ci_software",dom:"delivery",own:[A("engine","Engine","enum",{req:1,opts:["SQL Server","PostgreSQL","Azure SQL","Oracle","MySQL","Cosmos DB"]}),A("instance_name","Instance name","string"),A("tcp_port","TCP port","int"),A("size_gb","Size (GB)","int",{req:1}),A("backup_policy","Backup policy","string",{req:1}),A("tde_enabled","Encryption at rest","bool"),A("replica_of","Replica of","ref",{ref:"cmdb_ci_db_instance"})]},
{id:"cmdb_ci_db_mssql_instance",label:"SQL Server instance",parent:"cmdb_ci_db_instance",dom:"delivery",own:[A("edition","Edition","enum",{opts:["Standard","Enterprise","Managed instance"]}),A("collation","Collation","string"),A("availability_group","Availability group","string")]},
{id:"cmdb_ci_appl_middleware",label:"Middleware",parent:"cmdb_ci_software",dom:"build",own:[A("runtime","Runtime","string"),A("listen_ports","Listen ports","string")]},
{id:"cmdb_ci_web_server",label:"Web server",parent:"cmdb_ci_appl_middleware",dom:"build",own:[A("tls_version","Minimum TLS","enum",{req:1,opts:["1.2","1.3"]})]},
{id:"cmdb_ci_msg_broker",label:"Message broker",parent:"cmdb_ci_appl_middleware",dom:"build",own:[A("queue_count","Queues","int"),A("protocol","Protocol","enum",{opts:["AMQP","MQTT","Kafka"]})]},
{id:"cmdb_ci_api_gateway",label:"API gateway",parent:"cmdb_ci_appl_middleware",dom:"build",own:[A("api_count","APIs published","int"),A("auth_policy","Authentication","enum",{opts:["OAuth 2.0","API key","Mutual TLS"]})]},
{id:"cmdb_ci_cloud",label:"Cloud",parent:"cmdb_ci",abs:1,dom:"build",own:[A("cloud_provider","Cloud provider","enum",{req:1,opts:["Azure","AWS","Google Cloud"]}),A("region","Region","string",{req:1}),A("subscription_id","Subscription or account","string",{req:1}),A("resource_id","Resource ID","string",{idf:1,req:1}),A("resource_group","Resource group","string"),A("tags","Tags","list",{rec:1})]},
{id:"cmdb_ci_vm_instance",label:"Virtual machine",parent:"cmdb_ci_cloud",dom:"delivery",own:[A("instance_type","Size","string",{req:1}),A("vcpu","vCPU","int"),A("ram_gb","Memory (GB)","int"),A("os","Operating system","string",{req:1}),A("power_state","Power state","enum",{opts:["Running","Stopped","Deallocated"]}),A("ip_address","IP address","ip",{req:1,idf:1})]},
{id:"cmdb_ci_container",label:"Container",parent:"cmdb_ci_cloud",dom:"build",own:[A("image","Image","string",{req:1}),A("cluster","Cluster","string",{req:1}),A("namespace","Namespace","string"),A("replicas","Replicas","int")]},
{id:"cmdb_ci_cloud_function",label:"Cloud function",parent:"cmdb_ci_cloud",dom:"build",own:[A("runtime","Runtime","string",{req:1}),A("memory_mb","Memory (MB)","int"),A("trigger","Trigger","enum",{opts:["HTTP","Timer","Queue","Event"]})]},
{id:"cmdb_ci_cloud_service",label:"Cloud resource",parent:"cmdb_ci_cloud",dom:"delivery",own:[A("service_type","Service type","string",{req:1}),A("sku","SKU","string"),A("endpoint","Endpoint","string"),A("redundancy","Redundancy","enum",{opts:["Local","Zone","Geo"]})]},
{id:"cmdb_ci_cloud_sub",label:"Cloud subscription",parent:"cmdb_ci_cloud",dom:"foundation",own:[A("tenant_id","Tenant ID","string",{req:1}),A("monthly_spend","Monthly spend","money"),A("account_owner","Account owner","ref",{ref:"person"})]},
{id:"cmdb_ci_service",label:"Service",parent:"cmdb_ci",abs:1,dom:"consume",own:[A("service_owner","Service owner","ref",{req:1,ref:"person"}),A("tier","Tier","enum",{req:1,opts:["Tier 1","Tier 2","Tier 3"]}),A("sla_target","Availability target","percent"),A("users","Users","int")]},
{id:"cmdb_ci_service_business",label:"Business service",parent:"cmdb_ci_service",dom:"consume",own:[A("business_unit","Business unit","string",{rec:1}),A("customer_segment","Customer segment","enum",{opts:["Public","Subscriber","Internal"]}),A("revenue_linked","Revenue linked","bool")]},
{id:"cmdb_ci_service_technical",label:"Technology management service",parent:"cmdb_ci_service",dom:"delivery",own:[A("tms_category","Category","enum",{req:1,opts:["Compute","Storage","Network","Identity","Security","Backup","Monitoring"]})]},
{id:"cmdb_ci_service_auto",label:"Application service",parent:"cmdb_ci_service",dom:"delivery",own:[A("application","Business application","ref",{req:1,ref:"cmdb_ci_business_app"}),A("deployment_model","Deployment model","enum",{opts:["Cloud","Hybrid","On premises"]})]},
{id:"service_offering",label:"Service offering",parent:"cmdb_ci_service",dom:"consume",own:[A("parent_service","Parent service","ref",{req:1,ref:"cmdb_ci_service_business"}),A("support_hours","Support hours","enum",{req:1,opts:["24x7","Business hours","Best effort"]}),A("delivery_manager","Delivery manager","ref",{ref:"person"}),A("price_model","Price model","enum",{opts:["Free","Chargeback","Subscription"]})]},
{id:"cmdb_ci_query_based_service",label:"Dynamic CI group",parent:"cmdb_ci",dom:"design",own:[A("query_filter","Membership query","string",{req:1}),A("member_count","Members","int"),A("refresh","Refresh","enum",{opts:["Hourly","Daily","On change"]})]},
{id:"cmdb_ci_business_capability",label:"Business capability",parent:"cmdb_ci",dom:"ideation",own:[A("capability_level","Level","int",{req:1}),A("strategic_importance","Strategic importance","enum",{req:1,opts:["Core","Supporting","Commodity"]}),A("maturity","Maturity (1 to 5)","int"),A("parent_capability","Parent capability","ref",{ref:"cmdb_ci_business_capability"})]},
{id:"cmdb_ci_information_object",label:"Information object",parent:"cmdb_ci",dom:"design",own:[A("data_classification","Data classification","enum",{req:1,opts:["Public","Internal","Confidential","Restricted"]}),A("retention_years","Retention (years)","int",{req:1}),A("regulation","Regulations","list"),A("steward","Data steward","ref",{ref:"person"})]},
{id:"cmdb_ci_site",label:"Site",parent:"cmdb_ci",dom:"foundation",own:[A("site_type","Site type","enum",{req:1,opts:["Headquarters","Office","Colocation","Cloud region"]}),A("address","Address","string"),A("country","Country","string"),A("time_zone","Time zone","string")]},
{id:"cmdb_ci_datacenter",label:"Datacenter",parent:"cmdb_ci_site",dom:"foundation",own:[A("tier_rating","Tier rating","enum",{opts:["I","II","III","IV"]}),A("power_kw","Power capacity (kW)","int")]},
{id:"cmdb_ci_rack",label:"Rack",parent:"cmdb_ci_datacenter",dom:"foundation",own:[A("total_u","Total U","int",{req:1}),A("used_u","Used U","int"),A("row_pos","Row","string")]},
{id:"core_company",label:"Vendor",parent:"cmdb_ci",dom:"foundation",kind:"rec",own:[A("vendor_type","Vendor type","enum",{req:1,opts:["Software","Managed service","Cloud","Hardware","Telecom"]}),A("risk_rating","Risk rating","enum",{opts:["Low","Medium","High"]}),A("primary_contact","Primary contact","ref",{ref:"person"})]},
{id:"ast_contract",label:"Contract",parent:"cmdb_ci",dom:"foundation",kind:"rec",own:[A("contract_number","Contract number","string",{req:1,idf:1}),A("start_date","Start","date"),A("end_date","End","date",{req:1}),A("annual_value","Annual value","money"),A("renewal_notice_days","Renewal notice (days)","int")]}
];
let CLM={},ATC={};
function reindexCL(){CLM={};ATC={};CL.forEach(c=>CLM[c.id]=c)}reindexCL();
const kidsOf=id=>CL.filter(c=>c.parent===id);
const chainOf=id=>{const a=[];let c=CLM[id],g=0;while(c&&g++<12){a.unshift(c);c=CLM[c.parent]}return a};
const isA=(id,anc)=>{let c=CLM[id],g=0;while(c&&g++<12){if(c.id===anc)return true;c=CLM[c.parent]}return false};
const attrsOf=id=>ATC[id]||(ATC[id]=chainOf(id).flatMap(c=>c.own.map(a=>Object.assign({},a,{lvl:c.label,lvlId:c.id}))).filter((a,i,arr)=>arr.findIndex(b=>b.k===a.k)===i||false));
const reqOf=id=>attrsOf(id).filter(a=>a.req);
const descOf=id=>{const o=[id];kidsOf(id).forEach(k=>o.push(...descOf(k.id)));return o};
const clsLabel=id=>(CLM[id]||{label:id}).label;
const LEGACY={"Virtual machine":"cmdb_ci_vm_instance","Database":"cmdb_ci_db_instance","Load balancer":"cmdb_ci_lb","Application":"cmdb_ci_appl","Storage":"cmdb_ci_storage_device","Cloud resource":"cmdb_ci_cloud_service","Network device":"cmdb_ci_netgear","Cloud subscription":"cmdb_ci_cloud_sub","Server":"cmdb_ci_server","Container":"cmdb_ci_container"};
const BYLABEL=()=>{const m={};CL.forEach(c=>m[c.label]=c.id);return Object.assign(m,LEGACY)};
const alias=id=>clsLabel(id).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
const byAlias=a=>{a=String(a).trim().toLowerCase();const c=CL.find(x=>alias(x.id)===a||x.id===a);return c?c.id:null};
/* relationship types: stored as [from,to,key] meaning "from <key> to". flip=true types are entered the other way round and stored as their inverse. */
const RT=[
 {k:"depends on",fw:"Depends on",rv:"Used by",d:"The source cannot work without the target. This is the default for impact analysis: if the target fails the source is affected.",ex:"Application depends on Database",pairs:[["cmdb_ci_appl","cmdb_ci_db_instance"],["cmdb_ci_service","cmdb_ci_service"],["cmdb_ci_service_auto","cmdb_ci_appl"],["cmdb_ci_service_technical","cmdb_ci_hardware"],["cmdb_ci_business_app","cmdb_ci_service_auto"]]},
 {k:"runs on",fw:"Runs on",rv:"Runs",d:"Software or a virtual machine that executes on a host, container or platform.",ex:"Application runs on Virtual machine",pairs:[["cmdb_ci_software","cmdb_ci_computer"],["cmdb_ci_software","cmdb_ci_cloud"],["cmdb_ci_cloud","cmdb_ci_computer"],["cmdb_ci_software","cmdb_ci_software"],["cmdb_ci_service_auto","cmdb_ci_service_technical"]]},
 {k:"hosted on",fw:"Hosted on",rv:"Hosts",d:"Physical or logical placement: a server in a rack, a virtual machine on a host or subscription.",ex:"Server hosted on Rack",pairs:[["cmdb_ci_computer","cmdb_ci_rack"],["cmdb_ci_netgear","cmdb_ci_rack"],["cmdb_ci_cloud","cmdb_ci_cloud_sub"],["cmdb_ci_cloud","cmdb_ci_esx_server"],["cmdb_ci_software","cmdb_ci_computer"]]},
 {k:"connects to",fw:"Connects to",rv:"Connected by",d:"Network or data connection between two items that does not imply ownership.",ex:"Server connects to Switch",pairs:[["cmdb_ci_computer","cmdb_ci_netgear"],["cmdb_ci_netgear","cmdb_ci_netgear"],["cmdb_ci_netgear","cmdb_ci_cloud"],["cmdb_ci_software","cmdb_ci_netgear"]]},
 {k:"uses",fw:"Uses",rv:"Used by",d:"Consumes a shared capability such as an identity tenant, API or reference data store.",ex:"Application uses Cloud resource",pairs:[["cmdb_ci_software","cmdb_ci"],["cmdb_ci_business_app","cmdb_ci_information_object"],["cmdb_ci_service","cmdb_ci"]]},
 {k:"consumes",fw:"Consumes",rv:"Consumed by",d:"A service or application takes data or output from another.",ex:"Business service consumes Application service",pairs:[["cmdb_ci_service","cmdb_ci_service"],["cmdb_ci_appl","cmdb_ci_appl"]]},
 {k:"runs behind",fw:"Runs behind",rv:"Fronts",d:"Sits behind a gateway, firewall or load balancer.",ex:"Application runs behind Load balancer",pairs:[["cmdb_ci","cmdb_ci_netgear"]]},
 {k:"contained by",fw:"Contained by",rv:"Contains",flip:1,d:"Grouping: a rack contains servers, a capability contains business applications. Entered as Contains, stored as Contained by so impact still flows to the container.",ex:"Rack contains Server",pairs:[["cmdb_ci","cmdb_ci"]]},
 {k:"provided by",fw:"Provided by",rv:"Provides",flip:1,d:"A vendor or platform provides a service or asset. Entered as Provides, stored as Provided by.",ex:"Vendor provides Contract",pairs:[["cmdb_ci","core_company"],["cmdb_ci","ast_contract"],["cmdb_ci_service","cmdb_ci"]]},
 {k:"supported by",fw:"Supported by",rv:"Supports",flip:1,d:"A contract, group or technology supports an item. Entered as Supports, stored as Supported by.",ex:"Contract supports Application",pairs:[["cmdb_ci","ast_contract"],["cmdb_ci_business_capability","cmdb_ci_business_app"]]},
 {k:"located in",fw:"Located in",rv:"Houses",d:"Physical or organizational location.",ex:"Rack located in Datacenter",pairs:[["cmdb_ci_rack","cmdb_ci_datacenter"],["cmdb_ci_datacenter","cmdb_ci_site"],["cmdb_ci","cmdb_ci_site"]]},
 {k:"owned by",fw:"Owned by",rv:"Owns",attr:"owned_by",d:"Accountable person or group. Stored as the Owned by attribute (not a CI-to-CI edge) so it never distorts impact paths.",ex:"Application owned by Person",pairs:[["cmdb_ci","sys_user"]]},
 {k:"managed by",fw:"Managed by",rv:"Manages",attr:"managed_by_group",d:"Group or managed service provider that operates the item day to day. Stored as an attribute.",ex:"Server managed by Northwind Managed Services",pairs:[["cmdb_ci","sys_user_group"]]}];
const RTM={};RT.forEach(r=>RTM[r.k]=r);
const rtFw=k=>(RTM[k]||{fw:k.charAt(0).toUpperCase()+k.slice(1)}).fw,rtRv=k=>(RTM[k]||{rv:"Used by"}).rv;
const EDGE_RT=()=>RT.filter(r=>!r.attr);
/* compliance rules about relationships ("suggested relationships" in ServiceNow): a class must have at least one outgoing edge of this type to one of these target classes */
let RULES=[
 {id:"RR1",cls:"cmdb_ci_appl",rel:"runs on",to:["cmdb_ci_computer","cmdb_ci_cloud","cmdb_ci_software"],min:1,why:"An application with no host cannot be patched, recovered or costed.",on:1},
 {id:"RR2",cls:"cmdb_ci_db_instance",rel:"runs on",to:["cmdb_ci_computer","cmdb_ci_cloud"],min:1,why:"A database needs a host so backup and failover plans can be traced.",on:1},
 {id:"RR3",cls:"cmdb_ci_vm_instance",rel:"hosted on",to:["cmdb_ci_esx_server","cmdb_ci_cloud_sub","cmdb_ci_server"],min:1,why:"Every virtual machine sits on a host or subscription; otherwise capacity and cost are invisible.",on:1},
 {id:"RR4",cls:"cmdb_ci_server",rel:"hosted on",to:["cmdb_ci_rack"],min:1,why:"Physical servers must be placed in a rack for change windows and power planning.",on:1,onlyIf:c=>!(c.a&&c.a.is_virtual===true)&&!c.cloudish},
 {id:"RR5",cls:"cmdb_ci_service_auto",rel:"depends on",to:["cmdb_ci_appl"],min:1,why:"An application service with no application behind it is an empty shell.",on:1},
 {id:"RR6",cls:"cmdb_ci_service_business",rel:"depends on",to:["service_offering"],min:1,why:"Business services are consumed through offerings (CSDM service consumption).",on:1}];
const CSDM_DOMS=Object.keys(DOM);
/* class registered in the platform field catalog so SLA, workflow and report builders can pick real fields */
const TYPEMAP={string:"string",int:"number",enum:"enum",ref:"ref",bool:"boolean",date:"date",ip:"string",list:"list",percent:"percent",money:"currency"};
function regModel(){CL.forEach(c=>{const f=attrsOf(c.id).map(a=>({k:a.k,label:a.label,type:TYPEMAP[a.t]||"string",opts:a.opts}));DATAMODEL.register(c.id,{label:c.label+(c.kind==="rec"?" (related record)":""),source:"CMDB",fields:f})});
 DATAMODEL.register("cmdb_ci",{label:"Configuration item",source:"CMDB",fields:[{k:"class",label:"Class",type:"enum"},{k:"uptime_30d",label:"Uptime, last 30 days",type:"percent"},{k:"lifecycle_stage",label:"Lifecycle stage",type:"enum",opts:LIFE},{k:"health_score",label:"CMDB health score",type:"number"},{k:"service",label:"Service supported",type:"ref"},{k:"discovery_source",label:"Discovery source",type:"enum"},{k:"last_discovered",label:"Last discovered",type:"datetime"}]});
 DATAMODEL.register("cmdb_rel_ci",{label:"CI relationship",source:"CMDB",fields:[{k:"parent",label:"Parent (depends on the child)",type:"ref"},{k:"child",label:"Child (depended on)",type:"ref"},{k:"type",label:"Relationship type",type:"enum",opts:EDGE_RT().map(r=>r.fw)},{k:"source",label:"Source",type:"enum"}]})}
