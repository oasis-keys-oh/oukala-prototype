const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(500);
const r=await p.evaluate(async()=>{const o=[];const T=async(l)=>{const t=performance.now();go("itsm_inc");await new Promise(r=>setTimeout(r,200));document.querySelectorAll('.views > .vsw label')[1].click();await new Promise(r=>setTimeout(r,300));o.push([l,document.querySelectorAll('.itsm-kc').length,[...document.querySelectorAll('.itsm-colh .pill')].map(e=>e.textContent).join(','),Math.round(performance.now()-t),mpGet("itsm_bd_svc").length])};
await T('demo');SCALE.set(true);await new Promise(r=>setTimeout(r,500));await T('scale');SCALE.set(false);await new Promise(r=>setTimeout(r,300));await T('demo2');return o});
console.log(JSON.stringify(r),errs);await b.close()})();
