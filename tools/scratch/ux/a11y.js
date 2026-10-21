// PR-31 accessibility pass: landmarks, headings, contrast of common text roles, drawer focus and Escape, chat greeting identity
const L=require('./lib');(async()=>{const {b,p}=await L.open();const out={};
for(const [k,id] of [['pm','home'],['pm','ppm_raid'],['ops','itsm_inc'],['fin','inv']]){await L.setup(p,k);await L.goto(p,id);
 out[k+':'+id]=await p.evaluate(()=>{const lum=c=>{const m=c.match(/[\d.]+/g);const f=x=>{x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4)};return {L:0.2126*f(+m[0])+0.7152*f(+m[1])+0.0722*f(+m[2]),a:m.length>3?+m[3]:1}};
  const bgOf=e=>{while(e){const s=getComputedStyle(e);if(s.backgroundImage!=='none'&&!/gradient/.test(s.backgroundImage))return null;const b=lum(s.backgroundColor);if(b.a>0.9)return b.L;e=e.parentElement}return 1};
  const cr=e=>{const fg=lum(getComputedStyle(e).color);const bg=bgOf(e);if(bg==null)return null;const hi=Math.max(fg.L,bg),lo=Math.min(fg.L,bg);return +((hi+0.05)/(lo+0.05)).toFixed(2)};
  const sample={};['.muted','.small','.eyebrow','th','.chip','.pill','.badge','label','.sub','.hint','small'].forEach(sel=>{const es=[...document.querySelectorAll('#view '+sel)].filter(e=>e.getBoundingClientRect().height>0&&e.textContent.trim()).slice(0,40);
   const v=es.map(cr).filter(x=>x!=null);if(v.length)sample[sel]={n:v.length,min:Math.min(...v),below45:v.filter(x=>x<4.5).length,fs:getComputedStyle(es[0]).fontSize}});
  return {lang:document.documentElement.lang,main:document.querySelectorAll('main,[role=main]').length,navs:document.querySelectorAll('nav,[role=navigation]').length,
   h1:[...document.querySelectorAll('h1')].filter(e=>e.getBoundingClientRect().height>0).map(e=>e.innerText.trim().slice(0,40)),
   imgNoAlt:[...document.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length,svgBtn:[...document.querySelectorAll('button')].filter(x=>!x.innerText.trim()&&!x.getAttribute('aria-label')&&!x.title&&x.getBoundingClientRect().width>0).length,
   live:[...document.querySelectorAll('[aria-live]')].length,sample}})}
/* drawer focus and Escape on ppm_raid */
await L.setup(p,'pm');await L.goto(p,'ppm_raid');await p.evaluate(()=>{const r=[...document.querySelectorAll('#view tbody tr')].find(x=>x.getBoundingClientRect().height>0);r.focus()});await p.keyboard.press('Enter');await p.waitForTimeout(800);
const f=[];f.push(await p.evaluate(()=>{const d=document.getElementById('drawer');return {open:d.getBoundingClientRect().width>0&&d.innerText.length>20,focusInside:d.contains(document.activeElement),active:(document.activeElement.innerText||document.activeElement.tagName).slice(0,30),role:d.getAttribute('role'),modal:d.getAttribute('aria-modal'),label:d.getAttribute('aria-label')||d.getAttribute('aria-labelledby')}}));
for(let i=0;i<40;i++)await p.keyboard.press('Tab');f.push(await p.evaluate(()=>({after40tabs_inside:document.getElementById('drawer').contains(document.activeElement)})));
await p.keyboard.press('Escape');await p.waitForTimeout(500);f.push(await p.evaluate(()=>{const d=document.getElementById('drawer');return {closedByEsc:!(d.getBoundingClientRect().width>0&&d.classList.contains('open')),cls:d.className,focusBack:(document.activeElement.innerText||document.activeElement.tagName).slice(0,40)}}));
out.drawer=f;
/* chat greeting for the Project manager */
await p.evaluate(()=>{const o=document.getElementById('chxOrb');o&&o.click()});await p.waitForTimeout(800);out.chat=(await L.txt(p,'#chatDock')).slice(0,300);
/* rail flyout headers with no entries for the distribution manager */
await L.setup(p,'dist');await L.goto(p,'home');out.railEmpty=await p.evaluate(()=>{const r=document.querySelector('aside.rail');return r.innerText.slice(0,1200)});
console.log(JSON.stringify(out,null,1));await b.close()})();
