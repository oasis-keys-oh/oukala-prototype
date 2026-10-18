const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900},colorScheme:'dark'});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+process.argv[2]+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const o={};const tb=document.querySelector('.topbar,header,.top');o.tbSel=tb&&(tb.tagName+'.'+tb.className);o.tb=tb&&tb.outerHTML.replace(/<svg.*?<\/svg>/g,'<svg/>').slice(0,3500);
const st=document.querySelector('.hero [data-nx-star]');o.star=st&&st.parentElement.outerHTML.replace(/<svg.*?<\/svg>/g,'<svg/>').slice(0,900);
o.hero=document.querySelector('.hero').outerHTML.replace(/<svg.*?<\/svg>/g,'<svg/>').replace(/<div popover.*?<\/div>/g,'<pop/>').slice(-1500);
o.navgroups=[...document.querySelectorAll('#nav > *')].map(e=>e.tagName+'.'+e.className+'|'+(e.getAttribute('data-nx-grp')||e.getAttribute('data-grp')||e.id||'')+'|'+e.textContent.trim().slice(0,30));
return o});
console.log(JSON.stringify(r,null,1));await b.close()})();
