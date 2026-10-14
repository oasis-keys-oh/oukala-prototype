const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const p=await c.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2000);
console.log(await p.evaluate(()=>{
 const out=[];const tb=document.querySelector('.topbar');
 const d=(e,dep)=>{if(dep>3)return;for(const k of e.children){const r=k.getBoundingClientRect();out.push(' '.repeat(dep*2)+k.tagName+'.'+(k.className&&k.className.baseVal===undefined?k.className:'')+'#'+k.id+' '+Math.round(r.x)+','+Math.round(r.y)+' '+Math.round(r.width)+'x'+Math.round(r.height)+' '+getComputedStyle(k).display+' '+(k.getAttribute('aria-label')||k.textContent.trim().slice(0,20)));d(k,dep+1)}};
 d(tb,0);out.push('--- body kids');
 for(const k of document.body.children){const r=k.getBoundingClientRect();out.push(k.tagName+'.'+k.className+'#'+k.id+' '+Math.round(r.x)+','+Math.round(r.y)+' '+Math.round(r.width)+'x'+Math.round(r.height)+' pos='+getComputedStyle(k).position)}
 out.push(document.querySelector('meta[name=viewport]').content);
 out.push([...document.head.querySelectorAll('meta')].map(m=>m.name+'='+m.content).join(' | '));
 return out.join('\n')}));
await b.close()})();
