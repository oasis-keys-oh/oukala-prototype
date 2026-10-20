const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file:///home/claude/oukala/build_out/full.html',{waitUntil:'load'});await p.waitForTimeout(9000);
const info=()=>p.evaluate(()=>({scr:S.screen,vis:!!document.getElementById('chatq').offsetParent,strip:(document.getElementById('stuStrip')||{}).innerText||null,sugs:[...document.querySelectorAll('#sugs .chip')].map(c=>c.innerText),last:(document.getElementById('msgs').innerText||'').slice(-260),open:document.documentElement.classList.contains('chx-open')}));
const say=async t=>{await p.evaluate(()=>{const d=document.getElementById('drawer');if(d&&d.hidePopover)try{d.hidePopover()}catch(e){}});await p.fill('#chatq',t);await p.press('#chatq','Enter');await p.waitForTimeout(1800)};
// general chat offer
await p.evaluate(()=>CHATX.open('chat'));await p.waitForTimeout(500);
await say('build a workflow for damaged returns');console.log('offer',JSON.stringify(await info()));
await p.evaluate(()=>document.querySelector('#sugs .chip[data-cx-ask="Just answer"]').click());await p.waitForTimeout(2500);console.log('just answer',JSON.stringify(await info()));
await say('build an approval process for discounts');await p.evaluate(()=>document.querySelector('#sugs .chip[data-cx-ask="Build this with Oukala"]').click());await p.waitForTimeout(2500);console.log('after build',JSON.stringify(await info()));
await p.evaluate(()=>{STUDIO.fast=false});
await p.evaluate(()=>STUDIO.start('ret'));await p.waitForTimeout(3500);console.log('started',JSON.stringify(await info()));
await say('who is on call today');console.log('unclear',JSON.stringify(await info()));
await p.evaluate(()=>document.querySelector('#sugs .chip[data-cx-ask="Ask the assistant"]').click());await p.waitForTimeout(3000);console.log('asked',JSON.stringify(await info()));
await say('who is on call today');await p.evaluate(()=>document.querySelector('#sugs .chip[data-cx-ask="Part of the build"]').click());await p.waitForTimeout(2500);console.log('part',JSON.stringify(await info()));
await p.evaluate(()=>document.querySelector('[data-stu-exit]').click());await p.waitForTimeout(800);console.log('exit',JSON.stringify(await info()),await p.evaluate(()=>S.screen));
console.log('errors',JSON.stringify(errs.slice(0,5)));await b.close()})()
