/* ================= events ================= */
M0("m_deflect",{n:"Self-service deflection",f:"Portal searches and Ask Claude chats that ended in an article read or a completed request, with no ticket raised ÷ all portal searches and chats × 100",u:"%",cur:52,tgt:55,badAt:40,dir:"max",max:100,tr:[41,43,44,46,47,49,51,52],owner:"Service desk",use:["Self-service portal"],rem:{kind:"kb",ref:"KB0101",title:"Rewrite the top five most-ticketed answers",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Finds searches that ended in a ticket and drafts article fixes"}});
const pa=(s)=>String(s||"").split("|");
const oneOf=(r,id)=>r&&r.id===id;
function refreshAll(){render();refreshReq()}
function setVis(it,k,v){it.vis[k]=(k==="comments"||k==="tasks")?!!v:v;audit("changed requester visibility",it.n+" "+k+" = "+v);render()}
const A={
 item(a){V.cat=a[0]||null;S.v.svc_it=a[1]!=null&&a[1]!==""?+a[1]:0;closeDrawer();go("svc_cat")},
 itemfrom(a){closeDrawer();V.cat=a[0];S.v.svc_it=0;go("svc_cat")},
 cc(a){V.cc=a[0];render()},cv(a){V.cv=a[0];render()},
 design(a){designForm(a[0]||null,a[1],a[2],a[3])},
 portal(){V.pItem=null;go("svc_portal")},
 portalitem(a){V.pItem=a[0];V.pTab=0;go("svc_portal")},
 flowview(a){V.flowView=a[0];render()},
 flowreq(a){V.flowReq=a[0]==="1";refreshAll()},
 rqview(a){V.rqView=a[0];refreshAll()},
 lay(a){const it=ITEM(a[0]);it.layout=a[1];Object.keys(FS).forEach(k=>{if(k.endsWith(":"+it.id))delete FS[k]});audit("changed form layout",it.n+" "+a[1]);render()},
 vis(a){setVis(ITEM(a[0]),a[1],a[2])},
 steprv(a){const f=FLOW(a[0]),s=f.steps.find(x=>x.id===a[1]);if(!s)return;if(s.rv){s._rv=s.rv;delete s.rv}else s.rv=s._rv||s.n;clearTpl();REQV++;regWFX();audit("changed step visibility",f.n+" "+s.n);render()},
 editstep(a){if(a[1])stepForm(a[0],a[1])},addstep(a){stepForm(a[0])},delstep(a){delStep(a[0],a[1])},
 capadd(a){capAdd(a[0])},capauto(a){const r=V.capRules.find(x=>x.id===a[0]);if(r){r.auto=!r.auto;audit("capacity rule",r.n+" auto "+r.auto);render()}},
 capnew(){openForm({id:"svc_cap",title:"Add a capacity rule",story:"A rule watches every offering and, when it is true, proposes demand to scale up or down. Fields: util (percent of capacity used), cover (days of supply), growth (percent a quarter), dpm (demand a month), supply, cap.",submit:"Add rule",fields:[{k:"n",label:"Name",type:"text",req:true},{k:"when",label:"When",type:"text",req:true,ph:"util >= 90 and growth > 10"},{k:"act",label:"Then",type:"chips",opts:[["up","Scale up"],["down","Scale down"]],req:true},{k:"auto",label:"Add to demand automatically",type:"toggle"}],defaults:{act:"up"},
  live:v=>{const bad=condKeys(v.when).filter(k=>!["util","cover","growth","dpm","supply","cap","unitCost"].includes(k));const hits=v.when?capModel().filter(r=>{try{return evalCond(v.when,r)}catch(e){return false}}):[];return `<div class="svc-lint"><div class="row"><span class="pill info">${hits.length} offerings match now</span>${hits.slice(0,3).map(h=>`<span class="pill mute">${E(h.off)}</span>`).join("")}</div>${bad.length?`<ul class="svc-issues"><li class="bad">Unknown field: ${E(bad.join(", "))}</li></ul>`:""}</div>`},
  onSubmit:v=>{if(condKeys(v.when).some(k=>!["util","cover","growth","dpm","supply","cap","unitCost"].includes(k)))return{toast:"Fix the unknown field",close:false};V.capRules.push({id:"R"+(V.capRules.length+1),n:v.n,when:v.when,act:v.act,auto:!!v.auto});render();return{toast:"Rule added",audit:v.n}}})},
 impact(a){const s=svcOf(a[0]);window.openImpact&&openImpact({type:"service",service:a[0],id:s?s.id:a[0]})},
 req(a){openReq(a[0])},
 rtab(a){S.v.svc_rqv=+a[0];closeDrawer();go("svc_req")},
 queue(a){V.qTeam=a[0];S.v.svc_rqv=3;if(S.screen!=="svc_req")go("svc_req");else render()},
 bmode(a){V.board=a[0];render()},
 approve(a){const r=RQ(a[0]);if(r&&approve(r,a[1])){toast("Approved","good");refreshAll()}},
 rejectf(a){const r=RQ(a[0]);if(r)rejectForm(r,a[1])},
 complete(a){const r=RQ(a[0]);if(!r)return;const s=(r.act||[]).map(id=>stepOf(r,id)).find(x=>x&&x.type==="human");if(s){completeStep(r,s.id,ME);toast("Step done: "+s.n,"good");if(r.state==="deployed")NOTI("e5",r.requester,r);refreshAll()}},
 completestep(a){const r=RQ(a[0]);if(r&&completeStep(r,a[1],ME)){toast("Step done","good");if(r.state==="deployed")NOTI("e5",r.requester,r);closeDrawer();refreshAll()}},
 assign(a){const r=RQ(a[0]);if(r)assignForm(r,a[1])},
 expedite(a){const r=RQ(a[0]);if(r){expedite(r);toast("Expedited","good");refreshAll()}},
 taskf(a){const r=RQ(a[0]);if(r)taskForm(r)},
 taskdone(a){const r=RQ(a[0]),t=r&&(r.tasks||[]).find(x=>x.id===a[1]);if(t){t.st="Done";log(r,"Task done: "+t.t);audit("task done",r.id);REQV++;refreshAll()}},
 commentf(a){const r=RQ(a[0]);if(r)commentForm(r)},
 cancelf(a){const r=RQ(a[0]);if(r)cancelForm(r)},
 decom(a){const r=RQ(a[0]);if(r){decomReq(r);toast("Decommissioned. The asset is retired.","good");refreshAll()}},
 pview(a){V.pView=a[0];render()},
 pitem(a){V.pItem=a[0]||null;V.pTab=0;render();window.scrollTo&&window.scrollTo(0,0)},
 ptab(a){V.pTab=+a[0];render()},
 pcat(a){V.pCat=a[0];render()},
 pask(a){pAsk(a.join("|"))},
 pfor(a){V.pFor=a[0]||ME;render()},
 mine(){V.pAll=!V.pAll;render()},
 psubmit(a){submitOrder(ITEM(a[0]))},
 my(a){openMy(a[0])},
 kb(a){openKb(a[0])},
 pub(a){const it=ITEM(a[0]);it.state=it.state==="Published"?"Draft":"Published";audit("portal visibility",it.n+" "+it.state);render()},
 feat(a){const it=ITEM(a[0]),on=featured().includes(it);V.feat[it.id]=!on;audit("popular item",it.n+" "+!on);render()},
 mycomment(a){const r=RQ(a[0]);if(!r)return;openForm({id:"svc_mc",title:"Message the team",story:"Your message goes to whoever has your request.",submit:"Send",fields:[{k:"tx",label:"Message",type:"longtext",req:true,wide:true}],onSubmit:v=>{(r.cm=r.cm||[]).push({by:ME,t:NOW,tx:v.tx,int:false});log(r,"Message from "+ME,ME);REQV++;render();return{toast:"Sent",audit:r.id}}})},
 nudge(a){const r=RQ(a[0]);if(!r)return;(r.cm=r.cm||[]).push({by:ME,t:NOW,tx:"Could I get an update on this request?",int:false});log(r,ME+" asked for an update",ME);const w=r.w[0];if(w&&w.k==="person")NOTI("e4",w.n,r);audit("asked for an update",r.id);toast("We have asked "+(w?w.n:"the team")+" for an update.","good");REQV++;openMy(r.id)},
 rate(a){const r=RQ(a[0]);if(!r)return;const it=ITEM(r.item);openForm({id:"svc_rt",title:"How did it go?",story:it.xla.q+" Your answer helps us improve this item.",submit:"Send rating",fields:[{k:"s",label:"Rating",type:"chips",opts:[["5","5 Very easy"],["4","4"],["3","3"],["2","2"],["1","1 Very hard"]],req:true},{k:"c",label:"Anything we should know?",type:"longtext",wide:true}],onSubmit:v=>{r.xla=+v.s;r.rated=true;REQV++;render();return{toast:"Thank you",audit:r.id+" "+v.s}}})},
 ast(a){openAsset(a[0])},astnew(){astNewForm()},astassign(a){const x=ASSETS.find(y=>y.id===a[0]);if(x)assignForm2(x)},
 astmove(a){const x=ASSETS.find(y=>y.id===a[0]);if(x&&astMove(x,a[1])){toast(x.id+" is now "+a[1].toLowerCase(),"good");render();openAsset(x.id)}},
 lic(a){openLic(a[0])},reclaim(a){reclaimForm(a[0])},
 pst(a){V.pst=+a[0];render()},
 mx(a){MX[a[0]][a[1]]=MX[a[0]][a[1]]?0:1;audit("notification matrix",evN(a[0])+" on "+chN(a[1])+" = "+MX[a[0]][a[1]]);render()},
 q(a){QH[a[0]]=!QH[a[0]];audit("quiet hours",a[0]+" = "+QH[a[0]]);render()},
 tplsel(a){V.tplSel=a[0];render()},tplnew(){tplForm()},tpledit(a){tplForm(a[0])},
 logf(a){V.logF=a[0];render()},
 log(a){logDrawer(a[0])},
 retry(a){const l=logRows().find(x=>x.id===a[0]);if(!l)return;if(l.perm){toast("A permanent error cannot be retried. Use another channel.","warn");return}l.st="Delivered";l.why="";audit("retried notification",l.id);toast("Delivered on retry","good");closeDrawer();render()},
 fallback(a){const l=logRows().find(x=>x.id===a[0]);if(!l)return;l.ch=l.ch!=="teams"?"teams":"email";l.st="Delivered";l.why="";audit("fallback channel",l.id);toast("Sent on "+chN(l.ch),"good");closeDrawer();render()}
};
document.addEventListener("click",e=>{let t=e.target.closest("[data-svc]");if(t){const a=pa(t.dataset.svc),fn=A[a[0]];if(fn){if(t.tagName==="A")e.preventDefault();fn(a.slice(1),t)}return}
 if(t=e.target.closest("[data-svc-step]")){const [rid,sid]=pa(t.dataset.svcStep);openStep(rid,sid);return}
 if(t=e.target.closest("[data-svc-c]")){const [sc,k,v]=pa(t.dataset.svcC);setF(sc,k,v,true);return}
 if(t=e.target.closest("[data-svc-m]")){const [sc,k,v]=pa(t.dataset.svcM),it=ITEM(sc.split(":")[1]),cur=fvOf(sc,it)[k]||[];setF(sc,k,cur.includes(v)?cur.filter(x=>x!==v):cur.concat(v),true);return}
 if(t=e.target.closest("[data-svc-t]")){const [sc,k]=pa(t.dataset.svcT),it=ITEM(sc.split(":")[1]);setF(sc,k,!fvOf(sc,it)[k],true);return}
 if(t=e.target.closest("[data-svc-sec]")){const [sc,i]=pa(t.dataset.svcSec);FS[sc]=+i;REFRESH(sc);return}
 if(t=e.target.closest("[data-svc-aifill]")){const sc=t.dataset.svcAifill,it=ITEM(sc.split(":")[1]),st=(V.ai=V.ai||{})[sc]||{t:""};const res=aiFill(it,st.t,fvOf(sc,it));FV[sc]=res.vals;V.ai[sc]={t:st.t,notes:res.notes,conf:res.conf};audit("AI-assisted fill",it.n+" "+res.notes.length+" fields");toast(res.notes.length?"Claude filled "+res.notes.length+" fields. Check them before you submit.":"Nothing to fill. Try naming the device, reason or date.",res.notes.length?"good":"warn");render();return}});
document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const t=e.target.closest&&e.target.closest("[role=button][data-svc],[data-svc-step],.svc-rowlink");if(t&&t===e.target&&!/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(t.tagName)){e.preventDefault();t.click()}});
document.addEventListener("input",e=>{const t=e.target;const d=t.dataset||{};
 if(d.svcF){const [sc,k]=pa(d.svcF);if(t.type==="file")return;const v=t.type==="number"||t.type==="range"?(t.value===""?"":+t.value):t.value;if(t.type==="range"){const b=t.parentNode.querySelector("b");const x=ITEM(sc.split(":")[1]).vars.find(q=>q.k===k);if(b)b.textContent=v+((x&&x.unit)||"")}setF(sc,k,v,false);return}
 if(d.svcAi!==undefined){const sc=d.svcAi;(V.ai=V.ai||{})[sc]=Object.assign(V.ai[sc]||{},{t:t.value});return}
 if(d.svcPsq!==undefined){psearch(t.value);return}
 if(d.svcCq!==undefined){V.cq=t.value;const p=t.selectionStart;render();const n=document.querySelector("[data-svc-cq]");if(n){n.focus();try{n.setSelectionRange(p,p)}catch(x){}}}});
document.addEventListener("change",e=>{const t=e.target,d=t.dataset||{};
 if(d.svcF&&t.type==="file"){const [sc,k]=pa(d.svcF);setF(sc,k,t.files&&t.files[0]?t.files[0].name:"",true);return}
 if(d.svcF&&t.tagName==="SELECT"){const [sc,k]=pa(d.svcF);setF(sc,k,t.value,true);return}
 if(d.svcApwho!==undefined){V.apWho=t.value;render();return}
 if(d.svcDg){const [p,f]=pa(d.svcDg);DIG[p][f]=t.value;audit("digest preference",PERSONAS[p].n+" "+f+" = "+t.value);toast(PERSONAS[p].n+": "+t.value,"good");return}
 if(d.svcQt){QH[d.svcQt]=t.value;audit("quiet hours",d.svcQt+" = "+t.value);render()}});
document.addEventListener("toggle",e=>{const t=e.target;if(t.matches&&t.matches("details[data-svc-cacc]")){V.accC=V.accC||{};V.accC[t.dataset.svcCacc]=t.open}if(t.matches&&t.matches("details[data-svc-acc]")){const [sc,s]=pa(t.dataset.svcAcc);V.acc=V.acc||{};V.acc[sc+s]=t.open}},true);
document.addEventListener("submit",e=>{const f=e.target;if(f.matches&&f.matches("[data-svc-pform]")){e.preventDefault();const q=f.querySelector("input").value.trim();if(q)pAsk(q);return}
 if(f.matches&&f.matches("[data-svc-forform]")){e.preventDefault();const n=f.querySelector("input").value.trim();if(!n){V.pFor=ME;render();return}const r=DIR.find(d=>d.name.toLowerCase()===n.toLowerCase()&&d.kind!=="ai");if(!r){toast(n+" is not in the directory","warn");return}V.pFor=r.name;audit("ordering on behalf of",r.name);render();toast("Ordering for "+r.name+". Approvals follow them.","good")}});
/* ================= registration ================= */
REG("svc_cat","Service catalog","service","M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z",screenCat);
REG("svc_req","Requests and fulfillment","service","M4 6h16M4 12h10M4 18h6M16 15l3 3 3-4",screenReq);
REG("svc_portal","Self-service portal","service","M3 11l9-8 9 8v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 21v-7h6v7",screenPortal);
REG("svc_asset","Assets and software licenses","service","M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10",screenAsset);
REG("svc_notify","Notification engine","automate","M12 3a6 6 0 0 0-6 6c0 6-3 7-3 7h18s-3-1-3-7a6 6 0 0 0-6-6zM10 20a2 2 0 0 0 4 0",screenNotify);
const PS=(n,d,who_,o)=>Object.assign({n,d,who:who_},o||{});
PROC.reg("svc_cat",{title:"From catalog item to delivered service",std:["itil5","bpmn","xla"],steps:[PS("Design the item","Questions, price, approval rules and the workflow are defined together, with AI helping draft the form.","human",{owner:"Service owner"}),PS("Publish and show","Choose what requesters see, then publish to the portal.","human",{owner:"Service owner"}),PS("Request arrives","A person, a delegate or Claude on someone's behalf submits it.","auto",{in:"Portal, chat"}),PS("Approvals by data","Rules read the request and find the approvers.","gate",{owner:"Resolved per request"}),PS("Fulfill","Teams, AI agents and automatic steps run the workflow.","agent",{owner:"Assignment teams"}),PS("Measure and scale","Cost, time and experience roll up; capacity rules raise demand.","auto",{out:"Demand, metrics"})]});
PROC.reg("svc_req",{title:"How a request moves",std:["itil5"],steps:[PS("Submitted","Created from the portal, chat or on behalf of someone.","auto"),PS("Approvals","Each triggered rule asks its approver. A person never approves their own request.","gate",{sla:"8 h"}),PS("Queued to a team","Work lands in a team first.","human",{owner:"Assignment team"}),PS("Claimed or assigned","A person claims it, or is assigned with a reason.","human"),PS("Worked","Automatic and AI steps run; people do the rest.","agent"),PS("Delivered and rated","Requester confirms and rates the experience.","human",{out:"XLA score"})]});
PROC.reg("svc_portal",{title:"What happens when you order",std:["itil5","xla"],steps:[PS("Find it","Search, browse, or describe it to Claude.","human"),PS("Fill the form","The form changes with the item. Claude can fill it from your words.","agent"),PS("See the price and approvers","Shown before you submit.","auto"),PS("Approve","Only the approvers your answers trigger.","gate"),PS("Track it","You see stages and who has it, as far as the item allows.","auto")]});
PROC.reg("svc_asset",{title:"Life of a device and a license",std:["itil5","csdm"],steps:[PS("Ordered","From a catalog request or added by hand.","auto"),PS("Received and tagged","Receiving confirms and tags it.","human",{owner:"Facilities"}),PS("In stock or deployed","Assigned to a person and enrolled in Intune.","auto"),PS("Reconciled","Inventory is matched to Intune and sign-in data.","agent"),PS("Retired","Wiped and decommissioned. Licenses are returned.","human",{owner:"Endpoint team"})]});
PROC.reg("svc_notify",{title:"How a notification travels",std:["itil5"],steps:[PS("Event","A record changes.","auto"),PS("Rules","Who should hear, by role and preference.","auto"),PS("Dedupe and throttle","Never say it twice.","auto"),PS("Template and channel","Fill the message and choose the door.","auto"),PS("Delivery log","Retry, fall back and prove it landed.","agent")]});
/* ================= chat ================= */
const findReq=q=>{const m=/ritm\d+/i.exec(q);return m?RQ(m[0].toUpperCase()):null};
ASKX.push(q=>{
 let m;
 if((m=/\b(order|get|need|request|buy|want)\b.{0,40}\b(laptop|phone|software|access|monitor|project)/i.exec(q))&&!/where|status|waiting/i.test(q)){const who2=DIR.filter(d=>d.kind!=="ai"&&d.kind!=="msp"&&d.name!==ME&&new RegExp("\\b"+d.name.split(" ")[0]+"\\b","i").test(q))[0];if(who2)V.pFor=who2.name;pAsk(q);say(q,{t:`Opening the order form${who2?" for <b>"+E(who2.name)+"</b>":""}. I filled in what I could from your words; check it, then submit.${who2?" Approvals follow "+E(who2.name)+": "+E(WORKER(who2.name))+", "+E(REGION(who2.name))+". The summary on the right shows who has to approve and why.":""}`,steps:["Matched the catalog item","Filled the form from your words","Resolved approvers from the data"]});return true}
 if(/where is|status of|what.?s happening with|track|waiting on/i.test(q)&&/request|ritm|laptop|order|onboarding|approval/i.test(q)){const r=findReq(q)||mineOf().find(x=>x.state==="pending"||x.state==="fulfilling"||x.state==="approved");if(!r){say(q,{t:"You have no open requests."});return true}const it=ITEM(r.item);openReq(r.id);say(q,{t:`<b>${E(r.id)}</b>, ${E(it.n)}, is <b>${E(STC[r.state][0].toLowerCase())}</b>. ${r.w[0]?"It is with <b>"+E(r.w[0].n)+"</b> on "+E(r.stepN)+". ":""}${r.sl}% of its SLA is used${r.sl>=75?", so it is at risk":""}.`,steps:["Found the request","Read its approvals and steps"]});return true}
 if(/approv(al|als)?.{0,30}(waiting|pending|stuck|longest|oldest)|(waiting|pending).{0,20}approv/i.test(q)){const d=agg(),rows=apRows();go("svc_req");S.v.svc_rqv=2;say(q,{t:`<b>${d.pendAp}</b> approvals are waiting. The longest is <b>${E(rows[0]?rows[0].rule:"none")}</b> on ${E(rows[0]?rows[0].rid:"")}, waiting ${rows[0]?hh(rows[0].h):""} for ${E(rows[0]?rows[0].who:"")}.`,steps:["Counted pending approvals","Sorted by waiting time"]});return true}
 if(/(requests?|slas?).{0,25}(risk|breach|late|over)|at risk/i.test(q)&&/request|ritm|fulfil/i.test(q)){const d=agg();go("svc_req");say(q,{t:`<b>${d.risk.length}</b> open requests have used 75% or more of their SLA and <b>${d.risk.filter(r=>r.sl>=100).length}</b> are already over.`,steps:["Read SLA clocks"]});return true}
 if(/(how many|count|stock).{0,30}(laptop|phone|device|asset)|(laptop|phone|device)s?.{0,20}(in stock|available)/i.test(q)){const d=astAgg();go("svc_asset");say(q,{t:`<b>${N(d.st["In stock"])}</b> devices are in stock and <b>${N(d.st.Ordered+d.st.Received)}</b> are on order or received. <b>${N(d.st.Deployed)}</b> are deployed.`,steps:["Counted assets by lifecycle state"]});return true}
 if(/(complian|true.?up|exposure|over.?licen|entitle).{0,30}licen[cs]|licen[cs].{0,30}(complian|true.?up|exposure|enough)|are we compliant/i.test(q)){const a=licAgg(),ov=a.L.filter(l=>l.asg>l.ent);go("svc_asset");S.v.svc_astv=2;say(q,{t:ov.length?`Not quite. ${ov.map(l=>E(l.n)+" is "+(l.asg-l.ent)+" over").join(", ")}. Exposure is <b>${money(a.ex)}</b>. Reclaiming unused seats is the cheapest fix.`:"Yes. Every title is within its entitlement.",steps:["Compared entitled and assigned seats"]});return true}
 if(/notification|quiet hours|digest|delivery log/i.test(q)){const n=notifyDash();go("svc_notify");say(q,{t:`Delivery rate is <b>${n.rate.toFixed(1)}%</b> with ${N(n.p.fail)} failures to fix, mostly contact data.`,steps:["Read the delivery log"]});return true}
 if(/(scale|capacity|demand).{0,25}(service|catalog|laptop|offering)|need to scale/i.test(q)){const ev=capEval();go("svc_cat");S.v.svc_catv=3;say(q,{t:ev.out.length?`${ev.out.length} offerings trigger a scaling rule: ${ev.out.slice(0,3).map(o=>E(o.row.off)+" ("+o.act+")").join(", ")}. Rules marked automatic have already added demand.`:"Nothing needs to scale right now.",steps:["Evaluated capacity rules"]});return true}
 if(/service catalog|catalog item|self.?service|portal/i.test(q)){go("svc_portal");say(q,{t:`The portal has ${pubItems().length} published items. Median fulfillment is ${agg().ftime} days.`});return true}
 return false});
SEARCHX.push(()=>CAT.map(c=>({g:"Service catalog",t:c.n,m:c.cat,c:"--p4",f:()=>{V.cat=c.id;S.v.svc_it=0;go("svc_cat")},k:c.short+" order request "+c.svc+" "+c.off})));
SEARCHX.push(()=>REQS.slice(0,SCALE.on?500:300).map(r=>({g:"Requests",t:r.id+" "+itemName(r.item),m:STC[r.state][0],c:"--p3",f:()=>{go("svc_req");openReq(r.id)},k:r.requester+" "+(r.onBehalfOf||"")+" "+r.req+" "+r.service})));
SEARCHX.push(()=>KB.map(k=>({g:"Knowledge",t:k.t,m:k.id,c:"--p5",f:()=>openKb(k.id),k:k.tags})));
SEARCHX.push(()=>LICB.map(l=>({g:"Licenses",t:l.n,m:l.asg+" of "+l.ent,c:"--s3",f:()=>{go("svc_asset");openLic(l.id)},k:"license licence compliance true-up "+l.v})).concat(ASSETS.slice(0,SCALE.on?400:150).map(a=>({g:"Assets",t:a.id+" "+a.model,m:a.st,c:"--s4",f:()=>{go("svc_asset");openAsset(a.id)},k:a.who+" warranty hardware "+a.cls}))));
SEARCHX.push(()=>TPL.map(t=>({g:"Notification templates",t:evN(t.ev)+" on "+chN(t.ch),m:t.id,c:"--e4",f:()=>{V.tplSel=t.id;S.v.svc_ntv=3;go("svc_notify")},k:t.body})));
window.svcOpenRequest=openReq;window.svcOpenAsset=openAsset;
const findItem=x=>{x=String(x||"").toLowerCase();return CAT.find(c=>c.id.toLowerCase()===x||c.n.toLowerCase()===x)||CAT.find(c=>c.n.toLowerCase().includes(x)||x.includes(c.id.toLowerCase()))};
window.svcCreateReq=function(item,vals,by,forWho){try{ensure();const it=typeof item==="object"&&item?item:findItem(item);if(!it)return{ok:false,error:"No catalog item matches "+item};const v=Object.assign(defVals(it),vals||{}),who=by||ME,fw=forWho||who;const r=createReq(it,v,who,fw);try{render()}catch(e){}return{ok:true,id:r.id,state:r.state,item:it.n,service:it.svc,price:r.price,approvers:uniq(Object.values(r.ap).map(a=>a.who)),with:r.withN||""}}catch(e){return{ok:false,error:String(e&&e.message||e)}}};
window.svcApprove=function(reqId,who,note){try{const r=RQ(reqId);if(!r)return{ok:false,error:"Request not found"};const ks=Object.keys(r.ap).filter(k=>r.ap[k].st==="pending"&&(!who||r.ap[k].who===who||k===who));if(!ks.length)return{ok:false,error:"Nothing pending"+(who?" for "+who:"")};ks.forEach(k=>approve(r,k,note||"Approved through the platform"));try{render()}catch(e){}return{ok:true,id:r.id,state:r.state,approved:ks.length,with:r.withN||""}}catch(e){return{ok:false,error:String(e&&e.message||e)}}};
window.svcStatus=function(reqId){const r=RQ(reqId);if(!r)return null;return{id:r.id,item:itemName(r.item),service:r.service,state:r.state,stateLabel:STC[r.state][0],with:r.withN||"",step:r.stepN||"",slaUsedPct:r.sl,cost:r.cost,requester:r.requester,onBehalfOf:r.onBehalfOf||null,approvals:Object.keys(r.ap).map(k=>({id:k,who:r.ap[k].who,state:r.ap[k].st})),opened:r.created}};

try{agg();astAgg();licAgg();notifyDash();regWFX()}catch(e){console.error("svc init",e)}
})();
