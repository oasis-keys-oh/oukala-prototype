const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>{console.log('PAGEERR',e.message,(e.stack||'').split('\n').slice(0,4).join(' | '),'screen',global.__cur)});
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
const ids=['port','trace','home','inv','tower','kg','fo','ims','plan','ppm_proj','exe_dash','exe_strat','exe_mat','exe_risk','exe_apps','exe_board','exe_scen'];
const res={};
for(const id of ids){global.__cur=id;await p.evaluate(i=>go(i),id);await p.waitForTimeout(100);
 const n=await p.evaluate(()=>{const v=document.querySelector('#view');return [...v.querySelectorAll('button,tr,[role=button],[data-rec],a')].filter(e=>e.checkVisibility()&&!e.closest('.vsw')&&!e.closest('nav')).length});
 let opened=0,withFull=0,fullWorks=0,tried=0;
 for(let k=0;k<Math.min(n,40)&&opened<3;k++){
  const r=await p.evaluate(k=>{const v=document.querySelector('#view');const el=[...v.querySelectorAll('button,tr,[role=button],[data-rec],a')].filter(e=>e.checkVisibility()&&!e.closest('.vsw')&&!e.closest('nav'))[k];if(!el)return null;if(/delete|remove|reset|clear|submit|approve|reject|send|apply|run |kill|create/i.test(el.textContent.slice(0,30)))return {skip:1};const s0=S.screen;el.click();const d=document.getElementById('drawer');const open=d&&d.matches(':popover-open');
   if(!open){if(S.screen!==s0)go(s0);return {open:false}}
   const x=d.querySelector('.dexpand');let fw=false;if(x){x.click();const rc=d.getBoundingClientRect();fw=d.classList.contains('dfull')&&rc.width>=innerWidth*0.9;x.click()}
   const info={open:true,x:!!x,fw,title:(d.querySelector('h1,h2,h3')||{}).textContent,txtlen:d.innerText.length};d.hidePopover();return info},k).catch(e=>({err:e.message}));
  if(!r||r.skip)continue;tried++;if(r.open){opened++;if(r.x)withFull++;if(r.fw)fullWorks++;(res[id]=res[id]||[]).push((r.title||'').slice(0,30)+(r.x?'':' NOFULLBTN')+(r.fw?'':' FULLFAIL'))}
 }
 console.log(id.padEnd(12),'opened',opened,'fullbtn',withFull,'fullworks',fullWorks,'tried',tried,(res[id]||[]).join(' | '))}
console.log(errs);await b.close()})();
