/* ================= catalog item designer: variables, pricing and approval rules as readable lines with live checks ================= */
const VTY=["text","longtext","select","chips","cards","multi","toggle","date","number","money","range","people","file"];
const CTXK=["item","svc","for","by","worker","region","level","tier","restricted","poolempty","expedite","price"];
const KINDS_AP=["Always","Cost","Software","Region","Role level","Security tier","Budget owner","Worker type","Data","Vendor"];
const optStr=o=>{o=oObj(o);return o.v+(o.sub?"~"+o.sub:"")+(o.pr?":"+o.pr:"")};
function varsToDSL(it){let sec=null;const out=[];it.vars.forEach(v=>{const s=v.sec||"Details";if(s!==sec){out.push("# "+s);sec=s}
 const ch=v.t==="toggle"?(v.pr?String(v.pr):""):v.t==="range"?(v.min||0)+":"+(v.max||100):optsOf(v).map(optStr).join(";");
 out.push([v.l+" ["+v.k+"]",v.t,ch,v.r?"required":"",v.sh||"",v.h||""].join(" | ").replace(/( \| )+$/,""))});return out.join("\n")}
function parseOpt(x){x=x.trim();let pr=0,sub="";const m=/^(.*?):(-?\d+(?:\.\d+)?)$/.exec(x);if(m){x=m[1];pr=+m[2]}const i=x.indexOf("~");if(i>=0){sub=x.slice(i+1);x=x.slice(0,i)}return O(x.trim(),sub.trim(),pr)}
function dslVars(txt,old){const out=[],issues=[],keys=new Set();let sec="Details";
 String(txt||"").split("\n").forEach((ln,i)=>{ln=ln.trim();if(!ln)return;if(ln[0]==="#"){sec=ln.replace(/^#+/,"").trim()||"Details";return}
  const p=ln.split("|").map(x=>x.trim()),n="Line "+(i+1)+": ";let l=p[0]||"",k="";const bm=/^(.*?)\s*\[([a-z_]\w*)\]\s*$/i.exec(l);if(bm){l=bm[1];k=bm[2]}if(!l){issues.push(["bad",n+"a field needs a label"]);return}
  const prev=old&&(old.find(v=>k&&v.k===k)||old.find(v=>v.l===l));if(!k)k=prev?prev.k:slug(l);
  if(keys.has(k)){issues.push(["bad",n+"the name ["+k+"] is used twice"]);k=k+"_"+i}keys.add(k);
  const t=(p[1]||"text").toLowerCase();if(!VTY.includes(t)){issues.push(["bad",n+"type '"+p[1]+"' is not one of: "+VTY.join(", ")]);}
  const v={k,l,t:VTY.includes(t)?t:"text",sec};if(p[3]&&/^(r|req|required|yes|true|\*)$/i.test(p[3]))v.r=1;if(p[4])v.sh=p[4];if(p[5])v.h=p[5];
  const ch=p[2]||"";
  if(["select","chips","cards","multi"].includes(v.t)){v.o=ch.split(";").map(x=>x.trim()).filter(Boolean).map(parseOpt);if(!v.o.length)issues.push(["bad",n+l+" needs choices separated by semicolons, like Small~14 inch:1840;Large:2650"]);else if(v.o.length<2&&v.t!=="multi")issues.push(["warn",n+l+" has only one choice"])}
  else if(v.t==="toggle"&&ch&&!isNaN(+ch))v.pr=+ch;else if(v.t==="range"){const m=/^(\d+):(\d+)$/.exec(ch);if(m){v.min=+m[1];v.max=+m[2]}else{v.min=0;v.max=100}}
  if(prev){if(prev.d!==undefined&&(!v.o||v.o.some(o=>o.v===(Array.isArray(prev.d)?prev.d[0]:prev.d))||v.t==="multi"))v.d=prev.d;if(prev.min!==undefined&&v.t==="range"&&!/\d/.test(ch)){v.min=prev.min;v.max=prev.max}}
  out.push(v)});
 const kn=new Set(out.map(v=>v.k).concat(CTXK));
 out.forEach(v=>{if(v.sh)condKeys(v.sh).forEach(k=>{if(!kn.has(k))issues.push(["bad","Show-if on "+v.l+" uses '"+k+"', which is not a field or a known value"])})});
 return {vars:out,issues}}
function condKeys(s){const ks=[];String(s||"").split(/\s+(?:and|or)\s+/i).forEach(c=>{const m=/^\s*(?:not\s+)?([a-z_]\w*)/i.exec(c);if(m)ks.push(m[1])});return ks}
function priceToDSL(it){return (it.pr||[]).map(p=>p[0]+" | "+p[1]+" | "+p[2]).join("\n")}
function dslPrice(txt,vars,issues){const out=[];String(txt||"").split("\n").forEach((ln,i)=>{ln=ln.trim();if(!ln)return;const p=ln.split("|").map(x=>x.trim());if(p.length<3||isNaN(+p[2])){issues.push(["bad","Pricing line "+(i+1)+": use  Label | condition | amount"]);return}
  condKeys(p[1]).forEach(k=>{if(!vars.some(v=>v.k===k)&&!CTXK.includes(k))issues.push(["bad","Pricing line "+(i+1)+" uses '"+k+"', which is not a field"])});out.push([p[0],p[1],+p[2]])});return out}
function apprToDSL(it){return it.appr.map(a=>[a.n,a.when||"",a.who,a.kind,a.why||""].join(" | ")).join("\n")}
function dslAppr(txt,vars,old,issues){const out=[],seen=new Set();String(txt||"").split("\n").forEach((ln,i)=>{ln=ln.trim();if(!ln)return;const p=ln.split("|").map(x=>x.trim());const n="Approval line "+(i+1)+": ";
  if(p.length<3){issues.push(["bad",n+"use  Name | condition | approver | kind"]);return}
  const who=p[2];if(!RESOLVE[who]&&!who.startsWith("person:")){issues.push(["bad",n+"approver '"+who+"' is not known. Use one of: "+Object.keys(RESOLVE).join(", ")+", or person:Name"]);return}
  if(who.startsWith("person:")&&!DIR.some(d=>d.name===who.slice(7)))issues.push(["warn",n+who.slice(7)+" is not in the directory"]);
  const kind=KINDS_AP.includes(p[3])?p[3]:(p[1]?"Cost":"Always");if(p[3]&&!KINDS_AP.includes(p[3]))issues.push(["warn",n+"kind '"+p[3]+"' is not standard. Using "+kind]);
  condKeys(p[1]).forEach(k=>{if(!vars.some(v=>v.k===k)&&!CTXK.includes(k))issues.push(["bad",n+"'"+k+"' is not a field or known value"])});
  const prev=old.find(a=>a.n===p[0]);let id=prev?prev.id:null;if(!id){let x=old.length+out.length+1;while(old.some(a=>a.id==="A"+x)||out.some(a=>a.id==="A"+x))x++;id="A"+x}
  if(seen.has(p[0]))issues.push(["warn",n+"rule name repeats"]);seen.add(p[0]);out.push({id,n:p[0],when:p[1],who,kind,why:p[4]||prev&&prev.why||"Added by the item designer."})});return out}
/* make sure every approval rule has a gate in the workflow, and gates without rules are removed */
function syncGates(it){const f=FLOW(it.flow);if(!f)return;const ids=new Set(it.appr.map(a=>a.id));f.steps=f.steps.filter(s=>s.type!=="gate"||ids.has(s.ap));
 const have=new Set(f.steps.filter(s=>s.type==="gate").map(s=>s.ap));let last=f.steps.map((s,i)=>s.type==="gate"?i:-1).reduce((a,b)=>Math.max(a,b),0);
 it.appr.forEach(a=>{if(have.has(a.id))return;let n=1;while(f.steps.some(s=>s.id==="g"+n))n++;f.steps.splice(last+1,0,G("g"+n,a.id));last++});
 /* steps that were waiting on all gates keep working, because GATES is expanded at read time */
 clearTpl()}
const clearTpl=()=>{Object.keys(TPLC).forEach(k=>delete TPLC[k]);STATC={v:-1,m:{}}};
function newFlow(it,team,sys){const id="wf_"+it.id;const f={id,n:it.n,item:it.id,kind:"request",steps:[T("s1","Request submitted","auto","Service desk",null,"Oukala portal",.1,.4,{p:[],rv:"Request received"})].concat(it.appr.map((a,i)=>G("g"+(i+1),a.id)),[T("s2","Fulfill the request","human",team||"Service desk",null,sys||"Service desk tools",8,24,{p:GATES,rv:"Being worked on",rw:6}),T("s3","Confirm with the requester","human","Requester",null,"Oukala portal",24,.8,{tk:"XLA",pause:true,xla:1,rv:"Confirm it works"}),T("s4","Close and rate","auto",team||"Service desk",null,"Oukala portal",.1,.3,{rv:"Done",xla:1})])};FLOWS.push(f);return f}
function aiDraft(name,svc){const n=String(name||"").toLowerCase();const base=["# Request","Why do you need it? [why] | longtext | | required | Say what problem this solves.","Needed by [needby] | date","Cost center [cc] | text | | | | Where the cost is charged"];
 if(/monitor|keyboard|headset|dock|peripheral/.test(n))return base.concat(["Quantity [qty] | number","Model [model] | cards | Standard:120~Good for most desks;Premium:260~Ergonomic and adjustable | required"]).join("\n");
 if(/access|permission|role/.test(n))return base.concat(["# Access","System [system] | select | Contract Repository;Codification Platform;Lease subledger | required","Role [role] | chips | Reader;Contributor;Admin | required","Duration [dur] | chips | Permanent;90 days;30 days"]).join("\n");
 return base.concat(["Business justification [just] | longtext | | required | cost > 1000 | Approvers see this first","Estimated cost [cost] | money"]).join("\n")}
function designForm(id,svc,off,nm){const it=id?ITEM(id):null,isNew=!it;
 const defV=it?varsToDSL(it):aiDraft("",svc),defP=it?priceToDSL(it):"Rush handling | expedite | 95",defA=it?apprToDSL(it):"Manager approval |  | manager | Always | Every purchase has a named accountable manager.\nBudget owner | price > 2000 | budgetOwner | Cost | Spend above $2,000 needs the budget owner.";
 openForm({id:"svc_design",title:isNew?"Design a catalog item":"Edit "+it.n,story:"An item is a form, a price, approval rules and a fulfillment workflow. Write the rules as plain lines; the checks below tell you what is wrong before you save. Requesters see the item in the portal as soon as it is published.",submit:isNew?"Create item":"Save changes",
  fields:[{section:"Identity"},{k:"name",label:"Name",type:"text",req:true,ph:"Monitor or peripheral",help:"What people will search for."},{k:"cat",label:"Category",type:"select",opts:CATS,req:true},{k:"svc",label:"Service",type:"select",opts:SVCREG.map(s=>s.n),req:true,help:"The service in the CMDB this offering belongs to."},{k:"off",label:"Service offering or sub-offering",type:"text",req:true,help:"Existing: "+SVCREG.slice(0,6).map(s=>(s.offerings||[]).slice(0,1).join("")).filter(Boolean).join(", ")+" and more. A new name creates a new offering."},
   {k:"short",label:"One-line description",type:"longtext",wide:true,req:true},{k:"est",label:"Typical delivery",type:"text",ph:"3 business days"},{k:"slaH",label:"Service level target (working hours)",type:"number",req:true,help:"The promise to the requester. Per step targets are set on the workflow."},
   {k:"layout",label:"Form layout",type:"chips",opts:[["tabs","Tabs"],["accordion","Accordions"],["single","One page"]]},{k:"state",label:"Status",type:"chips",opts:["Draft","Published"]},
   {k:"team",label:isNew?"Team that fulfills it":"Team (new items only)",type:"select",opts:GN,show:v=>isNew},
   {section:"The form"},{k:"vars",label:"Questions",type:"longtext",wide:true,help:"Lines start with # for a section. Each question: Label [name] | type | choices | required | show-if | help. Choices: Name~detail:price separated by semicolons.",ai:{label:"Draft questions with Claude",fn:v=>aiDraft(v.name,v.svc)}},
   {section:"Price"},{k:"price",label:"Pricing rules",type:"longtext",wide:true,help:"Label | condition | amount. Choices on questions add their own price."},
   {section:"Approvals"},{k:"appr",label:"Approval rules",type:"longtext",wide:true,help:"Name | condition | approver | kind | why. Approvers: "+Object.keys(RESOLVE).join(", ")+", or person:Name. A rule with no condition always applies."},
   {section:"Checks"},{k:"ai",label:"AI-assisted form fill",type:"toggle"}],
  defaults:it?{name:it.n,cat:it.cat,svc:it.svc,off:it.off,short:it.short,est:it.est,slaH:it.slaH,layout:it.layout,state:it.state,vars:defV,price:defP,appr:defA,ai:it.aiFill!==false}:{name:nm||"",cat:"Hardware",svc:svc||"Endpoint management (Intune)",off:off||"Peripherals",short:"",est:"3 business days",slaH:24,layout:"accordion",state:"Draft",team:"Service desk",vars:defV,price:defP,appr:defA,ai:true},
  live:(v)=>{const iss=[];const pv=dslVars(v.vars,it&&it.vars);iss.push(...pv.issues);const pr=dslPrice(v.price,pv.vars,iss);const ap=dslAppr(v.appr,pv.vars,it?it.appr:[],iss);
   const sec=uniq(pv.vars.map(x=>x.sec)),fake={id:"x",vars:pv.vars,pr,appr:ap,svc:v.svc},def=defVals(fake);let price=0,fires=[];try{const cx=ctxOf(fake,def,ME,ME);price=priceOf(fake,def,cx);fires=ap.filter(a=>evalCond(a.when,cx))}catch(e){}
   const newOff=v.svc&&v.off&&!(svcOf(v.svc)||{offerings:[]}).offerings.includes(v.off);
   return `<div class="svc-lint"><div class="eyebrow">Checks as you type</div><div class="row"><span class="pill info">${pv.vars.length} questions in ${sec.length} sections</span><span class="pill metric">Default price ${money(price)}</span><span class="pill ${ap.length?"info":"mute"}">${ap.length} approval rules, ${fires.length} fire on the default answers</span>${newOff?'<span class="pill warn">New offering will be created</span>':""}${isNew?'<span class="pill info">A starter workflow will be created</span>':""}</div>${iss.length?`<ul class="svc-issues">${iss.map(i=>`<li class="${i[0]}">${E(i[1])}</li>`).join("")}</ul>`:`<p class="muted small">No problems found.</p>`}</div>`},
  onSubmit:v=>{const iss=[];const pv=dslVars(v.vars,it&&it.vars);iss.push(...pv.issues);const pr=dslPrice(v.price,pv.vars,iss),ap=dslAppr(v.appr,pv.vars,it?it.appr:[],iss);
   if(iss.some(i=>i[0]==="bad"))return {toast:"Fix "+iss.filter(i=>i[0]==="bad").length+" problem"+(iss.filter(i=>i[0]==="bad").length>1?"s":"")+" in the checks first",close:false};
   let x=it;if(!x){let nid=slug(v.name).slice(0,18)||"item",n=1;while(ITEM(nid)){nid=nid.slice(0,16)+(++n)}x={id:nid,pop:20,vis:{steps:"labels",approvers:"names",cost:"price",sla:"date",assignee:"team",comments:true,tasks:false},guide:{why:v.short,faq:[],policy:""},ill:CATI[v.cat]||"service",xla:{q:"How easy was it to get what you needed?",tgt:4.3},kw:[],flow:""};CAT.push(x)}
   Object.assign(x,{n:v.name,cat:v.cat,svc:v.svc,off:v.off,short:v.short,est:v.est||"3 business days",slaH:+v.slaH||24,layout:v.layout||"accordion",state:v.state||"Draft",vars:pv.vars,pr,appr:ap,aiFill:!!v.ai});
   if(!x.kw||!x.kw.length||it)x.kw=genKw(x);
   if(!it){const f=newFlow(x,v.team,"Service desk tools");x.flow=f.id}else syncGates(x);
   const s=svcOf(v.svc);if(s&&!(s.offerings||[]).includes(v.off)){(s.offerings=s.offerings||[]).push(v.off)}
   delete FV["c:"+x.id];delete FV["p:"+x.id];clearTpl();REQV++;regWFX();audit(it?"edited catalog item":"created catalog item",x.n);V.cat=x.id;go("svc_cat");render();
   return {toast:(it?"Saved ":"Created ")+x.n+(x.state==="Published"?". It is live in the portal.":". It is a draft, publish it when ready."),audit:x.id}}})}
function genKw(it){const kw=[];it.vars.forEach(v=>{if(["select","chips","cards"].includes(v.t))optsOf(v).forEach(o=>{const t=oObj(o).v;if(t.length>=5&&!/^(none|other|as shipped)$/i.test(t))kw.push([new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/\s+/g,"\\s+"),"i"),{[v.k]:t}])});if(v.t==="toggle"&&v.l.length>4){const w=v.l.toLowerCase().replace(/^(add|need|include)\s+(an?\s+)?/,"").split(/\s+/)[0];if(w&&w.length>3)kw.push([new RegExp("\\b"+w,"i"),{[v.k]:true}])}});return kw}
/* step editing */
function stepForm(fid,sid){const f=FLOW(fid),it=ITEM(f.item),s=sid?f.steps.find(x=>x.id===sid):null;
 openForm({id:"svc_step",title:s?"Edit step: "+s.n:"Add a step",story:s?"Changes apply to new requests. In-flight requests keep their step history.":"The step is added to this workflow and shown on its timeline. Requests already delivered are not affected.",submit:s?"Save step":"Add step",secondary:s&&s.id!=="s1"?{label:"Remove this step",fn:()=>{closeDrawer();delStep(fid,sid)}}:undefined,
  fields:[{k:"n",label:"Step name",type:"text",req:true},{k:"type",label:"Who does it",type:"chips",opts:[["human","Person"],["agent","AI agent"],["auto","Automatic"],["wait","Wait (supplier or time)"]]},{k:"team",label:"Assignment team",type:"select",opts:GN.concat(["Requester"]),req:true,help:"Work lands in this team's queue first. A person claims it or is assigned with a reason."},{k:"owner",label:"Default person or agent",type:"people"},{k:"sys",label:"System",type:"text",ph:"Intune, Entra ID, ServiceNow bridge"},
   {k:"t",label:"Target (hours)",type:"number",req:true},{k:"tk",label:"Target kind",type:"chips",opts:[["OLA","OLA (between teams)"],["SLA","SLA (to the requester)"],["UC","UC (supplier)"],["XLA","XLA (experience)"]]},{k:"cost",label:"Cost per run (dollars)",type:"number"},{k:"rw",label:"Expected rework (percent)",type:"number"},{k:"cond",label:"Run only when",type:"text",ph:"leave empty to always run",help:"Same condition language as approvals."},{k:"rv",label:"Name shown to the requester",type:"text",help:"Leave empty to keep this step internal."},
   {k:"after",label:"Place after",type:"select",opts:f.steps.filter(x=>x.id!==sid).map(x=>[x.id,(x.type==="gate"?"Approval: "+((ruleOf(it,x.ap)||{}).n||x.ap):x.n)]),show:v=>!s}],
  defaults:s?{n:s.n,type:s.type==="sub"||s.type==="gate"?"human":s.type,team:s.team,owner:s.owner||"",sys:s.sys||"",t:s.t,tk:s.tk||"OLA",cost:s.cost,rw:s.rw,cond:s.cond||"",rv:s.rv||""}:{type:"human",team:"Service desk",t:8,tk:"OLA",cost:20,rw:5,after:f.steps.filter(x=>x.type!=="gate").slice(-2,-1)[0]?f.steps.filter(x=>x.type!=="gate").slice(-2,-1)[0].id:"s1"},
  live:v=>{const iss=[];if(v.cond)condKeys(v.cond).forEach(k=>{if(!it.vars.some(x=>x.k===k)&&!CTXK.includes(k))iss.push("'"+k+"' is not a field on this item")});return `<div class="svc-lint"><div class="row"><span class="pill metric">${money(+v.cost||0)} per run</span><span class="pill info">${hh(+v.t||0)} target</span><span class="pill ${v.rv?"good":"mute"}">${v.rv?"Requester sees: "+E(v.rv):"Internal"}</span></div>${iss.length?`<ul class="svc-issues">${iss.map(i=>`<li class="bad">${E(i)}</li>`).join("")}</ul>`:""}</div>`},
  onSubmit:v=>{if(v.cond&&condKeys(v.cond).some(k=>!it.vars.some(x=>x.k===k)&&!CTXK.includes(k)))return{toast:"The condition uses an unknown field",close:false};
   if(s){Object.assign(s,{n:v.n,type:s.type==="sub"?"sub":v.type,team:v.team,owner:v.owner||null,sys:v.sys,t:+v.t,tk:v.tk,cost:+v.cost||0,rw:+v.rw||0,cond:v.cond||undefined,rv:v.rv||undefined})}
   else{let n=1;while(f.steps.some(x=>x.id==="x"+n))n++;const ns=T("x"+n,v.n,v.type,v.team,v.owner||null,v.sys||"",+v.t,+v.cost||0,{tk:v.tk,rw:+v.rw||0,cond:v.cond||undefined,rv:v.rv||undefined});const ix=f.steps.findIndex(x=>x.id===v.after);f.steps.splice(ix+1,0,ns);
    REQS.forEach(r=>{if(r.flow===fid&&(r.state==="deployed"||r.state==="decommissioned"||r.state==="rejected")&&!r.sk.includes(ns.id))r.sk.push(ns.id)})}
   afterFlowEdit(fid);audit(s?"edited step":"added step",f.n+" "+v.n);return {toast:(s?"Saved ":"Added ")+v.n,audit:f.id}}})}
function afterFlowEdit(fid){clearTpl();REQS.forEach(r=>{if(r.flow===fid){try{if(r.state==="approved"||r.state==="fulfilling")advance(r);else touch(r)}catch(e){}}});REQV++;regWFX();render()}
function delStep(fid,sid){const f=FLOW(fid),i=f.steps.findIndex(s=>s.id===sid),s=f.steps[i];if(!s||s.id==="s1"||s.type==="gate")return;
 const prev=f.steps[i-1];f.steps.splice(i,1);f.steps.forEach(x=>{if(Array.isArray(x.p)&&x.p.includes(sid))x.p=uniq(x.p.flatMap(p=>p===sid?(Array.isArray(s.p)?s.p:prev?[prev.id]:[]):[p]))});
 REQS.forEach(r=>{if(r.flow===fid){delete r.ts[sid];delete r.as[sid];r.sk=r.sk.filter(x=>x!==sid)}});afterFlowEdit(fid);audit("removed step",f.n+" "+s.n);toast("Removed "+s.n,"good")}
function dagOK(fid){clearTpl();const tpl=tplOf(fid),ids=new Set(tpl.map(s=>s.id)),done=new Set();let ch=true,g=0;while(ch&&g++<100){ch=false;tpl.forEach(s=>{if(done.has(s.id))return;const deps=s.type==="sub"?allKids(tpl,s.id).map(k=>k.id):s.p;if(deps.every(p=>done.has(p)||!ids.has(p))){done.add(s.id);ch=true}})}return done.size===tpl.length}
function moveStep(fid,id,idx){const f=FLOW(fid),old=f.steps.slice();const mv=f.steps.filter(s=>s.type!=="gate"&&s.id!=="s1"),st=mv.find(s=>s.id===id);if(!st)return;const rest=mv.filter(s=>s!==st);rest.splice(clamp(idx,0,rest.length),0,st);
 const head=f.steps.filter(s=>s.id==="s1"||s.type==="gate");f.steps=head.concat(rest);
 if(!dagOK(fid)){f.steps=old;clearTpl();toast("That order puts "+st.n+" before a step it depends on","warn");render();return}
 afterFlowEdit(fid);audit("reordered steps",f.n+": "+st.n);toast("Moved "+st.n,"good")}
DND.on("svc_steps",(id,from,to,idx)=>{const it=V.cat&&ITEM(V.cat);if(it)moveStep(it.flow,id,idx)});
