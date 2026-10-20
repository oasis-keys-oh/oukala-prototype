const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const lab=Object.fromEntries(SCREENS.map(s=>[s[0],s[1]]));const g={};SCREENS.forEach(s=>{const k=(window.NAVGRP&&NAVGRP[s[0]])||s[3];(g[k]=g[k]||[]).push(s[0])});
const o={};NAVG.forEach(([k,l])=>{const par=NAVP&&NAVP[k];const ks=g[k]||[];const ord=(NAVORD&&NAVORD[k])||[];o[l]={parent:par,items:ord.filter(x=>ks.includes(x)).concat(ks.filter(x=>!ord.includes(x))).map(x=>x+(NAVSUB[k]&&NAVSUB[k][x]?' <'+NAVSUB[k][x]+'>':''))}});return o});
console.log(JSON.stringify(r,null,1));await b.close()})();
