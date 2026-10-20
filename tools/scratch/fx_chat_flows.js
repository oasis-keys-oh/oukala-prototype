const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(800);await p.evaluate(()=>{go('home');CHATX.open('chat')});await p.waitForTimeout(400);
const send=async(t)=>{await p.fill('#chatq',t);await p.press('#chatq','Enter');await p.waitForTimeout(2500)};
const press=async()=>{for(let i=0;i<8;i++){const n=await p.evaluate(()=>{const bs=[...document.querySelectorAll('#chatDock button')].filter(x=>x.offsetParent&&!x.disabled&&/^(Submit order|Submit|Approve and run|Approve|Run it|Run|Confirm|Yes, run|Use this plan|Looks right)/i.test(x.textContent.trim()));if(bs[0]){bs[0].click();return bs[0].textContent.trim()}return ""});if(!n)break;console.log("  click:",n);await p.waitForTimeout(2500)}};
const flows=[["onboard Hana Kim starting 2026-10-19, manager Maya Ortiz, role Analyst"],["order a laptop for Hana Kim"],["how is the P1 incident SLA measured?"],["raise my AI token limit to 20 million tokens because I run long analyses"]];
for(const [q] of flows){const a0=await p.evaluate(()=>CHATX.ST.acts.length);console.log("ASK",q);await send(q);await press();
 console.log(await p.evaluate(()=>{const A=CHATX.ST.acts[0];const t=CHATX.cur();const last=t.msgs[t.msgs.length-1];return JSON.stringify({acts:CHATX.ST.acts.length,top:A&&A.title,status:A&&A.status,steps:A&&A.steps.map(s=>s.status).join(","),last:(last&&String(last.t||"")).replace(/<[^>]+>/g,"").slice(0,160)})}));
 await p.evaluate(()=>CHATX.ST.threads.length&&0)}
console.log("errors",errs);await b.close()})();
