const {chromium}=require('playwright');const fs=require('fs');
// jobs: persona|mode|screens
const jobs=JSON.parse(fs.readFileSync(process.argv[2]));const out=[];
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});fs.mkdirSync('shots',{recursive:true});
for(const j of jobs){const ctx=await b.newContext({viewport:{width:j.w||1440,height:900},colorScheme:j.mode==='dark'?'dark':'light'});const p=await ctx.newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
const t0=Date.now();await p.goto('file://'+process.cwd()+'/full.html',{timeout:180000,waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof S!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:180000});await p.waitForTimeout(1500);console.log('load',Date.now()-t0);
await p.evaluate(per=>{S.persona=per;savePrefs()},j.per);
for(const s of j.screens){const [id,arg]=s.split(':');const t1=Date.now();const r=await p.evaluate(([id,arg])=>{try{go(id,arg||undefined)}catch(e){return 'EXC '+e.message}return 'ok'},[id,arg]);await p.waitForTimeout(600);
const info=await p.evaluate(()=>{const v=document.querySelector('#view');return {sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,txt:v.innerText.slice(0,6000),h1:(v.querySelector('h1,h2')||{}).innerText}});
const f=`shots/${j.per}_${j.mode}_${id}${j.w?'_'+j.w:''}.png`;await p.screenshot({path:f});
fs.writeFileSync(f.replace('.png','.txt'),info.txt);
console.log(j.per,j.mode,id,r,(Date.now()-t1)+'ms','ovf',info.sw>info.cw,'|',(info.h1||'').slice(0,60).replace(/\n/g,' '))}
console.log('errs',j.per,j.mode,errs.slice(0,4));await ctx.close()}
await b.close()})();
