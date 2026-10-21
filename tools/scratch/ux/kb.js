// PR-31: keyboard-only walk. Logs each Tab stop (name, role, focus ring visible) and tries the core contributor tasks.
const {open}=require('./lib');const path=require('path');
const STOP=()=>{const e=document.activeElement;if(!e||e===document.body)return 'BODY';const s=getComputedStyle(e);const r=e.getBoundingClientRect();
 const ring=(s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0)||(s.boxShadow&&s.boxShadow!=='none');
 const onscreen=r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;
 return (ring?'':'[NO RING] ')+(onscreen?'':'[OFFSCREEN] ')+e.tagName.toLowerCase()+(e.getAttribute('role')?'['+e.getAttribute('role')+']':'')+' "'+((e.getAttribute('aria-label')||e.innerText||e.value||e.placeholder||'').trim().replace(/\s+/g,' ').slice(0,50))+'"'+(e.closest('#view')?' (view)':e.closest('.rail')?' (rail)':e.closest('.topbar')?' (topbar)':'')};
(async()=>{const persona=process.argv[2]||'emp';const vp=process.argv[3]==='phone'?{width:400,height:860}:{width:1440,height:900};
 const {b,p}=await open({persona,vp});if(!process.env.RAW)await p.evaluate(()=>{document.activeElement&&document.activeElement.blur();scrollTo(0,0)});
 const stops=[];for(let i=0;i<(+process.env.N||40);i++){await p.keyboard.press('Tab');await p.waitForTimeout(40);stops.push(await p.evaluate(STOP))}
 console.log('TAB STOPS from load ('+persona+')');stops.forEach((s,i)=>console.log(String(i+1).padStart(2),s));
 const firstView=stops.findIndex(s=>s.includes('(view)'));console.log('first stop inside main view:',firstView+1);
 // skip link
 await p.evaluate(()=>{document.activeElement.blur();});await p.keyboard.press('Tab');const sk=await p.evaluate(()=>{const e=document.activeElement;const r=e.getBoundingClientRect();return e.textContent.trim()+' visible='+(r.width>2&&r.top>=0&&r.top<innerHeight)});console.log('first Tab:',sk);
 // shortcut "/" opens search
 await p.keyboard.press('Escape');await p.evaluate(()=>document.activeElement.blur());await p.keyboard.press('/');await p.waitForTimeout(300);console.log('after "/":',await p.evaluate(STOP));
 await p.keyboard.type('report a problem');await p.waitForTimeout(600);
 const res=await p.evaluate(()=>{const pal=document.querySelector('[role=listbox],.nx-pal,.zs-res,#nxSearch');return pal?pal.innerText.slice(0,500):'no palette found: '+document.activeElement.outerHTML.slice(0,200)});console.log('search results:\n'+res);
 await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');await p.waitForTimeout(700);console.log('after Enter screen:',await p.evaluate(()=>S.screen),'focus:',await p.evaluate(STOP));
 // escape closes popovers?
 await p.keyboard.press('Escape');
 await p.screenshot({path:path.join(__dirname,'shots','kb-'+persona+'-'+(process.argv[3]||'desk')+'.jpg'),type:'jpeg',quality:45});
 console.log('errs',p.errs);await b.close()})();
