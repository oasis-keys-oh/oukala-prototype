/* ===== Round 16, Agent H, part D: Approval rules, nested approvals in the style of ServiceNow approval rules.
   A rule is an ordered tree of levels (sequential or parallel branches). Each level names an approver GROUP, a mode (any one, all, n of m,
   first responder), a condition on the record, a skip condition, an escalation timer, delegation and outcome handling.
   Product base rules plus a tenant overlay (set / insert / remove) with a diff view. The R15 workflow runtime and the inbox honor it
   through window.APPR (approval node attribute a.rule). Screen r16h_rules. ===== */
(function(){
"use strict";
const R=window.R16H;if(!R)return;
const {G,H,TODAY,fmtD}=R;
const P=S.r16h.appr=Object.assign({rules:[],overlays:{},binds:[],insts:[],sel:"rule_purchase",mode:"base",tenant:"Meridian Standards Foundation",seeded:false,seq:1,sim:{},selInst:null,tab:0,ver:{}},S.r16h.appr||{});
const E={};
const nowMs=()=>G(()=>WF.clock().sim,Date.now());
const hrs=ms=>ms/36e5;
/* ---------- expression evaluator (no eval): record field conditions ---------- */
function tok(s){const t=[];let i=0;while(i<s.length){const c=s[i];if(/\s/.test(c)){i++;continue}
  if(/[0-9]/.test(c)||(c==="-"&&/[0-9]/.test(s[i+1]||"")&&(!t.length||/^(op|\(|,|\[)$/.test(t[t.length-1].k)))){let j=i+1;while(j<s.length&&/[0-9.]/.test(s[j]))j++;t.push({k:"n",v:parseFloat(s.slice(i,j))});i=j;continue}
  if(c==="'"||c==='"'){let j=i+1;while(j<s.length&&s[j]!==c)j++;t.push({k:"s",v:s.slice(i+1,j)});i=j+1;continue}
  const two=s.slice(i,i+2);if(["==","!=",">=","<=","&&","||"].indexOf(two)>=0){t.push({k:"op",v:two});i+=2;continue}
  if("><!".indexOf(c)>=0){t.push({k:"op",v:c});i++;continue}
  if("()[],".indexOf(c)>=0){t.push({k:c});i++;continue}
  if(/[A-Za-z_]/.test(c)){let j=i+1;while(j<s.length&&/[A-Za-z0-9_.]/.test(s[j]))j++;const w=s.slice(i,j);const lw=w.toLowerCase();
   if(lw==="and")t.push({k:"op",v:"&&"});else if(lw==="or")t.push({k:"op",v:"||"});else if(lw==="not")t.push({k:"op",v:"!"});else if(lw==="in"||lw==="contains"||lw==="startswith")t.push({k:"op",v:lw});else if(lw==="true"||lw==="false")t.push({k:"b",v:lw==="true"});else t.push({k:"id",v:w});i=j;continue}
  throw new Error("Unexpected "+c)}return t}
function parse(t){let p=0;const pk=()=>t[p],nx=()=>t[p++];
 function prim(){const a=nx();if(!a)throw new Error("Unexpected end");if(a.k==="n"||a.k==="s"||a.k==="b")return{t:"lit",v:a.v};
  if(a.k==="("){const e=or();if(!nx()||t[p-1].k!==")")throw new Error("Missing )");return e}
  if(a.k==="["){const L=[];while(pk()&&pk().k!=="]"){L.push(prim());if(pk()&&pk().k===",")nx()}nx();return{t:"list",v:L}}
  if(a.k==="op"&&a.v==="!"){return{t:"not",e:cmp()}}
  if(a.k==="id"){if(pk()&&pk().k==="("){nx();const args=[];while(pk()&&pk().k!==")"){args.push(or());if(pk()&&pk().k===",")nx()}nx();return{t:"call",n:a.v,args}}return{t:"id",v:a.v}}
  throw new Error("Unexpected token")}
 function cmp(){let l=prim();while(pk()&&pk().k==="op"&&["==","!=",">","<",">=","<=","in","contains","startswith"].indexOf(pk().v)>=0){const o=nx().v;const r=prim();l={t:"cmp",o,l,r}}return l}
 function and(){let l=cmp();while(pk()&&pk().k==="op"&&pk().v==="&&"){nx();l={t:"and",l,r:cmp()}}return l}
 function or(){let l=and();while(pk()&&pk().k==="op"&&pk().v==="||"){nx();l={t:"or",l,r:and()}}return l}
 const e=or();if(p<t.length)throw new Error("Unexpected "+JSON.stringify(t[p]));return e}
const getF=(rec,path)=>{let v=rec;String(path).split(".").forEach(k=>{if(v==null)return;const kk=Object.keys(v).find(x=>x.toLowerCase()===k.toLowerCase());v=kk!==undefined?v[kk]:undefined});return v};
function ev(a,rec){switch(a.t){case"lit":return a.v;case"list":return a.v.map(x=>ev(x,rec));case"id":return getF(rec,a.v);case"not":return !ev(a.e,rec);case"and":return !!(ev(a.l,rec)&&ev(a.r,rec));case"or":return !!(ev(a.l,rec)||ev(a.r,rec));
 case"call":{const ar=a.args.map(x=>ev(x,rec));if(a.n==="member")return G(()=>APG.isMember(ar[1],ar[0]),false);if(a.n==="len")return String(ar[0]==null?"":ar[0]).length;if(a.n==="lower")return String(ar[0]).toLowerCase();return undefined}
 case"cmp":{const l=ev(a.l,rec),r=ev(a.r,rec);const eq=(x,y)=>(typeof x==="number"||typeof y==="number")?+x===+y:String(x==null?"":x).toLowerCase()===String(y==null?"":y).toLowerCase();
  switch(a.o){case"==":return eq(l,r);case"!=":return !eq(l,r);case">":return +l>+r;case"<":return +l<+r;case">=":return +l>=+r;case"<=":return +l<=+r;case"in":return Array.isArray(r)&&r.some(x=>eq(x,l));case"contains":return Array.isArray(l)?l.some(x=>eq(x,r)):String(l==null?"":l).toLowerCase().indexOf(String(r).toLowerCase())>=0;case"startswith":return String(l==null?"":l).toLowerCase().indexOf(String(r).toLowerCase())===0}}}return false}
const CC={};
function cond(expr,rec){expr=String(expr||"").trim();if(!expr)return{ok:true,empty:true};try{const ast=CC[expr]||(CC[expr]=parse(tok(expr)));return{ok:!!ev(ast,rec||{})}}catch(e){return{ok:false,err:String(e.message||e)}}}
E.cond=cond;
/* ---------- tree helpers ---------- */
const clone=o=>JSON.parse(JSON.stringify(o));
const walkN=(n,f,p,i)=>{f(n,p,i);(n.items||[]).forEach((c,k)=>walkN(c,f,n,k))};
const findN=(root,id)=>{let r=null;walkN(root,(n,p,i)=>{if(n.id===id&&!r)r={n,p,i}});return r};
const levels=root=>{const o=[];walkN(root,n=>{if(n.t==="lvl")o.push(n)});return o};
const LV=(id,title,group,mode,o)=>Object.assign({id,t:"lvl",title,group,mode:mode||"any",n:2,cond:"",skip:"",esc:null,deleg:true,onReject:"stop",sla:24},o||{});
const SQ=(id,items)=>({id,t:"seq",items});
const PR=(id,items,join)=>({id,t:"par",join:join||"all",items});
/* ---------- seed ---------- */
function seed(){if(P.seeded)return;P.seeded=true;
 const RL=(id,name,entity,desc,root,sample,o)=>Object.assign({id,name,entity,desc,root,sample,product:true,version:"1.0",owner:"Casey Rowan",backup:"Jordan Lee"},o||{});
 P.rules=[
  RL("rule_purchase","Standard purchase approval","request_item","Catalog requests that cost money: manager, budget owner, then security and finance in parallel, then an executive for large amounts.",
   SQ("R",[LV("L1","Manager approval","apg_line","any",{skip:"amount < 100",sla:24}),LV("L2","Budget owner","apg_budget_owner","any",{cond:"amount > 500",sla:24}),
    PR("P1",[LV("L3a","Security review","apg_arch_sec","any",{cond:"category in ['Software','Access','Cloud']",sla:48,esc:{afterH:48,to:"apg_cio",act:"notify"}}),LV("L3b","Finance review","apg_fin","any",{cond:"amount >= 5000",sla:48})],"all"),
    LV("L4","Executive approval","apg_cio","any",{cond:"amount > 50000",sla:48,esc:{afterH:48,to:"apg_cfo",act:"reassign"},onReject:"stop"})]),
   {amount:62000,category:"Software",risk:"medium",requester:"Priya Shah",department:"Portfolio and delivery"}),
  RL("rule_budget","Budget request approval","budget_request","Triage, then finance and architecture in parallel, a council vote, then the funding decision by delegated authority.",
   SQ("R",[LV("B1","Triage","apg_portfolio_lead","any",{sla:48}),PR("BP",[LV("B2a","Finance review","apg_fin","any",{sla:72}),LV("B2b","Architecture and security review","apg_arch_sec","any",{sla:96})],"all"),
    LV("B3","Portfolio council ranking","apg_portfolio_board","nofm",{n:2,sla:48,cond:"amount >= 25000"}),LV("B4","Funding decision","apg_cio","any",{sla:48,cond:"amount >= 100000",esc:{afterH:72,to:"apg_ceo",act:"notify"}}),LV("B5","Finance sign-off","apg_cfo","any",{sla:48,cond:"amount >= 250000"})]),
   {amount:48000,type:"Increase",risk:"High",requester:"Tom Becker",department:"Service desk and operations"}),
  RL("rule_change","Change approval (CAB)","change_request","Normal and emergency changes: change manager, service owner and finance in parallel, the board, then an executive for high risk.",
   SQ("R",[LV("C1","Change manager","apg_cab","nofm",{n:3,sla:24,cond:"type != 'Standard'"}),PR("CP",[LV("C2a","Service owner","apg_service_owner","any",{sla:24}),LV("C2b","Finance for any cost","apg_fin","any",{cond:"cost > 0",sla:48})],"all"),
    LV("C3","Executive for high risk","apg_cio","any",{cond:"risk == 'High' || type == 'Emergency'",sla:12,esc:{afterH:12,to:"apg_cio",act:"notify"}})]),
   {type:"Normal",risk:"High",cost:40000,environment:"Production",service:"Search and indexing",requester:"Tom Becker"}),
  RL("rule_invoice","Invoice approval","invoice","Finance approvers by amount, then the CFO office above $100,000.",SQ("R",[LV("I1","Finance approval","apg_fin","any",{sla:48}),LV("I2","CFO sign-off","apg_cfo","any",{cond:"amount > 100000",sla:48})]),{amount:120000,vendor:"Lumen",requester:"Dev Rao"}),
  RL("rule_vendor","Vendor onboarding approval","vendor","CIO, security and procurement all approve, at the same time.",SQ("R",[PR("VP",[LV("V1","Procurement review","apg_procure","any",{sla:48}),LV("V2","Security review","apg_arch_sec","any",{sla:72}),LV("V3","Executive approval","apg_cio","any",{sla:48})],"all")]),{amount:90000,vendor:"Northwind",requester:"Camille Ortega"}),
  RL("rule_portfolio","Demand decision","demand","The portfolio board decides with two of its members.",SQ("R",[LV("D1","Controller screen","apg_fin","any",{sla:24,cond:"amount > 10000"}),LV("D2","Portfolio board","apg_portfolio_board","nofm",{n:2,sla:72})]),{amount:80000,requester:"Maya Ortiz"}),
  RL("rule_line","Line manager approval","timesheet","The requester's manager approves.",SQ("R",[LV("M1","Line manager","apg_line","any",{sla:48})]),{hours:42,requester:"Femi Adeyemi"}),
  RL("rule_status_sep","Separation approval","person_status","Resignation, retirement, layoff or dismissal: manager, People Operations, then legal for dismissals and layoffs.",SQ("R",[LV("S1","Line manager","apg_line","any",{sla:24}),LV("S2","People Operations","apg_people","any",{sla:24}),LV("S3","Legal review","apg_legal","any",{cond:"status in ['terminated','laid_off']",sla:24}),LV("S4","Executive approval","apg_cio","any",{cond:"level == 'Executive' || status == 'terminated'",sla:24})]),{status:"terminated",level:"Staff",requester:"Tom Becker"}),
  RL("rule_status_leave","Leave approval","person_status","Long absences: manager and People Operations. Short absences need the manager only.",SQ("R",[LV("A1","Line manager","apg_line","any",{sla:24}),LV("A2","People Operations","apg_people","any",{sla:48,cond:"days > 14"})]),{status:"parental_leave",days:84,requester:"Leah Moss"}),
  RL("rule_access","Access request approval","access_request","Manager, then the owner of the permission set; privileged access adds security.",SQ("R",[LV("X1","Line manager","apg_line","any",{sla:24}),PR("XP",[LV("X2a","Permission-set owner","apg_service_owner","any",{sla:24}),LV("X2b","Security lead","apg_arch_sec","any",{cond:"privileged == true",sla:48})],"all")]),{privileged:true,requester:"Colette Brandt"})];
 /* tenant overlay: the customer wants a second approval above $25,000 and Security first when the category is Access */
 P.overlays={rule_purchase:[{id:"op1",op:"set",node:"L4",field:"cond",value:"amount > 25000",note:"Executive approval from $25,000, not $50,000",by:"Casey Rowan",at:"2026-09-30"},
  {id:"op2",op:"insert",parent:"R",after:"L4",node:LV("x1","CFO second approval","apg_cfo","any",{cond:"amount > 50000",sla:48}),note:"Two approvals above $50,000: executive, then CFO office",by:"Casey Rowan",at:"2026-09-30"}],
  rule_budget:[{id:"op3",op:"set",node:"B3",field:"n",value:3,note:"Council needs three of its members",by:"Maya Ortiz",at:"2026-10-02"}]};
 P.binds=[
  {id:"bd1",kind:"catalog",ref:"laptop",label:"Laptop request",rule:"rule_purchase"},{id:"bd2",kind:"catalog",ref:"software",label:"Software license",rule:"rule_purchase"},{id:"bd3",kind:"catalog",ref:"access",label:"System access",rule:"rule_access"},
  {id:"bd4",kind:"budget_request",ref:"*",label:"All budget requests",rule:"rule_budget"},{id:"bd5",kind:"change",ref:"Normal",label:"Normal changes",rule:"rule_change"},{id:"bd6",kind:"change",ref:"Emergency",label:"Emergency changes",rule:"rule_change"},
  {id:"bd7",kind:"invoice",ref:"*",label:"All invoices",rule:"rule_invoice"},{id:"bd8",kind:"timesheet",ref:"*",label:"Weekly timesheets",rule:"rule_line"},{id:"bd9",kind:"status",ref:"separation",label:"Separation statuses",rule:"rule_status_sep"},{id:"bd10",kind:"status",ref:"absence",label:"Long absence statuses",rule:"rule_status_leave"},
  {id:"bd11",kind:"workflow",ref:"wf_inv/AP1",label:"Workflow: invoice approval",rule:"rule_invoice"},{id:"bd12",kind:"workflow",ref:"wf_vend/AP1",label:"Workflow: vendor onboarding",rule:"rule_vendor"},{id:"bd13",kind:"workflow",ref:"wf_dem/AP1",label:"Workflow: demand decision",rule:"rule_portfolio"},{id:"bd14",kind:"workflow",ref:"wf_hire/AP1",label:"Workflow: hire approval",rule:"rule_line"}]}
const ruleById=id=>(seed(),P.rules.find(r=>r.id===id)||null);
/* ---------- overlay ---------- */
function applyOps(base,ops,keep){const root=clone(base.root);const info={added:[],changed:{},removed:[]};
 (ops||[]).forEach(op=>{
  if(op.op==="set"){const f=findN(root,op.node);if(!f)return;const k=op.field;const old=k.indexOf(".")>0?null:f.n[k];if(k.indexOf(".")>0){const [a,b]=k.split(".");f.n[a]=f.n[a]||{};f.n[a][b]=op.value}else f.n[k]=op.value;(info.changed[op.node]=info.changed[op.node]||[]).push({field:k,from:old,to:op.value,op:op.id})}
  else if(op.op==="insert"){const pf=findN(root,op.parent||"R");if(!pf)return;const arr=pf.n.items;const node=clone(op.node);let at=arr.length;if(op.after==="first")at=0;else if(op.after){const j=arr.findIndex(x=>x.id===op.after);at=j>=0?j+1:arr.length}arr.splice(at,0,node);walkN(node,n=>info.added.push(n.id))}
  else if(op.op==="remove"){const f=findN(root,op.node);if(!f||!f.p)return;if(keep){f.n._removed=1;info.removed.push(op.node)}else f.p.items.splice(f.i,1);info.removed.push(op.node)}});
 return{root,info}}
function effective(rule,keep){seed();const ops=P.overlays[rule.id]||[];return applyOps(rule,ops,keep)}
E.effectiveRoot=id=>{const r=ruleById(id);return r?effective(r).root:null};
function numbering(root){const m={};levels(root).forEach((l,i)=>{if(!l._removed)m[l.id]=Object.keys(m).length+1});return m}
/* ---------- engine ---------- */
const memOf=(inst,lv)=>{const g=G(()=>APG.get(lv.group),null);return g?G(()=>APG.members(g,{requester:inst.requester,service:inst.rec&&inst.rec.service}),[]).filter(m=>m!==inst.requester):[]};
function instantiate(ruleId,rec,o){o=o||{};seed();const rule=ruleById(ruleId);if(!rule)return null;const eff=effective(rule);
 const inst={id:"AI-"+(1000+P.seq++),ruleId,ver:rule.version+(P.overlays[ruleId]&&P.overlays[ruleId].length?"+"+P.overlays[ruleId].length:""),rec:clone(rec||{}),requester:o.requester||(rec&&rec.requester)||"",source:o.source||"simulation",wf:o.wf||"",state:"running",nodes:{},trace:[],t0:o.now||nowMs(),root:eff.root};
 settle(inst,o.now||nowMs());return inst}
function settle(inst,now){let guard=0,res;do{res=run(inst.root,inst,now);guard++}while(inst._again&&guard<12&&!(inst._again=false));
 if(res==="done"){inst.state="approved";inst.t1=now}else if(res==="rejected"){inst.state="rejected";inst.t1=now}else if(res==="returned"){inst.state="returned";inst.t1=now}return res}
function run(n,inst,now){
 if(n.t==="lvl"){let st=inst.nodes[n.id];
  if(!st){const c=cond(n.cond,inst.rec);if(!c.ok){inst.nodes[n.id]={st:"skipped",why:c.err?"Condition error: "+c.err:"Condition not met: "+n.cond};inst.trace.push({t:now,id:n.id,ev:"skipped",why:inst.nodes[n.id].why});return "done"}
   if(n.skip){const s=cond(n.skip,inst.rec);if(s.ok){inst.nodes[n.id]={st:"skipped",why:"Skip condition true: "+n.skip};inst.trace.push({t:now,id:n.id,ev:"skipped",why:inst.nodes[n.id].why});return "done"}}
   const mem=memOf(inst,n);if(!mem.length){inst.nodes[n.id]={st:"skipped",why:"No eligible member in "+G(()=>APG.nameOf(n.group),n.group)+" (the requester cannot approve their own request)"};inst.trace.push({t:now,id:n.id,ev:"skipped",why:inst.nodes[n.id].why});return "done"}
   st=inst.nodes[n.id]={st:"active",decs:[],since:now,need:needOf(n,mem.length),pool:mem.length};inst.trace.push({t:now,id:n.id,ev:"active",why:"Sent to "+G(()=>APG.nameOf(n.group),n.group)+" ("+modeText(n,mem.length)+")"})}
  if(st.st==="approved"||st.st==="skipped")return "done";
  if(st.st==="rejected"){return n.onReject==="continue"?"done":n.onReject==="return"?"returned":"rejected"}
  return "blocked"}
 if(n.t==="seq"){for(const c of n.items){if(c._removed)continue;const r=run(c,inst,now);if(r!=="done")return r}return "done"}
 if(n.t==="par"){const rs=n.items.filter(c=>!c._removed).map(c=>run(c,inst,now));if(rs.indexOf("rejected")>=0)return "rejected";if(rs.indexOf("returned")>=0)return "returned";
  if(n.join==="any"){if(rs.indexOf("done")>=0){n.items.forEach(c=>walkN(c,x=>{const s=inst.nodes[x.id];if(x.t==="lvl"&&s&&s.st==="active"){s.st="skipped";s.why="Another branch finished first (join: any)"}}));return "done"}return "blocked"}
  return rs.every(r=>r==="done")?"done":"blocked"}
 return "done"}
function needOf(n,pool){return n.mode==="all"?pool:n.mode==="nofm"?Math.min(pool,Math.max(1,+n.n||2)):1}
const MODE={any:"any one member",all:"all members",nofm:"n of m",first:"first responder"};
function modeText(n,pool){return n.mode==="all"?"all "+pool+" members":n.mode==="nofm"?(Math.min(pool,+n.n||2))+" of "+pool:n.mode==="first"?"first responder":"any one of "+pool}
function activeLevels(inst){const o=[];walkN(inst.root,n=>{if(n.t==="lvl"){const s=inst.nodes[n.id];if(s&&s.st==="active")o.push(n)}});return o}
function activeGroups(inst){const g=[];activeLevels(inst).forEach(l=>{const nm=G(()=>APG.nameOf(l.group),l.group);if(g.indexOf(nm)<0)g.push(nm)});return g}
function canAct(inst,lv,by){const s=inst.nodes[lv.id];if(!s||s.st!=="active")return{ok:false,why:"This level is not waiting"};if(by===inst.requester)return{ok:false,why:"Separation of duties: the requester cannot approve their own request"};
 if(!G(()=>APG.isMember(lv.group,by,{requester:inst.requester,service:inst.rec&&inst.rec.service}),false))return{ok:false,why:by+" is not a member of "+G(()=>APG.nameOf(lv.group),lv.group)};
 if(s.decs.some(d=>d.by===by))return{ok:false,why:by+" already decided at this level"};return{ok:true}}
function decide(inst,lvId,by,dec,note,now){now=now||nowMs();const f=findN(inst.root,lvId);if(!f)return{ok:false,why:"Unknown level"};const lv=f.n,s=inst.nodes[lvId];const c=canAct(inst,lv,by);if(!c.ok)return c;
 s.decs.push({by,dec,at:now,note:note||""});inst.trace.push({t:now,id:lvId,ev:dec,by,why:note||""});const pool=s.pool;
 const ap=s.decs.filter(d=>d.dec==="approve").length,rj=s.decs.filter(d=>d.dec==="reject").length,rt=s.decs.filter(d=>d.dec==="return").length;
 if(lv.mode==="first"){s.st=dec==="approve"?"approved":dec==="reject"?"rejected":"rejected";if(dec==="return")s.ret=1}
 else if(dec==="reject"&&(lv.mode!=="nofm"||rj>pool-s.need)){s.st="rejected"}
 else if(dec==="return"){s.st="rejected";s.ret=1}
 else if(ap>=s.need)s.st="approved";
 if(s.st!=="active"){s.at=now;inst.trace.push({t:now,id:lvId,ev:s.st,why:ap+" approved"+(rj?", "+rj+" rejected":"")})}
 if(s.ret)lv.onReject="return";
 const res=settle(inst,now);G(()=>{window.EVENTS&&EVENTS.emit&&EVENTS.emit("approval.level_decided",{rule:inst.ruleId,level:lvId,group:lv.group,by,decision:dec,state:inst.state},{source:"r16h_rules",actor:by})});
 G(()=>APG.record(lv.group,by,dec==="approve"?"approved":dec==="reject"?"rejected":"returned",inst.wf||inst.id,note));
 return{ok:true,state:inst.state,res}}
function tick(now){let n=0;P.insts.concat(wfInsts()).forEach(inst=>{if(inst.state!=="running")return;activeLevels(inst).forEach(lv=>{const s=inst.nodes[lv.id];const e=lv.esc;if(!e||s.esc||hrs(now-s.since)<e.afterH)return;s.esc=now;n++;const to=G(()=>APG.nameOf(e.to),e.to);
  inst.trace.push({t:now,id:lv.id,ev:"escalated",why:"No decision in "+e.afterH+" h: "+(e.act==="reassign"?"also sent to "+to:e.act==="approve"?"auto-approved":e.act==="reject"?"auto-rejected":"reminder sent to "+to)});
  if(e.act==="reassign"){lv._alt=e.to;s.alt=e.to}else if(e.act==="approve"){s.st="approved";s.at=now;settle(inst,now)}else if(e.act==="reject"){s.st="rejected";s.at=now;settle(inst,now)}})});
 return n}
let WFI=[];function wfInsts(){return WFI}
/* ---------- binding and lookup ---------- */
function ruleFor(kind,ref){seed();const L=P.binds.filter(b=>b.kind===kind);const x=L.find(b=>b.ref===ref)||L.find(b=>b.ref==="*");return x?ruleById(x.rule):null}
E.ruleFor=ruleFor;E.rules=()=>(seed(),P.rules);E.rule=ruleById;E.instantiate=instantiate;E.decide=decide;E.tick=tick;E.state=P;E.binds=()=>(seed(),P.binds);
/* ---------- R15 workflow runtime hooks ---------- */
function wfInst(i,n){const key="appr."+n.id;let x=i.ctx[key];if(!x||x.ruleId!==n.a.rule||!x.root){x=instantiate(n.a.rule,Object.assign({},i.ctx.rec||{},{requester:i.by}),{requester:i.by,source:"workflow "+i.id,wf:i.id,now:nowMs()});if(x){i.ctx[key]=x;WFI.push(x)}}else if(WFI.indexOf(x)<0)WFI.push(x);return x}
E.wfAuto=(i,n)=>{try{const x=wfInst(i,n);if(!x)return null;if(x.state==="approved")return "Approved";if(x.state==="rejected")return "Rejected";return null}catch(e){return null}};
E.wfWho=(i,n)=>{try{const x=wfInst(i,n);if(!x||x.state!=="running")return null;const g=activeGroups(x);return g.length?g:null}catch(e){return null}};
E.wfDecide=(i,t,how,by,note,onBehalf)=>{try{const n=G(()=>getNode(i,t),null);const x=i.ctx["appr."+t.node];if(!x||!x.root)return null;const dec=/reject/i.test(how&&how.decision||"")?"reject":/return/i.test(how&&how.decision||"")?"return":"approve";
  const act=activeLevels(x);if(!act.length)return null;let lv=null,who=by;
  if(onBehalf){lv=act[0];const mem=memOf(x,lv);who=mem[0]||by}else{lv=act.find(l=>canAct(x,l,by).ok);if(!lv){const why=canAct(x,act[0],by).why;return{err:why}}}
  const r=decide(x,lv.id,who,dec,note,nowMs());if(!r.ok)return{err:r.why};
  if(x.state==="running"){return{pending:true,who:activeGroups(x),detail:"Level "+(numbering(x.root)[lv.id]||"")+" decided by "+who+" for "+G(()=>APG.nameOf(lv.group),lv.group)}}
  return{done:true,port:x.state==="approved"?"Approved":x.state==="rejected"?"Rejected":"Returned",decision:x.state==="approved"?"Approved":x.state==="rejected"?"Rejected":"Returned"}}catch(e){console.error("appr wfDecide",e);return null}};
E.wfEv=(i,t)=>{try{const x=i.ctx["appr."+t.node];if(!x||!x.root)return[];const act=activeLevels(x),num=numbering(x.root);const rows=[["Approval rule",G(()=>ruleById(x.ruleId).name,x.ruleId)+" · "+x.ver,""]];
  act.forEach(l=>{const s=x.nodes[l.id];const done=s.decs.map(d=>d.by+" "+d.dec).join("; ");rows.push(["Level "+(num[l.id]||"")+": "+l.title,G(()=>APG.nameOf(l.group),l.group)+" · "+modeText(l,s.pool)+(done?" · acted: "+done:""),"info"])});
  const doneL=Object.keys(x.nodes).filter(k=>x.nodes[k].st==="approved"||x.nodes[k].st==="skipped");if(doneL.length)rows.push(["Earlier levels",doneL.map(k=>{const f=findN(x.root,k);return (f?f.n.title:k)+" "+x.nodes[k].st}).join("; "),"good"]);return rows}catch(e){return[]}};
function getNode(i,t){return null}
E.noteFor=it=>{try{const map={chg:["change",null],budreq:["budget_request","*"],cat:["catalog",null],inv:["invoice","*"]};const m=map[it.src];if(!m)return null;let ref=m[1];if(it.src==="chg"){const c=ITSMX.getChange(it.sid);ref=c&&c.type}if(it.src==="cat"){ref=null}const r=ruleFor(m[0],ref||"*");return r?["Approval rule",r.name+" · "+levels(effective(r).root).length+" levels","info"]:null}catch(e){return null}};
window.APPR=E;
/* ---------- screen ---------- */
const TABS=["Rules","Designer","Simulate","Tenant overlay","Bindings","Running"];
const gN=id=>G(()=>APG.nameOf(id),id);
const gOpts=()=>G(()=>APG.groups().map(g=>[g.id,g.name]),[]);
function cur(){seed();return ruleById(P.sel)||P.rules[0]}
function chips(l){const o=[];if(l.cond)o.push(`<span class="r16r-c" title="Level applies when this is true">if ${H(l.cond)}</span>`);if(l.skip)o.push(`<span class="r16r-c skip" title="Level is skipped when this is true">skip if ${H(l.skip)}</span>`);if(l.esc)o.push(`<span class="r16r-c esc" title="Escalation timer">after ${l.esc.afterH} h: ${H(l.esc.act)} ${H(gN(l.esc.to))}</span>`);if(l.deleg)o.push(`<span class="r16r-c" title="Members may delegate">delegation on</span>`);if(l.onReject&&l.onReject!=="stop")o.push(`<span class="r16r-c">on reject: ${H(l.onReject)}</span>`);return o.join("")}
function lvlHTML(l,num,ctx){const d=ctx.diff&&ctx.diff.added.indexOf(l.id)>=0?"added":l._removed?"removed":ctx.diff&&ctx.diff.changed[l.id]?"changed":"";const st=ctx.inst&&ctx.inst.nodes[l.id];const stc=st?" "+st.st:"";
 const members=G(()=>APG.members(l.group,{requester:ctx.requester,service:ctx.service}).length,0);
 return `<div class="r16r-lvl ${d}${stc}" data-r16r-lvl="${H(l.id)}"><span class="r16r-num" aria-label="Step ${num||"-"}">${num||"·"}</span><div class="r16r-body"><div class="r16r-top"><b>${H(l.title)}</b>${d?`<span class="pill ${d==="added"?"good":d==="removed"?"bad":"warn"}">${d==="added"?"Customer":d==="removed"?"Removed":"Changed"}</span>`:""}${st?`<span class="pill ${st.st==="approved"?"good":st.st==="rejected"?"bad":st.st==="skipped"?"mute":"info"}">${H(st.st)}</span>`:""}</div>
  <div class="r16r-sub"><button type="button" class="chip" data-r16g="tab" data-t="1" data-link="screen:r16h_groups" title="Open the approver group">${H(gN(l.group))}</button><span class="muted small">${H(modeText(l,members))}${l.sla?" · SLA "+l.sla+" h":""}</span></div>
  <div class="r16r-chips">${chips(l)}</div>${st&&st.why?`<div class="muted small">${H(st.why)}</div>`:""}${st&&st.decs&&st.decs.length?`<div class="muted small">Acted: ${st.decs.map(x=>H(x.by+" "+x.dec)).join(", ")}</div>`:""}</div>
  ${ctx.edit?`<div class="r16r-act"><button type="button" class="btn sm" data-r16r="edit" data-id="${H(l.id)}" aria-label="Edit ${H(l.title)}">Edit</button><button type="button" class="btn sm quiet" data-r16r="del" data-id="${H(l.id)}" aria-label="Remove ${H(l.title)}">Remove</button></div>`:""}</div>`}
function insBtn(parent,after,ctx){return ctx.edit?`<div class="r16r-ins"><button type="button" class="r16r-plus" data-r16r="ins" data-parent="${H(parent)}" data-after="${H(after)}" aria-label="Insert a step here" title="Insert a step here">+</button></div>`:`<div class="r16r-ins ro"></div>`}
function nodeHTML(n,ctx,parent){
 if(n.t==="lvl")return lvlHTML(n,ctx.num[n.id],ctx);
 if(n.t==="seq"){const items=n.items;return `<div class="r16r-seq ${parent&&parent.t==="par"?"branch":parent?"nest":""}" data-r16r-node="${H(n.id)}">${items.map((c,i)=>insBtn(n.id,i?items[i-1].id:"first",ctx)+nodeHTML(c,ctx,n)).join("")}${insBtn(n.id,items.length?items[items.length-1].id:"first",ctx)}</div>`}
 if(n.t==="par"){return `<div class="r16r-par" data-r16r-node="${H(n.id)}"><div class="r16r-parh"><b>At the same time</b><span class="muted small">${n.join==="any"?"the first branch to finish is enough":"every branch must finish"}</span>${ctx.edit?`<button type="button" class="chip" data-r16r="join" data-id="${H(n.id)}">${n.join==="any"?"Require all":"First to finish"}</button><button type="button" class="chip" data-r16r="addbranch" data-id="${H(n.id)}">Add branch</button><button type="button" class="chip" data-r16r="del" data-id="${H(n.id)}">Remove block</button>`:""}</div><div class="r16r-branches">${n.items.map(c=>`<div class="r16r-br">${c.t==="lvl"?lvlHTML(c,ctx.num[c.id],ctx):nodeHTML(c,ctx,n)}</div>`).join("")}</div></div>`}
 return ""}
function treeHTML(root,ctx){ctx.num=numbering(root);return `<div class="r16r-tree" role="group" aria-label="Approval levels in order"><div class="r16r-start">Request submitted</div>${nodeHTML(root,ctx,null)}<div class="r16r-end">Approved</div></div>`}
function rulesTab(){seed();return `${card("Approval rules","A rule is an ordered tree of approval levels. Each level names an approver group. Product rules ship as a base; the tenant overlay changes them without editing the base.",`
 <div class="row" style="gap:10px;margin-bottom:12px"><button type="button" class="btn primary" data-r16r="newrule">New rule</button><button type="button" class="btn" data-r16r="clone">Copy selected rule</button></div>
 <div class="tscroll"><table><thead><tr><th>Rule</th><th>Applies to</th><th class="num">Levels</th><th>Overlay</th><th>Bound to</th><th>Owner</th><th></th></tr></thead><tbody>${P.rules.map(r=>{const eff=effective(r);const ov=(P.overlays[r.id]||[]).length;const bs=P.binds.filter(b=>b.rule===r.id);return `<tr class="${r.id===P.sel?"sel":""}"><td><b>${H(r.name)}</b>${r.product?" "+R.pill("Product","mute"):R.pill("Custom","info")}<div class="muted small">${H(r.desc)}</div></td><td><code>${H(r.entity)}</code></td><td class="num">${levels(eff.root).length}</td><td>${ov?R.pill(ov+" tenant change"+(ov===1?"":"s"),"warn"):'<span class="muted small">None</span>'}</td><td>${bs.length?bs.slice(0,3).map(b=>`<span class="pill mute">${H(b.label)}</span>`).join(" ")+(bs.length>3?` <span class="muted small">+${bs.length-3}</span>`:""):'<span class="pill warn">Not bound</span>'}</td><td>${pchip(r.owner)}</td><td class="org5-act"><button type="button" class="btn sm" data-r16r="open" data-id="${H(r.id)}">Design</button><button type="button" class="btn sm quiet" data-r16r="sim" data-id="${H(r.id)}">Simulate</button></td></tr>`}).join("")}</tbody></table></div>`)}`}
function designer(){const r=cur();const eff=effective(r,false);const edit=true;const tenant=P.mode==="tenant";const ops=P.overlays[r.id]||[];
 const diff=tenant?applyOps(r,ops,false).info:null;
 return `<div class="r16r-head">${card("Design: "+H(r.name),"Insert a level between any two steps with the plus. "+(tenant?"You are editing the tenant overlay: changes are stored as differences from the product rule.":"You are editing the product base rule; tenant overlays stay on top of it."),`
  <div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:14px"><label class="muted small" for="r16r_sel">Rule</label><select id="r16r_sel" class="txtin" data-r16r-pick aria-label="Choose the rule">${P.rules.map(x=>`<option value="${H(x.id)}" ${x.id===r.id?"selected":""}>${H(x.name)}</option>`).join("")}</select>
  <span class="r16r-seg" role="group" aria-label="What you edit"><button type="button" class="chip" data-r16r="mode" data-m="base" aria-pressed="${!tenant}">Product base</button><button type="button" class="chip" data-r16r="mode" data-m="tenant" aria-pressed="${tenant}">${H(P.tenant.split(" ")[0])} overlay${ops.length?" ("+ops.length+")":""}</button></span>
  <span class="muted small">${levels(eff.root).length} levels · version ${H(r.version)}${ops.length?" + "+ops.length+" tenant":""}</span></div>
  ${legend([["Customer change (added)","--good-f"],["Changed by the tenant","--warn-f"],["Waiting for a decision","--info-f"]])}
  ${treeHTML(eff.root,{edit,diff,requester:r.sample&&r.sample.requester})}`)}</div>`}
function simTab(){const r=cur();const sm=P.sim[r.id]=P.sim[r.id]||clone(r.sample||{});const inst=P.selInst&&P.insts.find(x=>x.id===P.selInst&&x.ruleId===r.id)||null;const eff=effective(r);
 const fields=Object.keys(sm);
 const preview=inst||(()=>{const t=instantiate(r.id,sm,{requester:sm.requester,source:"preview"});P.seq--;return t})();
 const lv=levels(preview.root);const num=numbering(preview.root);
 return `<div class="r16r-simgrid">${card("Sample record","Change a value to see which levels fire. Conditions read these fields.",`<div class="r16r-fields">${fields.map(k=>`<label class="r16r-f"><span>${H(k)}</span><input class="txtin" data-r16r-f="${H(k)}" value="${H(sm[k])}" aria-label="${H(k)}"></label>`).join("")}<button type="button" class="btn sm" data-r16r="addfield">Add a field</button></div>
  <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button type="button" class="btn primary" data-r16r="startsim" data-id="${H(r.id)}">Start a simulated approval</button><button type="button" class="btn" data-r16r="autosim" data-id="${H(r.id)}">Approve everything</button>${bindsWF(r).length?`<button type="button" class="btn" data-r16r="runwf" data-id="${H(r.id)}">Run in the workflow runtime</button>`:""}</div>`)}
  ${card("What the rule does for this record",inst?"Live simulation "+inst.id+": "+inst.state+".":"Preview of which levels fire, are skipped, or wait.",`
  <div class="statrow">${R.kp("Levels that apply",lv.filter(l=>preview.nodes[l.id]&&preview.nodes[l.id].st!=="skipped").length,"of "+lv.length)}${R.kp("Skipped",lv.filter(l=>preview.nodes[l.id]&&preview.nodes[l.id].st==="skipped").length,"condition not met")}${R.kp("Approver groups",activeGroups(preview).length||"-","waiting now")}${R.kp("State",preview.state,inst?inst.id:"preview")}</div>
  ${treeHTML(preview.root,{edit:false,inst:preview,requester:sm.requester,service:sm.service})}
  ${inst&&inst.state==="running"?`<div class="r16r-decide">${activeLevels(inst).map(l=>{const mem=memOf(inst,l);const s=inst.nodes[l.id];return `<div class="r16r-dl"><b>${H(l.title)}</b> <span class="muted small">${H(gN(l.group))} · ${s.decs.length} of ${s.need} needed</span><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px"><select class="txtin" data-r16r-who="${H(l.id)}" aria-label="Decide as">${mem.map(m=>`<option>${H(m)}</option>`).join("")}</select><button type="button" class="btn sm primary" data-r16r="dec" data-d="approve" data-l="${H(l.id)}">Approve</button><button type="button" class="btn sm" data-r16r="dec" data-d="reject" data-l="${H(l.id)}">Reject</button><button type="button" class="btn sm quiet" data-r16r="dec" data-d="return" data-l="${H(l.id)}">Return</button></div></div>`}).join("")}<div class="row" style="gap:6px;margin-top:10px"><button type="button" class="btn sm" data-r16r="adv" data-h="24">Advance 24 hours</button><button type="button" class="btn sm" data-r16r="adv" data-h="72">Advance 72 hours</button></div></div>`:""}
  ${inst&&inst.trace.length?`<div class="eyebrow" style="margin-top:14px">Trace</div><ol class="r16r-trace">${inst.trace.map(t=>`<li><b>${H(((findN(inst.root,t.id)||{}).n||{}).title||t.id)}</b> ${H(t.ev)}${t.by?" by "+H(t.by):""}<span class="muted small"> ${H(t.why||"")}</span></li>`).join("")}</ol>`:""}`)}</div>`}
function bindsWF(r){return P.binds.filter(b=>b.kind==="workflow"&&b.rule===r.id)}
function overlayTab(){const r=cur();const ops=P.overlays[r.id]||[];const d=applyOps(r,ops,true);
 const side=(root,label,info,showAdded)=>`<div class="r16r-side"><div class="eyebrow">${label}</div>${treeHTML(root,{edit:false,diff:showAdded?info:{added:[],changed:{}},requester:""})}</div>`;
 return `${card("Tenant overlay for "+H(r.name),"The product rule stays as shipped. "+H(P.tenant)+" adds, changes or removes levels on top of it. Each difference is listed and can be reverted.",`
 <div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:12px"><select class="txtin" data-r16r-pick aria-label="Choose the rule">${P.rules.map(x=>`<option value="${H(x.id)}" ${x.id===r.id?"selected":""}>${H(x.name)}</option>`).join("")}</select><button type="button" class="btn primary" data-r16r="open-tenant" data-id="${H(r.id)}">Edit the overlay</button>${ops.length?`<button type="button" class="btn quiet" data-r16r="revertall" data-id="${H(r.id)}">Revert all</button>`:""}</div>
 ${ops.length?`<div class="tscroll"><table><thead><tr><th>Change</th><th>Level</th><th>From</th><th>To</th><th>Why</th><th>By</th><th></th></tr></thead><tbody>${ops.map(o=>{const f=o.op==="insert"?{n:o.node}:findN(d.root,o.node)||findN(r.root,o.node)||{n:{title:o.node}};const bf=findN(r.root,o.node);return `<tr><td>${R.pill(o.op==="set"?"Changed":o.op==="insert"?"Added":"Removed",o.op==="insert"?"good":o.op==="remove"?"bad":"warn")}</td><td><b>${H(f.n.title||o.node)}</b></td><td>${o.op==="set"?H(String(bf&&bf.n[o.field.split(".")[0]]!=null?(o.field.indexOf(".")>0?(bf.n[o.field.split(".")[0]]||{})[o.field.split(".")[1]]:bf.n[o.field]):"(none)")+" ("+o.field+")"):"-"}</td><td>${o.op==="set"?H(String(o.value)):o.op==="insert"?H(gN(o.node.group)+" · "+modeText(o.node,0)+(o.node.cond?" · if "+o.node.cond:"")):"removed"}</td><td class="muted small">${H(o.note||"")}</td><td>${H(o.by||"")} ${H(o.at?fmtD(o.at):"")}</td><td><button type="button" class="btn sm quiet" data-r16r="revert" data-id="${H(o.id)}" data-r="${H(r.id)}">Revert</button></td></tr>`}).join("")}</tbody></table></div>`:`<p class="muted">No tenant changes. The rule runs exactly as the product ships it.</p>`}
 <div class="r16r-diff">${side(r.root,"Product rule",{added:[],changed:{}},false)}${side(d.root,H(P.tenant.split(" ")[0])+" effective rule",d.info,true)}</div>`)}`}
function bindTab(){seed();const kinds=[["catalog","Catalog item"],["budget_request","Budget request"],["change","Change"],["invoice","Invoice"],["timesheet","Timesheet"],["status","Person status"],["workflow","Workflow step"],["requisition","Requisition"],["access","Access request"]];
 return `${card("Bind rules to what needs approval","A binding says which rule decides a catalog item, a budget request, a change and so on. Workflow bindings are enforced by the workflow runtime; the others are shown in the inbox and resolved with APPR.ruleFor.",`
 <div class="row" style="gap:10px;margin-bottom:12px"><button type="button" class="btn primary" data-r16r="newbind">New binding</button></div>
 <div class="tscroll"><table><thead><tr><th>Applies to</th><th>Kind</th><th>Reference</th><th>Rule</th><th>Enforced</th><th></th></tr></thead><tbody>${P.binds.map(b=>{const r=ruleById(b.rule);return `<tr><td><b>${H(b.label)}</b></td><td>${H((kinds.find(k=>k[0]===b.kind)||[0,b.kind])[1])}</td><td><code>${H(b.ref)}</code></td><td>${r?`<button type="button" class="chip" data-r16r="open" data-id="${H(r.id)}">${H(r.name)}</button>`:'<span class="pill bad">Missing</span>'}</td><td>${b.kind==="workflow"?R.pill("Workflow runtime","good"):R.pill("Inbox and lookup","info")}</td><td class="org5-act"><button type="button" class="btn sm quiet" data-r16r="unbind" data-id="${H(b.id)}">Remove</button></td></tr>`}).join("")}</tbody></table></div>`)}`}
function runningTab(){const L=P.insts.concat(WFI).filter((x,i,a)=>a.indexOf(x)===i);return `${card("Running and finished approvals","Approvals started by a simulation or by the workflow runtime. A runtime approval shows in the inbox of every member of the group that holds the current level.",L.length?`<div class="tscroll"><table><thead><tr><th>Id</th><th>Rule</th><th>Source</th><th>Record</th><th>Waiting on</th><th>State</th></tr></thead><tbody>${L.slice().reverse().map(x=>`<tr><td><code>${H(x.id)}</code></td><td>${H(G(()=>ruleById(x.ruleId).name,x.ruleId))}</td><td>${H(x.source)}</td><td>${H(x.rec&&(x.rec.id||x.rec.name||x.rec.amount)||"")}</td><td>${H(activeGroups(x).join(", ")||"-")}</td><td>${R.pill(x.state,x.state==="approved"?"good":x.state==="running"?"info":"bad")}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">Nothing running. Start a simulated approval on the Simulate tab or run a bound workflow.</p>`)}`}
R.addScreen({id:"r16h_rules",name:"Approval rules",own:"Casey Rowan",bk:"Jordan Lee",navGroup:"auto",hint:"Nested approvals: levels, groups, modes, conditions, overlays",k:"approval rule nested levels sequential parallel quorum escalation overlay tenant simulate bind catalog budget change servicenow",std:["bpmn","itil5"],
 trigger:"A record bound to an approval rule needs approval",
 ents:[{id:"approval_rule",label:"Approval rule",domain:"gov",note:"Integration decision: new, thin. change_approval_policy and doa_rule each describe one approval pattern for one record type; neither can nest levels or take a tenant overlay. Both become bindings of this rule. Conditions reuse the decision-rule expression style; approvers reference approver_group.",fields:[R.F("name","Name","string","internal",1),R.F("entity","Applies to","ref","internal",1),R.F("version","Version","string","internal"),R.F("tree","Level tree","text","internal",1),R.F("owner","Owner","ref","internal",1),R.F("backup","Backup","ref","internal",1)],n:10,path:"S.r16h.appr.rules"},
  {id:"approval_rule_overlay",label:"Approval rule overlay",domain:"gov",note:"Integration decision: new, thin. Records a tenant's differences from a product rule (set, insert, remove) so the product rule can upgrade without losing the customer change.",fields:[R.F("rule","Rule","ref","internal",1),R.F("op","Operation","enum","internal",1),R.F("node","Level","text","internal"),R.F("value","Value","text","internal"),R.F("note","Why","text","internal"),R.F("by","Changed by","ref","internal")],n:3,path:"S.r16h.appr.overlays"},
  {id:"approval_binding",label:"Approval binding",domain:"gov",note:"Integration decision: new, thin. Binds a rule to a catalog item, budget request type, change type, workflow step or person status.",fields:[R.F("kind","Kind","enum","internal",1),R.F("ref","Reference","text","internal",1),R.F("rule","Rule","ref","internal",1)],n:14,path:"S.r16h.appr.binds"},
  {id:"approval",extend:true,label:"Approval",decision:"Extend approval: rule_id, level_id and instance_id tie each approval to the level of the rule that created it.",fields:[R.F("rule_id","Rule","ref"),R.F("level_id","Level","text"),R.F("approver_group","Approver group","ref")]}],
 steps:[["Draft the rule","Pick the record type and lay out the levels: sequential or parallel, one group per level.","human","Casey Rowan","1 day","Approval need","Draft rule"],["Simulate on a sample","Run a sample record and check which levels fire, skip or wait.","robot","Approval rules","Immediate","Draft rule","Trace"],["Review the tenant overlay","Differences from the product rule are listed; an owner accepts them.","gate","Jordan Lee","2 days","Overlay diff","Accepted overlay"],["Bind the rule","Attach it to catalog items, budget requests, changes and workflow steps.","human","Jordan Lee","1 day","Accepted overlay","Binding"],["Run and decide","The workflow runtime and inbox instantiate the levels; group members decide.","robot","Workflow runtime","Per SLA","Binding and record","Approval outcome"]],
 met:[["m_r16_rules_bound","Approval-bearing records bound to a rule","Bindings with a rule that exists ÷ approval kinds in the platform × 100","%",78,90,50,"max","Bind the rule","Approval rules, Bindings tab"],["m_r16_rules_cycle","Approval cycle time per rule","Σ (decision time − request time) ÷ finished approvals, in hours of simulated time","h",31,48,96,"min","Raise the SLA or split the level","Approval rules, Running tab"]],
 fin:[["flw_design","Saved workflows with approval steps","workflow_definition","api"],["r16h_groups","Approver groups","approver_group","api"],["flw_dmn","Decision rules for conditions","decision_rule","api"]],fout:[["inbox","Approvals by level and group","approval","event","Level activated"],["wf_runs","Approval outcome to the workflow","approval","event","Rule finished"],["adm_audit","Level decisions","approval","event","Member decides"]]});
REG("r16h_rules","Approval rules","automate","M4 6h6v4H4zM14 4h6v4h-6zM14 14h6v4h-6zM10 8h2a2 2 0 0 1 2 2v4M7 10v6a2 2 0 0 0 2 2h5",()=>{seed();const r=cur();
 return `<div class="screen">${hero("Automate · Approvals","Approval rules",`<b>${P.rules.length}</b> rules, <b>${P.binds.length}</b> bindings, <b>${Object.keys(P.overlays).filter(k=>(P.overlays[k]||[]).length).length}</b> with tenant changes. Every level names a group. A tenant overlay is configuration; tenant isolation is simulated in this prototype.`,`<div class="row" style="gap:8px;flex-wrap:wrap">${fchip("m_r16_rules_bound")}${fchip("m_r16_rules_cycle")}<button class="btn" data-link="screen:r16h_groups">Approval groups</button></div>`)}${lensNote()}
 ${views("r16r_tabs",TABS,[rulesTab(),designer(),simTab(),overlayTab(),bindTab(),runningTab()])}${procCard("r16h_rules")}</div>`});
/* ---------- editing: base or overlay ---------- */
const uid=()=>"x"+(P.seq++).toString(36)+Math.floor(Math.random()*1e3).toString(36);
function commit(op){const r=cur();if(P.mode==="tenant"){op.id=uid();op.by=R.viewer();op.at=TODAY;P.overlays[r.id]=(P.overlays[r.id]||[]).concat([op]);R.log("Approval rule overlay changed",r.name,op.op+" "+(op.node&&op.node.title||op.node||""))}
 else{const f=op.op==="insert"?findN(r.root,op.parent||"R"):null;
  if(op.op==="set"){const x=findN(r.root,op.node);if(x){const k=op.field;if(k.indexOf(".")>0){const [a,b]=k.split(".");x.n[a]=x.n[a]||{};x.n[a][b]=op.value}else x.n[k]=op.value}}
  else if(op.op==="insert"&&f){const arr=f.n.items;let at=arr.length;if(op.after==="first")at=0;else if(op.after){const j=arr.findIndex(z=>z.id===op.after);at=j>=0?j+1:arr.length}arr.splice(at,0,op.node)}
  else if(op.op==="remove"){const x=findN(r.root,op.node);if(x&&x.p)x.p.items.splice(x.i,1)}
  r.version=r.version.replace(/(\d+)$/,m=>(+m+1));R.log("Approval rule edited",r.name,op.op)}
 P.ver[r.id]=(P.ver[r.id]||0)+1;render()}
function lvlFields(l,isNew){return [{section:"Approver"},{k:"title",label:"Level name",req:true,wide:true},{k:"group",label:"Approver group",type:"select",opts:gOpts(),req:true,help:"Only groups can approve. Members act for the group."},{k:"mode",label:"How the group decides",type:"chips",opts:[["any","Any one"],["all","All members"],["nofm","N of M"],["first","First responder"]]},{k:"n",label:"Members needed",type:"number",min:1,max:12,show:v=>v.mode==="nofm"},
  {section:"When it applies"},{k:"cond",label:"Applies when",wide:true,ph:"amount > 5000 && category in ['Software','Access']",help:"Condition on the record's fields. Empty means always."},{k:"skip",label:"Skip when",wide:true,ph:"requester == 'Casey Rowan'",help:"If true, the level is skipped."},
  {section:"Time and outcome"},{k:"sla",label:"Target hours",type:"number",min:1,max:720},{k:"escH",label:"Escalate after hours",type:"number",min:0,max:720,help:"0 means no timer."},{k:"escTo",label:"Escalate to group",type:"select",opts:gOpts(),show:v=>+v.escH>0},{k:"escAct",label:"Escalation action",type:"chips",opts:[["notify","Remind"],["reassign","Also send to"],["approve","Auto-approve"],["reject","Auto-reject"]],show:v=>+v.escH>0},{k:"deleg",label:"Members may delegate",type:"toggle"},{k:"onReject",label:"When a member rejects",type:"chips",opts:[["stop","Stop"],["return","Return to requester"],["continue","Continue"]]}]}
function lvlFromVals(v,id){return LV(id,v.title,v.group,v.mode,{n:+v.n||2,cond:String(v.cond||"").trim(),skip:String(v.skip||"").trim(),sla:+v.sla||24,esc:+v.escH>0?{afterH:+v.escH,to:v.escTo||v.group,act:v.escAct||"notify"}:null,deleg:!!v.deleg,onReject:v.onReject||"stop"})}
function lvlForm(l,ins){const isNew=!l;
 const v0=l?{title:l.title,group:l.group,mode:l.mode,n:l.n||2,cond:l.cond,skip:l.skip,sla:l.sla||24,escH:l.esc?l.esc.afterH:0,escTo:l.esc?l.esc.to:"apg_cio",escAct:l.esc?l.esc.act:"notify",deleg:l.deleg!==false,onReject:l.onReject||"stop"}:{title:"",group:"apg_line",mode:"any",n:2,cond:"",skip:"",sla:24,escH:0,escTo:"apg_cio",escAct:"notify",deleg:true,onReject:"stop"};
 const fields=(isNew&&ins&&ins.kindPick?[{k:"what",label:"Insert",type:"chips",opts:[["lvl","Approval level"],["seq","Sequential block"],["par","Parallel block"]]}]:[]).concat(lvlFields(l,isNew).map(f=>f.k&&f.k!=="what"&&isNew&&ins&&ins.kindPick&&f.k!=="what"?Object.assign({},f,{show:f.show?(v=>v.what==="lvl"&&f.show(v)):(v=>v.what==="lvl")}):f));
 openForm({id:"r16r_lvl",title:isNew?"Insert an approval step":"Edit "+l.title,story:(P.mode==="tenant"?"Stored as a tenant change on top of the product rule. ":"Edits the product base rule. ")+"Conditions are checked against the record when the rule starts.",submit:isNew?"Insert":"Save",fields,defaults:Object.assign({what:"lvl"},v0),
  live:v=>{const o=[];[["cond",v.cond],["skip",v.skip]].forEach(x=>{if(x[1]){const c=cond(x[1],{});if(c.err)o.push(`<span class="pill bad">${x[0]}: ${H(c.err)}</span>`)}});const g=G(()=>APG.get(v.group),null);if(g)o.push(`<span class="muted small">${H(g.name)}: ${G(()=>APG.members(g).length,0)} members, quorum ${H(G(()=>APG.quorumText(g),""))}</span>`);return o.join(" ")},
  onSubmit:v=>{const w=v.what||"lvl";if(w==="lvl"&&(!v.title||!v.group))return{close:false,toast:"Name the level and pick a group"};
   if(w==="lvl"){const bad=[v.cond,v.skip].find(x=>x&&cond(x,{}).err);if(bad)return{close:false,toast:"Fix the condition: "+cond(bad,{}).err}}
   if(isNew){const node=w==="seq"?SQ(uid(),[lvlFromVals(v.title?v:Object.assign({},v,{title:"Approval"}),uid())]):w==="par"?PR(uid(),[lvlFromVals(Object.assign({},v,{title:v.title||"Branch A"}),uid()),lvlFromVals(Object.assign({},v,{title:"Branch B",group:"apg_fin"}),uid())],"all"):lvlFromVals(v,uid());commit({op:"insert",parent:ins.parent,after:ins.after,node,note:"Inserted a "+(w==="lvl"?"level":w==="seq"?"sequential block":"parallel block")})}
   else{const nl=lvlFromVals(v,l.id);["title","group","mode","n","cond","skip","sla","deleg","onReject"].forEach(k=>{if(JSON.stringify(nl[k])!==JSON.stringify(l[k]))commit({op:"set",node:l.id,field:k,value:nl[k],note:"Edited "+k})});if(JSON.stringify(nl.esc)!==JSON.stringify(l.esc))commit({op:"set",node:l.id,field:"esc",value:nl.esc,note:"Edited escalation"})}
   return{close:true,toast:isNew?"Step inserted":"Saved"}}})}
function newRuleForm(copy){openForm({id:"r16r_new",title:copy?"Copy "+copy.name:"New approval rule",story:"A custom rule starts with one level. Add levels in the designer.",submit:"Create rule",fields:[{k:"name",label:"Rule name",req:true,wide:true},{k:"entity",label:"Applies to",type:"select",opts:["request_item","budget_request","change_request","invoice","timesheet","person_status","access_request","demand","vendor"].map(x=>[x,x]),req:true},{k:"desc",label:"What it decides",type:"longtext",wide:true}],defaults:{name:copy?copy.name+" (copy)":"",entity:copy?copy.entity:"request_item",desc:copy?copy.desc:""},
  onSubmit:v=>{const nm=String(v.name||"").trim();if(!nm)return{close:false,toast:"Name the rule"};const id="rule_"+nm.toLowerCase().replace(/[^a-z0-9]+/g,"_").slice(0,24)+"_"+(P.seq++);const root=copy?clone(effective(copy).root):SQ("R",[LV("L1","Manager approval","apg_line","any")]);
   P.rules.push({id,name:nm,entity:v.entity,desc:v.desc||"",root,sample:copy?clone(copy.sample):{amount:1000,requester:"Priya Shah"},product:false,version:"1.0",owner:R.viewer(),backup:"Jordan Lee"});P.sel=id;P.mode="base";S.v.r16r_tabs=1;R.log("Approval rule created",nm);render();return{close:true,toast:"Rule created"}}})}
function bindForm(){const kinds=[["catalog","Catalog item"],["budget_request","Budget request type"],["change","Change type"],["invoice","Invoice"],["timesheet","Timesheet"],["status","Person status category"],["requisition","Requisition"],["access","Access request"]];const items=G(()=>SVC3B.pubItems().map(i=>[i.id,i.n||i.name||i.id]),[]);
 openForm({id:"r16r_bind",title:"Bind a rule",story:"The rule then decides approvals for this kind of record.",submit:"Bind",fields:[{k:"kind",label:"Applies to",type:"select",opts:kinds,req:true},{k:"ref",label:"Reference",ph:"* for all, a catalog item id, a change type",help:"Use * for every record of that kind."},{k:"rule",label:"Rule",type:"select",opts:P.rules.map(r=>[r.id,r.name]),req:true}],defaults:{kind:"catalog",ref:"*",rule:cur().id},
  live:v=>v.kind==="catalog"&&items.length?`<span class="muted small">Catalog items: ${H(items.slice(0,8).map(i=>i[0]).join(", "))}</span>`:"",
  onSubmit:v=>{const ref=String(v.ref||"*").trim()||"*";P.binds.push({id:uid(),kind:v.kind,ref,label:(kinds.find(k=>k[0]===v.kind)||[0,v.kind])[1]+": "+(ref==="*"?"all":ref),rule:v.rule});R.log("Approval rule bound",v.rule,v.kind+" "+ref);render();return{close:true,toast:"Bound"}}})}
/* ---------- events ---------- */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r16r]");if(!b)return;const k=b.dataset.r16r,d=b.dataset;seed();
 if(k==="open"){P.sel=d.id;S.v.r16r_tabs=1;render()}else if(k==="open-tenant"){P.sel=d.id;P.mode="tenant";S.v.r16r_tabs=1;render()}else if(k==="sim"){P.sel=d.id;S.v.r16r_tabs=2;render()}
 else if(k==="mode"){P.mode=d.m;render()}
 else if(k==="ins")lvlForm(null,{parent:d.parent,after:d.after,kindPick:true});
 else if(k==="edit"){const f=findN(effective(cur()).root,d.id);if(f)lvlForm(f.n)}
 else if(k==="del"){const f=findN(effective(cur()).root,d.id);if(!f||!f.p)return;commit({op:"remove",node:d.id,note:"Removed "+(f.n.title||"a block")});toast("Removed","good")}
 else if(k==="join"){const f=findN(effective(cur()).root,d.id);if(f)commit({op:"set",node:d.id,field:"join",value:f.n.join==="any"?"all":"any",note:"Changed the join"})}
 else if(k==="addbranch"){commit({op:"insert",parent:d.id,after:"",node:LV(uid(),"New branch","apg_fin","any"),note:"Added a branch"})}
 else if(k==="newrule")newRuleForm(null);else if(k==="clone")newRuleForm(cur());else if(k==="newbind")bindForm();
 else if(k==="unbind"){P.binds=P.binds.filter(x=>x.id!==d.id);render()}
 else if(k==="revert"){P.overlays[d.r]=(P.overlays[d.r]||[]).filter(o=>o.id!==d.id);R.log("Approval overlay change reverted",d.r);render()}
 else if(k==="revertall"){delete P.overlays[d.id];R.log("Approval overlay reverted",d.id);render()}
 else if(k==="addfield"){openForm({id:"r16r_af",title:"Add a record field",submit:"Add",fields:[{k:"n",label:"Field name",req:true},{k:"v",label:"Sample value"}],onSubmit:v=>{const sm=P.sim[cur().id]=P.sim[cur().id]||{};sm[String(v.n).trim()]=v.v;render();return{close:true}}})}
 else if(k==="startsim"){const r=cur();const sm=P.sim[r.id]||clone(r.sample);const x=instantiate(r.id,sm,{requester:sm.requester,source:"simulation"});P.insts.push(x);P.selInst=x.id;R.log("Approval simulated",r.name,x.id);render()}
 else if(k==="autosim"){const r=cur();const sm=P.sim[r.id]||clone(r.sample);const x=instantiate(r.id,sm,{requester:sm.requester,source:"simulation"});let g=0;while(x.state==="running"&&g++<30){const l=activeLevels(x)[0];const mem=memOf(x,l);const s=x.nodes[l.id];let any=false;for(const m of mem){if(x.nodes[l.id].st!=="active")break;const rr=decide(x,l.id,m,"approve","Simulated",nowMs());any=any||rr.ok}if(!any)break}P.insts.push(x);P.selInst=x.id;render()}
 else if(k==="dec"){const inst=P.insts.find(x=>x.id===P.selInst);if(!inst)return;const sel=document.querySelector(`[data-r16r-who="${CSS.escape(d.l)}"]`);const by=sel?sel.value:"";const r=decide(inst,d.l,by,d.d,"",nowMs());if(!r.ok)toast(r.why,"warn");render()}
 else if(k==="adv"){const n=tick(nowMs()+(+d.h)*36e5);const inst=P.insts.find(x=>x.id===P.selInst);if(inst)inst._adv=(inst._adv||0)+(+d.h);toast(n?n+" escalation"+(n===1?"":"s")+" fired":"No timer is due yet","good");render()}
 else if(k==="runwf"){const r=cur();const bf=bindsWF(r)[0];const flow=bf&&bf.ref.split("/")[0];const sm=P.sim[r.id]||r.sample;if(window.FLOWX&&FLOWX.start&&flow){const res=FLOWX.start(flow,Object.assign({id:"SIM-"+(P.seq++)},sm),{source:"Approval rules",by:sm.requester||R.viewer()});toast(res&&res.ok?"Started "+res.id+" in the workflow runtime; it waits in the inbox of the group's members":(res&&res.why||"Could not start"),res&&res.ok?"good":"warn");if(res&&res.ok){S.v.r16r_tabs=5;render()}}}});
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest("[data-r16r-pick]");if(s){P.sel=s.value;render();return}const f=e.target.closest&&e.target.closest("[data-r16r-f]");if(f){const sm=P.sim[cur().id]=P.sim[cur().id]||{};const v=f.value;sm[f.dataset.r16rF]=v!==""&&!isNaN(+v)&&/^-?[0-9.]+$/.test(v)?+v:v==="true"?true:v==="false"?false:v;P.selInst=null;render()}});
/* timers: escalation on the demo clock */
setInterval(()=>{try{if(P.insts.some(x=>x.state==="running")||WFI.some(x=>x.state==="running"))tick(nowMs()+(P.insts.reduce((a,x)=>a+(x._adv||0),0))*36e5)}catch(e){}},4000);
/* ---------- events, search, chat ---------- */
function regEv(){G(()=>{if(!EVENTS.register)return;EVENTS.register({id:"approval.level_decided",label:"Approval level decided",module:"r16h_rules",owner:"Casey Rowan",fields:[{name:"rule",type:"text"},{name:"level",type:"text"},{name:"group",type:"ref"},{name:"by",type:"ref",ref:"person"},{name:"decision",type:"enum"},{name:"state",type:"enum"}]})})}
setTimeout(regEv,2500);
SEARCHX.push(()=>(seed(),P.rules.map(r=>({g:"Approval rules",t:r.name,m:levels(effective(r).root).length+" levels · "+r.entity,c:"--p3",f:()=>{P.sel=r.id;S.v.r16r_tabs=1;go("r16h_rules")},k:"approval rule "+r.name+" "+r.desc+" "+r.entity}))));
ASKX.push(q=>{const t=String(q||"").toLowerCase();seed();
 let m;if((m=t.match(/(?:who approves|approval rule for|how (?:is|are|does).*approved)\s+(.+?)\??$/))||/approval rule/.test(t)){const key=(m&&m[1]||t).trim();const r=P.rules.find(x=>key.indexOf(x.entity.replace(/_/g," "))>=0||x.name.toLowerCase().split(" ").some(w=>w.length>4&&key.indexOf(w)>=0))||cur();P.sel=r.id;S.v.r16r_tabs=1;go("r16h_rules");const L=levels(effective(r).root);say(q,{t:"<b>"+H(r.name)+"</b> has "+L.length+" levels: "+L.map(l=>H(l.title)+" ("+H(gN(l.group))+")").join(", ")+".",steps:["Read the approval rule"]});return true}
 if(/overlay|tenant (change|override)/.test(t)&&/approv/.test(t)){const r=P.rules.find(x=>(P.overlays[x.id]||[]).length)||cur();P.sel=r.id;S.v.r16r_tabs=3;go("r16h_rules");say(q,{t:"<b>"+H(r.name)+"</b> has "+(P.overlays[r.id]||[]).length+" tenant changes on top of the product rule.",steps:["Opened the overlay diff"]});return true}return false});
/* ---------- boot: bind workflow approval nodes to rules once (batched) ---------- */
let tries=0;function boot(){seed();if(!window.FLOWX||!FLOWX.flows){if(++tries<10)setTimeout(boot,1000);return}
 G(()=>{const fl=FLOWX.flows();P.binds.filter(b=>b.kind==="workflow").forEach(b=>{const [fid,nid]=b.ref.split("/");const f=fl.find(x=>x.id===fid);const n=f&&(f.nodes||[]).find(x=>x.id===nid);if(n&&n.t==="approval"){n.a=n.a||{};n.a.rule=b.rule;const g=levels(effective(ruleById(b.rule)).root).map(l=>gN(l.group));n.a.approvers=g.filter((x,i)=>g.indexOf(x)===i)}})})}
setTimeout(boot,2200);
})();
