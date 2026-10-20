/* ===== mod_s_exp_seats: Two seats (DC-45). window.SEATS. Prefix sts-.
   Two windows on the same machine, each in a seat (a role). Every audited action in one window (HOOKS "audit") is mirrored into the
   other as a simulated arrival: an inbox item, a notification, and the number that moved, each marked "From the other seat".
   Only actions a person took cross (an audit within a few seconds of a click or key press); background bookkeeping stays put.
   Transport: BroadcastChannel("falconaire-seats"), same browser and machine only; nothing leaves the machine and no record changes.
   API: SEATS.roles() · SEATS.pick(role) · SEATS.role() · SEATS.leave() · SEATS.open(role) opens the second window ·
        SEATS.peers() · SEATS.arrivals() · SEATS.available().  Deep link: ?seat=cfo (the seat lives in the address, not in storage).
   Registers a three-minute mission with EXP when the experience engine is present. Everything here is simulated. ===== */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>U.esc(s);
const ROLES={cfo:"Finance",coo:"Operations",cio:"Technology",ciso:"Security",ceo:"Chief executive"};
const ME=(Date.now().toString(36)+Math.random().toString(36).slice(2,7));
const ST={role:null,peers:{},arr:[],muted:false,open:true,n:0};
let CH=null;try{if(typeof BroadcastChannel==="function")CH=new BroadcastChannel("falconaire-seats")}catch(e){CH=null}
const send=m=>{if(!CH||!ST.role)return;try{CH.postMessage(Object.assign({v:1,id:ME,role:ST.role,tenant:G(()=>DATA.tenant(),"core"),at:Date.now()},m))}catch(e){}};
const lab=r=>ROLES[r]||String(r||"").toUpperCase();
/* the number that moved: the first amount or figure in the action, shown as a simulated change in the other seat */
const numOf=e=>{const t=String((e&&e.a)||"")+" "+String((e&&e.d)||"");const m=t.match(/\$\s?[\d,]+(?:\.\d+)?\s?[KMB]?/)||t.match(/\b\d[\d,]*(?:\.\d+)?\s?%/);return m?m[0].replace(/\s+/g,""):null};
/* navigation and display noise is not an action the other seat needs to see */
const NOISE=/^(opened form|opened|viewed|navigated|switched role|scale|lens|search)/i;

function pick(role){if(!ROLES[role])return false;ST.role=role;G(()=>{const u=new URL(location.href);u.searchParams.set("seat",role);history.replaceState(history.state,"",u.toString())});
 send({type:"hello"});paint();G(()=>audit("Two seats (simulated)","This window is the "+lab(role)+" seat"));return true}
function leave(){if(!ST.role)return;send({type:"bye"});ST.role=null;ST.peers={};G(()=>{const u=new URL(location.href);u.searchParams.delete("seat");history.replaceState(history.state,"",u.toString())});paint()}
function openSeat(role){role=ROLES[role]?role:(ST.role==="coo"?"cfo":"coo");if(!ST.role)pick(role==="cfo"?"coo":"cfo");
 let u;try{u=new URL(location.href);u.search="";u.hash="";u.searchParams.set("seat",role);const t=G(()=>DATA.tenant(),"core");if(t&&t!=="core")u.searchParams.set("tenant",t)}catch(e){return null}
 const w=G(()=>W.open(u.toString(),"falconaire-seat-"+role),null);if(!w)G(()=>toast("The browser blocked the second window. Allow pop-ups for this page, or open it yourself with ?seat="+role,"warn"));return w}

function arrive(m){const e=m.entry||{};
 /* the same action repeated within a few seconds (one click that finishes several runs) is one arrival with a count */
 const last=ST.arr[0];if(last&&last.from===m.role&&last.a===String(e.a||"")&&last.d===String(e.d||"")&&Date.now()-last.at<5000){last.count=(last.count||1)+1;last.at=Date.now();paint();return}
 ST.n++;const id="seat:"+m.id+":"+ST.n;const title=lab(m.role)+" seat: "+String(e.a||"an action");
 const a={id,from:m.role,fromLabel:lab(m.role),a:String(e.a||""),d:String(e.d||""),s:String(e.s||""),num:m.num||null,at:Date.now(),sim:true,tenant:m.tenant};
 ST.arr.unshift(a);if(ST.arr.length>30)ST.arr.length=30;ST.muted=true;
 try{
  /* inbox: a simulated item, marked from the other seat (read only: nothing to approve, no record changed) */
  G(()=>{const I=INBOX.state;if(!I||!I.simItems)return;I.simItems.push({id,src:"sim",sid:id,kind:"mention",cat:"From the other seat",ic:"task",title,req:lab(m.role)+" seat",ageH:.01,slaH:24,dueH:24,amt:null,risk:"low",sim:true,
   why:"Simulated: the "+lab(m.role)+" seat in the other window just did this. Two seats run on this machine only.",guard:"Simulated arrival from the other seat. No record changed in this window.",
   ev:[["From","The "+lab(m.role)+" seat (other window)",""],["Action",a.a,""],["Detail",a.d||"None",""]].concat(a.num?[["Number that moved",a.num+" (simulated)","warn"]]:[]),can:{approve:false,reject:false,delegate:false},_p:G(()=>S.persona,"exec"),_at:Date.now()});G(()=>INBOX.refresh())});
  /* notification centre */
  G(()=>{const st=NOTIF.state;if(st&&st.items)st.items.unshift({id,type:"mention",prio:"normal",title:title+(a.d?". "+a.d:""),sub:"From the other seat (simulated)",src:a.s||"home",group:"Two seats",ts:Date.now(),read:false,cleared:false,defer:0,esc:null})});
  G(()=>{if(W.R17N&&R17N.notify)R17N.notify({kind:"info",title:"From the other seat: "+lab(m.role),body:a.a+(a.num?" · "+a.num+" moved (simulated)":""),key:id,life:6000});else toast("From the other seat: "+a.a,"info")});
  G(()=>W.EVENTS&&EVENTS.emit&&EVENTS.emit("exp.seat",{from:m.role,a:a.a,num:a.num,simulated:true}));
 }finally{ST.muted=false}paint()}
if(CH)CH.onmessage=ev=>{const m=ev.data||{};if(!m||m.v!==1||m.id===ME||!ST.role)return;
 if(m.type==="hello"||m.type==="here"){const isNew=!ST.peers[m.id];ST.peers[m.id]={role:m.role,at:Date.now(),tenant:m.tenant};if(m.type==="hello")send({type:"here"});if(isNew)paint();return}
 if(m.type==="bye"){delete ST.peers[m.id];paint();return}
 if(m.type==="audit"){ST.peers[m.id]=ST.peers[m.id]||{role:m.role,at:Date.now(),tenant:m.tenant};arrive(m)}};
/* only what a person did is mirrored: background bookkeeping (boot seeding, timers) is audited too, so an entry crosses only within
   a few seconds of a click or key press in this window */
let GEST=0;const gesture=()=>{GEST=Date.now()};G(()=>{W.addEventListener("pointerdown",gesture,true);W.addEventListener("keydown",gesture,true)});
const byPerson=()=>Date.now()-GEST<4000;
G(()=>HOOKS.on("audit",e=>{if(!ST.role||ST.muted||!byPerson()||!e||NOISE.test(String(e.a||""))||/^Two seats/.test(String(e.a||"")))return;send({type:"audit",entry:{a:e.a,d:e.d,s:e.s,p:e.p,t:e.t},num:numOf(e)})},{id:"seats-audit"}));
G(()=>W.addEventListener("pagehide",()=>send({type:"bye"})));

/* ---------- the seat bar: which seat this window is, the other seat, and what arrived from it ---------- */
function bar(){let b=D.getElementById("seatBar");if(!ST.role){if(b)b.remove();return null}
 if(!b){b=D.createElement("aside");b.id="seatBar";b.className="sts glass";b.setAttribute("aria-label","Two seats");b.setAttribute("data-tenant-chooser","1");D.body.appendChild(b)}return b}
function paint(){const b=bar();if(!b)return;const peers=Object.values(ST.peers);const others=[...new Set(peers.map(p=>lab(p.role)))];
 b.innerHTML=`<div class="sts-h"><b>Seat: ${E(lab(ST.role))}</b><span class="pill info" title="Two windows on this machine. Arrivals are mirrored, no record changes.">Simulated</span>
  <button type="button" class="btn quiet sts-x" data-sts="toggle" aria-expanded="${ST.open}" aria-label="${ST.open?"Collapse":"Expand"} the seat bar">${ST.open?"&minus;":"+"}</button></div>
 ${ST.open?`<p class="small muted">${others.length?"Other seat"+(others.length>1?"s":"")+": "+E(others.join(", ")):"No other seat yet. Open one to work across the table."}</p>
 ${ST.arr.length?`<ol class="sts-arr">${ST.arr.slice(0,2).map(a=>`<li data-seat-from="${E(a.from)}"><span class="sts-from">From the other seat · ${E(a.fromLabel)}</span><span>${E(a.a)}${a.count>1?" (x"+a.count+")":""}</span>${a.num?`<span class="sts-num" title="The number that moved, simulated">${E(a.num)} moved</span>`:""}${a.s?`<button type="button" class="chip" data-go="${E(a.s)}">Open</button>`:""}</li>`).join("")}</ol>`:""}
 <div class="sts-act">${Object.keys(ROLES).filter(r=>r!==ST.role&&!peers.some(p=>p.role===r)).slice(0,2).map(r=>`<button type="button" class="btn sm" data-sts-open="${r}">Open ${E(ROLES[r])} seat</button>`).join("")}<button type="button" class="btn quiet sm" data-sts="leave">Leave seat</button></div>`:""}`}
G(()=>ROUTER.on("click","[data-sts],[data-sts-open]",(e,el)=>{const d=el.dataset;if(d.stsOpen)return openSeat(d.stsOpen);if(d.sts==="toggle"){ST.open=!ST.open;paint()}else if(d.sts==="leave")leave()},{id:"seats-click"}));

/* ---------- boot: the seat comes from the address; a generated company named in the address is opened once it is restored ---------- */
G(()=>{const q=new URLSearchParams(location.search);const r=q.get("seat"),t=q.get("tenant");if(r&&ROLES[r])setTimeout(()=>{ST.role=r;send({type:"hello"});paint()},0);
 if(t)setTimeout(()=>{if(G(()=>DATA.tenant(),"")!==t&&G(()=>SCN.list[t],null))G(()=>TENANT.switch(t))},900)});

/* ---------- a three-minute mission for the experience engine (registered when EXP is present) ---------- */
const isSeat=ev=>!!ev&&((ev.kind==="event"&&ev.type==="exp.seat")||(ev.kind==="audit"&&/^Two seats/.test(ev.a)));
const MISSION={id:"two_seats",title:"Two seats: work across the table",role:"any",tenants:"any",clock:180,labels:["simulated","modeled"],
 screens:["inbox"],ripples:["metric"],
 brief:"Open a second seat and watch your decision land on the other desk.",goal:"An action in one seat arrives in the other as a simulated item.",
 setup(){if(!ST.role)pick("cfo")},
 checkpoints:[{id:"second",t:"Open the second seat",when:ev=>isSeat(ev)||(ev&&ev.kind==="audit"&&/seat/i.test(ev.a)),hint:{after:40,text:"Open the Operations seat from the seat bar."},claim:{k:"simulated",t:"A second window takes a second role on the same company, on this machine only."}},
  {id:"arrived",t:"Act in one seat, see it arrive in the other",when:ev=>!!ev&&ev.kind==="event"&&ev.type==="exp.seat",hint:{after:90,text:"Approve or move something in one window and look at the other."},
   claim:{k:"simulated",t:"Your action arrived on the other desk as an inbox item and a changed number."},
   ripple:(ctx,ev)=>{const pl=ev.payload||{},from=lab(pl.from||"coo");const n=parseFloat(String(pl.num||"").replace(/[$,]/g,""));
    return{kind:"seat",cause:"The "+from+" seat acted and this desk saw it",rule:"An audited action in one seat arrives in the other as an inbox item and a notification; the number shown is the one the action moved. Simulated, this machine only.",
     nodes:[{level:"record",label:from+" seat: "+(pl.a||"an action")},{level:"queue",label:"Your inbox: items from the other seat",before:Math.max(0,ST.arr.length-1),after:ST.arr.length,good:"up"}].concat(isFinite(n)?[{level:"line",label:"Amount that moved",before:0,after:n,fmt:"money"}]:[])}}}],
 success:()=>ST.arr.length>0,debrief:()=>({what:ST.arr.length+" action"+(ST.arr.length===1?"":"s")+" arrived from the other seat (simulated).",mean:"Two leaders work one company in one view instead of a chain of emails. Simulated."})};
let reg=false;const tryReg=()=>{if(reg||!W.EXP||typeof EXP.register!=="function")return;try{EXP.register(MISSION);reg=true}catch(e){console.error("seats mission",e)}};
G(()=>HOOKS.on("afterRender",tryReg,{id:"seats-exp"}));setTimeout(tryReg,0);

const SEATS=W.SEATS={roles:()=>Object.keys(ROLES).map(k=>({id:k,label:ROLES[k]})),pick,role:()=>ST.role,leave,open:openSeat,
 peers:()=>Object.keys(ST.peers).map(k=>Object.assign({id:k},ST.peers[k])),arrivals:()=>ST.arr.map(a=>Object.assign({},a)),available:()=>!!CH,mission:MISSION};
G(()=>SEARCHX.push(()=>[{g:"Go to",t:"Two seats",m:"Open a second window in another role; actions arrive across the table (simulated)",c:"--p4",f:()=>openSeat("coo"),k:"two seats second window seat role cfo coo across the table showroom experience"}]));
})();
