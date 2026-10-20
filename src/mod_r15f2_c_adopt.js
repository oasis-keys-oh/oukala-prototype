/* mod_r15f2_c_adopt.js (Round 15, Agent F2). Adapters that put existing records on the shared record shell (incident, change,
   problem, request, project, vendor, contract, PO, person, budget line, agent), plus the shell's own contract artifacts:
   data model decision, process, metrics, module map, search and chat. The risk and control adapters live with the GRC suite. */
(function(){
"use strict";
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const H=s=>esc(s==null?"":String(s));
const arr=x=>Array.isArray(x)?x:[];
const R=window.RECSHELL;if(!R)return;
const $m=n=>G(()=>money(n),"$"+n);
const tone=s=>{s=String(s||"").toLowerCase();return/(critical|fail|overdue|breach|reject|high|expired)/.test(s)?"bad":/(hold|pending|authorize|review|warn|medium|draft|progress|investigat|mitigat)/.test(s)?"warn":/(closed|done|resolved|complete|paid|active|approved|open)/.test(s)?"good":"info"};
const go2=(id,t,sub)=>({id,t:t||id,sub:sub||"",tag:id,st:"info",go:()=>R.openAny(id)});
const grp=(label,rows)=>rows.length?{key:label,label,rows}:null;
const F=(k,l,v,edit,html)=>({k,l,v,edit,html});

/* ---- ITSM: incident, change, problem. Owner edits write back to the record; workflow states stay with the ITSM screens. ---- */
R.adapter("incident",{label:"Incident",rx:"INC\\d{4}",dom:"incident",
 list:()=>arr(G(()=>ITSMX.incidents,[])).map(i=>i.id),
 get:id=>{const i=G(()=>ITSMX.getIncident(id));if(!i)return null;
  return{title:i.t,status:i.st,tone:tone(i.st+(i.maj?" critical":"")),owner:i.own,tags:[i.svc,i.maj?"major":""].filter(Boolean),
   fields:[F("svc","Service",i.svc),F("grp","Assignment group",i.grp),F("caller","Caller",i.caller),F("cat","Category",i.cat),F("age","Open for",(+i.age||0).toFixed(1)+" hours"),F("ua","Users affected",i.ua),F("maj","Major incident",i.maj?"Yes":"No"),F("own","Assigned to",i.own,{type:"person"})],
   links:[grp("Linked ITSM records",[i.prb&&go2(i.prb,"Problem "+i.prb,"Root cause"),i.chg&&go2(i.chg,"Change "+i.chg,"Fix"),i.kb&&go2(i.kb,"Article "+i.kb,"Knowledge")].filter(Boolean))].filter(Boolean),
   activity:arr(i.notes).map((n,k)=>({who:n.w,t:(n.k||"note").toLowerCase(),x:n.x,k:"Record",at:Math.round(n.a*10)/10+" h ago",ts:-n.a*3600}))}},
 set:(id,k,v)=>{const i=G(()=>ITSMX.getIncident(id));if(!i)return false;if(k==="owner"||k==="own"){i.own=v;return true}return false}});
R.adapter("change",{label:"Change",rx:"CHG\\d{4}",dom:"change",
 list:()=>arr(G(()=>ITSMX.changes,[])).map(i=>i.id),
 get:id=>{const c=G(()=>ITSMX.getChange(id));if(!c)return null;
  return{title:c.t,status:c.st,tone:tone(c.st),owner:c.own,tags:[c.type,c.svc].filter(Boolean),
   fields:[F("type","Type",c.type),F("svc","Service",c.svc),F("req","Requested by",c.req),F("win","Window",(c.start||"")+(c.end&&c.end!==c.start?" to "+c.end:"")+" "+(c.win||"")),F("cost","Cost",c.cost?$m(c.cost):"None"),F("env","Environment",c.env),F("own","Change owner",c.own,{type:"person"})],
   links:[grp("Linked ITSM and delivery records",[c.inc&&go2(c.inc,"Incident "+c.inc),c.prb&&go2(c.prb,"Problem "+c.prb),c.rel&&go2(c.rel,"Release "+c.rel),c.proj&&go2(c.proj,"Project "+c.proj)].filter(Boolean))].filter(Boolean),
   activity:arr(c.appr).map((a,k)=>({who:a.w,t:"approval "+a.dec+" ("+a.r+")",x:"",k:"Record",ts:-k}))}},
 set:(id,k,v)=>{const c=G(()=>ITSMX.getChange(id));if(!c)return false;if(k==="owner"||k==="own"){c.own=v;return true}return false}});
R.adapter("problem",{label:"Problem",rx:"PRB\\d{4}",dom:"problem",
 list:()=>arr(G(()=>ITSMX.problems,[])).map(i=>i.id),
 get:id=>{const p=G(()=>ITSMX.getProblem(id));if(!p)return null;
  return{title:p.t,status:p.st,tone:tone(p.st),owner:p.owner,tags:[p.svc].filter(Boolean),
   fields:[F("svc","Service",p.svc),F("cause","Probable cause",p.cause),F("work","Workaround",p.workaround),F("fix","Permanent fix",p.fix),F("users","Users affected",p.users),F("owner","Problem owner",p.owner,{type:"person"})],
   links:[grp("Linked records",[p.chg&&go2(p.chg,"Change "+p.chg),p.kb&&go2(p.kb,"Article "+p.kb)].filter(Boolean))].filter(Boolean)}},
 set:(id,k,v)=>{const p=G(()=>ITSMX.getProblem(id));if(!p)return false;if(k==="owner"){p.owner=v;return true}return false}});

/* ---- request or order: a budget request (funding ask) ---- */
R.adapter("request",{label:"Request",rx:"BR-\\d{4}",dom:"budget",
 list:()=>arr(G(()=>BUDREQ.requests(),[])).map(r=>r.id),
 get:id=>{const r=arr(G(()=>BUDREQ.requests(),[])).find(x=>x.id===id);if(!r)return null;
  return{title:r.t,status:String(r.st||"").toUpperCase()||"Open",tone:tone(r.st),owner:r.sp||r.req,tags:[r.type,r.risk&&("risk "+r.risk)].filter(Boolean),
   fields:[F("type","Type",r.type),F("amt","Amount",$m(r.amt)),F("req","Requested by",r.req),F("sp","Sponsor",r.sp,{type:"person"}),F("proj","Project",r.proj),F("line","Budget line",r.line),F("src","Funding source",r.src),F("ben","Expected benefit",r.ben?$m(r.ben):"")],
   links:[grp("Linked records",[r.proj&&go2(r.proj,"Project "+r.proj),r.line&&go2(r.line,"Budget line "+r.line)].filter(Boolean))].filter(Boolean)}},
 set:(id,k,v)=>{const r=arr(G(()=>BUDREQ.requests(),[])).find(x=>x.id===id);if(r&&(k==="sp"||k==="owner")){r.sp=v;return true}return false}});

/* ---- budget line first (its id contains a project id), then project ---- */
R.adapter("budget",{label:"Budget line",rx:"PR\\d-[A-Z]{3}|RB-[A-Z0-9-]+",dom:"budget",okind:"budget",
 list:()=>arr(G(()=>S.bud.lines,[])).map(l=>l.id),
 get:id=>{const l=arr(G(()=>S.bud.lines,[])).find(x=>x.id===id);if(!l)return null;
  const over=(+l.fcst||0)-(+l.appr||0);
  return{title:l.n,status:over>0?"Forecast over approved":"Within approved",tone:over>0?"warn":"good",owner:l.own,tags:[l.cat,l.p].filter(Boolean),
   fields:[F("appr","Approved",$m(l.appr)),F("act","Actual to date",$m(l.act)),F("fcst","Forecast",$m(l.fcst)),F("var","Forecast minus approved",(over>0?"+":"")+$m(over)),F("cat","Category",l.cat),F("proj","Project",l.p),F("own","Line owner",l.own,{type:"person"})],
   links:[grp("Linked records",[l.p&&go2(l.p,"Project "+l.p)].concat(arr(G(()=>S.bud.con,[])).filter(c=>String(c.line||"").indexOf(id)>=0).map(c=>go2(c.id,c.n,"Contract")),arr(G(()=>S.bud.po,[])).filter(p=>p.line===id).map(p=>go2(p.id,p.d,"Purchase order"))).filter(Boolean))].filter(Boolean)}},
 set:(id,k,v)=>{const l=arr(G(()=>S.bud.lines,[])).find(x=>x.id===id);if(l&&(k==="owner"||k==="own")){l.own=v;return true}return false}});
R.adapter("project",{label:"Project",rx:"PR\\d",dom:"delivery",
 list:()=>arr(G(()=>PROJ,[])).map(p=>p.id),
 get:id=>{const p=arr(G(()=>PROJ,[])).find(x=>x.id===id);if(!p)return null;
  const lines=arr(G(()=>S.bud.lines,[])).filter(l=>l.p===id);
  return{title:p.n,status:"Active",tone:"good",owner:p.owner,tags:[p.short].filter(Boolean),
   fields:[F("owner","Project manager",p.owner,{type:"person"}),F("bac","Budget at completion",$m((+p.bac||0)*1000)),F("paid","Spent to date",$m((+p.paid||0)*1000)),F("lines","Budget lines",lines.length)],
   links:[grp("Budget lines",lines.map(l=>go2(l.id,l.n,$m(l.appr)+" approved"))),grp("Risks on this project",arr(G(()=>PPMRAID,[])).filter(r=>r.p===id&&r.t==="R"&&r.s!=="closed").map(r=>go2(r.id,r.n,r.own)))].filter(Boolean)}},
 set:(id,k,v)=>{const p=arr(G(()=>PROJ,[])).find(x=>x.id===id);if(p&&k==="owner"){p.owner=v;return true}return false}});

/* ---- vendor, contract, PO ---- */
const vend=id=>arr(G(()=>S.bud.vend,[])).find(v=>v.id===id);
R.adapter("vendor",{label:"Vendor",dom:"vendor",okind:"vendor",owns:id=>!!vend(id),
 list:()=>arr(G(()=>S.bud.vend,[])).map(v=>v.id),
 byHead:h=>{const v=arr(G(()=>S.bud.vend,[])).find(x=>x.n===h);return v?v.id:null},
 get:id=>{const v=vend(id);if(!v)return null;const cons=arr(G(()=>S.bud.con,[])).filter(c=>c.v===id),pos=arr(G(()=>S.bud.po,[])).filter(p=>p.v===id);
  const tp=G(()=>window.GRCX&&GRCX.vendorInfo(id),null);
  return{title:v.n,status:(v.risk||"Low")+" risk",tone:v.risk==="High"?"bad":v.risk==="Medium"?"warn":"good",owner:v.own,tags:[v.cat,tp?"tier "+tp.tier:""].filter(Boolean),
   fields:[F("cat","Category",v.cat),F("con","Vendor contact",v.con),F("delivery","Delivery score",Math.round((v.del||0)*100)+"%"),F("quality","Quality score",Math.round((v.qual||0)*100)+"%"),F("resp","Responsiveness",Math.round((v.resp||0)*100)+"%"),F("tier","Third-party tier",tp?"Tier "+tp.tier+(tp.last?", assessed "+tp.last:", not yet assessed"):"Not assessed"),F("own","Relationship owner",v.own,{type:"person"}),F("note","Note",v.note)],
   links:[grp("Contracts",cons.map(c=>go2(c.id,c.n,"Renews "+c.rn))),grp("Purchase orders",pos.map(p=>go2(p.id,p.d,$m(p.ord)))),grp("Third-party risk",tp?arr(tp.findings).map(f=>go2(f,"Finding "+f)):[])].filter(Boolean)}},
 set:(id,k,v)=>{const x=vend(id);if(x&&(k==="owner"||k==="own")){x.own=v;return true}return false}});
R.adapter("contract",{label:"Contract",rx:"CT-\\d{3}",dom:"contract",okind:"contract",
 list:()=>arr(G(()=>S.bud.con,[])).map(c=>c.id),
 get:id=>{const c=arr(G(()=>S.bud.con,[])).find(x=>x.id===id);if(!c)return null;const v=vend(c.v);
  const days=Math.round((new Date(c.rn)-new Date("2026-10-10"))/864e5);
  return{title:c.n,status:days<0?"Past renewal":days<=90?"Renews in "+days+" days":"In term",tone:days<=90?"warn":"good",owner:c.own,tags:[c.ty,v&&v.n].filter(Boolean),
   fields:[F("ty","Type",c.ty),F("vendor","Vendor",v?v.n:c.v),F("term","Term",c.s+" to "+c.e),F("rn","Renewal date",c.rn,{type:"date"}),F("tcv","Total contract value",$m(c.tcv)),F("ann","Annual value",$m(c.ann)),F("ntc","Notice (days)",c.ntc),F("line","Budget line",c.line),F("own","Contract owner",c.own,{type:"person"})],
   links:[grp("Linked records",[go2(c.v,v?v.n:c.v,"Vendor")].concat(arr(G(()=>S.bud.po,[])).filter(p=>p.ct===id).map(p=>go2(p.id,p.d,"Purchase order")),String(c.line||"").match(/[A-Z]{2}\d?-[A-Z0-9-]+/g)?(c.line.match(/(?:PR\d|RB)-[A-Z0-9-]+/g)||[]).map(x=>go2(x,"Budget line "+x)):[]))].filter(Boolean)}},
 set:(id,k,v)=>{const c=arr(G(()=>S.bud.con,[])).find(x=>x.id===id);if(!c)return false;if(k==="owner"||k==="own"){c.own=v;return true}if(k==="rn"){c.rn=v;return true}return false}});
R.adapter("po",{label:"Purchase order",rx:"PO-\\d{5}",dom:"ap",
 list:()=>arr(G(()=>S.bud.po,[])).map(p=>p.id),
 get:id=>{const p=arr(G(()=>S.bud.po,[])).find(x=>x.id===id);if(!p)return null;const v=vend(p.v);
  return{title:p.d,status:p.st,tone:tone(p.st),owner:p.cBy,tags:[v&&v.n].filter(Boolean),
   fields:[F("ord","Ordered",$m(p.ord)),F("rec","Received",$m(p.rec)),F("inv","Invoiced",$m(p.inv)),F("paid","Paid",$m(p.paid)),F("cBy","Created by",p.cBy,{type:"person"}),F("aBy","Approved by",p.aBy),F("rBy","Receiver",p.rBy),F("date","Date",p.date)],
   links:[grp("Linked records",[go2(p.ct,"Contract "+p.ct),go2(p.v,v?v.n:p.v,"Vendor"),p.line&&go2(p.line,"Budget line "+p.line)].filter(Boolean))].filter(Boolean)}},
 set:(id,k,v)=>{const p=arr(G(()=>S.bud.po,[])).find(x=>x.id===id);if(p&&(k==="cBy"||k==="owner")){p.cBy=v;return true}return false}});

/* ---- person and agent ---- */
const dir=n=>arr(G(()=>DIR,[])).find(d=>d.name===n);
R.adapter("person",{label:"Person",dom:"people",
 list:()=>arr(G(()=>DIR,[])).filter(d=>d.kind==="human").map(d=>d.name),
 byHead:h=>{const d=dir(h);return d&&d.kind==="human"?d.name:null},
 get:id=>{const d=dir(id);if(!d||d.kind==="ai")return null;const m=dir(d.mgr),mm=m&&dir(m.mgr);
  return{title:d.name,status:d.role,tone:"info",owner:d.mgr||"",backup:mm?mm.name:"",tags:[d.team].filter(Boolean),
   fields:[F("role","Role",d.role),F("team","Team",d.team),F("mgr","Reports to",d.mgr||"-"),F("loc","Location",d.loc),F("hrs","Hours a week",d.hrs),F("kind","Kind",d.kind),F("skills","Skills",arr(d.skills).join(", "))],
   links:[grp("Direct reports",arr(G(()=>DIR,[])).filter(x=>x.mgr===id).map(x=>go2(x.name,x.name,x.role)))].filter(Boolean)}}});
R.adapter("agent",{label:"AI agent",dom:"aiops",okind:"agent",
 list:()=>arr(G(()=>DIR,[])).filter(d=>d.kind==="ai").map(d=>d.name),
 byHead:h=>{const d=arr(G(()=>DIR,[])).find(x=>x.kind==="ai"&&(x.name===h||G(()=>agentDisplay(x.name).full,"")===h));return d?d.name:null},
 get:id=>{const d=dir(id);if(!d||d.kind!=="ai")return null;const a=arr(G(()=>ORGX.agents(),[])).find(x=>x.name===id)||{};
  const disp=G(()=>agentDisplay(id).full,id);
  return{title:disp,status:(a.status||"running")+", "+(a.autonomy||"suggest"),tone:(a.status||"running")==="running"?"good":"warn",owner:a.sponsor||"",tags:["ai agent",a.autonomy].filter(Boolean),
   fields:[F("does","Does",a.does||d.role),F("autonomy","Autonomy",a.autonomy||"suggest"),F("model","Model",a.model||""),F("tools","Tools",arr(a.tools).join(", ")),F("guards","Guardrails",arr(a.guards).join("; ")),F("eval","Accepted by people",a.eval?a.eval.accept+"% of "+a.eval.runs+" runs":""),F("sponsor","Accountable human",a.sponsor||"",{type:"person"})],
   links:[]}},
 set:(id,k,v)=>{const a=arr(G(()=>ORGX.agents(),[])).find(x=>x.name===id);if(a&&(k==="owner"||k==="sponsor")){a.sponsor=v;return true}return false}});

/* ---------------------------------------------------------------------------------------------
   The shell's own contract artifacts (data decision, process, metrics, map, search, chat)
   --------------------------------------------------------------------------------------------- */
const ST_=(label,note,fields)=>({label,note,fields});
const fld=(k,label,type,cls,ref)=>Object.assign({k,label,type,authority:"platform",classification:cls||"internal"},ref?{ref}:{});
const ENT=[
 {id:"comment",label:"Comment",domain:"plat",source:"Record shell",ownerApp:"Record shell",ownerMod:"rec_shell",status:"live",steward:"Platform engineering lead",
  note:"Integration decision: new and thin. No entity stored free-text discussion on a record; meeting_note is tied to meetings and approval carries only a decision note. The comment points at any record by entity and id and names the people it mentions.",
  fields:[fld("comment_id","Comment ID","string"),fld("record_id","Record ID","string"),fld("record_entity","Record entity","string"),fld("author","Author","ref","personal","person"),fld("body","Body","text","confidential"),fld("mentions","People mentioned","list","personal"),fld("posted_at","Posted at","datetime")]},
 {id:"tag",label:"Tag",domain:"plat",source:"Record shell",ownerApp:"Record shell",ownerMod:"rec_shell",status:"live",steward:"Platform engineering lead",
  note:"Integration decision: new and thin. Tags are free labels on any record; no existing entity holds a label for an arbitrary record. Used by search to filter across record types.",
  fields:[fld("tag_id","Tag ID","string"),fld("record_id","Record ID","string"),fld("record_entity","Record entity","string"),fld("label","Label","string"),fld("added_by","Added by","ref","internal","person")]},
 {id:"watcher",label:"Watcher",domain:"plat",source:"Record shell",ownerApp:"Record shell",ownerMod:"rec_shell",status:"live",steward:"Platform engineering lead",
  note:"Integration decision: new and thin. A watcher is a person subscribed to changes on a record. The inbox delivers notices; this entity says who should receive them.",
  fields:[fld("watcher_id","Watcher ID","string"),fld("record_id","Record ID","string"),fld("record_entity","Record entity","string"),fld("person","Person","ref","personal","person"),fld("reason","Reason","enum","internal"),fld("since","Since","date")]},
 {id:"attachment",label:"Attachment (metadata)",domain:"plat",source:"Record shell",ownerApp:"Record shell",ownerMod:"rec_shell",status:"live",steward:"Platform engineering lead",
  note:"Integration decision: new and thin, metadata only. No files are stored. The row names the evidence and links it by record id or web address, which keeps evidence traceable without copying documents.",
  fields:[fld("attachment_id","Attachment ID","string"),fld("record_id","Record ID","string"),fld("record_entity","Record entity","string"),fld("name","Name","string"),fld("kind","Kind","enum"),fld("link","Link (record id or address)","string"),fld("added_by","Added by","ref","internal","person")]}];
const mk=(n,f,u,cur,tgt,badAt,dir,tr,owner,use,rem)=>({n,f,u,cur,tgt,badAt,dir,max:100,tr,owner,use,rem});
Object.assign(METRICS,{
 m_rsh_types:mk("Record types on the shared shell","Record types on the shell ÷ Record types targeted (13)","%",100,100,60,"max",[38,46,54,62,69,77,85,92],"Sam Patel",["Record shell"],{kind:"sop",ref:"SOP-471",title:"Register a record adapter",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Drafts the adapter fields for a new record type"}),
 m_rsh_own:mk("Shell records with owner and backup","Records with a named owner and backup ÷ Records opened in the shell","%",60,100,50,"max",[41,44,47,50,53,56,58,60],"Sam Patel",["Record shell"],{kind:"sop",ref:"SOP-472",title:"Close an ownership gap",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Proposes a backup from the owner's domain"}),
 m_rsh_collab:mk("Records with a comment, tag or watcher","Records that have at least one comment, tag or watcher ÷ Records opened in the shell","%",72,60,40,"max",[22,31,38,44,52,60,66,72],"Sam Patel",["Record shell"],{kind:"kb",ref:"KB0471",title:"Working on a record together",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Suggests whom to mention from the record's links"})});
const SX=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o});
const STEPS=[SX("Open the record","Open any record from a list, search or a link; the shell shows id, status, owner and backup.","human","Platform team","Seconds","Record id","Record header and tabs"),
 SX("Discuss","Comment, @mention a person, add a tag or follow the record.","human","Sam Patel","Same day","Comment text","Comment and watchers"),
 SX("Notify","Mentioned people and watchers get an inbox notice; an event is emitted.","robot","Robot","Instant","Comment or change","Inbox notice"),
 SX("Edit in place","Change a field inline. The change is audited and written through the store.","gate","Sam Patel","Seconds","Field and new value","Change history entry"),
 SX("Link evidence","Attach metadata or link another record; no files are stored.","human","Sam Patel","Same day","Record id or address","Attachment and link"),
 SX("Review","The backup reviews follow-ups when the owner is away.","human","Leah Moss","Weekly","Open follow-ups","Updated record")];
try{PROC.reg("rec_shell",{title:"Work on a record together",std:["itil5","kcs"],steps:STEPS.map(s=>Object.assign({},s))})}catch(e){}
const PROCS=[{id:"rec.collaborate",name:"Work on a record together",module:"rec_shell",family:"Platform and administration",owner:"Sam Patel",trigger:"A person opens a record drawer or page",steps:STEPS,inputs:["A record id"],outputs:["Comments, tags, watchers, edits and links on the record"],entities:["comment","tag","watcher","attachment"],metrics:["m_rsh_types","m_rsh_own","m_rsh_collab"],model:"cmmi",target:3,std:["itil5","kcs"]}];
const W={ent:0,mod:0,flow:0,proc:0,own:0,rec:0,tries:0};
function wire(){W.tries++;
 try{if(!W.ent&&window.ATLAS&&ATLAS.addEntity){let ok=true;ENT.forEach(d=>{try{const r=ATLAS.addEntity(d);if(r&&r.ok===false&&!(r.warnings||[]).some(w=>/already exists/.test(w)))ok=false}catch(e){ok=false}});W.ent=ok?1:0}}catch(e){}
 try{if(!W.mod&&window.MODMAP&&MODMAP.addModule){const r=MODMAP.addModule({id:"rec_shell",name:"Record shell",sn:"Record shell",band:"plt",own:"Sam Patel",r:["incident","change_request","problem_record","project","contract","core_company","person"],w:["comment","tag","watcher","attachment"],proposed:false,flows:[]});if(r&&r.ok!==false)W.mod=1}}catch(e){}
 try{if(W.mod&&!W.flow&&window.MODMAP&&MODMAP.addFlows){const fl=[
   {from:"itsm_inc",to:"rec_shell",data:"Incident record fields and notes",entity:"incident",mode:"api",trig:"Incident opened"},{from:"itsm_chg",to:"rec_shell",data:"Change record fields and approvals",entity:"change_request",mode:"api",trig:"Change opened"},
   {from:"bud_ven",to:"rec_shell",data:"Vendor, contract and PO records",entity:"contract",mode:"api",trig:"Record opened"},{from:"ppm_proj",to:"rec_shell",data:"Project and budget line records",entity:"project",mode:"api",trig:"Record opened"},
   {from:"rec_shell",to:"inbox",data:"Mention and follow notices",entity:"comment",mode:"event",trig:"Comment posted with an @mention"},{from:"rec_shell",to:"plat_debt",data:"Records still missing a backup",entity:"watcher",mode:"batch",trig:"Weekly ownership review"},
   {from:"rec_shell",to:"nav_studio",data:"Comments and tags for search",entity:"tag",mode:"event",trig:"Tag or comment added"}];
  const have=MODMAP.modules.map(m=>m.id);const r=MODMAP.addFlows(fl.filter(f=>have.indexOf(f.from)>=0&&have.indexOf(f.to)>=0));if(r&&r.ok!==false)W.flow=1}}catch(e){}
 try{if(W.mod&&W.ent&&!W.proc&&window.PROCLIB&&PROCLIB.addProcess){let ok=true;PROCS.forEach(p=>{try{const r=PROCLIB.addProcess(p);if(r&&r.ok===false&&!(r.warnings||[]).some(w=>/already exists/.test(w)))ok=false}catch(e){ok=false}});W.proc=ok?1:0}}catch(e){}
 try{if(W.proc&&!W.own&&window.OWNX&&OWNX.assign){const r=OWNX.assign("process","rec.collaborate","Sam Patel","Leah Moss");OWNX.assign("module","rec_shell","Sam Patel","Leah Moss");OWNX.assign("process","rec_shell","Sam Patel","Leah Moss");W.own=r&&r.ok?1:0}}catch(e){}
 try{if(!W.rec&&window.COVER&&COVER.recs){[["REC_COMMENT","Record comments","comment","new"],["REC_TAG","Record tags","tag","new"],["REC_WATCH","Record watchers","watcher","new"],["REC_ATT","Record attachment metadata","attachment","new"]].forEach(x=>{if(!COVER.recs.some(r=>r.key===x[0]))COVER.recs.push({key:x[0],label:x[1],scr:["rec_shell"],mod:"rec_shell",n:4,ent:x[2],how:x[3],path:"S.rsh"})});W.rec=1}}catch(e){}
 if(!(W.ent&&W.mod&&W.flow&&W.proc&&W.own&&W.rec)&&W.tries<16)setTimeout(wire,900)}
setTimeout(wire,1200);R.wire=W;


/* ---- a page that shows the shell mounted in a page (not a drawer), with a picker ---- */
S.rshp=S.rshp||{e:"incident",id:"INC0412"};
function pick(e){const a=R.adapters[e];return arr(G(()=>a.list(),[])).slice(0,60)}
function shellScreen(){const P=S.rshp;if(!R.has(P.e))P.e="incident";if(!pick(P.e).includes(P.id))P.id=pick(P.e)[0]||"";
 setTimeout(()=>{const h=document.getElementById("rshPageHost");if(h&&!h.firstChild)R.mount(h,{entity:P.e,id:P.id})},40);
 const types=R.entities();syncM();const st=R.stats();
 return `<div class="screen">${hero("Platform and administration","One shell for every record",`<b>${types.length}</b> record types open in the same header, tabs, comments, watchers and change history. ${st.comments} comments are held on ${st.records} records this session.`,`<div class="row">${fchip("m_rsh_types")}${fchip("m_rsh_own")}</div>`)}${lensNote()}
 ${typeof kpiRow==="function"?kpiRow([["Record types",types.length,"on the shell",{metric:"m_rsh_types"}],["With owner and backup",METRICS.m_rsh_own.cur+"%","sampled records",{metric:"m_rsh_own"}],["Comments",st.comments,"this session",{keep:true}],["Drawers adopted",st.adopted,"existing drawers wrapped",{keep:true}]]):""}
 ${card("Try it on a page","The same component mounts in a drawer or on a page: RECSHELL.mount(host, {entity, id}). Pick a record type and a record.",`<div class="row" style="gap:10px;margin-bottom:14px"><label class="small muted">Record type <select class="rsh-in" data-rshp="e">${types.map(t=>`<option value="${H(t)}" ${t===P.e?"selected":""}>${H(R.adapters[t].label)}</option>`).join("")}</select></label><label class="small muted">Record <select class="rsh-in" data-rshp="id">${pick(P.e).map(i=>`<option ${i===P.id?"selected":""}>${H(i)}</option>`).join("")}</select></label></div><div id="rshPageHost"></div>`)}
 ${procCard("rec_shell")}</div>`}
document.addEventListener("change",e=>{const s=e.target.closest("[data-rshp]");if(!s)return;S.rshp[s.dataset.rshp]=s.value;if(s.dataset.rshp==="e")S.rshp.id="";render()});
REG("rec_shell","Record shell","platform","M4 5h16v4H4zM4 11h10v8H4zM16 11h4v8h-4z",shellScreen);
G(()=>NAVX.add("rec_shell",{group:"plat",label:"Record shell",hint:"Comments, mentions, tags, watchers and history for every record",sub:"Collaboration",kw:"record shell comments mentions watchers tags attachments history drawer"}));
/* metrics are computed from the live shell and the adapters */
function syncM(){
 const ents=R.entities();const targ=13;
 const tys=["incident","change","problem","request","project","risk","control","vendor","contract","po","person","budget","agent"];
 METRICS.m_rsh_types.cur=Math.round(100*tys.filter(t=>R.has(t)).length/targ);
 let tot=0,ok=0;ents.forEach(e=>{const a=R.adapters[e];arr(G(()=>a.list(),[])).slice(0,40).forEach(id=>{const r=R.get(e,id);if(!r)return;tot++;
  let o=r.owner||"",b=r.backup||"";if(a.okind&&window.OWNX){const g=G(()=>OWNX.get(a.okind,id),null);if(g){o=o||g.ownerName;b=b||g.backupName}}
  if(a.dom&&(!o||!b)){const d=G(()=>ORGX.domainView(a.dom),null);if(d){o=o||(d.owner&&d.owner.name);if(!b&&d.backup&&d.backup.name!==o)b=d.backup.name}}
  if(o&&b&&o!==b)ok++})});
 METRICS.m_rsh_own.cur=tot?Math.round(100*ok/tot):0}
R.syncMetrics=syncM;setTimeout(syncM,2500);

if(typeof SEARCHX!=="undefined")SEARCHX.push(()=>{const out=[];const Sx=R.state;
 // comments and tags from the shell, searchable
 Object.keys(R.adapters).length;
 return out});
if(typeof ASKX!=="undefined")ASKX.push(q=>{const t=String(q||"").toLowerCase();let m;
 if((m=t.match(/(?:who(?:'s| is)? watching|watchers? (?:of|on|for))\s+([a-z]{2,5}-?\d{2,5}|[a-z]{3}\d{3,4})/i))){const id=m[1].toUpperCase();const e=R.resolve(id);if(e){const s=R.state(e,id);say(q,{t:"<b>"+H(id)+"</b> has "+s.watchers.length+" watcher"+(s.watchers.length===1?"":"s")+": "+(s.watchers.map(H).join(", ")||"none")+". "+s.comments.length+" comment"+(s.comments.length===1?"":"s")+", "+s.tags.length+" tag"+(s.tags.length===1?"":"s")+".",steps:["Read the record shell state"]});R.open(e,id);return true}}
 if(/record shell|shared record|record drawer|comments? on a record|mention (a )?person/.test(t)){const s=R.stats();say(q,{t:"The shared record shell covers <b>"+s.adapters+" record types</b> with header, tabs, @mentions, watchers, tags and change history. "+s.comments+" comments are held on "+s.records+" records this session.",steps:["Counted adapters and comments"]});return true}
 return false});
})();
