// Usage: NODE_PATH=$(npm root -g) node r17_mobile_content.js OUTDIR --w 390 --tag before [--only a,b]
// Audits every screen's #view content on a phone. Writes r17_audit_<tag>_<w>.json
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const W=a.includes('--w')?+a[a.indexOf('--w')+1]:390;const tag=a.includes('--tag')?a[a.indexOf('--tag')+1]:'run';
const only=a.includes('--only')?a[a.indexOf('--only')+1].split(','):null;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(900);
const ids=only||await p.evaluate(()=>SCREENS.map(s=>s[0]));const res={};
for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(450);
 const r=await p.evaluate(()=>{
  const vw=innerWidth,view=document.querySelector('#view');const o={vw,docW:document.documentElement.scrollWidth,pageH:document.documentElement.scrollHeight,viewSW:view.scrollWidth};
  o.docOverflow=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>vw+1;
  const vis=e=>{try{return e.checkVisibility({checkVisibilityCSS:true})}catch(_){return true}};
  const nm=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&e.className.baseVal===undefined&&e.className?'.'+String(e.className).trim().split(/\s+/).slice(0,2).join('.'):'');
  const isScroller=e=>{const cs=getComputedStyle(e);return (cs.overflowX==='auto'||cs.overflowX==='scroll')&&e!==view};
  const inScroller=e=>{let x=e.parentElement;while(x&&x!==view){if(isScroller(x))return x;x=x.parentElement}return null};
  const all=[...view.querySelectorAll('*')].filter(e=>vis(e));
  o.nEl=all.length;
  // wide elements
  const wide=[];for(const e of all){const r=e.getBoundingClientRect();if(r.width<1||e.closest('svg')&&e.tagName!=='svg')continue;if(r.right>vw+1&&!inScroller(e)&&!isScroller(e)){wide.push({n:nm(e),r:Math.round(r.right),w:Math.round(r.width)})}
    else if(isScroller(e)&&e.getBoundingClientRect().right>vw+1)wide.push({n:nm(e)+'(scroller)',r:Math.round(r.right),w:Math.round(r.width)})}
  // reduce to outermost: drop those whose parent also in list
  o.wide=wide.length;o.wideEx=wide.slice(0,5);
  // tables
  const tbl=[...view.querySelectorAll('table')].filter(vis);o.tables=tbl.length;o.tablesScroll=tbl.filter(t=>inScroller(t)).length;
  o.tableWide=tbl.filter(t=>{const r=t.getBoundingClientRect();return r.width>vw-20}).length;
  o.tableCols=tbl.map(t=>{const tr=t.querySelector('tr');return tr?tr.children.length:0});
  // small text
  let small=0;const smallEx={};for(const e of all){if(e.closest('svg'))continue;let own=false;for(const n of e.childNodes)if(n.nodeType===3&&n.nodeValue.trim().length>1){own=true;break}if(!own)continue;const fs=parseFloat(getComputedStyle(e).fontSize);if(fs<12){small++;const k=nm(e);smallEx[k]=(smallEx[k]||0)+1}}
  o.small=small;o.smallEx=Object.entries(smallEx).sort((x,y)=>y[1]-x[1]).slice(0,4);o.smallAll=smallEx;
  // taps
  let taps=0,tapsTotal=0;const tapEx={};
  for(const e of all){if(!e.matches('a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[data-go],[data-nav],[onclick]'))continue;if(e.closest('svg')&&e.tagName!=='svg'&&!e.matches('a,button'))continue;
    const cs=getComputedStyle(e);if(e.tagName==='A'&&cs.display==='inline'&&e.closest('p,li,span,div,small,td')&&e.parentElement&&e.parentElement.childNodes.length>1&&[...e.parentElement.childNodes].some(n=>n.nodeType===3&&n.nodeValue.trim().length>3))continue; // inline link in prose
    if(e.type==='checkbox'||e.type==='radio'){const l=e.closest('label');if(l){const lr=l.getBoundingClientRect();if(lr.height>=44)continue}}
    if(e.closest('[inert]'))continue;
    if(e.matches('.views>input')||cs.opacity==='0'||cs.clip==='rect(0px, 0px, 0px, 0px)')continue;const r=e.getBoundingClientRect();if(r.width<2||r.height<2)continue;tapsTotal++;if(r.width<43.5||r.height<43.5){taps++;const k=nm(e);tapEx[k]=(tapEx[k]||0)+1}}
  o.taps=taps;o.tapsTotal=tapsTotal;o.tapEx=Object.entries(tapEx).sort((x,y)=>y[1]-x[1]).slice(0,4);o.tapAll=tapEx;
  // grids multi-col
  const gm=[];for(const e of all){const cs=getComputedStyle(e);if(cs.display!=='grid'&&cs.display!=='inline-grid')continue;const t=cs.gridTemplateColumns.split(' ').filter(x=>/px$/.test(x)).map(parseFloat);if(t.length>=2){const r=e.getBoundingClientRect();if(r.width<5)continue;const min=Math.min(...t);if(t.length>=3||min<120){if(!inScroller(e)){const cc=[...e.children].filter(k=>k.matches('.card,.tile,.mini,.stat,.fkpi,[class*=card]')).length;gm.push({n:nm(e),cols:t.length,min:Math.round(min),card:cc>=2&&min<150})}}}}
  o.gridsMulti=gm.length;o.gridsCards=gm.filter(g=>g.card).length;o.gridEx=gm.slice(0,4);{const m={};gm.forEach(g=>m[g.n]=(m[g.n]||0)+1);o.gridAll=m}
  // canvases
  const cv=[];for(const e of view.querySelectorAll('svg,canvas')){if(!vis(e))continue;if(e.closest('svg')&&e!==e.closest('svg'))continue;const r=e.getBoundingClientRect();const w=parseFloat(e.getAttribute('width'))||r.width;const sc=inScroller(e);if((w>vw-24&&r.width>vw-24 && sc)||r.width>vw+1||(sc&&sc.scrollWidth>sc.clientWidth*1.3&&r.width>vw)){cv.push({n:nm(e),w:Math.round(r.width),h:Math.round(r.height)})}}
  // scrollers with big scrollWidth
  const hs=[];for(const e of all){if(!isScroller(e))continue;if(e.scrollWidth>e.clientWidth+4)hs.push({n:nm(e),sw:e.scrollWidth,cw:e.clientWidth,tag:e.tagName})}
  o.canvases=cv.length;o.canvasEx=cv.slice(0,3);o.hscrollers=hs.length;o.hscrollEx=hs.slice(0,3);
  o.hscrollMax=hs.reduce((m,x)=>Math.max(m,x.sw),0);
  // inputs <16px
  let inp=0;for(const e of all){if(e.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]),select,textarea')&&parseFloat(getComputedStyle(e).fontSize)<15.9)inp++}
  o.inputsSmall=inp;o.inputs=[...all].filter(e=>e.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]),select,textarea')).length;
  // sticky/fixed in view
  let st=0,stH=0;for(const e of all){const cs=getComputedStyle(e);if(cs.position==='fixed'||cs.position==='sticky'){if(e.tagName==='TH'||e.tagName==='TD')continue;st++;stH+=e.getBoundingClientRect().height}}
  o.sticky=st;o.stickyH=Math.round(stH);
  // nested scroll regions
  const nv=[];for(const e of all){const cs=getComputedStyle(e);if((cs.overflowY==='auto'||cs.overflowY==='scroll')&&e.scrollHeight>e.clientHeight+10&&e.clientHeight>=200)nv.push({n:nm(e),ch:e.clientHeight,sh:e.scrollHeight})}
  o.vscrollers=nv.length;o.vscrollEx=nv.slice(0,3);
  return o});
 res[id]=r}
fs.writeFileSync(path.join(__dirname,`r17_audit_${tag}_${W}.json`),JSON.stringify(res));
const AGG={};for(const [k,f] of [['small','smallAll'],['taps','tapAll'],['grid','gridAll']]){AGG[k]={};for(const x of Object.values(res))for(const [n,c] of Object.entries(x[f]||{}))AGG[k][n]=(AGG[k][n]||0)+c}res.__agg=AGG;
fs.writeFileSync(path.join(__dirname,`r17_audit_${tag}_${W}.json`),JSON.stringify(res));
const S=(k)=>Object.values(res).filter(x=>x.vw).reduce((s,x)=>s+(typeof x[k]==='number'?x[k]:0),0);
const cnt=(k)=>Object.values(res).filter(x=>x.vw&&x[k]>0).length;
console.log('W',W,'screens',ids.length);
for(const k of ['docOverflow','wide','tables','tablesScroll','tableWide','small','taps','tapsTotal','gridsMulti','gridsCards','canvases','hscrollers','inputsSmall','inputs','sticky','vscrollers'])console.log(k.padEnd(14),'sum',String(k==='docOverflow'?Object.values(res).filter(x=>x.vw&&x.docOverflow).length:S(k)).padStart(7),' screens',cnt(k));
await b.close()})();
