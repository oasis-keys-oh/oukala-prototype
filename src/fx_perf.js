const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(500);
const ids=process.argv[3].split(',');const sc=process.argv[4]==='scale';
const r=await p.evaluate(async([ids,sc])=>{const o={};if(sc){SCALE.set(true);await new Promise(r=>setTimeout(r,300))}for(const id of ids){const sc=SCREENS.find(s=>s[0]===id);const t=performance.now();try{go(id)}catch(e){o[id]="ERR "+e.message;continue}o[id]=Math.round(performance.now()-t);
 const labs=document.querySelectorAll('.views > .vsw label');for(let k=1;k<labs.length;k++){const t2=performance.now();labs[k].click();o[id+"#"+k]=Math.round(performance.now()-t2)}}return o},[ids,sc]);
console.log(JSON.stringify(r),errs);await b.close()})();
