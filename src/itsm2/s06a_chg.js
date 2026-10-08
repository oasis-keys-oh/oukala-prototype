
/* ============ changes: logic, risk, configurable approval policies ============ */
const CHST=["Draft","Assess","Authorize","Scheduled","Implement","Review","Closed","Rejected"],CHSC={Draft:"mute",Assess:"info",Authorize:"warn",Scheduled:"good",Implement:"warn",Review:"info",Closed:"mute",Rejected:"bad"};
const CHSD={Draft:"Being written by the requester",Assess:"Risk is being assessed",Authorize:"Waiting for approvals",Scheduled:"Approved and on the calendar",Implement:"Being implemented now",Review:"Done, post-implementation review due",Closed:"Reviewed and closed",Rejected:"Rejected or withdrawn"};
const WINS=["Off-hours: 22:00 to 02:00","Early morning: 05:00 to 07:00","Business hours","Weekend window"];
const ENVS=["Production","Staging","Test","Dev"];
const riskBand=s=>s<20?["Low","good"]:s<40?["Medium","info"]:s<60?["High","warn"]:["Very high","bad"];
const riskC=c=>{if(c.gen||c._risk!=null){const s=c._risk!=null?c._risk:c.rs||0,b=riskBand(s);return {items:[],sum:s,score:s,band:b[0],cls:b[1],formula:c._risk!=null?"Score set by the simulator: "+s:"Computed score "+s+" (generated record)"}}return risk(c)};
const riskScore=c=>riskC(c).score;
const typePill=t=>`<span class="pill ${CTC[t]}" title="${esc(t==="Standard"?"Standard: pre-approved template, no CAB vote":t==="Normal"?"Normal: risk assessed and approved by policy":"Emergency: restores a live outage, expedited approval")}">${t}</span>`;
const riskPill=c=>{const r=riskC(c);return `<span class="pill ${r.cls}" title="${esc(r.formula)}">Risk ${r.score} · ${r.band}</span>`};
const chgPill=s=>`<span class="pill ${CHSC[s]}" title="${esc(CHSD[s]||s)}">${s}</span>`;
/* ---------- approval policy engine ---------- */
const ROLES=["Change manager","Service owner","Architecture","Finance","Executive","Security","Incident commander"];
const ROLEP={"Change manager":"Nia Brooks","Architecture":"Jordan Lee","Finance":"Avery Chen","Executive":"Omar Hamid","Security":"Rina Okafor","Incident commander":"Tom Becker"};
const BK={"Tom Becker":"Jordan Lee","Nia Brooks":"Jordan Lee"};
const roleWho=(role,c)=>role==="Service owner"?((SV(c.svc)||{}).owner||"Tom Becker"):(ROLEP[role]||"Nia Brooks");
const byOpts=()=>ROLES.map(r=>["role:"+r,"Role: "+r]).concat(TEAMN.filter(t=>t!=="AI agents").map(t=>["grp:"+t,"Group lead: "+t]));
const byLbl=t=>t.startsWith("role:")?t.slice(5):t.startsWith("grp:")?t.slice(4)+" lead":t.slice(4);
function expand(tok,c){const k=tok.slice(0,4),v=tok.slice(5);
 if(k==="role")return [{name:roleWho(v,c),role:v}];
 if(k==="grp:"){const m=members(tok.slice(4)).filter(x=>x.kind==="human");const lead=m.find(x=>/lead|manager|head|director/i.test(x.role||""))||m[0];return [{name:lead?lead.name:"Nia Brooks",role:tok.slice(4)+" lead"}]}
 return [{name:tok.slice(4),role:"Named approver"}]}
const POL_SEED=()=>[
 {id:"AP1",n:"Standard change from an approved template",on:true,stop:true,auto:true,cond:{type:["Standard"],tpl:"yes"},by:[],mode:"parallel",quorum:"all",sla:0,seq:false,deleg:"",why:"Pre-approved by the CAB once, when the template was approved (ITIL change enablement: standard changes need no per-change authorization)."},
 {id:"AP2",n:"Standard change without a template",on:true,stop:true,cond:{type:["Standard"],tpl:"no"},by:["role:Change manager"],mode:"parallel",quorum:"all",sla:8,seq:false,deleg:"Jordan Lee",why:"A Standard change must come from an approved template. Without one the change manager reviews it."},
 {id:"AP3",n:"Emergency change: ECAB",on:true,stop:true,cond:{type:["Emergency"]},by:["role:Change manager","role:Incident commander","role:Executive"],mode:"parallel",quorum:2,sla:1,seq:false,deleg:"Jordan Lee",why:"The emergency CAB needs any two of three, within one hour. Review happens after the fix."},
 {id:"AP4",n:"Normal change: change manager",on:true,cond:{type:["Normal"]},by:["role:Change manager"],mode:"parallel",quorum:"all",sla:24,seq:false,deleg:"Jordan Lee",why:"Every Normal change is assessed by the change manager."},
 {id:"AP5",n:"Service owner for their own service",on:true,cond:{type:["Normal"]},by:["role:Service owner"],mode:"parallel",quorum:"all",sla:24,seq:false,deleg:"",why:"The owner accepts the risk to their service. A requester cannot approve their own change."},
 {id:"AP6",n:"Architecture review for medium risk or higher",on:true,cond:{type:["Normal"],minRisk:20},by:["role:Architecture"],mode:"parallel",quorum:"all",sla:48,seq:false,deleg:"Marco Ellis",why:"Medium and higher risk changes need a design check."},
 {id:"AP7",n:"Finance for any cost",on:true,cond:{type:["Normal"],minCost:1},by:["role:Finance"],mode:"parallel",quorum:"all",sla:48,seq:false,deleg:"",why:"Spend over $0 needs a budget owner (TBM: cost transparency)."},
 {id:"AP8",n:"Security review for identity and security services",on:true,cond:{type:["Normal"],svc:["Identity (Entra ID)","Security operations"]},by:["role:Security"],mode:"parallel",quorum:"all",sla:24,seq:false,deleg:"",why:"Changes to identity or security tooling need the security lead (ISO 27001 change control)."},
 {id:"AP9",n:"Executive for high risk, after the others",on:true,cond:{type:["Normal"],minRisk:40},by:["role:Executive"],mode:"parallel",quorum:"all",sla:48,seq:true,deleg:"",why:"High and very high risk changes need an executive, who sees them last, with the other approvals in hand."},
 {id:"AP10",n:"Freeze exception",on:true,cond:{freeze:true},by:["role:Executive"],mode:"parallel",quorum:"all",sla:24,seq:true,deleg:"",why:"A change that falls in a blackout or restricted window needs an explicit executive exception."},
 {id:"AP11",n:"Production database or network CI classes",on:true,cond:{type:["Normal"],cls:["Database","Network device","Load balancer"],env:["Production"]},by:["grp:Architecture"],mode:"sequential",quorum:"all",sla:24,seq:false,deleg:"",why:"Shared infrastructure classes in production: the architecture group lead looks at them even at low risk."}];
const APCOND=[["type","Change type"],["svc","Service"],["cls","CI class"],["ci","Configuration item"],["tier","Service tier"],["minRisk","Risk score at least"],["grp","Requesting group"],["env","Environment"],["minCost","Cost at least"],["freeze","Inside a freeze window"],["tpl","Template"]];
function condParts(c,p){const k=p.cond||{},o=[],arr=a=>a&&a.length;
 if(arr(k.type))o.push(["Type is "+k.type.join(" or "),k.type.includes(c.type)]);
 if(arr(k.svc))o.push(["Service is "+k.svc.join(" or "),k.svc.includes(c.svc)]);
 if(arr(k.cls)){const cl=(c.cis||[]).map(x=>(ciRec(x)||{}).class);o.push(["CI class is "+k.cls.join(" or "),cl.some(x=>k.cls.includes(x))])}
 if(arr(k.ci))o.push(["CI is "+k.ci.map(ciN).join(" or "),(c.cis||[]).some(x=>k.ci.includes(x))]);
 if(arr(k.tier))o.push(["Tier is "+k.tier.join(" or "),k.tier.includes("Tier "+(SVCT[c.svc]||3))]);
 if(k.minRisk)o.push(["Risk at least "+k.minRisk,riskScore(c)>=k.minRisk]);
 if(arr(k.grp))o.push(["Group is "+k.grp.join(" or "),k.grp.includes(c.grp)]);
 if(arr(k.env))o.push(["Environment is "+k.env.join(" or "),k.env.includes(c.env||"Production")]);
 if(k.minCost)o.push(["Cost at least "+money(k.minCost),(c.cost||0)>=k.minCost]);
 if(k.freeze)o.push(["Inside a freeze window",freezeHits(c).length>0]);
 if(k.tpl==="yes")o.push(["Uses an approved template",!!c.tpl&&!!(X.tpl.find(t=>t.id===c.tpl&&t.st==="Approved"))]);
 if(k.tpl==="no")o.push(["Has no approved template",!(c.tpl&&X.tpl.find(t=>t.id===c.tpl&&t.st==="Approved"))]);
 return o}
const condText=p=>{const o=[],k=p.cond||{};if(k.type&&k.type.length)o.push(k.type.join("/"));if(k.svc&&k.svc.length)o.push(k.svc.length>2?k.svc.length+" services":k.svc.join("/"));if(k.cls&&k.cls.length)o.push(k.cls.join("/"));if(k.ci&&k.ci.length)o.push(k.ci.length+" CI"+(k.ci.length>1?"s":""));if(k.tier&&k.tier.length)o.push(k.tier.join("/"));if(k.minRisk)o.push("risk ≥ "+k.minRisk);if(k.grp&&k.grp.length)o.push(k.grp.join("/"));if(k.env&&k.env.length)o.push(k.env.join("/"));if(k.minCost)o.push("cost ≥ "+money(k.minCost));if(k.freeze)o.push("in freeze");if(k.tpl==="yes")o.push("with template");if(k.tpl==="no")o.push("no template");return o.join(" · ")||"Every change"};
function route(c){const stages=[],trace=[];let auto=false,stop=false;const seen=new Set();
 X.apol.forEach(p=>{if(p.on===false){trace.push({p,off:1});return}
  if(stop){trace.push({p,skip:"An earlier final policy already decided this change."});return}
  const parts=condParts(c,p),ok=parts.every(x=>x[1]);if(!ok){trace.push({p,parts});return}
  const t={p,parts,hit:1};trace.push(t);
  if(p.auto){auto=true;if(p.stop)stop=true;return}
  const ap=[];(p.by||[]).forEach(tok=>expand(tok,c).forEach(a=>{let nm=a.name,sod="";if(nm===c.req){const b=BK[nm]||"Nia Brooks";sod=nm+" requested the change, so "+b+" acts instead (separation of duties)";nm=b}ap.push({w:nm,r:a.role,dec:"pending",note:"",sod,deleg:p.deleg||""})}));
  const u=ap.filter(a=>{if(seen.has(a.w))return false;seen.add(a.w);return true});
  if(!u.length){t.dup="All its approvers are already on the route.";return}
  stages.push({pid:p.id,n:p.n,mode:p.mode||"parallel",quorum:p.quorum||"all",sla:p.sla||0,seq:!!p.seq,ap:u});
  if(p.stop)stop=true});
 return {auto:auto&&!stages.length,stages,trace}}
const needN=s=>s.quorum==="all"?s.ap.length:s.quorum==="any"?1:Math.min(+s.quorum||1,s.ap.length);
const quorumTxt=s=>s.quorum==="all"?"all "+s.ap.length:s.quorum==="any"?"any 1 of "+s.ap.length:needN(s)+" of "+s.ap.length;
function stSt(c,si){const s=c.stages[si],ap=s.ap.filter(a=>a.dec==="approved").length,rj=s.ap.filter(a=>a.dec==="rejected").length,n=needN(s);
 if(ap>=n)return "approved";if(s.ap.length-rj<n)return "rejected";
 if(s.seq&&c.stages.slice(0,si).some((_,k)=>stSt(c,k)!=="approved"))return "waiting";return "active"}
const apElig=(c,si,ai)=>{const s=c.stages[si],a=s.ap[ai];if(stSt(c,si)!=="active"&&stSt(c,si)!=="waiting")return false;if(stSt(c,si)==="waiting")return false;if(a.dec==="approved"||a.dec==="rejected")return false;if(s.mode==="sequential"&&s.ap.slice(0,ai).some(x=>x.dec!=="approved"))return false;return true};
const apProg=c=>{const st=c.stages||[];if(!st.length)return c.auto?"auto":"none";const d=st.filter((_,k)=>stSt(c,k)==="approved").length;return d+"/"+st.length};
function applyRoute(c,r){c.stages=r.stages;c.tr=r.trace.filter(t=>t.hit).map(t=>t.p.id);c.subH=0}
function submitChange(c){const r=route(c);applyRoute(c,r);
 if(r.auto){c.st="Scheduled";c.auto=true;X.cablog.unshift([c.id,"Policy",r.trace.find(t=>t.hit&&t.p.auto).p.n,"Auto-approved. No CAB vote",tAt(0)])}
 else{c.st="Authorize";c.auto=false;X.cablog.unshift([c.id,"Policy","Routed to "+r.stages.length+" approval stage"+(r.stages.length===1?"":"s"),r.stages.map(s=>s.n).join("; "),tAt(0)])}
 audit("submitted change "+c.id,(r.auto?"auto-approved":r.stages.length+" stages")+" · policies "+r.trace.filter(t=>t.hit).map(t=>t.p.id).join(", "));return r}
function settle(c){if(!c.stages||!c.stages.length)return;if(c.stages.some((_,k)=>stSt(c,k)==="rejected")){c.st="Rejected";return}if(c.stages.every((_,k)=>stSt(c,k)==="approved")&&c.st==="Authorize"){c.st="Scheduled";X.cablog.unshift([c.id,"CAB","All approved","Change is scheduled",tAt(0)])}}
function cabDecide(c,si,ai,dec,why){const a=c.stages[si].ap[ai];a.dec=dec;a.note=why||"";a.at=tAt(0);X.cablog.unshift([c.id,a.w,dec,why||"",a.at]);settle(c);done("Approval "+dec,c.id+" · "+a.w+(why?" · "+why:""))}
function cabForm(id,si,ai,dec){const c=CHGB(id),a=c.stages[si].ap[ai];const t={rejected:"Reject",deferred:"Defer",delegate:"Delegate"}[dec];
 openForm({id:"itsm_cab",title:t+" "+id+" as "+a.w,story:dec==="rejected"?"A rejection sends the change back to its requester with your reason. It is recorded under "+a.w+".":dec==="deferred"?"A deferral keeps the change on the agenda and asks the requester for what you name.":"Hand this approval to someone else for now. The original approver stays on the record and the delegate decides. Delegation must be to someone who is not the requester.",submit:t,defaults:{to:a.deleg&&a.deleg!==c.req?a.deleg:""},
 fields:(dec==="delegate"?[{k:"to",label:"Delegate to",type:"select",req:true,ph:"Choose a person",opts:DIR.filter(d=>d.kind==="human"&&d.name!==c.req&&d.name!==a.w).map(d=>d.name)}]:[]).concat([{k:"why",label:"Reason",type:"longtext",req:true,wide:true,ph:dec==="rejected"?"What must change before we would approve?":dec==="deferred"?"What do you need, and by when?":"Why, and until when?"}]),
 onSubmit:v=>{if(dec==="delegate"){const from=a.w;a.from=from;a.w=v.to;a.r=a.r+" (delegate for "+from+")";a.sod="";X.cablog.unshift([c.id,from,"delegated to "+v.to,v.why,tAt(0)]);done("Approval delegated",c.id+" · "+from+" → "+v.to)}else cabDecide(c,si,ai,dec,v.why);chgDrawer(id);return {close:false,toast:id+" "+(dec==="delegate"?"delegated":dec==="rejected"?"rejected":"deferred")}}})}
/* ---------- policy simulator ---------- */
const simTmp=()=>{const s=X.sim;if(s.src&&s.src!=="custom"){const c=CHGB(s.src);if(c)return Object.assign({},c,{_risk:s.risk==="auto"?null:+s.risk})}
 return {id:"SIM",type:s.type,svc:s.svc,cis:s.ci?[s.ci]:[],cost:+s.cost||0,env:s.env,grp:s.grp,req:s.req||"Dev Rao",tpl:s.tpl==="yes"?"TPL01":"",start:s.start||addD(TODAYI,10),end:s.start||addD(TODAYI,10),st:"Draft",rq:{},_risk:s.risk==="auto"?15:+s.risk,own:"Sam Patel"}};
/* ---------- freeze, collisions and calendar helpers (scale-aware) ---------- */
const wkday=s=>{const d=dow(s);return d!==0&&d!==6};
function suggestDay(c){const len=dif(c.end,c.start);for(let n=1;n<80;n++){const s=addD(c.start,n);if(s<=TODAYI||!wkday(s))continue;const t={...c,start:s,end:addD(s,len)};if(!collisions(t).filter(x=>x.kind==="hard").length&&!freezeHits(t).length)return s}return null}
function allCollisions(){const seen=new Set(),out=[];X.chg.filter(openCh).forEach(c=>collisions(c).forEach(x=>{const k=[c.id,x.o.id].sort().join("|");if(seen.has(k))return;seen.add(k);out.push({a:c,b:x.o,kind:x.kind,sh:x.sh})}));return out}
function freezeConflicts(){return ALLC().filter(c=>openCh(c)&&!c.hist&&freezeHits(c).length).map(c=>({c,f:freezeHits(c)}))}
const nextDays=n=>ALLC().filter(c=>openCh(c)&&!c.hist&&c.end>=TODAYI&&c.start<=addD(TODAYI,n)&&c.st!=="Review").sort((a,b)=>a.start.localeCompare(b.start));
const stagesOf=c=>{if(!c.stages)c.stages=[];if(!c.stages.length&&c.st==="Authorize"&&!c.auto){const r=route(c);applyRoute(c,r);c.subH=c.subH||((c.id.charCodeAt(c.id.length-1)*7)%30)}return c.stages};
function seedApprovals(){X.cablog=X.cablog||[];
 X.chg.forEach(c=>{if(c.hist){c.stages=[];return}
  const m=who(c.own);c.grp=c.grp||(m&&m.team)||"Ops team";
  if(!c.stages||!c.stages.length){const r=route(c);applyRoute(c,r);c.auto=r.auto;
   const st=c.st;if(st==="Scheduled"||st==="Implement"||st==="Review"||st==="Closed")c.stages.forEach(s=>s.ap.forEach(a=>{a.dec="approved";a.at="Oct 5"}));
   else if(st==="Authorize")c.stages.forEach(s=>s.ap.forEach(a=>{if((c.ok||[]).includes(a.w)){a.dec="approved";a.at="Oct 5"}}));
   else if(st==="Draft"||st==="Assess"){c.stages=[]}
   if(st==="Authorize")c.subH=c.id==="CHG0312"?19:7}});
 if(!X.cablog.length)X.cablog=[["CHG0311","Nia Brooks","approved","ECAB approved the emergency fix",tAt(1.8)],["CHG0314","Nia Brooks","approved","Pool size is within the service owner's limit",tAt(26)],["CHG0313","Jordan Lee","approved","Architecture approved build 2.4",tAt(31)]]}
