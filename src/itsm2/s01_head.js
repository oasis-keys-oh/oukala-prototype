/* ============ ITSM: incidents, problems, changes, major incident, service desk overview ============
   Aligned to ITIL 5 (Product and Service Lifecycle Model), ISO/IEC 20000, DORA. Release management lives in mod_rel.js. */
(function(){
const X=S.itsm=S.itsm||{};
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],DOWN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const TODAYI="2026-10-06",NOWMS=Date.UTC(2026,9,6,13,30);
const iso=d=>d.toISOString().slice(0,10),pd=s=>new Date(s+"T00:00:00Z"),addD=(s,n)=>iso(new Date(pd(s).getTime()+n*864e5)),dif=(a,b)=>Math.round((pd(a)-pd(b))/864e5);
const fd=s=>{const d=pd(s);return MON[d.getUTCMonth()]+" "+d.getUTCDate()},dow=s=>pd(s).getUTCDay(),wk=s=>DOWN[dow(s)];
const z2=n=>String(n).padStart(2,"0");
const tAt=a=>{const d=new Date(NOWMS-a*36e5);return MON[d.getUTCMonth()]+" "+d.getUTCDate()+" "+z2(d.getUTCHours())+":"+z2(d.getUTCMinutes())};
const hmAt=a=>{const d=new Date(NOWMS-a*36e5);return z2(d.getUTCHours())+":"+z2(d.getUTCMinutes())};
const fH=h=>{const m=Math.round(Math.abs(h)*60);if(m<60)return m+"m";if(m<2880)return Math.floor(m/60)+"h"+(m%60?" "+(m%60)+"m":"");const dd=Math.floor(m/1440),hh=Math.round((m%1440)/60);return dd+"d"+(hh?" "+hh+"h":"")};
const N0=n=>Math.round(n).toLocaleString("en-US");
const mkN=(a,w,k,x)=>({a,w,k,x});
const ME="Tom Becker";
/* ---------- shared registry helpers (one service and CI graph for the whole platform) ---------- */
const SV=n=>SVCREG.find(s=>s.n===n||s.id===n)||null;
const SVN=SVCREG.map(s=>s.n);
const ciRec=id=>CIREG.find(c=>c.id===id||c.name===id)||null;
const ciN=id=>{const c=ciRec(id);return c?c.name:(id||"Not set")};
const ciOpts=svc=>{const s=SV(svc);const l=s?CIREG.filter(c=>c.svc===s.id):CIREG.slice(0,60);return l.map(c=>[c.id,c.name+" ("+c.class+")"])};
const SVMAP={"Search service":"Search and indexing","Taxonomy API":"Data platform","Entra ID":"Identity (Entra ID)","Microsoft 365":"Email and collaboration (M365)","Azure platform":"Network and VPN","End-user devices":"Endpoint management (Intune)"};
const CIMAP={"Portal web tier (Northwind)":"ci_por0","Portal load balancer":"ci_por3","Portal database":"ci_cod2","Search index cluster":"ci_sea2","Lumen indexer service":"ci_sea0","Taxonomy API gateway":"ci_dat3","Azure SQL (taxonomy)":"ci_dat2","Lease subledger app":"ci_erp2","ERP integration bus":"ci_int1","Contract Repository app":"ci_cr0","Document storage":"ci_cr2","Conditional access policies":"ci_ca","MFA service":"ci_mfa","Teams":"ci_m361","Exchange Online":"ci_m360","SharePoint":"ci_m362","Azure Key Vault":"ci_az","Azure monitor":"ci_az","VPN gateway":"ci_vpn","Core switch HQ":"ci_fw","Intune":"ci_end0","Print servers":"ci_end1"};
const svM=s=>SVMAP[s]||s,ciM=c=>CIMAP[c]||c;
const TEAMN=["Service desk","Platform team","Ops team","Data team","Finance","Security","Architecture","Change management","Lumen (vendor)","AI agents"];
let _mk=-1,_mm={};const members=t=>{if(_mk!==DIR.length){_mk=DIR.length;_mm={}}return _mm[t]||(_mm[t]=DIR.filter(d=>d.team===t))};
const GRPS=TEAMN;
const CATS=["Performance","Application","Access and identity","Network","Hardware","Data","Security","Other"];
const CHAN=["Portal","Phone","Email","Chat","Walk-up","Monitoring"];
const SVCT=Object.fromEntries(SVCREG.map(s=>[s.n,+s.tier.slice(-1)]));
const svcTier=s=>`<span class="pill mute" title="${esc((SV(s)||{}).tier||"Tier 2")}: how critical the service is to the Foundation">T${SVCT[s]||2}</span>`;
const kindOf=n=>{const r=who(n);return r?r.kind:"human"};
const who2=n=>n?`<span class="itsm-who" title="${esc(n)}${n&&who(n)?" · "+KINDS[kindOf(n)]:""}">${avatar(n,{size:22})}<span>${esc(n)}</span></span>`:`<span class="muted">Team queue</span>`;
const assignKind=n=>n?KINDS[kindOf(n)]:"Team queue";

/* ---------- priority: standard names and targets ---------- */
const PRI=[null,{n:"Critical",resp:.25,res:4,cls:"bad"},{n:"High",resp:.5,res:8,cls:"warn"},{n:"Moderate",resp:2,res:24,cls:"info"},{n:"Low",resp:4,res:72,cls:"mute"}];
const BANDN=["","Extensive","Significant","Moderate","Minor"],URGN=["","Critical","High","Medium","Low"];
const URGD=["","Work or a regulated deadline is stopped and there is no workaround","Work is badly slowed or the workaround is costly","A workaround exists; the customer can wait until tomorrow","Can wait for planned work"];
const STS=["New","In progress","On hold","Resolved"],STC={New:"info","In progress":"good","On hold":"warn",Resolved:"mute"};
const statePill=s=>`<span class="pill ${STC[s]||"mute"}">${s}</span>`;
const pPill=(p,t)=>`<span class="pill ${PRI[p].cls}" title="${esc(t||("P"+p+" "+PRI[p].n+": respond in "+fH(PRI[p].resp)+", resolve in "+fH(PRI[p].res)))}">P${p}</span>`;
const rid=a=>a[a.length-1];

/* ---------- metrics (formula, target, owner, remediation) ---------- */
Object.assign(METRICS,{
m_itsm_sla:{n:"SLA compliance",f:"Incidents resolved inside their resolution target ÷ Incidents resolved (last 30 days)",u:"%",cur:91,tgt:95,badAt:90,dir:"max",max:100,tr:[96,95,95,94,93,92,92,91],owner:"Service desk",use:["Incidents","Service desk overview"],rem:{kind:"sop",ref:"SOP-212",title:"Sweep the queue for timers about to breach",agent:"Triage Agent",auto:true,state:"running",prog:"Reassigning 3 incidents whose timers are under 25% remaining"}},
m_itsm_cfr:{n:"Change failure rate",f:"Changes that failed, rolled back or caused an incident ÷ Changes implemented (last 30 days)",u:"%",cur:16.7,tgt:12,badAt:20,dir:"min",max:40,tr:[8,9,10,12,13,15,16,16.7],owner:"Change management",use:["Changes","Service desk overview"],rem:{kind:"kb",ref:"KB-233",title:"Tighten the backout test rule for Tier 1 changes",agent:"Change Risk Agent",auto:false,state:"idle",prog:"Proposes a rule: no Tier 1 change is approved without a tested backout"}},
m_itsm_backlog:{n:"Backlog age",f:"Sum of hours open ÷ Open incidents (on-hold time excluded)",u:"h",cur:13.9,tgt:24,badAt:48,dir:"min",max:96,tr:[30,28,26,22,20,18,15,13.9],owner:"Service desk",use:["Incidents","Service desk overview"],rem:{kind:"agent",ref:"Triage Agent",title:"Route stale New incidents",agent:"Triage Agent",auto:true,state:"running",prog:"Routing 2 unassigned incidents to their suggested teams"}},
m_itsm_mttr:{n:"Major incident time to restore",f:"Average of (Service restored time − Major incident declared time) over the last 90 days, including the active one",u:"h",cur:3.1,tgt:3,badAt:5,dir:"min",max:10,tr:[3.4,3.3,3.2,3.2,3,2.8,2.9,3.1],owner:"Incident commander",use:["Major incident","Service desk overview"],rem:{kind:"kb",ref:"RB-031",title:"Portal failover runbook",agent:"Triage Agent",auto:true,state:"running",prog:"Running diagnostics and drafting the next update"}},
m_itsm_repeat:{n:"Repeat incident rate",f:"Incidents linked to an open problem ÷ Incidents opened (last 30 days)",u:"%",cur:42,tgt:25,badAt:40,dir:"min",max:80,tr:[28,30,33,35,36,38,40,42],owner:"Problem manager",use:["Problems and known errors","Service desk overview"],rem:{kind:"sop",ref:"SOP-218",title:"Prioritize problems by repeat count",agent:"Triage Agent",auto:false,state:"idle",prog:"Ranks open problems by repeats times affected users"}},
m_itsm_team:{n:"Team-first assignment",f:"Incidents routed to a team and then claimed by a member (or worked by the team) ÷ All incidents opened (last 30 days). Direct assignments to a named person are the exception.",u:"%",cur:94,tgt:90,badAt:80,dir:"max",max:100,tr:[88,89,91,92,93,93,94,94],owner:"Service desk",use:["Incidents","Service desk overview"],rem:{kind:"sop",ref:"SOP-215",title:"Review direct assignments with the team lead",agent:"Triage Agent",auto:false,state:"idle",prog:"Lists direct assignments and asks the lead to confirm each reason"}},
m_itsm_ovr:{n:"Priority override rate",f:"Incidents whose calculated priority was overridden by a person ÷ Incidents opened (last 30 days)",u:"%",cur:3.1,tgt:5,badAt:8,dir:"min",max:15,tr:[2,2.4,2.8,3,3.2,3.4,3.2,3.1],owner:"Incident manager",use:["Incidents","Priority policy"],rem:{kind:"kb",ref:"KB-241",title:"When to override a calculated priority",agent:"Triage Agent",auto:false,state:"idle",prog:"Flags overrides without a reason longer than a sentence"}},
m_itsm_appr:{n:"Approval turnaround",f:"Σ(approval decision time − approval request time) ÷ Approvals decided (last 30 days), compared with the policy SLA of each approval",u:"h",cur:9.4,tgt:24,badAt:36,dir:"min",max:72,tr:[14,13,12,11.5,11,10.5,9.8,9.4],owner:"Change management",use:["Changes","Approval policies"],rem:{kind:"agent",ref:"Change Risk Agent",title:"Nudge approvers and use delegates",agent:"Change Risk Agent",auto:true,state:"running",prog:"Reminding 2 approvers at 75% of their approval SLA"}},
m_itsm_ke:{n:"Known error reuse",f:"Incidents closed with a known error workaround ÷ Incidents linked to a published known error (last 30 days)",u:"%",cur:71,tgt:80,badAt:60,dir:"max",max:100,tr:[52,56,60,63,66,68,70,71],owner:"Problem manager",use:["Problems and known errors"],rem:{kind:"kb",ref:"KB-244",title:"Show known errors in the first reply template",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Drafts first-reply text for each published known error"}},
m_itsm_impact:{n:"Incident impact score",f:"Σ factor share × weight, 0 to 100: users affected ÷ service users (25, full at 50%) + function lost ÷ 100 (20) + availability shortfall vs target ÷ 0.5 points (10) + dollars at risk an hour ÷ $10,000 (15) + service tier share (15) + regulatory exposure share (15). Bands: 65 and up Extensive, 40 to 64 Significant, 20 to 39 Moderate, below 20 Minor.",u:"",cur:32,tgt:35,badAt:55,dir:"min",max:100,tr:[44,41,39,37,36,34,33,32],owner:"Incident manager",use:["Incidents","Priority policy"],rem:{kind:"sop",ref:"SOP-216",title:"Check the inputs of every Extensive incident",agent:"Triage Agent",auto:false,state:"idle",prog:"Compares users affected with monitoring before an incident is called Extensive"}},
m_itsm_mttrall:{n:"Time to restore service",f:"Σ(resolved time − opened time, on-hold excluded) ÷ Incidents resolved (last 30 days). This is the DORA time to restore.",u:"h",cur:9.2,tgt:8,badAt:16,dir:"min",max:30,tr:[12,11.5,11,10.4,10,9.8,9.5,9.2],owner:"Service desk",use:["Incidents","Service desk overview"],rem:{kind:"agent",ref:"Triage Agent",title:"Offer known error workarounds in the first reply",agent:"Triage Agent",auto:false,state:"idle",prog:"Searches the known error database for each new incident"}}
});

/* ---------- priority policy: impact (quantitative) + urgency (qualitative, bounded) -> priority (calculated) ---------- */
const POL0=()=>({ver:1,
 w:{users:25,deg:20,avail:10,rev:15,tier:15,reg:15},
 th:[65,40,20],fullUsers:.5,fullRev:10000,fullAvail:.5,
 tierF:{"Tier 1":1,"Tier 2":.55,"Tier 3":.2},regF:[0,.5,1],regN:["None","Deadline or audit commitment at risk","Reportable breach or regulatory exposure"],
 mx:{1:[1,1,2,3],2:[1,2,3,3],3:[2,3,3,4],4:[3,4,4,4]},
 ucap:{1:1,2:1,3:2,4:3},vipMax:2,
 roles:[
  {id:"caller",n:"Caller or employee",cap:3,critOK:false,ovr:false,note:"Sets urgency from their own view. Medium at most; the desk adjusts."},
  {id:"analyst",n:"Service desk analyst",cap:2,critOK:false,ovr:false,note:"Can choose High. Critical needs a lead or incident manager to agree."},
  {id:"lead",n:"Team lead or service desk lead",cap:1,critOK:true,ovr:false,note:"Can choose Critical when impact is Extensive or Significant."},
  {id:"incmgr",n:"Incident manager",cap:1,critOK:true,ovr:true,note:"Can choose Critical and override a calculated priority with a reason. A P1 downgrade needs a second approver."},
  {id:"owner",n:"Service owner",cap:1,critOK:true,ovr:true,note:"Can override for their own services, with a reason."},
  {id:"exec",n:"Executive (CIO or delegate)",cap:1,critOK:true,ovr:true,note:"Can override any priority. Every override is audited and reported monthly."}],
 vip:[
  {id:"",n:"Standard",steps:0,floor:4,exp:"",basis:"No adjustment. Priority comes from impact and urgency only.",owner:""},
  {id:"board",n:"Level 1: Board and CEO",steps:2,floor:2,exp:"2027-06-30",basis:"Board governance depends on the Board portal and on-time papers. Approved by the CIO Sep 1; reviewed every 6 months.",owner:"Casey Rowan"},
  {id:"exec",n:"Level 2: Executive team",steps:1,floor:3,exp:"2027-03-31",basis:"Executives run time-boxed external commitments. Approved by the CIO; reviewed every 6 months.",owner:"Casey Rowan"},
  {id:"crit",n:"Level 3: Critical role in a time-boxed window",steps:1,floor:3,exp:"2026-11-20",basis:"Chief Editor and senior editors during the Standards beta publishing windows (PR1). Expires when the window closes.",owner:"Maya Ortiz"}]
});
if(!X.pol)X.pol=POL0();
let POLVER=1;
const bumpPol=()=>{POLVER++;X.pol.ver=POLVER};
/* the impact score: six measured factors, each 0 to 1, times its weight; weights add to 100 */
function calc(i){
 if(i._c&&i._cv===POLVER)return i._c;
 const P=X.pol,s=SV(i.svc)||{users:100,tier:"Tier 2",avail:99.5,tgt:99.5},W=P.w,ua=i.ua||0;
 const pct=Math.min(1,ua/Math.max(1,s.users)),fu=Math.min(1,pct/P.fullUsers),fd_=Math.min(1,(i.deg||0)/100),short=Math.max(0,s.tgt-s.avail),fa=Math.min(1,short/P.fullAvail),fr=Math.min(1,(i.txh||0)/P.fullRev),ft=P.tierF[s.tier]==null?.55:P.tierF[s.tier],fg=P.regF[i.reg||0]||0;
 const items=[
  {k:"users",l:"Users affected",v:N0(ua)+" of "+N0(s.users)+" users ("+(pct*100).toFixed(pct<.01?2:1)+"%)",f:fu,m:W.users,r:"share of the service's users ÷ "+Math.round(P.fullUsers*100)+"% (full credit)"},
  {k:"deg",l:"Function lost",v:(i.deg||0)+"% of the service's function",f:fd_,m:W.deg,r:"percent of function unavailable ÷ 100"},
  {k:"avail",l:"Availability against target",v:s.avail+"% vs target "+s.tgt+"%",f:fa,m:W.avail,r:"shortfall ÷ "+P.fullAvail+" points (full credit)"},
  {k:"rev",l:"Transactions or revenue at risk",v:money(i.txh||0)+" an hour",f:fr,m:W.rev,r:"dollars an hour ÷ "+money(P.fullRev)+" (full credit)"},
  {k:"tier",l:"Service tier",v:s.tier,f:ft,m:W.tier,r:"Tier 1 = 100%, Tier 2 = "+Math.round((P.tierF["Tier 2"])*100)+"%, Tier 3 = "+Math.round(P.tierF["Tier 3"]*100)+"%"},
  {k:"reg",l:"Regulatory exposure",v:P.regN[i.reg||0],f:fg,m:W.reg,r:"none 0%, commitment at risk 50%, reportable 100%"}];
 items.forEach(x=>{x.p=Math.round(x.f*x.m*10)/10});
 const score=Math.round(items.reduce((a,x)=>a+x.p,0)),band=score>=P.th[0]?1:score>=P.th[1]?2:score>=P.th[2]?3:4;
 const role=P.roles.find(r=>r.id===(i.role||"analyst"))||P.roles[1],notes=[];let u=i.urg||3;const ur=u;
 if(u<role.cap){if(u===1&&i.apprBy){notes.push("Critical stands because "+i.apprBy+" agreed.")}else{notes.push(role.n+" can choose "+URGN[role.cap]+" at most, so "+URGN[u]+" was lowered to "+URGN[role.cap]+".");u=role.cap}}
 const uc=P.ucap[band];if(u<uc&&!(u===1&&i.apprBy&&band<=2)){notes.push(BANDN[band]+" impact allows "+URGN[uc]+" urgency at most, so "+URGN[u]+" was lowered to "+URGN[uc]+".");u=uc}
 const u0=u;let vip=null;const v=P.vip.find(x=>x.id===(i.vip||""));
 if(v&&v.steps){if(v.exp&&v.exp<TODAYI)notes.push(v.n+" expired "+fd(v.exp)+" and is not applied. Renew it in the policy.");else{vip=v;if(u>P.vipMax){u=Math.max(P.vipMax,u-v.steps);notes.push(v.n+" raises urgency by up to "+v.steps+" step"+(v.steps>1?"s":"")+" (never above "+URGN[P.vipMax]+" by itself), valid to "+fd(v.exp)+".")}}}
 const base=P.mx[band][u-1];let p=base,floor=false;if(vip&&vip.floor&&p>vip.floor){p=vip.floor;floor=true;notes.push(vip.n+" sets a floor of P"+vip.floor+".")}
 const c={score,band,items,role,ur,u0,u,vip,base,p,floor,notes,pct};i._c=c;i._cv=POLVER;return c}
const prio=i=>i.ovr?i.ovr.p:calc(i).p;
const mxcell=(b,u)=>PRI[X.pol.mx[b][u-1]];

