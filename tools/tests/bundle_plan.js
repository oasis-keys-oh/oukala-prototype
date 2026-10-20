// CL-15 bundle plan: where the first-paint bundle may end (FIRST_UNTIL in src/build.py). A tool, not part of npm test.
// Usage: node tools/tests/bundle_plan.js [build_out] [--write] [--verbose]
//   build_out must hold full.html (python3 src/build.py --full --out build_out).
//   Without --write: exits 1 when FIRST_UNTIL in src/build.py ends the first bundle before a module the wedge needs.
//   With --write: sets FIRST_UNTIL to the plan (then rebuild). FIRST_UNTIL=None (one script) always passes.
// Two plans are printed (docs/bundle.md):
//   order-safe (what --write uses): the first bundle is a prefix of modules.json, so modules keep their order. It ends at the
//     last module that registers or wraps a wedge screen (the Showroom COO cut, plus home and showroom), extended to any later
//     module that declares a function an earlier file calls while loading, or that stops other click handlers.
//   wedge-only (report only): the wedge modules closed over load-time dependencies, with the rest loaded later out of order.
//     A module M outside joins when a module W inside comes later in modules.json and
//       A  W's source names a global M creates (window property, top-level declaration), or
//       B  M and W both replace the same window property or the same screen renderer (wrap order), or
//       F  M and W register the same lifecycle hook name with the same order (hook order), or
//       G  M reads, while it loads, a global that W creates, or
//       H  one adds a key to a shared object (X.k) that the other reads while it loads, or
//       R  one appends to or changes a shared array that the other reads or changes (SCREENS, SEARCHX and ASKX are exempt:
//          the runtime replays their push and unshift calls in module order);
//     plus any module that calls stopImmediatePropagation in a document or window listener (listener order).
//     Even closed this way, the wedge-only plan changes what 81 screens show (measured 2026-10-20): modules also cache derived
//     state while they load and right after the boot, which no static rule sees. So it is not used.
// The probe loads full.html with an init script that snapshots window, _R, shared objects and arrays at each BUNDLE._mod(i).
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),SRC=path.join(ROOT,'src');
const {babelParse,traverse}=require(path.join(path.dirname(require.resolve('playwright')),'lib/transform/babelBundleImpl.js'));const walk=traverse.default||traverse;  // Playwright ships Babel: no extra dependency
const rd=f=>fs.readFileSync(path.join(SRC,f),'utf8');

function probeInit(lex){const L={},ev=[],hk=[];let cur=null,W0=null,R0=null,K0=null,A0=null;
 const LX=lex.map(n=>[n,new Function('try{return '+n+'}catch(e){return undefined}')]);
 const isObj=v=>v!=null&&(typeof v==='function'||(typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)));
 const snapA=W=>{const m=new Map();for(const [k,v] of W)if(Array.isArray(v))m.set(k,v);for(const [n,f] of LX)if(!m.has(n)){const v=f();if(Array.isArray(v))m.set(n,v)}const o=new Map();for(const [k,v] of m)o.set(k,[v,v.length<50000?v.slice():null]);return o};
 const snapK=W=>{const m=new Map();const add=(n,v)=>{if(isObj(v)&&n!=='window'&&n!=='self'&&n!=='globalThis'&&n!=='frames'&&n!=='parent'&&n!=='top'){try{m.set(n,new Set(Object.keys(v)))}catch(e){}}};for(const [k,v] of W)add(k,v);for(const [n,f] of LX)if(!m.has(n))add(n,f());return m};
 const snapW=()=>{const m=new Map();for(const k of Object.getOwnPropertyNames(window)){let v;try{v=window[k]}catch(e){continue}m.set(k,v)}return m};
 const snapR=()=>{try{return new Map(Object.entries(_R))}catch(e){return new Map()}};
 const close=()=>{if(cur==null)return;const W1=snapW(),R1=snapR(),K1=snapK(W1),A1=snapA(W1),w=[],nw=[],r=[],ks=[],ap=[],mu=[];
  for(const [n,[v,c1]] of A1){const o=A0.get(n);if(!o||o[0]!==v||!o[1]||!c1)continue;const c0=o[1];
   const prefix=c0.every((x,i)=>Object.is(x,c1[i]));if(prefix&&c1.length>c0.length)ap.push(n);else if(!prefix||c1.length!==c0.length)mu.push(n)}
  for(const [n,s1] of K1){const s0=K0.get(n);if(!s0)continue;for(const k of s1)if(!s0.has(k))ks.push([n,k])}
  for(const [k,v] of W1){if(!W0.has(k)||!Object.is(W0.get(k),v)){w.push(k);if(!W0.has(k))nw.push(k)}}for(const [k,v] of R1){if(!R0.has(k)||R0.get(k)!==v)r.push(k)}L[cur]={w,nw,r,ks,ap,mu};cur=null};
 const open=i=>{close();cur=i;W0=snapW();R0=snapR();K0=snapK(W0);A0=snapA(W0);
  if(window.HOOKS&&!HOOKS.__probe){const on=HOOKS.on;HOOKS.on=function(n,f,o){hk.push([cur,n,(o&&o.order)||0]);return on.apply(this,arguments)};HOOKS.__probe=1}};
 const oa=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(t,f,o){if(cur!=null&&(this===document||this===window))ev.push([cur,t]);return oa.call(this,t,f,o)};
 const B={};let mod=null,shell=null;
 Object.defineProperty(B,'_mod',{configurable:true,get(){return i=>{open(i);mod&&mod(i)}},set(f){mod=f}});
 Object.defineProperty(B,'_shell',{configurable:true,get(){return()=>{close();shell&&shell()}},set(f){shell=f}});
 window.BUNDLE=B;window.__PROBE=()=>({L,ev,hk})}

async function probe(dir,lex){const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});const p=await b.newPage();
 await p.route(/^https?:/,r=>r.abort());await p.addInitScript(probeInit,lex);
 await p.goto('file://'+path.join(dir,'full.html'),{waitUntil:'load',timeout:120000});await p.waitForFunction(()=>window.BUNDLE&&BUNDLE.ready,null,{timeout:120000});
 const d=await p.evaluate(()=>{const x=__PROBE();const coo=(window.SHOW&&SHOW.demos||[]).find(t=>t.id==='coo');x.wedge=[...new Set(['home','showroom'].concat(coo?coo.beats.map(b=>b.go):[]))];x.coo=!!coo;return x});
 await b.close();return d}

const REG=new Set(['SCREENS','SEARCHX','ASKX']);  // the runtime replays push and unshift on these in full.html order at app:ready (src/assets/runtime/bundle.js)
const CORE=["platform.js","data.js","data2.js","ui.js","kit.js","kit2.js","screens1.js","screens2.js","screens4.js"];
function staticInfo(f){const s=rd(f),m=f;const top=[],fns=[],load=new Set();let ast;
 try{ast=babelParse(s,f,false)}catch(e){throw new Error('bundle_plan: cannot parse '+f+': '+e.message)}
 for(const n of ast.program.body){
  if((n.type==='FunctionDeclaration'||n.type==='ClassDeclaration')&&n.id){top.push(n.id.name);if(n.type==='FunctionDeclaration')fns.push(n.id.name)}
  else if(n.type==='VariableDeclaration')for(const dc of n.declarations){const w=q=>{if(!q)return;if(q.type==='Identifier')top.push(q.name);else if(q.type==='ObjectPattern')q.properties.forEach(x=>w(x.value||x.argument));else if(q.type==='ArrayPattern')q.elements.forEach(w);else if(q.type==='AssignmentPattern')w(q.left);else if(q.type==='RestElement')w(q.argument)};w(dc.id)}}
 // names referenced while the module loads: not inside a function, unless that function is called on the spot (an IIFE)
 const atLoad=pp=>{let q=pp;while(q){if(q.isFunction()){const par=q.parentPath;const iife=par&&((par.isCallExpression()&&par.node.callee===q.node)||(par.isMemberExpression()&&par.parentPath&&par.parentPath.isCallExpression()));if(!iife)return false}q=q.parentPath}return true};
 // X.k read or written while the module loads, through the global X or a local alias of it (const R=window.X)
 const alias={},mem=new Set(),reads=new Set();const gname=n=>n&&(n.type==='Identifier'?n.name:(n.type==='MemberExpression'&&!n.computed&&n.object.type==='Identifier'&&/^(window|W|self|globalThis)$/.test(n.object.name)?n.property.name:null));
 const glob=(pp,n)=>{const b=pp.scope.getBinding(n);return !b||b.scope.block.type==='Program'||!!alias[n]};
 walk(ast,{Identifier(pp){if(atLoad(pp)&&glob(pp,pp.node.name))load.add(pp.node.name)},VariableDeclarator(pp){const n=pp.node;if(n.id.type==='Identifier'){const g=gname(n.init&&n.init.type==='LogicalExpression'?n.init.left:n.init);if(g&&(g!==n.id.name||pp.scope.block.type!=="Program"))alias[n.id.name]=g}},
  MemberExpression(pp){const n=pp.node;if(n.computed||n.object.type!=='Identifier'||n.property.type!=='Identifier'||!atLoad(pp)||!glob(pp,n.object.name))return;mem.add('#'+n.object.name+'.'+n.property.name)}});
 walk(ast,{'Identifier|MemberExpression'(pp){if(!atLoad(pp))return;const g=pp.isIdentifier()?pp.node.name:gname(pp.node);if(!g||(pp.isIdentifier()&&!glob(pp,g)))return;if(pp.isIdentifier()&&pp.parentPath.isMemberExpression()&&pp.parentPath.node.property===pp.node&&!pp.parentPath.node.computed)return;
   const par=pp.parentPath;if(par.isMemberExpression()&&par.node.object===pp.node&&!par.node.computed&&/^(push|unshift)$/.test(par.node.property.name))return;
   // existence checks (typeof X, if(window.X), X&&...) do not read the contents
   if(par.isUnaryExpression()&&(par.node.operator==='typeof'||par.node.operator==='!'))return;if((par.isIfStatement()||par.isConditionalExpression())&&par.node.test===pp.node)return;if(par.isLogicalExpression()&&par.node.left===pp.node)return;
   if(par.isVariableDeclarator()&&par.node.init===pp.node)return;  // an alias; its own uses are counted through alias[]
   reads.add(alias[g]||g)}});
 const mems=new Set([...mem].map(x=>{const [o,k]=x.slice(1).split('.');return (alias[o]||o)+'.'+k}));
 return {top,fns,load,mems,reads,ids:new Set(s.match(/[A-Za-z_$][\w$]*/g)||[]),sip:/stopImmediatePropagation/.test(s)}}

async function plan(dir){const all=JSON.parse(rd('modules.json')).modules;const mods=all.filter(m=>fs.existsSync(path.join(SRC,m+'.js')));
 const idx=Object.fromEntries(all.map((m,i)=>[m,i]));const st={};for(const m of mods)st[m]=staticInfo(m+'.js');
 const lex=[...new Set([...CORE.flatMap(f=>staticInfo(f).top),...mods.flatMap(m=>st[m].top)])];const d=await probe(dir,lex);if(!d.coo)throw new Error('bundle_plan: SHOW.demos has no "coo" tour');
 const L=m=>d.L[idx[m]]||{w:[],nw:[],r:[],ks:[],ap:[],mu:[]};
 const prod={};for(const m of mods)prod[m]=new Set([...L(m).nw,...st[m].top]);
 const P=new Set(),why={};
 for(const m of mods){if(L(m).r.some(k=>d.wedge.includes(k))){P.add(m);why[m]='wedge screen '+L(m).r.filter(k=>d.wedge.includes(k)).join(' ')}
  else if(st[m].sip&&d.ev.some(e=>e[0]===idx[m])){P.add(m);why[m]='stopImmediatePropagation listener'}}
 let grew=true;while(grew){grew=false;
  for(const M of mods){if(P.has(M))continue;
   for(const W of mods){if(!P.has(W)||idx[W]<idx[M])continue;
    const a=[...prod[M]].find(n=>st[W].ids.has(n));
    const bw=L(M).w.find(k=>L(W).w.includes(k)),br=L(M).r.find(k=>L(W).r.includes(k));
    const f=d.hk.find(h=>h[0]===idx[M]&&d.hk.some(g=>g[0]===idx[W]&&g[1]===h[1]&&g[2]===h[2]));
    const g=[...prod[W]].find(n=>st[M].load.has(n));
    const h=L(M).ks.find(([x,k])=>st[W].mems.has(x+'.'+k)),h2=L(W).ks.find(([x,k])=>st[M].mems.has(x+'.'+k));
    const ar=L(M).ap.find(x=>st[W].reads.has(x)),ar2=L(W).ap.find(x=>st[M].reads.has(x)&&!REG.has(x));
    // an array changed in place (not only appended to) by one and touched by the other: keep their order
    const touch=(m,x)=>L(m).ap.includes(x)||L(m).mu.includes(x)||st[m].reads.has(x);
    const mu=L(M).mu.find(x=>!REG.has(x)&&touch(W,x)),mu2=L(W).mu.find(x=>!REG.has(x)&&touch(M,x));
    if(a||bw||br||f||g||h||h2||ar||ar2||mu||mu2){P.add(M);why[M]=W+(a?' names '+a:bw?' also replaces '+bw:br?' also wraps screen '+br:f?' same hook '+f[1]:g?' read at load: '+g:h?' reads at load '+h.join('.')+' that it adds':h2?' adds '+h2.join('.')+' that it reads at load':ar?' reads array '+ar+' at load that it appends to':ar2?' appends to array '+ar2+' that it reads at load':mu?' touches array '+mu+' that it changes in place':' changes array '+mu2+' in place that it touches');grew=true;break}}}}
 const wedgeOnly=mods.filter(m=>P.has(m));
 // order-safe plan (what the build uses): the first bundle is a prefix of modules.json, so no module runs out of order.
 // It ends at the last module the wedge needs; a later module joins when it declares a function that an earlier file calls
 // while loading (hoisting hides that in full.html) or when it stops other click handlers (listener order).
 let k=Math.max(...wedgeOnly.map(m=>idx[m]).filter(i=>P.has(all[i])&&/^wedge screen/.test(why[all[i]]||'')));const kwhy={};kwhy[all[k]]='last wedge module';
 const early=[...CORE,'screens3.js'].map(f=>staticInfo(f));
 let grew2=true;while(grew2){grew2=false;for(const M of mods){if(idx[M]<=k)continue;
   const fns=st[M].fns;const user=fns.find(n=>early.some(x=>x.load.has(n))||mods.some(W=>idx[W]<=k&&st[W].load.has(n)));
   const sip=st[M].sip&&d.ev.some(e=>e[0]===idx[M]);
   if(user||sip){k=idx[M];kwhy[M]=user?'declares '+user+', called while an earlier file loads':'stopImmediatePropagation listener';grew2=true}}}
 const first=mods.filter(m=>idx[m]<=k);return {first,last:all[k],kwhy,wedgeOnly,why,wedge:d.wedge,mods,idx}}

module.exports={plan};
if(require.main===module)(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a.find(x=>!x.startsWith('--'))||path.join(ROOT,'build_out'));
 const r=await plan(dir);const sz=m=>fs.statSync(path.join(SRC,m+'.js')).size;const tot=r.mods.reduce((s,m)=>s+sz(m),0),B=l=>l.reduce((s,m)=>s+sz(m),0).toLocaleString('en-US');
 console.log('wedge screens:',r.wedge.join(' '));
 console.log('order-safe plan (used): first bundle = modules.json up to '+r.last+': '+r.first.length+' of '+r.mods.length+' JS modules, '+B(r.first)+' of '+tot.toLocaleString('en-US')+' bytes of module source');
 Object.entries(r.kwhy).forEach(([m,w])=>console.log('  ends at or after '+m+': '+w));
 console.log('wedge-only plan (not used, docs/bundle.md): '+r.wedgeOnly.length+' modules, '+B(r.wedgeOnly)+' bytes; it runs the other modules out of order');
 if(a.includes('--verbose'))r.wedgeOnly.forEach(m=>console.log('  '+m+'  <- '+r.why[m]));
 const bp=path.join(SRC,'build.py');let py=fs.readFileSync(bp,'utf8');const re=/(# BEGIN FIRST[^\n]*\n)([\s\S]*?)(# END FIRST)/;
 if(a.includes('--write')){py=py.replace(re,(_,x,__,z)=>x+'FIRST_UNTIL="'+r.last+'"\n'+z);fs.writeFileSync(bp,py);console.log('wrote FIRST_UNTIL="'+r.last+'" to src/build.py; rebuild to apply');return}
 const m=py.match(re);const cur=((m?m[2]:'').match(/FIRST_UNTIL="([\w]+)"/)||[])[1];
 if(/FIRST_UNTIL=None/.test(m?m[2]:'')){console.log('bundle plan: FIRST_UNTIL=None (one script) covers the wedge');return}
 if(!cur||!(cur in r.idx)){console.log('FAIL: src/build.py has no FIRST_UNTIL naming a module in modules.json');process.exit(1)}
 if(r.idx[cur]<r.idx[r.last]){console.log('FAIL: FIRST_UNTIL="'+cur+'" in src/build.py ends the first bundle before '+r.last+', which it needs ('+(r.kwhy[r.last]||'')+')');console.log('fix: node tools/tests/bundle_plan.js build_out --write, then rebuild');process.exit(1)}
 console.log('bundle plan: FIRST_UNTIL="'+cur+'" covers the wedge'+(cur!==r.last?' (the plan would end at '+r.last+')':''))})().catch(e=>{console.error(e);process.exit(1)});
