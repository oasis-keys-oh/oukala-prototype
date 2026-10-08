
/* ================= SOURCES (ingestion) ================= */
const SRC=[
{id:"orion",n:"SolarWinds Orion (SAM and NPM)",s:"SolarWinds Orion",kind:"Monitoring",c:"--s3",tcls:"cmdb_ci_computer",up:1,every:"Every 5 minutes",state:"Healthy",
 desc:"Network Performance Monitor (NPM) and Server and Application Monitor (SAM). Reads nodes, interfaces, volumes and application templates through the SolarWinds Information Service (SWIS) and brings availability and uptime with every node.",
 conn:{url:"https://orion.meridian.example:17774/SolarWinds/InformationService/v3/Json",user:"svc-oukala-orion",modules:["NPM","SAM"]},
 fields:["NodeID","Caption","IPAddress","MachineType","Vendor","Status","LastBoot","Availability30d","AvgResponseTime","PercentLoss","SysName"],
 map:[{f:"Caption",a:"name",x:"lowercase"},{f:"IPAddress",a:"ip_address",x:"as is"},{f:"Vendor",a:"manufacturer",x:"as is"},{f:"MachineType",a:"os",x:"clean text"},{f:"Status",a:"operational_status",x:"1 Up, 2 Down, 3 Warning"},{f:"Availability30d",a:"uptime_30d",x:"number, 2 decimals"},{f:"LastBoot",a:"last_discovered",x:"date"}]},
{id:"nagios",n:"Nagios and Zabbix",s:"Nagios and Zabbix",kind:"Monitoring",c:"--s2",tcls:"cmdb_ci_computer",up:1,every:"Every 10 minutes",state:"Not connected",
 desc:"Legacy open source monitoring still used by Lumen for the search indexers. Reads hosts, groups and the state history from the status API.",
 conn:{url:"https://nagios.lumen.example/nagiosxi/api/v1",user:"oukala-readonly",modules:["Hosts","Services"]},
 fields:["host_name","address","alias","current_state","hostgroups","last_check","percent_state_change"],
 map:[{f:"host_name",a:"name",x:"lowercase"},{f:"address",a:"ip_address",x:"as is"},{f:"current_state",a:"operational_status",x:"0 Up, 1 Down, 2 Unreachable"},{f:"hostgroups",a:"support_group",x:"first group"}]},
{id:"azure",n:"Azure Resource Graph",s:"Azure Resource Graph",kind:"Cloud discovery",c:"--w1",tcls:"cmdb_ci_vm_instance",up:1,every:"Every hour",state:"Healthy",
 desc:"Queries every subscription in the Foundation's tenant for virtual machines, containers, functions, databases and managed services with their tags.",
 conn:{url:"https://management.azure.com (tenant a1f2...c9)",user:"Reader on 4 subscriptions",modules:["Compute","Network","Storage","Data"]},
 fields:["id","name","type","location","subscriptionId","resourceGroup","tags","sku.name","properties.hardwareProfile.vmSize","properties.provisioningState"],
 map:[{f:"name",a:"name",x:"lowercase"},{f:"id",a:"resource_id",x:"as is"},{f:"location",a:"region",x:"as is"},{f:"subscriptionId",a:"subscription_id",x:"as is"},{f:"properties.hardwareProfile.vmSize",a:"instance_type",x:"as is"},{f:"tags.owner",a:"owned_by",x:"look up person"}]},
{id:"aws",n:"AWS Config and Systems Manager",s:"AWS",kind:"Cloud discovery",c:"--w1",tcls:"cmdb_ci_vm_instance",up:1,every:"Every hour",state:"Not connected",
 desc:"Reserved for the one acquisition workload in us-east-1. Not in use yet.",conn:{url:"https://config.us-east-1.amazonaws.com",user:"role/OukalaCmdbRead",modules:["EC2","RDS","S3"]},
 fields:["instanceId","tags.Name","privateIpAddress","instanceType","state.name","placement.availabilityZone"],map:[{f:"tags.Name",a:"name",x:"lowercase"},{f:"privateIpAddress",a:"ip_address",x:"as is"},{f:"instanceType",a:"instance_type",x:"as is"}]},
{id:"intune",n:"Microsoft Intune",s:"Intune",kind:"Endpoint management",c:"--u4",tcls:"cmdb_ci_pc_hardware",up:1,every:"Every 4 hours",state:"Healthy",
 desc:"Managed laptops and phones from Microsoft Graph deviceManagement. Brings compliance state and the signed-in user.",conn:{url:"https://graph.microsoft.com/v1.0/deviceManagement",user:"DeviceManagementManagedDevices.Read.All",modules:["Devices","Compliance"]},
 fields:["deviceName","serialNumber","operatingSystem","osVersion","userPrincipalName","complianceState","lastSyncDateTime","model","manufacturer"],
 map:[{f:"deviceName",a:"name",x:"lowercase"},{f:"serialNumber",a:"serial_number",x:"as is"},{f:"operatingSystem",a:"os",x:"as is"},{f:"userPrincipalName",a:"assigned_user",x:"look up person"},{f:"complianceState",a:"compliance_state",x:"capitalize"},{f:"lastSyncDateTime",a:"last_discovered",x:"date"}]},
{id:"entra",n:"Microsoft Entra ID",s:"Entra ID",kind:"Identity",c:"--p2",tcls:"cmdb_ci_appl",up:0,every:"Every 4 hours",state:"Healthy",
 desc:"People, groups and enterprise applications. Feeds ownership (who is a person, a contractor or a managed service provider) and the sign-in apps list.",conn:{url:"https://graph.microsoft.com/v1.0",user:"Directory.Read.All, Application.Read.All",modules:["Users","Groups","Applications"]},
 fields:["id","displayName","appId","servicePrincipalType","accountEnabled","owners","tags"],map:[{f:"displayName",a:"name",x:"as is"},{f:"appId",a:"correlation_id",x:"as is"},{f:"owners[0]",a:"owned_by",x:"look up person"}]},
{id:"vcenter",n:"VMware vCenter",s:"vCenter",kind:"Virtualization",c:"--s3",tcls:"cmdb_ci_esx_server",up:1,every:"Every 30 minutes",state:"Degraded",
 desc:"Hosts, clusters and virtual machines in the Norwalk server room. The last two runs hit a certificate warning and finished with partial data.",conn:{url:"https://vcenter.meridian.local/sdk",user:"svc-oukala@vsphere.local",modules:["Hosts","VMs","Datastores"]},
 fields:["vm.name","vm.moid","host","cluster","power_state","guest.ipAddress","guest.guestFullName","config.hardware.numCPU","config.hardware.memoryMB"],
 map:[{f:"vm.name",a:"name",x:"lowercase"},{f:"guest.ipAddress",a:"ip_address",x:"as is"},{f:"guest.guestFullName",a:"os",x:"as is"},{f:"config.hardware.numCPU",a:"cpu_count",x:"number"},{f:"config.hardware.memoryMB",a:"ram_mb",x:"number"},{f:"cluster",a:"cluster",x:"as is"}]},
{id:"snow",n:"ServiceNow import (Service Graph Connector)",s:"ServiceNow import",kind:"IT service management",c:"--u3",tcls:"cmdb_ci",up:0,every:"Daily at 02:00",state:"Healthy",
 desc:"Read-only copy of the old ServiceNow CMDB while Meridian cuts over. Uses the Service Graph Connector pattern: every row carries its sys_class_name so identification can pick the right class.",conn:{url:"https://meridian.service-now.com/api/now/table/cmdb_ci",user:"oukala.integration",modules:["cmdb_ci","cmdb_rel_ci"]},
 fields:["sys_id","name","sys_class_name","serial_number","ip_address","install_status","owned_by.name","support_group.name","u_environment"],
 map:[{f:"name",a:"name",x:"as is"},{f:"serial_number",a:"serial_number",x:"as is"},{f:"ip_address",a:"ip_address",x:"as is"},{f:"owned_by.name",a:"owned_by",x:"look up person"},{f:"support_group.name",a:"support_group",x:"as is"},{f:"u_environment",a:"environment",x:"capitalize"}]},
{id:"csv",n:"CSV and spreadsheet upload",s:"CSV upload",kind:"File",c:"--e4",tcls:"cmdb_ci",up:0,every:"On demand",state:"Healthy",
 desc:"Bulk load from a spreadsheet: asset registers, vendor lists, sites. Columns are mapped once and saved as a template.",conn:{url:"Upload in the browser",user:"Any administrator",modules:["Columns"]},
 fields:["Name","Serial","IP","Owner","Class","Environment","Rack"],map:[{f:"Name",a:"name",x:"as is"},{f:"Serial",a:"serial_number",x:"as is"},{f:"IP",a:"ip_address",x:"as is"},{f:"Owner",a:"owned_by",x:"look up person"},{f:"Environment",a:"environment",x:"capitalize"}]},
{id:"manual",n:"Manual entry",s:"Manual",kind:"People",c:"--muted",tcls:"cmdb_ci",up:0,every:"Never (people edit directly)",state:"Healthy",desc:"Records a person typed in. Trusted for ownership and business fields, never for technical facts a tool can read.",conn:{url:"Not applicable",user:"Not applicable",modules:[]},fields:[],map:[]}];
const SRCM={};SRC.forEach(s=>SRCM[s.id]=s);
const srcN=id=>(SRCM[id]||{s:"Unknown"}).s;
const srcCol=id=>(SRCM[id]||{c:"--muted"}).c;
const MON_SRC=["orion","nagios","azure","vcenter","intune","aws"];
const hs=s=>{let h=0;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))>>>0;return h};
const pk=(r,a)=>a[Math.floor(r()*a.length)];
const dayStr=n=>{const d=new Date(Date.UTC(2026,9,6)-n*864e5);return d.toISOString().slice(0,10)};
const PEOPLEN=()=>DIR.filter(d=>d.kind==="human"&&!d.generated).map(d=>d.name);
const SVNAME={"Codification Portal":"svc_portal","Search":"svc_search","Contract Repository":"svc_cr","Lease subledger":"svc_erp","Identity":"svc_id","Email and collaboration":"svc_m365","Data platform":"svc_data","Network and VPN":"svc_net","Endpoint":"svc_end","Integration hub":"svc_int"};
const svId=x=>{if(!x)return"";if(SVCREG.some(s=>s.id===x))return x;const s=SVCREG.find(s=>s.n===x);return s?s.id:SVNAME[x]||""};
const svName=x=>{const s=SVCREG.find(s=>s.id===x);return s?s.n:""};
/* service wrapper nodes: business services from SVCREG behave like CIs in the graph */
const SVN={};
function svnode(id){let n=SVN[id];const s=SVCREG.find(x=>x.id===id);if(!s)return null;if(!n||n.name!==s.n){n=SVN[id]={id:s.id,name:s.n,class:"Business service",cls:"cmdb_ci_service_business",svc:s.id,isSvc:1,tier:s.tier,owner:s.owner,uptime:s.avail,env:"Production",status:"Operational",crit:s.tier==="Tier 1"?CRIT[0]:CRIT[1],life:"Operational",src:"manual",seen:0,grp:"Service desk",usrc:"none"}}n.uptime=s.avail;return n}

/* ================= CI ENRICHMENT: every CIREG record gets a CMDB class, attributes, source, lifecycle ================= */
const GV={manufacturer:r=>pk(r,["Dell","HPE","Lenovo","Cisco","Palo Alto","NetApp","Juniper","Microsoft"]),model_id:r=>pk(r,["PowerEdge R650","ProLiant DL380 Gen10","ThinkSystem SR650","Catalyst 9300","PA-440","FAS2750"]),
 os:r=>pk(r,["Windows Server 2022","Windows Server 2019","Ubuntu 22.04 LTS","Red Hat Enterprise Linux 9"]),os_version:r=>pk(r,["21H2","10.0.20348","22.04.3","9.3"]),cpu_count:r=>pk(r,[2,4,8,16,32]),ram_mb:r=>pk(r,[8192,16384,32768,65536,131072]),
 disk_space_gb:r=>pk(r,[128,256,512,1024,2048]),mac_address:r=>"00:50:56:"+[1,2,3].map(()=>Math.floor(r()*256).toString(16).padStart(2,"0")).join(":"),serial_number:r=>"SN"+Math.floor(r()*9e8+1e8),
 firmware_version:r=>pk(r,["17.9.4","10.2.7","9.1.3","15.2(7)E8"]),port_count:r=>pk(r,[24,48,8,12]),version:r=>pk(r,["2.4.1","5.0.3","2022.1","11.2","4.18"]),tech_stack:r=>pk(r,[".NET 8 and SQL Server","Java 17 and PostgreSQL","Python and Azure Functions","Node.js and Cosmos DB"]),
 url:r=>"https://"+pk(r,["portal","editor","search","api","contracts"])+".meridian.example",size_gb:r=>pk(r,[80,240,512,1200,2400]),backup_policy:r=>pk(r,["Daily full, 15 min log","Weekly full, daily differential","Azure geo-redundant, 35 days"]),
 cloud_provider:r=>"Azure",region:r=>pk(r,["East US 2","Central US"]),subscription_id:r=>"sub-"+Math.floor(r()*9e5+1e5),resource_group:r=>"rg-"+pk(r,["prod","platform","data","edge"]),instance_type:r=>pk(r,["Standard_D4s_v5","Standard_D8s_v5","Standard_B2ms","Standard_E8s_v5"]),
 vcpu:r=>pk(r,[2,4,8,16]),ram_gb:r=>pk(r,[8,16,32,64]),image:r=>"acr.meridian.example/"+pk(r,["taxonomy-api","indexer","reader"])+":"+pk(r,["1.8","2.1","3.0"]),cluster:r=>pk(r,["aks-prod-eus2","aks-data","esx-cluster-a"]),
 service_type:r=>pk(r,["Azure SQL","Blob storage","Front Door","Key Vault","Service Bus","App Service"]),sku:r=>pk(r,["Standard","Premium","P1v3","GP_Gen5_4"]),endpoint:r=>"https://"+pk(r,["a","b","c"])+Math.floor(r()*90+10)+".azure.example",
 capacity_gb:r=>pk(r,[1024,4096,10240,20480]),used_gb:r=>pk(r,[300,1500,4200,8800]),runtime:r=>pk(r,[".NET 8","Node 20","Python 3.12","Java 17"]),instance_name:r=>"MSSQLSERVER",edition:r=>pk(r,["Standard","Enterprise","Managed instance"]),collation:r=>"SQL_Latin1_General_CP1_CI_AS",
 hypervisor:r=>"VMware ESXi",kernel_version:r=>pk(r,["5.15.0-91","5.14.0-362","6.1.0-13"]),domain:r=>"meridian.local",ad_site:r=>"Norwalk-HQ",tenant_id:r=>"a1f2e3d4-"+Math.floor(r()*9e3+1e3),
 query_filter:r=>"class=Server AND environment=Production AND criticality<=2",row_pos:r=>pk(r,["A","B","C"]),power_kw:r=>pk(r,[12,20,40]),address:r=>"1 Main Street, Norwalk, CT",country:r=>"United States",time_zone:r=>"America/New_York",tls_version:r=>"1.2"};
const PF=(a,t,r)=>{if(a.opts&&a.t==="enum")return pk(r,a.opts);if(GV[a.k])return GV[a.k](r);switch(a.t){case"int":return Math.floor(r()*60+2);case"bool":return r()<.6;case"ip":return"10."+Math.floor(r()*30)+"."+Math.floor(r()*250)+"."+Math.floor(r()*250+2);case"date":return dayStr(Math.floor(r()*700));case"percent":return +(99+r()*.99).toFixed(2);case"money":return Math.round(r()*40000);case"list":return["costcenter:IT","env:"+pk(r,["prod","test"])];case"ref":return a.ref==="person"?pk(r,PEOPLEN()):a.ref==="group"?pk(r,GROUPS):a.ref==="site"?"Norwalk HQ":a.ref==="vendor"?pk(r,["Lumen","Northwind Managed Services","Microsoft"]):a.ref==="asset"?"AST-"+Math.floor(r()*9e4+1e4):a.ref==="cmdb_ci_rack"?"Rack NOR-R0"+(1+Math.floor(r()*2)):"Not set";default:return a.label+" "+Math.floor(r()*90+10)}};
function clsFor(c){if(c.cls&&CLM[c.cls])return c.cls;const lab=c.class,n=(c.name||"").toLowerCase();let id=BYLABEL()[lab]||"cmdb_ci";
 if(id==="cmdb_ci_netgear"){if(/fire|waf|fw/.test(n))id="cmdb_ci_firewall";else if(/switch|^sw-|^net-/.test(n))id="cmdb_ci_ip_switch";else if(/vpn|router|gateway/.test(n)||(c.gen&&hs(c.id)%7===0))id="cmdb_ci_ip_router";else if(c.gen&&hs(c.id)%5<2)id="cmdb_ci_ip_switch";else if(c.gen&&hs(c.id)%5===2)id="cmdb_ci_firewall"}
 else if(id==="cmdb_ci_db_instance"&&(/sql|synapse/.test(n)||(c.gen&&hs(c.id)%3===0)))id="cmdb_ci_db_mssql_instance";
 else if(id==="cmdb_ci_server"){const h=hs(c.id)%100;id=/esx|host/.test(n)?"cmdb_ci_esx_server":/win|erp|ad-/.test(n)?"cmdb_ci_win_server":h<30?"cmdb_ci_esx_server":h<62?"cmdb_ci_linux_server":"cmdb_ci_win_server"}
 else if(id==="cmdb_ci_appl"){if(/gateway|apim/.test(n))id="cmdb_ci_api_gateway";else if(/bus|queue/.test(n))id="cmdb_ci_msg_broker";else if(c.gen&&hs(c.id)%11===0)id="cmdb_ci_web_server";else if(c.gen&&hs(c.id)%4===0)id="cmdb_ci_business_app"}
 else if(id==="cmdb_ci_cloud_service"&&/function|logic/.test(n))id="cmdb_ci_cloud_function";
 else if(/laptop|^lt-|^dev-/.test(n)&&lab!=="Application")id="cmdb_ci_pc_hardware";
 return id}
function grpFor(c,r){const f=c.cls;if(isA(f,"cmdb_ci_pc_hardware"))return"Service desk";if(isA(f,"cmdb_ci_netgear")||isA(f,"cmdb_ci_site"))return"Ops team";if(isA(f,"cmdb_ci_db_instance")||c.svc==="svc_data")return"Data team";if(c.svc==="svc_id")return"Security";if(c.svc==="svc_search"&&/lumen|indexer/.test(c.name))return"Lumen (vendor)";if(c.svc==="svc_erp"||c.svc==="svc_fin")return"Finance";if(c.svc==="svc_end"||c.svc==="svc_desk")return"Service desk";return r()<.55?"Platform team":"Ops team"}
function srcFor(c,r){const f=c.cls,x=r();if(c.src)return c.src;if(isA(f,"cmdb_ci_pc_hardware"))return"intune";if(f==="cmdb_ci_esx_server")return"vcenter";if(isA(f,"cmdb_ci_vm_instance"))return x<.5?"azure":x<.75?"orion":"vcenter";
 if(isA(f,"cmdb_ci_cloud"))return"azure";if(isA(f,"cmdb_ci_computer")||isA(f,"cmdb_ci_netgear")||isA(f,"cmdb_ci_storage_device"))return x<.85?"orion":"snow";if(isA(f,"cmdb_ci_db_instance"))return x<.55?"orion":"azure";
 if(isA(f,"cmdb_ci_software"))return x<.4?"orion":x<.8?"manual":"snow";return x<.7?"manual":"csv"}
const FAM={hw:"cmdb_ci_hardware",sw:"cmdb_ci_software",cl:"cmdb_ci_cloud"};
const needsSvc=c=>(isA(c.cls,"cmdb_ci_hardware")||isA(c.cls,"cmdb_ci_software")||isA(c.cls,"cmdb_ci_cloud"))&&c.cls!=="cmdb_ci_cloud_sub"&&!isA(c.cls,"cmdb_ci_pc_hardware");
const upApplies=c=>!c.isSvc&&(isA(c.cls,"cmdb_ci_hardware")||isA(c.cls,"cmdb_ci_software")||isA(c.cls,"cmdb_ci_cloud"))&&c.cls!=="cmdb_ci_cloud_sub";
const discApplies=c=>!c.isSvc&&(isA(c.cls,"cmdb_ci_hardware")||isA(c.cls,"cmdb_ci_software")||isA(c.cls,"cmdb_ci_cloud"));
function prepCI(c){if(c._p===1&&c.cls&&CLM[c.cls])return c;const r=RNG("cmdb"+c.id),gen=!!c.gen;c.cls=clsFor(c);
 if(c.life===undefined)c.life=c.status==="Retired"?"Retired":c.lifeSeed||"Operational";if(c.seen===undefined)c.seen=gen?(r()<.045?61+Math.floor(r()*120):r()<.5?0:Math.floor(r()*6)):(c.disc==="Oct 6"?0:Math.floor(r()*3));
 if(c.grp===undefined){const nb=r();c.grp=gen&&nb<.045?"":grpFor(c,r)}if(c.src===undefined)c.src=srcFor(c,r);
 if(gen){if(r()<.055)c.owner="";if(r()<.03)c.crit="";if(!c.ip)c.ip="10."+(10+Math.floor(r()*20))+"."+Math.floor(r()*250)+"."+(2+Math.floor(r()*250))}
 if(c.first===undefined)c.first=dayStr(30+Math.floor(r()*620));
 c.cloudish=isA(c.cls,"cmdb_ci_cloud")||c.src==="azure";
 c.usrc=upApplies(c)?(MON_SRC.includes(c.src)?c.src:(r()<(gen?.5:.7)?"orion":"none")):"none";
 const a=c.a=c.a||{};attrsOf(c.cls).forEach(at=>{if(["name","environment","operational_status","lifecycle_stage","owned_by","support_group","business_criticality","discovery_source","last_discovered"].includes(at.k)||a[at.k]!==undefined)return;
  const miss=at.req?(gen?.09:.05):at.rec?.2:.35;if(r()<miss)return;if(at.k==="ip_address"){a.ip_address=c.ip;return}a[at.k]=PF(at,c,r)});
 if(c.cls==="cmdb_ci_server"||isA(c.cls,"cmdb_ci_server")){a.is_virtual=false}
 if(c.isSvc===undefined)c.isSvc=0;c._p=1;return c}
function prepAll(){CIREG.forEach(c=>{if(c._p!==1||!c.cls)prepCI(c)})}
function getV(c,k){switch(k){case"name":return c.name;case"environment":return c.env;case"operational_status":return c.status;case"lifecycle_stage":return c.life;case"owned_by":return c.owner;case"support_group":return c.grp;case"business_criticality":return c.crit;case"discovery_source":return c.src?srcN(c.src):"";case"last_discovered":return c.seen==null?"":dayStr(c.seen);case"ip_address":return c.ip||(c.a&&c.a.ip_address);default:return c.a?c.a[k]:undefined}}
function setV(c,k,v){switch(k){case"name":c.name=v;break;case"environment":c.env=v;break;case"operational_status":c.status=v;break;case"lifecycle_stage":c.life=v;break;case"owned_by":c.owner=v;break;case"support_group":c.grp=v;break;case"business_criticality":c.crit=v;break;case"ip_address":c.ip=v;(c.a=c.a||{}).ip_address=v;break;case"discovery_source":case"last_discovered":break;default:(c.a=c.a||{})[k]=v}}
const blank=v=>v===undefined||v===null||v===""||(Array.isArray(v)&&!v.length);
const ciOf=id=>{const g=G_();return g.cim.get(id)||svnode(id)};
const nd=ciOf;
function histOf(c){if(c._hist)return c._hist;const r=RNG("up"+c.id),u=+c.uptime||99.5,def=Math.max(0,(100-u)*30),k=def<.15?0:def<1.2?1:def<3?2:3,a=Array(30).fill(100);if(k){const days=new Set();while(days.size<k)days.add(Math.floor(r()*29));const dd=[...days];dd.forEach((d,i)=>{a[d]=+(100-def*(i===0?(k===1?1:.6):.4/(k-1||1))).toFixed(2)})}c._hist=a;return a}
/* ================= demo additions: on-premises estate, db-prod-02, capabilities, vendor, duplicates, stale and orphan examples ================= */
const XC=(id,name,cls,svc,o)=>({id,name,class:(CLM[cls]||{label:"Configuration item"}).label,cls,svc:svc||"",env:"Production",status:"Operational",owner:"",crit:CRIT[1],uptime:+(99.4+((hs(id)%60)/100)).toFixed(2),ip:"10.20."+(hs(id)%200)+"."+(hs(id+"x")%200+2),disc:"Oct 6",x:1,...(o||{})});
const XDEMO=[
 XC("ci_x_site","Norwalk HQ","cmdb_ci_site","",{owner:"Sam Patel",grp:"Ops team",src:"manual",crit:CRIT[1]}),XC("ci_x_dc","Norwalk server room","cmdb_ci_datacenter","",{owner:"Sam Patel",grp:"Ops team",src:"manual"}),
 XC("ci_x_rk1","Rack NOR-R01","cmdb_ci_rack","",{owner:"Sam Patel",grp:"Ops team",src:"manual"}),XC("ci_x_rk2","Rack NOR-R02","cmdb_ci_rack","",{owner:"Sam Patel",grp:"Ops team",src:"manual"}),
 XC("ci_x_esx1","esx-nor-01","cmdb_ci_esx_server","svc_erp",{owner:"Sam Patel",grp:"Ops team",src:"vcenter",crit:CRIT[0],class:"Server"}),XC("ci_x_esx2","esx-nor-02","cmdb_ci_esx_server","svc_erp",{owner:"Sam Patel",grp:"Ops team",src:"vcenter",crit:CRIT[0],class:"Server"}),
 XC("ci_x_sw1","sw-core-nor-01","cmdb_ci_ip_switch","svc_net",{owner:"Sam Patel",grp:"Ops team",src:"orion",crit:CRIT[0],class:"Network device"}),XC("ci_x_sw2","sw-core-nor-02","cmdb_ci_ip_switch","svc_net",{owner:"Sam Patel",grp:"Ops team",src:"orion",crit:CRIT[0],class:"Network device",uptime:99.71}),
 XC("ci_x_nas","nas-nor-01","cmdb_ci_storage_device","svc_erp",{owner:"Jordan Lee",grp:"Ops team",src:"orion",class:"Storage"}),
 XC("ci_x_vmsql","vm-sql-prod-02","cmdb_ci_vm_instance","svc_data",{owner:"Dev Rao",grp:"Data team",src:"azure",crit:CRIT[0],class:"Virtual machine"}),
 XC("ci_x_db2","db-prod-02","cmdb_ci_db_mssql_instance","svc_data",{owner:"Dev Rao",grp:"Data team",src:"orion",crit:CRIT[0],class:"Database",uptime:99.61,short:"Shared reference data and taxonomy SQL Server instance"}),
 XC("ci_x_ctr","ctr-taxonomy-api","cmdb_ci_container","svc_data",{owner:"Dev Rao",grp:"Data team",src:"azure",class:"Container"}),
 XC("ci_x_fn","fn-index-trigger","cmdb_ci_cloud_function","svc_search",{owner:"Marco Ellis",grp:"Lumen (vendor)",src:"azure",class:"Cloud resource"}),
 XC("ci_x_lt1","lt-editor-0142","cmdb_ci_pc_hardware","svc_end",{owner:"Chief Editor",grp:"Service desk",src:"intune",crit:CRIT[2],uptime:99.9}),XC("ci_x_lt2","lt-finance-0031","cmdb_ci_pc_hardware","svc_end",{owner:"Avery Chen",grp:"Service desk",src:"intune",crit:CRIT[2],uptime:99.8}),XC("ci_x_lt3","lt-exec-0007","cmdb_ci_pc_hardware","svc_end",{owner:"Omar Hamid",grp:"Service desk",src:"intune",crit:CRIT[1],uptime:99.95}),
 XC("ci_x_cap1","Standards authoring and publishing","cmdb_ci_business_capability","",{owner:"Maya Ortiz",grp:"Architecture",src:"manual"}),XC("ci_x_cap2","Licensing and subscriptions","cmdb_ci_business_capability","",{owner:"Maya Ortiz",grp:"Architecture",src:"manual"}),XC("ci_x_cap3","Financial management","cmdb_ci_business_capability","",{owner:"Avery Chen",grp:"Architecture",src:"manual"}),
 XC("ci_x_ba1","Codification Platform (business application)","cmdb_ci_business_app","svc_cod",{owner:"Priya Shah",grp:"Platform team",src:"manual",crit:CRIT[0],class:"Application"}),XC("ci_x_ba2","Codification Portal (business application)","cmdb_ci_business_app","svc_portal",{owner:"Tom Becker",grp:"Platform team",src:"manual",crit:CRIT[0],class:"Application"}),XC("ci_x_ba3","Lease subledger (business application)","cmdb_ci_business_app","svc_erp",{owner:"Avery Chen",grp:"Finance",src:"manual",class:"Application"}),
 XC("ci_x_info1","Published standards content","cmdb_ci_information_object","",{owner:"Chief Editor",grp:"Architecture",src:"manual"}),
 XC("ci_x_dyn1","Tier 1 production servers","cmdb_ci_query_based_service","",{owner:"Sam Patel",grp:"Ops team",src:"manual"}),
 XC("ci_x_ven1","Lumen Technologies","core_company","",{owner:"Marco Ellis",grp:"Architecture",src:"manual",class:"Vendor"}),XC("ci_x_ctr1","Lumen managed search contract LMN-2024-118","ast_contract","",{owner:"Maya Ortiz",grp:"Architecture",src:"manual"}),
 XC("ci_x_ftp","srv-legacy-ftp01","cmdb_ci_win_server","",{owner:"",grp:"",src:"orion",crit:"",life:"Retiring",seen:94,class:"Server",uptime:97.4,status:"Degraded"}),XC("ci_x_lic","lic-test-vm02","cmdb_ci_vm_instance","",{owner:"",env:"Test",src:"azure",crit:CRIT[2],seen:71,class:"Virtual machine",uptime:98.2}),
 XC("ci_x_dup1","lumen-indexer-01.meridian.local","cmdb_ci_vm_instance","svc_search",{owner:"",src:"vcenter",grp:"Lumen (vendor)",class:"Virtual machine",ip:"",dupOfId:"ci_sea0"}),XC("ci_x_dup2","CODIF-APP-02","cmdb_ci_vm_instance","svc_cod",{owner:"Priya Shah",src:"csv",grp:"Platform team",class:"Virtual machine",dupOfId:"ci_cod1"}),
 XC("ci_x_nu1","vm-new-lic-03","cmdb_ci_vm_instance","",{owner:"",src:"azure",crit:"",grp:"",class:"Virtual machine",seen:0,uptime:99.9})];
const XEDGE=[["ci_x_rk1","ci_x_dc","located in"],["ci_x_rk2","ci_x_dc","located in"],["ci_x_dc","ci_x_site","located in"],["ci_x_esx1","ci_x_rk1","hosted on"],["ci_x_esx2","ci_x_rk2","hosted on"],["ci_x_sw1","ci_x_rk1","hosted on"],["ci_x_sw2","ci_x_rk2","hosted on"],["ci_x_nas","ci_x_rk1","hosted on"],
 ["ci_x_esx1","ci_x_sw1","connects to"],["ci_x_esx2","ci_x_sw2","connects to"],["ci_x_sw1","ci_x_sw2","connects to"],["ci_x_sw1","ci_fw","connects to"],["ci_erp0","ci_x_esx1","runs on"],["ci_erp1","ci_x_esx2","runs on"],["ci_erp1","ci_x_nas","uses"],
 ["ci_x_vmsql","ci_az","hosted on"],["ci_x_db2","ci_x_vmsql","runs on"],["ci_cod4","ci_x_db2","uses"],["ci_sea4","ci_x_db2","depends on"],["ci_por4","ci_x_db2","uses"],["ci_dat3","ci_x_db2","uses"],
 ["ci_x_ctr","ci_dat3","runs on"],["ci_x_fn","ci_az","hosted on"],["ci_sea4","ci_x_fn","uses"],["ci_x_lt1","ci_end0","uses"],["ci_x_lt2","ci_end0","uses"],["ci_x_lt3","ci_end0","uses"],
 ["ci_x_cap1","ci_x_ba1","supported by"],["ci_x_cap1","ci_x_ba2","supported by"],["ci_x_cap2","ci_x_ba2","supported by"],["ci_x_cap3","ci_x_ba3","supported by"],["ci_x_ba1","ci_x_info1","uses"],["ci_x_dyn1","ci_x_esx1","contained by"],
 ["ci_sea0","ci_x_ctr1","supported by"],["ci_sea1","ci_x_ctr1","supported by"],["ci_x_ctr1","ci_x_ven1","provided by"],["ci_x_dup1","ci_az","hosted on"],["ci_x_dup2","ci_az","hosted on"]];
/* CSDM layer: for each service an application service, a technology management service and its offerings */
function csdmLayer(){const add=[],edges=[];SVCREG.forEach(s=>{const sid=s.id.replace("svc_","");const as="as_"+sid,ts="ts_"+sid;
 if(!CIREG.some(c=>c.id===as)){add.push(XC(as,s.n+" (application service)","cmdb_ci_service_auto",s.id,{owner:s.owner,grp:"Platform team",src:"manual",crit:s.tier==="Tier 1"?CRIT[0]:CRIT[1],uptime:s.avail,class:"Application service",isSvc:0,svcLayer:1}));
  add.push(XC(ts,s.n+" hosting (technology service)","cmdb_ci_service_technical",s.id,{owner:"Sam Patel",grp:"Ops team",src:"manual",crit:s.tier==="Tier 1"?CRIT[0]:CRIT[1],uptime:s.avail,class:"Technology management service",svcLayer:1}));
  s.offerings.forEach((o,i)=>add.push(XC("so_"+sid+"_"+i,o+" ("+s.n+")","service_offering",s.id,{owner:s.owner,grp:"Service desk",src:"manual",crit:CRIT[1],uptime:s.avail,class:"Service offering",svcLayer:1})));
  s.offerings.forEach((o,i)=>{edges.push([s.id,"so_"+sid+"_"+i,"depends on"],["so_"+sid+"_"+i,as,"depends on"])});edges.push([as,ts,"runs on"])}});return{add,edges}}
function topApps(){const byS={};CIREG.forEach(c=>{if(c.svc&&(c.cls==="cmdb_ci_appl"||c.cls==="cmdb_ci_api_gateway"||c.cls==="cmdb_ci_web_server"||c.cls==="cmdb_ci_msg_broker"||c.cls==="cmdb_ci_business_app"))(byS[c.svc]=byS[c.svc]||[]).push(c)});return byS}
let demoDone=false;
function addDemo(){if(demoDone)return;demoDone=true;XDEMO.forEach(c=>{if(!CIREG.some(x=>x.id===c.id))CIREG.push(c)});XEDGE.forEach(e=>{if(!CIEDGE.some(x=>x[0]===e[0]&&x[1]===e[1]))CIEDGE.push(e)});
 const L=csdmLayer();L.add.forEach(c=>CIREG.push(c));L.edges.forEach(e=>{if(!CIEDGE.some(x=>x[0]===e[0]&&x[1]===e[1]))CIEDGE.push(e)});
 const tops=topApps(),have=new Set(CIEDGE.map(e=>e[0]+">"+e[1]));
 SVCREG.forEach(s=>{const sid=s.id.replace("svc_",""),as="as_"+sid,ts="ts_"+sid;(tops[s.id]||[]).forEach(a=>{if(a.x&&a.cls==="cmdb_ci_business_app")return;const k=as+">"+a.id;if(!have.has(k)){CIEDGE.push([as,a.id,"depends on"]);have.add(k)}});
  CIREG.filter(c=>c.svc===s.id&&!c.x&&(isA(clsFor(c),"cmdb_ci_computer")||isA(clsFor(c),"cmdb_ci_netgear")||isA(clsFor(c),"cmdb_ci_storage_device")||isA(clsFor(c),"cmdb_ci_vm_instance"))).forEach(c=>{const k=ts+">"+c.id;if(!have.has(k)){CIEDGE.push([ts,c.id,"depends on"]);have.add(k)}})});
 ["ba1:ci_cod4:as_cod","ba2:ci_por4:as_portal","ba3:ci_erp2:as_erp"].forEach(x=>{const [b,app,as]=x.split(":");CIEDGE.push(["ci_x_"+b,as,"depends on"])});
 XDEMO.forEach(c=>{if(c.dupOfId&&!c.ip){const o=CIREG.find(x=>x.id===c.dupOfId);if(o)c.ip=o.ip}})}
/* ---------- enterprise scale: 2,600 generated CIs get a structure (apps on VMs on hosts in racks in datacenters) ---------- */
let SCALEIDS=null;
function addScale(){if(SCALEIDS)return;const src=SCALE.cis(),r=RNG("cmdbscale"),ids=new Set();const add=c=>{CIREG.push(c);ids.add(c.id)};
 const gen=src.map(c=>({...c,svc:svId(c.svc)||"svc_net",gen:1,status:c.status}));gen.forEach(c=>{c.ip="10."+(10+Math.floor(r()*20))+"."+Math.floor(r()*250)+"."+(2+Math.floor(r()*250))});
 /* sites, datacenters, racks */
 const sites=[["Norwalk HQ","ci_x_site"],["Ashburn colocation","ci_g_s2"],["Dallas DR site","ci_g_s3"]];const dcs=[];
 [["Ashburn DC-1","ci_g_dc1","ci_g_s2"],["Dallas DC-2","ci_g_dc2","ci_g_s3"],["Ashburn DC-3","ci_g_dc3","ci_g_s2"]].forEach(d=>dcs.push(d[1]));
 add(XC("ci_g_s2","Ashburn colocation","cmdb_ci_site","",{gen:1,owner:"Sam Patel",grp:"Ops team",src:"manual"}));add(XC("ci_g_s3","Dallas DR site","cmdb_ci_site","",{gen:1,owner:"Sam Patel",grp:"Ops team",src:"manual"}));
 dcs.forEach((id,i)=>{add(XC(id,["Ashburn DC-1","Dallas DC-2","Ashburn DC-3"][i],"cmdb_ci_datacenter","",{gen:1,owner:"Sam Patel",grp:"Ops team",src:"manual"}));CIEDGE.push([id,["ci_g_s2","ci_g_s3","ci_g_s2"][i],"located in"])});
 const racks=[];for(let i=0;i<48;i++){const id="ci_g_rk"+i;racks.push(id);add(XC(id,"Rack "+["ASH","DAL","ASH"][i%3]+"-R"+String(i+1).padStart(2,"0"),"cmdb_ci_rack","",{gen:1,owner:"Sam Patel",grp:"Ops team",src:"manual"}));CIEDGE.push([id,dcs[i%3],"located in"])}
 gen.forEach(c=>{prepCI(c);add(c)});
 const by={};gen.forEach(c=>{const k=c.svc;(by[k]=by[k]||{app:[],db:[],vm:[],srv:[],esx:[],ctr:[],sto:[],lb:[],net:[],cloud:[],fn:[]});const b=by[k],f=c.cls;
  if(f==="cmdb_ci_esx_server")b.esx.push(c);else if(isA(f,"cmdb_ci_server"))b.srv.push(c);else if(isA(f,"cmdb_ci_vm_instance"))b.vm.push(c);else if(isA(f,"cmdb_ci_db_instance"))b.db.push(c);else if(isA(f,"cmdb_ci_appl")||isA(f,"cmdb_ci_appl_middleware"))b.app.push(c);else if(f==="cmdb_ci_container")b.ctr.push(c);else if(isA(f,"cmdb_ci_storage_device"))b.sto.push(c);else if(f==="cmdb_ci_lb")b.lb.push(c);else if(isA(f,"cmdb_ci_netgear"))b.net.push(c);else b.cloud.push(c)});
 const allEsx=gen.filter(c=>c.cls==="cmdb_ci_esx_server"),allNet=gen.filter(c=>isA(c.cls,"cmdb_ci_netgear")),skip=()=>r()<.03;const E=(a,b,t)=>{if(a&&b&&a!==b)CIEDGE.push([a.id||a,b.id||b,t])};
 const one=a=>a.length?a[Math.floor(r()*a.length)]:null;
 Object.keys(by).forEach(k=>{const b=by[k],hosts=b.esx.concat(b.srv),comp=b.vm.concat(b.srv);
  b.esx.forEach(h=>{E(h,one(racks),"hosted on");E(h,one(allNet),"connects to")});b.srv.forEach(h=>{if(!skip())E(h,one(racks),"hosted on");if(r()<.5)E(h,one(allNet),"connects to")});b.net.forEach(n=>{if(!skip())E(n,one(racks),"hosted on")});
  b.vm.forEach(v=>{if(skip())return;if(r()<.55&&(b.esx.length||allEsx.length))E(v,one(b.esx.length?b.esx:allEsx),"hosted on");else E(v,"ci_az","hosted on")});
  b.ctr.forEach(c=>{const v=one(b.vm);if(v&&!skip())E(c,v,"runs on")});
  b.db.forEach(d=>{const h=one(comp);if(h&&!skip())E(d,h,"runs on");if(r()<.5){const s=one(b.sto);if(s)E(d,s,"uses")}});
  b.app.forEach(a=>{if(skip())return;const n=1+(r()<.4?1:0);for(let i=0;i<n;i++){const h=one(comp.concat(b.ctr));if(h)E(a,h,"runs on")}if(r()<.8){const d=one(b.db);if(d)E(a,d,"depends on")}if(r()<.35){const l=one(b.lb);if(l)E(a,l,"runs behind")}if(r()<.3){const o=one(b.app);if(o&&o!==a)E(a,o,"uses")}});
  b.cloud.forEach(c=>{if(!skip())E(c,"ci_az","hosted on")});
  const sid=k.replace("svc_",""),as="as_"+sid,ts="ts_"+sid;b.app.forEach(a=>E(as,a,"depends on"));hosts.concat(b.sto,b.net).forEach(h=>E(ts,h,"depends on"))});
 /* duplicates: the same machine discovered a second time by another source */
 for(let i=0;i<18;i++){const o=gen[(i*131+17)%gen.length];if(!isA(o.cls,"cmdb_ci_computer")&&!isA(o.cls,"cmdb_ci_vm_instance"))continue;const id="ci_g_dup"+i,d=XC(id,o.name+".meridian.local",o.cls,o.svc,{gen:1,src:o.src==="orion"?"vcenter":"orion",owner:"",grp:"",class:o.class,ip:o.ip,dupOfId:o.id,uptime:o.uptime,crit:""});prepCI(d);add(d)}
 SCALEIDS=ids}
function dropScale(){if(!SCALEIDS)return;const ids=SCALEIDS;for(let i=CIREG.length-1;i>=0;i--)if(ids.has(CIREG[i].id))CIREG.splice(i,1);for(let i=CIEDGE.length-1;i>=0;i--)if(ids.has(CIEDGE[i][0])||ids.has(CIEDGE[i][1]))CIEDGE.splice(i,1);SCALEIDS=null;if(I.sel&&ids.has(I.sel))I.sel=null;bump()}
function bump(){I.rev++;HB.key=null}
function ensure(){addDemo();if(SCALE.on&&!SCALEIDS){addScale();bump()}else if(!SCALE.on&&SCALEIDS)dropScale();prepAll()}
const _set=SCALE.set;SCALE.set=function(on){try{if(on){addDemo();if(!SCALEIDS){addScale();bump()}}else dropScale()}catch(e){console.error("itom scale",e)}return _set.call(this,on)};
