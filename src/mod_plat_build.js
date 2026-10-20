/* mod_plat_build: "Build a module" (plat_build). The working path for a new application or module to join the platform:
   blueprint wizard (data reuse first, process, connections, maturity, metrics, security and AI), live integration preview,
   conformance through window.GATE, registration into ATLAS / PROCLIB / MODMAP / METRICS, manifest and MCP path, enforcement explainer.
   Calls (all guarded, read lazily): GATE, MCPX, PLAT, PROC, MODMAP.addModule/addFlows, ATLAS.addEntity/focus, PROCLIB.addProcess, MAT, DEBT.add. */
(function(){
S.build=S.build||{d:null,step:0,vis:{},reg:[],saved:"",mcp:{tool:"validate_manifest",out:null},q:"",pq:"",quar:[],sim:{ent:"budget_table",mod:"Member renewals portal"},missing:[]};
const B=S.build,E=esc;
const TODAY="2026-10-06";
const STEPS=["Purpose and owner","Data","Process","Connections","Maturity","Metrics","Security and AI","Review"];
const BANDN={str:"Strategy and portfolio",dem:"Demand and projects",mon:"Money and contracts",bld:"Build and release",ops:"Service operations",inf:"Infrastructure and CMDB",obs:"Observability and automation",ppl:"People and skills",kai:"Knowledge and AI",plt:"Platform and governance"};
const WHO=[["human","Person"],["agent","AI agent"],["robot","Robot"],["gate","Gate"]];
const MODES=[["event","Event"],["batch","Batch"],["human","Human"],["api","API call"]];
const MODEC={event:"--accent",batch:"--p4",human:"--warn-f",api:"--good-f"};
const FTYPES=["string","number","date","currency","boolean","ref","enum","list"];
const AUTHS=[["platform",BRAND.name],["external","External"],["shared","Shared"]];
const CLS=[["public","Public"],["internal","Internal"],["confidential","Confidential"],["restricted","Restricted"],["personal","Personal"]];
const ROLEOPTS=["Requester","Approver","Fulfiller","Manager","Auditor","Platform admin","Read-only analyst"];
const GUARDS=["No personal data in prompts","A person approves every write","Citations required for answers","Prompts and answers are logged","Monthly spend cap enforced"];
const slug=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"").slice(0,32);
const cap=s=>s?s[0].toUpperCase()+s.slice(1):"";
const pill_=(t,c)=>`<span class="pill ${c||"mute"}">${E(t)}</span>`;
const clone=o=>JSON.parse(JSON.stringify(o));
const iso=n=>new Date(new Date(TODAY+"T12:00:00").getTime()+n*864e5).toISOString().slice(0,10);
const tok=s=>(s||"").toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>2);
const D=()=>B.d;
const mval=m=>m.cur+(/^[a-z]/i.test(m.u||"")?" "+m.u:(m.u==="pts"?"":m.u||""));
const mods=()=>{try{return window.MODMAP?MODMAP.modules:[]}catch(e){return[]}};
const modOf=id=>mods().find(m=>m.id===id);
const bandList=()=>{try{if(window.MODMAP&&MODMAP.bands)return MODMAP.bands.map(b=>[b.id,b.name])}catch(e){}return Object.keys(BANDN).map(k=>[k,BANDN[k]])};
const entities=()=>{try{return PLAT.entities()}catch(e){return[]}};
const entLabel=id=>{const e=entities().find(x=>x.id===id);if(e)return e.label;const n=D()&&D().data.neu.find(x=>x.id===id);return n?n.label:id};
const planned=()=>{try{return PLAT.PLANNED||[]}catch(e){return[]}};
function blank(){return{id:"",name:"",sn:"",purpose:"",owner:"",band:"ops",sunset:iso(395),data:{reuse:[],ext:[],neu:[]},proc:{name:"",trigger:"",sla:"",steps:[],tpl:""},conns:[],mat:{model:"cmmi",target:3},metrics:[],sec:{cls:"internal",roles:[],audit:true,signin:true,notify:true,report:true,secrets:true,ai:false,model:"Claude Haiku",gw:true,cap:100,guard:[]},exc:[],dupPrev:0,dupF:0,uid:1}}
const uid=()=>{D().uid=(D().uid||1)+1;return D().uid};
const getp=(o,p)=>p.split(".").reduce((a,k)=>a==null?a:a[k],o);
const setp=(o,p,v)=>{const ks=p.split("."),last=ks.pop();const t=ks.reduce((a,k)=>a[k],o);t[last]=v};
const touch=()=>{B.saved=new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",second:"2-digit"})};
const whoChip=n=>window.pchip&&window.DIR&&DIR.some(d=>d.name===n)?pchip(n):E(n||"Not set");
/* ---------- seeded in-flight modules (history of the path) ---------- */
const SEEDS=[
 {id:"s_grants",name:"Grant tracking",owner:"Avery Chen",stage:"Idea",band:"mon",purpose:"Track grant applications from outside funders from draft to award.",reuse:0,ext:0,neu:0,conf:0,next:"Describe the purpose and owner, then search the registry before listing any data."},
 {id:"s_renew",name:"Member renewals portal",owner:"Maya Ortiz",stage:"Blueprint",band:"ppl",purpose:"Let members renew online and see what they paid.",reuse:3,ext:1,neu:1,conf:71,step:4,next:"Finish the metrics step: two of three metrics have no remediation."},
 {id:"s_ethics",name:"Ethics disclosures",owner:"Nia Brooks",stage:"Sandbox",band:"plt",purpose:"Collect annual conflict of interest disclosures from committee members.",reuse:2,ext:0,neu:1,conf:66,step:7,next:"Set a review date and name an owner for the new Disclosure entity."},
 {id:"s_events",name:"Event logistics",owner:"Dev Rao",stage:"Review",band:"dem",purpose:"Plan venues, speakers and travel for standards conferences.",reuse:4,ext:1,neu:0,conf:88,step:7,next:"Waiting on data council review of the extension to Person."}];
const STAGES=["Idea","Blueprint","Sandbox","Review","Registered"];
const STGC={Idea:"--faint",Blueprint:"--accent",Sandbox:"--p4",Review:"--warn-f",Registered:"--good-f"};
/* ---------- registry search ---------- */
function searchEnts(q){
 const ws=tok(q);if(!ws.length)return[];
 return entities().map(e=>{const hay=(e.id+" "+e.label+" "+e.owner+" "+e.fields.map(f=>f.k+" "+(f.label||"")).join(" ")).toLowerCase();let n=0;ws.forEach(w=>{if(hay.indexOf(w)>=0)n++});const nameHit=ws.some(w=>(e.id+" "+e.label).toLowerCase().indexOf(w)>=0);return{e,s:n/ws.length+(nameHit?.5:0)}}).filter(x=>x.s>=.5).sort((a,b)=>b.s-a.s).slice(0,8).map(x=>x.e);
}
const HC=new WeakMap();
function hitsOf(n){
 const key=(n.label||"")+"|"+n.fields.map(f=>f.k).join(",")+"|"+(n.why||"");const c=HC.get(n);if(c&&c.k===key)return c.h;
 let h=[];try{if((n.label||"").length>2)h=PLAT.reuseCheck(n.label,n.fields.map(f=>f.k+" "+(f.label||"")).join(" ")+" "+(n.why||""))}catch(e){}
 h=h.filter(x=>x.id!==n.planned&&x.id!==n.id);HC.set(n,{k:key,h});return h;
}
const dupHit=n=>hitsOf(n).find(x=>x.sc>=.5);
const newExc=(d,n)=>d.exc.some(x=>x.check==="nodup"&&(x.ent===n.id||!x.ent));
const unresolved=d=>d.data.neu.filter(n=>dupHit(n)&&!newExc(d,n));
function overlapFields(n,hit){try{const e=PLAT.ent(hit.id);if(!e)return 0;const ks=new Set(e.fields.map(f=>f.k));return n.fields.filter(f=>ks.has(f.k)).length}catch(x){return 0}}
/* ---------- process overlap ---------- */
function procOverlap(d){
 try{if(!window.GATE||!GATE.reuseReport)return null;const r=GATE.reuseReport(d.proc.name||d.name,d.purpose,"",[]);const it=r.items.find(i=>/^A process already exists/.test(i.t));if(!it)return null;const m=/\(screen ([^)]+)\)/.exec(it.d);return{id:m?m[1]:"",title:it.t.replace("A process already exists: ","")}}catch(e){return null}
}
function procTemplates(d){
 const ws=new Set(tok(d.name+" "+d.purpose+" "+d.proc.name)),out=[];
 try{Object.keys(PROC.defs).forEach(k=>{const p=PROC.defs[k];if(!p||!p.title||k.indexOf("plat_")===0||k===B.curTpl)return;const have=tok(p.title+" "+(p.steps||[]).map(s=>s.n).join(" "));let n=0;have.forEach(w=>{if(ws.has(w))n++});if(n>0)out.push({id:k,title:p.title,n,steps:(p.steps||[]).length})})}catch(e){}
 return out.sort((a,b)=>b.n-a.n).slice(0,4);
}
function allProcs(){try{return Object.keys(PROC.defs).filter(k=>PROC.defs[k]&&PROC.defs[k].title&&k.indexOf("plat_")!==0&&k.indexOf("bld")!==0).map(k=>[k,PROC.defs[k].title])}catch(e){return[]}}
/* ---------- gate ---------- */
function toApp(d){
 const reads=d.data.reuse.concat(d.data.ext.map(x=>x.ent));
 const labels=(()=>{const bad=/email|phone|birth|ssn|salary|home|passport/i;let any=false;const fs=d.data.neu.flatMap(n=>n.fields).concat(d.data.ext.flatMap(x=>x.add));fs.forEach(f=>{if(bad.test(f.k)&&!["confidential","restricted","personal"].includes(f.classification))any=true});return any?"partial":true})();
 const ov=d.proc.tpl?null:procOverlap(d);
 return{id:"bld_tmp",n:d.name||"New module",purpose:d.purpose,tier:"team",status:"sandbox",builder:d.owner,owner:d.owner||"",reads,writes:[],
  newEnts:d.data.neu.map(n=>{const h=dupHit(n);return{id:n.id,why:n.why,dupOf:h?h.id+(h.kind==="planned"?" (planned)":""):undefined}}),connectors:[],
  ai:d.sec.ai?[{model:d.sec.model,gw:!!d.sec.gw,cap:d.sec.gw?(+d.sec.cap||0):0,use:"Assist the "+(d.name||"module")+" process"}]:[],classes:[d.sec.cls],sunset:d.sunset||"",dupProc:ov?ov.id:"",contract:(window.CONTRACT&&CONTRACT.fromDraft?CONTRACT.fromDraft(d):undefined),
  m:{manifest:true,ownAuth:!d.sec.signin,ownNotify:!d.sec.notify,ownReport:!d.sec.report,secrets:!d.sec.secrets,labels,audit:!!d.sec.audit,a11y:"pass"}};
}
function runGate(d){
 let rows=[],err="";
 try{
  const apps=GATE.apps(),tmp=toApp(d);apps.push(tmp);
  try{rows=GATE.conformance("bld_tmp").rows}finally{const i=apps.indexOf(tmp);if(i>=0)apps.splice(i,1)}
 }catch(e){err=String(e&&e.message||e);if(B.missing.indexOf("GATE.conformance")<0)B.missing.push("GATE.conformance")}
 rows=rows.map(r=>{
  if(r.r!=="fail")return r;
  const ex=d.exc.filter(x=>x.check===r.id);if(!ex.length)return r;
  if(r.id==="nodup"&&unresolved(d).length)return r;
  return Object.assign({},r,{r:"warn",exc:true,ev:r.ev+" Exception raised: "+ex[0].reason+" (until "+ex[0].exp+")."});
 });
 const pass=rows.filter(r=>r.r==="pass").length,warn=rows.filter(r=>r.r==="warn").length,fail=rows.filter(r=>r.r==="fail").length;
 return{rows,pass,warn,fail,total:rows.length,score:rows.length?Math.round(100*(pass+.5*warn)/rows.length):0,ok:rows.length>0&&fail===0,err};
}
/* ---------- maturity model: six dimensions ---------- */
const DIMS=[
 ["defined","Defined","The process is written down with a trigger, steps and a time limit."],
 ["owned","Owned","Someone is accountable for the process, its steps and its review date."],
 ["measured","Measured","Metrics exist with formulas, owners, targets and remediation."],
 ["integrated","Integrated","Data comes from registered entities and flows connect to other modules."],
 ["automated","Automated","Agents and robots do the repeatable work, under guardrails."],
 ["governed","Governed","Classification, audit, gate approval and AI controls are in place."]];
function dimCrit(d,g){
 const st=d.proc.steps,mt=d.metrics,cn=d.conns,nonH=st.filter(s=>s.who!=="human").length,ents=d.data.reuse.length+d.data.ext.length+d.data.neu.length;
 const mFull=mt.length&&mt.every(m=>m.f&&m.owner&&m.tgt!==""&&m.tgt!=null),mRem=mt.length&&mt.every(m=>m.remTitle);
 return{
  defined:[["Name and purpose are written",!!(d.name&&d.purpose)],["A trigger and at least 3 steps",!!(d.proc.trigger&&st.length>=3)],["Every step says who acts",st.length>0&&st.every(s=>s.who)],["A time limit (SLA) on the process and on one step",!!(d.proc.sla&&st.some(s=>s.sla))],["Starts from a registered process template",!!d.proc.tpl]],
  owned:[["An accountable owner is named",!!d.owner],["The owner also stewards new entities",!!d.owner&&(d.data.neu.length>0||ents>0)],["Every step has an owner",st.length>0&&st.every(s=>s.owner)],["A review or sunset date is set",!!d.sunset],["Three or more roles are defined",d.sec.roles.length>=3]],
  measured:[["At least one metric",mt.length>=1],["At least two metrics",mt.length>=2],["Every metric has a formula, owner and target",!!mFull],["Every metric has remediation",!!mRem],["Three metrics, one about time or SLA",mt.length>=3&&mt.some(m=>/time|sla|cycle|lead/i.test(m.n))]],
  integrated:[["Uses at least one registered entity",d.data.reuse.length+d.data.ext.length>0],["At least one connection to another module",cn.length>=1],["Both a pull and a push",cn.some(c=>c.dir==="pull")&&cn.some(c=>c.dir==="push")],["No unresolved duplicate entities",unresolved(d).length===0&&ents>0],["Three or more connections, one by event or API",cn.length>=3&&cn.some(c=>c.mode==="event"||c.mode==="api")]],
  automated:[["At least one step is not manual",nonH>=1],["An agent or robot step exists",st.some(s=>STEPMODE.needsTrigger(s.who))],["Half the steps are agent, robot or gate",st.length>0&&nonH*2>=st.length],["Agent work runs under two or more guardrails",!d.sec.ai||d.sec.guard.length>=2],["An event or API flow triggers a robot or agent step",cn.some(c=>c.mode==="event"||c.mode==="api")&&st.some(s=>STEPMODE.needsTrigger(s.who))]],
  governed:[["Data classification chosen",!!d.sec.cls],["Audit events are on",!!d.sec.audit],["A gate (approval) step exists",st.some(s=>s.who==="gate")],["Conformance has no failures and scores 80 or more",g.ok&&g.score>=80],["AI uses the gateway with a cap and 3 guardrails, or no AI",!d.sec.ai||(d.sec.gw&&d.sec.guard.length>=3&&+d.sec.cap>0)]]
 };
}
function matInfo(d,g){
 const c=dimCrit(d,g||runGate(d)),out={};let min=5;
 DIMS.forEach(x=>{const arr=c[x[0]];let L=0;while(L<5&&arr[L][1])L++;out[x[0]]={level:L,crit:arr};if(L<min)min=L});
 return{dims:out,level:min,target:+d.mat.target||3};
}
function matModels(){try{if(window.MAT&&MAT.ALLM)return MAT.ALLM().map(m=>({id:m.id,n:m.n,lv:m.lv||[]}))}catch(e){}return[{id:"cmmi",n:"Process capability (CMMI style)",lv:[["Initial"],["Managed"],["Defined"],["Quantitatively managed"],["Optimizing"]]}]}
const lvName=(model,L)=>{const m=matModels().find(x=>x.id===model);return m&&m.lv&&m.lv[L-1]?m.lv[L-1][0]:"Level "+L};
/* ---------- completeness of each wizard step ---------- */
function stepDone(i,d,g){
 switch(i){case 0:return!!(d.name&&d.purpose&&d.owner);case 1:return d.data.reuse.length+d.data.ext.length+d.data.neu.length>0&&unresolved(d).length===0;case 2:return d.proc.steps.length>=2&&!!d.proc.trigger;case 3:return d.conns.length>0;case 4:return!!d.mat.model&&+d.mat.target>0;
  case 5:return d.metrics.length>0&&d.metrics.every(m=>m.f&&m.owner&&m.remTitle);case 6:return!!d.sec.cls&&d.sec.roles.length>0;case 7:return(g||runGate(d)).ok}return false;
}
/* ---------- manifest ---------- */
function manifest(d){
 let base={};try{base=GATE.manifest(toApp(d))}catch(e){base={oukala_manifest:"1.0"}}
 const g=runGate(d),mi=matInfo(d,g);
 return Object.assign({},base,{kind:"module",app:Object.assign({},base.app||{},{id:modId(d),name:d.name,support_owner:d.owner||null,review_or_sunset:d.sunset||null,status:"proposed"}),
  module:{id:modId(d),name:d.name,short:d.sn||d.name,band:d.band,band_name:BANDN[d.band]||d.band,accountable:d.owner},
  data:{reads:d.data.reuse.concat(d.data.ext.map(x=>x.ent)),writes:[],new_entities:d.data.neu.map(n=>({id:n.id,label:n.label,domain:n.domain,authority:n.authority,classification:n.classification,reason:n.why||"",duplicate_of:(dupHit(n)||{}).id||null,exception:newExc(d,n),fields:n.fields.map(f=>({k:f.k,type:f.type,authority:f.authority,classification:f.classification}))})),
   extends:d.data.ext.map(x=>({entity:x.ent,add_fields:x.add.map(f=>({k:f.k,type:f.type,authority:f.authority,classification:f.classification}))}))},
  process:{id:modId(d)+"_process",name:d.proc.name||d.name,trigger:d.proc.trigger,sla:d.proc.sla,template:d.proc.tpl||null,steps:d.proc.steps.map((s,i)=>({n:i+1,name:s.n,who:s.who,owner:s.owner,sla:s.sla||null}))},
  flows:d.conns.map(c=>({direction:c.dir,module:c.other,entity:c.entity,mode:c.mode,trigger:c.trig,data:c.data||""})),
  maturity:{model:d.mat.model,target_level:+d.mat.target,reached_level:mi.level,dimensions:Object.fromEntries(DIMS.map(x=>[x[0],mi.dims[x[0]].level]))},
  metrics:d.metrics.map(m=>({id:metId(d,m),name:m.n,formula:m.f,unit:m.u,owner:m.owner,target:m.tgt,direction:m.dir,remediation:{kind:m.remKind,title:m.remTitle}})),
  security:{classification:d.sec.cls,roles:d.sec.roles,audit:!!d.sec.audit,ai:d.sec.ai?{model:d.sec.model,route:d.sec.gw?"ai_gateway":"direct",monthly_cap_usd:d.sec.cap,guardrails:d.sec.guard}:null},
  exceptions:d.exc.map(x=>({check:x.check,reason:x.reason,owner:x.owner,expires:x.exp})),conformance:{score:g.score,passed:g.pass,warnings:g.warn,failed:g.fail}});
}
const modId=d=>d.id||slug(d.name)||"new_module";
const metId=(d,m)=>"m_"+modId(d)+"_"+slug(m.n);
/* ---------- integration preview ---------- */
function counts(d){
 const nf=d.data.neu.reduce((s,n)=>s+n.fields.length,0)+d.data.ext.reduce((s,x)=>s+x.add.length,0);
 return{reuse:d.data.reuse.length,ext:d.data.ext.length,neu:d.data.neu.length,nf,dupPrev:d.dupPrev||0,dupF:d.dupF||0,open:unresolved(d).length,flows:d.conns.length};
}
const FREE=[["Sign-in and roles","Single sign-on through Entra ID, role and attribute rules from the policy engine."],["Preferences","Theme, language and persona settings follow the person across modules."],["Audit trail","Every create, change and delete is recorded."],["Search","Records appear in global search once registered."],["Chat control","Ask "+BRAND.name+" can open, find and act on its records."],["Metrics framework","Formula chips, targets, owners and remediation play."],["Process card","Your process shows as a clickable strip on the screen."],["Maturity record","The process is scored in Maturity models and rolls up."]];
function diagram(d,compact){
 const me=d.sn||d.name||"New module",ins=d.conns.filter(c=>c.dir==="pull"),outs=d.conns.filter(c=>c.dir==="push");
 const rows=Math.max(ins.length,outs.length,1),W=compact?460:620,NW=compact?132:170,NH=34,GAP=compact?44:54,H=Math.max(110,rows*GAP+30);
 const cx=(W-NW)/2,cy=(H-NH)/2;
 const nm=id=>{const m=modOf(id);return m?m.sn:id};
 const nodeY=(i,n)=>(H-(n*GAP))/2+i*GAP+(GAP-NH)/2;
 let h=`<svg class="bld-dg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mini diagram of ${E(me)} and the modules it connects to"><defs>${MODES.map(m=>`<marker id="bld-ar-${m[0]}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 1L10 5L0 9z" style="fill:var(${MODEC[m[0]]})"/></marker>`).join("")}</defs>`;
 const edge=(x1,y1,x2,y2,c,lab)=>`<path d="M${x1},${y1}L${x2},${y2}" class="bld-ed" style="stroke:var(${MODEC[c.mode]||"--accent"})" marker-end="url(#bld-ar-${c.mode||"event"})"/>${compact?"":`<text x="${(x1+x2)/2}" y="${(y1+y2)/2-6}" text-anchor="middle" class="bld-el">${E(lab)}</text>`}`;
 ins.forEach((c,i)=>{const y=nodeY(i,ins.length);h+=edge(8+NW,y+NH/2,cx,cy+NH/2,c,entLabel(c.entity)||c.data)+`<g><rect x="8" y="${y}" width="${NW}" height="${NH}" rx="9" class="bld-nd"/><text x="${8+NW/2}" y="${y+NH/2+4}" text-anchor="middle" class="bld-nt">${E(nm(c.other).slice(0,compact?18:24))}</text></g>`});
 outs.forEach((c,i)=>{const y=nodeY(i,outs.length);h+=edge(cx+NW,cy+NH/2,W-8-NW,y+NH/2,c,entLabel(c.entity)||c.data)+`<g><rect x="${W-8-NW}" y="${y}" width="${NW}" height="${NH}" rx="9" class="bld-nd"/><text x="${W-8-NW/2}" y="${y+NH/2+4}" text-anchor="middle" class="bld-nt">${E(nm(c.other).slice(0,compact?18:24))}</text></g>`});
 h+=`<rect x="${cx}" y="${cy}" width="${NW}" height="${NH}" rx="9" class="bld-nd me"/><text x="${cx+NW/2}" y="${cy+NH/2+4}" text-anchor="middle" class="bld-nt me">${E(me.slice(0,22))}</text>`;
 if(!d.conns.length)h+=`<text x="${W/2}" y="${H-8}" text-anchor="middle" class="bld-el">No connections yet</text>`;
 return h+`</svg>`;
}
const modeLegend=()=>legend(MODES.map(m=>[m[1],MODEC[m[0]]]));
function previewHTML(){
 const d=D();if(!d)return"";
 const c=counts(d),g=runGate(d),mi=matInfo(d,g);
 const dots=g.rows.map(r=>`<i class="bld-dot ${r.r}" title="${E(r.n)}: ${E(r.r)}. ${E(r.ev)}"></i>`).join("");
 const near=(d.conns.map(x=>x.other).filter((v,i,a)=>a.indexOf(v)===i)).length;
 const band=BANDN[d.band]||d.band;
 return `<div class="bld-pv glass"><div class="eyebrow">Integration preview</div><h3>${E(d.name||"New module")}</h3>
 <div class="bld-sec"><b>Data model</b><div class="bld-3"><span><em data-role="metric">${c.reuse}</em>reuse</span><span><em data-role="metric">${c.ext}</em>extend</span><span><em data-role="metric">${c.neu}</em>new</span></div>
  <div class="small muted">${c.nf} field${c.nf===1?"":"s"} proposed. <b>${c.dupPrev}</b> duplicate entit${c.dupPrev===1?"y":"ies"} avoided, <b>${c.dupF}</b> duplicate field${c.dupF===1?"":"s"} prevented.${c.open?` <span class="bld-bad">${c.open} duplicate${c.open===1?"":"s"} blocking.</span>`:""}</div></div>
 <div class="bld-sec"><b>Flows and map position</b><div class="small muted">${c.flows} new flow${c.flows===1?"":"s"} with ${near} module${near===1?"":"s"}. Placed in the <b>${E(band)}</b> band as a dashed, Proposed node.</div>${diagram(d,true)}</div>
 <div class="bld-sec"><b>Conformance</b><div class="bld-score"><span class="num" data-role="metric">${g.score}%</span><span class="small muted">${g.pass} pass, ${g.warn} warn, ${g.fail} fail of ${g.total}</span></div><div class="bld-dots" aria-label="Gate checks">${dots}</div><div class="small ${g.ok?"bld-good":"bld-bad"}">${g.err?E(g.err):g.ok?"The gate would pass.":"The gate would block: "+E(g.rows.filter(r=>r.r==="fail").map(r=>r.n).slice(0,3).join(", "))}</div></div>
 <div class="bld-sec"><b>Maturity</b><div class="small muted">Reached <b>${E(lvName(d.mat.model,mi.level||1))}</b> (level ${mi.level}) of target level ${mi.target}.</div></div>
 <details class="bld-sec"><summary><b>You get for free (${FREE.length})</b></summary><ul class="bld-free">${FREE.map(f=>`<li><span aria-hidden="true">&#10003;</span><span><b>${E(f[0])}.</b> ${E(f[1])}</span></li>`).join("")}</ul></details></div>`;
}
/* ---------- forms and field helpers ---------- */
const fld=(label,inner,help)=>`<label class="fld"><span class="flab">${E(label)}</span>${inner}${help?`<span class="small muted">${E(help)}</span>`:""}</label>`;
const inp=(path,val,ph,extra)=>`<input class="fin" data-bld-in="${E(path)}" value="${E(val==null?"":val)}" placeholder="${E(ph||"")}" ${extra||""}>`;
const sel=(path,val,opts,extra)=>`<select class="fin" data-bld-in="${E(path)}" ${extra||""}>${opts.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];return `<option value="${E(v)}" ${String(v)===String(val)?"selected":""}>${E(l)}</option>`}).join("")}</select>`;
const chips=(path,cur,opts)=>`<div class="row" style="gap:8px;flex-wrap:wrap">${opts.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];const on=Array.isArray(cur)?cur.includes(v):String(cur)===String(v);return `<button type="button" class="chip${on?" on":""}" aria-pressed="${on}" data-bld-chip="${E(path)}" data-v="${E(v)}">${E(l)}</button>`}).join("")}</div>`;
const tog=(path,on,label)=>`<button type="button" class="bld-tog${on?" on":""}" role="switch" aria-checked="${!!on}" data-bld-tog="${E(path)}"><i></i><span>${E(label)}</span></button>`;
function fieldRows(base,list){
 return `<div class="bld-frows">${list.map((f,i)=>`<div class="bld-fr"><input class="fin" data-bld-in="${base}.${i}.k" value="${E(f.k)}" placeholder="field_name" aria-label="Field name">${sel(base+"."+i+".type",f.type,FTYPES,'aria-label="Type"')}${sel(base+"."+i+".authority",f.authority,AUTHS,'aria-label="Authority"')}${sel(base+"."+i+".classification",f.classification,CLS,'aria-label="Classification"')}<button type="button" class="btn quiet" data-bld-act="rm" data-a="${base}:${i}" aria-label="Remove field ${E(f.k)}">Remove</button></div>`).join("")||`<p class="small muted">No fields yet.</p>`}<div><button type="button" class="btn" data-bld-act="addf" data-a="${base}">Add field</button></div></div>`;
}
const newField=()=>({k:"",type:"string",authority:"platform",classification:"internal",req:false});
/* ---------- step renderers ---------- */
function s0(d){
 return `<div class="grid g2" style="gap:14px">${fld("Module name",inp("name",d.name,"Facilities requests"),"What people will call it. Becomes the module id "+modId(d)+".")}
 ${fld("Short name for the map",inp("sn",d.sn,"Facilities"),"Up to 14 characters fits the map node.")}
 <div class="fld" style="grid-column:1/-1">${fld("What it does and for whom",`<textarea class="fin" rows="3" data-bld-in="purpose" placeholder="Staff request space, equipment or repairs; the facilities team fulfils them.">${E(d.purpose)}</textarea>`)}</div>
 ${fld("Accountable owner",`<select class="fin" data-bld-in="owner"><option value="">Choose an owner</option>${peopleOpts(d.owner)}</select>`,"One named person answers for it. The gate fails without one.")}
 ${fld("Band on the module map",sel("band",d.band,bandList()),"Where the node is placed, next to the modules it works with.")}
 ${fld("Review or sunset date",`<input class="fin" type="date" data-bld-in="sunset" value="${E(d.sunset)}">`,"Every module gets a date so it cannot outlive its owner.")}</div>
 ${(()=>{const r=reuseNow(d);return r?`<div class="story small" style="margin-top:12px"><b>Reuse check on your purpose.</b> ${r}</div>`:""})()}`;
}
function peopleOpts(cur){const names=(window.DIR?DIR.filter(x=>x.kind==="human").slice(0,40).map(x=>x.name):PEOPLE.map(p=>p[0]));if(cur&&names.indexOf(cur)<0)names.unshift(cur);return names.map(n=>`<option value="${E(n)}" ${n===cur?"selected":""}>${E(n)}</option>`).join("")}
function reuseNow(d){
 if(!(d.name||d.purpose))return"";
 try{const r=GATE.reuseReport(d.name,d.purpose,"",[]);const bad=r.items.filter(i=>i.lvl!=="good").slice(0,2);return bad.length?bad.map(i=>E(i.t+". "+i.d)).join(" "):"Nothing in the registry or process library duplicates this yet."}catch(e){return""}
}
function s1(d){
 const res=searchEnts(B.q),pl=B.q?planned().filter(p=>tok(B.q).some(w=>(p[0]+" "+p[2]+" "+p[4]).toLowerCase().indexOf(w)>=0)).slice(0,3):[];
 const has=id=>d.data.reuse.includes(id)||d.data.ext.some(x=>x.ent===id);
 const list=res.map(e=>`<div class="bld-res"><div class="bld-rn"><b>${E(e.label)}</b> <code>${E(e.id)}</code><div class="small muted">Owner ${E(e.owner)} · ${e.nf} fields · highest class ${E(e.cls)}${e.status==="duplicate"?" · duplicate open":""}</div></div><div class="row" style="gap:6px">${has(e.id)?pill_("Selected","good"):`<button class="btn primary" data-bld-act="reuse" data-a="${E(e.id)}">Reuse</button><button class="btn" data-bld-act="extend" data-a="${E(e.id)}">Extend</button>`}</div></div>`).join("")+pl.map(p=>`<div class="bld-res"><div class="bld-rn"><b>${E(p[2])}</b> <code>${E(p[0])}</code> ${pill_("Planned","info")}<div class="small muted">${E(p[4])}</div></div><div><button class="btn" data-bld-act="promote" data-a="${E(p[0])}">Promote this planned entity</button></div></div>`).join("");
 const rc=d.data.reuse.map(id=>`<span class="bld-tag">${E(entLabel(id))}<button type="button" data-bld-act="unreuse" data-a="${E(id)}" aria-label="Remove ${E(entLabel(id))}">&times;</button></span>`).join("")||`<span class="small muted">None yet. Search above and choose Reuse.</span>`;
 const ex=d.data.ext.map((x,i)=>`<div class="bld-ecard"><div class="row" style="justify-content:space-between;gap:8px"><b>Extend ${E(entLabel(x.ent))}</b><button class="btn quiet" data-bld-act="unext" data-a="${i}">Remove</button></div><p class="small muted">New fields only. The entity's steward approves them and existing fields stay as they are.</p>${fieldRows("data.ext."+i+".add",x.add)}</div>`).join("");
 const nw=d.data.neu.map((n,i)=>`<div class="bld-ecard"><div class="row" style="justify-content:space-between;gap:8px"><b>New entity${n.planned?" (from the planned list)":""}</b><button class="btn quiet" data-bld-act="unnew" data-a="${i}">Remove</button></div>
  <div class="grid g2" style="gap:12px">${fld("Entity name",inp("data.neu."+i+".label",n.label,"Space booking"))}${fld("Domain",sel("data.neu."+i+".domain",n.domain,Object.keys(PLAT.DOM||{}).map(k=>[k,PLAT.DOM[k].n])))}${fld("Default authority",sel("data.neu."+i+".authority",n.authority,AUTHS))}${fld("Highest class",sel("data.neu."+i+".classification",n.classification,CLS))}
  <div class="fld" style="grid-column:1/-1">${fld("Why existing entities do not fit",`<textarea class="fin" rows="2" data-bld-in="data.neu.${i}.why" placeholder="One sentence the data council can read">${E(n.why)}</textarea>`)}</div></div>
  <h4 class="bld-h4">Fields</h4>${fieldRows("data.neu."+i+".fields",n.fields)}<div data-bld-hits="${i}">${hitsHTML(d,n,i)}</div></div>`).join("");
 return `<div class="bld-q">${fld("Search the registry first",`<input class="fin" data-bld-q placeholder="Try: person, request, cost, booking" value="${E(B.q)}" aria-label="Search the registry">`,"Reuse comes first, then extend, and only then propose something new.")}</div>
 <div class="bld-results">${list||(B.q?`<p class="small muted">Nothing in the registry matches. Propose a new entity below and the duplicate check keeps watching.</p>`:`<p class="small muted">Type a word to see registered entities with owner, fields and class.</p>`)}</div>
 <h4 class="bld-h4">Reuse as is (${d.data.reuse.length})</h4><div class="row" style="gap:8px;flex-wrap:wrap">${rc}</div>
 <h4 class="bld-h4">Extend with new fields (${d.data.ext.length})</h4>${ex||`<p class="small muted">Nothing extended.</p>`}
 <div class="row" style="justify-content:space-between;align-items:center;margin-top:14px"><h4 class="bld-h4" style="margin:0">New entities (${d.data.neu.length})</h4><button class="btn" data-bld-act="addnew">Propose a new entity</button></div>${nw||`<p class="small muted">None proposed. Most modules need fewer than they think.</p>`}`;
}
function hitsHTML(d,n,i){
 const hs=hitsOf(n);if(!hs.length)return(n.label||"").length>2?`<div class="bld-dup ok"><b>No close match.</b> <span class="small muted">The registry has nothing near "${E(n.label)}". It still goes to the data council as a proposal.</span></div>`:"";
 const top=hs.find(x=>x.sc>=.5);const ex=newExc(d,n);
 return `<div class="bld-dup ${top&&!ex?"bad":"warn"}"><div><b>${top?(ex?"Near-duplicate, exception raised":"Near-duplicate. Creating this is blocked"):"Related entities exist"}</b></div>${hs.map(h=>{const ov=h.kind==="existing"?overlapFields(n,h):0;return `<div class="bld-dr"><span><b>${E(h.label)}</b> <code>${E(h.id)}</code> ${pill_(Math.round(h.sc*100)+"% match",h.sc>=.5?"bad":"warn")}${h.kind==="planned"?" "+pill_("Planned","info"):""}${ov?`<span class="small muted"> ${ov} field${ov===1?"":"s"} already there</span>`:""}</span>${h.kind==="existing"?`<span class="row" style="gap:6px"><button class="btn" data-bld-act="dupreuse" data-a="${i}:${E(h.id)}">Reuse it instead</button><button class="btn" data-bld-act="dupext" data-a="${i}:${E(h.id)}">Extend it instead</button></span>`:""}</div>`}).join("")}
 ${top&&!ex?`<div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><span class="small muted">Still need a separate entity? Give a reason and raise an exception.</span><button class="btn danger" data-bld-act="excnew" data-a="${i}">Raise an exception</button></div>`:""}</div>`;
}
function s2(d){
 const ov=d.proc.tpl?null:procOverlap(d),tp=procTemplates(d);
 const steps=d.proc.steps.map((s,i)=>`<div class="bld-st" data-dnd-id="${s.id}" tabindex="0" aria-label="Step ${i+1} ${E(s.n)}"><span class="grip-wrap">${grip}</span><b class="bld-sn">${i+1}</b>
  <input class="fin" data-bld-in="proc.steps.${i}.n" value="${E(s.n)}" placeholder="Step name" aria-label="Step name">${sel("proc.steps."+i+".who",s.who==="gate"?"gate":STEPMODE.of(s.who),WHO,'aria-label="Who acts"')}<input class="fin" data-bld-in="proc.steps.${i}.owner" value="${E(s.owner)}" placeholder="Owner or agent" aria-label="Step owner"><input class="fin" data-bld-in="proc.steps.${i}.sla" value="${E(s.sla)}" placeholder="SLA, e.g. 1 day" aria-label="Step SLA"><button class="btn quiet" data-bld-act="rm" data-a="proc.steps:${i}" aria-label="Remove step ${i+1}">Remove</button></div>`).join("");
 return `${ov?`<div class="bld-dup bad"><b>A process already exists: ${E(ov.title)}.</b> <span class="small muted">Start from it instead of building a second one, or the gate fails "Reuses existing processes".</span><div style="margin-top:8px"><button class="btn primary" data-bld-act="tpl" data-a="${E(ov.id)}">Start from ${E(ov.title)}</button></div></div>`:""}
 <div class="grid g2" style="gap:14px">${fld("Process name",inp("proc.name",d.proc.name,d.name||"Facilities request handling"))}${fld("Time limit for the whole process",inp("proc.sla",d.proc.sla,"2 business days"))}
 <div class="fld" style="grid-column:1/-1">${fld("What starts it (trigger)",inp("proc.trigger",d.proc.trigger,"A staff member submits a request in the portal"))}</div></div>
 <h4 class="bld-h4">Reuse a process template${d.proc.tpl?` ${pill_("Using "+((PROC.defs[d.proc.tpl]||{}).title||d.proc.tpl),"good")}`:""}</h4>
 <div class="row" style="gap:8px;flex-wrap:wrap">${tp.map(t=>`<button class="btn" data-bld-act="tpl" data-a="${E(t.id)}" title="${t.steps} steps">${E(t.title)}</button>`).join("")||`<span class="small muted">No close template. Pick any process below.</span>`}<select class="fin" style="max-width:260px" data-bld-tplsel aria-label="Pick any process template"><option value="">More templates</option>${allProcs().map(p=>`<option value="${E(p[0])}">${E(p[1])}</option>`).join("")}</select></div>
 <div class="row" style="justify-content:space-between;align-items:center;margin-top:14px"><h4 class="bld-h4" style="margin:0">Steps (drag to reorder)</h4><button class="btn" data-bld-act="addstep">Add step</button></div>
 <div class="bld-sthead small muted"><span></span><span>#</span><span>Step</span><span>Who acts</span><span>Owner</span><span>SLA</span><span></span></div>
 <div class="bld-steps" data-dnd="steps" data-dnd-scope="bld_steps">${steps||`<p class="small muted">No steps. Add steps or start from a template.</p>`}</div>
`;
}
function s3(d){
 const ms=mods(),ents=d.data.reuse.concat(d.data.ext.map(x=>x.ent)).concat(d.data.neu.map(n=>n.id));
 const all=entities();
 const opts=bandList().map(b=>`<optgroup label="${E(b[1])}">${ms.filter(m=>m.band===b[0]).map(m=>`<option value="${E(m.id)}">${E(m.name)}</option>`).join("")}</optgroup>`).join("");
 const eopts=`<optgroup label="This module">${ents.map(id=>`<option value="${E(id)}">${E(entLabel(id))}</option>`).join("")}</optgroup><optgroup label="Registry">${all.slice(0,400).map(e=>`<option value="${E(e.id)}">${E(e.label)}</option>`).join("")}</optgroup>`;
 const c=B.nc||(B.nc={dir:"pull",other:"",entity:"",mode:"event",trig:"",data:""});
 const list=d.conns.map((x,i)=>{const m=modOf(x.other);return `<div class="bld-cn"><span class="bld-dir ${x.dir}">${x.dir==="pull"?"Pulls from":"Pushes to"}</span><span class="bld-cb"><b>${E(m?m.name:x.other)}</b><span class="small muted">${E(entLabel(x.entity))} · ${E(x.trig||"no trigger")}${x.data?" · "+E(x.data):""}</span></span><span class="pill" style="--mc:var(${MODEC[x.mode]||"--accent"})"><i class="bld-mi" style="background:var(${MODEC[x.mode]||"--accent"})"></i>${E(x.mode)}</span><button class="btn quiet" data-bld-act="rm" data-a="conns:${i}" aria-label="Remove connection to ${E(m?m.name:x.other)}">Remove</button></div>`}).join("")||`<p class="small muted">No connections yet. A module with no flows is an island.</p>`;
 return `<div class="bld-addcn"><div class="grid g2" style="gap:12px">${fld("Other module",`<select class="fin" data-bld-nc="other"><option value="">Choose a module</option>${opts}</select>`)}${fld("Direction",chips("nc.dir",c.dir,[["pull","Pull: data comes in"],["push","Push: data goes out"]]))}${fld("Entity carried",`<select class="fin" data-bld-nc="entity"><option value="">Choose an entity</option>${eopts}</select>`)}${fld("Mode",chips("nc.mode",c.mode,MODES))}${fld("Trigger",`<input class="fin" data-bld-nc="trig" placeholder="Request created" value="${E(c.trig)}">`)}${fld("What is carried (optional)",`<input class="fin" data-bld-nc="data" placeholder="Requester, team and manager" value="${E(c.data)}">`)}</div><div style="margin-top:12px"><button class="btn primary" data-bld-act="addcn">Add connection</button></div></div>
 <h4 class="bld-h4">Connections (${d.conns.length})</h4><div class="bld-cns">${list}</div>
 <h4 class="bld-h4">Among its neighbors</h4>${diagram(d,false)}${modeLegend()}`;
}
function s4(d){
 const g=runGate(d),mi=matInfo(d,g),mdl=matModels(),T=mi.target;
 const rows=DIMS.map(x=>{const dm=mi.dims[x[0]],miss=dm.crit.slice(0,T).filter(c=>!c[1]);return `<div class="bld-dim"><div><b>${x[1]}</b><div class="small muted">${E(x[2])}</div></div><div><div class="bld-lv" title="Level ${dm.level} of 5">${[1,2,3,4,5].map(i=>`<i class="${i<=dm.level?"on":""}${i===T?" tg":""}"></i>`).join("")}</div><div class="small">Level ${dm.level}${dm.level>=T?" "+pill_("Meets target","good"):""}</div></div><div class="small">${miss.length?miss.map(c=>"&bull; "+E(c[0])).join("<br>"):"Nothing more is needed for the target."}</div></div>`}).join("");
 return `<div class="grid g2" style="gap:14px">${fld("Maturity model",sel("mat.model",d.mat.model,mdl.map(m=>[m.id,m.n])),"From Maturity models. A model you import there appears here.")}${fld("Target level",chips("mat.target",String(d.mat.target),[1,2,3,4,5].map(i=>[String(i),i+" "+lvName(d.mat.model,i)])))}</div>
 <div class="story small" style="margin:12px 0"><b>Reached today: ${E(lvName(d.mat.model,mi.level||1))} (level ${mi.level}).</b> The process level is the lowest of the six dimensions, as in the process capability scale. ${mi.level>=T?"The target is met.":"Close the gaps below to reach level "+T+"."} After registration the process is added to Maturity models as a capability.</div>
 <div class="bld-dims"><div class="bld-dim hd small muted"><span>Dimension</span><span>Level now</span><span>What it takes to reach level ${T}</span></div>${rows}</div>${legend([["Reached","--accent"],["Target level (outlined)","--good-f"]])}`;
}
const SUGG=[["Cycle time","Average hours from submitted to done = Σ (done − submitted) ÷ count","h","min"],["Triage by agent rate","Requests triaged by an agent without a person ÷ all requests × 100","%","max"],["SLA attainment","Requests done inside the SLA ÷ all requests × 100","%","max"]];
function s5(d){
 const cards=d.metrics.map((m,i)=>`<div class="bld-mc"><div class="row" style="justify-content:space-between;gap:8px"><b>${E(m.n)}</b><span class="row" style="gap:6px"><button class="btn" data-bld-act="editmet" data-a="${i}">Edit</button><button class="btn quiet" data-bld-act="rm" data-a="metrics:${i}">Remove</button></span></div><div class="small"><b>Formula.</b> ${E(m.f)}</div><div class="small muted">Target ${E(m.tgt)}${E(m.u)} (${m.dir==="min"?"lower":"higher"} is better) · Owner ${E(m.owner)} · Remediation: ${E(m.remKind)} "${E(m.remTitle)}"</div></div>`).join("")||`<p class="small muted">No metrics yet. Every number a module shows must be a metric with a formula.</p>`;
 return `<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary" data-bld-act="addmet">Add a metric</button>${SUGG.map((s,i)=>`<button class="btn" data-bld-act="suggmet" data-a="${i}">Suggest: ${E(s[0])}</button>`).join("")}</div>
 <div class="bld-mcs">${cards}</div><p class="small muted">On registration each metric is merged into Metrics with its formula, owner, target and remediation, so it gets a formula chip and a popover like every other number on the platform.</p>`;
}
function s6(d){
 const s=d.sec;
 return `<div class="grid g2" style="gap:14px">${fld("Highest data classification",sel("sec.cls",s.cls,CLS),"Drives masking, retention and who may export.")}<div class="fld"><span class="flab">Roles that use it</span>${chips("sec.roles",s.roles,ROLEOPTS)}</div></div>
 <h4 class="bld-h4">Platform services it uses</h4><div class="bld-togs">${tog("sec.signin",s.signin,"Platform sign-in and access rules")}${tog("sec.notify",s.notify,"Core notifications")}${tog("sec.report",s.report,"Core reporting")}${tog("sec.secrets",s.secrets,"Secrets in the secret store")}${tog("sec.audit",s.audit,"Audit events on every write")}</div>
 <p class="small muted">Turning one off is allowed, but the gate then fails the matching check and asks for an exception with an expiry.</p>
 <h4 class="bld-h4">AI use</h4><div class="bld-togs">${tog("sec.ai",s.ai,"This module uses an AI model")}</div>
 ${s.ai?`<div class="grid g2" style="gap:14px;margin-top:10px">${fld("Model",sel("sec.model",s.model,["Claude Haiku","Claude Sonnet","Embedding model","Other provider, direct"]))}${fld("Monthly spend cap (USD)",`<input class="fin" type="number" min="0" data-bld-in="sec.cap" data-num="1" value="${E(s.cap)}">`)}<div class="fld" style="grid-column:1/-1">${tog("sec.gw",s.gw,"Route every call through the AI gateway")}</div><div class="fld" style="grid-column:1/-1"><span class="flab">Guardrails</span>${chips("sec.guard",s.guard,GUARDS)}</div></div>${!s.gw||s.model==="Other provider, direct"?`<div class="bld-dup bad"><b>Direct model calls are not allowed.</b> <span class="small muted">The gateway is the only route. The check "AI calls use the gateway" fails.</span></div>`:""}<div class="small muted" style="margin-top:8px">${aiChip({model:s.model.replace("Other provider, direct","Other"),conf:.8,src:["Gateway policy","Guardrails chosen here"]})}</div>`:""}`;
}
function s7(d){
 const g=runGate(d),mi=matInfo(d,g),c=counts(d),rg=B.reg.find(r=>r.id===modId(d)&&!r.withdrawn);
 const rows=g.rows.map(r=>`<tr><td><b>${E(r.n)}</b><div class="small muted">${E(r.rule)}</div></td><td>${pill_(r.exc?"exception":r.r,r.r==="pass"?"good":r.r==="warn"?"warn":"bad")}</td><td class="small">${E(r.ev)}${r.fix&&r.r!=="pass"?`<div class="muted">Fix: ${E(r.fix)}</div>`:""}</td><td>${r.r==="fail"?`<button class="btn" data-bld-act="excchk" data-a="${E(r.id)}">Raise exception</button>`:""}</td></tr>`).join("");
 const miss=!d.name||!d.purpose;
 return `${rg?regResult(rg):""}
 <div class="statrow"><div class="stat"><small>Conformance</small><span class="num" data-role="metric">${g.score}%</span><em>${g.pass} pass, ${g.warn} warn, ${g.fail} fail</em></div><div class="stat"><small>Data</small><span class="num">${c.reuse+c.ext}/${c.reuse+c.ext+c.neu}</span><em>reused or extended of all entities</em></div><div class="stat"><small>Flows</small><span class="num">${c.flows}</span><em>new, shown dashed on the map</em></div><div class="stat"><small>Maturity</small><span class="num">${mi.level}/${mi.target}</span><em>reached of target</em></div></div>
 <div class="tscroll"><table><thead><tr><th>Check</th><th>Result</th><th>Evidence</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
 ${d.exc.length?`<h4 class="bld-h4">Exceptions raised (${d.exc.length})</h4>${d.exc.map((x,i)=>`<div class="bld-cn"><span class="bld-dir pull">Exception</span><span class="bld-cb"><b>${E((CHK[x.check]||x.check))}</b><span class="small muted">${E(x.reason)} · owner ${E(x.owner)} · until ${E(x.exp)}</span></span><button class="btn quiet" data-bld-act="rm" data-a="exc:${i}">Withdraw</button></div>`).join("")}<p class="small muted">Each exception becomes a debt item with an owner and an expiry when you register.</p>`:""}
 <div class="story small" style="margin:14px 0"><b>${g.ok&&!miss?"The gate passes.":"The gate blocks."}</b> ${g.ok&&!miss?"Registering adds "+(c.ext+c.neu)+" entit"+((c.ext+c.neu)===1?"y":"ies")+" as Proposed, 1 process, 1 dashed module node and "+c.flows+" flow"+(c.flows===1?"":"s")+".":(miss?"Add a name and purpose first. ":"")+"Fix the failures or raise an exception for each."}</div>
 <div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn primary" data-bld-act="register" ${g.ok&&!miss&&!rg?"":"disabled"}>${rg?"Registered":"Register the module"}</button>${rg?`<button class="btn danger" data-bld-act="withdraw" data-a="${E(rg.id)}">Withdraw and roll back</button>`:""}<button class="btn quiet" data-bld-act="reset">Start over</button></div>`;
}
const CHK=new Proxy({},{get:(o,k)=>{try{const c=GATE.CHECKS.find(x=>x.id===k);return c?c.n:undefined}catch(e){return undefined}}});
function regResult(rg){
 return `<div class="bld-done glass"><div class="eyebrow">Registered ${E(rg.at)}</div><h3>${E(rg.name)} joined the platform as Proposed</h3><p class="small">${rg.ents.length} entit${rg.ents.length===1?"y":"ies"} in the data model, process ${E(rg.procId)} in the library, ${rg.flows} flow${rg.flows===1?"":"s"} on the module map, ${rg.metrics.length} metric${rg.metrics.length===1?"":"s"} in Metrics, ${rg.debt.length} debt item${rg.debt.length===1?"":"s"} for exceptions.${rg.gaps.length?` <span class="bld-bad">Not wired yet: ${E(rg.gaps.join(", "))}.</span>`:""}</p>
 <div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn primary" data-bld-act="tomap" data-a="${E(rg.id)}">See it on the module map</button><button class="btn" data-bld-act="todata" data-a="${E(rg.id)}">See it in the data model</button><button class="btn" data-bld-act="tometrics">See its metrics</button></div></div>`;
}
const STEPFN=[s0,s1,s2,s3,s4,s5,s6,s7];
/* ---------- wizard shell ---------- */
function progHTML(){
 const d=D();if(!d)return"";const g=runGate(d);
 return `<ol class="bld-prog" aria-label="Blueprint steps">${STEPS.map((n,i)=>{const dn=stepDone(i,d,g);return `<li><button type="button" class="${i===B.step?"cur":""}${dn?" done":""}" data-bld-go="${i}" ${i===B.step?'aria-current="step"':""}><span class="bld-num">${dn&&i!==B.step?"&#10003;":i+1}</span><span class="bld-nm">${E(n)}</span></button></li>`}).join("")}</ol><div class="small muted bld-saved" data-bld-saved>${B.saved?"Draft saved at "+E(B.saved)+". Close this and come back, it resumes here.":"Autosaves as you type."}</div>`;
}
function stepHTML(){
 const d=D();
 return `<div class="eyebrow">Step ${B.step+1} of ${STEPS.length}</div><h2 class="bld-h2">${E(STEPS[B.step])}</h2>${STEPFN[B.step](d)}`;
}
function navHTML(){return `<div class="bld-nav"><button class="btn" data-bld-act="back" ${B.step?"":"disabled"}>Back</button><span class="small muted">Step ${B.step+1} of ${STEPS.length}</span><button class="btn primary" data-bld-act="next" ${B.step<STEPS.length-1?"":"disabled"}>Next</button></div>`}
function wizardHTML(){
 const d=D();
 if(!d)return `<div class="card glass bld-start"><div class="eyebrow">Blueprint</div><h2 class="bld-h2">Start a module blueprint</h2><p class="muted">Eight short steps. The blueprint autosaves and the preview shows what the platform gets from you, live. Nothing is registered until you click Register on the last step.</p><div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn primary" data-bld-act="start">Start a blank blueprint</button><button class="btn" data-bld-act="loadex">Load the Facilities requests example</button></div></div>`;
 return `<div class="bld-wiz"><div data-bld-progbox>${progHTML()}</div><div class="bld-cols"><div class="bld-main card glass"><div data-bld-step>${stepHTML()}</div><div data-bld-navbox>${navHTML()}</div></div><aside class="bld-side" data-bld-prev aria-label="Integration preview">${previewHTML()}</aside></div></div>`;
}
const drawStep=()=>{const n=document.querySelector("[data-bld-step]");if(n){n.innerHTML=stepHTML();const nb=document.querySelector("[data-bld-navbox]");if(nb)nb.innerHTML=navHTML()}drawSoft()};
function drawSoft(){
 if(!D())return;
 const p=document.querySelector("[data-bld-prev]");if(p)p.innerHTML=previewHTML();
 const pg=document.querySelector("[data-bld-progbox]");if(pg)pg.innerHTML=progHTML();
 const m=document.querySelector("[data-bld-man]");if(m)m.innerHTML=manifestPane();
}
/* ---------- dashboard ---------- */
const CONTRACTS=[
 ["Identity and permissions","You get","Platform sign-in, roles from Entra ID groups, attribute rules, shared preferences.","You declare","Roles, data classification, support owner.",["auth","owner","nowrite"]],
 ["Data model","You get","Registered entities with owners, stewards and field classes, and the duplicate check.","You declare","What you reuse, extend or propose, with authority and class per field.",["nodup","labels","manifest","ct_data"]],
 ["Process and flows","You get","The process library, the module map and the workflow service.","You declare","Process steps, who acts, SLA, and the flows to other modules.",["noproc","notify","ct_process","ct_links"]],
 ["Metrics","You get","The metric framework: formula chips, popovers, trends and remediation play.","You declare","Each metric with formula, owner, target and remediation, and the maturity model and target.",["ct_metrics"]],
 ["Audit and AI governance","You get","Audit service, AI gateway with spend caps, secret store, accessibility checks.","You declare","Audit hooks, AI use with guardrails, a review or sunset date.",["audit","aigw","secrets","sunset","a11y"]]];
function stageOf(){
 const out=SEEDS.map(s=>({id:s.id,name:s.name,owner:s.owner,stage:s.stage,reuse:s.reuse,ext:s.ext,neu:s.neu,conf:s.conf,next:s.next,band:s.band,purpose:s.purpose,seed:true}));
 const d=D();
 if(d&&d.name&&!B.reg.some(r=>!r.withdrawn&&r.id===modId(d))){const g=runGate(d);out.push({id:"draft",name:d.name,owner:d.owner||"Not set",stage:B.step>=7?"Review":"Blueprint",reuse:d.data.reuse.length,ext:d.data.ext.length,neu:d.data.neu.length,conf:g.score,next:"Step "+(B.step+1)+": "+STEPS[B.step],band:d.band,purpose:d.purpose,draft:true})}
 B.reg.filter(r=>!r.withdrawn).forEach(r=>out.push({id:r.id,name:r.name,owner:r.owner,stage:"Registered",reuse:r.reuse,ext:r.ext,neu:r.neu,conf:r.score,next:"Proposed on the map and in the atlas. Data council approval moves it to live.",band:r.band,purpose:r.purpose,reg:true}));
 return out;
}
function syncMetrics(){
 try{
  const L=stageOf(),re=L.reduce((s,x)=>s+x.reuse+x.ext,0),tot=L.reduce((s,x)=>s+x.reuse+x.ext+x.neu,0);
  const cf=L.filter(x=>x.conf>0);
  METRICS.m_bld_reuse.cur=tot?Math.round(100*re/tot):0;
  METRICS.m_bld_dup.cur=9+B.reg.filter(r=>!r.withdrawn).reduce((s,r)=>s+r.dupF,0)+(D()?(D().dupF||0):0);
  METRICS.m_bld_mods.cur=B.reg.filter(r=>!r.withdrawn).length;
  METRICS.m_bld_conf.cur=cf.length?Math.round(cf.reduce((s,x)=>s+x.conf,0)/cf.length):0;
 }catch(e){}
}
Object.assign(METRICS,{
 m_bld_reuse:{n:"Module data reuse rate",f:"Entities reused or extended by modules in flight and registered ÷ (reused + extended + new entities) × 100",u:"%",cur:78,tgt:85,badAt:60,dir:"max",max:100,tr:[54,58,63,66,70,73,76,78],owner:"Platform team",use:["Build a module","Citizen apps"],rem:{kind:"agent",ref:"AG-BLD1",title:"Offer the existing entity while the builder types",agent:"Registry Agent",auto:false,state:"idle",prog:"Runs the duplicate check on every new entity and offers Reuse or Extend"}},
 m_bld_dup:{n:"Duplicate fields prevented",f:"Count of fields redirected to an existing entity at design time, before registration",u:"fields",cur:9,tgt:25,badAt:5,dir:"max",max:40,tr:[0,1,2,4,5,7,8,9],owner:"Data council",use:["Build a module","Platform registry"],rem:{kind:"sop",ref:"SOP-BLD1",title:"Reuse before you build",agent:"Registry Agent",auto:false,state:"idle",prog:"Shows which fields already exist on the matched entity"}},
 m_bld_mods:{n:"Modules registered through the path",f:"Modules whose blueprint passed the gate and was registered (withdrawn modules excluded)",u:"modules",cur:0,tgt:6,badAt:1,dir:"max",max:10,tr:[0,0,0,0,0,0,0,0],owner:"Platform team",use:["Build a module"],rem:{kind:"kb",ref:"KB0740",title:"How to register a module",agent:"Registry Agent",auto:false,state:"idle",prog:"Walks the owner through the blueprint steps still open"}},
 m_bld_conf:{n:"Average module conformance",f:"Σ gate scores (passes + 0.5 × warnings ÷ checks run) of modules in flight and registered ÷ number of modules",u:"%",cur:75,tgt:85,badAt:65,dir:"max",max:100,tr:[60,63,66,68,70,72,74,75],owner:"Platform team",use:["Build a module","Citizen apps"],rem:{kind:"kb",ref:"KB0741",title:"Fix hints for each gate check",agent:"Registry Agent",auto:false,state:"idle",prog:"Drafts the fix for each failing check"}}
});
function contractCard(c){
 const d=D(),g=d?runGate(d):null;
 const st=g&&c[5].length?(()=>{const rs=g.rows.filter(r=>c[5].includes(r.id));const f=rs.filter(r=>r.r==="fail").length,w=rs.filter(r=>r.r==="warn").length;return f?pill_(f+" failing","bad"):w?pill_(w+" to review","warn"):pill_("Met","good")})():d&&!c[5].length?pill_(d.metrics.length+" metric"+(d.metrics.length===1?"":"s"),d.metrics.length?"good":"warn"):pill_("Not started","mute");
 return `<div class="bld-ct"><div class="row" style="justify-content:space-between;gap:8px"><b>${E(c[0])}</b>${st}</div><p class="small"><b>${c[1]}.</b> ${E(c[2])}</p><p class="small"><b>${c[3]}.</b> ${E(c[4])}</p></div>`;
}
function stageTiles(L){
 const mx=Math.max(1,...STAGES.map(s=>L.filter(x=>x.stage===s).length));
 return `<div class="bld-stg">${STAGES.map(s=>{const n=L.filter(x=>x.stage===s).length;return `<div class="bld-sg"><div class="small muted">${s}</div><div class="num" data-role="metric">${n}</div><div class="bld-bar"><i style="width:${Math.round(100*n/mx)}%;background:var(${STGC[s]})"></i></div></div>`}).join("")}</div>${legend(STAGES.map(s=>[s,STGC[s]]))}`;
}
function dashPane(){
 const L=stageOf();
 const list=L.map(x=>`<div class="bld-mod"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${E(x.name)}</b>${pill_(x.stage,x.stage==="Registered"?"good":x.stage==="Review"?"warn":x.stage==="Idea"?"mute":"info")}</div><div class="small muted">${whoChip(x.owner)} · ${E(BANDN[x.band]||x.band)}</div><div class="small">${E(x.purpose||"")}</div><div class="bld-chips"><span class="pill mute">${x.reuse} reuse</span><span class="pill mute">${x.ext} extend</span><span class="pill mute">${x.neu} new</span>${x.conf?`<span class="pill ${x.conf>=80?"good":x.conf>=65?"warn":"bad"}">Conformance ${x.conf}%</span>`:""}</div><div class="small muted"><b>Next:</b> ${E(x.next)}</div><div class="row" style="gap:8px">${x.draft?`<button class="btn primary" data-bld-act="resume">Resume the blueprint</button>`:x.reg?`<button class="btn" data-bld-act="tomap" data-a="${E(x.id)}">Module map</button><button class="btn" data-bld-act="todata" data-a="${E(x.id)}">Data model</button>`:`<button class="btn" data-bld-act="seed" data-a="${E(x.id)}">Details</button>`}</div></div>`).join("");
 return `<div class="statrow">${[["m_bld_mods"],["m_bld_reuse"],["m_bld_dup"],["m_bld_conf"]].map(a=>{const m=METRICS[a[0]];return `<div class="stat"><small>${E(m.n)}</small><span class="num" data-role="metric">${mval(m)}</span><em>${fchip(a[0])}</em></div>`}).join("")}</div>
 ${card("What every new module gets, and must declare","Five platform contracts. The chips show where your current blueprint stands.",`<div class="bld-cts">${CONTRACTS.map(contractCard).join("")}</div>`)}
 ${card("Modules in flight by stage","Registered modules appear dashed on the module map and Proposed in the data atlas.",stageTiles(L))}
 <div class="bld-mods">${list}</div>`;
}
/* ---------- manifest tab ---------- */
function manifestPane(){
 const d=D();
 if(!d)return `<div class="card glass"><p class="muted">Start or load a blueprint and the manifest is generated from your answers, live.</p><button class="btn primary" data-bld-act="loadex">Load the Facilities requests example</button></div>`;
 const json=JSON.stringify(manifest(d),null,2),mc=mcpArgs(d);
 const tools=["validate_manifest","check_reuse","get_entity","search_registry","run_conformance","request_exception"].concat(window.MCPX&&MCPX.tools.some(t=>t.n==="run_feature_contract")?["run_feature_contract"]:[]);
 const out=B.mcp.out;
 return `<div class="grid g2" style="gap:16px;align-items:start">${card("Module manifest","oukala.module.json, generated from the blueprint. Copy it, or download it and commit it next to the code.",`<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><button class="btn primary" data-bld-act="copy">Copy JSON</button><button class="btn" data-bld-act="dl">Download file</button><span class="pill mute">oukala.module.json · ${json.length.toLocaleString("en-US")} bytes</span></div><pre class="gate-code bld-json" tabindex="0">${E(json)}</pre>`)}
 <div class="bld-mcpcol">${card("How an AI or coding client uses the same path","A person fills the wizard. An AI client calls the same checks as tools on the platform MCP server (Model Context Protocol), then opens a pull request. A human still clicks Register.",`<ol class="bld-ol"><li><b>search_registry</b> and <b>check_reuse</b> before it designs anything.</li><li><b>get_entity</b> to read owner, class and authority of what it will reuse.</li><li>Writes <code>oukala.module.json</code> from the answers.</li><li><b>validate_manifest</b> and <b>run_conformance</b> until nothing fails.</li><li><b>request_exception</b> only with a human owner and an expiry.</li><li>A person reviews and registers it here.</li></ol><p class="small muted">Prompt for a coding client: <i>"Read PLATFORM.md. Build a module called ${E(d.name||"my module")}. Call check_reuse first and validate_manifest before you finish."</i></p>${window.go?`<button class="btn" data-bld-act="tomcp">Open AI and coding clients</button>`:""}`)}
 ${card("Try it: call a tool on this draft","Runs the real MCP tool in the preview. request_exception is shown but not run, because it creates a debt item and needs a human approval.",`<div class="row" style="gap:8px;flex-wrap:wrap">${tools.map(t=>`<button type="button" class="chip${B.mcp.tool===t?" on":""}" aria-pressed="${B.mcp.tool===t}" data-bld-act="mcptool" data-a="${t}">${t}</button>`).join("")}</div><div class="eyebrow" style="margin-top:10px">Arguments</div><pre class="gate-code bld-args" tabindex="0">${E(JSON.stringify(mc[B.mcp.tool]||{},null,2))}</pre><div class="row" style="gap:8px;margin:10px 0"><button class="btn primary" data-bld-act="mcprun" ${B.mcp.tool==="request_exception"?"disabled":""}>Run ${E(B.mcp.tool)}</button></div>${out?`<div class="eyebrow">Result</div><pre class="gate-code bld-args" tabindex="0">${E(out)}</pre>`:`<p class="small muted">No result yet.</p>`}`)}</div></div>`;
}
function mcpArgs(d){
 const ex=d.data.reuse[0]||(d.data.ext[0]||{}).ent||"person";
 let man={};try{man=manifest(d)}catch(e){}
 return{validate_manifest:{manifest:man},check_reuse:{name:d.data.neu[0]?d.data.neu[0].label:d.name,purpose:d.purpose,fields:d.data.neu[0]?d.data.neu[0].fields.map(f=>f.k).join(", "):""},get_entity:{id:ex},search_registry:{query:d.name||"request",kind:"any",limit:5},run_conformance:{app_id:"ca_budget"},run_feature_contract:{manifest:(window.CONTRACT&&CONTRACT.fromDraft?CONTRACT.fromDraft(d):{})},request_exception:{app_id:"ca_budget",check_id:"nodup",reason:"Audit committee needs the old workbook",expires:iso(60)}};
}
/* ---------- example ---------- */
function findLocation(){
 try{const f=PLAT.fieldsAll().find(x=>/location|site|building|room/i.test(x.k)&&x.ent!=="person");if(f)return f.ent}catch(e){}
 return entities().find(e=>e.id==="business_service")?"business_service":"";
}
function exampleDraft(){
 const d=blank(),nid=()=>d.uid++;
 d.name="Facilities requests";d.sn="Facilities";d.purpose="Staff request space, equipment or repairs. An agent triages each request, a manager approves spending, and the facilities team fulfils it.";d.owner="Rina Okafor";d.band="ops";d.sunset=iso(395);
 const loc=findLocation();
 d.data.reuse=["person"].concat(loc?[loc]:[]);
 const req=entities().find(e=>e.id==="request_item")?"request_item":(entities()[0]||{}).id;
 d.data.ext=req?[{ent:req,add:[{k:"facilities_category",type:"enum",authority:"platform",classification:"internal",req:false}]}]:[];
 d.data.neu=[{id:"space_booking",label:"Space booking",domain:"service",authority:"platform",classification:"internal",why:"Nothing in the registry records a reservation of a room or desk with a start, an end and an attendee count.",planned:"",fields:[{k:"space_name",type:"string",authority:"platform",classification:"internal",req:true},{k:"starts_at",type:"date",authority:"platform",classification:"internal",req:true},{k:"ends_at",type:"date",authority:"platform",classification:"internal",req:true},{k:"attendees",type:"number",authority:"platform",classification:"internal",req:false},{k:"booked_cost",type:"currency",authority:"platform",classification:"confidential",req:false}]}];
 d.dupPrev=2;d.dupF=4;
 d.proc={name:"Facilities request handling",trigger:"A staff member submits a facilities request in the portal",sla:"2 business days",tpl:"",steps:[
  {id:"s"+nid(),n:"Request",who:"human",owner:"Requester",sla:"Same day"},{id:"s"+nid(),n:"Triage",who:"agent",owner:"Triage Agent",sla:"15 minutes"},{id:"s"+nid(),n:"Approval",who:"gate",owner:"Facilities manager",sla:"1 day"},{id:"s"+nid(),n:"Fulfil",who:"human",owner:"Facilities team",sla:"2 days"}]};
 const mm=id=>modOf(id)?id:"",notif=(mods().find(m=>/notif/i.test(m.name+m.id))||mods().find(m=>m.id==="chat_home")||{}).id||"";
 d.conns=[{dir:"pull",other:mm("ppl_org"),entity:"person",mode:"event",trig:"Request created",data:"Requester, team and manager"},{dir:"push",other:mm("bud_over"),entity:"cost_allocation",mode:"batch",trig:"Monthly close",data:"Cost of fulfilled requests"},{dir:"push",other:notif,entity:req||"person",mode:"event",trig:"Request status changes",data:"Status event for the requester"}].filter(c=>c.other);
 d.mat={model:"cmmi",target:3};
 d.metrics=[{n:"Request cycle time",f:"Average hours from submitted to fulfilled = Σ (fulfilled − submitted) ÷ requests fulfilled",u:"h",owner:"Rina Okafor",tgt:48,dir:"min",remKind:"sop",remTitle:"Rebalance the facilities queue"},{n:"Triage by agent rate",f:"Requests triaged by the agent without a person ÷ all requests × 100",u:"%",owner:"Rina Okafor",tgt:70,dir:"max",remKind:"agent",remTitle:"Retrain the Triage Agent on misrouted requests"}];
 d.sec={cls:"internal",roles:["Requester","Approver","Fulfiller","Manager"],audit:true,signin:true,notify:true,report:true,secrets:true,ai:true,model:"Claude Haiku",gw:true,cap:60,guard:["No personal data in prompts","A person approves every write","Prompts and answers are logged"]};
 d.exc=[];
 if(PROC.defs.svc_req)d.proc.tpl="svc_req";else{const ov=procOverlap(d);if(ov)d.proc.tpl=ov.id}
 return d;
}
function examplePane(){
 return `<div class="grid g2" style="gap:16px;align-items:start">${card("Worked example: Facilities requests","Load it, step through the wizard, register it, then watch it appear dashed on the map and Proposed in the atlas.",`<ul class="bld-ol"><li><b>Data.</b> Reuses Person and a location source, extends Request item with a facilities category, proposes one new entity: Space booking.</li><li><b>Process.</b> Request, triage by an agent, an approval gate, fulfil.</li><li><b>Flows.</b> Pulls Person from People, pushes Cost to Budgets and a status Event to notifications.</li><li><b>Maturity.</b> Target level 3 on the process capability model.</li><li><b>Metrics.</b> Request cycle time and triage by agent rate.</li></ul><div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn primary" data-bld-act="loadex">Load it into the wizard</button><button class="btn" data-bld-act="loadexrev">Load and jump to review</button></div>`)}
 ${card("What you should see after Register","Each place the module lands, so the integration is visible rather than promised.",`<ul class="bld-ol"><li><b>Module map.</b> A dashed Facilities node with a Proposed pill in the Service operations band, with its three flows.</li><li><b>Data atlas.</b> Space booking and the extended Request item marked Proposed.</li><li><b>Process library.</b> The Facilities request handling process with maturity.</li><li><b>Metrics.</b> Two new metrics with formula chips.</li><li><b>Search and chat.</b> The module is findable and "withdraw module Facilities requests" rolls it all back.</li></ul>`)}</div>`;
}
/* ---------- enforcement ---------- */
function enforcePane(){
 const q=B.quar.map(x=>`<tr><td>${E(x.at)}</td><td>${E(x.mod)}</td><td><code>${E(x.ent)}</code></td><td>${pill_("Quarantined","bad")}</td><td class="small">${E(x.why)}</td></tr>`).join("");
 const so=simRun();
 return `<div class="bld-3c">${[
  ["1. Design time: reuse first","check_reuse and the wizard search the registry while you type. A near-duplicate entity cannot be created without a written reason and an exception.","Prevents the problem. Metrics: reuse rate, duplicate fields prevented.","--accent"],
  ["2. Publish: the gate","The conformance checks plus the debt budget decide whether the module registers. Failures need a fix or an exception with an owner and an expiry.","Catches what slipped through. Metrics: average conformance, modules registered.","--warn-f"],
  ["3. Runtime: the guard","Only registered entities are writable. A write to an entity nobody registered is quarantined: held, logged, and sent to the data council instead of landing in a shadow table.","Stops drift in production. Metric: quarantined writes, shown below.","--good-f"]].map(c=>`<div class="bld-en glass" style="--ec:var(${c[3]})"><b>${E(c[0])}</b><p class="small">${E(c[1])}</p><p class="small muted">${E(c[2])}</p></div>`).join("")}</div>
 <div class="statrow">${["m_bld_reuse","m_bld_dup","m_bld_mods","m_bld_conf"].map(id=>`<div class="stat"><small>${E(METRICS[id].n)}</small><span class="num" data-role="metric">${mval(METRICS[id])}</span><em>${fchip(id)}</em></div>`).join("")}</div>
 <div class="grid g2" style="gap:16px;align-items:start">${card("Try the runtime guard","Pick a module and an entity name. The guard checks the registry, including entities registered as Proposed from this screen.",`<div class="grid g2" style="gap:12px"><label class="fld"><span class="flab">Module writing</span><input class="fin" data-bld-sim="mod" value="${E(B.sim.mod)}"></label><label class="fld"><span class="flab">Entity it writes</span><input class="fin" data-bld-sim="ent" value="${E(B.sim.ent)}" list="bld-entlist"></label></div><datalist id="bld-entlist">${entities().slice(0,200).map(e=>`<option value="${E(e.id)}">`).join("")}</datalist><div class="row" style="gap:8px;margin:10px 0"><button class="btn primary" data-bld-act="simwrite">Attempt the write</button></div><div class="bld-dup ${so.cls}" data-bld-simout><b>${E(so.t)}</b> <span class="small muted">${E(so.d)}</span></div>`)}
 ${card("Quarantined writes ("+B.quar.length+")","Writes to entities that are not registered. Each one is held for the data council.",B.quar.length?`<div class="tscroll"><table><thead><tr><th>When</th><th>Module</th><th>Entity</th><th>State</th><th>Why</th></tr></thead><tbody>${q}</tbody></table></div>`:`<p class="small muted">None yet. Try writing to an entity that is not in the registry.</p>`)}</div>`;
}
function simRun(){
 const x=slug(B.sim.ent);if(!x)return{cls:"warn",t:"Enter an entity name.",d:"The guard looks it up in the registry."};
 const e=entities().find(en=>en.id===x||slug(en.label)===x);
 const rg=B.reg.find(r=>!r.withdrawn&&r.ents.some(en=>en.id===x));
 if(rg)return{cls:"warn",t:"Allowed in the sandbox store only.",d:"Registered as Proposed by "+rg.name+". Production writes wait for data council approval."};
 if(e)return{cls:"ok",t:"Allowed through the owner's API.",d:e.label+" is registered. Owner "+e.owner+"; validation and audit apply."};
 return{cls:"bad",t:"Quarantined.",d:"No registered entity matches \""+B.sim.ent+"\". The write is held and the data council is notified."};
}
/* ---------- registration ---------- */
function register(){
 const d=D();if(!d)return;
 const g=runGate(d);
 if(!d.name||!d.purpose){toast("Add a name and purpose first","warn");return}
 if(!g.ok){toast("The gate blocks this: "+g.rows.filter(r=>r.r==="fail").map(r=>r.n).slice(0,2).join(", "),"warn");return}
 let mid=modId(d);if(B.reg.some(r=>r.id===mid&&!r.withdrawn)||modOf(mid))mid=mid+"_"+(B.reg.length+2);
 d.id=mid;
 const gaps=[],ents=[];
 /* data model */
 const addEnt=(def,snap)=>{
  let res=null;
  if(window.ATLAS&&ATLAS.addEntity){try{res=ATLAS.addEntity(def);if(res&&res.ok===false)B.lastAtlas=JSON.stringify(res)}catch(e){res={ok:false,warnings:[String(e.message||e)]}}}
  if(!res||res.ok===false){if(gaps.indexOf("ATLAS.addEntity")<0)gaps.push("ATLAS.addEntity");try{DATAMODEL.register(def.id,{label:def.label,source:def.source,domain:def.domain,fields:def.fields.map(f=>({k:f.k,label:f.label,type:f.type}))});PLAT.refresh&&PLAT.refresh();res={ok:true}}catch(e){res={ok:false}}}
  try{const t=DATAMODEL.tables[def.id];if(t&&def.extend&&!def.fields.every(f=>t.fields.some(x=>x.k===f.k))){DATAMODEL.register(def.id,{label:t.label,source:t.source,domain:def.domain,fields:def.fields.map(f=>({k:f.k,label:f.label,type:f.type}))});PLAT.refresh&&PLAT.refresh()}}catch(e){}
  try{PLAT.refresh&&PLAT.refresh()}catch(e){}
  ents.push({id:def.id,kind:def.extend?"extend":"new",snap:snap||null,ok:!res||res.ok!==false});
 };
 d.data.neu.forEach(n=>{let id=n.id||slug(n.label);if(entities().some(e=>e.id===id))id=id+"_"+mid.slice(0,6);n.id=id;addEnt({id,label:n.label,domain:n.domain,source:d.name,ownerApp:mid,status:"proposed",fields:n.fields.map(f=>({k:f.k,label:cap(f.k.replace(/_/g," ")),type:f.type,authority:f.authority,classification:f.classification,req:!!f.req}))})});
 d.data.ext.forEach(x=>{const t=(DATAMODEL.tables||{})[x.ent];if(!t)return;const snap=clone({fields:t.fields});
  const have=new Set(t.fields.map(f=>f.k));
  t.fields=t.fields.concat(x.add.filter(f=>f.k&&!have.has(f.k)).map(f=>({k:f.k,label:cap(f.k.replace(/_/g," ")),type:f.type,authority:f.authority,classification:f.classification,proposed:true,addedBy:mid})));
  try{PLAT.refresh&&PLAT.refresh();window.ATLAS&&ATLAS.bump&&ATLAS.bump()}catch(e){}
  ents.push({id:x.ent,kind:"extend",snap,ok:true})});
 /* process */
 const procId=mid+"_process",pdef={id:procId,name:d.proc.name||d.name,module:mid,family:BANDN[d.band]||"Service operations",owner:d.owner,trigger:d.proc.trigger,steps:d.proc.steps.map((s,i)=>({n:i+1,d:s.n,who:s.who,owner:s.owner,sla:s.sla,in:i?d.proc.steps[i-1].n:d.proc.trigger,out:s.n})),inputs:[d.proc.trigger],outputs:[d.proc.steps.length?d.proc.steps[d.proc.steps.length-1].n:""],entities:d.data.reuse.concat(d.data.ext.map(x=>x.ent),d.data.neu.map(n=>n.id)),metrics:d.metrics.map(m=>metId(d,m)),model:d.mat.model,target:+d.mat.target};
 pdef.steps.forEach((s,i)=>{s.name=d.proc.steps[i].n});
 /* metrics first so the process can reference them */
 const mids=[];
 d.metrics.forEach(m=>{const id=metId(d,m),t=+m.tgt||0;METRICS[id]={n:m.n,f:m.f,u:m.u||"",cur:0,tgt:t,badAt:m.dir==="min"?Math.round(t*1.5*100)/100:Math.round(t*.6*100)/100,dir:m.dir||"max",max:Math.max(100,t*2),tr:[0,0,0,0,0,0,0,0],owner:m.owner,use:[d.name],rem:{kind:m.remKind||"sop",ref:"SOP-"+slug(d.name).slice(0,6).toUpperCase(),title:m.remTitle,agent:"Registry Agent",auto:false,state:"idle",prog:"Proposed with the "+d.name+" blueprint. First reading after go-live."}};mids.push(id)});
 /* module map */
 const flows=d.conns.map(c=>({dir:c.dir,other:c.other,data:c.data||entLabel(c.entity),entity:c.entity,mode:c.mode,trig:c.trig}));
 const mdef={id:mid,name:d.name,sn:(d.sn||d.name).slice(0,14),band:d.band,own:d.owner,r:d.data.reuse.concat(d.data.ext.map(x=>x.ent)),w:d.data.ext.map(x=>x.ent).concat(d.data.neu.map(n=>n.id)),proposed:true,flows};
 let mr=null;
 if(window.MODMAP&&MODMAP.addModule){try{mr=MODMAP.addModule(mdef)}catch(e){mr={ok:false,warnings:[String(e.message||e)]}}}else gaps.push("MODMAP.addModule");
 let pr=null;
 if(window.PROCLIB&&PROCLIB.addProcess){try{pr=PROCLIB.addProcess(pdef)}catch(e){pr={ok:false,warnings:[String(e.message||e)]}}}
 else{gaps.push("PROCLIB.addProcess");try{PROC.reg("bld_"+mid,{title:pdef.name,std:["cmmi"],steps:d.proc.steps.map(s=>({n:s.n,d:s.n,who:s.who,owner:s.owner,sla:s.sla}))})}catch(e){}}
 /* search, debt, audit */
 const debt=[];
 const TY={nodup:"dup_entity",noproc:"dup_proc",nowrite:"nonowner",notify:"bypass",auth:"bypass",labels:"no_class",owner:"orphan",secrets:"ooc"};
 d.exc.forEach(x=>{try{const id=window.DEBT&&DEBT.add?DEBT.add({type:TY[x.check]||"ooc",title:d.name+": exception for "+(CHK[x.check]||x.check),sev:"Medium",source:"exception",apps:[],ents:[],owner:d.name,owner2:x.owner,steward:"Data council chair",principal:12,exp:x.exp,reason:x.reason+(x.ctrl?" Control: "+x.ctrl:""),status:"accepted",fix:"Exception until "+x.exp}):"";if(id)debt.push(id);else if(gaps.indexOf("DEBT.add")<0)gaps.push("DEBT.add")}catch(e){}});
 const rec={id:mid,name:d.name,owner:d.owner,band:d.band,purpose:d.purpose,at:"on "+TODAY.slice(5).replace("-","/")+" at "+new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}),score:g.score,reuse:d.data.reuse.length,ext:d.data.ext.length,neu:d.data.neu.length,dupF:d.dupF||0,ents,procId:(pr&&pr.id)||procId,metrics:mids,debt,flows:flows.length,gaps,draft:clone(d),withdrawn:false,warnings:[].concat((pr&&pr.warnings)||[],(mr&&mr.warnings)||[])};
 B.reg.push(rec);gaps.forEach(x=>{if(B.missing.indexOf(x)<0)B.missing.push(x)});
 syncMetrics();
 audit("Module registered",d.name+": "+ents.length+" entities Proposed, "+flows.length+" flows, "+mids.length+" metrics, "+debt.length+" exceptions, conformance "+g.score+"%");
 toast(d.name+" registered as Proposed"+(gaps.length?" (not wired: "+gaps.join(", ")+")":""),gaps.length?"warn":"good");
 render();
 return rec;
}
function withdraw(id){
 const rec=B.reg.find(r=>r.id===id&&!r.withdrawn);if(!rec)return;
 rec.ents.forEach(en=>{
  if(en.kind==="new"){let done=false;if(window.ATLAS&&ATLAS.removeEntity){try{ATLAS.removeEntity(en.id);done=true}catch(e){}}if(!done){try{delete DATAMODEL.tables[en.id];DATAMODEL._v++;PLAT.refresh&&PLAT.refresh()}catch(e){}}}
  else if(en.snap){try{DATAMODEL.tables[en.id].fields=en.snap.fields;PLAT.refresh&&PLAT.refresh();window.ATLAS&&ATLAS.bump&&ATLAS.bump()}catch(e){}}
 });
 try{if(window.PROCLIB&&PROCLIB.removeProcess)PROCLIB.removeProcess(rec.procId);else if(window.PROCLIB&&PROCLIB.remove)PROCLIB.remove(rec.procId);delete PROC.defs["bld_"+id]}catch(e){}
 try{if(window.MODMAP&&MODMAP.removeModule)MODMAP.removeModule(id);else if(window.MODMAP){const ms=MODMAP.modules,fl=MODMAP.flows;for(let i=ms.length-1;i>=0;i--)if(ms[i].id===id)ms.splice(i,1);for(let i=fl.length-1;i>=0;i--)if(fl[i].from===id||fl[i].to===id)fl.splice(i,1)}}catch(e){}
 rec.metrics.forEach(m=>{delete METRICS[m]});
 try{rec.debt.forEach(x=>{if(window.DEBT&&DEBT.remove)DEBT.remove(x);else if(window.DEBT&&DEBT.close)DEBT.close(x)})}catch(e){}
 rec.withdrawn=true;B.d=clone(rec.draft);B.d.id="";B.step=7;
 syncMetrics();audit("Module withdrawn",rec.name+": entities, process, map node, flows, metrics and debt items rolled back");toast(rec.name+" withdrawn. The blueprint is back in the wizard.","good");render();
}
function toMap(id){
 const rec=B.reg.find(r=>r.id===id)||{id};
 try{if(window.MODMAP&&MODMAP.focus){MODMAP.focus(rec.id);return}}catch(e){}
 if(S.mm){Object.assign(S.mm,{sel:rec.id,pair:null,jny:null,flow:null,edge:null,flyIds:[rec.id]});S.v.mm_v=0}
 go("plat_map");
}
function toData(id){
 const rec=B.reg.find(r=>r.id===id);const e=rec&&rec.ents[0];
 if(window.ATLAS&&ATLAS.focus&&e){ATLAS.focus(e.id);return}
 go("plat_data");
}
/* ---------- screen ---------- */
function heroStory(){
 const L=stageOf(),n=L.length,m=METRICS;
 return `<b>${n} module${n===1?"":"s"}</b> ${n===1?"is":"are"} on the way in, reusing <b>${m.m_bld_reuse.cur}%</b> of their data from the registry. A new application joins the platform the same way whether a person or an AI coding client builds it: reuse first, declare the five contracts, pass the gate, register as Proposed.`;
}
function screen(){
 syncMetrics();
 const extra=`<div class="row" style="gap:10px;flex-wrap:wrap">${fchip("m_bld_reuse")}${fchip("m_bld_mods")}<button class="btn primary" data-bld-act="${D()?"resume":"start"}">${D()?"Resume the blueprint":"Build a module"}</button></div>`;
 return `<div class="screen">${hero("Platform","Build a module",heroStory(),extra)}${lensNote()}${views("bld",["Overview","Blueprint","Manifest and AI clients","Worked example","How enforcement works"],[dashPane(),wizardHTML(),`<div data-bld-man>${manifestPane()}</div>`,examplePane(),enforcePane()])}${procCard("plat_build")}</div>`;
}
REG("plat_build","Build a module","platform","M4 4h7v7H4zM13 13h7v7h-7zM17 4v6M14 7h6M7 14v6M4 17h6",screen);
PROC.reg("plat_build",{title:"How a new module joins the platform",std:["togaf","cmmi","iso27k"],steps:[
 {n:"Reuse check",d:"The blueprint searches the registry and process library while the builder types. A person or an AI client gets the same answer.",who:"robot",owner:"Platform",out:"Reuse report"},
 {n:"Blueprint",d:"Purpose, data, process, connections, maturity, metrics, security and AI are declared in eight steps.",who:"human",owner:"Module owner",out:"Manifest"},
 {n:"Draft help",d:"The Registry Agent suggests entities to reuse, fields to label and metrics to define.",who:"agent",owner:"Registry Agent",out:"Suggestions"},
 {n:"Conformance gate",d:"Every conformance check and the debt budget. A failure needs a fix or an exception with an owner and an expiry.",who:"gate",owner:"Platform team",sla:"Instant",out:"Pass or blocked"},
 {n:"Register as Proposed",d:"Entities, process, module node, flows and metrics are added in one step and can be withdrawn in one step.",who:"robot",owner:"Platform",out:"Proposed module"},
 {n:"Data council approval",d:"The council approves new entities and extensions; the module goes live and its maturity is scored.",who:"human",owner:"Data council",sla:"3 days",out:"Live module"}]});
/* ---------- events ---------- */
let deb=null;
document.addEventListener("input",e=>{
 let t=e.target.closest("[data-bld-in]");
 if(t&&t.tagName!=="SELECT"&&D()){
  const p=t.dataset.bldIn;let v=t.value;if(t.dataset.num)v=+v;
  setp(D(),p,v);touch();
  if(p==="name"&&!D().id){/* id follows the name until registered */}
  const m=/^data\.neu\.(\d+)\.(label|why|fields)/.exec(p);
  if(m){const n=D().data.neu[+m[1]];if(m[2]==="label"&&!n.planned)n.id=slug(n.label);clearTimeout(deb);deb=setTimeout(()=>{const box=document.querySelector(`[data-bld-hits="${m[1]}"]`);if(box)box.innerHTML=hitsHTML(D(),n,+m[1]);drawSoft()},320)}
  else drawSoft();
  const sv=document.querySelector("[data-bld-saved]");if(sv)sv.textContent="Draft saved at "+B.saved+". Close this and come back, it resumes here.";
  return;
 }
 t=e.target.closest("[data-bld-q]");if(t){B.q=t.value;clearTimeout(deb);deb=setTimeout(()=>{const pos=t.selectionStart;drawStep();const n=document.querySelector("[data-bld-q]");if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}},260);return}
 t=e.target.closest("[data-bld-nc]");if(t){B.nc=B.nc||{};B.nc[t.dataset.bldNc]=t.value;return}
 t=e.target.closest("[data-bld-sim]");if(t){B.sim[t.dataset.bldSim]=t.value;return}
});
document.addEventListener("change",e=>{
 let t=e.target.closest("[data-bld-in]");
 if(t&&t.tagName==="SELECT"&&D()){
  const p=t.dataset.bldIn;setp(D(),p,t.value);touch();
  if(/^(mat|sec)\./.test(p)||/^data\.neu\.\d+\.domain/.test(p)||/\.who$/.test(p)||p==="band"||p==="owner"){drawStep()}else drawSoft();
  return;
 }
 if(t&&D()&&t.type==="date"){setp(D(),t.dataset.bldIn,t.value);touch();drawSoft();return}
 t=e.target.closest("[data-bld-nc]");if(t&&t.tagName==="SELECT"){B.nc=B.nc||{};B.nc[t.dataset.bldNc]=t.value;return}
 t=e.target.closest("[data-bld-tplsel]");if(t&&t.value){useTpl(t.value);return}
 t=e.target.closest("[data-bld-sim]");if(t){B.sim[t.dataset.bldSim]=t.value}
});
function useTpl(id){
 const d=D(),p=PROC.defs[id];if(!p)return;
 d.proc.tpl=id;d.proc.steps=(p.steps||[]).map(s=>({id:"s"+uid(),n:s.n,who:s.who||"human",owner:s.owner||"",sla:s.sla||""}));
 if(!d.proc.name)d.proc.name=p.title;touch();audit("Blueprint: started from process template",p.title);toast("Steps copied from "+p.title+". Edit them to fit.","good");drawStep();
}
function excForm(chk,entIdx){
 const d=D();const lbl=chk==="nodup"&&entIdx!=null?"duplicate entity "+d.data.neu[entIdx].label:(CHK[chk]||chk);
 openForm({id:"bld_exc",title:"Raise an exception: "+lbl,submit:"Raise the exception",story:"The check is waived until the expiry. When you register, a debt item with an owner is created. When it expires the check fails again.",
  fields:[{k:"reason",label:"Why can this not be fixed now",type:"longtext",req:true,help:chk==="nodup"?"Say why the existing entity cannot be reused or extended.":""},{k:"owner",label:"Owner who answers for it",type:"people",req:true},{k:"exp",label:"Expires on",type:"date",req:true},{k:"ctrl",label:"Compensating control",type:"text",ph:"Weekly review by the owner"}],
  defaults:{owner:d.owner||"Rina Okafor",exp:iso(90)},
  live:v=>`<div class="story"><b>What happens next.</b> The data council sees this exception with your reason. It lasts ${v.exp?Math.max(0,Math.round((new Date(v.exp)-new Date(TODAY))/864e5)):0} days and is capped at 90 days for a team module.</div>`,
  onSubmit:v=>{d.exc.push({check:chk,ent:entIdx!=null?d.data.neu[entIdx].id:"",reason:v.reason,owner:v.owner,exp:v.exp,ctrl:v.ctrl||""});touch();audit("Blueprint: exception raised",d.name+" "+chk);toast("Exception raised","good");closeDrawer();drawStep()}});
}
function metForm(i){
 const d=D(),m=i!=null?d.metrics[i]:null;
 openForm({id:"bld_met",title:m?"Edit metric":"Add a metric",submit:m?"Save metric":"Add metric",story:"Every metric needs a formula, an owner, a target and a remediation. On registration it is merged into Metrics so it gets a formula chip like every other number.",
  fields:[{k:"n",label:"Name",type:"text",req:true,ph:"Request cycle time"},{k:"f",label:"Formula in words",type:"longtext",req:true,ph:"Σ (done − submitted) ÷ requests done",help:"Use × and ÷ so it reads as math."},{k:"u",label:"Unit",type:"select",opts:[["","None"],["%","Percent"],["h","Hours"],["d","Days"]]},{k:"dir",label:"Better when",type:"chips",opts:[["max","Higher"],["min","Lower"]]},{k:"tgt",label:"Target",type:"number",req:true},{k:"owner",label:"Owner",type:"people",req:true},{k:"remKind",label:"Remediation type",type:"chips",opts:[["sop","Procedure"],["kb","Knowledge article"],["agent","AI agent"]]},{k:"remTitle",label:"Remediation: what happens when it slips",type:"text",req:true,ph:"Rebalance the queue"}],
  defaults:m?Object.assign({},m):{u:"%",dir:"max",remKind:"sop",owner:d.owner},
  onSubmit:v=>{const o={n:v.n,f:v.f,u:v.u||"",dir:v.dir||"max",tgt:v.tgt,owner:v.owner,remKind:v.remKind||"sop",remTitle:v.remTitle};if(i!=null)d.metrics[i]=o;else d.metrics.push(o);touch();audit("Blueprint: metric "+(m?"edited":"added"),o.n);toast("Metric saved","good");closeDrawer();drawStep()}});
}
function mcpRun(){
 const d=D();if(!d)return;const a=mcpArgs(d)[B.mcp.tool]||{};
 try{if(!window.MCPX)throw new Error("The MCP server module is not loaded.");B.mcp.out=JSON.stringify(MCPX.call(B.mcp.tool,a),null,2)}catch(e){B.mcp.out="Error: "+(e&&e.message||e)}
 audit("MCP tool tried from Build a module",B.mcp.tool);
 const m=document.querySelector("[data-bld-man]");if(m)m.innerHTML=manifestPane();
}
document.addEventListener("click",e=>{
 let t=e.target.closest("[data-bld-go]");if(t&&D()){B.step=+t.dataset.bldGo;drawStep();return}
 t=e.target.closest("[data-bld-chip]");if(t&&D()){
  const p=t.dataset.bldChip,v=t.dataset.v;
  if(p.indexOf("nc.")===0){B.nc=B.nc||{};B.nc[p.slice(3)]=v;drawStep();return}
  const cur=getp(D(),p);if(Array.isArray(cur)){const i=cur.indexOf(v);if(i>=0)cur.splice(i,1);else cur.push(v)}else setp(D(),p,p==="mat.target"?+v:v);
  touch();drawStep();return}
 t=e.target.closest("[data-bld-tog]");if(t&&D()){const p=t.dataset.bldTog;setp(D(),p,!getp(D(),p));touch();drawStep();return}
 t=e.target.closest("[data-bld-act]");if(!t)return;
 const a=t.dataset.bldAct,x=t.dataset.a,d=D();
 switch(a){
  case"start":B.d=blank();B.step=0;B.q="";B.nc=null;S.v.bld=1;touch();audit("Blueprint started","Build a module");render();break;
  case"resume":S.v.bld=1;render();break;
  case"loadex":case"loadexrev":B.d=exampleDraft();B.step=a==="loadexrev"?7:0;B.q="";B.nc=null;S.v.bld=1;touch();audit("Blueprint loaded","Facilities requests example");toast("Facilities requests loaded. Step through it, then register.","good");render();break;
  case"reset":B.d=blank();B.step=0;B.q="";touch();audit("Blueprint reset","Build a module");render();break;
  case"next":if(d&&B.step<STEPS.length-1){B.step++;drawStep();window.scrollTo&&document.querySelector(".bld-wiz")&&document.querySelector(".bld-wiz").scrollIntoView({block:"start",behavior:"smooth"})}break;
  case"back":if(d&&B.step>0){B.step--;drawStep()}break;
  case"reuse":if(d&&!d.data.reuse.includes(x)){d.data.reuse.push(x);touch();audit("Blueprint: reuse entity",x);drawStep()}break;
  case"unreuse":d.data.reuse=d.data.reuse.filter(i=>i!==x);touch();drawStep();break;
  case"extend":if(d&&!d.data.ext.some(i=>i.ent===x)){d.data.ext.push({ent:x,add:[newField()]});touch();audit("Blueprint: extend entity",x);drawStep()}break;
  case"unext":d.data.ext.splice(+x,1);touch();drawStep();break;
  case"promote":{const p=planned().find(q=>q[0]===x);if(p){d.data.neu.push({id:p[0],label:p[2],domain:p[1],authority:"platform",classification:"internal",why:p[4],planned:p[0],fields:[newField()]});touch();audit("Blueprint: promote planned entity",p[0]);drawStep()}break}
  case"addnew":d.data.neu.push({id:"",label:"",domain:"service",authority:"platform",classification:"internal",why:"",planned:"",fields:[newField()]});touch();drawStep();break;
  case"unnew":d.data.neu.splice(+x,1);touch();drawStep();break;
  case"addf":{const l=getp(d,x);l.push(newField());touch();drawStep();break}
  case"rm":{const [p,i]=x.split(":");getp(d,p).splice(+i,1);touch();drawStep();break}
  case"dupreuse":case"dupext":{const [i,id]=x.split(":"),n=d.data.neu[+i],hit=hitsOf(n).find(h=>h.id===id);if(!n)break;
   const ov=hit?overlapFields(n,hit):0;d.dupPrev=(d.dupPrev||0)+1;d.dupF=(d.dupF||0)+Math.max(ov,1);
   d.data.neu.splice(+i,1);
   if(a==="dupreuse"){if(!d.data.reuse.includes(id))d.data.reuse.push(id)}
   else{const ks=new Set((PLAT.ent(id)||{fields:[]}).fields.map(f=>f.k));const add=n.fields.filter(f=>f.k&&!ks.has(f.k));if(!d.data.ext.some(q=>q.ent===id))d.data.ext.push({ent:id,add:add.length?add:[newField()]})}
   touch();audit("Blueprint: duplicate avoided",(n.label||"entity")+" now "+(a==="dupreuse"?"reuses ":"extends ")+id);toast("Duplicate avoided: "+(a==="dupreuse"?"reusing ":"extending ")+entLabel(id),"good");drawStep();break}
  case"excnew":excForm("nodup",+x);break;
  case"excchk":excForm(x,null);break;
  case"tpl":useTpl(x);break;
  case"addstep":d.proc.steps.push({id:"s"+uid(),n:"",who:"human",owner:"",sla:""});touch();drawStep();break;
  case"addcn":{const c=B.nc||{};if(!c.other||!c.entity){toast("Choose the other module and the entity carried","warn");break}d.conns.push({dir:c.dir||"pull",other:c.other,entity:c.entity,mode:c.mode||"event",trig:c.trig||"",data:c.data||""});B.nc=null;touch();audit("Blueprint: connection added",c.other);drawStep();break}
  case"addmet":metForm(null);break;
  case"editmet":metForm(+x);break;
  case"suggmet":{const s=SUGG[+x];d.metrics.push({n:s[0],f:s[1],u:s[2],owner:d.owner||"",tgt:s[3]==="min"?48:s[2]==="%"?80:48,dir:s[3],remKind:"sop",remTitle:"Review the queue and rebalance"});touch();audit("Blueprint: metric suggested",s[0]);toast("Added "+s[0]+". Check the target and owner.","good");drawStep();break}
  case"register":register();break;
  case"withdraw":withdraw(x);break;
  case"tomap":toMap(x);break;
  case"todata":toData(x);break;
  case"tometrics":go("metrics");break;
  case"tomcp":go("plat_mcp");break;
  case"seed":{const s=SEEDS.find(q=>q.id===x);if(s)openDrawer(`<div class="eyebrow">${E(s.stage)}</div><h2 style="margin:4px 0">${E(s.name)}</h2><p class="muted small">Owner ${E(s.owner)} · ${E(BANDN[s.band])}</p><div class="story">${E(s.purpose)}</div><div class="statrow"><div class="stat"><small>Reuse</small><span class="num">${s.reuse}</span></div><div class="stat"><small>Extend</small><span class="num">${s.ext}</span></div><div class="stat"><small>New</small><span class="num">${s.neu}</span></div><div class="stat"><small>Conformance</small><span class="num">${s.conf||"None"}${s.conf?"%":""}</span></div></div><p class="small"><b>Next step.</b> ${E(s.next)}</p>`);break}
  case"copy":{const txt=JSON.stringify(manifest(d),null,2);try{navigator.clipboard.writeText(txt).then(()=>toast("Manifest copied","good"),()=>toast("Copy blocked by the browser. Select the text instead.","warn"))}catch(x2){toast("Copy blocked by the browser. Select the text instead.","warn")}audit("Manifest copied",d.name);break}
  case"dl":{try{const b=new Blob([JSON.stringify(manifest(d),null,2)],{type:"application/json"}),u=URL.createObjectURL(b),l=document.createElement("a");l.href=u;l.download="oukala.module.json";document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),500);toast("Downloaded oukala.module.json","good")}catch(x2){toast("Download is not available here","warn")}audit("Manifest downloaded",d.name);break}
  case"mcptool":B.mcp.tool=x;B.mcp.out=null;{const m=document.querySelector("[data-bld-man]");if(m)m.innerHTML=manifestPane()}break;
  case"mcprun":mcpRun();break;
  case"simwrite":{const r=simRun();if(r.cls==="bad"){B.quar.unshift({at:"just now",mod:B.sim.mod||"Unknown module",ent:B.sim.ent,why:"Entity is not registered"});audit("Runtime guard quarantined a write",B.sim.mod+" to "+B.sim.ent);toast("Write quarantined","warn")}else toast(r.t,"good");render();break}
 }
});
/* ---------- DND: reorder process steps ---------- */
DND.on("bld_steps",(id,from,to,idx)=>{
 const d=D();if(!d)return;const st=d.proc.steps,i=st.findIndex(s=>s.id===id);if(i<0)return;
 const [s]=st.splice(i,1);let ni=idx>i?idx-1:idx;ni=Math.max(0,Math.min(st.length,ni));st.splice(ni,0,s);touch();audit("Blueprint: step reordered",s.n);drawStep();
 setTimeout(()=>{const n=document.querySelector(`[data-bld-step] [data-dnd-id="${id}"]`);if(n)n.focus()},30);
});
/* ---------- search, chat ---------- */
SEARCHX.push(()=>{
 const o=[{g:"Platform",t:"Build a module",m:"Blueprint wizard, manifest, enforcement",c:"--p4",f:()=>{S.v.bld=1;go("plat_build")},k:"build module application app new register blueprint reuse first gate how do i add an application vibe coding"},
  {g:"Platform",t:"Worked example: Facilities requests",m:"Load into the blueprint wizard",c:"--p4",f:()=>{S.v.bld=3;go("plat_build")},k:"facilities requests example worked module build"},
  {g:"Platform",t:"How module enforcement works",m:"Reuse first, gate, runtime guard",c:"--p4",f:()=>{S.v.bld=4;go("plat_build")},k:"enforcement runtime guard quarantine reuse gate"}];
 B.reg.filter(r=>!r.withdrawn).forEach(r=>o.push({g:"Modules",t:r.name+" (Proposed)",m:"Registered through Build a module",c:"--p4",f:()=>toMap(r.id),k:"proposed module registered "+r.purpose}));
 SEEDS.forEach(s=>o.push({g:"Modules in flight",t:s.name,m:s.stage+" · "+s.owner,c:"--p4",f:()=>{S.v.bld=0;go("plat_build")},k:"module blueprint "+s.purpose}));
 return o;
});
ASKX.push(q=>{
 const t=q.toLowerCase();let m;
 if(/^(?:please )?(?:withdraw|roll ?back|unregister)\s+(?:the\s+)?module\s+(.+?)\s*[?.!]*$/.test(t)){
  m=t.match(/module\s+(.+?)\s*[?.!]*$/);const nm=m[1],rec=B.reg.find(r=>!r.withdrawn&&(r.name.toLowerCase()===nm||r.id===slug(nm)||r.name.toLowerCase().indexOf(nm)>=0));
  if(!rec){say(q,{t:"No registered module is called "+E(nm)+". Registered through Build a module: "+(B.reg.filter(r=>!r.withdrawn).map(r=>E(r.name)).join(", ")||"none")+".",steps:["Checked registered modules"]});return true}
  withdraw(rec.id);go("plat_build");say(q,{t:"Withdrew <b>"+E(rec.name)+"</b>. Its entities, process, map node, flows and metrics are rolled back and the blueprint is back in the wizard.",steps:["Rolled back registration","Restored the draft"]});return true}
 if(m=t.match(/^(?:please )?register\s+(?:the\s+)?(?:module|app|application)\s+(.+?)\s*[?.!]*$/)){
  const nm=m[1];const dr=D();
  if(!dr&&/facilit/.test(nm)){B.d=exampleDraft();B.step=7;S.v.bld=1;touch()}
  const d=D();
  if(!d||(d.name.toLowerCase().indexOf(nm)<0&&nm.indexOf(d.name.toLowerCase())<0)){say(q,{t:"There is no blueprint called "+E(nm)+" yet. Start one in Build a module, or load the Facilities requests example.",steps:["Opened Build a module"],act:null});S.v.bld=3;go("plat_build");return true}
  B.step=7;S.v.bld=1;const g=runGate(d);
  if(!g.ok||!d.name||!d.purpose){go("plat_build");say(q,{t:"The gate blocks <b>"+E(d.name)+"</b>: "+E(g.rows.filter(r=>r.r==="fail").map(r=>r.n).join(", ")||"add a name and purpose")+". I opened the review step so you can fix it or raise an exception.",steps:["Ran the conformance checks","Opened the review step"]});return true}
  const rec=register();go("plat_build");say(q,{t:"Registered <b>"+E(d.name)+"</b> as Proposed: "+rec.ents.length+" entities, "+rec.flows+" flows, "+rec.metrics.length+" metrics. Say \"withdraw module "+E(d.name)+"\" to roll it back.",steps:["Passed the gate at "+g.score+"%","Added entities, process, module node and metrics"]});return true}
 if(!/\bcan i (?:build|make|create)\b/.test(t)&&(/(?:build|create|make|add|register)\s+(?:a\s+|an\s+|the\s+)?(?:new\s+)?(?:module|application|app)\b/.test(t)||/how (?:do|can|would) (?:i|we|someone|a team)\s+(?:build|add|create|register|get)\b.*(?:module|application|app)/.test(t)||/(?:new|build a) module/.test(t))&&!/citizen/.test(t)){
  S.v.bld=D()?1:0;go("plat_build");
  say(q,{t:"There is one path for people and AI clients alike. <b>1.</b> Search the registry and reuse or extend entities first. <b>2.</b> Declare the process, the connections to other modules, maturity, metrics, security and AI use. <b>3.</b> The gate runs every conformance check live. <b>4.</b> Register: entities land as Proposed in the data atlas, a dashed node appears on the module map. Try it with the Facilities requests example.",steps:["Opened Build a module"]});return true}
 return false;
});
syncMetrics();
})();
