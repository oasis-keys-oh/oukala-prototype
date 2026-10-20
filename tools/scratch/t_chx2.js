const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_chat');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(400);
await p.evaluate("CHATX.open('chat')");
for(const q of process.argv.slice(2)){await p.fill('#chatq',q);await p.press('#chatq','Enter');await p.waitForTimeout(1500);
 const o=await p.evaluate(()=>{const t=CHATX.cur();return t.msgs.slice(-3).map(m=>(m.me?'ME: ':'AI: ')+String(m.t).replace(/<[^>]+>/g,'').slice(0,200)+' cards='+(m.cards||[]).map(c=>c.t).join(',')).join('\n')+'\nPEND='+JSON.stringify(t.pend)+' acts='+CHATX.ST.acts.map(a=>a.title+':'+a.status).join('|')});console.log('>>',q,'\n'+o)}
console.log('errors:',errs.length?errs:'none');await b.close()})();
