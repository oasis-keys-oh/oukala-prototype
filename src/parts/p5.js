
/* ---------------- registration ---------------- */
REG("itom_cmdb","CMDB and service map","ops","M12 3c4.4 0 8 1.1 8 2.5S16.4 8 12 8 4 6.9 4 5.5 7.6 3 12 3zM4 5.5v13C4 19.9 7.6 21 12 21s8-1.1 8-2.5v-13M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5",cmdbScreen);
REG("itom_disc","Discovery","ops","M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5",discScreen);
REG("itom_evt","Event management","ops","M3 12h4l2-6 4 12 2-6h6",evtScreen);
REG("itom_slo","Observability and SLOs","ops","M4 18a8 8 0 1 1 16 0M12 18l4-6",sloScreen);
REG("itom_run","Runbooks and automation","ops","M8 5l11 7-11 7z",runScreen);
REG("itom_fin","Cloud cost (FinOps)","ops","M12 3v18M16 7.5C16 6 14.2 5 12 5s-4 1-4 2.5 1.8 2.5 4 2.5 4 1 4 2.5-1.8 2.5-4 2.5-4-1-4-2.5",finScreen);
REG("itom_dev","DevOps and delivery","ops","M7 8l-4 4 4 4M17 8l4 4-4 4M14 5l-4 14",devScreen);

/* ---------------- interaction ---------------- */
let dragLink=null,noClick=false;
function svgPt(svg,e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
document.addEventListener("pointerdown",e=>{const h=e.target.closest&&e.target.closest("[data-itom-h]");if(!h)return;const svg=document.getElementById("itomMap");const g=h.closest("[data-itom-sel]");if(!svg||!g)return;e.preventDefault();const from=h.dataset.itomH,t=g.getAttribute("transform").match(/translate\(([\d.-]+) ([\d.-]+)\)/);dragLink={from,svg,x:+t[1]+NW,y:+t[2]+NH/2,sx:e.clientX,sy:e.clientY,moved:false}});
document.addEventListener("pointermove",e=>{if(!dragLink)return;if(Math.hypot(e.clientX-dragLink.sx,e.clientY-dragLink.sy)>5)dragLink.moved=true;if(!dragLink.moved)return;const p=svgPt(dragLink.svg,e),t=document.getElementById("itomTmp");if(t)t.setAttribute("d",`M${dragLink.x} ${dragLink.y}L${p.x} ${p.y}`);const el=document.elementFromPoint(e.clientX,e.clientY),n=el&&el.closest("[data-itom-sel]");document.querySelectorAll(".itom-n.target").forEach(x=>x.classList.remove("target"));if(n&&n.dataset.itomSel!==dragLink.from)n.classList.add("target")});
document.addEventListener("pointerup",e=>{if(!dragLink)return;const d=dragLink;dragLink=null;const t=document.getElementById("itomTmp");if(t)t.setAttribute("d","");document.querySelectorAll(".itom-n.target").forEach(x=>x.classList.remove("target"));if(!d.moved)return;noClick=true;setTimeout(()=>noClick=false,80);const el=document.elementFromPoint(e.clientX,e.clientY),n=el&&el.closest("[data-itom-sel]");if(n&&n.dataset.itomSel!==d.from)relForm(d.from,n.dataset.itomSel);else toast("Drop on another CI to link","warn")});
document.addEventListener("click",e=>{if(noClick){e.stopPropagation();e.preventDefault();return}const t=e.target.closest("[data-itom-sel],[data-itom-open],[data-itom-edit],[data-itom-newci],[data-itom-relnew],[data-itom-linkmode],[data-itom-cf],[data-itom-retire],[data-itom-unlink],[data-itom-sel2],[data-itom-merge],[data-itom-nomerge],[data-itom-runnow],[data-itom-newsched],[data-itom-qa],[data-itom-qr],[data-itom-appall],[data-itom-g],[data-itom-al],[data-itom-burst],[data-itom-newrule],[data-itom-redit],[data-itom-ron],[data-itom-newwin],[data-itom-won],[data-itom-mkinc],[data-itom-ackg],[data-itom-rbgo],[data-itom-slo],[data-itom-newslo],[data-itom-rb],[data-itom-run],[data-itom-rbedit],[data-itom-newrb],[data-itom-rapp],[data-itom-findim],[data-itom-acc],[data-itom-tagfix],[data-itom-newalloc],[data-itom-revert],[data-itom-newpipe],[data-itom-stage],[data-itom-rerun]");if(!t)return;const d=t.dataset;
 if(d.itomLinkmode!==undefined){I.link={on:!I.link.on,from:null};render();return}
 if(d.itomSel){if(I.link.on){if(!I.link.from){I.link.from=d.itomSel;toast("Source: "+ci(d.itomSel).n+". Now pick what it depends on.","info");render()}else{const f=I.link.from;I.link={on:false,from:null};render();relForm(f,d.itomSel)}return}I.sel=d.itomSel;render();return}
 if(d.itomOpen){ciDrawer(d.itomOpen);return}
 if(d.itomEdit){ciForm(ci(d.itomEdit));return}
 if(d.itomNewci!==undefined){ciForm(null);return}
 if(d.itomRelnew!==undefined){relForm(d.itomRelnew||"","");return}
 if(d.itomCf){I.ciF=d.itomCf;render();return}
 if(d.itomRetire){const ids=d.itomRetire==="ALL"?health().stale.map(c=>c.id):[d.itomRetire];ids.forEach(id=>{const c=ci(id);if(c){c.life="Retired";audit("retired CI",c.n)}});if(I.sel&&ci(I.sel)&&ci(I.sel).life==="Retired")I.sel="C12";toast("Retired "+ids.length+" CI"+(ids.length===1?"":"s")+". CMDB health recalculated.");closeDrawer();render();return}
 if(d.itomUnlink){const [a,b]=d.itomUnlink.split("|");I.edges=I.edges.filter(x=>!(x[0]===a&&x[1]===b));audit("removed relationship",a+" to "+b);toast("Relationship removed","warn");closeDrawer();render();return}
 if(d.itomSel2){I.sel=d.itomSel2;S.v.itom_cmdb=0;closeDrawer();if(S.screen!=="itom_cmdb")go("itom_cmdb");else render();return}
 if(d.itomMerge!==undefined){const a=ci("C4"),b=ci("C14");b.life="Retired";a.last=0;I.dupDone=true;audit("merged duplicate CI",b.n+" into "+a.n);toast("Merged "+b.n+" into "+a.n+". Correctness and compliance improved.");render();return}
 if(d.itomNomerge!==undefined){const b=ci("C14");I.dupDone=true;b.l="ci";audit("kept CI separate",b.n);toast("Marked as not a duplicate. It is still an orphan: link or retire it.","warn");render();return}
 if(d.itomRunnow){runNow(d.itomRunnow);return}
 if(d.itomNewsched!==undefined){schedForm();return}
 if(d.itomQa){qApprove(d.itomQa);render();return}
 if(d.itomQr){const x=I.queue.find(q=>q.id===d.itomQr);I.queue=I.queue.filter(q=>q.id!==d.itomQr);audit("rejected discovered item",x.n);toast("Rejected "+x.n+". It will be ignored on the next run.","warn");render();return}
 if(d.itomAppall!==undefined){const hi=I.queue.filter(x=>x.conf>=.9).map(x=>x.id);hi.forEach(qApprove);audit("bulk approved discovery",hi.length+" items");render();return}
 if(d.itomG){const gid=d.itomG;if(S.screen!=="itom_evt"){go("itom_evt")}I.evt.sel=gid;S.v.itom_evt=0;render();groupDrawer(gid);return}
 if(d.itomAl){alertDrawer(d.itomAl);return}
 if(d.itomBurst!==undefined){burst();return}
 if(d.itomNewrule!==undefined){ruleForm(null);return}
 if(d.itomRedit){ruleForm(I.rules.find(r=>r.id===d.itomRedit));return}
 if(d.itomRon){const r=I.rules.find(x=>x.id===d.itomRon);r.on=!r.on;audit("toggled alert rule",r.n+" "+(r.on?"on":"off"));toast(r.n+(r.on?" enabled":" disabled"));render();return}
 if(d.itomNewwin!==undefined){winForm();return}
 if(d.itomWon){const w=I.wins.find(x=>x.id===d.itomWon);w.on=!w.on;audit("toggled maintenance window",w.n);toast(w.n+(w.on?" active":" paused"));render();return}
 if(d.itomMkinc){const g=GRP.find(x=>x.id===d.itomMkinc);I.evt.inc[g.id]="INC"+(1000+I.evt.inc.length+Object.keys(I.evt.inc).length+7);audit("created incident from event group",g.n+" as "+I.evt.inc[g.id]);toast("Incident "+I.evt.inc[g.id]+" created with "+g.al+" alerts attached");closeDrawer();render();groupDrawer(g.id);return}
 if(d.itomAckg){const g=GRP.find(x=>x.id===d.itomAckg);ALERTS.filter(a=>a[6]===g.id).forEach(a=>I.evt.ack[a[0]]=true);audit("acknowledged event group",g.n);toast("Acknowledged "+g.al+" alerts");closeDrawer();render();return}
 if(d.itomRbgo){I.rbSel=d.itomRbgo;S.v.itom_run=0;closeDrawer();go("itom_run");return}
 if(d.itomSlo){I.slo.sel=d.itomSlo;S.v.itom_slo=0;render();return}
 if(d.itomNewslo!==undefined){sloForm();return}
 if(d.itomRb){I.rbSel=d.itomRb;render();return}
 if(d.itomRun){runForm(rbOf(d.itomRun));return}
 if(d.itomRbedit){rbEdit(rbOf(d.itomRbedit));return}
 if(d.itomNewrb!==undefined){rbEdit(null);return}
 if(d.itomRapp){const run=I.run;if(!run)return;const rb=rbOf(run.rb);if(d.itomRapp==="abort"||d.itomRapp==="reject"){rollback(run,d.itomRapp==="reject"?"Rejected the approval gate and started rollback":"Aborted the run and started rollback");return}
  if(run.st==="waiting"){const s=rb.steps[run.i];run.steps[run.i]="done";run.st="running";rlog(who(),s.t==="approval"?"Approved: "+s.x:"Marked done: "+s.x);paintRun();setTimeout(()=>tick(run),500)}return}
 if(d.itomFindim){I.dims=d.itomFindim;render();return}
 if(d.itomAcc){const r=RECS.find(x=>x[0]===d.itomAcc);I.fin.accepted[r[0]]=true;if(r[0]==="RS6"){const c=ci("C15");if(c)c.life="Retired"}audit("accepted rightsizing",r[1]+" saves "+K1(r[4]*1000)+" a month");toast("Accepted: "+r[1]+". Change queued, saves "+K1(r[4]*1000)+" a month.");render();return}
 if(d.itomTagfix!==undefined){I.fin.tagFixed=true;audit("applied tag inheritance policy","Azure Policy");toast("Tag inheritance applied. Untagged spend fell by 62%.");render();return}
 if(d.itomNewalloc!==undefined){allocForm();return}
 if(d.itomRevert!==undefined){I.fin.reverted=true;audit("scheduled SQL tier revert","after INC1 closes");toast("Revert task created for Sam Patel, due when INC1 closes");render();return}
 if(d.itomNewpipe!==undefined){pipeForm();return}
 if(d.itomStage){stageDrawer(d.itomStage);return}
 if(d.itomRerun){closeDrawer();rerun(d.itomRerun);return}});
document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const n=e.target.closest&&e.target.closest("g[data-itom-sel]");if(n){e.preventDefault();n.dispatchEvent(new MouseEvent("click",{bubbles:true}))}});
document.addEventListener("input",e=>{const t=e.target;if(t.dataset&&t.dataset.itomQ!==undefined){I.ciQ=t.value;const pos=t.selectionStart;render();const n=document.querySelector("[data-itom-q]");if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}}});
document.addEventListener("change",e=>{const t=e.target;if(t.dataset&&t.dataset.itomRec!==undefined){const r=I.rec[+t.dataset.itomRec];r.s=t.value;audit("changed authoritative source",r.a+" is now "+t.value);toast(r.a+": "+t.value+" is now authoritative")}});

/* ---------------- chat and search ---------------- */
SEARCHX.push(()=>I.cis.filter(c=>c.life!=="Retired").map(c=>({g:"Configuration items",t:c.n,m:c.cls,c:"--w1",f:()=>{I.sel=c.id;S.v.itom_cmdb=0;go("itom_cmdb")},k:c.id+" "+c.own+" "+c.src}))
 .concat(I.rb.map(r=>({g:"Runbooks",t:r.ref+" "+r.n,m:r.risk+" risk",c:"--s3",f:()=>{I.rbSel=r.id;go("itom_run")},k:r.trig})))
 .concat(GRP.map(g=>({g:"Event groups",t:g.n,m:g.al+" alerts",c:"--e4",f:()=>{I.evt.sel=g.id;go("itom_evt");groupDrawer(g.id)},k:"alert incident candidate "+g.rule})))
 .concat(I.slos.map(s=>({g:"SLOs",t:s.n,m:s.svc,c:"--p4",f:()=>{I.slo.sel=s.id;go("itom_slo")},k:"error budget slo "+s.svc})))
 .concat(D.pipes.map(p=>({g:"Pipelines",t:p.n,m:p.prov,c:"--u3",f:()=>go("itom_dev"),k:p.repo+" ci cd build deploy"})))
 .concat([{g:"Operations",t:"Cloud spend and budget",m:"FinOps",c:"--w1",f:()=>go("itom_fin"),k:"azure cost showback rightsizing tags"},{g:"Operations",t:"DORA metrics",m:"DevOps",c:"--u3",f:()=>go("itom_dev"),k:"deployment frequency lead time change failure restore"}]));
ASKX.push(q=>{const l=q.toLowerCase();
 if(/depend.*(lease|subledger)|lease.*(depend|break|impact)/.test(l)){I.sel="AS4";S.v.itom_cmdb=0;go("itom_cmdb");const u=[...upstream("AS4")].map(ci).map(c=>c.n),d=[...downstream("AS4")].map(ci).map(c=>c.n);say(q,{t:`Lease subledger (ERP) depends on ${d.length} items: ${d.slice(0,6).join(", ")}. One thing depends on it: ${u.join(", ")||"nothing"}. If it goes down, month-end close (Oct 28) is at risk.`,steps:["Opened the service map with Lease subledger selected","Walked relationships both ways","Read criticality: Tier 1"]});return true}
 if(/cloud (spend|cost)|azure (spend|cost)|finops|show.*spend/.test(l)){go("itom_fin");say(q,{t:"September Azure spend was $105K against a $100K budget (105%). October is forecast at $112K because SQL managed instance was scaled up on Oct 5 during INC1 (+$1,870 a day). $14.8K is untagged and 8 rightsizing recommendations would save $11.5K a month.",steps:["Read the Azure cost export","Compared to budget line B1","Ran anomaly detection on daily cost"]});return true}
 if(/why.*(portal|slow)|portal.*(slow|latency)|latency/.test(l)){I.evt.sel="G1";S.v.itom_evt=0;go("itom_evt");groupDrawer("G1");say(q,{t:"The portal is slow because the Lumen search indexer batch (started 09:05) is saturating the shared SQL managed instance: CPU 94%, one SQL query is 3.1 s of a 4.1 s request. Confidence 78%. Runbook RB-044 throttles the indexer and, with approval, scales SQL.",steps:["Grouped 17 alerts into one candidate","Compared with traces and deployment history","Suggested RB-044 with an approval gate"]});return true}
 if(/dora|deployment frequency|lead time|change failure/.test(l)){go("itom_dev");const d=dora();say(q,{t:`Over 30 days: ${d.wk.toFixed(1)} production deploys a week, median lead time ${d.L.toFixed(0)} hours, change failure rate ${d.cfr.toFixed(1)}%, median time to restore ${d.mttr.toFixed(1)} hours.`,steps:["Read the deployment history","Computed the four DORA metrics"]});return true}
 if(/error budget|slo/.test(l)){go("itom_slo");say(q,{t:"4 of 6 SLOs are inside their error budget. Portal availability and portal page speed are breached after the Oct 5 incident.",steps:["Computed budget remaining for each SLO"]});return true}
 if(/runbook|failover/.test(l)){go("itom_run");say(q,{t:"There are "+I.rb.length+" runbooks. The portal failover (RB-031) has not been reviewed in 14 months; rehearse it before relying on it.",steps:["Read the runbook library"]});return true}
 if(/cmdb|discovery|stale ci|orphan/.test(l)){go("itom_cmdb");S.v.itom_cmdb=2;render();const h=health();say(q,{t:`CMDB health is ${h.score.toFixed(0)} (completeness ${h.comp.toFixed(0)}, correctness ${h.corr.toFixed(0)}, compliance ${h.compl.toFixed(0)}). ${h.stale.length} stale, ${h.orph.length} orphan and ${h.dups.length} duplicate CIs need action.`,steps:["Scored every active CI"]});return true}
 return false});
})();
