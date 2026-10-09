/* ---------- subscribers and canonical events ---------- */
const SUBS=[
 {id:"s_plan",n:"Portfolio plan",pat:["project_task","project"],mode:"Push (webhook)",lag:"0.9 s",dl:0,st:"healthy"},
 {id:"s_exec",n:"Executive dashboard",pat:["project","project_task","invoice"],mode:"Push (webhook)",lag:"1.4 s",dl:0,st:"healthy"},
 {id:"s_sla",n:"Agreements and SLA engine",pat:["incident","alert_event"],mode:"Push (webhook)",lag:"0.7 s",dl:0,st:"healthy"},
 {id:"s_obs",n:"Observability correlation",pat:["alert_event","cmdb_ci"],mode:"Stream consumer",lag:"0.4 s",dl:1,st:"degraded"},
 {id:"s_fo",n:"First Officer notifications agent",pat:["*"],mode:"Stream consumer",lag:"2.1 s",dl:0,st:"healthy"},
 {id:"s_p360",n:"Person 360",pat:["person","time_off"],mode:"Pull on open",lag:"n/a",dl:0,st:"healthy"},
 {id:"s_mcp",n:"Registry MCP cache",pat:["*"],mode:"Stream consumer",lag:"1.1 s",dl:0,st:"healthy"},
 {id:"s_rbac",n:"Access control (RBAC and ABAC)",pat:["person"],mode:"Push (webhook)",lag:"0.6 s",dl:0,st:"healthy"}];
const subsFor=en=>SUBS.filter(s=>s.pat.includes("*")||s.pat.includes(en));
/* ---------- seeding ---------- */
let _nt=0;
function sync_(){const n=Object.keys(DATAMODEL.tables).length;if(n!==_nt){_nt=n;PLAT.refresh();if(F.ready){F.proj.forEach(p=>{if(p.eval&&!p.mine){p.eval=evaluate(p);p.route=routeOf(p,p.eval);const r=F.reqs.find(x=>x.ref===p.id);if(r)r.route=p.route}})}}}
function ensure(){
 sync_();if(F.ready)return;
 F.conns=seedConns();
 F.maps=MAPSEED.map((m,i)=>({id:"MP-"+(100+i),conn:m[0],src:m[1],srcType:m[2],ent:m[3],k:m[4],tf:m[5],conf:m[6],status:m[7],lag:m[8],em:m[9]||null,ver:m[7]==="approved"?3:1,ai:m[6]<.95}));
 ["c_graph","c_idp","c_jira","c_erp","c_hol"].forEach((c,i)=>{F.mapVer[c]=[4,3,2,5,1][i]});
 const R=RNG("fab-runs"),act=F.conns.filter(c=>c.min!=="enterprise"&&c.status!=="expired");
 F.runs=[];
 for(let i=0;i<190;i++){const c=act[Math.floor(R()*act.length)];if(c.id==="c_mcp_reg")continue;const mins=3+i*14+Math.floor(R()*9);const mode=c.lag<=300?"Real-time":"Batch";
  const read=c.id==="c_plat"?1+Math.floor(R()*3):Math.floor(20+R()*(c.lag>5000?2400:300));const q=R()<.22?1+Math.floor(R()*4):0;const failed=R()<.025;
  const loaded=failed?0:Math.max(0,Math.round((read-q)*(.3+R()*.5)));
  F.runs.push({id:"RUN-"+(4900-i),conn:c.id,mode,at:tsAgo(mins),min:mins,dur:Math.round((mode==="Real-time"?2+R()*6:20+R()*160)),read,valid:failed?0:read-q,quar:failed?0:q,loaded,held:failed?0:(R()<.1?1:0),events:loaded,status:failed?"failed":q?"partial":"ok",env:c.env==="Sandbox"?"Sandbox":"Production",retries:failed?3:R()<.06?1:0,
   err:failed?(R()<.5?"HTTP 429 from source after 3 retries; backoff exceeded":"401: token expired, secret rotation is due"):"",idem:"idem-"+(hs(c.id+i)*7919).toString(16),kind:"scheduled"})}
 F.seq.run=4900;
 const Q=(c,en,rec,k,val,why,mins,att)=>({id:"Q-"+(F.seq.q++),conn:c,ent:en,rec,k,val:val,reason:why,at:tsAgo(mins),status:"open",attempts:att||0,run:"RUN-"+(4890-Math.floor(mins/14)),raw:null});
 F.quar=[Q("c_graph","project_task","PT-121","planned_finish","2026-10-20","Finish is before start (start 2026-11-03)",95),
  Q("c_graph","project_task","PT-126","percent_complete","n/a","Percent complete must be a number from 0 to 100",95),
  Q("c_idp","person","Elena Voss","role","","Role is required and arrived empty",40),
  Q("c_jira","user_story","MSF-490","state","Waiting for QA","No mapping for Jira status 'Waiting for QA'",120,1),
  Q("c_erp","invoice","INV-5530","amount","TBD","Amount is not a number",600,2),
  Q("c_hol","time_off","HOL-BAD","from","2026-13-40","Not a valid date",1500,3),
  Q("c_idp","person","Sam Reyes","team","","Team does not exist in the directory",200),
  Q("c_jira","user_story","MSF-471","short_description","","Summary is required and arrived empty",260)];
 F.quar[5].status="dead";F.quar[0].ctx={planned_start:"2026-11-03"};
 F.recon=[
  ["project_task","PT-114","Draft indexing cutover plan","planned_finish","Oct 28","Oct 30","c_graph",480],["project_task","PT-087","Pilot sign-off","planned_start","Oct 14","Oct 19","c_jira",1300],
  ["project_task","PT-092","Content freeze","planned_finish","Nov 6","Nov 4","c_graph",1900],["user_story","MSF-482","Saved search filters","state","In progress","In review","c_jira",75],
  ["user_story","MSF-466","Export citations","state","In review","Done","c_jira",2600],["project_task","PT-101","Index backfill","percent_complete","60","75","c_graph",3100],
  ["project_task","PT-110","Training materials","planned_finish","Nov 13","Nov 20","c_graph",4300],["user_story","MSF-459","Audit log view","state","New","In progress","c_jira",5000],
  ["project_task","PT-075","Security review","planned_start","Oct 8","Oct 7","c_graph",300]
  ].map((r,i)=>({id:"REC-"+(200+i),ent:r[0],rec:r[1],label:r[2],k:r[3],plat:r[4],ext:r[5],conn:r[6],at:tsAgo(r[7]),min:r[7],status:i===4?"resolved":i===2?"wi":"open",wi:i===2?"WI-1298":null,how:i===4?"Took the Jira value":""}));
 F.wi=[{id:"WI-1298",t:"Reconcile Content freeze finish date",sub:"REC-202 on project_task",who:"Priya Shah",due:"Oct 9",st:"open",ref:"REC-202"},
  {id:"WI-1299",t:"Decommission Project Online export bridge",sub:"Expired Sept 30; revoke secret, remove mappings, archive runs",who:"Priya Shah",due:"Oct 13",st:"open",ref:"c_pol"}];
 F.seq.wi=1300;
 const P=(id,t,pur,sys,ents,fields,dir,vol,own,risk,by,ctype,stage,days,extra)=>Object.assign({id,t,purpose:pur,systems:sys,ents,fields,dir,vol,owner:own,risk,by,ctype,stage,created:days,len:"ongoing",eval:null,route:null,outcome:null},extra||{});
 F.proj=[P("M2M-01","Posted lease invoices into invoice records","Keep invoice amount, status and paid-to-date in step with the lease subledger so the budget screens stop retyping them.",["Lease subledger (ERP)"],["invoice"],"amount, status, paid_to_date","In",1200,"Avery Chen","Medium","Avery Chen","Generic REST","certified",40,{conn:"c_erp",outcome:{kind:"certified",days:6,at:dayS(-34),by:"Platform team and security",reasons:"Contract fit passed; sandbox 99% clean."}}),
  P("M2M-02","Codification Platform release export","Temporary feed of editorial features while the workflow moves to Oukala.",["Codification Platform"],["feature"],"short_description, state","In",90,"Chief Editor","Low","Chief Editor","Generic REST","project",70,{len:"temporary",conn:"c_cod",outcome:{kind:"project",days:3,at:dayS(-14),by:"Auto-approved by rules",expiry:isoDay(55),reasons:"Needed for PR3 only; decommission at expiry."}}),
  P("M2M-03","Lumen alerts into alert events","Bring index alerts into the correlation engine.",["Lumen search service"],["alert_event"],"severity, state, last_seen","In",2400,"Tom Becker","Medium","Tom Becker","MCP","evaluating",8,{conn:"c_mcp_lumen"}),
  P("M2M-04","Leave balances from the HR system","Show leave balances in Person 360 and capacity planning.",["HR system"],["time_off","person"],"from, to, status, hours","In",300,"Rina Okafor","High","Maya Ortiz","Generic REST","proposed",3),
  P("M2M-05","Intune compliance into assets","Know which laptops are compliant without opening Intune.",["Microsoft Intune via Graph"],["asset"],"intune_compliant, lifecycle","In",600,"Sam Patel","Medium","Sam Patel","Microsoft Graph","awaiting",12),
  P("M2M-06","Survey scores into experience responses","Pull member satisfaction scores from a survey tool.",["Survey tool"],["xla_response"],"score, dimension","In",150,"Maya Ortiz","Low","Maya Ortiz","Generic REST","rejected",25,{dup:"Experience response already receives survey scores from the service desk survey, so a second feed would duplicate it",outcome:{kind:"rejected",days:7,at:dayS(-18),by:"Platform team and security",reasons:"Duplicates the experience response entity fed by the service desk survey; reuse the existing entity and add a connector mapping instead of a new feed."}}),
  P("M2M-07","Publish project dates to a board report","Send approved project finish dates to the board's reporting workbook.",["Board workbook (SharePoint)"],["project"],"finish, status, percent_complete","Out",40,"Maya Ortiz","Medium","Maya Ortiz","Microsoft Graph","awaiting",5)];
 F.proj.forEach(p=>{if(["evaluating","awaiting","certified","project","rejected"].includes(p.stage)){p.eval=evaluate(p);p.route=routeOf(p,p.eval)}});
 F.reqs=[];F.proj.forEach(p=>{if(p.route)F.reqs.push({id:"REQ-"+(F.seq.req++),kind:"M2M project",ref:p.id,t:p.t,route:p.route,state:p.stage==="awaiting"?"Waiting":p.stage==="evaluating"?"Evaluating":"Decided",at:p.created})});
 F.reqs.push({id:"REQ-"+(F.seq.req++),kind:"Certify connector",ref:"c_mcp_lumen",t:"Promote the Lumen search MCP server to certified",route:{k:"std",n:"Platform team and security",sla:"3 days",why:"Medium risk, internal data, certified connector type"},state:"Waiting",at:6});
 const RE=RNG("fab-ev"),ap=F.maps.filter(m=>m.status==="approved"&&m.conn!=="c_pol");F.events=[];
 for(let i=0;i<340;i++){const m=ap[Math.floor(RE()*ap.length)],mins=2+i*6+Math.floor(RE()*5);F.events.push(mkEvent(m.ent,m.k,["PT-114","PT-133","MSF-482","INV-5544","Priya Shah","Dev Rao","ALR-8821","FEAT-31"][Math.floor(RE()*8)],"v"+Math.floor(RE()*90),"v"+Math.floor(RE()*90),m.conn,mins))}
 F.ready=true;
}
function mkEvent(en,k,rec,old,nw,conn,mins,type){const c=F.conns.find(x=>x.id===conn);return{id:"EVT-"+(F.seq.ev++),type:type||en+"."+k+".changed",ent:en,k,rec,old,nw,conn,at:tsAgo(mins||0),min:mins||0,path:c&&c.lag<=300?"stream":"batch",subs:subsFor(en).map(s=>s.n),run:"RUN-"+(4900-Math.floor((mins||0)/14)),schema:"1.3"}}
/* ---------- validation, authority, run engine ---------- */
function coerce(en,k,v,m){const t=ftype(en,k),s=v==null?"":String(v).trim();
 if(m&&m.em){if(!(s in m.em))return{ok:false,why:"No mapping for "+(m.src||"value")+" '"+s+"'"};return{ok:true,val:m.em[s]}}
 if(t==="date"||t==="datetime"){const d=s.slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||isNaN(Date.parse(d)))return{ok:false,why:"Not a valid date"};const dt=new Date(d+"T00:00:00Z");if(dt.toISOString().slice(0,10)!==d)return{ok:false,why:"Not a valid date"};return{ok:true,val:d}}
 if(t==="percent"){if(s===""||isNaN(+s)||+s<0||+s>100)return{ok:false,why:"Percent complete must be a number from 0 to 100"};return{ok:true,val:+s}}
 if(t==="currency"||t==="money"||t==="number"){const n=+(s.replace(/,/g,""));if(s===""||isNaN(n))return{ok:false,why:flabel(en,k)+" is not a number"};return{ok:true,val:t==="number"?n:Math.round(n*100)/100}}
 if(t==="boolean")return/^(true|false)$/i.test(s)?{ok:true,val:/^true$/i.test(s)}:{ok:false,why:"Must be true or false"};
 if(s==="")return{ok:false,why:flabel(en,k)+" is required and arrived empty"};
 return{ok:true,val:s}}
function pairRule(en,t){if(en==="project_task"&&t.planned_start&&t.planned_finish&&t.planned_finish<t.planned_start)return{k:"planned_finish",why:"Finish is before start (start "+t.planned_start+")"};
 if(en==="project"&&t.start&&t.finish&&t.finish<t.start)return{k:"finish",why:"Finish is before start"};return null}
const same=(a,b)=>String(a).trim()===String(b).trim();
function pipeline(connId,sandbox,onlyApproved){
 const c=F.conns.find(x=>x.id===connId),sets=SAMPLES[connId]||[],out={rows:[],read:0,quar:[],events:[],recon:[],loaded:0,held:0,kept:0,same:0,notes:[]};
 sets.forEach(sm=>{const maps=F.maps.filter(m=>m.conn===connId&&m.ent===sm.ent&&m.status!=="rejected"&&(onlyApproved?m.status==="approved":true));
  sm.rows.forEach(row=>{out.read++;const rid=sm.nameKey?row[sm.nameKey]:row.id,cur=(sm.cur||{})[rid]||null,tgt={},errs=[];
   if(row.active===false){out.events.push({ent:sm.ent,k:"lifecycle",rec:rid,old:"active",nw:"leaver",type:"person.lifecycle.leaver"});out.notes.push(rid+": SCIM reports the account disabled, so a leaver event revokes access in RBAC and ABAC.")}
   maps.forEach(m=>{if(!(m.src in row))return;const r=coerce(m.ent,m.k,row[m.src],m);if(!r.ok)errs.push({k:m.k,val:row[m.src],why:r.why,src:m.src});else tgt[m.k]=r.val});
   const pr=errs.length?null:pairRule(sm.ent,tgt);if(pr)errs.push({k:pr.k,val:tgt[pr.k],why:pr.why});
   if(errs.length){out.quar.push({ent:sm.ent,rec:rid,k:errs[0].k,val:errs[0].val,reason:errs[0].why,row,ctx:Object.assign({},tgt)});out.rows.push({rec:rid,ent:sm.ent,res:"Quarantined",why:errs[0].why});return}
   const res=[];Object.keys(tgt).forEach(k=>{const mt=eff(sm.ent,k),cv=cur&&k in cur?cur[k]:undefined,nv=tgt[k];
    if(sm.readonly){res.push([k,"Read only",nv]);return}
    if(cv!==undefined&&same(cv,nv)){out.same++;res.push([k,"Unchanged",nv]);return}
    if(mt.auth==="platform"){out.kept++;res.push([k,"Platform wins, kept "+cv,nv]);return}
    if(mt.auth==="shared"&&cv!==undefined&&cur._edit&&cur._edit[k]){out.held++;out.recon.push({ent:sm.ent,rec:rid,k,plat:cv,ext:nv,label:row.title||row.summary||rid});res.push([k,"Held for reconciliation",nv]);return}
    out.loaded++;out.events.push({ent:sm.ent,k,rec:rid,old:cv===undefined?"(none)":cv,nw:nv});res.push([k,"Loaded",nv])});
   out.rows.push({rec:rid,ent:sm.ent,res:"Processed",fields:res})})});
 return out}
