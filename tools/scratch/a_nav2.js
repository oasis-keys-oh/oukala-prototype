const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const out=[];document.querySelectorAll('#nav > *').forEach(n=>{if(n.tagName=='DETAILS'){out.push('## '+n.querySelector("summary").textContent+' [parent='+(n.querySelector('.gparent')||{dataset:{}}).dataset.nav+']');n.querySelectorAll(':scope > .navsub, :scope > .navi').forEach(c=>out.push((c.classList.contains('navsub')?'  -- ':'    ')+(c.dataset.nav||'')+' '+c.textContent))}else out.push(n.innerText||n.className)});return out.join('\n')});
console.log(r);
// legend
const l=await p.evaluate(()=>{return [...document.querySelectorAll('*')].filter(e=>/legend|purple|rail-key|navkey/i.test(e.className&&e.className.toString())).map(e=>e.tagName+'.'+e.className).slice(0,20)});console.log(l);
await b.close()})();
