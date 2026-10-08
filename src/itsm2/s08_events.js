
/* ============ init, drag and drop, events, search, chat, work, workflow, data model ============ */
if(!X.apol){X.apol=POL_SEED();X.sim={src:"CHG0312",type:"Normal",svc:"Codification Portal",ci:"",env:"Production",grp:"Platform team",tpl:"no",cost:0,risk:"auto"};X.seq.ap=Math.max(X.seq.ap||0,12);seedApprovals()}
const pidOf=el=>{const b=el&&el.closest&&el.closest("[data-itsm-fishbox]");return b?b.dataset.itsmFishbox:(X.fsel&&X.fsel.pid)};
const calcPrefill=()=>{const c=X.calc||CDEF;return {svc:c.svc,ua:+c.ua||0,deg:+c.deg||0,txh:+c.txh||0,reg:String(c.reg||0),urg:String(c.urg||3),role:c.role||"analyst",vip:c.vip||"",apprBy:c.apprBy||""}};
function gotoTab(scr,tab){S.v[scr]=tab;if(S.screen!==scr)go(scr);else render()}
/* ---------- drag and drop ---------- */
DND.on("itsm_inc",(id,from,to)=>{const i=INC(id);if(!i)return;
 if(to==="claim:me"){if(members(i.grp).some(m=>m.name===ME)){claim(i,ME,"",false);return done("Claimed",id+" by "+ME)}toast(ME+" is not in "+i.grp+". Drop it on a team, or open it and swarm or assign with a reason.","warn");render();return}
 if(to.startsWith("grp:")){const t=to.slice(4);if(t===i.grp){render();return}const old=i.grp;i.grp=t;const m=i.own&&who(i.own);let cleared="";if(m&&m.kind==="human"&&m.team!==t&&!(i.direct)){cleared=i.own;i.own="";}else if(m&&m.kind==="human"&&m.team!==t&&i.direct){/* keep, with its documented reason */}
  i.notes.push({a:0,w:"System",k:"System",x:"Reassigned from "+old+" to "+t+" by drag and drop."+(cleared?" "+cleared+" is not in "+t+", so the incident returns to the team queue.":"")});return done("Incident reassigned to a team",id+" → "+t+(cleared?" (back in the team queue)":""))}
 if(to.startsWith("st:")){const s=to.slice(3);if(s===i.st){render();return}if(s==="Resolved"){render();return resolveForm(id)}if(s==="On hold"){render();return holdForm(id)}setState(i,s)}});
DND.on("itsm_link",(id,from,to)=>{const i=INC(id);if(!i)return;const t=to==="pool"?"":to.slice(4);if(t===(i.prb||"")){render();return}i.prb=t;pidxReset();i.notes.push({a:0,w:"System",k:"System",x:t?"Linked to problem "+t+" by drag and drop.":"Unlinked from its problem."});
 done(t?"Incident linked to problem":"Incident unlinked",id+(t?" → "+t+" ("+incsOf(PRB(t)).length+" incidents now)":""))});
DND.on("itsm_cal",(id,from,to)=>{const c=CHGB(id);if(!c)return;const day=to.slice(4);if(day===c.start){render();return}
 if(day<TODAYI){toast("A change cannot move into the past","warn");render();return}
 const len=dif(c.end,c.start),old=c.start;c.start=day;c.end=addD(day,len);const cl=collisions(c).filter(x=>x.kind==="hard"),fz=freezeHits(c);
 if(c.st==="Authorize"&&!c.stages.some(s=>s.ap.some(a=>a.dec!=="pending")))applyRoute(c,route(c));
 syncM();audit("rescheduled change",id+" "+fd(old)+" → "+fd(day)+(cl.length?" · collides with "+cl.map(x=>x.o.id).join(", "):"")+(fz.length?" · inside "+fz[0].n:""));
 toast(id+" moved to "+wk(day)+" "+fd(day)+". "+(cl.length?"Collision with "+cl.map(x=>x.o.id).join(", ")+" on "+cl[0].sh.map(ciN).join(", ")+".":fz.length?"Inside "+fz[0].n+": needs an exception.":!wkday(day)?"Weekend: check on-call cover.":"No collisions, no freeze."),cl.length||fz.length?"bad":"good");render()});
DND.on("itsm_role",(id,from,to)=>{const m=X.mi;if(from===to){render();return}const fr=from.startsWith("role:")?from.slice(5):null;Object.keys(m.roles).forEach(k=>{if(m.roles[k]===id)m.roles[k]=""});
 if(to==="pool"){m.tl.push([0,"System","Update",id+" released from "+(MROLES.find(r=>r[0]===fr)||[0,"a role"])[1]+"."]);return done("Role released",id)}
 const r=to.slice(5),prev=m.roles[r];m.roles[r]=id;if(fr&&prev)m.roles[fr]=prev;const rn=MROLES.find(x=>x[0]===r)[1];m.tl.push([0,"System","Update",id+" is now "+rn.toLowerCase()+"."+(prev&&prev!==id?" "+prev+" moved aside.":"")]);done("Role assigned",id+" → "+rn)});
/* ---------- click events ---------- */
const INCACT=["start","ack","hold","resolve","assign","link","ovr","claim","reopen","applyai2","prb","chg","major"];
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-itsm-a]");if(!t)return;const d=t.dataset,a=d.itsmA,id=d.id;
 if(a==="new")return incForm(d.from==="calc"?calcPrefill():undefined);
 if(a==="applyai"){const st=FORMST.itsm_inc;if(!st)return;const v=st.vals,c=classify((v.title||"")+" "+(v.desc||""));v.cat=c.cat;v.grp=c.grp;if(!v.svc&&c.svc)v.svc=c.svc;if((+v.ua||0)<=1&&c.ua)v.ua=c.ua;if((+v.deg||0)===30&&c.deg)v.deg=c.deg;refreshForm("itsm_inc");audit("applied AI triage",c.cat+" · "+c.grp);toast("Applied AI triage: "+c.cat+", "+c.grp+". Review before saving.","info");return}
 if(a==="note"){const ta=$("#itsmNoteTxt"),x=ta&&ta.value.trim();if(!x){ta&&ta.focus();toast("Write the note first","warn");return}const i=INC(id);i.notes.push({a:0,w:i.own||ME,k:d.k,x});if(d.k==="Comment"&&i.respH==null)i.respH=i.age;audit("added "+d.k.toLowerCase(),id);toast(d.k+" added");render();return incDrawer(id)}
 if(a==="open"){return incDrawer(id)}
 if(a==="impact")return openImp(d.t||"incident",id,d.svc,d.ci);
 if(a==="midecl"){if(X.mi.on&&!id){go("itsm_mi");return}return midecl(id)}
 if(a==="gomi")return go("itsm_mi");
 if(a==="polform")return polForm(d.v);if(a==="roleform")return roleForm(d.v);if(a==="vipform")return vipForm(d.v);
 if(a==="fgrp"||a==="fsvc"){setFacet("itsm_incl",a==="fgrp"?"grp":"svc",d.v);S.v.itsm_inc=0;if(S.screen!=="itsm_inc")go("itsm_inc");else render();return}
 if(INCACT.includes(a))return incAct(a,id,t);
 /* problems */
 if(a==="prbo")return prbDrawer(id);
 if(a==="pnew")return prbForm();
 if(a==="pe")return prbForm({},id);
 if(a==="padv"){const p=PRB(id),n=PST[PST.indexOf(p.st)+1];if(n){p.st=n;done("Problem advanced",p.id+" → "+n);prbDrawer(p.id)}return}
 if(a==="pfix"){const p=PRB(id);return chgForm({svc:p.svc,prb:p.id,t:"Fix for "+p.id+": "+p.t,just:p.fix||"Permanent fix for "+p.t,type:"Normal"})}
 if(a==="pimpact"){const p=PRB(id);return openImp("problem",id,p.svc,"")}
 if(a==="rkb")return rcaKnowledge(PRB(id));
 if(a==="rdem")return rcaDemand(PRB(id));
 if(a==="kenew"){const p=id&&PRB(id);return keForm(p?{prb:p.id,t:p.t,wa:p.workaround,cause:p.cause,sym:p.t}:{})}
 if(a==="ke")return keForm({},id);
 if(a==="kuse"){const k=allKE().find(x=>x.id===id);if(k){k.used++;k.help++;audit("marked known error helpful",k.id);toast("Thanks. "+k.id+" has helped "+k.help+" times.");kbDrawer(k.id)}return}
 if(a==="fxadd")return causeForm(pidOf(t),d.cat);
 if(a==="fxroot"||a==="fxdel"||a==="fxwhy"){const [pid,lid]=[id.slice(0,id.indexOf(":")),id.slice(id.indexOf(":")+1)],p=PRB(pid),r=p&&leafOf(p,lid);if(!r)return;
  if(a==="fxroot"){p.root=p.root===lid?"":lid;if(p.root)p.cause=(r.l.st==="confirmed"?"Confirmed: ":"Probable: ")+r.l.t;audit(p.root?"marked root cause":"unmarked root cause",pid+": "+r.l.t)}
  if(a==="fxdel"){const f=mkFish(p);f[r.c]=f[r.c].filter(x=>x.id!==lid);if(p.root===lid)p.root="";X.fsel.leaf="";audit("removed a cause",pid+": "+r.l.t)}
  if(a==="fxwhy"){const k=p.why.findIndex(w=>!w);if(k<0)toast("All five whys are answered. Edit them in the analysis form.","warn");else{p.why[k]="Because "+r.l.t.charAt(0).toLowerCase()+r.l.t.slice(1);audit("used a cause as a why",pid);toast("Added as why "+(k+1),"good")}}
  refreshFish(pid);if(a==="fxwhy")render();return}
 /* changes */
 if(a==="chgo")return chgDrawer(id);
 if(["cedit","csubmit","cstart","cclose","ccancel","cmove","cwhatif","cimpact"].includes(a))return chgAct(a,id);
 if(a==="cnew")return chgForm();
 if(a==="cab"){const [cid,si,ai,dec]=id.split(":"),c=CHGB(cid);if(dec==="approved"){cabDecide(c,+si,+ai,"approved","");return chgDrawer(cid)}return cabForm(cid,+si,+ai,dec)}
 if(a==="cmonth"){const [y,m]=X.cm.split("-").map(Number),dt=new Date(Date.UTC(y,m-1+(+id),1)),k=dt.getUTCFullYear()+"-"+z2(dt.getUTCMonth()+1);if(k<"2026-07"||k>"2027-03"){toast("The calendar covers Jul 2026 to Mar 2027","warn");return}X.cm=k;render();return}
 if(a==="dayopen")return dayDrawer(id);
 if(a==="tnew")return tplForm();
 if(a==="tuse"){const tp=X.tpl.find(x=>x.id===id);return chgForm({type:"Standard",t:tp.n,svc:tp.svc,cis:tp.cis.slice(),just:"Routine change using approved template "+tp.id+". "+tp.pre,impl:tp.steps,back:tp.back,test:"Template "+tp.id+": "+tp.runs+" prior runs at "+tp.ok+"% success.",tpl:tp.id,own:tp.owner,win:WINS[0],rq_tier:"1",rq_users:"0",rq_test:"0",rq_back:"0",rq_auto:"0",rq_time:"0",rq_prec:"0",rq_vend:"0"})}
 if(a==="tsug"){const s=[["Scale Azure SQL up and down for a load test","Data platform","Scale one tier up, run the test, scale back down within 48 hours."],["Deploy a minor search index schema update","Search and indexing","Apply the schema update to staging, verify, then production, then re-index."]][+id];return tplForm({n:s[0],svc:s[1],steps:s[2],back:"Revert the change and restore the last snapshot.",pre:"Within the approved tier; no data migration; tested in staging.",freq:"As needed",dur:"1 h",owner:"Jordan Lee"})}
 if(a==="frz")return frzForm();
 if(a==="adv"){X.advSel=id;render();return}
 /* approval policies */
 if(a==="apnew")return apForm();
 if(a==="apedit")return apForm(id);
 if(a==="aptog"){const p=X.apol.find(x=>x.id===id);p.on=p.on===false;audit((p.on?"turned on":"turned off")+" approval policy",p.id+" "+p.n);toast(p.id+(p.on?" is on":" is off"));render();return}
 if(a==="apup"||a==="apdn"){const n=X.apol.findIndex(x=>x.id===id),m=a==="apup"?n-1:n+1;if(m<0||m>=X.apol.length)return;const p=X.apol.splice(n,1)[0];X.apol.splice(m,0,p);audit("reordered approval policy",id+" to position "+(m+1));render();return}
 if(a==="apdup"){const p=X.apol.find(x=>x.id===id),q=JSON.parse(JSON.stringify(p));q.id="AP"+(X.seq.ap++);q.n=p.n+" (copy)";q.on=false;X.apol.splice(X.apol.indexOf(p)+1,0,q);audit("copied approval policy",id+" → "+q.id);toast("Copied as "+q.id+" (off). Edit and turn it on.");render();return}
 if(a==="apdel"){const p=X.apol.find(x=>x.id===id);openForm({id:"itsm_apdel",title:"Delete policy "+id,story:"Deleting a policy changes who must approve future changes. Changes already routed keep their approvers. Turning a policy off is reversible; deleting is not.",submit:"Delete policy",fields:[{k:"why",label:"Reason",type:"longtext",req:true,wide:true}],onSubmit:v=>{X.apol=X.apol.filter(x=>x.id!==id);audit("deleted approval policy",id+" "+p.n+" · "+v.why);toast(id+" deleted");render();return{}}});return}
 if(a==="aprst"){X.apol=POL_SEED();X.seq.ap=12;audit("reset approval policies","defaults");toast("Approval policies reset to the defaults");render();return}
 /* major incident */
 if(a==="miup")return miUpd();
 if(a==="miclose"){X.mi.on=false;done("War room closed",X.mi.inc);return}
 if(a==="bridge"){if(id==="copy"){try{navigator.clipboard&&navigator.clipboard.writeText(X.mi.bridge)}catch(er){}audit("copied bridge link",X.mi.inc);toast("Bridge link copied")}else{audit("joined bridge",X.mi.inc);toast("Opening the Teams bridge (demo)","info")}return}
 if(a==="send")return sendComm(id);
 if(a==="cedit2")return commForm(id);
 if(a==="cnew2")return commForm();
 if(a==="redraft"){X.mi.comms.forEach(c=>{if(c.st!=="Sent"){c.body=draftBody(c.aud);c.ai=.86}});done("Drafts refreshed","latest timeline facts");return}
 if(a==="comp"){const [n,s]=id.split(":");X.mi.comp[+n][1]=s;audit("edited status component",X.mi.comp[+n][0]+" → "+s);render();return}
 if(a==="publish"){if(!X.mi.roles.comms){toast("Assign a communications lead first: drag a person into the role in the War room tab","warn");return}X.mi.pub=X.mi.comp.map(c=>c.slice());X.mi.pubAt=hmAt(0);X.mi.tl.push([0,X.mi.roles.comms,"Comms","Status page updated."]);done("Status page published","approved by "+X.mi.roles.comms);return}
 if(a==="pir")return pirForm();
 if(a==="task"){const k=X.tasks.find(x=>x.id===id);k.done=!k.done;done("Task "+(k.done?"completed":"reopened"),k.t.slice(0,50));return}});
document.addEventListener("keydown",e=>{if(e.key!=="Enter")return;const t=e.target.closest&&e.target.closest(".itsm-row,.itsm-kc,.itsm-cc");if(t&&t===e.target){e.preventDefault();t.click()}});
/* ---------- field events ---------- */
const calcOut=(k,v)=>{const c=X.calc=Object.assign({},CDEF,X.calc||{});c[k]=v;if(k==="svc"){const sv=SV(v);c.ua=Math.min(c.ua,sv?sv.users:100);render();return}
 const o=$("#itsmCalcOut");if(o)o.innerHTML=prioPanel(calcRec());document.querySelectorAll('[data-itsm-cv="'+k+'"]').forEach(n=>{n.textContent=N0(+v)+(k==="deg"?"%":"")})};
["input","change"].forEach(ev=>document.addEventListener(ev,e=>{const t=e.target,d=t.dataset;if(!d)return;
 if(d.itsmCin&&(ev==="input"?t.type==="range":true))return calcOut(d.itsmCin,t.value);
 if(ev!=="change")return;
 if(d.itsmSim){const k=d.itsmSim;X.sim[k]=t.value;if(k==="svc")X.sim.ci="";render();return}
 if(d.itsmFpick){X.fsel={pid:t.value,leaf:""};render();return}
 if(d.itsmFxtext||d.itsmFxst||d.itsmFxmv){const [pid,lid]=(d.itsmFxtext||d.itsmFxst||d.itsmFxmv).split(/:(.+)/),p=PRB(pid),r=p&&leafOf(p,lid);if(!r)return;
  if(d.itsmFxtext){const v=t.value.trim();if(v){r.l.t=v;audit("renamed a cause",pid)}}else if(d.itsmFxst){r.l.st=t.value;audit("changed cause evidence",pid+": "+t.value)}else{moveLeaf(pid,lid,t.value);return}
  refreshFish(pid)}}));
/* ---------- search ---------- */
SEARCHX.push(()=>[].concat(
 X.inc.map(i=>({g:"Incidents",t:i.id+" "+i.t,m:"P"+prio(i)+" · "+i.st,c:"--e4",f:()=>{go("itsm_inc");incDrawer(i.id)},k:i.svc+" "+i.caller+" "+i.cat+" "+i.grp})),
 X.prb.map(p=>({g:"Problems",t:p.id+" "+p.t,m:p.st,c:"--w1",f:()=>{go("itsm_prb");prbDrawer(p.id)},k:p.svc+" "+p.workaround+" "+p.cause+" fishbone root cause"})),
 allKE().filter(k=>!k.gen).map(k=>({g:"Known errors",t:k.id+" "+k.t,m:k.st,c:"--u4",f:()=>{S.v.itsm_prb=3;go("itsm_prb");kbDrawer(k.id)},k:k.sym+" "+k.wa})),
 X.chg.filter(c=>!c.hist).map(c=>({g:"Changes",t:c.id+" "+c.t,m:c.type+" · "+fd(c.start),c:"--p4",f:()=>{go("itsm_chg");chgDrawer(c.id)},k:c.svc+" "+c.cis.map(ciN).join(" ")})),
 X.tpl.map(t=>({g:"Change templates",t:t.id+" "+t.n,m:t.st,c:"--p5",f:()=>gotoTab("itsm_chg",3),k:t.svc})),
 X.apol.map(p=>({g:"Approval policies",t:p.id+" "+p.n,m:p.on===false?"Off":"On",c:"--p5",f:()=>{gotoTab("itsm_chg",4)},k:condText(p)+" approver approval who approves"})),
 FREEZE.map(f=>({g:"Change freezes",t:f.n,m:fd(f.from)+" to "+fd(f.to),c:"--bad-f",f:()=>{X.cm=f.from.slice(0,7);gotoTab("itsm_chg",1)},k:f.why+" blackout freeze window"})),
 [{g:"Major incident",t:"War room: "+X.mi.inc,m:X.mi.on?"Active":"Closed",c:"--e1",f:()=>go("itsm_mi"),k:"major incident bridge status page post-incident review"},{g:"Incident priority",t:"Priority calculator and policy",m:"Impact + urgency = priority",c:"--e4",f:()=>gotoTab("itsm_inc",2),k:"priority matrix impact urgency vip override"}]));
/* ---------- chat ---------- */
const askTo=(scr,tab,q,r)=>{if(tab!=null)S.v[scr]=tab;go(scr);say(q,r);return true};
ASKX.push(q=>{const l=q.toLowerCase();
 if(/(start|declare|open|invoke|begin|new)\b.*major incident|major incident.*(start|declare)/.test(l)){if(X.mi.on){return askTo("itsm_mi",1,q,{t:"A major incident is already active: "+X.mi.inc+" (portal latency), "+fH(miEl())+" in. I opened the war room. "+unfilled().length+" roles are empty, and "+X.mi.comms.filter(c=>c.st==="Draft").length+" stakeholder updates are drafted and waiting for approval.",steps:["Checked for an active major incident","Read the war room roles and drafts"]})}go("itsm_mi");say(q,{t:"No major incident is active, so I opened the declaration form. Choose the incident and the criteria it meets.",steps:["Checked for an active major incident","Prepared the declaration form"]});midecl();return true}
 if(/major incident|war room|status page|bridge/.test(l))return askTo("itsm_mi",X.mi.on?1:0,q,{t:X.mi.on?"The major incident is "+X.mi.inc+": Codification Portal latency since 09:12, "+fH(miEl())+" ago, with 140 editors affected. Emergency change CHG0311 has cut page loads from 6.1 s to 3.2 s. "+unfilled().length+" roles are empty.":"No major incident is active right now.",steps:["Read the war room","Read the timeline and change CHG0311"]});
 const cm=q.match(/CHG\d{4}/i);
 if(cm&&/(who|approv|sign)/.test(l)){const c=CHGB(cm[0].toUpperCase());if(c){const r=route(c);return askTo("itsm_chg",2,q,{t:c.id+" ("+c.type+", risk "+riskScore(c)+") "+(r.auto?"is auto-approved by policy "+r.trace.find(t=>t.hit&&t.p.auto).p.id+".":"needs "+r.stages.length+" approval stage"+(r.stages.length===1?"":"s")+": "+r.stages.map(s=>s.n+" ("+s.ap.map(a=>a.w).join(", ")+", "+quorumTxt(s)+")").join("; ")+". Expected decision within "+fH(etaH(r.stages))+"."),steps:["Evaluated "+X.apol.filter(p=>p.on!==false).length+" approval policies","Applied separation of duties"]})}}
 if(/approval polic|who approves|approval rule|approval process|simulat/.test(l))return askTo("itsm_chg",4,q,{t:X.apol.filter(p=>p.on!==false).length+" approval policies are on. They route by type, service, CI, CI class, risk, group, environment and cost. Pick a change in the simulator to see who must approve it and the rule trace.",steps:["Read the approval policies"]});
 if(/impact analysis|blast radius|what does .* affect|who is affected/.test(l)){const sv=SVN.find(n=>l.includes(n.toLowerCase().split(" (")[0]));if(sv&&window.openImpact){const s=SV(sv);say(q,{t:"Opening the impact analysis for "+sv+": "+impactOf(s.id).services.length+" services and "+N0(impactOf(s.id).users)+" users are reached.",steps:["Traced the CMDB dependencies"]});openImp("service",s.id,sv,"");return true}}
 if(/fishbone|ishikawa|five whys|5 whys/.test(l))return askTo("itsm_prb",1,q,{t:"I opened the fishbone for the costliest problem. Select a cause to edit it, drag it to another bone to move it, and mark the root cause. The five whys sit below it.",steps:["Opened the problem analysis"]});
 if(/priority (matrix|calc|policy)|impact.*urgency|urgency.*impact|vip/.test(l))return askTo("itsm_inc",2,q,{t:"Priority is calculated: impact is a 0 to 100 score from the service's metrics, urgency is the customer's choice bounded by their role and the impact, and a matrix turns the pair into P1 to P4. VIP callers raise urgency by a documented step that expires. Try the calculator.",steps:["Read the priority policy"]});
 if(/freeze|blackout|change window|code freeze/.test(l)){X.cm="2026-11";return askTo("itsm_chg",1,q,{t:"Not today. The next freeze is the Financial close freeze, Nov 16 to 20 (blackout), then Thanksgiving reduced staffing Nov 25 to 27 and the Year-end freeze Dec 21 to Jan 4. "+freezeConflicts().slice(0,3).map(x=>x.c.id+" ("+fd(x.c.start)+") sits inside "+x.f[0].n).join("; ")+(freezeConflicts().length?". I showed November.":"."),steps:["Read the freeze windows","Checked every open change against them"]})}
 if(/(what|which|show|list).*(changes?|changed)\b.*(week|scheduled|calendar|upcoming|next)|scheduled changes|change calendar|changes this week|what changed this week|what changes/.test(l)){const n=nextDays(7);return askTo("itsm_chg",1,q,{t:N0(n.length)+" changes are scheduled in the next 7 days"+(n.length?": "+n.slice(0,5).map(c=>c.id+" ("+fd(c.start)+", "+c.type+", "+c.t.slice(0,40)+")").join("; "):"")+". "+allCollisions().filter(x=>x.kind==="hard").length+" collision on the same CI is open.",steps:["Read the change calendar","Ran collision and freeze checks"]})}
 if(/known error|kedb|workaround/.test(l))return askTo("itsm_prb",3,q,{t:allKE().filter(k=>k.st==="Published").length+" known errors are published. The most used is KE0007: search shows outdated paragraphs after an indexer restart, workaround is the nightly full re-index.",steps:["Searched the known error database"]});
 if(/\bproblems?\b.*(open|show|list)|repeat incident|root cause/.test(l))return askTo("itsm_prb",0,q,{t:ALLP().filter(p=>p.st!=="Resolved").length+" problems are open. PRB0010 (portal web tier saturation) is the costliest: 9 repeat incidents in 4 weeks and 140 people affected.",steps:["Read problem records","Ranked by repeats times users"]});
 if(/(log|create|raise|report|new)\b.*\bincident/.test(l)){go("itsm_inc");say(q,{t:"I opened the incident form. It calculates the priority from impact and urgency and suggests a category and team as you type.",steps:["Opened the incident form"]});incForm();return true}
 if(/\b(sla|breach|breached|at risk)\b/.test(l)){const r=ALLI().filter(i=>isOpen(i)&&slaOf(i).risk);return askTo("itsm_inc",3,q,{t:N0(r.length)+" incidents have a timer at risk"+(r.length<=8?": "+r.map(i=>i.id+(slaOf(i).breach?" (breached)":"")).join(", "):"")+". SLA compliance over 30 days is "+METRICS.m_itsm_sla.cur+"% against 95%.",steps:["Read all open SLA timers"]})}
 if(/(open|show|list|current)\b.*incidents?|incident queue|p1|p2|incidents?\b.*(open|queue)/.test(l)){const o=ALLI().filter(isOpen);return askTo("itsm_inc",0,q,{t:N0(o.length)+" incidents are open, "+N0(o.filter(i=>prio(i)<=2).length)+" at P1 or P2. The biggest is INC0412, the portal slowdown, now a major incident. "+N0(o.filter(i=>!i.own).length)+" are waiting in a team queue.",steps:["Read the incident queue","Applied your access scope"]})}
 if(/service desk|itsm|service management/.test(l)){go("itsm_home");say(q,{t:"This is the service desk overview: open P1 and P2, SLA at risk, the next 7 days of changes and the major incident.",steps:["Opened the overview"]});return true}
 return false});
/* ---------- work lists for Person 360 ---------- */
WORK.push({kind:"Incidents",tag:"INC",fn:(n,r)=>ALLI().filter(i=>isOpen(i)&&(i.own===n||(!i.own&&r&&r.kind&&r.kind!=="human"&&i.grp===r.team))).slice(0,25).map(i=>{const s=slaOf(i);return {id:i.id,t:i.t,sub:i.svc+" · P"+prio(i)+" · "+i.grp,due:tAt(i.age-PRI[prio(i)].res).slice(0,6),st:s.breach?"bad":s.risk?"warn":"info",hrs:prio(i)<=2?3:1,go:()=>{go("itsm_inc");incDrawer(i.id)}}})});
WORK.push({kind:"Problems owned",tag:"PRB",fn:n=>ALLP().filter(p=>p.owner===n&&p.st!=="Resolved").slice(0,12).map(p=>({id:p.id,t:p.t,sub:p.svc+" · "+p.st,st:p.pr<=2?"warn":"info",hrs:4,go:()=>{go("itsm_prb");prbDrawer(p.id)}}))});
WORK.push({kind:"Changes to implement",tag:"CHG",fn:n=>ALLC().filter(c=>!c.hist&&(c.own===n||c.req===n)&&["Draft","Assess","Authorize","Scheduled","Implement"].includes(c.st)).slice(0,15).map(c=>({id:c.id,t:c.t,sub:c.type+" · "+c.st+(c.own===n?" · implementer":" · requester"),due:fd(c.start),st:c.st==="Implement"?"warn":"info",hrs:c.own===n?3:1,go:()=>{go("itsm_chg");chgDrawer(c.id)}}))});
WORK.push({kind:"Change approvals waiting",tag:"APPR",fn:n=>ALLC().filter(c=>c.st==="Authorize").flatMap(c=>stagesOf(c).flatMap((s,si)=>s.ap.map((a,ai)=>({c,s,si,a,ai})))).filter(x=>x.a.w===n&&x.a.dec==="pending"&&apElig(x.c,x.si,x.ai)).slice(0,12).map(x=>({id:x.c.id+"-"+x.si,t:"Approve: "+x.c.t,sub:x.s.n+" · "+slaTxt(x.c,x.s),st:x.s.sla&&(x.c.subH||0)>x.s.sla?"bad":"warn",hrs:1,go:()=>{go("itsm_chg");chgDrawer(x.c.id)}}))});
WORK.push({kind:"Post-incident actions",tag:"PIR",fn:n=>X.tasks.filter(t=>t.who===n&&!t.done).map(t=>({id:t.id,t:t.t,sub:t.from,due:fd(t.due),st:"info",hrs:2,go:()=>{go("itsm_mi");}}))});
/* ---------- change workflow for the workflow designer ---------- */
if(window.WFX&&WFX.reg){try{WFX.reg({id:"wf_itsm_chg",name:"Change enablement",kind:"change",service:"Change management",owner:"Nia Brooks",std:["itil5","devops"],steps:[
 {id:"s1",n:"Request and assess risk",type:"human",owner:"Requester",team:"Service desk",sla:"4 h",out:["Risk score","Collisions"],next:["s2"],requesterVisible:true},
 {id:"s2",n:"Route by approval policy",type:"auto",owner:"Change Risk Agent",team:"AI agents",cond:"Policy engine: type, service, CI class, risk, group, environment, cost",next:["s3","s4"],system:"Oukala approval policies"},
 {id:"s3",n:"Standard template: auto-approve",type:"gate",owner:"Policy",team:"Change management",cond:"type = Standard and an approved template",next:["s6"]},
 {id:"s4",n:"Approvals: stages, quorum, delegation",type:"human",owner:"Approvers",team:"Change management",sla:"24 h",olaHrs:24,next:["s5"],requesterVisible:true},
 {id:"s5",n:"Schedule and check calendar",type:"auto",owner:"Change Risk Agent",team:"AI agents",cond:"No collision on the same CI, not in a freeze",next:["s6"]},
 {id:"s6",n:"Implement",type:"human",owner:"Implementer",team:"Platform team",next:["s7"]},
 {id:"s7",n:"Post-implementation review",type:"human",owner:"Change manager",team:"Change management",sla:"5 d",out:["Change failure rate"],next:[]}],visibleToRequester:["s1","s4","s6"]})}catch(er){}}
/* ---------- data model catalog ---------- */
DATAMODEL.register("problem_record",{label:"Problem record",source:"ITSM",fields:[{k:"number",label:"Number",type:"text"},{k:"short_description",label:"Title",type:"text"},{k:"service",label:"Service",type:"ref"},{k:"state",label:"State",type:"enum",opts:PST},{k:"priority",label:"Priority",type:"enum",opts:["P1","P2","P3","P4"]},{k:"owner",label:"Problem owner",type:"ref"},{k:"root_cause",label:"Root cause",type:"text"},{k:"workaround",label:"Workaround",type:"text"},{k:"repeat_incidents",label:"Repeat incidents, 4 weeks",type:"number"},{k:"users_affected",label:"People affected",type:"number"}]});
DATAMODEL.register("change_approval_policy",{label:"Change approval policy",source:"ITSM",fields:[{k:"id",label:"Policy",type:"text"},{k:"name",label:"Name",type:"text"},{k:"change_type",label:"Change type",type:"enum",opts:["Standard","Normal","Emergency"]},{k:"service",label:"Service",type:"ref"},{k:"ci_class",label:"CI class",type:"enum",opts:CLASSES},{k:"min_risk",label:"Risk score at least",type:"number"},{k:"requesting_group",label:"Requesting group",type:"enum",opts:TEAMN},{k:"environment",label:"Environment",type:"enum",opts:ENVS},{k:"min_cost",label:"Cost at least",type:"currency"},{k:"approvers",label:"Approvers",type:"string"},{k:"quorum",label:"Quorum",type:"string"},{k:"sla_hours",label:"Decide within (hours)",type:"number"}]});
DATAMODEL.register("incident_priority_policy",{label:"Incident priority policy",source:"ITSM",fields:[{k:"impact_score",label:"Impact score (0 to 100)",type:"number"},{k:"impact_band",label:"Impact band",type:"enum",opts:["Minor","Moderate","Significant","Extensive"]},{k:"urgency_requested",label:"Urgency requested",type:"enum",opts:["Critical","High","Medium","Low"]},{k:"urgency_applied",label:"Urgency applied",type:"enum",opts:["Critical","High","Medium","Low"]},{k:"caller_role",label:"Caller role",type:"enum",opts:["Caller","Analyst","Team lead","Incident manager","Service owner","Executive"]},{k:"vip_level",label:"VIP level",type:"enum",opts:["Standard","Executive","Board"]},{k:"priority",label:"Priority",type:"enum",opts:["P1","P2","P3","P4"]},{k:"overridden",label:"Overridden",type:"boolean"}]});
syncM();
})();
