const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const dark=a.includes('--dark');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900},colorScheme:dark?'dark':'light'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource/.test(m.text())&&errs.push('console: '+m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:240000});await p.waitForTimeout(3500);
await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),dark?'dark':'light');
const sleep=ms=>p.waitForTimeout(ms);const tag=dark?'dark':'light';
// 1 kit form with two people fields
const r1=await p.evaluate(async()=>{openForm({id:"t15",title:"Test form",fields:[{k:"a",label:"Requested by",type:"people",req:true},{k:"b",label:"Attendees",type:"people",multi:true},{k:"c",label:"Sponsor",type:"people"}],onSubmit:v=>({toast:"ok "+JSON.stringify(v)})});await new Promise(r=>setTimeout(r,500));
 const d=document.querySelector('#drawer');const btns=d.querySelectorAll('.pk-btn');const out={n:btns.length,def:FORMST.t15.vals.a,faceA:btns[0].innerText.replace(/\n/g,' | ')};
 btns[1].click();await new Promise(r=>setTimeout(r,200));d.querySelectorAll('.pk-o')[1].click();await new Promise(r=>setTimeout(r,300));
 out.multi=FORMST.t15.vals.b;out.tags=[...d.querySelectorAll('.pk-tag')].map(x=>x.innerText);
 d.querySelectorAll('.pk-btn')[2].click();await new Promise(r=>setTimeout(r,200));const q=d.querySelector('.pk-pop:not([hidden]) .pk-q');q.value='sam';q.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,150));
 q.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,300));out.c=FORMST.t15.vals.c;return out});
console.log('kit form',JSON.stringify(r1));
try{await p.evaluate(()=>document.querySelector('#drawer').hidePopover())}catch(e){}
// 2 RF someone else
await p.evaluate(()=>go('svc_cat'));await sleep(700);
let has=false;await p.evaluate(()=>go('svc_portal'));await sleep(800);const c=await p.evaluate(()=>{const c=[...document.querySelectorAll('#view [data-svc^="pitem|"]')].find(x=>x.getAttribute('data-svc')!=='pitem|');if(c){c.click();return c.getAttribute('data-svc')}return null});await sleep(900);has=await p.evaluate(()=>!!document.querySelector('.svc3-kind'));console.log('item',c,'rf panel',has);
if(has){await p.evaluate(()=>{[...document.querySelectorAll('.svc3-kind')].find(x=>/Someone else/.test(x.textContent)).click()});await sleep(500);
 await p.evaluate(()=>{const e=document.querySelector('.svc3-pick');e.scrollIntoView({block:'center'})});await sleep(300);
 await p.evaluate(()=>document.querySelector('.svc3-pick .pk-btn').click());await sleep(400);await p.screenshot({path:path.join(dir,'shots','s15-rf-pick-'+tag+'.png')});
 await p.evaluate(()=>{const o=document.querySelectorAll('.svc3-pick .pk-o')[2];o.click()});await sleep(700);
 console.log('who',await p.evaluate(()=>RF.state().who+'|'+RF.state().kind));await p.screenshot({path:path.join(dir,'shots','s15-rf-picked-'+tag+'.png')})}
console.log('errors:',errs.length?errs:'none');await b.close()})();
