// Screen reachability (CL-41; decision adopted 2026-10-19: unreachable screens are hidden, never deleted).
// Opens the built page and computes, for every registered screen, the ways a person can get to it:
//   menu    the screen has a menu entry in a visible group (NAVX.map, full menu)
//   family  it is a view of a folded family (R15.hidden with a family or an alias), so the family's view switcher opens it
//   link    another screen links to it: a rendered [data-go], [data-nav] or [data-link="screen:id"] on the first view of any
//           screen, or a static go("id"), data-go or data-nav reference in another source file (SCRMAP_DATA nv)
//   tour    a Showroom beat opens it (SHOW.demos beats .go)
//   search  the global search lists it (every screen that is not hidden); search alone does not make a screen reachable,
//           because search lists every registered screen whether anyone needs it or not
// A screen with no menu, family, link or tour path is unreachable. Those are listed in src/mod_s_hide.js (HIDE.LIST), hidden
// from the menu and search, and shown on the Administration card "Hidden screens" with an Unhide button.
// Usage: node tools/lint/reach.js <dir containing full.html> [--write]   (--write rewrites docs/inventory/unreachable-screens.md)
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const ROOT=path.resolve(__dirname,'../..');const DOC=path.join(ROOT,'docs/inventory/unreachable-screens.md');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const write=process.argv.includes('--write');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view')&&window.NAVX&&NAVX.map,null,{timeout:120000});await p.waitForTimeout(2500);
/* the CL-41 list itself must not make a screen look unreachable: measure with it unhidden */
await p.evaluate(()=>{try{if(window.HIDE)HIDE.LIST.forEach(x=>HIDE.unhide(x.id,{quiet:true}))}catch(e){}});
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));const linkBy={};
for(const id of ids){await p.evaluate(i=>{try{closeDrawer()}catch(e){}try{go(i)}catch(e){}},id);await p.waitForTimeout(60);
 const t=await p.evaluate(()=>{const o=new Set();document.querySelectorAll('#view [data-go],#view [data-nav],#view [data-link^="screen:"]').forEach(e=>{const v=e.dataset.go||e.dataset.nav||(e.dataset.link||'').replace(/^screen:/,'');if(v)o.add(v.split(/[?:|]/)[0])});return[...o]});
 t.forEach(x=>{if(x!==id)(linkBy[x]=linkBy[x]||new Set()).add(id)})}
const rows=await p.evaluate(LB=>{const D=(window.SCRMAP_DATA||{}).screens||{};const groups=new Set(NAVX.groups.map(g=>g.id));
 const tour={};(window.SHOW&&SHOW.demos||[]).forEach(d=>(d.beats||[]).forEach(b=>{[b].concat(b.kids||[]).forEach(k=>{if(k&&k.go)(tour[k.go]=tour[k.go]||[]).push(d.id)})}));
 return SCREENS.map(s=>{const id=s[0],m=NAVX.map[id],d=D[id]||{};const fam=!!(R15.hidden[id]&&((R15.famOf||{})[id]||R15.alias[id]))||!!R15.alias[id];
  return{id,name:s[1],group:s[3]||'',file:d.f||'',menu:window.NAVX&&NAVX.taxo?['entry','role'].indexOf(NAVX.taxo.place(id).kind)>=0:!!(m&&m.g!=='r15hid'&&groups.has(m.g)), /* PH-14: a menu entry of the navigation taxonomy */family:fam,linksFrom:LB[id]||[],staticLinks:d.nv||0,staticFiles:d.nvF||[],mentions:d.in||0,tour:[...new Set(tour[id]||[])]}})},Object.fromEntries(Object.entries(linkBy).map(([k,v])=>[k,[...v]])));
await b.close();
rows.forEach(r=>{r.reach=[r.menu&&'menu',r.family&&'family',(r.linksFrom.length||r.staticLinks)&&'link',r.tour.length&&'tour'].filter(Boolean);r.unreachable=!r.reach.length});
const un=rows.filter(r=>r.unreachable);
console.log('reach screens',rows.length,'menu',rows.filter(r=>r.menu).length,'family',rows.filter(r=>r.family).length,'link',rows.filter(r=>r.reach.includes('link')).length,'tour',rows.filter(r=>r.tour.length).length,'unreachable',un.length+(un.length?': '+un.map(r=>r.id).join(', '):''),errs.length?'page errors '+errs.length:'');
console.log(JSON.stringify(un.map(r=>({id:r.id,why:'No menu entry, not a family view, no link from another screen or file, not in a Showroom tour ('+r.mentions+' other files mention the id as text)'}))));
if(write){const d=new Date().toISOString().slice(0,10);
 const md=`# Unreachable screens (CL-41)

Inventory for backlog item CL-41. Decision adopted 2026-10-19: unreachable screens are **hidden, never deleted**. A hidden screen keeps its id, its render function and every saved link: it still opens by URL (\`#<id>\`), from builder-mode search and from the Administration card "Hidden screens", where an administrator can unhide it. It carries no status or priority.

Generated by \`node tools/lint/reach.js build_out --write\` on ${d}. Every count is a **prototype fact** for the build it was run on.

## How reachability is computed

| Path | Counts when | Screens |
|---|---|---|
| Menu | the screen has an entry in a visible menu group (\`NAVX.map\`, full menu) | ${rows.filter(r=>r.menu).length} |
| Family | it is a view of a folded family (\`R15.hidden\` with a family or an alias), opened by the family's view switcher | ${rows.filter(r=>r.family).length} |
| Link | another screen links to it on its first view (\`data-go\`, \`data-nav\`, \`data-link="screen:id"\`), or another source file calls \`go("id")\` or renders \`data-go\` or \`data-nav\` for it (\`SCRMAP_DATA\` nv) | ${rows.filter(r=>r.reach.includes('link')).length} |
| Tour | a Showroom beat opens it (\`SHOW.demos\`, beat \`go\`) | ${rows.filter(r=>r.tour.length).length} |
| Search | the global search lists it; not enough on its own, because search lists every screen that is not hidden | not counted |

A screen with none of the first four paths is unreachable: ${un.length} of ${rows.length} registered screens.

## Unreachable screens (hidden from the menu and search)

| Screen id | Name | Defining file | Group | Other files that mention the id as text | Why it is unreachable |
|---|---|---|---|---|---|
${un.map(r=>`| \`${r.id}\` | ${r.name} | ${r.file||'core'} | ${r.group||'none'} | ${r.mentions} | no menu entry, not a family view, no link, not in a tour |`).join('\n')||'| none | | | | | |'}

The list is applied by \`src/mod_s_hide.js\` (\`HIDE.LIST\`) through the existing hide mechanism (\`R15.hidden\`, the \`r15hid\` menu group and \`SRCH.hiddenScreen\`). Unhiding a screen (Administration, "Hidden screens") is kept in this browser (\`U.store\` key \`falconaire-unhidden\`). A screen that later gets a menu entry or a link should be removed from \`HIDE.LIST\` when this inventory is regenerated.

## Screens reachable only through one path

${['menu','family','link','tour'].map(k=>`- Only ${k}: ${rows.filter(r=>r.reach.length===1&&r.reach[0]===k).length}`).join('\n')}
`;
 fs.writeFileSync(DOC,md);console.log('wrote',path.relative(ROOT,DOC))}
process.exit(0)})();
