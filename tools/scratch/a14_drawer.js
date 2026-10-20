const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=process.argv[2],dark=process.argv[3]==='dark',ev=process.argv[4],tag=process.argv[5];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000},colorScheme:dark?'dark':'light'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve(dir+'/full.html'),{waitUntil:'load',timeout:90000});await p.waitForTimeout(500);
await p.evaluate(ev).catch(e=>errs.push('ev '+e.message));await p.waitForTimeout(900);
await p.screenshot({path:`${dir}/s_${tag}.png`});console.log('errs',errs);await b.close()})();
