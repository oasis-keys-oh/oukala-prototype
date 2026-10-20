"""Build Oukala. Usage: python3 build.py [--only mod_a,mod_b] [--out DIR]
Core files are always included. Feature modules are mod_*.js and mod_*.css in this folder.
--only limits which modules are included (use this to test one module in isolation).
--out writes oukala.html (for publishing) and full.html (a complete page for local screenshots) to DIR."""
import sys,os,glob,json,base64
here=os.path.dirname(os.path.abspath(__file__));os.chdir(here);sys.path.insert(0,here)
from tokens import block
a=sys.argv[1:];only=None;out='.'
if '--only' in a: only=set(x.strip() for x in a[a.index('--only')+1].split(',') if x.strip())
if '--out' in a: out=a[a.index('--out')+1]
os.makedirs(out,exist_ok=True)
r=lambda f:open(f,encoding='utf-8').read()
mods=sorted(set(os.path.splitext(f)[0] for f in glob.glob('mod_*.js')+glob.glob('mod_*.css')))
if only is not None: mods=[m for m in mods if m in only or m.replace('mod_','') in only]
fonts='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap" media="print" onload="this.media=\'all\'"><noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap"></noscript>'
core=["data.js","data2.js","ui.js","kit.js","kit2.js","screens1.js","screens2.js","screens4.js"]
js=[r(f) for f in core]
for m in mods:
    if os.path.exists(m+'.js'): js.append('/* ===== '+m+' ===== */\n(function(){try{\n'+r(m+'.js')+'\n}catch(e){console.error("module '+m+' failed",e)}})();' if False else '/* ===== '+m+' ===== */\n'+r(m+'.js'))
js.append(r("screens3.js"))
css=[r("style.css"),r("style2.css"),r("style3.css"),r("style4.css"),r("style5.css"),r("style6.css"),r("style7.css")]+([r("style8.css")] if os.path.exists("style8.css") else [])+[r(m+'.css') for m in mods if os.path.exists(m+'.css')]
js="\n".join(js)
BR=json.load(open('brand.json'));NAME=BR['name'];OLD=BR['replace']
js=js.replace(OLD,NAME);css=[c.replace(OLD,NAME) for c in css]
MK=BR.get('mark','')
if MK and MK.lower() in NAME.lower():
    _i=NAME.lower().index(MK.lower());WM=NAME[:_i]+'<i class="wm-ai">'+NAME[_i:_i+len(MK)]+'</i>'+NAME[_i+len(MK):]
    js=js.replace('<b>'+NAME+'</b><small>','<b class="wm">'+WM+'</b><small>')
FAV_ICO='<link rel="icon" type="image/x-icon" sizes="16x16 32x32 48x48" href="data:image/x-icon;base64,'+base64.b64encode(open('assets/brand/favicon.ico','rb').read()).decode()+'">'
FAV='<link rel="icon" type="image/png" href="data:image/png;base64,'+base64.b64encode(open('assets/brand/favicon.png','rb').read()).decode()+'"><link rel="apple-touch-icon" href="data:image/png;base64,'+base64.b64encode(open('assets/brand/apple-touch-icon.png','rb').read()).decode()+'">'+FAV_ICO
BOOTLOGO='<img alt="" width=56 height=56 style="display:block;margin:0 auto 10px;border-radius:14px" src="data:image/webp;base64,'+base64.b64encode(open('assets/brand/logo.webp','rb').read()).decode()+'">'
html=f'<title>{NAME}</title>{FAV}\n{fonts}\n<style>\n{block()}\n'+"\n".join(css)+f'\n</style>\n<script>\n{js}\n</script>\n'
open(os.path.join(out,'oukala.html'),'w',encoding='utf-8').write(html)
open(os.path.join(out,'oukala-js.js'),'w',encoding='utf-8').write(js)
open(os.path.join(out,'full.html'),'w',encoding='utf-8').write('<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>:root{color-scheme:light}body{margin:0}</style></head><body>'+html+'</body></html>')
# split build: a small shell plus one external script, so browsers cache and reuse the compiled code
import hashlib
ver=hashlib.md5(js.encode('utf-8')).hexdigest()[:10]
shell=f'<title>{NAME}</title>{FAV}\n{fonts}\n<style>\n{block()}\n'+"\n".join(css)+f'\n</style>\n<script src="oukala-js.js?v={ver}"></script>\n'
open(os.path.join(out,'index.html'),'w',encoding='utf-8').write('<!doctype html><html lang="en"><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel="preload" as="script" href="oukala-js.js?v='+ver+'"><link rel="preload" as="image" href="hero/server-hall.webp?v=21b" fetchpriority="high"><style>:root{color-scheme:light}body{margin:0}#oukBoot{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#FBFBF9 url(hero/server-hall.webp?v=21b) center/cover;font:500 15px system-ui,sans-serif;color:#16262B}#oukBoot>div{background:rgba(255,255,255,.88);padding:22px 30px;border-radius:18px;text-align:center;box-shadow:0 10px 40px rgba(20,60,76,.18)}#oukBoot b{display:block;font:600 26px Georgia,serif;margin-bottom:6px}#oukBoot i{display:block;height:4px;width:180px;margin:12px auto 0;border-radius:2px;background:linear-gradient(90deg,#0C6074 30%,#cfe3e8 30%);background-size:200% 100%;animation:oukb 1.2s linear infinite}@keyframes oukb{to{background-position:-200% 0}}</style></head><body><div id="oukBoot" role="status" aria-live="polite"><div>'+BOOTLOGO+'<b>'+NAME+'</b>Loading your workspace<i></i></div></div>'+shell+'</body></html>')
import shutil
if os.path.isdir('assets/hero'): shutil.copytree('assets/hero',os.path.join(out,'hero'),dirs_exist_ok=True)
if os.path.isdir('assets/journey'): shutil.copytree('assets/journey',os.path.join(out,'journey'),dirs_exist_ok=True)
print(len(html),'bytes; modules:',mods)
