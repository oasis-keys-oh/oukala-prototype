(async()=>{const R={};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const au0=AUDIT.length;
// 1 workflow approval
let L=INBOX.items();const fl=L.find(x=>x.src==="flow"&&x.can.approve&&!x.needNote&&x.risk!=="high");
const fx=id=>FLOWX.approvals().find(a=>a.id===id);
R.flow={id:fl.sid,before:fx(fl.sid).st};let r=INBOX.decide(fl.id,"approve",{});R.flow.queued=r.ok;R.flow.pendingNow=INBOX.pending();R.flow.stBeforeCommit=fx(fl.sid).st;INBOX.flush();R.flow.after=fx(fl.sid).st;R.flow.hist=fx(fl.sid).hist.slice(-1);
// reject flow with reason
const fl2=INBOX.items().find(x=>x.src==="flow"&&x.can.reject&&x.id!==fl.id);R.flowRej={id:fl2.sid,before:fx(fl2.sid).st,noReason:INBOX.decide(fl2.id,"reject",{}).why};INBOX.decide(fl2.id,"reject",{note:"Not within scope"});INBOX.flush();R.flowRej.after=fx(fl2.sid).st;
// delegate flow
const fl3=INBOX.items().find(x=>x.src==="flow"&&x.can.delegate);R.flowDel={id:fl3.sid,before:fx(fl3.sid).dlg||null};INBOX.decide(fl3.id,"delegate",{to:"Priya Shah",note:"Knows the vendor"});INBOX.flush();R.flowDel.after=fx(fl3.sid).dlg;
// 2 invoice
const inv=INBOX.items().find(x=>x.src==="inv"&&x.rec==="approve");R.inv={id:inv.sid,before:S.dec[inv.sid]||null,invokeNeedNote:inv.needNote};INBOX.decide(inv.id,"approve",{});INBOX.flush();R.inv.after=S.dec[inv.sid]||null;
const inv2=INBOX.items().find(x=>x.src==="inv");if(inv2){R.inv2={id:inv2.sid,rec:inv2.rec,needNote:inv2.needNote,noNote:INBOX.decide(inv2.id,"approve",{}).why};INBOX.decide(inv2.id,"reject",{note:"Hold until milestone accepted"});INBOX.flush();R.inv2.after=S.dec[inv2.sid]}
// 3 change
const ch=INBOX.items().find(x=>x.src==="chg");if(ch){const c0=ITSMX.getChange(ch.sid);R.chg={id:ch.sid,before:c0.stages[ch.sx].ap[ch.ax].dec,st0:c0.st};INBOX.decide(ch.id,"approve",{});INBOX.flush();const c1=ITSMX.getChange(ch.sid);R.chg.after=c1.stages[ch.sx]&&c1.stages[ch.sx].ap[ch.ax]&&c1.stages[ch.sx].ap[ch.ax].dec;R.chg.st=c1.st;R.chg.stagesN=c1.stages.length;R.chg.dump=JSON.stringify(c1.stages.map(s=>s.ap.map(a=>a.w+":"+a.dec)))}
// 4 catalog
const ct=INBOX.items().filter(x=>x.src==="cat");if(ct.length){const a=ct[0];R.cat={id:a.sid,before:svcStatus(a.sid).state+"/"+svcStatus(a.sid).approvals.map(x=>x.state).join(",")};INBOX.decide(a.id,"approve",{});INBOX.flush();R.cat.after=svcStatus(a.sid).state+"/"+svcStatus(a.sid).approvals.map(x=>x.state).join(",");
 if(ct[1]){const b=ct[1];R.catRej={id:b.sid,before:svcStatus(b.sid).state};INBOX.decide(b.id,"reject",{note:"Use the standard model"});INBOX.flush();R.catRej.after=svcStatus(b.sid).state}}
// 5 funding gate
const F=FIN._h.F;F.gq.push({id:"GQ-TEST1",pid:"PR2",to:"G2",note:"Move to design gate",pis:"",amt:48000,approver:"Omar (CIO)",role:"CIO",t:"2026-10-06"});INBOX.refresh();const g=INBOX.items().find(x=>x.src==="gate");
R.gate={found:!!g};if(g){const gm0=F.gmoves.length,gq0=F.gq.length,gate0=F.proj.PR2&&F.proj.PR2.gate;INBOX.decide(g.id,"approve",{});INBOX.flush();R.gate.gq=[gq0,F.gq.length];R.gate.moves=[gm0,F.gmoves.length];R.gate.projGate=[gate0,F.proj.PR2&&F.proj.PR2.gate]}
// 6 release
const rl=INBOX.items().find(x=>x.src==="rel");if(rl){const r0=RELX.releases.find(x=>x.id===rl.sid);R.rel={id:rl.sid,before:r0.st+"/"+r0.gng.length};INBOX.decide(rl.id,"approve",{});INBOX.flush();R.rel.after=r0.st+"/"+r0.gng.length}
// 7 entity
const en=INBOX.items().find(x=>x.src==="ent");if(en){R.ent={id:en.sid,before:DATAMODEL.tables[en.sid].status};INBOX.decide(en.id,"approve",{});INBOX.flush();R.ent.after=DATAMODEL.tables[en.sid].status}
// 8 undo
const u=INBOX.items().find(x=>x.src==="flow"&&x.can.approve&&!x.needNote&&x.risk!=="high");R.undo={id:u.sid,before:fx(u.sid).st};INBOX.decide(u.id,"approve",{});R.undo.queued=INBOX.pending().length;INBOX.undo(u.id);INBOX.flush();R.undo.after=fx(u.sid).st;R.undo.backInQueue=!!INBOX.items().find(x=>x.id===u.id);
// 9 timer commit
const t=INBOX.items().find(x=>x.src==="flow"&&x.can.approve&&!x.needNote&&x.risk!=="high");R.timer={id:t.sid,before:fx(t.sid).st};INBOX.decide(t.id,"approve",{});await sleep(INBOX.UNDO_MS+700);R.timer.after=fx(t.sid).st;
R.audit=AUDIT.length-au0;R.hist=INBOX.hist().length;R.stats=INBOX.stats();R.counts=INBOX.counts();
return R})()
