/* Round 15, Agent D. Employee and new-hire front door.
   - The portal greets the signed-in user (mod_svc ME follows the persona).
   - Employee home: request something, my open requests, training due, answers.
   - New-hire home and "My first week": accounts, equipment, training due, who to ask, buddy. Driven by the New hire onboarding order
     (Order guides), the onboarding workflow and the mandatory courses in Training. */
(function(){
const W=window;const R15D=W.R15D=W.R15D||{};R15D.after=R15D.after||[];R15D.homes=R15D.homes||{};
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
S.r15d=S.r15d||{};
const TODAY=new Date(2026,9,6);
const dstr=d=>d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
const parse=s=>{const m=String(s||"").match(/(\d{4})-(\d{2})-(\d{2})/);return m?new Date(+m[1],+m[2]-1,+m[3]):null};
const daysTo=d=>Math.round((d-TODAY)/864e5);
const hires=()=>G(()=>OGX.orders().filter(o=>o.g==="onboarding"&&o.nh).sort((a,b)=>parse(a.nh.start)-parse(b.nh.start)),[]);
const hireNow=()=>{const L=hires();return L.find(o=>o.id===S.r15d.hire)||L[L.length-1]||null};
const lane={hr:"People team",comp:"Compliance",pay:"Payroll",it:"IT",ship:"Shipping",fac:"Facilities",mgr:"Your manager"};
const ST={done:["Done","good"],active:["In progress","info"],blocked:["Waiting","warn"],ready:["Ready","info"],pending:["Not started","mute"],late:["Late","bad"]};

function parts(o){
 const pl=G(()=>OGX.plan(o),null);if(!pl||!pl.R)return[];
 return Object.keys(pl.R).map(id=>{const r=pl.R[id],p=r.p;const st=r.state==="done"?"done":r.ac&&r.ac.blocked?"blocked":r.prog>0?"active":(r.state||"pending");
  return {id,n:p.n,lane:lane[p.lane]||p.lane,st,prog:Math.round((r.prog||0)*100),why:r.ac&&r.ac.blocked?r.ac.blocked.why:"",by:r.ac&&r.ac.by||"",sla:p.sla}}).filter(x=>!(pl.removed&&pl.removed.includes&&pl.removed.includes(x.id)))}
const NH=o=>o&&o.nh||{};
function training(o){
 const cs=G(()=>S.ppl.courses.filter(c=>c.mand),[])||[];const team=G(()=>DIR.find(d=>d.name===(NH(o).name||"")).team,null);
 return cs.filter(c=>(c.aud||[]).includes("All")||(team&&(c.aud||[]).includes(team))||!team).map(c=>({id:c.id,t:c.t,mins:c.mins,cat:c.cat,due:c.due,owner:c.owner}))}
function buddy(o){const m=NH(o).mgr||"Casey Rowan";const pers=G(()=>DIR.find(d=>d.name===m),null);
 const buddyName=(o&&o.act&&o.act.buddy)||G(()=>DIR.filter(d=>d.kind==="human"&&!d.generated&&d.team===(pers&&pers.team)&&d.name!==m&&d.name!==NH(o).name)[0].name,"Not assigned yet");return {mgr:m,buddy:buddyName}}
function equipment(o){const A=o&&o.A||{};return [["Laptop",A.device||"Standard laptop",A.remote?"Shipped to home address":"Collected at the desk on day one"],["System access",A.access||"Standard","Entra ID account created before the start date"],["Role",A.role||"Standard","Sets default groups and licences"],A.clear?["Clearance","Security check required","Adds time to the Compliance part"]:null,["Workplace",A.remote?"Remote (US)":"Parker HQ","Badge and desk"+(A.remote?" not needed":"")].concat([])].filter(Boolean)}

/* ---------- My first week ---------- */
REG("r15d_firstweek","My first week","help","M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z",()=>{
 const L=hires(),o=hireNow();
 if(!o)return `<div class="screen">${hero("Help · My first week","Your first week","No onboarding order exists yet. A manager starts one from Order guides.",`<button class="btn primary" data-go="svc_guides">Open order guides</button>`)}</div>`;
 const n=NH(o),sd=parse(n.start),dt=daysTo(sd),P=parts(o),done=P.filter(p=>p.st==="done").length,tr=training(o),b=buddy(o),eq=equipment(o);
 const when=dt>0?"starts "+dstr(sd)+", in "+dt+" day"+(dt===1?"":"s"):dt===0?"starts today":"started "+dstr(sd);
 const days=[["Day 1","Badge or laptop delivery, sign in, meet "+b.mgr+" and "+b.buddy,"people"],["Day 2","Mandatory training: "+(tr[0]?tr[0].t:"see Training"),"learn"],["Day 3","Role tools and access check","it"],["Day 4","First team meeting and your first small task","team"],["Day 5","Review the week with "+b.mgr,"mgr"]];
 return `<div class="screen">${hero("Help · My first week",E(n.name)+": first week",`<b data-role="metric">${done}</b> of <b data-role="metric">${P.length}</b> onboarding parts are done. ${E(n.name)} ${when}. ${P.filter(p=>p.st==="blocked").length?"<b>"+P.filter(p=>p.st==="blocked").length+"</b> waiting on someone.":""}`,`<div class="row">${L.length>1?`<label class="r15d-hr">New hire <select class="fin" data-r15d-hire aria-label="Choose a new hire">${L.map(x=>`<option value="${E(x.id)}" ${x.id===o.id?"selected":""}>${E(NH(x).name)} (${E(dstr(parse(NH(x).start)))})</option>`).join("")}</select></label>`:""}<button class="btn" data-go="svc_guides">Order guide</button><button class="btn" data-go="ppl_train">Training</button></div>`)}${lensNote()}
 <div class="grid g2" style="align-items:start">
  ${card("Accounts and equipment","From the onboarding order "+E(o.id)+". Everything is ordered once and fans out to the teams below.",`<div class="r15d-fwlist">${eq.map(x=>`<div><b>${E(x[0])}</b><span>${E(x[1])}</span><small class="muted">${E(x[2])}</small></div>`).join("")}</div>`)}
  ${card("Who to ask","People and a place to ask",`<div class="r15d-fwlist"><div><b>Manager</b><span>${E(b.mgr)}</span><small class="muted">Day-one plan and priorities</small></div><div><b>Buddy</b><span>${E(b.buddy)}</span><small class="muted">Day-to-day questions, who is who</small></div><div><b>IT help</b><span>Service desk</span><small class="muted">Accounts, laptop, access</small></div><div><b>Anything else</b><span><button class="chip" data-ask="I am new, what should I do on my first day?">Ask Oukala</button></span><small class="muted">Answers come from knowledge articles and order guides</small></div></div>`)}
 </div>
 <div class="grid g2" style="align-items:start;margin-top:var(--sp-5,24px)">
  ${card("Onboarding parts","Each part has an owner and an SLA; this is the live status of the order",`<div class="needs">${P.map(p=>{const s=ST[p.st]||ST.pending;return `<div class="need" style="grid-template-columns:auto 1fr auto"><span class="pill ${s[1]}">${s[0]}</span><div><b>${E(p.n)}</b><span class="muted">${E(p.lane)}${p.by?" · "+E(p.by):""} · SLA ${p.sla} day${p.sla===1?"":"s"}${p.why?" · "+E(p.why):""}</span></div><span class="num">${p.prog}%</span></div>`}).join("")||'<p class="muted">No parts yet.</p>'}</div>`)}
  ${card("Training due","Mandatory courses from Training and learning",`<div class="needs">${tr.map(c=>`<div class="need" style="grid-template-columns:1fr auto"><div><b>${E(c.t)}</b><span class="muted">${E(c.cat)} · ${c.mins} min · owner ${E(c.owner)}</span></div><span class="pill ${parse(c.due)&&parse(c.due)<TODAY?"warn":"mute"}">due ${E(dstr(parse(c.due)||TODAY))}</span></div>`).join("")||'<p class="muted">No mandatory courses.</p>'}</div>`)}
 </div>
 ${card("The week","A plain sequence, not a plan the system invents: it follows the onboarding workflow",`<ol class="r15d-week">${days.map(d=>`<li><b>${d[0]}</b><span>${E(d[1])}</span></li>`).join("")}</ol>`)}</div>`});
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest("[data-r15d-hire]");if(s){S.r15d.hire=s.value;render()}});

/* ---------- homes ---------- */
function myOrders(me){return G(()=>OGX.orders().filter(o=>o.by===me||(o.nh&&o.nh.name===me)),[])}
function myRequests(me){return G(()=>SVCX.records?SVCX.records().filter(r=>r.by===me).slice(0,6):[],[])}
R15D.homes.emp=function(){
 const me=R15D.me(),ors=myOrders(me.name),tr=training({nh:{name:me.name}}).filter(c=>parse(c.due)).sort((a,b)=>parse(a.due)-parse(b.due)).slice(0,3);
 return `<div class="screen">${hero(G(()=>NOW.day,"Today")+" · Meridian Standards Foundation",R15D.greeting()+", "+E(me.first),`${ors.length} open orders for you. ${tr.length} mandatory courses are due. Say what you need and the portal finds the form.`,`<div class="row"><span class="persona-note">Viewing as <b>Employee</b></span><button class="chip" data-r15d-vas-open>Change role</button></div>`)}${lensNote()}
 <div class="grid g2" style="align-items:start">
  ${card("Request something","Hardware, software, access, rooms, projects",`<div class="r15d-reqrow"><button class="btn primary" data-go="svc_portal">Open the portal</button><button class="btn" data-go="svc_guides">Order guides</button><button class="btn" data-go="svc_cat">Service catalog</button></div><div class="r15d-starters"><button class="chip" data-ask="How do I order a laptop?">How do I order a laptop?</button><button class="chip" data-ask="How do I request access?">How do I request access?</button><button class="chip" data-ask="Status of my requests">Status of my requests</button></div>`)}
  ${card("My open orders","Orders you placed or are the subject of",ors.length?`<div class="needs">${ors.slice(0,6).map(o=>{const pl=G(()=>OGX.plan(o),{pct:0,st:""});return `<div class="need" style="grid-template-columns:1fr auto"><div><b>${E(o.id)} · ${E(G(()=>OGX.guideOf(o.g).n,o.g))}</b><span class="muted">${E(o.forName||"you")} · ${pl.pct}% done${pl.st?" · "+E(pl.st):""}</span></div><button class="btn quiet" data-go="svc_guides">Open</button></div>`}).join("")}</div>`:`<p class="muted">No open orders.</p>`)}
 </div>
 <div class="grid g2" style="align-items:start;margin-top:var(--sp-5,24px)">
  ${card("Training due","Mandatory courses for everyone",`<div class="needs">${tr.map(c=>`<div class="need" style="grid-template-columns:1fr auto"><div><b>${E(c.t)}</b><span class="muted">${c.mins} min</span></div><span class="pill mute">due ${E(dstr(parse(c.due)))}</span></div>`).join("")||'<p class="muted">Nothing due.</p>'}</div><button class="btn quiet" data-go="ppl_train">Open training</button>`)}
  ${card("Find an answer","Ask answers from knowledge articles first",`<div class="r15d-starters"><button class="chip" data-ask="How do I reset my password?">How do I reset my password?</button><button class="chip" data-ask="Who owns the Standards Portal?">Who owns the Standards Portal?</button><button class="chip" data-ask="How do I book a room?">How do I book a room?</button></div><button class="btn quiet" data-go="kcs_ask">Ask the knowledge base</button>`)}
 </div></div>`};
R15D.homes.newhire=function(){return _R.r15d_firstweek?_R.r15d_firstweek():""};
R15D.homes.guest=function(){
 return `<div class="screen">${hero("Vendor access · Meridian Standards Foundation","Welcome, "+E(R15D.me().first),"You see only what has been shared with you. Everything here is read only.",`<div class="row"><span class="persona-note">Viewing as <b>Vendor guest</b> · read only</span><button class="chip" data-r15d-vas-open>Change role</button></div>`)}${lensNote()}
 ${card("Shared with you","Requests you raised and items shared by Meridian staff",`<div class="r15d-reqrow"><button class="btn primary" data-go="svc_portal">Open the portal</button><button class="btn" data-go="svc_req">My requests</button></div><p class="muted small">Rates, budgets and other vendors' data are hidden for this role.</p>`)}</div>`};
/* new hire persona identity follows the order the person selected */
R15D.after.push(()=>{try{if(S.persona==="newhire"){const o=hireNow();if(o&&PERSONAS.newhire.as!==NH(o).name){PERSONAS.newhire.as=NH(o).name}}}catch(e){}});
/* portal: greeting uses the signed-in user (ME is set by the persona module) */
R15D.after.push(()=>{if(S.screen!=="svc_portal")return;const h=document.querySelector("#view .hero h1");if(h&&/^Hi /.test(h.textContent)){const f=R15D.me().first;if(!h.textContent.startsWith("Hi "+f+","))h.textContent=h.textContent.replace(/^Hi \S+,/,"Hi "+f+",")}});
/* the sidebar and search know the new screen */
G(()=>NAVX.add("r15d_firstweek",{group:"help",label:"My first week",hint:"Accounts, equipment, training due, who to ask, your buddy",sub:"Start here",kw:"new hire onboarding first day week buddy accounts equipment training welcome"}),0);
SEARCHX.push(()=>[{g:"Go to",t:"My first week",m:"New-hire checklist",c:"--s3",f:()=>go("r15d_firstweek"),k:"new hire first day week onboarding buddy accounts training"}]);
})();
