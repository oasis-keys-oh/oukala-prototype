/* ===== Round 16, Agent H, part C: Approval groups. Every approval anywhere routes to a GROUP; individuals act only as members.
   Registry (members, delegates, quorum), audit of every approval path, migration of seed data and PROC gate steps, gap check,
   inbox integration (group shown, who in it acted). Screen r16h_groups. API: window.APG. ===== */
(function(){
"use strict";
const R=window.R16H;if(!R)return;
const {G,H,TODAY,fmtD,addDays,TCORE,TROWS,TGAP,fchipT}=R;
const A=S.r16h.apg=Object.assign({groups:[],log:[],seeded:false,migrated:null,tab:0,q:"",flt:"all",sel:null,version:1},S.r16h.apg||{});
const E={};   /* exported API */
const first=n=>String(n||"").split(/[ (]/)[0];
/* ---------- seed: groups ---------- */
const GD=(id,name,desc,members,o)=>Object.assign({id,name,desc,kind:"static",members,delegates:[],quorum:{mode:"any",n:1},scope:[],tokens:[],owner:members[0],backup:members[1]||members[0]},o||{});
function seed(){if(A.seeded)return;A.seeded=true;
 A.groups=[
  GD("apg_fin","Finance approvers","Invoices, payments, finance exceptions and cost on changes.",["Avery Chen","Noelle Park","Victor Amaya"],{scope:["inv","chg","budreq","flow","time"],tokens:["Controller","Finance","Finance approver","Finance business partner","AP lead","Accounts payable lead"],quorum:{mode:"any",n:1}}),
  GD("apg_cab","Change advisory board","Normal and emergency changes to production services.",["Nia Brooks","Rina Okafor","Sam Patel","Tom Becker","Jordan Lee"],{scope:["chg"],tokens:["Change manager","Policy","CAB","Service owner for their own service","Change Advisory Board"],quorum:{mode:"nofm",n:3}}),
  GD("apg_cio","Technology leadership","CIO decisions: Tier 1 releases, risk acceptance, platform exceptions.",["Casey Rowan","Jordan Lee","Sam Patel"],{scope:["chg","rel","ent","debt","flow","gate","gapp","sow","fab"],tokens:["CIO","Executive","Chief information officer","Casey Rowan"],quorum:{mode:"any",n:1}}),
  GD("apg_cfo","CFO office","Spend between $100,000 and $250,000.",["Marcus Reid","Avery Chen"],{scope:["gate","budreq","flow"],tokens:["CFO","Chief financial officer"]}),
  GD("apg_ceo","CEO office","Spend between $250,000 and $1,000,000.",["Catherine Doyle","Marcus Reid"],{scope:["gate","flow"],tokens:["CEO","Chief executive","Catherine Doyle"]}),
  GD("apg_board_fin","Board finance committee","Spend above $1,000,000.",["Catherine Doyle","Marcus Reid","Theo Marlowe"],{scope:["gate"],tokens:["Board finance committee"],quorum:{mode:"nofm",n:2}}),
  GD("apg_budget_owner","Budget owners","Owners of a budget line, up to $10,000.",["Victor Amaya","Maya Ortiz","Sam Patel","Anil Mehta"],{scope:["budreq","flow","gate"],tokens:["Budget owner","Budget line owner"]}),
  GD("apg_portfolio_lead","Portfolio leads","Portfolio lead tier, up to $25,000.",["Maya Ortiz","Priya Shah","Dev Rao"],{scope:["gate","budreq","flow"],tokens:["Portfolio lead","Portfolio office","Portfolio analyst"]}),
  GD("apg_portfolio_board","Portfolio board","Demand ranking and funding decisions.",["Maya Ortiz","Casey Rowan","Marcus Reid","Elena Marsh"],{scope:["budreq","flow","gate"],tokens:["Portfolio board","Portfolio council","Council"],quorum:{mode:"nofm",n:2}}),
  GD("apg_arch_sec","Architecture and security review","Design, security and data reviews of new work.",["Jordan Lee","Aaron Whitfield","Rina Okafor"],{scope:["budreq","flow","chg"],tokens:["Security lead","Architecture and security lead","Architecture","Security review","Chief architect"]}),
  GD("apg_procure","Procurement and vendors","Vendor onboarding, purchase orders and renewals.",["Camille Ortega","Avery Chen","Theo Marlowe"],{scope:["flow","req","sow"],tokens:["Procurement lead","Procurement","Vendor manager"]}),
  GD("apg_legal","Legal and contracts","Contract clauses, legal holds and dismissals.",["Theo Marlowe","Camille Ortega"],{scope:["sow","flow"],tokens:["General counsel","Legal","Legal counsel"]}),
  GD("apg_people","People Operations","Hiring, status changes, leave, pay and benefits.",["Joanna Pierce","Grace Whitfield"],{scope:["flow","req","pto","status"],tokens:["HR partner","People Operations","Head of People Operations","HR","Joanna Pierce"]}),
  GD("apg_line","Line management","The requester's manager. Members are resolved from the org chart for each request.",["Maya Ortiz"],{kind:"dynamic",dyn:"manager",scope:["cat","flow","time","pto","req","access"],tokens:["Requester's manager","Line manager","Manager","New line manager","The manager","Hiring manager","Approving manager","Manager approval"]}),
  GD("apg_service_owner","Service owners","The owner of the service the request affects. Members are resolved from the service registry.",["Jordan Lee","Sam Patel","Tom Becker"],{kind:"dynamic",dyn:"service_owner",scope:["chg","flow","cat"],tokens:["Service owner","Process owner","Workflow owner","Permission-set owner"]}),
  GD("apg_release","Release board","Go or no-go for releases.",["Hollis Grey","Nia Brooks","Tom Becker"],{scope:["rel"],tokens:["Release manager","Release coordinator","Release board"],quorum:{mode:"nofm",n:2}}),
  GD("apg_know","Knowledge reviewers","Review and publish knowledge articles.",["Tom Becker","Maribel Cruz","Priti Joshi"],{scope:["kcs"],tokens:["Knowledge reviewer","Knowledge manager"]}),
  GD("apg_data","Data council","New entities, classification and data sharing.",["Jordan Lee","Anil Mehta","Kenji Watanabe"],{scope:["ent","fab","gapp"],tokens:["Data council chair","Data architect","Data steward"],quorum:{mode:"nofm",n:2}}),
  GD("apg_ai","AI governance board","Agent tiers, autonomy changes and agent sponsorship.",["Kenji Watanabe","Theo Marlowe","Casey Rowan"],{scope:["flow","gapp"],tokens:["Agent sponsor","AI platform lead","Sponsor"]}),
  GD("apg_platform","Platform governance board","Citizen app certification, platform debt and exceptions.",["Casey Rowan","Jordan Lee","Kenji Watanabe","Rina Okafor"],{scope:["gapp","debt","mat"],tokens:["Platform admin","Platform governance"],quorum:{mode:"nofm",n:2}}),
  GD("apg_fulfil_it","IT fulfillment leads","Approves access and device fulfillment steps.",["Tom Becker","Colette Brandt","Wes Hartley"],{scope:["cat"],tokens:["IT fulfiller","Service desk lead","Colette Brandt"]})];
 A.log=[
  {t:Date.parse("2026-10-09T14:12:00Z"),group:"apg_cab",by:"Nia Brooks",dec:"approved",item:"CHG0309",note:"Window confirmed"},
  {t:Date.parse("2026-10-09T15:40:00Z"),group:"apg_cab",by:"Rina Okafor",dec:"approved",item:"CHG0309",note:"Security impact checked"},
  {t:Date.parse("2026-10-09T16:05:00Z"),group:"apg_fin",by:"Noelle Park",dec:"approved",item:"INV-20433",note:"Three-way match passed"},
  {t:Date.parse("2026-10-08T10:20:00Z"),group:"apg_portfolio_board",by:"Elena Marsh",dec:"approved",item:"BR-0099",note:""},
  {t:Date.parse("2026-10-08T11:02:00Z"),group:"apg_portfolio_board",by:"Maya Ortiz",dec:"rejected",item:"BR-0098",note:"Duplicate of BR-0084"}];
}
const byId=id=>A.groups.find(g=>g.id===id)||null;
const byName=n=>{n=String(n||"").toLowerCase();return A.groups.find(g=>g.name.toLowerCase()===n||g.id===n)||null};
const byToken=t=>{t=String(t||"").toLowerCase();if(!t)return null;return byName(t)||A.groups.find(g=>(g.tokens||[]).some(x=>x.toLowerCase()===t))||null};
const isPerson=n=>G(()=>!!ORGX.P(n),false)||G(()=>{const w=who(n);return !!w&&w.kind!=="ai"},false);
/* ---------- membership ---------- */
function activeDelegates(g){return (g.delegates||[]).filter(d=>!d.until||d.until>=TODAY)}
function members(ref,ctx){const g=typeof ref==="string"?(byId(ref)||byName(ref)||byToken(ref)):ref;if(!g)return[];ctx=ctx||{};let m=g.members.slice();
 if(g.kind==="dynamic"&&g.dyn==="manager"&&ctx.requester){const p=G(()=>ORGX.P(ctx.requester),null);const mg=p&&p.mgr||G(()=>who(ctx.requester).mgr,"");if(mg)m=[mg].concat(G(()=>ORGX.up(mg),[]).slice(0,1))}
 if(g.kind==="dynamic"&&g.dyn==="service_owner"&&ctx.service){const s=G(()=>SVCREG.find(x=>x.name===ctx.service||x.id===ctx.service),null);if(s&&s.owner)m=[s.owner].concat(m.filter(x=>x!==s.owner)).slice(0,3)}
 activeDelegates(g).forEach(d=>{if(m.indexOf(d.member)>=0&&m.indexOf(d.to)<0)m.push(d.to)});return m}
function isMember(ref,person,ctx){if(!ref||!person)return false;const g=typeof ref==="string"?(byId(ref)||byName(ref)||byToken(ref)):ref;if(!g)return false;
 if(g.kind==="dynamic"&&g.dyn==="manager"&&!(ctx&&ctx.requester)){return g.members.indexOf(person)>=0||G(()=>ORGX.kids(person).length>0,false)}
 return members(g,ctx).indexOf(person)>=0}
const groupsOf=p=>A.groups.filter(g=>isMember(g,p));
function colleagues(me,adapter){const set=new Set();A.groups.forEach(g=>{if(!isMember(g,me))return;if(adapter&&g.scope.length&&g.scope.indexOf(adapter)<0)return;g.members.forEach(m=>{if(m!==me)set.add(m)})});return [...set]}
function quorumText(g){const q=g.quorum||{};return q.mode==="all"?"All members":q.mode==="nofm"?q.n+" of "+g.members.length:q.mode==="first"?"First responder":"Any one member"}
/* ---------- classification ---------- */
function classify(tok){tok=String(tok==null?"":tok).trim();if(!tok)return{kind:"empty",g:null};
 const g=byName(tok);if(g)return{kind:"group",g};
 const gt=byToken(tok);if(gt){return isPerson(tok)&&!/^(CIO|CFO|CEO)$/.test(tok)&&gt.members.indexOf(tok)>=0&&!gt.tokens.some(x=>x.toLowerCase()===tok.toLowerCase())?{kind:"individual",g:gt}:{kind:isPerson(tok)?"individual":"role",g:gt}}
 if(isPerson(tok)){const gs=groupsOf(tok);return{kind:"individual",g:gs[0]||null}}
 return{kind:"unknown",g:null}}
/* ---------- approval path probes: each returns slots [{rec,spec,apg,set(gid)}] ---------- */
const PATHS=[
 {k:"flow",label:"Workflow approval steps",mod:"Design a workflow",scr:"flw_design",probe(){const o=[];G(()=>FLOWX.flows()).forEach(f=>(f.nodes||[]).forEach(n=>{if(n.t!=="approval")return;const a=n.a||{};(a.approvers||[]).forEach((t,ix)=>o.push({rec:f.id+"/"+n.id,spec:t,apg:(a.apg||[])[ix]||null,fix:g=>{a.approvers[ix]=g.name;a.apg=a.apg||[];a.apg[ix]=g.id}}))}));return o}},
 {k:"gate",label:"Gate steps in process definitions",mod:"Process library",scr:"plat_proclib",probe(){const o=[];G(()=>Object.keys(PROC.defs)).forEach(id=>{const d=PROC.defs[id];(d.steps||[]).forEach((s,ix)=>{if(s.who!=="gate")return;o.push({rec:id+" · "+s.n,spec:s.ownerWas||s.owner,apg:s.apg||null,fix:g=>{if(!s.ownerWas)s.ownerWas=s.owner;s.owner=g.name;s.apg=g.id}})})});return o}},
 {k:"chg",label:"Change approvals (CAB)",mod:"Changes",scr:"itsm_chg",probe(){const o=[];G(()=>ITSMX.changes).forEach(c=>(c.stages||[]).forEach(s=>(s.ap||[]).forEach(a=>o.push({rec:c.id+" · "+s.n,spec:a.apg?(byId(a.apg)||{}).name:a.w,apg:a.apg||null,fix:g=>{a.apg=g.id}}))));return o}},
 {k:"cat",label:"Service catalog approvals",mod:"Requests and fulfillment",scr:"svc_req",probe(){const o=[];G(()=>REQREG).forEach(r=>{Object.keys(r.ap||{}).forEach(k=>{const a=r.ap[k];o.push({rec:r.id,spec:a.apg?(byId(a.apg)||{}).name:a.who,apg:a.apg||null,fix:g=>{a.apg=g.id}})})});return o.slice(0,4000)}},
 {k:"gatefin",label:"Funding gate approvals",mod:"Funding gates",scr:"fin_gates",probe(){const o=[];G(()=>FIN._h.F.gq).forEach(q=>o.push({rec:q.id,spec:q.apg?(byId(q.apg)||{}).name:q.approver,apg:q.apg||null,fix:g=>{q.apg=g.id}}));return o}},
 {k:"doa",label:"Delegation of authority tiers",mod:"Who can approve what",scr:"bud_doa",probe(){const o=[];G(()=>S.bud.doa).forEach(t=>o.push({rec:t.id+" up to "+(t.max==null?"no limit":"$"+t.max.toLocaleString("en-US")),spec:t.apg?(byId(t.apg)||{}).name:t.role,apg:t.apg||null,fix:g=>{t.apg=g.id}}));return o}},
 {k:"budreq",label:"Budget request review stages",mod:"Budget requests",scr:"bud_req",probe(){const o=[];const M={tri:"apg_portfolio_lead",fin:"apg_fin",arc:"apg_arch_sec",val:"apg_portfolio_lead",cnc:"apg_portfolio_board",dec:"apg_cio"};const L={tri:"Triage",fin:"Finance review",arc:"Architecture and security review",val:"Business value scoring",cnc:"Portfolio council ranking",dec:"Funding decision"};
   Object.keys(M).forEach(k=>{const st=A.stg=A.stg||{};o.push({rec:L[k],spec:st[k]?(byId(st[k])||{}).name:(k==="tri"?"Portfolio office":k==="fin"?"Finance business partner":k==="arc"?"Architecture and security lead":k==="val"?"Portfolio analyst":k==="cnc"?"Portfolio council":"CIO"),apg:st[k]||null,fix:g=>{st[k]=g.id}})});return o}},
 {k:"inv",label:"Invoice approval",mod:"Approve invoices",scr:"inv",probe(){const st=A.stg=A.stg||{};return [{rec:"Invoice approval step",spec:st.inv?(byId(st.inv)||{}).name:"Controller (finance persona)",apg:st.inv||null,fix:g=>{st.inv=g.id}}]}},
 {k:"time",label:"Timesheet approval",mod:"Time and expenses",scr:"r15_time",probe(){const o=[];G(()=>S.r15t&&S.r15t.sheets||R15F3.time&&R15F3.time.sheets||[]).forEach(s=>o.push({rec:s.id,spec:s.apg?(byId(s.apg)||{}).name:s.approver,apg:s.apg||null,fix:g=>{s.apg=g.id}}));const st=A.stg=A.stg||{};if(!o.length)o.push({rec:"Timesheet approval step",spec:st.time?(byId(st.time)||{}).name:"Line manager",apg:st.time||null,fix:g=>{st.time=g.id}});return o}},
 {k:"req",label:"Purchase and position requisitions",mod:"Purchasing, Org chart",scr:"org_chart",probe(){const st=A.stg=A.stg||{};const o=[];[["Purchase requisition","req_po","Procurement lead"],["Position requisition (headcount)","req_pos","Victor Amaya"]].forEach(x=>o.push({rec:x[0],spec:st[x[1]]?(byId(st[x[1]])||{}).name:x[2],apg:st[x[1]]||null,fix:g=>{st[x[1]]=g.id}}));return o}},
 {k:"access",label:"Access requests and reviews",mod:"Identity and access",scr:"r15_iam",probe(){const st=A.stg=A.stg||{};const o=[];[["Joiner package approval","acc_j","Line manager"],["Mover package approval","acc_m","New line manager"],["Separation package approval","acc_l","HR partner"],["Access review certification","acc_r","Permission-set owner"],["Privileged access request","acc_p","Security lead"]].forEach(x=>o.push({rec:x[0],spec:st[x[1]]?(byId(st[x[1]])||{}).name:x[2],apg:st[x[1]]||null,fix:g=>{st[x[1]]=g.id}}));return o}},
 {k:"rel",label:"Release go or no-go",mod:"Releases",scr:"itsm_rel",probe(){const o=[];G(()=>RELX.releases).forEach(r=>o.push({rec:r.id,spec:r.apg?(byId(r.apg)||{}).name:r.rm,apg:r.apg||null,fix:g=>{r.apg=g.id}}));return o}},
 {k:"kcs",label:"Knowledge review",mod:"Knowledge management",scr:"kcs_home",probe(){const o=[];G(()=>KCSX.items()).forEach(k=>{if(k.st==="In review"||k.rvw)o.push({rec:k.id,spec:k.apg?(byId(k.apg)||{}).name:k.rvw,apg:k.apg||null,fix:g=>{k.apg=g.id}})});return o}},
 {k:"pto",label:"Time-off approval",mod:"Org chart",scr:"org_chart",probe(){const st=A.stg=A.stg||{};return [{rec:"PTO and leave request",spec:st.pto?(byId(st.pto)||{}).name:"Requester's manager",apg:st.pto||null,fix:g=>{st.pto=g.id}}]}},
 {k:"status",label:"Change status (leave, separation)",mod:"Status catalog",scr:"r16h_status",probe(){const o=[];G(()=>R16H.status.defs()).forEach(d=>o.push({rec:d.label,spec:d.apg?(byId(d.apg)||{}).name:d.approver,apg:d.apg||null,fix:g=>{d.apg=g.id}}));return o}},
 {k:"ent",label:"Data entity promotion",mod:"Data atlas",scr:"plat_data",probe(){const st=A.stg=A.stg||{};return [{rec:"Proposed entity approval",spec:st.ent?(byId(st.ent)||{}).name:"Casey Rowan",apg:st.ent||null,fix:g=>{st.ent=g.id}}]}},
 {k:"sow",label:"Contract and SOW changes",mod:"SOW analyzer",scr:"ppm_sow",probe(){const st=A.stg=A.stg||{};return [{rec:"Contract change approval",spec:st.sow?(byId(st.sow)||{}).name:"Casey Rowan",apg:st.sow||null,fix:g=>{st.sow=g.id}}]}},
 {k:"gapp",label:"Citizen app certification and debt",mod:"Citizen apps, Technical debt",scr:"plat_gate",probe(){const st=A.stg=A.stg||{};return [{rec:"App certification",spec:st.gapp?(byId(st.gapp)||{}).name:"Casey Rowan",apg:st.gapp||null,fix:g=>{st.gapp=g.id}},{rec:"Platform debt acceptance",spec:st.debt?(byId(st.debt)||{}).name:"Casey Rowan",apg:st.debt||null,fix:g=>{st.debt=g.id}}]}},
 {k:"agent",label:"AI agent sponsor approval",mod:"Agent runtime",scr:"tower",probe(){const st=A.stg=A.stg||{};return [{rec:"Tier gate on an agent result",spec:st.agent?(byId(st.agent)||{}).name:"Agent sponsor",apg:st.agent||null,fix:g=>{st.agent=g.id}}]}}];
const TARGET={flow:null,gate:null,chg:null,cat:"apg_line",gatefin:null,doa:null,budreq:null,inv:"apg_fin",time:"apg_line",req:null,access:null,rel:"apg_release",kcs:"apg_know",pto:"apg_line",status:"apg_people",ent:"apg_data",sow:"apg_legal",gapp:"apg_platform",agent:"apg_ai"};
const DOA_G={T1:"apg_budget_owner",T2:"apg_portfolio_lead",T3:"apg_cio",T4:"apg_cfo",T5:"apg_ceo",T6:"apg_board_fin"};
const FORCED={"Procurement lead":"apg_procure","Victor Amaya":"apg_people","Position requisition (headcount)":"apg_people"};
function targetFor(path,slot){const cl=classify(slot.spec);if(cl.g&&cl.kind!=="individual")return cl.g;
 if(path.k==="doa"){const m=/^(T\d)/.exec(slot.rec);if(m&&DOA_G[m[1]])return byId(DOA_G[m[1]])}
 if(path.k==="req")return byId(/headcount/.test(slot.rec)?"apg_people":"apg_procure");
 if(path.k==="access")return byId(/review/i.test(slot.rec)?"apg_service_owner":/Privileged/.test(slot.rec)?"apg_arch_sec":/Separation/.test(slot.rec)?"apg_people":"apg_line");
 if(path.k==="budreq"){const M={"Triage":"apg_portfolio_lead","Finance review":"apg_fin","Architecture and security review":"apg_arch_sec","Business value scoring":"apg_portfolio_lead","Portfolio council ranking":"apg_portfolio_board","Funding decision":"apg_cio"};return byId(M[slot.rec])}
 if(TARGET[path.k])return byId(TARGET[path.k]);
 if(cl.kind==="individual"&&cl.g)return cl.g;
 if(path.k==="gatefin"||path.k==="chg"){return cl.g}
 return null}
/* ---------- audit ---------- */
let AUD=null,AUDT=0;
function audit_(force){if(AUD&&!force&&Date.now()-AUDT<2500)return AUD;seed();
 const rows=[];PATHS.forEach(p=>{const slots=G(()=>p.probe(),[])||[];const sum={path:p,n:slots.length,grp:0,ind:0,role:0,unk:0,fixable:0,sample:[]};
  slots.forEach(s=>{let st;if(s.apg&&byId(s.apg))st="group";else{const cl=classify(s.spec);st=cl.kind==="group"?"group":cl.kind==="role"?"role":cl.kind==="individual"?"individual":"unknown";s._cl=cl}
   s.status=st;s.target=st==="group"?byId(s.apg)||(s._cl&&s._cl.g):targetFor(p,s);
   if(st==="group")sum.grp++;else if(st==="individual")sum.ind++;else if(st==="role")sum.role++;else sum.unk++;
   if(st!=="group"&&s.target)sum.fixable++;if(st!=="group"&&sum.sample.length<5)sum.sample.push(s);s.path=p});
  sum.slots=slots;rows.push(sum)});
 const tot=rows.reduce((a,r)=>a+r.n,0),grp=rows.reduce((a,r)=>a+r.grp,0);
 AUD={rows,tot,grp,gap:tot-grp,pct:tot?Math.round(100*grp/tot):100,ind:rows.reduce((a,r)=>a+r.ind,0),role:rows.reduce((a,r)=>a+r.role,0),unk:rows.reduce((a,r)=>a+r.unk,0)};AUDT=Date.now();return AUD}
function migrate(only){const a=audit_(true);const before={tot:a.tot,grp:a.grp,gap:a.gap};let n=0,left=0;
 a.rows.forEach(r=>{if(only&&only!==r.path.k)return;r.slots.forEach(s=>{if(s.status==="group")return;const t=s.target||targetFor(r.path,s);if(t&&s.fix){G(()=>{s.fix(t);n++})}else left++})});
 AUD=null;const b=audit_(true);A.migrated={at:TODAY,before,moved:n,left,after:{tot:b.tot,grp:b.grp,gap:b.gap}};A.version++;
 G(()=>{if(window.PROCLIB&&PROCLIB.refresh)PROCLIB.refresh()});
 R.log("Approval groups: migrated approval slots to groups",n+" slots",left?left+" need a decision":"none left");G(()=>{INBOX.refresh&&INBOX.refresh()});return A.migrated}
function gaps(){const a=audit_();const out=[];a.rows.forEach(r=>r.slots.forEach(s=>{if(s.status!=="group")out.push({path:r.path.label,scr:r.path.scr,rec:s.rec,spec:s.spec,kind:s.status,target:s.target&&s.target.name,why:s.status==="individual"?"Approver is a named person; the step must point at a group":s.status==="role"?"Approver is a role name, not a registered group":"Approver is not recognised"})}));
 A.groups.forEach(g=>{if(g.kind==="static"&&g.members.length<2)out.push({path:"Group registry",scr:"r16h_groups",rec:g.name,spec:g.members.join(", ")||"no members",kind:"group-size",why:"A group with fewer than two members cannot cover absence or separation of duties"});
  if(g.kind==="static"&&!g.members.length)out.push({path:"Group registry",scr:"r16h_groups",rec:g.name,spec:"no members",kind:"group-empty",why:"Approvals to this group cannot be decided"})});return out}
E.audit=audit_;E.gaps=gaps;E.migrate=migrate;
/* ---------- recording who acted ---------- */
function record(groupId,by,dec,item,note){seed();A.log.unshift({t:Date.now(),group:groupId,by,dec,item,note:note||""});if(A.log.length>400)A.log.length=400;G(()=>{if(window.STORE&&STORE.put)STORE.put("approver_action",{id:"AGA-"+Date.now().toString(36),group:groupId,by,dec,item,note:note||""})});G(()=>{if(window.EVENTS&&EVENTS.emit)EVENTS.emit("approval.group_decided",{group:groupId,by,decision:dec,item},{source:"r16h_groups",actor:by})})}
const actsFor=(item)=>A.log.filter(l=>l.item===item);
/* ---------- PR-20: ONE routing source for catalog, budget and change approvals (R14) ----------
   APG.route(kind,rec)  -> {kind,id,name,members,why,legacy}   the group that holds the decision on this record
   APG.check(actor,kind,rec) -> {ok,rule,why,group}           "sod" (requester never decides own), "group" (actor not a member), "member"
   PERM.approverOf (mod_r16g_a_perm) is an adapter over route(): it returns the legacy GRP-* id of the same group.
   The inbox adapters (below and in mod_r16g_b_enforce) and BUDREQ.decide call check(); neither keeps its own routing table. */
const KIND={budget_request:"budget_request",budreq:"budget_request",change_request:"change_request",chg:"change_request",catalog:"catalog",cat:"catalog",request_item:"catalog",invoice:"invoice",inv:"invoice",payment:"invoice"};
const BR_STAGE={tri:"apg_portfolio_lead",fin:"apg_fin",arc:"apg_arch_sec",val:"apg_portfolio_lead",cnc:"apg_portfolio_board",dec:"apg_cio"};
const LEGACY_GRP={budget_request:{apg_portfolio_lead:"GRP-PORT",apg_portfolio_board:"GRP-PORT",apg_fin:"GRP-FINREV",apg_arch_sec:"GRP-ARCH",apg_cio:"GRP-BUD",apg_budget_owner:"GRP-BUD",apg_cfo:"GRP-BUD",apg_ceo:"GRP-BUD",apg_board_fin:"GRP-BUD"},change_request:{"*":"GRP-CAB"},invoice:{"*":"GRP-AP"},catalog:{"*":"GRP-GEN"}};
const KLABEL={budget_request:"budget request",change_request:"change",catalog:"catalog request",invoice:"invoice"};
function doaGroup(amt){if(amt==null||isNaN(+amt))return null;const t=G(()=>S.bud.doa.find(z=>z.max==null||+amt<=z.max),null);return t&&DOA_G[t.id]||null}
function route(kind,rec){seed();const k=KIND[kind]||kind;rec=rec||{};let gid=null,why="";const st=A.stg||{};
 if(!KLABEL[k])return null;
 if(rec.apg&&byId(rec.apg)){gid=rec.apg;why="The approval step names this group"}
 else if(k==="budget_request"){const s=rec.stage||rec.st||"dec";const amt=rec.amount!=null?rec.amount:rec.amt;
  if(s==="dec"&&doaGroup(amt)){gid=doaGroup(amt);why="Funding decision: the delegation of authority tier for the amount"}
  else if(st[s]&&byId(st[s])){gid=st[s];why="Budget stage set to this group"}
  else{gid=BR_STAGE[s]||"apg_portfolio_board";why="Budget request stage routes to this group"}}
 else if(k==="change_request"){const t=rec.role&&byToken(rec.role);if(t){gid=t.id;why="The change stage role "+rec.role+" maps to this group"}else{gid="apg_cab";why="Changes route to the change advisory board"}}
 else if(k==="catalog"){gid=st.cat&&byId(st.cat)?st.cat:"apg_line";why="Catalog approvals route to the requester's line management unless the item names a group"}
 else if(k==="invoice"){gid=st.inv&&byId(st.inv)?st.inv:"apg_fin";why="Invoices route to finance approvers"}
 let g=byId(gid);if(!g)return null;const ctx={requester:rec.requester,service:rec.service};let gap=false;
 /* the step still names a person who is not in the routed group: route to that person's group in the same scope, and count it as a gap */
 if(rec.named&&members(g,ctx).indexOf(rec.named)<0){const sc=SCOPE_OF[k];const gs=A.groups.filter(x=>members(x,ctx).indexOf(rec.named)>=0);const fb=gs.find(x=>(x.scope||[]).indexOf(sc)>=0)||gs[0];
  if(fb){g=fb;gap=true;why="The step names "+rec.named+", who is not in the routed group; it routes to their group "+fb.name+" until the step is moved"}}
 const L=LEGACY_GRP[k]||{};
 return{kind:k,id:g.id,name:g.name,members:members(g,ctx),why,gap,legacy:L[g.id]||L["*"]||"GRP-GEN"}}
const SCOPE_OF={budget_request:"budreq",change_request:"chg",catalog:"cat",invoice:"inv"};
function check(actor,kind,rec){rec=rec||{};const k=KIND[kind]||kind;const r=route(k,rec);
 if(!actor)return{ok:false,rule:"actor",why:"No acting person is known",group:r&&r.id};
 if(rec.requester&&actor===rec.requester)return{ok:false,rule:"sod",why:"Separation of duties: "+actor+" raised this "+(KLABEL[k]||"request")+" and can never approve it",group:r&&r.id};
 if(!r)return{ok:true,rule:"unrouted",why:"No routed group for "+kind,group:null};
 if(r.members.indexOf(actor)<0)return{ok:false,rule:"group",why:"This "+(KLABEL[k]||"approval")+" is held by "+r.name+"; "+actor+" is not a member"+(r.members.length?" (members: "+r.members.slice(0,4).join(", ")+")":""),group:r.id};
 return{ok:true,rule:"member",why:actor+" decides as a member of "+r.name,group:r.id}}
/* record for an inbox item, so the adapters check the same rule */
function recOfItem(k,it){it=it||{};const kind=KIND[k];if(!kind)return null;
 if(kind==="change_request"){const c=G(()=>ITSMX.getChange(it.sid),null);const s=G(()=>c.stages[it.sx].ap[it.ax],null);return{id:it.sid,requester:(c&&c.req)||it.req||"",apg:s&&s.apg||null,role:s&&s.r||"",named:s&&s.w||"",service:c&&c.svc}}
 if(kind==="catalog"){const r=G(()=>REQREG.find(x=>x.id===it.sid),null);const a=r&&r.ap&&r.ap[it.ap];return{kind:"catalog",id:it.sid,requester:it.req||(r&&(r.requester||r.onBehalfOf))||"",apg:a&&a.apg||null,named:a&&a.who||""}}
 if(kind==="budget_request"){const r=G(()=>BUDREQ.requests().find(q=>q.id===it.sid),null);return{id:it.sid,requester:r?r.req:it.req||"",stage:r?r.st:it.sx,amount:r?r.amt:it.amt,named:r?G(()=>BUDREQ.rev(r.st,r).name,""):""}}
 if(kind==="invoice")return{id:it.sid,requester:it.req||""};return null}
const denied=[];
function noteDenial(actor,kind,rec,c){denied.unshift({t:Date.now(),actor,kind,id:rec&&rec.id||"",rule:c.rule,why:c.why});if(denied.length>100)denied.length=100;G(()=>audit("Approval refused",actor+" · "+c.why))}
Object.assign(E,{route,check,recOfItem,denials:()=>denied.slice(),noteDenial,KIND});
Object.assign(E,{groups:()=>(seed(),A.groups),get:id=>(seed(),byId(id)),byName:n=>(seed(),byName(n)),byToken:t=>(seed(),byToken(t)),members,isMember:(ref,p,ctx)=>(seed(),isMember(ref,p,ctx)),groupsOf:p=>(seed(),groupsOf(p)),colleagues,classify,record,actsFor,quorumText,log:()=>A.log,state:A,
 nameOf:id=>{const g=byId(id);return g?g.name:id},resolveSlot:(tok)=>{seed();const c=classify(tok);return c}});
window.APG=E;
/* ---------- events and metrics ---------- */
if(window.EVENTS&&EVENTS.register)G(()=>EVENTS.register({id:"approval.group_decided",label:"Approval group decided",module:"r16h_groups",owner:"Casey Rowan",fields:[{name:"group",type:"text"},{name:"by",type:"ref",ref:"person"},{name:"decision",type:"enum"},{name:"item",type:"text"}]}));
else setTimeout(()=>G(()=>EVENTS.register({id:"approval.group_decided",label:"Approval group decided",module:"r16h_groups",owner:"Casey Rowan",fields:[{name:"group",type:"text"},{name:"by",type:"ref",ref:"person"},{name:"decision",type:"enum"},{name:"item",type:"text"}]})),2500);
/* ---------- INBOX: group shown, members can act ---------- */
const ADK={chg:"Change approvals",cat:"Catalog approvals",gate:"Funding gates",flow:"Workflow approvals",wfrun:"Workflow runs",budreq:"Budget requests",inv:"Invoices",rel:"Releases",kcs:"Knowledge",ent:"Data entities",sow:"Contracts",fab:"Connectors",gapp:"Certification",debt:"Debt",mat:"Maturity",work:"Assigned work"};
const EXPAND={chg:1,cat:1,gate:1,flow:1,kcs:1,rel:1};
const FLOWKIND={budget:"apg_budget_owner",contract:"apg_legal",sla:"apg_service_owner",service:"apg_service_owner",change:"apg_cab",security:"apg_arch_sec",access:"apg_line",demand:"apg_portfolio_board",release:"apg_release",catalog:"apg_line"};
function groupOfItem(it){seed();const k=it.src;
 /* catalog, budget and change resolve through route(): one source (PR-20) */
 if(k==="chg"||k==="cat"||k==="budreq"){const ro=route(k,recOfItem(k,it));return ro?byId(ro.id):null}
 if(k==="gate"){const q=G(()=>FIN._h.F.gq.find(x=>x.id===it.sid),null);if(q&&q.apg)return byId(q.apg);return byToken(q&&q.role)||byId("apg_cio")}
 if(k==="flow"){let amt=it.amt;if(it.kindKey==="budget"&&amt!=null){const t=G(()=>S.bud.doa.find(z=>z.max==null||amt<=z.max),null);if(t&&DOA_G[t.id])return byId(DOA_G[t.id])}return byId(FLOWKIND[it.kindKey]||"apg_cio")}
 if(k==="wfrun"){return null}
 const D={inv:"apg_fin",rel:"apg_release",kcs:"apg_know",ent:"apg_data",sow:"apg_legal",fab:"apg_data",gapp:"apg_platform",debt:"apg_platform",mat:"apg_platform"};return D[k]?byId((A.stg||{})[k]||D[k]):null}
const MARK=Symbol("r16h");
function wrapAdapters(){if(!(window.INBOX&&INBOX.adapters))return false;seed();let n=0;
 Object.keys(INBOX.adapters).forEach(k=>{const ad=INBOX.adapters[k];if(!ad||ad[MARK]||!ad.list)return;ad[MARK]=1;n++;const ol=ad.list.bind(ad);
  ad.list=function(me){let items=ol(me)||[];
   if(EXPAND[k]){const have=new Set(items.map(i=>i.id));colleagues(me,k).slice(0,12).forEach(m=>{(ol(m)||[]).forEach(i=>{if(have.has(i.id))return;if(i.req===me)return;have.add(i.id);i.viaGroup=m;items.push(i)})})}
   items.forEach(it=>{if(it.apgDone)return;it.apgDone=1;const g=groupOfItem(Object.assign({src:k},it));if(!g&&k!=="wfrun")return;
    if(g){it.apg=g.id;it.apgName=g.name;const log=actsFor(it.sid||it.id);it.ev=(it.ev||[]).slice();it.ev.unshift(["Approver group",g.name+" · "+quorumText(g)+" · "+members(g,{requester:it.req}).length+" members",""]);
     G(()=>{const nn=window.APPR&&APPR.noteFor&&APPR.noteFor(Object.assign({src:k},it));if(nn)it.ev.push(nn)});
     if(log.length)it.ev.push(["Group decisions",log.slice(0,4).map(l=>l.by+" "+l.dec).join("; "),"good"]);
     if(isMember(g,me,{requester:it.req}))it.why=(it.viaGroup?"Routed to "+g.name+" and shown to you as a member (named approver: "+it.viaGroup+"). ":"You act as a member of "+g.name+". ")+(it.why||"")}});
   return items};
  /* PR-20: group binding and "never your own request" hold on every decision, whatever the permission toggle says */
  const bind=(it)=>{if(!KIND[k])return null;const rec=recOfItem(k,it);const c=check(R.viewer(),k,rec);if(c.ok)return null;noteDenial(R.viewer(),KIND[k],rec,c);return{ok:false,why:c.why,rule:c.rule}};
  if(ad.approve){const oa=ad.approve.bind(ad);ad.approve=function(it,note){const me=R.viewer();const no=bind(it);if(no)return no;const r=actAs(k,it,"approve",note,oa);if(r&&r.ok!==false&&it.apg)record(it.apg,me,"approved",it.sid||it.id,note);return r}}
  if(ad.reject){const orj=ad.reject.bind(ad);ad.reject=function(it,why){const me=R.viewer();const no=bind(it);if(no)return no;const r=orj(it,why);if(r&&r.ok!==false&&it.apg)record(it.apg,me,"rejected",it.sid||it.id,why);return r}}});
 return n>0}
function actAs(k,it,mode,note,orig){
 if(it.viaGroup||it.apg){
  if(k==="chg"){const s=G(()=>ITSMX.getChange(it.sid).stages[it.sx].ap[it.ax],null);if(s&&s.w&&s.w!==R.viewer()){const c=G(()=>ITSMX.getChange(it.sid),null);if(c&&c.req===R.viewer())return{ok:false,why:"Separation of duties: the requester cannot approve their own change"};const r=ITSMX.approve(it.sid,s.w,(note||"Approved")+" (recorded for "+(it.apgName||"the group")+" by "+R.viewer()+")");return r}}
  if(k==="cat"&&it.viaGroup){const r0=G(()=>REQREG.find(x=>x.id===it.sid),null);const w=r0&&r0.ap&&r0.ap[it.ap]&&r0.ap[it.ap].who;if(w)return window.svcApprove(it.sid,w,(note||"Approved")+" (by "+R.viewer()+" for "+(it.apgName||"the group")+")")}}
 return orig(it,note)}
/* ---------- screen ---------- */
const TABS=["Overview","Approver groups","Approval paths","Activity","Gap check"];
const gname=id=>{const g=byId(id);return g?g.name:id};
function kindPillG(g){return g.kind==="dynamic"?R.pill("Resolved per request","mute"):R.pill("Static","info")}
function statusPill(s){return s==="group"?R.pill("Group","good"):s==="individual"?R.pill("Named person","bad"):s==="role"?R.pill("Role name","warn"):R.pill("Unknown","bad")}
function overview(){const a=audit_(),gs=gaps();const small=A.groups.filter(g=>g.kind==="static"&&g.members.length<3).length;const noDel=A.groups.filter(g=>!(g.delegates||[]).length).length;
 const people=R.people();const inAny=new Set();A.groups.forEach(g=>g.members.forEach(m=>inAny.add(m)));
 const mig=A.migrated;
 return `<div class="statrow">${R.kp("Approval slots audited",a.tot,a.rows.length+" approval paths",{metric:"m_r16_apg_cov"})}${R.kp("Routed to a group",a.pct+"%",a.grp+" of "+a.tot+" slots",{cls:a.pct<100?"warn":"",metric:"m_r16_apg_cov"})}${R.kp("Pointing at a person",a.ind,"must become a group",{cls:a.ind?"bad":""})}${R.kp("Approver groups",A.groups.length,small+" with fewer than 3 members")}${R.kp("People in no group",people.filter(p=>!inAny.has(p)).length,"of "+people.length+" on the chart")}</div>
 ${card("Where approvals stand","Every approval step names a group. People appear only as members of the group that holds the step, and the inbox shows which member acted.",`
  <div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:12px"><button type="button" class="btn primary" data-r16g="migrate">${a.gap?"Migrate "+a.gap+" slots to groups":"Run the audit again"}</button><button type="button" class="btn" data-r16g="newgroup">New approver group</button><button type="button" class="btn quiet" data-r16g="tab" data-t="4">Open gap check (${gs.length})</button></div>
  ${mig?`<p class="small muted">Last migration ${H(fmtD(mig.at))}: ${mig.moved} slots moved to groups (${mig.before.grp} of ${mig.before.tot} before, ${mig.after.grp} of ${mig.after.tot} after)${mig.left?"; "+mig.left+" need a decision":""}.</p>`:""}
  <div class="tscroll"><table><thead><tr><th>Approval path</th><th>Module</th><th class="num">Slots</th><th class="num">Group</th><th class="num">Person</th><th class="num">Role name</th><th></th></tr></thead><tbody>${a.rows.map(r=>`<tr><td><b>${H(r.path.label)}</b></td><td>${H(r.path.mod)}</td><td class="num">${U.esc(r.n)}</td><td class="num">${r.grp}</td><td class="num">${r.ind?`<span class="pill bad">${r.ind}</span>`:0}</td><td class="num">${r.role+r.unk?`<span class="pill warn">${r.role+r.unk}</span>`:0}</td><td><button type="button" class="chip" data-link="screen:${H(r.path.scr)}">Open</button></td></tr>`).join("")}</tbody></table></div>`)}`}
function groupsTab(){const q=A.q.toLowerCase();const L=A.groups.filter(g=>!q||(g.name+" "+g.desc+" "+g.members.join(" ")).toLowerCase().indexOf(q)>=0);
 return `${card("Approver groups","Members, delegates and quorum. A delegate acts for a member until a date. Dynamic groups resolve their members from the org chart or the service registry for each request.",`
 <div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:12px"><input class="txtin" type="search" data-r16g-q placeholder="Search groups or members" aria-label="Search groups" value="${H(A.q)}" style="min-width:240px"><button type="button" class="btn primary" data-r16g="newgroup">New approver group</button></div>
 <div class="tscroll"><table><thead><tr><th>Group</th><th>Members</th><th>Quorum</th><th>Delegates</th><th>Used by</th><th></th></tr></thead><tbody>${L.map(g=>`<tr><td><b>${H(g.name)}</b> ${kindPillG(g)}<div class="muted small">${H(g.desc)}</div></td><td>${members(g).slice(0,4).map(m=>pchip(m)).join(" ")}${members(g).length>4?` <span class="muted small">+${members(g).length-4}</span>`:""}</td><td>${H(quorumText(g))}</td><td>${(g.delegates||[]).length?(g.delegates||[]).map(d=>`<span class="pill info">${H(first(d.member))} to ${H(first(d.to))}${d.until?" until "+H(fmtD(d.until)):""}</span>`).join(" "):'<span class="muted small">None</span>'}</td><td>${(g.scope||[]).slice(0,4).map(s=>`<span class="pill mute">${H(ADK[s]||s)}</span>`).join(" ")}${(g.scope||[]).length>4?` <span class="muted small">+${g.scope.length-4}</span>`:""}</td><td class="org5-act"><button type="button" class="btn sm" data-r16g="edit" data-id="${H(g.id)}">Edit</button><button type="button" class="btn sm quiet" data-r16g="deleg" data-id="${H(g.id)}">Delegate</button></td></tr>`).join("")}</tbody></table></div>`)}`}
function pathsTab(){const a=audit_();const f=A.flt;const rows=[];a.rows.forEach(r=>r.slots.forEach(s=>{if(f==="all"||(f==="gap"&&s.status!=="group")||(f===s.status))rows.push(s)}));
 return `${card("Every approval path","Each row is one approval step. The check compares what the step names with the group registry. Migrate moves the step to the group in the last column; the named person stays as a member.",`
 <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:12px">${[["all","All"],["gap","Not a group"],["individual","Named person"],["role","Role name"],["group","Group"]].map(x=>`<button type="button" class="chip" data-r16g="flt" data-v="${x[0]}" aria-pressed="${A.flt===x[0]}">${x[1]}</button>`).join("")}<button type="button" class="btn sm primary" data-r16g="migrate" ${a.gap?"":"disabled"}>Migrate all (${a.gap})</button><span class="muted small">${rows.length} rows${rows.length>120?", first 120 shown":""}</span></div>
 <div class="tscroll"><table><thead><tr><th>Path</th><th>Record</th><th>Approver as written</th><th>State</th><th>Group</th><th></th></tr></thead><tbody>${rows.slice(0,120).map((s,i)=>`<tr><td>${H(s.path.label)}</td><td><code>${H(s.rec)}</code></td><td>${H(s.spec||"(none)")}</td><td>${statusPill(s.status)}</td><td>${s.target?`<b>${H(s.target.name)}</b>`:'<span class="muted">No match: pick a group</span>'}</td><td>${s.status!=="group"?`<button type="button" class="btn sm" data-r16g="fixone" data-p="${H(s.path.k)}" data-r="${H(s.rec)}">${s.target?"Move":"Pick group"}</button>`:""}</td></tr>`).join("")||`<tr><td colspan="6" class="muted">Nothing matches this filter.</td></tr>`}</tbody></table></div>`)}`}
function activity(){const L=A.log;return `${card("Who in the group acted","Each decision names the group and the member who made it. A member can act only on a step held by a group they belong to.",L.length?`<div class="tscroll"><table><thead><tr><th>When</th><th>Group</th><th>Member who acted</th><th>Decision</th><th>Item</th><th>Note</th></tr></thead><tbody>${L.slice(0,60).map(l=>`<tr><td>${H(new Date(l.t).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}))}</td><td>${H(gname(l.group))}</td><td>${pchip(l.by)}</td><td><span class="pill ${l.dec==="approved"?"good":"bad"}">${H(l.dec)}</span></td><td><code>${H(l.item)}</code></td><td class="muted small">${H(l.note||"")}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">No group decisions yet.</p>`)}`}
function gapTab(){const gs=gaps();return `${card("Gap check","Flags any approval step that points at a person or an unregistered role, and any group too small to cover absence.",gs.length?`<div class="tscroll"><table><thead><tr><th>Path</th><th>Record</th><th>Written as</th><th>Why it is flagged</th><th>Suggested group</th></tr></thead><tbody>${gs.slice(0,150).map(g=>`<tr><td>${H(g.path)}</td><td><code>${H(g.rec)}</code></td><td>${H(g.spec)}</td><td>${H(g.why)}</td><td>${g.target?H(g.target):'<span class="muted">None</span>'}</td></tr>`).join("")}</tbody></table></div>`:`<p class="story"><span class="pill good">Clear</span> Every approval step points at a registered group and every group has at least two members.</p>`)}`}
R.addScreen({id:"r16h_groups",name:"Approval groups",own:"Casey Rowan",bk:"Rina Okafor",navGroup:"auto",hint:"Groups, members, delegates and quorum; audit of every approval path",k:"approver group approvals members delegate quorum audit individual migrate gap check inbox",std:["cobit","nist"],
 trigger:"An approval step is created or a group changes",
 ents:[{id:"approver_group",label:"Approver group",domain:"gov",note:"Integration decision: new, thin. team and person exist, but no entity holds a group that owns approval steps with delegates and quorum. Members and the optional manager chain reference person; the group never copies person data.",fields:[R.F("name","Name","string","internal",1),R.F("kind","Kind","enum","internal"),R.F("members","Members","ref","internal",1),R.F("quorum_mode","Quorum mode","enum","internal"),R.F("quorum_n","Quorum count","number","internal"),R.F("delegates","Delegates","ref","internal"),R.F("scope","Used by approval paths","text","internal")],n:21,path:"S.r16h.apg.groups"},
  {id:"approver_action",label:"Approver action",domain:"gov",note:"Integration decision: reuse first. approval already holds the request; this thin record keeps which member of the group acted, so the group stays the approver and the person the actor.",fields:[R.F("group","Group","ref","internal",1),R.F("by","Member who acted","ref","internal",1),R.F("dec","Decision","enum","internal"),R.F("item","Item","text","internal"),R.F("note","Note","text","internal")],n:5,path:"S.r16h.apg.log"},
  {id:"approval",extend:true,label:"Approval",decision:"Extend approval: the approver field becomes a reference to approver_group, and acted_by records the member.",fields:[R.F("approver_group","Approver group","ref"),R.F("acted_by","Acted by (member)","ref")]}],
 steps:[["Define the group","Name the group, its members, delegates and quorum.","human","Casey Rowan","1 day","Need for an approval","Registered group"],["Route the step","An approval step names the group; people are never named on a step.","robot","Approval service","Immediate","Registered group","Step held by a group"],["Show members the item","The inbox lists the item for every member, with the group and quorum.","robot","Inbox","Immediate","Step held by a group","Inbox item"],["Decide as a member","A member approves or rejects; delegates act for absent members.","human","Group member","Per SLA","Inbox item","Decision by a member"],["Audit the paths","The gap check flags steps that point at a person and groups that are too small.","gate","Rina Okafor","Weekly","All approval steps","Gap list and migrations"]],
 met:[["m_r16_apg_cov","Approval steps routed to a group","Approval steps that name a registered group ÷ all approval steps audited × 100","%",100,100,90,"max","Move the step to a group","Approval groups, Approval paths tab"],["m_r16_apg_small","Approver groups with fewer than two members","Static groups with fewer than 2 members ÷ all static groups × 100","%",0,0,10,"min","Add a member or a delegate","Approval groups, Gap check tab"]],
 fin:[["adm_sec","Group membership from the directory","person","api"],["org_chart","People and managers","person","api"],["inbox","Pending approvals","approval","event","Inbox opened"]],fout:[["inbox","Group on each approval item","approval","event","Approval created"],["adm_audit","Group decisions","approver_action","event","Member decides"],["flw_design","Groups for approval steps","approver_group","api","Step edited"]]});
R.apg_screen=true;
/* PR-32 B9: another sample company sees its own approver groups. Its approval policies name a team (grp); the team is the group, its
   members are the team's people. The routing engine (APG) and its Atlantic Systems groups are unchanged; this view only reads tenant rows (R18). */
function tenantView(){const teams=TROWS("teams"),pol=TROWS("approval_policies"),ppl=G(()=>DATA.get("people").filter(p=>p.kind==="human"),[]);
 const LB={doa:"Delegation of authority",control:"Spend control",rule:"Approval rule",binding:"Approval binding"};
 const use=t=>pol.filter(r=>r.grp===t.id);const mem=t=>{const m=ppl.filter(p=>p.team===t.n).map(p=>p.name);if(t.mgr&&m.indexOf(t.mgr)<0)m.unshift(t.mgr);return m};
 const gs=teams.filter(t=>use(t).length);const routed=pol.filter(r=>r.grp&&teams.some(t=>t.id===r.grp)).length;const pct=pol.length?Math.round(100*routed/pol.length):0;
 const org=(DATA.tenantInfo()||{}).org||"";
 const groupsT=gs.length?`<div class="tscroll"><table><thead><tr><th>Group</th><th>Members</th><th>Used by</th></tr></thead><tbody>${gs.map(t=>{const m=mem(t),u=use(t);return `<tr><td><b>${H(t.n)}</b> <code>${H(t.id)}</code><div class="muted small">${H(t.fn||"")}</div></td><td>${m.slice(0,4).map(x=>pchip(x)).join(" ")}${m.length>4?` <span class="muted small">+${m.length-4}</span>`:""}</td><td>${[...new Set(u.map(r=>LB[r.part]||r.part))].map(x=>`<span class="pill mute">${H(x)}</span>`).join(" ")} <span class="muted small">${u.length}</span></td></tr>`}).join("")}</tbody></table></div>`:TGAP("approver groups");
 const pathsT=pol.length?`<div class="tscroll"><table><thead><tr><th>Path</th><th>Record</th><th>Approver as written</th><th>Group</th></tr></thead><tbody>${pol.map(r=>{const t=teams.find(x=>x.id===r.grp);return `<tr><td>${H(LB[r.part]||r.part)}</td><td><code>${H(r.id)}</code><div class="muted small">${H(r.name||r.label||r.cat||"")}</div></td><td>${H(r.role||r.owner||"(none)")}</td><td>${t?`<b>${H(t.n)}</b>`:'<span class="muted">No group</span>'}</td></tr>`}).join("")}</tbody></table></div>`:TGAP("approval paths");
 return `<div class="screen">${hero("Automate · Approvals","Approval groups",pol.length?`<b>${pct}%</b> of ${pol.length} approval policies at ${H(org)} name a group.`:`${H(org)} has no approval policies in this sample yet.`,`<div class="row" style="gap:8px;flex-wrap:wrap">${fchipT("m_r16_apg_cov")}${fchipT("m_r16_apg_small")}<button class="btn" data-link="screen:r16h_rules">Approval rules</button></div>`)}${lensNote()}
 ${views("r16g_tabsT",["Approver groups","Approval paths","Activity"],[card("Approver groups","Each team named on an approval policy acts as the group. Members are the people of that team.",groupsT),card("Every approval path","Each approval policy of this company and the group that holds it.",pathsT),card("Who in the group acted","Decisions by group members.",TGAP("group decisions"))])}${procCard("r16h_groups")}</div>`}
REG("r16h_groups","Approval groups","automate","M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2 20c0-3 3-5 6-5s6 2 6 5M15 15c3 0 7 1 7 5",()=>{if(!TCORE())return tenantView();seed();const a=audit_();
 return `<div class="screen">${hero("Automate · Approvals","Approval groups",`<b>${a.pct}%</b> of ${a.tot} approval steps name a group. ${a.ind} still point at a person.`,`<div class="row" style="gap:8px;flex-wrap:wrap">${fchip("m_r16_apg_cov")}${fchip("m_r16_apg_small")}<button class="btn" data-link="screen:r16h_rules">Approval rules</button></div>`)}${lensNote()}
 ${views("r16g_tabs",TABS,[overview(),groupsTab(),pathsTab(),activity(),gapTab()])}${procCard("r16h_groups")}</div>`});
G(()=>DATA.screen("r16h_groups",{mode:"data",entities:["approval_policies","teams","people"]}));
/* ---------- forms and clicks ---------- */
const peopleOpts=()=>R.people().map(p=>[p,p]);
function groupForm(g){const isNew=!g;g=g||{id:"apg_"+Date.now().toString(36),name:"",desc:"",members:[],delegates:[],quorum:{mode:"any",n:1},scope:[],tokens:[],kind:"static"};
 openForm({id:"r16g_edit",title:isNew?"New approver group":"Edit "+g.name,story:"People act on approvals only as members of a group. Quorum says how many members must approve.",submit:isNew?"Create group":"Save group",
  fields:[{k:"name",label:"Group name",req:true,wide:true},{k:"desc",label:"What it approves",type:"longtext",wide:true},{k:"members",label:"Members",type:"multi",opts:peopleOpts(),req:true,help:"Dynamic groups also resolve members from the org chart for each request."},{k:"mode",label:"Quorum",type:"chips",opts:[["any","Any one"],["all","All members"],["nofm","N of M"],["first","First responder"]]},{k:"n",label:"Members needed (N of M)",type:"number",min:1,max:12,show:v=>v.mode==="nofm"}],
  defaults:{name:g.name,desc:g.desc,members:g.members.slice(),mode:g.quorum.mode,n:g.quorum.n||2},
  live:v=>{const m=(v.members||[]).length;return m<2?`<span class="pill warn">Fewer than two members cannot cover absence</span>`:`<span class="muted small">${m} members · ${v.mode==="nofm"?v.n+" of "+m:v.mode==="all"?"all "+m:"any one"}</span>`},
  onSubmit:v=>{const nm=String(v.name||"").trim();if(!nm)return{close:false,toast:"Name the group"};if(!(v.members||[]).length)return{close:false,toast:"Add at least one member"};const dup=A.groups.find(x=>x.name.toLowerCase()===nm.toLowerCase()&&x.id!==g.id);if(dup)return{close:false,toast:"A group with that name exists"};
   g.name=nm;g.desc=v.desc||"";g.members=v.members.slice();g.quorum={mode:v.mode||"any",n:+v.n||1};if(isNew){g.owner=g.members[0];g.backup=g.members[1]||g.members[0];A.groups.push(g)}A.version++;AUD=null;R.log(isNew?"Approver group created":"Approver group edited",g.name);render();return{close:true,toast:"Saved "+g.name}}})}
function delegForm(g){openForm({id:"r16g_deleg",title:"Delegate for "+g.name,story:"A delegate can act for a member until the end date. The group remains the approver.",submit:"Add delegate",fields:[{k:"member",label:"Member who is away",type:"select",opts:g.members.map(m=>[m,m]),req:true},{k:"to",label:"Delegate",type:"select",opts:peopleOpts(),req:true},{k:"until",label:"Until",type:"date",req:true}],defaults:{member:g.members[0],to:"",until:addDays(TODAY,14)},
  onSubmit:v=>{if(v.to===v.member)return{close:false,toast:"Pick someone else"};g.delegates.push({member:v.member,to:v.to,until:v.until});A.version++;R.log("Approver delegate added",g.name,v.member+" to "+v.to);render();return{close:true,toast:"Delegate added"}}})}
function pickGroupForm(p,rec){const a=audit_();const row=a.rows.find(r=>r.path.k===p);const s=row&&row.slots.find(x=>x.rec===rec);if(!s)return;
 openForm({id:"r16g_pick",title:"Choose the group for this step",story:rec+" in "+row.path.label+" currently names "+(s.spec||"nobody")+".",submit:"Move to group",fields:[{k:"g",label:"Approver group",type:"select",opts:A.groups.map(g=>[g.id,g.name+" ("+members(g).length+")"]),req:true}],defaults:{g:s.target?s.target.id:A.groups[0].id},
  onSubmit:v=>{const g=byId(v.g);if(!g||!s.fix)return{close:false,toast:"Not available"};s.fix(g);AUD=null;R.log("Approval step moved to a group",rec,g.name);render();return{close:true,toast:"Moved to "+g.name}}})}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r16g]");if(!b)return;const k=b.dataset.r16g;seed();
 if(k==="migrate"){const m=migrate();toast(m.moved+" approval steps now name a group"+(m.left?"; "+m.left+" need a decision":""),m.left?"warn":"good");render()}
 else if(k==="newgroup")groupForm(null);else if(k==="edit")groupForm(byId(b.dataset.id));else if(k==="deleg")delegForm(byId(b.dataset.id));
 else if(k==="tab"){S.v.r16g_tabs=+b.dataset.t;render()}else if(k==="flt"){A.flt=b.dataset.v;S.v.r16g_tabs=2;render()}
 else if(k==="fixone"){const a=audit_();const row=a.rows.find(r=>r.path.k===b.dataset.p);const s=row&&row.slots.find(x=>x.rec===b.dataset.r);if(s&&s.target&&s.fix){s.fix(s.target);AUD=null;R.log("Approval step moved to a group",s.rec,s.target.name);toast("Moved to "+s.target.name,"good");render()}else pickGroupForm(b.dataset.p,b.dataset.r)}});
document.addEventListener("input",e=>{const i=e.target.closest&&e.target.closest("[data-r16g-q]");if(!i)return;A.q=i.value;clearTimeout(A._qt);A._qt=setTimeout(()=>{S.v.r16g_tabs=1;render();const x=document.querySelector("[data-r16g-q]");if(x){x.focus();x.setSelectionRange(x.value.length,x.value.length)}},250)});
/* ---------- search and chat ---------- */
SEARCHX.push(()=>(seed(),A.groups.map(g=>({g:"Approver groups",t:g.name,m:quorumText(g)+" · "+g.members.length+" members",c:"--p3",f:()=>{S.v.r16g_tabs=1;A.q=g.name;go("r16h_groups")},k:"approver group "+g.name+" "+g.members.join(" ")+" "+g.tokens.join(" ")}))));
ASKX.push(q=>{const t=String(q||"").toLowerCase();seed();
 let m=t.match(/(?:who (?:is|are) in|members of)\s+(?:the\s+)?(.+?)\??$/);if(m){const g=byName(m[1].trim())||A.groups.find(x=>x.name.toLowerCase().indexOf(m[1].trim())>=0);if(g){go("r16h_groups");say(q,{t:"<b>"+H(g.name)+"</b> ("+H(quorumText(g))+"): "+members(g).map(H).join(", ")+".",steps:["Read the approver group registry"]});return true}}
 if(/approval (path|group)s?|which approvals.*(person|individual)|approvals? (point|route|go)/.test(t)||/group.*approv/.test(t)){const a=audit_();go("r16h_groups");say(q,{t:"<b>"+a.pct+"%</b> of "+a.tot+" approval steps name a group; "+a.ind+" point at a named person and "+(a.role+a.unk)+" at a role name or unknown.",steps:["Audited "+a.rows.length+" approval paths"]});return true}
 if(/who (can|may) approve/.test(t)&&/group/.test(t)){go("r16h_groups");return false}return false});
/* ---------- boot: wrap adapters, migrate seed data once, light and batched ---------- */
let tries=0;function boot(){seed();R.installAliases();if(!wrapAdapters()&&++tries<20)return setTimeout(boot,900);
 if(!A.migrated){setTimeout(()=>{try{migrate()}catch(e){console.error("r16h migrate",e)}},400)}
 /* re-wrap adapters added later (Run monitor, agent runtime) */
 setTimeout(wrapAdapters,3000);setTimeout(wrapAdapters,7000)}
if(document.readyState==="complete")setTimeout(boot,1800);else window.addEventListener("load",()=>setTimeout(boot,1800));
})();
