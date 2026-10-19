/* ===== mod_r32_tenant: tenants. Each demo scenario is a tenant (a customer) with its own journeys, workflows and org chart.
   Adds a tenant switcher to the side menu. All organizations, people and figures are fictional samples.
   Tenant-aware today: Journey maps (every tab), Org chart with agent assist, the Build list. Other screens still show the Meridian sample data. ===== */
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
  {n:"Revenue and finance",lead:{n:"Lena Fischer",t:"Chief financial officer"},teams:["Revenue cycle","Patient financial services","Payer contracting","Payer operations","Coding"]}]},
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
T.cur=()=>SCN.cur||"core";
T.name=k=>(T.info[k||T.cur()]||{}).org||(SCN.list[k||T.cur()]||{}).n||"The organization";
T.short=k=>(T.info[k||T.cur()]||{}).short||T.name(k);

/* switcher in the side menu: the organization name under the wordmark becomes a button */
function ensureBtn(){let b=D.getElementById("tnBtn");const sm=D.querySelector(".rail .brand small");if(!b&&!sm)return;
 if(!b){b=D.createElement("button");b.id="tnBtn";b.type="button";b.className="tn-btn";b.setAttribute("aria-haspopup","menu");b.setAttribute("aria-expanded","false");b.setAttribute("data-r32-tn","open");sm.replaceWith(b)}
 b.innerHTML=E(T.short())+' <span aria-hidden="true">▾</span>';b.setAttribute("aria-label","Tenant: "+T.name()+". Switch tenant.")}
function closeMenu(){const m=D.getElementById("tnMenu");if(m)m.remove();const b=D.getElementById("tnBtn");if(b)b.setAttribute("aria-expanded","false")}
function openMenu(){closeMenu();const b=D.getElementById("tnBtn");if(!b)return;const r=b.getBoundingClientRect();
 const m=D.createElement("div");m.id="tnMenu";m.className="tn-menu";m.setAttribute("role","menu");m.setAttribute("aria-label","Switch tenant");
 m.style.left=Math.max(8,r.left)+"px";m.style.top=(r.bottom+6)+"px";
 m.innerHTML=`<div class="tn-h">Tenants (demo customers, all fictional)</div>`+Object.keys(SCN.list).map(k=>`<button type="button" role="menuitemradio" aria-checked="${k===T.cur()}" class="tn-i${k===T.cur()?" on":""}" data-r32-tn="${k}"><b>${E(T.name(k))}</b><small>${E((T.info[k]||{}).kind||SCN.list[k].d||"")}</small></button>`).join("")+`<p class="tn-n">Each tenant has its own journeys, workflows, org chart and build list. Other screens still show the Meridian sample data.</p>`;
 D.body.appendChild(m);b.setAttribute("aria-expanded","true");const f=m.querySelector(".tn-i.on")||m.querySelector(".tn-i");if(f)f.focus()}
T.switch=function(k){if(!SCN.list[k])return;closeMenu();if(k!==SCN.cur){SCN.set(k)}ensureBtn();
 try{if(S.screen==="ppl_jrny"&&W.JYX&&JYX.api)JYX.api.paneRefresh();else render()}catch(e){try{render()}catch(x){}}
 try{toast("Tenant: "+T.name(k),"info")}catch(e){}};
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-r32-tn]");
 if(t){const v=t.getAttribute("data-r32-tn");if(v==="open"){D.getElementById("tnMenu")?closeMenu():openMenu()}else T.switch(v);return}
 if(!(e.target.closest&&e.target.closest("#tnMenu")))closeMenu()});
D.addEventListener("keydown",e=>{if(e.key==="Escape"){const m=D.getElementById("tnMenu");if(m){closeMenu();const b=D.getElementById("tnBtn");if(b)b.focus()}}});
try{R15D.after.push(ensureBtn)}catch(e){}
[200,800,2000,5000].forEach(t=>setTimeout(ensureBtn,t));
try{SEARCHX.push(()=>Object.keys(SCN.list).map(k=>({g:"Go to",t:"Switch tenant: "+T.name(k),m:(T.info[k]||{}).kind||"",c:"--p4",f:()=>T.switch(k),k:"tenant switch customer demo scenario organization "+T.name(k).toLowerCase()})))}catch(e){}
})();
