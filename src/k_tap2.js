const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const ids=process.argv[3].split(',');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:400,height:820},hasTouch:true});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:300000});await p.waitForTimeout(3000);
for(const id of ids){await p.evaluate(i=>go(i),id);await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const out=[];document.querySelectorAll('#view button,#view [role=button],#view summary,#view input,#view select,#view a[href]').forEach(e=>{if(e.closest('[hidden],details:not([open])>:not(summary)'))return;const r=e.getBoundingClientRect();if(r.width<1||r.height<1)return;if(r.height<43.5||r.width<43.5){const cs=getComputedStyle(e);let sc=1,n=e;while(n&&n!==document.body){const t=getComputedStyle(n).transform;if(t&&t!=='none'){const m=t.match(/matrix\(([^,]+)/);if(m)sc*=+m[1]}n=n.parentElement}
 out.push(e.tagName.toLowerCase()+'.'+String(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className).split(' ')[0]+' '+Math.round(r.width)+'x'+Math.round(r.height)+' minH='+cs.minHeight+' disp='+cs.display+' scale='+sc.toFixed(2))}});return out.slice(0,6).concat(['total '+out.length])});
 console.log(id,JSON.stringify(r))}
await b.close()})();
