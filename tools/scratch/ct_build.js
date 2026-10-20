const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(2500);
await p.evaluate("S.v.bld=3;go('plat_build')");await p.waitForTimeout(400);
await p.evaluate("document.querySelector('[data-bld-act=loadex]').click()");await p.waitForTimeout(300);
await p.evaluate("S.v.bld=1;render()");await p.waitForTimeout(300);
for(let i=0;i<9;i++){const n=await p.$('[data-bld-act=next]:not([disabled])');if(!n)break;await n.click();await p.waitForTimeout(150)}
const rows=await p.evaluate("[...document.querySelectorAll('.bld-main table tbody tr')].map(r=>r.innerText.replace(/\\s+/g,' ').slice(0,90)).filter(t=>/contract/i.test(t))");
console.log(rows);
console.log('register disabled:',await p.evaluate("document.querySelector('[data-bld-act=register]')&&document.querySelector('[data-bld-act=register]').disabled"));
await p.screenshot({path:dir+'/shots/ct_build.png'});
// MCP try tool in the build manifest tab
console.log('errors',errs);await b.close()})();
