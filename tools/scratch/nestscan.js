// Usage: NODE_PATH=$(npm root -g) node nestscan.js OUTDIR [--w 1440] [--only a,b] [--theme dark|light] [--json file]
// Round 15 rule N: "table wrapper inside card has border+scroll". Flags, per screen, any scroll container (overflow auto/scroll, or
// .tablewrap/.tscroll/.bt-scroll/.bud-tw) that sits inside a bordered card AND itself has a border or shadow or glass fill (double outline),
// or that shows an inner VERTICAL scrollbar (scrollHeight > clientHeight with overflow-y auto/scroll) inside a card, except marked data-scroll="ok".
// Fix: remove border/shadow/background and max-height from the wrapper (see .card .tablewrap in mod_r15b_pick.css). Zero findings is the bar.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const w=a.includes('--w')?+a[a.indexOf('--w')+1]:1440;const only=a.includes('--only')?a[a.indexOf('--only')+1].split(','):null;
const theme=a.includes('--theme')?a[a.indexOf('--theme')+1]:'light';const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:w,height:900},colorScheme:theme})).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:240000});await p.waitForTimeout(2500);await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
const ids=only||await p.evaluate(()=>SCREENS.map(s=>s[0]));let total=0;const all=[];
for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(220);
 const r=await p.evaluate(()=>{const out=[];const view=document.querySelector('#view');if(!view)return out;
  const hasBorder=cs=>['Top','Right','Bottom','Left'].some(s=>parseFloat(cs['border'+s+'Width'])>0&&cs['border'+s+'Style']!=='none'&&!/rgba?\(\d+,\s*\d+,\s*\d+,\s*0\)/.test(cs['border'+s+'Color']));
  const isCard=el=>{const cs=getComputedStyle(el);return (el.matches('.card,section.card,.glass')||hasBorder(cs))&&el.getBoundingClientRect().width>200};
  view.querySelectorAll('.tablewrap,.tscroll,.bt-scroll,.bud-tw,div,section,ul,ol').forEach(el=>{if(el.offsetParent===null||el.closest('[data-scroll=ok],details.mp,[popover],.pk-pop,.sugg,.nw-pop,[role=listbox],[role=dialog],.bl-colpop'))return;
   const cs=getComputedStyle(el),ox=cs.overflowX,oy=cs.overflowY;const scrolls=/(auto|scroll)/.test(ox)||/(auto|scroll)/.test(oy);if(!scrolls)return;
   const r=el.getBoundingClientRect();if(r.width<120||r.height<30)return;
   if(!(el.matches('.tablewrap,.tscroll,.bt-scroll,.bud-tw')||el.querySelector(':scope > table')))return;
   let card=null;for(let q=el.parentElement;q&&q!==view;q=q.parentElement){if(isCard(q)){card=q;break}}if(!card)return;
   const fill=(()=>{const m=/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(cs.backgroundColor||'');return !!m&&(m[4]===undefined||+m[4]>0.05)})();const box=hasBorder(cs)||(cs.boxShadow&&cs.boxShadow!=='none')||fill;
   const vscroll=/(auto|scroll)/.test(oy)&&el.scrollHeight>el.clientHeight+2&&el.clientHeight>60;
   if(box)out.push({k:box&&vscroll?'BOX+VSCROLL':box?'BOX':'VSCROLL',el:(el.tagName+'.'+[...el.classList].slice(0,3).join('.')),card:(card.tagName+'.'+[...card.classList].slice(0,3).join('.')),h:Math.round(r.height),sh:el.scrollHeight})});
  return out});
 if(r.length){total+=r.length;all.push({id,r});console.log(id,r.length,JSON.stringify(r.slice(0,3)))}}
console.log('TOTAL findings',total,'on',all.length,'screens of',ids.length);if(a.includes('--json'))fs.writeFileSync(a[a.indexOf('--json')+1],JSON.stringify(all,null,1));await b.close()})();
