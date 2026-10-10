(async()=>{const o={};
o.noseed=Object.entries(DATAMODEL.tables).filter(([k,t])=>t.status==="proposed"&&!t.seed).map(([k])=>k);
o.seedflag=Object.entries(DATAMODEL.tables).filter(([k,t])=>t.status==="proposed").slice(0,3).map(([k,t])=>[k,t.seed]);
const r=REQREG.find(r=>r.state==="pending"&&Object.values(r.ap).some(a=>a.st==="pending"));
o.req={id:r.id,sl:r.sl,slaTgt:r.slaTgt,cost:r.cost,price:r.price,created:r.created,startAt:r.startAt,ageH:r.ageH,st:svcStatus(r.id)};
const x=FLOWX.approvals()[0];o.fx={ev:x.ev,ai:x.ai,hist:x.hist,asm:x.asm,tier:x.tier};
o.relGates=RELX.gates("REL-2608").slice(0,3);o.relRec=RELX.recommend("REL-2608");o.crit=RELX.exitCriteria("REL-2608").slice(0,3);o.clash=RELX.clashes("REL-2608");
o.relRm=RELX.releases.map(r=>r.id+":"+r.rm+":"+r.st);
o.gateConf=GATE.conformance("ca_vendor_onb");
o.gateDecide=(()=>{try{const d=GATE.decide("ca_vendor_onb");return JSON.stringify(d).slice(0,500)}catch(e){return "err "+e.message}})();
o.meetRev=MEETINGS.filter(m=>m.rev>0).map(m=>m.id+":"+m.rev+":"+m.att.join(","));
o.obsAct=OBSX.alerts().filter(a=>a.active).length;
o.openDebt=DEBT.items().filter(d=>d.status==="open").length;
o.tbRight=document.querySelector(".tb-right").outerHTML.slice(0,600);
o.sowAppr=SOWX.changes().filter(c=>c.stage==="Approval");
o.matAwait=MAT.crRows().filter(r=>r.state==="Awaiting acceptance").map(r=>r.n.name+":"+r.n.owner);
o.fabAw=FAB.projects.filter(p=>/awaiting|evaluating|proposed/.test(p.stage)).map(p=>p.id+":"+p.stage+":"+p.t);
o.kcsPub=KCSX.items().filter(x=>x.st==="In review").length;
return o})()
