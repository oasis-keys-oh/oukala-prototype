/* ===== mod_s_exp_console: the facilitator console (backlog DC-40). Opens with ?exp=console in a second window on the same
   device and follows the buyer's window over BroadcastChannel("falconaire-exp"):
     buyer to console  {type:"state", mission, checkpoint, screen, elapsed, st}
     console to buyer  {type:"nudge"|"claim"|"recover"|"skip"|"stop"|"start"|"hello"}
   Shows where the buyer is, the next good nudge, the claim to land when a checkpoint fires, and Recover and Skip when the buyer
   has been stuck for 40 seconds. The console is a sheet over the app in that window; it builds no business screen.
   EXP.console.state() is the last state received (tests). Same machine only; nothing leaves the browser. Prefix: exp-. ===== */
(function(){
const W=window,D=document;const X=W.EXP;if(!X)return;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=U.esc;const arr=x=>Array.isArray(x)?x:[];
const C={on:false,last:null,at:0,seen:{},feed:[],chan:null,pick:{mission:"",role:"cfo",tenant:"core"}};
function post(m){G(()=>C.chan.postMessage(Object.assign({from:"console"},m)))}
function feed(t){C.feed.unshift({at:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),t});if(C.feed.length>25)C.feed.length=25}
function onMsg(m){if(!m||m.from!=="buyer"||m.type!=="state")return;const prev=C.last;C.last=m;C.at=Date.now();const st=m.st||{};
 if(m.ended&&prev&&prev.mission)feed("Experience ended");
 if(st.running){arr(st.checkpoints).forEach(c=>{const k=st.mission+"/"+c.id;if(c.done&&!C.seen[k]){C.seen[k]=1;feed((c.skipped?"Skipped: ":"Checkpoint: ")+c.t)}});
  arr(st.hints).forEach(h=>{const k=st.mission+"/h/"+h.cp+"/"+h.at;if(!C.seen[k]){C.seen[k]=1;feed("Hint due: "+h.text)}});
  if(st.stuck&&!C.seen[st.mission+"/s/"+st.stuck]){C.seen[st.mission+"/s/"+st.stuck]=1;feed("Stuck for 40 seconds")}
  if(st.success&&!C.seen[st.mission+"/ok"]){C.seen[st.mission+"/ok"]=1;feed("Success")}}
 paint()}
function html(){const m=C.last,st=m&&m.st||{},live=m&&Date.now()-C.at<4000;const ms=X.missions();
 const cps=arr(st.checkpoints).map(c=>`<li class="${c.done?(c.skipped?"skip":"done"):st.next&&st.next.id===c.id?"now":""}"><span class="exp-n">${c.done&&!c.skipped?"&#10003;":"&middot;"}</span><span>${E(c.t)}</span>${c.at!=null?`<em>${X.fmt(c.at)}</em>`:""}</li>`).join("");
 const lastClaim=arr(st.claims).slice(-1)[0];const rp=m&&m.lastRipple;
 return `<div class="exp-con-in"><header class="exp-con-h"><div><span class="exp-eye">Facilitator console</span><h2>${st.running?E(st.title):"No experience running"}</h2>
  <p class="small muted">${live?"Following the buyer's window on this device.":"Waiting for the buyer's window. Start an experience there, or below."} Coach; do not drive.</p></div>
  <button type="button" class="btn quiet exp-x" data-exp-con="close" aria-label="Close the console">&times;</button></header>
 ${st.running?`<section class="exp-con-g">
  <div class="exp-con-c glass"><span class="exp-eye">Where the buyer is</span><p><b>${E(X.scrName(st.screen||m.screen||""))}</b></p><p class="small">${E(X.fmt(st.elapsed||0))} of ${E(X.fmt(st.clock||X.MAXCLOCK))} &middot; ${E(st.mode==="self"?"self-serve":"facilitated")} &middot; ${E(X.tName(st.tenant||""))}</p><ol class="exp-cps">${cps}</ol></div>
  <div class="exp-con-c glass"><span class="exp-eye">Next good nudge</span>${st.success?`<p><b>Done.</b> Land the story: open the leave-behind with them.</p>`:st.next?`<p><b>${E(st.next.t)}</b></p><p>${E(st.next.hint||"")}</p><div class="row"><button type="button" class="btn primary" data-exp-con="nudge">Send this nudge to the buyer</button></div>`:""}</div>
  <div class="exp-con-c glass"><span class="exp-eye">Claim to land</span>${lastClaim?`<p>${X.chip(lastClaim.k)} ${E(lastClaim.t)}</p><p class="small muted">They have just seen it. Say it now, in one sentence.</p><div class="row"><button type="button" class="btn" data-exp-con="claim">Show it on their screen</button></div>`:`<p class="small muted">A claim appears here only after the buyer has seen the thing it claims.</p>`}</div>
  <div class="exp-con-c glass ${st.stuck?"exp-stuck":""}"><span class="exp-eye">Recover</span>${st.stuck?`<p><b>Stuck for 40 seconds</b> on: ${E((arr(st.checkpoints).find(c=>c.id===st.stuck)||{}).t||"")}</p>`:`<p class="small muted">Recover takes the buyer to the right screen; Skip marks the step done without its claim.</p>`}
   <div class="row"><button type="button" class="btn ${st.stuck?"primary":""}" data-exp-con="recover">Recover</button><button type="button" class="btn quiet" data-exp-con="skip">Skip this step</button><button type="button" class="btn quiet" data-exp-con="stop">End</button></div></div>
  ${rp?`<div class="exp-con-c glass exp-wide"><span class="exp-eye">Last ripple ${X.chip("modeled")}</span><p><b>${E(rp.cause)}</b></p><p class="small">${E(rp.summary||"")}</p></div>`:""}
 </section>`:`<section class="exp-con-c glass"><span class="exp-eye">Start in the buyer's window</span><div class="row">
  <label class="small" for="expConM">Mission</label><select id="expConM" class="fin" data-exp-conpick="mission">${ms.map(x=>`<option value="${E(x.id)}"${C.pick.mission===x.id?" selected":""}>${E(x.title)}</option>`).join("")}</select>
  <label class="small" for="expConR">Role</label><select id="expConR" class="fin" data-exp-conpick="role">${X.roles().map(r=>`<option value="${r.id}"${C.pick.role===r.id?" selected":""}>${E(r.n)}</option>`).join("")}</select>
  <label class="small" for="expConT">Company</label><select id="expConT" class="fin" data-exp-conpick="tenant">${arr(G(()=>DATA.tenants(),[])).map(t=>`<option value="${E(t.id)}"${C.pick.tenant===t.id?" selected":""}>${E(t.org||t.n)}</option>`).join("")}</select>
  <button type="button" class="btn primary" data-exp-con="start">Start</button></div></section>`}
 <section class="exp-con-c glass exp-wide"><span class="exp-eye">What happened</span><ul class="exp-feed">${C.feed.map(f=>`<li><em>${E(f.at)}</em> ${E(f.t)}</li>`).join("")||"<li class=\"muted\">Nothing yet.</li>"}</ul></section></div>`}
function host(){let h=D.getElementById("expCon");if(!h){h=D.createElement("div");h.id="expCon";h.className="exp-con";h.setAttribute("role","region");h.setAttribute("aria-label","Facilitator console");D.body.appendChild(h)}return h}
function paint(){if(!C.on)return;const h=host();const a=D.activeElement;const keep=a&&a.closest&&a.closest("#expCon select")?a.id:null;h.innerHTML=html();if(keep){const n=D.getElementById(keep);if(n)n.focus()}}
let tk=0;function tick(){if(!C.on)return;paint();if(!C.last||Date.now()-C.at>3000)post({type:"hello"});tk=setTimeout(tick,1500)}
function open(){C.on=true;D.body.classList.add("exp-con-on");G(()=>{C.chan=C.chan||new BroadcastChannel(X.CHAN);C.chan.onmessage=e=>onMsg(e.data)});
 C.pick.mission=C.pick.mission||(X.missions()[0]||{}).id||"";post({type:"hello"});paint();clearTimeout(tk);tk=setTimeout(tick,1500);G(()=>{D.title="Console: "+D.title})}
function close(){C.on=false;clearTimeout(tk);D.body.classList.remove("exp-con-on");const h=D.getElementById("expCon");if(h)h.remove()}
ROUTER.on("click","[data-exp-con]",(e,t)=>{const a=t.dataset.expCon,st=C.last&&C.last.st||{};
 if(a==="close"){close();return}
 if(a==="nudge")post({type:"nudge",text:st.next&&st.next.hint||""});
 else if(a==="claim"||a==="recover"||a==="skip"||a==="stop")post({type:a});
 else if(a==="start")post({type:"start",id:C.pick.mission,role:C.pick.role,tenant:C.pick.tenant});
 feed(a==="start"?"Asked the buyer window to start":"Sent: "+a);paint()},{id:"exp-con"});
ROUTER.on("change","[data-exp-conpick]",(e,t)=>{C.pick[t.dataset.expConpick]=t.value},{id:"exp-conpick"});
X.console={open,close,isOn:()=>C.on,state:()=>C.last,feed:()=>C.feed.slice(),send:post};
if(new URLSearchParams(location.search).get("exp")==="console")setTimeout(open,900);
})();
