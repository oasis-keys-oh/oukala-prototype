"""Build Oukala. Usage: python3 build.py [--only mod_a,mod_b] [--out DIR]
Core files are always included. Feature modules are mod_*.js and mod_*.css in this folder.
--only limits which modules are included (use this to test one module in isolation).
--out writes oukala.html (for publishing) and full.html (a complete page for local screenshots) to DIR."""
import sys,os,glob
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
html=f'<title>Oukala</title>\n{fonts}\n<style>\n{block()}\n'+"\n".join(css)+f'\n</style>\n<script>\n{js}\n</script>\n'
open(os.path.join(out,'oukala.html'),'w',encoding='utf-8').write(html)
open(os.path.join(out,'oukala-js.js'),'w',encoding='utf-8').write(js)
open(os.path.join(out,'full.html'),'w',encoding='utf-8').write('<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>:root{color-scheme:light}body{margin:0}</style></head><body>'+html+'</body></html>')
# split build: a small shell plus one external script, so browsers cache and reuse the compiled code
import hashlib
ver=hashlib.md5(js.encode('utf-8')).hexdigest()[:10]
shell=f'<title>Oukala</title>\n{fonts}\n<style>\n{block()}\n'+"\n".join(css)+f'\n</style>\n<script src="oukala-js.js?v={ver}"></script>\n'
open(os.path.join(out,'index.html'),'w',encoding='utf-8').write('<!doctype html><html lang="en"><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>:root{color-scheme:light}body{margin:0}</style></head><body>'+shell+'</body></html>')
import shutil
if os.path.isdir('assets/hero'): shutil.copytree('assets/hero',os.path.join(out,'hero'),dirs_exist_ok=True)
print(len(html),'bytes; modules:',mods)
