const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_itom');const b=await chromium.launch();const errs=[];
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();p.on('pageerror',e=>{if(!/drawChat/.test(e.stack))errs.push('PE '+e.message)});p.on('console',m=>m.type()==='error'&&errs.push('C '+m.text().slice(0,200)));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
const W=ms=>p.waitForTimeout(ms);
const formOpen=async(scr,sel,id,tab)=>{await p.evaluate(([s,t])=>{closeDrawer();if(t!=null)S.v[t[0]]=t[1];go(s)},[scr,tab||null]);await W(300);const el=p.locator(sel+':visible').first();if(!await el.count()){console.log('MISSING',sel);return}await el.scrollIntoViewIfNeeded();await el.click();await W(300);const ok=await p.evaluate(i=>!!document.querySelector('[data-form="'+i+'"]'),id);console.log(id,ok?'open':'NOT OPEN');await p.screenshot({path:dir+'/shots/f_'+id+'.png'});await p.evaluate(()=>closeDrawer())};
await formOpen('itom_cmdb','[data-itom-a="newci"]','itom_ci');
await formOpen('itom_model','[data-itom-a="newclass"]','itom_cls');
await formOpen('itom_model','[data-itom-a="newattr"]','itom_attr');
await formOpen('itom_model','[data-itom-a="newrt"]','itom_rt',['itom_mdl',1]);
await formOpen('itom_model','[data-itom-a="newrule"]','itom_rrule',['itom_mdl',3]);
await formOpen('itom_disc','[data-itom-a="srcform"]','itom_src');
await formOpen('itom_disc','[data-itom-a="newmap"]','itom_map',['itom_ing',2]);
await formOpen('itom_disc','[data-itom-merge]','itom_merge',['itom_ing',3]);
await formOpen('itom_disc','[data-itom-idr="new"]','itom_idr',['itom_ing',3]);
await formOpen('itom_disc','[data-itom-a="csvup"]','itom_csv');
await formOpen('itom_health','[data-itom-a="newcamp"]','itom_camp');
await formOpen('itom_cmdb','[data-itom-savev]','itom_sv');
await formOpen('itom_fin','[data-itom-newalloc]','itom_alloc');
// CI drawer
await p.evaluate(()=>{go('itom_cmdb')});await W(300);await p.evaluate(()=>document.querySelector('[data-itom-open]')?0:0);
await p.evaluate(()=>{window.__o=1});
await p.evaluate(()=>{const b=document.querySelector('[data-itom-open]');if(b)b.click()});await W(200);
const hasDr=await p.evaluate(()=>!!document.querySelector('.drawer,#drawer'));console.log('drawer',hasDr);
// open ci via search link in attention? use evaluate on click delegate
await p.evaluate(()=>{const d=document.createElement('button');d.dataset.itomOpen='ci_x_db2';document.body.appendChild(d);d.click();d.remove()});await W(400);await p.screenshot({path:dir+'/shots/d_ci.png'});
for(const i of [1,2,3,4,5]){await p.evaluate(i=>{const r=[...document.querySelectorAll('input[name=itomci]')];if(r[i])r[i].click()},i);await W(150)}
await p.evaluate(()=>closeDrawer());
// retire what-if + impact
await p.evaluate(()=>{const d=document.createElement('button');d.dataset.itomA='retirewi';d.dataset.itomV='ci_x_db2';document.body.appendChild(d);d.click();d.remove()});await W(300);await p.screenshot({path:dir+'/shots/d_wi.png'});await p.evaluate(()=>closeDrawer());
// Orion ingest
await p.evaluate(()=>{S.v.itom_ing=1;go('itom_disc')});await W(300);
await p.locator('[data-itom-scn="switch"]').click();await W(200);await p.locator('[data-itom-a="ingest"]').click();await W(400);
console.log('svc avail change',await p.evaluate(()=>S.itom.ing.last&&S.itom.ing.last.sres.map(x=>x.s.n+' '+x.from+'->'+x.to)));
const tt=await p.locator('.itom-lr').first();await tt.scrollIntoViewIfNeeded();await p.screenshot({path:dir+'/shots/lab.png'});
// DND mapping drag
await p.evaluate(()=>{S.v.itom_ing=2;go('itom_disc');S.v.itom_ing=2;render()});await W(400);
const before=await p.evaluate(()=>S.itom.srcs.orion.map.length);
const it=p.locator('.itom-pool [data-dnd-id]').first(),slot=p.locator('.itom-sd.empty').first();
if(await it.count()&&await slot.count()){await it.scrollIntoViewIfNeeded();const a=await it.boundingBox();await slot.scrollIntoViewIfNeeded();const a2=await it.boundingBox().catch(()=>null);const s=await slot.boundingBox();const ib=await it.boundingBox();await p.mouse.move(ib.x+10,ib.y+8);await p.mouse.down();await p.mouse.move(s.x+20,s.y+10,{steps:10});await p.mouse.up();await W(300);console.log('map',before,'->',await p.evaluate(()=>S.itom.srcs.orion.map.length))}else console.log('no pool/slot',await it.count(),await slot.count());
await p.screenshot({path:dir+'/shots/map.png'});
// graph interactions
await p.evaluate(()=>{go('itom_graph')});await W(500);
for(const sel of ['[data-itom-gmode="causes"]','[data-itom-gmode="both"]','[data-itom-a="gfit"]','[data-itom-wpre="0"]','[data-itom-a="wshow"]']){await p.locator(sel).first().click();await W(250)}
await p.screenshot({path:dir+'/shots/g_walk.png'});
await p.evaluate(()=>{const i=document.querySelector('[data-itom-depth]');i.value=5;i.dispatchEvent(new Event('input',{bubbles:true}))});await W(300);
await p.fill('#itomPb','codif');await W(200);console.log('suggest',await p.evaluate(()=>document.querySelectorAll('#itomSgB .itom-sg').length));
await p.locator('#itomSgB .itom-sg').first().click();await p.locator('[data-itom-a="findpath"]').click();await W(400);await p.screenshot({path:dir+'/shots/g_path.png'});
// health drag
await p.evaluate(()=>{S.v.itom_hl=1;go('itom_health');S.v.itom_hl=1;render()});await W(300);
const tk=p.locator('.itom-tk').first(),col2=p.locator('.itom-kl[data-dnd="In progress"]');const tb=await tk.boundingBox(),cb=await col2.boundingBox();const st0=await p.evaluate(()=>S.itom.tasks.map(t=>t.st).join());await p.mouse.move(tb.x+20,tb.y+20);await p.mouse.down();await p.mouse.move(cb.x+30,cb.y+30,{steps:10});await p.mouse.up();await W(300);console.log('task',st0,'->',await p.evaluate(()=>S.itom.tasks.map(t=>t.st).join()));
await p.evaluate(()=>{S.v.itom_hl=2;render()});await W(300);
const ci=p.locator('.itom-it').first(),zone=p.locator('.itom-gzl').first();if(await ci.count()){const ib=await ci.boundingBox(),zb=await zone.boundingBox();const g0=await p.evaluate(()=>S.itom.noGrpN=0);await p.mouse.move(ib.x+20,ib.y+10);await p.mouse.down();await p.mouse.move(zb.x+30,zb.y+20,{steps:10});await p.mouse.up();await W(300);console.log('grpDone',await p.evaluate(()=>JSON.stringify(S.itom.grpDone)))}
// ASKX
console.log('askx',await p.evaluate(()=>{let r=0;ASKX.forEach(f=>{try{if(f("what depends on db-prod-02"))r++}catch(e){r='ERR '+e.message}});return r}));
console.log('ERR',errs);await b.close()})();
