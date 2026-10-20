const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900},colorScheme:'dark'});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+process.cwd()+'/out_v16b/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(3000);
await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
for(const id of ['inv','home','budget','itsm_inc']){
const r=await p.evaluate(async(id)=>{const o={};go(id);await new Promise(r=>setTimeout(r,900));
const v=document.querySelector('#view');const sc=v.querySelector('.screen');
o.exists=SCREENS.find(s=>s[0]===id)?1:0;
const kids=(el,d)=>[...el.children].filter(c=>c.getBoundingClientRect().height>0).map(c=>{const r=c.getBoundingClientRect();return '  '.repeat(d)+c.tagName+'.'+String(c.className).slice(0,50)+' '+[r.x,r.y,r.width,r.height].map(Math.round).join(',')+(d<1?'\n'+kids(c,d+1).slice(0,2000):'')}).join('\n');
o.tree=sc?kids(sc,0).slice(0,3000):'none';
o.tabs=[...v.querySelectorAll('label')].filter(l=>l.querySelector('input[type=radio]')).slice(0,4).map(l=>l.outerHTML.slice(0,200)).join('\n');
o.scroll=getComputedStyle(v).overflowY+' '+v.scrollHeight+'/'+v.clientHeight+' doc '+document.documentElement.scrollHeight;
return o},id);
console.log('=====',id);for(const k in r)console.log('##',k,'\n',r[k]);}
await b.close()})();
