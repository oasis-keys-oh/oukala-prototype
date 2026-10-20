const {chromium}=require('playwright');const fs=require('fs');
// usage: node shot.js persona dark|light screen1,screen2 [w]
(async()=>{const [per,mode,scrs,w]=process.argv.slice(2);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:+w||1440,height:900},colorScheme:mode==='dark'?'dark':'light'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+process.cwd()+'/full.html');await p.waitForTimeout(1000);
await p.evaluate(([per,mode])=>{if(per!=='-'){S.persona=per;savePrefs()}},[per,mode]);await p.waitForTimeout(300);
fs.mkdirSync('shots',{recursive:true});
for(const s of scrs.split(',')){const [id,arg]=s.split(':');const t0=Date.now();const r=await p.evaluate(([id,arg])=>{try{go(id,arg||undefined)}catch(e){return 'EXC '+e.message}return 'ok'},[id,arg]);await p.waitForTimeout(500);
const ov=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,txt:(document.querySelector('#view')||document.body).innerText.length}));
await p.screenshot({path:`shots/${per}_${mode}_${id}_${w||1440}.png`});console.log(id,r,Date.now()-t0+'ms',JSON.stringify(ov))}
console.log('errs',errs.slice(0,5));await b.close()})();
