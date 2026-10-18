// node a14_audit.js OUT W THEME [--shots dir] [--only a,b]
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const w=+a[1]||1440;const theme=a[2]||'light';const shots=a.includes('--shots')?a[a.indexOf('--shots')+1]:null;const only=a.includes('--only')?a[a.indexOf('--only')+1].split(','):null;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:w,height:w<500?820:900},colorScheme:theme})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
await p.evaluate(t=>{document.documentElement.setAttribute('data-theme',t)},theme);
await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
if(shots)fs.mkdirSync(shots,{recursive:true});
const ids=only||await p.evaluate(()=>SCREENS.map(s=>s[0]));const res={};
for(const id of ids){await p.evaluate(i=>go(i),id).catch(e=>errs.push(id+' '+e.message));await p.waitForTimeout(350);
 const r=await p.evaluate(()=>{const out={};const v=document.querySelector('#view');
  const vcs=getComputedStyle(v);out.focusRing=document.activeElement===v&&vcs.outlineStyle!=='none'&&parseFloat(vcs.outlineWidth)>0;
  out.hscroll=document.documentElement.scrollWidth>innerWidth+1?document.documentElement.scrollWidth:0;
  // clipped
  const clip=[];v.querySelectorAll('*').forEach(el=>{if(el.offsetParent===null)return;const cs=getComputedStyle(el);if(cs.overflowX==='visible'||cs.textOverflow==='ellipsis'||cs.overflowX==='auto'||cs.overflowX==='scroll')return;if(el.scrollWidth>el.clientWidth+3&&el.clientWidth>20&&(el.innerText||'').trim().length>3&&!el.closest('svg')&&el.tagName!=='svg'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)){clip.push((el.className&&el.className.toString().slice(0,24)||el.tagName)+':'+(el.innerText||'').trim().slice(0,28).replace(/\n/g,' '))}});
  out.clip=clip.slice(0,6);out.clipN=clip.length;
  // contrast
  const parse=s=>{const m=s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);return {r:p[0],g:p[1],b:p[2],a:p[3]==null||isNaN(p[3])?1:p[3]}};
  const comp=(f,b)=>({r:f.r*f.a+b.r*(1-f.a),g:f.g*f.a+b.g*(1-f.a),b:f.b*f.a+b.b*(1-f.a),a:1});
  const lum=c=>{const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b)};
  const hx=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();const base=/^#/.test(hx)?{r:parseInt(hx.slice(1,3),16),g:parseInt(hx.slice(3,5),16),b:parseInt(hx.slice(5,7),16),a:1}:{r:255,g:255,b:255,a:1};
  const bgOf=el=>{const chain=[];for(let e=el;e&&e.nodeType===1;e=e.parentElement){const c=parse(getComputedStyle(e).backgroundColor);if(c&&c.a>0){chain.push(c);if(c.a>=.99)break}}let bg=base;for(let i=chain.length-1;i>=0;i--)bg=comp(chain[i],bg);return bg};
  const low=[];const seen=new Set();const tw=document.createTreeWalker(v,NodeFilter.SHOW_TEXT);let n,cnt=0;
  while((n=tw.nextNode())&&cnt<1500){const t=n.nodeValue.trim();if(t.length<2)continue;const el=n.parentElement;if(!el||el.offsetParent===null||seen.has(el))continue;seen.add(el);cnt++;const cs=getComputedStyle(el);if(cs.visibility==='hidden'||+cs.opacity===0)continue;
   if(el.closest('svg')||el.closest('[disabled],[aria-disabled=true]'))continue;
   let fg=parse(cs.color);if(!fg)continue;let op=1;for(let e=el;e&&e!==v;e=e.parentElement){op*=+getComputedStyle(e).opacity}
   const bg=bgOf(el);fg=comp({...fg,a:fg.a*op},bg);const L1=lum(fg),L2=lum(bg);const ratio=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);const fs=parseFloat(cs.fontSize),bold=+cs.fontWeight>=700;const large=fs>=24||(fs>=18.66&&bold);const need=large?3:4.5;
   if(ratio<need)low.push({r:+ratio.toFixed(2),need,t:t.slice(0,26),c:(el.className&&el.className.toString().slice(0,22))||el.tagName,fg:cs.color,fs})}
  out.low=low.slice(0,8);out.lowN=low.length;
  // tap targets
  if(innerWidth<500){const small=[];v.querySelectorAll('button,a[href],[role=button],[role=tab],input:not([type=hidden]),select,summary,[data-nav],[data-go]').forEach(el=>{if(el.offsetParent===null)return;let r=el.getBoundingClientRect();if(r.width<1)return;if(el.tagName==='INPUT'&&/checkbox|radio/.test(el.type||'')){const lb=el.closest('label');if(lb)r=lb.getBoundingClientRect();else if(+getComputedStyle(el).opacity===0)return}const af=getComputedStyle(el,'::after');const afh=af.content!=='none'&&af.position==='absolute'?parseFloat(af.height)||0:0;if(afh>=43)return;if(r.height<43||r.width<43){small.push((el.className&&el.className.toString().slice(0,18)||el.tagName)+' '+Math.round(r.width)+'x'+Math.round(r.height))}});out.tap=small.slice(0,5);out.tapN=small.length}
  // empty grid slots
  const gaps=[];v.querySelectorAll('*').forEach(el=>{if(el.offsetParent===null)return;const cs=getComputedStyle(el);if(cs.display!=='grid')return;const kids=[...el.children].filter(k=>k.offsetParent!==null&&getComputedStyle(k).position!=='absolute');if(kids.length<3)return;const cols=cs.gridTemplateColumns.split(' ').length;if(cols<2)return;const rows={};kids.forEach(k=>{const t=Math.round(k.getBoundingClientRect().top/8);rows[t]=(rows[t]||[]).concat(k)});const keys=Object.keys(rows).map(Number).sort((x,y)=>x-y);if(keys.length<2)return;const last=rows[keys[keys.length-1]],first=rows[keys[0]];const er=el.getBoundingClientRect();const right=Math.max(...last.map(k=>k.getBoundingClientRect().right));if(last.length<first.length&&er.right-right>40)gaps.push((el.className&&el.className.toString().slice(0,26)||el.tagName)+' '+last.length+'/'+first.length)});
  out.gaps=gaps.slice(0,4);out.gapN=gaps.length;
  // sibling inequality
  const iso=el=>{const cs=getComputedStyle(el);const bg=cs.backgroundColor!=='rgba(0, 0, 0, 0)'||cs.backgroundImage!=='none';const bd=parseFloat(cs.borderTopWidth)>0||cs.boxShadow!=='none';const r=el.getBoundingClientRect();return r.width>120&&r.height>60&&(bg||bd)&&cs.display!=='inline'&&cs.position!=='absolute'};
  const uneq=[];const pars=new Set();v.querySelectorAll('*').forEach(par=>{const kids=[...par.children].filter(k=>k.offsetParent!==null&&iso(k));if(kids.length<2)return;const rows={};kids.forEach(k=>{const t=Math.round(k.getBoundingClientRect().top/6);(rows[t]=rows[t]||[]).push(k)});Object.values(rows).forEach(row=>{if(row.length<2)return;const hs=row.map(k=>k.getBoundingClientRect().height);const d=Math.max(...hs)-Math.min(...hs);if(d>4&&!row.some(k=>k.closest('table'))){uneq.push((par.id?'#'+par.id+' ':par.className.toString().slice(0,16)+' > ')+row.map(k=>k.className.toString().split(' ')[0]).join('|').slice(0,40)+' d='+Math.round(d))}})});
  out.uneq=uneq.slice(0,5);out.uneqN=uneq.length;
  // top bar overlap: content hidden under topbar at scroll 0? check heading sticky
  const tb=document.querySelector('.topbar');out.sp=getComputedStyle(document.querySelector('main#view')).scrollPaddingTop+'|'+getComputedStyle(document.documentElement).scrollPaddingTop;
  return out});
 res[id]=r;if(shots)await p.screenshot({path:`${shots}/${id}_${w}_${theme}.png`});}
fs.writeFileSync(`aud14/${path.basename(dir)}_${w}_${theme}.json`,JSON.stringify({errs,res},null,1));
let t={focus:0,hs:0,clip:0,low:0,tap:0,gap:0,uneq:0};for(const [k,r] of Object.entries(res)){if(r.focusRing)t.focus++;if(r.hscroll)t.hs++;t.clip+=r.clipN;t.low+=r.lowN;t.tap+=r.tapN||0;t.gap+=r.gapN;t.uneq+=r.uneqN}
console.log(w,theme,'screens',ids.length,JSON.stringify(t),'errs',errs.length);await b.close()})();
