const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const scale=process.argv[3]==="scale";const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>{if(!/drawChat/.test(e.stack))errs.push('PAGEERROR '+e.stack.slice(0,500))});p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text().slice(0,300)));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
if(scale){await p.evaluate(()=>{SCALE.set(true)});await p.waitForTimeout(500)}
const scr={ppl_org:6,ppl_perf:8,ppl_cap:9,ppl_jrny:5};
for(const [s,n] of Object.entries(scr)){for(let t=0;t<n;t++){const r=await p.evaluate(([s,t])=>{try{const t0=performance.now();S.pp2.tab[s]=t;go(s);const el=document.querySelector('.screen');return 'ok '+Math.round(performance.now()-t0)+'ms len '+(el?el.innerText.length:0)+(/undefined|NaN|\[object/.test(el.innerText)?' BADTEXT '+(el.innerText.match(/.{30}(undefined|NaN|\[object).{20}/)||[''])[0].replace(/\n/g,' '):'')}catch(e){return 'EXC '+e.stack.slice(0,400)}},[s,t]);console.log(s,t,r)}}
console.log('ERRS',errs.slice(0,10));await b.close()})();
