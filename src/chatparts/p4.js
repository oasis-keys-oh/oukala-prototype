
/* ================= planner: entities, scoring, slot filling ================= */
const WD=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"],MN=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
function parseDates(l){const out=[];const add=(i,d)=>out.push([i,d]);let m;
 const re1=/\b(20\d\d-\d\d-\d\d)\b/g;while((m=re1.exec(l)))add(m.index,m[1]);
 const re2=/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/g;while((m=re2.exec(l))){const mi=MN.indexOf(m[1].slice(0,3));const y=mi<9&&mi<9?2027:2026;add(m.index,(mi<9?"2027":"2026")+"-"+String(mi+1).padStart(2,"0")+"-"+String(+m[2]).padStart(2,"0"))}
 const re3=/\b(\d{1,2})\/(\d{1,2})\b/g;while((m=re3.exec(l))){const mo=+m[1],dd=+m[2];if(mo>=1&&mo<=12&&dd>=1&&dd<=31)add(m.index,(mo<9?"2027":"2026")+"-"+String(mo).padStart(2,"0")+"-"+String(dd).padStart(2,"0"))}
 const re4=/\b(today|tomorrow|tonight)\b/g;while((m=re4.exec(l)))add(m.index,m[1]==="tomorrow"?addD(TODAY,1):TODAY);
 const re5=/\bin (\d{1,3}) (day|days|week|weeks)\b/g;while((m=re5.exec(l)))add(m.index,addD(TODAY,+m[1]*(/week/.test(m[2])?7:1)));
 const re6=/\b(next |this |on )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/g;while((m=re6.exec(l))){const di=WD.indexOf(m[2]);const cur=pd(TODAY).getUTCDay();let diff=(di-cur+7)%7;if(diff===0)diff=7;if(m[1]==="next ")diff+=diff<7&&di>cur?7:0;add(m.index,addD(TODAY,diff))}
 out.sort((a,b)=>a[0]-b[0]);return out.map(x=>x[1]).filter((d,i,a)=>a.indexOf(d)===i)}
CX.parseDates=parseDates;
const NAME_STOP=["dev","chief","first","test","triage","change","contract","knowledge","invoice","pmo","lumen","northwind","contoso"];
function findPersons(q){const l=q.toLowerCase();const hits=[];const seen={};
 DIR.forEach(d=>{const n=d.name.toLowerCase();let i=l.indexOf(n);if(i>=0&&!seen[d.name]){seen[d.name]=1;hits.push([i,d.name])}});
 const firsts={};PS().forEach(d=>{const f=firstOf(d.name).toLowerCase();firsts[f]=(firsts[f]||0)+1});
 PS().forEach(d=>{if(seen[d.name]||d.kind==="ai"||d.kind==="msp")return;const f=firstOf(d.name).toLowerCase();if(f.length<3||firsts[f]>1||NAME_STOP.indexOf(f)>=0)return;const m=new RegExp("\\b"+f+"(?:'s)?\\b").exec(l);if(m){seen[d.name]=1;hits.push([m.index,d.name])}});
 hits.sort((a,b)=>a[0]-b[0]);return hits.map(h=>h[1])}
function ents(q){const l=q.toLowerCase();const E={persons:findPersons(q),ids:{},svc:svcByText(q),team:null,amount:null,num:null,date:null,date2:null,pri:null};
 [["INC",/\bINC\d{4,6}\b/i],["CHG",/\bCHG\d{4,6}\b/i],["PRB",/\bPRB\d{4,6}\b/i],["RITM",/\bRITM\d{5,8}\b/i],["PR",/\bPR\d{1,2}\b/],["KB",/\bKB\d{4}\b/i]].forEach(([k,re])=>{const m=re.exec(q);if(m)E.ids[k]=m[0].toUpperCase()});
 const am=/\$\s?([\d,]+(?:\.\d+)?)\s?(k|m)?\b/i.exec(q);if(am)E.amount=+am[1].replace(/,/g,"")*(/k/i.test(am[2]||"")?1e3:/m/i.test(am[2]||"")?1e6:1);
 const nm=/\b(\d{1,5})\s+(users?|people|editors?|staff|seats?|directors?|employees)\b/i.exec(q);if(nm)E.num=+nm[1];
 const pm=/\bP([1-4])\b/i.exec(q)||/\bsev(?:erity)?\s?([1-4])\b/i.exec(q);if(pm)E.pri=+pm[1];else if(/\bcritical\b/.test(l))E.pri=1;
 const tm=teamOpts().find(t=>l.indexOf(t[0].toLowerCase())>=0);if(tm)E.team=tm[0];
 const D=parseDates(l);E.date=D[0]||null;E.date2=D[1]||null;return E}
CX.ents=ents;

function scoreTools(q,c){const l=q.toLowerCase();const out=[];LIVE();
 TOOLS.forEach(t=>{if(t.int||!t.kw.length)return;let s=0,hit=[];t.kw.forEach(([re,w])=>{if(re.test(l)||re.test(q)){s+=w;hit.push(String(re).slice(1,24))}});if(!s)return;(t.neg||[]).forEach(re=>{if(re.test(l))s-=8});
  if(c.rec){const r=c.rec.id;if(/^INC/.test(r)&&/^incident\./.test(t.id))s+=1.5;if(/^CHG/.test(r)&&/^change\./.test(t.id))s+=1.5;if(/^RITM/.test(r)&&/^request\./.test(t.id))s+=1.5}
  if(S.screen==="svc_portal"&&t.id==="request.order")s+=1;if(S.screen==="itsm_inc"&&/^incident/.test(t.id))s+=.8;if(S.screen==="svc_oncall"&&/^oncall/.test(t.id))s+=1;if(S.screen==="ppm_wbs"&&t.id==="wbs.addtasks")s+=1;
  if(s>0)out.push({t,s,hit})});
 out.sort((a,b)=>b.s-a.s);return out}
CX.scoreTools=scoreTools;
const riskOf=(t,p)=>t.riskFn?G(()=>t.riskFn(p||{}),t.risk):t.risk;
const RANK={low:1,medium:2,high:3};
const inputsOf=(t,v)=>typeof t.inputs==="function"?t.inputs(v||{}):t.inputs;
CX.inputsOf=inputsOf;
function missingOf(t,p){const miss=[];inputsOf(t,p).forEach(f=>{if(f.show&&!f.show(p))return;if(f.req&&(p[f.k]==null||p[f.k]===""||(Array.isArray(p[f.k])&&!p[f.k].length)))miss.push(f)});return miss}
function withDefaults(t,p){const o=Object.assign({},p);inputsOf(t,o).forEach(f=>{if((o[f.k]==null||o[f.k]==="")&&f.def!=null)o[f.k]=f.def});return o}
function personValid(t,p){const e={};inputsOf(t,p).forEach(f=>{if(f.type==="person"&&p[f.k]&&!who(p[f.k]))e[f.k]="Pick a person from the list"});return e}

/* ================= messages ================= */
const DEMO_FAST=()=>!!(CX.fast);
function lineage(o){o=o||{};return Object.assign({model:"Claude Sonnet",conf:.88,src:["Page and record context","Tool registry","Guardrail policies"],guards:["Reads only what your role can read","Writes follow the autonomy mode of this thread","Every action is audited"],pol:[]},o)}
function pushMsg(m,t){t=t||cur();m.id=m.id||uid("M");m.at=Date.now();t.msgs.push(m);t.upd=Date.now();if(!(CX.isOpen&&CX.isOpen()))t.unread=(t.unread||0)+(m.ai?1:0);saveSoon();return m}
CX.pushMsg=pushMsg;
function sayAI(t,html,o){o=o||{};const m=pushMsg(Object.assign({ai:1,t:html,steps:o.steps||[],cards:o.cards||[],lin:o.lin||lineage(),sugg:o.sugg||null,stream:o.stream!==false},o.extra||{}),t);if(o.act)m.act=o.act;CX.drawMsgs&&CX.drawMsgs();return m}
CX.sayAI=sayAI;
/* legacy contract used by every module: say(q,{t,steps,act}) */
say=function(q,r){const t=cur();const last=t.msgs[t.msgs.length-1];if(!(last&&last.me&&last.t===q))pushMsg({me:1,t:q},t);audit("asked Oukala",q);ST.use.answered++;const m=pushMsg({ai:1,t:r.t||"",steps:r.steps||[],cards:r.cards||[],lin:lineage({src:r.steps&&r.steps.length?r.steps:undefined,conf:.9}),stream:true,sugg:r.sugg||null},t);if(r.act)m.act=r.act;if(CX.open)CX.open("chat");CX.drawMsgs&&CX.drawMsgs();CX.drawThreads&&CX.drawThreads();return m};
const SUGG_BY_TOOL={"incident.create":["Show who is on call","Run impact analysis on this service"],"request.order":["Check the status of that request","Show Hana Koval's assets"],"aiaccess.raise":["Which approvals are waiting on me?","How is the token limit policy set?"],"sla.explain":["How is the P2 incident SLA measured?","Which SLAs are at risk?"],"onboard.user":["Show the activity","Who approves a laptop for a contractor?"],"person.plate":["Can they take more work?","Find someone with the same skills"]};

/* ================= the handler: one entry for chat, palette, slash commands ================= */
const SLASH={"/onboard":q=>"onboard "+q,"/order":q=>"order "+q,"/status":q=>"what is the status of "+(q||"my requests"),"/approve":q=>"approve "+q,"/reject":q=>"reject "+q,"/explain":q=>"explain "+q,"/impact":q=>"run impact analysis on "+q,"/incident":q=>"log an incident: "+q,"/pto":q=>"request time off "+q,"/oncall":q=>"who is on call "+q,"/who":q=>"who can "+q,"/as":q=>"act on behalf of "+q,"/mode":q=>"set autonomy to "+q,"/attach":q=>"attach "+q+" to the context","/offboard":q=>"offboard "+q,"/chart":q=>"chart "+q,"/show":q=>"show me "+q,"/token":q=>"raise my token limit "+q};
CX.SLASH=SLASH;
const SLASH_HELP=[["/onboard Name as role starting date","Plan a full onboarding"],["/order laptop for Name","Inline catalog form"],["/status RITM… or me","Where it is and who has it"],["/approve RITM…","Approve for you or for who you act for"],["/explain how the P1 SLA is measured","Grounded answer with sources"],["/impact Standards Portal","Impact analysis"],["/incident text","Log an incident"],["/pto Oct 20 to Oct 24","Request time off"],["/oncall","Who is on call"],["/as Hana Koval","Act on behalf of someone"],["/mode act","Autonomy mode"],["/attach INC0412","Add to the context pack"],["/token to 60M","Raise a token limit"]];
CX.SLASH_HELP=SLASH_HELP;
function handle(q0,o){o=o||{};let q=String(q0||"").trim();if(!q)return;const t=cur();CX.open&&CX.open("chat");
 if(/^\/(new|clear)$/.test(q)){newThread();CX.drawAll();return}
 if(q==="/help"){pushMsg({me:1,t:q},t);sayAI(t,"Slash commands, and everything also works in plain words.",{cards:[{t:"table",title:"Slash commands",h:["Type","Does"],r:SLASH_HELP.map(x=>[x[0],x[1]])}],stream:false});return}
 if(q==="/context"){pushMsg({me:1,t:q},t);CX.open("ctx");return}
 const sm=/^(\/[a-z]+)\s*(.*)$/i.exec(q);if(sm&&SLASH[sm[1].toLowerCase()]){const rewritten=SLASH[sm[1].toLowerCase()](sm[2]);pushMsg({me:1,t:q},t);return plan(rewritten,t,Object.assign({},o,{shown:true}))}
 pushMsg({me:1,t:q},t);if(t.title==="New chat"||!t.title){t.title=q.replace(/[?.!]+$/,"").split(/\s+/).slice(0,7).join(" ");if(t.title.length>46)t.title=t.title.slice(0,46).replace(/\s+\S*$/,"")+"…";t.autoT=true}
 return plan(q,t,Object.assign({},o,{shown:true}))}
CX.handle=handle;
function thinking(t,steps,fn){if(DEMO_FAST()||(document.documentElement.dataset.motion==="reduced")){fn();return}const m=pushMsg({ai:1,think:1,t:"",steps:steps,cards:[]},t);CX.drawMsgs&&CX.drawMsgs();setTimeout(()=>{const i=t.msgs.indexOf(m);if(i>=0)t.msgs.splice(i,1);fn()},420)}
function plan(q,t,o){const c=ctxNow(t);ST.use.asks++;
 /* multi-turn slot filling: a pending form takes the next answer */
 if(t.pend&&t.pend.form&&!o.noPend){const f=ST.forms[t.pend.form];if(f&&f.status==="open"){if(/^(cancel|never ?mind|stop|forget it|no)\b/i.test(q)){f.status="cancelled";t.pend=null;sayAI(t,"Cancelled. Nothing was changed.",{stream:false});CX.drawMsgs();return}
   const nt=scoreTools(q,c)[0];if((nt&&nt.s>=7&&nt.t.id!==f.tool)||/^(show|open|go to|take me|what|who|how|why|where|which|list|explain|\/)/i.test(q)){f.status="cancelled";t.pend=null;CX.redrawForm(f.id);return plan(q,t,Object.assign({},o,{noPend:true}))}
   const ok=fillFromText(f,q);if(ok){CX.redrawForm(f.id);const tool=TBY(f.tool);const miss=missingOf(tool,withDefaults(tool,f.vals));if(!miss.length){sayAI(t,"Got it. That was the last detail, so I am using the form as it stands.",{stream:false});setTimeout(()=>CX.submitForm(f.id),DEMO_FAST()?0:250)}else sayAI(t,"Thanks, I added that. Still needed: "+miss.map(x=>"<b>"+H(x.label)+"</b>").join(", ")+".",{stream:false});return}}
  t.pend=null}
 const E=ents(q);const sc=scoreTools(q,c);let top=sc[0];
 /* "and then" chains of two tools */
 const parts=q.split(/\b(?:and then|then|and also|;)\b/i).map(s=>s.trim()).filter(s=>s.length>6);
 if(parts.length===2){const a=scoreTools(parts[0],c)[0],b=scoreTools(parts[1],c)[0];if(a&&b&&a.s>=6&&b.s>=6&&a.t.id!==b.t.id&&!a.t.plan&&!b.t.plan&&!/form/.test(a.t.confirm+b.t.confirm)){return thinking(t,["Reading context","Found two tools: "+a.t.name+", "+b.t.name],()=>chain([[a.t,parts[0]],[b.t,parts[1]]],q,t,c))}}
 if(top&&top.s>=5){const second=sc[1];if(second&&second.s>=top.s-0.5&&second.t.id!==top.t.id&&top.s<9&&second.s>=6){const names=[top.t,second.t];sayAI(t,"That could mean two things. Which do you want?",{cards:[{t:"btnrow",btns:names.map(n=>({l:n.name,d:"tool:"+n.id+":"+encodeURIComponent(q)}))}],stream:false,lin:lineage({conf:.55})});return}
  return thinking(t,["Reading context: "+(c.page?c.page.name:"no page")+(c.subj?" · on behalf of "+c.subj:""),"Scored "+TOOLS.filter(x=>!x.int).length+" tools","Best match: "+top.t.name],()=>toolFlow(top.t,q,E,t,c,top.s))}
 return thinking(t,["Reading context","No tool matched strongly","Looking for a grounded answer"],()=>answer(q,E,t,c))}
CX.plan=plan;
CX.retitle=function(t,tool){if(!t||t.manual||!tool||tool.hidden||tool.int)return;t.tools=t.tools||[];if(t.tools.indexOf(tool.name)<0)t.tools.push(tool.name);const n=t.tools.length;const short=nm=>nm.replace(/^(Create|Show|Look up|Check|Run|Open) (an? |the )?/i,"").replace(/^./,c=>c.toUpperCase());let ti=n===1?tool.name:short(t.tools[0])+" and "+(n-1)+" more";if(ti.length>46)ti=ti.slice(0,46).replace(/\s+\S*$/,"")+"…";if(t.title!==ti){t.title=ti;t.autoT=true;try{CX.drawThreads();CX.drawHead()}catch(e){}}};
function runTool(id,q,t){const tool=TBY(id);t=t||cur();const c=ctxNow(t);toolFlow(tool,q||tool.name,ents(q||""),t,c,10)}
CX.runTool=runTool;

/* ================= from a matched tool to a form or a plan ================= */
function toolFlow(tool,q,E,t,c,score){try{CX.retitle(t,tool)}catch(e){}let pre={};try{pre=tool.prefill?tool.prefill(E,q,c)||{}:{}}catch(e){}const vals=withDefaults(tool,Object.assign({},pre));const preKeys=Object.keys(pre).filter(k=>pre[k]!==""&&pre[k]!=null);
 const miss=missingOf(tool,vals);const conf=Math.max(.5,Math.min(.97,.62+score/40-miss.length*.04-(c.subj&&c.subj!==ME_NAME?.02:0)));
 const subjNote=c.subj&&c.subj!==ME_NAME&&tool.write?" on behalf of <b>"+H(c.subj)+"</b>":"";
 if(tool.confirm==="form"||miss.length||tool.cat==="Chat control"&&miss.length){const fid=uid("F");ST.forms[fid]={id:fid,tool:tool.id,vals,err:{},pre:preKeys,status:"open",thread:t.id,q,conf,created:Date.now()};if(miss.length)t.pend={form:fid};
  const intro=tool.confirm==="form"?"Here is the form"+subjNote+", prefilled from what you said. Check it, then submit. Cost and approvers update as you change it.":"I can do that with <b>"+H(tool.name)+"</b>"+subjNote+". I filled "+preKeys.length+" field"+(preKeys.length===1?"":"s")+" from your words and this page. "+(miss.length?"I still need "+miss.map(x=>"<b>"+H(x.label)+"</b>").join(", ")+". Fill it in below, or just tell me.":"");
  sayAI(t,intro,{cards:[{t:"form",id:fid}],steps:["Matched tool: "+tool.id,"Prefilled "+preKeys.length+" of "+inputsOf(tool,vals).length+" fields",miss.length?"Missing: "+miss.map(x=>x.label).join(", "):"All required fields present"],lin:lineage({conf,src:["Your words","Page context","Subject person","Tool registry: "+tool.id]}),sugg:null});return}
 return proposeAct(tool,vals,t,c,{q,conf,intro:"Here is what I would do"+subjNote+". Nothing runs until the mode of this thread allows it."})}
CX.toolFlow=toolFlow;
function chain(pairs,q,t,c){const steps=[];let prev=[];const E0=ents(q);let ok=true;const paramsAll=[];pairs.forEach(([tool,txt],i)=>{const E=ents(txt);let pre={};try{pre=tool.prefill?tool.prefill(E,txt,c)||{}:{}}catch(e){}const vals=withDefaults(tool,pre);const miss=missingOf(tool,vals);if(miss.length)ok=false;paramsAll.push([tool,vals,miss])});
 if(!ok){const [tool,vals]=paramsAll.find(x=>x[2].length);return toolFlow(tool,pairs[paramsAll.findIndex(x=>x[2].length)][1],ents(pairs[0][1]),t,c,8)}
 const act=baseAct(t,c,"Two actions: "+pairs.map(p=>p[0].name).join(" then "),q,paramsAll[0][0].id,paramsAll[0][1]);act.chain=true;
 steps.push(checkStep());let dep=["c0"];paramsAll.forEach(([tool,vals],i)=>{const chk=check(tool,vals,c);const gs=chk.gates;const gids=[];gs.forEach((g,gi)=>{const id="g"+i+"_"+gi;steps.push({id,kind:"gate",label:"Approval: "+g.who,gate:{who:g.who,why:g.why,pol:g.pol,st:"pending"},owner:{kind:"gate",who:g.who},dep:dep.slice(),status:"queued"});gids.push(id)});const sid="a"+i;steps.push({id:sid,kind:"act",tool:tool.id,label:tool.name,params:vals,owner:{kind:"agent",who:"Claude"},risk:riskOf(tool,vals),dep:gids.length?gids:dep.slice(),status:"queued",blocked:chk.block});dep=[sid]});
 act.steps=steps;return finalizeAct(act,t,c,{q,conf:.82,intro:"Two steps, in order."})}
function checkStep(){return{id:"c0",kind:"check",label:"Check permissions and guardrails",owner:{kind:"auto",who:"Policy engine"},dep:[],status:"queued",risk:"low"}}
function baseAct(t,c,title,q,toolId,params){return{id:uid("A"),thread:t.id,title,q,tool:toolId,params,mode:t.mode,steps:[],status:"planned",created:Date.now(),onBehalf:c.subj&&c.subj!==ME_NAME?c.subj:null,by:ME_NAME,role:roleName(),log:[]}}
function proposeAct(tool,vals,t,c,o){o=o||{};const chk=check(tool,vals,c);const tg=targetOf(vals,c);const title=tool.name+(tool.write&&tg!==ME_NAME?" for "+tg:"");const act=baseAct(t,c,title,o.q,tool.id,vals);
 const steps=[checkStep()];const base=tool.plan?tool.plan(vals,c):[{id:"a0",label:tool.name,tool:tool.id,params:vals,owner:{kind:"agent",who:"Claude"},dep:[]}];
 base.forEach((b,bi)=>{const bt=TBY(b.tool)||tool;const single=!tool.plan;const sub=single?chk:check(bt,b.params,c);let gids=[];
  if(!bt.watch||single&&!bt.watch){sub.gates.filter(g=>!(single&&bt.watch)).forEach((g,gi)=>{const id=b.id+"_g"+gi;steps.push({id,kind:"gate",label:"Approval: "+g.who,gate:{who:g.who,why:g.why,pol:g.pol,st:"pending"},owner:{kind:"gate",who:g.who},dep:(b.dep&&b.dep.length?b.dep:["c0"]).slice(),status:"queued"});gids.push(id)})}
  steps.push({id:b.id,kind:"act",tool:bt.id,label:b.label||bt.name,params:b.params||vals,owner:b.owner||{kind:"agent",who:"Claude"},risk:riskOf(bt,b.params||vals),dep:gids.length?gids:((b.dep&&b.dep.length)?b.dep.slice():["c0"]),status:"queued",sub:b.sub,blocked:sub.block,gateList:bt.watch?sub.gates:null,write:bt.write})});
 act.steps=steps;act.pols=chk.notes;act.blocked=chk.block;act.force=chk.force;return finalizeAct(act,t,c,o)}
function finalizeAct(act,t,c,o){const tools=act.steps.filter(s=>s.kind==="act").map(s=>TBY(s.tool)).filter(Boolean);act.risk=act.steps.reduce((m,s)=>RANK[s.risk||"low"]>RANK[m]?s.risk:m,"low");
 act.write=tools.some(x=>x.write);act.conf=o.conf||.85;act.lin=lineage({conf:act.conf,title:"How this plan was made",note:"A deterministic planner scored the registered tools against your words and the page, filled the parameters from context, then evaluated every guardrail policy. No data left the platform.",src:["Your request","Context pack: "+(c.page?c.page.name:"none")+(c.subj?", "+c.subj:""),"Tool registry","Policy engine"],guards:(act.pols||[]).filter(n=>n.ok).map(n=>n.pol+" "+n.n+": "+n.txt).slice(0,5).concat(["Mode: "+MODES[act.mode].n,"Audited with model and confidence"])});
 act.blockedAny=act.steps.some(s=>(s.blocked||[]).length)||(act.blocked||[]).length>0;if(act.blockedAny){act.status="blocked"}
 ST.acts.unshift(act);ST.use.tasks++;audit("chat: planned",act.title+" · "+act.steps.length+" steps · risk "+act.risk);
 const nonRead=act.write;const mode=t.mode||ST.mode;
 if(act.status==="blocked"){const why=[].concat(act.blocked||[],...act.steps.map(s=>s.blocked||[])).filter((x,i,a)=>a.indexOf(x)===i);ST.use.blocked++;
  sayAI(t,"I cannot run this for you. "+why.map(H).join(" ")+" The plan is below so you can see what it would have done.",{cards:[{t:"plan",id:act.id}],lin:act.lin,stream:false,sugg:["Who can do this instead?","Switch to a role that can"]});save();return act}
 let auto=false;if(!nonRead)auto=true;else if(o.forceRun&&mode!=="suggest"&&act.risk!=="high"){auto=true}else if(mode==="act"){auto=act.risk!=="high"&&!act.force&&tools.every(x=>x.confirm!=="always")}
 if(mode==="suggest"&&nonRead){act.status="suggested";sayAI(t,"This thread is set to <b>suggest only</b>, so I will not change anything. Here is the plan. You can do it yourself, or switch the thread to ask before acting.",{cards:[{t:"plan",id:act.id}],lin:act.lin,sugg:null});return act}
 if(auto){sayAI(t,(nonRead?"Within the guardrails of this thread, I am running it now. ":"")+(o.intro&&!nonRead?"":""),{cards:[{t:"plan",id:act.id}],lin:act.lin});runAct(act);return act}
 sayAI(t,o.intro||"Here is the plan.",{cards:[{t:"plan",id:act.id}],lin:act.lin,steps:["Risk: "+RISK[act.risk].n,act.steps.filter(s=>s.kind==="gate").length+" approval"+(act.steps.filter(s=>s.kind==="gate").length===1?"":"s")+" from other people"]});save();return act}
CX.proposeAct=proposeAct;

/* ================= answers: grounded, with citations ================= */
function answer(q,E,t,c){const l=q.toLowerCase();ST.use.answered++;
 const mid=metricFrom(q);if(mid&&/measure|calculat|defin|formula|metric|how (is|are)|what is|target|status|current|now|score|rate|how many|how much/.test(l)){const r=TBY("metric.explain").run({q},c);return finishRead(TBY("metric.explain"),r,q,t,c,.92)}
 /* module intents registered through ASKX (every module registers some) */
 let handled=false;const before=t.msgs.length;
 for(const fn of ASKX){if(fn===CX.askx)continue;try{if(fn(q)){handled=true;break}}catch(e){}}
 if(handled){if(t.msgs.length===before){}ST.use.deflect++;return}
 if(/theme|dark mode|light mode|clarity|lens|kill|pause|stop.*agent|shut|hold|invoice|lumen|pay|calendar|meeting|tomorrow|schedule|portal|slow|stale|article|why|amber|slip|slipped|change|impact|ripple|asc|gaap|lease|standard|auto|rule|clear automatically/.test(l)){const n0=t.msgs.length;try{_askPrev(q)}catch(e){}if(t.msgs.length>n0){ST.use.deflect++;return}}
 const hits=searchHits(q,6);const ix=hits.length;
 if(ix){ST.use.deflect++;sayAI(t,"I do not have a tool for that, but I found "+ix+" record"+(ix>1?"s":"")+" in the platform that match. These are my sources.",{cards:[{t:"cites",items:hits}],lin:lineage({conf:.6,src:hits.map(h=>h.src)}),sugg:["Log an incident for this","Who can help with this?"]});return}
 ST.use.esc++;sayAI(t,"I could not find a source or a tool for that, and I will not guess (policy G9, cite or decline). I can hand it to a person.",{cards:[{t:"btnrow",btns:[{l:"Log it for the service desk",d:"tool:incident.create:"+encodeURIComponent("Log an incident: "+q)},{l:"Find who can help",d:"tool:route.expert:"+encodeURIComponent("who can "+q)}]}],lin:lineage({conf:.35,src:["No matching record"]}),stream:false})}
function finishRead(tool,res,q,t,c,conf){if(!res.ok){sayAI(t,"I could not do that: "+H(res.error||"unknown error"),{stream:false,lin:lineage({conf:.4})});return}
 auditTool(tool,{},res,"read");ST.toolUse[tool.id]=(ST.toolUse[tool.id]||0)+1;const cards=[].concat(res.card||[]);if(res.cite&&res.cite.length)cards.push({t:"cites",items:res.cite});
 sayAI(t,H(res.summary),{cards,lin:lineage({conf:conf||.9,src:(res.cite||[]).map(x=>x.src+": "+x.t).concat(["Policy G9: cited"]),guards:["Read only","Cited from platform records (G9)","Sensitive HR fields "+(hasCap("hr.read")?"visible to your role":"redacted")]}),sugg:SUGG_BY_TOOL[tool.id]||["Show me the record","Explain another one"]});return res}
let _askPrev=function(){};
CX.setAskPrev=f=>{_askPrev=f};
function auditTool(tool,params,res,kind){audit("chat "+(kind||"action")+": "+tool.id,(res&&res.summary||tool.name)+" · model Claude Sonnet · "+Math.round((res&&res.conf||.88)*100)+"% · mode "+(cur().mode||ST.mode))}

/* ================= parse a typed answer into a pending field ================= */
function fillFromText(f,text){const tool=TBY(f.tool);const miss=missingOf(tool,withDefaults(tool,f.vals));if(!miss.length)return false;const fld=miss[0];const l=text.toLowerCase();let v=null;
 if(fld.type==="person"){const n=findPersons(text);v=n[0]||(who(text.trim())?who(text.trim()).name:null)}
 else if(fld.type==="date"){v=parseDates(l)[0]||null}
 else if(fld.type==="service"){const s=svcByText(text);v=s?s.n:null}
 else if(fld.type==="select"||fld.type==="chips"){const o=(typeof fld.opts==="function"?fld.opts():fld.opts||[]).map(fOpt2);const m=o.find(x=>l.indexOf(String(x[1]).toLowerCase())>=0||l.indexOf(String(x[0]).toLowerCase())>=0);v=m?m[0]:null}
 else if(fld.type==="number"||fld.type==="money"){const m=/(\d+(?:\.\d+)?)/.exec(text);v=m?+m[1]:null}
 else if(fld.type==="rec"){const m=REC_RE.exec(text.toUpperCase());v=m?m[1]:null}
 else v=text.trim();
 if(v==null||v==="")return false;f.vals[fld.k]=v;return true}
const fOpt2=o=>Array.isArray(o)?o:[o,o];

/* ================= activity engine ================= */
const SPEED=()=>DEMO_FAST()?15:(document.documentElement.dataset.motion==="reduced"?60:650);
const DONE=["done","skipped"];
function depsOk(a,s){return(s.dep||[]).every(d=>{const x=a.steps.find(y=>y.id===d);return x&&DONE.includes(x.status)})}
function stepRisk(a,s){return s.risk||"low"}
function logA(a,tx){a.log.push({t:clock(),tx});}
function runAct(a){if(a.status==="running")return;a.status="running";a.started=a.started||Date.now();a.steps.forEach(s=>{if(s.status==="cancelled"&&!s.hardCancel)s.status="queued"});logA(a,"Started in mode "+MODES[a.mode||ST.mode].n);audit("chat: started activity",a.title);CX.refresh&&CX.refresh();pump(a)}
CX.runAct=runAct;
function watchSync(a){a.steps.forEach(s=>{if(s.status==="awaiting"&&s.kind==="act"&&s.reqId){const r=ST.reqs.find(x=>x.id===s.reqId);if(r&&r.state!=="Approvals"){s.status=r.state==="Rejected"||r.state==="Cancelled"?"failed":"done";s.err=s.status==="failed"?"The request was "+r.state.toLowerCase():"";s.end=Date.now();logA(a,s.label+": "+(s.status==="done"?"approvals complete, sent to fulfillment":"stopped, "+r.state));if(s.status==="done")notifyAct(a,s.label+" is approved and in fulfillment")}}})}
function recalc(a){const st=a.steps;if(a.status==="cancelled"||a.status==="undone")return;if(st.some(s=>s.status==="running"))a.status="running";else if(st.every(s=>DONE.includes(s.status))){if(a.status!=="done"){a.status="done";a.ended=Date.now();ST.use.done++;ST.use.steps+=st.filter(s=>s.kind==="act").length;logA(a,"Completed");audit("chat: activity done",a.title);notifyAct(a,"Done: "+a.title);try{G(()=>S.chx.after&&S.chx.after(a))}catch(e){}}}
 else if(st.some(s=>s.status==="awaiting")&&!st.some(s=>s.status==="queued"&&depsOk(a,s)))a.status="awaiting";else if(st.some(s=>s.status==="failed")&&!st.some(s=>s.status==="queued"&&depsOk(a,s))&&!st.some(s=>s.status==="awaiting")){if(a.status!=="failed"){a.status="failed";a.ended=Date.now();ST.use.esc++;logA(a,"Stopped: a step failed");notifyAct(a,"Stopped: "+a.title,"warn")}}else a.status="running"}
function pump(a){if(!a||["cancelled","undone","planned","suggested","blocked"].includes(a.status))return;watchSync(a);a.steps.forEach(s=>{if(s.status==="queued"&&depsOk(a,s)&&!s.timer){s.status="running";s.start=Date.now();s.timer=setTimeout(()=>{s.timer=0;execStep(a,s)},SPEED()*(s.kind==="check"?.5:1))}});
 /* a failed step blocks the ones after it */
 a.steps.forEach(s=>{if(s.status==="queued"&&(s.dep||[]).some(d=>{const x=a.steps.find(y=>y.id===d);return x&&(x.status==="failed"||x.status==="cancelled")})&&!a.steps.some(y=>y.status==="running"))s.status="blocked"});
 recalc(a);CX.refresh&&CX.refresh();save()}
function execStep(a,s){if(a.status==="cancelled"){s.status="cancelled";CX.refresh();return}
 const c=ctxNow(findThread(a.thread));
 if(s.kind==="check"){const bad=[].concat(a.blocked||[],...a.steps.map(x=>x.blocked||[]));if(bad.length){s.status="failed";s.err=bad[0]}else{s.status="done";s.res={summary:"Allowed: "+(a.pols||[]).filter(n=>n.ok).map(n=>n.pol).join(", ")}};s.end=Date.now();logA(a,"Policy check: "+(s.status==="done"?"allowed":"blocked"));return pump(a)}
 if(s.kind==="gate"){s.status="awaiting";logA(a,"Waiting for "+s.gate.who+": "+s.gate.why);notifyAct(a,s.gate.who===ME_NAME?"Your approval is needed: "+s.gate.why:"Waiting on "+s.gate.who+": "+s.gate.why,s.gate.who===ME_NAME?"warn":"info");return pump(a)}
 const tool=TBY(s.tool);let res;try{res=tool.run(s.params||{},c,s)}catch(e){res={ok:false,error:"Error: "+(e&&e.message||e)}}
 s.end=Date.now();if(!res||!res.ok){s.status="failed";s.err=(res&&res.error)||"The tool returned no result";logA(a,s.label+" failed: "+s.err);audit("chat action failed: "+tool.id,s.err);return pump(a)}
 s.res=res;ST.toolUse[tool.id]=(ST.toolUse[tool.id]||0)+1;if(res.rec)s.rec=res.rec;
 audit("chat action: "+tool.id,res.summary+" · "+(a.onBehalf?"on behalf of "+a.onBehalf+" · ":"")+"model Claude Sonnet "+Math.round(a.conf*100)+"% · mode "+(a.mode||ST.mode)+" · "+((a.pols||[]).filter(n=>n.ok).map(n=>n.pol).join(",")||"policies ok"));
 if(tool.watch&&res.rec){s.reqId=res.rec.id;const r=ST.reqs.find(x=>x.id===res.rec.id);if(r&&r.state==="Approvals"){s.status="awaiting";logA(a,s.label+": submitted "+r.id+", waiting for "+r.gates.filter(g=>g.st==="pending").map(g=>g.who).join(", "));notifyAct(a,r.id+" submitted. Approvals pending.","info");return pump(a)}}
 s.status="done";logA(a,s.label+": "+res.summary);
 /* post the result card into the conversation */
 const th=findThread(a.thread);if(th&&res.card){const cards=[].concat(res.card);const m=pushMsg({ai:1,t:"<b>"+H(s.label)+"</b>: "+H(res.summary),cards,lin:lineage({conf:a.conf,title:"How this step was done",note:"Run by "+(s.owner&&s.owner.who||"Claude")+" through the tool “"+tool.id+"” after the guardrail check.",src:["Tool: "+tool.name,"Plan "+a.id],guards:(a.pols||[]).filter(n=>n.ok).map(n=>n.pol+": "+n.txt).slice(0,4),pol:(a.pols||[]).filter(n=>n.ok).map(n=>n.pol)}),stream:false,actId:a.id,stepId:s.id},th);if(CX.drawMsgs)CX.drawMsgs()}
 pump(a)}
const findThread=id=>ST.threads.find(t=>t.id===id)||cur();
function notifyAct(a,txt,kind){ST.notes=ST.notes||[];ST.notes.unshift({t:clock(),tx:txt,act:a.id,k:kind||"good",read:false});ST.notes.length=Math.min(ST.notes.length,40);if(kind==="warn"||!CX.isOpen||!CX.isOpen())toast(txt,kind==="warn"?"warn":"good");CX.badge&&CX.badge()}
function gateDecide(a,sid,verdict,as){const s=a.steps.find(x=>x.id===sid);if(!s||s.status!=="awaiting"||s.kind!=="gate")return;const ap=s.gate.who;const real=ap===ME_NAME||(as==="me");const dlg=ap!==ME_NAME&&delegation(ap).verified&&as!=="demo";
 if(polOn("G7")&&verdict==="approved"&&ap===a.by&&!as){toast("Separation of duties: you cannot approve your own request","warn");return}
 s.gate.st=verdict;s.gate.at=clock();s.gate.by=real?ME_NAME:(dlg?ME_NAME+" for "+ap:"Demo: "+ap);s.end=Date.now();
 if(verdict==="approved"){s.status="done";logA(a,ap+" approved ("+s.gate.by+")")}else{s.status="failed";s.err=ap+" rejected: "+(s.gate.why||"");logA(a,ap+" rejected ("+s.gate.by+")");ST.use.esc++}
 audit("chat approval "+verdict,ap+" · "+a.title+" · decided by "+s.gate.by);pump(a)}
function reqGate(rid,i,verdict,as){const r=ST.reqs.find(x=>x.id===rid);if(!r||!r.gates[i]||r.gates[i].st!=="pending")return;const g=r.gates[i];if(polOn("G7")&&r.by===g.who&&verdict==="approved"){toast("Separation of duties: "+g.who+" made this request","warn");return}g.st=verdict;g.at=clock();g.by=g.who===ME_NAME?ME_NAME:(as==="demo"?"Demo: "+g.who:ME_NAME+" for "+g.who);r.log.push({t:clock(),tx:g.who+" "+verdict+" ("+g.by+")"});advanceReq(r);audit("chat approval "+verdict,r.id+" · "+g.who+" · "+g.by);ST.acts.forEach(a=>pump(a));CX.refresh&&CX.refresh();save()}
function cancelAct(a,why){if(["done","cancelled","undone"].includes(a.status))return;a.steps.forEach(s=>{if(["queued","awaiting","running"].includes(s.status)){s.status="cancelled";s.hardCancel=1;if(s.timer){clearTimeout(s.timer);s.timer=0}}});a.status="cancelled";a.ended=Date.now();logA(a,"Cancelled"+(why?": "+why:""));audit("chat: cancelled activity",a.title);CX.refresh&&CX.refresh();save()}
function undoAct(a){let n=0;const out=[];a.steps.slice().reverse().forEach(s=>{if(s.kind==="act"&&s.res&&s.res.undo&&!s.undone){const tool=TBY(s.tool);try{out.push(tool.undo(s.res.undo,s.res)||"Undone");s.undone=true;n++}catch(e){out.push("Could not undo "+s.label)}}});
 if(n){a.status=a.steps.every(s=>s.kind!=="act"||s.undone||!(s.res&&s.res.undo))?"undone":a.status;logA(a,"Undone: "+out.join("; "));audit("chat: undid activity",a.title+" · "+out.join("; "));toast(out[0],"info");try{render()}catch(e){}CX.refresh&&CX.refresh();save()}else toast("Nothing here can be undone","warn")}
const undoable=a=>a.steps.some(s=>s.kind==="act"&&s.res&&s.res.undo&&!s.undone);
CX.gateDecide=gateDecide;CX.reqGate=reqGate;CX.cancelAct=cancelAct;CX.undoAct=undoAct;CX.undoable=undoable;
CX.actById=id=>ST.acts.find(a=>a.id===id);
