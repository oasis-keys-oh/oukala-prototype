// Guardrail tests (stream guard): one approval routing source (PR-20), plus the checks added by DC-18 to DC-21, CL-67 and CL-71.
// Usage: node tools/tests/guard.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const fails=[];
const js=fs.readFileSync(path.join(dir,'full.html'),'utf8');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});const p=await (await b.newContext()).newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>window.APG&&APG.route&&window.BUDREQ&&window.ITSMX&&window.REQREG&&window.INBOX&&INBOX.adapters&&INBOX.adapters.budreq,null,{timeout:60000});
await p.waitForTimeout(3500);
const r=await p.evaluate(()=>{const f=[];const ok=(c,m)=>{if(!c)f.push(m)};
 /* ---- PR-20: one source; both APIs are adapters over it ---- */
 const fin=APG.route("budget_request",{stage:"fin",amount:20000});ok(fin&&fin.id==="apg_fin","PR-20 budget fin stage routes to apg_fin");
 ok(PERM.approverOf.budget_request({stage:"fin",amount:20000})==="GRP-FINREV","PR-20 PERM.approverOf is an adapter over APG.route (budget)");
 ok(APG.route("change_request",{role:"Finance"}).id==="apg_fin"&&APG.route("change_request",{}).id==="apg_cab","PR-20 change routes by stage role, else CAB");
 ok(PERM.approverOf.change_request({})==="GRP-CAB","PR-20 PERM adapter (change)");
 ok(APG.route("catalog",{requester:"Maya Ortiz"}).id==="apg_line","PR-20 catalog routes to line management");
 ok(PERM.approverOf.approval({kind:"catalog",requester:"Maya Ortiz"})==="GRP-GEN","PR-20 PERM adapter (catalog)");
 /* requester can never approve own request, on all three */
 ok(APG.check("Avery Chen","budget_request",{requester:"Avery Chen",stage:"fin"}).rule==="sod","PR-20 budget: own request refused");
 ok(APG.check("Nia Brooks","change_request",{requester:"Nia Brooks"}).rule==="sod","PR-20 change: own change refused");
 ok(APG.check("Casey Rowan","catalog",{requester:"Casey Rowan"}).rule==="sod","PR-20 catalog: own request refused");
 /* group binding: a non-member is refused, a member is allowed */
 ok(APG.check("Tom Becker","budget_request",{requester:"Priya Shah",stage:"fin",amount:20000}).rule==="group","PR-20 budget: non-member refused");
 ok(APG.check("Victor Amaya","budget_request",{requester:"Priya Shah",stage:"fin",amount:20000}).ok,"PR-20 budget: member allowed");
 ok(APG.check("Avery Chen","change_request",{requester:"Tom Becker"}).rule==="group"&&APG.check("Nia Brooks","change_request",{requester:"Tom Becker"}).ok,"PR-20 change: binding");
 const lm=APG.route("catalog",{requester:"Maya Ortiz"}).members;ok(lm.length&&APG.check(lm[0],"catalog",{requester:"Maya Ortiz"}).ok&&APG.check("Nobody Person","catalog",{requester:"Maya Ortiz"}).rule==="group","PR-20 catalog: binding");
 /* the real decision paths refuse */
 const br=BUDREQ.requests().find(q=>q.st==="fin");if(br){const own=BUDREQ.decide(br.id,"Approve","",br.req);ok(own&&own.ok===false,"PR-20 BUDREQ.decide refuses the requester");
  PERM.enforceOn(false);const out=BUDREQ.decide(br.id,"Approve","","Nobody Person");PERM.enforceOn(true);ok(out&&out.ok===false&&out.rule==="group","PR-20 BUDREQ.decide refuses a non-member even with permission enforcement off")}
 ok(PERM.can("fin","approve","budget_request",{requester:"Avery Chen",stage:"fin",amount:5000}).ok===false,"PR-20 PERM.can refuses own budget request");
 const ad=INBOX.adapters.chg;const c=ITSMX.changes.find(x=>x.req&&(x.stages||[]).some(s=>(s.ap||[]).some(a=>a.dec==="pending")));
 if(ad&&c){let si=-1,ai=-1;c.stages.forEach((s,i)=>(s.ap||[]).forEach((a,j)=>{if(si<0&&a.dec==="pending"){si=i;ai=j}}));
  const prev=window.INBOX.me;const res=PERM.as(c.req,()=>{INBOX.me=()=>c.req;try{return ad.approve({sid:c.id,sx:si,ax:ai,req:c.req},"test")}finally{INBOX.me=prev}});ok(res&&res.ok===false,"PR-20 change inbox adapter refuses the requester")}
 ok(APG.denials().length>0,"PR-20 refusals are recorded");
 return f});
fails.push(...r);
if(errs.length)fails.push('page errors: '+errs.slice(0,3).join(' | '));
console.log('guard',fails.length?'FAIL\n - '+fails.join('\n - '):'ok');await b.close();process.exit(fails.length?1:0)})();
