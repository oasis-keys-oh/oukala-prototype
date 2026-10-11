const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900},colorScheme:'dark'})).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+process.cwd()+'/out_v16b/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(6000);
const r=await p.evaluate(async()=>{const out=[];
const OV='dialog,[role=dialog],aside,.drawer,.modal,.pop,.nx-pop,.nw-pop,[popover],.sheet,.inbx-panel,.inbx-focus,#drawer,.toast,[role=status],[role=alert]';
const snap=()=>[...document.querySelectorAll(OV)].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>60&&r.height>30&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight&&cs.visibility!=='hidden'&&cs.display!=='none'&&+cs.opacity>0.05}).map(e=>e.tagName.toLowerCase()+'#'+(e.id||'')+'.'+String(e.className).split(' ')[0]);
for(const [sid,lab] of [['inv','Hold'],['home','Review'],['itsm_inc','Log incident']]){go(sid);await new Promise(r=>setTimeout(r,800));
 const btn=[...document.querySelector('#view').querySelectorAll('button')].find(x=>(x.textContent||'').trim().startsWith(lab));if(!btn){out.push([sid,lab,'nf']);continue}
 const a=snap();btn.click();await new Promise(r=>setTimeout(r,500));const b2=snap();
 out.push([sid,lab,'before',a.join('|'),'after',b2.filter(x=>!a.includes(x)).join('|')]);
}
return out});console.log(JSON.stringify(r,null,1));await b.close()})();
