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
/* step kinds come from STEPMODE (R21 to R24, CL-58): human, robot, agent, plus the approval gate. "auto" and "fn" in saved data read as robot. */
const SMK=v=>W.STEPMODE?STEPMODE.of(v):(v||"human");
const SML=k=>W.STEPMODE?STEPMODE.label(k):k;
const WHO={human:[SML("human"),"h sm-human"],robot:[SML("robot"),"f sm-robot"],agent:[SML("agent"),"g sm-agent"],gate:[SML("gate"),"k sm-gate"]};WHO.auto=WHO.fn=WHO.robot;
const ORDER=["human","robot","agent","gate"];
const STP=()=>W.STEPKIT||null;
/* every step on the canvas holds a canonical kind, a real owner and, for robot and agent steps, a trigger (CL-73) */
function normStep(s,prev){if(!s||typeof s!=="object")return s;const k=SMK(s.who);if(s.who!==k)s.who=k;const P=STP();
 if(P){s.owner=s.base?s.owner:P.ownerFor(k,s.owner);if(prev&&!s.prev)s.prev=prev.n+" is done";P.ensureTrig(s)}return s}
function normAll(){const B=Q.B;if(!B)return;const L=B.phases?B.phases.reduce((a,p)=>a.concat(p.steps),[]):B.steps||[];L.forEach((s,i)=>normStep(s,L[i-1]))}
const GROUPS=["Design","Connect","Govern","Prove","Ship"];
const STAGES=[["find","Find","Design"],["process","Process","Design"],["std","Standards","Design"],["agents","Agents","Design"],["data","Data","Connect"],["metrics","Measures","Connect"],["access","Access","Connect"],["strat","Strategy","Govern",1],["maturity","Maturity","Govern"],["bcp","Continuity","Govern"],["guard","Guardrails","Prove"],["test","Test","Prove"],["ux","UX and 508","Prove"],["approve","Approval","Ship"],["share","Share","Ship"]];
const VIEW_OF_STAGE={find:"find",process:"flow",std:"std",agents:"agents",data:"data",metrics:"metrics",access:"access",strat:"strat",maturity:"maturity",bcp:"bcp",guard:"guard",test:"test",ux:"ux",approve:"approve",share:"share"};
const STAGE_OF_VIEW={gov:"find",flow:"process",stdstep:"std",datamap:"data",perm:"access"};
const OWN={ret:["Kofi Mensah","Tomas Reyes"],cal:["Mei-Ling Zhou","Dmitri Kowal"],bundle:["Lena Hargrove","Daniel Okoye"],turn:["Dmitri Kowal","Sofia Arenas"]};
const MODULE={ret:"ops_dist",cal:"ops_plant",bundle:"ops_cust",turn:"ops_plant",gen:"biz_corp"};

/* ---------- state ---------- */
const X={views:{}};const Q=W.STUDIO={x:X,sc:null,i:-1,msgs:[],B:null,view:"home",stage:"find",reached:{},auto:false,wait:false,timers:[],lib:[],pro:false,exp:{},built:false,published:null,open:{},vis:"enterprise",scale:false,sel:null,ph:0,zoom:1,seen:new Set()};
const fresh=()=>({title:"",steps:[],phases:null,issues:[],std:[],data:[],metrics:[],cmd:"",grants:[],people:[],strat:null,guard:null,match:[],adj:null,add:[],agreed:false,owner:"",log:[]});
Q.B=fresh();Q.beats=[];

/* ---------- search the library ---------- */
const STOP=/\b(i|we|to|the|a|an|and|or|of|for|my|our|want|need|help|me|how|is|are|that|it|this|with|on|in|by|can|keep|so|nobody|knows|why)\b/g;
const toks=s=>String(s||"").toLowerCase().replace(STOP," ").replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(x=>x.length>2).map(x=>x.replace(/(ing|ed|es|s)$/,""));
function search(q){const t=toks(q);if(!t.length)return[];const list=G(()=>PROCLIB.list(),[]);
 return list.map(p=>{const h=toks([p.name,p.familyName,p.owner].join(" ")),n=t.filter(x=>h.some(y=>y.indexOf(x)===0||x.indexOf(y)===0)).length;return{p,score:n/Math.max(2,Math.min(t.length,5))}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3)}
const proc=id=>G(()=>PROCLIB.list().find(p=>p.id===id),null);

/* ---------- org chart: turn a spoken group into real people ---------- */
const STAFF=()=>G(()=>ORGX.staff,[]);
const kidsOf=n=>G(()=>ORGX.kids(n).length,0);
const GRP=[
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
 let set=null,lab=[];GRP.forEach(([re,fn])=>{if(re.test(t)){const x=s.filter(fn).map(p=>p.n);set=set?Array.from(new Set(set.concat(x))):x;lab.push(c.trim())}});
 if(set===null)return{label:c.trim(),people:[],none:true};
 if(/manager(s)?( or| and)? above|managers and above|lead(s)? and above|and above/.test(t))set=set.filter(n=>kidsOf(n)>0||/chief|director|manager|lead/i.test((G(()=>ORGX.P(n).role,""))));
 return{label:c.trim().replace(/\s+(can|only|may|should).*$/i,""),people:set}}
function resolveAccess(cmd,grants){const parts=String(cmd).split(/[.;]|\sand\s(?=[a-z]+ (?:can|only))/i).map(x=>x.trim()).filter(Boolean);const out=[];
 parts.forEach((cl,i)=>{const lvl=/sign|approve/i.test(cl)?"sign":/edit|change|run|manage/i.test(cl)?"edit":"view";
  const groups=cl.split(/\s+(?:and|,)\s+/i).filter(x=>x.length>2);
  (groups.length?groups:[cl]).forEach(g=>{const r=resolveClause(g.replace(/\b(can|may|should)\b.*$/i,"").replace(/^only\s+/i,""));if(!r.none||groups.length===1){r.lvl=(grants&&grants[out.length]&&grants[out.length].lvl)||lvl;r.label=r.label.charAt(0).toUpperCase()+r.label.slice(1);r.on=true;out.push(r)}})});
 return out}

/* ---------- chat: the conversation lives in the assistant box at the bottom right; this screen is the canvas ---------- */
const CXr=()=>W.CHATX||{};
function say(html,cls,list){const pend=Q.msgs.find(m=>m.next);const o={r:"ai",h:html,c:cls||""};if(list)o.list=list;Q.msgs.push(o);
 if(pend){const lab=pend.next;pend.next=null;Q.msgs.push({r:"ai",h:"",next:lab})}drawChat(true);return o}
function you(t){Q.msgs.push({r:"me",h:E(t),dock:Q.dockEcho?1:0});drawChat(true)}
function later(fn,ms){const t=setTimeout(fn,Q.fast?10:Math.round(ms*(Q.spd||1)));Q.timers.push(t);return t}
function clearTimers(){Q.timers.forEach(clearTimeout);Q.timers=[];Q.busy=false;Q.queued=false;Q.typing=false}
/* DC-01: while a message is typing (or a beat is still playing out), Next is queued and runs once the beat settles, never twice */
function busy(){return !!(Q.typing||Q.busy)}
function queueIfBusy(){if(busy()){Q.queued=true;return true}return false}
function optLabels(m){const o=m.ask.opts.map((x,i)=>({l:x.l,r:x.rec?1:0,i}));o.sort((a,b)=>b.r-a.r);return o.map(x=>x.l)}
function ensureThread(title){const C=CXr();if(!C.newThread)return null;if(Q.thread&&C.hasThread(Q.thread.id)&&!title){C.activate(Q.thread.id);return Q.thread}
 Q.thread=C.newThread(title||"VibeCheck",{studio:1});Q.mi=0;Q.lastCxm=null;return Q.thread}
function drawChat(scroll){const C=CXr(),t=Q.thread;if(!t||!C.sayAI)return;let last=Q.lastCxm||null;
 for(;Q.mi<Q.msgs.length;Q.mi++){const m=Q.msgs[Q.mi];
  if(m.r==="me"){if(!m.dock)C.pushMsg({me:1,t:m.h},t)}
  else if(m.ask){m.cxm=last=C.sayAI(t,"<b>"+E(m.ask.q)+"</b>",{stream:false,lin:false,sugg:optLabels(m)})}
  else if(m.next){m.hadNext=1;if(last){last.sugg=[m.next];m.cxm=last}else m.cxm=last=C.sayAI(t,"Pick it up when you are ready.",{stream:false,lin:false,sugg:[m.next]})}
  else if(m.h){let h=m.h;if(m.list)h+="<ol>"+m.list.map(l=>"<li>"+E(l)+"</li>").join("")+"</ol>";last=C.sayAI(t,h,{stream:false,lin:false,sugg:m.sugg||null})}}
 Q.lastCxm=last;
 Q.msgs.forEach(m=>{if(m.cxm&&((m.ask&&m.ask.done!=null)||(m.hadNext&&!m.next)))m.cxm.sugg=null});
 C.drawMsgs&&C.drawMsgs();afterDraw()}
/* typed or tapped in the assistant box while this build is the active conversation */
/* Build is a mode of a thread. Answers and Continue go to the build. Anything else in a live build asks first. */
const BUILD_RX=/^(please\s+)?(help me\s+)?(build|create|make|design|automate|set up)\b|\b(i|we) (need|want) (to )?(build|automate|a way to|an? (app|process|workflow|form|tracker))\b|\bbuild (me |us )?(an?|the|this)\b/i;
const OFFER_RX=/\b(build|automate)\b|\b(create|design|set up)\b.*\b(app|workflow|process|form|approval|tracker|checklist|calculator|portal|automation|procedure)\b/i;
function buildLive(){return !!Q.sc&&!Q.exited&&!!Q.thread}
function dropMsgs(t,list){list.forEach(m=>{const i=t.msgs.indexOf(m);if(i>=0)t.msgs.splice(i,1)})}
function holdAsk(q,t,kind){const C=CXr();const me=C.pushMsg({me:1,t:E(q)},t);
 const labs=kind==="offer"?["Build this in VibeCheck","Just answer"]:["Part of the build","Ask the assistant"];
 const txt=kind==="offer"?"That sounds like something to build. Build it here with every guardrail, or just answer it?":"Is that part of the build, or a question for the assistant?";
 Q.hold={q,kind,t,me,ai:null,labs};const ai=C.sayAI(t,txt,{stream:false,lin:false,sugg:labs});Q.hold.ai=ai;C.drawMsgs&&C.drawMsgs()}
function resolveHold(n){const h=Q.hold;if(!h)return false;const C=CXr();
 const L=h.labs.map(x=>x.toLowerCase().replace(/[^a-z0-9 ]/g,"").trim());const j=L.indexOf(n);if(j<0)return false;
 Q.hold=null;h.ai.sugg=null;
 if(j===0){ /* build */
  if(h.kind==="offer"){C.sayAI(h.t,"Opening VibeCheck.",{stream:false,lin:false});open(h.q)}
  else{dropMsgs(h.t,[h.me,h.ai]);buildRoute(h.q)}
 }else{dropMsgs(h.t,[h.me,h.ai]);C.handle(h.q,{nohook:1})}
 C.drawAll&&C.drawAll();return true}
function buildRoute(q){const C=CXr();C.pushMsg({me:1,t:E(q)},Q.thread);Q.dockEcho=true;
 try{const norm=x=>String(x).toLowerCase().replace(/[^a-z0-9 ]/g,"").trim();const n=norm(q);
  const ai=Q.msgs.map((m,i)=>[m,i]).reverse().find(x=>x[0].ask&&x[0].ask.done==null);
  if(ai){const opts=ai[0].ask.opts;let j=opts.findIndex(o=>norm(o.l)===n);if(j<0&&/^[1-9]$/.test(n))j=+n-1;if(j<0)j=opts.findIndex(o=>norm(o.l).indexOf(n)===0&&n.length>3);
   if(j>=0&&j<opts.length){answer(ai[1],j);return true}
   if(/^(yes|ok|okay|go|sure|recommended|your pick)$/.test(n)){answer(ai[1],Math.max(0,opts.findIndex(o=>o.rec)));return true}}
  const pend=Q.msgs.slice().reverse().find(m=>m.next);
  if(pend&&(norm(pend.next)===n||/^(continue|next|go on|go|yes|ok|okay|sure)$/.test(n))){if(queueIfBusy())return true;const lab=pend.next;pend.next=null;Q.wait=false;if(/^build the app/i.test(lab)&&!Q.built)buildOut();else nextBeat();return true}
  submit(q);return true}finally{Q.dockEcho=false}}
function isChipOrAnswer(q){const norm=x=>String(x).toLowerCase().replace(/[^a-z0-9 ]/g,"").trim();const n=norm(q);
 const ai=Q.msgs.find(m=>m.ask&&m.ask.done==null);
 if(ai){const o=ai.ask.opts;if(o.some(x=>norm(x.l)===n)||/^[1-9]$/.test(n)||/^(yes|ok|okay|go|sure|recommended|your pick)$/.test(n))return true}
 const pend=Q.msgs.find(m=>m.next);if(pend&&(norm(pend.next)===n||/^(continue|next|go on|go|yes|ok|okay|sure)$/.test(n)))return true;
 return SD.CHIPS.some(c=>norm(c.t)===n)}
function onChat(q){const C=CXr();const norm=x=>String(x).toLowerCase().replace(/[^a-z0-9 ]/g,"").trim();
 if(Q.hold&&C.cur&&C.cur().id===Q.hold.t.id&&resolveHold(norm(q)))return true;
 const inBuild=Q.thread&&C.cur&&C.cur().id===Q.thread.id&&D.getElementById("stuRoot");
 if(!inBuild){ /* general chat: offer, never switch on its own */
  if(OFFER_RX.test(q)&&!/^(what|who|where|when|why|show|find|list|open|go to)\b/i.test(q.trim())&&C.cur){holdAsk(q,C.cur(),"offer");return true}
  return false}
 if(!Q.sc||Q.exited&&!Q.sc)return buildRoute(q);
 if(Q.exited)return buildRoute(q);
 if(isChipOrAnswer(q)||BUILD_RX.test(q.trim()))return buildRoute(q);
 holdAsk(q,Q.thread,"unclear");return true}
/* the slim strip in the box, and the Continue chip that survives a side question */
function pendingChips(){const ai=Q.msgs.find(m=>m.ask&&m.ask.done==null);if(ai)return optLabels(ai);const p=Q.msgs.find(m=>m.next);return p?[p.next]:[]}
function afterDraw(){const C=W.CHATX;if(!C||!C.cur)return;const ctx=D.getElementById("chxCtx");if(!ctx)return;let st=D.getElementById("stuStrip");
 const live=buildLive();
 if(!live){if(st)st.remove();return}
 const t=C.cur(),inThread=Q.thread&&t.id===Q.thread.id,onScr=S_screen()==="studio";
 if(!st){st=D.createElement("div");st.id="stuStrip";st.className="stu-strip";ctx.parentNode.insertBefore(st,ctx)}
 /* PH-10: the close control sits top right on its own, never inline after Back to build (same pattern as #drawer>.dctl .closebtn) */
 const html='<span class="stx-d" aria-hidden="true"></span><span class="stx-t">Building: <b>'+E(Q.sc.title)+'</b></span>'+((inThread&&onScr)?'':'<button type="button" class="stx-b stx-back" data-stu-back>Back to build</button>')+'<button type="button" class="stx-b quiet stx-x" data-stu-exit aria-label="'+((inThread&&onScr)?"Exit the build":"Close the build bar")+'">'+((inThread&&onScr)?"Exit build":"Close")+'</button>';
 if(st.dataset.h!==html){st.dataset.h=html;st.innerHTML=html}
 C.drawSugs&&C.drawSugs()}
function fixChips(t){if(!buildLive()||Q.hold||!Q.thread||t.id!==Q.thread.id)return;const want=pendingChips();const last=t.msgs[t.msgs.length-1];
 if(want.length&&last&&last.ai){const cur=last.sugg||[];if(!want.every(w=>cur.indexOf(w)>=0))last.sugg=want.concat(cur.filter(c=>want.indexOf(c)<0)).slice(0,6)}}
function wireChat(){if(W.CHATX){W.CHATX.afterDraw=afterDraw;W.CHATX.preSugs=fixChips}}
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-stu-back],[data-stu-exit]");if(!t)return;const C=W.CHATX;
 if(t.hasAttribute("data-stu-back")){Q.exited=false;go("studio");setTimeout(()=>{mount();if(C&&Q.thread)C.activate(Q.thread.id);afterDraw()},60)}
 else{clearTimers();Q.exited=true;Q.wait=false;if(S_screen()==="studio")go("home");setTimeout(afterDraw,80);if(C&&C.drawSugs)C.drawSugs()}});
if(W.CHATX)W.CHATX.hook=onChat;
else document.addEventListener("DOMContentLoaded",()=>{if(W.CHATX)W.CHATX.hook=onChat});
[500,1500,4000].forEach(t=>setTimeout(()=>{if(W.CHATX&&W.CHATX.hook!==onChat)W.CHATX.hook=onChat;wireChat()},t));wireChat();

/* ---------- running a scenario ---------- */
function startScenario(sc,promptText){
 clearTimers();Q.exited=false;Q.autoFit=true;Q.sc=sc;Q.i=-1;Q.B=fresh();Q.B.title=sc.title;Q.B.sc=sc.id;Q.msgs=[];Q.mi=0;ensureThread(sc.title);Q.reached={};Q.cpDone={};Q.peek=null;Q.built=false;Q.published=null;Q.exp={};Q.sel=null;Q.ph=0;Q.zoom=1;Q.seen=new Set();Q.pro=!!sc.pro;Q.scale=sc.kind==="scale";Q.stage="find";Q.view="find";Q.beats=X.beatsFor?X.beatsFor(sc,sc.beats.slice()):sc.beats;
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

 if(b.run)G(()=>b.run(b));render();syncRail()}
/* guided demo: where a person clicks, and how long a screen is held */
const CP_VIEWS=["agents","perm","maturity","guard","test","ux","approve"];
function isCP(b){return !!(b&&(b.ask||CP_VIEWS.indexOf(b.view)>=0))}
function dwellFor(b,txt){const words=String(txt||"").replace(/<[^>]+>/g," ").split(/\s+/).filter(Boolean).length;return Math.max(4000,1500+words*330,b.hold||0)}
function advance(){if(queueIfBusy())return;const p=Q.msgs.find(m=>m.next);if(p)p.next=null;Q.wait=false;Q.peek=null;nextBeat()}
function kick(){if(Q.sc&&queueIfBusy())return;if(!Q.sc||!Q.wait)return;const last=Q.msgs[Q.msgs.length-1];
 if(last&&last.ask&&last.ask.done==null){answer(Q.msgs.length-1,Math.max(0,last.ask.opts.findIndex(o=>o.rec)))}
 else{const p=Q.msgs.slice().reverse().find(m=>m.next);if(p){const lab=p.next;p.next=null;Q.wait=false;if(/^build the app/i.test(lab)&&!Q.built)buildOut();else nextBeat()}}}
const CTA={agents:"[data-r26-agents]",perm:"[data-r26-comp]",test:"[data-r26-run],[data-r26-fixall]",ux:"[data-r26-run],[data-r26-fixux]",approve:"[data-stu-agree],[data-r26-submit],[data-stu-pub]"};
function pulse(){D.querySelectorAll(".stu-pulse").forEach(e=>e.classList.remove("stu-pulse"));
 if(!buildLive()||Q.auto||Q.fast||!Q.wait||S_screen()!=="studio")return;const b=Q.beats[Q.i];
 const sel=b&&CTA[b.view];if(sel&&!(Q.cpDone&&Q.cpDone[Q.i])){const el=[...D.querySelectorAll("#stuCanvas "+sel.split(",").join(",#stuCanvas "))].find(e=>!e.disabled&&e.offsetParent);if(el){el.classList.add("stu-pulse");return}}
 const chip=D.querySelector("#sugs .chip");if(chip)chip.classList.add("stu-pulse")}
function nextBeat(){if(!Q.sc)return;Q.wait=false;const sc=Q.sc;Q.i++;const b=Q.beats[Q.i];
 if(!b){Q.busy=false;Q.queued=false;finish();return}
 Q.busy=true;
 applyBeat(b);
 const msgs=(typeof b.say==="function"?b.say():b.say).slice();const allTxt=msgs.join(" ");Q.peek=null;
 const step=()=>{const m=msgs.shift();if(m==null){after();return}
  Q.typing=true;drawChat(true);later(()=>{Q.typing=false;const o={r:"ai",h:m};if(!msgs.length&&b.view==="gov"&&b.steps)o.list=b.steps;Q.msgs.push(o);drawChat(true);step()},Q.fast?10:650)};
 const after=()=>{const cp=isCP(b),idx=Q.i,dw=dwellFor(b,allTxt);
  const live=()=>Q.i===idx&&Q.wait;
  if(b.ask){Q.msgs.push({r:"ai",h:"",ask:{q:b.ask.q,opts:b.ask.opts,done:null}});Q.wait=true;drawChat(true);if(Q.auto)later(()=>{if(live()&&Q.auto)answer(Q.msgs.length-1,Math.max(0,b.ask.opts.findIndex(o=>o.rec)))},Math.max(dw,b.holdAsk||0))}
  else if(b.view==="guard"&&!Q.built){Q.msgs.push({r:"ai",h:"",next:"Build the app and all its guardrails"});Q.wait=true;drawChat(true);if(Q.auto)later(()=>{if(live()&&Q.auto&&!Q.built)buildOut()},dw)}
  else{const nb=Q.beats[Q.i+1];if(nb){Q.msgs.push({r:"ai",h:"",next:nb.btn||"Continue"});Q.wait=true;drawChat(true);
   if(Q.auto)later(()=>{if(live()&&Q.auto)advance()},dw)}}
  Q.busy=false;pulse();
  if(Q.queued){Q.queued=false;if(Q.wait)later(kick,250)}};
 step()}
function answer(mi,j){const m=Q.msgs[mi];if(!m||!m.ask||m.ask.done!=null)return;const o=m.ask.opts[j];m.ask.done=j;you(o.l);
 if(o.agree){Q.B.agreed=true;Q.B.agreedAt=new Date().toISOString().slice(0,10)}
 if(o.tgt!=null&&X.setTarget)X.setTarget(o.tgt);
 if(o.run&&X[o.run])G(()=>X[o.run](o));
 if(o.own){const who=o.own==="@me"?me():o.own;Q.B.data.forEach(d=>{if(d.kind==="new")d.owner=who})}
 Q.busy=true;Q.typing=true;drawChat(true);later(()=>{Q.typing=false;if(o.say)say(o.say);Q.wait=false;render();syncRail();later(nextBeat,900)},700)}
function finish(){}

/* ---------- build the app and the guardrails for real ---------- */
function buildOut(){
 if(Q.built||!Q.sc)return;Q.built=true;Q.msgs.forEach(m=>{if(m.next)m.next=null});const B=Q.B,sc=Q.sc,own=OWN[sc.id]||[me(),"Casey Rowan"];
 const id="stu_"+slug(B.title);B.id=id;
 const flat=B.phases?B.phases.reduce((a,p)=>a.concat(p.steps.map(s=>Object.assign({ph:p.name},s))),[]):B.steps;
 const stp=flat.map((s,i)=>Object.assign({n:s.n,d:s.d||"",who:SMK(s.who),owner:s.owner||"Owner",sla:s.sla||"",in:i?flat[i-1].n+" done":"Request",out:s.n+" done"},s.trig?{trig:s.trig}:{}));
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
 Q.msgs.push({r:"ai",h:"Built. <b>"+stp.length+" steps</b>, "+mids.length+" measure"+(mids.length===1?"":"s")+", "+newEnts.length+" new data attribute"+(newEnts.length===1?"":"s")+" and every guardrail on the right. It is registered in the process library as <b>"+E(B.title)+"</b>.<br>I will not trust it yet. Next I put test agents through all of it."});const nb=Q.beats[Q.i+1];if(nb)Q.msgs.push({r:"ai",h:"",next:nb.btn||"Continue"});Q.wait=!!nb;drawChat(true);if(Q.auto&&nb)later(nextBeat,1300)}

/* ---------- share it with the enterprise ---------- */
const CERT=()=>{const B=Q.B,g=B.guard||{};return[
 ["A named owner and a different backup",!!B.owner,B.owner?B.owner+" and "+((OWN[Q.sc.id]||[])[1]||"a backup"):"missing"],
 ["Ownership accepted",B.agreed,B.agreed?"Accepted":"Waiting for you"],
 ["Every step is human, robot or agent, and every robot and agent step has a trigger",flatSteps().every(s=>s.who&&(!(STP()&&STP().needsTrigger(s.who))||s.trig)),"Checked on "+(B.nsteps||flatSteps().length)+" steps"],
 ["Loopholes found and closed",B.issues.every(i=>i.fixed),B.issues.length+" found"+(B.loops?", "+B.loops+" in the full scan":"")],
 ["Every new data attribute has an owner, source and rule",B.data.filter(d=>d.kind==="new").every(d=>d.owner&&d.src&&d.rule),B.data.filter(d=>d.kind==="new").length+" new"],
 ["Each measure says what to do when off trend",B.metrics.every(m=>m.off),B.metrics.length+" measures"],
 ["Access set and checked against the org chart",B.people.length>0,B.people.reduce((a,x)=>a+x.people.length,0)+" people resolved"],
 ["Knowledge articles seeded from the conversation",(g.articles||[]).length>0,(g.articles||[]).length+" drafted"],
 ["Test agents ran the whole process and every finding is fixed",!!(B.test&&B.test.clean),B.test?(B.test.clean?B.test.n+" checks passed after "+B.test.fixed+" fixes":"Open findings"):"Not run yet"],
 ["Usability and Section 508 scan passed after remediation",!!(B.ux&&B.ux.clean),B.ux?(B.ux.clean?"0 open issues, "+B.ux.fixed+" fixed":"Open issues"):"Not run yet"],
 ["Approval path into the governance body submitted",!!B.submitted,B.submitted?"Submitted for the "+B.submitted:"Not submitted"]]};
function publish(){if(Q.published||!Q.built)return;const B=Q.B;const bad=CERT().filter(c=>!c[1]);if(bad.length){Q.msgs.push({r:"ai",h:"Not yet. Still open: <b>"+E(bad[0][0])+"</b>."});drawChat(true);return}
 const can=visPeople();Q.published={id:B.id,title:B.title,owner:B.owner,vis:Q.vis,n:can.length,at:new Date().toISOString().slice(0,10),ver:"1.0"};
 Q.lib.unshift(Object.assign({kind:"studio",steps:B.nsteps||B.steps.length,sc:Q.sc.id},Q.published));
 Q.view="share";Q.stage="share";Q.reached.share=1;render();syncRail();
 say("Published to the enterprise library as <b>"+E(B.title)+" 1.0</b>. "+can.length+" people can find it now. When anyone asks the studio for something close, it searches here first and brings "+E(B.owner)+" in before extending it.")}
function visPeople(){const s=STAFF();if(Q.vis==="owner")return[Q.B.owner];if(Q.vis==="division"){const o=G(()=>ORGX.P(Q.B.owner).unit,"");return s.filter(p=>p.unit===o).map(p=>p.n)}return s.map(p=>p.n)}

/* ---------- direct edits on the visual ---------- */
function flatSteps(){return Q.B.phases?Q.B.phases.reduce((a,p)=>a.concat(p.steps),[]):Q.B.steps}
function cycleWho(ref){const s=stepAt(ref);if(s)setWho(ref,ORDER[(ORDER.indexOf(s.who)+1)%4])}
function setWho(ref,to){to=SMK(to);const s=stepAt(ref);if(!s||s.base||SMK(s.who)===to)return;const from=SMK(s.who);s.who=to;const P=STP();s.owner=P?P.ownerFor(to,s.owner):s.owner;if(P)P.ensureTrig(s);
 let msg="You changed <b>"+E(s.n)+"</b> from "+WHO[from][0].toLowerCase()+" to "+WHO[s.who][0].toLowerCase()+".";
 const tg=s.trig&&W.TRIGGERS?" It starts when "+E(TRIGGERS.label(s.trig).toLowerCase())+"; change the trigger in the step panel.":"";
 if(s.who==="robot"&&/approv|sign|decid|review/i.test(s.n))msg+=" I would keep a person on this one: it is a decision. I left it as you set it and logged the risk."+tg;
 else if(s.who==="agent")msg+=" An agent will propose and a person will confirm."+tg;
 else if(s.who==="robot")msg+=" A robot is a fixed rule: same input, same answer, tested once."+tg;
 else msg+=" I rechecked the flow: nothing else changes.";
 say(msg);render()}
function addStep(text){const t=text.replace(/^add (a )?step[:\s-]*/i,"").trim();if(!t){say("Tell me the step, for example: <i>add a step: notify the supplier</i>.");return}
 const arr=Q.B.phases?null:Q.B.steps;if(!arr){say("This process is large. Open a phase and use its steps, or tell me which phase to add to.");return}
 arr.splice(Math.max(1,arr.length-1),0,{n:t.charAt(0).toUpperCase()+t.slice(1),who:"human",owner:"Owner",sla:"",add:true});Q.view="flow";Q.stage="process";say("Added <b>"+E(t)+"</b> as a person step before the last one. I checked it for loops and found none. Click it if a robot or an agent should do it.");render();syncRail()}

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

/* ---------- visuals: same language as the workflow designer, process map and data model ---------- */
const LANES=["human","agent","robot","gate"];
const eyebrow=(a,b)=>`<div class="stu-eb">${E(a)}${b?` <span>${E(b)}</span>`:""}</div>`;
const head=(eb,t,sum)=>`${eyebrow(eb)}<h2>${t}</h2>${sum?`<p class="stu-sum">${sum}</p>`:""}`;
const tile=(k,v,c)=>`<div class="stu-k card glass"><small>${k}</small><b>${v}</b><span>${c||""}</span></div>`;
function mixOf(list){const m={human:0,robot:0,agent:0,gate:0};list.forEach(s=>m[SMK(s.who)]++);return m}
function mixHTML(list){const m=mixOf(list);return ORDER.map(k=>`<span><i class="stu-dot ${WHO[k][1]}"></i><b>${m[k]}</b> ${WHO[k][0].toLowerCase()}</span>`).join("")}
function barHTML(list){const m=mixOf(list);return `<span class="stu-bar">${ORDER.map(k=>m[k]?`<i class="${WHO[k][1]}" style="flex:${m[k]}"></i>`:"").join("")}</span>`}
function stepAt(ref){if(ref==null||ref==="")return null;const B=Q.B;return String(ref).indexOf(":")>0?G(()=>B.phases[+ref.split(":")[0]].steps[+ref.split(":")[1]],null):B.steps[+ref]||null}
function issuesFor(ref,i){return Q.B.issues.filter(x=>x.s===i+1||x.s===ref)}
/* the swimlane canvas: one lane per kind of doer, one column per step, curved connectors, nodes appear as they are built */
const CW=176,NW=156,NH=64,RH=80,LX=118,TY=14;
function canvas(steps,pre){
 const used=LANES.filter(k=>steps.some(s=>SMK(s.who)===k));if(!used.length)return`<p class="stu-empty">Nothing yet. Describe how it starts and I will draft it here.</p>`;
 const w=LX+steps.length*CW+30,h=TY*2+used.length*RH,pos=steps.map((s,i)=>({x:LX+i*CW,y:TY+used.indexOf(SMK(s.who))*RH+(RH-NH)/2}));
 let svg=`<svg class="stu-cvs" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs><marker id="stuAr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="currentColor"/></marker></defs>`;
 used.forEach((k,li)=>{svg+=`<rect x="0" y="${TY+li*RH}" width="${w}" height="${RH}" class="stu-lane ${WHO[k][1]}"/>`});
 steps.forEach((s,i)=>{if(!i)return;const a=pos[i-1],b=pos[i],x1=a.x+NW,y1=a.y+NH/2,x2=b.x,y2=b.y+NH/2,m=(x1+x2)/2;svg+=`<path class="stu-ln2 ${s.add?"add":""}" d="M${x1} ${y1} C${m} ${y1} ${m} ${y2} ${x2-2} ${y2}" marker-end="url(#stuAr)"/>`});
 svg+="</svg>";
 const lab=used.map((k,li)=>`<div class="stu-lab ${WHO[k][1]}" style="top:${TY+li*RH}px;height:${RH}px"><i class="stu-dot ${WHO[k][1]}"></i>${WHO[k][0]}</div>`).join("");
 const nodes=steps.map((s,i)=>{const ref=pre===""?String(i):pre+":"+i,iss=issuesFor(ref,i),key=Q.B.title+"|"+ref+"|"+s.n,fresh=!Q.seen.has(key);Q.seen.add(key);
  return `<button type="button" class="stu-nd ${WHO[SMK(s.who)][1]} ${s.base?"base":""} ${s.add?"add":""} ${fresh?"fresh":""} ${String(Q.sel)===ref?"sel":""}" style="left:${pos[i].x}px;top:${pos[i].y}px;--i:${Math.min(i,24)}" data-stu-sel="${ref}" title="${E(s.n+" | "+WHO[SMK(s.who)][0]+(STP()?" | "+STP().trigText(s):""))}"><em>${i+1}</em><b>${E(s.n)}</b>${STP()&&STP().needsTrigger(s.who)?`<small class="stu-ntr">${SMK(s.who)==="agent"?E(s.owner||"")+" · ":""}${E(s.trig&&W.TRIGGERS?TRIGGERS.label(s.trig):"No trigger set")}</small>`:`<small>${E(s.owner||"")}${s.sla?" · "+E(s.sla):""}</small>`}${iss.length?`<u class="stu-flag" title="${E(iss.map(x=>x.t).join("; "))}">${iss.length}</u>`:""}</button>`}).join("");
 return `<div class="stu-tools"><button type="button" class="btn quiet" data-stu-zoom="-1" aria-label="Zoom out">−</button><button type="button" class="btn quiet" data-stu-zoom="1" aria-label="Zoom in">+</button><button type="button" class="btn quiet" data-stu-zoom="0">Fit</button><span class="stu-hintx">Click a step to change who does it, rename it or see what I found. Scroll sideways for more.</span></div>
 <div class="stu-cv card glass" id="stuCv"><div class="stu-cvi" style="width:${w}px;height:${h}px;zoom:${Q.zoom}">${svg}${lab}${nodes}</div></div>`}
function inspector(){const ref=Q.sel,s=stepAt(ref);
 if(!s)return"";
 const idx=String(ref).indexOf(":")>0?+ref.split(":")[1]:+ref,iss=issuesFor(ref,idx);
 const k=SMK(s.who),P=STP();
 const trigUI=P&&P.needsTrigger(k)&&W.TRIGGERS?`<div class="stp-tsel"><label class="small" for="stuTrig${E(ref)}"><b>Starts when</b></label><select class="fin" id="stuTrig${E(ref)}" data-stu-trig="${E(ref)}" ${s.base?"disabled":""}>${P.trigOptions(s.trig&&s.trig.type)}</select>${P.trigChip(s)}</div>`:P?`<p class="stu-note">${E(P.trigText(s))}.</p>`:"";
 const agentBtn=k==="agent"&&P?`<button type="button" class="btn sm" ${P.attrs(s.owner||"Studio Agent",{task:s.d||s.n,trig:s.trig,sponsor:Q.B.owner||me()})}>Open agent definition</button>`:"";
 return `<aside class="stu-insp card glass"><small class="stu-eb">STEP ${idx+1} · ${E(WHO[k][0]).toUpperCase()}</small><h3 ${s.base?"":'contenteditable="true" spellcheck="false" data-stu-name="'+ref+'"'}>${E(s.n)}</h3>
  <div class="stu-seg" role="group" aria-label="Who does this step">${ORDER.map(o=>`<button type="button" class="${k===o?"on "+WHO[o][1]:""}" data-stu-set="${ref}|${o}" aria-pressed="${k===o}" ${s.base?"disabled":""}>${WHO[o][0]}</button>`).join("")}</div>
  ${trigUI}${agentBtn}
  <dl class="stu-dl"><dt>Owner</dt><dd>${E(s.owner||"Not set")}</dd><dt>Time limit</dt><dd>${E(s.sla||"None")}</dd>${s.d?`<dt>Note</dt><dd>${E(s.d)}</dd>`:""}</dl>
  ${s.base?`<p class="stu-note">Owned by ${E(s.owner)}. Extending it needs the owner to agree.</p>`:""}
  ${iss.length?`<h4>What I found</h4><ul class="stu-iss">${iss.map(x=>`<li><b>${E(x.t)}</b><span>${E(x.f)}</span></li>`).join("")}</ul>`:`<p class="stu-note">No loopholes or rework here.</p>`}</aside>`}
function flowTiles(all){const m=mixOf(all),auto=all.length?Math.round((m.robot+m.agent)/all.length*100):0,B=Q.B;
 return `<div class="stu-ks">${tile("Steps",all.length,B.phases?B.phases.length+" phases":"in sequence")}${tile("Automation",auto+"%","robot or agent steps")}${tile("Loopholes",B.loops||B.issues.length,(B.loops?B.loops-B.issues.length+" closed on my own":"all closed"))}${tile("Owner",E((B.adj&&B.adj.owner)||B.owner||"You"),B.adj?"agrees before it extends":"you, until you share it")}</div>`}
function vFlow(){const B=Q.B;
 if(B.phases){const all=flatSteps(),pi=Math.min(Q.ph||0,B.phases.length-1),P=B.phases[pi];
  return `${head("Process",E(B.title),all.length+" steps in "+B.phases.length+" phases. Open a phase to see its steps.")}${flowTiles(all)}<div class="stu-mix">${mixHTML(all)}</div>
  <div class="stu-pht">${B.phases.map((p,i)=>`<button type="button" class="stu-pt card glass ${i===pi?"on":""}" data-stu-ph="${i}"><small>${i+1}</small><b>${E(p.name)}</b><span>${p.steps.length} steps</span>${barHTML(p.steps)}</button>`).join("")}</div>
  <div class="stu-fl ${stepAt(Q.sel)?"has":""}"><div>${eyebrow("Phase "+(pi+1),P.name)}${canvas(P.steps,String(pi))}</div>${inspector()}</div>${B.issues.length?issuesHTML():""}`}
 const st=B.steps;
 return `${head("Process",E(B.title),st.length+" steps"+(B.adj?` · extends <b>${E(B.adj.name)}</b>, owned by ${E(B.adj.owner)}`:""))}${flowTiles(st)}
 <div class="stu-fl ${stepAt(Q.sel)?"has":""}"><div>${canvas(st,"")}</div>${inspector()}</div>${B.issues.length?issuesHTML():""}`}
function issuesHTML(){return `<h3>Loopholes and rework I found</h3><div class="stu-isg">${Q.B.issues.map(x=>`<div class="stu-is card glass"><b>${E(x.t)}</b><span>${E(x.f)}</span></div>`).join("")}</div>`}
function vFind(){const B=Q.B,m=B.match||[],adj=B.adj;
 return `${head("Library search","Looked before building",`Searched ${G(()=>PROCLIB.list().length,0)} processes first.`)}
 ${adj?`<div class="stu-hit card glass"><span class="stu-tag ext">Adjacent process</span><h3>${E(adj.name)}</h3><p>Owned by <b>${E(adj.owner)}</b>, backup ${E(adj.backup||"none")} · ${E(adj.familyName)} · maturity ${adj.level} of 5 · ${adj.steps} steps</p><p class="stu-act">Recommendation: extend it and bring ${E(adj.owner)} in.</p></div>`:`<div class="stu-hit new card glass"><span class="stu-tag">Nothing close</span><h3>This is a new process</h3><p>I will interview you and build it step by step.</p></div>`}
 ${m.length?`<h3>Closest matches</h3><div class="stu-mg">${m.map(x=>`<div class="stu-mc card glass"><b>${E(x.p.name)}</b><span>${E(x.p.owner)}</span><em>${Math.round(Math.min(.95,x.score)*100)}% overlap</em></div>`).join("")}</div>`:""}`}
function vGov(){const g=Q.B.gov||[];const adj=Q.B.adj||{};const done=Q.i>=1&&Q.reached.process||Q.msgs.some(m=>m.ask&&m.ask.done===0);
 return `${head("Governance","Extending "+E(adj.name||"an existing process"),"The whole governance process runs here, so you do not have to know it.")}
 <div class="stu-gv">${g.map((x,i)=>`<div class="stu-gs card glass ${done?"done":""}"><b>${done?"✓":i+1}</b><span>${E(x)}</span></div>`).join("")}</div><p class="stu-note">Nothing is changed in ${E(adj.owner||"the owner")}'s process until they agree.</p>`}
function vStd(){return `${head("Standards","What the industry does","References I checked so you can improve the process without searching.")}<div class="stu-sg">${Q.B.std.map((x,i)=>`<label class="stu-sc2 card glass ${x.on?"on":""}"><input type="checkbox" data-stu-std="${i}" ${x.on?"checked":""}><span><b>${E(x.n)}</b><small>${E(x.why)}</small></span></label>`).join("")}</div>`}
function vData(){const d=Q.B.data,n=d.filter(x=>x.kind==="new").length,staff=STAFF().map(p=>p.n);
 const grp={};d.forEach((x,i)=>{(grp[x.ent]=grp[x.ent]||[]).push(Object.assign({i},x))});
 return `${head("Data","What it reads and writes",`<b>${d.length-n}</b> reused from the data model, <b>${n}</b> new. Only authoritative elements are used.`)}
 <datalist id="stuStaff">${staff.map(x=>`<option value="${E(x)}">`).join("")}</datalist>
 <div class="stu-dm"><div class="stu-hub card glass"><small class="stu-eb">THIS PROCESS</small><b>${E(Q.B.title)}</b><span>${d.length} elements in ${Object.keys(grp).length} entities</span></div>
 <div class="stu-ents">${Object.keys(grp).map(k=>{const rows=grp[k],nw=rows.every(r=>r.kind==="new");return `<section class="stu-en card glass ${nw?"new":""}"><div class="stu-eh"><code>${E(k)}</code><span class="stu-tg ${nw?"new":""}">${nw?"New":rows.some(r=>r.kind==="new")?"Reused and new":"Reused"}</span></div>
  ${rows.map(x=>`<div class="stu-er ${x.kind}"><b>${E(x.el)}</b><span class="stu-src">${E(x.src||"")}</span>${x.kind==="new"?`<label>Owner<input list="stuStaff" data-stu-own="${x.i}" value="${E(x.owner)}" placeholder="Who owns this?" aria-label="Owner of ${E(x.el)}"></label><label>Rule<input data-stu-rule="${x.i}" value="${E(x.rule||"")}" aria-label="Validation rule for ${E(x.el)}"></label>`:`<span class="stu-own">${E(x.owner)}</span><span class="stu-ok">Defined</span>`}</div>`).join("")}</section>`}).join("")}</div></div>`}
const spark=(t,tg)=>{if(!t||!t.length)return"";const mn=Math.min.apply(0,t),mx=Math.max.apply(0,t),r=mx-mn||1,pt=t.map((v,i)=>[(i*120/(t.length-1)),30-(v-mn)/r*26]),ln=pt.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");return `<svg viewBox="0 0 120 34" preserveAspectRatio="none" class="stu-sp" aria-hidden="true"><polygon points="0,34 ${ln} 120,34" class="a"/><polyline fill="none" points="${ln}"/><circle cx="${pt[pt.length-1][0]}" cy="${pt[pt.length-1][1].toFixed(1)}" r="3"/></svg>`};
function vMetrics(){return `${head("Measures","How you will know it works","Each measure says what decision it supports and what to do when it drifts.")}<div class="stu-mgrid">${Q.B.metrics.map((m,i)=>{const off=(m.dir==="max"&&+m.cur<+m.tgt)||(m.dir==="min"&&+m.cur>+m.tgt);
 return `<section class="stu-mt card glass"><div class="stu-mh"><b>${E(m.n)}</b><i class="stx-t ${off?"off":"ok"}" title="${off?"Off target":"On target"}"></i></div><div class="stu-mv"><span class="stu-cur">${E(m.cur)}${E(m.u==="%"?"%":" "+m.u)}</span><label>target ${m.dir==="max"?"≥":"≤"} <input type="number" step="any" value="${E(m.tgt)}" data-stu-tgt="${i}" aria-label="Target for ${E(m.n)}"></label></div>${spark(m.tr)}
 <details><summary>Why, the decision and what to do</summary><dl class="stu-dl"><dt>Why</dt><dd>${E(m.why)}</dd><dt>Decision</dt><dd>${E(m.dec)}</dd><dt>How measured</dt><dd>${E(m.f)} · ${E(m.src)}</dd><dt>On trend</dt><dd>${E(m.on)}</dd><dt>Off trend</dt><dd>${E(m.off)}</dd><dt>Retire when</dt><dd>${E(m.obs)}</dd></dl></details><code>${E(m.ac)}</code></section>`}).join("")}</div>`}
function vAccess(){const B=Q.B;return `${head("Access","Who can see and change it","Say it in your own words. I check it against the org chart.")}
 <form class="stu-cmd" data-stu-cmdform><input value="${E(B.cmd)}" aria-label="Who should have access" placeholder="For example: all of finance, or managers and above"><button class="btn primary" type="submit">Resolve</button></form>
 <div class="stu-ag">${B.people.map(g=>`<section class="stu-gc card glass"><div class="stu-gh"><b>${E(g.label.charAt(0).toUpperCase()+g.label.slice(1))}</b><span class="stu-lv">${g.lvl==="sign"?"Can sign off":g.lvl==="edit"?"Can change":g.lvl||"Can see"}</span></div><p class="stu-cnt">${g.ext?"External, added per booking":g.people.length+" people"}</p>
 <div class="stu-ppl">${g.people.slice(0,24).map(n=>`<span class="stu-pp" title="${E(n)}">${E(n.split(" ").map(x=>x[0]).join("").slice(0,2))}<small>${E(n)}</small></span>`).join("")}${g.people.length>24?`<span class="stu-pp more">+${g.people.length-24}</span>`:""}</div></section>`).join("")||'<p class="stu-empty">No access set. Restricted to you until you do.</p>'}</div>
 <p class="stu-note">Sensitive fields stay masked unless a person's role already allows them.</p>`}
function vStrat(){const s=Q.B.strat||[];return `${head("Strategy check",'<span class="stu-pro">Pro</span> Does this fit what leadership asked for?',"Checked before anything is built.")}<div class="stu-sg">${s.map(x=>{const o=SD.OBJ.find(y=>y.id===x.o);return `<div class="stu-sv card glass ${x.v}"><span class="stu-vd ${x.v}">${x.v==="supports"?"Supports":x.v==="conflicts"?"Conflicts":"No effect"}</span><b>${E(o.n)}</b><small>${E(x.t)}</small></div>`}).join("")}</div>`}
const ART_OLD=()=>{const B=Q.B,g=B.guard||{},b=Q.built;const n=B.nsteps||flatSteps().length;
 return [["Process and workflow",n+" steps, each human, robot or agent",1],["Data model","Reuses "+(B.data.filter(d=>d.kind!=="new").length)+" existing elements; "+B.data.filter(d=>d.kind==="new").length+" new with owner, source and rule",1],["Measures","Each with a decision, a target and an off-trend action",1],["Access and security",B.people.reduce((a,x)=>a+x.people.length,0)+" people from the org chart; sensitive fields masked",1],["Maturity model",g.maturity,b],["Knowledge articles",(g.articles||[]).map(x=>"“"+x+"”").join(", "),b],["Roadmap",(g.roadmap||[]).join(" · "),b],["Technical debt decisions",(g.debt||[]).join(" "),b],["Ownership agreement",g.agree,b&&B.agreed],["Audit trail and change record","Every edit in this conversation is logged with its author",b],["Test run","12 of 12 sample cases passed",b]]};
const glTile=a=>`<div class="stu-gt card glass ${a[2]?"on":""}"><i aria-hidden="true">${a[2]?"✓":""}</i><span><b>${E(a[0])}</b><small>${E(a[1]||"")}</small></span></div>`;
function vGuard(){const B=Q.B,b=Q.built;const ART=ART_OLD;return `${head("Guardrails","The app and its guardrails",b?"Built. Everything below exists and is linked.":"You asked for one thing. These come with it by default.")}
 <div class="stu-gg">${ART().map(glTile).join("")}</div>
 <div class="stu-cta">${b?`${B.agreed?"":`<button class="btn" data-stu-agree="1">I accept ownership</button>`} <button class="btn primary" data-stu-go="share" ${B.agreed?"":"disabled"}>Share it with the enterprise</button>${B.agreed?"":'<span class="stu-hint">Accept ownership to continue</span>'}`:`<button class="btn primary" data-stu-build="1">Build the app and all its guardrails</button>`}</div>`}
function visOpts(){return [["enterprise","Everyone"],["division","My division"],["owner","Only me"]].map(o=>`<label class="stu-vo"><input type="radio" name="stuvis" value="${o[0]}" ${Q.vis===o[0]?"checked":""}>${o[1]}</label>`).join("")}
function vShare(){const c=CERT(),p=Q.published;
 return `${head("Share","Share it with the enterprise","Anyone with permission can discover it, run it, extend it or inherit from it. The studio searches here first next time.")}
 <div class="stu-gg">${c.map(x=>glTile([x[0],x[2],x[1]])).join("")}</div>
 ${p?`<div class="stu-hit card glass"><span class="stu-tag ext">Published</span><h3>${E(p.title)} ${E(p.ver)}</h3><p>${p.n} people can find it · owner ${E(p.owner)}. Others extend it with ${E(p.owner)}'s agreement. You are credited as builder. Adoption and value show on the owner's home once it is used.</p></div>`
 :`<div class="stu-pub card glass"><h3>Who can find it</h3><div class="stu-vis" role="radiogroup" aria-label="Who can find it">${visOpts()}</div><p class="stu-sum">${visPeople().length} people can find it with this setting.</p><div class="stu-cta"><button class="btn primary" data-stu-pub="1">Publish to the library</button></div></div>`}`}
function canSee(p){const owner=G(()=>ORGX.P(p.owner),null);if(p.vis==="owner")return p.owner===me();if(p.vis==="division")return !owner||G(()=>ORGX.P(me()).unit,"")===owner.unit;return true}
function libRows(q){const base=G(()=>PROCLIB.list(),[]).filter(p=>!/^stu_/.test(p.id)).map(p=>({id:p.id,title:p.name,owner:p.owner,fam:p.familyName,lvl:p.level,steps:p.steps,vis:"enterprise",kind:"core"}));
 const mine=Q.lib.map(p=>({id:p.id,title:p.title,owner:p.owner,fam:"Built in the studio",lvl:2,steps:p.steps,vis:p.vis,kind:"studio",ver:p.ver}));
 let rows=mine.concat(base);q=String(q||"").toLowerCase().trim();if(q)rows=rows.filter(r=>(r.title+" "+r.owner+" "+r.fam).toLowerCase().indexOf(q)>=0);return rows}
function vLib(){const rows=libRows(Q.q);const sh=rows.slice(0,40);
 return `${head("Library","Enterprise library",rows.length+" processes anyone can find, run, extend or inherit, if their role allows it.")}<input class="stu-q" data-stu-q value="${E(Q.q||"")}" placeholder="Search by name, owner or area" aria-label="Search the library">
 <div class="stu-lib">${sh.map(r=>{const ok=canSee(r);return `<div class="stu-lr card glass"><span class="stu-ln"><b>${E(r.title)}</b><small>${E(r.fam)} · owner ${E(r.owner)} · ${r.steps} steps${r.kind==="studio"?" · built in the studio "+E(r.ver):""}</small></span><span class="stu-mat">L${r.lvl}</span>${ok?`<button class="btn quiet" data-stu-use="run:${E(r.id)}">Run</button><button class="btn quiet" data-stu-use="ext:${E(r.id)}">Extend</button><button class="btn quiet" data-stu-use="inh:${E(r.id)}">Inherit</button>`:`<button class="btn quiet" data-stu-use="ask:${E(r.id)}">Ask for access</button>`}</div>`}).join("")}</div>${rows.length>40?`<p class="stu-sum">Showing 40. Search to narrow.</p>`:""}`}
function vHome(){const lib=libRows("");return `<div class="stu-home">${eyebrow("Guardrails in a box")}<h2>Tell us what you need to do. We will handle the rest.</h2><p class="stu-sum">You do not need to know how security, data, governance or process design work. Describe the job in plain words. ${BRAND.name} finds what already exists, builds what does not, and every enterprise rule applies to what you build.</p>
 <div class="stu-hw">${[["Say it","Type it, or soon, say it"],["Find or build",(BRAND.name+" searches the library, then extends or builds")],["Watch and change","It appears here. Edit it here or in chat"],["Guardrails included","Everyone with permission can use what you build"]].map((x,i)=>`<div class="stu-h1 card glass"><b>${i+1}</b><span><em>${x[0]}</em><small>${x[1]}</small></span></div>`).join("")}</div>
 <div class="stu-clk"><button type="button" class="btn primary" data-stu-try="ret">Start the click-through demo</button><span class="small muted">Damaged returns, an operations example. One step at a time: Next and Back stay on screen.</span></div><h3>Try an example</h3><div class="stu-ex">${SD.CHIPS.map(c=>`<button type="button" class="stu-exc card glass" data-stu-try="${c.id}"><b>${E(c.t)}${c.pro?' <em class="stu-pro">Pro</em>':""}</b><small>${E(c.sub)} · ${E(c.time)}</small></button>`).join("")}</div>
 <div class="stu-ks">${tile("Library",lib.length,"processes to reuse")}${tile("Data",G(()=>Object.keys(DATAMODEL.tables).length,0),"entities with owners")}${tile("Measures",Object.keys(G(()=>METRICS,{})).length,"each with an action")}<div class="stu-k card glass stu-kb"><button class="btn quiet" data-stu-go="lib">Browse the library</button></div></div></div>`}
const VIEWS=X.views;Object.assign(VIEWS,{home:vHome,find:vFind,gov:vGov,flow:vFlow,std:vStd,data:vData,metrics:vMetrics,access:vAccess,strat:vStrat,guard:vGuard,share:vShare,lib:vLib});
function stageOfView(v){return STAGE_OF_VIEW[v]||v}
const playBtn=()=>`<button type="button" class="stu-play" data-stu-play="1" aria-pressed="${Q.auto}">${Q.auto?"Pause demo":"Play the demo"}</button>`;
function railHTML(){if(Q.view==="home"||Q.view==="lib")return `<nav class="stu-rail"><button type="button" class="${Q.view==="home"?"cur":""}" data-stu-go="home">Start</button><button type="button" class="${Q.view==="lib"?"cur":""}" data-stu-go="lib">Library</button><span class="stu-sp1"></span>${playBtn()}</nav>`;
 const cs=stageOfView(Q.view),st=STAGES.filter(t=>!t[3]||Q.pro),cg=(st.find(t=>t[0]===cs)||st[0])[2];
 const grp=GROUPS.map(g=>{const mem=st.filter(t=>t[2]===g),done=mem.length&&mem.every(t=>Q.reached[t[0]]),any=mem.some(t=>Q.reached[t[0]]);const tgt=(mem.filter(t=>Q.reached[t[0]]).pop()||mem[0])[0];return `<button type="button" class="${g===cg?"cur":""} ${done?"done":""}" data-stu-view="${tgt}" ${any?"":"disabled"}>${g}</button>`}).join("");
 const sub=st.filter(t=>t[2]===cg).map(t=>{const r=Q.reached[t[0]];return `<button type="button" class="${cs===t[0]?"cur":""} ${r?"done":""}" data-stu-view="${t[0]}" ${r?"":"disabled"}>${t[1]}</button>`}).join("");
 return `<nav class="stu-rail" aria-label="Build progress">${grp}<span class="stu-sp1"></span><button type="button" data-stu-go="lib">Library</button>${playBtn()}</nav><nav class="stu-rail stu-sub2" aria-label="Steps in ${cg}">${sub}</nav>`}
function demoBar(){if(!Q.sc||Q.view==="home"||Q.view==="lib")return "";const n=Q.beats.length,x=Math.max(1,Math.min(n,(Q.peek!=null?Q.peek:Q.i)+1));const sp=Q.spd||1;
 const seg=(a,l,on)=>`<button type="button" class="${on?"on":""}" aria-pressed="${on}" ${a}>${l}</button>`;
 return `<div class="stu-demo" role="group" aria-label="Demo controls"><div class="stu-dm1"><span class="stu-dseg" role="group" aria-label="Pace">${seg('data-stu-mode="guided"',"Click through",!Q.auto)}${seg('data-stu-mode="auto"',"Auto",!!Q.auto)}</span><button type="button" class="stu-dbk" data-stu-bk ${x<=1?"disabled":""}>Back</button>${Q.peek!=null?'<button type="button" class="stu-dbk" data-stu-live>Return to where we are</button>':""}<button type="button" class="stu-dbk stu-dnx" data-stu-nx>Next</button><span class="stu-dstep" aria-live="off">Step ${x} of ${n}</span><span class="stu-dseg" role="group" aria-label="Speed">${seg('data-stu-spd="1.6"',"Slower",sp>1.2)}${seg('data-stu-spd="1"',"Normal",sp===1)}${seg('data-stu-spd="0.6"',"Faster",sp<.9)}</span></div><div class="stu-dprog" role="progressbar" aria-valuemin="1" aria-valuemax="${n}" aria-valuenow="${x}" aria-label="Build progress"><i style="width:${Math.round(x/n*100)}%"></i></div><div class="stu-dhint">${Q.auto?"Auto: it keeps going by itself. Switch to Click through to go one step at a time.":"Click through: nothing moves until you press Next. Space or the right arrow goes forward, the left arrow goes back."}</div></div>`}
function canvasHTML(){const f=VIEWS[Q.view]||vHome;return demoBar()+railHTML()+`<div class="stu-body" tabindex="-1">${f()}</div>`}

/* ---------- mounting ---------- */
function shell(){return `<div class="stu"><section class="stu-right" id="stuCanvas" aria-label="What is being built"></section></div>`}
function render(){const c=D.getElementById("stuCanvas");if(!c)return;normAll();const ov=D.getElementById("stuCv"),ob=D.querySelector(".stu-body"),sl=ov?ov.scrollLeft:0,st=ob?ob.scrollTop:0;c.innerHTML=canvasHTML();{const cv=D.getElementById("stuCv"),iw=D.querySelector(".stu-cvi");if(cv&&iw&&Q.autoFit!==false){const f=Math.max(.5,Math.min(1,(cv.clientWidth-8)/parseFloat(iw.style.width)));if(Math.abs(f-Q.zoom)>.02){Q.zoom=f;iw.style.zoom=f}}}pulse();if(X.after)G(()=>X.after());{const nv=D.getElementById("stuCv"),nb=D.querySelector(".stu-body");if(nv)nv.scrollLeft=sl;if(nb)nb.scrollTop=st}}
function syncRail(){}
function railSet(on){const c=D.getElementById("railCollapse");if(!c||c.checked===on)return false;c.checked=on;c.dispatchEvent(new Event("change",{bubbles:true}));return true}
function mount(){const r=D.getElementById("stuRoot");if(!r)return;if(r.dataset.m==="1"){return}r.dataset.m="1";if(!W.matchMedia("(max-width:760px)").matches&&railSet(true))Q.railAuto=true;r.innerHTML=shell();const C=CXr();
 if(!Q.thread||!(C.hasThread&&C.hasThread(Q.thread.id))){ensureThread("VibeCheck");Q.msgs=[];Q.mi=0;Q.sc=null;Q.view="home"}else C.activate&&C.activate(Q.thread.id);
 if(!Q.msgs.length){Q.msgs.push({r:"ai",h:"Hi "+E(me().split(" ")[0])+". What do you need to do? Describe it in plain words, or pick an example. I will find what already exists, or build it with you here.",sugg:SD.CHIPS.map(c=>c.t)})}
 drawChat(true);render();if(C.open)C.open("chat")}
W.STUDIO.mount=mount;W.STUDIO.start=id=>startScenario(SD.SCEN[id]);W.STUDIO.submit=submit;W.STUDIO.fast=false;
function open(text){Q.exited=false;go("studio");setTimeout(()=>{mount();const C=CXr();if(C.activate&&Q.thread&&C.hasThread&&C.hasThread(Q.thread.id))C.activate(Q.thread.id);if(C.open)C.open("chat");if(text)submit(text)},60)}
W.STUDIO.open=open;

/* ---------- events ---------- */
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-stu-try],[data-stu-ans],[data-stu-next],[data-stu-who],[data-stu-ph],[data-stu-view],[data-stu-go],[data-stu-build],[data-stu-agree],[data-stu-pub],[data-stu-play],[data-stu-use],[data-stu-mic],[data-stu-sel],[data-stu-set],[data-stu-zoom]");if(!t||!D.getElementById("stuRoot"))return;
 const d=t.dataset;
 if(d.stuTry){startScenario(SD.SCEN[d.stuTry]);return}
 if(d.stuAns){const[a,b]=d.stuAns.split(":").map(Number);answer(a,b);return}
 if(d.stuNext){if(queueIfBusy())return;const last=Q.msgs[Q.msgs.length-1];if(last&&last.next)last.next=null;Q.wait=false;drawChat();nextBeat();return}
 if(d.stuWho!=null){cycleWho(d.stuWho);return}
 if(d.stuSel!=null){Q.sel=String(Q.sel)===d.stuSel?null:d.stuSel;render();return}
 if(d.stuSet!=null){const[r,k]=d.stuSet.split("|");setWho(r,k);return}
 if(d.stuZoom!=null){const z=+d.stuZoom;if(z===0){const cv=D.getElementById("stuCv"),iw=D.querySelector(".stu-cvi");if(cv&&iw){Q.autoFit=true;Q.zoom=Math.max(.5,Math.min(1,(cv.clientWidth-6)/parseFloat(iw.style.width)))}}else Q.autoFit=false,Q.zoom=Math.max(.5,Math.min(1.4,+(Q.zoom+z*.15).toFixed(2)));render();return}
 if(d.stuPh!=null){Q.ph=+d.stuPh;Q.sel=null;render();return}
 if(d.stuView){Q.view=VIEW_OF_STAGE[d.stuView]||d.stuView;render();return}
 if(d.stuGo){if(d.stuGo==="share"){Q.view="share";Q.stage="share";Q.reached.share=1}else Q.view=d.stuGo;render();return}
 if(d.stuBuild!=null){const last=Q.msgs[Q.msgs.length-1];if(last&&last.next)last.next=null;buildOut();return}
 if(d.stuAgree!=null){Q.B.agreed=true;say("Thank you. You are named sponsor and "+E(Q.B.owner)+" is the owner.");render();return}
 if(d.stuPub!=null){publish();return}
 if(d.stuPlay!=null){Q.auto=!Q.auto;render();if(Q.auto){if(!Q.sc)startScenario(SD.SCEN.cal);else kick()}else pulse();return}
 if(d.stuUse){const[k,id]=d.stuUse.split(":");useLib(k,id);return}
 if(d.stuMic!=null){voice();return}});
D.addEventListener("submit",e=>{const f=e.target;if(!f.matches)return;if(f.matches("[data-stu-form]")){e.preventDefault();const i=D.getElementById("stuInput");const v=i.value;i.value="";submit(v);return}
 if(f.matches("[data-stu-cmdform]")){e.preventDefault();const v=f.querySelector("input").value;Q.B.cmd=v;Q.B.people=resolveAccess(v);const n=Q.B.people.reduce((a,x)=>a+x.people.length,0);say("Resolved <b>"+E(v)+"</b> against the org chart: "+n+" people"+(Q.B.people.some(x=>x.ext)?" plus external contractors":"")+".");render()}});
D.addEventListener("change",e=>{const t=e.target;if(!t.matches||!D.getElementById("stuRoot"))return;
 if(t.matches("[data-stu-own]")){const x=Q.B.data[+t.dataset.stuOwn];x.owner=t.value;const ok=STAFF().some(p=>p.n===t.value);say(ok?"Owner for <b>"+E(x.el)+"</b> set to "+E(t.value)+". I checked the org chart: they exist and are active.":"I could not find <b>"+E(t.value)+"</b> in the org chart. Pick someone from the list.");return}
 if(t.matches("[data-stu-trig]")){const st=stepAt(t.dataset.stuTrig);if(!st||!W.TRIGGERS)return;const ty=t.value,P=STP();st.trig={type:ty,params:{}};const g=P?P.guessTrig(st):null;if(g&&g.type===ty)st.trig=g;else if(P)st.trig.params[P.mainField(ty)]=ty==="step"?(st.prev||"the previous step is done"):ty==="schedule"?"daily":ty==="metric"?"the step's measure":ty==="record"?"record":"an event is raised";say("<b>"+E(st.n)+"</b> now starts when "+E(TRIGGERS.label(st.trig).toLowerCase())+".");render();return}
 if(t.matches("[data-stu-rule]")){Q.B.data[+t.dataset.stuRule].rule=t.value;say("Rule updated. I will check every new record against it.");return}
 if(t.matches("[data-stu-tgt]")){const m=Q.B.metrics[+t.dataset.stuTgt];m.tgt=t.value;say("Target for <b>"+E(m.n)+"</b> is now "+E(t.value)+". It is "+(((m.dir==="max"&&+m.cur<+t.value)||(m.dir==="min"&&+m.cur>+t.value))?"off target today, so the off-trend action would start now: "+E(m.off):"on target today")+".");return}
 if(t.matches("[data-stu-std]")){Q.B.std[+t.dataset.stuStd].on=t.checked;say(t.checked?"Added the reference to the process and its articles.":"Removed. The steps that came from it stay unless you remove them.");return}
 if(t.matches('input[name="stuvis"]')){Q.vis=t.value;render();return}});
D.addEventListener("input",e=>{const t=e.target;if(t.matches&&t.matches("[data-stu-q]")){Q.q=t.value;const c=D.querySelector(".stu-lib");const pos=t.selectionStart;render();const n=D.querySelector("[data-stu-q]");if(n){n.focus();n.setSelectionRange(pos,pos)}}});
D.addEventListener("focusout",e=>{const t=e.target;if(!t.matches||!t.matches("[data-stu-name]"))return;const ref=t.dataset.stuName;const s=stepAt(ref);const v=t.textContent.trim();if(s&&v&&v!==s.n){const old=s.n;s.n=v;say("Renamed <b>"+E(old)+"</b> to <b>"+E(v)+"</b>.");render()}});
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
G(()=>REG("studio","VibeCheck","new","M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4zM5 15l.9 2.1L8 18l-2.1.9L5 21l-.9-2.1L2 18l2.1-.9z",()=>`<div class="screen stu-screen"><div id="stuRoot"></div></div>`));
G(()=>NAVX.add("studio",{group:"make",label:"VibeCheck",hint:("Say what you need and "+BRAND.name+" builds it with every guardrail"),sub:"Chat and build",kw:"build create new process app automate studio chat guardrails in a box interview library extend"}));
R15D.after.push(()=>{if(S_screen()==="studio")setTimeout(mount,0);else{const r=D.getElementById("stuRoot");if(r)r.dataset.m="";if(Q.railAuto){Q.railAuto=false;railSet(false)}}ensurePill()});
function S_screen(){return G(()=>S.screen,"")}
/* the front door: one colored pill at the bottom of the side menu, on every screen */
function ensurePill(){const f=D.querySelector(".rail .railfoot");if(!f)return;let b=D.getElementById("stuPill");
 if(!b){b=D.createElement("button");b.id="stuPill";b.type="button";b.className="stu-pill";b.setAttribute("data-stu-pill","1");b.setAttribute("aria-label","VibeCheck: say what you need and it is built with every guardrail");
  b.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg><span>VibeCheck</span>'}
 if(b.parentNode!==f||f.firstChild!==b)f.insertBefore(b,f.firstChild);b.classList.toggle("cur",S_screen()==="studio")}
D.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-stu-pill]"))open("")});
[200,800,2000,5000].forEach(t=>setTimeout(ensurePill,t));
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-stu-mode],[data-stu-spd],[data-stu-bk],[data-stu-nx],[data-stu-live]");
 if(t){if(t.dataset.stuMode){const on=t.dataset.stuMode==="auto";if(Q.auto!==on){Q.auto=on;render();if(on)kick();else pulse()}}
  else if(t.dataset.stuSpd){Q.spd=+t.dataset.stuSpd;render()}
  else if(t.hasAttribute("data-stu-nx")){if(Q.peek!=null){Q.peek=null;const v=Q.beats[Q.i]&&Q.beats[Q.i].view;if(v)Q.view=v;render()}else kick()}
  else if(t.hasAttribute("data-stu-bk")){const i0=Q.peek!=null?Q.peek:Q.i;const k=Math.max(0,i0-1);Q.peek=k;const v=Q.beats[k]&&Q.beats[k].view;if(v){Q.view=v;render()}}
  else{Q.peek=null;const v=Q.beats[Q.i]&&Q.beats[Q.i].view;if(v)Q.view=v;render()}return}
 const sel=Q.beats&&Q.beats[Q.i]&&CTA[Q.beats[Q.i].view];if(sel&&e.target.closest&&e.target.closest("#stuCanvas "+sel.split(",").join(",#stuCanvas "))){Q.cpDone=Q.cpDone||{};Q.cpDone[Q.i]=1;setTimeout(pulse,60)}});
D.addEventListener("keydown",e=>{if(!buildLive()||S_screen()!=="studio"||Q.auto)return;const tg=e.target,tn=tg&&tg.tagName;if(/INPUT|TEXTAREA|SELECT|BUTTON|A/.test(tn)||(tg&&tg.isContentEditable))return;
 if(e.key===" "||e.key==="ArrowRight"){if(Q.peek!=null){e.preventDefault();Q.peek=null;const v=Q.beats[Q.i]&&Q.beats[Q.i].view;if(v)Q.view=v;render();return}
  const p=Q.msgs.find(m=>m.next);if(Q.wait&&p){e.preventDefault();kick()}}
 else if(e.key==="ArrowLeft"){const b=D.querySelector("[data-stu-bk]");if(b&&!b.disabled){e.preventDefault();b.click()}}});
Object.assign(X,{E,G,Q,WHO,ORDER,head,tile,eyebrow,canvas,flatSteps,stepAt,setWho,say,later,render,syncRail,STAFF,me,OWN,resolveAccess,visPeople,publish,drawChat,slug,mixOf,barHTML,issuesHTML,glTile,ART:ART_OLD,STAGES,VIEW_OF_STAGE,STAGE_OF_VIEW});
W.STUDIO.libRows=libRows;W.STUDIO.resolveAccess=resolveAccess;W.STUDIO.search=search;W.STUDIO.buildOut=buildOut;W.STUDIO.cert=CERT;W.STUDIO.publish=publish;W.STUDIO.answer=answer;W.STUDIO.next=()=>{if(queueIfBusy())return;nextBeat()};W.STUDIO.isBusy=busy;
})();
