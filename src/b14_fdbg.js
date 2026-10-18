const {chromium}=require('playwright');const path=require('path');const dir=path.resolve('out_b14');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+dir+'/full.html',{waitUntil:'commit',timeout:90000});await p.waitForTimeout(9000);
await p.evaluate(()=>{FLOWX.open('wf_inv')});await p.waitForTimeout(900);await p.evaluate(()=>{const A=FLOWX._ed();A.E.zoom=.6;A.paintCanvas()});await p.waitForTimeout(300);
const pt=await p.evaluate(()=>{const g=document.querySelector('.wfd-edge[data-wfd-edge="e0_wf_inv"] .vis');const L=g.getTotalLength(),q=g.getPointAtLength(L*.33);const A=FLOWX._ed(),cv=document.querySelector('#wfdCanvas'),rc=cv.getBoundingClientRect(),z=A.E.zoom||1;return[rc.left-cv.scrollLeft+q.x*z,rc.top-cv.scrollTop+q.y*z,document.querySelector('.wfd-edge').dataset.wfdEdge]});
console.log(pt);await p.mouse.click(pt[0],pt[1]);await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const a=document.activeElement;return a.tagName+'.'+(a.getAttribute('class')||'')+' selE='+FLOWX._ed().E.selE}));
await p.keyboard.press('Enter');await p.waitForTimeout(400);console.log('mini',await p.locator('.wfd-mini').count());await b.close()})();
