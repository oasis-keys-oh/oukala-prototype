/* ===== mod_r32_tenant: tenants. Each demo scenario is a tenant (a customer) with its own journeys, workflows and org chart.
   Adds a tenant switcher to the side menu. All organizations, people and figures are fictional samples.
   One tenant model (DC-31): TENANT.switch goes through SCN.set, which goes through DATA.setTenant; the active tenant is always on screen (R17).
   The switcher offers only tenants the signed-in person is a member of (IDENT, CL-63). Which screens follow the tenant: DATA.screens().
   Tenant isolation in this prototype is simulated (R52). ===== */
(function(){
const W=window,D=document;if(!W.SCN||!SCN.list||!SCN.set)return;
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const T=W.TENANT={};
T.info={
 core:{org:"Meridian Standards Foundation",short:"Meridian Standards",kind:"A standards publisher",lead:{n:"Catherine Doyle",t:"Chief executive"}},
 health:{org:"Larkspur Health System",short:"Larkspur Health",kind:"A regional health system",lead:{n:"Grace Oduya",t:"Chief operating officer"}},
 mining:{org:"Redstone Resources",short:"Redstone Resources",kind:"A mining company with operational technology",lead:{n:"Jonas Whitfield",t:"Chief operating officer"}},
 storage:{org:"Corvane Data Protection",short:"Corvane Data",kind:"A storage and backup vendor",lead:{n:"Hannah Brooks",t:"Chief operating officer"}}};
/* the org as the journeys see it, grouped under functions; leaders are fictional */
T.orgs={
 health:{fns:[
  {n:"Access and patient experience",lead:{n:"Priya Venkataraman",t:"Chief patient experience officer"},teams:["Digital front door","Nurse advice line","Marketing and access","Access center","Patient access","Patient experience","Referral management"]},
  {n:"Clinical operations",lead:{n:"Dr. Marcus Hale",t:"Chief medical officer"},teams:["Clinical operations","Ambulatory operations","Primary care","Care coordination","Care management","Case management","Diagnostics","Lab and imaging","Pharmacy","Quality","Clinical documentation"]},
  {n:"Hospital operations",lead:{n:"Tomasz Brandt",t:"VP, hospital operations"},teams:["Emergency department","Surgery","Sterile processing","Inpatient nursing","Hospital medicine","Patient flow","Transport","Women's health","Labor and delivery","Postpartum","Nursing operations","Supply chain"]},
  {n:"Revenue and finance",lead:{n:"Helena Marsh",t:"Chief financial officer"},teams:["Revenue cycle","Patient financial services","Payer contracting","Payer operations","Coding"]}]},
 mining:{fns:[
  {n:"Mining operations",lead:{n:"Rafael Moreno",t:"VP, mining operations"},teams:["Mine planning","Drill and blast","Operations","Processing","Logistics"]},
  {n:"Reliability and maintenance",lead:{n:"Ingrid Solberg",t:"Head of reliability"},teams:["Reliability","Maintenance planning","Maintenance","Supply"]},
  {n:"Safety, community and compliance",lead:{n:"Dr. Kwame Asante",t:"Chief safety officer"},teams:["HSE","Community and compliance"]},
  {n:"Commercial and finance",lead:{n:"Mei-Ling Zhou",t:"Chief financial officer"},teams:["Commercial","Finance"]}]},
 storage:{fns:[
  {n:"Customer operations",lead:{n:"Aisha Rahman",t:"VP, customer operations"},teams:["Customer success","Support","Account management","Services","Field services","Field service"]},
  {n:"Sales and order management",lead:{n:"Diego Alvarez",t:"VP, sales operations"},teams:["Pre-sales","Presales","Sales operations","Order management"]},
  {n:"Engineering and supply",lead:{n:"Sofia Lindqvist",t:"VP, engineering and supply"},teams:["Engineering","Supply chain"]},
  {n:"Finance",lead:{n:"Owen Park",t:"Chief financial officer"},teams:["Finance"]}]}};
const DT=W.DATA;
/* the tenant registry lives in DATA (DC-31); TENANT adds the organization details */
if(DT)Object.keys(T.info).forEach(k=>DT.addTenant(k,T.info[k]));
T.cur=()=>SCN.cur||"core";
T.name=k=>(T.info[k||T.cur()]||{}).org||(SCN.list[k||T.cur()]||{}).n||"The organization";
T.short=k=>(T.info[k||T.cur()]||{}).short||T.name(k);
T.version=()=>DT?DT.version:0;
T.onChange=fn=>DT?DT.on("change",fn):()=>{};
T.allowed=k=>SCN.allowed?SCN.allowed(k):!!SCN.list[k];
T.list=()=>Object.keys(SCN.list).filter(T.allowed);
const roleIn=k=>{try{return W.IDENT?IDENT.roles(k).join(", "):""}catch(e){return""}};

/* switcher in the side menu: the organization name under the wordmark becomes a button */
function ensureBtn(){let b=D.getElementById("tnBtn");const sm=D.querySelector(".rail .brand small");if(!b&&!sm)return;
 if(!b){b=D.createElement("button");b.id="tnBtn";b.type="button";b.className="tn-btn";b.setAttribute("aria-haspopup","menu");b.setAttribute("aria-expanded","false");b.setAttribute("data-r32-tn","open");sm.replaceWith(b)}
 b.setAttribute("data-tenant",T.cur());b.innerHTML=E(T.short())+' <span aria-hidden="true">▾</span>';b.setAttribute("aria-label","Tenant: "+T.name()+". Switch tenant.")}
function closeMenu(){const m=D.getElementById("tnMenu");if(m)m.remove();const b=D.getElementById("tnBtn");if(b)b.setAttribute("aria-expanded","false")}
function openMenu(){closeMenu();const b=D.getElementById("tnBtn");if(!b)return;const r=b.getBoundingClientRect();
 const m=D.createElement("div");m.id="tnMenu";m.className="tn-menu";m.setAttribute("role","menu");m.setAttribute("aria-label","Switch tenant");m.setAttribute("data-tenant-chooser","1");
 m.style.left=Math.max(8,r.left)+"px";m.style.top=(r.bottom+6)+"px";
 const who=W.IDENT?IDENT.me():null;
 m.innerHTML=`<div class="tn-h">Your tenants${who?" as "+E(who.name):""} (demo customers, all fictional)</div>`+T.list().map(k=>{const ro=roleIn(k);return `<button type="button" role="menuitemradio" aria-checked="${k===T.cur()}" class="tn-i${k===T.cur()?" on":""}" data-r32-tn="${k}"><b>${E(T.name(k))}</b><small>${E((T.info[k]||{}).kind||SCN.list[k].d||"")}${ro?" · Your role: "+E(ro):""}</small></button>`}).join("")+`<p class="tn-n">Only tenants you are a member of are listed. Switching keeps your screen and view. Tenant isolation is simulated in this prototype.</p>`;
 D.body.appendChild(m);b.setAttribute("aria-expanded","true");const f=m.querySelector(".tn-i.on")||m.querySelector(".tn-i");if(f)f.focus()}
/* one path: TENANT.switch -> SCN.set -> DATA.setTenant. The tenantChange hook re-renders the same screen; no reload. */
T.switch=function(k){if(!SCN.list[k])return false;closeMenu();let ok=true;
 if(k!==SCN.cur){if(!T.allowed(k)){try{toast("No membership in "+T.name(k)+". Access is denied by default.","warn")}catch(e){}return false}ok=SCN.set(k)}
 ensureBtn();return ok};
/* interim fallback only: a boot-time switch through the address, for a demo machine that cannot switch live */
T.reloadTo=function(k){if(!SCN.list[k])return;try{const u=new URL(location.href);u.searchParams.set("tenant",k);location.assign(u.toString())}catch(e){}};
try{HOOKS.on("tenantChange",()=>ensureBtn(),{order:900,id:"tenant-btn"})}catch(e){}
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-r32-tn]");
 if(t){const v=t.getAttribute("data-r32-tn");if(v==="open"){D.getElementById("tnMenu")?closeMenu():openMenu()}else T.switch(v);return}
 if(!(e.target.closest&&e.target.closest("#tnMenu")))closeMenu()});
D.addEventListener("keydown",e=>{if(e.key==="Escape"){const m=D.getElementById("tnMenu");if(m){closeMenu();const b=D.getElementById("tnBtn");if(b)b.focus()}}});
try{R15D.after.push(ensureBtn)}catch(e){}
[200,800,2000,5000].forEach(t=>setTimeout(ensureBtn,t));
try{SEARCHX.push(()=>T.list().map(k=>({g:"Go to",chooser:1,t:"Switch tenant: "+T.name(k),m:(T.info[k]||{}).kind||"",c:"--p4",f:()=>T.switch(k),k:"tenant switch customer demo scenario organization "+T.name(k).toLowerCase()})))}catch(e){}
})();
