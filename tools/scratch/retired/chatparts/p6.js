
/* ================= commands and events ================= */
function doCmd(d){const p=d.split(":");const k=p[0];const rest=d.slice(k.length+1);
 if(k==="go"){go(p[1],p[2]);return}
 if(k==="ask"){handle(rest);return}
 if(k==="tool"){runTool(p[1],decodeURIComponent(p.slice(2).join(":")));return}
 if(k==="person"){person360(rest);return}
 if(k==="subj"){ST.recentS=[rest].concat((ST.recentS||[]).filter(x=>x!==rest)).slice(0,5);setSubject(rest);return}
 if(k==="impact"){G(()=>openImpact({type:p[1],id:p[2],service:p[3]||undefined,ci:p[4]||undefined}));return}
 if(k==="slaopen"){go("svc_sla");G(()=>SLAX.openAg(rest));return}
 if(k==="reqopen"){go("svc_req");G(()=>svcOpenRequest(rest));return}
 if(k==="openrec"){openRec(rest);return}}
function openRec(id){if(/^person:/.test(id)){person360(id.slice(7));return}const r=lookupRec(id);if(r&&r.go)r.go();else toast("Cannot open "+id,"warn")}
function setPersona(k){if(!PERSONAS[k])return;S.persona=k;savePrefs();audit("switched role from chat",PERSONAS[k].n);if(!SCREENS.some(s=>s[0]===S.screen))S.screen="home";try{render()}catch(e){}CX.drawAll()}
function editAct(a){const tool=TBY(a.tool);if(!tool)return;a.status="cancelled";a.steps.forEach(s=>{if(s.status==="queued")s.status="cancelled"});logA(a,"Edited: replaced by a new plan");const t=findThread(a.thread);const fid=uid("F");ST.forms[fid]={id:fid,tool:tool.id,vals:Object.assign({},a.params),err:{},pre:Object.keys(a.params||{}),status:"open",thread:t.id,q:a.q,conf:a.conf,created:Date.now()};sayAI(t,"Change what you like. I will re-check the guardrails and rebuild the plan.",{cards:[{t:"form",id:fid}],stream:false});CX.drawAll()}
function escalate(a){const t=findThread(a.thread);const task={id:"CT"+(ST.tasks.length+1),t:"Review chat activity: "+a.title,own:"Tom Becker",team:"Service desk",due:addD(TODAY,1),st:"open"};ST.tasks.unshift(task);ST.use.esc++;audit("chat: handed to a person",a.title+" → "+task.id);logA(a,"Handed to the service desk lead as "+task.id);sayAI(t,"I handed this to <b>Tom Becker</b> on the service desk as task "+task.id+". He will see the plan, what ran and what stopped.",{cards:[{t:"btnrow",btns:[{l:"Open Person 360",d:"person:Tom Becker"}]}],stream:false});CX.refresh()}
function retryAct(a){a.steps.forEach(s=>{if(s.status==="failed"||s.status==="blocked"){s.status="queued";s.err="";s.blocked=[]}});a.blocked=[];a.status="planned";runAct(a)}
document.addEventListener("click",e=>{const t=e.target.closest("[data-cx-do],[data-cx-cmd],[data-cx-ask],[data-cx-view],[data-cx-new],[data-cx-th],[data-cx-rm],[data-cx-cb],[data-cx-chip],[data-cx-tog],[data-cx-arch],[data-cx-af],[data-cx-actgo],[data-cx-full],[data-cx-hide],[data-cx-pol],[data-cx-capt],[data-cx-tab]");if(!t||!document.getElementById("chatDock"))return;const d=t.dataset;
 if(d.cxCmd!=null){doCmd(d.cxCmd);return}
 if(d.cxAsk!=null){handle(d.cxAsk);return}
 if(d.cxCb){const f=CBS.get(d.cxCb);if(f)f();return}
 if(d.cxActgo){const m=cur().msgs.find(x=>x.id===d.cxActgo);if(m&&m.act)m.act();return}
 if(d.cxView){if(ST.dock.full&&(d.cxView==="acts"||d.cxView==="ctx"))ST.dock.side=d.cxView;ST.dock.view=d.cxView;if(d.cxView==="ctx")CX.drawContext();CX.drawHead();syncRoot();if(d.cxView==="chat")setTimeout(()=>{const i=$("#chatq");if(i)i.focus()},40);return}
 if(d.cxNew!=null){newThread();CX.open("chat");return}
 if(d.cxFull!=null){CX.full();return}if(d.cxHide!=null){CX.close();return}
 if(d.cxArch!=null){ST.showArch=d.cxArch==="1";CX.drawThreads();return}
 if(d.cxAf){ST.af=d.cxAf;CX.drawActs();return}
 if(d.cxTh){const [k,id]=[d.cxTh.slice(0,d.cxTh.indexOf(":")),d.cxTh.slice(d.cxTh.indexOf(":")+1)];const th=ST.threads.find(x=>x.id===id);if(!th)return;
  if(k==="open"){ST.active=id;th.unread=0;ST.dock.view="chat";CX.open("chat");return}
  if(k==="pin"){th.pinned=!th.pinned;audit("chat: "+(th.pinned?"pinned":"unpinned")+" thread",th.title)}
  if(k==="arch"){th.arch=true;audit("chat: archived thread",th.title);if(ST.active===id)ST.active=null;cur()}
  if(k==="unarch"){th.arch=false}
  if(k==="ren"){const n=window.prompt?null:null;ST.ren=id;CX.drawThreads();const li=document.querySelector('[data-cx-th="open:'+id+'"] b');if(li){li.contentEditable="true";li.focus();const rg=document.createRange();rg.selectNodeContents(li);const sel=getSelection();sel.removeAllRanges();sel.addRange(rg);const fin=()=>{li.contentEditable="false";const v=li.textContent.trim();if(v){th.title=v.replace(/^Pinned · /,"");th.manual=true;audit("chat: renamed thread",th.title)}ST.ren=null;CX.drawAll();saveSoon()};li.addEventListener("blur",fin,{once:true});li.addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();li.blur()}})}return}
  CX.drawAll();saveSoon();return}
 if(d.cxRm){const k=d.cxRm,th=cur();if(k==="page"||k==="rec"||k==="kb")th.ctx.off[k]=true;else if(k==="subj")setSubject(null);else if(/^att:/.test(k)){const [,kk,...r]=k.split(":");const id=r.join(":");th.ctx.attach=th.ctx.attach.filter(a=>!(a.k===kk&&a.id===id))}audit("chat: removed from context",k);CX.drawAll();saveSoon();return}
 if(d.cxChip){const [fid,k,...v]=d.cxChip.split(":");const f=ST.forms[fid];if(!f)return;f.vals[k]=v.join(":");delete f.err[k];CX.redrawForm(fid);return}
 if(d.cxTog){const [fid,k]=d.cxTog.split(":");const f=ST.forms[fid];f.vals[k]=!f.vals[k];CX.redrawForm(fid);return}
 if(d.cxPol){const [id,k]=d.cxPol.split(":");const p=pol(id);if(p.lock){toast(id+" cannot be switched off","warn");return}p.on=!p.on;audit("chat guardrail edited",id+" "+p.n+" → "+(p.on?"on":"off"));saveSoon();try{render()}catch(e){};return}
 if(d.cxCapt){const [r,c]=d.cxCapt.split("|");ST.permOv[r]=ST.permOv[r]||{};const has=capsOf(r).includes(c);ST.permOv[r][c]=!has;audit("chat permission edited",r+" "+c+" → "+(!has?"granted":"revoked"));saveSoon();try{render()}catch(e){};return}
 if(d.cxDo){const p=d.cxDo.split(":");const k=p[0];const A=id=>CX.actById(id);
  if(k==="plan-run"){const a=A(p[1]);if(a&&a.status==="planned"){a.approved=ME_NAME;logA(a,"Approved by "+ME_NAME+" ("+a.mode+" mode)");audit("chat: approved plan",a.title);runAct(a)}return}
  if(k==="plan-edit"){editAct(A(p[1]));return}
  if(k==="plan-cancel"){const a=A(p[1]);if(a){if(a.status==="planned"||a.status==="suggested"){a.status="cancelled";a.steps.forEach(s=>s.status="cancelled");logA(a,"Cancelled before running");audit("chat: cancelled plan",a.title);CX.refresh()}else cancelAct(a)}return}
  if(k==="plan-undo"){undoAct(A(p[1]));return}
  if(k==="plan-retry"){retryAct(A(p[1]));return}
  if(k==="plan-escalate"){escalate(A(p[1]));return}
  if(k==="plan-open"){ST.af="all";CX.open("acts");return}
  if(k==="plan-ask"){const a=A(p[1]);const th=findThread(a.thread);th.mode="ask";a.mode="ask";a.status="planned";CX.drawAll();return}
  if(k==="gate"){const a=A(p[1]);if(a)gateDecide(a,p[2],p[3],p[4]==="demo"?"demo":p[4]==="me"?"me":undefined);return}
  if(k==="nudge"){toast("Nudge sent to the approver in Teams","info");audit("chat: nudged approver",p[1]);return}
  if(k==="reqgate"){reqGate(p[1],+p[2],p[3],p[4]==="demo"?"demo":undefined);return}
  if(k==="deliver"){const r=ST.reqs.find(x=>x.id===p[1]);if(r){r.state="Delivered";r.log.push({t:clock(),tx:"Delivered and confirmed (demo)"});G(()=>{const x=S.itsm.req.find(y=>y.id===r.id);if(x)x.st="good"});audit("chat: request delivered",r.id);CX.refresh()}return}
  if(k==="form-submit"){CX.submitForm(p[1]);return}
  if(k==="form-cancel"){const f=ST.forms[p[1]];if(f){f.status="cancelled";const th=findThread(f.thread);th.pend=null;CX.redrawForm(f.id)}return}
  if(k==="form-full"){const f=ST.forms[p[1]];if(f){const th=findThread(f.thread);G(()=>{go("svc_portal");_askPrev(f.q)})}return}
  if(k==="role"){setPersona(p[1]);return}
  if(k==="pick-subj"){CX.openPicker();return}
  if(k==="close-picker"){const el=$("#chxPicker");if(el)el.hidden=true;return}
  if(k==="subj"){const n=d.cxDo.slice(5);ST.recentS=[n].concat((ST.recentS||[]).filter(x=>x!==n)).slice(0,5);setSubject(n);const el=$("#chxPicker");if(el)el.hidden=true;return}
  if(k==="deleg-request"){const n=d.cxDo.slice(14);ST.deleg.push({id:"DL"+(ST.deleg.length+1),from:n,to:ME_NAME,scope:"Orders, tickets, approvals",by:n,until:addD(TODAY,90),why:"Requested from chat (demo: granted at once)"});audit("chat: delegation requested and granted (demo)",n);toast(firstOf(n)+" granted a delegation (demo)","good");CX.drawAll();return}
  if(k==="ctx-reset"){cur().ctx.off={};CX.drawAll();return}
  if(k==="openrec"){openRec(d.cxDo.slice(8));return}
  if(k==="test-run"){const i=$("#cxTq");if(i){ST.tc=i.value;try{render()}catch(e){}}return}
  if(k==="test-suite"){CX.suite=CX.runSuite();try{render()}catch(e){}return}
  if(k==="test-chat"){handle(ST.tc||"");return}
  return}});
document.addEventListener("input",e=>{const t=e.target;if(!t.dataset)return;
 if(t.dataset.cxF){const [fid,k]=t.dataset.cxF.split(":");const f=ST.forms[fid];if(!f)return;f.vals[k]=t.type==="number"&&t.value!==""?+t.value:t.value;if(f.err[k]){delete f.err[k];const fl=t.closest(".fld");if(fl){fl.classList.remove("bad");const er=fl.querySelector(".ferr");if(er)er.remove()}}if(t.type==="range"){const o=document.getElementById(t.id+"_v");if(o)o.textContent=t.value}clearTimeout(f._pv);f._pv=setTimeout(()=>refreshPrev(fid),120);return}
 if(t.id==="chxTq"){ST.tq=t.value;const i=t.selectionStart;CX.drawThreads();const n=$("#chxTq");if(n){n.focus();n.setSelectionRange(i,i)}return}
 if(t.id==="chxAq"){ST.aq=t.value;const i=t.selectionStart;CX.drawContext();const n=$("#chxAq");if(n){n.focus();n.setSelectionRange(i,i)}return}
 if(t.id==="chxPq"){$("#chxPl").innerHTML=pickerHTML(t.value);return}
 if(t.id==="chatq"){slashMenu(t.value);return}
 if(t.id==="cxTq"){ST.tc=t.value}});
document.addEventListener("change",e=>{const t=e.target;if(!t.dataset)return;
 if(t.dataset.cxF){const [fid,k]=t.dataset.cxF.split(":");const f=ST.forms[fid];if(!f)return;f.vals[k]=t.type==="number"&&t.value!==""?+t.value:t.value;if(t.tagName==="SELECT")CX.redrawForm(fid);else refreshPrev(fid);return}
 if(t.dataset.cxRole!=null){setPersona(t.value);return}
 if(t.id==="chxMode"){const th=cur();th.mode=t.value;audit("chat: autonomy changed",MODES[t.value].n+" in "+th.title);CX.drawAll();return}
 if(t.dataset.cxPolv){const p=pol(t.dataset.cxPolv);p.val=+t.value;audit("chat guardrail edited",p.id+" "+p.n+" → "+p.val);saveSoon();return}
 if(t.dataset.cxDefmode!=null){ST.mode=t.value;audit("chat: default autonomy",t.value);saveSoon();return}});
document.addEventListener("dblclick",e=>{const h=e.target.closest("#chxTitle");if(!h)return;h.contentEditable="true";h.focus();const fin=()=>{h.contentEditable="false";const v=h.textContent.trim();if(v){cur().title=v;cur().manual=true;audit("chat: renamed thread",v)}CX.drawAll();saveSoon()};h.addEventListener("blur",fin,{once:true});h.addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();h.blur()}})});
document.addEventListener("click",e=>{const q=e.target.closest("[data-person-ask]");if(q&&CX.mounted){const n=q.dataset.personAsk;setSubject(n);CX.open("chat");setTimeout(()=>{const i=$("#chatq");if(i){i.value="What is on "+n+"'s plate and can they take more?";i.focus()}},30)}},true);
/* slash menu */
function slashMenu(v){let m=$("#chxSlash");if(!/^\/[a-z]*$/i.test(v)){if(m)m.hidden=true;return}const L=Object.keys(SLASH).concat(["/help","/context","/new"]).filter(x=>x.indexOf(v.toLowerCase())===0);if(!m){m=document.createElement("ul");m.id="chxSlash";m.className="cx-slash glass";m.setAttribute("role","listbox");m.setAttribute("aria-label","Slash commands");$("#chatForm").insertBefore(m,$("#chatForm").firstChild)}m.hidden=!L.length;m.innerHTML=L.slice(0,8).map(x=>{const h=SLASH_HELP.find(s=>s[0].indexOf(x)===0);return`<li><button type="button" role="option" data-cx-slash="${x}"><b>${x}</b><small class="muted"> ${H(h?h[1]:"")}</small></button></li>`}).join("")}
document.addEventListener("click",e=>{const b=e.target.closest("[data-cx-slash]");if(!b)return;const i=$("#chatq");i.value=b.dataset.cxSlash+" ";i.focus();const m=$("#chxSlash");if(m)m.hidden=true});

/* ================= command palette: Ctrl+K runs the same planner ================= */
let PAL={sel:0,items:[]};
function palItems(q){const out=[];const c=ctxNow();const s=q.trim();if(/^\//.test(s)){Object.keys(SLASH).filter(x=>x.indexOf(s.split(" ")[0].toLowerCase())===0).slice(0,6).forEach(x=>out.push({g:"Commands",t:x,m:(SLASH_HELP.find(h=>h[0].indexOf(x)===0)||[0,""])[1],f:()=>{palClose();CX.open("chat");const i=$("#chatq");i.value=x+" ";i.focus()}}));if(s.indexOf(" ")>0)out.push({g:"Run",t:s,m:"Run as a slash command",f:()=>{palClose();handle(s)}});return out}
 if(s.length>2){scoreTools(s,c).slice(0,3).forEach(x=>{if(x.s>=5)out.push({g:"Do it",t:x.t.name,m:(x.t.write?RISK[x.t.risk].n+" risk · ":"Read only · ")+"planned by chat, you confirm",f:()=>{palClose();handle(s)}})});out.push({g:"Ask",t:s,m:"Answer with sources",f:()=>{palClose();handle(s)}})}
 else{["Order a laptop","Onboard a new user","Log an incident","Who is on call","Show my approvals"].forEach(x=>out.push({g:"Try",t:x,m:"Runs in chat",f:()=>{palClose();handle(x)}}))}
 let ix=[];try{ix=searchIndex()}catch(e){}const toks=s.toLowerCase().split(/\s+/).filter(Boolean);if(toks.length){ix.filter(r=>toks.every(t=>(r.t+" "+r.m+" "+(r.k||"")).toLowerCase().indexOf(t)>=0)).slice(0,8).forEach(r=>out.push({g:r.g,t:r.t,m:r.m,f:()=>{palClose();r.f()}}))}return out}
function palDraw(){const L=$("#cxPalList");if(!L)return;let last="";L.innerHTML=PAL.items.map((x,i)=>{const h=x.g!==last?`<li class="grp eyebrow" role="presentation">${H(x.g)}</li>`:"";last=x.g;return h+`<li role="option" id="cxp${i}" aria-selected="${i===PAL.sel}"><button type="button" data-cx-pal="${i}"><b>${H(x.t)}</b><small class="muted"> ${H(x.m||"")}</small></button></li>`}).join("")||'<li class="muted" style="padding:10px">Type to search, or start with / for commands.</li>';const i=$("#cxPalIn");if(i)i.setAttribute("aria-activedescendant","cxp"+PAL.sel)}
function palOpen(pre){let p=$("#cxPal");if(!p){p=document.createElement("div");p.id="cxPal";p.className="cx-pal";p.setAttribute("role","dialog");p.setAttribute("aria-modal","true");p.setAttribute("aria-label","Command palette");p.innerHTML=`<div class="cx-palbox glass"><input id="cxPalIn" class="fin" type="text" role="combobox" aria-expanded="true" aria-controls="cxPalList" placeholder="Search, ask, or do something. Try “order a laptop for Hana” or /onboard" autocomplete="off" aria-label="Command palette"><ul id="cxPalList" role="listbox"></ul><div class="muted small cx-palh">Enter runs the highlighted item · ↑ ↓ to move · Esc to close · same planner as the chat</div></div>`;document.body.appendChild(p);p.addEventListener("click",ev=>{if(ev.target===p)palClose();const b=ev.target.closest("[data-cx-pal]");if(b){const it=PAL.items[+b.dataset.cxPal];if(it)it.f()}});$("#cxPalIn").addEventListener("input",ev=>{PAL.sel=0;PAL.items=palItems(ev.target.value);palDraw()});$("#cxPalIn").addEventListener("keydown",ev=>{if(ev.key==="ArrowDown"){ev.preventDefault();PAL.sel=Math.min(PAL.items.length-1,PAL.sel+1);palDraw()}else if(ev.key==="ArrowUp"){ev.preventDefault();PAL.sel=Math.max(0,PAL.sel-1);palDraw()}else if(ev.key==="Enter"){ev.preventDefault();const it=PAL.items[PAL.sel];if(it)it.f()}else if(ev.key==="Escape"){ev.preventDefault();palClose()}})}
 p.hidden=false;PAL.prev=document.activeElement;const i=$("#cxPalIn");i.value=pre||"";PAL.sel=0;PAL.items=palItems(i.value);palDraw();i.focus()}
function palClose(){const p=$("#cxPal");if(p)p.hidden=true;if(PAL.prev&&PAL.prev.focus){try{PAL.prev.focus()}catch(e){}}}
CX.palette=palOpen;
document.addEventListener("keydown",e=>{if(!document.getElementById("chatDock"))return;const mod=e.ctrlKey||e.metaKey;
 if(mod&&!e.shiftKey&&(e.key==="k"||e.key==="K")){e.preventDefault();const p=$("#cxPal");if(p&&!p.hidden)palClose();else palOpen();return}
 if(mod&&(e.key==="j"||e.key==="J")){e.preventDefault();if(e.shiftKey)CX.full(true);else CX.toggle();return}
 if(e.key==="Escape"){const p=$("#cxPal");if(p&&!p.hidden){palClose();return}const pk=$("#chxPicker");if(pk&&!pk.hidden){pk.hidden=true;return}const sl=$("#chxSlash");if(sl&&!sl.hidden){sl.hidden=true;return}if(CX.isOpen()&&e.target.closest&&e.target.closest("#chatDock")&&!document.querySelector("#drawer:popover-open")){if(ST.dock.full){CX.full(false)}else CX.close()}}
 if(e.target.id==="chxGrip"&&(e.key==="ArrowLeft"||e.key==="ArrowRight")){e.preventDefault();ST.dock.w=Math.max(340,Math.min(900,ST.dock.w+(e.key==="ArrowLeft"?30:-30)));syncRoot();saveSoon()}
 if(e.target.id==="chatq"){const t=cur();if(e.key==="ArrowUp"&&!e.target.value){const my=t.msgs.filter(m=>m.me);const l=my[my.length-1-(ST.hi||0)];if(l){e.target.value=l.t;ST.hi=(ST.hi||0)+1}}else if(e.key==="Tab"&&/^\/[a-z]*$/.test(e.target.value)){const b=document.querySelector("#chxSlash button");if(b){e.preventDefault();e.target.value=b.dataset.cxSlash+" ";const m=$("#chxSlash");if(m)m.hidden=true}}else if(e.key==="Enter"){ST.hi=0}}});

/* resizing */
(function(){let on=false;document.addEventListener("pointerdown",e=>{const g=e.target.closest("#chxGrip");if(!g)return;on=true;g.setPointerCapture&&g.setPointerCapture(e.pointerId);document.body.classList.add("chx-resizing");e.preventDefault()});
 document.addEventListener("pointermove",e=>{if(!on)return;ST.dock.w=Math.max(340,Math.min(Math.floor(window.innerWidth*.7),window.innerWidth-e.clientX-14));syncRoot()});
 const up=()=>{if(!on)return;on=false;document.body.classList.remove("chx-resizing");saveSoon()};document.addEventListener("pointerup",up);document.addEventListener("pointercancel",up)})();
window.addEventListener("resize",()=>{if(CX.mounted)syncRoot()});

/* ================= mount ================= */
function fillLists(){const q=(id,items)=>{let d=document.getElementById(id);if(!d){d=document.createElement("datalist");d.id=id;document.body.appendChild(d)}d.innerHTML=items.map(x=>`<option value="${H(x)}"></option>`).join("")};
 q("cxDlPeople",DIR.map(d=>d.name));q("cxDlSvc",SVCREG.map(s=>s.n));const rec=[];G(()=>S.itsm.inc.slice(0,150).forEach(i=>rec.push(i.id)));G(()=>S.itsm.chg.slice(0,60).forEach(i=>rec.push(i.id)));G(()=>window.REQREG.slice(0,120).forEach(i=>rec.push(i.id)));ST.reqs.forEach(r=>rec.push(r.id));q("cxDlRec",rec);CX._dl=DIR.length}
CX.mount=function(){if(CX.mounted)return;const d=$("#chatDock");if(!d)return;CX.mounted=true;
 d.innerHTML=`<div class="cx-grip" id="chxGrip" role="separator" aria-orientation="vertical" aria-label="Resize the chat. Use the left and right arrow keys." tabindex="0"></div>
 <header class="cx-head"><div class="cx-ht"><span class="cx-spark" aria-hidden="true">${ico("sparkle")}</span><h3 id="chxTitle" title="Double click to rename this thread"></h3></div><div class="cx-hb"><label class="cx-modew"><span class="sr">Autonomy mode</span><select class="cx-sel" id="chxMode" aria-label="Autonomy mode for this thread" title="Suggest only, ask before acting, or act within guardrails"><option value="suggest">Suggest only</option><option value="ask">Ask before acting</option><option value="act">Act within guardrails</option></select></label><button class="btn quiet" data-cx-new title="Start a new thread">New</button><button class="btn quiet" id="chxFull" data-cx-full aria-pressed="false" title="Full screen, keeps the navigation (Ctrl or Cmd + Shift + J)">Full screen</button><button class="btn quiet" data-cx-hide title="Collapse to the orb (Ctrl or Cmd + J)">Hide</button></div></header>
 <div class="cx-tabs" id="chxTabs" role="tablist" aria-label="Chat views"></div>
 <div class="cx-body"><aside class="cx-left" id="chxThreads" aria-label="Threads"></aside><div class="cx-center"><div class="cx-ctx" id="chxCtx" aria-label="Context of this thread"></div><div class="cx-chatp"><div class="msgs" id="msgs" role="log" aria-live="off" aria-relevant="additions" aria-label="Conversation" tabindex="0"></div><div class="sugs" id="sugs"></div></div></div><aside class="cx-right"><div class="cx-pane" id="chxActs" aria-label="Activities"></div><div class="cx-pane" id="chxContext" aria-label="Context pack and permissions"></div></aside></div>
 <div class="sr" id="chxLive" aria-live="polite" aria-atomic="true"></div>
 <form class="chatin cx-in" id="chatForm" autocomplete="off"><input class="txtin" id="chatq" placeholder="Ask, or tell me what to do. Type / for commands" aria-label="Message to Oukala" aria-describedby="chxHint" autocomplete="off"><button class="btn primary" type="submit">Send</button><span id="chxHint" class="sr">Press Enter to send. Slash starts a command. Control or Command J toggles this chat. Control or Command K opens the command palette.</span></form>`;
 fillLists();
 const co=$("#chatOpen");co.addEventListener("change",()=>{syncRoot();if(co.checked){cur().unread=0;CX.drawAll()}});
 const rc=$("#railCollapse");if(rc)rc.addEventListener("change",()=>setTimeout(syncRoot,350));
 let first=cur();if(!first.msgs.length&&!ST.seeded){ST.seeded=true}
 CX.drawAll();CX._lastScreen=S.screen};
drawChat=function(){if(CX.mounted)CX.drawAll()};
/* Chat is the entry for the search box, the palette and every module: ask() goes to the planner */
CX.setAskPrev(ask);ask=function(q){return handle(q)};
const _render=render;render=function(){const r=_render.apply(this,arguments);try{if(CX.mounted&&S.screen!==CX._lastScreen){CX._lastScreen=S.screen;if(ST.lastRec&&!ST.keepRec)ST.lastRec=null;ST.keepRec=false;CX.drawCtx();CX.drawSugs();if(CX.isOpen()&&ST.dock.view==="ctx")CX.drawContext();if(DIR.length!==CX._dl)fillLists()}}catch(e){}return r};
