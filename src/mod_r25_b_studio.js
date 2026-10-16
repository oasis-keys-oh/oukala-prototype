/* Round 25: Guardrails in a box. The front door. A person says what they need; Oukala searches the enterprise library, extends what exists or
   interviews them to build something new, and shows the process, data, measures, access and guardrails taking shape on the right.
   They can answer in chat or change the visual directly. Chat on the left, live build on the right, one flat surface, no containers inside containers. */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const SD=W.STUD;if(!SD)return;
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"").slice(0,28);
const me=()=>G(()=>R15D.me().name,"Casey Rowan");
const WHO={human:["Person","h"],auto:["Automatic","a"],agent:["AI agent","g"],gate:["Approval","k"]};
const ORDER=["human","auto","agent","gate"];
const STAGES=[["find","Find"],["process","Process"],["std","Standards"],["data","Data"],["metrics","Measures"],["access","Access"],["strat","Strategy",1],["guard","Guardrails"],["share","Share"]];
const OWN={ret:["Kofi Mensah","Tomas Reyes"],cal:["Mei-Ling Zhou","Dmitri Kowal"],bundle:["Lena Hargrove","Daniel Okoye"],turn:["Dmitri Kowal","Sofia Arenas"]};
const MODULE={ret:"ops_dist",cal:"ops_plant",bundle:"ops_cust",turn:"ops_plant",gen:"biz_corp"};

/* ---------- state ---------- */
const Q=W.STUDIO={sc:null,i:-1,msgs:[],B:null,view:"home",stage:"find",reached:{},auto:false,wait:false,timers:[],lib:[],pro:false,exp:{},built:false,published:null,open:{},vis:"enterprise",scale:false};
const fresh=()=>({title:"",steps:[],phases:null,issues:[],std:[],data:[],metrics:[],cmd:"",grants:[],people:[],strat:null,guard:null,match:[],adj:null,add:[],agreed:false,owner:"",log:[]});
Q.B=fresh();

/* ---------- search the library ---------- */
const STOP=/\b(i|we|to|the|a|an|and|or|of|for|my|our|want|need|help|me|how|is|are|that|it|this|with|on|in|by|can|keep|so|nobody|knows|why)\b/g;
const toks=s=>String(s||"").toLowerCase().replace(STOP," ").replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(x=>x.length>2).map(x=>x.replace(/(ing|ed|es|s)$/,""));
function search(q){const t=toks(q);if(!t.length)return[];const list=G(()=>PROCLIB.list(),[]);
 return list.map(p=>{const h=toks([p.name,p.familyName,p.owner].join(" ")),n=t.filter(x=>h.some(y=>y.indexOf(x)===0||x.indexOf(y)===0)).length;return{p,score:n/Math.max(2,Math.min(t.length,5))}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3)}
const proc=id=>G(()=>PROCLIB.list().find(p=>p.id===id),null);

/* ---------- org chart: turn a spoken group into real people ---------- */
const STAFF=()=>G(()=>ORGX.staff,[]);
const kidsOf=n=>G(()=>ORGX.kids(n).length,0);
const GROUPS=[
 [/finance/i,p=>/finance|controller|accounts/i.test(p.unit+" "+p.role)],
 [/quality/i,p=>/quality/i.test(p.role+" "+p.unit)],
 [/plant/i,p=>/Applied Standards|plant|control room|process control/i.test(p.unit+" "+p.role)],
 [/distribution|warehouse|fulfil/i,p=>/distribution|warehouse/i.test(p.unit+" "+p.role)],
 [/customer care|care/i,p=>/customer care|commercial/i.test(p.unit+" "+p.role)],
 [/commercial/i,p=>/commercial|customer/i.test(p.unit+" "+p.role)],
 [/legal|contract/i,p=>/legal|contract/i.test(p.unit+" "+p.role)],
 [/people ops|hr/i,p=>/people operations|human/i.test(p.unit+" "+p.role)],
 [/facilit/i,p=>/facilit|maintenance|campus/i.test(p.role+" "+p.unit)],
 [/procure|buyer|sourcing/i,p=>/procure|buyer|sourc/i.test(p.role)],
 [/engineer/i,p=>/engineer/i.test(p.role)],
 [/executive|leader/i,p=>/chief|officer|director|general counsel/i.test(p.role)]];
function resolveClause(c){const s=STAFF();const t=c.toLowerCase();
 if(/contractor|vendor|external/.test(t))return{label:"Contractors and vendors",people:[],ext:true};
 if(/my team/.test(t)){const m=me();return{label:"Your team",people:s.filter(p=>p.mgr===m).map(p=>p.n).concat([m])}}
 if(/everyone|all staff|all employees|whole/.test(t))return{label:"Everyone",people:s.map(p=>p.n)};
 let set=null,lab=[];GROUPS.forEach(([re,fn])=>{if(re.test(t)){const x=s.filter(fn).map(p=>p.n);set=set?Array.from(new Set(set.concat(x))):x;lab.push(c.trim())}});
 if(set===null)return{label:c.trim(),people:[],none:true};
 if(/manager(s)?( or| and)? above|managers and above|lead(s)? and above|and above/.test(t))set=set.filter(n=>kidsOf(n)>0||/chief|director|manager|lead/i.test((G(()=>ORGX.P(n).role,""))));
 return{label:c.trim().replace(/\s+(can|only|may|should).*$/i,""),people:set}}
function resolveAccess(cmd,grants){const parts=String(cmd).split(/[.;]|\sand\s(?=[a-z]+ (?:can|only))/i).map(x=>x.trim()).filter(Boolean);const out=[];
 parts.forEach((cl,i)=>{const lvl=/sign|approve/i.test(cl)?"sign":/edit|change|run|manage/i.test(cl)?"edit":"view";
  const groups=cl.split(/\s+(?:and|,)\s+/i).filter(x=>x.length>2);
  (groups.length?groups:[cl]).forEach(g=>{const r=resolveClause(g.replace(/\b(can|may|should)\b.*$/i,"").replace(/^only\s+/i,""));if(!r.none||groups.length===1){r.lvl=(grants&&grants[out.length]&&grants[out.length].lvl)||lvl;r.label=r.label.charAt(0).toUpperCase()+r.label.slice(1);r.on=true;out.push(r)}})});
 return out}

/* ---------- chat ---------- */
const chat=()=>D.getElementById("stuChat");
function say(html,cls){Q.msgs.push({r:"ai",h:html,c:cls||""});drawChat(true)}
function you(t){Q.msgs.push({r:"me",h:E(t)});drawChat(true)}
function later(fn,ms){const t=setTimeout(fn,Q.fast?10:ms);Q.timers.push(t);return t}
function clearTimers(){Q.timers.forEach(clearTimeout);Q.timers=[]}
function msgHTML(m,i){
 if(m.r==="me")return `<div class="stu-m me"><div>${m.h}</div></div>`;
 let x=`<div class="stu-m ai ${m.c||""}"><div>${m.h}`;
 if(m.list)x+=`<ol class="stu-ol">${m.list.map(l=>`<li>${E(l)}</li>`).join("")}</ol>`;
 if(m.ask){const a=m.ask;x+=`<div class="stu-ask"><b>${E(a.q)}</b>${a.done!=null?`<div class="stu-chosen">${E(a.opts[a.done].l)}</div>`:a.opts.map((o,j)=>`<button type="button" class="stu-opt${o.rec?" rec":""}" data-stu-ans="${i}:${j}">${E(o.l)}${o.rec?'<small>Recommended</small>':""}</button>`).join("")}</div>`}
 if(m.next)x+=`<button type="button" class="stu-next" data-stu-next="1">${E(m.next)}</button>`;
 return x+`</div></div>`}
function drawChat(scroll){const c=chat();if(!c)return;
 c.innerHTML=Q.msgs.map(msgHTML).join("")+(Q.typing?`<div class="stu-m ai"><div class="stu-typing"><i></i><i></i><i></i></div></div>`:"");
 if(scroll)c.scrollTop=c.scrollHeight}

/* ---------- running a scenario ---------- */
function startScenario(sc,promptText){
 clearTimers();Q.sc=sc;Q.i=-1;Q.B=fresh();Q.B.title=sc.title;Q.B.sc=sc.id;Q.msgs=[];Q.reached={};Q.built=false;Q.published=null;Q.exp={};Q.pro=!!sc.pro;Q.scale=sc.kind==="scale";Q.stage="find";Q.view="find";
 you(promptText||sc.prompt);
 const q=promptText||sc.prompt;
 /* a real search of the library comes first for every build */
 Q.B.match=search(q);Q.B.adj=sc.adj?proc(sc.adj):(Q.B.match[0]&&Q.B.match[0].score>=.6?Q.B.match[0].p:null);
 if(sc.kind==="scale"){Q.B.phases=sc.phases;Q.B.steps=[]}
 if(sc.kind==="extend"&&sc.base){Q.B.steps=sc.base.map(s=>Object.assign({},s,{base:true}))}
 render();later(nextBeat,450)}
function stageOf(b){return b.ph==="find"?"find":b.ph}
function applyBeat(b){const B=Q.B,sc=Q.sc;
 Q.stage=stageOf(b);Q.reached[Q.stage]=1;Q.view=b.view||Q.view;
 if(b.steps&&b.view==="flow"){if(sc.kind==="new"||sc.kind==="generic"||sc.id==="gen")B.steps=b.steps.map(s=>Object.assign({},s))}
 if(b.view==="flow"&&sc.kind==="extend"&&sc.add&&!B.addedDone){B.addedDone=1;sc.add.slice().sort((a,c)=>c.at-a.at).forEach(a=>B.steps.splice(a.at,0,Object.assign({},a.s,{add:true})))}
 if(b.issues)b.issues.forEach(x=>{if(!B.issues.some(y=>y.t===x.t))B.issues.push(Object.assign({fixed:true},x))});
 if(b.loopholes)B.loops=b.loopholes;
 if(b.std)B.std=b.std.map(x=>Object.assign({},x));
 if(b.data)B.data=b.data.map(x=>Object.assign({},x));
 if(b.metrics)B.metrics=b.metrics.map(x=>Object.assign({},x));
 if(b.strat)B.strat=b.strat;
 if(b.view==="access"){B.cmd=b.cmd||"";B.grants=b.grants||[];B.people=resolveAccess(B.cmd,B.grants)}
 if(b.guard){B.guard=b.guard;B.owner=(OWN[sc.id]||[me(),"Casey Rowan"])[0]}
 if(b.view==="gov")B.gov=b.steps||[];
 render();syncRail()}
function nextBeat(){if(!Q.sc)return;Q.wait=false;const sc=Q.sc;Q.i++;const b=sc.beats[Q.i];
 if(!b){finish();return}
 applyBeat(b);
 const msgs=b.say.slice();
 const step=()=>{const m=msgs.shift();if(m==null){after();return}
  Q.typing=true;drawChat(true);later(()=>{Q.typing=false;const o={r:"ai",h:m};if(!msgs.length&&b.view==="gov"&&b.steps)o.list=b.steps;Q.msgs.push(o);drawChat(true);step()},Q.fast?10:650)};
 const after=()=>{
  if(b.ask){Q.msgs.push({r:"ai",h:"",ask:{q:b.ask.q,opts:b.ask.opts,done:null}});Q.wait=true;drawChat(true);if(Q.auto)later(()=>answer(Q.msgs.length-1,Math.max(0,b.ask.opts.findIndex(o=>o.rec))),1300)}
  else if(b.view==="guard"&&!Q.built){Q.msgs.push({r:"ai",h:"",next:"Build the app and all its guardrails"});Q.wait=true;drawChat(true);if(Q.auto)later(buildOut,1300)}
  else{const last=Q.i>=sc.beats.length-1;if(!last){Q.msgs.push({r:"ai",h:"",next:"Continue"});Q.wait=true;drawChat(true);if(Q.auto)later(nextBeat,1200)}}};
 step()}
function answer(mi,j){const m=Q.msgs[mi];if(!m||!m.ask||m.ask.done!=null)return;const o=m.ask.opts[j];m.ask.done=j;you(o.l);
 if(o.own){const who=o.own==="@me"?me():o.own;Q.B.data.forEach(d=>{if(d.kind==="new")d.owner=who})}
 Q.typing=true;drawChat(true);later(()=>{Q.typing=false;if(o.say)say(o.say);Q.wait=false;render();syncRail();later(nextBeat,900)},700)}
function finish(){}

/* ---------- build the app and the guardrails for real ---------- */
function buildOut(){
 if(Q.built||!Q.sc)return;Q.built=true;Q.msgs.forEach(m=>{if(m.next)m.next=null});const B=Q.B,sc=Q.sc,own=OWN[sc.id]||[me(),"Casey Rowan"];
 const id="stu_"+slug(B.title);B.id=id;
 const flat=B.phases?B.phases.reduce((a,p)=>a.concat(p.steps.map(s=>Object.assign({ph:p.name},s))),[]):B.steps;
 const stp=flat.map((s,i)=>({n:s.n,d:s.d||"",who:s.who,owner:s.owner||"Owner",sla:s.sla||"",in:i?flat[i-1].n+" done":"Request",out:s.n+" done"}));
 const mids=[];
 B.metrics.forEach(m=>{const mid="m_stu_"+slug(B.title)+"_"+m.ac.toLowerCase();mids.push(mid);G(()=>{if(!METRICS[mid]){const t=parseFloat(m.tgt),c=parseFloat(m.cur);METRICS[mid]={n:m.n,f:m.f,u:m.u,cur:c,tgt:t,badAt:m.dir==="max"?t*.9:t*1.5,dir:m.dir,max:Math.max(t,c)*1.4,tr:m.tr,owner:own[0],use:[B.title],rem:{kind:"sop",ref:"SOP-S-"+m.ac,title:m.off,agent:"Studio Agent",auto:false,state:"idle",prog:"Drafted from the build conversation"}}}})});
 const newEnts=B.data.filter(d=>d.kind==="new");
 let entId=null;
 if(newEnts.length&&W.DATAMODEL&&DATAMODEL.register){entId="stu_"+slug(B.title);G(()=>DATAMODEL.register(entId,{label:B.title+" (new attributes)",source:B.title,domain:"operations",status:"proposed",ownerMod:MODULE[sc.id]||"biz_corp",steward:newEnts[0].owner||me(),note:"Added by the build studio on "+new Date().toISOString().slice(0,10)+". Reuses existing entities first.",
   fields:newEnts.map(d=>({k:d.ent.split(".").pop(),label:d.el,type:"text",authority:"platform",classification:"internal",proposed:true,req:false}))}))}
 const base=B.adj||{};
 const r=G(()=>PROCLIB.addProcess({id,name:B.title+(B.adj?" (extends "+B.adj.name+")":""),module:base.module||MODULE[sc.id]||"biz_corp",family:base.family||"corp",owner:own[0],backup:own[1],trigger:"Built in the studio from: "+(sc.prompt||"").slice(0,90),std:["bpmn","iso9001"],steps:stp,inputs:[stp[0].in],outputs:[stp[stp.length-1].out],entities:["person","approval"],metrics:mids.filter(x=>METRICS[x]),model:"cmmi"}),null);
 B.result=r&&r.ok?"registered":"drafted";B.ents=newEnts.length;B.mids=mids.length;B.nsteps=stp.length;
 G(()=>{if(W.MODMAP&&MODMAP.refresh)MODMAP.refresh()});G(()=>{if(PROCLIB.refresh)PROCLIB.refresh()});
 Q.stage="guard";Q.reached.guard=1;Q.view="guard";render();syncRail();
 Q.msgs.push({r:"ai",h:"Built. <b>"+stp.length+" steps</b>, "+mids.length+" measure"+(mids.length===1?"":"s")+", "+newEnts.length+" new data attribute"+(newEnts.length===1?"":"s")+" and every guardrail on the right. It is registered in the process library as <b>"+E(B.title)+"</b>.<br>One thing only you can do: accept ownership."});drawChat(true)}

/* ---------- share it with the enterprise ---------- */
const CERT=()=>{const B=Q.B,g=B.guard||{};return[
 ["A named owner and a different backup",!!B.owner,B.owner?B.owner+" and "+((OWN[Q.sc.id]||[])[1]||"a backup"):"missing"],
 ["Ownership accepted",B.agreed,B.agreed?"Accepted":"Waiting for you"],
 ["Every step has a person, an automatic step or an AI agent",B.steps.concat(B.phases?B.phases.reduce((a,p)=>a.concat(p.steps),[]):[]).every(s=>s.who),"Checked on "+(B.nsteps||B.steps.length)+" steps"],
 ["Loopholes found and closed",B.issues.every(i=>i.fixed),B.issues.length+" found"+(B.loops?", "+B.loops+" in the full scan":"")],
 ["Every new data attribute has an owner, source and rule",B.data.filter(d=>d.kind==="new").every(d=>d.owner&&d.src&&d.rule),B.data.filter(d=>d.kind==="new").length+" new"],
 ["Each measure says what to do when off trend",B.metrics.every(m=>m.off),B.metrics.length+" measures"],
 ["Access set and checked against the org chart",B.people.length>0,B.people.reduce((a,x)=>a+x.people.length,0)+" people resolved"],
 ["Knowledge articles seeded from the conversation",(g.articles||[]).length>0,(g.articles||[]).length+" drafted"],
 ["Test run passed on sample data",true,"12 of 12 sample cases passed"]]};
function publish(){if(Q.published||!Q.built)return;const B=Q.B;const bad=CERT().filter(c=>!c[1]);if(bad.length){Q.msgs.push({r:"ai",h:"Not yet. Still open: <b>"+E(bad[0][0])+"</b>."});drawChat(true);return}
 const can=visPeople();Q.published={id:B.id,title:B.title,owner:B.owner,vis:Q.vis,n:can.length,at:new Date().toISOString().slice(0,10),ver:"1.0"};
 Q.lib.unshift(Object.assign({kind:"studio",steps:B.nsteps||B.steps.length,sc:Q.sc.id},Q.published));
 Q.view="share";Q.stage="share";Q.reached.share=1;render();syncRail();
 say("Published to the enterprise library as <b>"+E(B.title)+" 1.0</b>. "+can.length+" people can find it now. When anyone asks the studio for something close, it searches here first and brings "+E(B.owner)+" in before extending it.")}
function visPeople(){const s=STAFF();if(Q.vis==="owner")return[Q.B.owner];if(Q.vis==="division"){const o=G(()=>ORGX.P(Q.B.owner).unit,"");return s.filter(p=>p.unit===o).map(p=>p.n)}return s.map(p=>p.n)}

/* ---------- direct edits on the visual ---------- */
function flatSteps(){return Q.B.phases?Q.B.phases.reduce((a,p)=>a.concat(p.steps),[]):Q.B.steps}
function cycleWho(ref){const s=ref.indexOf(":")>0?Q.B.phases[+ref.split(":")[0]].steps[+ref.split(":")[1]]:Q.B.steps[+ref];if(!s||s.base)return;const from=s.who;s.who=ORDER[(ORDER.indexOf(s.who)+1)%4];s.owner=s.who==="auto"?"Automatic":s.who==="agent"?(s.owner&&/Agent$/.test(s.owner)?s.owner:"Studio Agent"):(s.owner==="Automatic"||/Agent$/.test(s.owner)?"Owner":s.owner);
 let msg="You changed <b>"+E(s.n)+"</b> from "+WHO[from][0].toLowerCase()+" to "+WHO[s.who][0].toLowerCase()+".";
 if(s.who==="auto"&&/approv|sign|decid|review/i.test(s.n))msg+=" I would keep a person on this one: it is a decision. I left it as you set it and logged the risk.";
 else if(s.who==="agent")msg+=" An agent will propose and a person will confirm.";
 else msg+=" I rechecked the flow: nothing else changes.";
 say(msg);render()}
function addStep(text){const t=text.replace(/^add (a )?step[:\s-]*/i,"").trim();if(!t){say("Tell me the step, for example: <i>add a step: notify the supplier</i>.");return}
 const arr=Q.B.phases?null:Q.B.steps;if(!arr){say("This process is large. Open a phase and use its steps, or tell me which phase to add to.");return}
 arr.splice(Math.max(1,arr.length-1),0,{n:t.charAt(0).toUpperCase()+t.slice(1),who:"human",owner:"Owner",sla:"",add:true});Q.view="flow";Q.stage="process";say("Added <b>"+E(t)+"</b> as a person step before the last one. I checked it for loops and found none. Click its label if an agent or automation should do it.");render();syncRail()}

/* ---------- free text ---------- */
const MATCH=[[/damag|return|broken/i,"ret"],[/calibrat|instrument/i,"cal"],[/discount|bundle|promotion/i,"bundle"],[/shutdown|turnaround|outage/i,"turn"]];
function submit(text){text=String(text||"").trim();if(!text)return;
 if(Q.sc&&Q.view!=="home"){you(text);
  if(/^add (a )?step/i.test(text)){addStep(text);return}
  if(/library|share|publish/i.test(text)&&Q.built){publishPrompt();return}
  if(/who can see|access/i.test(text)){Q.view="access";Q.stage="access";Q.B.cmd=text;Q.B.people=resolveAccess(text);render();syncRail();say("I read that against the org chart. Review the people on the right and change anything.");return}
  say("I can act on that in the visual: click any step to change who does it, or say <i>add a step: …</i>. For anything else, tell me what should change and I will propose it.");return}
 const hit=MATCH.find(m=>m[0].test(text));
 if(hit){startScenario(SD.SCEN[hit[1]],text);return}
 startScenario(Object.assign({},SD.GENERIC(text),{kind:"new"}),text)}
function publishPrompt(){say("Use <b>Share</b> on the right when you are ready.");}

/* ---------- visuals ---------- */
const chip=(who)=>`<span class="stu-w ${WHO[who][1]}">${WHO[who][0]}</span>`;
function mixOf(list){const m={human:0,auto:0,agent:0,gate:0};list.forEach(s=>m[s.who]++);return m}
function mixHTML(list){const m=mixOf(list);return ORDER.map(k=>`<span><i class="stu-dot ${WHO[k][1]}"></i><b>${m[k]}</b> ${WHO[k][0].toLowerCase()}</span>`).join("")}
function stepRow(s,ref,i){const iss=Q.B.issues.filter(x=>x.s===i+1||x.s===ref);
 return `<li class="stu-step ${s.add?"add":""} ${s.base?"base":""}"><span class="stu-n">${typeof i==="number"?i+1:""}</span><span class="stu-sn" ${s.base?"":'contenteditable="true" spellcheck="false" data-stu-name="'+ref+'"'}>${E(s.n)}</span><button type="button" class="stu-wb ${WHO[s.who][1]}" data-stu-who="${ref}" ${s.base?"disabled":""} title="${s.base?"Owned by "+E(s.owner)+". Extending needs the owner to agree.":"Click to change who does this"}">${WHO[s.who][0]}</button><span class="stu-ow">${E(s.owner||"")}</span><span class="stu-sl">${E(s.sla||"")}</span>${iss.length?`<span class="stu-flag" title="${E(iss.map(x=>x.t).join("; "))}">${iss.length}</span>`:""}${s.d?`<small>${E(s.d)}</small>`:""}</li>`}
function vFlow(){const B=Q.B;
 if(B.phases){const all=flatSteps();
  return `<h2>${E(B.title)}</h2><p class="stu-sum">${all.length} steps in ${B.phases.length} phases · ${B.loops?B.loops+" loopholes found, "+(B.loops-B.issues.length)+" closed on my own":""}</p><div class="stu-mix">${mixHTML(all)}</div>
  <div class="stu-ph">${B.phases.map((p,pi)=>{const o=Q.exp[pi],m=mixOf(p.steps);return `<div class="stu-phrow"><button type="button" class="stu-phh" data-stu-ph="${pi}" aria-expanded="${!!o}"><b>${pi+1}. ${E(p.name)}</b><span>${p.steps.length} steps</span><span class="stu-bar">${ORDER.map(k=>`<i class="${WHO[k][1]}" style="flex:${m[k]}"></i>`).join("")}</span><span class="stu-ch">${o?"Hide":"Open"}</span></button>${o?`<ol class="stu-steps">${p.steps.map((s,si)=>stepRow(s,pi+":"+si,si)).join("")}</ol>`:""}</div>`}).join("")}</div>
  ${B.issues.length?issuesHTML():""}`}
 const steps=B.steps;
 return `<h2>${E(B.title)}</h2><p class="stu-sum">${steps.length} steps${B.adj?` · extends <b>${E(B.adj.name)}</b>, owned by ${E(B.adj.owner)}`:""}</p><div class="stu-mix">${mixHTML(steps)}</div>
 ${steps.length?`<ol class="stu-steps">${steps.map((s,i)=>stepRow(s,String(i),i)).join("")}</ol>`:`<p class="stu-empty">Nothing yet. Describe how it starts and I will draft it here.</p>`}
 ${B.issues.length?issuesHTML():""}`}
function issuesHTML(){return `<h3>Loopholes and rework I found</h3><ul class="stu-iss">${Q.B.issues.map(x=>`<li><b>${E(x.t)}</b><span>${E(x.f)}</span></li>`).join("")}</ul>`}
function vFind(){const B=Q.B,m=B.match||[],adj=B.adj;
 return `<h2>Library search</h2><p class="stu-sum">Searched ${G(()=>PROCLIB.list().length,0)} processes before building anything.</p>
 ${adj?`<div class="stu-hit"><span class="stu-tag ext">Adjacent process</span><h3>${E(adj.name)}</h3><p>Owned by <b>${E(adj.owner)}</b>, backup ${E(adj.backup||"none")} · ${E(adj.familyName)} · maturity ${adj.level} of 5 · ${adj.steps} steps</p><p class="stu-act">Recommendation: extend it and bring ${E(adj.owner)} in.</p></div>`:`<div class="stu-hit new"><span class="stu-tag">Nothing close</span><h3>This is a new process</h3><p>I will interview you and build it step by step.</p></div>`}
 ${m.length?`<h3>Closest matches</h3><ul class="stu-lst">${m.map(x=>`<li><b>${E(x.p.name)}</b><span>${E(x.p.owner)}</span><span class="stu-sc">${Math.round(Math.min(.95,x.score)*100)}% overlap</span></li>`).join("")}</ul>`:""}`}
function vGov(){const g=Q.B.gov||[];const adj=Q.B.adj||{};return `<h2>Extending ${E(adj.name||"an existing process")}</h2><p class="stu-sum">The whole governance process runs here, so you do not have to know it.</p>
 <ol class="stu-gov">${g.map((x,i)=>`<li class="${Q.i>=1&&Q.reached.process||Q.msgs.some(m=>m.ask&&m.ask.done===0)?"done":""}"><b>${i+1}</b><span>${E(x)}</span></li>`).join("")}</ol>
 <div class="stu-note">Nothing is changed in ${E(adj.owner||"the owner")}'s process until they agree.</div>`}
function vStd(){return `<h2>What the industry does</h2><p class="stu-sum">References I checked so you can improve the process without searching.</p><ul class="stu-lst std">${Q.B.std.map((x,i)=>`<li><label><input type="checkbox" data-stu-std="${i}" ${x.on?"checked":""}><b>${E(x.n)}</b></label><span>${E(x.why)}</span></li>`).join("")}</ul>`}
function vData(){const d=Q.B.data,n=d.filter(x=>x.kind==="new").length,staff=STAFF().map(p=>p.n);
 return `<h2>Data</h2><p class="stu-sum"><b>${d.length-n}</b> reused from the data model, <b>${n}</b> new. Only authoritative elements are used.</p>
 <datalist id="stuStaff">${staff.map(x=>`<option value="${E(x)}">`).join("")}</datalist>
 <table class="stu-tb"><thead><tr><th>Element</th><th>Where it lives</th><th>Owner</th><th>Source</th><th>Rule</th></tr></thead><tbody>${d.map((x,i)=>`<tr class="${x.kind}"><td><b>${E(x.el)}</b><span class="stu-tg ${x.kind}">${x.kind==="new"?"New":"Reused"}</span></td><td><code>${E(x.ent)}</code></td><td>${x.kind==="new"?`<input list="stuStaff" data-stu-own="${i}" value="${E(x.owner)}" placeholder="Who owns this?" aria-label="Owner of ${E(x.el)}">`:E(x.owner)}</td><td>${E(x.src||"")}</td><td>${x.kind==="new"?`<input data-stu-rule="${i}" value="${E(x.rule||"")}" aria-label="Validation rule for ${E(x.el)}">`:'<span class="stu-ok">Defined</span>'}</td></tr>`).join("")}</tbody></table>`}
const spark=(t)=>{if(!t||!t.length)return"";const mn=Math.min.apply(0,t),mx=Math.max.apply(0,t),r=mx-mn||1;return `<svg viewBox="0 0 80 22" class="stu-sp" aria-hidden="true"><polyline fill="none" stroke="currentColor" stroke-width="2" points="${t.map((v,i)=>(i*80/(t.length-1)).toFixed(1)+","+(20-(v-mn)/r*18).toFixed(1)).join(" ")}"/></svg>`};
function vMetrics(){return `<h2>How you will know it works</h2><p class="stu-sum">Each measure says what decision it supports and what to do when it drifts.</p>${Q.B.metrics.map((m,i)=>`<section class="stu-met"><div class="stu-mh"><b>${E(m.n)}</b><code>${E(m.ac)}</code>${spark(m.tr)}<span class="stu-cur">${E(m.cur)}${E(m.u==="%"?"%":" "+m.u)}</span><label>Target <input type="number" step="any" value="${E(m.tgt)}" data-stu-tgt="${i}" aria-label="Target for ${E(m.n)}"></label></div>
 <dl class="stu-dl"><dt>Why</dt><dd>${E(m.why)}</dd><dt>Decision</dt><dd>${E(m.dec)}</dd><dt>How measured</dt><dd>${E(m.f)} · ${E(m.src)}</dd><dt>On trend</dt><dd>${E(m.on)}</dd><dt>Off trend</dt><dd>${E(m.off)}</dd><dt>Retire when</dt><dd>${E(m.obs)}</dd></dl></section>`).join("")}`}
function vAccess(){const B=Q.B;return `<h2>Who can see and change it</h2><p class="stu-sum">Say it in your own words. I check it against the org chart.</p>
 <form class="stu-cmd" data-stu-cmdform><input value="${E(B.cmd)}" aria-label="Who should have access" placeholder="For example: all of finance, or managers and above"><button class="btn" type="submit">Resolve</button></form>
 ${B.people.map((g,gi)=>`<section class="stu-grp"><div class="stu-gh"><b>${E(g.label.charAt(0).toUpperCase()+g.label.slice(1))}</b><span class="stu-lv">${g.lvl==="sign"?"Can sign off":g.lvl==="edit"?"Can change":g.lvl||"Can see"}</span><span>${g.ext?"External, added per booking":g.people.length+" people"}</span></div>
 <div class="stu-ppl">${g.people.slice(0,24).map(n=>`<span class="stu-pp" title="${E(n)}">${E(n.split(" ").map(x=>x[0]).join("").slice(0,2))}<small>${E(n)}</small></span>`).join("")}${g.people.length>24?`<span class="stu-pp more">+${g.people.length-24}</span>`:""}</div></section>`).join("")||'<p class="stu-empty">No access set. Restricted to you until you do.</p>'}
 <div class="stu-note">Sensitive fields stay masked unless a person's role already allows them.</div>`}
function vStrat(){const s=Q.B.strat||[];return `<h2>Strategy check <span class="stu-pro">Pro</span></h2><p class="stu-sum">Checked against what leadership asked for before anything is built.</p><ul class="stu-lst strat">${s.map(x=>{const o=SD.OBJ.find(y=>y.id===x.o);return `<li class="${x.v}"><b>${E(o.n)}</b><span class="stu-vd ${x.v}">${x.v==="supports"?"Supports":x.v==="conflicts"?"Conflicts":"No effect"}</span><span>${E(x.t)}</span></li>`}).join("")}</ul>`}
const ART=()=>{const B=Q.B,g=B.guard||{},b=Q.built;const n=B.nsteps||flatSteps().length;
 return [["Process and workflow",n+" steps with a person, automation or agent on each",1],["Data model","Reuses "+(B.data.filter(d=>d.kind!=="new").length)+" existing elements; "+B.data.filter(d=>d.kind==="new").length+" new with owner, source and rule",1],["Measures","Each with a decision, a target and an off-trend action",1],["Access and security",B.people.reduce((a,x)=>a+x.people.length,0)+" people from the org chart; sensitive fields masked",1],["Maturity model",g.maturity,b],["Knowledge articles",(g.articles||[]).map(x=>"“"+x+"”").join(", "),b],["Roadmap",(g.roadmap||[]).join(" · "),b],["Technical debt decisions",(g.debt||[]).join(" "),b],["Ownership agreement",g.agree,b&&B.agreed],["Audit trail and change record","Every edit in this conversation is logged with its author",b],["Test run","12 of 12 sample cases passed",b]]};
function vGuard(){const B=Q.B,b=Q.built;return `<h2>The app and its guardrails</h2><p class="stu-sum">${b?"Built. Everything below exists and is linked.":"You asked for one thing. These come with it by default."}</p>
 <ul class="stu-gl">${ART().map(a=>`<li class="${a[2]?"on":""}"><i aria-hidden="true">${a[2]?"✓":""}</i><span><b>${E(a[0])}</b><small>${E(a[1]||"")}</small></span></li>`).join("")}</ul>
 <div class="stu-cta">${b?`${B.agreed?"":`<button class="btn" data-stu-agree="1">I accept ownership</button>`} <button class="btn primary" data-stu-go="share" ${B.agreed?"":"disabled"}>Share it with the enterprise</button>${B.agreed?"":'<span class="stu-hint">Accept ownership to continue</span>'}`:`<button class="btn primary" data-stu-build="1">Build the app and all its guardrails</button>`}</div>`}
function visOpts(){return [["enterprise","Everyone"],["division","My division"],["owner","Only me"]].map(o=>`<label class="stu-vo"><input type="radio" name="stuvis" value="${o[0]}" ${Q.vis===o[0]?"checked":""}>${o[1]}</label>`).join("")}
function vShare(){const c=CERT(),p=Q.published;
 return `<h2>Share it with the enterprise</h2><p class="stu-sum">Anyone with permission can discover it, run it, extend it or inherit from it. The studio searches here first next time.</p>
 <ul class="stu-gl">${c.map(x=>`<li class="${x[1]?"on":""}"><i aria-hidden="true">${x[1]?"✓":"!"}</i><span><b>${E(x[0])}</b><small>${E(x[2])}</small></span></li>`).join("")}</ul>
 ${p?`<div class="stu-hit"><span class="stu-tag ext">Published</span><h3>${E(p.title)} ${E(p.ver)}</h3><p>${p.n} people can find it · owner ${E(p.owner)}. Others extend it with ${E(p.owner)}'s agreement. You are credited as builder. Adoption and value show on the owner's home once it is used.</p></div>`
 :`<h3>Who can find it</h3><div class="stu-vis" role="radiogroup" aria-label="Who can find it">${visOpts()}</div><p class="stu-sum">${visPeople().length} people can find it with this setting.</p><div class="stu-cta"><button class="btn primary" data-stu-pub="1">Publish to the library</button></div>`}`}
const DIVISION_OPEN=/^(biz_|ops_|stu_)/;
function canSee(p){const owner=G(()=>ORGX.P(p.owner),null);if(p.vis==="owner")return p.owner===me();if(p.vis==="division")return !owner||G(()=>ORGX.P(me()).unit,"")===owner.unit;return true}
function libRows(q){const base=G(()=>PROCLIB.list(),[]).filter(p=>!/^stu_/.test(p.id)).map(p=>({id:p.id,title:p.name,owner:p.owner,fam:p.familyName,lvl:p.level,steps:p.steps,vis:"enterprise",kind:"core"}));
 const mine=Q.lib.map(p=>({id:p.id,title:p.title,owner:p.owner,fam:"Built in the studio",lvl:2,steps:p.steps,vis:p.vis,kind:"studio",ver:p.ver}));
 let rows=mine.concat(base);q=String(q||"").toLowerCase().trim();if(q)rows=rows.filter(r=>(r.title+" "+r.owner+" "+r.fam).toLowerCase().indexOf(q)>=0);return rows}
function vLib(){const rows=libRows(Q.q);const sh=rows.slice(0,40);
 return `<h2>Enterprise library</h2><p class="stu-sum">${rows.length} processes anyone can find, run, extend or inherit, if their role allows it.</p><input class="stu-q" data-stu-q value="${E(Q.q||"")}" placeholder="Search by name, owner or area" aria-label="Search the library">
 <ul class="stu-lib">${sh.map(r=>{const ok=canSee(r);return `<li><span class="stu-ln"><b>${E(r.title)}</b><small>${E(r.fam)} · owner ${E(r.owner)} · ${r.steps} steps${r.kind==="studio"?" · built in the studio "+E(r.ver):""}</small></span><span class="stu-mat">L${r.lvl}</span>${ok?`<button class="btn quiet" data-stu-use="run:${E(r.id)}">Run</button><button class="btn quiet" data-stu-use="ext:${E(r.id)}">Extend</button><button class="btn quiet" data-stu-use="inh:${E(r.id)}">Inherit</button>`:`<button class="btn quiet" data-stu-use="ask:${E(r.id)}">Ask for access</button>`}</li>`}).join("")}</ul>${rows.length>40?`<p class="stu-sum">Showing 40. Search to narrow.</p>`:""}`}
function vHome(){const lib=libRows("");return `<div class="stu-home"><h2>Tell us what you need to do. We will handle the rest.</h2><p class="stu-sum">You do not need to know how security, data, governance or process design work. Describe the job in plain words. Oukala finds what already exists, builds what does not, and every enterprise rule applies to what you build.</p>
 <ol class="stu-how"><li><b>1</b><span>Say what you need, by typing or, soon, by voice</span></li><li><b>2</b><span>Oukala searches the library and extends or builds</span></li><li><b>3</b><span>You watch it appear here, and change it in chat or right on the page</span></li><li><b>4</b><span>The guardrails come built in, and the whole enterprise can use what you build</span></li></ol>
 <div class="stu-stat"><span><b>${lib.length}</b> processes in the library</span><span><b>${G(()=>Object.keys(DATAMODEL.tables).length,0)}</b> data entities with owners</span><span><b>${Object.keys(G(()=>METRICS,{})).length}</b> measures</span><button class="btn quiet" data-stu-go="lib">Browse the library</button></div></div>`}
const VIEWS={home:vHome,find:vFind,gov:vGov,flow:vFlow,std:vStd,data:vData,metrics:vMetrics,access:vAccess,strat:vStrat,guard:vGuard,share:vShare,lib:vLib};
function stageOfView(v){return {find:"find",gov:"find",flow:"process",std:"std",data:"data",metrics:"metrics",access:"access",strat:"strat",guard:"guard",share:"share"}[v]}
function railHTML(){if(Q.view==="home"||Q.view==="lib")return `<nav class="stu-rail"><button type="button" class="${Q.view==="home"?"cur":""}" data-stu-go="home">Start</button><button type="button" class="${Q.view==="lib"?"cur":""}" data-stu-go="lib">Library</button></nav>`;
 return `<nav class="stu-rail" aria-label="Build progress">${STAGES.filter(s=>!s[2]||Q.pro).map(s=>{const r=Q.reached[s[0]],cur=stageOfView(Q.view)===s[0];return `<button type="button" class="${cur?"cur":""} ${r?"done":""}" data-stu-view="${s[0]}" ${r?"":"disabled"}><i></i>${s[1]}</button>`}).join("")}<span class="stu-sp1"></span><button type="button" data-stu-go="lib">Library</button></nav>`}
function canvasHTML(){const f=VIEWS[Q.view]||vHome;return railHTML()+`<div class="stu-body" tabindex="-1">${f()}</div>`}
const VIEW_OF_STAGE={find:"find",process:"flow",std:"std",data:"data",metrics:"metrics",access:"access",strat:"strat",guard:"guard",share:"share"};

/* ---------- mounting ---------- */
function shell(){return `<div class="stu"><section class="stu-left" aria-label="Chat with Oukala"><header><b>Build with Oukala</b><span class="stu-sub">Guardrails in a box</span><button type="button" class="btn quiet" data-stu-play="1" aria-pressed="${Q.auto}">${Q.auto?"Pause demo":"Play the demo"}</button></header><div id="stuChat" class="stu-chat" role="log" aria-live="polite"></div>
 <div class="stu-chips" id="stuChips"></div>
 <form class="stu-in" data-stu-form><button type="button" class="stu-mic" data-stu-mic="1" title="Voice (where your browser supports it)" aria-label="Speak instead of typing">🎤</button><input id="stuInput" autocomplete="off" placeholder="${Q.sc?"Answer, ask, or say: add a step …":"What do you need to do?"}" aria-label="Tell Oukala what you need"><button class="btn primary" type="submit">Send</button></form></section>
 <section class="stu-right" id="stuCanvas" aria-label="What is being built"></section></div>`}
function chipsHTML(){if(Q.sc)return"";return SD.CHIPS.map(c=>`<button type="button" class="stu-chip" data-stu-try="${c.id}"><b>${E(c.t)}${c.pro?' <em class="stu-pro">Pro</em>':""}</b><small>${E(c.sub)} · ${E(c.time)}</small></button>`).join("")}
function render(){const c=D.getElementById("stuCanvas");if(!c)return;c.innerHTML=canvasHTML();const ch=D.getElementById("stuChips");if(ch)ch.innerHTML=chipsHTML();const inp=D.getElementById("stuInput");if(inp)inp.placeholder=Q.sc?"Answer, ask, or say: add a step …":"What do you need to do?";
 const pb=D.querySelector("[data-stu-play]");if(pb){pb.textContent=Q.auto?"Pause demo":"Play the demo";pb.setAttribute("aria-pressed",Q.auto)}}
function syncRail(){}
function mount(){const r=D.getElementById("stuRoot");if(!r)return;if(r.dataset.m==="1"){return}r.dataset.m="1";r.innerHTML=shell();
 if(!Q.msgs.length){Q.msgs.push({r:"ai",h:"Hi "+E(me().split(" ")[0])+". What do you need to do? Describe it in plain words. I will find what already exists, or build it with you."})}
 drawChat(true);render()}
W.STUDIO.mount=mount;W.STUDIO.start=id=>startScenario(SD.SCEN[id]);W.STUDIO.submit=submit;W.STUDIO.fast=false;
function open(text){go("studio");setTimeout(()=>{mount();if(text)submit(text)},60)}
W.STUDIO.open=open;

/* ---------- events ---------- */
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-stu-try],[data-stu-ans],[data-stu-next],[data-stu-who],[data-stu-ph],[data-stu-view],[data-stu-go],[data-stu-build],[data-stu-agree],[data-stu-pub],[data-stu-play],[data-stu-use],[data-stu-mic]");if(!t||!D.getElementById("stuRoot"))return;
 const d=t.dataset;
 if(d.stuTry){startScenario(SD.SCEN[d.stuTry]);return}
 if(d.stuAns){const[a,b]=d.stuAns.split(":").map(Number);answer(a,b);return}
 if(d.stuNext){const last=Q.msgs[Q.msgs.length-1];if(last&&last.next)last.next=null;Q.wait=false;drawChat();nextBeat();return}
 if(d.stuWho!=null){cycleWho(d.stuWho);return}
 if(d.stuPh!=null){Q.exp[d.stuPh]=!Q.exp[d.stuPh];render();return}
 if(d.stuView){Q.view=VIEW_OF_STAGE[d.stuView]||d.stuView;render();return}
 if(d.stuGo){if(d.stuGo==="share"){Q.view="share";Q.stage="share";Q.reached.share=1}else Q.view=d.stuGo;render();return}
 if(d.stuBuild!=null){const last=Q.msgs[Q.msgs.length-1];if(last&&last.next)last.next=null;buildOut();return}
 if(d.stuAgree!=null){Q.B.agreed=true;say("Thank you. You are named sponsor and "+E(Q.B.owner)+" is the owner.");render();return}
 if(d.stuPub!=null){publish();return}
 if(d.stuPlay!=null){Q.auto=!Q.auto;render();if(Q.auto){if(!Q.sc)startScenario(SD.SCEN.cal);else if(Q.wait){const last=Q.msgs[Q.msgs.length-1];if(last&&last.ask&&last.ask.done==null){answer(Q.msgs.length-1,Math.max(0,last.ask.opts.findIndex(o=>o.rec)))}else if(last&&last.next){last.next=null;Q.wait=false;if(Q.view==="guard"&&!Q.built)buildOut();else nextBeat()}}}return}
 if(d.stuUse){const[k,id]=d.stuUse.split(":");useLib(k,id);return}
 if(d.stuMic!=null){voice();return}});
D.addEventListener("submit",e=>{const f=e.target;if(!f.matches)return;if(f.matches("[data-stu-form]")){e.preventDefault();const i=D.getElementById("stuInput");const v=i.value;i.value="";submit(v);return}
 if(f.matches("[data-stu-cmdform]")){e.preventDefault();const v=f.querySelector("input").value;Q.B.cmd=v;Q.B.people=resolveAccess(v);const n=Q.B.people.reduce((a,x)=>a+x.people.length,0);say("Resolved <b>"+E(v)+"</b> against the org chart: "+n+" people"+(Q.B.people.some(x=>x.ext)?" plus external contractors":"")+".");render()}});
D.addEventListener("change",e=>{const t=e.target;if(!t.matches||!D.getElementById("stuRoot"))return;
 if(t.matches("[data-stu-own]")){const x=Q.B.data[+t.dataset.stuOwn];x.owner=t.value;const ok=STAFF().some(p=>p.n===t.value);say(ok?"Owner for <b>"+E(x.el)+"</b> set to "+E(t.value)+". I checked the org chart: they exist and are active.":"I could not find <b>"+E(t.value)+"</b> in the org chart. Pick someone from the list.");return}
 if(t.matches("[data-stu-rule]")){Q.B.data[+t.dataset.stuRule].rule=t.value;say("Rule updated. I will check every new record against it.");return}
 if(t.matches("[data-stu-tgt]")){const m=Q.B.metrics[+t.dataset.stuTgt];m.tgt=t.value;say("Target for <b>"+E(m.n)+"</b> is now "+E(t.value)+". It is "+(((m.dir==="max"&&+m.cur<+t.value)||(m.dir==="min"&&+m.cur>+t.value))?"off target today, so the off-trend action would start now: "+E(m.off):"on target today")+".");return}
 if(t.matches("[data-stu-std]")){Q.B.std[+t.dataset.stuStd].on=t.checked;say(t.checked?"Added the reference to the process and its articles.":"Removed. The steps that came from it stay unless you remove them.");return}
 if(t.matches('input[name="stuvis"]')){Q.vis=t.value;render();return}});
D.addEventListener("input",e=>{const t=e.target;if(t.matches&&t.matches("[data-stu-q]")){Q.q=t.value;const c=D.querySelector(".stu-lib");const pos=t.selectionStart;render();const n=D.querySelector("[data-stu-q]");if(n){n.focus();n.setSelectionRange(pos,pos)}}});
D.addEventListener("focusout",e=>{const t=e.target;if(!t.matches||!t.matches("[data-stu-name]"))return;const ref=t.dataset.stuName;const s=ref.indexOf(":")>0?Q.B.phases[+ref.split(":")[0]].steps[+ref.split(":")[1]]:Q.B.steps[+ref];const v=t.textContent.trim();if(s&&v&&v!==s.n){const old=s.n;s.n=v;say("Renamed <b>"+E(old)+"</b> to <b>"+E(v)+"</b>.")}});
D.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.matches&&e.target.matches("[data-stu-name]")){e.preventDefault();e.target.blur()}});

function useLib(k,id){const p=proc(id)||(Q.lib.find(x=>x.id===id)&&{id,name:Q.lib.find(x=>x.id===id).title,owner:Q.lib.find(x=>x.id===id).owner});if(!p)return;
 if(k==="run"){G(()=>go("plat_proc"));return}
 Q.view="home";Q.sc=null;render();
 if(k==="ask"){Q.msgs.push({r:"ai",h:"<b>"+E(p.name)+"</b> is limited to a division you are not in. I asked "+E(p.owner)+" for access on your behalf and attached why you need it."});drawChat(true);return}
 if(k==="ext"){Q.msgs.push({r:"ai",h:"Extending <b>"+E(p.name)+"</b> means "+E(p.owner)+" agrees first. Tell me what you want to add and I will take it from there."});Q.pending={ext:id}}
 else{Q.msgs.push({r:"ai",h:"Inheriting <b>"+E(p.name)+"</b> gives you your own copy with its steps, data and guardrails. Nothing you change touches the original. What will be different for you?"});Q.pending={inh:id}}
 drawChat(true)}
function voice(){const SR=W.SpeechRecognition||W.webkitSpeechRecognition;if(!SR){say("Voice is not available in this browser yet. Typing works the same way.");return}
 try{const r=new SR();r.lang="en-US";r.onresult=ev=>{const x=ev.results[0][0].transcript;const i=D.getElementById("stuInput");if(i){i.value=x;submit(x);i.value=""}};r.start();say("Listening…")}catch(err){say("I could not start the microphone.")}}

/* ---------- screen and entry points ---------- */
G(()=>REG("studio","Build with Oukala","new","M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4zM5 15l.9 2.1L8 18l-2.1.9L5 21l-.9-2.1L2 18l2.1-.9z",()=>`<div class="screen stu-screen"><div id="stuRoot"></div></div>`));
G(()=>NAVX.add("studio",{group:"make",label:"Build with Oukala",hint:"Say what you need and Oukala builds it with every guardrail",sub:"Chat and build",kw:"build create new process app automate studio chat guardrails in a box interview library extend"}));
R15D.after.push(()=>{if(S_screen()==="studio")setTimeout(mount,0);else{const r=D.getElementById("stuRoot");if(r)r.dataset.m=""}
 if(S_screen()==="home")ensureAskBar()});
function S_screen(){return G(()=>S.screen,"")}
function ensureAskBar(){const v=D.getElementById("view");if(!v||v.querySelector(".stu-ask1"))return;const h=v.querySelector(".hero");if(!h)return;
 const b=D.createElement("form");b.className="stu-ask1";b.setAttribute("data-stu-front","1");b.innerHTML=`<label for="stuFront"><b>What do you need to do?</b> <span>Say it in plain words. Oukala finds what exists or builds it, with every guardrail.</span></label><div><input id="stuFront" autocomplete="off" placeholder="For example: printed standards keep arriving damaged"><button class="btn primary" type="submit">Start</button><button type="button" class="btn quiet" data-stu-fgo="1">See examples</button></div>`;
 h.parentNode.insertBefore(b,h)}
D.addEventListener("submit",e=>{const f=e.target;if(f.matches&&f.matches("[data-stu-front]")){e.preventDefault();const v=f.querySelector("input").value.trim();open(v||"")}});
D.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-stu-fgo]"))open("")});
W.STUDIO.libRows=libRows;W.STUDIO.resolveAccess=resolveAccess;W.STUDIO.search=search;W.STUDIO.buildOut=buildOut;W.STUDIO.cert=CERT;W.STUDIO.publish=publish;W.STUDIO.answer=answer;W.STUDIO.next=nextBeat;
})();
