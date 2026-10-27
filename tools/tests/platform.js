// Contract test for src/platform.js (docs/ARCHITECTURE.md): U, HOOKS, DATA, STEPMODE, TRIGGERS, CHATADDR, ownerChip.
// Usage: node tools/tests/platform.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});const p=await (await b.newContext()).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const f=[];const ok=(c,m)=>{if(!c)f.push(m)};
 ok(U.slug("Hello, World")==="hello-world","U.slug");ok(U.money(1234.4)==="$1,234","U.money");ok(U.clamp(5,0,3)===3,"U.clamp");ok(U.esc("<a>")==="&lt;a&gt;","U.esc");
 const seen=[];const off=HOOKS.on("beforeGo",s=>seen.push("b:"+s),{id:"t"});HOOKS.on("afterRender",s=>seen.push("r:"+s),{id:"t2"});HOOKS.on("beforeRender",s=>seen.push("p:"+s),{id:"t3"});go("home");off();go("home");
 ok(seen.filter(x=>x==="b:home").length===1,"HOOKS beforeGo once then off");ok(seen.includes("r:home"),"HOOKS afterRender");ok(seen.includes("p:home"),"HOOKS beforeRender");let au=null;HOOKS.on("audit",e=>au=e,{id:"t4"});audit("test action","x");ok(au&&au.a==="test action","HOOKS audit");
 DATA.define("t_rec",{core:()=>[{id:"A",n:"Atlantic Systems row"}]});ok(DATA.get("t_rec").length===1,"DATA core");
 let ch=0;DATA.on("change",()=>ch++);const prev=DATA.tenant();DATA.setTenant("zz_test");ok(DATA.get("t_rec").length===0,"DATA no leakage");ok(DATA.gaps().includes("zz_test:t_rec"),"DATA gap recorded");
 DATA.pack("zz_test",{t_rec:[{id:"B"}]});ok(DATA.byId("t_rec","B")&&DATA.byId("t_rec","B").id==="B","DATA pack");DATA.setTenant(prev);ok(ch===2,"DATA change events");
 if(window.SCN){SCN.set("health");ok(DATA.tenant()==="health","SCN drives DATA");SCN.set("core");ok(DATA.tenant()==="core","SCN back to core")}
 /* tenancy extensions of DATA (tenancy stream): registry, guard, screen registry, pack validation */
 DATA.addTenant("zz_reg",{org:"Test Org"});ok(DATA.tenants().some(t=>t.id==="zz_reg")&&DATA.tenantInfo("zz_reg").org==="Test Org","DATA tenant registry");DATA.guard(id=>id!=="zz_reg");ok(DATA.setTenant("zz_reg")===false&&DATA.tenant()===prev,"DATA guard refuses");
 DATA.guard(null);ok(DATA.allowed("zz_reg"),"DATA guard cleared");if(window.IDENT)DATA.guard(id=>!DATA.tenantInfo(id)||IDENT.member(id));
 DATA.screen("zz_scr",{mode:"data",entities:["t_rec"]});ok(DATA.screenMode("zz_scr")==="data"&&DATA.screenMode("home")==="core"&&DATA.screens().length>=SCREENS.length,"DATA screen registry");
 ok(DATA.validate("zz_test").ok&&!DATA.validate("zz_none").ok,"DATA.validate");ok(DATA.snapshot("core").t_rec.ids[0]==="A","DATA.snapshot");
 DATA.addTenant("zz_rm",{org:"Test org"});DATA.pack("zz_rm",{t_rec:[{id:"Z"}]});ok(DATA.removeTenant("zz_rm")&&!DATA.tenantInfo("zz_rm")&&!DATA.removeTenant("core"),"DATA.removeTenant");
 ok(STEPMODE.of("fn")==="robot"&&STEPMODE.of("auto")==="robot"&&STEPMODE.label("ai")==="Agent","STEPMODE aliases");ok(!/Automatic|Function/.test(STEPMODE.pill("auto")),"STEPMODE never shows retired words");
 ok(TRIGGERS.list().length===5&&TRIGGERS.get("metric"),"TRIGGERS catalog");
 const a=CHATADDR.parse("record:project:PR1");ok(a&&a.recType==="project"&&a.id==="PR1","CHATADDR parse");
 ok(window.BRAND&&BRAND.name==="Falconaire","BRAND.name");
 ok(/data-owner="/.test(ownerChip("Casey Rowan",{record:"project:PR1"})),"ownerChip markup");return f});
console.log('platform contract',r.length?'FAIL '+r.join('; '):'ok');await b.close();process.exit(r.length?1:0)})();
