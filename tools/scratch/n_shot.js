// NODE_PATH=$(npm root -g) node n_shot.js OUT name WIDTH HEIGHT [dark] -- "async js to run in page" ; writes OUT/shots/name.png
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]),name=a[1],w=+a[2],h=+a[3];const dark=a.includes('dark');const code=a[a.indexOf('--')+1]||'';
fs.mkdirSync(path.join(dir,'shots'),{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:w,height:h},colorScheme:dark?'dark':'light',hasTouch:w<500});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+path.join(dir,'full.html'));await p.waitForTimeout(900);
if(code){try{const r=await p.evaluate(code);if(r!==undefined)console.log('eval:',typeof r==='string'?r:JSON.stringify(r))}catch(e){errs.push('eval: '+e.message)}await p.waitForTimeout(700)}
await p.screenshot({path:path.join(dir,'shots',name+'.png')});
console.log('errors:',errs.length?errs:'none');await b.close()})();
