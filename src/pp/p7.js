/* ---------- drag engine (pointer based, with keyboard and form fallbacks elsewhere) ---------- */
let noClickUntil=0;
function pdrag(e,el,o){const sx=e.clientX,sy=e.clientY;let g=null,t=null,started=false;
 const mv=ev=>{if(!started){if(Math.hypot(ev.clientX-sx,ev.clientY-sy)<6)return;started=true;g=document.createElement("div");g.className="ppl-ghost glass";g.innerHTML=o.label;document.body.appendChild(g);el.classList.add("ppl-src");document.body.classList.add("ppl-dragging")}
  ev.preventDefault();g.style.transform=`translate(${Math.min(ev.clientX+14,innerWidth-250)}px,${ev.clientY+14}px)`;t=o.hit(ev.clientX,ev.clientY);o.over&&o.over(t,ev,g)};
 const up=ev=>{document.removeEventListener("pointermove",mv);document.removeEventListener("pointerup",up);document.removeEventListener("pointercancel",up);
  if(started){g.remove();el.classList.remove("ppl-src");document.body.classList.remove("ppl-dragging");o.clear&&o.clear();noClickUntil=Date.now()+80;if(t&&ev.type==="pointerup")o.drop(t,ev)}};
 document.addEventListener("pointermove",mv,{passive:false});document.addEventListener("pointerup",up);document.addEventListener("pointercancel",up)}
document.addEventListener("click",e=>{if(Date.now()<noClickUntil){e.stopPropagation();e.preventDefault()}},true);
function previewNode(nd,it,g){const e=ENT(nd.dataset.pplDrop);if(!e)return;const f=effect(it,e),blocked=f.rule&&f.rule[0]==="no",same=it.owner===e.id;nd.classList.add("over");nd.classList.toggle("bad",f.over||blocked);nd.classList.toggle("ok",!(f.over||blocked));
 const rg=nd.querySelector(".ppl-rg"),pc=nd.querySelector(".ppl-pc");if(rg)rg.innerHTML=mring(f.after,50);if(pc){pc.textContent=same?pctT(f.before):effText(f);pc.className="ppl-pc "+uCls(f.after)}
 const gl=g&&g.querySelector(".ppl-gl");if(gl)gl.innerHTML=`${esc(e.n)}: <b>${same?"already theirs":effText(f)}</b>${blocked?" · not allowed":f.over?" · overload":""}`}
function restoreNode(nd){const e=ENT(nd.dataset.pplDrop);if(!e)return;const u=util(e,st.week);nd.classList.remove("over","bad","ok");const rg=nd.querySelector(".ppl-rg"),pc=nd.querySelector(".ppl-pc");if(rg)rg.innerHTML=mring(u,50);if(pc){pc.textContent=pctT(u);pc.className="ppl-pc "+uCls(u)}}
function moveAlloc(pid,w,pr,toP,toW,toPr){const a=st.alloc[pid][w],v=a[pr];if(!v||pr==="BAU")return;if(pid===toP&&w===toW&&pr===toPr)return;delete a[pr];const b=st.alloc[toP][toW];b[toPr]=(b[toPr]||0)+v;const tot=allocTot(toP,toW),cap=capOf(toP,toW);
 audit("moved allocation",`${v}% ${pr} ${nameOf(pid)} ${WL[w]} → ${toPr} ${nameOf(toP)} ${WL[toW]} (${tot}% of ${Math.round(cap)}%)`);toast(`${v}% moved to ${toPr==pr?"":toPr+" · "}${nameOf(toP).split(" ")[0]}, ${WL[toW]}. Now ${tot}%`,tot>cap+.5?"warn":"good");render()}
function chipDrawer(pid,w,pr){const p=H(pid),v=st.alloc[pid][w][pr];openDrawer(`<div class="eyebrow">Allocation</div><h3>${v}% ${pr} · ${esc(p.n)}</h3><p class="muted" data-role="story">Week of ${WL[w]}. Drag the chip, or move it here with the lists. The overload check runs either way.</p><div class="row"><select class="fin" id="pplCmP" aria-label="Project" style="width:auto">${PROJ.map(x=>`<option value="${x.id}" ${x.id===pr?"selected":""}>${x.id} ${esc(x.short)}</option>`).join("")}</select><select class="fin" id="pplCmW" aria-label="Week" style="width:auto">${WL.map((l,i)=>`<option value="${i}" ${i===w?"selected":""}>${l}</option>`).join("")}</select><select class="fin" id="pplCmWho" aria-label="Person" style="width:auto">${members(p.team).map(x=>`<option value="${x.id}" ${x.id===pid?"selected":""}>${esc(x.n)}</option>`).join("")}</select><button class="btn primary" data-ppl-cmgo="${pid}:${w}:${pr}">Move</button></div>`)}
/* ---------- pointer down: start drags ---------- */
document.addEventListener("pointerdown",e=>{if(e.button>0)return;
 const wi=e.target.closest("[data-ppl-wi]");if(wi&&!e.target.closest("button")){const it=st.work.find(i=>i.id===wi.dataset.pplWi);if(!it)return;let cur=null;
  pdrag(e,wi,{label:`<b>${esc(it.t)}</b><span class="ppl-gl muted">${it.h} h a week · drop on a person</span>`,hit:(x,y)=>{const n=document.elementFromPoint(x,y);return n&&n.closest("[data-ppl-drop]")},
   over:(nd,ev,g)=>{if(cur&&cur!==nd)restoreNode(cur);cur=nd;if(nd)previewNode(nd,it,g);else{const gl=g.querySelector(".ppl-gl");gl.textContent=it.h+" h a week · drop on a person"}},clear:()=>{if(cur)restoreNode(cur);cur=null},drop:nd=>tryAssign(it,nd.dataset.pplDrop)});return}
 const ch=e.target.closest("[data-ppl-chip]");if(ch){const [pid,w,pr]=ch.dataset.pplChip.split(":");let cur=null;
  pdrag(e,ch,{label:`<b>${esc(ch.textContent)}</b><span class="ppl-gl muted">drop on a project bar or another week</span>`,hit:(x,y)=>{const n=document.elementFromPoint(x,y);if(!n)return null;const z=n.closest("[data-ppl-zone]");if(z)return {zone:z.dataset.pplZone,el:z};const c=n.closest("[data-ppl-cell]");return c?{cell:c.dataset.pplCell,el:c}:null},
   over:(t,ev,g)=>{document.querySelectorAll(".ppl-ac.pvok,.ppl-ac.pvbad,.ppl-zone.hot").forEach(x=>{x.classList.remove("pvok","pvbad","hot");delete x.dataset.prev});const gl=g.querySelector(".ppl-gl");if(!t)return;
    if(t.zone){t.el.classList.add("hot");gl.textContent=t.zone===pr?"same project":"retag to "+t.zone;return}
    const [p2,w2]=t.cell.split(":"),v=st.alloc[pid][+w][pr],same=p2===pid&&+w2===+w;if(same){gl.textContent="same cell";return}const after=allocTot(p2,+w2)+v,cap=capOf(p2,+w2),bad=after>cap+.5;t.el.classList.add(bad?"pvbad":"pvok");t.el.dataset.prev="→ "+after+"%";gl.innerHTML=`${esc(nameOf(p2))}, ${WL[+w2]}: <b>${after}%</b>${bad?" · over capacity":""}`},
   clear:()=>document.querySelectorAll(".ppl-ac.pvok,.ppl-ac.pvbad,.ppl-zone.hot").forEach(x=>{x.classList.remove("pvok","pvbad","hot");delete x.dataset.prev}),
   drop:t=>{if(t.zone)moveAlloc(pid,+w,pr,pid,+w,t.zone);else{const [p2,w2]=t.cell.split(":");moveAlloc(pid,+w,pr,p2,+w2,pr)}}});return}
 const bk=e.target.closest("[data-ppl-bk]");if(bk){const b=BK(bk.dataset.pplBk);if(!b)return;const r0=bk.getBoundingClientRect(),ox=e.clientX-r0.left,len=b.e-b.s,day=st.avd.view==="day";
  const clearPv=()=>{document.querySelectorAll(".ppl-pvbk").forEach(x=>x.remove());document.querySelectorAll(".ppl-wc.pvok,.ppl-wc.pvbad").forEach(x=>x.classList.remove("pvok","pvbad"))};
  pdrag(e,bk,{label:`<b>${esc(b.t)}</b><span class="ppl-gl muted">${hh(b.s)} to ${hh(b.e)} · drop on a room</span>`,hit:(x,y)=>{const n=document.elementFromPoint(x,y);const row=n&&n.closest("[data-ppl-room]");if(!row)return null;let s=b.s;if(day){const rc=row.getBoundingClientRect();s=clamp(8+Math.round(((x-ox-rc.left)/hourPx)*2)/2,8,18-len)}return {room:row.dataset.pplRoom,d:+row.dataset.pplDay,s,el:row}},
   over:(t,ev,g)=>{clearPv();const gl=g.querySelector(".ppl-gl");if(!t){gl.textContent="drop on a room";return}const cf=conflicts(b,t.room,t.d,t.s),bad=cf.bad.length>0;
    if(day){const pv=document.createElement("div");pv.className="ppl-pvbk "+(bad?"bad":cf.warn.length?"warn":"ok");pv.style.left=(t.s-8)*hourPx+"px";pv.style.width=len*hourPx-3+"px";pv.textContent=hh(t.s);t.el.appendChild(pv)}else t.el.classList.add(bad?"pvbad":"pvok");
    gl.innerHTML=`${esc(ROOM(t.room).n)} · ${dLab(t.d)} ${hh(t.s)}: <b style="color:var(--${bad?"bad":cf.warn.length?"warn":"good"})">${bad?cf.bad[0]:cf.warn.length?cf.warn[0]:"free"}</b>`},clear:clearPv,drop:t=>{if(moveBk(b,t.room,t.d,t.s))render()}})}});
/* ---------- clicks ---------- */
const cl=(e,sel)=>e.target.closest(sel);
document.addEventListener("click",e=>{const t=e.target.closest("[data-ppl-open],[data-ppl-tog],[data-ppl-zoom],[data-ppl-all],[data-ppl-wk],[data-ppl-addp],[data-ppl-adda],[data-ppl-assign],[data-ppl-force],[data-ppl-x],[data-ppl-kill],[data-ppl-undo],[data-ppl-leave],[data-ppl-team],[data-ppl-sk],[data-ppl-level],[data-ppl-applylevel],[data-ppl-lv],[data-ppl-find],[data-ppl-alloc],[data-ppl-chip],[data-ppl-cmgo],[data-ppl-cat],[data-ppl-course],[data-ppl-cell2],[data-ppl-assigncourse],[data-ppl-renew],[data-ppl-nudge],[data-ppl-nudgeall],[data-ppl-design],[data-ppl-import],[data-ppl-xs],[data-ppl-sel],[data-ppl-gomod],[data-ppl-mod],[data-ppl-ans],[data-ppl-submitquiz],[data-ppl-try],[data-ppl-bk],[data-ppl-bkopen],[data-ppl-room-open],[data-ppl-day2],[data-ppl-view],[data-ppl-wk2],[data-ppl-book],[data-ppl-rs],[data-ppl-raise],[data-ppl-evac],[data-ppl-fixed],[data-ppl-tk],[data-ppl-mvgo],[data-ppl-cancel],[data-ppl-jr],[data-ppl-emo],[data-ppl-raisepain],[data-ppl-stage],[data-ppl-tp],[data-ppl-forum],[data-ppl-agenda],[data-ppl-minutes],[data-ppl-mf],[data-ppl-newact],[data-ppl-newdec],[data-ppl-fedit],[data-ppl-approvemin]");if(!t)return;const d=t.dataset;
 if(d.pplOpen){entDrawer(d.pplOpen);return}
 if(d.pplTog){st.open[d.pplTog]=st.open[d.pplTog]?0:1;render();return}
 if(d.pplZoom!=null){if(+d.pplZoom===0)st.zoomUser=false;else{st.zoomUser=true;st.zoom=clamp((st.zoom||.88)+(+d.pplZoom)*.1,.4,1.3)}render();return}
 if(d.pplAll!=null){if(d.pplAll==="1")st.people.forEach(p=>{if(hasKids(p.id))st.open[p.id]=1});else st.open={cd:1,oh:1};render();return}
 if(d.pplWk!=null){st.week=+d.pplWk;render();return}
 if(d.pplAddp!=null){addPersonForm();return}if(d.pplAdda!=null){addAgentForm();return}
 if(d.pplAssign){assignForm(d.pplAssign);return}
 if(d.pplForce){const [iid,eid]=d.pplForce.split(":"),it=st.work.find(i=>i.id===iid);closeDrawer();doAssign(it,eid,"Assigned over a warning");return}
 if(d.pplX!=null){closeDrawer();return}
 if(d.pplKill){killForm(d.pplKill);return}
 if(d.pplUndo){const i=+d.pplUndo,x=st.reassign[i],it=st.work.find(w=>w.id===x.iid);if(it){it.owner=x.from;st.reassign.splice(i,1);audit("undid reassignment",it.t);toast("Reassignment undone","info");render()}return}
 if(d.pplLeave!=null){leaveForm(d.pplLeave);return}
 if(d.pplTeam){st.capTeam=d.pplTeam;render();return}
 if(d.pplSk){const [pid,k]=d.pplSk.split(":"),p=H(pid);p.sk[k]=((p.sk[k]||0)+1)%4;if(!p.sk[k])delete p.sk[k];audit("changed skill level",p.n+" · "+SK[k]+" → "+(p.sk[k]||0));render();return}
 if(d.pplLevel){levelDrawer();return}if(d.pplApplylevel){applyLevel();return}
 if(d.pplLv){const [id,s]=d.pplLv.split(":"),l=st.leave.find(x=>x.id===id);l.st=s;audit(s+" leave",nameOf(l.who)+" "+dFmt(l.from)+" to "+dFmt(l.to));toast("Leave "+s+" for "+nameOf(l.who),s==="approved"?"good":"info");render();return}
 if(d.pplFind!=null){findForm();return}
 if(d.pplAlloc){const q=st.find||FP0,w0=wkOf(q.from),w1=wkOf(q.to),p=H(d.pplAlloc);for(let w=w0;w<=w1;w++){const a=st.alloc[p.id][w];const k=q.pr||"PR1";a[k]=(a[k]||0)+q.fte}audit("allocated person",p.n+" "+q.fte+"% to "+(q.pr||"PR1")+" "+WL[w0]+" to "+WL[w1]);const over=[...Array(w1-w0+1)].some((_,i)=>allocTot(p.id,w0+i)>capOf(p.id,w0+i)+.5);toast(p.n+" allocated "+q.fte+"% from "+WL[w0]+(over?". Heads up: that pushes them over capacity in some weeks":""),over?"warn":"good");render();return}
 if(d.pplChip){const [pid,w,pr]=d.pplChip.split(":");chipDrawer(pid,+w,pr);return}
 if(d.pplCmgo){const [pid,w,pr]=d.pplCmgo.split(":");const P2=$("#pplCmP").value,W2=+$("#pplCmW").value,WHO=$("#pplCmWho").value;closeDrawer();moveAlloc(pid,+w,pr,WHO,W2,P2);return}
 if(d.pplCat){st.tr.cat=d.pplCat;render();return}
 if(d.pplCourse){courseDrawer(d.pplCourse);return}
 if(d.pplCell2){const [tm,cid]=d.pplCell2.split(":"),c=COURSE(cid),m=st.people.filter(p=>p.team===tm&&(st.enr[p.id]||{})[cid]);openDrawer(`<div class="eyebrow">${esc(tm)}</div><h3>${esc(c.t)}</h3><div class="needs">${m.map(p=>{const e=st.enr[p.id][cid],late=e.st!=="done"&&daysTo(e.due)<0;return `<div class="need" style="grid-template-columns:1fr auto"><div><b>${esc(p.n)}</b><span class="muted small">${e.st==="done"?"Done "+dFmt(e.done||e.due)+(e.score?", score "+e.score:""):e.st==="progress"?"In progress, "+(e.pct||0)+"%":"Not started"} · due ${dFmt(e.due)}</span></div><span class="pill ${e.st==="done"?"good":late?"bad":"mute"}">${e.st==="done"?"Done":late?"Overdue":"Open"}</span></div>`}).join("")}</div><div class="row" style="margin-top:12px"><button class="btn primary" data-ppl-assigncourse="${cid}">Assign more people</button></div>`);return}
 if(d.pplAssigncourse!=null){assignCourseForm(d.pplAssigncourse);return}
 if(d.pplRenew){const [pid,cid]=d.pplRenew.split(":"),e=st.enr[pid][cid];e.st="todo";e.due=addD(TODAY_ISO,14);e.pct=0;audit("started renewal",nameOf(pid)+" "+COURSE(cid).t);toast("Renewal assigned to "+nameOf(pid)+", due "+dFmt(e.due),"good");render();return}
 if(d.pplNudge){const [pid,a]=d.pplNudge.split(":"),p=H(pid);if(a==="send"){sendNudge(pid);render()}else openDrawer(`<div class="eyebrow">Drafted by Learning Coach</div><h3>Reminder to ${esc(p.n)}</h3><p class="muted" data-role="story">${esc(nudgeDraft(p))}</p><div class="row" style="margin-top:12px">${aiChip({model:"Learning Coach",conf:.9,title:"How the reminder was drafted",src:["Enrollments","Due dates","Manager chain"],guards:["Drafts reminders only","Escalation is sent by a person"]})}<button class="btn primary" data-ppl-nudge="${pid}:send">Send</button></div>`);return}
 if(d.pplNudgeall){let n=0;st.people.forEach(p=>{if(overdueOf(p.id).length){st.nudges[p.id]=(st.nudges[p.id]||0)+1;n++}});audit("sent training reminders",n+" people");toast("Reminders sent to "+n+" people. Managers copied after day 7","good");render();return}
 if(d.pplDesign!=null){designForm();return}if(d.pplImport!=null){importForm();return}
 if(d.pplXs){st.tr.xsel=+d.pplXs;render();return}
 if(d.pplSel){st.tr.sel=d.pplSel;st.tr.mod=0;st.tr.quiz=false;st.tr.ans={};render();return}
 if(d.pplGomod){st.tr.mod=+d.pplGomod;st.tr.quiz=false;render();return}
 if(d.pplMod){const sel=st.tr.sel,c=COURSE(sel),E=st.enr.oh[sel];st.tr.done[sel]=st.tr.done[sel]||[];const dn=st.tr.done[sel];
  if(d.pplMod==="prev"){st.tr.mod=Math.max(0,st.tr.mod-1)}else if(d.pplMod==="quiz"){st.tr.quiz=true}else{if(!st.tr.launched)st.tr.launched={};if(!st.tr.launched[sel]){st.tr.launched[sel]=1;emit("launched","oh",sel)}
   if(!dn.includes(st.tr.mod)){dn.push(st.tr.mod);E.st=E.st==="done"?"done":"progress";E.pct=Math.round(dn.length/c.mods.length*100);emit("progressed","oh",sel,{extensions:{"https://oukala.example/ext/progress":dn.length/c.mods.length}})}st.tr.mod=Math.min(c.mods.length-1,st.tr.mod+1)}render();return}
 if(d.pplAns){const [i,j]=d.pplAns.split(":");st.tr.ans[+i]=+j;render();return}
 if(d.pplSubmitquiz){const sel=st.tr.sel,c=COURSE(sel),qz=QZ[sel]||GQ,ok=qz.filter((q,i)=>st.tr.ans[i]===q[2]).length,sc=ok/qz.length,pass=sc*100>=c.pass,E=st.enr.oh[sel];
  if(pass){E.st="done";E.done=TODAY_ISO;E.score=Math.round(sc*100);E.exp=c.recur?addM(TODAY_ISO,c.recur):null;emit("completed","oh",sel,{completion:true,duration:"PT"+Math.max(5,c.mins)+"M"});emit("passed","oh",sel,{success:true,score:{scaled:sc,raw:ok,max:qz.length}});audit("completed course","Omar Hamid · "+c.t);toast("Passed with "+Math.round(sc*100)+"%. Certificate recorded.","good");S.v.ppl_train=4}
  else{emit("failed","oh",sel,{success:false,score:{scaled:sc,raw:ok,max:qz.length}});toast("Scored "+Math.round(sc*100)+"%, pass mark is "+c.pass+"%. Review the modules and try again.","warn")}st.tr.ans={};st.tr.quiz=!pass;render();return}
 if(d.pplTry){ensureEnr("oh");st.tr.sel=d.pplTry;st.tr.mod=0;st.tr.quiz=false;st.tr.ans={};if(!st.enr.oh[d.pplTry]){const c=COURSE(d.pplTry);st.enr.oh[d.pplTry]={st:"todo",due:c.due,pct:0}}S.v.ppl_train=4;closeDrawer();render();return}
 if(d.pplBk){const b=BK(d.pplBk);if(b)bkDrawer(b.id);return}
 if(d.pplBkopen){bkDrawer(d.pplBkopen);return}
 if(d.pplRoomOpen){roomDrawer(d.pplRoomOpen);return}
 if(d.pplDay2){st.avd.d=+d.pplDay2;st.avd.view="day";render();return}
 if(d.pplView){st.avd.view=d.pplView;render();return}
 if(d.pplWk2){st.avd.wk=+d.pplWk2;render();return}
 if(d.pplBook!=null){bookForm(/^R\d$/.test(d.pplBook)?{room:d.pplBook,d:st.avd.d}:{d:st.avd.d});return}
 if(d.pplRs){const [bid,rid]=d.pplRs.split(":"),b=BK(bid);if(moveBk(b,rid,b.d,b.s))render();return}
 if(d.pplRaise!=null){raiseForm(d.pplRaise);return}
 if(d.pplEvac){const r=ROOM(d.pplEvac);let n=0;st.bk.filter(b=>b.room===r.id&&b.d===6&&b.hy).forEach(b=>{const alt=st.rooms.filter(x=>x.id!==r.id&&x.tr.st==="Online"&&x.cap>=b.att&&(b.av||[]).every(a=>x.eq.includes(a))&&!conflicts(b,x.id,b.d,b.s).bad.length).sort((a,c)=>a.cap-c.cap)[0];if(alt&&moveBk(b,alt.id,b.d,b.s,true))n++});audit("moved bookings off a faulty room",r.n+": "+n);toast(n+" bookings moved out of "+r.n+" to rooms with a working kit",n?"good":"warn");render();return}
 if(d.pplFixed){const r=ROOM(d.pplFixed);r.tr={st:"Online",note:"Teams Room kit, back online"};st.tix.filter(x=>x.room===r.id&&!x.bk).forEach(x=>x.state="Done");audit("room back online",r.n);toast(r.n+" is back online","good");render();return}
 if(d.pplTk){const x=st.tix.find(q=>q.id===d.pplTk);x.state=TKN[(TKN.indexOf(x.state)+1)%3];audit("advanced AV ticket",x.id+" → "+x.state);toast(x.id+" is now "+x.state.toLowerCase(),"info");render();return}
 if(d.pplMvgo){const b=BK(d.pplMvgo);if(moveBk(b,$("#pplMvR").value,+$("#pplMvD").value,+$("#pplMvS").value)){closeDrawer();render()}return}
 if(d.pplCancel){const i=st.bk.findIndex(b=>b.id===d.pplCancel),b=st.bk[i];st.bk.splice(i,1);st.tix.filter(x=>x.bk===b.id).forEach(x=>x.state="Done");audit("cancelled booking",b.t);toast(b.t+" cancelled. Room and technician released.","info");closeDrawer();render();return}
 if(d.pplJr){st.jr.sel=d.pplJr;render();return}
 if(d.pplEmo){const [sid,dl]=d.pplEmo.split(":"),j=JR(),s=j.stages.find(x=>x.id===sid);s.em=clamp(s.em+(+dl),1,5);audit("changed emotion score",j.n+" · "+s.n+" → "+s.em);render();return}
 if(d.pplRaisepain){painForm(d.pplRaisepain);return}
 if(d.pplStage!=null){stageForm();return}if(d.pplTp!=null){tpForm(d.pplTp);return}
 if(d.pplForum){forumDrawer(d.pplForum);return}
 if(d.pplAgenda!=null){agendaForm(d.pplAgenda);return}if(d.pplMinutes!=null){minutesForm(d.pplMinutes);return}
 if(d.pplMf){st.mf=d.pplMf;render();return}
 if(d.pplNewact!=null){actForm();return}if(d.pplNewdec!=null){decForm();return}
 if(d.pplFedit){forumForm(d.pplFedit);return}
 if(d.pplApprovemin){const m=st.minutes.find(x=>x.id===d.pplApprovemin);m.approved=true;audit("approved minutes",FO(m.f).n+" "+m.d);toast("Minutes filed to the record","good");render();return}
});
document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const t=e.target.closest&&e.target.closest("[data-ppl-open][role=button],[data-ppl-bk]");if(t&&t===e.target){e.preventDefault();t.click()}});
/* ---------- chat intents and search ---------- */
const DAYN={mon:12,tue:6,wed:7,thu:8,fri:9};
function parseBook(q){const l=q.toLowerCase();const rm=[[/boardroom|board room/,"R1"],[/training/,"R2"],[/aspen/,"R3"],[/cedar/,"R4"],[/maple/,"R5"],[/birch/,"R6"]].find(x=>x[0].test(l));
 const dm=l.match(/\b(mon|tue|wed|thu|fri)[a-z]*/);const d=l.includes("tomorrow")?7:dm?DAYN[dm[1]]:6;const tm=l.match(/at (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);let s=14;if(tm){let h=+tm[1];if(tm[3]==="pm"&&h<12)h+=12;else if(!tm[3]&&h<8)h+=12;s=h+(tm[2]?+tm[2]/60:0)}
 const ln=l.match(/for (\d+(?:\.\d+)?) ?(hour|hr|h|min)/);let len=1;if(ln)len=ln[2]==="min"?+ln[1]/60:+ln[1];const ppl=l.match(/for (\d+) (people|attendees)/);return {room:rm?rm[1]:"",d,s,len,att:ppl?+ppl[1]:6}}
ASKX.push(q=>{const l=q.toLowerCase();
 if(/\bbook\b.*\b(boardroom|board room|training room|aspen|cedar|maple|birch|huddle|room)\b/.test(l)){const p=parseBook(q);const b=mk({d:p.d,s:p.s,len:p.len,att:p.att,t:"Booked from chat",host:"oh",av:["Display sharing"],hy:true});const r=p.room?ROOM(p.room):bestRoom({...b,att:p.att});
  go("ppl_av");if(!r){say(q,{t:"No room is free that fits "+p.att+" people at "+hh(p.s)+" on "+dLab(p.d)+".",steps:["Checked 6 rooms","Compared seats and free time"]});return true}
  const cf=conflicts(b,r.id,p.d,p.s);if(cf.bad.length){const alt=bestRoom({...b,att:p.att,room:""});say(q,{t:r.n+" is not free: "+cf.bad[0]+"."+(alt&&alt.id!==r.id?" "+alt.n+" is free at that time. Say “book the "+alt.n.toLowerCase()+"” and I will take it.":""),steps:["Checked "+r.n+" on "+dLab(p.d),"Looked for conflicts and seats"]});return true}
  b.room=r.id;b.id="b"+(st.bk.length+100);b.tech=needsTech({att:p.att,av:b.av,tech:r.id==="R1"});st.bk.push(b);const tk=b.tech?raiseTicket(b,"Boardroom booking"):null;st.avd.d=p.d;st.avd.view="day";audit("booked room from chat",r.n+" "+dLab(p.d)+" "+hh(p.s));render();
  say(q,{t:"Booked the "+r.n+" on "+dLab(p.d)+" from "+hh(p.s)+" to "+hh(p.s+p.len)+" for "+p.att+" people, hybrid, with a display."+(tk?" Because it is the Boardroom, "+tk.id+" asks "+nameOf(tk.tech)+" to set up AV.":"")+(cf.warn.length?" Heads up: "+cf.warn[0]+".":""),steps:["Read the room, day and time from your message","Checked conflicts and seats","Created the booking and raised AV if needed"],act:()=>go("ppl_av")});return true}
 if(/who.*(overload|over capacity|stretched|too busy|busiest)|overloaded|over capacity/.test(l)){const ov=overloaded(0).sort((a,b)=>util(b,0)-util(a,0));go("ppl_org");say(q,{t:ov.length?ov.length+" people are over capacity this week: "+ov.slice(0,6).map(p=>p.n+" ("+Math.round(util(p,0))+"%)").join(", ")+(ov.length>6?" and "+(ov.length-6)+" more":"")+". Ops team is the tightest. "+(openCount(ov[0])?"Drag open work to someone with room, or let the Resource Agent propose moves.":""):"Nobody is over capacity this week.",steps:["Computed workload ÷ capacity for "+st.people.length+" people","Applied approved leave"],act:()=>go("ppl_org")});return true}
 if(/(who|which).*(not|haven.?t|hasn.?t|yet to).*(done|finish|complete|taken|take).*(security|training|course)|not (done|finished|completed).*(security|training)|security training.*(overdue|not)/.test(l)){ensureAll();const L=st.people.filter(p=>overdueOf(p.id).some(z=>z.c.id==="C3"));S.v.ppl_train=2;go("ppl_train");say(q,{t:L.length+" people have not finished Security awareness 2026, which closed Oct 2: "+L.map(p=>p.n).join(", ")+". Learning Coach has reminders drafted; managers are copied after day 7.",steps:["Read enrollments for course C3","Filtered to overdue"],act:()=>go("ppl_train")});return true}
 if(/org chart|org structure|who reports to|reporting line|show the org/.test(l)){go("ppl_org");say(q,{t:"Here is the org chart: "+st.people.length+" people and "+st.agents.length+" AI agents in one tree. Agents appear under the human who owns them, tinted by tier. Expand a team with +, or drag open work onto anyone.",steps:["Opened Org chart and workload"],act:()=>go("ppl_org")});return true}
 if(/find (me )?(a |an )?(person|someone|engineer|search|taxonomy)|who can (join|help|work)/.test(l)){const r=findRank(st.find||FP0);S.v.ppl_cap=3;go("ppl_cap");say(q,{t:r.length?"Best match for the current request: "+r[0].p.n+" with a score of "+Math.round(r[0].sc)+", then "+(r[1]?r[1].p.n:"nobody else")+". The formula and each score are on the Find a person tab.":"No one meets the skill level asked for.",steps:["Ranked people by skill fit, availability, continuity and cost"],act:()=>go("ppl_cap")});return true}
 if(/room utili[sz]ation|right.?size|rooms? (are|is) (empty|underused|used)|offline room|room health/.test(l)){const ru=roomUtil();go("ppl_av");say(q,{t:"Rooms are "+Math.round(ru.pct)+"% booked this week against 55%. "+rightSize().length+" bookings could move to a smaller room, and "+st.rooms.filter(r=>r.tr.st==="Offline").map(r=>r.n).join(", ")+" has a Teams Room device offline.",steps:["Summed booked hours","Checked room health"],act:()=>go("ppl_av")});return true}
 if(/journey map|first week|pain point|new hire|customer journey|employee journey/.test(l)){go("ppl_jrny");say(q,{t:"Opening the journey maps. New hire's first week averages "+jrAvg(st.jr.list[0]).toFixed(1)+" of 5, lowest at days 2 and 3 when access and training collide.",steps:["Opened Journey maps"],act:()=>go("ppl_jrny")});return true}
 if(/forum|minutes|decision log|action items?|late actions|cab\b|architecture review board|portfolio council|security council/.test(l)){const late=st.acts.filter(isLate).length;go("ppl_meet");say(q,{t:"Four forums, "+st.acts.filter(a=>a.st!=="done").length+" open actions, "+late+" of them late. Only "+Math.round(actStat())+"% of actions due so far were closed on time.",steps:["Read forum actions and decisions"],act:()=>go("ppl_meet")});return true}
 if(/agents?.*(tier|autonom|owner|kill)|tier [123] agents?/.test(l)){go("ppl_org");say(q,{t:st.agents.length+" agents: "+[1,2,3].map(t=>st.agents.filter(a=>a.tier===t).length+" at tier "+t).join(", ")+". Every one has a human owner of record and a kill-switch level.",steps:["Read the agent registry"],act:()=>go("ppl_org")});return true}
 return false});
SEARCHX.push(()=>st.people.map(p=>({g:"People",t:p.n,m:p.role+" · "+p.team,c:p.c,f:()=>{go("ppl_org");setTimeout(()=>entDrawer(p.id),60)},k:p.team+" "+Object.keys(p.sk).map(k=>SK[k]).join(" ")})));
SEARCHX.push(()=>st.agents.map(a=>({g:"AI agents",t:a.n,m:TIERS[a.tier].ic+" · owner "+nameOf(a.owner),c:a.c,f:()=>{go("ppl_org");setTimeout(()=>entDrawer(a.id),60)},k:a.scope.join(" ")+" agent tier "+a.tier})));
SEARCHX.push(()=>st.rooms.map(r=>({g:"Rooms",t:r.n,m:r.cap+" seats · "+r.tr.st,c:"--p4",f:()=>{go("ppl_av");setTimeout(()=>roomDrawer(r.id),60)},k:r.eq.join(" ")})));
SEARCHX.push(()=>st.courses.map(c=>({g:"Courses",t:c.t,m:c.cat,c:CATC[c.cat],f:()=>{go("ppl_train");setTimeout(()=>courseDrawer(c.id),60)},k:"training learning "+c.src})));
SEARCHX.push(()=>st.jr.list.map(j=>({g:"Journeys",t:j.n,m:"Journey map · "+j.who,c:"--u3",f:()=>{st.jr.sel=j.id;go("ppl_jrny")},k:j.stages.map(s=>s.n).join(" ")})));
SEARCHX.push(()=>st.forums.map(f=>({g:"Forums",t:f.n,m:f.cadence,c:f.c,f:()=>{go("ppl_meet");setTimeout(()=>forumDrawer(f.id),60)},k:"governance decisions minutes"})).concat(st.decs.map(d=>({g:"Decisions",t:d.id+" "+d.t,m:d.st,c:"--w1",f:()=>{S.v.ppl_meet=2;go("ppl_meet")},k:d.why}))));
const _render=render;render=function(){_render.apply(this,arguments);try{pplAfter()}catch(e){console.error("ppl after",e)}};
function pplAfter(){if(S.screen!=="ppl_org")return;const w=document.querySelector(".ppl-treewrap"),t=document.querySelector(".ppl-tree");if(!w||!t)return;const ul=t.firstElementChild;t.style.zoom=1;const nat=ul.getBoundingClientRect().width,avail=w.clientWidth-10;if(!st.zoomUser)st.zoom=clamp(avail/nat,.64,1);t.style.zoom=st.zoom;w.scrollLeft=Math.max(0,(w.scrollWidth-w.clientWidth)/2)}
window.pplDebug={util,overloaded,roomUtil,trainStat,actStat,teamUtil,rightSize,conflicts,peakTeam,findRank,overdueOf};
try{updMetrics()}catch(e){console.error("ppl metrics",e)}
})();
