/* ===== mod_s_exp: the experience engine for the Showroom (backlog DC-40 engine, DC-41 ripples). Global: window.EXP.
   Contract: docs/showroom/experiences.md. The buyer drives; the engine watches and coaches.
     EXP.register(mission)  EXP.list({role,tenant})  EXP.start(id,{tenant,role,mode:"facilitated"|"self"})  EXP.stop()  EXP.state()
     EXP.on(event,fn)  events: start, checkpoint, hint, ripple, success, stuck, end (fn gets the event data)
     EXP.ripple(record)  before and after along ZLINK.chains and ROLLUP, shown as a cause and effect trail (modeled)
     EXP.lint()  briefs, clocks (180 s at most), labels and named screens; EXP.signal(ev) feeds a signal by hand
   Signals the engine listens to (no business module edits): HOOKS audit, beforeGo, afterRender, afterOpenDrawer, tenantChange;
   ROUTER click (data attributes of what was clicked); a one-second tick for state checks, the clock, hints and stuck detection.
   Hints: after N seconds in the chat (self mode) or on the facilitator console (facilitated mode). Stuck: 40 seconds with no progress.
   Engagement signal (DC-26): U.store "exp.sessions", this browser only. Everything the engine seeds or computes is labeled
   simulated or modeled. Fictional sample data only; names come from data, never from literals. Prefix: exp-. ===== */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=U.esc;
const CHAN="falconaire-exp",SKEY="exp.sessions",STUCK=40,MAXCLOCK=180;
const LABEL={fact:"Prototype fact",modeled:"Modeled",hypothesis:"Hypothesis",simulated:"Simulated"};
const LDESC={fact:"This screen exists and runs in the prototype today.",modeled:"A sample or computed value, not measured in a real organization.",hypothesis:"A working assumption not yet tested with a buyer.",simulated:"Scripted in the prototype. No live connection, run or enforcement."};
/* roles a buyer can pick; each maps to an existing persona */
const ROLES=[["cfo","CFO","cfo"],["coo","COO","coo"],["ciso","CISO","ciso"],["cio","CIO","exec"],["ceo","CEO","ceo"],["chro","CHRO","chro"],["caio","CAIO","caio"]];
const personaOf=r=>{const x=ROLES.find(a=>a[0]===r);return x?x[2]:(G(()=>PERSONAS[r],null)?r:"exec")};
const roleName=r=>{const x=ROLES.find(a=>a[0]===r);return x?x[1]:r};
const MS=[];const BY={};const SUBS={};
const chip=(k,t)=>`<span class="exp-chip exp-${E(k)}" title="${E(LDESC[k]||"")}">${E(LABEL[k]||k)}</span>${t?` <span class="exp-ct">${E(t)}</span>`:""}`;
const fmt=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
const tName=t=>G(()=>DATA.tenantInfo(t).org,null)||G(()=>(SCN.list[t]||{}).n,null)||t;
const curTenant=()=>G(()=>DATA.tenant(),null)||G(()=>SCN.cur,"core");
const scrName=id=>G(()=>(SCREENS.find(s=>s[0]===id)||[])[1],null)||id;
const scrExists=id=>G(()=>SCREENS.some(s=>s[0]===id),false);

/* ---------- registry ---------- */
function register(m){if(!m||!m.id||!Array.isArray(m.checkpoints))return false;m.screens=m.screens||[];m.neutral=m.neutral||[];
 const i=MS.findIndex(x=>x.id===m.id);if(i>=0)MS[i]=m;else MS.push(m);BY[m.id]=m;return true}
function roleOk(m,r){return !r||m.role==="any"||(Array.isArray(m.role)&&m.role.indexOf(r)>=0)}
function tenOk(m,t){return !t||m.tenants==="any"||!m.tenants||(Array.isArray(m.tenants)&&m.tenants.indexOf(t)>=0)}
function list(o){o=o||{};return MS.filter(m=>roleOk(m,o.role)&&tenOk(m,o.tenant))}
/* a mission whose screens show only the core sample runs on the core tenant and says so */
function needsCore(m){return m.screens.some(s=>m.neutral.indexOf(s)<0&&G(()=>DATA.screenMode(s),"core")==="core")}

/* ---------- events ---------- */
function on(ev,fn){(SUBS[ev]=SUBS[ev]||[]).push(fn);return()=>{const a=SUBS[ev]||[];const i=a.indexOf(fn);if(i>=0)a.splice(i,1)}}
function emit(ev,data){(SUBS[ev]||[]).slice().forEach(f=>{try{f(data)}catch(e){console.error("EXP "+ev,e)}});G(()=>{if(W.EVENTS&&EVENTS.emit)EVENTS.emit("exp."+ev,{mission:cur&&cur.m.id,data:data&&(data.id||data.cp||"")},{source:"exp"})})}

/* ---------- state ---------- */
let cur=null,tickT=0,chan=null;
const now=()=>Date.now();
const elapsed=()=>cur?(((cur.endT||now())-cur.t0)/1000):0;
const nextCp=()=>cur?cur.m.checkpoints.find(c=>!cur.done[c.id]):null;
function state(){if(!cur)return{running:false,last:G(()=>W.EXP._last,null)};const n=nextCp();
 return{running:true,mission:cur.m.id,title:cur.m.title,mode:cur.mode,role:cur.role,tenant:curTenant(),company:cur.company,ranOn:cur.ranOn,
  elapsed:Math.round(elapsed()),clock:cur.m.clock,screen:G(()=>S.screen,""),checkpoint:n?n.id:null,
  done:Object.keys(cur.done),checkpoints:cur.m.checkpoints.map(c=>({id:c.id,t:c.t,done:!!cur.done[c.id],skipped:!!(cur.done[c.id]&&cur.done[c.id].skipped),at:cur.done[c.id]?cur.done[c.id].at:null})),
  next:n?{id:n.id,t:n.t,hint:n.hint&&n.hint.text,claim:n.claim}:null,stuck:cur.stuck,success:!!cur.success,claims:cur.claims.slice(),ripples:cur.ripples.map(r=>r.summary),hints:cur.hints.slice()}}

/* ---------- start and stop ---------- */
function applyTenant(t){if(curTenant()===t)return true;const ok=G(()=>SCN.set(t),false);if(!ok)G(()=>DATA.setTenant(t));return curTenant()===t}
function start(id,o){o=o||{};const m=BY[id];if(!m)return false;if(cur)stop({quiet:true,keep:true});
 G(()=>{if(W.SHOW&&SHOW.state&&SHOW.state.demo)SHOW.exit({stay:true})});
 const role=o.role||(m.role==="any"?"cio":(Array.isArray(m.role)?m.role[0]:"cio"));
 const want=o.tenant||curTenant()||"core";
 const prev={persona:G(()=>S.persona,null),tenant:curTenant()};
 const ranOn=needsCore(m)?"core":want;
 applyTenant(ranOn);
 G(()=>CHATX.close());G(()=>closeDrawer());G(()=>INBOX.closePanel());
 const p=personaOf(role);G(()=>{if(S.persona!==p)NAVX.persona.set(p)});
 cur={m,mode:o.mode==="self"?"self":"facilitated",role,company:want,ranOn,prev,t0:now(),last:now(),done:{},hintAt:{},stuck:null,stuckN:{},
  success:false,claims:[],ripples:[],hints:[],nudges:[],log:[],ctx:{}};
 cur.ctx={tenant:ranOn,company:want,role,mode:cur.mode,mission:m,simulated:true,
  tenantName:tName(ranOn),companyName:tName(want),ripple:r=>ripple(r),note:t=>logx(t),elapsed:()=>elapsed()};
 G(ensureEvents);
 try{if(m.setup)m.setup(cur.ctx)}catch(e){console.error("EXP setup "+id,e)}
 logx("Started "+m.title+(ranOn!==want?" on the "+tName(ranOn)+" sample (these screens are not tenant-aware yet)":""));
 sess("start");G(()=>D.body.classList.add("exp-on"));
 clearTimeout(tickT);tickT=setTimeout(tick,1000);
 G(()=>{const u=new URL(location.href);u.searchParams.set("exp",id);u.searchParams.set("mode",cur.mode==="self"?"self":"facilitated");u.searchParams.set("role",role);u.searchParams.set("tenant",want);history.replaceState(null,"",u)});
 emit("start",{id,mode:cur.mode,role,tenant:ranOn,company:want});paint();send();
 if(m.go)G(()=>go(m.go));else if(G(()=>S.screen,"")==="showroom")G(()=>go("home"));
 return true}
function stop(o){o=o||{};if(!cur)return false;clearTimeout(tickT);const was=cur;was.endT=was.endT||now();sess("end");
 W.EXP._last=sessionSnapshot(was);
 G(()=>{if(was.m.teardown)was.m.teardown(was.ctx)});
 cur=null;G(()=>D.body.classList.remove("exp-on"));
 G(()=>{const u=new URL(location.href);["exp","mode","role","tenant"].forEach(k=>u.searchParams.delete(k));history.replaceState(null,"",u)});
 if(!o.keep){G(()=>{if(was.prev.tenant)applyTenant(was.prev.tenant)});G(()=>{if(was.prev.persona&&S.persona!==was.prev.persona)NAVX.persona.set(was.prev.persona)})}
 emit("end",{id:was.m.id,success:was.success,secs:Math.round((was.endT-was.t0)/1000)});
 paint();trailClose();send({ended:true});if(!o.quiet&&!o.stay)G(()=>go("showroom"));return true}

/* ---------- signals ---------- */
function signal(ev){if(!cur||!ev)return;const m=cur.m;
 for(const c of m.checkpoints){if(cur.done[c.id])continue;let hit=false;try{hit=!!c.when(ev,cur.ctx)}catch(e){hit=false}
  if(hit){fire(c,ev);break}}
 if(!cur)return;
 if(!cur.success){let ok=false;try{ok=m.success?!!m.success(cur.ctx):m.checkpoints.every(c=>cur.done[c.id])}catch(e){ok=false}if(ok)succeed()}}
function fire(c,ev,o){o=o||{};cur.done[c.id]={at:Math.round(elapsed()),skipped:!!o.skipped};cur.last=now();cur.stuck=null;
 if(c.claim&&!o.skipped)cur.claims.push({cp:c.id,k:c.claim.k,t:c.claim.t});
 logx((o.skipped?"Skipped: ":"Done: ")+c.t);
 emit("checkpoint",{id:c.id,t:c.t,skipped:!!o.skipped,claim:o.skipped?null:c.claim||null,at:cur.done[c.id].at});
 if(c.ripple&&!o.skipped){let r=null;try{r=c.ripple(cur.ctx,ev)}catch(e){r=null;console.error("EXP ripple",e)}if(r)ripple(r)}
 paint();send()}
function succeed(){if(!cur||cur.success)return;cur.success=true;cur.endT=now();logx("Success in "+fmt(elapsed()));sess("success");
 let db=null;try{db=cur.m.debrief?cur.m.debrief(cur.ctx):null}catch(e){db=null}cur.debrief=db;
 emit("success",{id:cur.m.id,secs:Math.round(elapsed()),debrief:db});paint();send()}
function skip(){const c=nextCp();if(c){fire(c,{kind:"skip"},{skipped:true});signal({kind:"tick"})}}
function recover(){const c=nextCp();if(!c)return false;logx("Recover: "+c.t);cur.last=now();cur.stuck=null;
 try{if(c.recover)c.recover(cur.ctx);else if(c.screen)go(c.screen)}catch(e){}paint();send();return true}
function logx(t){if(!cur)return;cur.log.push({at:Math.round(elapsed()),t});if(cur.log.length>60)cur.log.shift()}

/* one tick a second (a timeout chain, never an interval): state checks, clock, hints, stuck detection */
function tick(){if(!cur)return;signal({kind:"tick"});if(!cur)return;
 const c=nextCp(),idle=(now()-cur.last)/1000;
 if(c&&!cur.success){
  if(c.hint&&!cur.hintAt[c.id]&&idle>=(c.hint.after||20)*(W.EXP.hintScale||1)){cur.hintAt[c.id]=Math.round(elapsed());hint(c)}
  if(idle>=(W.EXP.STUCK||STUCK)&&cur.stuck!==c.id){cur.stuck=c.id;cur.stuckN[c.id]=(cur.stuckN[c.id]||0)+1;logx("Stuck at: "+c.t);sess("stuck");emit("stuck",{id:c.id,t:c.t,secs:Math.round(idle)});paint()}}
 clock();send();tickT=setTimeout(tick,1000)}
function hint(c){const text=c.hint.text;cur.hints.push({cp:c.id,text,at:Math.round(elapsed())});emit("hint",{id:c.id,text,mode:cur.mode});
 if(cur.mode==="self")chatHint(text);paint()}
/* self mode: the hint arrives in the chat, in a coach thread of its own, and in the mission card */
function chatHint(text){G(()=>{if(!W.CHATX)return;if(!cur.thread||!CHATX.hasThread(cur.thread.id))cur.thread=CHATX.newThread("Coach: "+cur.m.title);
  CHATX.activate(cur.thread.id);CHATX.sayAI(cur.thread,`<p><b>Coach.</b> ${E(text)}</p><p class="small muted">Simulated coaching from the prototype, not a person.</p>`,{stream:false,lin:null});
  if(!cur.chatOpened){cur.chatOpened=true;const nf=CHATX.noFocus;CHATX.noFocus=true;CHATX.open("chat");CHATX.noFocus=nf}})}

/* audit entries are read a tick later: a dry run (the connectivity sandbox) audits and then removes its entries, and those never count */
const kept=e=>G(()=>typeof AUDIT==="undefined"||AUDIT.indexOf(e)>=0,true);
G(()=>HOOKS.on("audit",e=>{if(!cur)return;setTimeout(()=>{if(kept(e))signal({kind:"audit",a:String(e&&e.a||""),d:String(e&&e.d||""),s:e&&e.s,entry:e})},0)},{id:"exp-audit"}));
G(()=>HOOKS.on("beforeGo",(s,arg)=>signal({kind:"go",screen:s,arg}),{id:"exp-go"}));
G(()=>HOOKS.on("afterRender",s=>{signal({kind:"render",screen:s});if(cur)G(paintHud)},{id:"exp-render",order:80}));
G(()=>HOOKS.on("afterOpenDrawer",el=>signal({kind:"drawer",el}),{id:"exp-drawer"}));
/* EVENTS (mod_zevt) loads after this module: subscribe on the first start */
let evOn=false;const ensureEvents=()=>{if(evOn||!W.EVENTS||!EVENTS.on)return;evOn=true;EVENTS.on("*",(ev,pl)=>{if(cur&&ev&&!/^exp\.(start|stop|end|checkpoint|hint|ripple|success|stuck|debrief|state|nudge|claim|recover|skip)$/.test(ev.id))signal({kind:"event",type:ev.id,payload:pl||{}})})};
G(()=>HOOKS.on("tenantChange",t=>signal({kind:"tenant",tenant:t}),{id:"exp-tenant"}));
G(()=>ROUTER.on("click",(e,t)=>{if(!cur)return;const el=t&&t.closest?t.closest("button,a,[role=tab],[data-pp2-tab],[data-invpick],[data-rel-open]"):null;if(!el||el.closest("#expHud,#expTrail"))return;
 signal({kind:"click",el,data:Object.assign({},el.dataset),text:String(el.textContent||"").trim().slice(0,80)})},{id:"exp-click"}));

/* ---------- ripples (DC-41): before and after along the chains and the roll-up rule ---------- */
const arr=x=>Array.isArray(x)?x:[];
const rows=e=>arr(G(()=>DATA.get(e),[]));
const isCore=()=>curTenant()==="core";
function krsOf(oid){if(isCore()&&W.EXE&&EXE.E){const set=G(()=>EXE.E.krw[oid],null);return arr(EXE.E.krs).filter(k=>k.o===oid).map(k=>({k,w:set&&set.w&&set.w[k.id]!=null?+set.w[k.id]:1,cur:+G(()=>EXE.krCur(k),k.cur)}))}
 return rows("key_results").filter(k=>k.o===oid).map(k=>({k,w:1,cur:+k.cur}))}
function objName(oid){return (G(()=>S.exe.objs.find(o=>o.id===oid),null)||rows("objectives").find(o=>o.id===oid)||{n:oid}).n}
/* objective score = weighted mean of key result attainment (ROLLUP.att, ROLLUP.wmean); sub replaces one key result's value */
function objScore(oid,sub){const ks=krsOf(oid);if(!ks.length)return null;const R=W.ROLLUP||{};
 const xs=ks.map(x=>{const c=sub&&sub.kr===x.k.id?+sub.to:x.cur;const a=R.att?R.att(isFinite(c)?c:x.k.start,x.k.tgt,x.k.start):0;return{a,w:x.w}});
 const p=R.wmean?R.wmean(xs):null;return p==null?null:Math.round(p*1000)/10}
function objectivesOfProject(pid){if(isCore()){const w=G(()=>S.exe.links[pid],null)||{};const ks=Object.keys(w).filter(o=>w[o]>0);if(ks.length)return ks.map(o=>({id:o,w:w[o]}))}
 const p=rows("projects").find(x=>x.id===pid);return p&&p.obj?[{id:p.obj,w:1}]:[]}
const cash=v=>G(()=>U.moneyShort(v),null)||("$"+Math.round(v));
function node(level,id,label,before,after,unit,o){return Object.assign({level,id:id||"",label:label||"",before,after,unit:unit||"",fmt:(o&&o.fmt)||null},o||{})}
/* money moves an objective score only through a stated, modeled sensitivity: every 1% of the line's approved budget brought back
   under plan adds half a point per unit of weight, capped at 5 points (and the reverse for an overrun that grows) */
const SENS="Modeled sensitivity: each 1% of the line's approved budget brought back under plan adds 0.5 points times the project's weight on the objective, capped at 5 points. Key results do not change; dollar figures are modeled.";
function invoiceTrail(r){const id=r.id;const inv=rows("invoices").find(i=>i.id===id)||G(()=>INVOICES.find(i=>i.id===id),null);if(!inv)return null;
 const ch=isCore()?G(()=>ZLINK.chains.invoiceToProject(id),null):null;
 const lines=rows("budget_lines").length?rows("budget_lines"):arr(G(()=>S.bud.lines,[]));
 let lid=(ch&&ch.line)||inv.line||"",pid=(ch&&ch.proj)||inv.p||"";
 let line=lines.find(l=>l.id===lid)||lines.find(l=>l.p===pid)||null;if(line&&!pid)pid=line.p;
 const amt=+inv.amt||0,dec=String(r.decision||"");const delta=/hold|reject/i.test(dec)?-amt:0;
 const out=[node("record",id,(inv.vendor?inv.vendor+" invoice":"Invoice")+(dec?" ("+dec.toLowerCase()+")":""),amt,delta?0:amt,"$",{fmt:"money",note:delta?"Not paid this period":"Paid as billed"})];
 let dv=0,appr=1;
 if(line){appr=+line.appr||1;const v0=(+line.fcst||0)-appr;dv=delta;out.push(node("line",line.id,line.n,v0,v0+delta,"$",{fmt:"money",note:"Forecast minus approved (variance)",good:"down"}))}
 const proj=rows("projects").find(p=>p.id===pid)||G(()=>PROJ.find(p=>p.id===pid),null);
 if(proj)out.push(node("project",proj.id,proj.n,null,null,"",{note:delta?"Spend this period lower by "+cash(amt):"No change to spend"}));
 objectivesOfProject(pid).forEach(o=>{const b=objScore(o.id);if(b==null)return;const adj=Math.max(-5,Math.min(5,(-dv/appr*100)*0.5*o.w));
  out.push(node("objective",o.id,objName(o.id),b,Math.round((b+adj)*10)/10,"pts",{note:"Weight "+Math.round(o.w*100)+"%",good:"up"}))});
 return{nodes:out,rule:SENS}}
function krTrail(r){const kr=(isCore()&&W.EXE?arr(EXE.E.krs):rows("key_results")).find(k=>k.id===r.kr);if(!kr)return null;
 const curv=isCore()&&W.EXE?+G(()=>EXE.krCur(kr),kr.cur):+kr.cur;const from=isFinite(curv)?curv:+kr.start;const to=+r.to;
 const out=arr(r.via).slice();
 out.push(node("result",kr.id,kr.n,from,to,(kr.u||"").trim(),{note:"Target "+kr.tgt+(kr.u||""),good:+kr.tgt<+kr.start?"down":"up"}));
 const b=objScore(kr.o),a=objScore(kr.o,{kr:kr.id,to});if(b!=null)out.push(node("objective",kr.o,objName(kr.o),b,a,"pts",{good:"up",note:"Weighted mean of key result attainment"}));
 return{nodes:out,rule:r.rule||"Modeled: the key result moves by the stated amount; the objective score is recomputed with the roll-up rule (attainment, weights, floor)."}}
function ripple(r){if(!r)return null;let t=null;
 if(r.kind==="invoice")t=invoiceTrail(r);else if(r.kind==="kr")t=krTrail(r);else if(Array.isArray(r.nodes))t={nodes:r.nodes,rule:r.rule||""};
 if(!t||!t.nodes.length)return null;
 const rec={id:"RP-"+(cur?cur.ripples.length+1:0),cause:r.cause||r.title||"A decision",kind:r.kind||"custom",nodes:t.nodes,rule:t.rule,label:"modeled",at:Math.round(elapsed()),tenant:curTenant()};
 const obj=t.nodes.filter(n=>n.level==="objective");rec.summary=rec.cause+": "+(obj.length?obj.map(n=>n.label+" "+fmtV(n.before,n)+" to "+fmtV(n.after,n)).join("; "):t.nodes.map(n=>n.label).join(" > "));
 if(cur){cur.ripples.push(rec);logx("Ripple: "+rec.summary)}
 lastTrail=rec;trailShow(rec);emit("ripple",rec);send();return rec}
const fmtV=(v,n)=>v==null?"":n.fmt==="money"?cash(v):(Math.round(v*10)/10)+(n.unit&&n.unit!=="$"?(n.unit==="pts"?" pts":/^%/.test(n.unit)?n.unit:" "+n.unit):"");
const LV={record:"Record",line:"Budget line",project:"Project",result:"Key result",objective:"Objective score",queue:"Queue",metric:"Metric",risk:"Risk",release:"Release"};
let lastTrail=null;
function trailHTML(rec){const dir=n=>{if(n.level==="record"||n.before==null||n.after==null||n.before===n.after)return"same";const up=n.after>n.before;return (n.good==="down"?!up:up)?"good":"bad"};
 return `<div class="exp-tr-h"><div><span class="exp-eye">Cause and effect</span><h3>${E(rec.cause)}</h3></div><button type="button" class="btn quiet exp-x" data-exp-act="trail-x" aria-label="Close the ripple trail">&times;</button></div>
 <ol class="exp-trail">${rec.nodes.map((n,i)=>`<li class="exp-tn exp-${dir(n)}"><span class="exp-lv">${E(LV[n.level]||n.level)}</span><b>${E(n.label)}</b>${n.before!=null||n.after!=null?`<span class="exp-ba"><s>${E(fmtV(n.before,n))}</s> <i aria-hidden="true">&rarr;</i> <em>${E(fmtV(n.after,n))}</em></span>`:""}${n.note?`<span class="exp-nt">${E(n.note)}</span>`:""}</li>${i<rec.nodes.length-1?'<li class="exp-arrow" aria-hidden="true">&rsaquo;</li>':""}`).join("")}</ol>
 <p class="exp-rule">${chip("modeled")} ${E(rec.rule)}</p>`}
function trailShow(rec){let h=D.getElementById("expTrail");if(!h){h=D.createElement("section");h.id="expTrail";h.className="exp-trailbox glass";h.setAttribute("role","region");h.setAttribute("aria-label","Ripple trail");D.body.appendChild(h)}
 h.innerHTML=trailHTML(rec);h.hidden=false}
function trailClose(){const h=D.getElementById("expTrail");if(h){h.hidden=true;h.innerHTML=""}}

/* ---------- the mission card (HUD) ---------- */
function clock(){const h=D.getElementById("expHud");if(h)h.classList.toggle("exp-left",!!G(()=>CHATX.isOpen(),false)); /* never over the chat input */
 const b=D.querySelector("#expHud .exp-clock");if(!b||!cur)return;const el=elapsed(),c=cur.m.clock||MAXCLOCK;
 b.className="exp-clock"+(el>c?" over":el>c*.8?" warn":"");const i=b.querySelector("i");if(i)i.style.width=Math.min(100,el/c*100).toFixed(0)+"%";const t=b.querySelector("b");if(t)t.textContent=fmt(el)+" of "+fmt(c)}
function hudHTML(){if(!cur)return"";const m=cur.m,n=nextCp(),hd=cur.hints.filter(h=>!n||h.cp===n.id).slice(-1)[0],nd=cur.nudges.slice(-1)[0];
 const cps=m.checkpoints.map((c,i)=>{const d=cur.done[c.id];return `<li class="${d?(d.skipped?"skip":"done"):c===n?"now":""}"><span class="exp-n">${d&&!d.skipped?"&#10003;":i+1}</span><span>${E(c.t)}</span></li>`}).join("");
 const claims=cur.claims.map(c=>`<li>${chip(c.k,c.t)}</li>`).join("");
 const db=cur.debrief;
 return `<div class="exp-hh"><div><span class="exp-eye">${cur.mode==="self"?"Self-serve experience":"Experience, with a presenter"} &middot; ${E(roleName(cur.role))} &middot; ${E(tName(cur.ranOn))}</span><h3>${E(m.title)}</h3></div>
  <button type="button" class="btn quiet exp-x" data-exp-act="min" aria-expanded="${!cur.min}" aria-label="${cur.min?"Show":"Hide"} the mission card">${cur.min?"+":"&minus;"}</button><button type="button" class="btn quiet exp-x" data-exp-act="stop" aria-label="End the experience">&times;</button></div>
 <div class="exp-clock"><i></i><b>${fmt(elapsed())} of ${fmt(m.clock)}</b></div>
 ${cur.min?"":`<p class="exp-brief"><b>Your job:</b> ${E(m.brief)}</p>
 <details class="exp-more"${Object.keys(cur.done).length||cur.success?"":" open"}><summary>Done when, and what is simulated</summary><p class="exp-goal"><b>Done when:</b> ${E(m.goal)}</p>
 ${cur.ranOn!==cur.company?`<p class="exp-note">${chip("simulated")} These screens are not tenant-aware yet, so this runs on the ${E(tName(cur.ranOn))} sample. The leave-behind speaks to ${E(tName(cur.company))}.</p>`:""}
 ${m.situation?`<p class="exp-note">${chip("simulated")} ${E(typeof m.situation==="function"?G(()=>m.situation(cur.ctx),""):m.situation)}</p>`:""}</details>
 <ol class="exp-cps">${cps}</ol>
 ${cur.mode==="self"&&hd&&!cur.success?`<p class="exp-hint" role="status"><b>Hint:</b> ${E(hd.text)}</p>`:""}
 ${nd&&!cur.success?`<p class="exp-hint" role="status"><b>Nudge:</b> ${E(nd)}</p>`:""}
 ${cur.stuck&&cur.mode==="self"&&!cur.success?`<div class="row"><button type="button" class="btn" data-exp-act="recover">Show me</button><button type="button" class="btn quiet" data-exp-act="skip">Skip this step</button></div>`:""}
 ${claims?`<ul class="exp-claims" aria-label="What you have seen">${claims}</ul>`:""}
 ${cur.success?`<div class="exp-win" role="status"><b>Done in ${fmt((cur.endT-cur.t0)/1000)}.</b> ${db?E(db.what||""):""}${db&&db.mean?`<p class="small">${E(db.mean)}</p>`:""}
  <div class="row"><button type="button" class="btn primary" data-exp-act="story">Leave-behind</button>${lastTrail?`<button type="button" class="btn quiet" data-exp-act="trail">Show the ripple</button>`:""}<button type="button" class="btn quiet" data-exp-act="stop">Finish</button></div></div>`:lastTrail&&cur.ripples.length?`<div class="row"><button type="button" class="btn quiet" data-exp-act="trail">Show the ripple</button></div>`:""}`}`}
function paintHud(){let h=D.getElementById("expHud");if(!cur){if(h)h.remove();return}
 if(!h){h=D.createElement("section");h.id="expHud";h.className="exp-hud glass";h.setAttribute("role","region");h.setAttribute("aria-label","Experience mission card");D.body.appendChild(h)}
 h.innerHTML=hudHTML();clock()}
const paint=()=>G(paintHud);
ROUTER.on("click","[data-exp-act]",(e,t)=>{const a=t.dataset.expAct;e.preventDefault();
 if(a==="stop")stop();else if(a==="min"){if(cur){cur.min=!cur.min;paint()}}
 else if(a==="recover")recover();else if(a==="skip")skip();
 else if(a==="trail"){if(lastTrail)trailShow(lastTrail)}else if(a==="trail-x")trailClose();
 else if(a==="story"){G(()=>EXP.openStory())}},{id:"exp-act"});

/* ---------- the channel to the facilitator console ---------- */
G(()=>{chan=new BroadcastChannel(CHAN);chan.onmessage=e=>onMsg(e.data||{})});
let lastSent=0;
function send(extra){if(!chan)return;const t=now();if(!extra&&t-lastSent<250)return;lastSent=t;
 const st=state();G(()=>chan.postMessage(Object.assign({type:"state",from:"buyer",mission:st.mission||null,checkpoint:st.checkpoint||null,screen:G(()=>S.screen,""),elapsed:st.elapsed||0,st,lastRipple:lastTrail&&cur?lastTrail:null},extra||{})))}
function onMsg(m){if(!m||m.from==="buyer"||!m.type)return;if(G(()=>W.EXP.console.isOn(),false))return; /* the console window never acts as a buyer */
 if(m.type==="hello"){send({hello:true});return}
 if(m.type==="start"&&BY[m.id]){start(m.id,{role:m.role,tenant:m.tenant,mode:"facilitated"});return}
 if(!cur)return;
 if(m.type==="nudge"){const n=nextCp();const t=String(m.text||(n&&n.hint&&n.hint.text)||"").slice(0,240);if(t){cur.nudges.push(t);logx("Nudge: "+t);paint();send({})}}
 else if(m.type==="claim"){const c=cur.claims.slice(-1)[0];if(c){G(()=>toast(LABEL[c.k]+": "+c.t,"info"))}send({})}
 else if(m.type==="recover")recover();else if(m.type==="skip")skip();else if(m.type==="stop")stop()}
const post=msg=>G(()=>chan&&chan.postMessage(Object.assign({from:"console"},msg)));

/* ---------- engagement signal (DC-26): this browser only ---------- */
function sessionSnapshot(c){return{id:c.sid||null,mission:c.m.id,title:c.m.title,role:c.role,tenant:c.ranOn,company:c.company,mode:c.mode,
 started:new Date(c.t0).toISOString(),secs:Math.round(((c.endT||now())-c.t0)/1000),finished:!!c.success,
 checkpoints:c.m.checkpoints.filter(x=>c.done[x.id]).map(x=>({id:x.id,t:x.t,at:c.done[x.id].at,skipped:c.done[x.id].skipped})),
 stuck:Object.keys(c.stuckN),ripples:c.ripples.map(r=>({cause:r.cause,nodes:r.nodes,rule:r.rule,summary:r.summary})),claims:c.claims.slice(),
 debrief:c.debrief||G(()=>c.m.debrief(c.ctx),null),log:c.log.slice()}}
function sess(kind){if(!cur)return;const L=arr(G(()=>U.store.get(SKEY,[]),[]));if(!cur.sid){cur.sid="XS-"+(now().toString(36))}
 const snap=sessionSnapshot(cur);snap.id=cur.sid;snap.event=kind;const i=L.findIndex(x=>x.id===cur.sid);
 const lite=Object.assign({},snap);delete lite.log;if(i>=0)L[i]=lite;else L.unshift(lite);if(L.length>30)L.length=30;G(()=>U.store.set(SKEY,L))}
function sessions(){return arr(G(()=>U.store.get(SKEY,[]),[]))}

/* ---------- lint ---------- */
const BANNED=/\b(Fabric|Trellis|Oukala|Shaheen)\b/;
function lint(list_){const bad=[];const sent=s=>(String(s||"").match(/[.!?](\s|$)/g)||[]).length;
 (list_||MS).forEach(m=>{m.screens=m.screens||[];m.checkpoints=m.checkpoints||[];const t=m.id;
  if(!m.title)bad.push(t+": no title");
  if(!m.brief||sent(m.brief)!==1)bad.push(t+": brief must be one sentence");
  if(!m.goal)bad.push(t+": no goal");
  if(!(m.clock>0))bad.push(t+": no clock");else if(m.clock>MAXCLOCK)bad.push(t+": clock "+m.clock+" s is over "+MAXCLOCK+" s");
  if(!m.checkpoints.length)bad.push(t+": no checkpoints");
  if(!m.role)bad.push(t+": no role");
  if(!m.labels||!m.labels.length||m.labels.some(k=>!LABEL[k]))bad.push(t+": labels missing or unknown");
  if(!m.checkpoints.some(c=>c.ripple))bad.push(t+": no ripple the buyer sees");
  if(!m.screens.length)bad.push(t+": names no screen");
  m.screens.forEach(s=>{if(!scrExists(s))bad.push(t+": screen "+s+" is not registered")});
  m.checkpoints.forEach(c=>{const k=t+"/"+c.id;if(typeof c.when!=="function")bad.push(k+": no when()");
   if(!c.t)bad.push(k+": no title");if(!c.hint||!c.hint.text||!(c.hint.after>0))bad.push(k+": hint missing");
   if(!c.claim||!LABEL[c.claim.k]||!c.claim.t)bad.push(k+": claim missing or unlabeled");
   if(c.screen&&!scrExists(c.screen))bad.push(k+": screen "+c.screen+" is not registered")});
  const txt=[m.title,m.brief,m.goal,typeof m.situation==="string"?m.situation:""].concat(m.checkpoints.map(c=>[c.t,c.hint&&c.hint.text,c.claim&&c.claim.t].join(" "))).join(" ");
  if(/—/.test(txt))bad.push(t+": em dash in text");if(BANNED.test(txt))bad.push(t+": banned name in text")});
 return bad}

/* ---------- Showroom home: Experiences first (pick role and company, then a mission or Your Monday) ---------- */
G(()=>{S.exph=S.exph||{role:"cfo",tenant:null}});
const selfLink=(id,role,tenant)=>{const u=new URL(location.href);u.search="";u.hash="";u.searchParams.set("exp",id);u.searchParams.set("mode","self");u.searchParams.set("role",role);u.searchParams.set("tenant",tenant);return u.toString()};
const consoleLink=()=>{const u=new URL(location.href);u.search="";u.hash="";u.searchParams.set("exp","console");return u.toString()};
function companies(){return arr(G(()=>DATA.tenants(),[])).map(t=>({id:t.id,n:t.org||t.n,kind:t.kind||t.ind||"",gen:!!t.generated}))}
function homeHTML(){const P=S.exph;const ten=P.tenant||curTenant()||"core";const ms=list({role:P.role});const cs=companies();const pg=!!W.PACKGEN;
 const ownTen=cs.filter(c=>c.gen||["core","health","mining","storage"].indexOf(c.id)<0);
 return `<section class="sr-card glass exp-home" aria-label="Experiences"><div class="sr-ch"><h3>Experiences</h3><span class="sr-pill">3 minutes each</span>${chip("simulated")}</div>
 <p class="muted">The buyer drives. Pick who they are and which company, then a mission. A presenter coaches from the console in a second window, or the product coaches by itself in self-serve mode. Situations are seeded and every ripple is modeled.</p>
 <div class="exp-steps"><div class="exp-step"><span class="exp-eye">1. Who is driving</span><div class="row exp-roles" role="radiogroup" aria-label="Role">${ROLES.map(r=>`<button type="button" class="btn ${P.role===r[0]?"primary":"quiet"}" role="radio" aria-checked="${P.role===r[0]}" data-exp-role="${r[0]}">${E(r[1])}</button>`).join("")}</div></div>
 <div class="exp-step"><span class="exp-eye">2. Which company</span>${pg?`<div class="row"><button type="button" class="btn ${ownTen.length?"quiet":"primary"}" data-exp-bring="1">Bring your company</button><span class="muted small">About five minutes: industry, size and the pain. Generated in this browser and labeled simulated.</span></div>`:""}
  <div class="row exp-cos" role="radiogroup" aria-label="Company">${(ownTen.concat(cs.filter(c=>ownTen.indexOf(c)<0))).map(c=>`<button type="button" class="btn ${ten===c.id?"primary":"quiet"}" role="radio" aria-checked="${ten===c.id}" data-exp-ten="${E(c.id)}">${E(c.n)}${c.gen?" (generated)":""}</button>`).join("")}</div>${pg?"":`<p class="muted small">Bring your company appears here once the company generator is in the build; until then pick the closest sample.</p>`}</div>
 <div class="exp-step"><span class="exp-eye">3. The mission</span><div class="grid g2 exp-ms">${ms.map(m=>`<article class="exp-mc" data-exp-card="${E(m.id)}"><div class="sr-ch"><h4>${E(m.title)}</h4><span class="sr-pill">${fmt(m.clock)}</span></div>
  <p class="small">${E(m.brief)}</p><p class="muted small">Screens: ${m.screens.map(s=>E(scrName(s))).join(", ")}${needsCore(m)&&ten!=="core"?`. Runs on the ${E(tName("core"))} sample: these screens are not tenant-aware yet.`:"."}</p>
  <div class="row"><button type="button" class="btn primary" data-exp-start="${E(m.id)}" data-exp-mode="facilitated">Start with a presenter</button><button type="button" class="btn" data-exp-start="${E(m.id)}" data-exp-mode="self">Self-serve</button><button type="button" class="btn quiet" data-exp-copy="${E(m.id)}" title="${E(selfLink(m.id,P.role,ten))}">Copy self-serve link</button></div></article>`).join("")||`<p class="muted">No mission for this role yet. Your Monday works for every role.</p>`}</div></div></div>
 <div class="row"><button type="button" class="btn" data-exp-console="1">Open the facilitator console</button><span class="muted small">Opens a second window (<code>?exp=console</code>) that follows the buyer's window on this device.</span></div>
 ${sessions().length?`<p class="muted small">This browser: ${sessions().length} experience${sessions().length===1?"":"s"} started, ${sessions().filter(s=>s.finished).length} finished. Stored here only.</p>`:""}</section>`}
G(()=>{if(W.SHOW)SHOW.expHome=homeHTML});
ROUTER.on("click","[data-exp-role],[data-exp-ten],[data-exp-start],[data-exp-copy],[data-exp-console],[data-exp-bring]",(e,t)=>{const d=t.dataset,P=S.exph;
 if(d.expRole){P.role=d.expRole;G(()=>render());return}
 if(d.expTen){P.tenant=d.expTen;G(()=>render());return}
 if(d.expStart){start(d.expStart,{role:P.role,tenant:P.tenant||curTenant(),mode:d.expMode});return}
 if(d.expCopy){const l=selfLink(d.expCopy,P.role,P.tenant||curTenant());G(()=>navigator.clipboard.writeText(l).catch(()=>{}));G(()=>toast("Self-serve link copied: "+l,"good"));return}
 if(d.expConsole){const w=G(()=>W.open(consoleLink(),"falconaire-exp-console","popup,width=560,height=820"),null);if(!w)G(()=>toast("The browser blocked the second window. Allow pop-ups for this page.","warn"));return}
 if(d.expBring)bring()},{id:"exp-home"});
/* Bring your company: the generator belongs to stream exp-world (PACKGEN.fromAnswers); the engine only asks the questions */
function bring(){if(!W.PACKGEN||!PACKGEN.fromAnswers)return;
 const inds=[...new Set(companies().map(c=>c.kind).filter(Boolean))];
 G(()=>openForm({id:"exp_bring",title:"Bring your company",story:"Four answers build a company in this browser with the same checks as the sample packs. It is labeled simulated and no answer leaves this device.",submit:"Build my company",
  fields:[{k:"name",label:"Company name (made up is fine)",type:"text",req:true},{k:"industry",label:"Industry",type:"text",req:true},{k:"size",label:"People",type:"number",min:50,max:500000},{k:"pain",label:"What hurts most",type:"longtext"}],defaults:{industry:inds[1]||"",size:5000},
  onSubmit:v=>{let r=null;try{r=PACKGEN.fromAnswers({industry:v.industry,size:+v.size||0,pain:v.pain||"",name:v.name})}catch(x){r=null}
   const id=r&&(r.tenant||r.id)||(typeof r==="string"?r:null);if(id){S.exph.tenant=id;setTimeout(()=>G(()=>render()),0);return{toast:"Company built (simulated): "+(G(()=>DATA.tenantInfo(id).org,id))}}
   return{toast:"Could not build it; pick the closest sample company instead"}}}))}

/* ---------- links: ?exp=<mission>&mode=self&role=&tenant= ---------- */
const q=new URLSearchParams(location.search);const qx=q.get("exp");
if(qx&&qx!=="console")setTimeout(()=>{if(!BY[qx])return;const mode=q.get("mode")==="self"?"self":"facilitated";start(qx,{mode,role:q.get("role")||undefined,tenant:q.get("tenant")||undefined})},1300);
setTimeout(()=>{const b=lint();if(b.length&&W.console)console.warn("Experience lint:",b)},1600);

W.EXP=Object.assign(W.EXP||{},{register,list,start,stop,state,on,ripple,lint,signal,skip,recover,missions:()=>MS.slice(),byId:id=>BY[id]||null,
 sessions,needsCore,roles:()=>ROLES.map(r=>({id:r[0],n:r[1],persona:r[2]})),personaOf,post,CHAN,MAXCLOCK,STUCK,LABEL,chip,fmt,tName,scrName,objScore,
 current:()=>cur,lastTrail:()=>lastTrail,selfLink,consoleLink,home:homeHTML,_last:null});
})();
