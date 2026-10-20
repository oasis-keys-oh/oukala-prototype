const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:1000}});const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file:///home/claude/oukala/build_out/full.html',{waitUntil:'load'});await p.waitForTimeout(8000);
await p.click('#stuPill');await p.waitForTimeout(800);
await p.evaluate(()=>{STUDIO.fast=true;STUDIO.start('ret')});
// walk to guard view by clicking chips/answers
for(let k=0;k<120;k++){await p.waitForTimeout(300);const v=await p.evaluate(()=>STUDIO.view);if(v==='guard')break;await p.evaluate(()=>{const c=document.querySelector('#sugs .chip');if(c)c.click()})}
await p.waitForTimeout(500);await p.screenshot({path:'../shots/wall_pre.png'});
await p.evaluate(()=>{const c=document.querySelector('#sugs .chip');if(c)c.click()});await p.waitForTimeout(5000);
await p.screenshot({path:'../shots/wall_post.png'});
await p.screenshot({path:'../shots/strip.png',clip:{x:966,y:100,width:470,height:130}});console.log(JSON.stringify(await p.evaluate(()=>{const t=document.querySelector('.stx-t'),c=getComputedStyle(t),r=t.getBoundingClientRect();return [r.top,r.height,c.lineHeight,c.fontSize,c.overflow,c.margin,c.position,c.transform,c.display]})));console.log(JSON.stringify(await p.evaluate(()=>{const e=document.getElementById('stuStrip'),r=e.getBoundingClientRect(),c=getComputedStyle(e),pr=getComputedStyle(e.parentNode);return [r.top,r.height,c.display,c.flex,c.overflow,pr.display,pr.flexDirection,pr.overflow,pr.height,e.parentNode.className,e.previousElementSibling&&e.previousElementSibling.className]})));console.log(await p.evaluate(()=>STUDIO.view+' built='+STUDIO.built),'errors',JSON.stringify(errs));await b.close()})()
