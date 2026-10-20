(async()=>{const o={};
const mm=MODMAP;o.keys=Object.keys(mm);
const mods=mm.modules;o.mods=(typeof mods==="function"?mods():mods).map(m=>m.id+"|"+m.band+"|"+m.name+"|"+m.own).slice(0,70);
o.bands=mm.bands&&(typeof mm.bands==="function"?mm.bands():mm.bands);
o.pl=Object.keys(PROCLIB);o.plist=PROCLIB.list().slice(0,2);
o.domains=Object.keys(PLAT.DOM||{});
return o})()
