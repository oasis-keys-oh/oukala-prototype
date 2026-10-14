const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+process.cwd()+'/'+process.argv[2]+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(800);
for(const id of process.argv[3].split(',')){await p.evaluate(i=>go(i),id);await p.waitForTimeout(500);
console.log(id,await p.evaluate(()=>[...document.querySelectorAll('#view svg')].filter(s=>s.getBoundingClientRect().width>380||+s.getAttribute('width')>380).map(s=>{const p=s.parentElement;return {vb:s.getAttribute('viewBox'),w:s.getAttribute('width'),h:s.getAttribute('height'),rw:Math.round(s.getBoundingClientRect().width),par:p.tagName+'.'+p.className+' ox='+getComputedStyle(p).overflowX+' pw='+Math.round(p.getBoundingClientRect().width),gp:p.parentElement.className,sty:s.getAttribute('style')}})))}
await b.close()})()
