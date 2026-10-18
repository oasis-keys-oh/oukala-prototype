// NODE_PATH=$(npm root -g) node m16_shot.js OUT "screen[:tabKey=idx][|eval js]"... [--dark] [--phone] [--full]
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]);const dark=a.includes('--dark'),phone=a.includes('--phone'),full=a.includes('--full');
const specs=a.slice(1).filter(x=>!x.startsWith('--'));fs.mkdirSync(path.join(dir,'shots'),{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.R16M&&R16M.ST&&R16M.ST.ok()&&R16M.wire&&(R16M.wire.tries>2||performance.now()>60000),null,{timeout:170000}).catch(e=>console.log('wait failed'));await p.waitForTimeout(1500);
for(const sp of specs){const [head,ev]=sp.split('|');const [id,tab]=head.split(':');const name=(id+(tab?'-t'+tab.replace(/[^0-9a-z]/gi,''):'')+(ev?'-e':'')).slice(0,60);
 if(tab){const [k,v]=tab.split('=');await p.evaluate(([k,v])=>{S.v[k]=+v},[k,v])}
 await p.evaluate(i=>go(i),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(500);
 if(ev){await p.evaluate(ev).catch(e=>errs.push('eval: '+e.message));await p.waitForTimeout(500)}
 const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 await p.screenshot({timeout:120000,path:path.join(dir,'shots',name+(phone?'-phone':'')+(dark?'-dark':'')+'.png'),fullPage:full});console.log(name,'overflowX:',ox)}
console.log('errors:',errs.length?errs.filter(e=>!/ERR_FAILED/.test(e)):'none');await b.close()})();
